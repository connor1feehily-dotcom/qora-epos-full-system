import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, Package, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface StatusPanelsProps {
  tillId?: string;
  className?: string;
}

interface SalesData {
  hour: string;
  sales: number;
}

interface TillHealth {
  status: 'healthy' | 'warning' | 'error';
  lastTransaction: string;
  transactionCount: number;
  uptime: string;
}

interface StockAlert {
  productName: string;
  currentStock: number;
  minStock: number;
  urgent: boolean;
}

export function StatusPanels({ tillId, className }: StatusPanelsProps) {
  const { data: todaysSales = [] } = useQuery<SalesData[]>({
    queryKey: ['/api/analytics/todays-sales', tillId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tillHealth } = useQuery<TillHealth>({
    queryKey: ['/api/analytics/till-health', tillId],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: lowStockItems = [] } = useQuery<StockAlert[]>({
    queryKey: ['/api/analytics/low-stock'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Generate sample data for sparkline charts
  const salesSparklineData = todaysSales.length > 0 ? todaysSales : [
    { hour: '09:00', sales: 120 },
    { hour: '10:00', sales: 180 },
    { hour: '11:00', sales: 240 },
    { hour: '12:00', sales: 320 },
    { hour: '13:00', sales: 280 },
    { hour: '14:00', sales: 360 },
    { hour: '15:00', sales: 420 },
    { hour: '16:00', sales: 380 },
    { hour: '17:00', sales: 450 },
  ];

  const totalSales = salesSparklineData.reduce((sum, item) => sum + item.sales, 0);
  const avgSales = Math.round(totalSales / salesSparklineData.length);

  const urgentStockAlerts = lowStockItems.filter(item => item.urgent).length;
  const totalStockAlerts = lowStockItems.length;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Today's Sales Panel */}
      <Card className="kxl-status-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Today's Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">€{totalSales.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mb-4">
            +12.5% from yesterday
          </div>
          <div className="kxl-sparkline-container h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSparklineData}>
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  className="kxl-sparkline-animate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Avg: €{avgSales}</span>
            <span className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Peak: 17:00
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Till Health Panel */}
      <Card className="kxl-status-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Till Health</CardTitle>
          <CheckCircle className={`h-4 w-4 ${
            tillHealth?.status === 'healthy' ? 'text-green-500' :
            tillHealth?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-3">
            <Badge 
              variant={tillHealth?.status === 'healthy' ? 'default' : 'destructive'}
              className={
                tillHealth?.status === 'healthy' ? 'bg-green-100 text-green-800 border-green-200' :
                tillHealth?.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }
            >
              {tillHealth?.status === 'healthy' ? 'Healthy' :
               tillHealth?.status === 'warning' ? 'Warning' : 'Error'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Till {tillId || '001'}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-medium">{tillHealth?.transactionCount || 47}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{tillHealth?.uptime || '8h 23m'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Sale</span>
              <span className="font-medium">{tillHealth?.lastTransaction || '2 min ago'}</span>
            </div>
          </div>

          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                tillHealth?.status === 'healthy' ? 'bg-green-500' :
                tillHealth?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: tillHealth?.status === 'healthy' ? '85%' : '45%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Panel */}
      <Card className="kxl-status-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Stock Alerts</CardTitle>
          <Package className={`h-4 w-4 ${urgentStockAlerts > 0 ? 'text-red-500' : 'text-green-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-3">
            <div className="text-2xl font-bold text-primary">{totalStockAlerts}</div>
            <div className="text-xs text-muted-foreground">
              {urgentStockAlerts > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                  {urgentStockAlerts} urgent
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-20 overflow-y-auto custom-scroll">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.productName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.currentStock}</span>
                    {item.urgent && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">All items well stocked</div>
            )}
          </div>

          {totalStockAlerts > 3 && (
            <div className="mt-2 text-xs text-muted-foreground">
              +{totalStockAlerts - 3} more items need attention
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Stock Level</span>
            <span className="text-xs font-medium">
              {urgentStockAlerts === 0 ? 'Good' : 'Attention Needed'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}