import fs from 'node:fs';
import path from 'node:path';
import { BACKEND_ROOT } from './paths.js';

/** Minimal .env reader so the app keeps its zero-dependency promise. */
function readEnvFile() {
  const file = path.join(BACKEND_ROOT, '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = readEnvFile();

function read(key, fallback) {
  const value = process.env[key] ?? fileEnv[key];
  return value === undefined || value === '' ? fallback : value;
}

function readBool(key, fallback) {
  const value = read(key, null);
  if (value === null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const env = {
  port: Number(read('PORT', 4173)),
  /* CDN prefix for everything under /uploads. Empty means serve from disk,
     which is what local work and the offline presentation both rely on — so
     this can be set in production without changing a single stored path.
     Trailing slash trimmed, because every stored path already begins with one. */
  mediaBaseUrl: String(read('MEDIA_BASE_URL', '')).replace(/\/+$/, ''),
  host: read('HOST', '127.0.0.1'),
  sessionTtlHours: Number(read('SESSION_TTL_HOURS', 12)),
  maxUploadBytes: Number(read('MAX_UPLOAD_MB', 32)) * 1024 * 1024,
  maxVideoBytes: Number(read('MAX_VIDEO_MB', 400)) * 1024 * 1024,
  ffmpegPath: read('FFMPEG_PATH', null),
  showLoginHint: readBool('SHOW_LOGIN_HINT', true),
  seedUsers: {
    admin: {
      email: read('ADMIN_EMAIL', 'admin@org.local'),
      password: read('ADMIN_PASSWORD', 'Admin@123'),
      name: 'Content Admin',
    },
    presenter: {
      email: read('PRESENTER_EMAIL', 'presenter@org.local'),
      password: read('PRESENTER_PASSWORD', 'Present@123'),
      name: 'Presenter',
    },
  },
};

export const SESSION_COOKIE = 'op_session';
