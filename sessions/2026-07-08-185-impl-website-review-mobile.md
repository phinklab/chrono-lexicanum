---
session: 2026-07-08-185
role: implementer
date: 2026-07-08
status: complete
slug: website-review-mobile
parent: none            # maintainer-direct session (no arch brief); scope agreed with Philipp in-session
links: []
commits: []             # one PR, five commits: prune / css tokens / hygiene / mobile / polish
---

> **Status-Nachtrag 2026-07-08 (Nacht):** PR auf Philipps Anweisung vor der
> localhost-Sichtprüfung geöffnet ("öffne einen PR damit wir morgen
> weitermachen können"). Die Sichtprüfung (Checkliste unten) steht noch aus
> und ist der nächste Schritt vor dem Merge.

# Website-Review: Code-Professionalisierung, globale Typografie, Mobile-Optimierung

## Summary

Full-site pass in five phases: /lab deleted + Brief-181 dead weight pruned, a
global typography token system rolled across all CSS partials (zero visual
change, machine-verified), a comment-only "de-AI" hygiene sweep over ~210
files in src/ (verified byte-identical JS bundles), and a full mobile layer —
the map gets a bottom drawer replacing the hidden cartouche, the Chronicle
gets a perf + sheet polish, and the media player returns to phones as an
expandable stud. Desktop is pixel-identical except one sanctioned change: the
player's idle wave is now a static path with CSS opacity-breathing (rAF
suspended while paused/hidden).

## What I did

### Phase 1a — /lab deletion (Brief 181 K13/K30)
- Deleted `src/app/lab/**` (design styleguide + 4 example pages + ExampleShell
  + 2 CSS files, ~3.7k lines) and `public/lab/**` (timeline prototype).
- Deleted `src/components/chrono/AuspexSweep.tsx` (grep-verified lab-only).
- `src/proxy.ts` — removed exactly `lab/|` from the matcher; dev-server check:
  `/healthz` → 200. `eslint.config.mjs` — both stale `public/lab/*` ignores
  removed. `globals.css` — `@source not '../../public/lab'` removed.
  `next.config.ts` — stale lab-iframe rationale for `frame-src` dropped.

### Phase 1b — dead weight (Brief 181, grep-proven per item)
- `24-detail-modal.css` (494 L) deleted — zero consumers; the live overlay is
  `64-detail-modal.css`. Kills the `dmFade`/`dmRise` duplicates and the dead
  `"Newsreader"`/`--font-serif` references.
- `00-tokens.css` — legacy `--color-void-*`/`--color-aquila-*`/frost/heresy
  palettes deleted (`32-book-audit.css`'s 3 live `--color-aquila` uses moved
  to the literal `#d8b34c`, pixel-equal); compat forwards
  `--font-plex-mono/--font-cormorant/--font-reader` re-pointed (30-ingest ×6 →
  `--font-body`, CornerAuspex ×2 → `var(--font-mono)`) and deleted;
  `chronoSweep` deleted with `CornerAuspex.tsx` retargeted to the identical
  `chronoSpin`; orphaned `chronoBlink`/`chronoCursor` keyframes deleted.
- `40-primitives.css` — 12 dead classes deleted (`.font-mono`, `.font-mono-sm`,
  `.font-display`, `.font-display2`, `.font-serif`, `.c-corners`, `.c-vhair`,
  `.c-shadow-text(-sm)`, `.c-link-cyan`, `.c-blink`, `.c-cursor`); survivors:
  c-glass/c-hairline/c-pulse/c-twinkle/c-fade-in.
- `src/lib/atlas/queries.ts` → pruned from 24 exports to the 3 live ones and
  moved to `src/lib/compendium/queries.ts` (one importer updated);
  `atlas/types.ts` deleted (fully dead); `atlas/auth.ts` untouched.
- `src/app/fraktionen/filters.ts` shrunk to the one live export (`hasContent`).
- `src/lib/aliases/index.ts` — `tallyAxisDrift`/`isKnownAlias` + 3 interfaces
  deleted (production consumer died with atlas/queries); their test block in
  `scripts/test-aliases.ts` removed accordingly.
- New `src/lib/search-index.ts` — `loadUnifiedSearchIndex()` replaces the
  identical 4-loader `Promise.all` copy-pasted in Home, /archive and
  /archive/podcasts.
- `src/lib/dates.ts` — shared `shortDayMonth()` replaces the duplicated
  `DAY_MONTH` formatters (podcasts index + episode archive). The audit page's
  formatter is deliberately different (en-US, full date) and stays.
- `package.json` — `clsx` removed (zero imports); `zod` → devDependencies
  (only importer is `scripts/book-review/contract.ts`; CI installs devDeps).
- `--font-grotesk` (Brief 181 K53): already resolved before this session.

### Phase 2 — typography tokens + CSS consolidation (zero visual change)
- `00-tokens.css` `:root` extended: `--fs-label-3xs/2xs/md` (10/11/13px),
  tracking ramp `--track-04…-34` (13 steps, value-encoded names), leading
  steps `--lh-solid/-title/-prose/-prose-lg`, weight primitives
  `--fw-regular/-medium/-semibold` (role tokens re-pointed onto them), plus a
  documented breakpoint canon (640/720/900/980/1180 — no existing query moved).
- 348 value-identical swaps across 29 partials (parallel agent workflow) + the
  Chronicle unification: `--serif`/`--mono` → `var(--font-body)`/
  `var(--font-mono)` (stale 'Cormorant Garamond'/'IBM Plex Mono' fallbacks
  could never engage), scoped `--fs-mono*`/`--fs-body` mapped onto the global
  ladder, `#d8d2c2` lifted into scoped `--parchment-sel`/`--ink-on-sel`.
- Deliberately left literal: all ~40 hero `clamp()`s (only coincidental
  duplicates), half-pixel micro-tuning in 55-map/30-ingest, 14px
  (cross-voice), sub-5×-frequency values, one keyframe-animated tracking.
- **Verification**: a deterministic diff validator (scratchpad script) checked
  every changed CSS line against the swap table — zero violations; the only
  remaining table-value literal is the deliberate keyframe.

### Phase 3 — comment hygiene sweep (src/ only, English)
- Six directory-disjoint agent batches processed ~210 files: Brief/Report/PR
  citations stripped (constraints kept), section banners replaced with plain
  one-liners, warning glyphs de-decorated, German comments translated 1:1,
  trivial JSDoc trimmed, CSS partial headers rewritten as real one-liners,
  both live TODOs (rift geometry) rewritten as clean English TODOs.
- **Verification**: post-sweep build vs pre-sweep build — all JS chunk hashes
  byte-identical (minifiers strip comments, so any behavioral leak would
  change a hash). The one differing CSS chunk was proven benign: a
  comment-stripped-source comparison (HEAD vs worktree) showed zero
  unsanctioned semantic CSS lines — the delta is Tailwind's plain-text source
  scanner no longer seeing class-like tokens inside removed comments (unused
  utilities; markup unchanged). lint + tsc + 29 test suites green.

### Phase 4 — mobile
- **Shell**: `layout.tsx` exports `viewport` (device-width, viewportFit:
  cover, themeColor `#050301`). New `src/lib/useMediaQuery.ts` (SSR-safe hook
  + `useIsCoarsePointer` + cached imperative `isNarrow()`/`isCoarsePointer()`
  for per-frame code); the timeline's local hook re-exports it. SiteBrand gets
  safe-area insets ≤640px (burger already had them). /archive filter controls:
  2-column grid ≤720px, sort/chips full-width, 44px targets.
- **MediaPlayer** (`MediaPlayer.tsx` + `56-media-player.css`): rAF wave loop
  now runs only while playing AND the tab is visible; paused draws one static
  frame and CSS breathes the opacity (`mp-breathe`). Outside-close switched
  mousedown → pointerdown. Mobile: the strip folds into a 44px "vox stud"
  bottom-right that expands into a compact glass card (wave + controls; the
  playlist opens above as on desktop). New `__dock` wrapper is
  `display: contents` on desktop (zero visual change). Route dodges:
  `body.on-chron` lifts the stud above the Chronicle view toggle;
  `body.cg-on-map` moves it to the free top-left corner of the chart with the
  card opening downward.
- **Map** (`CartoucheSheet.tsx` new, `55-map.css`, root/panel/cards): ≤900px
  the hidden cartouche is replaced by a bottom drawer — collapsed dock (grip,
  seek pill, FILTERED/COURSE/LVMEN/NIHILVS badges) expanding to a sheet with
  the full vocabulary: SeekPanel, Courses, Overlays, Census. The vocabulary
  was extracted from `Cartouche.tsx` into shared `SeekPanel`/`SectionHead`/
  `CourseButtons`/`OverlayButtons` (desktop DOM unchanged; selectors extended
  via `:is(.cg-cartouche, .cg-sheet)` at equal specificity). One `<Census>`
  element feeds both surfaces (reducer stays single owner). Grip drag is a
  ~40-line Pointer-Events follow with travel thresholds; backdrop tap and
  capture-phase Escape close the sheet (before the popup's Escape). Seek hits
  and course picks collapse the sheet so the camera flight is visible.
  WorldPanel becomes a bottom-docked card (imperative `place()` early-returns
  via `isNarrow()`); CourseCards collapse into ONE docked voyage card whose
  NEXT pager flies the camera to each act. Zoomer buttons 34→44px, lifted
  above the dock; readout hidden; `backdrop-filter` disabled on map glass
  ≤900px (near-opaque gradients, pure GPU cost); pin tap halos grow to 16px on
  coarse pointers; the overture hint speaks touch verbs on touch devices.
- **Chronicle** (`CinematicView.tsx`, `ChronicleStage.tsx`,
  `67-chronicle-cinematic.css`): rail geometry moved to CSS vars
  (`--cine-sp`/`--cine-dz`, mobile 84/277.2 = the former JS ×0.6/×0.66),
  read per mount/resize — kills the SSR desktop-geometry flash and the
  `useMediaQuery` re-render path. Per-frame `--nblur` writes skipped on coarse
  pointers + CSS forces `filter: none` (animated blur was the biggest phone
  cost; depth stays via opacity/scale). The mobile dossier is now a full-bleed
  quiet sheet (gradient + gold hairline, transform-free); the LIBRARIVM shelf
  sits behind a disclosure (`MediaSegment`, mounted in the keyed subtree so it
  resets per entry; on desktop the button is inert and rows are always open).
  Touch targets: dots 44px, era-band stops widened, arrows 44px.

### Phase 5 — backlog cosmetics
- Podcast filter bar renders only for non-trivial archives
  (`episodes.length > 10 || presentKinds.length > 1`).
- Archive/podcast empty-state copy moved into the house voice.
- HomeExplore said "Five questions" — the Ask flow has four; fixed.
- `docs/ui-backlog.md` reconciled: 8 items shipped/obsoleted, one NEW item
  filed (global `:focus … outline:none !important` reset defeats every
  focus-visible override — needs a design decision, not a sweep fix).

## Decisions I made

- **Prune beyond Brief 181 where grep proved death**: the 40-primitives dead
  classes, `tallyAxisDrift` (+ its pinned test), `chronoBlink`/`chronoCursor`.
  Everything else (e.g. `ingest/[runId]`'s ~20 inline admin components) was
  deliberately left — gated admin surface, extraction is churn without value.
- **No Tailwind utilities introduced** — the house pattern is semantic global
  CSS; tokens went into `:root`, not `@theme`, so no utility surface changed.
- **Tracking tokens use value-encoded names** (`--track-20`), not semantic
  ones — the ~30-step optical ramp would make "wide/wider" a lie and invite
  drift; value names keep every swap provably identical.
- **Hero `clamp()`s stay bespoke** — only two values repeat, both coincidences
  across unrelated surfaces; tokenizing would couple what evolves separately.
- **Breakpoint canon documents, does not migrate** — moving 760→720 etc. would
  change the 721–760px band; stragglers are listed for eyeball-reviewed
  consolidation later.
- **Map drawer over pin-anchored mobile popups** — the ≤900px control surface
  is a bottom drawer (thumb-reachable, standard map UX) in the chart-table
  voice; the drag is imperative Pointer Events matching ChartStage's idiom
  rather than a scroll-snap sheet (which fights nested census scrolling).
- **Player stud dodges per route via body classes** (`on-chron` new,
  `cg-on-map` existing) — on the map it moves top-left instead of stacking
  into the bottom chrome (dock/zoomer/world card all live there).
- **The one desktop-visible change** (player idle wave static + opacity
  breathing instead of rAF amplitude breathing) is the sanctioned K23 fix —
  flagged for the localhost review.
- **zod → devDependencies, not removed** — scripts/book-review needs it; CI
  and local runs install devDeps, Vercel builds never execute scripts/.

## Verification

- `npm run lint` / `npm run typecheck` / `npm test` (29 suites) /
  `npm run check:eras` — green after every phase.
- `npm run build` — green (one transient `/page` prerender failure mid-session
  reproduced the documented DB-pooler contention and passed on retry).
- CSS phase: deterministic swap-table diff validation (zero violations);
  comment sweep: JS bundle-hash oracle (byte-identical) + comment-stripped CSS
  source comparison (zero semantic deltas).
- One dev-server check after the proxy matcher edit: `/healthz` → 200.
- Per Philipps Regel keine Headless-/curl-Sweeps — Desktop- und
  Mobile-Sichtprüfung macht Philipp auf localhost (Checkliste unten).

## Open issues / blockers

- **Gate behaviour for the former /lab paths is only observable on a Vercel
  preview** (locally the preview gate is disabled outside production) — after
  push, confirm `/lab/design` 307s to /login like any other route.
- **`src/lib/audio-tracks.ts` carries SIGNED Supabase URLs expiring ~June
  2027** (flagged during the sweep). The documented fix (public bucket,
  tokenless URLs) is still outstanding — worth a small batches-strand task.
- **Global focus-outline reset** (new ui-backlog item) — keyboard users
  currently get no focus ring anywhere; needs a design decision.
- Minor: `WerkeFilters` trusts `?sort=` without validation (cosmetic desync
  only); `buch/[slug]/audit` metadata title is still German on an
  English-labelled admin surface.

## For next session

- Consolidate the breakpoint stragglers (760/761, 820, 960) onto the canon
  with an eyeball review at 730/750/830/970px.
- Consider a dock-mounted MAG readout for the mobile map (the desktop readout
  is hidden ≤900px; magnification is currently invisible there).
- The Chronicle-Restyle (Brief 184 follow-up) can now build on the global
  ladder — 67's local palette is the last scoped system.

## Localhost review checklist (Philipp)

Desktop (≥1280px — everything should look exactly as before):
- `/` Hub, `/archive` (+ filters), `/archive/podcasts` (+ a show), `/compendium`,
  `/ask`, a `/buch/*` modal + page, a `/charakter/*` page (corner auspex still
  sweeps), `/buch/*/audit` (amber accents), `/map` (cartouche, popup, a course,
  zoomer), `/timeline` (both modes) — plus the ONE deliberate change: the
  media player's idle wave is static and breathes via opacity.

Mobile (~390px + landscape):
- `/map`: bottom drawer (tap/drag grip, seek → flight collapses the sheet,
  census toggles, course = single voyage card with NEXT flights, world tap =
  bottom card, 44px zoomer), player stud top-left.
- `/timeline`: era intro, scroll-snap rail (no blur on nodes), dossier sheet
  with LIBRARIVM disclosure, era-band arrows/stops, player stud above the
  view toggle.
- `/archive`: tidy 2-column filters; podcast show page: filter bar only on
  large archives.
- Player stud on `/`: expand card, play, playlist, volume.
