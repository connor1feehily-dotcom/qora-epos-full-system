import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Calculator, FileText, Printer } from "lucide-react";

interface TillManagementProps {
  tillId: string;
  userId: number;
  userRole: string;
}

interface TillSession {
  id: number;
  tillId: string;
  userId: number;
  openingFloat: string;
  closingFloat: string | null;
  expectedCash: string | null;
  actualCash: string | null;
  variance: string | null;
  openedAt: string;
  closedAt: string | null;
  isActive: boolean;
}

interface DailyReport {
  id: number;
  tillId: string;
  reportType: string;
  reportDate: string;
  totalSales: string;
  totalVat: string;
  transactionCount: number;
  cashSales: string;
  cardSales: string;
  openingFloat: string | null;
  closingFloat: string | null;
  generatedBy: number;
}

export function TillManagement({ tillId, userId, userRole }: TillManagementProps) {
  const [openingFloat, setOpeningFloat] = useState("");
  const [closingFloat, setClosingFloat] = useState("");
  const [actualCash, setActualCash] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current till session
  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/till", tillId, "session"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/till/${tillId}/session`);
      return await response.json();
    }
  });

  // Fetch daily reports
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports", tillId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/reports?tillId=${tillId}`);
      return await response.json();
    }
  });

  // Open till mutation
  const openTillMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/till/open", {
        tillId,
        userId,
        openingFloat: parseFloat(openingFloat)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Till Opened",
        description: `Till ${tillId} opened successfully with €${openingFloat} float`,
      });
      setOpeningFloat("");
      queryClient.invalidateQueries({ queryKey: ["/api/till", tillId, "session"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open till",
        variant: "destructive",
      });
    }
  });

  // Close till mutation
  const closeTillMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/till/close", {
        sessionId: currentSession.id,
        closingFloat: parseFloat(closingFloat),
        actualCash: parseFloat(actualCash)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Till Closed",
        description: `Till ${tillId} closed successfully`,
      });
      setClosingFloat("");
      setActualCash("");
      queryClient.invalidateQueries({ queryKey: ["/api/till", tillId, "session"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close till",
        variant: "destructive",
      });
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportType: 'X' | 'Z') => {
      const response = await apiRequest("POST", "/api/reports/generate", {
        tillId,
        reportType,
        generatedBy: userId
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: `${variables} Report Generated`,
        description: `${variables} report generated successfully for ${tillId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports", tillId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    }
  });

  // Open cash drawer mutation
  const openDrawerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/till/open-drawer", { tillId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cash Drawer Opened",
        description: `Cash drawer for ${tillId} opened`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open cash drawer",
        variant: "destructive",
      });
    }
  });

  const canManageTill = userRole === 'admin' || userRole === 'manager';
  const tillIsOpen = currentSession && currentSession.isActive;

  if (sessionLoading) {
    return <div className="p-6">Loading till information...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Licensed to text */}
      <div className="text-center text-sm text-muted-foreground mb-6">
        Licensed to Kerrigan's XL from The Feehily Boyle Group
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Till Management - {tillId.toUpperCase()}</h1>
        <Badge variant={tillIsOpen ? "default" : "secondary"}>
          {tillIsOpen ? "Open" : "Closed"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Till Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Till Status
            </CardTitle>
            <CardDescription>Current till session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tillIsOpen ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Opening Float</Label>
                    <p className="text-lg font-bold">€{parseFloat(currentSession.openingFloat).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Opened At</Label>
                    <p className="text-sm">{new Date(currentSession.openedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {canManageTill && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium">Close Till</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="closingFloat">Closing Float (€)</Label>
                        <Input
                          id="closingFloat"
                          type="number"
                          step="0.01"
                          value={closingFloat}
                          onChange={(e) => setClosingFloat(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="actualCash">Actual Cash (€)</Label>
                        <Input
                          id="actualCash"
                          type="number"
                          step="0.01"
                          value={actualCash}
                          onChange={(e) => setActualCash(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => closeTillMutation.mutate()}
                      disabled={!closingFloat || !actualCash || closeTillMutation.isPending}
                      className="w-full"
                    >
                      {closeTillMutation.isPending ? "Closing..." : "Close Till"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Till is currently closed</p>
                {canManageTill && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium">Open Till</h4>
                    <div>
                      <Label htmlFor="openingFloat">Opening Float (€)</Label>
                      <Input
                        id="openingFloat"
                        type="number"
                        step="0.01"
                        value={openingFloat}
                        onChange={(e) => setOpeningFloat(e.target.value)}
                        placeholder="200.00"
                      />
                    </div>
                    <Button
                      onClick={() => openTillMutation.mutate()}
                      disabled={!openingFloat || openTillMutation.isPending}
                      className="w-full"
                    >
                      {openTillMutation.isPending ? "Opening..." : "Open Till"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Till operations and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => openDrawerMutation.mutate()}
              disabled={openDrawerMutation.isPending}
              className="w-full"
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              {openDrawerMutation.isPending ? "Opening..." : "Open Cash Drawer"}
            </Button>

            {canManageTill && (
              <>
                <Button
                  onClick={() => generateReportMutation.mutate('X')}
                  disabled={generateReportMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate X Report
                </Button>

                <Button
                  onClick={() => generateReportMutation.mutate('Z')}
                  disabled={generateReportMutation.isPending}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Z Report (End of Day)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      {canManageTill && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Daily X and Z reports for this till</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 5).map((report: DailyReport) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={report.reportType === 'Z' ? "default" : "secondary"}>
                      {report.reportType} Report
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {new Date(report.reportDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">€{parseFloat(report.totalSales).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Cash: €{parseFloat(report.cashSales).toFixed(2)} | 
                      Card: €{parseFloat(report.cardSales).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}