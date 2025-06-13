import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TillManagement } from "@/components/till-management";
import { TillSelector } from "@/components/till-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface TillManagementPageProps {
  currentUser: any;
}

export default function TillManagementPage({ currentUser }: TillManagementPageProps) {
  const [selectedTill, setSelectedTill] = useState<string>("till1");

  // Fetch till sessions for overview
  const { data: tillSessions = [] } = useQuery({
    queryKey: ["/api/till/sessions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/till/till1/sessions");
      const till1Sessions = await response.json();
      const response2 = await apiRequest("GET", "/api/till/till2/sessions");
      const till2Sessions = await response2.json();
      return [...till1Sessions, ...till2Sessions];
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Licensed to text */}
      <div className="text-center text-sm text-muted-foreground mb-6">
        Licensed to Kerrigan's XL from The Feehily Boyle Group
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Till Management</h1>
      </div>

      {/* Till Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Till 1 Status</CardTitle>
            <CardDescription>Primary checkout till</CardDescription>
          </CardHeader>
          <CardContent>
            <TillOverview tillId="till1" sessions={tillSessions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Till 2 Status</CardTitle>
            <CardDescription>Secondary checkout till</CardDescription>
          </CardHeader>
          <CardContent>
            <TillOverview tillId="till2" sessions={tillSessions} />
          </CardContent>
        </Card>
      </div>

      {/* Till Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Till to Manage</CardTitle>
          <CardDescription>Choose which till to manage</CardDescription>
        </CardHeader>
        <CardContent>
          <TillSelector onSelectTill={setSelectedTill} selectedTill={selectedTill} />
        </CardContent>
      </Card>

      {/* Till Management Component */}
      {selectedTill && (
        <TillManagement 
          tillId={selectedTill}
          userId={currentUser?.id}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
}

function TillOverview({ tillId, sessions }: { tillId: string; sessions: any[] }) {
  const tillSessions = sessions.filter(s => s.tillId === tillId);
  const activeSession = tillSessions.find(s => s.isActive);
  
  return (
    <div className="space-y-2">
      {activeSession ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-green-600 font-bold">OPEN</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Opening Float:</span>
            <span className="font-medium">€{parseFloat(activeSession.openingFloat).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Opened:</span>
            <span className="text-sm">{new Date(activeSession.openedAt).toLocaleTimeString()}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <span className="text-red-600 font-bold">CLOSED</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-medium">Total Sessions Today:</span>
        <span className="font-medium">{tillSessions.length}</span>
      </div>
    </div>
  );
}