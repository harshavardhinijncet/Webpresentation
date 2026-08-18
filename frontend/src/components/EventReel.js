import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { media } from '../utils/media.js';
import { videoControls, withPlayerApi } from '../utils/videoControls.js';

/**
 * Events & Milestones: ninety-one films, one stage, and the series held together.
 *
 * The source is a workbook of six sheets, and the sheets encode something the
 * page has to honour: a row with a title starts a series and every row beneath it
 * with the title left blank is another part of the same one. T-News is ten rows
 * and one title. Project Space 3.0 is five. Drawn as ninety-one loose cards that
 * structure disappears, so a series is drawn as a numbered run — Part 1 → Part 2 →
 * Part 3 — and the arrows are the point: they say these are in order and there are
 * more after this one.
 *
 * One player, not a grid of them. Six sheets of films is far too much to put on a
 * slide at once, and a wall of ninety-one embeds would need ninety-one network
 * connections before the first frame. So a chapter at a time, the entries listed
 * beside a single stage, and the frame is mounted only when something is chosen —
 * unmounted again on the way out, because a hidden iframe carries on playing.
 *
 * No thumbnail is required for the page to work. YouTube posters come from
 * i.ytimg.com and there is no network at presentation time, so a poster is
 * attempted and removed on error, leaving a card that carries its title in type.
 * That is the same bargain ProgramDeck makes.
 *
 * The chapter order is the argument: the anniversary films first, because they are
 * the whole arc of the place and the reason this page is one stop, then what it
 * runs, what it builds, who builds it, and what it is building next.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)');

/* enablejsapi is what lets the hover controls reach the frame at all: without it
   postMessage is ignored and every button on the bar does nothing. */
const YT = withPlayerApi('autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3'
  + '&playsinline=1&disablekb=1&fs=0&color=white');
const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${YT}`;
const ytPoster = (id) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

const ordinal = (n) => String(n).padStart(2, '0');

/** A poster that removes itself rather than leaving a broken frame offline. */
function poster(film, cls) {
  const shot = h('span', { class: cls });
  if (film?.youtube) {
    const img = h('img', { src: ytPoster(film.youtube), alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => img.remove());
    shot.appendChild(img);
  }
  return shot;
}

export function EventReel(block, { editing = false } = {}) {
  const chapters = (block.chapters || []).filter((c) => c.groups?.length);
  const root = h('div', { class: 'ev-root ph-root' });

  if (!chapters.length) {
    root.appendChild(h('div', { class: 'ev-empty' },
      h('h2', { class: 'ev-title' }, block.title || 'Events & Milestones'),
      editing
        ? h('p', { class: 'ev-hint' },
            'Publish the film list from backend/uploads/Videos.xlsx and it appears here.')
        : null,
    ));
    return root;
  }

  const filmsIn = (c) => c.groups.reduce((n, g) => n + g.films.length, 0);
  const total = chapters.reduce((n, c) => n + filmsIn(c), 0);

  let chapter = chapters[0];
  /* What is on the stage: which entry, and which part of it. Held as indices
     rather than as the film itself, so "Part 3 of 10" and the next/previous
     buttons all read off one piece of state. */
  let atGroup = -1;
  let atFilm = 0;

  /* ------------------------------------------------------------- the stage */
  const frame = h('div', { class: 'ev-stage__frame' });
  const nowTitle = h('h3', { class: 'ev-now__title' });
  const nowMeta = h('p', { class: 'ev-now__meta' });
  const dots = h('div', { class: 'ev-now__dots' });

  const prevBtn = h('button', {
    class: 'ev-now__step', type: 'button',
    onclick: () => hop(-1),
  }, icon('chevron-left', { class: 'ic ic--xs' }), h('span', {}, 'Previous'));
  const nextBtn = h('button', {
    class: 'ev-now__step', type: 'button',
    onclick: () => hop(1),
  }, h('span', {}, 'Next'), icon('chevron-right', { class: 'ic ic--xs' }));

  /** Unmount rather than hide — a hidden iframe keeps playing behind the page. */
  function clearStage() {
    frame.replaceChildren();
    root.classList.remove('is-playing');
  }

  /**
   * Walk the chapter as one flat sequence: the end of an entry rolls into the
   * next, so Next never dead-ends inside a five-part series. Clamped rather than
   * wrapped, because a presenter reaching the end of a chapter wants the chapter
   * to be over, not to start again.
   */
  function hop(delta) {
    const flat = [];
    chapter.groups.forEach((g, gi) => g.films.forEach((f, fi) => flat.push([gi, fi])));
    const here = flat.findIndex(([gi, fi]) => gi === atGroup && fi === atFilm);
    const next = flat[Math.max(0, Math.min(flat.length - 1, here + delta))];
    if (next) play(next[0], next[1]);
  }

  function play(gi, fi) {
    const group = chapter.groups[gi];
    const film = group?.films[fi];
    if (!film) return;
    atGroup = gi;
    atFilm = fi;

    const surface = film.youtube
      ? h('iframe', {
          class: 'ev-stage__yt', src: ytEmbed(film.youtube),
          title: group.title, allow: 'autoplay; encrypted-media; picture-in-picture',
          allowfullscreen: '', frameborder: '0',
        })
      : h('video', {
          class: 'ev-stage__file', src: media(`/uploads/${encodeURI(film.src)}`),
          autoplay: true, muted: true, playsinline: true, controls: false, loop: true,
        });
    frame.replaceChildren(surface, videoControls(surface));
    root.classList.add('is-playing');
    paintNow();
    paintList();
  }

  function paintNow() {
    const group = chapter.groups[atGroup];
    if (!group) {
      nowTitle.textContent = chapter.name;
      nowMeta.textContent = chapter.blurb || '';
      dots.replaceChildren();
      prevBtn.disabled = true;
      nextBtn.disabled = false;
      return;
    }
    const film = group.films[atFilm];
    const many = group.films.length > 1;
    nowTitle.textContent = film?.label || group.title;
    nowMeta.replaceChildren(
      h('span', { class: 'ev-now__chapter' }, chapter.name),
      h('span', { class: 'ev-now__sep' }, '·'),
      h('span', {}, many
        ? `${film?.label ? `${group.title} — ` : ''}part ${atFilm + 1} of ${group.films.length}`
        : 'single film'),
    );

    /* One dot per part of the entry on screen, so a ten-part series shows how
       far through it the room is without reading the number. */
    dots.replaceChildren(...(many
      ? group.films.map((f, i) => h('button', {
          class: `ev-dot${i === atFilm ? ' is-on' : ''}`,
          type: 'button', 'aria-label': `Part ${i + 1}`,
          onclick: () => play(atGroup, i),
        }))
      : []));

    const flatLen = chapter.groups.reduce((n, g) => n + g.films.length, 0);
    const seen = chapter.groups.slice(0, atGroup).reduce((n, g) => n + g.films.length, 0) + atFilm;
    prevBtn.disabled = seen === 0;
    nextBtn.disabled = seen >= flatLen - 1;
  }

  /* -------------------------------------------------------------- the list */
  const list = h('div', { class: 'ev-list' });
  const listHead = h('div', { class: 'ev-list__head' });

  function paintList() {
    listHead.replaceChildren(
      h('div', {},
        h('h4', { class: 'ev-list__name' }, chapter.name),
        h('p', { class: 'ev-list__blurb' }, chapter.blurb || ''),
      ),
      h('span', { class: 'ev-list__n' }, `${filmsIn(chapter)} films`),
    );

    list.replaceChildren(...chapter.groups.map((g, gi) => {
      const on = gi === atGroup;
      const many = g.films.length > 1;

      /* The run of parts, with an arrow between each. This is the whole reason
         the series structure was kept rather than flattened: the arrows say these
         are in order and there is more after the one playing. */
      const flow = many
        ? h('div', { class: 'ev-flow' }, ...g.films.flatMap((f, fi) => {
            const chip = h('button', {
              class: `ev-flow__part${on && fi === atFilm ? ' is-on' : ''}`,
              type: 'button', title: f.label || `Part ${fi + 1}`,
              style: REDUCED?.matches ? {} : { '--i': String(fi) },
              onclick: (e) => { e.stopPropagation(); play(gi, fi); },
            }, ordinal(fi + 1));
            return fi === g.films.length - 1
              ? [chip]
              : [chip, h('span', { class: 'ev-flow__arrow', 'aria-hidden': 'true' },
                  icon('arrow-right', { class: 'ic ic--xs' }))];
          }))
        : null;

      const card = h('button', {
        class: `ev-card${on ? ' is-on' : ''}`,
        type: 'button',
        style: REDUCED?.matches ? {} : { '--i': String(gi) },
        onclick: () => play(gi, on ? atFilm : 0),
      },
        poster(g.films[0], 'ev-card__shot'),
        h('span', { class: 'ev-card__body' },
          h('span', { class: 'ev-card__title' }, g.title),
          many
            ? h('span', { class: 'ev-card__n' }, `${g.films.length} parts`)
            : h('span', { class: 'ev-card__n' }, 'One film'),
        ),
        h('span', { class: 'ev-card__go' }, icon('play', { class: 'ic ic--xs' })),
      );

      /* A chapter that is itself a sequence — the anniversary films, in years —
         gets a rule down its left edge and a number per entry, so the list reads
         as one run rather than a set of unrelated cards. */
      return chapter.sequential
        ? h('div', { class: 'ev-step', style: REDUCED?.matches ? {} : { '--i': String(gi) } },
            h('span', { class: 'ev-step__n' }, ordinal(gi + 1)),
            h('div', { class: 'ev-step__body' }, card, flow),
          )
        : h('div', { class: 'ev-item', style: REDUCED?.matches ? {} : { '--i': String(gi) } },
            card, flow);
    }));
  }

  /* ------------------------------------------------------------- the tabs */
  const tabs = h('div', { class: 'ev-tabs', role: 'tablist' });

  function paintTabs() {
    tabs.replaceChildren(...chapters.map((c, i) => h('button', {
      class: `ev-tab${c === chapter ? ' is-on' : ''}`,
      type: 'button', role: 'tab', 'aria-selected': String(c === chapter),
      style: REDUCED?.matches ? {} : { 'animation-delay': `${i * 60}ms` },
      onclick: () => {
        if (c === chapter) return;
        chapter = c;
        atGroup = -1;
        atFilm = 0;
        clearStage();
        paintTabs(); paintList(); paintNow(); paintOpener();
        list.scrollTop = 0;
      },
    },
      icon(c.icon || 'calendar', { class: 'ic ic--xs' }),
      h('span', { class: 'ev-tab__name' }, c.name),
      h('span', { class: 'ev-tab__n' }, String(filmsIn(c))),
    )));
  }

  /* ------------------------------------------------------------------ head */
  const head = h('div', { class: 'ev-head' },
    h('div', { class: 'ev-head__text' },
      block.eyebrow ? h('p', { class: 'ev-eyebrow' }, block.eyebrow) : null,
      h('h2', { class: 'ev-title' }, block.title || 'Events & Milestones'),
      h('span', { class: 'ev-rule' }),
    ),
    block.lead ? h('p', { class: 'ev-lead' }, block.lead) : null,
    h('div', { class: 'ev-stats' },
      h('div', { class: 'ev-stat' }, h('strong', {}, String(total)), h('span', {}, 'films')),
      h('div', { class: 'ev-stat' }, h('strong', {}, String(chapters.length)), h('span', {}, 'chapters')),
    ),
  );

  /* The opening state of the stage: the first film's poster behind an invitation
     to start it. Nothing is mounted and nothing plays until the room is ready —
     a slide that starts talking the moment it is reached takes the presenter's
     turn away from them.
     Rebuilt on every chapter change, so the plate shows the film the button will
     actually start rather than whatever the page opened on. */
  const openShot = h('span', { class: 'ev-opener__shot' });
  const opener = h('button', {
    class: 'ev-opener', type: 'button',
    onclick: () => play(0, 0),
  },
    openShot,
    h('span', { class: 'ev-opener__play' }, icon('play', { class: 'ic' })),
    h('span', { class: 'ev-opener__label' }, 'Start the reel'),
  );

  function paintOpener() {
    const first = chapter.groups[0]?.films[0];
    openShot.replaceChildren();
    if (!first?.youtube) return;
    const img = h('img', { src: ytPoster(first.youtube), alt: '', decoding: 'async' });
    // Removed rather than left broken: the poster host is unreachable offline.
    img.addEventListener('error', () => img.remove());
    openShot.appendChild(img);
  }

  const stage = h('div', { class: 'ev-stage' },
    h('div', { class: 'ev-stage__box' }, frame, opener),
    h('div', { class: 'ev-now' },
      h('div', { class: 'ev-now__text' }, nowTitle, nowMeta),
      dots,
      h('div', { class: 'ev-now__steps' }, prevBtn, nextBtn),
    ),
  );

  root.appendChild(head);
  root.appendChild(tabs);
  root.appendChild(h('div', { class: 'ev-body' },
    stage,
    h('div', { class: 'ev-side' }, listHead, list),
  ));

  paintTabs();
  paintList();
  paintNow();
  paintOpener();

  /* The frame lives inside this slide, so replacing the slide takes it with it —
     but a film that is still playing has to be stopped on the way out, or its
     audio follows the presenter to the next section. */
  const watch = new MutationObserver(() => {
    if (!root.isConnected) {
      clearStage();
      watch.disconnect();
    }
  });
  watch.observe(document.body, { childList: true, subtree: true });

  return root;
}
