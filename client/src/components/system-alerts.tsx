import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package, 
  DollarSign,
  TrendingDown,
  WifiOff,
  Bell,
  X,
  Shield,
  Target,
  Zap
} from 'lucide-react';
import type { SystemAlert, User } from '@shared/schema';

interface SystemAlertWithActions extends SystemAlert {
  actionButtons?: {
    label: string;
    action: () => void;
    variant: 'default' | 'destructive' | 'outline';
  }[];
}

export function SystemAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<SystemAlertWithActions | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showResolved, setShowResolved] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get system alerts
  const { data: alerts = [] } = useQuery<SystemAlertWithActions[]>({
    queryKey: ['/api/system-alerts', { 
      severity: filterSeverity !== 'all' ? filterSeverity : undefined,
      resolved: showResolved 
    }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/current-user'],
  });

  // Resolve alert
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest('POST', `/api/system-alerts/${alertId}/resolve`, {
        resolvedByUserId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
      setSelectedAlert(null);
    }
  });

  // Dismiss alert
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest('DELETE', `/api/system-alerts/${alertId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Dismissed",
        description: "The alert has been dismissed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
      setSelectedAlert(null);
    }
  });

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return <Package className="h-4 w-4" />;
      case 'margin_threshold': return <DollarSign className="h-4 w-4" />;
      case 'delivery_fail': return <AlertTriangle className="h-4 w-4" />;
      case 'system_error': return <Shield className="h-4 w-4" />;
      case 'price_anomaly': return <TrendingDown className="h-4 w-4" />;
      case 'connectivity': return <WifiOff className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertPriority = (severity: string) => {
    switch (severity) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 5;
    }
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.isResolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = unresolvedAlerts.filter(alert => alert.severity === 'high');
  const mediumAlerts = unresolvedAlerts.filter(alert => alert.severity === 'medium');

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.isResolved !== b.isResolved) {
      return a.isResolved ? 1 : -1;
    }
    return getAlertPriority(a.severity) - getAlertPriority(b.severity);
  });

  // Mock alert action handlers
  const handleLowStockAction = (alertId: number) => {
    toast({
      title: "Stock Reorder Initiated",
      description: "Purchase order has been created for low stock items.",
    });
    resolveAlertMutation.mutate(alertId);
  };

  const handleMarginThresholdAction = (alertId: number) => {
    toast({
      title: "Price Review Scheduled",
      description: "Product pricing will be reviewed by management.",
    });
    resolveAlertMutation.mutate(alertId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold">System Alerts</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-50">
            {unresolvedAlerts.length} Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Hide' : 'Show'} Resolved
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Critical</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-gray-600">Immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>High</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
            <p className="text-xs text-gray-600">High priority</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Medium</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</div>
            <p className="text-xs text-gray-600">Review required</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant={filterSeverity === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={filterSeverity === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('critical')}
            size="sm"
          >
            Critical
          </Button>
          <Button 
            variant={filterSeverity === 'high' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('high')}
            size="sm"
          >
            High
          </Button>
          <Button 
            variant={filterSeverity === 'medium' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('medium')}
            size="sm"
          >
            Medium
          </Button>
          <Button 
            variant={filterSeverity === 'low' ? 'default' : 'outline'}
            onClick={() => setFilterSeverity('low')}
            size="sm"
          >
            Low
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {sortedAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Alerts</h3>
              <p className="text-gray-600">All systems are running normally.</p>
            </CardContent>
          </Card>
        ) : (
          sortedAlerts.map(alert => (
            <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} ${alert.isResolved ? 'opacity-60' : ''}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getSeverityBadge(alert.severity)}`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.alertType)}
                      <span className="font-medium">{alert.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {alert.alertType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {alert.isResolved && (
                        <Badge className="bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {!alert.isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  <AlertDescription className="mt-2">
                    {alert.message}
                  </AlertDescription>
                  
                  {!alert.isResolved && (
                    <div className="flex space-x-2 mt-3">
                      {alert.alertType === 'low_stock' && (
                        <Button
                          size="sm"
                          onClick={() => handleLowStockAction(alert.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Reorder Stock
                        </Button>
                      )}
                      {alert.alertType === 'margin_threshold' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarginThresholdAction(alert.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Review Price
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlertMutation.mutate(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getAlertIcon(selectedAlert.alertType)}
                <span>{selectedAlert.title}</span>
                <Badge className={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alert Type</label>
                <div className="text-sm text-gray-600">{selectedAlert.alertType.replace('_', ' ').toUpperCase()}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <div className="text-sm text-gray-700 mt-1">{selectedAlert.message}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Created</label>
                <div className="text-sm text-gray-600">{new Date(selectedAlert.createdAt).toLocaleString()}</div>
              </div>
              
              {selectedAlert.relatedTable && (
                <div>
                  <label className="text-sm font-medium">Related Record</label>
                  <div className="text-sm text-gray-600">
                    {selectedAlert.relatedTable} (ID: {selectedAlert.relatedId})
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => dismissAlertMutation.mutate(selectedAlert.id)}
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={() => resolveAlertMutation.mutate(selectedAlert.id)}
                  disabled={resolveAlertMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}