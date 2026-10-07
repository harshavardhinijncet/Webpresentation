/**
 * Publishes the AI Ready Engineer section as a three-page brochure: the road map, the course
 * structure and the benefits.
 *
 *   node tools/publish-ai-ready.cjs --dry     # print what would be sent
 *   node tools/publish-ai-ready.cjs           # replace the section's block
 *
 * The copy is the programme's own, carried over from the earlier course deck. The road map is
 * the AI Ready Engineer road map (claude.ncet.co.in), cropped to the road itself — its printed
 * headline and the QR strip are left to the page's own type. Assets: uploads/ai-ready/.
 *
 * The sixteen modules keep their published order; they are shown in four phases of four.
 */
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'ai-ready-engineer';
const DRY = process.argv.includes('--dry');

const BLOCK = {
  type: 'ai-ready-deck',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  title: 'AI Ready Engineer',
  eyebrow: 'Technical Hub · in association with Torii',
  kicker: 'From engineers to AI Ready Engineers',
  logo: 'ai-ready/ai-ready-logo-white.png',
  roadmap: 'ai-ready/roadmap-road.jpg',
  headline: ['Road map to become an', 'AI Ready Engineer'],
  standfirst: 'An intensive, hands-on journey from language-model foundations to shipping production-grade, agentic AI products.',
  partners: ['Claude Partner Network', 'OpenAI Select Partner'],
  stats: [
    { value: '16', label: 'Modules, end to end', icon: 'layers' },
    { value: '200 hrs', label: 'Hands-on learning', icon: 'clock' },
    { value: '50+', label: 'AI tools & platforms', icon: 'tools' },
    { value: 'Claude', label: 'Certified Associate', icon: 'certificate' },
  ],
  course: {
    eyebrow: 'The curriculum',
    title: '16 Modules. End to End.',
    subtitle: 'The complete modern AI stack — foundations to deployment.',
  },
  highlights: [
    { title: '200-hour learning journey', body: 'Structured, hands-on training across the full AI stack.', icon: 'clock' },
    { title: 'Taught by AI-certified experts', body: 'Every module led by Claude-certified practitioners.', icon: 'certificate' },
    { title: 'Internship completion letter', body: 'Issued by our AI partners.', icon: 'document' },
    { title: 'Industry-ready engineers', body: 'Mentored by working engineers, job-ready on day one.', icon: 'users' },
    { title: 'AIRE learning platform', body: 'Live classes, assessments and progress in one portal.', icon: 'grid-4' },
    { title: 'Real AI projects', body: 'Build and ship AI products, from prompt to deployment.', icon: 'rocket' },
  ],
  phases: [
    { name: 'Foundations', modules: [
      { title: 'LLM Foundation', body: 'How large language models think, learn and respond.', icon: 'brain' },
      { title: 'Generative AI', body: 'Creating text, images and code with AI models.', icon: 'sparkles' },
      { title: 'AI Tools', body: 'The everyday AI toolkit for engineers.', icon: 'tools' },
      { title: 'Prompt Engineering', body: 'Precise prompts that get dependable results.', icon: 'message' },
    ] },
    { name: 'Build', modules: [
      { title: 'GitHub & Version Control', body: 'Branches, reviews and team workflows.', icon: 'git-branch' },
      { title: 'Vibe Coding', body: 'Building software in partnership with AI.', icon: 'code' },
      { title: 'Database', body: 'Designing and querying the data layer.', icon: 'database' },
      { title: 'AI API Integration', body: 'Wiring model APIs into real applications.', icon: 'plug' },
    ] },
    { name: 'Intelligent systems', modules: [
      { title: 'RAG Systems', body: 'Grounding answers in your own knowledge.', icon: 'search' },
      { title: 'AI Agents', body: 'Assistants that plan, use tools and act.', icon: 'ai-figure' },
      { title: '3 C’s — Claude · Codex · Copilot', body: 'Three AI pair-programmers, side by side.', icon: 'layers' },
      { title: 'AI Security', body: 'Guardrails, safety and responsible AI.', icon: 'lock' },
    ] },
    { name: 'Ship & scale', modules: [
      { title: 'Agentic AI', body: 'Multi-step, autonomous AI workflows.', icon: 'workflow' },
      { title: 'Deployment', body: 'Shipping AI products to production.', icon: 'rocket' },
      { title: 'LLM Creation', body: 'Training and fine-tuning your own models.', icon: 'chip' },
      { title: 'Cloud AI', body: 'Scaling AI on cloud platforms.', icon: 'cloud' },
    ] },
  ],
  studentsTitle: 'What a student walks away with',
  students: [
    { title: 'Not a fast-track program', body: 'A steady, deliberate pace — time to absorb every concept properly.', icon: 'clock' },
    { title: 'Authorised AI certification', body: 'Earn the authorised Claude Certified Associate credential.', icon: 'certificate' },
    { title: 'Trained by certified experts', body: 'Industry-ready, AI-certified practitioners teach every module.', icon: 'users' },
    { title: 'Internship completion letter', body: 'Issued and signed off by our AI partners.', icon: 'document' },
  ],
  collegeTitle: 'What the campus gains',
  college: [
    { title: 'Claude & OpenAI Centre of Excellence', body: 'An official AI centre established on your campus.', icon: 'building' },
    { title: 'Industry-ready AI engineers', body: 'Graduates who arrive at interviews already able to build.', icon: 'briefcase' },
    { title: 'Enhanced college branding', body: 'Association with the AI partners setting the standard.', icon: 'trophy' },
    { title: 'AI ecosystem on campus', body: 'Tools, platforms and practice embedded in day-to-day teaching.', icon: 'layers' },
  ],
  training: {
    eyebrow: 'In the classroom',
    title: 'Inside the classroom',
    sub: 'AI Ready Engineer cohorts in session — hands-on, laptop-first, every day.',
    photos: Array.from({ length: 12 }, (_, i) => ({ src: `ai-ready/training/class-${String(i + 1).padStart(2, '0')}.jpg` })),
  },
  close: {
    eyebrow: 'Experience AI in action',
    title: 'Step In. Stand Out.',
    line: 'Designed and developed with the world’s leading AI companies.',
    stats: [
      { value: '16,000+', label: 'Certified students' },
      { value: '10,000+', label: 'Placement offers' },
    ],
    contact: [
      { icon: 'mail', label: 'babji@technicalhub.io' },
      { icon: 'globe', label: 'claude.technicalhub.io' },
      { icon: 'phone', label: '+91 83 43 81 81 81' },
    ],
  },
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
  const { sections } = (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json;
  const section = sections.find((s) => s.key === KEY);
  if (!section) throw new Error(`no section with key ${KEY}`);
  await request('PATCH', `/api/sections/${section.id}`, { blocks: [BLOCK] }, cookie);
  console.log('updated', section.id);
})().catch((e) => { console.error(e.message); process.exit(1); });
