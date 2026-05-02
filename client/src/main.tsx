import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service worker management:
// 1. Wipe any existing caches (an old SW version may have stored bad responses
//    that were causing connection issues for some users).
// 2. Re-register the current /sw.js with a forced update check.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      try { await registration.update(); } catch {}
      console.log('SW registered:', registration.scope);
    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
