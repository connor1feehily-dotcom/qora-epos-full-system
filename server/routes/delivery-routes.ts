import type { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

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
  ocrText: z.string().min(20).max(50_000),
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

// ── Free, on-device parsing of delivery dockets ──────────────────────────────
//
// The browser runs Tesseract.js to OCR the photo and sends us the extracted
// text. This server parses that text into line items using a set of robust
// regex patterns that cover the common Irish supplier docket layouts
// (Musgrave, BWG, Coca Cola HBC, Cuisine de France, etc.).
//
// No paid AI. No external API. Photos never leave the till.
//
// The shopkeeper always reviews the parsed list before any stock change is
// committed, so OCR errors can be corrected before they affect inventory.

function parseSupplierAndInvoice(text: string): { supplier: string | null; invoice: string | null; date: string | null; total: number | null } {
  const supplierPatterns = [
    /(?:from|supplier|vendor)[\s:]+([A-Z][A-Za-z &'.\-]{2,40})/i,
    /^([A-Z][A-Za-z &'.\-]{3,40})\s*(?:LTD|LIMITED|PLC|LLC|LLP)/m,
    /(MUSGRAVE|BWG|COCA[\s-]?COLA[\s-]?HBC|CUISINE DE FRANCE|TENNANT|HENDERSON|HENDERSONS|GLANBIA|KERRY|VALEO|MULLINS|JFC|DIAGEO|HEINEKEN|BRENNANS|TAYTO)\b/i,
  ];
  let supplier: string | null = null;
  for (const p of supplierPatterns) {
    const m = text.match(p);
    if (m && m[1]) { supplier = m[1].trim(); break; }
  }

  const invoicePatterns = [
    /(?:invoice|inv|docket|delivery|po|order)[\s#:.\-]*([A-Z0-9][A-Z0-9\-/]{2,20})/i,
    /\b(INV[\-/]?\d{3,})\b/i,
    /\b(\d{4,}[\-/]\d{2,}[\-/]?\d{2,})\b/,
  ];
  let invoice: string | null = null;
  for (const p of invoicePatterns) {
    const m = text.match(p);
    if (m && m[1]) { invoice = m[1].trim(); break; }
  }

  const datePatterns = [
    /(?:date|delivered|delivery)[\s:]+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ];
  let date: string | null = null;
  for (const p of datePatterns) {
    const m = text.match(p);
    if (m && m[1]) { date = m[1].trim(); break; }
  }

  const totalPatterns = [
    /(?:total|grand\s*total|amount\s*due|balance\s*due)[\s:€£$]*([0-9,]+\.\d{2})/i,
    /€\s*([0-9,]+\.\d{2})\s*$/m,
  ];
  let total: number | null = null;
  for (const p of totalPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0) { total = n; break; }
    }
  }

  return { supplier, invoice, date, total };
}

interface ParsedLine {
  name: string;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  originalText: string;
}

function parseLineItems(text: string): ParsedLine[] {
  const skip = /^(invoice|date|delivered|delivery|supplier|vendor|po\b|order\b|customer|account|page|subtotal|sub-total|sub total|vat|tax|total|amount|balance|payment|terms|signature|received|notes?|description|item|qty|quantity|unit|price|cost|line|ref|batch|kerrigans|address|phone|tel|email|web|www\.|http)/i;

  // Patterns ordered by specificity. Each must capture: qty, name, unitPrice,
  // (optionally) total. Barcodes are picked up separately if present on the line.
  // Numbers may use comma or dot decimal; currency symbols optional.
  const num = (s: string) => parseFloat(s.replace(/,/g, '.').replace(/[^\d.]/g, ''));

  // Detect 8-14 digit barcodes anywhere on the line.
  const barcodeRe = /\b(\d{8,14})\b/;

  const patterns: Array<{ re: RegExp; map: (m: RegExpMatchArray) => Omit<ParsedLine, 'originalText'> | null }> = [
    {
      // "10 x Coca Cola 500ml @ €0.79 = €7.90"
      re: /^\s*(\d{1,4})\s*[x×*]\s+(.+?)\s+@?\s*[€£$]?\s*([\d.,]+)\s*=?\s*[€£$]?\s*([\d.,]+)?\s*$/i,
      map: (m) => {
        const qty = parseInt(m[1], 10);
        const name = m[2].trim();
        const unit = num(m[3]);
        const total = m[4] ? num(m[4]) : qty * unit;
        if (!isFinite(qty) || qty < 1 || !isFinite(unit) || unit < 0 || name.length < 2) return null;
        return { name, barcode: null, quantity: qty, unitPrice: unit, total };
      },
    },
    {
      // "5449000000996  Coca Cola 500ml  10  0.79  7.90"
      re: /^\s*(\d{8,14})\s+(.+?)\s+(\d{1,4})\s+[€£$]?([\d.,]+)\s+[€£$]?([\d.,]+)\s*$/,
      map: (m) => {
        const barcode = m[1];
        const name = m[2].trim();
        const qty = parseInt(m[3], 10);
        const unit = num(m[4]);
        const total = num(m[5]);
        if (!isFinite(qty) || qty < 1 || name.length < 2) return null;
        return { name, barcode, quantity: qty, unitPrice: unit, total };
      },
    },
    {
      // "Coca Cola 500ml    24    €18.99"  (qty after name, total only)
      re: /^\s*([A-Za-z][A-Za-z0-9 &'./\-]{2,60}?)\s{2,}(\d{1,4})\s{2,}[€£$]\s*([\d.,]+)\s*$/,
      map: (m) => {
        const name = m[1].trim();
        const qty = parseInt(m[2], 10);
        const total = num(m[3]);
        if (!isFinite(qty) || qty < 1 || total <= 0) return null;
        const unit = total / qty;
        return { name, barcode: null, quantity: qty, unitPrice: unit, total };
      },
    },
    {
      // "10  Coca Cola 500ml  €0.79"  (qty, name, unit price)
      re: /^\s*(\d{1,4})\s+([A-Za-z][A-Za-z0-9 &'./\-]{2,60}?)\s+[€£$]\s*([\d.,]+)\s*$/,
      map: (m) => {
        const qty = parseInt(m[1], 10);
        const name = m[2].trim();
        const unit = num(m[3]);
        if (!isFinite(qty) || qty < 1 || unit < 0 || name.length < 2) return null;
        return { name, barcode: null, quantity: qty, unitPrice: unit, total: qty * unit };
      },
    },
    {
      // "Coca Cola 500ml x24 €18.99"
      re: /^\s*([A-Za-z][A-Za-z0-9 &'./\-]{2,60}?)\s+[x×*]\s*(\d{1,4})\s+[€£$]?\s*([\d.,]+)\s*$/i,
      map: (m) => {
        const name = m[1].trim();
        const qty = parseInt(m[2], 10);
        const total = num(m[3]);
        if (!isFinite(qty) || qty < 1 || total <= 0) return null;
        const unit = total / qty;
        return { name, barcode: null, quantity: qty, unitPrice: unit, total };
      },
    },
  ];

  const out: ParsedLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length < 5) continue;
    if (skip.test(line)) continue;
    // Skip lines that are mostly digits (likely phone numbers, refs).
    const digitsOnly = line.replace(/\D/g, '').length;
    if (digitsOnly > line.length * 0.8 && line.length > 6) continue;

    for (const { re, map } of patterns) {
      const m = line.match(re);
      if (m) {
        const parsed = map(m);
        if (parsed) {
          // Try to grab a barcode anywhere on the line if not already set.
          if (!parsed.barcode) {
            const bm = line.match(barcodeRe);
            if (bm) parsed.barcode = bm[1];
          }
          out.push({ ...parsed, originalText: line });
          break;
        }
      }
    }
  }
  return out;
}

function fuzzyMatch(
  parsedName: string,
  parsedBarcode: string | null,
  existing: any[],
): { product: any; confidence: number } | null {
  if (!existing || existing.length === 0) return null;

  if (parsedBarcode) {
    const exact = existing.find((p) => p.barcode && p.barcode === parsedBarcode);
    if (exact) return { product: exact, confidence: 0.99 };
  }

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

// Lightweight per-IP rate limit. OCR is on-device so there is no API cost,
// but the server still does regex + O(lines × products) fuzzy matching on
// every call — protect against runaway clients.
const scanHits = new Map<string, number[]>();
const SCAN_RATE_WINDOW_MS = 60_000;
const SCAN_RATE_MAX = 20;

export async function scanDocket(req: Request, res: Response) {
  try {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
    const now = Date.now();
    const recent = (scanHits.get(ip) || []).filter((t) => now - t < SCAN_RATE_WINDOW_MS);
    if (recent.length >= SCAN_RATE_MAX) {
      return res.status(429).json({
        error: 'Too many scans',
        message: 'You are scanning too quickly. Please wait a minute and try again.',
      });
    }
    recent.push(now);
    scanHits.set(ip, recent);

    let parsed: { ocrText: string };
    try {
      parsed = scanDocketSchema.parse(req.body);
    } catch {
      return res.status(400).json({
        error: 'No text received',
        message: 'The photo could not be read. Try a clearer, well-lit photo of the docket — keep it flat and avoid shadows.',
      });
    }
    const { ocrText } = parsed;

    // Server-side product fetch — never trust the client's idea of inventory.
    let existingProducts: any[] = [];
    try {
      existingProducts = (await storage.getProducts()) || [];
    } catch (e) {
      console.error('Failed to load products for matching (continuing unmatched):', e);
    }

    const header = parseSupplierAndInvoice(ocrText);
    const lines = parseLineItems(ocrText);

    if (lines.length === 0) {
      return res.status(422).json({
        error: 'No products found',
        message: 'The text was read but no product lines could be identified. Try a clearer photo, or tap "Manual Entry" to add the products by hand.',
      });
    }

    const products: ScannedProduct[] = lines.map((line) => {
      const match = fuzzyMatch(line.name, line.barcode, existingProducts);
      return {
        id: match?.product?.id,
        name: match?.product?.name || line.name,
        barcode: line.barcode || match?.product?.barcode || undefined,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: Number(line.total.toFixed(2)),
        matched: !!match,
        confidence: match ? Number(match.confidence.toFixed(2)) : 0,
        originalText: line.originalText,
      };
    });

    const computedTotal = Number(products.reduce((s, p) => s + p.total, 0).toFixed(2));

    const docket: DeliveryDocket = {
      id: `docket-${Date.now()}`,
      supplierName: header.supplier || 'Unknown supplier',
      deliveryDate: header.date || new Date().toISOString().split('T')[0],
      invoiceNumber: header.invoice || `MANUAL-${Date.now()}`,
      products,
      totalAmount: header.total && header.total > 0 ? header.total : computedTotal,
      status: 'matched',
    };

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
