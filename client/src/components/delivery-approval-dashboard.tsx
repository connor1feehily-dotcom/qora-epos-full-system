import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Check, 
  X, 
  Edit,
  Eye,
  Package,
  Calculator,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { DeliveryDocket, DeliveryItem, User } from '@shared/schema';

interface DeliveryApprovalDashboardProps {
  currentUser: User;
}

interface DeliveryWithItems extends DeliveryDocket {
  items: DeliveryItem[];
  scannedByUser: User;
}

export function DeliveryApprovalDashboard({ currentUser }: DeliveryApprovalDashboardProps) {
  const [selectedDocket, setSelectedDocket] = useState<DeliveryWithItems | null>(null);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState<{
    suggestedPrice: number;
    approvedPrice: number;
    marginPercentage: number;
  }>({
    suggestedPrice: 0,
    approvedPrice: 0,
    marginPercentage: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pending delivery dockets
  const { data: pendingDockets = [] } = useQuery<DeliveryWithItems[]>({
    queryKey: ['/api/delivery/pending'],
  });

  // Get approved dockets
  const { data: approvedDockets = [] } = useQuery<DeliveryWithItems[]>({
    queryKey: ['/api/delivery/approved'],
  });

  // Approve entire docket
  const approveDocketMutation = useMutation({
    mutationFn: async (docketId: number) => {
      const response = await apiRequest('POST', `/api/delivery/dockets/${docketId}/approve`, {
        approvedByUserId: currentUser.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Docket Approved",
        description: "The delivery has been approved and stock will be updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery'] });
      setSelectedDocket(null);
    }
  });

  // Reject docket
  const rejectDocketMutation = useMutation({
    mutationFn: async (docketId: number) => {
      const response = await apiRequest('POST', `/api/delivery/dockets/${docketId}/reject`, {
        approvedByUserId: currentUser.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Docket Rejected",
        description: "The delivery has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery'] });
      setSelectedDocket(null);
    }
  });

  // Update item pricing
  const updateItemPricingMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest('PATCH', `/api/delivery/items/${itemId}`, {
        suggestedPrice: priceAdjustment.suggestedPrice,
        approvedPrice: priceAdjustment.approvedPrice,
        marginPercentage: priceAdjustment.marginPercentage,
        approvalStatus: 'approved'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pricing Updated",
        description: "Item pricing has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery'] });
      setEditingItem(null);
    }
  });

  const calculateMargin = (cost: number, price: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const calculateSuggestedPrice = (cost: number, targetMargin: number = 30) => {
    return cost / (1 - targetMargin / 100);
  };

  const handlePriceChange = (cost: number, price: number) => {
    const margin = calculateMargin(cost, price);
    setPriceAdjustment(prev => ({
      ...prev,
      approvedPrice: price,
      marginPercentage: margin
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Approval Dashboard</h1>
        <Badge variant="outline" className="bg-blue-50">
          {pendingDockets.length} Pending Approvals
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingDockets.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <Check className="h-4 w-4 mr-2" />
            Approved ({approvedDockets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDockets.map(docket => (
            <Card key={docket.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{docket.docketNumber}</CardTitle>
                    <div className="text-sm text-gray-600">
                      {docket.supplierName} • {docket.totalItems} items • £{Number(docket.totalValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(docket.status)}>
                      {docket.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocket(docket)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Scanned by: {docket.scannedByUser?.firstName} {docket.scannedByUser?.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  Delivery Date: {new Date(docket.deliveryDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedDockets.map(docket => (
            <Card key={docket.id} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{docket.docketNumber}</CardTitle>
                    <div className="text-sm text-gray-600">
                      {docket.supplierName} • {docket.totalItems} items • £{Number(docket.totalValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(docket.status)}>
                    {docket.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Approved: {docket.approvedAt ? new Date(docket.approvedAt).toLocaleDateString() : 'N/A'}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Detailed Review Modal */}
      {selectedDocket && (
        <Dialog open={!!selectedDocket} onOpenChange={() => setSelectedDocket(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Delivery: {selectedDocket.docketNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Docket Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier</Label>
                  <div className="font-medium">{selectedDocket.supplierName}</div>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <div className="font-medium">{new Date(selectedDocket.deliveryDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Scanned By</Label>
                  <div className="font-medium">
                    {selectedDocket.scannedByUser?.firstName} {selectedDocket.scannedByUser?.lastName}
                  </div>
                </div>
                <div>
                  <Label>Total Value</Label>
                  <div className="font-medium">£{Number(selectedDocket.totalValue || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Items Review */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Items Review</h3>
                <div className="space-y-3">
                  {selectedDocket.items?.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-600">
                            {item.barcode} • Qty: {item.quantity} • Cost: £{Number(item.unitCost || 0).toFixed(2)}
                          </div>
                          {item.suggestedPrice && (
                            <div className="text-sm">
                              Suggested Price: £{Number(item.suggestedPrice || 0).toFixed(2)} • 
                              Margin: {Number(item.marginPercentage || 0).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            item.isMatched ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }>
                            {item.isMatched ? 'Matched' : 'New'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setPriceAdjustment({
                                suggestedPrice: calculateSuggestedPrice(Number(item.unitCost || 0)),
                                approvedPrice: Number(item.approvedPrice || item.suggestedPrice || 0),
                                marginPercentage: Number(item.marginPercentage || 30)
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Approval Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => rejectDocketMutation.mutate(selectedDocket.id)}
                  disabled={rejectDocketMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => approveDocketMutation.mutate(selectedDocket.id)}
                  disabled={approveDocketMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Update Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Price Adjustment Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Price Adjustment - {editingItem.productName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Cost Price</Label>
                <div className="font-medium">£{Number(Number(editingItem.unitCost || 0)).toFixed(2)}</div>
              </div>
              
              <div>
                <Label>Suggested Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceAdjustment.suggestedPrice}
                  onChange={(e) => setPriceAdjustment(prev => ({
                    ...prev,
                    suggestedPrice: parseFloat(e.target.value)
                  }))}
                />
              </div>
              
              <div>
                <Label>Approved Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceAdjustment.approvedPrice}
                  onChange={(e) => handlePriceChange(
                    Number(editingItem.unitCost || 0),
                    parseFloat(e.target.value)
                  )}
                />
              </div>
              
              <div>
                <Label>Margin Percentage</Label>
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-lg">
                    {priceAdjustment.marginPercentage.toFixed(1)}%
                  </div>
                  <Badge className={
                    priceAdjustment.marginPercentage >= 30 ? 'bg-green-100 text-green-800' : 
                    priceAdjustment.marginPercentage >= 20 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }>
                    {priceAdjustment.marginPercentage >= 30 ? 'Good' : 
                     priceAdjustment.marginPercentage >= 20 ? 'Average' : 'Low'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateItemPricingMutation.mutate(editingItem.id)}
                  disabled={updateItemPricingMutation.isPending}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Update Pricing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}