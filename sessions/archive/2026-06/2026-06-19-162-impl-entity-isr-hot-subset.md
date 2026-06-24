---
session: 2026-06-19-162
role: implementer
date: 2026-06-19
status: complete
slug: entity-isr-hot-subset
parent: 2026-06-19-162
links: []
commits: []
---

# Entity-Detailseiten — heiße Teilmenge prerendern, Rest on-demand ISR (Build-Egress senken)

## Summary

The four entity routes now build-prerender only a curated **96-id hot subset** (was ~1300) and serve the long tail via on-demand ISR with a 24 h backstop; `POST /api/revalidate` now also `revalidatePath`s the four dynamic segments so post-apply data is fresh on next request. The one fact worth knowing: the local build dropped 1300→96 entity prerenders (egress goal met) but still took **15.1 min**, dominated by 300 s-timeout retries on a few heavy pages — *not* by the entity count (detail in Verification).

## What I did

- `src/lib/entity/hot-subset.ts` (new) — pure curated constant `HOT_ENTITY_IDS` per type: 30 characters (the 18 primarchs reused from `CURATED_PRIMARCH_IDS` + 12 marquee leads), 39 factions, 13 worlds, 14 authors = **96 ids**. No `@/db` import; every id verified against `scripts/seed-data/*`.
- `src/lib/entity/loader.ts` — added `listHotEntityIds(type)`: one ID-only `where id in (HOT_ENTITY_IDS[type])` select per type (≤ a few dozen ids), never a `loadEntity` fanout; same `try/catch → []` DB-unreachable fallback as `listEntityIds`.
- `src/app/{charakter,welt,fraktion,person}/[slug]/page.tsx` — `generateStaticParams` now calls `listHotEntityIds` instead of `listEntityIds`; `dynamicParams = true` retained; added explicit `export const revalidate = 86400` (24 h) to each. No render/markup change.
- `src/app/api/revalidate/route.ts` — now also `revalidatePath('/<route>/[slug]', 'page')` for all four entity routes after the `revalidateTag` loop; doc comment + response (`paths`) updated.

## Decisions I made

- **Hot subset = curated constant filtered by a build-time ID-only existence query**, not a "top-N by link count" query. Reasons: (1) a curated list directly encodes *what a Reddit-launch visitor clicks first* (primarchs, famous Legions + their traitor twins, major institutions, bedrock worlds, marquee BL authors) — exactly the brief's intent — whereas "most-linked" only correlates with it; (2) the constant itself costs **zero** build DB reads, the leanest possible param path; (3) the existence filter keeps it **self-healing** — a curated id later renamed/merged away is simply dropped (route serves it on-demand) instead of build-prerendering a 404, honoring the "no silent failure" ethos. The query stays strictly **ID-only** (`select id … where id in (…)`, ≤ a few dozen ids, ~kilobytes), four orders of magnitude below the ~1300 full-entity reads removed — so it does not reintroduce the egress it eliminates. The constant supplies editorial intent (what is *eligible* to be hot); the query supplies truth (what currently *exists*). At this build **all 96 ids resolved** (none dropped), confirming the seed-data verification was accurate.
- **`revalidate = 86400` (24 h)** as a literal on each route (matching the repo's existing `export const revalidate = 3600` literal style — Next requires a statically-analyzable value). It is a long *backstop*, not the refresh path: data changes ≈weekly (ingestion), real freshness comes from the `revalidatePath` invalidation below. 24 h is distinctly longer than the 1 h used on Home/podcasts, reflecting how rarely entity pages change, while bounding worst-case staleness to a day if an invalidation is ever missed.
- **`revalidatePath` purges all four entity routes on *every* `/api/revalidate` call**, not gated by the requested tags. `loadEntity` carries no `CATALOGUE_TAGS`, so `revalidateTag` never touches these pages (this is the whole reason constraint 4 exists). I took the brief's preferred direct path (`revalidatePath`) rather than refactoring `loadEntity` through a tagged `cachedRead`. Always-purge (vs. mapping tags→routes) because an entity page is cross-cutting — a character page shows works, a world page shows the books set there — so any catalogue change can alter it and there is no clean per-tag mapping. Over-purging on-demand pages is cheap: each just re-renders from the DB on its next visit.
- **Did not exclude the two heavy hot entities** (`gregor_eisenhorn`, `sandy_mitchell`) that timed out at build. They are precisely the marquee pages worth prerendering; the 300 s timeout is a build-concurrency contention artifact (≈45-way static generation vs. the `max:5` pool), not an inherent per-page cost — a single on-demand request renders them fine. Dropping them would only move the latency onto the first Reddit visitor. Left as a tunable lever if build time ever has to come first (see "For next session").
- **No version changes.** No new dependencies; `next 16.2.9` / `react 19.2.5` already pinned. `cacheComponents` left off; no `'use cache'`.

## Verification

- `npm run lint` — pass (clean).
- `npm run typecheck` (`tsc --noEmit`) — pass (clean).
- `npm run brain:lint -- --no-write` — **0 blocking** (16 pre-existing warnings, all unrelated; this change writes no `brain/` files).
- `npm run build` — exit 0. **Two sources confirm the drop:**
  - Build route list: `● /charakter/[slug] 1d 1y` `[+27 more]` = 30; `● /fraktion/[slug]` `[+36]` = 39; `● /person/[slug]` `[+11]` = 14; `● /welt/[slug]` `[+10]` = 13 — each `●` (SSG, bounded) with the long tail `ƒ` (on-demand), `1d` = the 86400 revalidate.
  - `.next/prerender-manifest.json`: **96** entity paths (charakter 30, welt 13, fraktion 39, person 14) of 106 total prerendered routes.
- **Before → after: ~1300 → 96 entity prerenders** (seed baseline 500+227+442+103 = 1272, plus ingested long-tail). Under the brief's "<100" ceiling.
- **On-demand identity (constraint 2)** — `next start` (prod), preview gate off via the documented `PREVIEW_GATE=off` kill-switch:
  - Non-hot `/charakter/fabius_bile` (NOT in subset → on-demand ISR): **HTTP 200**, `<title>Fabius Bile · Chrono Lexicanum</title>`, one `<main class="entity">`, back-link breadcrumb present.
  - Hot `/charakter/horus` (prerendered): **HTTP 200**, same frame (one `<main class="entity">`, same title pattern). The byte delta (80 KB vs 122 KB) is content volume (Horus's far larger bibliography), not structure. Identical by construction anyway: both slugs render through the same `/charakter/[slug]/page` module — there is no code branch on "was this prerendered."

### Build time — honest read

The build was **15.1 min**, not "minutes". The wall-clock is dominated by 300 s-timeout *retries* on four individually-heavy pages, all of which succeeded on retry (116/116, exit 0):
- `/` and `/archive/podcasts` — **out of scope** for this brief, heavy for other reasons (the `/archive` blob), pre-existing.
- `/charakter/gregor_eisenhorn`, `/person/sandy_mitchell` — two hot entities with huge bibliographies.

These are the `max:5` pool-contention timeouts from Report 144, surfacing under ≈45-way build concurrency + cross-Atlantic latency (local US→eu-central). The entity-count reduction (1300→96) *lowers* total build pressure and is the real egress win; it does not by itself fix the per-page contention that gates the remaining wall-clock. On Vercel's faster path to eu-central the two hot entities may not time out. **Egress goal: met. Build-time goal: partially met, bottlenecked by a separate, pre-existing issue, not the entity count.**

## Open questions (answering the brief's)

- **Source for the hot subset?** Curated constant + build-time ID-only existence filter (rationale in Decisions). Not a top-N query — the launch-click set is editorial knowledge that a link-count proxy only approximates, and the constant costs zero build reads. The build path stays genuinely ID-only: `select id … where id in (…)`, no `loadEntity`, no joins.
- **Did `revalidatePath('/<route>/[slug]','page')` behave as expected?** Implemented as the documented Next 16 dynamic-segment form; it type-checks, builds, and is the API's intended shape for purging every slug under a dynamic segment in one call. I did **not** run an end-to-end flush test (mutate DB → POST → observe fresh data) — that needs a real data mutation + the `REVALIDATE_TOKEN` against a running instance, out of practical local reach behind the auth gate. No surprise that forced a different mechanism; flag for a post-deploy smoke-check if Cowork wants empirical proof.

## Open issues / blockers

- **Renumbered 161 → 162.** `main` already had `2026-06-19-161-impl-perceived-latency-feedback.md` (#186), so per Philipp this session is **162** and this report is `2026-06-19-162-impl-entity-isr-hot-subset.md`. The arch brief on disk is still named `…-161-arch-entity-isr-hot-subset.md`; **Cowork should rename it 161 → 162** so the arc isn't split across two numbers (`parent` here already points at 162).
- The arch brief is **not on `origin/main`** yet (it lives in the coordination worktree). I could not flip its `status: open → implemented` from this strand worktree — Cowork/Philipp land (and renumber) the brief on `main` and flip it.

## For next session

- **Build-time tail is the pool-contention issue (Report 144), not the entity count.** If deploy time must drop further: lower build concurrency (`staticGenerationMaxConcurrency` is already 3; the 15-worker fan-out is the multiplier), and/or drop the heaviest hot entities to on-demand. The hot subset is a one-line edit in `hot-subset.ts`.
- `/` and `/archive/podcasts` hitting the 300 s build timeout is independent of this brief and worth its own look.
- Optional post-deploy smoke-check: mutate one entity, `POST /api/revalidate`, confirm an already-rendered long-tail entity page serves fresh data (validates the `revalidatePath` loop end-to-end).

## References

- Next.js 16 `revalidatePath` (dynamic segment + `'page'` type) and route-segment `revalidate` config.
- `src/lib/db-cache.ts` (READ_CACHE_TTL philosophy, `cacheComponents`-off rationale), `src/proxy.ts` + `src/lib/previewGate.ts` (the `PREVIEW_GATE=off` local bypass used for the spot-check).
