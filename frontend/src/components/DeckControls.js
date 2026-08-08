import { h } from '../utils/dom.js';

/**
 * Floating next/previous controls plus a progress bar, shown while the deck is
 * in fullscreen presentation mode.
 */
export function DeckControls({ index, total, onPrev, onNext, onExit }) {
  const progress = h('div', {
    class: 'deck-progress',
    style: { width: `${total ? ((index + 1) / total) * 100 : 0}%` },
  });

  const bar = h(
    'div',
    { class: 'deck-bar' },
    h('button', { class: 'icon-btn', title: 'Previous (←)', onclick: onPrev }, '‹'),
    h('span', { class: 'deck-bar__count' }, `${index + 1} / ${total}`),
    h('button', { class: 'icon-btn', title: 'Next (→ or Space)', onclick: onNext }, '›'),
    h('button', { class: 'btn btn--sm btn--on-dark', title: 'Exit (Esc)', onclick: onExit }, 'Exit'),
  );

  return [progress, bar];
}
