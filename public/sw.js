self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No caching strategy on purpose: this app is data-driven (Supabase), so we
// let every request go straight to the network. Registering an active
// service worker is enough to satisfy PWA installability checks.
self.addEventListener("fetch", () => {});
