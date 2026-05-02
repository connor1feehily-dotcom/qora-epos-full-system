import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Smartphone, Send, Info, CheckCircle2 } from "lucide-react";
import {
  isPushSupported,
  notificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from "@/lib/push-client";

export function PushNotificationSetup() {
  const { toast } = useToast();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enabling, setEnabling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [stats, setStats] = useState<{ subscribers: number } | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(notificationPermission());
    checkSubscription();
    fetchStats();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setSubscribed(false);
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/push/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const handleEnable = async () => {
    setEnabling(true);
    const result = await subscribeToPush({ label: detectDeviceLabel() });
    setEnabling(false);
    if (result.ok) {
      setSubscribed(true);
      setPermission('granted');
      fetchStats();
      toast({
        title: "Phone alerts turned on",
        description: "You'll get a buzz on this device when something needs your attention.",
      });
    } else {
      toast({
        title: "Couldn't turn on alerts",
        description: result.reason || 'Please check your browser notification settings.',
        variant: 'destructive',
      });
    }
  };

  const handleDisable = async () => {
    const ok = await unsubscribeFromPush();
    if (ok) {
      setSubscribed(false);
      fetchStats();
      toast({ title: 'Phone alerts turned off' });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    const result = await sendTestPush();
    setTesting(false);
    toast({
      title: result.ok ? 'Test alert sent' : 'Could not send test',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card className="border-l-4 border-l-cyan-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-500" />
          Phone Alerts (Push Notifications)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Get a buzz on your phone the moment something urgent happens at the shop — even when the app is closed.
        </p>
      </CardHeader>
      <CardContent>
        {!supported && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Your browser doesn't support phone alerts. Try opening the back office in Chrome or Safari on your phone, or install Qora EPOS to your home screen.
            </div>
          </div>
        )}

        {supported && (
          <>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3">
              <div>
                <p className="font-medium text-slate-800">Status on this device</p>
                <p className="text-xs text-slate-600">
                  Permission: <span className="font-semibold">{permission}</span>
                  {' • '}
                  Subscription: <span className="font-semibold">{subscribed ? 'active' : 'inactive'}</span>
                </p>
              </div>
              {subscribed ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Enabled
                </Badge>
              ) : (
                <Badge variant="outline">Off</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!subscribed ? (
                <Button onClick={handleEnable} disabled={enabling} className="bg-cyan-600 hover:bg-cyan-700">
                  <Bell className="w-4 h-4 mr-2" />
                  {enabling ? 'Turning on…' : 'Turn on phone alerts'}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleTest} disabled={testing}>
                    <Send className="w-4 h-4 mr-2" />
                    {testing ? 'Sending…' : 'Send test alert'}
                  </Button>
                  <Button variant="outline" onClick={handleDisable}>
                    <BellOff className="w-4 h-4 mr-2" />
                    Turn off
                  </Button>
                </>
              )}
            </div>

            {stats && (
              <p className="text-xs text-slate-500 mt-3">
                {stats.subscribers} device{stats.subscribers === 1 ? '' : 's'} currently set up to receive alerts.
              </p>
            )}

            <div className="mt-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">You'll be alerted when:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Stock drops below your set minimum</li>
                <li>A delivery arrives and needs approval</li>
                <li>An unusually large transaction is processed</li>
                <li>QBOT spots something worth a look</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown device';
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android phone';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'Browser';
}
