import { h, svg } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * Technical Hub Collaborations — two scenes.
 *
 *   The wall   — Technical Hub's mark on the left, a spark in the middle, and every partner
 *                as a white tile in staggered columns on the right, fading as they go. The
 *                tiles cascade in, then the page moves on by itself (or on Next).
 *   The card   — one soft card: a green band carrying Technical Hub's mark, a row of round
 *                partner logos sitting on the band's edge, and below it the selected partner —
 *                its announcement image on the left, what the collaboration covers as small
 *                cards on the right — over a row of action pills. A ring draws itself round the
 *                selected logo while it holds; when it closes, the next partner comes up.
 *
 * Deck Prev / Next step through the partners before they turn the slide.
 */

const src = (p) => (p ? media(`/uploads/${String(p).split('/').map(encodeURIComponent).join('/')}`) : '');
const pad = (n) => String(n).padStart(2, '0');
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

/** The spark between the marks: four rays crossing, with a soft halo. */
function spark(cls) {
  return svg('svg', { class: cls, viewBox: '0 0 120 120', 'aria-hidden': 'true' },
    svg('circle', { class: `${cls}__halo`, cx: 60, cy: 60, r: 34 }),
    ...[45, 135, 0, 90].map((a, k) => svg('rect', {
      class: `${cls}__ray${k > 1 ? ` ${cls}__ray--thin` : ''}`,
      x: 57.5, y: k > 1 ? 22 : 8, width: 5, height: k > 1 ? 76 : 104, rx: 2.5,
      transform: `rotate(${a} 60 60)`,
    })));
}

export function CollabWall(block, { editing = false } = {}) {
  const c = block.content || {};
  const partners = (c.partners || []).filter((p) => p.name);
  const hold = Math.max(4000, Number(c.hold) || 9000);
  const root = h('div', { class: 'cw-root ph-root', style: { '--cw-hold': `${hold}ms` } });
  if (!partners.length) { root.append(h('p', { class: 'cw-empty' }, 'No collaborations yet.')); return root; }

  let scene = 'wall';
  let at = 0;
  let paused = editing;

  /* ------------------------------------------------------------- the wall */
  const COLS = [2, 3, 3, 2, 2];
  let n = 0;
  const columns = COLS.map((count, ci) => h('div', { class: `cw-col cw-col--${ci}` },
    ...Array.from({ length: count }, () => {
      const p = partners[n];
      const k = n;
      n += 1;
      const tile = p
        ? h('button', {
            class: 'cw-tile', type: 'button', 'aria-label': p.name, style: { '--i': String(k), ...(p.logoBg ? { '--tile': p.logoBg } : {}) },
            onclick: () => openCard(k),
          }, h('img', { src: src(p.logo), alt: p.name, draggable: 'false' }))
        : h('span', { class: 'cw-tile cw-tile--ghost', style: { '--i': String(k) } }, h('i'));
      return tile;
    })));
  const wall = h('section', { class: 'cw-wall' },
    h('div', { class: 'cw-wall__lead' },
      c.logo ? h('img', { class: 'cw-wall__logo', src: src(c.logo), alt: 'Technical Hub' }) : null,
      h('p', { class: 'cw-wall__kicker' }, c.kicker || 'Technical Hub · Collaborations'),
      h('h2', { class: 'cw-title' }, c.title || 'Our collaborations'),
      c.lead ? h('p', { class: 'cw-wall__lead-text' }, c.lead) : null,
      h('button', { class: 'cw-go', type: 'button', onclick: () => openCard(0) },
        h('b', {}, pad(partners.length)), h('span', {}, c.goLabel || 'Explore every collaboration'), icon('arrow-right', { class: 'ic ic--xs' }))),
    h('div', { class: 'cw-wall__spark' }, spark('cw-spark')),
    h('div', { class: 'cw-wall__tiles' }, ...columns));

  /* ------------------------------------------------------------- the card */
  const RING = 2 * Math.PI * 52;
  const dots = partners.map((p, k) => h('button', {
    class: 'cw-dot', type: 'button', 'aria-label': p.name,
    style: { ...(p.logoBg ? { '--tile': p.logoBg } : {}), ...(p.logoScale ? { '--logo-scale': String(p.logoScale) } : {}) },
    onclick: () => select(k, true),
  },
    svg('svg', { class: 'cw-dot__ring', viewBox: '0 0 112 112', 'aria-hidden': 'true' },
      svg('circle', { class: 'cw-dot__track', cx: 56, cy: 56, r: 52 }),
      svg('circle', { class: 'cw-dot__run', cx: 56, cy: 56, r: 52, style: `--len:${RING.toFixed(1)}` })),
    h('span', { class: 'cw-dot__face' }, h('img', { src: src(p.logo), alt: '', draggable: 'false' }))));

  const shots = h('div', { class: 'cw-shots' });
  const kind = h('span', { class: 'cw-kind' });
  const name = h('h3', { class: 'cw-name' });
  const summary = h('p', { class: 'cw-summary' });
  const cards = h('ul', { class: 'cw-cards' });
  const count = h('span', { class: 'cw-count' });
  const pauseBtn = h('button', { class: 'cw-pill cw-pill--round', type: 'button', onclick: () => setPaused(!paused) });
  const info = h('div', { class: 'cw-info' }, kind, name, summary, cards);

  let shotTimer = null;

  /* Each announcement is laid as large as the left of the card allows at its own shape — no
     plate behind it, nothing cropped. The image element itself is sized (not object-fit), so its
     rounded corners and shadow sit on the picture's real edge. Layout pixels throughout, so the
     slide's scale does not enter into it. */
  function sizeShot(img) {
    const W = shots.clientWidth;
    const H = shots.clientHeight;
    if (!W || !H || !img.naturalWidth) return;
    const r = img.naturalWidth / img.naturalHeight;
    // A wide announcement takes a wider column; the first image of a partner decides.
    if (img === shots.firstElementChild) {
      const wide = r > 1.3;
      if (shots.parentElement.classList.contains('is-wide') !== wide) {
        shots.parentElement.classList.toggle('is-wide', wide);
        requestAnimationFrame(() => { shots.querySelectorAll('img').forEach(sizeShot); fitInfo(); });
        return;
      }
    }
    const w = Math.min(W, H * r);
    const hgt = w / r;
    Object.assign(img.style, { width: `${w}px`, height: `${hgt}px`, left: `${(W - w) / 2}px`, top: `${(H - hgt) / 2}px` });
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => shots.querySelectorAll('img').forEach(sizeShot)).observe(shots);
  function paint() {
    const p = partners[at];
    // The card takes the partner's own colours: everything inside it reads the brand variables,
    // so setting them here re-themes the band, chips, icons, ring and buttons together.
    const th = p.theme || {};
    const set = (k, v) => (v ? card.style.setProperty(k, v) : card.style.removeProperty(k));
    set('--brand-primary', th.primary);
    set('--brand-accent', th.accent);
    set('--accent-ink', th.ink);
    set('--cw-ink-brand', th.ink || th.primary);
    dots.forEach((d, k) => d.classList.toggle('is-on', k === at));
    dots.forEach((d) => d.classList.remove('is-run'));
    if (!paused) { void dots[at].offsetWidth; dots[at].classList.add('is-run'); }
    // replaceChildren writes a null out as the word, so the place is only added when there is one.
    kind.replaceChildren(...[icon(p.icon || 'handshake-check', { class: 'ic ic--xs' }), p.kind || 'Collaboration', p.place ? h('i', {}, ` · ${p.place}`) : null].filter(Boolean));
    name.textContent = p.name;
    name.classList.toggle('is-long', p.name.length > 30);
    summary.textContent = p.summary || '';
    summary.hidden = !p.summary;
    cards.replaceChildren(...(p.points || []).map((pt, k) => h('li', { class: 'cw-card', style: { '--k': String(k) } },
      h('span', { class: 'cw-card__ic' }, icon(pt.icon || 'check', { class: 'ic ic--sm' })),
      h('span', {}, h('b', {}, pt.title), pt.body ? h('small', {}, pt.body) : null))));
    cards.dataset.n = String((p.points || []).length);
    // The announcement images: one stands; two take turns.
    clearInterval(shotTimer);
    const imgs = (p.images || []).filter(Boolean);
    shots.replaceChildren(...imgs.map((im, k) => {
      const img = h('img', { class: `cw-shot${k === 0 ? ' is-on' : ''}`, src: src(im), alt: `${p.name} — announcement`, draggable: 'false' });
      img.addEventListener('load', () => sizeShot(img));
      if (img.complete) sizeShot(img);
      return img;
    }));
    if (imgs.length > 1 && !REDUCED) {
      let s = 0;
      shotTimer = setInterval(() => {
        const els = shots.children;
        els[s].classList.remove('is-on');
        s = (s + 1) % els.length;
        els[s].classList.add('is-on');
      }, Math.max(2600, hold / imgs.length));
    }
    count.replaceChildren(h('b', {}, pad(at + 1)), ` / ${pad(partners.length)}`);
    [info, shots].forEach((el) => { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); });
    fitInfo();
  }

  /* The selected partner's column must never be cut off: if it overflows, the summary drops to
     two lines, then the cards lose their captions. Layout pixels, so the slide's scale does not
     enter into it. */
  function fitInfo() {
    info.classList.remove('is-tight', 'is-tighter');
    requestAnimationFrame(() => {
      // Each card's own content against its row — card children never move, so the entrance
      // motion cannot read as overflow the way the column's own scrollHeight does.
      const over = () => [...cards.children].some((cd) => cd.scrollHeight > cd.clientHeight + 1);
      if (over()) info.classList.add('is-tight');
      if (over()) info.classList.add('is-tighter');
    });
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => fitInfo()).observe(info);

  const card = h('section', { class: 'cw-card-scene' },
    h('div', { class: 'cw-panel' },
      h('header', { class: 'cw-band' },
        h('span', { class: 'cw-band__chip' }, icon('handshake-check', { class: 'ic ic--xs' }), c.bandLabel || 'Collaborations'),
        c.logo ? h('span', { class: 'cw-band__plate' }, h('img', { src: src(c.logo), alt: 'Technical Hub' })) : null,
        count,
        h('div', { class: 'cw-dots' }, ...dots)),
      h('div', { class: 'cw-detail' }, shots, info),
      h('footer', { class: 'cw-actions' },
        h('button', { class: 'cw-pill cw-pill--round', type: 'button', 'aria-label': 'All collaborations', onclick: () => showWall() }, icon('layers', { class: 'ic ic--sm' })),
        pauseBtn,
        h('button', { class: 'cw-pill', type: 'button', onclick: () => select(at - 1, true) }, icon('chevron-left', { class: 'ic ic--sm' }), 'Previous'),
        h('button', { class: 'cw-pill cw-pill--go', type: 'button', onclick: () => select(at + 1, true) }, 'Next', icon('arrow-right', { class: 'ic ic--sm' })))));

  root.append(h('div', { class: 'cw-ground', 'aria-hidden': 'true' }), wall, card);

  /* ------------------------------------------------------------ behaviour */
  const auto = autoSlide(() => select(at + 1, false), {
    host: root, interval: hold, canRun: () => scene === 'card' && !paused,
  });
  let wallTimer = null;

  function setScene(s) {
    scene = s;
    root.dataset.scene = s;
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
  }
  function showWall() {
    clearTimeout(wallTimer);
    setScene('wall');
    if (!editing && !REDUCED) wallTimer = setTimeout(() => openCard(0), Number(c.wallHold) || 5200);
  }
  function openCard(k) {
    clearTimeout(wallTimer);
    setScene('card');
    select(k, true);
  }
  function select(k, manual) {
    at = ((k % partners.length) + partners.length) % partners.length;
    paint();
    if (manual) auto.reset();
  }
  function setPaused(on) {
    paused = on;
    root.classList.toggle('is-paused', on);
    pauseBtn.replaceChildren(icon(on ? 'play' : 'pause', { class: 'ic ic--sm' }));
    pauseBtn.setAttribute('aria-label', on ? 'Play' : 'Pause');
    if (on) { auto.stop(); dots.forEach((d) => d.classList.remove('is-run')); } else { auto.start(); paint(); }
  }

  if (!editing) {
    registerStepper((delta) => {
      if (scene === 'wall') { if (delta > 0) { openCard(0); return true; } return false; }
      if (delta > 0 && at < partners.length - 1) { select(at + 1, true); return true; }
      if (delta < 0 && at > 0) { select(at - 1, true); return true; }
      if (delta < 0 && at === 0) { showWall(); return true; }
      return false;
    });
  }

  at = 0;
  paint();
  setPaused(paused);
  showWall();
  return root;
}
