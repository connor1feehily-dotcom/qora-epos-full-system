import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Camera, 
  Scan, 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  Edit3,
  Eye,
  X
} from 'lucide-react';
import type { DeliveryDocket, DeliveryItem, Product, Supplier } from '@shared/schema';

interface EnhancedMobileScannerProps {
  userId: number;
  userName: string;
  onClose?: () => void;
}

interface ScannedItem {
  id: string;
  barcode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  suggestedPrice: number;
  marginPercentage: number;
  isMatched: boolean;
  productId?: number;
  priceOverride?: number;
  stockCorrection?: number;
  flags: string[];
}

interface OfflineOperation {
  id: string;
  type: 'scan' | 'price_update' | 'stock_correction';
  data: any;
  timestamp: Date;
}

export function EnhancedMobileScanner({ userId, userName, onClose }: EnhancedMobileScannerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentItem, setCurrentItem] = useState<Partial<ScannedItem>>({});
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineOperation[]>([]);
  const [scanMode, setScanMode] = useState<'barcode' | 'camera'>('barcode');
  const [isScanning, setIsScanning] = useState(false);
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
  const [pendingOrders, setPendingOrders] = useState<DeliveryDocket[]>([]);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get suppliers and products
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    enabled: isOnline,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: isOnline,
  });

  // Get pending orders for Valerie
  const { data: pendingOrdersData = [] } = useQuery<DeliveryDocket[]>({
    queryKey: ['/api/delivery/pending-orders', userId],
    enabled: isOnline,
  });

  // Sync offline operations when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineOperations();
    }
  }, [isOnline, offlineQueue.length]);

  const syncOfflineOperations = async () => {
    try {
      for (const operation of offlineQueue) {
        await apiRequest('POST', '/api/delivery/sync-offline', {
          userId,
          operation
        });
      }
      setOfflineQueue([]);
      toast({
        title: "Synced Successfully",
        description: `${offlineQueue.length} offline operations synced.`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some operations failed to sync. They'll retry automatically.",
        variant: "destructive"
      });
    }
  };

  // Enhanced barcode scanning with auto-lookup
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setIsScanning(true);
    
    try {
      // Look up product from existing inventory
      const existingProduct = products.find(p => p.barcode === barcode);
      
      if (existingProduct) {
        // Auto-fill with existing product data
        const suggestedPrice = calculateSuggestedPrice(existingProduct.cost ? parseFloat(existingProduct.cost) : 0);
        const margin = calculateMargin(existingProduct.cost ? parseFloat(existingProduct.cost) : 0, suggestedPrice);
        
        setCurrentItem({
          barcode,
          productName: existingProduct.name,
          quantity: 1,
          unitCost: existingProduct.cost ? parseFloat(existingProduct.cost) : 0,
          suggestedPrice,
          marginPercentage: margin,
          isMatched: true,
          productId: existingProduct.id,
          flags: existingProduct.stock <= existingProduct.minStock ? ['LOW_STOCK'] : []
        });
        
        // Show margin color coding
        const marginColor = getMarginColor(margin);
        toast({
          title: "Product Found",
          description: `${existingProduct.name} - Margin: ${margin.toFixed(1)}%`,
          variant: marginColor === 'red' ? 'destructive' : 'default'
        });
      } else {
        // New product - manual entry required
        setCurrentItem({
          barcode,
          productName: '',
          quantity: 1,
          unitCost: 0,
          suggestedPrice: 0,
          marginPercentage: 0,
          isMatched: false,
          flags: ['NEW_PRODUCT']
        });
        
        toast({
          title: "New Product",
          description: "Please enter product details manually.",
        });
      }
    } catch (error) {
      if (!isOnline) {
        // Queue for offline processing
        const offlineOp: OfflineOperation = {
          id: Date.now().toString(),
          type: 'scan',
          data: { barcode },
          timestamp: new Date()
        };
        setOfflineQueue(prev => [...prev, offlineOp]);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const calculateSuggestedPrice = (cost: number, targetMargin: number = 30): number => {
    return cost / (1 - targetMargin / 100);
  };

  const calculateMargin = (cost: number, price: number): number => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const getMarginColor = (margin: number): 'green' | 'yellow' | 'red' => {
    if (margin >= 30) return 'green';
    if (margin >= 20) return 'yellow';
    return 'red';
  };

  const addItemToScan = () => {
    if (!currentItem.barcode || !currentItem.productName || !currentItem.quantity) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newItem: ScannedItem = {
      id: Date.now().toString(),
      barcode: currentItem.barcode || '',
      productName: currentItem.productName || '',
      quantity: currentItem.quantity || 1,
      unitCost: currentItem.unitCost || 0,
      suggestedPrice: currentItem.suggestedPrice || 0,
      marginPercentage: currentItem.marginPercentage || 0,
      isMatched: currentItem.isMatched || false,
      productId: currentItem.productId,
      flags: currentItem.flags || []
    };

    setScannedItems(prev => [...prev, newItem]);
    setCurrentItem({});
    
    // Focus back to barcode input for continuous scanning
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const updateItemPricing = (itemId: string, newPrice: number) => {
    setScannedItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const margin = calculateMargin(item.unitCost, newPrice);
          return {
            ...item,
            priceOverride: newPrice,
            marginPercentage: margin,
            flags: [...item.flags.filter(f => f !== 'PRICE_OVERRIDE'), 'PRICE_OVERRIDE']
          };
        }
        return item;
      })
    );
  };

  const adjustStock = (itemId: string, stockCorrection: number) => {
    setScannedItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            stockCorrection,
            flags: [...item.flags.filter(f => f !== 'STOCK_CORRECTION'), 'STOCK_CORRECTION']
          };
        }
        return item;
      })
    );
  };

  const submitForApproval = async () => {
    if (scannedItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please scan some items first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const docketData = {
        docketNumber: `VAL-${Date.now()}`,
        supplierName: "Scanned by Valerie",
        deliveryDate: new Date().toISOString(),
        totalItems: scannedItems.length,
        totalValue: scannedItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0),
        scannedByUserId: userId,
        status: 'pending',
        scanMethod: 'mobile'
      };

      if (isOnline) {
        await apiRequest('POST', '/api/delivery/submit-for-approval', {
          docket: docketData,
          items: scannedItems
        });
        
        toast({
          title: "Submitted for Approval",
          description: "Your scanned items have been sent to the back office.",
        });
      } else {
        // Queue for offline sync
        const offlineOp: OfflineOperation = {
          id: Date.now().toString(),
          type: 'scan',
          data: { docket: docketData, items: scannedItems },
          timestamp: new Date()
        };
        setOfflineQueue(prev => [...prev, offlineOp]);
        
        toast({
          title: "Queued for Sync",
          description: "Items will be submitted when connection is restored.",
        });
      }
      
      setScannedItems([]);
      queryClient.invalidateQueries({ queryKey: ['/api/delivery'] });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with online status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">Hi Valerie! 👋</h1>
              <p className="text-sm text-gray-600">Scan delivered items</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{scannedItems.length}</div>
              <div className="text-xs text-gray-600">Scanned</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {scannedItems.filter(item => item.isMatched).length}
              </div>
              <div className="text-xs text-gray-600">Matched</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {offlineQueue.length}
              </div>
              <div className="text-xs text-gray-600">Queued</div>
            </div>
          </Card>
        </div>

        {/* Scan Mode Toggle */}
        <div className="flex space-x-2">
          <Button 
            variant={scanMode === 'barcode' ? 'default' : 'outline'}
            onClick={() => setScanMode('barcode')}
            className="flex-1"
          >
            <Scan className="h-4 w-4 mr-2" />
            Barcode
          </Button>
          <Button 
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setScanMode('camera')}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        </div>

        {/* Scanning Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scan Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanMode === 'barcode' ? (
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  ref={barcodeInputRef}
                  id="barcode"
                  value={currentItem.barcode || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, barcode: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScan(currentItem.barcode || '');
                    }
                  }}
                  placeholder="Scan or type barcode"
                  className="text-lg"
                />
                <Button 
                  onClick={() => handleBarcodeScan(currentItem.barcode || '')}
                  className="w-full mt-2"
                  disabled={isScanning}
                >
                  {isScanning ? 'Looking up...' : 'Lookup Product'}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast({
                        title: "Image Captured",
                        description: "Processing barcode...",
                      });
                      // OCR processing would go here
                    }
                  }}
                  className="hidden"
                />
                <Button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full"
                  size="lg"
                >
                  <Camera className="h-6 w-6 mr-2" />
                  Take Photo
                </Button>
              </div>
            )}

            {/* Product Details */}
            {currentItem.barcode && (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={currentItem.productName || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={currentItem.quantity || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitCost">Unit Cost (£)</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      value={currentItem.unitCost || ''}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value);
                        const suggested = calculateSuggestedPrice(cost);
                        const margin = calculateMargin(cost, suggested);
                        setCurrentItem(prev => ({ 
                          ...prev, 
                          unitCost: cost,
                          suggestedPrice: suggested,
                          marginPercentage: margin
                        }));
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {currentItem.suggestedPrice && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Suggested Price:</span>
                      <span className="font-bold">£{currentItem.suggestedPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm">Margin:</span>
                      <Badge className={
                        getMarginColor(currentItem.marginPercentage || 0) === 'green' ? 'bg-green-100 text-green-800' :
                        getMarginColor(currentItem.marginPercentage || 0) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {currentItem.marginPercentage?.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                )}

                <Button onClick={addItemToScan} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanned Items */}
        {scannedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Order Review ({scannedItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {scannedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} • Cost: £{item.unitCost.toFixed(2)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.flags.map(flag => (
                          <Badge key={flag} variant="outline" className="text-xs">
                            {flag.replace('_', ' ')}
                          </Badge>
                        ))}
                        <Badge className={
                          getMarginColor(item.marginPercentage) === 'green' ? 'bg-green-100 text-green-800' :
                          getMarginColor(item.marginPercentage) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {item.marginPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="font-medium">
                  Total Value: £{scannedItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          onClick={submitForApproval}
          disabled={scannedItems.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>

        {/* Offline Queue Status */}
        {offlineQueue.length > 0 && (
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {offlineQueue.length} operations queued for sync
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Item Edit Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item - {editingItem.productName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Price Override</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={editingItem.suggestedPrice.toFixed(2)}
                  onChange={(e) => updateItemPricing(editingItem.id, parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Stock Correction</Label>
                <Input
                  type="number"
                  placeholder="Enter adjustment (+/-)"
                  onChange={(e) => adjustStock(editingItem.id, parseInt(e.target.value))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}