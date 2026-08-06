/**
 * tashkeel.js
 * Strips Arabic diacritical marks (tashkeel) dynamically at render
 * time. The JSON data itself is never modified.
 */

// Fatha, Damma, Kasra, Sukoon, Tanween, Shadda, Maddah, small alef, etc.
const TASHKEEL_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;

export function stripTashkeel(text) {
  if (!text) return text;
  return text.replace(TASHKEEL_REGEX, "");
}

/**
 * Renders text respecting the current tashkeel setting.
 * @param {string} text
 * @param {boolean} keepTashkeel
 */
export function renderText(text, keepTashkeel) {
  return keepTashkeel ? text : stripTashkeel(text);
}
