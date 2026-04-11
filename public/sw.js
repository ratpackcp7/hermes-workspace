// Hermes Workspace Service Worker — PWA pass-through
// Satisfies Chrome PWA install criteria without caching anything.
// All requests go straight to network — no stale asset risk.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
