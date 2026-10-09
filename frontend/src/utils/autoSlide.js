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
export const AUTO_SLIDE_MS = 5000;

/* One even pace across the deck: photographs hold for five seconds; a tab or page may ask for
   longer when it carries more to read — a wall of posters with a filter up to twenty. Nothing
   is quicker than five. */
const MIN_MS = 5000;
const MAX_MS = 20000;

/* ------------------------------------------------------------------ the pause
   Space pauses the whole deck. Every auto-slide holds where it is, and the looping motion
   on the slide (drifting walls, turning rings, flowing lines) freezes with it; Space again
   lets it all run on. While paused, Next steps through what is on the slide instead of
   turning it — see PresentPage. */
let paused = false;
const listeners = new Set();
const sliders = new Set();

export const isDeckPaused = () => paused;

/** A presenter has just used something on the slide: every timer starts its hold again. */
export function resetAutoSlides() { sliders.forEach((s) => s.reset()); }
export function onDeckPause(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Looping animations only: an entrance caught mid-way would freeze half-faded. */
function loops() {
  return (document.getAnimations?.() || []).filter((a) => {
    const t = a.effect?.getTiming?.();
    return t && t.iterations === Infinity && !a.effect?.target?.closest?.('.deck-bar, .deck-paused');
  });
}

let settleTimer = null;
export function setDeckPaused(on) {
  const was = paused;
  paused = Boolean(on);
  document.body.classList.toggle('is-deck-paused', paused);
  // The notice shows in full for a moment, then settles into a small badge in the corner.
  if (paused !== was) {
    clearTimeout(settleTimer);
    document.body.classList.remove('is-deck-settled');
    if (paused) settleTimer = setTimeout(() => { if (paused) document.body.classList.add('is-deck-settled'); }, 2600);
  }
  loops().forEach((a) => { try { if (paused) a.pause(); else a.play(); } catch { /* finished */ } });
  if (!paused) sliders.forEach((s) => s.reset());
  listeners.forEach((fn) => { try { fn(paused); } catch { /* ignore */ } });
}

/**
 * While paused, Next moves the pictures on by hand: every auto-slide that is on screen and
 * would have run takes one step. Returns true when anything moved.
 */
export function stepVisibleSlides() {
  let moved = false;
  sliders.forEach((s) => {
    if (s.manual && s.live() && !document.hidden && s.canRun()) { s.advance(); s.reset(); moved = true; }
  });
  return moved;
}

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
export function autoSlide(advance, { host, interval = AUTO_SLIDE_MS, canRun = () => true, manual = true } = {}) {
  let timer = null;
  let on = false;
  /* `interval` may be a function, asked afresh for every hold, so a tab carrying more content
     can hold longer than a light one. */
  const wait = () => Math.min(MAX_MS, Math.max(MIN_MS, Number(typeof interval === 'function' ? interval() : interval) || AUTO_SLIDE_MS));

  const live = () => !host || (host.isConnected && !host.hidden);
  const self = { advance, canRun, live, manual, reset: () => reset() };

  function arm() {
    clearTimeout(timer);
    timer = null;
    if (!on) return;
    timer = setTimeout(() => {
      if (!on) return;
      if (!live()) { stop(); return; }
      if (!document.hidden && !paused && canRun()) advance();
      arm();
    }, wait());
  }

  function start() { on = true; sliders.add(self); arm(); }
  function stop() { on = false; sliders.delete(self); clearTimeout(timer); timer = null; }
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
