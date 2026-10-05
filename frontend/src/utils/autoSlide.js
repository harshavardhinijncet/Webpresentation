import { h } from './dom.js';
import { icon } from './icons.js';

/**
 * Photographs advance on their own.
 *
 * Every viewer in the deck that shows one picture at a time used to sit on that
 * picture until somebody pressed an arrow. In front of a room that is a presenter
 * reaching for the mouse between every photograph. Now each one holds for a few
 * seconds and the next slides in; the arrows still work, and pressing one starts
 * the hold again from that picture rather than cutting it short.
 *
 * Films are deliberately not driven by this — skipping a video three seconds in
 * would be the opposite of what anyone wants.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/** How long one photograph holds before the next arrives. */
export const AUTO_SLIDE_MS = 3000;

/**
 * A timer that calls `advance()` every `interval` while it runs.
 *
 * `host` is the element the pictures live in. The timer stops itself the first
 * time it finds that element gone from the document or hidden, so a viewer that
 * is closed — or a slide that is replaced — can never leave a timer stepping
 * through pictures nobody can see. A hidden tab holds still rather than racing
 * ahead.
 *
 * `canRun()` is asked on every tick; returning false skips that tick without
 * stopping, for states such as "the deck is folded" that come and go.
 */
export function autoSlide(advance, { host, interval = AUTO_SLIDE_MS, canRun = () => true } = {}) {
  let timer = null;
  let on = false;

  const live = () => !host || (host.isConnected && !host.hidden);

  function arm() {
    clearTimeout(timer);
    timer = null;
    if (!on) return;
    timer = setTimeout(() => {
      if (!on) return;
      if (!live()) { stop(); return; }
      if (!document.hidden && canRun()) advance();
      arm();
    }, interval);
  }

  function start() { on = true; arm(); }
  function stop() { on = false; clearTimeout(timer); timer = null; }
  /** After a manual step: the picture just chosen gets its full hold. */
  function reset() { if (on) arm(); }

  return { start, stop, reset };
}

/**
 * Replay the slide-in on `el`, from the right for forward and the left for back.
 *
 * Only `backwards` fill, never `both`: a finished animation that kept its end
 * state would pin `transform` and override anything set inline afterwards — the
 * placement viewer flies its picture back into the tile with an inline transform
 * when it closes.
 */
export function slideIn(el, dir = 1) {
  if (!el) return;
  el.classList.remove('as-in--next', 'as-in--prev');
  if (REDUCED?.matches) return;
  void el.offsetWidth; // restart the animation even when the class is the same
  el.classList.add(dir < 0 ? 'as-in--prev' : 'as-in--next');
}

/** The round arrow pair for a viewer that did not have one. */
export function slideArrows(step, { label = 'photo' } = {}) {
  const prev = h('button', {
    class: 'as-nav as-nav--prev', type: 'button', 'aria-label': `Previous ${label}`,
    onclick: (e) => { e.stopPropagation(); step(-1); },
  }, icon('chevron-left', { class: 'ic' }));
  const next = h('button', {
    class: 'as-nav as-nav--next', type: 'button', 'aria-label': `Next ${label}`,
    onclick: (e) => { e.stopPropagation(); step(1); },
  }, icon('chevron-right', { class: 'ic' }));
  return { prev, next };
}
