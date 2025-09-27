import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Store, 
  Users, 
  BarChart3, 
  Settings, 
  Eye, 
  Trash2, 
  Plus,
  Server,
  Activity,
  DollarSign,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  slug: string;
  businessType: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface AdminStats {
  totalShops: number;
  activeShops: number;
  totalRevenue: number;
  monthlyGrowth: number;
  businessTypes: Record<string, number>;
}

export default function PlatformAdmin() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusines

  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch organizations and stats
  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, []);

  // Filter organizations based on search and filters
  useEffect(() => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(org => org.businessType === businessTypeFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(org => org.isActive === isActive);
    }

    setFilteredOrgs(filtered);
  }, [organizations, searchTerm, businessTypeFilter, statusFilter]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const fetchStats = async () => {
    // Calculate stats from organizations
    const totalShops = organizations.length;
    const activeShops = organizations.filter(org => org.isActive).length;
    const businessTypeCounts = organizations.reduce((acc, org) => {
      acc[org.businessType] = (acc[org.businessType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalShops,
      activeShops,
      totalRevenue: 125430.50, // Mock data - would come from transactions
      monthlyGrowth: 12.5,
      businessTypes: businessTypeCounts
    });
  };

  const toggleOrganizationStatus = async (orgId: number) => {
    // Mock API call - would implement actual status toggle
    setOrganizations(orgs => 
      orgs.map(org => 
        org.id === orgId ? { ...org, isActive: !org.isActive } : org
      )
    );
  };

  const deleteOrganization = async (orgId: number) => {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      setOrganizations(orgs => orgs.filter(org => org.id !== orgId));
    }
  };

  const getBusinessTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pub: 'bg-amber-100 text-amber-800',
      restaurant: 'bg-green-100 text-green-800',
      cafe: 'bg-brown-100 text-brown-800',
      retail: 'bg-blue-100 text-blue-800',
      garage: 'bg-gray-100 text-gray-800',
      pharmacy: 'bg-red-100 text-red-800',
      bakery: 'bg-yellow-100 text-yellow-800',
      salon: 'bg-pink-100 text-pink-800',
      butcher: 'bg-red-100 text-red-800',
      hardware: 'bg-orange-100 text-orange-800',
      wholesaler: 'bg-purple-100 text-purple-800',
      offlicense: 'bg-indigo-100 text-indigo-800',
      popup: 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const uniqueBusinessTypes = [...new Set(organizations.map(org => org.businessType))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Platform Administration
          </h1>
          <p className="text-gray-600 mt-2">Manage all shops and organizations across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-add-org">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
          <Button variant="outline" data-testid="button-refresh">
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Store className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold">{stats.totalShops}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Shops</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeShops}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-green-600">+{stats.monthlyGrowth}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="business-types">Business Types</TabsTrigger>
          <TabsTrigger value="system">System Management</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-organizations"
                    />
                  </div>
                </div>
                
                <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueBusinessTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations ({filteredOrgs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">@{org.slug}</div>
                            {org.email && <div className="text-xs text-gray-400">{org.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getBusinessTypeColor(org.businessType)}>
                            {org.businessType.charAt(0).toUpperCase() + org.businessType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.isActive ? "default" : "secondary"}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrg(org);
                                setShowOrgDetails(true);
                              }}
                              data-testid={`view-org-${org.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={org.isActive ? "secondary" : "default"}
                              onClick={() => toggleOrganizationStatus(org.id)}
                              data-testid={`toggle-org-${org.id}`}
                            >
                              {org.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteOrganization(org.id)}
                              data-testid={`delete-org-${org.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Type Distribution */}
                {stats && (
                  <div>
                    <h3 className="font-semibold mb-4">Business Type Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.businessTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <Badge className={getBusinessTypeColor(type)}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Badge>
                          <span className="font-medium">{count} shops</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recent Activity */}
                <div>
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="text-sm text-gray-600">
                    <p>Analytics dashboard coming soon...</p>
                    <p>Will include:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Daily/Monthly revenue charts</li>
                      <li>Active users per organization</li>
                      <li>Transaction volumes</li>
                      <li>Performance metrics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Template Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                <p>Manage available business templates and their configurations.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {uniqueBusinessTypes.map(type => {
                  const count = stats?.businessTypes[type] || 0;
                  return (
                    <Card key={type} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={getBusinessTypeColor(type)}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">{count} shops</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`configure-${type}`}>
                          Configure
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`view-template-${type}`}>
                          View Template
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Port-Based Shop Isolation</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Each shop runs on isolated ports:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code>Port 5000</code> - Platform Admin</li>
                      <li><code>Port 5001</code> - Kerrigan's XL</li>
                      <li><code>Port 5002</code> - Test Coffee Shop</li>
                      <li><code>Port 5003</code> - Available</li>
                      <li><code>Port 5004</code> - Available</li>
                    </ul>
                  </div>
                  <Button className="mt-4" data-testid="configure-ports">
                    Configure Ports
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">System Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Database Status</span>
                      <Badge>Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Sessions</span>
                      <span>24</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage</span>
                      <span>45%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Organization Details Dialog */}
      <Dialog open={showOrgDetails} onOpenChange={setShowOrgDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Name:</label>
                  <p>{selectedOrg.name}</p>
                </div>
                <div>
                  <label className="font-medium">Slug:</label>
                  <p>@{selectedOrg.slug}</p>
                </div>
                <div>
                  <label className="font-medium">Business Type:</label>
                  <Badge className={getBusinessTypeColor(selectedOrg.businessType)}>
                    {selectedOrg.businessType}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium">Status:</label>
                  <Badge variant={selectedOrg.isActive ? "default" : "secondary"}>
                    {selectedOrg.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {selectedOrg.address && (
                <div>
                  <label className="font-medium">Address:</label>
                  <p>{selectedOrg.address}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button data-testid="access-shop">Access Shop</Button>
                <Button variant="outline" data-testid="view-analytics">View Analytics</Button>
                <Button variant="outline" data-testid="manage-users">Manage Users</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}