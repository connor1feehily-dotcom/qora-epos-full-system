import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  CheckCircle,
  DollarSign,
  Moon
} from "lucide-react";
import type { Product, InsertTransaction, InsertTransactionItem } from "@shared/schema";

interface OneTapPOSProps {
  tillId: string;
  onBackToMenu: () => void;
  onGoInactive?: () => void;
}

export function OneTapPOS({ tillId, onBackToMenu, onGoInactive }: OneTapPOSProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async ({ product, paymentMethod }: { product: Product; paymentMethod: 'cash' | 'card' }) => {
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
        unitPrice: product.price.toString(),
        total: product.price.toString()
      };

      const response = await apiRequest('/api/transactions', 'POST', {
        transaction: transaction,
        items: [transactionItem]
      }) as any;

      return { transaction: response.transaction, amount: total };
    },
    onSuccess: (data) => {
      setLastTransactionAmount(data.amount);
      setShowPaymentSuccess(true);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 3000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive"
      });
    }
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handlePayment = (paymentMethod: 'cash' | 'card') => {
    if (selectedProduct) {
      createTransactionMutation.mutate({ product: selectedProduct, paymentMethod });
    }
  };

  const handleNewSale = () => {
    setShowPaymentSuccess(false);
    setSelectedProduct(null);
  };

  // Show success screen
  if (showPaymentSuccess) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">Sale Complete!</h1>
          <p className="text-2xl text-green-700 mb-8">
            €{lastTransactionAmount.toFixed(2)} processed successfully
          </p>
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
          {onGoInactive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoInactive}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200"
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

              {/* Payment Buttons */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-2xl"
                  onClick={() => handlePayment('cash')}
                  disabled={createTransactionMutation.isPending}
                >
                  <Banknote className="w-8 h-8 mr-4" />
                  Pay with Cash
                </Button>
                
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-2xl"
                  onClick={() => handlePayment('card')}
                  disabled={createTransactionMutation.isPending}
                >
                  <CreditCard className="w-8 h-8 mr-4" />
                  Pay with Card
                </Button>
              </div>

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