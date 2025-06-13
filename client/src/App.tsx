import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TillSelector } from "@/components/till-selector";
import { Sidebar } from "@/components/sidebar";
import { MainMenu } from "@/components/main-menu";
import { StaffLogin } from "@/components/staff-login";
import { FloatingNavigation } from "@/components/floating-navigation";
import kerrigansLogo from "@assets/NEW_1749822871411.png";
import { KerrigansLoadingScreen } from "@/components/kerrigan-loading-screen";
import { useAutoSeed } from "@/hooks/useAutoSeed";
import POS from "@/pages/pos";
import BackOffice from "@/pages/back-office";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import TillManagementPage from "@/pages/till-management";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function POSRouter({ tillId, onBackToMenu }: { tillId: string; onBackToMenu: () => void }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            ← Main Menu
          </button>
          <img 
            src={kerrigansLogo} 
            alt="Kerrigan's XL Logo"
            className="h-10 w-auto object-contain"
          />
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tillId === 'till1' ? 'Till 1' : 'Till 2'} - POS Mode
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Licensed to Kerrigan's XL from The Feehily Boyle Group
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <POS tillId={tillId} onBackToMenu={onBackToMenu} />
      </div>
    </div>
  );
}

function BackOfficeRouter({ onBackToMenu }: { onBackToMenu: () => void }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            ← Main Menu
          </button>
          <img 
            src={kerrigansLogo} 
            alt="Kerrigan's XL Logo"
            className="h-10 w-auto object-contain"
          />
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Back Office Management
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Licensed to Kerrigan's XL from The Feehily Boyle Group
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={BackOffice} />
            <Route path="/back-office" component={BackOffice} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/customers" component={Customers} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/reports" component={Reports} />
            <Route path="/till-management" component={() => <TillManagementPage currentUser={{ id: 1, role: 'admin' }} />} />
            <Route path="/fuel-control" component={() => (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Fuel Control</h2>
                  <p className="text-gray-600">This feature is coming soon</p>
                </div>
              </div>
            )} />
            <Route path="/payments" component={() => (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Management</h2>
                  <p className="text-gray-600">This feature is coming soon</p>
                </div>
              </div>
            )} />
            <Route path="/promotions" component={() => (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Promotions</h2>
                  <p className="text-gray-600">This feature is coming soon</p>
                </div>
              </div>
            )} />
            <Route path="/staff" component={() => (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Staff Management</h2>
                  <p className="text-gray-600">This feature is coming soon</p>
                </div>
              </div>
            )} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}

type AppMode = 'main-menu' | 'staff-login' | 'pos' | 'back-office';

function AppContent() {
  const [mode, setMode] = useState<AppMode>('main-menu');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Auto-seed the database on first load with 25-second loading
  const { data: seedResult, isLoading: isSeeding } = useAutoSeed();

  const handleModeSelect = (selectedMode: 'pos' | 'back-office', tillId?: string) => {
    if (selectedMode === 'pos' && tillId) {
      setSelectedTill(tillId);
      setMode('pos');
    } else if (selectedMode === 'back-office') {
      setMode('back-office');
    }
  };

  const handleStaffLogin = () => {
    setMode('staff-login');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setMode('main-menu');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMode('main-menu');
  };

  const handleBackToMenu = () => {
    setMode('main-menu');
  };

  // Show loading while seeding database
  if (isSeeding) {
    return <KerrigansLoadingScreen />;
  }

  return (
    <TooltipProvider>
      <Toaster />
      
      {/* Floating Navigation - only show when user is logged in */}
      {currentUser && mode !== 'staff-login' && (
        <FloatingNavigation
          currentMode={mode}
          onNavigate={(navMode) => {
            if (navMode === 'main-menu') {
              handleBackToMenu();
            } else if (navMode === 'pos') {
              handleModeSelect('pos', 'till1');
            } else if (navMode === 'back-office') {
              handleModeSelect('back-office');
            }
          }}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      )}

      {mode === 'main-menu' && (
        <MainMenu
          onSelectMode={handleModeSelect}
          onStaffLogin={handleStaffLogin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {mode === 'staff-login' && (
        <StaffLogin
          onLogin={handleLoginSuccess}
          onBack={handleBackToMenu}
        />
      )}
      {mode === 'pos' && selectedTill && (
        <POSRouter tillId={selectedTill} onBackToMenu={handleBackToMenu} />
      )}
      {mode === 'back-office' && (
        <BackOfficeRouter onBackToMenu={handleBackToMenu} />
      )}
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
