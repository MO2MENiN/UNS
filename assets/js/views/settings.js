/**
 * views/settings.js
 * Full settings screen: theme, typography, vibration, sound,
 * tashkeel toggle, wake lock, daily-progress reset, and a compact
 * statistics summary (today / week / month).
 */
import { icon } from "../icons.js";
import { getSettings, updateSettings, resetDailyProgress, getLastNDays, getMonthTotal, todayKey, getStats } from "../state.js";
import { applyTheme } from "../theme.js";
import { setWakeLock, isWakeLockSupported } from "../utils/wakelock.js";
import { showToast } from "../utils/toast.js";

const THEME_LABELS = { light: "فاتح", dark: "داكن", system: "تلقائي" };
const FONT_SIZE_LABELS = { sm: "صغير", md: "متوسط", lg: "كبير", xl: "أكبر" };
const FONT_FAMILY_LABELS = { system: "افتراضي", traditional: "تقليدي", simplified: "مبسط", rounded: "مدوّر" };

export async function renderSettings(params, outlet) {
  const s = getSettings();
  const stats = getStats();
  const todayCount = stats[todayKey()] || 0;
  const weekDays = getLastNDays(7);
  const weekTotal = weekDays.reduce((sum, d) => sum + d.value, 0);
  const monthTotal = getMonthTotal();
  const maxDay = Math.max(1, ...weekDays.map((d) => d.value));

  outlet.innerHTML = `
    <h1 class="section-title" style="margin-top:0">الإحصائيات</h1>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-card__value">${todayCount}</div><div class="stat-card__label">اليوم</div></div>
      <div class="stat-card"><div class="stat-card__value">${weekTotal}</div><div class="stat-card__label">هذا الأسبوع</div></div>
      <div class="stat-card"><div class="stat-card__value">${monthTotal}</div><div class="stat-card__label">هذا الشهر</div></div>
    </div>
    <div class="bars" role="img" aria-label="إحصائيات آخر سبعة أيام">
      ${weekDays
        .map(
          (d) => `<div class="bars__col"><div class="bars__fill" style="height:${Math.round((d.value / maxDay) * 90) + 4}px"></div><div class="bars__label">${d.label}</div></div>`
        )
        .join("")}
    </div>

    <h1 class="section-title">المظهر</h1>
    <div class="settings-group">
      <div class="settings-row">
        <span class="settings-row__label">السمة</span>
        <div class="segmented" id="theme-seg" role="group" aria-label="السمة">
          ${Object.entries(THEME_LABELS)
            .map(([key, label]) => `<button data-value="${key}" aria-pressed="${s.theme === key}">${label}</button>`)
            .join("")}
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row__label">حجم الخط</span>
        <div class="segmented" id="fontsize-seg" role="group" aria-label="حجم الخط">
          ${Object.entries(FONT_SIZE_LABELS)
            .map(([key, label]) => `<button data-value="${key}" aria-pressed="${s.fontSize === key}">${label}</button>`)
            .join("")}
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row__label">نوع الخط</span>
        <select class="select-native" id="font-family-select" aria-label="نوع الخط">
          ${Object.entries(FONT_FAMILY_LABELS)
            .map(([key, label]) => `<option value="${key}" ${s.fontFamily === key ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <h1 class="section-title">التفاعل</h1>
    <div class="settings-group">
      <div class="settings-row">
        <div>
          <div class="settings-row__label">الاهتزاز عند الضغط</div>
        </div>
        <button class="switch" id="vibration-switch" aria-pressed="${s.vibration}" aria-label="الاهتزاز"></button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row__label">الصوت عند الضغط</div>
        </div>
        <button class="switch" id="sound-switch" aria-pressed="${s.sound}" aria-label="الصوت"></button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row__label">إظهار التشكيل</div>
          <div class="settings-row__desc">إخفاؤه يزيل علامات التشكيل من نص الأذكار فقط للعرض</div>
        </div>
        <button class="switch" id="tashkeel-switch" aria-pressed="${s.tashkeel}" aria-label="التشكيل"></button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row__label">إبقاء الشاشة مضيئة</div>
          <div class="settings-row__desc">${isWakeLockSupported() ? "أثناء عدّ الأذكار" : "غير مدعوم في هذا المتصفح"}</div>
        </div>
        <button class="switch" id="wakelock-switch" aria-pressed="${s.keepAwake}" aria-label="إبقاء الشاشة مضيئة" ${isWakeLockSupported() ? "" : "disabled"}></button>
      </div>
    </div>

    <h1 class="section-title">البيانات</h1>
    <div class="settings-group">
      <div class="settings-row">
        <div>
          <div class="settings-row__label">إعادة تعيين تقدم اليوم</div>
          <div class="settings-row__desc">يمسح ما تم إنجازه اليوم فقط، ولا يمسّ ملفات البيانات</div>
        </div>
        <button class="secondary-btn" id="reset-btn">إعادة تعيين</button>
      </div>
    </div>

    <p style="text-align:center;color:var(--color-text-muted);font-size:0.75rem;margin-top:var(--space-6)">أنس - UNS</p>
  `;

  outlet.querySelector("#theme-seg").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    updateSettings({ theme: btn.dataset.value });
    applyTheme();
    outlet.querySelectorAll("#theme-seg button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
  });

  outlet.querySelector("#fontsize-seg").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    updateSettings({ fontSize: btn.dataset.value });
    applyTheme();
    outlet.querySelectorAll("#fontsize-seg button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
  });

  outlet.querySelector("#font-family-select").addEventListener("change", (e) => {
    updateSettings({ fontFamily: e.target.value });
    applyTheme();
  });

  function wireSwitch(id, settingKey, onChange) {
    const btn = outlet.querySelector(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(next));
      updateSettings({ [settingKey]: next });
      if (onChange) onChange(next);
    });
  }

  wireSwitch("#vibration-switch", "vibration");
  wireSwitch("#sound-switch", "sound");
  wireSwitch("#tashkeel-switch", "tashkeel");
  wireSwitch("#wakelock-switch", "keepAwake", (enabled) => setWakeLock(enabled));

  outlet.querySelector("#reset-btn").addEventListener("click", () => {
    resetDailyProgress();
    showToast("تمت إعادة تعيين تقدم اليوم");
    renderSettings(params, outlet);
  });
}
