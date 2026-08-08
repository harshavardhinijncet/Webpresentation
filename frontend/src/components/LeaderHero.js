import { h, svg } from '../utils/dom.js';
import { inlineRich } from '../utils/format.js';
import { icon } from '../utils/icons.js';

/* Berths measured against the cutout's own silhouette, not spaced evenly down
   the column. The figure is only ~28% of the column wide at the head and swells
   to ~96% at the arms, so a constant inset that hugs him at the waist leaves the
   upper pills stranded in empty ground. The top three therefore sit well inboard
   to meet the head and neck; the lower two ride the shoulder line, which is
   where the reference has them overlap the photo.
   Order matches the stored tag order.

   Every pill is anchored by the edge that faces the figure — `right` on the left
   side, `left` on the right side — so a longer label grows away from him instead
   of creeping over the head. Anchoring by the outer edge made the gap a function
   of the label's length, which is why the upper pills drifted.

   The numbers below are read off the asset's own alpha, sampled every 2% of its
   height, then mapped through the box the portrait actually occupies in this
   column (109.3% of its width, top at 2.5%, see the wrapper rule in app.css):

     row 16%  silhouette 35.0 → 63.0   (temple)
     row 21%              33.0 → 64.5   (jaw, widest point of the head)
     row 38%              32.0 → 66.5   (neck, just before the shoulders flare)
     row 52%              11.1 → 88.0   (shoulder line)
     row 77%               4.2 → 96.0   (upper arm)

   The two lower pills are held off the block's right edge rather than off the
   silhouette: at 96% he is nearly column-wide, and honouring the gap there would
   push them past the edge, where `overflow: hidden` would slice the rounded end
   off. They ride the arm instead, which is where the reference has them. */
const TAG_SPOTS = [
  // Beside the temple — silhouette starts at 33.8% of the column here.
  { side: 'left', right: '69%', top: '16.4%' },
  // Off the far shoulder — silhouette ends at 66.1%.
  { side: 'right', left: '68.5%', top: '21.4%' },
  // At the neck, before the shoulders flare.
  { side: 'left', right: '71%', top: '38.5%' },
  /* These two overlap the upper arm by design; he is near column-wide here, so
     they are set off the block's right edge instead — and off the same edge, so
     the pair reads as one margin rather than two near-misses. */
  { side: 'right', left: '79%', top: '52.6%' },
  { side: 'right', left: '75%', top: '77.7%' },
];

/* The name is drawn, not typed: an outline strokes itself on, then the solid
   letterform fades in over it. That needs real SVG text — stroke-dasharray has
   no effect on an HTML element. */
const NAME_SIZE = 130; // user units; the viewBox is fitted to the glyphs below
const NAME_BASELINE = 100;
const NAME_BOX_H = 118;

/**
 * Sizes the viewBox from the glyphs actually rasterised rather than from a
 * width measured against Oswald. The display face is whatever survived the
 * fallback chain, so a hardcoded viewBox would either crop the surname or
 * leave a gap before the portrait. Both name parts keep one shared cap height
 * because each SVG carries the same viewBox height and takes its width from
 * the intrinsic ratio.
 */
function fitNameBox(svgEl, textEl) {
  let box;
  try {
    box = textEl.getBBox();
  } catch {
    return; // not laid out yet (detached, or display:none) — leave the estimate
  }
  if (!box || !box.width) return;
  const pad = 2; // the stroke sits astride the outline, so it overhangs the bbox
  svgEl.setAttribute('viewBox', `${box.x - pad} 0 ${box.width + pad * 2} ${NAME_BOX_H}`);
}

/**
 * Sets the watermark's size from the block it spans rather than from a viewport
 * clamp, so the surname reaches both edges whatever its length and however wide
 * the slide is. Measured off a probe size and scaled, because the glyph widths
 * of the fallback serif are not knowable ahead of time.
 */
const WATERMARK_PROBE = 200;

function fitWatermark(host, inner) {
  if (!host.clientWidth) return;
  /* Clear last run's correction first. This fires on rAF, on fonts.ready and on
     every resize, and the offset below is derived from where the text sits — so
     measuring while the previous translate is still applied makes each run
     cancel the one before it. */
  inner.style.transform = 'none';
  inner.style.fontSize = `${WATERMARK_PROBE}px`;
  const measured = inner.getBoundingClientRect().width;
  if (!measured) return;
  // Both rects are post-transform, so the slide's scale cancels in the ratio.
  const hostBox = host.getBoundingClientRect();
  const ratio = hostBox.width ? measured / hostBox.width : 0;
  if (!ratio) return;
  inner.style.fontSize = `${Math.round((WATERMARK_PROBE / ratio) * 0.98)}px`;

  /* Optical centring. Centring the line box is not centring the letters: a
     surname with no descender has all its ink above the baseline — "Neelam"
     measures a 305px ascent against a 6px descent — which leaves the word
     sitting ~5% of the block high. Shift by the measured gap between the ink
     centre and the block centre.
     Everything here is kept in unscaled CSS pixels: TextMetrics reports those,
     while getBoundingClientRect reports post-scale, and mixing the two silently
     bakes the slide's scale into the offset. */
  const scale = hostBox.width / host.clientWidth;
  if (!scale) return;
  const cs = getComputedStyle(inner);
  const ctx = (fitWatermark.ctx ||= document.createElement('canvas').getContext('2d'));
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const ink = ctx.measureText(inner.textContent || '');
  if (!(ink.actualBoundingBoxAscent >= 0)) return; // unsupported — leave it boxed

  /* Everything is measured against the line box, never the block. The entrance
     animation holds the watermark 16px low through its delay, and an ancestor
     transform shifts any block-relative reading by that much — which silently
     lands in the offset. The baseline and the line box move together, so their
     difference is immune to it. */
  const lineBox = inner.getBoundingClientRect();
  const probe = document.createElement('span');
  probe.textContent = 'x';
  probe.style.cssText = 'display:inline-block;width:0;overflow:hidden';
  inner.appendChild(probe);
  const baselineInBox = (probe.getBoundingClientRect().bottom - lineBox.top) / scale;
  probe.remove();

  // align-items already centres the line box on the block, so closing the gap
  // between the ink centre and the line-box centre is what centres the letters.
  const inkCentreInBox = baselineInBox - (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
  const delta = lineBox.height / scale / 2 - inkCentreInBox;
  if (!Number.isFinite(delta)) return;

  /* A correction this size only ever closes the gap between the line box and
     the ink inside it, so it cannot exceed the line box. Bounding it means a
     font whose metrics arrive wrong — or a measurement taken on a frame where
     the block was mid-transform — nudges the watermark rather than throwing it
     off the top of the slide. */
  const bound = lineBox.height / scale;
  inner.style.transform = `translateY(${Math.round(Math.max(-bound, Math.min(bound, delta)))}px)`;
}

function watermark(text) {
  const inner = h('span', { class: 'leader-hero__watermark-text' }, text);
  const node = h('div', { class: 'leader-hero__watermark', 'aria-hidden': 'true' }, inner);

  const fit = () => {
    const host = node.closest('.leader-hero__stage');
    if (host) fitWatermark(host, inner);
  };
  requestAnimationFrame(fit);
  if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
  // Presenting rescales the slide, and the pane resizes with the nav.
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(fit);
    requestAnimationFrame(() => {
      const host = node.closest('.leader-hero__stage');
      if (host) ro.observe(host);
    });
  }

  return node;
}

function nameLine(text, { tone, strokeDelay, fillDelay }) {
  const shared = {
    x: 0,
    y: NAME_BASELINE,
    'font-size': NAME_SIZE,
    'letter-spacing': '.01em',
  };

  const stroke = svg('text', {
    ...shared,
    class: 'leader-hero__draw-stroke',
    stroke: tone,
    'stroke-width': 1.5,
    fill: 'none',
    style: { animationDelay: strokeDelay },
  }, text);

  const fill = svg('text', {
    ...shared,
    class: 'leader-hero__draw-fill',
    fill: tone,
    style: { animationDelay: fillDelay },
  }, text);

  // A condensed cap runs roughly half its point size wide; corrected on load.
  const estimate = Math.max(1, text.length) * NAME_SIZE * 0.52;
  const node = svg(
    'svg',
    {
      class: 'leader-hero__draw',
      viewBox: `0 0 ${estimate} ${NAME_BOX_H}`,
      preserveAspectRatio: 'xMinYMid meet',
      role: 'img',
      'aria-label': text,
    },
    stroke,
    fill,
  );

  // Fonts land after first paint, and a substituted face changes every advance
  // width, so fit once the real face is in and again on the next frame in case
  // the block was still detached.
  const fit = () => fitNameBox(node, fill);
  requestAnimationFrame(fit);
  if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});

  return node;
}

export function LeaderHero(block, { editing = false } = {}) {
  const tags = (block.tags || []).slice(0, TAG_SPOTS.length);
  const portraitUrl = block.asset?.url || '/uploads/babji_hero_crop.png';

  const eyebrow = h(
    'div',
    { class: 'leader-hero__eyebrow' },
    block.index ? h('span', { class: 'leader-hero__index' }, block.index) : null,
    h('span', { class: 'leader-hero__rule' }),
    block.kicker ? h('span', { class: 'leader-hero__kicker' }, block.kicker) : null,
  );

  // Given name in ink, surname in the organization's lead colour.
  const name = h(
    'div',
    { class: 'leader-hero__name' },
    block.firstName
      ? h('div', { class: 'leader-hero__name-line' }, nameLine(block.firstName.toUpperCase(), {
          tone: 'var(--leader-ink)',
          strokeDelay: '0s',
          fillDelay: '1.45s',
        }))
      : null,
    block.lastName
      ? h('div', { class: 'leader-hero__name-line' }, nameLine(block.lastName.toUpperCase(), {
          tone: 'var(--leader-accent)',
          strokeDelay: '.4s',
          fillDelay: '1.9s',
        }))
      : null,
  );

  const socials = (block.links || []).length
    ? h(
        'div',
        { class: 'leader-hero__follow' },
        h('span', { class: 'leader-hero__follow-label' }, 'Follow'),
        h(
          'div',
          { class: 'leader-hero__socials' },
          ...block.links.map((link) =>
            h(
              'a',
              {
                class: 'leader-hero__social ph-social',
                href: link.href,
                target: '_blank',
                rel: 'noopener noreferrer',
                title: link.label || undefined,
                'aria-label': link.label || 'Social profile',
              },
              icon(link.icon || 'link', { class: 'ic ic--sm' }),
            ),
          ),
        ),
      )
    : null;

  const figure = h(
    'div',
    { class: 'leader-hero__figure' },

    /* The portrait is an alpha cutout, so the same PNG doubles as a mask: every
       layer below is shaped by the silhouette. Two ground-coloured blurs behind
       it feather the cut edge into the page, and a rim light plus a foot shadow
       sit over it so the figure is lit rather than pasted. */
    h(
      'div',
      {
        class: 'leader-hero__portrait-wrapper',
        style: { '--portrait': `url("${encodeURI(portraitUrl)}")` },
      },
      h('div', { class: 'leader-hero__glow', 'aria-hidden': 'true' }),
      h('div', { class: 'leader-hero__layer leader-hero__feather--tight', 'aria-hidden': 'true' }),
      h('div', { class: 'leader-hero__layer leader-hero__feather--soft', 'aria-hidden': 'true' }),
      h('img', {
        class: 'leader-hero__portrait',
        src: portraitUrl,
        alt: block.alt || `${block.firstName || ''} ${block.lastName || ''}`.trim() || 'Portrait',
      }),
      h('div', { class: 'leader-hero__layer leader-hero__rim', 'aria-hidden': 'true' }),
      h('div', { class: 'leader-hero__layer leader-hero__shade', 'aria-hidden': 'true' }),
    ),

    // Floating pill badges
    ...tags.map((tag, index) => {
      const spot = TAG_SPOTS[index];
      // The tail is a lead-in rule pointing back at the figure, so it hangs off
      // whichever edge faces the portrait.
      const tail = h('span', { class: 'leader-hero__tag-tail', 'aria-hidden': 'true' });
      const glyph = icon(tag.icon || 'arrow-right', { class: 'ic ic--xs' });
      const label = h('span', {}, tag.label);
      const parts = spot.side === 'right' ? [tail, glyph, label] : [glyph, label, tail];

      return h(
        'span',
        {
          class: `leader-hero__tag leader-hero__tag--${spot.side}${
            tag.solid ? ' leader-hero__tag--solid' : ''
          }`,
          style: {
            '--tag-delay': `${1.1 + index * 0.15}s`,
            top: spot.top,
            left: spot.left,
            right: spot.right,
          },
        },
        ...parts,
      );
    }),
  );

  const pane = h(
    'div',
    { class: 'leader-hero__pane' },
    eyebrow,
    name,
    block.tagline
      ? h('div', { class: 'leader-hero__copy' },
          h('p', { class: 'leader-hero__tagline' }, block.tagline),
          block.body ? h('p', { class: 'leader-hero__body', html: inlineRich(block.body) }) : null,
        )
      : null,
    socials,
  );

  /* The composition lives in a stage with a floored aspect rather than in the
     block itself. Presenting stretches the slide to the screen's shape, and the
     portrait is `contain`-fitted into a column whose width does not grow with
     it — so below roughly 1.43 the column turns taller than the cutout's own
     ratio, `contain` starts fitting by width instead of height, and the figure
     shrinks and slides down the column while the pills, anchored to the column,
     stay where they were. That is the gap between the head and the tags.

     Flooring the stage at 16:10 keeps the shape on the safe side of that
     crossover at any screen. It is inert at 16:9 and at 16:10 — the two shapes
     a deck is actually shown at — and on anything taller the stage centres
     itself and the block's own cream carries on past it, so there is no band to
     see. The alternative, sizing the portrait against both axes, only moves the
     same failure into the tag geometry. */
  const stage = h('div', { class: 'leader-hero__stage' },
    // Spans the whole stage, behind both columns — not the right column alone.
    block.watermark ? watermark(block.watermark) : null,
    pane,
    figure,
  );

  return h('div', { class: 'leader-hero ph-root' }, stage);
}
