import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, InsertProduct } from "@shared/schema";

export function SimpleProductManager() {
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    barcode: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const addProductMutation = useMutation({
    mutationFn: async (product: InsertProduct) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error('Failed to add product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setNewProduct({ name: "", price: "", barcode: "" });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/products/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    const product: InsertProduct = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      barcode: newProduct.barcode || null,
      category: "General",
      stockQuantity: 100,
      isActive: true
    };

    addProductMutation.mutate(product);
  };

  const quickProducts = [
    { name: "Coca Cola 500ml", price: 2.50, barcode: "5449000000996" },
    { name: "Bread White Sliced", price: 1.80, barcode: "5000169077870" },
    { name: "Milk 1L", price: 1.20, barcode: "5000169021507" },
    { name: "Coffee 250g", price: 4.99, barcode: "8714100776124" },
    { name: "Tea Bags 80pk", price: 3.49, barcode: "5000169082515" }
  ];

  const addQuickProduct = (product: { name: string; price: number; barcode: string }) => {
    const insertProduct: InsertProduct = {
      name: product.name,
      price: product.price,
      barcode: product.barcode,
      category: "General",
      stockQuantity: 100,
      isActive: true
    };
    addProductMutation.mutate(insertProduct);
  };

  if (isLoading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Package className="h-6 w-6 text-cyan-600" />
        <h2 className="text-2xl font-bold">Product Manager</h2>
        <Badge variant="outline">{products.length} products</Badge>
      </div>

      {/* Quick Add Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Common Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {quickProducts.map((product, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 text-left"
                onClick={() => addQuickProduct(product)}
                disabled={addProductMutation.isPending}
              >
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">€{product.price.toFixed(2)}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <Input
              placeholder="Price (€)"
              type="number"
              step="0.01"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <Input
              placeholder="Barcode (optional)"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
            />
            <Button
              onClick={handleAddProduct}
              disabled={addProductMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Add some products above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      €{product.price.toFixed(2)}
                      {product.barcode && ` • ${product.barcode}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    disabled={deleteProductMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}