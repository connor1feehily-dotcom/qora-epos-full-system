import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Edit, Truck, Package, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  status: string;
  totalAmount: string;
  orderDate: string;
  expectedDate: string;
  receivedDate: string;
  createdBy: number;
  notes: string;
}

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

export function PurchaseOrderManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    expectedDate: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => fetch("/api/purchase-orders").then(res => res.json())
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetch("/api/suppliers").then(res => res.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Purchase order created successfully" });
    }
  });

  const resetForm = () => {
    setFormData({
      supplierId: "",
      expectedDate: "",
      notes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      supplierId: parseInt(formData.supplierId),
      poNumber: `PO-${Date.now()}`,
      createdBy: 1, // Current user ID
      status: "pending"
    };

    createMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return { label: "Pending", variant: "outline", icon: Clock };
      case "sent": return { label: "Sent", variant: "default", icon: Truck };
      case "received": return { label: "Received", variant: "default", icon: CheckCircle };
      case "cancelled": return { label: "Cancelled", variant: "destructive", icon: null };
      default: return { label: status, variant: "secondary", icon: null };
    }
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s: Supplier) => s.id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  const pendingOrders = purchaseOrders.filter((po: PurchaseOrder) => po.status === "pending");
  const receivedOrders = purchaseOrders.filter((po: PurchaseOrder) => po.status === "received");

  if (isLoading) {
    return <div className="p-4">Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Order Management</h2>
          <p className="text-gray-600">Manage supplier orders and deliveries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: Supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or notes..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Order
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase Order Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold">{receivedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {purchaseOrders.filter((po: PurchaseOrder) => {
                    const orderDate = new Date(po.orderDate);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {purchaseOrders.map((order: PurchaseOrder) => {
          const status = getStatusBadge(order.status);
          const StatusIcon = status.icon;
          
          return (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{order.poNumber}</h3>
                    <p className="text-sm text-gray-600">{getSupplierName(order.supplierId)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {StatusIcon && <StatusIcon className="w-4 h-4" />}
                    <Badge variant={status.variant as any}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected</p>
                      <p className="font-medium">
                        {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : "TBD"}
                      </p>
                    </div>
                  </div>

                  {order.totalAmount && (
                    <div className="text-sm">
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold">€{order.totalAmount}</p>
                    </div>
                  )}

                  {order.notes && (
                    <div className="text-sm">
                      <p className="text-gray-600">Notes</p>
                      <p className="text-gray-800">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {order.status === "pending" && (
                      <Button size="sm" variant="outline">
                        <Truck className="w-3 h-3 mr-1" />
                        Mark Sent
                      </Button>
                    )}
                    {order.status === "sent" && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Received
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {purchaseOrders.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No purchase orders</h3>
          <p className="text-gray-600 mb-4">
            Create your first purchase order to manage supplier deliveries
          </p>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Order
          </Button>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Package className="w-6 h-6" />
              <span className="font-medium">Receive Delivery</span>
              <span className="text-xs text-gray-500">Mark orders as received</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span className="font-medium">Generate Report</span>
              <span className="text-xs text-gray-500">Order history & analytics</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Truck className="w-6 h-6" />
              <span className="font-medium">Manage Suppliers</span>
              <span className="text-xs text-gray-500">Add & edit supplier info</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}