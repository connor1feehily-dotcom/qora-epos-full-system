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
  Target
} from "lucide-react";
import { PosButtonConfigurator } from "./pos-button-configurator";
import { InventoryManagement } from "./inventory-management";
import { StaffManagement } from "./staff-management";
import { PromotionsEngine } from "./promotions-engine";
import { PurchaseOrderManagement } from "./purchase-order-management";
import { AdvancedAnalytics } from "./advanced-analytics";

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
      id: "pos-config",
      title: "POS Configuration",
      description: "Customize button layouts for each till",
      icon: Grid,
      color: "bg-blue-500",
      features: ["Custom buttons", "Drag & drop layout", "Per-till configuration"]
    },
    {
      id: "inventory",
      title: "Inventory Management",
      description: "Track stock levels and manage products",
      icon: Package,
      color: "bg-green-500",
      features: ["Real-time tracking", "Auto reorder", "Barcode scanning"]
    },
    {
      id: "staff",
      title: "Staff Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      color: "bg-purple-500",
      features: ["Role-based access", "Shift scheduling", "Performance tracking"]
    },
    {
      id: "promotions",
      title: "Promotions Engine",
      description: "Create and manage promotional campaigns",
      icon: Target,
      color: "bg-orange-500",
      features: ["BOGOF deals", "Time-based offers", "Customer targeting"]
    },
    {
      id: "purchase-orders",
      title: "Purchase Orders",
      description: "Manage supplier orders and deliveries",
      icon: FileText,
      color: "bg-indigo-500",
      features: ["Supplier management", "Order tracking", "Auto-generation"]
    },
    {
      id: "analytics",
      title: "Advanced Analytics",
      description: "Detailed reports and insights",
      icon: TrendingUp,
      color: "bg-pink-500",
      features: ["Sales analysis", "Trend forecasting", "Custom reports"]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "pos-config":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Till 1 Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <PosButtonConfigurator tillId="till1" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Till 2 Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <PosButtonConfigurator tillId="till2" />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "inventory":
        return <InventoryManagement />;
      case "staff":
        return <StaffManagement />;
      case "promotions":
        return <PromotionsEngine />;
      case "purchase-orders":
        return <PurchaseOrderManagement />;
      case "analytics":
        return <AdvancedAnalytics />;
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

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pos-config">POS Config</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="purchase-orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}