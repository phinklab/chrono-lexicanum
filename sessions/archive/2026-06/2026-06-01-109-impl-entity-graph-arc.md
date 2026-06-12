---
session: 2026-06-01-109
role: implementer
date: 2026-06-01
status: complete
slug: entity-graph-arc
parent: 2026-05-31-109
links: ["2026-05-31-108", "2026-05-23-096"]
commits: []
---

# Entity-graph arc — Step 1 (canonical entity view + real reference pages)

## Summary

Replaced the three `/charakter`, `/fraktion`, `/welt` stub shells with real,
data-driven entity-hub pages built on one shared, **frame-agnostic** view
(`src/components/entity/`) fed by a **server-only loader** (`src/lib/entity/`) —
the load-bearing seam Steps 2 (panel) and 3 (search) reuse without forking. All
three routes are now genuinely **SSG** (981 entity pages prerendered; build
green in 3.6s), cross-links navigate the graph, and books link to `/buch/[slug]`.

## What I did

- `src/lib/entity/types.ts` — the durable, **db-free / JSX-free** contract:
  `EntityType`, `TYPE_TO_ROUTE` (the shareable URL map Step 3 imports),
  `KIND_LABELS` + `kindLabel` (`?? kind` fallback), `entityHref`, and the
  `EntityRef` / `WorkRef` / `FactRow` / `WorkGroup` / `CrossLinkGroup` /
  `EntityView` shapes.
- `src/lib/entity/loader.ts` — **server-only** data layer. `listEntityIds(type)`
  (one lean id select per reference table, for `generateStaticParams`) and
  `loadEntity(type, id)` (React `cache()`-memoised; per-type explicit Drizzle
  selects in a single `Promise.all`; reverse-junction works grouped by
  `work.kind`; direct-neighbour cross-links; whole body try/catch → `null`).
- `src/components/entity/EntityView.tsx` — frame-agnostic composer; header
  comment documents the two seam rules (db-free; owns the single `<h1>`).
- `src/components/entity/{EntityHeader,EntityFacts,RelatedWorks,CrossLinkRail}.tsx`
  — db-free RSC section modules (real `<ul><li><a>`, `<h2>`/`<h3>` headings,
  `aria-hidden` rules, empty sections omitted).
- `src/app/charakter/[slug]/page.tsx`, `…/fraktion/…`, `…/welt/…` — thin,
  near-identical frames: `dynamicParams = true`, `generateStaticParams` →
  `listEntityIds`, non-throwing `generateMetadata`, `await params` →
  `loadEntity` → `notFound()`, then `<main className="entity">` + `SiteBackground`
  + `CornerAuspex` decor + `<EntityView>`. They differ only by the type literal,
  backdrop position (`50% 24/28/32%`), and decor label (`PERSONA/FRACTIO/MVNDVS // 1011`).
- `src/app/styles/59-entity.css` — the entity ownership stylesheet; `.entity-*`
  mirrors `51-book-detail.css` values verbatim (mono `//` eyebrow, Cinzel title,
  Cormorant one-line, cyan section labels + `.c-hairline`, cyan chip rows).
- `src/app/globals.css` — swapped the `52-stub-shell.css` `@import` for
  `59-entity.css` (placed in its ascending-numeric slot after `58-`); net
  `@import` count unchanged (24), still import-only.
- **Deleted** `src/app/styles/52-stub-shell.css` (now 100% dead — see Decisions).
- `sessions/2026-05-31-109-arch-entity-graph-arc.md` — flipped `status: open →
  implemented` (inside this PR, per the PR policy for a code-handing brief).

## Decisions I made

- **Single centered column, not `/buch`'s two-column rail.** Entities have no
  cover/buy aside; one column reads intentional for sparse entities and drops
  unchanged into a narrow Step-2 panel.
- **Explicit per-type Drizzle selects, not `json_agg`.** Mirrors the proven
  `/buch` loader, stays TS-strict / no-`any`, and the per-page fan-out is ≤4
  queries in one `Promise.all`. **`works` already carries `slug`/`kind`/
  `coverUrl`/`releaseYear`, so the related-works query needs no `book_details`
  join** — simpler than the plan anticipated.
- **Full SSG + `dynamicParams = true` + try/catch → null.** `generateStaticParams`
  enumerates *all* ids; the build prerendered everything and the long tail / a
  flaky row degrade to on-demand render or a 404 instead of failing `next build`.
  The build-time pooler fear was **unfounded**: 15 static-gen workers but the
  client pool caps at `max:5` and postgres-js queues — **1004 pages in 3.6s**.
  So I did *not* need the documented levers (`json_agg`, or hot-setting
  `listEntityIds` to ≥1-junction entities); full enumeration is fast enough.
- **"Single link → fact row, multi-link set → cross-link group."** The brief's
  IA listed a faction's parent in *both* facts and cross-links; I consolidated so
  no edge renders twice. Result: a character's allegiance is a linked **fact**
  (so a single-book character shows no CONNECTIONS section); a faction's parent is
  a fact while sub-factions + key characters are cross-link groups; a location's
  sector is a fact (sectors are **not** routable — no `/sektor` — so it's a plain
  string, never a link) while sibling worlds are a cross-link group.
- **Deferred co-occurrence neighbours.** "A character's locations" / "appears
  alongside" would need an N+1 across every related work's *other* junctions.
  Step 1 ships **direct** neighbours only; empty groups are omitted.
- **Small contract extension — `EntityView.tags?: string[]`.** Location `tags`
  render as muted chips; the brief's `FactRow` IA is explicitly illustrative, and
  free-text tags aren't label→value pairs, so a dedicated optional field is the
  honest shape.
- **⚠ Deviation from brief line 92 — retired `52-stub-shell.css` + swapped its
  import.** The brief says "globals.css beyond adding your one `@import` … leave
  the rest alone." The approved plan instead **swapped** (−52 import, +59 import,
  net-zero) and **deleted** `52-stub-shell.css`, because that file became 100%
  dead: grep confirms only the three replaced routes used `.stub-shell` (the
  file's own comment listing `/map` is **stale** — `/map` uses `55-map.css`).
  This is cleanup *caused by* this brief, not the Brief-108 CSS-modernization the
  line 92 parenthetical fences off. If you'd rather keep a pure `+1 @import` and
  leave the dead file, reverting is trivial.
- **`CROSSLINK_CAP = 40`** on key-characters and sibling-worlds — a silent cap
  (flagging it here per "no silent caps"); 40 chips is generous and no live
  entity is near it, but a future huge faction would truncate without a "+N more".
- **Report numbered 109, not the plan's 110.** An impl shares its brief's NNN
  (cf. the `105-arch` + `105-impl-{data,product}` and `103-arch`/`103-impl`
  pairs); **110 is already taken** by `arch-podcast-ingest-pilot`, so the plan's
  110 was an error that would have collided.
- **Next 16.2.4 / React 19.2.5** (brief said "15"; repo pin wins per version
  policy). Async-`params` rule unchanged; used the `Metadata` return type and the
  `dynamicParams` segment config.

## Verification

- `npm run typecheck` (`tsc --noEmit`) — **pass.**
- `npm run lint` (`eslint .`) — **pass.**
- `npm run build` — **pass.** `/charakter/[slug]`, `/fraktion/[slug]`,
  `/welt/[slug]` all report **● (SSG)** with 490 / 202 / 289 paths; 1004 total
  static pages generated in 3.6s. (This is the gate that exercises build-time DB
  enumeration — it completed against the live Supabase pooler.)
- Runtime smoke on `next dev` (curl — no Playwright in this repo), desktop HTML:
  - `/charakter/horus` → **200**: title "Horus", `// DOSSIER` (Allegiance) +
    `// RELATED WORKS` (`// Books`), book links `/buch/horus-rising` etc.,
    cross-link `/fraktion/sons_of_horus`.
  - `/fraktion/thousand_sons` → **200**: DOSSIER (Alignment, Parent faction),
    RELATED WORKS, CONNECTIONS (`// Key characters` → `/charakter/ahzek_ahriman` …).
  - `/welt/prospero` → **200**: DOSSIER (Sector, Cartographer grid), CONNECTIONS
    (`// Other worlds in sector` → `/welt/cadia` …).
  - `/charakter/zzz-nope` (bad id) → **404.**
  - Dev log clean — no React hydration / duplicate-key / runtime warnings.
- `git diff` invariants confirmed: `globals.css` net `@import` unchanged (24), no
  bare selectors (import-only), **no `.module.css`** introduced, three types
  render from one shared `EntityView`.

## Open issues / blockers

- **No headless visual pass.** I verified structure, links, and 404s via curl,
  but cannot drive a real browser here. The brief's eyeball check at **desktop +
  ≤720px** is still the maintainer's to do (the CSS mirrors `51-book-detail.css`
  values verbatim and reuses the house `720px` breakpoint, so risk is low). The
  mobile decor overlaps nothing — the head reserves right-padding under 720px.
- `CROSSLINK_CAP = 40` truncates silently (see Decisions). Not blocking.

## For next session

Answers to the brief's open questions:

1. **Era / series pages — near-free, deferred to a small follow-up.** They slot
   straight onto this system: add `'era' | 'series'` to `EntityType`, two entries
   to `TYPE_TO_ROUTE` (`/aera`, `/serie`), and `loadEra` / `loadSeries` in the
   loader. The **view modules need zero changes.** The one wrinkle: eras/series
   reach works through `book_details` (`primaryEraId` / `seriesId`), *not* the
   polymorphic `work_*` junctions — so their "related works" are **book-only**
   until other media gain era/series anchors. Recommend a dedicated ~1–2h brief;
   out of scope here (brief line 90).
2. **Section-module + loader seam for Step 2.** The page is the *only* frame
   owner. Step 2's intercepting route (e.g. `@modal/(.)charakter/[slug]`) imports
   the **same** server `loadEntity(type, id)` and the **same** db-free
   `<EntityView data>` and wraps the view in an overlay/dialog instead of
   `<main>` + `SiteBackground` + decor. Because `EntityView` imports nothing
   server-only and owns its own `<h1>` + sections, it mounts in a client panel
   unchanged — **zero fork**, identical body in panel and full page. `loadEntity`
   is `cache()`-memoised, so a soft-navigation that renders both dedupes the DB
   hit.
3. **`/buch` alignment.** The hubs deliberately mirror `51-book-detail.css`
   *values*, but as a parallel class tree (`.entity-*` vs `.book-detail__*`). The
   clean convergence is to promote the shared grammar — chip, section-label,
   hairline — into a primitive both consume (e.g. `.c-chip` / `.c-section` in
   `16-shared.css` / `40-primitives.css`), then have a later `/buch` touch-up and
   the hubs both adopt it. Worth folding into Step 2 or a `/buch` polish; I did
   **not** refactor `/buch` (brief line 91).
4. **Sparse entities.** A single-book character reads as eyebrow + title +
   Allegiance fact + one `// Books` chip — intentional, not broken. A truly empty
   entity shows the header + *"No catalogued appearances or connections yet."*
   note. SEO: if Step 3 indexes these, consider `noindex` for zero-connection
   entities or a minimum-content threshold — a later pass, not urgent.
5. **Route-spelling preference.** Recommend **ASCII** for the optional new routes:
   `/aera` (not `/ära`) and `/serie`, and **keep `/welt`** (not `/ort`). ASCII
   slugs match every existing segment (`/buch`, `/fraktion`, `/charakter`,
   `/welt`), avoid `%C3%A4` URL-encoding in shareable links, and dodge route /
   filesystem encoding edge cases. Pin this into `TYPE_TO_ROUTE` before Step 3
   hard-codes the full map.

Additional follow-ups noticed but out of scope:

- **Co-occurrence neighbours** (character ↔ shared locations, "appears alongside")
  as a later enrichment — needs a deliberate 1–2 query design to avoid the N+1.
- **Year on work chips** — works are *sorted* by `releaseYear` but the year isn't
  shown on the chip; a muted year suffix would aid the reading order. Optional polish.
- **Inbound links** — `/atlas` decks and (Step 3) search should start linking to
  these now-real pages; Step 1 deliberately added no inbound links.

## References

- `/buch` surface mirrored for grammar + the `roleSuffix` pattern:
  `src/app/buch/[slug]/page.tsx`, `src/app/styles/51-book-detail.css` (Brief 096).
- Resilient-loader pattern (try/catch → `[]`): `src/lib/atlas/queries.ts`.
- Schema ground truth: `src/db/schema.ts` (`work_factions` / `work_characters` /
  `work_locations` roles + defaults; `characters.primaryFactionId` is not a real FK).
- Next.js 16 `generateStaticParams` + `dynamicParams` segment config.
