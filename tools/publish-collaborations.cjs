/**
 * Publishes Technical Hub Collaborations: the partner wall, then one card per partner — the
 * announcement image beside what the collaboration covers.
 *
 *   node tools/publish-collaborations.cjs --dry     # print what would be sent
 *   node tools/publish-collaborations.cjs           # create or update it, placed after Torii
 *
 * Sources: the announcement images supplied for each partner (uploads/collaborations/) and
 * Technical Hub's own LinkedIn posts for each — the points below restate those posts, they do
 * not add to them. College logos are the Trusted By files from the Torii application
 * (uploads/th-torii/trusted-by/); Claude Partner Network and Fab are cut from their
 * announcement images (uploads/collaborations/logos/). SRKR's post has not been supplied yet,
 * so its points are drafted from the other college MoUs — replace them when it arrives.
 */
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'collaborations';
const TITLE = 'Collaborations';
const ICON = 'partners';
const AFTER = 'torii';
const DRY = process.argv.includes('--dry');
const C = 'collaborations/';
const TB = 'th-torii/trusted-by/';

/* The ten services Technical Hub's Claude-certified engineers bring under its Claude MoUs
   (NCET, Torii Minds), grouped into the six things they amount to. */
const CLAUDE_MOU = [
  { icon: 'building', title: 'Claude Centre of Excellence', body: 'A CoE programme run by Claude-certified engineers.' },
  { icon: 'workflow', title: 'Agentic platforms', body: 'Internal agentic platforms and industry solution accelerators.' },
  { icon: 'rocket', title: 'AI products & POCs', body: 'Customer-facing products, prototypes and proofs of concept.' },
  { icon: 'compass', title: 'Strategy & readiness', body: 'AI roadmap consulting and readiness assessment.' },
  { icon: 'server', title: 'Run & migrate', body: 'Managed AI operations and platform migration to Claude.' },
  { icon: 'graduation', title: 'Training & enablement', body: 'Claude training programmes for every team.' },
];

const BLOCK = {
  type: 'collab-wall',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  content: {
    logo: 'torii-partnership/ncet-logo-thub.png',
    kicker: 'Technical Hub · Collaborations',
    title: 'Built together',
    lead: 'The colleges, companies and AI platforms that work with Technical Hub — each one an MoU or a partnership, signed and running.',
    goLabel: 'Explore every collaboration',
    bandLabel: 'Collaborations',
    hold: 9000,
    wallHold: 5200,
    partners: [
      {
        name: 'Anthropic — Claude',
        theme: { primary: '#b8573a', accent: '#f0c9a8', ink: '#a24a2f' },
        kind: 'Claude Partner Network',
        icon: 'seal-check',
        logo: `${C}logos/claude-partner-network.png`,
        images: [`${C}claude-partner-network.jpg`, `${C}claude-certified.jpg`],
        summary: 'New chapter, same purpose: Technical Hub is part of the Claude Partner Network — and its job is still to help the community grow with AI.',
        points: [
          { icon: 'seal-check', title: 'Certified Services Partner', body: 'Recognised inside the Claude Partner Network.' },
          { icon: 'users', title: 'Certified architects', body: 'Ten Claude Certified Architects on the team.' },
          { icon: 'building', title: 'Claude on campus', body: 'Labs and Centres of Excellence at partner colleges.' },
          { icon: 'heart', title: 'Same purpose', body: 'Helping the community grow with AI.' },
        ],
      },
      {
        name: 'OpenAI',
        theme: { primary: '#141414', accent: '#c9c9c9', ink: '#141414' },
        kind: 'OpenAI Select Partner',
        icon: 'seal-check',
        logo: 'collaborations/logos/trim/openai-select-partner-inner.png',
        images: [`${C}openai.jpg`],
        summary: 'Named an OpenAI Select Partner, as part of the OpenAI Partner Network.',
        points: [
          { icon: 'seal-check', title: 'Select Partner', body: 'A member of the OpenAI Partner Network.' },
          { icon: 'rocket', title: 'Build · deploy · scale', body: 'Helping organisations put AI solutions to work.' },
          { icon: 'shield', title: 'Responsibly', body: 'AI delivered responsibly and effectively.' },
          { icon: 'briefcase', title: 'Enterprise AI', body: 'Solutions built for organisations, end to end.' },
        ],
      },
      {
        name: 'Torii Minds',
        theme: { primary: '#c94a1b', accent: '#141414', ink: '#a33a12' },
        kind: 'MoU · Claude AI ecosystem',
        icon: 'handshake-check',
        logo: 'torii-partnership/th-logo-toriiminds.png',
        logoScale: 0.82,
        logoBg: '#111111',
        images: [`${C}torii-announcement.jpg`, `${C}torii-claude-team.jpg`],
        summary: 'A strong Claude AI ecosystem for the Torii team — with a hand-picked, Claude-certified team from Technical Hub embedded inside it.',
        points: [
          { icon: 'users', title: 'An embedded certified team', body: 'Claude-certified experts working inside Torii.' },
          ...CLAUDE_MOU.slice(0, 5),
        ],
      },
      {
        name: 'Nagarjuna College of Engineering & Technology',
        theme: { primary: '#007848', accent: '#90d848', ink: '#006a40' },
        kind: 'MoU · Claude AI ecosystem',
        place: 'NCET',
        icon: 'handshake-check',
        logo: `${TB}nagarjuna-college-of-engineering-and-technology.png`,
        images: [`${C}ncet.jpg`],
        summary: 'A Claude AI ecosystem on campus — and an AI-ready lab where faculty and students build real projects with Claude Code.',
        points: [
          { icon: 'chip', title: 'Claude AI lab', body: 'Hands-on, practical and production-focused.' },
          { icon: 'graduation', title: 'Faculty & students trained', body: 'Claude Code, prompt to shipped app.' },
          CLAUDE_MOU[0],
          CLAUDE_MOU[2],
          CLAUDE_MOU[3],
          CLAUDE_MOU[4],
        ],
      },
      {
        name: 'Geeta University',
        theme: { primary: '#183078', accent: '#f06018', ink: '#183078' },
        kind: 'MoU · Industry Technology Partner',
        icon: 'handshake-check',
        logo: `${TB}geeta-university.png`,
        logoScale: 0.84,
        images: [`${C}geeta.jpg`],
        summary: 'Technical Hub as Geeta University’s Industry Technology Partner — building a future-ready learning ecosystem with AI at its centre.',
        points: [
          { icon: 'chip', title: 'An AI Lab', body: 'Established on campus.' },
          { icon: 'building', title: 'In-campus IT company', body: 'Real industry work, inside the university.' },
          { icon: 'sparkles', title: 'Claude AI services', body: 'Anthropic Claude deployed for the campus.' },
          { icon: 'beaker', title: 'Innovation & research', body: 'Initiatives that start on campus.' },
          { icon: 'book', title: 'Industry-aligned curriculum', body: 'Courses designed with industry.' },
          { icon: 'rocket', title: 'Industry readiness', body: 'Emerging-tech training and skill development.' },
        ],
      },
      {
        name: 'Yeshwantrao Chavan College of Engineering',
        theme: { primary: '#b00000', accent: '#d8b45c', ink: '#a00000' },
        kind: 'MoU · Industry Technology Partner',
        place: 'Nagpur',
        icon: 'handshake-check',
        logo: 'collaborations/logos/trim/ycce.png',
        images: [`${C}ycce.jpg`],
        summary: 'Industry–academia collaboration that closes the gap between what students learn and what industry expects.',
        points: [
          { icon: 'briefcase', title: 'Industry Technology Partner', body: 'Technical Hub alongside YCCE.' },
          { icon: 'layers', title: 'Future-ready ecosystem', body: 'A learning ecosystem built for what comes next.' },
          { icon: 'target', title: 'Industry-relevant skills', body: 'Students trained for the roles that exist.' },
          { icon: 'link', title: 'Academia meets industry', body: 'The technology gap, bridged.' },
        ],
      },
      {
        name: 'SRKR Engineering College',
        theme: { primary: '#861818', accent: '#e8913a', ink: '#861818' },
        kind: 'SkillUp Coder 2029',
        icon: 'handshake-check',
        logo: `${TB}srkr-engineering-college.png`,
        /* The collaboration, then the programme's launch in the order it happened: orientation,
           registrations, the assessment round, and the cohorts taking off. */
        images: [
          `${C}srkr.jpg`,
          `${C}srkr/01-orientation.jpg`,
          `${C}srkr/02-registrations.jpg`,
          `${C}srkr/03-assessment.jpg`,
          `${C}srkr/04-take-off.jpg`,
          `${C}srkr/07-coding-lab.jpg`,
          `${C}srkr/08-attendance-check-in.jpg`,
          `${C}srkr/09-lab-session.jpg`,
          `${C}srkr/10-assessment-lab.jpg`,
          `${C}srkr/11-coding-floor.jpg`,
          `${C}srkr/12-assessment-round.jpg`,
        ],
        /* From the programme's own posts: SkillUp Coder 2029 at SRKR, run by Torii Minds in
           association with Technical Hub. */
        summary: 'SkillUp Coder 2029 at SRKR — run with Torii Minds, in association with Technical Hub, exclusively for the 2029 batch.',
        points: [
          { icon: 'rocket', title: 'SkillUp Coder 2029', body: 'A coding programme for the 2029 batch.' },
          { icon: 'users', title: '1000+ registrations', body: 'A strong start to the coding journey.' },
          { icon: 'message', title: 'Orientation session', body: 'The whole batch, briefed in the auditorium.' },
          { icon: 'clipboard-check', title: 'Assessment rounds', body: 'Round 2, taken in the labs.' },
          { icon: 'graduation', title: 'Cohorts take off', body: 'Cohorts 1 to 4, coding hands-on.' },
          { icon: 'handshake-check', title: 'With Torii Minds', body: 'Delivered by Torii, with Technical Hub.' },
        ],
      },
      {
        name: 'Fab For All — Beauty',
        theme: { primary: '#603030', accent: '#d9b36a', ink: '#603030' },
        kind: 'MoU · Technology partner',
        icon: 'handshake-check',
        logo: `${C}logos/trim/fab.png`,
        logoBg: '#5c3329',
        images: [`${C}fab.jpg`],
        summary: 'Turning ideas into digital success — a strategic MoU for technology, AI and digital growth.',
        points: [
          { icon: 'code', title: 'Technology solutions', body: 'Innovative builds for a growing business.' },
          { icon: 'sparkles', title: 'AI-driven services', body: 'AI put to work across the business.' },
          { icon: 'trend-up', title: 'Digital marketing', body: 'Strategies made for a digital world.' },
          { icon: 'layers', title: 'Scalable impact', body: 'Solutions that grow with the brand.' },
        ],
      },
    ],
  },
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
