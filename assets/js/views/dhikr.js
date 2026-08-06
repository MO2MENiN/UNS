/**
 * views/dhikr.js
 * The core interactive screen: shows one Dhikr with a large tap
 * button, a circular progress indicator, and remaining-count text.
 * Auto-advances to the next Dhikr on completion, and shows a
 * completion screen after the last item in the category.
 */
import { getCategoryById } from "../categories.js";
import { icon } from "../icons.js";
import { loadCategory } from "../data.js";
import {
  getSettings,
  getRemaining,
  setRemaining,
  markCompleted,
  isItemCompleted,
  setCurrentPosition,
  isFavorite,
  toggleFavorite,
} from "../state.js";
import { renderText } from "../utils/tashkeel.js";
import { playTick, playComplete } from "../utils/sound.js";
import { vibrate } from "../utils/vibrate.js";
import { shareText, copyText } from "../utils/share.js";
import { showToast } from "../utils/toast.js";
import { navigate } from "../router.js";

const CIRCLE_R = 100;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

export async function renderDhikr(params, outlet) {
  const categoryId = params.categoryId;
  let index = parseInt(params.index, 10) || 0;
  const category = getCategoryById(categoryId);

  let data;
  try {
    data = await loadCategory(categoryId);
  } catch {
    outlet.innerHTML = `<div class="empty-state">${icon("x", 40)}<p>تعذر تحميل البيانات.</p></div>`;
    return;
  }

  const items = data.items || [];

  if (items.length === 0) {
    outlet.innerHTML = `<div class="empty-state">${icon("book", 40)}<p>لا يوجد محتوى في هذا التصنيف بعد.</p></div>`;
    return;
  }

  if (index >= items.length) {
    renderCompletion(outlet, category);
    return;
  }

  setCurrentPosition(categoryId, index);

  const settings = getSettings();
  const item = items[index];
  const target = item.COUNTER && item.COUNTER > 0 ? item.COUNTER : 1;
  let remaining = getRemaining(categoryId, item.ID, target);
  if (isItemCompleted(categoryId, item.ID)) remaining = 0;

  const text = renderText(item.NAME, settings.tashkeel);
  const fav = isFavorite(categoryId, item.ID);

  outlet.innerHTML = `
    <div class="dhikr-stage">
      <p class="dhikr-stage__progress">${index + 1} / ${items.length} — ${category ? category.name : ""}</p>

      <div class="dhikr-stage__card">
        <p class="dhikr-stage__text arabic-text" id="dhikr-text">${text}</p>
      </div>

      <div class="dhikr-stage__circle-wrap">
        <svg viewBox="0 0 220 220" role="img" aria-label="التقدم">
          <circle class="dhikr-stage__circle-bg" cx="110" cy="110" r="${CIRCLE_R}"></circle>
          <circle class="dhikr-stage__circle-fg" id="progress-circle" cx="110" cy="110" r="${CIRCLE_R}"
            stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="0"></circle>
        </svg>
        <div class="dhikr-stage__center">
          <span class="dhikr-stage__remaining" id="remaining-value">${remaining}</span>
          <span class="dhikr-stage__percent" id="percent-value">0%</span>
        </div>
      </div>

      <button class="tap-button" id="tap-button" aria-label="اضغط للعد">اضغط للتسبيح</button>

      <div class="dhikr-stage__actions">
        <button class="icon-btn" id="fav-btn" aria-pressed="${fav}" aria-label="مفضلة">${icon(fav ? "heart" : "heart-outline", 20)}</button>
        <button class="icon-btn" id="share-btn" aria-label="مشاركة">${icon("share", 20)}</button>
        <button class="icon-btn" id="copy-btn" aria-label="نسخ">${icon("copy", 20)}</button>
      </div>
    </div>
  `;

  const remainingEl = outlet.querySelector("#remaining-value");
  const percentEl = outlet.querySelector("#percent-value");
  const circleEl = outlet.querySelector("#progress-circle");
  const tapBtn = outlet.querySelector("#tap-button");
  const favBtn = outlet.querySelector("#fav-btn");
  const shareBtn = outlet.querySelector("#share-btn");
  const copyBtn = outlet.querySelector("#copy-btn");

  function updateVisuals() {
    const done = target - remaining;
    const ratio = target > 0 ? done / target : 1;
    remainingEl.textContent = remaining;
    percentEl.textContent = `${Math.round(ratio * 100)}%`;
    circleEl.setAttribute("stroke-dashoffset", String(CIRCUMFERENCE * (1 - ratio)));
  }
  updateVisuals();

  function advance() {
    if (index + 1 < items.length) {
      navigate(`/dhikr/${categoryId}/${index + 1}`);
    } else {
      navigate(`/dhikr/${categoryId}/${items.length}`);
    }
  }

  tapBtn.addEventListener("click", () => {
    if (remaining <= 0) return;
    remaining -= 1;
    setRemaining(categoryId, item.ID, remaining);
    updateVisuals();

    const s = getSettings();
    vibrate(s.vibration, 12);

    tapBtn.classList.remove("tap-button--tapped");
    void tapBtn.offsetWidth;
    tapBtn.classList.add("tap-button--tapped");

    if (remaining > 0) {
      playTick(s.sound);
    } else {
      playComplete(s.sound);
      markCompleted(categoryId, item.ID);
      tapBtn.disabled = true;
      tapBtn.textContent = "تم ✓";
      setTimeout(advance, 550);
    }
  });

  favBtn.addEventListener("click", () => {
    const isFav = toggleFavorite(categoryId, item.ID);
    favBtn.setAttribute("aria-pressed", isFav);
    favBtn.innerHTML = icon(isFav ? "heart" : "heart-outline", 20);
    showToast(isFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
  });

  shareBtn.addEventListener("click", async () => {
    const ok = await shareText(item.NAME, category ? category.name : "أنس");
    if (ok) showToast("تمت المشاركة");
  });

  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(item.NAME);
    showToast(ok ? "تم النسخ" : "تعذر النسخ");
  });
}

function renderCompletion(outlet, category) {
  outlet.innerHTML = `
    <div class="completion-screen">
      <div class="completion-screen__icon">${icon("check-circle", 48)}</div>
      <h2 class="completion-screen__title">أحسنت! أكملت ${category ? category.name : "هذا التصنيف"}</h2>
      <p class="completion-screen__subtitle">تقبل الله منك، واصل أذكارك اليومية.</p>
      <div class="dhikr-stage__actions">
        <a class="secondary-btn" href="#/home">الرئيسية</a>
        <a class="primary-btn" href="#/category/${category ? category.id : ""}">مراجعة التصنيف</a>
      </div>
    </div>
  `;
}
