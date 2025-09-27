import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
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
  Palette,
  Shield
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
import PosterMaker from "./poster-maker";
import PlatformAdmin from "./platform-admin";

interface BackOfficeDashboardProps {
  onBackToMenu: () => void;
  currentUser: any;
}

export function BackOfficeDashboard({ onBackToMenu, currentUser }: BackOfficeDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: () => fetch("/api/analytics/dashboard").then(res => res.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
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
    {
      action: "Product Added",
      details: "New item added to inventory",
      time: "2 minutes ago",
      user: "Admin"
    },
    {
      action: "Price Updated",
      details: "Milk price changed to €1.49",
      time: "15 minutes ago",
      user: "Manager"
    },
    {
      action: "Staff Login",
      details: "John Doe logged into Till 1",
      time: "32 minutes ago",
      user: "System"
    },
    {
      action: "Promotion Created",
      details: "Buy 2 Get 1 Free on Sodas",
      time: "1 hour ago",
      user: "Manager"
    }
  ];

  const managementModules = [
    {
      id: "sales-ledger",
      title: "Sales Ledger",
      description: "Complete sales transaction management",
      icon: FileText,
      color: "bg-blue-500",
      features: ["Transaction history", "Customer accounts", "Payment tracking"]
    },
    {
      id: "stock-ledger",
      title: "Stock Ledger",
      description: "Detailed stock movement tracking",
      icon: Package,
      color: "bg-green-500",
      features: ["Movement history", "Audit trails", "Stock valuation"]
    },
    {
      id: "multi-price-changes",
      title: "Multi Price Changes",
      description: "Bulk price update management",
      icon: DollarSign,
      color: "bg-yellow-500",
      features: ["Bulk updates", "Price history", "Automated pricing"]
    },
    {
      id: "value-projection",
      title: "Value Projection",
      description: "Financial forecasting and projections",
      icon: TrendingUp,
      color: "bg-purple-500",
      features: ["Revenue forecasts", "Cost analysis", "Profit margins"]
    },
    {
      id: "packages",
      title: "Packages",
      description: "Bundle and package management",
      icon: Grid,
      color: "bg-indigo-500",
      features: ["Product bundles", "Combo deals", "Package pricing"]
    },
    {
      id: "reports",
      title: "Reports",
      description: "Comprehensive business reporting",
      icon: Settings,
      color: "bg-pink-500",
      features: ["Sales reports", "Inventory reports", "Financial summaries"]
    },
    {
      id: "promotions",
      title: "Promotions",
      description: "Marketing campaign management",
      icon: Target,
      color: "bg-orange-500",
      features: ["Campaign creation", "Discount rules", "Performance tracking"]
    },
    {
      id: "management",
      title: "Management",
      description: "System administration and configuration",
      icon: Users,
      color: "bg-red-500",
      features: ["User management", "System settings", "Security controls"]
    },
    {
      id: "price-updates",
      title: "Price Updates",
      description: "Dynamic pricing and updates",
      icon: AlertTriangle,
      color: "bg-cyan-500",
      features: ["Real-time updates", "Price alerts", "Competitor tracking"]
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description: "System maintenance and diagnostics",
      icon: Settings,
      color: "bg-gray-500",
      features: ["System health", "Database cleanup", "Performance monitoring"]
    },
    {
      id: "till-stock",
      title: "Till Stock",
      description: "Till-specific inventory management",
      icon: ShoppingCart,
      color: "bg-teal-500",
      features: ["Till allocation", "Stock transfers", "Float management"]
    },
    {
      id: "stock-transfers",
      title: "Stock Transfers",
      description: "Inter-location stock movement",
      icon: Package,
      color: "bg-emerald-500",
      features: ["Transfer orders", "Transit tracking", "Receiving confirmation"]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales-ledger":
        return (
          <div className="space-y-6">
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
                  <div className="space-y-3">
                    <h3 className="font-semibold">Recent Transactions</h3>
                    <div className="max-h-96 overflow-y-auto">
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
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "stock-ledger":
        return (
          <div className="space-y-6">
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
                  <div className="space-y-3">
                    <h3 className="font-semibold">Stock Movements</h3>
                    <div className="max-h-96 overflow-y-auto">
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
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "multi-price-changes":
        return (
          <div className="space-y-6">
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
          </div>
        );
      case "value-projection":
        return <ValueProjection />;
      case "packages":
        return <PackagesManagement />;
      case "till-stock":
        return <TillStockManagement />;
      case "promotions":
        return <PromotionsEngine />;
      case "maintenance":
        return <SystemMaintenance />;
      case "reports":
        return (
          <div className="space-y-6">
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
          </div>
        );
      case "management":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <p className="text-gray-600">System administration and configuration</p>
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
          </div>
        );
      case "deliveries":
        return <DeliveryApprovalDashboard currentUser={currentUser} />;
      case "suppliers":
        return <SupplierPerformanceDashboard />;
      case "ai-optimization":
        return <AIPriceOptimization />;
      case "staff-activity":
        return <StaffActivityLog />;
      case "alerts":
        return <SystemAlerts />;
      case "mobile-scanner":
        return <EnhancedMobileScanner userId={currentUser?.id} userName={`${currentUser?.firstName} ${currentUser?.lastName}`} />;
      case "advanced-inventory":
        return <AdvancedInventoryTweaks />;
      case "advanced-staff":
        return <AdvancedStaffManagement />;
      case "smart-analytics":
        return <SmartAnalytics />;
      case "supplier-integration":
        return <SupplierOrderIntegration />;
      case "supplier-dashboard":
        return <SupplierDashboard onBackToMenu={() => setActiveTab("overview")} currentUser={currentUser} />;
      case "stock-taking":
        return <StockTakingSystem onBackToMenu={() => setActiveTab("overview")} currentUser={currentUser} />;
      case "poster-maker":
        return <PosterMaker />;
      case "platform-admin":
        return <PlatformAdmin />;
      case "pos-config":
        return <PosButtonConfigurator tillId="till1" />;
      case "inventory":
        return <InventoryManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
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

            {/* Management Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Management Modules</CardTitle>
                <p className="text-gray-600">Access key back office functions</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {managementModules.map((module) => (
                    <Card 
                      key={module.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setActiveTab(module.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${module.color}`}>
                            <module.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{module.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {module.features.map((feature, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity & Low Stock Alerts */}
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Back Office Management</h1>
            <p className="text-gray-600">
              Welcome back, {currentUser?.firstName} {currentUser?.lastName}
            </p>
          </div>
          <Button variant="outline" onClick={onBackToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile-Friendly Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <Button 
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Settings className="w-4 h-4" />
              Overview
            </Button>
            <Button 
              variant={activeTab === "pos-config" ? "default" : "outline"}
              onClick={() => setActiveTab("pos-config")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Grid className="w-4 h-4" />
              POS Config
            </Button>
            <Button 
              variant={activeTab === "inventory" ? "default" : "outline"}
              onClick={() => setActiveTab("inventory")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Package className="w-4 h-4" />
              Inventory
            </Button>
            <Button 
              variant={activeTab === "staff" ? "default" : "outline"}
              onClick={() => setActiveTab("staff")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Users className="w-4 h-4" />
              Staff
            </Button>
            <Button 
              variant={activeTab === "sales-ledger" ? "default" : "outline"}
              onClick={() => setActiveTab("sales-ledger")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <FileText className="w-4 h-4" />
              Sales
            </Button>
            <Button 
              variant={activeTab === "stock-ledger" ? "default" : "outline"}
              onClick={() => setActiveTab("stock-ledger")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Package className="w-4 h-4" />
              Stock
            </Button>
            <Button 
              variant={activeTab === "advanced-inventory" ? "default" : "outline"}
              onClick={() => setActiveTab("advanced-inventory")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Plus className="w-4 h-4" />
              Adv Stock
            </Button>
            <Button 
              variant={activeTab === "advanced-staff" ? "default" : "outline"}
              onClick={() => setActiveTab("advanced-staff")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Clock className="w-4 h-4" />
              Adv Staff
            </Button>
            <Button 
              variant={activeTab === "smart-analytics" ? "default" : "outline"}
              onClick={() => setActiveTab("smart-analytics")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </Button>
            <Button 
              variant={activeTab === "deliveries" ? "default" : "outline"}
              onClick={() => setActiveTab("deliveries")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Deliveries
            </Button>
            <Button 
              variant={activeTab === "suppliers" ? "default" : "outline"}
              onClick={() => setActiveTab("suppliers")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Users className="w-4 h-4" />
              Suppliers
            </Button>
            <Button 
              variant={activeTab === "ai-optimization" ? "default" : "outline"}
              onClick={() => setActiveTab("ai-optimization")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Target className="w-4 h-4" />
              AI Price
            </Button>
            <Button 
              variant={activeTab === "staff-activity" ? "default" : "outline"}
              onClick={() => setActiveTab("staff-activity")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Eye className="w-4 h-4" />
              Activity
            </Button>
            <Button 
              variant={activeTab === "alerts" ? "default" : "outline"}
              onClick={() => setActiveTab("alerts")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Alerts
            </Button>
            <Button 
              variant={activeTab === "supplier-integration" ? "default" : "outline"}
              onClick={() => setActiveTab("supplier-integration")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <DollarSign className="w-4 h-4" />
              Orders
            </Button>
            <Button 
              variant={activeTab === "mobile-scanner" ? "default" : "outline"}
              onClick={() => setActiveTab("mobile-scanner")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Package className="w-4 h-4" />
              Scanner
            </Button>
            <Button 
              variant={activeTab === "value-projection" ? "default" : "outline"}
              onClick={() => setActiveTab("value-projection")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <DollarSign className="w-4 h-4" />
              Forecast
            </Button>
            <Button 
              variant={activeTab === "packages" ? "default" : "outline"}
              onClick={() => setActiveTab("packages")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Grid className="w-4 h-4" />
              Packages
            </Button>
            <Button 
              variant={activeTab === "till-stock" ? "default" : "outline"}
              onClick={() => setActiveTab("till-stock")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Till Stock
            </Button>
            <Button 
              variant={activeTab === "promotions" ? "default" : "outline"}
              onClick={() => setActiveTab("promotions")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Target className="w-4 h-4" />
              Promos
            </Button>
            <Button 
              variant={activeTab === "maintenance" ? "default" : "outline"}
              onClick={() => setActiveTab("maintenance")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Settings className="w-4 h-4" />
              Maintain
            </Button>
            <Button 
              variant={activeTab === "management" ? "default" : "outline"}
              onClick={() => setActiveTab("management")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Users className="w-4 h-4" />
              Admin
            </Button>
            <Button 
              variant={activeTab === "supplier-dashboard" ? "default" : "outline"}
              onClick={() => setActiveTab("supplier-dashboard")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Package className="w-4 h-4" />
              AI Orders
            </Button>
            <Button 
              variant={activeTab === "poster-maker" ? "default" : "outline"}
              onClick={() => setActiveTab("poster-maker")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Palette className="w-4 h-4" />
              Marketing
            </Button>
            <Button 
              variant={activeTab === "platform-admin" ? "default" : "outline"}
              onClick={() => setActiveTab("platform-admin")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <Shield className="w-4 h-4" />
              Platform
            </Button>
            <Button 
              variant={activeTab === "stock-taking" ? "default" : "outline"}
              onClick={() => setActiveTab("stock-taking")}
              className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
            >
              <CheckCircle className="w-4 h-4" />
              Stock Take
            </Button>
          </div>

          <TabsContent value={activeTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}