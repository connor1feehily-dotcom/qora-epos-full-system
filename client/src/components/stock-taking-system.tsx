import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Scan, 
  Package, 
  Download, 
  Upload, 
  Camera, 
  Plus, 
  Minus,
  Save,
  PrinterIcon,
  CreditCard,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Search,
  FileText,
  BarChart3,
  RefreshCw,
  Trash2
} from "lucide-react";

interface StockTakingProps {
  onBackToMenu?: () => void;
  currentUser?: any;
}

interface StockItem {
  id: number;
  name: string;
  barcode: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  lastUpdated: string;
  category: string;
  unitPrice: number;
  location: string;
  status: 'pending' | 'counted' | 'verified' | 'discrepancy';
}

interface StockSession {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  userId: number;
}

export function StockTakingSystem({ onBackToMenu, currentUser }: StockTakingProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentSession, setCurrentSession] = useState<StockSession | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [countedQuantity, setCountedQuantity] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hardware integration states
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [scannerStatus, setScannerStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [terminalStatus, setTerminalStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  // Fetch stock taking data
  const { data: stockSessions = [] } = useQuery({
    queryKey: ["stock-sessions"],
    queryFn: () => fetch("/api/stock-taking/sessions").then(res => res.json())
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ["stock-items", currentSession?.id],
    queryFn: () => currentSession ? 
      fetch(`/api/stock-taking/sessions/${currentSession.id}/items`).then(res => res.json()) : 
      Promise.resolve([])
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  // Hardware detection and initialization
  useEffect(() => {
    initializeHardware();
    setupBarcodeScanner();
    return () => {
      cleanup();
    };
  }, []);

  const initializeHardware = async () => {
    try {
      // Initialize Epson printer connection
      await initializePrinter();
      
      // Initialize barcode scanner
      await initializeScanner();
      
      // Initialize payment terminal
      await initializePaymentTerminal();
      
    } catch (error) {
      console.error('Hardware initialization failed:', error);
    }
  };

  const initializePrinter = async () => {
    try {
      // Check for Epson printer via WebUSB or network
      if ('usb' in navigator && (navigator as any).usb) {
        const devices = await (navigator as any).usb.getDevices();
        const epsonPrinter = devices.find((device: any) => 
          device.vendorId === 0x04b8 // Epson vendor ID
        );
        
        if (epsonPrinter) {
          setPrinterStatus('connected');
          toast({
            title: "Printer Connected",
            description: "Epson receipt printer is ready"
          });
        }
      }
      
      // Fallback to network printer detection
      const response = await fetch('/api/hardware/printer/status');
      if (response.ok) {
        setPrinterStatus('connected');
      }
    } catch (error) {
      setPrinterStatus('error');
      console.error('Printer initialization failed:', error);
    }
  };

  const initializeScanner = async () => {
    try {
      // Check for HID barcode scanner
      if ('hid' in navigator && (navigator as any).hid) {
        const devices = await (navigator as any).hid.getDevices();
        const scanner = devices.find((device: any) => 
          device.usage === 0x06 && device.usagePage === 0x01 // Keyboard usage for scanner
        );
        
        if (scanner) {
          setScannerStatus('connected');
          await scanner.open();
          
          scanner.addEventListener('inputreport', (event: any) => {
            const data = new Uint8Array(event.data.buffer);
            handleScannerInput(data);
          });
          
          toast({
            title: "Scanner Connected",
            description: "Barcode scanner is ready"
          });
        }
      }
    } catch (error) {
      setScannerStatus('error');
      console.error('Scanner initialization failed:', error);
    }
  };

  const initializePaymentTerminal = async () => {
    try {
      // Check for payment terminal via serial or network
      const response = await fetch('/api/hardware/terminal/status');
      if (response.ok) {
        setTerminalStatus('connected');
        toast({
          title: "Payment Terminal Connected",
          description: "Card payment terminal is ready"
        });
      }
    } catch (error) {
      setTerminalStatus('error');
      console.error('Payment terminal initialization failed:', error);
    }
  };

  const setupBarcodeScanner = () => {
    // Listen for keyboard input from barcode scanner
    let barcodeBuffer = '';
    let lastInputTime = Date.now();

    const handleKeydown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If too much time has passed, reset buffer
      if (currentTime - lastInputTime > 100) {
        barcodeBuffer = '';
      }
      
      lastInputTime = currentTime;
      
      if (event.key === 'Enter') {
        if (barcodeBuffer.length > 0) {
          handleBarcodeScanned(barcodeBuffer);
          barcodeBuffer = '';
        }
      } else if (event.key.length === 1) {
        barcodeBuffer += event.key;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  };

  const handleScannerInput = (data: Uint8Array) => {
    // Process HID scanner input
    const barcode = new TextDecoder().decode(data).trim();
    if (barcode) {
      handleBarcodeScanned(barcode);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setScannedBarcode(barcode);
    setManualBarcode(barcode);
    
    // Find product by barcode
    const product = products.find((p: any) => p.barcode === barcode);
    if (product) {
      toast({
        title: "Product Found",
        description: `${product.name} (${barcode})`
      });
      
      // Auto-focus quantity input
      const quantityInput = document.getElementById('quantity-input') as HTMLInputElement;
      if (quantityInput) {
        quantityInput.focus();
        quantityInput.select();
      }
    } else {
      toast({
        title: "Product Not Found",
        description: `Barcode ${barcode} not in system`,
        variant: "destructive"
      });
    }
  };

  const startCameraScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera for scanning",
        variant: "destructive"
      });
    }
  };

  const stopCameraScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setIsScanning(false);
  };

  const cleanup = () => {
    stopCameraScanning();
  };

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: (sessionData: any) => 
      fetch('/api/stock-taking/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      }).then(res => res.json()),
    onSuccess: (newSession) => {
      setCurrentSession(newSession);
      queryClient.invalidateQueries({ queryKey: ["stock-sessions"] });
      toast({
        title: "Stock Taking Session Started",
        description: `Session "${newSession.name}" is now active`
      });
    }
  });

  const updateItemCountMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number, quantity: number }) =>
      fetch(`/api/stock-taking/items/${itemId}/count`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countedQuantity: quantity })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      setCountedQuantity(0);
      setScannedBarcode("");
      setManualBarcode("");
      toast({
        title: "Count Updated",
        description: "Item count has been saved"
      });
    }
  });

  const printStockReportMutation = useMutation({
    mutationFn: (sessionId: string) =>
      fetch(`/api/stock-taking/sessions/${sessionId}/print-report`, {
        method: 'POST'
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Report Printed",
        description: "Stock taking report sent to printer"
      });
    }
  });

  const filteredItems = stockItems.filter((item: StockItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode.includes(searchTerm);
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const sessionStats = currentSession ? {
    progress: currentSession.totalItems > 0 ? 
      Math.round((currentSession.countedItems / currentSession.totalItems) * 100) : 0,
    accuracy: currentSession.countedItems > 0 ? 
      Math.round(((currentSession.countedItems - currentSession.discrepancies) / currentSession.countedItems) * 100) : 100
  } : { progress: 0, accuracy: 100 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock Taking System</h1>
            <p className="text-gray-600">
              Professional inventory management with mobile scanning and hardware integration
            </p>
          </div>
          {onBackToMenu && (
            <Button variant="outline" onClick={onBackToMenu}>
              Back to Menu
            </Button>
          )}
        </div>
      </div>

      {/* Hardware Status Bar */}
      <div className="bg-blue-50 border-b px-6 py-2">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" />
            <span>Printer:</span>
            <Badge variant={printerStatus === 'connected' ? 'default' : 'destructive'}>
              {printerStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            <span>Scanner:</span>
            <Badge variant={scannerStatus === 'connected' ? 'default' : 'destructive'}>
              {scannerStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Terminal:</span>
            <Badge variant={terminalStatus === 'connected' ? 'default' : 'destructive'}>
              {terminalStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scanning">Mobile Scan</TabsTrigger>
            <TabsTrigger value="counting">Count Items</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Stock Taking Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!currentSession ? (
                    <div className="text-center py-8">
                      <Button
                        onClick={() => {
                          createSessionMutation.mutate({
                            name: `Stock Take ${new Date().toLocaleDateString()}`,
                            userId: currentUser?.id || 1
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start New Stock Taking Session
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{currentSession.name}</h3>
                          <p className="text-gray-600">Started: {new Date(currentSession.startDate).toLocaleString()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {currentSession.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{sessionStats.progress}%</div>
                          <div className="text-sm text-gray-600">Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{currentSession.countedItems}</div>
                          <div className="text-sm text-gray-600">Items Counted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{currentSession.discrepancies}</div>
                          <div className="text-sm text-gray-600">Discrepancies</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{sessionStats.accuracy}%</div>
                          <div className="text-sm text-gray-600">Accuracy</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => printStockReportMutation.mutate(currentSession.id)}
                          variant="outline"
                          disabled={printerStatus !== 'connected'}
                        >
                          <PrinterIcon className="w-4 h-4 mr-2" />
                          Print Report
                        </Button>
                        <Button
                          onClick={() => setCurrentSession(null)}
                          variant="outline"
                        >
                          End Session
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Mobile Barcode Scanning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={startCameraScanning}
                      disabled={isScanning}
                      className="h-24 text-lg"
                    >
                      <Camera className="w-6 h-6 mr-2" />
                      Start Camera Scanning
                    </Button>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Manual Barcode Entry</label>
                      <div className="flex gap-2">
                        <Input
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="Enter barcode manually"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && manualBarcode) {
                              handleBarcodeScanned(manualBarcode);
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleBarcodeScanned(manualBarcode)}
                          disabled={!manualBarcode}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {showCamera && (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <Button
                        onClick={stopCameraScanning}
                        className="absolute top-2 right-2"
                        variant="destructive"
                      >
                        Stop Scanning
                      </Button>
                    </div>
                  )}

                  {scannedBarcode && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Scanned Product</h3>
                      <p className="text-green-700">Barcode: {scannedBarcode}</p>
                      {(() => {
                        const product = products.find((p: any) => p.barcode === scannedBarcode);
                        return product ? (
                          <p className="text-green-700">Product: {product.name}</p>
                        ) : (
                          <p className="text-red-700">Product not found in system</p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="counting" className="space-y-6">
            {currentSession ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Count Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Count Entry */}
                    {scannedBarcode && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Quick Count Entry</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Barcode: {scannedBarcode}</p>
                            {(() => {
                              const product = products.find((p: any) => p.barcode === scannedBarcode);
                              return product && <p className="font-medium">{product.name}</p>;
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setCountedQuantity(Math.max(0, countedQuantity - 1))}
                              variant="outline"
                              size="sm"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              id="quantity-input"
                              type="number"
                              value={countedQuantity}
                              onChange={(e) => setCountedQuantity(parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              onClick={() => setCountedQuantity(countedQuantity + 1)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            onClick={() => {
                              const product = products.find((p: any) => p.barcode === scannedBarcode);
                              if (product) {
                                updateItemCountMutation.mutate({
                                  itemId: product.id,
                                  quantity: countedQuantity
                                });
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Count
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Search and Filter */}
                    <div className="flex gap-4">
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="all">All Locations</option>
                        <option value="shop-floor">Shop Floor</option>
                        <option value="storage">Storage</option>
                        <option value="warehouse">Warehouse</option>
                      </select>
                    </div>

                    {/* Items List */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredItems.map((item: StockItem) => (
                        <div key={item.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-600">
                                Barcode: {item.barcode} | Expected: {item.expectedQuantity}
                              </p>
                              <p className="text-sm text-gray-600">
                                Location: {item.location} | Category: {item.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-center">
                                <div className="text-lg font-bold">
                                  {item.countedQuantity}
                                </div>
                                <div className="text-xs text-gray-500">Counted</div>
                              </div>
                              <Badge
                                variant={
                                  item.status === 'verified' ? 'default' :
                                  item.status === 'discrepancy' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {item.variance !== 0 && (
                            <div className={`mt-2 p-2 rounded text-sm ${
                              item.variance > 0 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              Variance: {item.variance > 0 ? '+' : ''}{item.variance} units
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                  <p className="text-gray-600 mb-4">Start a stock taking session to begin counting items</p>
                  <Button onClick={() => setActiveTab("overview")}>
                    Go to Overview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Stock Taking Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => currentSession && printStockReportMutation.mutate(currentSession.id)}
                      disabled={!currentSession || printerStatus !== 'connected'}
                      className="h-20 flex flex-col"
                    >
                      <PrinterIcon className="w-6 h-6 mb-2" />
                      Print Stock Report
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                    >
                      <Download className="w-6 h-6 mb-2" />
                      Export CSV
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      Generate PDF
                    </Button>
                  </div>

                  {stockSessions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Recent Sessions</h3>
                      {stockSessions.slice(0, 5).map((session: StockSession) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{session.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(session.startDate).toLocaleDateString()} - 
                              {session.endDate ? new Date(session.endDate).toLocaleDateString() : 'Ongoing'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{session.countedItems}/{session.totalItems}</p>
                            <p className="text-sm text-gray-600">{session.discrepancies} discrepancies</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Hardware Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Epson Printer</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Status: {printerStatus}</p>
                        <Button
                          onClick={initializePrinter}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">Barcode Scanner</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Status: {scannerStatus}</p>
                        <Button
                          onClick={initializeScanner}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">Payment Terminal</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Status: {terminalStatus}</p>
                        <Button
                          onClick={initializePaymentTerminal}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Camera Settings</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Auto-focus after scan</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Play sound on successful scan</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">Vibrate on scan (mobile only)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}