import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, ArrowLeftRight, DollarSign, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TillStockManagement() {
  const [selectedTill, setSelectedTill] = useState("till1");
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  // Mock till data - in real app this would come from API
  const tillData = {
    till1: {
      id: "till1",
      name: "Main Till",
      status: "active",
      cashFloat: 200.00,
      stockAllocations: [
        { productId: 1, productName: "Coca Cola", allocated: 24, sold: 6, remaining: 18 },
        { productId: 2, productName: "Bread", allocated: 12, sold: 3, remaining: 9 },
        { productId: 3, productName: "Milk", allocated: 20, sold: 8, remaining: 12 }
      ]
    },
    till2: {
      id: "till2",
      name: "Express Till",
      status: "active",
      cashFloat: 150.00,
      stockAllocations: [
        { productId: 1, productName: "Coca Cola", allocated: 12, sold: 4, remaining: 8 },
        { productId: 4, productName: "Cigarettes", allocated: 200, sold: 45, remaining: 155 }
      ]
    },
    till3: {
      id: "till3",
      name: "Self-Service",
      status: "maintenance",
      cashFloat: 100.00,
      stockAllocations: []
    }
  };

  const currentTill = tillData[selectedTill as keyof typeof tillData];

  const transferStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/till-stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to transfer stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["till-stock"] });
      setShowTransferForm(false);
      setTransferAmount("");
      setSelectedProduct(null);
      toast({ title: "Stock transferred successfully" });
    }
  });

  const updateFloatMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/till-stock/float", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update float");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["till-stock"] });
      toast({ title: "Float updated successfully" });
    }
  });

  const handleTransferStock = () => {
    if (!selectedProduct || !transferAmount) {
      toast({ title: "Please select product and amount", variant: "destructive" });
      return;
    }

    transferStockMutation.mutate({
      fromTill: selectedTill,
      toTill: selectedTill === "till1" ? "till2" : "till1",
      productId: selectedProduct.id,
      quantity: parseInt(transferAmount)
    });
  };

  const getStockStatus = (allocation: any) => {
    const percentage = (allocation.remaining / allocation.allocated) * 100;
    if (percentage > 50) return { status: "Good", color: "bg-green-500" };
    if (percentage > 20) return { status: "Medium", color: "bg-yellow-500" };
    return { status: "Low", color: "bg-red-500" };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Till Stock Management
          </CardTitle>
          <p className="text-gray-600">Manage inventory allocation and cash floats for each till</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            {Object.entries(tillData).map(([tillId, till]) => (
              <Button
                key={tillId}
                variant={selectedTill === tillId ? "default" : "outline"}
                onClick={() => setSelectedTill(tillId)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {till.name}
                <Badge variant={till.status === "active" ? "default" : "destructive"}>
                  {till.status}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Cash Float</h3>
              <p className="text-2xl font-bold text-blue-600">€{currentTill.cashFloat.toFixed(2)}</p>
              <Button size="sm" className="mt-2" onClick={() => {
                const newFloat = prompt("Enter new float amount:", currentTill.cashFloat.toString());
                if (newFloat) {
                  updateFloatMutation.mutate({ tillId: selectedTill, amount: parseFloat(newFloat) });
                }
              }}>
                Update Float
              </Button>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Stock Items</h3>
              <p className="text-2xl font-bold text-green-600">{currentTill.stockAllocations.length}</p>
              <p className="text-sm text-green-600">Products allocated</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Total Value</h3>
              <p className="text-2xl font-bold text-purple-600">
                €{currentTill.stockAllocations.reduce((sum, allocation) => {
                  const product = products.find((p: any) => p.id === allocation.productId);
                  return sum + (product ? parseFloat(product.price) * allocation.remaining : 0);
                }, 0).toFixed(2)}
              </p>
              <p className="text-sm text-purple-600">Remaining stock value</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Allocations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentTill.stockAllocations.map((allocation, index) => {
                    const status = getStockStatus(allocation);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{allocation.productName}</h3>
                            <Badge variant="secondary">{status.status}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-gray-600">Allocated</p>
                              <p className="font-medium">{allocation.allocated}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Sold</p>
                              <p className="font-medium">{allocation.sold}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Remaining</p>
                              <p className="font-medium">{allocation.remaining}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${status.color}`}
                                style={{ width: `${(allocation.remaining / allocation.allocated) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(allocation);
                              setShowTransferForm(true);
                            }}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {currentTill.stockAllocations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No stock allocated to this till
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Stock Transfer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showTransferForm ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">Transfer stock between tills or allocate new stock</p>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        className="flex items-center gap-2"
                        onClick={() => setShowTransferForm(true)}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        Transfer Stock
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        Allocate New Stock
                      </Button>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Recent Transfers</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">Coca Cola (12 units)</p>
                            <p className="text-xs text-gray-600">Till 1 → Till 2</p>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">Bread (5 units)</p>
                            <p className="text-xs text-gray-600">Till 2 → Till 1</p>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Select Product</label>
                      <select 
                        className="w-full p-2 border rounded-lg"
                        value={selectedProduct?.productId || ""}
                        onChange={(e) => {
                          const allocation = currentTill.stockAllocations.find(a => a.productId === parseInt(e.target.value));
                          setSelectedProduct(allocation);
                        }}
                      >
                        <option value="">Select a product</option>
                        {currentTill.stockAllocations.map((allocation) => (
                          <option key={allocation.productId} value={allocation.productId}>
                            {allocation.productName} (Available: {allocation.remaining})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Transfer Amount</label>
                      <Input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="Enter quantity to transfer"
                        max={selectedProduct?.remaining || 0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Destination Till</label>
                      <select className="w-full p-2 border rounded-lg">
                        {Object.entries(tillData).map(([tillId, till]) => (
                          tillId !== selectedTill && (
                            <option key={tillId} value={tillId}>
                              {till.name}
                            </option>
                          )
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button onClick={handleTransferStock}>
                        Transfer Stock
                      </Button>
                      <Button variant="outline" onClick={() => setShowTransferForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Till Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tillData).map(([tillId, till]) => (
                  <div key={tillId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{till.name}</h3>
                      <Badge variant={till.status === "active" ? "default" : "destructive"}>
                        {till.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cash Float</span>
                        <span className="font-medium">€{till.cashFloat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Stock Items</span>
                        <span className="font-medium">{till.stockAllocations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Sales</span>
                        <span className="font-medium">
                          {till.stockAllocations.reduce((sum, a) => sum + a.sold, 0)} units
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}