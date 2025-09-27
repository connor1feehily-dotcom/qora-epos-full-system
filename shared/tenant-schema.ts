/**
 * Multi-Tenant Database Schema
 * Extends existing schema with proper tenant isolation
 */

import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Core tenant table
export const tenants = pgTable('tenants', {
  id: varchar('id').primaryKey(), // tenant_001, tenant_002, etc
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull().unique(), // Used in subdomain
  businessType: varchar('business_type').notNull(),
  domain: varchar('domain'), // Custom domain if any
  isActive: boolean('is_active').default(true).notNull(),
  plan: varchar('plan').notNull().default('basic'), // basic, pro, enterprise
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Owner information
  ownerName: varchar('owner_name').notNull(),
  ownerEmail: varchar('owner_email').notNull(),
  ownerPhone: varchar('owner_phone'),
  
  // Business settings (JSON for flexibility)
  settings: jsonb('settings').notNull().default('{}'),
});

// Tenant admin users (for remote access and management)
export const tenantAdmins = pgTable('tenant_admins', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id').references(() => tenants.id).notNull(),
  userId: varchar('user_id').notNull(), // From main auth system
  role: varchar('role').notNull().default('admin'), // admin, manager, viewer
  canRemoteAccess: boolean('can_remote_access').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Remote access sessions tracking
export const remoteAccessSessions = pgTable('remote_access_sessions', {
  id: varchar('id').primaryKey(),
  tenantId: varchar('tenant_id').references(() => tenants.id).notNull(),
  adminUserId: varchar('admin_user_id').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  ipAddress: varchar('ip_address'),
  userAgent: text('user_agent'),
});

// Shop status tracking for central dashboard
export const shopStatuses = pgTable('shop_statuses', {
  tenantId: varchar('tenant_id').primaryKey().references(() => tenants.id),
  isOnline: boolean('is_online').default(false).notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  activeUsers: integer('active_users').default(0).notNull(),
  todayRevenue: decimal('today_revenue', { precision: 10, scale: 2 }).default('0.00').notNull(),
  todayTransactions: integer('today_transactions').default(0).notNull(),
  hardwareStatus: jsonb('hardware_status').default('{}'), // Printer, scanner status
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Extend existing tables with tenantId for isolation
// These would be modifications to existing tables in your main schema

// Example of how to add tenant isolation to existing tables:
/*
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id').references(() => tenants.id).notNull(), // NEW: Tenant isolation
  name: varchar('name').notNull(),
  barcode: varchar('barcode'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  category: varchar('category'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id').references(() => tenants.id).notNull(), // NEW: Tenant isolation
  name: varchar('name').notNull(),
  tillCode: varchar('till_code').notNull(), // 4-digit code like 1001, 1002
  role: varchar('role').notNull().default('cashier'),
  isActive: boolean('is_active').default(true).notNull(),
  canAccessBackOffice: boolean('can_access_back_office').default(false).notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id').references(() => tenants.id).notNull(), // NEW: Tenant isolation
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0.00'),
  paymentMethod: varchar('payment_method').notNull(),
  items: jsonb('items').notNull(), // Transaction line items
  receiptPrinted: boolean('receipt_printed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
*/

// Zod schemas for tenant operations
export const insertTenantSchema = createInsertSchema(tenants, {
  settings: z.object({
    businessName: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    taxRate: z.number().min(0).max(1),
    currency: z.string().default('EUR'),
    receiptFooter: z.string().optional(),
    allowDiscounts: z.boolean().default(true),
    requireStaffPin: z.boolean().default(true),
    autoOpenCashDrawer: z.boolean().default(true),
    printReceiptByDefault: z.boolean().default(true),
    printerConfig: z.object({
      enabled: z.boolean().default(false),
      type: z.enum(['thermal', 'a4']).default('thermal'),
      name: z.string().default(''),
      width: z.number().default(58),
    }),
    scannerConfig: z.object({
      enabled: z.boolean().default(false),
      type: z.enum(['usb', 'bluetooth']).default('usb'),
      name: z.string().default(''),
    }),
    logo: z.string().nullable().optional(),
    primaryColor: z.string().default('#dc2626'),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
  })
}).omit({ 
  id: true,
  createdAt: true, 
  updatedAt: true 
});

export const insertTenantAdminSchema = createInsertSchema(tenantAdmins).omit({
  id: true,
  createdAt: true,
});

export const insertRemoteAccessSessionSchema = createInsertSchema(remoteAccessSessions).omit({
  startedAt: true,
  lastActivity: true,
});

export const updateShopStatusSchema = createInsertSchema(shopStatuses).omit({
  tenantId: true,
  updatedAt: true,
}).partial();

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type TenantAdmin = typeof tenantAdmins.$inferSelect;
export type InsertTenantAdmin = z.infer<typeof insertTenantAdminSchema>;
export type RemoteAccessSession = typeof remoteAccessSessions.$inferSelect;
export type InsertRemoteAccessSession = z.infer<typeof insertRemoteAccessSessionSchema>;
export type ShopStatus = typeof shopStatuses.$inferSelect;
export type UpdateShopStatus = z.infer<typeof updateShopStatusSchema>;