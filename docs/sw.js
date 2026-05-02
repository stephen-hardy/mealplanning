const CACHE_NAME = 'meal-plan-v5';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'mealplan.json',
  'manifest.json',
  'icon.svg',
  'assets/apple-icon-180.png',
  'assets/apple-splash-2048-2732.jpg',
  'assets/apple-splash-2732-2048.jpg',
  'assets/apple-splash-1170-2532.jpg',
  'assets/apple-splash-2532-1170.jpg',
  'assets/manifest-icon-192.maskable.png',
  'assets/manifest-icon-512.maskable.png'
];

// Force immediate update of new service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install: Cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchedResponse = fetch(event.request).then(networkResponse => {
          // If we got a valid response, update the cache
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails, we already have the cached response (or undefined)
        });

        // Return cached response if available, otherwise wait for network
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
