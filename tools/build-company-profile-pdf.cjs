/*
 * Builds the printable Technical Hub company profile.
 *
 *   node tools/build-company-profile-pdf.cjs [--keep-html] [--port 9412]
 *
 * Writes frontend/public/Technical-Hub-Company-Profile.pdf, which the sign-in
 * page offers for download beside the sign-in button.
 *
 * It lays the brochure out as sixteen A4 pages of ordinary HTML and has
 * headless Chrome print them. No runtime dependency is added to the app: the
 * CDP client is the one in tools/lib, Chrome is launched and killed here, and
 * the fonts and photographs are the deck's own, read off disk as file:// URLs.
 *
 * Content comes from tools/profile-pdf/content.cjs, which reads db.json — so
 * re-running this after a section changes republishes a brochure that agrees
 * with the slides instead of drifting away from them.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const { connect, evaluate, sleep } = require('./lib/cdp.cjs');
const { content, UPLOADS, ROOT } = require('./profile-pdf/content.cjs');
const { css } = require('./profile-pdf/styles.cjs');

const OUT_PDF = path.join(ROOT, 'frontend', 'public', 'Technical-Hub-Company-Profile.pdf');
const WORK = path.join(os.tmpdir(), 'th-profile-pdf');
const FONTS = path.join(ROOT, 'frontend', 'public', 'fonts');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : fallback;
};
const PORT = Number(opt('--port', 9412));

/* ---------------------------------------------------------------------- */
/* images                                                                  */
/* ---------------------------------------------------------------------- */

const missing = [];
const truncated = [];

/** JPEG ends FFD9, PNG ends IEND+CRC, GIF ends 0x3B. A file that stops short
 *  still reports a size and still decodes a header, so the tail is the only
 *  honest check that a photograph is whole.
 *
 *  The format is sniffed from the first bytes, not from the extension: several
 *  vendor badges in backend/uploads/coe are WebP files saved as .png, and
 *  judging those by their name reports every one of them as clipped. */
function whole(file) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const head = Buffer.alloc(Math.min(12, size));
  fs.readSync(fd, head, 0, head.length, 0);
  const n = Math.min(16, size);
  const tailBuf = Buffer.alloc(n);
  fs.readSync(fd, tailBuf, 0, n, size - n);
  fs.closeSync(fd);

  const tail = tailBuf.toString('hex').toUpperCase();
  const magic = head.toString('hex').toUpperCase();
  if (magic.startsWith('FFD8FF')) return tail.endsWith('FFD9');
  if (magic.startsWith('89504E47')) return tail.includes('49454E44');
  if (magic.startsWith('474946')) return tail.endsWith('3B');
  return true; // webp, svg and anything else carry no such sentinel
}

const fileUrl = (abs) => `file:///${abs.replace(/\\/g, '/').replace(/^\//, '')}`;

const slug = (s) => path.basename(String(s), path.extname(String(s)))
  .toLowerCase().replace(/[^a-z0-9]/g, '');

/* The platforms block stores logo names that predate the files the user
   supplied — 'owlcoder.png' against 'Owl Coder.png', and the AI Engineer LMS
   against the AI Ready artwork. Slug matching settles the first kind; the
   second needs saying out loud. */
const LOGO_ALIASES = { aiengineerlms: 'aiready' };

/** Falls back to whatever file in the folder slugs to the same name, so a
 *  stored 'owlcoder.png' still finds 'Owl Coder.png'. */
function bySlug(dir, want) {
  const target = LOGO_ALIASES[want] || want;
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => slug(f) === target);
  return hit ? path.join(dir, hit) : null;
}

/** Resolves a path as the deck stores it — '/uploads/x', 'snapshot/x',
 *  'coe/x' — into a file:// URL, and records anything absent or clipped. */
function img(ref, hint) {
  if (!ref) return null;
  const clean = String(ref).replace(/^\/?uploads\//, '').replace(/^\//, '');
  const candidates = [clean];
  if (hint) candidates.push(path.posix.join(hint, clean));

  for (const rel of candidates) {
    let abs = path.join(UPLOADS, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      abs = bySlug(path.dirname(abs), slug(rel));
      if (!abs) continue;
    }
    if (!whole(abs)) {
      truncated.push(rel);
      return null;
    }
    return fileUrl(abs);
  }
  missing.push(ref);
  return null;
}

const shot = (name) => img(`snapshot/${name}`);

/* ---------------------------------------------------------------------- */
/* tiny html helpers                                                       */
/* ---------------------------------------------------------------------- */

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Wraps the chosen words in the gold highlighter block. */
const hl = (text) => `<span class="hl">${esc(text)}</span>`;

const picture = (src, cls = '', alt = '') =>
  src ? `<img class="${cls}" src="${src}" alt="${esc(alt)}">` : `<div class="${cls}"></div>`;

const statTile = (s) => `
  <div class="stat">
    <div class="stat__v">${esc(s.value)}${s.suffix ? `<sup>${esc(s.suffix)}</sup>` : ''}</div>
    <div class="stat__l">${esc(s.label)}</div>
    ${s.note ? `<div class="stat__n">${esc(s.note)}</div>` : ''}
  </div>`;

const chips = (list, cls = 'chip') =>
  list.map((c) => `<span class="${cls}">${esc(c)}</span>`).join('');

/* ---------------------------------------------------------------------- */
/* page shell                                                              */
/* ---------------------------------------------------------------------- */

let pageNo = 0;

function page(opts, inner) {
  pageNo += 1;
  const { dark = false, chapter = '', bleed = '', headOnBleed = false } = opts;
  const n = pageNo;
  return `
<section class="pg${dark ? ' pg--dark' : ''}">
  ${bleed}
  <div class="pg__head${headOnBleed ? ' pg__head--bleed' : ''}">
    <span><b>Technical Hub</b> · Company Profile</span>
    <span>${esc(chapter)}</span>
  </div>
  <div class="pg__body">${inner}</div>
  <div class="pg__foot">
    <span>${esc(content.org.edition)}</span>
    <span class="pg__no">${String(n).padStart(2, '0')}</span>
  </div>
</section>`;
}

/* ---------------------------------------------------------------------- */
/* 01 — cover                                                              */
/* ---------------------------------------------------------------------- */

function coverPage() {
  pageNo += 1;
  const hero = shot('th-crowd-believe.jpg') || shot('th-group-huge.jpg');
  const mark = img('technical-hub-mark-7fb50de468ee4814.png');
  const c = content.cover;
  return `
<section class="pg">
  <div class="bleed-full">${picture(hero, 'cover-img', 'Technical Hub students on campus')}</div>
  <div class="cover__scrim"></div>
  <div class="cover__band"></div>
  <div class="cover__edge"><span>${esc(c.badge)}</span></div>
  <div class="cover__inner" style="padding-right:26mm">
    <div class="cover__mark">
      ${picture(mark, '', 'Technical Hub mark')}
      <div class="cover__wordmark">Technical<br><span>Hub</span></div>
    </div>

    <div style="margin-top:auto">
      <div class="kicker" style="color:var(--gold)">${esc(c.kicker)}</div>
      <div class="cover__title" style="margin-top:5mm">
        ${esc(c.titleTop)}<br>${hl(c.titleBottom)}
      </div>
      <div class="rule" style="margin:7mm 0 5mm"></div>
      <p class="lead" style="max-width:112mm;color:rgba(255,255,255,.9)">${esc(c.standfirst)}</p>
    </div>

    <div class="cover__foot" style="margin-top:12mm">
      <span>${esc(content.org.home)}<br>${esc(content.org.region)}</span>
      <span style="text-align:right">${esc(content.org.site)}<br>${esc(content.org.email)}</span>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------------- */
/* 02 — welcome & contents                                                 */
/* ---------------------------------------------------------------------- */

function contentsPage() {
  const m = content.marquee;
  return page({ chapter: 'Contents' }, `
  <div class="row grow" style="gap:9mm">
    <div class="col" style="width:78mm;flex:none">
      <div class="welcome grow">
        <div class="kicker">Welcome</div>
        <h2>To our<br>company<br>profile</h2>
        <div class="rule" style="width:14mm;height:1.1mm;margin:0 0 4mm"></div>
        <p>${esc(content.summary.lead)}</p>
        <p style="margin-top:3mm">${esc(content.org.strapline)}</p>
        <div class="mosaic mosaic--fill" style="margin:6mm 0;grid-template-columns:1fr">
          <figure>${picture(shot('th-group-students.jpg') || shot('th-group-green.jpg'), '', 'Technical Hub students')}</figure>
        </div>
        <div style="display:flex;flex-direction:column;gap:3.4mm">
          ${m.slice(0, 3).map((s) => `
            <div style="display:flex;align-items:baseline;gap:3mm">
              <span style="font-family:Oswald;font-weight:600;font-size:18pt;line-height:1;color:#16120A">${esc(s.value)}${esc(s.suffix)}</span>
              <span style="font:700 6.6pt/1.25 'Open Sans';letter-spacing:.12em;text-transform:uppercase;color:#241C04">${esc(s.label)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="col grow">
      <div class="secno">Contents</div>
      <h2 class="title sm" style="margin-top:3mm">Sixteen pages.<br><em>One decade.</em></h2>
      <div class="rule"></div>
      <div class="toc">
        ${content.contents.map((r) => `
          <div class="toc__row">
            <span class="toc__n">${esc(r.n)}</span>
            <span class="toc__l">${esc(r.label)}</span>
            <span class="toc__dots"></span>
            <span class="toc__p">${String(r.page).padStart(2, '0')}</span>
          </div>`).join('')}
      </div>
      <!-- No poster artwork here: th-hero-certified carries a burned-in
           "15,000+ certified trainees" headline that would both compete with
           the page's own typography and contradict the figure beside it. -->
      <div class="mosaic mosaic--fill g2" style="margin-top:6mm">
        <figure>${picture(shot('th-group-huge.jpg'), '', 'The Technical Hub community')}<figcaption>Community</figcaption></figure>
        <figure>${picture(shot('th-coe-corridor.jpg') || shot('th-lab-wide.jpg'), '', 'Centres of excellence')}<figcaption>Centres of Excellence</figcaption></figure>
      </div>
      <p class="tiny" style="padding-top:4mm">
        Every figure in this brochure is taken from the Technical Hub presentation deck and from the
        records behind it — the certification register, the placement archive and the film library.
        Nothing here is an estimate.
      </p>
    </div>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 03 — who we are                                                         */
/* ---------------------------------------------------------------------- */

function aboutPage() {
  const s = content.summary;
  const strip = [
    { src: shot('th-lab-wide.jpg'), cap: 'Laboratories' },
    { src: shot('th-hall-training.jpg'), cap: 'Training' },
    { src: shot('th-projectspace-team.jpg'), cap: 'Project Space' },
  ];
  return page({ chapter: 'Who we are' }, `
  <div class="secno">01 — Who we are</div>
  <h2 class="title" style="margin-top:3mm">${esc(s.title[0])}<br>${hl(s.title[1])}</h2>
  <div class="rule"></div>

  <div class="row" style="gap:8mm">
    <div style="flex:1 1 0">
      ${s.body.map((p) => `<p class="lead">${esc(p)}</p>`).join('')}
    </div>
    <div style="flex:1 1 0">
      <div class="card card--fill" style="gap:3.4mm">
        <div class="card__n">The record, in short</div>
        ${s.points.map((p) => `
          <div style="display:flex;gap:2.6mm;align-items:flex-start">
            <span style="width:1.8mm;height:1.8mm;background:var(--gold);margin-top:1.7mm;flex:none"></span>
            <span class="card__b">${esc(p)}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="grid g3" style="margin-top:7mm;gap:6mm">
    ${content.mission.map((m) => `
      <div>
        <div class="stat__l" style="color:var(--green);margin-bottom:1.8mm">${esc(m.title)}</div>
        <div class="card__b">${esc(m.body)}</div>
      </div>`).join('')}
  </div>

  <div class="mosaic g3 spread" style="height:52mm;grid-template-rows:1fr">
    ${strip.map((f) => `
      <figure>${picture(f.src, '', f.cap)}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}
  </div>

  <div class="grid g4" style="margin-top:6mm;gap:5mm">
    ${content.marquee.map(statTile).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 04 — founder & CEO                                                      */
/* ---------------------------------------------------------------------- */

function leaderPage() {
  const l = content.leader;
  const portrait = shot('babji-hero-crop.png') || img('babji_hero_crop.png');
  // No chapter label: it would land on the portrait bleeding off the right
  // edge, and the section number carries the same word two lines below.
  return page({ chapter: '', bleed: `
    <div class="bleed-r" style="width:74mm">${picture(portrait, 'cover-img', 'Babji Neelam')}</div>
    <div class="bleed-r" style="width:74mm;background:rgba(1,36,18,.18)"></div>
  ` }, `
  <div class="col" style="width:106mm;flex:1 1 auto">
    <div class="secno">02 — Founder &amp; CEO</div>
    <h2 class="title" style="margin-top:3mm;font-size:38pt">${esc(l.first)}<br>${hl(l.last)}</h2>
    <div class="stat__l" style="margin-top:4mm;color:var(--green)">${esc(l.eyebrow)}</div>
    <div class="rule"></div>

    <p class="lead" style="font-size:11pt;font-weight:600;line-height:1.4">${esc(l.tagline)}</p>
    <p class="lead" style="margin-top:3mm">${esc(l.body)}</p>

    <div style="display:flex;gap:1.8mm;flex-wrap:wrap;margin-top:5mm">
      ${chips(l.tags)}
    </div>

    <div class="card card--fill" style="margin-top:6mm">
      <div class="card__n">In his words</div>
      <div style="font-family:Oswald;font-weight:400;font-size:12pt;line-height:1.3">“${esc(l.quote)}”</div>
    </div>

    <div style="margin-top:6mm">
      <div class="stat__l" style="margin-bottom:2.6mm">Where to find the work</div>
      ${l.links.map((k) => `
        <div style="display:grid;grid-template-columns:28mm 1fr;gap:3mm;padding:1.8mm 0;border-top:.3mm solid var(--hair)">
          <span style="font:700 7.4pt/1.3 'Open Sans';letter-spacing:.06em;text-transform:uppercase">${esc(k.label)}</span>
          <span class="tiny">${esc(k.note)}</span>
        </div>`).join('')}
    </div>

    <div class="mosaic mosaic--fill g3" style="margin-top:6mm">
      ${[
        { src: img('new_cisco_award_1786105279589.jpg'), cap: 'Cisco' },
        { src: shot('th-outdoor-review.jpg'), cap: 'Mentoring' },
        { src: shot('th-speaker-mic.jpg') || shot('th-ceo-room.jpg'), cap: 'On stage' },
      ].map((f) => `<figure>${picture(f.src, '', f.cap)}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}
    </div>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 05 — leadership journey                                                 */
/* ---------------------------------------------------------------------- */

function journeyPage() {
  const j = content.journey;
  return page({ chapter: 'Leadership journey' }, `
  <div class="secno">03 — Leadership journey</div>
  <div class="row" style="align-items:flex-start;gap:8mm;margin-top:2mm">
    <h2 class="title sm" style="flex:none;width:92mm">${esc(j.title[0])}<br>${hl(j.title[1])}</h2>
    <p class="lead" style="flex:1 1 0;padding-top:3mm">${esc(j.standfirst)} — from enterprise engineering in Australia and
    Switzerland, through a decade of global delivery, to building a skilling ecosystem back home.</p>
  </div>
  <div class="rule" style="margin:2.5mm 0"></div>

  <div class="col grow" style="justify-content:space-between">
    ${j.panels.map((p, i) => `
      <div class="chap">
        <div class="chap__no">${String(i + 1).padStart(2, '0')}</div>
        <div class="chap__shot">${picture(img(p.image), '', p.chapter)}</div>
        <div style="flex:1 1 0">
          <div class="chap__yr">${esc(p.year)}</div>
          <div class="chap__t">${esc(p.chapter)}</div>
          <div class="chap__r">${esc(p.role)}</div>
          <div class="chap__s">${esc(p.summary)}</div>
          <div class="chap__h">${chips(p.highlights)}</div>
        </div>
      </div>`).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 06–07 — development history                                             */
/* ---------------------------------------------------------------------- */

/* The reference spread runs a spine down the page with photographic
   medallions on it and the years alternating left and right. Five of the
   thirteen stops carry a picture; the rest are plain gold nodes, which keeps
   the rhythm from turning into a contact sheet. */
const MEDALLIONS = {
  2016: 'th-facade-night.jpg',
  2017: 'th-coe-coding.jpg',
  2020: 'th-session-green.jpg',
  2022: 'th-lab-wide2.jpg',
  2023: 'th-group-dark.jpg',
  2026: 'th-group-green.jpg',
};

function timelinePage(stops, { index, title, kicker, range }) {
  return page({ chapter: 'Development history' }, `
  <div class="secno">${esc(index)} — Development history</div>
  <div class="row" style="align-items:flex-end;gap:8mm;margin-top:3mm">
    <h2 class="title sm" style="flex:none;width:92mm">${title}</h2>
    <p class="lead" style="flex:1 1 0;padding-bottom:1mm">${esc(kicker)}</p>
  </div>
  <div style="display:flex;align-items:center;gap:3mm;margin:4mm 0 5mm">
    <span class="chip chip--gold nowrap">${esc(range)}</span>
    <span class="rule--thin" style="flex:1 1 auto"></span>
  </div>

  <div class="tl">
    ${stops.map((s, i) => {
      const left = i % 2 === 0;
      const medal = MEDALLIONS[s.label];
      const src = medal ? shot(medal) : null;
      const body = `
        <div class="tl__yr">${esc(s.label)}</div>
        <div class="tl__t">${esc(s.title)}</div>
        <div class="tl__b">${s.bullets.map((b) => `<span>${esc(b)}</span>`).join('')}</div>`;
      return `
      <div class="tl__stop${src ? ' tl__stop--big' : ''}${s.label === 'NEXT' ? ' tl__stop--next' : ''}">
        <div class="tl__half tl__half--l">${left ? body : ''}</div>
        <div class="tl__node">${src ? picture(src, '', s.title) : ''}</div>
        <div class="tl__half tl__half--r">${left ? '' : body}</div>
      </div>`;
    }).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 08 — programs                                                           */
/* ---------------------------------------------------------------------- */

function programsPage() {
  const p = content.programs;
  const evidence = (x) => {
    const bits = [];
    if (x.films) bits.push(`${x.films} ${x.films === 1 ? 'film' : 'films'}`);
    if (x.photos) bits.push(`${x.photos} photographs`);
    return bits.join(' · ');
  };
  return page({ chapter: 'Programs' }, `
  <div class="secno">05 — Programs</div>
  <h2 class="title" style="margin-top:3mm">The ${hl('programme')}<br>ladder.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">Eight programmes run the length of a degree — from a first line of code to a
  shipped product and a signed offer. Each one is filmed as it runs, and the films are part of the deck a
  partner campus receives.</p>

  <div class="grid g4 fill" style="margin-top:6mm;gap:4.5mm">
    ${p.items.map((x) => `
      <div class="card" style="align-items:flex-start;gap:3mm">
        <div class="logo-cell__img" style="background:#F6F8F7;padding:3mm;flex:none;height:24mm">
          ${picture(img(x.logo), '', x.name)}
        </div>
        <div class="card__t" style="font-size:10.5pt">${esc(x.name)}</div>
        <div class="tiny">${esc(evidence(x)) || '&nbsp;'}</div>
      </div>`).join('')}
  </div>

  <div class="row" style="gap:5mm;align-items:stretch;margin-top:5mm;height:52mm;flex:none">
    <div class="mosaic" style="flex:1 1 0;grid-template-columns:1fr 1fr;grid-auto-rows:1fr">
      <figure>${picture(shot('th-coe-coding.jpg'), '', 'Coding')}<figcaption>Practice</figcaption></figure>
      <figure>${picture(shot('th-session-pipeline.jpg') || shot('th-session-green.jpg'), '', 'Session')}<figcaption>Mentoring</figcaption></figure>
    </div>
    <div class="card card--fill" style="flex:none;width:64mm;justify-content:center">
      <div class="card__n">Filmed, not claimed</div>
      <div class="stat__v" style="font-size:30pt">${content.events.films}</div>
      <div class="card__b">films published across programmes, events, centres of excellence and the team —
      every one of them recorded on this campus.</div>
    </div>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 09 — centres of excellence                                              */
/* ---------------------------------------------------------------------- */

function coePage() {
  const c = content.coe;
  return page({ chapter: 'Centers of Excellence', dark: true }, `
  <div class="secno">06 — Centers of Excellence</div>
  <h2 class="title" style="margin-top:3mm;font-size:27pt">The platforms industry<br>runs on — and we are ${hl('tied up')}<br>with them.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">${esc(c.centers.length)} authorised vendor academies operate inside the campus.
  A partner institution gets the same academies, stood up under its own name.</p>

  <div class="grid g5 fill" style="margin-top:6mm;gap:3.4mm">
    ${c.centers.map((v) => `
      <div class="logo-cell" style="background:#fff;border-color:#fff">
        <div class="logo-cell__img">${picture(img(v.logo, 'coe'), '', v.name)}</div>
        <div class="logo-cell__n" style="color:var(--ink)">${esc(v.name)}</div>
      </div>`).join('')}
  </div>

  <div class="grid g4" style="gap:4mm;margin-top:6mm;flex:none">
    ${c.centers.slice(0, 4).map((v) => `
      <div class="card">
        <div class="card__n">${esc(v.name)}</div>
        <div class="card__b">${esc(v.tagline)}</div>
      </div>`).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 10 — certifications                                                     */
/* ---------------------------------------------------------------------- */

function certificationsPage() {
  const c = content.certifications;
  const top = c.league;
  const max = top[0].count;
  const fmt = (n) => n.toLocaleString('en-IN');
  return page({ chapter: 'Certifications' }, `
  <div class="secno">07 — Certifications</div>
  <h2 class="title" style="margin-top:3mm">Certified,<br>${hl('cohort by cohort')}.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">${esc(c.lead)}</p>

  <div class="grid g3" style="margin-top:6mm;gap:6mm">
    ${statTile({ value: fmt(c.held), label: 'Credentials held', note: 'Across every published batch' })}
    ${statTile({ value: String(c.credentialCount), label: 'Distinct credentials', note: 'Exam by exam' })}
    ${statTile({ value: String(c.vendorCount), label: 'Vendor programmes', note: 'As the register groups them' })}
  </div>

  <div class="row grow" style="margin-top:6mm;gap:8mm;min-height:0">
    <div class="col" style="flex:1 1 0">
      <!-- Listed by certifying body, which is finer-grained than the 19
           vendor programmes above: the register files Azure, Power Platform
           and Fabric under Microsoft but names each exam separately. -->
      <div class="stat__l" style="margin-bottom:3mm">By certifying body</div>
      <div class="league">
        ${top.map((v) => `
          <div class="bar">
            <span class="bar__n">${esc(v.name)}</span>
            <span class="bar__t"><span class="bar__f" style="width:${Math.max(2, (v.count / max) * 100).toFixed(1)}%"></span></span>
            <span class="bar__v">${fmt(v.count)}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="col" style="flex:none;width:72mm">
      <div class="stat__l" style="margin-bottom:3mm">Most-held credentials</div>
      <div class="league">
        ${c.top.map((t) => `
          <div style="display:grid;grid-template-columns:1fr 14mm;gap:2mm;padding:1.7mm 0;border-bottom:.3mm solid var(--hair)">
            <span>
              <span style="font:600 7.4pt/1.25 'Open Sans';display:block">${esc(t.name)}</span>
              <span class="tiny">${esc(t.vendor)}</span>
            </span>
            <span class="bar__v">${fmt(t.held)}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="card card--fill" style="flex:none;margin-top:6mm;flex-direction:row;align-items:center;gap:6mm">
    <div style="flex:1 1 0;font-family:Oswald;font-weight:400;font-size:12.5pt;line-height:1.32">“${esc(c.quote)}”</div>
    <div class="tiny" style="flex:none;width:44mm;text-align:right">${esc(c.quoteBy)}</div>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 11 — placements                                                         */
/* ---------------------------------------------------------------------- */

function placementsPage() {
  const p = content.placements;
  const wall = [...new Set([...p.destinations, ...p.inside])];
  const mosaic = [
    { src: shot('th-pl-google.jpg'), cap: 'Google' },
    { src: shot('th-pl-walmart226.jpg') || shot('th-pl-walmart13.jpg'), cap: 'Walmart' },
    { src: shot('th-pl-servicenow176.jpg'), cap: 'ServiceNow' },
    { src: shot('th-pl-flipkart.jpg'), cap: 'Flipkart' },
    { src: shot('th-pl-airbus.jpg'), cap: 'Airbus' },
    { src: shot('th-pl-cisco.jpg'), cap: 'Cisco' },
  ];
  return page({ chapter: 'Placements' }, `
  <div class="secno">08 — Placements</div>
  <h2 class="title" style="margin-top:3mm">Where they<br>${hl('walked in')}.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">${esc(p.lead)}</p>

  <div class="grid g4" style="margin-top:6mm;gap:4.5mm;flex:none">
    ${p.chapters.map((c) => `
      <div class="card">
        <div class="stat__v" style="font-size:20pt">${c.count}</div>
        <div class="card__t" style="font-size:9.5pt">${esc(c.name)}</div>
        <div class="tiny">${esc(c.blurb)}</div>
      </div>`).join('')}
  </div>

  <!-- The placement records are published artwork and the deck never crops
       them; they carry the company's own name, so no caption is added. -->
  <div class="mosaic g3 mosaic--fill" style="margin-top:6mm">
    ${mosaic.map((f) => `<figure>${picture(f.src, '', f.cap)}</figure>`).join('')}
  </div>

  <div style="margin-top:6mm;flex:none">
    <div style="display:flex;align-items:center;gap:3mm;margin-bottom:4mm">
      <span class="stat__l">Companies our students have joined</span>
      <span class="rule--thin" style="flex:1 1 auto"></span>
    </div>
    <div class="grid g5" style="gap:2.6mm">
      ${wall.map((n) => `<div class="co">${esc(n)}</div>`).join('')}
    </div>
    <p class="tiny" style="margin-top:3.4mm">Named in the Leadership Journey record and evidenced by the
    photographs returned from those offices. ${p.records} placement records are published in the deck.</p>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 12 — events & campus life                                               */
/* ---------------------------------------------------------------------- */

function eventsPage() {
  const e = content.events;
  const r = content.resumes;
  return page({ chapter: 'Events & campus life', dark: true, bleed: `
    <div class="bleed-full">${picture(shot('th-facade-night.jpg'), 'cover-img', 'Campus at night')}</div>
    <div class="bleed-full" style="background:rgba(1,36,18,.88)"></div>
  ` }, `
  <div class="secno">09 — Events &amp; campus life</div>
  <h2 class="title" style="margin-top:3mm">${esc(e.title.split(',')[0])},<br>${hl('on film')}.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">${esc(e.lead)}</p>

  <!-- The photograph band is a fixed 70mm so the four stills stay landscape;
       the chapter cards take whatever is left rather than either side of the
       page running to half-empty boxes. -->
  <div class="grid g3 fill" style="margin-top:6mm;gap:4.5mm">
    ${e.chapters.map((c) => `
      <div class="card">
        <div class="stat__v" style="font-size:20pt">${c.films}</div>
        <div class="card__t" style="font-size:10pt;color:#fff">${esc(c.name)}</div>
        <div class="card__b">${esc(c.blurb)}</div>
      </div>`).join('')}
  </div>

  <div class="mosaic g4" style="margin-top:6mm;height:70mm;flex:none;grid-auto-rows:1fr">
    ${[
      { src: shot('th-speaker-hall.jpg'), cap: 'Arena' },
      { src: shot('th-campus-night.jpg'), cap: 'Campus' },
      { src: shot('th-team-green.jpg'), cap: 'The team' },
      { src: shot('th-beanbags.jpg'), cap: 'Studio' },
    ].map((f) => `<figure>${picture(f.src, '', f.cap)}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}
  </div>

  <div class="row" style="flex:none;margin-top:6mm;gap:6mm;align-items:center;border-top:.3mm solid rgba(255,255,255,.22);padding-top:5mm">
    <div class="stat" style="flex:none;width:44mm">
      <div class="stat__v">${r.count}</div>
      <div class="stat__l">Video résumés</div>
    </div>
    <p class="lead" style="flex:1 1 0">${esc(r.lead)}</p>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 13 — AI Ready Engineer                                                  */
/* ---------------------------------------------------------------------- */

function coursePage() {
  const c = content.course;
  const student = c.frames.find((f) => /student/i.test(f.eyebrow || '')) || c.frames[0];
  const college = c.frames.find((f) => /college/i.test(f.eyebrow || '')) || c.frames[1];
  const why = c.frames.find((f) => /stands out/i.test(f.eyebrow || ''));
  return page({ chapter: 'AI Ready Engineer' }, `
  <div class="secno">10 — AI Ready Engineer</div>
  <div class="row" style="align-items:flex-end;gap:8mm;margin-top:3mm">
    <h2 class="title" style="flex:none;width:92mm">${esc(c.title[0])}<br>${hl(c.title[1])}</h2>
    <div style="flex:1 1 0;padding-bottom:1mm">
      <div class="kicker">${esc(c.eyebrow)}</div>
      <p class="lead" style="margin-top:2.4mm">${esc(c.standfirst)}</p>
    </div>
  </div>
  <div class="rule"></div>

  <div class="row grow" style="gap:6mm;align-items:stretch;min-height:0">
    <div class="grid g2" style="flex:none;width:96mm;gap:1.4mm;grid-auto-rows:1fr">
      ${c.modules.map((m, i) => `
        <div class="mod"><span class="mod__n">${String(i + 1).padStart(2, '0')}</span><span class="mod__t">${esc(m)}</span></div>`).join('')}
    </div>
    <div class="col" style="flex:1 1 0;gap:4mm">
      <div class="grid g2" style="gap:4mm">
        ${c.stats.map((s) => statTile({ value: s.value, label: s.label })).join('')}
      </div>
      <div class="card card--fill">
        <div class="card__n">Credential</div>
        <div class="card__t" style="font-size:12pt">${esc(c.credential.name)}</div>
        ${c.credential.ring ? `<div class="tiny">${esc(c.credential.ring)} ring</div>` : ''}
      </div>
      <div class="card card--fill">
        <div class="card__n">Partners</div>
        ${c.partners.map((p) => `
          <div style="display:flex;justify-content:space-between;gap:2mm;padding:1mm 0">
            <span style="font:600 8pt/1.3 'Open Sans'">${esc(p.name)}</span>
            <span class="tiny">${esc(p.note)}</span>
          </div>`).join('')}
      </div>
      ${why ? `
      <div class="col" style="flex:1 1 auto;justify-content:space-between;min-height:0">
        <div class="stat__l" style="color:var(--green)">${esc(why.title)}</div>
        ${why.items.map((i) => `
          <div style="display:flex;gap:2.6mm;align-items:center;padding-top:1.4mm;border-top:.3mm solid var(--hair)">
            <span style="width:1.8mm;height:1.8mm;background:var(--gold);flex:none"></span>
            <span style="font:600 7.6pt/1.3 'Open Sans'">${esc(i.title)}</span>
          </div>`).join('')}
      </div>` : ''}
    </div>
  </div>

  <div class="row" style="gap:6mm;flex:none;margin-top:6mm">
    ${[student, college].filter(Boolean).map((f) => `
      <div style="flex:1 1 0">
        <div class="stat__l" style="color:var(--green);margin-bottom:2.6mm">${esc(f.title)}</div>
        ${f.items.slice(0, 4).map((i) => `
          <div style="display:flex;gap:2.6mm;align-items:flex-start;padding:1.5mm 0;border-top:.3mm solid var(--hair)">
            <span style="width:1.8mm;height:1.8mm;background:var(--gold);margin-top:1.7mm;flex:none"></span>
            <span><span style="font:700 7.6pt/1.3 'Open Sans';display:block">${esc(i.title)}</span><span class="tiny">${esc(i.body)}</span></span>
          </div>`).join('')}
      </div>`).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 14 — platforms                                                          */
/* ---------------------------------------------------------------------- */

function platformsPage() {
  const p = content.platforms;
  return page({ chapter: 'Platforms' }, `
  <div class="secno">11 — Platforms we built</div>
  <h2 class="title" style="margin-top:3mm">${esc(p.title.split(' ')[0])} to<br>${hl('deliver')}.</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:150mm">The ecosystem runs on software written in house. Learners practise, submit
  and are assessed on platforms the organisation owns — which is why the record behind every number in this
  brochure can be produced on request.</p>

  <div class="col grow" style="gap:4mm;margin-top:6mm;justify-content:space-between">
    ${p.items.map((x, i) => `
      <div class="card" style="flex:1 1 0;flex-direction:row;align-items:center;gap:6mm;padding:5mm 6mm">
        <span class="chap__no" style="font-size:16pt;width:9mm">${String(i + 1).padStart(2, '0')}</span>
        <div class="logo-cell__img" style="width:28mm;height:11mm;flex:none;justify-content:flex-start">
          ${picture(img(x.logo, 'platform-logos'), '', x.name)}
        </div>
        <div style="flex:1 1 0">
          <div class="card__t" style="font-size:12pt">${esc(x.name)}</div>
          <div class="card__b">${esc(x.blurb)}</div>
        </div>
        <div class="tiny" style="flex:none;width:52mm;text-align:right">${esc((x.url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>
      </div>`).join('')}
  </div>

  <div class="mosaic g3" style="flex:none;margin-top:6mm;height:46mm;grid-template-rows:1fr">
    ${[
      { src: shot('th-app-maya.jpg'), cap: 'Myna' },
      { src: shot('th-app-modules.jpg'), cap: 'Modules' },
      { src: shot('th-coe-kiosk.jpg'), cap: 'On campus' },
    ].map((f) => `<figure>${picture(f.src, '', f.cap)}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 15 — academic partnership                                               */
/* ---------------------------------------------------------------------- */

function partnershipPage() {
  const p = content.partnership;
  return page({ chapter: 'Academic partnership', dark: true }, `
  <div class="secno">12 — ${esc(p.eyebrow)}</div>
  <h2 class="title" style="margin-top:3mm">${esc(p.title[0])}<br>${hl(p.title[1])}</h2>
  <div class="rule"></div>
  <p class="lead" style="max-width:155mm">${esc(p.lead)}</p>

  <div class="grid g2 fill" style="margin-top:6mm;gap:3.5mm">
    ${p.offers.map((o, i) => `
      <div class="card">
        <div class="card__n">${String(i + 1).padStart(2, '0')}</div>
        <div class="card__t" style="color:#fff">${esc(o.title)}</div>
        <div class="card__b">${esc(o.body)}</div>
      </div>`).join('')}
  </div>

  <div style="flex:none;margin-top:6mm;border-top:.3mm solid rgba(255,255,255,.22);padding-top:6mm;display:flex;align-items:flex-end;justify-content:space-between;gap:6mm">
    <div style="font-family:Oswald;font-weight:600;font-size:25pt;line-height:1.45;text-transform:uppercase">
      ${hl(p.close)}
    </div>
    <div class="tiny" style="width:72mm;text-align:right">
      Talk to us about an MOU<br>${esc(content.org.email)}<br><span class="nowrap">${esc(content.org.phone)}</span>
    </div>
  </div>`);
}

/* ---------------------------------------------------------------------- */
/* 16 — contact                                                            */
/* ---------------------------------------------------------------------- */

function contactPage() {
  pageNo += 1;
  const mark = img('technical-hub-mark-7fb50de468ee4814.png');
  const hero = shot('th-group-green.jpg') || shot('th-group-students.jpg');
  const o = content.org;
  const row = (k, v) => `<div style="margin-bottom:3.4mm"><div class="contact__k">${esc(k)}</div><div class="contact__v">${v}</div></div>`;
  return `
<section class="pg pg--dark">
  <div class="bleed-full">${picture(hero, 'cover-img', 'Technical Hub community')}</div>
  <div class="bleed-full" style="background:rgba(1,24,12,.9)"></div>
  <div class="cover__edge"><span>Step in. Stand out.</span></div>

  <div class="pg__body" style="right:26mm">
    <div class="cover__mark">
      ${picture(mark, '', 'Technical Hub mark')}
      <div class="cover__wordmark">Technical<br><span>Hub</span></div>
    </div>

    <div style="margin-top:14mm">
      <div class="kicker">Let us build the bridge on your campus</div>
      <h2 class="title" style="margin-top:4mm;font-size:34pt">Get in<br>${hl('touch')}.</h2>
      <div class="rule"></div>
    </div>

    <div class="row" style="margin-top:8mm;gap:8mm">
      <div style="flex:1 1 0">
        ${row('Partnerships & MOUs', esc(o.email))}
        ${row('Telephone', `<span class="nowrap">${esc(o.phone)}</span>`)}
        ${row('Campus', `${esc(o.home)}<br>${esc(o.region)}`)}
      </div>
      <div style="flex:1 1 0">
        ${row('Web', esc(o.site))}
        ${row('AI practice', esc(o.ai))}
        ${row('Films & stories', `${esc(o.youtube)}<br>${esc(o.linkedin)}`)}
      </div>
    </div>

    <div style="margin-top:auto;border-top:.3mm solid rgba(255,255,255,.26);padding-top:5mm;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm">
      <div>
        <div style="font-family:Oswald;font-weight:600;font-size:14pt;text-transform:uppercase;letter-spacing:.03em">${esc(o.strapline)}</div>
        <div class="tiny" style="margin-top:2mm">Founded ${esc(o.founded)} · ${esc(o.edition)}</div>
      </div>
      <div class="pg__no" style="font-size:13pt">16</div>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------------- */
/* document                                                                */
/* ---------------------------------------------------------------------- */

function buildHtml() {
  const stops = content.timeline.stops;
  const pages = [
    coverPage(),
    contentsPage(),
    aboutPage(),
    leaderPage(),
    journeyPage(),
    timelinePage(stops.slice(0, 6), {
      index: '04',
      title: `Ten years of<br>${hl('building')} careers.`,
      kicker: 'From a single observation about graduate employability to a campus-wide skilling ecosystem — the first six years.',
      range: '2015 — 2020',
    }),
    timelinePage(stops.slice(6), {
      index: '04',
      title: `And what<br>comes ${hl('next')}.`,
      kicker: 'Career readiness, an AI practice, the Anthropic Claude partnership, and the decade the organisation is building toward.',
      range: '2021 — Vision 2030',
    }),
    programsPage(),
    coePage(),
    certificationsPage(),
    placementsPage(),
    eventsPage(),
    coursePage(),
    platformsPage(),
    partnershipPage(),
    contactPage(),
  ];

  const styled = css.replace(/FONTS\//g, `${fileUrl(FONTS)}/`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Technical Hub — Company Profile</title>
<style>${styled}</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;
}

/* ---------------------------------------------------------------------- */
/* print                                                                   */
/* ---------------------------------------------------------------------- */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error('no Chrome found — set CHROME_PATH');
}

async function waitForPort(port, ms = 20000) {
  const http = require('http');
  const deadline = Date.now() + ms;
  for (;;) {
    const ok = await new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/json/version' }, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(900, () => { req.destroy(); resolve(false); });
    });
    if (ok) return;
    if (Date.now() > deadline) throw new Error(`Chrome never opened port ${port}`);
    await sleep(250);
  }
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  const htmlPath = path.join(WORK, 'profile.html');
  fs.writeFileSync(htmlPath, buildHtml(), 'utf8');

  if (truncated.length) {
    console.error('  clipped images (tail sentinel missing), left out:');
    for (const t of new Set(truncated)) console.error(`    ${t}`);
  }
  if (missing.length) {
    console.error('  images not found, left out:');
    for (const m of new Set(missing)) console.error(`    ${m}`);
  }

  const profile = path.join(WORK, 'chrome-profile');
  const chrome = spawn(findChrome(), [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  try {
    await waitForPort(PORT);
    cdp = await connect(PORT);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: fileUrl(htmlPath) });
    await sleep(600);
    await cdp.send('Page.reload', { ignoreCache: true });

    // Fonts and photographs must be decoded before the print, or the layout
    // Chrome measures is not the layout it rasterises.
    const ready = await evaluate(cdp, `(async () => {
      await document.fonts.ready;
      const imgs = [...document.images];
      await Promise.all(imgs.map((i) => i.complete
        ? null
        : new Promise((r) => { i.addEventListener('load', r, { once: true });
                               i.addEventListener('error', r, { once: true }); })));
      return { imgs: imgs.length, broken: imgs.filter((i) => !i.naturalWidth).map((i) => i.src) };
    })()`);
    await sleep(400);

    if (ready.broken.length) {
      console.error(`  ${ready.broken.length} image(s) failed to decode:`);
      for (const b of ready.broken.slice(0, 10)) console.error(`    ${decodeURIComponent(b)}`);
    }

    const result = await cdp.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.268,   // 210mm
      paperHeight: 11.693, // 297mm
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      transferMode: 'ReturnAsBase64',
    });

    fs.writeFileSync(OUT_PDF, Buffer.from(result.data, 'base64'));
    const kb = (fs.statSync(OUT_PDF).size / 1024).toFixed(0);
    console.log(`  wrote ${path.relative(ROOT, OUT_PDF)} — ${kb} kB, ${pageNo} pages, ${ready.imgs} images`);
    if (flag('--keep-html')) console.log(`  html kept at ${htmlPath}`);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
