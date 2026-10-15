/*
 * The whole roadmap as data. Transcribed from the hand-drawn programme sheet.
 *
 *   phases     – the four programme names, one per year
 *   tracks     – the seven stages every semester walks through, in order
 *   semesters  – what each stage holds, semester by semester
 *   library    – every item that has a logo, photographs or films behind it
 *
 * A stage item is either a plain label or { label, ref } where `ref` is a key into
 * `library`. An empty stage list renders as "not in this semester" — never invent
 * an entry to fill it.
 *
 * Media paths are relative to /media (server/media). YouTube entries need internet
 * at presentation time; local .mp4 files do not.
 */

const img = (src, caption = '') => ({ type: 'image', src, caption });
const vid = (src, caption = '') => ({ type: 'video', src, caption });
const pdf = (src, caption = '') => ({ type: 'pdf', src, caption });
const yt = (id, caption = '') => ({ type: 'youtube', id, caption });
const seq = (n, f) => Array.from({ length: n }, (_, i) => f(String(i + 1).padStart(2, '0')));

export const phases = [
  { id: 'bamboo', name: 'Bamboo Coder', short: 'Foundations', year: 1, semesters: ['1-1', '1-2'], color: 'green', logo: 'logos/bamboo-coder-plain.png',
    line: 'Roots first — programming logic, the first AI literacy and the habits of a coder.' },
  { id: 'skillup', name: 'SkillUp Coder', short: 'Core CS & projects', year: 2, semesters: ['2-1', '2-2'], color: 'gold', logo: 'logos/skillup-coder-t.png',
    line: 'Core computer science, real projects and the first taste of industry.' },
  { id: 'driveready', name: 'Drive Ready · AI Ready Engineer', short: 'Industry stacks & AI', year: 3, semesters: ['3-1', '3-2'], color: 'orange',
    logo: 'logos/drive-ready-t.png', logo2: 'brand/ai-ready-engineer-t.png',
    line: 'Industry stacks, AI engineering and placement readiness.' },
  { id: 'owl', name: 'Owl Coder', short: 'Production & placement', year: 4, semesters: ['4-1', '4-2'], color: 'ink', logo: 'logos/owl-coder-t.png',
    line: 'Production AI, live campus projects and the placement run.' },
];

export const tracks = [
  { id: 'technology', name: 'Technology Track', short: 'Technology', icon: 'cpu',
    about: 'The core language or stack the semester is built around.' },
  { id: 'ai', name: 'AI Engineer Track', short: 'AI Engineer', icon: 'sparkles',
    about: 'One AI course every semester — from literacy to production.' },
  { id: 'certification', name: 'Certification & Project', short: 'Certification', icon: 'award',
    about: 'Industry certifications and the projects that prove the skill.' },
  { id: 'exposure', name: 'Exposure', short: 'Exposure', icon: 'globe',
    about: 'Events that take students beyond the classroom.' },
  { id: 'industry', name: 'Industry Readiness', short: 'Industry Ready', icon: 'briefcase',
    about: 'Aptitude, coding and communication — the skills recruiters test.' },
  { id: 'contest', name: 'Contests', short: 'Contests', icon: 'trophy',
    about: 'Competitions that keep the practice honest.' },
  { id: 'tools', name: 'Tools', short: 'Tools', icon: 'wrench',
    about: 'Platforms students practise on, all semester long.' },
];

/* ---------------------------------------------------------------- library ---- */

const AI_CLASS = seq(12, (n) => img(`ai/class-${n}.jpg`, 'AI Ready Engineer classroom'));

export const library = {
  // Technology
  'c-language': { title: 'C Language', tag: 'Programming foundations',
    about: 'Where every Bamboo Coder starts: problem solving and programming logic in C.',
    media: [img('class/c-1.jpg', 'C programming class'), img('class/c-2.jpg', 'C programming class'), img('class/c-3.jpg', 'C programming class')] },
  'python-ds': { title: 'Python & Data Structures', tag: 'Programming foundations',
    about: 'Python, and the data structures every later track builds on.',
    media: [img('class/python-1.jpg', 'Python class'), img('class/python-2.jpg', 'Python class'), img('class/python-3.jpg', 'Python class')] },
  'ads-java': { title: 'Advanced Data Structures & Java', tag: 'Core computer science',
    about: 'Advanced data structures alongside Java.',
    media: [img('class/java-1.jpg', 'Java class'), img('class/java-2.jpg', 'Java class'), img('class/java-3.jpg', 'Java class'), img('tech/coe-java.jpg', 'Java Centre of Excellence'), img('certifications/oracle-java.jpg', 'Oracle Academy Java certification')] },
  dbms: { title: 'DBMS', tag: 'Core computer science',
    about: 'Database management systems — design, SQL and the data layer.',
    media: [img('class/dbms-1.jpg', 'Database class'), img('class/dbms-2.jpg', 'Database class'), img('tech/coe-oracle.jpg', 'Oracle Academy'), img('tech/oracle-01.jpg', 'Oracle CoE'), img('tech/oracle-02.jpg', 'Oracle CoE')] },
  'drive-ready': { title: 'Drive Ready', tag: 'Placement-ready programme', logo: 'logos/drive-ready-t.png',
    about: 'Technical Hub’s Drive Ready programme — "We are here to design your future".',
    media: [yt('J7rIcZ-YoRg', 'Drive Ready 7.0'), yt('bZus9z5qZ2A', 'Drive Ready'), img('rm/dr1.jpg', 'Drive Ready, 100 days'), img('rm/drtest1.jpg', 'Drive Ready eligibility test'), img('rm/drtest2.jpg', 'Drive Ready eligibility test'), img('rm/drtest3.jpg', 'Drive Ready eligibility test')] },
  'ai-ready': { title: 'AI Ready Engineer', tag: 'The AI Ready Engineer programme', logo: 'brand/ai-ready-engineer-t.png',
    about: 'A structured path from the first AI class to an AI engineer, delivered with Torii Minds.',
    media: [vid('ai/training-reel.mp4', 'AI Ready Engineer — in the classroom'), img('ai/roadmap.jpg', 'The AI Ready Engineer road map'),
      img('ai/trainees-onboarded.jpg', 'Trainees onboarded'), ...AI_CLASS.slice(0, 6), img('platforms/ai-ready-screen.png', 'The AI Ready Engineer platform')] },
  aws: { title: 'AWS', tag: 'Cloud', media: [img('tech/coe-aws.jpg', 'AWS Centre of Excellence'), img('tech/aws-01.jpg', 'AWS CoE'), img('tech/aws-02.jpg', 'AWS CoE'),
    img('certifications/aws-solution-architect.jpg', 'AWS Certified Solutions Architect'), img('certifications/aws-cloud-practitioner.jpg', 'AWS Cloud Practitioner')] },
  'data-eng': { title: 'Data Engineering', tag: 'Data', media: [img('tech/snowflake-01.jpg', 'Snowflake CoE'), img('tech/snowflake-02.jpg', 'Snowflake CoE'), img('campus/session-pipeline.jpg', 'Pipeline session'), img('rm/coesnowflake.jpg', 'Snowflake orientation')] },
  flutter: { title: 'Flutter', tag: 'Mobile', media: [img('tech/coe-mobile.jpg', 'Flutter & mobile Centre of Excellence')] },
  servicenow: { title: 'ServiceNow', tag: 'Enterprise platform', media: [img('tech/coe-servicenow.jpg', 'ServiceNow Centre of Excellence'),
    img('certifications/servicenow.jpg', 'ServiceNow certified'), img('certifications/servicenow-admin.jpg', 'ServiceNow administrators')] },
  pega: { title: 'Pega', tag: 'Enterprise platform', media: [img('tech/coe-pega.jpg', 'Pega Centre of Excellence'), ...seq(4, (n) => img(`tech/pega-${n}.jpg`, 'Pega CoE')),
    img('certifications/pega-system-architect.jpg', 'Pega System Architect'), yt('asLTQ9V4kOI', 'Pega'), img('rm/pegacerti.jpg', 'Pega Certified Senior System Architect')] },
  'owl-coder': { title: 'Owl Coder', tag: 'Semesters 3-2 to 4-1', logo: 'logos/owl-coder-t.png',
    about: 'The final-year programme: live projects, deployment and the placement run.',
    media: [img('programs/owl-coder.jpg', 'Owl Coder 5.0'), yt('5xUzKes5Pcs', 'Owl Coder'), yt('sIA1L7rWtow', 'Life of an Owl Coder'),
      yt('t9aB4kHGk0w', 'Owl Coder deliverables'), yt('Q0O3zrzOoEc', 'Halloween at Owl Coder'), img('rm/owl1.jpg', 'Owl Coder 4.0 launch')] },

  // Programmes named on the sheet
  'bamboo-coder': { title: 'Bamboo Coder', tag: 'Year 1 programme', logo: 'logos/bamboo-coder-v2-t.png',
    about: 'The first-year programme — programming roots and the habits of a coder.',
    media: [img('exposure/first-year-inauguration-01.png', 'First-year inauguration'), img('exposure/first-year-inauguration-02.png', 'First-year inauguration'),
      img('exposure/first-year-inauguration-03.png', 'First-year inauguration')] },
  'skillup-coder': { title: 'SkillUp Coder', tag: 'Year 2 programme', logo: 'logos/skillup-coder-t.png',
    media: [vid('programs/skillup.mp4', 'SkillUp Coder'), yt('dh9pHFS-y24', 'SkillUp Coder'), img('rm/sup-eligibility-test.jpg', 'SkillUp Coder entrance test'), img('rm/supentrance.jpg', 'SkillUp Coder entrance test'), img('rm/sup1.jpg', 'SkillUp Coder entrance test'), img('rm/sup2.jpg', 'SkillUp Coder entrance test'), img('rm/sup3.jpg', 'SkillUp Coder entrance test'), img('rm/suptest1.jpg', 'SkillUp Coder entrance test'), img('rm/suptest2.jpg', 'SkillUp Coder entrance test'), img('rm/suptest3.jpg', 'SkillUp Coder entrance test'), img('rm/suptest4.jpg', 'SkillUp Coder entrance test')] },
  'moon-coder': { title: 'Moon Coder', tag: 'Semesters 2-2 to 3-1', logo: 'logos/moon-coder-dark.png',
    media: [img('programs/moon-coders.jpg', 'Moon Coders'), img('programs/moon-coders-launch.jpg', 'Launching Moon Coders'), yt('W95j8i1LnbA', 'Moon Coders'), img('rm/mc1.jpg', 'Moon Coders'), img('rm/mc3.jpg', 'Moon Coders'), img('rm/mc4.jpg', 'Moon Coders'), img('rm/mc5.jpg', 'Moon Coders')] },
  grow: { title: 'Grow', tag: 'Programme', logo: 'logos/grow.png', media: [yt('WBINrie9mzc', 'Grow')] },

  // AI track — one pool of AI Ready classroom media, different cuts per semester
  'ai-literacy': { title: 'AI Literacy', tag: 'AI Engineer · step 1', logo: 'brand/ai-ready-engineer-t.png',
    about: 'What AI is, how to use it well and responsibly — the first step of the AI Engineer track.',
    media: [vid('ai/training-reel.mp4', 'AI Ready Engineer — in the classroom'), ...AI_CLASS.slice(0, 3)] },
  'ai-exposure': { title: 'AI Exposure & Experience', tag: 'AI Engineer · step 2', logo: 'brand/ai-ready-engineer-t.png',
    about: 'Hands-on exposure to AI tools and assistants across everyday coding work.',
    media: [...AI_CLASS.slice(3, 6), img('ai/roadmap.jpg', 'The AI Ready Engineer road map')] },
  'ai-foundations': { title: 'AI Foundations', tag: 'AI Engineer · step 3', logo: 'brand/ai-ready-engineer-t.png',
    about: 'The foundations under modern AI — data, models and how they learn.',
    media: [...AI_CLASS.slice(6, 9), img('ai/roadmap.jpg', 'The AI Ready Engineer road map')] },
  'ai-application': { title: 'AI-Assisted Development', tag: 'AI Engineer · step 4', logo: 'brand/ai-ready-engineer-t.png',
    about: 'Putting AI into applications — building with models rather than only using them.',
    media: [...AI_CLASS.slice(9, 12), vid('platforms/ai-engineer-lms.mp4', 'The AI Engineer LMS')] },
  'ai-intelligence': { title: 'AI Intelligence', tag: 'AI Engineer · step 5', logo: 'brand/ai-ready-engineer-t.png',
    media: [vid('ai/training-reel.mp4', 'AI Ready Engineer — in the classroom'), ...AI_CLASS.slice(0, 4)] },
  'ai-product': { title: 'AI Product & Industry Readiness', tag: 'AI Engineer · step 6', logo: 'brand/ai-ready-engineer-t.png',
    media: [img('ai/class-11.jpg', 'AI Ready Engineer classroom'), img('ai/class-12.jpg', 'AI Ready Engineer classroom')] },
  'ai-engineering': { title: 'AI Engineering', tag: 'AI Engineer · step 6', logo: 'brand/ai-ready-engineer-t.png',
    media: [img('ai/trainees-onboarded.jpg', 'AI Ready Engineer trainees'), ...AI_CLASS.slice(4, 8)] },
  'ai-production': { title: 'AI Production', tag: 'AI Engineer · step 7', logo: 'brand/ai-ready-engineer-t.png',
    about: 'Taking AI systems to production.',
    media: [...AI_CLASS.slice(8, 12), img('workspace/floor-screens.jpg', 'Torii workspace')] },
  'ai-deployment': { title: 'Testing & AI Deployment', tag: 'AI Engineer · step 8', logo: 'brand/ai-ready-engineer-t.png',
    about: 'Testing, shipping and running AI in the real world.',
    media: [img('workspace/floor-wide.jpg', 'Torii workspace'), img('workspace/floor-desks-1.jpg', 'Torii workspace'), vid('ai/training-reel.mp4', 'AI Ready Engineer')] },

  // Certification & project
  certification: { title: 'Certifications', tag: 'Industry credentials',
    about: 'Vendor certifications earned alongside the semester — AWS, Microsoft, Oracle, Pega, ServiceNow, Red Hat, Google Cloud and more.',
    media: [img('certifications/16k-certifications.jpg', 'Certifications at Technical Hub'), img('certifications/aws-solution-architect.jpg', 'AWS Solutions Architect'),
      img('certifications/azure-fundamentals.jpg', 'Azure Fundamentals'), img('certifications/azure-ai-fundamentals.jpg', 'Azure AI Fundamentals'),
      img('certifications/oracle-cloud.jpg', 'Oracle Cloud Associate'), img('certifications/redhat-sysadmin.jpg', 'Red Hat System Administrator'),
      img('certifications/google-cloud.jpg', 'Google Cloud Associate'), img('certifications/salesforce-admin.jpg', 'Salesforce Admin'),
      yt('bu94vHIGtpI', '30+ certifications'), yt('eUqOavJxRag', 'Technical Hub certification'), img('rm/certi.jpg', 'Certified trainees'), img('rm/certi1.jpg', 'Certified trainees'), img('rm/certi2.jpg', 'Certified trainees'), img('rm/certi3.jpg', 'Certified trainees'), img('rm/pegacerti.jpg', 'Certified trainees')] },
  'capstone-project': { title: 'Capstone Project', tag: 'First full project',
    media: [img('campus/outdoor-review.jpg', 'Project review')] },
  project: { title: 'Projects', tag: 'Build, present, review',
    media: [img('campus/outdoor-review.jpg', 'Project review'), ...seq(3, (n) => img(`exposure/project-week-${n}.jpg`, 'Project Week'))] },
  internship: { title: 'Internship', tag: 'First industry stint',
    media: [img('placements/internships-3000.jpg', 'Internships offered'), img('placements/amazon-internship.jpg', 'Amazon internship'),
      img('placements/myntra-internship.jpg', 'Myntra internship'), yt('IW3DYR2Nr2o', '3000+ internships'), img('rm/internship1.jpg', 'Internship offer'), img('rm/internship5.jpg', 'Internship offer'), img('rm/internship3.jpg', 'Internship offer'), img('rm/internship4.jpg', 'Internship offer'), img('rm/internship7.jpg', 'Internship offer'), img('rm/internship9.jpg', 'Internship offer'), img('rm/internship10.jpg', 'Internship offer'), img('rm/internship11.jpg', 'Internship offer'), img('rm/internship12.jpg', 'Internship offer'), img('rm/internship13.jpg', 'Internship offer'), img('rm/internship14.jpg', 'Internship offer'), img('rm/internship15.jpg', 'Internship offer'), img('rm/internship16.jpg', 'Internship offer'), img('rm/internship17.jpg', 'Internship offer'), img('rm/redhatintern1.jpg', 'Internship offer')] },
  'placement-readiness': { title: 'Placement Readiness', tag: 'Getting interview-ready',
    media: [img('placements/placement-eligibility-test.jpg', 'Placement eligibility test'), ...seq(4, (n) => img(`placements/shine-mode-${n}.jpg`, 'Shine Mode placement training'))] },
  'placement-assistance': { title: 'Placement Assistance', tag: 'The placement run',
    media: [...['google', 'flipkart', 'servicenow176', 'walmart226', 'pega7', 'thoughtworks', 'hsbc', 'cisco'].map((s) => img(`placements/placed-${s}.jpg`, 'Placed')), img('rm/placements1.jpg', 'Placed'), img('rm/walmart1.jpg', 'Placed'), img('rm/walmart2.jpg', 'Placed'), img('rm/wipro1.jpg', 'Placed'), img('rm/sn1.jpg', 'Placed'), img('rm/interplace1.jpg', 'Placed'), img('rm/internship2.jpg', 'Placed'), img('rm/cisco1.jpg', 'Placed')] },
  'campus-live-project': { title: 'Campus Live Project', tag: 'Real work, real users',
    media: ['floor-desks-1', 'floor-desks-2', 'floor-screens', 'lab-boys', 'lab-girls', 'hall-screen'].map((s) => img(`workspace/${s}.jpg`, 'Torii workspace')) },

  // Exposure
  't-connect': { title: 'T-Connect', tag: 'Industry meets campus', logo: 'logos/t-connect.png',
    media: [yt('i7jvz_EU6WU', 'T-Connect'), yt('dPhRj5cTzyo', 'T-Connect'), yt('awFS-mJR9q0', 'T-Connect'), yt('WqkAu3j2slk', 'T-Connect 6.0'), yt('JD8ZQSRi-qs', 'T-Connect 4.0')] },
  'parent-meet': { title: 'Parent Meet', tag: 'Parents in the loop',
    media: [img('exposure/parent-interaction.jpg', 'Parent interaction · Skiller’s Day'), img('exposure/skillers-day.jpg', 'Skiller’s Day')] },
  'hub-hopper': { title: 'Hub Hopper Ceremony', tag: 'Celebrating the achievers',
    media: [img('rm/hubhoppers5.jpg', 'Hub Hoppers ceremony'), img('rm/hubhoppers6.jpg', 'Hub Hoppers ceremony'), img('rm/hubhoppers2.jpg', 'Hub Hoppers ceremony'), img('rm/hubhoppers3.jpg', 'Hub Hoppers ceremony'), img('rm/hubhoppers4.jpg', 'Hub Hoppers ceremony'), img('rm/contest4.jpg', 'Hub Hoppers ceremony')] },
  'nt-square': { title: 'NT Square', tag: 'GitHub Experience Center', logo: 'logos/nt-square.png',
    about: 'NTSquare at NCET — where learning meets industry, with the GitHub Experience Center inside.',
    media: seq(10, (n) => img(`exposure/nt-square-${n}.jpg`, 'NT Square')) },
  'project-week': { title: 'Project Week', tag: 'Numbered teams · one week', logo: 'logos/project-week.png',
    about: 'Teams with chart paper, laptops and a week — Torii mentors moving table to table as ideas take shape.',
    media: seq(9, (n) => img(`exposure/project-week-${n}.jpg`, 'Project Week')) },
  'project-street': { title: 'Project Street', tag: 'Every project, out in the open',
    about: 'Work set up on easels along the campus walkway — explained to mentors, faculty and the crowd at every board.',
    media: [vid('exposure/project-street-film.mp4', 'Project Street'), ...seq(10, (n) => img(`exposure/project-street-${n}.jpg`, 'Project Street'))] },
  'project-space': { title: 'Project Space', tag: 'Identify · Solve · Deploy', logo: 'logos/project-space-t.png',
    media: [img('rm/ps1.jpg', 'Project Space'), img('rm/ps2.jpg', 'Project Space'), img('rm/ps3.jpg', 'Project Space'), img('tech/coe-projectspace.jpg', 'Project Space'), img('campus/projectspace-team.jpg', 'Project Space team'), yt('Zknym0jiol4', 'Project Space 4.0'), yt('E7mvZ0yTDss', 'Season 8'), yt('2YpciZnl2h8', 'Project Space 7.0')] },
  'project-talk': { title: 'Project Talks', tag: 'Industry voices on campus', logo: 'logos/project-talk.png',
    media: [img('rm/pro-talk.jpg', 'Project Talk'), img('rm/pro-talk1.jpg', 'Project Talk')] },
  'mock-interviews': { title: 'Mock Interviews', tag: 'Rehearse before the real one',
    media: [img('events/mock-1.jpg', 'Mock interview'), img('events/mock-2.jpg', 'Mock interview'), img('events/mock-3.jpg', 'Mock interview'), img('events/mock-4.jpg', 'Mock interview'), yt('bSzgeOYDGJU', 'Inside Out: in-house mock interviews')] },

  // Industry readiness
  'industry-skills': { title: 'Aptitude · Coding · Communication', tag: 'What recruiters test',
    media: [...seq(4, (n) => img(`placements/shine-mode-${n}.jpg`, 'Shine Mode placement training'))] },

  // Contests
  'hub-hoppers': { title: 'Hub Hoppers', tag: 'First-year contest · semester 1-2', logo: 'logos/hub-hoppers.png',
    media: [img('rm/hubhoppers5.jpg', 'Hub Hoppers'), img('rm/hubhoppers6.jpg', 'Hub Hoppers'), img('rm/hubhoppers2.jpg', 'Hub Hoppers'), img('rm/hubhoppers3.jpg', 'Hub Hoppers'), img('rm/hubhoppers4.jpg', 'Hub Hoppers'), img('rm/contest4.jpg', 'Hub Hoppers')] },
  fullstack: { title: 'Full Stack Development', tag: 'Web, end to end', media: [img('legacy/coe-fullstack.jpg', 'Full Stack Centre of Excellence')] },
  'video-resumes': { title: 'Video Resumes', tag: 'Every student records their own introduction', media: [yt('mwMu4_6JcCI', 'Anjana'), yt('dXELJOGLmy4', 'Divya Nandini'), yt('BZTaXMKeIO0', 'Sayed Alisha')] },
  'spreadsheet-bootcamp': { title: 'Spreadsheet Bootcamp', tag: 'Excel, light mode and dark mode', media: [] },
  ikya: { title: 'IKYA 2026', tag: 'Torii Minds project stalls · NCET', about: 'Day 2 of IKYA 2026 at Nagarjuna College of Engineering and Technology: students explored the Torii Minds project stalls built by AI Ready Engineers.', media: [img('added3/ikya-stalls.jpg', 'IKYA 2026 · the Torii Minds project stalls'), img('added3/ikya-2026-day2.jpg', 'IKYA 2026 · Day 2 · Torii Minds project stalls'), img('added3/ikya-resumereel.jpg', 'ResumeReel'), img('added3/ikya-jinseiai.jpg', 'JinseiAI')] },
  scinova: { title: 'SCINOVA 2026', tag: 'Science and Innovation Project Exhibition', about: 'Students show what they built through project-based learning: creativity, teamwork and problem solving.', media: [img('added3/scinova-2026.jpg', 'SCINOVA 2026 · 1st winner')] },
  'typing-contest': { title: 'Typing Contest', tag: 'Typo, speed and accuracy', media: [img('events/typo-1.jpg', 'Typo typing contest'), img('events/typo-2.jpg', 'Typo typing contest'), img('events/typo-3.jpg', 'Typo typing contest'), img('events/typo-4.jpg', 'Typo typing contest'), img('events/typo-5.jpg', 'Typo typing contest')] },
  typing: { title: 'Typing', tag: 'Speed and accuracy at the keyboard', media: [img('events/typo-1.jpg', 'Typo typing contest'), img('events/typo-2.jpg', 'Typo typing contest')] },
  'mock-drive': { title: 'Mock Drive', tag: 'A full placement drive, rehearsed', media: [img('events/mock-1.jpg', 'Mock drive'), img('events/mock-2.jpg', 'Mock drive')] },
  'placement-training': { title: 'Placement-oriented Training', tag: 'Aptitude, coding and interviews', media: [img('placements/shine-mode-01.jpg', 'Shine Mode placement training'), img('placements/shine-mode-02.jpg', 'Shine Mode placement training')] },
  portfolio: { title: 'Portfolio Building', tag: 'Projects, résumé and profile', media: [img('placements/resume-building-01.jpg', 'Resume building'), img('placements/resume-building-02.jpg', 'Resume building'), img('placements/resume-building-03.jpg', 'Resume building')] },
  'ai-live': { title: 'Building & Deploying a Live Project', tag: 'AI Engineer · year 4', logo: 'brand/ai-ready-engineer-t.png', media: [img('workspace/floor-screens.jpg', 'Torii workspace'), img('workspace/floor-wide.jpg', 'Torii workspace')] },
  'monthly-contest': { title: 'Monthly Coding Contest', tag: 'Every month, every coder',
    media: [img('events/coding-contest-1.jpg', 'Coding contest'), img('events/coding-contest-2.jpg', 'Coding contest'), img('events/coding-contest-3.jpg', 'Coding contest'), img('events/coding-contest-4.jpg', 'Coding contest'), ...seq(3, (n) => img(`contests/code-fall-${n}.jpg`, 'Code Fall coding contest')), img('rm/contenst1.jpg', 'Contest winners'), img('rm/contest2.jpg', 'Contest winners'), img('rm/contest10.jpg', 'Contest winners'), img('rm/contest6.jpg', 'Contest winners'), img('rm/contest7.jpg', 'Contest winners'), img('rm/contest8.jpg', 'Contest winners'), img('rm/contest9.jpg', 'Contest winners')] },
  hackathon: { title: 'Hackathon', tag: 'Build against the clock',
    media: [...seq(4, (n) => img(`contests/sih-2025-${n}.${n === '04' ? 'png' : 'jpg'}`, 'Smart India Hackathon 2025')),
      ...seq(6, (n) => img(`contests/internal-hackathon-${n}.jpg`, 'Internal team hackathon')), yt('7pDn4qEn0VQ', 'SIH at NCET')] },
  bootcamp: { title: 'Bootcamps', tag: 'Intensive, vendor-led',
    media: [img('placements/pega-genai-bootcamp.jpg', 'Pega GenAI blueprint bootcamp')] },
  'live-deployment': { title: 'Live Project Deployment', tag: 'Ship it',
    media: ['floor-wide', 'floor-screens', 'coe-wall', 'hall-screen'].map((s) => img(`workspace/${s}.jpg`, 'Torii workspace')) },

  // Tools
  'torii-app': { title: 'Torii App', tag: 'Torii Minds learning platform', logo: 'brand/torii-logo.png',
    about: 'The route a trainee takes from the first module to placement, and the site that carries it.',
    media: [vid('platforms/torii-minds.mp4', 'Torii Minds'), img('platforms/torii-minds-screen.png', 'Torii Minds'), vid('programs/torii-brand-film.mp4', 'Torii brand film')] },
  myna: { title: 'Myna', tag: 'The learner portal', logo: 'logos/myna.png',
    about: 'A trainee’s day-to-day home — what to do next, what is finished, and how far along the path they are.',
    media: [vid('platforms/myna-demo.mp4', 'Myna walkthrough'), pdf('platforms/myna-brochure.pdf', 'Myna brochure'), vid('platforms/myna.mp4', 'Myna'), img('platforms/myna-screen.png', 'Myna'), img('exposure/torii-connect-myna.png', 'Myna at Torii Connect')] },
  'owlcoder-app': { title: 'Owl Coder', tag: 'Coding practice and assessment', logo: 'logos/owlcoder-app.png',
    about: 'Problem sets a trainee works through, run and scored automatically, with the record kept.',
    media: [vid('platforms/owlcoder-demo.mp4', 'Owl Coder walkthrough'), pdf('platforms/owlcoder-brochure.pdf', 'Owl Coder brochure'), vid('platforms/owlcoder.mp4', 'Owl Coder'), img('platforms/owlcoder-screen.png', 'Owl Coder')] },
  jpath: { title: 'J-Path', tag: 'Journey to placement', logo: 'logos/jpath.png',
    about: 'The learning path end to end — journey tracking from the first module to placement.', media: [img('events/jpath-1.jpg', 'J-Path Connect'), img('events/jpath-2.jpg', 'J-Path Connect'), img('events/jpath-3.jpg', 'J-Path Connect'), img('events/jpath-4.jpg', 'J-Path Connect'), img('events/jpath-5.jpg', 'J-Path Connect'), img('events/jpath-6.jpg', 'J-Path Connect'), img('events/jpath-7.jpg', 'J-Path Connect')] },
  tag: { title: 'TAG', tag: 'Task and activity system', logo: 'logos/tag.png', media: [vid('platforms/tag-v4.mp4', 'TAG'), vid('platforms/tag.mp4', 'TAG')] },
  'apt-logic': { title: 'Apt Logic', tag: 'Aptitude & logical reasoning practice', logo: 'logos/apt-logic.png', media: [img('rm/aptlogic1.jpg', 'Apt Logic'), img('rm/aptlogic2.jpg', 'Apt Logic'), img('rm/aptlogic3.jpg', 'Apt Logic')] },
  'beyond-boundaries': { title: 'Beyond Boundaries', tag: 'Beyond the classroom', media: [img('class/beyond-1.jpg', 'Beyond Boundaries'), img('class/beyond-2.jpg', 'Beyond Boundaries'), img('class/beyond-3.jpg', 'Beyond Boundaries')] },
  'redhat-challenge': { title: 'Red Hat Academy Challenge', tag: 'Red Hat Academy, 2025', logo: 'coe/logos/redhat.png', media: [img('rm/coeredhat.jpg', 'Red Hat Academy Challenge 2025'), img('rm/coeredhat1.jpg', 'Red Hat Academy Challenge 2025'), img('rm/contest3.jpg', 'Red Hat Academy Challenge 2025')] },
  'ats-engine': { title: 'ATS Engine', tag: 'Resume screening, the way recruiters do it', media: [vid('platforms/torii-minds.mp4', 'The ATS Engine on the Torii platform'), img('platforms/torii-minds-screen.png', 'Torii platform')] },
  mpod: { title: 'mPod', tag: 'AI-powered interview practice', logo: 'logos/mpod.png', media: [img('rm/mpod.jpg', 'mPod, AI interview platform')] },
  'ai-interview': { title: 'AI Interview', tag: 'Interview practice with AI', logo: 'logos/mpod.png', media: [img('rm/mpod.jpg', 'mPod: AI interviews')] },
};

/* -------------------------------------------------------------- semesters ---- */

const L = (label, ref) => ({ label, ref });
const TOOLS_BASE = [L('Torii App', 'torii-app'), L('Myna', 'myna'), L('Owl Coder', 'owlcoder-app')];
const TOOLS_APT = [...TOOLS_BASE, L('Apt Logic', 'apt-logic')];
const TOOLS_AI = [...TOOLS_APT, L('AI Interview', 'ai-interview')];
// the ATS Engine joins in 3-1 and always sits last in the tools
const TOOLS_FULL = [...TOOLS_AI, L('J-Path', 'jpath'), L('ATS Engine', 'ats-engine')];
const INDUSTRY = [L('Apt Logic', 'apt-logic'), L('Communication', 'industry-skills'), L('Coding', 'coding')];
const INDUSTRY_Y4 = [...INDUSTRY, L('Placement-oriented Training', 'placement-training'), L('Portfolio Building', 'portfolio')];
const MONTHLY = L('Monthly Coding Contest', 'monthly-contest');

export const semesters = [
  { id: '1-1', phase: 'bamboo', year: 1, sem: 1, headline: 'Learn to think like a programmer',
    stages: {
      technology: [L('C Language', 'c-language')],
      ai: [L('AI Literacy', 'ai-literacy')],
      certification: [L('Cisco Centre of Excellence Course Completion Certification / Badge', 'cisco-c-cert')],
      exposure: [L('T-Connect', 't-connect')],
      industry: INDUSTRY,
      contest: [],
      tools: TOOLS_BASE,
    } },
  { id: '1-2', phase: 'bamboo', year: 1, sem: 2, headline: 'First certification, first capstone',
    stages: {
      technology: [L('Python & Data Structures', 'python-ds')],
      ai: [L('AI Exposure & Experience', 'ai-exposure')],
      certification: [L('Certification', 'certification'), L('Capstone Project', 'capstone-project')],
      exposure: [L('Parent Meet', 'parent-meet'), L('Hub Hopper Ceremony', 'hub-hopper')],
      industry: INDUSTRY,
      contest: [L('Hub Hoppers', 'hub-hoppers'), L('Typing Contest', 'typing-contest'), MONTHLY],
      tools: TOOLS_APT,
    } },
  { id: '2-1', phase: 'skillup', year: 2, sem: 1, headline: 'Core CS and the first project week',
    stages: {
      technology: [L('ADS & Java', 'ads-java')],
      ai: [L('AI Foundations', 'ai-foundations')],
      certification: [L('Certification', 'certification'), L('Project', 'project')],
      exposure: [L('NT Square', 'nt-square'), L('Project Week', 'project-week')],
      industry: INDUSTRY,
      contest: [MONTHLY, L('Skill Grid · Ctrl Quiz · Rapid Executor', 'skill-contests')],
      tools: TOOLS_APT,
    } },
  { id: '2-2', phase: 'skillup', year: 2, sem: 2, headline: 'Data, applied AI and the first internship',
    programs: [L('Moon Coder', 'moon-coder')],
    stages: {
      technology: [L('DBMS', 'dbms'), L('Moon Coder', 'moon-coder')],
      ai: [L('AI-Assisted Development', 'ai-application')],
      certification: [L('Certification', 'certification'), L('Project', 'project'), L('Internship', 'internship')],
      exposure: [L('Parent Meet', 'parent-meet'), L('Pro Project Talk', 'project-talk')],
      industry: INDUSTRY,
      contest: [L('SCINOVA 2026', 'scinova'), L('iShip', 'iship'), MONTHLY, L('Hackathon', 'hackathon')],
      tools: TOOLS_AI,
    } },
  // Year 3 is one page: the class splits into Drive Ready and the AI Ready Engineer for the
  // technology stage (each item carries its `path`); every other stage is shared.
  { id: '3-1', label: '3-1 · 3-2', phase: 'driveready', year: 3, sem: 1, headline: 'Drive Ready and the AI Ready Engineer, side by side',
    paths: [{ id: 'drive', name: 'Drive Ready', logo: 'logos/drive-ready-t.png' }, { id: 'ai', name: 'AI Ready Engineer', logo: 'brand/ai-ready-engineer-t.png' }],
    stages: {
      // Drive Ready: every industry stack, taught with AI
      technology: [
        { ...L('AWS + AI', 'aws'), path: 'drive' }, { ...L('Full Stack Development + AI', 'fullstack'), path: 'drive' },
        { ...L('ServiceNow + AI', 'servicenow'), path: 'drive' }, { ...L('Pega + AI', 'pega'), path: 'drive' },
        { ...L('Data Engineering + AI', 'data-eng'), path: 'drive' }, { ...L('Flutter + AI', 'flutter'), path: 'drive' },
        L('Moon Coder', 'moon-coder'), L('Owl Coder', 'owl-coder'),
      ],
      // the AI Ready Engineer: the whole AI course, with this year's two in focus
      ai: [
        { ...L('AI Engineering', 'ai-engineering'), path: 'ai' }, { ...L('AI Product & Industry Readiness', 'ai-product'), path: 'ai' },
      ],
      certification: [L('Certifications', 'certification'), L('Projects', 'project'), L('Internship', 'internship-y3'), L('Placement Readiness', 'placement-readiness')],
      exposure: [L('Project Talks', 'project-talk'), L('Project Week', 'project-week'), L('Project Space', 'project-space'), L('Project Street', 'project-street'), L('IKYA 2026', 'ikya')],
      industry: INDUSTRY,
      contest: [L('Monthly Coding Contest', 'monthly-contest-y3'), L('Red Hat Academy Challenge', 'redhat-challenge'), L('Bootcamps', 'bootcamp')],
      tools: TOOLS_FULL,
    } },
  { id: '4-1', phase: 'owl', year: 4, sem: 1, headline: 'AI in production, placements in motion',
    stages: {
      technology: [L('Owl Coder', 'owl-coder')],
      ai: [L('Building & Deploying a Live Project', 'ai-live')],
      certification: [L('Projects', 'project')],
      exposure: [L('Video Resumes', 'video-resumes'), L('Resume Building', 'resume-building'), L('Mock Interviews', 'mock-interviews'), L('Mock Drive', 'mock-drive'), L('Placement Assistance', 'placement-assistance')],
      industry: INDUSTRY_Y4,
      contest: [L('Live Project Deployment', 'live-deployment')],
      tools: TOOLS_FULL,
    } },
  { id: '4-2', skip: ['technology'], phase: 'owl', year: 4, sem: 2, headline: 'Ship a live campus project, graduate placed',
    stages: {
      technology: [],
      ai: [L('Building & Deploying a Live Project', 'ai-live')],
      certification: [L('Campus Live Project', 'campus-live-project')],
      exposure: [L('Mock Interviews', 'mock-interviews'), L('Mock Drive', 'mock-drive'), L('Placement Assistance', 'placement-assistance')],
      industry: INDUSTRY_Y4,
      contest: [],
      tools: TOOLS_FULL,
    } },
];

/* ------------------------------------------------------------ concepts ---- */
// What is taught under each item — shown beneath it as it arrives on the timeline.
// AI Ready Engineer's list is from the Torii application; the rest are a first draft
// to be corrected against the actual syllabus.
// Technology: one line each on what the subject does for a student's placement.
const WHY = {
  'c-language': 'Builds the logic and problem solving that every coding round tests first.',
  'python-ds': 'The fastest language for clearing online coding tests and DSA rounds.',
  'ads-java': 'Java and DSA, the core of most product-company technical interviews.',
  dbms: 'SQL and database design, asked in almost every technical interview.',
  'drive-ready': 'Industry stacks that make students placement-ready in their final years.',
  aws: 'Cloud skills and a certification recruiters look for on a résumé.',
  servicenow: 'An enterprise platform with direct hiring demand and certified roles.',
  pega: 'Low-code certification that leads straight to Pega-partner jobs.',
  'data-eng': 'Data pipelines and Snowflake, for data-engineering roles.',
  flutter: 'Mobile apps for one portfolio, from one codebase.',
  'ai-ready': 'AI-native engineering, the profile companies now hire for first.',
  'moon-coder': 'Extra coding hours that sharpen competitive-coding speed.',
  'owl-coder': 'Placement-oriented problem solving, right up to the offer.',
};
for (const [k, w] of Object.entries(WHY)) library[k].why = w;

// The AI Engineer track: short points for each semester's course, and the outcome it builds to.
const TOPICS = {
  'ai-literacy': ['What AI is, and is not', 'Prompting well', 'Using AI responsibly'],
  'ai-exposure': ['AI tools for everyday work', 'AI coding assistants', 'Hands-on AI experiences'],
  'ai-foundations': ['Data and how models learn', 'Machine-learning basics', 'Calling AI from code'],
  'ai-application': ['Coding with Claude, Codex and Copilot', 'Reviewing AI-written code', 'Shipping faster with AI'],
  'ai-engineering': ['Designing AI systems', 'Agents and tools', 'Building working AI apps'],
  'ai-product': ['AI products end to end', 'Industry case studies', 'Portfolio and interview prep'],
  'ai-production': ['Taking AI to production', 'Monitoring and cost', 'Reliability'],
  'ai-deployment': ['Testing AI systems', 'Deployment pipelines', 'Running AI in the real world'],
};
for (const [k, t] of Object.entries(TOPICS)) library[k].topics = t;
const OUTCOME = {
  'ai-literacy': 'Outcome: AI fundamentals and practical usage of AI.',
  'ai-exposure': 'Outcome: AI fundamentals and practical usage of AI.',
  'ai-foundations': 'Outcome: AI-assisted development capability.',
  'ai-application': 'Outcome: AI-assisted development capability.',
  'ai-engineering': 'Outcome: working AI applications and projects.',
  'ai-product': 'Outcome: an AI Ready Engineer, with a project portfolio.',
};
for (const [k, w] of Object.entries(OUTCOME)) library[k].why = w;
for (const [k, t] of Object.entries(TOPICS)) library[k].topics = t;

// Centres of Excellence: the Torii AI centre, and the industry centres on the Technical Hub campus.
// Each is a library entry (`coe-<key>`), so a click opens its photos and films in the media drawer.
const PHOTOS = { aa: 5, aws: 11, oracle: 3, pega: 10, redhat: 24, snowflake: 16, claude: 15, github: 10, mile2: 4, o9: 5, servicenow: 1, cisco: 5 };
const FILMS = {
  redhat: [yt('QRYe7MaEqdU', 'Red Hat Academy')],
  pega: [yt('asLTQ9V4kOI', 'Pega — part 1'), yt('ygsE4YAC1yk', 'Pega — part 2'), yt('ljYucKe7ZEc', 'Pega Project Space')],
  mile2: [yt('nL4bXn93yOM', 'Mile2')],
};
const CENTRES = [
  ['redhat', 'Red Hat', 'Open source, Linux & OpenShift'], ['pega', 'Pega', 'Low-code process automation'],
  ['aws', 'AWS Academy', 'Cloud skills at enterprise scale'], ['oracle', 'Oracle Academy', 'Database & enterprise applications'],
  ['snowflake', 'Snowflake', 'Data cloud & analytics'], ['aa', 'Automation Anywhere', 'Intelligent automation & RPA'],
  ['servicenow', 'ServiceNow', 'IT service & workflow platform'], ['microsoft', 'Microsoft', 'Cloud, data & productivity'],
  ['gcp', 'Google Cloud', 'Cloud infrastructure & data'], ['github', 'GitHub', 'DevOps, source & collaboration'],
  ['claude', 'Claude', 'Applied AI, agents & assistants'], ['openai', 'OpenAI', 'Generative AI & LLMs'],
  ['mongodb', 'MongoDB', 'Modern application databases'], ['cisco', 'Cisco Networking Academy', 'Networking & infrastructure'],
  ['paloalto', 'Palo Alto', 'Network & cloud security'], ['splunk', 'Splunk', 'Observability & security analytics'],
  ['mile2', 'Mile2', 'Cybersecurity certifications'], ['hubspot', 'HubSpot', 'CRM & marketing operations'],
  ['cadence', 'Cadence', 'Electronic design automation'], ['o9', 'o9 Solutions', 'Planning & supply-chain AI'],
];
library['coe-torii-ai'] = { title: 'AI Centre of Excellence', tag: 'Torii Minds · with Claude, OpenAI and Sarvam', logo: 'brand/torii-logo.png',
  media: seq(19, (n) => img(`coe/torii-ai/${n}.jpg`, 'Torii AI Centre of Excellence')) };
for (const [key, title, tag] of CENTRES) {
  library[`coe-${key}`] = { title, tag, logo: `coe/logos/${key}.png`,
    media: [...seq(PHOTOS[key] || 0, (n) => img(`coe/${key}/${n}.jpg`, `${title} centre`)), ...(FILMS[key] || [])] };
}
export const coe = {
  lead: { ref: 'coe-torii-ai', name: 'AI Centre of Excellence', tag: 'Torii Minds' },
  centres: CENTRES.map(([key, name, tag]) => ({ ref: `coe-${key}`, name, tag, logo: `coe/logos/${key}.png` })),
};

import { why as legacyWhy, legacyLibrary } from './legacy.js';
Object.assign(library, legacyLibrary);
export const legacy = { why: legacyWhy };

// Photos from the `images` folder, shown first in each item's gallery.
const ADDED = {
  "c-language": [img("added2/class1-jpeg.jpg", "First-year class")],
  "python-ds": [img("added2/class1-jpeg.jpg", "First-year class")],
  "ads-java": [img("added2/class2-jpeg.jpg", "Second-year class"), img("added2/class2-1-jpg.jpg", "Second-year class")],
  "dbms": [img("added2/class2-jpeg.jpg", "Second-year class"), img("added2/oracle-jpeg.jpg", "Oracle Academy")],
  "drive-ready": [img("added3/drive-ready-1.jpg", "Drive Ready"), img("added3/drive-ready-2.jpg", "Drive Ready"), img("added2/class3-jpeg.jpg", "Third-year class")],
  "pega": [img("added3/pega8.jpg", "Pega"), img("added2/pega-class-jpeg.jpg", "Pega class"), img("added2/class3-1-jpg.jpg", "Pega GenAI blueprint bootcamp"), img("added2/class3-2-jpg.jpg", "Pega GenAI blueprint bootcamp"), img("added2/pega7-jpeg.jpg", "Pega class"), img("added2/pega-jpeg.jpg", "Pega Centre of Excellence")],
  "bootcamp": [img("added2/pega3-jpg.jpg", "Pega GenAI blueprint bootcamp"), img("added2/class3-1-jpg.jpg", "Pega GenAI blueprint bootcamp")],
  "owl-coder": [img("added2/owl1-jpg.jpg", "Owl Coder 4.0 orientation")],
  "certification": [img("added3/certi3.jpg", "Certified trainees"), img("added3/certi4.jpg", "Certified trainees"), img("added2/cert2-jpg.jpg", "Pega certified trainees"), img("added2/certi1-jpeg.jpg", "Certified trainees"), img("added2/certi2-jpeg.jpg", "Certified trainees"), img("added2/certi-1-and-redhat-jpg.jpg", "Certified trainees"), img("added2/servicenow-certi-jpg.jpg", "ServiceNow certified")],
  "servicenow": [img("added3/servicenow-1.jpg", "ServiceNow"), img("added3/servicenow-2.jpg", "ServiceNow"), img("added2/servicenow-certi-jpg.jpg", "ServiceNow certified")],
  "placement-assistance": [img("added2/placement1-jpeg.jpg", "Placed"), img("added2/walmart-jpeg.jpg", "Placed at Walmart")],
  "parent-meet": [{ type: "video", src: "added3/parents-meet.mp4", caption: "Parents meet" }, img("added3/shaping-tomorrow.jpg", "Parents and families"), img("added2/parents-meet-jpg.jpg", "Parents meet"), img("added2/parents-meet1-jpg.jpg", "Parents meet"), img("added2/parentsmeet-jpeg.jpg", "Parents meet"), img("added2/whatsapp-image-2026-10-14-at-1-04-37-pm-jpeg.jpg", "Skiller\u2019s Day"), img("added2/whatsapp-image-2026-10-14-at-1-04-40-pm-jpeg.jpg", "Skiller\u2019s Day"), img("added2/whatsapp-image-2026-10-14-at-1-04-41-pm-jpeg.jpg", "Skiller\u2019s Day")],
  "hub-hopper": [img("added2/hubhoppers-jpeg.jpg", "Hub Hoppers ceremony")],
  "hub-hoppers": [img("added2/hubhoppers-jpeg.jpg", "Hub Hoppers ceremony")],
  "nt-square": [img("added2/ntsquare-jpg.jpg", "NT Square"), img("added2/ntsquare1-jpg.jpg", "NT Square"), img("added2/ntsquare2-jpg.jpg", "NT Square"), img("added2/ntsquare3-jpg.jpg", "NT Square")],
  "project-space": [img("added2/projectspace-2-jpeg.jpg", "Project Space"), img("added2/projectspace1-jpg.jpg", "Project Space"), img("added2/projectspace2-jpg.jpg", "Project Space"), img("added2/projectspace-jpeg.jpg", "Project Space 7.0")],
  "project-street": [img("added2/project-street-jpeg.jpg", "Project Street")],
  "project-talk": [img("added2/redhat-jpeg.jpg", "Red Hat industry talk"), img("added2/redhat-jpg.jpg", "Red Hat industry expert talk"), img("added2/redhatcoe-jpg.jpg", "Red Hat industry expert talk")],
  "redhat-challenge": [img("added2/redhatcontest-jpeg.jpg", "Red Hat Academy Challenge"), img("added2/redhatcontest1-jpeg.jpg", "Red Hat Academy Challenge")],
  "typing-contest": [img("added2/type-contest-jpg.jpg", "Typo typing contest"), img("added2/type-contest1-jpg.jpg", "Typo winners"), img("added2/type-contest2-jpg.jpg", "Typo typing contest")],
  "spreadsheet-bootcamp": [img("added2/contest1-1-jpg.jpg", "Spreadsheet Bootcamp"), img("added2/contest1-2-jpg.jpg", "Spreadsheet Bootcamp")],
  "monthly-contest": [img("added2/git-it-done-contest-jpg.jpg", "Git It Done contest winners")],
  "coe-pega": [img("added2/pega-jpeg.jpg", "Pega Centre of Excellence"), img("added2/pega1-jpeg.jpg", "Pega Centre of Excellence"), img("added2/pega5-jpeg.jpg", "Pega MoU exchange"), img("added2/pega6-jpeg.jpg", "Pega Centre of Excellence")],
  "coe-oracle": [img("added2/oracle-jpeg.jpg", "Oracle Academy")],
  "coe-redhat": [img("added2/redhat-jpeg.jpg", "Red Hat industry talk"), img("added2/redhatcontest-jpeg.jpg", "Red Hat Academy Challenge"), img("added2/redhatcontest1-jpeg.jpg", "Red Hat Academy Challenge")],
  "legacy-decade": [img("added3/early-stage-1.jpg", "The early days"), img("added3/early-stage-2.jpg", "The early days"), img("added2/thub-transform-jpeg.jpg", "Technical Hub, 2016 to 2023"), img("added3/student-growth.jpg", "Student growth"), img("added3/gods-gift.jpg", "These trainees are God’s gift to me"), img("added3/certified-trainees.jpg", "Students to certified trainees"), img("added3/shaping-tomorrow.jpg", "Shaping tomorrow"), img("added2/team-jpeg.jpg", "The Technical Hub team")],
  "legacy-leader": [img("added3/babji-legacy.jpg", "Babji Neelam"), img("added3/leadership.jpg", "The leadership that directs"), img("added2/babji1-jpeg.jpg", "Babji Neelam"), img("added2/babjileg1-jpeg.jpg", "Training and Placement Officers’ Consortium"), img("added2/babji-leg-jpeg.jpg", "Global Dev Slam")],
  "legacy-certs": [img("added3/certified-students.jpg", "Certified students"), img("added3/certification-beginning.jpg", "Where certification began"), img("added3/certi3.jpg", "Certified trainees"), img("added3/certi4.jpg", "Certified trainees"), img("added2/cert2-jpg.jpg", "Pega certified trainees"), img("added2/certi1-jpeg.jpg", "Certified trainees"), img("added2/certi2-jpeg.jpg", "Certified trainees"), img("added2/certi-1-and-redhat-jpg.jpg", "Certified trainees"), img("added2/servicenow-certi-jpg.jpg", "ServiceNow certified")],
  "legacy-placements": [img("added2/placement1-jpeg.jpg", "Golden success"), img("added2/walmart-jpeg.jpg", "Golden success")],
  "legacy-coe": [img("added2/pega-jpeg.jpg", "Pega Centre of Excellence"), img("added2/pega5-jpeg.jpg", "Pega MoU exchange"), img("added2/redhat-jpeg.jpg", "Red Hat")],
  "hackathon": [img("added3/hackathon-1.jpg", "Hackathon"), img("added3/hackathon-2.jpg", "Hackathon"), img("added3/hackathon-3.jpg", "Hackathon")],
  "internship": [img("added3/internships-3000.jpg", "3,000+ internships")],
};
ADDED['legacy-decade'].splice(1, 0, vid('added2/gitex-global.mp4', 'GITEX Global'));
for (const [k, xs] of Object.entries(ADDED)) if (library[k]) library[k].media = [...xs, ...(library[k].media || []).filter((m) => !String(m.src || '').startsWith('added/'))];

// Too small to show clearly (most were 206 × 206 at the source), so left out of every gallery.
const LOW_RES = new Set(["tech/aws-01.jpg", "coe/aws/01.jpg", "tech/snowflake-01.jpg", "programs/moon-coders-launch.jpg", "coe/snowflake/01.jpg", "coe/redhat/07.jpg", "coe/redhat/05.jpg", "contests/sih-2025-02.jpg", "coe/snowflake/03.jpg", "tech/snowflake-02.jpg", "coe/redhat/09.jpg", "coe/snowflake/05.jpg", "exposure/first-year-inauguration-01.png", "coe/redhat/06.jpg", "coe/snowflake/02.jpg", "contests/sih-2025-03.jpg", "added/class1.jpg", "exposure/first-year-inauguration-02.png", "coe/redhat/01.jpg", "coe/snowflake/04.jpg", "contests/sih-2025-04.png", "added/mooncoders.jpg", "coe/aa/03.jpg", "exposure/first-year-inauguration-03.png", "exposure/parent-interaction.jpg", "tech/oracle-02.jpg", "tech/aws-02.jpg", "contests/sih-2025-01.jpg", "coe/redhat/13.jpg", "coe/pega/07.jpg", "coe/oracle/02.jpg", "coe/aa/04.jpg", "coe/aws/02.jpg", "added/class.jpg", "exposure/skillers-day.jpg", "coe/pega/06.jpg", "placements/pega-genai-bootcamp.jpg", "coe/redhat/02.jpg", "coe/redhat/12.jpg", "coe/redhat/03.jpg", "tech/pega-01.jpg", "coe/redhat/11.jpg", "coe/pega/01.jpg", "tech/oracle-01.jpg", "coe/oracle/01.jpg", "exposure/torii-connect-myna.png", "coe/redhat/10.jpg", "coe/redhat/14.jpg", "coe/aa/02.jpg", "coe/aa/05.jpg", "coe/redhat/04.jpg", "tech/pega-02.jpg", "coe/pega/05.jpg", "tech/pega-03.jpg", "coe/pega/02.jpg", "coe/pega/03.jpg", "tech/pega-04.jpg", "coe/redhat/08.jpg", "coe/pega/04.jpg", "placements/internships-3000.jpg", "coe/cisco/05.jpg"]);
for (const e of Object.values(library)) if (e.media) e.media = e.media.filter((m) => m.type !== 'image' || !LOW_RES.has(m.src));

// Only photos with people in them: posters, logo walls and empty rooms are left out of every gallery.
const NO_PEOPLE = new Set(["certifications/oracle-java.jpg", "ai/roadmap.jpg", "ai/trainees-onboarded.jpg", "platforms/ai-ready-screen.png", "certifications/aws-cloud-practitioner.jpg", "certifications/pega-system-architect.jpg", "programs/owl-coder.jpg", "rm/suptest3.jpg", "programs/moon-coders.jpg", "rm/mc1.jpg", "rm/mc4.jpg", "added/certification.jpg", "certifications/azure-fundamentals.jpg", "certifications/azure-ai-fundamentals.jpg", "certifications/oracle-cloud.jpg", "certifications/google-cloud.jpg", "placements/shine-mode-04.jpg", "placements/placed-pega7.jpg", "rm/placements1.jpg", "rm/wipro1.jpg", "exposure/nt-square-03.jpg", "exposure/nt-square-05.jpg", "added/projectspace.jpg", "rm/contest6.jpg", "contests/internal-hackathon-06.jpg", "workspace/coe-wall.jpg", "platforms/torii-minds-screen.png", "platforms/myna-screen.png", "rm/aptlogic1.jpg", "rm/mpod.jpg", "coe/torii-ai/01.jpg", "coe/torii-ai/03.jpg", "coe/torii-ai/04.jpg", "coe/torii-ai/05.jpg", "coe/torii-ai/07.jpg", "coe/torii-ai/09.jpg", "coe/aws/09.jpg", "coe/snowflake/06.jpg", "coe/aa/01.jpg", "coe/github/06.jpg", "coe/claude/02.jpg", "coe/claude/04.jpg", "coe/cisco/01.jpg", "coe/cisco/02.jpg", "added/thub1st.jpg", "legacy/since2016.jpg", "legacy/campus-night.jpg", "partners/claude-certified-services-partner.png", "partners/openai-select-partner.jpeg", "partners/sarvam-ai.jpeg", "legacy/claude-partner.jpg", "legacy/claude-certified.jpg", "legacy/openai.jpg", "legacy/torii-claude-team.jpg", "legacy/torii-announcement.jpg", "legacy/tech30.jpg"]);
for (const e of Object.values(library)) if (e.media) e.media = e.media.filter((m) => m.type !== 'image' || !NO_PEOPLE.has(m.src));

// the Red Hat Academy certificates lead every Red Hat gallery
for (const k of ['coe-redhat', 'redhat-challenge', 'certification', 'legacy-certs', 'legacy-coe']) if (library[k]) library[k].media = [img('added3/redhat-academy-certified.jpg', 'Red Hat Academy certified · Torii × NCET'), ...library[k].media];

// the Cisco Networking Academy certificates lead the Cisco gallery
library['coe-cisco'].media = [img('added3/cisco-academy-certified.jpg', 'Cisco Networking Academy · Python Essentials 1 · Torii × NCET'), ...library['coe-cisco'].media];

// Achievers Day: students honoured with their parents
library['parent-meet'].media = [img('added3/achievers-day-parents.jpg', 'Achievers Day · parents honoured'), img('added3/achievers-day-1.jpg', 'Achievers Day · with parents'), img('added3/achievers-day-2.jpg', 'Achievers Day · with parents'),
  img('added3/achievers-day-4.jpg', 'Achievers Day · parents and families'), img('added3/achievers-day-3.jpg', 'Achievers Day'), img('added3/achievers-day-pwc.jpg', 'Achievers Day · PwC Launchpad'), ...library['parent-meet'].media];
library['legacy-leader'].media = [img('added3/babji-ncet-team.jpg', 'Babji Neelam with the Torii × NCET team'), ...library['legacy-leader'].media];

// every monthly coding contest leads with the latest winners
library['monthly-contest'].media = [img('added3/coding-contest-winners-ncet.jpg', 'Coding contest winners · Torii × NCET'), ...library['monthly-contest'].media];
library['monthly-contest-y3'] = library['monthly-contest'];

// Photos added after the curriculum review (added4), first in each gallery
for (const [k, xs] of Object.entries({
  'ads-java': [img('added4/class-ncet-1.jpg', 'Second-year class')],
  'dbms': [img('added4/class-ncet-2.jpg', 'Second-year class')],
  'mock-interviews': [img('added4/mock-interview-1.jpg', 'Mock interview'), img('added4/mock-interview-2.jpg', 'Mock interview')],
  'nt-square': [img('added4/ntsquare-sign.jpg', 'NT Square'), img('added4/github-ribbon.jpg', 'NT Square · GitHub Campus Program launch'), img('added4/github-booth.jpg', 'NT Square · GitHub booth'), img('added4/skilledge-claude-2.jpg', 'NT Square · Claude AI in Action'), img('added4/skilledge-claude-1.jpg', 'Skill Edge · Claude AI in Action'), img('added4/github-team.jpg', 'GitHub Campus Program team')],
  'ai-literacy': [img('added4/skilledge-claude-1.jpg', 'Skill Edge · Claude AI in Action'), img('added4/skilledge-claude-3.jpg', 'Skill Edge · Claude AI in Action'), img('added4/skilledge-claude-4.jpg', 'Skill Edge · Claude AI in Action')],
  'coe-claude': [img('added4/skilledge-claude-1.jpg', 'Claude AI in Action'), img('added4/skilledge-claude-3.jpg', 'Claude AI in Action')],
  'coe-github': [img('added4/github-karthik.jpg', 'GitHub Director Mr. Karthik'), img('added4/github-ribbon.jpg', 'GitHub Campus Program launch'), img('added4/github-booth.jpg', 'GitHub booth'), img('added4/github-session-1.jpg', 'GitHub session'), img('added4/github-session-2.jpg', 'GitHub session'), img('added4/github-team.jpg', 'GitHub Campus Program team'), img('added4/github-babji-karthik.jpg', 'Babji Neelam with Mr. Karthik')],
  'certification': [img('added4/cisco-c-essentials-302.jpg', '302 Cisco C Essentials certifications')],
  'c-language': [img('added4/cisco-c-essentials-302.jpg', '302 Cisco C Essentials certifications')],
  'coe-cisco': [img('added4/cisco-c-essentials-302.jpg', '302 Cisco C Essentials certifications')],
  'legacy-certs': [img('added4/cisco-c-essentials-302.jpg', '302 Cisco C Essentials certifications')],
  'coe-mile2': [img('added4/mile2-mou.jpg', 'Mile2 academic alliance MoU')],
  'coe-o9': [img('added4/o9-session-1.jpg', 'o9 session'), img('added4/o9-session-2.jpg', 'o9 session'), img('added4/o9-welcome.jpg', 'o9 session')],
  'project-week': [img('added4/expo-electricity.jpg', 'Project expo · Electricity Bill Management'), img('added4/expo-hospital.jpg', 'Project expo · Hospital Management System'), img('added4/expo-maze.jpg', 'Project expo · Maze Solver'), img('added4/expo-1.jpg', 'Project expo'), img('added4/expo-2.jpg', 'Project expo')],
  'project': [img('added4/expo-electricity.jpg', 'Project expo'), img('added4/expo-hospital.jpg', 'Project expo'), img('added4/expo-maze.jpg', 'Project expo')],
  'project-street': [img('added4/project-street-aerial.jpg', 'Project Street'), img('added4/project-street-growhive.jpg', 'Project Street · GrowHive'), img('added4/project-street-2.jpg', 'Project Street'), img('added4/project-street-team.jpg', 'Project Street team')],
})) if (library[k]) library[k].media = [...xs, ...(library[k].media || [])];
for (const k of ['mpod', 'ai-interview']) library[k].media = [yt('lfQFKSmsC3w', 'mPod · AI interviews'), ...(library[k].media || [])];

// One copy of each photo per gallery: exact repeats and look-alike copies are dropped
const DUP = {"c-language": ["class/c-3.jpg"], "servicenow": ["certifications/servicenow.jpg"], "certification": ["rm/certi3.jpg"], "nt-square": ["exposure/nt-square-02.jpg"], "coe-github": ["coe/github/02.jpg", "coe/github/03.jpg", "coe/github/04.jpg", "coe/github/07.jpg", "coe/github/08.jpg", "coe/github/10.jpg"], "coe-cisco": ["coe/cisco/03.jpg"], "coe-mile2": ["coe/mile2/01.jpg"], "coe-o9": ["coe/o9/02.jpg", "coe/o9/03.jpg"], "legacy-certs": ["rm/certi3.jpg"], "ads-java": ["added2/class2-1-jpg.jpg"]};
for (const [k, e] of Object.entries(library)) {
  if (!e.media) continue;
  const seen = new Set(), skip = new Set(DUP[k] || []);
  e.media = e.media.filter((m) => { const id = m.src || m.id; if (seen.has(id) || skip.has(m.src)) return false; seen.add(id); return true; });
}

// Contests sorted into the right place: Typo shots go to the Typing Contest; Skill Grid,
// Ctrl Quiz and Rapid Executor are their own skill contests, apart from the monthly coding contest
{
  const typo = ['events/coding-contest-1.jpg', 'events/coding-contest-2.jpg', 'events/coding-contest-3.jpg', 'events/coding-contest-4.jpg'];
  const skill = ['rm/contenst1.jpg', 'rm/contest2.jpg', 'rm/contest10.jpg'];
  library['monthly-contest'].media = library['monthly-contest'].media.filter((m) => !typo.includes(m.src) && !skill.includes(m.src));
  library['typing-contest'].media = [...library['typing-contest'].media, ...typo.map((src) => img(src, 'Typo typing contest'))];
  library['skill-contests'] = { title: 'Skill Grid · Ctrl Quiz · Rapid Executor', tag: 'Skill contests through the semester',
    media: [img('rm/contenst1.jpg', 'Skill Grid winners'), img('rm/contest2.jpg', 'Ctrl Quiz winners'), img('rm/contest10.jpg', 'Rapid Executor')] };
  library['hackathon'].media = library['hackathon'].media.filter((m) => m.type === 'image');
}
library['jpath'].media = [vid('platforms/torii-minds.mp4', 'J-Path on the Torii Minds platform'), ...library['jpath'].media];
// 1-1 Technology Track: only the Skill Up Coder coding-test photos (heading and footer cropped off)
library['c-language'].media = [img('added4/skillup-test-1.jpg', 'Skill Up Coder coding test'), img('added4/skillup-test-2.jpg', 'Skill Up Coder coding test')];
// The AI Engineer track shows its own classrooms — the NT Square / Skill Edge stall photos are not part of it
library['ai-literacy'].media = library['ai-literacy'].media.filter((m) => !String(m.src || '').startsWith('added4/skilledge-'));

// The Snowflake Academia orientation at Aditya University leads the Snowflake centre. Cut from the
// supplied collages: dividers, the support-email footer and the burned-in watermark removed.
library['coe-snowflake'].media = [
  ...['01-stage-talk', '02-session', '03-full-hall', '04-address', '05-address', '06-felicitation', '07-felicitation']
    .map((f) => img(`coe/snowflake-orientation/${f}.jpg`, 'Snowflake orientation session · Aditya University')),
  ...library['coe-snowflake'].media,
];

// Internships, sorted by the poster: 2-2 leads with the Visa, Myntra, Flipkart and Airbus offers,
// then the other internships; the Walmart internships (₹1,00,000-a-month stipends) are Year 3's.
// walmart1 and placed-walmart226 are 22.6 LPA placements, so they stay in Placement Assistance.
library['internship'].media = [
  img('rm/internship5.jpg', 'Visa internship'),
  img('placements/myntra-internship.jpg', 'Myntra internship'),
  img('rm/internship1.jpg', 'Flipkart internship'),
  img('rm/internship12.jpg', 'Flipkart internship'),
  img('rm/internship7.jpg', 'Airbus internships'),
  img('rm/internship9.jpg', 'Airbus internship'),
  img('rm/internship17.jpg', 'Airbus internship'),
  img('rm/internship11.jpg', 'Google · Flipkart · Walmart · Airbus internships'),
  img('added3/internships-3000.jpg', '3,000+ internships'),
  yt('IW3DYR2Nr2o', '3000+ internships'),
  img('placements/amazon-internship.jpg', 'Amazon internship'),
  img('rm/internship13.jpg', 'Google internship'),
  img('rm/internship4.jpg', 'Unlox internship'),
  img('rm/internship3.jpg', 'ISRO internship'),
  img('rm/internship10.jpg', 'Ubona internship'),
  img('rm/redhatintern1.jpg', 'Red Hat apprenticeship'),
];
library['internship-y3'] = { title: 'Internship', tag: 'Walmart internships · ₹1,00,000 a month stipend',
  media: [img('rm/internship14.jpg', 'Walmart internship'), img('rm/internship15.jpg', 'Walmart internship'),
    img('rm/internship16.jpg', 'Walmart internship'), img('rm/walmart2.jpg', 'Walmart internships')] };
library['placement-assistance'].media = library['placement-assistance'].media.filter((m) => m.src !== 'rm/walmart2.jpg');

// Classroom photos (titles and footers cropped off), one gallery each so none repeats: Year 2's
// two technology tracks and two of Year 3's. Event photos go where their titles say.
{
  const A = (f, cap = '') => img(`added5/${f}`, cap);
  const lead = (k, ...xs) => { library[k].media = [...xs, ...library[k].media]; };
  lead('ads-java', A('class-eligibility-1.jpg', 'Classroom'), A('class-eligibility-2.jpg', 'Classroom'));
  lead('dbms', A('class-ceo-talk-1.jpg', 'Classroom'), A('class-eligibility-3.jpg', 'Classroom'));
  lead('fullstack', A('class-ceo-talk-2.jpg', 'Classroom'));
  lead('data-eng', A('class-placement-opps.jpg', 'Classroom'));
  lead('apt-logic', A('apt-logic-submissions.jpg', '18,00,000+ test submissions on APT Logic'));
  lead('mpod', A('mpod-milestone.jpg', '10,000+ AI interviews on mPod'));
  lead('redhat-challenge', A('redhat-challenge-2025.jpg', 'Red Hat Academy Challenge 2025'));
  lead('placement-readiness', A('placement-eligibility-2.jpg', 'Placement eligibility test'));
  lead('moon-coder', A('moon-coders-class.jpg', 'Moon Coders'));
  // iShip Season 3, in Year 3's contests, with no caption
  lead('bootcamp', A('iship-s3-1.jpg'), A('iship-s3-2.jpg'));
  lead('mock-drive', A('mock-drive-booths.jpg', 'Mock drive · interview booths'));
  lead('legacy-global', A('gaisa-global-ai-summit.jpg', 'GAISA · AICRA Global AI Summit & Awards 5.0'));
}

// One line under each item on the semester timeline: what the program delivers and the skill it
// builds. Two lines at most. The 1-1 and 1-2 AI items (AI Literacy, AI Exposure) show their titles only.
{
  const LINE = {
    'c-language': 'Problem solving for coding rounds',
    'python-ds': 'Python and DSA for online coding tests',
    't-connect': 'Industry experts meet first-years',
    'apt-logic': 'Aptitude and reasoning practice',
    'industry-skills': 'Spoken English for interviews',
    typing: 'Typing speed and accuracy',
    'spreadsheet-bootcamp': 'Hands-on Excel training',
    certification: 'Industry certifications',
    'capstone-project': 'A first complete project',
    'parent-meet': 'Parents see progress first-hand',
    'hub-hopper': 'Achievers honoured on stage',
    'hub-hoppers': 'The first-year contest of 1-2',
    'typing-contest': 'A typing speed and accuracy contest',
    'monthly-contest': 'A coding contest every month',
    'ads-java': 'Java and DSA for interviews',
    'ai-foundations': 'How models learn; AI from code',
    project: 'Built, presented and reviewed',
    'nt-square': 'The GitHub Experience Center',
    'project-week': 'Teams build and present in one week',
    'skill-contests': 'Quiz and speed contests all semester',
    dbms: 'SQL and database design for interviews',
    'moon-coder': 'Extra coding hours for contest speed',
    'ai-application': 'Coding with Claude, Codex and Copilot',
    internship: 'Visa, Myntra, Flipkart and Airbus',
    'project-talk': 'Industry experts on real projects',
    scinova: 'Science and innovation exhibition',
    hackathon: 'Build a product against the clock',
    aws: 'Cloud skills with AWS certification',
    fullstack: 'Web applications end to end, with AI',
    servicenow: 'Certified enterprise-platform roles',
    pega: 'Pega certification for partner jobs',
    'data-eng': 'Data pipelines and Snowflake',
    flutter: 'Mobile apps from one codebase',
    'owl-coder': 'Placement problem solving to the offer',
    'ai-engineering': 'AI systems, agents and apps',
    'ai-product': 'AI products and a project portfolio',
    'internship-y3': 'Walmart internships, ₹1,00,000 a month',
    'placement-readiness': 'Eligibility tests and training',
    'project-space': 'Identify a problem, solve it, deploy it',
    'project-street': 'Projects shown to the whole campus',
    ikya: 'Project stalls at IKYA 2026',
    'redhat-challenge': 'A Red Hat Academy contest on campus',
    bootcamp: 'Intensive, vendor-led training camps',
    'ai-live': 'Build and deploy a live AI project',
    'video-resumes': 'An intro recruiters watch first',
    'mock-interviews': 'Practice interviews, with feedback',
    'mock-drive': 'A full placement drive, rehearsed',
    'placement-assistance': 'Drives, preparation and offers',
    'placement-training': 'Aptitude, coding and interviews',
    portfolio: 'Projects, résumé and profile, ready',
    'live-deployment': 'Ship a project to real users',
    'campus-live-project': 'A live campus project with real users',
  };
  for (const [k, line] of Object.entries(LINE)) if (library[k]) library[k].line = line;
}

// Latest batch (added6), placed by each poster's title; none repeats.
{
  const A = (f, cap = '') => img(`added6/${f}`, cap);
  const lead = (k, ...xs) => { library[k].media = [...xs, ...(library[k].media || [])]; };
  // 1-1 AI Literacy: the three photographs only, no film
  library['ai-literacy'].media = library['ai-literacy'].media.filter((m) => m.type === 'image');
  // 1-1 certification: the Cisco Centre of Excellence C Essentials certificate and badge
  library['cisco-c-cert'] = { title: 'Cisco C Essentials', tag: 'Cisco Networking Academy · certificate & badge', logo: 'coe/logos/cisco.png',
    media: [img('added4/cisco-c-essentials-302.jpg', ''), img('added3/cisco-academy-certified.jpg', '')] };
  // Communication: its own icon, photographs to come; Typing: icon and the Type photographs
  library['industry-skills'].logo = 'added6/icon-communication.png';
  library['industry-skills'].media = [];
  library['typing'].media = [A('type-1.jpg'), A('type-2.jpg'), A('type-3.jpg'), A('type-4.jpg'), ...library['typing'].media];
  lead('typing-contest', A('type-winners.jpg'));
  lead('parent-meet', A('parents-meet-night.jpg'));
  lead('coe-mile2', A('mile2-atc-award.jpg'));
  lead('apt-logic', A('apt-logic-750k.jpg'), A('apt-logic-300k.jpg'));
  lead('hub-hopper', A('hub-hoppers-1.jpg'), A('hub-hoppers-2.jpg'), A('hub-hoppers-3.jpg'), A('hub-hoppers-4.jpg'));
  lead('owl-coder', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => A(`owl-coder-${n}.jpg`)));
  lead('pega', A('pega-73-trainees.jpg'));
  library['iship'] = { title: 'iShip', tag: 'Team contest · 180 teams',
    media: ['iship-180-teams-1', 'iship-180-teams-2', 'iship-s2-1st', 'iship-s2-2nd', 'iship-s2-3rd', 'iship-s1-1st', 'iship-s1-2nd', 'iship-s1-3rd'].map((f) => A(`${f}.jpg`)) };
  // the panel shows one line, not a list of topics
  for (const e of Object.values(library)) delete e.topics;
  library['cisco-c-cert'].line = 'Cisco C Essentials certificate and badge';
  library['cisco-c-cert'].title = 'Cisco Centre of Excellence Course Completion Certification / Badge';
  // the official Cisco Networking Academy badges for the course (from Credly), then the C Essentials photos
  library['cisco-c-cert'].media = [img('added7/cisco-c-essentials-1-badge.png', ''), img('added7/cisco-c-essentials-2-badge.png', ''), ...library['cisco-c-cert'].media];
  library['iship'].line = 'A team contest, 180 teams strong';
}

// Resume Building, under Video Resumes in 4-1: the placement-training sessions from the Torii Minds post
library['resume-building'] = { title: 'Resume Building', tag: 'Placement training · phase II', line: 'Résumés that make a strong first impression',
  media: [1, 2, 3, 4].map((n) => img(`added7/resume-building-${n}.jpg`, '')) };

// Technology Contests, Year 3 (3-1 · 3-2): the iShip photographs, on their own. The iShip
// posters come out of the Monthly Coding Contest, and the iShip Season-3 photos out of Bootcamps.
{
  const ISHIP = ['rm/contest7.jpg', 'rm/contest8.jpg', 'rm/contest9.jpg'];
  library['monthly-contest'].media = library['monthly-contest'].media.filter((m) => !ISHIP.includes(m.src));
  library['bootcamp'].media = library['bootcamp'].media.filter((m) => !String(m.src || '').startsWith('added5/iship-'));
  library['tech-contests'] = { title: 'Technology Contests', tag: 'iShip', line: 'iShip and team technology contests',
    media: [img('added5/iship-s3-1.jpg', ''), img('added5/iship-s3-2.jpg', '')] };
  const y3 = semesters.find((x) => x.year === 3);
  y3.stages.contest = [...y3.stages.contest, L('Technology Contests', 'tech-contests')];
}

// Technology tracks, Years 1–2: big-hall classrooms only, titles cropped off, and no photograph
// in more than one track. No Pega classroom in a technology track — those stay with Pega.
{
  const X = (src) => img(src, '');
  library['c-language'].media = [X('added4/skillup-test-1.jpg'), X('added4/skillup-test-2.jpg')];
  library['python-ds'].media = [X('added7/class-hall-1.jpg'), X('added7/class-hall-2.jpg'), X('added5/class-eligibility-1.jpg')];
  library['ads-java'].media = [X('added5/class-eligibility-2.jpg'), X('added5/class-eligibility-3.jpg'), X('added4/class-ncet-1.jpg')];
  library['dbms'].media = [X('added5/class-ceo-talk-1.jpg'), X('added7/class-hall-3.jpg'), X('added4/class-ncet-2.jpg')];
}

// Parents Meet: without the parents-meet film and the 1.04.40 photograph (asked to remove)
library['parent-meet'].media = library['parent-meet'].media.filter((m) => m.src !== 'added3/parents-meet.mp4' && m.src !== 'added2/whatsapp-image-2026-10-14-at-1-04-40-pm-jpeg.jpg' && m.src !== 'added2/whatsapp-image-2026-10-14-at-1-04-41-pm-jpeg.jpg');

// Hub Hoppers is the first-year contest: 1-1 and 1-2 only. Typing appears once, as Typing Assessment
// (it takes the Type winners poster from the Typing Contest it replaces).
library['typing'].media = [...library['typing'].media, ...library['typing-contest'].media.filter((m) => m.src === 'added6/type-winners.jpg')];
library['hub-hoppers'].line = 'The first-year coding contest';
for (const sem of semesters) {
  if (!sem.stages.contest) continue;
  sem.stages.contest = sem.stages.contest.filter((i) => i.ref !== 'typing-contest' && !(i.ref === 'hub-hoppers' && sem.year !== 1));
  if (sem.year === 1 && !sem.stages.contest.some((i) => i.ref === 'hub-hoppers')) sem.stages.contest.push(L('Hub Hoppers', 'hub-hoppers'));
}

// Skill Grid · Ctrl Quiz · Rapid Executor: removed from the roadmap (asked to remove)
for (const sem of semesters) if (sem.stages.contest) sem.stages.contest = sem.stages.contest.filter((i) => i.ref !== 'skill-contests');

// Year 3 internships: Walmart, Google and Amazon (the Google and Amazon posters move up from 2-2)
{
  const MOVE = ['rm/internship13.jpg', 'placements/amazon-internship.jpg'];
  const moved = library['internship'].media.filter((m) => MOVE.includes(m.src));
  library['internship'].media = library['internship'].media.filter((m) => !MOVE.includes(m.src));
  library['internship-y3'].media = [...library['internship-y3'].media, ...moved];
  library['internship-y3'].tag = 'Walmart, Google and Amazon internships';
  library['internship-y3'].line = 'Walmart, Google and Amazon internships';
}

library['ats-engine'].logo = 'added7/ats-engine-logo.png';

// Contests, every semester: Typing Assessment, Communication Assessment and the Monthly Coding
// Contest lead, then that semester's own contests.
{
  library['communication-assessment'] = { title: 'Communication Assessment', tag: 'Spoken and written English, assessed', media: [],
    line: 'Spoken and written English, assessed' };
  library['coding'] = { title: 'Coding', tag: 'Coding practice for placement rounds', logo: 'added6/icon-coding.png', media: [], line: 'Coding practice for placement rounds' };
  library['typing'].title = 'Typing Assessment';
  library['typing'].line = 'Typing speed and accuracy, assessed';
  for (const sem of semesters) {
    const monthly = sem.year === 3 ? 'monthly-contest-y3' : 'monthly-contest';
    const own = (sem.stages.contest || []).filter((i) => !['monthly-contest', 'monthly-contest-y3', 'typing', 'communication-assessment'].includes(i.ref));
    sem.stages.contest = [L('Typing Assessment', 'typing'), L('Communication Assessment', 'communication-assessment'), L('Monthly Coding Contest', monthly), ...own];
  }
}

// Technical Hub first, Torii after, in every gallery. A photograph is Torii's when its file or
// caption names Torii or NCET, or it is from the Achievers Day or NT Square / Skill Edge sets.
// Only photographs move: films and brochures keep the places they were given.
{
  const isTorii = (m) => /torii|ncet|achievers-day|skilledge|ntsquare|nt-square|nt square/i.test(`${m.src || ''} ${m.caption || ''}`);
  for (const e of Object.values(library)) {
    if (!e.media) continue;
    const photos = e.media.filter((m) => m.type === 'image');
    const ordered = [...photos.filter((m) => !isTorii(m)), ...photos.filter(isTorii)];
    let i = 0;
    e.media = e.media.map((m) => (m.type === 'image' ? ordered[i++] : m));
  }
  // Parents Meet opens on Technical Hub's own parents-meet film.
  const pm = library['parent-meet'].media;
  library['parent-meet'].media = [...pm.filter((m) => m.type === 'video'), ...pm.filter((m) => m.type !== 'video')];
}
// one line each on how the placement run works
library['video-resumes'].tag = 'A short recorded intro that recruiters watch before the interview';
library['mock-interviews'].tag = 'Practice interviews with feedback, before the real ones';
library['mock-drive'].tag = 'A full placement drive rehearsed: test, coding round and interview';
library['placement-assistance'].tag = 'We bring the drives, prepare every student and follow through to the offer';

// J-Path: only its own film (replaces the Torii platform film and the photos)
library['jpath'].media = [vid('platforms/jpath.mp4', 'J-Path')];

// The Platforms page shows only films and brochures for each application, never photos.
for (const k of ['torii-app', 'myna', 'owlcoder-app', 'apt-logic', 'jpath', 'mpod', 'tag', 'ats-engine']) {
  const e = library[k];
  if (e) library[`plat-${k}`] = { ...e, media: (e.media || []).filter((m) => m.type !== 'image') };
}

export const brand = {
  title: 'The Four-Year Engineer Roadmap',
  subtitle: 'A semester-by-semester curriculum, delivered by Technical Hub with Torii Minds — from the first line of C to a live, deployed project and a placement.',
  logos: { technicalHub: 'brand/technical-hub-wordmark.png', torii: 'brand/torii-logo.png', thMark: 'brand/technical-hub-mark.png' },
  heroFilm: 'programs/torii-brand-film.mp4',
};

export default { brand, phases, tracks, semesters, library, coe, legacy };
