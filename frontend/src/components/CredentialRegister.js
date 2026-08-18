import { h } from '../utils/dom.js';
import { upload } from '../utils/media.js';

/**
 * The credential register, in the three acts of the reference design.
 *
 *   01 The Register    — the badges as a constellation, the totals, the claim.
 *   02 Skills Unlocked — what each credential actually tests.
 *   03 The Gallery     — all forty-two badges, named.
 *
 * Everything on this page comes from one catalogue: forty-two named credentials,
 * twenty-two awarding bodies, a holder count each and four skills each. No cohort
 * artwork and no second data set — the reference is the catalogue, and that is what
 * these three acts are three views of.
 *
 * The register is set in a serif on a soft ground because it is making an argument
 * rather than presenting evidence; the other two acts are quieter and denser.
 *
 * Every badge is a local file under /uploads. The catalogue points at eight
 * different CDNs and this deck presents with no network at all, so the artwork is
 * downloaded at publish time by tools/fetch-certification-badges.cjs. One badge the
 * CDN refuses to release carries none, and its card falls back to the vendor set in
 * type — the same bargain every image in this deck makes.
 *
 * The reference's own constants are honoured where they can be. DWELL drives the
 * auto-tour on act 02. EASE is the curve throughout. STEP_VH, a scroll distance per
 * credential, has nothing to scrub: 0.8 viewports times forty-two is thirty-four
 * viewports of page scroll, and this deck is fixed 16:9 slides with no page scroll,
 * so the tour advances on the timer instead.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* From the reference JSX. */
const DWELL = 4200;

const ACTS = [
  { key: 'register', num: '01', name: 'The Register' },
  { key: 'skills', num: '02', name: 'Skills Unlocked' },
  { key: 'gallery', num: '03', name: 'The Gallery' },
];

const nf = (n) => Number(n || 0).toLocaleString('en-US');
const initials = (s) => String(s || '?').replace(/[^A-Za-z ]/g, '').trim().slice(0, 2).toUpperCase() || '?';

/* A stable pseudo-random from a string. The constellation has to land in the same
   place on every render — Math.random would reshuffle the field each time the act
   is opened, and a composition that moves is one nobody trusts. */
function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return ((x >>> 0) % 10000) / 10000;
}

/**
 * Scatter the badges around the edge, clear of the middle.
 *
 * The reference composition is an arc opening across the top and falling down both
 * flanks, with the type in the clear space it leaves. A badge's angle comes from
 * its position in the list and its distance from a per-badge hash, so the
 * arrangement is deterministic — and the centre band is simply never used.
 */
function constellation(items) {
  const n = items.length;
  return items.map((it, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    // 196° to 344° sweeps the top and both sides; the gap at the bottom is the type.
    const angle = (196 + t * 148) * (Math.PI / 180);
    const jitter = hash(it.name);
    /* Percentage radii, kept well inside the box — wider than this and the badges
       on the flanks are sliced off by the panel edge, which reads as a bug. */
    const rx = 36 + jitter * 8;
    const ry = 27 + hash(it.vendor) * 9;
    return {
      ...it,
      left: 50 + Math.cos(angle) * rx,
      top: 52 + Math.sin(angle) * ry,
      size: 34 + Math.round(jitter * 22),
      delay: Math.round(i * 34),
      depth: jitter,
    };
  });
}

export function CredentialRegister(block, { editing = false } = {}) {
  const credentials = (block.credentials || []).filter((c) => c.name);
  const root = h('div', { class: 'cr-root ph-root' });

  if (!credentials.length) {
    root.appendChild(h('div', { class: 'cr-empty' },
      h('h2', { class: 'cr-title' }, block.title || 'Credentials'),
      editing
        ? h('p', { class: 'cr-hint' },
            'Publish tools/data/certifications.json and it appears here.')
        : null,
    ));
    return root;
  }

  const earned = credentials.reduce((n, c) => n + (c.held || 0), 0);
  const bodies = new Set(credentials.map((c) => c.vendor)).size;
  const src = (p) => upload(String(p).split('/').map(encodeURIComponent).join('/'));

  let act = ACTS[0].key;

  const badgeNode = (c, cls) => (c.badge
    ? h('img', { class: cls, src: src(c.badge), alt: '', loading: 'lazy', decoding: 'async' })
    : h('em', { class: `${cls} is-type` }, initials(c.vendor)));

  /* ============================================================== 01 REGISTER */
  const regStage = h('div', { class: 'cr-reg' });

  function drawRegister() {
    const withBadge = credentials.filter((c) => c.badge);
    const placed = constellation(withBadge.length ? withBadge : credentials);

    regStage.replaceChildren(
      block.backdrop
        ? h('div', { class: 'cr-reg__back', 'aria-hidden': 'true' },
            h('img', { src: src(block.backdrop), alt: '', decoding: 'async' }))
        : null,
      h('div', { class: 'cr-sky', 'aria-hidden': 'true' },
        ...placed.map((p) => h('span', {
          class: 'cr-sky__b',
          title: p.name,
          style: {
            left: `${p.left}%`, top: `${p.top}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            /* Depth by opacity and blur, not size alone, so the arc reads as a
               field the eye can travel into rather than a flat ring. */
            opacity: String(0.42 + p.depth * 0.58),
            filter: p.depth < 0.28 ? 'blur(1.1px)' : 'none',
            'animation-delay': REDUCED?.matches ? '0ms' : `${p.delay}ms`,
          },
        }, badgeNode(p, 'cr-sky__img'))),
      ),
      h('div', { class: 'cr-reg__mid' },
        h('div', { class: 'cr-figs' },
          ...(block.stats?.length
            ? block.stats.map((f) => h('div', { class: 'cr-fig' },
                h('strong', {}, f.value), h('span', {}, f.label)))
            : [
                h('div', { class: 'cr-fig' },
                  h('strong', {}, nf(earned)), h('span', {}, 'certifications earned')),
                h('div', { class: 'cr-fig' },
                  h('strong', {}, nf(credentials.length)), h('span', {}, 'distinct credentials')),
                h('div', { class: 'cr-fig' },
                  h('strong', {}, nf(bodies)), h('span', {}, 'awarding bodies')),
              ]),
        ),
        block.quote
          ? h('blockquote', { class: 'cr-quote' },
              h('p', {}, `“${block.quote}”`),
              block.quoteBy ? h('cite', {}, block.quoteBy) : null)
          : null,
      ),
    );
  }

  /* ================================================================ 02 SKILLS */
  const list = h('div', { class: 'cr-list' });
  const pane = h('div', { class: 'cr-pane' });
  const ranked = [...credentials].sort((a, b) => b.held - a.held);
  let pick = 0;

  /* The auto-tour. Forty-two credentials at 4.2s is just under three minutes of
     unattended walk, which is the case it is for: a presenter leaves it running and
     talks over it rather than clicking forty-two times. Stopped the moment anyone
     picks a row by hand — a tour that fights the person driving is worse than none. */
  let touring = false;
  let timer = null;

  function stopTour() {
    touring = false;
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function tourStep() {
    if (!touring) return;
    pick = (pick + 1) % ranked.length;
    drawSkills();
    const row = list.querySelector('.cr-row.is-on');
    if (row) row.scrollIntoView({ block: 'nearest', behavior: REDUCED?.matches ? 'auto' : 'smooth' });
    timer = setTimeout(tourStep, DWELL);
  }

  function setTour(on) {
    stopTour();
    if (on && !REDUCED?.matches) {
      touring = true;
      timer = setTimeout(tourStep, DWELL);
    }
    drawSkills();
  }

  function drawSkills() {
    list.replaceChildren(...ranked.map((c, i) => h('button', {
      class: `cr-row${i === pick ? ' is-on' : ''}`,
      type: 'button',
      style: REDUCED?.matches ? {} : { '--i': String(Math.min(i, 30)) },
      onclick: () => { pick = i; stopTour(); drawSkills(); },
    },
      h('span', { class: 'cr-row__mark' }, badgeNode(c, 'cr-row__img')),
      h('span', { class: 'cr-row__text' },
        h('span', { class: 'cr-row__name' }, c.name),
        h('span', { class: 'cr-row__vendor' }, c.vendor)),
      h('span', { class: 'cr-row__held' }, nf(c.held)),
    )));

    const c = ranked[pick];
    if (!c) { pane.replaceChildren(); return; }
    pane.replaceChildren(
      h('div', { class: 'cr-pane__head' },
        h('span', { class: 'cr-pane__mark' }, badgeNode(c, 'cr-pane__img')),
        h('div', {},
          h('p', { class: 'cr-pane__vendor' }, `${c.vendor} · ${c.domain}`),
          h('h3', { class: 'cr-pane__name' }, c.name)),
      ),
      h('div', { class: 'cr-pane__count' },
        h('strong', {}, nf(c.held)),
        h('span', {}, c.held === 1 ? 'trainee holds it' : 'trainees hold it')),
      h('div', { class: 'cr-pane__bar' },
        h('p', { class: 'cr-pane__label' }, 'What it tests'),
        REDUCED?.matches ? null : h('button', {
          class: `cr-tour${touring ? ' is-on' : ''}`, type: 'button',
          'aria-pressed': String(touring),
          onclick: () => setTour(!touring),
        },
          h('span', {}, touring ? 'Touring' : 'Auto-tour'),
          /* The dwell, drawn. Rebuilt with each credential, so the bar restarts
             rather than carrying on from where the last one left it. */
          touring
            ? h('span', { class: 'cr-tour__run', style: { 'animation-duration': `${DWELL}ms` } })
            : null,
        ),
      ),
      h('ol', { class: 'cr-skills' },
        ...c.skills.map((sk, i) => h('li', {
          style: REDUCED?.matches ? {} : { '--i': String(i) },
        }, h('em', {}, String(i + 1).padStart(2, '0')), h('span', {}, sk))),
      ),
    );
  }

  /* =============================================================== 03 GALLERY */
  const gallery = h('div', { class: 'cr-gal' });

  function drawGallery() {
    /* By vendor, then by holders inside each vendor — a wall of forty-two badges
       in catalogue order is a wall nobody can find anything in. */
    const byVendor = [...credentials].sort((a, b) =>
      a.vendor.localeCompare(b.vendor, 'en') || b.held - a.held);
    gallery.replaceChildren(...byVendor.map((c, i) => h('figure', {
      class: 'cr-cell',
      style: REDUCED?.matches ? {} : { '--i': String(Math.min(i, 42)) },
      title: `${c.name} — ${nf(c.held)} hold it`,
    },
      h('span', { class: 'cr-cell__shot' }, badgeNode(c, 'cr-cell__img')),
      h('figcaption', {},
        h('span', { class: 'cr-cell__name' }, c.name),
        h('span', { class: 'cr-cell__meta' }, `${c.vendor} · ${nf(c.held)}`)),
    )));
  }

  /* =================================================================== chrome */
  const steps = h('nav', { class: 'cr-steps', role: 'tablist' });
  const acts = h('div', { class: 'cr-acts' });

  function drawSteps() {
    steps.replaceChildren(...ACTS.map((a) => h('button', {
      class: `cr-step${a.key === act ? ' is-on' : ''}`,
      type: 'button', role: 'tab', 'aria-selected': String(a.key === act),
      onclick: () => {
        if (a.key === act) return;
        act = a.key;
        // A tour running behind another act is a timer nobody can see.
        if (act !== 'skills') stopTour();
        drawSteps();
        acts.dataset.act = act;
        if (act === 'register') drawRegister();
        if (act === 'skills') drawSkills();
        if (act === 'gallery') drawGallery();
      },
    }, h('em', {}, a.num), h('span', {}, a.name))));
  }

  root.append(
    h('div', { class: 'cr-head' },
      h('div', {},
        block.eyebrow ? h('p', { class: 'cr-eyebrow' }, block.eyebrow) : null,
        h('h2', { class: 'cr-title' }, block.title || 'Credentials')),
      steps,
    ),
    acts,
  );
  acts.append(
    h('section', { class: 'cr-act cr-act--register' }, regStage),
    h('section', { class: 'cr-act cr-act--skills' },
      h('div', { class: 'cr-split' }, list, pane)),
    h('section', { class: 'cr-act cr-act--gallery' }, gallery),
  );
  acts.dataset.act = act;

  drawSteps();
  drawRegister();
  drawSkills();
  drawGallery();

  /* The tour is a timer on the document, so it has to be stopped by hand when the
     slide that owns it is replaced. */
  const watch = new MutationObserver(() => {
    if (!root.isConnected) { stopTour(); watch.disconnect(); }
  });
  watch.observe(document.body, { childList: true, subtree: true });

  return root;
}
