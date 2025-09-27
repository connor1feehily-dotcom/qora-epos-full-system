import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, Key, Plus } from 'lucide-react';
import EasyShopSetup from './easy-shop-setup';

interface TillSession {
  tillCode: string;
  shopName: string;
  businessType: string;
  setupDate: string;
  isActive: boolean;
}

interface SimpleTillAuthProps {
  onLogin: (session: TillSession) => void;
}

export default function SimpleTillAuth({ onLogin }: SimpleTillAuthProps) {
  const [tillCode, setTillCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  // Pre-configured till codes - super easy setup!
  const TILL_CODES = {
    '1001': { shopName: "Kerrigan's XL", businessType: 'offlicense' },
    '1002': { shopName: "The Crown Pub", businessType: 'pub' },
    '1003': { shopName: "City Coffee", businessType: 'cafe' },
    '1004': { shopName: "Murphy's Garage", businessType: 'garage' },
    '1005': { shopName: "Fresh Daily Bakery", businessType: 'bakery' },
    '1006': { shopName: "Beauty Salon", businessType: 'salon' },
    '1007': { shopName: "Hardware Store", businessType: 'hardware' },
    '1008': { shopName: "Restaurant", businessType: 'restaurant' },
    '1009': { shopName: "Pharmacy", businessType: 'pharmacy' },
    '1010': { shopName: "Wholesaler", businessType: 'wholesaler' },
    
    // Easy setup codes for new shops
    '2001': { shopName: "New Shop 1", businessType: 'retail' },
    '2002': { shopName: "New Shop 2", businessType: 'retail' },
    '2003': { shopName: "New Shop 3", businessType: 'retail' },
    '2004': { shopName: "New Shop 4", businessType: 'retail' },
    '2005': { shopName: "New Shop 5", businessType: 'retail' },
    
    // Master admin code
    '9999': { shopName: "Platform Admin", businessType: 'admin' }
  };

  // Check for existing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem('quantum_till_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Auto-login with saved session - NEVER expires!
        onLogin(session);
      } catch (error) {
        console.error('Error loading saved session:', error);
      }
    }
  }, [onLogin]);

  const handleLogin = async () => {
    if (tillCode.length !== 4) {
      setError('Till code must be 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate quick check
    await new Promise(resolve => setTimeout(resolve, 500));

    const shopInfo = TILL_CODES[tillCode as keyof typeof TILL_CODES];
    
    if (!shopInfo) {
      setError('Invalid till code. Try 1001, 1002, 1003, etc.');
      setIsLoading(false);
      return;
    }

    // Create permanent session
    const session: TillSession = {
      tillCode,
      shopName: shopInfo.shopName,
      businessType: shopInfo.businessType,
      setupDate: new Date().toISOString(),
      isActive: true
    };

    // Save forever in localStorage - MULTIPLE backup locations!
    localStorage.setItem('quantum_till_session', JSON.stringify(session));
    localStorage.setItem('quantum_auto_login', 'true');
    localStorage.setItem('quantum_backup_session', JSON.stringify(session));
    localStorage.setItem(`quantum_till_${tillCode}`, JSON.stringify(session));
    
    // Also save in sessionStorage as backup
    sessionStorage.setItem('quantum_till_session', JSON.stringify(session));
    
    console.log('🔐 PERMANENT LOGIN - Session saved to 5 locations, NEVER expires!');
    
    setIsLoading(false);
    onLogin(session);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleSetupComplete = (shopData: any) => {
    // Auto-login with the new shop setup
    const session: TillSession = {
      tillCode: shopData.tillCode,
      shopName: shopData.shopName,
      businessType: shopData.businessType,
      setupDate: new Date().toISOString(),
      isActive: true
    };

    // Save permanently 
    localStorage.setItem('quantum_till_session', JSON.stringify(session));
    localStorage.setItem('quantum_auto_login', 'true');
    localStorage.setItem('quantum_backup_session', JSON.stringify(session));
    localStorage.setItem(`quantum_till_${shopData.tillCode}`, JSON.stringify(session));
    sessionStorage.setItem('quantum_till_session', JSON.stringify(session));

    console.log('🎉 NEW SHOP SETUP COMPLETE:', shopData.tillCode, shopData.shopName);
    onLogin(session);
  };

  // Show setup flow if user chose to set up new shop
  if (showSetup) {
    return <EasyShopSetup onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Quantum POS</CardTitle>
          <p className="text-gray-600">Enter your 4-digit till code</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Till Code (e.g. 1001)"
              value={tillCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setTillCode(value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl font-mono tracking-wider h-14"
              maxLength={4}
              data-testid="till-code-input"
            />
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>

          <Button 
            onClick={handleLogin}
            disabled={tillCode.length !== 4 || isLoading}
            className="w-full h-12 text-lg"
            data-testid="login-button"
          >
            {isLoading ? (
              'Logging in...'
            ) : (
              <>
                <Key className="w-5 h-5 mr-2" />
                Access Till
              </>
            )}
          </Button>

          {/* Quick setup codes display */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 text-center mb-3">Quick Setup Codes:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <Badge variant="outline" className="w-full justify-between">
                  <span>1001</span>
                  <span>Off License</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>1002</span>
                  <span>Pub</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>1003</span>
                  <span>Café</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>1004</span>
                  <span>Garage</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>1005</span>
                  <span>Bakery</span>
                </Badge>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="w-full justify-between">
                  <span>2001</span>
                  <span>New Shop</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>2002</span>
                  <span>New Shop</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>2003</span>
                  <span>New Shop</span>
                </Badge>
                <Badge variant="outline" className="w-full justify-between">
                  <span>2004</span>
                  <span>New Shop</span>
                </Badge>
                <Badge variant="secondary" className="w-full justify-between">
                  <span>9999</span>
                  <span>Admin</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Stays logged in forever - never expires!
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Don't have a shop yet?</p>
              <Button
                variant="outline"
                onClick={() => setShowSetup(true)}
                className="w-full"
                data-testid="setup-new-shop-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set Up New Shop (3 minutes)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}