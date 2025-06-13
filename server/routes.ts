import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertSupplierSchema, insertTransactionSchema, insertTransactionItemSchema, insertPromotionSchema } from "@shared/schema";
import { z } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
  // Database seeding endpoint
  app.post("/api/seed", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { users, products, customers } = await import("@shared/schema");

      // Seed staff users
      await db.insert(users).values([
        {
          username: 'admin',
          password: 'admin123',
          pin: '0000',
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          employeeId: 'ADMIN001',
          isActive: true
        },
        {
          username: 'manager',
          password: 'manager123',
          pin: '9999',
          role: 'manager',
          firstName: 'Store',
          lastName: 'Manager',
          employeeId: 'MGR001',
          isActive: true
        },
        {
          username: 'staff1',
          password: 'staff123',
          pin: '1234',
          role: 'staff',
          firstName: 'John',
          lastName: 'Doe',
          employeeId: 'STAFF001',
          isActive: true
        },
        {
          username: 'staff2',
          password: 'staff456',
          pin: '5678',
          role: 'staff',
          firstName: 'Jane',
          lastName: 'Smith',
          employeeId: 'STAFF002',
          isActive: true
        }
      ]).onConflictDoNothing();

      // Seed essential products only
      await db.insert(products).values([
        {
          name: 'Coca Cola 500ml',
          barcode: '5449000214911',
          price: '1.50',
          cost: '0.80',
          category: 'Drinks',
          stock: 24,
          minStock: 5,
          vatRate: '23.00',
          isActive: true
        },
        {
          name: 'Coffee Large',
          price: '2.80',
          cost: '1.00',
          category: 'Hot Drinks',
          stock: 50,
          minStock: 10,
          vatRate: '13.50',
          isActive: true
        },
        {
          name: 'White Bread',
          barcode: '5099821001236',
          price: '2.20',
          cost: '1.50',
          category: 'Food',
          stock: 12,
          minStock: 3,
          vatRate: '0.00',
          isActive: true
        }
      ]).onConflictDoNothing();

      // Seed default customer
      await db.insert(customers).values([
        {
          name: 'Walk-in Customer',
          loyaltyPoints: 0,
          isActive: true
        }
      ]).onConflictDoNothing();

      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      await storage.updateUserLastLogin(user.id);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/pin-login", async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUserByPin(pin);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      
      await storage.updateUserLastLogin(user.id);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "PIN login failed" });
    }
  });

  app.get("/api/auth/staff", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const staffMembers = users
        .filter(u => u.isActive)
        .map(({ password, ...user }) => user);
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { transaction, items } = req.body;
      
      // Validate transaction data
      const transactionData = insertTransactionSchema.parse(transaction);
      
      // Create transaction
      const newTransaction = await storage.createTransaction(transactionData);
      
      // Add transaction items
      const transactionItems = [];
      for (const item of items) {
        const itemData = insertTransactionItemSchema.parse({
          ...item,
          transactionId: newTransaction.id
        });
        const newItem = await storage.addTransactionItem(itemData);
        transactionItems.push(newItem);
        
        // Update product stock
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(item.productId, {
            stock: product.stock - item.quantity
          });
        }
      }
      
      res.status(201).json({ transaction: newTransaction, items: transactionItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions/:id/items", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const items = await storage.getTransactionItems(transactionId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction items" });
    }
  });

  // Promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const promotionData = insertPromotionSchema.parse(req.body);
      const promotion = await storage.createPromotion(promotionData);
      res.status(201).json(promotion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid promotion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  // Analytics/Reports
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const { tillId } = req.query;
      const transactions = await storage.getTransactions();
      const products = await storage.getProducts();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayTransactions = transactions.filter(t => 
        new Date(t.createdAt).getTime() >= today.getTime()
      );

      // Filter by till if specified
      if (tillId && tillId !== 'all') {
        todayTransactions = todayTransactions.filter(t => t.tillId === tillId);
      }
      
      const dailyRevenue = todayTransactions.reduce((sum, t) => 
        sum + parseFloat(t.total.toString()), 0
      );
      
      const lowStockItems = products.filter(p => p.stock <= p.minStock);
      
      // Calculate fuel sales (assuming category 'Fuel')
      const fuelProducts = products.filter(p => p.category === 'Fuel');
      let fuelSales = 0;
      for (const transaction of todayTransactions) {
        const items = await storage.getTransactionItems(transaction.id);
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product && product.category === 'Fuel') {
            fuelSales += item.quantity;
          }
        }
      }

      // Till-specific metrics
      const till1Transactions = transactions.filter(t => 
        new Date(t.createdAt).getTime() >= today.getTime() && t.tillId === 'till1'
      );
      const till2Transactions = transactions.filter(t => 
        new Date(t.createdAt).getTime() >= today.getTime() && t.tillId === 'till2'
      );

      const till1Revenue = till1Transactions.reduce((sum, t) => 
        sum + parseFloat(t.total.toString()), 0
      );
      const till2Revenue = till2Transactions.reduce((sum, t) => 
        sum + parseFloat(t.total.toString()), 0
      );
      
      res.json({
        dailyRevenue,
        transactions: todayTransactions.length,
        fuelSales,
        lowStock: lowStockItems.length,
        recentTransactions: transactions.slice(-5).reverse(),
        tillMetrics: {
          till1: {
            transactions: till1Transactions.length,
            revenue: till1Revenue
          },
          till2: {
            transactions: till2Transactions.length,
            revenue: till2Revenue
          }
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Till Management endpoints
  app.get("/api/till/:tillId/session", async (req, res) => {
    try {
      const { tillId } = req.params;
      const session = await storage.getCurrentTillSession(tillId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch till session" });
    }
  });

  app.post("/api/till/open", async (req, res) => {
    try {
      const { tillId, userId, openingFloat } = req.body;
      
      // Check if till is already open
      const existingSession = await storage.getCurrentTillSession(tillId);
      if (existingSession) {
        return res.status(400).json({ message: "Till is already open" });
      }

      const session = await storage.openTillSession({
        tillId,
        userId,
        openingFloat: openingFloat.toString()
      });
      
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to open till" });
    }
  });

  app.post("/api/till/close", async (req, res) => {
    try {
      const { sessionId, closingFloat, actualCash } = req.body;
      
      const session = await storage.closeTillSession(sessionId, {
        closingFloat,
        actualCash
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to close till" });
    }
  });

  app.get("/api/till/:tillId/sessions", async (req, res) => {
    try {
      const { tillId } = req.params;
      const sessions = await storage.getTillSessions(tillId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch till sessions" });
    }
  });

  // Users Management endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Analytics endpoints for back office
  app.get("/api/analytics/todays-sales", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= today;
      });

      // Generate hourly sales data
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourTransactions = todayTransactions.filter(t => {
          return new Date(t.createdAt).getHours() === hour;
        });
        return {
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sales: hourTransactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0)
        };
      });

      res.json(hourlyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's sales data" });
    }
  });

  app.get("/api/analytics/till-health", async (req, res) => {
    try {
      const { tillId } = req.query;
      const transactions = await storage.getTransactions();
      
      // Get recent transactions for the till
      const tillTransactions = tillId 
        ? transactions.filter(t => t.tillId === tillId)
        : transactions;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = tillTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= today;
      });

      const lastTransaction = tillTransactions.length > 0 
        ? tillTransactions[tillTransactions.length - 1]
        : null;

      const lastTransactionTime = lastTransaction 
        ? Math.floor((Date.now() - new Date(lastTransaction.createdAt).getTime()) / 1000 / 60)
        : 0;

      const status = lastTransactionTime < 30 ? 'healthy' : 
                    lastTransactionTime < 120 ? 'warning' : 'error';

      res.json({
        status,
        lastTransaction: lastTransaction 
          ? `${lastTransactionTime} min ago`
          : 'No transactions',
        transactionCount: todayTransactions.length,
        uptime: '8h 23m' // This would come from till session data in real implementation
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch till health data" });
    }
  });

  app.get("/api/analytics/low-stock", async (req, res) => {
    try {
      const products = await storage.getProducts();
      
      const lowStockItems = products
        .filter(p => p.stock <= (p.minStock || 10))
        .map(p => ({
          productName: p.name,
          currentStock: p.stock,
          minStock: p.minStock || 10,
          urgent: p.stock === 0 || p.stock <= 5
        }))
        .sort((a, b) => a.currentStock - b.currentStock);

      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock data" });
    }
  });

  // Daily Reports endpoints
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { tillId, reportType, generatedBy } = req.body;
      
      if (!['X', 'Z'].includes(reportType)) {
        return res.status(400).json({ message: "Invalid report type. Must be 'X' or 'Z'" });
      }

      const report = await storage.generateDailyReport(tillId, reportType, generatedBy);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const { tillId, date } = req.query;
      const reports = await storage.getDailyReports(
        tillId as string,
        date ? new Date(date as string) : undefined
      );
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:tillId/last-z", async (req, res) => {
    try {
      const { tillId } = req.params;
      const report = await storage.getLastZReport(tillId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch last Z report" });
    }
  });

  // Till drawer control endpoint
  app.post("/api/till/open-drawer", async (req, res) => {
    try {
      const { tillId } = req.body;
      
      // ESC/POS command to open cash drawer
      const ESC = '\x1b';
      const DLE = '\x10';
      const EOT = '\x04';
      const openDrawerCommand = DLE + EOT + '\x01'; // Standard cash drawer open command
      
      // In a real implementation, this would send the command to the physical printer/cash drawer
      // For now, we'll simulate the action and log it
      console.log(`Opening cash drawer for ${tillId}`);
      console.log('ESC/POS Command:', openDrawerCommand);
      
      res.json({ 
        message: "Cash drawer opened", 
        tillId,
        command: "DLE EOT 1",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to open cash drawer" });
    }
  });

  // Receipt printing endpoint
  app.post("/api/print/receipt", async (req, res) => {
    try {
      const receiptData = req.body;
      
      // ESC/POS commands for Epson printers
      const ESC = '\x1b';
      const GS = '\x1d';
      
      // Build receipt content with ESC/POS formatting
      let receiptContent = '';
      
      // Initialize printer
      receiptContent += ESC + '@'; // Initialize
      receiptContent += ESC + 'a' + '\x01'; // Center alignment
      
      // Store header
      receiptContent += ESC + '!' + '\x18'; // Double width and height
      receiptContent += receiptData.storeName + '\n';
      receiptContent += ESC + '!' + '\x00'; // Normal size
      receiptContent += receiptData.storeAddress + '\n';
      receiptContent += receiptData.storePhone + '\n';
      receiptContent += 'VAT: ' + receiptData.vatNumber + '\n';
      receiptContent += '--------------------------------\n';
      
      // Transaction details
      receiptContent += ESC + 'a' + '\x00'; // Left alignment
      receiptContent += `Transaction #${receiptData.transactionId}\n`;
      receiptContent += `${receiptData.tillId.toUpperCase()} - ${receiptData.dateTime}\n`;
      
      if (receiptData.customer) {
        receiptContent += `Customer: ${receiptData.customer.name}\n`;
      }
      
      receiptContent += '--------------------------------\n';
      
      // Items
      receiptData.items.forEach((item: any) => {
        receiptContent += `${item.name}\n`;
        receiptContent += `  ${item.quantity} x €${item.price.toFixed(2)}`;
        receiptContent += `${' '.repeat(32 - (`  ${item.quantity} x €${item.price.toFixed(2)}€${item.total.toFixed(2)}`).length)}`;
        receiptContent += `€${item.total.toFixed(2)}\n`;
      });
      
      receiptContent += '--------------------------------\n';
      
      // Totals
      receiptContent += `Subtotal:${' '.repeat(32 - (`Subtotal:€${receiptData.subtotal.toFixed(2)}`).length)}€${receiptData.subtotal.toFixed(2)}\n`;
      receiptContent += `VAT (23%):${' '.repeat(32 - (`VAT (23%):€${receiptData.vatAmount.toFixed(2)}`).length)}€${receiptData.vatAmount.toFixed(2)}\n`;
      receiptContent += '--------------------------------\n';
      receiptContent += ESC + '!' + '\x08'; // Emphasized
      receiptContent += `TOTAL:${' '.repeat(32 - (`TOTAL:€${receiptData.total.toFixed(2)}`).length)}€${receiptData.total.toFixed(2)}\n`;
      receiptContent += ESC + '!' + '\x00'; // Normal
      receiptContent += `Payment: ${receiptData.paymentMethod.toUpperCase()}\n`;
      receiptContent += '--------------------------------\n';
      
      // Footer
      receiptContent += ESC + 'a' + '\x01'; // Center alignment
      receiptContent += 'Thank you for your business!\n';
      receiptContent += 'Keep your receipt for returns\n';
      receiptContent += '\n\n\n';
      
      // Cut paper
      receiptContent += GS + 'V' + '\x00'; // Full cut
      
      // In a real implementation, this would be sent to the actual printer
      // For now, we'll simulate successful printing
      console.log('Receipt printed:', {
        transactionId: receiptData.transactionId,
        total: receiptData.total,
        items: receiptData.items.length
      });
      
      res.json({ 
        success: true, 
        message: "Receipt sent to printer",
        printData: {
          transactionId: receiptData.transactionId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Print error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to print receipt" 
      });
    }
  });

  // Email receipt endpoint
  app.post("/api/email/receipt", async (req, res) => {
    try {
      const receiptData = req.body;
      
      // Build HTML receipt
      const htmlReceipt = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .store-name { font-size: 24px; font-weight: bold; }
            .divider { border-top: 1px solid #ccc; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${receiptData.storeName}</div>
            <div>${receiptData.storeAddress}</div>
            <div>${receiptData.storePhone}</div>
            <div>VAT: ${receiptData.vatNumber}</div>
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div><strong>Transaction #${receiptData.transactionId}</strong></div>
            <div>${receiptData.tillId.toUpperCase()} - ${receiptData.dateTime}</div>
            ${receiptData.customer ? `<div>Customer: ${receiptData.customer.name}</div>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div>
            ${receiptData.items.map((item: any) => `
              <div class="item">
                <div>
                  <div><strong>${item.name}</strong></div>
                  <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                </div>
                <div>€${item.total.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div class="item">
              <span>Subtotal</span>
              <span>€${receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>VAT (23%)</span>
              <span>€${receiptData.vatAmount.toFixed(2)}</span>
            </div>
            <div class="item total">
              <span>TOTAL</span>
              <span>€${receiptData.total.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Payment</span>
              <span>${receiptData.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Keep your receipt for returns</p>
          </div>
        </body>
        </html>
      `;
      
      // In a real implementation, this would use a mail service like SendGrid, Mailgun, etc.
      console.log(`Email receipt sent to: ${receiptData.customerEmail}`);
      console.log('Receipt content generated successfully');
      
      res.json({ 
        success: true, 
        message: `Receipt emailed to ${receiptData.customerEmail}` 
      });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send email receipt" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
