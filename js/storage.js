// storage.js — single point of contact with localStorage.
// Nothing else in the app should call localStorage directly.

const STORAGE_KEY = 'uns_state';
const STATE_VERSION = 1;

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultState() {
  return {
    version: STATE_VERSION,
    date: todayLocal(),
    settings: {
      theme: 'system',       // 'light' | 'dark' | 'system'
      fontSize: 'md',        // 'sm' | 'md' | 'lg' | 'xl'
      tashkeel: true,        // default tashkeel state
      autoNext: false,
      vibration: true
    },
    favorites: [],           // array of `${sectionId}:${dhikrId}`
    progress: {},            // { [`${sectionId}:${dhikrId}`]: count }
    lastState: null          // { sectionId, dhikrId } — continue reading
  };
}

function mergeDefaults(loaded) {
  const base = defaultState();
  if (!loaded || typeof loaded !== 'object') return base;
  return {
    ...base,
    ...loaded,
    settings: { ...base.settings, ...(loaded.settings || {}) },
    favorites: Array.isArray(loaded.favorites) ? loaded.favorites : base.favorites,
    progress: (loaded.progress && typeof loaded.progress === 'object') ? loaded.progress : base.progress,
    lastState: loaded.lastState || base.lastState
  };
}

let memoryState = null;

function read() {
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryState = raw ? mergeDefaults(JSON.parse(raw)) : defaultState();
  } catch (err) {
    console.warn('[storage] failed to read state, falling back to defaults', err);
    memoryState = defaultState();
  }
  return memoryState;
}

function write(state) {
  memoryState = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[storage] failed to persist state', err);
  }
}

function updateState(mutator) {
  const state = read();
  mutator(state);
  write(state);
  return state;
}

function getSettings() {
  return read().settings;
}

function setSetting(key, value) {
  return updateState((s) => { s.settings[key] = value; }).settings;
}

function getFavorites() {
  return read().favorites;
}

function isFavorite(itemKey) {
  return read().favorites.includes(itemKey);
}

function toggleFavorite(itemKey) {
  const state = read();
  const idx = state.favorites.indexOf(itemKey);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(itemKey);
  write(state);
  return state.favorites.includes(itemKey);
}

function getProgress(itemKey) {
  return read().progress[itemKey] || 0;
}

function setProgress(itemKey, count) {
  return updateState((s) => { s.progress[itemKey] = count; }).progress;
}

function getLastState() {
  return read().lastState;
}

function setLastState(sectionId, dhikrId) {
  return updateState((s) => { s.lastState = { sectionId, dhikrId }; }).lastState;
}

function resetAllProgress() {
  return updateState((s) => { s.progress = {}; }).progress;
}

// Ensures daily reset of dhikr counters, without touching favorites/settings/theme.
function applyDailyResetIfNeeded() {
  const state = read();
  const today = todayLocal();
  if (state.date !== today) {
    state.progress = {};
    state.date = today;
    write(state);
    return true;
  }
  return false;
}

export const Storage = {
  getSettings,
  setSetting,
  getFavorites,
  isFavorite,
  toggleFavorite,
  getProgress,
  setProgress,
  getLastState,
  setLastState,
  resetAllProgress,
  applyDailyResetIfNeeded
};
