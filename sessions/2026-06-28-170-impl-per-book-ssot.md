---
session: 2026-06-28-170
role: implementer
date: 2026-06-30
status: complete
slug: per-book-ssot
parent: 2026-06-28-170
links: [2026-06-09-133, 2026-06-14-151, 2026-06-18-157, 2026-06-25-165, 2026-06-27-168]
commits: []
---

# 170 - Per-Buch-SSOT Teil A: Fundament und targeted `apply:book`

## Summary

Shipped the additive per-book SSOT foundation: a `book-v1` file format under `scripts/seed-data/books/<slug>.json`, a pure DB-free loader/validator, a targeted `apply:book --slug/--all/--verify` that materializes a book through the SAME shared writer the legacy batch applier uses, an additive `apply:book --all` tail in `db:sync` (step 3/10), a read-only per-book check in `db:drift`, a `/add-book` runbook, and corpus-awareness for the weekly refresh so a per-book promotion is never re-proposed and never collides on id. **Strictly additive — Legacy (`book-roster.json` + 90 override batches) is untouched and still applies; the `books/` folder ships empty, so every new path is a clean no-op until the first book lands.** No live DB was written (verified DB-free or via `--help` only).

## What I did

**New (the per-book machinery):**
- `scripts/book-apply-shared.ts` — the ONE shared apply core, extracted VERBATIM from `apply-override.ts` (no top-level `main()`, safe to import): types, pure notes-composition helpers (`composeNotes`/`buildSurfaceFormsBlock`/`buildAuthorshipBlock`/`pickFinalFormat`), the halt-before-mutation validators, the persons pre-pass, the per-work writer `applyBook(override, roster, series, skipCtx, locationSkipCtx)`, and the legacy `applyCollections`. The only generalization over the original private writer: the `series` anchor is now a caller arg (no hard-coded id map inside the writer).
- `scripts/book-file.ts` — pure (no DB/network) per-book module: the `book-v1` shape, `validateBookFile`, the dup-guard against the effective corpus (`findCorpusCollisions`), additive id allocation (`effectiveMaxSuffix`/`nextEffectiveId`), `findUnresolvableCollectMembers`, and the projections into `RosterBook`/`OverrideBook`/`SeriesAnchor`/`RosterCollection`. Type-only import of `book-apply-shared` (erased at runtime) keeps it DB-free.
- `scripts/apply-book.ts` — the targeted applier CLI (`--slug` / `--all` / `--verify` / `--help`). Schema + dup-guard gate → reference/facet prolog → validate facets/roles/synopses/ratings → resolvable-collects gate → persons pre-pass → per-book `applyBook` loop → collection-ownership writer → `persons.json` once at run end. `--verify` is read-only.
- `scripts/seed-prolog.ts` — the shared non-destructive reference/facet seed prolog (`seedResolverExtensions` + `seedFacets` + `seedReferenceAndFacetProlog`), moved in-process out of the two CLI scripts.
- `scripts/refresh/effective-corpus.ts` — `loadEffectiveCorpusBooks(dir?)`: projects `books/*.json` into `RosterBook[]` for the refresh identity index + id allocator. Fail-soft (invalid files skipped).
- `scripts/seed-data/books/README.md` — documents the format + lifecycle; the folder ships with no `*.json` (no live writes).
- `scripts/runbooks/add-book-runbook.md` — the `/add-book` operator flow (9 stations, explicit DB-write gate).
- `scripts/test-book-file.ts`, `scripts/test-apply-book.ts`, `scripts/test-book-detection-guard.ts` — 64 DB-free tests (see Verification).

**Edited (thin-shim / wiring / docs):**
- `scripts/apply-override.ts` — reduced to a thin CLI orchestrator over `book-apply-shared`; keeps `SERIES_BY_EXTERNAL_ID` + `loadOverride` + identical console output. Legacy behaviour unchanged.
- `scripts/seed-resolver-extensions.ts`, `scripts/seed-facets.ts` — reduced to CLI shims that call the `seed-prolog` exports (so `run-phase4-apply.sh` greps the same `[seed-*]` lines).
- `scripts/db-sync.sh` — inserted `apply:book --all` as step **3/10** (right after `run-phase4-apply.sh`, before `apply:podcast`); renumbered 9→10 across labels, the header comment block, and the `--help` heredoc.
- `scripts/db-drift.sh` — added the read-only `apply:book --verify` check (now check 6 of 7).
- `scripts/db-rebuild.sh` — refreshed the chain-description comments to include "per-book" (it delegates the restore chain to `db-sync.sh`).
- `scripts/refresh-check.ts` — merges `loadEffectiveCorpusBooks()` into an effective roster at the single chokepoint that feeds `buildRosterIndex` + `makeIdAllocator`.
- `scripts/refresh/emit.ts` — the review-prompt + report "Promote (Books)" text now point at the per-book path (`scaffold books/<slug>.json` → `apply:book --slug`), not the retired extension/import path.
- `scripts/runbooks/weekly-refresh-runbook.md`, `scripts/runbooks/db-rebuild-runbook.md` — §Promote and the sync/drift sequences reconciled to the per-book path.
- `package.json` — added `apply:book` (`--env-file=.env.local`) + `test:book-file` / `test:apply-book` / `test:book-detection-guard` (no `--env-file`).

## Decisions I made

- **Extracted a shared `book-apply-shared.ts` rather than guarding `apply-override.ts`'s `main()`.** Nothing imports `apply-override.ts` today (its top-level `main()` is why), so moving the writer + helpers to a side-effect-free module is the clean "shared crystallizer" pattern (Brief 154 precedent for `resolve-book-edges.ts`). Both appliers now share ONE path, so the Acceptance bullet "roundtrip legacy-equivalent" holds by construction, not by coincidence.
- **`series`/`seriesIndex` are stated in the file** (replacing the writer's hard-coded `SERIES_BY_EXTERNAL_ID`). `applyBook` takes a `SeriesAnchor | null` arg; the legacy applier passes it from its 8-entry map, the per-book applier from the file's `series`. ⚠ **Part-B note below** — the converter must reproduce legacy's series exactly.
- **Prolog shared in-process, not via subprocess.** `seed-prolog.ts` exports the seeding logic; the two seed scripts became shims. `apply:book` / `/add-book` call `seedReferenceAndFacetProlog()` directly, so a brand-new faction/location/facet resolves without a full `db:sync` — and no main-module-guard fragility.
- **Per-book collections use collection-ownership semantics** (a separate writer in `apply-book.ts`), distinct from legacy's flat edge-list `applyCollections`. A collection file owns its `collects[]`; `--slug <member>` never touches `work_collections`; `containedIn` is ignored; an unresolvable member halts loud.
- **Book-detection stays effective-corpus-aware (NOT paused).** The minimal-surface fix merges a `RosterBook` projection of `books/` into the roster at the one chokepoint both consumers read. Podcast detection is untouched. A missing/empty folder projects to `[]`, so behaviour is unchanged until populated.
- **`db-apply-scope.ts` deliberately NOT changed.** Its non-recursive `manual-overrides-ssot-*` filter silently ignores the `books/` subdir, so the preflight scope stays Legacy-only (correct for Teil A; Teil B rebuilds it).
- **`apply:book --verify` is a shallow presence check** (works row + slug match + `book_details` row), not a deep diff — the deep `apply(legacy)==apply(per-book)` equivalence is Teil B's harness, by design.
- **Tests are DB-free without `--env-file`.** `book-file.ts` is genuinely DB-free (type-only import of the shared module). `test-apply-book.ts` needs the shared module's pure helpers, which transitively import `@/db/client` (throws at import without `DATABASE_URL`); it sets a STUB `DATABASE_URL` then dynamic-imports inside an async `main()` (postgres.js connects lazily, so no socket; tsx compiles these as CJS, so no top-level await). Idempotency + junction-scope are covered by in-memory simulations that mirror the documented delete-then-insert writer.
- **No new dependency, no schema change, no `ANTHROPIC_API_KEY` path.** `book_format` enum is mirrored with a drift-guard test.

## Verification

DB-free unless noted; **no live DB write performed**.

- `npm run test:book-file` — 34 passed (validator, dup-guard, id-allocation, collection edges, projections, FS loader, enum drift guard).
- `npm run test:apply-book` — 23 passed (notes round-trip, `primary_era_id` const, validators, collections ownership, persons slugging, prolog wiring, junction idempotency/scope, static db:sync-tail/db:drift-position guard).
- `npm run test:book-detection-guard` — 7 passed (incl. the acceptance datapoint: a per-book `W40K-0600` classifies `exact` once merged + next id is `W40K-0601`; negative control proves roster-only is blind).
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run brain:lint -- --no-write` — 0 blocking (14 pre-existing warnings).
- Regression (existing, all green): `test:refresh` 65, `test:roster-extension` 20, `test:synopsis-lint` 14, `test:loop-next` 9, `test:apply-override-dry` ok, `test:collection-refs` 10 — confirms the `apply-override.ts` extraction + the refresh edits did not regress.
- `bash -n` on `db-sync.sh` / `db-drift.sh` / `db-rebuild.sh` — clean; `db-sync.sh --help` shows the renumbered 1..10 sequence.
- `npm run apply:book -- --help` — loads `.env.local`, prints help, exits 0 (no DB query, no write).

## Open issues / blockers

None. Live apply (`apply:book --slug/--all`) and the read-only `apply:book --verify` against the live DB were intentionally NOT run — they need Philipp's explicit go (and the folder is empty anyway, so `--all` is a no-op today).

## For next session (answers the brief's "Open questions for report")

- **Final shape:** `book-v1` — `$schema, externalBookId, slug, title, authors[], editors[], authorship.editorialNote, releaseYear, format, seriesHint, series, seriesIndex, notes, source{kind,url,confidence}, curation{synopsis,facetIds,factions,locations,characters,flags,rating?}, collections{collects[],containedIn?-ignored}`. Lossless fields round-trip verbatim.
- **Prolog abstraction:** `scripts/seed-prolog.ts` `seedReferenceAndFacetProlog()` (= `seedResolverExtensions` + `seedFacets`, in order); the two CLI scripts are now shims.
- **`--all` in `db:sync`:** step 3/10, after `run-phase4-apply.sh`, before `apply:podcast`; a static guard test asserts the position, and `--verify` is wired into `db:drift`.
- **Detection:** stays effective-corpus-aware (not paused) via `effective-corpus.ts`.

**Teil-B (171) assumptions to adjust against this impl before opening it:**
1. **Validation modes:** only `additive` exists. `findCorpusCollisions` is hard-red on any legacy⇄folder slug/id mirror — exactly the migration case. Teil B's `migration/equivalence` mode (mirrors EXPECTED) and `post-retirement` mode (folder-only uniqueness/id-max) must be added as a flag through `book-file.ts` + `apply-book.ts loadAndGuard()`.
2. **Converter target = the concrete `book-v1` shape above.** The draft's §Konverter bullets map 1:1, but bind them to these exact field names (esp. `authorship.editorialNote`, the `source` object, and `collections.collects[]` grouped by `collectionExternalId`).
3. **`series` parity:** legacy only sets `book_details.series_id` for the 8 ids in `apply-override.ts`'s `SERIES_BY_EXTERNAL_ID`; everything else is `null`. The converter must reproduce that exactly (set `series` only for those, else `null`) or the equivalence diff breaks — do NOT newly derive series from `seriesHint` in Teil B's converter.
4. **Equivalence is parity-by-construction at the writer.** Both appliers call `book-apply-shared.applyBook`; the only diff surface is the PROJECTION (legacy roster+override → args) vs (book-v1 → args). The harness should target the projection, and reuse `seedReferenceAndFacetProlog()` for both golden + scratch (the draft's "derselbe Prolog").
5. **Collections:** legacy `applyCollections` (flat list) vs per-book ownership writer must produce identical `work_collections` rows — assert this in the equivalence domain.
6. **db:sync rebuild:** Teil A's per-book step is an additive TAIL (step 3); Teil B replaces the legacy corpus step (`run-phase4-apply.sh`) with per-book as the primary and rebuilds `db-apply-scope`'s contiguity preflight into the per-book preflight (draft tasks 4–5).
7. **Consumer-inventory deltas already done in Teil A:** `apply-override.ts` already delegates to `book-apply-shared` (retiring it = retiring the legacy projection + the series map, not the writer); `seed-resolver-extensions.ts`/`seed-facets.ts` are already shims over `seed-prolog`; `refresh-check.ts` + `refresh/emit.ts` already point at the per-book path. Update the draft's task-7 list accordingly.

## References

- Brief 170 (`sessions/2026-06-28-170-arch-per-book-ssot.md`) — this brief.
- `scripts/book-apply-shared.ts` header — the shared-crystallizer rationale (Brief 154 precedent).
- `scripts/seed-data/books/README.md` + `scripts/runbooks/add-book-runbook.md` — the format + operator flow.
