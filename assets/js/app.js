/**
 * app.js
 * Application entry point: builds the persistent app shell (header,
 * bottom nav, toast host), wires the router, applies theme/settings,
 * registers the service worker, and manages the install/update
 * banners.
 */
import { initRouter, navigate, currentPath } from "./router.js";
import { renderHome } from "./views/home.js";
import { renderCategory } from "./views/category.js";
import { renderDhikr } from "./views/dhikr.js";
import { renderFavorites } from "./views/favorites.js";
import { renderSearch } from "./views/search.js";
import { renderSettings } from "./views/settings.js";
import { registerRoute } from "./router.js";
import { CATEGORIES, getCategoryById } from "./categories.js";
import { icon } from "./icons.js";
import { applyTheme } from "./theme.js";
import { ensureDailyReset, getSettings } from "./state.js";
import { formatGregorian, formatHijri, formatWeekday } from "./utils/hijri.js";
import { prefetchAll } from "./data.js";
import { initWakeLockVisibilityHandler, setWakeLock } from "./utils/wakelock.js";

/* ---------------------------------------------------------------------- */
/* Boot                                                                    */
/* ---------------------------------------------------------------------- */
ensureDailyReset();
applyTheme();
initWakeLockVisibilityHandler();
if (getSettings().keepAwake) setWakeLock(true);

buildShell();
registerRoutes();
initRouter(document.getElementById("app-outlet"));
updateHeaderDates();
setInterval(updateHeaderDates, 60 * 1000);
prefetchAll(CATEGORIES.map((c) => c.id));
registerServiceWorker();
wireInstallPrompt();

document.addEventListener("uns:navigated", ({ detail }) => {
  updateHeaderForRoute(detail.path);
  updateBottomNav(detail.path);
});

/* ---------------------------------------------------------------------- */
/* Shell                                                                   */
/* ---------------------------------------------------------------------- */
function buildShell() {
  const header = document.getElementById("app-header");
  header.innerHTML = `
    <div class="app-header__row">
      <button class="app-header__back" id="header-back" hidden aria-label="رجوع">${icon("chevron-forward", 20)}</button>
      <div class="app-header__brand" id="header-brand">
        <img src="assets/icons/icon-72.png" alt="" class="app-header__brand-icon" width="38" height="38" />
        <span class="app-header__title" id="header-title">أنس</span>
      </div>
      <div class="app-header__dates" id="header-dates">
        <div class="app-header__hijri" id="header-hijri"></div>
        <div class="app-header__gregorian" id="header-gregorian"></div>
      </div>
    </div>
  `;
  header.querySelector("#header-back").addEventListener("click", () => history.back());

  const nav = document.getElementById("bottom-nav");
  nav.innerHTML = `
    <div class="bottom-nav__row" role="tablist" aria-label="التنقل الرئيسي">
      <a class="bottom-nav__item" href="#/home" data-path="/home">${icon("home2", 22)}<span>الرئيسية</span></a>
      <a class="bottom-nav__item" href="#/search" data-path="/search">${icon("search", 22)}<span>بحث</span></a>
      <a class="bottom-nav__item" href="#/favorites" data-path="/favorites">${icon("heart-outline", 22)}<span>المفضلة</span></a>
      <a class="bottom-nav__item" href="#/settings" data-path="/settings">${icon("settings", 22)}<span>الإعدادات</span></a>
    </div>
  `;
}

function updateHeaderForRoute(path) {
  const backBtn = document.getElementById("header-back");
  const title = document.getElementById("header-title");
  const dates = document.getElementById("header-dates");

  const catMatch = path.match(/^\/category\/([^/]+)$/);
  const dhikrMatch = path.match(/^\/dhikr\/([^/]+)\//);

  if (path === "/home") {
    backBtn.hidden = true;
    title.textContent = "أنس";
    dates.style.display = "";
  } else if (catMatch) {
    backBtn.hidden = false;
    title.textContent = getCategoryById(catMatch[1])?.name || "أنس";
    dates.style.display = "none";
  } else if (dhikrMatch) {
    backBtn.hidden = false;
    title.textContent = getCategoryById(dhikrMatch[1])?.name || "أنس";
    dates.style.display = "none";
  } else if (path === "/favorites") {
    backBtn.hidden = true;
    title.textContent = "المفضلة";
    dates.style.display = "none";
  } else if (path === "/search") {
    backBtn.hidden = true;
    title.textContent = "بحث";
    dates.style.display = "none";
  } else if (path === "/settings") {
    backBtn.hidden = true;
    title.textContent = "الإعدادات";
    dates.style.display = "none";
  } else {
    backBtn.hidden = true;
    title.textContent = "أنس";
    dates.style.display = "";
  }
}

function updateBottomNav(path) {
  document.querySelectorAll(".bottom-nav__item").forEach((el) => {
    const active = el.dataset.path === path;
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}

function updateHeaderDates() {
  const now = new Date();
  const hijriEl = document.getElementById("header-hijri");
  const gregEl = document.getElementById("header-gregorian");
  if (hijriEl) hijriEl.textContent = formatHijri(now);
  if (gregEl) gregEl.textContent = `${formatWeekday(now)}، ${formatGregorian(now)}`;
}

/* ---------------------------------------------------------------------- */
/* Routes                                                                  */
/* ---------------------------------------------------------------------- */
function registerRoutes() {
  registerRoute("/home", renderHome);
  registerRoute("/category/:id", renderCategory);
  registerRoute("/dhikr/:categoryId/:index", renderDhikr);
  registerRoute("/favorites", renderFavorites);
  registerRoute("/search", renderSearch);
  registerRoute("/settings", renderSettings);
}

/* ---------------------------------------------------------------------- */
/* Service worker + update detection                                      */
/* ---------------------------------------------------------------------- */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js");

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      });

      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    } catch {
      /* offline-first: registration failure shouldn't break the app */
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

function showUpdateBanner(reg) {
  const banner = document.getElementById("update-banner");
  banner.innerHTML = `
    <span>يتوفر تحديث جديد للتطبيق</span>
    <button class="install-banner__btn install-banner__btn--primary" id="update-now-btn">تحديث الآن</button>
  `;
  banner.classList.add("update-banner--visible");
  banner.querySelector("#update-now-btn").addEventListener("click", () => {
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    banner.classList.remove("update-banner--visible");
  });
}

/* ---------------------------------------------------------------------- */
/* Install prompt (beforeinstallprompt)                                   */
/* ---------------------------------------------------------------------- */
function wireInstallPrompt() {
  let deferredPrompt = null;
  const banner = document.getElementById("install-banner");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (localStorage.getItem("uns.installDismissed") === "1") return;
    banner.innerHTML = `
      <span class="install-banner__text">ثبّت أنس على جهازك لتجربة أسرع وتعمل بدون إنترنت</span>
      <div class="install-banner__actions">
        <button class="install-banner__btn" id="install-dismiss">لاحقًا</button>
        <button class="install-banner__btn install-banner__btn--primary" id="install-accept">تثبيت</button>
      </div>
    `;
    banner.classList.add("install-banner--visible");

    banner.querySelector("#install-dismiss").addEventListener("click", () => {
      banner.classList.remove("install-banner--visible");
      localStorage.setItem("uns.installDismissed", "1");
    });
    banner.querySelector("#install-accept").addEventListener("click", async () => {
      banner.classList.remove("install-banner--visible");
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      }
    });
  });

  window.addEventListener("appinstalled", () => {
    banner.classList.remove("install-banner--visible");
  });
}
