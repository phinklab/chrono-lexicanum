---
title: Architecture
type: overview
created: 2026-05-09
updated: 2026-07-10
sources:
  - ../../src/db/schema.ts
  - ../../src/db/client.ts
  - ../../src/app/
  - ../../src/lib/db-cache.ts
  - ../../src/lib/map/
  - ../../src/lib/ingestion/podcast/
  - ../../scripts/book-apply-shared.ts
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
  - ../../sessions/2026-07-10-192-impl-mobile-cartographer-canvas.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./glossary.md
  - ./decisions/why-drizzle-supabase.md
confidence: high
---

# Architecture

> Current system map. Code and schema win if this page ever disagrees.

## High-level shape

```text
Browser / React
      │
      ▼
Next.js App Router on Vercel
  ├─ Server Components + route handlers
  ├─ Client islands for interactive tools
  ├─ tagged/read-through caches
  └─ static committed data for Cartographer
      │
      ▼
Supabase Postgres (canonical domain state)

Local/CI content operations
  ├─ per-book JSON corpus
  ├─ podcast manifests/extractions
  ├─ curated timeline/entity/map JSON/XLSX
  └─ apply + verify commands
      │
      └──────────────► Postgres / committed map data
```

The app is a mixed rendering system. Dynamic/search-param catalogue views and runtime entity reads use Postgres. `/map` is deliberately DB-free and static from committed `map-worlds.json`. Several hot entity routes use curated prerender subsets plus on-demand ISR. A versioned snapshot for all public build projections is a **planned launch change**, not current architecture yet.

## Sources of truth

| Concern | Canonical source |
|---|---|
| Database schema | `src/db/schema.ts` + ordered SQL migrations |
| Book corpus | `scripts/seed-data/books/<slug>.json` (one `book-v1` file per book) |
| Podcast content | feed manifest + committed extraction artifacts; Postgres after `apply:podcast` |
| Timeline | committed timeline seed data, applied by `apply:timeline` |
| Hand curation | seed JSON/XLSX plus `curation-overlay.json`, always applied last |
| Cartographer | `scripts/seed-data/map-worlds.json`, curated zones and voyage TypeScript data |
| Runtime domain | Postgres; Atlas is only a generated read-only mirror |
| Engineering memory | `brain/wiki/`; raw history in sessions/git |

## Database model

The schema uses a works-centric class-table-inheritance shape:

- `works` holds shared identity, title/slug, kind, dates, synopsis, provenance and confidence.
- Detail tables specialize books, films, channels/videos, podcast shows and podcast episodes.
- Reference entities include Eras, events, series, factions, persons, characters, sectors/locations and facets.
- Junctions connect works to factions, persons, characters, locations, facets and timeline events.
- `external_links` carries source-aware public links.
- `submissions` is the quarantine for future community input; it never writes directly to canonical tables.
- `preview_invite_activations` supports the temporary preview gate and is scheduled for post-launch removal.

`works.kind` and detail-table membership are protected by application write paths plus database triggers. IDs are UUIDs for works and stable strings for curated reference entities. In-universe dates use `numeric(10,3)` with `M * 1000 + yearWithinM`.

The Postgres client uses the Supabase transaction pooler, SSL, `prepare: false` and `max: 5`. It currently reads `DATABASE_URL`; runtime/migration credential separation is launch work and must include the consumer change, not only environment renaming.

## Read and cache model

- Server-only loaders own SQL; client components receive serializable projections.
- `cachedRead`/`memoryCachedRead` and framework cache tags reduce repeated DB reads; `/api/revalidate` invalidates catalogue surfaces.
- Error semantics are not yet fully uniform: some loaders can conflate absence with upstream failure. The launch cache/error session will establish data-or-null/throw behavior and cross-request coalescing.
- `READ_CACHE_TTL` provides a runtime backstop. Revalidation semantics must be aligned with the two-stage snapshot release before an automatic apply hook ships.

## Frontend surfaces

| Area | Shape |
|---|---|
| Home / Archive / Podcasts | server-fed catalogue/search surfaces with client filter/search islands |
| Compendium / entity pages | category indexes and shared entity detail vocabulary |
| Book detail | canonical page plus intercepted modal route |
| Chronicle | event-backed cinematic and index modes; still DB-fed |
| Ask | four-question server-ranked recommendations plus curated faction-entry tool |
| Cartographer | static 1,055-world SVG chart; interactive React/imperative camera; mobile route motion on Canvas |
| Legal/artwork | public ungated static/document surfaces |
| Preview/admin | preview login/invites plus Basic-Auth admin/audit routes |

The global design language is the 2026 “Cathedral” system: shared fonts/tokens, void/bone/gold/blood palette and semantic CSS partials. Session 185 pruned legacy token/classes and established the current responsive layer. Route-specific CSS remains globally imported in places; launch CSS/LCP work will measure and split it without a design-system rewrite.

## Cartographer internals

- `src/lib/map/` parses committed world/zone data and builds the static payload.
- `src/lib/map/voyages/` defines and resolves eight researched Great Journeys; generated legs can carry off-chart waypoints.
- `src/components/cartographer/` renders chart layers, camera, controls, mobile sheet, world/voyage panels and the dev-only zone editor.
- The base chart stays SVG for semantic authoring and hit testing. On viewports up to 900 px, moving journey dashes render into a pointer-transparent Canvas at capped 30 fps/DPR 2; static rings/labels stay SVG. Desktop keeps SVG motion.

## Content/write paths

- `apply:book --slug|--all` materializes the per-book corpus through the shared writer.
- `apply:podcast --show|--all` performs additive, GUID-keyed show/episode updates; no pruning or full-show retag is required for normal deltas.
- `db:sync` composes corpus, podcasts, narrator, timeline and curation apply/verify steps. It is non-destructive and idempotent; `db:rebuild` is confirm-gated disaster recovery.
- Weekly Refresh detects changes and opens review artifacts/PRs but has no unattended production DB secret.
- The former Wikipedia/Lexicanum/Open Library/Hardcover crawler and V2 LLM engine were physically removed in Brief 177. Frozen inputs/diffs remain audit/equivalence history, not a live write path.

## Deployment and CI

- GitHub PRs are the only path to `main`; Vercel deploys merged source.
- CI currently runs lint, typecheck, Brain lint and 30 DB-free suites. Production build is verified in implementation sessions but is not yet permanently DB-free/required.
- Migrations run explicitly through the migration workflow or local operator path; Vercel build does not migrate production.
- Preview gate and site-wide noindex remain until launch. Legal/artwork/health and selected API paths bypass the visitor gate by design.

## Deferred architecture

- Versioned build snapshot + manifest (launch programme).
- Least-privilege runtime/migration role split (launch programme).
- Personal library/auth storage and community review UI (post-launch).
- Atlas event pages and multilingual domain sidecars (future, demand-driven).
