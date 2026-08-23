const CACHE_NAME = 'weldwork-cache-v3';
const ASSETS = [
  '/',
  '/css/app.css',
  '/js/app.js',
  '/js/lucide.min.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(ASSETS.map(async (asset) => {
        try {
          const res = await fetch(asset + '?swrefresh=' + CACHE_NAME, { cache: 'no-store' });
          if (res && res.ok) {
            await cache.put(asset, res.clone());
          }
        } catch {
        }
      })).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/admin') || url.pathname.includes('/admin/')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
