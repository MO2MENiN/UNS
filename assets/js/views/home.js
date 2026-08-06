/**
 * views/home.js
 * Landing page: shows only the category cards, each reflecting
 * today's completion state.
 */
import { CATEGORIES } from "../categories.js";
import { icon } from "../icons.js";
import { loadCategory } from "../data.js";
import { getCompleted } from "../state.js";
import { navigate } from "../router.js";

export async function renderHome(params, outlet) {
  outlet.innerHTML = `
    <h1 class="visually-hidden">أنس - الصفحة الرئيسية</h1>
    <p class="section-title">التصنيفات</p>
    <div class="category-grid" id="category-grid" aria-live="polite"></div>
  `;

  const grid = outlet.querySelector("#category-grid");
  grid.innerHTML = CATEGORIES.map(
    (cat) => `
    <button class="category-card" data-id="${cat.id}" aria-label="${cat.name}">
      <span class="category-card__icon">${icon(cat.icon, 22)}</span>
      <span class="category-card__name arabic-text">${cat.name}</span>
      <span class="category-card__count" data-count-for="${cat.id}">...</span>
    </button>
  `
  ).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-card");
    if (btn) navigate(`/category/${btn.dataset.id}`);
  });

  // Populate counts + completion badges without blocking first paint.
  CATEGORIES.forEach(async (cat) => {
    try {
      const data = await loadCategory(cat.id);
      const total = data.items.length;
      const countEl = grid.querySelector(`[data-count-for="${cat.id}"]`);
      if (!countEl) return;

      if (total === 0) {
        countEl.textContent = "لا يوجد محتوى بعد";
        return;
      }

      const completed = getCompleted(cat.id);
      const doneCount = Object.keys(completed).length;
      countEl.textContent = `${doneCount} / ${total}`;

      if (doneCount >= total) {
        const card = grid.querySelector(`[data-id="${cat.id}"]`);
        const badge = document.createElement("span");
        badge.className = "category-card__badge";
        badge.innerHTML = icon("check-circle", 13);
        card.appendChild(badge);
      }
    } catch {
      const countEl = grid.querySelector(`[data-count-for="${cat.id}"]`);
      if (countEl) countEl.textContent = "تعذر التحميل";
    }
  });
}
