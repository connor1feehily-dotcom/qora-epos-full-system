import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Settings, User, ShoppingCart, BarChart3, Users, Package, Truck, Tag, Shield, Scan, Plus, AlertCircle, LogOut, Key, Usb } from "lucide-react";
import { StatusPanels } from "./status-panels";
import { LoginBanner } from "./login-banner";
import type { User as StaffUser } from "@shared/schema";
import qoraLogo from "@assets/qoraPresentation_1767793834334.jpg";

interface MainMenuProps {
  onSelectMode: (mode: 'pos' | 'back-office' | 'stock-take' | 'hardware-setup', tillId?: string) => void;
  onStaffLogin: () => void;
  currentUser: StaffUser | null;
  onLogout: () => void;
}

export function MainMenu({ onSelectMode, onStaffLogin, currentUser, onLogout }: MainMenuProps) {
  const [selectedTill, setSelectedTill] = useState<string>('till1');

  // Debug user data and role checking
  console.log('Current User Object:', JSON.stringify(currentUser, null, 2));
  
  const canAccessBackOffice = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'manager' ||
    currentUser.username === 'admin' ||
    currentUser.username === 'manager'
  );
  
  console.log('Back Office Access Check:', {
    hasUser: !!currentUser,
    userRole: currentUser?.role,
    username: currentUser?.username,
    canAccess: canAccessBackOffice
  });

  return (
    <div className="min-h-screen kxl-neural-bg flex flex-col overflow-auto">
      <div className="w-full max-w-6xl mx-auto p-4 flex-1 flex flex-col">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src={qoraLogo} 
              alt="Qora EPOS Logo"
              className="h-24 w-auto object-contain kxl-float rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2dd4bf] bg-clip-text text-transparent mb-2">
            QORA EPOS
          </h1>
          <p className="text-lg text-muted-foreground mb-4 kxl-slide-in">
            Retail. Reinvented. Results. Delivered.
          </p>
          

          
          {/* Compact User Status */}
          {currentUser ? (
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="kxl-glass kxl-ai-border px-6 py-2 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center kxl-glow">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">
                      {currentUser.firstName || 'Staff'} {currentUser.lastName || 'Member'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs kxl-pulse">
                        {currentUser.role?.toUpperCase() || 'STAFF'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={onLogout}
                className="kxl-emerald-button px-4 py-2 text-sm font-bold border-none"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Card className="kxl-glass kxl-hologram inline-block p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <p className="text-foreground text-lg font-bold">
                  Staff Authentication Required
                </p>
              </div>
            </Card>
          )}
        </div>

        {currentUser ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
            
            {/* Mobile Stock Take Section - First on mobile */}
            <div className="block md:hidden order-first">
              <Card className="kxl-glass kxl-ai-border p-6 shadow-2xl kxl-hologram border-2 border-green-400">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 kxl-glow">
                    <Package className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                    STOCK TAKE
                  </h2>
                  <p className="text-base text-muted-foreground kxl-slide-in">
                    📱 Mobile Scanning Ready • First-Time Setup
                  </p>
                </div>

                <div className="mb-4">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Scan className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800 font-bold">
                        📱 Mobile Optimized
                      </p>
                    </div>
                    <p className="text-sm text-green-700">
                      Use your phone camera or Honeywell scanner to add products to inventory
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  onClick={() => onSelectMode('stock-take')}
                >
                  <div className="flex items-center space-x-3">
                    <Scan className="w-6 h-6" />
                    <span>START MOBILE STOCK TAKE</span>
                    <Package className="w-6 h-6" />
                  </div>
                </Button>
              </Card>
            </div>
            {/* Compact POS Section */}
            <Card className="kxl-glass kxl-ai-border p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 kxl-glow">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  POINT OF SALE
                </h2>
                <p className="text-sm text-muted-foreground kxl-slide-in">
                  Customer Transactions & Sales Processing
                </p>
              </div>

              {/* Compact Till Selection */}
              <div className="mb-4">
                <p className="text-sm font-bold text-foreground mb-3 text-center flex items-center justify-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Select Till Station</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['till1', 'till2'].map((tillId) => (
                    <Button
                      key={tillId}
                      variant={selectedTill === tillId ? "default" : "outline"}
                      className={`h-12 text-sm font-bold kxl-neural-button ${
                        selectedTill === tillId
                          ? "kxl-quantum-button text-white kxl-glow"
                          : "kxl-glass border-primary/20 hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedTill(tillId)}
                    >
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4" />
                        <span>{tillId === 'till1' ? 'Till 1' : 'Till 2'}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-bold kxl-quantum-button text-white kxl-glow kxl-neural-pulse"
                onClick={() => onSelectMode('pos', selectedTill)}
              >
                <div className="flex items-center space-x-2 text-[#000000]">
                  <ShoppingCart className="w-5 h-5" />
                  <span>START POS SESSION</span>
                  <Monitor className="w-5 h-5" />
                </div>
              </Button>
            </Card>

            {/* Compact Management Hub */}
            <Card className={`kxl-glass kxl-ai-border p-6 shadow-2xl ${
              canAccessBackOffice 
                ? "kxl-hologram" 
                : "opacity-60 kxl-locked"
            }`}>
              <div className="text-center mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 kxl-glow ${
                  canAccessBackOffice 
                    ? "bg-gradient-to-r from-secondary to-primary" 
                    : "bg-gray-400"
                }`}>
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">
                  BACK OFFICE
                </h2>
                <p className="text-sm text-muted-foreground kxl-slide-in">
                  {canAccessBackOffice 
                    ? "Inventory Management • Reports & Analytics" 
                    : "Manager Access Required • Contact Administrator"
                  }
                </p>
              </div>

              {canAccessBackOffice && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Reports</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-secondary/20">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-foreground">Inventory</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Customers</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-secondary/20">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-foreground">Suppliers</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-12 text-lg font-bold kxl-quantum-button kxl-glow kxl-neural-pulse text-[#000000]"
                onClick={() => canAccessBackOffice && onSelectMode('back-office')}
                disabled={!canAccessBackOffice}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>{canAccessBackOffice ? "ACCESS BACK OFFICE" : "ACCESS RESTRICTED"}</span>
                  <BarChart3 className="w-5 h-5" />
                </div>
              </Button>
            </Card>

            {/* Mobile Stock Take Section - Prioritized for mobile */}
            <Card className="kxl-glass kxl-ai-border p-6 shadow-2xl kxl-hologram md:order-first xl:order-none">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 kxl-glow">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                  STOCK TAKE
                </h2>
                <p className="text-sm text-muted-foreground kxl-slide-in">
                  First-Time Inventory Setup • Mobile Scanning
                </p>
              </div>

              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-800 font-medium">
                      First-Time Setup Required
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No products in inventory. Start stock take to add your products.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Scan className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-bold text-foreground">Scan</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-emerald-200">
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-foreground">Add</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={() => onSelectMode('stock-take')}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>START STOCK TAKE</span>
                  <Scan className="w-5 h-5" />
                </div>
              </Button>
            </Card>

            {/* Hardware Setup Section */}
            <Card className="kxl-glass kxl-ai-border p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 kxl-glow">
                  <Usb className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent mb-2">
                  HARDWARE SETUP
                </h2>
                <p className="text-sm text-muted-foreground kxl-slide-in">
                  Configure Receipt Printers • Barcode Scanners • Cash Drawers
                </p>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-1">
                      <Usb className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-foreground">USB</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-cyan-200">
                    <div className="flex items-center space-x-1">
                      <Scan className="w-3 h-3 text-cyan-600" />
                      <span className="text-xs font-bold text-foreground">Scanner</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-2 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-1">
                      <Settings className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-foreground">Setup</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                onClick={() => onSelectMode('hardware-setup')}
              >
                <div className="flex items-center space-x-2">
                  <Usb className="w-5 h-5" />
                  <span>SETUP HARDWARE</span>
                  <Settings className="w-5 h-5" />
                </div>
              </Button>
            </Card>
          </div>
        ) : (
          /* Compact Authentication Portal */
          <div className="text-center flex-1 flex items-center justify-center">
            <Card className="kxl-glass kxl-hologram inline-block p-8 shadow-2xl">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 kxl-glow">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  STAFF LOGIN
                </h3>
                <p className="text-lg text-muted-foreground kxl-slide-in">
                  Enter PIN to Access System
                </p>
              </div>
              
              <Button
                size="lg"
                className="h-12 px-8 text-lg font-bold kxl-quantum-button kxl-glow kxl-neural-pulse"
                onClick={onStaffLogin}
              >
                <div className="flex items-center space-x-2 text-[#000000]">
                  <User className="w-5 h-5" />
                  <span>STAFF LOGIN</span>
                  <Shield className="w-5 h-5" />
                </div>
              </Button>
            </Card>
          </div>
        )}

        {/* Compact Footer */}
        <div className="text-center mt-4 kxl-glass rounded-xl p-3">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="flex items-center space-x-1 text-primary">
              <Shield className="w-3 h-3" />
              <span className="text-xs font-bold">System: Active</span>
            </div>
            <div className="flex items-center space-x-1 text-secondary">
              <Monitor className="w-3 h-3" />
              <span className="text-xs font-bold">Network: Online</span>
            </div>
            <div className="flex items-center space-x-1 text-green-500">
              <ShoppingCart className="w-3 h-3" />
              <span className="text-xs font-bold">POS: Operational</span>
            </div>
          </div>
          <p className="text-sm font-bold text-foreground mb-1">
            Qora EPOS • Advanced Retail System
          </p>
          <p className="text-xs text-muted-foreground">
            qoraepos.com • Retail. Reinvented.
          </p>
        </div>
      </div>
    </div>
  );
}