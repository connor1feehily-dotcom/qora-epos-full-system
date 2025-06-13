import { useState } from "react";
import { Home, Calculator, BarChart3, Settings, Users, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingNavigationProps {
  currentMode: 'main-menu' | 'pos' | 'back-office';
  onNavigate: (mode: 'main-menu' | 'pos' | 'back-office') => void;
  onLogout: () => void;
  currentUser: any;
}

export function FloatingNavigation({ currentMode, onNavigate, onLogout, currentUser }: FloatingNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const navigationItems = [
    {
      id: 'main-menu',
      icon: Home,
      label: 'Main Menu',
      onClick: () => onNavigate('main-menu'),
      active: currentMode === 'main-menu'
    },
    {
      id: 'pos',
      icon: Calculator,
      label: 'Point of Sale',
      onClick: () => onNavigate('pos'),
      active: currentMode === 'pos'
    },
    {
      id: 'back-office',
      icon: BarChart3,
      label: 'Back Office',
      onClick: () => onNavigate('back-office'),
      active: currentMode === 'back-office',
      requiresAuth: true
    },
    {
      id: 'divider',
      isDivider: true
    },
    {
      id: 'logout',
      icon: LogOut,
      label: 'Logout',
      onClick: onLogout,
      variant: 'destructive' as const
    }
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <TooltipProvider>
      <div 
        className={`kxl-floating-nav ${isExpanded ? 'kxl-nav-expanded' : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            if (item.isDivider) {
              return <div key={item.id} className="my-2 h-px bg-gray-200" />;
            }

            if (item.requiresAuth && (!currentUser || currentUser.role === 'cashier')) {
              return null;
            }

            const Icon = item.icon!;
            const isActive = item.active;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={item.variant || (isActive ? "default" : "ghost")}
                    size="sm"
                    className={`
                      kxl-nav-icon justify-start
                      ${isActive ? 'bg-primary text-white' : 'hover:bg-primary/10'}
                      ${isExpanded ? 'w-full' : 'w-12'}
                      ${item.variant === 'destructive' ? 'hover:bg-red-100 hover:text-red-600' : ''}
                    `}
                    onClick={item.onClick}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                        {item.label}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" className="bg-gray-900 text-white">
                    <p>{item.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {/* User Info Section */}
        {isExpanded && currentUser && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-900 truncate">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {currentUser.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}