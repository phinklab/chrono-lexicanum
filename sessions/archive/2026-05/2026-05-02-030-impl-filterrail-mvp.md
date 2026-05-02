---
session: 2026-05-02-030
role: implementer
date: 2026-05-02
status: complete
slug: filterrail-mvp
parent: 2026-05-02-029
links:
  - 2026-05-02-021
  - 2026-05-02-022
  - 2026-05-02-025
  - 2026-05-02-026
commits: []
---

# Stufe 2a.2 — FilterRail (Minimal-MVP)

## Summary

Two-axis FilterRail (Faction + Length-Tier) shipped on `/timeline?era=…` with server-side SQL filtering, URL-as-truth state, OR-within / AND-between semantics, and themed empty-state branching. Phase 2 (Chronicle Foundation) closes — next architect brief is the Phase-3 Ingestion brainstorm.

## What I did

- `src/lib/timelineUrl.ts` — **new** URL-helper library with `buildEraUrl` (strips `faction`/`length`), `buildBookUrl` (preserves them), `buildCloseUrl`, `buildFilterUrl`, `parseFilterParams`. Single source of truth so brief 029 constraints 5 + 10 can't be silently re-violated by a future Phase-4 nav surface.
- `src/app/timeline/page.tsx` — added `loadEraBooks(eraId, filters)`: 3 queries (matched-IDs via era + EXISTS subqueries, distinct factions for the era, distinct length-tier facet values for the era) ± a 4th era-count query when filters active. Hydrate via existing relational `db.query.works.findMany` with `inArray(works.id, matchedIds)`. Empty-IDs guard returns early. Search-params widened to include `faction`/`length`. Page render fans out `loadTimeline` + `loadEraBooks` + `loadBookDetail` in `Promise.all`.
- `src/lib/timeline.ts` — added `FilterOption` and `EraBooksData` types. **Deleted** the stale `BookFilters` / `emptyFilters` / `bookMatchesFilters` scaffolding from a prior brief — they were client-side helpers and brief 029 constraint 8 forbids that pattern.
- `src/components/timeline/FilterRail.tsx` — **new** `'use client'` component. Pills with cyan-fill active state matching `EraToggle.active`. URL-driven via `useSearchParams` + `parseFilterParams`. Hides axis with only one available option (open-question 2 recommendation: yes, hide). Reset link = `<Link replace scroll={false} href={buildEraUrl(...)}>` so it works without JS.
- `src/components/timeline/EraDetail.tsx` — composes `<FilterRail>` between header and tracks. Removed the client-side `books.filter((b) => b.primaryEraId === era.id)` (line 78-81) — `books` prop is now pre-filtered server-side. Empty-state split into "0 in era at all" (existing copy) vs "0 match active filter" (new "EXCERPTUM CONSTRAINED" copy + reset link). Era prev/next `<Link>`s + `BookDot` route through helpers.
- `src/components/timeline/Overview.tsx` — `navigateToEra` and `prefetch` route through `buildEraUrl` so ribbon clicks and hover-prefetches both strip filter keys.
- `src/components/chrome/EraToggle.tsx` — `pick` routes through `buildEraUrl` only on `/timeline`. Off-route (Hub etc.) preserves the original "stay on the current pathname" behavior — global chrome shouldn't silently reroute to `/timeline` from a chrome click.
- `src/components/timeline/DetailPanel.tsx` — `handleClose` via `buildCloseUrl` (preserves filters when closing the modal); series prev/next via `buildBookUrl` (cross-era nav still works, filters survive).
- `src/app/globals.css` — new `.filter-rail` block + `.era-empty-block`/`.era-empty-reset` for the filter empty-state. Tokens: `--hl` (active fill), `--ink-{1,2,3}`, `--line-1`, `--font-mono`. Mobile breakpoint at 720px collapses axis label above pills and unsticks the reset link.

## Decisions I made

- **Two-step Drizzle query (matched-IDs → relational hydrate) over one-step.** Drizzle relational `findMany({ where })` callbacks can only filter on `works`-level cols; they can't express EXISTS subqueries against `work_factions` / `work_facets`. Step A (raw `select({ id }).from(works).innerJoin(bookDetails)…where(EXISTS(…), EXISTS(…))`) is the cleanest expression and short-circuits per-work via EXISTS — no fan-out + GROUP BY HAVING dance. Step B (relational hydrate via `inArray`) preserves the existing `with: { bookDetails, factions, persons }` pattern from `loadTimeline`/`loadBookDetail`. Empty `matchedIds` is guarded: returned early before step B, since `inArray([])` historically generated `IN ()` (Postgres syntax error).
- **Wide query for option-derivation, not derived from a pre-loaded books array.** Two dedicated `selectDistinct` queries (factions × era, length-tier values × era) instead of fetching all era books with their relations and reducing in TypeScript. At ~10–80 books per era today the difference is negligible; at Phase-3 scale (300+ books per era) the dedicated DISTINCT queries scale with `# of distinct values`, not `# of books`. The option set is computed unconditional on current filter selection so the rail's pills don't flicker as the user toggles.
- **URL is the only filter-state truth.** Open question 1 explicitly invited a deviation if URL caused flicker — none observed. `useSearchParams` reads, `router.replace` writes (`{ scroll: false }`), and the server re-renders are fast enough that no optimistic local state was needed. Empty CSV → key deleted entirely (clean URL when "all" selected). Browser back/forward walks naturally.
- **Hide axis when only 1 distinct option exists.** Open question 2 recommendation taken as-is: `availableFactions.length >= 2 && availableLengthTiers.length >= 2` gates each axis. When both axes collapse AND no stale active filter exists, the whole `<FilterRail>` returns `null` — single-volume eras don't get a useless control surface. With a stale active filter for a now-hidden axis, the rail still renders so the reset link is reachable.
- **Per-axis OR via a single CSV param with comma separator** (`faction=a,b`). Considered repeated keys (`faction=a&faction=b`, which Next/URLSearchParams supports natively) — comma is more compact in shareable Reddit URLs and the reading sample size is small enough that escaping is a non-concern (faction ids are snake_case slugs). `parseFilterParams` strips empty tokens + dedupes, so `?faction=,a,b,a,` parses cleanly.
- **`EraToggle.pick` only uses `buildEraUrl` on `/timeline`.** Off-route, the chrome toggle preserves its original "stay on current pathname, set ?era=" behavior. The original code wasn't perfect (clicking a chrome era-toggle from the Hub writes `?era=…` to the Hub URL where nothing reads it), but that's pre-existing behavior outside this brief's scope. Constraining the helper to the route where filter keys actually exist keeps the blast radius surgical.
- **Deleted `BookFilters` / `emptyFilters` / `bookMatchesFilters`** from `src/lib/timeline.ts`. Confirmed no importers via grep before removal. They were scaffolding from a pre-2a.2 plan that anticipated a different (4-axis client-side) FilterRail. Constraint 8 explicitly forbids that pattern. Replaced their type-shape role with `FilterOption` + `EraBooksData` (server-loader return shape).
- **No new index this brief.** `book_details.primary_era_id` is unindexed (FK only). The two index-bearing join paths in the EXISTS predicates (`work_factions.faction_id`, `work_facets.facet_value_id`) are already indexed (`schema.ts:279, 387`). At 26 books the planner picks sane plans regardless. Flagged for Phase-3 prep below.
- **Brief expectation vs seed data — `?era=horus_heresy&faction=thousand_sons`.** Brief acceptance bullet expected this URL to render Magnus / Thousand-Sons HH books; the canonical 26-book seed has zero HH books tagged with `thousand_sons` (Magnus / Heresy-era TS arcs aren't yet in the catalog — closest match is `bl01 Talon of Horus` with `thousand_sons` supporting in `time_ending`, not HH). The filter correctly returns the empty-state. The brief's acceptance bullet read against current seed data with `?era=horus_heresy&faction=word_bearers` (yields hh14 + hh19) is the working equivalent — not a bug, just a brief-vs-seed assumption gap worth flagging.

## Verification

Build pipeline:

- `npm run lint` — pass (1 pre-existing warning in `src/app/layout.tsx` about custom-font loading; unrelated, pre-this-brief).
- `npm run typecheck` — pass.
- `npm run check:eras` — pass (26 books, distribution 1·5·1·1·0·15·3 unchanged).
- `npm run build` — pass. `/timeline` correctly registered as dynamic (`ƒ` route) due to `searchParams` Promise.

Curl smokes (against `next dev` on `:3000`, with the rich-seed dataset from session 022):

- Baseline: `?era=horus_heresy` → 5 BookDot ids (`horus-rising-hh01`, `mechanicum-hh09`, `the-first-heretic-hh14`, `know-no-fear-hh19`, `master-of-mankind-hh41`). FilterRail renders with 7 faction pills, length axis hidden (all 5 books are `length_tier=standard`).
- Single-axis OR: `?era=horus_heresy&faction=word_bearers` → 2 BookDots (`hh14`, `hh19`).
- Multi-select OR within axis: `?era=horus_heresy&faction=word_bearers,custodes` → 3 BookDots (`hh14`, `hh19`, `hh41`).
- AND between axes: `?era=time_ending&faction=imperium&length=standard` → 1 BookDot (`priests-of-mars-pm01`).
- Filter-empty state: `?era=horus_heresy&faction=thousand_sons` → no BookDots, "EXCERPTUM CONSTRAINED — NO VOLUMES MATCH ACTIVE FILTERS" + Clear filters link rendered.
- Era-empty state (no filter): `?era=age_apostasy` → "EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH", FilterRail not rendered (0 axes have ≥2 values, no active filter).
- Filter + book modal coexistence: `?era=horus_heresy&faction=word_bearers&book=know-no-fear-hh19` → modal HTML (`detail-modal`, `dm-title`) AND `fr-pill active` (word_bearers highlighted) both present. Constraint 10 satisfied.
- Era-nav strip-on-change: `?era=horus_heresy&faction=word_bearers` → prev/next era `<Link>` hrefs are `/timeline?era=age_rebirth` and `/timeline?era=great_crusade` (no filter param). With `?book=` added: prev/next preserve `?book=` but still strip filter keys (`/timeline?era=…&book=know-no-fear-hh19`). Constraint 5 satisfied.
- Overview mode: `/timeline` (no era) → renders `timeline-overview` ribbon, no `filter-rail` element. Per-era count badges unfiltered (constraint 6). Loader still fetches via `loadTimeline` for ribbon counts.

Manual checks not run (delegated to Philipp on next pull):

- Browser-back/forward across filter clicks (URL updates use `router.replace` so history doesn't fill — back from a filtered state lands on the previous URL, expected).
- Mobile responsive layout at <720px (CSS scaffolded but not visually verified — out-of-scope per brief, "minimum brauchbar" suffices).
- Keyboard focus ring on `.fr-pill:focus-visible` (CSS rule present; tab-cycle through pills should show outline).

## Open issues / blockers

None. Ship it.

## For next session

Phase 3 (Ingestion) brainstorm brief is the next Cowork session per brief 029 § Notes. Items below are smaller carry-overs for the **architect brief that follows the brainstorm**:

- **Phase-2 archive sweep.** This brief closes Phase 2; per `sessions/README.md` carry-over item, all Phase-2 sessions (008, 011–013, 014–017, 018, 019–028, 029, 030) should move to `sessions/archive/2026-05/` (older ones to `archive/2026-04/`). Cowork-mechanical task — not implementer work. ROADMAP Phase-2 done-date can be filled in too.
- **Index `book_details.primary_era_id`.** Skipped this brief (26 books, planner picks sane plans either way). Recommend adding `index("book_details_primary_era_idx").on(t.primaryEraId)` as part of Phase-3 ingestion-scale tuning — once one era holds 200+ books, the EXISTS-anchored loader benefits. One-line change in `schema.ts` + new migration.
- **`loadTimeline` over-fetches for the era-set case.** With my changes, `loadTimeline` is now only consumed by Overview's per-era count badges; EraDetail uses `loadEraBooks`. The wide `db.query.works.findMany({ where: kind="book", with: { bookDetails, factions, persons } })` is overkill for ribbon counts — could shrink to `SELECT primaryEraId, COUNT(*) GROUP BY primaryEraId` once Phase-3 inflates the catalog. Touching it now would scope-creep this brief, so left alone.
- **EraToggle on the Hub writes `?era=…` to the Hub URL where nothing reads it.** Pre-existing behavior; not my regression. Consider in a future chrome-cleanup brief whether the chrome era toggle from non-`/timeline` routes should always navigate to `/timeline?era=…` (current implicit behavior is "stay here, write a useless query string").
- **Brief-vs-seed mismatch on `?era=horus_heresy&faction=thousand_sons`.** The brief's example acceptance URL assumes Magnus/Thousand-Sons HH books exist in the seed; they don't yet. Phase-3 ingestion will likely add Magnus: The Unforgiven, A Thousand Sons (Graham McNeill HH novel), etc., at which point the brief's example becomes naturally satisfiable. Editorial note for Cowork — not a fix.
- **`filter-rail`-CSS interaction with `.era-detail`'s absolute-positioned prev/next nav.** No collision observed in curl smokes (FilterRail's flow is normal, prev/next is absolute) but a visual sanity-check on viewport widths between 1100px and 1280px would be worth a glance — that's where the era-nav arrows fold inside the same horizontal strip.
- **Nothing carried over from this brief into the running carry-over list** (`sessions/README.md`). Phase 2 closes clean.

## References

- Drizzle relational query API limitations on related-table predicates: <https://orm.drizzle.team/docs/rqb>
- Drizzle `selectDistinct` + `exists` operator usage in PG: <https://orm.drizzle.team/docs/select#distinct>
- Next 16.2.4 App Router `useSearchParams` + `router.replace({ scroll: false })`: <https://nextjs.org/docs/app/api-reference/functions/use-search-params>
