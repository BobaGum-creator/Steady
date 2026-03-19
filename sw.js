/**
 * Steady - Service Worker
 * Strategy: Network-first for navigation, stale-while-revalidate for assets.
 * Bump CACHE_VERSION when deploying updates to bust the old cache.
 */

const CACHE_VERSION = 7;
const CACHE_NAME = `steady-v${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/js/data.js',
  '/js/player.js',
  '/js/storage.js',
  '/js/insights.js',
  '/js/idb.js',
  '/manifest.json'
];

// ---- INSTALL: precache the app shell ----
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: purge old caches ----
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('steady-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ---- FETCH: network-first for navigation, stale-while-revalidate for assets ----
self.addEventListener('fetch', e => {
  const { request } = e;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation requests (page loads): network-first with cache fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // App shell assets: stale-while-revalidate
  // Serve from cache immediately, fetch update in background
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(response => {
            // Update the cache with the fresh version
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached); // If network fails and no cache, return undefined

        // Return cached version immediately, or wait for network
        return cached || networkFetch;
      })
    )
  );
});
