import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Euro, 
  Receipt, 
  Fuel, 
  AlertTriangle, 
  Plus, 
  Truck, 
  Percent, 
  FileText,
  CreditCard,
  Banknote
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/types";

export default function BackOffice() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/analytics/dashboard'],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Back Office Dashboard</h2>
            <p className="text-sm text-gray-600">Manage your store operations and view performance metrics</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today's Sales</p>
            <p className="text-xl font-semibold text-gray-900">€{metrics.dailyRevenue.toFixed(2)}</p>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    €{metrics.dailyRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Euro className="text-success w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">+12.5% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.transactions}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Receipt className="text-primary w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">+8.3% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fuel Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.fuelSales}L</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Fuel className="text-warning w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-error mt-2">-3.2% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.lowStock}</p>
                </div>
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-error w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-error mt-2">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col bg-primary/5 border-primary/20 hover:bg-primary/10"
                >
                  <Plus className="text-primary w-5 h-5 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Add Product</span>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col bg-secondary/5 border-secondary/20 hover:bg-secondary/10"
                >
                  <Truck className="text-secondary w-5 h-5 mb-2" />
                  <span className="text-sm font-medium text-gray-900">New Order</span>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col bg-warning/5 border-warning/20 hover:bg-warning/10"
                >
                  <Percent className="text-warning w-5 h-5 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Add Promotion</span>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col bg-gray-50 border-gray-200 hover:bg-gray-100"
                >
                  <FileText className="text-gray-600 w-5 h-5 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Generate Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="link" className="text-primary">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentTransactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {transaction.paymentMethod === 'card' ? (
                          <CreditCard className="text-primary w-4 h-4" />
                        ) : (
                          <Banknote className="text-secondary w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #TXN-{String(transaction.id).padStart(6, '0')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString('en-IE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {transaction.paymentMethod === 'card' ? 'Card Payment' : 'Cash Payment'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      €{parseFloat(transaction.total).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                {metrics.recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No recent transactions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
