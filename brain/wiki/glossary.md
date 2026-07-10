---
title: Glossary
type: reference
created: 2026-05-09
updated: 2026-07-10
sources:
  - ../../src/db/schema.ts
  - ../../scripts/book-apply-shared.ts
  - ../../src/lib/map/voyages/
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
related:
  - ./architecture.md
  - ./pipeline-state.md
confidence: high
---

# Glossary

> Current project-specific terms. Retired crawler/LLM terminology lives in git history and archived pipeline reports, not in the active glossary.

## Domain and schema

**M-scale.** Numeric in-universe time representation: `M * 1000 + yearWithinM`, stored as `numeric(10,3)`. Example: M30.997 → `30997.000`. Real publication year is a separate field.

**work.** Shared parent entity in the CTI schema. Books, podcast shows/episodes, film/TV/channel/video kinds share identity and common metadata in `works`; kind-specific detail tables carry specialized fields.

**externalBookId.** Stable maintainer-facing ID (`W40K-*` / `HH-*`) that identifies a book across per-book files, review artifacts and applies. It is not the database UUID or URL slug.

**source_kind / confidence.** Work-level provenance and confidence. Current enum includes manual/reference sources plus `ssot`, `podcast_rss` and the historical crawler sources. Their presence in the enum does not mean the retired crawler is active.

**primary Era.** Nullable `book_details.primary_era_id`. Today the apply writer incorrectly defaults most books to `time_ending`; the launch Era fix will derive a value from reliable setting dates or write `NULL`. Secondary Era membership is not implemented.

**facet.** Curated classification attached through `work_facets` to a value/category vocabulary (tone, theme, POV, format-like reader signals, etc.). Content-warning facets are centrally hidden from visitor surfaces while remaining available to admin/audit views.

**curation overlay.** Hand-authored final correction layer applied after corpus, podcast, narrator and timeline materialization so editorial values win deterministically.

## Corpus and operations

**per-book SSOT.** One `book-v1` JSON file per canonical book under `scripts/seed-data/books/`. This is the live durable book corpus; legacy rosters, Excel and numbered override batches are frozen equivalence provenance.

**book preflight.** DB-free validation of every per-book file, identity uniqueness, collection references and shared reference/facet inputs. It runs before the corpus write in `db:sync`.

**targeted apply.** Apply one bounded content unit (`apply:book --slug`, `apply:podcast --show`) after its artifacts merge. It is the normal path for additions and corrections.

**`db:sync`.** Non-destructive nine-step convergence chain: corpus preflight; books; podcasts; narrator apply/verify; timeline apply/verify; curation apply/verify. It is the default “make DB match committed content” operation.

**`db:rebuild`.** Confirm-gated disaster recovery: destructive truncate followed by the same convergence chain. Never routine maintenance.

**`db:drift`.** Read-only health check. It reports mismatch and never writes/heals. The full corpus deep diff remains `equiv:diff` against a disposable DB.

**Weekly Refresh.** Detection/review workflow for new book candidates and per-show podcast deltas. CI/cron has no production DB write authority; review and explicit apply remain human-gated.

**podcast delta.** `manifest GUIDs − committed extraction GUIDs`; only the new items are tagged/merged/applied. No-shrink/no-retag guards prevent accidental full-show replacement.

## Frontend and runtime

**Chronicle.** Event-backed timeline tool with cinematic and index modes.

**Cartographer.** Static galaxy chart from committed map data. World hit testing and most graphics are SVG; mobile moving journey dashes use Canvas to avoid browser SVG paint flicker.

**Great Journey.** Typed researched route on the Cartographer. A journey has chart stations and optional off-chart leg waypoints, guided tour state and a freely explorable final route. Current roster: eight journeys / 101 acts.

**zone.** Hand-curated chart polygon (`storm`, `interdiction`, `region`, xenos/plague variants). Only published JSON zones render publicly. The editing tool is hard dev-only.

**BrandBeacon.** Scroll-triggered home link/placeholder mark on ordinary pages. It is not the map's `Chrono Lexicanum · Tabula` north-edge brand.

**preview gate.** Temporary password/invite visitor gate in `src/proxy.ts`. `PREVIEW_GATE=off` is the launch flip; the machinery and activation table are removed only after launch stabilizes.

**cached read.** Server-side cached loader wrapper. Current launch work must distinguish legitimate absence from upstream failure, add missing in-flight coalescing and align cache invalidation with the snapshot release contract.

**build snapshot (planned).** Versioned committed projections used during `next build` so prerender does not query the live database. Postgres remains canonical; the snapshot is a release artifact, not a second editorial source of truth.

## Project memory

**Brain.** This repo's small engineering wiki (`brain/`). It carries current architecture, decisions, queue and workflows.

**Atlas.** External generated Obsidian mirror of Postgres domain data. It is read-only, regenerated on demand and never auto-loaded.

**Rollup Ownership.** Only the coordination worktree edits `brain/**` and `sessions/README.md`. Strand reports transport facts back to a later coordination ingest.

**launch single-worktree exception.** Temporary maintainer decision: launch sessions run serially from the coordination worktree, but PR contents remain strand-pure and `main` stays read-only. Normal routing resumes afterward.
