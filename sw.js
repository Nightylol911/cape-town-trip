/* Service worker: makes the trip planner usable with no signal (Cape Point, Chapman's Peak,
   Tsitsikamma, safari reserves — the exact spots the "offline maps" tip on the Plan tab warns
   about). It does NOT take over the page's own "am I stale?" check (the inline script in
   <head> that fetches itself with {cache:'no-store'} and reloads on a new build-id) — the
   page document is always served network-first here too, so that check still sees a real
   network response whenever one is available; only when the network genuinely fails does this
   fall back to the last cached copy.

   Bump CACHE_NAME (e.g. v1 -> v2) whenever you want to force everyone's cached copy dropped —
   otherwise this file only needs to be touched if the caching *strategy* changes. */
const CACHE_NAME = 'ctgr-cache-v1';
const APP_SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {}) // fine if e.g. an icon 404s during dev — don't block install
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isNavigation = (req) => req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
// Data APIs the page already caches itself (weather, live currency rates, GitHub sync) — the
// app's own localStorage-backed cache already has offline fallback logic for these, so the
// service worker just stays out of the way and lets them hit the network normally.
const PASSTHROUGH_HOSTS = ['api.open-meteo.com', 'archive-api.open-meteo.com', 'open.er-api.com', 'api.github.com'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (PASSTHROUGH_HOSTS.includes(url.hostname)) return;

  if (isNavigation(req) || (url.origin === self.location.origin && url.pathname.endsWith('/index.html'))) {
    // The page itself: always prefer a fresh copy; fall back to cache only when offline.
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((res) => res || caches.match('index.html')))
    );
    return;
  }

  // Everything else same-origin (icons, manifest, synced photos, photos/manifest.json) and the
  // Leaflet/Google Fonts CDN files: serve from cache instantly if we have it, and refresh the
  // cache in the background — classic stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => undefined);
      return cached || network || fetch(req);
    })
  );
});
