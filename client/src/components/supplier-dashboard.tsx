import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Globe, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Download,
  Upload,
  Zap,
  Target,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
  MessageSquare,
  Calendar,
  DollarSign
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface SupplierDashboardProps {
  onBackToMenu?: () => void;
  currentUser: any;
}

export function SupplierDashboard({ onBackToMenu, currentUser }: SupplierDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [emailConfig, setEmailConfig] = useState({
    imapServer: "",
    email: "",
    password: "",
    port: "993",
    ssl: true
  });
  const [webhookConfig, setWebhookConfig] = useState({
    url: "",
    secret: "",
    events: ["order_placed", "order_shipped", "order_delivered"]
  });

  // Fetch suppliers and orders data
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetch("/api/suppliers").then(res => res.json())
  });

  const { data: supplierOrders = [] } = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: () => fetch("/api/supplier-orders").then(res => res.json())
  });

  const { data: emailCaptures = [] } = useQuery({
    queryKey: ["email-captures"],
    queryFn: () => fetch("/api/email-captures").then(res => res.json())
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["supplier-webhooks"],
    queryFn: () => fetch("/api/supplier-webhooks").then(res => res.json())
  });

  const { data: inventoryGaps = [] } = useQuery({
    queryKey: ["inventory-gaps"],
    queryFn: () => fetch("/api/inventory/gaps").then(res => res.json())
  });

  const { data: reorderSuggestions = [] } = useQuery({
    queryKey: ["reorder-suggestions"],
    queryFn: () => fetch("/api/ai/reorder-suggestions").then(res => res.json())
  });

  // Mutation for setting up email integration
  const setupEmailMutation = useMutation({
    mutationFn: (config: typeof emailConfig) =>
      fetch("/api/email-integration/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Email integration configured successfully" });
      queryClient.invalidateQueries({ queryKey: ["email-captures"] });
    }
  });

  // Mutation for setting up webhooks
  const setupWebhookMutation = useMutation({
    mutationFn: (config: typeof webhookConfig & { supplierId: number }) =>
      fetch("/api/supplier-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Webhook configured successfully" });
      queryClient.invalidateQueries({ queryKey: ["supplier-webhooks"] });
    }
  });

  // Mutation for processing order matching
  const processOrderMatchingMutation = useMutation({
    mutationFn: () =>
      fetch("/api/ai/process-order-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Order matching processed successfully" });
      queryClient.invalidateQueries({ queryKey: ["reorder-suggestions"] });
    }
  });

  // Calculate dashboard stats
  const dashboardStats = {
    totalOrders: supplierOrders.length,
    pendingOrders: supplierOrders.filter((o: any) => o.status === "pending_approval").length,
    emailsCaptured: emailCaptures.length,
    activeWebhooks: webhooks.filter((w: any) => w.isActive).length,
    inventoryGaps: inventoryGaps.length,
    aiSuggestions: reorderSuggestions.length
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.totalOrders}</p>
                <p className="text-xs text-gray-600">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.pendingOrders}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.emailsCaptured}</p>
                <p className="text-xs text-gray-600">Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.activeWebhooks}</p>
                <p className="text-xs text-gray-600">Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.inventoryGaps}</p>
                <p className="text-xs text-gray-600">Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.aiSuggestions}</p>
                <p className="text-xs text-gray-600">AI Tips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Order Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {supplierOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.externalOrderNumber}</p>
                    <p className="text-sm text-gray-600">{order.supplier?.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      order.status === "approved" ? "default" : 
                      order.status === "pending_approval" ? "secondary" : "destructive"
                    }>
                      {order.status.replace("_", " ")}
                    </Badge>
                    <p className="text-sm text-gray-600">€{order.totalAmount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Reorder Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {reorderSuggestions.slice(0, 5).map((suggestion: any) => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{suggestion.productName}</p>
                    <p className="text-sm text-gray-600">Suggest: {suggestion.suggestedQuantity} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{suggestion.confidence}% confident</p>
                    <p className="text-xs text-gray-500">{suggestion.reasoning.substring(0, 30)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEmailIntegration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Order Capture Setup
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure email integration to automatically capture supplier order confirmations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={emailConfig.email}
                onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})}
                placeholder="orders@kerrigansxl.com"
              />
            </div>
            <div>
              <Label htmlFor="imapServer">IMAP Server</Label>
              <Input
                id="imapServer"
                value={emailConfig.imapServer}
                onChange={(e) => setEmailConfig({...emailConfig, imapServer: e.target.value})}
                placeholder="mail.kerrigansxl.com"
              />
            </div>
            <div>
              <Label htmlFor="password">App Password</Label>
              <Input
                id="password"
                type="password"
                value={emailConfig.password}
                onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={emailConfig.port}
                onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})}
                placeholder="993"
              />
            </div>
          </div>
          <Button 
            onClick={() => setupEmailMutation.mutate(emailConfig)}
            disabled={setupEmailMutation.isPending}
            className="w-full"
          >
            {setupEmailMutation.isPending ? "Configuring..." : "Setup Email Integration"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Captured Email Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailCaptures.map((capture: any) => (
              <div key={capture.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{capture.emailSubject}</p>
                  <p className="text-sm text-gray-600">From: {capture.emailFrom}</p>
                  <p className="text-xs text-gray-500">{new Date(capture.receivedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge variant={
                    capture.processingStatus === "processed" ? "default" : 
                    capture.processingStatus === "pending" ? "secondary" : "destructive"
                  }>
                    {capture.processingStatus}
                  </Badge>
                  {capture.confidence && (
                    <p className="text-xs text-gray-500">{capture.confidence}% confidence</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWebhookIntegration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook Integration Setup
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure webhooks to receive real-time updates from supplier portals
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={selectedSupplier?.toString()} onValueChange={(value) => setSelectedSupplier(parseInt(value))}>
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
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={webhookConfig.url}
              onChange={(e) => setWebhookConfig({...webhookConfig, url: e.target.value})}
              placeholder="https://supplier.com/api/webhook"
            />
          </div>

          <div>
            <Label htmlFor="secret">Secret Key</Label>
            <Input
              id="secret"
              value={webhookConfig.secret}
              onChange={(e) => setWebhookConfig({...webhookConfig, secret: e.target.value})}
              placeholder="webhook_secret_key"
            />
          </div>

          <Button 
            onClick={() => {
              if (selectedSupplier) {
                setupWebhookMutation.mutate({...webhookConfig, supplierId: selectedSupplier});
              }
            }}
            disabled={setupWebhookMutation.isPending || !selectedSupplier}
            className="w-full"
          >
            {setupWebhookMutation.isPending ? "Configuring..." : "Setup Webhook"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webhooks.map((webhook: any) => (
              <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{webhook.supplier?.name}</p>
                  <p className="text-sm text-gray-600">{webhook.webhookUrl}</p>
                  <p className="text-xs text-gray-500">{webhook.eventTypes.join(", ")}</p>
                </div>
                <div className="text-right">
                  <Badge variant={webhook.isActive ? "default" : "secondary"}>
                    {webhook.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {webhook.lastTriggered && (
                    <p className="text-xs text-gray-500">
                      Last: {new Date(webhook.lastTriggered).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAIMatching = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Order Matching & Suggestions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Intelligent matching of supplier orders to inventory gaps and smart reorder suggestions
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => processOrderMatchingMutation.mutate()}
            disabled={processOrderMatchingMutation.isPending}
            className="w-full mb-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processOrderMatchingMutation.isPending ? 'animate-spin' : ''}`} />
            {processOrderMatchingMutation.isPending ? "Processing..." : "Run AI Matching Analysis"}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Inventory Gaps</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inventoryGaps.map((gap: any) => (
                  <div key={gap.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{gap.productName}</p>
                      <p className="text-xs text-gray-600">Current: {gap.currentStock} | Min: {gap.minStock}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      -{gap.shortfall} units
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">AI Reorder Suggestions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {reorderSuggestions.map((suggestion: any) => (
                  <div key={suggestion.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{suggestion.productName}</p>
                      <Badge variant="default" className="text-xs">
                        {suggestion.confidence}% confident
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      Suggest: {suggestion.suggestedQuantity} units
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestion.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderTracking = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Order Status & Delivery Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supplierOrders.map((order: any) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Order #{order.externalOrderNumber}</p>
                      <p className="text-sm text-gray-600">{order.supplier?.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        order.status === "approved" ? "default" : 
                        order.status === "pending_approval" ? "secondary" : 
                        order.status === "received" ? "default" : "destructive"
                      }>
                        {order.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <p className="text-sm font-medium">€{order.totalAmount}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected Delivery</p>
                      <p className="font-medium">
                        {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "TBD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Items</p>
                      <p className="font-medium">{order.orderItems?.length || 0} items</p>
                    </div>
                  </div>

                  {/* Progress bar for delivery status */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Ordered</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                    <Progress 
                      value={
                        order.status === "pending_approval" ? 25 :
                        order.status === "approved" ? 50 :
                        order.status === "shipped" ? 75 :
                        order.status === "received" ? 100 : 25
                      } 
                      className="h-2"
                    />
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium text-gray-700">Notes:</p>
                      <p className="text-gray-600">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
            <p className="text-gray-600">
              Automated order capture, tracking, and AI-powered inventory management
            </p>
          </div>
          {onBackToMenu && (
            <Button variant="outline" onClick={onBackToMenu}>
              Back to Menu
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="email">Email Capture</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="ai-matching">AI Matching</TabsTrigger>
            <TabsTrigger value="tracking">Order Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="email">{renderEmailIntegration()}</TabsContent>
          <TabsContent value="webhooks">{renderWebhookIntegration()}</TabsContent>
          <TabsContent value="ai-matching">{renderAIMatching()}</TabsContent>
          <TabsContent value="tracking">{renderOrderTracking()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}