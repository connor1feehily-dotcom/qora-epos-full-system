import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Settings, User, ShoppingCart, BarChart3, Users, Package, Truck, Tag, Shield } from "lucide-react";
import { StatusPanels } from "./status-panels";
import { LoginBanner } from "./login-banner";
import type { User as StaffUser } from "@shared/schema";
import kerrigansLogo from "@assets/NEW_1749822871411.png";

interface MainMenuProps {
  onSelectMode: (mode: 'pos' | 'back-office', tillId?: string) => void;
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
    <div className="min-h-screen kxl-neural-bg overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto p-4">
        {/* Revolutionary Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={kerrigansLogo} 
              alt="Kerrigan's XL Logo"
              className="h-40 w-auto object-contain kxl-float"
            />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            KERRIGAN'S XL POS SYSTEM
          </h1>
          <p className="text-2xl text-muted-foreground mb-6 kxl-slide-in">
            Point of Sale & Management System • Manorhamilton
          </p>
          
          {/* Quantum User Status */}
          {currentUser ? (
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="kxl-glass kxl-ai-border px-8 py-4 rounded-2xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center kxl-glow">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-foreground">
                      {currentUser.firstName || 'Staff'} {currentUser.lastName || 'Member'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="kxl-pulse">
                        {currentUser.role?.toUpperCase() || 'STAFF'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {currentUser.employeeId || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={onLogout}
                className="kxl-quantum-button text-white border-none px-8 py-4 text-lg font-bold"
              >
                Neural Logout
              </Button>
            </div>
          ) : (
            <Card className="kxl-glass kxl-hologram inline-block p-8 mb-8">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-primary" />
                <p className="text-foreground text-xl font-bold">
                  Neural Authentication Required
                </p>
              </div>
            </Card>
          )}
        </div>

        {currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quantum POS Section */}
            <Card className="kxl-glass kxl-ai-border p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 kxl-glow">
                  <Monitor className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
                  POINT OF SALE
                </h2>
                <p className="text-lg text-muted-foreground kxl-slide-in">
                  Customer Transactions & Sales Processing
                </p>
              </div>

              {/* Revolutionary Till Selection */}
              <div className="mb-8">
                <p className="text-lg font-bold text-foreground mb-6 text-center flex items-center justify-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Select Till Station</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['till1', 'till2'].map((tillId) => (
                    <Button
                      key={tillId}
                      variant={selectedTill === tillId ? "default" : "outline"}
                      size="lg"
                      className={`h-20 text-lg font-bold kxl-neural-button ${
                        selectedTill === tillId
                          ? "kxl-quantum-button text-white kxl-glow"
                          : "kxl-glass border-primary/20 hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedTill(tillId)}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Monitor className="w-6 h-6" />
                        <span>{tillId === 'till1' ? 'Till 1' : 'Till 2'}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-20 text-2xl font-bold kxl-quantum-button text-white kxl-glow kxl-neural-pulse"
                onClick={() => onSelectMode('pos', selectedTill)}
              >
                <div className="flex items-center space-x-3 text-[#000000]">
                  <ShoppingCart className="w-8 h-8" />
                  <span>START POS SESSION</span>
                  <Monitor className="w-8 h-8" />
                </div>
              </Button>
            </Card>

            {/* Quantum Management Hub */}
            <Card className={`kxl-glass kxl-ai-border p-8 shadow-2xl ${
              canAccessBackOffice 
                ? "kxl-hologram" 
                : "opacity-60 kxl-locked"
            }`}>
              <div className="text-center mb-8">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 kxl-glow ${
                  canAccessBackOffice 
                    ? "bg-gradient-to-r from-secondary to-primary" 
                    : "bg-gray-400"
                }`}>
                  <Settings className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-3">
                  BACK OFFICE
                </h2>
                <p className="text-lg text-muted-foreground kxl-slide-in">
                  {canAccessBackOffice 
                    ? "Inventory Management • Reports & Analytics" 
                    : "Manager Access Required • Contact Administrator"
                  }
                </p>
              </div>

              {canAccessBackOffice && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="kxl-glass kxl-neural-pulse p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-6 h-6 text-primary" />
                      <span className="font-bold text-foreground">Reports</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-4 rounded-xl border border-secondary/20">
                    <div className="flex items-center space-x-3">
                      <Package className="w-6 h-6 text-secondary" />
                      <span className="font-bold text-foreground">Inventory</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-primary" />
                      <span className="font-bold text-foreground">Customers</span>
                    </div>
                  </div>
                  <div className="kxl-glass kxl-neural-pulse p-4 rounded-xl border border-secondary/20">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-6 h-6 text-secondary" />
                      <span className="font-bold text-foreground">Suppliers</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md px-8 w-full h-20 text-2xl font-bold transition-all duration-200 kxl-quantum-button kxl-glow kxl-neural-pulse text-[#000000]"
                onClick={() => canAccessBackOffice && onSelectMode('back-office')}
                disabled={!canAccessBackOffice}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-8 h-8" />
                  <span>{canAccessBackOffice ? "ACCESS BACK OFFICE" : "ACCESS RESTRICTED"}</span>
                  <BarChart3 className="w-8 h-8" />
                </div>
              </Button>
            </Card>
          </div>
        ) : (
          /* Quantum Authentication Portal */
          (<div className="text-center">
            <Card className="kxl-glass kxl-hologram inline-block p-12 shadow-2xl">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 kxl-glow">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                  STAFF LOGIN
                </h3>
                <p className="text-xl text-muted-foreground kxl-slide-in">
                  Enter PIN to Access System
                </p>
              </div>
              
              <Button
                size="lg"
                className="h-16 px-12 text-xl font-bold kxl-quantum-button kxl-glow kxl-neural-pulse text-[#0a0000]"
                onClick={onStaffLogin}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6" />
                  <span className="text-[#000000]">STAFF LOGIN</span>
                  <Shield className="w-6 h-6" />
                </div>
              </Button>
            </Card>
          </div>)
        )}

        {/* Clean Footer */}
        <div className="text-center mt-12 kxl-glass rounded-xl p-6">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center space-x-2 text-primary">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-bold">System: Active</span>
            </div>
            <div className="flex items-center space-x-2 text-secondary">
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-bold">Network: Online</span>
            </div>
            <div className="flex items-center space-x-2 text-green-500">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-bold">POS: Operational</span>
            </div>
          </div>
          <p className="text-lg font-bold text-foreground mb-2">
            Kerrigan's XL Manorhamilton • Point of Sale System
          </p>
          <p className="text-sm text-muted-foreground">
            Licensed to Kerrigan's XL from The Feehily Boyle Group • Retail Systems Division
          </p>
        </div>
      </div>
    </div>
  );
}