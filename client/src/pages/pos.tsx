import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/product-grid";
import { TransactionPanel } from "@/components/transaction-panel";
import { PaymentModal } from "@/components/payment-modal";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ReceiptPrinter } from "@/components/receipt-printer";
import { Search, Barcode, Keyboard, Settings, Monitor } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, Customer } from "@shared/schema";
import type { CartItem, TransactionSummary } from "@/lib/types";

const categories = ['All Items', 'Fuel', 'Convenience', 'Tobacco', 'Drinks', 'Food', 'Hot Drinks', 'News'];

interface POSProps {
  tillId: string;
}

export default function POS({ tillId }: POSProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [tillBalance] = useState(1247.50);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [receiptPrinterOpen, setReceiptPrinterOpen] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<number>(0);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<TransactionSummary | null>(null);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch customers (for customer selection)
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Get default customer
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers.find(c => c.name === 'Walk-in Customer') || customers[0]);
    }
  }, [customers, selectedCustomer]);

  // Process transaction mutation
  const processTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/transactions', data);
    },
    onSuccess: (response: any) => {
      const data = response?.data || response;
      toast({
        title: "Payment Processed",
        description: "Transaction completed successfully",
      });
      
      // Store transaction details for receipt
      setLastTransactionId(data?.id || Date.now());
      setLastCompletedTransaction(transaction);
      
      // Clear cart and open receipt printer
      setCart([]);
      setPaymentModalOpen(false);
      setReceiptPrinterOpen(true);
      
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment",
        variant: "destructive",
      });
    },
  });

  // Calculate transaction summary
  const calculateTransaction = (): TransactionSummary => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const vatRate = product ? parseFloat(product.vatRate.toString()) / 100 : 0;
      return sum + (item.total * vatRate / (1 + vatRate));
    }, 0);
    
    return {
      items: cart,
      subtotal: subtotal - vatAmount,
      vatAmount,
      total: subtotal,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const transaction = calculateTransaction();

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: Date.now(), // Simple ID generation for demo
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price.toString()),
          quantity: 1,
          total: parseFloat(product.price.toString()),
          category: product.category,
        };
        return [...prevCart, newItem];
      }
    });

    toast({
      title: "Item Added",
      description: `${product.name} added to cart`,
    });
  };

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  // Update item quantity
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // Clear transaction
  const clearTransaction = () => {
    setCart([]);
    toast({
      title: "Transaction Cleared",
      description: "All items removed from cart",
    });
  };

  // Process payment
  const processPayment = (method: 'card' | 'cash') => {
    setPaymentMethod(method);
    setPaymentModalOpen(true);
  };

  // Complete payment
  const completePayment = (method: string, amount?: number) => {
    const transactionData = {
      transaction: {
        customerId: selectedCustomer?.id || null,
        userId: 1, // Default user ID
        tillId: tillId,
        subtotal: transaction.subtotal.toFixed(2),
        vatAmount: transaction.vatAmount.toFixed(2),
        total: transaction.total.toFixed(2),
        paymentMethod: method,
        status: 'completed',
      },
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price.toFixed(2),
        total: item.total.toFixed(2),
      })),
    };

    processTransactionMutation.mutate(transactionData);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery));
    
    const matchesCategory = selectedCategory === 'All Items' || 
      product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (productsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {tillId === 'till1' ? 'Till 1' : 'Till 2'} POS
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Kerrigans XL Manorhamilton</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Till Active</span>
            </div>
            <div className="text-right bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Till Balance</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">€{tillBalance.toFixed(2)}</p>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-white/50 dark:hover:bg-slate-800/50">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main POS Interface */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          {/* Search & Quick Actions */}
          <div className="bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products, scan barcode, or enter product code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button 
                onClick={() => setBarcodeScannerOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Barcode className="w-5 h-5 mr-2" />
                Scan
              </Button>
              <Button 
                variant="outline"
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3 rounded-xl transition-all duration-200"
              >
                <Keyboard className="w-5 h-5 mr-2" />
                Manual
              </Button>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white/40 dark:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  size="sm"
                  className={`flex-shrink-0 px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scroll">
            <ProductGrid
              products={filteredProducts}
              selectedCategory={selectedCategory}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Transaction Panel */}
        <div className="w-96 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/50">
          <TransactionPanel
            transaction={transaction}
            customer={selectedCustomer}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearTransaction={clearTransaction}
            onSelectCustomer={() => {
              // TODO: Implement customer selection modal
              toast({
                title: "Customer Selection",
                description: "Customer selection modal not implemented yet",
              });
            }}
            onProcessPayment={processPayment}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onComplete={completePayment}
        total={transaction.total}
        initialMethod={paymentMethod}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Receipt Printer Modal */}
      {lastCompletedTransaction && (
        <ReceiptPrinter
          isOpen={receiptPrinterOpen}
          onClose={() => {
            setReceiptPrinterOpen(false);
            setLastCompletedTransaction(null);
          }}
          transaction={lastCompletedTransaction}
          customer={selectedCustomer}
          tillId={tillId}
          paymentMethod={paymentMethod}
          transactionId={lastTransactionId}
        />
      )}
    </div>
  );
}
