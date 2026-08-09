import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

/**
 * Centers of Excellence: a wall of accredited academies and partner practices,
 * and opening one shows its photos and videos.
 *
 * The detail view lives inside this block rather than as a child section. The
 * deck is a fixed set of sections and this is deliberately one page — nineteen
 * centres as nineteen nav rows would bury the story — so "open a centre" is a
 * state of the slide, the same way the Platforms stage works. Prev/Next still
 * moves through the deck; Escape and the back button return to the wall.
 *
 * Two things the source design does that this cannot. It loads Space Grotesk
 * and IBM Plex from Google Fonts, and the deck is presented with no internet,
 * so the page's own type carries it. And it paints drifting radial gradients
 * behind everything; white is the major surface here and the brand colour is
 * reserved for the one card you are pointing at.
 */

const MEDIA_DIR = '/uploads/coe';
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/** #rrggbb -> rgba(), for the one-card-deep tint and shadow. */
function tint(hex, alpha) {
  const n = parseInt(String(hex).slice(1), 16);
  if (Number.isNaN(n)) return `rgba(22, 24, 33, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * The brand mark, or the centre's initials in its own colour when no file has
 * been supplied. Never a drawn approximation of someone else's logo.
 */
function brandMark(center, { full = false } = {}) {
  // Whichever file exists serves both places; a centre that only supplied a
  // wide wordmark still gets a mark on its card, and vice versa.
  const src = full ? (center.logoFull || center.logo) : (center.logo || center.logoFull);
  const chip = () => h('span', {
    class: full ? 'coe-mono coe-mono--lg' : 'coe-mono',
    style: { background: center.color, color: center.ink },
  }, center.mono || center.name.slice(0, 2).toUpperCase());

  if (!src) return chip();

  const holder = h('span', { class: full ? 'coe-logo coe-logo--lg' : 'coe-logo' });
  const img = h('img', {
    // The drop uses spaces in filenames, so the path has to be encoded.
    src: `${MEDIA_DIR}/${encodeURI(src)}`,
    alt: center.name,
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => holder.replaceWith(chip()));
  holder.appendChild(img);
  return holder;
}

/* --------------------------------------------------------------- the wall */

function centerCard(center, index, onOpen) {
  const card = h('button', {
    class: 'coe-card',
    type: 'button',
    style: {
      '--coe-color': center.color,
      '--coe-wash': tint(center.color, 0.10),
      '--coe-edge': tint(center.color, 0.42),
      '--coe-glow': tint(center.color, 0.30),
      'transition-delay': REDUCED?.matches ? '0ms' : `${Math.min(index * 26, 420)}ms`,
    },
    onclick: () => onOpen(center),
  },
    h('span', { class: 'coe-card__top' }, brandMark(center, { size: 52 })),
    h('span', { class: 'coe-card__name' }, center.name),
    center.tagline ? h('span', { class: 'coe-card__tag' }, center.tagline) : null,
    h('span', { class: 'coe-card__foot' },
      h('span', {}, center.media?.length
        ? `${center.media.length} item${center.media.length === 1 ? '' : 's'}`
        : 'Photos & videos'),
      h('span', { class: 'coe-card__go' }, 'Open', icon('arrow-right', { class: 'ic ic--xs' })),
    ),
  );
  return card;
}

/* ------------------------------------------------------------- the detail */

function mediaTile(item, center) {
  const src = `${MEDIA_DIR}/${center.key}/${encodeURI(item.src)}`;
  if (item.kind === 'video') {
    const video = h('video', {
      class: 'coe-tile__media',
      controls: true, preload: 'metadata', playsinline: true,
      src,
    });
    return h('figure', { class: 'coe-tile' }, video,
      item.label ? h('figcaption', {}, item.label) : null);
  }
  const img = h('img', {
    class: 'coe-tile__media', src, alt: item.label || center.name,
    loading: 'lazy', decoding: 'async',
  });
  return h('figure', { class: 'coe-tile' }, img,
    item.label ? h('figcaption', {}, item.label) : null);
}

export function CentersOfExcellence(block, { editing = false } = {}) {
  const centers = (block.centers || []).filter((c) => c.key && c.name);
  if (!centers.length) {
    return h('div', { class: 'coe-root coe-root--empty ph-root' }, 'No centers yet.');
  }

  const root = h('div', { class: 'coe-root ph-root' });
  const grid = h('div', { class: 'coe-grid' });
  const detail = h('div', { class: 'coe-detail' });

  const cards = [];
  const OPEN_MS = REDUCED?.matches ? 0 : 460;

  /**
   * Opening a centre is not a cut. The card you pressed scales up and fades
   * through, everything else drops back a little, nearest first, and the
   * detail rises into the space they left. Closing runs it backwards.
   */
  const settleCards = () => cards.forEach((el) => {
    el.style.transitionDelay = '0ms';
    el.style.transform = '';
    el.style.opacity = '';
  });

  const scatterFrom = (index) => cards.forEach((el, i) => {
    const gap = Math.abs(i - index);
    el.style.transitionDelay = `${Math.min(gap * 20, 220)}ms`;
    el.style.transform = i === index ? 'scale(1.14)' : 'translateY(26px) scale(.94)';
    el.style.opacity = '0';
  });

  const close = () => {
    root.classList.remove('is-open');
    detail.replaceChildren();
    root.querySelector('.coe-wall')?.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(settleCards);
  };

  const paintDetail = (center) => {
    const media = center.media || [];
    detail.replaceChildren(
      h('button', { class: 'coe-back', type: 'button', onclick: close },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'All centers')),
      h('div', { class: 'coe-hero' },
        brandMark(center, { full: true }),
        h('div', { class: 'coe-hero__id' },
          h('h3', { class: 'coe-hero__name' }, center.name),
          center.tagline ? h('p', { class: 'coe-hero__tag' }, center.tagline) : null,
        ),
      ),
      h('div', { class: 'coe-rule', style: { background: center.color } }),
      h('div', { class: 'coe-gal__head' },
        h('h4', {}, 'Media gallery'),
        h('span', {}, media.length
          ? `${media.length} photo${media.length === 1 ? '' : 's'} and video${media.length === 1 ? '' : 's'}`
          : 'Nothing here yet'),
      ),
      media.length
        ? h('div', { class: 'coe-gal' }, ...media.map((m) => mediaTile(m, center)))
        : h('p', { class: 'coe-gal__none' },
            `Drop photos or videos into backend/uploads/coe/${center.key}/ and they appear here.`),
    );
    root.classList.add('is-open');
    detail.scrollTop = 0;
  };

  let opening = false;
  const open = (center, index) => {
    if (opening || root.classList.contains('is-open')) return;
    if (!OPEN_MS) { paintDetail(center); return; }
    opening = true;
    scatterFrom(index);
    setTimeout(() => { paintDetail(center); opening = false; }, OPEN_MS);
  };

  centers.forEach((c, i) => {
    const card = centerCard(c, i, () => open(c, i));
    cards.push(card);
    grid.appendChild(card);
  });

  root.appendChild(h('div', { class: 'coe-wall' },
    h('div', { class: 'coe-head' },
      block.eyebrow ? h('p', { class: 'coe-eyebrow' }, block.eyebrow) : null,
      block.title ? h('h2', { class: 'coe-title' }, block.title) : null,
      block.subtitle ? h('p', { class: 'coe-sub' }, block.subtitle) : null,
      h('div', { class: 'coe-stats' },
        h('div', {}, h('b', {}, String(centers.length)), h('span', {}, 'Centers')),
        h('i', {}),
        h('div', {}, h('b', {}, 'Global'), h('span', {}, 'Partner network')),
      ),
    ),
    grid,
  ));
  root.appendChild(detail);

  /* Entrance: the wall assembles itself in reading order rather than appearing
     all at once. Cards that start below the fold wait until they are actually
     scrolled to, so nothing animates where nobody is looking. */
  if (!REDUCED?.matches) {
    cards.forEach((el) => el.classList.add('is-waiting'));
    const reveal = (el, delay) => setTimeout(() => el.classList.remove('is-waiting'), delay);
    if (typeof IntersectionObserver === 'function') {
      let seen = 0;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target, Math.min(seen * 34, 500));
          seen += 1;
          io.unobserve(entry.target);
        });
      }, { root: null, threshold: 0.1 });
      cards.forEach((el) => io.observe(el));
      // A safety net: if the observer never fires (block rendered detached, or
      // the slide is scaled out of view) the wall must not stay invisible.
      setTimeout(() => cards.forEach((el) => el.classList.remove('is-waiting')), 1800);
    } else {
      cards.forEach((el, i) => reveal(el, Math.min(i * 34, 500)));
    }
  }

  // Escape returns to the wall, matching every other overlay in the deck.
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      event.stopPropagation();
      close();
    }
  });

  return root;
}
