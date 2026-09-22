// app.js — application bootstrap: loads data, renders screens, wires routes.
import { Router } from './router.js';
import { Storage } from './storage.js';
import { Counter } from './counter.js';
import { Tashkeel } from './tashkeel.js';
import { Favorites } from './favorites.js';
import { Search } from './search.js';
import { Settings } from './settings.js';
import { UI } from './ui.js';
import { Install } from './install.js';

const DATA_PATH = 'data/';

/** In-memory data store — loaded once, never re-fetched during the session. */
const store = {
  sections: [],
  sectionsById: new Map(),
  dhikrBySection: new Map(),
  ready: false
};

async function fetchJSON(path) {
  try {
    const res = await fetch(path, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[app] failed to load ${path}`, err);
    return [];
  }
}

async function loadAllData() {
  const sections = await fetchJSON(DATA_PATH + 'sections.json');
  store.sections = sections;
  sections.forEach((s) => store.sectionsById.set(s.id, s));

  const results = await Promise.all(
    sections.map((s) => fetchJSON(DATA_PATH + s.file))
  );
  sections.forEach((s, i) => {
    const list = (results[i] || []).filter((d) => d && d.id);
    store.dhikrBySection.set(s.id, list);
  });

  Search.buildIndex(sections, store.dhikrBySection);
  store.ready = true;
}

function getDhikr(sectionId, dhikrId) {
  const list = store.dhikrBySection.get(sectionId) || [];
  return list.find((d) => d.id === dhikrId) || null;
}

function presentText(text) {
  const tashkeelOn = Storage.getSettings().tashkeel;
  return tashkeelOn ? text : Tashkeel.stripTashkeel(text);
}

// The toggle button shows the mode a tap will switch *to*: a sun while it's currently
// dark (tap for day), a crescent while it's currently light (tap for night).
function resolvedThemeIcon() {
  const resolved = document.documentElement.getAttribute('data-theme');
  return resolved === 'dark' ? 'sun' : 'moon';
}

/* -------------------------------------------------------------------- */
/* Screen: Home                                                         */
/* -------------------------------------------------------------------- */

function renderHome() {
  UI.showHomeHeader();
  UI.setActiveTab('home');
  const view = document.getElementById('view');

  const last = Storage.getLastState();
  let continueBlock = '';
  if (last && store.sectionsById.has(last.sectionId) && getDhikr(last.sectionId, last.dhikrId)) {
    const section = store.sectionsById.get(last.sectionId);
    const dhikr = getDhikr(last.sectionId, last.dhikrId);
    const count = Counter.getCount(last.sectionId, last.dhikrId);
    const pct = Math.min(100, Math.round((count / dhikr.count) * 100));
    continueBlock = `
      <a class="continue-card" href="/dhikr/${last.sectionId}/${last.dhikrId}" data-route-link>
        <span class="continue-card__icon">${UI.icon('clock')}</span>
        <span class="continue-card__body">
          <p class="continue-card__label">متابعة من حيث توقفت — ${UI.escapeHTML(section.title)}</p>
          <p class="continue-card__title">${UI.escapeHTML(dhikr.title) || 'ذكر بدون عنوان'}</p>
          <span class="continue-card__progress"><span style="width:${pct}%"></span></span>
        </span>
      </a>`;
  }

  const favResolved = Favorites.resolve(store.sectionsById, store.dhikrBySection).slice(0, 10);
  const favBlock = favResolved.length ? `
    <div class="section-label"><h2>المفضلة</h2>
      <a href="/favorites" data-route-link style="font-size:0.78rem;color:var(--color-primary-2);font-weight:700;">عرض الكل</a>
    </div>
    <div class="fav-strip">
      ${favResolved.map(({ section, dhikr }) => `
        <a class="card card--pressable fav-chip" href="/dhikr/${section.id}/${dhikr.id}" data-route-link>
          <span class="fav-chip__title">${UI.escapeHTML(dhikr.title) || 'ذكر بدون عنوان'}</span>
          <span class="fav-chip__section">${UI.escapeHTML(section.title)}</span>
        </a>`).join('')}
    </div>` : '';

  view.innerHTML = `
    <div class="container">
      ${continueBlock}
      ${favBlock}

      <div class="section-label"><h2>الأقسام</h2></div>
      <div class="sections-list" id="sectionsList"></div>
    </div>
  `;

  const list = document.getElementById('sectionsList');
  if (!store.sections.length) {
    list.innerHTML = UI.emptyState('empty', 'تعذر تحميل الأقسام.');
  } else {
    list.innerHTML = store.sections.map((s) => {
      const items = store.dhikrBySection.get(s.id) || [];
      return `
        <a class="card card--pressable section-row" href="/section/${s.id}" data-route-link>
          <span class="section-row__icon">${UI.icon(s.icon || 'star')}</span>
          <span class="section-row__body">
            <p class="section-row__title">${UI.escapeHTML(s.title)}</p>
            <p class="section-row__count">${items.length ? `${items.length} ذكر` : 'لا يوجد محتوى بعد'}</p>
          </span>
          ${UI.icon('back', 'section-row__chevron')}
        </a>`;
    }).join('');
  }
}

// The sticky home header is static markup in index.html (not re-rendered per visit),
// so its listeners are wired once at bootstrap rather than inside renderHome().
function wireHomeHeader() {
  const themeBtn = document.getElementById('themeToggleBtn');
  themeBtn.innerHTML = UI.icon(resolvedThemeIcon());
  themeBtn.addEventListener('click', () => {
    const resolved = document.documentElement.getAttribute('data-theme');
    const next = resolved === 'dark' ? 'light' : 'dark';
    Settings.set('theme', next);
    themeBtn.innerHTML = UI.icon(resolvedThemeIcon());
  });

  const searchInput = document.getElementById('homeSearchInput');
  searchInput.addEventListener('focus', () => Router.navigate('/search'));
}

/* -------------------------------------------------------------------- */
/* Screen: Section                                                      */
/* -------------------------------------------------------------------- */

function dhikrListMarkup(items, sectionId) {
  if (!items.length) {
    return UI.emptyState('empty', 'لا توجد أذكار مضافة بعد.');
  }
  return `<ul class="dhikr-list">
    ${items.map((d, i) => {
      const isFav = Favorites.has(sectionId, d.id);
      const count = Counter.getCount(sectionId, d.id);
      const done = count >= d.count;
      return `
      <li class="dhikr-item-wrap">
        <div class="card card--pressable dhikr-item">
          <span class="dhikr-item__index ${done ? 'is-done' : ''}">${done ? UI.icon('check') : i + 1}</span>
          <span class="dhikr-item__body">
            <p class="dhikr-item__title">${UI.escapeHTML(d.title) || 'ذكر بدون عنوان'}</p>
            <p class="dhikr-item__excerpt">${UI.escapeHTML(UI.escapeForExcerpt(presentText(d.text || '')))}</p>
          </span>
          <span class="dhikr-item__meta">
            <span class="dhikr-item__count">${d.count}</span>
            <button class="fav-btn ${isFav ? 'is-active' : ''}" data-fav-toggle data-section="${sectionId}" data-dhikr="${d.id}" aria-label="إضافة للمفضلة">
              ${UI.icon(isFav ? 'star-fill' : 'star')}
            </button>
          </span>
        </div>
        <a class="dhikr-item__stretch-link" href="/dhikr/${sectionId}/${d.id}" data-route-link aria-label="${UI.escapeHTML(d.title) || 'فتح الذكر'}"></a>
      </li>`;
    }).join('')}
  </ul>`;
}

function wireFavButtons(container) {
  container.querySelectorAll('[data-fav-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { section, dhikr } = btn.dataset;
      const active = Favorites.toggle(section, dhikr);
      btn.classList.toggle('is-active', active);
      btn.innerHTML = UI.icon(active ? 'star-fill' : 'star');
      UI.toast(active ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
    });
  });
}

function renderSection({ id }) {
  const section = store.sectionsById.get(id);
  const view = document.getElementById('view');

  if (!section) {
    UI.showHeader({ title: 'القسم غير موجود', showBack: true });
    view.innerHTML = `<div class="container">${UI.emptyState('empty', 'هذا القسم غير متاح.')}</div>`;
    return;
  }

  UI.showHeader({ title: section.title, showBack: true });
  UI.setActiveTab('');

  const items = store.dhikrBySection.get(id) || [];
  view.innerHTML = `
    <div class="container">
      ${section.description ? `<p class="section-intro">${UI.escapeHTML(section.description)}</p>` : ''}
      ${dhikrListMarkup(items, id)}
    </div>`;

  wireFavButtons(view);
}

/* -------------------------------------------------------------------- */
/* Screen: Dhikr full view                                              */
/* -------------------------------------------------------------------- */

function renderDhikr({ sectionId, dhikrId }) {
  const section = store.sectionsById.get(sectionId);
  const items = store.dhikrBySection.get(sectionId) || [];
  const index = items.findIndex((d) => d.id === dhikrId);
  const dhikr = index >= 0 ? items[index] : null;
  const view = document.getElementById('view');

  if (!section || !dhikr) {
    UI.showHeader({ title: 'غير موجود', showBack: true });
    view.innerHTML = `<div class="container">${UI.emptyState('empty', 'هذا الذكر لم يعد متاحًا.')}</div>`;
    return;
  }

  Storage.setLastState(sectionId, dhikrId);
  UI.showHeader({ title: section.title, showBack: true });
  UI.setActiveTab('');

  const target = Math.max(1, dhikr.count || 1);
  let count = Counter.getCount(sectionId, dhikrId);
  let tashkeelOn = Storage.getSettings().tashkeel;
  const isFav = () => Favorites.has(sectionId, dhikrId);

  view.innerHTML = `
    <div class="container dhikr-view">
      <div class="dhikr-view__top">
        <div class="dhikr-progress">
          <span class="dhikr-progress__track"><span id="progressBar"></span></span>
          <span id="progressLabel"></span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn--icon ${tashkeelOn ? 'is-active' : ''}" id="tashkeelBtn" aria-label="${tashkeelOn ? 'إخفاء التشكيل' : 'إظهار التشكيل'}">${UI.icon(tashkeelOn ? 'tashkeel' : 'tashkeel-off')}</button>
          <button class="btn btn--icon ${isFav() ? 'is-active' : ''}" id="favBtn" aria-label="إضافة للمفضلة">${UI.icon(isFav() ? 'star-fill' : 'star')}</button>
        </div>
      </div>

      <p class="dhikr-title" id="dhikrTitle"></p>

      <div class="dhikr-text-wrap">
        <p class="dhikr-text" id="dhikrText"></p>
      </div>

      <div class="dhikr-complete-banner" id="completeBanner">${UI.icon('check')}<span>تم إكمال هذا الذكر</span></div>

      <div class="dhikr-controls">
        <div class="dhikr-counter-ring" id="counterRing">
          <button class="dhikr-counter-btn" id="counterBtn" aria-label="اضغط للعد">
            <span class="dhikr-counter-btn__num" id="counterNum"></span>
            <span class="dhikr-counter-btn__target" id="counterTarget"></span>
          </button>
        </div>
        <div class="dhikr-secondary-row">
          <button class="btn btn--ghost" id="decrementBtn">${UI.icon('minus')} إنقاص</button>
          <button class="btn btn--ghost" id="resetBtn">${UI.icon('reset')} إعادة تعيين</button>
        </div>
      </div>

      <div class="dhikr-nav-row">
        <button class="btn btn--outline" id="prevBtn">${UI.icon('next')} السابق</button>
        <button class="btn btn--outline" id="nextBtn">التالي ${UI.icon('back')}</button>
      </div>
    </div>
  `;

  function refresh() {
    document.getElementById('dhikrTitle').textContent = dhikr.title || '';
    document.getElementById('dhikrText').textContent = presentText(dhikr.text || '') || '—';
    document.getElementById('counterNum').textContent = String(count);
    document.getElementById('counterTarget').textContent = `من ${target}`;
    document.getElementById('progressLabel').textContent = `${count} / ${target}`;
    const pct = Math.min(1, count / target);
    document.getElementById('progressBar').style.width = `${Math.round(pct * 100)}%`;
    document.getElementById('counterRing').style.setProperty('--dhikr-progress', pct);

    const counterBtn = document.getElementById('counterBtn');
    const complete = count >= target;
    counterBtn.classList.toggle('is-complete', complete);
    document.getElementById('completeBanner').classList.toggle('is-visible', complete);

    document.getElementById('prevBtn').disabled = index <= 0;
    document.getElementById('nextBtn').disabled = index >= items.length - 1;
  }

  document.getElementById('counterBtn').addEventListener('click', () => {
    const { count: newCount, justCompleted } = Counter.increment(sectionId, dhikrId, target);
    count = newCount;
    const btn = document.getElementById('counterBtn');
    btn.classList.remove('pulse');
    void btn.offsetWidth; // restart animation
    btn.classList.add('pulse');
    Settings.vibrate(justCompleted ? [15, 40, 15] : 12);
    refresh();
    if (justCompleted && Storage.getSettings().autoNext && index < items.length - 1) {
      setTimeout(() => Router.navigate(`/dhikr/${sectionId}/${items[index + 1].id}`), 480);
    }
  });

  document.getElementById('decrementBtn').addEventListener('click', () => {
    count = Counter.decrement(sectionId, dhikrId);
    refresh();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    count = Counter.reset(sectionId, dhikrId);
    refresh();
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (index > 0) Router.navigate(`/dhikr/${sectionId}/${items[index - 1].id}`);
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (index < items.length - 1) Router.navigate(`/dhikr/${sectionId}/${items[index + 1].id}`);
  });

  document.getElementById('tashkeelBtn').addEventListener('click', () => {
    tashkeelOn = !tashkeelOn;
    Settings.set('tashkeel', tashkeelOn);
    const btn = document.getElementById('tashkeelBtn');
    btn.classList.toggle('is-active', tashkeelOn);
    btn.innerHTML = UI.icon(tashkeelOn ? 'tashkeel' : 'tashkeel-off');
    btn.setAttribute('aria-label', tashkeelOn ? 'إخفاء التشكيل' : 'إظهار التشكيل');
    refresh();
  });

  document.getElementById('favBtn').addEventListener('click', () => {
    const active = Favorites.toggle(sectionId, dhikrId);
    const btn = document.getElementById('favBtn');
    btn.classList.toggle('is-active', active);
    btn.innerHTML = UI.icon(active ? 'star-fill' : 'star');
    UI.toast(active ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
  });

  refresh();
}

/* -------------------------------------------------------------------- */
/* Screen: Favorites                                                    */
/* -------------------------------------------------------------------- */

function renderFavorites() {
  UI.showHeader({ title: 'المفضلة', showBack: false });
  UI.setActiveTab('favorites');
  const view = document.getElementById('view');
  const resolved = Favorites.resolve(store.sectionsById, store.dhikrBySection);

  if (!resolved.length) {
    view.innerHTML = `<div class="container">${UI.emptyState('empty', 'لم تُضِف أي ذكر إلى المفضلة بعد.')}</div>`;
    return;
  }

  view.innerHTML = `
    <div class="container">
      <ul class="dhikr-list">
        ${resolved.map(({ section, dhikr }) => `
          <li class="dhikr-item-wrap">
            <div class="card card--pressable dhikr-item">
              <span class="dhikr-item__index">${UI.icon('star-fill')}</span>
              <span class="dhikr-item__body">
                <p class="dhikr-item__title">${UI.escapeHTML(dhikr.title) || 'ذكر بدون عنوان'}<span class="dhikr-item__section-tag">— ${UI.escapeHTML(section.title)}</span></p>
                <p class="dhikr-item__excerpt">${UI.escapeHTML(UI.escapeForExcerpt(presentText(dhikr.text || '')))}</p>
              </span>
              <span class="dhikr-item__meta">
                <button class="fav-btn is-active" data-fav-toggle data-section="${section.id}" data-dhikr="${dhikr.id}" aria-label="إزالة من المفضلة">${UI.icon('star-fill')}</button>
              </span>
            </div>
            <a class="dhikr-item__stretch-link" href="/dhikr/${section.id}/${dhikr.id}" data-route-link aria-label="${UI.escapeHTML(dhikr.title) || 'فتح الذكر'}"></a>
          </li>`).join('')}
      </ul>
    </div>`;

  view.querySelectorAll('[data-fav-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Favorites.toggle(btn.dataset.section, btn.dataset.dhikr);
      renderFavorites();
    });
  });
}

/* -------------------------------------------------------------------- */
/* Screen: Search                                                       */
/* -------------------------------------------------------------------- */

function renderSearch() {
  UI.showHeader({ title: 'البحث', showBack: true });
  UI.setActiveTab('');
  const view = document.getElementById('view');
  view.innerHTML = `
    <div class="container">
      <div class="search-field">
        ${UI.icon('search')}
        <input type="search" id="searchInput" placeholder="ابحث في الأذكار والأدعية…" autofocus />
      </div>
      <div id="searchResults" style="margin-top:16px;"></div>
    </div>`;

  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  function runSearch() {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = UI.emptyState('search', 'ابدأ الكتابة للبحث في جميع الأذكار.');
      return;
    }
    const matches = Search.query(q);
    if (!matches.length) {
      results.innerHTML = UI.emptyState('empty', `لا توجد نتائج مطابقة لـ "${q}".`);
      return;
    }
    results.innerHTML = `<ul class="dhikr-list">
      ${matches.map((m) => `
        <li>
          <a class="card card--pressable dhikr-item" href="/dhikr/${m.sectionId}/${m.dhikrId}" data-route-link>
            <span class="dhikr-item__index">${UI.icon('search')}</span>
            <span class="dhikr-item__body">
              <p class="dhikr-item__title">${UI.escapeHTML(m.title) || 'ذكر بدون عنوان'}<span class="dhikr-item__section-tag">— ${UI.escapeHTML(m.sectionTitle)}</span></p>
              <p class="dhikr-item__excerpt">${UI.escapeHTML(UI.escapeForExcerpt(presentText(m.text || '')))}</p>
            </span>
          </a>
        </li>`).join('')}
    </ul>`;
  }

  input.addEventListener('input', runSearch);
  runSearch();
}

/* -------------------------------------------------------------------- */
/* Screen: Settings                                                     */
/* -------------------------------------------------------------------- */

function renderSettings() {
  UI.showHeader({ title: 'الإعدادات', showBack: false });
  UI.setActiveTab('settings');
  const view = document.getElementById('view');
  const s = Settings.get();

  const themeOptions = [
    ['light', 'فاتح', 'sun'], ['dark', 'داكن', 'moon'], ['system', 'تلقائي', 'theme-auto']
  ];
  const fontOptions = [
    ['sm', 'صغير', 13], ['md', 'متوسط', 16], ['lg', 'كبير', 19], ['xl', 'أكبر', 22]
  ];

  view.innerHTML = `
    <div class="container">
      <div class="settings-group">
        <p class="settings-group__title">المظهر</p>
        <div class="settings-list">
          <div class="settings-row settings-row--stack">
            <div class="settings-row__label"><span>السمة</span></div>
            <div class="segmented" id="themeSeg">
              ${themeOptions.map(([v, l, ic]) => `<button data-value="${v}" class="${s.theme === v ? 'is-active' : ''}">${UI.icon(ic)}<span>${l}</span></button>`).join('')}
            </div>
          </div>
          <div class="settings-row settings-row--stack">
            <div class="settings-row__label"><span>حجم الخط</span></div>
            <div class="segmented" id="fontSeg">
              ${fontOptions.map(([v, l, size]) => `<button data-value="${v}" class="${s.fontSize === v ? 'is-active' : ''}"><svg class="icon" style="width:${size}px;height:${size}px" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-text-size"></use></svg><span>${l}</span></button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <p class="settings-group__title">القراءة والتسبيح</p>
        <div class="settings-list">
          <div class="settings-row">
            <div class="settings-row__label"><span>${UI.icon(s.tashkeel ? 'tashkeel' : 'tashkeel-off')} التشكيل الافتراضي</span><span class="settings-row__hint">إظهار التشكيل عند فتح الأذكار</span></div>
            <button class="switch ${s.tashkeel ? 'is-on' : ''}" id="tashkeelSwitch" role="switch" aria-checked="${s.tashkeel}"></button>
          </div>
          <div class="settings-row">
            <div class="settings-row__label"><span>${UI.icon('fast-forward')} الانتقال التلقائي</span><span class="settings-row__hint">الانتقال للذكر التالي عند الاكتمال</span></div>
            <button class="switch ${s.autoNext ? 'is-on' : ''}" id="autoNextSwitch" role="switch" aria-checked="${s.autoNext}"></button>
          </div>
          <div class="settings-row">
            <div class="settings-row__label"><span>${UI.icon('vibration')} الاهتزاز</span><span class="settings-row__hint">اهتزاز خفيف عند العد</span></div>
            <button class="switch ${s.vibration ? 'is-on' : ''}" id="vibrationSwitch" role="switch" aria-checked="${s.vibration}"></button>
          </div>
        </div>
      </div>

      ${installSectionMarkup()}

      <div class="settings-group">
        <p class="settings-group__title">البيانات</p>
        <div class="settings-list">
          <button class="settings-row settings-row--danger" id="resetProgressBtn" style="width:100%;text-align:start;">
            <div class="settings-row__label"><span>تصفير كل العدادات</span><span class="settings-row__hint">لا يؤثر على المفضلة أو الإعدادات</span></div>
            ${UI.icon('reset')}
          </button>
        </div>
      </div>

      <p class="app-about">أنس - UNS · يعمل بالكامل بدون إنترنت</p>
    </div>`;

  document.getElementById('themeSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    Settings.set('theme', btn.dataset.value);
    renderSettings();
  });
  document.getElementById('fontSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    Settings.set('fontSize', btn.dataset.value);
    renderSettings();
  });
  document.getElementById('tashkeelSwitch').addEventListener('click', () => {
    Settings.set('tashkeel', !Settings.get().tashkeel);
    renderSettings();
  });
  document.getElementById('autoNextSwitch').addEventListener('click', () => {
    Settings.set('autoNext', !Settings.get().autoNext);
    renderSettings();
  });
  document.getElementById('vibrationSwitch').addEventListener('click', () => {
    Settings.set('vibration', !Settings.get().vibration);
    renderSettings();
  });
  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    Storage.resetAllProgress();
    UI.toast('تم تصفير جميع العدادات');
  });
  wireInstallSection();
}

function installSectionMarkup() {
  if (Install.isStandalone()) {
    return `
      <div class="settings-group">
        <p class="settings-group__title">التثبيت</p>
        <div class="settings-list">
          <div class="settings-row">
            <div class="settings-row__label"><span>${UI.icon('check')} التطبيق مثبّت</span><span class="settings-row__hint">يعمل الآن كتطبيق مستقل بدون إنترنت</span></div>
          </div>
        </div>
      </div>`;
  }

  if (Install.canPromptInstall()) {
    const androidStyle = Install.isAndroid();
    return `
      <div class="settings-group">
        <p class="settings-group__title">التثبيت</p>
        <div class="settings-list">
          <button class="settings-row" id="installBtn" style="width:100%;text-align:start;">
            <div class="settings-row__label"><span>${UI.icon(androidStyle ? 'android' : 'download')} ${androidStyle ? 'ثبّت التطبيق على أندرويد' : 'ثبّت التطبيق'}</span><span class="settings-row__hint">للوصول السريع والعمل بدون إنترنت</span></div>
          </button>
        </div>
      </div>`;
  }

  if (Install.isIOS()) {
    return `
      <div class="settings-group">
        <p class="settings-group__title">التثبيت</p>
        <div class="settings-list">
          <div class="settings-row">
            <div class="settings-row__label"><span>${UI.icon('apple')} التثبيت على iOS</span><span class="settings-row__hint">اضغط ${UI.icon('share')} زر المشاركة في Safari، ثم اختر "إضافة إلى الشاشة الرئيسية"</span></div>
          </div>
        </div>
      </div>`;
  }

  return '';
}

function wireInstallSection() {
  const btn = document.getElementById('installBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const outcome = await Install.promptInstall();
    if (outcome === 'accepted') UI.toast('جارٍ تثبيت التطبيق…');
    else if (outcome === 'dismissed') UI.toast('يمكنك تثبيت التطبيق لاحقًا من هنا');
  });
}

/* -------------------------------------------------------------------- */
/* Bootstrap                                                            */
/* -------------------------------------------------------------------- */

function wireHeaderBack() {
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      Router.navigate('/');
    }
  });
}

function registerRoutes() {
  Router.on('/', renderHome);
  Router.on('/section/:id', renderSection);
  Router.on('/dhikr/:sectionId/:dhikrId', renderDhikr);
  Router.on('/favorites', renderFavorites);
  Router.on('/search', renderSearch);
  Router.on('/settings', renderSettings);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register(Router.BASE_PATH + 'service-worker.js');
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'activated') {
          UI.toast('التطبيق جاهز للعمل بدون إنترنت');
        }
      });
    });
  } catch (err) {
    console.warn('[app] service worker registration failed', err);
  }
}

async function bootstrap() {
  Settings.applyAll();
  Settings.watchSystemTheme();
  Storage.applyDailyResetIfNeeded();

  wireHeaderBack();
  wireHomeHeader();
  registerRoutes();
  await loadAllData();
  Router.start();

  registerServiceWorker();

  Install.init(() => {
    const settingsTab = document.querySelector('.tabbar__item[data-route="settings"]');
    if (settingsTab && settingsTab.classList.contains('is-active')) renderSettings();
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
