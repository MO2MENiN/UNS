// favorites.js — manage favorite dhikr IDs (not full copies of content).
import { Storage } from './storage.js';
import { Counter } from './counter.js';

function toggle(sectionId, dhikrId) {
  return Storage.toggleFavorite(Counter.itemKey(sectionId, dhikrId));
}

function has(sectionId, dhikrId) {
  return Storage.isFavorite(Counter.itemKey(sectionId, dhikrId));
}

// Resolves stored favorite keys against currently loaded sections/dhikr data.
// Gracefully skips any favorite whose dhikr no longer exists (deleted from JSON).
function resolve(sectionsById, dhikrIndexBySection) {
  const keys = Storage.getFavorites();
  const resolved = [];
  for (const key of keys) {
    const [sectionId, dhikrId] = key.split(':');
    const section = sectionsById.get(sectionId);
    const dhikrList = dhikrIndexBySection.get(sectionId);
    if (!section || !dhikrList) continue;
    const dhikr = dhikrList.find((d) => d.id === dhikrId);
    if (!dhikr) continue;
    resolved.push({ section, dhikr });
  }
  return resolved;
}

export const Favorites = { toggle, has, resolve };
