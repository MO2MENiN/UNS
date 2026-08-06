/**
 * service-worker.js
 * Precaches the full app shell (HTML, CSS, JS, JSON data, icons,
 * sounds) so the app works completely offline after first visit,
 * plus an automatic update flow (skipWaiting on user confirmation).
 */
const CACHE_VERSION = "uns-v1.0.0";
const CACHE_NAME = `uns-cache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",

  "./assets/css/variables.css",
  "./assets/css/base.css",
  "./assets/css/layout.css",
  "./assets/css/components.css",
  "./assets/css/animations.css",

  "./assets/js/app.js",
  "./assets/js/router.js",
  "./assets/js/state.js",
  "./assets/js/theme.js",
  "./assets/js/categories.js",
  "./assets/js/icons.js",
  "./assets/js/data.js",
  "./assets/js/views/home.js",
  "./assets/js/views/category.js",
  "./assets/js/views/dhikr.js",
  "./assets/js/views/favorites.js",
  "./assets/js/views/search.js",
  "./assets/js/views/settings.js",
  "./assets/js/utils/hijri.js",
  "./assets/js/utils/tashkeel.js",
  "./assets/js/utils/sound.js",
  "./assets/js/utils/vibrate.js",
  "./assets/js/utils/wakelock.js",
  "./assets/js/utils/share.js",
  "./assets/js/utils/toast.js",

  "./data/dead-prayers.json",
  "./data/wake-up-adhkar.json",
  "./data/morning-adhkar.json",
  "./data/prayer-adhkar.json",
  "./data/food-adhkar.json",
  "./data/evening-adhkar.json",
  "./data/mosque-adhkar.json",
  "./data/sleep-adhkar.json",
  "./data/wudu-adhkar.json",
  "./data/after-prayer-adhkar.json",
  "./data/toilet-adhkar.json",
  "./data/home-adhkar.json",
  "./data/adhan-adhkar.json",
  "./data/hajj-umrah-adhkar.json",
  "./data/tasbeeh.json",
  "./data/quran-completion-dua.json",
  "./data/dua-virtues.json",
  "./data/dhikr-virtues.json",
  "./data/surah-virtues.json",

  "./assets/icons/favicon.ico",
  "./assets/icons/icon-16.png",
  "./assets/icons/icon-32.png",
  "./assets/icons/icon-72.png",
  "./assets/icons/icon-96.png",
  "./assets/icons/icon-128.png",
  "./assets/icons/icon-144.png",
  "./assets/icons/icon-152.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-384.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",

  "./assets/sounds/tick.wav",
  "./assets/sounds/complete.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("uns-cache-") && key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Strategy:
 *  - Navigations (HTML): network-first, falling back to cache, then offline.html.
 *  - Everything else (CSS/JS/JSON/icons/sounds): cache-first, updating the
 *    cache in the background when a fresh copy is fetched.
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    return cached || (await cache.match("./offline.html"));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    fetchAndUpdateCache(request, cache);
    return cached;
  }
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cached;
  }
}

function fetchAndUpdateCache(request, cache) {
  fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response);
    })
    .catch(() => {
      /* stay offline-safe: ignore background refresh failures */
    });
}
