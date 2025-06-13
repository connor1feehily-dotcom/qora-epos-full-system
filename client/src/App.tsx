import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TillSelector } from "@/components/till-selector";
import { Sidebar } from "@/components/sidebar";
import POS from "@/pages/pos";
import BackOffice from "@/pages/back-office";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function POSRouter({ tillId }: { tillId: string }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <TillSelector onSelectTill={() => {}} selectedTill={tillId} />
      <div className="flex-1">
        <POS tillId={tillId} />
      </div>
    </div>
  );
}

function BackOfficeRouter({ onSelectTill }: { onSelectTill: (tillId: string) => void }) {
  return (
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
  );
}

function App() {
  const [selectedMode, setSelectedMode] = useState<string>('');

  const handleSelectTill = (tillId: string) => {
    setSelectedMode(tillId);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!selectedMode ? (
          <TillSelector onSelectTill={handleSelectTill} />
        ) : selectedMode === 'backoffice' ? (
          <BackOfficeRouter onSelectTill={handleSelectTill} />
        ) : (
          <POSRouter tillId={selectedMode} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
