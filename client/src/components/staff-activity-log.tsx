import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Edit, 
  Package, 
  CheckCircle, 
  DollarSign,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import type { StaffActivityLog, User as UserType } from '@shared/schema';

interface ActivityLogWithUser extends StaffActivityLog {
  user: UserType;
}

export function StaffActivityLog() {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Get activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLogWithUser[]>({
    queryKey: ['/api/staff-activity', { 
      user: selectedUser !== 'all' ? selectedUser : undefined,
      action: selectedAction !== 'all' ? selectedAction : undefined,
      dateRange,
      search: searchTerm
    }],
  });

  // Get users for filter
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'price_change': return <DollarSign className="h-4 w-4" />;
      case 'stock_update': return <Package className="h-4 w-4" />;
      case 'delivery_approval': return <CheckCircle className="h-4 w-4" />;
      case 'user_login': return <User className="h-4 w-4" />;
      case 'product_edit': return <Edit className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'price_change': return 'bg-blue-100 text-blue-800';
      case 'stock_update': return 'bg-green-100 text-green-800';
      case 'delivery_approval': return 'bg-purple-100 text-purple-800';
      case 'user_login': return 'bg-gray-100 text-gray-800';
      case 'product_edit': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (oldValue: any, newValue: any, action: string) => {
    if (action === 'price_change') {
      const oldPrice = parseFloat(oldValue?.price || 0);
      const newPrice = parseFloat(newValue?.price || 0);
      const change = Math.abs(newPrice - oldPrice);
      
      if (change > 10) return 'border-l-red-500';
      if (change > 5) return 'border-l-yellow-500';
      return 'border-l-green-500';
    }
    
    if (action === 'stock_update') {
      const oldStock = parseInt(oldValue?.stock || 0);
      const newStock = parseInt(newValue?.stock || 0);
      const change = Math.abs(newStock - oldStock);
      
      if (change > 100) return 'border-l-red-500';
      if (change > 50) return 'border-l-yellow-500';
      return 'border-l-green-500';
    }
    
    return 'border-l-gray-300';
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getActivitySummary = () => {
    const today = new Date();
    const todayLogs = activityLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate.toDateString() === today.toDateString();
    });

    const priceChanges = todayLogs.filter(log => log.action === 'price_change').length;
    const stockUpdates = todayLogs.filter(log => log.action === 'stock_update').length;
    const deliveryApprovals = todayLogs.filter(log => log.action === 'delivery_approval').length;

    return { todayLogs: todayLogs.length, priceChanges, stockUpdates, deliveryApprovals };
  };

  const summary = getActivitySummary();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Activity Log</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50">
            {activityLogs.length} Activities
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.todayLogs}</div>
            <p className="text-xs text-gray-600">Total actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Price Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.priceChanges}</div>
            <p className="text-xs text-gray-600">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stock Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.stockUpdates}</div>
            <p className="text-xs text-gray-600">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.deliveryApprovals}</div>
            <p className="text-xs text-gray-600">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="user-filter">Staff Member</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action-filter">Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="price_change">Price Changes</SelectItem>
                  <SelectItem value="stock_update">Stock Updates</SelectItem>
                  <SelectItem value="delivery_approval">Delivery Approvals</SelectItem>
                  <SelectItem value="product_edit">Product Edits</SelectItem>
                  <SelectItem value="user_login">User Logins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-filter">Time Period</Label>
              <Select value={dateRange} onValueChange={(value: 'today' | 'week' | 'month') => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activity found for the selected filters.</p>
              </div>
            ) : (
              activityLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`p-4 border-l-4 ${getSeverityColor(log.oldValue, log.newValue, log.action)} bg-white rounded-r shadow-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Table:</span> {log.tableName} • 
                          <span className="font-medium"> Record ID:</span> {log.recordId}
                        </div>
                        
                        {log.reason && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Reason:</span> {log.reason}
                          </div>
                        )}
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.oldValue && (
                            <div className="bg-red-50 p-3 rounded">
                              <div className="text-xs font-medium text-red-800 mb-1">Previous Value:</div>
                              <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                {formatValue(log.oldValue)}
                              </pre>
                            </div>
                          )}
                          
                          {log.newValue && (
                            <div className="bg-green-50 p-3 rounded">
                              <div className="text-xs font-medium text-green-800 mb-1">New Value:</div>
                              <pre className="text-xs text-green-700 whitespace-pre-wrap">
                                {formatValue(log.newValue)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}