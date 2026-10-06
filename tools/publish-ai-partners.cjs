/**
 * Publishes the AI Partners section: one spread per partner, chosen by a turning orbit.
 *
 *   node tools/publish-ai-partners.cjs --dry     # print what would be sent
 *   node tools/publish-ai-partners.cjs           # create or update it, and place it in the deck
 *
 * Creates the section on first run (key `ai-partners`, published, icon `brain`) and places it
 * straight after AI Ready Engineer; later runs only replace its block. Safe to run twice.
 *
 * Sources:
 *   Claude  — claude.technicalhub.io, claude.ncet.co.in, the two Claude success-story sites
 *             (Aditya University, NCET) and the Claude Partner Network announcement. Every figure
 *             is from them: ten Claude-certified architects, 900+ students certified across
 *             four Anthropic courses, 160+ hackathon teams. Photographs are in
 *             uploads/torii-partnership, downloaded so nothing depends on the network.
 *   OpenAI  — the official "OpenAI Select Partner" lockup in uploads/coe. The rest is sample
 *             copy, marked `sample`, until the real programme details arrive.
 *   Sarvam  — sample copy throughout. The mark is the file the user supplied
 *             (uploads/coe/sarvam-original.png), cut to a transparent PNG as coe/sarvam.png.
 *
 * No figure is invented. Where a partner has no numbers, its stats are words.
 */
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'ai-partners';
const TITLE = 'AI Partners';
const AFTER = 'ai-ready-engineer';
const DRY = process.argv.includes('--dry');

const BLOCK = {
  type: 'ai-partners',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  title: 'AI Partners',
  hold: 6000,
  partners: [
    {
      name: 'Claude',
      status: 'Claude Certified Services Partner',
      tag: 'Claude Partner Network',
      mark: 'coe/claude.webp',
      wordmark: 'torii-partnership/claude-certified-services-partner.png',
      headline: ['Certified Services Partner.', 'Claude, across every campus.'],
      body: 'Technical Hub designs, builds and teaches with Claude — official certification, hands-on training, 24/7 AI labs and production apps, delivered by Claude-certified architects and turning multi-hour work into minutes.',
      cards: [
        {
          title: 'Certify & train',
          body: 'Official Anthropic courses — 900+ students certified at Aditya University.',
          tags: ['Claude API', 'Claude Code', 'MCP'],
        },
        {
          title: '24/7 Claude AI Lab',
          body: 'Claude Max on every workstation at NCET, open all year to every learner.',
          tags: ['Claude Max', 'Build', 'Deploy'],
        },
        {
          title: 'Prompt to production',
          body: 'Six college applications built end to end with Claude Code.',
          tags: ['Claude Code', 'Apps', 'Live'],
        },
      ],
      stats: [
        { value: '10', label: 'Claude-certified architects' },
        { value: '900+', label: 'Students certified' },
        { value: '160+', label: 'Hackathon teams' },
      ],
    },
    {
      name: 'OpenAI',
      status: 'OpenAI Select Partner',
      tag: 'Skills for the GPT era',
      mark: 'coe/openai.webp',
      wordmark: 'coe/opneai full.png',
      headline: ['OpenAI Select Partner.', 'Learning that ships.'],
      body: 'As an OpenAI Select Partner, Technical Hub brings OpenAI models into hands-on training — helping students and faculty prototype assistants, automate everyday work and ship AI-powered solutions.',
      cards: [
        {
          title: 'GPT builder labs',
          body: 'Students design, prompt and test assistants on OpenAI models.',
          tags: ['Prompting', 'APIs', 'Agents'],
        },
        {
          title: 'Faculty enablement',
          body: 'Teaching teams use OpenAI tools to plan lessons and build resources.',
          tags: ['FDP', 'Content', 'Assessment'],
        },
        {
          title: 'Industry projects',
          body: 'Real problems solved end to end, from idea to a working demo.',
          tags: ['Build', 'Demo', 'Deploy'],
        },
      ],
      stats: [
        { value: 'Select', label: 'OpenAI partner tier' },
        { value: 'Labs', label: 'Hands-on GPT builds' },
        { value: 'Live', label: 'Industry projects' },
      ],
      sample: true,
    },
    {
      name: 'Sarvam',
      status: 'Sarvam AI Partner',
      tag: 'AI that speaks India',
      mark: 'coe/sarvam.png',
      wordmark: '',
      headline: ['Sarvam AI partner.', 'Built for Bharat.'],
      body: 'With Sarvam AI, Technical Hub helps students build with Indian-language models — voice, translation and multilingual assistants for the communities they come from.',
      cards: [
        {
          title: 'Indic language AI',
          body: 'Students work with models built for Indian languages.',
          tags: ['Telugu', 'Hindi', 'More'],
        },
        {
          title: 'Voice & speech',
          body: 'Speech recognition and voice interfaces for local users.',
          tags: ['Speech', 'Voice', 'Translate'],
        },
        {
          title: 'Bharat-first projects',
          body: 'Solutions designed for rural and tier-2/3 communities.',
          tags: ['Impact', 'Access', 'Scale'],
        },
      ],
      stats: [
        { value: 'Indic', label: 'Language models' },
        { value: 'Voice', label: 'Speech AI' },
        { value: 'Bharat', label: 'First solutions' },
      ],
      sample: true,
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
  if (DRY) {
    console.log(JSON.stringify(BLOCK, null, 2));
    return;
  }
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
    await request('PATCH', `/api/sections/${section.id}`, {
      title: TITLE, iconKey: 'brain', status: 'published', blocks: [BLOCK],
    }, cookie);
    console.log('updated', section.id);
  }

  // Straight after AI Ready Engineer, top-level rows only.
  sections = await list();
  const top = sections.filter((s) => !s.parentId).sort((a, b) => a.order - b.order);
  const rest = top.filter((s) => s.id !== section.id);
  const at = rest.findIndex((s) => s.key === AFTER);
  rest.splice(at >= 0 ? at + 1 : rest.length, 0, top.find((s) => s.id === section.id));
  const children = sections.filter((s) => s.parentId).map((s) => s.id);
  await request('POST', `/api/orgs/${ORG}/sections/reorder`, { order: [...rest.map((s) => s.id), ...children] }, cookie);
  console.log('order:', rest.map((s) => s.title).join(' → '));
})().catch((e) => { console.error(e.message); process.exit(1); });
