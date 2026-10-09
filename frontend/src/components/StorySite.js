import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * Stories Published — the success stories Technical Hub, NCET and Torii Minds have put out about
 * their work with Claude, all inside one slide.
 *
 * `story-hub` is that slide: the three stories as tall cards, and each card opens its story in
 * place — no pages of its own in the navigation. A story is a white bar carrying the partners'
 * marks, a way back to the cards and the story's chapters, and under it one chapter at a time.
 * A chapter is one of a few shapes —
 *
 *   cover    the headline, the figures the story publishes, and a mosaic of its photographs
 *   split    the words on one side, a run of photographs on the other
 *   cards    a row of cards that share the height: streams, services, apps, modules
 *   people   portraits, with what the people do beside them
 *   steps    a numbered path drawn across the page, photographs or voices under it
 *   gallery  a mosaic whose tiles turn over through every photograph in turn
 *   compare  before and after
 *
 * The deck walks it all on its own — the cards, then every chapter of each story in turn — and
 * Next / Prev step through the same path while paused. Every figure is the one the published
 * story gives; none is added here.
 */

const src = (p) => (p ? media(`/uploads/${String(p).split('/').map(encodeURIComponent).join('/')}`) : '');
const pad = (n) => String(n).padStart(2, '0');
const REDUCED = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

function pic(path, { cls = '', alt = '', fit = '' } = {}) {
  const im = h('img', {
    src: src(path), alt, decoding: 'async', loading: 'eager',
    class: `${cls}${fit ? ` is-${fit}` : ''}`,
    onerror: (e) => e.currentTarget.classList.add('is-gone'),
  });
  return im;
}

function countUp(el, value, ms = 1300) {
  const m = String(value).match(/^(\D*)(\d[\d,]*)(.*)$/);
  if (!m || REDUCED()) { el.textContent = value; return; }
  const target = Number(m[2].replace(/,/g, ''));
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = `${m[1]}${Math.round(target * (1 - (1 - k) ** 3)).toLocaleString('en-IN')}${m[3]}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const stat = (s, i) => h('div', { class: 'ss-stat', style: { '--i': String(i) } },
  h('b', { class: 'ss-num', 'data-v': s.n }, s.n),
  h('span', {}, s.label));

const head = (c, { side = null } = {}) => h('header', { class: 'ss-head' },
  h('div', { class: 'ss-head__main' },
    c.eyebrow ? h('p', { class: 'ss-eyebrow' }, c.eyebrow) : null,
    c.title ? h('h2', { class: 'ss-title' }, c.title) : null),
  c.intro ? h('p', { class: 'ss-intro' }, c.intro) : side);

/* ------------------------------------------------------------------ a run of photographs */
function reel(images, host, { fit = 'cover', label = '' } = {}) {
  const list = (images || []).filter((x) => x && (x.src || typeof x === 'string')).map((x) => (typeof x === 'string' ? { src: x } : x));
  /* A picture shown whole (a screen, a wide road map) sits on a softened copy of itself, so the
     frame is filled with its own colours rather than a band of white. */
  const frames = list.map((im, i) => {
    const whole = (im.fit || fit) === 'contain';
    return h('figure', { class: `ss-reel__frame${i ? '' : ' is-on'}${whole ? ' is-whole' : ''}` },
      whole ? pic(im.src, { cls: 'ss-reel__back', alt: '' }) : null,
      pic(im.src, { alt: im.cap || '', fit: whole ? 'contain' : '' }));
  });
  const cap = h('figcaption', { class: 'ss-reel__cap' }, list[0]?.cap || '');
  const pips = list.length > 1 ? h('div', { class: 'ss-reel__pips' },
    ...list.map((_, i) => h('button', { type: 'button', class: `ss-pip${i ? '' : ' is-on'}`, 'aria-label': `Photo ${i + 1}`, onclick: (e) => { e.stopPropagation(); show(i); timer.reset(); } }))) : null;
  let at = 0;
  const show = (i) => {
    at = (i + list.length) % list.length;
    frames.forEach((f, k) => f.classList.toggle('is-on', k === at));
    pips?.querySelectorAll('.ss-pip').forEach((p, k) => p.classList.toggle('is-on', k === at));
    cap.textContent = list[at]?.cap || '';
    cap.classList.toggle('is-empty', !list[at]?.cap);
    cap.classList.remove('is-in'); void cap.offsetWidth; cap.classList.add('is-in');
  };
  const timer = autoSlide(() => show(at + 1), { host, interval: 5000, canRun: () => host.classList.contains('is-on') && list.length > 1 });
  if (list.length > 1) timer.start();
  cap.classList.toggle('is-empty', !list[0]?.cap);
  return h('div', { class: `ss-reel${label ? ' has-label' : ''}` },
    ...frames,
    label ? h('span', { class: 'ss-reel__label' }, label) : null,
    h('div', { class: 'ss-reel__foot' }, cap, pips));
}

/* ------------------------------------------------------------------ chapter shapes */
const SHAPES = {
  cover(c, view, story) {
    const imgs = c.images || [];
    return h('div', { class: 'ss-cover' },
      h('div', { class: 'ss-cover__text' },
        c.kicker ? h('p', { class: 'ss-kicker' }, h('i'), c.kicker) : null,
        h('h1', { class: 'ss-cover__title' }, c.title, c.titleEm ? h('em', {}, ` ${c.titleEm}`) : null),
        c.lede ? h('p', { class: 'ss-cover__lede' }, c.lede) : null,
        c.facts?.length ? h('dl', { class: 'ss-facts' }, ...c.facts.map((f) => h('div', {}, h('dt', {}, f.k), h('dd', {}, f.v)))) : null,
        c.stats?.length ? h('div', { class: 'ss-stats', style: { '--n': String(c.stats.length) } }, ...c.stats.map(stat)) : null,
        story.url ? h('p', { class: 'ss-source' }, icon('globe', { class: 'ic ic--xs' }), 'Published at', h('b', {}, story.url)) : null),
      h('div', { class: 'ss-cover__art' },
        imgs[0] ? h('figure', { class: 'ss-cover__main' }, pic(imgs[0], { alt: story.title || '' })) : null,
        imgs[1] ? h('figure', { class: 'ss-cover__a' }, pic(imgs[1])) : null,
        imgs[2] ? h('figure', { class: 'ss-cover__b' }, pic(imgs[2])) : null,
        c.badge ? h('span', { class: 'ss-cover__badge' }, icon(c.badgeIcon || 'sparkles', { class: 'ic ic--xs' }), c.badge) : null));
  },

  split(c, view) {
    const words = h('div', { class: 'ss-split__text' },
      c.eyebrow ? h('p', { class: 'ss-eyebrow' }, c.eyebrow) : null,
      c.title ? h('h2', { class: 'ss-title' }, c.title) : null,
      ...(c.body || []).map((p) => h('p', { class: 'ss-body' }, p)),
      c.points?.length ? h('ul', { class: `ss-points${c.points.length > 4 ? ' is-two' : ''}` },
        ...c.points.map((p, i) => h('li', { style: { '--i': String(i) } }, icon('check', { class: 'ic ic--xs' }), p))) : null,
      c.tiles?.length ? h('div', { class: 'ss-tiles', style: { '--n': String(c.tiles.length) } },
        ...c.tiles.map((t, i) => h('div', { class: 'ss-tile', style: { '--i': String(i) } },
          t.n ? h('b', { class: 'ss-num', 'data-v': t.n }, t.n) : icon(t.icon || 'sparkles', { class: 'ic' }),
          h('strong', {}, t.title), t.text ? h('span', {}, t.text) : null))) : null,
      c.chips?.length ? h('div', { class: 'ss-chips' }, ...c.chips.map((x) => h('span', {}, x))) : null,
      c.quote ? h('blockquote', { class: 'ss-quote' }, icon('quote', { class: 'ic' }), h('p', {}, c.quote.text), c.quote.by ? h('cite', {}, c.quote.by) : null) : null);
    return h('div', { class: `ss-split${c.flip ? ' is-flip' : ''}${c.wide ? ' is-wide' : ''}` },
      words, reel(c.images, view, { fit: c.fit, label: c.reelLabel }));
  },

  cards(c, view) {
    const cards = (c.cards || []).map((d, i) => h('article', {
      class: `ss-card${d.image ? ' has-img' : ''}`,
      style: { '--i': String(i) },
    },
      d.image ? h('figure', { class: 'ss-card__img' }, pic(d.image, { alt: d.title, fit: d.fit || c.fit || '' }), d.tag ? h('span', { class: 'ss-card__tag' }, d.tag) : null) : null,
      /* A card with an icon and no picture carries the icon once more, large and faint, in the corner. */
      !d.image && d.icon && !d.n ? h('span', { class: 'ss-card__ghost', 'aria-hidden': 'true' }, icon(d.icon, { class: 'ic' })) : null,
      h('div', { class: 'ss-card__body' },
        d.logo ? h('span', { class: 'ss-card__logo' }, pic(d.logo, { alt: d.title })) : null,
        !d.image && (d.icon || d.n) ? h('span', { class: 'ss-card__mark' }, d.n ? h('b', {}, d.n) : icon(d.icon, { class: 'ic' })) : null,
        !d.image && d.tag ? h('span', { class: 'ss-card__kicker' }, d.tag) : null,
        h('h3', { class: 'ss-card__title' }, d.title),
        d.text ? h('p', { class: 'ss-card__text' }, d.text) : null,
        d.stats?.length ? h('div', { class: 'ss-card__stats' }, ...d.stats.map((s) => h('div', {}, h('b', { class: 'ss-num', 'data-v': s.n }, s.n), h('span', {}, s.label)))) : null,
        d.points?.length ? h('ul', { class: 'ss-card__points' }, ...d.points.map((p) => h('li', {}, p))) : null,
        d.foot ? h('span', { class: 'ss-card__foot' }, d.foot) : null)));
    const strip = c.images?.length
      ? h('div', { class: 'ss-strip', style: { '--n': String(c.images.length) } }, ...c.images.map((im, i) => h('figure', { style: { '--i': String(i + cards.length) } },
          pic(im.src || im, { alt: im.cap || '' }), im.cap ? h('figcaption', {}, im.cap) : null)))
      : null;
    return h('div', { class: `ss-cards-view${strip ? ' has-strip' : ''}` },
      head(c),
      h('div', { class: 'ss-cards', style: { '--cols': String(c.cols || Math.min(4, cards.length)) } }, ...cards),
      strip,
      c.note ? h('p', { class: 'ss-note' }, icon('sparkles', { class: 'ic ic--xs' }), c.note) : null);
  },

  people(c, view) {
    const people = (c.people || []).map((p, i) => h('figure', { class: 'ss-person', style: { '--i': String(i) } },
      h('div', { class: 'ss-person__photo' }, pic(p.photo, { alt: p.name })),
      h('figcaption', {},
        c.numbered ? h('span', { class: 'ss-person__n' }, pad(i + 1)) : null,
        h('b', {}, p.name), p.role ? h('span', {}, p.role) : null)));
    const side = c.side ? h('aside', { class: 'ss-people__side' },
      c.side.image ? h('figure', { class: 'ss-people__badge' }, pic(c.side.image, { fit: 'contain' })) : null,
      c.side.text ? h('p', { class: 'ss-body' }, c.side.text) : null,
      ...(c.side.cards || []).map((d, i) => h('div', { class: 'ss-mini', style: { '--i': String(i) } },
        h('span', { class: 'ss-mini__ic' }, icon(d.icon || 'check', { class: 'ic' })),
        h('div', {}, h('strong', {}, d.title), h('span', {}, d.text))))) : null;
    return h('div', { class: 'ss-people-view' },
      head(c),
      h('div', { class: `ss-people${side ? ' has-side' : ''}` },
        h('div', { class: 'ss-people__grid', style: { '--cols': String(c.cols || people.length) } }, ...people),
        side));
  },

  steps(c, view) {
    const steps = (c.steps || []).map((s, i) => h('li', { class: 'ss-step', style: { '--i': String(i) } },
      h('span', { class: 'ss-step__n' }, pad(i + 1)),
      h('strong', {}, s.title), s.text ? h('span', {}, s.text) : null));
    const under = c.images?.length
      ? h('div', { class: 'ss-strip', style: { '--n': String(c.images.length) } }, ...c.images.map((im, i) => h('figure', { style: { '--i': String(i) } },
          pic(im.src || im, { alt: im.cap || '' }), im.cap ? h('figcaption', {}, im.cap) : null)))
      : c.quotes?.length
        ? h('div', { class: 'ss-voices', style: { '--n': String(c.quotes.length) } }, ...c.quotes.map((q, i) => h('blockquote', { style: { '--i': String(i) } },
            icon('quote', { class: 'ic' }), h('p', {}, q.text), q.by ? h('cite', {}, q.by) : null)))
        : null;
    return h('div', { class: 'ss-steps-view' },
      head(c),
      h('ol', { class: 'ss-steps', style: { '--n': String(steps.length) } }, h('i', { class: 'ss-steps__line' }), ...steps),
      under);
  },

  gallery(c, view) {
    const pool = (c.photos || []).map((x) => (typeof x === 'string' ? { src: x } : x));
    const N = Math.min(pool.length, c.tiles || 6);
    const tiles = pool.slice(0, N).map((p, i) => h('figure', { class: `ss-mosaic__tile ss-mosaic__tile--${i}`, style: { '--i': String(i) } },
      pic(p.src, { alt: p.cap || '' }),
      h('figcaption', {}, p.tag ? h('em', {}, p.tag) : null, h('span', {}, p.cap || ''))));
    let next = N;
    let turn = 0;
    /* One tile at a time takes the next photograph, so every picture in the set comes round. */
    const swap = () => {
      if (pool.length <= N) { tiles.forEach((t) => t.classList.remove('is-lit')); tiles[turn % N]?.classList.add('is-lit'); turn += 1; return; }
      const t = tiles[turn % N];
      const p = pool[next % pool.length];
      const old = t.querySelector('img');
      const im = pic(p.src, { alt: p.cap || '', cls: 'is-new' });
      t.insertBefore(im, old.nextSibling);
      t.querySelector('figcaption').replaceChildren(p.tag ? h('em', {}, p.tag) : '', h('span', {}, p.cap || ''));
      setTimeout(() => old.remove(), 1200);
      next += 1; turn += 1;
    };
    const timer = autoSlide(swap, { host: view, interval: 5000, canRun: () => view.classList.contains('is-on') });
    timer.start();
    return h('div', { class: 'ss-gallery-view' },
      head(c),
      h('div', { class: `ss-mosaic ss-mosaic--${N}` }, ...tiles));
  },

  compare(c, view) {
    const col = (side, cls) => h('div', { class: `ss-compare__col ${cls}` },
      h('p', { class: 'ss-compare__label' }, h('b', {}, side.label), side.sub ? h('span', {}, side.sub) : null),
      h('ul', {}, ...(side.items || []).map((x, i) => h('li', { style: { '--i': String(i) } }, icon(cls === 'is-after' ? 'check' : 'close', { class: 'ic ic--xs' }), x))));
    return h('div', { class: 'ss-compare-view' },
      head(c),
      h('div', { class: 'ss-compare' },
        col(c.before, 'is-before'),
        h('span', { class: 'ss-compare__arrow' }, icon('arrow-right', { class: 'ic' })),
        col(c.after, 'is-after'),
        c.image ? h('figure', { class: 'ss-compare__img' }, pic(c.image.src || c.image, { alt: c.image.cap || '' }), c.image.cap ? h('figcaption', {}, c.image.cap) : null) : null));
  },
};

/* ------------------------------------------------------------------ one story */
/**
 * One story. On its own it registers with the deck; opened from the landing (`onBack` given) it
 * leaves the stepping to the landing, which walks every story in turn, and carries a way back
 * to the cards at the left of its bar.
 */
export function StorySite(block, { onBack = null } = {}) {
  const c = block.content || {};
  const chapters = (c.chapters || []).filter((x) => SHAPES[x.kind]);
  const root = h('div', { class: 'ss-root ph-root' });
  let cur = 0;

  const views = chapters.map((ch) => {
    const view = h('section', { class: `ss-view ss-view--${ch.kind}` });
    view.appendChild(SHAPES[ch.kind](ch, view, c));
    return view;
  });

  const tabs = chapters.map((ch, i) => h('button', {
    class: 'ss-tab', type: 'button', onclick: () => go(i),
  }, icon(ch.icon || 'dot', { class: 'ic ic--xs' }), h('span', {}, ch.label)));
  const ink = h('i', { class: 'ss-tabs__ink' });
  const count = h('span', { class: 'ss-count' });

  const bar = h('header', { class: `ss-bar${chapters.length > 8 ? ' is-dense' : ''}` },
    h('div', { class: 'ss-lockup' },
      onBack ? h('button', { class: 'ss-back', type: 'button', onclick: onBack, 'aria-label': 'Back to all stories' },
        icon('chevron-left', { class: 'ic ic--xs' }), 'All stories') : null,
      ...(c.logos || []).flatMap((l, i) => [i ? h('span', { class: 'ss-x' }, '×') : null,
        h('span', { class: `ss-logo${l.dark ? ' is-dark' : ''}` }, pic(l.src, { alt: l.alt || '' }))]).filter(Boolean)),
    h('nav', { class: 'ss-tabs' }, ink, ...tabs),
    h('div', { class: 'ss-bar__end' }, count));

  const placeInk = () => {
    const t = tabs[cur];
    if (!t || !t.offsetWidth) return;
    ink.style.width = `${t.offsetWidth}px`;
    ink.style.transform = `translateX(${t.offsetLeft}px)`;
  };

  function go(i, dir = i >= cur ? 1 : -1) {
    if (i < 0 || i >= views.length) return;
    cur = i;
    views.forEach((v, k) => {
      v.classList.toggle('is-on', k === cur);
      v.classList.remove('is-in-next', 'is-in-prev');
    });
    tabs.forEach((t, k) => t.classList.toggle('is-on', k === cur));
    const v = views[cur];
    if (!REDUCED()) { void v.offsetWidth; v.classList.add(dir < 0 ? 'is-in-prev' : 'is-in-next'); }
    v.querySelectorAll('.ss-num').forEach((el) => countUp(el, el.dataset.v));
    count.textContent = `${pad(cur + 1)} / ${pad(views.length)}`;
    placeInk();
  }

  root.append(bar, h('div', { class: 'ss-stage' }, ...views));
  requestAnimationFrame(() => { go(0); requestAnimationFrame(placeInk); });
  window.addEventListener('resize', placeInk);

  /* A fuller chapter holds a little longer — never under the deck's even five. */
  const holdFor = () => {
    const ch = chapters[cur] || {};
    const n = (ch.cards || ch.people || ch.steps || ch.points || ch.photos || []).length;
    return ch.hold || Math.min(9000, 6500 + n * 220);
  };
  const step = (dir) => {
    const n = cur + dir;
    if (n < 0 || n >= views.length) return false;
    go(n, dir);
    return true;
  };
  if (!onBack) registerStepper(step, { auto: holdFor });

  Object.assign(root, { step, holdFor, go, size: views.length });
  return root;
}

/* ------------------------------------------------------------------ the landing */
/**
 * The three stories as cards, each with its partner's mark in a round badge at the corner. A
 * card opens its story over the landing, in the same slide; "All stories" brings the cards back.
 * The deck's walk goes cards → every chapter of the first story → the next story → … and only
 * turns the slide once the last chapter of the last story is done.
 */
export function StoryHub(block) {
  const c = block.content || {};
  const stories = c.stories || [];
  const root = h('div', { class: 'sh-root ph-root' });
  let open = -1;
  let site = null;

  const cards = stories.map((s, i) => h('button', {
    class: 'sh-card', type: 'button', style: { '--i': String(i) },
    onclick: () => openStory(i),
  },
    h('figure', { class: 'sh-card__img' },
      pic(s.image, { alt: s.title }),
      h('span', { class: 'sh-card__n' }, pad(i + 1))),
    s.badge ? h('span', { class: 'sh-badge' }, pic(s.badge, { alt: s.badgeAlt || '' })) : null,
    h('div', { class: 'sh-card__body' },
      h('span', { class: 'sh-card__kind' }, s.kind),
      h('h3', { class: 'sh-card__title' }, s.title),
      h('p', { class: 'sh-card__text' }, s.text),
      h('div', { class: 'sh-card__stats' }, ...(s.stats || []).map((x) => h('div', {}, h('b', { class: 'ss-num', 'data-v': x.n }, x.n), h('span', {}, x.label)))),
      h('div', { class: 'sh-card__foot' },
        h('span', { class: 'sh-card__url' }, icon('globe', { class: 'ic ic--xs' }), s.url),
        h('span', { class: 'sh-card__go' }, 'Read the story', icon('arrow-right', { class: 'ic ic--xs' }))))));

  const landing = h('div', { class: 'sh-landing' },
    h('header', { class: 'sh-head' },
      h('div', {},
        c.kicker ? h('p', { class: 'ss-kicker' }, h('i'), c.kicker) : null,
        h('h2', { class: 'sh-title' }, c.title || 'Stories Published')),
      c.lede ? h('p', { class: 'sh-lede' }, c.lede) : null),
    h('div', { class: 'sh-cards', style: { '--n': String(cards.length) } }, ...cards));
  root.append(landing);

  const countAll = () => landing.querySelectorAll('.ss-num').forEach((el) => countUp(el, el.dataset.v, 1500));

  /* Opening a story builds it fresh; closing removes it, and its photo timers stop with it. */
  function openStory(i, { last = false } = {}) {
    site?.remove();
    open = i;
    site = StorySite({ content: stories[i].site || {} }, { onBack: closeStory });
    site.classList.add('sh-site');
    root.appendChild(site);
    root.classList.add('is-reading');
    if (last) requestAnimationFrame(() => requestAnimationFrame(() => site?.go(site.size - 1, -1)));
  }
  function closeStory() {
    site?.remove();
    site = null;
    open = -1;
    root.classList.remove('is-reading');
    countAll();
  }

  registerStepper((dir) => {
    if (open < 0) {
      if (dir > 0 && stories.length) { openStory(0); return true; }
      return false;
    }
    if (site.step(dir)) return true;
    if (dir > 0) {
      if (open + 1 < stories.length) { openStory(open + 1); return true; }
      return false;
    }
    if (open > 0) { openStory(open - 1, { last: true }); return true; }
    closeStory();
    return true;
  }, { auto: () => (open < 0 ? 7000 : site.holdFor()) });

  /* While the cards are showing, one is lit at a time, in turn. */
  let lit = -1;
  const light = (i) => { lit = i; cards.forEach((el, k) => el.classList.toggle('is-lit', k === lit)); };
  const timer = autoSlide(() => light((lit + 1) % cards.length), { host: root, interval: 5000, canRun: () => open < 0, manual: false });
  requestAnimationFrame(() => {
    countAll();
    setTimeout(() => light(0), 900);
    if (cards.length > 1) timer.start();
  });
  return root;
}
