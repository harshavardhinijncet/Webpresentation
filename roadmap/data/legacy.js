/*
 * The Technical Hub legacy: the case for choosing it. Every fact here comes from the Technical Hub company profile
 * (Company Profile app → technical-hub sections: Executive Summary, History &
 * Milestones, Leadership Journey, Certifications, Placements, Collaborations).
 */
const L = (k) => `legacy/${k}.jpg`;
const img = (src, caption = '') => ({ type: 'image', src, caption });
const yt = (id, caption = '') => ({ type: 'youtube', id, caption });

// "Why Technical Hub": the headline numbers and the eight reasons, each opening its photos.
// Each card's cover is a short slideshow: `slides` of photos, logos, films, or the years themselves.
const pic = (src) => ({ t: 'img', src });
const logo = (src) => ({ t: 'logo', src });
const film = (src) => ({ t: 'video', src });
const COE = ['pega'];
const COE_LOGOS = ['claude', 'openai', 'snowflake', 'redhat', 'pega'];
const COE_PICS = ['coe/claude/01.jpg', 'coe/claude/03.jpg', 'coe/snowflake/07.jpg', 'coe/snowflake/08.jpg', 'added3/redhat-academy-certified.jpg', 'coe/redhat/15.jpg', 'coe/redhat/16.jpg', 'added2/pega-jpeg.jpg', 'added2/pega5-jpeg.jpg'];
const CERTS = ['added3/certified-trainees.jpg', 'added3/certified-students.jpg', 'added3/certification-beginning.jpg', 'legacy/16k-post.jpg', 'rm/certi.jpg', 'rm/certi1.jpg', 'rm/certi2.jpg', 'rm/certi3.jpg', 'rm/pegacerti.jpg'];
const PLACED = ['google', 'walmart', 'cisco', 'airbus', 'flipkart', 'hsbc', 'maersk', 'uipath'].map((k) => L(`pl-${k}`));
const AI = ['partners/claude-certified-services-partner.png', 'partners/openai-select-partner.jpeg', 'partners/sarvam-ai.jpeg'];
const AI_PICS = ['coe/torii-ai/02.jpg', 'coe/torii-ai/06.jpg', 'coe/torii-ai/08.jpg', 'coe/torii-ai/10.jpg', 'coe/claude/01.jpg'];
const FILMS = ['platforms/myna-demo.mp4', 'platforms/tag.mp4', 'platforms/torii-minds.mp4', 'platforms/owlcoder-demo.mp4'];

// the ten years, as a short self-playing sequence: from the Technical Hub profile's History & Milestones
const YEARS = [
  ['2016', 'Technical Hub is founded', 'At Aditya University, February 2016', 'added2/thub-transform-jpeg.jpg'],
  ['2017', 'Strong foundations', 'A coding culture, workshops and hackathons', L('coe-coding')],
  ['2018', 'Industry integration', 'A global certification ecosystem', L('hero-certified')],
  ['2019', 'Innovation', 'Real-time project learning', L('lab-wide')],
  ['2020', 'Digital transformation', 'Online learning and remote certifications', L('session-green')],
  ['2021', 'Career readiness', 'Mock interviews, aptitude and communication', L('speaker-hall')],
  ['2022', 'Future-ready learning', 'AI, data science and cloud', L('coe-aws')],
  ['2023', 'Ecosystem expansion', 'OwlCoder and Drive Ready at scale', L('projectspace-team')],
  ['2024', 'Enterprise skill development', 'Microsoft, AWS, Cisco, Red Hat and Oracle', L('lab-wide2')],
  ['2025', 'The AI era', 'A Claude Centre of Excellence', L('lj-ai')],
  ['2026', '10 years of excellence', 'The Anthropic Claude partnership', L('group-huge')],
];

// "Why Technical Hub": the headline numbers and the eight reasons, each opening its photos and films.
export const why = {
  lead: { n: 10, label: 'Years', since: 'Since 2016' },
  stats: [
    { n: 16000, suffix: '+', label: 'Global Certifications' },
    { n: 50000, suffix: '+', label: 'Students Trained' },
    { n: 20, suffix: '+', label: 'Centres of Excellence' },
    { n: 3000, suffix: '+', label: 'Internships' },
  ],
  features: [
    { key: 'decade', icon: 'flag', title: 'A decade of practice', points: ['Founded in February 2016 at Aditya University', 'Ten years of programmes, projects and placements'],
      slides: YEARS.map(([y, t, d, src]) => ({ t: 'year', y, title: t, d, src })), every: 2600 },
    { key: 'certs', icon: 'award', title: 'Industry certifications', points: ['32,000+ certifications earned', 'Microsoft, AWS, Oracle, Cisco and more — 22 vendors'], slides: CERTS.map(pic) },
    { key: 'coe', icon: 'building', title: 'Centres of Excellence', points: ['Our own centres, built with industry leaders', 'Claude, OpenAI, Snowflake, Red Hat and Pega'],
      slides: [...COE_LOGOS.map((k) => logo(`coe/logos/${k}.png`)), ...COE.map((k) => pic(L(`coe-${k}`))), ...COE_PICS.map(pic)], every: 1800 },
    { key: 'placements', icon: 'briefcase', title: 'Careers that go far', points: ['The highest placements and better offers', 'Google, Walmart, Cisco, Airbus, Flipkart, HSBC'], slides: PLACED.map(pic) },
    { key: 'projects', icon: 'rocket', title: 'Real projects', points: ['Products our own teams built: Myna, TAG, Torii', 'Project Space, eight seasons; 3,000+ internships'], slides: FILMS.map(film) },
    { key: 'ai', icon: 'sparkles', title: 'AI-first', points: ['Claude Partner Network · OpenAI Select Partner', 'Sarvam AI partner · ten Claude Certified Architects'],
      slides: [...AI.map(logo), ...AI_PICS.map(pic)] },
    { key: 'programmes', icon: 'layers', title: 'A programme for every year', points: ['Bamboo → SkillUp → Drive Ready / AI Ready → Owl Coder', 'Built on the T-shaped engineer framework'],
      slides: ['cards/bamboo.png', 'cards/skillup.png', 'logos/moon-coder-dark.png', 'cards/drive.png', 'cards/air.png', 'cards/owl.png'].map(logo), every: 1600 },
    { key: 'global', icon: 'globe', title: 'Global exposure', points: ['GITEX Global and Global Dev Slam, Dubai', 'A curriculum designed for a college in Oman'],
      slides: [{ t: 'video', src: 'added2/gitex-global.mp4' }, ...['global1-jpeg', 'global2-jpeg', 'global3-jpeg', 'global-5-jpeg', 'global6-jpeg', 'global7-jpeg'].map((k) => pic(`added2/${k}.jpg`)), pic('added3/college-curriculum.jpg')] },
    { key: 'beyond', icon: 'rocket', title: 'Beyond the work zone', points: ['Clash of Techies, a balloon satellite launch', 'Safety apps for AP Police; a CSR awareness drive'],
      slides: [{ t: 'video', src: 'added3/clash-of-techies.mp4' }, pic('added3/ap-police-app.jpg'), pic('added3/csr-app.jpg'), pic('added3/ap-police.jpg')] },
    { key: 'leader', icon: 'compass', title: 'Led by experience', points: ['Founder Babji Neelam: 12+ years in IT', 'IBM and Wipro, across three continents'], slides: ['added3/babji-legacy.jpg', 'added3/leadership.jpg', 'added3/babji-ncet-team.jpg', 'added2/babji1-jpeg.jpg', 'added2/babjileg1-jpeg.jpg', 'added2/babji-leg-jpeg.jpg', 'legacy/lj-ai.jpg'].map(pic), every: 2600 },
  ],
  milestones: [
    ['2016', 'Founded'], ['2018', 'Global certifications'], ['2020', 'Digital learning'], ['2022', 'AI & cloud'],
    ['2023', 'Drive Ready at scale'], ['2025', 'AI era'], ['2026', '10 years'], ['2030', 'Vision'],
  ],
};

// Photos and films behind each reason, opened in the media drawer.
export const legacyLibrary = {
  'legacy-films': { title: 'Technical Hub on film', tag: 'Anniversary and journey films', logo: 'brand/technical-hub-mark.png',
    media: [yt('7ySirk9x-s4', 'Why Technical Hub'), yt('2ad0TiZhc40', '9th Anniversary'), yt('ZLZ_caELALU', 'Technical Hub Journey 2024'), yt('J1K4Jv33vJc', '8th Anniversary'),
      yt('AO-Unwthsss', 'Technical Hub Journey 2023'), yt('Bi185TMReEs', 'Technical Hub Journey 2022'), yt('J1AaijZLehQ', '7th Anniversary'), yt('npWZvkGebf8', 'Technical Hub Golden Day')] },
  'legacy-decade': { title: 'A decade of practice', tag: 'Since February 2016', logo: 'brand/technical-hub-mark.png',
    media: [img(L('since2016'), 'Since 2016'), img(L('crowd-believe'), 'Believe in yourself'), img(L('group-huge'), 'The whole campus'), img(L('group-students'), 'Students'), img(L('campus-night'), 'Campus at night')] },
  'legacy-certs': { title: 'Industry certifications', tag: '42 credentials · 22 vendors', logo: 'brand/technical-hub-mark.png',
    media: [...CERTS.map((src) => img(src, 'Certified trainees'))], },
  'legacy-coe': { title: 'Centres of Excellence', tag: 'Claude · OpenAI · Snowflake · Red Hat · Pega', logo: 'brand/technical-hub-mark.png',
    media: [...COE.map((k) => img(L(`coe-${k}`), 'Centre of Excellence')), ...COE_PICS.map((src) => img(src, 'Centre of Excellence'))], },
  'legacy-placements': { title: 'Careers that go far', tag: 'Offers up to 29.27 LPA', logo: 'brand/technical-hub-mark.png',
    media: ['google', 'walmart', 'cisco', 'airbus', 'flipkart', 'hsbc', 'maersk', 'uipath'].map((k) => img(L(`pl-${k}`), 'Golden success')) },
  'legacy-projects': { title: 'Real projects', tag: 'Project Space · 3,000+ internships', logo: 'logos/project-space-t.png',
    media: [...FILMS.map((src) => ({ type: 'video', src, caption: 'Built by our teams' })), img(L('project-street'), 'Project Street'), img(L('projectspace-team'), 'Project Space')], },
  'legacy-ai': { title: 'AI-first', tag: 'Claude Partner Network · OpenAI Select Partner', logo: 'brand/technical-hub-mark.png',
    media: [...AI_PICS.map((src) => img(src, 'AI-first'))], },
  'legacy-programmes': { title: 'A programme for every year', tag: 'The T-shaped engineer', logo: 'brand/technical-hub-mark.png',
    media: [img(L('tech30'), '30+ technologies'), img(L('session-green'), 'Sessions'), img(L('speaker-hall'), 'Expert talks'), img(L('hall-training'), 'Training')] },
  'legacy-global': { title: 'Global exposure', tag: 'GITEX Global · Global Dev Slam · Oman', logo: 'brand/technical-hub-mark.png',
    media: [{ type: 'video', src: 'added2/gitex-global.mp4', caption: 'GITEX Global' }, ...['global1-jpeg', 'global2-jpeg', 'global3-jpeg', 'global-5-jpeg', 'global6-jpeg', 'global7-jpeg'].map((k) => img(`added2/${k}.jpg`, 'GITEX Global · Global Dev Slam')),
      img('added3/college-curriculum.jpg', 'Curriculum designed for a college in Oman')] },
  'legacy-beyond': { title: 'Beyond the work zone', tag: 'Clash of Techies · balloon satellite · apps for AP Police', logo: 'brand/technical-hub-mark.png',
    media: [{ type: 'video', src: 'added3/clash-of-techies.mp4', caption: 'Clash of Techies' }, { type: 'video', src: 'added3/balloon-satellite.mp4', caption: 'Balloon satellite launch' },
      img('added3/ap-police-app.jpg', 'A safety app for AP Police'), img('added3/ap-police.jpg', 'With AP Police'), img('added3/csr-app.jpg', 'Spreading the app: a CSR awareness drive')] },
  'legacy-leader': { title: 'Led by experience', tag: 'Babji Neelam · Founder & CEO', logo: 'brand/technical-hub-mark.png',
    media: [img(L('lj-ibm'), 'Technology foundation · IBM'), img(L('lj-wipro'), 'Global leadership · Wipro'), img(L('lj-vision'), 'The birth of Technical Hub'), img(L('lj-ecosystem'), 'Ecosystem builder'), img(L('lj-ai'), 'AI & innovation')] },
};
