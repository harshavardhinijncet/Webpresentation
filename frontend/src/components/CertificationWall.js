import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { upload } from '../utils/media.js';

/**
 * Certifications, in three acts.
 *
 *   01 The Register    every logo on one silver arc, over the certification post.
 *   02 Skills Unlocked a stacked deck that deals out, then opens to the skills.
 *   03 The Gallery     the cohort artwork, one card per batch that passed.
 *
 * The arc carries all forty-five, evenly spaced. Spacing by index rather than by
 * anything hashed is what makes it read as one line of marks instead of a scatter
 * with holes in it — the earlier version placed each badge at a hashed radius and
 * the gaps that produced were the first thing anyone noticed.
 *
 * Act 02 opens as a single stack, because forty-five cards arriving at once is a
 * wall nobody reads. One click deals them into a grid of at most four columns; one
 * more opens a credential and the deck becomes a filmstrip — the chosen logo large
 * on the left, its skills on the right, its neighbours faded either side, and the
 * arrows or a horizontal drag walk along it.
 *
 * Every logo is a local file under /uploads, downloaded from the links in
 * Logos.xlsx. This deck presents with no network, so nothing here may reach a CDN.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* Layout pixels, not measured ones — the page is inside FitSlide's transform, so a
   bounding rect comes back scaled and would solve in the wrong unit. */
const GAP = 12;

const ACTS = [
  { key: 'register', num: '01', name: 'The Register' },
  { key: 'skills', num: '02', name: 'Skills Unlocked' },
  { key: 'gallery', num: '03', name: 'The Gallery' },
];

const nf = (n) => Number(n || 0).toLocaleString('en-US');
const initials = (s) => String(s || '?').replace(/[^A-Za-z ]/g, '').trim().slice(0, 2).toUpperCase() || '?';

/* ------------------------------------------------------------ the cohort wall */
/* Width and height solved together, because a row of square cards is always far
   wider than it is tall and filling the width alone strands the stage in white. */
const SIZE_TOLERANCE = 0.95;

function packRows(items, width, contentH) {
  const n = items.length;
  if (!n) return [];
  const aspect = (it) => it.w / it.h;
  const candidates = [];

  for (let c = 1; c <= n; c += 1) {
    const groups = [];
    for (let i = 0; i < n; i += c) groups.push(items.slice(i, i + c));
    const rows = groups.length;
    const byHeight = (contentH - GAP * (rows - 1)) / rows;
    if (byHeight <= 0) continue;
    const spans = groups.map((g) => g.reduce((sum, it) => sum + aspect(it), 0));
    const byWidth = Math.min(...groups.map((g, i) => (width - GAP * (g.length - 1)) / spans[i]));
    const height = Math.min(byHeight, byWidth);
    const used = Math.max(...groups.map((g, i) => height * spans[i] + GAP * (g.length - 1)));
    const ragged = rows > 1 ? (c * rows - n) / c : 0;
    candidates.push({ groups, height, used, ragged });
  }
  if (!candidates.length) {
    candidates.push({ groups: items.map((it) => [it]), height: 120, used: width, ragged: 0 });
  }
  const tallest = Math.max(...candidates.map((k) => k.height));
  const pool = candidates.filter((k) => k.height >= tallest * SIZE_TOLERANCE);
  const even = pool.filter((k) => k.ragged <= 0.5);
  const best = (even.length ? even : pool)
    .sort((a, b) => (b.used - a.used) || (a.ragged - b.ragged))[0];

  return best.groups.map((g) => {
    const solved = g.map((it) => ({ ...it, dw: best.height * aspect(it), dh: best.height }));
    const w = solved.reduce((sum, it) => sum + it.dw, 0) + GAP * (g.length - 1);
    return { height: best.height, full: w >= width - 0.5, items: solved };
  });
}

export function CertificationWall(block, { editing = false } = {}) {
  const vendors = (block.vendors || []).filter((v) => v.certs?.length);
  const certs = (block.credentials || []).filter((c) => c.name);
  const root = h('div', { class: 'cs-root ph-root' });

  if (!vendors.length && !certs.length) {
    root.appendChild(h('div', { class: 'cs-empty' },
      h('h2', { class: 'cs-title' }, block.title || 'Certifications'),
      editing
        ? h('p', { class: 'cs-hint' }, 'Run tools/publish-certifications.cjs and it appears here.')
        : null,
    ));
    return root;
  }

  const cards = vendors.reduce((n, v) => n + v.certs.length, 0);
  const earned = certs.reduce((n, c) => n + (c.held || 0), 0);
  const bodies = new Set(certs.map((c) => c.vendor)).size;
  const src = (p) => upload(String(p).split('/').map(encodeURIComponent).join('/'));

  let act = ACTS[0].key;

  const art = (c, cls) => (c.badge
    ? h('img', { class: cls, src: src(c.badge), alt: '', loading: 'lazy', decoding: 'async' })
    : h('em', { class: `${cls} is-type` }, initials(c.vendor)));

  /* ============================================================== 01 REGISTER */
  const arcWrap = h('div', { class: 'cs-arc' });
  const regStage = h('div', { class: 'cs-reg' });

  /**
   * Every logo on one arc, evenly spaced.
   *
   * The arc is drawn as an SVG path so the silver line is a real stroke behind the
   * marks rather than a border faked with a rounded box, and each logo is placed at
   * the same angle the path uses — so the marks sit *on* the line instead of near
   * it. Even spacing is the whole point: the index decides the angle and nothing
   * else does, which is what removes the holes.
   */
  /* Two arcs, nested. One line of forty-five marks reads as a single long band;
     split across an outer and an inner curve the register has depth, and each mark
     gets more room. Same centre and sweep for both, so they stay concentric.

     The counts are not split evenly down the middle — they are allotted in
     proportion to each arc's real length, which is what keeps the spacing identical
     on both. Half each would crowd the shorter inner curve. */
  const ARCS = [
    { rx: 47, ry: 62, from: 187, to: 353 },
    { rx: 34, ry: 44, from: 194, to: 346 },
  ];
  const ARC_CX = 50;
  const ARC_CY = 90;

  /**
   * Sample one arc and hand back its pixel length and a point-at-distance lookup.
   *
   * The curve lives in percentage space and the stage is far wider than it is tall,
   * so length has to be accumulated in real pixels — a step equal in percentage
   * terms is not equal on screen, and measuring in viewBox units left the marks
   * running from 22px to 51px apart.
   */
  function sampleArc(spec, pw, ph) {
    const at = (deg) => {
      const r = (deg * Math.PI) / 180;
      return [ARC_CX + Math.cos(r) * spec.rx, ARC_CY + Math.sin(r) * spec.ry];
    };
    const STEPS = 720;
    const pts = [];
    for (let i = 0; i <= STEPS; i += 1) pts.push(at(spec.from + (i / STEPS) * (spec.to - spec.from)));

    const run = [0];
    for (let i = 1; i < pts.length; i += 1) {
      const dx = ((pts[i][0] - pts[i - 1][0]) / 100) * pw;
      const dy = ((pts[i][1] - pts[i - 1][1]) / 100) * ph;
      run.push(run[i - 1] + Math.hypot(dx, dy));
    }
    const span = run[run.length - 1];

    const atLength = (want) => {
      let lo = 0;
      let hi = run.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (run[mid] < want) lo = mid + 1; else hi = mid;
      }
      const i = Math.max(1, lo);
      const t = (want - run[i - 1]) / Math.max(1e-6, run[i] - run[i - 1]);
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
      ];
    };

    // Every 8th sample is plenty for a smooth stroke and keeps the `d` short.
    const d = pts
      .filter((_, i) => i % 8 === 0 || i === pts.length - 1)
      .map((q, i) => `${i ? 'L' : 'M'} ${q[0].toFixed(2)} ${q[1].toFixed(2)}`)
      .join(' ');

    return { span, atLength, d };
  }

  function drawRegister() {
    const list = certs;
    /* Layout pixels, not a bounding rect — the stage is inside FitSlide's transform
       and a rect would come back scaled. Reads 0 before mount, hence the fallback
       and the one redraw the ResizeObserver below triggers. */
    const pw = regStage.clientWidth || 1600;
    const ph = regStage.clientHeight || 700;

    const arcs = ARCS.map((spec) => sampleArc(spec, pw, ph));
    const total = arcs.reduce((n, a) => n + a.span, 0);

    /* Allotted by length, with the remainder going to the longest arc so the counts
       always add back to exactly the number of credentials. */
    const counts = arcs.map((a) => Math.floor((a.span / total) * list.length));
    let left = list.length - counts.reduce((n, c) => n + c, 0);
    while (left > 0) {
      let best = 0;
      for (let i = 1; i < arcs.length; i += 1) if (arcs[i].span > arcs[best].span) best = i;
      counts[best] += 1;
      left -= 1;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'cs-arc__line');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<linearGradient id="cs-silver" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0%" stop-color="#c8ccd4" stop-opacity="0.15"/>'
      + '<stop offset="22%" stop-color="#e9ecf1" stop-opacity="0.95"/>'
      + '<stop offset="50%" stop-color="#aeb4c0" stop-opacity="1"/>'
      + '<stop offset="78%" stop-color="#e9ecf1" stop-opacity="0.95"/>'
      + '<stop offset="100%" stop-color="#c8ccd4" stop-opacity="0.15"/>'
      + '</linearGradient>';
    svg.append(defs);

    const marks = [];
    let taken = 0;
    arcs.forEach((arc, ai) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', arc.d);
      path.setAttribute('class', `cs-arc__stroke${ai ? ' cs-arc__stroke--in' : ''}`);
      svg.append(path);

      const n = counts[ai];
      /* Inset half a step at each end, so the first and last marks are not sitting
         on the very tips of the stroke. */
      const step = n > 0 ? arc.span / n : 0;
      for (let i = 0; i < n; i += 1) {
        const c = list[taken + i];
        const [x, y] = arc.atLength(step * 0.5 + i * step);
        marks.push(h('span', {
          class: `cs-mark${ai ? ' cs-mark--in' : ''}`,
          title: `${c.name} — ${nf(c.held)}`,
          style: {
            left: `${x}%`,
            top: `${y}%`,
            'animation-delay': REDUCED?.matches ? '0ms' : `${(taken + i) * 22}ms`,
          },
        }, art(c, 'cs-mark__img')));
      }
      taken += n;
    });

    arcWrap.replaceChildren(svg, ...marks);

    regStage.replaceChildren(
      block.backdrop
        ? h('div', { class: 'cs-reg__back', 'aria-hidden': 'true' },
            h('img', { src: src(block.backdrop), alt: '', decoding: 'async' }))
        : null,
      arcWrap,
      h('div', { class: 'cs-reg__mid' },
        h('div', { class: 'cs-figs' },
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(earned)), h('span', {}, 'certifications earned')),
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(certs.length)), h('span', {}, 'distinct credentials')),
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(bodies)), h('span', {}, 'awarding bodies')),
        ),
        block.quote
          ? h('blockquote', { class: 'cs-quote' },
              h('p', {}, `“${block.quote}”`),
              block.quoteBy ? h('cite', {}, block.quoteBy) : null)
          : null,
        h('p', { class: 'cs-reg__cue' }, 'Click anywhere to open the deck'),
      ),
    );
  }

  /* Anywhere on the register opens act 02, with a zoom that carries the eye
     through rather than cutting. The class drives both halves of it: the register
     pushes back and fades, the deck arrives from underneath. */
  regStage.addEventListener('click', () => {
    if (REDUCED?.matches) { go('skills'); return; }
    root.classList.add('is-zooming');
    setTimeout(() => { go('skills'); root.classList.remove('is-zooming'); }, 420);
  });

  /* ================================================================ 02 SKILLS */
  const deck = h('div', { class: 'cs-deck' });
  /* 'stack' — one pile. 'grid' — dealt into columns. 'one' — a single credential
     open with its skills, the rest a filmstrip either side. */
  let mode = 'stack';
  let pick = 0;
  const ranked = [...certs].sort((a, b) => b.held - a.held);

  function drawDeck() {
    deck.dataset.mode = mode;

    if (mode === 'one') { drawOne(); return; }

    const grid = h('div', { class: 'cs-cards' },
      ...ranked.map((c, i) => h('button', {
        class: 'cs-card',
        type: 'button',
        title: c.name,
        /* In the stack these drive the fan; in the grid they are ignored, so the
           same node serves both states and the change is a transition rather than
           a rebuild. */
        style: {
          '--i': String(i),
          '--d': String(Math.min(i, 7)),
          ...(REDUCED?.matches ? {} : { 'transition-delay': mode === 'grid' ? `${Math.min(i, 24) * 18}ms` : '0ms' }),
        },
        onclick: (e) => {
          e.stopPropagation();
          if (mode === 'stack') { mode = 'grid'; drawDeck(); return; }
          pick = i;
          mode = 'one';
          drawDeck();
        },
      },
        h('span', { class: 'cs-card__art' }, art(c, 'cs-card__img')),
        h('span', { class: 'cs-card__name' }, c.name),
        h('span', { class: 'cs-card__held' },
          h('strong', {}, nf(c.held)),
          h('span', {}, c.held === 1 ? 'certified' : 'certified')),
      )),
    );

    deck.replaceChildren(
      h('div', { class: 'cs-deck__bar' },
        h('p', { class: 'cs-deck__cue' }, mode === 'stack'
          ? `${ranked.length} credentials — click the deck to lay them out`
          : `${ranked.length} credentials — click one for its skills`),
        mode === 'grid'
          ? h('button', {
              class: 'cs-back', type: 'button',
              onclick: (e) => { e.stopPropagation(); mode = 'stack'; drawDeck(); },
            }, icon('layers', { class: 'ic ic--xs' }), 'Stack them')
          : null,
      ),
      grid,
    );
  }

  /** The open credential, with its neighbours faded either side. */
  function drawOne() {
    const strip = h('div', { class: 'cs-film' },
      ...ranked.map((c, i) => {
        const away = i - pick;
        return h('button', {
          class: `cs-slide${away === 0 ? ' is-on' : ''}`,
          type: 'button',
          title: c.name,
          'aria-hidden': Math.abs(away) > 2 ? 'true' : null,
          style: { '--away': String(away) },
          onclick: (e) => { e.stopPropagation(); pick = i; drawOne(); },
        },
          h('span', { class: 'cs-slide__art' }, art(c, 'cs-slide__img')),
        );
      }),
    );

    const c = ranked[pick];
    deck.replaceChildren(
      h('div', { class: 'cs-deck__bar' },
        h('button', {
          class: 'cs-back', type: 'button',
          onclick: (e) => { e.stopPropagation(); mode = 'grid'; drawDeck(); },
        }, icon('chevron-left', { class: 'ic ic--xs' }), 'All credentials'),
        h('p', { class: 'cs-deck__count' }, `${pick + 1} / ${ranked.length}`),
      ),
      h('div', { class: 'cs-one' },
        h('div', { class: 'cs-one__left' },
          strip,
          h('div', { class: 'cs-one__steps' },
            h('button', {
              class: 'cs-step__btn', type: 'button', 'aria-label': 'Previous credential',
              disabled: pick === 0,
              onclick: (e) => { e.stopPropagation(); pick = Math.max(0, pick - 1); drawOne(); },
            }, icon('chevron-left', { class: 'ic ic--xs' })),
            h('button', {
              class: 'cs-step__btn', type: 'button', 'aria-label': 'Next credential',
              disabled: pick === ranked.length - 1,
              onclick: (e) => { e.stopPropagation(); pick = Math.min(ranked.length - 1, pick + 1); drawOne(); },
            }, icon('chevron-right', { class: 'ic ic--xs' })),
          ),
        ),
        h('div', { class: 'cs-one__right' },
          h('p', { class: 'cs-one__vendor' }, `${c.vendor}${c.domain ? ` · ${c.domain}` : ''}`),
          h('h3', { class: 'cs-one__name' }, c.name),
          h('div', { class: 'cs-one__count' },
            h('strong', {}, nf(c.held)),
            h('span', {}, c.held === 1 ? 'trainee holds it' : 'trainees hold it')),
          h('p', { class: 'cs-one__label' }, 'What it tests'),
          h('ol', { class: 'cs-one__skills' },
            ...(c.skills || []).map((s, i) => h('li', {
              style: REDUCED?.matches ? {} : { '--i': String(i) },
            }, h('em', {}, String(i + 1).padStart(2, '0')), h('span', {}, s))),
          ),
        ),
      ),
    );
  }

  /* A horizontal drag walks the filmstrip, which is what "side scroll" means on a
     projector with no scrollbar to grab. Wheel too, since a trackpad sends that. */
  let wheelLock = 0;
  deck.addEventListener('wheel', (e) => {
    if (mode !== 'one') return;
    const along = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!along) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLock < 260) return;      // one credential per gesture, not thirty
    wheelLock = now;
    pick = Math.max(0, Math.min(ranked.length - 1, pick + (along > 0 ? 1 : -1)));
    drawOne();
  }, { passive: false });

  /* =============================================================== 03 GALLERY */
  const rail = h('nav', { class: 'cs-rail', 'aria-label': 'Certification vendors' });
  const banner = h('div', { class: 'cs-banner' });
  const wallStage = h('div', { class: 'cs-stage' });
  let vendor = vendors[0] || null;
  let lastH = 0;
  const RAIL_W = 250;
  const STAGE_W = 1600 - 52 - RAIL_W - 22;

  function drawBanner() {
    const vs = vendor ? [vendor] : vendors;
    const n = vs.reduce((sum, v) => sum + v.certs.length, 0);
    banner.replaceChildren(
      h('div', { class: 'cs-banner__id' },
        h('div', {},
          h('h3', { class: 'cs-banner__name' }, vendor ? vendor.name : 'Every credential'),
          h('p', { class: 'cs-banner__meta' },
            `${vendor ? vendor.domain || '' : `${vendors.length} vendors`} · ${n} card${n === 1 ? '' : 's'}`)),
      ),
    );
  }

  function drawWall() {
    wallStage.textContent = '';
    wallStage.scrollTop = 0;
    const flat = (vendor ? [vendor] : vendors)
      .flatMap((v) => v.certs.map((c) => ({ ...c, vendor: v.name })));
    /* clientHeight is layout, not post-transform, so it is safe to solve against. */
    lastH = wallStage.clientHeight;
    const contentH = (lastH || 480) - 28 - GAP;
    const rows = packRows(flat, STAGE_W, contentH);

    const totalH = rows.reduce((n, r) => n + r.height + GAP, 0) - GAP;
    wallStage.classList.toggle('is-short', totalH <= contentH + 1);

    const wallW = Math.ceil(Math.max(...rows.map(
      (r) => r.items.reduce((n, it) => n + it.dw, 0) + GAP * (r.items.length - 1))));
    const wall = h('div', { class: 'cs-wall', style: { width: `${Math.min(wallW, STAGE_W)}px` } });

    rows.forEach((row) => {
      const rowEl = h('div', { class: 'cs-row', style: { gap: `${GAP}px`, height: `${Math.round(row.height)}px` } });
      /* Largest-remainder widths: floor them all, then hand the leftover pixels to
         the tiles rounded down hardest. Giving the drift to one tile put a 76px
         card 2.4% off its own aspect ratio. */
      const widths = row.items.map((it) => Math.floor(it.dw));
      if (row.full) {
        let spare = (STAGE_W - GAP * (widths.length - 1)) - widths.reduce((n, w) => n + w, 0);
        const order = row.items.map((it, i) => ({ i, frac: it.dw - Math.floor(it.dw) }))
          .sort((a, b) => b.frac - a.frac);
        for (let k = 0; spare > 0 && order.length; k += 1, spare -= 1) widths[order[k % order.length].i] += 1;
      }
      row.items.forEach((it, col) => {
        rowEl.appendChild(h('figure', {
          class: 'cs-tile',
          style: { width: `${widths[col]}px`, height: `${Math.round(it.dh)}px` },
          title: it.label,
        },
          h('img', {
            src: src(it.src), alt: it.label || '',
            width: it.w, height: it.h, loading: 'lazy', decoding: 'async',
          }),
          h('figcaption', { class: 'cs-tile__tag' }, it.label),
        ));
      });
      wall.appendChild(rowEl);
    });
    wallStage.appendChild(wall);
  }

  function drawRail() {
    rail.textContent = '';
    const entry = (label, sub, value, count, i) => h('button', {
      class: `cs-tab${vendor === value ? ' is-on' : ''}`,
      type: 'button', 'aria-current': vendor === value ? 'true' : 'false',
      style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 26}ms` },
      onclick: () => { if (vendor === value) return; vendor = value; drawRail(); drawBanner(); drawWall(); },
    },
      h('span', { class: 'cs-tab__text' },
        h('span', { class: 'cs-tab__name' }, label),
        sub ? h('span', { class: 'cs-tab__sub' }, sub) : null),
      h('span', { class: 'cs-tab__n' }, String(count)),
    );
    rail.appendChild(entry('Every credential', `${vendors.length} vendors`, null, cards, 0));
    vendors.forEach((v, i) => rail.appendChild(entry(v.name, v.domain, v, v.certs.length, i + 1)));
  }

  /* =================================================================== chrome */
  const steps = h('nav', { class: 'cs-steps', role: 'tablist' });
  const acts = h('div', { class: 'cs-acts' });

  function go(key) {
    act = key;
    acts.dataset.act = act;
    drawSteps();
    if (key === 'register') drawRegister();
    if (key === 'skills') drawDeck();
    if (key === 'gallery') { drawRail(); drawBanner(); drawWall(); }
  }

  function drawSteps() {
    steps.replaceChildren(...ACTS.map((a) => h('button', {
      class: `cs-step${a.key === act ? ' is-on' : ''}`,
      type: 'button', role: 'tab', 'aria-selected': String(a.key === act),
      onclick: () => {
        if (a.key === act) return;
        // Coming back to the deck always starts stacked, as it was first seen.
        if (a.key === 'skills') mode = 'stack';
        go(a.key);
      },
    }, h('em', {}, a.num), h('span', {}, a.name))));
  }

  root.append(
    h('div', { class: 'cs-head' },
      h('div', {},
        block.eyebrow ? h('p', { class: 'cs-eyebrow' }, block.eyebrow) : null,
        h('h2', { class: 'cs-title' }, block.title || 'Certifications')),
      steps,
    ),
    acts,
  );
  acts.append(
    h('section', { class: 'cs-act cs-act--register' }, regStage),
    h('section', { class: 'cs-act cs-act--skills' }, deck),
    h('section', { class: 'cs-act cs-act--gallery' },
      h('div', { class: 'cs-gal' }, rail, h('div', { class: 'cs-main' }, banner, wallStage))),
  );

  go('register');
  drawDeck();
  drawRail();
  drawBanner();

  /* The wall is watched rather than sampled once: the rail and banner settle after
     their entrance animations, and a single measurement on the next frame committed
     a column count against the wrong height. */
  const watchSize = new ResizeObserver(() => {
    if (act !== 'gallery') return;
    if (wallStage.clientHeight && Math.abs(wallStage.clientHeight - lastH) > 8) drawWall();
  });
  watchSize.observe(wallStage);

  /* The arc is solved against the stage's pixel size, and that reads 0 until the
     slide is in the document — so the first pass lays the marks out against the
     1600x700 fallback and has to be redone once the real size is known. Guarded on
     a threshold, or every resize tick would rebuild forty-five nodes. */
  let arcW = 0;
  let arcH = 0;
  const watchArc = new ResizeObserver(() => {
    const w = regStage.clientWidth;
    const hgt = regStage.clientHeight;
    if (!w || !hgt) return;
    if (Math.abs(w - arcW) < 8 && Math.abs(hgt - arcH) < 8) return;
    arcW = w;
    arcH = hgt;
    drawRegister();
  });
  watchArc.observe(regStage);

  const watch = new MutationObserver(() => {
    if (!root.isConnected) { watchSize.disconnect(); watchArc.disconnect(); watch.disconnect(); }
  });
  watch.observe(document.body, { childList: true, subtree: true });

  return root;
}
