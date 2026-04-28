# Architecture

> A living description of the system. Update this when major decisions change. Schema and code are the truth — this doc is the *map*.

---

## High level

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
                        │ ingest/ (Python, Phase 4)│
                        │ - Lexicanum scraper      │
                        │ - Goodreads scraper      │
                        │ - merge + load to Postgres│
                        └──────────────────────────┘
```

**Why this shape?**
The frontend is mostly statically renderable (book pages don't change per visitor) but the database is real — that gives us SEO, fast loads, and a path to community submissions without rewrites.

---

## Database schema (overview)

See `src/db/schema.ts` for the source-of-truth Drizzle definitions. Quick reference:

```
                       ┌─────────────┐
                       │   eras      │  reference: 7 rows, hand-curated
                       └─────────────┘

           ┌─────────────┐         ┌─────────────┐
           │  factions   │ ←self── │  factions   │  hierarchical (parent_id)
           │ id, parent  │         │             │  ~25 rows
           └─────────────┘         └─────────────┘
                  ▲
                  │ many ┌──────────────┐
                  └──────│ book_factions│ (junction)
                         └──────────────┘
                                ▼
                         ┌──────────────┐         ┌────────────┐
                         │    books     │ ───►──── │   series   │
                         │ uuid pk      │  many   │            │
                         │ slug         │  to one │            │
                         │ startY/endY  │         └────────────┘
                         └──────────────┘
                                ▲     ▲
                          many  │     │ many
                                │     │
                       ┌────────────┐ ┌────────────────┐
                       │book_chars  │ │ book_locations │
                       └────────────┘ └────────────────┘
                                ▼     ▼
                       ┌────────────┐ ┌────────────────┐
                       │ characters │ │   locations    │ ──► sectors
                       │ id (str)   │ │   id (str)     │     id (str)
                       └────────────┘ │   gx, gy       │
                                      └────────────────┘

                       ┌─────────────┐
                       │ submissions │  community pipeline (Phase 5)
                       │ entity_type │  status: pending|approved|rejected|merged
                       │ payload jsonb│
                       └─────────────┘
```

### Key design decisions

1. **String IDs for reference tables, UUIDs for books.**
   Reference data (`factions`, `eras`, `sectors`, `locations`, `characters`) keeps the human-readable string IDs from the prototype (e.g. `'thousand_sons'`). Books get UUIDs because their titles change, slugs evolve, and we want stable internal references that don't break.

2. **Custom in-universe time scale.**
   `startY` and `endY` are `numeric(10,3)` representing the prototype's M-scale: `(M-1)*1000 + year_within_M`. M30.997 = `30997.000`. Lets us index and range-query naturally; the UI converts back to "M30.997" for display.

3. **`source_kind` + `confidence` on every book.**
   When ingestion (Phase 4) scrapes from multiple sources, conflicts will happen. We record where each row came from and a 0–1 confidence so we can prioritize manual edits over scraped values, and re-scrapes don't clobber human curation.

4. **`extras` jsonb column on books.**
   Scrapers find quirky data (audiobook narrator, "this is a novella," short-story collection contents). Rather than columns for every possible field, we drop them in `extras`. Fields that prove useful get promoted to real columns later.

5. **`submissions` is a quarantine, not a queue.**
   User submissions never write to canonical tables. The `submissions` table holds the proposal as `payload jsonb`; an admin reviews and triggers the actual `INSERT` in `books` etc. This means spam never breaks the catalog.

---

## Module map

| Path | Responsibility |
|---|---|
| `src/app/` | Routes (Next.js App Router). One folder = one URL. |
| `src/app/layout.tsx` | Root HTML, fonts, global metadata |
| `src/app/page.tsx` | Hub (entry page) |
| `src/app/timeline/`, `/map/`, `/ask/` | The three primary tools |
| `src/app/buch/[slug]/`, `/fraktion/`, `/welt/`, `/charakter/` | Detail pages |
| `src/components/` | Shared React components, organized by domain |
| `src/db/schema.ts` | Drizzle table definitions — single source of truth |
| `src/db/client.ts` | Cached postgres connection |
| `src/db/migrations/` | Auto-generated SQL, committed to git |
| `src/lib/` *(future)* | Pure utilities: `slugify`, `mScale`, `recommend` |
| `scripts/seed.ts` | Migrates legacy prototype data into Postgres |
| `ingest/` *(future, Phase 4)* | Python crawlers + merge/load pipeline |
| `archive/prototype-v1/` | Original HTML prototype, read-only reference |

---

## Decisions log

Lightweight ADRs (Architecture Decision Records). Append, don't edit historical entries.

### 2026-04-28 — Stack: Next.js + Supabase + Drizzle on Vercel

We considered Vite+React with JSON files in repo. Decided against because:
- Project will have many page types (book, faction, world, character) → routing matters → Next.js fits Vercel's strengths
- Data will grow via scraping → SQL beats hand-written JSON files at >500 books
- Reddit launch wants per-page Open Graph + SEO → server-rendered HTML is essential

### 2026-04-28 — Custom M-scale instead of normalized real years

We could store dates as actual integers (year-within-millennium) and a separate `millennium` column. Decided to keep the prototype's flat numeric scale because:
- All ordering/range queries become trivial (`WHERE start_y BETWEEN 30998 AND 31014`)
- The UI display layer can format as "M30.998" without DB joins
- Consistent with the existing prototype data — zero conversion needed for seed
