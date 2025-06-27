import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Smartphone,
  Bell,
  TrendingUp,
  Package,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  Calendar,
  Clock,
  DollarSign,
  ShoppingCart,
  Activity
} from 'lucide-react';

export default function MobileCompanion() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('GET', '/api/mobile/notifications'),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Sales alerts
  const { data: salesAlerts } = useQuery({
    queryKey: ['sales-alerts'],
    queryFn: () => apiRequest('GET', '/api/mobile/sales-alerts'),
    refetchInterval: 60000 // Refresh every minute
  });

  // Mobile dashboard
  const { data: dashboard } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => apiRequest('GET', '/api/mobile/dashboard'),
    refetchInterval: 60000
  });

  // Inventory data
  const { data: inventory, refetch: refetchInventory } = useQuery({
    queryKey: ['mobile-inventory'],
    queryFn: () => apiRequest('GET', '/api/mobile/inventory')
  });

  // Pending approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => apiRequest('GET', '/api/mobile/approvals/pending'),
    refetchInterval: 30000
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest('PUT', `/api/mobile/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Inventory adjustment
  const adjustInventoryMutation = useMutation({
    mutationFn: ({ productId, adjustment, reason }: any) =>
      apiRequest('POST', '/api/mobile/inventory/adjust', { productId, adjustment, reason }),
    onSuccess: () => {
      toast({ title: 'Inventory Updated', description: 'Stock levels have been adjusted' });
      refetchInventory();
    }
  });

  // Process approval
  const processApprovalMutation = useMutation({
    mutationFn: ({ approvalId, action, notes }: any) =>
      apiRequest('POST', `/api/mobile/approvals/${approvalId}/process`, { action, notes }),
    onSuccess: (_, variables) => {
      toast({ 
        title: 'Approval Processed', 
        description: `Request has been ${variables.action}d` 
      });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    }
  });

  const NotificationBadge = ({ type, priority }: any) => {
    const variants: any = {
      sale_alert: 'default',
      inventory_low: 'destructive',
      approval_request: 'secondary',
      shift_alert: 'outline'
    };
    
    return (
      <Badge variant={variants[type] || 'default'} className="text-xs">
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mobile Manager</h1>
          <p className="text-muted-foreground">Real-time POS management</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="text-xs">
            <Activity className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs relative">
            <Bell className="h-4 w-4" />
            {notifications?.filter((n: any) => !n.isRead).length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {notifications.filter((n: any) => !n.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs">
            <Package className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs relative">
            <CheckCircle className="h-4 w-4" />
            {pendingApprovals?.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Sales</p>
                    <p className="text-lg font-bold">€{dashboard?.todaySales || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-bold">{dashboard?.transactionCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Low Stock</p>
                    <p className="text-lg font-bold">{dashboard?.lowStockCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Active Staff</p>
                    <p className="text-lg font-bold">{dashboard?.activeStaff || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Sales Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                {salesAlerts?.slice(0, 5).map((alert: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">€{alert.amount}</Badge>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-3">
          <ScrollArea className="h-96">
            {notifications?.map((notification: any) => (
              <Card key={notification.id} className={`mb-3 ${!notification.isRead ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <NotificationBadge type={notification.type} priority={notification.priority} />
                    <p className="text-xs text-muted-foreground">{notification.createdAt}</p>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{notification.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                  {!notification.isRead && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7"
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-3">
          <ScrollArea className="h-96">
            {inventory?.map((item: any) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.barcode}</p>
                    </div>
                    <Badge variant={item.stock <= item.minStock ? 'destructive' : 'outline'}>
                      {item.stock} units
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustInventoryMutation.mutate({
                        productId: item.id,
                        adjustment: -1,
                        reason: 'Mobile adjustment'
                      })}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="text-sm font-medium min-w-16 text-center">
                      Stock: {item.stock}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustInventoryMutation.mutate({
                        productId: item.id,
                        adjustment: 1,
                        reason: 'Mobile adjustment'
                      })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-3">
          <ScrollArea className="h-96">
            {pendingApprovals?.map((approval: any) => (
              <Card key={approval.id} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{approval.type.replace('_', ' ')}</Badge>
                    <p className="text-xs text-muted-foreground">{approval.createdAt}</p>
                  </div>
                  
                  <h3 className="font-medium text-sm mb-1">
                    {approval.type === 'purchase_order' && 'Purchase Order Approval'}
                    {approval.type === 'staff_shift' && 'Shift Change Request'}
                    {approval.type === 'inventory_adjustment' && 'Inventory Adjustment'}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    Requested by: {approval.requestedBy}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => processApprovalMutation.mutate({
                        approvalId: approval.id,
                        action: 'approve',
                        notes: 'Approved via mobile'
                      })}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => processApprovalMutation.mutate({
                        approvalId: approval.id,
                        action: 'reject',
                        notes: 'Rejected via mobile'
                      })}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}