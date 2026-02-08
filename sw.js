const CACHE_NAME = 'antigravity-v3-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // External libraries used in your HTML
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap',
  'https://unpkg.com/@zxing/browser@0.1.5/umd/index.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js'
];

// Install Event: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for API, Cache First for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. IGNORE Google Apps Script API calls (Always go to network, never cache)
  if (url.hostname.includes('script.google.com')) {
    return; 
  }

  // 2. Stale-While-Revalidate for External Libs & Fonts
  if (url.hostname.includes('unpkg.com') || 
      url.hostname.includes('cdnjs.cloudflare.com') || 
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchedResponse;
      })
    );
    return;
  }

  // 3. Cache First for local assets (HTML, Icons, Manifest)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
