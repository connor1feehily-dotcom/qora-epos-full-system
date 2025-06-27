import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Edit, Trash2, AlertTriangle, Search, Filter, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeliveryScanner } from "./delivery-scanner";

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: string;
  cost: string;
  category: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  vatRate: string;
}

export function InventoryManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showDeliveryScanner, setShowDeliveryScanner] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    price: "",
    cost: "",
    category: "",
    stock: "",
    minStock: "",
    vatRate: "23.00"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Product created successfully" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({ title: "Product updated successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted successfully" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      barcode: "",
      price: "",
      cost: "",
      category: "",
      stock: "",
      minStock: "",
      vatRate: "23.00"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      vatRate: parseFloat(formData.vatRate)
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      cost: product.cost,
      category: product.category,
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      vatRate: product.vatRate
    });
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map((p: Product) => p.category))];
  const lowStockProducts = products.filter((p: Product) => p.stock <= p.minStock);

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: "Out of Stock", color: "destructive" };
    if (product.stock <= product.minStock) return { status: "Low Stock", color: "secondary" };
    return { status: "In Stock", color: "default" };
  };

  if (isLoading) {
    return <div className="p-4">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Manage products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowDeliveryScanner(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Truck className="w-4 h-4 mr-2" />
            Scan Delivery for Valerie
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost (€)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  value={formData.vatRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vatRate: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingProduct ? "Update" : "Create"}
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

      {/* Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Stock Alerts ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.slice(0, 6).map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>
                  <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                    {product.stock === 0 ? "Out" : "Low"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product: Product) => {
          const stockStatus = getStockStatus(product);
          return (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(product)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">€{product.price}</span>
                    <Badge variant={stockStatus.color as any}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Barcode: {product.barcode}</p>
                    <p>Stock: {product.stock} / Min: {product.minStock}</p>
                    <p>Cost: €{product.cost} | VAT: {product.vatRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter ? "Try adjusting your filters" : "Add your first product to get started"}
          </p>
          <Button onClick={() => { resetForm(); setEditingProduct(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Card>
      )}

      {/* Delivery Scanner Modal */}
      {showDeliveryScanner && (
        <DeliveryScanner onClose={() => setShowDeliveryScanner(false)} />
      )}
    </div>
  );
}