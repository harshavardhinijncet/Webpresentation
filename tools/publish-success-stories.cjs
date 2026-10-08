/**
 * Publishes Success Stories — "The Legacy of Babji Neelam": the hanging wall of photographs.
 *
 *   node tools/publish-success-stories.cjs --dry    # print what would be sent
 *   node tools/publish-success-stories.cjs          # replace the section's story list
 *
 * Babji's own stories lead: square crops made from full-size photographs already in uploads
 * (uploads/stories/babji/), each cut to Babji with the poster lettering left out, so the card's
 * title carries the words. Identified by the file named for him (the balancing-stones photograph)
 * and his CEO-page portrait.
 *
 * Titles describe what each picture shows — several source file names do not ("Intiatives in
 * RedHat.jpg" is the OpenAI announcement, "Spreading Wings.jpg" the Torii one).
 *
 * The 206px thumbnails that used to be on the wall are left off: on a projector they could only
 * show small or soft. They come back when full-size files arrive — see uploads/stories/README.txt.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'success-stories';
const DRY = process.argv.includes('--dry');
const UP = path.join(__dirname, '..', 'backend', 'uploads');
const B = 'stories/babji/';
const S = 'stories/';

const story = (photo, name, role = '') => ({ photo, name, role, body: '', quote: '' });
const STORIES = [
  story(`${B}01-art-of-balance.jpg`, 'The Art of Balance', 'Babji Neelam'),
  story(`${B}02-ai-centre-of-excellence.jpg`, 'Leading the AI Centre of Excellence', 'NCET · Torii'),
  story(`${B}03-openai-partnership.jpg`, 'Bringing OpenAI to Technical Hub', 'OpenAI Select Partner'),
  story(`${B}04-encouraging-young-talent.jpg`, 'Encouraging Young Talent', 'Ignite Hoppers Ceremony'),
  story(`${B}05-celebrating-ignite-hoppers.jpg`, 'Celebrating the Ignite Hoppers', 'Ignite Hoppers Ceremony'),
  story(`${B}06-snowflake-keynote.jpg`, 'On Stage with Snowflake', 'Association with Snowflake'),
  story(`${S}10 Year Glory.jpg`, 'A Decade of Innovation'),
  story(`${S}AI Hub.jpg`, 'AI Hub'),
  story(`${S}AI Lab.jpg`, 'The Claude AI Lab'),
  story(`${S}Association with Snowflake.jpg`, 'Association with Snowflake'),
  story(`${S}Intiatives in RedHat.jpg`, 'Partnered with OpenAI'),
  story(`${S}O9 Placement.jpg`, 'o9 Placement'),
  story(`${S}Oracle Story.jpg`, 'Featured by Oracle Academy'),
  story(`${S}Oracle Sucess Stories.png`, 'Oracle Academy Member Spotlight'),
  story(`${S}Scinova.jpg`, 'SCINOVA'),
  story(`${S}Spreading Wings.jpg`, 'Partnership with Torii Minds'),
  story(`${S}Trainees Onborder.jpg`, '300+ AI Ready Engineers Onboarded'),
];

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
  const missing = STORIES.filter((s) => !fs.existsSync(path.join(UP, s.photo))).map((s) => s.photo);
  if (missing.length) { console.error('missing:\n ' + missing.join('\n ')); process.exit(1); }
  if (DRY) { console.log(JSON.stringify(STORIES, null, 2)); return; }
  const login = await request('POST', '/api/auth/login', { email: 'admin@org.local', password: 'Admin@123' });
  const cookie = String(login.headers['set-cookie'] || '').split(';')[0];
  const sections = (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json.sections;
  const section = sections.find((s) => s.key === KEY);
  if (!section) throw new Error('no Success Stories section');
  const block = { ...section.blocks[0], stories: STORIES };
  await request('PATCH', `/api/sections/${section.id}`, { blocks: [block] }, cookie);
  console.log('updated', section.id, STORIES.length, 'stories');
})().catch((e) => { console.error(e.message); process.exit(1); });
