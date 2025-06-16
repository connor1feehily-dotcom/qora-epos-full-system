import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Calculator, CheckCircle, ArrowLeft } from "lucide-react";
import type { Product } from "@shared/schema";

interface PaymentInterfaceProps {
  product: Product;
  onPaymentComplete: (paymentMethod: 'cash' | 'card', amountGiven?: number, change?: number) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function PaymentInterface({ product, onPaymentComplete, onCancel, isProcessing }: PaymentInterfaceProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [amountGiven, setAmountGiven] = useState("");
  const [showChange, setShowChange] = useState(false);

  const total = Number(product.price);
  const vatAmount = total * 0.23;
  const subtotal = total - vatAmount;
  const amountGivenNum = parseFloat(amountGiven) || 0;
  const change = amountGivenNum - total;

  const handleCashPayment = () => {
    setPaymentMethod('cash');
  };

  const handleCardPayment = () => {
    onPaymentComplete('card');
  };

  const handleCashComplete = () => {
    if (amountGivenNum >= total) {
      setShowChange(true);
      setTimeout(() => {
        onPaymentComplete('cash', amountGivenNum, change);
      }, 2000);
    }
  };

  const quickAmounts = [
    { label: "Exact", value: total },
    { label: "€5", value: 5 },
    { label: "€10", value: 10 },
    { label: "€20", value: 20 },
    { label: "€50", value: 50 }
  ].filter(amount => amount.value >= total);

  if (showChange) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-96 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Change Due</h3>
            <div className="text-5xl font-bold text-green-600 mb-2">
              €{change.toFixed(2)}
            </div>
            <p className="text-gray-600">
              Given: €{amountGivenNum.toFixed(2)} • Total: €{total.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Payment</h2>
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Product Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sale Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{product.name}</span>
                <span className="font-bold">€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal (excl. VAT)</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT (23%)</span>
                <span>€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        {!paymentMethod && (
          <div className="grid grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={handleCashPayment}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cash Payment</h3>
                <p className="text-gray-600">Accept cash with change calculation</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={handleCardPayment}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Card Payment</h3>
                <p className="text-gray-600">Process card payment</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cash Payment Interface */}
        {paymentMethod === 'cash' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Cash Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Amount Given</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amountGiven}
                  onChange={(e) => setAmountGiven(e.target.value)}
                  className="text-xl text-center"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Amounts</label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount.label}
                      variant="outline"
                      onClick={() => setAmountGiven(amount.value.toString())}
                      className="text-sm"
                    >
                      {amount.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Change Display */}
              {amountGivenNum > 0 && (
                <Card className={`${amountGivenNum >= total ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Change Due:</span>
                      <span className={`text-xl font-bold ${amountGivenNum >= total ? 'text-green-600' : 'text-red-600'}`}>
                        €{change >= 0 ? change.toFixed(2) : 'Insufficient'}
                      </span>
                    </div>
                    {amountGivenNum < total && (
                      <p className="text-sm text-red-600 mt-2">
                        Need €{(total - amountGivenNum).toFixed(2)} more
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setPaymentMethod(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCashComplete}
                  disabled={amountGivenNum < total || isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}