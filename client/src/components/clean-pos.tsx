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
    <div className="h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white overflow-hidden">
      {/* Hidden input for barcode scanning */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Modern Header Bar */}
      <div className="bg-gradient-to-r from-black/40 via-black/30 to-black/40 backdrop-blur-xl border-b border-cyan-400/30 px-8 py-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-8">
          <Button 
            onClick={onBackToMenu} 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-8 py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
          >
            ← Main Menu
          </Button>
          <div className="flex flex-col">
            <div className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Till {tillId}
            </div>
            <div className="text-cyan-400/80 text-sm font-medium">Point of Sale System</div>
          </div>
        </div>
        <div className="text-right bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-emerald-400/30">
          <div className="text-5xl font-black text-emerald-400 mb-1">€{transaction.total.toFixed(2)}</div>
          <div className="text-cyan-300 text-lg font-medium">{transaction.itemCount} items in cart</div>
        </div>
      </div>

      <div className="h-[calc(100vh-120px)] grid grid-cols-12 gap-6 p-6">
        {/* Left Section - Products (7 columns) */}
        <div className="col-span-7 flex flex-col space-y-6">
          {/* Enhanced Search Bar */}
          <div className="bg-gradient-to-r from-black/30 via-black/20 to-black/30 backdrop-blur-xl border border-cyan-400/40 rounded-2xl p-6 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-cyan-400 h-6 w-6" />
              <Input
                placeholder="🔍 Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 bg-black/60 border-cyan-400/50 text-white placeholder-cyan-300/80 text-xl h-16 rounded-xl focus:border-cyan-300 focus:ring-cyan-300/30 focus:ring-4 font-medium shadow-inner"
              />
            </div>
          </div>

          {/* Product Grid - Enhanced with Better Visuals */}
          <div className="flex-1 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-xl border border-cyan-400/40 rounded-2xl p-6 overflow-hidden shadow-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Product Categories</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"></div>
            </div>
            <div className="h-[calc(100%-80px)] grid grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const getCategoryIcon = (category: string) => {
                  switch(category.toLowerCase()) {
                    case 'drinks': return '🥤';
                    case 'deli': return '🥪';
                    case 'fuel': return '⛽';
                    case 'fruit': return '🍌';
                    case 'vegetables': return '🥕';
                    case 'bakery': return '🍞';
                    case 'dairy': return '🥛';
                    case 'tobacco': return '🚬';
                    case 'newspapers': return '📰';
                    case 'lottery': return '🎫';
                    default: return '📦';
                  }
                };

                return (
                  <Button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="h-28 bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-cyan-600/30 hover:via-blue-600/30 hover:to-emerald-600/30 border-2 border-slate-600/60 hover:border-cyan-400/80 rounded-2xl flex flex-col items-center justify-center p-4 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-110 hover:-translate-y-1 group"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-125 transition-transform duration-300">
                      {getCategoryIcon(product.category)}
                    </div>
                    <span className="text-sm font-bold text-center leading-tight truncate w-full mb-2 group-hover:text-cyan-300 transition-colors">
                      {product.name}
                    </span>
                    <span className="text-lg font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      €{parseFloat(product.price.toString()).toFixed(2)}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-1 mt-2 border-cyan-500/50 text-cyan-300 bg-cyan-500/10 group-hover:bg-cyan-400/20 group-hover:border-cyan-400 transition-all"
                    >
                      {product.category}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced Cart (5 columns) */}
        <div className="col-span-5 flex flex-col h-full space-y-6">
          {/* Cart Section */}
          <div className="flex-1 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-xl border border-cyan-400/40 rounded-2xl p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-cyan-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">Shopping Cart</h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"></div>
                </div>
              </div>
              {cart.length > 0 && (
                <Button 
                  onClick={clearCart}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                >
                  🗑️ Clear All
                </Button>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl border-2 border-dashed border-cyan-400/30">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-2xl font-bold text-cyan-300 mb-2">Cart is Empty</p>
                <p className="text-cyan-400/80 text-lg text-center">
                  Scan barcodes or tap products<br/>to add items to your cart
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={item.id} className="bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 border-2 border-slate-600/50 rounded-2xl p-5 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <p className="font-bold text-white text-lg">{item.name}</p>
                        </div>
                        <p className="text-cyan-400 text-base ml-11">€{item.price.toFixed(2)} per item</p>
                      </div>
                      <Button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-xl transition-all duration-300"
                        variant="ghost"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 bg-black/30 rounded-2xl p-2">
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white p-2 h-12 w-12 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:scale-110"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-2xl font-black text-white w-16 text-center bg-cyan-500/20 rounded-xl py-2">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white p-2 h-12 w-12 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:scale-110"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-400">€{item.total.toFixed(2)}</div>
                        <div className="text-sm text-cyan-300">Item Total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Payment Section */}
          <div className="bg-gradient-to-br from-emerald-900/40 via-black/30 to-emerald-900/40 backdrop-blur-xl border-2 border-emerald-400/50 rounded-2xl p-6 shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-3xl">💰</div>
                <h3 className="text-2xl font-bold text-white">Order Summary</h3>
              </div>
              <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-emerald-400/20">
                <span className="text-cyan-300 text-lg">Subtotal:</span>
                <span className="text-white font-bold text-xl">€{transaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-emerald-400/20">
                <span className="text-cyan-300 text-lg">VAT (23%):</span>
                <span className="text-white font-bold text-xl">€{transaction.vatAmount.toFixed(2)}</span>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-400/30">
                <div className="flex justify-between items-center">
                  <span className="text-white text-2xl font-bold">TOTAL:</span>
                  <span className="text-emerald-400 text-4xl font-black">€{transaction.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:via-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white border-0 py-6 text-2xl font-black rounded-2xl shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
            >
              <CreditCard className="h-8 w-8 mr-4" />
              {cart.length === 0 ? 'Add Items to Cart' : 'Complete Sale'}
            </Button>
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