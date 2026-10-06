/**
 * Publishes the Torii section: Technical Hub × Torii Minds, in two tabs — the partnership
 * story and the 24/7 Claude AI Lab.
 *
 *   node tools/publish-torii.cjs --dry     # print what would be sent
 *   node tools/publish-torii.cjs           # create or update it, and place it in the deck
 *
 * Creates the section on first run (key `torii`, published, icon `link`) straight after
 * AI Partners; later runs only replace its block. Safe to run twice.
 *
 * Sources — all photographs are in backend/uploads/torii-partnership/:
 *   claude.technicalhub.io, claude.ncet.co.in and the two Claude success-story sites
 *   (Aditya University, NCET): copy, facts and photographs.
 *   The Claude Partner Network announcement: `milestone-certified-services-partner-original.png`,
 *   kept whole; the badge shown on the page is cut from it (`claude-certified-services-partner.png`).
 */
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'torii';
const TITLE = 'Torii';
const ICON = 'link';
const AFTER = 'ai-partners';
const DRY = process.argv.includes('--dry');
const D = 'torii-partnership/';

const BLOCK = {
  type: 'partnership',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  title: 'Torii',
  hold: 3500,
  lockup: {
    left: { name: 'Technical Hub', logo: `${D}ncet-logo-thub.png` },
    right: { name: 'Torii Minds', logo: `${D}th-logo-toriiminds.png`, dark: true },
  },
  milestone: {
    label: 'New milestone',
    text: 'Technical Hub is now a Certified Services Partner of Anthropic — Claude, in the Claude Partner Network.',
    badge: `${D}claude-certified-services-partner.png`,
  },
  overview: {
    tag: 'Claude Partner Network',
    headline: ['Technical Hub × Torii Minds', 'One AI-native team, built on Claude.'],
    body: 'Torii Minds works alongside Technical Hub to take Claude from the lab into every campus it serves — the team behind NTSquare at NCET, the AI Tech Coach Skill Sprint and Myna. A whole workforce made AI-native, now shipping its own Claude-powered products and training at industry standard.',
    highlights: [
      { icon: 'users', title: '100% AI-skilled team', body: 'A fully AI-assisted development pipeline, end to end.' },
      { icon: 'layers', title: 'Five-module curriculum', body: 'From Claude foundations to training-delivery practice.' },
      { icon: 'phone', title: 'Myna, live on both stores', body: 'An AI-powered LSRW platform on Play Store and App Store.' },
      { icon: 'rocket', title: 'AI Tech Coach Skill Sprint', body: 'A 60-hour sprint, launched at NCET.' },
    ],
    photos: [
      { src: `${D}torii-team-trim.jpg`, title: 'The Torii Minds team', caption: 'The minds behind NTSquare' },
      { src: `${D}aitech-launch.jpg`, title: 'AI Tech Coach launch', caption: 'Unveiling the 60-hour Skill Sprint' },
      { src: `${D}ncet-home-image.jpg`, title: 'The Claude wall', caption: 'Students in the 24/7 AI Lab, NCET' },
      { src: `${D}aitech-hall.jpg`, title: 'Skill Sprint in session', caption: 'Learn · Innovate · Implement · Lead with AI' },
      { src: `${D}aditya-cert-crowd.jpg`, title: '900+ students certified', caption: 'Anthropic courses at Aditya University' },
      { src: `${D}ntsquare-banner.jpg`, title: 'NTSquare at NCET', caption: 'Where learning meets industry' },
      { src: `${D}hero-campus.jpg`, title: 'Claude on campus', caption: 'The Claude stall at NCET' },
      { src: `${D}ncet-story-kiosk.jpg`, title: 'Claude awareness programme', caption: 'A packed hall, three days running' },
      { src: `${D}aditya-hackathon-stage.jpg`, title: 'Project Space, Season 8', caption: '160+ teams building with Claude' },
      { src: `${D}th-mg-0186.webp`, title: 'Project Street', caption: 'Builds defended in the open' },
      { src: `${D}aditya-winners.jpg`, title: 'Project Space winners', caption: 'Top teams won Claude credits' },
      { src: `${D}th-img-0495.webp`, title: 'Project Week', caption: 'Ideas turned into working builds' },
    ],
  },
  lab: {
    tabLabel: 'AI Lab',
    // The card's live badge and stats. "4 skill forges" is NCET's own count.
    live: '24/7',
    /* The phone's finish: 'classic' (tinted glass, fine coral edge) or 'neon' (clear glass,
       lit-tube rim, inner bezel, drifting lights). Change it here and re-run to switch. */
    cardStyle: 'neon',
    place: 'NCET',
    /* The intro's hand: set this to a transparent PNG under uploads to have the phone held.
       Left empty, the phone floats on its own. */
    hand: '',
    mark: 'coe/claude.webp',
    note: 'Claude Max, every seat',
    avatar: `${D}thumbs/ncet-ai-lab-1.jpg`,
    stats: [
      { icon: 'chip', value: 'Max', label: 'On every seat' },
      { icon: 'clock', value: '24/7', label: 'Open all year' },
      { icon: 'layers', value: '4', label: 'Skill forges' },
    ],
    tag: 'Claude Max · Open 24/7',
    title: 'The 24/7 Claude AI Lab',
    body: 'Ordinary computer rooms at NCET, reimagined as AI workbenches. Every workstation runs a Claude Max account — open all year to every student, faculty member, trainer and developer.',
    facts: [
      { icon: 'chip', label: 'Claude Max on every machine' },
      { icon: 'clock', label: 'Open 24/7, all year' },
      { icon: 'rocket', label: 'Build · Train · Deploy' },
      { icon: 'users', label: 'Students, faculty & developers' },
    ],
    slides: [
      { src: `${D}ncet-home-image.jpg`, title: 'The Claude wall', caption: 'Students at the heart of the lab.' },
      { src: `${D}ncet-ai-lab-1.jpg`, title: 'The 24/7 AI Lab', caption: 'Claude Max on every workstation, open all year.' },
      { src: `${D}ncet-ai-lab-4.jpg`, title: 'Inauguration', caption: 'The 24/7 AI Lab opens, every system on.' },
      { src: `${D}ncet-ai-lab-5.jpg`, title: 'Opening day', caption: 'Guests at the workstations on day one.' },
      { src: `${D}ncet-ai-lab-2.jpg`, title: 'AI Ready Engineer zone', caption: 'Workstations under the AI Ready Engineer wall.' },
      { src: `${D}ncet-ai-lab-3.jpg`, title: 'Claude workbenches', caption: 'Focused, individual workstations for building with Claude.' },
      { src: `${D}lab-learn-build.png`, short: 'Skill Forge', title: 'AI Skill Forge', caption: 'Learn · Build · Innovate · Excel.' },
      { src: `${D}lab-ai-ready.png`, short: 'AI Ready', title: 'AI Ready Engineer Forge', caption: 'Build · Train · Deploy — Claude-assisted at every step.' },
      { src: `${D}lab-domains.png`, short: 'AI Domains', title: 'AI Domains Forge', caption: 'ML · DL · CV · NLP · Robotics.' },
      { src: `${D}lab-build-smarter.png`, short: 'Collab', title: 'Collaboration Forge', caption: 'Together we build smarter.' },
      { src: `${D}enrichment-lab.png`, short: 'Studio', title: 'Innovation Studio', caption: 'Ideate · Prototype · Refine.' },
      { src: `${D}ncet-ai-lab-6.jpg`, title: 'AR roadmap wall', caption: 'An AR-enabled AI Ready Engineer roadmap — scan the wall, learn the skill.' },
      { src: `${D}ncet-ai-lab-7.jpg`, title: 'AI Centre of Excellence', caption: 'The lab’s centre-of-excellence wall at NCET.' },
    ],
  },
};

/* Each photograph's small copy, made by ffmpeg into torii-partnership/thumbs/ at 360px. */
const fs = require('fs');
const pathMod = require('path');
const UPLOADS = pathMod.join(__dirname, '..', 'backend', 'uploads');
const thumbOf = (src) => {
  const t = `${D}thumbs/${pathMod.basename(src).replace(/\.[^.]+$/, '')}.jpg`;
  return fs.existsSync(pathMod.join(UPLOADS, t)) ? t : '';
};
for (const list of [BLOCK.overview.photos, BLOCK.lab.slides]) {
  for (const p of list) p.thumb = thumbOf(p.src);
}

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      ...HOST, method, path,
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
        if (res.statusCode >= 400) reject(new Error(`${method} ${path} → ${res.statusCode} ${data.slice(0, 300)}`));
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
    section = (await request('POST', `/api/orgs/${ORG}/sections`, {
      title: TITLE, key: KEY, iconKey: ICON, status: 'published', blocks: [BLOCK],
    }, cookie)).json.section;
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
