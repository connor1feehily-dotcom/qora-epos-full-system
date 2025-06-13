import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  Store, 
  BarChart3, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  UserRoundCheck, 
  Fuel, 
  CreditCard, 
  Percent,
  User
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const mainNavItems = [
    { href: "/", label: "Point of Sale", icon: Store, primary: true },
    { href: "/back-office", label: "Back Office", icon: BarChart3 },
  ];

  const managementItems = [
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/suppliers", label: "Suppliers", icon: Truck },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/staff", label: "Staff", icon: UserRoundCheck },
  ];

  const operationItems = [
    { href: "/fuel-control", label: "Fuel Control", icon: Fuel },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/promotions", label: "Promotions", icon: Percent },
  ];

  return (
    <div className={cn("bg-white shadow-lg w-64 flex-shrink-0 border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Store className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kerrigans XL</h1>
            <p className="text-sm text-gray-500">Manorhamilton</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {/* Main Navigation */}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors font-medium",
                  isActive || item.primary 
                    ? "text-white bg-primary hover:bg-blue-700" 
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}

        {/* Management Section */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Management
          </p>
          {managementItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2 text-left rounded-lg transition-colors",
                    isActive 
                      ? "text-white bg-primary" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>

        {/* Operations Section */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Operations
          </p>
          {operationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2 text-left rounded-lg transition-colors",
                    isActive 
                      ? "text-white bg-primary" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
