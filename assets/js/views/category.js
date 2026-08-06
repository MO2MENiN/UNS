/**
 * views/category.js
 * Lists every Dhikr inside one category, showing completion state,
 * a favorite toggle, and a tap target that opens the counter page.
 */
import { getCategoryById } from "../categories.js";
import { icon } from "../icons.js";
import { loadCategory } from "../data.js";
import { getCompleted, isFavorite, toggleFavorite, getSettings } from "../state.js";
import { renderText } from "../utils/tashkeel.js";
import { navigate } from "../router.js";
import { showToast } from "../utils/toast.js";

export async function renderCategory(params, outlet) {
  const { id } = params;
  const category = getCategoryById(id);
  const settings = getSettings();

  outlet.innerHTML = `
    <h1 class="section-title" style="margin-top:0">${category ? category.name : ""}</h1>
    <div id="category-list"></div>
  `;

  const listEl = outlet.querySelector("#category-list");

  let data;
  try {
    data = await loadCategory(id);
  } catch {
    listEl.innerHTML = `
      <div class="empty-state">
        ${icon("x", 40)}
        <p>تعذر تحميل هذا التصنيف. تحقق من الاتصال وحاول مرة أخرى.</p>
      </div>`;
    return;
  }

  if (!data.items || data.items.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        ${icon("book", 40)}
        <p>لا توجد أذكار مضافة في هذا التصنيف بعد.</p>
      </div>`;
    return;
  }

  const completed = getCompleted(id);

  listEl.innerHTML = data.items
    .map((item, index) => {
      const done = !!completed[item.ID];
      const fav = isFavorite(id, item.ID);
      const text = renderText(item.NAME, settings.tashkeel);
      return `
      <article class="dhikr-list-item ${done ? "dhikr-list-item--done" : ""}" data-index="${index}">
        <button class="dhikr-list-item__check" aria-hidden="true" tabindex="-1">
          ${icon("check-circle", 16)}
        </button>
        <div class="dhikr-list-item__body">
          <p class="dhikr-list-item__text arabic-text">${text}</p>
          <div class="dhikr-list-item__meta">
            <span>${item.COUNTER > 0 ? `التكرار: ${item.COUNTER}` : ""}</span>
            <button class="dhikr-list-item__fav" data-fav-id="${item.ID}" aria-pressed="${fav}" aria-label="إضافة إلى المفضلة">
              ${icon(fav ? "heart" : "heart-outline", 18)}
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  listEl.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".dhikr-list-item__fav");
    if (favBtn) {
      e.stopPropagation();
      const isFav = toggleFavorite(id, favBtn.dataset.favId);
      favBtn.setAttribute("aria-pressed", isFav);
      favBtn.innerHTML = icon(isFav ? "heart" : "heart-outline", 18);
      showToast(isFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
      return;
    }
    const item = e.target.closest(".dhikr-list-item");
    if (item) {
      navigate(`/dhikr/${id}/${item.dataset.index}`);
    }
  });
}
