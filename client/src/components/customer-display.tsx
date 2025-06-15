import { useEffect, useState } from 'react';
import { CartItem } from '@/lib/types';

interface CustomerDisplayProps {
  currentItem?: CartItem;
  total: number;
  subtotal: number;
  vatAmount: number;
  itemCount: number;
  isPaymentMode?: boolean;
  paymentAmount?: number;
  change?: number;
}

export function CustomerDisplay({ 
  currentItem, 
  total, 
  subtotal, 
  vatAmount, 
  itemCount,
  isPaymentMode = false,
  paymentAmount = 0,
  change = 0
}: CustomerDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-cyan-50 to-emerald-50 text-black overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">KERRIGAN'S XL</h1>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-lg">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="text-center text-xl mt-2">
          Manorhamilton - Your Local Store
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 p-8">
        {!isPaymentMode ? (
          <>
            {/* Current Item Display */}
            {currentItem ? (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border-2 border-cyan-200">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-cyan-700 mb-4">Current Item</h2>
                  <div className="text-6xl font-bold text-emerald-600 mb-2">
                    {currentItem.name}
                  </div>
                  <div className="text-4xl text-gray-600 mb-4">
                    Quantity: {currentItem.quantity}
                  </div>
                  <div className="text-8xl font-bold text-cyan-700">
                    €{(currentItem.price * currentItem.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border-2 border-gray-200">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-500 mb-8">Welcome</h2>
                  <div className="text-6xl text-emerald-600 mb-4">🛒</div>
                  <div className="text-2xl text-gray-600">
                    Ready to serve you
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">Items</h3>
                <div className="text-6xl font-bold text-emerald-600">
                  {itemCount}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-cyan-200">
                <h3 className="text-2xl font-bold text-cyan-700 mb-4">Total</h3>
                <div className="text-6xl font-bold text-cyan-600">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Payment Mode Display */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-200">
              <h2 className="text-4xl font-bold text-blue-700 mb-6 text-center">Payment</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-2xl text-gray-600 mb-2">Total Due</div>
                  <div className="text-6xl font-bold text-blue-600">
                    €{total.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-gray-600 mb-2">Amount Paid</div>
                  <div className="text-6xl font-bold text-green-600">
                    €{paymentAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {change > 0 && (
              <div className="bg-green-100 rounded-lg shadow-lg p-8 border-2 border-green-300">
                <h3 className="text-3xl font-bold text-green-700 mb-4 text-center">Change Due</h3>
                <div className="text-8xl font-bold text-green-600 text-center">
                  €{change.toFixed(2)}
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-2xl text-gray-600 mb-4">
                  Please follow cashier instructions
                </div>
                <div className="text-xl text-gray-500">
                  Insert card or provide cash as directed
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with breakdown */}
      <div className="bg-gray-100 p-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-center text-lg">
          <div>Subtotal: €{subtotal.toFixed(2)}</div>
          <div>VAT (23%): €{vatAmount.toFixed(2)}</div>
          <div className="font-bold">Total: €{total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// Standalone Customer Display Window
export function openCustomerDisplay() {
  const customerWindow = window.open(
    '/customer-display', 
    'CustomerDisplay',
    'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes'
  );
  
  return customerWindow;
}

// Customer Display Route Component
export function CustomerDisplayPage() {
  const [displayData, setDisplayData] = useState({
    currentItem: undefined,
    total: 0,
    subtotal: 0,
    vatAmount: 0,
    itemCount: 0,
    isPaymentMode: false,
    paymentAmount: 0,
    change: 0
  });

  useEffect(() => {
    // Listen for messages from main POS window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'CUSTOMER_DISPLAY_UPDATE') {
        setDisplayData(event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready signal to parent
    if (window.opener) {
      window.opener.postMessage({ type: 'CUSTOMER_DISPLAY_READY' }, window.location.origin);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <CustomerDisplay {...displayData} />;
}