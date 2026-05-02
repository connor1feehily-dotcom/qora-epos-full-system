import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, CheckCircle2, Settings, ShoppingCart, Briefcase, Layers, ArrowLeft } from "lucide-react";
import { setTillConfig, getDeviceFingerprint, type DeviceRole } from "@/utils/till-detection";
import { InstallPwaButton } from "@/components/install-pwa-button";

interface TillSetupWizardProps {
  onComplete: () => void;
  organizationId: number;
}

export function TillSetupWizard({ onComplete, organizationId }: TillSetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deviceRole, setDeviceRole] = useState<DeviceRole | null>(null);
  const [tillId, setTillId] = useState("till1");
  const [tillName, setTillName] = useState("");

  const deviceId = getDeviceFingerprint();

  const handleComplete = () => {
    if (!deviceRole) return;
    const finalTillId = deviceRole === 'back-office' ? 'backoffice' : tillId;
    const finalTillName =
      deviceRole === 'back-office'
        ? 'Back Office'
        : (tillName || tillId.toUpperCase());
    setTillConfig(finalTillId, finalTillName, organizationId, deviceRole);
    onComplete();
  };

  const handlePickRole = (role: DeviceRole) => {
    setDeviceRole(role);
    if (role === 'back-office') {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Qora EPOS — Device Setup</CardTitle>
          <CardDescription>
            One-time setup for this device. Takes 30 seconds.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">What is this device?</h3>

              <button
                type="button"
                onClick={() => handlePickRole('till')}
                className="w-full text-left border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl p-4 transition flex items-start gap-3"
                data-testid="button-role-till"
              >
                <ShoppingCart className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-base">Till (POS Screen)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    A screen at the counter that takes sales. No back-office access — staff can't see reports or stock from this device.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickRole('back-office')}
                className="w-full text-left border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl p-4 transition flex items-start gap-3"
                data-testid="button-role-backoffice"
              >
                <Briefcase className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-base">Back Office PC</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    A PC or laptop in the office. Goes straight to reports, stock and admin. Cannot be used to ring in sales.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickRole('both')}
                className="w-full text-left border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-xl p-4 transition flex items-start gap-3"
                data-testid="button-role-both"
              >
                <Layers className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-base">Manager Terminal (Both)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tablet or PC used as both till and back office. Full access for trusted staff only.
                  </div>
                </div>
              </button>

              <div className="pt-2">
                <InstallPwaButton />
              </div>
            </div>
          )}

          {step === 2 && deviceRole !== 'back-office' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Device Information
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Device ID:</strong> {deviceId}</p>
                  <p className="text-xs mt-2 text-gray-500">
                    Each till keeps its own sales and Z-reads — pick the till number you want this screen to be.
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
                  Each till's sales and Z-reads are kept separate.
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
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-back-step1">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" data-testid="button-continue">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && deviceRole && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Confirm Setup</h3>
                <div className="text-left bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Device Role:</span>
                    <span className="font-semibold">
                      {deviceRole === 'till' && 'Till (POS Screen)'}
                      {deviceRole === 'back-office' && 'Back Office PC'}
                      {deviceRole === 'both' && 'Manager Terminal (Both)'}
                    </span>
                  </div>
                  {deviceRole !== 'back-office' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Till Number:</span>
                        <span className="font-semibold">{tillId.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Till Name:</span>
                        <span className="font-semibold">{tillName || tillId.toUpperCase()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Device ID:</span>
                    <span className="font-mono text-xs">{deviceId.substring(0, 16)}...</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  This device will remember its setup. You won't have to do this again.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(deviceRole === 'back-office' ? 1 : 2)}
                  className="flex-1"
                  data-testid="button-back-step2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={handleComplete} className="flex-1" data-testid="button-complete-setup">
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
