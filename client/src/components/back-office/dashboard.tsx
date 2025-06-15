import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  Receipt, 
  AlertTriangle,
  Activity,
  Clock,
  Target,
  BarChart3
} from "lucide-react";
import type { Product, Transaction, Customer, User, TillSession } from "@shared/schema";

export function Dashboard() {
  // Fetch all necessary data
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['/api/products'] });
  const { data: transactions = [] } = useQuery<Transaction[]>({ queryKey: ['/api/transactions'] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ['/api/customers'] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['/api/users'] });
  const { data: tillSessions = [] } = useQuery<TillSession[]>({ queryKey: ['/api/till-sessions'] });

  // Calculate key metrics
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  const todayTransactions = transactions.filter(t => 
    new Date(t.createdAt || '') >= todayStart
  );
  
  const todayRevenue = todayTransactions.reduce((sum, t) => 
    sum + parseFloat(t.total.toString()), 0
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const weeklyTransactions = transactions.filter(t => 
    new Date(t.createdAt || '') >= weekStart
  );
  
  const weeklyRevenue = weeklyTransactions.reduce((sum, t) => 
    sum + parseFloat(t.total.toString()), 0
  );

  const totalInventoryValue = products.reduce((sum, p) => 
    sum + (parseFloat(p.price.toString()) * (p.stock || 0)), 0
  );

  const lowStockProducts = products.filter(p => (p.stock || 0) < 10);
  const activeTills = tillSessions.filter(s => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to Kerrigan's XL Management System</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="w-4 h-4 mr-1" />
            System Online
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="w-4 h-4 mr-1" />
            {activeTills} Tills Active
          </Badge>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Today's Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">€{todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-blue-600 mt-1">
              {todayTransactions.length} transactions today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Weekly Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">€{weeklyRevenue.toFixed(2)}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {weeklyTransactions.length} transactions this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Inventory Value</CardTitle>
            <Package className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">€{totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-purple-600 mt-1">
              {products.length} products in stock
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Customers</CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{customers.length}</div>
            <p className="text-xs text-orange-600 mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Recent Transactions</span>
            </CardTitle>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Transaction #{transaction.id}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.tillId} • {transaction.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">€{parseFloat(transaction.total.toString()).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt || '').toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Stock Alerts & System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Stock Alerts & Status</span>
            </CardTitle>
            <Badge variant={lowStockProducts.length > 0 ? "destructive" : "secondary"}>
              {lowStockProducts.length} alerts
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {/* Low Stock Alerts */}
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-700 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Low Stock Items
                    </h4>
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-800">{product.name}</p>
                          <p className="text-sm text-orange-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">{product.stock || 0} left</Badge>
                          <p className="text-sm text-orange-600 mt-1">€{parseFloat(product.price.toString()).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-600 font-medium">All stock levels optimal</p>
                    <p className="text-sm text-gray-500">No immediate restocking required</p>
                  </div>
                )}

                {/* System Status */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 flex items-center mb-3">
                    <Activity className="w-4 h-4 mr-2" />
                    System Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payment Processing</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Till Systems</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">{activeTills} Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Staff Users</span>
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300">{users.length} Registered</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}