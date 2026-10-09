/** Registers keyboard shortcuts and returns a disposer. */
export function useShortcuts(map, { target = window } = {}) {
  const handler = (event) => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) {
      if (event.key !== 'Escape') return;
    }
    const key = event.key === ' ' ? 'Space' : event.key;
    const fn = map[key];
    if (!fn) return;
    event.preventDefault();
    fn(event);
  };
  // A focused button activates on Space's keyup — swallow that too, or pausing the deck
  // would also press whatever was last clicked.
  const swallow = (event) => {
    if (event.key !== ' ' || !map.Space) return;
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
    event.preventDefault();
  };
  target.addEventListener('keydown', handler);
  target.addEventListener('keyup', swallow);
  return () => { target.removeEventListener('keydown', handler); target.removeEventListener('keyup', swallow); };
}
