import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Minus,
  Plus,
  Trash2,
  Scan,
  Package
} from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { ReceiptPrinter } from "./receipt-printer";
import { AutoScanner } from "./auto-scanner";
import type { Product, Customer } from "@shared/schema";
import type { CartItem, TransactionSummary } from "@/lib/types";

interface POSSystemProps {
  tillId: string;
  onBackToMenu: () => void;
}

export function POSSystem({ tillId, onBackToMenu }: POSSystemProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products for manual selection
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          price: parseFloat(product.price.toString()),
          total: parseFloat(product.price.toString()) * quantity
        };
        return [...prevCart, newItem];
      }
    });
  };

  // Update cart item quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { 
              ...item, 
              quantity: newQuantity,
              total: item.price * newQuantity
            }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  // Calculate totals
  const calculateTransaction = (): TransactionSummary => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatRate = 0.23; // 23% VAT
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    return {
      subtotal,
      vatAmount,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  // Process transaction
  const processTransactionMutation = useMutation({
    mutationFn: async (paymentData: { method: string; amount?: number }) => {
      const transaction = calculateTransaction();
      
      const transactionData = {
        customerId: selectedCustomer?.id || 1, // Default to walk-in customer
        userId: 1, // Would come from authentication
        tillId,
        subtotal: transaction.subtotal.toString(),
        vatAmount: transaction.vatAmount.toString(),
        total: transaction.total.toString(),
        paymentMethod: paymentData.method
      };

      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price.toString(),
        total: item.total.toString()
      }));

      return apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ transaction: transactionData, items })
      });
    },
    onSuccess: (data) => {
      setLastTransaction({
        ...data,
        items: cart,
        customer: selectedCustomer,
        paymentMethod: 'card' // This would come from the payment data
      });
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      toast({
        title: "Transaction Complete",
        description: `Sale processed successfully - Transaction #${data.id}`,
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Transaction Failed",
        description: "Could not process the sale",
        variant: "destructive"
      });
    }
  });

  const handlePayment = (method: string, amount?: number) => {
    processTransactionMutation.mutate({ method, amount });
  };

  const transaction = calculateTransaction();

  return (
    <div className="h-full kxl-neural-bg overflow-y-auto custom-scroll">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button onClick={onBackToMenu} variant="outline">
              ← Back to Menu
            </Button>
            <h1 className="text-2xl font-bold">Point of Sale - {tillId}</h1>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">€{transaction.total.toFixed(2)}</div>
            <div className="text-sm text-gray-500">{transaction.itemCount} items</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner and Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto Scanner */}
            <AutoScanner
              onProductAdd={addToCart}
              isActive={scannerActive}
              onToggle={() => setScannerActive(!scannerActive)}
            />

            {/* Quick Add Products */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Add Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {products.slice(0, 20).map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center p-2 text-xs"
                      onClick={() => addToCart(product)}
                    >
                      <Package className="h-4 w-4 mb-1" />
                      <span className="truncate w-full text-center">{product.name}</span>
                      <span className="font-bold">€{parseFloat(product.price.toString()).toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart */}
          <div className="space-y-6">
            {/* Cart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Shopping Cart</CardTitle>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Cart is empty</p>
                    <p className="text-sm text-gray-500">Scan items to add them</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-500">€{item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total and Payment */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>€{transaction.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (23%):</span>
                    <span>€{transaction.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>€{transaction.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-3">
                    <Button
                      className="flex-1 kxl-emerald-button"
                      onClick={() => setShowPayment(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePayment}
        total={transaction.total}
      />

      {/* Receipt Printer */}
      {lastTransaction && (
        <ReceiptPrinter
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setLastTransaction(null);
          }}
          transaction={lastTransaction}
          customer={lastTransaction.customer}
          tillId={tillId}
          paymentMethod={lastTransaction.paymentMethod}
          transactionId={lastTransaction.id}
        />
      )}
    </div>
  );
}