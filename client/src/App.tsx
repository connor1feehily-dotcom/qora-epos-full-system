import { useState, useEffect } from "react";
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
import { OneTapPOS } from "@/components/one-tap-pos";
import { CustomerDisplayPage } from "@/components/customer-display";
import { BackOfficeLayout } from "@/components/back-office/back-office-layout";
import { InactiveScreen } from "@/components/inactive-screen";
import BackOffice from "@/pages/back-office";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import TillManagementPage from "@/pages/till-management";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function POSRouter({ tillId, onBackToMenu, onGoInactive }: { tillId: string; onBackToMenu: () => void; onGoInactive?: () => void }) {
  return (
    <OneTapPOS tillId={tillId} onBackToMenu={onBackToMenu} onGoInactive={onGoInactive} />
  );
}

function BackOfficeRouter({ onBackToMenu }: { onBackToMenu: () => void }) {
  return <BackOfficeLayout onBackToMenu={onBackToMenu} />;
}

type AppMode = 'main-menu' | 'staff-login' | 'pos' | 'back-office' | 'inactive';

function AppContent() {
  const [mode, setMode] = useState<AppMode>('main-menu');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Auto-seed the database on first load with 25-second loading
  const { data: seedResult, isLoading: isSeeding } = useAutoSeed();

  const handleActivateFromInactive = () => {
    setMode('main-menu');
    setLastActivity(new Date());
  };

  const handleGoInactive = () => {
    setMode('inactive');
    setLastActivity(new Date());
  };

  const handleModeSelect = (selectedMode: 'pos' | 'back-office', tillId?: string) => {
    if (selectedMode === 'pos' && tillId) {
      setSelectedTill(tillId);
      setMode('pos');
    } else if (selectedMode === 'back-office') {
      setMode('back-office');
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
        <POSRouter tillId={selectedTill} onBackToMenu={handleBackToMenu} onGoInactive={handleGoInactive} />
      )}
      {mode === 'back-office' && (
        <BackOfficeRouter onBackToMenu={handleBackToMenu} />
      )}
      {mode === 'inactive' && (
        <InactiveScreen onActivate={handleActivateFromInactive} lastActivity={lastActivity} />
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
