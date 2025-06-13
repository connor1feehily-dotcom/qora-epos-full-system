import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Trash2, Minus, Plus, X, CreditCard, Banknote, MoreHorizontal, Pause, Printer, ShoppingCart, Receipt } from "lucide-react";
import type { CartItem, TransactionSummary } from "@/lib/types";
import type { Customer } from "@shared/schema";

interface TransactionPanelProps {
  transaction: TransactionSummary;
  customer: Customer | null;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearTransaction: () => void;
  onSelectCustomer: () => void;
  onProcessPayment: (method: 'card' | 'cash') => void;
}

export function TransactionPanel({
  transaction,
  customer,
  onUpdateQuantity,
  onRemoveItem,
  onClearTransaction,
  onSelectCustomer,
  onProcessPayment,
}: TransactionPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Current Sale</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {transaction.itemCount} {transaction.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearTransaction}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
        
        {/* Customer Info */}
        <Card 
          className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200" 
          onClick={onSelectCustomer}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="text-blue-600 dark:text-blue-400 w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {customer?.name || 'Walk-in Customer'}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Tap to change customer</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {transaction.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No items in cart</p>
              <p className="text-xs mt-1">Add products to start a sale</p>
            </div>
          ) : (
            transaction.items.map((item) => (
              <Card key={item.id} className="p-3 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <div className="text-xs text-gray-600">{item.category[0]}</div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      €{item.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      €{item.total.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-error hover:text-error p-0 h-auto"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">€{transaction.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">VAT:</span>
          <span className="font-medium">€{transaction.vatAmount.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>€{transaction.total.toFixed(2)}</span>
        </div>

        {/* Payment Buttons */}
        {transaction.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button 
                className="bg-primary hover:bg-blue-700 text-white"
                onClick={() => onProcessPayment('card')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
              
              <Button 
                className="bg-secondary hover:bg-green-700 text-white"
                onClick={() => onProcessPayment('cash')}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Cash
              </Button>
            </div>
            
            <Button variant="outline" className="w-full text-sm">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Other Payment Methods
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" size="sm" className="text-warning border-warning/20 hover:bg-warning/10">
                <Pause className="w-4 h-4 mr-1" />
                Hold
              </Button>
              
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
