import type { Express, Request, Response } from "express";
import webpush from "web-push";
import fs from "fs";
import path from "path";

export interface StoredSubscription {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  label: string;
  userId?: number | null;
  createdAt: number;
}

// Subscriptions persisted to disk so they survive server restarts.
// (Important: server restarts mustn't silently break alerts for users who
// subscribed earlier and aren't back at the dashboard yet.)
const STORE_DIR = path.resolve(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "push-subscriptions.json");
const subscriptions = new Map<string, StoredSubscription>();

function loadFromDisk() {
  try {
    if (!fs.existsSync(STORE_PATH)) return;
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const arr: StoredSubscription[] = JSON.parse(raw);
    for (const s of arr) subscriptions.set(s.id, s);
    console.log(`[push] Loaded ${subscriptions.size} subscription(s) from disk`);
  } catch (err) {
    console.warn("[push] Failed to load subscriptions:", err);
  }
}
function persistToDisk() {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(Array.from(subscriptions.values()), null, 2));
  } catch (err) {
    console.warn("[push] Failed to persist subscriptions:", err);
  }
}
loadFromDisk();

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@kerriganxl.ie";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not configured — push notifications disabled");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

function makeId(endpoint: string): string {
  // Stable id: hash-ish of endpoint last segment
  return endpoint.split("/").slice(-2).join("-").replace(/[^a-zA-Z0-9-]/g, "").slice(-40);
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  for (const sub of subscriptions.values()) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }
      );
      sent++;
    } catch (err: any) {
      failed++;
      const status = err?.statusCode;
      if (status === 404 || status === 410) dead.push(sub.id);
      else console.warn("[push] send error:", status, err?.body);
    }
  }
  if (dead.length) {
    for (const id of dead) subscriptions.delete(id);
    persistToDisk();
  }
  return { sent, failed };
}

export function getSubscriberCount(): number {
  return subscriptions.size;
}

export function registerPushRoutes(app: Express) {
  app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) return res.status(503).json({ error: "Push not configured" });
    res.json({ publicKey });
  });

  app.post("/api/push/subscribe", (req: Request, res: Response) => {
    if (!ensureConfigured()) return res.status(503).json({ error: "Push not configured" });
    const { subscription, label } = req.body || {};
    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }
    const id = makeId(subscription.endpoint);
    const stored: StoredSubscription = {
      id,
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      label: typeof label === "string" ? label : "Device",
      userId: (req as any).session?.userId ?? null,
      createdAt: Date.now(),
    };
    subscriptions.set(id, stored);
    persistToDisk();
    res.json({ ok: true, id, totalSubscribers: subscriptions.size });
  });

  app.post("/api/push/unsubscribe", (req: Request, res: Response) => {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "endpoint required" });
    const id = makeId(endpoint);
    const had = subscriptions.delete(id);
    if (had) persistToDisk();
    res.json({ ok: true, removed: had });
  });

  app.get("/api/push/stats", (_req: Request, res: Response) => {
    res.json({
      subscribers: subscriptions.size,
      configured: ensureConfigured(),
      devices: Array.from(subscriptions.values()).map((s) => ({
        id: s.id,
        label: s.label,
        createdAt: s.createdAt,
      })),
    });
  });

  app.post("/api/push/test", async (_req: Request, res: Response) => {
    const result = await sendPushToAll({
      title: "Qora EPOS — test alert",
      body: "Phone alerts are working. You'll get a buzz like this whenever something at the shop needs you.",
      tag: "qora-test",
      url: "/",
    });
    res.json({ ok: true, ...result, message: `Sent to ${result.sent} device(s)` });
  });

  app.post("/api/push/send", async (req: Request, res: Response) => {
    const { title, body, tag, url, requireInteraction } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: "title and body are required" });
    const result = await sendPushToAll({ title, body, tag, url, requireInteraction });
    res.json({ ok: true, ...result });
  });
}
