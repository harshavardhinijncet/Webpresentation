import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide } from '../utils/autoSlide.js';

/**
 * AI Ready Engineer — a four-page brochure spread.
 *
 *   01 Road map          light page: the headline, the offer in four tiles, and the road map
 *                        itself across the foot, drawn in from left to right.
 *   02 Course structure  the dark green spread: why the course stands out on the left, the
 *                        sixteen modules in four phases on the right.
 *   03 Training onboard  the classroom photographs in a coverflow carousel that runs itself.
 *   04 Benefits          what a student walks away with and what the campus gains, closing on
 *                        the figures and the contact line.
 *
 * Pages turn from the tabs or the deck's own Prev / Next, which walk the pages before leaving
 * the slide. The page fills the screen's height: spacing grows with --slide-h when presenting.
 */

const src = (path) => (path ? media(`/uploads/${String(path).split('/').map(encodeURIComponent).join('/')}`) : '');
const pad = (n) => String(n).padStart(2, '0');
const REDUCED_ARE = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

function countUp(el, value, ms = 1300) {
  const m = String(value).match(/^(\D*)(\d[\d,]*)(.*)$/);
  if (!m || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { el.textContent = value; return; }
  const target = Number(m[2].replace(/,/g, ''));
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = `${m[1]}${Math.round(target * (1 - (1 - k) ** 3)).toLocaleString('en-IN')}${m[3]}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function AiReadyDeck(block, { editing = false } = {}) {
  const b = block;
  const root = h('div', { class: 'are-root ph-root' });
  const PAGES = ['Road map', 'Course structure', 'Training onboard', 'Benefits'];
  const BENEFITS = 3;
  let at = 0;

  /* ----------------------------------------------------------------- top bar */
  const tabs = PAGES.map((name, i) => h('button', {
    class: 'are-tab', type: 'button', onclick: () => go(i),
  }, h('small', {}, pad(i + 1)), name));
  const line = h('span', { class: 'are-tabs__line', 'aria-hidden': 'true' });
  const counter = h('span', { class: 'are-count' });
  const top = h('header', { class: 'are-top' },
    h('span', { class: 'are-logo' }, b.logo ? h('img', { src: src(b.logo), alt: b.title || 'AI Ready Engineer' }) : h('b', {}, b.title)),
    h('nav', { class: 'are-tabs' }, ...tabs, line),
    h('div', { class: 'are-top__end' }, h('span', { class: 'are-by' }, b.eyebrow || ''), counter));

  /* ------------------------------------------------------- page 01: road map */
  const stat = (s, k) => h('div', { class: 'are-stat', style: { '--d': `${0.3 + k * 0.08}s` } },
    h('span', { class: 'are-stat__icon' }, icon(s.icon || 'sparkles', { class: 'ic' })),
    h('strong', { class: 'are-stat__value' }, s.value),
    h('span', { class: 'are-stat__label' }, s.label));

  const page1 = h('section', { class: 'are-page are-page--intro' },
    h('div', { class: 'are-intro' },
      h('div', { class: 'are-intro__copy' },
        b.kicker ? h('span', { class: 'are-pill', style: { '--d': '0s' } }, h('i'), b.kicker) : null,
        h('h2', { class: 'are-title', style: { '--d': '0.06s' } },
          b.headline?.[0] || '', h('br'), h('span', {}, b.headline?.[1] || 'AI Ready Engineer')),
        b.standfirst ? h('p', { class: 'are-lead', style: { '--d': '0.14s' } }, b.standfirst) : null,
        h('div', { class: 'are-actions', style: { '--d': '0.22s' } },
          h('button', { class: 'are-btn', type: 'button', onclick: () => go(1) }, 'Explore the course', icon('arrow-right', { class: 'ic ic--xs' })),
          ...(b.partners || []).map((p) => h('span', { class: 'are-chip' }, icon('seal-check', { class: 'ic ic--xs' }), p))),
      ),
      h('div', { class: 'are-stats' }, ...(b.stats || []).slice(0, 4).map(stat))),
    b.roadmap ? h('figure', { class: 'are-road' },
      h('img', { src: src(b.roadmap), alt: 'Road map to become an AI Ready Engineer', draggable: 'false' }),
      h('figcaption', {}, h('span', {}, 'Start'), h('i'), h('span', {}, 'AI Ready Engineer'))) : null);

  /* ---------------------------------------------- page 02: course structure */
  let n = 0;
  const phases = (b.phases || []).map((ph, k) => h('article', { class: 'are-phase', style: { '--d': `${0.2 + k * 0.1}s` } },
    h('header', { class: 'are-phase__head' },
      h('span', { class: 'are-phase__no' }, `Phase ${k + 1}`),
      h('h4', {}, ph.name)),
    h('ol', { class: 'are-mods' }, ...(ph.modules || []).map((m) => {
      n += 1;
      return h('li', { class: 'are-mod' },
        h('span', { class: 'are-mod__icon' }, icon(m.icon || 'sparkles', { class: 'ic' })),
        h('span', { class: 'are-mod__text' }, h('b', {}, m.title), m.body ? h('small', {}, m.body) : null),
        h('span', { class: 'are-mod__no' }, pad(n)));
    }))));

  const page2 = h('section', { class: 'are-page are-page--course' },
    h('div', { class: 'are-course' },
      h('aside', { class: 'are-why' },
        h('span', { class: 'are-eyebrow', style: { '--d': '0s' } }, b.course?.eyebrow || 'The curriculum'),
        h('h3', { class: 'are-h3', style: { '--d': '0.06s' } }, b.course?.title || ''),
        b.course?.subtitle ? h('p', { class: 'are-sub', style: { '--d': '0.12s' } }, b.course.subtitle) : null,
        h('ul', { class: 'are-why__list' }, ...(b.highlights || []).map((it, k) => h('li', { style: { '--d': `${0.18 + k * 0.06}s` } },
          h('span', { class: 'are-why__icon' }, icon(it.icon || 'check', { class: 'ic ic--xs' })),
          h('span', {}, h('b', {}, it.title), it.body ? h('small', {}, it.body) : null))))),
      h('div', { class: 'are-phases' }, ...phases)));

  /* ------------------------------------------------------- page 03: benefits */
  const benefit = (it, k) => h('article', { class: 'are-benefit', style: { '--d': `${0.15 + k * 0.07}s` } },
    h('div', { class: 'are-benefit__top' },
      h('span', { class: 'are-benefit__icon' }, icon(it.icon || 'check', { class: 'ic' })),
      h('span', { class: 'are-benefit__no' }, pad((k % 4) + 1))),
    h('div', { class: 'are-benefit__words' },
      h('h5', {}, it.title),
      it.body ? h('p', {}, it.body) : null));

  const closeStats = (b.close?.stats || []).map((s) => {
    const v = h('strong', {}, s.value);
    return { el: h('div', { class: 'are-figure' }, v, h('span', {}, s.label)), v, value: s.value };
  });

  const page3 = h('section', { class: 'are-page are-page--benefits' },
    h('div', { class: 'are-benefits' },
      h('div', { class: 'are-bcol' },
        h('span', { class: 'are-eyebrow are-eyebrow--ink' }, 'Student benefits'),
        h('h3', { class: 'are-h3 are-h3--ink' }, b.studentsTitle || 'What a student walks away with'),
        h('div', { class: 'are-bgrid' }, ...(b.students || []).map(benefit))),
      h('div', { class: 'are-bcol' },
        h('span', { class: 'are-eyebrow are-eyebrow--ink' }, 'College benefits'),
        h('h3', { class: 'are-h3 are-h3--ink' }, b.collegeTitle || 'What the campus gains'),
        h('div', { class: 'are-bgrid' }, ...(b.college || []).map((it, k) => benefit(it, k + 4))))),
    h('div', { class: 'are-close' },
      h('div', { class: 'are-close__lead' },
        h('span', { class: 'are-close__spark' }, icon('sparkles', { class: 'ic' })),
        h('div', {},
          h('span', { class: 'are-close__eyebrow' }, b.close?.eyebrow || ''),
          h('h3', {}, b.close?.title || ''),
          b.close?.line ? h('p', {}, b.close.line) : null)),
      h('div', { class: 'are-figures' }, ...closeStats.map((s) => s.el)),
      h('div', { class: 'are-contact' },
        h('span', { class: 'are-contact__head' }, 'Get in touch'),
        h('ul', {}, ...(b.close?.contact || []).map((c) => h('li', {},
          h('span', { class: 'are-contact__icon' }, icon(c.icon || 'link', { class: 'ic ic--xs' })), c.label))))));

  /* ----------------------------------------------- page 03: training onboard
     Laid out like a travel landing page: an oversized two-line headline with a photograph and
     an arrow pill set into its lines, a circular photograph on the right ringed by turning
     text, a row of three pills, then the classroom as an expanding-card carousel — one photo
     open wide, the rest standing as slim strips with a round badge, each opening in turn. */
  const tr = b.training || {};
  const shots = (tr.photos || []).filter((p) => p.src);
  const BADGES = ['users', 'code', 'brain', 'sparkles', 'rocket', 'book', 'chip', 'message', 'lightbulb', 'target', 'graduation', 'layers'];
  let cur = 0;
  const panels = shots.map((p, k) => h('button', {
    class: 'are-xc__panel', type: 'button', 'aria-label': p.caption || `Classroom ${k + 1}`,
    onclick: () => cfGo(k),
  },
    h('img', { src: src(p.src), alt: '', draggable: 'false', loading: k < 4 ? 'eager' : 'lazy' }),
    h('span', { class: 'are-xc__badge' }, icon(BADGES[k % BADGES.length], { class: 'ic ic--xs' })),
    h('span', { class: 'are-xc__cap' },
      h('b', {}, p.caption || tr.capTitle || 'AI Ready Engineer'),
      h('small', {}, `${tr.capSub || 'Classroom'} · ${pad(k + 1)}`))));
  const cfCount = h('span', { class: 'are-xc__count' });
  const cfBar = h('span', { class: 'are-cf__bar' });
  /* Moving forward one is a conveyor: the next strip widens into the open slot while the
     photograph leaving folds away on the left and the strips glide along; only once that has
     settled does it reappear, fading in at the end of the row. Any other jump reorders at once. */
  const XC_MS = 1400;
  let shown = -1;
  let settle = null;
  const reorder = () => panels.forEach((el, k) => { el.style.order = String((k - cur + shots.length) % shots.length); });
  const cfPlace = () => {
    const n = shots.length;
    clearTimeout(settle);
    panels.forEach((el) => el.classList.remove('is-leaving', 'is-entering'));
    if (shown >= 0 && cur === (shown + 1) % n && !REDUCED_ARE) {
      const out = panels[shown];
      out.classList.remove('is-open');
      out.classList.add('is-leaving');
      panels[cur].classList.add('is-open');
      settle = setTimeout(() => {
        out.classList.remove('is-leaving');
        reorder();
        out.classList.add('is-entering');
      }, XC_MS);
    } else {
      panels.forEach((el, k) => el.classList.toggle('is-open', k === cur));
      reorder();
    }
    shown = cur;
    cfCount.replaceChildren(h('b', {}, pad(cur + 1)), ` / ${pad(n)}`);
    cfBar.classList.remove('is-run'); void cfBar.offsetWidth; cfBar.classList.add('is-run');
  };
  const cfAuto = autoSlide(() => { cur = (cur + 1) % shots.length; cfPlace(); }, { host: root, interval: 5500, canRun: () => at === 2 });
  function cfGo(k) { cur = ((k % shots.length) + shots.length) % shots.length; cfPlace(); cfAuto.reset(); }

  const ring = h('span', { class: 'are-ring', 'aria-hidden': 'true' });
  ring.innerHTML = `<svg viewBox="0 0 300 300"><defs><path id="are-ring-path" d="M150,150 m-132,0 a132,132 0 1,1 264,0 a132,132 0 1,1 -264,0"/></defs><text><textPath href="#are-ring-path">${(tr.ring || 'AI READY ENGINEER · HANDS-ON · LAPTOP-FIRST · EVERY DAY · ').replace(/[<&]/g, '')}</textPath></text></svg>`;
  const hero = shots[tr.heroIndex ?? 1] || shots[0];
  const inset = shots[tr.insetIndex ?? 10] || shots[0];
  const pillPic = shots[tr.pillIndex ?? 3] || shots[0];

  const page4 = h('section', { class: 'are-page are-page--train' },
    h('div', { class: 'are-tr__hero' },
      h('div', { class: 'are-tr__copy' },
        h('h2', { class: 'are-tr__title', style: { '--d': '0s' } },
          h('span', { class: 'are-tr__line' }, tr.titleTop || 'Training',
            h('img', { class: 'are-tr__logo', src: src(tr.logo || 'ai-ready/ai-ready-logo-colour.png'), alt: 'AI Ready Engineer' })),
          h('span', { class: 'are-tr__line' },
            h('button', { class: 'are-tr__go', type: 'button', 'aria-label': 'Next photo', onclick: () => cfGo(cur + 1) }, icon('arrow-right', { class: 'ic' })),
            tr.titleBottom || 'Onboard')),
        h('div', { class: 'are-tr__lead', style: { '--d': '0.12s' } },
          h('span', { class: 'are-tr__glyphs' }, icon('sparkles', { class: 'ic ic--sm' }), icon('code', { class: 'ic ic--sm' })),
          tr.sub ? h('p', {}, tr.sub) : null)),
      h('div', { class: 'are-tr__pills' },
      h('div', { class: 'are-tr__pill', style: { '--d': '0.26s' } },
        h('span', { class: 'are-tr__stack' }, ...shots.slice(4, 6).map((p) => h('img', { src: src(p.src), alt: '' }))),
        h('span', {}, h('b', {}, tr.stat?.value || '16'), h('small', {}, tr.stat?.label || 'Modules, end to end'))),
      h('div', { class: 'are-tr__pill are-tr__pill--card', style: { '--d': '0.32s' } },
        h('span', {}, h('b', {}, tr.feature?.title || 'Hands-on labs'), h('small', {}, tr.feature?.body || 'Every session at a laptop, building as it is taught.')),
        pillPic ? h('span', { class: 'are-tr__round' }, h('img', { src: src(pillPic.src), alt: '' })) : null),
      h('div', { class: 'are-tr__pill are-tr__pill--story', style: { '--d': '0.38s' } },
        h('span', {}, h('b', {}, tr.story?.title || 'Our classrooms'), h('small', {}, tr.story?.body || 'Cohorts in session across our partner campuses.')),
        h('button', { class: 'are-tr__sq', type: 'button', 'aria-label': 'Next photo', onclick: () => cfGo(cur + 1) }, icon('arrow-right', { class: 'ic ic--sm' })))),
      hero ? h('figure', { class: 'are-tr__orb', style: { '--d': '0.2s' } },
        ring,
        /* Every classroom photograph as one looping film (tools/make-training-reel.cjs):
           muted, so it may autoplay; the first photograph stands in while it loads. */
        h('span', { class: 'are-tr__orbpic' }, h('video', {
          src: src(tr.reel || 'ai-ready/training-reel.mp4'), poster: src(hero.src),
          autoplay: true, muted: true, loop: true, playsinline: true, preload: 'auto',
          'aria-label': 'AI Ready Engineer classrooms',
        }))) : null),
    h('div', { class: 'are-xc__head', style: { '--d': '0.42s' } },
      h('h3', {}, tr.title || 'Inside the classroom'),
      h('div', { class: 'are-cf__nav' },
        cfCount,
        h('button', { class: 'are-cf__arrow', type: 'button', 'aria-label': 'Previous photo', onclick: () => cfGo(cur - 1) }, icon('chevron-left', { class: 'ic ic--sm' })),
        h('button', { class: 'are-cf__arrow is-primary', type: 'button', 'aria-label': 'Next photo', onclick: () => cfGo(cur + 1) }, icon('chevron-right', { class: 'ic ic--sm' })))),
    h('div', { class: 'are-xc' }, ...panels),
    h('span', { class: 'are-cf__track are-xc__track' }, cfBar));
  if (shots.length) { cfPlace(); cfAuto.start(); }
  /* The muted attribute alone does not satisfy the autoplay policy — the property must be set
     before play() is asked for, or a normal browser leaves the film on its poster. */
  const reel = page4.querySelector('.are-tr__orbpic video');
  if (reel) {
    reel.muted = true;
    reel.defaultMuted = true;
    const p = reel.play?.();
    if (p?.catch) p.catch(() => { /* refused: the poster frame stands in */ });
  }

  const track = h('div', { class: 'are-track' }, page1, page2, page4, page3);
  root.append(h('div', { class: 'are-bg', 'aria-hidden': 'true' }), track, top);

  /* ---------------------------------------------------------------- behaviour */
  const placeLine = () => {
    const t = tabs[at];
    if (!t || !t.offsetWidth) return;
    line.style.left = `${t.offsetLeft + 14}px`;
    line.style.width = `${t.offsetWidth - 28}px`;
  };

  function go(i) {
    at = Math.max(0, Math.min(PAGES.length - 1, i));
    root.dataset.page = String(at);
    root.style.setProperty('--are-page', String(at));
    tabs.forEach((t, k) => t.classList.toggle('is-active', k === at));
    counter.textContent = `${pad(at + 1)} / ${pad(PAGES.length)}`;
    placeLine();
    requestAnimationFrame(placeLine);
    [page1, page2, page4, page3].forEach((p, k) => {
      p.classList.toggle('is-current', k === at);
      if (k === at) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); }
    });
    if (at === BENEFITS) closeStats.forEach((s) => countUp(s.v, s.value));
    if (at === 2 && shots.length) { cfPlace(); cfAuto.reset(); }
  }

  if (!editing) {
    registerStepper((delta) => {
      const t = at + (delta > 0 ? 1 : -1);
      if (t < 0 || t >= PAGES.length) return false;
      go(t);
      return true;
    });
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(placeLine).observe(top);

  go(0);
  return root;
}
