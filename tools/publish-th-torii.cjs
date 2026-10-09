/**
 * Publishes Technical Hub × Torii: the whole of Torii as an app inside one slide.
 *
 *   node tools/publish-th-torii.cjs --dry     # print what would be sent
 *   node tools/publish-th-torii.cjs           # replace the Torii section's block (key `torii`)
 *
 * Sources:
 *   - The Torii application (profile.toriiminds.com, signed in as the presenter): About,
 *     Trainings, NT Square, Project Week, Project Street, Torii Connect, Events, Workspace,
 *     IT Development, AI Partners, Centers of Excellence, Trusted By and Industry Alliances.
 *     Its media is copied into uploads/th-torii/. Its demo sign-ins are never published.
 *   - Technical Hub's MoU post with Torii Minds (the ten services) and the partnership
 *     announcement images (uploads/collaborations/).
 *   - Technical Hub's post on the NCET Claude lab (the AI Lab view), with the lab photographs
 *     already in uploads/torii-partnership/.
 * The old two-tab `partnership` block is replaced; tools/publish-torii.cjs still holds it.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'torii';
const TITLE = 'Technical Hub × Torii';
const ICON = 'link';
const DRY = process.argv.includes('--dry');
const UP = path.join(__dirname, '..', 'backend', 'uploads');
const T = 'th-torii/';
const C = 'collaborations/';
const P = 'torii-partnership/';
/** Every image in an uploads folder, in name order, as upload paths. */
const folder = (dir, re = /\.(jpe?g|png|webp)$/i, skip = /wordmark/i) => fs.readdirSync(path.join(UP, dir))
  .filter((f) => re.test(f) && !skip.test(f)).sort().map((f) => `${dir}${f}`);

const BLOCK = {
  type: 'torii-app',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  content: {
    lockup: { left: `${P}ncet-logo-thub.png`, right: `${P}th-logo-toriiminds.png` },
    film: `${T}torii-brand-film.mp4`,
    hero: {
      title: ['Technical Hub', '× Torii Minds'],
      line: 'One Claude AI ecosystem — signed in an MoU.',
      searchLabel: 'Explore Torii —',
      search: ['100+ courses, 200+ hours each', 'the 24/7 Claude AI Lab', 'MYNA, the learner portal', 'Project Week and Project Street', 'certifications from AWS to ServiceNow'],
      jumps: [
        { view: 'trainings', label: 'Trainings', icon: 'graduation' },
        { view: 'lab', label: 'AI Lab', icon: 'chip' },
        { view: 'campus', label: 'Campus', icon: 'building' },
        { view: 'products', label: 'Products', icon: 'cube' },
        { view: 'partners', label: 'Partners', icon: 'partners' },
      ],
      primary: 'Explore Torii',
      secondary: 'Watch the film',
      image: `${C}torii-announcement.jpg`,
      imageAlt: 'Partnership announcement — Technical Hub × Torii',
      mouTitle: 'Technical Hub × Torii Minds — the MoU',
      mouImages: [`${C}torii-announcement.jpg`, `${C}torii-claude-team.jpg`],
      floats: [
        { icon: 'handshake-check', label: 'MoU signed' },
        { icon: 'sparkles', label: 'Step IN. Stand OUT.' },
        { icon: 'seal-check', label: 'Claude-certified team' },
      ],
    },
    stats: [
      { icon: 'book', value: '100+', label: 'courses' },
      { icon: 'clock', value: '200+ hours', label: 'each' },
      { icon: 'chip', value: '24/7', label: 'AI-powered lab' },
      { icon: 'map-pin', value: 'Bangalore · Mysore · AP', label: '' },
      { icon: 'seal-check', value: 'Claude & OpenAI', label: 'partners' },
      { icon: 'building', value: 'NCET', label: 'technical partner' },
    ],
    services: {
      title: 'Featured under the MoU',
      sub: 'What Technical Hub’s Claude-certified engineers bring to Torii',
      items: [
        { icon: 'building', tag: 'CoE', title: 'Claude Centre of Excellence', body: 'A CoE programme that anchors the Claude work.' },
        { icon: 'rocket', tag: 'Deploy', title: 'Industry Solution Accelerators', body: 'Ready accelerators, deployed on industry problems.' },
        { icon: 'workflow', tag: 'Build', title: 'Internal Agentic Platforms', body: 'Agentic platforms for Torii’s own teams.' },
        { icon: 'cube', tag: 'Build', title: 'Customer-Facing AI Products', body: 'AI products in front of real customers.' },
        { icon: 'beaker', tag: 'Build', title: 'Prototypes & POCs', body: 'Ideas proven fast, before they are scaled.' },
        { icon: 'compass', tag: 'Advise', title: 'AI Strategy & Roadmap', body: 'Where AI goes next, and in what order.' },
        { icon: 'gauge', tag: 'Advise', title: 'AI Readiness Assessment', body: 'An honest read of where the team stands.' },
        { icon: 'server', tag: 'Run', title: 'Managed AI Operations', body: 'AI kept running in production.' },
        { icon: 'graduation', tag: 'Enable', title: 'Claude Training & Enablement', body: 'Every team taught to build with Claude.' },
        { icon: 'layers', tag: 'Run', title: 'Platform Migration to Claude', body: 'Existing platforms moved onto Claude.' },
      ],
    },
    trainings: {
      kicker: 'Trainings',
      title: 'What Torii teaches',
      lead: 'From programming foundations to forward-deployed engineering — 100+ courses of 200+ hours each, ending in global certifications from AWS, Google Cloud, ServiceNow and Snowflake.',
      tracks: [
        { name: 'Programming Foundations', blurb: 'C and Python, problem solving and a first taste of prompt engineering.', icon: 'code', topics: ['C Programming', 'Python Programming', 'Problem Solving — Level 1', 'Coding Platform Onboarding', 'Prompt Engineering & GPT Models'] },
        { name: 'Data Structures, Java & Databases', blurb: 'Algorithms, Java and SQL & NoSQL — the core of every technical interview.', icon: 'layers', topics: ['Data Structures & Algorithms', 'Java Programming', 'SQL & NoSQL', 'Problem Solving — Level 2', 'GitHub Copilot, GPT & Basic LLM'] },
        { name: 'AI Ready', blurb: 'The AI Ready Engineer roadmap, real AI projects and the 3 C’s.', icon: 'sparkles', topics: ['AI Ready Engineer Roadmap', 'Advanced Data Structures (ADS)', 'Advanced Problem Solving', 'AI Projects', 'The 3 C’s — Claude, Codex, Copilot'] },
        { name: 'FDE Role', blurb: 'Forward-deployed engineering — deploy, test and secure AI in production.', icon: 'rocket', topics: ['Forward Deployed Engineering', 'Deployment', 'AI Testing', 'AI Security', 'Placement Training'] },
        { name: 'ServiceNow', blurb: 'The platform end to end — incidents, CMDB, flows and scripting.', icon: 'workflow', topics: ['ServiceNow Platform Overview', 'ServiceNow Instance & Navigation', 'Lists, Filters & Forms', 'Form Configuration', 'Incident Management', 'Change & Problem Management', 'Reporting & Dashboards', 'Service Catalog', 'Tables & Data Schema', 'Access Control', 'CMDB', 'UI Policies & Business Rules', 'Flow Designer', 'Application Development', 'Scripting Basics'] },
        { name: 'Full Stack Development', blurb: 'From HTML to React, APIs and databases — full applications, shipped.', icon: 'globe', topics: ['HTML & CSS', 'JavaScript', 'React', 'Backend Development', 'Databases', 'REST APIs', 'Git & GitHub', 'Full Stack Projects'] },
        { name: 'Flutter', blurb: 'Dart and Flutter — mobile apps with Firebase behind them.', icon: 'phone', topics: ['Dart Programming', 'Flutter Fundamentals', 'UI Development', 'State Management', 'API Integration', 'Firebase', 'App Development Projects'] },
        { name: 'AWS', blurb: 'Cloud fundamentals through IAM, EC2, S3, RDS and VPC to deployment.', icon: 'server', topics: ['Cloud Fundamentals', 'IAM', 'EC2', 'S3', 'RDS', 'VPC', 'AWS Deployment'] },
      ],
    },
    lab: {
      kicker: 'AI Lab · NCET',
      title: 'The 24/7 Claude AI Lab',
      live: 'Open 24/7',
      lead: 'Technical Hub helped NCET set up an AI-ready lab powered by Claude — and trained its faculty and students to build real projects with Claude Code, from the first prompt to a shipped application.',
      points: [
        'No more learning AI in theory — hands-on, practical and production-focused.',
        'A Claude Max account on every seat, open all year to students, faculty and developers.',
        'Part of the Claude Partner Network — and coming to more campuses.',
      ],
      stats: [
        { value: 'Max', label: 'Claude on every seat' },
        { value: '24/7', label: 'Open all year' },
        { value: '4', label: 'Skill forges' },
        { value: 'Code', label: 'Claude Code, hands-on' },
      ],
      photos: [`${P}ncet-home-image.jpg`, ...[1, 4, 5, 2, 3, 6, 7].map((n) => `${P}ncet-ai-lab-${n}.jpg`)],
      team: {
        image: `${C}torii-claude-team.jpg`,
        title: 'A dedicated Claude-certified team',
        body: 'Hand-picked Claude-certified experts embedded with Torii — building, fine-tuning and shipping production AI.',
        tags: ['AI Strategy', 'Custom Claude Builds', 'Fine-tuning', 'Production Deployment'],
      },
    },
    campus: {
      kicker: 'Campus life',
      title: 'Where Torii happens',
      lead: 'The places, weeks and stalls where Torii trainees learn in the open — every card opens its photographs.',
      items: [
        { title: 'NT Square', tag: 'GitHub Experience Center', body: 'NTSquare at NCET — where learning meets industry, with the GitHub Experience Center inside.', logo: `${T}nt-square/ntsquare-nt-square-wordmark.png`, photos: folder(`${T}nt-square/`) },
        { title: 'Project Week', tag: 'Numbered teams · one week', body: 'Teams with chart paper, laptops and a week — Torii mentors moving table to table as ideas take shape.', logo: `${T}project-week/projectweek-project-week-wordmark.png`, photos: folder(`${T}project-week/`) },
        { title: 'Project Street', tag: 'Every project, out in the open', body: 'Work set up on easels along the campus walkway — explained to mentors, faculty and the crowd at every board.', photos: folder(`${T}project-street/`) },
        { title: 'Torii Connect', tag: 'Topic stalls · MYNA', body: 'A full run of stalls down one hall — each topic with its own banner, screen and crowd.', logo: `${T}torii-connect/torii-connect-torii-connect-wordmark.png`, photos: folder(`${T}torii-connect/`) },
        { title: 'Events', tag: 'Summits, days and hackathons', body: 'AWS Summit 2026, the ServiceNow AI Skills Summit, SCINOVA, IKYA, Red Hat Academy Day and more.', photos: folder(`${T}events/`) },
        { title: 'Workspace', tag: 'Labs, halls and the CoE wall', body: 'The rooms Torii trains in — labs, halls and the Centre of Excellence wall.', photos: folder(`${T}workspace/`, /\.(jpe?g|png)$/i) },
      ].map((it) => ({ ...it, cover: it.photos[0] })),
    },
    hr: {
      kicker: 'HR Conclave · NCMS',
      title: 'HR Conclave',
      lead: 'Torii Minds at the HR Conclave at Nagarjuna College of Management Studies — Babji Neelam on stage, the Torii team on the floor.',
      points: [
        'Babji Neelam presented Torii Minds — the gateway between classroom and career.',
        'A panel of HR leaders on the conclave’s theme: connecting people, creating futures.',
        'The Torii team at the conclave with the Nagarjuna Group of Institutions and NHRD Bangalore.',
      ],
      speaker: { photo: `${T}hr-conclave/01-babji-on-stage.jpg`, name: 'Babji Neelam', role: 'Founder & CEO, Torii Minds' },
      photos: [
        { src: `${T}hr-conclave/01-babji-on-stage.jpg`, caption: 'Babji Neelam on stage' },
        { src: `${T}hr-conclave/02-presenting-the-ceo-profile.jpg`, caption: 'Presenting the CEO profile' },
        { src: `${T}hr-conclave/03-babji-speaking.jpg`, caption: 'Babji Neelam speaking' },
        { src: `${T}hr-conclave/06-panel-discussion.jpg`, caption: 'The panel discussion' },
        { src: `${T}hr-conclave/07-the-panel.jpg`, caption: 'The panel' },
        { src: `${T}hr-conclave/04-torii-team-at-the-arch.jpg`, caption: 'The Torii team at the conclave' },
        { src: `${T}hr-conclave/05-torii-team-with-ngi.jpg`, caption: 'The Torii team with NGI' },
        { src: `${T}hr-conclave/08-full-auditorium.jpg`, caption: 'A full auditorium' },
      ],
    },
    products: {
      kicker: 'Products',
      title: 'Built and run by Torii',
      lead: 'The platforms behind every Torii trainee — from the first module to placement.',
      items: [
        { name: 'MYNA', tag: 'The learner portal', logo: `${T}products/showcase-logos-myna.png`, description: 'A trainee’s day-to-day home — what to do next, what is finished, and how far along the path they are.', features: ['Every active course in one place', 'Progress a learner can see', 'Credits and rewards'], stack: ['Web', 'Mobile', 'REST API'] },
        { name: 'AI Engineer LMS', tag: 'The AI Ready Engineer platform', logo: `${T}products/showcase-logos-ai-ready-engineer.png`, description: 'The course itself for learners and trainers, with an admin console for the people running the cohorts.', features: ['Course delivery and submissions', 'A trainer’s view of a batch', 'Cohort administration'], stack: ['Web', 'LMS', 'REST API'] },
        { name: 'TAG', tag: 'NCET task and activity system', logo: `${T}products/showcase-logos-tag.png`, description: 'Work raised, assigned and tracked across coordinators, designers and the social team.', features: ['Tasks raised and assigned', 'Role-based queues', 'Admin oversight'], stack: ['Web', 'REST API'] },
        { name: 'OwlCoder', tag: 'Coding practice and assessment', logo: `${T}products/showcase-logos-owlcoder.png`, description: 'Problem sets a trainee works through, run and scored automatically, with the record kept.', features: ['Graded problem sets', 'Automatic evaluation', 'Assessment mode for a batch'], stack: ['Web', 'Judge service'] },
        { name: 'Torii Minds & JPath', tag: 'The learning path', logo: `${T}products/showcase-logos-jpath.png`, description: 'The route a trainee takes from the first module to placement, and the site that carries it.', features: ['The learning path end to end', 'Journey tracking', 'One sign-in across Torii'], stack: ['Web', 'REST API'] },
        { name: 'Loop', tag: 'Loop recording', logo: `${T}products/showcase-logos-loop.png`, description: '', features: [], stack: [] },
        { name: 'AI Anchor', tag: 'AI anchor', logo: `${T}products/showcase-logos-ai-anchor.png`, description: '', features: [], stack: [] },
        { name: 'Hibi', tag: 'Hibi platform', logo: `${T}products/showcase-logos-hibi.jpg`, description: '', features: [], stack: ['Web'] },
      ],
    },
    partners: {
      kicker: 'Partners',
      title: 'Who Torii builds with',
      lead: 'The AI platforms Torii builds and teaches on, the platforms it is tied up with, the colleges that trust it and the MoUs it holds.',
      aiTitle: 'AI partners',
      ai: [
        { name: 'Claude', tier: 'Claude Partner Network · Member', logo: `${C}logos/claude-partner-network.png`, note: 'Selected for Claude for Startups by Anthropic.', selection: { thumb: `${T}partners/claude-for-startups-lockup.jpg`, image: `${T}partners/claude-for-startups.jpg`, label: 'Selected — Claude for Startups', badge: 'Startups' } },
        { name: 'OpenAI', tier: 'Select Partner', logo: 'ai-partners/openai-select-partner.jpeg', note: 'Generative AI through the AI Ready Engineer programme.' },
        { name: 'Sarvam AI', tier: 'Partnership', logo: 'ai-partners/sarvam-ai.jpeg', note: 'Selected for the Sarvam Startup Program.', selection: { thumb: `${T}partners/sarvam-startup-program-lockup.jpg`, image: `${T}partners/sarvam-startup-program.jpg`, label: 'Selected — Sarvam Startup Program', badge: 'Startups' } },
      ],
      coeTitle: 'Tied up with',
      coe: ['Snowflake', 'GitHub', 'AWS Academy', 'Red Hat', 'Claude', 'Mile2', 'Oracle Academy', 'Cisco Networking Academy', 'Google Cloud', 'Pega', 'ServiceNow', 'MongoDB', 'Palo Alto', 'HubSpot', 'OpenAI', 'Automation Anywhere', 'Splunk', 'Cadence', 'Microsoft'],
      trustTitle: 'Trusted by',
      trusted: [
        ['Yeshwantrao Chavan College of Engineering', 'ycce'],
        ['Nagarjuna Group of Institutions', 'nagarjuna-group-of-institutions'],
        ['Nagarjuna College of Engineering & Technology', 'nagarjuna-college-of-engineering-and-technology'],
        ['Nagarjuna College of Management Studies', 'nagarjuna-college-of-management-studies'],
        ['Nagarjuna Degree College', 'nagarjuna-degree-college'],
        ['Nagarjuna Pre-University College', 'nagarjuna-pre-university-college'],
        ['Nagarjuna Vidyaniketan', 'nagarjuna-vidyaniketan'],
        ['Geeta University', 'geeta-university'],
        ['SRKR Engineering College', 'srkr-engineering-college'],
      ].map(([name, f]) => ({ name, logo: `${T}trusted-by/${f}.png` })),
      mouTitle: 'MoUs signed',
      mous: [
        { name: 'Kyoto University — IAE', kind: 'Japan', image: `${T}alliances/mou-kyoto-iae-6f10a6d79f3c4b8a.png` },
        { name: 'Automation Anywhere', kind: 'Centre of Excellence', image: `${T}alliances/mou-automation-anywhere-dc9761d33c604a1a.jpg` },
        { name: 'Snowflake', kind: 'Centre of Excellence', image: `${T}alliances/mou-snowflake-ed6c610c31f249ab.jpg` },
        { name: 'Mile2', kind: 'Academic alliance', image: `${T}alliances/mou-mile2-23677af01ec346d7.jpg` },
        { name: 'o9 Solutions', kind: 'Academic alliance', image: `${T}alliances/mou-o9-51c6a663ad114505.jpg` },
        { name: 'AlgoBharath', kind: 'MoU', image: `${T}alliances/mou-algobharath-76c3cac559864a2b.png` },
      ],
    },
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
  // Every referenced file must exist before anything is sent.
  const missing = [];
  const check = (v) => {
    if (typeof v === 'string' && /\.(jpe?g|png|webp|mp4)$/i.test(v) && !fs.existsSync(path.join(UP, v))) missing.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(check);
  };
  check(BLOCK.content);
  if (missing.length) { console.error('missing files:\n ' + missing.join('\n ')); process.exit(1); }
  if (DRY) { console.log(JSON.stringify(BLOCK, null, 2)); return; }
  const login = await request('POST', '/api/auth/login', { email: 'admin@org.local', password: 'Admin@123' });
  const cookie = String(login.headers['set-cookie'] || '').split(';')[0];
  const sections = (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json.sections;
  const section = sections.find((s) => s.key === KEY);
  if (!section) throw new Error('the Torii section (key torii) does not exist — run tools/publish-torii.cjs first');
  await request('PATCH', `/api/sections/${section.id}`, { title: TITLE, iconKey: ICON, status: 'published', blocks: [BLOCK] }, cookie);
  console.log('updated', section.id, TITLE);
})().catch((e) => { console.error(e.message); process.exit(1); });
