---
session: 2026-04-29-008
role: architect
date: 2026-04-29
status: implemented
slug: timeline-overview-eraview
parent: null
links:
  - 2026-04-28-005
  - 2026-04-29-006
  - 2026-04-29-007
commits:
  - 6a8230b
---

# Phase 2a slim — Overview ribbon + EraView track-view at /timeline

## Goal

Make `/timeline` render the prototype's **Overview ribbon** and the **EraView track-detail** as the first concrete consumers of the `?era=` URL param shipped by session 007. Server-fetch books / eras / series via Drizzle, render server-side, mount the two ported client components as needed.

**Slim scope**: no left-rail (entry-cards), no right-rail (filter chips), no DetailPanel modal — those land as 2a.1, 2a.2, 2a.3 follow-up briefs after this one ships and gets eyeballed. This brief also reconciles the `?era=` URL contract between TopChrome's millennium toggle and the EraView's era-selection (decision below) and adds a minimal 2-3 book fixture so the Timeline has something to render today.

## Design freedom — read before everything else

You have the **frontend-design skill** installed for this brief. Use it. The aesthetic decisions — era treatment (bands vs. illuminated, hover treatment, divider styling), glitch filter intensity (or whether to keep it at all), book-pin appearance (halo size, dot weight, hover accent), pan-scrubber chrome, axis-tick typography and density, empty-state caption styling, prev/next era-nav arrow treatment, series-bar visual, track stagger timings, ribbon draw-in animation curve — are **yours to make**. This brief is intentionally underspecified at the visual level: I describe *what should exist* and *what feeling to land on*, not which Tailwind class or which `oklch` value to put where.

What this means concretely:
- I'll tell you "Overview's ribbon sits at the right vertical position relative to TopChrome." I will *not* tell you `margin-top: 180px`. The prototype's `timeline.css` has values you can lift, but feel free to recalibrate against the real chrome shipped in 007.
- I'll tell you "EraDetail handles wide eras with pan/drag." I will *not* prescribe scrubber height, thumb opacity, or drag-resistance values. Match the prototype's intent; calibrate by eye.
- I'll tell you "the dot BookMarker variant only." I will *not* prescribe its radius, halo blur, hover-stroke, or dim-state opacity. Pick what reads as a luminous pin against the painterly background, not a CSS-default circle.
- I'll tell you "era band-or-illuminated treatment, your pick." If you pick illuminated and want to evolve the prototype's `◆` end-cap into something more ornament-like, do it. Or not.

Reference points (look at these before designing):
- **Prototype timeline visuals** — `archive/prototype-v1/styles/timeline.css` (most of the vocabulary). Don't transcribe blindly; port the *language*.
- **Prototype timeline components** — `OverviewTimeline.jsx`, `EraView.jsx`, `util.jsx`. These show structure and intent.
- **Already-shipped chrome** — `src/app/globals.css` `/* ===== Hub ===== */` and `/* ===== Chrome ===== */` blocks (session 007). Whatever Timeline visual you ship has to coexist with those — same painterly oklch palette, same grimdark-cogitator voice. If the Timeline reads in a different visual dialect than the Hub, something's off.
- **Prototype screenshots** — `archive/prototype-v1/screenshots/` if any cover the timeline view.

The aesthetic to land on (same as session 006's framing, applied to the Timeline surface): **grimdark archival cogitator**. Painterly oklch accents, restrained luminance, terminal-mono kickers, serif headlines, 0% glassmorphism, 0% neon, 0% flat-modern startup-page. The Timeline is a deeper interior of the same archive whose Hub you styled in 007 — same texture, more density.

The architectural constraints below are **non-negotiable** — they describe scope, integration, data flow, and what the rest of the codebase expects. Everything between those constraints is your call.

## Context

### What's true today

- `/timeline` (`src/app/timeline/page.tsx`) is a placeholder route showing a "Phase 2 / Chronicle" stub.
- The prototype's Timeline tooling is split across these files in `archive/prototype-v1/`:
  - `components/OverviewTimeline.jsx` (~250 lines) — the zoomed-out SVG ribbon spanning all eras, with era bands/illuminated treatments, era labels, book-pin nodes, and a glitch hover effect.
  - `components/EraView.jsx` (~380 lines) — the zoomed-in track-detail. Pan/drag for wide eras, track-packing for series-bars, temporal clustering of standalone books with expandable fly-outs, prev/next era nav, axis ticks, BookMarker (`dot` / `glyph` / `card` variants).
  - `components/util.jsx` (~80 lines) — `projectY` (segmented ribbon projection with dampened power curve so short-but-busy eras like Heresy aren't crushed against long-but-empty ones like Long War), `bookMatchesFilters`, `cn`, `TIMELINE_MIN/MAX/SPAN`, `hash`.
  - `styles/timeline.css` (~900 lines) — most timeline visuals.
- `scripts/seed-data/books.json` is `[]`. Reference tables (eras, factions, series) are populated. Phase 4 ingestion is far off; this brief adds a tiny dev fixture so the Timeline produces something to render on Vercel.
- TopChrome's `<EraToggle>` shipped in session 007, writing `?era=M30 | M31 | M42` to the URL. It has had no consumer; this brief is the consumer.

### URL contract decision (Philipp + Cowork, this session)

We **conflate** the millennium toggle's `?era=` with the prototype's era IDs. The mapping:

| Toggle button (visible label) | URL value written |
|---|---|
| M30 | `?era=great_crusade` |
| M31 | `?era=horus_heresy` |
| M42 | `?era=indomitus` |

The four non-canonical eras (`age_rebirth`, `long_war`, `age_apostasy`, `time_ending`) are reachable by clicking the Overview ribbon directly; they don't have a TopChrome toggle button.

This means **`<EraToggle>` is modified as part of this brief**: the URL value written by each button switches from `M30/M31/M42` to the mapped era ID. The visible button labels (M30, M31, M42) stay the same — those are user-facing nomenclature. The toggle highlights the button whose mapped era matches `?era=`; on other pages or with `?era=` set to one of the four non-canonical eras, **no** button is highlighted (button states: active / inactive — no third "indeterminate" state needed).

### What's in scope

1. The `?era=` URL contract migration above.
2. Port `OverviewTimeline.jsx` → `src/components/timeline/Overview.tsx` (client component; prop-driven; consumes data from a server parent).
3. Port `EraView.jsx` → `src/components/timeline/EraDetail.tsx` (client component; same pattern).
4. Port the projection helper + match-filter helper into `src/lib/timeline.ts` (TypeScript-ified, exported as named functions). Define shared interfaces (`Era`, `Book`, `Series`) here too unless a `src/lib/types.ts` reads cleaner.
5. Port the **timeline-relevant slices** of `archive/prototype-v1/styles/timeline.css` into wherever you decide stylesheet code lives this round (see Open Question 1). The detail-panel CSS at lines 466–637 is **out of scope** for this brief.
6. Update `src/app/timeline/page.tsx` to be a Server Component that:
   - Reads `searchParams.era`.
   - If `era` is undefined or matches a known prototype era ID: server-fetches books (ordered by `startY`), eras, series via Drizzle, then renders Overview (no era set) or EraDetail (era set).
   - If `era` is `M30`/`M31`/`M42` (legacy values from session 007's toggle): redirects to the conflated era ID via `next/navigation`'s `redirect()`. Old toggle URLs continue to work.
   - If `era` is unrecognised: treats as undefined (renders Overview). No 404 — that's premature.
   - Renders an empty-state banner if the books query returns 0 rows.
7. Add a **minimal 2–3 book dev fixture** to `scripts/seed-data/books.json`. Span at least two eras; at least one book in a series so the series-bar packing has something to do. Suggested set:
   - **Horus Rising** — Dan Abnett — `horus_heresy_main` series, index 1 — `startY` ≈ 30998, `endY` ≈ 30998 — factions: `sons_of_horus`.
   - **Eisenhorn: Xenos** — Dan Abnett — `eisenhorn` series, index 1 — `startY` ≈ 38400, `endY` ≈ 38420 — factions: `inquisition`.
   - **Dark Imperium** — Guy Haley — standalone — `startY` ≈ 42030, `endY` ≈ 42040 — factions: `ultramarines`.

   Verify dates against Lexicanum if you can; if uncertain on a date, pick a plausible value and flag in your report. **The fixture is a temporary dev aid**; real curation is a separate task before Reddit launch.

### What's out of scope

- Left-rail entry-cards (`.leftrail`, `.entry-card` from prototype `base.css` 294+). 2a.1 brief.
- Right-rail filter chips, character autocomplete, active-chip tray (`FilterRail.jsx`, `.chip` from `base.css` 392+). 2a.2 brief.
- Book DetailPanel modal (`DetailPanel.jsx`, `detail-modal.css`, the detail-panel CSS at lines 466–637 of prototype `timeline.css`). 2a.3 brief.
- `FactionGlyph.jsx`. Used by EraView's `glyph` BookMarker variant — but for this brief, ship EraView with the **`dot` BookMarker variant only** (the simplest of the three; no FactionGlyph dependency). The other variants land alongside FactionGlyph in 2a.2.
- Click-on-book interactivity. In this brief, clicking a book pin on Overview or a marker in EraView is a no-op — wire the `onSelectBook` handler so 2a.3's DetailPanel slots in cleanly later, but its implementation is `() => {}` for now (or a `console.log` so dev can verify the click reaches; your call).
- The prototype's "scan-line reveal" zoom transition between Overview and EraView (`timeline.css` 22–88). It's a navigation animation we can revisit when the rails land. For now, navigation between Overview and EraView is a plain Next route transition (the URL `?era=` flips, the page re-renders). Skip the scan-line.
- Prototype's `eraTreatment` config (bands vs illuminated). **Pick one** for this brief — your call which. The prototype's `clusterStyle` / `markerStyle` / `orientation` config knobs collapse to the minimal viable values (no cluster tags this brief; dot markers only; horizontal axis). These knobs become user-facing in a later polish brief — or never; we can decide on view.
- Migrating to `clsx`. We already have it (`package.json` deps). Use `clsx` directly; don't port the prototype's hand-rolled `cn`.
- The prototype's `pan-scrubber` UI for wide eras. **Keep the pan/drag interaction itself** in EraDetail (it's how wide eras like Long War or Age of Apostasy become readable), but the visible scrubber-and-thumb chrome above it can be a thinner / simpler treatment. Your call on visual.
- Tests. We don't have a test harness yet; this brief doesn't introduce one.

## Constraints

- **Server Component default.** `/timeline/page.tsx` stays server. Only `Overview.tsx` and `EraDetail.tsx` are `'use client'`.
- **All DB access from server code.** `src/db/client.ts` must NOT be imported into the client components. The page server-fetches and passes data props.
- **Async params + searchParams in Next 16.** `params` and `searchParams` are Promises. Always `await`.
- **TypeScript strict, no `any`.** The prototype's untyped JSX needs explicit types: define `Era`, `Book`, `Series` interfaces (or import from `src/lib/types.ts` you create). Books from Drizzle have `startY` / `endY` as `string` (numeric column) — coerce to number in the adapter that prepares props for the client components, not inside them.
- **`projectY` is the source-of-truth segmented projection.** Don't simplify it to linear. The dampened-power curve (`Math.pow(span, 0.22)`) is what makes the Heresy era visible without crushing the Long War; preserve the math. Replace its `window.ERAS` lazy-build with a pure-function form taking `eras` as an argument (or a closure factory).
- **`prefers-reduced-motion`** respected by everything ported. The existing `globals.css` reduced-motion block (lines 131-139) covers blanket transitions; verify ribbon draw-in, era band hover, glitch filter, marker fade-in, and pan/drag all behave reasonably with it on. Glitch filter is the most obvious offender — gate behind a non-reduced-motion guard.
- **Empty state matters.** With 2-3 fixture books only, most eras will be empty. EraDetail for an empty era should render the era header + tone + axis but show an empty-state caption (copy your call — voice should match the rest of the cogitator-terminal nomenclature) instead of an empty track region. Overview should still draw the ribbon + all 7 era labels even with 0 books — the ribbon isn't conditional on books.
- **No regression on the Hub.** The Hub's chrome and styling don't change. If a CSS change made for the Timeline cascades onto the Hub, that's a fix-up cost on this brief.
- **No regression on the stub routes.** `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` continue to render their existing stubs underneath the chrome.
- **No version bumps.** Same out-of-scope rule as recent briefs. Drizzle, postgres-js, Next, React, Tailwind, ESLint stay where session 007 left them.

## Acceptance

The session is done when all of these are true.

**URL contract:**

- [ ] `<EraToggle>` writes `?era=great_crusade` (M30 button), `?era=horus_heresy` (M31 button), `?era=indomitus` (M42 button).
- [ ] On `/timeline?era=horus_heresy`, the M31 toggle button is in active state. Same correspondence for the other two canonical mappings.
- [ ] On `/timeline?era=age_rebirth` (a non-canonical era), no toggle button is in active state.
- [ ] Legacy `/timeline?era=M31` URLs from session 007's toggle redirect server-side to `/timeline?era=horus_heresy`. Same for the other two legacy values. (Cheap and safe — `next/navigation`'s `redirect()` from the server page when `era` matches the legacy values.)

**Overview:**

- [ ] `/timeline` (no `?era` param) renders the ported Overview SVG: ribbon spanning the full timeline, all 7 era labels positioned with the prototype's alternating above/below stagger, era band-or-illuminated treatment (your pick of one).
- [ ] Book pins on the ribbon match the fixture (2–3 dots placed at their `startY` projections). Pins are inert (click is a no-op or console.log).
- [ ] Clicking on an era band/illumination navigates to `/timeline?era={prototype-era-id}` via `useRouter().push` or `<Link>`. Page re-renders into EraDetail.

**EraDetail:**

- [ ] `/timeline?era=horus_heresy` renders the era-detail layout: era header (kicker line in cogitator-terminal voice with the M-formatted year range — copy and exact wording your call; the prototype uses `EXCERPTUM · M30.998–M31.014`), name, tone, meta stats (volumes / arcs counts), axis ticks at appropriate density, tracks for any series in this era, standalone book markers for non-series books in this era.
- [ ] EraDetail handles wide eras (Long War, Age of Rebirth) with pan/drag enabled. Narrow eras (Heresy, Indomitus) render full-width with no scrubber needed.
- [ ] BookMarker uses the `dot` variant only.
- [ ] Empty era (0 books) renders the era header + axis with a an empty-state caption (copy your call — voice should match the rest of the cogitator-terminal nomenclature) caption.
- [ ] Prev/next era arrows (`era-nav-prev`, `era-nav-next`) work — clicking navigates to the adjacent era's `?era=` URL.

**Data + fixture:**

- [ ] `scripts/seed-data/books.json` contains 2–3 fixture books per the suggestion above (or your equivalent if a date or attribution didn't survive Lexicanum verification — flag in report). At least 2 different eras represented; at least one book in a series with `seriesIndex` set.
- [ ] `npm run db:seed` reports `Inserted 2 books.` (or 3) and `/timeline` renders them.
- [ ] Server fetch in `/timeline/page.tsx` uses Drizzle, orders by `startY`, joins enough to populate the prototype's expected book shape (`book.factions[]`, `book.series?.id` + `.order`, etc.). The fetch happens on every request (no caching this brief — Phase 1.5 territory).

**Styles:**

- [ ] Timeline-specific CSS lands wherever you decided (single block in `globals.css`, sibling `timeline.css`, or CSS modules). Decision documented in the report.
- [ ] No styles bleed onto `/`, `/map`, `/ask`, or the four `[slug]` stubs.

**Hygiene:**

- [ ] `npm run typecheck` — pass. No new `any`. No `@ts-expect-error` without an inline comment explaining what blocks the proper type.
- [ ] `npm run lint` — same baseline (`no-page-custom-font` warning still the only one).
- [ ] `npm run dev` — every route 200; Timeline interactivity smoke-tested in the dev-server console (no React errors, no hydration mismatch warnings).
- [ ] `npm run build` — green. Confirm `/timeline` is Dynamic in the build output (it reads `searchParams`) — that's expected.
- [ ] Push to `main`; Vercel preview shows Overview at `/timeline` and EraDetail at `/timeline?era=horus_heresy` rendering correctly.
- [ ] Implementer report `sessions/2026-04-29-NNN-impl-timeline-overview-eraview.md` committed; this brief flipped to `status: implemented`.

## Open questions for your report

1. **CSS organisation choice.** Did you fold timeline styles into `globals.css` (`/* ===== Timeline ===== */` block alongside Hub/Chrome), create `src/app/timeline.css` and import it, or use CSS modules per component? What pushed you toward that choice? Phase 2a.1/2a.2 will follow your pattern — set the precedent thoughtfully.
2. **Era treatment pick.** Bands or illuminated — which? And: any reason to expose this as a config knob now (e.g. is it likely we'll switch?) or is the pick permanent for the slim brief?
3. **`projectY` placement and shape.** Did it land in `src/lib/timeline.ts` as the brief suggested, somewhere else, or split? The function reads `window.ERAS` in the prototype to lazily build segments — what did you replace that with given we have eras as a typed prop? Pure-function with eras-as-arg is the cleanest pattern; confirm.
4. **Fixture dates accuracy.** For each of the 2–3 books, what `startY` / `endY` did you pick and how confident are you? Bullet list. Anything you weren't sure about, flag — easier to fix now than after Phase 4 makes the fixture moot.
5. **Pan/drag UX on wide eras.** Does drag-to-pan on Long War feel right at desktop and at a mobile-emulated viewport? The prototype has it; if the prototype's interaction is too touchy or too sluggish post-port, calibrate and document the values.
6. **Anything from the prototype's Timeline you wanted to bring across but couldn't justify under "slim 2a."** A short list helps me write 2a.1 / 2a.2 / 2a.3 tighter. (DetailPanel, EntryRail, FilterRail are already on my list; I'm asking about what *isn't* already on the slim → fat trajectory.)
7. **Glitch filter on era hover.** The prototype has a fairly aggressive RGB-split glitch on era-band hover (`OverviewTimeline.jsx` ~67-90, the `glitchFilter` and `rgbSplit` SVG defs). It's a strong stylistic choice. Did you ship it as-is, dial it down, or skip? Your call; I want the reasoning.
8. **TypeScript shape for the joined book row.** What shape does Drizzle's joined `findMany` give you (book + factions[] + series?), and how did you reshape it for the components? If you ended up writing a small adapter (`adaptBookForTimeline`), worth a paragraph for 2a.1's reference.

## Notes

- **Suggested commit shape** (split however reads cleanest):
  1. *URL contract migration* — `EraToggle.tsx` (and any TopChrome bits that need following) + the redirect logic in `/timeline/page.tsx`. Tiny first commit; keeps the ?era= flip separable from the visual port.
  2. *Util port* — `src/lib/timeline.ts` with `projectY`, `bookMatchesFilters`, types. Test coverage isn't required, but a small `console.log` exercise during dev (project a sample year, sanity-check the output crosses 0..1 monotonically) saves debugging time later.
  3. *Overview component port* — `src/components/timeline/Overview.tsx` + the relevant CSS slice.
  4. *EraDetail component port* — `src/components/timeline/EraDetail.tsx` + its CSS slice.
  5. *Page wiring + fixture* — `/timeline/page.tsx` server fetch + Drizzle queries; `scripts/seed-data/books.json` fixture.

- **Drizzle relational query for the page** (illustrative, not a binding implementation):

  ```ts
  const rows = await db.query.books.findMany({
    orderBy: (b, { asc }) => [asc(b.startY)],
    with: {
      factions: { with: { faction: true } },
      series: true,
    },
  });
  ```

  Reshape into the prototype's expected `book.factions: string[]` (faction IDs) and `book.series: { id, order }` shape inside the page or a small adapter — your call.

- **Reference files to read end-to-end before starting:**
  - `archive/prototype-v1/components/OverviewTimeline.jsx`
  - `archive/prototype-v1/components/EraView.jsx`
  - `archive/prototype-v1/components/util.jsx`
  - `archive/prototype-v1/styles/timeline.css` (skip lines 466–637; that's detail-panel CSS, out of scope)
  - `src/components/chrome/EraToggle.tsx` (the file you'll be modifying)
  - `src/db/schema.ts` (so the Drizzle query matches the schema)
  - Sessions 006 + 007 (so the Timeline's stylistic vocabulary aligns with what's already shipped)

- **Phase 2a follow-ups already pre-planned** (so don't try to fold them in):
  - **2a.1** — port `EntryRail.jsx` and `.leftrail/.entry-card` CSS. Adds the curated entry-points left-rail.
  - **2a.2** — port `FilterRail.jsx`, `FactionGlyph.jsx`, and `.chip` CSS. Adds filtering, plus the `glyph` and `card` BookMarker variants.
  - **2a.3** — port `DetailPanel.jsx` and `detail-modal.css`. Adds the book pop-out modal and wires the click handler.

- **Once this lands, both carry-over items in `sessions/README.md` stay** — they're either Philipp-side (Vercel `NEXT_PUBLIC_SITE_URL`) or wait-for-Phase-4 (live novel count). No carry-over additions or prunes anticipated from this brief.

- **The Aquila redesign brief (2026-04-29-009) is a parallel small commit.** It lives in a different surface entirely (`src/components/Aquila.tsx` + the Hub) and won't conflict with anything in this brief. Pick whichever order reads better when you sit down.

- **Hazard — formatM vs. toggle labels disagree by 1.** The prototype's `formatM(absYear)` (in `archive/prototype-v1/data/books.js` lines 507-512) computes `m = Math.floor(absYear / 1000) + 1`, so e.g. `formatM(30998) = "M31.998"` and `formatM(42000) = "M43.000"`. But TopChrome's `<EraToggle>` button labels are `M30 / M31 / M42` (Warhammer-canon shorthand). Under the prototype's formula, the great_crusade / horus_heresy / indomitus eras render as M31 / M31.998–M32 / M43 — which doesn't match the M30 / M31 / M42 toggle. **Don't try to reconcile this in this brief.** Port `formatM` as-is (so the era-kicker shows what the prototype showed) and ship the toggle labels unchanged (they match how Warhammer fans speak about the eras). Flag it in your report's "For next session" so we can plan a single deliberate clean-up brief — that brief will decide whether `formatM` is wrong, the encoded `start`/`end` values are off by 1000, or the toggle labels need re-namespacing. Whichever way we land, fixing it in isolation from the timeline visual port is the right move.
