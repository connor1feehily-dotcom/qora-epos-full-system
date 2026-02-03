import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Package, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  FileText,
  Grid,
  Plus,
  Eye,
  Edit,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  Truck,
  BarChart3,
  Wrench
} from "lucide-react";
import { PosButtonConfigurator } from "./pos-button-configurator";
import { InventoryManagement } from "./inventory-management";
import { StaffManagement } from "./staff-management";
import { PromotionsEngine } from "./promotions-engine";
import { PurchaseOrderManagement } from "./purchase-order-management";
import { ValueProjection } from "./value-projection";
import { PackagesManagement } from "./packages-management";
import { TillStockManagement } from "./till-stock-management";
import { SystemMaintenance } from "./system-maintenance";
import { DeliveryApprovalDashboard } from "./delivery-approval-dashboard";
import { SupplierPerformanceDashboard } from "./supplier-performance-dashboard";
import { StaffActivityLog } from "./staff-activity-log";
import { AIPriceOptimization } from "./ai-price-optimization";
import { SystemAlerts } from "./system-alerts";
import { EnhancedMobileScanner } from "./enhanced-mobile-scanner";
import AdvancedInventoryTweaks from "./advanced-inventory-tweaks";
import AdvancedStaffManagement from "./advanced-staff-management";
import SmartAnalytics from "./smart-analytics";
import { SupplierOrderIntegration } from "./supplier-order-integration";
import { SupplierDashboard } from "./supplier-dashboard";
import { StockTakingSystem } from "./stock-taking-system";

interface BackOfficeDashboardProps {
  onBackToMenu: () => void;
  currentUser: any;
}

const consolidatedModules = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: BarChart3,
    color: "bg-gradient-to-r from-[#1e3a5f] to-[#2dd4bf]",
    description: "Overview of your business performance and quick stats"
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    color: "bg-green-500",
    description: "Products, stock levels, counts, and packages"
  },
  {
    id: "purchasing",
    title: "Purchasing",
    icon: Truck,
    color: "bg-orange-500",
    description: "Suppliers, deliveries, and ordering"
  },
  {
    id: "sales",
    title: "Sales & Reports",
    icon: TrendingUp,
    color: "bg-blue-500",
    description: "Transaction history, analytics, and forecasting"
  },
  {
    id: "pricing",
    title: "Pricing & Promos",
    icon: Target,
    color: "bg-pink-500",
    description: "Promotions, AI pricing, and deals"
  },
  {
    id: "staff",
    title: "Staff",
    icon: Users,
    color: "bg-purple-500",
    description: "Employee management, time tracking, and activity"
  },
  {
    id: "tills",
    title: "Tills",
    icon: ShoppingCart,
    color: "bg-teal-500",
    description: "Till configuration and stock allocation"
  },
  {
    id: "system",
    title: "System",
    icon: Wrench,
    color: "bg-gray-600",
    description: "Settings, alerts, and maintenance"
  }
];

export function BackOfficeDashboard({ onBackToMenu, currentUser }: BackOfficeDashboardProps) {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("");

  const { toast } = useToast();

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
    setActiveSubTab("");
  };

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then(res => res.json()),
    refetchInterval: 30000
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  const { data: lowStockData = [] } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => fetch("/api/analytics/low-stock").then(res => res.json())
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetch("/api/transactions").then(res => res.json())
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then(res => res.json())
  });

  const quickStats = [
    {
      title: "Today's Revenue",
      value: `€${dashboardData?.dailyRevenue?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      trend: "+12%",
      color: "text-green-600"
    },
    {
      title: "Transactions",
      value: dashboardData?.transactions?.toString() || "0",
      icon: ShoppingCart,
      trend: "+8%",
      color: "text-blue-600"
    },
    {
      title: "Products",
      value: products.length.toString(),
      icon: Package,
      trend: "+2",
      color: "text-purple-600"
    },
    {
      title: "Low Stock Alerts",
      value: lowStockData.length.toString(),
      icon: AlertTriangle,
      trend: lowStockData.filter((item: any) => item.urgent).length + " urgent",
      color: "text-red-600"
    }
  ];

  const recentActivity = [
    { action: "Product Added", details: "New item added to inventory", time: "2 minutes ago", user: "Admin" },
    { action: "Price Updated", details: "Milk price changed to €1.49", time: "15 minutes ago", user: "Manager" },
    { action: "Staff Login", details: "John Doe logged into Till 1", time: "32 minutes ago", user: "System" },
    { action: "Promotion Created", details: "Buy 2 Get 1 Free on Sodas", time: "1 hour ago", user: "Manager" }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.trend}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-400">{activity.time} • {activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockData.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {item.currentStock} / Min: {item.minStock}
                    </p>
                  </div>
                  <Badge variant={item.urgent ? "destructive" : "secondary"}>
                    {item.urgent ? "Urgent" : "Low"}
                  </Badge>
                </div>
              ))}
              {lowStockData.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  All products have adequate stock levels
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventoryModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "products" ? "default" : "outline"}
          onClick={() => setActiveSubTab("products")}
          size="sm"
        >
          <Package className="w-4 h-4 mr-2" />
          Products
        </Button>
        <Button 
          variant={activeSubTab === "stock-ledger" ? "default" : "outline"}
          onClick={() => setActiveSubTab("stock-ledger")}
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Stock Ledger
        </Button>
        <Button 
          variant={activeSubTab === "advanced" ? "default" : "outline"}
          onClick={() => setActiveSubTab("advanced")}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Advanced Tools
        </Button>
        <Button 
          variant={activeSubTab === "stock-take" ? "default" : "outline"}
          onClick={() => setActiveSubTab("stock-take")}
          size="sm"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Stock Taking
        </Button>
        <Button 
          variant={activeSubTab === "packages" ? "default" : "outline"}
          onClick={() => setActiveSubTab("packages")}
          size="sm"
        >
          <Grid className="w-4 h-4 mr-2" />
          Packages
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "products") && <InventoryManagement />}
      {activeSubTab === "stock-ledger" && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Ledger</CardTitle>
            <p className="text-gray-600">Detailed stock movement tracking</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Total Products</h3>
                  <p className="text-2xl font-bold text-green-600">{products.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900">Low Stock Items</h3>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockData.length}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900">Out of Stock</h3>
                  <p className="text-2xl font-bold text-red-600">{products.filter((p: any) => p.stock === 0).length}</p>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {products.slice(0, 20).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Stock: {product.stock}</p>
                      <p className="text-sm text-gray-600">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {activeSubTab === "advanced" && <AdvancedInventoryTweaks />}
      {activeSubTab === "stock-take" && <StockTakingSystem onBackToMenu={() => setActiveSubTab("")} currentUser={currentUser} />}
      {activeSubTab === "packages" && <PackagesManagement />}
    </div>
  );

  const renderPurchasingModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "deliveries" ? "default" : "outline"}
          onClick={() => setActiveSubTab("deliveries")}
          size="sm"
        >
          <Truck className="w-4 h-4 mr-2" />
          Deliveries
        </Button>
        <Button 
          variant={activeSubTab === "suppliers" ? "default" : "outline"}
          onClick={() => setActiveSubTab("suppliers")}
          size="sm"
        >
          <Users className="w-4 h-4 mr-2" />
          Suppliers
        </Button>
        <Button 
          variant={activeSubTab === "scanner" ? "default" : "outline"}
          onClick={() => setActiveSubTab("scanner")}
          size="sm"
        >
          <Package className="w-4 h-4 mr-2" />
          Mobile Scanner
        </Button>
        <Button 
          variant={activeSubTab === "ai-orders" ? "default" : "outline"}
          onClick={() => setActiveSubTab("ai-orders")}
          size="sm"
        >
          <Target className="w-4 h-4 mr-2" />
          AI Ordering
        </Button>
        <Button 
          variant={activeSubTab === "integration" ? "default" : "outline"}
          onClick={() => setActiveSubTab("integration")}
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Order Integration
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "deliveries") && <DeliveryApprovalDashboard currentUser={currentUser} />}
      {activeSubTab === "suppliers" && <SupplierPerformanceDashboard />}
      {activeSubTab === "scanner" && <EnhancedMobileScanner userId={currentUser?.id} userName={`${currentUser?.firstName} ${currentUser?.lastName}`} />}
      {activeSubTab === "ai-orders" && <SupplierDashboard onBackToMenu={() => setActiveSubTab("")} currentUser={currentUser} />}
      {activeSubTab === "integration" && <SupplierOrderIntegration />}
    </div>
  );

  const renderSalesModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveSubTab("analytics")}
          size="sm"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button 
          variant={activeSubTab === "ledger" ? "default" : "outline"}
          onClick={() => setActiveSubTab("ledger")}
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Sales Ledger
        </Button>
        <Button 
          variant={activeSubTab === "forecast" ? "default" : "outline"}
          onClick={() => setActiveSubTab("forecast")}
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Forecasting
        </Button>
        <Button 
          variant={activeSubTab === "activity" ? "default" : "outline"}
          onClick={() => setActiveSubTab("activity")}
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Activity Log
        </Button>
        <Button 
          variant={activeSubTab === "reports" ? "default" : "outline"}
          onClick={() => setActiveSubTab("reports")}
          size="sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Reports
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "analytics") && <SmartAnalytics />}
      {activeSubTab === "ledger" && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Ledger</CardTitle>
            <p className="text-gray-600">Complete sales transaction management</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Today's Sales</h3>
                  <p className="text-2xl font-bold text-blue-600">€{dashboardData?.dailyRevenue?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Total Transactions</h3>
                  <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900">Average Sale</h3>
                  <p className="text-2xl font-bold text-purple-600">€{transactions.length > 0 ? (transactions.reduce((sum: number, t: any) => sum + parseFloat(t.total), 0) / transactions.length).toFixed(2) : "0.00"}</p>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {transactions.slice(0, 20).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Transaction #{transaction.id}</p>
                      <p className="text-sm text-gray-600">{new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{transaction.total}</p>
                      <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {activeSubTab === "forecast" && <ValueProjection />}
      {activeSubTab === "activity" && <StaffActivityLog />}
      {activeSubTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle>Business Reports</CardTitle>
            <p className="text-gray-600">Comprehensive business reporting</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 text-white rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sales Report</h3>
                      <p className="text-sm text-gray-600">Daily/Weekly/Monthly sales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 text-white rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Inventory Report</h3>
                      <p className="text-sm text-gray-600">Stock levels and movements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 text-white rounded-lg">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Financial Report</h3>
                      <p className="text-sm text-gray-600">Revenue and profit analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPricingModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "promotions" ? "default" : "outline"}
          onClick={() => setActiveSubTab("promotions")}
          size="sm"
        >
          <Target className="w-4 h-4 mr-2" />
          Promotions
        </Button>
        <Button 
          variant={activeSubTab === "ai-price" ? "default" : "outline"}
          onClick={() => setActiveSubTab("ai-price")}
          size="sm"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          AI Pricing
        </Button>
        <Button 
          variant={activeSubTab === "bulk-price" ? "default" : "outline"}
          onClick={() => setActiveSubTab("bulk-price")}
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Bulk Price Changes
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "promotions") && <PromotionsEngine />}
      {activeSubTab === "ai-price" && <AIPriceOptimization />}
      {activeSubTab === "bulk-price" && (
        <Card>
          <CardHeader>
            <CardTitle>Multi Price Changes</CardTitle>
            <p className="text-gray-600">Bulk price update management</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3">Bulk Price Update</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option value="">Select Category</option>
                        {Array.from(new Set(products.map((p: any) => p.category))).map((category: any) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price Change Type</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option value="percentage">Percentage Increase</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Value</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-lg" 
                        placeholder="Enter value"
                      />
                    </div>
                    <Button className="w-full">Apply Price Changes</Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Price History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {products.slice(0, 10).map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{product.name}</span>
                        <span className="text-sm font-medium">€{product.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStaffModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "staff" ? "default" : "outline"}
          onClick={() => setActiveSubTab("staff")}
          size="sm"
        >
          <Users className="w-4 h-4 mr-2" />
          Staff List
        </Button>
        <Button 
          variant={activeSubTab === "advanced" ? "default" : "outline"}
          onClick={() => setActiveSubTab("advanced")}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Time & Incentives
        </Button>
        <Button 
          variant={activeSubTab === "admin" ? "default" : "outline"}
          onClick={() => setActiveSubTab("admin")}
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Administration
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "staff") && <StaffManagement />}
      {activeSubTab === "advanced" && <AdvancedStaffManagement />}
      {activeSubTab === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>System Administration</CardTitle>
            <p className="text-gray-600">User management and system configuration</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">User Management</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map((user: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">{user.role}</p>
                      </div>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
              </div>
              <div>
                <h3 className="font-semibold mb-3">System Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Automatic Backups</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Security Updates</span>
                    <Badge variant="default">Auto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Database Status</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTillsModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "config" ? "default" : "outline"}
          onClick={() => setActiveSubTab("config")}
          size="sm"
        >
          <Grid className="w-4 h-4 mr-2" />
          POS Configuration
        </Button>
        <Button 
          variant={activeSubTab === "stock" ? "default" : "outline"}
          onClick={() => setActiveSubTab("stock")}
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Till Stock
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "config") && <PosButtonConfigurator tillId="till1" />}
      {activeSubTab === "stock" && <TillStockManagement />}
    </div>
  );

  const renderSystemModule = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
        <Button 
          variant={activeSubTab === "" || activeSubTab === "alerts" ? "default" : "outline"}
          onClick={() => setActiveSubTab("alerts")}
          size="sm"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Alerts
        </Button>
        <Button 
          variant={activeSubTab === "maintenance" ? "default" : "outline"}
          onClick={() => setActiveSubTab("maintenance")}
          size="sm"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Maintenance
        </Button>
      </div>
      
      {(activeSubTab === "" || activeSubTab === "alerts") && <SystemAlerts />}
      {activeSubTab === "maintenance" && <SystemMaintenance />}
    </div>
  );

  const renderModuleContent = () => {
    switch (activeModule) {
      case "dashboard": return renderDashboard();
      case "inventory": return renderInventoryModule();
      case "purchasing": return renderPurchasingModule();
      case "sales": return renderSalesModule();
      case "pricing": return renderPricingModule();
      case "staff": return renderStaffModule();
      case "tills": return renderTillsModule();
      case "system": return renderSystemModule();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2dd4bf] bg-clip-text text-transparent">Qora EPOS Back Office</h1>
            <p className="text-gray-600">
              Welcome back, {currentUser?.firstName} {currentUser?.lastName}
            </p>
          </div>
          <Button variant="outline" onClick={onBackToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {consolidatedModules.map((module) => (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "default" : "outline"}
              onClick={() => handleModuleClick(module.id)}
              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                activeModule === module.id ? module.color + " text-white" : ""
              }`}
            >
              <module.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{module.title}</span>
            </Button>
          ))}
        </div>

        {renderModuleContent()}
      </div>
    </div>
  );
}