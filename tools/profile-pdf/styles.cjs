/*
 * The brochure's design system — one stylesheet, print units throughout.
 *
 * Everything is expressed in mm so a page is the page and not a guess at one.
 * Colours follow the deck's rules: gold is a fill or a highlighter, never text
 * on white (GOLD_INK is the readable derivative, the same step-toward-black
 * that frontend/src/utils/theme.js applies at runtime), green carries the
 * typographic accent, and there are no gradients.
 */

const GREEN = '#008638';
const GREEN_DEEP = '#01361C';
const GOLD = '#FFBB00';
const GOLD_INK = '#8C6700'; // inkFor('#FFBB00') — 5.2:1 on white
const INK = '#14181A';
const MUTE = '#5C6A66';
const HAIR = '#D9DEDC';

const fontFace = (family, file, weight, format) => `
@font-face {
  font-family: '${family}';
  src: url('FONTS/${file}') format('${format}');
  font-weight: ${weight};
  font-style: normal;
  font-display: block;
}`;

const css = `
${fontFace('Oswald', 'Oswald-400.woff2', 400, 'woff2')}
${fontFace('Oswald', 'Oswald-600.woff2', 600, 'woff2')}
${fontFace('Open Sans', 'OpenSans-400.woff2', 400, 'woff2')}
${fontFace('Open Sans', 'OpenSans-600.woff2', 600, 'woff2')}
${fontFace('Open Sans', 'OpenSans-700.woff2', 700, 'woff2')}

:root {
  --green: ${GREEN};
  --green-deep: ${GREEN_DEEP};
  --gold: ${GOLD};
  --gold-ink: ${GOLD_INK};
  --ink: ${INK};
  --mute: ${MUTE};
  --hair: ${HAIR};
  --pad: 16mm;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

@page { size: 210mm 297mm; margin: 0; }

html, body {
  width: 210mm;
  background: #fff;
  color: var(--ink);
  font-family: 'Open Sans', 'Segoe UI', sans-serif;
  font-size: 9pt;
  line-height: 1.52;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pg {
  position: relative;
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  background: #fff;
  page-break-after: always;
  break-after: page;
}
.pg:last-child { page-break-after: auto; break-after: auto; }

.pg__body {
  position: absolute;
  inset: 22mm var(--pad) 18mm var(--pad);
  display: flex;
  flex-direction: column;
}

/* ---- running head and foot ------------------------------------------- */

.pg__head {
  position: absolute;
  top: 11mm; left: var(--pad); right: var(--pad);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: 600 6.4pt/1 'Open Sans', sans-serif;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--mute);
}
.pg__head b { color: var(--green); font-weight: 700; }
.pg__foot {
  position: absolute;
  bottom: 9mm; left: var(--pad); right: var(--pad);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  font: 600 6.4pt/1 'Open Sans', sans-serif;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--mute);
}
.pg__no {
  font-family: 'Oswald', sans-serif;
  font-size: 13pt;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--ink);
  line-height: 1;
}
/* On a page with a photograph bleeding off the right edge, the chapter label
   sits on the picture, not on white. */
.pg__head--bleed span:last-child { color: rgba(255,255,255,.78); }
.pg--dark .pg__head, .pg--dark .pg__foot { color: rgba(255,255,255,.58); }
.pg--dark .pg__head b { color: var(--gold); }
.pg--dark .pg__no { color: #fff; }

/* ---- type ------------------------------------------------------------- */

.kicker {
  font: 700 7pt/1 'Open Sans', sans-serif;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: var(--green);
}
.pg--dark .kicker { color: var(--gold); }

/* Leading has to clear the highlighter. Oswald's inline box is about 1.1em
   tall, so a line-height under that lets the gold block of one line paint
   over the ascenders of the line above it — which it did, on every title in
   the brochure, until this was 1.14. */
h1.title, h2.title {
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -.004em;
  line-height: 1.14;
  font-size: 30pt;
}
h2.title.sm { font-size: 24pt; }
.title em { font-style: normal; font-weight: 400; color: var(--mute); }
.pg--dark .title { color: #fff; }

/* The highlighter from the reference spreads: a gold block sitting behind a
   word, sized to the word and not to the line box. */
/* Horizontal padding only: a vertical pad makes the gold box taller than the
   line box it sits in, which leaks past the bottom of a page whose column is
   already exactly full. */
.hl {
  background: var(--gold);
  color: #16120A;
  padding: 0 .16em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.lead {
  font-size: 10pt;
  line-height: 1.58;
  color: #2C3633;
}
p + p { margin-top: 2.6mm; }
.muted { color: var(--mute); }
.tiny { font-size: 7pt; line-height: 1.45; color: var(--mute); }

.rule {
  width: 18mm; height: 1.4mm;
  background: var(--gold);
  margin: 3.4mm 0;
  flex: none;
}
.rule--thin { height: .5mm; width: 100%; background: var(--hair); margin: 0; }

/* Outlined section numeral, top-left of each spread. */
.secno {
  font-family: 'Oswald', sans-serif;
  font-size: 11pt;
  font-weight: 600;
  color: var(--gold-ink);
  letter-spacing: .1em;
}
.pg--dark .secno { color: var(--gold); }

/* ---- layout helpers --------------------------------------------------- */

.row { display: flex; gap: 8mm; }
.col { display: flex; flex-direction: column; }
.grow { flex: 1 1 auto; min-height: 0; }
.spread { margin-top: auto; }
.gap4 { gap: 4mm; }
.gap6 { gap: 6mm; }

.grid { display: grid; gap: 5mm; }
.g2 { grid-template-columns: repeat(2, 1fr); }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g4 { grid-template-columns: repeat(4, 1fr); }
.g5 { grid-template-columns: repeat(5, 1fr); }
/* A grid that takes the slack left on the page rather than stacking at the
   top and leaving a white band above the footer. */
.fill { flex: 1 1 auto; grid-auto-rows: 1fr; min-height: 0; }
.nowrap { white-space: nowrap; }

.bleed-r { position: absolute; top: 0; right: 0; bottom: 0; }
.bleed-full { position: absolute; inset: 0; }
.cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ---- cover ------------------------------------------------------------ */

.cover__scrim {
  position: absolute; inset: 0;
  background: rgba(1, 36, 18, .62);
}
.cover__band {
  position: absolute; left: 0; right: 0; bottom: 0; height: 128mm;
  background: linear-gradient(to top, rgba(1,24,12,.94) 38%, rgba(1,24,12,0));
}
.cover__inner { position: absolute; inset: 0; padding: 18mm var(--pad); color: #fff; display: flex; flex-direction: column; }
.cover__mark { display: flex; align-items: center; gap: 4mm; }
.cover__mark img { height: 13mm; width: auto; display: block; }
.cover__wordmark {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 15pt;
  letter-spacing: .06em; text-transform: uppercase; line-height: 1;
}
.cover__wordmark span { color: var(--gold); }
.cover__title {
  font-family: 'Oswald', sans-serif; font-weight: 600; text-transform: uppercase;
  font-size: 56pt; line-height: 1.1; letter-spacing: -.012em;
}
.cover__title .hl { color: #16120A; }
.cover__edge {
  position: absolute; right: 0; top: 0; bottom: 0; width: 13mm;
  background: var(--gold);
  display: flex; align-items: center; justify-content: center;
}
.cover__edge span {
  writing-mode: vertical-rl;
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 11pt;
  letter-spacing: .36em; text-transform: uppercase; color: #16120A;
}
.cover__foot {
  display: flex; justify-content: space-between; align-items: flex-end;
  border-top: .4mm solid rgba(255,255,255,.3); padding-top: 4mm;
  font: 600 7pt/1.5 'Open Sans', sans-serif; letter-spacing: .14em; text-transform: uppercase;
  color: rgba(255,255,255,.8);
}

/* ---- statistics ------------------------------------------------------- */

.stat { display: flex; flex-direction: column; gap: 1.4mm; }
.stat__v {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 25pt;
  line-height: .9; color: var(--green);
}
.stat__v sup { font-size: .5em; vertical-align: super; color: var(--gold-ink); }
.stat__l {
  font: 700 6.6pt/1.3 'Open Sans', sans-serif; letter-spacing: .13em;
  text-transform: uppercase;
}
.stat__n { font-size: 6.6pt; color: var(--mute); line-height: 1.3; }
.stat::before { content: ''; display: block; width: 9mm; height: 1mm; background: var(--gold); margin-bottom: 1.6mm; }
.pg--dark .stat__v { color: var(--gold); }
.pg--dark .stat__v sup { color: #fff; }
.pg--dark .stat__l { color: #fff; }
.pg--dark .stat__n { color: rgba(255,255,255,.62); }

/* ---- cards ------------------------------------------------------------ */

.card {
  border: .35mm solid var(--hair);
  padding: 5mm;
  display: flex; flex-direction: column; gap: 2mm;
  background: #fff;
}
.card--fill { background: #F6F8F7; border-color: #ECEFEE; }
.card__t {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 11pt;
  text-transform: uppercase; line-height: 1.08; letter-spacing: .005em;
}
.card__b { font-size: 8pt; line-height: 1.5; color: #46514E; }
.card__n {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 9pt;
  color: var(--gold-ink); letter-spacing: .08em;
}

.chip {
  display: inline-block;
  border: .3mm solid var(--hair);
  padding: 1mm 2.6mm;
  font: 600 7pt/1.35 'Open Sans', sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  color: #3B4542;
}
.chip--gold { background: var(--gold); border-color: var(--gold); color: #16120A; }
.chip--green { background: var(--green); border-color: var(--green); color: #fff; }

/* ---- contents --------------------------------------------------------- */

.toc { display: flex; flex-direction: column; }
.toc__row {
  display: flex; align-items: baseline; gap: 3mm;
  padding: 2.7mm 0;
  border-bottom: .3mm solid var(--hair);
}
.toc__n {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 9pt;
  color: var(--gold-ink); width: 8mm; flex: none;
}
.toc__l { font-size: 9pt; font-weight: 600; letter-spacing: .01em; }
.toc__dots { flex: 1 1 auto; border-bottom: .3mm dotted #C6CDCA; transform: translateY(-1mm); }
.toc__p { font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 10pt; }

.welcome {
  background: var(--gold);
  color: #16120A;
  padding: 10mm 9mm;
  display: flex; flex-direction: column;
}
.welcome .kicker { color: #4A3A05; }
.welcome h2 {
  font-family: 'Oswald', sans-serif; font-weight: 600; text-transform: uppercase;
  font-size: 22pt; line-height: 1.08; margin: 3mm 0 4mm;
}
.welcome p { font-size: 8.4pt; line-height: 1.6; color: #241C04; }
.welcome .rule { background: #16120A; }

/* ---- vertical timeline (the reference's circular-medallion spine) ----- */

/* A flex column spread with space-between, so six stops and seven stops both
   reach the foot of the page instead of leaving a white tail below the last
   one. The spine then spans exactly the range the stops occupy. */
.tl {
  position: relative; flex: 1 1 auto; padding-left: 0;
  display: flex; flex-direction: column; justify-content: space-between;
}
.tl::before {
  content: ''; position: absolute; left: 50%; top: 3mm; bottom: 3mm;
  width: .5mm; margin-left: -.25mm; background: var(--hair);
}
.tl__stop { position: relative; display: flex; align-items: flex-start; }
.tl__half { width: 50%; }
.tl__half--l { padding-right: 13mm; text-align: right; }
.tl__half--r { padding-left: 13mm; }
.tl__node {
  position: absolute; left: 50%; top: 1mm;
  width: 7mm; height: 7mm; margin-left: -3.5mm;
  border-radius: 50%; background: var(--gold);
  border: 1.1mm solid #fff;
  box-shadow: 0 0 0 .4mm var(--hair);
}
.tl__stop--big .tl__node {
  width: 22mm; height: 22mm; margin-left: -11mm; top: -1mm;
  background: #fff; border: 1.1mm solid var(--gold); overflow: hidden; padding: 0;
}
.tl__stop--big .tl__node img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tl__yr {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 17pt;
  line-height: .92; color: var(--green);
}
.tl__t {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 9.6pt;
  text-transform: uppercase; line-height: 1.12; margin-top: .6mm;
}
.tl__b { font-size: 7.2pt; line-height: 1.42; color: #4C5653; margin-top: 1.2mm; }
.tl__b span { display: block; }
.tl__b span + span { margin-top: .3mm; }
.tl__stop--next .tl__yr { color: var(--gold-ink); }

/* ---- leadership chapters ---------------------------------------------- */

.chap { display: flex; gap: 4.5mm; align-items: stretch; }
.chap + .chap { margin-top: 2.8mm; padding-top: 2.8mm; border-top: .3mm solid var(--hair); }
.chap__shot {
  width: 27mm; flex: none; align-self: stretch;
  background: #EFF2F1; overflow: hidden; position: relative;
}
.chap__shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.chap__no {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 20pt;
  color: var(--hair); line-height: .9; width: 11mm; flex: none;
}
.chap__yr {
  font: 700 7pt/1 'Open Sans', sans-serif; letter-spacing: .18em;
  text-transform: uppercase; color: var(--gold-ink);
}
.chap__t {
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 11.5pt;
  text-transform: uppercase; line-height: 1.04; margin: .8mm 0 .4mm;
}
.chap__r { font: 600 7.2pt/1.3 'Open Sans', sans-serif; color: var(--green); margin-bottom: 1.2mm; }
.chap__s { font-size: 7.2pt; line-height: 1.44; color: #46514E; }
.chap__h { display: flex; gap: 1.4mm; margin-top: 1.4mm; flex-wrap: wrap; }
.chap__h .chip { padding: .6mm 2mm; font-size: 6.4pt; }

/* ---- logo wall -------------------------------------------------------- */

.logo-cell {
  border: .3mm solid var(--hair);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2mm; padding: 4mm 3mm; text-align: center; min-height: 0;
}
.logo-cell__img { height: 8mm; width: 100%; display: flex; align-items: center; justify-content: center; flex: 1 1 auto; }
.logo-cell__img img { max-height: 100%; max-width: 100%; object-fit: contain; display: block; }
.logo-cell__n {
  font: 700 7pt/1.2 'Open Sans', sans-serif; letter-spacing: .06em; text-transform: uppercase;
}
.logo-cell__t { font-size: 6.4pt; line-height: 1.3; color: var(--mute); }

/* ---- league bars ------------------------------------------------------ */

.league { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-between; }
.bar { display: grid; grid-template-columns: 34mm 1fr 15mm; align-items: center; gap: 3mm; }
.bar__n { font: 600 7.4pt/1.2 'Open Sans', sans-serif; }
.bar__t { height: 3.2mm; background: #EEF1F0; position: relative; }
.bar__f { position: absolute; left: 0; top: 0; bottom: 0; background: var(--green); }
.bar:nth-child(1) .bar__f, .bar:nth-child(2) .bar__f { background: var(--gold); }
.bar__v { font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 9pt; text-align: right; }

/* ---- module grid ------------------------------------------------------ */

.mod {
  border-left: .9mm solid var(--gold);
  padding: 2mm 0 2mm 3mm;
  display: flex; align-items: center; gap: 2.4mm;
}
.mod__n { font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 8pt; color: var(--gold-ink); width: 6mm; flex: none; }
.mod__t { font: 600 8pt/1.25 'Open Sans', sans-serif; }

/* ---- photo mosaic ----------------------------------------------------- */

.mosaic { display: grid; gap: 2.4mm; }
.mosaic--fill { flex: 1 1 auto; grid-auto-rows: 1fr; min-height: 0; }
.mosaic figure { position: relative; overflow: hidden; background: #EFF2F1; }
.mosaic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.mosaic figcaption {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 6mm 3mm 2.2mm;
  background: linear-gradient(to top, rgba(1,24,12,.86), rgba(1,24,12,0));
  color: #fff;
  font: 700 6.2pt/1.2 'Open Sans', sans-serif; letter-spacing: .14em; text-transform: uppercase;
}

/* ---- company wall ----------------------------------------------------- */

.co {
  border: .3mm solid var(--hair);
  padding: 3.4mm 2mm;
  text-align: center;
  font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 9.5pt;
  text-transform: uppercase; letter-spacing: .04em;
  display: flex; align-items: center; justify-content: center;
}

/* ---- dark page -------------------------------------------------------- */

.pg--dark { background: var(--green-deep); color: #fff; }
.pg--dark .card { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.17); }
.pg--dark .card__b { color: rgba(255,255,255,.74); }
.pg--dark .card__n { color: var(--gold); }
.pg--dark .lead { color: rgba(255,255,255,.84); }
.pg--dark .tiny, .pg--dark .muted { color: rgba(255,255,255,.6); }
.pg--dark .chip { border-color: rgba(255,255,255,.3); color: rgba(255,255,255,.85); }
.pg--dark .rule--thin { background: rgba(255,255,255,.2); }

/* ---- back cover ------------------------------------------------------- */

.contact__k {
  font: 700 6.6pt/1 'Open Sans', sans-serif; letter-spacing: .2em;
  text-transform: uppercase; color: var(--gold); margin-bottom: 1.6mm;
}
.contact__v { font-size: 10pt; line-height: 1.45; }
.contact__v a { color: #fff; text-decoration: none; }
`;

module.exports = { css, GREEN, GREEN_DEEP, GOLD, GOLD_INK, INK, MUTE, HAIR };
