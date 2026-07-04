---
title: Glossary
type: reference
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../src/db/schema.ts
  - ../../src/lib/ingestion/types.ts
  - ../../scripts/seed-data/README.md
  - ../../sessions/archive/2026-05/2026-05-01-019-arch-schema-foundation.md
  - ../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md
  - ../../sessions/archive/2026-05/2026-05-03-037-impl-phase3b-aux-sources.md
  - ../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
related:
  - ./architecture.md
  - ./pipeline-state.md
confidence: high
---

# Glossary

> Project-specific terms. Each entry: 1–3 sentences + example + cross-link. Terms requiring full architectural reasoning live as their own page under [`./decisions/`](./decisions/) or `concepts/` — none planned this session.

## Domain & schema

**M-scale.** Custom in-universe time scale. `(M-1)*1000 + year_within_M`, stored as `numeric(10,3)`. M30.997 = `30997.000`; M41.999 = `41999.000`. Lets all ordering/range queries be trivial; UI converts back to "M30.997" for display. See [`./architecture.md`](./architecture.md). Adjacent term: `release_year` is the real-world publication axis (integer, separate column).

**source_kind.** pgEnum on `works.source_kind` recording where each row originated. Values: `manual | lexicanum | goodreads | black_library | fandom_wiki | community | tmdb | imdb | youtube | wikidata | wikipedia | open_library | hardcover | llm`. The latter four are in the Pipeline TypeScript type but **not yet in the DB enum** (Migration 0007 adds them, committed-but-not-applied — applies on 3d). Used together with `confidence` to prioritize manual edits over scraped values.

**confidence.** `numeric(3,2)` on `works`, range 0–1.00. Set per source via `src/lib/ingestion/source-confidence.ts`. Manual = 1.00; Lexicanum-only = 0.85; multi-source merged ≥ 0.90; LLM-only synopsis = 0.70 (paraphrase, not facts). The Apply-Step's UPSERT uses `WHERE source_kind != 'manual'` to never clobber human curation.

**work_facets.** Junction table `(work_id, facet_value_id)` with composite PK. Connects `works` to `facet_values`. Replaces the would-be-Cartesian-product of single-purpose tag tables. Categories: tone, mood, theme, content_warning (NEON-14), pov_side, pacing, length_tier, prestige, faction (sub-archetype), entry_point, era_anchor, format-tag.

**primaryEra (`book_details.primary_era_id`).** Editorial era-anchor per Stufe 2c.0 (sessions 023/024). Replaces the algorithmic Era-Bucketing — every book has an explicit FK to `eras.id`. Guarded by `npm run check:eras` (CI step). Multi-Era visibility for cross-millennium novels (e.g. *The Infinite and the Divine*) is open question 4 in [`./open-questions.md`](./open-questions.md).

**secondary_era_ids.** Proposed `text[]` column on `book_details` for Multi-Era-Sichtbarkeit. Not implemented yet. See open question 4.

## Pipeline

> ⚠ **Retired-Subsystem (Brief 177, 2026-07-03).** Der V1-Crawler + die V2-LLM-Engine sind physisch gelöscht; die Begriffe in diesem Abschnitt (Pipeline-Engine, Aux-Source, Manual-Protection-Comparator, SourceCrawler, batched-3e, die Crawl-`source_kind`-Werte) sind **historisch**. Lebender Ingest = Per-Buch-SSOT (`apply:book`) + Podcast-Delta + Weekly-Refresh — siehe [`./pipeline-state.md`](./pipeline-state.md) (Retirement-Banner).

**Pipeline-Engine.** The core merge logic in `src/lib/ingestion/merge.ts` + `field-priority.ts` + `dry-run.ts`. Input: `SourcePayload[]` from N source crawlers. Output: `MergedBook` with field-by-field-resolved values + `fieldOrigins` audit trail. Extensible: new source pairs add a `SourceCrawler` to the engine without engine refactor (verified 3a → 3b → 3c).

**Aux-Source.** Crawler used for *enrichment*, not for discovery. Contrasts with Wikipedia (the discovery source). Aux-Sources in 3b: Open Library (hard-facts: cover/ISBN/pageCount), Hardcover (soft-facts: tags/rating). Lexicanum is more of an enrichment source than discovery (URL-probing, not master-list parsing).

**Manual-Protection-Comparator.** Logic in `src/lib/ingestion/dry-run.ts` that detects when a discovered book maps to a manually-curated entry (the 26 Stufe-2b books). Compares title-normalized strings against existing slugs; suffix-id slug-format aware. Result: marks the diff entry as `skipped_manual` so re-runs don't try to overwrite hand-curated rows.

**junctionsLocked.** Proposed `boolean` flag on `works` (added in 3d-Apply migration). When `true`, future crawler runs skip writing to junction tables (`work_factions`, `work_locations`, `work_characters`). Lets Cowork hand-curate junctions for prestige reads without fearing pipeline overwrites. Currently aspirational; Apply-Step adds it.

**fieldOrigins.** Field on `MergedBook` (audit slot, not in DB): `Record<string, SourceName>`. Records which source won each field. Used by `pickPrimarySource` (post-047) and by humans inspecting why a particular value was chosen. Visible in committed diff JSONs.

**fieldConflict.** Diff-entry-level marker when ≥2 sources offered a value for the same field and they disagreed. Pre-047: 11/15 in batch-044 (mostly `releaseYear` re-issue traps). Post-047: 0/9 in test slice (Lever D fixed it).

**discovered.** Output set of the Wikipedia master-list parser: array of book slugs that exist on Wikipedia's W40k-novel lists. ~700 unique post-3b across 4 pages. Used as the work-list driver for batches.

**discoveryDuplicates.** Audit slot on the discovery output: when a book appears on multiple Wikipedia lists, the parser dedupes and records the cross-page count. 96 cross-page entries in 3b (mostly HH novels appearing on both Hauptliste + HH-novels-list).

## LLM enrichment

**llm_flags.** Audit-slot on diff entries; an array of `{kind, reason, …}`. Kinds: `year_glitch`, `data_conflict`, `series_total_mismatch`, `author_mismatch`, `proposed_new_facet`, `value_outside_vocabulary`, `insufficient_web_search`, `no_storefronts_found`, `no_rating_found`. Triage in 3d-Apply: auto-applied (year_glitch + data_conflict-with-≥2-sources), Cowork-Review (proposed_new_facet, author_mismatch in multi-author books), ignored (insufficient_web_search, no_storefronts_found, no_rating_found, value_outside_vocabulary).

**llm_cache.** Filesystem cache under `ingest/.llm-cache/<slug>.json`. Keyed by slug + prompt-version-hash. Hit on re-run avoids the $0.10–0.35 LLM cost. Invalidated automatically when the prompt source changes (hash baked into the cache record).

**llmCostSummary.** Per-run aggregate in the diff JSON: total tokens (input/output/web-search), total cost (USD), per-book mean. Phase-3c added; lets Cowork compare runs ($5.88 in 044, $0.114/book post-047). Source: `src/lib/ingestion/llm/enrich.ts`.

**rawLlmPayload.** Per-book audit slot in the diff: full LLM tool-use response including `facetIds[]`, `discoveredLinks[]`, `synopsis`, `flags`. 3d-Apply uses this for FK-resolution (facetIds → `facet_values.id` for `work_facets`; discoveredLinks → `services.id` for `external_links`).

**Two-pass merge.** `processOne` in pipeline runs (a) source crawl + merge → MergedBook (pass 1), (b) LLM enrichment with the merged data as context → enriched MergedBook (pass 2). LLM output (synopsis, soft-facets, format/availability, rating, junction names, plausibility flags) folds back into the MergedBook before diff-writing. Stress-test of the 3a engine: 3c shipped without engine refactor.

## Pipeline ops

**dry-run.** The pipeline mode where it reads sources, merges, calls LLM, but writes ONLY to `ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json` — never to Postgres. Default for all of 3a–3c; the *only* mode currently. 3d adds an apply mode behind an explicit `--apply` flag.

**apply-step (3d).** The not-yet-shipped sub-phase that takes a committed diff and writes it to Postgres with `ON CONFLICT … WHERE source_kind != 'manual'` UPSERTs. Plus FK-resolution for the three relational sets (work_persons, work_facets, external_links), ALTER TYPE source_kind (Migration 0007), UNIQUE INDEX `external_links (work_id, kind, service_id)`, and `junctionsLocked` flag.

**override.** Cowork-side correction file (CSV / Markdown) consumed by 3d-Apply alongside the diff. Format TBD (open question 3 in [`./open-questions.md`](./open-questions.md)). Encodes Philipp's external Hand-Check decisions (a particular book's `chaos`-pov_side, a `duty`-tag promotion, a re-anchored `primary_era_id`).

**batched-3e.** Phase-3 strategy adopted 2026-05-04: instead of one 800-book overnight run, 8–16 sessions of 50–100 books each, with diff-inspection and Cowork-flag-triage between batches. Batch 1 (books 41–90) shipped in 044. Resume mechanism in `scripts/ingest-backfill.ts` lets a Ctrl-C'd run pick up at the next book.

## Sources & cross-references

**SourceCrawler.** Type contract every source pair conforms to. Defined in `src/lib/ingestion/types.ts`. `discover(roster?)` returns the discovery output (only Wikipedia uses this in practice); `fetchOne(slug)` returns a `SourcePayload` with the source-specific fields. Plugin-pattern via tagged union `SourceName: "wikipedia" | "lexicanum" | "open_library" | "hardcover" | "llm"`.

**SourcePayload.** What a single source returns for one book: `{ source: SourceName, fields: Partial<MergedFields>, audit: unknown, errors: ErrorEntry[] }`. The `fields` object is sparse — sources fill what they know.

**MergedBook.** What the merge engine produces per book: resolved `fields` + `fieldOrigins` + `sources[]` + `auditPayloads` + `primarySource` + `confidence` + LLM slots. The diff entry wraps this with `slug`, `kind` (`added | updated | skipped_manual`), `flags`, `errors`.

**External Atlas / chrono-atlas.** External Obsidian vault at `~/chrono-atlas/` (not in repo). Mechanically generated from Postgres via `npm run atlas:regen`. Holds per-book Markdown files for graph-view + cross-page browsing. **Never auto-loaded.** See [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md) and [`./decisions/karpathy-reset-2026-05-08.md`](./decisions/karpathy-reset-2026-05-08.md).

**Brain.** This folder (`brain/` in repo). Engineering memory, Karpathy-style LLM Wiki. See [`../CLAUDE.md`](../CLAUDE.md) for the schema.
