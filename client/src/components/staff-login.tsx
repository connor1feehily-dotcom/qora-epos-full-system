import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, User, ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as StaffUser } from "@shared/schema";
import quantumLogo from "@assets/Quantum POS Logo _1754045289852.png";

interface Organization {
  id: string;
  name: string;
  businessType: string;
}

interface StaffLoginProps {
  organization: Organization;
  onLogin: (user: StaffUser) => void;
  onBack: () => void;
}

export function StaffLogin({ organization, onLogin, onBack }: StaffLoginProps) {
  const [mode, setMode] = useState<'pin' | 'username'>('pin');
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const pinLoginMutation = useMutation({
    mutationFn: async (pinCode: string) => {
      const response = await apiRequest('POST', '/api/auth/pin-login', { 
        pin: pinCode,
        organizationId: organization.id
      });
      return await response.json();
    },
    onSuccess: (response: any) => {
      const user = response?.user || response;
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName || user.username || 'User'}!`,
      });
      console.log('✅ PIN LOGIN SUCCESS:', user.firstName, user.lastName, 'at', organization.name);
      onLogin(user);
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid PIN for this location.",
        variant: "destructive",
      });
      setPin("");
    },
  });

  const usernameLoginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { 
        username: credentials.username,
        password: credentials.password,
        organizationId: organization.id
      });
      return await response.json();
    },
    onSuccess: (response: any) => {
      const user = response?.user || response;
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName || user.username || 'User'}!`,
      });
      console.log('✅ USERNAME LOGIN SUCCESS:', user.firstName, user.lastName, 'at', organization.name);
      onLogin(user);
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid credentials for this location.",
        variant: "destructive",
      });
      setPassword("");
    },
  });

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length >= 3 && mode === 'pin') {
        // Auto-submit when PIN is entered
        setTimeout(() => {
          pinLoginMutation.mutate(newPin);
        }, 300);
      }
    }
  };

  const handleClearPin = () => {
    setPin("");
  };

  const handleUsernameLogin = () => {
    if (username.trim() && password.trim()) {
      usernameLoginMutation.mutate({ username, password });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'username') {
      handleUsernameLogin();
    }
  };

  return (
    <div className="min-h-screen kxl-neural-bg overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md kxl-glass kxl-hologram shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src={quantumLogo} 
                  alt="Quantum POS Logo"
                  className="h-20 w-auto object-contain kxl-float"
                />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                STAFF LOGIN
              </h2>
              <p className="text-xl font-semibold text-emerald-600 mb-2">
                {organization.name}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {organization.businessType} • Secure Authentication
              </p>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <Button
                variant={mode === 'pin' ? 'default' : 'ghost'}
                onClick={() => setMode('pin')}
                className="flex-1 flex items-center space-x-2"
                data-testid="pin-mode-tab"
              >
                <KeyRound className="w-4 h-4" />
                <span>Quick PIN</span>
              </Button>
              <Button
                variant={mode === 'username' ? 'default' : 'ghost'}
                onClick={() => setMode('username')}
                className="flex-1 flex items-center space-x-2"
                data-testid="username-mode-tab"
              >
                <User className="w-4 h-4" />
                <span>Username</span>
              </Button>
            </div>

            {/* PIN Login Mode */}
            {mode === 'pin' && (
              <div className="mb-8">
                <div className="flex justify-center space-x-4 mb-8">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-xl kxl-glass kxl-ai-border flex items-center justify-center"
                    >
                      {pin[index] ? (
                        <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full kxl-glow"></div>
                      ) : (
                        <div className="w-3 h-3 border-2 border-primary/30 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      className="h-14 text-xl font-bold kxl-glass kxl-neural-button border-primary/20 hover:border-primary/40"
                      onClick={() => handlePinInput(digit.toString())}
                      disabled={pinLoginMutation.isPending}
                      data-testid={`pin-digit-${digit}`}
                    >
                      {digit}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 text-sm font-bold kxl-glass kxl-neural-button border-red-500/20 hover:border-red-500/40 text-red-500"
                    onClick={handleClearPin}
                    disabled={pinLoginMutation.isPending}
                    data-testid="pin-clear"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 text-xl font-bold kxl-glass kxl-neural-button border-primary/20 hover:border-primary/40"
                    onClick={() => handlePinInput("0")}
                    disabled={pinLoginMutation.isPending}
                    data-testid="pin-digit-0"
                  >
                    0
                  </Button>
                  <div></div>
                </div>
              </div>
            )}

            {/* Username/Password Login Mode */}
            {mode === 'username' && (
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Username
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="kxl-glass border-primary/20"
                    data-testid="staff-username-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="kxl-glass border-primary/20 pr-10"
                      data-testid="staff-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleUsernameLogin}
                  disabled={usernameLoginMutation.isPending || !username.trim() || !password.trim()}
                  className="w-full kxl-quantum-button kxl-glow"
                  data-testid="username-login-button"
                >
                  {usernameLoginMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Login</span>
                    </div>
                  )}
                </Button>
              </div>
            )}

            {(pinLoginMutation.isPending || usernameLoginMutation.isPending) && (
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Shield className="w-5 h-5 animate-pulse" />
                  <span className="text-lg font-bold">
                    {mode === 'pin' ? 'Checking PIN...' : 'Logging in...'}
                  </span>
                  <Shield className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full kxl-neural-button"
              onClick={onBack}
              disabled={pinLoginMutation.isPending || usernameLoginMutation.isPending}
              data-testid="back-to-org-selection"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organization Selection
            </Button>

            <div className="text-center mt-6 p-4 kxl-glass rounded-xl">
              <p className="text-sm font-bold text-foreground mb-2">
                {organization.name} Staff Authentication
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === 'pin' 
                  ? 'Enter your personal PIN or switch to Username mode'
                  : 'Enter your username and password or switch to PIN mode'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}