import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Success Stories: a headline on the left, a diagonal ribbon of moments running
 * through the middle, and the one you pick opening as a card on the right.
 *
 * The ribbon is a single column rotated off vertical, so the tiles read as a
 * stream passing through the slide rather than a grid sitting in it. It is taller
 * than the slide on purpose — the ends run out of frame, which is what makes it a
 * stream — and it drifts along its own axis so the field is never quite still.
 *
 * The card carries only what the data actually holds: the picture, the name, and
 * where it sits in the set. The reference fills its panel with prompt metadata;
 * there is no equivalent here, and inventing chips to fill the space would be
 * putting words in the subject's mouth. Role, quote and body render if they are
 * ever supplied.
 *
 * All motion is CSS. Nothing runs per frame and everything stops under
 * prefers-reduced-motion.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/** The headline, split so each line can be set differently. */
function titleLines(raw) {
  const text = String(raw || 'Success Stories').replace(/[—–-]/g, '—');
  const [head, tail] = text.split('—').map((s) => s.trim());
  // "The Legacy — Babji Neelam" becomes three lines: The / Legacy / the name.
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
  let at = -1;

  /* ------------------------------------------------------------- the card */
  const cardImg = h('img', { class: 'sw-card__img', alt: '' });
  const cardName = h('h3', { class: 'sw-card__name' });
  const cardRole = h('p', { class: 'sw-card__role' });
  const cardQuote = h('blockquote', { class: 'sw-card__quote' });
  const cardBody = h('p', { class: 'sw-card__body' });
  const cardCount = h('span', { class: 'sw-card__count' });

  /* Sixteen of the twenty-five files are 206px square. The card is bounded so a
     small file is shown at its own size rather than blown up into the frame —
     five times enlargement is softness no source survives. */
  const MAX_ENLARGE = 2;
  const fitCard = () => {
    const { naturalWidth: nw, naturalHeight: nh } = cardImg;
    if (!nw || !nh) return;
    const box = cardImg.parentElement;
    const fw = box?.clientWidth;
    if (!fw) return;
    const w = Math.min(fw, nw * MAX_ENLARGE);
    cardImg.style.width = `${Math.round(w)}px`;
    cardImg.style.height = `${Math.round((w / nw) * nh)}px`;
  };
  cardImg.addEventListener('load', fitCard);

  const close = () => {
    at = -1;
    root.classList.remove('is-open');
    tiles.forEach((t) => t.classList.remove('is-active'));
  };

  const card = h('aside', { class: 'sw-card' },
    h('button', { class: 'sw-card__close', type: 'button', 'aria-label': 'Close', onclick: close },
      icon('close', { class: 'ic ic--xs' })),
    h('div', { class: 'sw-card__shot' }, cardImg),
    h('div', { class: 'sw-card__head' }, cardName, cardCount),
    cardRole, cardQuote, cardBody,
    h('div', { class: 'sw-card__nav' },
      h('button', {
        class: 'sw-card__step', type: 'button', 'aria-label': 'Previous story',
        onclick: () => step(-1),
      }, icon('chevron-left', { class: 'ic ic--xs' })),
      h('button', { class: 'sw-card__next', type: 'button', onclick: () => step(1) },
        'Next story', icon('arrow-right', { class: 'ic ic--xs' })),
    ),
  );

  const open = (index) => {
    const story = stories[index];
    if (!story) return;
    at = index;
    cardImg.src = src(story);
    cardImg.alt = story.name || '';
    cardName.textContent = story.name || '';
    cardCount.textContent = `${index + 1} / ${stories.length}`;
    cardRole.textContent = story.role || '';
    cardQuote.textContent = story.quote || '';
    cardBody.textContent = story.body || '';
    // A story with nothing written for it should not draw an empty slab.
    cardRole.hidden = !story.role;
    cardQuote.hidden = !story.quote;
    cardBody.hidden = !story.body;

    tiles.forEach((t, i) => t.classList.toggle('is-active', i === index));
    root.classList.add('is-open');
    // Bring the chosen tile into the ribbon's view.
    tiles[index]?.scrollIntoView({ block: 'center', behavior: REDUCED?.matches ? 'auto' : 'smooth' });
  };
  const step = (delta) => open((at + delta + stories.length) % stories.length);

  /* ------------------------------------------------------------- the hero */
  const { lead, accent, name } = titleLines(block.title);
  const hero = h('div', { class: 'sw-hero' },
    h('h2', { class: 'sw-title' },
      lead ? h('span', { class: 'sw-title__lead' }, lead) : null,
      accent ? h('span', { class: 'sw-title__accent' }, accent) : null,
      name ? h('span', { class: 'sw-title__name' }, name) : null,
    ),
    h('p', { class: 'sw-lead' },
      `${stories.length} moments from ten years of building Technical Hub — `
      + 'the partnerships, the launches and the rooms they filled.'),
    h('button', {
      class: 'sw-start', type: 'button',
      onclick: () => open(at < 0 ? 0 : at),
    },
      h('span', {}, 'Walk the wall'),
      h('i', { class: 'sw-start__spark' }, icon('sparkles', { class: 'ic ic--xs' })),
    ),
  );

  /* ----------------------------------------------------------- the ribbon */
  const tiles = stories.map((story, i) => h('button', {
    class: 'sw-tile',
    type: 'button',
    title: story.name || 'Open this story',
    style: REDUCED?.matches ? {} : {
      // Each tile leans a little differently, so the stream is not a ruler.
      '--lean': `${((i * 37) % 7) - 3}deg`,
    },
    onclick: () => open(i),
  },
    h('img', {
      src: src(story), alt: story.name || '', loading: 'lazy', decoding: 'async',
    }),
    story.name ? h('span', { class: 'sw-tile__name' }, story.name) : null,
  ));

  const ribbon = h('div', { class: 'sw-ribbon' },
    h('div', { class: 'sw-ribbon__run' }, ...tiles),
  );

  root.appendChild(hero);
  root.appendChild(ribbon);
  root.appendChild(card);

  root.addEventListener('keydown', (event) => {
    if (!root.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key === 'ArrowDown') { event.stopPropagation(); event.preventDefault(); step(1); }
    if (event.key === 'ArrowUp') { event.stopPropagation(); event.preventDefault(); step(-1); }
  });

  return root;
}
