/**
 * hijri.js
 * Hijri (Islamic) date formatting. Prefers the browser's built-in
 * Intl calendar support (islamic-umalqura) and falls back to a
 * pure-JS tabular Islamic calendar algorithm when unsupported —
 * so the app works fully offline on any engine.
 */

const HIJRI_MONTHS = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

function supportsIslamicCalendar() {
  try {
    const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { day: "numeric" });
    return !!fmt.format(new Date());
  } catch {
    return false;
  }
}

const HAS_INTL_ISLAMIC = supportsIslamicCalendar();

/** Civil (tabular) Islamic calendar fallback — Julian day based. */
function gregorianToHijriFallback(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) +
    (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l =
    l -
    (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) +
    29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  return { day: hDay, month: hMonth, year: hYear };
}

/**
 * Returns { day, monthName, year, weekday } for the given (or current) date.
 */
export function getHijriDate(date = new Date()) {
  if (HAS_INTL_ISLAMIC) {
    try {
      const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }).formatToParts(date);
      const map = {};
      for (const p of parts) map[p.type] = p.value;
      const monthIndex = parseInt(map.month, 10) - 1;
      return {
        day: parseInt(map.day, 10),
        monthName: HIJRI_MONTHS[monthIndex] || map.month,
        year: parseInt(map.year, 10),
      };
    } catch {
      /* fall through to manual algorithm */
    }
  }
  const { day, month, year } = gregorianToHijriFallback(date);
  return { day, monthName: HIJRI_MONTHS[month - 1] || "", year };
}

export function formatHijri(date = new Date()) {
  const h = getHijriDate(date);
  return `${h.day} ${h.monthName} ${h.year}هـ`;
}

export function formatGregorian(date = new Date()) {
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export function formatWeekday(date = new Date()) {
  return date.toLocaleDateString("ar-EG", { weekday: "long" });
}
