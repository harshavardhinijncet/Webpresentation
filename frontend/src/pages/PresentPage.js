import { h, render, append } from '../utils/dom.js';
import { state, isAdmin, visibleSections, deckSections, setSections } from '../context/appStore.js';
import { SideNav } from '../components/SideNav.js';
import { TopBar } from '../components/TopBar.js';
import { icon } from '../utils/icons.js';
import { SlideView } from '../components/SlideView.js';
import { FitSlide } from '../components/FitSlide.js';
import { DeckControls } from '../components/DeckControls.js';
import { navigate, refresh } from '../utils/router.js';
import { useShortcuts } from '../hooks/useShortcuts.js';
import { reorderSections } from '../services/contentService.js';
import { toastError, toastSuccess } from '../components/Toast.js';
import { clearSteppers, stepSlide, autoStep, autoStepMs } from '../utils/slideSteps.js';
import { autoSlide, isDeckPaused, setDeckPaused, stepVisibleSlides } from '../utils/autoSlide.js';

let disposeShortcuts = null;
/** The timer that walks a slide's own tabs or pages while the deck plays. */
let sectionAuto = null;
/** True only while the whole deck is fullscreen — a video going fullscreen
 *  must not be mistaken for it, or exiting the video would re-render the page
 *  and lose the presenter's place. */
let deckFullscreen = false;

/**
 * The presentation view — the whole portal, in practice. Content is authored in
 * code, so this only navigates and presents; the draft/hidden badges are the one
 * thing an admin sees that a presenter does not.
 */
export function PresentPage(container, { org, section, onLogout }) {
  disposeShortcuts?.();

  const deck = state.presenting ? deckSections() : visibleSections();
  const index = deck.findIndex((item) => item.id === section?.id);

  // Playing, everything on a slide advances on its own and Next / Prev turn the deck.
  // Paused (Space), the slide holds still and Next / Prev step through it instead — its
  // tabs or pages first, then its pictures — and the deck turns only once it is spent.
  const turn = (delta) => {
    if (!deck.length) return;
    const next = deck[(Math.max(0, index) + delta + deck.length) % deck.length];
    navigate(`/o/${org.id}/${next.id}`);
  };
  // Motion that starts while paused (a new tab's drifting wall) is frozen as it begins.
  const holdNewMotion = () => [80, 900].forEach((ms) => setTimeout(() => { if (isDeckPaused()) setDeckPaused(true); }, ms));
  const go = (delta) => {
    if (isDeckPaused()) {
      holdNewMotion();
      if (stepSlide(delta)) { sectionAuto?.reset(); return; }
      if (delta > 0 && stepVisibleSlides()) return;
    }
    turn(delta);
  };
  const togglePause = () => setDeckPaused(!isDeckPaused());

  // Cleared before the slide is built, so the blocks constructed below are the
  // only ones registered. Stale steppers would hold a deck that had moved on.
  clearSteppers();
  sectionAuto?.stop();
  sectionAuto = null;

  const enterPresenting = async () => {
    state.presenting = true;
    document.body.classList.add('is-presenting');
    deckFullscreen = true;
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* Fullscreen can be refused; the styled mode still applies. */
    }
    refresh();
  };

  const exitPresenting = async () => {
    state.presenting = false;
    deckFullscreen = false;
    document.body.classList.remove('is-presenting');
    if (document.fullscreenElement === document.documentElement) {
      await document.exitFullscreen?.().catch(() => {});
    }
    refresh();
  };

  disposeShortcuts = useShortcuts({
    ArrowRight: () => go(1),
    ArrowLeft: () => go(-1),
    Space: () => togglePause(),
    Escape: () => state.presenting && exitPresenting(),
    f: () => (state.presenting ? exitPresenting() : enterPresenting()),
  });

  const onReorder = async (order) => {
    try {
      setSections(await reorderSections(org.id, order));
      toastSuccess('Section order saved');
      refresh();
    } catch (err) {
      toastError(err.message);
    }
  };

  const actions = [
    h(
      'button',
      {
        class: 'btn btn--ghost btn--sm',
        'data-tip': 'Previous section',
        'aria-label': 'Previous section',
        onclick: () => go(-1),
      },
      '‹ Prev',
    ),
    h(
      'button',
      {
        class: 'btn btn--ghost btn--sm',
        'data-tip': 'Next section',
        'aria-label': 'Next section',
        onclick: () => go(1),
      },
      'Next ›',
    ),
    h(
      'button',
      {
        class: 'btn btn--dark btn--sm',
        'data-tip': 'Present fullscreen',
        'aria-label': 'Present fullscreen',
        onclick: enterPresenting,
      },
      '▶ Present',
    ),
    /* Beside Present, because that is where a presenter's hand already is when they
       have finished. The same control is in the navigation head; a presenter running
       the deck with the pane collapsed would otherwise have to open it to leave. */
    h(
      'button',
      {
        class: 'btn btn--ghost btn--sm btn--icon',
        'data-tip': 'Sign out',
        'aria-label': 'Sign out',
        onclick: onLogout,
      },
      icon('logout', { class: 'ic ic--sm' }),
    ),
  ];

  // The slide is scaled to the space available: a deck is paged, not scrolled.
  // While presenting it fills the display instead, so no screen shape leaves
  // bars down the sides.
  const stage = h(
    'div',
    { class: 'stage stage--fit' },
    FitSlide(SlideView(section, org, { showStatus: isAdmin() }), { fill: 'presenting' }),
  );

  const shell = h(
    'div',
    { class: 'shell shell--fit' },
    SideNav(org, section?.id, { onReorder, onLogout }),
    h(
      'div',
      { class: 'main' },
      TopBar({ org, section, actions }),
      stage,
    ),
  );

  render(container, shell);

  // A slide whose blocks step through tabs or pages of their own is walked through on a
  // timer while the deck plays, at the pace the block asked for; it stops at the last step
  // rather than turning the deck, which stays the presenter's call.
  requestAnimationFrame(() => {
    const ms = autoStepMs();
    if (!ms) return;
    sectionAuto = autoSlide(() => { if (!autoStep()) sectionAuto?.stop(); }, { host: stage, interval: ms, manual: false });
    sectionAuto.start();
  });

  if (isDeckPaused()) holdNewMotion();

  // Paused, a pill says so and how to resume.
  append(container, [h('div', { class: 'deck-paused', role: 'status', 'aria-live': 'polite' },
    h('span', { class: 'deck-paused__mark', 'aria-hidden': 'true' }, h('i'), h('i')),
    h('span', { class: 'deck-paused__text' },
      h('b', {}, h('span', { class: 'deck-paused__full' }, 'Presentation paused'), h('span', { class: 'deck-paused__short' }, 'Paused')),
      h('span', { class: 'deck-paused__keys' },
        h('kbd', {}, 'Space'), ' resume', h('em', { 'aria-hidden': 'true' }, '·'),
        h('kbd', {}, '←'), h('kbd', {}, '→'), ' step through this slide')))]);

  if (state.presenting) {
    append(
      container,
      DeckControls({
        index: Math.max(0, index),
        total: deck.length,
        // The running order itself, so the bar can name the neighbours and jump.
        deck,
        onPrev: () => go(-1),
        onNext: () => go(1),
        onExit: exitPresenting,
        onJump: (target) => {
          if (target?.id && target.id !== section?.id) navigate(`/o/${org.id}/${target.id}`);
        },
      }),
    );
  }

  // Leaving deck fullscreen with Esc/F11 must drop presentation mode too — but
  // a video exiting its own fullscreen must be ignored, so playback and the
  // presenter's scroll position are untouched.
  document.onfullscreenchange = () => {
    if (document.fullscreenElement) return;
    if (!deckFullscreen) return;
    deckFullscreen = false;
    if (!state.presenting) return;
    state.presenting = false;
    document.body.classList.remove('is-presenting');
    refresh();
  };
}
