/**
 * Single shared application state. Pages read from `state`, mutate through the
 * helpers below, and re-render via the router — no per-component state.
 */
import * as contentService from '../services/contentService.js';

export const state = {
  user: null,
  loginHint: null,
  orgs: [],
  orgId: null,
  sections: [],
  loading: false,
  presenting: false,
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  for (const fn of listeners) fn(state);
}

export function isAdmin() {
  return state.user?.role === 'admin';
}

export function activeOrg() {
  return state.orgs.find((org) => org.id === state.orgId) || null;
}

export function orgById(orgId) {
  return state.orgs.find((org) => org.id === orgId) || null;
}

const isShown = (section) => isAdmin() || (section.status === 'published' && !section.hidden);

/**
 * The navigation groups — top-level sections only. Subsections are their own
 * pages, reached through their parent, and are returned by `childSections`.
 */
export function visibleSections() {
  return state.sections.filter((s) => !s.parentId && isShown(s));
}

/** The pages inside one group, in their saved order. */
export function childSections(parentId) {
  return state.sections
    .filter((s) => s.parentId === parentId && isShown(s))
    .sort((a, b) => a.order - b.order);
}

/**
 * Presentation order walks the tree: a group, then the pages inside it, then the
 * next group — which is the order a presenter clicks through in the pane.
 */
export function deckSections() {
  const shown = (section) => section.status === 'published' && !section.hidden;
  const children = (parentId) => state.sections
    .filter((s) => s.parentId === parentId && shown(s))
    .sort((a, b) => a.order - b.order);

  return state.sections
    .filter((s) => !s.parentId && shown(s))
    .flatMap((parent) => [parent, ...children(parent.id)]);
}

export function sectionById(id) {
  return state.sections.find((section) => section.id === id) || null;
}

export function sectionByKeyOrId(value) {
  return state.sections.find((section) => section.id === value || section.key === value) || null;
}

export async function loadOrgs({ force = false } = {}) {
  if (state.orgs.length && !force) return state.orgs;
  state.orgs = await contentService.listOrgs();
  return state.orgs;
}

export async function loadSections(orgId, { force = false } = {}) {
  if (state.orgId === orgId && state.sections.length && !force) return state.sections;
  state.orgId = orgId;
  state.sections = await contentService.listSections(orgId);
  return state.sections;
}

export function upsertSection(section) {
  const index = state.sections.findIndex((item) => item.id === section.id);
  if (index === -1) state.sections.push(section);
  else state.sections[index] = section;
  state.sections.sort((a, b) => a.order - b.order);
}

export function removeSection(sectionId) {
  state.sections = state.sections.filter((section) => section.id !== sectionId);
}

export function setSections(sections) {
  state.sections = sections;
}

export function upsertOrg(org) {
  const index = state.orgs.findIndex((item) => item.id === org.id);
  if (index === -1) state.orgs.push(org);
  else state.orgs[index] = org;
}

export function resetSession() {
  state.user = null;
  state.orgs = [];
  state.orgId = null;
  state.sections = [];
  state.presenting = false;
}
