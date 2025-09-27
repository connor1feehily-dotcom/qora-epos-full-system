/**
 * Tenant Management API Routes
 * Handles multi-tenant operations, remote access, and central admin
 */

import express from 'express';
import { requireTenant, requireAdmin, addTenantFilter, trackRemoteSession, getAllShopStatuses, updateShopStatus } from './tenant-middleware';

const router = express.Router();

/**
 * PUBLIC TENANT ROUTES - No auth required
 */

// Get tenant by slug (for tenant initialization)
router.get('/tenants/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Mock tenant data - In real app this would query database
    const TENANTS = {
      'kerrigan': {
        id: 'tenant_001',
        name: "Kerrigan's XL",
        slug: 'kerrigan',
        businessType: 'offlicense',
        domain: null,
        isActive: true,
        plan: 'pro',
        createdAt: new Date(),
        owner: {
          name: 'Kerrigan Walsh',
          email: 'kerrigan@kerrigansxl.com',
          phone: '+353 1 234 5678'
        },
        settings: {
          businessName: "Kerrigan's XL Off License",
          address: '123 Main Street, Dublin 1, Ireland',
          phone: '+353 1 234 5678',
          email: 'info@kerrigansxl.com',
          taxRate: 0.23,
          currency: 'EUR',
          receiptFooter: 'Thank you for shopping with us!',
          allowDiscounts: true,
          requireStaffPin: true,
          autoOpenCashDrawer: true,
          printReceiptByDefault: true,
          printerConfig: {
            enabled: true,
            type: 'thermal',
            name: 'Receipt Printer',
            width: 58
          },
          scannerConfig: {
            enabled: true,
            type: 'usb',
            name: 'Barcode Scanner'
          },
          logo: null,
          primaryColor: '#dc2626',
          theme: 'light'
        }
      },
      'crown-pub': {
        id: 'tenant_002',
        name: 'The Crown Pub',
        slug: 'crown-pub',
        businessType: 'pub',
        domain: null,
        isActive: true,
        plan: 'basic',
        createdAt: new Date(),
        owner: {
          name: 'Michael Crown',
          email: 'michael@crownpub.ie',
          phone: '+353 1 567 8901'
        },
        settings: {
          businessName: 'The Crown Pub',
          address: '456 High Street, Cork, Ireland',
          phone: '+353 1 567 8901',
          email: 'info@crownpub.ie',
          taxRate: 0.135, // Reduced rate for food
          currency: 'EUR',
          receiptFooter: 'Sláinte! Come back soon!',
          allowDiscounts: false,
          requireStaffPin: true,
          autoOpenCashDrawer: true,
          printReceiptByDefault: true,
          printerConfig: {
            enabled: true,
            type: 'thermal',
            name: 'Bar Printer',
            width: 58
          },
          scannerConfig: {
            enabled: false,
            type: 'usb',
            name: ''
          },
          logo: null,
          primaryColor: '#059669',
          theme: 'dark'
        }
      },
      'city-coffee': {
        id: 'tenant_003',
        name: 'City Coffee Co',
        slug: 'city-coffee',
        businessType: 'cafe',
        domain: null,
        isActive: true,
        plan: 'basic',
        createdAt: new Date(),
        owner: {
          name: 'Sarah Thompson',
          email: 'sarah@citycoffee.ie',
          phone: '+353 1 890 1234'
        },
        settings: {
          businessName: 'City Coffee Company',
          address: '789 Coffee Street, Galway, Ireland',
          phone: '+353 1 890 1234',
          email: 'hello@citycoffee.ie',
          taxRate: 0.135,
          currency: 'EUR',
          receiptFooter: 'Freshly roasted daily ☕',
          allowDiscounts: true,
          requireStaffPin: false,
          autoOpenCashDrawer: true,
          printReceiptByDefault: true,
          printerConfig: {
            enabled: true,
            type: 'thermal',
            name: 'Coffee Printer',
            width: 80
          },
          scannerConfig: {
            enabled: true,
            type: 'bluetooth',
            name: 'Coffee Scanner'
          },
          logo: null,
          primaryColor: '#d97706',
          theme: 'light'
        }
      },
      'demo': {
        id: 'tenant_demo',
        name: 'Demo Shop',
        slug: 'demo',
        businessType: 'retail',
        domain: null,
        isActive: true,
        plan: 'basic',
        createdAt: new Date(),
        owner: {
          name: 'Demo User',
          email: 'demo@kerriganspos.com',
          phone: '+353 1 000 0000'
        },
        settings: {
          businessName: 'Demo Retail Store',
          address: '123 Demo Street, Demo City, Ireland',
          phone: '+353 1 000 0000',
          email: 'demo@kerriganspos.com',
          taxRate: 0.23,
          currency: 'EUR',
          receiptFooter: 'This is a demo store',
          allowDiscounts: true,
          requireStaffPin: true,
          autoOpenCashDrawer: false,
          printReceiptByDefault: false,
          printerConfig: {
            enabled: false,
            type: 'thermal',
            name: '',
            width: 58
          },
          scannerConfig: {
            enabled: false,
            type: 'usb',
            name: ''
          },
          logo: null,
          primaryColor: '#3b82f6',
          theme: 'auto'
        }
      }
    };
    
    const tenant = TENANTS[slug as keyof typeof TENANTS];
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (error) {
    console.error('Tenant lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup tenant' });
  }
});

/**
 * ADMIN ROUTES - Require admin authentication
 */

// Get all tenants (platform admin only)
router.get('/admin/tenants', requireAdmin, async (req, res) => {
  try {
    // Mock response - would query database in real app
    const tenants = [
      {
        id: 'tenant_001',
        name: "Kerrigan's XL",
        slug: 'kerrigan',
        businessType: 'offlicense',
        isActive: true,
        plan: 'pro',
        owner: { name: 'Kerrigan Walsh', email: 'kerrigan@kerrigansxl.com' },
        settings: { businessName: "Kerrigan's XL Off License" }
      },
      {
        id: 'tenant_002',
        name: 'The Crown Pub',
        slug: 'crown-pub',
        businessType: 'pub',
        isActive: true,
        plan: 'basic',
        owner: { name: 'Michael Crown', email: 'michael@crownpub.ie' },
        settings: { businessName: 'The Crown Pub' }
      },
      {
        id: 'tenant_003',
        name: 'City Coffee Co',
        slug: 'city-coffee',
        businessType: 'cafe',
        isActive: true,
        plan: 'basic',
        owner: { name: 'Sarah Thompson', email: 'sarah@citycoffee.ie' },
        settings: { businessName: 'City Coffee Company' }
      },
      {
        id: 'tenant_demo',
        name: 'Demo Shop',
        slug: 'demo',
        businessType: 'retail',
        isActive: true,
        plan: 'basic',
        owner: { name: 'Demo User', email: 'demo@kerriganspos.com' },
        settings: { businessName: 'Demo Retail Store' }
      }
    ];
    
    res.json(tenants);
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Create new tenant (platform admin only)
router.post('/admin/tenants', requireAdmin, async (req, res) => {
  try {
    // Would create tenant in database
    const newTenant = {
      id: `tenant_${Date.now()}`,
      ...req.body,
      createdAt: new Date(),
      isActive: true
    };
    
    res.status(201).json(newTenant);
  } catch (error) {
    console.error('Failed to create tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Get shop statuses for central dashboard
router.get('/admin/shop-statuses', requireAdmin, async (req, res) => {
  try {
    // Mock shop status data - would query real status in production
    const statuses = [
      {
        tenantId: 'tenant_001',
        isOnline: true,
        lastSeen: new Date(),
        activeUsers: 2,
        todayRevenue: 1247.50,
        todayTransactions: 43
      },
      {
        tenantId: 'tenant_002',
        isOnline: true,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        activeUsers: 1,
        todayRevenue: 890.20,
        todayTransactions: 28
      },
      {
        tenantId: 'tenant_003',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        activeUsers: 0,
        todayRevenue: 456.80,
        todayTransactions: 15
      },
      {
        tenantId: 'tenant_demo',
        isOnline: true,
        lastSeen: new Date(),
        activeUsers: 0,
        todayRevenue: 0,
        todayTransactions: 0
      }
    ];
    
    res.json(statuses);
  } catch (error) {
    console.error('Failed to get shop statuses:', error);
    res.status(500).json({ error: 'Failed to get shop statuses' });
  }
});

// Create remote access session (admin only)
router.post('/admin/remote-access/:tenantId', requireAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Create remote access session
    const sessionId = trackRemoteSession(tenantId, 'support_admin');
    
    res.json({ 
      token: sessionId,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Failed to create remote access session:', error);
    res.status(500).json({ error: 'Failed to create remote access session' });
  }
});

/**
 * TENANT-SPECIFIC ROUTES - Require tenant context
 */

// Update shop status (called by POS systems)
router.post('/tenant/:tenantId/status', requireTenant, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const statusUpdate = req.body;
    
    updateShopStatus(tenantId, statusUpdate);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update shop status:', error);
    res.status(500).json({ error: 'Failed to update shop status' });
  }
});

// Get tenant-specific data with proper isolation
router.get('/tenant/:tenantId/*', requireTenant, async (req, res) => {
  try {
    // This would proxy to existing API routes with tenant filtering
    // For now, return success
    res.json({ message: 'Tenant-specific data endpoint', tenantId: req.tenant?.tenantId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenant data' });
  }
});

export default router;