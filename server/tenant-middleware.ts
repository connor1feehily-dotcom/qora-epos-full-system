/**
 * Tenant Middleware - Multi-Tenant Request Handling
 * Automatically detects tenant from subdomain/URL and adds tenant context
 */

import { Request, Response, NextFunction } from 'express';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  isRemoteAccess: boolean;
  adminUserId?: string;
}

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

/**
 * Professional tenant database - Enterprise multi-business support
 */
const TENANTS = {
  'dublin-retail': {
    id: 'tenant_001',
    slug: 'dublin-retail',
    name: "Dublin Retail Solutions",
    businessType: 'retail',
    isActive: true
  },
  'cork-hospitality': {
    id: 'tenant_002', 
    slug: 'cork-hospitality',
    name: 'Cork Hospitality Group',
    businessType: 'hospitality',
    isActive: true
  },
  'galway-coffee': {
    id: 'tenant_003',
    slug: 'galway-coffee', 
    name: 'Galway Coffee Enterprises',
    businessType: 'cafe',
    isActive: true
  },
  'demo': {
    id: 'tenant_demo',
    slug: 'demo',
    name: 'Demo Environment',
    businessType: 'demo',
    isActive: true
  }
};

/**
 * Extract tenant slug from hostname or query parameters
 */
function extractTenantSlug(req: Request): string | null {
  const hostname = req.hostname;
  
  // Check for subdomain: tenant.quantumpos.ie
  if (hostname.includes('.quantumpos.ie')) {
    return hostname.split('.')[0];
  }
  
  // Local development - check query parameter
  if (hostname.includes('localhost') || hostname.includes('replit.dev')) {
    return req.query.shop as string || 'demo';
  }
  
  return null;
}

/**
 * Tenant resolution middleware
 */
export function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const tenantSlug = extractTenantSlug(req);
  
  // Debug logging
  console.log(`Tenant middleware: ${req.method} ${req.url}, hostname: ${req.hostname}, query: ${JSON.stringify(req.query)}, extracted slug: ${tenantSlug}`);
  
  if (!tenantSlug) {
    // No tenant specified - this is main platform access
    return next();
  }
  
  // Look up tenant
  const tenant = TENANTS[tenantSlug as keyof typeof TENANTS];
  if (!tenant) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  if (!tenant.isActive) {
    return res.status(403).json({ error: 'Shop is temporarily unavailable' });
  }
  
  // Check for remote access token
  const remoteToken = req.query.remote_access as string;
  const isRemoteAccess = !!remoteToken;
  
  if (isRemoteAccess) {
    // Validate remote access token (simplified)
    if (!remoteToken.startsWith('remote_')) {
      return res.status(401).json({ error: 'Invalid remote access token' });
    }
  }
  
  // Add tenant context to request
  req.tenant = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    isRemoteAccess,
    adminUserId: isRemoteAccess ? 'support_admin' : undefined
  };
  
  // Add tenant context to all API responses
  res.setHeader('X-Tenant-Id', tenant.id);
  res.setHeader('X-Tenant-Slug', tenant.slug);
  
  next();
}

/**
 * Require tenant middleware - ensures tenant context exists
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
}

/**
 * Admin access middleware - for platform admin routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // Simplified admin check - in real app this would validate JWT
  if (authHeader !== 'Bearer admin_token') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Database query helper with tenant isolation
 */
export function addTenantFilter(query: any, req: Request) {
  if (!req.tenant) {
    throw new Error('Tenant context required for database queries');
  }
  
  // Add organizationId filter to isolate tenant data
  return {
    ...query,
    organizationId: parseInt(req.tenant.tenantId.replace('tenant_', '')) || 1
  };
}

/**
 * Remote access session tracking
 */
const activeRemoteSessions = new Map<string, {
  tenantId: string;
  adminUserId: string;
  startedAt: Date;
  lastActivity: Date;
}>();

export function trackRemoteSession(tenantId: string, adminUserId: string): string {
  const sessionId = `remote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  activeRemoteSessions.set(sessionId, {
    tenantId,
    adminUserId,
    startedAt: new Date(),
    lastActivity: new Date()
  });
  
  // Clean up old sessions after 1 hour
  setTimeout(() => {
    activeRemoteSessions.delete(sessionId);
  }, 60 * 60 * 1000);
  
  return sessionId;
}

export function getActiveRemoteSessions() {
  return Array.from(activeRemoteSessions.values());
}

/**
 * Shop status tracking for central admin
 */
const shopStatuses = new Map<string, {
  tenantId: string;
  isOnline: boolean;
  lastSeen: Date;
  activeUsers: number;
  todayRevenue: number;
  todayTransactions: number;
}>();

export function updateShopStatus(tenantId: string, data: Partial<{
  isOnline: boolean;
  activeUsers: number;
  todayRevenue: number;
  todayTransactions: number;
}>) {
  const existing = shopStatuses.get(tenantId) || {
    tenantId,
    isOnline: false,
    lastSeen: new Date(),
    activeUsers: 0,
    todayRevenue: 0,
    todayTransactions: 0
  };
  
  shopStatuses.set(tenantId, {
    ...existing,
    ...data,
    lastSeen: new Date()
  });
}

export function getAllShopStatuses() {
  return Array.from(shopStatuses.values());
}