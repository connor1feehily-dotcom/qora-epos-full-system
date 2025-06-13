import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (method: string, amount?: number) => void;
  total: number;
  initialMethod?: 'card' | 'cash';
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  total,
  initialMethod = 'card' 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>(initialMethod);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const amount = paymentMethod === 'cash' ? parseFloat(cashReceived) : total;
    onComplete(paymentMethod, amount);
    setIsProcessing(false);
    onClose();
  };

  const change = paymentMethod === 'cash' 
    ? Math.max(0, parseFloat(cashReceived || '0') - total)
    : 0;

  const canComplete = paymentMethod === 'card' || 
    (paymentMethod === 'cash' && parseFloat(cashReceived || '0') >= total);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">€{total.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              className={cn(
                "p-3 h-auto flex-col",
                paymentMethod === 'card' && "bg-primary border-primary text-white"
              )}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              Card
            </Button>
            
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              className={cn(
                "p-3 h-auto flex-col",
                paymentMethod === 'cash' && "bg-primary border-primary text-white"
              )}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className="w-5 h-5 mb-1" />
              Cash
            </Button>
          </div>
          
          {/* Payment Interface */}
          {paymentMethod === 'card' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Insert, tap, or swipe card</p>
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                {isProcessing ? (
                  <div className="space-y-2">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-600">Processing payment...</p>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Waiting for card...</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cashReceived">Cash Received</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                />
              </div>
              
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Change:</span>
                    <span className="text-lg font-semibold text-green-700">
                      €{change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            <Button 
              className="flex-1 bg-primary hover:bg-blue-700"
              onClick={handleComplete}
              disabled={!canComplete || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
