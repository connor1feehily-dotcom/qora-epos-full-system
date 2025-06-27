import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SecurePaymentInterfaceProps {
  total: number;
  onPaymentComplete: (result: any) => void;
  onCancel: () => void;
}

export default function SecurePaymentInterface({ total, onPaymentComplete, onCancel }: SecurePaymentInterfaceProps) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardValidation, setCardValidation] = useState<any>(null);
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const { toast } = useToast();

  // Load security information on component mount
  useState(() => {
    const loadSecurityInfo = async () => {
      try {
        const response = await apiRequest('GET', '/api/payment/methods');
        setSecurityInfo(response);
      } catch (error) {
        console.error('Failed to load security info:', error);
      }
    };
    loadSecurityInfo();
  });

  const handleCardNumberChange = async (value: string) => {
    // Format card number with spaces
    const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    setPaymentData(prev => ({ ...prev, cardNumber: formatted }));

    // Validate card number if complete
    if (value.replace(/\s/g, '').length >= 13) {
      try {
        const validation = await apiRequest('POST', '/api/payment/validate-card', {
          cardNumber: value.replace(/\s/g, '')
        });
        setCardValidation(validation);
      } catch (error) {
        setCardValidation({ valid: false, error: 'Validation failed' });
      }
    } else {
      setCardValidation(null);
    }
  };

  const handleExpiryChange = (field: 'expiryMonth' | 'expiryYear', value: string) => {
    if (field === 'expiryMonth') {
      const month = parseInt(value);
      if (month >= 1 && month <= 12) {
        setPaymentData(prev => ({ ...prev, [field]: value.padStart(2, '0') }));
      }
    } else if (field === 'expiryYear') {
      const currentYear = new Date().getFullYear();
      const year = parseInt(value);
      if (year >= currentYear && year <= currentYear + 20) {
        setPaymentData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleCvvChange = (value: string) => {
    // Limit CVV to 3-4 digits
    if (/^\d{0,4}$/.test(value)) {
      setPaymentData(prev => ({ ...prev, cvv: value }));
    }
  };

  const isFormValid = () => {
    return (
      paymentData.cardNumber.replace(/\s/g, '').length >= 13 &&
      paymentData.expiryMonth &&
      paymentData.expiryYear &&
      paymentData.cvv.length >= 3 &&
      paymentData.cardholderName.trim() &&
      cardValidation?.valid
    );
  };

  const handlePayment = async () => {
    if (!isFormValid()) {
      toast({
        title: "Invalid Payment Data",
        description: "Please check all fields and ensure card number is valid",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await apiRequest('POST', '/api/payment/process', {
        cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
        expiryMonth: parseInt(paymentData.expiryMonth),
        expiryYear: parseInt(paymentData.expiryYear),
        cvv: paymentData.cvv,
        amount: total,
        tillId: 'TILL_01' // This should come from the current till context
      });

      if (result.success) {
        toast({
          title: "Payment Successful",
          description: `Transaction completed. Auth Code: ${result.authCode}`,
        });
        onPaymentComplete(result);
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Payment processing failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred processing the payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Secure Payment
            <Badge variant="secondary" className="ml-auto">
              <Shield className="h-3 w-3 mr-1" />
              PCI DSS
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>256-bit encryption • Tokenized processing</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Payment Amount */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">€{total.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className={cardValidation?.valid === false ? 'border-red-500' : ''}
              />
              {cardValidation?.type && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="outline" className="text-xs">
                    {cardValidation.type.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
            {cardValidation?.valid === false && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Invalid card number
              </div>
            )}
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={paymentData.cardholderName}
              onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
            />
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                type="number"
                placeholder="MM"
                min="1"
                max="12"
                value={paymentData.expiryMonth}
                onChange={(e) => handleExpiryChange('expiryMonth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                type="number"
                placeholder="YYYY"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 20}
                value={paymentData.expiryYear}
                onChange={(e) => handleExpiryChange('expiryYear', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder="123"
                maxLength={4}
                value={paymentData.cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
              />
            </div>
          </div>

          {/* Security Information */}
          {securityInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                <Shield className="h-4 w-4" />
                <span>PCI DSS Level {securityInfo.security?.pciDssLevel} Compliant</span>
              </div>
              <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                {securityInfo.security?.encryption} • TLS {securityInfo.security?.tlsVersion}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!isFormValid() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `Pay €${total.toFixed(2)}`
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Your payment information is encrypted and tokenized.
            Card details are never stored on our servers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}