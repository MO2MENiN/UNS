// ui.js — small reusable DOM/render helpers shared across screens.

function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-${name}"></use></svg>`;
}

// Message text is passed through escapeHTML here since some callers interpolate
// JSON-sourced or user-typed text (e.g. a search query) into it.
function emptyState(iconName, message, extraAttrs = '') {
  return `<div class="empty-state" ${extraAttrs}><div class="icon-wrap">${icon(iconName)}</div><p>${escapeHTML(message)}</p></div>`;
}

function escapeForExcerpt(text, max = 70) {
  if (!text) return '';
  const trimmed = text.length > max ? text.slice(0, max) + '…' : text;
  return trimmed;
}

// JSON-sourced content (dhikr titles/text, section metadata, search queries) is untrusted.
// Anything from data/*.json must go through this before being placed in an innerHTML template.
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHTML(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

let toastTimer = null;
function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2200);
}

// Precomputed for a 0-300-wide, 82-tall viewBox (matching the wave SVG's actual
// rendered height exactly — see the CSS comment on .tabbar__wave for why that
// match matters). cx values follow the RTL visual order: "home" renders at the
// right edge, "settings" at the left, matching the DOM/grid order under dir="rtl".
const TAB_NOTCH_CX = { home: 250, favorites: 150, settings: 50 };

function buildWavePath(cx) {
  const width = 300, height = 82, baseY = 28, dipY = 64, halfSpread = 48, curveIn = 24;
  const leftFlatEnd = cx - halfSpread;
  const rightFlatStart = cx + halfSpread;
  return (
    `M0,${baseY} L${leftFlatEnd},${baseY} ` +
    `C${leftFlatEnd + curveIn},${baseY} ${cx - 27},${dipY} ${cx},${dipY} ` +
    `C${cx + 27},${dipY} ${rightFlatStart - curveIn},${baseY} ${rightFlatStart},${baseY} ` +
    `L${width},${baseY} L${width},${height} L0,${height} Z`
  );
}

function setActiveTab(routeName) {
  document.querySelectorAll('.tabbar__item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.route === routeName);
  });
  const cx = TAB_NOTCH_CX[routeName];
  if (cx === undefined) return;
  const wavePath = document.getElementById('tabbarWavePath');
  if (wavePath) wavePath.setAttribute('d', buildWavePath(cx));
}

function showHeader({ title, showBack }) {
  hideHomeHeader();
  const header = document.getElementById('appHeader');
  if (!header) return;
  header.hidden = false;
  header.querySelector('.app-header__title').textContent = title || '';
  const backBtn = header.querySelector('.app-header__back');
  backBtn.hidden = !showBack;
}

function hideHeader() {
  const header = document.getElementById('appHeader');
  if (header) header.hidden = true;
}

function showHomeHeader() {
  hideHeader();
  const header = document.getElementById('homeHeader');
  if (header) header.hidden = false;
}

function hideHomeHeader() {
  const header = document.getElementById('homeHeader');
  if (header) header.hidden = true;
}

export const UI = {
  icon, emptyState, escapeForExcerpt, escapeHTML, toast, setActiveTab,
  showHeader, hideHeader, showHomeHeader, hideHomeHeader
};
