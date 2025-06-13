import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as StaffUser } from "@shared/schema";

interface StaffLoginProps {
  onLogin: (user: StaffUser) => void;
  onBack: () => void;
}

export function StaffLogin({ onLogin, onBack }: StaffLoginProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  // Fetch staff members
  const { data: staffMembers = [] } = useQuery<StaffUser[]>({
    queryKey: ['/api/auth/staff'],
  });

  // PIN login mutation
  const pinLoginMutation = useMutation({
    mutationFn: async (pinCode: string) => {
      const response = await apiRequest('POST', '/api/auth/pin-login', { pin: pinCode });
      return response;
    },
    onSuccess: (response: any) => {
      console.log('=== PIN LOGIN RESPONSE ===');
      console.log('Raw response:', JSON.stringify(response, null, 2));
      
      const user = response?.user || response;
      console.log('Extracted user:', JSON.stringify(user, null, 2));
      console.log('User role:', user?.role);
      console.log('=========================');
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName || 'User'}!`,
      });
      // Pass the complete user object
      onLogin(user);
    },
    onError: () => {
      toast({
        title: "Invalid PIN",
        description: "Please check your PIN and try again",
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

  const handleStaffSelect = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setPin("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (selectedStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 dark:border-slate-700/50">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/attached_assets/NEW_1749822871411.png" 
                  alt="Kerrigan's XL Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedStaff.firstName} {selectedStaff.lastName}
              </h2>
              <Badge className={`mt-2 ${getRoleColor(selectedStaff.role)}`}>
                {selectedStaff.role.toUpperCase()}
              </Badge>
            </div>

            {/* PIN Input */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-2" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Enter your 4-digit PIN</span>
              </div>
              
              <div className="flex justify-center space-x-3 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800"
                  >
                    {pin[index] ? (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 border border-slate-300 dark:border-slate-600 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="lg"
                  className="h-16 text-xl font-semibold hover:bg-blue-50 dark:hover:bg-slate-700"
                  onClick={() => handlePinInput(num.toString())}
                  disabled={pinLoginMutation.isPending}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                size="lg"
                className="h-16 text-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleClearPin}
                disabled={pinLoginMutation.isPending}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-16 text-xl font-semibold hover:bg-blue-50 dark:hover:bg-slate-700"
                onClick={() => handlePinInput("0")}
                disabled={pinLoginMutation.isPending}
              >
                0
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-16 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => setSelectedStaff(null)}
                disabled={pinLoginMutation.isPending}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </div>

            {/* Back Button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={pinLoginMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-white/20 dark:border-slate-700/50">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/attached_assets/NEW_1749822871411.png" 
                alt="Kerrigan's XL Logo"
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Staff Login
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Select your profile to continue
            </p>
          </div>

          {/* Staff Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {staffMembers.map((staff) => (
              <Card
                key={staff.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80"
                onClick={() => handleStaffSelect(staff)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {staff.firstName[0]}{staff.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {staff.firstName} {staff.lastName}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(staff.role)}>
                        {staff.role.toUpperCase()}
                      </Badge>
                      {staff.employeeId && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ID: {staff.employeeId}
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            ))}
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            className="w-full mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Menu
          </Button>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © 2024 The Feehily Boyle Group. All rights reserved.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}