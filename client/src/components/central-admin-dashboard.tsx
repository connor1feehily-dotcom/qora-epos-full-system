import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  Store, 
  Users, 
  BarChart3, 
  Settings, 
  Eye, 
  Monitor,
  Activity,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Zap,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react';
import { tenantService, type Tenant } from '@/services/tenant-service';

interface ShopStatus {
  tenantId: string;
  isOnline: boolean;
  lastSeen: Date;
  activeUsers: number;
  todayRevenue: number;
  todayTransactions: number;
}

export default function CentralAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [shopStatuses, setShopStatuses] = useState<ShopStatus[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [remoteAccessDialog, setRemoteAccessDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTenants();
    loadShopStatuses();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadShopStatuses();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTenants = async () => {
    const allTenants = await tenantService.getAllTenants();
    setTenants(allTenants);
  };

  const loadShopStatuses = async () => {
    try {
      const response = await fetch('/api/admin/shop-statuses');
      const statuses = await response.json();
      setShopStatuses(statuses);
    } catch (error) {
      console.error('Failed to load shop statuses:', error);
    }
  };

  const handleRemoteAccess = async (tenant: Tenant) => {
    setIsLoading(true);
    try {
      const token = await tenantService.getRemoteAccessToken(tenant.id);
      if (token) {
        // Open new window with remote access
        const remoteUrl = `${window.location.origin}?shop=${tenant.slug}&remote_access=${token}`;
        window.open(remoteUrl, '_blank', 'width=1200,height=800');
        alert(`Remote access started for ${tenant.name}. You can now see their live till screen.`);
      } else {
        alert('Failed to establish remote access. Please try again.');
      }
    } catch (error) {
      alert('Remote access failed. Please check connection.');
    }
    setIsLoading(false);
  };

  const handleCreateTenant = () => {
    // This would open a tenant creation dialog
    alert('Tenant creation dialog would open here - full onboarding flow');
  };

  const getShopStatus = (tenantId: string): ShopStatus | null => {
    return shopStatuses.find(status => status.tenantId === tenantId) || null;
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalShops: tenants.length,
    activeShops: tenants.filter(t => t.isActive).length,
    onlineShops: shopStatuses.filter(s => s.isOnline).length,
    totalRevenue: shopStatuses.reduce((sum, s) => sum + s.todayRevenue, 0),
    totalTransactions: shopStatuses.reduce((sum, s) => sum + s.todayTransactions, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600 animate-pulse" />
            KerrigansPOS Central Command
          </h1>
          <p className="text-gray-600 mt-2">Multi-Tenant Retail Management Platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateTenant} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Shop
          </Button>
          <Button variant="outline" onClick={loadShopStatuses}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Store className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shops</p>
              <p className="text-2xl font-bold">{totalStats.totalShops}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.onlineShops}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today Revenue</p>
              <p className="text-2xl font-bold">€{totalStats.totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold">{totalStats.totalTransactions}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rate</p>
              <p className="text-2xl font-bold">{Math.round((totalStats.activeShops / totalStats.totalShops) * 100)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search shops by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shops Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shops ({filteredTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Today's Sales</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => {
                  const status = getShopStatus(tenant.id);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">
                            {tenant.slug}.kerriganspos.com
                          </div>
                          <div className="text-xs text-gray-400">
                            {tenant.settings.businessName}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {status?.isOnline ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <Badge 
                            variant={tenant.isActive ? "default" : "secondary"}
                            className={status?.isOnline ? "bg-green-100 text-green-800" : ""}
                          >
                            {status?.isOnline ? 'Online' : tenant.isActive ? 'Offline' : 'Inactive'}
                          </Badge>
                          {status?.activeUsers > 0 && (
                            <span className="text-xs text-blue-600">
                              {status.activeUsers} user{status.activeUsers !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">{tenant.plan}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">€{status?.todayRevenue.toFixed(2) || '0.00'}</div>
                          <div className="text-xs text-gray-500">{status?.todayTransactions || 0} trans</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {status?.lastSeen ? new Date(status.lastSeen).toLocaleString() : 'Never'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRemoteAccess(tenant)}
                            disabled={!status?.isOnline || isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Monitor className="h-4 w-4 mr-1" />
                            Remote Access
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `${window.location.origin}?shop=${tenant.slug}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shop Details Dialog */}
      <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shop Settings: {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Business Name:</label>
                  <p>{selectedTenant.settings.businessName}</p>
                </div>
                <div>
                  <label className="font-medium">Plan:</label>
                  <Badge>{selectedTenant.plan}</Badge>
                </div>
                <div>
                  <label className="font-medium">Owner:</label>
                  <p>{selectedTenant.owner.name}</p>
                </div>
                <div>
                  <label className="font-medium">Email:</label>
                  <p>{selectedTenant.owner.email}</p>
                </div>
              </div>
              
              <div>
                <label className="font-medium">Address:</label>
                <p>{selectedTenant.settings.address}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleRemoteAccess(selectedTenant)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Start Remote Session
                </Button>
                <Button variant="outline">Edit Settings</Button>
                <Button variant="outline">View Reports</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}