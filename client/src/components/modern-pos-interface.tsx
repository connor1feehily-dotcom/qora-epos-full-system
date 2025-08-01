import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SecurePaymentInterface from "@/components/secure-payment-interface";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  CheckCircle,
  DollarSign,
  Moon,
  Sun,
  Settings,
  ShoppingCart,
  FileText,
  Calculator,
  Printer,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Clock,
  Wifi,
  WifiOff,
  Home,
  Package,
  Users,
  RotateCcw,
  Pause,
  Play,
  Receipt,
  Gift,
  Percent,
  AlertTriangle,
  Lock,
  LogOut,
  X,
  Download
} from "lucide-react";
import type { Product, InsertTransaction, InsertTransactionItem, User as UserType, PosButton } from "@shared/schema";
import quantumLogo from "@assets/Quantum POS Logo _1754045289852.png";

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface ModernPOSProps {
  tillId: string;
  onBackToMenu: () => void;
  onGoInactive?: () => void;
  currentUser?: UserType;
}

export function ModernPOSInterface({ tillId, onBackToMenu, onGoInactive, currentUser }: ModernPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentInterface, setShowPaymentInterface] = useState(false);
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [shiftStartTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [heldTransactions, setHeldTransactions] = useState<CartItem[][]>([]);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [showSalesReportModal, setShowSalesReportModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [showSettlementsModal, setShowSettlementsModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch POS buttons
  const { data: posButtons = [] } = useQuery<PosButton[]>({
    queryKey: ['/api/pos-buttons', tillId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/pos-buttons?tillId=${tillId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch POS buttons');
        }
        return response.json();
      } catch (error) {
        console.error('POS buttons fetch error:', error);
        return [];
      }
    },
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxRate = 0.20; // 20% VAT
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const loyaltyPoints = Math.floor(total * 10); // 10 points per euro

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "other")))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Add to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice * (1 - updated[existingIndex].discount);
        return updated;
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          unitPrice: parseFloat(product.price),
          discount: 0,
          subtotal: quantity * parseFloat(product.price)
        };
        return [...prev, newItem];
      }
    });
  };

  // Update cart item quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice * (1 - item.discount) }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Apply discount to item
  const applyDiscount = (productId: number, discountPercent: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, discount: discountPercent / 100, subtotal: item.quantity * item.unitPrice * (1 - discountPercent / 100) }
        : item
    ));
  };

  // Hold transaction
  const holdTransaction = () => {
    if (cart.length === 0) return;
    setHeldTransactions(prev => [...prev, cart]);
    setCart([]);
    toast({ title: "Transaction held", description: "Sale has been held for later recall" });
  };

  // Recall held transaction
  const recallTransaction = (index: number) => {
    setCart(heldTransactions[index]);
    setHeldTransactions(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Transaction recalled", description: "Held sale has been restored" });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async ({ paymentMethod, amountGiven, change }: { paymentMethod: 'cash' | 'card'; amountGiven?: number; change?: number }) => {
      const transactionData: InsertTransaction = {
        tillId,
        userId: currentUser?.id || 1,
        customerId: null,
        status: 'completed',
        subtotal: subtotal.toFixed(2),
        vatAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        paymentMethod,
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
      };

      // Prepare transaction items
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        total: item.subtotal.toFixed(2)
      }));

      const response = await apiRequest('POST', '/api/transactions', {
        transaction: transactionData,
        items: items
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const result = await response.json();

      return {
        transactionId: result.transaction.id,
        total: total.toFixed(2),
        paymentMethod,
        amountGiven,
        change
      };
    },
    onSuccess: (result) => {
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      if (result.paymentMethod === 'cash' && result.change > 0) {
        toast({
          title: "Payment Successful",
          description: `Transaction #${result.transactionId} completed. Change due: €${result.change.toFixed(2)}`,
          duration: 8000
        });
      } else {
        toast({
          title: "Payment Successful",
          description: `Transaction #${result.transactionId} completed successfully. Total: €${result.total}`,
          duration: 5000
        });
      }
    },
    onError: (error) => {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing the transaction. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle cash payment
  const handleCashPayment = () => {
    if (cart.length === 0) return;
    setShowCashInput(true);
  };

  // Process cash payment
  const processCashPayment = () => {
    const amountGiven = parseFloat(cashAmount);
    if (isNaN(amountGiven) || amountGiven <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid cash amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (amountGiven < total) {
      toast({
        title: "Insufficient Amount",
        description: `Cash amount must be at least €${total.toFixed(2)}. You entered €${amountGiven.toFixed(2)}.`,
        variant: "destructive"
      });
      return;
    }

    const change = amountGiven - total;
    setShowCashInput(false);
    setCashAmount("");
    
    createTransactionMutation.mutate({
      paymentMethod: 'cash',
      amountGiven,
      change
    });
  };

  // Handle card payment
  const handleCardPayment = () => {
    if (cart.length === 0) return;
    
    // For card payments, we assume the card reader handles the amount automatically
    createTransactionMutation.mutate({
      paymentMethod: 'card',
      amountGiven: total,
      change: 0
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Calculate shift duration
  const shiftDuration = Math.floor((currentTime.getTime() - shiftStartTime.getTime()) / (1000 * 60));

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={quantumLogo} alt="Quantum POS" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quantum POS</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Advanced Retail System</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(currentTime)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {currentUser?.role} • Till {tillId}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.floor(shiftDuration / 60)}h {shiftDuration % 60}m
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Shift time
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onGoInactive}
              >
                <Lock className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Navigation */}
        <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex-1 flex flex-col space-y-2 p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowEndOfDayModal(true)}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Z-Read</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowSalesReportModal(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-xs">Sales</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowReturnsModal(true)}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-xs">Returns</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowInventoryModal(true)}
            >
              <Package className="w-5 h-5" />
              <span className="text-xs">Inventory</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowCustomersModal(true)}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Customers</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-12 flex flex-col items-center space-y-1"
              onClick={() => setShowSettlementsModal(true)}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settlements</span>
            </Button>
          </div>
        </div>

        {/* Center Panel - Transaction Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {/* Product Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Scan barcode or search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Cart is empty</p>
                  <p className="text-sm">Scan or select items to begin transaction</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          €{item.unitPrice.toFixed(2)} each
                          {item.discount > 0 && (
                            <span className="ml-2 text-red-600">
                              -{(item.discount * 100).toFixed(0)}% discount
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            €{item.subtotal.toFixed(2)}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Summary */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (20%):</span>
                  <span>€{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Loyalty Points:</span>
                  <span>+{loyaltyPoints} points</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Quick Actions & Products */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Category Tabs */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Buttons */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* POS Buttons */}
              {posButtons.map(button => (
                <Button
                  key={button.id}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-1 text-sm"
                  style={{ backgroundColor: button.color || undefined }}
                  onClick={() => {
                    try {
                      console.log('Button clicked:', button, 'Products:', products);
                      if (button.buttonType === 'product' && button.productId) {
                        const product = products.find(p => p.id === button.productId);
                        console.log('Found product:', product);
                        if (product) {
                          addToCart(product);
                          toast({
                            title: "Added to Cart",
                            description: `${product.name} added to cart`
                          });
                        } else {
                          toast({
                            title: "Product Not Found",
                            description: `Product with ID ${button.productId} not found`,
                            variant: "destructive"
                          });
                        }
                      }
                    } catch (error) {
                      console.error('Button click error:', error);
                      toast({
                        title: "Error",
                        description: "Button click failed",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <span className="font-medium">{button.label}</span>
                  {button.buttonType === 'product' && (
                    <span className="text-xs opacity-70">Quick Action</span>
                  )}
                </Button>
              ))}

              {/* Product Buttons */}
              {filteredProducts.slice(0, 12).map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-1 text-sm"
                  onClick={() => addToCart(product)}
                >
                  <span className="font-medium text-center leading-tight">
                    {product.name}
                  </span>
                  <span className="text-xs text-green-600 font-semibold">
                    €{parseFloat(product.price).toFixed(2)}
                  </span>
                  {product.stock !== null && product.stock < product.minStock && (
                    <Badge variant="destructive" className="text-xs">
                      Low Stock
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={holdTransaction} disabled={cart.length === 0}>
                <Pause className="w-4 h-4 mr-2" />
                Hold Sale
              </Button>
              <Button variant="outline" disabled={heldTransactions.length === 0}>
                <Play className="w-4 h-4 mr-2" />
                Recall ({heldTransactions.length})
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">
                <Percent className="w-4 h-4 mr-2" />
                Discount
              </Button>
              <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" />
                Void Sale
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Total: €{total.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCashPayment}
                  disabled={cart.length === 0 || createTransactionMutation.isPending}
                >
                  <Banknote className="w-6 h-6 mr-2" />
                  Cash Payment
                </Button>
                <Button 
                  className="h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCardPayment}
                  disabled={cart.length === 0 || createTransactionMutation.isPending}
                >
                  <CreditCard className="w-6 h-6 mr-2" />
                  Card Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Z-Read Modal */}
      {showEndOfDayModal && (
        <ZReadModal
          tillId={tillId}
          currentUser={currentUser}
          onClose={() => setShowEndOfDayModal(false)}
        />
      )}

      {/* Sales Report Modal */}
      {showSalesReportModal && (
        <SalesReportModal
          tillId={tillId}
          onClose={() => setShowSalesReportModal(false)}
        />
      )}

      {/* Bank Settlement Modal */}
      {showSettlementsModal && (
        <BankSettlementModal
          tillId={tillId}
          onClose={() => setShowSettlementsModal(false)}
        />
      )}

      {/* Returns Modal */}
      {showReturnsModal && (
        <ReturnsModal
          tillId={tillId}
          onClose={() => setShowReturnsModal(false)}
        />
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <InventoryModal
          products={products}
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {/* Customers Modal */}
      {showCustomersModal && (
        <CustomersModal
          onClose={() => setShowCustomersModal(false)}
        />
      )}

      {/* Cash Input Modal */}
      {showCashInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cash Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Amount: €{total.toFixed(2)}
                </label>
                <label className="block text-sm font-medium mb-2">
                  Cash Received:
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter cash amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="text-2xl h-14"
                  autoFocus
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashAmount(amount.toString())}
                    className="h-12 text-lg font-semibold"
                  >
                    €{amount}
                  </Button>
                ))}
              </div>
              
              {cashAmount && parseFloat(cashAmount) >= total && (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">
                    Change Due: €{(parseFloat(cashAmount) - total).toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowCashInput(false);
                    setCashAmount("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processCashPayment}
                  disabled={!cashAmount || parseFloat(cashAmount) < total}
                  className="flex-1"
                >
                  Complete Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction processing indicator */}
      {createTransactionMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Processing Transaction...</p>
            <p className="text-gray-600 dark:text-gray-400">Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Z-Read Modal Component
function ZReadModal({ tillId, currentUser, onClose }: { tillId: string; currentUser?: UserType; onClose: () => void }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [zReadData, setZReadData] = useState<any>(null);

  const generateZRead = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/reports/z-read', {
        method: 'POST',
        body: { tillId }
      });
      setZReadData(response);
      toast({
        title: "Z-Read Generated",
        description: "End of day report generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Z-read report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Z-Read Report</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!zReadData ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Generate End of Day Report</h3>
            <p className="text-gray-600 mb-4">Generate a comprehensive Z-read report for {tillId}</p>
            <Button onClick={generateZRead} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating...' : 'Generate Z-Read Report'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Report Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Till ID</p>
                  <p className="font-semibold">{zReadData.zRead.tillId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Report Date</p>
                  <p className="font-semibold">{new Date(zReadData.zRead.reportDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="font-semibold text-green-600">€{zReadData.zRead.totalSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction Count</p>
                  <p className="font-semibold">{zReadData.zRead.transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cash Sales</p>
                  <p className="font-semibold">€{zReadData.zRead.cashSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Card Sales</p>
                  <p className="font-semibold">€{zReadData.zRead.cardSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">VAT Total</p>
                  <p className="font-semibold">€{zReadData.zRead.totalVat.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Closing Float</p>
                  <p className="font-semibold">€{zReadData.zRead.closingFloat.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Bank Settlement Modal Component
function BankSettlementModal({ tillId, onClose }: { tillId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  const generateSettlement = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/reports/settlement', {
        method: 'POST',
        body: { tillId }
      });
      setSettlementData(response);
      toast({
        title: "Settlement Generated",
        description: "Bank settlement report generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate settlement report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Bank Settlement</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!settlementData ? (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Generate Settlement Report</h3>
            <p className="text-gray-600 mb-4">Generate bank settlement report for card transactions</p>
            <Button onClick={generateSettlement} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating...' : 'Generate Settlement'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Settlement Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Terminal ID</p>
                  <p className="font-semibold">{settlementData.terminalId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Merchant ID</p>
                  <p className="font-semibold">{settlementData.merchantId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Number</p>
                  <p className="font-semibold">{settlementData.batchNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction Count</p>
                  <p className="font-semibold">{settlementData.transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Card Sales</p>
                  <p className="font-semibold text-green-600">€{settlementData.totalCardSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Ticket</p>
                  <p className="font-semibold">€{settlementData.averageTicket.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Settlement
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export to Bank
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sales Report Modal Component
function SalesReportModal({ tillId, onClose }: { tillId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/reports/sales', tillId, dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/reports/sales?tillId=${tillId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      return response.json();
    },
    enabled: !!tillId
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sales Report</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading sales data...</p>
            </div>
          ) : salesData ? (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Sales Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="font-semibold text-green-600">€{salesData.summary.totalSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="font-semibold">{salesData.summary.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cash Sales</p>
                  <p className="font-semibold">€{salesData.summary.cashSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Card Sales</p>
                  <p className="font-semibold">€{salesData.summary.cardSales.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple modal components for other features
function ReturnsModal({ tillId, onClose }: { tillId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Returns Processing</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <RotateCcw className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Process Returns</h3>
          <p className="text-gray-600 mb-4">Scan receipt or enter transaction ID to process returns</p>
          <Input placeholder="Enter transaction ID or scan receipt" className="mb-4" />
          <Button className="w-full">Process Return</Button>
        </div>
      </div>
    </div>
  );
}

function InventoryModal({ products, onClose }: { products: any[]; onClose: () => void }) {
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Inventory Status</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Low Stock Alert</h3>
            <p className="text-sm text-red-600 dark:text-red-300">{lowStockProducts.length} products below minimum stock level</p>
          </div>
          
          <div className="space-y-2">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">Stock: {product.stock} / Min: {product.minStock}</p>
                </div>
                <Badge variant="destructive">Low Stock</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Customer Database</h3>
          <p className="text-gray-600 mb-4">Search customers, view loyalty points, and manage accounts</p>
          <Input placeholder="Search customers..." className="mb-4" />
          <Button className="w-full">Search Customers</Button>
        </div>
      </div>
    </div>
  );
}