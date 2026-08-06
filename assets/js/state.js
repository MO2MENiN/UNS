/**
 * state.js
 * Thin wrapper around localStorage for every piece of persisted state:
 * settings, theme, completed dhikr, current position, favorites, and
 * daily/weekly/monthly statistics. Nothing here ever touches the JSON
 * data files under /data — those stay read-only.
 */

const KEYS = {
  SETTINGS: "uns.settings",
  COMPLETED: "uns.completed",          // { [categoryId]: { [itemId]: true } }
  PROGRESS: "uns.progress",            // { [categoryId]: { [itemId]: remaining } }
  CURRENT: "uns.current",              // { categoryId, itemIndex }
  DAILY_RESET_DATE: "uns.dailyResetDate",
  FAVORITES: "uns.favorites",          // { [categoryId+"::"+itemId]: true }
  STATS: "uns.stats",                  // { [yyyy-mm-dd]: completedCount }
};

const DEFAULT_SETTINGS = {
  theme: "system",           // 'light' | 'dark' | 'system'
  fontSize: "md",            // 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: "system",      // 'system' | 'traditional' | 'simplified' | 'rounded'
  vibration: true,
  sound: true,
  tashkeel: true,            // true = keep diacritics, false = strip them
  keepAwake: false,
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — fail silently, app still works in-memory */
  }
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------------------------------------------------------------------- */
/* Settings                                                                */
/* ---------------------------------------------------------------------- */
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.SETTINGS, {}) };
}

export function updateSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write(KEYS.SETTINGS, next);
  return next;
}

/* ---------------------------------------------------------------------- */
/* Daily reset                                                             */
/* ---------------------------------------------------------------------- */
export function ensureDailyReset() {
  const last = read(KEYS.DAILY_RESET_DATE, null);
  const today = todayKey();
  if (last !== today) {
    if (last) {
      // Archive yesterday's completed count into stats before wiping.
      const stats = read(KEYS.STATS, {});
      const completed = read(KEYS.COMPLETED, {});
      const count = Object.values(completed).reduce(
        (sum, cat) => sum + Object.keys(cat).length,
        0
      );
      stats[last] = count;
      write(KEYS.STATS, stats);
    }
    write(KEYS.COMPLETED, {});
    write(KEYS.PROGRESS, {});
    write(KEYS.DAILY_RESET_DATE, today);
  }
}

export function resetDailyProgress() {
  write(KEYS.COMPLETED, {});
  write(KEYS.PROGRESS, {});
  write(KEYS.DAILY_RESET_DATE, todayKey());
}

/* ---------------------------------------------------------------------- */
/* Completed / progress tracking                                          */
/* ---------------------------------------------------------------------- */
export function getCompleted(categoryId) {
  const all = read(KEYS.COMPLETED, {});
  return all[categoryId] || {};
}

export function markCompleted(categoryId, itemId) {
  const all = read(KEYS.COMPLETED, {});
  all[categoryId] = all[categoryId] || {};
  all[categoryId][itemId] = true;
  write(KEYS.COMPLETED, all);
  bumpTodayStat();
}

export function isItemCompleted(categoryId, itemId) {
  const all = read(KEYS.COMPLETED, {});
  return !!(all[categoryId] && all[categoryId][itemId]);
}

export function getRemaining(categoryId, itemId, fallback) {
  const all = read(KEYS.PROGRESS, {});
  if (all[categoryId] && typeof all[categoryId][itemId] === "number") {
    return all[categoryId][itemId];
  }
  return fallback;
}

export function setRemaining(categoryId, itemId, value) {
  const all = read(KEYS.PROGRESS, {});
  all[categoryId] = all[categoryId] || {};
  all[categoryId][itemId] = value;
  write(KEYS.PROGRESS, all);
}

/* ---------------------------------------------------------------------- */
/* Current position (continue from last position)                         */
/* ---------------------------------------------------------------------- */
export function getCurrentPosition() {
  return read(KEYS.CURRENT, null);
}

export function setCurrentPosition(categoryId, itemIndex) {
  write(KEYS.CURRENT, { categoryId, itemIndex });
}

/* ---------------------------------------------------------------------- */
/* Favorites                                                               */
/* ---------------------------------------------------------------------- */
function favKey(categoryId, itemId) {
  return `${categoryId}::${itemId}`;
}

export function isFavorite(categoryId, itemId) {
  const all = read(KEYS.FAVORITES, {});
  return !!all[favKey(categoryId, itemId)];
}

export function toggleFavorite(categoryId, itemId) {
  const all = read(KEYS.FAVORITES, {});
  const k = favKey(categoryId, itemId);
  if (all[k]) delete all[k];
  else all[k] = true;
  write(KEYS.FAVORITES, all);
  return !!all[k];
}

export function getFavoriteKeys() {
  return Object.keys(read(KEYS.FAVORITES, {}));
}

/* ---------------------------------------------------------------------- */
/* Statistics                                                              */
/* ---------------------------------------------------------------------- */
function bumpTodayStat() {
  const stats = read(KEYS.STATS, {});
  const key = todayKey();
  stats[key] = (stats[key] || 0) + 1;
  write(KEYS.STATS, stats);
}

export function getStats() {
  return read(KEYS.STATS, {});
}

export function getLastNDays(n) {
  const stats = getStats();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, label: d.toLocaleDateString("ar-EG", { weekday: "short" }), value: stats[key] || 0 });
  }
  return days;
}

export function getMonthTotal() {
  const stats = getStats();
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return Object.entries(stats)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((sum, [, v]) => sum + v, 0);
}
