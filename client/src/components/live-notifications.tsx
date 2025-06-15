import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Clock,
  X,
  Settings
} from "lucide-react";
import type { Transaction, Product, Customer } from "@shared/schema";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  category: 'sales' | 'inventory' | 'system' | 'customer';
}

export function LiveNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'sales' | 'inventory' | 'system'>('all');

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    refetchInterval: 120000 // Refresh every 2 minutes
  });

  // Generate smart notifications based on data changes
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();

      // Sales notifications
      const recentTransactions = transactions.filter(t => {
        const transactionTime = new Date(t.createdAt!);
        return now.getTime() - transactionTime.getTime() < 300000; // Last 5 minutes
      });

      if (recentTransactions.length > 5) {
        newNotifications.push({
          id: `sales-spike-${now.getTime()}`,
          type: 'success',
          title: 'Sales Spike Detected',
          message: `${recentTransactions.length} transactions in the last 5 minutes`,
          timestamp: now,
          read: false,
          category: 'sales'
        });
      }

      // High value transaction alert
      const highValueTransactions = recentTransactions.filter(t => parseFloat(t.total) > 50);
      highValueTransactions.forEach(t => {
        newNotifications.push({
          id: `high-value-${t.id}`,
          type: 'info',
          title: 'High Value Transaction',
          message: `€${parseFloat(t.total).toFixed(2)} sale on Till ${t.tillId}`,
          timestamp: new Date(t.createdAt!),
          read: false,
          category: 'sales'
        });
      });

      // Inventory notifications
      const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
      const outOfStockItems = products.filter(p => p.stock === 0);

      if (outOfStockItems.length > 0) {
        newNotifications.push({
          id: `out-of-stock-${now.getTime()}`,
          type: 'error',
          title: 'Products Out of Stock',
          message: `${outOfStockItems.length} products need immediate restocking`,
          timestamp: now,
          read: false,
          actionable: true,
          category: 'inventory'
        });
      }

      if (lowStockItems.length > 0) {
        newNotifications.push({
          id: `low-stock-${now.getTime()}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockItems.length} products running low`,
          timestamp: now,
          read: false,
          actionable: true,
          category: 'inventory'
        });
      }

      // System performance notifications
      const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return transactionDate.getTime() >= today.getTime();
      });

      const dailyTarget = 1000; // €1000 daily target
      const currentSales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
      const targetProgress = (currentSales / dailyTarget) * 100;

      if (targetProgress >= 100 && !notifications.some(n => n.id.includes('target-achieved'))) {
        newNotifications.push({
          id: `target-achieved-${now.getTime()}`,
          type: 'success',
          title: 'Daily Target Achieved!',
          message: `Great job! You've reached €${currentSales.toFixed(2)} today`,
          timestamp: now,
          read: false,
          category: 'sales'
        });
      }

      // Customer notifications
      const loyaltyMilestones = customers.filter(c => c.loyaltyPoints > 0 && c.loyaltyPoints % 100 === 0);
      loyaltyMilestones.forEach(customer => {
        if (!notifications.some(n => n.id === `loyalty-${customer.id}-${customer.loyaltyPoints}`)) {
          newNotifications.push({
            id: `loyalty-${customer.id}-${customer.loyaltyPoints}`,
            type: 'info',
            title: 'Loyalty Milestone',
            message: `${customer.name} reached ${customer.loyaltyPoints} points!`,
            timestamp: now,
            read: false,
            category: 'customer'
          });
        }
      });

      // System health notifications
      const currentHour = now.getHours();
      if (currentHour === 9 && !notifications.some(n => n.id.includes('daily-briefing'))) {
        newNotifications.push({
          id: `daily-briefing-${now.toDateString()}`,
          type: 'info',
          title: 'Daily Briefing',
          message: 'System online. Ready for business operations.',
          timestamp: now,
          read: false,
          category: 'system'
        });
      }

      // Add new notifications to existing ones (avoiding duplicates)
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
        return [...uniqueNewNotifications, ...prev].slice(0, 50); // Keep last 50 notifications
      });
    };

    generateNotifications();
  }, [transactions, products, customers]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'sales': return <DollarSign className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Live Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 mt-4">
          {['all', 'unread', 'sales', 'inventory', 'system'].map(filterType => (
            <Button
              key={filterType}
              size="sm"
              variant={filter === filterType ? "default" : "outline"}
              onClick={() => setFilter(filterType as any)}
              className="capitalize"
            >
              {filterType}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getCategoryIcon(notification.category)}
                            <span className="capitalize">{notification.category}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          {notification.actionable && (
                            <Badge variant="outline" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeNotification(notification.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
              <p className="text-xs text-gray-600">Total Notifications</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'success').length}
              </p>
              <p className="text-xs text-gray-600">Positive Alerts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}