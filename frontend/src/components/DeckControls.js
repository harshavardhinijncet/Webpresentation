import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { sectionLabel } from './SideNav.js';

/**
 * The presenter's bar: where you are, what is either side of you, and a way to
 * reach any slide without walking there.
 *
 * Three parts, left to right. The previous and next buttons carry the name of
 * the section they lead to, because "‹" alone asks the presenter to remember the
 * running order of sixteen sections while a room watches. The middle is one dot
 * per slide, hover-labelled, so any section is one click away rather than nine
 * presses. The count and exit stay on the right where they were.
 *
 * The hover label is a card that springs up over the bar. It is deliberately
 * `position: absolute` inside the bar rather than fixed: the bar is already the
 * top layer of the presenting view, and a fixed child would be measured against
 * the viewport and drift when the bar is centred by transform.
 */
export function DeckControls({ index, total, deck = [], onPrev, onNext, onExit, onJump }) {
  const progress = h('div', {
    class: 'deck-progress',
    style: { width: `${total ? ((index + 1) / total) * 100 : 0}%` },
  });

  const at = Math.max(0, index);
  /* Wrapping, to match `go()` in PresentPage — the deck is a loop, so the last
     slide's "next" is the first and the label has to say so. */
  const prevSection = deck.length ? deck[(at - 1 + deck.length) % deck.length] : null;
  const nextSection = deck.length ? deck[(at + 1) % deck.length] : null;

  /** Truncated in CSS, but a hard cap keeps a long title from setting the width. */
  const shortName = (section) => {
    const { label } = sectionLabel(section);
    return label.length > 22 ? `${label.slice(0, 21)}…` : label;
  };

  const hint = h('span', { class: 'deck-hint', hidden: true });

  const dots = h('div', { class: 'deck-dots', role: 'tablist', 'aria-label': 'Jump to a section' });
  deck.forEach((section, i) => {
    const { label, icon: iconKey } = sectionLabel(section);
    const dot = h('button', {
      class: `deck-dot${i === at ? ' is-on' : ''}`,
      type: 'button',
      role: 'tab',
      'aria-selected': i === at ? 'true' : 'false',
      'aria-label': `${i + 1}. ${label}`,
      onclick: () => onJump?.(section),
      onmouseenter: () => showHint(dot, `${i + 1}. ${label}`),
      onfocus: () => showHint(dot, `${i + 1}. ${label}`),
      onmouseleave: hideHint,
      onblur: hideHint,
    }, icon(iconKey, { class: 'ic ic--xs' }));
    dots.appendChild(dot);
  });

  function showHint(dot, text) {
    hint.textContent = text;
    hint.hidden = false;
    /* Measured after it has text, or the first hover of the session centres the
       card on the width it had while empty. */
    requestAnimationFrame(() => {
      const bar = hint.parentElement;
      if (!bar) return;
      const left = dot.offsetLeft + dot.offsetWidth / 2 - hint.offsetWidth / 2;
      const max = bar.clientWidth - hint.offsetWidth - 8;
      hint.style.left = `${Math.max(8, Math.min(left, max))}px`;
      hint.classList.add('is-on');
    });
  }
  function hideHint() {
    hint.classList.remove('is-on');
    // Kept in the tree until the fade finishes, or it vanishes without one.
    setTimeout(() => { if (!hint.classList.contains('is-on')) hint.hidden = true; }, 180);
  }

  const step = (dir, section, handler) => h('button', {
    class: `deck-step deck-step--${dir}`,
    type: 'button',
    title: dir === 'prev' ? 'Previous (←)' : 'Next (→ or Space)',
    onclick: handler,
  },
    dir === 'prev' ? icon('chevron-left', { class: 'ic ic--xs' }) : null,
    section
      ? h('span', { class: 'deck-step__text' },
          h('em', {}, dir === 'prev' ? 'Previous' : 'Next'),
          h('span', {}, shortName(section)))
      : null,
    dir === 'next' ? icon('chevron-right', { class: 'ic ic--xs' }) : null,
  );

  const bar = h(
    'div',
    { class: 'deck-bar' },
    hint,
    step('prev', prevSection, onPrev),
    dots,
    step('next', nextSection, onNext),
    h('span', { class: 'deck-bar__count' }, `${at + 1} / ${total}`),
    h('button', { class: 'btn btn--sm btn--on-dark', title: 'Exit (Esc)', onclick: onExit }, 'Exit'),
  );

  return [progress, bar];
}
