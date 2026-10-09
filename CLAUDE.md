# Organization Presentation Portal — working brief

A projector-ready digital brochure a presenter walks through live, built to attract
colleges and universities into MOUs and academic partnerships. Two organizations,
sixteen sections each, role-based login.

## The working agreement

**The user supplies content and images. Claude does all the design and all the code.**

- The user never opens a builder, never arranges a layout, never adds a section.
- There is **no section-creation UI** and no free-hand editor. Do not add either back.
- Every section starts blank. It gets content only when the user hands it over.
- The user drops files in `incoming/<Section>/<Subsection>/` with a `content.txt`.
  Read the folder, design the page, publish it via the API.
- Deliver a finished, designed page — layout, image treatment, typography, motion.
  Do not hand back a half-built page for the user to finish.

## Run it

```bash
cd backend && node src/server.js      # http://127.0.0.1:4173
```

Zero runtime dependencies — no `npm install`, no build step, no CDN, no internet at
presentation time. Node 20+.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@org.local` | `Admin@123` |
| Presenter | `presenter@org.local` | `Present@123` |

## Shape of the thing

- `backend/` — plain Node HTTP server, JSON store at `backend/data/db.json`,
  media in `backend/uploads/`. Serves the API *and* the frontend.
- `frontend/src/` — vanilla ES modules, no framework. Built with a tiny `h()`
  helper in `utils/dom.js` (and `svg()` for vector nodes — SVG needs the
  namespace, `document.createElement('svg')` renders nothing).
- `frontend/public/styles/app.css` — the whole design system, one file.
- `incoming/` — raw user drops. Not served; not live until Claude places it.

Two orgs, each with its own palette applied at runtime as CSS custom properties:

| Org | id | Primary | Accent |
| --- | --- | --- | --- |
| Torii | `torii` | `#000000` | `#E95A22` |
| Technical Hub | `technical-hub` | `#008638` | `#FFBB00` |

The deck is **flat**: every navigation row is a slide, none of them is a folder.
Presenter-facing names and icons live in `NAVIGATION_GROUPS` in
`frontend/src/components/SideNav.js` and can differ from the stored section title.
Each section also carries its own `iconKey`, which outranks the curated one — keep
the two in step or the pane and the data disagree.

The subsection machinery is still there and still enforced one level deep
server-side; nothing currently uses it.

## Publishing a designed section

Sections hold `blocks[]` on a 12-column canvas. Write a Node script that PATCHes
`/api/sections/:id` with the block list. Block types and their fields are defined
in `backend/src/services/section.service.js` — that file is the schema.

```js
{ type: 'image', layout: { x: 0, y: 0, w: 7, h: 10 }, assetId, fit: 'cover', radius: 'lg' }
```

Upload media first via `POST /api/assets` (`{files:[{name, dataUrl}]}`), then
reference the returned asset ids.

## Hard-won layout rules — read before designing

- **A row span includes the gaps.** `ROW_HEIGHT` is 28 and `GAP` is 16, so `h: 7`
  reserves `7×28 + 6×16 = 292px`, not 196. Oversized spans leave dead white.
- **One slide is 16:9 at a nominal 1600×900.** After the head and gutters the
  canvas budget is **~654px**. Design to it: a section that exceeds it cannot fill
  the screen and gets letterboxed instead.
- **Blocks stretch, they do not shrink.** A block's content decides its real height;
  the span is a minimum.
- Card and gallery grids use `auto-fit`, never `auto-fill` — `auto-fill` leaves a
  phantom empty column and three cards end up filling 60% of the width.
- Presentation mode fills the display edge to edge when the content fits, and falls
  back to fitting (with margins) when it does not. Never clip content to fill.
- Do not widen the presenting side gutters. Row counts are measured at that exact
  canvas width; a wider gutter rewraps text onto rows that do not exist.

## Design rules

- **Accent as text must use `--accent-ink`.** Raw brand accent on white measures
  1.7:1 for Technical Hub's gold. The ink is the readable derivative. Raw accent is
  fine on a dark ground (e.g. a hero scrim over an image).
- **Every title is Oswald (`--display`), in capitals.** Page titles and section headings alike.
  One rule at the end of `app.css` ("Titles — one voice across the deck") lists them all; a new
  component's title class goes into that list rather than setting its own face.
- **Spread to the whole screen.** No column may end halfway down over an empty band: columns run top to
  bottom and their cards share the height (`flex: 1` / `grid-auto-rows: minmax(0, 1fr)`), with type sized
  up to suit. Where content varies (a module list, a partner's points) measure the card after layout and
  fit it — add items until the next would not fit, or tighten a step — never a fixed count. Measure
  overflow on a card's own content, not on an animated column: entrance transforms inflate
  `scrollHeight`.
- **No gradients.** White is the major surface; the accent is reserved for what is
  active or primary.
- **Never place a raw poster.** Crop away burned-in headlines and logos so the
  page's own typography carries the message — unless the user asks to keep it.
- **Never invent a metric.** "Thousands of students" stays as words; it does not
  become a fabricated number.
- **Never hand-draw a third-party brand logo.** No clean vendor logos exist in the
  library. Use typographic chips and ask for official files.
- Icons come from `frontend/src/utils/icons.js` — one 24×24 line family, resolved
  by keyword. Add to it rather than importing an icon set.
- Motion: blocks arrive in reading order, counters count up, the accent rule draws
  itself. Everything is off under `prefers-reduced-motion`.

## Verifying work — do not skip

Screenshot and measure before reporting done. Headless Chrome over CDP:

```bash
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<tmp> about:blank
```

Drive it with a small WebSocket client: set the session cookie, `Page.navigate`,
then **`Page.reload {ignoreCache:true}`** — a hash-only navigation does not reload
ES modules and you will test stale code. Then `Runtime.evaluate` to measure and
`Page.captureScreenshot` to look.

Measure, don't eyeball: contrast ratios, letterbox bars, whether a block clips.
When comparing a transformed element, `getBoundingClientRect()` is scaled but
`scrollHeight` is not — mixing them invents bugs that are not there.

Layout settles late: entrance animations and counters measure up to 30px taller
than the final layout, which is enough to flip a fill/fit decision. Re-measure
after the motion finishes.

## Subsections are real pages

A section may carry `parentId`, making it a page inside a group. The tree is one
level deep and that is enforced server-side. Selectors live in
`context/appStore.js`: `visibleSections()` returns groups only,
`childSections(parentId)` returns the pages inside one, and `deckSections()` walks
the tree so Prev/Next moves group → its pages → next group.

The navigation prefers real child sections; the curated label lists in
`NAVIGATION_GROUPS` are only placeholders for groups whose pages do not exist yet.
Build the pages and the labels are replaced automatically.

A detail page (a single success story, say) is just another child section. Link to
it from a `buttons` block with `href: '#/o/<org>/<sectionId>'` — the pane stays
put, and browser Back returns.

## Current state

Nineteen sections, all with content. Nothing is a placeholder and nothing is half
built; the empty ones were deleted rather than left for a presenter to walk into.
Organization Overview and Leadership used to be groups whose rows opened a list
instead of a slide — Leadership held no blocks at all, so its row opened an empty
page. Their pages came up a level and both wrappers went, along with CEO Vision.

| # | Section | Icon | Block | Source |
| --- | --- | --- | --- | --- |
| 1 | Executive Summary | `team-cycle` | `hero` | authored |
| 2 | Organization Snapshot | `camera-photo` | `drift-wall` | authored |
| 3 | History & Milestones | `roadmap` | `milestone-timeline` | authored |
| 4 | CEO Profile | `ceo-podium` | | Babji Neelam portfolio |
| 5 | Leadership Journey | `climb-steps` | | Babji Neelam portfolio |
| 5a | Team | `users` | `team-wall` | `tools/publish-team.cjs` — Babji Neelam at the centre on a gold-edged plaque, four Claude connectors floating round him as on the CEO page; the 25 portraits (`uploads/team/`) scattered round that cluster. Dotted lines join people only — never Babji — into one network (a spanning tree); no line passes behind anyone or crosses another. Entire team / Claude-certified architects switch |
| 6 | Success Stories | `rosette` | `story-wall` | `tools/publish-success-stories.cjs` — six Babji photographs lead (square crops in `uploads/stories/babji/`), then the full-size stories; photos fill their cards. The 206px thumbnails are off the wall until full-size files arrive |
| 7 | Programs | `www-globe` | `program-deck` | `uploads/Programs*`, `Videos.xlsx` |
| 8 | Centers of Excellence | `handshake-check` | `coe-wall` | `uploads/coepics/`, `Videos.xlsx` |
| 9 | Certifications | `seal-check` | `certification-wall` | see below |
| 10 | Placements | `job-pin` | `placement-wall` | `uploads/Placements/`; `tools/publish-placements.cjs` sorts Campus (green posters) from Open Drives (black-and-gold) by measured colour and tags every poster with its companies and package, read off the poster. Those two chapters carry `filters: true`: a rail of package bands and companies beside the gallery |
| 11 | Events | `event-sign` | `event-reel` | `uploads/Videos.xlsx` |
| 12 | Video Resumes | `clapper` | `video-resume` | `uploads/Video Resumes.xlsx` |
| 13 | AI Ready Engineer | `ai-figure` | `ai-ready-deck` | `tools/publish-ai-ready.cjs` — three pages: road map (cropped from the AI Ready road map, `uploads/ai-ready/`), course structure in four phases, benefits |
| 14 | AI Partners | `brain` | `ai-partners` | `tools/publish-ai-partners.cjs` — one landing page per partner off a side rail; Claude from claude.technicalhub.io (ten architects) and the success-story sites, OpenAI and Sarvam from the Torii Minds AI Partners page restated for Technical Hub; assets in `uploads/ai-partners/` |
| 15 | Technical Hub × Torii | `link` | `torii-app` | `tools/publish-th-torii.cjs` — the whole Torii application as an app inside one slide: Home (the partnership announcement as hero, the MoU services carousel), Trainings, AI Lab, Campus (galleries open in a viewer), Products, Partners; brand film over all. Media copied from profile.toriiminds.com into `uploads/th-torii/`. Key is still `torii`; the old two-tab `partnership` block lives on in `tools/publish-torii.cjs` |
| 15a | Collaborations | `partners` | `collab-wall` | `tools/publish-collaborations.cjs` — a wall of partner tiles, then one card per partner (announcement image, points restated from Technical Hub’s LinkedIn posts) with a gold ring running round the selected logo. Images in `uploads/collaborations/`. SRKR has no post yet |
| 15b | Stories Published | `newspaper` | `story-hub` | `tools/publish-stories-published.cjs` — one slide, **no sub-navigation** (the user asked for it that way): three story cards, each with its partner's square mark in a round badge, and each card opens its story in place — NCET × Claude (claude.ncet.co.in), Technical Hub × Claude (claude.technicalhub.io), Torii Minds × Claude (toriiminds.com/success-story). "All stories" returns to the cards; the deck walks cards → every chapter of each story → next slide. Copy only from those sites; NCET shows Technical Hub's **10** Claude-certified architects (the user's correction — the NCET site names four). Photos in `uploads/stories-published/<story>/`. Chapter shapes in `StorySite`: cover, split, cards, people, steps, gallery, compare |
| 16 | Platforms | `tap-network` | `platforms` | `uploads/platform-logos/` |

The glyphs are the user's own SVGs in `backend/uploads/navicons/`, one file per row
plus `Signout`, `collapse` and `expand`. They are solid-fill artwork at mixed
viewBoxes with no fill attributes, so `SideNav.artworkGlyph` paints each one as a CSS
mask over `background: currentColor` — the glyph then takes whatever colour the row
already has, with no second copy of the file and nothing to keep in step. Mapping
lives in `NAV_ARTWORK`, keyed by section key. The pane reads `navicons-fit/`, not
`navicons/`: the originals come from several sets at several weights (0.44 to 1.40 px
of stroke at 21px, a 3.2x spread) and `tools/normalise-navicons.cjs` writes copies
evened to one weight — scaling declared widths on stroked files, adding a stroke to
filled outlines, iterating because the weight has to be measured off a raster. Run it
after changing any original.

`navicons-fit/` is generated and is **not** in git. If it goes missing every icon in
the pane silently disappears, because a CSS mask whose file 404s paints nothing at all
rather than falling back. It has been lost once already. One command restores it:

```bash
node tools/normalise-navicons.cjs --port <a headless Chrome debug port>
```

A key with no file a key with no file falls through to the
line library in `utils/icons.js`, which still holds a drawn glyph for every row as a
fallback.

Distinct on purpose: collapsed, the pane is an icon rail and the glyph is the only
thing identifying a row.

Torii has no content. The same Leadership material applies to it — ask before
mirroring.

**Certifications is user-supplied and is not to be redesigned.** The component,
its CSS and `tools/publish-certifications.cjs` arrived as a bundle and were
reverted to it once already after being rewritten. Three acts — The Register,
Skills Unlocked, The Gallery — 42 credentials at 32,146 held, 19 vendors, 82
cohort cards. Change it only when asked, and change only what is asked.

## Republishing a section

`tools/` holds what can rebuild a page from its sources. Anything not listed is
still publishable only by hand.

| Script | Section |
| --- | --- |
| `publish-certifications.cjs` | Certifications — counts from `Logos.xlsx`, artwork from the folders, prose in the script |
| `fetch-certification-logos.cjs` | downloads the badge art named in `Logos.xlsx` |
| `import-leadership-photos.cjs` | Leadership Journey |
| `publish-programs.cjs` | Programs — the section's name, and Ignite Coder's photographs |
| `presenter-visibility.cjs` | what the presenter side shows |
| `flatten-navigation.cjs` | the flat deck — order, titles and per-section icons |
| `publish-ai-partners.cjs` | AI Partners — creates it after AI Ready Engineer, all copy in the script |
| `publish-team.cjs` | Team — creates it after Leadership Journey; names, the ten architects, the hub and the connector chips are in the script. `TeamWall` scatters a seeded grid, relaxes it with every real footprint (photo, name pill, chip, Babji's card) and shrinks the portraits only if it cannot settle clean |
| `recolour-team.cjs` | puts the supplied red Torii-shirt portraits into Technical Hub green with the TH mark (`--green` re-shades an already green shirt) |
| `make-training-reel.cjs` | renders the AI Ready classroom photos into the looping circle video |
| `publish-ai-ready.cjs` | AI Ready Engineer — the three-page brochure; course copy in the script |
| `publish-torii.cjs` | Torii — creates it after AI Partners; the Claude Partner Network badge is cut from the announcement kept beside it |
| `publish-th-torii.cjs` | Technical Hub × Torii — all copy and the media list in the script; checks every file exists before sending |
| `publish-collaborations.cjs` | Collaborations — one entry per partner, created after Technical Hub × Torii |
| `publish-success-stories.cjs` | Success Stories — the story list, titles in the script |
| `publish-placements.cjs` | Placements — re-sorts Campus / Open Drives by poster colour; the company and package of every poster are in the script, keyed by file name |
| `publish-stories-published.cjs` | Stories Published — the one slide and its three embedded stories, all copy and figures restated from the published sites; checks every file before sending and deletes any old child pages |
| `normalise-navicons.cjs` | evens the weight of the supplied nav artwork into `navicons-fit/` |

The `.xlsx` reader inside `publish-certifications.cjs` is self-contained — lift it
rather than writing a third one.

## Playing, pausing and Next

- **Playing** (the default): every auto-slide runs (`utils/autoSlide.js`) — photographs hold 5 s, and
  sections with tabs, chapters or pages advance through them on their own, 5–7 s by how much the
  view carries. A stepper opts in with `registerStepper(fn, { auto: ms | () => ms, next })`; `next`
  wraps a short toggle (Team, Events, Placements, Certifications acts), without it the walk stops at
  the end (Torii app, AI Ready). Next / Prev / arrows turn the deck.
- **Space** toggles a deck-wide pause: auto-slides hold, looping CSS animations freeze, a pill says
  so. **Paused**, Next / Prev step through the slide first (its stepper, then its visible
  auto-slides) and turn the deck only once it is spent.
- A component with its own `setInterval` must check `isDeckPaused()`; use `autoSlide` instead where possible.

## The navigation pane

One row per section, no folders. The rules it now follows:

- **Selected is colour, not fill.** The title and its mark turn `--nav-accent-ink`
  and a 3px `--nav-accent` bar appears at the row's left edge. A filled pill made
  the pane read as a row of buttons with one pressed.
- **Closed, the rows share the height.** `.nav-tree:not(:has(.is-open))` stretches
  them to fill the pane, capped at 66px, with the residue dealt out as gaps. Open a
  group and it reverts to content sizing.
- **A row with no subsections gets no panel element.** An empty one still drew its
  sunken plate and read as a subsection with nothing on it.
- **A closed panel's vertical padding belongs to the open state.** A `0fr` track
  zeroes the rows inside it but not the element's own padding, so a closed panel
  measured 14px and the pitch down the pane wandered.
- **Collapsed, the rail is `deepen(primary)`** — dark green for Technical Hub,
  black for Torii — with white glyphs and the selected one in `--nav-rail-active`
  (gold). The brand mark sits on it with no plate: the artwork is transparent
  everywhere but its strokes, so the white square was the plate alone.
- **Nothing draws a scrollbar.** `scrollbar-width: none` and a zero-width
  `::-webkit-scrollbar`; it still scrolls.
- Presenting is on the top bar and on **F**. The pane does not repeat it.

## Things already learned the hard way

Two galleries solve their own layout and do it differently on purpose.
`PlacementWall.justifyRows` fills each row's width, which suits photographs of
every shape. `CertificationWall.packRows` solves width and height together and
picks a column count, because a row of square cards is always far wider than it is
tall and filling the width alone strands the stage in white. Neither ever crops: a
tile's width is always its own aspect ratio times the solved height.

A programme's evidence is not always film. Ignite Coder has five photographs and
no reel, so a program carries `photos[]` beside `videos[]` and the gallery holds
both — a still opens in the same viewer a film does, contained rather than cropped
and capped at twice its own pixels. That is also why the cards carry no count: a
card reading "—" told the room a programme had nothing when it had five pictures.

Two things about that viewer, both found the hard way. Its way out was drawn at
zero opacity and revealed on `:hover` alone, so a presenter who had just clicked a
film saw a full-screen picture and nothing offering a way back — it is now lit on
open and again on any movement over the film, and a photograph keeps it for good.
And the *gallery's* back button was worse: the shared `.pg-bar` rule left it at zero
opacity with no hover rule that could ever match it, so it never appeared at all.

`width: auto` on an image you want to fill something is always wrong. `max-width`
only limits an intrinsically-sized image, it never stretches one, so the 800px
stills sat at 800px in the middle of a 1600px display however generous the cap was.
Fill the box and `object-fit: contain` inside it, and cap the *box*. Cap it on
`load` **and** immediately when `img.complete` is already true, or the second time
a picture is opened it comes from cache and the event never fires again.

Films live in `backend/uploads/Videos.xlsx`, six sheets, and the sheet's own
convention matters: a row with a title starts a series and every row beneath it
with the title left blank is another part of it. `EventReel` draws a series as a
numbered run with arrows, and the same films are filed into the matching programme
on Programs and the matching centre on Centers of Excellence — merged, never
replacing what those pages already carry.

No YouTube poster may be load-bearing. They come from `i.ytimg.com` and there is
no network at presentation time, so every poster removes itself on `error` and the
card falls back to type on a dark plate. The same rule covers vendor badges, which
is why they are downloaded rather than hot-linked.

A dimension check does not prove an image is whole. `others/DriveReady 10 Trainees
(PARTIAL DOWNLOAD).jpg` is 9.6kB of a much larger photograph with a header intact
enough to report a size. Check the last bytes too — `FFD9` for JPEG, `IEND` for
PNG, `0x3B` for GIF.

One trap before adding a section that scrolls internally: `.canvas-block > *` sets
`flex: 1`, and its `flex-basis: 0%` overrides `height` on the main axis. A
`min-height` root then grows to its content instead of letting a child scroll, and
FitSlide scales the slide down to fit. Use `flex: 0 0 auto` with `height` **and**
`max-height` — see `.ev-root`.

That definite height must be `var(--slide-h, 860px)`, never a bare `860px`. **A
slide in presentation mode is not 16:9 — it is the screen's shape.** FitSlide gives
it `1600 × (screenHeight / screenWidth)` nominal rows, so a 16:10 display hands the
section 1000 rows where the admin canvas has 860, and a root pinned to 860 stops
140 rows short. The section still *looks* full-bleed and FitSlide still reports the
slide as filled — the dead band is inside it, which is why it survived so long.
Seven roots had it: `sw`, `pg`, `tw`, `ev`, `vr`, `cs`, `pw`.

A percentage cannot replace it. FitSlide measures with the slide's height cleared —
it must, or it reads back its own answer — and a percentage of nothing is `auto`, so
the root grows to its full content during the very pass that decides whether to
fill. Placements measured 1483 rows that way and stopped filling at all. So
FitSlide publishes two properties on `.fit-slide__inner` instead:

| Property | What it is | Use it for |
| --- | --- | --- |
| `--slide-h` | the slide's height in its own nominal px, **set only while filling** | a root that needs a definite height |
| `--slide-scale` | the transform scale currently applied | converting real px into nominal px |

Both are cleared before the measurement for the same reason the height is, so
neither can feed back into the decision that produced it. Unfilled, every root
falls back to the 860 it always had.

`--slide-scale` exists because **the deck bar is 83 *real* pixels whatever the
slide is scaled to** — 69 nominal at scale 1.2, 92 at 0.9. Any clearance written as
a flat nominal figure clears the bar on one display and leaves the controls under
it on the next. Presenting therefore defines
`--deck-bar-clear: calc(96px / var(--slide-scale, 1))`, and the sections whose own
content reaches the floor use it as `padding-bottom`. The older `bottom: 104px` on
`.coe-wall` and `.tw-wall` predates this and has the same latent bug at large
scales.

The bar floating over a full-bleed photograph is the design and it carries its own
scrim; over a card's caption or a student's tile it is just content covered up.
Only the second kind needs the clearance.

When measuring whether something is really under the bar, intersect its rect with
every ancestor that clips. Inside a scrolling wall a half-scrolled card still
reports its whole box, well past the clip, and every scroller reads as a collision
that is not there.

FitSlide caps the room it measures at the window's height. At narrow widths the frame is
sized by its content, so a filled slide made the frame taller, which read as more room, and the
slide doubled every pass until it hit the browser's 2^25px layout limit.

Related: a box sized by `aspect-ratio` off a percentage width contributes *nothing*
to intrinsic height, so `grid-auto-rows: auto` sizes to the rest of the card and
the picture overflows. Hand the row an explicit height.
