/**
 * Publishes the AI Partners section: one landing page per partner, chosen from a side rail.
 *
 *   node tools/publish-ai-partners.cjs --dry     # print what would be sent
 *   node tools/publish-ai-partners.cjs           # create or update it, and place it in the deck
 *
 * Creates the section on first run (key `ai-partners`, published, icon `brain`) and places it
 * straight after AI Ready Engineer; later runs only replace its block. Safe to run twice.
 *
 * Everything is Technical Hub's. Sources:
 *   Claude — claude.technicalhub.io (the ten Claude Certified Architects, names and photographs,
 *            in uploads/ai-partners/architects), the Claude success-story sites (900+ students
 *            certified, 160+ hackathon teams, the 24/7 Claude Max lab) and the Certified
 *            Services Partner announcement (badge cut from it: uploads/ai-partners/).
 *   OpenAI and Sarvam — the points on the Torii Minds AI Partners page, restated for Technical
 *            Hub, with the official lockups downloaded from it into uploads/ai-partners/.
 *
 * No figure is invented: numbers appear only where a source states them.
 */
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'ai-partners';
const TITLE = 'AI Partners';
const AFTER = 'ai-ready-engineer';
const DRY = process.argv.includes('--dry');
const A = 'ai-partners/';
const T = 'torii-partnership/thumbs/';

const ARCHITECTS = [
  ['01-harshavardhini', 'Harshavardhini'],
  ['02-prasanth', 'Prasanth'],
  ['03-bobby-pamarthi', 'Bobby Pamarthi'],
  ['04-peter', 'Peter'],
  ['05-sudhir', 'Sudhir'],
  ['06-akhilesh', 'Akhilesh'],
  ['07-bhargav', 'Bhargav'],
  ['08-kishore-girijala', 'Kishore Girijala'],
  ['09-naveen', 'Naveen'],
  ['10-azar', 'Azar'],
];

const BLOCK = {
  type: 'ai-partners',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  title: 'AI Partners',
  hold: 9000,
  partners: [
    {
      name: 'Claude',
      short: 'Claude',
      status: 'Claude Certified Services Partner',
      tagline: 'Applied AI, agents & assistants',
      accent: '#B5532F',
      badge: `${A}claude-certified-services-partner.png`,
      mark: 'coe/claude.webp',
      headline: ['Certified Services Partner of', 'Claude'],
      body: 'Technical Hub designs, builds and teaches with Claude — official certification, hands-on training, a 24/7 Claude AI Lab and production apps, delivered by our own Claude-certified architects.',
      strip: [
        { icon: 'seal-check', label: 'Standing', value: 'Certified Services Partner' },
        { icon: 'users', label: 'Team', value: '10 certified architects' },
        { icon: 'clock', label: 'AI Lab', value: '24/7 Claude Max' },
      ],
      photos: [
        { src: 'torii-partnership/ncet-home-image.jpg', caption: 'The Claude wall, NCET AI Lab' },
        { src: 'torii-partnership/aditya-cert-crowd.jpg', caption: '900+ students certified' },
      ],
      circles: {
        title: 'Claude Certified Architects',
        sub: 'Ten certified experts who design, build and teach with Claude — the team behind every engagement',
        items: ARCHITECTS.map(([file, name]) => ({ label: name, sub: 'Claude Architect', photo: `${A}architects/face/${file}.png` })),
      },
      cardsTitle: 'What we do with Claude',
      cardsSub: 'From the classroom to production, on campuses across the region',
      cards: [
        { title: 'Certify & train', body: 'Official Anthropic courses — 900+ students certified at Aditya University.', photo: `${T}aditya-cert-crowd.jpg`, badge: '900+ certified', tags: ['Claude API', 'MCP'] },
        { title: '24/7 Claude AI Lab', body: 'Claude Max on every workstation at NCET, open all year to every learner.', photo: `${T}ncet-ai-lab-1.jpg`, badge: 'Open 24/7', tags: ['Claude Max', 'Build'] },
        { title: 'Project Space hackathon', body: '160+ student teams built with Claude; the top teams won Claude credits.', photo: `${T}aditya-hackathon-stage.jpg`, badge: '160+ teams', tags: ['Hackathon', 'Deploy'] },
        { title: 'Faculty development', body: 'Educators use Claude for course design, assessments and research.', photo: `${T}aditya-fdp.jpg`, badge: 'FDP', tags: ['Curriculum', 'Research'] },
      ],
    },
    {
      name: 'OpenAI',
      short: 'OpenAI',
      status: 'OpenAI Select Partner',
      tagline: 'Generative AI & LLMs',
      accent: '#0D7A5F',
      badge: `${A}openai-select-partner.jpeg`,
      mark: 'coe/openai.webp',
      headline: ['Select Partner of', 'OpenAI'],
      body: 'As an OpenAI Select Partner, Technical Hub runs a Centre of Excellence on campus and carries generative AI through the AI Ready Engineer programme.',
      strip: [
        { icon: 'seal-check', label: 'Standing', value: 'Select Partner' },
        { icon: 'building', label: 'On campus', value: 'Centre of Excellence' },
        { icon: 'ai-figure', label: 'Programme', value: 'AI Ready Engineer' },
      ],
      circles: {
        title: 'Where OpenAI shows up',
        sub: 'Across the partnership, the campus and the curriculum',
        items: [
          { label: 'Select Partner', icon: 'handshake-check' },
          { label: 'Centre of Excellence', icon: 'building' },
          { label: 'AI Ready Engineer', icon: 'ai-figure' },
          { label: 'Generative AI', icon: 'sparkles' },
          { label: 'Codex', icon: 'code' },
          { label: 'The 3 C’s', icon: 'layers' },
        ],
      },
      /* No OpenAI photographs exist, so these are feature cards — points from the partnership
         and the success stories, each with its icon. */
      cardsTitle: 'What we do with OpenAI',
      cardsSub: 'The partnership in practice — on campus and in the curriculum',
      cards: [
        { title: 'Select Partner', body: 'Select Partner — the tier printed on the official OpenAI lockup.', icon: 'seal-check', badge: 'Partnership', tags: ['Official'] },
        { title: 'Centre of Excellence', body: 'A Centre of Excellence partner on campus, where students build with generative AI.', icon: 'building', badge: 'On campus', tags: ['CoE', 'GenAI'] },
        { title: 'AI Ready Engineer', body: 'Generative AI runs through the AI Ready Engineer programme, foundations to delivery.', icon: 'ai-figure', badge: 'Curriculum', tags: ['Programme'] },
        { title: 'The 3 C’s', body: 'Codex taught beside Claude and Copilot — AI pair-programming, side by side.', icon: 'code', badge: 'AI pair', tags: ['Codex', 'Copilot'] },
      ],
    },
    {
      name: 'Sarvam AI',
      short: 'Sarvam',
      status: 'Sarvam AI Partner',
      tagline: 'Indian-language foundation models',
      accent: '#3346B8',
      badge: `${A}sarvam-ai.jpeg`,
      mark: 'coe/sarvam.png',
      headline: ['Building India’s AI with', 'Sarvam'],
      body: 'With Sarvam AI, Technical Hub brings India’s own foundation models into the classroom — Indian-language, voice and open-weight models that students build real applications on.',
      strip: [
        { icon: 'seal-check', label: 'Standing', value: 'AI Partner' },
        { icon: 'globe', label: 'Focus', value: 'Indian-language AI' },
        { icon: 'code', label: 'Models', value: 'Open weights' },
      ],
      circles: {
        title: 'What Sarvam brings',
        sub: 'Foundation models made in India, for India’s languages',
        items: [
          { label: 'Indian Languages', icon: 'globe' },
          { label: 'Voice AI', icon: 'volume' },
          { label: 'Sovereign AI', icon: 'flag' },
          { label: 'Open Weights', icon: 'code' },
          { label: 'Developer Platform', icon: 'tap-network' },
          { label: 'AI Partner', icon: 'handshake-check' },
        ],
      },
      cardsTitle: 'Building for Bharat',
      cardsSub: 'Indic-language AI for the students and communities we serve',
      cards: [
        { title: 'Indian languages', body: 'Foundation models built for India’s languages, made in India — for rural and tier-2/3 talent.', icon: 'globe', badge: 'Indic', tags: ['Multilingual'] },
        { title: 'Voice AI', body: 'Speech recognition and speech synthesis for Indian languages.', icon: 'volume', badge: 'Speech', tags: ['Voice'] },
        { title: 'Sovereign AI', body: 'Selected under the IndiaAI Mission to build India’s own foundation model.', icon: 'flag', badge: 'IndiaAI Mission', tags: ['Made in India'] },
        { title: 'Developer platform', body: 'Open-weight models, APIs and agent tooling that students build real applications on.', icon: 'tap-network', badge: 'Open weights', tags: ['APIs', 'Agents'] },
      ],
    },
  ],
};

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
      title: TITLE, key: KEY, iconKey: 'brain', status: 'published', blocks: [BLOCK],
    }, cookie)).json.section;
    console.log('created', section.id);
  } else {
    await request('PATCH', `/api/sections/${section.id}`, { title: TITLE, iconKey: 'brain', status: 'published', blocks: [BLOCK] }, cookie);
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
