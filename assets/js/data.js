/**
 * data.js
 * Fetches (and in-memory caches + prefetches) category JSON files
 * from /data. The service worker handles the offline cache layer;
 * this module avoids redundant network/cache reads within a session.
 */
const cache = new Map();

export async function loadCategory(categoryId) {
  if (cache.has(categoryId)) return cache.get(categoryId);
  const res = await fetch(`data/${categoryId}.json`);
  if (!res.ok) throw new Error(`تعذر تحميل بيانات: ${categoryId}`);
  const json = await res.json();
  cache.set(categoryId, json);
  return json;
}

/** Prefetches every category file in the background (idle-time). */
export function prefetchAll(categoryIds) {
  const run = () => {
    categoryIds.forEach((id) => {
      loadCategory(id).catch(() => {});
    });
  };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 800);
  }
}

export function clearDataCache() {
  cache.clear();
}
