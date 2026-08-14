import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Success Stories as a card carousel that arrives folded.
 *
 * It opens as a single stack — one card face on, the rest tucked behind it with a
 * step of offset each — and one click deals them into a row. From there the arrows
 * walk along it, the centre card sits full size with its neighbours set back, and
 * a card's own View opens the photograph at full size.
 *
 * Every card is placed by one function, for both states. Nothing is measured and
 * no FLIP is needed: a card's transform is a pure function of how far it is from
 * the centre and whether the deck is open, so changing state is a matter of
 * recomputing and letting CSS interpolate. That is also why dealing out and
 * stepping along share a motion — they are the same calculation with different
 * inputs.
 *
 * Photographs are contained rather than cropped, and capped at twice their own
 * pixels. Sixteen of the twenty-five files are 206px square; at their own size on
 * a card they read as small and sharp, which is honest, where filling the frame
 * would enlarge them about fivefold.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* How far apart the dealt cards sit, and how many show either side of centre. */
const STEP = 340;
const WINGS = 2;
const MAX_ENLARGE = 2;

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
  let centre = 0;
  let open = false;

  /* ------------------------------------------------------------ the viewer */
  /* Portalled to the body: FitSlide scales the slide with a transform, and a
     transformed ancestor becomes the containing block for fixed descendants, so
     inside the slide `inset: 0` would resolve to the slide and not the screen. */
  const bigImg = h('img', { class: 'sw-view__img', alt: '' });
  const bigCap = h('p', { class: 'sw-view__cap' });
  const viewer = h('div', {
    class: 'sw-view', hidden: true,
    onclick: (e) => { if (e.target === viewer || e.target.closest('.sw-view__close')) shut(); },
  },
    h('button', { class: 'sw-view__close', type: 'button', 'aria-label': 'Close' },
      icon('close', { class: 'ic ic--sm' })),
    h('figure', { class: 'sw-view__frame' }, bigImg, h('figcaption', {}, bigCap)),
  );
  document.body.appendChild(viewer);

  function shut() {
    viewer.hidden = true;
    viewer.classList.remove('is-on');
    document.removeEventListener('keydown', onViewKey, true);
  }
  function onViewKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); }
  }
  function view(i) {
    const story = stories[i];
    if (!story) return;
    bigImg.src = src(story);
    bigImg.alt = story.name || '';
    bigCap.textContent = story.name || '';
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add('is-on'));
    document.addEventListener('keydown', onViewKey, true);
  }

  /* -------------------------------------------------------------- the cards */
  const cards = stories.map((story, i) => {
    const shot = h('img', {
      class: 'sw-c__img', src: src(story), alt: story.name || '',
      loading: i < 6 ? 'eager' : 'lazy', decoding: 'async',
    });
    /* Capped at twice its own pixels once the file has decoded — max-width alone
       would not do it, because the image is sized by the card, not by itself. */
    shot.addEventListener('load', () => {
      const { naturalWidth: nw, naturalHeight: nh } = shot;
      if (!nw || !nh) return;
      shot.style.maxWidth = `min(100%, ${nw * MAX_ENLARGE}px)`;
      shot.style.maxHeight = `min(100%, ${nh * MAX_ENLARGE}px)`;
    });

    const card = h('article', { class: 'sw-c' },
      h('div', { class: 'sw-c__shot' }, shot),
      h('div', { class: 'sw-c__foot' },
        h('p', { class: 'sw-c__name' }, story.name || 'Untitled'),
        h('button', {
          class: 'sw-c__view', type: 'button',
          onclick: (e) => { e.stopPropagation(); view(i); },
        }, 'View', icon('arrow-right', { class: 'ic ic--xs' })),
      ),
    );
    /* The whole card is the target. Folded, any click deals the deck out; dealt,
       a neighbour walks to the centre and the centre card opens. */
    card.addEventListener('click', () => {
      if (!open) { deal(); return; }
      if (i === centre) view(i);
      else go(i);
    });
    return card;
  });

  const deck = h('div', { class: 'sw-deck' }, ...cards);

  /**
   * One placement rule for both states.
   *
   * Folded, a card's offset is its depth in the pile, clamped — so the fourth card
   * back and the twenty-fourth sit in the same place and only the front few are
   * drawn at all. Dealt, its offset is how far it is from the centre. Same
   * function, different input, which is why the deal and the step share a motion
   * and neither needed measuring.
   */
  function place() {
    cards.forEach((card, i) => {
      const d = i - centre;
      const away = Math.abs(d);
      if (!open) {
        const depth = Math.min(away, 3);
        card.style.transform =
          `translate(-50%, -50%) translate(${depth * 15}px, ${depth * -11}px) rotate(${depth * 1.4}deg) scale(${1 - depth * 0.05})`;
        card.style.opacity = away <= 3 ? '1' : '0';
        card.style.zIndex = String(40 - depth);
        card.style.pointerEvents = away === 0 ? 'auto' : 'none';
        card.classList.toggle('is-centre', away === 0);
        return;
      }
      card.style.transform =
        `translate(-50%, -50%) translateX(${d * STEP}px) rotate(0deg) scale(${away === 0 ? 1 : 0.84})`;
      card.style.opacity = away <= WINGS ? (away === 0 ? '1' : '0.5') : '0';
      card.style.zIndex = String(40 - away);
      card.style.pointerEvents = away <= WINGS ? 'auto' : 'none';
      card.classList.toggle('is-centre', away === 0);
    });
    prev.disabled = open && centre === 0;
    next.disabled = open && centre === count - 1;
    counter.textContent = `${String(centre + 1).padStart(2, '0')} / ${count}`;
  }

  const go = (i) => { centre = Math.max(0, Math.min(count - 1, i)); place(); };

  function deal() {
    open = true;
    root.classList.add('is-open');
    place();
  }
  function fold() {
    open = false;
    centre = 0;
    root.classList.remove('is-open');
    place();
  }

  /* ---------------------------------------------------------------- controls */
  const prev = h('button', {
    class: 'sw-nav__btn', type: 'button', 'aria-label': 'Previous',
    onclick: () => go(centre - 1),
  }, icon('chevron-left', { class: 'ic ic--sm' }));
  const next = h('button', {
    class: 'sw-nav__btn', type: 'button', 'aria-label': 'Next',
    onclick: () => go(centre + 1),
  }, icon('chevron-right', { class: 'ic ic--sm' }));
  const counter = h('span', { class: 'sw-nav__count' });
  const nav = h('div', { class: 'sw-nav' },
    prev, counter, next,
    h('button', { class: 'sw-nav__fold', type: 'button', onclick: fold }, 'Fold'),
  );

  /* ------------------------------------------------------------------ header */
  const { lead, accent, name } = titleLines(block.title);
  const head = h('div', { class: 'sw-head' },
    h('h2', { class: 'sw-title' },
      lead ? h('span', { class: 'sw-title__lead' }, lead) : null,
      accent ? h('span', { class: 'sw-title__accent' }, accent) : null,
      name ? h('span', { class: 'sw-title__name' }, name) : null,
    ),
    h('p', { class: 'sw-lead' }, `${count} moments from ten years of building Technical Hub.`),
    h('button', {
      class: 'sw-open', type: 'button',
      onclick: () => (open ? fold() : deal()),
    },
      h('span', { class: 'sw-open__label' }, 'Deal the collection'),
      icon('layers', { class: 'ic ic--xs' }),
    ),
  );

  root.appendChild(head);
  root.appendChild(deck);
  root.appendChild(nav);

  root.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'ArrowRight') { event.stopPropagation(); event.preventDefault(); go(centre + 1); }
    if (event.key === 'ArrowLeft') { event.stopPropagation(); event.preventDefault(); go(centre - 1); }
    if (event.key === 'Escape') { event.stopPropagation(); fold(); }
  });

  /* Placed on the next frame, not during construction: the first paint has to
     carry the folded transforms for the deal to animate away from them. Set them
     synchronously and the browser takes the dealt state as the starting style and
     skips the motion entirely. */
  requestAnimationFrame(place);

  /* The viewer lives on the body, so it has to be taken down by hand when the
     slide that owns it is replaced. */
  const watch = new MutationObserver(() => {
    if (!root.isConnected) {
      viewer.remove();
      watch.disconnect();
      document.removeEventListener('keydown', onViewKey, true);
    }
  });
  watch.observe(document.body, { childList: true, subtree: true });

  return root;
}
