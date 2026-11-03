/*
 * Measures and photographs the brochure before anyone calls it finished.
 *
 *   node tools/profile-pdf/verify.cjs [--port 9413] [--shots <dir>]
 *
 * It opens the HTML the builder left in the temp folder, reports any page
 * whose content runs past the 297mm trim (which the PDF would silently clip),
 * and writes a PNG of every page so the layout can actually be looked at.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { connect, evaluate, sleep } = require('../lib/cdp.cjs');

const argv = process.argv.slice(2);
const opt = (n, d) => (argv.indexOf(n) > -1 ? argv[argv.indexOf(n) + 1] : d);
const PORT = Number(opt('--port', 9413));
const HTML = path.join(os.tmpdir(), 'th-profile-pdf', 'profile.html');
const SHOTS = opt('--shots', path.join(os.tmpdir(), 'th-profile-pdf', 'shots'));

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
].filter(Boolean).find((c) => fs.existsSync(c));

const fileUrl = (abs) => `file:///${abs.replace(/\\/g, '/').replace(/^\//, '')}`;

async function waitForPort(port, ms = 20000) {
  const http = require('http');
  const deadline = Date.now() + ms;
  for (;;) {
    const ok = await new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/json/version' }, (res) => {
        res.resume(); resolve(res.statusCode === 200);
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
  if (!fs.existsSync(HTML)) throw new Error(`run the builder with --keep-html first (${HTML})`);
  fs.mkdirSync(SHOTS, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'th-profile-pdf', 'verify-profile')}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--allow-file-access-from-files', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  try {
    await waitForPort(PORT);
    cdp = await connect(PORT);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 210mm at 96dpi = 793.7px. Give the viewport that width exactly so a
    // measurement here is a measurement of the printed page.
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 794, height: 1123, deviceScaleFactor: 2, mobile: false,
    });

    await cdp.send('Page.navigate', { url: fileUrl(HTML) });
    await sleep(500);
    await cdp.send('Page.reload', { ignoreCache: true });
    await evaluate(cdp, `(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.complete ? null :
        new Promise((r) => { i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true}); })));
      return 1;
    })()`);
    await sleep(500);

    /* Two measurements, both of real consequences. `overflow` is anything
       past the trim — that is content the PDF loses. `pastColumn` is anything
       past the type column, which still prints but collides with the running
       foot. scrollHeight is deliberately not used: margin collapse inside a
       flex column reports a few phantom pixels on pages that are fine. */
    const report = await evaluate(cdp, `(() => {
      const H = 297 / 25.4 * 96;           // the trim, in CSS px
      return [...document.querySelectorAll('.pg')].map((pg, i) => {
        const pr = pg.getBoundingClientRect();
        const body = pg.querySelector('.pg__body');
        const br = body ? body.getBoundingClientRect() : pr;
        let trimOver = 0, trimWho = '';
        let colOver = 0, colWho = '';
        for (const el of pg.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.bottom - pr.bottom > trimOver) {
            trimOver = r.bottom - pr.bottom; trimWho = el.className || el.tagName;
          }
          if (body && body.contains(el) && r.bottom - br.bottom > colOver) {
            colOver = r.bottom - br.bottom; colWho = el.className || el.tagName;
          }
        }
        return {
          n: i + 1,
          height: Math.round(pr.height),
          trim: Math.round(H),
          overflow: Math.round(trimOver),
          pastColumn: Math.round(colOver),
          culprit: String(colOver > trimOver ? colWho : trimWho).slice(0, 60),
        };
      });
    })()`);

    let bad = 0;
    for (const p of report) {
      const flagged = p.overflow > 1 || p.pastColumn > 1;
      if (flagged) bad += 1;
      console.log(
        `  page ${String(p.n).padStart(2, '0')}  h=${p.height}/${p.trim}` +
        `  pastTrim=${p.overflow}px  pastColumn=${p.pastColumn}px` +
        (flagged ? `  <-- ${p.culprit}` : ''),
      );
    }

    for (const p of report) {
      const y = (p.n - 1) * p.trim;
      const r = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y, width: 794, height: p.trim, scale: 1.4 },
        captureBeyondViewport: true,
      });
      fs.writeFileSync(path.join(SHOTS, `page-${String(p.n).padStart(2, '0')}.png`), Buffer.from(r.data, 'base64'));
    }
    console.log(`  ${report.length} shots in ${SHOTS}`);
    console.log(bad ? `  ${bad} page(s) need attention` : '  no page overflows the trim');
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
