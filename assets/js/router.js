/**
 * router.js
 * Minimal hash-based router — no build step, works natively on
 * GitHub Pages. Routes:
 *   #/home
 *   #/category/:id
 *   #/dhikr/:categoryId/:index
 *   #/favorites
 *   #/search
 *   #/settings
 */
const routes = [];
let currentCleanup = null;
let outlet = null;

export function registerRoute(pattern, handler) {
  const paramNames = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[^/]+/g, (m) => {
        paramNames.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ regex, paramNames, handler });
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "") || "/home";
  return hash.split("?")[0];
}

export function navigate(path) {
  if (window.location.hash === `#${path}`) {
    handleRoute();
  } else {
    window.location.hash = path;
  }
}

async function handleRoute() {
  const path = parseHash();
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      if (typeof currentCleanup === "function") {
        try { currentCleanup(); } catch { /* ignore */ }
        currentCleanup = null;
      }
      outlet.innerHTML = "";
      const result = await route.handler(params, outlet);
      if (typeof result === "function") currentCleanup = result;
      outlet.classList.remove("view-enter");
      // Force reflow so the animation replays on every navigation
      void outlet.offsetWidth;
      outlet.classList.add("view-enter");
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      document.dispatchEvent(new CustomEvent("uns:navigated", { detail: { path, params } }));
      return;
    }
  }
  navigate("/home");
}

export function initRouter(outletEl) {
  outlet = outletEl;
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

export function currentPath() {
  return parseHash();
}
