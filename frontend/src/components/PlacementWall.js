import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

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

  const solveRow = (items_, partial, allowFill) => {
    const avail = width - gap * (items_.length - 1);
    const arTotal = items_.reduce((n, it) => n + it.w / it.h, 0);
    const solved = avail / arTotal;
    /* A leftover tail holding one wide photo would solve to something enormous
       beside the rows above it, so a partial row normally keeps the target
       height. `allowFill` is the exception: when the whole selection is a single
       row there is nothing above it to tower over, and capping it left a company
       with two photographs sitting 242px tall in 592px of stage. */
    const height = Math.min(
      partial && !allowFill ? Math.min(solved, targetH * 1.08) : solved,
      maxH,
    );
    return {
      height,
      full: height >= solved - 0.5 && height < maxH + 0.5,
      items: items_.map((it) => ({ ...it, dw: height * (it.w / it.h), dh: height })),
    };
  };

  const flush = (partial) => {
    if (!row.length) return;
    rows.push(solveRow(row, partial, false));
    row = [];
    arSum = 0;
  };

  items.forEach((it) => {
    if (!it.w || !it.h) return;
    row.push(it);
    arSum += it.w / it.h;
    // Close the row once scaling to the target height would overflow the width.
    if (arSum * targetH + gap * (row.length - 1) >= width) flush(false);
  });
  flush(true);

  /* One row for the whole selection — a short chapter, or a company with two
     photographs. Re-solve it filling the width, which is what "fill the screen"
     means when the aspect ratios have to be honoured: the height follows from
     the width, and only the stage can cap it. */
  if (rows.length === 1) {
    const only = rows[0].items;
    if (only.length) return [solveRow(only, true, true)];
  }
  return rows;
}

/** A row height that suits the material: cards read small, photographs larger. */
const targetHeightFor = (kind, count) => {
  if (kind === 'journey') return 520;
  if (kind === 'poster') return count > 24 ? 196 : 232;
  return 224;
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
    onclick: (e) => { e.stopPropagation(); step(-1); },
  }, icon('chevron-left', { class: 'ic' }));
  const nextBtn = h('button', {
    class: 'pw-light__nav pw-light__nav--next', type: 'button', 'aria-label': 'Next image',
    onclick: (e) => { e.stopPropagation(); step(1); },
  }, icon('chevron-right', { class: 'ic' }));

  const light = h('div', {
    class: 'pw-light', hidden: true,
    onclick: (e) => { if (e.target === light || e.target.closest('.pw-light__close')) closeLight(); },
  },
    h('button', { class: 'pw-light__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    prevBtn, nextBtn,
    h('figure', { class: 'pw-light__frame' }, lightImg,
      h('figcaption', { class: 'pw-light__foot' }, lightCap, lightMeta, lightCount)),
  );
  document.body.appendChild(light);

  /* The tile the open image came out of, so it can go back into it. */
  let fromTile = null;

  function closeLight() {
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
    if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); step(-1); }
  }
  /** Wraps, so the arrows never dead-end mid-presentation. */
  function step(delta) {
    if (shown.length < 2) return;
    atIndex = (atIndex + delta + shown.length) % shown.length;
    paint();
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
  }

  /* --------------------------------------------------------------- header */
  const stage = h('div', { class: 'pw-stage' });
  const chips = h('div', { class: 'pw-chips' });
  const rail = h('div', { class: 'pw-rail' });

  let activeChapter = chapters[0];
  let activeGroup = null; // null means every group in the chapter
  let lastStageH = 0;     // the stage height the current rows were solved against

  /* --------------------------------------------------------------- render */
  const reveal = (tiles) => {
    if (REDUCED?.matches) { tiles.forEach((t) => t.classList.add('is-in')); return; }
    /* Reading order, and capped: past about twenty the stagger stops adding
       anything and only delays the last tile past the presenter's patience. */
    tiles.forEach((tile, i) => {
      tile.style.transitionDelay = `${Math.min(i, 20) * 26}ms`;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { root: stage, rootMargin: '80px 0px' });
    tiles.forEach((t) => io.observe(t));
  };

  function drawStage() {
    stage.textContent = '';
    stage.scrollTop = 0;

    const groups = activeGroup
      ? activeChapter.groups.filter((g) => g.name === activeGroup)
      : activeChapter.groups;

    const flat = groups.flatMap((g) => g.images.map((im) => ({ ...im, group: g })));
    const width = CANVAS - EDGE * 2;
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
    stage.classList.toggle('is-short', totalH <= contentH + 1);

    const tiles = [];
    let ordinal = 0;
    rows.forEach((row) => {
      const rowEl = h('div', {
        class: `pw-row${row.full ? '' : ' pw-row--short'}`,
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
            loading: 'lazy', decoding: 'async',
          }),
          it.label ? h('span', { class: 'pw-tile__tag' }, it.label) : null,
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
      const n = c.groups.reduce((sum, g) => sum + g.images.length, 0);
      const btn = h('button', {
        class: `pw-tab${c === activeChapter ? ' is-on' : ''}`,
        type: 'button',
        style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 70}ms` },
        onclick: () => {
          if (c === activeChapter) return;
          activeChapter = c;
          activeGroup = null;
          drawRail(); drawChips(); drawStage();
        },
      },
        icon(c.icon || 'images', { class: 'ic ic--sm' }),
        h('span', { class: 'pw-tab__text' },
          h('span', { class: 'pw-tab__name' }, c.name),
          h('span', { class: 'pw-tab__n' }, countLabel(n, c.kind)),
        ),
      );
      rail.appendChild(btn);
    });
  }

  /* Centred, and the navigation comes first. The old head put a left-aligned
     title over a left-aligned row of tabs, which left the page reading as three
     things stacked in a corner. One column down the middle — title, then the
     chapter pill, then the company chips — gives the gallery beneath it a centre
     line to sit on. */
  const head = h('div', { class: 'pw-head' },
    h('div', { class: 'pw-head__top' },
      block.eyebrow ? h('p', { class: 'pw-eyebrow' }, block.eyebrow) : null,
      h('h2', { class: 'pw-title' }, block.title || 'Placements'),
      h('span', { class: 'pw-rule' }),
      block.lead ? h('p', { class: 'pw-lead' }, block.lead) : null,
    ),
    h('div', { class: 'pw-navwrap' }, rail),
    chips,
  );

  root.appendChild(head);
  root.appendChild(stage);

  drawRail();
  drawChips();
  drawStage();

  /* The first pass ran before the slide was in the document, so it solved
     against the fallback height. Once the real one is known, solve again — only
     if it actually differs, or every chapter change would draw twice. */
  const settle = () => {
    if (!root.isConnected) { requestAnimationFrame(settle); return; }
    if (stage.clientHeight && Math.abs(stage.clientHeight - lastStageH) > 8) drawStage();
  };
  requestAnimationFrame(settle);

  /* The lightbox lives on the body, so it has to be taken down by hand when the
     slide it belongs to is replaced. */
  const observer = new MutationObserver(() => {
    if (!root.isConnected) {
      light.remove();
      observer.disconnect();
      document.removeEventListener('keydown', onLightKey, true);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return root;
}
