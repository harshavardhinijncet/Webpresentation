/**
 * Publishes the Team section: the whole Technical Hub team as a connected network of round
 * portraits, with an "Entire team" / "Claude-certified architects" switch.
 *
 *   node tools/publish-team.cjs --dry     # print what would be sent
 *   node tools/publish-team.cjs           # create or update it, placed after Leadership Journey
 *
 * Portraits: "team updated png.zip", put into Technical Hub shirts by tools/recolour-team.cjs
 * and written to uploads/team/<name>.webp. Kishore Girijala's comes from the AI Partners
 * architects (run with --green). Names follow the ones already used on AI Partners. Babji
 * Neelam, at the centre, is uploads/babji_hero_crop.png as team/hub-babji-neelam.webp.
 */
const http = require('http');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'trainers';
const TITLE = 'Team';
const ICON = 'users';
const AFTER = 'leadership-journey';
const DRY = process.argv.includes('--dry');

// File name → display name. Where AI Partners already names someone, the same name is used.
const NAMES = {
  azarunnisa: 'Azar', bhargava: 'Bhargav', bobby: 'Bobby Pamarthi', kishore: 'Kishore Girijala',
  'prasanth-sir': 'Prasanth', 'kiran-chaithu': 'Kiran Chaithu', 'veera-babu': 'Veera Babu',
};
// The ten Claude-certified architects, in the order AI Partners lists them.
const ARCHITECTS = ['harshavardhini', 'prasanth-sir', 'bobby', 'peter', 'sudhir', 'akhilesh', 'bhargava', 'kishore', 'naveen', 'azarunnisa'];
const title = (k) => NAMES[k] || k.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const DIR = path.join(__dirname, '..', 'backend', 'uploads', 'team');
const keys = fs.readdirSync(DIR).filter((f) => f.endsWith('.webp') && !f.startsWith('hub-')).map((f) => f.slice(0, -5)).sort();

// Where the head sits across the cut-out, as a percentage — the round avatar centres on it.
function headX(file) {
  const W = 80;
  const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim().split(',').map(Number);
  const H = Math.round((h / w) * W);
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-']);
  let sum = 0, n = 0;
  for (let y = Math.round(H * 0.04); y < Math.round(H * 0.22); y += 1) for (let x = 0; x < W; x += 1) {
    if (px[(y * W + x) * 4 + 3] > 128) { sum += x; n += 1; }
  }
  return n ? Math.round((sum / n / W) * 1000) / 10 : 50;
}

// Architects are dealt in among the rest, so the whole-team network mixes them.
const arch = ARCHITECTS.filter((k) => keys.includes(k));
const rest = keys.filter((k) => !arch.includes(k));
const order = [];
const step = rest.length / arch.length;
arch.forEach((k, i) => { order.push(...rest.slice(Math.round(i * step), Math.round((i + 1) * step))); order.splice(order.length - Math.floor(step / 2), 0, k); });
const members = order.map((k) => ({ photo: `team/${k}.webp`, name: title(k), architect: arch.includes(k), focus: headX(path.join(DIR, `${k}.webp`)), rank: arch.indexOf(k) + 1 }));

const BLOCK = {
  type: 'team-wall',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  headline: ['The trainers behind', 'every engineer'],
  body: 'One team, connected by Claude — trainers and certified architects who teach, mentor and build alongside every Technical Hub cohort.',
  allLabel: 'Entire team',
  architectsLabel: 'Claude-certified architects',
  // Babji Neelam stands at the centre; every connection runs through him.
  hub: { photo: 'team/hub-babji-neelam.webp', name: 'Babji Neelam', role: 'Founder & CEO', focus: headX(path.join(DIR, 'hub-babji-neelam.webp')) },
  connectors: ['Claude Code', 'MCP', 'Agent Skills', 'Claude API', 'Artifacts', 'Projects', 'Agent SDK', 'Connectors'],
  members,
};

function request(method, p, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      ...HOST, method, path: p,
      headers: {
        ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { cookie } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch { /* not json */ }
        if (res.statusCode >= 400) reject(new Error(`${method} ${p} → ${res.statusCode} ${data.slice(0, 300)}`));
        else resolve({ json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  if (DRY) { console.log(JSON.stringify(BLOCK, null, 2)); return; }
  const login = await request('POST', '/api/auth/login', { email: 'admin@org.local', password: 'Admin@123' });
  const cookie = String(login.headers['set-cookie'] || '').split(';')[0];
  const list = async () => (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json.sections;
  let sections = await list();
  let section = sections.find((s) => s.key === KEY);
  if (!section) {
    section = (await request('POST', `/api/orgs/${ORG}/sections`, { title: TITLE, key: KEY, iconKey: ICON, status: 'published', blocks: [BLOCK] }, cookie)).json.section;
    console.log('created', section.id);
  } else {
    await request('PATCH', `/api/sections/${section.id}`, { title: TITLE, iconKey: ICON, status: 'published', blocks: [BLOCK] }, cookie);
    console.log('updated', section.id);
  }
  sections = await list();
  const top = sections.filter((s) => !s.parentId).sort((a, b) => a.order - b.order);
  const rest = top.filter((s) => s.id !== section.id);
  const at = rest.findIndex((s) => s.key === AFTER);
  rest.splice(at >= 0 ? at + 1 : rest.length, 0, top.find((s) => s.id === section.id));
  const children = sections.filter((s) => s.parentId).map((s) => s.id);
  await request('POST', `/api/orgs/${ORG}/sections/reorder`, { order: [...rest.map((s) => s.id), ...children] }, cookie);
  console.log('order:', rest.map((s) => s.title).join(' → '));
})().catch((e) => { console.error(e.message); process.exit(1); });
