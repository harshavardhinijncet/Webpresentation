import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * A partnership page in two tabs that slide into each other.
 *
 *   Partnership — a product-landing hero told as a run of stories: kicker, title and copy
 *                 on the left, the photograph in a tall arch with the story's word set huge
 *                 in outline behind it, a glass card of figures, a side rail, and Prev, dots
 *                 and Next along the foot.
 *   AI Lab      — the lab edge to edge: each photograph wipes in from the right and keeps
 *                 drifting slowly while it holds, a dark plate names the space on screen, and
 *                 a filmstrip along the foot slides to keep the current picture centred.
 *
 * Both run on their own and both answer to arrows; the deck's Prev / Next moves between the
 * tabs before it turns the slide.
 */

const src = (path) => (path ? media(`/uploads/${String(path).split('/').map(encodeURIComponent).join('/')}`) : '');
const pad = (n) => String(n).padStart(2, '0');
/** The small copy where one exists — used wherever a picture is shown small. */
const small = (p) => src(p.thumb || p.src);

/** A self-running slideshow over `slides`, wiping each new picture in from the side it came from. */
function slideshow(slides, { hold, canRun, onChange, className }) {
  const frames = slides.map((s, i) => h('figure', { class: `${className}__slide`, 'data-i': String(i) },
    h('img', { src: src(s.src), alt: s.title || s.caption || '', loading: i < 2 ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' }),
  ));
  const stage = h('div', { class: `${className}__stage` }, ...frames);
  let at = 0;

  const show = (i, dir = 1) => {
    const next = ((i % slides.length) + slides.length) % slides.length;
    frames.forEach((f, n) => {
      f.classList.remove('is-active', 'is-leaving', 'from-left');
      if (n === at && n !== next) f.classList.add('is-leaving');
    });
    const f = frames[next];
    if (dir < 0) f.classList.add('from-left');
    void f.offsetWidth; // replay the wipe even when stepping back onto the same frame
    f.classList.add('is-active');
    at = next;
    onChange?.(at, dir);
  };

  const auto = autoSlide(() => show(at + 1, 1), { host: stage, interval: hold, canRun });
  const step = (d) => { show(at + d, d); auto.reset(); };
  /* Choosing the frame already on screen repaints its caption instead of replaying it. */
  const go = (i) => { if (i !== at) show(i, i > at ? 1 : -1); else onChange?.(at, 0); auto.reset(); };

  frames[0].classList.add('is-active');
  return { stage, step, go, start: () => auto.start(), stop: () => auto.stop(), reset: () => auto.reset(), get at() { return at; } };
}

export function Partnership(block, { editing = false } = {}) {
  const ov = block.overview || {};
  const lab = block.lab || {};
  const left = block.lockup?.left || {};
  const right = block.lockup?.right || {};
  const ms = block.milestone || {};
  const hold = Number(block.hold) || 3500;

  const root = h('div', { class: 'tp-root ph-root', style: { '--tp-hold': `${hold}ms` } });
  let tab = 0;

  /* ---------------------------------------------------------------- top bar */
  const tabNames = ['Partnership', lab.slides?.length ? (lab.tabLabel || 'AI Lab') : null].filter(Boolean);
  const tabs = tabNames.map((name, i) => h('button', {
    class: 'tp-tab', type: 'button', onclick: () => setTab(i),
  }, icon(i === 0 ? 'handshake-check' : 'sparkles', { class: 'ic ic--xs' }), name));

  const mark = (side, cls) => (side.logo
    ? h('span', { class: `tp-mark ${cls}${side.dark ? ' tp-mark--dark' : ''}` },
        h('img', { src: src(side.logo), alt: side.name || '' }))
    : h('span', { class: `tp-mark tp-mark--type ${cls}` }, side.name || ''));

  const pauseBtn = h('button', { class: 'tp-pause', type: 'button', onclick: () => setPaused(!paused) });
  const top = h('header', { class: 'tp-top' },
    h('div', { class: 'tp-lockup' }, mark(left, 'tp-mark--left'), h('span', { class: 'tp-x' }, '×'), mark(right, 'tp-mark--right')),
    h('nav', { class: 'tp-tabs' }, ...tabs),
    h('div', { class: 'tp-top__end' },
      pauseBtn,
      ms.badge ? h('div', { class: 'tp-badge-pill' }, h('img', { src: src(ms.badge), alt: ms.text || 'Partner badge' })) : null),
  );

  /* ------------------------------------------------------------ partnership
     A product-landing hero, told as a run of stories. On the left a tracked kicker, a large
     title, a line of copy and a call to action; in the middle the story's photograph in a tall
     arch, with the story's word set huge in outline behind it; at the foot of the arch a glass
     card of up to three figures. A rail down the right edge carries the section's name on its
     side; Prev, the dots and Next run along the foot. The stories turn on their own. */
  /** Replays a hold bar from empty. */
  const restart = (bar) => { bar.classList.remove('is-run'); void bar.offsetWidth; bar.classList.add('is-run'); };
  const stories = (ov.slides || []).filter((s) => s.photo && s.title);
  let si = 0;
  const kicker = h('p', { class: 'tpx-kicker' });
  const heading = h('h2', { class: 'tpx-title' });
  const copy = h('p', { class: 'tpx-body' });
  const cta = h('button', { class: 'tpx-cta', type: 'button' });
  const word = h('span', { class: 'tpx-word', 'aria-hidden': 'true' });
  const cap = h('span', { class: 'tpx-photo__cap' });
  const figures = h('ul', { class: 'tpx-stats' });
  const count = h('span', { class: 'tpx-count' });
  const shots = stories.map((s, k) => h('img', {
    class: 'tpx-photo__img', src: src(s.photo), alt: s.caption || s.title || '',
    loading: k < 2 ? 'eager' : 'lazy', decoding: 'async', draggable: 'false',
  }));
  const dots = stories.map((s, k) => h('button', {
    class: 'tpx-dot', type: 'button', 'aria-label': s.title || `Story ${k + 1}`, onclick: () => goStory(k),
  }));
  const copyBox = h('div', { class: 'tpx-copy' }, kicker, heading, copy, cta);

  /** Paint story `si`: the words and figures re-enter, the photograph crossfades. */
  const paintStory = () => {
    const s = stories[si];
    if (!s) return;
    kicker.textContent = s.kicker || '';
    heading.textContent = s.title || '';
    copy.textContent = s.body || '';
    copy.hidden = !s.body;
    const label = s.cta?.label || 'Next story';
    cta.replaceChildren(h('span', {}, label), icon('arrow-right', { class: 'ic ic--xs' }));
    cta.onclick = () => { if (s.cta?.tab >= 0) setTab(s.cta.tab); else goStory(si + 1); };
    word.textContent = s.word || '';
    cap.textContent = s.caption || '';
    cap.hidden = !s.caption;
    figures.replaceChildren(...(s.stats || []).map((x) => h('li', {}, h('b', {}, x.value), h('span', {}, x.label))));
    figures.hidden = !(s.stats || []).length;
    shots.forEach((img, k) => img.classList.toggle('is-on', k === si));
    dots.forEach((d, k) => d.classList.toggle('is-on', k === si));
    count.replaceChildren(h('b', {}, pad(si + 1)), ` / ${pad(stories.length)}`);
    [copyBox, word, figures, cap].forEach((el) => { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); });
  };
  const storyAuto = autoSlide(() => { si = (si + 1) % stories.length; paintStory(); }, {
    host: root, interval: Math.max(hold, 6500), canRun: () => tab === 0 && !paused && stories.length > 1,
  });
  function goStory(k) {
    if (!stories.length) return;
    si = ((k % stories.length) + stories.length) % stories.length;
    paintStory();
    storyAuto.reset();
  }

  const railPause = h('button', { class: 'tpx-rail__btn', type: 'button', onclick: () => setPaused(!paused) });
  const overview = h('section', { class: 'tp-panel tp-panel--overview tpx' },
    h('span', { class: 'tpx-orb tpx-orb--a', 'aria-hidden': 'true' }),
    h('span', { class: 'tpx-orb tpx-orb--b', 'aria-hidden': 'true' }),
    h('span', { class: 'tpx-orb tpx-orb--c', 'aria-hidden': 'true' }),
    word,
    copyBox,
    stories.length ? h('figure', { class: 'tpx-photo' }, ...shots, cap) : null,
    figures,
    h('aside', { class: 'tpx-rail' },
      railPause,
      h('span', { class: 'tpx-rail__text' }, block.railText || 'The partnership'),
      h('button', { class: 'tpx-rail__btn tpx-rail__btn--go', type: 'button', 'aria-label': 'Next story', onclick: () => goStory(si + 1) },
        icon('plus', { class: 'ic ic--sm' }))),
    stories.length > 1
      ? h('nav', { class: 'tpx-nav' },
          h('button', { class: 'tpx-nav__btn', type: 'button', onclick: () => goStory(si - 1) }, icon('chevron-left', { class: 'ic ic--sm' }), 'Prev'),
          h('div', { class: 'tpx-nav__mid' }, h('div', { class: 'tpx-dots' }, ...dots), count),
          h('button', { class: 'tpx-nav__btn', type: 'button', onclick: () => goStory(si + 1) }, 'Next', icon('chevron-right', { class: 'ic ic--sm' })))
      : null,
  );

  /* ----------------------------------------------------------------- AI lab */
  const labSlides = (lab.slides || []).filter((s) => s.src);
  let labPanel = null;
  let labShow = null;
  let labPauseBtn = null;
  let carPauseBtn = null;
  const REDUCED_TP = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (labSlides.length) {
    /* The AI Lab plays in three movements each time its tab opens:

         1. intro    — the glass phone, centred (held in a hand when `lab.hand` names one),
                       on the lab's own blurred light;
         2. opening  — the phone's screen opens out into the page: the glass grows from the
                       phone's shape to the whole display, its rounded lit edge flattening into
                       a full-bleed photograph, while the phone's own screen fades away;
         3. carousel — a lab photograph fills the screen, its name set large on the left,
                       and the next ones wait as cards on the right. Advancing, the next card
                       grows out of the row until it is the whole screen — the morph — while
                       the row slides along and the words change.

       Touching anything on the phone during the intro goes straight to the carousel at that
       photograph. Positions for the morph are read with offsetLeft/offsetTop, not bounding
       rects: those are unscaled, so they agree with the slide's own pixels inside FitSlide. */
    const N = labSlides.length;
    const LAB_HOLD = Math.max(hold, 4500);
    const INTRO_MS = 2800;
    const OPEN_MS = 1150;
    const MORPH_MS = 1000;
    const CARD_W = 200;
    const CARD_GAP = 20;
    const VISIBLE = 5;

    const forgeIdx = labSlides.map((s, i) => (/forge|studio/i.test(s.title || '') ? i : -1)).filter((i) => i >= 0);
    /* Up to nine, and always whole rows: a short last row is topped up from the forges. */
    const others = labSlides.map((_, i) => i).filter((i) => !forgeIdx.includes(i)).slice(0, 9);
    const short = (3 - (others.length % 3)) % 3;
    const gridIdx = [...others, ...(short ? forgeIdx.slice(-short) : [])];
    const avatarPick = labSlides[Math.min(1, N - 1)];
    const avatarSrc = lab.avatar || avatarPick.thumb || avatarPick.src;
    const placeOf = (s) => `${lab.place || 'NCET'} · ${s.short || '24/7 AI Lab'}`;

    let cur = 0;
    let mode = 'intro';
    let busy = false;
    let introTimer = null;
    let spiralTimer = null;

    /* The ambient ground behind the intro: two layers crossfading, plus drifting lights. */
    const amb = [h('img', { class: 'tp-amb__img', alt: '', draggable: 'false' }), h('img', { class: 'tp-amb__img', alt: '', draggable: 'false' })];
    let ambTop = 0;
    const ambient = h('div', { class: 'tp-amb', 'aria-hidden': 'true' }, ...amb,
      ...[0, 1, 2, 3, 4, 5].map((k) => h('span', { class: `tp-amb__light tp-amb__light--${k}` })));
    const setAmbient = (i) => {
      const next = amb[1 - ambTop];
      next.src = small(labSlides[i]);
      next.classList.add('is-on');
      amb[ambTop].classList.remove('is-on');
      ambTop = 1 - ambTop;
    };

    /* ---------------------------------------------------------- the phone */
    const labCount = h('span', { class: 'tp-phone__count' });
    const labBar = h('span', { class: 'tp-lab__bar' });
    const navNow = h('img', { alt: '', draggable: 'false' });

    /* Anything pressed on the phone during the intro lands in the carousel first. */
    const act = (fn) => () => {
      if (mode === 'carousel') { fn(); return; }
      enterCarousel(fn);
    };

    const hlBtns = forgeIdx.map((i) => {
      const s = labSlides[i];
      const label = s.short || (s.title || '').replace(/\s*(Forge|Studio)$/i, '') || s.title;
      return h('button', { class: 'tp-phone__hl', type: 'button', 'data-i': String(i), onclick: act(() => goTo(i)) },
        h('span', { class: 'tp-phone__hl-ring' }, h('img', { src: small(s), alt: '', draggable: 'false' })),
        h('span', { class: 'tp-phone__hl-label' }, label));
    });
    const gridBtns = gridIdx.map((i) => h('button', {
      class: 'tp-phone__cell', type: 'button', 'data-i': String(i), 'aria-label': labSlides[i].title || '',
      onclick: act(() => goTo(i)),
    }, h('img', { src: small(labSlides[i]), alt: '', draggable: 'false' }),
      h('span', { class: 'tp-phone__cell-ic' }, icon('image', { class: 'ic' }))));

    const stats = (lab.stats || []).slice(0, 3).map((st) => h('li', { class: 'tp-phone__stat' },
      h('b', {}, st.value), h('span', {}, st.label)));
    const labPause = h('button', { class: 'tp-phone__iconbtn', type: 'button', 'aria-label': 'Pause', onclick: () => setPaused(!paused) },
      icon('pause', { class: 'ic ic--xs' }));
    labPauseBtn = labPause;

    const phone = h('div', { class: 'tp-phone' },
      h('span', { class: 'tp-phone__bezel', 'aria-hidden': 'true' }),
      h('span', { class: 'tp-phone__glint', 'aria-hidden': 'true' }),
      h('header', { class: 'tp-phone__bar' },
        lab.mark ? h('img', { class: 'tp-phone__mark', src: src(lab.mark), alt: '' }) : icon('sparkles', { class: 'ic ic--sm' }),
        h('span', { class: 'tp-phone__live' }, h('i'), lab.live || 'Live')),
      h('div', { class: 'tp-phone__profile' },
        h('span', { class: 'tp-phone__avatar' },
          lab.note ? h('span', { class: 'tp-phone__note' }, lab.note) : null,
          h('span', { class: 'tp-phone__avatar-ring' }, h('img', { src: src(avatarSrc), alt: '', draggable: 'false' })),
          h('i', {}, icon('check', { class: 'ic', strokeWidth: 3 }))),
        stats.length ? h('ul', { class: 'tp-phone__stats' }, ...stats) : null),
      h('div', { class: 'tp-phone__id' },
        h('h2', { class: 'tp-phone__name' }, lab.title || 'AI Lab'),
        lab.tag ? h('span', { class: 'tp-phone__tag' }, lab.tag) : null),
      lab.facts?.length
        ? h('ul', { class: 'tp-phone__facts' }, ...lab.facts.map((f) => h('li', {}, icon(f.icon || 'check', { class: 'ic ic--xs' }), f.label)))
        : null,
      h('div', { class: 'tp-phone__btns' },
        h('button', { class: 'tp-phone__btn', type: 'button', onclick: act(() => prev()) }, icon('chevron-left', { class: 'ic ic--xs' }), 'Previous'),
        h('button', { class: 'tp-phone__btn', type: 'button', onclick: act(() => next()) }, 'Next', icon('chevron-right', { class: 'ic ic--xs' })),
        labPause),
      hlBtns.length ? h('div', { class: 'tp-phone__hls' }, ...hlBtns) : null,
      gridBtns.length
        ? h('div', { class: 'tp-phone__gridwrap' },
            h('span', { class: 'tp-phone__tabs' }, icon('layers', { class: 'ic ic--xs' }), 'Inside the lab'),
            h('div', { class: 'tp-phone__grid' }, ...gridBtns))
        : null,
      h('footer', { class: 'tp-phone__foot' },
        h('span', { class: 'tp-phone__track' }, labBar),
        h('nav', { class: 'tp-phone__nav' },
          h('button', { class: 'tp-phone__navbtn', type: 'button', 'aria-label': 'Back to the partnership', onclick: () => setTab(0) }, icon('handshake-check', { class: 'ic ic--sm' })),
          h('button', { class: 'tp-phone__navbtn', type: 'button', 'aria-label': 'Previous photo', onclick: act(() => prev()) }, icon('chevron-left', { class: 'ic ic--sm' })),
          labCount,
          h('button', { class: 'tp-phone__navbtn', type: 'button', 'aria-label': 'Next photo', onclick: act(() => next()) }, icon('chevron-right', { class: 'ic ic--sm' })),
          h('span', { class: 'tp-phone__navnow' }, navNow))));

    /* The hand that holds it, when one has been supplied — a cut-out photograph, never drawn. */
    const hand = lab.hand ? h('img', { class: 'tp-hand', src: src(lab.hand), alt: '', draggable: 'false' }) : null;
    const stageIntro = h('div', { class: 'tp-intro' }, hand, phone);

    /* ------------------------------------------------------- the carousel */
    const bg = [h('img', { class: 'tp-car__bg', alt: '', draggable: 'false' }), h('img', { class: 'tp-car__bg', alt: '', draggable: 'false' })];
    let bgTop = 0;
    const morphLayer = h('div', { class: 'tp-car__morph', 'aria-hidden': 'true' });
    const eyebrow = h('span', { class: 'tp-car__eyebrow' });
    const title = h('h2', { class: 'tp-car__title' });
    const desc = h('p', { class: 'tp-car__desc' });
    const num = h('span', { class: 'tp-car__num' });
    const fill = h('span', { class: 'tp-car__fill' });
    const row = h('div', { class: 'tp-car__row' });
    const rowBox = h('div', { class: 'tp-car__rowbox' }, row);
    const carPause = h('button', { class: 'tp-car__round', type: 'button', 'aria-label': 'Pause', onclick: () => setPaused(!paused) },
      icon('pause', { class: 'ic ic--xs' }));
    carPauseBtn = carPause;

    /** Show photo `i` as the background — instantly under a morph, or as a crossfade. */
    const setBg = (i, fade) => {
      const s = labSlides[i];
      if (!fade) {
        bg[bgTop].src = src(s.src);
        bg[bgTop].classList.remove('is-drift'); void bg[bgTop].offsetWidth; bg[bgTop].classList.add('is-drift');
        return;
      }
      const next = bg[1 - bgTop];
      next.src = src(s.src);
      next.classList.remove('is-drift'); void next.offsetWidth; next.classList.add('is-drift');
      next.classList.add('is-on');
      bg[bgTop].classList.remove('is-on');
      bgTop = 1 - bgTop;
    };

    const cardFor = (i) => {
      const s = labSlides[i];
      return h('button', { class: 'tp-car__card', type: 'button', 'data-i': String(i), 'aria-label': s.title || '', onclick: () => goTo(i) },
        h('img', { src: small(s), alt: '', draggable: 'false' }),
        h('span', { class: 'tp-car__cardtext' },
          h('small', {}, s.short || 'AI Lab'),
          h('b', {}, s.title || '')));
    };
    const fillRow = () => row.replaceChildren(
      ...Array.from({ length: Math.min(VISIBLE, N - 1) }, (_, k) => cardFor((cur + 1 + k) % N)));

    const paintText = () => {
      const s = labSlides[cur];
      eyebrow.textContent = placeOf(s);
      title.textContent = s.title || '';
      desc.textContent = s.caption || '';
      num.replaceChildren(h('b', {}, pad(cur + 1)), h('small', {}, ` / ${pad(N)}`));
      fill.style.width = `${((cur + 1) / N) * 100}%`;
      labCount.textContent = `${pad(cur + 1)} / ${pad(N)}`;
      navNow.src = small(s);
      [eyebrow, title, desc].forEach((el) => { el.classList.remove('is-in', 'is-out'); void el.offsetWidth; el.classList.add('is-in'); });
      [...hlBtns, ...gridBtns].forEach((el) => el.classList.toggle('is-active', Number(el.dataset.i) === cur));
      restart(labBar);
      setAmbient(cur);
    };

    /** Forward one: the first card grows out of the row into the whole screen. */
    function next() {
      if (busy || N < 2) return;
      const target = (cur + 1) % N;
      const card = row.firstElementChild;
      if (!card || REDUCED_TP) { cur = target; setBg(cur, true); fillRow(); paintText(); return; }
      busy = true;
      const m = h('img', { class: 'tp-car__morphimg', src: src(labSlides[target].src), alt: '' });
      Object.assign(m.style, {
        left: `${rowBox.offsetLeft + card.offsetLeft}px`,
        top: `${rowBox.offsetTop + card.offsetTop}px`,
        width: `${card.offsetWidth}px`,
        height: `${card.offsetHeight}px`,
      });
      morphLayer.append(m);
      card.classList.add('is-lifting');
      [eyebrow, title, desc].forEach((el) => { el.classList.remove('is-in'); el.classList.add('is-out'); });
      void m.offsetWidth;
      m.classList.add('is-go');
      Object.assign(m.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
      row.classList.add('is-sliding');
      row.style.transform = `translateX(${-(CARD_W + CARD_GAP)}px)`;
      setTimeout(() => {
        cur = target;
        setBg(cur, false);
        m.remove();
        row.classList.remove('is-sliding');
        row.style.transform = '';
        fillRow();
        paintText();
        busy = false;
      }, MORPH_MS);
    }

    /** Back one, or to any photograph: a crossfade, the row rebuilt behind it. */
    function prev() {
      if (busy || N < 2) return;
      cur = (cur - 1 + N) % N;
      setBg(cur, true);
      fillRow();
      paintText();
    }
    function goTo(i) {
      const t = ((i % N) + N) % N;
      if (t === cur) return;
      if (t === (cur + 1) % N) { next(); return; }
      if (busy) return;
      cur = t;
      setBg(cur, true);
      fillRow();
      paintText();
    }

    const carousel = h('div', { class: 'tp-car' },
      ...bg,
      h('span', { class: 'tp-car__shade', 'aria-hidden': 'true' }),
      morphLayer,
      h('div', { class: 'tp-car__copy' },
        h('span', { class: 'tp-car__rule', 'aria-hidden': 'true' }),
        eyebrow, title, desc,
        h('div', { class: 'tp-car__actions' },
          carPause,
          h('button', { class: 'tp-car__ghost', type: 'button', onclick: () => playIntro() }, icon('phone', { class: 'ic ic--xs' }), 'View on the phone'))),
      rowBox,
      h('div', { class: 'tp-car__controls' },
        h('button', { class: 'tp-car__arrow', type: 'button', 'aria-label': 'Previous photo', onclick: () => { prev(); labAuto.reset(); } }, icon('chevron-left', { class: 'ic ic--sm' })),
        h('button', { class: 'tp-car__arrow', type: 'button', 'aria-label': 'Next photo', onclick: () => { next(); labAuto.reset(); } }, icon('chevron-right', { class: 'ic ic--sm' })),
        h('span', { class: 'tp-car__track' }, fill),
        num));

    /* ----------------------------------------------------------- the movements */
    labPanel = h('section', { class: `tp-panel tp-panel--lab${lab.cardStyle === 'neon' ? ' is-neon' : ''}` },
      ambient, carousel, stageIntro);

    const setMode = (m) => {
      mode = m;
      labPanel.classList.toggle('is-intro', m === 'intro');
      labPanel.classList.toggle('is-opening', m === 'opening');
      labPanel.classList.toggle('is-carousel', m === 'carousel');
    };

    function playIntro() {
      clearTimeout(introTimer);
      clearTimeout(spiralTimer);
      busy = false;
      morphLayer.replaceChildren();
      setMode('intro');
      introTimer = setTimeout(() => enterCarousel(), INTRO_MS);
    }

    /**
     * Open the phone's screen out into the page, then bring the words and cards up; `then`
     * runs once the carousel is in.
     *
     * The screen is a copy laid exactly over the phone (offsetLeft/Top — unscaled, so it
     * agrees with the slide inside FitSlide), carrying the photograph the carousel opens on.
     * It grows to the panel's own size while its corners and lit edge relax to nothing; the
     * real background is set underneath first, so when the copy is removed nothing changes.
     */
    function enterCarousel(then) {
      if (mode === 'opening' || mode === 'carousel') { then?.(); return; }
      clearTimeout(introTimer);
      setBg(cur, false);
      fillRow();
      const arrive = () => {
        setMode('carousel');
        row.classList.add('is-entering');
        setTimeout(() => row.classList.remove('is-entering'), 1300);
        paintText();
        labAuto.reset();
        then?.();
      };
      if (REDUCED_TP) { arrive(); return; }
      const screen = h('div', { class: 'tp-screen', 'aria-hidden': 'true' },
        h('img', { src: src(labSlides[cur].src), alt: '', draggable: 'false' }));
      Object.assign(screen.style, {
        left: `${phone.offsetLeft}px`,
        top: `${phone.offsetTop}px`,
        width: `${phone.offsetWidth}px`,
        height: `${phone.offsetHeight}px`,
      });
      stageIntro.append(screen);
      setMode('opening');
      void screen.offsetWidth;
      screen.classList.add('is-open');
      Object.assign(screen.style, {
        left: '0px',
        top: '0px',
        width: `${labPanel.clientWidth}px`,
        height: `${labPanel.clientHeight}px`,
      });
      spiralTimer = setTimeout(() => { arrive(); screen.remove(); }, OPEN_MS);
    }

    const labAuto = autoSlide(() => next(), {
      host: labPanel, interval: LAB_HOLD,
      canRun: () => tab === 1 && mode === 'carousel' && !paused,
    });

    labShow = {
      enter: () => { cur = 0; fillRow(); playIntro(); },
      leave: () => { clearTimeout(introTimer); clearTimeout(spiralTimer); setMode('intro'); },
      start: () => labAuto.start(),
      stop: () => labAuto.stop(),
      reset: () => labAuto.reset(),
      go: (i) => goTo(i),
      step: (d) => (d > 0 ? next() : prev()),
      skip: () => { if (mode === 'carousel') return false; enterCarousel(); return true; },
      get at() { return cur; },
    };

    setBg(0, false);
    bg[0].classList.add('is-on');
    fillRow();
    paintText();
    setMode('intro');
  }

  const track = h('div', { class: 'tp-track' }, overview, labPanel);
  root.append(h('div', { class: 'tp-grid', 'aria-hidden': 'true' }), track, top);

  /* -------------------------------------------------------------- behaviour */
  let paused = editing;

  function setTab(i) {
    const next = Math.max(0, Math.min(tabNames.length - 1, i));
    tab = next;
    root.dataset.tab = String(next);
    root.style.setProperty('--tp-tab', String(next));
    tabs.forEach((t, n) => t.classList.toggle('is-active', n === next));
    // Restart the arrival motion of whichever panel has just come in.
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
    storyAuto.reset();
    // The AI Lab plays its intro every time it is opened, and resets when it is left.
    if (next === 1) labShow?.enter(); else labShow?.leave();
  }

  function setPaused(on) {
    paused = on;
    root.classList.toggle('is-paused', on);
    pauseBtn.replaceChildren(icon(on ? 'play' : 'pause', { class: 'ic ic--xs' }));
    pauseBtn.setAttribute('aria-label', on ? 'Play' : 'Pause');
    // The phone carries its own copy of the control; keep the two in step.
    labPauseBtn?.replaceChildren(icon(on ? 'play' : 'pause', { class: 'ic ic--xs' }));
    labPauseBtn?.setAttribute('aria-label', on ? 'Play' : 'Pause');
    carPauseBtn?.replaceChildren(icon(on ? 'play' : 'pause', { class: 'ic ic--xs' }));
    carPauseBtn?.setAttribute('aria-label', on ? 'Play' : 'Pause');
    railPause.replaceChildren(icon(on ? 'play' : 'pause', { class: 'ic ic--xs' }));
    railPause.setAttribute('aria-label', on ? 'Play' : 'Pause');
    if (on) { storyAuto.stop(); labShow?.stop(); } else { storyAuto.start(); labShow?.start(); }
  }

  if (!editing) {
    registerStepper((delta) => {
      if (delta > 0 && tab === 1 && labShow?.skip?.()) return true;
      if (delta > 0 && tab < tabNames.length - 1) { setTab(tab + 1); return true; }
      if (delta < 0 && tab > 0) { setTab(tab - 1); return true; }
      return false;
    });
  }


  paintStory();
  setTab(0);
  setPaused(paused);
  return root;
}
