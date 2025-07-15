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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Package, 
  Edit3, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Filter,
  Download,
  Upload,
  Zap,
  Target,
  Scan,
  RefreshCw,
  Eye,
  DollarSign,
  Users,
  ShoppingCart,
  Trash2,
  Search,
  Calendar as CalendarIconSolid
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  vatRate: number;
}

interface BatchEditOperation {
  id: number;
  operationType: string;
  targetTable: string;
  filters: any;
  updateData: any;
  status: string;
  recordsAffected: number;
  createdBy: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface ExpiryTracking {
  id: number;
  productId: number;
  batchNumber?: string;
  expiryDate: string;
  quantityRemaining: number;
  alertThreshold: number;
  status: string;
  markdownPrice?: number;
  createdAt: string;
  updatedAt: string;
}

interface StockForecasting {
  id: number;
  productId: number;
  currentStock: number;
  averageDailySales: number;
  daysOfStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  lastOrderDate?: string;
  leadTimeDays: number;
  confidenceScore: number;
  forecastDate: string;
  createdAt: string;
}

export default function AdvancedInventoryTweaks() {
  const [selectedTab, setSelectedTab] = useState('batch-edit');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [batchOperation, setBatchOperation] = useState({
    operationType: '',
    filters: {},
    updateData: {}
  });
  const [expiryFilters, setExpiryFilters] = useState({
    daysAhead: 7,
    status: 'all'
  });
  const [forecastFilters, setForecastFilters] = useState({
    lowStock: false,
    reorderSuggested: false
  });
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState<ExpiryTracking | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date>(new Date());

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: 30000
  });

  // Fetch batch operations
  const { data: batchOperations = [] } = useQuery<BatchEditOperation[]>({
    queryKey: ['/api/batch-operations'],
    refetchInterval: 10000
  });

  // Fetch expiry tracking
  const { data: expiryItems = [] } = useQuery<ExpiryTracking[]>({
    queryKey: ['/api/expiry-tracking'],
    refetchInterval: 60000
  });

  // Fetch expiring products
  const { data: expiringProducts = [] } = useQuery<ExpiryTracking[]>({
    queryKey: ['/api/expiry-tracking/expiring', expiryFilters.daysAhead],
    refetchInterval: 60000
  });

  // Fetch stock forecasting
  const { data: stockForecasts = [] } = useQuery<StockForecasting[]>({
    queryKey: ['/api/stock-forecasting'],
    refetchInterval: 300000 // 5 minutes
  });

  // Fetch reorder suggestions
  const { data: reorderSuggestions = [] } = useQuery<StockForecasting[]>({
    queryKey: ['/api/stock-forecasting/reorder-suggestions'],
    refetchInterval: 300000
  });

  // Batch edit mutation
  const createBatchOperation = useMutation({
    mutationFn: async (operation: any) => {
      const response = await fetch('/api/batch-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batch-operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Batch operation created successfully' });
      setShowBatchDialog(false);
    }
  });

  // Expiry tracking mutations
  const createExpiryTracking = useMutation({
    mutationFn: async (tracking: any) => {
      const response = await fetch('/api/expiry-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tracking)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expiry-tracking'] });
      toast({ title: 'Expiry tracking added successfully' });
      setShowExpiryDialog(false);
    }
  });

  const updateExpiryTracking = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/expiry-tracking/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expiry-tracking'] });
      toast({ title: 'Expiry tracking updated successfully' });
    }
  });

  // Stock forecasting mutations
  const generateStockForecast = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/stock-forecasting/generate/${productId}`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-forecasting'] });
      toast({ title: 'Stock forecast generated successfully' });
    }
  });

  const bulkGenerateForecasts = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stock-forecasting/generate-all', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-forecasting'] });
      toast({ title: 'Bulk forecasts generated successfully' });
    }
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'marked_down': return 'bg-yellow-100 text-yellow-800';
      case 'disposed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleBatchEdit = () => {
    if (selectedProducts.length === 0) {
      toast({ title: 'Please select products to edit', variant: 'destructive' });
      return;
    }

    const operation = {
      operationType: batchOperation.operationType,
      targetTable: 'products',
      filters: { id: selectedProducts },
      updateData: batchOperation.updateData
    };

    createBatchOperation.mutate(operation);
  };

  const handleExpirySubmit = () => {
    if (!editingExpiry) return;

    const updates = {
      expiryDate: format(newExpiryDate, 'yyyy-MM-dd'),
      quantityRemaining: editingExpiry.quantityRemaining,
      alertThreshold: editingExpiry.alertThreshold,
      status: editingExpiry.status,
      markdownPrice: editingExpiry.markdownPrice
    };

    updateExpiryTracking.mutate({ id: editingExpiry.id, updates });
    setEditingExpiry(null);
    setShowExpiryDialog(false);
  };

  const filteredForecasts = stockForecasts.filter(forecast => {
    if (forecastFilters.lowStock && forecast.daysOfStock > 7) return false;
    if (forecastFilters.reorderSuggested && forecast.currentStock > forecast.reorderPoint) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Inventory Tweaks</h1>
        <p className="text-gray-600">Batch editing, expiry tracking, and stock forecasting tools</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batch-edit">
            <Edit3 className="w-4 h-4 mr-2" />
            Batch Editing
          </TabsTrigger>
          <TabsTrigger value="expiry-tracking">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Expiry Tracking
          </TabsTrigger>
          <TabsTrigger value="stock-forecasting">
            <TrendingUp className="w-4 h-4 mr-2" />
            Stock Forecasting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch-edit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Select Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search products..."
                    className="mb-2"
                  />
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProducts(products.map(p => p.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProducts([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category} • €{product.price}</div>
                      </div>
                      <Badge variant="outline">Stock: {product.stock}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm font-medium">Selected: {selectedProducts.length} products</div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Batch Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="operation-type">Operation Type</Label>
                    <Select 
                      value={batchOperation.operationType} 
                      onValueChange={(value) => setBatchOperation({...batchOperation, operationType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_update">Price Update</SelectItem>
                        <SelectItem value="category_change">Category Change</SelectItem>
                        <SelectItem value="stock_adjustment">Stock Adjustment</SelectItem>
                        <SelectItem value="vat_update">VAT Rate Update</SelectItem>
                        <SelectItem value="min_stock_update">Min Stock Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {batchOperation.operationType === 'price_update' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price-adjustment">Price Adjustment</Label>
                        <Select onValueChange={(value) => setBatchOperation({
                          ...batchOperation, 
                          updateData: {...batchOperation.updateData, adjustmentType: value}
                        })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="set">Set Price</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="price-value">Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter value..."
                          onChange={(e) => setBatchOperation({
                            ...batchOperation,
                            updateData: {...batchOperation.updateData, value: parseFloat(e.target.value)}
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {batchOperation.operationType === 'category_change' && (
                    <div>
                      <Label htmlFor="new-category">New Category</Label>
                      <Input
                        placeholder="Enter new category..."
                        onChange={(e) => setBatchOperation({
                          ...batchOperation,
                          updateData: {category: e.target.value}
                        })}
                      />
                    </div>
                  )}

                  {batchOperation.operationType === 'stock_adjustment' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adjustment-type">Adjustment Type</Label>
                        <Select onValueChange={(value) => setBatchOperation({
                          ...batchOperation,
                          updateData: {...batchOperation.updateData, adjustmentType: value}
                        })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">Increase</SelectItem>
                            <SelectItem value="decrease">Decrease</SelectItem>
                            <SelectItem value="set">Set Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="stock-value">Quantity</Label>
                        <Input
                          type="number"
                          placeholder="Enter quantity..."
                          onChange={(e) => setBatchOperation({
                            ...batchOperation,
                            updateData: {...batchOperation.updateData, quantity: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleBatchEdit}
                    disabled={selectedProducts.length === 0 || !batchOperation.operationType}
                    className="w-full"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Batch Operation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Batch Operations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Batch Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchOperations.map(operation => (
                    <div key={operation.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{operation.operationType.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">
                          {operation.recordsAffected} records • {format(new Date(operation.createdAt), 'PPp')}
                        </div>
                      </div>
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expiry-tracking">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expiry Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Expiry Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringProducts.map(item => {
                    const daysLeft = getDaysUntilExpiry(item.expiryDate);
                    const product = products.find(p => p.id === item.productId);
                    
                    return (
                      <div key={item.id} className="p-3 border rounded">
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-gray-500">
                          Expires in {daysLeft} days • Qty: {item.quantityRemaining}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingExpiry(item);
                              setNewExpiryDate(new Date(item.expiryDate));
                              setShowExpiryDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateExpiryTracking.mutate({
                              id: item.id,
                              updates: { status: 'marked_down' }
                            })}
                          >
                            Mark Down
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Expiry Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Expiry Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {expiringProducts.filter(item => getDaysUntilExpiry(item.expiryDate) <= 3).length}
                      </div>
                      <div className="text-sm text-red-600">Expiring Soon</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {expiringProducts.filter(item => getDaysUntilExpiry(item.expiryDate) <= 7).length}
                      </div>
                      <div className="text-sm text-yellow-600">This Week</div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {expiryItems.filter(item => item.status === 'marked_down').length}
                    </div>
                    <div className="text-sm text-green-600">Marked Down</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiry Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowExpiryDialog(true)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Add Expiry Tracking
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Expiry Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Scan className="w-4 h-4 mr-2" />
                    Scan Batch Numbers
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Expiry Items */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  All Expiry Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Batch</th>
                        <th className="text-left p-2">Expiry Date</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiryItems.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const daysLeft = getDaysUntilExpiry(item.expiryDate);
                        
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="p-2">{product?.name}</td>
                            <td className="p-2">{item.batchNumber || 'N/A'}</td>
                            <td className="p-2">
                              {format(new Date(item.expiryDate), 'PPP')}
                              <div className="text-xs text-gray-500">
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                              </div>
                            </td>
                            <td className="p-2">{item.quantityRemaining}</td>
                            <td className="p-2">
                              <Badge className={getExpiryStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingExpiry(item);
                                  setNewExpiryDate(new Date(item.expiryDate));
                                  setShowExpiryDialog(true);
                                }}
                              >
                                Edit
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

        <TabsContent value="stock-forecasting">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Forecast Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Forecast Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={forecastFilters.lowStock}
                      onCheckedChange={(checked) => setForecastFilters({
                        ...forecastFilters,
                        lowStock: checked
                      })}
                    />
                    <Label>Low Stock Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={forecastFilters.reorderSuggested}
                      onCheckedChange={(checked) => setForecastFilters({
                        ...forecastFilters,
                        reorderSuggested: checked
                      })}
                    />
                    <Label>Reorder Suggested</Label>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => bulkGenerateForecasts.mutate()}
                    disabled={bulkGenerateForecasts.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate All Forecasts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reorder Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Reorder Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reorderSuggestions.map(forecast => {
                    const product = products.find(p => p.id === forecast.productId);
                    
                    return (
                      <div key={forecast.id} className="p-3 border rounded">
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-gray-500">
                          Current: {forecast.currentStock} • Reorder: {forecast.reorderPoint}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Suggested: {forecast.suggestedOrderQuantity} units
                        </div>
                        <div className="mt-2">
                          <Button size="sm" variant="outline">
                            Create PO
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Forecast Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Forecast Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {stockForecasts.filter(f => f.confidenceScore >= 0.8).length}
                    </div>
                    <div className="text-sm text-blue-600">High Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stockForecasts.filter(f => f.daysOfStock <= 7).length}
                    </div>
                    <div className="text-sm text-yellow-600">Low Stock</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(stockForecasts.reduce((sum, f) => sum + f.confidenceScore, 0) / stockForecasts.length * 100)}%
                    </div>
                    <div className="text-sm text-green-600">Avg Confidence</div>
                  </div>
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
                    Export Forecasts
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Sales Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Forecast Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stock Forecasts Table */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Stock Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Current Stock</th>
                        <th className="text-left p-2">Daily Sales</th>
                        <th className="text-left p-2">Days of Stock</th>
                        <th className="text-left p-2">Reorder Point</th>
                        <th className="text-left p-2">Suggested Order</th>
                        <th className="text-left p-2">Confidence</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForecasts.map(forecast => {
                        const product = products.find(p => p.id === forecast.productId);
                        
                        return (
                          <tr key={forecast.id} className="border-b">
                            <td className="p-2">{product?.name}</td>
                            <td className="p-2">{forecast.currentStock}</td>
                            <td className="p-2">{forecast.averageDailySales?.toFixed(1) || 'N/A'}</td>
                            <td className="p-2">
                              <span className={forecast.daysOfStock <= 7 ? 'text-red-600 font-medium' : ''}>
                                {forecast.daysOfStock}
                              </span>
                            </td>
                            <td className="p-2">{forecast.reorderPoint}</td>
                            <td className="p-2">{forecast.suggestedOrderQuantity}</td>
                            <td className="p-2">
                              <span className={getConfidenceColor(forecast.confidenceScore)}>
                                {Math.round(forecast.confidenceScore * 100)}%
                              </span>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateStockForecast.mutate(forecast.productId)}
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

      {/* Expiry Dialog */}
      <Dialog open={showExpiryDialog} onOpenChange={setShowExpiryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpiry ? 'Edit Expiry Tracking' : 'Add Expiry Tracking'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIconSolid className="w-4 h-4 mr-2" />
                    {format(newExpiryDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newExpiryDate}
                    onSelect={(date) => date && setNewExpiryDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                value={editingExpiry?.quantityRemaining || ''}
                onChange={(e) => editingExpiry && setEditingExpiry({
                  ...editingExpiry,
                  quantityRemaining: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label htmlFor="batch-number">Batch Number (Optional)</Label>
              <Input
                value={editingExpiry?.batchNumber || ''}
                onChange={(e) => editingExpiry && setEditingExpiry({
                  ...editingExpiry,
                  batchNumber: e.target.value
                })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExpirySubmit} className="flex-1">
                {editingExpiry ? 'Update' : 'Add'} Tracking
              </Button>
              <Button variant="outline" onClick={() => setShowExpiryDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}