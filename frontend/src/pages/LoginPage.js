import { h, render } from '../utils/dom.js';
import { state } from '../context/appStore.js';
import * as authService from '../services/authService.js';
import { navigate } from '../utils/router.js';
import { toastError } from '../components/Toast.js';

/** Role-aware sign-in. Admin lands on content control, presenter on the deck. */
export function LoginPage(container) {
  let role = 'admin';
  const hint = state.loginHint;

  const emailInput = h('input', {
    class: 'input',
    type: 'email',
    autocomplete: 'username',
    placeholder: 'you@organization.com',
    value: hint?.admin || '',
  });
  const passwordInput = h('input', {
    class: 'input',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: '••••••••',
    value: hint?.adminPassword || '',
  });
  const errorSlot = h('div', {});
  const submit = h('button', { class: 'btn btn--primary btn--block', type: 'submit' }, 'Sign in');

  const roleButton = (value, label, description) =>
    h(
      'button',
      {
        type: 'button',
        class: `role-toggle__btn${role === value ? ' is-active' : ''}`,
        title: description,
        onclick: () => {
          role = value;
          if (hint) {
            emailInput.value = value === 'admin' ? hint.admin : hint.presenter;
            passwordInput.value = value === 'admin' ? hint.adminPassword : hint.presenterPassword;
          }
          paint();
        },
      },
      label,
    );

  async function onSubmit(event) {
    event.preventDefault();
    render(errorSlot);
    submit.disabled = true;
    submit.textContent = 'Signing in…';
    try {
      const result = await authService.login(emailInput.value.trim(), passwordInput.value);
      state.user = result.user;
      navigate('/orgs');
    } catch (err) {
      render(errorSlot, h('p', { class: 'form-error' }, err.message));
      toastError(err.message);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Sign in';
    }
  }

  function paint() {
    render(
      container,
      h(
        'div',
        { class: 'login' },
        h(
          'div',
          { class: 'login__brand' },
          h(
            'div',
            {},
            h('div', { class: 'login__eyebrow' }, 'Organization Presentation Portal'),
            h(
              'h1',
              { class: 'login__headline' },
              'Two organizations. One projector-ready story.',
            ),
            h(
              'p',
              { class: 'login__sub' },
              'A live digital brochure for college and university partnerships — profile, programs, placements, centres of excellence and MOUs, presented section by section.',
            ),
          ),
          h(
            'div',
            { class: 'login__orgs' },
            h(
              'div',
              { class: 'login__org' },
              h(
                'span',
                { class: 'login__swatch', style: { background: '#000000', color: '#E95A22' } },
                'T',
              ),
              h(
                'span',
                {},
                h('div', { class: 'login__org-name' }, 'Torii'),
                h('div', { class: 'login__org-tag' }, 'Step in. Stand out.'),
              ),
            ),
            h(
              'div',
              { class: 'login__org' },
              h(
                'span',
                { class: 'login__swatch', style: { background: '#008638', color: '#FFBB00' } },
                'TH',
              ),
              h(
                'span',
                {},
                h('div', { class: 'login__org-name' }, 'Technical Hub'),
                h('div', { class: 'login__org-tag' }, 'Engineering depth, industry ready.'),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'login__panel' },
          h(
            'form',
            { class: 'login__card', onsubmit: onSubmit },
            h('h2', {}, 'Sign in'),
            h(
              'p',
              { class: 'login__hint-text' },
              'Choose how you are signing in. Admins manage content; presenters get a clean read-only deck.',
            ),
            h(
              'div',
              { class: 'role-toggle' },
              roleButton('admin', 'Admin', 'Add, edit, reorder and publish content'),
              roleButton('presenter', 'Presenter', 'Read-only presentation view'),
            ),
            errorSlot,
            h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Email'), emailInput),
            h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Password'), passwordInput),
            submit,
            hint
              ? h(
                  'div',
                  { class: 'login__creds' },
                  h('div', {}, 'Demo accounts (set SHOW_LOGIN_HINT=false to hide):'),
                  h(
                    'div',
                    { style: { marginTop: '6px' } },
                    'Admin ',
                    h('code', {}, hint.admin),
                    ' / ',
                    h('code', {}, hint.adminPassword),
                  ),
                  h(
                    'div',
                    { style: { marginTop: '4px' } },
                    'Presenter ',
                    h('code', {}, hint.presenter),
                    ' / ',
                    h('code', {}, hint.presenterPassword),
                  ),
                )
              : null,
          ),
        ),
      ),
    );
  }

  paint();
}
