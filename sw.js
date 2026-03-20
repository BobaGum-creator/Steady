/**
 * Steady - Service Worker
 * Strategy: Network-first for navigation, stale-while-revalidate for assets.
 * Enhanced with comprehensive error handling, quota management, and client notifications.
 * Bump CACHE_VERSION when deploying updates to bust the old cache.
 */

const CACHE_VERSION = 8;
const CACHE_NAME = `steady-v${CACHE_VERSION}`;
const MAX_CACHE_ENTRIES = 50;

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

/**
 * INSTALL: precache the app shell with fallback strategy
 * Uses allSettled so one failed asset doesn't block the whole install
 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          APP_SHELL.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err.message);
            });
          })
        ).then(() => {
          console.log(`[SW] Install complete (CACHE_VERSION=${CACHE_VERSION})`);
        });
      })
      .catch(err => {
        console.error('[SW] Install error:', err.message);
        // Don't rethrow - allow activation to proceed even if install partially fails
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * ACTIVATE: purge old caches, trim cache size, and notify clients
 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => {
        const deleteOldCaches = Promise.all(
          keys
            .filter(k => k.startsWith('steady-') && k !== CACHE_NAME)
            .map(k => {
              console.log(`[SW] Deleting old cache: ${k}`);
              return caches.delete(k).catch(err => {
                console.warn(`[SW] Failed to delete cache ${k}:`, err.message);
              });
            })
        );
        return deleteOldCaches;
      })
      .catch(err => {
        console.error('[SW] Activate: error cleaning old caches:', err.message);
      })
      .then(() => {
        // Trim current cache to MAX_CACHE_ENTRIES
        return trimCache(CACHE_NAME, MAX_CACHE_ENTRIES).catch(err => {
          console.error('[SW] Cache trim error:', err.message);
        });
      })
      .then(() => {
        // Notify all clients that a new SW has activated
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              version: CACHE_VERSION,
              message: 'New service worker version activated'
            });
          });
        }).catch(err => {
          console.warn('[SW] Error notifying clients:', err.message);
        });
      })
      .then(() => {
        console.log('[SW] Activate complete');
        return self.clients.claim();
      })
      .catch(err => {
        console.error('[SW] Activate error:', err.message);
      })
  );
});

/**
 * FETCH: network-first for navigation (SPA routing), stale-while-revalidate for assets
 */
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
          // Don't cache opaque responses (e.g., from third-party servers)
          if (response.type === 'opaque') {
            return response;
          }

          // Cache the fresh response
          const clone = response.clone();
          cacheWithQuotaHandling(CACHE_NAME, request, clone)
            .catch(err => {
              console.warn(`[SW] Failed to cache navigation ${request.url}:`, err.message);
            });
          return response;
        })
        .catch(err => {
          console.warn(`[SW] Navigation fetch failed for ${request.url}:`, err.message);
          // Always fall back to cached /index.html for SPA routing
          return caches.match('/index.html')
            .then(response => {
              if (response) {
                console.log('[SW] Serving cached /index.html as navigation fallback');
                return response;
              }
              throw new Error('No cached /index.html fallback available');
            })
            .catch(fallbackErr => {
              console.error('[SW] Navigation fallback failed:', fallbackErr.message);
              throw fallbackErr;
            });
        })
    );
    return;
  }

  // App shell assets: stale-while-revalidate
  // Serve from cache immediately, fetch update in background
  e.respondWith(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.match(request)
          .then(cached => {
            const networkFetch = fetch(request)
              .then(response => {
                // Only cache successful, non-opaque responses
                if (response.ok && response.type !== 'opaque') {
                  cacheWithQuotaHandling(CACHE_NAME, request, response.clone())
                    .catch(err => {
                      console.warn(`[SW] Failed to cache ${request.url}:`, err.message);
                    });
                }
                return response;
              })
              .catch(err => {
                console.debug(`[SW] Network fetch failed for ${request.url}:`, err.message);
                return cached;
              });

            // Return cached version immediately, or wait for network
            return cached || networkFetch;
          })
          .catch(cacheMatchErr => {
            console.error('[SW] Cache match error:', cacheMatchErr.message);
            // Fallback to network if cache.match fails
            return fetch(request)
              .catch(networkErr => {
                console.error('[SW] Fallback network fetch failed:', networkErr.message);
                return getOfflineResponse(request);
              });
          });
      })
      .catch(cacheOpenErr => {
        console.error('[SW] Cache open error:', cacheOpenErr.message);
        // Last resort: try network directly
        return fetch(request)
          .catch(err => {
            console.error('[SW] All fetch strategies failed for', request.url);
            return getOfflineResponse(request);
          });
      })
  );
});

/**
 * Cache a response with quota exceeded error handling.
 * If quota is exceeded, evicts oldest non-shell entries before retrying.
 *
 * @param {string} cacheName - Name of the cache
 * @param {Request} request - The fetch request
 * @param {Response} response - The response to cache
 * @returns {Promise<void>}
 */
async function cacheWithQuotaHandling(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    console.debug(`[SW] Cached: ${request.url}`);
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('[SW] Cache quota exceeded, evicting old entries...');
      try {
        await trimCache(cacheName, MAX_CACHE_ENTRIES - 5);
        // Retry cache.put after eviction
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
        console.log('[SW] Successfully cached after quota eviction');
      } catch (retryErr) {
        console.error('[SW] Retry cache.put failed after eviction:', retryErr.message);
        throw retryErr;
      }
    } else {
      console.error('[SW] Cache put error:', err.message);
      throw err;
    }
  }
}

/**
 * Trim cache to a maximum number of entries, removing oldest first.
 * Preserves app shell entries to avoid evicting core assets.
 *
 * @param {string} cacheName - Name of the cache
 * @param {number} maxEntries - Maximum number of entries to keep
 * @returns {Promise<void>}
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length <= maxEntries) {
      return;
    }

    // Filter out app shell entries (don't evict core assets)
    const shellUrls = new Set(
      APP_SHELL.map(path => new URL(path, self.location.origin).href)
    );

    const nonShellEntries = keys.filter(req => !shellUrls.has(req.url));
    const entriesToDelete = nonShellEntries.slice(0, nonShellEntries.length - (maxEntries - APP_SHELL.length));

    const deleteResults = await Promise.allSettled(
      entriesToDelete.map(req => cache.delete(req))
    );

    const deleteCount = deleteResults.filter(r => r.status === 'fulfilled').length;
    console.log(`[SW] Trimmed cache: removed ${deleteCount} entries (now ${keys.length - deleteCount} total)`);
  } catch (err) {
    console.error('[SW] Cache trim error:', err.message);
  }
}

/**
 * Return an offline response for failed requests.
 * Returns appropriate HTML or JSON based on request type.
 *
 * @param {Request} request - The failed request
 * @returns {Response} An offline response
 */
function getOfflineResponse(request) {
  // For HTML requests, return a simple offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: sans-serif; padding: 2rem;"><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }

  // For API/data requests, return a JSON error response
  return new Response(
    JSON.stringify({ error: 'Service Unavailable', message: 'You are offline' }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
