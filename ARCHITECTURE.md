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

See `src/db/schema.ts` for the source-of-truth Drizzle definitions. Stufe 2a
(sessions/2026-05-01-019) replaced the books-centric topology with a
works-centric Class-Table-Inheritance model:

```
                  ┌─────────────┐
                  │    eras     │  reference: 7 rows, hand-curated
                  └─────────────┘

      ┌─────────────┐                          works (parent)
      │  factions   │                          ─────────────────
      │ self-FK     │ ──┐                       id (uuid)
      │ ~25 rows    │   │ many                  kind: enum
      └─────────────┘   │                         book | film | tv_series
                        │                         | channel | video
       ┌────────────────────────┐                canonicity: enum
       │   work_factions        │ ──many──►     slug, title, cover_url, synopsis
       │   role 'primary'|...   │ ──many──►     start_y/end_y (M-scale)
       └────────────────────────┘               release_year (real-world)
                                                 source_kind, confidence
       ┌────────────────────────┐                created_at, updated_at
       │   work_characters      │ ──┐ many
       │   role 'pov'|'appears' │   │
       └────────────────────────┘   │
              │                     │
              ▼                     │
       ┌─────────────┐               │     ┌─────────────────┐
       │ characters  │               │     │ book_details    │ kind=book
       │ id (str)    │               │     │   work_id PK/FK │
       └─────────────┘               │     │   isbn13        │
                                     │     │   series_id ────┼──► series
       ┌────────────────────────┐    │     │   series_index  │
       │   work_locations       │───┐│     └─────────────────┘
       │   role, at_y           │   ││
       └────────────────────────┘   ││     ┌─────────────────┐
              │                     ││     │ film_details    │ kind=film
              ▼                     ││     │   release_date  │
       ┌──────────────────┐         ▼▼     └─────────────────┘
       │   locations      │     (works)
       │   gx, gy         │      ▲▲▲  ▲    ┌─────────────────┐
       │   id (str)       │      │││  │    │ channel_details │ kind=channel
       └──────────────────┘      │││  │    │   platform      │
              │                  │││  │    └─────────────────┘
              ▼                  │││  │
       ┌──────────────┐          │││  │    ┌─────────────────┐
       │   sectors    │          │││  │    │ video_details   │ kind=video
       │   id (str)   │          │││  │    │   channel_work  │
       └──────────────┘          │││  │    │   uploaded_at   │
                                 │││  │    └─────────────────┘
                                 │││  │
       ┌────────────────────────┐│││  │ Discriminator integrity:
       │   work_persons         ││││  │ * App-only via insertBook(...) helper
       │   role enum, note      │││││ │ * DB-side BEFORE INSERT/UPDATE triggers
       └────────────────────────┘│││  │   reject mismatched-kind detail rows
              │                  │││  │
              ▼                  │││  │
       ┌──────────────┐          │││  │
       │   persons    │          │││  │
       │ id (str)     │          │││  │
       └──────────────┘          │││  │
                                 │││  │
       ┌────────────────────────┐│││  │
       │   work_facets          │┘││  │ ┌──────────────────────┐
       │   (work, facet_value)  │ ││  │ │   facet_categories   │ 12 rows
       └────────────────────────┘ ││  │ │ multi_value, visible │
              │                   ││  │ └──────────────────────┘
              ▼                   ││  │           ▲ many
       ┌──────────────────┐       ││  │           │
       │  facet_values    │───────┘│  │ ┌──────────────────────┐
       │  ~85 rows        │        │  │ │ NEON-14 + 11 cats    │
       │  category_id FK  │────────┘  │ └──────────────────────┘
       └──────────────────┘           │
                                      │
       ┌────────────────────────┐     │
       │   external_links       │─────┘  ┌─────────────────┐
       │   kind enum, region    │ ──FK──►│  services       │ ~18 rows
       │   url, label           │        │  (insert-to-add)│
       └────────────────────────┘        └─────────────────┘

       ┌─────────────┐
       │ submissions │  community pipeline (Phase 5)
       │ entity_type │  status: pending|approved|rejected|merged
       │ payload jsonb│
       └─────────────┘
```

### Key design decisions

1. **Class-Table-Inheritance for works.**
   `works` is the parent; `book_details` / `film_details` / `channel_details`
   / `video_details` carry kind-specific columns and use `work_id` as both PK
   and FK with `ON DELETE CASCADE`. We did not use Postgres `INHERITS` (FK
   limitation). Discriminator integrity is enforced both app-side (the
   `insertBook` transactional helper in `scripts/seed.ts` always pairs
   `works.kind = 'book'` with a `book_details` row) and DB-side (BEFORE
   INSERT/UPDATE triggers reject mismatched-kind detail rows). Composite-FK
   with generated literal column was explicitly NOT pursued — Drizzle
   friction was deemed worse than the marginal hardening gain at solo-dev /
   single-write-path scale.

2. **String IDs for reference tables, UUIDs for works.**
   Reference data (`factions`, `eras`, `sectors`, `locations`, `characters`,
   `persons`, `services`, `facet_categories`, `facet_values`) keeps
   human-readable string IDs (e.g. `'thousand_sons'`, `'lexicanum'`,
   `'cw_violence'`). Works get UUIDs because their titles change, slugs
   evolve, and we want stable internal references that don't break.

3. **Custom in-universe time scale.**
   `start_y` and `end_y` are `numeric(10,3)` representing the prototype's
   M-scale: `(M-1)*1000 + year_within_M`. M30.997 = `30997.000`. Lets us
   index and range-query naturally; the UI converts back to "M30.997" for
   display. `release_year` (integer) is the real-world publication axis,
   universal across kinds.

4. **Faceted classification (12 categories, ~85 values).**
   `facet_categories` + `facet_values` + `work_facets` replaces the
   would-be-Cartesian-product of single-purpose tag tables. Categories carry
   `multi_value` and `visible_to_users` flags. NEON-14 trigger warnings are
   one of the 12 categories (per Bridgland et al. 2022). Single-column PK on
   `facet_values.id`; one disambiguation rename (`protagonist_class.xenos` →
   `pc_xenos`) keeps that constraint while honouring the brief's bare-ID
   spirit elsewhere.

5. **Services as reference, links as junction.**
   `services` is FK target (insert to add a new storefront, no migration);
   `external_links` is the per-work junction with an `external_link_kind`
   enum (`read | listen | watch | buy_print | reference | trailer |
   official_page`). URL columns that lived on the old `books` table
   (`goodreads_url`, `lexicanum_url`, `black_library_url`) are gone — every
   external pointer is an `external_links` row.

6. **Persons unified across roles.**
   `persons` covers authors, translators, narrators, directors, cover
   artists, sound designers via `work_persons.role` (pgEnum). Composite PK
   `(work_id, person_id, role)` lets the same person hold multiple roles on
   the same work. Authors-only queries are RQB-side (`where role='author'`).

7. **`source_kind` + `confidence` on every work.**
   When ingestion (Phase 4) scrapes from multiple sources, conflicts will
   happen. We record where each row came from and a 0–1 confidence so we
   can prioritize manual edits over scraped values, and re-scrapes don't
   clobber human curation. `source_kind` extended in Stufe 2a with `tmdb`,
   `imdb`, `youtube`, `wikidata` ahead of non-book Phase 3/5 ingestion.

8. **`submissions` is a quarantine, not a queue.**
   User submissions never write to canonical tables. The `submissions` table
   holds the proposal as `payload jsonb`; an admin reviews and triggers the
   actual `INSERT` in `works`/`book_details`/etc. This means spam never
   breaks the catalog. Schema unchanged in Stufe 2a; rewiring to the new
   tables is a later brief.

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

### 2026-05-01 — Stufe 2a: works/CTI + facets + external_links + persons (sessions/2026-05-01-019)

The books-only schema collapsed into a works-centric Class-Table-Inheritance model so non-book works (films, TV series, YouTube channels, individual videos) can attend the catalog without polymorphic columns or wide nullables. Reasons:

- **Bookish columns become book-specific.** `isbn13`, `series_id`, `series_index` move into `book_details`; the parent `works` row holds only what every kind has (slug, title, cover, synopsis, in-universe and real-world dates, provenance). The discriminator (`works.kind`) is enforced both via a transactional `insertBook` helper in the seed and via DB-level CHECK triggers — composite-FK + generated literal column was deliberately NOT pursued (Drizzle friction outweighed the marginal hardening gain at the current single-write-path scale).
- **Faceted classification** (12 categories, ~85 values, NEON-14 trigger warnings included) replaces the would-be-Cartesian-product of single-purpose tag tables. Categories carry `multi_value` and `visible_to_users` flags; values use single-column PK with one disambiguation rename (`protagonist_class.xenos` → `pc_xenos`) to avoid colliding with `pov_side.xenos`.
- **External links** consolidate per-platform URL columns (`goodreads_url`, `lexicanum_url`, `black_library_url` from the old books table) into a `services` reference table + `external_links` junction. New storefronts arrive as inserts, not migrations; affiliate flag is per-link, ready for later activation.
- **Persons** unifies authors, translators, narrators, directors, cover artists, and sound designers. Composite PK `(work_id, person_id, role)` lets the same person hold multiple roles on the same work; `extras jsonb` on `persons` (kept where the use case was concrete) covers role-specific bookkeeping. `works` and `book_details` deliberately do NOT carry `extras` — the old `books.extras` was never populated.
- **Migration strategy:** Forward-only, two-file split (`0002_drop_book_tables` + `0003_create_works_foundation`). Drizzle-kit's interactive rename-resolver requires a TTY which the CI/automation path doesn't provide; splitting into a pure-drop migration followed by a pure-create migration sidesteps the rename ambiguity entirely. Existing 0000/0001 untouched.

Out-of-scope (deferred): `campaigns` (no fixture pressure for it; will land as additive migration with FK-validated junction when needed), `audio_drama_details` (audio dramas modelled as `kind=book` with `format=audio_drama` facet for now), Phase 4 provenance/claims-overrides layer, DetailPanel + deep-linking (parked on session 018, reactivated as Stufe 2c).
