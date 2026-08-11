import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Programs: one card that opens into the whole set, each of those into its
 * films, each film into the screen.
 *
 * Four states on one slide — cover, row, gallery, player.
 *
 * The fan-out is a FLIP. The row is the cards' real layout; the stack is a
 * transform measured off it, so opening is just releasing every card back to
 * where it already was. Animating toward a position you have not measured is
 * how you get cards that land a few pixels out and jitter on the way.
 *
 * On the films: the embed is only ever created already playing. YouTube's
 * title, channel and "Watch on YouTube" all belong to the *unstarted* state —
 * no parameter removes them, but a player that starts in motion never shows
 * that state at all. controls=0 keeps the bar from returning on hover.
 *
 * What none of this can do is work without a network. Films served from
 * /uploads play offline; these do not.
 */

const UPLOADS = '/uploads';
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

const YT = 'autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3'
  + '&playsinline=1&disablekb=1&fs=0&color=white';
const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${YT}`;
const ytPoster = (id) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg`;

/** Columns that let N films fill the screen rather than sit in a strip. */
function galleryShape(n) {
  if (n <= 1) return 1;
  if (n <= 3) return n;
  if (n === 4) return 2;
  return 3;
}

export function ProgramDeck(block, { editing = false } = {}) {
  const programs = (block.programs || []).filter((p) => p.key && p.name);
  if (!programs.length) {
    return h('div', { class: 'pg-root pg-root--empty ph-root' }, 'No programmes yet.');
  }
  const root = h('div', { class: 'pg-root ph-root' });

  /* ------------------------------------------------------------ the player */
  const frame = h('div', { class: 'pg-player__frame' });
  const playerTitle = h('span', { class: 'pg-player__title' });

  const closePlayer = () => {
    // Unmount, don't hide — a hidden iframe keeps playing behind the gallery.
    frame.replaceChildren();
    player.classList.remove('is-portal');
    if (player.parentNode !== root) root.appendChild(player);
    root.classList.remove('is-playing');
  };

  const player = h('div', { class: 'pg-player' },
    h('div', { class: 'pg-bar' },
      h('button', { class: 'pg-back', type: 'button', onclick: closePlayer },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'Back to films')),
      playerTitle,
    ),
    frame,
  );

  const play = (video) => {
    playerTitle.textContent = video.title || '';
    frame.replaceChildren(video.youtube
      ? h('iframe', {
          class: 'pg-player__yt', src: ytEmbed(video.youtube),
          title: video.title || 'Video',
          allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
          referrerpolicy: 'strict-origin-when-cross-origin', allowfullscreen: true,
        })
      : h('video', {
          class: 'pg-player__file', src: media(`/uploads/${encodeURI(video.src)}`),
          controls: true, autoplay: true, playsinline: true,
        }));
    /* Out of the slide entirely while it plays. FitSlide scales the slide with
       a transform, which becomes the containing block for anything fixed inside
       it — so a player that lives in the section can only ever fill the slide,
       and when the window is not 16:9 the slide itself is letterboxed. Moved to
       the body it answers to the viewport and covers the display. The deck bar
       is fixed in the body too, at a higher z-index, so Prev / Next / Exit stay
       on top and clickable. */
    if (player.parentNode !== document.body) document.body.appendChild(player);
    player.classList.add('is-portal');
    root.classList.add('is-playing');
  };

  /* ----------------------------------------------------------- the gallery */
  const galleryTitle = h('h3', { class: 'pg-gal__title' });
  const galleryGrid = h('div', { class: 'pg-gal__grid' });

  const closeGallery = () => root.classList.remove('is-gallery');

  const gallery = h('div', { class: 'pg-gallery' },
    h('div', { class: 'pg-bar' },
      h('button', { class: 'pg-back', type: 'button', onclick: closeGallery },
        icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'All programmes')),
      galleryTitle,
    ),
    galleryGrid,
  );

  const openGallery = (program) => {
    galleryTitle.textContent = program.name;
    const videos = program.videos || [];
    galleryGrid.style.setProperty('--pg-cols', String(galleryShape(videos.length)));
    galleryGrid.replaceChildren(...(videos.length
      ? videos.map((v) => {
          const shot = h('span', { class: 'pg-shot' });
          if (v.youtube) {
            const img = h('img', { src: ytPoster(v.youtube), alt: '', loading: 'lazy' });
            img.addEventListener('error', () => img.remove());
            shot.appendChild(img);
          }
          shot.appendChild(h('span', { class: 'pg-shot__play' }, icon('play-circle', { class: 'ic' })));
          shot.appendChild(h('span', { class: 'pg-shot__name' }, v.title || program.name));
          return h('button', { class: 'pg-vid', type: 'button', onclick: () => play(v) }, shot);
        })
      : [h('p', { class: 'pg-gal__none' }, `No films for ${program.name} yet.`)]));
    root.classList.add('is-gallery');
  };

  /* -------------------------------------------------------------- the row */
  const cards = programs.map((p) => {
    const card = h('button', { class: 'pg-card', type: 'button', title: p.name },
      h('span', { class: 'pg-card__mark' }, p.logo
        ? h('img', { src: media(`/uploads/${encodeURI(p.logo)}`), alt: p.name })
        : h('b', {}, p.name.slice(0, 2).toUpperCase())),
      h('span', { class: 'pg-card__name' }, p.name),
      h('span', { class: 'pg-card__count' }, (p.videos || []).length
        ? `${p.videos.length} film${p.videos.length === 1 ? '' : 's'}`
        : '—'),
    );
    card.addEventListener('click', () => {
      if (root.classList.contains('is-fanned')) openGallery(p);
    });
    return card;
  });

  const row = h('div', { class: 'pg-row' }, ...cards);

  /**
   * Collapse every card onto the middle of the row. Measured, not guessed: the
   * row is the cards' natural layout and this is the offset back to the centre,
   * so releasing the transform lands each one exactly where it belongs.
   */
  const stack = () => {
    const rect = row.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    cards.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      const dx = Math.round(mid - (b.left + b.width / 2));
      el.style.transition = 'none';
      el.style.transform = `translate3d(${dx}px, 0, 0) scale(.9)`;
      /* All of them hidden, not just the ones behind the front. A full-height
         card standing behind a short cover pokes out above and below it, which
         reads as a mistake rather than a stack — the cover draws its own. */
      el.style.opacity = '0';
      el.style.zIndex = String(cards.length - i);
    });
  };

  const fan = () => {
    if (root.classList.contains('is-fanned')) return;
    root.classList.add('is-fanned');
    cards.forEach((el, i) => {
      el.style.transition = REDUCED?.matches ? 'none'
        : `transform .7s cubic-bezier(.22,1,.36,1) ${i * 45}ms, opacity .4s ease ${i * 45}ms`;
      el.style.transform = 'none';
      el.style.opacity = '1';
    });
  };

  const cover = h('button', { class: 'pg-cover', type: 'button', onclick: fan },
    h('span', { class: 'pg-cover__eyebrow' }, block.eyebrow || 'Programs'),
    h('h2', { class: 'pg-cover__title' }, block.title || 'Programs of Technical Hub'),
    h('span', { class: 'pg-cover__count' }, `${programs.length} programmes`),
    h('span', { class: 'pg-cover__go' }, 'Open', icon('arrow-right', { class: 'ic ic--xs' })),
  );

  root.appendChild(h('div', { class: 'pg-wall' }, cover, row));
  root.appendChild(gallery);
  root.appendChild(player);

  // Measure after the row has a layout, or every offset is zero.
  requestAnimationFrame(() => requestAnimationFrame(stack));

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (root.classList.contains('is-playing')) { event.stopPropagation(); closePlayer(); }
    else if (root.classList.contains('is-gallery')) { event.stopPropagation(); closeGallery(); }
  });

  return root;
}
