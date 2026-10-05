import { h, svg } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { registerStepper } from '../utils/slideSteps.js';
import { autoSlide, slideIn } from '../utils/autoSlide.js';

/**
 * The Leadership Journey as an arc down the left edge that plays itself.
 *
 * The arc is a `)` bulging into the slide from the left: one chapter per segment, first at the
 * top, last at the bottom, each numbered inside the band with its title set level beside it.
 * The right of the slide is one reading panel holding the current chapter in full — year, title,
 * role, the whole summary and its highlights — joined to its segment by a dotted leader.
 *
 * It advances on its own and loops. The hold is longer than a photograph's because these are
 * paragraphs to be read, and a bar along the foot of the panel shows how much of it is left.
 * Above that bar a stepper walks the same chapters — done, current, still to come — so the room
 * always sees where in the journey the panel is.
 * Clicking a segment, the panel's arrows and the deck's own Prev / Next all still step, and each
 * of them restarts the hold from the chapter it lands on.
 *
 * Everything on the arc is solved from one circle, and the stage holds the viewBox's aspect, so
 * the HTML panel placed in percentages lines up with the SVG leader at any scale.
 */

const VB = { w: 1600, h: 860 };

/* Corner to corner. The circle is solved so the band's centreline crosses the top and bottom
   edges about forty pixels in from the left — the band then spans the corner itself — and
   crowns at x 250. */
const C = { x: -295, y: 430 };
const R = 545;
const BAND = 66;

/* Degrees clockwise from east with y pointing down, so negative is up. VIS is where the
   centreline meets the top and bottom edges; the segments share that visible stretch equally.
   The two ends then run on past the edges to FROM / TO, off the slide, so the band still meets
   the corners — the stage is letterboxed by 20px when presenting and the SVG draws there too. */
const VIS = (Math.asin(C.y / R) * 180) / Math.PI;
const FROM = -70;
const TO = 70;
const GAP = 1.4;

/* Each title sits level with its segment's middle, held inside these heights: the top one
   inside the panel's height, so every leader runs dead level, and the bottom one clear of the
   deck bar presenting lays across the foot of the slide. */
const LABEL_Y = { top: 100, bottom: 760 };

/* Where the reading panel sits, as a share of the stage — and so of the viewBox. Tall enough
   that every title's height falls inside it, so each leader can run dead level. The title's
   `left` in the stylesheet matches `left` here. */
const PANEL = { left: 0.44, right: 0.035, top: 0.1, bottom: 0.08 };

/* How long one chapter holds before the next. */
const HOLD_MS = 5000;

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (r, deg) => [C.x + Math.cos(rad(deg)) * r, C.y + Math.sin(rad(deg)) * r];
const n2 = (v) => Math.round(v * 100) / 100;

/** An annular sector: out along one edge, back along the other. */
function sector(from, to, rOuter, rInner) {
  const [ax, ay] = pt(rOuter, from);
  const [bx, by] = pt(rOuter, to);
  const [cx, cy] = pt(rInner, to);
  const [dx, dy] = pt(rInner, from);
  const big = to - from > 180 ? 1 : 0;
  return `M${n2(ax)} ${n2(ay)}A${rOuter} ${rOuter} 0 ${big} 1 ${n2(bx)} ${n2(by)}`
    + `L${n2(cx)} ${n2(cy)}A${rInner} ${rInner} 0 ${big} 0 ${n2(dx)} ${n2(dy)}Z`;
}

/* A title on two lines once it has more than two words, broken where the two halves come out
   closest in length — "AI & Innovation / Leadership", not "AI / & Innovation Leadership". */
function titleLines(title) {
  const words = String(title).trim().split(/\s+/);
  if (words.length <= 2) return [words.join(' ')];
  let best = 1;
  let bestDiff = Infinity;
  for (let k = 1; k < words.length; k += 1) {
    const diff = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length);
    if (diff < bestDiff) { bestDiff = diff; best = k; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export function LeadershipRoad(block, { editing = false } = {}) {
  const panels = (block.panels || []).filter(Boolean);
  if (!panels.length) {
    return h('div', { class: 'ja-root ja-root--empty ph-root' }, 'No chapters yet.');
  }

  const count = panels.length;
  const rOuter = R + BAND / 2;
  const rInner = R - BAND / 2;

  /* Equal shares of the visible arc. Only the two ends reach further, and only off the slide. */
  const span = (2 * VIS - GAP * (count - 1)) / count;
  const seg = (i) => {
    const from = -VIS + i * (span + GAP);
    const to = from + span;
    /* The height this chapter's number and title sit at: its segment's middle, held where it
       can be read and reached. */
    const y = Math.max(LABEL_Y.top, Math.min(LABEL_Y.bottom, C.y + R * Math.sin(rad(from + span / 2))));
    return {
      from: i === 0 ? FROM : from,
      to: i === count - 1 ? TO : to,
      y,
      ang: (Math.asin((y - C.y) / R) * 180) / Math.PI,
    };
  };
  /* Where the circle of radius r crosses height y, on the slide's side. */
  const xAt = (r, y) => C.x + Math.sqrt(Math.max(0, r * r - (y - C.y) ** 2));
  const total = String(count).padStart(2, '0');

  /* ------------------------------------------------------------------- the arc */
  const bands = panels.map((panel, i) => {
    const s = seg(i);
    /* The lit segment steps out along its own radius; the direction is handed to CSS. */
    return svg('path', {
      class: 'ja-seg',
      d: sector(s.from, s.to, rOuter, rInner),
      style: `--i:${i};--dx:${n2(Math.cos(rad(s.ang)) * 10)}px;--dy:${n2(Math.sin(rad(s.ang)) * 10)}px`,
      onclick: () => manual(i),
    });
  });

  const nums = panels.map((panel, i) => {
    const { y } = seg(i);
    const x = xAt(R, y);
    return svg('text', {
      class: 'ja-num', x: n2(x), y: n2(y),
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      style: `--i:${i}`,
    }, String(i + 1).padStart(2, '0'));
  });

  const titles = panels.map((panel, i) => {
    const { y } = seg(i);
    const x = xAt(rOuter, y) + 26;
    const lines = titleLines((panel.title || `Chapter ${i + 1}`).toUpperCase());
    return svg('text', {
      class: 'ja-seg__label', x: n2(x), y: n2(y),
      'dominant-baseline': 'central',
      style: `--i:${i}`,
      onclick: () => manual(i),
    }, ...lines.map((line, k) => svg('tspan', {
      x: n2(x),
      dy: k === 0 ? `${lines.length > 1 ? -0.6 : 0}em` : '1.2em',
    }, line)));
  });

  /* One leader, re-aimed at whichever chapter is on. */
  const lead = svg('path', { class: 'ja-lead' });
  const leadDot = svg('circle', { class: 'ja-lead__dot', r: 5 });

  const canvas = svg('svg', {
    class: 'ja-svg',
    viewBox: `0 0 ${VB.w} ${VB.h}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, lead, ...bands, ...nums, ...titles, leadDot);

  /* ---------------------------------------------------------------- the panel */
  const ghost = h('span', { class: 'ja-panel__ghost', 'aria-hidden': 'true' });
  const body = h('div', { class: 'ja-panel__body' });
  const progress = h('span', { class: 'ja-panel__bar' });

  const prevBtn = h('button', {
    class: 'ja-ctl', type: 'button', 'aria-label': 'Previous chapter',
    onclick: () => manual(active - 1),
  }, icon('chevron-left', { class: 'ic ic--sm' }));
  const nextBtn = h('button', {
    class: 'ja-ctl', type: 'button', 'aria-label': 'Next chapter',
    onclick: () => manual(active + 1),
  }, icon('chevron-right', { class: 'ic ic--sm' }));
  const playBtn = h('button', {
    class: 'ja-ctl ja-ctl--play', type: 'button',
    onclick: () => setPlaying(!playing),
  });

  /* ------------------------------------------------------------- the stepper
     The journey at a glance along the foot of the panel: an icon, a node and the chapter's
     year and name per step. Done steps carry a tick, the current one is lit, and the line
     between them fills up to wherever the panel has got to. */
  const stepFill = h('span', { class: 'ja-steps__fill' });
  const steps = panels.map((p, i) => h('button', {
    class: 'ja-step', type: 'button',
    'aria-label': `Chapter ${i + 1}: ${p.title || ''}`,
    onclick: () => manual(i),
  },
    h('span', { class: 'ja-step__icon' }, icon(p.icon || 'sparkles', { class: 'ic' })),
    h('span', { class: 'ja-step__node' }, icon('check', { class: 'ic ja-step__tick', strokeWidth: 2.6 })),
    h('span', { class: 'ja-step__year' }, p.year || String(i + 1).padStart(2, '0')),
    h('span', { class: 'ja-step__name' }, p.title || ''),
  ));
  const stepper = h('div', { class: 'ja-steps', style: { '--n': String(count) } },
    h('span', { class: 'ja-steps__track' }, stepFill),
    ...steps,
  );

  const panel = h('section', {
    class: 'ja-panel',
    style: {
      left: `${PANEL.left * 100}%`,
      right: `${PANEL.right * 100}%`,
      top: `${PANEL.top * 100}%`,
      bottom: `${PANEL.bottom * 100}%`,
      '--ja-hold': `${HOLD_MS}ms`,
    },
    'aria-live': 'polite',
  },
    ghost,
    body,
    stepper,
    h('div', { class: 'ja-panel__foot' },
      h('span', { class: 'ja-panel__track' }, progress),
      h('div', { class: 'ja-panel__ctls' }, prevBtn, playBtn, nextBtn),
    ),
  );

  const stage = h('div', { class: 'ja-stage' }, canvas, panel);

  const root = h('div', { class: 'ja-root ph-root' },
    h('h2', { class: 'ja-title' }, (block.titleLines || ['Leadership Journey'])[0]),
    stage,
  );

  /* Shrinks the type a step at a time until the chapter fits its panel. The panel is a fixed
     box beside a fixed arc, so the words give rather than the box — and none are cut. */
  const fitBody = () => {
    let scale = 1;
    body.style.setProperty('--ja-fs', '1');
    while (body.scrollHeight > body.clientHeight + 1 && scale > 0.72) {
      scale -= 0.04;
      body.style.setProperty('--ja-fs', String(n2(scale)));
    }
  };

  /* Aim the leader from the end of the lit title to the panel's near edge. */
  const aim = () => {
    const label = titles[active];
    if (!label || !label.isConnected) return;
    let box;
    try { box = label.getBBox(); } catch { return; }
    if (!box.width) return;
    const x1 = box.x + box.width + 18;
    const y1 = box.y + box.height / 2;
    const x2 = PANEL.left * VB.w - 2;
    /* Straight, never curved: level with the title wherever the panel spans that height,
       which with this geometry is every chapter. */
    const yTop = PANEL.top * VB.h + 14;
    const yBot = (1 - PANEL.bottom) * VB.h - 14;
    const y2 = Math.max(yTop, Math.min(y1, yBot));
    lead.setAttribute('d', `M${n2(x1)} ${n2(y1)}L${n2(x2)} ${n2(y2)}`);
    leadDot.setAttribute('cx', n2(x1));
    leadDot.setAttribute('cy', n2(y1));
    lead.classList.remove('is-in');
    void lead.getBoundingClientRect();
    lead.classList.add('is-in');
  };

  /* Restart the bar from empty: drop the class, force a style pass, put it back. */
  const restartBar = () => {
    progress.classList.remove('is-run');
    void progress.offsetWidth;
    if (playing) progress.classList.add('is-run');
  };

  let active = 0;
  let playing = !editing;

  function show(i, dir = 1) {
    active = ((i % count) + count) % count;
    const p = panels[active];
    const num = String(active + 1).padStart(2, '0');

    bands.forEach((b, n) => b.classList.toggle('is-active', n === active));
    nums.forEach((t, n) => t.classList.toggle('is-active', n === active));
    titles.forEach((t, n) => {
      t.classList.toggle('is-active', n === active);
      t.classList.toggle('is-past', n < active);
    });

    steps.forEach((s, n) => {
      s.classList.toggle('is-done', n < active);
      s.classList.toggle('is-active', n === active);
    });
    stepFill.style.width = count > 1 ? `${(active / (count - 1)) * 100}%` : '0%';

    ghost.textContent = num;
    body.replaceChildren(
      h('div', { class: 'ja-panel__eyebrow' },
        h('span', {}, `Chapter ${num}`, h('i', {}, ` / ${total}`)),
        p.year ? h('span', { class: 'ja-panel__year' }, p.year) : null,
      ),
      h('h3', { class: 'ja-panel__title' }, p.title || p.chapter || `Chapter ${num}`),
      p.role ? h('p', { class: 'ja-panel__role' }, p.role) : null,
      p.summary ? h('p', { class: 'ja-panel__summary' }, p.summary) : null,
      p.highlights?.length
        ? h('ul', { class: 'ja-panel__tags' }, ...p.highlights.map((t) => h('li', {}, t)))
        : null,
    );
    fitBody();
    slideIn(body, dir);
    requestAnimationFrame(aim);
    restartBar();
  }

  const auto = autoSlide(() => show(active + 1, 1), { host: root, interval: HOLD_MS });

  /** A chosen chapter gets its full hold. */
  function manual(i) {
    const dir = i < active ? -1 : 1;
    show(i, dir);
    auto.reset();
  }

  function setPlaying(on) {
    playing = on;
    playBtn.replaceChildren(icon(on ? 'pause' : 'play', { class: 'ic ic--sm' }));
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    root.classList.toggle('is-paused', !on);
    if (on) auto.start();
    else auto.stop();
    restartBar();
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => { fitBody(); aim(); }).observe(stage);
  }

  if (!editing) {
    /* Prev / Next walk the chapters before the deck turns the slide: forward from the last
       chapter, or back from the first, hands the press back to the deck. */
    registerStepper((delta) => {
      const next = active + (delta > 0 ? 1 : -1);
      if (next < 0 || next > count - 1) return false;
      manual(next);
      return true;
    });
  }

  show(0);
  setPlaying(playing);
  return root;
}
