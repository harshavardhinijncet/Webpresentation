/**
 * The only colours used anywhere in the product. Taken from the two logos.
 * Nothing outside these values may be introduced by seed data or the UI.
 */
export const NEUTRALS = {
  pageBg: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
  success: '#16A34A',
  error: '#DC2626',
};

export const THEMES = {
  torii: {
    id: 'torii',
    label: 'Black + Orange',
    primary: '#000000',
    secondary: '#E95A22',
    accent: '#E95A22',
    highlight: '#F45C23',
    onBrand: '#FFFFFF',
    navBg: '#000000',
    navText: '#FFFFFF',
  },
  'technical-hub': {
    id: 'technical-hub',
    label: 'Green + Gold',
    primary: '#008638',
    secondary: '#71BD1F',
    accent: '#FFBB00',
    highlight: '#71BD1F',
    onBrand: '#FFFFFF',
    navBg: '#008638',
    navText: '#FFFFFF',
  },
};

/**
 * Type choices. Everything here is either bundled with the app or present on
 * the machine — nothing is fetched, so the deck still renders with no network.
 */
export const FONTS = {
  sans: {
    id: 'sans',
    label: 'Clean sans serif',
    stack: '"Segoe UI", Arial, sans-serif',
    scale: 1,
  },
};

export function fontFor(id) {
  return FONTS[id] || FONTS.sans;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Colour keys an admin may override. `navText` and `onBrand` stay derived. */
export const THEME_KEYS = ['primary', 'secondary', 'accent', 'highlight', 'navBg'];

/** Keeps only well-formed hex values for known keys — anything else is dropped. */
export function sanitizeThemeOverride(raw) {
  const clean = {};
  for (const key of THEME_KEYS) {
    const value = raw?.[key];
    if (typeof value === 'string' && HEX.test(value.trim())) clean[key] = value.trim().toUpperCase();
  }
  return clean;
}

export function themeFor(orgId, override = null) {
  const base = THEMES[orgId] || THEMES.torii;
  const patch = sanitizeThemeOverride(override);
  if (!Object.keys(patch).length) return { ...base, customized: false };
  return { ...base, ...patch, label: `${base.label} (customised)`, customized: true };
}
