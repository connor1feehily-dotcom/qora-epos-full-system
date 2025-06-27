import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  pin: text("pin"),
  role: text("role").notNull().default("staff"), // staff, manager, admin
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  employeeId: text("employee_id").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode").unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  isActive: boolean("is_active").notNull().default(true),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  userId: integer("user_id").notNull(),
  tillId: text("till_id").notNull().default("till1"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  itemCount: integer("item_count").notNull().default(1),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Till Sessions table for tracking till openings/closings
export const tillSessions = pgTable("till_sessions", {
  id: serial("id").primaryKey(),
  tillId: text("till_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  openingFloat: decimal("opening_float", { precision: 10, scale: 2 }).notNull(),
  closingFloat: decimal("closing_float", { precision: 10, scale: 2 }),
  expectedCash: decimal("expected_cash", { precision: 10, scale: 2 }),
  actualCash: decimal("actual_cash", { precision: 10, scale: 2 }),
  variance: decimal("variance", { precision: 10, scale: 2 }),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  isActive: boolean("is_active").notNull().default(true),
});

// Daily Reports table for Z and X reports
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  tillId: text("till_id").notNull(),
  reportType: text("report_type").notNull(), // 'X' or 'Z'
  reportDate: timestamp("report_date").notNull().defaultNow(),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull(),
  totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull(),
  transactionCount: integer("transaction_count").notNull(),
  cashSales: decimal("cash_sales", { precision: 10, scale: 2 }).notNull(),
  cardSales: decimal("card_sales", { precision: 10, scale: 2 }).notNull(),
  openingFloat: decimal("opening_float", { precision: 10, scale: 2 }),
  closingFloat: decimal("closing_float", { precision: 10, scale: 2 }),
  generatedBy: integer("generated_by").notNull().references(() => users.id),
});

// POS Button Configuration
export const posButtons = pgTable("pos_buttons", {
  id: serial("id").primaryKey(),
  tillId: text("till_id").notNull(),
  buttonType: text("button_type").notNull(), // "product", "category", "action", "payment"
  label: text("label").notNull(),
  position: integer("position").notNull(),
  color: text("color").default("#3b82f6"),
  productId: integer("product_id").references(() => products.id),
  categoryName: text("category_name"),
  actionType: text("action_type"), // "discount", "void", "hold", "receipt"
  paymentMethod: text("payment_method"), // "cash", "card", "voucher"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  status: text("status").notNull().default("pending"), // pending, sent, received, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  createdBy: integer("created_by").references(() => users.id),
  notes: text("notes"),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  received: integer("received").default(0),
});

// Promotions Engine
export const promotionRules = pgTable("promotion_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "percentage", "fixed", "bogof", "mix_match"
  value: decimal("value", { precision: 10, scale: 2 }),
  conditions: text("conditions"), // JSON string for complex rules
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").default(1),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
});

export const promotionProducts = pgTable("promotion_products", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").references(() => promotionRules.id),
  productId: integer("product_id").references(() => products.id),
  categoryName: text("category_name"),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // "create", "update", "delete", "login", "sale"
  tableName: text("table_name"),
  recordId: integer("record_id"),
  oldValues: text("old_values"), // JSON string
  newValues: text("new_values"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff Schedules
export const staffSchedules = pgTable("staff_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tillId: text("till_id"),
  shiftStart: timestamp("shift_start").notNull(),
  shiftEnd: timestamp("shift_end").notNull(),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  notes: text("notes"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({
  id: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
});

export const insertTillSessionSchema = createInsertSchema(tillSessions).omit({
  id: true,
  openedAt: true,
});

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  reportDate: true,
});

export const insertPosButtonSchema = createInsertSchema(posButtons).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  orderDate: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
});

export const insertPromotionRuleSchema = createInsertSchema(promotionRules).omit({
  id: true,
});

export const insertPromotionProductSchema = createInsertSchema(promotionProducts).omit({
  id: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertStaffScheduleSchema = createInsertSchema(staffSchedules).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type TillSession = typeof tillSessions.$inferSelect;
export type DailyReport = typeof dailyReports.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type InsertTillSession = z.infer<typeof insertTillSessionSchema>;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;

// New types for extended functionality
export type PosButton = typeof posButtons.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type PromotionRule = typeof promotionRules.$inferSelect;
export type PromotionProduct = typeof promotionProducts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type StaffSchedule = typeof staffSchedules.$inferSelect;

export type InsertPosButton = z.infer<typeof insertPosButtonSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertPromotionRule = z.infer<typeof insertPromotionRuleSchema>;
export type InsertPromotionProduct = z.infer<typeof insertPromotionProductSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertStaffSchedule = z.infer<typeof insertStaffScheduleSchema>;
