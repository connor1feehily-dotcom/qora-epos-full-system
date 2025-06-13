import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Scan, Package, CheckCircle } from "lucide-react";
import type { Product } from "@shared/schema";

interface AutoScannerProps {
  onProductAdd: (product: Product) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function AutoScanner({ onProductAdd, isActive, onToggle }: AutoScannerProps) {
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);
  const scannerRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-focus when scanner becomes active
  useEffect(() => {
    if (isActive && scannerRef.current) {
      scannerRef.current.focus();
    }
  }, [isActive]);

  // Process barcode when entered
  useEffect(() => {
    const processBarcode = async (barcode: string) => {
      if (barcode.length < 6) return; // Minimum barcode length
      
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/products/barcode/${barcode}`);
        if (response.ok) {
          const product = await response.json();
          onProductAdd(product);
          setLastScannedProduct(product.name);
          toast({
            title: "Product Added",
            description: `${product.name} - €${parseFloat(product.price.toString()).toFixed(2)}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Product Not Found",
            description: `No product found for barcode: ${barcode}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Barcode scan error:', error);
        toast({
          title: "Scan Error",
          description: "Could not process barcode",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
        setScannedBarcode("");
        // Clear input and refocus for next scan
        if (scannerRef.current) {
          scannerRef.current.value = "";
          scannerRef.current.focus();
        }
      }
    };

    if (scannedBarcode && !isProcessing) {
      processBarcode(scannedBarcode);
    }
  }, [scannedBarcode, isProcessing, onProductAdd, toast]);

  // Handle input changes
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Auto-trigger scan when barcode length is sufficient
    if (value.length >= 8 && value !== scannedBarcode) {
      setScannedBarcode(value);
    }
  };

  // Handle Enter key for manual scanning
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      if (value && value !== scannedBarcode) {
        setScannedBarcode(value);
      }
    }
  };

  return (
    <Card className="kxl-status-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-bold">Barcode Scanner</CardTitle>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className={isActive ? "kxl-emerald-button" : ""}
        >
          <Scan className="w-4 h-4 mr-2" />
          {isActive ? "Active" : "Inactive"}
        </Button>
      </CardHeader>
      
      <CardContent>
        {isActive ? (
          <div className="space-y-4">
            {/* Scanner Status */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
              <span className="text-sm font-medium text-primary">
                {isProcessing ? 'Processing...' : 'Scanner Ready'}
              </span>
              {isProcessing && <Badge variant="outline">Processing</Badge>}
            </div>

            {/* Scanner Input */}
            <div>
              <Input
                ref={scannerRef}
                type="text"
                placeholder="Scan barcode or enter manually..."
                onChange={handleBarcodeInput}
                onKeyPress={handleKeyPress}
                className="text-center font-mono text-lg border-2 border-primary/30 focus:border-primary"
                autoFocus
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Products are automatically added to cart when scanned
              </p>
            </div>

            {/* Scanner Visual */}
            <div className="text-center py-6 border-2 border-dashed border-primary/30 rounded-lg">
              <Scan className="w-12 h-12 mx-auto text-primary mb-3 animate-pulse" />
              <p className="text-sm font-medium text-foreground">Auto-Scan Active</p>
              <p className="text-xs text-muted-foreground">
                Hold barcode steady in scanner field
              </p>
            </div>

            {/* Last Scanned Product */}
            {lastScannedProduct && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Last added: {lastScannedProduct}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Scanner Inactive</p>
            <p className="text-xs text-muted-foreground">
              Click "Active" to enable barcode scanning
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}