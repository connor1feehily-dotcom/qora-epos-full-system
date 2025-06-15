import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  CheckCircle,
  DollarSign,
  Moon,
  Scan,
  Star,
  Clock,
  Users,
  Receipt,
  Calculator
} from "lucide-react";
import type { Product, InsertTransaction, InsertTransactionItem, Customer } from "@shared/schema";

interface EnhancedPOSProps {
  tillId: string;
  onBackToMenu: () => void;
  onGoInactive?: () => void;
}

export function EnhancedPOS({ tillId, onBackToMenu, onGoInactive }: EnhancedPOSProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [barcode, setBarcode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Barcode scanning
  const handleBarcodeSubmit = () => {
    if (!barcode) return;
    
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setBarcode("");
      toast({
        title: "Product Found",
        description: `${product.name} selected`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product with barcode: ${barcode}`,
        variant: "destructive"
      });
    }
  };

  // Transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async ({ product, paymentMethod, amount }: { 
      product?: Product; 
      paymentMethod: 'cash' | 'card';
      amount?: number;
    }) => {
      let total: number;
      let productId: number | undefined;
      
      if (product) {
        total = Number(product.price);
        productId = product.id;
      } else if (amount) {
        total = amount;
      } else {
        throw new Error("No product or amount specified");
      }

      const vatAmount = total * 0.23;
      const subtotal = total - vatAmount;

      const transaction: InsertTransaction = {
        tillId: tillId,
        userId: 1,
        customerId: selectedCustomer?.id || null,
        total: total.toString(),
        subtotal: subtotal.toString(),
        vatAmount: vatAmount.toString(),
        paymentMethod: paymentMethod,
        itemCount: 1
      };

      const items = [];
      if (productId) {
        const transactionItem: InsertTransactionItem = {
          transactionId: 0,
          productId: productId,
          quantity: 1,
          unitPrice: total.toString(),
          total: total.toString()
        };
        items.push(transactionItem);
      }

      const response = await apiRequest('/api/transactions', 'POST', {
        transaction: transaction,
        items: items
      }) as any;

      // Update loyalty points if customer selected
      if (selectedCustomer) {
        const pointsEarned = Math.floor(total);
        await apiRequest(`/api/customers/${selectedCustomer.id}`, 'PUT', {
          loyaltyPoints: selectedCustomer.loyaltyPoints + pointsEarned
        });
      }

      return { transaction: response.transaction, amount: total };
    },
    onSuccess: (data) => {
      setLastTransactionAmount(data.amount);
      setShowPaymentSuccess(true);
      setSelectedProduct(null);
      setCustomAmount("");
      setSelectedCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
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
    setCustomAmount(""); // Clear custom amount when product selected
  };

  const handlePayment = (paymentMethod: 'cash' | 'card') => {
    if (selectedProduct) {
      createTransactionMutation.mutate({ product: selectedProduct, paymentMethod });
    } else if (customAmount) {
      const amount = parseFloat(customAmount);
      if (amount > 0) {
        createTransactionMutation.mutate({ paymentMethod, amount });
      }
    }
  };

  const handleNewSale = () => {
    setShowPaymentSuccess(false);
    setSelectedProduct(null);
    setCustomAmount("");
    setSelectedCustomer(null);
  };

  const getRecentTransactions = () => {
    // This would fetch recent transactions in a real implementation
    return [];
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
          <p className="text-2xl text-green-700 mb-4">
            €{lastTransactionAmount.toFixed(2)} processed successfully
          </p>
          {selectedCustomer && (
            <div className="bg-white rounded-lg p-4 mb-6 max-w-sm mx-auto">
              <p className="text-sm text-gray-600">Loyalty Points Added</p>
              <p className="font-bold text-lg">{Math.floor(lastTransactionAmount)} points</p>
              <p className="text-sm text-gray-500">Customer: {selectedCustomer.name}</p>
            </div>
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
            <span className="font-semibold text-gray-700">Till {tillId} - Enhanced POS</span>
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

      {/* Quick Tools */}
      <div className="bg-blue-50 border-b px-6 py-3">
        <div className="flex items-center space-x-4">
          {/* Barcode Scanner */}
          <div className="flex items-center space-x-2">
            <Scan className="w-4 h-4 text-blue-600" />
            <Input
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
              className="w-48"
            />
            <Button size="sm" onClick={handleBarcodeSubmit}>
              Search
            </Button>
          </div>

          {/* Customer Selection */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const customer = customers.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer || null);
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.loyaltyPoints} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center space-x-1"
          >
            <Star className="w-4 h-4" />
            <span>Quick Actions</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Product Selection */}
        <div className="w-1/2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
            <Badge variant="outline" className="bg-blue-50">
              {products.length} available
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    €{Number(product.price).toFixed(2)}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{product.category}</span>
                    <span>Stock: {product.stock}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Amount */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-3">Custom Amount</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xl">€</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedProduct(null); // Clear product when custom amount entered
                  }}
                  className="text-xl text-center"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">For miscellaneous items</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="w-1/2 p-6 bg-white border-l">
          {(selectedProduct || customAmount) ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Sale</h2>
              
              {/* Customer Info */}
              {selectedCustomer && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">{selectedCustomer.name}</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Current Points: {selectedCustomer.loyaltyPoints} | 
                    Will Earn: {selectedProduct ? Math.floor(Number(selectedProduct.price)) : Math.floor(parseFloat(customAmount || "0"))} points
                  </p>
                </div>
              )}
              
              {/* Selected Item Display */}
              <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  {selectedProduct ? (
                    <>
                      <h3 className="text-xl font-bold mb-3">{selectedProduct.name}</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-3">
                        €{Number(selectedProduct.price).toFixed(2)}
                      </div>
                      <p className="text-gray-600">Category: {selectedProduct.category}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold mb-3">Custom Amount</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-3">
                        €{parseFloat(customAmount || "0").toFixed(2)}
                      </div>
                      <p className="text-gray-600">Miscellaneous item</p>
                    </>
                  )}
                  <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal (excl. VAT):</span>
                      <span>€{((selectedProduct ? Number(selectedProduct.price) : parseFloat(customAmount || "0")) * 0.77).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (23%):</span>
                      <span>€{((selectedProduct ? Number(selectedProduct.price) : parseFloat(customAmount || "0")) * 0.23).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Buttons */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-xl"
                  onClick={() => handlePayment('cash')}
                  disabled={createTransactionMutation.isPending}
                >
                  <Banknote className="w-6 h-6 mr-3" />
                  Pay with Cash
                </Button>
                
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-xl"
                  onClick={() => handlePayment('card')}
                  disabled={createTransactionMutation.isPending}
                >
                  <CreditCard className="w-6 h-6 mr-3" />
                  Pay with Card
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 py-3 text-lg"
                onClick={() => {
                  setSelectedProduct(null);
                  setCustomAmount("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="text-center mt-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-3">Ready for Next Sale</h3>
              <p className="text-gray-500 mb-6">
                Select a product, scan a barcode, or enter a custom amount
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Today's Sales</p>
                  <p className="font-bold text-lg">€0.00</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Receipt className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="font-bold text-lg">0</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}