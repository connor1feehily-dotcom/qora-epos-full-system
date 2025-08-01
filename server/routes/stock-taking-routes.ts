import type { Express } from "express";

export function registerStockTakingRoutes(app: Express) {
  // Mock data for stock taking functionality
  const mockStockSessions = [
    {
      id: "session_1",
      name: "Monthly Stock Take - January 2025",
      startDate: "2025-01-01T09:00:00Z",
      endDate: null,
      status: "active",
      totalItems: 1247,
      countedItems: 892,
      discrepancies: 23,
      userId: 1
    },
    {
      id: "session_2", 
      name: "End of Year Stock Take 2024",
      startDate: "2024-12-31T18:00:00Z",
      endDate: "2025-01-01T02:00:00Z",
      status: "completed",
      totalItems: 1156,
      countedItems: 1156,
      discrepancies: 12,
      userId: 1
    }
  ];

  const mockStockItems = [
    {
      id: 1,
      name: "Coca Cola 500ml",
      barcode: "5449000000996",
      expectedQuantity: 48,
      countedQuantity: 45,
      variance: -3,
      lastUpdated: "2025-01-01T10:30:00Z",
      category: "Beverages",
      unitPrice: 1.50,
      location: "shop-floor",
      status: "discrepancy"
    },
    {
      id: 2,
      name: "Tayto Crisps Original",
      barcode: "5391519301235",
      expectedQuantity: 24,
      countedQuantity: 24,
      variance: 0,
      lastUpdated: "2025-01-01T10:45:00Z",
      category: "Snacks",
      unitPrice: 1.00,
      location: "shop-floor",
      status: "verified"
    },
    {
      id: 3,
      name: "Brennans Bread White",
      barcode: "5011065000156",
      expectedQuantity: 12,
      countedQuantity: 0,
      variance: 0,
      lastUpdated: "2025-01-01T09:15:00Z",
      category: "Bakery",
      unitPrice: 1.20,
      location: "shop-floor",
      status: "pending"
    },
    {
      id: 4,
      name: "Avonmore Milk 1L",
      barcode: "5391519302156",
      expectedQuantity: 36,
      countedQuantity: 38,
      variance: 2,
      lastUpdated: "2025-01-01T11:00:00Z",
      category: "Dairy",
      unitPrice: 1.45,
      location: "storage",
      status: "discrepancy"
    },
    {
      id: 5,
      name: "Cadbury Dairy Milk",
      barcode: "7622210993854",
      expectedQuantity: 60,
      countedQuantity: 58,
      variance: -2,
      lastUpdated: "2025-01-01T10:15:00Z",
      category: "Confectionery",
      unitPrice: 2.50,
      location: "shop-floor",
      status: "counted"
    }
  ];

  const mockHardwareStatus = {
    printer: {
      status: "connected",
      model: "Epson TM-T20III",
      ipAddress: "192.168.1.100",
      lastPing: new Date().toISOString()
    },
    scanner: {
      status: "connected",
      model: "Zebra DS2208",
      serialNumber: "DS2208-12345",
      lastScan: new Date().toISOString()
    },
    terminal: {
      status: "connected", 
      model: "Ingenico iCT250",
      merchantId: "KERR001",
      lastTransaction: new Date().toISOString()
    }
  };

  // Stock Taking Sessions
  app.get("/api/stock-taking/sessions", async (req, res) => {
    try {
      res.json(mockStockSessions);
    } catch (error) {
      console.error('Error fetching stock sessions:', error);
      res.status(500).json({ error: 'Failed to fetch stock sessions' });
    }
  });

  app.post("/api/stock-taking/sessions", async (req, res) => {
    try {
      const { name, userId } = req.body;
      
      const newSession = {
        id: `session_${Date.now()}`,
        name,
        startDate: new Date().toISOString(),
        endDate: null,
        status: "active",
        totalItems: 1247, // Would be calculated from products table
        countedItems: 0,
        discrepancies: 0,
        userId
      };
      
      mockStockSessions.push(newSession);
      res.json(newSession);
    } catch (error) {
      console.error('Error creating stock session:', error);
      res.status(500).json({ error: 'Failed to create stock session' });
    }
  });

  app.get("/api/stock-taking/sessions/:sessionId/items", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // In real implementation, filter by session
      res.json(mockStockItems);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      res.status(500).json({ error: 'Failed to fetch stock items' });
    }
  });

  app.patch("/api/stock-taking/items/:itemId/count", async (req, res) => {
    try {
      const { itemId } = req.params;
      const { countedQuantity } = req.body;
      
      const itemIndex = mockStockItems.findIndex(item => item.id === parseInt(itemId));
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const item = mockStockItems[itemIndex];
      item.countedQuantity = countedQuantity;
      item.variance = countedQuantity - item.expectedQuantity;
      item.lastUpdated = new Date().toISOString();
      item.status = item.variance === 0 ? 'verified' : 'discrepancy';
      
      res.json(item);
    } catch (error) {
      console.error('Error updating item count:', error);
      res.status(500).json({ error: 'Failed to update item count' });
    }
  });

  app.post("/api/stock-taking/sessions/:sessionId/print-report", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Mock print job
      const printData = {
        sessionId,
        timestamp: new Date().toISOString(),
        report: {
          totalItems: 1247,
          countedItems: 892,
          discrepancies: 23,
          accuracy: 97.4,
          items: mockStockItems.filter(item => item.variance !== 0)
        }
      };
      
      // Simulate sending to Epson printer
      console.log('Printing stock report:', printData);
      
      res.json({
        success: true,
        message: 'Stock report sent to printer',
        printJobId: `print_${Date.now()}`
      });
    } catch (error) {
      console.error('Error printing stock report:', error);
      res.status(500).json({ error: 'Failed to print stock report' });
    }
  });

  // Hardware Status and Control
  app.get("/api/hardware/printer/status", async (req, res) => {
    try {
      res.json(mockHardwareStatus.printer);
    } catch (error) {
      console.error('Error checking printer status:', error);
      res.status(500).json({ error: 'Failed to check printer status' });
    }
  });

  app.get("/api/hardware/scanner/status", async (req, res) => {
    try {
      res.json(mockHardwareStatus.scanner);
    } catch (error) {
      console.error('Error checking scanner status:', error);
      res.status(500).json({ error: 'Failed to check scanner status' });
    }
  });

  app.get("/api/hardware/terminal/status", async (req, res) => {
    try {
      res.json(mockHardwareStatus.terminal);
    } catch (error) {
      console.error('Error checking terminal status:', error);
      res.status(500).json({ error: 'Failed to check terminal status' });
    }
  });

  app.post("/api/hardware/printer/print", async (req, res) => {
    try {
      const { content, type = 'receipt' } = req.body;
      
      // Mock print command to Epson printer
      const printJob = {
        id: `print_${Date.now()}`,
        content,
        type,
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      
      console.log('Print job sent to Epson printer:', printJob);
      
      res.json({
        success: true,
        printJob
      });
    } catch (error) {
      console.error('Error sending print job:', error);
      res.status(500).json({ error: 'Failed to send print job' });
    }
  });

  app.post("/api/hardware/scanner/calibrate", async (req, res) => {
    try {
      // Mock scanner calibration
      console.log('Calibrating barcode scanner...');
      
      setTimeout(() => {
        mockHardwareStatus.scanner.lastScan = new Date().toISOString();
      }, 2000);
      
      res.json({
        success: true,
        message: 'Scanner calibration initiated',
        estimatedTime: '30 seconds'
      });
    } catch (error) {
      console.error('Error calibrating scanner:', error);
      res.status(500).json({ error: 'Failed to calibrate scanner' });
    }
  });

  app.post("/api/hardware/terminal/test", async (req, res) => {
    try {
      // Mock terminal test transaction
      const testTransaction = {
        id: `test_${Date.now()}`,
        amount: 0.01,
        type: 'test',
        status: 'approved',
        timestamp: new Date().toISOString()
      };
      
      console.log('Test transaction sent to payment terminal:', testTransaction);
      
      res.json({
        success: true,
        transaction: testTransaction
      });
    } catch (error) {
      console.error('Error testing payment terminal:', error);
      res.status(500).json({ error: 'Failed to test payment terminal' });
    }
  });

  // Barcode scanning and product lookup
  app.post("/api/stock-taking/scan", async (req, res) => {
    try {
      const { barcode, sessionId } = req.body;
      
      // Mock product lookup by barcode
      const product = mockStockItems.find(item => item.barcode === barcode);
      
      if (!product) {
        return res.status(404).json({ 
          error: 'Product not found',
          barcode,
          suggestion: 'Add this product to inventory or check barcode'
        });
      }
      
      res.json({
        success: true,
        product,
        scanTime: new Date().toISOString(),
        sessionId
      });
    } catch (error) {
      console.error('Error processing barcode scan:', error);
      res.status(500).json({ error: 'Failed to process barcode scan' });
    }
  });

  // Stock variance analysis
  app.get("/api/stock-taking/analysis/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const analysis = {
        sessionId,
        totalVariance: -1, // Total units variance
        totalValueVariance: -3.45, // Euro value variance
        categoryBreakdown: [
          { category: 'Beverages', variance: -3, value: -4.50 },
          { category: 'Dairy', variance: 2, value: 2.90 },
          { category: 'Confectionery', variance: -2, value: -5.00 }
        ],
        locationBreakdown: [
          { location: 'shop-floor', variance: -5, value: -6.50 },
          { location: 'storage', variance: 2, value: 2.90 },
          { location: 'warehouse', variance: 2, value: 0.10 }
        ],
        topDiscrepancies: mockStockItems
          .filter(item => Math.abs(item.variance) > 0)
          .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
          .slice(0, 10)
      };
      
      res.json(analysis);
    } catch (error) {
      console.error('Error generating stock analysis:', error);
      res.status(500).json({ error: 'Failed to generate stock analysis' });
    }
  });
}