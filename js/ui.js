// ui.js — small reusable DOM/render helpers shared across screens.

function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-${name}"></use></svg>`;
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

function setActiveTab(routeName) {
  document.querySelectorAll('.tabbar__item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.route === routeName);
  });
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
  icon, escapeForExcerpt, escapeHTML, toast, setActiveTab,
  showHeader, hideHeader, showHomeHeader, hideHomeHeader
};
