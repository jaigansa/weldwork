const CACHE_NAME = 'weldwork-cache-v5';
// Must match ASSET_VER in Layout.astro
const VER = '2026-08-26-1';
const ASSETS = [
  '/',
  `/css/app.css?v=${VER}`,
  `/js/app.js?v=${VER}`,
  '/js/lucide.min.js',
  '/js/hammer.min.js',
  '/js/supabase.min.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
const RUNTIME_CACHE_MAX = 120;

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

  if (event.request.method !== 'GET') {
    return;
  }

  // Never cache cross-origin API/storage traffic
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          trimRuntimeCache(cache).then(() => cache.put(event.request, responseToCache));
        });
      }
      return response;
    }).catch(() => {
      return caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        return cached || new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  if (keys.length < RUNTIME_CACHE_MAX) return;
  // FIFO: delete oldest entries beyond the cap
  const excess = keys.length - RUNTIME_CACHE_MAX + 1;
  await Promise.all(keys.slice(0, excess).map((req) => cache.delete(req)));
}
