---
title: Why Excel-SSOT, not Crawl-Discovery
type: decision
created: 2026-05-10
updated: 2026-05-10
sources:
  - ../../../sessions/archive/2026-05/2026-05-10-057-arch-excel-roster-import.md
  - ../../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md
  - ../../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md
  - ../../../scripts/seed-data/source/Warhammer_Books_SSOT.xlsx
  - ../../../scripts/seed-data/book-roster.json
related:
  - ./why-bulk-backfill.md
  - ./why-multi-source-merge.md
  - ../pipeline-state.md
  - ../project-state.md
confidence: high
decision-date: 2026-05-10
---

# Why Excel-SSOT, not Crawl-Discovery

**Status:** active · **Decided:** 2026-05-10 · **Sessions:** [057-arch](../../../sessions/archive/2026-05/2026-05-10-057-arch-excel-roster-import.md), [057-impl](../../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md)

## Context

Phase 3's discovery layer (V1 + V2) was built on the assumption that **Wikipedia + TLBranson master-lists are the canonical roster**. The pipeline's Stage 0 crawls both sources, dedupes, and produces a `DiscoveredBook[]` that drives the per-book crawl + LLM-enrichment. Two parallel sub-decisions held this together: [why-bulk-backfill](./why-bulk-backfill.md) (single one-time event in batches) and [why-multi-source-merge](./why-multi-source-merge.md) (field-by-field source priority).

The 055 V2-Voll-Lauf (50 books, slug-window `13th-legion → ascension`) tested the assumption empirically and surfaced three structural problems:

1. **Discovery is noisy.** The slug-window included `about-warhammer-40k`, `about-the-horus-heresy`, `above-and-beyond` — Wikipedia entries with italic `<li>` items that aren't books. TLBranson cross-link articles ("Ways to Read", "Books in Order") leaked through pre-fix and continue to leak in long-tail patterns. Each garbage entry costs LLM calls + Lexicanum throttle slots before Validators can reject it.
2. **Roster ordering is incidental.** Slug-sort produces an arbitrary 50-book window. There is no curatorial signal — no "do these books before those", no "skip junk entries entirely", no "this is an out-of-print short story we don't want in v1". The pipeline hits everything in the order it discovers it.
3. **Operational latency dominates.** A 100-book Voll-Lauf was estimated at ~70 minutes of pure Lexicanum throttle (CRAWL_DELAY 5s × 11 URL patterns × ~70% lex-missing rate). Even with the per-page Lex-Cache fix from Brief 056, cold-runs through fresh discovery slugs remain expensive in wall-clock — not session-completable.

In parallel, Maintainer (Philipp) had been maintaining a curated Excel master-list externally with an LLM-assisted workflow, dedup-merging tlbranson Books + Horus Heresy + Wikipedia-Master into a single sheet with stable IDs (`W40K-NNNN`, `HH-NNNN`), explicit Type/Section/Series fields, and a separate "Collection Links" sheet capturing the 192 anthology/omnibus M2M relations TLBranson half-encodes in prose. By 2026-05-10 the file was at **859 books + 192 collection links + 100% Type/Section/URL coverage**.

## Options considered

- **A — keep crawl-discovery.** Continue building Stage 0 around Wikipedia + TLBranson with progressively more aggressive filters (book-likeness heuristic, italic-text rejection, anthology-detection-pre-LLM). **Rejected.** Filter-game is whack-a-mole; each batch reveals new garbage patterns. Curatorial decisions ("we don't want X in v1") have no representation in the pipeline. The Maintainer-Excel already exists with cleaner data; reproducing it via filters wastes the work that went into the Excel.
- **B ✅ chosen — Excel-SSOT in repo.** Maintainer commits the Excel under `scripts/seed-data/source/`; a Loader (`scripts/import-ssot-roster.ts`) reads it and writes a deterministic `scripts/seed-data/book-roster.json` (859 books + 191 collections, byte-identical re-runs verified via SHA256). Pipeline Stage 0 (Discovery) is replaced by `book-roster.json` as the input. Stage 1 (Source-Claims-Crawl) + Stage 3 (LLM-Enrichment) continue to enrich the curated roster. Hand-edits to the Excel survive re-imports because the Excel itself is the source-of-truth.
- **C — DB-only roster, no JSON intermediate.** Maintainer-Excel imports directly into Postgres (works rows + FKs). **Rejected** for now — Loader-output as JSON keeps the dry-run + diff-inspection workflow intact. The diff inspector at `/ingest` still works; nothing about the existing pipeline-output shape changes. Migration to DB is a separate downstream step (3d-Apply).

## Decision

**Option B.** Specifically:

- **Excel-SSOT under `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`.** Maintainer-edited externally, committed when ready.
- **Loader `scripts/import-ssot-roster.ts`** reads the Excel and writes `scripts/seed-data/book-roster.json` (deterministic, SHA256-verifiable). 859 RosterBook entries + 191 RosterCollection entries.
- **Schema-Migration 0008 `ssot_schema.sql`** added: `bookFormat`-Enum +3 values (`collection`, `artbook`, `scriptbook`), `sourceKind`-Enum +1 (`ssot`), `works.external_book_id varchar(16) UNIQUE` (links Excel-IDs back to UUID rows), `bookDetails.notes text`, new `work_collections`-Junction (composite PK `(collection_work_id, content_work_id)`, `display_order int`, `confidence numeric(3,2)`, `basis text`, both FKs cascade) for the M2M anthology/omnibus relation.
- **Hard delete of the 26 hand-curated Stufe-2b books** via `scripts/db-reset-for-ssot.ts` (confirm-gated). Hand-tagged junctions go away; the LLM-pipeline rebuilds them from the 859 fresh.
- **Pipeline refactor (Brief 058)**: `run-batch.ts` gets a `--source=ssot --offset=N --limit=M` mode that reads from `book-roster.json`. Discovery-Stage 0 (Wikipedia + TLBranson) is skipped in SSOT-mode. Stage-1-Validators that the Excel makes redundant are trimmed (`year_outlier` raw publication year is fixed; `author_editor_suspicion` becomes redundant because `format` + `editorialNote`/`editors` come from the Excel). Stage-3-LLM-Tool-Schema shrinks (Author/Year/Format/Title raus aus LLM-Output — Excel-fix; only soft fields like Synopsis + Junctions + in-universe-time remain).

## Why

- **The Maintainer-curation already exists** and is higher quality than any filter-cascade we'd build on top of crawl-discovery. Excel = 100% Type/Section/URL coverage, 99.88% Year coverage, deduped, junction-Collection-Links explicit.
- **Curatorial decisions get a home.** "Drop this book", "rename this title", "this is an audio drama not a novel", "merge these two Wikipedia entries" — all expressible as Excel-edits, all surviving re-imports.
- **Operational latency drops radically.** A curated 10-book session avoids the slug-window-roulette: 10 books × 60s Lex-throttle (cold cache) = 10 min, session-completable. Re-runs are ~13ms/book (warm cache from Brief 056). 10er-Batch-Reihe is the new operational unit.
- **Existing pipeline machinery preserved.** Stage 1 (Source-Claims-Crawl), Stage 2 (Validators), Stage 3 (Slim-LLM), Stage 4 (Diff-Writer) all continue to do their jobs — they just enrich a curated 859-roster instead of a noisy 1040-discovery. The diff format stays the same; `/ingest` dashboard rendering stays the same.
- **JSON intermediate keeps the dry-run shape intact.** Loader produces `book-roster.json`; pipeline reads it; diff lands under `ingest/.last-run/`. No DB-write coupling forced into the curation step. DB-Apply remains a separate downstream decision (3d).
- **Cost-Argument.** The Maintainer-Excel-workflow externalizes the *roster curation* cost (LLM-assisted, but human-in-the-loop). The pipeline keeps doing what it's good at: per-book enrichment with provenance. Splitting the responsibilities is cleaner than asking the pipeline to be both curator and enricher.

## When this decision should be revisited

- **If Excel-Maintenance-Burden becomes too large.** If Maintainer finds the per-update workflow (edit Excel → re-run loader → commit JSON) painful, or if the LLM-assisted curation step becomes too time-intensive to keep up with new releases, revisit. Likely successor: a hybrid mode where the Excel covers the canonical 800 + an optional "discovery overlay" pulls fresh Wikipedia entries for review and Maintainer-import.
- **If the pipeline produces enrichment quality that diverges from the Excel-canonical fields** (e.g. LLM-Output consistently overrides the Excel-Year because Lexicanum-Setting is more accurate). Revisit whether the Excel should be authoritative-by-default or merely a roster-+-defaults layer.
- **If a 3d-Apply-Step ships and the JSON-intermediate becomes redundant** (Excel could load directly into Postgres via a dedicated importer skipping `book-roster.json`). Probably worth doing once the Apply-Step is real and stable; not before.
- **If Maintainer-Excel grows past ~2 MB or adds many sheets.** Current single-Excel-single-Loader-pattern would need refactoring for multi-file or per-sheet-loaders.

## Aftermath

Brief 057 (this session, 2026-05-10) shipped the schema-migration + truncate-script + Loader. Migration apply + truncate-smoke deferred to Maintainer-trigger (`.env.local` points to prod-Supabase; CC's lokale Sandbox kann nicht apply'n).

Open Questions OQ7 (Master-Liste-Crawl-Build) and OQ8 (Roster-Index-Selektor in alter Form) are **resolved by this decision** — no separate crawl-build is needed (the Excel is the master-list), and the Roster-Index-Selektor lives now in the SSOT-mode of `run-batch.ts` (Brief 058).

The 10er-Batch-Reihe (Briefs 058+) is the operational consequence: small, session-completable, Maintainer-reviewable batches with surface-form-collection feeding the eventual Resolver-Brief (after ~30–50 real-prozessierte Bücher). Resolver + Unresolved-Queue (OQ4 + OQ5) wait on that empirical base.
