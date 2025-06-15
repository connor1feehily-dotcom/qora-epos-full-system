import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import type { Product } from "@shared/schema";

interface SimplePOSProps {
  tillId: string;
  onBackToMenu: () => void;
}

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export function SimplePOS({ tillId, onBackToMenu }: SimplePOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<number | null>(null);
  const [priceAnimation, setPriceAnimation] = useState<number | null>(null);
  const [totalAnimation, setTotalAnimation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Clear and reseed database with one test product
  const clearAndSeedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/seed', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to seed database');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Database Reset",
        description: "System cleared and reseeded with test product",
      });
    }
  });

  // Process transaction
  const processTransactionMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const transaction = {
        tillId,
        total: calculateTotal(),
        paymentMethod,
        operatorId: 1,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction, items: transaction.items })
      });

      if (!response.ok) throw new Error('Transaction failed');
      return response.json();
    },
    onSuccess: () => {
      setCart([]);
      setShowPayment(false);
      toast({
        title: "Sale Complete",
        description: `Total: €${calculateTotal().toFixed(2)}`,
      });
    },
    onError: () => {
      toast({
        title: "Transaction Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  // Barcode scanning
  useEffect(() => {
    let scanBuffer = '';
    let scanTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPayment) return;

      if (e.key.length === 1 || e.key === 'Enter') {
        clearTimeout(scanTimeout);
        
        if (e.key === 'Enter') {
          if (scanBuffer.length >= 6) {
            const product = products.find(p => p.barcode === scanBuffer.trim());
            if (product) {
              addToCart(product);
            }
          }
          scanBuffer = '';
        } else {
          scanBuffer += e.key;
          scanTimeout = setTimeout(() => scanBuffer = '', 200);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(scanTimeout);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, showPayment]);

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.productId === product.id);
    
    // Trigger price animation
    setPriceAnimation(product.id);
    setTimeout(() => setPriceAnimation(null), 600);
    
    // Trigger total animation
    setTotalAnimation(true);
    setTimeout(() => setTotalAnimation(false), 800);
    
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      updatedCart[existingIndex].total = updatedCart[existingIndex].quantity * updatedCart[existingIndex].price;
      setCart(updatedCart);
      
      // Highlight the updated item in cart
      setHighlightedItem(updatedCart[existingIndex].id);
      setTimeout(() => setHighlightedItem(null), 1000);
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        total: Number(product.price)
      };
      setCart([...cart, newItem]);
      
      // Highlight the new item in cart
      setHighlightedItem(newItem.id);
      setTimeout(() => setHighlightedItem(null), 1000);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    // Highlight the item being updated
    setHighlightedItem(id);
    setTimeout(() => setHighlightedItem(null), 800);
    
    // Trigger total animation
    setTotalAnimation(true);
    setTimeout(() => setTotalAnimation(false), 800);
    
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          if (newQuantity === 0) return null;
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.price
          };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateVAT = () => {
    const total = calculateTotal();
    return total * 0.23 / 1.23;
  };

  const clearCart = () => {
    setCart([]);
  };

  // Clear database on component mount
  useEffect(() => {
    clearAndSeedMutation.mutate();
  }, []);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">KERRIGAN'S XL POS</h1>
          <div className="flex gap-4">
            <span className="text-lg">Till: {tillId}</span>
            <Button 
              onClick={onBackToMenu}
              className="bg-white text-cyan-600 hover:bg-gray-100"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Products Section */}
        <div className="w-1/2 p-4 border-r">
          <h2 className="text-xl font-bold mb-4">Products</h2>
          <div className="grid grid-cols-2 gap-4">
            {products.map(product => (
              <Card key={product.id} className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${
                priceAnimation === product.id ? 'scale-105 shadow-xl ring-4 ring-emerald-400' : ''
              }`}>
                <CardContent 
                  className="p-4 text-center"
                  onClick={() => addToCart(product)}
                >
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className={`text-2xl font-bold transition-all duration-300 ${
                    priceAnimation === product.id 
                      ? 'text-emerald-500 scale-110 animate-pulse' 
                      : 'text-cyan-600'
                  }`}>
                    €{Number(product.price).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center p-8">
              <p className="text-gray-500">Loading products...</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Sale</h2>
            <Button 
              onClick={clearCart}
              variant="outline"
              className="text-red-600 border-red-600"
            >
              Clear All
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Scan items or click products to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <Card key={item.id} className={`transition-all duration-500 ${
                    highlightedItem === item.id ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-400 shadow-lg scale-102' : ''
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-500">
                            €{item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className={`w-20 text-right font-bold transition-all duration-500 ${
                          highlightedItem === item.id ? 'text-emerald-600 scale-110' : 'text-gray-900'
                        }`}>
                          €{item.total.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div className={`border-t pt-4 mt-4 transition-all duration-500 ${
              totalAnimation ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-4 shadow-lg' : ''
            }`}>
              <div className="space-y-2">
                <div className={`flex justify-between text-lg transition-all duration-300 ${
                  totalAnimation ? 'scale-105' : ''
                }`}>
                  <span>Subtotal:</span>
                  <span className={totalAnimation ? 'text-emerald-600 font-bold' : ''}>
                    €{(calculateTotal() - calculateVAT()).toFixed(2)}
                  </span>
                </div>
                <div className={`flex justify-between text-lg transition-all duration-300 ${
                  totalAnimation ? 'scale-105' : ''
                }`}>
                  <span>VAT (23%):</span>
                  <span className={totalAnimation ? 'text-emerald-600 font-bold' : ''}>
                    €{calculateVAT().toFixed(2)}
                  </span>
                </div>
                <div className={`flex justify-between text-2xl font-bold border-t pt-2 transition-all duration-500 ${
                  totalAnimation ? 'scale-110 border-emerald-400' : ''
                }`}>
                  <span>TOTAL:</span>
                  <span className={`transition-all duration-500 ${
                    totalAnimation 
                      ? 'text-emerald-500 animate-pulse scale-110' 
                      : 'text-cyan-600'
                  }`}>
                    €{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button
                  onClick={() => processTransactionMutation.mutate('CASH')}
                  className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg"
                  disabled={processTransactionMutation.isPending}
                >
                  <Banknote className="h-6 w-6 mr-2" />
                  CASH
                </Button>
                <Button
                  onClick={() => processTransactionMutation.mutate('CARD')}
                  className="h-16 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg"
                  disabled={processTransactionMutation.isPending}
                >
                  <CreditCard className="h-6 w-6 mr-2" />
                  CARD
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Instructions */}
      <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">
        Scan barcodes or click products to add items • Test barcode: 1234567890123
      </div>
    </div>
  );
}