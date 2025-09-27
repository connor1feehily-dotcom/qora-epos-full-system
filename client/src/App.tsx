import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TillSelector } from "@/components/till-selector";
import { MainMenu } from "@/components/main-menu";
import SimpleTillAuth from "@/components/simple-till-auth";
import TenantAwareApp from "@/components/tenant-aware-app";
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

type AppMode = 'till-auth' | 'main-menu' | 'pos' | 'back-office' | 'stock-take' | 'hardware-setup' | 'inactive';

interface TillSession {
  tillCode: string;
  shopName: string;
  businessType: string;
  setupDate: string;
  isActive: boolean;
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>('till-auth');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [tillSession, setTillSession] = useState<TillSession | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Check for saved session on app load - MULTIPLE backup locations!
  useEffect(() => {
    let savedSession = localStorage.getItem('quantum_till_session') ||
                      localStorage.getItem('quantum_backup_session') ||
                      sessionStorage.getItem('quantum_till_session');
    
    // Try backup locations if primary fails
    if (!savedSession) {
      const tillCodes = ['1001', '1002', '1003', '1004', '1005', '9999'];
      for (const code of tillCodes) {
        const backup = localStorage.getItem(`quantum_till_${code}`);
        if (backup) {
          savedSession = backup;
          break;
        }
      }
    }
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setTillSession(session);
        setMode('main-menu');
        console.log('✅ AUTO-LOGIN SUCCESS:', session.tillCode, session.shopName);
        console.log('🔒 Session NEVER expires - logged in permanently!');
      } catch (error) {
        console.error('Error loading saved session:', error);
        setMode('till-auth');
      }
    }
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

  const handleTillLogin = (session: TillSession) => {
    setTillSession(session);
    setMode('main-menu');
    console.log('Till logged in:', session.tillCode, session.shopName);
  };

  // Create user from till session - ADMIN gets SUPER ACCESS!
  const mockUser = tillSession ? {
    id: parseInt(tillSession.tillCode),
    username: tillSession.tillCode,
    firstName: tillSession.shopName,
    lastName: tillSession.businessType,
    role: tillSession.tillCode === '9999' ? 'super_admin' : 'manager', // SUPER ADMIN ROLE!
    isActive: true,
    organizationId: tillSession.tillCode === '9999' ? 0 : parseInt(tillSession.tillCode), // Admin = org 0
    password: '',
    pin: '',
    employeeId: tillSession.tillCode,
    createdAt: new Date(tillSession.setupDate),
    lastLogin: new Date()
  } : null;

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
      
      {mode === 'till-auth' && (
        <SimpleTillAuth onLogin={handleTillLogin} />
      )}
      {mode === 'main-menu' && tillSession && mockUser && (
        <MainMenu
          onSelectMode={handleModeSelect}
          onStaffLogin={() => {}} 
          currentUser={mockUser}
          onLogout={() => {}} // No logout - stays logged in forever!
        />
      )}
      {mode === 'pos' && tillSession && mockUser && (
        <POSRouter tillId={tillSession.tillCode} onBackToMenu={handleBackToMenu} onGoInactive={handleGoInactive} currentUser={mockUser} />
      )}
      {mode === 'back-office' && tillSession && mockUser && (
        <BackOfficeRouter onBackToMenu={handleBackToMenu} currentUser={mockUser} />
      )}

      {mode === 'stock-take' && tillSession && mockUser && (
        <StockTakeRouter onBackToMenu={handleBackToMenu} currentUser={mockUser} />
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
      <TenantAwareApp>
        <AppContent />
        <Toaster />
      </TenantAwareApp>
    </QueryClientProvider>
  );
}

export default App;
