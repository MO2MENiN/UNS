// tashkeel.js — strips Arabic diacritics for presentation only.
// Never mutates the original text stored in JSON.

// Arabic diacritics + tatweel range used for presentation stripping.
const TASHKEEL_PATTERN = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0670\u08D4-\u08E1\u08E3-\u08FF\u0640]/g;

function stripTashkeel(text) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(TASHKEEL_PATTERN, '');
}

// Normalizes Arabic text for search: removes tashkeel + unifies common letter variants.
function normalizeArabic(text) {
  if (typeof text !== 'string' || !text) return '';
  return stripTashkeel(text)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ أ إ ٱ -> ا
    .replace(/\u0629/g, '\u0647')                     // ة -> ه
    .replace(/\u0649/g, '\u064A')                     // ى -> ي
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export const Tashkeel = { stripTashkeel, normalizeArabic };
