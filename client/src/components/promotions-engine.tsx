import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Edit, Trash2, Calendar, Percent, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromotionRule {
  id: number;
  name: string;
  type: string;
  value: string;
  conditions: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  usageLimit: number;
  usedCount: number;
}

export function PromotionsEngine() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "percentage",
    value: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    priority: "1"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["promotion-rules"],
    queryFn: () => fetch("/api/promotion-rules").then(res => res.json())
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/promotion-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotion-rules"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Promotion created successfully" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "percentage",
      value: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      priority: "1"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      value: parseFloat(formData.value),
      usageLimit: parseInt(formData.usageLimit),
      priority: parseInt(formData.priority),
      isActive: true
    };

    createMutation.mutate(submitData);
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case "percentage": return <Percent className="w-4 h-4" />;
      case "fixed": return "€";
      case "bogof": return <Gift className="w-4 h-4" />;
      case "mix_match": return "🎯";
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case "percentage": return "Percentage Off";
      case "fixed": return "Fixed Amount";
      case "bogof": return "Buy One Get One Free";
      case "mix_match": return "Mix & Match";
      default: return type;
    }
  };

  const getStatusBadge = (promotion: PromotionRule) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) return { label: "Inactive", variant: "secondary" };
    if (now < start) return { label: "Scheduled", variant: "outline" };
    if (now > end) return { label: "Expired", variant: "destructive" };
    return { label: "Active", variant: "default" };
  };

  const activePromotions = promotions.filter((p: PromotionRule) => {
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return p.isActive && now >= start && now <= end;
  });

  if (isLoading) {
    return <div className="p-4">Loading promotions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promotions Engine</h2>
          <p className="text-gray-600">Create and manage promotional campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingPromotion(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Promotion Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Sale 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Promotion Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="bogof">Buy One Get One Free</SelectItem>
                    <SelectItem value="mix_match">Mix & Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">
                  {formData.type === "percentage" ? "Discount Percentage" : 
                   formData.type === "fixed" ? "Discount Amount (€)" : "Quantity"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step={formData.type === "fixed" ? "0.01" : "1"}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={formData.type === "percentage" ? "10" : formData.type === "fixed" ? "5.00" : "2"}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Promotion
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

      {/* Active Promotions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Promotions</p>
                <p className="text-2xl font-bold">{activePromotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Promotions</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usage Today</p>
                <p className="text-2xl font-bold">
                  {promotions.reduce((sum: number, p: PromotionRule) => sum + (p.usedCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promotion: PromotionRule) => {
          const status = getStatusBadge(promotion);
          return (
            <Card key={promotion.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPromotionTypeIcon(promotion.type)}
                    <h3 className="font-semibold truncate">{promotion.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Badge variant={status.variant as any} className="w-fit">
                  {status.label}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{getPromotionTypeLabel(promotion.type)}</p>
                    <p className="text-lg font-bold">
                      {promotion.type === "percentage" ? `${promotion.value}% off` :
                       promotion.type === "fixed" ? `€${promotion.value} off` :
                       `${promotion.value} items`}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Start: {new Date(promotion.startDate).toLocaleDateString()}</p>
                    <p>End: {new Date(promotion.endDate).toLocaleDateString()}</p>
                  </div>

                  {promotion.usageLimit && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{promotion.usedCount || 0} / {promotion.usageLimit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((promotion.usedCount || 0) / promotion.usageLimit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Priority: {promotion.priority}</span>
                    <span>ID: {promotion.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {promotions.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No promotions created</h3>
          <p className="text-gray-600 mb-4">
            Create your first promotional campaign to boost sales
          </p>
          <Button onClick={() => { resetForm(); setEditingPromotion(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Promotion
          </Button>
        </Card>
      )}

      {/* Promotion Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Promotion Templates</CardTitle>
          <p className="text-gray-600">Common promotion types you can set up quickly</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => {
                setFormData({
                  name: "Weekend Special",
                  type: "percentage",
                  value: "20",
                  startDate: "",
                  endDate: "",
                  usageLimit: "",
                  priority: "2"
                });
                setIsDialogOpen(true);
              }}
            >
              <Percent className="w-6 h-6" />
              <span className="font-medium">20% Off Weekend</span>
              <span className="text-xs text-gray-500">Percentage discount</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => {
                setFormData({
                  name: "Buy 2 Get 1 Free",
                  type: "bogof",
                  value: "3",
                  startDate: "",
                  endDate: "",
                  usageLimit: "",
                  priority: "2"
                });
                setIsDialogOpen(true);
              }}
            >
              <Gift className="w-6 h-6" />
              <span className="font-medium">BOGOF Deal</span>
              <span className="text-xs text-gray-500">Buy one get one</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => {
                setFormData({
                  name: "€5 Off Purchase",
                  type: "fixed",
                  value: "5.00",
                  startDate: "",
                  endDate: "",
                  usageLimit: "",
                  priority: "2"
                });
                setIsDialogOpen(true);
              }}
            >
              <span className="text-xl">€</span>
              <span className="font-medium">Fixed Discount</span>
              <span className="text-xs text-gray-500">Amount off total</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => {
                setFormData({
                  name: "Mix & Match Deal",
                  type: "mix_match",
                  value: "3",
                  startDate: "",
                  endDate: "",
                  usageLimit: "",
                  priority: "2"
                });
                setIsDialogOpen(true);
              }}
            >
              <span className="text-xl">🎯</span>
              <span className="font-medium">Mix & Match</span>
              <span className="text-xs text-gray-500">Multi-product deal</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}