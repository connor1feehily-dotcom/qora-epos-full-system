// Standalone supplier dashboard routes without complex schema dependencies
import type { Express } from "express";
import { storage } from "./storage";
import { AISupplierEngine } from "./ai-supplier-engine";

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

  // Free, deterministic email-order parsing using the existing regex engine.
  // No external AI. Items are matched against real products in storage so
  // the caller sees real matches (not the old "Sample Product 1" mock).
  // Failures are explicit — no silent fallback to fake data.
  const emailParseHits = new Map<string, number[]>();
  const EMAIL_RATE_WINDOW_MS = 60_000;
  const EMAIL_RATE_MAX = 30;

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

      const parseResult = AISupplierEngine.parseEmailOrder(emailSubject, emailBody, emailFrom);

      if (!parseResult.items || parseResult.items.length === 0) {
        return res.status(422).json({
          error: 'No order lines found',
          message: 'No product lines could be identified in this email. Common formats supported: "10 x Coca Cola @ €0.79 = €7.90" or "Coca Cola - 10 - 0.79 - 7.90". If the email is in a different format, enter the order manually.',
        });
      }

      // Match items against real products in storage.
      let matchResult: { matchedItems: any[]; unmatchedItems: any[] } = {
        matchedItems: [],
        unmatchedItems: parseResult.items,
      };
      try {
        const products = await storage.getProducts();
        matchResult = AISupplierEngine.matchOrderToInventory(parseResult.items, products || []);
      } catch (matchError) {
        console.error('Product match step failed (continuing with unmatched):', matchError);
      }

      return res.json({
        parseResult: {
          confidence: parseResult.confidence,
          orderData: parseResult.orderData,
          items: parseResult.items,
          parseSource: 'regex',
        },
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