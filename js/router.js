// router.js — minimal History API router. No page reloads on internal nav.

// Base path = the directory index.html lives in (works from root or a sub-path deployment).
const BASE_PATH = (() => {
  const path = window.location.pathname;
  const withoutFile = path.replace(/index\.html$/, '');
  return withoutFile.endsWith('/') ? withoutFile : withoutFile + '/';
})();

const routes = []; // { pattern: RegExp, keys: string[], handler: fn }

function compile(path) {
  const keys = [];
  const pattern = path
    .replace(/\/+$/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^/${pattern}/?$`), keys };
}

function on(path, handler) {
  const { regex, keys } = compile(path);
  routes.push({ regex, keys, handler });
}

function currentInternalPath() {
  let p = window.location.pathname;
  if (p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length - 1); // keep leading /
  if (!p.startsWith('/')) p = '/' + p;
  return p || '/';
}

function resolve() {
  const path = currentInternalPath();
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
      route.handler(params);
      return true;
    }
  }
  // Fallback to home if nothing matches.
  const homeRoute = routes.find((r) => r.regex.test('/'));
  if (homeRoute) homeRoute.handler({});
  return false;
}

function navigate(path, { replace = false } = {}) {
  const full = BASE_PATH.replace(/\/$/, '') + path;
  if (replace) {
    window.history.replaceState({}, '', full);
  } else {
    window.history.pushState({}, '', full);
  }
  resolve();
}

function start() {
  window.addEventListener('popstate', resolve);
  // Intercept internal link clicks for SPA-style navigation.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route-link]');
    if (!link) return;
    e.preventDefault();
    navigate(link.getAttribute('href'));
  });
  resolve();
}

export const Router = { on, navigate, start, BASE_PATH };
