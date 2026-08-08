import { h, render } from '../utils/dom.js';
import { state, isAdmin } from '../context/appStore.js';
import { navigate } from '../utils/router.js';
import { applyTheme } from '../utils/theme.js';

/** Organization chooser shown straight after sign-in. */
export function OrgSelectPage(container, { onLogout }) {
  applyTheme(null);

  const card = (org) =>
    h(
      'button',
      {
        class: 'org-card',
        type: 'button',
        style: { background: org.theme.primary },
        onclick: () => navigate(`/o/${org.id}`),
      },
      h('span', { class: 'org-card__glow', style: { background: org.theme.accent } }),
      // A logo already carries the name, so the text line is the fallback.
      org.logo?.url
        ? h('img', { class: 'org-card__logo', src: org.logo.url, alt: `${org.name} logo` })
        : h('span', { class: 'org-card__name' }, org.name),
      h('span', { class: 'org-card__tag', style: { color: org.theme.accent } }, org.tagline || ''),
      h(
        'span',
        { class: 'org-card__meta' },
        h('span', {}, isAdmin() ? 'Manage & present' : 'Open presentation'),
        h('span', { class: 'org-card__cta' }, 'Open →'),
      ),
    );

  render(
    container,
    h(
      'div',
      { class: 'picker' },
      h(
        'div',
        { class: 'picker__head' },
        h('span', { class: 'badge' }, isAdmin() ? 'Admin session' : 'Presenter session'),
        h('h1', {}, 'Which organization are you presenting?'),
        h(
          'p',
          {},
          isAdmin()
            ? 'Each organization has its own content, brand theme and section order. Pick one to present or edit.'
            : 'Pick the organization to present. The deck opens read-only, ready for the projector.',
        ),
      ),
      h('div', { class: 'picker__grid' }, ...state.orgs.map(card)),
      h(
        'div',
        { style: { marginTop: '36px' } },
        h('button', { class: 'btn btn--ghost', onclick: onLogout }, 'Sign out'),
      ),
    ),
  );
}
