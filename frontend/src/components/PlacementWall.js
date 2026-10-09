import { h, wheelScroll, moreStrip } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { autoSlide, slideIn, resetAutoSlides } from '../utils/autoSlide.js';
import { registerStepper } from '../utils/slideSteps.js';

/**
 * Placements: four chapters of evidence, and a gallery that never distorts one
 * of them.
 *
 * The material is three different things wearing the same file extension. The
 * campus and open-drive images are finished announcement cards, with student
 * names, selection counts and a company logo already set into them — crop one
 * to a square tile and you cut a name off. The journey images are tall
 * infographics meant to be read. Only the success-story folders hold ordinary
 * photographs, and those run from 0.56 to 2.23 in aspect because they came off
 * whatever phone was nearest.
 *
 * So the gallery is justified rows, the layout newspapers use for photographs:
 * fill a row with images scaled to one shared height, then solve that height so
 * the row ends exactly at the margin. Every image keeps its own aspect ratio to
 * the pixel — no `object-fit: cover`, no fixed tile, nothing cropped and
 * nothing stretched. The row height falls out of the arithmetic instead of
 * being imposed on it.
 *
 * The dimensions arrive with the block rather than being read off loaded
 * images, which is what keeps the page from reflowing: rows are solved before a
 * single byte of image data has landed.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* The nominal canvas is 1600 wide; .pw-stage keeps 20px each side. Measuring
   the live element would be better still, but it is inside a scaled ancestor,
   so getBoundingClientRect reports post-transform pixels and the row solver
   would be working in the wrong unit. These are layout pixels, which is what
   the solver needs. */
const CANVAS = 1600;
const EDGE = 20;
const GAP = 12;

/**
 * Pack items into rows of a shared height, each row ending exactly at `width`.
 *
 * For a row of images sharing height h, the total width is
 * `h × Σaspect + gap × (n-1)`. Setting that equal to the available width and
 * solving for h gives the height at which the row fits perfectly — so the
 * height is derived, never assumed, and every width is then `h × aspect`.
 *
 * `maxH` matters for the short chapters: three tall infographics solved to fill
 * 1560px would each stand 800px high in a 470px stage. Clamped rows stop short
 * of the right margin, and are centred instead of left-stranded.
 */
export function justifyRows(items, width, targetH, gap = GAP, maxH = Infinity) {
  const rows = [];
  let row = [];
  let arSum = 0;

  const solveRow = (items_) => {
    if (!items_.length) return null;
    const avail = width - gap * (items_.length - 1);
    const arTotal = items_.reduce((n, it) => n + (it.w / it.h || 1), 0);
    const solved = arTotal > 0 ? avail / arTotal : targetH;
    // Cap height at maxH (stage height) so super tall single images don't overflow the viewport
    const height = Math.min(solved, maxH > 0 ? maxH : solved);
    return {
      height,
      full: true,
      items: items_.map((it) => ({ ...it, dw: height * (it.w / it.h || 1), dh: height })),
    };
  };

  items.forEach((it) => {
    if (!it.w || !it.h) return;
    row.push(it);
    arSum += it.w / it.h;
    if (arSum * targetH + gap * (row.length - 1) >= width) {
      const res = solveRow(row);
      if (res) rows.push(res);
      row = [];
      arSum = 0;
    }
  });
  /* The leftover tail never fills the width on its own: solved to fit it, one square poster stands
     as tall as the whole gallery. It keeps the row height of the rows above (or the target, alone)
     and sits centred, short of the edges. */
  if (row.length) {
    const res = solveRow(row);
    if (res) {
      const cap = Math.min(maxH > 0 ? maxH : Infinity, rows.length ? rows[rows.length - 1].height : targetH * 1.25);
      if (res.height > cap) {
        res.height = cap;
        res.full = false;
        res.tail = true;
        res.items = res.items.map((it) => ({ ...it, dw: cap * (it.w / it.h || 1), dh: cap }));
      }
      rows.push(res);
    }
  }

  return rows;
}

/** A row height that suits the material: cards read small, photographs larger. */
const targetHeightFor = (kind, count) => {
  if (kind === 'journey') return 520;
  if (kind === 'poster') return count > 18 ? 220 : (count > 6 ? 280 : 340);
  return 300;
};

const countLabel = (n, kind) => {
  if (kind === 'journey') return `${n} ${n === 1 ? 'journey' : 'journeys'}`;
  if (kind === 'poster') return `${n} announcements`;
  return `${n} photographs`;
};

export function PlacementWall(block, { editing = false } = {}) {
  const chapters = (block.chapters || []).filter((c) => c.groups?.length);
  const root = h('div', { class: 'pw-root ph-root' });

  if (!chapters.length) {
    root.appendChild(h('div', { class: 'pw-empty' },
      h('h2', { class: 'pw-title' }, block.title || 'Placements'),
      editing
        ? h('p', { class: 'pw-hint' },
            'Drop the images into backend/uploads/Placements/ and re-run the publish step.')
        : null,
    ));
    return root;
  }

  /* ------------------------------------------------------------- lightbox */
  /* Portalled to the body. FitSlide scales the whole slide with a transform,
     and a transformed ancestor becomes the containing block for fixed
     descendants — inside the slide, `position: fixed; inset: 0` resolves to the
     slide's 1600×900 box rather than the screen. */
  const lightImg = h('img', { class: 'pw-light__img', alt: '' });
  const lightCap = h('p', { class: 'pw-light__cap' });
  const lightMeta = h('span', { class: 'pw-light__meta' });
  const lightCount = h('span', { class: 'pw-light__count' });

  /* The images of whatever is on screen, in reading order, so the arrows walk
     the same sequence the wall shows. Rebuilt by drawStage. */
  let shown = [];
  let atIndex = 0;

  const prevBtn = h('button', {
    class: 'pw-light__nav pw-light__nav--prev', type: 'button', 'aria-label': 'Previous image',
    onclick: (e) => { e.stopPropagation(); manual(-1); },
  }, icon('chevron-left', { class: 'ic' }));
  const nextBtn = h('button', {
    class: 'pw-light__nav pw-light__nav--next', type: 'button', 'aria-label': 'Next image',
    onclick: (e) => { e.stopPropagation(); manual(1); },
  }, icon('chevron-right', { class: 'ic' }));
  const lightFrame = h('figure', { class: 'pw-light__frame' }, lightImg,
    h('figcaption', { class: 'pw-light__foot' }, lightCap, lightMeta, lightCount));

  const light = h('div', {
    class: 'pw-light', hidden: true,
    onclick: (e) => { if (e.target === light || e.target.closest('.pw-light__close')) closeLight(); },
  },
    h('button', { class: 'pw-light__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    prevBtn, nextBtn, lightFrame,
  );
  document.body.appendChild(light);

  /* The open image holds for a moment and the next slides in on its own; the
     arrows still step, and restart the hold from wherever they land. */
  const auto = autoSlide(() => step(1), { host: light });
  function manual(delta) {
    step(delta);
    auto.reset();
  }

  /* The tile the open image came out of, so it can go back into it. */
  let fromTile = null;

  function closeLight() {
    auto.stop();
    lightFrame.classList.remove('as-in--next', 'as-in--prev');
    document.removeEventListener('keydown', onLightKey, true);
    /* Fly back into the tile, which is what makes it read as one object moving
       rather than a viewer opening and shutting. If the arrows have walked on to
       a different image there is no tile that matches it any more, so that case
       just fades. */
    const target = fromTile && shown[atIndex] === fromTile.pane ? fromTile.el : null;
    if (!target || REDUCED?.matches) {
      light.hidden = true;
      light.classList.remove('is-on');
      return;
    }
    const to = target.getBoundingClientRect();
    const now = lightImg.getBoundingClientRect();
    const sx = to.width / now.width;
    const sy = to.height / now.height;
    const dx = (to.left + to.width / 2) - (now.left + now.width / 2);
    const dy = (to.top + to.height / 2) - (now.top + now.height / 2);
    lightImg.style.transition = 'transform 320ms cubic-bezier(.4,0,.6,1)';
    lightImg.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    light.classList.remove('is-on');
    // Hidden only once it has arrived, or it disappears mid-flight.
    setTimeout(() => {
      light.hidden = true;
      lightImg.style.transition = '';
      lightImg.style.transform = '';
    }, 330);
  }
  function onLightKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeLight(); return; }
    /* Swallowed, or the deck's own left/right handler moves to the next slide
       underneath the open image. */
    if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); manual(1); }
    if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); manual(-1); }
  }
  /** Wraps, so the arrows never dead-end mid-presentation. */
  function step(delta) {
    if (shown.length < 2) return;
    atIndex = (atIndex + delta + shown.length) % shown.length;
    paint();
    slideIn(lightFrame, delta);
  }
  function paint() {
    const it = shown[atIndex];
    if (!it) return;
    /* The full file, at its own resolution — this is the one place the image is
       shown at native size, so it is the answer to "does the quality survive". */
    lightImg.src = media(`/uploads/Placements/${it.src.split('/').map(encodeURIComponent).join('/')}`);
    lightImg.alt = it.label || it.group?.name || '';
    lightCap.textContent = it.label || it.group?.name || '';
    lightMeta.textContent = `${it.w} × ${it.h}`;
    lightCount.textContent = shown.length > 1 ? `${atIndex + 1} / ${shown.length}` : '';
    const many = shown.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
    // Stepping with the arrows must not inherit the last flight's transform.
    lightImg.style.transition = '';
    lightImg.style.transform = '';
  }

  /**
   * Fly the opened image out of the tile it was clicked, rather than fading a
   * separate copy in over the top.
   *
   * The layout-grid this is modelled on gets it from a shared `layoutId`: React
   * measures the element in both places and interpolates. There is no shared
   * layout engine here, so it is done by hand — the standard invert-then-play.
   * Measure where the image ends up, express the tile as an offset and scale from
   * there, commit that, then transition it away to nothing.
   *
   * Rects on both sides, which is right for once: the tile is inside FitSlide's
   * transform and the lightbox is on the body, and a bounding rect is in viewport
   * space either way, so the two are directly comparable. Offsets would not be.
   */
  function flyFrom(tile) {
    if (!tile || REDUCED?.matches) return;
    const from = tile.getBoundingClientRect();
    const play = () => {
      const to = lightImg.getBoundingClientRect();
      if (!to.width || !to.height || !from.width) return;
      /* Both boxes are solved from the same file's aspect ratio, so these two
         scales agree to within rounding and the flight does not squash. */
      const sx = from.width / to.width;
      const sy = from.height / to.height;
      const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      lightImg.style.transition = 'none';
      lightImg.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      void lightImg.offsetWidth; // commit the inverted state before playing it
      lightImg.style.transition = 'transform 400ms cubic-bezier(.2,.7,.3,1)';
      lightImg.style.transform = 'none';
    };
    // The final box is only knowable once the file has decoded.
    if (lightImg.complete && lightImg.naturalWidth) requestAnimationFrame(play);
    else lightImg.addEventListener('load', () => requestAnimationFrame(play), { once: true });
  }

  function openLight(index, tile) {
    atIndex = Math.max(0, index);
    fromTile = tile ? { el: tile, pane: shown[atIndex] } : null;
    paint();
    light.hidden = false;
    flyFrom(tile);
    requestAnimationFrame(() => light.classList.add('is-on'));
    document.addEventListener('keydown', onLightKey, true);
    if (shown.length > 1) auto.start();
  }

  /* --------------------------------------------------------------- header */
  const stage = h('div', { class: 'pw-stage' });

  wheelScroll(stage);

  // Touch drag scrolling for touchpads and touchscreens
  let touchStartY = 0;
  let touchStartScrollTop = 0;
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].pageY;
      touchStartScrollTop = stage.scrollTop;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && stage.scrollHeight > stage.clientHeight) {
      const deltaY = touchStartY - e.touches[0].pageY;
      stage.scrollTop = touchStartScrollTop + deltaY;
    }
  }, { passive: true });
  const chips = h('div', { class: 'pw-chips' });
  const rail = h('div', { class: 'pw-rail' });

  let activeChapter = chapters[0];
  let activeGroup = null; // null means every group in the chapter
  /* Poster chapters tagged with package and company get a filter panel down the left: one package
     and one company may be chosen (choosing another replaces it, choosing it again clears it), and
     the two combine. With nothing chosen, every poster shows. */
  let band = null;
  let company = null;
  const BANDS = [
    { key: 'u5', label: 'Up to 5', unit: 'LPA', tone: '#cdeedd', ink: '#1f7a52', test: (p) => !p.intern && p.pkg !== null && p.pkg <= 5 },
    { key: '5-10', label: '5 – 10', unit: 'LPA', tone: '#fbecc0', ink: '#8a6400', test: (p) => !p.intern && p.pkg > 5 && p.pkg <= 10 },
    { key: '10-20', label: '10 – 20', unit: 'LPA', tone: '#d6eafb', ink: '#2463a6', test: (p) => !p.intern && p.pkg > 10 && p.pkg <= 20 },
    { key: '20+', label: '20 +', unit: 'LPA', tone: '#fbdcd0', ink: '#a8452a', test: (p) => !p.intern && p.pkg > 20 },
    { key: 'intern', label: 'Internships', unit: 'stipend', tone: '#e6dcfb', ink: '#5b3fa3', test: (p) => p.intern },
  ];
  const side = h('aside', { class: 'pw-side', hidden: true });
  const filtering = () => !!activeChapter?.filters;
  const allIn = () => activeChapter.groups.flatMap((g) => g.images.map((im) => ({ ...im, group: g })));
  const inBand = (p, b = band) => !b || BANDS.find((x) => x.key === b).test(p);
  const inCo = (p, c = company) => !c || (p.companies || []).includes(c);
  const passes = (p) => inBand(p) && inCo(p);

  function drawSide() {
    root.classList.toggle('is-filtered', filtering());
    side.hidden = !filtering();
    if (!filtering()) { side.replaceChildren(); return; }
    const all = allIn();
    const counts = new Map();
    all.forEach((p) => (p.companies || []).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
    const names = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
    let k = 0;
    const bandCard = (b) => {
      const n = all.filter((p) => b.test(p) && inCo(p)).length;
      const share = all.length ? all.filter(b.test).length / all.length : 0;
      return h('button', {
        class: `pw-bcard${band === b.key ? ' is-on' : ''}${b.key === 'intern' ? ' pw-bcard--wide' : ''}`, type: 'button',
        disabled: !n && band !== b.key, style: { '--tone': b.tone, '--ink': b.ink, '--share': String(share), '--i': String(k++) },
        onclick: () => { band = band === b.key ? null : b.key; refilter(); },
      },
        h('span', { class: 'pw-bcard__dot', 'aria-hidden': 'true' }),
        h('span', { class: 'pw-bcard__text' }, h('b', {}, b.label), h('small', {}, b.unit)),
        h('em', { class: 'pw-bcard__n' }, String(n)),
        h('i', { class: 'pw-bcard__bar', 'aria-hidden': 'true' }));
    };
    side.replaceChildren(
      h('div', { class: 'pw-side__row' },
        h('p', { class: 'pw-side__h' }, 'Package'),
        band || company ? h('button', { class: 'pw-side__clear', type: 'button', onclick: () => { band = null; company = null; refilter(); } },
          icon('close', { class: 'ic ic--xs' }), 'Clear') : null),
      h('div', { class: 'pw-bcards' }, ...BANDS.map(bandCard)),
      h('p', { class: 'pw-side__h' }, 'Company'),
      h('div', { class: 'pw-coswrap' }, h('div', { class: 'pw-cos' }, ...names.map((c) => {
        const n = all.filter((p) => (p.companies || []).includes(c) && inBand(p)).length;
        return h('button', {
          class: `pw-cchip${company === c ? ' is-on' : ''}`, type: 'button', disabled: !n && company !== c,
          style: { '--i': String(k++) },
          onclick: () => { company = company === c ? null : c; refilter(); },
        }, h('span', {}, c), h('em', {}, String(n)));
      }))));
    moreStrip(side.querySelector('.pw-cos'), { label: 'More companies' });
  }
  // Using a filter restarts the tab's hold, so the wall does not move on under the presenter.
  function refilter() { drawSide(); drawStage(); resetAutoSlides(); }
  // The company list fades at its foot only when there is more below.
  const markMore = () => { const co = side.querySelector('.pw-cos'); if (co) co.classList.toggle('is-more', co.scrollHeight > co.clientHeight + 2 && co.scrollTop + co.clientHeight < co.scrollHeight - 2); };
  side.addEventListener('scroll', markMore, true);
  if (typeof ResizeObserver === 'function') new ResizeObserver(markMore).observe(side);
  let lastStageH = 0;     // the stage height the current rows were solved against

  /* --------------------------------------------------------------- render */
  const reveal = (tiles) => {
    if (REDUCED?.matches) { tiles.forEach((t) => t.classList.add('is-in')); return; }
    /* Reading order, and capped: past about twenty the stagger stops adding
       anything and only delays the last tile past the presenter's patience. */
    tiles.forEach((tile, i) => {
      tile.style.transitionDelay = `${Math.min(i, 20) * 26}ms`;
    });
    /* Every tile is revealed on the stagger, not when it scrolls into view: an observer rooted
       in the stage misses intersections inside the scaled slide and left tiles invisible. */
    requestAnimationFrame(() => tiles.forEach((t) => t.classList.add('is-in')));
  };

  function drawStage() {
    stage.textContent = '';
    stage.scrollTop = 0;

    const groups = activeGroup
      ? activeChapter.groups.filter((g) => g.name === activeGroup)
      : activeChapter.groups;

    const flat = groups.flatMap((g) => g.images.map((im) => ({ ...im, group: g })))
      .filter((p) => !filtering() || passes(p));
    // Beside the filter rail the stage is narrower than the canvas; solve against what it has.
    const width = filtering() && stage.clientWidth ? stage.clientWidth - EDGE * 2 : CANVAS - EDGE * 2;
    const target = targetHeightFor(activeChapter.kind, flat.length);
    /* clientHeight is layout, not post-transform, so it is safe to solve rows
       against — unlike a bounding rect, which comes back scaled by FitSlide.
       It reads 0 before the first mount, hence the fallback and the one redraw
       below: a guessed stage height left the three journey infographics
       standing 470px tall in 650px of stage, with the difference as white. */
    lastStageH = stage.clientHeight;
    /* clientHeight carries the stage's own padding, and each row adds a bottom
       margin, so both come off before anything is solved against it. Skipping
       that arithmetic is what turns "fills the stage" into "scrolls by 50px". */
    const contentH = (lastStageH || 680) - 40 - GAP;
    /* The stage is the only ceiling. A leftover tail is already held near the
       target height by justifyRows, so a second, smaller cap here bought
       nothing and cost the case that matters: one company with two photographs
       is a single row, and it was being pinned to 348px in 592px of stage. */
    const journey = activeChapter.kind === 'journey';
    const maxH = contentH;
    const rows = justifyRows(flat, width, journey ? contentH : target, GAP, maxH);

    // The arrow sequence is whatever the wall is showing, in reading order.
    shown = flat;

    /* Where the spare height goes. Aspect ratios are fixed, so a row can fill the
       width or the height but not both: Google's three photographs come to 309px
       once they span 1536, in a 592px box. Splitting them over two rows makes
       every image *smaller* — 290px — so there is nothing to gain there. What is
       left to decide is whether the remainder sits under the pictures or around
       them, and centred reads as composition where bottom-stacked reads as a
       layout that ran out. Only when it fits: centring a scrolling stage would
       clip its first row. */
    const totalH = rows.reduce((n, r) => n + r.height + GAP, 0) - GAP;
    stage.classList.toggle('is-short', !journey && totalH <= contentH + 1);

    const tiles = [];
    let ordinal = 0;
    rows.forEach((row) => {
      const rowEl = h('div', {
        class: `pw-row${row.full ? '' : ' pw-row--short'}${row.tail ? ' pw-row--tail' : ''}`,
        style: { gap: `${GAP}px`, height: `${Math.round(row.height)}px` },
      });
      row.items.forEach((it) => {
        const index = ordinal++;
        const figure = h('button', {
          class: 'pw-tile', type: 'button',
          style: { width: `${Math.round(it.dw)}px`, height: `${Math.round(it.dh)}px` },
          title: it.label || it.group?.name || 'Open full size',
          onclick: () => openLight(index, figure),
        },
          h('img', {
            src: media(`/uploads/Placements/${it.src.split('/').map(encodeURIComponent).join('/')}`),
            alt: it.label || it.group?.name || '',
            // The intrinsic size, so the browser reserves the right box.
            width: it.w, height: it.h,
            loading: 'eager', decoding: 'async',   // lazy never fires for tiles inside the scaled slide
            onerror: (e) => { e.target.closest('.pw-tile')?.remove(); },
          }),
          it.label ? h('span', { class: 'pw-tile__tag' }, it.label) : null,
          filtering() && it.pkgText ? h('span', { class: `pw-tile__pkg${it.intern ? ' is-intern' : ''}` }, it.pkgText) : null,
        );
        tiles.push(figure);
        rowEl.appendChild(figure);
      });
      stage.appendChild(rowEl);
    });
    reveal(tiles);
  }

  function drawChips() {
    chips.textContent = '';
    // Only worth showing where the folders carry meaning — company by company.
    const named = activeChapter.groups.filter((g) => g.name);
    if (named.length < 2) { chips.hidden = true; return; }
    chips.hidden = false;

    const chip = (label, value, count) => h('button', {
      class: `pw-chip${activeGroup === value ? ' is-on' : ''}`,
      type: 'button',
      onclick: () => { activeGroup = value; drawChips(); drawStage(); },
    }, h('span', {}, label), h('em', {}, String(count)));

    chips.appendChild(chip('All companies', null,
      activeChapter.groups.reduce((n, g) => n + g.images.length, 0)));
    named.forEach((g) => chips.appendChild(chip(g.name, g.name, g.images.length)));
  }

  function drawRail() {
    rail.textContent = '';
    chapters.forEach((c, i) => {
      const btn = h('button', {
        class: `pw-tab${c === activeChapter ? ' is-on' : ''}`,
        type: 'button',
        style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 70}ms` },
        onclick: () => pickChapter(c),
      },
        icon(c.icon || 'images', { class: 'ic ic--sm' }),
        h('span', { class: 'pw-tab__name' }, (c.name || '').toUpperCase()),
      );
      rail.appendChild(btn);
    });
  }

  /* --------------------------------------------------------------- header */
  const head = h('div', { class: 'pw-head' },
    /* Top header text removed per user request; buttons stay above */
    h('div', { class: 'pw-navwrap' }, rail),
    chips,
  );

  root.appendChild(head);
  root.appendChild(h('div', { class: 'pw-body' }, side, stage));

  function pickChapter(c) {
    if (c === activeChapter) return;
    activeChapter = c;
    activeGroup = null;
    band = null;
    company = null;
    drawRail(); drawChips(); drawSide(); drawStage();
  }

  /* The chapters turn on their own while the deck plays — a fuller chapter holds a little
     longer — and Next / Prev step through them while it is paused. */
  if (!editing && chapters.length > 1) {
    registerStepper((delta) => {
      const i = chapters.indexOf(activeChapter) + (delta > 0 ? 1 : -1);
      if (i < 0 || i >= chapters.length) return false;
      pickChapter(chapters[i]);
      return true;
    }, {
      /* Poster walls with a filter hold 15 s, while one is in use 20 s; the journeys and the
         company photographs 8 s. */
      auto: () => (activeChapter.filters ? (band || company ? 20000 : 15000) : 8000),
      next: () => { pickChapter(chapters[(chapters.indexOf(activeChapter) + 1) % chapters.length]); return true; },
    });
  }

  drawRail();
  drawChips();
  drawSide();
  drawStage();

  /* The first pass ran before the slide was in the document, so it solved
     against the fallback height. Once the real one is known, solve again — only
     if it actually differs, or every chapter change would draw twice. */
  const settle = () => {
    if (!root.isConnected) { requestAnimationFrame(settle); return; }
    if (stage.clientHeight && Math.abs(stage.clientHeight - lastStageH) > 4) drawStage();
  };
  requestAnimationFrame(settle);

  const ro = new ResizeObserver(() => {
    if (stage.clientHeight && Math.abs(stage.clientHeight - lastStageH) > 4) drawStage();
  });
  ro.observe(stage);

  /* The lightbox lives on the body, so it has to be taken down by hand when the
     slide it belongs to is replaced. */
  const observer = new MutationObserver(() => {
    if (!root.isConnected) {
      light.remove();
      ro.disconnect();
      observer.disconnect();
      document.removeEventListener('keydown', onLightKey, true);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return root;
}
