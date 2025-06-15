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
    <div className="h-screen bg-gray-100 text-black overflow-hidden">
      {/* Hidden input for barcode scanning */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Simple Header */}
      <div className="bg-blue-600 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={onBackToMenu} 
            className="bg-red-500 hover:bg-red-600 text-white border-0 px-6 py-2 text-sm font-bold rounded"
          >
            Exit
          </Button>
          <div className="text-white text-xl font-bold">
            Till {tillId} - Operator: Connor
          </div>
        </div>
        <div className="text-white text-right">
          <div className="text-sm">15/06/2025 09:12:27</div>
        </div>
      </div>

      <div className="h-[calc(100vh-72px)] flex">
        {/* Left Section - Transaction Area */}
        <div className="w-2/5 bg-white border-r-2 border-gray-300 p-4">
          {/* Transaction Header */}
          <div className="bg-gray-200 p-3 mb-4 rounded border">
            <div className="grid grid-cols-4 gap-2 text-sm font-bold text-center">
              <div>Quantity</div>
              <div>Description - Preset 1</div>
              <div>Unit Price €</div>
              <div>Price €</div>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="flex-1 bg-white border border-gray-300 p-2 mb-4 min-h-96">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No items scanned
              </div>
            ) : (
              <div className="space-y-1">
                {cart.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-4 gap-2 text-sm py-1 hover:bg-gray-100">
                    <div className="text-center">{item.quantity}</div>
                    <div className="truncate">{item.name}</div>
                    <div className="text-center">€{item.price.toFixed(2)}</div>
                    <div className="text-center font-bold">€{item.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="space-y-2">
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-6 text-lg">
                ↑
              </Button>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg">
                +
              </Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-lg">
                -
              </Button>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-lg">
                ↓
              </Button>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={clearCart}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4"
              >
                X
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-4">
                Choose Customer
              </Button>
              <Button className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-4">
                Enquiry
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-4">
                Recall Sale
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-4">
                Mobile Topups
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-800 text-white p-4 rounded text-center">
            <div className="text-3xl font-bold">Item Total</div>
            <div className="text-6xl font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div className="text-xl">Sale Total €</div>
            <div className="text-4xl font-bold">€{transaction.total.toFixed(2)}</div>
          </div>
        </div>

        {/* Right Section - Product Categories */}
        <div className="flex-1 bg-white p-4">
          <div className="grid grid-cols-6 gap-2 h-full">
            {/* Category Buttons */}
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Misc') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              MISC
            </Button>
            <Button className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm">
              COMPLETE CUISINE
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Deli') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              DELI
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Vegetables') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              VEGETABLES
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Fruit') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              FRUIT
            </Button>
            <Button className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm">
              CHRISTMAS
            </Button>

            <Button className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm">
              STATIONARY
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Dairy') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              ICE CREAM
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Fuel') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              FUEL
            </Button>
            <Button className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm">
              MASS BOOKLETS
            </Button>
            <Button className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm">
              ORS
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Bakery') || filteredProducts[0])}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-sm"
            >
              Bakery
            </Button>

            {/* Individual Product Buttons */}
            {filteredProducts.map((product) => (
              <Button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs p-2 h-16 flex flex-col justify-center"
              >
                <div className="truncate">{product.name}</div>
                <div className="text-xs">€{parseFloat(product.price.toString()).toFixed(2)}</div>
              </Button>
            ))}

            {/* Right side buttons */}
            <div className="col-start-6 space-y-2">
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold text-xs py-2">
                Admin Menu
              </Button>
              <Button 
                onClick={() => setShowPayment(true)}
                disabled={cart.length === 0}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2"
              >
                Exit
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold text-xs py-2">
                Print Receipt
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold text-xs py-2">
                ID Prompt
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold text-xs py-2">
                Postpoint BillPay
              </Button>
              <Button className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold text-xs py-2">
                Codax
              </Button>
            </div>
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