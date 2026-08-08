import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { toastSuccess, toastError } from './Toast.js';

/**
 * The platform wall: a card per product, and opening one runs it inside the
 * slide rather than in another tab.
 *
 * What this deliberately does not do is log you in. The credentials sit beside
 * the frame with a copy button each, and you paste them into the platform's own
 * form. Filling that form from here is not a feature that was skipped — the
 * browser forbids it outright: a page may not touch the DOM of a frame from
 * another origin, and every one of these platforms is another origin. No
 * library or setting changes that; it is the same rule that stops any site
 * reading your bank's login form.
 *
 * What is worth having is everything around it. The platform loads in the
 * slide, so the room never watches a tab switch, and the credentials are one
 * click from the clipboard instead of a hunt through a document.
 */

async function copy(value, label) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      // execCommand is deprecated but is the only route without a secure
      // context, and a deck is sometimes served over plain http on a LAN.
      const scratch = h('textarea', { style: { position: 'fixed', opacity: '0' } }, value);
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      scratch.remove();
    }
    toastSuccess(`${label} copied`);
  } catch {
    toastError(`Could not copy the ${label.toLowerCase()}`);
  }
}

/** A value with a copy button — the whole row is the button. */
function credentialRow(label, value) {
  if (!value) return null;
  return h('button', {
    class: 'pf-cred',
    type: 'button',
    title: `Copy the ${label.toLowerCase()}`,
    onclick: (event) => { event.stopPropagation(); copy(value, label); },
  },
    h('span', { class: 'pf-cred__label' }, label),
    h('span', { class: 'pf-cred__value' }, value),
    icon('copy', { class: 'ic ic--xs pf-cred__mark' }),
  );
}

export function Platforms(block, { editing = false } = {}) {
  const items = (block.items || []).filter((p) => p.name && p.url);
  if (!items.length) {
    return h('div', { class: 'pf-root pf-root--empty ph-root' }, 'No platforms yet.');
  }

  const root = h('div', { class: 'pf-root ph-root' });

  /* ------------------------------------------------------------- the frame */
  const frameTitle = h('span', { class: 'pf-stage__name' });
  const frameUrl = h('span', { class: 'pf-stage__url' });
  const rail = h('div', { class: 'pf-stage__rail' });
  const frame = h('iframe', {
    class: 'pf-stage__frame',
    title: 'Platform',
    // The platform is another origin; this is a window onto it, not a page we
    // script. allow-same-origin is required or its own login cannot set a
    // cookie and nothing will ever sign in.
    sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation',
    referrerpolicy: 'no-referrer-when-downgrade',
  });

  const close = () => {
    root.classList.remove('is-open');
    frame.removeAttribute('src');
  };

  const stage = h('div', { class: 'pf-stage' },
    h('div', { class: 'pf-stage__bar' },
      h('button', { class: 'pf-stage__back', type: 'button', onclick: close },
        icon('chevron-left', { class: 'ic ic--xs' }), ' All platforms'),
      h('div', { class: 'pf-stage__id' }, frameTitle, frameUrl),
      h('a', {
        class: 'pf-stage__out', target: '_blank', rel: 'noopener noreferrer',
        title: 'Open in a new tab if the platform refuses to run in a frame',
      }, icon('arrow-up-right', { class: 'ic ic--xs' })),
    ),
    h('div', { class: 'pf-stage__body' }, frame, rail),
  );

  const open = (item, loginUrl) => {
    const url = loginUrl || item.url;
    frameTitle.textContent = item.name;
    frameUrl.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    stage.querySelector('.pf-stage__out').setAttribute('href', url);

    rail.replaceChildren(
      h('p', { class: 'pf-rail__head' }, 'Sign in with'),
      ...item.logins.flatMap((login) => [
        h('div', { class: 'pf-rail__role' },
          login.role || 'Login',
          login.url && login.url !== url
            ? h('button', { class: 'pf-rail__jump', type: 'button', title: 'Open this login page',
                onclick: () => { frame.src = login.url; stage.querySelector('.pf-stage__out').setAttribute('href', login.url); } }, 'go')
            : null,
        ),
        credentialRow('Username', login.user),
        credentialRow('Password', login.pass),
      ]),
      /* Said plainly rather than left as a mystery: some platforms decline to
         run in a frame, and third-party cookie blocking can stop a sign-in
         inside one even when the page loads. */
      h('p', { class: 'pf-rail__note' },
        'Copy, then paste into the platform. If it will not load or sign in here, use ',
        h('span', {}, 'open in new tab'), ' at the top right.'),
    );

    frame.src = url;
    root.classList.add('is-open');
  };

  /* -------------------------------------------------------------- the cards */
  const cards = items.map((item) => h('button', {
    class: 'pf-card',
    type: 'button',
    onclick: () => open(item),
  },
    h('span', { class: 'pf-card__mark' }, icon(item.icon || 'grid-4', { class: 'ic' })),
    h('span', { class: 'pf-card__name' }, item.name),
    item.blurb ? h('span', { class: 'pf-card__blurb' }, item.blurb) : null,
    h('span', { class: 'pf-card__host' }, item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')),
    h('span', { class: 'pf-card__count' },
      `${item.logins.length} login${item.logins.length === 1 ? '' : 's'}`),
  ));

  root.appendChild(h('div', { class: 'pf-wall' },
    h('div', { class: 'pf-head' },
      block.eyebrow ? h('p', { class: 'pf-eyebrow' }, block.eyebrow) : null,
      block.title ? h('h2', { class: 'pf-title' }, block.title) : null,
      block.subtitle ? h('p', { class: 'pf-sub' }, block.subtitle) : null,
    ),
    h('div', { class: 'pf-grid' }, ...cards),
  ));
  root.appendChild(stage);

  return root;
}
