/**
 * Brings the Engineer Roadmap application into the portal, as built.
 *
 *   node tools/sync-roadmap.cjs                       # from ~/Downloads/Road Map
 *   node tools/sync-roadmap.cjs "<path to Road Map>"  # from anywhere else
 *
 * The roadmap is its own React app (Downloads/Road Map). Its source stays there: edit it there,
 * `npm run build` there, then run this to copy the result in. Three things come across —
 *
 *   dist/          the built app            → roadmap/dist
 *   server/data/   all of its content       → roadmap/data
 *   server/media/  its photos, films, logos → roadmap/media
 *
 * The portal server then runs it unchanged: the page at /roadmap, its bundle at /assets, its
 * media at /media and its one API call, /api/roadmap, answered from roadmap/data. Fonts it asks
 * for at /fonts are the same files the portal already serves.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(process.argv[2] || path.join(os.homedir(), 'Downloads', 'Road Map'));
const DEST = path.join(__dirname, '..', 'roadmap');

const parts = [['dist', 'dist'], [path.join('server', 'data'), 'data'], [path.join('server', 'media'), 'media']];
for (const [from] of parts) {
  if (!fs.existsSync(path.join(SRC, from))) {
    console.error(`Not found: ${path.join(SRC, from)}${from === 'dist' ? ' — run `npm run build` in the roadmap first' : ''}`);
    process.exit(1);
  }
}

for (const [from, to] of parts) {
  const target = path.join(DEST, to);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(SRC, from), target, { recursive: true });
  let n = 0; let bytes = 0;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else { n += 1; bytes += fs.statSync(p).size; }
  });
  walk(target);
  console.log(`${to.padEnd(6)} ${String(n).padStart(4)} files  ${(bytes / 1048576).toFixed(1)} MB`);
}
console.log(`Copied from ${SRC}`);
