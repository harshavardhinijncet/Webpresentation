import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { upload } from '../utils/media.js';

/**
 * Certifications: a vendor rail, and a wall that never crops a certificate.
 *
 * Each file here is a finished branded card — the cohort photograph, the vendor
 * badge, the words "THE TEAM OF 136 CERTIFIED TRAINEES", the Technical Hub and
 * college logos, all set into the image by whoever published it. That makes the
 * one rule for this page obvious: nothing may be cropped and nothing may be
 * stretched, because either one cuts into a name, a count or a badge. Every tile
 * keeps its own aspect ratio to the pixel.
 *
 * Where it parts company with the Placements gallery is how the row height is
 * found. That gallery solves each row against the width it has to fill, which is
 * right for photographs of every shape and wrong for these: a row of square
 * cards is always far wider than it is tall, so filling the width strands the
 * stage in white. `packRows` solves the width and the height together instead,
 * and picks the column count that makes the cards biggest. Nothing is guessed.
 *
 * The trailing number on each filename is deliberately not printed. It is a
 * cohort size in "AWS Cloud Practioner_136" and a plain sequence number in
 * "CCNA Routing and Switching_1", with nothing in the filename to tell the two
 * apart — so showing either as a figure would be inventing a metric. The count
 * is already set into the artwork, and the lightbox counter separates one cohort
 * from the next.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* Layout pixels, not measured ones. The stage sits inside FitSlide's transform,
   so a bounding rect would come back scaled and the solver would be working in
   the wrong unit. The nominal canvas is 1600; the rail and the gutters come off
   it here. */
const CANVAS = 1600;
const EDGE = 26;
const RAIL = 250;
const SPLIT = 22;
const GAP = 12;
const STAGE_W = CANVAS - EDGE * 2 - RAIL - SPLIT;

/* One glyph per vendor, by keyword from the deck's own icon family. Deliberately
   not the vendors' marks: no official logo files exist in this library, and
   hand-drawing someone else's trademark is worse than not showing it. */
const GLYPH = {
  aws: 'server',
  microsoft: 'grid-4',
  'google-cloud': 'globe',
  oracle: 'layers',
  redhat: 'terminal',
  cisco: 'route',
  juniper: 'swap',
  'pearson-it-specialist': 'code',
  servicenow: 'checklist',
  pega: 'workflow',
  salesforce: 'users',
  'automation-anywhere': 'gear',
  postman: 'link',
  unity: 'cube',
  'arduino-iot': 'chip',
  adobe: 'image',
  comptia: 'shield',
  mile2: 'target',
  others: 'medal',
};

/* How much smaller a card may be before a wider wall stops being worth it. */
const SIZE_TOLERANCE = 0.95;

/**
 * Choose the column count that fills the stage best.
 *
 * The Placements gallery solves each row against the width it has to fill, which
 * is right for photographs of every shape and wrong for these. Five square AWS
 * cards in one row come to 246px and leave 190px of white above *and* below,
 * because a row of squares is always far wider than it is tall. Filling the width
 * is not the same as filling the stage.
 *
 * So both bounds are solved for every column count: a shared card height is the
 * smaller of what the widest row can afford and what the stage has left once the
 * row gaps are paid. Aspect ratios are untouched throughout — a width is always
 * the shared height times that file's own ratio, so nothing is cropped and
 * nothing is stretched.
 *
 * Then two things are wanted at once, and taking either alone gives a worse page:
 *
 *   Biggest card wins outright when it is decisively bigger. Five AWS cards go
 *   from one row of 246px to 3 + 2 at 315px — half again as large.
 *
 *   Otherwise the widest wall wins. Microsoft's eleven cards measure 206px as
 *   4 / 4 / 3 and 203px as 6 / 5 — the same card, but the first leaves 416px of
 *   white down the sides, and a narrow island reads as a small page no matter how
 *   completely it fills its own height.
 *
 * Hence the tolerance: within five percent on card size, the wider wall takes it.
 *
 * A half-empty last row is refused outright, not merely deprecated. Preferring
 * width alone put the five AWS cards on screen as 4 + 1 the moment presentation
 * mode gave the stage more height — a single card stranded under a full row, which
 * looks like a load that failed rather than a wall. The gate only lifts if no
 * arrangement satisfies it.
 */
function packRows(items, width, contentH) {
  const n = items.length;
  if (!n) return [];
  const aspect = (it) => it.w / it.h;
  const candidates = [];

  for (let c = 1; c <= n; c += 1) {
    const groups = [];
    for (let i = 0; i < n; i += c) groups.push(items.slice(i, i + c));
    const rows = groups.length;
    // What the stage has left for the cards once the gaps between rows are paid.
    const byHeight = (contentH - GAP * (rows - 1)) / rows;
    if (byHeight <= 0) continue;
    /* What the tightest row can afford. The partial last row holds fewer cards so
       it could always go taller; the filled rows are what binds. */
    const spans = groups.map((g) => g.reduce((sum, it) => sum + aspect(it), 0));
    const byWidth = Math.min(...groups.map((g, i) => (width - GAP * (g.length - 1)) / spans[i]));
    const height = Math.min(byHeight, byWidth);
    // How much of the width the widest row actually covers at that height.
    const used = Math.max(...groups.map((g, i) => height * spans[i] + GAP * (g.length - 1)));
    // How empty the last row is, as a fraction of a full one.
    const ragged = rows > 1 ? (c * rows - n) / c : 0;
    candidates.push({ groups, height, used, ragged });
  }

  /* Nothing fits at all — a stage shorter than a single card. Let it scroll
     rather than crop, which is the standing rule for this material. */
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

const plural = (n) => `${n} ${n === 1 ? 'certification' : 'certifications'}`;

export function CertificationWall(block, { editing = false } = {}) {
  const vendors = (block.vendors || []).filter((v) => v.certs?.length);
  const root = h('div', { class: 'cw-root ph-root' });

  if (!vendors.length) {
    root.appendChild(h('div', { class: 'cw-empty' },
      h('h2', { class: 'cw-title' }, block.title || 'Certifications'),
      editing
        ? h('p', { class: 'cw-hint' },
            'Drop the cards into backend/uploads/certifications/ and re-run the publish step.')
        : null,
    ));
    return root;
  }

  const total = vendors.reduce((n, v) => n + v.certs.length, 0);
  const src = (cert) => upload(cert.src.split('/').map(encodeURIComponent).join('/'));

  /* ------------------------------------------------------------- lightbox */
  /* Portalled to the body. FitSlide scales the slide with a transform, and a
     transformed ancestor becomes the containing block for fixed descendants — so
     inside the slide, `inset: 0` would resolve to the 1600×900 slide box and not
     the screen. */
  const lightImg = h('img', { class: 'cw-light__img', alt: '' });
  const lightCap = h('p', { class: 'cw-light__cap' });
  const lightMeta = h('span', { class: 'cw-light__meta' });
  const lightCount = h('span', { class: 'cw-light__count' });

  /* Whatever the wall is showing, in reading order, so the arrows walk the same
     sequence the eye does. Rebuilt by drawStage. */
  let shown = [];
  let at = 0;
  let fromTile = null;

  const prevBtn = h('button', {
    class: 'cw-light__nav cw-light__nav--prev', type: 'button', 'aria-label': 'Previous certificate',
    onclick: (e) => { e.stopPropagation(); step(-1); },
  }, icon('chevron-left', { class: 'ic' }));
  const nextBtn = h('button', {
    class: 'cw-light__nav cw-light__nav--next', type: 'button', 'aria-label': 'Next certificate',
    onclick: (e) => { e.stopPropagation(); step(1); },
  }, icon('chevron-right', { class: 'ic' }));

  const light = h('div', {
    class: 'cw-light', hidden: true,
    onclick: (e) => { if (e.target === light || e.target.closest('.cw-light__close')) shut(); },
  },
    h('button', { class: 'cw-light__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    prevBtn, nextBtn,
    h('figure', { class: 'cw-light__frame' }, lightImg,
      h('figcaption', { class: 'cw-light__foot' }, lightCap, lightMeta, lightCount)),
  );
  document.body.appendChild(light);

  function shut() {
    document.removeEventListener('keydown', onKey, true);
    /* Fly back into the tile it came out of, which is what makes it read as one
       object moving. Once the arrows have walked on, no tile matches what is on
       screen any more, so that case simply fades. */
    const target = fromTile && shown[at] === fromTile.item ? fromTile.el : null;
    if (!target || REDUCED?.matches) {
      light.hidden = true;
      light.classList.remove('is-on');
      return;
    }
    const to = target.getBoundingClientRect();
    const now = lightImg.getBoundingClientRect();
    const dx = (to.left + to.width / 2) - (now.left + now.width / 2);
    const dy = (to.top + to.height / 2) - (now.top + now.height / 2);
    lightImg.style.transition = 'transform 320ms cubic-bezier(.4,0,.6,1)';
    lightImg.style.transform =
      `translate(${dx}px, ${dy}px) scale(${to.width / now.width}, ${to.height / now.height})`;
    light.classList.remove('is-on');
    // Hidden only once it has arrived, or it vanishes mid-flight.
    setTimeout(() => {
      light.hidden = true;
      lightImg.style.transition = '';
      lightImg.style.transform = '';
    }, 330);
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); return; }
    /* Swallowed, or the deck's own arrow handler changes slide underneath the
       open certificate. */
    if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); step(-1); }
  }

  /** Wraps, so the arrows never dead-end mid-presentation. */
  function step(delta) {
    if (shown.length < 2) return;
    at = (at + delta + shown.length) % shown.length;
    paint();
  }

  function paint() {
    const it = shown[at];
    if (!it) return;
    // The full file at its own resolution — the one place nothing is scaled down.
    lightImg.src = src(it);
    lightImg.alt = it.label || '';
    lightCap.textContent = it.label || '';
    lightMeta.textContent = `${it.vendor} · ${it.w} × ${it.h}`;
    lightCount.textContent = shown.length > 1 ? `${at + 1} / ${shown.length}` : '';
    prevBtn.hidden = shown.length < 2;
    nextBtn.hidden = shown.length < 2;
    // Stepping must not inherit the previous flight's transform.
    lightImg.style.transition = '';
    lightImg.style.transform = '';
  }

  /**
   * Fly the certificate out of the tile that was clicked: the standard
   * invert-then-play. Measure where it lands, express the tile as an offset and
   * scale from there, commit that, then transition it away to nothing.
   *
   * Bounding rects on both sides, which is correct here even though the tile is
   * inside FitSlide's transform and the lightbox is on the body — a rect is in
   * viewport space either way, so the two are comparable. Offsets would not be.
   */
  function flyFrom(tile) {
    if (!tile || REDUCED?.matches) return;
    const from = tile.getBoundingClientRect();
    const play = () => {
      const to = lightImg.getBoundingClientRect();
      if (!to.width || !to.height || !from.width) return;
      const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      lightImg.style.transition = 'none';
      lightImg.style.transform =
        `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`;
      void lightImg.offsetWidth; // commit the inverted state before playing it
      lightImg.style.transition = 'transform 400ms cubic-bezier(.2,.7,.3,1)';
      lightImg.style.transform = 'none';
    };
    // The final box is only knowable once the file has decoded.
    if (lightImg.complete && lightImg.naturalWidth) requestAnimationFrame(play);
    else lightImg.addEventListener('load', () => requestAnimationFrame(play), { once: true });
  }

  function open(index, tile) {
    at = Math.max(0, index);
    fromTile = tile ? { el: tile, item: shown[at] } : null;
    paint();
    light.hidden = false;
    flyFrom(tile);
    requestAnimationFrame(() => light.classList.add('is-on'));
    document.addEventListener('keydown', onKey, true);
  }

  /* ----------------------------------------------------------------- state */
  const rail = h('nav', { class: 'cw-rail', 'aria-label': 'Certification vendors' });
  const stage = h('div', { class: 'cw-stage' });
  const banner = h('div', { class: 'cw-banner' });

  /* null is "every credential" — the scale shot. It opens on the first vendor
     instead, because eighty-two branded cards at once solve to about ninety
     pixels each and the type on them stops being readable, which defeats the
     point of not cropping them. */
  let active = vendors[0];
  let lastH = 0;

  const shownVendors = () => (active ? [active] : vendors);

  /* --------------------------------------------------------------- reveal */
  const reveal = (tiles) => {
    if (REDUCED?.matches) { tiles.forEach((t) => t.classList.add('is-in')); return; }
    /* Reading order, capped: past about twenty the stagger stops reading as
       sequence and only delays the last tile past the presenter's patience. */
    tiles.forEach((tile, i) => { tile.style.transitionDelay = `${Math.min(i, 20) * 24}ms`; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { root: stage, rootMargin: '80px 0px' });
    tiles.forEach((t) => io.observe(t));
  };

  /* ---------------------------------------------------------------- render */
  function drawBanner() {
    banner.textContent = '';
    const vs = shownVendors();
    const n = vs.reduce((sum, v) => sum + v.certs.length, 0);
    const skills = active ? (active.skills || []) : [];

    banner.appendChild(h('div', { class: 'cw-banner__id' },
      h('span', { class: 'cw-banner__glyph' },
        icon(active ? GLYPH[active.key] || 'certificate' : 'grid-4', { class: 'ic ic--sm' })),
      h('div', {},
        h('h3', { class: 'cw-banner__name' }, active ? active.name : 'Every credential'),
        h('p', { class: 'cw-banner__meta' },
          active ? active.domain || '' : `${vendors.length} vendors`,
          h('span', { class: 'cw-banner__dot' }, '·'),
          plural(n)),
      ),
    ));

    if (skills.length) {
      banner.appendChild(h('ul', { class: 'cw-skills' },
        ...skills.slice(0, 4).map((s, i) => h('li', {
          class: 'cw-skills__item',
          style: REDUCED?.matches ? {} : { 'animation-delay': `${120 + i * 70}ms` },
        }, icon('check', { class: 'ic ic--xs' }), h('span', {}, s))),
      ));
    }
  }

  function drawStage() {
    stage.textContent = '';
    stage.scrollTop = 0;

    const flat = shownVendors().flatMap((v) => v.certs.map((c) => ({ ...c, vendor: v.name })));
    /* clientHeight is layout, not post-transform, so it is safe to solve against
       — unlike a bounding rect, which comes back scaled by FitSlide. It reads 0
       before the first mount, hence the fallback and the ResizeObserver below. */
    lastH = stage.clientHeight;
    // The stage's own padding and each row's bottom margin come off first.
    const contentH = (lastH || 480) - 28 - GAP;
    const rows = packRows(flat, STAGE_W, contentH);

    shown = flat;

    /* Where the spare height goes: around the cards rather than under them.
       Centred reads as composition; bottom-stacked reads as a layout that ran out.
       Only when it fits — centring a scrolling stage would hide its first row
       above the fold. */
    const totalH = rows.reduce((n, r) => n + r.height + GAP, 0) - GAP;
    stage.classList.toggle('is-short', totalH <= contentH + 1);

    /* Every row starts on the same left edge, and the block of them is centred as
       one. Rows are not all the same width — a handful of these files are not
       square, so a fixed column count gives a row with a wide card in it more
       width than its neighbours — and centring each row independently made the
       eighty-two-card wall look like a grid that had come apart. One straight left
       edge and a ragged right one reads as a mosaic, which is what it is. */
    const wallW = Math.ceil(Math.max(...rows.map(
      (r) => r.items.reduce((n, it) => n + it.dw, 0) + GAP * (r.items.length - 1),
    )));
    const wall = h('div', { class: 'cw-wall', style: { width: `${Math.min(wallW, STAGE_W)}px` } });

    const tiles = [];
    let ordinal = 0;
    rows.forEach((row) => {
      const rowEl = h('div', {
        class: 'cw-row',
        style: { gap: `${GAP}px`, height: `${Math.round(row.height)}px` },
      });
      /* Rounding each width on its own drifted a filled row 2–3px past the stage,
         and the stage clips horizontally, so the right-hand certificate lost a
         visible sliver. The row therefore has to land on the margin exactly.
         Largest-remainder: floor every width, then hand the leftover pixels out
         one each to the tiles that were rounded down hardest. No tile moves more
         than a pixel from its true width, which matters — giving the whole drift
         to one tile put a 76px card 2.4% off its own aspect ratio, and keeping
         these aspect ratios is the entire reason this section exists. */
      const widths = row.items.map((it) => Math.floor(it.dw));
      if (row.full) {
        let spare = (STAGE_W - GAP * (widths.length - 1))
          - widths.reduce((n, w) => n + w, 0);
        const order = row.items
          .map((it, i) => ({ i, frac: it.dw - Math.floor(it.dw) }))
          .sort((a, b) => b.frac - a.frac);
        for (let k = 0; spare > 0 && order.length; k += 1, spare -= 1) {
          widths[order[k % order.length].i] += 1;
        }
      }

      row.items.forEach((it, col) => {
        const index = ordinal++;
        const tile = h('button', {
          class: 'cw-tile', type: 'button',
          style: { width: `${widths[col]}px`, height: `${Math.round(it.dh)}px` },
          title: `${it.label} — open full size`,
          onclick: () => open(index, tile),
        },
          h('img', {
            src: src(it), alt: it.label || '',
            // The intrinsic size, so the browser reserves the right box.
            width: it.w, height: it.h,
            loading: index < 12 ? 'eager' : 'lazy', decoding: 'async',
          }),
          h('span', { class: 'cw-tile__tag' },
            h('em', {}, it.label),
            active ? null : h('span', {}, it.vendor)),
          h('span', { class: 'cw-tile__zoom', 'aria-hidden': 'true' },
            icon('expand', { class: 'ic ic--xs' })),
        );
        tiles.push(tile);
        rowEl.appendChild(tile);
      });
      wall.appendChild(rowEl);
    });
    stage.appendChild(wall);
    reveal(tiles);
  }

  function drawRail() {
    rail.textContent = '';

    const entry = (label, sub, value, count, glyph, i) => {
      const on = active === value;
      const btn = h('button', {
        class: `cw-tab${on ? ' is-on' : ''}`,
        type: 'button', 'aria-current': on ? 'true' : 'false',
        style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 34}ms` },
        onclick: () => {
          if (active === value) return;
          active = value;
          drawRail(); drawBanner(); drawStage();
        },
      },
        h('span', { class: 'cw-tab__glyph' }, icon(glyph, { class: 'ic ic--xs' })),
        h('span', { class: 'cw-tab__text' },
          h('span', { class: 'cw-tab__name' }, label),
          sub ? h('span', { class: 'cw-tab__sub' }, sub) : null,
        ),
        h('span', { class: 'cw-tab__n' }, String(count)),
      );
      return btn;
    };

    rail.appendChild(entry('Every credential', `${vendors.length} vendors`, null, total, 'grid-4', 0));
    vendors.forEach((v, i) => rail.appendChild(
      entry(v.name, v.domain, v, v.certs.length, GLYPH[v.key] || 'certificate', i + 1),
    ));
  }

  /* ------------------------------------------------------------------ head */
  const head = h('div', { class: 'cw-head' },
    h('div', { class: 'cw-head__text' },
      block.eyebrow ? h('p', { class: 'cw-eyebrow' }, block.eyebrow) : null,
      h('h2', { class: 'cw-title' }, block.title || 'Certifications'),
      h('span', { class: 'cw-rule' }),
    ),
    block.lead ? h('p', { class: 'cw-lead' }, block.lead) : null,
    h('div', { class: 'cw-stats' },
      h('div', { class: 'cw-stat' },
        h('strong', {}, String(total)), h('span', {}, 'certification cards')),
      h('div', { class: 'cw-stat' },
        h('strong', {}, String(vendors.length)), h('span', {}, 'vendors and bodies')),
    ),
  );

  root.appendChild(head);
  root.appendChild(h('div', { class: 'cw-body' },
    rail,
    h('div', { class: 'cw-main' }, banner, stage),
  ));

  drawRail();
  drawBanner();
  drawStage();

  /* The first pass ran before the slide was in the document, so it solved against
     the fallback height — and the real height arrives in stages, not once. The
     banner's skill chips animate in from below, which grew the stage by 140px
     *after* a single settle-on-next-frame had already committed a layout, and the
     cards came out 245px tall where the packer had solved 315.

     So the stage is watched instead of sampled. Guarded on the same 8px threshold
     drawStage records, which is also what stops a loop: the stage takes its height
     from the flex row above it rather than from its own content, so a redraw does
     not move it and the observer settles after one pass. */
  const watchSize = new ResizeObserver(() => {
    if (stage.clientHeight && Math.abs(stage.clientHeight - lastH) > 8) drawStage();
  });
  watchSize.observe(stage);

  /* The lightbox lives on the body, so it has to be taken down by hand when the
     slide that owns it is replaced. */
  const watch = new MutationObserver(() => {
    if (!root.isConnected) {
      light.remove();
      watch.disconnect();
      watchSize.disconnect();
      document.removeEventListener('keydown', onKey, true);
    }
  });
  watch.observe(document.body, { childList: true, subtree: true });

  return root;
}
