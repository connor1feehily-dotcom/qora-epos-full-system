import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/product-grid";
import { TransactionPanel } from "@/components/transaction-panel";
import { PaymentModal } from "@/components/payment-modal";
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
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Transaction completed successfully",
      });
      setCart([]);
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {tillId === 'till1' ? 'Till 1' : 'Till 2'} - Point of Sale
                </h2>
                <p className="text-sm text-gray-600">Process customer transactions and manage sales</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-success/10 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm font-medium text-success">Till Open</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Till Balance</p>
              <p className="text-lg font-semibold text-gray-900">€{tillBalance.toFixed(2)}</p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main POS Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col">
          {/* Search & Quick Actions */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Barcode className="w-4 h-4 mr-2" />
                Scan
              </Button>
              <Button variant="outline">
                <Keyboard className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <ProductGrid
              products={filteredProducts}
              selectedCategory={selectedCategory}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Transaction Panel */}
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onComplete={completePayment}
        total={transaction.total}
        initialMethod={paymentMethod}
      />
    </div>
  );
}
