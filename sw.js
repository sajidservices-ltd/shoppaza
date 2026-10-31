// Shoppaza Progressive Web App Service Worker (PWA v2.0 - High Reliability)
const CACHE_NAME = 'shoppaza-core-v2';
const STATIC_ASSETS = [
  '/',
  '/product',
  '/about',
  '/contact',
  '/shipping-policy',
  '/refund-policy',
  '/terms',
  '/privacy',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/logo-white.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/checkout.js'
];

// Install: Cache critical fast shell assets (lightweight, zero timeouts)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Failed to cache asset:', asset, err);
          })
        )
      );
    })
  );
});

// Activate: Instant cache takeover and purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Purging outdated cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network-First with Cache Fallback for HTML, Stale-While-Revalidate for Static Assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Skip non-GET requests and admin panel
  if (req.method !== 'GET' || url.pathname.startsWith('/admin')) {
    return;
  }

  // 2. Skip cross-origin non-HTTP schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Network-First for Navigation (HTML pages)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const rootCached = await caches.match('/');
          return rootCached || Response.error();
        })
    );
    return;
  }

  // 4. Products Catalog: Network-First with Stale-Fallback (Normalized cache key)
  if (url.pathname.endsWith('products.json')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            // Cache under clean /products.json without cache-busting query params
            caches.open(CACHE_NAME).then((cache) => cache.put('/products.json', clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/products.json');
          return cached || Response.error();
        })
    );
    return;
  }

  // 5. Stale-While-Revalidate for other static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && url.origin === location.origin) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
