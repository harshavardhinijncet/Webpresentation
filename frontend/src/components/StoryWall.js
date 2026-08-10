import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

/**
 * Success Stories: a wall of faces that never stops moving, and any one of them
 * opens into the story beside it.
 *
 * The wall is columns, not a grid. Each column carries two or three portraits,
 * sits on an arc so the whole run reads as a wave, and rises and falls on its
 * own clock — the columns are the bars of the equaliser, which is why the
 * bobbing goes on a wrapper and the arc on the column itself. One transform per
 * element; stack them and the animation overrides the offset, and the wave
 * flattens the moment it starts playing.
 *
 * Opening a face does not replace the wall. The portrait takes three quarters
 * of the width with the story beside it and the wall keeps running underneath,
 * so a presenter can move from one person to the next without the page ever
 * going still.
 */

const UPLOADS = '/uploads';
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* The wave only ever lifts. A curve centred on zero puts half the columns
   below the baseline, and the baseline is the floor of the slide — three of
   them hung 15px off the bottom edge. Riding from 0 upwards keeps the run
   sitting on the floor while still reading as a crowd. */
const arcFor = (i, n) => (n < 2 ? 0
  : -Math.round(24 * (1 - Math.cos((i / (n - 1)) * Math.PI * 2.4))));

/* The slide is a fixed 1600 nominal canvas, so the run can be made to reach
   both edges exactly rather than sitting in the middle of it: choose a column
   count, then let the tile width fall out of the arithmetic. */
const CANVAS = 1600;
const GAP = 10;
/* Must match the side padding on .sw-wall. The tile width is derived from the
   space actually available, and leaving the padding out of the sum is what
   pushed the end tiles past the slide edge: 13 tiles plus 12 gaps plus 20px of
   padding came to 1622 in a 1600 canvas. */
const EDGE = 10;

function layoutFor(count) {
  const cols = Math.max(6, Math.min(16, Math.round(count / 2)));
  const usable = CANVAS - EDGE * 2 - (cols - 1) * GAP;
  const tile = Math.floor(usable / cols);
  return { cols, tile, shot: Math.round(tile * 1.33) };
}

/** Round-robin, so no column stands more than one portrait taller than another. */
function columnsFrom(stories, cols) {
  const out = Array.from({ length: cols }, () => []);
  stories.forEach((s, i) => out[i % cols].push(s));
  return out.filter((c) => c.length);
}

export function StoryWall(block, { editing = false } = {}) {
  const stories = (block.stories || []).filter((s) => s.photo);
  const root = h('div', { class: 'sw-root ph-root' });

  if (!stories.length) {
    /* This page is published, so a presenter can land on it before the
       portraits arrive. It shows the headline and nothing else — the folder to
       fill is a note for whoever is building the deck, not something to put on
       a wall in front of a college. */
    root.appendChild(h('div', { class: 'sw-empty' },
      h('h2', { class: 'sw-title' }, block.title || 'Success Stories'),
      editing
        ? h('p', { class: 'sw-hint' },
            'Drop the portraits into backend/uploads/stories/ and re-run the publish step.')
        : null,
    ));
    return root;
  }

  /* ------------------------------------------------------------- the stage */
  const stageImg = h('img', { class: 'sw-stage__img', alt: '' });
  const stageName = h('h3', { class: 'sw-stage__name' });
  const stageRole = h('p', { class: 'sw-stage__role' });
  const stageQuote = h('blockquote', { class: 'sw-stage__quote' });
  const stageBody = h('p', { class: 'sw-stage__body' });

  const close = () => {
    root.classList.remove('is-open');
    tiles.forEach((t) => t.classList.remove('is-active'));
  };

  const stage = h('div', { class: 'sw-stage' },
    h('div', { class: 'sw-stage__shot' }, stageImg),
    h('div', { class: 'sw-stage__side' },
      h('button', { class: 'sw-close', type: 'button', onclick: close },
        icon('close', { class: 'ic ic--xs' }), h('span', {}, 'Close')),
      stageName, stageRole, stageQuote, stageBody,
    ),
  );

  /* --------------------------------------------------------- the intro copy */
  const intro = h('div', { class: 'sw-intro' },
    h('h2', { class: 'sw-title' }, block.title || 'Success Stories'),
  );

  /* ------------------------------------------------------------- the wall */
  const tiles = [];
  const open = (story, tile) => {
    stageImg.src = `${UPLOADS}/${encodeURI(story.photo)}`;
    stageImg.alt = story.name || '';
    stageName.textContent = story.name || '';
    stageRole.textContent = story.role || '';
    stageQuote.textContent = story.quote || '';
    stageBody.textContent = story.body || '';
    // A story with nothing written for it should not draw an empty slab.
    stageName.hidden = !story.name;
    stageRole.hidden = !story.role;
    stageQuote.hidden = !story.quote;
    stageBody.hidden = !story.body;

    tiles.forEach((t) => t.classList.toggle('is-active', t === tile));
    root.classList.add('is-open');
  };

  const { cols: colCount, tile: tileW, shot: shotH } = layoutFor(stories.length);
  const cols = columnsFrom(stories, colCount);
  const wall = h('div', {
    class: 'sw-wall',
    style: { '--sw-tile': `${tileW}px`, '--sw-shot': `${shotH}px`, gap: `${GAP}px` },
  });

  cols.forEach((group, ci) => {
    const column = h('div', {
      class: 'sw-col',
      style: { transform: `translateY(${arcFor(ci, cols.length)}px)` },
    });
    const bob = h('div', {
      class: 'sw-col__bob',
      style: REDUCED?.matches ? {} : {
        // Prime numbers of milliseconds keep the columns from falling into step.
        'animation-duration': `${2100 + ((ci * 370) % 1900)}ms`,
        'animation-delay': `-${(ci * 290) % 2300}ms`,
      },
    });
    group.forEach((story) => {
      const tile = h('button', {
        class: 'sw-tile',
        type: 'button',
        title: story.name || 'Open this story',
        onclick: () => open(story, tile),
      },
        h('img', {
          src: `${UPLOADS}/${encodeURI(story.photo)}`,
          alt: story.name || '', loading: 'lazy', decoding: 'async',
        }),
        story.name ? h('span', { class: 'sw-tile__name' }, story.name) : null,
      );
      tiles.push(tile);
      bob.appendChild(tile);
    });
    column.appendChild(bob);
    wall.appendChild(column);
  });

  root.appendChild(intro);
  root.appendChild(stage);
  root.appendChild(h('div', { class: 'sw-wallwrap' }, wall));

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      event.stopPropagation();
      close();
    }
  });

  return root;
}
