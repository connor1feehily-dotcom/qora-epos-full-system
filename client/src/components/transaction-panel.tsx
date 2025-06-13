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
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-4 space-y-3">
          {transaction.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-medium mb-2">Cart is empty</p>
              <p className="text-sm">Scan or tap products to add them to the sale</p>
            </div>
          ) : (
            transaction.items.map((item) => (
              <Card key={item.id} className="group p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{item.category[0]}</div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      €{item.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="text-sm font-bold w-8 text-center text-slate-900 dark:text-slate-100">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      €{item.total.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
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
      <div className="bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 border-t border-slate-200/50 dark:border-slate-700/50 p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">€{transaction.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">VAT (23%):</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">€{transaction.vatAmount.toFixed(2)}</span>
          </div>
          
          <Separator className="bg-slate-200 dark:bg-slate-700" />
          
          <div className="flex justify-between text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <span>Total:</span>
            <span>€{transaction.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        {transaction.items.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
                onClick={() => onProcessPayment('card')}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Card
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
                onClick={() => onProcessPayment('cash')}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Cash
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full text-sm border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 py-2"
            >
              <MoreHorizontal className="w-4 h-4 mr-2" />
              More Payment Options
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Pause className="w-4 h-4 mr-1" />
                Hold Sale
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Receipt className="w-4 h-4 mr-1" />
                Receipt
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
