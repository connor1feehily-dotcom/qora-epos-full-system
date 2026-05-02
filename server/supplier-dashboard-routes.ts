// Standalone supplier dashboard routes without complex schema dependencies
import type { Express } from "express";

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

  app.post("/api/email/parse-order", async (req, res) => {
    try {
      const body = req.body || {};
      const emailSubject = String(body.emailSubject ?? '');
      const emailBody = String(body.emailBody ?? '');
      const emailFrom = String(body.emailFrom ?? '');

      // Safely derive a supplier name from the sender domain when possible
      const domain = (emailFrom.split('@')[1] || '').split('.')[0];
      const supplierName = domain ? domain.toUpperCase() : 'UNKNOWN_SUPPLIER';

      // Mock AI parsing results
      const parseResult = {
        confidence: 87,
        orderData: {
          orderNumber: "AUTO-" + Date.now(),
          supplier: supplierName,
          totalAmount: 450.75,
          orderDate: new Date().toISOString().split('T')[0],
          expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        items: [
          {
            name: "Sample Product 1",
            quantity: 20,
            unitPrice: 15.50,
            totalPrice: 310.00
          },
          {
            name: "Sample Product 2", 
            quantity: 10,
            unitPrice: 14.08,
            totalPrice: 140.75
          }
        ]
      };

      const matchResult = {
        matchedItems: [
          {
            ...parseResult.items[0],
            matchedProduct: { id: 1, name: "Sample Product 1", price: 18.00 },
            matchScore: 95,
            suggestedPrice: 18.50,
            marginPercentage: 16.2
          }
        ],
        unmatchedItems: [parseResult.items[1]]
      };
      
      res.json({
        parseResult,
        matchResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error parsing email order:', error);
      res.status(500).json({ error: 'Failed to parse email order' });
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