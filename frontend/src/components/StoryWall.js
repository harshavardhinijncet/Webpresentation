import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Success Stories, as an editorial reel: oversized type on the left, a diagonal
 * strip of photographs rolling upward through the middle, and whichever picture
 * is passing the focal point open as a card on the right.
 *
 * The strip is one column built twice and travelling exactly half its own
 * height, which is what closes the loop with no seam — at -50% the second copy
 * sits precisely where the first began. It is tilted off vertical and set in a
 * perspective, so the cards read as floating rather than tiled, and each one
 * scales very slightly as it crosses the focal band.
 *
 * The card is not driven by clicks alone. The reel keeps rolling and the card
 * follows whichever picture is at the focal point, so the page tells its own
 * story unattended. A click takes that over: the reel parks and the presenter
 * drives. Closing hands it back.
 *
 * Two rules keep the two halves honest. ROLL_SECONDS is declared once here and
 * written into the animation, so the timer that advances the card and the belt
 * that moves the pictures cannot drift apart. And the focal pulse lives on an
 * inner face rather than the tile, because an animation on `transform` beats a
 * hover rule for the same property and the lift would simply stop working.
 *
 * All motion is CSS. Nothing runs per frame, and everything stops under
 * prefers-reduced-motion.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/** Seconds for one full run of pictures to pass. Shared with the stylesheet. */
const ROLL_SECONDS = 68;

/** The headline, split so each line can be set differently. */
function titleLines(raw) {
  const text = String(raw || 'Success Stories').replace(/[—–-]/g, '—');
  const [head, tail] = text.split('—').map((s) => s.trim());
  const words = (head || 'Success Stories').split(/\s+/);
  return {
    lead: words.length > 1 ? words.slice(0, -1).join(' ') : '',
    accent: words[words.length - 1] || '',
    name: tail || '',
  };
}

export function StoryWall(block, { editing = false } = {}) {
  const stories = (block.stories || []).filter((s) => s.photo);
  const root = h('div', { class: 'sw-root ph-root' });

  if (!stories.length) {
    root.appendChild(h('div', { class: 'sw-empty' },
      h('h2', { class: 'sw-title' }, block.title || 'Success Stories'),
      editing
        ? h('p', { class: 'sw-hint' },
            'Drop the portraits into backend/uploads/stories/ and re-run the publish step.')
        : null,
    ));
    return root;
  }

  const src = (story) => media(`/uploads/${encodeURI(story.photo)}`);
  const count = stories.length;
  /* How long one picture takes to cross the focal point. The belt covers one
     whole run in ROLL_SECONDS, and a run is every picture once. */
  const BEAT_MS = Math.round((ROLL_SECONDS * 1000) / count);

  let at = -1;
  let held = false;      // a click has taken over from the reel
  let timer = null;

  /* ------------------------------------------------------------- the card */
  const cardImg = h('img', { class: 'sw-card__img', alt: '' });
  const cardName = h('h3', { class: 'sw-card__name' });
  const cardRole = h('p', { class: 'sw-card__role' });
  const cardQuote = h('blockquote', { class: 'sw-card__quote' });
  const cardBody = h('p', { class: 'sw-card__body' });
  const cardCount = h('span', { class: 'sw-card__count' });
  const cardSize = h('span', { class: 'sw-card__size' });

  /* Sixteen of the twenty-five files are 206px square, so the card is bounded
     rather than filled: at the frame's width they would be enlarged about
     fivefold, which is softness no source survives. */
  const MAX_ENLARGE = 2;
  const fitCard = () => {
    const { naturalWidth: nw, naturalHeight: nh } = cardImg;
    if (!nw || !nh) return;
    const fw = cardImg.parentElement?.clientWidth;
    if (!fw) return;
    const w = Math.min(fw, nw * MAX_ENLARGE);
    cardImg.style.width = `${Math.round(w)}px`;
    cardImg.style.height = `${Math.round((w / nw) * nh)}px`;
    cardSize.textContent = `${nw} × ${nh}`;
  };
  cardImg.addEventListener('load', fitCard);

  const paint = (index) => {
    const story = stories[index];
    if (!story) return;
    at = index;
    cardImg.src = src(story);
    cardImg.alt = story.name || '';
    cardName.textContent = story.name || '';
    cardCount.textContent = `${String(index + 1).padStart(2, '0')} / ${count}`;
    cardRole.textContent = story.role || '';
    cardQuote.textContent = story.quote || '';
    cardBody.textContent = story.body || '';
    // A story with nothing written for it should not draw an empty slab.
    cardRole.hidden = !story.role;
    cardQuote.hidden = !story.quote;
    cardBody.hidden = !story.body;
    tiles.forEach((t) => t.classList.toggle('is-active', Number(t.dataset.story) === index));
    root.classList.add('is-open');
    /* Retriggered by removing the class and forcing a reflow, so a card that
       changes while already open still fades and scales in rather than swapping
       its contents in place. */
    card.classList.remove('is-in');
    void card.offsetWidth;
    card.classList.add('is-in');
  };

  /* The reel advances the card on its own. It does not pause the belt: the whole
     point is that the card follows whatever is passing the focal point. */
  const rollOn = () => {
    if (REDUCED?.matches || held) return;
    clearInterval(timer);
    timer = setInterval(() => {
      if (held || !root.isConnected) return;
      paint((at + 1) % count);
    }, BEAT_MS);
  };

  /** A click takes over: the belt parks and the reel stops advancing. */
  const take = (index) => {
    held = true;
    clearInterval(timer);
    root.classList.add('is-held');
    paint(index);
  };

  const release = () => {
    held = false;
    root.classList.remove('is-held');
    rollOn();
  };

  const close = () => {
    at = -1;
    held = false;
    clearInterval(timer);
    root.classList.remove('is-open', 'is-held');
    tiles.forEach((t) => t.classList.remove('is-active'));
    rollOn();
  };

  const card = h('aside', { class: 'sw-card' },
    h('button', { class: 'sw-card__close', type: 'button', 'aria-label': 'Close', onclick: close },
      icon('close', { class: 'ic ic--xs' })),
    h('div', { class: 'sw-card__shot' }, cardImg),
    h('div', { class: 'sw-card__head' }, cardName, cardCount),
    cardRole, cardQuote, cardBody,
    h('div', { class: 'sw-card__meta' },
      h('span', {}, 'Archive'), cardSize,
    ),
    h('div', { class: 'sw-card__nav' },
      h('button', {
        class: 'sw-card__step', type: 'button', 'aria-label': 'Previous',
        onclick: () => take((at - 1 + count) % count),
      }, icon('chevron-left', { class: 'ic ic--xs' })),
      h('button', {
        class: 'sw-card__next', type: 'button',
        onclick: () => take((at + 1) % count),
      }, 'Next', icon('arrow-right', { class: 'ic ic--xs' })),
      h('button', {
        class: 'sw-card__resume', type: 'button', title: 'Let the reel run again',
        onclick: release,
      }, icon('present', { class: 'ic ic--xs' })),
    ),
  );

  /* ------------------------------------------------------------- the hero */
  const { lead, accent, name } = titleLines(block.title);
  const hero = h('div', { class: 'sw-hero' },
    h('h2', { class: 'sw-title' },
      lead ? h('span', { class: 'sw-title__lead' }, lead) : null,
      accent ? h('span', { class: 'sw-title__accent' }, accent) : null,
      name ? h('span', { class: 'sw-title__name' }, name) : null,
    ),
    h('button', {
      class: 'sw-start', type: 'button',
      onclick: () => (held ? release() : take(at < 0 ? 0 : at)),
    },
      h('span', {}, held ? 'Resume reel' : 'Walk the wall'),
      h('i', { class: 'sw-start__spark' }, icon('sparkles', { class: 'ic ic--xs' })),
    ),
  );

  /* --------------------------------------------- the note on the right side */
  const aside = h('div', { class: 'sw-note' },
    h('p', { class: 'sw-note__label' }, 'The archive'),
    h('p', { class: 'sw-note__body' },
      `${count} moments from ten years of building Technical Hub — the `
      + 'partnerships signed, the labs opened and the rooms they filled.'),
    h('dl', { class: 'sw-note__facts' },
      h('div', {}, h('dt', {}, 'Frames'), h('dd', {}, String(count))),
      h('div', {}, h('dt', {}, 'Subject'), h('dd', {}, 'Babji Neelam')),
    ),
  );

  /* ----------------------------------------------------------- the reel */
  const tiles = [];
  const runOf = (pass) => h('div', {
    class: 'sw-reel__run',
    // The second copy is the same pictures; a screen reader hears them once.
    'aria-hidden': pass ? 'true' : null,
  }, ...stories.map((story, i) => {
    const tile = h('button', {
      class: 'sw-tile',
      type: 'button',
      tabindex: pass ? '-1' : null,
      title: story.name || 'Open this story',
      style: REDUCED?.matches ? {} : {
        // Each card leans and sits at its own depth, so the run is not a ruler.
        '--lean': `${((i * 37) % 7) - 3}deg`,
        '--turn': `${((i * 53) % 9) - 4}deg`,
        '--shift': `${((i * 29) % 46) - 23}px`,
        /* The focal pulse, as inherited properties rather than animation-*
           directly: the animation lives on the inner face, and setting
           animation-duration here put it on the button instead — where nothing
           reads it, so the pulse silently never ran. Custom properties inherit;
           animation-duration does not. */
        '--roll': `${ROLL_SECONDS}s`,
        '--phase': `-${((i * ROLL_SECONDS) / count).toFixed(2)}s`,
      },
      onclick: () => take(i),
    },
      h('span', { class: 'sw-tile__face' },
        h('img', {
          src: src(story), alt: pass ? '' : (story.name || ''),
          loading: 'lazy', decoding: 'async',
        }),
        story.name ? h('span', { class: 'sw-tile__name' }, story.name) : null,
      ),
    );
    tile.dataset.story = String(i);
    tiles.push(tile);
    return tile;
  }));

  const reel = h('div', { class: 'sw-reel' },
    h('div', {
      class: 'sw-reel__belt',
      style: REDUCED?.matches ? {} : { 'animation-duration': `${ROLL_SECONDS}s` },
    }, runOf(0), runOf(1)),
  );

  /* Small muted markers, and the focal band the card follows. Decoration, so
     they are hidden from the accessibility tree. */
  const marks = h('div', { class: 'sw-marks', 'aria-hidden': 'true' },
    h('span', { class: 'sw-marks__dot sw-marks__dot--a' }),
    h('span', { class: 'sw-marks__dot sw-marks__dot--b' }),
    h('span', { class: 'sw-marks__dot sw-marks__dot--c' }),
    h('span', { class: 'sw-marks__focal' }),
  );

  root.appendChild(hero);
  root.appendChild(reel);
  root.appendChild(marks);
  root.appendChild(aside);
  root.appendChild(card);

  root.addEventListener('keydown', (event) => {
    if (!root.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key === 'ArrowDown') { event.stopPropagation(); event.preventDefault(); take((at + 1) % count); }
    if (event.key === 'ArrowUp') { event.stopPropagation(); event.preventDefault(); take((at - 1 + count) % count); }
  });

  /* The reel starts itself once the slide is in the document, and the interval
     is cleared the moment the slide leaves — a timer outliving its page would
     keep painting into a card nobody can see. */
  requestAnimationFrame(() => {
    if (!root.isConnected) return;
    paint(0);
    rollOn();
    const watch = new MutationObserver(() => {
      if (!root.isConnected) { clearInterval(timer); watch.disconnect(); }
    });
    watch.observe(document.body, { childList: true, subtree: true });
  });

  return root;
}
