import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Mail, 
  Webhook, 
  FileText, 
  Plus, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Settings,
  Link,
  Globe,
  Shield,
  Download,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierOrderIntegration {
  id: number;
  supplierId: number;
  supplierOrderId: string;
  externalOrderNumber: string;
  orderSource: string;
  orderData: any;
  orderItems: any[];
  totalAmount: string;
  currency: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  orderedBy: number;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailOrderCapture {
  id: number;
  emailSubject: string;
  emailFrom: string;
  emailTo: string;
  emailBody: string;
  extractedOrderData: any;
  parsedItems: any[];
  supplierOrderIntegrationId?: number;
  processingStatus: string;
  confidence: string;
  receivedAt: string;
  processedAt?: string;
}

interface SupplierWebhook {
  id: number;
  supplierId: number;
  webhookUrl: string;
  secretKey: string;
  eventTypes: string[];
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

export function SupplierOrderIntegration() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrderIntegration | null>(null);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isEmailSetupOpen, setIsEmailSetupOpen] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    supplierId: "",
    webhookUrl: "",
    eventTypes: [] as string[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier orders
  const { data: supplierOrders = [], isLoading } = useQuery({
    queryKey: ["supplier-order-integration"],
    queryFn: () => fetch("/api/supplier-order-integration").then(res => res.json())
  });

  // Fetch email captures
  const { data: emailCaptures = [] } = useQuery({
    queryKey: ["email-order-capture"],
    queryFn: () => fetch("/api/email-order-capture").then(res => res.json())
  });

  // Fetch webhooks
  const { data: webhooks = [] } = useQuery({
    queryKey: ["supplier-webhooks"],
    queryFn: () => fetch("/api/supplier-webhooks").then(res => res.json())
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetch("/api/suppliers").then(res => res.json())
  });

  // Approve order mutation
  const approveOrderMutation = useMutation({
    mutationFn: (orderId: number) => fetch(`/api/supplier-order-integration/${orderId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-order-integration"] });
      setSelectedOrder(null);
      toast({ 
        title: "Order Approved", 
        description: "The supplier order has been approved and added to purchase orders." 
      });
    }
  });

  // Reject order mutation
  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) => 
      fetch(`/api/supplier-order-integration/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-order-integration"] });
      setSelectedOrder(null);
      toast({ 
        title: "Order Rejected", 
        description: "The supplier order has been rejected." 
      });
    }
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/supplier-webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-webhooks"] });
      setIsWebhookDialogOpen(false);
      setWebhookForm({ supplierId: "", webhookUrl: "", eventTypes: [] });
      toast({ 
        title: "Webhook Created", 
        description: "Webhook integration has been set up successfully." 
      });
    }
  });

  // Manual order creation mutation
  const createManualOrderMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/supplier-order-integration/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-order-integration"] });
      toast({ 
        title: "Order Created", 
        description: "Manual order has been created and is pending approval." 
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval": return { label: "Pending Approval", variant: "outline", color: "bg-yellow-100 text-yellow-800" };
      case "approved": return { label: "Approved", variant: "default", color: "bg-green-100 text-green-800" };
      case "rejected": return { label: "Rejected", variant: "destructive", color: "bg-red-100 text-red-800" };
      case "received": return { label: "Received", variant: "default", color: "bg-blue-100 text-blue-800" };
      case "cancelled": return { label: "Cancelled", variant: "secondary", color: "bg-gray-100 text-gray-800" };
      default: return { label: status, variant: "secondary", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "email": return <Mail className="h-4 w-4" />;
      case "webhook": return <Webhook className="h-4 w-4" />;
      case "api": return <Globe className="h-4 w-4" />;
      case "manual": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  const pendingOrders = supplierOrders.filter((order: SupplierOrderIntegration) => order.status === "pending_approval");
  const approvedOrders = supplierOrders.filter((order: SupplierOrderIntegration) => order.status === "approved");
  const rejectedOrders = supplierOrders.filter((order: SupplierOrderIntegration) => order.status === "rejected");

  if (isLoading) {
    return <div className="p-4">Loading supplier order integration...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Order Integration</h1>
          <p className="text-gray-600">Automatically capture and approve orders from supplier websites</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEmailSetupOpen} onOpenChange={setIsEmailSetupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Setup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Integration Setup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Email Integration Instructions</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>1. Forward supplier emails to:</strong></p>
                    <code className="block bg-white p-2 rounded border">orders@kerrigansxl.com</code>
                    <p><strong>2. Set up email rules in Valerie's email client:</strong></p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Auto-forward emails from known suppliers</li>
                      <li>Include keywords: "order confirmation", "invoice", "receipt"</li>
                      <li>Forward emails containing order numbers or totals</li>
                    </ul>
                    <p><strong>3. Our AI will automatically:</strong></p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Parse order details from emails</li>
                      <li>Extract items, prices, and delivery dates</li>
                      <li>Create approval requests for management</li>
                    </ul>
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Email Setup Guide
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Up Supplier Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Supplier</Label>
                  <Select value={webhookForm.supplierId} onValueChange={(value) => setWebhookForm(prev => ({ ...prev, supplierId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://your-pos-system.com/webhook/supplier-orders"
                    value={webhookForm.webhookUrl}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => createWebhookMutation.mutate(webhookForm)}
                  disabled={createWebhookMutation.isPending}
                  className="w-full"
                >
                  Create Webhook Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => {
            // Simulate manual order creation for demonstration
            createManualOrderMutation.mutate({
              supplierId: 1,
              supplierOrderId: `MAN-${Date.now()}`,
              externalOrderNumber: `EXT-${Date.now()}`,
              orderSource: "manual",
              orderData: { note: "Manual test order" },
              orderItems: [{ name: "Test Item", quantity: 1, price: 10.00 }],
              totalAmount: 10.00,
              currency: "EUR",
              orderDate: new Date().toISOString(),
              orderedBy: 1
            });
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-green-600">{approvedOrders.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Email Captures</p>
                <p className="text-2xl font-bold text-blue-600">{emailCaptures.length}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Webhooks</p>
                <p className="text-2xl font-bold text-purple-600">{webhooks.filter((w: any) => w.isActive).length}</p>
              </div>
              <Webhook className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Approved ({approvedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Capture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.map((order: SupplierOrderIntegration) => (
            <Card key={order.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.externalOrderNumber}</CardTitle>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      {getSourceIcon(order.orderSource)}
                      {getSupplierName(order.supplierId)} • €{Number(order.totalAmount).toFixed(2)} • {order.orderItems?.length || 0} items
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadge(order.status).color}>
                      {getStatusBadge(order.status).label}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Order Date: {new Date(order.orderDate).toLocaleDateString()}
                </div>
                {order.expectedDeliveryDate && (
                  <div className="text-sm text-gray-600">
                    Expected Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {pendingOrders.length === 0 && (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No pending orders</h3>
              <p className="text-gray-600">
                All supplier orders have been processed. New orders will appear here for approval.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedOrders.map((order: SupplierOrderIntegration) => (
            <Card key={order.id} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.externalOrderNumber}</CardTitle>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      {getSourceIcon(order.orderSource)}
                      {getSupplierName(order.supplierId)} • €{Number(order.totalAmount).toFixed(2)}
                    </div>
                  </div>
                  <Badge className={getStatusBadge(order.status).color}>
                    {getStatusBadge(order.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Approved: {order.approvedAt ? new Date(order.approvedAt).toLocaleDateString() : 'N/A'}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Methods</CardTitle>
              <p className="text-gray-600">Set up automatic order capture from supplier websites</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-6 w-6 text-blue-500" />
                    <h3 className="font-semibold">Email Integration</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Forward supplier order confirmations to automatically capture order details
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsEmailSetupOpen(true)}>
                    Setup Email Rules
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Webhook className="h-6 w-6 text-purple-500" />
                    <h3 className="font-semibold">Webhook Integration</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Direct API integration with supplier platforms for real-time order sync
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsWebhookDialogOpen(true)}>
                    Add Webhook
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="h-6 w-6 text-green-500" />
                    <h3 className="font-semibold">Browser Extension</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Install browser extension to capture orders directly from supplier websites
                  </p>
                  <Button variant="outline" size="sm">
                    Download Extension
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhooks.map((webhook: SupplierWebhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{getSupplierName(webhook.supplierId)}</div>
                      <div className="text-sm text-gray-600">{webhook.webhookUrl}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.isActive ? "default" : "secondary"}>
                        {webhook.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {webhooks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No webhooks configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          {emailCaptures.map((email: EmailOrderCapture) => (
            <Card key={email.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{email.emailSubject}</CardTitle>
                    <div className="text-sm text-gray-600">
                      From: {email.emailFrom} • Confidence: {Number(email.confidence || 0).toFixed(0)}%
                    </div>
                  </div>
                  <Badge variant={email.processingStatus === "processed" ? "default" : "outline"}>
                    {email.processingStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Received: {new Date(email.receivedAt).toLocaleString()}
                </div>
                {email.extractedOrderData && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <pre>{JSON.stringify(email.extractedOrderData, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Order Review Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Order: {selectedOrder.externalOrderNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier</Label>
                  <div className="font-medium">{getSupplierName(selectedOrder.supplierId)}</div>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <div className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="font-medium">€{Number(selectedOrder.totalAmount).toFixed(2)}</div>
                </div>
                <div>
                  <Label>Source</Label>
                  <div className="font-medium flex items-center gap-2">
                    {getSourceIcon(selectedOrder.orderSource)}
                    {selectedOrder.orderSource}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name || item.description}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">€{Number(item.price || item.unitPrice || 0).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Total: €{(Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => rejectOrderMutation.mutate({ 
                    orderId: selectedOrder.id, 
                    reason: "Manual rejection" 
                  })}
                  disabled={rejectOrderMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => approveOrderMutation.mutate(selectedOrder.id)}
                  disabled={approveOrderMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Create Purchase Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}