import { h, render, clear } from '../utils/dom.js';
import { initials } from '../utils/format.js';
import { state, isAdmin, visibleSections, deckSections, childSections, sectionById, sectionOrdinal } from '../context/appStore.js';
import { navigate, refresh } from '../utils/router.js';
import { icon, iconForTitle, hasIcon } from '../utils/icons.js';
import { updateSection } from '../services/contentService.js';
import { toastError, toastSuccess } from './Toast.js';
import { SectionIconGlyph } from './IconChooser.js';

/**
 * The curated story for each major topic. A child is either a row, a caption
 * that titles the rows under it, or a row with its own nested rows — the shape
 * the content actually has (six coder programs under Coding; three platforms
 * under Assessment Platforms).
 */
/**
 * Keyed by the section's own `key`, not by its position.
 *
 * These labels deliberately differ from the stored titles — "Vision, Mission &
 * Values" is presented as "Strategic Foundation" — so they used to be matched
 * by index. That breaks the moment the list is filtered, and the server filters
 * it for a presenter: with three sections released, AI Ready Engineer was being
 * announced as Strategic Foundation. A presenter never receives the full list,
 * so position cannot identify a section for them. The key can.
 */
const NAVIGATION_GROUPS = [
  ['company-profile', 'Organization Overview', 'layers', ['Executive Summary', 'Organization Snapshot', 'History & Milestones']],
  ['ceo-message', 'Leadership', 'users', ['CEO Profile', 'Leadership Journey', 'Success Stories', 'CEO Vision']],
  ['vision-mission', 'Strategic Foundation', 'compass', ['Vision', 'Mission', 'Core Values']],
  ['best-practices', 'Strategic Initiatives', 'sparkles', ['T-Connect', 'Get Ready Connect', 'Drive Ready Connect', 'AI Innovations']],
  // One page, not a tree. Ignite Coder, Moon Coder, SkillUp, Become, Bamboo,
  // Owl, Drive Ready and PEGA are all programmes and belong on the Programs
  // page together — as eight nav rows they made the reader open eight pages to
  // read one catalogue. AI Ready Engineer has left for a section of its own.
  ['programs', 'Programs & Learning', 'book', []],
  ['team', 'Centers of Excellence', 'beaker', ['AI & Data Science', 'Microsoft Technologies', 'Enterprise Technologies', 'Industry Partners']],
  ['initiatives', 'Operational Excellence', 'workflow', [
    'Learning Pathways',
    'Industry Integration',
    { label: 'Assessment Platforms', children: ['MYNA', 'HOOT', 'ATS'] },
  ]],
  ['certifications', 'Talent Acquisition', 'user-check', ['Entrance Test', 'Interview & Screening']],
  ['placements', 'Certifications & Credentials', 'certificate', ['Global Certifications', 'Student Certifications']],
  ['coe', 'Strategic Partnerships', 'partners', ['Academic Partners', 'Industry Partners', 'Global Collaborations']],
  ['mous', 'Career Outcomes', 'trend-up', ['Placement Readiness', 'Placement Statistics', 'Success Stories']],
  ['moments', 'Recognition & Achievements', 'trophy', ['Institutional Awards', 'Student Achievements', 'Faculty Recognition']],
  ['achievements', 'Events & Milestones', 'calendar', ['Events', 'Workshops', 'Project Arena']],
  ['media', 'Media Center', 'images', ['Photo Gallery', 'Video Gallery']],
  ['testimonials', 'Success Stories', 'quote', ['Student Testimonials', 'Alumni Stories', 'Recruiter Testimonials']],
  ['contact', 'Connect With Us', 'mail', ['Contact Information', 'Office Locations', 'Contact Form']],
   /* A section with no entry here keeps its stored title and a keyword icon,
     which is a fine fallback — but the flagship programme deserves its own
     curated name. */
  ['ai-ready-engineer', 'AI Ready Engineer', 'brain', []],
];

/**
 * Releases a section to the presenter, or takes it back.
 *
 * Whether a presenter can see a section was only ever settable from a command
 * line, which meant the person who decides what is finished had to ask someone
 * else to run it. The rule is unchanged — published and not hidden — this is
 * simply the switch for it, on the row it belongs to. Admin-only: the server
 * answers a presenter with 403 either way, this just declines to draw a control
 * that would fail.
 */
function releaseToggle(section) {
  if (!isAdmin() || !section) return null;
  const live = section.status === 'published' && !section.hidden;
  const button = h('button', {
    class: `snav-release${live ? ' is-live' : ''}`,
    type: 'button',
    title: live
      ? `${section.title} is live for presenters — click to withdraw it`
      : `${section.title} is hidden from presenters — click to push it live`,
    'aria-pressed': String(live),
    onclick: async (event) => {
      // The row underneath navigates; the toggle must not.
      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      try {
        await updateSection(section.id, { status: live ? 'draft' : 'published', hidden: false });
        toastSuccess(live
          ? `${section.title} withdrawn from presenters`
          : `${section.title} pushed to presenters`);
        refresh();
      } catch (err) {
        button.disabled = false;
        toastError(err.message);
      }
    },
  }, icon(live ? 'eye' : 'eye-off', { class: 'ic ic--xs' }));
  return button;
}

/** The curated group for a section, or an empty tuple when it has none. */
const groupFor = (section) => {
  const row = NAVIGATION_GROUPS.find((g) => g[0] === section?.key);
  return row ? [row[1], row[2], row[3]] : [];
};

/**
 * One flat list of rows to draw, so the pane and the rail flyout agree.
 *
 * A row carrying a `sectionId` is a real subsection page and navigates to itself;
 * a row without one is a curated label for a group whose subsections have not
 * been built yet, and opens the group's own page.
 */
function childRows(children = []) {
  const rows = [];
  for (const child of children) {
    if (typeof child === 'string') {
      rows.push({ kind: 'item', label: child });
    } else if (child?.id && child?.title) {
      rows.push({ kind: 'item', label: child.title, sectionId: child.id });
    } else if (child?.caption) {
      rows.push({ kind: 'caption', label: child.caption });
    } else if (child?.label) {
      rows.push({ kind: 'item', label: child.label });
      for (const nested of child.children || []) {
        if (nested?.id && nested?.title) {
          rows.push({ kind: 'nested', label: nested.title, sectionId: nested.id });
        } else {
          rows.push({ kind: 'nested', label: nested });
        }
      }
    }
  }
  return rows;
}

/**
 * Folds the pages that exist into the curated story for a group.
 *
 * The old rule was all-or-nothing — one real child replaced the whole curated
 * list — so building the first page of a group deleted every other label in it
 * from the navigation. Building "History & Milestones" under Organization
 * Overview took "Executive Summary" and "Organization Snapshot" down with it,
 * and Executive Summary is finished content that lives on the group's own page.
 *
 * A label is now replaced only by its own page. The curated order is the story
 * and is kept; a real child with no curated label is appended rather than
 * dropped, so nothing an admin creates can go missing from the nav.
 */
function mergeChildren(curated = [], built = []) {
  const byTitle = new Map();
  for (const section of built) {
    const key = String(section.title || '').trim().toLowerCase();
    if (key && !byTitle.has(key)) byTitle.set(key, section);
  }

  const claimed = new Set();
  const claim = (label) => {
    const match = byTitle.get(String(label || '').trim().toLowerCase());
    if (!match) return null;
    claimed.add(match.id);
    return match;
  };

  const rows = curated.map((entry) => {
    if (typeof entry === 'string') return claim(entry) || entry;
    if (entry?.label) {
      return { ...entry, children: (entry.children || []).map((n) => claim(n) || n) };
    }
    return entry;
  });

  for (const section of built) {
    if (!claimed.has(section.id)) rows.push(section);
  }
  return rows;
}

// The router recreates the sidebar after every navigation. Storing this state
// outside the DOM lets an open group remain open and a collapsed group remain
// collapsed after that rerender.
const navigationStateByOrg = new Map();

const RAIL_KEY = 'portal.nav.rail';

/** Rail width is a shell-grid decision, so the choice lives on the document. */
function applyRail(collapsed) {
  document.documentElement.dataset.navRail = collapsed ? '1' : '0';
}

function railCollapsed() {
  try {
    return localStorage.getItem(RAIL_KEY) === '1';
  } catch {
    return false;
  }
}

applyRail(railCollapsed());

function setRail(collapsed) {
  try {
    localStorage.setItem(RAIL_KEY, collapsed ? '1' : '0');
  } catch {
    /* Private browsing can refuse storage; the session still switches. */
  }
  applyRail(collapsed);
}

function navigationState(orgId, activeIndex) {
  if (!navigationStateByOrg.has(orgId)) {
    navigationStateByOrg.set(orgId, {
      expanded: new Set(activeIndex >= 0 ? [activeIndex] : []),
      selectedChildren: new Map(),
    });
  }
  return navigationStateByOrg.get(orgId);
}

/** A section's own mark wins over the curated one — admins can restyle any row. */
function sectionGlyph(section, fallbackKey, { class: className = 'nav-tree__icon' } = {}) {
  if (section?.iconAsset?.url) return SectionIconGlyph(section, { class: className });
  const key = hasIcon(section?.iconKey)
    ? section.iconKey
    : fallbackKey || iconForTitle(section?.title);
  return icon(key, { class: className });
}

/**
 * "Sections: 16" — the word and the count are separate elements so the rail can
 * drop the label wholesale rather than clipping the line.
 */
function labelRow(text, count, action) {
  return h(
    'div',
    { class: 'snav-label' },
    h(
      'span',
      { class: 'snav-label__text' },
      h('span', { class: 'snav-label__word' }, `${text}:`),
      h('b', { class: 'snav-label__count' }, String(count)),
    ),
    action || null,
  );
}

export function SideNav(org, activeSectionId, { onLogout } = {}) {
  const sections = visibleSections();
  // A subsection page is the active route, but the group it belongs to is what
  // the pane highlights and holds open.
  const activeSection = sectionById(activeSectionId);
  const activeGroupId = activeSection?.parentId || activeSectionId;
  const activeIndex = sections.findIndex((section) => section.id === activeGroupId);
  const navState = navigationState(org.id, activeIndex);
  const admin = isAdmin();

  /* ------------------------------------------------------------ nav tree */
  // Filtering only ever hides rows, so an open group and its selected child
  // survive a search and come back untouched when the box is cleared.
  const records = [];

  const openChild = (index, section, rowIndex, row) => {
    navState.expanded.add(index);
    // A real subsection has its own page; a curated label can only open the group.
    const target = row?.sectionId || section.id;
    if (row?.sectionId) navState.selectedChildren.delete(index);
    else if (navState.selectedChildren.get(index) === rowIndex) navState.selectedChildren.delete(index);
    else navState.selectedChildren.set(index, rowIndex);

    if (target !== activeSectionId) navigate(`/o/${org.id}/${target}`);
    else refresh();
  };

  const childButton = (row, rowIndex, index, section, selected) =>
    h(
      'button',
      {
        class: `nav-tree__child${row.kind === 'nested' ? ' nav-tree__child--nested' : ''}${selected ? ' is-active' : ''}`,
        type: 'button',
        title: row.label,
        'aria-current': selected ? 'page' : null,
        onclick: () => openChild(index, section, rowIndex, row),
      },
      icon('chevron-right', { class: 'nav-tree__child-icon' }),
      h('span', { class: 'nav-tree__child-title' }, row.label),
      /* Only a row backed by a real page can be released — a curated label with
         no section behind it has nothing to publish. */
      row.sectionId ? releaseToggle(sectionById(row.sectionId)) : null,
    );

  const groupNode = (section, index, title, iconKey, children) => {
    const active = section.id === activeGroupId;
    const rows = childRows(children);
    const group = h('div', { class: `nav-tree__group${navState.expanded.has(index) ? ' is-open' : ''}` });
    const setExpanded = (isExpanded) => {
      navState.expanded[isExpanded ? 'add' : 'delete'](index);
      group.classList.toggle('is-open', isExpanded);
      parent.setAttribute('aria-expanded', String(isExpanded));
    };
    const parent = h(
      'button',
      {
        class: `nav-tree__parent${active ? ' is-active' : ''}`,
        type: 'button',
        title,
        'aria-expanded': String(navState.expanded.has(index)),
        onclick: () => {
          if (active) {
            setExpanded(!navState.expanded.has(index));
            return;
          }
          setExpanded(true);
          navigate(`/o/${org.id}/${section.id}`);
        },
      },
      h('span', { class: 'nav-tree__badge' }, sectionGlyph(section, iconKey)),
      h('span', { class: 'nav-tree__title' }, title),
      /* The Draft flag said what the state was; the toggle beside it is what
         changes it. Both stay — the word is readable at a glance down a list of
         seventeen, the control is what you reach for. */
      admin && section.status !== 'published'
        ? h('span', { class: 'nav-tree__flag', title: 'Draft — presenters cannot see this section' }, 'Draft')
        : null,
      admin && section.hidden ? h('span', { class: 'nav-tree__flag' }, 'Hidden') : null,
      releaseToggle(section),
      rows.length ? h('span', { class: 'nav-tree__chevron' }, icon('chevron-right', { class: 'ic ic--xs' })) : null,
    );

    const childNodes = rows.map((row, rowIndex) => {
      // `--i` staggers the reveal, so the rows arrive in reading order.
      const node = row.kind === 'caption'
        ? h('div', { class: 'nav-tree__caption' }, row.label)
        : childButton(row, rowIndex, index, section,
            row.sectionId
              ? row.sectionId === activeSectionId
              : active && navState.selectedChildren.get(index) === rowIndex);
      node.style.setProperty('--i', String(rowIndex));
      return node;
    });

    // The inner wrapper is what makes the open/close animate: a grid row of
    // 0fr → 1fr interpolates, where `display: none` cannot.
    group.append(
      parent,
      h('div', { class: 'nav-tree__children' }, h('div', { class: 'nav-tree__children-inner' }, ...childNodes)),
    );
    records.push({
      group,
      haystack: `${title} ${rows.map((row) => row.label).join(' ')}`.toLowerCase(),
      children: childNodes.map((node, i) => ({ node, haystack: rows[i].label.toLowerCase() })),
      wasOpen: navState.expanded.has(index),
    });
    return group;
  };

  const tree = sections.map((section, position) => {
    // Curated labels are keyed to the section's place in the organization's
    // full running order, not to where it happens to land in this viewer's
    // filtered list. `position` is still needed for the open/closed state,
    // which is per-rendered-row.
    const index = position;
    const [title, iconKey, curated] = groupFor(section);
    // A curated label is replaced by its own page once that page exists; the
    // rest of the group's story stays put until its pages are built too.
    const built = childSections(section.id);
    const children = title ? mergeChildren(curated, built) : built;
    return groupNode(section, index, title || section.title, iconKey, children);
  });

  /* --------------------------------------------------------- nav search */
  const search = h('input', {
    class: 'snav-search__input',
    type: 'search',
    placeholder: 'Search sections…',
    'aria-label': 'Search sections',
    oninput: () => {
      const term = search.value.trim().toLowerCase();
      for (const record of records) {
        const groupHit = !term || record.haystack.includes(term);
        record.group.classList.toggle('is-filtered', !groupHit);
        if (!term) {
          record.group.classList.toggle('is-open', record.wasOpen);
          for (const child of record.children) child.node.classList.remove('is-filtered');
          continue;
        }
        const childHits = record.children.filter((child) => child.haystack.includes(term));
        for (const child of record.children) {
          child.node.classList.toggle('is-filtered', childHits.length > 0 && !child.haystack.includes(term));
        }
        record.group.classList.toggle('is-open', childHits.length > 0);
      }
    },
  });

  const searchBox = h('div', { class: 'snav-search' }, icon('search', { class: 'snav-search__icon' }), search);

  const setSearchOpen = (open) => {
    searchBox.classList.toggle('is-open', open);
    if (open) search.focus();
    else {
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  };

  /* -------------------------------------------------------- deck actions */
  const startPresenting = () => {
    const deck = deckSections();
    const target = deck.find((section) => section.id === activeSectionId) || deck[0];
    if (!target) return;
    state.presenting = true;
    document.body.classList.add('is-presenting');
    document.documentElement.requestFullscreen?.().catch(() => {});
    if (target.id === activeSectionId) refresh();
    else navigate(`/o/${org.id}/${target.id}`);
  };

  let allOpen = false;
  const setAllGroups = (open) => {
    allOpen = open;
    for (const [index, record] of records.entries()) {
      record.wasOpen = open;
      record.group.classList.toggle('is-open', open);
      navState.expanded[open ? 'add' : 'delete'](index);
    }
  };

  /* ------------------------------------------------------ workspace card */
  const workspaceRows = [
    ['Present deck', 'present', startPresenting],
    state.orgs.length > 1 ? ['Switch organization', 'swap', () => navigate('/orgs')] : null,
  ].filter(Boolean);

  const workspaceCard = h(
    'div',
    { class: 'snav-card' },
    ...workspaceRows.map(([label, iconKey, onClick]) =>
      h(
        'button',
        { class: 'snav-card__row', type: 'button', title: label, onclick: onClick },
        h('span', { class: 'snav-card__mark' }, icon(iconKey, { class: 'ic' })),
        h('span', { class: 'snav-card__label' }, label),
      ),
    ),
  );

  /* --------------------------------------------------------- quick actions
     Round targets with their names under them — no guessing what an icon does,
     and they are the first thing in reach. */
  const quickActions = [
    ['Search', 'search', () => setSearchOpen(!searchBox.classList.contains('is-open'))],
    ['Groups', 'sliders', () => setAllGroups(!allOpen)],
    ['Sign out', 'logout', onLogout],
  ].filter(Boolean);

  const quickGrid = h(
    'div',
    { class: 'snav-quick' },
    ...quickActions.map(([label, iconKey, onClick]) =>
      h(
        'button',
        {
          class: `snav-quick__btn${iconKey === 'logout' ? ' snav-quick__btn--exit' : ''}`,
          type: 'button',
          title: label,
          onclick: onClick,
        },
        h('span', { class: 'snav-quick__chip' }, icon(iconKey, { class: 'ic' })),
        h('span', { class: 'snav-quick__label' }, label),
      ),
    ),
  );

  /* ----------------------------------------------------------- rail flyout
     The rail keeps every section within one click; its subsections open beside
     it rather than disappearing with the labels. */
  const flyout = h('div', { class: 'snav-flyout', hidden: true });
  let flyoutIndex = -1;

  const closeFlyout = () => {
    flyoutIndex = -1;
    flyout.hidden = true;
    clear(flyout);
  };

  const openFlyout = (section, index, title, children, anchor) => {
    const rows = childRows(children);
    if (!rows.length) {
      navigate(`/o/${org.id}/${section.id}`);
      return;
    }
    if (flyoutIndex === index) {
      closeFlyout();
      return;
    }
    flyoutIndex = index;
    render(
      flyout,
      h(
        'div',
        { class: 'snav-flyout__head' },
        h(
          'button',
          {
            class: 'snav-flyout__title',
            type: 'button',
            title: `Open ${title}`,
            onclick: () => {
              closeFlyout();
              navigate(`/o/${org.id}/${section.id}`);
            },
          },
          title,
        ),
        h(
          'button',
          { class: 'snav-flyout__close', type: 'button', 'aria-label': 'Close', onclick: closeFlyout },
          icon('close', { class: 'ic ic--xs' }),
        ),
      ),
      h(
        'div',
        { class: 'snav-flyout__list' },
        ...rows.map((row, rowIndex) =>
          row.kind === 'caption'
            ? h('div', { class: 'nav-tree__caption' }, row.label)
            : h(
                'button',
                {
                  class: `nav-tree__child${row.kind === 'nested' ? ' nav-tree__child--nested' : ''}`,
                  type: 'button',
                  onclick: () => {
                    closeFlyout();
                    openChild(index, section, rowIndex);
                  },
                },
                icon('chevron-right', { class: 'nav-tree__child-icon' }),
                h('span', { class: 'nav-tree__child-title' }, row.label),
              ),
        ),
      ),
    );
    flyout.hidden = false;
    // Sit level with the icon that opened it, kept inside the window.
    const top = anchor.getBoundingClientRect().top - aside.getBoundingClientRect().top;
    flyout.style.top = `${Math.max(8, Math.min(top - 6, window.innerHeight - flyout.offsetHeight - 16))}px`;
  };

  /* ------------------------------------------------------------ rail tips
     One styled label, moved to whichever icon is under the pointer. The native
     `title` tooltip is a grey OS box that ignores the brand entirely, and a
     per-button pseudo-element would be clipped by the rail's own scroll. */
  const railTip = h('div', { class: 'snav-tip', hidden: true });

  const showTip = (anchor, label) => {
    railTip.textContent = label;
    railTip.hidden = false;
    const top = anchor.getBoundingClientRect().top - aside.getBoundingClientRect().top;
    railTip.style.top = `${top + anchor.offsetHeight / 2}px`;
    railTip.classList.add('is-on');
  };

  const hideTip = () => {
    railTip.classList.remove('is-on');
    railTip.hidden = true;
  };

  const railTree = h(
    'div',
    { class: 'snav-rail__list' },
    ...sections.map((section, index) => {
      const [title, iconKey, curated] = groupFor(section);
      const label = title || section.title;
      // The rail flyout was reading the curated list raw, so it never offered a
      // page that had actually been built. Same merge as the pane — the two are
      // meant to agree.
      const children = title ? mergeChildren(curated, childSections(section.id)) : childSections(section.id);
      const button = h(
        'button',
        {
          class: `snav-rail__btn${section.id === activeSectionId ? ' is-active' : ''}`,
          type: 'button',
          'aria-label': label,
          onclick: () => openFlyout(section, index, label, children, button),
          onmouseenter: () => showTip(button, label),
          onmouseleave: hideTip,
          onfocus: () => showTip(button, label),
          onblur: hideTip,
        },
        sectionGlyph(section, iconKey, { class: 'snav-rail__icon' }),
      );
      return button;
    }),
  );

  /* ----------------------------------------------------------- scroll body */
  const guide = h(
    'nav',
    { class: 'sidenav__scroll', 'aria-label': 'Organization guide' },
    labelRow(
      'Sections',
      sections.length,
      h(
        'button',
        {
          class: 'snav-label__act',
          type: 'button',
          title: 'Search sections',
          'aria-label': 'Search sections',
          onclick: () => setSearchOpen(!searchBox.classList.contains('is-open')),
        },
        icon('search', { class: 'ic ic--xs' }),
      ),
    ),
    searchBox,
    h('div', { class: 'nav-tree' }, ...tree),
    labelRow(
      'Workspace',
      workspaceRows.length + (admin ? 1 : 0),
      admin
        ? h(
            'button',
            {
              class: 'snav-label__act',
              type: 'button',
              title: 'Manage sections',
              'aria-label': 'Manage sections',
              onclick: () => navigate(`/o/${org.id}/settings`),
            },
            icon('pencil', { class: 'ic ic--xs' }),
          )
        : null,
    ),
    workspaceCard,
  );

  /* -------------------------------------------------------------- shell */
  const collapse = h(
    'button',
    {
      class: 'sidenav__collapse',
      type: 'button',
      title: 'Collapse the navigation',
      'aria-label': 'Collapse the navigation',
    },
    icon(railCollapsed() ? 'chevron-right' : 'chevron-left', { class: 'ic ic--sm' }),
  );

  collapse.addEventListener('click', () => {
    const next = !railCollapsed();
    setRail(next);
    aside.classList.toggle('sidenav--rail', next);
    render(collapse, icon(next ? 'chevron-right' : 'chevron-left', { class: 'ic ic--sm' }));
    collapse.title = next ? 'Expand the navigation' : 'Collapse the navigation';
    collapse.setAttribute('aria-label', collapse.title);
    closeFlyout();
    if (next) setSearchOpen(false);
  });

  const brandMark = org.mark?.url
    ? h('img', { class: 'sidenav__mark', src: org.mark.url, alt: `${org.name} mark` })
    : h('div', { class: 'sidenav__mark sidenav__mark--text' }, initials(org.name, 1));

  const aside = h(
    'aside',
    { class: `sidenav${railCollapsed() ? ' sidenav--rail' : ''}` },
    h(
      'div',
      { class: 'sidenav__head' },
      org.logo?.url
        ? h('img', { class: 'sidenav__logo', src: org.logo.url, alt: `${org.name} logo` })
        : h('div', { class: 'sidenav__name' }, org.name),
      brandMark,
      collapse,
    ),
    labelRow('Quick actions', quickActions.length),
    quickGrid,
    guide,
    railTree,
    // The deck is a fixed set of sections, so the one thing worth a primary
    // action here is starting the presentation.
    h(
      'div',
      { class: 'sidenav__foot' },
      h(
        'button',
        { class: 'snav-cta', type: 'button', onclick: startPresenting },
        h('span', { class: 'snav-cta__fab' }, icon('present', { class: 'ic' })),
        h(
          'span',
          { class: 'snav-cta__text' },
          h('span', { class: 'snav-cta__title' }, 'Present deck'),
          h('span', { class: 'snav-cta__hint' }, 'Fullscreen, no controls'),
        ),
      ),
    ),
    flyout,
    railTip,
  );

  return aside;
}
