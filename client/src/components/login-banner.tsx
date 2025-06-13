import { User, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LoginBannerProps {
  user: any;
  tillId?: string;
  sessionStart?: string;
}

export function LoginBanner({ user, tillId, sessionStart }: LoginBannerProps) {
  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cashier':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSessionDuration = () => {
    if (!sessionStart) return '';
    const start = new Date(sessionStart);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="kxl-login-banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-gray-900">
                Welcome, {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-gray-600">
                Kerrigan's XL POS System Active
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {tillId && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Till {tillId}</span>
            </div>
          )}
          
          {sessionStart && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{getSessionDuration()}</span>
            </div>
          )}

          <Badge className={getRoleColor(user.role)}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        </div>
      </div>
    </div>
  );
}