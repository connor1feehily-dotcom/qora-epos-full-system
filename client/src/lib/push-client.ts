// Helpers for service worker registration and Web Push subscription

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('SW registration failed:', err);
    return null;
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(opts?: { label?: string }): Promise<{
  ok: boolean;
  reason?: string;
  subscription?: PushSubscription;
}> {
  if (!isPushSupported()) return { ok: false, reason: 'Push notifications are not supported on this device.' };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'Service worker could not be registered.' };

  // Wait for SW to be ready
  await navigator.serviceWorker.ready;

  // Fetch the public VAPID key
  const keyRes = await fetch('/api/push/vapid-public-key');
  if (!keyRes.ok) return { ok: false, reason: 'Could not fetch push key from server.' };
  const { publicKey } = await keyRes.json();
  if (!publicKey) return { ok: false, reason: 'Server did not return a push key.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' };

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const saveRes = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ subscription, label: opts?.label || 'Mobile device' }),
  });

  if (!saveRes.ok) return { ok: false, reason: 'Server rejected the subscription.' };
  return { ok: true, subscription };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  try {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {}
  return sub.unsubscribe();
}

export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', { method: 'POST', credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json.message || (res.ok ? 'Sent' : 'Failed') };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network error' };
  }
}
