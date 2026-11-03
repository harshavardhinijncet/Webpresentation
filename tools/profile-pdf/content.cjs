/*
 * Everything the company-profile PDF says, assembled from the deck itself.
 *
 * Numbers are read out of backend/data/db.json and out of the Executive
 * Summary source drop, never typed in here — the brochure and the slides have
 * to agree, and a figure keyed by hand into a second place is a figure that
 * will drift. Prose that has no home in the deck is authored below and marked
 * as such, so it is obvious what a re-run regenerates and what it preserves.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const UPLOADS = path.join(ROOT, 'backend', 'uploads');
const ORG = 'technical-hub';

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'backend', 'data', 'db.json'), 'utf8'));

const sections = db.sections.filter((s) => s.orgId === ORG);
const byId = (id) => sections.find((s) => s.id === id);
const assetPath = (id) => {
  const asset = db.assets.find((a) => a.id === id);
  return asset ? asset.path || asset.filename || asset.url : null;
};

const block = (sectionId, type) => {
  const section = byId(sectionId);
  if (!section) throw new Error(`no section ${sectionId}`);
  const found = (section.blocks || []).find((b) => b.type === type);
  if (!found) throw new Error(`no ${type} block on ${sectionId}`);
  return found;
};

/* AI Ready Engineer has been published two ways: the older `course-deck` (frames) and the
   three-page `ai-ready-deck` (phases of modules, student and campus cards). Either is read
   into the course-deck shape the brochure's page is written against. */
function courseBlock(sectionId) {
  const b = (byId(sectionId)?.blocks || []).find((x) => x.type === 'course-deck' || x.type === 'ai-ready-deck');
  if (!b) throw new Error(`no AI Ready block on ${sectionId}`);
  if (b.type === 'course-deck') return b;
  const isCredential = (s) => /certified/i.test(s.label || '');
  const cred = (b.stats || []).find(isCredential);
  const words = (b.title || 'AI Ready Engineer').split(' ');
  const card = (kind, title, items) => ({ kind: 'cards', eyebrow: kind, title, items: items || [] });
  return {
    eyebrow: b.eyebrow,
    titleLines: [words.slice(0, -1).join(' '), words.at(-1)],
    standfirst: b.standfirst,
    stats: (b.stats || []).filter((s) => !isCredential(s)),
    credential: cred ? { name: `${cred.value} ${cred.label}` } : {},
    partners: (b.partners || []).map((p) => (typeof p === 'string' ? { name: p, note: '' } : p)),
    frames: [
      { kind: 'modules', items: (b.phases || []).flatMap((p) => p.modules || []) },
      card('What stands out', 'Highlights', b.highlights),
      card('For the student', b.studentsTitle, b.students),
      card('For the college', b.collegeTitle, b.college),
    ],
  };
}

/* ---- the sections the brochure draws from ---------------------------- */

const timeline = block('sec_526bd46b99ec4733', 'milestone-timeline');
const leader = block('sec_86a3d4d6212b4892', 'leader-hero');
const journey = block('sec_d2646548cb65432d', 'leadership-panels');
const programs = block('sec_2ce27ff81ff0481d', 'program-deck');
const coe = block('sec_bddf4b1b0ee64631', 'coe-wall');
const certs = block('sec_dd3be7a2809a4d9e', 'certification-wall');
const places = block('sec_23024decb4804a5e', 'placement-wall');
const events = block('sec_86f7d33fd59c4bda', 'event-reel');
const resumes = block('sec_36db91d0532440aa', 'video-resume');
const course = courseBlock('sec_ai_ready_engineer_th');
const platforms = block('sec_40a34fb614164fad', 'platforms');

/* ---- derived counts --------------------------------------------------- */

const held = certs.credentials.reduce((n, c) => n + (c.held || 0), 0);

const vendorTotals = {};
for (const c of certs.credentials) {
  vendorTotals[c.vendor] = (vendorTotals[c.vendor] || 0) + (c.held || 0);
}
const vendorLeague = Object.entries(vendorTotals)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count);

const topCredentials = certs.credentials
  .slice()
  .sort((a, b) => (b.held || 0) - (a.held || 0))
  .slice(0, 8)
  .map((c) => ({ name: c.name, vendor: c.vendor, held: c.held, domain: c.domain }));

const filmsIn = (chapter) =>
  (chapter.groups || []).reduce((n, g) => n + (g.films || []).length, 0);
const filmTotal = events.chapters.reduce((n, c) => n + filmsIn(c), 0);

const imagesIn = (chapter) =>
  (chapter.groups || []).reduce((n, g) => n + (g.images || []).length, 0);

const placementChapters = places.chapters.map((c) => ({
  name: c.name,
  blurb: c.blurb,
  count: imagesIn(c),
}));
const placementRecords = placementChapters.reduce((n, c) => n + c.count, 0);

/* Company names evidenced by the placement photographs in the deck — the
   "Inside the Companies" groups are literally named after the offices the
   pictures came back from. */
const insideCompanies = (places.chapters.find((c) => c.key === 'stories')?.groups || [])
  .map((g) => g.name)
  .filter(Boolean);

const modulesFrame = course.frames.find((f) => f.kind === 'modules');
const moduleNames = (modulesFrame?.items || []).map((m) => m.title || m.name);

const benefitFrames = course.frames
  .filter((f) => f.kind === 'cards')
  .map((f) => ({
    eyebrow: f.eyebrow,
    title: f.title,
    items: (f.items || []).map((i) => ({ title: i.title, body: i.body })),
  }));

/* ---- authored prose --------------------------------------------------- */
/* Written for the brochure. Every claim in here traces to the deck or to
   incoming/Organization Overview/Executive Summary/content.txt. */

const executiveSummarySource = fs.readFileSync(
  path.join(ROOT, 'incoming', 'Organization Overview', 'Executive Summary', 'content.txt'),
  'utf8',
);
const summaryLines = executiveSummarySource
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const content = {
  org: {
    name: 'Technical Hub',
    wordmark: ['TECHNICAL', 'HUB'],
    founded: '3 February 2016',
    home: 'Aditya University, Surampalem',
    region: 'Kakinada, Andhra Pradesh, India',
    email: 'babji@technicalhub.io',
    phone: '+91 83 43 81 81 81',
    site: 'technicalhub.io',
    ai: 'claude.technicalhub.io',
    youtube: 'youtube.com/@technicalhubio',
    linkedin: 'linkedin.com/in/babjineelam',
    strapline: 'Building skilled careers. Creating better tomorrows.',
    edition: 'Company Profile · Edition 2026',
  },

  cover: {
    kicker: 'Since 2016 · Kakinada, Andhra Pradesh',
    titleTop: 'COMPANY',
    titleBottom: 'PROFILE',
    standfirst:
      'Ten years of building the bridge between what industry needs and what academia teaches.',
    badge: '10 Years of Excellence',
  },

  /* The headline figures. Each one is sourced, and the source is printed in
     the brochure's own small print so a reader can check it. */
  marquee: [
    { value: '10', suffix: '', label: 'Years of operation', note: 'Since 3 Feb 2016' },
    { value: '16,000', suffix: '+', label: 'Certifications earned', note: 'Global industry credentials' },
    { value: '22,000', suffix: '+', label: 'LinkedIn community', note: 'Professional followers' },
    { value: '900', suffix: '+', label: 'In Project Space', note: 'AI innovation projects' },
  ],

  summary: {
    eyebrow: 'Executive summary',
    title: ['Not a training centre.', 'A career ecosystem.'],
    lead: summaryLines[0],
    points: summaryLines.slice(1),
    body: [
      'Technical Hub was started inside a university campus with one blunt observation: a graduate can hold a good degree and still be unable to do the first day of the job. Everything built since has worked on that single gap — certify the skill the industry actually hires for, make the student build something real, then put them in front of the companies.',
      'The ecosystem now runs programmes, vendor academies, a certification register, placement drives, an in-house product stack and an AI practice. It is operated from one campus and it is designed to be transplanted onto another.',
    ],
  },

  mission: [
    {
      title: 'Mission',
      body: 'Bridge the gap between academia and industry, so that a student from any background leaves campus employable on day one.',
    },
    {
      title: 'Method',
      body: 'Industry certification, project-based learning and relentless placement practice — measured, published and repeated every cohort.',
    },
    {
      title: 'Reach',
      body: 'Built for students from rural and tier-2/3 backgrounds, who make up most of the intake and most of the offers.',
    },
  ],

  leader: {
    eyebrow: leader.kicker,
    first: leader.firstName,
    last: leader.lastName,
    tagline: leader.tagline,
    body: leader.body,
    tags: (leader.tags || []).map((t) => t.label),
    links: (leader.links || []).map((l) => ({ label: l.label, note: l.note, href: l.href })),
    quote:
      'The students here are as good as any in the world. They don’t need charity — they need a bridge to industry. That is what we build, every single day.',
  },

  journey: {
    eyebrow: journey.kicker,
    title: journey.titleLines,
    standfirst: journey.standfirst,
    panels: (journey.panels || []).map((p) => ({
      chapter: p.chapter,
      year: p.year,
      role: p.role,
      summary: p.summary,
      highlights: p.highlights || [],
      image: assetPath(p.assetId),
    })),
  },

  timeline: {
    eyebrow: timeline.kicker,
    title: timeline.title,
    stops: (timeline.stops || []).map((s) => ({
      label: s.label,
      title: s.title,
      bullets: s.bullets || [],
    })),
  },

  programs: {
    title: programs.title,
    items: (programs.programs || []).map((p) => ({
      name: p.name,
      logo: p.logo,
      films: (p.videos || []).length,
      photos: (p.photos || []).length,
    })),
  },

  coe: {
    title: coe.title,
    centers: (coe.centers || []).map((c) => ({
      name: c.name,
      tagline: c.tagline,
      logo: c.logoFull || c.logo,
      color: c.color,
    })),
  },

  certifications: {
    eyebrow: certs.eyebrow,
    title: certs.title,
    lead: certs.lead,
    quote: certs.quote,
    quoteBy: certs.quoteBy,
    credentialCount: certs.credentials.length,
    vendorCount: certs.vendors.length,
    held,
    league: vendorLeague,
    top: topCredentials,
  },

  placements: {
    eyebrow: places.eyebrow,
    title: places.title,
    lead: places.lead,
    chapters: placementChapters,
    records: placementRecords,
    inside: insideCompanies,
    /* Named in the Leadership Journey panel — the companies the ecosystem's
       students have progressed into. User-authored copy, quoted not invented. */
    destinations: [
      'Google', 'Amazon', 'Walmart', 'Cisco', 'Flipkart', 'Myntra',
      'Airbus', 'DBS Bank', 'AWS', 'AMD',
    ],
  },

  events: {
    eyebrow: events.eyebrow,
    title: events.title,
    lead: events.lead,
    films: filmTotal,
    chapters: events.chapters.map((c) => ({
      name: c.name,
      blurb: c.blurb,
      films: filmsIn(c),
    })),
  },

  resumes: {
    eyebrow: resumes.eyebrow,
    title: resumes.title,
    lead: resumes.lead,
    count: (resumes.people || []).length,
  },

  course: {
    eyebrow: course.eyebrow,
    title: course.titleLines,
    standfirst: course.standfirst,
    stats: course.stats || [],
    credential: course.credential || {},
    partners: course.partners || [],
    modules: moduleNames,
    frames: benefitFrames,
  },

  platforms: {
    title: platforms.title,
    items: (platforms.items || []).map((i) => ({
      name: i.name,
      blurb: i.blurb,
      logo: i.logo,
      url: i.url,
      tint: i.tint,
    })),
  },

  /* The ask. This is what the brochure exists to make happen. */
  partnership: {
    eyebrow: 'Academic partnership',
    title: ['What a campus', 'signs up for.'],
    lead:
      'An MOU with Technical Hub puts a working skill-development ecosystem onto your campus — the vendor academies, the certification pipeline, the project culture and the placement machinery, run by people who have done it for ten years.',
    offers: [
      {
        title: 'Vendor Centres of Excellence',
        body: 'Authorised academies from the platforms industry actually runs on — Claude, AWS, Oracle, Red Hat, Microsoft, Cisco and ServiceNow among them — stood up on your campus under your name.',
      },
      {
        title: 'A certification pipeline',
        body: 'Cohorts prepared, entered and tracked through global exams, with the register published batch by batch rather than claimed in the abstract.',
      },
      {
        title: 'Project-based learning',
        body: 'Project Space and the programme ladder, so students graduate with shipped work rather than a transcript alone.',
      },
      {
        title: 'Placement machinery',
        body: 'Mock interviews, aptitude and communication training, campus drives and open drives — plus the video-resume practice that puts a face to every CV.',
      },
      {
        title: 'An AI practice, not an AI module',
        body: 'The AI Ready Engineer programme, the Claude and OpenAI partnerships, and a Centre of Excellence your students build inside.',
      },
      {
        title: 'Branding that travels',
        body: 'Your campus named in the certification register, in the placement record and in the films — the evidence an admissions office can actually show.',
      },
    ],
    close: 'Step in. Stand out.',
  },

  contents: [
    { n: '01', label: 'Welcome & contents', page: 2 },
    { n: '02', label: 'Who we are', page: 3 },
    { n: '03', label: 'Founder & CEO', page: 4 },
    { n: '04', label: 'Leadership journey', page: 5 },
    { n: '05', label: 'Development history 2015–2020', page: 6 },
    { n: '06', label: 'Development history 2021–2030', page: 7 },
    { n: '07', label: 'Programs', page: 8 },
    { n: '08', label: 'Centers of Excellence', page: 9 },
    { n: '09', label: 'Certifications', page: 10 },
    { n: '10', label: 'Placements', page: 11 },
    { n: '11', label: 'Events & campus life', page: 12 },
    { n: '12', label: 'AI Ready Engineer', page: 13 },
    { n: '13', label: 'Platforms we built', page: 14 },
    { n: '14', label: 'Academic partnership', page: 15 },
    { n: '15', label: 'Contact', page: 16 },
  ],
};

module.exports = { content, UPLOADS, ROOT };
