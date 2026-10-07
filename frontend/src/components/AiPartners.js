import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * AI Partners — one landing page per partner, chosen from a slim rail on the left.
 *
 * Laid out like a travel landing page: a large headline with the partner's name set in its
 * accent, a line of introduction and a white "search bar" strip of facts with a button at its
 * end; on the right the official partner badge, large, among rounded photographs; then a row of
 * circles (the ten Claude Certified Architects, for Claude) and a row of cards with arrows.
 * Behind it all the partner's own mark, enormous and faint, with soft light in its colour.
 *
 * The rail advances on its own — a ring round the active partner fills while it holds — and
 * the deck's Prev / Next walk the three partners before turning the slide.
 *
 * Partner badges and marks are official files from /uploads; a brand is never drawn by hand.
 */

const src = (path) => (path ? media(`/uploads/${String(path).split('/').map(encodeURIComponent).join('/')}`) : '');
const RING = 2 * Math.PI * 27; // the rail's progress ring, r = 27

export function AiPartners(block, { editing = false } = {}) {
  const partners = (block.partners || []).filter((p) => p && p.name);
  if (!partners.length) {
    return h('div', { class: 'apx-root apx-root--empty ph-root' }, 'No AI partners yet.');
  }
  const n = partners.length;
  const hold = Number(block.hold) || 9000;

  const root = h('div', { class: 'apx-root ph-root', style: { '--apx-hold': `${hold}ms`, '--apx-ring': String(RING) } });
  let active = 0;
  let playing = !editing;

  /* ---------------------------------------------------------------- the rail */
  const railBtns = partners.map((p, i) => h('button', {
    class: 'apx-rail__btn', type: 'button', 'aria-label': p.name,
    style: { '--accent': p.accent || '#008638' },
    onclick: () => manual(i),
  },
    h('span', { class: 'apx-rail__dot' },
      h('span', { class: 'apx-rail__ringbox', 'aria-hidden': 'true' }),
      p.mark ? h('img', { src: src(p.mark), alt: '', draggable: 'false' }) : h('b', {}, p.name.slice(0, 1))),
    h('span', { class: 'apx-rail__label' }, p.short || p.name)));
  // The ring is SVG: written as markup so it lands in the SVG namespace.
  railBtns.forEach((b) => {
    b.querySelector('.apx-rail__ringbox').innerHTML = '<svg class="apx-rail__ring" viewBox="0 0 60 60"><circle class="apx-rail__track" cx="30" cy="30" r="27"/><circle class="apx-rail__fill" cx="30" cy="30" r="27"/></svg>';
  });
  const playBtn = h('button', { class: 'apx-rail__play', type: 'button', onclick: () => setPlaying(!playing) });
  const rail = h('nav', { class: 'apx-rail', 'aria-label': 'AI partners' },
    h('span', { class: 'apx-rail__title' }, block.title || 'AI Partners'),
    h('div', { class: 'apx-rail__list' }, ...railBtns),
    playBtn);

  const stage = h('div', { class: 'apx-stage', 'aria-live': 'polite' });
  const backdrop = h('div', { class: 'apx-bg', 'aria-hidden': 'true' });
  root.append(backdrop, rail, stage);

  /* --------------------------------------------------------------- one page */
  const page = (p) => {
    const accent = p.accent || '#008638';
    const people = (p.circles?.items || []);

    // The collage: the badge large, the photographs — or the mark — around it.
    const photos = (p.photos || []).filter((x) => x.src);
    const tiles = photos.length
      ? photos.slice(0, 3).map((ph, k) => h('figure', { class: `apx-tile apx-tile--${k}`, style: { '--d': `${0.25 + k * 0.1}s` } },
          h('img', { src: src(ph.src), alt: ph.caption || '', draggable: 'false' }),
          ph.caption ? h('figcaption', {}, ph.caption) : null))
      : [
          h('figure', { class: 'apx-tile apx-tile--0 apx-tile--mark', style: { '--d': '0.25s' } },
            p.mark ? h('img', { src: src(p.mark), alt: '', draggable: 'false' }) : null),
          h('figure', { class: 'apx-tile apx-tile--1 apx-tile--word', style: { '--d': '0.35s' } },
            h('span', {}, p.tagline || p.name)),
        ];

    const circle = (it, k) => h('li', { class: 'apx-circle', style: { '--d': `${0.45 + k * 0.05}s` } },
      h('span', { class: `apx-circle__pic${it.photo ? '' : ' apx-circle__pic--icon'}` },
        it.photo ? h('img', { src: src(it.photo), alt: it.label, draggable: 'false' }) : icon(it.icon || 'sparkles', { class: 'ic' })),
      h('b', {}, it.label),
      it.sub ? h('small', {}, it.sub) : null);

    const cardEls = (p.cards || []).map((c, k) => h('article', { class: 'apx-card', style: { '--d': `${0.6 + k * 0.08}s` } },
      h('span', { class: `apx-card__pic${c.photo ? '' : ' apx-card__pic--plate'}` },
        c.photo
          ? h('img', { src: src(c.photo), alt: '', draggable: 'false' })
          : h('span', { class: 'apx-card__glyph' }, icon(c.icon || 'sparkles', { class: 'ic' })),
        c.badge ? h('em', {}, c.badge) : null),
      h('div', { class: 'apx-card__body' },
        h('h4', {}, c.title),
        !c.photo && c.body ? h('p', { class: 'apx-card__desc' }, c.body) : null,
        c.tags?.length ? h('div', { class: 'apx-card__foot' },
          h('span', { class: 'apx-card__tags' }, ...c.tags.slice(0, 2).map((t) => h('i', {}, t))),
          h('span', { class: 'apx-card__go' }, 'Explore')) : null)));

    const track = h('div', { class: 'apx-cards__track' }, ...cardEls);
    let off = 0;
    const scroll = (d) => {
      const max = Math.max(0, cardEls.length - 4);
      off = Math.max(0, Math.min(max, off + d));
      track.style.transform = `translateX(calc(${-off} * (var(--apx-card-w) + 18px)))`;
    };

    const nxt = partners[(active + 1) % n];

    return h('section', { class: 'apx-page', style: { '--accent': accent } },
      h('div', { class: 'apx-hero' },
        h('div', { class: 'apx-copy' },
          p.status ? h('span', { class: 'apx-pill', style: { '--d': '0s' } }, h('i'), p.status) : null,
          h('h2', { class: 'apx-title', style: { '--d': '0.06s' } },
            p.headline?.[0] || '', ' ', h('span', {}, p.headline?.[1] || p.name)),
          p.body ? h('p', { class: 'apx-lead', style: { '--d': '0.14s' } }, p.body) : null,
          p.strip?.length ? h('div', { class: 'apx-strip', style: { '--d': '0.22s' } },
            ...p.strip.slice(0, 3).map((f) => h('div', { class: 'apx-strip__field' },
              h('span', { class: 'apx-strip__icon' }, icon(f.icon || 'sparkles', { class: 'ic ic--xs' })),
              h('span', { class: 'apx-strip__text' }, h('small', {}, f.label), h('b', {}, f.value)))),
            n > 1 ? h('button', { class: 'apx-strip__btn', type: 'button', onclick: () => manual(active + 1) },
              `Next: ${nxt.short || nxt.name}`, icon('arrow-right', { class: 'ic ic--xs' })) : null) : null),
        h('div', { class: 'apx-collage' },
          h('div', { class: 'apx-badge', style: { '--d': '0.18s' } },
            h('span', { class: 'apx-badge__label' }, icon('seal-check', { class: 'ic ic--xs' }), 'Official partner badge'),
            p.badge ? h('img', { src: src(p.badge), alt: p.status || p.name, draggable: 'false' }) : h('b', {}, p.name)),
          )),

      people.length ? h('div', { class: 'apx-row' },
        h('header', { class: 'apx-row__head' },
          h('div', {}, h('h3', {}, p.circles.title), p.circles.sub ? h('p', {}, p.circles.sub) : null)),
        h('ul', { class: `apx-circles${people.some((x) => x.photo) ? ' apx-circles--people' : ''}` }, ...people.map(circle))) : null,

      cardEls.length ? h('div', { class: 'apx-row apx-row--cards' },
        h('header', { class: 'apx-row__head' },
          h('div', {}, h('h3', {}, p.cardsTitle || `What we do with ${p.short || p.name}`),
            p.cardsSub ? h('p', {}, p.cardsSub) : null),
          cardEls.length > 4 ? h('div', { class: 'apx-arrows' },
            h('button', { type: 'button', 'aria-label': 'Previous', onclick: () => scroll(-1) }, icon('chevron-left', { class: 'ic ic--xs' })),
            h('button', { type: 'button', class: 'is-primary', 'aria-label': 'Next', onclick: () => scroll(1) }, icon('chevron-right', { class: 'ic ic--xs' }))) : null),
        h('div', { class: 'apx-cards' }, track)) : null);
  };

  /* The faint background: the partner's mark, huge, twice, and two soft glows of its colour. */
  const paintBackdrop = (p) => {
    backdrop.style.setProperty('--accent', p.accent || '#008638');
    backdrop.replaceChildren(
      h('span', { class: 'apx-bg__glow apx-bg__glow--a' }),
      h('span', { class: 'apx-bg__glow apx-bg__glow--b' }),
      ...(p.mark ? [
        h('img', { class: 'apx-bg__mark apx-bg__mark--a', src: src(p.mark), alt: '' }),
        h('img', { class: 'apx-bg__mark apx-bg__mark--b', src: src(p.mark), alt: '' }),
      ] : []));
  };

  const replay = () => { root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in'); };

  function paint(dir = 1) {
    const p = partners[active];
    railBtns.forEach((b, i) => b.classList.toggle('is-active', i === active));
    paintBackdrop(p);
    const next = page(p);
    next.classList.add(dir < 0 ? 'from-up' : 'from-down');
    stage.replaceChildren(next);
    replay();
  }

  const auto = autoSlide(() => { active = (active + 1) % n; paint(1); }, { host: root, interval: hold });

  function manual(i) {
    const t = ((i % n) + n) % n;
    if (t !== active) { const dir = t > active ? 1 : -1; active = t; paint(dir); }
    auto.reset();
    replay();
  }

  function setPlaying(on) {
    playing = on;
    playBtn.replaceChildren(icon(on ? 'pause' : 'play', { class: 'ic ic--xs' }));
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    root.classList.toggle('is-paused', !on);
    if (on) auto.start(); else auto.stop();
    replay();
  }

  if (!editing) {
    registerStepper((delta) => {
      const t = active + (delta > 0 ? 1 : -1);
      if (t < 0 || t >= n) return false;
      manual(t);
      return true;
    });
  }

  paint(1);
  setPlaying(playing);
  return root;
}
