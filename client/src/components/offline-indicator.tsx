import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushQueue, getQueueCount, subscribe } from "@/lib/offline-queue";

export function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [count, setCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    const refresh = async () => setCount(await getQueueCount());
    refresh();
    const onOnline = () => { setOnline(true); refresh(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const unsub = subscribe(refresh);
    const interval = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await flushQueue();
      setCount(await getQueueCount());
    } finally {
      setSyncing(false);
    }
  };

  // Nothing to show: online and queue empty
  if (online && count === 0) return null;

  if (!online) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
        <WifiOff className="w-5 h-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Offline mode</p>
          <p className="opacity-90">Sales will be saved on this device and synced when the internet comes back.</p>
          {count > 0 && <p className="mt-1 font-semibold">{count} sale{count === 1 ? '' : 's'} waiting to sync</p>}
        </div>
      </div>
    );
  }

  // Online but queue still has items
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
      <CloudOff className="w-5 h-5 shrink-0" />
      <div className="text-sm flex-1">
        <p className="font-semibold">{count} offline sale{count === 1 ? '' : 's'} pending</p>
        <p className="opacity-90 text-xs">Internet is back — syncing to head office.</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        onClick={handleSyncNow}
        disabled={syncing}
      >
        {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
        <span className="ml-1">Sync now</span>
      </Button>
    </div>
  );
}
