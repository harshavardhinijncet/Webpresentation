import { h, render } from '../utils/dom.js';
import { state, isAdmin } from '../context/appStore.js';
import { navigate } from '../utils/router.js';
import { applyTheme } from '../utils/theme.js';
import { media } from '../utils/media.js';

/**
 * The landing page: a dark hero that happens to be the organization chooser.
 *
 * It replaced a plain "which organization are you presenting?" form. The job is
 * the same — pick one of two — but this is the first thing anyone sees when the
 * link is opened, including a college, so it is built to be looked at rather
 * than filled in.
 *
 * The headline follows the reference's device: most of it set in a muted grey so
 * the eye passes over it, and the words that matter picked out in white with a
 * mark set inline beside each. Here the marks are the two organizations' own
 * logos, so the sentence names the choice and the choice is the sentence.
 *
 * Everything is CSS. The words rise in sequence on a stagger, the glow behind
 * each mark breathes on its own clock, and the cards lift last — all of it
 * declarative, all of it off under prefers-reduced-motion.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* Both brand accents light the page rather than either one owning it: this
   screen belongs to neither organization, and picking one would say otherwise
   before the presenter has chosen. */
const TORII_ACCENT = '#E95A22';
const HUB_ACCENT = '#FFBB00';

export function OrgSelectPage(container, { onLogout }) {
  // No org theme here — the chooser is upstream of that decision.
  applyTheme(null);

  const orgById = (id) => state.orgs.find((o) => o.id === id) || null;
  const torii = orgById('torii');
  const hub = orgById('technical-hub');

  /** A logo set into the headline, the way the reference sets its glyphs. */
  const inlineMark = (org, accent) => {
    if (!org) return null;
    const src = org.logo?.url ? media(org.logo.url) : '';
    return h('span', { class: 'lp-mark', style: { '--mark-glow': accent } },
      h('span', { class: 'lp-mark__halo' }),
      src
        ? h('img', { class: 'lp-mark__img', src, alt: '', loading: 'eager', decoding: 'async' })
        : h('span', { class: 'lp-mark__text' }, (org.name || '?').slice(0, 1)),
    );
  };

  /* The stagger is set per word rather than with nth-child, so a line can be
     reworded without the delays falling out of step with it. */
  let beat = 0;
  const word = (text, cls = '') => h('span', {
    class: `lp-word${cls ? ` ${cls}` : ''}`,
    style: REDUCED?.matches ? {} : { 'animation-delay': `${140 + (beat++) * 70}ms` },
  }, text);

  const card = (org, accent) => {
    if (!org) return null;
    return h('button', {
      class: 'lp-card',
      type: 'button',
      style: { '--card-ink': org.theme?.primary || '#111827', '--card-accent': accent },
      onclick: () => navigate(`/o/${org.id}`),
    },
      h('span', { class: 'lp-card__wash' }),
      org.logo?.url
        ? h('img', { class: 'lp-card__logo', src: media(org.logo.url), alt: `${org.name} logo` })
        : h('span', { class: 'lp-card__name' }, org.name),
      org.tagline ? h('span', { class: 'lp-card__tag' }, org.tagline) : null,
      h('span', { class: 'lp-card__foot' },
        h('span', {}, isAdmin() ? 'Manage & present' : 'Open presentation'),
        h('span', { class: 'lp-card__go' }, 'Open', h('i', {}, '→')),
      ),
    );
  };

  render(container, h('div', { class: 'lp' },
    // Two soft lights, one per organization, drifting on their own long cycles.
    h('span', { class: 'lp__aura lp__aura--a', 'aria-hidden': 'true' }),
    h('span', { class: 'lp__aura lp__aura--b', 'aria-hidden': 'true' }),

    h('div', { class: 'lp__inner' },
      h('span', { class: 'lp-badge' }, isAdmin() ? 'Admin session' : 'Presenter session'),

      h('h1', { class: 'lp-title' },
        word('The'), word('future'), word('of'), word('engineering'),
        /* The closing line is held together as one row. Left to wrap on its own
           it broke between "campus" and "+", stranding the sign at the end of a
           line and dropping "industry" beneath it — the pairing is the whole
           point of the sentence, so it may shrink but it may not split. */
        h('span', { class: 'lp-line' },
          word('is'),
          h('span', {
            class: 'lp-word lp-word--lit',
            style: REDUCED?.matches ? {} : { 'animation-delay': `${140 + (beat++) * 70}ms` },
          }, inlineMark(torii, TORII_ACCENT), 'campus'),
          word('+', 'lp-word--plus'),
          h('span', {
            class: 'lp-word lp-word--lit',
            style: REDUCED?.matches ? {} : { 'animation-delay': `${140 + (beat++) * 70}ms` },
          }, inlineMark(hub, HUB_ACCENT), 'industry'),
        ),
      ),

      h('p', { class: 'lp-sub' },
        isAdmin()
          ? 'Each organization carries its own content, brand and running order. Choose one to present or edit.'
          : 'Choose an organization. The deck opens read-only, ready for the projector.'),

      h('div', { class: 'lp-cards' }, card(torii, TORII_ACCENT), card(hub, HUB_ACCENT)),

      h('button', { class: 'lp-signout', type: 'button', onclick: onLogout }, 'Sign out'),
    ),
  ));
}
