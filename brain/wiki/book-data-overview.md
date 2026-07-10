---
title: Book data overview
type: overview
created: 2026-05-09
updated: 2026-07-10
sources:
  - ../../scripts/seed-data/books/
  - ../../scripts/seed-data/map-worlds.json
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../ingest/refresh/2026-W28/report.md
related:
  - ./pipeline-state.md
  - ./project-state.md
  - ./workflows/atlas-regen.md
confidence: high
---

# Book data — high-level numbers

> Engineering-scale overview, not a per-book index. Per-work content lives in Postgres and the external generated Atlas.

## Canonical shape

- **896 books** in `scripts/seed-data/books/<slug>.json` (`book-v1`), one durable file per book.
- Split: **599 W40K** (`W40K-0001…0599`) + **297 Horus Heresy** (`HH-0001…0297`).
- **59** files contain collection membership, totaling **196 collection edges**.
- Postgres `works` + `book_details` + junction tables are the runtime source of truth after apply.
- `scripts/seed-data/books.json`, the master Excel, old roster/extension and override batches are frozen historical/equivalence inputs, not the live corpus.

## Coverage layers

- Books carry bibliographic/detail data, synopsis and curated relations through the per-book files and reference catalogs.
- Entity blurbs cover the established faction/character/location sets; per-row provenance remains in the seed data.
- Timeline membership comes from curated event/work and setting-date data, not automatic prose extraction.
- Cartographer is a separate static projection: 1,055 catalog worlds and 1,352/1,710 placed work edges. Location linkage and map placement are related but not identical.
- Podcasts are separate work kinds, currently 1,114 applied episode works; they are not counted in the 896 books.

## Apply and rebuild

- Target one book: `npm run apply:book -- --slug <slug>`.
- Converge the corpus: `npm run apply:book -- --all --mode post-retirement` (step 2 of `db:sync`).
- Verify without healing: `apply:book --verify` / `db:drift`.
- Disaster recovery uses confirm-gated `db:rebuild`; the per-book files must be sufficient to restore the book corpus.

The migration from legacy batches to per-book files was proven DB-free with an empty projection diff: 896 books, zero row deltas and 196/196 collection edges.

## New releases

Weekly Refresh detects candidate books but does not auto-promote them. A maintainer chooses promote/ignore/defer; promoted works get a curated per-book file and targeted apply after merge. In W28 both proposed books were correctly ignored, so the corpus remains 896.

## Known data debt

- Blanket `primary_era_id = time_ending` is false editorial data and is promoted into the launch Era fix.
- 315 character sentinels remain parked for future hand curation.
- Per-book detail belongs in Postgres/Atlas, never this Brain page.
