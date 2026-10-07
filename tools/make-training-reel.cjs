/**
 * Renders the AI Ready Engineer classroom photographs into a looping square video for the
 * Training onboard circle: each photograph slowly zooms (alternately pushing in and drifting
 * out) and dissolves into the next; the first photograph closes the loop so the restart is
 * seamless.
 *
 *   node tools/make-training-reel.cjs        # writes backend/uploads/ai-ready/training-reel.mp4
 *
 * Needs ffmpeg on the PATH. The photographs are washed white across their top, so each is
 * framed low to keep the students in the circle.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'backend', 'uploads', 'ai-ready');
const SRC = path.join(DIR, 'training');
const OUT = path.join(DIR, 'training-reel.mp4');
const SIZE = 640;
const FPS = 30;
const HOLD = 3.2;   // seconds each photograph is on screen
const FADE = 1.0;   // seconds of dissolve between them

const files = fs.readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f)).sort();
if (!files.length) throw new Error('no photographs in ' + SRC);
const seq = [...files, files[0]]; // the first again, so the loop closes on itself

const inputs = seq.flatMap((f) => ['-loop', '1', '-t', String(HOLD), '-i', path.join(SRC, f)]);
const frames = Math.round(HOLD * FPS);
const parts = seq.map((_, i) => {
  const push = i % 2 === 0;
  const zoom = push ? `min(1.28+0.0011*on,1.4)` : `max(1.4-0.0011*on,1.28)`;
  return `[${i}:v]scale=${SIZE * 2}:${SIZE * 2}:force_original_aspect_ratio=increase,`
    + `crop=${SIZE * 2}:${SIZE * 2}:(iw-${SIZE * 2})/2:(ih-${SIZE * 2})*0.8,`
    + `zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*0.88':d=${frames}:s=${SIZE}x${SIZE}:fps=${FPS},`
    + `format=yuv420p,setsar=1[v${i}]`;
});
let last = 'v0';
const fades = [];
for (let i = 1; i < seq.length; i += 1) {
  const offset = (HOLD - FADE) * i;
  const label = i === seq.length - 1 ? 'out' : `x${i}`;
  fades.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${label}]`);
  last = label;
}
// The loop restarts on the first photograph, so drop the final hold after the closing dissolve.
const total = (HOLD - FADE) * (seq.length - 1);
const graph = [...parts, ...fades, `[out]trim=duration=${total.toFixed(2)}[final]`].join(';');

execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[final]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', OUT], { stdio: 'inherit' });
console.log('wrote', OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + ' kB,', total.toFixed(1) + 's');
