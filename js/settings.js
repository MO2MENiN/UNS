// settings.js — settings state + applying theme/font-size to the document.
import { Storage } from './storage.js';

function applyTheme(theme) {
  const root = document.documentElement;
  let resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', resolved);
}

function applyFontSize(size) {
  document.documentElement.setAttribute('data-font', size);
}

function applyAll() {
  const s = Storage.getSettings();
  applyTheme(s.theme);
  applyFontSize(s.fontSize);
}

let systemThemeListenerAttached = false;
function watchSystemTheme() {
  if (systemThemeListenerAttached) return;
  systemThemeListenerAttached = true;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const s = Storage.getSettings();
    if (s.theme === 'system') applyTheme('system');
  });
}

function get() {
  return Storage.getSettings();
}

function set(key, value) {
  const settings = Storage.setSetting(key, value);
  if (key === 'theme') applyTheme(value);
  if (key === 'fontSize') applyFontSize(value);
  return settings;
}

function vibrate(pattern = 15) {
  const s = Storage.getSettings();
  if (!s.vibration) return;
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (_) { /* unsupported, ignore */ }
  }
}

export const Settings = { applyAll, watchSystemTheme, get, set, vibrate };
