import * as orgModel from '../models/org.model.js';
import * as assetService from './asset.service.js';
import { themeFor, fontFor, sanitizeThemeOverride, NEUTRALS, FONTS } from '../config/themes.js';
import { HttpError } from '../utils/http.js';

export function publicOrg(org) {
  return {
    id: org.id,
    name: org.name,
    shortName: org.shortName,
    tagline: org.tagline,
    theme: themeFor(org.id, org.themeOverride),
    font: fontFor(org.fontId),
    fontChoices: Object.values(FONTS).map(({ id, label }) => ({ id, label })),
    neutrals: NEUTRALS,
    logo: org.logoAssetId ? assetService.resolveMany([org.logoAssetId])[0] || null : null,
    logoAssetId: org.logoAssetId || null,
    // The square mark the collapsed navigation rail shows: a wordmark is
    // unreadable at 44px, so brands supply both.
    mark: org.markAssetId ? assetService.resolveMany([org.markAssetId])[0] || null : null,
    markAssetId: org.markAssetId || null,
    updatedAt: org.updatedAt || null,
  };
}

export function list() {
  return orgModel.all().map(publicOrg);
}

export function get(id) {
  const org = orgModel.byId(id);
  if (!org) throw new HttpError(404, 'Organization not found');
  return publicOrg(org);
}

export async function update(id, payload = {}) {
  const org = orgModel.byId(id);
  if (!org) throw new HttpError(404, 'Organization not found');

  const patch = {};
  if (payload.name !== undefined) {
    const name = String(payload.name).slice(0, 80).trim();
    if (!name) throw new HttpError(400, 'Organization name cannot be empty');
    patch.name = name;
  }
  if (payload.shortName !== undefined) patch.shortName = String(payload.shortName).slice(0, 24);
  if (payload.tagline !== undefined) patch.tagline = String(payload.tagline).slice(0, 160);
  if (payload.logoAssetId !== undefined) patch.logoAssetId = payload.logoAssetId || null;
  if (payload.markAssetId !== undefined) patch.markAssetId = payload.markAssetId || null;

  // `theme: null` resets to the approved brand palette; a partial object
  // overrides only the colours it names.
  if (payload.theme !== undefined) {
    patch.themeOverride = payload.theme === null ? null : sanitizeThemeOverride(payload.theme);
  }
  if (payload.fontId !== undefined) {
    if (payload.fontId && !FONTS[payload.fontId]) throw new HttpError(400, 'Unknown font choice');
    patch.fontId = payload.fontId || null;
  }

  return publicOrg(await orgModel.update(id, patch));
}
