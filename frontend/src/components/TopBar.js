import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { isAdmin } from '../context/appStore.js';

/** Breadcrumbs plus the contextual actions for the current view. Home, first, returns to the
 *  landing page (the organisation choice) the presenter signed in to. */
export function TopBar({ org, section, actions = [], crumbTail }) {
  return h(
    'header',
    { class: 'topbar' },
    h('a', { class: 'topbar__home', href: '#/orgs', title: 'Back to the landing page' }, icon('home', { size: 17 }), h('span', {}, 'Home')),
    h(
      'div',
      { class: 'topbar__crumbs' },
      h('span', {}, org?.name || 'Organization'),
      h('span', {}, '›'),
      h('strong', {}, crumbTail || section?.title || ''),
      isAdmin()
        ? h('span', { class: 'badge badge--accent' }, 'Admin')
        : h('span', { class: 'badge badge--live' }, 'Presenting'),
    ),
    h('div', { class: 'topbar__spacer' }),
    h('div', { class: 'topbar__actions' }, ...actions.filter(Boolean)),
  );
}
