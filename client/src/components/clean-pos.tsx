import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Minus,
  Plus,
  Trash2,
  Package,
  Search
} from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { ReceiptPrinter } from "./receipt-printer";
import type { Product, Customer } from "@shared/schema";
import type { CartItem, TransactionSummary } from "@/lib/types";

interface CleanPOSProps {
  tillId: string;
  onBackToMenu: () => void;
}

export function CleanPOS({ tillId, onBackToMenu }: CleanPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);
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

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  // Auto-focus hidden input for barcode scanning
  useEffect(() => {
    const focusHiddenInput = () => {
      if (hiddenInputRef.current && document.activeElement !== hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    };

    // Focus on load and periodically refocus
    focusHiddenInput();
    const interval = setInterval(focusHiddenInput, 1000);

    // Focus when clicking anywhere on the page
    const handleClick = () => focusHiddenInput();
    document.addEventListener('click', handleClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Handle barcode scanner input
  useEffect(() => {
    const handleBarcodeInput = async (barcode: string) => {
      if (barcode.length < 6) return;
      
      try {
        const response = await fetch(`/api/products/barcode/${barcode}`);
        if (response.ok) {
          const product = await response.json();
          addToCart(product);
          toast({
            title: "Product Added",
            description: `${product.name} - €${parseFloat(product.price.toString()).toFixed(2)}`,
            variant: "default"
          });
        } else {
          // Silently fail for invalid barcodes - no error toast
        }
      } catch (error) {
        // Silently fail
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle barcode scanner input (rapid typing followed by Enter)
      if (e.target === hiddenInputRef.current && e.key === 'Enter') {
        const barcode = (e.target as HTMLInputElement).value;
        if (barcode) {
          handleBarcodeInput(barcode);
          (e.target as HTMLInputElement).value = '';
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [toast]);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: Date.now(),
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price.toString()),
          quantity,
          total: parseFloat(product.price.toString()) * quantity,
          category: product.category
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
        item.productId === productId
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
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
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
      items: cart,
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
        customerId: selectedCustomer?.id || 1,
        userId: 1,
        tillId,
        subtotal: transaction.subtotal.toString(),
        vatAmount: transaction.vatAmount.toString(),
        total: transaction.total.toString(),
        paymentMethod: paymentData.method
      };

      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toString(),
        total: item.total.toString()
      }));

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction: transactionData, items })
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLastTransaction({
        ...data,
        items: cart,
        customer: selectedCustomer,
        paymentMethod: 'card'
      });
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      toast({
        title: "Sale Complete",
        description: `Transaction #${data.id} processed successfully`,
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
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Hidden input for barcode scanning */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Header Bar */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-cyan-500/20 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Button 
            onClick={onBackToMenu} 
            className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
          >
            ← Main Menu
          </Button>
          <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Till {tillId}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-emerald-400">€{transaction.total.toFixed(2)}</div>
          <div className="text-cyan-300">{transaction.itemCount} items</div>
        </div>
      </div>

      <div className="h-[calc(100vh-96px)] grid grid-cols-12 gap-6 p-6">
        {/* Left Section - Products (8 columns) */}
        <div className="col-span-8 flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="bg-black/20 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
              <Input
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-black/40 border-cyan-500/30 text-white placeholder-cyan-300/60 text-lg h-12 rounded-xl focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 bg-black/20 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-6">
            <div className="grid grid-cols-6 gap-4 h-full">
              {filteredProducts.slice(0, 30).map((product) => (
                <Button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="h-24 bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:from-cyan-600/20 hover:to-emerald-600/20 border border-slate-600/50 hover:border-cyan-400/50 rounded-xl flex flex-col items-center justify-center p-3 text-white transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-105"
                >
                  <Package className="h-6 w-6 mb-2 text-cyan-400" />
                  <span className="text-xs font-medium text-center leading-tight truncate w-full">{product.name}</span>
                  <span className="text-sm font-bold text-emerald-400">€{parseFloat(product.price.toString()).toFixed(2)}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Cart (4 columns) */}
        <div className="col-span-4 flex flex-col space-y-4">
          {/* Cart */}
          <div className="flex-1 bg-black/20 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Cart</h3>
              {cart.length > 0 && (
                <Button 
                  onClick={clearCart}
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                >
                  Clear
                </Button>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto text-cyan-400/60 mb-4" />
                <p className="text-cyan-300 text-lg">Cart is empty</p>
                <p className="text-cyan-400/60">Scan items or click products</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-slate-800/60 border border-slate-600/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-cyan-400">€{item.price.toFixed(2)} each</p>
                      </div>
                      <Button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-2 h-10 w-10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-bold text-white w-12 text-center">{item.quantity}</span>
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-2 h-10 w-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">€{item.total.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total and Payment */}
          {cart.length > 0 && (
            <div className="bg-black/30 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-cyan-300">Subtotal:</span>
                  <span className="text-white font-semibold">€{transaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-cyan-300">VAT (23%):</span>
                  <span className="text-white font-semibold">€{transaction.vatAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-emerald-500/30 pt-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">€{transaction.total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-0 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                >
                  <CreditCard className="h-6 w-6 mr-3" />
                  Complete Sale
                </Button>
              </div>
            </div>
          )}
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