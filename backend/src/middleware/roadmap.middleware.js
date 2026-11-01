import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ROADMAP_DIR, DATA_DIR } from '../config/paths.js';
import { resolveUser } from './auth.middleware.js';
import { sendJson } from '../utils/http.js';

/**
 * The Engineer Roadmap's API, answered the way its own Express server answers it.
 *
 * All of the roadmap's content is one ES module, roadmap/data/roadmap.js (it imports legacy.js
 * beside it). It is loaded once on first use; after `tools/sync-roadmap.cjs` brings in new
 * content, restart the server to pick it up.
 */
const DATA_FILE = path.join(ROADMAP_DIR, 'data', 'roadmap.js');
let loaded = null;

async function roadmap() {
  if (!loaded) loaded = import(pathToFileURL(DATA_FILE).href).then((m) => m.default);
  return loaded;
}

/* The certifications site's own login, for the roadmap's copy buttons. It lives only in a git-ignored
   file on this machine (the repository is public) and is given only to a signed-in presenter. */
const ACCESS_FILE = path.join(DATA_DIR, 'cert-access.local.json');
function serveCertAccess(req, res) {
  if (!resolveUser(req)) { sendJson(res, 401, { error: 'Please sign in to continue' }); return; }
  let a = null;
  try { a = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8')); } catch { /* not set up on this machine */ }
  if (!a?.user || !a?.pass) { sendJson(res, 404, { error: 'Fill in backend/data/cert-access.local.json' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  sendJson(res, 200, { url: a.url, user: a.user, pass: a.pass });
}

export async function serveRoadmapApi(req, res, pathname) {
  if (req.method !== 'GET' || !pathname.startsWith('/api/')) return false;
  if (pathname === '/api/cert-access') { serveCertAccess(req, res); return true; }
  if (!/^\/api\/(roadmap|semesters\/[^/]+|library\/[^/]+)$/.test(pathname)) return false;
  if (!fs.existsSync(DATA_FILE)) {
    sendJson(res, 404, { error: 'The roadmap has not been copied in — run tools/sync-roadmap.cjs' });
    return true;
  }
  const data = await roadmap();
  if (pathname === '/api/roadmap') {
    sendJson(res, 200, data);
    return true;
  }
  const [, kind, key] = pathname.split('/').slice(1);
  const found = kind === 'semesters'
    ? data.semesters.find((s) => s.id === decodeURIComponent(key))
    : data.library[decodeURIComponent(key)];
  sendJson(res, found ? 200 : 404, found || { error: kind === 'semesters' ? 'No such semester' : 'No such item' });
  return true;
}
