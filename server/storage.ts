import {
  users, products, customers, suppliers, transactions, transactionItems, promotions, tillSessions, dailyReports,
  posButtons, purchaseOrders, purchaseOrderItems, promotionRules, promotionProducts, auditLogs, staffSchedules,
  deliveryDockets, deliveryItems, supplierPerformance, staffActivityLog, priceOptimizations, systemAlerts, offlineQueue,
  batchEditOperations, expiryTracking, stockForecasting, timeClock, staffIncentives, staffMessages,
  productPerformance, customAlerts, demandForecasting, qrSupplierReceiving, promotionTemplates, customerInsights, pushNotifications,
  supplierOrderIntegration, emailOrderCapture, supplierWebhooks, notifications, organizations, businessTemplates,
  type User, type Product, type Customer, type Supplier, type Transaction, type TransactionItem, type Promotion,
  type TillSession, type DailyReport, type PosButton, type PurchaseOrder, type PurchaseOrderItem,
  type PromotionRule, type PromotionProduct, type AuditLog, type StaffSchedule,
  type DeliveryDocket, type DeliveryItem, type SupplierPerformance, type StaffActivityLog,
  type PriceOptimization, type SystemAlert, type OfflineQueue,
  type BatchEditOperation, type ExpiryTracking, type StockForecasting, type TimeClock, type StaffIncentive,
  type StaffMessage, type ProductPerformance, type CustomAlert, type DemandForecasting,
  type QrSupplierReceiving, type PromotionTemplate, type CustomerInsight, type PushNotification,
  type SupplierOrderIntegration, type EmailOrderCapture, type SupplierWebhook,
  type Organization, type BusinessTemplate,
  type InsertUser, type InsertProduct, type InsertCustomer, type InsertSupplier, 
  type InsertTransaction, type InsertTransactionItem, type InsertPromotion,
  type InsertTillSession, type InsertDailyReport, type InsertPosButton, type InsertPurchaseOrder,
  type InsertPurchaseOrderItem, type InsertPromotionRule, type InsertPromotionProduct, 
  type InsertAuditLog, type InsertStaffSchedule, type InsertDeliveryDocket, type InsertDeliveryItem,
  type InsertSupplierPerformance, type InsertStaffActivityLog, type InsertPriceOptimization,
  type InsertSystemAlert, type InsertOfflineQueue,
  type InsertBatchEditOperation, type InsertExpiryTracking, type InsertStockForecasting, type InsertTimeClock,
  type InsertStaffIncentive, type InsertStaffMessage, type InsertProductPerformance, type InsertCustomAlert,
  type InsertDemandForecasting, type InsertQrSupplierReceiving, type InsertPromotionTemplate,
  type InsertCustomerInsight, type InsertPushNotification,
  type InsertSupplierOrderIntegration, type InsertEmailOrderCapture, type InsertSupplierWebhook,
  type InsertOrganization, type InsertBusinessTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByDateRange(startDate: Date, endDate: Date, tillId?: string): Promise<Transaction[]>;
  getTransactionItems(transactionId: number): Promise<TransactionItem[]>;
  addTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  
  // Promotions
  getPromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;
  
  // Till Sessions
  getCurrentTillSession(tillId: string): Promise<TillSession | undefined>;
  openTillSession(session: InsertTillSession): Promise<TillSession>;
  closeTillSession(sessionId: number, closingData: { closingFloat: number; actualCash: number }): Promise<TillSession>;
  getTillSessions(tillId?: string): Promise<TillSession[]>;
  
  // Daily Reports
  generateDailyReport(tillId: string, reportType: 'X' | 'Z', generatedBy: number): Promise<DailyReport>;
  getDailyReports(tillId?: string, date?: Date): Promise<DailyReport[]>;
  getLastZReport(tillId: string): Promise<DailyReport | undefined>;
  
  // POS Button Configuration
  getPosButtons(tillId?: string): Promise<PosButton[]>;
  createPosButton(button: InsertPosButton): Promise<PosButton>;
  updatePosButton(id: number, button: Partial<InsertPosButton>): Promise<PosButton | undefined>;
  deletePosButton(id: number): Promise<boolean>;
  
  // Purchase Orders
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  getPurchaseOrderItems(poId: number): Promise<PurchaseOrderItem[]>;
  addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  
  // Promotion Rules
  getPromotionRules(): Promise<PromotionRule[]>;
  getPromotionRule(id: number): Promise<PromotionRule | undefined>;
  createPromotionRule(rule: InsertPromotionRule): Promise<PromotionRule>;
  updatePromotionRule(id: number, rule: Partial<InsertPromotionRule>): Promise<PromotionRule | undefined>;
  deletePromotionRule(id: number): Promise<boolean>;
  getPromotionProducts(promotionId: number): Promise<PromotionProduct[]>;
  addPromotionProduct(item: InsertPromotionProduct): Promise<PromotionProduct>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId?: number, tableName?: string): Promise<AuditLog[]>;
  
  // Staff Schedules
  getStaffSchedules(userId?: number, date?: Date): Promise<StaffSchedule[]>;
  createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule>;
  updateStaffSchedule(id: number, schedule: Partial<InsertStaffSchedule>): Promise<StaffSchedule | undefined>;
  
  // Delivery Management
  getDeliveryDockets(status?: string): Promise<DeliveryDocket[]>;
  createDeliveryDocket(docket: InsertDeliveryDocket): Promise<DeliveryDocket>;
  getDeliveryItems(docketId: number): Promise<DeliveryItem[]>;
  createDeliveryItem(item: InsertDeliveryItem): Promise<DeliveryItem>;
  approveDeliveryDocket(docketId: number, approvedBy: number): Promise<DeliveryDocket>;
  
  // Supplier Performance
  getSupplierPerformance(supplierId?: number): Promise<SupplierPerformance[]>;
  createSupplierPerformance(performance: InsertSupplierPerformance): Promise<SupplierPerformance>;
  
  // Staff Activity Logging
  createStaffActivity(activity: InsertStaffActivityLog): Promise<StaffActivityLog>;
  getStaffActivities(userId?: number, action?: string): Promise<StaffActivityLog[]>;
  
  // AI Price Optimization
  getPriceOptimizations(): Promise<PriceOptimization[]>;
  createPriceOptimization(optimization: InsertPriceOptimization): Promise<PriceOptimization>;
  applyPriceOptimization(optimizationId: number, userId: number): Promise<PriceOptimization>;
  
  // System Alerts
  getSystemAlerts(severity?: string, resolved?: boolean): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  resolveSystemAlert(alertId: number, resolvedBy: number): Promise<SystemAlert>;
  
  // Offline Sync
  addToOfflineQueue(operation: InsertOfflineQueue): Promise<OfflineQueue>;
  getOfflineQueue(deviceId: string): Promise<OfflineQueue[]>;
  markOfflineOperationSynced(operationId: number): Promise<void>;
  
  // Advanced Features - New Interface Methods
  
  // Batch Edit Operations
  createBatchEditOperation(operation: InsertBatchEditOperation): Promise<BatchEditOperation>;
  getBatchEditOperations(status?: string): Promise<BatchEditOperation[]>;
  updateBatchEditOperation(id: number, updates: Partial<InsertBatchEditOperation>): Promise<BatchEditOperation>;
  
  // Expiry Tracking
  getExpiryTracking(productId?: number, status?: string): Promise<ExpiryTracking[]>;
  createExpiryTracking(tracking: InsertExpiryTracking): Promise<ExpiryTracking>;
  updateExpiryTracking(id: number, updates: Partial<InsertExpiryTracking>): Promise<ExpiryTracking>;
  getExpiringProducts(daysAhead: number): Promise<ExpiryTracking[]>;
  
  // Stock Forecasting
  getStockForecasting(productId?: number): Promise<StockForecasting[]>;
  createStockForecasting(forecast: InsertStockForecasting): Promise<StockForecasting>;
  updateStockForecasting(id: number, updates: Partial<InsertStockForecasting>): Promise<StockForecasting>;
  getReorderSuggestions(): Promise<StockForecasting[]>;
  
  // Time Clock
  getTimeClock(userId?: number, status?: string): Promise<TimeClock[]>;
  createTimeClock(clock: InsertTimeClock): Promise<TimeClock>;
  updateTimeClock(id: number, updates: Partial<InsertTimeClock>): Promise<TimeClock>;
  clockInUser(userId: number, tillId?: string): Promise<TimeClock>;
  clockOutUser(userId: number): Promise<TimeClock>;
  
  // Staff Incentives
  getStaffIncentives(userId?: number, status?: string): Promise<StaffIncentive[]>;
  createStaffIncentive(incentive: InsertStaffIncentive): Promise<StaffIncentive>;
  updateStaffIncentive(id: number, updates: Partial<InsertStaffIncentive>): Promise<StaffIncentive>;
  getActiveIncentives(userId: number): Promise<StaffIncentive[]>;
  
  // Staff Messages
  getStaffMessages(userId?: number, messageType?: string): Promise<StaffMessage[]>;
  createStaffMessage(message: InsertStaffMessage): Promise<StaffMessage>;
  markMessageAsRead(messageId: number): Promise<StaffMessage>;
  getBulletins(tillId?: string): Promise<StaffMessage[]>;
  
  // Product Performance
  getProductPerformance(productId?: number, date?: Date): Promise<ProductPerformance[]>;
  createProductPerformance(performance: InsertProductPerformance): Promise<ProductPerformance>;
  updateProductPerformance(id: number, updates: Partial<InsertProductPerformance>): Promise<ProductPerformance>;
  getTopPerformingProducts(limit: number): Promise<ProductPerformance[]>;
  
  // Custom Alerts
  getCustomAlerts(isActive?: boolean): Promise<CustomAlert[]>;
  createCustomAlert(alert: InsertCustomAlert): Promise<CustomAlert>;
  updateCustomAlert(id: number, updates: Partial<InsertCustomAlert>): Promise<CustomAlert>;
  triggerCustomAlert(alertId: number): Promise<CustomAlert>;
  
  // Demand Forecasting
  getDemandForecasting(productId?: number, date?: Date): Promise<DemandForecasting[]>;
  createDemandForecasting(forecast: InsertDemandForecasting): Promise<DemandForecasting>;
  updateDemandForecasting(id: number, updates: Partial<InsertDemandForecasting>): Promise<DemandForecasting>;
  
  // QR Supplier Receiving
  getQrSupplierReceiving(status?: string): Promise<QrSupplierReceiving[]>;
  createQrSupplierReceiving(receiving: InsertQrSupplierReceiving): Promise<QrSupplierReceiving>;
  updateQrSupplierReceiving(id: number, updates: Partial<InsertQrSupplierReceiving>): Promise<QrSupplierReceiving>;
  
  // Promotion Templates
  getPromotionTemplates(isActive?: boolean): Promise<PromotionTemplate[]>;
  createPromotionTemplate(template: InsertPromotionTemplate): Promise<PromotionTemplate>;
  updatePromotionTemplate(id: number, updates: Partial<InsertPromotionTemplate>): Promise<PromotionTemplate>;
  
  // Customer Insights
  getCustomerInsights(customerId?: number): Promise<CustomerInsight[]>;
  createCustomerInsight(insight: InsertCustomerInsight): Promise<CustomerInsight>;
  updateCustomerInsight(id: number, updates: Partial<InsertCustomerInsight>): Promise<CustomerInsight>;
  
  // Push Notifications
  getPushNotifications(userId?: number, status?: string): Promise<PushNotification[]>;
  createPushNotification(notification: InsertPushNotification): Promise<PushNotification>;
  updatePushNotification(id: number, updates: Partial<InsertPushNotification>): Promise<PushNotification>;
  
  // Supplier Order Integration
  getSupplierOrderIntegrations(): Promise<SupplierOrderIntegration[]>;
  getSupplierOrderIntegration(id: number): Promise<SupplierOrderIntegration | undefined>;
  createSupplierOrderIntegration(integration: InsertSupplierOrderIntegration): Promise<SupplierOrderIntegration>;
  updateSupplierOrderIntegration(id: number, updates: Partial<InsertSupplierOrderIntegration>): Promise<SupplierOrderIntegration>;
  
  // Email Order Capture
  getEmailOrderCaptures(): Promise<EmailOrderCapture[]>;
  getEmailOrderCapture(id: number): Promise<EmailOrderCapture | undefined>;
  createEmailOrderCapture(capture: InsertEmailOrderCapture): Promise<EmailOrderCapture>;
  updateEmailOrderCapture(id: number, updates: Partial<InsertEmailOrderCapture>): Promise<EmailOrderCapture>;
  
  // Supplier Webhooks
  getSupplierWebhooks(): Promise<SupplierWebhook[]>;
  getSupplierWebhook(id: number): Promise<SupplierWebhook | undefined>;
  createSupplierWebhook(webhook: InsertSupplierWebhook): Promise<SupplierWebhook>;
  updateSupplierWebhook(id: number, updates: Partial<InsertSupplierWebhook>): Promise<SupplierWebhook>;
  
  // Notifications
  createNotification(notification: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if admin user exists
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        // Create default admin user
        await this.createUser({
          username: "admin",
          password: "admin123",
          pin: "0000",
          role: "admin",
          firstName: "System",
          lastName: "Administrator",
          employeeId: "ADMIN001",
          isActive: true,
        });
      }

      // Check if default staff exists
      const existingStaff = await this.getUserByUsername("staff");
      if (!existingStaff) {
        await this.createUser({
          username: "staff",
          password: "staff123",
          pin: "1234",
          role: "staff",
          firstName: "Store",
          lastName: "Staff",
          employeeId: "STAFF001",
          isActive: true,
        });
      }

      // Check if manager exists
      const existingManager = await this.getUserByUsername("manager");
      if (!existingManager) {
        await this.createUser({
          username: "manager",
          password: "manager123",
          pin: "9999",
          role: "manager",
          firstName: "Store",
          lastName: "Manager",
          employeeId: "MGR001",
          isActive: true,
        });
      }
    } catch (error) {
      console.log("Database seeding skipped - tables may not exist yet");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(productUpdate).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(customerUpdate).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(insertSupplier).returning();
    return supplier;
  }

  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers).set(supplierUpdate).where(eq(suppliers.id, id)).returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date, tillId?: string): Promise<Transaction[]> {
    let query = db.select().from(transactions).where(
      and(
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      )
    );
    
    if (tillId) {
      query = query.where(eq(transactions.tillId, tillId));
    }
    
    return await query;
  }

  async getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
    return await db.select().from(transactionItems).where(eq(transactionItems.transactionId, transactionId));
  }

  async addTransactionItem(insertItem: InsertTransactionItem): Promise<TransactionItem> {
    const [item] = await db.insert(transactionItems).values(insertItem).returning();
    return item;
  }

  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions);
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));
    return promotion || undefined;
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const [promotion] = await db.insert(promotions).values(insertPromotion).returning();
    return promotion;
  }

  async updatePromotion(id: number, promotionUpdate: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const [promotion] = await db.update(promotions).set(promotionUpdate).where(eq(promotions.id, id)).returning();
    return promotion || undefined;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db.delete(promotions).where(eq(promotions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Till Sessions
  async getCurrentTillSession(tillId: string): Promise<TillSession | undefined> {
    const [session] = await db.select().from(tillSessions)
      .where(and(eq(tillSessions.tillId, tillId), eq(tillSessions.isActive, true)));
    return session || undefined;
  }

  async openTillSession(insertSession: InsertTillSession): Promise<TillSession> {
    const [session] = await db.insert(tillSessions).values(insertSession).returning();
    return session;
  }

  async closeTillSession(sessionId: number, closingData: { closingFloat: number; actualCash: number }): Promise<TillSession> {
    const expectedCash = closingData.actualCash; // Calculate from transactions
    const variance = closingData.actualCash - expectedCash;
    
    const [session] = await db.update(tillSessions)
      .set({
        closingFloat: closingData.closingFloat.toString(),
        actualCash: closingData.actualCash.toString(),
        expectedCash: expectedCash.toString(),
        variance: variance.toString(),
        closedAt: new Date(),
        isActive: false
      })
      .where(eq(tillSessions.id, sessionId))
      .returning();
    return session;
  }

  async getTillSessions(tillId?: string): Promise<TillSession[]> {
    if (tillId) {
      return await db.select().from(tillSessions).where(eq(tillSessions.tillId, tillId));
    }
    return await db.select().from(tillSessions);
  }

  // Daily Reports
  async generateDailyReport(tillId: string, reportType: 'X' | 'Z', generatedBy: number): Promise<DailyReport> {
    // Calculate sales data from transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactionData = await db.select().from(transactions)
      .where(eq(transactions.tillId, tillId));
    
    const totalSales = transactionData.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalVat = transactionData.reduce((sum, t) => sum + parseFloat(t.vatAmount), 0);
    const cashSales = transactionData.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + parseFloat(t.total), 0);
    const cardSales = transactionData.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + parseFloat(t.total), 0);

    const currentSession = await this.getCurrentTillSession(tillId);

    const reportData: InsertDailyReport = {
      tillId,
      reportType,
      totalSales: totalSales.toString(),
      totalVat: totalVat.toString(),
      transactionCount: transactionData.length,
      cashSales: cashSales.toString(),
      cardSales: cardSales.toString(),
      openingFloat: currentSession?.openingFloat || '0',
      closingFloat: currentSession?.closingFloat || '0',
      generatedBy
    };

    const [report] = await db.insert(dailyReports).values(reportData).returning();
    return report;
  }

  async getDailyReports(tillId?: string, date?: Date): Promise<DailyReport[]> {
    if (tillId) {
      return await db.select().from(dailyReports).where(eq(dailyReports.tillId, tillId));
    }
    return await db.select().from(dailyReports);
  }

  async getLastZReport(tillId: string): Promise<DailyReport | undefined> {
    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.tillId, tillId), eq(dailyReports.reportType, 'Z')))
      .orderBy(desc(dailyReports.reportDate))
      .limit(1);
    return report || undefined;
  }

  // POS Button Configuration
  async getPosButtons(tillId?: string): Promise<PosButton[]> {
    if (tillId) {
      return await db.select().from(posButtons)
        .where(and(eq(posButtons.tillId, tillId), eq(posButtons.isActive, true)))
        .orderBy(posButtons.position);
    }
    return await db.select().from(posButtons)
      .where(eq(posButtons.isActive, true))
      .orderBy(posButtons.position);
  }

  async createPosButton(button: InsertPosButton): Promise<PosButton> {
    const [newButton] = await db.insert(posButtons).values(button).returning();
    return newButton;
  }

  async updatePosButton(id: number, button: Partial<InsertPosButton>): Promise<PosButton | undefined> {
    const [updated] = await db.update(posButtons).set(button).where(eq(posButtons.id, id)).returning();
    return updated || undefined;
  }

  async deletePosButton(id: number): Promise<boolean> {
    const result = await db.delete(posButtons).where(eq(posButtons.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po || undefined;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [newPO] = await db.insert(purchaseOrders).values(po).returning();
    return newPO;
  }

  async updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders).set(po).where(eq(purchaseOrders.id, id)).returning();
    return updated || undefined;
  }

  async getPurchaseOrderItems(poId: number): Promise<PurchaseOrderItem[]> {
    return await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }

  async addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [newItem] = await db.insert(purchaseOrderItems).values(item).returning();
    return newItem;
  }

  // Promotion Rules
  async getPromotionRules(): Promise<PromotionRule[]> {
    return await db.select().from(promotionRules).where(eq(promotionRules.isActive, true));
  }

  async getPromotionRule(id: number): Promise<PromotionRule | undefined> {
    const [rule] = await db.select().from(promotionRules).where(eq(promotionRules.id, id));
    return rule || undefined;
  }

  async createPromotionRule(rule: InsertPromotionRule): Promise<PromotionRule> {
    const [newRule] = await db.insert(promotionRules).values(rule).returning();
    return newRule;
  }

  async updatePromotionRule(id: number, rule: Partial<InsertPromotionRule>): Promise<PromotionRule | undefined> {
    const [updated] = await db.update(promotionRules).set(rule).where(eq(promotionRules.id, id)).returning();
    return updated || undefined;
  }

  async deletePromotionRule(id: number): Promise<boolean> {
    const result = await db.delete(promotionRules).where(eq(promotionRules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPromotionProducts(promotionId: number): Promise<PromotionProduct[]> {
    return await db.select().from(promotionProducts).where(eq(promotionProducts.promotionId, promotionId));
  }

  async addPromotionProduct(item: InsertPromotionProduct): Promise<PromotionProduct> {
    const [newItem] = await db.insert(promotionProducts).values(item).returning();
    return newItem;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(userId?: number, tableName?: string): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    
    if (userId && tableName) {
      query = query.where(and(eq(auditLogs.userId, userId), eq(auditLogs.tableName, tableName)));
    } else if (userId) {
      query = query.where(eq(auditLogs.userId, userId));
    } else if (tableName) {
      query = query.where(eq(auditLogs.tableName, tableName));
    }
    
    return await query;
  }

  // Staff Schedules
  async getStaffSchedules(userId?: number, date?: Date): Promise<StaffSchedule[]> {
    let query = db.select().from(staffSchedules).orderBy(staffSchedules.shiftStart);
    
    if (userId && date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(and(
        eq(staffSchedules.userId, userId),
        // Filter by date range would need additional logic
      ));
    } else if (userId) {
      query = query.where(eq(staffSchedules.userId, userId));
    }
    
    return await query;
  }

  async createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule> {
    const [newSchedule] = await db.insert(staffSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateStaffSchedule(id: number, schedule: Partial<InsertStaffSchedule>): Promise<StaffSchedule | undefined> {
    const [updated] = await db.update(staffSchedules).set(schedule).where(eq(staffSchedules.id, id)).returning();
    return updated || undefined;
  }

  // Supplier Order Integration
  async getSupplierOrderIntegrations(): Promise<SupplierOrderIntegration[]> {
    return await db.select().from(supplierOrderIntegration).orderBy(desc(supplierOrderIntegration.createdAt));
  }

  async getSupplierOrderIntegration(id: number): Promise<SupplierOrderIntegration | undefined> {
    const [integration] = await db.select().from(supplierOrderIntegration).where(eq(supplierOrderIntegration.id, id));
    return integration || undefined;
  }

  async createSupplierOrderIntegration(integration: InsertSupplierOrderIntegration): Promise<SupplierOrderIntegration> {
    const [newIntegration] = await db.insert(supplierOrderIntegration).values(integration).returning();
    return newIntegration;
  }

  async updateSupplierOrderIntegration(id: number, updates: Partial<InsertSupplierOrderIntegration>): Promise<SupplierOrderIntegration> {
    const [updated] = await db.update(supplierOrderIntegration)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierOrderIntegration.id, id))
      .returning();
    return updated;
  }

  // Email Order Capture
  async getEmailCaptures(): Promise<EmailOrderCapture[]> {
    return await db.select().from(emailOrderCapture).orderBy(desc(emailOrderCapture.receivedAt));
  }

  async getEmailOrderCapture(id: number): Promise<EmailOrderCapture | undefined> {
    const [capture] = await db.select().from(emailOrderCapture).where(eq(emailOrderCapture.id, id));
    return capture || undefined;
  }

  async createEmailOrderCapture(capture: InsertEmailOrderCapture): Promise<EmailOrderCapture> {
    const [newCapture] = await db.insert(emailOrderCapture).values(capture).returning();
    return newCapture;
  }

  async updateEmailOrderCapture(id: number, updates: Partial<InsertEmailOrderCapture>): Promise<EmailOrderCapture> {
    const [updated] = await db.update(emailOrderCapture)
      .set(updates)
      .where(eq(emailOrderCapture.id, id))
      .returning();
    return updated;
  }

  // Supplier Webhooks
  async getSupplierWebhooks(): Promise<SupplierWebhook[]> {
    return await db.select().from(supplierWebhooks).orderBy(desc(supplierWebhooks.createdAt));
  }

  async getSupplierWebhook(id: number): Promise<SupplierWebhook | undefined> {
    const [webhook] = await db.select().from(supplierWebhooks).where(eq(supplierWebhooks.id, id));
    return webhook || undefined;
  }

  async createSupplierWebhook(webhook: InsertSupplierWebhook): Promise<SupplierWebhook> {
    const [newWebhook] = await db.insert(supplierWebhooks).values(webhook).returning();
    return newWebhook;
  }

  // Supplier Order Integration
  async getSupplierOrders(): Promise<SupplierOrderIntegration[]> {
    return await db.select().from(supplierOrderIntegration).orderBy(desc(supplierOrderIntegration.createdAt));
  }

  async getSupplierOrder(id: number): Promise<SupplierOrderIntegration | undefined> {
    const [order] = await db.select().from(supplierOrderIntegration).where(eq(supplierOrderIntegration.id, id));
    return order || undefined;
  }

  async createSupplierOrder(order: InsertSupplierOrderIntegration): Promise<SupplierOrderIntegration> {
    const [newOrder] = await db.insert(supplierOrderIntegration).values(order).returning();
    return newOrder;
  }

  async updateSupplierOrder(id: number, updates: Partial<InsertSupplierOrderIntegration>): Promise<SupplierOrderIntegration> {
    const [updated] = await db.update(supplierOrderIntegration)
      .set(updates)
      .where(eq(supplierOrderIntegration.id, id))
      .returning();
    return updated;
  }

  async updateSupplierWebhook(id: number, updates: Partial<InsertSupplierWebhook>): Promise<SupplierWebhook> {
    const [updated] = await db.update(supplierWebhooks)
      .set(updates)
      .where(eq(supplierWebhooks.id, id))
      .returning();
    return updated;
  }

  // Notifications - simple implementation
  async createNotification(notification: any): Promise<any> {
    try {
      const [newNotification] = await db.insert(notifications).values({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority || 'normal',
        isRead: false
      }).returning();
      return newNotification;
    } catch (error) {
      // Fallback if notifications table doesn't exist
      return { id: Date.now(), ...notification };
    }
  }
}

// Multi-tenant memory storage - supports organizations and business templates
export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private businessTemplates: Map<number, BusinessTemplate>;
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private suppliers: Map<number, Supplier>;
  private transactions: Map<number, Transaction>;
  private transactionItems: Map<number, TransactionItem>;
  private promotions: Map<number, Promotion>;
  private currentId: number;
  private defaultOrgId: number = 1; // Default organization for backward compatibility

  constructor() {
    this.organizations = new Map();
    this.businessTemplates = new Map();
    this.users = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.transactions = new Map();
    this.transactionItems = new Map();
    this.promotions = new Map();
    this.currentId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Create default organization (Kerrigans XL)
    this.createOrganization({
      name: "Kerrigan's XL",
      slug: "kerrigans-xl",
      businessType: "retail",
      address: "Manorhamilton, Co. Leitrim",
      phone: "+353-71-985-5000",
      email: "info@kerrigans.ie",
      timezone: "Europe/Dublin",
      currency: "EUR",
      vatEnabled: true,
      defaultVatRate: "23.00",
      settings: {
        allowCashDrawer: true,
        requireReceiptPrint: true,
        enableLoyaltyProgram: false,
        autoBackup: true
      },
      plan: "pro",
      isActive: true
    });

    // Create business templates
    this.seedBusinessTemplates();

    // Create default users for the default organization
    this.createUser({
      organizationId: this.defaultOrgId,
      username: 'admin',
      password: 'admin123',
      pin: '0000',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      employeeId: 'ADMIN001',
      isActive: true
    });

    this.createUser({
      organizationId: this.defaultOrgId,
      username: 'staff',
      password: 'staff123',
      pin: '1234',
      role: 'staff',
      firstName: 'Store',
      lastName: 'Staff',
      employeeId: 'STAFF001',
      isActive: true
    });

    this.createUser({
      organizationId: this.defaultOrgId,
      username: 'manager',
      password: 'manager123',
      pin: '9999',
      role: 'manager',
      firstName: 'Store',
      lastName: 'Manager',
      employeeId: 'MGR001',
      isActive: true
    });

    // Create sample products for the default organization
    const sampleProducts = [
      { organizationId: this.defaultOrgId, name: 'Coca Cola 500ml', barcode: '5449000214911', price: '1.50', cost: '0.80', category: 'Drinks', stock: 24, minStock: 5, vatRate: '23.00', isActive: true },
      { name: 'Diesel', barcode: '', price: '1.42', cost: '1.20', category: 'Fuel', stock: 1000, minStock: 100, vatRate: '23.00', isActive: true },
      { name: 'White Bread', barcode: '5099821001236', price: '2.20', cost: '1.50', category: 'Food', stock: 12, minStock: 3, vatRate: '0.00', isActive: true },
      { name: 'Coffee Large', barcode: '', price: '2.80', cost: '1.00', category: 'Hot Drinks', stock: 50, minStock: 10, vatRate: '13.50', isActive: true },
      { name: 'Irish Times', barcode: '', price: '2.50', cost: '1.80', category: 'News', stock: 15, minStock: 5, vatRate: '0.00', isActive: true },
      { name: 'Marlboro Gold', barcode: '', price: '14.50', cost: '12.00', category: 'Tobacco', stock: 8, minStock: 2, vatRate: '23.00', isActive: true }
    ];

    sampleProducts.forEach(product => this.createProduct(product));

    // Create sample customer for the default organization
    this.createCustomer({
      organizationId: this.defaultOrgId,
      name: 'Walk-in Customer',
      email: '',
      phone: '',
      address: '',
      loyaltyPoints: 0,
      isActive: true
    });
  }

  // Organization Management
  createOrganization(insertOrg: InsertOrganization): Organization {
    const id = this.currentId++;
    const org: Organization = { 
      ...insertOrg, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.organizations.set(id, org);
    return org;
  }

  getOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  getOrganization(id: number): Organization | undefined {
    return this.organizations.get(id);
  }

  getOrganizationBySlug(slug: string): Organization | undefined {
    return Array.from(this.organizations.values()).find(org => org.slug === slug);
  }

  // Business Templates
  private seedBusinessTemplates() {
    const templates = [
      {
        name: "Café & Coffee Shop",
        businessType: "cafe",
        description: "Perfect for cafés, coffee shops, and bistros",
        defaultProducts: [
          { name: "Espresso", category: "Hot Drinks", price: "2.50", cost: "0.40", vatRate: "13.50" },
          { name: "Cappuccino", category: "Hot Drinks", price: "3.20", cost: "0.60", vatRate: "13.50" },
          { name: "Croissant", category: "Pastries", price: "2.80", cost: "1.20", vatRate: "13.50" },
          { name: "Sandwich", category: "Food", price: "5.50", cost: "2.20", vatRate: "13.50" }
        ],
        defaultCategories: ["Hot Drinks", "Cold Drinks", "Pastries", "Food", "Snacks"],
        defaultSettings: { requireReceiptPrint: true, enableLoyaltyProgram: true, allowTips: true },
        isActive: true
      },
      {
        name: "Pub & Bar",
        businessType: "pub",
        description: "Traditional pubs and bars with drinks and optional food service",
        defaultProducts: [
          { name: "Pint of Beer", category: "Draught", price: "5.20", cost: "1.80", vatRate: "23.00" },
          { name: "Glass of Wine", category: "Wine", price: "6.50", cost: "2.20", vatRate: "23.00" },
          { name: "Whiskey Single", category: "Spirits", price: "4.80", cost: "1.60", vatRate: "23.00" },
          { name: "Soft Drink", category: "Non-Alcoholic", price: "2.50", cost: "0.80", vatRate: "23.00" },
          { name: "Fish & Chips", category: "Food", price: "12.50", cost: "4.50", vatRate: "13.50" },
          { name: "Burger & Chips", category: "Food", price: "14.00", cost: "5.20", vatRate: "13.50" },
          { name: "Chicken Wings", category: "Food", price: "8.50", cost: "3.20", vatRate: "13.50" }
        ],
        defaultCategories: ["Draught", "Wine", "Spirits", "Non-Alcoholic", "Food", "Snacks"],
        defaultSettings: { requireReceiptPrint: true, allowTips: true, ageVerification: true, foodService: true },
        isActive: true
      },
      {
        name: "Restaurant",
        businessType: "restaurant",
        description: "Full service restaurants with table service and comprehensive menus",
        defaultProducts: [
          { name: "Starter - Soup", category: "Starters", price: "6.50", cost: "2.20", vatRate: "13.50" },
          { name: "Main - Steak", category: "Mains", price: "28.00", cost: "12.50", vatRate: "13.50" },
          { name: "Main - Pasta", category: "Mains", price: "16.50", cost: "5.20", vatRate: "13.50" },
          { name: "Dessert - Cake", category: "Desserts", price: "7.50", cost: "2.80", vatRate: "13.50" },
          { name: "Wine Bottle", category: "Beverages", price: "25.00", cost: "8.50", vatRate: "23.00" },
          { name: "Coffee", category: "Beverages", price: "3.20", cost: "0.60", vatRate: "13.50" }
        ],
        defaultCategories: ["Starters", "Mains", "Desserts", "Beverages", "Specials"],
        defaultSettings: { requireReceiptPrint: true, allowTips: true, tableService: true, reservations: true },
        isActive: true
      },
      {
        name: "Garage & Petrol Station",
        businessType: "garage",
        description: "Petrol stations, garages, and automotive service centers",
        defaultProducts: [
          { name: "Petrol", category: "Fuel", price: "1.45", cost: "1.25", vatRate: "23.00" },
          { name: "Diesel", category: "Fuel", price: "1.42", cost: "1.22", vatRate: "23.00" },
          { name: "Engine Oil", category: "Automotive", price: "25.00", cost: "12.50", vatRate: "23.00" },
          { name: "Car Wash", category: "Services", price: "8.00", cost: "2.50", vatRate: "23.00" },
          { name: "Coffee", category: "Shop", price: "2.20", cost: "0.50", vatRate: "13.50" },
          { name: "Cigarettes", category: "Shop", price: "14.50", cost: "12.80", vatRate: "23.00" }
        ],
        defaultCategories: ["Fuel", "Automotive", "Services", "Shop", "Convenience"],
        defaultSettings: { requireReceiptPrint: true, fuelPumps: true, payAtPump: true, loyaltyProgram: true },
        isActive: true
      },
      {
        name: "Off License",
        businessType: "offlicense",
        description: "Licensed premises selling alcohol for off-premises consumption",
        defaultProducts: [
          { name: "Beer 6-Pack", category: "Beer", price: "8.50", cost: "5.20", vatRate: "23.00" },
          { name: "Wine Bottle", category: "Wine", price: "12.99", cost: "7.50", vatRate: "23.00" },
          { name: "Vodka 700ml", category: "Spirits", price: "22.00", cost: "16.50", vatRate: "23.00" },
          { name: "Cigarettes", category: "Tobacco", price: "14.50", cost: "12.80", vatRate: "23.00" },
          { name: "Soft Drinks", category: "Non-Alcoholic", price: "1.80", cost: "0.90", vatRate: "23.00" },
          { name: "Snacks", category: "Food", price: "2.50", cost: "1.20", vatRate: "23.00" }
        ],
        defaultCategories: ["Beer", "Wine", "Spirits", "Tobacco", "Non-Alcoholic", "Food"],
        defaultSettings: { requireReceiptPrint: true, ageVerification: true, licenseRequired: true },
        isActive: true
      },
      {
        name: "Wholesaler",
        businessType: "wholesaler",
        description: "Wholesale distribution and bulk sales to retailers",
        defaultProducts: [
          { name: "Bulk Rice 25kg", category: "Bulk Foods", price: "45.00", cost: "28.00", vatRate: "0.00" },
          { name: "Case of Beer 24x", category: "Beverages", price: "32.00", cost: "22.50", vatRate: "23.00" },
          { name: "Cleaning Supplies Box", category: "Household", price: "18.50", cost: "11.20", vatRate: "23.00" },
          { name: "Paper Products Bulk", category: "Office", price: "65.00", cost: "42.00", vatRate: "23.00" }
        ],
        defaultCategories: ["Bulk Foods", "Beverages", "Household", "Office", "Industrial"],
        defaultSettings: { requireReceiptPrint: true, bulkPricing: true, creditTerms: true, deliveryService: true },
        isActive: true
      },
      {
        name: "Pharmacy",
        businessType: "pharmacy",
        description: "Pharmacies and chemists with prescriptions and health products",
        defaultProducts: [
          { name: "Prescription Medication", category: "Prescriptions", price: "15.50", cost: "8.20", vatRate: "0.00" },
          { name: "Paracetamol", category: "Over Counter", price: "3.99", cost: "1.80", vatRate: "0.00" },
          { name: "Vitamins", category: "Health", price: "12.50", cost: "6.20", vatRate: "0.00" },
          { name: "Shampoo", category: "Personal Care", price: "5.99", cost: "2.80", vatRate: "23.00" }
        ],
        defaultCategories: ["Prescriptions", "Over Counter", "Health", "Personal Care", "Baby Care"],
        defaultSettings: { requireReceiptPrint: true, prescriptionManagement: true, healthAdvice: true },
        isActive: true
      },
      {
        name: "Bakery",
        businessType: "bakery",
        description: "Fresh bread, cakes, and baked goods",
        defaultProducts: [
          { name: "White Bread", category: "Bread", price: "2.50", cost: "0.90", vatRate: "0.00" },
          { name: "Croissants", category: "Pastries", price: "1.80", cost: "0.60", vatRate: "0.00" },
          { name: "Birthday Cake", category: "Cakes", price: "25.00", cost: "8.50", vatRate: "0.00" },
          { name: "Coffee", category: "Beverages", price: "2.80", cost: "0.50", vatRate: "13.50" }
        ],
        defaultCategories: ["Bread", "Pastries", "Cakes", "Beverages", "Seasonal"],
        defaultSettings: { requireReceiptPrint: true, freshnessDates: true, customOrders: true },
        isActive: true
      },
      {
        name: "Hardware Store",
        businessType: "hardware",
        description: "Tools, building supplies, and home improvement products",
        defaultProducts: [
          { name: "Hammer", category: "Tools", price: "15.99", cost: "8.50", vatRate: "23.00" },
          { name: "Paint 1L", category: "Paint", price: "22.50", cost: "12.20", vatRate: "23.00" },
          { name: "Screws Pack", category: "Fixings", price: "4.50", cost: "1.80", vatRate: "23.00" },
          { name: "Garden Hose", category: "Garden", price: "35.00", cost: "18.50", vatRate: "23.00" }
        ],
        defaultCategories: ["Tools", "Paint", "Fixings", "Garden", "Electrical", "Plumbing"],
        defaultSettings: { requireReceiptPrint: true, bulkDiscounts: true, tradeAccounts: true },
        isActive: true
      },
      {
        name: "Beauty Salon",
        businessType: "salon",
        description: "Beauty salons, hairdressers, and personal care services",
        defaultProducts: [
          { name: "Haircut & Style", category: "Hair Services", price: "35.00", cost: "5.00", vatRate: "23.00" },
          { name: "Hair Color", category: "Hair Services", price: "65.00", cost: "15.50", vatRate: "23.00" },
          { name: "Manicure", category: "Nail Services", price: "25.00", cost: "3.50", vatRate: "23.00" },
          { name: "Hair Products", category: "Retail", price: "18.50", cost: "9.20", vatRate: "23.00" }
        ],
        defaultCategories: ["Hair Services", "Nail Services", "Beauty Treatments", "Retail"],
        defaultSettings: { requireReceiptPrint: true, appointmentSystem: true, clientDatabase: true, tips: true },
        isActive: true
      },
      {
        name: "Butcher Shop",
        businessType: "butcher",
        description: "Specialized for butchers and meat retailers",
        defaultProducts: [
          { name: "Beef Mince (500g)", category: "Beef", price: "6.50", cost: "4.20", vatRate: "0.00" },
          { name: "Chicken Breast (1kg)", category: "Poultry", price: "8.99", cost: "6.50", vatRate: "0.00" },
          { name: "Pork Chops (500g)", category: "Pork", price: "7.20", cost: "5.10", vatRate: "0.00" },
          { name: "Fresh Sausages", category: "Processed", price: "4.99", cost: "3.20", vatRate: "0.00" }
        ],
        defaultCategories: ["Beef", "Pork", "Poultry", "Lamb", "Processed", "Specials"],
        defaultSettings: { requireReceiptPrint: true, enableWeightedItems: true, showOriginInfo: true },
        isActive: true
      },
      {
        name: "Retail Store",
        businessType: "retail",
        description: "General retail stores and convenience shops",
        defaultProducts: [
          { name: "Coca Cola 500ml", category: "Drinks", price: "1.50", cost: "0.80", vatRate: "23.00" },
          { name: "White Bread", category: "Food", price: "2.20", cost: "1.50", vatRate: "0.00" },
          { name: "Milk 1L", category: "Dairy", price: "1.35", cost: "0.95", vatRate: "0.00" },
          { name: "Newspapers", category: "News", price: "2.50", cost: "1.80", vatRate: "0.00" }
        ],
        defaultCategories: ["Drinks", "Food", "Dairy", "Snacks", "Household", "News"],
        defaultSettings: { requireReceiptPrint: true, enableLoyaltyProgram: false, fastCheckout: true },
        isActive: true
      },
      {
        name: "Pop-up Stall",
        businessType: "popup",
        description: "Mobile vendors, market stalls, and temporary setups",
        defaultProducts: [
          { name: "Hot Dog", category: "Food", price: "4.50", cost: "1.80", vatRate: "13.50" },
          { name: "Soft Drink", category: "Drinks", price: "2.00", cost: "0.70", vatRate: "23.00" },
          { name: "Candy", category: "Snacks", price: "1.50", cost: "0.60", vatRate: "23.00" }
        ],
        defaultCategories: ["Food", "Drinks", "Snacks"],
        defaultSettings: { requireReceiptPrint: false, mobileOptimized: true, offlineMode: true },
        isActive: true
      }
    ];

    templates.forEach(template => {
      const id = this.currentId++;
      const businessTemplate: BusinessTemplate = { 
        ...template, 
        id,
        createdAt: new Date()
      };
      this.businessTemplates.set(id, businessTemplate);
    });
  }

  getBusinessTemplates(): BusinessTemplate[] {
    return Array.from(this.businessTemplates.values()).filter(t => t.isActive);
  }

  getBusinessTemplate(id: number): BusinessTemplate | undefined {
    return this.businessTemplates.get(id);
  }

  getBusinessTemplatesByType(businessType: string): BusinessTemplate[] {
    return Array.from(this.businessTemplates.values()).filter(t => t.businessType === businessType && t.isActive);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.pin === pin);
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updated = { ...user, lastLogin: new Date() };
      this.users.set(id, updated);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'staff',
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, user);
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.barcode === barcode && p.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId++;
    const product: Product = { 
      ...insertProduct, 
      id,
      barcode: insertProduct.barcode || null,
      cost: insertProduct.cost || null,
      stock: insertProduct.stock || 0,
      minStock: insertProduct.minStock || 0,
      isActive: insertProduct.isActive ?? true,
      vatRate: insertProduct.vatRate || "0.00"
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = { ...existing, ...productUpdate };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updated = { ...product, isActive: false };
    this.products.set(id, updated);
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(c => c.isActive);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId++;
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null,
      loyaltyPoints: insertCustomer.loyaltyPoints || 0,
      isActive: insertCustomer.isActive ?? true
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = { ...existing, ...customerUpdate };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer) return false;
    
    const updated = { ...customer, isActive: false };
    this.customers.set(id, updated);
    return true;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).filter(s => s.isActive);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentId++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      email: insertSupplier.email || null,
      phone: insertSupplier.phone || null,
      address: insertSupplier.address || null,
      contactPerson: insertSupplier.contactPerson || null,
      isActive: insertSupplier.isActive ?? true
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    
    const updated: Supplier = { ...existing, ...supplierUpdate };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return false;
    
    const updated = { ...supplier, isActive: false };
    this.suppliers.set(id, updated);
    return true;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      customerId: insertTransaction.customerId || null,
      status: insertTransaction.status || 'completed',
      tillId: insertTransaction.tillId || 'till1',
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
    return Array.from(this.transactionItems.values()).filter(item => item.transactionId === transactionId);
  }

  async addTransactionItem(insertItem: InsertTransactionItem): Promise<TransactionItem> {
    const id = this.currentId++;
    const item: TransactionItem = { ...insertItem, id };
    this.transactionItems.set(id, item);
    return item;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date, tillId?: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => {
      const transactionDate = new Date(t.createdAt);
      const inDateRange = transactionDate >= startDate && transactionDate <= endDate;
      const matchesTill = !tillId || t.tillId === tillId;
      return inDateRange && matchesTill;
    });
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return Array.from(this.promotions.values()).filter(p => p.isActive);
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    return this.promotions.get(id);
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const id = this.currentId++;
    const promotion: Promotion = { 
      ...insertPromotion, 
      id,
      description: insertPromotion.description || null,
      isActive: insertPromotion.isActive ?? true
    };
    this.promotions.set(id, promotion);
    return promotion;
  }

  async updatePromotion(id: number, promotionUpdate: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const existing = this.promotions.get(id);
    if (!existing) return undefined;
    
    const updated: Promotion = { ...existing, ...promotionUpdate };
    this.promotions.set(id, updated);
    return updated;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const promotion = this.promotions.get(id);
    if (!promotion) return false;
    
    const updated = { ...promotion, isActive: false };
    this.promotions.set(id, updated);
    return true;
  }

  // Supplier Order Integration - placeholder methods for MemStorage
  async getSupplierOrderIntegrations(): Promise<SupplierOrderIntegration[]> {
    return [];
  }

  async getSupplierOrderIntegration(id: number): Promise<SupplierOrderIntegration | undefined> {
    return undefined;
  }

  async createSupplierOrderIntegration(integration: InsertSupplierOrderIntegration): Promise<SupplierOrderIntegration> {
    const id = this.currentId++;
    return { 
      id, 
      ...integration,
      createdAt: new Date(),
      updatedAt: new Date()
    } as SupplierOrderIntegration;
  }

  async updateSupplierOrderIntegration(id: number, updates: Partial<InsertSupplierOrderIntegration>): Promise<SupplierOrderIntegration> {
    return { 
      id, 
      ...updates,
      updatedAt: new Date()
    } as SupplierOrderIntegration;
  }

  // Email Order Capture - placeholder methods
  async getEmailOrderCaptures(): Promise<EmailOrderCapture[]> {
    return [];
  }

  async getEmailOrderCapture(id: number): Promise<EmailOrderCapture | undefined> {
    return undefined;
  }

  async createEmailOrderCapture(capture: InsertEmailOrderCapture): Promise<EmailOrderCapture> {
    const id = this.currentId++;
    return { id, ...capture } as EmailOrderCapture;
  }

  async updateEmailOrderCapture(id: number, updates: Partial<InsertEmailOrderCapture>): Promise<EmailOrderCapture> {
    return { id, ...updates } as EmailOrderCapture;
  }

  // Supplier Webhooks - placeholder methods
  async getSupplierWebhooks(): Promise<SupplierWebhook[]> {
    return [];
  }

  async getSupplierWebhook(id: number): Promise<SupplierWebhook | undefined> {
    return undefined;
  }

  async createSupplierWebhook(webhook: InsertSupplierWebhook): Promise<SupplierWebhook> {
    const id = this.currentId++;
    return { 
      id, 
      ...webhook,
      createdAt: new Date()
    } as SupplierWebhook;
  }

  async updateSupplierWebhook(id: number, updates: Partial<InsertSupplierWebhook>): Promise<SupplierWebhook> {
    return { id, ...updates } as SupplierWebhook;
  }

  // Notifications
  async createNotification(notification: any): Promise<any> {
    return { id: Date.now(), ...notification };
  }
}

export const storage = new MemStorage();
