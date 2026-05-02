// Qora EPOS Service Worker — push notifications + offline-aware app shell
const CACHE_NAME = 'qora-epos-v3';
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// Network-first for API, cache-first fallback for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('/')))
  );
});

// ── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'Qora EPOS', body: 'You have a new alert.', tag: 'qora' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }
  const options = {
    body: payload.body,
    tag: payload.tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) return w.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

// Allow page to ping SW for liveness check
self.addEventListener('message', (event) => {
  if (event.data === 'ping') event.ports[0]?.postMessage('pong');
});
