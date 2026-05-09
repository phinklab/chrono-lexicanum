---
title: Book data overview
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../scripts/seed-data/books.json
  - ../../sessions/archive/2026-05/2026-05-01-021-arch-rich-seed-2b.md
  - ../../sessions/archive/2026-05/2026-05-02-022-impl-rich-seed-2b.md
  - ../../ingest/.last-run/backfill-20260508-2101.diff.json
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
related:
  - ./pipeline-state.md
  - ./project-state.md
  - ./workflows/atlas-regen.md
confidence: high
---

# Book data — high-level numbers

> **NOT a per-book index.** This page answers *how much data do we have, in what shape, where is it canonical*. Per-book detail (synopses, factions, plot, sources) lives in **Postgres** (canonical) and the external **Atlas** (mechanical mirror via `npm run atlas:regen`).
>
> This page exists in Brain so the LLM can answer "roughly how many books, how complete, what's the latest cost" without paging in 800-book detail. If you find yourself adding per-book detail here, stop — that's an Atlas concern.

## Sources of book data

| Where | Status | What's there |
|---|---|---|
| `scripts/seed-data/books.json` | committed, 26 books | Hand-curated Stufe 2b roster (sessions 021/022). Full annotation: factions, persons, facets, external_links. Every field hand-verified by Philipp. |
| Postgres (`works` + `book_details` + junctions) | live | The 26 manuals + reference tables (eras, factions, sectors, locations, persons, services, facet_categories, facet_values, characters, series). No pipeline-discovered books yet (3d-Apply not shipped). |
| `ingest/.last-run/*.diff.json` | committed, 7 files | Dry-run pipeline outputs. Latest: `backfill-20260508-2101.diff.json` (9 books, 2026-05-08, post-047 hardening). Older runs visible at `/ingest` route. |
| Pipeline discovery (Wikipedia master-lists) | dry-run | ~700 unique books across 4 lists (Hauptliste + HH-novels + Siege_of_Terra + Eisenhorn). Post-3b numbers: 701 unique, 96 cross-page-duplicates resolved. |
| External `chrono-atlas/` Obsidian vault | regenerated on demand | Mechanical mirror of Postgres via `npm run atlas:regen`. Default `~/chrono-atlas/`. |

## Counts at a glance

- **Manual books seeded in DB:** 26 (Stufe 2b)
- **Discovered via pipeline:** ~700 (Wikipedia master-lists, 4 pages, dry-run only)
- **Books written to DB by the pipeline:** 0 (Apply-Step 3d not shipped)
- **Books with full pipeline-enriched data (committed diffs, dry-run):** ~80 cumulatively (5 in 035 + 7 in 037 + 20 in 039 + 20 in 042 + 50 in 044 + 9 in 047 — with overlap on the 1–40 testing slice)
- **Reference rows (canonical):** 7 eras, ~25 factions, 21 series, sectors+locations, ~85 facet values across 12 categories, 18 services
- **Junctions populated:** all 26 manuals have full faction/character/facet/external_link annotation

## Latest pipeline cost

From `backfill-20260508-2101.diff.json` (9 books, 047-impl test):

- **$0.114/book** (–3% vs 044 baseline of $0.118/book)
- Extrapolated voll-lauf for ~750 remaining: **~$85** (close to original Brief-040 estimate of $88)
- Driven by Anthropic Haiku 4.5 + Web Search; Sonnet 4.6 alternative would be ~3× more expensive (see [`./decisions/why-haiku-not-sonnet.md`](./decisions/why-haiku-not-sonnet.md))

## What "26 manuals" includes

The Stufe 2b roster (sessions 021/022) prioritized prestige reads with clean lore-anchors:

- Eisenhorn: Xenos / Malleus / Hereticus
- Ravenor: Ravenor / Ravenor Returned / Ravenor Rogue
- Horus Heresy selected first-Phase entries
- Gaunt's Ghosts entry points
- Standalone classics with strong protagonist-class signals

Full list: `scripts/seed-data/books.json`. Per-book inspection: in Postgres (`SELECT slug, title FROM works WHERE kind='book' AND source_kind='manual'`) or in the Atlas after `npm run atlas:regen`.

## What's NOT here

- **Per-book synopsis, plot, factions, sources, ratings.** Postgres + Atlas.
- **Per-pipeline-run drill-down.** That's `/ingest` route + `/ingest/[runId]` (Phase-3.5 dashboard) for committed diffs, or per-diff JSON inspection for raw.
- **Future-roster planning** (which 800 books we ultimately want, in what order). Mostly subsumed by Wikipedia's master-list — the discovery output IS the planned roster, modulo Cowork-side filtering for prestige sequencing.

## Cross-references

- For pipeline detail (modules, levers, current numbers): [`./pipeline-state.md`](./pipeline-state.md)
- For the regen flow: [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md)
- For why we chose this multi-source-merge architecture: [`./decisions/why-multi-source-merge.md`](./decisions/why-multi-source-merge.md)
- For why bulk-backfill (not daily-drift): [`./decisions/why-bulk-backfill.md`](./decisions/why-bulk-backfill.md)
- For the Stufe-2a schema redesign that put 26 books in: [`./architecture.md`](./architecture.md)
