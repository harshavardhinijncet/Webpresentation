import { h } from '../utils/dom.js';
import { inlineRich } from '../utils/format.js';
import { videoControls } from '../utils/videoControls.js';
import { ButtonRow } from './Elements.js';

/**
 * Hero: a full-bleed background (image, video or brand fill) with the headline
 * stack on top. Height, alignment and overlay strength are the admin's choices;
 * everything else — type scale, gradient, safe padding — is decided here so a
 * hero can never end up unreadable over a busy photo.
 */
export function HeroBox(block, { editing = false } = {}) {
  const media = block.media || 'color';
  const overlay = Math.min(90, Math.max(0, Number(block.overlay ?? 45))) / 100;

  const background = [];
  if (media === 'image' && block.asset?.url) {
    background.push(
      h('img', {
        class: 'hero__media',
        src: block.asset.url,
        alt: block.alt || '',
        loading: 'lazy',
      }),
    );
  } else if (media === 'video') {
    const usingLink = block.source === 'url';
    const fileUrl = usingLink ? (block.link?.kind === 'file' ? block.link.playbackUrl : null) : block.asset?.url;
    if (fileUrl) {
      const heroVideo = h('video', {
        class: 'hero__media',
        src: fileUrl,
        autoplay: true,
        muted: true,
        loop: true,
        playsinline: true,
        // Autoplay only sticks when the element is muted before it loads.
        oncanplay: (event) => {
          event.target.muted = true;
          event.target.play?.().catch(() => {});
        },
      });
      /* The film is a backdrop behind the headline, so its controls go in their
         own layer above it — the element itself sits under the copy and could
         never be hovered. */
      background.push(heroVideo, h('div', { class: 'hero__vc' }, videoControls(heroVideo)));
    } else if (usingLink && block.link?.embedUrl) {
      const sep = block.link.embedUrl.includes('?') ? '&' : '?';
      /* enablejsapi is what lets the hover controls reach the frame: without it
         every command posted to it is ignored and the buttons do nothing. */
      const embedSrc = `${block.link.embedUrl}${sep}autoplay=1&mute=1&loop=1&controls=0`
        + '&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1';
      const heroFrame = h('iframe', {
        class: 'hero__media hero__media--embed',
        src: embedSrc,
        title: block.heading || 'Background video',
        allow: 'autoplay; encrypted-media; picture-in-picture',
        frameborder: '0',
        tabindex: '-1',
        style: { pointerEvents: 'none' },
      });
      background.push(heroFrame, h('div', { class: 'hero__vc' }, videoControls(heroFrame)));
    }
  }

  const hasBackdrop = background.length > 0;

  const content = h(
    'div',
    { class: 'hero__content' },
    block.kicker ? h('div', { class: 'hero__kicker', html: inlineRich(block.kicker) }) : null,
    block.heading ? h('h2', { class: 'hero__heading', html: inlineRich(block.heading) }) : null,
    block.subheading
      ? h('p', { class: 'hero__subheading', html: inlineRich(block.subheading) })
      : null,
    block.buttons?.length
      ? ButtonRow(block.buttons, { align: block.align || 'left', editing })
      : null,
    !block.heading && !block.subheading && !block.kicker && editing
      ? h('p', { class: 'hero__subheading media-empty__hint' }, 'Empty hero — use Edit to add a headline.')
      : null,
  );

  return h(
    'div',
    {
      class: [
        'hero',
        `hero--${block.height || 'md'}`,
        `hero--${block.align || 'left'}`,
        hasBackdrop ? 'hero--media' : 'hero--plain',
        editing ? 'hero--editing' : '',
      ].filter(Boolean).join(' '),
    },
    ...background,
    hasBackdrop ? h('div', { class: 'hero__scrim', style: { opacity: String(overlay) } }) : null,
    content,
    editing && media !== 'color' && !hasBackdrop
      ? h('span', { class: 'hero__hint' }, media === 'image' ? 'No background image yet' : 'No background video yet')
      : null,
    editing && block.linkError ? h('p', { class: 'media-note' }, block.linkError) : null,
  );
}
