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

  const flush = (partial) => {
    if (!row.length) return;
    const avail = width - gap * (row.length - 1);
    const solved = avail / arSum;
    /* A last row holding one wide photo would solve to something enormous;
       a partial row keeps the target height rather than filling the width. */
    const height = Math.min(partial ? Math.min(solved, targetH * 1.08) : solved, maxH);
    rows.push({
      height,
      full: !partial && height < maxH,
      items: row.map((it) => ({ ...it, dw: height * (it.w / it.h), dh: height })),
    });
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
  const light = h('div', {
    class: 'pw-light', hidden: true,
    onclick: (e) => { if (e.target === light || e.target.closest('.pw-light__close')) closeLight(); },
  },
    h('button', { class: 'pw-light__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    h('figure', { class: 'pw-light__frame' }, lightImg,
      h('figcaption', { class: 'pw-light__foot' }, lightCap, lightMeta)),
  );
  document.body.appendChild(light);

  function closeLight() {
    light.hidden = true;
    light.classList.remove('is-on');
    document.removeEventListener('keydown', onLightKey, true);
  }
  function onLightKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeLight(); }
  }
  function openLight(image, group) {
    /* The full file, at its own resolution — this is the one place the image is
       shown at native size, so it is the answer to "does the quality survive". */
    lightImg.src = media(`/uploads/Placements/${image.src.split('/').map(encodeURIComponent).join('/')}`);
    lightImg.alt = image.label || group?.name || '';
    lightCap.textContent = image.label || group?.name || '';
    lightMeta.textContent = `${image.w} × ${image.h}`;
    light.hidden = false;
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
    /* The journeys are three tall infographics meant to be read, so they take
       the whole stage and the target is the cap. Cards and photographs stay
       lower, or a single wide frame in a short row towers over the rows above. */
    const journey = activeChapter.kind === 'journey';
    const maxH = journey ? contentH : Math.min(348, contentH);
    const rows = justifyRows(flat, width, journey ? contentH : target, GAP, maxH);

    const tiles = [];
    rows.forEach((row) => {
      const rowEl = h('div', {
        class: `pw-row${row.full ? '' : ' pw-row--short'}`,
        style: { gap: `${GAP}px`, height: `${Math.round(row.height)}px` },
      });
      row.items.forEach((it) => {
        const figure = h('button', {
          class: 'pw-tile', type: 'button',
          style: { width: `${Math.round(it.dw)}px`, height: `${Math.round(it.dh)}px` },
          title: it.label || it.group?.name || 'Open full size',
          onclick: () => openLight(it, it.group),
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
        h('span', { class: 'pw-tab__name' }, c.name),
        h('span', { class: 'pw-tab__n' }, countLabel(n, c.kind)),
      );
      rail.appendChild(btn);
    });
  }

  const head = h('div', { class: 'pw-head' },
    h('div', { class: 'pw-head__top' },
      h('div', {},
        block.eyebrow ? h('p', { class: 'pw-eyebrow' }, block.eyebrow) : null,
        h('h2', { class: 'pw-title' }, block.title || 'Placements'),
        h('span', { class: 'pw-rule' }),
      ),
      block.lead ? h('p', { class: 'pw-lead' }, block.lead) : null,
    ),
    rail,
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
