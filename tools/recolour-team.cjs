/**
 * Puts the team in Technical Hub shirts: recolours the red polo to Technical Hub green and
 * replaces the white Torii mark on the chest with the Technical Hub mark, printed white.
 *
 *   node tools/recolour-team.cjs <folder of cut-out PNGs> <out folder> [name …] [--green]
 *
 * Only shirt pixels change: below the chin line, strongly saturated red. Skin, lips and hands
 * are less saturated and more orange, so they fall outside the test. The white print on the
 * shirt (chest mark, sleeve stripe) is painted out with the surrounding green first, and the
 * Technical Hub mark is set where the chest mark was. Output is trimmed to the person and
 * written as transparent WebP, 760px tall. Needs ffmpeg.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GREEN = process.argv.includes('--green');   // the shirt is already green, just another shade
const [, , SRC, OUT, ...only] = process.argv.filter((a) => a !== '--green');
if (!SRC || !OUT) { console.error('usage: recolour-team.cjs <src> <out> [names…]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const MARK = path.join(__dirname, '..', 'backend', 'uploads', 'technical-hub-mark-7fb50de468ee4814.png');

const probe = (f) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number);
const raw = (f, vf) => execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, ...(vf ? ['-vf', vf] : []), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx / 255];
}
function rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.png'))
  .filter((f) => !only.length || only.some((o) => f.toLowerCase().startsWith(o.toLowerCase())));

for (const file of files) {
  const f = path.join(SRC, file);
  const [W, H] = probe(f);
  const px = raw(f);
  // The person's extent.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    if (px[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const ph = y1 - y0, pw = x1 - x0;
  const cut = y0 + ph * 0.3;          // below the chin
  const cx = (x0 + x1) / 2;

  // 1. Shirt weight per pixel, and the recolour.
  const shirt = new Float32Array(W * H);
  for (let y = Math.floor(cut); y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const i = (y * W + x) * 4;
    if (px[i + 3] < 8) continue;
    const [hh, s, v] = hsv(px[i], px[i + 1], px[i + 2]);
    // Degrees from pure red. Some polos photograph pinker, so the magenta side is allowed far
    // wider than the orange side, where skin lives.
    const hueW = GREEN ? 1 - ramp(Math.abs(hh - 125), 30, 42) : hh >= 180 ? 1 - ramp(360 - hh, 28, 40) : 1 - ramp(hh, 9, 17);
    const w = hueW * ramp(s, 0.45, 0.6) * ramp(v, 0.1, 0.2);
    if (w <= 0) continue;
    shirt[y * W + x] = w;
    // Technical Hub green, keeping the shirt's own shading: red polos sit near V 0.85, the
    // green's own value is 0.53, so the value is scaled to match.
    const [r, g, b] = rgb(146, Math.min(1, s * 1.02), Math.min(1, v * (GREEN ? 0.66 : 0.6)));
    px[i] = px[i] * (1 - w) + r * w;
    px[i + 1] = px[i + 1] * (1 - w) + g * w;
    px[i + 2] = px[i + 2] * (1 - w) + b * w;
  }

  // 2. White print surrounded by shirt: the chest mark and the sleeve stripe. The placket's
  //    buttons sit on the centre line and are left alone.
  const isShirt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && shirt[y * W + x] > 0.5;
  const mask = new Uint8Array(W * H);
  const R = 12;
  for (let y = Math.floor(cut); y < y0 + ph * 0.75; y += 1) for (let x = x0; x < x1; x += 1) {
    if (Math.abs(x - cx) < pw * 0.07) continue;
    const i = (y * W + x) * 4;
    if (px[i + 3] < 200) continue;
    const [, s, v] = hsv(px[i], px[i + 1], px[i + 2]);
    if (s > 0.3 || v < 0.6) continue;
    let n = 0, t = 0;
    for (let dy = -R; dy <= R; dy += 4) for (let dx = -R; dx <= R; dx += 4) { t += 1; if (isShirt(x + dx, y + dy)) n += 1; }
    if (n / t > 0.45) mask[y * W + x] = 1;
  }
  // Grow the mask a little so anti-aliased edges go too.
  const grown = new Uint8Array(mask);
  for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 1) {
    if (!mask[y * W + x]) continue;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) grown[(y + dy) * W + x + dx] = 1;
  }
  // The chest mark: the masked pixels on the person's left chest (image right), for placing
  // the new mark where the old one was.
  let mx0 = W, my0 = H, mx1 = 0, my1 = 0, found = 0;
  for (let y = Math.floor(cut); y < y0 + ph * 0.62; y += 1) for (let x = Math.floor(cx + pw * 0.07); x < x1; x += 1) {
    if (!mask[y * W + x]) continue;
    found += 1; if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y;
  }
  // Paint the print out: each masked pixel takes the average of the unmasked shirt around it,
  // filling inwards over a few passes.
  for (let pass = 0; pass < 14; pass += 1) {
    let left = 0;
    for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 1) {
      const k = y * W + x;
      if (!grown[k]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
        const q = (y + dy) * W + x + dx;
        if (grown[q]) continue;
        r += px[q * 4]; g += px[q * 4 + 1]; b += px[q * 4 + 2]; n += 1;
      }
      if (n >= 3) { px[k * 4] = r / n; px[k * 4 + 1] = g / n; px[k * 4 + 2] = b / n; grown[k] = 0; } else left += 1;
    }
    if (!left) break;
  }

  // 3. The Technical Hub mark, white, where the chest mark was (or a standard chest position).
  // A found mark larger than a chest print is something else (hair over the shoulder, a
  // watch); fall back to the standard chest position then.
  const ok = found > 30 && Math.max(my1 - my0, mx1 - mx0) < pw * 0.16;
  const found_ = ok ? Math.max(my1 - my0, mx1 - mx0) * 1.25 : 0;
  // Standard position: on the chest row, measured across the torso itself (crossed arms widen
  // the person's box, not the chest), a fifth of the way in from the centre.
  const chestY = Math.round(y0 + ph * 0.54);
  let t0 = -1, t1 = -1;
  for (let x = x0; x <= x1; x += 1) if (shirt[chestY * W + x] > 0.5) { if (t0 < 0) t0 = x; t1 = x; }
  const tw = t0 >= 0 ? t1 - t0 : pw;
  const tc = t0 >= 0 ? (t0 + t1) / 2 : cx;
  const mcx = ok ? (mx0 + mx1) / 2 : tc + tw * 0.2;
  const mcy = ok ? (my0 + my1) / 2 : chestY;
  const markH = ok ? Math.min(pw * 0.13, Math.max(pw * 0.09, found_)) : tw * 0.19;
  const size = Math.max(24, Math.round(markH / 2) * 2);
  const logo = raw(MARK, `scale=${size}:${size}`);
  const lx = Math.round(mcx - size / 2), ly = Math.round(mcy - size / 2);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const a = logo[(y * size + x) * 4 + 3] / 255;
    const X = lx + x, Y = ly + y;
    if (a <= 0 || X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const k = (Y * W + X) * 4;
    if (px[k + 3] < 200) continue;
    const ink = 244 * 0.94;
    px[k] = px[k] * (1 - a) + ink * a; px[k + 1] = px[k + 1] * (1 - a) + ink * a; px[k + 2] = px[k + 2] * (1 - a) + ink * a;
  }

  // 4. Write: trimmed to the person, 760px tall, transparent WebP.
  const tmp = path.join(OUT, '.tmp.rgba');
  fs.writeFileSync(tmp, px);
  const out = path.join(OUT, file.replace(/[\]\[]/g, '').replace(/\s+/g, '-').replace(/\.png$/i, '.webp').toLowerCase());
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', tmp,
    '-vf', `crop=${pw + 1}:${ph + 1}:${x0}:${y0},scale=-2:760`, '-c:v', 'libwebp', '-quality', '88', '-compression_level', '6', out]);
  fs.unlinkSync(tmp);
  console.log(`${path.basename(out)}  mark ${ok ? `found ${mx1 - mx0}x${my1 - my0}` : 'placed by default'}`);
}
