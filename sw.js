/* Service worker: makes the trip planner usable with no signal (Cape Point, Chapman's Peak,
   Tsitsikamma, safari reserves — the exact spots the "offline maps" tip on the Plan tab warns
   about). It does NOT take over the page's own "am I stale?" check (the inline script in
   <head> that fetches itself with {cache:'no-store'} and reloads on a new build-id) — the
   page document is always served network-first here too, so that check still sees a real
   network response whenever one is available; only when the network genuinely fails does this
   fall back to the last cached copy.

   Bump CACHE_NAME (e.g. v1 -> v2) whenever you want to force everyone's cached copy dropped —
   otherwise this file only needs to be touched if the caching *strategy* changes. */
const CACHE_NAME = 'ctgr-cache-v5';   // bumped: same-origin fetches are now ALL network-first (see below) instead of only a few hand-picked paths — a real behaviour change, so everyone's old cache gets dropped rather than left half-matching the new strategy
const APP_SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'css/styles.css',
  'js/photo-storage.js', 'js/i18n.js', 'js/data-places.js', 'js/notes-and-places.js', 'js/photos.js',
  'js/render-map.js', 'js/data-garden-route.js', 'js/data-safari.js', 'js/data-apps.js', 'js/data-itinerary.js',
  'js/itinerary-customize.js', 'js/print-export.js', 'js/trip-onboarding.js', 'js/weather.js', 'js/drawer-currency.js',
  'js/travel-checklist.js', 'js/data-about.js', 'js/app-boot.js'];   // travel-checklist.js and data-about.js were missing — added after both those tabs shipped without this list being updated

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

  // Same-origin = this app's own code and content: the page, css/styles.css, every js/*.js file,
  // manifest.json, and every image under icons/ and images/ (including the owner-uploadable ones
  // that get re-uploaded to the same filename — icons/apps/, images/about/, icons/about/). ALL of
  // it is always network-first here now, not just the hand-picked paths this carve-out used to be
  // limited to. That used to mean a *code* push (css/js, not just images) could sit served-stale
  // for an entire extra reload after every single deploy — classic stale-while-revalidate always
  // answers from whatever's already cached before it even checks the network, so the fresh version
  // only ever lands in the cache for *next* time, which reads exactly like "pushing to main
  // doesn't show up on refresh" from the outside. A personal site like this one gets redeployed far
  // more often than it's ever read with no signal at all, so "what's live always matches what was
  // actually pushed" matters more here than shaving a request via staleness. {cache:'no-store'}
  // also bypasses the browser's own ordinary HTTP cache (and, in turn, whatever the GitHub Pages/
  // Fastly CDN in front of this repo sends as cache headers) for this fetch, so an update is only
  // ever actually missed if the request happened to land on a CDN edge that hadn't yet picked up
  // the new deploy — a propagation delay outside this file's control, not a caching bug here.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((res) => res || (isNavigation(req) ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Third-party CDN only now (Leaflet, Google Fonts) — these essentially never change, so they
  // keep the classic stale-while-revalidate treatment: serve from cache instantly if we have it,
  // and refresh the cache in the background.
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
