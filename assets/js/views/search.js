/**
 * views/search.js
 * Full-text search across every category's Dhikr text (Arabic,
 * tashkeel-insensitive) plus category names.
 */
import { CATEGORIES } from "../categories.js";
import { icon } from "../icons.js";
import { loadCategory } from "../data.js";
import { getSettings } from "../state.js";
import { renderText, stripTashkeel } from "../utils/tashkeel.js";
import { navigate } from "../router.js";

export async function renderSearch(params, outlet) {
  outlet.innerHTML = `
    <div class="search-bar">
      ${icon("search", 18)}
      <input type="search" id="search-input" placeholder="ابحث عن ذكر أو تصنيف..." autocomplete="off" aria-label="بحث" />
    </div>
    <div id="search-results"></div>
  `;

  const input = outlet.querySelector("#search-input");
  const resultsEl = outlet.querySelector("#search-results");
  const settings = getSettings();

  function emptyState(msg) {
    resultsEl.innerHTML = `<div class="empty-state">${icon("search", 40)}<p>${msg}</p></div>`;
  }
  emptyState("اكتب كلمة للبحث في جميع الأذكار والتصنيفات.");

  let debounceTimer = null;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(input.value.trim()), 250);
  });

  async function doSearch(query) {
    if (!query) {
      emptyState("اكتب كلمة للبحث في جميع الأذكار والتصنيفات.");
      return;
    }
    const needle = stripTashkeel(query);

    const catMatches = CATEGORIES.filter((c) => stripTashkeel(c.name).includes(needle));

    const itemMatches = [];
    for (const cat of CATEGORIES) {
      try {
        const data = await loadCategory(cat.id);
        data.items.forEach((item, idx) => {
          if (stripTashkeel(item.NAME || "").includes(needle)) {
            itemMatches.push({ cat, item, idx });
          }
        });
      } catch {
        /* skip categories that failed to load */
      }
      if (itemMatches.length > 40) break;
    }

    if (catMatches.length === 0 && itemMatches.length === 0) {
      emptyState(`لا توجد نتائج لـ "${query}"`);
      return;
    }

    let html = "";
    if (catMatches.length > 0) {
      html += `<p class="section-title" style="margin-top:0">تصنيفات</p>`;
      html += `<div class="category-grid">${catMatches
        .map(
          (c) => `<button class="category-card" data-nav="/category/${c.id}"><span class="category-card__icon">${icon(c.icon, 22)}</span><span class="category-card__name arabic-text">${c.name}</span></button>`
        )
        .join("")}</div>`;
    }
    if (itemMatches.length > 0) {
      html += `<p class="section-title">أذكار</p>`;
      html += itemMatches
        .slice(0, 40)
        .map(
          (m) => `
        <article class="dhikr-list-item" data-nav="/dhikr/${m.cat.id}/${m.idx}"
          role="button" tabindex="0" aria-label="${renderText(m.item.NAME, settings.tashkeel)}، ${m.cat.name}">
          <span class="dhikr-list-item__check" aria-hidden="true" style="border-color:transparent;color:var(--color-primary)">${icon(m.cat.icon, 16)}</span>
          <div class="dhikr-list-item__body">
            <p class="dhikr-list-item__text arabic-text">${renderText(m.item.NAME, settings.tashkeel)}</p>
            <div class="dhikr-list-item__meta"><span>${m.cat.name}</span></div>
          </div>
        </article>`
        )
        .join("");
    }
    resultsEl.innerHTML = html;
  }

  resultsEl.addEventListener("click", (e) => {
    const el = e.target.closest("[data-nav]");
    if (el) navigate(el.dataset.nav);
  });

  resultsEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target.closest("[data-nav]");
    if (el) {
      e.preventDefault();
      navigate(el.dataset.nav);
    }
  });
}
