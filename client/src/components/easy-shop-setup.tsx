import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, Zap, Crown, Coffee, Wrench, Cookie, Sparkles, ShieldCheck } from 'lucide-react';

interface EasyShopSetupProps {
  onComplete: (shopData: ShopSetupData) => void;
}

interface ShopSetupData {
  tillCode: string;
  shopName: string;
  businessType: string;
  isReady: boolean;
}

export default function EasyShopSetup({ onComplete }: EasyShopSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<ShopSetupData>({
    tillCode: '',
    shopName: '',
    businessType: '',
    isReady: false
  });

  // Simple business type options with icons
  const businessTypes = [
    { id: 'offlicense', name: 'Off License', icon: '🍷', description: 'Alcohol & convenience store' },
    { id: 'pub', name: 'Pub/Bar', icon: '🍺', description: 'Drinks & food service' },
    { id: 'cafe', name: 'Coffee Shop', icon: '☕', description: 'Coffee & light meals' },
    { id: 'garage', name: 'Auto Garage', icon: '🔧', description: 'Car repairs & parts' },
    { id: 'bakery', name: 'Bakery', icon: '🥖', description: 'Fresh breads & pastries' },
    { id: 'salon', name: 'Beauty Salon', icon: '💄', description: 'Hair & beauty services' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️', description: 'Full dining service' },
    { id: 'retail', name: 'General Retail', icon: '🏪', description: 'General merchandise' }
  ];

  const handleGetStarted = () => {
    setCurrentStep(2);
  };

  const handleBusinessTypeSelect = (type: typeof businessTypes[0]) => {
    setSetupData(prev => ({
      ...prev,
      businessType: type.id,
      shopName: `My ${type.name}`
    }));
    setCurrentStep(3);
  };

  const handleShopNameChange = (name: string) => {
    setSetupData(prev => ({ ...prev, shopName: name }));
  };

  const generateTillCode = () => {
    // Generate simple 4-digit code based on business type
    const typeMap: Record<string, string> = {
      'offlicense': '10',
      'pub': '20', 
      'cafe': '30',
      'garage': '40',
      'bakery': '50',
      'salon': '60',
      'restaurant': '70',
      'retail': '80'
    };
    
    const prefix = typeMap[setupData.businessType] || '90';
    const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const tillCode = prefix + suffix;
    
    setSetupData(prev => ({ ...prev, tillCode, isReady: true }));
    setCurrentStep(4);
  };

  const handleFinishSetup = () => {
    // Save the setup data permanently
    localStorage.setItem('quantum_shop_setup', JSON.stringify(setupData));
    localStorage.setItem('quantum_setup_complete', 'true');
    
    onComplete(setupData);
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to Quantum POS!</CardTitle>
            <p className="text-xl text-gray-600 mt-4">Set up your shop in 3 easy steps</p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Choose Business</h3>
                <p className="text-gray-600 text-sm">Select your shop type</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Name Your Shop</h3>
                <p className="text-gray-600 text-sm">Give it a great name</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Get Till Code</h3>
                <p className="text-gray-600 text-sm">Your unique access code</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                size="lg" 
                className="px-12 py-6 text-lg"
                onClick={handleGetStarted}
                data-testid="get-started-button"
              >
                Get Started - It's Super Easy! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">What type of business are you?</CardTitle>
            <p className="text-gray-600">Choose your business type to get the right setup</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {businessTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-shadow"
                  onClick={() => handleBusinessTypeSelect(type)}
                  data-testid={`business-type-${type.id}`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-semibold text-sm">{type.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 3) {
    const selectedType = businessTypes.find(t => t.id === setupData.businessType);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">{selectedType?.icon}</div>
            <CardTitle className="text-2xl font-bold">Name Your {selectedType?.name}</CardTitle>
            <p className="text-gray-600">What should we call your shop?</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={`e.g. ${selectedType?.name === 'Off License' ? "Murphy's Off License" : selectedType?.name === 'Pub/Bar' ? "The Crown Pub" : selectedType?.name === 'Coffee Shop' ? "City Coffee" : `My ${selectedType?.name}`}`}
                value={setupData.shopName}
                onChange={(e) => handleShopNameChange(e.target.value)}
                className="text-center text-lg h-12"
                data-testid="shop-name-input"
              />
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="px-4 py-2">
                  {selectedType?.description}
                </Badge>
              </div>

              <Button 
                onClick={generateTillCode}
                disabled={!setupData.shopName.trim()}
                className="w-full h-12 text-lg"
                data-testid="generate-code-button"
              >
                Generate My Till Code 🎯
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 4) {
    const selectedType = businessTypes.find(t => t.id === setupData.businessType);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Setup Complete!</CardTitle>
            <p className="text-gray-600">Your shop is ready to go</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Shop:</p>
                <p className="text-xl font-bold">{setupData.shopName}</p>
                <Badge variant="outline" className="mt-2">
                  {selectedType?.icon} {selectedType?.name}
                </Badge>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Your Till Code:</p>
                <p className="text-3xl font-bold font-mono text-blue-600">{setupData.tillCode}</p>
                <p className="text-xs text-gray-500 mt-2">Write this down - you'll use it to login</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center text-green-600 text-sm mb-4">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Stays logged in forever - never expires!
                </div>
              </div>
            </div>

            <Button 
              onClick={handleFinishSetup}
              className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
              data-testid="finish-setup-button"
            >
              Start Using Quantum POS! 🎉
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}