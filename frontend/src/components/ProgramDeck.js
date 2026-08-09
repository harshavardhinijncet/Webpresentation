import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

/**
 * Programs: a rotating stack of programme marks, each opening a gallery of its
 * films, each film opening full-bleed with a way back.
 *
 * Three states on one slide — deck, gallery, player — for the same reason the
 * Platforms stage works that way: the deck is a fixed set of sections, and nine
 * programmes as nine pages would bury the catalogue.
 *
 * On the YouTube films: the embed is asked for no chrome (controls=0 takes the
 * title bar with it, rel=0 keeps the end screen to this channel, and
 * youtube-nocookie is used so nothing is written until something plays). What
 * no parameter can do is make them work without a network. Films served from
 * /uploads play offline; these do not, and that is worth knowing before a room
 * full of people is watching.
 */

const UPLOADS = '/uploads';
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* No title bar, no related grid from other channels, no annotations, no
   keyboard surprises. Autoplay stays off: browsers block it with sound, and a
   muted film is not what anyone came to watch. */
const YT = 'controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&disablekb=1';
const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${YT}`;
const ytPoster = (id) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

const slotFor = (i, total, dx, dy) => ({
  x: i * dx, y: -i * dy, z: -i * dx * 0.9, zIndex: total - i,
});

/** The rotating stack, rebuilt on transitions — GSAP is not available offline. */
function deckSwap(cards, { distance = 26, rise = 22, delay = 4400 } = {}) {
  const total = cards.length;
  const order = cards.map((_, i) => i);
  let timer = null;
  let steps = [];
  const originX = ((total - 1) * distance) / 2;
  const originY = ((total - 1) * rise) / 2;

  const place = (el, slot, dropped = false) => {
    el.style.zIndex = String(slot.zIndex);
    el.style.transform = `translate(-50%, -50%) translate3d(${slot.x - originX}px, ${
      (dropped ? slot.y + 420 : slot.y) + originY}px, ${slot.z}px)`;
    el.style.opacity = dropped ? '0.12' : '1';
  };

  const settle = () => order.forEach((idx, i) => {
    cards[idx].style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), opacity .5s ease';
    place(cards[idx], slotFor(i, total, distance, rise));
  });

  const clearSteps = () => { steps.forEach(clearTimeout); steps = []; };

  const swap = () => {
    if (total < 2) return;
    clearSteps();
    const front = order[0];
    const rest = order.slice(1);
    const frontEl = cards[front];
    const back = slotFor(total - 1, total, distance, rise);

    frontEl.style.transition = 'transform .6s cubic-bezier(.55,.06,.68,.19), opacity .6s ease';
    place(frontEl, slotFor(0, total, distance, rise), true);

    steps.push(setTimeout(() => {
      rest.forEach((idx, i) => {
        const el = cards[idx];
        const slot = slotFor(i, total, distance, rise);
        el.style.zIndex = String(slot.zIndex);
        el.style.transitionDelay = `${i * 60}ms`;
        el.style.transition = 'transform .78s cubic-bezier(.22,1,.36,1), opacity .4s ease';
        place(el, slot);
        setTimeout(() => { el.style.transitionDelay = '0ms'; }, 900);
      });
    }, 250));

    steps.push(setTimeout(() => {
      frontEl.style.zIndex = String(back.zIndex);
      frontEl.style.transition = 'transform .82s cubic-bezier(.22,1,.36,1), opacity .5s ease';
      place(frontEl, back);
    }, 410));

    order.push(order.shift());
  };

  const focus = (index) => {
    const at = order.indexOf(index);
    if (at <= 0) return;
    clearSteps();
    order.splice(at, 1);
    order.unshift(index);
    settle();
  };

  const stop = () => { clearInterval(timer); timer = null; clearSteps(); };
  const start = () => { stop(); if (!REDUCED?.matches) timer = setInterval(swap, delay); };

  /* Entrance: the marks fly up from below and stack, deepest first. */
  cards.forEach((el, i) => {
    const slot = slotFor(i, total, distance, rise);
    el.style.transition = 'none';
    el.style.zIndex = String(slot.zIndex);
    el.style.opacity = '0';
    el.style.transform = `translate(-50%, -50%) translate3d(${slot.x - originX}px, ${slot.y + originY + 420}px, ${slot.z - 300}px)`;
    if (REDUCED?.matches) { el.style.opacity = '1'; place(el, slot); return; }
    setTimeout(() => requestAnimationFrame(() => {
      el.style.transition = 'transform .85s cubic-bezier(.16,.84,.34,1), opacity .4s ease';
      place(el, slot);
    }), 120 + (total - 1 - i) * 150);
  });

  return { start, stop, focus, settleDelay: 120 + (total - 1) * 150 + 850 };
}

export function ProgramDeck(block, { editing = false } = {}) {
  const programs = (block.programs || []).filter((p) => p.key && p.name);
  const root = h('div', { class: 'pg-root ph-root' });
  if (!programs.length) {
    return h('div', { class: 'pg-root pg-root--empty ph-root' }, 'No programmes yet.');
  }

  /* ------------------------------------------------------------ the player */
  const frame = h('div', { class: 'pg-player__frame' });
  const playerTitle = h('span', { class: 'pg-player__title' });
  let backToGallery = () => {};

  const closePlayer = () => {
    frame.replaceChildren();          // stops playback; nothing keeps running behind
    root.classList.remove('is-playing');
    backToGallery();
  };

  const player = h('div', { class: 'pg-player' },
    h('div', { class: 'pg-bar' },
      h('button', { class: 'pg-back', type: 'button', onclick: closePlayer },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'Back')),
      playerTitle,
    ),
    frame,
  );

  const play = (video) => {
    playerTitle.textContent = video.title || '';
    frame.replaceChildren(video.youtube
      ? h('iframe', {
          class: 'pg-player__yt', src: ytEmbed(video.youtube),
          title: video.title || 'Video', allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
          referrerpolicy: 'strict-origin-when-cross-origin', allowfullscreen: true,
        })
      : h('video', {
          class: 'pg-player__file', src: `${UPLOADS}/${encodeURI(video.src)}`,
          controls: true, autoplay: true, playsinline: true,
        }));
    root.classList.add('is-playing');
  };

  /* ----------------------------------------------------------- the gallery */
  const galleryTitle = h('h3', { class: 'pg-gal__title' });
  const galleryGrid = h('div', { class: 'pg-gal__grid' });

  const closeGallery = () => {
    root.classList.remove('is-gallery');
    swap.start();
  };
  backToGallery = () => { /* the gallery is still mounted underneath */ };

  const gallery = h('div', { class: 'pg-gallery' },
    h('div', { class: 'pg-bar' },
      h('button', { class: 'pg-back', type: 'button', onclick: closeGallery },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'All programmes')),
      galleryTitle,
    ),
    galleryGrid,
  );

  const openGallery = (program) => {
    swap.stop();
    galleryTitle.textContent = program.name;
    const videos = program.videos || [];
    galleryGrid.replaceChildren(...(videos.length
      ? videos.map((v) => {
          const shot = h('span', { class: 'pg-shot' });
          if (v.youtube) {
            const img = h('img', { src: ytPoster(v.youtube), alt: '', loading: 'lazy' });
            // Offline the poster never arrives; the tile stands on its own.
            img.addEventListener('error', () => img.remove());
            shot.appendChild(img);
          }
          shot.appendChild(h('span', { class: 'pg-shot__play' }, icon('play-circle', { class: 'ic' })));
          return h('button', { class: 'pg-vid', type: 'button', onclick: () => play(v) },
            shot,
            h('span', { class: 'pg-vid__name' }, v.title || program.name),
          );
        })
      : [h('p', { class: 'pg-gal__none' }, `No films for ${program.name} yet.`)]));
    root.classList.add('is-gallery');
  };

  /* -------------------------------------------------------------- the deck */
  const cards = programs.map((p, i) => {
    const card = h('button', { class: 'pg-card', type: 'button', title: p.name },
      h('span', { class: 'pg-card__mark' }, p.logo
        ? h('img', { src: `${UPLOADS}/${encodeURI(p.logo)}`, alt: p.name })
        : h('b', {}, p.name.slice(0, 2).toUpperCase())),
      h('span', { class: 'pg-card__name' }, p.name),
      h('span', { class: 'pg-card__foot' },
        h('span', {}, (p.videos || []).length
          ? `${p.videos.length} film${p.videos.length === 1 ? '' : 's'}`
          : 'Coming soon'),
        h('span', { class: 'pg-card__go' }, 'Open', icon('arrow-right', { class: 'ic ic--xs' })),
      ),
    );
    card.addEventListener('click', () => openGallery(p));
    return card;
  });

  const deck = h('div', { class: 'pg-deck' }, ...cards);
  const swap = deckSwap(cards);
  setTimeout(() => swap.start(), swap.settleDelay);

  const chips = programs.map((p, i) => h('button', {
    class: 'pg-chip', type: 'button',
    onclick: () => { swap.focus(i); swap.stop(); swap.start(); },
    ondblclick: () => openGallery(p),
  }, p.name, (p.videos || []).length ? h('em', {}, String(p.videos.length)) : null));

  root.appendChild(h('div', { class: 'pg-wall' },
    h('div', { class: 'pg-intro' },
      h('h2', { class: 'pg-title' }, block.title || 'Programs'),
      h('div', { class: 'pg-chips' }, ...chips),
      h('p', { class: 'pg-hint' }, 'Pick a programme to see its films.'),
    ),
    h('div', { class: 'pg-stage' }, deck),
  ));
  root.appendChild(gallery);
  root.appendChild(player);

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (root.classList.contains('is-playing')) { event.stopPropagation(); closePlayer(); }
    else if (root.classList.contains('is-gallery')) { event.stopPropagation(); closeGallery(); }
  });

  return root;
}
