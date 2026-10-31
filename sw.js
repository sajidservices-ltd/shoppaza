// Shoppaza Progressive Web App Service Worker (PWA v3.1 - High Speed Performance)
const CACHE_NAME = 'shoppaza-core-v4.0';
const STATIC_ASSETS = [
  '/',
  '/product',
  '/checkout.html',
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
  '/categories-data.json'
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

// Activate: Instant cache takeover and purge ALL outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Auto-Purging outdated cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Stale-While-Revalidate for sub-millisecond instant loads
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Skip non-GET requests and admin panel
  if (req.method !== 'GET' || url.pathname.startsWith('/admin')) {
    return;
  }

  // 2. Skip cross-origin non-HTTP schemes
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

  // 4. Products Catalog: Fast Stale-While-Revalidate (Instant local response in 0ms + background refresh)
  if (url.pathname.endsWith('products.json')) {
    event.respondWith(
      caches.match('/products.json').then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/products.json', clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        // Return cached instantly if available; otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 5. Categories Data: Fast Stale-While-Revalidate
  if (url.pathname.endsWith('categories-data.json')) {
    event.respondWith(
      caches.match('/categories-data.json').then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/categories-data.json', clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 6. Stale-While-Revalidate for other static assets
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
