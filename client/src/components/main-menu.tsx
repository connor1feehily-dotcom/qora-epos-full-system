import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monitor, Settings, User, ShoppingCart, BarChart3, Users, Package, Truck, Tag } from "lucide-react";
import type { User as StaffUser } from "@shared/schema";

interface MainMenuProps {
  onSelectMode: (mode: 'pos' | 'back-office', tillId?: string) => void;
  onStaffLogin: () => void;
  currentUser: StaffUser | null;
  onLogout: () => void;
}

export function MainMenu({ onSelectMode, onStaffLogin, currentUser, onLogout }: MainMenuProps) {
  const [selectedTill, setSelectedTill] = useState<string>('till1');

  const canAccessBackOffice = currentUser && currentUser.role && ['admin', 'manager'].includes(currentUser.role);
  
  // Debug logging
  console.log('Current user:', currentUser);
  console.log('User role:', currentUser?.role);
  console.log('Can access back office:', canAccessBackOffice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/attached_assets/NEW_1749822871411.png" 
              alt="Kerrigan's XL Logo"
              className="h-32 w-auto object-contain"
            />
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
            Manorhamilton Point of Sale System
          </p>
          
          {/* User Status */}
          {currentUser ? (
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20 dark:border-slate-700/50">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currentUser.firstName || 'Staff'} {currentUser.lastName || 'Member'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser.role?.toUpperCase() || 'STAFF'} • {currentUser.employeeId || 'N/A'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={onLogout}
                className="px-6 py-3"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Card className="inline-block p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-8">
              <p className="text-amber-800 dark:text-amber-400 text-lg font-medium">
                Please log in to access the system
              </p>
            </Card>
          )}
        </div>

        {currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* POS Section */}
            <Card className="p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-xl border border-white/30 dark:border-slate-700/50">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Point of Sale
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Process customer transactions
                </p>
              </div>

              {/* Till Selection */}
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                  Select Till Station
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['till1', 'till2'].map((tillId) => (
                    <Button
                      key={tillId}
                      variant={selectedTill === tillId ? "default" : "outline"}
                      size="lg"
                      className={`h-16 text-lg font-semibold ${
                        selectedTill === tillId
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                          : "hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                      onClick={() => setSelectedTill(tillId)}
                    >
                      <Monitor className="w-5 h-5 mr-2" />
                      {tillId === 'till1' ? 'Till 1' : 'Till 2'}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => onSelectMode('pos', selectedTill)}
              >
                <ShoppingCart className="w-6 h-6 mr-3" />
                Start POS Session
              </Button>
            </Card>

            {/* Back Office Section */}
            <Card className={`p-8 backdrop-blur-sm shadow-xl border ${
              canAccessBackOffice 
                ? "bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-700/50" 
                : "bg-gray-100/70 dark:bg-slate-900/70 border-gray-200/30 dark:border-slate-800/50 opacity-60"
            }`}>
              <div className="text-center mb-8">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
                  canAccessBackOffice 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                    : "bg-gray-400"
                }`}>
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Back Office
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {canAccessBackOffice 
                    ? "Manage inventory, reports & settings" 
                    : "Manager access required"
                  }
                </p>
              </div>

              {canAccessBackOffice && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Reports</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <Package className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Inventory</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Customers</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Suppliers</span>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className={`w-full h-16 text-xl font-semibold transition-all duration-200 ${
                  canAccessBackOffice
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
                onClick={() => canAccessBackOffice && onSelectMode('back-office')}
                disabled={!canAccessBackOffice}
              >
                <Settings className="w-6 h-6 mr-3" />
                {canAccessBackOffice ? "Access Back Office" : "Access Restricted"}
              </Button>
            </Card>
          </div>
        ) : (
          /* Login Prompt */
          <div className="text-center">
            <Card className="inline-block p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-xl border border-white/30 dark:border-slate-700/50">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Staff Authentication Required
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Please log in to access the POS system
                </p>
              </div>
              
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={onStaffLogin}
              >
                <User className="w-5 h-5 mr-3" />
                Staff Login
              </Button>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Kerrigans XL Manorhamilton • Touchscreen POS System
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2024 The Feehily Boyle Group. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}