import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Success Stories: a wall of faces that never stops moving, and any one of them
 * opens into the story beside it.
 *
 * The wall is a 3D marquee: four columns of portraits lying on a plane tilted
 * away from the viewer, each drifting on its own long loop so the field breathes
 * rather than scrolls. Adjacent columns run opposite directions at durations that
 * never line up — 10s against 15s — which is what stops it reading as one sheet
 * sliding past.
 *
 * All of it is CSS. The drift is a keyframe with `animation-direction:
 * alternate`, which is the same thing the original expresses as
 * `repeatType: "reverse"`, so nothing here runs per frame.
 *
 * Opening a face does not replace the wall. The portrait takes three quarters of
 * the width with the story beside it and the marquee keeps moving behind, so a
 * presenter can go from one person to the next without the page ever going still.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* Four columns, as the marquee does. Fewer and the plane looks bare once it is
   tilted; more and each portrait is too small to recognise a face in. */
const MARQUEE_COLS = 4;

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
  const stageShot = h('div', { class: 'sw-stage__shot' }, stageImg);

  /* Sixteen of the twenty-five files are 206px square. Filling the frame
     enlarged those about fivefold and looked it, so the displayed size is
     solved from three limits and the smallest wins: the frame's width, the
     frame's height, and twice the file's own pixels.
     Done in script because only the loaded file knows its own size, and with
     explicit width and height because max-width alone only ever caps — with
     `width: auto` the image simply sat at 1x in a large empty box. */
  const MAX_ENLARGE = 2;
  const fitStage = () => {
    const nw = stageImg.naturalWidth;
    const nh = stageImg.naturalHeight;
    if (!nw || !nh) return;
    const fw = stageShot.clientWidth;
    const fh = stageShot.clientHeight;
    if (!fw || !fh) return;
    const scale = Math.min(MAX_ENLARGE, fw / nw, fh / nh);
    stageImg.style.width = `${Math.round(nw * scale)}px`;
    stageImg.style.height = `${Math.round(nh * scale)}px`;
  };
  stageImg.addEventListener('load', fitStage);
  const stageName = h('h3', { class: 'sw-stage__name' });
  const stageRole = h('p', { class: 'sw-stage__role' });
  const stageQuote = h('blockquote', { class: 'sw-stage__quote' });
  const stageBody = h('p', { class: 'sw-stage__body' });

  const close = () => {
    root.classList.remove('is-open');
    tiles.forEach((t) => t.classList.remove('is-active'));
  };

  const stage = h('div', { class: 'sw-stage' },
    stageShot,
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
    stageImg.src = media(`/uploads/${encodeURI(story.photo)}`);
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

  /* The wall is a 3D marquee: four columns laid on a plane tilted away from the
     viewer, each drifting on its own long loop so the whole field breathes.
     Adjacent columns run opposite directions and at different speeds, which is
     what stops it reading as one sheet sliding past.
     The drift is a CSS keyframe with `direction: alternate` — the same thing the
     original expresses as `repeatType: "reverse"` — so there is no per-frame
     JavaScript behind any of it. */
  const cols = columnsFrom(stories, MARQUEE_COLS);
  const grid = h('div', { class: 'sw-mq__grid' });

  cols.forEach((group, ci) => {
    const column = h('div', {
      class: 'sw-mq__col',
      style: REDUCED?.matches ? {} : {
        // Even columns fall, odd ones rise; the two durations never line up.
        'animation-duration': `${ci % 2 === 0 ? 10 : 15}s`,
        'animation-direction': ci % 2 === 0 ? 'alternate' : 'alternate-reverse',
        // Negative delay starts each column part-way through its own travel.
        'animation-delay': `-${ci * 2.5}s`,
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
          src: media(`/uploads/${encodeURI(story.photo)}`),
          alt: story.name || '', loading: 'lazy', decoding: 'async',
        }),
        story.name ? h('span', { class: 'sw-tile__name' }, story.name) : null,
      );
      tiles.push(tile);
      column.appendChild(tile);
    });
    grid.appendChild(column);
  });

  const wall = h('div', { class: 'sw-mq' }, h('div', { class: 'sw-mq__plane' }, grid));

  root.appendChild(intro);
  root.appendChild(stage);
  /* Straight onto the root, with no wrapper. The marquee is absolutely
     positioned against .sw-root, which is already the positioned, clipping
     ancestor — a flex wrapper in between only gave it a zero-height parent to
     resolve nothing against. */
  root.appendChild(wall);

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      event.stopPropagation();
      close();
    }
  });

  return root;
}
