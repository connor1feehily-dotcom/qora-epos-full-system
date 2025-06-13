import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertSupplierSchema, insertTransactionSchema, insertTransactionItemSchema, insertPromotionSchema } from "@shared/schema";
import { z } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
