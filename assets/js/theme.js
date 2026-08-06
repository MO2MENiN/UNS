/**
 * theme.js
 * Applies theme / font-size / font-family settings to the document
 * root via data-attributes consumed by variables.css.
 */
import { getSettings } from "./state.js";

let mediaQuery = null;

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyTheme() {
  const s = getSettings();
  document.documentElement.setAttribute("data-theme", resolveTheme(s.theme));
  document.documentElement.setAttribute("data-fontsize", s.fontSize);
  document.documentElement.setAttribute("data-font", s.fontFamily);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolveTheme(s.theme) === "dark" ? "#0D1412" : "#0F766E");
  }

  if (s.theme === "system" && !mediaQuery) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if (getSettings().theme === "system") applyTheme();
    });
  }
}
