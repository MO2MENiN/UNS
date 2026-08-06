/**
 * views/favorites.js
 * Lists every Dhikr the user has marked as favorite, across all
 * categories, resolved from the favorites keys stored in state.
 */
import { CATEGORIES, getCategoryById } from "../categories.js";
import { icon } from "../icons.js";
import { loadCategory } from "../data.js";
import { getFavoriteKeys, toggleFavorite, getSettings } from "../state.js";
import { renderText } from "../utils/tashkeel.js";
import { navigate } from "../router.js";
import { showToast } from "../utils/toast.js";

export async function renderFavorites(params, outlet) {
  outlet.innerHTML = `
    <h1 class="section-title" style="margin-top:0">المفضلة</h1>
    <div id="fav-list"></div>
  `;
  const listEl = outlet.querySelector("#fav-list");
  const keys = getFavoriteKeys();

  if (keys.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        ${icon("heart-outline", 40)}
        <p>لم تُضِف أي ذكر إلى المفضلة بعد.</p>
      </div>`;
    return;
  }

  const settings = getSettings();
  const entries = keys.map((k) => {
    const [categoryId, itemId] = k.split("::");
    return { categoryId, itemId };
  });

  const byCategory = new Map();
  entries.forEach((e) => {
    if (!byCategory.has(e.categoryId)) byCategory.set(e.categoryId, []);
    byCategory.get(e.categoryId).push(e.itemId);
  });

  const rows = [];
  for (const [categoryId, itemIds] of byCategory) {
    let data;
    try {
      data = await loadCategory(categoryId);
    } catch {
      continue;
    }
    const category = getCategoryById(categoryId);
    itemIds.forEach((itemId) => {
      const item = data.items.find((it) => it.ID === itemId);
      if (!item) return;
      rows.push({ categoryId, categoryName: category ? category.name : "", item });
    });
  }

  if (rows.length === 0) {
    listEl.innerHTML = `<div class="empty-state">${icon("heart-outline", 40)}<p>لم تُضِف أي ذكر إلى المفضلة بعد.</p></div>`;
    return;
  }

  listEl.innerHTML = rows
    .map(
      (r, i) => `
      <article class="dhikr-list-item" data-index="${i}" data-cat="${r.categoryId}">
        <button class="dhikr-list-item__check" aria-hidden="true" tabindex="-1" style="border-color:transparent;color:var(--color-secondary)">${icon("star", 16)}</button>
        <div class="dhikr-list-item__body">
          <p class="dhikr-list-item__text arabic-text">${renderText(r.item.NAME, settings.tashkeel)}</p>
          <div class="dhikr-list-item__meta">
            <span>${r.categoryName}</span>
            <button class="dhikr-list-item__fav" data-fav-cat="${r.categoryId}" data-fav-id="${r.item.ID}" aria-pressed="true" aria-label="إزالة من المفضلة">
              ${icon("heart", 18)}
            </button>
          </div>
        </div>
      </article>`
    )
    .join("");

  listEl.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".dhikr-list-item__fav");
    if (favBtn) {
      e.stopPropagation();
      toggleFavorite(favBtn.dataset.favCat, favBtn.dataset.favId);
      showToast("أُزيل من المفضلة");
      renderFavorites(params, outlet);
      return;
    }
    const article = e.target.closest(".dhikr-list-item");
    if (article) {
      const idx = rows.findIndex((r, i) => String(i) === article.dataset.index);
      const row = rows[idx];
      if (!row) return;
      loadCategory(row.categoryId).then((data) => {
        const itemIndex = data.items.findIndex((it) => it.ID === row.item.ID);
        navigate(`/dhikr/${row.categoryId}/${Math.max(itemIndex, 0)}`);
      });
    }
  });
}
