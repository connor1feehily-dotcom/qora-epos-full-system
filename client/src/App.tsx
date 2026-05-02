import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TillSelector } from "@/components/till-selector";
import { MainMenu } from "@/components/main-menu";
import { StaffLogin } from "@/components/staff-login";
import { TillSetupWizard } from "@/components/till-setup-wizard";
import qoraLogo from "@assets/qoraPresentation_1767793834334.jpg";
import { KerrigansLoadingScreen } from "@/components/kerrigan-loading-screen";
import { useAutoSeed } from "@/hooks/useAutoSeed";
import { InactiveScreen } from "@/components/inactive-screen";
import { ComponentPreloader } from "@/utils/preloader";
import { isTillConfigured, getTillConfig, getCurrentTillId, getDeviceRole, type DeviceRole } from "@/utils/till-detection";
import { OfflineIndicator } from "@/components/offline-indicator";
import { startAutoFlush } from "@/lib/offline-queue";
import { registerServiceWorker } from "@/lib/push-client";
import type { User } from "@shared/schema";

// Lazy load heavy components
const ModernPOSInterface = lazy(() => import("@/components/modern-pos-interface").then(m => ({ default: m.ModernPOSInterface })));
const BackOfficeDashboard = lazy(() => import("@/components/back-office-dashboard").then(m => ({ default: m.BackOfficeDashboard })));
const MobileStockTake = lazy(() => import("@/components/mobile-stock-take").then(m => ({ default: m.MobileStockTake })));
const HardwareSetup = lazy(() => import("@/components/hardware-setup"));
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

function POSRouter({ tillId, onBackToMenu, onGoInactive, currentUser, onSelectMode }: { tillId: string; onBackToMenu: () => void; onGoInactive?: () => void; currentUser?: User; onSelectMode: (mode: 'pos' | 'back-office' | 'stock-take' | 'hardware-setup', tillId?: string) => void }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <ModernPOSInterface tillId={tillId} onBackToMenu={onBackToMenu} onGoInactive={onGoInactive} currentUser={currentUser} onSelectMode={onSelectMode} />
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
  const [mode, setMode] = useState<AppMode>('staff-login');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [tillConfigured, setTillConfigured] = useState<boolean>(false);
  const [deviceRole, setDeviceRoleState] = useState<DeviceRole>('both');
  const [checkingTillConfig, setCheckingTillConfig] = useState<boolean>(true);
  const [testingMode, setTestingMode] = useState<boolean>(false);

  // Check if till is configured on app load
  useEffect(() => {
    const configured = isTillConfigured();
    setTillConfigured(configured);

    if (configured) {
      const tillId = getCurrentTillId();
      const role = getDeviceRole();
      setDeviceRoleState(role);
      if (tillId) {
        setSelectedTill(tillId);
        console.log("Auto-detected till:", tillId, "role:", role);

        const tillConfig = getTillConfig();
        if (tillConfig) {
          console.log("Till configuration:", tillConfig);
        }
      }
    }

    setCheckingTillConfig(false);
  }, []);

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

  // Register service worker (push + offline app shell) and start auto-syncing offline sales
  useEffect(() => {
    registerServiceWorker().catch(() => {});
    startAutoFlush();
  }, []);

  // Secret keyboard shortcut to enable testing mode (Ctrl+Alt+M)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault(); // Prevent default browser behavior
        setTestingMode(prev => {
          const newMode = !prev;
          console.log('Testing mode:', newMode ? 'ENABLED' : 'DISABLED');
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
    // Enforce device role: a Till device can never enter back office;
    // a Back Office device can never enter POS / stock-take.
    if (deviceRole === 'till' && (selectedMode === 'back-office' || selectedMode === 'stock-take')) {
      console.warn('Blocked: this device is configured as a Till only.');
      return;
    }
    if (deviceRole === 'back-office' && (selectedMode === 'pos' || selectedMode === 'stock-take' || selectedMode === 'hardware-setup')) {
      console.warn('Blocked: this device is configured as Back Office only.');
      return;
    }

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

    // Route by device role.
    if (deviceRole === 'back-office') {
      // Back-office PCs require manager/admin.
      const allowed = user.role === 'admin' || user.role === 'manager' ||
        user.username === 'admin' || user.username === 'manager';
      if (!allowed) {
        console.warn('Non-manager tried to log in on a Back Office device');
        setCurrentUser(null);
        setMode('staff-login');
        return;
      }
      setMode('back-office');
      return;
    }

    if (deviceRole === 'till' && tillConfigured && selectedTill) {
      console.log(`Till device — auto-opening POS for ${selectedTill}`);
      setMode('pos');
      return;
    }

    // 'both' role — keep existing behavior.
    if (tillConfigured && selectedTill) {
      console.log(`Auto-opening POS for ${selectedTill} after login`);
      setMode('pos');
    } else {
      setMode('main-menu');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Go back to staff login for quick re-login on till terminals
    if (tillConfigured && selectedTill) {
      setMode('staff-login');
    } else {
      setMode('main-menu');
    }
  };

  const handleBackToMenu = () => {
    setMode('main-menu');
  };

  // Show loading while checking till configuration
  if (checkingTillConfig) {
    return <KerrigansLoadingScreen />;
  }

  // Show till setup wizard if not configured
  if (!tillConfigured) {
    return (
      <TillSetupWizard
        onComplete={() => {
          setTillConfigured(true);
          const tillId = getCurrentTillId();
          if (tillId) {
            setSelectedTill(tillId);
          }
          // Refresh role from storage so the very first session after setup
          // already enforces the new device role (no reload required).
          setDeviceRoleState(getDeviceRole());
        }}
        organizationId={1}
      />
    );
  }

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
      <OfflineIndicator />
      
      {/* Testing Mode Indicator - Hidden button */}
      {testingMode && (
        <div className="fixed top-2 right-2 z-50 flex gap-2">
          <button
            onClick={() => setMode('main-menu')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold shadow-lg"
            data-testid="button-testing-menu"
          >
            🔧 TESTING: Main Menu
          </button>
          <button
            onClick={() => setTestingMode(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
            data-testid="button-disable-testing"
          >
            Hide
          </button>
        </div>
      )}
      
      {/* Main menu only shows in testing mode */}
      {mode === 'main-menu' && testingMode && (
        <MainMenu
          onSelectMode={handleModeSelect}
          onStaffLogin={handleStaffLogin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      
      {/* If main menu is requested but testing mode is off, redirect to login */}
      {mode === 'main-menu' && !testingMode && (
        <>
          {(() => {
            setMode('staff-login');
            return null;
          })()}
        </>
      )}
      
      {mode === 'staff-login' && (
        <StaffLogin
          onLogin={handleLoginSuccess}
          onBack={testingMode ? handleBackToMenu : () => {}}
        />
      )}
      {mode === 'pos' && selectedTill && deviceRole !== 'back-office' && (
        <POSRouter
          tillId={selectedTill}
          onBackToMenu={handleBackToMenu}
          onGoInactive={handleGoInactive}
          currentUser={currentUser || undefined}
          onSelectMode={handleModeSelect}
        />
      )}
      {mode === 'back-office' && deviceRole !== 'till' && (
        <BackOfficeRouter
          onBackToMenu={handleBackToMenu}
          currentUser={currentUser || undefined}
        />
      )}

      {mode === 'stock-take' && currentUser && (
        <StockTakeRouter onBackToMenu={testingMode ? handleBackToMenu : () => {}} currentUser={currentUser} />
      )}

      {mode === 'hardware-setup' && (
        <HardwareSetupRouter onBackToMenu={testingMode ? handleBackToMenu : () => {}} />
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
