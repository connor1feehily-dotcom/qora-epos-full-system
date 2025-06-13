import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, User, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as StaffUser } from "@shared/schema";
import kerrigansLogo from "@assets/NEW_1749822871411.png";

interface StaffLoginProps {
  onLogin: (user: StaffUser) => void;
  onBack: () => void;
}

export function StaffLogin({ onLogin, onBack }: StaffLoginProps) {
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  // PIN login mutation
  const pinLoginMutation = useMutation({
    mutationFn: async (pinCode: string) => {
      const response = await apiRequest('POST', '/api/auth/pin-login', { pin: pinCode });
      return await response.json();
    },
    onSuccess: (response: any) => {
      const user = response?.user || response;
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName || user.username || 'User'}!`,
      });
      onLogin(user);
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid PIN. Please try again.",
        variant: "destructive",
      });
      setPin("");
    },
  });

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        pinLoginMutation.mutate(newPin);
      }
    }
  };

  const handleClearPin = () => {
    setPin("");
  };

  return (
    <div className="min-h-screen kxl-neural-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md kxl-glass kxl-hologram shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src={kerrigansLogo} 
                alt="Kerrigan's XL Logo"
                className="h-20 w-auto object-contain kxl-float"
              />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              STAFF LOGIN
            </h2>
            <p className="text-lg text-muted-foreground kxl-slide-in">
              Enter Your 4-Digit PIN
            </p>
          </div>

          {/* PIN Input Display */}
          <div className="mb-8">
            <div className="flex justify-center space-x-4 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-2xl kxl-glass kxl-ai-border flex items-center justify-center"
                >
                  {pin[index] ? (
                    <div className="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full kxl-glow"></div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-primary/30 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PIN Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                size="lg"
                className="h-16 text-2xl font-bold kxl-glass kxl-neural-button border-primary/20 hover:border-primary/40"
                onClick={() => handlePinInput(digit.toString())}
                disabled={pinLoginMutation.isPending}
              >
                {digit}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-16 text-xl font-bold kxl-glass kxl-neural-button border-red-500/20 hover:border-red-500/40 text-red-500"
              onClick={handleClearPin}
              disabled={pinLoginMutation.isPending}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 text-2xl font-bold kxl-glass kxl-neural-button border-primary/20 hover:border-primary/40"
              onClick={() => handlePinInput("0")}
              disabled={pinLoginMutation.isPending}
            >
              0
            </Button>
            <div></div>
          </div>

          {/* Status */}
          {pinLoginMutation.isPending && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 text-primary">
                <Shield className="w-5 h-5 animate-pulse" />
                <span className="text-lg font-bold">Checking PIN...</span>
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          )}

          {/* Back Button */}
          <Button
            variant="ghost"
            className="w-full kxl-neural-button"
            onClick={onBack}
            disabled={pinLoginMutation.isPending}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Menu
          </Button>

          {/* Quick Access Info */}
          <div className="text-center mt-6 p-4 kxl-glass rounded-xl">
            <p className="text-sm font-bold text-foreground mb-2">Quick Access Codes:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Admin: 0000</div>
              <div>Manager: 1111</div>
              <div>Staff: 1234</div>
              <div>Cashier: 2222</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}