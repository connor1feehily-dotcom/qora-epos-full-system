import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  // Admin Menu States
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showCashOperations, setShowCashOperations] = useState(false);
  const [showTransactionJournal, setShowTransactionJournal] = useState(false);
  const [showRefundsReturns, setShowRefundsReturns] = useState(false);
  const [showCustomerAccounts, setShowCustomerAccounts] = useState(false);
  const [showStockOperations, setShowStockOperations] = useState(false);
  const [showAdminOptions1, setShowAdminOptions1] = useState(false);
  const [showAdminOptions2, setShowAdminOptions2] = useState(false);
  const [showTillOperations, setShowTillOperations] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showCashDrawer, setShowCashDrawer] = useState(false);
  const [showNoSale, setShowNoSale] = useState(false);
  const [showCashPaidOut, setShowCashPaidOut] = useState(false);
  const [showAddToFloat, setShowAddToFloat] = useState(false);
  
  // Till session data
  const [tillSession, setTillSession] = useState<any>(null);
  const [cashInDrawer, setCashInDrawer] = useState(0);
  const [openingFloat, setOpeningFloat] = useState(0);
  
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

  // Till Management Functions
  const handleZRead = async () => {
    try {
      const response = await fetch('/api/reports/z-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tillId, generatedBy: 1 })
      });
      
      if (response.ok) {
        const report = await response.json();
        toast({
          title: "Z-Read Generated",
          description: `Daily sales: €${report.totalSales.toFixed(2)} | Transactions: ${report.transactionCount}`,
        });
        setShowTillOperations(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Z-Read",
        variant: "destructive",
      });
    }
  };

  const handleXRead = async () => {
    try {
      const response = await fetch('/api/reports/x-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tillId, generatedBy: 1 })
      });
      
      if (response.ok) {
        const report = await response.json();
        toast({
          title: "X-Read Generated",
          description: `Current sales: €${report.totalSales.toFixed(2)} | Transactions: ${report.transactionCount}`,
        });
        setShowTillOperations(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate X-Read",
        variant: "destructive",
      });
    }
  };

  const handleReprintZRead = async () => {
    try {
      const response = await fetch(`/api/reports/last-z-read/${tillId}`);
      if (response.ok) {
        const report = await response.json();
        toast({
          title: "Z-Read Reprinted",
          description: `Last Z-Read: €${report.totalSales.toFixed(2)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No previous Z-Read found",
        variant: "destructive",
      });
    }
  };

  const handleNoSale = () => {
    toast({
      title: "No Sale",
      description: "Cash drawer opened",
    });
    setShowNoSale(false);
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

      {/* Clean Header */}
      <div className="bg-cyan-600 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={onBackToMenu} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-6 py-2 text-sm font-bold rounded"
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
              <Button className="w-full bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-6 text-lg">
                ↑
              </Button>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 text-lg">
                +
              </Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-lg">
                -
              </Button>
              <Button className="w-full bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-6 text-lg">
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
              <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-4">
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

          {/* Total and Payment */}
          <div className="space-y-4">
            <div className="bg-cyan-600 text-white p-4 rounded text-center">
              <div className="text-2xl font-bold">Item Total</div>
              <div className="text-5xl font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
              <div className="text-lg">Sale Total €</div>
              <div className="text-3xl font-bold">€{transaction.total.toFixed(2)}</div>
            </div>
            
            {/* Payment Button */}
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-6 text-xl"
            >
              {cart.length === 0 ? 'Add Items to Cart' : 'Complete Sale'}
            </Button>
          </div>
        </div>

        {/* Right Section - Product Categories */}
        <div className="flex-1 bg-white p-4">
          <div className="grid grid-cols-6 gap-2 h-full">
            {/* Category Buttons */}
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Misc') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              MISC
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm">
              COMPLETE CUISINE
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Deli') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              DELI
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Vegetables') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              VEGETABLES
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Fruit') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              FRUIT
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm">
              CHRISTMAS
            </Button>

            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm">
              STATIONARY
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Dairy') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              ICE CREAM
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Fuel') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
            >
              FUEL
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm">
              MASS BOOKLETS
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm">
              ORS
            </Button>
            <Button 
              onClick={() => addToCart(filteredProducts.find(p => p.category === 'Bakery') || filteredProducts[0])}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm"
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
              <Button 
                onClick={() => setShowAdminMenu(true)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs py-2 border border-gray-400"
              >
                Admin Menu
              </Button>
              <Button 
                onClick={() => setShowPayment(true)}
                disabled={cart.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-bold text-xs py-2"
              >
                Complete Sale
              </Button>
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs py-2 border border-gray-400">
                Print Receipt
              </Button>
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs py-2 border border-gray-400">
                ID Prompt
              </Button>
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs py-2 border border-gray-400">
                Postpoint BillPay
              </Button>
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs py-2 border border-gray-400">
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

      {/* Main Admin Menu */}
      <Dialog open={showAdminMenu} onOpenChange={setShowAdminMenu}>
        <DialogContent className="max-w-2xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Admin Menu</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowCashOperations(true);
              }}
              className="h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg"
            >
              Cash Operations
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowTransactionJournal(true);
              }}
              className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
            >
              Transaction Journal
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowRefundsReturns(true);
              }}
              className="h-20 bg-red-500 hover:bg-red-600 text-white font-bold text-lg"
            >
              Refunds / Returns
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowCustomerAccounts(true);
              }}
              className="h-20 bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg"
            >
              Customer Accounts
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowStockOperations(true);
              }}
              className="h-20 bg-cyan-400 hover:bg-cyan-500 text-white font-bold text-lg"
            >
              Stock Operations
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowAdminOptions1(true);
              }}
              className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
            >
              Admin Options 1
            </Button>
            <Button 
              onClick={() => {
                setShowAdminMenu(false);
                setShowAdminOptions2(true);
              }}
              className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
            >
              Admin Options 2
            </Button>
            <Button 
              onClick={() => setShowAdminMenu(false)}
              className="h-20 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Operations Menu */}
      <Dialog open={showCashOperations} onOpenChange={setShowCashOperations}>
        <DialogContent className="max-w-2xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Cash Operations</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <Button 
              onClick={() => {
                setShowCashOperations(false);
                setShowNoSale(true);
              }}
              className="h-20 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-lg"
            >
              No Sale/Change
            </Button>
            <Button 
              onClick={() => {
                setShowCashOperations(false);
                setShowCashPaidOut(true);
              }}
              className="h-20 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-lg"
            >
              Cash Paid Out
            </Button>
            <Button 
              onClick={() => {
                setShowCashOperations(false);
                setShowCashDrawer(true);
              }}
              className="h-20 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-lg"
            >
              Till/Operator Uplift
            </Button>
            <Button 
              onClick={() => {
                setShowCashOperations(false);
                setShowAddToFloat(true);
              }}
              className="h-20 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-lg"
            >
              Add to Float
            </Button>
            <Button className="h-20 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-lg">
              Cash a Cheque
            </Button>
            <Button 
              onClick={() => setShowCashOperations(false)}
              className="h-20 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Till Operations Menu */}
      <Dialog open={showTillOperations} onOpenChange={setShowTillOperations}>
        <DialogContent className="max-w-2xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Till Operations</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <Button 
              onClick={() => handleZRead()}
              className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
            >
              Till Z-Read Reset
            </Button>
            <Button 
              onClick={() => handleXRead()}
              className="h-20 bg-cyan-400 hover:bg-cyan-500 text-white font-bold text-lg"
            >
              Till X-Read
            </Button>
            <Button className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg">
              Mobile TopUps End of Day
            </Button>
            <Button 
              onClick={() => handleReprintZRead()}
              className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
            >
              Re-Print Z-Read
            </Button>
            <Button 
              onClick={() => setShowTillOperations(false)}
              className="h-20 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg"
            >
              ← Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Options 1 Menu */}
      <Dialog open={showAdminOptions1} onOpenChange={setShowAdminOptions1}>
        <DialogContent className="max-w-2xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Admin Options 1</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <Button className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
              Touch Screen Config
            </Button>
            <Button className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
              EFT Control Panel
            </Button>
            <Button className="h-20 bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg">
              Cigs Vending Setup
            </Button>
            <Button className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
              Test Customer Display
            </Button>
            <Button className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
              Zapper Refund
            </Button>
            <Button 
              onClick={() => setShowAdminOptions1(false)}
              className="h-20 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Journal */}
      <Dialog open={showTransactionJournal} onOpenChange={setShowTransactionJournal}>
        <DialogContent className="max-w-4xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Transaction Journal</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="bg-white p-4 rounded border mb-4">
              <p className="text-center text-gray-600">Transaction history will be displayed here</p>
            </div>
            <Button 
              onClick={() => setShowTransactionJournal(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refunds / Returns */}
      <Dialog open={showRefundsReturns} onOpenChange={setShowRefundsReturns}>
        <DialogContent className="max-w-4xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Refunds / Returns</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="bg-white p-4 rounded border mb-4">
              <p className="text-center text-gray-600">Refund and return processing interface</p>
            </div>
            <Button 
              onClick={() => setShowRefundsReturns(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Accounts */}
      <Dialog open={showCustomerAccounts} onOpenChange={setShowCustomerAccounts}>
        <DialogContent className="max-w-4xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Customer Accounts</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="bg-white p-4 rounded border mb-4">
              <p className="text-center text-gray-600">Customer account management interface</p>
            </div>
            <Button 
              onClick={() => setShowCustomerAccounts(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Operations */}
      <Dialog open={showStockOperations} onOpenChange={setShowStockOperations}>
        <DialogContent className="max-w-4xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Stock Operations</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="bg-white p-4 rounded border mb-4">
              <p className="text-center text-gray-600">Stock management and inventory operations</p>
            </div>
            <Button 
              onClick={() => setShowStockOperations(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Options 2 */}
      <Dialog open={showAdminOptions2} onOpenChange={setShowAdminOptions2}>
        <DialogContent className="max-w-2xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Admin Options 2</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <Button 
              onClick={() => {
                setShowAdminOptions2(false);
                setShowTillOperations(true);
              }}
              className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
            >
              Till Operations
            </Button>
            <Button className="h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg">
              System Settings
            </Button>
            <Button 
              onClick={() => {
                setShowAdminOptions2(false);
                setShowReports(true);
              }}
              className="h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg"
            >
              Reports
            </Button>
            <Button 
              onClick={() => setShowAdminOptions2(false)}
              className="h-20 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Sale Dialog */}
      <Dialog open={showNoSale} onOpenChange={setShowNoSale}>
        <DialogContent className="max-w-md bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-cyan-700">No Sale</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="mb-4">Open cash drawer without recording a sale?</p>
            <div className="flex gap-4">
              <Button 
                onClick={handleNoSale}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Open Drawer
              </Button>
              <Button 
                onClick={() => setShowNoSale(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Paid Out Dialog */}
      <Dialog open={showCashPaidOut} onOpenChange={setShowCashPaidOut}>
        <DialogContent className="max-w-md bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-cyan-700">Cash Paid Out</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount (€)"
                className="text-lg p-3"
              />
              <Input
                type="text"
                placeholder="Reason for cash out"
                className="text-lg p-3"
              />
              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowCashPaidOut(false)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  Confirm
                </Button>
                <Button 
                  onClick={() => setShowCashPaidOut(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Float Dialog */}
      <Dialog open={showAddToFloat} onOpenChange={setShowAddToFloat}>
        <DialogContent className="max-w-md bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-cyan-700">Add to Float</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount to add (€)"
                className="text-lg p-3"
              />
              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowAddToFloat(false)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  Add to Float
                </Button>
                <Button 
                  onClick={() => setShowAddToFloat(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Drawer Status Dialog */}
      <Dialog open={showCashDrawer} onOpenChange={setShowCashDrawer}>
        <DialogContent className="max-w-lg bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-cyan-700">Cash Drawer Management</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-bold text-lg mb-2">Current Till Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Opening Float: €{openingFloat.toFixed(2)}</div>
                  <div>Current Cash: €{cashInDrawer.toFixed(2)}</div>
                  <div>Till ID: {tillId}</div>
                  <div>Operator: Connor</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3">
                  Count Cash
                </Button>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3">
                  Reconcile Till
                </Button>
                <Button 
                  onClick={() => setShowCashDrawer(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3"
                >
                  Close
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3">
                  Emergency Open
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={showReports} onOpenChange={setShowReports}>
        <DialogContent className="max-w-4xl bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-cyan-700">Till Reports & Analytics</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Button 
                onClick={handleXRead}
                className="h-20 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
              >
                X-Read (No Reset)
              </Button>
              <Button 
                onClick={handleZRead}
                className="h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg"
              >
                Z-Read (End of Day)
              </Button>
              <Button 
                onClick={handleReprintZRead}
                className="h-20 bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg"
              >
                Reprint Last Z-Read
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded border mb-4">
              <h3 className="font-bold text-lg mb-2">Today's Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Sales Today: €0.00</div>
                <div>Transactions: 0</div>
                <div>Returns: €0.00</div>
                <div>Cash Paid Out: €0.00</div>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowReports(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold"
            >
              Close Reports
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}