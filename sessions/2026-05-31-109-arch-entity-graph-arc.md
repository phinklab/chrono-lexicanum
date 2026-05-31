---
session: 2026-05-31-109
role: architect
date: 2026-05-31
status: open
slug: entity-graph-arc
parent: null
links: ["2026-05-31-108", "2026-05-29-105", "2026-05-29-104"]
commits: []
---

# Entity-graph arc — kickoff & Step 1 (canonical entity view + real reference pages)

## Goal

Kick off the **entity-graph feature arc** — turn the works+entities database into a navigable "lexicanum" where you search a character / faction / world / book and land on a page that gathers everything about it across media — and ship **Step 1**: a shared, frame-agnostic **entity-view** plus real `/charakter`, `/fraktion`, `/welt` pages rendered from existing data, replacing today's stub shells. This file also records the architecture Cowork and Philipp settled this session and sequences the arc's later steps (one step → one brief → one PR, per Brief 108).

> This arc is the build-out of **Cluster C** from the 2026-05-29 planning (Podcasts + Faction/Theme-Hub), widened to the full entity-graph IA. **Cluster B** (curated map travel-paths) stays a separate, later track.

## Design freedom — read before everything else

Everything about how these pages *look and feel* is yours: layout, composition, spacing, type, colour usage within the existing token system, motion, micro-copy/voice, the visual treatment of each section, and all component class shapes. This brief specifies *what information appears, how it is grouped into sections, and how it is wired to data and routes* — the grammar — never the appearance. Where it names sections ("header", "related works grouped by media kind", "cross-link rail"), read that as information architecture, not a layout spec; if a section's best form is a tab, a rail, an accordion or a grid, that's your call. Build under Brief 108's styling rule (design tokens in `@theme` + per-component CSS Modules; no new component classes in `globals.css`), and reuse the existing `chrono/*` primitives where they fit.

## The arc — frame & decisions

### Decisions ratified with Philipp (2026-05-31)

1. **One store, polymorphic `works` — no second database.** Books, podcasts and (later) video are all `works` rows distinguished by `kind`; the entity junctions (`work_factions` / `work_characters` / `work_locations` / `work_facets`) already key on `work_id`, so every medium shares the same tagging and surfaces on the same entity pages. This is what makes the lexicanum cross-media, and it is the formal answer to "do we need a podcast database?" — no.
2. **The DB is an entity-graph; every surface is a lens on it.** Node lens = per-entity pages; attribute lens = browse/filter; time lens = Chronicle; space lens = Cartographer; guided lens = Ask. They are not competing features — they are projections of one graph.
3. **One universal search is the front door.** A single omnibox matches a typed string against the names + aliases of existing rows and routes to the entity (grouped typeahead by type). Predefined example queries are the search's *empty state* (onboarding + SEO), not a separate feature. The alias-resolution module from Brief 104 (`src/lib/aliases/`) is the seed of this resolver.
4. **Pages are per-row, not per-query.** One page per existing DB row (finite set → statically generable); search merely *selects* the right row. Nothing is generated from an arbitrary search term — a no-match yields suggestions, not a page.
5. **Entity types = the reference tables we have.** Character, faction, location (world/sector), era, series, and `works` (book; later podcast/video). **Themes / tone are facets**, not entities → a theme query resolves to a *filtered browse*, not a page. **Objects / items ("Gegenstände") are deliberately NOT modelled** for now; if ever wanted they slot in as another reference table + a `work_items` junction + `/gegenstand/[slug]` with zero rework — the same pattern.
6. **One entity view, two frames.** The same content modules render either as an in-context **panel/overlay** (clicking a book in the timeline, a pin on the map, a row in browse — you keep your place) or as a **full standalone page** (`/{typ}/[slug]` — shareable, SEO, the search destination). The same URL serves both via Next.js intercepting / parallel routes. Recognisability comes from a **shared shell + grammar + common modules**; what varies is the **type-specific sections** (a world shows sector/coordinates; a book shows author/format/buy-listen). A **work page is a *detail* page** (body = its own metadata + the entities *it* tags — the junction read in reverse), whereas a reference-entity page is a *hub* (body = "works about / for me, grouped by kind"). Both share the grammar.
7. **Media-subject relationship.** "This work is *about* X" (vs merely appears/mentioned) uses the existing junction `role` vocabulary extended with **`subject`** (it is `varchar` — no migration), aligning with the Cluster-C 2026-05-29 note. It lets a future podcast episode mark its topic as primary on the relevant entity page. (Not introduced in Step 1 — recorded here for the podcast track.)

### Sequencing (one step → one brief → one PR)

- **Step 1 (this brief, Product):** the shared entity-view module system + real `/charakter`, `/fraktion`, `/welt` pages (full-page frame), from existing data.
- **Step 2 (Product):** the **panel frame** — wrap the *same* modules in an overlay and wire timeline / map / browse clicks via intercepting routes (no second implementation).
- **Step 3 (Product):** the **universal search** — grouped typeahead + `/suche` results + the example-query empty state, built on the Brief-104 alias module.
- **Step 4 (Product):** generalise the catalogue into a **works browse/filter** (`/werke`) with a `kind` / type facet so non-book media coexist.
- **Step 5 (Product):** the **homepage** composition (intro + search + tool cards + curated rows; "featured" computed by junction frequency, no editorial work).
- **Parallel track (Batches): the podcast data path** — RSS ingest (Apple iTunes-lookup → `feedUrl` → episode parse) into `works` of a podcast `kind`, plus episode→entity tagging (title + description via LLM → the existing resolver, `role='subject'`). Verifiable via DB / audit without any UI, so it can run alongside the Product steps; its own kickoff brief. (Research done this session: feeds are public and free, the per-episode fields were verified on a live feed, and episode titles name their subject — strong tagging signal. Pilot candidate: *The 40k Lorecast*.)

Later briefs are written one at a time as each lands.

---

# Brief 109 · Step 1 — entity-view foundation + reference pages

> The only step implemented in this session. New feature pages on existing data — no search, no panel, no podcasts yet.

## Goal

Replace the stub `/charakter/[slug]`, `/fraktion/[slug]`, `/welt/[slug]` pages with real, data-driven pages built on a single shared, **frame-agnostic** entity-view module system — proving the per-type section composition and the "related works grouped by media kind" body, so Step 2 can add the panel frame without rebuilding anything.

## Context

Product worktree `chrono-lexicanum-product`. Today these three routes render stub shells (`PHASE 3 · IN PREPARATION` — see `src/app/{charakter,fraktion,welt}/[slug]/page.tsx`). `/buch/[slug]` is already a bespoke, real page (Brief 096 D + Brief 105 UI) — **leave it as is** this step.

The data already exists: the resolver pipeline filled `work_characters`, `work_factions`, `work_locations` across the data-complete 859-work corpus, and the reference tables hold ~490 characters / ~290 locations / ~200 factions. So an entity page is a *query over existing rows + junctions* — no data work, no migration. Schema: `src/db/schema.ts`.

This is the first step of the arc framed above; it realises the "node lens" and is the keystone every later step (search destinations, the panel, podcast display) reuses.

## Constraints

- **Server components + static generation.** Entity pages are server-rendered and statically generated via `generateStaticParams` over the existing rows (the entity set is known at build). No client-side DB access; DB only from server code (`src/db/client.ts`), per `CLAUDE.md`.
- **One shared, frame-agnostic view.** Build the page body as a shared shell + composable section modules with a typed per-type composition. The modules and their data-loader must not assume the full-page frame — Step 2 will mount the identical modules inside a panel. **Do not** create a separate page-vs-panel implementation now or later.
- **Related works grouped by `work.kind`.** The works body groups by media kind and must not hard-code books-only — podcast / video rows must appear automatically once such works exist. Books are the only populated kind today; that is fine.
- **Cross-links navigate the graph.** Each page links to its neighbour entities (faction ↔ characters ↔ locations, etc.) by canonical `/{typ}/[slug]` URL. Those URLs are the shareable contract and must stay stable.
- **Async params (Next 15)** — `await` `params` / `searchParams`.
- **Styling per Brief 108's rule** — tokens (`@theme`) + per-component CSS Modules; **no new component classes in `globals.css`**.
- **Accessibility floor (not the full a11y arc):** semantic heading order, real landmarks, keyboard-reachable links. The deep a11y / reduced-motion pass is the later arc (Brief 108 §) — here, simply do not introduce motion that ignores `prefers-reduced-motion`.
- TypeScript strict, no `any`.
- **Version policy:** do not pin anything; a new dependency is unlikely, but if one is needed, research the current stable, pin it in `package.json`, and put the rationale in the report.
- **Git:** code → task branch + PR (Product: `codex/product-<slug>`); announce the detected worktree / strand / branch before editing. This brief file is doc-only and already on `main`; flip its `status: open → implemented` inside the PR.

## Out of scope

- **Search** (typeahead, `/suche`) → Step 3. **Browse / filter** (`/werke`) → Step 4. **Homepage** → Step 5. **Panel / overlay + intercepting routes** → Step 2.
- **Podcasts and any Batches / data work** — the parallel track, its own brief. Do not add the `subject` role value or touch ingestion here.
- **Items / "Gegenstände"** as a type; **new entity types beyond character / faction / location** — era / series pages are optional (see open questions), not required.
- **Rebuilding `/buch/[slug]`** — it is bespoke; align with the shared grammar only where trivial, do not refactor it this step.
- Redesign of timeline / map / Ask; any new visual identity; the editorial "featured" computation.

## Acceptance

The session is done when:

- [ ] `/charakter/[slug]`, `/fraktion/[slug]`, `/welt/[slug]` render real data for seeded slugs — header, type-specific facts, related works grouped by media kind, and a cross-link rail — fully replacing the stub shells.
- [ ] Pages are statically generated (`generateStaticParams`) and the build is green.
- [ ] The three types are composed from **one** shared shell + section-module set; the report shows the composition and the loader seam, so Step 2's panel can reuse them.
- [ ] Cross-links navigate between entity pages; `/{typ}/[slug]` URLs are canonical and stable.
- [ ] Styling lives in CSS Modules + tokens; `git diff` shows **no** new component blocks added to `globals.css`.
- [ ] The Brief-108 visual-regression baseline is extended to the three new pages (or, if you defer that to its own step, say so and why in the report).
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all green.
- [ ] PR opened (not merged — Philipp merges); this brief flipped to `status: implemented` in the PR.

## Open questions for your report

- **Era / series pages** — cheap to add on the same system, or deferred? (`eras` already powers the timeline; a `/aera/[slug]` may be near-free.)
- Describe the **section-module + loader seam** you built — specifically how Step 2 mounts the same modules in a panel without forking.
- Anything about **`/buch` alignment** that should feed Step 2 or a later `/buch` touch-up, so the work *detail* page and the reference *hub* pages converge on the shared grammar?
- **Sparse entities** (a character in a single book): how does a thin page read, and is there a minimum-content / SEO concern worth a later pass?
- Any **route-naming** friction (`/welt` vs `/ort`, the `/aera` spelling) you would want settled before search (Step 3) hard-codes the type→route map?

## Notes

- **Per-type section map (illustrative — IA, not a layout spec):**
  - *Character:* header (name · portrait · one-line) · facts (faction, appearances by role: POV / appears / mentioned) · related works grouped by kind · cross-links (faction, locations, related characters).
  - *World / location:* header · facts (sector, in-universe coordinates, warp / capital, a hook for a Cartographer mini-view) · works *set here* grouped by kind · cross-links (sector, factions, characters).
  - *Faction:* header · facts (alignment, parent, sub-factions, glyph) · works grouped by kind · cross-links (parent / children, key characters).
  - *(Work / book — already bespoke; the shared "tagged entities + cross-links" grammar should eventually align, but not this step.)*
- The shell + module seam is the load-bearing deliverable — Steps 2–5 all lean on it. Build it so the same modules mount in either a full page or a panel from day one.
- References: schema `src/db/schema.ts`; stubs `src/app/{charakter,fraktion,welt}/[slug]/page.tsx`; styling rule Brief 108; alias / resolution module Brief 104; Cluster-C framing in the 2026-05-29 planning note (`sessions/README.md`).
