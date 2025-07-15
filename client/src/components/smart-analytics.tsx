import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Activity,
  Eye,
  Settings,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Zap,
  Brain,
  Lightbulb,
  Gauge,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Star,
  ThermometerSun,
  Layers,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  Flame,
  Snowflake,
  Calendar as CalendarIconSolid
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ProductPerformance {
  id: number;
  productId: number;
  date: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  averageMargin: number;
  returnsCount: number;
  stockTurnover: number;
  performanceScore: number;
  category: string;
  createdAt: string;
}

interface CustomAlert {
  id: number;
  name: string;
  alertType: string;
  metric: string;
  threshold: number;
  condition: string;
  timeframe: string;
  isActive: boolean;
  lastTriggered?: string;
  createdBy: number;
  createdAt: string;
}

interface DemandForecasting {
  id: number;
  productId: number;
  forecastDate: string;
  predictedDemand: number;
  actualDemand?: number;
  seasonalityFactor: number;
  trendFactor: number;
  localEventImpact: number;
  weatherImpact: number;
  confidenceLevel: number;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface HeatmapData {
  product: string;
  category: string;
  sales: number;
  revenue: number;
  performance: number;
  color: string;
}

export default function SmartAnalytics() {
  const [selectedTab, setSelectedTab] = useState('heatmaps');
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<CustomAlert | null>(null);
  const [newAlert, setNewAlert] = useState({
    name: '',
    alertType: '',
    metric: '',
    threshold: 0,
    condition: '',
    timeframe: ''
  });
  const [heatmapView, setHeatmapView] = useState('performance');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [analyticsFilters, setAnalyticsFilters] = useState({
    category: 'all',
    minSales: 0,
    timeframe: '30d'
  });

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: 60000
  });

  // Fetch product performance
  const { data: productPerformance = [] } = useQuery<ProductPerformance[]>({
    queryKey: ['/api/product-performance'],
    refetchInterval: 300000 // 5 minutes
  });

  // Fetch top performing products
  const { data: topProducts = [] } = useQuery<ProductPerformance[]>({
    queryKey: ['/api/product-performance/top', 10],
    refetchInterval: 300000
  });

  // Fetch custom alerts
  const { data: customAlerts = [] } = useQuery<CustomAlert[]>({
    queryKey: ['/api/custom-alerts'],
    refetchInterval: 60000
  });

  // Fetch active alerts
  const { data: activeAlerts = [] } = useQuery<CustomAlert[]>({
    queryKey: ['/api/custom-alerts/active'],
    refetchInterval: 30000
  });

  // Fetch demand forecasting
  const { data: demandForecasts = [] } = useQuery<DemandForecasting[]>({
    queryKey: ['/api/demand-forecasting'],
    refetchInterval: 300000
  });

  // Fetch analytics dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
    refetchInterval: 60000
  });

  // Custom alert mutations
  const createCustomAlert = useMutation({
    mutationFn: async (alert: any) => {
      const response = await fetch('/api/custom-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-alerts'] });
      toast({ title: 'Custom alert created successfully' });
      setShowAlertDialog(false);
    }
  });

  const updateCustomAlert = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/custom-alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-alerts'] });
      toast({ title: 'Custom alert updated successfully' });
    }
  });

  const triggerCustomAlert = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/custom-alerts/${alertId}/trigger`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-alerts'] });
      toast({ title: 'Alert triggered successfully' });
    }
  });

  // Demand forecasting mutations
  const generateDemandForecast = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/demand-forecasting/generate/${productId}`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/demand-forecasting'] });
      toast({ title: 'Demand forecast generated successfully' });
    }
  });

  const bulkGenerateDemandForecasts = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/demand-forecasting/generate-all', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/demand-forecasting'] });
      toast({ title: 'Bulk demand forecasts generated successfully' });
    }
  });

  // Analytics refresh
  const refreshAnalytics = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/analytics/refresh', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-performance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      toast({ title: 'Analytics refreshed successfully' });
    }
  });

  // Helper functions
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getAlertStatusColor = (alert: CustomAlert) => {
    if (!alert.isActive) return 'bg-gray-100 text-gray-800';
    if (alert.lastTriggered && new Date(alert.lastTriggered) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600';
    if (level >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const generateHeatmapData = (): HeatmapData[] => {
    return productPerformance.map(perf => {
      const product = products.find(p => p.id === perf.productId);
      return {
        product: product?.name || 'Unknown',
        category: perf.category,
        sales: perf.unitsSold,
        revenue: perf.revenue,
        performance: perf.performanceScore,
        color: getPerformanceColor(perf.performanceScore)
      };
    });
  };

  const getHeatmapValue = (data: HeatmapData) => {
    switch (heatmapView) {
      case 'sales': return data.sales;
      case 'revenue': return data.revenue;
      case 'performance': return data.performance;
      default: return data.performance;
    }
  };

  const handleAlertSubmit = () => {
    if (editingAlert) {
      updateCustomAlert.mutate({ id: editingAlert.id, updates: newAlert });
    } else {
      createCustomAlert.mutate(newAlert);
    }
    setEditingAlert(null);
    setNewAlert({
      name: '',
      alertType: '',
      metric: '',
      threshold: 0,
      condition: '',
      timeframe: ''
    });
  };

  const openEditAlert = (alert: CustomAlert) => {
    setEditingAlert(alert);
    setNewAlert({
      name: alert.name,
      alertType: alert.alertType,
      metric: alert.metric,
      threshold: alert.threshold,
      condition: alert.condition,
      timeframe: alert.timeframe
    });
    setShowAlertDialog(true);
  };

  const heatmapData = generateHeatmapData();
  const categories = [...new Set(products.map(p => p.category))];

  const filteredPerformance = productPerformance.filter(perf => {
    if (analyticsFilters.category !== 'all' && perf.category !== analyticsFilters.category) return false;
    if (perf.unitsSold < analyticsFilters.minSales) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Smart Analytics</h1>
        <p className="text-gray-600">Performance heatmaps, custom alerts, and demand forecasting</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="heatmaps">
            <Activity className="w-4 h-4 mr-2" />
            Performance Heatmaps
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Custom Alerts
          </TabsTrigger>
          <TabsTrigger value="forecasting">
            <Brain className="w-4 h-4 mr-2" />
            Demand Forecasting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmaps">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Heatmap Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Heatmap Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>View Type</Label>
                    <Select value={heatmapView} onValueChange={setHeatmapView}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance Score</SelectItem>
                        <SelectItem value="sales">Sales Volume</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category Filter</Label>
                    <Select value={analyticsFilters.category} onValueChange={(value) => setAnalyticsFilters({...analyticsFilters, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Min Sales</Label>
                    <Input
                      type="number"
                      value={analyticsFilters.minSales}
                      onChange={(e) => setAnalyticsFilters({...analyticsFilters, minSales: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <Button 
                    onClick={() => refreshAnalytics.mutate()}
                    className="w-full"
                    disabled={refreshAnalytics.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {topProducts.length}
                    </div>
                    <div className="text-sm text-green-600">Top Performers</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(productPerformance.reduce((sum, p) => sum + p.performanceScore, 0) / productPerformance.length)}
                    </div>
                    <div className="text-sm text-blue-600">Avg Performance</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(productPerformance.reduce((sum, p) => sum + p.averageMargin, 0) / productPerformance.length)}%
                    </div>
                    <div className="text-sm text-yellow-600">Avg Margin</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((perf, index) => {
                    const product = products.find(p => p.id === perf.productId);
                    return (
                      <div key={perf.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{product?.name}</div>
                            <div className="text-xs text-gray-500">{perf.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{perf.performanceScore}</div>
                          <div className="text-xs text-gray-500">{perf.unitsSold} sold</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Heatmap
                  </Button>
                  <Button variant="outline" className="w-full">
                    <PieChart className="w-4 h-4 mr-2" />
                    Category Analysis
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trend Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Heatmap */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThermometerSun className="w-5 h-5" />
                  Performance Heatmap - {heatmapView}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Excellent</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {heatmapData.map((item, index) => (
                    <div
                      key={index}
                      className="aspect-square p-2 rounded text-white text-xs flex flex-col justify-center items-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: item.color }}
                      title={`${item.product}: ${getHeatmapValue(item)}`}
                    >
                      <div className="font-bold truncate w-full text-center">
                        {item.product.substring(0, 8)}
                      </div>
                      <div className="text-xs opacity-90">
                        {getHeatmapValue(item)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredPerformance.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No performance data available for the selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Alert Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Alert Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowAlertDialog(true)}
                    className="w-full"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Alert Settings
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alert Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Alert Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {activeAlerts.length}
                    </div>
                    <div className="text-sm text-green-600">Active Alerts</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {customAlerts.filter(a => a.lastTriggered && new Date(a.lastTriggered) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-red-600">Triggered Today</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {customAlerts.length}
                    </div>
                    <div className="text-sm text-blue-600">Total Alerts</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Triggers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customAlerts
                    .filter(a => a.lastTriggered)
                    .sort((a, b) => new Date(b.lastTriggered!).getTime() - new Date(a.lastTriggered!).getTime())
                    .slice(0, 5)
                    .map(alert => (
                      <div key={alert.id} className="p-3 border rounded">
                        <div className="font-medium text-sm">{alert.name}</div>
                        <div className="text-xs text-gray-500">{alert.alertType.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(alert.lastTriggered!), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Alert Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Sales Drop</span>
                    </div>
                    <Badge variant="outline">
                      {customAlerts.filter(a => a.alertType === 'sales_drop').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Sales Spike</span>
                    </div>
                    <Badge variant="outline">
                      {customAlerts.filter(a => a.alertType === 'sales_spike').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Inventory Low</span>
                    </div>
                    <Badge variant="outline">
                      {customAlerts.filter(a => a.alertType === 'inventory_low').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Custom Alerts */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  All Custom Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customAlerts.map(alert => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{alert.name}</div>
                          <Badge className={getAlertStatusColor(alert)}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditAlert(alert)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerCustomAlert.mutate(alert.id)}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCustomAlert.mutate({
                              id: alert.id,
                              updates: { isActive: !alert.isActive }
                            })}
                          >
                            <Switch />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {alert.alertType.replace('_', ' ')} • {alert.metric} {alert.condition} {alert.threshold}
                      </div>
                      <div className="text-xs text-gray-500">
                        Timeframe: {alert.timeframe} • Created: {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                        {alert.lastTriggered && ` • Last triggered: ${format(new Date(alert.lastTriggered), 'MMM d, HH:mm')}`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Forecast Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Forecast Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => bulkGenerateDemandForecasts.mutate()}
                    className="w-full"
                    disabled={bulkGenerateDemandForecasts.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Forecasts
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Forecast Settings
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Forecasts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Forecast Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(demandForecasts.reduce((sum, f) => sum + f.confidenceLevel, 0) / demandForecasts.length * 100) || 0}%
                    </div>
                    <div className="text-sm text-green-600">Avg Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {demandForecasts.filter(f => f.confidenceLevel >= 0.8).length}
                    </div>
                    <div className="text-sm text-blue-600">High Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {demandForecasts.filter(f => f.actualDemand).length}
                    </div>
                    <div className="text-sm text-yellow-600">Validated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Forecast Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Seasonality</span>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Trend</span>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Local Events</span>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Weather</span>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <LineChart className="w-4 h-4 mr-2" />
                    Trend Analysis
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Local Events
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Demand Forecasts */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Demand Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Forecast Date</th>
                        <th className="text-left p-2">Predicted Demand</th>
                        <th className="text-left p-2">Actual Demand</th>
                        <th className="text-left p-2">Seasonality</th>
                        <th className="text-left p-2">Trend</th>
                        <th className="text-left p-2">Events</th>
                        <th className="text-left p-2">Weather</th>
                        <th className="text-left p-2">Confidence</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demandForecasts.map(forecast => {
                        const product = products.find(p => p.id === forecast.productId);
                        
                        return (
                          <tr key={forecast.id} className="border-b">
                            <td className="p-2">{product?.name}</td>
                            <td className="p-2">{format(new Date(forecast.forecastDate), 'MMM d')}</td>
                            <td className="p-2">{forecast.predictedDemand}</td>
                            <td className="p-2">{forecast.actualDemand || '-'}</td>
                            <td className="p-2">
                              <span className={forecast.seasonalityFactor > 1 ? 'text-green-600' : 'text-red-600'}>
                                {forecast.seasonalityFactor.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={forecast.trendFactor > 1 ? 'text-green-600' : 'text-red-600'}>
                                {forecast.trendFactor.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={forecast.localEventImpact > 0 ? 'text-green-600' : 'text-gray-500'}>
                                {forecast.localEventImpact.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={forecast.weatherImpact > 0 ? 'text-green-600' : 'text-gray-500'}>
                                {forecast.weatherImpact.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={getConfidenceColor(forecast.confidenceLevel)}>
                                {Math.round(forecast.confidenceLevel * 100)}%
                              </span>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateDemandForecast.mutate(forecast.productId)}
                              >
                                Refresh
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAlert ? 'Edit Custom Alert' : 'Create Custom Alert'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alert Name</Label>
              <Input
                value={newAlert.name}
                onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                placeholder="Enter alert name..."
              />
            </div>
            <div>
              <Label>Alert Type</Label>
              <Select value={newAlert.alertType} onValueChange={(value) => setNewAlert({...newAlert, alertType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_drop">Sales Drop</SelectItem>
                  <SelectItem value="sales_spike">Sales Spike</SelectItem>
                  <SelectItem value="inventory_low">Inventory Low</SelectItem>
                  <SelectItem value="custom_metric">Custom Metric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Metric</Label>
              <Select value={newAlert.metric} onValueChange={(value) => setNewAlert({...newAlert, metric: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_volume">Sales Volume</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="stock_level">Stock Level</SelectItem>
                  <SelectItem value="margin">Margin</SelectItem>
                  <SelectItem value="performance_score">Performance Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Condition</Label>
                <Select value={newAlert.condition} onValueChange={(value) => setNewAlert({...newAlert, condition: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Threshold</Label>
                <Input
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({...newAlert, threshold: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label>Timeframe</Label>
              <Select value={newAlert.timeframe} onValueChange={(value) => setNewAlert({...newAlert, timeframe: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAlertSubmit} className="flex-1">
                {editingAlert ? 'Update' : 'Create'} Alert
              </Button>
              <Button variant="outline" onClick={() => setShowAlertDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}