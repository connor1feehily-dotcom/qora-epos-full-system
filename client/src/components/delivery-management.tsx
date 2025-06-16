import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Scan, Plus, Package, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface DeliveryItem {
  barcode: string;
  name: string;
  quantity: number;
  unitCost?: number;
  matched: boolean;
  productId?: number;
}

interface DeliveryDocket {
  docketNumber: string;
  supplier: string;
  deliveryDate: string;
  items: DeliveryItem[];
  totalItems: number;
  status: 'pending' | 'processed' | 'partial';
}

export function DeliveryManagement() {
  const [scanMode, setScanMode] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [currentDocket, setCurrentDocket] = useState<DeliveryDocket | null>(null);
  const [manualItem, setManualItem] = useState({
    barcode: "",
    name: "",
    quantity: "",
    unitCost: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Simulate barcode scanning with keyboard input
  useEffect(() => {
    if (!scanMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && scannedBarcode.length > 0) {
        processScannedBarcode(scannedBarcode);
        setScannedBarcode("");
      } else if (e.key === 'Escape') {
        setScanMode(false);
        setScannedBarcode("");
      } else if (e.key.length === 1) {
        setScannedBarcode(prev => prev + e.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scanMode, scannedBarcode]);

  const processScannedBarcode = (barcode: string) => {
    console.log("Scanned barcode:", barcode);
    
    // Check if this is a delivery docket barcode (typically starts with specific prefix)
    if (barcode.startsWith('DEL') || barcode.startsWith('DOCK')) {
      processDocketBarcode(barcode);
    } else {
      // Process as product barcode
      processProductBarcode(barcode);
    }
  };

  const processDocketBarcode = (docketBarcode: string) => {
    // Create new delivery docket
    const newDocket: DeliveryDocket = {
      docketNumber: docketBarcode,
      supplier: "Scanned Supplier",
      deliveryDate: new Date().toISOString().split('T')[0],
      items: [],
      totalItems: 0,
      status: 'pending'
    };
    
    setCurrentDocket(newDocket);
    setScanMode(false);
    
    toast({
      title: "Delivery Docket Scanned",
      description: `Docket ${docketBarcode} ready for processing`,
    });
  };

  const processProductBarcode = (barcode: string) => {
    if (!currentDocket) {
      toast({
        title: "No Active Docket",
        description: "Please scan a delivery docket first",
        variant: "destructive",
      });
      return;
    }

    // Find matching product
    const matchedProduct = products.find(p => p.barcode === barcode);
    
    // Check if item already exists in current docket
    const existingItemIndex = currentDocket.items.findIndex(item => item.barcode === barcode);
    
    if (existingItemIndex >= 0) {
      // Increase quantity of existing item
      const updatedItems = [...currentDocket.items];
      updatedItems[existingItemIndex].quantity += 1;
      
      setCurrentDocket({
        ...currentDocket,
        items: updatedItems,
        totalItems: currentDocket.totalItems + 1
      });
    } else {
      // Add new item
      const newItem: DeliveryItem = {
        barcode: barcode,
        name: matchedProduct?.name || `Unknown Product (${barcode})`,
        quantity: 1,
        matched: !!matchedProduct,
        productId: matchedProduct?.id
      };
      
      setCurrentDocket({
        ...currentDocket,
        items: [...currentDocket.items, newItem],
        totalItems: currentDocket.totalItems + 1
      });
    }

    toast({
      title: "Item Added",
      description: `${matchedProduct?.name || barcode} added to delivery`,
    });
  };

  const addManualItem = () => {
    if (!currentDocket) {
      toast({
        title: "No Active Docket",
        description: "Please create or scan a delivery docket first",
        variant: "destructive",
      });
      return;
    }

    if (!manualItem.name || !manualItem.quantity) {
      toast({
        title: "Missing Information",
        description: "Please provide item name and quantity",
        variant: "destructive",
      });
      return;
    }

    const matchedProduct = products.find(p => p.barcode === manualItem.barcode);
    
    const newItem: DeliveryItem = {
      barcode: manualItem.barcode || `MANUAL-${Date.now()}`,
      name: manualItem.name,
      quantity: parseInt(manualItem.quantity),
      unitCost: manualItem.unitCost ? parseFloat(manualItem.unitCost) : undefined,
      matched: !!matchedProduct,
      productId: matchedProduct?.id
    };

    setCurrentDocket({
      ...currentDocket,
      items: [...currentDocket.items, newItem],
      totalItems: currentDocket.totalItems + parseInt(manualItem.quantity)
    });

    setManualItem({ barcode: "", name: "", quantity: "", unitCost: "" });
    
    toast({
      title: "Manual Item Added",
      description: `${newItem.name} added to delivery`,
    });
  };

  const processDelivery = async () => {
    if (!currentDocket || currentDocket.items.length === 0) {
      toast({
        title: "No Items to Process",
        description: "Add items to the delivery first",
        variant: "destructive",
      });
      return;
    }

    // Update inventory for matched products
    const updatePromises = currentDocket.items
      .filter(item => item.matched && item.productId)
      .map(async (item) => {
        try {
          const response = await fetch(`/api/products/${item.productId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stockQuantity: item.quantity // This should be added to existing stock
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update ${item.name}`);
          }
          
          return { success: true, item: item.name };
        } catch (error) {
          return { success: false, item: item.name, error };
        }
      });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    setCurrentDocket({
      ...currentDocket,
      status: failed > 0 ? 'partial' : 'processed'
    });

    queryClient.invalidateQueries({ queryKey: ['/api/products'] });

    toast({
      title: "Delivery Processed",
      description: `${successful} items updated successfully${failed > 0 ? `, ${failed} failed` : ''}`,
    });
  };

  const startNewDocket = () => {
    const newDocket: DeliveryDocket = {
      docketNumber: `MAN-${Date.now()}`,
      supplier: "Manual Entry",
      deliveryDate: new Date().toISOString().split('T')[0],
      items: [],
      totalItems: 0,
      status: 'pending'
    };
    
    setCurrentDocket(newDocket);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="h-6 w-6 text-cyan-600" />
          <h2 className="text-2xl font-bold">Delivery Management</h2>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setScanMode(!scanMode)}
            variant={scanMode ? "destructive" : "default"}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Scan className="h-4 w-4 mr-2" />
            {scanMode ? "Stop Scanning" : "Scan Docket"}
          </Button>
          
          <Button
            onClick={startNewDocket}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Docket
          </Button>
        </div>
      </div>

      {scanMode && (
        <Card className="border-cyan-500 bg-cyan-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Scan className="h-12 w-12 mx-auto text-cyan-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Scanning Mode Active</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan a delivery docket barcode or product barcode
              </p>
              <div className="text-lg font-mono bg-white p-2 rounded border">
                {scannedBarcode || "Ready to scan..."}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press ESC to cancel scanning
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentDocket && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Delivery Docket: {currentDocket.docketNumber}</span>
              </CardTitle>
              <Badge variant={
                currentDocket.status === 'processed' ? 'default' :
                currentDocket.status === 'partial' ? 'secondary' : 'outline'
              }>
                {currentDocket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="font-medium">Supplier:</label>
                <p>{currentDocket.supplier}</p>
              </div>
              <div>
                <label className="font-medium">Date:</label>
                <p>{currentDocket.deliveryDate}</p>
              </div>
              <div>
                <label className="font-medium">Total Items:</label>
                <p>{currentDocket.totalItems}</p>
              </div>
            </div>

            {/* Manual Add Section */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Add Manual Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Input
                    placeholder="Barcode (optional)"
                    value={manualItem.barcode}
                    onChange={(e) => setManualItem({ ...manualItem, barcode: e.target.value })}
                  />
                  <Input
                    placeholder="Item name *"
                    value={manualItem.name}
                    onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                  />
                  <Input
                    placeholder="Quantity *"
                    type="number"
                    value={manualItem.quantity}
                    onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })}
                  />
                  <Input
                    placeholder="Unit cost (€)"
                    type="number"
                    step="0.01"
                    value={manualItem.unitCost}
                    onChange={(e) => setManualItem({ ...manualItem, unitCost: e.target.value })}
                  />
                  <Button onClick={addManualItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            {currentDocket.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Delivery Items:</h4>
                {currentDocket.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {item.matched ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Barcode: {item.barcode} • Quantity: {item.quantity}
                        {item.unitCost && ` • €${item.unitCost.toFixed(2)} each`}
                      </div>
                    </div>
                    <Badge variant={item.matched ? "default" : "secondary"}>
                      {item.matched ? "Matched" : "New Item"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentDocket(null)}
              >
                Clear Docket
              </Button>
              <Button
                onClick={processDelivery}
                disabled={currentDocket.items.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Process Delivery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentDocket && (
        <Card className="text-center py-12">
          <CardContent>
            <Truck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Delivery</h3>
            <p className="text-gray-600 mb-4">
              Scan a delivery docket barcode or create a manual docket to begin
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}