import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { filmStage, posterImg, bindStageLifetime } from '../utils/filmStage.js';

/**
 * Video Resumes: a hundred and sixteen students, each one a film.
 *
 * The point of the section is that a visiting college can pick any name and watch
 * that student present themselves, so two things matter more than anything else on
 * the page: finding a name quickly, and the film filling the display once it
 * starts. Hence a search box and an initial strip above the wall, and a stage
 * portalled to the body rather than a player boxed into the layout.
 *
 * Names are the content, not decoration. A poster is attempted for each card, but
 * it comes from i.ytimg.com and there is no network at presentation time, so every
 * card has to read with the image gone — which is why the plate carries the
 * student's initials in type underneath. Nothing here depends on a thumbnail
 * arriving.
 *
 * The arrows in the stage walk whatever the wall is currently showing. Filter to
 * the letter S and the arrows step through the S names, which is what a presenter
 * asked a question about one student actually wants.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* A name is a person's name: it gets title case for display, never for matching.
   The workbook has "jitesh Kumar" and "sireesha" in it. */
const titleCase = (s) => String(s || '')
  .split(/\s+/)
  .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
  .join(' ');

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length === 1
    ? parts[0].slice(0, 2)
    : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function VideoResumes(block, { editing = false } = {}) {
  const people = (block.people || [])
    .filter((p) => p.name && (p.youtube || p.src))
    .map((p) => ({ ...p, display: titleCase(p.name) }));
  const root = h('div', { class: 'vr-root ph-root' });

  if (!people.length) {
    root.appendChild(h('div', { class: 'vr-empty' },
      h('h2', { class: 'vr-title' }, block.title || 'Video Resumes'),
      editing
        ? h('p', { class: 'vr-hint' },
            'Publish the list from backend/uploads/Video Resumes.xlsx and it appears here.')
        : null,
    ));
    return root;
  }

  /* Sorted by name, because a wall of a hundred and sixteen people in workbook
     order is a wall nobody can find anybody in. */
  const sorted = [...people].sort((a, b) => a.display.localeCompare(b.display, 'en'));
  const letters = [...new Set(sorted.map((p) => p.display[0].toUpperCase()))].sort();

  let letter = null;      // null is every name
  let term = '';

  const stage = filmStage({ label: 'Video resume' });

  const shown = () => sorted.filter((p) => {
    if (letter && p.display[0].toUpperCase() !== letter) return false;
    if (term && !p.display.toLowerCase().includes(term)) return false;
    return true;
  });

  /* --------------------------------------------------------------- the wall */
  const wall = h('div', { class: 'vr-wall' });
  const note = h('p', { class: 'vr-note' });

  function drawWall() {
    const list = shown();
    wall.textContent = '';
    wall.scrollTop = 0;

    /* Filtered before it goes in: `replaceChildren` turns a null into the literal
       text "null", where the `h` helper drops it. The count line read
       "116 students null" until this was filtered. */
    note.replaceChildren(...[
      h('strong', {}, String(list.length)),
      h('span', {}, list.length === 1 ? ' student' : ' students'),
      letter || term ? h('button', {
        class: 'vr-note__clear', type: 'button',
        onclick: () => { letter = null; term = ''; search.value = ''; drawStrip(); drawWall(); },
      }, icon('close', { class: 'ic ic--xs' }), 'Show all') : null,
    ].filter(Boolean));

    if (!list.length) {
      wall.appendChild(h('p', { class: 'vr-none' }, 'No student matches that.'));
      return;
    }

    list.forEach((p, i) => {
      const shot = h('span', { class: 'vr-card__shot' },
        posterImg(p.youtube, { eager: i < 18 }),
        /* Under the poster, not instead of it: this is what the card falls back to
           when the thumbnail host is unreachable, which is every presentation. */
        h('span', { class: 'vr-card__mono', 'aria-hidden': 'true' }, initialsOf(p.display)),
        h('span', { class: 'vr-card__play', 'aria-hidden': 'true' },
          icon('play', { class: 'ic ic--sm' })),
      );
      const card = h('button', {
        class: 'vr-card', type: 'button',
        title: `Play ${p.display}`,
        style: REDUCED?.matches ? {} : { '--i': String(Math.min(i, 30)) },
        // The arrows walk what the wall is showing, so the index is into `list`.
        onclick: () => stage.open(list.map((q) => ({
          youtube: q.youtube, src: q.src, title: q.display, sub: 'Video resume',
        })), i),
      },
        shot,
        h('span', { class: 'vr-card__name' }, p.display),
      );
      wall.appendChild(card);
    });
  }

  /* -------------------------------------------------------------- the strip */
  const strip = h('div', { class: 'vr-strip' });

  function drawStrip() {
    strip.replaceChildren(
      h('button', {
        class: `vr-letter${letter === null ? ' is-on' : ''}`, type: 'button',
        onclick: () => { letter = null; drawStrip(); drawWall(); },
      }, 'All'),
      ...letters.map((l) => h('button', {
        class: `vr-letter${letter === l ? ' is-on' : ''}`, type: 'button',
        onclick: () => { letter = letter === l ? null : l; drawStrip(); drawWall(); },
      }, l)),
    );
  }

  const search = h('input', {
    class: 'vr-search__input', type: 'search',
    placeholder: 'Find a student…', 'aria-label': 'Find a student',
    oninput: () => {
      term = search.value.trim().toLowerCase();
      /* A typed name should search every student, not just the letter that happens
         to be selected — otherwise searching "ram" under "A" finds nothing and
         reads as a broken box. */
      if (term) letter = null;
      drawStrip(); drawWall();
    },
  });

  /* ------------------------------------------------------------------ head */
  const head = h('div', { class: 'vr-head' },
    h('div', { class: 'vr-head__text' },
      block.eyebrow ? h('p', { class: 'vr-eyebrow' }, block.eyebrow) : null,
      h('h2', { class: 'vr-title' }, block.title || 'Video Resumes'),
      h('span', { class: 'vr-rule' }),
    ),
    block.lead ? h('p', { class: 'vr-lead' }, block.lead) : null,
    h('div', { class: 'vr-stats' },
      h('div', { class: 'vr-stat' },
        h('strong', {}, String(people.length)), h('span', {}, 'video resumes')),
    ),
  );

  root.appendChild(head);
  root.appendChild(h('div', { class: 'vr-tools' },
    h('div', { class: 'vr-search' }, icon('search', { class: 'ic ic--xs' }), search),
    strip,
    note,
  ));
  root.appendChild(wall);

  drawStrip();
  drawWall();

  bindStageLifetime(root, stage);
  return root;
}
