import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, TrendingDown, Barcode } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import type { Product } from "@shared/schema";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  price: z.string().min(1, "Price is required"),
  cost: z.string().optional(),
  stock: z.string().min(1, "Stock is required"),
  minStock: z.string().min(1, "Minimum stock is required"),
  vatRate: z.string().min(1, "VAT rate is required"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Inventory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      barcode: "",
      price: "",
      cost: "",
      category: "",
      stock: "",
      minStock: "",
      vatRate: "23.00",
      isActive: true,
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        ...data,
        price: data.price,
        cost: data.cost || "0.00",
        stock: parseInt(data.stock),
        minStock: parseInt(data.minStock),
        vatRate: data.vatRate,
      };

      if (editingProduct) {
        return apiRequest('PUT', `/api/products/${editingProduct.id}`, productData);
      } else {
        return apiRequest('POST', '/api/products', productData);
      }
    },
    onSuccess: () => {
      toast({
        title: editingProduct ? "Product Updated" : "Product Created",
        description: editingProduct ? "Product updated successfully" : "New product added to inventory",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product removed from inventory",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + (p.stock * parseFloat(p.cost?.toString() || '0')), 0);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      barcode: product.barcode || "",
      price: product.price.toString(),
      cost: product.cost?.toString() || "",
      category: product.category,
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      vatRate: product.vatRate.toString(),
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const onSubmit = (data: ProductFormData) => {
    productMutation.mutate(data);
  };

  const handleBarcodeScan = (barcode: string) => {
    if (dialogOpen) {
      // If dialog is open, set barcode in form
      form.setValue('barcode', barcode);
      toast({
        title: "Barcode Scanned",
        description: `Barcode ${barcode} added to form`,
      });
    } else {
      // If dialog is closed, use barcode for search
      setSearchQuery(barcode);
      toast({
        title: "Searching by Barcode",
        description: `Searching for product with barcode: ${barcode}`,
      });
    }
    setBarcodeScannerOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Inventory Management</h2>
            <p className="text-sm text-gray-600">Manage products, stock levels, and pricing</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode (Optional)</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBarcodeScannerOpen(true)}
                          >
                            <Barcode className="w-4 h-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (€)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (€)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Drinks">Drinks</SelectItem>
                            <SelectItem value="Food">Food</SelectItem>
                            <SelectItem value="Fuel">Fuel</SelectItem>
                            <SelectItem value="Hot Drinks">Hot Drinks</SelectItem>
                            <SelectItem value="News">News</SelectItem>
                            <SelectItem value="Tobacco">Tobacco</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Stock</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Rate (%)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0.00">0% (Zero Rate)</SelectItem>
                            <SelectItem value="13.50">13.5% (Reduced Rate)</SelectItem>
                            <SelectItem value="23.00">23% (Standard Rate)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingProduct(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={productMutation.isPending}
                    >
                      {productMutation.isPending ? 'Saving...' : (editingProduct ? 'Update' : 'Add Product')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Inventory Overview */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-semibold text-gray-900">€{totalValue.toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <span className="text-success font-semibold">€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-semibold text-error">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-hidden p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setBarcodeScannerOpen(true);
              }}
            >
              <Barcode className="w-4 h-4 mr-2" />
              Scan to Search
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                          Loading products...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchQuery ? 'No products found matching your search' : 'No products in inventory'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLowStock = product.stock <= product.minStock;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.barcode && (
                                <p className="text-sm text-gray-500">{product.barcode}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>€{parseFloat(product.price.toString()).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className={isLowStock ? 'text-error font-medium' : ''}>
                                {product.stock}
                              </span>
                              {isLowStock && <TrendingDown className="w-4 h-4 text-error" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : product.stock > product.minStock * 2 ? (
                              <Badge className="bg-success text-white">In Stock</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product)}
                                className="text-error hover:text-error"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}
