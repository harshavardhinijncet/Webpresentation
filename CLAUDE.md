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

The deck is a **fixed 16 sections per org**. Navigation labels and their
subsections live in `NAVIGATION_GROUPS` in `frontend/src/components/SideNav.js`;
these are the presenter-facing names and can differ from the stored section title.

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

Fourteen of Technical Hub's twenty-three pages are designed and published. Any of
them is a fair reference for what "designed" means here:

- **Organization Overview** — the section page, plus Organization Snapshot and
  History & Milestones
- **Leadership** — CEO Profile, Leadership Journey, Success Stories, CEO Vision,
  built from the Babji Neelam portfolio page
- **Programs & Learning**, **AI Ready Engineer**, **Platforms**,
  **Centers of Excellence**, **Testimonials**
- **Placements** — justified-row galleries; the sources are announcement cards
  with names and counts set into them, so nothing there may be cropped
- **Certifications** — 82 cohort cards across 19 vendors, same rule
- **Events & Milestones** — the whole film library, 91 across six chapters,
  built from `backend/uploads/Videos.xlsx`

Torii has no content yet. The same Leadership content applies to it — ask before
mirroring.

Two galleries now solve their own layout, and they do it differently on purpose.
`PlacementWall.justifyRows` fills each row's width, which is right for
photographs of every shape. `CertificationWall.packRows` solves width and height
together and picks a column count, because a row of square cards is always far
wider than it is tall and filling the width alone strands the stage in white.
Neither ever crops: a tile's width is always its own aspect ratio times the
solved height.

Films live in `backend/uploads/Videos.xlsx`, six sheets, and the sheet's own
convention matters: a row with a title starts a series and every row beneath it
with the title left blank is another part of it. `EventReel` draws a series as a
numbered run with arrows, and the same films are also filed into the matching
programme on Programs and the matching centre on Centers of Excellence — merged,
never replacing what those pages already carry.

No YouTube poster may be load-bearing. They come from `i.ytimg.com` and there is
no network at presentation time, so every poster in the deck removes itself on
`error` and the card falls back to type on a dark plate.

One trap worth knowing before adding a section that scrolls internally:
`.canvas-block > *` sets `flex: 1`, and its `flex-basis: 0%` overrides `height`
on the main axis. A `min-height` root then grows to its content instead of
letting a child scroll, and FitSlide scales the slide down to fit. Use
`flex: 0 0 auto` with `height` **and** `max-height` — see `.ev-root`.
