import { get, set, del, keys } from 'idb-keyval';

export interface QueuedSale {
  id: string;
  url: string;
  method: string;
  body: any;
  queuedAt: number;
  attempts: number;
  lastError?: string;
}

const PREFIX = 'qora:offline-sale:';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueueSale(url: string, method: string, body: any): Promise<QueuedSale> {
  const id = makeId();
  const sale: QueuedSale = { id, url, method, body, queuedAt: Date.now(), attempts: 0 };
  await set(PREFIX + id, sale);
  notifyChange();
  return sale;
}

export async function getQueuedSales(): Promise<QueuedSale[]> {
  const ks = await keys();
  const ids = (ks as string[]).filter((k) => typeof k === 'string' && k.startsWith(PREFIX));
  const sales = await Promise.all(ids.map((k) => get(k) as Promise<QueuedSale | undefined>));
  return sales.filter(Boolean) as QueuedSale[];
}

export async function getQueueCount(): Promise<number> {
  const ks = await keys();
  return (ks as string[]).filter((k) => typeof k === 'string' && k.startsWith(PREFIX)).length;
}

export async function removeSale(id: string): Promise<void> {
  await del(PREFIX + id);
  notifyChange();
}

let flushing = false;

export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  if (flushing) return { flushed: 0, failed: 0 };
  flushing = true;
  let flushed = 0;
  let failed = 0;
  try {
    const sales = await getQueuedSales();
    for (const s of sales) {
      try {
        const res = await fetch(s.url, {
          method: s.method,
          headers: { 'Content-Type': 'application/json', 'X-Offline-Replay': '1' },
          body: JSON.stringify(s.body),
          credentials: 'include',
        });
        if (res.ok) {
          await removeSale(s.id);
          flushed++;
        } else if (res.status >= 400 && res.status < 500) {
          // Terminal error (e.g. validation): remove from queue so we don't
          // retry forever. Log it so it can be investigated.
          console.warn(
            `[offline-queue] Dropping sale ${s.id} after HTTP ${res.status} (terminal)`,
            s.body
          );
          await removeSale(s.id);
          failed++;
        } else {
          // Transient (5xx): keep and retry later
          s.attempts++;
          s.lastError = `HTTP ${res.status}`;
          await set(PREFIX + s.id, s);
          failed++;
        }
      } catch (err: any) {
        // Network error: keep and retry later
        s.attempts++;
        s.lastError = err?.message || 'Network error';
        await set(PREFIX + s.id, s);
        failed++;
      }
    }
  } finally {
    flushing = false;
  }
  notifyChange();
  return { flushed, failed };
}

// Simple change-notification mechanism so React components can re-render
const listeners = new Set<() => void>();
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notifyChange() {
  listeners.forEach((l) => {
    try { l(); } catch {}
  });
}

export function startAutoFlush() {
  if (typeof window === 'undefined') return;
  const tryFlush = () => {
    if (navigator.onLine) flushQueue().catch(() => {});
  };
  window.addEventListener('online', tryFlush);
  setInterval(tryFlush, 30000);
  tryFlush();
}

export function isLikelyOffline(error: unknown): boolean {
  if (!navigator.onLine) return true;
  const msg = (error as any)?.message?.toLowerCase?.() || '';
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('load failed') ||
    msg.includes('networkerror')
  );
}
