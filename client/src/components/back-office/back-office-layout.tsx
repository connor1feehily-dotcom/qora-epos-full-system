import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Package, 
  Users, 
  Receipt, 
  Settings,
  TrendingUp,
  FileText,
  Shield,
  Home,
  Monitor,
  Archive
} from "lucide-react";
import { Dashboard } from "./dashboard";
import { InventoryManagement } from "./inventory-management";
import { SalesReports } from "./sales-reports";
import { UserManagement } from "./user-management";
import { SimpleProductManager } from "@/components/simple-product-manager";

interface BackOfficeLayoutProps {
  onBackToMenu: () => void;
}

export function BackOfficeLayout({ onBackToMenu }: BackOfficeLayoutProps) {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, description: "Overview & Analytics" },
    { id: "products", label: "Products", icon: Package, description: "Add & Manage Products" },
    { id: "inventory", label: "Inventory", icon: Archive, description: "Stock Management" },
    { id: "sales", label: "Sales Reports", icon: BarChart3, description: "Transaction Analysis" },
    { id: "users", label: "User Management", icon: Users, description: "Staff & Permissions" },
    { id: "settings", label: "System Settings", icon: Settings, description: "Configuration" }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <SimpleProductManager />;
      case "inventory":
        return <InventoryManagement />;
      case "sales":
        return <SalesReports />;
      case "users":
        return <UserManagement />;
      case "settings":
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-cyan-500 to-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Back Office</h1>
              <p className="text-cyan-100 text-sm">Kerrigan's XL Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <p className={`text-xs ${isActive ? 'text-cyan-100' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
        
        <div className="p-4 border-t bg-gray-50">
          <Button 
            onClick={onBackToMenu}
            variant="outline" 
            className="w-full h-12 text-base font-medium"
          >
            ← Return to Main Menu
          </Button>
          
          <div className="mt-4 text-center">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              System Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Security Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Require PIN for transactions</span>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-logout after inactivity</span>
              <Badge className="bg-green-100 text-green-800">30 minutes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Till session management</span>
              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Receipt className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Receipt Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Print receipts automatically</span>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer display active</span>
              <Badge className="bg-green-100 text-green-800">Yes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">VAT rate</span>
              <Badge className="bg-gray-100 text-gray-800">23%</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold">Inventory Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Low stock threshold</span>
              <Badge className="bg-orange-100 text-orange-800">10 items</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-reorder alerts</span>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Barcode scanning</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">Backup & Reports</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Daily backup</span>
              <Badge className="bg-green-100 text-green-800">Automated</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Z-report generation</span>
              <Badge className="bg-blue-100 text-blue-800">End of day</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data retention</span>
              <Badge className="bg-gray-100 text-gray-800">2 years</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">v2.1.0</div>
            <p className="text-sm text-blue-800">System Version</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-sm text-green-800">Uptime</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">PostgreSQL</div>
            <p className="text-sm text-purple-800">Database</p>
          </div>
        </div>
      </Card>
    </div>
  );
}