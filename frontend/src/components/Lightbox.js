import { h, render } from '../utils/dom.js';
import { useShortcuts } from '../hooks/useShortcuts.js';
import { autoSlide, slideIn } from '../utils/autoSlide.js';

/** Click-to-zoom viewer with keyboard and on-screen navigation; advances on its own. */
export function openLightbox(images, startIndex = 0) {
  if (!images.length) return null;
  let index = Math.max(0, Math.min(startIndex, images.length - 1));

  const stage = h('div', { class: 'lightbox__stage' });
  const counter = h('span', {}, '');
  const caption = h('span', { class: 'lightbox__caption' }, '');

  const overlay = h(
    'div',
    { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Image viewer' },
    h(
      'div',
      { class: 'lightbox__bar' },
      caption,
      h(
        'div',
        { class: 'row-actions' },
        counter,
        h('button', { class: 'icon-btn', title: 'Close (Esc)', onclick: () => close() }, '✕'),
      ),
    ),
    stage,
    h(
      'div',
      { class: 'lightbox__nav' },
      h('button', { class: 'icon-btn', title: 'Previous (←)', onclick: () => manual(-1) }, '‹'),
      h('button', { class: 'icon-btn', title: 'Next (→)', onclick: () => manual(1) }, '›'),
    ),
  );

  function paint(dir = 0) {
    const image = images[index];
    const img = h('img', { src: image.url, alt: image.name || 'Gallery image' });
    render(stage, img);
    if (dir) slideIn(img, dir);
    counter.textContent = `${index + 1} / ${images.length}`;
    caption.textContent = image.name || '';
  }

  function step(delta) {
    if (images.length < 2) return;
    index = (index + delta + images.length) % images.length;
    paint(delta);
  }

  const auto = autoSlide(() => step(1), { host: overlay });
  /** A press restarts the hold, so the chosen picture is not cut short. */
  function manual(delta) {
    step(delta);
    auto.reset();
  }

  const disposeKeys = useShortcuts({
    Escape: () => close(),
    ArrowRight: () => manual(1),
    ArrowLeft: () => manual(-1),
    Space: () => manual(1),
  });

  function close() {
    auto.stop();
    disposeKeys();
    overlay.remove();
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target === stage) close();
  });

  paint();
  document.body.append(overlay);
  if (images.length > 1) auto.start();
  return { close };
}
