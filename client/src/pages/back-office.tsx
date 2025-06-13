import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Euro, 
  Receipt, 
  Fuel, 
  AlertTriangle, 
  Package, 
  Users, 
  Truck, 
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Settings,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Activity
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/types";
import type { Product, Transaction } from "@shared/schema";

export default function BackOffice() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/analytics/dashboard'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const isLoading = metricsLoading;

  // Calculate additional metrics
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * parseFloat(p.cost?.toString() || '0')), 0);

  const todayTransactions = transactions.filter(t => {
    const today = new Date();
    const transactionDate = new Date(t.createdAt);
    return transactionDate.toDateString() === today.toDateString();
  });

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = todayTransactions.filter(t => {
      return new Date(t.createdAt).getHours() === hour;
    });
    return {
      hour,
      sales: hourTransactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0),
      transactions: hourTransactions.length
    };
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
              <p className="text-gray-600 mt-1">Monitor operations and manage your business</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">€{metrics?.dailyRevenue?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-gray-500">Today's Revenue</div>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Daily Sales</p>
                        <p className="text-2xl font-bold text-blue-900">€{metrics?.dailyRevenue?.toFixed(2) || '0.00'}</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">+12.5%</span>
                        </div>
                      </div>
                      <Euro className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Transactions</p>
                        <p className="text-2xl font-bold text-green-900">{metrics?.transactions || 0}</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">+8.3%</span>
                        </div>
                      </div>
                      <Receipt className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">Fuel Sales</p>
                        <p className="text-2xl font-bold text-orange-900">{metrics?.fuelSales || 0}L</p>
                        <div className="flex items-center mt-2">
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">-3.2%</span>
                        </div>
                      </div>
                      <Fuel className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 text-sm font-medium">Low Stock</p>
                        <p className="text-2xl font-bold text-red-900">{lowStockProducts.length}</p>
                        <div className="flex items-center mt-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">Attention needed</span>
                        </div>
                      </div>
                      <Package className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/inventory">
                      <Button variant="outline" className="w-full justify-start">
                        <Package className="w-4 h-4 mr-2" />
                        Manage Inventory
                      </Button>
                    </Link>
                    <Link href="/customers">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Customer Database
                      </Button>
                    </Link>
                    <Link href="/suppliers">
                      <Button variant="outline" className="w-full justify-start">
                        <Truck className="w-4 h-4 mr-2" />
                        Supplier Management
                      </Button>
                    </Link>
                    <Link href="/reports">
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Reports
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Store Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Inventory Status</span>
                        <span className="text-green-600">Good</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Sales Performance</span>
                        <span className="text-blue-600">Excellent</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Customer Satisfaction</span>
                        <span className="text-yellow-600">Good</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(metrics?.recentTransactions || []).slice(0, 4).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            {transaction.paymentMethod === 'card' ? (
                              <CreditCard className="w-4 h-4 text-blue-500 mr-2" />
                            ) : (
                              <Banknote className="w-4 h-4 text-green-500 mr-2" />
                            )}
                            <span>Sale #{transaction.id}</span>
                          </div>
                          <span className="font-medium">€{parseFloat(transaction.total).toFixed(2)}</span>
                        </div>
                      ))}
                      {(!metrics?.recentTransactions || metrics.recentTransactions.length === 0) && (
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <CreditCard className="w-8 h-8 text-blue-500 mr-3" />
                          <div>
                            <p className="font-semibold">Card Payments</p>
                            <p className="text-sm text-gray-600">Electronic transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">€{((metrics?.dailyRevenue || 0) * 0.7).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">70% of sales</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Banknote className="w-8 h-8 text-green-500 mr-3" />
                          <div>
                            <p className="font-semibold">Cash Payments</p>
                            <p className="text-sm text-gray-600">Physical currency</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">€{((metrics?.dailyRevenue || 0) * 0.3).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">30% of sales</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{todayTransactions.length}</p>
                          <p className="text-sm text-gray-600">Today's Transactions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">
                            €{todayTransactions.length > 0 ? ((metrics?.dailyRevenue || 0) / todayTransactions.length).toFixed(2) : '0.00'}
                          </p>
                          <p className="text-sm text-gray-600">Average Sale</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Peak Hours Today</h4>
                        {hourlyData.slice(0, 3).map((hour, index) => (
                          <div key={hour.hour} className="flex justify-between text-sm py-1">
                            <span>{hour.hour}:00 - {hour.hour + 1}:00</span>
                            <span>€{hour.sales.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Products</span>
                        <span className="font-semibold">{products.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Value</span>
                        <span className="font-semibold">€{totalInventoryValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock</span>
                        <Badge variant={lowStockProducts.length > 0 ? "destructive" : "secondary"}>
                          {lowStockProducts.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Out of Stock</span>
                        <Badge variant={outOfStockProducts.length > 0 ? "destructive" : "secondary"}>
                          {outOfStockProducts.length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Alert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.category}</p>
                          </div>
                          <Badge variant="destructive">{product.stock}</Badge>
                        </div>
                      ))}
                      {lowStockProducts.length === 0 && (
                        <p className="text-gray-500 text-sm">All products well stocked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Drinks', 'Food', 'Fuel', 'Tobacco', 'News'].map((category) => {
                        const categoryProducts = products.filter(p => p.category === category);
                        const percentage = products.length > 0 ? (categoryProducts.length / products.length) * 100 : 0;
                        return (
                          <div key={category}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{category}</span>
                              <span>{categoryProducts.length} items</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/inventory">
                      <Button variant="outline" className="w-full justify-between" size="lg">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 mr-3" />
                          Inventory Management
                        </div>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/customers">
                      <Button variant="outline" className="w-full justify-between" size="lg">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-3" />
                          Customer Database
                        </div>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/suppliers">
                      <Button variant="outline" className="w-full justify-between" size="lg">
                        <div className="flex items-center">
                          <Truck className="w-5 h-5 mr-3" />
                          Supplier Management
                        </div>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/reports">
                      <Button variant="outline" className="w-full justify-between" size="lg">
                        <div className="flex items-center">
                          <BarChart3 className="w-5 h-5 mr-3" />
                          Reports & Analytics
                        </div>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-medium">POS System</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-medium">Inventory System</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-medium">Payment Processing</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="font-medium">Backup System</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
