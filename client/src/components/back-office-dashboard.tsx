import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CheckCircle
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

// Comprehensive demo feature information for retailers
const demoFeatureInfo: Record<string, { title: string; description: string; whyImportant: string; keyBenefits: string[]; retailValue: string }> = {
  "overview": {
    title: "Dashboard Overview",
    description: "Your command center for real-time business insights. See daily revenue, transaction counts, and critical alerts at a glance.",
    whyImportant: "Retailers need instant visibility into business performance. The dashboard eliminates guesswork by showing exactly how your store is performing RIGHT NOW.",
    keyBenefits: ["Real-time sales tracking", "Low stock alerts", "Daily performance metrics", "Quick access to all modules"],
    retailValue: "Average retailers save 2+ hours daily by having all critical metrics in one place instead of checking multiple reports."
  },
  "smart-analytics": {
    title: "Smart Analytics",
    description: "AI-powered business intelligence that analyzes your sales patterns, customer behavior, and inventory trends to provide actionable insights.",
    whyImportant: "Data-driven decisions increase profit margins by 15-25%. This module transforms raw sales data into strategic recommendations.",
    keyBenefits: ["Sales trend analysis", "Customer purchase patterns", "Peak hours identification", "Product performance ranking"],
    retailValue: "Retailers using analytics typically see 20% improvement in inventory efficiency and 15% increase in upselling opportunities."
  },
  "staff-activity": {
    title: "Staff Activity Log",
    description: "Complete audit trail of all staff actions including price changes, void transactions, discounts applied, and inventory adjustments.",
    whyImportant: "Accountability reduces shrinkage by up to 50%. Know exactly who did what and when for complete operational transparency.",
    keyBenefits: ["Full audit history", "Void transaction tracking", "Discount monitoring", "Manager approval workflows"],
    retailValue: "Stores with proper staff activity tracking see 3-5% reduction in unexplained losses."
  },
  "sales-ledger": {
    title: "Sales Ledger",
    description: "Complete transaction history with detailed line items, payment methods, and customer information for every sale.",
    whyImportant: "Accurate sales records are essential for tax compliance, dispute resolution, and understanding your revenue streams.",
    keyBenefits: ["Transaction search & filtering", "Payment method breakdown", "Daily/weekly/monthly summaries", "Export for accounting"],
    retailValue: "Proper sales ledger management ensures 100% tax compliance and provides evidence for any customer disputes."
  },
  "supplier-integration": {
    title: "Supplier Order Integration",
    description: "Streamlined ordering system that connects directly with your suppliers for faster procurement and better stock management.",
    whyImportant: "Manual ordering is error-prone and time-consuming. Automated integration reduces ordering time by 80% and prevents stockouts.",
    keyBenefits: ["Automated reorder suggestions", "Supplier catalog integration", "Order history tracking", "Delivery scheduling"],
    retailValue: "Retailers save an average of 5 hours per week on ordering tasks and reduce stockouts by 40%."
  },
  "value-projection": {
    title: "Value Projection & Forecasting",
    description: "Financial forecasting tools that predict future sales, cash flow, and inventory needs based on historical data and trends.",
    whyImportant: "Planning ahead prevents cash flow problems and ensures you're prepared for seasonal demands.",
    keyBenefits: ["Revenue forecasting", "Profit margin analysis", "Seasonal trend predictions", "Budget planning tools"],
    retailValue: "Accurate forecasting helps retailers maintain optimal stock levels and improve cash flow management by 30%."
  },
  "inventory": {
    title: "Inventory Management",
    description: "Complete control over your stock levels, pricing, product information, and categorization.",
    whyImportant: "Inventory is your biggest asset. Proper management prevents overstocking (dead capital) and stockouts (lost sales).",
    keyBenefits: ["Real-time stock levels", "Product categorization", "Barcode management", "Price updates"],
    retailValue: "Effective inventory management can reduce carrying costs by 20-30% while improving product availability."
  },
  "stock-ledger": {
    title: "Stock Ledger",
    description: "Detailed record of all stock movements including sales, deliveries, returns, wastage, and adjustments.",
    whyImportant: "Understanding where your stock goes helps identify shrinkage, optimize ordering, and ensure accurate valuations.",
    keyBenefits: ["Movement history", "Stock valuation", "Shrinkage tracking", "Audit compliance"],
    retailValue: "Stock ledger analysis typically reveals 2-5% of inventory being lost to untracked causes."
  },
  "advanced-inventory": {
    title: "Advanced Inventory Tools",
    description: "Batch editing, expiry date tracking, and smart forecasting for complex inventory needs.",
    whyImportant: "Large product ranges need efficient tools. Batch operations save hours of manual work.",
    keyBenefits: ["Bulk price updates", "Expiry date alerts", "Demand forecasting", "Category-wide changes"],
    retailValue: "Stores with 500+ products save 10+ hours weekly on inventory management with advanced tools."
  },
  "till-stock": {
    title: "Till Stock Management",
    description: "Allocate and track inventory at individual till stations, manage float levels, and handle inter-till transfers.",
    whyImportant: "Multi-till operations need precise stock allocation to prevent shortages and ensure accurate Z-reads.",
    keyBenefits: ["Till allocation", "Float management", "Stock transfers", "End-of-day reconciliation"],
    retailValue: "Proper till management ensures accurate daily reconciliation and reduces end-of-day discrepancies by 90%."
  },
  "stock-taking": {
    title: "Stock Taking System",
    description: "Mobile-friendly stock counting with barcode scanning, variance reports, and automatic inventory updates.",
    whyImportant: "Regular stock takes are essential for accuracy. This system makes counts 5x faster than paper-based methods.",
    keyBenefits: ["Mobile scanning", "Variance reports", "Scheduled counts", "Automatic adjustments"],
    retailValue: "Digital stock taking reduces counting time by 80% and improves accuracy to 99%+."
  },
  "packages": {
    title: "Package & Bundle Management",
    description: "Create product bundles, combo deals, and multi-buy offers that automatically apply at checkout.",
    whyImportant: "Bundling increases average transaction value by 15-30%. Make it easy for customers to buy more.",
    keyBenefits: ["Combo deal creation", "Automatic pricing", "Bundle discounts", "Promotional packages"],
    retailValue: "Retailers using bundle promotions see 25% higher average transaction values."
  },
  "deliveries": {
    title: "Delivery Management",
    description: "Process supplier deliveries with scanning, quantity verification, and automatic stock updates.",
    whyImportant: "Delivery errors cost money. Verification at receipt catches problems before they impact your inventory.",
    keyBenefits: ["Delivery scanning", "Quantity verification", "Variance alerts", "Automatic stock updates"],
    retailValue: "Catching delivery errors saves an average of 2-3% on supplier costs."
  },
  "suppliers": {
    title: "Supplier Performance",
    description: "Track supplier reliability, delivery accuracy, pricing history, and margin contributions.",
    whyImportant: "Know which suppliers deliver value. Make data-driven decisions about who to order from.",
    keyBenefits: ["Delivery tracking", "Price history", "Margin analysis", "Performance rankings"],
    retailValue: "Supplier optimization typically improves margins by 3-5% through better negotiation and selection."
  },
  "mobile-scanner": {
    title: "Mobile Scanner",
    description: "Use your smartphone as a barcode scanner for stock counts, delivery verification, and price checks.",
    whyImportant: "Mobile scanning eliminates the need for expensive handheld devices while maintaining full functionality.",
    keyBenefits: ["Camera scanning", "Offline capability", "Real-time sync", "Multi-device support"],
    retailValue: "Saves €500+ per device compared to dedicated scanners with same functionality."
  },
  "supplier-dashboard": {
    title: "AI-Powered Ordering",
    description: "Intelligent order suggestions based on sales velocity, seasonality, and supplier lead times.",
    whyImportant: "AI removes guesswork from ordering. Never run out of bestsellers or overstock slow-movers.",
    keyBenefits: ["Smart reorder points", "Seasonal adjustments", "Lead time optimization", "Budget-aware suggestions"],
    retailValue: "AI ordering reduces stockouts by 60% and overstock by 40%."
  },
  "ai-optimization": {
    title: "AI Price Optimization",
    description: "Machine learning analyzes your market position and suggests optimal pricing for maximum profit.",
    whyImportant: "Pricing is the biggest lever for profitability. Even 1% improvement impacts the bottom line significantly.",
    keyBenefits: ["Competitor analysis", "Margin optimization", "Dynamic pricing", "Promotional recommendations"],
    retailValue: "Optimized pricing typically improves gross margins by 2-5%."
  },
  "promotions": {
    title: "Promotions Engine",
    description: "Create and manage sales promotions including percentage discounts, BOGOF, multi-buy offers, and time-limited deals.",
    whyImportant: "Strategic promotions drive traffic and clear slow stock. The right promotion at the right time maximizes ROI.",
    keyBenefits: ["Multiple promo types", "Scheduled promotions", "Category-wide deals", "Performance tracking"],
    retailValue: "Well-timed promotions increase foot traffic by 30% and help clear aged stock before write-offs."
  },
  "staff": {
    title: "Staff Management",
    description: "Manage employee records, roles, permissions, PIN codes, and access levels for secure operations.",
    whyImportant: "Role-based access prevents unauthorized actions while ensuring staff have the tools they need.",
    keyBenefits: ["Role permissions", "PIN management", "Access control", "Activity tracking"],
    retailValue: "Proper access control reduces internal fraud and errors by 70%."
  },
  "advanced-staff": {
    title: "Advanced Staff Features",
    description: "Time clock integration, shift scheduling, performance incentives, and team communication tools.",
    whyImportant: "Engaged staff perform better. Track hours accurately and reward top performers.",
    keyBenefits: ["Time tracking", "Shift management", "Performance metrics", "Incentive programs"],
    retailValue: "Staff incentive programs increase sales productivity by 15-25%."
  },
  "management": {
    title: "System Administration",
    description: "User management, system settings, security controls, and organizational configuration.",
    whyImportant: "Proper system administration ensures security, compliance, and optimal performance.",
    keyBenefits: ["User administration", "Security settings", "Backup management", "System configuration"],
    retailValue: "Regular system maintenance prevents 95% of potential downtime issues."
  },
  "pos-config": {
    title: "POS Configuration",
    description: "Customize your till interface with quick-access buttons, category layouts, and shortcut configurations.",
    whyImportant: "Optimized till layouts speed up transactions. Every second saved at checkout improves customer satisfaction.",
    keyBenefits: ["Custom buttons", "Category shortcuts", "Layout customization", "Quick-access products"],
    retailValue: "Optimized POS layouts reduce average transaction time by 20%."
  },
  "alerts": {
    title: "System Alerts",
    description: "Real-time notifications for low stock, price changes, system issues, and business events.",
    whyImportant: "Proactive alerts prevent problems before they impact customers. Never be caught off guard.",
    keyBenefits: ["Low stock warnings", "Price change alerts", "System notifications", "Custom thresholds"],
    retailValue: "Alert systems prevent 80% of stockouts by warning before items run out."
  },
  "maintenance": {
    title: "System Maintenance",
    description: "Health monitoring, database optimization, backup management, and performance diagnostics.",
    whyImportant: "Regular maintenance prevents system failures. Downtime during peak hours is extremely costly.",
    keyBenefits: ["Health checks", "Performance monitoring", "Backup scheduling", "Error diagnostics"],
    retailValue: "Proactive maintenance reduces unplanned downtime by 95%."
  }
};

export function BackOfficeDashboard({ onBackToMenu, currentUser }: BackOfficeDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDemoModule, setSelectedDemoModule] = useState<any>(null);
  const [demoInfo, setDemoInfo] = useState<typeof demoFeatureInfo[string] | null>(null);

  const { toast } = useToast();

  const handleDemoFeatureClick = (tabId: string, icon: any, color: string) => {
    if (currentUser?.username === "demo_user") {
      const info = demoFeatureInfo[tabId] || {
        title: tabId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: "This feature helps manage your retail operations more efficiently.",
        whyImportant: "Every aspect of retail management matters for profitability.",
        keyBenefits: ["Improved efficiency", "Better control", "Time savings", "Reduced errors"],
        retailValue: "This feature contributes to overall store performance."
      };
      setDemoInfo(info);
      setSelectedDemoModule({ title: info.title, icon, color, description: info.description });
      setShowDemoModal(true);
    }
  };

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

  const renderDemoModal = () => {
    if (!selectedDemoModule || !demoInfo) return null;

    return (
      <AlertDialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-14 h-14 rounded-xl ${selectedDemoModule.color} flex items-center justify-center shadow-lg`}>
                <selectedDemoModule.icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-2xl font-bold text-gray-900">{demoInfo.title}</AlertDialogTitle>
                <p className="text-sm text-gray-500">Qora EPOS Feature</p>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* What it does */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="text-lg">📋</span> What It Does
              </h4>
              <p className="text-blue-800 leading-relaxed">{demoInfo.description}</p>
            </div>

            {/* Why it's important */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> Why It's Important for Retailers
              </h4>
              <p className="text-green-800 leading-relaxed">{demoInfo.whyImportant}</p>
            </div>

            {/* Key benefits */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <span className="text-lg">✅</span> Key Benefits
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {demoInfo.keyBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-purple-800">
                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Retail value */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💰</span> Real Retail Impact
              </h4>
              <p className="text-amber-800 leading-relaxed font-medium">{demoInfo.retailValue}</p>
            </div>

            {/* Demo mode notice */}
            <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm text-center">
                🚀 <strong>Demo Mode:</strong> You have full access to explore this feature. Try it out!
              </p>
            </div>
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogAction 
              onClick={() => setShowDemoModal(false)}
              className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#2dd4bf] text-white hover:opacity-90 font-semibold py-3"
            >
              Continue to {demoInfo.title} →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

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
                      className="cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
                      onClick={() => {
                        if (currentUser?.username === "demo_user") {
                          setSelectedDemoModule(module);
                          setShowDemoModal(true);
                        }
                        setActiveTab(module.id);
                      }}
                    >
                      {currentUser?.username === "demo_user" && (
                        <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[10px] text-white font-bold uppercase tracking-wider">Demo</div>
                      )}
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
      {renderDemoModal()}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2dd4bf] bg-clip-text text-transparent">Qora EPOS Back Office</h1>
            <p className="text-gray-600">
              Welcome back, {currentUser?.firstName} {currentUser?.lastName}
              {currentUser?.username === "demo_user" && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Demo Mode
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={onBackToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Organized Navigation Grid with Sections */}
          <div className="space-y-4">
            {/* SECTION 1: DASHBOARD & OVERVIEW */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Dashboard & Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "overview" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("overview", Settings, "bg-blue-500");
                    setActiveTab("overview");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-overview"
                >
                  <Settings className="w-4 h-4" />
                  Overview
                </Button>
                <Button 
                  variant={activeTab === "smart-analytics" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("smart-analytics", TrendingUp, "bg-purple-500");
                    setActiveTab("smart-analytics");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-analytics"
                >
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Button>
                <Button 
                  variant={activeTab === "staff-activity" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("staff-activity", Eye, "bg-blue-400");
                    setActiveTab("staff-activity");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-activity"
                >
                  <Eye className="w-4 h-4" />
                  Activity
                </Button>
              </div>
            </div>

            {/* SECTION 2: SALES MANAGEMENT */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Sales Management</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "sales-ledger" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("sales-ledger", FileText, "bg-blue-500");
                    setActiveTab("sales-ledger");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-sales"
                >
                  <FileText className="w-4 h-4" />
                  Sales
                </Button>
                <Button 
                  variant={activeTab === "supplier-integration" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("supplier-integration", DollarSign, "bg-green-500");
                    setActiveTab("supplier-integration");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-orders"
                >
                  <DollarSign className="w-4 h-4" />
                  Orders
                </Button>
                <Button 
                  variant={activeTab === "value-projection" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("value-projection", DollarSign, "bg-purple-500");
                    setActiveTab("value-projection");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-forecast"
                >
                  <DollarSign className="w-4 h-4" />
                  Forecast
                </Button>
              </div>
            </div>

            {/* SECTION 3: INVENTORY CONTROL */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Inventory Control</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "inventory" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("inventory", Package, "bg-green-500");
                    setActiveTab("inventory");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-inventory"
                >
                  <Package className="w-4 h-4" />
                  Inventory
                </Button>
                <Button 
                  variant={activeTab === "stock-ledger" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("stock-ledger", Package, "bg-green-500");
                    setActiveTab("stock-ledger");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-stock"
                >
                  <Package className="w-4 h-4" />
                  Stock
                </Button>
                <Button 
                  variant={activeTab === "advanced-inventory" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("advanced-inventory", Plus, "bg-emerald-500");
                    setActiveTab("advanced-inventory");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-adv-stock"
                >
                  <Plus className="w-4 h-4" />
                  Adv Stock
                </Button>
                <Button 
                  variant={activeTab === "till-stock" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("till-stock", ShoppingCart, "bg-teal-500");
                    setActiveTab("till-stock");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-till-stock"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Till Stock
                </Button>
                <Button 
                  variant={activeTab === "stock-taking" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("stock-taking", CheckCircle, "bg-cyan-500");
                    setActiveTab("stock-taking");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-stock-take"
                >
                  <CheckCircle className="w-4 h-4" />
                  Stock Take
                </Button>
                <Button 
                  variant={activeTab === "packages" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("packages", Grid, "bg-indigo-500");
                    setActiveTab("packages");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-packages"
                >
                  <Grid className="w-4 h-4" />
                  Packages
                </Button>
              </div>
            </div>

            {/* SECTION 4: PURCHASING & SUPPLIERS */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Purchasing & Suppliers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "deliveries" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("deliveries", ShoppingCart, "bg-orange-500");
                    setActiveTab("deliveries");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-deliveries"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Deliveries
                </Button>
                <Button 
                  variant={activeTab === "suppliers" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("suppliers", Users, "bg-yellow-500");
                    setActiveTab("suppliers");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-suppliers"
                >
                  <Users className="w-4 h-4" />
                  Suppliers
                </Button>
                <Button 
                  variant={activeTab === "mobile-scanner" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("mobile-scanner", Package, "bg-cyan-500");
                    setActiveTab("mobile-scanner");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-scanner"
                >
                  <Package className="w-4 h-4" />
                  Scanner
                </Button>
                <Button 
                  variant={activeTab === "supplier-dashboard" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("supplier-dashboard", Package, "bg-pink-500");
                    setActiveTab("supplier-dashboard");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-ai-orders"
                >
                  <Package className="w-4 h-4" />
                  AI Orders
                </Button>
              </div>
            </div>

            {/* SECTION 5: PRICING & PROMOTIONS */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Pricing & Promotions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "ai-optimization" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("ai-optimization", Target, "bg-pink-500");
                    setActiveTab("ai-optimization");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-ai-price"
                >
                  <Target className="w-4 h-4" />
                  AI Price
                </Button>
                <Button 
                  variant={activeTab === "promotions" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("promotions", Target, "bg-orange-500");
                    setActiveTab("promotions");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-promos"
                >
                  <Target className="w-4 h-4" />
                  Promos
                </Button>
              </div>
            </div>

            {/* SECTION 6: STAFF & ADMINISTRATION */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Staff & Administration</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "staff" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("staff", Users, "bg-blue-500");
                    setActiveTab("staff");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-staff"
                >
                  <Users className="w-4 h-4" />
                  Staff
                </Button>
                <Button 
                  variant={activeTab === "advanced-staff" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("advanced-staff", Clock, "bg-indigo-500");
                    setActiveTab("advanced-staff");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-adv-staff"
                >
                  <Clock className="w-4 h-4" />
                  Adv Staff
                </Button>
                <Button 
                  variant={activeTab === "management" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("management", Users, "bg-red-500");
                    setActiveTab("management");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-admin"
                >
                  <Users className="w-4 h-4" />
                  Admin
                </Button>
              </div>
            </div>

            {/* SECTION 7: SYSTEM CONFIGURATION */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">System Configuration</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Button 
                  variant={activeTab === "pos-config" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("pos-config", Grid, "bg-violet-500");
                    setActiveTab("pos-config");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-pos-config"
                >
                  <Grid className="w-4 h-4" />
                  POS Config
                </Button>
                <Button 
                  variant={activeTab === "alerts" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("alerts", AlertTriangle, "bg-red-500");
                    setActiveTab("alerts");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-alerts"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Alerts
                </Button>
                <Button 
                  variant={activeTab === "maintenance" ? "default" : "outline"}
                  onClick={() => {
                    handleDemoFeatureClick("maintenance", Settings, "bg-gray-500");
                    setActiveTab("maintenance");
                  }}
                  className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs gap-1 px-2"
                  data-testid="button-maintain"
                >
                  <Settings className="w-4 h-4" />
                  Maintain
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value={activeTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}