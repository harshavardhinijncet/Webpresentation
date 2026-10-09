/**
 * Re-sorts the Placements posters and tags each one so the wall can be filtered.
 *
 *   node tools/publish-placements.cjs --dry    # print the two chapters
 *   node tools/publish-placements.cjs          # rewrite Campus Placements and Open Drives
 *
 * Campus Placements holds the green posters, Open Drives the black-and-gold ones — sorted by
 * the poster's own colour (share of strongly green pixels against very dark ones, measured with
 * ffmpeg), not by the folder the file happens to sit in.
 *
 * Every package and company below was read off the poster itself. Where a poster shows several
 * packages, `pkg` is the highest — it decides the band — and `pkgText` is what the tile shows.
 * An internship or stipend carries `intern` and no band. Nothing is inferred: a poster that
 * states no package has none, and shows under "All" only.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HOST = { host: '127.0.0.1', port: Number(process.env.PORT) || 4173 };
const ORG = 'technical-hub';
const KEY = 'placements';
const DRY = process.argv.includes('--dry');
const UP = path.join(__dirname, '..', 'backend', 'uploads', 'Placements');

// File name (lower case, no folder or extension) → what the poster says. The folders the files
// sit in do not follow the poster colours, so they are not part of the key.
const TAGS = {
  'autodesk': { companies: ['Autodesk'] },
  'capgemini': { companies: ['Capgemini'], pkg: 7.5, pkgText: '4.25–7.5 LPA' },
  'congolmerate': { companies: ['Conglomerate IT'], pkg: 8, pkgText: '8 LPA +' },
  'deloitte': { companies: ['Deloitte'], pkg: 8.1, pkgText: '8.10 LPA', label: 'HashedIn by Deloitte' },
  'deloitte1': { companies: ['Deloitte'] },
  'deltax': { companies: ['DeltaX'], pkg: 7, pkgText: '7 LPA' },
  'genpact': { companies: ['Genpact'], pkg: 6.5, pkgText: '6.5 LPA' },
  'hcltech': { companies: ['HCLTech'], pkg: 6, pkgText: '6 LPA' },
  'hitachi': { companies: ['Hitachi'], pkg: 29.27, pkgText: '29.27 LPA' },
  'hsbc': { companies: ['HSBC'], pkg: 9, pkgText: '9 LPA' },
  'hsbc1': { companies: ['HSBC'], pkg: 9, pkgText: '9 LPA' },
  'ibm': { companies: ['IBM'] },
  'infosys-servicenow': { companies: ['Infosys'], label: 'Infosys · ServiceNow' },
  'infosys': { companies: ['Infosys'], pkg: 6.25, pkgText: '6.25 LPA' },
  'japan': { companies: ['Nagano Sankoh'], pkg: 26.31, pkgText: '26.31 LPA', label: 'Nagano Sankoh · Japan' },
  'jyesta': { companies: ['Jyesta'], pkg: 9, pkgText: '7–9 LPA' },
  'kt semicon': { companies: ['KT Semicon'] },
  'l and t': { companies: ['Larsen & Toubro'], pkg: 6.55, pkgText: '6.55 LPA', label: 'Larsen & Toubro' },
  'lg': { companies: ['LG'], pkg: 7.5, pkgText: '7.50 LPA' },
  'maersk': { companies: ['Maersk'], pkg: 10.83, pkgText: '10.83 LPA' },
  'o9': { companies: ['o9 Solutions'], pkg: 9, pkgText: '9 LPA', label: 'o9 Solutions' },
  'pelatro': { companies: ['Pelatro'], pkg: 6, pkgText: '6 LPA' },
  'pennant': { companies: ['Pennant'], pkg: 7.9, pkgText: '4.1–7.9 LPA' },
  'peopletech': { companies: ['PeopleTech'], pkg: 5, pkgText: '5 LPA' },
  'qsales': { companies: ['Sales Partners'], pkg: 6, pkgText: '6 LPA', label: 'Sales Partners' },
  'rossell techsy': { companies: ['Rossell Techsys'], pkg: 5, pkgText: '5 LPA', label: 'Rossell Techsys' },
  'sttelemedia global data center': { companies: ['STT GDC'], pkg: 10, pkgText: '10 LPA', label: 'STTelemedia GDC' },
  'tcs digital': { companies: ['TCS'], pkg: 7.09, pkgText: '7.09 LPA', label: 'TCS Digital' },
  'tcs ninja': { companies: ['TCS'], pkg: 7, pkgText: '3.46–7 LPA', label: 'TCS Digital · Ninja' },
  'vedxience': { companies: ['VedXlence'], pkg: 6, pkgText: 'Up to 6 LPA', label: 'VedXlence' },
  'vedxience1': { companies: ['VedXlence'], pkg: 6, pkgText: 'Up to 6 LPA', label: 'VedXlence' },
  'verizon': { companies: ['Verizon'] },
  'virtusa': { companies: ['Virtusa'], pkg: 6.5, pkgText: '6.5 LPA' },
  'airbus': { companies: ['Airbus'], intern: true, pkgText: '₹30,000 / month' },
  'airbus1': { companies: ['Airbus'], intern: true, pkgText: '₹30,000 / month' },
  'airbus2': { companies: ['Airbus'], intern: true, pkgText: '₹30,000 / month' },
  'amazon': { companies: ['Amazon'], pkg: 7.5, pkgText: '7.5 LPA' },
  'amazon1': { companies: ['Amazon'], intern: true, pkgText: '₹1,10,000 / month' },
  'ball': { companies: ['Ball'], pkg: 8.5, pkgText: '8.50 LPA' },
  'cisco': { companies: ['Cisco'], pkg: 16, pkgText: '16 LPA' },
  'flipkart': { companies: ['Flipkart'], intern: true, pkgText: '₹50,000 / month' },
  'flipkart1': { companies: ['Flipkart'], intern: true, pkgText: '₹50,000 / month' },
  'freshbus': { companies: ['FreshBus'], pkg: 10, pkgText: '10 LPA' },
  'isro intern': { companies: ['ISRO'], intern: true, pkgText: 'Internship', label: 'ISRO' },
  'lloyds': { companies: ['Lloyds'], pkg: 10.71, pkgText: '10.71 LPA' },
  'myntra': { companies: ['Myntra'], intern: true, pkgText: '₹40,000 / month' },
  'northernarc': { companies: ['Northern Arc'], pkg: 7, pkgText: '7 LPA' },
  'redhat': { companies: ['Red Hat'], intern: true, pkgText: '₹30,000 / month' },
  'shinsei': { companies: ['Shinsei Electronics'], pkg: 27.81, pkgText: '27.81 LPA', label: 'Shinsei Electronics' },
  'thoughtworks': { companies: ['Thoughtworks', 'Infosys'], pkg: 11.1, pkgText: '9.5–11.10 LPA', label: 'Thoughtworks · Infosys' },
  'ubona': { companies: ['Ubona'], intern: true, pkg: 8.5, pkgText: '8.5 LPA' },
  'uipath': { companies: ['UiPath'], pkg: 17, pkgText: '17 LPA PPO' },
  'visa': { companies: ['VISA'], intern: true, pkgText: '₹90,000 / month' },
  'walmart': { companies: ['Walmart'], pkg: 22.6, pkgText: '22.6 LPA' },
  'walmart1': { companies: ['Walmart', 'Google', 'Flipkart', 'Airbus'], label: 'Walmart · Google · Flipkart · Airbus' },
  'walmart2': { companies: ['Walmart'], intern: true, pkgText: '₹1,00,000 / month' },
  'walmart3': { companies: ['Walmart'], intern: true, pkgText: '₹1,00,000 / month' },
  'walmart4': { companies: ['Walmart'], intern: true, pkgText: '₹1,00,000 / month' },
  'wissada': { companies: ['Wissda'], pkg: 6, pkgText: '6 LPA', label: 'Wissda' },
  'wissda': { companies: ['Wissda'], pkg: 6, pkgText: '6 LPA' },
};

/** Green or dark, off the pixels. */
function colourOf(file) {
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-vf', 'scale=64:64', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let green = 0; let dark = 0;
  for (let i = 0; i < px.length; i += 3) {
    const r = px[i]; const g = px[i + 1]; const b = px[i + 2];
    if (g > 90 && g > r * 1.25 && g > b * 1.4) green += 1;
    if (r < 60 && g < 60 && b < 60) dark += 1;
  }
  return green > dark ? 'campus' : 'open';
}

function request(method, p, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({ ...HOST, method, path: p, headers: { ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}), ...(cookie ? { cookie } : {}) } }, (res) => {
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
  const login = await request('POST', '/api/auth/login', { email: 'admin@org.local', password: 'Admin@123' });
  const cookie = String(login.headers['set-cookie'] || '').split(';')[0];
  const sections = (await request('GET', `/api/orgs/${ORG}/sections`, null, cookie)).json.sections;
  const section = sections.find((s) => s.key === KEY);
  const block = section.blocks[0];
  const isCampus = (c) => /campus/i.test(c.name);
  const isOpen = (c) => /open/i.test(c.name);

  // Every poster from both chapters, tagged and re-sorted by colour.
  const pool = block.chapters.filter((c) => isCampus(c) || isOpen(c))
    .flatMap((c) => c.groups.flatMap((g) => g.images))
    .map((im) => {
      const src = im.src.replace(/\\/g, '/');
      const tag = TAGS[path.basename(src, path.extname(src)).toLowerCase()];
      if (!tag) throw new Error(`no tags for ${src}`);
      return { src, label: tag.label || im.label, w: im.w, h: im.h, companies: tag.companies, pkg: tag.pkg ?? null, pkgText: tag.pkgText || '', intern: !!tag.intern, side: colourOf(path.join(UP, src)) };
    })
    // Highest package first, then internships, then the rest — so the wall opens on its best.
    .sort((a, b) => (b.pkg ?? -1) - (a.pkg ?? -1) || Number(b.intern) - Number(a.intern));
  const pick = (side) => pool.filter((p) => p.side === side).map(({ side: _s, ...im }) => im);

  const chapters = block.chapters.map((c) => {
    if (isCampus(c)) return { ...c, kind: 'poster', filters: true, blurb: 'Placed through campus drives', groups: [{ name: '', images: pick('campus') }] };
    if (isOpen(c)) return { ...c, kind: 'poster', filters: true, blurb: 'Selected through open drives', groups: [{ name: '', images: pick('open') }] };
    return c;
  });
  const counts = chapters.filter((c) => c.filters).map((c) => `${c.name}: ${c.groups[0].images.length}`);
  if (DRY) { console.log(counts.join(' · ')); console.log(JSON.stringify(chapters.filter((c) => c.filters), null, 1).slice(0, 2000)); return; }
  await request('PATCH', `/api/sections/${section.id}`, { blocks: [{ ...block, chapters }] }, cookie);
  console.log('updated', section.id, '—', counts.join(' · '));
})().catch((e) => { console.error(e.message); process.exit(1); });
