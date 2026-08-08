import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { toastSuccess, toastError } from './Toast.js';

/**
 * The platform wall: a rotating 3D stack of browser windows, and opening one
 * runs the real product inside the slide.
 *
 * The swap is the React Bits CardSwap motion rebuilt on CSS transforms. GSAP is
 * not an option here — the deck ships with zero runtime dependencies and is
 * presented with no internet — so the timeline is reproduced with transitions
 * and scheduled steps: the front window drops away, the rest promote forward,
 * and the dropped one swings back onto the tail of the stack.
 *
 * Credentials are never printed. A presenter is standing in front of a room
 * with a projector, and a password on a 3-metre screen is a password given
 * away. The stage exposes only what each login *is* — "Admin", "Super Admin" —
 * behind copy buttons that put the value on the clipboard and nowhere else.
 *
 * What this still cannot do is fill the login form for you. The browser forbids
 * a page from touching the DOM of a frame on another origin, and every platform
 * here is another origin. No setting changes that; it is the rule that stops
 * any site reading your bank's login form.
 */

/* Screenshots live at /uploads/platforms/<slug>.<ext> and are served straight
   from backend/uploads. A card with no screenshot yet is not broken — it falls
   back to a designed panel, so the section works before the images arrive. */
const SHOT_DIR = '/uploads/platforms';
const SHOT_EXT = ['png', 'jpg', 'jpeg', 'webp'];

const slugOf = (item) => (item.shot || item.slug || item.name || '')
  .toString().toLowerCase().trim()
  .replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const hostOf = (url) => String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

async function copy(value, label) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      // execCommand is deprecated but is the only route without a secure
      // context, and a deck is sometimes served over plain http on a LAN.
      const scratch = h('textarea', { style: { position: 'fixed', opacity: '0' } }, value);
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      scratch.remove();
    }
    toastSuccess(`${label} copied`);
  } catch {
    toastError(`Could not copy the ${label.toLowerCase()}`);
  }
}

/**
 * An <img> that tries each extension in turn and hands over to a fallback
 * rather than leaving a broken-image glyph on a projector.
 */
function shotImage(item, onMissing) {
  const slug = slugOf(item);
  if (!slug) { onMissing(); return null; }
  let attempt = 0;
  const img = h('img', {
    class: 'pf-win__img',
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    src: `${SHOT_DIR}/${slug}.${SHOT_EXT[0]}`,
  });
  img.addEventListener('error', () => {
    attempt += 1;
    if (attempt < SHOT_EXT.length) img.src = `${SHOT_DIR}/${slug}.${SHOT_EXT[attempt]}`;
    else { img.remove(); onMissing(); }
  });
  return img;
}

/* ------------------------------------------------------------------ a window */

function platformWindow(item, index) {
  const host = hostOf(item.url);
  const shell = h('div', { class: 'pf-win__shell' });
  const fallback = () => shell.appendChild(h('div', { class: 'pf-win__blank' },
    h('span', { class: 'pf-win__mark' }, icon(item.icon || 'grid-4', { class: 'ic' })),
    h('span', { class: 'pf-win__blankname' }, item.name),
    item.blurb ? h('span', { class: 'pf-win__blankblurb' }, item.blurb) : null,
  ));
  const img = shotImage(item, fallback);
  if (img) shell.appendChild(img);

  return h('button', {
    class: 'pf-win',
    type: 'button',
    'data-index': String(index),
    title: `Open ${item.name}`,
  },
    h('span', { class: 'pf-win__bar' },
      h('span', { class: 'pf-win__dots' },
        h('i', {}), h('i', {}), h('i', {})),
      h('span', { class: 'pf-win__host' }, host),
    ),
    shell,
    h('span', { class: 'pf-win__foot' },
      h('span', { class: 'pf-win__name' }, item.name),
      h('span', { class: 'pf-win__open' }, 'Open', icon('arrow-up-right', { class: 'ic ic--xs' })),
    ),
  );
}

/* ------------------------------------------------------------- the card swap */

/**
 * Positions for a stack of `total` cards. Index 0 is the front; each one behind
 * steps right, up and away, so the whole stack reads as a fanned deck.
 */
const slotFor = (i, total, dx, dy) => ({
  x: i * dx,
  y: -i * dy,
  z: -i * dx * 1.6,
  zIndex: total - i,
});

function cardSwap(cards, { distance = 46, rise = 50, skew = -6, delay = 4200 } = {}) {
  const total = cards.length;
  const order = cards.map((_, i) => i);
  let timer = null;
  let steps = [];

  const place = (el, slot, dropped = false) => {
    el.style.zIndex = String(slot.zIndex);
    el.style.transform = `translate(-50%, -50%) translate3d(${slot.x}px, ${
      dropped ? slot.y + 460 : slot.y}px, ${slot.z}px) skewY(${skew}deg)`;
    el.style.opacity = dropped ? '0.15' : '1';
  };

  const settle = () => order.forEach((idx, i) => {
    cards[idx].style.transition = 'transform .85s cubic-bezier(.22,1,.36,1), opacity .5s ease';
    place(cards[idx], slotFor(i, total, distance, rise));
  });

  const clearSteps = () => { steps.forEach(clearTimeout); steps = []; };

  const swap = () => {
    if (total < 2) return;
    clearSteps();
    const front = order[0];
    const rest = order.slice(1);
    const frontEl = cards[front];
    const backSlot = slotFor(total - 1, total, distance, rise);

    // 1. the front window falls away
    frontEl.style.transition = 'transform .62s cubic-bezier(.55,.06,.68,.19), opacity .62s ease';
    place(frontEl, slotFor(0, total, distance, rise), true);

    // 2. the stack promotes forward, each a beat after the one in front
    steps.push(setTimeout(() => {
      rest.forEach((idx, i) => {
        const el = cards[idx];
        const slot = slotFor(i, total, distance, rise);
        el.style.zIndex = String(slot.zIndex);
        el.style.transitionDelay = `${i * 70}ms`;
        el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), opacity .4s ease';
        place(el, slot);
        setTimeout(() => { el.style.transitionDelay = '0ms'; }, 900);
      });
    }, 260));

    // 3. the fallen window swings back onto the tail
    steps.push(setTimeout(() => {
      frontEl.style.zIndex = String(backSlot.zIndex);
      frontEl.style.transition = 'transform .85s cubic-bezier(.22,1,.36,1), opacity .5s ease';
      place(frontEl, backSlot);
    }, 430));

    order.push(order.shift());
  };

  /** Bring a specific card to the front — a presenter jumping to a platform. */
  const focus = (index) => {
    const at = order.indexOf(index);
    if (at <= 0) return;
    clearSteps();
    order.splice(at, 1);
    order.unshift(index);
    settle();
  };

  const stop = () => { clearInterval(timer); timer = null; clearSteps(); };
  const start = () => {
    stop();
    if (REDUCED?.matches) return;
    timer = setInterval(swap, delay);
  };

  /* Entrance: the windows fall into the stack in reading order. */
  cards.forEach((el, i) => {
    const slot = slotFor(i, total, distance, rise);
    el.style.transition = 'none';
    el.style.zIndex = String(slot.zIndex);
    el.style.opacity = '0';
    el.style.transform = `translate(-50%, -50%) translate3d(${slot.x}px, ${slot.y - 260}px, ${slot.z}px) skewY(${skew}deg)`;
    const land = () => {
      el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1), opacity .5s ease';
      place(el, slot);
    };
    if (REDUCED?.matches) { el.style.opacity = '1'; place(el, slot); }
    else setTimeout(() => requestAnimationFrame(land), 90 + i * 110);
  });

  return { start, stop, focus, order: () => order[0] };
}

/* ------------------------------------------------------------------- exports */

export function Platforms(block, { editing = false } = {}) {
  const items = (block.items || []).filter((p) => p.name && p.url);
  if (!items.length) {
    return h('div', { class: 'pf-root pf-root--empty ph-root' }, 'No platforms yet.');
  }

  const root = h('div', { class: 'pf-root ph-root' });

  /* ----------------------------------------------------------- the run stage */
  const frameTitle = h('span', { class: 'pf-stage__name' });
  const frameUrl = h('span', { class: 'pf-stage__url' });
  const frame = h('iframe', {
    class: 'pf-stage__frame',
    title: 'Platform',
    // Another origin: this is a window onto it, not a page we script.
    // allow-same-origin is required or its own login cannot set a cookie.
    sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation',
    referrerpolicy: 'no-referrer-when-downgrade',
  });
  const openOut = h('a', {
    class: 'pf-stage__out', target: '_blank', rel: 'noopener noreferrer',
    title: 'Open in a new tab if the platform refuses to run in a frame',
  }, icon('arrow-up-right', { class: 'ic ic--xs' }), h('span', {}, 'New tab'));

  const keysPanel = h('div', { class: 'pf-keys', hidden: true });
  const keysBtn = h('button', {
    class: 'pf-stage__keys', type: 'button', 'aria-expanded': 'false',
    onclick: () => {
      const open = keysPanel.hasAttribute('hidden');
      keysPanel.toggleAttribute('hidden', !open);
      keysBtn.setAttribute('aria-expanded', String(open));
      keysBtn.classList.toggle('is-on', open);
    },
  }, icon('shield', { class: 'ic ic--xs' }), h('span', {}, 'Show credentials'));

  const goTo = (url) => {
    frame.src = url;
    frameUrl.textContent = hostOf(url);
    openOut.setAttribute('href', url);
  };

  /** One login: what it is, and two buttons — never the value itself. */
  const loginRow = (login, activeUrl) => h('div', { class: 'pf-key' },
    h('div', { class: 'pf-key__top' },
      h('span', { class: 'pf-key__role' }, login.role || 'Login'),
      login.url && login.url !== activeUrl
        ? h('button', {
            class: 'pf-key__jump', type: 'button', title: 'Open this login page',
            onclick: () => goTo(login.url),
          }, 'Go to this login')
        : null,
    ),
    h('div', { class: 'pf-key__acts' },
      h('button', {
        class: 'pf-key__btn', type: 'button',
        onclick: () => copy(login.user, 'Username'),
      }, icon('copy', { class: 'ic ic--xs' }), 'Copy username'),
      h('button', {
        class: 'pf-key__btn', type: 'button',
        onclick: () => copy(login.pass, 'Password'),
      }, icon('copy', { class: 'ic ic--xs' }), 'Copy password'),
    ),
  );

  const close = () => {
    root.classList.remove('is-open');
    frame.removeAttribute('src');
    keysPanel.setAttribute('hidden', '');
    keysBtn.classList.remove('is-on');
    keysBtn.setAttribute('aria-expanded', 'false');
    swap?.start();
  };

  const stage = h('div', { class: 'pf-stage' },
    h('div', { class: 'pf-stage__bar' },
      h('button', { class: 'pf-stage__back', type: 'button', onclick: close },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'All platforms')),
      h('div', { class: 'pf-stage__id' }, frameTitle, frameUrl),
      h('div', { class: 'pf-stage__tools' }, keysBtn, openOut, keysPanel),
    ),
    h('div', { class: 'pf-stage__body' }, frame),
  );

  const open = (item) => {
    swap?.stop();
    frameTitle.textContent = item.name;
    keysPanel.setAttribute('hidden', '');
    keysBtn.classList.remove('is-on');
    keysBtn.setAttribute('aria-expanded', 'false');

    const url = item.url;
    keysPanel.replaceChildren(
      h('p', { class: 'pf-keys__head' },
        `${item.logins.length} login${item.logins.length === 1 ? '' : 's'} for ${item.name}`),
      ...item.logins.map((login) => loginRow(login, url)),
      h('p', { class: 'pf-keys__note' },
        'Copy, then paste into the platform’s own form. Nothing is shown on screen.'),
    );
    goTo(url);
    root.classList.add('is-open');
  };

  /* --------------------------------------------------------------- the deck */
  const cards = items.map((item, i) => {
    const card = platformWindow(item, i);
    card.addEventListener('click', () => open(item));
    return card;
  });

  const deck = h('div', { class: 'pf-deck' }, ...cards);

  const chips = items.map((item, i) => h('button', {
    class: 'pf-chip', type: 'button',
    onclick: () => { swap.focus(i); swap.stop(); swap.start(); },
    ondblclick: () => open(item),
    title: `Bring ${item.name} to the front`,
  },
    icon(item.icon || 'grid-4', { class: 'ic ic--xs' }),
    h('span', {}, item.name),
    h('em', {}, `${item.logins.length}`),
  ));

  const wall = h('div', { class: 'pf-wall' },
    h('div', { class: 'pf-intro' },
      block.eyebrow ? h('p', { class: 'pf-eyebrow' }, block.eyebrow) : null,
      block.title ? h('h2', { class: 'pf-title' }, block.title) : null,
      block.subtitle ? h('p', { class: 'pf-sub' }, block.subtitle) : null,
      h('div', { class: 'pf-chips' }, ...chips),
      h('p', { class: 'pf-hint' }, 'Click a window to run the platform inside this slide.'),
    ),
    h('div', { class: 'pf-stagearea' }, deck),
  );

  const swap = cardSwap(cards, { delay: 4200 });
  swap.start();

  root.appendChild(wall);
  root.appendChild(stage);
  return root;
}
