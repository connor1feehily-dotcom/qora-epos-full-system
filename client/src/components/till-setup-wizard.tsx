import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, CheckCircle2, Settings } from "lucide-react";
import { setTillConfig, getDeviceFingerprint } from "@/utils/till-detection";

interface TillSetupWizardProps {
  onComplete: () => void;
  organizationId: number;
}

export function TillSetupWizard({ onComplete, organizationId }: TillSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [tillId, setTillId] = useState("till1");
  const [tillName, setTillName] = useState("");
  
  const deviceId = getDeviceFingerprint();

  const handleComplete = () => {
    // Save till configuration
    setTillConfig(tillId, tillName || tillId.toUpperCase(), organizationId);
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Till Terminal Setup</CardTitle>
          <CardDescription>
            Configure this terminal for your POS system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Device Information
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Device ID:</strong> {deviceId}</p>
                  <p className="text-xs mt-2 text-gray-500">
                    This unique identifier helps track this terminal
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tillId">Till Number</Label>
                <Select value={tillId} onValueChange={setTillId}>
                  <SelectTrigger data-testid="select-till-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="till1">Till 1</SelectItem>
                    <SelectItem value="till2">Till 2</SelectItem>
                    <SelectItem value="till3">Till 3</SelectItem>
                    <SelectItem value="till4">Till 4</SelectItem>
                    <SelectItem value="till5">Till 5</SelectItem>
                    <SelectItem value="till6">Till 6</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select which till number this terminal should be
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tillName">Till Name (Optional)</Label>
                <Input
                  id="tillName"
                  data-testid="input-till-name"
                  placeholder="e.g., Front Counter, Drive-Thru, Express Lane"
                  value={tillName}
                  onChange={(e) => setTillName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Give this till a friendly name for easy identification
                </p>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                data-testid="button-continue"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Configuration Summary</h3>
                <div className="text-left bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Till Number:</span>
                    <span className="font-semibold">{tillId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Till Name:</span>
                    <span className="font-semibold">{tillName || tillId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Device ID:</span>
                    <span className="font-mono text-xs">{deviceId.substring(0, 16)}...</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  This terminal will remember its configuration. You won't need to set it up again.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1"
                  data-testid="button-complete-setup"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
