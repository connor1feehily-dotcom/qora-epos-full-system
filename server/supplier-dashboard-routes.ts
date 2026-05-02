// Standalone supplier dashboard routes without complex schema dependencies
import type { Express } from "express";
import OpenAI from "openai";
import { storage } from "./storage";
import { AISupplierEngine } from "./ai-supplier-engine";

const EMAIL_PARSE_PROMPT = `You are reading the body of an email a supplier sent to a small Irish convenience shop. The email is either a purchase-order confirmation, a delivery notice, or an invoice.

Extract the following as strict JSON. Use null when a field genuinely cannot be read. Quantities and prices must be numbers (not strings). Prices are in euros.

{
  "supplier": string | null,
  "orderNumber": string | null,
  "orderDate": string | null,         // ISO YYYY-MM-DD
  "expectedDeliveryDate": string | null,
  "totalAmount": number | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number | null,
      "barcode": string | null
    }
  ]
}

Rules:
- Only include real product line items. Skip subtotals, VAT, delivery charges, signatures, headers, marketing copy.
- Be conservative: if a value is unclear, use null rather than guessing.
- If the email is not an order/invoice/delivery notice at all, return {"supplier": null, "orderNumber": null, "orderDate": null, "expectedDeliveryDate": null, "totalAmount": null, "items": []}.

Return ONLY the JSON object, no surrounding prose.`;

interface AIEmailParse {
  supplier: string | null;
  orderNumber: string | null;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  totalAmount: number | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number | null;
    barcode: string | null;
  }>;
}

async function parseEmailWithAI(
  emailSubject: string,
  emailBody: string,
  emailFrom: string,
): Promise<AIEmailParse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Cannot parse emails with AI.');
  }
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    messages: [
      { role: 'system', content: EMAIL_PARSE_PROMPT },
      {
        role: 'user',
        content: `From: ${emailFrom}\nSubject: ${emailSubject}\n\n${emailBody}`,
      },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('AI returned no content.');
  let parsed: AIEmailParse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI returned malformed JSON.');
  }
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('AI could not read any line items.');
  }
  return parsed;
}

export function registerSupplierDashboardRoutes(app: Express) {
  // Mock data for supplier dashboard functionality
  const mockSupplierOrders = [
    {
      id: 1,
      externalOrderNumber: "SO-2025-001",
      supplier: { id: 1, name: "Fresh Foods Ltd" },
      totalAmount: 1250.50,
      status: "pending_approval",
      orderDate: "2025-01-25T10:00:00Z",
      expectedDeliveryDate: "2025-01-28T09:00:00Z",
      orderItems: [
        { name: "Organic Bananas", quantity: 50, unitPrice: 2.50 },
        { name: "Fresh Milk", quantity: 20, unitPrice: 1.80 }
      ],
      notes: "Urgent delivery required for weekend rush"
    },
    {
      id: 2,
      externalOrderNumber: "SO-2025-002", 
      supplier: { id: 2, name: "Dairy Direct" },
      totalAmount: 875.25,
      status: "approved",
      orderDate: "2025-01-24T14:30:00Z",
      expectedDeliveryDate: "2025-01-27T11:00:00Z",
      orderItems: [
        { name: "Cheddar Cheese", quantity: 10, unitPrice: 12.50 },
        { name: "Greek Yogurt", quantity: 30, unitPrice: 3.25 }
      ]
    }
  ];

  const mockEmailCaptures = [
    {
      id: 1,
      emailSubject: "Order Confirmation - SO-2025-001",
      emailFrom: "orders@freshfoods.ie",
      receivedAt: "2025-01-25T10:05:00Z",
      processingStatus: "processed",
      confidence: 92
    },
    {
      id: 2,
      emailSubject: "Delivery Update - Order #SO-2025-002",
      emailFrom: "dispatch@dairydirect.com",
      receivedAt: "2025-01-25T15:20:00Z",
      processingStatus: "pending",
      confidence: 85
    }
  ];

  const mockWebhooks = [
    {
      id: 1,
      supplier: { id: 1, name: "Fresh Foods Ltd" },
      webhookUrl: "https://freshfoods.ie/webhook/kerrigans",
      eventTypes: ["order_placed", "order_shipped"],
      isActive: true,
      lastTriggered: "2025-01-25T12:30:00Z"
    },
    {
      id: 2,
      supplier: { id: 2, name: "Dairy Direct" },
      webhookUrl: "https://api.dairydirect.com/webhooks/orders",
      eventTypes: ["order_shipped", "order_delivered"],
      isActive: true,
      lastTriggered: "2025-01-24T16:45:00Z"
    }
  ];

  const mockInventoryGaps = [
    {
      id: 1,
      productName: "Premium Coffee Beans",
      currentStock: 5,
      minStock: 20,
      shortfall: 15,
      priority: "high"
    },
    {
      id: 2,
      productName: "Organic Honey",
      currentStock: 0,
      minStock: 12,
      shortfall: 12,
      priority: "critical"
    },
    {
      id: 3,
      productName: "Artisan Bread",
      currentStock: 8,
      minStock: 15,
      shortfall: 7,
      priority: "medium"
    }
  ];

  const mockReorderSuggestions = [
    {
      id: 1,
      productName: "Premium Coffee Beans",
      suggestedQuantity: 40,
      confidence: 89,
      reasoning: "High demand item with consistent daily sales of 2.3 units. Current stock will last only 2 days. Recommend 3-week supply.",
      supplierId: 3
    },
    {
      id: 2,
      productName: "Organic Honey",
      suggestedQuantity: 24,
      confidence: 95,
      reasoning: "Out of stock. Popular breakfast item with steady sales velocity. Seasonal demand increasing.",
      supplierId: 4
    },
    {
      id: 3,
      productName: "Free-Range Eggs",
      suggestedQuantity: 60,
      confidence: 76,
      reasoning: "Stock running low. Weekend demand typically 40% higher than weekdays. Recommend buffer stock.",
      supplierId: 1
    }
  ];

  // API Routes
  app.get("/api/supplier-orders", async (req, res) => {
    try {
      res.json(mockSupplierOrders);
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      res.status(500).json({ error: 'Failed to fetch supplier orders' });
    }
  });

  app.get("/api/email-captures", async (req, res) => {
    try {
      res.json(mockEmailCaptures);
    } catch (error) {
      console.error('Error fetching email captures:', error);
      res.status(500).json({ error: 'Failed to fetch email captures' });
    }
  });

  app.get("/api/supplier-webhooks", async (req, res) => {
    try {
      res.json(mockWebhooks);
    } catch (error) {
      console.error('Error fetching supplier webhooks:', error);
      res.status(500).json({ error: 'Failed to fetch supplier webhooks' });
    }
  });

  app.post("/api/supplier-webhooks", async (req, res) => {
    try {
      const newWebhook = {
        id: mockWebhooks.length + 1,
        ...req.body,
        isActive: true,
        lastTriggered: null
      };
      mockWebhooks.push(newWebhook);
      res.json(newWebhook);
    } catch (error) {
      console.error('Error creating supplier webhook:', error);
      res.status(500).json({ error: 'Failed to create supplier webhook' });
    }
  });

  app.get("/api/inventory/gaps", async (req, res) => {
    try {
      res.json(mockInventoryGaps);
    } catch (error) {
      console.error('Error analyzing inventory gaps:', error);
      res.status(500).json({ error: 'Failed to analyze inventory gaps' });
    }
  });

  app.get("/api/ai/reorder-suggestions", async (req, res) => {
    try {
      res.json(mockReorderSuggestions);
    } catch (error) {
      console.error('Error generating reorder suggestions:', error);
      res.status(500).json({ error: 'Failed to generate reorder suggestions' });
    }
  });

  app.post("/api/ai/process-order-matching", async (req, res) => {
    try {
      // Simulate AI processing
      const newSuggestions = [
        {
          id: mockReorderSuggestions.length + 1,
          productName: "Seasonal Vegetables",
          suggestedQuantity: 30,
          confidence: 82,
          reasoning: "Weekly delivery pattern analysis suggests restocking needed for weekend demand.",
          supplierId: 1
        }
      ];
      
      mockReorderSuggestions.push(...newSuggestions);
      
      res.json({
        message: 'Order matching processed successfully',
        suggestionsGenerated: newSuggestions.length,
        gapsIdentified: mockInventoryGaps.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing order matching:', error);
      res.status(500).json({ error: 'Failed to process order matching' });
    }
  });

  app.post("/api/email-integration/setup", async (req, res) => {
    try {
      const { imapServer, email, password, port, ssl } = req.body;
      
      // Mock successful configuration
      res.json({
        success: true,
        message: 'Email integration configured successfully',
        config: {
          imapServer,
          email,
          port: port || 993,
          useSSL: ssl !== false,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error setting up email integration:', error);
      res.status(500).json({ error: 'Failed to setup email integration' });
    }
  });

  // Real AI email-order parsing.
  // Two-stage strategy:
  //   1. Try the deterministic regex parser (free, fast). If it returns
  //      reasonable confidence (>= 70) and at least one line item, use it.
  //   2. Otherwise call OpenAI to parse the email properly.
  // After parsing, match items against actual products in storage so the
  // caller sees real matches (not fake "Sample Product 1").
  // Failures are explicit — no silent fallback to mock data.
  const emailParseHits = new Map<string, number[]>();
  const EMAIL_RATE_WINDOW_MS = 60_000;
  const EMAIL_RATE_MAX = 20;

  app.post("/api/email/parse-order", async (req, res) => {
    try {
      const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
      const now = Date.now();
      const recent = (emailParseHits.get(ip) || []).filter((t) => now - t < EMAIL_RATE_WINDOW_MS);
      if (recent.length >= EMAIL_RATE_MAX) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Slow down — too many email-parse requests. Try again in a minute.',
        });
      }
      recent.push(now);
      emailParseHits.set(ip, recent);

      const body = req.body || {};
      const emailSubject = String(body.emailSubject ?? '').slice(0, 1000);
      const emailBody = String(body.emailBody ?? '').slice(0, 50_000);
      const emailFrom = String(body.emailFrom ?? '').slice(0, 200);

      if (!emailBody || emailBody.length < 20) {
        return res.status(400).json({
          error: 'Email body missing',
          message: 'Send the full email body — at least a few lines of text are needed to parse.',
        });
      }

      // Stage 1: deterministic regex parse.
      const regexResult = AISupplierEngine.parseEmailOrder(emailSubject, emailBody, emailFrom);

      let orderData: any;
      let items: any[];
      let confidence: number;
      let parseSource: 'regex' | 'ai';

      if (regexResult.confidence >= 70 && regexResult.items.length > 0) {
        orderData = regexResult.orderData;
        items = regexResult.items;
        confidence = regexResult.confidence;
        parseSource = 'regex';
      } else {
        // Stage 2: AI parse.
        let ai: AIEmailParse;
        try {
          ai = await parseEmailWithAI(emailSubject, emailBody, emailFrom);
        } catch (aiError: any) {
          console.error('AI email parsing failed:', aiError?.message || aiError);
          return res.status(502).json({
            error: 'Could not read the email',
            message: aiError?.message || 'The AI could not read this email. Forward it again or enter the order manually.',
          });
        }

        if (!ai.items || ai.items.length === 0) {
          return res.status(422).json({
            error: 'No order lines found',
            message: 'The email was read but no order line items were found. If this is supposed to be an order, double-check the message.',
          });
        }

        const fallbackSupplier =
          ai.supplier ||
          (emailFrom.split('@')[1] || '').split('.')[0].toUpperCase() ||
          'UNKNOWN_SUPPLIER';

        items = ai.items.map((it) => {
          const qty = Math.max(1, Math.floor(it.quantity || 1));
          const unitPrice = typeof it.unitPrice === 'number' && it.unitPrice >= 0 ? it.unitPrice : 0;
          return {
            name: it.name,
            quantity: qty,
            unitPrice,
            totalPrice: Number((qty * unitPrice).toFixed(2)),
            barcode: it.barcode || undefined,
          };
        });
        const computedTotal = Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
        orderData = {
          orderNumber: ai.orderNumber || `AUTO-${Date.now()}`,
          supplier: fallbackSupplier,
          totalAmount: ai.totalAmount && ai.totalAmount > 0 ? ai.totalAmount : computedTotal,
          orderDate: ai.orderDate || new Date().toISOString().split('T')[0],
          expectedDeliveryDate: ai.expectedDeliveryDate || undefined,
        };
        confidence = 90;
        parseSource = 'ai';
      }

      // Match items against real products in storage (not mock data).
      let matchResult: { matchedItems: any[]; unmatchedItems: any[] } = {
        matchedItems: [],
        unmatchedItems: items,
      };
      try {
        const products = await storage.getProducts();
        matchResult = AISupplierEngine.matchOrderToInventory(items, products || []);
      } catch (matchError) {
        console.error('Product match step failed (continuing with unmatched):', matchError);
      }

      return res.json({
        parseResult: { confidence, orderData, items, parseSource },
        matchResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error parsing email order:', error);
      return res.status(500).json({
        error: 'Failed to parse email order',
        message: error?.message || 'Unknown error',
      });
    }
  });

  app.post("/api/webhook/supplier/:supplierId", async (req, res) => {
    try {
      const { supplierId } = req.params;
      const webhookData = req.body;
      const eventType = req.headers['x-event-type'] as string || 'order_update';
      
      // Mock webhook processing
      const processedData = {
        eventType,
        processedAt: new Date().toISOString(),
        confidence: 85,
        orderData: {
          orderNumber: webhookData.order_id || webhookData.id,
          status: 'pending_approval',
          totalAmount: webhookData.total || webhookData.amount,
          orderDate: webhookData.created_at || new Date().toISOString()
        }
      };
      
      res.json({
        success: true,
        processedData,
        message: `Webhook processed for supplier ${supplierId}`
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });
}