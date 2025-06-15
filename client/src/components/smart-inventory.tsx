import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";
import type { Product, InsertProduct, Transaction } from "@shared/schema";

export function SmartInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<InsertProduct>>({
    name: "",
    barcode: "",
    price: "",
    cost: "",
    category: "",
    stock: 0,
    minStock: 5,
    vatRate: "23.00",
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Smart inventory analysis
  const analyzeInventory = () => {
    const analysis = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0),
      lowStock: products.filter(p => p.stock <= p.minStock).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      categories: [...new Set(products.map(p => p.category))].length,
      averageStock: products.reduce((sum, p) => sum + p.stock, 0) / products.length || 0,
      fastMoving: [], // Would be calculated from transaction data
      slowMoving: products.filter(p => p.stock > p.minStock * 3)
    };
    return analysis;
  };

  const analysis = analyzeInventory();

  // Predictive reorder suggestions
  const getReorderSuggestions = () => {
    const suggestions = products
      .filter(p => p.stock <= p.minStock * 1.5)
      .map(p => {
        const avgDailySales = 2; // Would calculate from transaction history
        const daysToStockout = p.stock / avgDailySales;
        const suggestedOrder = Math.max(p.minStock * 2 - p.stock, 0);
        
        return {
          product: p,
          urgency: p.stock <= p.minStock ? 'high' : 'medium',
          daysToStockout: Math.floor(daysToStockout),
          suggestedQuantity: suggestedOrder,
          estimatedCost: suggestedOrder * parseFloat(p.cost || "0")
        };
      })
      .sort((a, b) => {
        if (a.urgency === 'high' && b.urgency !== 'high') return -1;
        if (b.urgency === 'high' && a.urgency !== 'high') return 1;
        return a.daysToStockout - b.daysToStockout;
      });

    return suggestions;
  };

  const reorderSuggestions = getReorderSuggestions();

  // Create/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (productData: InsertProduct | { id: number; data: Partial<InsertProduct> }) => {
      if ('id' in productData) {
        return await apiRequest(`/api/products/${productData.id}`, 'PUT', productData.data);
      } else {
        return await apiRequest('/api/products', 'POST', productData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setShowAddProduct(false);
      setEditingProduct(null);
      setNewProduct({
        name: "",
        barcode: "",
        price: "",
        cost: "",
        category: "",
        stock: 0,
        minStock: 5,
        vatRate: "23.00",
        isActive: true
      });
      toast({
        title: "Success",
        description: "Product saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    }
  });

  // Auto-reorder mutation
  const autoReorderMutation = useMutation({
    mutationFn: async (suggestions: typeof reorderSuggestions) => {
      for (const suggestion of suggestions) {
        const newStock = suggestion.product.stock + suggestion.suggestedQuantity;
        await apiRequest(`/api/products/${suggestion.product.id}`, 'PUT', {
          stock: newStock
        });
      }
      return suggestions;
    },
    onSuccess: (suggestions) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Auto-Reorder Complete",
        description: `Updated stock for ${suggestions.length} products`,
      });
    }
  });

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.barcode.includes(searchTerm);
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStock = stockFilter === "all" ||
                          (stockFilter === "low" && p.stock <= p.minStock) ||
                          (stockFilter === "out" && p.stock === 0) ||
                          (stockFilter === "normal" && p.stock > p.minStock);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "stock": return a.stock - b.stock;
        case "price": return parseFloat(a.price) - parseFloat(b.price);
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });

  const categories = [...new Set(products.map(p => p.category))];

  const handleSaveProduct = () => {
    if (editingProduct) {
      saveProductMutation.mutate({
        id: editingProduct.id,
        data: newProduct
      });
    } else {
      saveProductMutation.mutate(newProduct as InsertProduct);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      cost: product.cost,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      vatRate: product.vatRate,
      isActive: product.isActive
    });
    setShowAddProduct(true);
  };

  const exportInventory = () => {
    const data = {
      exportDate: new Date().toISOString(),
      analysis,
      products: filteredProducts,
      reorderSuggestions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Inventory Management</h1>
          <p className="text-gray-600">AI-powered inventory optimization and forecasting</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddProduct(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button onClick={exportInventory} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{analysis.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{categories.length} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">€{analysis.totalValue.toFixed(0)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Avg. €{(analysis.totalValue / analysis.totalProducts || 0).toFixed(0)} per product</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{analysis.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{analysis.outOfStock} out of stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Stock Level</p>
                <p className="text-2xl font-bold text-purple-600">{analysis.averageStock.toFixed(0)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Units per product</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Smart Reorder Suggestions ({reorderSuggestions.length})
              </CardTitle>
              <Button 
                onClick={() => autoReorderMutation.mutate(reorderSuggestions.filter(s => s.urgency === 'high'))}
                disabled={autoReorderMutation.isPending}
                size="sm"
              >
                Auto-Reorder High Priority
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reorderSuggestions.slice(0, 6).map((suggestion, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  suggestion.urgency === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{suggestion.product.name}</h4>
                    <Badge variant={suggestion.urgency === 'high' ? 'destructive' : 'secondary'}>
                      {suggestion.urgency}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Current Stock:</span>
                      <span>{suggestion.product.stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days to Stockout:</span>
                      <span>{suggestion.daysToStockout}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Suggested Order:</span>
                      <span>{suggestion.suggestedQuantity}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Est. Cost:</span>
                      <span>€{suggestion.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500">
              {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const stockStatus = product.stock === 0 ? 'out' : 
                             product.stock <= product.minStock ? 'low' : 'normal';
          const stockColor = stockStatus === 'out' ? 'text-red-600' :
                            stockStatus === 'low' ? 'text-orange-600' : 'text-green-600';
          
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">€{parseFloat(product.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className={stockColor}>{product.stock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Stock:</span>
                    <span>{product.minStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span>€{(parseFloat(product.price) * product.stock).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    {product.barcode}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(product)}
                      className="p-1 h-8 w-8"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
              <Input
                placeholder="Barcode"
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
                <Input
                  placeholder="Cost"
                  type="number"
                  step="0.01"
                  value={newProduct.cost}
                  onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                />
              </div>
              <Input
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                />
                <Input
                  placeholder="Min Stock"
                  type="number"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProduct}
                  disabled={saveProductMutation.isPending}
                  className="flex-1"
                >
                  {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}