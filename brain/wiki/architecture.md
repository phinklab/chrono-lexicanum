---
title: Architecture
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md
  - ../../src/db/schema.ts
  - ../../src/db/client.ts
  - ../../src/lib/ingestion/
  - ../../sessions/archive/2026-05/2026-05-01-019-arch-schema-foundation.md
  - ../../sessions/archive/2026-05/2026-05-01-020-impl-schema-foundation.md
related:
  - ./pipeline-state.md
  - ./glossary.md
  - ./decisions/why-drizzle-supabase.md
  - ./decisions/why-multi-source-merge.md
confidence: high
---

# Architecture

> The system as it stands today. A living description; update when major decisions land. Schema and code are the truth — this doc is the **map**.

## High-level shape

```
┌──────────────┐        ┌────────────────────────────┐        ┌──────────────┐
│  Browser     │ ──HTTP─→ │ Vercel (Next.js runtime) │ ──SQL─→ │  Supabase    │
│  (React)     │        │  - server components       │        │  Postgres    │
│              │ ←───────│  - server actions          │ ←──────│              │
└──────────────┘        │  - static page bundles     │        └──────────────┘
                        └────────────────────────────┘
                                    ▲
                                    │ deploys on git push
                                    │
                        ┌────────────────────────┐
                        │ GitHub repo            │
                        │ - source               │
                        │ - migrations (versioned)│
                        └────────────────────────┘
                                    ▲
                                    │ commits from
                                    │
                        ┌──────────────────────────┐
                        │ Local dev (Philipp)      │
                        │ - Cowork (planning)      │
                        │ - Claude Code (impl)     │
                        │ - npm run dev            │
                        └──────────────────────────┘
                                    ▲
                                    │ feeds new books
                                    │
                        ┌──────────────────────────┐
                        │ src/lib/ingestion/ (P3)  │
                        │ - Wikipedia + Lexicanum  │
                        │ - Open Library + Hardcvr │
                        │ - LLM enrichment (Haiku) │
                        │ - merge engine, dry-run  │
                        │ - diffs in ingest/...    │
                        └──────────────────────────┘
```

The frontend is mostly statically renderable (book pages don't change per visitor), but the database is real — that gives us SEO, fast loads, and a path to community submissions without rewrites. The pipeline runs locally, produces dry-run diff JSONs committed under `ingest/.last-run/`, and a future Apply-step (3d) writes them to Postgres.

**Where each truth lives:**

- App code, components, routes → `src/app/` + `src/components/`
- Schema (canonical for DB) → `src/db/schema.ts`
- Pipeline code → `src/lib/ingestion/` (21 modules)
- Pipeline outputs → `ingest/.last-run/*.diff.json` (committed) + `ingest/.llm-cache/<slug>.json` (gitignored)
- Engineering memory → `brain/` (this folder; wiki + raw + outputs)
- Book domain (~800 W40k novels with synopses, factions, etc.) → Postgres canonical, mirrored to external `chrono-atlas/` via `npm run atlas:regen`
- Session history → `sessions/` (top-level, committed)

## Database schema (overview)

Stufe 2a (sessions/2026-05-01-019/020) replaced the books-centric topology with a **works-centric Class-Table-Inheritance** model. The parent `works` row holds what every kind has (slug, title, cover, synopsis, in-universe and real-world dates, provenance); kind-specific detail tables (`book_details`, `film_details`, `channel_details`, `video_details`) carry kind-specific columns and use `work_id` as both PK and FK with `ON DELETE CASCADE`.

Major tables (full list in [`./glossary.md`](./glossary.md) and `src/db/schema.ts`):

- **works** (parent CTI; uuid PK, slug, kind enum, canonicity enum, M-scale dates, source_kind, confidence)
- **book_details, film_details, channel_details, video_details** (kind-specific; PK = work_id FK)
- **eras** (7 reference rows, hand-curated, M-scale)
- **factions** (~25, self-FK for sub-factions, alignment enum)
- **persons** (unified across roles via work_persons.role)
- **series** (book series with totalPlanned)
- **sectors, locations** (galaxy map)
- **characters**
- Junctions: `work_factions`, `work_characters`, `work_locations` (with `at_y` in-universe year), `work_persons`, `work_facets`
- **facet_categories** (12 rows: NEON-14 + 11 editorial), **facet_values** (~85 rows)
- **services** (~18 storefronts; insert-to-add, no migration), **external_links** (per-work junction with `external_link_kind` enum)
- **submissions** (community pipeline quarantine; status enum: pending|approved|rejected|merged)

Discriminator integrity (`works.kind` matches the detail table): enforced both app-side (`insertBook` transactional helper in `scripts/seed.ts` always pairs `works.kind = 'book'` with a `book_details` row) and DB-side (BEFORE INSERT/UPDATE triggers reject mismatched-kind detail rows). Composite-FK + generated literal column was deliberately NOT pursued — Drizzle friction outweighed the marginal hardening gain at solo-dev / single-write-path scale.

Diagram + decision rationale (8 design decisions: CTI for works, string-vs-UUID-IDs, M-scale, faceted classification, services-as-reference, persons-unified, source_kind+confidence on every work, submissions-as-quarantine) in [`../raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md`](../raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md).

## Key types

Domain enums (defined in `src/db/schema.ts`):

- `source_kind` — manual, lexicanum, goodreads, black_library, fandom_wiki, community, tmdb, imdb, youtube, wikidata, wikipedia, open_library, hardcover, llm. **Note:** the latter four (`wikipedia`, `open_library`, `hardcover`, `llm`) are in the Pipeline TS type but NOT yet in the DB enum — Migration 0007 adds them, committed-but-not-applied (3d job).
- `work_kind` — book, film, tv_series, channel, video
- `canonicity` — official, fan_classic, fan, apocrypha, unknown
- `book_format` — novel, novella, short_story, anthology, audio_drama, omnibus
- `book_availability` — in_print, oop_recent, oop_legacy, unavailable
- `person_role` — author, co_author, translator, editor, narrator, co_narrator, full_cast, director, co_director, cover_artist, sound_designer
- `external_link_kind` — read, listen, watch, buy_print, reference, trailer, official_page
- `faction_alignment` — imperium, chaos, xenos, neutral
- `submission_status` — pending, approved, rejected, merged

Numeric: `confidence numeric(3,2)` (0–1.00); `M-scale numeric(10,3)` for in-universe years (`(M-1)*1000 + year_within_M`, e.g. M30.997 = 30997.000).

## Module map

| Path | Responsibility |
|---|---|
| `src/app/` | Next.js App Router routes. One folder = one URL. Server components by default. |
| `src/app/page.tsx` | Hub (entry page; ISR-cached count of books in DB) |
| `src/app/timeline/` | Chronicle (Phase 2 tool 1/3) |
| `src/app/buch/[slug]/`, `/fraktion/`, `/welt/`, `/charakter/` | Detail page stubs (Phase 4 reactivates) |
| `src/app/ingest/` | Phase 3.5 read-only diff inspector |
| `src/components/` | Shared React components, domain-organized |
| `src/db/schema.ts` | Drizzle table definitions — single source of truth |
| `src/db/client.ts` | Cached Postgres connection (postgres-js, SSL required, max=10, prepare=false for pg-bouncer) |
| `src/db/migrations/` | Auto-generated SQL, committed |
| `src/lib/ingestion/` | Pipeline (21 modules) — see [`./pipeline-state.md`](./pipeline-state.md) |
| `scripts/seed.ts` | Loads `seed-data/*.json` into Postgres |
| `scripts/migrate.ts` | Programmatic Drizzle migrator (used by `vercel-build`) |
| `scripts/ingest-backfill.ts` | Pipeline CLI entry (`tsx --env-file=.env.local scripts/ingest-backfill.ts --limit N --offset M`) |
| `scripts/atlas-regen.ts` | Postgres → external `chrono-atlas/` Obsidian vault (post-049) |
| `ingest/.last-run/` | Committed dry-run diff JSON outputs |
| `ingest/.llm-cache/` | Gitignored LLM response cache, keyed by slug + prompt-version-hash |
| `archive/prototype-v1/` | Original HTML prototype, gitignored, read-only reference |
| `brain/` | Engineering memory (this folder, post-049 Karpathy-Reset) |

## Conventions inherited from `/CLAUDE.md`

(See top-level [`/CLAUDE.md`](../../CLAUDE.md) for the full conventions list. Highlights:)

- **TypeScript strict.** No `any`. Type guards over `unknown`.
- **Server components by default.** `'use client'` only when needed (hooks, browser APIs, event handlers).
- **Async params in Next 15.** `params` and `searchParams` are Promises — `await` them.
- **DB access from server only.** `src/db/client.ts` never imported into a `'use client'` component.
- **Migrations via `npm run db:generate` + `db:migrate`.** Generated SQL is committed alongside the schema change.
- **Version pinning is forbidden in briefs / Cowork-side.** Top-level CLAUDE.md is explicit. CC pins versions in `package.json` and documents non-default choices in the session report.

## Decisions log (lightweight ADRs)

The pre-reset ARCHITECTURE.md held an 8-item Decisions section ([snapshot](../raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md#decisions-log)). Decisions are now first-class wiki pages under [`./decisions/`](./decisions/). Major ones:

- [Why Drizzle + Supabase](./decisions/why-drizzle-supabase.md) (2026-04-28)
- [Why custom M-scale](./decisions/why-drizzle-supabase.md#m-scale) — folded into the same page
- [Why no Goodreads](./decisions/no-goodreads.md) (2026-05-02; API discontinued 2020)
- [Why multi-source merge (field-by-field priority)](./decisions/why-multi-source-merge.md) (2026-05-02)
- [Why Haiku 4.5 not Sonnet 4.6](./decisions/why-haiku-not-sonnet.md) (2026-05-04)
- [Why bulk-backfill not daily-drift](./decisions/why-bulk-backfill.md) (2026-05-02)
- [Plan-Reshuffle 2026-05-02](./decisions/plan-reshuffle-2026-05-02.md)
- [Karpathy-Reset 2026-05-08](./decisions/karpathy-reset-2026-05-08.md)

## Out-of-scope (deferred)

- `campaigns` table (no fixture pressure; will land additive when needed)
- `audio_drama_details` (audio dramas modeled as `kind=book` with `format=audio_drama` facet for now)
- Phase-4 provenance / claims-overrides layer
- Custom domain (Phase 7)
