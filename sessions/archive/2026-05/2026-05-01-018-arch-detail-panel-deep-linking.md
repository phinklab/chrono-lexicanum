---
session: 2026-05-01-018
role: architect
date: 2026-05-01
status: open
slug: detail-panel-deep-linking
parent: 2026-04-30-013
links:
  - 2026-04-29-008
  - 2026-04-29-011
  - 2026-04-30-012
  - 2026-04-30-013
commits: []
---

# Phase 2a.3 — DetailPanel + Deep-Linking

## Goal

Make a click on a book in `EraDetail` open a DetailPanel with the book's full metadata (synopsis, factions, characters, series-nav, dates, external links), and turn the URL into a shareable deep-link of the shape `?era=<era_id>&book=<slug>`. Browser back closes the panel without re-fetching the era. Direct hits on `?book=<slug>` (with or without `?era=`) resolve to the right `era_id` server-side and render the panel open over EraDetail.

This closes the slim → fat trajectory teed up in sessions 008 / 011 / 012 / 013: clicks on `BookDot` already log "[EraDetail] book click: …" — this brief swaps the body to open the panel.

## Design freedom — read before everything else

You have the **frontend-design skill** installed for this brief. Use it. The aesthetic decisions for the panel — exact two-column proportions, cover-placeholder treatment, opening animation timing and curve, backdrop blur intensity, kicker typography sizing, button-vocabulary, hover micro-animations, focus indicator on the close button, the "no cover yet" placeholder copy, the order/Goodreads CTA visual treatment, the series-volume nav button shape, the metadata-grid layout, the tag chip styling — are **yours to make**. This brief is intentionally underspecified at the visual level: I describe *what should exist* and *what feeling to land on*, not which Tailwind class to put where.

What this means concretely:

- I'll tell you "DetailPanel is a centered hero modal with a backdrop dimmer." I will *not* tell you `width: 880px, max-height: 86vh, border-radius: 0, backdrop-filter: blur(14px), opacity 0 → 1 over 320ms cubic-bezier(.2,.8,.2,1)`. That's design work.
- I'll tell you "the Order CTA is the visual centre of the cover column and reads as the primary action." I will *not* prescribe a colour or icon. Choose based on the established cogitator vocabulary.
- I'll tell you "panel-open transition lifts and sharpens, panel-close releases" — I will *not* prescribe `translateY(8px)` or `380ms`. Calibrate by eye against the buzzy-glitch hover from session 013 so the page feels coherent.

Reference points (look at these before designing):

- **Prototype panel** — `archive/prototype-v1/components/DetailPanel.jsx` (the actual ported file — full-screen hero modal with cover-left + meta-right, ESC-close, backdrop dimmer). This is the **shape we're porting**.
- **Prototype CSS for `.detail-modal` / `.dm-*` classes** — `archive/prototype-v1/styles/detail-modal.css` (the whole file). The `.detail-panel` / `.dp-*` classes in `archive/prototype-v1/styles/timeline.css` lines 466-637 are an *earlier* anchored-to-marker variant that the prototype no longer uses — **don't port that one**, port `detail-modal.css`.
- **Existing globals.css Timeline block** — `src/app/globals.css` (the `/* ===== Timeline ===== */` section that 011 + 013 added). The DetailPanel CSS may live in that same block or in its own labelled block; your call (open question 1).
- **Hub-vocabulary touchpoints** — the corner-bracket pattern from `.mt-corner` (Hub tiles), the `:focus-visible` corner brackets on `.era-seg-brackets` (session 013). These set the project's "you're focused on this" / "this is a hit-target" vocabulary; the panel's close button and the volume-nav arrows should rhyme with that vocabulary, not invent their own.
- **Buzzy / glitchy band hover** — `src/components/timeline/Overview.tsx` + the `eraGlitch` filter in `globals.css`. The panel-opening transition shouldn't compete with that effect; calibrate so the page-level vocabulary stays "the cogitator is reading you back," not "the cogitator stutters at every interaction."

The aesthetic to land on (in case the prototype obscures it): **grimdark archival cogitator viewing a single dossier**. The panel reads as a record being pulled and projected — restrained glow, painterly oklch surfaces, terminal-mono kickers and labels, serif title and synopsis. 0% glassmorphism (a `backdrop-filter: blur(...)` is fine on the dimmer backdrop, but the panel itself is opaque cogitator-glass, not frosted). 0% material-design shadow stacks. 0% rounded corners. If a design choice you're considering would feel at home on a 2026 SaaS product detail modal, it's probably wrong for this archive.

The architectural constraints below are **non-negotiable**. Everything between those constraints is your call.

## Context

Sessions 008 / 011 / 012 / 013 shipped the slim Chronicle: Overview ribbon at `/timeline`, EraDetail at `/timeline?era=<era_id>`, buzzy-band hover, count badges, themed focus brackets. The 3-book fixture (Horus Rising, Eisenhorn: Xenos, Dark Imperium) is wired through Drizzle and verified. `BookDot` in `EraDetail.tsx` (lines 400-423) already calls a click handler — currently it just `console.log`s in dev. The prototype's DetailPanel is unported.

Server/client situation today:

- `src/app/timeline/page.tsx` is a server component that awaits `searchParams`, fetches eras + series + books via Drizzle, and renders either `<Overview>` or `<EraDetail key={era.id}>`. Books pass through the slim `TimelineBook` shape (`src/lib/timeline.ts`): id, slug, title, author, startY, endY, factions (id-only), series (id + order). Synopsis, characters, pubYear, external links, subtitle — none are loaded yet.
- `EraDetail.tsx` is a client component that handles its own pan/drag state; remounts on era change via the parent's `key={era.id}`.
- `Overview.tsx` is a client component but its book pins were removed in 013 — only era count-badges remain. **Do not re-introduce ribbon-level book clicks.** The DetailPanel is reachable from EraDetail's BookDots only this brief.

Schema is ready: `src/db/schema.ts` already has `synopsis`, `subtitle`, `pubYear`, `coverUrl`, `goodreadsUrl`, `lexicanumUrl`, `blackLibraryUrl`, `isbn13` on `books`, the `bookCharacters` join table, and `series.totalPlanned`. No migration in this brief.

Repo and CI: `phinklab/chrono-lexicanum` (post-transfer), main is up to date as of session 017's merge. The Required-Status-Check `ci / lint-and-typecheck` is the gate. PR-flow as established in 014/015/017.

## Constraints

### URL contract

- The canonical shape when a book is open is **`/timeline?era=<era_id>&book=<slug>`**. Both params are present, `era_id` is the era the book lives in (per the same `±5` midpoint match EraDetail uses today), `slug` is the unique `books.slug` value.
- **A direct hit on `/timeline?book=<slug>` (no `?era=`) must resolve.** Server-side: look up the book by slug, derive the era from its midpoint, and **server-redirect** (`redirect(...)`) to the canonical `?era=<era_id>&book=<slug>`. Reuse the same era-membership rule (`mid >= era.start - 5 && mid <= era.end + 5`); if the book falls outside every era's leak window, redirect to `?era=<id-of-the-nearest-era>&book=<slug>`. If the slug doesn't exist, redirect to `/timeline` (no 404 — premature; keeps shared-but-stale links alive after a slug rename in Phase 4).
- A direct hit on `/timeline?era=<era_id>&book=<unknown_slug>` strips the `?book=` param via redirect to `/timeline?era=<era_id>` (panel just doesn't open — same liveness reasoning).
- The legacy `?era=M30 | M31 | M42` redirect from session 011 stays. If `?book=…` is also present in a legacy hit, preserve it through the redirect.
- **Click on a `BookDot` in EraDetail navigates to the canonical URL via `router.push`** (not `replace`) so browser back closes the panel naturally. **Close on the panel** (×, ESC, backdrop click) goes back via `router.back()` if the previous history entry is the same `/timeline` route (i.e. we got here by clicking a book), else `router.push('/timeline?era=<era_id>')` to drop just the `?book=` param. **Series prev/next volume nav** uses `router.push` so each volume gets its own history entry (back walks back through them).
- Tab/Shift+Tab keyboard navigation between book dots followed by Enter/Space must also push the canonical URL.

### Server / client boundaries

- The selected-book detail fetch happens **server-side in `page.tsx`**. When `searchParams.book` is set and resolves to a real book, fetch the book's join-loaded detail (synopsis, pubYear, factions with names + alignment + tone, characters with names, series with name + totalPlanned, prev/next volume in series, external links) and pass it as a typed prop to a single `DetailPanel` client component. Don't fetch from inside the panel.
- `DetailPanel` itself is a `"use client"` component because it owns: ESC keyboard handler, backdrop click, focus trap, focus return on close, opening animation lifecycle, prev/next volume buttons (which `router.push`).
- The selected-book detail type is **separate from `TimelineBook`** — define `TimelineBookDetail` (or `BookDetail`) in `src/lib/timeline.ts` next to `TimelineBook`. The slim `TimelineBook` stays the shape `Overview` and `EraDetail` consume; only the page passes the heavier `BookDetail` to `<DetailPanel>`.
- The page composes `<EraDetail …>` and `<DetailPanel …>` as siblings in the layout — EraDetail keeps rendering underneath (and stays mounted; the panel doesn't unmount the era view). `DetailPanel` returns `null` when no book is selected.

### Data shape — the new `BookDetail`

`src/lib/timeline.ts` adds (sketch — pick the exact field names you prefer, but the shape is roughly):

```ts
export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string;
  pubYear: number | null;
  startY: number;
  endY: number;
  synopsis: string | null;
  coverUrl: string | null;
  factions: Array<{ id: string; name: string; alignment: string; tone: string | null }>;
  characters: Array<{ id: string; name: string }>;
  series: {
    id: string;
    name: string;
    totalPlanned: number | null;
    /** This book's 1-based position. */
    order: number | null;
    /** Same-series book with the next-lower seriesIndex, if any. */
    prev: { slug: string; title: string; order: number | null } | null;
    /** Same-series book with the next-higher seriesIndex, if any. */
    next: { slug: string; title: string; order: number | null } | null;
  } | null;
  /** External links — null if not catalogued. */
  goodreadsUrl: string | null;
  lexicanumUrl: string | null;
  blackLibraryUrl: string | null;
  isbn13: string | null;
}
```

Server-side fetch should be **one Drizzle query for the book** (with relational `factions`, `characters`, `series` joins) plus **one query for prev/next siblings** in the same series (or zero queries if `seriesId` is null). Keep it simple — N+1 is fine at the current catalogue size.

### Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the panel title.
- ESC closes. Backdrop click closes. The × close button is reachable by keyboard and is the first natural focus stop on open (acceptable to focus the title element instead — your call as long as focus lands inside the panel on open).
- Focus trap while panel is open. On close, return focus to the BookDot that opened it (use a ref or `data-focus-return` query selector — your call).
- Volume nav buttons are real `<button>` elements (not anchors) with `aria-label` like "Previous volume" / "Next volume" because their visible label is just `◂` / `▸`.
- The opening animation must be gated by `prefers-reduced-motion`. The global `* { animation-duration: 0.001ms }` cascade rule from 011/013 covers the keyframe path; verify it covers your transition and document if you need an explicit per-component gate.
- Tab/Shift+Tab cycles within the panel only while open.

### Versions and dependencies

- **No new dependencies** for this brief. The panel is React + CSS; no portal library, no headless-UI, no animation library. If you find yourself wanting one, that's an open question for the next brief, not a unilateral install.
- **No version pins** — see `docs/agents/COWORK.md` § "Version pinning is forbidden". Stack stays where it is.

### What stays where it is

- `src/components/timeline/Overview.tsx` — book pins are gone (013), don't re-add. Ribbon click target is the era band only.
- `EraDetail.tsx` track-packing, pan/drag, prev/next era nav, axis ticks, empty-state — unchanged. Only the `BookDot` `onClick` body changes (and possibly `BookDot` learns to forward a `ref` so the close-handler can return focus, if you go that route).
- `formatM` / `formatRange` — used as-is, hazard preserved (the M-vs-encoded-year discrepancy is its own brief).
- The legacy `?era=M30|M31|M42` redirect — kept.
- The `eraGlitch` SVG filter, the focus-bracket polylines — unchanged.
- `globals.css` `:root` aliases — used as-is for the panel surfaces.

## Out of scope

- **Affiliate / Order link**: the prototype renders an Order-CTA that points to an Amazon affiliate URL with a placeholder tag (`chronolex-20`). **Do not render the Order button this brief.** Reasoning: real affiliate registration and the Goodreads/Amazon decision belong to a Phase 5+ monetisation brief; rendering a fake-CTA is a credibility hit on launch. *Do* render the Goodreads link if `goodreadsUrl` is present (it's an external reference, not commerce). Lexicanum and Black Library links: render if present.
- **"Find similar" action**: depends on FilterRail state (2a.2). Do not render the button this brief. The synopsis section is the bottom of the panel for now.
- **Cover image**: `coverUrl` will be null for the foreseeable Phase 4 stretch (we're not crawling cover images yet). Render a designed cover-placeholder treatment — the prototype's `.dm-cover-bg` + title + author + first-faction crest is the shape — but don't bake an `<img>` element with a fake URL into the markup. If `coverUrl` happens to be set later, your placeholder code path can be the also-handles-real-images version, but the rendered placeholder is what ships today.
- **Mobile / narrow-viewport behaviour**: the panel renders desktop-first. It must not crash on a narrow viewport, but the layout doesn't have to look great below ~880 px — that's a later mobile-pass brief. A `display: none` mobile-stub or a graceful single-column collapse, your choice.
- **Cluster collapse on the EraDetail standalone spine**: still queued behind Phase 4 ingestion; out of scope here (carry-over from 013 stays as carry-over).
- **EntryRail / FilterRail (2a.1, 2a.2)**: their own briefs. Do not pre-wire any filter-aware behaviour into the panel.
- **Pan-scrubber click-to-jump, mobile-touch test of EraDetail pan/drag, M39-M41 era-encoding gap, formatM ↔ toggle-label reconciliation, NEXT_PUBLIC_SITE_URL on Vercel**: all carry-overs from prior sessions, all explicitly *not* this brief.
- **Open Graph metadata for `/timeline?book=<slug>`**: deferred to Phase 3 (when `/buch/[slug]` ships, it gets the proper OG image and the timeline can fall back to a generic timeline-OG). For now, the page metadata stays the existing `title: "Chronicle — Timeline"`.
- **Schema or migration changes**: none. The schema is sufficient. If you find a missing field, surface it in your report — don't add a migration in this brief.
- **Caching / `revalidate`**: still none on this route (the Hub novel-count freshness item in carry-over stays in carry-over; that's a Phase-4 question).

## Acceptance

The session is done when:

- [ ] Clicking a `BookDot` in EraDetail opens a DetailPanel with the book's metadata, and the URL changes to `/timeline?era=<era_id>&book=<slug>` via `router.push`.
- [ ] Pressing ESC, clicking the backdrop, or clicking the × close button closes the panel and returns the URL to `/timeline?era=<era_id>` (via `router.back()` when history allows, else `router.push`). Focus returns to the BookDot that opened the panel.
- [ ] A direct visit to `/timeline?book=eisenhorn-xenos` (no `?era=`) server-redirects to `/timeline?era=time_ending&book=eisenhorn-xenos` (or the era the book actually falls in, if you tweak the fixture) and renders the panel open.
- [ ] A direct visit to `/timeline?era=horus_heresy&book=does-not-exist` redirects to `/timeline?era=horus_heresy` (panel closed). Confirmed in the report with the rendered URL after redirect.
- [ ] The panel is a `role="dialog"` with `aria-modal="true"` and a referenced `aria-labelledby`. ESC closes. Tab cycles within the panel. Focus on open lands inside the panel; focus on close returns to the originating BookDot.
- [ ] When the book has a `series` row, the panel renders the series ribbon (name + "Vol N / Total" + ◂ ▸ buttons) and the buttons `router.push` to the prev/next volume's canonical URL. With the 3-book fixture only Horus Rising has a real series row (Horus Heresy Main, totalPlanned set in seed) — verify the ribbon renders for it; for Eisenhorn and Dark Imperium it's omitted (no series).
- [ ] `npm run lint` and `npm run typecheck` pass with the same baseline (the pre-existing `no-page-custom-font` warning stays, no new warnings).
- [ ] `npm run build` is green and `/timeline` still reports as `ƒ (Dynamic)`.
- [ ] No new dependencies in `package.json`.
- [ ] PR opened against `main` on `phinklab/chrono-lexicanum`. The Required-Status-Check `ci / lint-and-typecheck` (no suffix) runs and is green. Vercel preview-URL comment lands on the PR; the panel works on the deployed preview, not just locally.
- [ ] Report documents (a) the `BookDetail` type's exact shape that shipped, (b) the file layout pick (panel CSS in `globals.css` Timeline block vs. its own file), (c) the prev/next-sibling query strategy (one query joining lead/lag, two queries, or in-memory from the timeline books prop), (d) the focus-return mechanism, (e) any animation-timing calibration notes worth a future polish-pass entry.

## Open questions

- **Panel CSS organisation.** The slim port (011) put everything Timeline-related into a labelled `/* ===== Timeline ===== */` block in `globals.css`. The DetailPanel may grow ~150-200 lines of CSS — does it stay in that block, get its own labelled `/* ===== Detail Panel ===== */` block adjacent to it, or move into a co-located `detail-panel.css` imported from the component? Pick whatever keeps the cascade legible. (011's report flagged this exact decision: "the future DetailPanel modal might warrant `detail-panel.css`".)
- **Prev/next sibling query strategy.** Three reasonable shapes: (1) one Drizzle query that fetches all same-series books and slices in JS, (2) two targeted queries with `<` / `>` on `seriesIndex` ordered + limit 1, (3) leaning on the timeline books prop already in memory and only hitting the DB for the rest of the detail. (3) is the cheapest at fixture scale but couples the detail loader to the page's other data; (1) is the simplest in code; (2) is the most scale-friendly. Pick what reads cleanest now; future ingestion at hundreds of books is not the constraint that should drive this today.
- **Focus-return mechanism.** `BookDot` is a `<div>` not a `<button>` today (the click handler is on the div). For a clean focus-return we either (a) make `BookDot` a real button (semantic upgrade — recommended if cheap), (b) keep the div but give it `tabIndex={0}` + a stable id and use `document.getElementById(...)` on close, or (c) thread a ref from EraDetail down. (a) is the right move long-term; if it touches less than ~30 lines and doesn't break the bm-tooltip CSS, do it. If it cascades, fall back to (b).
- **Animation-timing calibration vs. existing motion vocabulary.** The buzzy-glitch hover (013) is 420 ms total, the era-band hover-lit transition is 0.3s, the Hub tile rise is staggered 6-px blur (007). The panel-open should sit comfortably alongside these — not faster than the band hover (would feel jumpy) and not slower than the Hub tile rise (would feel sluggish). Pick a number, document it, and call out in the report whether it needs a polish pass once the EntryRail (2a.1) lands and the page has more competing motion.
- **`prefers-reduced-motion` granularity.** Does the global `* { animation-duration: 0.001ms !important }` cascade fully cover your panel-open transition (e.g. if you use a CSS `transition:` rather than `animation:`, the global rule doesn't apply)? Verify; if you need an explicit `@media (prefers-reduced-motion: reduce)` block, document why.
- **Did anything in the prototype's `.dm-*` vocabulary surprise you?** The `.dm-cover-bg`'s `data-era={book.era}` attribute (different background per era), the `.dm-tag-ico`'s 11-px FactionGlyph inline, the `.dm-vol-btn`'s disabled state — call out anything you intentionally diverged from and why.

## Notes

- **Prototype reference (the file you're porting):** `archive/prototype-v1/components/DetailPanel.jsx` — full hero modal, two-column layout (cover-left, meta-right), ESC handler, backdrop dimmer, series ribbon with volume nav, metadata grid, synopsis paragraph, faction tags, character tags, find-similar action (out of scope here). The component is small (~140 lines including JSX); the heavy lift is the matching CSS and the URL plumbing.
- **The `.detail-panel` / `.dp-*` classes in `archive/prototype-v1/styles/timeline.css` lines 466-637 are the WRONG reference** — they're an earlier anchored-to-marker variant that the prototype no longer uses. The active prototype uses `.detail-modal` / `.dm-*` (see `archive/prototype-v1/components/DetailPanel.jsx` and the whole file `archive/prototype-v1/styles/detail-modal.css`). If your CSS port reads `.detail-panel`, you're porting the dead variant; switch to `.detail-modal`.
- **Click path verification today (before you start coding):** run `npm run dev`, click a book in EraDetail, see the `[EraDetail] book click: <slug>` console line. That line is your starting point — it gets replaced by the `router.push` call.
- **Fixture sanity:** the 3 fixture books have known dates. Horus Rising is in horus_heresy (start of era), Eisenhorn: Xenos sits in time_ending (moved by 011 to dodge the M39-M41 encoding gap), Dark Imperium is in indomitus. Direct-link tests should hit all three.
- **Series totalPlanned** in the seed data: Horus Heresy Main is 64; Eisenhorn series is 3; Dark Imperium is 3 (or whatever the seed has — read it, don't assume). The "Vol N / M" string in the panel reads `totalPlanned` if present, else falls back to a string like `Vol N` (no denominator) — your call on the exact copy when total is missing.
- **The 1000-year `formatM` hazard still stands.** When the panel renders the in-universe date for Horus Rising it will read "M31.998" (canonically the Heresy is 005.M31, but the encoding shift makes formatM print +1000). Same hazard as the EraDetail kicker; don't fix it here, it's a separate cleanup brief. Acceptance asks you to render the date with the existing `formatRange`; don't invent a fix-on-the-fly that diverges between surfaces.
- **Suggested PR shape:** one branch, one PR. Commit shape is your call — a single "wire DetailPanel + deep-link contract" commit is fine; splitting "URL contract + redirect" from "panel UI port" is also fine if the diff reads more cleanly that way. Don't gold-plate the commit graph.
- **Branch naming:** `feat/detail-panel` or `feat/2a3-detail-panel-deep-linking` — your call, no project convention enforces it.

## References

- Brief 008 (timeline slim port): `sessions/2026-04-29-008-arch-timeline-overview-eraview.md`
- Report 011 (timeline slim port shipped): `sessions/2026-04-29-011-impl-timeline-overview-eraview.md` — § "What I deliberately did not do" → "Did not wire book-pin click to anything — `console.log` in dev only. 2a.3 wires DetailPanel."
- Brief 012 (timeline polish): `sessions/2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md`
- Report 013 (timeline polish shipped): `sessions/2026-04-30-013-impl-timeline-buzzy-hover-and-pin-scale.md` — § "For next session" → "DetailPanel click-target … the brief just needs to swap the body to open the modal anchored at the marker position" — note that "anchored at the marker position" is the *dead-variant* hint; this brief deliberately ports the **modal** variant instead, see Notes.
- Roadmap entry: `ROADMAP.md` § Phase 2a — the two unchecked items "Port `DetailPanel.jsx` for the book pop-out (2a.3)" and "URL state: `?era=horus_heresy&book=eisenhorn-xenos` deep-linkable (2a.3)" are both this brief.
- Schema: `src/db/schema.ts` — books, series, bookFactions, bookCharacters, all the columns the panel needs are already there.
- Prototype CSS (modal variant): `archive/prototype-v1/styles/detail-modal.css` (whole file).
