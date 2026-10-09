/**
 * Lets a block hold the deck still while it advances something of its own.
 *
 * A deck is paged, but not every slide is one beat. A timeline the presenter
 * walks year by year wants the same key that turns the page — so the block
 * registers a stepper, and Prev/Next offers each step to it before moving on.
 * The block returns true when it consumed the press and false when it has run
 * out, at which point the deck turns as it always did. The presenter never
 * learns a second control.
 *
 * Registration is per render: PresentPage rebuilds its DOM on every navigation,
 * so it clears the registry before building the next slide and whatever is on
 * that slide re-registers as it is constructed. Nothing outlives its own DOM.
 */
const steppers = new Set();
/* Steppers whose steps the deck also takes on its own while it plays: `auto` is the hold in ms
   (or a function giving it, so a fuller view can hold longer), `next` the step to take — by
   default the stepper going forward, which stops at the end; a short toggle passes a `next`
   that wraps round. */
const autoMs = new Map();
const autoNext = new Map();

/** Called by a block as it is built. Returns a disposer for symmetry. */
export function registerStepper(fn, { auto = 0, next = null } = {}) {
  if (typeof fn !== 'function') return () => {};
  steppers.add(fn);
  if (auto) autoMs.set(fn, auto);
  if (auto && next) autoNext.set(fn, next);
  return () => { steppers.delete(fn); autoMs.delete(fn); autoNext.delete(fn); };
}

/** The hold the slide's self-advancing steppers ask for now, as a function; null for none. */
export function autoStepMs() {
  if (!autoMs.size) return null;
  return () => {
    let ms = 0;
    autoMs.forEach((v) => { ms = Math.max(ms, Number(typeof v === 'function' ? v() : v) || 0); });
    return ms;
  };
}

/** One automatic step forward for the steppers that asked for it. True when one moved. */
export function autoStep() {
  for (const [fn] of autoMs) {
    try { if ((autoNext.get(fn) || (() => fn(1)))() === true) return true; } catch { /* declined */ }
  }
  return false;
}

/** Called by the page before it builds a new slide. */
export function clearSteppers() {
  steppers.clear();
  autoMs.clear();
  autoNext.clear();
}

/**
 * Offers the step to the current slide. True means a block took it and the deck
 * must not move.
 *
 * A stepper that throws is treated as declining rather than allowed to break
 * navigation — being unable to page a deck in front of a room is the worst
 * failure this file could have.
 */
export function stepSlide(delta) {
  for (const stepper of steppers) {
    try {
      if (stepper(delta) === true) return true;
    } catch {
      /* declined */
    }
  }
  return false;
}
