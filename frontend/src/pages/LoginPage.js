import { h, render } from '../utils/dom.js';
import { state } from '../context/appStore.js';
import * as authService from '../services/authService.js';
import { navigate } from '../utils/router.js';
import { toastError } from '../components/Toast.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';

/**
 * Login: one white field. Three green semicircles rise from the left edge, top-left corner to
 * bottom-left corner, turning slowly with the marks of the technologies Technical Hub works with;
 * the message sits to their right and the sign-in card to the right of that, a gold light running
 * round its edge. On load every element arrives in turn — rings, marks, words, card — and settles.
 */
export function LoginPage(container) {
  let role = 'admin';
  let showPassword = false;

  const hint = state.loginHint;
  const adminEmail = hint?.admin || 'admin@org.local';
  const adminPass = hint?.adminPassword || 'Admin@123';
  const presEmail = hint?.presenter || 'presenter@org.local';
  const presPass = hint?.presenterPassword || 'Present@123';

  const emailInput = h('input', {
    class: 'input login-input',
    type: 'email',
    autocomplete: 'username',
    placeholder: 'admin@org.local',
    value: adminEmail,
    required: true,
  });

  const passwordInput = h('input', {
    class: 'input login-input',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: '••••••••',
    value: adminPass,
    required: true,
  });

  const errorSlot = h('div', { class: 'login__error-slot' });

  const submit = h(
    'button',
    { class: 'btn btn--primary btn--block login-submit', type: 'submit' },
    h('span', { class: 'login-submit__text' }, 'Sign in to Portal'),
    icon('arrow-right', { class: 'ic ic--xs' }),
  );

  function selectRole(value) {
    role = value;
    if (value === 'admin') {
      emailInput.value = adminEmail;
      passwordInput.value = adminPass;
    } else {
      emailInput.value = presEmail;
      passwordInput.value = presPass;
    }
    // only the toggle changes; repainting the page would restart the turning rings
    container.querySelectorAll('.role-toggle__btn').forEach((btn, i) => btn.classList.toggle('is-active', (i === 0) === (value === 'admin')));
  }

  const roleButton = (value, label, description) =>
    h(
      'button',
      {
        type: 'button',
        class: `role-toggle__btn${role === value ? ' is-active' : ''}`,
        title: description,
        onclick: () => selectRole(value),
      },
      label,
    );

  const togglePasswordBtn = h(
    'button',
    {
      type: 'button',
      class: 'login__toggle-pass',
      title: 'Show or hide password',
      onclick: () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = showPassword ? 'Hide' : 'Show';
      },
    },
    'Show',
  );

  async function onSubmit(event) {
    event.preventDefault();
    render(errorSlot);
    submit.disabled = true;
    const textNode = submit.querySelector('.login-submit__text');
    if (textNode) textNode.textContent = 'Signing in…';

    try {
      const result = await authService.login(emailInput.value.trim(), passwordInput.value);
      state.user = result.user;
      navigate('/orgs');
    } catch (err) {
      render(
        errorSlot,
        h(
          'div',
          { class: 'form-error login-error' },
          icon('mail-edit', { class: 'ic ic--xs' }),
          h('span', {}, err.message),
        ),
      );
      toastError(err.message);
    } finally {
      submit.disabled = false;
      if (textNode) textNode.textContent = 'Sign in to Portal';
    }
  }

  /* Three rings centred on the left edge of the screen, so only their right halves show: the outer
     one runs from the top-left corner to the bottom-left. Each turns slowly carrying marks; a chip
     counter-turns at its ring's pace, so every logo stays upright as it travels. */
  const ORBIT = [
    { dur: 70, reverse: false, marks: ['claude-mark.svg', 'openai-mark.webp', 'sarvam-mark.png', 'vendor-github.png'] },
    { dur: 95, reverse: true, marks: ['vendor-aws.png', 'vendor-microsoft.png', 'vendor-gcp.png', 'vendor-oracle.png', 'vendor-redhat.png'] },
    { dur: 120, reverse: false, marks: ['vendor-cisco.png', 'vendor-pega.png', 'vendor-servicenow.png', 'vendor-snowflake.png', 'vendor-mongodb.png', 'vendor-aa.png'] },
  ];
  const CHIP = [50, 54, 58];
  const chipAngle = (ring, r, i) => (360 / ring.marks.length) * i + r * 25;
  /* The line breaks where a mark sits: one transparent hole per mark in the line's mask. The
     mask turns with the ring, so each hole stays under its mark. */
  const cut = (ring, r) =>
    ring.marks
      .map((_, i) => {
        const a = (chipAngle(ring, r, i) * Math.PI) / 180;
        const x = (50 + 50 * Math.cos(a)).toFixed(3);
        const y = (50 + 50 * Math.sin(a)).toFixed(3);
        const hole = Math.round(CHIP[r] * 0.5 + 6);
        return `radial-gradient(circle at ${x}% ${y}%, transparent ${hole}px, #000 ${hole + 1}px)`;
      })
      .join(', ');
  const orbit = () =>
    h(
      'div',
      { class: 'login__orbit', 'aria-hidden': 'true' },
      ...ORBIT.map((ring, r) =>
        h(
          'div',
          { class: `login__ring login__ring--${r + 1}${ring.reverse ? ' is-reverse' : ''}`, style: { '--dur': `${ring.dur}s`, '--in': `${0.1 + r * 0.18}s`, '--cut': cut(ring, r) } },
          // a few dots ride the line, each midway between two marks, alternately gold
          ...Array.from({ length: 2 + (r > 0 ? 1 : 0) }, (_, k) => {
            const gap = Math.floor((k * ring.marks.length) / (2 + (r > 0 ? 1 : 0)));
            return h('span', { class: `login__dot${(k + r) % 2 ? ' is-gold' : ''}`, style: { '--a': `${chipAngle(ring, r, gap) + 180 / ring.marks.length}deg`, '--in': `${0.5 + r * 0.18 + k * 0.08}s` } });
          }),
          ...ring.marks.map((file, i) =>
            h(
              'span',
              { class: 'login__chip', style: { '--a': `${chipAngle(ring, r, i)}deg`, '--in': `${0.75 + r * 0.15 + i * 0.07}s`, '--tilt': `${((i * 7 + r * 3) % 13) - 6}deg` } },
              h('span', { class: 'login__chip-face' }, h('img', { src: media(`/uploads/login-orbit/${file}`), alt: '', draggable: 'false' })),
            ),
          ),
        ),
      ),
      // two points of light between the rings, each twinkling on its own beat
      ...SPARKS.map(([x, y, beat]) => h('span', { class: 'login__spark', style: { left: x, top: y, '--beat': `${beat}s` } })),
      // a soft glow where the rings meet the edge
      h('span', { class: 'login__core' }),
    );
  const SPARKS = [['27vh', '9vh', 4.1], ['44vh', '66vh', 3.9]];

  function paint() {
    render(
      container,
      h(
        'div',
        { class: 'login' },

        // the semicircles and their marks, behind everything
        orbit(),

        /* --- Left Side: Editorial Presentation Copy & Real Logos --- */
        h(
          'div',
          { class: 'login__brand' },

          // Main editorial copy requested by user
          h(
            'div',
            { class: 'login__copy' },
            h(
              'h1',
              { class: 'login__headline' },
              ...['We', 'Build', 'Strategy', 'That Works'].map((word, i) =>
                h('span', { class: `login__line${i === 2 ? ' login__line--accent' : ''}` },
                  h('span', { class: 'login__line-in', style: { '--in': `${0.5 + i * 0.12}s` } }, word)),
              ),
            ),
            h('p', { class: 'login__sub login-in', style: { '--in': '1.0s' } }, 'We Design · We Develop · We Brand · We Train.'),
            // the two organisations' full logos, bare, under the tagline
            h(
              'div',
              { class: 'login__orgs' },
              h('img', { class: 'login__org-logo login__org-logo--th login-in', style: { '--in': '1.15s' }, src: media('/uploads/login-orbit/technical-hub-logo.png'), alt: 'Technical Hub', draggable: 'false' }),
              h('span', { class: 'login__orgs-rule login-in', style: { '--in': '1.2s' }, 'aria-hidden': 'true' }),
              h('img', { class: 'login__org-logo login__org-logo--torii login-in', style: { '--in': '1.25s' }, src: media('/uploads/stories-published/torii/torii-logo.png'), alt: 'Torii', draggable: 'false' }),
            ),
          ),
        ),

        /* --- Right Side: Light-Theme Authentication Form --- */
        h(
          'div',
          { class: 'login__panel' },
          h(
            'div',
            { class: 'login__card' },
            h('span', {
              class: 'login__card-edge',
              'aria-hidden': 'true',
              html: '<svg><rect class="edge-draw" pathLength="1000" /><rect class="edge-run edge-run--gold" pathLength="1000" /><rect class="edge-run edge-run--green" pathLength="1000" /></svg>',
            }),

            h(
              'div',
              { class: 'login__card-header login-in', style: { '--in': '0.85s' } },
              h(
                'div',
                { class: 'login__auth-badge' },
                h('span', { class: 'login__auth-dot' }),
                'Portal Access',
              ),
              h('h2', {}, 'Sign In'),
              h(
                'p',
                { class: 'login__hint-text' },
                'Choose your role to access presentation decks or content management.',
              ),
            ),

            // Role toggle buttons
            h(
              'div',
              { class: 'role-toggle login-in', style: { '--in': '0.97s' } },
              roleButton('admin', 'Admin', 'Manage, edit & publish content'),
              roleButton('presenter', 'Presenter', 'Read-only presentation mode'),
            ),

            // Form inputs
            h(
              'form',
              { class: 'login__form login-in', style: { '--in': '1.09s' }, onsubmit: onSubmit },
              errorSlot,
              h(
                'label',
                { class: 'field' },
                h('span', { class: 'field__label' }, 'Email Address'),
                emailInput,
              ),
              h(
                'label',
                { class: 'field' },
                h('span', { class: 'field__label' }, 'Password'),
                h(
                  'div',
                  { class: 'password-input-wrap' },
                  passwordInput,
                  togglePasswordBtn,
                ),
              ),
              submit,
            ),

            h(
              'div',
              { class: 'login__footer-info login-in', style: { '--in': '1.25s' } },
              'Offline-ready presentation portal · All assets served locally',
            ),
          ),
        ),
      ),
    );
  }

  paint();
}
