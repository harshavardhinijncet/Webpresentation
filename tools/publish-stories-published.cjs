/**
 * Publishes Stories Published: one slide holding the three success stories that have been put
 * out about Technical Hub's work with Claude —
 *
 *   NCET × Claude           https://claude.ncet.co.in/
 *   Technical Hub × Claude  https://claude.technicalhub.io/
 *   Torii Minds × Claude    https://toriiminds.com/success-story/
 *
 *   node tools/publish-stories-published.cjs --dry   # check every file, print the size
 *   node tools/publish-stories-published.cjs         # create or update, placed after Collaborations
 *
 * One row in the navigation, no pages under it: the slide opens on the three story cards and
 * each card opens its story inside the same slide. Any child pages left from the earlier
 * three-page version are deleted.
 *
 * The copy restates those three published pages and every figure is one they print; nothing is
 * added. The one correction, given by the user: Technical Hub has ten Claude-certified
 * architects — the NCET site names four — so NCET shows the ten. Photographs were downloaded
 * from the sites into uploads/stories-published/<story>/.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'stories-published';
const AFTER = 'collaborations';
const OLD_PAGES = ['story-ncet', 'story-th', 'story-torii'];
const DRY = process.argv.includes('--dry');
const UP = path.join(__dirname, '..', 'backend', 'uploads');
const N = 'stories-published/ncet/';
const T = 'stories-published/th/';
const R = 'stories-published/torii/';

const LOGO = {
  th: { src: `${N}logo-thub.png`, alt: 'Technical Hub' },
  ncet: { src: `${N}logo-ncet.png`, alt: 'NCET' },
  torii: { src: `${R}torii-logo.png`, alt: 'Torii Minds' },
};
const ph = (src, cap) => ({ src, cap });

/* Technical Hub's ten Claude-certified architects, as claude.technicalhub.io names them. */
const ARCHITECTS = [
  ['harshavardhini', 'Harshavardhini'], ['prashat', 'Prasanth'], ['bobby', 'Bobby Pamarthi'], ['peter', 'Peter'], ['sudhir', 'Sudhir'],
  ['akhilesh', 'Akhilesh'], ['bhargav', 'Bhargav'], ['kishore', 'Kishore Girijala'], ['naveen', 'Naveen'], ['azar', 'Azar'],
].map(([f, name]) => ({ photo: `${T}${f}.png`, name, role: 'Claude Certified Architect' }));

/* ============================================================== NCET × Claude */
const NCET = {
  title: 'NCET × Claude',
  url: 'claude.ncet.co.in',
  logos: [LOGO.th, LOGO.ncet],
  chapters: [
    {
      kind: 'cover', label: 'Overview', icon: 'sparkles',
      kicker: 'Campus-wide AI transformation',
      title: 'Claude, woven into every corner of',
      titleEm: 'NCET',
      lede: 'How Technical Hub embedded Claude into every domain of Nagarjuna College of Engineering & Technology — classrooms, labs, design, development, marketing and management.',
      stats: [
        { n: '10', label: 'Claude-certified architects' },
        { n: '24/7', label: 'AI Lab on Claude Max' },
        { n: '100%', label: 'Systems Claude-integrated' },
        { n: '6+', label: 'Domains running on Claude' },
      ],
      images: [`${N}home-image.jpg`, `${N}story-mentor.jpg`, `${N}story-kiosk.jpg`],
      badge: 'Powered by Claude',
    },
    {
      kind: 'cards', label: 'Workshops', icon: 'graduation',
      eyebrow: 'Cultivating an AI culture',
      title: 'Claude workshops for every stream',
      intro: 'Hands-on workshops took thousands of students from first-time curiosity to a daily working habit.',
      cols: 4,
      cards: [
        { image: `${N}workshop-day-1.webp`, tag: 'B.Tech', title: 'Engineering', text: 'Coding, debugging and project scoping with Claude as a daily partner.' },
        { image: `${N}workshop-day-2.jpg`, tag: 'BCA', title: 'Computer Applications', text: 'App ideas to working builds — logic to deployment.' },
        { image: `${N}workshop-day-3.jpg`, tag: 'MCA', title: 'Advanced Computing', text: 'LLM workflows and prompt engineering.' },
        { image: `${N}projectweek4.jpg`, tag: 'M.Tech', title: 'Research', text: 'Literature synthesis, experiments and documentation.' },
      ],
    },
    {
      kind: 'people', label: 'Architects', icon: 'users',
      eyebrow: 'On-ground leadership',
      title: '10 Claude-certified architects',
      intro: 'Certified architects removing the learning curve — a friction-free path to an AI-skilled institution.',
      cols: 5,
      people: ARCHITECTS,
      side: {
        cards: [
          { icon: 'tools', title: 'Troubleshooting clinics', text: 'Production-level advice for students and faculty.' },
          { icon: 'clipboard-check', title: 'Project auditing', text: 'Raising the quality of student innovation.' },
          { icon: 'layers', title: 'Architecture alignment', text: 'Every build on modern cloud and AI patterns.' },
        ],
      },
    },
    {
      kind: 'split', label: 'AI Lab', icon: 'chip',
      eyebrow: 'Always-on infrastructure',
      title: 'A Claude stall and a 24/7 AI Lab',
      body: ['A permanent Claude stall for workshops and live demos, and an AI Lab where every workstation runs Claude Max — open all year to students, faculty, trainers and developers.'],
      tiles: [
        { n: '24/7', title: 'Online all year' },
        { icon: 'chip', title: 'Claude Max', text: 'On every machine' },
        { icon: 'rocket', title: 'Build · train · deploy' },
      ],
      wide: true,
      images: [
        ph(`${N}ai-lab-4.jpg`, 'Inauguration of the 24/7 AI Lab'),
        ph(`${N}ai-lab-1.jpg`, 'Every system on Claude Max'),
        ph(`${N}ntsquare-hub.webp`, 'The Claude stall, inaugurated on campus'),
        ph(`${N}ai-lab-5.jpg`, 'Leadership touring the lab'),
        ph(`${N}ai-lab-2.jpg`, 'Open to every student'),
      ],
    },
    {
      kind: 'cards', label: 'Every Domain', icon: 'globe',
      eyebrow: 'Claude, everywhere',
      title: 'One AI partner, every department',
      intro: 'Claude became the working layer beneath everything NCET does — every role, every day.',
      cols: 6,
      cards: [
        { image: `${N}domain-studentsusing.jpg`, tag: '01', title: 'Students' },
        { image: `${N}domain-trainers.jpg`, tag: '02', title: 'Trainers' },
        { image: `${N}domain-teachers.jpg`, tag: '03', title: 'Teachers' },
        { image: `${N}domain-developers.jpeg`, tag: '04', title: 'Developers' },
        { image: `${N}domain-designers.jpeg`, tag: '05', title: 'Designers' },
        { image: `${N}domain-digital.jpeg`, tag: '06', title: 'Digital Marketing' },
      ],
    },
    {
      kind: 'steps', label: 'Project Week', icon: 'route',
      eyebrow: 'From problem to pitch',
      title: 'Project Week — teams of four, real problems',
      intro: 'Build a working solution with Claude, then take it to the street and defend it to faculty.',
      steps: [
        { title: 'Team up', text: 'Four students, one goal.' },
        { title: 'Scope', text: 'A real problem worth solving.' },
        { title: 'Build', text: 'A working solution, with Claude.' },
        { title: 'Pitch', text: 'Defended with data and charts.' },
      ],
      images: [
        ph(`${N}projectweek1.webp`, 'Planning the project'),
        ph(`${N}projectweek2.webp`, 'Building the solution'),
        ph(`${N}project-street-1.webp`, 'Presenting at the easel'),
        ph(`${N}project-street-8.webp`, 'The whole street, full of projects'),
      ],
    },
    {
      kind: 'cards', label: 'Apps', icon: 'code',
      eyebrow: 'From prompt to production',
      title: 'College apps, fully vibe-coded',
      intro: 'In-use college software, built and deployed end to end with Claude Code.',
      cols: 3,
      cards: [
        { image: `${N}app-kaizen.webp`, tag: 'Live', title: 'Prompt Kaizen', foot: 'kaizen.ncet.app' },
        { image: `${N}app-kaizen-admin.webp`, tag: 'Live', title: 'Kaizen Admin', foot: 'admin.kaizen.ncet.app' },
        { image: `${N}app-tag-portal.webp`, tag: 'Live', title: 'T@g Portal', foot: 'tag.ncet.app' },
        { image: `${N}app-work-mgmt.webp`, tag: 'Live', title: 'Work Management', foot: 'work.ncet.app' },
        { image: `${N}app-placement-portal.webp`, tag: 'Live', title: 'Placement Portal', foot: 'placement.ncet.app' },
        { image: `${N}app-ai-ready-portal.webp`, tag: 'Live', title: 'AI-Ready Engineer', foot: 'engineer.ncet.app' },
      ],
    },
    {
      kind: 'steps', label: 'Impact', icon: 'trend-up',
      eyebrow: 'The transformation blueprint',
      title: 'A reproducible journey',
      steps: [
        { title: 'Awareness', text: 'Campus-wide workshops.' },
        { title: 'Infrastructure', text: 'The 24/7 Claude Max AI Lab.' },
        { title: 'Curriculum', text: 'Prompt engineering, credited.' },
        { title: 'Hands-on build', text: 'Project Week & ProjectStreet.' },
        { title: 'Expertise', text: '10 certified architects.' },
        { title: 'Impact', text: 'Claude in everyday execution.' },
      ],
      quotes: [
        { text: 'Claude moved from an occasional novelty to a primary driver of academic and operational work.', by: 'Everyday AI adoption' },
        { text: 'Technical Hub didn’t just unlock our institution’s potential — it built a reproducible blueprint for the future of AI-driven technical education.', by: 'Nagarjuna College of Engineering & Technology' },
      ],
    },
  ],
};

/* ===================================================== Technical Hub × Claude */
const TH = {
  title: 'Technical Hub × Claude',
  url: 'claude.technicalhub.io',
  logos: [LOGO.th],
  chapters: [
    {
      kind: 'cover', label: 'Overview', icon: 'sparkles',
      kicker: 'Official partner · Claude Partner Network',
      title: 'Claude architects &',
      titleEm: 'AI solutions',
      lede: 'Ten certified experts who design, build and teach with Claude — the team behind every engagement.',
      stats: [
        { n: '900+', label: 'Students certified' },
        { n: '3×', label: 'Faster product shipping' },
        { n: '100%', label: 'Campus-wide Claude rollout' },
      ],
      images: [`${T}home-image.webp`, `${T}dsc-1766.webp`, `${T}workshop-day-1.webp`],
      badge: 'Claude Partner Network',
      badgeIcon: 'seal-check',
    },
    {
      kind: 'cards', label: 'Services', icon: 'briefcase',
      eyebrow: 'Now offering',
      title: 'Our services',
      cols: 4,
      cards: [
        { icon: 'plug', tag: 'Claude', title: 'Integration', points: ['Connect Claude to existing tools', 'Workflow and API integration', 'Secure, scalable deployment'] },
        { icon: 'ai-figure', tag: 'Engineers → AI Ready', title: 'AI Ready Engineers', points: ['AI and its real-world applications', 'Hands-on AI problem solving', 'Confidence with emerging tech'] },
        { icon: 'certificate', tag: 'Claude', title: 'Certification', points: ['Exam-backed certification tracks', 'Beginner to advanced paths', 'Verifiable digital certificates'] },
        { icon: 'graduation', tag: 'Claude', title: 'Training', points: ['Live, instructor-led sessions', 'Team and student cohorts', 'Prompt & workflow labs'] },
        { icon: 'rocket', tag: 'AI', title: 'Product Building', points: ['Discovery, prototyping and MVPs', 'Production-grade Claude integrations', 'QA, deployment and scaling'] },
        { icon: 'users', tag: 'FDP', title: 'FDP & Trainings', points: ['Faculty Development Programs', 'Ready-to-teach Claude modules', 'Curriculum and assessment design'] },
        { icon: 'chip', tag: 'AI', title: 'Lab Setup', points: ['Infrastructure and tooling', 'Curriculum and lab manuals', 'Trainer and staff enablement'] },
        { icon: 'mail', tag: 'Interested?', title: 'Write to us', text: 'babji@technicalhub.io — mention the service in your subject.' },
      ],
    },
    {
      kind: 'people', label: 'Architects', icon: 'users',
      eyebrow: 'Technical Hub',
      title: 'Meet the Claude architects',
      intro: 'Every architect on the bench holds the Claude Certified Architect credential from Anthropic.',
      cols: 5,
      people: ARCHITECTS,
      side: { image: `${T}claude-certification.png` },
    },
    {
      kind: 'steps', label: 'Playbook', icon: 'route',
      eyebrow: 'The playbook',
      title: 'One blueprint. Any institution.',
      intro: 'The same six-phase engagement behind every story — documented, measured, reproducible.',
      steps: [
        { title: 'Awareness', text: 'Workshops spark an AI culture.' },
        { title: 'Infrastructure', text: 'Labs on Claude, up to Claude Max.' },
        { title: 'Curriculum', text: 'Prompt & context engineering.' },
        { title: 'Hands-on build', text: 'Hackathons & project weeks.' },
        { title: 'Expertise', text: 'Certified architects on the ground.' },
        { title: 'Certification', text: 'Official Anthropic certificates.' },
      ],
      images: [
        ph(`${T}workshop-day-3.webp`, 'Workshop'),
        ph(`${T}ai-lab-2.webp`, 'AI Lab'),
        ph(`${T}img-0478.webp`, 'Project Week'),
        ph(`${T}domain-teachers.webp`, 'Faculty development'),
      ],
    },
    {
      kind: 'gallery', label: 'Work That Ships', icon: 'images',
      eyebrow: 'Work that ships',
      title: 'Labs, programmes and products',
      tiles: 5,
      photos: [
        { src: `${T}dsc-1766.webp`, tag: 'AI Lab', cap: 'Centre of Excellence' },
        { src: `${T}workshop-day-1.webp`, tag: 'Workshop', cap: 'Hands-on workshop' },
        { src: `${T}domain-studentsusing.webp`, tag: 'Training', cap: 'Students building with Claude' },
        { src: `${T}mg-0186.webp`, tag: 'Project Street', cap: 'Project Street' },
        { src: `${T}domain-teachers.webp`, tag: 'FDP', cap: 'Faculty development' },
        { src: `${T}img-0478.webp`, tag: 'Project Week', cap: 'Project Week' },
        { src: `${T}ai-lab-2.webp`, tag: 'AI Lab', cap: 'Inside the AI Lab' },
        { src: `${T}domain-trainers.webp`, tag: 'Training', cap: 'Trainer-led sessions' },
        { src: `${T}project-street-8.webp`, tag: 'Project Street', cap: 'Project Street' },
        { src: `${T}domain-designers.webp`, tag: 'Curriculum', cap: 'Design sprints' },
      ],
    },
  ],
};

/* ======================================================= Torii Minds × Claude */
const TORII = {
  title: 'Torii Minds × Claude',
  url: 'toriiminds.com/success-story',
  logos: [LOGO.th, LOGO.torii],
  chapters: [
    {
      kind: 'cover', label: 'Overview', icon: 'sparkles',
      kicker: 'Success story · workforce transformation',
      title: 'How Technical Hub upskilled Torii to deliver',
      titleEm: 'industry-standard Claude AI',
      lede: 'Torii invested in its people first — turning abstract AI potential into concrete, repeatable developer workflows.',
      stats: [
        { n: '100%', label: 'AI-skilled team' },
        { n: '3x', label: 'Faster MVP prototyping' },
        { n: '-40%', label: 'Shorter debugging cycles' },
        { n: '100%', label: 'AI-assisted dev pipeline' },
      ],
      images: [`${R}team-capability.jpg`, `${R}program-vision.jpg`, `${R}curriculum-prompt.jpg`],
      badge: 'Step IN · Stand OUT',
    },
    {
      kind: 'compare', label: 'The Shift', icon: 'swap',
      eyebrow: 'Before and after',
      title: 'From ad-hoc AI to a certified team',
      before: { label: 'Before', items: ['Ad-hoc AI usage', 'Scattered resources', 'AI used only occasionally', 'Slow debugging & documentation'] },
      after: { label: 'After', items: ['Standardised Claude workflows', 'A validated delivery framework', 'AI-assisted coding adopted', 'A certified, delivery-ready team'] },
      image: { src: `${R}team-capability.jpg`, cap: 'The Torii delivery team — certified & enterprise-ready' },
    },
    {
      kind: 'cards', label: 'Curriculum', icon: 'book',
      eyebrow: 'Curriculum snapshot',
      title: 'What the team learned',
      cols: 5,
      cards: [
        { n: '01', title: 'Claude Foundations', text: 'Capabilities, limits and responsible use.' },
        { n: '02', title: 'Prompt Engineering', text: 'Role, context, examples, constraints, output format.' },
        { n: '03', title: 'Context Engineering', text: 'Long documents, whole codebases, multi-step tasks.' },
        { n: '04', title: 'Claude for Coding', text: 'Bug fixing, refactoring and tests with Claude Code.' },
        { n: '05', title: 'Training Delivery', text: 'AI concepts turned into sessions learners act on.' },
      ],
      images: [
        ph(`${R}curriculum-prompt.jpg`, 'A shared prompt-library framework, taught hands-on'),
        ph(`${R}training-classroom.jpg`, 'Dedicated developer training sessions'),
        ph(`${R}use-cases.jpg`, 'Claude applied in a working session'),
      ],
    },
    {
      kind: 'split', label: 'Certified Team', icon: 'seal-check',
      eyebrow: 'The people behind it',
      title: 'Ten Claude-certified architects',
      body: ['Validated across structured assessments, peer-review simulations and live delivery — Torii’s centre of excellence for AI-assisted training and engineering.'],
      chips: ['AI Delivery Certified', 'Context Engineering', 'Automated QA', 'Rapid Prototyping', 'Enterprise Delivery'],
      images: [ph(`${R}architects-team.jpg`, 'Torii’s ten Claude-certified architects'), ph(`${R}ai-vision-auditorium.jpg`, 'An AI vision session with HODs and faculty')],
    },
    {
      kind: 'split', label: 'NCET Launch', icon: 'rocket',
      eyebrow: 'On campus · live launch',
      title: 'AI Tech Coach launch at NCET',
      body: ['Torii Minds launched the AI Tech Coach “Skill Sprint” at NCET — AI for learning, coding, projects, debugging and research.'],
      chips: ['Hands-on sessions', 'Live demonstrations', 'Structured mentoring', 'Responsible AI'],
      flip: true,
      images: [
        ph(`${R}ncet-launch-1.jpg`, 'Unveiling the AI Tech Coach Skill Sprint'),
        ph(`${R}ncet-launch-2.jpg`, 'An interactive launch with students and NCET leadership'),
        ph(`${R}ncet-launch-3.jpg`, 'Students engaged during the kickoff'),
        ph(`${R}ncet-launch-4.jpg`, 'Live mentoring on AI-powered workflows'),
      ],
    },
    {
      kind: 'split', label: 'Myna', icon: 'message',
      eyebrow: 'New platform launch',
      title: 'Myna — AI-powered LSRW training',
      body: ['Built by Torii Minds, Myna trains and evaluates Listening, Speaking, Reading and Writing with AI instead of manual grading.'],
      tiles: [
        { n: '70%', title: 'Lower assessment costs' },
        { n: '24/7', title: 'Always available' },
      ],
      wide: true,
      fit: 'contain',
      images: [
        ph(`${R}myna-landing.jpg`, 'Myna — jump-start your career to the next level'),
        ph(`${R}myna-dashboard.jpg`, 'The trainee dashboard and A1–C2 levelboard'),
        ph(`${R}myna-speaking.jpg`, 'Speaking — scored for clarity and fluency'),
        ph(`${R}myna-prime.jpg`, 'Myna Prime — interview-style practice'),
      ],
    },
    {
      kind: 'cards', label: 'Engineering', icon: 'code',
      eyebrow: 'Engineering velocity',
      title: 'An immediate spike in operational KPIs',
      cols: 4,
      cards: [
        { icon: 'code', tag: 'Track', title: 'Context-aware coding', text: 'Codebase exploration, refactoring and microservices.' },
        { icon: 'shield', tag: 'Track', title: 'Automated QA', text: 'Bug localisation and unit-test generation.' },
        { icon: 'rocket', tag: 'Track', title: 'Accelerated prototyping', text: 'MVPs within hours rather than days.' },
        { icon: 'clock', tag: 'Result', title: 'Shorter timelines', text: 'Bottlenecks removed across the lifecycle.' },
        { icon: 'trend-up', tag: 'Result', title: 'Lower overhead', text: 'Routine effort offloaded to AI workflows.' },
        { icon: 'star', tag: 'Result', title: 'Higher output quality', text: 'Consistent, standards-aligned output.' },
        { icon: 'layers', tag: 'Result', title: 'Future-proofed pipeline', text: 'Every practice natively AI-assisted.' },
        { image: `${R}use-cases.jpg`, tag: 'In practice', title: 'Claude, hands-on', text: 'Applied to live training and engineering work.' },
      ],
    },
  ],
};

/* ================================================================== the slide */
const BLOCK = {
  type: 'story-hub',
  layout: { x: 0, y: 0, w: 12, h: 15 },
  content: {
    kicker: 'Success stories · built with Claude',
    title: 'Stories Published',
    lede: 'Three published success stories — a college, Technical Hub itself and a company — each on how Claude became part of everyday work.',
    stories: [
      {
        kind: 'Campus-wide · college', title: 'Claude, woven into every corner of NCET',
        text: 'Workshops for every stream, a 24/7 Claude Max lab and six college apps vibe-coded to production.',
        image: `${N}home-image.jpg`, badge: `${N}ncet-mark.png`, badgeAlt: 'NCET', url: 'claude.ncet.co.in',
        stats: [{ n: '10', label: 'certified architects' }, { n: '24/7', label: 'Claude Max AI Lab' }, { n: '6+', label: 'domains on Claude' }],
        site: NCET,
      },
      {
        kind: 'Claude Partner Network', title: 'Technical Hub — Claude architects & AI solutions',
        text: 'Ten certified architects, seven services and one six-phase playbook behind every engagement.',
        image: `${T}dsc-1766.webp`, badge: `${T}th-mark.png`, badgeAlt: 'Technical Hub', url: 'claude.technicalhub.io',
        stats: [{ n: '900+', label: 'students certified' }, { n: '3×', label: 'faster shipping' }, { n: '10', label: 'Claude architects' }],
        site: TH,
      },
      {
        kind: 'Corporate · workforce', title: 'How Technical Hub upskilled Torii Minds',
        text: 'A whole workforce made AI-native — certified architects, a five-module curriculum and Myna, now live.',
        image: `${R}architects-team.jpg`, badge: `${R}torii-short.png`, badgeAlt: 'Torii Minds', url: 'toriiminds.com/success-story',
        stats: [{ n: '3x', label: 'faster MVPs' }, { n: '-40%', label: 'debugging cycles' }, { n: '100%', label: 'AI-skilled team' }],
        site: TORII,
      },
    ],
  },
};

/* Every file named anywhere in the block must exist and be whole before anything is sent. */
function files(v, out = new Set()) {
  if (typeof v === 'string' && /^stories-published\//.test(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => files(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => files(x, out));
  return out;
}
function checkFiles() {
  const all = files(BLOCK);
  const missing = [...all].filter((f) => { const p = path.join(UP, f); return !fs.existsSync(p) || fs.statSync(p).size < 2000; });
  if (missing.length) throw new Error(`missing or empty:\n  ${missing.join('\n  ')}`);
  return all.size;
}

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
  console.log(`${checkFiles()} files present`);
  if (DRY) { console.log(JSON.stringify(BLOCK).length, 'bytes of content'); return; }
  const login = await request('POST', '/api/auth/login', { email: 'admin@org.local', password: 'Admin@123' });
  const cookie = String(login.headers['set-cookie'] || '').split(';')[0];
  const list = async () => (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json.sections;

  let sections = await list();
  // The earlier version kept each story as a page of its own; those go.
  for (const s of sections.filter((x) => OLD_PAGES.includes(x.key))) {
    await request('DELETE', `/api/sections/${s.id}`, null, cookie);
    console.log('deleted', s.title);
  }
  const body = { title: 'Stories Published', iconKey: 'newspaper', status: 'published', blocks: [BLOCK], parentId: null };
  let section = sections.find((s) => s.key === KEY);
  if (section) {
    await request('PATCH', `/api/sections/${section.id}`, body, cookie);
    console.log('updated Stories Published');
  } else {
    section = (await request('POST', `/api/orgs/${ORG}/sections`, { ...body, key: KEY }, cookie)).json.section;
    console.log('created Stories Published');
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
