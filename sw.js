// Shoppaza Progressive Web App Service Worker (PWA v1.0)
const CACHE_NAME = 'shoppaza-core-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/product.html',
  '/about.html',
  '/contact.html',
  '/terms.html',
  '/privacy.html',
  '/refund-policy.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/logo-white.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/products.json'
];

// Install: Cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate & Network-First with Offline Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and admin panel (keep admin purely live)
  if (req.method !== 'GET' || url.pathname.includes('/admin')) {
    return;
  }

  // Network-First for HTML navigation
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Stale-While-Revalidate for images, json, scripts, and stylesheets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
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
