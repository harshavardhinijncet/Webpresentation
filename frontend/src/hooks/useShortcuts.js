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
  target.addEventListener('keydown', handler);
  return () => target.removeEventListener('keydown', handler);
}
