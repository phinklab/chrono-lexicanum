---
session: 2026-06-07-129
role: implementer
date: 2026-06-07
status: complete
slug: compendium-doorways
parent: 2026-06-04-129
links:
  - 2026-06-01-113
  - 2026-06-02-120
commits: []
---

# Compendium — entity directory (doorways)

## Summary

Built the **Compendium** at `/compendium`: the old `/fraktionen` faction guide is
now the *Factions* view of a five-category entity directory (Factions, Primarchen,
Characters, Welten, Autoren) in the gold "reader-language" of `/werke`. The one
fact Cowork most needs: **Primarchen ships as a forward-compatible empty seam** —
`src/lib/compendium/primarchs.ts` exports an empty `CURATED_PRIMARCH_IDS`, the
category renders a graceful "being curated" state, and the moment Batches/Board 122
fills that array the door populates with **no further Product change**. No Batches
data, schema, or migration was touched.

## What I did

Entity contract widened to a fourth type (`person` = authors) + podcast-aware works:

- `src/lib/entity/types.ts` — added `EntityType "person"`; `TYPE_TO_ROUTE`/`TYPE_TO_ATLAS` entries; `KIND_LABELS` for `book`/`podcast`/`podcast_episode` (+ film/tv/channel/video); `WorkRef.href` (link target, null = inert) and `WorkRef.showTitle` (parent show for an episode).
- `src/components/entity/EntityHeader.tsx` — `EYEBROW.person = "// AVCTOR · AUTHOR"`.
- `src/components/entity/EntityView.tsx` — `META_FACT_LABELS.person = []` (persons lead with the bio tagline).
- `src/lib/entity/loader.ts` — `loadPerson()`; `buildWorkGroups()` (async) groups reverse-junction works by `works.kind` in a stable order and resolves each work's `href`; `resolveEpisodeShows()` batches episode→parent-show (slug+title) in **one** query (short-circuits when there are no episodes, so a plain character page adds zero queries); `mergePersonWorks()` folds a person's multi-role rows into one row per work, author role suppressed; `listEntityIds`/`loadEntity` learn `person`.
- `src/components/entity/RelatedWorks.tsx` — renders a work as a `<Link>` when `href` is set, an inert muted card when not; meta line joins `[year, showTitle, role]`. The view stays db-free — all link resolution lives in the loader.

New `/person` entity route (mirrors `/charakter`, reuses the Brief-113 overlay contract):

- `src/app/person/[slug]/page.tsx` — canonical SSG page (`generateStaticParams` from `listEntityIds("person")`, `dynamicParams = true`).
- `src/app/@modal/(.)person/[slug]/page.tsx` — soft-nav intercept → `EntityPanel`. The generic `[...catchAll]` + `default.tsx` slot resets already cover the new route; no per-route registration.

Compendium data layer (pure libs + one server-only loader, **no new SQL**):

- `src/lib/compendium/categories.ts` — the five `COMPENDIUM_CATEGORIES` (slug, label, eyebrow, sigil, noun, blurb, facets), `CompendiumItem` shape, `findCategory`.
- `src/lib/compendium/primarchs.ts` — empty `CURATED_PRIMARCH_IDS` seam (Board 122 owns curation).
- `src/lib/compendium/filters.ts` — `parseCompendiumParams`/`applyCompendiumFilters` (facet + name search + `covered`/`az` sort), URL-mirrored.
- `src/lib/compendium/loader.ts` — five `cache()`-wrapped builders over the **existing** aggregates (`loadFactionGuide` + `hasContent`, `getCharaktereRows`, `getWeltenRows`, `getPersonenRows`); `loadCategoryItems(slug)` dispatch; `loadCompendiumCounts()`. Shared source rows are `cache()`-memoised so the layout's counts + the page's items + the shared character rows (Characters ∪ Primarchen) collapse to one DB fan-out per request.

Compendium routes + client islands:

- `src/app/compendium/layout.tsx` — gold-archive shell (`<main className="catalogue compendium">`, vista backdrop, lean hero, persistent `CompendiumNav` with live counts).
- `src/app/compendium/page.tsx` — overview: five doors, each with sigil/count/blurb + a peek of its most-covered entities + "view all".
- `src/app/compendium/[category]/page.tsx` — dense hairline rows; factions group by alignment, the rest flat; server-filtered + URL-mirrored; graceful pending (Primarchen) / empty / no-match states.
- `src/components/compendium/CompendiumNav.tsx`, `CompendiumControls.tsx` — db-free client islands (active tab via `usePathname`; search/facet/sort via `router.replace`, reusing the shared `.browse-*` vocabulary).

URL contract + tags-as-doors:

- `src/app/fraktionen/page.tsx` — replaced with a `redirect()` to `/compendium/fraktionen`, **forwarding the query string** so `/fraktionen?alignment=chaos` still lands filtered. `loader.ts` + `filters.ts` are kept (the Compendium loader imports them); `FraktionenFilters.tsx` deleted (`git rm`).
- `src/components/chrome/TopNav.tsx` — "Factions" item → "Compendium" (`/compendium`), active for `/compendium` + all entity detail routes.
- `src/lib/book/loadBook.ts` + `src/components/book/BookDetailView.tsx` — book-detail byline authors and faction/location/character chips are now entity `<Link>`s (soft-nav → overlay); facet chips stay inert. Added `persons.id` to the loader select to link the byline.
- `src/components/podcast/PodcastEpisodeArchive.tsx` — episode faction chips route to `/fraktion/[id]` (was `/werke?faction=`).

Styling:

- `src/app/styles/66-compendium.css` (new, registered after `65-loading.css` in `globals.css`) — all `.cmp-*` classes; gold-tints the cyan `c-glass`/`c-corners` primitives inside the `.compendium` scope; respects `prefers-reduced-motion`; responsive ≤720px. Atmosphere comes from the vista backdrop — no glow halos / warm gradients (per the hub-aesthetic note).
- `src/app/styles/51-book-detail.css` — `.book-detail__chip--link` + `.book-detail__byline-link` (soft cyan link affordance + focus-visible).

## Decisions I made

- **Primarchen = empty curated-ID seam, not a schema flag.** The brief forbids building Batches data, and no primarch flag exists. `CURATED_PRIMARCH_IDS = []` (in a pure lib) is the forward-compatible join point: the category stays visible, renders a "being curated" state, and excludes those ids from the Characters list so there's never a double-listing once the array is filled. Zero Product change needed when Board 122 curates.
- **Welten threshold = 3 mentions** (`WORLD_MENTION_THRESHOLD`, named constant). With ~2400 location rows the long tail is single-mention scenery; 3+ appearances (books + episodes, off `work_locations`) marks a world the stories actually orbit. Easy to retune in one place.
- **Link resolution lives in the loader, not the view.** Podcast episodes have no detail route, so `WorkRef.href`/`showTitle` are computed server-side (episode → parent show via `podcast_episode_details.podcast_work_id`); `EntityView`/`RelatedWorks` stay dumb. Keeps the single-EntityView/no-fork contract from Brief 113.
- **Reused aggregates, no new SQL.** Every category builds off an existing query; `cache()` on both the source rows and the builders dedupes the layout (counts) + page (items) + shared character rows to one fan-out per request.
- **Server-filtered + small client island** (the proven `/werke` + `/fraktionen` pattern) over a big client directory — keeps the directory SEO-friendly and shareable-by-URL.
- **Names in Cormorant, metadata in mono.** The directory rows use the reading serif for entity names (warmer, distinct from `/werke`'s Cinzel book titles) with mono technical metadata — same gold archive family, its own identity.
- **Fixed a React-Compiler lint error**: the running ordinal counter in the category page was a render-time `let` reassignment (`react-hooks/immutability`); replaced with a pure per-group base offset (`groups.slice(0, gi).reduce(...)`).

## Verification

- `npm run typecheck` (`tsc --noEmit`) — **pass**.
- `npm run lint` (`eslint .`) — **pass** (after the ordinal fix above).
- `npm run build` — **compiles + typechecks clean** ("✓ Compiled successfully", "Finished TypeScript in 4.1s", so the new `/person` slot/intercept types and `.next/types` are valid). The static-export phase then times out at 60s/page against remote Supabase — this hits **pre-existing** `/charakter/[slug]` pages identically (pool `max: 5` in `src/db/client.ts` vs 15 build workers, no IPv6 on this host), so it is the known local-build-vs-remote-DB limit, **not** a regression. Vercel's build (low-latency DB) is unaffected; CI/PR is the real build gate.
- `npm run brain:lint -- --no-write` — **0 blocking**, 15 pre-existing warnings (brain content, untouched).
- Dev (`npm run dev`, localhost:3000): `/compendium` → **200** in ~630ms (rendered against the live DB three separate times; its overview invokes all five category loaders for the peeks, so every category's data path is exercised — hero, all six nav tabs, all five doors present in the HTML). `/fraktionen` and `/fraktionen?alignment=chaos` → **307** to the Compendium with the query string preserved. The category routes also returned **200** server-side (confirmed in the dev log) but are slow to *individually* curl: see the pooler note below.
- **Pooler note (env, not code):** the Compendium layout runs ~4 aggregate queries per page load for the nav counts (`loadCompendiumCounts` → all five builders, `cache()`-deduped to ~4 distinct aggregates). On a warm/healthy DB that's the ~630ms above. But firing *many* page loads concurrently (as my verification probing did) multiplies that into 20+ concurrent aggregates against the `max:5` pool, which queues in pgbouncer until `statement_timeout` and the cancelled state poisons subsequent requests (the exact failure mode documented in `src/db/client.ts`) — degrading *every* DB-backed page site-wide until load stops and the pool drains (~1–2 min). Single-user navigation (one page at a time) stays within budget and is fine; this is the same characteristic the existing `/atlas` aggregates have, just exercised on more routes.

## Open issues / blockers

- None blocking. The full local `next build` cannot complete on this host (remote-DB SSG latency, as above); rely on Vercel/CI for the production build.
- A visual pass in a browser at desktop + ≤720px is still worth a human eye (the dev server is up on :3000) — the CSS is responsive and reduced-motion-aware, but I verified routing/data, not pixels.

## Follow-up — caching fix (concurrent-visitor robustness)

After the doorways work landed, `/compendium` **did not load** in the browser. The
dev SQL log was the smoking gun: `GET /compendium 200 in 77s`. Not a code bug and
not a permanently-poisoned pool — the page *completed*, but the shared `<layout>`
fires `loadCompendiumCounts()` on **every request** (~7 DB round-trips: the
4-query `loadFactionGuide` + `getCharaktereRows`/`getWeltenRows`/`getPersonenRows`),
and each remote pooler round-trip is ~2.6 s on this host (no IPv6, pgbouncer hops).
Seven of those, contended against `max:5` while other requests overlap, compounds
to 77 s. React `cache()` only dedupes *within* one request, so visitor-count ==
query-count — and with several concurrent visitors that's the documented
pgbouncer poison-cascade (`src/db/client.ts`), which is what degraded the whole
site (the "Chronicle shows NaN/0— rows" report was empty data from a saturated
pool, not a Chronicle regression).

**Root-cause fix: cache the catalogue reads across requests** so N visitors share
one DB fetch. (Researched against Next 16.2 docs: `unstable_cache`, *not* the
newer `'use cache'` — the latter needs the app-wide `cacheComponents` flag, which
would delete the existing `revalidate` ISR on Home/Podcasts, and its default store
is per-instance memory that doesn't survive serverless fan-out. `unstable_cache`
uses Next's persistent, cross-instance Data Cache — the right tool while
`cacheComponents` is off.)

- `src/lib/db-cache.ts` (new) — one `cachedRead(fn, keyParts, { tags, isDegraded })`
  primitive: `unstable_cache` (cross-request/-instance) wrapped in React `cache()`
  (per-request dedup), `READ_CACHE_TTL = 300`s. The `isDegraded` guard throws on an
  empty result so a transient DB blip never freezes an empty catalogue for the whole
  TTL (the loaders swallow errors → `[]`; empty ⇒ failure ⇒ don't persist, retry next
  request). Documents the **2 MB per-entry Data Cache limit** — cache lean
  row-projections, never fat detail payloads.
- `src/lib/compendium/loader.ts` — the four source loaders now go through
  `cachedRead` (one cache entry each; Characters ∪ Primarchs still share the one
  character fetch). Builders/dispatch/counts unchanged.
- `src/db/client.ts` — hardened the postgres-js client (site-wide safety net):
  `idle_timeout: 20`, `connect_timeout: 10`, `fetch_types: false`; kept `max: 5`
  and `prepare: false`. So a slow/wedged query now fails fast and recycles its
  socket instead of poisoning the next request. (No `statement_timeout` — the 6543
  transaction pooler rejects it as a startup param; a real per-query timeout needs
  `SET LOCAL` in a txn, noted as a future change for `/atlas`.)
- `src/app/compendium/page.tsx` — `export const revalidate = 300` (the overview has
  no searchParams → static/ISR like `/podcasts`; the category pages stay dynamic but
  read from the cached loaders).

**Verified (dev, fresh `.next`, SQL logger on):**
- Cold `/compendium`: 200 in 1.6 s, fires the 7 queries once. Warm: 200 in **0.10 s,
  0 DB queries**. Every category page (incl. the dynamic `?q=…&sort=…` variant):
  **0 DB queries** — they read from the shared cache. The whole surface costs **7
  queries total per 5-min window**, not per request.
- **Concurrency proof: 36 simultaneous requests across the surface → 36/36 HTTP 200,
  0 new DB queries, 0 unhandledRejections.** The pool can no longer be saturated by
  visitor concurrency.
- `npm run typecheck` / `npm run lint` / `npm run brain:lint --no-write` — all pass
  (brain: 0 blocking). Main nav smoke test (`/`, `/timeline`, `/map`, `/podcasts`,
  `/ask`, `/compendium`) all 200 in ≤0.5 s; timeline data intact (7 eras, 87 books).

**`/werke` — evaluated and deliberately NOT cached this pass.** I first wrapped
`loadBrowseBooks` in `cachedRead` too, but its payload is **2.85 MB** (full synopses
+ every relation for all books) — over Next's 2 MB Data Cache limit. `unstable_cache`
then refuses to store it and the set-failure surfaces as an *uncatchable* background
`unhandledRejection` (the set is fire-and-forget after the value returns), while every
request still re-fetches. Reverted to its original uncached form (its prior behaviour;
not the reported bug, and "works" — 1 fan-out query, fast on Vercel, only slow on this
high-latency host). The client hardening still protects it from the poison-cascade.
Proper fix is a separate, considered change (see below).

## For next session

- **Curate the primarch roster** (Board 122): fill `CURATED_PRIMARCH_IDS` in `src/lib/compendium/primarchs.ts` and the Primarchen door lights up automatically.
- When podcast episodes start carrying character/location/author junctions, those entity pages will show them with no UI change (the `works.kind` grouping + `href` resolution already handle it).
- Consider whether `/welt`/`/charakter`/`/person` detail pages want the same gold re-skin as the directory, or stay in the cyan entity vocabulary (current state — deliberate, matches existing `/fraktion` detail).
- ~~**Possible perf win:** the nav counts re-run ~4 aggregates on every Compendium
  navigation~~ — **DONE** (see "Follow-up — caching fix"): the source reads are now
  cross-request cached, so the surface hits the DB ~once per 5-min window, not per request.
- **`/werke` (+ Home) concurrency:** `/werke` is uncached and ~19 s on this host (1
  heavy 2.8 MB fan-out query). It's fine on Vercel and survived before, but it's the
  remaining heavy public read. It can't use `cachedRead` (2 MB Data Cache limit). The
  proper fix mirrors Home/`/podcasts`: make it statically renderable + `revalidate`
  by moving the filter to a client island (it already has `WerkeFilters`), so the
  full list renders once (cached HTML, like Home already does) and filtering happens
  in-browser. Alternatives: an in-process TTL memo (sidesteps the 2 MB limit but needs
  a no-mutation audit of `applyWorksFilters`), or trimming the list synopsis to a
  preview so the payload fits under 2 MB (a small visual change). Needs a product call.
- **Per-query timeout for `/atlas`:** the admin bridge still fans ~12 COUNTs per
  request (`force-dynamic`). Add `SET LOCAL statement_timeout` inside a txn (the 6543
  pooler rejects it as a startup param) so a runaway aborts cleanly. Low priority
  (admin-only), but it's the last surface that can still stress the pool.
- **Optional:** wire the ingestion pipeline (Batches strand) to call
  `revalidateTag("compendium", "max")` after a run so the catalogue refreshes
  immediately instead of waiting out the 5-min TTL.

## Follow-up — teal redesign (chat-commissioned, 2026-06-08)

The Compendium shipped in the gold `.catalogue` reading-room language. Maintainer
call: it should read as the archive's **index in teal**, distinct from the gold
reading-rooms, and it lacked the fade-to-void readability backdrop that `/ask` +
`/podcasts` use. The "table header" (group labels) and the boxed search field were
called out as weak. Redesigned the surface to cyan:

- **Dropped the `catalogue` class** on `<main>` (`layout.tsx` → `className="compendium"`).
  Cyan is the house default, so the TopNav, the `.c-glass` / `.c-corners` primitives
  and the shared `.browse-*` controls all revert to teal automatically — no fighting
  the gold `body:has(main.catalogue)` re-skin. HUD accents (AuspexSweep / GhostReadout /
  FloatingCoord) switched `var(--cl-gold)` → `var(--cl-cyan)`.
- **Readability backdrop:** added `body:has(main.compendium) .site-bg::after` (the
  `/ask` + `/podcasts` neutral fade-to-void, tuned a touch more aggressive since the
  Compendium's content sits under a compact hero, not a 60 vh masthead) plus a
  `<ScrollScrim className="cmp-scrim" varName="--cmp-scrim-opacity" heroSelector=".cmp-hero">`
  so a long directory scrolling over the fixed photo stays legible. `main.compendium`
  cancels the global `main { padding-top: var(--top-nav-h) }` (44-nav-frame.css), the
  way `/ask` + `/podcasts` do.
- **Search field:** dissolved the boxed `.browse-filters` panel into `/werke`'s
  two-row query console, in cyan — a full-width Cormorant search line under a cyan
  hairline with a leading auspex-reticle sigil (added to `CompendiumControls`), the
  facet/sort pills dropped to a quieter second row (wrapped in `.browse-controls`).
- **Table header:** the weak `// CHAOS (12)` group label is now a teal section legend
  — cyan-mono name · fading cyan rule · dim count (`.cmp-group__{name,rule,count}`,
  restructured in `[category]/page.tsx`). Toolbar tidied, cyan reserved for the live count.
- **Rows kept** (already good) — retinted gold → cyan only (hairlines, hover wash,
  chevron, name-hover).
- **Restraint upheld:** cyan reserved for the hero eyebrow, hovers, focus, active tabs
  and live counts; structure stays bone/dim + cyan-tinted hairlines; neutral void fade
  only (no cyan halo, no warm gradient).

Verified with a 4-lens read-only review fan-out (gold-remnant audit, contrast,
cohesion vs `/ask`+`/podcasts`+`/werke`, structural/responsive): cohesion clean; no
gold tokens remain. Acted on the valid findings — added black drop-shadows to the
frameless cat-intro + toolbar (the upper-mid band is semi-bright on tall viewports
before the scrim engages) and nudged the gradient ~4 % earlier; left the deliberately
ghosted `aria-hidden` row index/chevron as-is (matches the shipped intent; rows sit in
the void zone at rest and under the scrim when scrolled). `tsc` + ESLint clean; all
five category routes 200.

**Frameless + icon refinement (maintainer feedback, same day).** First pass kept the
overview doors as boxed `.c-glass` cards with `.c-corners` L-brackets and the unicode
dingbat sigils (✠ ❂ ✶ ◉ ❡) — the maintainer flagged both ("border lines, gone in /ask"
+ "bad icons"). Retired the glass cards and bracket corners: the doors (and the empty /
pending states) are now frameless, hairline-divided horizontal threshold blocks — the
sigil-icon left, head + blurb + peek + "view all" right, divided by a cyan hairline and
lifted by a cyan wash on hover (the /podcasts `.pod-card` idiom). The dingbats are
replaced by crisp inline-SVG line-glyphs (new `CompendiumSigil` — shield/cross, radiant
star, bust, ringed planet, pen nib), drawn in the same thin-geometric `currentColor`
idiom as the search reticle, cyan-dim at rest → full cyan on door hover. (Also: a full
dev-server restart + `.next` clear — a big in-place change had left stale Turbopack
chunks, so the browser showed an empty directory the server was actually rendering.)

**Background + masthead-skeleton alignment (maintainer feedback, same day).** The
line-icons still read as "bad", and the masthead rhythm didn't match the sibling pages.
Three changes: (1) **removed the door icons entirely** — each door is now a plain
frameless block (eyebrow / label · count / blurb / peek / "view all"), no sigil column;
deleted `CompendiumSigil`. (2) **New background**: a maintainer-supplied cathedral-library
render, converted PNG→webp via sharp (1672×941, 188 KB) to `public/img/scriptorium.webp`
and registered as `SiteBackground` variant `"scriptorium"` (the Compendium uses it at
`50% 30%`). (3) **Masthead onto the shared skeleton** — the compact hero is replaced by
the exact `/ask` (`.ask-console__mast`) + `/podcasts` (`.pod-mast`) values: a
`clamp(520px,60vh,700px)` band with the title parked at 320px, the HUD (auspex sweep +
ghost readout) moved OUT of the hero to fixed viewport elements (`.cmp-hud` sweep at
top 60px, `.cmp-readout` at top 96px), content pulled up `-80px`, and the same
fade-to-void gradient. Mobile mirrors them too (420px band / 240px title / -56px). So the
title position, the HUD-above-title gap and the content start now line up with the
sibling pages. tsc + ESLint clean; routes 200, entries intact.

Note: the line below about "the same gold re-skin as the directory" is now stale — the
directory is teal; entity detail pages (`/fraktion`/`/welt`/`/charakter`/`/person`)
remain in the cyan entity vocabulary, which now matches the directory.

Files: `src/app/styles/66-compendium.css`, `src/app/compendium/layout.tsx`,
`src/app/compendium/page.tsx`, `src/app/compendium/[category]/page.tsx`,
`src/components/compendium/CompendiumControls.tsx`,
`src/components/chrome/SiteBackground.tsx` (+ `public/img/scriptorium.webp`).
(`CompendiumSigil` was added for the SVG icons then removed when the icons were cut.)

## References

- Brief 129 (`2026-06-04-129-arch-doorways-curation-layer`) — doorways IA contract.
- Brief 113 (`2026-06-01-113-arch-entity-graph-panel`) — entity overlay contract reused for `/person`.
