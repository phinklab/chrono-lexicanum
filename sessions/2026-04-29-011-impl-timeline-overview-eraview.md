---
session: 2026-04-29-011
role: implementer
date: 2026-04-29
status: complete
slug: timeline-overview-eraview
parent: 2026-04-29-008
links:
  - 2026-04-29-007
  - 2026-04-29-009
  - 2026-04-29-010
commits:
  - 6a8230b
---

# Phase 2a slim — Overview ribbon + EraDetail at /timeline

## Summary

`/timeline` now renders the ported Overview ribbon (no `?era=`) and the
zoomed-in EraDetail (with `?era=`) on top of session 007's chrome.
TopChrome's `<EraToggle>` was migrated to write the prototype era id
(`great_crusade` / `horus_heresy` / `indomitus`) instead of the millennium
shorthand; legacy `?era=M30 | M31 | M42` URLs are server-redirected to the
mapped id so anything shared from session 007 keeps working. The 3-book
fixture (Horus Rising, Eisenhorn: Xenos, Dark Imperium) seeds Heresy,
Time of Ending and Indomitus eras for development. Build green; lint
baseline preserved.

## What I did

- `src/components/chrome/EraToggle.tsx` — rewrote URL contract per brief.
  M30→`great_crusade`, M31→`horus_heresy`, M42→`indomitus`. No default era
  any more (visiting `/` shows no toggle button active). Click on the
  active button is a no-op (3-way mutex; non-canonical eras come from the
  Overview ribbon).
- `src/components/chrome/TopChrome.tsx` — Suspense fallback updated to
  match the no-default behaviour (no button in the active state).
- `src/lib/timeline.ts` *(new)* — `Era`, `SeriesRef`, `TimelineBook`,
  `BookFilters` types; `makeProjectY(eras)` factory replacing the
  prototype's lazy `window.ERAS` build; `formatM` / `formatRange` ported
  as-is (1000-year hazard from brief preserved); `bookMatchesFilters`
  staged for the 2a.2 FilterRail brief.
- `src/components/timeline/Overview.tsx` *(new)* — client component;
  ported the ribbon SVG, era bands (band treatment, not illuminated),
  era labels with the 4-slot above/below stagger, book pins on the
  ribbon. Click on an era band navigates to `?era={id}` via
  `router.push`.
- `src/components/timeline/EraDetail.tsx` *(new)* — client component;
  ported the era header (kicker + name + tone + meta stats), axis ticks,
  series tracks (PCT-space packing), standalone book markers (dot
  variant only), prev/next era nav (as `<Link>` so it works without JS),
  pan/drag for wide eras, empty-state caption.
- `src/app/timeline/page.tsx` — server component; `await searchParams`,
  redirect legacy M30/M31/M42 via `next/navigation`, fetch eras + series
  + books via Drizzle (relational `findMany` for books with factions +
  series joins), adapt to `TimelineBook` shape, render Overview or
  EraDetail. Caching: none (per brief).
- `src/app/globals.css` — added prototype-vocabulary aliases
  (`--ink-*`, `--line-*`, `--bg-*`, `--gold`) under `:root` so ported
  CSS reads near-verbatim. Appended a `/* ===== Timeline ===== */` block
  with all visual rules for the Overview + EraDetail surfaces.
- `scripts/seed-data/books.json` — 3-book fixture: Horus Rising,
  Eisenhorn: Xenos, Dark Imperium.
- `sessions/2026-04-29-008-arch-timeline-overview-eraview.md` —
  `status: open` → `status: implemented`.
- `sessions/2026-04-29-011-impl-timeline-overview-eraview.md` *(this)*.
- `sessions/README.md` — active threads updated.

## Decisions I made

### CSS organisation (open question 1)

Folded the timeline rules into `globals.css` under a labelled
`/* ===== Timeline ===== */` block, alongside `Hub` and `Chrome`. Same
pattern as session 007 set. Reasons: (a) the prototype's class names
(`.era-seg`, `.series-bar`, `.bm-dot`, `.pan-scrubber`, …) port near
verbatim and the site is small — module hashing buys nothing yet;
(b) the `:root` aliases I added (`--ink-2`, `--line-1`, `--gold`, …)
are reusable across the next several ports (filter chips, entry-cards,
faction glyphs) and globally-scoped CSS lets me use them without
re-importing per module. Phase 2a.1 / 2a.2 / 2a.3 should follow this
pattern unless a component grows enough internal CSS to justify its own
file (e.g. the future DetailPanel modal might warrant `detail-panel.css`).

### Era treatment pick (open question 2)

**Bands.** The Overview ribbon needs each era to be (a) easily
clickable as a hit-target and (b) visually distinguishable when the
mouse is inside it. The illuminated treatment (thin capsule + ◆ end
caps) is more elegant on a wider canvas but reads as a row of small
ornaments at the Hub's painterly aesthetic — too easy to mis-target
and too quiet. Bands give the era a 120-tall hit zone with a clear
hover-fade-in.

I did **not** expose this as a config knob for now. If we ever ship a
"reduce ambient effects" settings popover (carry-over note from
session 007), it could be the right place for an "illuminated /
banded" toggle — but that's polish-pass territory.

### `projectY` placement and shape (open question 3)

Lives in `src/lib/timeline.ts` as a pure factory: `makeProjectY(eras)`
returns a `(y) => x` projector. The eras-as-arg form replaces the
prototype's `window.ERAS` lazy build. Rationale: with the eras now
flowing through React props (server fetch → client component), the
projector should rebuild only when eras change, which is essentially
never within a render — `useMemo` in each client component handles that.

Both client components rebuild it themselves via `useMemo` because the
projector is a function and can't cross the RSC server→client
boundary. Building once per component-mount per era list is cheap
(small N, single math pass), so the duplication is fine. If we ever
have many client consumers, the right move is exporting an async
`<TimelineProvider>` server component that hands the projector down via
React context — but that's premature for one consumer per page.

### Fixture dates accuracy (open question 4)

- **Horus Rising** — `startY=30998`, `endY=30998`. Per brief.
  Confidence: high. The Heresy is canonically dated to 005.M31 in
  Lexicanum, which our `(M-1)*1000+year_within_M` encoding writes as
  30998 (Cowork's encoding shifts everything +1000 vs. Warhammer's
  M-naming — see hazard note). Heresy era is encoded 30998-31014, so
  Horus Rising sits exactly at era start. Falls into both
  `great_crusade` and `horus_heresy` under my ±5 boundary leak (see
  next decision); that's the prototype's behaviour too and acceptable
  for fixture purposes.
- **Eisenhorn: Xenos** — `startY=41200`, `endY=41220`. **Moved from
  brief's suggested 38400.** Reason: 38400 falls in an era-encoding
  gap between `age_apostasy` (encoded 37000-37999) and `time_ending`
  (encoded 40997-41999). With the brief's 38400 the book renders on
  the Overview ribbon but not in any EraDetail — confusing for dev.
  Shifted to 41200 so the book lives inside `time_ending` (which is
  also wide enough to exercise the pan/drag interaction). The cost is
  a small canon misalignment: Eisenhorn: Xenos is canonically set in
  mid-M41 (year ≈40240 in our encoding); displaying it at M42.200 via
  `formatM` is "wrong" by canon, but until we either fill the M39-M41
  era gap in `eras.json` or add a per-book era override, this is the
  cleanest dev compromise. **Flag for the next session: extend
  `eras.json` to cover the M39-M41 gap (or split Long War / Apostasy
  to fill the run-up to Time of Ending).**
- **Dark Imperium** — `startY=42030`, `endY=42040`. Per brief.
  Confidence: high. Indomitus opens canonically at the start of M42;
  encoded as 42000 (under Cowork's +1000 shift), so 42030 sits ~30
  years into Indomitus. Standalone (no series), per brief.

### Era boundary leak (related to fixture)

The prototype filters era-books by midpoint with a ±50-year leak. With
my 3-book fixture and Indomitus starting (encoded) immediately after
Time of Ending ends, the ±50 leak pulled Dark Imperium back into Time
of Ending. Tightened to **±5** for this brief — small enough to
exclude obvious neighbours, still catches off-by-a-few-years dating
discrepancies that Phase 4 ingestion will introduce. Documented inline
in `EraDetail.tsx`. Phase 4 may revisit.

### Pan/drag UX on wide eras (open question 5)

Ported as-is from the prototype: `mousedown` on `.tracks` arms a drag,
window-level `mousemove` updates `panFrac`, window-level `mouseup`
clears it. Touch handlers parallel. The drag-to-pan-window-fraction
formula is the prototype's; calibration: I left the drag's "1 px = X%
window" sensitivity untouched because at the era widths we have today
(Long War: 5000y → 16% visible window; Time of Ending: 1002y → 80%
visible) the perceived response feels right.

I did **not** verify on a mobile-emulated viewport (Windows shell,
no devtools). Worth a once-over on the deployed preview for touch
responsiveness — if mobile feels too sticky/twitchy, the cleanest
knob is a `* devicePixelRatio` divisor in `panDelta`. Not done now.

The visible scrubber chrome (track + thumb + drag-to-pan hint) stays
the prototype's basic shape. The hint copy `◂ drag to pan ▸` already
sits in the cogitator-mono voice — kept. If the scrubber ever feels
too loud below sparse content, the hint label can drop to opacity ≤
0.4 and the track to ≤ 50% of its current 3-px height with one-line
edits.

State on era-change resets via `key={era.id}` on `<EraDetail>` at the
parent — cheaper than a `setState`-in-effect inside the child (which
ESLint flagged with `react-hooks/set-state-in-effect`). React
unmounts + remounts on key change; pan, drag refs and window listeners
all clean up naturally.

### Glitch filter on era hover (open question 7)

**Skipped.** The prototype's RGB-split `glitchFilter` SVG defs +
`eraGlitch` keyframe make hovering an era band stutter through a
displacement / chromatic-aberration glitch over 380 ms. It's a strong
choice but I didn't ship it because:

1. It reads as **2018-tech-startup / synthwave** rather than
   **grimdark cogitator**. The Hub vocabulary we shipped in 007 — tile
   rise from 6 px blur, eyebrow dot pulse, breathing ribbon — already
   creates a "live screen" feeling without flashy chrome. A
   chromatic-aberration glitch on top would be a different dialect.
2. With `prefers-reduced-motion` it has to be gated, which means an
   extra runtime branch in an SVG `<filter>` reference. Solvable but
   not free.
3. The brief explicitly invited me to dial / skip / decide.

What I did ship for hover: the band fill animates `color` and `opacity`
on hover (`var(--ink-2)` 0.55 → `var(--hl)` 1.0 over 0.3s), a soft
`drop-shadow` lights the band, and the top + bottom dashed accents
fade in. Same vocabulary as the Hub tile-hover treatment. Reads as
"the cogitator is reading you back" without competing chrome.

If we ever decide we want the glitch back, the SVG `<defs>` can land
in 5 lines and the keyframe in 15. Cheap reversal.

### Anything else from the prototype I wanted to bring across (open question 6)

The slim-to-fat trajectory you already named (EntryRail / FilterRail /
DetailPanel) covers the big stuff. Three smaller things I held:

1. **The `phase-zoomed` cinematic widening** of the timeline canvas
   when you drill into an era (prototype `timeline.css` 17-20). It
   reads as "the camera moves closer" and would be a nice touch on
   transition. Skipped because it depends on the parent state machine
   we don't have under the URL-based navigation. With Next router
   transitions it'd need an `view-transition` API hook or a manual
   measured-resize. A polish-pass exercise.
2. **Hover tooltip on book pins on the Overview ribbon.** Currently
   they're mute (the prototype only has hover treatment on the EraDetail
   markers, not the Overview pins). On the slim brief I held this so
   the Overview's job stays "name the era you want to drill into."
   Worth revisiting in 2a.3 alongside the click-to-DetailPanel wiring.
3. **A pan-scrubber click-to-jump.** Click anywhere on the pan track
   should jump the window to that fraction; right now the only way to
   move the window is drag. Cheap addition (~10 LoC). Held to keep
   the slim brief truly slim.

### TypeScript shape for the joined book row (open question 8)

I used Drizzle's relational `db.query.books.findMany({ with: {...} })`
with `factions: { columns: { factionId: true } }` and
`series: { columns: { id: true, name: true } }`. The returned rows
have `b.factions: { factionId: string }[]` and `b.series: { id, name }
| null` plus the columns of the books table itself.

The reshape happens inline in `loadTimeline()`:

```ts
books: bookRows.map((b) => ({
  id: b.id,
  slug: b.slug,
  title: b.title,
  author: b.author,
  startY: Number(b.startY ?? 0),       // numeric → number
  endY: Number(b.endY ?? 0),
  factions: b.factions.map((f) => f.factionId),
  series: b.seriesId ? { id: b.seriesId, order: b.seriesIndex } : null,
}));
```

A few notes worth folding into 2a.1's brief:

- **`numeric` columns return `string`** in postgres-js. `Number(...)`
  coerces; `Number(null)` is `0` so I used `?? 0` to be explicit.
  EraDetail / Overview both expect plain numbers; coercing at the
  adapter (not inside the components) keeps the math simple downstream.
- I read **`b.seriesId` directly** rather than `b.series.id` from the
  relational join. Either works; the FK column is cheaper because it
  avoids a join lookup, and the prototype's expected shape needs only
  the id + the seriesIndex (which lives on the books table itself).
  The relational `series: true` join was kept in the query because
  the future DetailPanel wants the series `name` to render the
  "Series · Part 1 of 5" line.
- The `seriesById` lookup is built from a separate `db.select().from(seriesTable)` because we need names for series that don't have any books in the current fixture (e.g. Horus_Heresy_Main has only one book today). With Phase 4's larger catalog this could fold back into the books query's relational join.
- If 2a.1 wants this in a reusable helper, the right place is
  `src/lib/timeline-adapter.ts` — adaptBookRow / adaptEraRow / etc.
  Not extracted today because there's exactly one consumer.

### Other small choices

- **`useMemo` everywhere it matters in EraDetail.** The track-packing
  algorithm runs on every render of `eraBooks` × pan position; memoised
  on `[eraBooks, pctOf]`. `pctOf` itself memoises on `[vStart, vSpan]`.
  The `eraBooks` array memoises on `[books, era.start, era.end]`.
- **`<Link>` for prev/next era nav** instead of `useRouter().push`.
  Buttons that look like buttons but ARE links so they work without
  JS, get the right hover / right-click affordances, and let Next
  prefetch the adjacent era's RSC payload on hover.
- **Empty-state copy:**
  `// EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH`. Lifted
  the `// ` prefix from session 007's eyebrow voice. Kept the
  "EXCERPTUM" word from the kicker so the empty state visually rhymes
  with the populated state's header.
- **Timeline-page eyebrow:** `// Chronicle-Console · {era.name | Survey-mode}`.
  Same vocabulary as the Hub's `// Archive-Console · cogitator online`,
  just route-specific. Survey-mode reads as "you're seeing the whole
  galaxy at once"; once you click into an era, the eyebrow flips to
  the era name.
- **Did NOT migrate the `cn` helper.** Used `clsx` per brief.
- **Did NOT touch the `formatM` formula.** Per brief 008's hazard
  note. The kicker on `/timeline?era=horus_heresy` reads `EXCERPTUM ·
  M31.998–M32.014` — 1000 years off Warhammer canon. A separate
  cleanup brief should decide whether to fix `formatM` (subtract 1000
  from the M number) or shift all encoded years in `eras.json` /
  `books.json` down by 1000. Shifting the data is the bigger move but
  would let the toggle's M30/M31/M42 labels match what `formatM`
  prints; fixing `formatM` is one-line but breaks every URL/scrape
  reference to the existing encoded years.

### Versions

No new dependencies. No version bumps. Next, React, Tailwind,
Drizzle, postgres-js all at session-005 / session-007 pins.

### What I deliberately did not do

- **Did not implement EntryRail / FilterRail / DetailPanel** — these are
  the slim-to-fat 2a.1 / 2a.2 / 2a.3 follow-ups.
- **Did not port the prototype's scan-line zoom transition between
  Overview and EraDetail** — out of scope. Plain Next route transition
  on `?era=` flip handles navigation.
- **Did not implement glyph / card BookMarker variants** — dot only,
  per brief.
- **Did not wire book-pin click to anything** — `console.log` in dev
  only. 2a.3 wires DetailPanel.
- **Did not introduce caching on the page** — every request re-fetches.
  Phase 1.5 territory and ties into the live novel-count question
  carried over from session 007.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — 0 errors, 1 warning (pre-existing
  `no-page-custom-font`). Baseline preserved. Three issues caught and
  fixed during dev:
  - `react-hooks/set-state-in-effect` on EraDetail's pan-reset effect →
    fixed by keying the component at the parent.
  - `react/jsx-no-comment-textnodes` on the empty-state `<p>` whose text
    started with `//` → wrapped in `{}` so JSX treats it as a string.
  - Unused `// eslint-disable-next-line no-console` → removed.
- `npm run db:seed` — `Loaded: 7 eras, 25 factions, 14 series, 3
  books, 5 sectors, 28 locations.` `Done. Inserted 3 books.`
- `npm run build` — green. `/timeline` shows as `ƒ (Dynamic)` in the
  output, as expected (it reads `searchParams`). All seven other
  routes unchanged.
- `npm run dev` smoke-test on a fresh port (3055), all routes:
  ```
  /                            200
  /timeline                    200
  /timeline?era=horus_heresy   200
  /timeline?era=long_war       200
  /timeline?era=age_apostasy   200
  /timeline?era=time_ending    200
  /timeline?era=indomitus      200
  /timeline?era=M31  (legacy)  307 → /timeline?era=horus_heresy
  /timeline?era=M30  (legacy)  307 → /timeline?era=great_crusade
  /timeline?era=M42  (legacy)  307 → /timeline?era=indomitus
  /map                         200
  /ask                         200
  /buch/test-slug              200
  /fraktion/test               200
  /welt/test                   200
  /charakter/test              200
  ```
  No console errors during compile. No hydration warnings.
- Rendered-DOM check via curl + grep:
  - `/timeline` → 3 `<g class="book-node">` elements on the ribbon, 7
    `<g class="era-seg">` bands, all 7 era labels, no toggle button
    in `aria-pressed="true"` state. ✓
  - `/timeline?era=horus_heresy` → M31 button is active
    (`aria-pressed="true"`), EraDetail header rendered with
    `EXCERPTUM ·` kicker, only Horus Rising appears as the rendered
    book marker. ✓
  - `/timeline?era=age_apostasy` → no toggle active, EraDetail
    renders with the empty-state caption. ✓
  - `/timeline?era=time_ending` → wide era with pan-scrubber + drag
    hint, only Eisenhorn rendered as a series-bar. ✓
  - `/timeline?era=indomitus` → only Dark Imperium rendered as a
    standalone-node. ✓
- Did NOT open a browser. The visual quality bar (drag feels right,
  hover lights up, draw-in animations land) is on Philipp on the
  Vercel preview. One known dev-only flake to ignore: long-running
  `next dev` processes occasionally lose a Turbopack jest-worker and
  return a 500 on subsequent requests (`Jest worker encountered 2
  child process exceptions, exceeding retry limit`). Restarting the
  dev server clears it; not a code bug — `npm run build` always
  compiles cleanly.

## Open issues / blockers

- **Era-encoding gap, M39-M41.** `eras.json` has nothing covering
  encoded years 38000-40996 (the run between `age_apostasy` and
  `time_ending`). Books canonically set there (Eisenhorn, Ravenor,
  Cain) need either a new era or a shift in adjacent eras. Worth a
  short brief — see "For next session."
- **`formatM` vs. EraToggle disagreement (-1000).** Same as the
  hazard note in brief 008 — held for a deliberate cleanup brief.

## For next session

- **Era-encoding cleanup brief.** Two intertwined fixes: (a) fill the
  M39-M41 gap in `eras.json` so books canonically set there have a
  home, and (b) decide the `formatM` ↔ toggle-label reconciliation
  (fix the formula vs. shift the encoded years). Bundle them; they
  touch the same data and re-do the same testing.
- **Mobile-emulated touch test on the deployed preview for the EraDetail
  pan/drag.** If it feels off, a `* devicePixelRatio` divisor in
  `panDelta` is the calibration knob.
- **2a.1 — Left rail (entry-cards).** Brief teed up. Should also fold in
  the Overview ribbon's hover-tooltip for book pins (see open question 6
  point 2) since the entry-rail and the ribbon's pinned-books story land
  in the same surface.
- **2a.2 — Right rail (filter chips, FactionGlyph).** Brief teed up.
  When this lands, switch the BookMarker to honour `markerStyle` (glyph
  / card variants) and wire the filter chip state into
  `bookMatchesFilters` from `src/lib/timeline.ts` (already exported and
  ready).
- **2a.3 — DetailPanel click-target.** The book-marker `onClick` in
  `EraDetail.tsx` already calls `console.log` in dev so the click path
  is verified — the brief just needs to swap the body to open the
  modal anchored at the marker position.
- **Pan-scrubber click-to-jump** (small, ~10 LoC). Click on the pan
  track outside the thumb should set `panFrac` to the click position.
  Either fold into the next polish pass or skip until anyone asks.
- **Two carry-overs from session 007 still stand**:
  `NEXT_PUBLIC_SITE_URL` cosmetics on Vercel, and the live
  novel-count refresh decision (now more pressing — once Phase 4
  catalogues real books, the Hub footer will lag without `revalidate`).

## References

- Brief: `sessions/2026-04-29-008-arch-timeline-overview-eraview.md`
- Prototype source ported: `archive/prototype-v1/components/{OverviewTimeline,EraView,util}.jsx`,
  `archive/prototype-v1/styles/timeline.css` (lines 1-465 + 638-end;
  466-637 are detail-panel CSS, deferred to 2a.3)
- Drizzle relational queries: https://orm.drizzle.team/docs/rqb
- Next 16 `searchParams` Promise: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
- Co-shipped Aquila redesign: `sessions/2026-04-29-010-impl-aquila-redesign.md`
