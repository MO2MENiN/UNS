// service-worker.js — manual, dependency-free offline-first caching.

const CACHE_VERSION = 'uns-cache-v1';

// All paths are relative to this file's location, so the app works
// whether it's deployed at the domain root or in a sub-directory.
const SCOPE = self.registration.scope;

const PRECACHE_URLS = [
  '',
  'index.html',
  'offline.html',
  '404.html',
  'manifest.json',
  'css/main.css',
  'css/components.css',
  'css/home.css',
  'css/section.css',
  'css/dhikr.css',
  'css/settings.css',
  'css/responsive.css',
  'js/app.js',
  'js/router.js',
  'js/storage.js',
  'js/counter.js',
  'js/tashkeel.js',
  'js/favorites.js',
  'js/search.js',
  'js/settings.js',
  'js/ui.js',
  'assets/icons/sprite.svg',
  'assets/icons/icon-192.svg',
  'assets/icons/icon-512.svg',
  'assets/icons/icon-maskable.svg',
  'data/sections.json',
  'data/ad3yat-almayet.json',
  'data/azkar-alestekaz.json',
  'data/azkar-alsabah.json',
  'data/azkar-alsalah.json',
  'data/azkar-altaam-walsharab-waldayf.json',
  'data/azkar-almasa.json',
  'data/azkar-almasjed.json',
  'data/azkar-alnawm.json',
  'data/azkar-alwodoo.json',
  'data/azkar-baad-alsalah.json',
  'data/azkar-dokhol-wokhrooj-alkhalaa.json',
  'data/azkar-dokhol-wokhrooj-almanzel.json',
  'data/azkar-when-samaa-alathan.json',
  'data/azkar-alhajj-walomrah.json',
  'data/tasabeeh.json',
  'data/doaa-khatm-alquran.json',
  'data/fadl-aldoaa.json',
  'data/fadl-althikr.json',
  'data/fadael-alsowar.json'
].map((path) => new URL(path, SCOPE).toString());

const APP_SHELL_URL = new URL('index.html', SCOPE).toString();
const OFFLINE_URL = new URL('offline.html', SCOPE).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // Cache one by one so a single missing/failing asset doesn't abort the whole install.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) await cache.put(url, response);
          } catch (err) {
            // Ignore individual failures; app still functions with a partial cache.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('uns-cache-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Cache-first for static assets; SPA navigations fall back to cached index.html.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigation requests (route refreshes, deep links) → always serve the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_VERSION);
          const cachedShell = await cache.match(APP_SHELL_URL);
          if (cachedShell) return cachedShell;

          const network = await fetch(request);
          return network;
        } catch (err) {
          const cache = await caches.open(CACHE_VERSION);
          const cachedShell = await cache.match(APP_SHELL_URL);
          if (cachedShell) return cachedShell;
          const offlinePage = await cache.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static assets and data JSON → cache-first, network fallback, then cache the network response.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const network = await fetch(request);
        if (network && network.ok && request.url.startsWith(self.location.origin)) {
          cache.put(request, network.clone());
        }
        return network;
      } catch (err) {
        // Last resort for HTML-type sub-requests.
        if (request.destination === 'document') {
          const offlinePage = await cache.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }
        throw err;
      }
    })()
  );
});
