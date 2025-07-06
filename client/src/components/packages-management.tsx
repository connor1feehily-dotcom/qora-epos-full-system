import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Edit, Trash2, Star, Tag, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PackageItem {
  id: number;
  name: string;
  description: string;
  items: { productId: number; quantity: number; productName: string }[];
  totalPrice: number;
  discountPrice: number;
  isActive: boolean;
  popularity: number;
}

export function PackagesManagement() {
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    items: [] as { productId: number; quantity: number; productName: string }[],
    discountPrice: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  // Mock packages data - in real app this would come from API
  const mockPackages: PackageItem[] = [
    {
      id: 1,
      name: "Breakfast Combo",
      description: "Everything you need for a perfect morning",
      items: [
        { productId: 1, quantity: 1, productName: "Bread" },
        { productId: 2, quantity: 1, productName: "Butter" },
        { productId: 3, quantity: 1, productName: "Jam" },
        { productId: 4, quantity: 1, productName: "Milk" }
      ],
      totalPrice: 8.50,
      discountPrice: 7.50,
      isActive: true,
      popularity: 85
    },
    {
      id: 2,
      name: "Family Movie Night",
      description: "Snacks and drinks for the whole family",
      items: [
        { productId: 5, quantity: 2, productName: "Popcorn" },
        { productId: 6, quantity: 4, productName: "Soft Drinks" },
        { productId: 7, quantity: 1, productName: "Chocolate" }
      ],
      totalPrice: 15.00,
      discountPrice: 12.99,
      isActive: true,
      popularity: 92
    },
    {
      id: 3,
      name: "BBQ Essentials",
      description: "Perfect for outdoor grilling",
      items: [
        { productId: 8, quantity: 1, productName: "Burgers" },
        { productId: 9, quantity: 1, productName: "Sausages" },
        { productId: 10, quantity: 1, productName: "Buns" },
        { productId: 11, quantity: 1, productName: "Sauce" }
      ],
      totalPrice: 18.50,
      discountPrice: 16.99,
      isActive: true,
      popularity: 78
    }
  ];

  const { data: packages = mockPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: () => fetch("/api/packages").then(res => res.json()),
    initialData: mockPackages
  });

  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageData)
      });
      if (!response.ok) throw new Error("Failed to create package");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setShowCreateForm(false);
      setNewPackage({ name: "", description: "", items: [], discountPrice: 0 });
      toast({ title: "Package created successfully" });
    }
  });

  const handleCreatePackage = () => {
    if (!newPackage.name || newPackage.items.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const totalPrice = newPackage.items.reduce((sum, item) => {
      const product = products.find((p: any) => p.id === item.productId);
      return sum + (product ? parseFloat(product.price) * item.quantity : 0);
    }, 0);

    createPackageMutation.mutate({
      ...newPackage,
      totalPrice,
      isActive: true,
      popularity: 0
    });
  };

  const addItemToPackage = (productId: number, quantity: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      const existingItem = newPackage.items.find(item => item.productId === productId);
      if (existingItem) {
        setNewPackage({
          ...newPackage,
          items: newPackage.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        });
      } else {
        setNewPackage({
          ...newPackage,
          items: [...newPackage.items, { productId, quantity, productName: product.name }]
        });
      }
    }
  };

  const removeItemFromPackage = (productId: number) => {
    setNewPackage({
      ...newPackage,
      items: newPackage.items.filter(item => item.productId !== productId)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Management
              </CardTitle>
              <p className="text-gray-600">Create and manage product bundles and combo deals</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Active Packages</h3>
              <p className="text-2xl font-bold text-blue-600">{packages.filter(p => p.isActive).length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Total Savings</h3>
              <p className="text-2xl font-bold text-green-600">
                €{packages.reduce((sum, p) => sum + (p.totalPrice - p.discountPrice), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Average Popularity</h3>
              <p className="text-2xl font-bold text-purple-600">
                {packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.popularity, 0) / packages.length) : 0}%
              </p>
            </div>
          </div>

          {!showCreateForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{pkg.popularity}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <h4 className="font-medium text-sm">Package Contents:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {pkg.items.map((item, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            {item.quantity}x {item.productName}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 line-through">€{pkg.totalPrice.toFixed(2)}</span>
                          <span className="font-bold text-green-600">€{pkg.discountPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-green-600">
                          Save €{(pkg.totalPrice - pkg.discountPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create New Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Package Name</label>
                      <Input
                        value={newPackage.name}
                        onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                        placeholder="Enter package name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Discount Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPackage.discountPrice}
                        onChange={(e) => setNewPackage({ ...newPackage, discountPrice: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                      placeholder="Enter package description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-3">Add Products</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {products.slice(0, 20).map((product: any) => (
                          <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-600">€{product.price}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addItemToPackage(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Package Items</h3>
                      <div className="space-y-2">
                        {newPackage.items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{item.productName}</p>
                              <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItemFromPackage(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {newPackage.items.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium">
                            Total Value: €{newPackage.items.reduce((sum, item) => {
                              const product = products.find((p: any) => p.id === item.productId);
                              return sum + (product ? parseFloat(product.price) * item.quantity : 0);
                            }, 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-green-600">
                            Savings: €{(newPackage.items.reduce((sum, item) => {
                              const product = products.find((p: any) => p.id === item.productId);
                              return sum + (product ? parseFloat(product.price) * item.quantity : 0);
                            }, 0) - newPackage.discountPrice).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleCreatePackage}>Create Package</Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}