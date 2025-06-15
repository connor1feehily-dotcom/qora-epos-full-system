import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Calendar,
  Target,
  AlertTriangle,
  Star,
  Clock,
  BarChart3,
  PieChart,
  Download
} from "lucide-react";
import type { Transaction, Product, Customer } from "@shared/schema";

export function AdvancedAnalytics() {
  const [timeframe, setTimeframe] = useState("today");
  const [tillFilter, setTillFilter] = useState("all");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions']
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers']
  });

  // Calculate analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = transactions.filter(t => 
    new Date(t.createdAt!).getTime() >= today.getTime()
  );

  const totalSales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const avgTransaction = todayTransactions.length > 0 ? totalSales / todayTransactions.length : 0;
  const cashSales = todayTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + parseFloat(t.total), 0);
  const cardSales = todayTransactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + parseFloat(t.total), 0);

  // Peak hours analysis
  const hourlyData = Array(24).fill(0);
  todayTransactions.forEach(t => {
    const hour = new Date(t.createdAt!).getHours();
    hourlyData[hour] += parseFloat(t.total);
  });

  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));

  // Top products
  const productSales = new Map();
  todayTransactions.forEach(t => {
    // This would be properly calculated with transaction items in real implementation
    productSales.set(t.id, (productSales.get(t.id) || 0) + parseFloat(t.total));
  });

  // Low stock alerts
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const outOfStock = products.filter(p => p.stock === 0);

  // Customer insights
  const loyaltyCustomers = customers.filter(c => c.loyaltyPoints > 100);
  const newCustomers = customers.filter(c => {
    const created = new Date(c.createdAt!);
    return created.getTime() >= today.getTime();
  });

  const exportData = () => {
    const data = {
      summary: {
        date: today.toISOString().split('T')[0],
        totalSales,
        transactionCount: todayTransactions.length,
        avgTransaction,
        cashSales,
        cardSales
      },
      hourlyBreakdown: hourlyData,
      lowStockItems: lowStockItems.map(p => ({
        name: p.name,
        currentStock: p.stock,
        minStock: p.minStock
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${today.toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Real-time business insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">€{totalSales.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{todayTransactions.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+8% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-purple-600">€{avgTransaction.toFixed(2)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+3.2% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold text-orange-600">{peakHour}:00</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">€{hourlyData[peakHour].toFixed(2)} sales</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Cash Sales</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{cashSales.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Card Sales</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{cardSales.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{totalSales > 0 ? ((cardSales / totalSales) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Hourly Sales Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyData.slice(8, 20).map((amount, index) => {
                const hour = index + 8;
                const ispeak = hour === peakHour;
                return (
                  <div key={hour} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-gray-600">{hour}:00</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${ispeak ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.max((amount / Math.max(...hourlyData)) * 100, 2)}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-sm font-medium">€{amount.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outOfStock.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800">Out of Stock ({outOfStock.length})</p>
                  {outOfStock.slice(0, 3).map(product => (
                    <p key={product.id} className="text-sm text-red-600">• {product.name}</p>
                  ))}
                </div>
              )}
              {lowStockItems.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800">Low Stock ({lowStockItems.length})</p>
                  {lowStockItems.slice(0, 3).map(product => (
                    <p key={product.id} className="text-sm text-yellow-600">
                      • {product.name} ({product.stock} left)
                    </p>
                  ))}
                </div>
              )}
              {outOfStock.length === 0 && lowStockItems.length === 0 && (
                <p className="text-gray-500 text-center py-4">All inventory levels healthy</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Customers</span>
                <span className="font-bold">{customers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Loyalty Members</span>
                <span className="font-bold">{loyaltyCustomers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Today</span>
                <span className="font-bold">{newCustomers.length}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-2">Top Loyalty Points:</p>
                {customers
                  .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                  .slice(0, 3)
                  .map(customer => (
                    <div key={customer.id} className="flex justify-between text-sm">
                      <span>{customer.name}</span>
                      <span className="font-medium">{customer.loyaltyPoints} pts</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">85</div>
              <p className="text-gray-600 mb-4">Overall Store Performance</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sales Target</span>
                  <Badge variant="default">90%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Inventory Health</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Customer Satisfaction</span>
                  <Badge variant="default">95%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Staff Efficiency</span>
                  <Badge variant="default">88%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline">Generate Sales Report</Button>
            <Button variant="outline">Update Inventory</Button>
            <Button variant="outline">Customer Campaign</Button>
            <Button variant="outline">Staff Performance</Button>
            <Button variant="outline">Price Optimization</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}