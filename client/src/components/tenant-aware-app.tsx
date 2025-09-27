/**
 * Tenant-Aware App Wrapper
 * Automatically detects tenant and provides tenant-specific routing
 */

import { useState, useEffect } from 'react';
import { tenantService, type Tenant } from '@/services/tenant-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Store, Monitor, Zap } from 'lucide-react';
import CentralAdminDashboard from './central-admin-dashboard';
import SimpleTillAuth from './simple-till-auth';

interface TenantAwareAppProps {
  children: React.ReactNode;
}

export default function TenantAwareApp({ children }: TenantAwareAppProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCentralAdmin, setIsCentralAdmin] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Check if this is central admin access
      const hostname = window.location.hostname;
      const isAdmin = hostname === 'admin.kerriganspos.com' || 
                     (hostname.includes('localhost') && window.location.search.includes('admin=true'));
      
      if (isAdmin) {
        setIsCentralAdmin(true);
        setIsLoading(false);
        return;
      }
      
      // Initialize tenant
      const detectedTenant = await tenantService.initializeTenant();
      
      if (!detectedTenant) {
        // No tenant found - redirect to main site or show tenant selector
        setError('Shop not found');
      } else {
        setTenant(detectedTenant);
      }
      
    } catch (err) {
      setError('Failed to load shop. Please try again.');
      console.error('Tenant initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Loading KerrigansPOS...</h2>
              <p className="text-gray-600">Connecting to your shop</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Central Admin Dashboard
  if (isCentralAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <CentralAdminDashboard />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-800">Shop Not Found</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = 'https://kerriganspos.com'}>
                <Store className="w-4 h-4 mr-2" />
                Visit Main Site
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No tenant but no error - show tenant selector
  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">KerrigansPOS</h1>
              <p className="text-gray-600">Multi-Tenant Retail Management Platform</p>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Select Your Shop</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button 
                  className="h-16"
                  onClick={() => window.location.href = '?shop=kerrigan'}
                >
                  <Store className="w-5 h-5 mr-2" />
                  Kerrigan's XL
                </Button>
                <Button 
                  className="h-16"
                  onClick={() => window.location.href = '?shop=crown-pub'}
                >
                  <Store className="w-5 h-5 mr-2" />
                  Crown Pub
                </Button>
                <Button 
                  className="h-16"
                  onClick={() => window.location.href = '?shop=city-coffee'}
                >
                  <Store className="w-5 h-5 mr-2" />
                  City Coffee
                </Button>
                <Button 
                  className="h-16"
                  onClick={() => window.location.href = '?shop=demo'}
                >
                  <Store className="w-5 h-5 mr-2" />
                  Demo Shop
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '?admin=true'}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Platform Admin Access
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tenant-specific app with branding
  return (
    <div 
      className="min-h-screen"
      style={{
        '--tenant-primary': tenant.settings.primaryColor,
      } as React.CSSProperties}
    >
      {/* Remote Access Banner */}
      {tenantService.isRemoteAccess() && (
        <div className="bg-red-600 text-white px-4 py-2 text-center font-semibold animate-pulse">
          🔴 REMOTE ADMIN SESSION ACTIVE - Support is viewing this screen
        </div>
      )}
      
      {/* Tenant-specific header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.settings.logo && (
              <img src={tenant.settings.logo} alt={tenant.name} className="h-8 w-auto" />
            )}
            <div>
              <h1 className="font-bold text-lg">{tenant.settings.businessName}</h1>
              <p className="text-xs text-gray-500">{tenant.slug}.kerriganspos.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">Online</span>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}