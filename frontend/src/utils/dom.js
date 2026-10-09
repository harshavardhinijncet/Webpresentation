/** Minimal element builder — the whole component layer is written against it. */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') applyStyle(el, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }

  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * SVG twin of `h`. Vector nodes must be created in the SVG namespace —
 * `document.createElement('svg')` yields an unknown HTML element that never
 * paints, so every icon in the app is built through this.
 */
export function svg(tag, props = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') applyStyle(el, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }

  append(el, children);
  return el;
}

/** Custom properties need setProperty — plain assignment silently does nothing. */
export function applyStyle(el, style) {
  for (const [key, value] of Object.entries(style || {})) {
    if (value === null || value === undefined) continue;
    if (key.startsWith('--')) el.style.setProperty(key, String(value));
    else el.style[key] = value;
  }
  return el;
}

export function append(parent, children) {
  for (const child of children.flat(4)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function render(container, ...children) {
  clear(container);
  append(container, children);
  return container;
}

/**
 * Attaches HTML5 drag-and-drop reordering to a list of elements.
 *
 * When `handle` is given, the element only becomes draggable while the pointer
 * is on that handle — otherwise a draggable wrapper swallows text selection in
 * the inputs it contains.
 */
export function enableDragSort(
  items,
  onReorder,
  { dragClass = 'is-dragging', overClass = 'is-dropzone', handle = null } = {},
) {
  let fromIndex = null;

  items.forEach((el, index) => {
    if (handle) {
      el.draggable = false;
      const grip = el.querySelector(handle);
      if (grip) {
        grip.addEventListener('mousedown', () => {
          el.draggable = true;
        });
        grip.addEventListener('touchstart', () => {
          el.draggable = true;
        }, { passive: true });
      }
      el.addEventListener('mouseup', () => {
        el.draggable = false;
      });
    } else {
      el.draggable = true;
    }

    el.addEventListener('dragstart', (event) => {
      fromIndex = index;
      el.classList.add(dragClass);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    });
    el.addEventListener('dragend', () => {
      fromIndex = null;
      el.classList.remove(dragClass);
      if (handle) el.draggable = false;
      items.forEach((other) => other.classList.remove(overClass));
    });
    el.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (fromIndex !== null && fromIndex !== index) el.classList.add(overClass);
    });
    el.addEventListener('dragleave', () => el.classList.remove(overClass));
    el.addEventListener('drop', (event) => {
      event.preventDefault();
      el.classList.remove(overClass);
      const from = fromIndex ?? Number(event.dataTransfer.getData('text/plain'));
      if (Number.isNaN(from) || from === index) return;
      onReorder(from, index);
    });
  });
}

export function moveItem(list, from, to) {
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/**
 * Wheel and trackpad scroll a gallery that lives inside the scaled slide.
 *
 * Moves `scrollTop` directly, in pixels (line and page deltas converted), and only claims the
 * gesture while the gallery can still move that way — at either end it is left alone. The
 * gallery must not use CSS smooth scrolling: an in-flight smooth scroll swallowed the next
 * wheel step, which is how scrolling stalled. Pausing the deck has no effect on any of this.
 */
export function wheelScroll(el) {
  el.addEventListener('wheel', (e) => {
    if (el.scrollHeight <= el.clientHeight + 1 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientHeight : 1;
    const dy = e.deltaY * unit;
    const up = el.scrollTop > 0;
    const down = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    if ((dy > 0 && !down) || (dy < 0 && !up)) return;
    e.preventDefault();
    e.stopPropagation();
    el.scrollTop += dy;
  }, { passive: false });
  return el;
}

/**
 * A "more below" strip for a list that does not fit: no scrollbar, but a coloured band along the
 * foot of `el` with a bouncing arrow. Pressing it brings the next page of the list up; at the end
 * the arrow turns to bring the list back to the top. It shows only while something is hidden.
 * `host` is the positioned box the strip is laid over (defaults to `el`'s parent).
 */
export function moreStrip(el, { host = el.parentElement, label = 'More' } = {}) {
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('viewBox', '0 0 24 24');
  arrow.setAttribute('class', 'more-strip__ic');
  arrow.innerHTML = '<path d="M6 9.5 12 15.5 18 9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  const strip = h('button', { class: 'more-strip', type: 'button', 'aria-label': label, hidden: true }, arrow);
  host.append(strip);
  const atEnd = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
  const update = () => {
    const over = el.scrollHeight > el.clientHeight + 2;
    strip.hidden = !over;
    strip.classList.toggle('is-up', over && atEnd());
  };
  strip.addEventListener('click', (e) => {
    e.stopPropagation();
    if (atEnd()) el.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollBy({ top: Math.max(80, el.clientHeight - 60), behavior: 'smooth' });
  });
  el.addEventListener('scroll', update, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(el);
  if (typeof MutationObserver === 'function') new MutationObserver(() => requestAnimationFrame(update)).observe(el, { childList: true, subtree: true });
  requestAnimationFrame(update);
  return strip;
}
