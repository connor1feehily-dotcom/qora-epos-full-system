import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, TransactionSummary } from "@/lib/types";
import type { Customer } from "@shared/schema";

interface ReceiptPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionSummary;
  customer: Customer | null;
  tillId: string;
  paymentMethod: string;
  transactionId?: number;
}

interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  vatNumber: string;
  transactionId: number;
  tillId: string;
  dateTime: string;
  items: CartItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  customer?: Customer | null;
}

export function ReceiptPrinter({ 
  isOpen, 
  onClose, 
  transaction, 
  customer, 
  tillId, 
  paymentMethod,
  transactionId = 0
}: ReceiptPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const receiptData: ReceiptData = {
    storeName: "Kerrigans XL",
    storeAddress: "Manorhamilton, Co. Leitrim",
    storePhone: "071-985-5555",
    vatNumber: "IE1234567FA",
    transactionId: transactionId,
    tillId: tillId,
    dateTime: new Date().toLocaleString('en-IE'),
    items: transaction.items,
    subtotal: transaction.subtotal,
    vatAmount: transaction.vatAmount,
    total: transaction.total,
    paymentMethod: paymentMethod,
    customer: customer
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus('idle');

    try {
      // Send receipt data to printer endpoint
      const response = await fetch('/api/print/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        setPrintStatus('success');
        toast({
          title: "Receipt Printed",
          description: "Receipt has been sent to the printer successfully",
        });
        
        // Auto-close after successful print
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Print failed');
      }
    } catch (error) {
      setPrintStatus('error');
      toast({
        title: "Print Error",
        description: "Failed to print receipt. Please check printer connection.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!customer?.email) {
      toast({
        title: "No Email Address",
        description: "Customer email address is required to send receipt",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/email/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...receiptData,
          customerEmail: customer.email
        }),
      });

      if (response.ok) {
        toast({
          title: "Receipt Emailed",
          description: `Receipt sent to ${customer.email}`,
        });
      } else {
        throw new Error('Email failed');
      }
    } catch (error) {
      toast({
        title: "Email Error",
        description: "Failed to send receipt via email",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Print Receipt</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <Card className="p-4 bg-gray-50">
            <div className="text-center space-y-1 mb-3">
              <h3 className="font-bold text-lg">{receiptData.storeName}</h3>
              <p className="text-sm text-gray-600">{receiptData.storeAddress}</p>
              <p className="text-sm text-gray-600">{receiptData.storePhone}</p>
              <p className="text-xs text-gray-500">VAT: {receiptData.vatNumber}</p>
            </div>

            <Separator className="my-3" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Transaction #{receiptData.transactionId}</span>
                <span>{receiptData.tillId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>{receiptData.dateTime}</span>
              </div>
              {customer && (
                <div className="text-xs text-gray-600">
                  Customer: {customer.name}
                </div>
              )}
            </div>

            <Separator className="my-3" />

            <div className="space-y-1">
              {receiptData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      {item.quantity} × €{item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">€{item.total.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€{receiptData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (23%)</span>
                <span>€{receiptData.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total</span>
                <span>€{receiptData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Payment</span>
                <span>{receiptData.paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-3">
              <p>Thank you for your business!</p>
              <p>Keep your receipt for returns</p>
            </div>
          </Card>

          {/* Print Status */}
          {printStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded">
              <Check className="w-4 h-4" />
              <span className="text-sm">Receipt printed successfully</span>
            </div>
          )}

          {printStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Print failed - check printer connection</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handlePrint} 
              disabled={isPrinting}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? "Printing..." : "Print Receipt"}
            </Button>
            
            {customer?.email && (
              <Button 
                variant="outline"
                onClick={handleEmailReceipt}
                className="flex-1"
              >
                Email Receipt
              </Button>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}