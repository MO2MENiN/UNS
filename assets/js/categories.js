/**
 * categories.js
 * Static metadata describing every Adhkar category:
 * id (matches /data/<id>.json), Arabic display name, and an icon key
 * used to look up an inline SVG in icons.js.
 */
export const CATEGORIES = [
  { id: "morning-adhkar",       name: "أذكار الصباح",                 icon: "sun" },
  { id: "evening-adhkar",       name: "أذكار المساء",                 icon: "moon" },
  { id: "wake-up-adhkar",       name: "أذكار الإستيقاظ من النوم",     icon: "sunrise" },
  { id: "sleep-adhkar",         name: "أذكار النوم",                  icon: "bed" },
  { id: "prayer-adhkar",        name: "أذكار الصلاة",                 icon: "mosque" },
  { id: "after-prayer-adhkar",  name: "أذكار بعد الصلاة",             icon: "check-circle" },
  { id: "wudu-adhkar",          name: "أذكار الوضوء",                 icon: "droplet" },
  { id: "mosque-adhkar",        name: "أذكار المسجد",                 icon: "mosque" },
  { id: "adhan-adhkar",         name: "أذكار عند سماع الأذان",        icon: "bell" },
  { id: "home-adhkar",          name: "أذكار دخول وخروج المنزل",      icon: "home" },
  { id: "toilet-adhkar",        name: "أذكار دخول وخروج الخلاء",      icon: "door" },
  { id: "food-adhkar",          name: "أذكار الطعام والشراب والضيف",  icon: "cup" },
  { id: "dead-prayers",         name: "أدعية الميت",                  icon: "leaf" },
  { id: "hajj-umrah-adhkar",    name: "أذكار الحج والعمرة",           icon: "kaaba" },
  { id: "tasbeeh",              name: "تسابيح",                       icon: "beads" },
  { id: "quran-completion-dua", name: "دعاء ختم القرآن",              icon: "book" },
  { id: "dua-virtues",          name: "فضل الدعاء",                   icon: "star" },
  { id: "dhikr-virtues",        name: "فضل الذكر",                    icon: "star" },
  { id: "surah-virtues",        name: "فضائل السور",                  icon: "book" },
];

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}
