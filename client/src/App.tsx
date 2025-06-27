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
import { ModernPOSInterface } from "@/components/modern-pos-interface";
import { CustomerDisplayPage } from "@/components/customer-display";
import { BackOfficeDashboard } from "@/components/back-office-dashboard";
import { InactiveScreen } from "@/components/inactive-screen";
import ValBotAssistant from "@/components/valbot-assistant";
import MobileCompanion from "@/components/mobile-companion";
import BackOffice from "@/pages/back-office";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import TillManagementPage from "@/pages/till-management";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function POSRouter({ tillId, onBackToMenu, onGoInactive, currentUser }: { tillId: string; onBackToMenu: () => void; onGoInactive?: () => void; currentUser?: User }) {
  return (
    <ModernPOSInterface tillId={tillId} onBackToMenu={onBackToMenu} onGoInactive={onGoInactive} currentUser={currentUser} />
  );
}

function BackOfficeRouter({ onBackToMenu, currentUser }: { onBackToMenu: () => void; currentUser?: User }) {
  return <BackOfficeDashboard onBackToMenu={onBackToMenu} currentUser={currentUser} />;
}

type AppMode = 'main-menu' | 'staff-login' | 'pos' | 'back-office' | 'inactive';

function AppContent() {
  const [mode, setMode] = useState<AppMode>('main-menu');
  const [selectedTill, setSelectedTill] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Debug mode changes
  useEffect(() => {
    console.log("App mode changed to:", mode);
  }, [mode]);

  // Auto-seed the database on first load with 25-second loading
  const { data: seedResult, isLoading: isSeeding } = useAutoSeed();

  const handleActivateFromInactive = () => {
    setMode('main-menu');
    setLastActivity(new Date());
  };

  const handleGoInactive = () => {
    console.log("Setting mode to inactive");
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
        <POSRouter tillId={selectedTill} onBackToMenu={handleBackToMenu} onGoInactive={handleGoInactive} currentUser={currentUser || undefined} />
      )}
      {mode === 'back-office' && (
        <BackOfficeRouter onBackToMenu={handleBackToMenu} currentUser={currentUser || undefined} />
      )}
      {mode === 'inactive' ? (
        <InactiveScreen onActivate={handleActivateFromInactive} lastActivity={lastActivity} />
      ) : null}

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
