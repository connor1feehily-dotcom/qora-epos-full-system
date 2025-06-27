import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Save, X, Grid, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PosButton {
  id: number;
  tillId: string;
  buttonType: "product" | "category" | "action" | "payment";
  label: string;
  position: number;
  color: string;
  productId?: number;
  categoryName?: string;
  actionType?: string;
  paymentMethod?: string;
  isActive: boolean;
}

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
}

interface PosButtonConfiguratorProps {
  tillId: string;
}

export function PosButtonConfigurator({ tillId }: PosButtonConfiguratorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<PosButton | null>(null);
  const [draggedButton, setDraggedButton] = useState<PosButton | null>(null);
  const [formData, setFormData] = useState({
    buttonType: "product" as const,
    label: "",
    color: "#3b82f6",
    productId: "",
    categoryName: "",
    actionType: "",
    paymentMethod: "",
    position: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buttons = [], isLoading } = useQuery({
    queryKey: ["pos-buttons", tillId],
    queryFn: () => fetch(`/api/pos-buttons?tillId=${tillId}`).then(res => res.json())
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/pos-buttons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-buttons"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Button created successfully" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      fetch(`/api/pos-buttons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-buttons"] });
      setIsDialogOpen(false);
      setEditingButton(null);
      resetForm();
      toast({ title: "Button updated successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/pos-buttons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-buttons"] });
      toast({ title: "Button deleted successfully" });
    }
  });

  const resetForm = () => {
    setFormData({
      buttonType: "product",
      label: "",
      color: "#3b82f6",
      productId: "",
      categoryName: "",
      actionType: "",
      paymentMethod: "",
      position: buttons.length
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      tillId,
      buttonType: formData.buttonType,
      label: formData.label,
      color: formData.color,
      position: formData.position,
      ...(formData.buttonType === "product" && { productId: parseInt(formData.productId) }),
      ...(formData.buttonType === "category" && { categoryName: formData.categoryName }),
      ...(formData.buttonType === "action" && { actionType: formData.actionType }),
      ...(formData.buttonType === "payment" && { paymentMethod: formData.paymentMethod })
    };

    if (editingButton) {
      updateMutation.mutate({ id: editingButton.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const startEdit = (button: PosButton) => {
    setEditingButton(button);
    setFormData({
      buttonType: button.buttonType,
      label: button.label,
      color: button.color,
      productId: button.productId?.toString() || "",
      categoryName: button.categoryName || "",
      actionType: button.actionType || "",
      paymentMethod: button.paymentMethod || "",
      position: button.position
    });
    setIsDialogOpen(true);
  };

  const handleDragStart = (button: PosButton) => {
    setDraggedButton(button);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetButton: PosButton) => {
    if (draggedButton && draggedButton.id !== targetButton.id) {
      // Swap positions
      updateMutation.mutate({
        id: draggedButton.id,
        data: { position: targetButton.position }
      });
      updateMutation.mutate({
        id: targetButton.id,
        data: { position: draggedButton.position }
      });
    }
    setDraggedButton(null);
  };

  const getButtonTypeIcon = (type: string) => {
    switch (type) {
      case "product": return "🛍️";
      case "category": return "📂";
      case "action": return "⚡";
      case "payment": return "💳";
      default: return "🔘";
    }
  };

  const getButtonDescription = (button: PosButton) => {
    switch (button.buttonType) {
      case "product":
        const product = products.find((p: Product) => p.id === button.productId);
        return product ? `${product.name} - €${product.price}` : "Product not found";
      case "category":
        return `Category: ${button.categoryName}`;
      case "action":
        return `Action: ${button.actionType}`;
      case "payment":
        return `Payment: ${button.paymentMethod}`;
      default:
        return "Unknown type";
    }
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#ef4444", label: "Red" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Yellow" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#6b7280", label: "Gray" }
  ];

  const sortedButtons = [...buttons].sort((a, b) => a.position - b.position);

  if (isLoading) {
    return <div className="p-4">Loading POS button configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">POS Button Configuration</h2>
          <p className="text-gray-600">Configure custom buttons for {tillId}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingButton(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Button
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingButton ? "Edit Button" : "Create New Button"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="buttonType">Button Type</Label>
                <Select 
                  value={formData.buttonType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, buttonType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="label">Button Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="color">Button Color</Label>
                <Select 
                  value={formData.color} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.buttonType === "product" && (
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select 
                    value={formData.productId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - €{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.buttonType === "category" && (
                <div>
                  <Label htmlFor="category">Category Name</Label>
                  <Input
                    id="category"
                    value={formData.categoryName}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
                    required
                  />
                </div>
              )}

              {formData.buttonType === "action" && (
                <div>
                  <Label htmlFor="action">Action Type</Label>
                  <Select 
                    value={formData.actionType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, actionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="void">Void Item</SelectItem>
                      <SelectItem value="hold">Hold Transaction</SelectItem>
                      <SelectItem value="receipt">Print Receipt</SelectItem>
                      <SelectItem value="no-sale">No Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.buttonType === "payment" && (
                <div>
                  <Label htmlFor="payment">Payment Method</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="voucher">Voucher</SelectItem>
                      <SelectItem value="loyalty">Loyalty Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingButton ? "Update" : "Create"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedButtons.map((button: PosButton) => (
          <Card 
            key={button.id}
            className="cursor-move hover:shadow-lg transition-shadow"
            draggable
            onDragStart={() => handleDragStart(button)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(button)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getButtonTypeIcon(button.buttonType)}</span>
                  <Badge variant="outline">{button.buttonType}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(button)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(button.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full h-16 rounded flex items-center justify-center text-white font-medium mb-2"
                style={{ backgroundColor: button.color }}
              >
                {button.label}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {getButtonDescription(button)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Position: {button.position}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedButtons.length === 0 && (
        <Card className="p-8 text-center">
          <Grid className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No buttons configured</h3>
          <p className="text-gray-600 mb-4">
            Create custom buttons to streamline your POS operations
          </p>
          <Button onClick={() => { resetForm(); setEditingButton(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Button
          </Button>
        </Card>
      )}
    </div>
  );
}