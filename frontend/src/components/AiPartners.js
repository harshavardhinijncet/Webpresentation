import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * AI Partners — one page per partner, chosen by an orbit.
 *
 * The left of the slide is an editorial spread: a tag, a two-line headline, a paragraph, the
 * partner's official mark and three cards of what has actually been done with it. The bottom
 * right is a wide ring, mostly off the slide, with the partners' badges riding on it. Every few
 * seconds the ring turns one stop and the next badge rolls into the focus point; the spread
 * changes to that partner as it arrives.
 *
 * The ring carries each partner four times, thirty degrees apart, so it can turn the same way
 * for ever: the orbit angle only ever grows, and the badge in focus is always `step mod 12`.
 *
 * Partner marks are the official files from /uploads where one exists. A partner without one
 * gets its name set in type on the badge — a brand logo is never drawn by hand.
 */

const STOP = 30;          // degrees between neighbouring badges — three are on the slide at once
const COPIES = 4;         // each partner rides the ring this many times (12 × 30° = a full turn)
const FOCUS = -124;       // the focus point, in degrees clockwise from east (y down)
const ORBIT_R = 642;      // badge centres sit on this radius
const TURN_MS = 1400;     // how long one stop takes

const isNumeric = (v) => /^\s*\d[\d,]*(\.\d+)?/.test(String(v));
const src = (path) => (path ? media(`/uploads/${String(path).split('/').map(encodeURIComponent).join('/')}`) : '');

/** Counts a figure such as "900+" up from zero, keeping whatever follows the number. */
function countUp(el, value, ms = 1100) {
  const m = String(value).match(/^(\s*)(\d[\d,]*)(.*)$/);
  if (!m || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = value;
    return;
  }
  const target = Number(m[2].replace(/,/g, ''));
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const eased = 1 - (1 - k) ** 3;
    el.textContent = `${Math.round(target * eased).toLocaleString('en-IN')}${m[3]}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function AiPartners(block, { editing = false } = {}) {
  const partners = (block.partners || []).filter((p) => p && p.name);
  if (!partners.length) {
    return h('div', { class: 'ap-root ap-root--empty ph-root' }, 'No AI partners yet.');
  }
  const n = partners.length;
  const hold = Number(block.hold) || 6000;

  const root = h('div', { class: 'ap-root ph-root', style: { '--ap-hold': `${hold}ms`, '--ap-turn': `${TURN_MS}ms` } });

  /* ---------------------------------------------------------------- the top bar
     Mirrors a product site's header: the page's own name on the left, the partners as
     navigation in the middle, and the partner's standing as the pill on the right. */
  const tabs = partners.map((p, i) => h('button', {
    class: 'ap-tab', type: 'button',
    onclick: () => manual(i),
  }, p.name, h('span', { class: 'ap-tab__bar' })));
  const statusPill = h('span', { class: 'ap-status' });
  const playBtn = h('button', {
    class: 'ap-play', type: 'button',
    onclick: () => setPlaying(!playing),
  });
  const top = h('header', { class: 'ap-top' },
    h('div', { class: 'ap-brand' },
      h('span', { class: 'ap-brand__mark' }, icon('sparkles', { class: 'ic ic--sm' })),
      h('span', {}, block.title || 'AI Partners'),
    ),
    h('nav', { class: 'ap-tabs', 'aria-label': 'AI partners' }, ...tabs),
    h('div', { class: 'ap-top__end' }, statusPill, playBtn),
  );

  /* ----------------------------------------------------------------- the spread */
  const spread = h('div', { class: 'ap-spread', 'aria-live': 'polite' });

  /* ------------------------------------------------------------------- the orbit */
  const badges = [];
  const orbit = h('div', { class: 'ap-orbit' });
  for (let k = 0; k < n * COPIES; k += 1) {
    const p = partners[k % n];
    const angle = FOCUS + k * STOP;
    const badge = h('button', {
      class: 'ap-badge', type: 'button',
      'aria-label': p.name,
      tabindex: '-1',
      style: { '--a': `${angle}deg`, '--r': `${ORBIT_R}px` },
      onclick: () => manual(k % n),
    },
      h('span', { class: 'ap-badge__trail', 'aria-hidden': 'true' }),
      h('span', { class: 'ap-badge__face' },
        p.mark
          ? h('img', { src: src(p.mark), alt: '', draggable: 'false' })
          : h('b', { class: 'ap-badge__type' }, p.name)),
    );
    badges.push({ el: badge, partner: k % n, angle });
    orbit.appendChild(badge);
  }
  const ring = h('div', { class: 'ap-ring', 'aria-hidden': 'true' },
    h('span', { class: 'ap-ring__band' }),
    h('span', { class: 'ap-ring__track ap-ring__track--outer' }),
    h('span', { class: 'ap-ring__track ap-ring__track--inner' }),
    h('span', { class: 'ap-ring__focus' }),
  );
  const stats = h('div', { class: 'ap-stats' });

  /* A framed photograph of the work, top right, for a partner that has them. It runs its own
     quicker cycle inside the partner's hold and starts again from the first when the ring turns. */
  const mediaCard = h('figure', { class: 'ap-media', hidden: true });
  let mediaTimer = null;
  const paintMedia = (p) => {
    clearInterval(mediaTimer);
    const photos = (p.photos || []).filter((x) => x.src);
    mediaCard.hidden = !photos.length;
    if (!photos.length) { mediaCard.replaceChildren(); return; }
    const frames = photos.map((ph) => h('span', { class: 'ap-media__frame' },
      h('img', { src: src(ph.src), alt: ph.caption || '', decoding: 'async', draggable: 'false' })));
    const cap = h('figcaption', { class: 'ap-media__cap' });
    const dots = photos.map(() => h('i'));
    mediaCard.replaceChildren(...frames, cap, h('span', { class: 'ap-media__dots' }, ...dots));
    let i = -1;
    const next = () => {
      const prev = i;
      i = (i + 1) % photos.length;
      frames.forEach((f, n) => {
        f.classList.toggle('is-leaving', n === prev && n !== i);
        f.classList.remove('is-active');
      });
      void frames[i].offsetWidth;
      frames[i].classList.add('is-active');
      dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
      cap.textContent = photos[i].caption || '';
      cap.classList.remove('is-in'); void cap.offsetWidth; cap.classList.add('is-in');
    };
    next();
    if (photos.length > 1) {
      const every = Math.max(1800, Math.floor(hold / photos.length));
      mediaTimer = setInterval(() => {
        if (!root.isConnected) { clearInterval(mediaTimer); return; }
        if (playing && !document.hidden) next();
      }, every);
    }
  };

  root.append(
    h('div', { class: 'ap-grid', 'aria-hidden': 'true' }),
    ring, mediaCard, orbit, stats, top, spread,
  );

  /* ---------------------------------------------------------------- behaviour */
  let step = 0;          // stops turned so far; only ever grows going forward
  let active = 0;
  let playing = !editing;
  let movingTimer = null;

  const placeOrbit = () => {
    const turn = -step * STOP;
    orbit.style.setProperty('--orbit', `${turn}deg`);
    badges.forEach((b) => {
      const at = ((b.angle + turn) % 360 + 360) % 360;
      const focus = (((FOCUS % 360) + 360) % 360);
      b.el.classList.toggle('is-focus', Math.abs(at - focus) < 1);
      /* The trail points back along the way the badge came: the ring turns anticlockwise,
         so behind a badge is clockwise of it. */
      b.el.style.setProperty('--trail', `${b.angle + turn + 90}deg`);
    });
    root.classList.add('is-moving');
    clearTimeout(movingTimer);
    movingTimer = setTimeout(() => root.classList.remove('is-moving'), TURN_MS);
  };

  /* Each card tips up into place in turn; a rule draws across its top, its tags pop in one
     by one, and a single sweep of light crosses it once it has landed. */
  const card = (c, i) => h('article', { class: 'ap-card', style: { '--d': `${0.42 + i * 0.12}s` } },
    h('span', { class: 'ap-card__bar', 'aria-hidden': 'true' }),
    h('span', { class: 'ap-card__num', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
    h('h4', { class: 'ap-card__title' }, c.title),
    c.body ? h('p', { class: 'ap-card__body' }, c.body) : null,
    c.tags?.length
      ? h('div', { class: 'ap-card__tags' }, ...c.tags.map((t, k) => h('span', { style: { '--t': String(k) } }, t)))
      : null,
    h('span', { class: 'ap-card__shine', 'aria-hidden': 'true' }),
    h('span', { class: 'ap-card__glare', 'aria-hidden': 'true' }),
  );

  /**
   * Depth card: the card tilts towards the pointer and its layers part — the title, the copy,
   * the tags and the numeral each shift by a different amount, so it reads as built in depth.
   * Done in plain CSS custom properties (--mx / --my, the pointer's offset from the centre,
   * -0.5…0.5) rather than a library: the deck has no React and no network when presenting.
   * A bounding rect is fine here even inside FitSlide's transform — only the ratio is used.
   */
  const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const depth = (el) => {
    if (REDUCED?.matches) return el;
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', x.toFixed(3));
        el.style.setProperty('--my', y.toFixed(3));
        el.classList.add('is-tilting');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.classList.remove('is-tilting');
      el.style.setProperty('--mx', '0');
      el.style.setProperty('--my', '0');
    });
    return el;
  };

  function paint() {
    const p = partners[active];
    tabs.forEach((t, i) => t.classList.toggle('is-active', i === active));
    statusPill.textContent = p.status || p.name;
    paintMedia(p);

    const [lead, second] = p.headline?.length ? p.headline : [p.name, ''];
    spread.replaceChildren(
      p.tag ? h('span', { class: 'ap-tag', style: { '--d': '0s' } }, p.tag) : null,
      h('h2', { class: 'ap-headline' },
        h('span', { class: 'ap-headline__lead', style: { '--d': '0.06s' } }, lead),
        second ? h('span', { class: 'ap-headline__second', style: { '--d': '0.14s' } }, second) : null,
      ),
      p.body ? h('p', { class: 'ap-body', style: { '--d': '0.22s' } }, p.body) : null,
      h('div', { class: 'ap-official', style: { '--d': '0.3s' } },
        h('span', { class: 'ap-official__label' }, 'Official partner'),
        p.wordmark
          ? h('img', { class: 'ap-official__mark', src: src(p.wordmark), alt: p.status || p.name })
          /* No lockup: the partner's own mark beside its name in type. */
          : h('span', { class: 'ap-official__type' },
              p.mark ? h('img', { class: 'ap-official__glyph', src: src(p.mark), alt: '' }) : null,
              p.name),
      ),
      p.cards?.length
        ? h('div', { class: 'ap-work' },
            h('span', { class: 'ap-work__label', style: { '--d': '0.36s' } }, `Our work with ${p.name}`),
            h('div', { class: 'ap-cards' }, ...p.cards.map((c, i) => depth(card(c, i)))))
        : null,
    );

    stats.replaceChildren(...(p.stats || []).map((s, i) => {
      const value = h('strong', { class: `ap-stat__value${isNumeric(s.value) ? '' : ' ap-stat__value--word'}` }, s.value);
      if (isNumeric(s.value)) countUp(value, s.value);
      return h('div', { class: 'ap-stat', style: { '--d': `${0.5 + i * 0.1}s` } },
        value, h('span', { class: 'ap-stat__label' }, s.label));
    }));

    // Restart the arrival motion on the new content and the hold bar on the new tab.
    root.classList.remove('is-in');
    void root.offsetWidth;
    root.classList.add('is-in');
  }

  /** Turn the ring `d` stops; positive is forward. */
  function turn(d) {
    if (!d) return;
    step += d;
    active = ((step % n) + n) % n;
    placeOrbit();
    paint();
  }

  const auto = autoSlide(() => turn(1), { host: root, interval: hold });

  /** A chosen partner gets its full hold. Forward the short way round. */
  function manual(i) {
    const target = ((i % n) + n) % n;
    const fwd = (target - active + n) % n;
    if (fwd) turn(fwd);
    auto.reset();
  }

  function setPlaying(on) {
    playing = on;
    playBtn.replaceChildren(icon(on ? 'pause' : 'play', { class: 'ic ic--xs' }));
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    root.classList.toggle('is-paused', !on);
    if (on) auto.start();
    else auto.stop();
    // The hold bar restarts with the state.
    root.classList.remove('is-in');
    void root.offsetWidth;
    root.classList.add('is-in');
  }

  if (!editing) {
    /* Prev / Next walk the partners before the deck turns the slide. */
    registerStepper((delta) => {
      if (delta > 0) {
        if (active >= n - 1) return false;
        turn(1);
      } else {
        if (active <= 0) return false;
        turn(-1);
      }
      auto.reset();
      return true;
    });
  }

  placeOrbit();
  root.classList.remove('is-moving');
  paint();
  setPlaying(playing);
  return root;
}
