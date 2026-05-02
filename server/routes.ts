import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  processPayment, 
  processRefund, 
  getPaymentMethods, 
  validateCard 
} from "./routes/payment-routes";
import {
  getNotifications,
  markNotificationRead,
  registerMobileDevice,
  getSalesAlerts,
  getMobileInventory,
  adjustInventory,
  getPendingApprovals,
  processApproval,
  getMobileDashboard,
  getStaffShifts,
  approveShift
} from "./routes/mobile-routes";
import {
  getAiInsights,
  processNaturalLanguageQuery,
  getStaffPerformanceAnalytics,
  getCustomerBehaviorAnalytics,
  generateInventoryForecast,
  getStoreHealthDashboard,
  triggerAiAnalysis
} from "./routes/ai-routes";
import { scanDocket, importDelivery, getDeliveryHistory, getProductSuggestions } from "./routes/delivery-routes";
import stockTakeRoutes from "./routes/stock-take-routes";
import {
  payzoneInitiateSale,
  payzoneGetStatus,
  payzoneCancel,
  payzoneRefund,
  payzoneReconciliation,
  payzoneConfig
} from "./routes/payzone-routes";
import {
  topupGetOperators,
  topupProcess,
  topupConfig
} from "./routes/topup-routes";
import { securityHeaders } from "./security/pci-compliance";
import { insertProductSchema, insertCustomerSchema, insertSupplierSchema, insertTransactionSchema, insertTransactionItemSchema, insertPromotionSchema, insertOrganizationSchema } from "@shared/schema";
import { z } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security headers to all routes
  app.use(securityHeaders);
  
  // Multi-Tenant Organization Onboarding Routes
  
  // Get all business templates for onboarding
  app.get("/api/onboarding/business-templates", async (req, res) => {
    try {
      const templates = storage.getBusinessTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business templates" });
    }
  });

  // Get business templates by type
  app.get("/api/onboarding/business-templates/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const templates = storage.getBusinessTemplatesByType(type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business templates" });
    }
  });

  // Create new organization (shop onboarding)
  app.post("/api/onboarding/organizations", async (req, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const newOrg = storage.createOrganization(orgData);
      res.status(201).json(newOrg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid organization data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create organization" });
      }
    }
  });

  // Get organization by slug (for subdomain routing)
  app.get("/api/organizations/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const org = storage.getOrganizationBySlug(slug);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Get all organizations (platform admin)
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Create organization with business template
  app.post("/api/onboarding/create-shop", async (req, res) => {
    try {
      const { organization, templateId, adminUser } = req.body;
      
      // Validate organization data
      const orgData = insertOrganizationSchema.parse(organization);
      
      // Create the organization
      const newOrg = storage.createOrganization(orgData);
      
      // Get business template for initial setup
      let template = null;
      if (templateId) {
        template = storage.getBusinessTemplate(parseInt(templateId));
      }
      
      // Create admin user for the organization
      if (adminUser) {
        await storage.createUser({
          ...adminUser,
          organizationId: newOrg.id,
          role: 'admin'
        });
      }
      
      // If template is provided, create sample products
      if (template && template.defaultProducts && Array.isArray(template.defaultProducts)) {
        for (const product of template.defaultProducts as any[]) {
          await storage.createProduct({
            ...product,
            organizationId: newOrg.id
          });
        }
      }
      
      res.status(201).json({
        organization: newOrg,
        template,
        message: "Shop created successfully! You can now start selling."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid shop data", errors: error.errors });
      } else {
        console.error("Shop creation error:", error);
        res.status(500).json({ message: "Failed to create shop" });
      }
    }
  });
  
  // PCI DSS compliant payment routes
  app.post("/api/payment/process", ...processPayment);
  app.post("/api/payment/refund", ...processRefund);
  app.get("/api/payment/methods", ...getPaymentMethods);
  app.post("/api/payment/validate-card", ...validateCard);

  // Mobile companion app routes
  app.get("/api/mobile/notifications", ...getNotifications);
  app.put("/api/mobile/notifications/:notificationId/read", ...markNotificationRead);
  app.post("/api/mobile/device/register", ...registerMobileDevice);
  app.get("/api/mobile/sales-alerts", ...getSalesAlerts);
  app.get("/api/mobile/inventory", ...getMobileInventory);
  app.post("/api/mobile/inventory/adjust", ...adjustInventory);
  app.get("/api/mobile/approvals/pending", ...getPendingApprovals);
  app.post("/api/mobile/approvals/:approvalId/process", ...processApproval);
  app.get("/api/mobile/dashboard", ...getMobileDashboard);
  app.get("/api/mobile/shifts", ...getStaffShifts);
  app.post("/api/mobile/shifts/:shiftId/approve", ...approveShift);

  // ValBot AI Assistant routes
  app.get("/api/ai/insights", ...getAiInsights);
  app.post("/api/ai/query", ...processNaturalLanguageQuery);
  app.get("/api/ai/staff-performance", ...getStaffPerformanceAnalytics);
  app.get("/api/ai/customer-behavior", ...getCustomerBehaviorAnalytics);
  app.get("/api/ai/inventory-forecast", ...generateInventoryForecast);
  app.get("/api/ai/store-health", ...getStoreHealthDashboard);
  app.post("/api/ai/analyze", ...triggerAiAnalysis);

  // Delivery Management routes for Valerie
  app.post("/api/delivery/scan-docket", scanDocket);
  app.post("/api/delivery/import", importDelivery);
  app.get("/api/delivery/history", getDeliveryHistory);
  app.get("/api/delivery/product-suggestions", getProductSuggestions);

  // Supplier Dashboard Integration
  const { registerSupplierDashboardRoutes } = await import('./supplier-dashboard-routes');
  registerSupplierDashboardRoutes(app);

  // Stock Taking System Integration
  const { registerStockTakingRoutes } = await import('./routes/stock-taking-routes');
  registerStockTakingRoutes(app);
  app.get("/api/supplier-order-integration", async (req, res) => {
    try {
      const integrations = await storage.getSupplierOrderIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching supplier order integrations:', error);
      res.status(500).json({ error: 'Failed to fetch supplier order integrations' });
    }
  });

  app.get("/api/supplier-order-integration/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getSupplierOrderIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ error: 'Supplier order integration not found' });
      }
      
      res.json(integration);
    } catch (error) {
      console.error('Error fetching supplier order integration:', error);
      res.status(500).json({ error: 'Failed to fetch supplier order integration' });
    }
  });

  app.post("/api/supplier-order-integration/manual", async (req, res) => {
    try {
      const integrationData = {
        supplierId: req.body.supplierId,
        supplierOrderId: req.body.supplierOrderId || `SUP-${Date.now()}`,
        externalOrderNumber: req.body.externalOrderNumber,
        orderSource: req.body.orderSource || 'manual',
        orderData: req.body.orderData || {},
        orderItems: req.body.orderItems || [],
        totalAmount: req.body.totalAmount,
        currency: req.body.currency || 'EUR',
        orderDate: new Date(req.body.orderDate),
        expectedDeliveryDate: req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : null,
        status: req.body.status || 'pending_approval',
        orderedBy: req.body.orderedBy || 1,
        notes: req.body.notes
      };
      
      const integration = await storage.createSupplierOrderIntegration(integrationData);
      
      // Create notification for management
      await storage.createNotification({
        userId: null,
        type: 'supplier_order_approval',
        title: 'New Supplier Order Pending Approval',
        message: `Order ${integration.externalOrderNumber} from supplier requires approval`,
        data: { orderId: integration.id },
        priority: 'high'
      });
      
      res.json(integration);
    } catch (error) {
      console.error('Error creating supplier order integration:', error);
      res.status(500).json({ error: 'Failed to create supplier order integration' });
    }
  });

  app.post("/api/supplier-order-integration/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.body.userId || 1;
      
      const integration = await storage.getSupplierOrderIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: 'Supplier order integration not found' });
      }
      
      // Update integration status
      await storage.updateSupplierOrderIntegration(id, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      });
      
      // Create purchase order from the integration
      const purchaseOrder = await storage.createPurchaseOrder({
        supplierId: integration.supplierId,
        poNumber: `PO-SI-${integration.id}-${Date.now()}`,
        status: 'sent',
        totalAmount: integration.totalAmount,
        expectedDate: integration.expectedDeliveryDate || new Date(),
        createdBy: userId,
        notes: `Created from supplier order integration #${integration.id} - ${integration.externalOrderNumber}`
      });
      
      res.json({ 
        message: 'Supplier order approved and purchase order created',
        integration: await storage.getSupplierOrderIntegration(id),
        purchaseOrder 
      });
    } catch (error) {
      console.error('Error approving supplier order:', error);
      res.status(500).json({ error: 'Failed to approve supplier order' });
    }
  });

  app.post("/api/supplier-order-integration/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.body.userId || 1;
      const reason = req.body.reason || 'No reason provided';
      
      const integration = await storage.getSupplierOrderIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: 'Supplier order integration not found' });
      }
      
      // Update integration status
      await storage.updateSupplierOrderIntegration(id, {
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason
      });
      
      res.json({ 
        message: 'Supplier order rejected',
        integration: await storage.getSupplierOrderIntegration(id)
      });
    } catch (error) {
      console.error('Error rejecting supplier order:', error);
      res.status(500).json({ error: 'Failed to reject supplier order' });
    }
  });

  app.get("/api/email-order-capture", async (req, res) => {
    try {
      const captures = []; // Mock data for now
      res.json(captures);
    } catch (error) {
      console.error('Error fetching email order captures:', error);
      res.status(500).json({ error: 'Failed to fetch email order captures' });
    }
  });

  app.get("/api/supplier-webhooks", async (req, res) => {
    try {
      const webhooks = await storage.getSupplierWebhooks();
      res.json(webhooks);
    } catch (error) {
      console.error('Error fetching supplier webhooks:', error);
      res.status(500).json({ error: 'Failed to fetch supplier webhooks' });
    }
  });

  app.post("/api/supplier-webhooks", async (req, res) => {
    try {
      const webhook = await storage.createSupplierWebhook({
        ...req.body,
        secretKey: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventTypes: req.body.eventTypes || ['order_placed']
      });
      res.json(webhook);
    } catch (error) {
      console.error('Error creating supplier webhook:', error);
      res.status(500).json({ error: 'Failed to create supplier webhook' });
    }
  });
  // Z-Read and End of Day Reports
  app.post("/api/reports/z-read", async (req, res) => {
    try {
      const { tillId } = req.body;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      // Get all transactions for today
      const transactions = await storage.getTransactionsByDateRange(startOfDay, endOfDay, tillId);
      
      const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
      const totalVat = transactions.reduce((sum, t) => sum + parseFloat(t.vatAmount), 0);
      const cashSales = transactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + parseFloat(t.total), 0);
      const cardSales = transactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + parseFloat(t.total), 0);
      
      const zRead = {
        reportType: 'Z',
        tillId,
        reportDate: new Date(),
        totalSales,
        totalVat,
        transactionCount: transactions.length,
        cashSales,
        cardSales,
        openingFloat: 100.00, // Default opening float
        closingFloat: 100.00 + cashSales, // Opening + cash sales
        generatedBy: 1
      };
      
      res.json({ zRead, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate Z-read" });
    }
  });

  // Bank Settlement Report
  app.post("/api/reports/settlement", async (req, res) => {
    try {
      const { tillId, date } = req.body;
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const transactions = await storage.getTransactionsByDateRange(startOfDay, endOfDay, tillId);
      const cardTransactions = transactions.filter(t => t.paymentMethod === 'card');
      
      const settlement = {
        date: targetDate,
        tillId,
        totalCardSales: cardTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0),
        transactionCount: cardTransactions.length,
        averageTicket: cardTransactions.length > 0 ? cardTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0) / cardTransactions.length : 0,
        terminalId: `TERM_${tillId.toUpperCase()}`,
        merchantId: "KERRIGANS_XL_001",
        batchNumber: Math.floor(Math.random() * 10000),
        cardTransactions: cardTransactions.map(t => ({
          ...t,
          cardType: 'VISA/MC', // Mock card type
          authCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
          reference: `REF${t.id.toString().padStart(6, '0')}`
        }))
      };
      
      res.json(settlement);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate settlement report" });
    }
  });

  // Sales Report
  app.get("/api/reports/sales", async (req, res) => {
    try {
      const { tillId, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(new Date().setHours(0, 0, 0, 0));
      const end = endDate ? new Date(endDate as string) : new Date(new Date().setHours(23, 59, 59, 999));
      
      const transactions = await storage.getTransactionsByDateRange(start, end, tillId as string);
      
      const report = {
        period: { start, end },
        tillId,
        summary: {
          totalSales: transactions.reduce((sum, t) => sum + parseFloat(t.total), 0),
          totalTransactions: transactions.length,
          averageTicket: transactions.length > 0 ? transactions.reduce((sum, t) => sum + parseFloat(t.total), 0) / transactions.length : 0,
          cashSales: transactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + parseFloat(t.total), 0),
          cardSales: transactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + parseFloat(t.total), 0)
        },
        transactions
      };
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate sales report" });
    }
  });

  // Database seeding endpoint
  app.post("/api/seed", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { users, products, customers } = await import("@shared/schema");

      // Seed staff users
      await db.insert(users).values([
        {
          organizationId: 1,
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
          organizationId: 1,
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
          organizationId: 1,
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
          organizationId: 1,
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

      // Seed ONE test product only
      await db.insert(products).values([
        {
          organizationId: 1,
          name: 'Test Item',
          barcode: '1234567890123',
          price: '1.50',
          cost: '0.80',
          category: 'Test',
          stock: 100,
          minStock: 5,
          vatRate: '23.00',
          isActive: true
        }
      ]).onConflictDoNothing();

      // Seed default customer
      await db.insert(customers).values([
        {
          organizationId: 1,
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

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product by barcode" });
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
          organizationId: newTransaction.organizationId,
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
      const userData = req.body;
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

  // Reports routes for Z-reads and X-reads
  app.post('/api/reports/z-read', async (req, res) => {
    try {
      const { tillId, generatedBy } = req.body;
      const report = await storage.generateDailyReport(tillId, 'Z', generatedBy);
      res.json(report);
    } catch (error) {
      console.error('Z-Read generation error:', error);
      res.status(500).json({ message: 'Failed to generate Z-Read' });
    }
  });

  app.post('/api/reports/x-read', async (req, res) => {
    try {
      const { tillId, generatedBy } = req.body;
      const report = await storage.generateDailyReport(tillId, 'X', generatedBy);
      res.json(report);
    } catch (error) {
      console.error('X-Read generation error:', error);
      res.status(500).json({ message: 'Failed to generate X-Read' });
    }
  });

  app.get('/api/reports/last-z-read/:tillId', async (req, res) => {
    try {
      const { tillId } = req.params;
      const report = await storage.getLastZReport(tillId);
      if (!report) {
        return res.status(404).json({ message: 'No Z-Read found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Last Z-Read retrieval error:', error);
      res.status(500).json({ message: 'Failed to retrieve last Z-Read' });
    }
  });

  // Till session management routes
  app.get('/api/till-sessions/:tillId/current', async (req, res) => {
    try {
      const { tillId } = req.params;
      const session = await storage.getCurrentTillSession(tillId);
      res.json(session);
    } catch (error) {
      console.error('Till session retrieval error:', error);
      res.status(500).json({ message: 'Failed to retrieve till session' });
    }
  });

  app.post('/api/till-sessions/open', async (req, res) => {
    try {
      const sessionData = req.body;
      const session = await storage.openTillSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error('Till session open error:', error);
      res.status(500).json({ message: 'Failed to open till session' });
    }
  });

  app.post('/api/till-sessions/:sessionId/close', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { closingFloat, actualCash } = req.body;
      const session = await storage.closeTillSession(parseInt(sessionId), { closingFloat, actualCash });
      res.json(session);
    } catch (error) {
      console.error('Till session close error:', error);
      res.status(500).json({ message: 'Failed to close till session' });
    }
  });

  // Cash operations routes
  app.post('/api/cash-operations/no-sale', async (req, res) => {
    try {
      const { tillId, operatorId } = req.body;
      res.json({ success: true, message: 'Cash drawer opened (No Sale)' });
    } catch (error) {
      console.error('No-sale operation error:', error);
      res.status(500).json({ message: 'Failed to process no-sale operation' });
    }
  });

  app.post('/api/cash-operations/paid-out', async (req, res) => {
    try {
      const { tillId, amount, reason, operatorId } = req.body;
      res.json({ success: true, message: `Cash paid out: €${amount}` });
    } catch (error) {
      console.error('Cash paid out error:', error);
      res.status(500).json({ message: 'Failed to process cash paid out' });
    }
  });

  app.post('/api/cash-operations/add-float', async (req, res) => {
    try {
      const { tillId, amount, operatorId } = req.body;
      res.json({ success: true, message: `Added to float: €${amount}` });
    } catch (error) {
      console.error('Add to float error:', error);
      res.status(500).json({ message: 'Failed to add to float' });
    }
  });

  // Daily reports and analytics
  app.get('/api/reports/daily/:tillId', async (req, res) => {
    try {
      const { tillId } = req.params;
      const { date } = req.query;
      const reportDate = date ? new Date(date as string) : new Date();
      const reports = await storage.getDailyReports(tillId, reportDate);
      res.json(reports);
    } catch (error) {
      console.error('Daily reports error:', error);
      res.status(500).json({ message: 'Failed to retrieve daily reports' });
    }
  });

  app.get('/api/reports/till-sessions/:tillId', async (req, res) => {
    try {
      const { tillId } = req.params;
      const sessions = await storage.getTillSessions(tillId);
      res.json(sessions);
    } catch (error) {
      console.error('Till sessions retrieval error:', error);
      res.status(500).json({ message: 'Failed to retrieve till sessions' });
    }
  });

  // POS Button Configuration routes
  app.get("/api/pos-buttons", async (req, res) => {
    try {
      const { tillId } = req.query;
      const buttons = await storage.getPosButtons(tillId as string);
      res.json(buttons || []);
    } catch (error) {
      console.error("POS buttons fetch error:", error);
      res.json([]); // Return empty array instead of error object
    }
  });

  app.post("/api/pos-buttons", async (req, res) => {
    try {
      const buttonData = req.body;
      const button = await storage.createPosButton(buttonData);
      res.status(201).json(button);
    } catch (error) {
      res.status(500).json({ message: "Failed to create POS button" });
    }
  });

  app.put("/api/pos-buttons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const buttonData = req.body;
      const button = await storage.updatePosButton(id, buttonData);
      if (!button) {
        return res.status(404).json({ message: "POS button not found" });
      }
      res.json(button);
    } catch (error) {
      res.status(500).json({ message: "Failed to update POS button" });
    }
  });

  app.delete("/api/pos-buttons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePosButton(id);
      if (!success) {
        return res.status(404).json({ message: "POS button not found" });
      }
      res.json({ message: "POS button deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete POS button" });
    }
  });

  // Purchase Orders routes
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const orderData = req.body;
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  // Promotion Rules routes
  app.get("/api/promotion-rules", async (req, res) => {
    try {
      const rules = await storage.getPromotionRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotion rules" });
    }
  });

  app.post("/api/promotion-rules", async (req, res) => {
    try {
      const ruleData = req.body;
      const rule = await storage.createPromotionRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      res.status(500).json({ message: "Failed to create promotion rule" });
    }
  });

  // Stock Take Routes
  app.use("/api/stock-take", stockTakeRoutes);

  // Payzone Integrated Payments Routes
  app.get("/api/payzone/config", payzoneConfig);
  app.post("/api/payzone/sale", payzoneInitiateSale);
  app.get("/api/payzone/status/:transactionId", payzoneGetStatus);
  app.post("/api/payzone/cancel", payzoneCancel);
  app.post("/api/payzone/refund", payzoneRefund);
  app.post("/api/payzone/reconciliation", payzoneReconciliation);

  // Mobile Top-Up Routes
  app.get("/api/topup/config", topupConfig);
  app.get("/api/topup/operators", topupGetOperators);
  app.post("/api/topup/process", topupProcess);

  const httpServer = createServer(app);
  return httpServer;
}
