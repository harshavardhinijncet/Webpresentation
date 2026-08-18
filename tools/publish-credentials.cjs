/* Publishes the credential register from tools/data/certifications.json.
 *
 * Creates the section on first run and reuses it after, so this is safe to run
 * repeatedly. Badges must already be local — run tools/fetch-certification-badges.cjs
 * first; a credential with no local badge renders its vendor's initials instead.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const ORG = process.env.ORG || 'technical-hub';
const KEY = 'credentials';

const CERTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/certifications.json'), 'utf8'));

function req(method, p, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const r = http.request({ host: HOST, port: PORT, path: p, method,
      headers: { ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
        ...(cookie ? { Cookie: cookie } : {}) } }, (x) => {
      let o = ''; x.on('data', (c) => { o += c; });
      x.on('end', () => resolve({ status: x.statusCode, headers: x.headers, body: o }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

const credentials = CERTS.map((c) => ({
  name: c.name, vendor: c.vendor, domain: c.domain, held: c.held,
  badge: c.badge || '', skills: c.skills,
}));

(async () => {
  const earned = credentials.reduce((n, c) => n + c.held, 0);
  const noBadge = credentials.filter((c) => !c.badge);
  console.log(`  ${credentials.length} credentials, ${earned.toLocaleString()} held, `
    + `${new Set(credentials.map((c) => c.vendor)).size} vendors, `
    + `${credentials.reduce((n, c) => n + c.skills.length, 0)} skills`);
  console.log(`  badges local: ${credentials.length - noBadge.length}/${credentials.length}`);
  noBadge.forEach((c) => console.log(`    initials fallback: ${c.name}`));

  const login = await req('POST', '/api/auth/login',
    { email: process.env.ADMIN_EMAIL || 'admin@org.local',
      password: process.env.ADMIN_PASSWORD || 'Admin@123' });
  if (login.status !== 200) throw new Error(`login ${login.status}`);
  const cookie = String(login.headers['set-cookie'][0]).split(';')[0];

  const secs = JSON.parse((await req('GET', `/api/orgs/${ORG}/sections`, null, cookie)).body).sections;
  let section = secs.find((s) => s.key === KEY && !s.parentId);
  if (!section) {
    const made = await req('POST', `/api/orgs/${ORG}/sections`,
      { key: KEY, title: 'Credentials', status: 'draft' }, cookie);
    if (made.status !== 201) throw new Error(`create ${made.status}: ${made.body.slice(0, 200)}`);
    section = JSON.parse(made.body).section;
    console.log(`  created section ${section.id}`);
  } else {
    console.log(`  reusing section ${section.id}`);
  }

  const block = {
    type: 'credential-register',
    layout: { x: 0, y: 0, w: 12, h: 15 },
    eyebrow: 'Certifications and credentials',
    title: 'The credential register',
    /* Their own line, kept verbatim. */
    quote: 'A certificate is not the finish line. It is the receipt for every '
         + 'evening someone kept going after the subject stopped being easy.',
    quoteBy: 'Technical Hub \u00b7 certifying since 2016',
    backdrop: 'certifications/register-crowd.jpg',
    /* The reference design's three figures, verbatim. 32,000+ is its rounding of
       the 31,920 the catalogue sums to; the trainee count and the ratio are its
       own and are not derivable from `held` alone, because one person holding
       three credentials is counted three times there. */
    stats: [
      { value: '32,000+', label: 'certifications earned' },
      { value: '16,000+', label: 'trainees certified' },
      { value: '\u22482', label: 'certifications per trainee' },
    ],
    credentials,
  };

  const saved = await req('PATCH', `/api/sections/${section.id}`,
    { title: 'Credentials', blocks: [block], status: 'published' }, cookie);
  console.log(`  PATCH ${saved.status}`);
  if (saved.status !== 200) { console.log(saved.body.slice(0, 400)); process.exit(1); }
  const b = (JSON.parse(saved.body).section || JSON.parse(saved.body)).blocks[0];
  console.log(`  stored ${b.type}: ${b.credentials.length} credentials, `
    + `${b.credentials.reduce((n, c) => n + c.skills.length, 0)} skills, ${b.stats.length} figures`);
  if (b.credentials.length !== credentials.length) console.log('  MISMATCH — normaliser dropped credentials');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
