import { h, svg } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Team — the whole team as one loose network growing out of Babji Neelam.
 *
 * White ground, in the Technical Hub palette. The headline sits centred over a switch between
 * the entire team and the ten Claude-certified architects. Below it Babji Neelam stands at the
 * centre of the stage and the team is scattered freely around him, with a few Claude
 * connectors among them like messages in flight. A few dotted curves run out from Babji to
 * the connectors and on to the people nearest them, with a handful between neighbours —
 * a loose network, not a web.
 *
 * The scatter is a seeded jittered grid, then pushed apart until no portrait, name, chip or
 * Babji's own card touches another (each box is the real footprint, name pill included). If
 * the stage is too small for that at full size, the portraits shrink and it tries again.
 */

const src = (path) => (path ? media(`/uploads/${String(path).split('/').map(encodeURIComponent).join('/')}`) : '');
const CONNECTOR_ICONS = {
  'claude code': 'terminal', mcp: 'server', 'agent skills': 'puzzle', 'claude api': 'code',
  artifacts: 'cube', projects: 'layers', 'agent sdk': 'workflow', connectors: 'link',
};
const NAME_H = 26;          // how far the name pill reaches below a portrait's centre line, past its radius
const RING = 6;             // the white border and shadow ring round a portrait
const GAP = 14;             // the least clear space between any two things on the stage

// A small seeded random, so the scatter is the same on every visit and every display.
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const left = (b) => b.x + b.l;
const right = (b) => b.x + b.r;
const top = (b) => b.y + b.t;
const bottom = (b) => b.y + b.b;

/**
 * Pushes the bodies apart until none overlaps another (with GAP between), keeping each inside
 * the stage. Fixed bodies never move. Returns true when the result is clean.
 */
function relax(bodies, W, H) {
  const clamp = (b) => {
    if (b.fixed) return;
    b.x = Math.min(W - b.r, Math.max(-b.l, b.x));
    b.y = Math.min(H - b.b, Math.max(-b.t, b.y));
  };
  // Everyone inside the stage to begin with: a body that starts out past the edge and never
  // touches anyone would otherwise never be pushed, and so never be clamped.
  bodies.forEach(clamp);
  for (let pass = 0; pass < 400; pass += 1) {
    let moved = false;
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const A = bodies[i];
        const B = bodies[j];
        const ox = Math.min(right(A), right(B)) - Math.max(left(A), left(B)) + GAP;
        const oy = Math.min(bottom(A), bottom(B)) - Math.max(top(A), top(B)) + GAP;
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Out along the shallower axis, split between the two (all to one if the other is fixed).
        const shareA = A.fixed ? 0 : B.fixed ? 1 : 0.5;
        const shareB = 1 - shareA;
        if (ox < oy) {
          const s = (A.x + (A.l + A.r) / 2) < (B.x + (B.l + B.r) / 2) ? -1 : 1;
          A.x += s * ox * shareA * 0.6;
          B.x -= s * ox * shareB * 0.6;
        } else {
          const s = (A.y + (A.t + A.b) / 2) < (B.y + (B.t + B.b) / 2) ? -1 : 1;
          A.y += s * oy * shareA * 0.6;
          B.y -= s * oy * shareB * 0.6;
        }
        clamp(A);
        clamp(B);
      }
    }
    if (!moved) return true;
  }
  // Clean only if nothing still touches.
  return !bodies.some((A, i) => bodies.some((B, j) => j > i
    && Math.min(right(A), right(B)) - Math.max(left(A), left(B)) > 0
    && Math.min(bottom(A), bottom(B)) - Math.max(top(A), top(B)) > 0));
}

/** A gentle quadratic between two points, bowed to one side. */
function curve(p, q, bend) {
  const cx = (p.x + q.x) / 2 - (q.y - p.y) * bend;
  const cy = (p.y + q.y) / 2 + (q.x - p.x) * bend;
  return `M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
}

export function TeamWall(block) {
  const members = (block.members || []).filter((m) => m.photo);
  const root = h('div', { class: 'tw3-root ph-root' });
  if (!members.length) { root.append(h('p', { class: 'tw3-empty' }, 'No team photographs yet.')); return root; }

  const architects = members.filter((m) => m.architect).sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const connectors = (block.connectors || []).filter(Boolean);
  const hubData = block.hub?.photo ? block.hub : null;
  let view = 'all';

  /* ------------------------------------------------------------- the people */
  const nodes = members.map((m, i) => {
    const el = h('figure', { class: `tw3-node${m.architect ? ' is-architect' : ''}`, style: { '--i': String(i) } },
      h('span', { class: 'tw3-ava' },
        h('img', { src: src(m.photo), alt: m.name || 'Technical Hub trainer', draggable: 'false', loading: 'eager', style: { '--fx': `${m.focus ?? 50}%` } })),
      m.architect ? h('span', { class: 'tw3-seal', title: 'Claude-certified architect' }, icon('seal-check', { class: 'ic' })) : null,
      m.name ? h('figcaption', { class: 'tw3-name' }, m.name) : null);
    el.addEventListener('mouseenter', () => hot(i));
    el.addEventListener('mouseleave', () => hot(-1));
    return el;
  });

  const hub = hubData ? h('figure', { class: 'tw3-node tw3-hub' },
    h('span', { class: 'tw3-ava' },
      h('img', { src: src(hubData.photo), alt: hubData.name || '', draggable: 'false', loading: 'eager', style: { '--fx': `${hubData.focus ?? 50}%` } })),
    h('figcaption', { class: 'tw3-name' }, h('b', {}, hubData.name || ''), hubData.role ? h('small', {}, hubData.role) : null)) : null;
  if (hub) {
    hub.addEventListener('mouseenter', () => hot('hub'));
    hub.addEventListener('mouseleave', () => hot(-1));
  }

  const lines = svg('svg', { class: 'tw3-lines', 'aria-hidden': 'true' });
  const chipLayer = h('div', { class: 'tw3-chips', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'tw3-stage' }, lines, chipLayer, ...nodes, hub);

  // Hovering a person lights their whole branch back to Babji; hovering Babji lights it all.
  let net = null;
  function hot(i) {
    const on = new Set();
    if (net && i !== -1) {
      if (i === 'hub') net.paths.forEach((p) => on.add(p));
      else {
        let b = net.bodyOf.get(i);
        while (b !== undefined && b > 0) { on.add(net.pathTo[b]); b = net.parent[b]; }
      }
    }
    net?.paths.forEach((p) => p.classList.toggle('is-hot', on.has(p)));
    net?.chipEls.forEach((c) => c.el.classList.toggle('is-hot', i === 'hub' || on.has(net.pathTo[c.body])));
    stage.classList.toggle('has-hot', i !== -1);
    nodes.forEach((n, k) => n.classList.toggle('is-hot', k === i));
    hub?.classList.toggle('is-hot', i === 'hub');
  }

  /* --------------------------------------------------------------- layout */
  let lastKey = '';
  function layout(force) {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (!W || !H) return;
    const key = `${view}|${W}|${H}`;
    if (key === lastKey && !force) return;
    lastKey = key;

    const shown = view === 'all' ? members : architects;
    const ids = shown.map((m) => members.indexOf(m));
    const labels = connectors.slice(0, view === 'all' ? 6 : 4);
    const perChar = view === 'all' ? 7.1 : 8.4;
    const hubSize = Math.round(Math.min(view === 'all' ? 150 : 160, H * 0.3));
    const hubNameW = Math.max(hubSize, (hubData?.name || '').length * 9.6 + 40);
    const centre = { x: W / 2, y: H / 2 - 24 };

    let bodies = null;
    let size = view === 'all' ? 104 : 140;
    for (; size >= 44; size -= 4) {
      const rand = rng(view === 'all' ? 23 : 41);
      // Babji first and fixed, then a jittered grid of slots for everyone else.
      const hubBody = { kind: 'hub', fixed: true, x: centre.x, y: centre.y, l: -hubNameW / 2, r: hubNameW / 2, t: -hubSize / 2 - RING, b: hubSize / 2 + 54 };
      const others = [
        ...shown.map((m, k) => {
          const w = Math.max(size, (m.name || '').length * perChar + 26);
          return { kind: 'person', k, l: -w / 2 - RING, r: w / 2 + RING, t: -size / 2 - RING, b: size / 2 + NAME_H };
        }),
        ...labels.map((label, k) => {
          const w = label.length * 8.4 + 62;
          return { kind: 'chip', k, label, l: -w / 2, r: w / 2, t: -20, b: 20 };
        }),
      ];
      // The connectors start spread all round Babji, so his branches go every way.
      const chipBodies = others.filter((o) => o.kind === 'chip');
      const personBodies = others.filter((o) => o.kind === 'person');
      const turn = rand() * Math.PI * 2;
      chipBodies.forEach((o, k) => {
        const t = turn + (k / chipBodies.length) * Math.PI * 2 + (rand() - 0.5) * 0.5;
        o.x = centre.x + Math.cos(t) * W * (0.2 + rand() * 0.06);
        o.y = centre.y + Math.sin(t) * H * (0.3 + rand() * 0.06);
      });
      const total = personBodies.length;
      const rows = Math.max(2, Math.round(Math.sqrt((total / (W / H)) * 1.2)));
      const cols = Math.ceil((total + 2) / rows);
      const cellW = W / cols;
      const cellH = H / rows;
      // The slots nearest the middle are Babji's; the rest, furthest first, are everyone's.
      const slots = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const x = (c + 0.5 + (r % 2 ? 0.25 : -0.25)) * cellW;
          const y = (r + 0.5) * cellH;
          const d = Math.hypot((x - centre.x) / (hubNameW / 2 + cellW / 2), (y - centre.y) / (hubSize / 2 + cellH / 2));
          slots.push({ x, y, d });
        }
      }
      slots.sort((a, b) => b.d - a.d);
      const use = slots.slice(0, total);
      for (let i = use.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [use[i], use[j]] = [use[j], use[i]];
      }
      personBodies.forEach((o, k) => {
        o.x = use[k].x + (rand() - 0.5) * cellW * 0.55;
        o.y = use[k].y + (rand() - 0.5) * cellH * 0.45;
      });
      bodies = [hubBody, ...others];
      if (relax(bodies, W, H)) break;
    }

    // Place everyone at their body.
    const bodyOf = new Map();
    nodes.forEach((el, k) => el.classList.toggle('is-out', !ids.includes(k)));
    bodies.forEach((b, i) => {
      if (b.kind !== 'person') return;
      const el = nodes[ids[b.k]];
      bodyOf.set(ids[b.k], i);
      el.style.setProperty('--s', `${size}px`);
      el.style.transform = `translate(${Math.round(b.x - size / 2)}px, ${Math.round(b.y - size / 2)}px)`;
    });
    if (hub) {
      hub.style.setProperty('--s', `${hubSize}px`);
      hub.style.transform = `translate(${Math.round(centre.x - hubSize / 2)}px, ${Math.round(centre.y - hubSize / 2)}px)`;
    }

    // A few links, not a web. Babji reaches every connector and the two people nearest him;
    // each connector reaches the person nearest it (and now and then a second); and a handful
    // of people are linked to a neighbour. Everyone else simply stands in the network.
    const pts = bodies.map((b) => ({ x: b.x, y: b.y }));
    const pick = rng(view === 'all' ? 97 : 53);
    const dist = (i, j) => Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
    const personIdx = bodies.map((b, i) => (b.kind === 'person' ? i : -1)).filter((i) => i >= 0);
    const chipIdx = bodies.map((b, i) => (b.kind === 'chip' ? i : -1)).filter((i) => i >= 0);
    const parent = new Array(bodies.length).fill(-1);
    const linked = new Set();
    const links = [];
    const link = (a, b) => { links.push({ a, b }); if (parent[b] < 0) parent[b] = a; linked.add(b); };
    const nearest = (from, pool) => pool.filter((j) => !linked.has(j)).sort((x, y) => dist(from, x) - dist(from, y));
    chipIdx.forEach((c) => link(0, c));
    nearest(0, personIdx).slice(0, view === 'all' ? 2 : 1).forEach((p) => link(0, p));
    chipIdx.forEach((c) => {
      const near = nearest(c, personIdx);
      if (near[0] !== undefined) link(c, near[0]);
      if (near[1] !== undefined && pick() < 0.4) link(c, near[1]);
    });
    const loose = Math.round(personIdx.length * 0.18);
    personIdx.filter((p) => linked.has(p)).sort(() => pick() - 0.5).slice(0, loose).forEach((p) => {
      const near = nearest(p, personIdx);
      if (near[0] !== undefined && dist(p, near[0]) < W * 0.22) link(p, near[0]);
    });

    lines.setAttribute('viewBox', `0 0 ${W} ${H}`);
    lines.replaceChildren();
    const paths = [];
    const pathTo = [];
    links.forEach((e, k) => {
      const el = svg('path', {
        d: curve(pts[e.a], pts[e.b], (k % 2 ? 1 : -1) * (0.12 + ((k * 37) % 10) / 70)),
        class: e.a === 0 ? 'is-spoke' : k % 3 === 1 ? 'is-accent' : '',
        style: `--k:${k}`,
      });
      lines.append(el);
      paths.push(el);
      if (parent[e.b] === e.a) pathTo[e.b] = el;
    });

    const chipEls = [];
    chipLayer.replaceChildren(...bodies.map((b, i) => {
      if (b.kind !== 'chip') return null;
      const el = h('span', {
        class: 'tw3-chip', style: { left: `${Math.round(b.x)}px`, top: `${Math.round(b.y)}px`, '--k': String(b.k) },
      }, h('span', { class: 'tw3-chip__ic' }, icon(CONNECTOR_ICONS[b.label.toLowerCase()] || 'link', { class: 'ic' })), b.label);
      chipEls.push({ el, body: i });
      return el;
    }).filter(Boolean));

    net = { paths, pathTo, parent, bodyOf, chipEls };

    // Replay the drawing of the lines and the chips for the new network.
    stage.classList.remove('is-drawn');
    void stage.offsetWidth;
    stage.classList.add('is-drawn');
  }

  /* ------------------------------------------------------------ the switch */
  const tab = (key, label, count, ic) => h('button', {
    class: `tw3-tab${key === view ? ' is-on' : ''}`, type: 'button', 'data-view': key,
    onclick: () => {
      if (view === key) return;
      view = key;
      root.querySelectorAll('.tw3-tab').forEach((b) => b.classList.toggle('is-on', b.dataset.view === key));
      root.classList.toggle('is-architects', key === 'architects');
      hot(-1);
      layout(true);
    },
  }, icon(ic, { class: 'ic ic--sm' }), h('span', {}, label), h('b', {}, String(count)));

  const head = h('header', { class: 'tw3-head' },
    block.eyebrow ? h('span', { class: 'tw3-pill' }, h('i'), block.eyebrow) : null,
    h('h2', { class: 'tw3-title' },
      h('span', {}, block.headline?.[0] || 'Our Team'),
      block.headline?.[1] ? h('span', { class: 'tw3-title__accent' }, ` ${block.headline[1]}`) : null),
    block.body ? h('p', { class: 'tw3-body' }, block.body) : null,
    h('div', { class: 'tw3-switch', role: 'group', 'aria-label': 'Show' },
      tab('all', block.allLabel || 'Entire team', members.length, 'users'),
      architects.length ? tab('architects', block.architectsLabel || 'Claude-certified architects', architects.length, 'seal-check') : null));

  root.append(head, stage);

  // The stage's size settles after FitSlide scales the slide; solve again whenever it moves.
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => layout(false)).observe(stage);
  requestAnimationFrame(() => layout(false));
  return root;
}
