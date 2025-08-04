import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Scan,
  Plus,
  Camera,
  Package,
  CheckCircle,
  AlertCircle,
  Smartphone,
  List,
  Save,
  Eye,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";
import { BrowserMultiFormatReader } from '@zxing/library';
import type { StockTakeSession, StockTakeItem, User } from "@shared/schema";

interface MobileStockTakeProps {
  onBackToMenu: () => void;
  currentUser: User;
}

export function MobileStockTake({ onBackToMenu, currentUser }: MobileStockTakeProps) {
  const [activeSession, setActiveSession] = useState<StockTakeSession | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("General");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentView, setCurrentView] = useState<'scanner' | 'adder' | 'summary'>('scanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();
  // Query client is imported globally

  // Get current stock take session
  const { data: sessions = [] } = useQuery<StockTakeSession[]>({
    queryKey: ['/api/stock-take/sessions'],
  });

  // Get scanned items for current session with better error handling
  const { data: scannedItems = [], isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = useQuery<StockTakeItem[]>({
    queryKey: ['/api/stock-take/items', activeSession?.id],
    enabled: !!activeSession?.id,
    refetchInterval: 2000, // Refetch every 2 seconds to ensure fresh data
    refetchIntervalInBackground: true,
  });

  // Debug logging for items
  console.log('Active session:', activeSession?.id);
  console.log('Scanned items:', scannedItems);
  console.log('Items loading:', itemsLoading);
  console.log('Items error:', itemsError);

  // Start new stock take session
  const startSessionMutation = useMutation({
    mutationFn: async (sessionName: string) => {
      const response = await fetch('/api/stock-take/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionName,
          startedBy: currentUser.id,
          notes: "First-time stock take for shop setup"
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSession(data);
      queryClient.invalidateQueries({ queryKey: ['/api/stock-take/sessions'] });
      toast({
        title: "Stock Take Started",
        description: "Ready to scan products!"
      });
    }
  });

  // Add scanned item to session
  const addItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await fetch('/api/stock-take/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...itemData,
          sessionId: activeSession?.id,
          scannedBy: currentUser.id,
          totalValue: (itemData.quantity * itemData.unitPrice).toString(),
          deviceInfo: navigator.userAgent
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Item added successfully:', data);
      // Force refresh of items
      queryClient.invalidateQueries({ queryKey: ['/api/stock-take/items', activeSession?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-take/sessions'] });
      refetchItems(); // Force immediate refetch
      
      // Reset form
      setScannedBarcode("");
      setProductName("");
      setQuantity(1);
      setUnitPrice(0);
      setCurrentView('summary'); // Switch to summary to show the added item
      
      toast({
        title: "✅ Item Added Successfully!",
        description: `${data.productName} added to stock take`,
      });
    },
    onError: (error) => {
      console.error('Failed to add item:', error);
      toast({
        title: "❌ Failed to Add Item",
        description: "Please try again or check your connection",
        variant: "destructive"
      });
    }
  });

  // Convert stock take items to actual products
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stock-take/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: activeSession?.id })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Stock Take Complete",
        description: "All items have been added to your inventory!"
      });
    }
  });

  // Auto-start session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const today = new Date().toLocaleDateString();
      startSessionMutation.mutate(`Initial Stock Take - ${today}`);
    } else {
      const activeSessionData = sessions.find(s => s.status === 'active');
      if (activeSessionData) {
        setActiveSession(activeSessionData);
      }
    }
  }, [sessions]);

  // Initialize ZXing barcode reader
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Handle successful barcode detection
  const handleBarcodeDetected = useCallback((result: string) => {
    setScannedBarcode(result);
    stopCameraScanning();
    setCurrentView('adder');
    toast({
      title: "Barcode Scanned",
      description: `Detected: ${result}`,
    });
  }, []);

  // Enhanced camera barcode scanning with mobile support
  const startCameraScanning = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      setShowCamera(true);
      setIsScanning(true);

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });

        // Start ZXing scanning
        if (codeReaderRef.current) {
          await codeReaderRef.current.decodeFromVideoDevice(
            null, // Use default camera
            videoRef.current,
            (result, error) => {
              if (result) {
                handleBarcodeDetected(result.getText());
              }
              // Suppress common "not found" errors in console
              if (error && !(error.name === 'NotFoundException')) {
                console.error('Scanner error:', error);
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      
      let errorMessage = "Could not access camera. ";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage += "Camera not supported on this browser.";
        } else {
          errorMessage += "Use manual barcode entry instead.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setShowCamera(false);
      setIsScanning(false);
    }
  };

  const stopCameraScanning = () => {
    // Stop camera stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset ZXing scanner
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    setShowCamera(false);
    setIsScanning(false);
  };

  const handleManualBarcodeScan = () => {
    if (scannedBarcode.trim()) {
      setCurrentView('adder');
    }
  };

  // Enhanced barcode input handling for USB scanners like Honeywell
  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scannedBarcode.trim()) {
      e.preventDefault();
      setCurrentView('adder');
    }
  };

  const handleAddItem = () => {
    if (!scannedBarcode || !productName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter barcode and product name",
        variant: "destructive"
      });
      return;
    }

    addItemMutation.mutate({
      barcode: scannedBarcode,
      productName: productName.trim(),
      category,
      quantity,
      unitPrice: unitPrice.toString()
    });
  };

  const totalValue = scannedItems.reduce((sum, item) => sum + Number(item.totalValue || 0), 0);
  const totalItems = scannedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mobile Stock Take</h1>
            <p className="text-gray-600">First-time inventory setup for Kerrigan's XL</p>
          </div>
          <Button onClick={onBackToMenu} variant="outline">
            Back to Menu
          </Button>
        </div>

        {/* Session Info */}
        {activeSession && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{activeSession.sessionName}</h3>
                  <p className="text-sm text-gray-600">
                    Started: {new Date(activeSession.startedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{totalItems} items</p>
                  <p className="text-sm text-gray-600">€{totalValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={currentView === 'scanner' ? 'default' : 'outline'}
            onClick={() => setCurrentView('scanner')}
            className="flex-1"
          >
            <Scan className="w-4 h-4 mr-2" />
            Scanner
          </Button>
          <Button
            variant={currentView === 'adder' ? 'default' : 'outline'}
            onClick={() => setCurrentView('adder')}
            className="flex-1"
            disabled={!scannedBarcode}
          >
            <Plus className="w-4 h-4 mr-2" />
            Product Adder
          </Button>
          <Button
            variant={currentView === 'summary' ? 'default' : 'outline'}
            onClick={() => {
              setCurrentView('summary');
              refetchItems(); // Refresh items when viewing summary
            }}
            className="flex-1"
          >
            <List className="w-4 h-4 mr-2" />
            Summary ({scannedItems.length})
            {itemsLoading && <div className="ml-1 w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
          </Button>
        </div>

        {/* Scanner View */}
        {currentView === 'scanner' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Barcode Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Scanner */}
              <div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Mobile Camera Scanner</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    📱 Point your phone camera at a barcode to scan automatically
                  </p>
                </div>

                <Button
                  onClick={startCameraScanning}
                  disabled={showCamera}
                  className="w-full mb-4 h-12 text-lg font-semibold"
                  variant={showCamera ? "secondary" : "default"}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {showCamera ? "Camera Active" : "📱 Start Camera Scanner"}
                </Button>

                {showCamera && (
                  <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 md:h-80 object-cover"
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-green-400 w-64 h-20 rounded-lg opacity-75 animate-pulse">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Align barcode here
                        </div>
                      </div>
                    </div>
                    
                    {/* Camera controls */}
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button
                        onClick={stopCameraScanning}
                        variant="secondary"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        ✕ Stop
                      </Button>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                      🔍 Scanning...
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Barcode Entry */}
              <div className="border-t pt-4">
                <Label htmlFor="barcode">Manual Barcode Entry</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="barcode"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder="Scan or enter barcode (Honeywell scanner ready)..."
                    className="flex-1"
                    onKeyPress={handleBarcodeKeyPress}
                    autoFocus
                  />
                  <Button 
                    onClick={handleManualBarcodeScan}
                    disabled={!scannedBarcode.trim()}
                  >
                    Add Product
                  </Button>
                </div>
              </div>

              {scannedBarcode && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Scanned:</strong> {scannedBarcode}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ready to add product details →
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Adder View */}
        {currentView === 'adder' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product Adder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scannedBarcode && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Barcode:</strong> {scannedBarcode}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="General">General</option>
                    <option value="Food">Food</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Household">Household</option>
                    <option value="Health">Health</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="unitPrice">Unit Price (€)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Total Value:</strong> €{(quantity * unitPrice).toFixed(2)}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddItem}
                  disabled={!scannedBarcode || !productName.trim() || addItemMutation.isPending}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
                <Button
                  onClick={() => {
                    setCurrentView('scanner');
                    setScannedBarcode('');
                    setProductName('');
                  }}
                  variant="outline"
                >
                  Scan Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary View */}
        {currentView === 'summary' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{scannedItems.length}</div>
                  <div className="text-sm text-gray-600">Items Scanned</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{totalItems}</div>
                  <div className="text-sm text-gray-600">Total Quantity</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">€{totalValue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Scanned Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scannedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName || 'Unnamed Product'}</p>
                        <p className="text-sm text-gray-600">
                          {item.barcode} • {item.category} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{Number(item.totalValue || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">€{Number(item.unitPrice || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {scannedItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No items scanned yet</p>
                    <p className="text-sm">Start scanning to see items here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Finalize Stock Take */}
            {scannedItems.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    onClick={() => finalizeMutation.mutate()}
                    disabled={finalizeMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {finalizeMutation.isPending ? 'Finalizing...' : 'Complete Stock Take & Add to Inventory'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    This will convert all scanned items into your product inventory
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}