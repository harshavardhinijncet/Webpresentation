import { h, render } from '../utils/dom.js';
import { state, isAdmin } from '../context/appStore.js';
import { icon } from '../utils/icons.js';
import { navigate } from '../utils/router.js';
import { applyTheme } from '../utils/theme.js';
import { media } from '../utils/media.js';

/**
 * The landing page — the first thing anyone opening the link sees.
 *
 * Two references, combined. The headline is the dark hero's device: most of the
 * line set in a muted grey the eye passes over, and the two words that carry the
 * idea picked out in ink with a lit glyph beside each. Everything around it is
 * the white-base hero: a field of real partner marks drifting on faint orbits,
 * a single primary action, and the rest of the partners named along the foot.
 *
 * The marks are the twenty Centers of Excellence partners, which are already in
 * the repository as artwork. Nothing here is a placeholder logo and nothing is
 * drawn — a mark on this page is a partner the deck can evidence.
 *
 * All of it is CSS. The orbits drift, the glyph halos breathe, the words rise on
 * a stagger, and the foot marquee runs on one long loop; nothing runs per frame
 * and everything stops under prefers-reduced-motion.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* The partner marks, straight from backend/uploads/coe. Twelve ride the orbits
   and the rest fill the foot, so the same set does both jobs. */
const PARTNERS = [
  { name: 'AWS Academy', file: 'aws.png' },
  { name: 'Google Cloud', file: 'google.webp' },
  { name: 'Microsoft', file: 'microsoft.webp' },
  { name: 'GitHub', file: 'github.png' },
  { name: 'Cisco', file: 'cisco.webp' },
  { name: 'MongoDB', file: 'mongo.webp' },
  { name: 'Claude', file: 'claude.webp' },
  { name: 'ServiceNow', file: 'servicenow.png' },
  { name: 'Red Hat', file: 'redhat.png' },
  { name: 'Oracle Academy', file: 'oracle.png' },
  { name: 'Snowflake', file: 'snowflake.png' },
  { name: 'Pega', file: 'pega.png' },
  { name: 'HubSpot', file: 'hubspot.png' },
  { name: 'Splunk', file: 'splunk.png' },
  { name: 'Palo Alto', file: 'paloalto.png' },
  { name: 'Automation Anywhere', file: 'automation anywhere.png' },
  { name: 'Cadence', file: 'cadence.png' },
  { name: 'OpenAI', file: 'openai.webp' },
];

/* Where each orbiting mark sits: which ring, and how far round it.
 * 18 partners distributed across 3 concentric revolving orbits.
 * Radii are sized to ensure marks revolve smoothly without ever touching
 * the central headline, badge, copy, or action buttons.
 */
const ORBIT = [
  // Ring 1 (6 partners, spaced 60°)
  { i: 0, ring: 1, deg: 30 },
  { i: 1, ring: 1, deg: 90 },
  { i: 2, ring: 1, deg: 150 },
  { i: 3, ring: 1, deg: 210 },
  { i: 4, ring: 1, deg: 270 },
  { i: 5, ring: 1, deg: 330 },

  // Ring 2 (6 partners, spaced 60°, staggered by 30°)
  { i: 6, ring: 2, deg: 0 },
  { i: 7, ring: 2, deg: 60 },
  { i: 8, ring: 2, deg: 120 },
  { i: 9, ring: 2, deg: 180 },
  { i: 10, ring: 2, deg: 240 },
  { i: 11, ring: 2, deg: 300 },

  // Ring 3 (6 partners, spaced 60°, staggered by 15°)
  { i: 12, ring: 3, deg: 15 },
  { i: 13, ring: 3, deg: 75 },
  { i: 14, ring: 3, deg: 135 },
  { i: 15, ring: 3, deg: 195 },
  { i: 16, ring: 3, deg: 255 },
  { i: 17, ring: 3, deg: 315 },
];

export function OrgSelectPage(container, { onLogout }) {
  // No org theme: the page carries Technical Hub's palette directly.
  applyTheme(null);

  const hub = state.orgs.find((o) => o.id === 'technical-hub') || state.orgs[0] || null;

  const partnerSrc = (file) => media(`/uploads/coe/${encodeURIComponent(file)}`);

  /* A mark on an orbit. The ring and angle are CSS custom properties.
     The outer track revolves, while the inner span counter-rotates so logos
     stay upright and crisp at every second of the revolution. */
  const orbitMark = ({ i, ring, deg }) => {
    const p = PARTNERS[i];
    if (!p) return null;
    return h('span', {
      class: `lp-orb lp-orb--r${ring}`,
      style: {
        '--deg': `${deg}deg`,
      },
      title: p.name,
    },
      h('span', { class: 'lp-orb__inner' },
        h('img', {
          src: partnerSrc(p.file),
          alt: p.name,
          loading: 'lazy',
          decoding: 'async',
          onerror: (e) => e.currentTarget.closest('.lp-orb')?.remove(),
        }),
      ),
    );
  };

  /* The stagger is set per word in script, so the line can be reworded without
     the delays falling out of step with it. */
  let beat = 0;
  const nextDelay = () => (REDUCED?.matches ? {} : { 'animation-delay': `${160 + (beat++) * 75}ms` });
  const word = (text, cls = '') => h('span', { class: `lp-word${cls ? ` ${cls}` : ''}`, style: nextDelay() }, text);
  const lit = (glyph, text, tone) => h('span', {
    class: 'lp-word lp-word--lit', style: nextDelay(),
  },
    h('span', { class: `lp-glyph lp-glyph--${tone}` },
      h('span', { class: 'lp-glyph__halo' }),
      icon(glyph, { class: 'ic' }),
    ),
    text,
  );

  render(container, h('div', { class: 'lp' },
    // The revolving orbits, and the marks riding them
    h('div', { class: 'lp__field', 'aria-hidden': 'true' },
      h('div', { class: 'lp__orbit-track lp__orbit-track--1' },
        h('span', { class: 'lp__ring lp__ring--1' }),
        ...ORBIT.filter((o) => o.ring === 1).map(orbitMark),
      ),
      h('div', { class: 'lp__orbit-track lp__orbit-track--2' },
        h('span', { class: 'lp__ring lp__ring--2' }),
        ...ORBIT.filter((o) => o.ring === 2).map(orbitMark),
      ),
      h('div', { class: 'lp__orbit-track lp__orbit-track--3' },
        h('span', { class: 'lp__ring lp__ring--3' }),
        ...ORBIT.filter((o) => o.ring === 3).map(orbitMark),
      ),
    ),

    h('div', { class: 'lp__inner' },
      h('span', { class: 'lp-badge' },
        h('i', { class: 'lp-badge__dot' }),
        isAdmin() ? 'Admin session' : 'Presenter session'),

      h('h1', { class: 'lp-title' },
        word('The'), word('future'), word('of'), word('education'),
        /* Held on one row: left to wrap it broke between "human" and "+",
           stranding the sign and dropping "AI" beneath it. The pairing is the
           point of the sentence, so it may shrink but it may not split. */
        h('span', { class: 'lp-line' },
          word('is'),
          lit('fingerprint', 'human', 'green'),
          word('+', 'lp-word--plus'),
          lit('spark', 'AI', 'gold'),
        ),
      ),

      h('p', { class: 'lp-sub' },
        'We map the skills industry is hiring for, train them on the products '
        + 'themselves, and walk students from a first class to a first offer.'),

      h('div', { class: 'lp-actions' },
        h('button', {
          class: 'lp-cta',
          type: 'button',
          onclick: () => (hub ? navigate(`/o/${hub.id}`) : null),
        }, isAdmin() ? 'Open the deck' : 'Start the presentation',
          icon('arrow-right', { class: 'ic ic--xs' })),
        /* The University Technology Engine (the Engineer Roadmap) - icon removed per user request */
        h('a', { class: 'lp-cta lp-cta--outline', href: '/roadmap' },
          'University Technology Engine'),
        h('button', { class: 'lp-ghost', type: 'button', onclick: onLogout }, 'Sign out'),
      ),
    ),

  ));
}
