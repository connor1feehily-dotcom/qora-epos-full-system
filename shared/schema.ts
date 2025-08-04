import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, varchar, date, jsonb } from "drizzle-orm/pg-core";
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

// Receipt Templates
export const receiptTemplates = pgTable("receipt_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  storeId: text("store_id"),
  tillId: text("till_id"),
  template: json("template").notNull(), // JSON structure for receipt layout
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// UI Layout Configurations
export const uiLayouts = pgTable("ui_layouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scope: text("scope").notNull(), // 'global', 'store', 'terminal'
  scopeId: text("scope_id"), // store ID or terminal ID
  layout: json("layout").notNull(), // JSON configuration for UI layout
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Theme Configurations
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scope: text("scope").notNull(), // 'global', 'store', 'terminal'
  scopeId: text("scope_id"), // store ID or terminal ID
  colors: json("colors").notNull(), // Color scheme configuration
  typography: json("typography").notNull(), // Font configurations
  spacing: json("spacing").notNull(), // Spacing and sizing
  borderRadius: text("border_radius").default("medium"),
  mode: text("mode").notNull().default("light"), // 'light', 'dark', 'auto'
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mobile App Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'sale_alert', 'inventory_low', 'approval_request', 'shift_alert'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: json("data"), // Additional notification data
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Mobile Device Registrations
export const mobileDevices = pgTable("mobile_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name").notNull(),
  platform: text("platform").notNull(), // 'ios', 'android', 'web'
  pushToken: text("push_token"),
  isActive: boolean("is_active").notNull().default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Approval Workflows
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'purchase_order', 'staff_shift', 'inventory_adjustment'
  referenceId: integer("reference_id").notNull(), // ID of the item needing approval
  requestedBy: integer("requested_by").references(() => users.id),
  approverRole: text("approver_role").notNull(), // 'manager', 'admin'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: integer("approved_by").references(() => users.id),
  approvalNotes: text("approval_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// AI Analytics and Predictions
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'demand_forecast', 'shrinkage_alert', 'promotion_suggestion'
  category: text("category").notNull(), // 'inventory', 'sales', 'staff', 'customer'
  productId: integer("product_id").references(() => products.id),
  customerId: integer("customer_id").references(() => customers.id),
  tillId: text("till_id"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  prediction: json("prediction").notNull(), // AI prediction data
  metadata: json("metadata"), // Additional context data
  isActioned: boolean("is_actioned").notNull().default(false),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Customer Behavior Analytics
export const customerBehavior = pgTable("customer_behavior", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id),
  action: text("action").notNull(), // 'view', 'scan', 'purchase', 'return'
  duration: integer("duration"), // seconds spent
  quantity: integer("quantity").default(1),
  location: text("location"), // area of store
  tillId: text("till_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Store Health Metrics
export const storeMetrics = pgTable("store_metrics", {
  id: serial("id").primaryKey(),
  tillId: text("till_id"),
  metricType: text("metric_type").notNull(), // 'queue_length', 'sales_velocity', 'staff_efficiency'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  target: decimal("target", { precision: 10, scale: 2 }),
  unit: text("unit").notNull(), // 'customers', 'seconds', 'percentage'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Staff Performance & Gamification
export const staffPerformance = pgTable("staff_performance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tillId: text("till_id"),
  shiftDate: timestamp("shift_date").notNull(),
  transactionsProcessed: integer("transactions_processed").default(0),
  averageTransactionTime: decimal("avg_transaction_time", { precision: 8, scale: 2 }),
  upsellsAchieved: integer("upsells_achieved").default(0),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).default("100.00"),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }),
  points: integer("points").default(0),
  badges: json("badges"), // Array of earned badges
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Heatmap Data
export const productHeatmap = pgTable("product_heatmap", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  locationX: integer("location_x").notNull(), // store grid position
  locationY: integer("location_y").notNull(),
  scanCount: integer("scan_count").default(0),
  purchaseCount: integer("purchase_count").default(0),
  dwellTime: integer("dwell_time").default(0), // seconds
  date: timestamp("date").defaultNow(),
});

// Loyalty & Rewards Engine
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  tierLevel: text("tier_level").default("bronze"), // bronze, silver, gold, platinum
  specialOffer: json("special_offer"), // Dynamic offer data
  createdAt: timestamp("created_at").defaultNow(),
});

// Plugin System
export const installedPlugins = pgTable("installed_plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'inventory', 'payment', 'analytics', 'integration'
  config: json("config"), // Plugin configuration
  isEnabled: boolean("is_enabled").notNull().default(true),
  installDate: timestamp("install_date").defaultNow(),
  lastUpdate: timestamp("last_update").defaultNow(),
  permissions: json("permissions"), // Required permissions
});

// Natural Language Queries
export const nlQueries = pgTable("nl_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  intent: text("intent"), // Detected query intent
  entities: json("entities"), // Extracted entities
  sqlGenerated: text("sql_generated"),
  response: json("response"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Offline Sync Queue
export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  tillId: text("till_id").notNull(),
  operation: text("operation").notNull(), // 'create', 'update', 'delete'
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  data: json("data").notNull(),
  priority: integer("priority").default(1), // 1=high, 5=low
  retryCount: integer("retry_count").default(0),
  lastAttempt: timestamp("last_attempt"),
  status: text("status").default("pending"), // pending, synced, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery Dockets for Valerie's mobile scanning
export const deliveryDockets = pgTable("delivery_dockets", {
  id: serial("id").primaryKey(),
  docketNumber: text("docket_number").notNull(),
  supplierName: text("supplier_name").notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  scannedByUserId: integer("scanned_by_user_id").references(() => users.id),
  approvedByUserId: integer("approved_by_user_id").references(() => users.id),
  deliveryDate: timestamp("delivery_date").notNull(),
  totalItems: integer("total_items").notNull().default(0),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  scanMethod: text("scan_method").notNull().default("mobile"), // mobile, manual, ocr
  imageUrl: text("image_url"), // For OCR scanned images
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
});

// Delivery Items from scanned dockets
export const deliveryItems = pgTable("delivery_items", {
  id: serial("id").primaryKey(),
  docketId: integer("docket_id").references(() => deliveryDockets.id),
  productId: integer("product_id").references(() => products.id),
  barcode: text("barcode"),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }),
  approvedPrice: decimal("approved_price", { precision: 10, scale: 2 }),
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }),
  isMatched: boolean("is_matched").notNull().default(false),
  needsApproval: boolean("needs_approval").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  stockAction: text("stock_action").default("add"), // add, update, reduce
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supplier Performance Tracking
export const supplierPerformance = pgTable("supplier_performance", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  deliveryDate: timestamp("delivery_date").notNull(),
  onTimeDelivery: boolean("on_time_delivery").notNull().default(true),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).notNull().default("100.00"),
  priceVariance: decimal("price_variance", { precision: 10, scale: 2 }).default("0.00"),
  marginContribution: decimal("margin_contribution", { precision: 10, scale: 2 }).default("0.00"),
  itemsDelivered: integer("items_delivered").notNull().default(0),
  itemsReturned: integer("items_returned").notNull().default(0),
  qualityRating: integer("quality_rating").default(5), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff Activity Log
export const staffActivityLog = pgTable("staff_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // price_change, stock_update, delivery_approval, etc.
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  oldValue: json("old_value"),
  newValue: json("new_value"),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Price Optimization Suggestions
export const priceOptimizations = pgTable("price_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  expectedMarginImprovement: decimal("expected_margin_improvement", { precision: 5, scale: 2 }),
  salesVelocity: decimal("sales_velocity", { precision: 8, scale: 2 }),
  marketTrend: text("market_trend"), // increasing, decreasing, stable
  isApplied: boolean("is_applied").notNull().default(false),
  appliedAt: timestamp("applied_at"),
  appliedByUserId: integer("applied_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Alerts & Exceptions
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // low_stock, margin_threshold, delivery_fail, etc.
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedTable: text("related_table"),
  relatedId: integer("related_id"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedByUserId: integer("resolved_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Offline Sync Queue for Mobile
export const offlineQueue = pgTable("offline_queue", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  userId: integer("user_id").references(() => users.id),
  operation: text("operation").notNull(), // scan, price_update, stock_adjustment
  tableName: text("table_name").notNull(),
  data: json("data").notNull(),
  priority: integer("priority").default(1),
  retryCount: integer("retry_count").default(0),
  status: text("status").default("pending"), // pending, synced, failed
  createdAt: timestamp("created_at").defaultNow(),
  syncedAt: timestamp("synced_at"),
});

// Stock Take Sessions for first-time inventory setup
export const stockTakeSessions = pgTable("stock_take_sessions", {
  id: serial("id").primaryKey(),
  sessionName: text("session_name").notNull(),
  startedBy: integer("started_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("active"), // active, paused, completed, cancelled
  totalItemsScanned: integer("total_items_scanned").notNull().default(0),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
});

// Stock Take Items - temporary holding for scanned items during stock take
export const stockTakeItems = pgTable("stock_take_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => stockTakeSessions.id),
  barcode: text("barcode").notNull(),
  productName: text("product_name"),
  category: text("category").default("General"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).default("0.00"),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  scannedBy: integer("scanned_by").notNull().references(() => users.id),
  isProcessed: boolean("is_processed").notNull().default(false), // Whether converted to actual product
  deviceInfo: text("device_info"), // Info about scanning device/phone
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertReceiptTemplateSchema = createInsertSchema(receiptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUiLayoutSchema = createInsertSchema(uiLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertMobileDeviceSchema = createInsertSchema(mobileDevices).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
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

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
});

export const insertCustomerBehaviorSchema = createInsertSchema(customerBehavior).omit({
  id: true,
});

export const insertStoreMetricSchema = createInsertSchema(storeMetrics).omit({
  id: true,
});

export const insertStaffPerformanceSchema = createInsertSchema(staffPerformance).omit({
  id: true,
});

export const insertProductHeatmapSchema = createInsertSchema(productHeatmap).omit({
  id: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
});

export const insertInstalledPluginSchema = createInsertSchema(installedPlugins).omit({
  id: true,
});

export const insertNlQuerySchema = createInsertSchema(nlQueries).omit({
  id: true,
});

export const insertSyncQueueSchema = createInsertSchema(syncQueue).omit({
  id: true,
});

export const insertDeliveryDocketSchema = createInsertSchema(deliveryDockets).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  processedAt: true,
});

export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierPerformanceSchema = createInsertSchema(supplierPerformance).omit({
  id: true,
  createdAt: true,
});

export const insertStaffActivityLogSchema = createInsertSchema(staffActivityLog).omit({
  id: true,
  createdAt: true,
});

export const insertPriceOptimizationSchema = createInsertSchema(priceOptimizations).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertOfflineQueueSchema = createInsertSchema(offlineQueue).omit({
  id: true,
  createdAt: true,
  syncedAt: true,
});

export const insertStockTakeSessionSchema = createInsertSchema(stockTakeSessions).omit({
  id: true,
  startedAt: true,
});

export const insertStockTakeItemSchema = createInsertSchema(stockTakeItems).omit({
  id: true,
  scannedAt: true,
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
export type StockTakeSession = typeof stockTakeSessions.$inferSelect;
export type StockTakeItem = typeof stockTakeItems.$inferSelect;
export type InsertStockTakeSession = z.infer<typeof insertStockTakeSessionSchema>;
export type InsertStockTakeItem = z.infer<typeof insertStockTakeItemSchema>;

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

// Delivery types
export type DeliveryDocket = typeof deliveryDockets.$inferSelect;
export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryDocket = z.infer<typeof insertDeliveryDocketSchema>;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;

// Advanced management types
export type SupplierPerformance = typeof supplierPerformance.$inferSelect;
export type StaffActivityLog = typeof staffActivityLog.$inferSelect;
export type PriceOptimization = typeof priceOptimizations.$inferSelect;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type OfflineQueue = typeof offlineQueue.$inferSelect;

export type InsertSupplierPerformance = z.infer<typeof insertSupplierPerformanceSchema>;
export type InsertStaffActivityLog = z.infer<typeof insertStaffActivityLogSchema>;
export type InsertPriceOptimization = z.infer<typeof insertPriceOptimizationSchema>;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type InsertOfflineQueue = z.infer<typeof insertOfflineQueueSchema>;

// Advanced Features - Additional Tables

// Batch Edit Operations
export const batchEditOperations = pgTable('batch_edit_operations', {
  id: serial('id').primaryKey(),
  operationType: varchar('operation_type', { length: 50 }).notNull(), // 'price_update', 'category_change', 'supplier_update'
  targetTable: varchar('target_table', { length: 50 }).notNull(),
  filters: jsonb('filters').notNull(), // conditions for which records to update
  updateData: jsonb('update_data').notNull(), // what to update
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  recordsAffected: integer('records_affected').default(0),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error')
});

// Expiry Tracking
export const expiryTracking = pgTable('expiry_tracking', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
  expiryDate: date('expiry_date').notNull(),
  quantityRemaining: integer('quantity_remaining').notNull(),
  alertThreshold: integer('alert_threshold').default(7).notNull(), // days before expiry to alert
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active', 'expired', 'marked_down', 'disposed'
  markdownPrice: decimal('markdown_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Stock Forecasting
export const stockForecasting = pgTable('stock_forecasting', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  currentStock: integer('current_stock').notNull(),
  averageDailySales: decimal('average_daily_sales', { precision: 8, scale: 2 }),
  daysOfStock: integer('days_of_stock'),
  reorderPoint: integer('reorder_point'),
  suggestedOrderQuantity: integer('suggested_order_quantity'),
  lastOrderDate: date('last_order_date'),
  leadTimeDays: integer('lead_time_days').default(7),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  forecastDate: date('forecast_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Time Clock
export const timeClock = pgTable('time_clock', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  clockIn: timestamp('clock_in').notNull(),
  clockOut: timestamp('clock_out'),
  breakStart: timestamp('break_start'),
  breakEnd: timestamp('break_end'),
  totalHours: decimal('total_hours', { precision: 4, scale: 2 }),
  hourlyRate: decimal('hourly_rate', { precision: 6, scale: 2 }),
  overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }),
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active', 'break', 'completed'
  tillId: varchar('till_id', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Staff Incentives
export const staffIncentives = pgTable('staff_incentives', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  incentiveType: varchar('incentive_type', { length: 50 }).notNull(), // 'sales_target', 'upsell_bonus', 'customer_service'
  targetValue: decimal('target_value', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }).default('0'),
  bonusAmount: decimal('bonus_amount', { precision: 8, scale: 2 }),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active', 'achieved', 'expired'
  achievedAt: timestamp('achieved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Staff Messages
export const staffMessages = pgTable('staff_messages', {
  id: serial('id').primaryKey(),
  fromUserId: integer('from_user_id').references(() => users.id),
  toUserId: integer('to_user_id').references(() => users.id),
  messageType: varchar('message_type', { length: 30 }).notNull(), // 'bulletin', 'shift_note', 'private', 'alert'
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 'low', 'normal', 'high', 'urgent'
  readAt: timestamp('read_at'),
  expiresAt: timestamp('expires_at'),
  tillId: varchar('till_id', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Product Performance Analytics
export const productPerformance = pgTable('product_performance', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  date: date('date').notNull(),
  unitsSold: integer('units_sold').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
  profit: decimal('profit', { precision: 10, scale: 2 }).default('0'),
  averageMargin: decimal('average_margin', { precision: 5, scale: 2 }),
  returnsCount: integer('returns_count').default(0),
  stockTurnover: decimal('stock_turnover', { precision: 5, scale: 2 }),
  performanceScore: decimal('performance_score', { precision: 3, scale: 2 }),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Custom Alerts
export const customAlerts = pgTable('custom_alerts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(), // 'sales_drop', 'sales_spike', 'inventory_low', 'custom_metric'
  metric: varchar('metric', { length: 50 }).notNull(),
  threshold: decimal('threshold', { precision: 10, scale: 2 }).notNull(),
  condition: varchar('condition', { length: 20 }).notNull(), // 'above', 'below', 'equals'
  timeframe: varchar('timeframe', { length: 20 }).notNull(), // 'hourly', 'daily', 'weekly'
  isActive: boolean('is_active').default(true),
  lastTriggered: timestamp('last_triggered'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Demand Forecasting
export const demandForecasting = pgTable('demand_forecasting', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  forecastDate: date('forecast_date').notNull(),
  predictedDemand: integer('predicted_demand').notNull(),
  actualDemand: integer('actual_demand'),
  seasonalityFactor: decimal('seasonality_factor', { precision: 3, scale: 2 }),
  trendFactor: decimal('trend_factor', { precision: 3, scale: 2 }),
  localEventImpact: decimal('local_event_impact', { precision: 3, scale: 2 }),
  weatherImpact: decimal('weather_impact', { precision: 3, scale: 2 }),
  confidenceLevel: decimal('confidence_level', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// QR Code Supplier Receiving
export const qrSupplierReceiving = pgTable('qr_supplier_receiving', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
  qrCode: varchar('qr_code', { length: 200 }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceData: jsonb('invoice_data'),
  matchedItems: jsonb('matched_items'),
  unmatchedItems: jsonb('unmatched_items'),
  totalValue: decimal('total_value', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'matched', 'approved', 'discrepancy'
  receivedBy: integer('received_by').references(() => users.id).notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at')
});

// Supplier Order Integration - captures orders from supplier websites
export const supplierOrderIntegration = pgTable('supplier_order_integration', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  supplierOrderId: varchar('supplier_order_id', { length: 100 }).notNull(), // Supplier's internal order ID
  externalOrderNumber: varchar('external_order_number', { length: 100 }).notNull(),
  orderSource: varchar('order_source', { length: 50 }).notNull(), // 'email', 'webhook', 'api', 'manual'
  orderData: jsonb('order_data').notNull(), // Full order details from supplier
  orderItems: jsonb('order_items').notNull(), // Array of items ordered
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
  orderDate: timestamp('order_date').notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  status: varchar('status', { length: 20 }).default('pending_approval').notNull(), // 'pending_approval', 'approved', 'rejected', 'received', 'cancelled'
  orderedBy: integer('ordered_by').references(() => users.id).notNull(), // Valerie's user ID
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: integer('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Email Integration for capturing supplier order confirmations
export const emailOrderCapture = pgTable('email_order_capture', {
  id: serial('id').primaryKey(),
  emailSubject: text('email_subject').notNull(),
  emailFrom: text('email_from').notNull(),
  emailTo: text('email_to').notNull(),
  emailBody: text('email_body').notNull(),
  extractedOrderData: jsonb('extracted_order_data'), // Parsed order details
  parsedItems: jsonb('parsed_items'), // Extracted items
  supplierOrderIntegrationId: integer('supplier_order_integration_id').references(() => supplierOrderIntegration.id),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending').notNull(), // 'pending', 'processed', 'failed'
  confidence: decimal('confidence', { precision: 5, scale: 2 }), // AI confidence in parsing (0-100)
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at')
});

// Webhook endpoints for supplier integration
export const supplierWebhooks = pgTable('supplier_webhooks', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  webhookUrl: text('webhook_url').notNull(),
  secretKey: text('secret_key').notNull(),
  eventTypes: jsonb('event_types').notNull(), // ['order_placed', 'order_shipped', 'order_delivered']
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Insert schemas for new tables
export const insertSupplierOrderIntegration = createInsertSchema(supplierOrderIntegration).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailOrderCapture = createInsertSchema(emailOrderCapture).omit({
  id: true,
  receivedAt: true
});

export const insertSupplierWebhook = createInsertSchema(supplierWebhooks).omit({
  id: true,
  createdAt: true
});

// Types
export type SupplierOrderIntegration = typeof supplierOrderIntegration.$inferSelect;
export type InsertSupplierOrderIntegration = z.infer<typeof insertSupplierOrderIntegration>;
export type EmailOrderCapture = typeof emailOrderCapture.$inferSelect;
export type InsertEmailOrderCapture = z.infer<typeof insertEmailOrderCapture>;
export type SupplierWebhook = typeof supplierWebhooks.$inferSelect;
export type InsertSupplierWebhook = z.infer<typeof insertSupplierWebhook>;

// Promotion Templates
export const promotionTemplates = pgTable('promotion_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  templateType: varchar('template_type', { length: 50 }).notNull(), // 'weekly_deal', 'monthly_special', 'seasonal'
  discountType: varchar('discount_type', { length: 20 }).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  conditions: jsonb('conditions'),
  applicableProducts: jsonb('applicable_products'),
  schedule: jsonb('schedule'), // recurring schedule information
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used')
});

// Customer Insights
export const customerInsights = pgTable('customer_insights', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  totalPurchases: integer('total_purchases').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  averageTransactionValue: decimal('average_transaction_value', { precision: 8, scale: 2 }),
  lastVisit: timestamp('last_visit'),
  visitFrequency: decimal('visit_frequency', { precision: 4, scale: 2 }), // visits per month
  topCategories: jsonb('top_categories'),
  preferredPaymentMethod: varchar('preferred_payment_method', { length: 30 }),
  loyaltyTier: varchar('loyalty_tier', { length: 20 }),
  churnRisk: decimal('churn_risk', { precision: 3, scale: 2 }),
  lifetimeValue: decimal('lifetime_value', { precision: 10, scale: 2 }),
  seasonalPreferences: jsonb('seasonal_preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Push Notifications
export const pushNotifications = pgTable('push_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 20 }).default('push').notNull(), // 'push', 'sms', 'email'
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'delivered', 'failed'
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  clickedAt: timestamp('clicked_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Insert schemas for new tables
export const insertBatchEditOperationSchema = createInsertSchema(batchEditOperations).omit({ id: true });
export const insertExpiryTrackingSchema = createInsertSchema(expiryTracking).omit({ id: true });
export const insertStockForecastingSchema = createInsertSchema(stockForecasting).omit({ id: true });
export const insertTimeClockSchema = createInsertSchema(timeClock).omit({ id: true });
export const insertStaffIncentiveSchema = createInsertSchema(staffIncentives).omit({ id: true });
export const insertStaffMessageSchema = createInsertSchema(staffMessages).omit({ id: true });
export const insertProductPerformanceSchema = createInsertSchema(productPerformance).omit({ id: true });
export const insertCustomAlertSchema = createInsertSchema(customAlerts).omit({ id: true });
export const insertDemandForecastingSchema = createInsertSchema(demandForecasting).omit({ id: true });
export const insertQrSupplierReceivingSchema = createInsertSchema(qrSupplierReceiving).omit({ id: true });
export const insertPromotionTemplateSchema = createInsertSchema(promotionTemplates).omit({ id: true });
export const insertCustomerInsightSchema = createInsertSchema(customerInsights).omit({ id: true });
export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true });

// Types for new tables
export type BatchEditOperation = typeof batchEditOperations.$inferSelect;
export type ExpiryTracking = typeof expiryTracking.$inferSelect;
export type StockForecasting = typeof stockForecasting.$inferSelect;
export type TimeClock = typeof timeClock.$inferSelect;
export type StaffIncentive = typeof staffIncentives.$inferSelect;
export type StaffMessage = typeof staffMessages.$inferSelect;
export type ProductPerformance = typeof productPerformance.$inferSelect;
export type CustomAlert = typeof customAlerts.$inferSelect;
export type DemandForecasting = typeof demandForecasting.$inferSelect;
export type QrSupplierReceiving = typeof qrSupplierReceiving.$inferSelect;
export type PromotionTemplate = typeof promotionTemplates.$inferSelect;
export type CustomerInsight = typeof customerInsights.$inferSelect;
export type PushNotification = typeof pushNotifications.$inferSelect;

export type InsertBatchEditOperation = z.infer<typeof insertBatchEditOperationSchema>;
export type InsertExpiryTracking = z.infer<typeof insertExpiryTrackingSchema>;
export type InsertStockForecasting = z.infer<typeof insertStockForecastingSchema>;
export type InsertTimeClock = z.infer<typeof insertTimeClockSchema>;
export type InsertStaffIncentive = z.infer<typeof insertStaffIncentiveSchema>;
export type InsertStaffMessage = z.infer<typeof insertStaffMessageSchema>;
export type InsertProductPerformance = z.infer<typeof insertProductPerformanceSchema>;
export type InsertCustomAlert = z.infer<typeof insertCustomAlertSchema>;
export type InsertDemandForecasting = z.infer<typeof insertDemandForecastingSchema>;
export type InsertQrSupplierReceiving = z.infer<typeof insertQrSupplierReceivingSchema>;
export type InsertPromotionTemplate = z.infer<typeof insertPromotionTemplateSchema>;
export type InsertCustomerInsight = z.infer<typeof insertCustomerInsightSchema>;
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
