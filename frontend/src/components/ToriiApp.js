import { h, svg } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * Technical Hub × Torii — the whole of Torii told inside one slide, laid out like an app.
 *
 * A white bar across the top carries the two marks, the app's own navigation and two
 * buttons; under it one view at a time, each sliding in over a soft frosted ground:
 *
 *   Home      — the partnership announcement as the hero picture in a floating glass card,
 *               a search-style pill that jumps to any part of Torii, a strip of figures and a
 *               carousel of the services under the MoU with the middle card lit in gold.
 *   Trainings — every programme as a card: its number, its name, its modules.
 *   AI Lab    — the 24/7 Claude lab in photographs, its story and the certified team.
 *   Campus    — NT Square, Project Week, Project Street, Torii Connect, Events, the
 *               workspace: each a card whose photographs open in a viewer.
 *   Products  — the platforms Torii builds and runs.
 *   Partners  — AI partners, the platforms Torii is tied up with, the colleges that trust it
 *               and the MoUs it holds.
 *
 * The brand film opens over everything from the bar. Deck Next / Prev walk the views in
 * order before they turn the slide.
 */

const src = (p) => (p ? media(`/uploads/${String(p).split('/').map(encodeURIComponent).join('/')}`) : '');
const pad = (n) => String(n).padStart(2, '0');
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const VIEWS = [
  ['home', 'Home', 'sparkles'],
  ['trainings', 'Trainings', 'graduation'],
  ['lab', 'AI Lab', 'chip'],
  ['campus', 'Campus', 'building'],
  ['products', 'Products', 'cube'],
  ['partners', 'Partners', 'partners'],
];

export function ToriiApp(block, { editing = false } = {}) {
  const c = block.content || {};
  const root = h('div', { class: 'ta-root ph-root' });
  let view = 'home';

  /* --------------------------------------------------------------- the bar */
  const navBtns = VIEWS.map(([key, label, ic]) => h('button', {
    class: 'ta-nav__btn', type: 'button', 'data-view': key, onclick: () => go(key),
  }, icon(ic, { class: 'ic ic--xs' }), label));
  const bar = h('header', { class: 'ta-bar' },
    h('div', { class: 'ta-lockup' },
      c.lockup?.left ? h('img', { src: src(c.lockup.left), alt: 'Technical Hub' }) : null,
      h('span', { class: 'ta-x' }, '×'),
      c.lockup?.right ? h('span', { class: 'ta-lockup__dark' }, h('img', { src: src(c.lockup.right), alt: 'Torii Minds' })) : null),
    h('nav', { class: 'ta-nav' }, ...navBtns),
    h('div', { class: 'ta-bar__end' },
      c.film ? h('button', { class: 'ta-btn ta-btn--ghost', type: 'button', onclick: () => openFilm() }, icon('play', { class: 'ic ic--xs' }), 'Brand film') : null,
      h('button', { class: 'ta-btn', type: 'button', onclick: () => openViewer(c.hero?.mouTitle || 'The MoU', (c.hero?.mouImages || [c.hero?.image]).filter(Boolean), 0) },
        icon('handshake-check', { class: 'ic ic--xs' }), 'MoU')));

  /* -------------------------------------------------------------- home */
  const hero = c.hero || {};
  const phrases = (hero.search || []).filter(Boolean);
  const typed = h('span', { class: 'ta-search__typed' });
  const searchChips = (hero.jumps || []).map((j) => h('button', { class: 'ta-chip', type: 'button', onclick: () => go(j.view) },
    icon(j.icon || 'arrow-right', { class: 'ic ic--xs' }), j.label));
  if (phrases.length && !REDUCED) {
    let p = 0;
    let ch = 0;
    let dir = 1;
    let seen = false;
    // Stops itself once the slide has been shown and then taken off the page.
    const tick = () => {
      if (!root.isConnected) { if (seen) return; } else seen = true;
      const word = phrases[p];
      ch += dir;
      typed.textContent = word.slice(0, ch);
      let wait = dir > 0 ? 70 : 32;
      if (dir > 0 && ch >= word.length) { dir = -1; wait = 1800; }
      else if (dir < 0 && ch <= 0) { dir = 1; p = (p + 1) % phrases.length; wait = 400; }
      setTimeout(tick, wait);
    };
    tick();
  } else typed.textContent = phrases[0] || '';

  const stats = (c.stats || []).map((s) => h('li', {}, h('span', { class: 'ta-stat__ic' }, icon(s.icon || 'check', { class: 'ic ic--xs' })),
    h('span', {}, h('b', {}, s.value), ` ${s.label || ''}`)));

  /* The MoU's services: three cards in view, the middle one lit; they step on their own. */
  const services = (c.services?.items || []);
  let sv = 0;
  const svTrack = h('div', { class: 'ta-feat__track' });
  const svCard = (s, k) => h('article', { class: 'ta-feat__card', 'data-k': String(k) },
    h('span', { class: 'ta-feat__tag' }, s.tag || 'MoU'),
    h('span', { class: 'ta-feat__ic' }, icon(s.icon || 'sparkles', { class: 'ic' })),
    h('b', {}, s.title),
    s.body ? h('small', {}, s.body) : null,
    h('span', { class: 'ta-feat__num' }, pad(k + 1)));
  const paintServices = () => {
    if (!services.length) return;
    const n = services.length;
    svTrack.replaceChildren(...[-1, 0, 1, 2].map((d) => {
      const k = (sv + d + n) % n;
      const el = svCard(services[k], k);
      if (d === 0) el.classList.add('is-lit');
      if (d === 2) el.classList.add('is-edge');
      return el;
    }));
    svTrack.classList.remove('is-step'); void svTrack.offsetWidth; svTrack.classList.add('is-step');
  };
  const svAuto = autoSlide(() => { sv = (sv + 1) % Math.max(1, services.length); paintServices(); }, {
    host: root, interval: 3600, canRun: () => view === 'home',
  });
  const svStep = (d) => { sv = (sv + d + services.length) % services.length; paintServices(); svAuto.reset(); };

  const home = h('section', { class: 'ta-view ta-view--home', 'data-view': 'home' },
    h('div', { class: 'ta-hero' },
      h('div', { class: 'ta-hero__copy' },
        h('h2', { class: 'ta-title' }, ...(hero.title || ['Technical Hub', '× Torii Minds']).map((l, i) => h('span', { class: i ? 'ta-title__accent' : '' }, l))),
        hero.line ? h('p', { class: 'ta-hero__line' }, h('i'), hero.line) : null,
        h('div', { class: 'ta-search' },
          icon('search', { class: 'ic ic--sm' }),
          h('span', { class: 'ta-search__label' }, hero.searchLabel || 'Explore Torii —', ' ', typed, h('span', { class: 'ta-search__caret' })),
          h('button', { class: 'ta-search__go', type: 'button', 'aria-label': 'Explore', onclick: () => go('trainings') }, icon('arrow-right', { class: 'ic ic--sm' }))),
        searchChips.length ? h('div', { class: 'ta-chips' }, ...searchChips) : null,
        h('div', { class: 'ta-hero__btns' },
          h('button', { class: 'ta-btn ta-btn--lg', type: 'button', onclick: () => go('trainings') }, hero.primary || 'Explore Torii', icon('arrow-right', { class: 'ic ic--xs' })),
          c.film ? h('button', { class: 'ta-btn ta-btn--lg ta-btn--ghost', type: 'button', onclick: () => openFilm() }, icon('play', { class: 'ic ic--xs' }), hero.secondary || 'Watch the film') : null)),
      h('div', { class: 'ta-hero__art' },
        h('span', { class: 'ta-blob ta-blob--a' }),
        h('span', { class: 'ta-blob ta-blob--b' }),
        hero.image ? h('figure', { class: 'ta-glass' }, h('img', { src: src(hero.image), alt: hero.imageAlt || 'Technical Hub × Torii partnership announcement' })) : null,
        ...(hero.floats || []).map((f, i) => h('span', { class: `ta-float ta-float--${i}` }, icon(f.icon || 'sparkles', { class: 'ic ic--xs' }), f.label)))),
    stats.length ? h('ul', { class: 'ta-stats' }, ...stats) : null,
    services.length ? h('div', { class: 'ta-feat' },
      h('div', { class: 'ta-feat__head' },
        h('h3', { class: 'ta-h3' }, c.services.title || 'Featured under the MoU'),
        c.services.sub ? h('p', {}, c.services.sub) : null),
      h('div', { class: 'ta-feat__row' },
        h('button', { class: 'ta-arrow', type: 'button', 'aria-label': 'Previous', onclick: () => svStep(-1) }, icon('chevron-left', { class: 'ic ic--sm' })),
        h('div', { class: 'ta-feat__win' }, svTrack),
        h('button', { class: 'ta-arrow', type: 'button', 'aria-label': 'Next', onclick: () => svStep(1) }, icon('chevron-right', { class: 'ic ic--sm' })))) : null);

  /* ---------------------------------------------------------- trainings
     Each programme is a quiet card: its name, one line on what it covers, how many modules,
     an arrow, and an abstract cluster of shapes in the card's own colour. The first card is
     set in the brand colour. The modules themselves open in a sheet from the card. */
  const tr = c.trainings || {};
  const TONES = ['#008638', '#d9a400', '#e2725b', '#7c5cd6', '#2f6fd6', '#159c94', '#e0832a', '#5b6b78'];
  const art = (k, tone) => {
    const id = `ta-st-${k}`;
    const lt = `color-mix(in srgb, ${tone} 38%, #ffffff)`;
    const dk = `color-mix(in srgb, ${tone} 75%, #000000)`;
    // Four arrangements of the same parts — a circle, a quarter round, an arch, a block —
    // so no two neighbours look alike.
    const sets = [
      [['circle', { cx: 92, cy: 30, r: 22, fill: lt }], ['path', { d: 'M40 100V48a52 52 0 0 1 52 52z', fill: tone }], ['rect', { x: 92, y: 58, width: 42, height: 42, rx: 6, fill: `url(#${id})` }], ['circle', { cx: 52, cy: 30, r: 12, fill: dk }]],
      [['path', { d: 'M30 100a40 40 0 0 1 80 0z', fill: tone }], ['circle', { cx: 112, cy: 40, r: 26, fill: `url(#${id})` }], ['rect', { x: 52, y: 22, width: 30, height: 30, rx: 15, fill: lt }], ['path', { d: 'M110 100V74h26v26z', fill: dk }]],
      [['rect', { x: 40, y: 50, width: 50, height: 50, rx: 8, fill: `url(#${id})` }], ['path', { d: 'M90 100V50a50 50 0 0 1 46 50z', fill: tone }], ['circle', { cx: 112, cy: 26, r: 18, fill: lt }], ['circle', { cx: 64, cy: 30, r: 14, fill: dk }]],
      [['circle', { cx: 70, cy: 64, r: 36, fill: tone }], ['path', { d: 'M106 100V40a30 30 0 0 1 30 30v30z', fill: `url(#${id})` }], ['rect', { x: 34, y: 14, width: 26, height: 26, rx: 6, fill: lt }], ['circle', { cx: 120, cy: 22, r: 10, fill: dk }]],
    ][k % 4];
    return svg('svg', { class: 'ta-track__art', viewBox: '0 0 140 100', 'aria-hidden': 'true' },
      svg('defs', {}, svg('pattern', { id, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' },
        svg('rect', { width: 7, height: 7, fill: lt }), svg('rect', { width: 3, height: 7, fill: tone }))),
      ...sets.map(([tag, attrs]) => svg(tag, attrs)));
  };

  const sheetTitle = h('h3', { class: 'ta-sheet__title' });
  const sheetBlurb = h('p', { class: 'ta-sheet__blurb' });
  const sheetList = h('ol', { class: 'ta-sheet__list' });
  const sheetCount = h('span', { class: 'ta-sheet__count' });
  const sheet = h('div', { class: 'ta-sheet', 'aria-hidden': 'true', onclick: (e) => { if (e.target === sheet) closeOverlays(); } },
    h('div', { class: 'ta-sheet__panel' },
      h('header', { class: 'ta-sheet__head' },
        h('div', {}, sheetCount, sheetTitle, sheetBlurb),
        h('button', { class: 'ta-arrow', type: 'button', 'aria-label': 'Close', onclick: () => closeOverlays() }, icon('close', { class: 'ic ic--sm' }))),
      sheetList));
  const openTrack = (t, tone) => {
    sheet.style.setProperty('--tone', tone);
    sheetCount.textContent = `${(t.topics || []).length} modules`;
    sheetTitle.textContent = t.name;
    sheetBlurb.textContent = t.blurb || '';
    sheetList.replaceChildren(...(t.topics || []).map((x, i) => h('li', { style: { '--i': String(i) } }, h('b', {}, pad(i + 1)), x)));
    root.classList.add('has-sheet');
    sheet.setAttribute('aria-hidden', 'false');
  };

  const trainings = h('section', { class: 'ta-view ta-view--grid', 'data-view': 'trainings' },
    head(tr.kicker || 'Trainings', tr.title || 'What Torii teaches', tr.lead),
    h('div', { class: 'ta-grid ta-grid--4' }, ...(tr.tracks || []).map((t, k) => {
      const tone = k === 0 ? 'var(--brand-primary, #008638)' : TONES[k % TONES.length];
      return h('button', {
        class: `ta-card ta-track${k === 0 ? ' is-lead' : ''}`, type: 'button', style: { '--k': String(k), '--tone': tone },
        onclick: () => openTrack(t, tone),
      },
        h('span', { class: 'ta-track__ic' }, icon(t.icon || 'book', { class: 'ic' })),
        h('b', { class: 'ta-card__title' }, t.name),
        t.blurb ? h('span', { class: 'ta-track__blurb' }, t.blurb) : null,
        h('span', { class: 'ta-track__foot' },
          h('span', { class: 'ta-track__go' }, icon('arrow-right', { class: 'ic ic--sm' })),
          h('span', { class: 'ta-track__count' }, `${(t.topics || []).length} modules`)),
        art(k, k === 0 ? '#ffffff' : TONES[k % TONES.length]));
    })));

  /* --------------------------------------------------------------- lab */
  const lab = c.lab || {};
  const labShots = (lab.photos || []).filter(Boolean);
  const labImgs = labShots.map((p, k) => h('img', { class: `ta-lab__img${k === 0 ? ' is-on' : ''}`, src: src(p), alt: '', loading: k < 2 ? 'eager' : 'lazy', draggable: 'false' }));
  let li = 0;
  const labDots = labShots.map((_, k) => h('i', { class: k === 0 ? 'is-on' : '' }));
  const labAuto = autoSlide(() => {
    if (!labImgs.length) return;
    labImgs[li].classList.remove('is-on'); labDots[li].classList.remove('is-on');
    li = (li + 1) % labImgs.length;
    labImgs[li].classList.add('is-on'); labDots[li].classList.add('is-on');
  }, { host: root, interval: 3800, canRun: () => view === 'lab' });
  const labView = h('section', { class: 'ta-view ta-view--lab', 'data-view': 'lab' },
    h('figure', { class: 'ta-lab__show' }, ...labImgs,
      h('figcaption', {}, h('span', { class: 'ta-live' }, h('i'), lab.live || 'Open 24/7'), h('span', { class: 'ta-lab__dots' }, ...labDots))),
    h('div', { class: 'ta-lab__copy' },
      h('span', { class: 'ta-kicker' }, lab.kicker || 'AI Lab'),
      h('h3', { class: 'ta-h2' }, lab.title || 'The 24/7 Claude AI Lab'),
      lab.lead ? h('p', { class: 'ta-lead' }, lab.lead) : null,
      lab.points?.length ? h('ul', { class: 'ta-ticks' }, ...lab.points.map((p) => h('li', {}, icon('check', { class: 'ic ic--xs', strokeWidth: 2.6 }), p))) : null,
      lab.stats?.length ? h('ul', { class: 'ta-minis' }, ...lab.stats.map((s) => h('li', {}, h('b', {}, s.value), h('small', {}, s.label)))) : null,
      lab.team ? h('button', { class: 'ta-teamcard', type: 'button', onclick: () => openViewer(lab.team.title, [lab.team.image], 0) },
        h('img', { src: src(lab.team.image), alt: '' }),
        h('span', {}, h('b', {}, lab.team.title), h('small', {}, lab.team.body || ''),
          h('span', { class: 'ta-tags' }, ...(lab.team.tags || []).map((t) => h('em', {}, t))))) : null));

  /* ------------------------------------------------------------- campus */
  const cp = c.campus || {};
  const campus = h('section', { class: 'ta-view ta-view--grid', 'data-view': 'campus' },
    head(cp.kicker || 'Campus life', cp.title || 'Where Torii happens', cp.lead),
    h('div', { class: 'ta-grid ta-grid--3' }, ...(cp.items || []).map((it, k) => h('button', {
      class: 'ta-card ta-place', type: 'button', style: { '--k': String(k) },
      onclick: () => openViewer(it.title, it.photos || [it.cover], 0),
    },
      h('span', { class: 'ta-place__cover' },
        h('img', { src: src(it.cover), alt: '', loading: 'lazy' }),
        h('span', { class: 'ta-badge ta-badge--on' }, icon('image', { class: 'ic ic--xs' }), String((it.photos || []).length)),
        it.logo ? h('span', { class: 'ta-place__logo' }, h('img', { src: src(it.logo), alt: '' })) : null),
      h('span', { class: 'ta-place__text' },
        h('b', { class: 'ta-card__title' }, it.title),
        it.tag ? h('small', { class: 'ta-card__meta' }, it.tag) : null,
        it.body ? h('span', { class: 'ta-place__body' }, it.body) : null),
      h('span', { class: 'ta-place__go' }, 'Open gallery', icon('arrow-right', { class: 'ic ic--xs' }))))));

  /* ----------------------------------------------------------- products */
  const pr = c.products || {};
  const products = h('section', { class: 'ta-view ta-view--grid', 'data-view': 'products' },
    head(pr.kicker || 'Products', pr.title || 'Built and run by Torii', pr.lead),
    h('div', { class: 'ta-grid ta-grid--4' }, ...(pr.items || []).map((p, k) => h('article', { class: 'ta-card ta-product', style: { '--k': String(k) } },
      h('span', { class: 'ta-product__head' },
        h('span', { class: 'ta-product__logo' }, p.logo ? h('img', { src: src(p.logo), alt: p.name }) : icon('cube', { class: 'ic' })),
        h('span', {}, h('b', { class: 'ta-card__title' }, p.name), p.tag ? h('small', { class: 'ta-card__meta' }, p.tag) : null)),
      p.description ? h('span', { class: 'ta-product__desc' }, p.description) : null,
      p.features?.length ? h('ul', { class: 'ta-topics' }, ...p.features.slice(0, 2).map((f) => h('li', {}, f))) : null,
      p.stack?.length ? h('span', { class: 'ta-tags' }, ...p.stack.map((t) => h('em', {}, t))) : null))));

  /* ----------------------------------------------------------- partners */
  const pa = c.partners || {};
  const partners = h('section', { class: 'ta-view ta-view--partners', 'data-view': 'partners' },
    head(pa.kicker || 'Partners', pa.title || 'Who Torii builds with', pa.lead),
    h('div', { class: 'ta-pa' },
      h('div', { class: 'ta-pa__col' },
        h('h4', { class: 'ta-h4' }, pa.aiTitle || 'AI partners'),
        ...(pa.ai || []).map((a) => h('article', { class: 'ta-card ta-ai' },
          h('span', { class: 'ta-ai__logo' }, h('img', { src: src(a.logo), alt: a.name })),
          h('span', {}, h('b', {}, a.name), h('small', {}, a.tier), a.note ? h('span', { class: 'ta-ai__note' }, a.note) : null)))),
      h('div', { class: 'ta-pa__col' },
        h('h4', { class: 'ta-h4' }, pa.coeTitle || 'Tied up with'),
        h('div', { class: 'ta-cloud' }, ...(pa.coe || []).map((x) => h('span', {}, x))),
        h('h4', { class: 'ta-h4' }, pa.trustTitle || 'Trusted by'),
        h('div', { class: 'ta-logos' }, ...(pa.trusted || []).map((t) => h('span', { title: t.name }, h('img', { src: src(t.logo), alt: t.name, loading: 'lazy' }))))),
      h('div', { class: 'ta-pa__col' },
        h('h4', { class: 'ta-h4' }, pa.mouTitle || 'MoUs signed'),
        h('div', { class: 'ta-mous' }, ...(pa.mous || []).map((m, k) => h('button', {
          class: 'ta-mou', type: 'button', onclick: () => openViewer(m.name, (pa.mous || []).map((x) => x.image), k),
        }, h('img', { src: src(m.image), alt: '', loading: 'lazy' }), h('span', {}, h('b', {}, m.name), m.kind ? h('small', {}, m.kind) : null)))))));

  function head(kicker, title, lead) {
    return h('header', { class: 'ta-head' },
      h('span', { class: 'ta-kicker' }, kicker),
      h('h3', { class: 'ta-h2' }, title),
      lead ? h('p', { class: 'ta-lead' }, lead) : null);
  }

  /* ------------------------------------------------- the viewer, the film */
  const vImg = h('img', { class: 'ta-viewer__img', alt: '' });
  const vTitle = h('b');
  const vCount = h('span');
  const vThumbs = h('div', { class: 'ta-viewer__thumbs' });
  let vList = [];
  let vAt = 0;
  const vShow = (k) => {
    if (!vList.length) return;
    vAt = (k + vList.length) % vList.length;
    vImg.src = src(vList[vAt]);
    vImg.classList.remove('is-in'); void vImg.offsetWidth; vImg.classList.add('is-in');
    vCount.textContent = `${pad(vAt + 1)} / ${pad(vList.length)}`;
    [...vThumbs.children].forEach((t, i) => t.classList.toggle('is-on', i === vAt));
    vThumbs.children[vAt]?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  };
  const vAuto = autoSlide(() => vShow(vAt + 1), { host: root, interval: 3500, canRun: () => root.classList.contains('has-viewer') && vList.length > 1 });
  const viewer = h('div', { class: 'ta-viewer', 'aria-hidden': 'true' },
    h('div', { class: 'ta-viewer__bar' },
      h('button', { class: 'ta-btn ta-btn--ghost', type: 'button', onclick: () => closeOverlays() }, icon('chevron-left', { class: 'ic ic--xs' }), 'Back'),
      vTitle, vCount,
      h('span', { class: 'ta-viewer__nav' },
        h('button', { class: 'ta-arrow', type: 'button', 'aria-label': 'Previous', onclick: () => { vShow(vAt - 1); vAuto.reset(); } }, icon('chevron-left', { class: 'ic ic--sm' })),
        h('button', { class: 'ta-arrow', type: 'button', 'aria-label': 'Next', onclick: () => { vShow(vAt + 1); vAuto.reset(); } }, icon('chevron-right', { class: 'ic ic--sm' })))),
    h('div', { class: 'ta-viewer__stage' }, vImg),
    vThumbs);
  function openViewer(title, list, k) {
    vList = (list || []).filter(Boolean);
    if (!vList.length) return;
    vTitle.textContent = title || '';
    vThumbs.replaceChildren(...vList.map((p, i) => h('button', { type: 'button', onclick: () => { vShow(i); vAuto.reset(); } }, h('img', { src: src(p), alt: '', loading: 'lazy' }))));
    vThumbs.hidden = vList.length < 2;
    root.classList.add('has-viewer');
    viewer.setAttribute('aria-hidden', 'false');
    vShow(k || 0);
    vAuto.reset();
  }

  const film = c.film ? h('video', { class: 'ta-film__video', src: src(c.film), controls: true, playsinline: true, preload: 'none' }) : null;
  const filmLayer = film ? h('div', { class: 'ta-film', 'aria-hidden': 'true' },
    h('button', { class: 'ta-btn ta-btn--ghost ta-film__back', type: 'button', onclick: () => closeOverlays() }, icon('chevron-left', { class: 'ic ic--xs' }), 'Back'),
    film) : null;
  function openFilm() {
    if (!film) return;
    root.classList.add('has-film');
    filmLayer.setAttribute('aria-hidden', 'false');
    film.currentTime = 0;
    film.play?.()?.catch?.(() => { film.muted = true; film.play?.()?.catch?.(() => {}); });
  }
  function closeOverlays() {
    root.classList.remove('has-viewer', 'has-film', 'has-sheet');
    sheet.setAttribute('aria-hidden', 'true');
    viewer.setAttribute('aria-hidden', 'true');
    filmLayer?.setAttribute('aria-hidden', 'true');
    film?.pause?.();
  }

  /* ------------------------------------------------------------ assembly */
  const views = [home, trainings, labView, campus, products, partners];
  root.append(
    h('div', { class: 'ta-ground', 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
    bar,
    h('div', { class: 'ta-views' }, ...views),
    viewer,
    sheet,
    filmLayer);

  function go(key) {
    if (!VIEWS.some(([k]) => k === key)) return;
    closeOverlays();
    view = key;
    root.dataset.view = key;
    navBtns.forEach((b) => b.classList.toggle('is-on', b.dataset.view === key));
    views.forEach((v) => {
      const on = v.dataset.view === key;
      v.classList.toggle('is-on', on);
      if (on) { v.classList.remove('is-in'); void v.offsetWidth; v.classList.add('is-in'); }
    });
    if (key === 'home') { paintServices(); svAuto.reset(); }
    if (key === 'lab') labAuto.reset();
  }

  if (!editing) {
    registerStepper((delta) => {
      if (root.classList.contains('has-viewer') || root.classList.contains('has-film') || root.classList.contains('has-sheet')) { closeOverlays(); return true; }
      const i = VIEWS.findIndex(([k]) => k === view);
      const j = i + delta;
      if (j < 0 || j >= VIEWS.length) return false;
      go(VIEWS[j][0]);
      return true;
    });
    svAuto.start();
    labAuto.start();
    vAuto.start();
  }

  paintServices();
  go('home');
  return root;
}
