import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Brain, 
  Scan, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Eye, 
  Sparkles,
  Cpu,
  Fingerprint,
  Shield,
  Wifi,
  Battery,
  Volume2,
  Camera,
  Mic
} from "lucide-react";
import kerrigansLogo from "@assets/NEW_1749822871411.png";
import type { Product, Customer } from "@shared/schema";
import type { CartItem, TransactionSummary } from "@/lib/types";

interface RevolutionaryPOSProps {
  tillId: string;
  onBackToMenu: () => void;
}

export function RevolutionaryPOS({ tillId, onBackToMenu }: RevolutionaryPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<HTMLDivElement>(null);

  // AI-powered product recommendations
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  
  // Voice recognition simulation
  const [isListening, setIsListening] = useState(false);
  
  // Neural network-powered analytics
  const [realTimeAnalytics, setRealTimeAnalytics] = useState({
    customerSatisfaction: 98.5,
    predictedSpend: 0,
    loyaltyBonus: 0,
    carbonFootprint: 0
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // AI-powered product analysis
  useEffect(() => {
    if (cart.length > 0) {
      // Simulate AI recommendations based on cart contents
      const categories = Array.from(new Set(cart.map(item => item.category)));
      const recommended = products.filter(p => 
        categories.includes(p.category) && 
        !cart.find(c => c.productId === p.id)
      ).slice(0, 3);
      setAiRecommendations(recommended);

      // Update real-time analytics
      const total = cart.reduce((sum, item) => sum + item.total, 0);
      setRealTimeAnalytics(prev => ({
        ...prev,
        predictedSpend: total * 1.15, // AI prediction
        loyaltyBonus: Math.floor(total * 0.02),
        carbonFootprint: cart.length * 0.1
      }));
    }
  }, [cart, products]);

  // Revolutionary barcode scanner with AI
  const handleAIBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast({
        title: "🚀 Quantum Scan Complete!",
        description: `${product.name} added via neural recognition`,
      });
    }
  };

  // Voice command processing
  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
    if (!voiceMode) {
      setIsListening(true);
      toast({
        title: "🎤 Voice Commander Active",
        description: "AI listening for voice commands...",
      });
      // Simulate voice commands
      setTimeout(() => {
        setIsListening(false);
        toast({
          title: "🧠 Voice Processed",
          description: "Command recognized and executed",
        });
      }, 3000);
    }
  };

  // Biometric authentication simulation
  const toggleBiometricAuth = () => {
    setBiometricAuth(!biometricAuth);
    toast({
      title: biometricAuth ? "🔓 Biometric Disabled" : "🔒 Biometric Enabled",
      description: biometricAuth ? "Standard auth mode" : "Fingerprint scanner active",
    });
  };

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
          id: Date.now(),
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          total: parseFloat(product.price),
          category: product.category
        };
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
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

  const calculateTransaction = (): TransactionSummary => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * 0.23;
    const total = subtotal + vatAmount;
    return {
      items: cart,
      subtotal,
      vatAmount,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  const transaction = calculateTransaction();

  return (
    <div className="min-h-screen kxl-neural-bg">
      {/* Revolutionary Header */}
      <div className="kxl-glass border-b border-primary/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBackToMenu}
              className="kxl-quantum-button text-white font-bold px-6 py-3 rounded-xl shadow-lg"
            >
              ← Main Menu
            </Button>
            <img 
              src={kerrigansLogo} 
              alt="Kerrigan's XL"
              className="h-12 w-auto kxl-float"
            />
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              QUANTUM POS™ - {tillId.toUpperCase()}
            </div>
          </div>
          
          {/* AI Status Panel */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setAiMode(!aiMode)}
              variant={aiMode ? "default" : "outline"}
              size="sm"
              className={aiMode ? "kxl-glow" : ""}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI {aiMode ? "ON" : "OFF"}
            </Button>
            <Button
              onClick={toggleVoiceMode}
              variant={voiceMode ? "default" : "outline"}
              size="sm"
              className={isListening ? "kxl-pulse" : ""}
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </Button>
            <Button
              onClick={toggleBiometricAuth}
              variant={biometricAuth ? "default" : "outline"}
              size="sm"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Bio
            </Button>
            <div className="flex items-center space-x-1 text-sm">
              <Wifi className="h-4 w-4 text-green-500" />
              <Battery className="h-4 w-4 text-green-500" />
              <Shield className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>
        
        {/* Licensed to text */}
        <div className="text-center text-xs text-muted-foreground mt-2 opacity-70">
          Licensed to Kerrigan's XL from The Feehily Boyle Group | Powered by Quantum Commerce AI™
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Revolutionary Product Grid */}
        <div className="flex-1 p-6 space-y-6">
          {/* AI Scanner */}
          <Card className="kxl-glass kxl-ai-border relative overflow-hidden">
            <div className="kxl-scanner-line"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="h-6 w-6 mr-2 text-primary" />
                Neural Barcode Scanner
                {scannerActive && <div className="ml-2 kxl-glow w-3 h-3 rounded-full bg-primary"></div>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  placeholder="Scan or type barcode..."
                  className="flex-1 text-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAIBarcodeScan(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  onClick={() => setScannerActive(!scannerActive)}
                  className={`kxl-quantum-button ${scannerActive ? 'kxl-pulse' : ''}`}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {scannerActive ? 'Stop Scan' : 'Start Scan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {aiMode && aiRecommendations.length > 0 && (
            <Card className="kxl-glass kxl-neural-pulse">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-primary" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {aiRecommendations.map(product => (
                    <Button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="kxl-product-card h-20 flex flex-col p-2"
                    >
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">€{product.price}</div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revolutionary Product Grid */}
          <Card className="kxl-glass flex-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="h-6 w-6 mr-2 text-primary" />
                Quantum Product Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] overflow-y-auto custom-scroll">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <Button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    variant="outline"
                    className={`kxl-product-card h-32 flex flex-col justify-between p-4 kxl-slide-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.category}</div>
                    </div>
                    <div className="text-xl font-bold text-primary">€{product.price}</div>
                    {product.stock <= 5 && (
                      <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quantum Transaction Panel */}
        <div className="w-96 p-6 space-y-4">
          {/* Real-time Analytics */}
          {aiMode && (
            <Card className="kxl-glass kxl-hologram">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Neural Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Satisfaction:</span>
                  <span className="text-green-500">{realTimeAnalytics.customerSatisfaction}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Spend:</span>
                  <span className="text-primary">€{realTimeAnalytics.predictedSpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loyalty Bonus:</span>
                  <span className="text-secondary">€{realTimeAnalytics.loyaltyBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon Impact:</span>
                  <span className="text-green-600">{realTimeAnalytics.carbonFootprint.toFixed(1)}kg CO₂</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Cart */}
          <Card className="kxl-glass kxl-ai-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-6 w-6 mr-2" />
                  Quantum Cart
                </div>
                <Badge variant="secondary" className="kxl-glow">
                  {transaction.itemCount} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-60 overflow-y-auto custom-scroll">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Ready for quantum commerce</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border kxl-slide-in">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        €{item.price} x {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <div className="font-bold text-primary min-w-[60px] text-right">
                        €{item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card className="kxl-glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>€{transaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (23%):</span>
                <span>€{transaction.vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">€{transaction.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantum Payment Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full kxl-quantum-button text-white py-4 text-lg font-bold"
              disabled={cart.length === 0}
            >
              <CreditCard className="h-6 w-6 mr-2" />
              Quantum Card Payment
            </Button>
            <Button 
              variant="secondary"
              className="w-full py-4 text-lg font-bold"
              disabled={cart.length === 0}
            >
              <Banknote className="h-6 w-6 mr-2" />
              Neural Cash Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}