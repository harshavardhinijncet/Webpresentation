import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { upload } from '../utils/media.js';

/**
 * Certifications, in three acts.
 *
 *   01 The Register    — the badges as a constellation, the totals, the claim.
 *   02 Skills Unlocked — what each credential actually tests.
 *   03 The Gallery     — the cohort artwork, one card per batch that passed.
 *
 * The three exist because there are two different bodies of evidence here and
 * they answer different questions. The register is the catalogue: forty-two named
 * credentials, twenty-two awarding bodies, and how many trainees hold each one.
 * The gallery is the proof: eighty-two published cards, each one a batch with its
 * count and its photograph already set into the artwork. Showing only the
 * catalogue is a list of claims; showing only the artwork is a wall with no total.
 *
 * Every badge is a local file. The catalogue pointed at eight different CDNs and
 * this deck is presented with no network, so the artwork is downloaded at publish
 * time and served by the app. One badge the CDN refuses to release carries none,
 * and its card falls back to the vendor set in type — which is the same bargain
 * every image in this deck makes.
 *
 * Nothing here is rounded up. The register totals 31,920 exactly, so it says
 * 31,920: "32,000+" would be claiming eighty certifications that were not earned.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* Layout pixels, not measured ones — the page sits inside FitSlide's transform,
   so a bounding rect comes back scaled and would solve in the wrong unit. */
const CANVAS = 1600;
const GAP = 12;

const ACTS = [
  { key: 'register', num: '01', name: 'The Register' },
  { key: 'skills', num: '02', name: 'Skills Unlocked' },
  { key: 'gallery', num: '03', name: 'The Gallery' },
];

/* One glyph per vendor, by keyword from the deck's own icon family. Deliberately
   not the vendors' marks: hand-drawing someone else's trademark is worse than not
   showing it, and the real badge artwork is doing that job on this page anyway. */
const GLYPH = {
  aws: 'server', microsoft: 'grid-4', 'google-cloud': 'globe', oracle: 'layers',
  redhat: 'terminal', cisco: 'route', juniper: 'swap', 'pearson-it-specialist': 'code',
  servicenow: 'checklist', pega: 'workflow', salesforce: 'users',
  'automation-anywhere': 'gear', postman: 'link', unity: 'cube', 'arduino-iot': 'chip',
  adobe: 'image', comptia: 'shield', mile2: 'target', others: 'medal',
};

const nf = (n) => Number(n || 0).toLocaleString('en-US');

/* A stable pseudo-random from a string. The constellation must land in the same
   place on every render — Math.random would reshuffle the badges each time the
   act is opened, and a composition that moves is a composition nobody trusts. */
function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return ((x >>> 0) % 10000) / 10000;
}

/**
 * Scatter the badges around the edge of the stage, clear of the middle.
 *
 * The reference composition is an arc that opens across the top and falls down
 * both flanks, with the type sitting in the clear space it leaves. So a badge's
 * angle comes from its position in the list and its distance from a per-badge
 * hash — deterministic, so the arrangement is identical every time — and the
 * centre band is simply never used.
 */
function constellation(items) {
  const n = items.length;
  return items.map((it, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    /* 190° to 350° sweeps the top and both sides; the gap at the bottom is where
       the quote goes. */
    const angle = (196 + t * 148) * (Math.PI / 180);
    const jitter = hash(it.name);
    /* Radii kept well inside the box. At 46-57% the badges on the flanks were
       sliced off by the panel edge, which reads as a bug rather than a field. */
    const rx = 36 + jitter * 8;           // percentage radii, so it scales
    const ry = 27 + hash(it.vendor) * 9;
    return {
      ...it,
      left: 50 + Math.cos(angle) * rx,
      top: 52 + Math.sin(angle) * ry,
      size: 34 + Math.round(jitter * 22),
      delay: Math.round(i * 34),
      depth: jitter,
    };
  });
}

/* ------------------------------------------------------------ the cohort wall */
/* Unchanged from the version this page grew out of, and still the only honest way
   to lay these out: the width and the height are solved together, because a row
   of square cards is always far wider than it is tall and filling the width alone
   strands the stage in white. */
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
  const credentials = (block.credentials || []).filter((c) => c.name);
  const root = h('div', { class: 'cs-root ph-root' });

  if (!vendors.length && !credentials.length) {
    root.appendChild(h('div', { class: 'cs-empty' },
      h('h2', { class: 'cs-title' }, block.title || 'Certifications'),
      editing
        ? h('p', { class: 'cs-hint' },
            'Drop the cards into backend/uploads/certifications/ and re-run the publish step.')
        : null,
    ));
    return root;
  }

  const cards = vendors.reduce((n, v) => n + v.certs.length, 0);
  const earned = credentials.reduce((n, c) => n + (c.held || 0), 0);
  const bodies = new Set(credentials.map((c) => c.vendor)).size;

  let act = ACTS[0].key;
  const src = (p) => upload(String(p).split('/').map(encodeURIComponent).join('/'));

  /* --------------------------------------------------------------- lightbox */
  /* Portalled to the body. FitSlide scales the slide with a transform, and a
     transformed ancestor becomes the containing block for fixed descendants — so
     inside the slide `inset: 0` resolves to the 1600×900 slide box, not the
     screen. */
  const lightImg = h('img', { class: 'cs-light__img', alt: '' });
  const lightCap = h('p', { class: 'cs-light__cap' });
  const lightMeta = h('span', { class: 'cs-light__meta' });
  const lightCount = h('span', { class: 'cs-light__count' });
  let shown = [];
  let at = 0;

  const prevBtn = h('button', {
    class: 'cs-light__nav cs-light__nav--prev', type: 'button', 'aria-label': 'Previous',
    onclick: (e) => { e.stopPropagation(); step(-1); },
  }, icon('chevron-left', { class: 'ic' }));
  const nextBtn = h('button', {
    class: 'cs-light__nav cs-light__nav--next', type: 'button', 'aria-label': 'Next',
    onclick: (e) => { e.stopPropagation(); step(1); },
  }, icon('chevron-right', { class: 'ic' }));

  const light = h('div', {
    class: 'cs-light', hidden: true,
    onclick: (e) => { if (e.target === light || e.target.closest('.cs-light__close')) shut(); },
  },
    h('button', { class: 'cs-light__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    prevBtn, nextBtn,
    h('figure', { class: 'cs-light__frame' }, lightImg,
      h('figcaption', { class: 'cs-light__foot' }, lightCap, lightMeta, lightCount)),
  );
  document.body.appendChild(light);

  function shut() {
    light.hidden = true;
    light.classList.remove('is-on');
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); return; }
    // Swallowed, or the deck's own arrow handler changes slide underneath.
    if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); step(-1); }
  }
  function step(d) {
    if (shown.length < 2) return;
    at = (at + d + shown.length) % shown.length;
    paintLight();
  }
  function paintLight() {
    const it = shown[at];
    if (!it) return;
    // The full file at its own resolution — the answer to "does the quality survive".
    lightImg.src = src(it.src);
    lightImg.alt = it.label || '';
    lightCap.textContent = it.label || '';
    lightMeta.textContent = `${it.vendor} · ${it.w} × ${it.h}`;
    lightCount.textContent = shown.length > 1 ? `${at + 1} / ${shown.length}` : '';
    prevBtn.hidden = shown.length < 2;
    nextBtn.hidden = shown.length < 2;
  }
  function openLight(list, i) {
    shown = list;
    at = Math.max(0, i);
    paintLight();
    light.hidden = false;
    requestAnimationFrame(() => light.classList.add('is-on'));
    document.addEventListener('keydown', onKey, true);
  }

  /* ============================================================== 01 REGISTER */
  const stage1 = h('div', { class: 'cs-reg' });

  function drawRegister() {
    const withBadge = credentials.filter((c) => c.badge);
    const placed = constellation(withBadge.length ? withBadge : credentials);

    stage1.replaceChildren(
      /* Their own cohort panorama, held right back. The reference sets this type
         over a crowd, and using a real one of theirs beats any stock ground. */
      block.backdrop
        ? h('div', { class: 'cs-reg__back', 'aria-hidden': 'true' },
            h('img', { src: src(block.backdrop), alt: '', decoding: 'async' }))
        : null,
      h('div', { class: 'cs-sky', 'aria-hidden': 'true' },
        ...placed.map((p) => h('span', {
          class: 'cs-sky__b',
          style: {
            left: `${p.left}%`, top: `${p.top}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            /* Depth by opacity and blur rather than by size alone, so the arc
               reads as a field the eye can travel into instead of a flat ring. */
            opacity: String(0.42 + p.depth * 0.58),
            filter: p.depth < 0.28 ? 'blur(1.1px)' : 'none',
            'animation-delay': REDUCED?.matches ? '0ms' : `${p.delay}ms`,
          },
          title: p.name,
        }, p.badge
          ? h('img', { src: src(p.badge), alt: '', loading: 'lazy', decoding: 'async' })
          : h('em', {}, (p.vendor || '?').slice(0, 2).toUpperCase()))),
      ),
      h('div', { class: 'cs-reg__mid' },
        h('div', { class: 'cs-figs' },
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(earned)),
            h('span', {}, 'certifications earned')),
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(credentials.length)),
            h('span', {}, 'distinct credentials')),
          h('div', { class: 'cs-fig' },
            h('strong', {}, nf(bodies)),
            h('span', {}, 'awarding bodies')),
        ),
        block.quote
          ? h('blockquote', { class: 'cs-quote' },
              h('p', {}, `“${block.quote}”`),
              block.quoteBy ? h('cite', {}, block.quoteBy) : null,
            )
          : null,
      ),
    );
  }

  /* ================================================================ 02 SKILLS */
  const skillList = h('div', { class: 'cs-cred' });
  const skillPane = h('div', { class: 'cs-skill' });
  let pick = 0;

  function drawSkills() {
    const sorted = [...credentials].sort((a, b) => b.held - a.held);

    skillList.replaceChildren(...sorted.map((c, i) => h('button', {
      class: `cs-cred__row${i === pick ? ' is-on' : ''}`,
      type: 'button',
      style: REDUCED?.matches ? {} : { '--i': String(Math.min(i, 30)) },
      onclick: () => { pick = i; drawSkills(); },
    },
      h('span', { class: 'cs-cred__mark' }, c.badge
        ? h('img', { src: src(c.badge), alt: '', loading: 'lazy', decoding: 'async' })
        : h('em', {}, (c.vendor || '?').slice(0, 2).toUpperCase())),
      h('span', { class: 'cs-cred__text' },
        h('span', { class: 'cs-cred__name' }, c.name),
        h('span', { class: 'cs-cred__vendor' }, c.vendor),
      ),
      h('span', { class: 'cs-cred__held' }, nf(c.held)),
    )));

    const c = sorted[pick];
    if (!c) { skillPane.replaceChildren(); return; }
    skillPane.replaceChildren(
      h('div', { class: 'cs-skill__head' },
        h('span', { class: 'cs-skill__mark' }, c.badge
          ? h('img', { src: src(c.badge), alt: '' })
          : h('em', {}, (c.vendor || '?').slice(0, 2).toUpperCase())),
        h('div', {},
          h('p', { class: 'cs-skill__vendor' }, `${c.vendor} · ${c.domain}`),
          h('h3', { class: 'cs-skill__name' }, c.name),
        ),
      ),
      h('div', { class: 'cs-skill__count' },
        h('strong', {}, nf(c.held)),
        h('span', {}, c.held === 1 ? 'trainee holds it' : 'trainees hold it'),
      ),
      h('p', { class: 'cs-skill__label' }, 'What it tests'),
      h('ol', { class: 'cs-skill__list' },
        ...c.skills.map((s, i) => h('li', {
          style: REDUCED?.matches ? {} : { '--i': String(i) },
        }, h('em', {}, String(i + 1).padStart(2, '0')), h('span', {}, s))),
      ),
    );
  }

  /* =============================================================== 03 GALLERY */
  const rail = h('nav', { class: 'cs-rail', 'aria-label': 'Certification vendors' });
  const banner = h('div', { class: 'cs-banner' });
  const wallStage = h('div', { class: 'cs-stage' });
  let vendor = vendors[0] || null;
  let lastH = 0;

  const shownVendors = () => (vendor ? [vendor] : vendors);
  const RAIL_W = 250;
  const STAGE_W = CANVAS - 52 - RAIL_W - 22;

  function drawBanner() {
    const vs = shownVendors();
    const n = vs.reduce((sum, v) => sum + v.certs.length, 0);
    banner.replaceChildren(
      h('div', { class: 'cs-banner__id' },
        h('span', { class: 'cs-banner__glyph' },
          icon(vendor ? GLYPH[vendor.key] || 'certificate' : 'grid-4', { class: 'ic ic--sm' })),
        h('div', {},
          h('h3', { class: 'cs-banner__name' }, vendor ? vendor.name : 'Every credential'),
          h('p', { class: 'cs-banner__meta' },
            `${vendor ? vendor.domain || '' : `${vendors.length} vendors`} · ${n} card${n === 1 ? '' : 's'}`),
        ),
      ),
    );
  }

  function drawWall() {
    wallStage.textContent = '';
    wallStage.scrollTop = 0;
    const flat = shownVendors().flatMap((v) => v.certs.map((c) => ({ ...c, vendor: v.name })));
    /* clientHeight is layout, not post-transform, so it is safe to solve against
       — unlike a bounding rect, which comes back scaled by FitSlide. */
    lastH = wallStage.clientHeight;
    const contentH = (lastH || 480) - 28 - GAP;
    const rows = packRows(flat, STAGE_W, contentH);

    const totalH = rows.reduce((n, r) => n + r.height + GAP, 0) - GAP;
    wallStage.classList.toggle('is-short', totalH <= contentH + 1);

    /* Every row starts on the same left edge and the block of them is centred as
       one. A few of these files are not square, so a fixed column count gives the
       row holding a wide card more width than its neighbours, and centring each
       row on its own made the full wall look like a grid that had come apart. */
    const wallW = Math.ceil(Math.max(...rows.map(
      (r) => r.items.reduce((n, it) => n + it.dw, 0) + GAP * (r.items.length - 1),
    )));
    const wall = h('div', { class: 'cs-wall', style: { width: `${Math.min(wallW, STAGE_W)}px` } });

    let ordinal = 0;
    rows.forEach((row) => {
      const rowEl = h('div', {
        class: 'cs-row',
        style: { gap: `${GAP}px`, height: `${Math.round(row.height)}px` },
      });
      /* Largest-remainder widths: floor every one, then hand the leftover pixels
         to the tiles rounded down hardest. Giving the whole drift to a single tile
         put a 76px card 2.4% off its own aspect ratio, and keeping these ratios is
         the entire reason this wall exists. */
      const widths = row.items.map((it) => Math.floor(it.dw));
      if (row.full) {
        let spare = (STAGE_W - GAP * (widths.length - 1)) - widths.reduce((n, w) => n + w, 0);
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
          class: 'cs-tile', type: 'button',
          style: { width: `${widths[col]}px`, height: `${Math.round(it.dh)}px` },
          title: `${it.label} — open full size`,
          onclick: () => openLight(flat, index),
        },
          h('img', {
            src: src(it.src), alt: it.label || '',
            // The intrinsic size, so the browser reserves the right box.
            width: it.w, height: it.h,
            loading: index < 12 ? 'eager' : 'lazy', decoding: 'async',
          }),
          h('span', { class: 'cs-tile__tag' },
            h('em', {}, it.label),
            vendor ? null : h('span', {}, it.vendor)),
          h('span', { class: 'cs-tile__zoom', 'aria-hidden': 'true' },
            icon('expand', { class: 'ic ic--xs' })),
        );
        rowEl.appendChild(tile);
      });
      wall.appendChild(rowEl);
    });
    wallStage.appendChild(wall);
  }

  function drawRail() {
    rail.textContent = '';
    const entry = (label, sub, value, count, glyph, i) => h('button', {
      class: `cs-tab${vendor === value ? ' is-on' : ''}`,
      type: 'button', 'aria-current': vendor === value ? 'true' : 'false',
      style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 30}ms` },
      onclick: () => {
        if (vendor === value) return;
        vendor = value;
        drawRail(); drawBanner(); drawWall();
      },
    },
      h('span', { class: 'cs-tab__glyph' }, icon(glyph, { class: 'ic ic--xs' })),
      h('span', { class: 'cs-tab__text' },
        h('span', { class: 'cs-tab__name' }, label),
        sub ? h('span', { class: 'cs-tab__sub' }, sub) : null),
      h('span', { class: 'cs-tab__n' }, String(count)),
    );
    rail.appendChild(entry('Every credential', `${vendors.length} vendors`, null, cards, 'grid-4', 0));
    vendors.forEach((v, i) => rail.appendChild(
      entry(v.name, v.domain, v, v.certs.length, GLYPH[v.key] || 'certificate', i + 1)));
  }

  /* =================================================================== chrome */
  const steps = h('nav', { class: 'cs-steps', role: 'tablist' });
  const acts = h('div', { class: 'cs-acts' });

  function drawSteps() {
    steps.replaceChildren(...ACTS.map((a) => h('button', {
      class: `cs-step${a.key === act ? ' is-on' : ''}`,
      type: 'button', role: 'tab', 'aria-selected': String(a.key === act),
      onclick: () => { if (a.key !== act) { act = a.key; drawSteps(); showAct(); } },
    },
      h('em', {}, a.num),
      h('span', {}, a.name),
    )));
  }

  function showAct() {
    acts.dataset.act = act;
    if (act === 'register') drawRegister();
    if (act === 'skills') drawSkills();
    if (act === 'gallery') { drawRail(); drawBanner(); drawWall(); }
  }

  const head = h('div', { class: 'cs-head' },
    h('div', {},
      block.eyebrow ? h('p', { class: 'cs-eyebrow' }, block.eyebrow) : null,
      h('h2', { class: 'cs-title' }, block.title || 'Certifications'),
    ),
    steps,
  );

  acts.append(
    h('section', { class: 'cs-act cs-act--register' }, stage1),
    h('section', { class: 'cs-act cs-act--skills' },
      h('div', { class: 'cs-skills' }, skillList, skillPane)),
    h('section', { class: 'cs-act cs-act--gallery' },
      h('div', { class: 'cs-gal' },
        rail,
        h('div', { class: 'cs-main' }, banner, wallStage))),
  );

  root.append(head, acts);
  drawSteps();
  showAct();

  /* The wall is watched rather than sampled once: the banner and the rail settle
     after their entrance animations, and a single measurement on the next frame
     committed a column count against the wrong height. Guarded on the same 8px
     threshold drawWall records, which is also what stops a loop — the stage takes
     its height from the flex row above it, not from its own content. */
  const watchSize = new ResizeObserver(() => {
    if (act !== 'gallery') return;
    if (wallStage.clientHeight && Math.abs(wallStage.clientHeight - lastH) > 8) drawWall();
  });
  watchSize.observe(wallStage);

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
