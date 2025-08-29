import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TillSelector } from "@/components/till-selector";
import { MainMenu } from "@/components/main-menu";
import { StaffLogin } from "@/components/staff-login";
import quantumLogo from "@assets/Quantum POS Logo _1754045289852.png";
import { KerrigansLoadingScreen } from "@/components/kerrigan-loading-screen";
import { useAutoSeed } from "@/hooks/useAutoSeed";
import { InactiveScreen } from "@/components/inactive-screen";
import { ComponentPreloader } from "@/utils/preloader";
import type { User } from "@shared/schema";

// Lazy load heavy components
const ModernPOSInterface = lazy(() => import("@/components/modern-pos-interface").then(m => ({ default: m.ModernPOSInterface })));
const BackOfficeDashboard = lazy(() => import("@/components/back-office-dashboard").then(m => ({ default: m.BackOfficeDashboard })));
const MobileStockTake = lazy(() => import("@/components/mobile-stock-take").then(m => ({ default: m.MobileStockTake })));
const HardwareSetup = lazy(() => import("@/components/hardware-setup").then(m => ({ default: m.HardwareSetup })));
const CustomerDisplayPage = lazy(() => import("@/components/customer-display").then(m => ({ default: m.CustomerDisplayPage })));
const ValBotAssistant = lazy(() => import("@/components/valbot-assistant"));
const MobileCompanion = lazy(() => import("@/components/mobile-companion"));

// Lazy load pages that aren't immediately needed
const BackOffice = lazy(() => import("@/pages/back-office"));
const Inventory = lazy(() => import("@/pages/inventory"));
const Customers = lazy(() => import("@/pages/customers"));
const Suppliers = lazy(() => import("@/pages/suppliers"));
const Reports = lazy(() => import("@/pages/reports"));
const TillManagementPage = lazy(() => import("@/pages/till-management"));
const NotFound = lazy(() => import("@/pages/not-found"));

function POSRouter({ tillId, onBackToMenu, onGoInactive, currentUser }: { tillId: string; onBackToMenu: () => void; onGoInactive?: () => void; currentUser?: User }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <ModernPOSInterface tillId={tillId} onBackToMenu={onBackToMenu} onGoInactive={onGoInactive} currentUser={currentUser} />
    </Suspense>
  );
}

function BackOfficeRouter({ onBackToMenu, currentUser }: { onBackToMenu: () => void; currentUser?: User }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <BackOfficeDashboard onBackToMenu={onBackToMenu} currentUser={currentUser} />
    </Suspense>
  );
}

function StockTakeRouter({ onBackToMenu, currentUser }: { onBackToMenu: () => void; currentUser: User }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <MobileStockTake onBackToMenu={onBackToMenu} currentUser={currentUser} />
    </Suspense>
  );
}

function HardwareSetupRouter({ onBackToMenu }: { onBackToMenu: () => void }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <HardwareSetup />
      <div className="fixed top-4 left-4">
        <button 
          onClick={onBackToMenu}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <span>← Back to Menu</span>
        </button>
      </div>
    </Suspense>
  );
}

type AppMode = 'main-menu' | 'staff-login' | 'pos' | 'back-office' | 'stock-take' | 'hardware-setup' | 'inactive';

function AppContent() {
  const [mode, setMode] = useState<AppMode>('main-menu');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Debug mode changes
  useEffect(() => {
    console.log("App mode changed to:", mode);
  }, [mode]);

  // Auto-seed the database on first load with optimized 9-second loading
  const { data: seedResult, isLoading: isSeeding } = useAutoSeed();
  
  // Preload critical resources for faster performance
  useEffect(() => {
    // Start preloading immediately
    ComponentPreloader.preloadCriticalComponents();
    ComponentPreloader.preloadDataEndpoints();
  }, []);

  const handleActivateFromInactive = () => {
    setMode('main-menu');
    setLastActivity(new Date());
  };

  const handleGoInactive = () => {
    console.log("Setting mode to inactive");
    setMode('inactive');
    setLastActivity(new Date());
  };

  const handleModeSelect = (selectedMode: 'pos' | 'back-office' | 'stock-take' | 'hardware-setup', tillId?: string) => {
    if (selectedMode === 'pos' && tillId) {
      setSelectedTill(tillId);
      setMode('pos');
    } else if (selectedMode === 'back-office') {
      setMode('back-office');
    } else if (selectedMode === 'stock-take') {
      setMode('stock-take');
    } else if (selectedMode === 'hardware-setup') {
      setMode('hardware-setup');
    }
    setLastActivity(new Date());
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

  // Show inactive screen
  if (mode === 'inactive') {
    return (
      <InactiveScreen 
        onActivate={handleActivateFromInactive}
        lastActivity={lastActivity}
      />
    );
  }

  return (
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
        <POSRouter tillId={selectedTill} onBackToMenu={handleBackToMenu} onGoInactive={handleGoInactive} currentUser={currentUser || undefined} />
      )}
      {mode === 'back-office' && (
        <BackOfficeRouter onBackToMenu={handleBackToMenu} currentUser={currentUser || undefined} />
      )}

      {mode === 'stock-take' && currentUser && (
        <StockTakeRouter onBackToMenu={handleBackToMenu} currentUser={currentUser} />
      )}

      {mode === 'hardware-setup' && (
        <HardwareSetupRouter onBackToMenu={handleBackToMenu} />
      )}

      {/* Customer Display Route */}
      <Switch>
        <Route path="/customer-display" component={CustomerDisplayPage} />
      </Switch>
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
