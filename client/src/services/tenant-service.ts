/**
 * Tenant Service - Core Multi-Tenant Architecture
 * Handles shop isolation, routing, and tenant-specific operations
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string; // Used in subdomain: slug.kerriganspos.com
  businessType: string;
  domain: string | null; // Custom domain if any
  isActive: boolean;
  plan: 'basic' | 'pro' | 'enterprise';
  settings: TenantSettings;
  createdAt: Date;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface TenantSettings {
  // Business Info
  businessName: string;
  address: string;
  phone: string;
  email: string;
  
  // Tax & Finance
  taxRate: number;
  currency: string;
  receiptFooter: string;
  
  // POS Settings
  allowDiscounts: boolean;
  requireStaffPin: boolean;
  autoOpenCashDrawer: boolean;
  printReceiptByDefault: boolean;
  
  // Hardware Config
  printerConfig: {
    enabled: boolean;
    type: 'thermal' | 'a4';
    name: string;
    width: number;
  };
  scannerConfig: {
    enabled: boolean;
    type: 'usb' | 'bluetooth';
    name: string;
  };
  
  // Branding
  logo: string | null;
  primaryColor: string;
  theme: 'light' | 'dark' | 'auto';
}

class TenantService {
  private currentTenant: Tenant | null = null;
  private currentTenantSlug: string | null = null;
  
  /**
   * Initialize tenant from URL/subdomain
   * Examples: dublin-retail.quantumpos.ie, cork-hospitality.quantumpos.ie
   */
  async initializeTenant(): Promise<Tenant | null> {
    try {
      const hostname = window.location.hostname;
      let tenantSlug: string | null = null;
      
      // Extract tenant from subdomain
      if (hostname.includes('.quantumpos.ie')) {
        tenantSlug = hostname.split('.')[0];
      } 
      // Local development - use query param
      else if (hostname.includes('localhost') || hostname.includes('replit.dev')) {
        const urlParams = new URLSearchParams(window.location.search);
        tenantSlug = urlParams.get('shop') || 'demo';
      }
      
      if (!tenantSlug) {
        // No tenant specified - redirect to main site
        window.location.href = 'https://quantumpos.ie';
        return null;
      }
      
      // Store tenant slug for use in API calls
      this.currentTenantSlug = tenantSlug;
      
      // Fetch tenant data
      const response = await fetch(`/api/tenants/${tenantSlug}`);
      if (!response.ok) {
        throw new Error(`Tenant not found: ${tenantSlug}`);
      }
      
      this.currentTenant = await response.json();
      
      // Set tenant-specific styles
      this.applyTenantTheme();
      
      return this.currentTenant;
    } catch (error) {
      console.error('Failed to initialize tenant:', error);
      return null;
    }
  }
  
  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }
  
  /**
   * Get current tenant slug for API calls
   */
  getCurrentTenantSlug(): string | null {
    return this.currentTenantSlug;
  }
  
  /**
   * Check if user has admin access to tenant
   */
  hasAdminAccess(userId: string): boolean {
    if (!this.currentTenant) return false;
    
    // Super admin always has access
    if (userId === 'super_admin') return true;
    
    // Check if user is tenant owner/admin
    // This would check against tenant staff table
    return true; // Simplified for now
  }
  
  /**
   * Apply tenant-specific theming
   */
  private applyTenantTheme(): void {
    if (!this.currentTenant) return;
    
    const { settings } = this.currentTenant;
    
    // Set CSS custom properties for tenant branding
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', settings.primaryColor);
    
    // Set page title
    document.title = `${settings.businessName} - POS System`;
    
    // Set favicon if custom logo exists
    if (settings.logo) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.logo;
      }
    }
  }
  
  /**
   * Get tenant-specific API base URL
   */
  getApiUrl(endpoint: string): string {
    const baseUrl = '/api';
    const tenantId = this.currentTenant?.id;
    
    if (!tenantId) {
      throw new Error('No tenant context available');
    }
    
    // All API calls include tenant context
    return `${baseUrl}/tenant/${tenantId}${endpoint}`;
  }
  
  /**
   * Switch tenant (for admin users)
   */
  async switchTenant(tenantSlug: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/tenants/${tenantSlug}`);
      if (!response.ok) return false;
      
      const tenant = await response.json();
      this.currentTenant = tenant;
      this.applyTenantTheme();
      
      // Update URL to reflect tenant switch
      const url = new URL(window.location.href);
      url.searchParams.set('shop', tenantSlug);
      window.history.replaceState({}, '', url.toString());
      
      return true;
    } catch (error) {
      console.error('Failed to switch tenant:', error);
      return false;
    }
  }
  
  /**
   * Create new tenant (admin only)
   */
  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant | null> {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tenant');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      return null;
    }
  }
  
  /**
   * Get all tenants (admin only)
   */
  async getAllTenants(): Promise<Tenant[]> {
    try {
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      return [];
    }
  }
  
  /**
   * Remote access - Get access token for tenant (support admin only)
   */
  async getRemoteAccessToken(tenantId: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/admin/remote-access/${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get remote access token');
      }
      
      const { token } = await response.json();
      return token;
    } catch (error) {
      console.error('Failed to get remote access token:', error);
      return null;
    }
  }
  
  /**
   * Check if current session is remote access
   */
  isRemoteAccess(): boolean {
    return localStorage.getItem('remote_access_session') === 'true';
  }
  
  /**
   * Start remote access session
   */
  startRemoteAccessSession(token: string): void {
    localStorage.setItem('remote_access_token', token);
    localStorage.setItem('remote_access_session', 'true');
  }
  
  /**
   * End remote access session
   */
  endRemoteAccessSession(): void {
    localStorage.removeItem('remote_access_token');
    localStorage.removeItem('remote_access_session');
  }
}

// Singleton instance
export const tenantService = new TenantService();

// Tenant context hook for React components
export function useTenant() {
  return {
    tenant: tenantService.getCurrentTenant(),
    hasAdminAccess: (userId: string) => tenantService.hasAdminAccess(userId),
    switchTenant: (slug: string) => tenantService.switchTenant(slug),
    isRemoteAccess: () => tenantService.isRemoteAccess(),
    getApiUrl: (endpoint: string) => tenantService.getApiUrl(endpoint),
  };
}