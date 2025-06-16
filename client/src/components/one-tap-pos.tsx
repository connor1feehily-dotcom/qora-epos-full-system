import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PaymentInterface } from "@/components/payment-interface";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  CheckCircle,
  DollarSign,
  Moon,
  Settings,
  ShoppingCart,
  FileText,
  Calculator,
  Printer,
  RefreshCw
} from "lucide-react";
import type { Product, InsertTransaction, InsertTransactionItem, User } from "@shared/schema";

interface OneTapPOSProps {
  tillId: string;
  onBackToMenu: () => void;
  onGoInactive?: () => void;
  currentUser?: User;
}

export function OneTapPOS({ tillId, onBackToMenu, onGoInactive, currentUser }: OneTapPOSProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentInterface, setShowPaymentInterface] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
  const [lastChange, setLastChange] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  console.log("Products loaded:", products.length, "products");
  if (productsError) console.error("Products error:", productsError);

  // Transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async ({ product, paymentMethod, amountGiven, change }: { product: Product; paymentMethod: 'cash' | 'card'; amountGiven?: number; change?: number }) => {
      console.log("Starting transaction for product:", product.name, "payment:", paymentMethod);
      
      const total = Number(product.price);
      const vatAmount = total * 0.23;
      const subtotal = total - vatAmount;

      const transaction: InsertTransaction = {
        tillId: tillId,
        userId: 1,
        total: total.toString(),
        subtotal: subtotal.toString(),
        vatAmount: vatAmount.toString(),
        paymentMethod: paymentMethod,
        itemCount: 1
      };

      const transactionItem: InsertTransactionItem = {
        transactionId: 0, // Will be set by API
        productId: product.id,
        quantity: 1,
        unitPrice: total.toString(),
        total: total.toString()
      };

      const payload = {
        transaction: transaction,
        items: [transactionItem]
      };
      
      console.log("Transaction payload:", payload);

      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`Transaction failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Transaction response:", data);
        return { transaction: data.transaction, amount: total, change: change || 0 };
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setLastTransactionAmount(data.amount);
      setLastChange(data.change || 0);
      setShowPaymentSuccess(true);
      setShowPaymentInterface(false);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 5000);
    },
    onError: (error) => {
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: `Failed to process transaction: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowPaymentInterface(true);
  };

  const handlePaymentComplete = (paymentMethod: 'cash' | 'card', amountGiven?: number, change?: number) => {
    if (selectedProduct) {
      createTransactionMutation.mutate({ 
        product: selectedProduct, 
        paymentMethod, 
        amountGiven, 
        change 
      });
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentInterface(false);
    setSelectedProduct(null);
  };

  const handleNewSale = () => {
    setShowPaymentSuccess(false);
    setSelectedProduct(null);
  };

  // Show payment interface
  if (showPaymentInterface && selectedProduct) {
    return (
      <PaymentInterface
        product={selectedProduct}
        onPaymentComplete={handlePaymentComplete}
        onCancel={handlePaymentCancel}
        isProcessing={createTransactionMutation.isPending}
      />
    );
  }

  // Show success screen
  if (showPaymentSuccess) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">Sale Complete!</h1>
          <p className="text-2xl text-green-700 mb-4">
            €{lastTransactionAmount.toFixed(2)} processed successfully
          </p>
          {lastChange > 0 && (
            <p className="text-xl text-green-600 mb-8">
              Change: €{lastChange.toFixed(2)}
            </p>
          )}
          <Button
            size="lg"
            onClick={handleNewSale}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xl"
          >
            New Sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToMenu}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-gray-700">Till {tillId} - Quick Sale</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* User Info */}
          {currentUser && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {currentUser.firstName?.charAt(0) || currentUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{currentUser.firstName || currentUser.username}</span>
            </div>
          )}

          {/* Admin Menu */}
          {currentUser?.role === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-cyan-100 hover:bg-cyan-200">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Products
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calculator className="w-4 h-4 mr-2" />
                  Till Calculator
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Test Receipt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Daily X Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Daily Z Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Open Till Session
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Close Till Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (products.length > 0) {
                setSelectedProduct(products[0]);
                console.log("Selected first product for testing:", products[0]);
              }
            }}
            className="bg-blue-100 hover:bg-blue-200"
          >
            Quick Test
          </Button>
          
          {onGoInactive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("Force inactive button clicked");
                console.log("Setting mode to inactive");
                onGoInactive();
              }}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700"
            >
              <Moon className="w-4 h-4" />
              <span>Go Inactive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Product Selection */}
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Select Product</h2>
          <div className="grid grid-cols-2 gap-6">
            {products.map(product => (
              <Card 
                key={product.id} 
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${
                  selectedProduct?.id === product.id 
                    ? 'ring-4 ring-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'hover:scale-102'
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-2">
                    €{Number(product.price).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center p-8">
              <p className="text-gray-500 text-xl">No products available</p>
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="w-1/2 p-8 bg-white border-l">
          {selectedProduct ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-8 text-gray-800">Complete Sale</h2>
              
              {/* Selected Product Display */}
              <Card className="mb-8 bg-blue-50 border-blue-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">{selectedProduct.name}</h3>
                  <div className="text-5xl font-bold text-blue-600 mb-4">
                    €{Number(selectedProduct.price).toFixed(2)}
                  </div>
                  <p className="text-gray-600">Including 23% VAT</p>
                </CardContent>
              </Card>

              <p className="text-gray-600 text-lg mb-6">
                Product selected! The payment interface will appear next.
              </p>

              <Button
                variant="outline"
                className="w-full mt-4 py-3 text-lg"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="text-center mt-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <DollarSign className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-4">Select a product to continue</h3>
              <p className="text-gray-500">Choose a product from the left to complete the sale</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}