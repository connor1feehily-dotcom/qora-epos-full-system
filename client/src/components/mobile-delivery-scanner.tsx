import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Scan,
  Package,
  Truck,
  Eye
} from 'lucide-react';
import type { DeliveryDocket, DeliveryItem, Supplier } from '@shared/schema';

interface MobileDeliveryScannerProps {
  userId: number;
  onClose?: () => void;
}

interface ScannedItem {
  id: string;
  barcode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  isMatched: boolean;
  productId?: number;
}

export function MobileDeliveryScanner({ userId, onClose }: MobileDeliveryScannerProps) {
  const [docket, setDocket] = useState<Partial<DeliveryDocket>>({
    docketNumber: '',
    supplierName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    scanMethod: 'mobile',
    totalItems: 0,
    totalValue: 0,
    scannedByUserId: userId
  });
  
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<ScannedItem>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'manual' | 'camera'>('barcode');
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Submit delivery docket
  const submitDeliveryMutation = useMutation({
    mutationFn: async () => {
      const deliveryData = {
        ...docket,
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0)
      };
      
      const docketResponse = await apiRequest('POST', '/api/delivery/dockets', deliveryData);
      const createdDocket = await docketResponse.json();
      
      // Add all items to the docket
      const itemPromises = items.map(item => 
        apiRequest('POST', '/api/delivery/items', {
          docketId: createdDocket.id,
          barcode: item.barcode,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          isMatched: item.isMatched,
          productId: item.productId,
          needsApproval: true,
          approvalStatus: 'pending'
        })
      );
      
      await Promise.all(itemPromises);
      return createdDocket;
    },
    onSuccess: () => {
      toast({
        title: "Delivery Submitted",
        description: "Your delivery has been sent to the back office for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery'] });
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit delivery. Please try again.",
        variant: "destructive"
      });
    }
  });

  const addItem = () => {
    if (!currentItem.barcode || !currentItem.productName || !currentItem.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
      isMatched: false,
      productId: currentItem.productId
    };

    setItems(prev => [...prev, newItem]);
    setCurrentItem({});
    
    toast({
      title: "Item Added",
      description: `${newItem.productName} has been added to the delivery.`,
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        // Here you would process the image with OCR
        toast({
          title: "Image Captured",
          description: "Processing image... (OCR functionality would be implemented here)",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Delivery Scanner</h1>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Docket Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="docketNumber">Docket Number</Label>
              <Input
                id="docketNumber"
                value={docket.docketNumber}
                onChange={(e) => setDocket(prev => ({ ...prev, docketNumber: e.target.value }))}
                placeholder="Enter docket number"
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select 
                value={docket.supplierName} 
                onValueChange={(value) => setDocket(prev => ({ ...prev, supplierName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={docket.deliveryDate}
                onChange={(e) => setDocket(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scan Mode Selection */}
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
          <Button 
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual
          </Button>
        </div>

        {/* Item Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanMode === 'camera' && (
              <div className="text-center">
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <Button 
                  onClick={() => cameraRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            )}
            
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={currentItem.barcode || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Scan or enter barcode"
              />
            </div>
            
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={currentItem.productName || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={currentItem.quantity || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit Cost (£)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={currentItem.unitCost || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <Button onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        {item.barcode} • Qty: {item.quantity} • £{item.unitCost.toFixed(2)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded font-medium">
                Total: £{calculateTotal().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          onClick={() => submitDeliveryMutation.mutate()}
          disabled={items.length === 0 || submitDeliveryMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {submitDeliveryMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}