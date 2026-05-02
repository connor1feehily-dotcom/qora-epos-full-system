import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, FileText, Package, CheckCircle, XCircle, Edit3, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ScannedProduct {
  id?: number;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  matched: boolean;
  confidence: number;
  originalText: string;
}

interface DeliveryDocket {
  id: string;
  supplierName: string;
  deliveryDate: string;
  invoiceNumber: string;
  products: ScannedProduct[];
  totalAmount: number;
  status: 'scanned' | 'processing' | 'matched' | 'imported';
}

interface DeliveryScannerProps {
  onClose?: () => void;
}

export function DeliveryScanner({ onClose }: DeliveryScannerProps) {
  const [currentDocket, setCurrentDocket] = useState<DeliveryDocket | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing products for matching
  const { data: existingProducts = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  // OCR + parse mutation. OCR runs entirely in the browser via Tesseract.js
  // (no API key, no upload of the photo). Only the extracted text is sent
  // to the server, which parses it into line items and matches them against
  // existing stock.
  const processOCRMutation = useMutation({
    mutationFn: async (file: File) => {
      setScanStatus("Loading scanner...");
      setScanProgress(5);

      // Dynamic import keeps Tesseract out of the main bundle.
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setScanStatus("Reading docket...");
            setScanProgress(20 + Math.round(m.progress * 70));
          } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
            setScanStatus("Loading scanner...");
            setScanProgress(10);
          } else if (m.status === 'loading language traineddata' || m.status === 'initializing api') {
            setScanStatus("Preparing...");
            setScanProgress(15);
          }
        },
      });

      let ocrText = '';
      try {
        const { data } = await worker.recognize(file);
        ocrText = data.text || '';
      } finally {
        try { await worker.terminate(); } catch {}
      }

      setScanStatus("Matching products...");
      setScanProgress(95);

      const response = await apiRequest('POST', '/api/delivery/scan-docket', {
        ocrText,
        existingProducts,
      });
      if (!response.ok) {
        let message = 'Could not read the docket. Try a clearer photo or enter manually.';
        try {
          const body = await response.json();
          if (body?.message) message = body.message;
          else if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: (data: DeliveryDocket) => {
      setCurrentDocket(data);
      setIsScanning(false);
      setScanProgress(0);
      setScanStatus("");
      toast({
        title: "Docket Scanned",
        description: `Found ${data.products.length} products. ${data.products.filter(p => p.matched).length} matched to existing stock. Review before importing.`
      });
    },
    onError: (error: Error) => {
      setIsScanning(false);
      setScanProgress(0);
      setScanStatus("");
      toast({
        title: "Scanning Failed",
        description: error?.message || "Unable to process the delivery docket. Please try again or enter manually.",
        variant: "destructive"
      });
    }
  });

  // Import delivery mutation
  const importDeliveryMutation = useMutation({
    mutationFn: async (docket: DeliveryDocket) => {
      const response = await apiRequest('POST', '/api/delivery/import', docket);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      toast({
        title: "Delivery Imported Successfully",
        description: "All products have been added to inventory."
      });
      setCurrentDocket(null);
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Unable to import delivery. Please check the data and try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("Starting...");
    processOCRMutation.mutate(file);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const updateProduct = (index: number, updates: Partial<ScannedProduct>) => {
    if (!currentDocket) return;
    
    const updatedProducts = [...currentDocket.products];
    updatedProducts[index] = { ...updatedProducts[index], ...updates };
    
    // Recalculate total
    updatedProducts[index].total = updatedProducts[index].quantity * updatedProducts[index].unitPrice;
    
    setCurrentDocket({
      ...currentDocket,
      products: updatedProducts,
      totalAmount: updatedProducts.reduce((sum, p) => sum + p.total, 0)
    });
  };

  const removeProduct = (index: number) => {
    if (!currentDocket) return;
    
    const updatedProducts = currentDocket.products.filter((_, i) => i !== index);
    setCurrentDocket({
      ...currentDocket,
      products: updatedProducts,
      totalAmount: updatedProducts.reduce((sum, p) => sum + p.total, 0)
    });
  };

  const addManualProduct = () => {
    if (!currentDocket) return;
    
    const newProduct: ScannedProduct = {
      name: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      matched: false,
      confidence: 1,
      originalText: "Manual Entry"
    };
    
    setCurrentDocket({
      ...currentDocket,
      products: [...currentDocket.products, newProduct]
    });
    setEditingProduct(currentDocket.products.length);
  };

  const startManualEntry = () => {
    const docket: DeliveryDocket = {
      id: `manual-${Date.now()}`,
      supplierName: "",
      deliveryDate: new Date().toISOString().split('T')[0],
      invoiceNumber: "",
      products: [],
      totalAmount: 0,
      status: 'scanned'
    };
    setCurrentDocket(docket);
    setManualEntry(true);
  };

  if (manualEntry || currentDocket) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Delivery Import - {manualEntry ? "Manual Entry" : "Scanned Docket"}
                </CardTitle>
                <CardDescription>
                  Review and confirm delivery details before importing
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setCurrentDocket(null);
                setManualEntry(false);
                onClose?.();
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Delivery Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label htmlFor="supplier">Supplier Name</Label>
                <Input
                  id="supplier"
                  value={currentDocket?.supplierName || ""}
                  onChange={(e) => setCurrentDocket(prev => prev ? {...prev, supplierName: e.target.value} : null)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="invoice">Invoice Number</Label>
                <Input
                  id="invoice"
                  value={currentDocket?.invoiceNumber || ""}
                  onChange={(e) => setCurrentDocket(prev => prev ? {...prev, invoiceNumber: e.target.value} : null)}
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <Label htmlFor="date">Delivery Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={currentDocket?.deliveryDate || ""}
                  onChange={(e) => setCurrentDocket(prev => prev ? {...prev, deliveryDate: e.target.value} : null)}
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Products ({currentDocket?.products.length || 0})</h3>
                <Button onClick={addManualProduct} size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {currentDocket?.products.map((product, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                          {editingProduct === index ? (
                            <>
                              <div className="md:col-span-2">
                                <Label>Product Name</Label>
                                <Input
                                  value={product.name}
                                  onChange={(e) => updateProduct(index, { name: e.target.value })}
                                  placeholder="Product name"
                                />
                              </div>
                              <div>
                                <Label>Barcode</Label>
                                <Input
                                  value={product.barcode || ""}
                                  onChange={(e) => updateProduct(index, { barcode: e.target.value })}
                                  placeholder="Barcode"
                                />
                              </div>
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) => updateProduct(index, { quantity: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label>Unit Price (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={product.unitPrice}
                                  onChange={(e) => updateProduct(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{product.name}</h4>
                                  {product.matched ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Matched
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      New
                                    </Badge>
                                  )}
                                </div>
                                {product.barcode && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Barcode: {product.barcode}
                                  </p>
                                )}
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{product.quantity}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Qty</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">€{product.unitPrice.toFixed(2)}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Unit</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">€{product.total.toFixed(2)}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {editingProduct === index ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setEditingProduct(null)}
                                className="h-8"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeProduct(index)}
                                className="h-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProduct(index)}
                                className="h-8"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeProduct(index)}
                                className="h-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Total and Actions */}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                Total: €{currentDocket?.totalAmount.toFixed(2) || "0.00"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentDocket(null);
                    setManualEntry(false);
                    onClose?.();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => currentDocket && importDeliveryMutation.mutate(currentDocket)}
                  disabled={!currentDocket?.products.length || importDeliveryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importDeliveryMutation.isPending ? "Importing..." : "Import Delivery"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Delivery Scanner for Valerie
              </CardTitle>
              <CardDescription>
                Scan delivery dockets or enter products manually - no more one-by-one input!
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isScanning ? (
            <div className="text-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-lg font-medium">{scanStatus || "Processing your docket..."}</p>
              <div className="max-w-sm mx-auto">
                <Progress value={scanProgress} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {scanProgress}% — reading the photo on this device. Nothing is uploaded.
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                First scan downloads the reader (~5 MB). After that it works offline.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">How would you like to add your delivery?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Camera Scan */}
                  <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <CardContent className="p-6 text-center" onClick={() => cameraInputRef.current?.click()}>
                      <Camera className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Take Photo</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use your device camera to scan the docket
                      </p>
                    </CardContent>
                  </Card>

                  {/* File Upload */}
                  <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <CardContent className="p-6 text-center" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Upload Image</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Select a photo of your delivery docket
                      </p>
                    </CardContent>
                  </Card>

                  {/* Manual Entry */}
                  <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <CardContent className="p-6 text-center" onClick={startManualEntry}>
                      <FileText className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Manual Entry</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter products manually with smart suggestions
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🚀 How this helps Valerie:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Scan dockets with your phone - no more typing each product</li>
                  <li>• Auto-matches existing products to save time</li>
                  <li>• Smart suggestions for new products</li>
                  <li>• Batch import entire deliveries at once</li>
                  <li>• Automatic inventory updates</li>
                </ul>
              </div>
            </>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}