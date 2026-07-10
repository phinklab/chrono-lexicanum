---
title: Content pipeline state
type: overview
created: 2026-05-09
updated: 2026-07-10
sources:
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/archive/2026-06/2026-06-28-170-impl-per-book-ssot.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-01-172-impl-podcast-weekly-maintenance.md
  - ../../sessions/2026-07-03-175-impl-podcast-hygiene.md
  - ../../sessions/2026-07-03-176-impl-roster-rebind-kleinkram.md
  - ../../sessions/2026-07-03-177-impl-dead-code-sweep.md
  - ../../ingest/refresh/2026-W28/report.md
  - ../../scripts/book-apply-shared.ts
  - ../../scripts/runbooks/add-book-runbook.md
  - ../../scripts/runbooks/add-podcast-episode-runbook.md
  - ../../scripts/runbooks/weekly-db-update-runbook.md
related:
  - ./project-state.md
  - ./book-data-overview.md
  - ./architecture.md
  - ./decisions/why-excel-ssot-not-crawl.md
confidence: high
---

# Content pipeline state — 2026-07-10

> Current operational pipeline only. The retired crawler/resolver era is preserved in git, archived sessions and older [`log.md`](./log.md) entries.

## Mental model

```text
book JSON / podcast delta / curated seed data
                    │
                    ▼
            validate + review
                    │
                    ▼
          merge through a PR
                    │
                    ▼
        targeted apply or db:sync
                    │
                    ▼
       verify + revalidate/live smoke
```

Postgres is canonical runtime state. Committed content files are the durable, reviewable inputs that can rebuild it. Normal maintenance is additive and idempotent; destructive rebuild exists only as guarded disaster recovery.

## Books

- **Corpus:** 896 files under `scripts/seed-data/books/` (`book-v1`), one file per work: 599 W40K and 297 Horus Heresy.
- **Collections:** 59 book files carry 196 `collects` edges.
- **Writer:** `scripts/book-apply-shared.ts` computes normalized work/detail/junction rows. `apply:book --slug <slug>` is targeted; `--all --mode post-retirement` is the corpus step used by `db:sync`.
- **Preflight:** `book:preflight` parses all files, verifies unique identity/slug/external IDs, collection references and the shared reference/facet prolog before any DB write.
- **New book:** follow `scripts/runbooks/add-book-runbook.md`; scaffold one file, curate, verify, PR/merge, then targeted apply. No batch slot, roster extension or resolver pass.
- **Equivalence:** the legacy-to-per-book migration proved 896 books / zero row deltas / 196 matching collection edges through the DB-free projection diff. Frozen rosters, Excel and override batches remain provenance/equivalence inputs only.

### Known book correctness item

`book_details.primary_era_id` is still blanket-stamped to `time_ending` by `M41_ERA_ID`. The launch S0/S1a path must replace this with a durable date-derived-or-null policy; see [`open-questions.md`](./open-questions.md).

## Podcasts

- **Shows:** The 40k Lorecast, Adeptus Ridiculous, Lorehammer and Luetin09.
- **Applied count after W28:** 1,114 episode works (155 / 368 / 399 / 192).
- **Acquisition:** RSS for three shows, YouTube adapter for Luetin09.
- **Delta contract:** compare manifest GUIDs to committed extraction GUIDs, tag only new episodes, `prepare-delta`/`merge-delta`, assemble, then `apply:podcast --show <slug>`.
- **Safety:** no-shrink and no-retag guards; apply matches `(podcast_work_id, episode_guid)` and does not prune missing feed entries.
- **W28:** ten episodes were added/applied (three current feed additions plus six Lorehammer backfill items and the remaining current addition); book candidates were ignored; cursors advanced.
- **Alias tail:** 175 unresolved surface forms remain for a future hand-curation wave.

## Weekly Refresh

The weekly workflow is detection/review, not unattended production mutation:

1. cron checks book sources and each podcast cursor;
2. a rolling PR carries report/proposal/artifact deltas;
3. the maintainer chooses promote/ignore/defer;
4. content artifacts merge;
5. applies run only with explicit production authorization;
6. book/show cursors advance after the reviewed proposal is on `main`.

W28 is complete (#230 content/apply, #231 cursor advance). The old W27 PR #200 is closed and no longer an operational blocker.

## `db:sync`

The default non-destructive convergence command is nine steps:

1. per-book corpus preflight;
2. `apply:book --all --mode post-retirement`;
3. `apply:podcast --all`;
4. apply audiobook narrators;
5. verify audiobook narrators;
6. apply timeline;
7. verify timeline;
8. apply curation overlay;
9. verify curation overlay.

Curation is last so explicit editorial values win. `db:rebuild` prepends a confirm-gated truncate and otherwise reuses the same chain. It is not routine maintenance.

## Verification paths

- `apply:book --verify` checks the materialized corpus.
- Podcast, narrator, timeline and curation apply paths have targeted verify/test coverage.
- `npm run db:drift` is read-only and combines counts/tail verifies/artifact drift; it must never heal state.
- `equiv:diff --db-snapshot/--compare` is the full corpus operator deep diff against a disposable DB and refuses production.
- `npm test` currently aggregates 30 DB-free suites, including book, podcast, refresh, map and voyage contracts.

## Timeline and curation tails

- Timeline data remains 8 curated Eras, 144 events and 223 event-work hooks from the established timeline seed. Apply + exact verify are part of `db:sync`.
- Audiobook narrator and curation overlays are separate deterministic tails.
- Entity blurbs remain complete for the established faction/character/location seed sets; Cartographer adds its own 923 lazy world fallback blurbs without changing location blurbs.

## Cartographer data path

Cartographer is deliberately outside the Postgres apply chain:

- source/curation Excel + `import:map-worlds` generate committed `map-worlds.json`;
- current output: 1,055 worlds, 1,352/1,710 placed work edges (79.1%);
- Luna became an explicit pin in Session 190;
- zones are hand-authored in committed JSON through a hard dev-only editor;
- voyage data is typed TypeScript and validates all station IDs/legs/waypoints.

No `db:sync` is required for map-only catalog changes, but their PR/deploy still controls the public static payload.

## Retired paths

Brief 177 physically removed the V1 multi-source crawler and V2 LLM enrichment engine. The following names remain only as frozen artifacts, historical runbooks or refusal stubs and must not be used for new corpus work:

- `ingest:backfill`, SSOT/resolver loops, batch override apply as the book authority path;
- Wikipedia/Lexicanum/Open Library/Hardcover merge stages;
- per-pass resolver briefs and consolidation as normal maintenance;
- roster extensions and numbered batch continuity as scope control.

Reactivating any of this would be a new architecture decision and rebuild from git history, not a dormant toggle.

## Launch changes planned, not shipped

- Versioned public build projections + manifest, generated after canonical content is applied.
- Two-stage release contract: apply content, generate/review snapshot in a separate PR, deploy, then revalidate/live-smoke.
- Exactly one post-release revalidation action; it must not publish pre-snapshot content.
- Least-privilege runtime vs migration credentials and rehearsed migrations.

## Open operator checks

- Confirm production migration `0015` (indexes).
- Run a current read-only production drift check when approved.
