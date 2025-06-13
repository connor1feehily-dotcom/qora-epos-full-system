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
import { useAutoSeed } from "@/hooks/useAutoSeed";
import POS from "@/pages/pos";
import BackOffice from "@/pages/back-office";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function POSRouter({ tillId, onBackToMenu }: { tillId: string; onBackToMenu: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            ← Main Menu
          </button>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tillId === 'till1' ? 'Till 1' : 'Till 2'} - POS Mode
          </span>
        </div>
      </div>
      <div className="flex-1">
        <POS tillId={tillId} />
      </div>
    </div>
  );
}

function BackOfficeRouter({ onBackToMenu }: { onBackToMenu: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            ← Main Menu
          </button>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Back Office Management
          </span>
        </div>
      </div>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <Switch>
          <Route path="/" component={BackOffice} />
          <Route path="/back-office" component={BackOffice} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/customers" component={Customers} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/reports" component={Reports} />
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
  );
}

type AppMode = 'main-menu' | 'staff-login' | 'pos' | 'back-office';

function App() {
  const [mode, setMode] = useState<AppMode>('main-menu');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Auto-seed the database on first load
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
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Initializing Kerrigans XL POS
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Setting up your point of sale system...
            </p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
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
    </QueryClientProvider>
  );
}

export default App;
