/**
 * icons.js
 * Small inline SVG icon set (stroke-based, currentColor) so the app
 * needs zero external icon-font requests and stays fully offline.
 */
const ICONS = {
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  moon: `<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>`,
  sunrise: `<path d="M12 2v6M4.9 10.9l1.4 1.4M17.7 12.3l1.4-1.4M2 18h2M20 18h2M6 18a6 6 0 0 1 12 0"/><path d="M2 22h20"/>`,
  bed: `<path d="M2 20v-7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v7"/><path d="M2 17h20"/><path d="M6 10V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v4"/>`,
  mosque: `<path d="M3 21h18"/><path d="M5 21V11l7-6 7 6v10"/><path d="M12 3v2"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/>`,
  "check-circle": `<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>`,
  droplet: `<path d="M12 2s7 8.2 7 12.5a7 7 0 0 1-14 0C5 10.2 12 2 12 2Z"/>`,
  bell: `<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 21a2 2 0 0 0 4 0"/>`,
  home: `<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>`,
  door: `<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="14.5" cy="12" r="0.6" fill="currentColor" stroke="none"/>`,
  cup: `<path d="M4 3h13v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V3Z"/><path d="M17 6h2a2 2 0 0 1 0 8h-1"/><path d="M4 21h13"/>`,
  leaf: `<path d="M21 3c0 10-7 17-17 17C4 10 11 3 21 3Z"/><path d="M4 20 21 3"/>`,
  kaaba: `<rect x="4" y="4" width="16" height="16"/><path d="M4 9h16M4 4l16 16"/>`,
  beads: `<circle cx="12" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="14" r="2"/><circle cx="16" cy="19" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="4" cy="14" r="2"/><circle cx="6" cy="8" r="2"/>`,
  book: `<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M4 4.5v17"/>`,
  star: `<path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9-6.3-3.3-6.3 3.3 1.2-6.9-5-4.9 7-1Z"/>`,
  heart: `<path d="M12 21s-7.5-4.9-10-9.4C.4 8.1 2.2 4.5 6 4c2.1-.3 4 .8 6 3.2C14 4.8 15.9 3.7 18 4c3.8.5 5.6 4.1 4 7.6C19.5 16.1 12 21 12 21Z"/>`,
  "heart-outline": `<path d="M12 21s-7.5-4.9-10-9.4C.4 8.1 2.2 4.5 6 4c2.1-.3 4 .8 6 3.2C14 4.8 15.9 3.7 18 4c3.8.5 5.6 4.1 4 7.6C19.5 16.1 12 21 12 21Z"/>`,
  search: `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z"/>`,
  home2: `<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 21v-6h6v6"/>`,
  chart: `<path d="M3 3v18h18"/><path d="M7 15v4M12 10v9M17 6v13"/>`,
  "chevron-back": `<path d="m15 6-6 6 6 6"/>`,
  "chevron-forward": `<path d="m9 6 6 6-6 6"/>`,
  share: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-3.9M8.6 13.5l6.8 3.9"/>`,
  copy: `<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
  x: `<path d="M18 6 6 18M6 6l12 12"/>`,
  refresh: `<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>`,
};

/**
 * Returns an inline <svg> string for a given icon key.
 * @param {string} key
 * @param {number} size
 */
export function icon(key, size = 22) {
  const body = ICONS[key] || ICONS.star;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
