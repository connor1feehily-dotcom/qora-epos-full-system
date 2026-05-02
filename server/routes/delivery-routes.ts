import type { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import OpenAI from "openai";

interface ScannedProduct {
  id?: number;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  matched: boolean;
  confidence: number;
  originalText: string;
}

interface DeliveryDocket {
  id: string;
  supplierName: string;
  deliveryDate: string;
  invoiceNumber: string;
  products: ScannedProduct[];
  totalAmount: number;
  status: 'scanned' | 'processing' | 'matched' | 'imported';
}

const scanDocketSchema = z.object({
  imageData: z.string(),
  existingProducts: z.array(z.any()).optional(),
});

const importDeliverySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
  deliveryDate: z.string(),
  invoiceNumber: z.string(),
  products: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
    barcode: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
    matched: z.boolean(),
    confidence: z.number(),
    originalText: z.string(),
  })),
  totalAmount: z.number(),
  status: z.enum(['scanned', 'processing', 'matched', 'imported']),
});

// ── Real AI parsing of delivery dockets ──────────────────────────────────────
//
// Uses OpenAI's vision-capable model (gpt-4o-mini) to read a photo of a
// supplier delivery docket and return structured line-items. We then fuzzy-
// match each extracted product against the shop's existing inventory so the
// shopkeeper can confirm before any stock change is committed.
//
// Failures are explicit — we never silently fall back to mock data. If the
// API key is missing or the model can't read the docket, the endpoint returns
// an error and the UI tells the user to retry or enter manually.

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Cannot scan dockets.');
  }
  return new OpenAI({ apiKey });
}

const DOCKET_PROMPT = `You are reading a photograph of a supplier delivery docket / invoice for a small Irish convenience shop.

Extract the following as strict JSON. Use null when a field genuinely cannot be read. Quantities and prices must be numbers (not strings). Prices are in Euros.

{
  "supplierName": string | null,        // e.g. "Musgrave", "BWG Foods", "Coca Cola HBC"
  "invoiceNumber": string | null,       // the invoice / docket number printed on the page
  "deliveryDate": string | null,        // ISO date "YYYY-MM-DD" if visible
  "totalAmount": number | null,         // grand total in euros if printed
  "products": [
    {
      "name": string,                   // product description as printed (e.g. "Coca Cola 500ml 24pk")
      "barcode": string | null,         // EAN/barcode if printed (digits only)
      "quantity": number,               // case/pack count delivered
      "unitPrice": number | null        // unit cost ex-VAT in euros (per case OR per single unit, whichever the docket shows)
    }
  ]
}

Rules:
- Only include real product line items. Skip subtotals, VAT lines, delivery charges, headers.
- Be conservative: if a quantity or price is illegible, set it to null rather than guessing.
- If the image is not a delivery docket at all, return {"supplierName": null, "invoiceNumber": null, "deliveryDate": null, "totalAmount": null, "products": []}.

Return ONLY the JSON object, no surrounding prose.`;

interface ParsedAIResult {
  supplierName: string | null;
  invoiceNumber: string | null;
  deliveryDate: string | null;
  totalAmount: number | null;
  products: Array<{
    name: string;
    barcode: string | null;
    quantity: number;
    unitPrice: number | null;
  }>;
}

async function callOpenAIVision(imageData: string): Promise<ParsedAIResult> {
  const client = getOpenAIClient();

  // The frontend sends a data URL ("data:image/jpeg;base64,..."). OpenAI's
  // image_url accepts that directly.
  const imageUrl = imageData.startsWith('data:')
    ? imageData
    : `data:image/jpeg;base64,${imageData}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: DOCKET_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('AI returned no content. Try a clearer photo.');
  }

  let parsed: ParsedAIResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI returned malformed JSON. Try a clearer photo.');
  }

  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error('AI could not read any products from the docket.');
  }

  return parsed;
}

// Fuzzy match a parsed name/barcode against the shop's existing inventory.
// Returns the matched product (with confidence 0..1) or null.
function fuzzyMatch(
  parsedName: string,
  parsedBarcode: string | null,
  existing: any[],
): { product: any; confidence: number } | null {
  if (!existing || existing.length === 0) return null;

  // 1. Exact barcode match wins outright.
  if (parsedBarcode) {
    const exact = existing.find((p) => p.barcode && p.barcode === parsedBarcode);
    if (exact) return { product: exact, confidence: 0.99 };
  }

  // 2. Token-overlap score on names.
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parsedTokens = new Set(norm(parsedName).split(' ').filter((t) => t.length > 1));
  if (parsedTokens.size === 0) return null;

  let best: { product: any; confidence: number } | null = null;
  for (const p of existing) {
    if (!p?.name) continue;
    const productTokens = new Set(norm(p.name).split(' ').filter((t) => t.length > 1));
    let overlap = 0;
    for (const t of parsedTokens) {
      if (productTokens.has(t)) overlap++;
    }
    const denom = Math.max(parsedTokens.size, productTokens.size);
    const score = denom === 0 ? 0 : overlap / denom;
    if (score >= 0.5 && (!best || score > best.confidence)) {
      best = { product: p, confidence: score };
    }
  }
  return best;
}

function buildDocketFromAI(ai: ParsedAIResult, existing: any[]): DeliveryDocket {
  const products: ScannedProduct[] = ai.products.map((p) => {
    const qty = Math.max(1, Math.floor(p.quantity || 1));
    const unitPrice = typeof p.unitPrice === 'number' && p.unitPrice >= 0 ? p.unitPrice : 0;
    const match = fuzzyMatch(p.name, p.barcode, existing);

    return {
      id: match?.product?.id,
      name: match?.product?.name || p.name,
      barcode: p.barcode || match?.product?.barcode || undefined,
      quantity: qty,
      unitPrice,
      total: Number((qty * unitPrice).toFixed(2)),
      matched: !!match,
      confidence: match ? Number(match.confidence.toFixed(2)) : 0,
      originalText: `${p.name}${p.barcode ? ' [' + p.barcode + ']' : ''} x${qty}${unitPrice ? ' €' + unitPrice : ''}`,
    };
  });

  const computedTotal = Number(products.reduce((sum, p) => sum + p.total, 0).toFixed(2));

  return {
    id: `docket-${Date.now()}`,
    supplierName: ai.supplierName || 'Unknown supplier',
    deliveryDate: ai.deliveryDate || new Date().toISOString().split('T')[0],
    invoiceNumber: ai.invoiceNumber || `MANUAL-${Date.now()}`,
    products,
    totalAmount: ai.totalAmount && ai.totalAmount > 0 ? ai.totalAmount : computedTotal,
    status: 'matched',
  };
}

export async function scanDocket(req: Request, res: Response) {
  try {
    const { imageData, existingProducts } = scanDocketSchema.parse(req.body);

    if (!imageData || imageData.length < 100) {
      return res.status(400).json({ error: 'No image received. Please try again.' });
    }

    let aiResult: ParsedAIResult;
    try {
      aiResult = await callOpenAIVision(imageData);
    } catch (aiError: any) {
      console.error('AI docket parsing failed:', aiError?.message || aiError);
      return res.status(502).json({
        error: 'Could not read the docket',
        message: aiError?.message || 'The AI could not read the photo. Try a clearer image, or enter the products manually.',
      });
    }

    if (aiResult.products.length === 0) {
      return res.status(422).json({
        error: 'No products found',
        message: 'The image was read but no product lines were found. If this is a delivery docket, try a clearer photo. Otherwise enter the products manually.',
      });
    }

    const docket = buildDocketFromAI(aiResult, existingProducts || []);
    return res.json(docket);
  } catch (error: any) {
    console.error('Docket scanning error:', error);
    return res.status(400).json({
      error: 'Failed to process docket',
      message: error?.message || 'Unknown error',
    });
  }
}

export async function importDelivery(req: Request, res: Response) {
  try {
    const deliveryData = importDeliverySchema.parse(req.body);

    const importResults: Array<{ product: string; action: string; success: boolean; id?: number; error?: string }> = [];

    for (const product of deliveryData.products) {
      try {
        let productRecord;

        if (product.matched && product.id) {
          const existingProduct = await storage.getProduct(product.id);
          if (existingProduct) {
            const newStock = existingProduct.stock + product.quantity;
            productRecord = await storage.updateProduct(product.id, {
              stock: newStock,
              costPrice: product.unitPrice.toString(),
            });

            await storage.createAuditLog({
              userId: 1,
              tableName: 'products',
              recordId: product.id.toString(),
              action: 'UPDATE',
              changes: JSON.stringify({
                stock: { from: existingProduct.stock, to: newStock },
                reason: `Delivery import: ${deliveryData.invoiceNumber}`,
              }),
            });
          }
        } else {
          productRecord = await storage.createProduct({
            name: product.name,
            barcode: product.barcode || '',
            price: (product.unitPrice * 1.2).toString(),
            costPrice: product.unitPrice.toString(),
            stock: product.quantity,
            category: 'General',
            description: `Imported from delivery: ${deliveryData.invoiceNumber}`,
            isActive: true,
          });

          await storage.createAuditLog({
            userId: 1,
            tableName: 'products',
            recordId: productRecord.id.toString(),
            action: 'CREATE',
            changes: JSON.stringify({
              reason: `New product from delivery: ${deliveryData.invoiceNumber}`,
              supplier: deliveryData.supplierName,
            }),
          });
        }

        importResults.push({
          product: product.name,
          action: product.matched ? 'updated' : 'created',
          success: true,
          id: productRecord?.id,
        });
      } catch (productError) {
        console.error(`Error processing product ${product.name}:`, productError);
        importResults.push({
          product: product.name,
          action: 'failed',
          success: false,
          error: productError instanceof Error ? productError.message : 'Unknown error',
        });
      }
    }

    try {
      const purchaseOrder = await storage.createPurchaseOrder({
        supplierId: 1,
        orderDate: new Date(deliveryData.deliveryDate),
        expectedDate: new Date(deliveryData.deliveryDate),
        status: 'delivered',
        notes: `Imported from scanned docket: ${deliveryData.invoiceNumber}`,
        totalAmount: deliveryData.totalAmount.toString(),
      });

      for (const product of deliveryData.products) {
        const result = importResults.find((r) => r.product === product.name);
        if (result?.success) {
          await storage.addPurchaseOrderItem({
            purchaseOrderId: purchaseOrder.id,
            productId: result.id || 0,
            quantity: product.quantity,
            unitCost: product.unitPrice.toString(),
            receivedQuantity: product.quantity,
          });
        }
      }
    } catch (orderError) {
      console.error('Error creating purchase order:', orderError);
    }

    res.json({
      success: true,
      message: `Successfully imported ${importResults.filter((r) => r.success).length} of ${importResults.length} products`,
      results: importResults,
      deliveryId: deliveryData.id,
    });
  } catch (error) {
    console.error('Delivery import error:', error);
    res.status(400).json({
      error: 'Failed to import delivery',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getDeliveryHistory(_req: Request, res: Response) {
  try {
    const deliveries = await storage.getPurchaseOrders();

    const recentDeliveries = (deliveries || [])
      .filter((po) => po && (po.notes ?? '').includes('scanned docket'))
      .slice(0, 20)
      .map((po) => ({
        id: po.id,
        supplierName: 'Supplier',
        deliveryDate: po.orderDate,
        invoiceNumber: (po.notes ?? '').match(/docket: (.+)/)?.[1] || 'Unknown',
        totalAmount: parseFloat(po.totalAmount),
        status: po.status,
        itemCount: 0,
      }));

    res.json(recentDeliveries);
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
}

export async function getProductSuggestions(req: Request, res: Response) {
  try {
    const { query } = req.query as { query: string };

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const products = await storage.getProducts();
    const suggestions = products
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode?.includes(query))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        currentPrice: parseFloat(p.price),
        currentStock: p.stock,
        category: p.category,
      }));

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}
