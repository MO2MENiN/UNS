// search.js — offline, in-memory search across sections and dhikr items.
import { Tashkeel } from './tashkeel.js';

let entries = []; // { sectionId, sectionTitle, dhikrId, title, text, normTitle, normText, normSectionTitle }

function buildIndex(sections, dhikrIndexBySection) {
  entries = [];
  for (const section of sections) {
    const list = dhikrIndexBySection.get(section.id) || [];
    const normSectionTitle = Tashkeel.normalizeArabic(section.title);
    for (const dhikr of list) {
      entries.push({
        sectionId: section.id,
        sectionTitle: section.title,
        dhikrId: dhikr.id,
        title: dhikr.title,
        text: dhikr.text,
        normTitle: Tashkeel.normalizeArabic(dhikr.title),
        normText: Tashkeel.normalizeArabic(dhikr.text),
        normSectionTitle
      });
    }
  }
}

function query(rawQuery, limit = 40) {
  const q = Tashkeel.normalizeArabic(rawQuery || '');
  if (!q) return [];
  const results = [];
  for (const entry of entries) {
    if (
      entry.normTitle.includes(q) ||
      entry.normText.includes(q) ||
      entry.normSectionTitle.includes(q)
    ) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export const Search = { buildIndex, query };
