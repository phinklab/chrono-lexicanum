---
session: 2026-06-30-171
role: implementer
date: 2026-06-30
status: complete
slug: per-book-ssot-migration
parent: 2026-06-29-171
links: [2026-06-28-170, 2026-06-29-171]
commits: []
---

# 171 - Per-Buch-SSOT Teil B: verifizierte Migration und Batch-Retirement

## Summary

The full 896-book corpus is migrated into `scripts/seed-data/books/<slug>.json`, and `apply(legacy) == apply(per-book)` is **proven by an empty DB-free projection diff** (896 books, 0 row deltas, 196 collection edges identical) — so the corpus now lives ONLY in `books/`. The batch/Excel/extension/loop machinery is retired (CLIs refuse, data frozen), `apply:book --all` is the primary corpus step in the rewired `db:sync`/`db:rebuild`/`db:drift`, and a read-only `books:excel` export exists. **No live/prod DB was touched** — the equivalence proof is parity-by-construction at the projection (computeBookRows), exactly as the brief endorses.

## What I did

### Core: validation modes + pure row derivation (Teil-A foundation, finalized)
- `scripts/book-file.ts` — added the `CorpusMode` type (`additive` | `migration-equivalence` | `post-retirement`); `findCorpusCollisions`/`effectiveMaxSuffix`/`nextEffectiveId` take a mode. Cross-source (folder⇄Legacy roster) guard fires only in `additive`; intra-folder uniqueness always; `post-retirement` ignores the Legacy roster for id-max.
- `scripts/apply-book.ts` — `--mode` flag (default `post-retirement`); `loadAndGuard(mode)` consults the Legacy roster only in `additive`.
- `scripts/book-apply-shared.ts` — extracted the pure `computeBookRows(override, roster, series, skipCtx, locationSkipCtx)` (the corpus-owned row shape: works/book_details/persons/facets/factions/locations/characters + metadata). `applyBook` now consumes it and only adds DB plumbing. This is the parity-by-construction surface the harness diffs.

### Migration core (gate-critical)
- `scripts/legacy-corpus-projection.ts` (NEW) — the Legacy projection extracted from `apply-override.ts`: `SERIES_BY_EXTERNAL_ID` (the 8 ids, verbatim), `loadAllOverrideBooks` (all 90 batches → map, dup-guard), `loadRosterSync`, `loadExtensionProvenance`, `buildLegacyTriples`. Pure/DB-free (type-only imports from `book-apply-shared`, local `SEED_DIR`).
- `scripts/migrate-corpus-to-books.ts` (NEW) — the one-shot converter. Enumerates `book-roster.json.books[]`, joins override curation + extension provenance + collections (grouped by `collectionExternalId`), writes one `book-v1` per row. Series parity exact (8 ids; else null, never from `seriesHint`). Halts hard on missing curation / slug collision / schema failure. **Ran it: 896 files written, 59 carry `collects[]`.**
- `scripts/equivalence-diff.ts` (NEW) — the gate. `--projection` (default, DB-free): forces a stub DATABASE_URL, computes `computeBookRows` for the legacy projection vs the per-book projection for every book + the collection edge set, deep-equals via stable stringify. `--db-snapshot --out` + `--compare` (operator tools for a real disposable-DB deep diff) guarded by `assertDisposableTarget` (refuses managed/Prod/stub). **Ran it: EMPTY DIFF.**

### Promotion + preflight + db chains
- `scripts/book-corpus-preflight.ts` (NEW) — DB-free per-book preflight (`post-retirement`): parse+schema, folder-only slug/id uniqueness, valid ids, `collects` resolvable, reference/facet prolog catalogs present. **Replaces `db-apply-scope.ts`'s batch-contiguity claim.**
- `scripts/db-sync.sh` — rewired: step 1 `book-corpus-preflight`, step 2 **`apply:book --all --mode post-retirement` (PRIMARY corpus step)**, then podcast/audiobook/timeline/curation tails (9 steps, no `run-phase4-apply.sh` corpus step).
- `scripts/db-rebuild.sh`, `scripts/db-drift.sh` — preflight swapped to `book-corpus-preflight`.

### Retirement (gate-passed → neutralize CLIs; data frozen)
- `scripts/apply-override.ts` → full retirement stub (refuse → `apply:book`/`equiv:diff`). Series map moved to `legacy-corpus-projection.ts`. The shared writer (`book-apply-shared.ts`) is untouched.
- `scripts/loop-next-batch.ts` → `loop:next` refuses inside `main()` (pure `decideNextBatch` export kept for its test).
- `scripts/import-ssot-roster.ts` → Excel/extension import gated off (loud Legacy-only; `ALLOW_RETIRED_SSOT_IMPORT=1` escape hatch for provenance re-run only).
- `scripts/db-apply-scope.ts` → full stub (→ `book:preflight`).
- `scripts/run-ssot-loop.sh` → refuses.
- `scripts/strip-unknown-facets-074.ts`, `aggregate-surface-forms-074.ts`, `aggregate-surface-forms-076.ts` → one-off historical stubs (the strip mutator would have violated the freeze).
- `scripts/run-phase4-apply.sh` → legacy header note (its `db:apply-override` loop refuses; relieved from db:sync).

### Excel export
- `scripts/books-excel.ts` (NEW) — read-only `.xlsx` from `books/*.json` via `write-excel-file@4.1.1` → gitignored `ingest/.exports/books.xlsx`. Hard-refuses any output path under `scripts/seed-data/source/` (never clobbers the frozen input).

### Tests + docs
- `scripts/test-migration-equivalence.ts` (NEW) — modes, converter roundtrip (incl. series parity + override-slug rule + extension provenance), the FULL committed-corpus projection diff is empty, the prod-refusal guard. 11/0.
- `scripts/test-apply-book.ts` — rewrote the db-sync static guard for the new structure (preflight → apply:book primary → podcast; no run-phase4 step; preflight ≠ db-apply-scope).
- Runbooks: `ssot-loop-runbook.md` (RETIRED banner), `db-rebuild-runbook.md` (per-book banner), `resolver-pass-runbook.md`/`consolidation-pass-runbook.md` (LEGACY banners — depend on retired `db:apply-override`), `scripts/seed-data/README.md` (per-book corpus note).
- `package.json` — new scripts `book:preflight`, `migrate:corpus-to-books`, `equiv:diff`, `books:excel`, `test:migration-equivalence`; devDep `write-excel-file@4.1.1`. `.gitignore` — `/ingest/.equivalence/` + `/ingest/.exports/`.

## Decisions I made

- **DB-free equivalence is the proof, by design.** No disposable Postgres exists locally (no docker/psql/pglite; `.env.local` is prod). Per the user's hard constraint and the brief's "Parität-by-construction am Writer", I proved equivalence at the **projection**: both appliers call the same `applyBook`→`computeBookRows`, so diffing `computeBookRows(legacy)` vs `computeBookRows(per-book)` for all 896 + the collection edge set IS the row-level snapshot the two applies would write. The `--db-snapshot`/`--compare` modes (with the prod-refusal guard) are built and documented for an operator to run against a real disposable DB, but were **not executed** (no disposable target; never prod).
- **`works.slug` = the OVERRIDE slug, not the roster slug.** Two books have a roster/override slug mismatch — `W40K-0259` (roster `the-rose-in-anger` / override `the-rose-in-the-anger`) and `W40K-0330` (roster `the-hunt-for-magnus` / override `the-hunt-of-magnus`). Legacy `computeBookRows` writes `override.slug` into `works.slug`, so the converter uses the **override** slug for the `book-v1` slug + filename. Using the roster slug would have broken the diff. (Latent pre-existing roster/override discrepancy, preserved verbatim, flagged here for a future cleanup.)
- **Series parity reproduced exactly, never derived.** `series`/`seriesIndex` set ONLY for the 8 `SERIES_BY_EXTERNAL_ID` ids; everything else `null`, including books with a `seriesHint`. A unit test asserts both the positive (W40K-0001 → eisenhorn/1) and the negative (a hinted non-anchor stays null).
- **Source provenance:** extension books → `{kind: source_kind, url: sourceUrl, confidence}` (31 `track_of_words`/0.6; the 6 OFOB picks have no `source_kind` → `kind:"manual"`, real URL kept, `confidence:null`). The 859 Excel books → `{kind:"excel", url: sourceUrl, confidence:null}`. `source.*` feeds nothing in `computeBookRows` (zero equivalence impact) — it is round-trip metadata only, so any faithful value is safe.
- **Retirement = neutralize the CLIs, freeze the data.** All 90 batch files, `book-roster.json`, `book-roster.extension.json`, and `Warhammer_Books_SSOT.xlsx` stay on disk as frozen provenance AND the equivalence golden (so the proof stays re-runnable). I refused the live entry points rather than deleting them, and put refuses inside `main()` (behind the existing `isMain()` guards where present) so the test-imported pure exports survive.
- **`write-excel-file@4.1.1`** (new devDep) — the writer companion to the already-present `read-excel-file` (same ecosystem). v4 is a major rewrite (`schema`→`columns`, `column`→`header`, cell props nested, `filePath`→`.toFile()`); I used the v4 typed `columns` API.
- **`db:drift` stays a cheap read-only health check** (Open-Q #9). The full corpus deep-diff is the operator's `equiv:diff --db-snapshot` + `--compare` path against a disposable DB — NOT folded into `db:drift` (which must stay read-only, cheap, prod-safe).
- **`import-faction-starters.ts` left as-is** (reads `book-roster.json` for title→slug): faction-starters is explicitly out of scope (brief §Out of scope). It reads the frozen roster, which is still accurate as of migration; rebind to `loadEffectiveCorpusBooks` is a faction-starters follow-up.

## Consumer inventory (brief item 8)

| Consumer | Resolution |
|---|---|
| `scripts/apply-override.ts` (`db:apply-override`) | **RETIRED** — full stub; projection+series map moved to `legacy-corpus-projection.ts`; shared writer untouched |
| `scripts/loop-next-batch.ts` (`loop:next`) | **RETIRED** — `main()` refuses; pure `decideNextBatch` kept (test passes) |
| `scripts/import-ssot-roster.ts` (`import:ssot-roster`) | **RETIRED** — Excel/extension import gated off (Legacy-only escape hatch) |
| `scripts/db-apply-scope.ts` (`db:apply-scope`) | **RETIRED** — stub → `book:preflight` |
| `scripts/run-ssot-loop.sh` | **RETIRED** — refuses |
| `scripts/strip-unknown-facets-074.ts` | **RETIRED** — one-off mutator (would violate freeze) |
| `scripts/aggregate-surface-forms-074.ts` / `-076.ts` | **RETIRED** — one-off historical |
| `scripts/run-phase4-apply.sh` | **LEGACY** — relieved from db:sync; its `db:apply-override` loop refuses; kept as frozen provenance for resolver/consolidation runbooks |
| `scripts/aggregate-surface-forms.ts` | **LEGACY-FROZEN** — read-only Phase-0 over the frozen batch world; no live role; left runnable for provenance |
| `scripts/resolver-loop-detect.ts` (`resolver:next-wave`) | **LEGACY-FROZEN** — read-only wave detection over frozen batches; no new waves run; pure exports keep `test:resolver-loop-detect` green |
| `scripts/apply-override-dry.ts` (`test:apply-override-dry`) | **LEGACY-FROZEN** — DB-free dry sweep over frozen batches; still passes |
| `scripts/apply-override-collections.ts`, `scripts/resolver-pass-config.ts` | **LEGACY-NOTE** — pure modules consumed only by retired/legacy CLIs + their tests |
| `src/lib/ingestion/v2/ssot/load-roster.ts` + `adapt.ts` | **LEGACY-NOTE** — pure; only the retired V2 batch-ingest path consumes them |
| `scripts/roster-extension.ts` | **LEGACY-NOTE** — pure validator; consumed by retired `import-ssot-roster` + its test (`test:roster-extension` green) |
| `scripts/book-review/projection.ts` | **READ-ONLY-FROZEN** — projects the frozen batch corpus for review; caveat: will not see per-book books (review-domain follow-up) |
| `scripts/import-faction-starters.ts` | **READ-ONLY-FROZEN** — reads frozen roster for title→slug; rebind deferred (faction-starters out of scope) |
| `scripts/refresh-check.ts` | **DONE (Teil A)** — already merges `loadEffectiveCorpusBooks()`; canonical rebind |
| `scripts/refresh/{emit,proposal,book-source}.ts`, `effective-corpus.ts` | **LIVE, correct** — fed the effective (per-book) roster; read no frozen source directly |

## Open questions for report (brief)

- **Snapshot form / normalization-only deltas:** stable key-sorted JSON deep-equal of `computeBookRows` output per book + a normalized collection-edge set (confidence `toFixed(2)`, natural keys). **Zero deltas** — no normalization-only deltas remained either.
- **Three modes wiring:** `CorpusMode` flag through `book-file.ts` (`findCorpusCollisions`/`effectiveMaxSuffix`) + `apply-book.ts loadAndGuard()`. Migration run uses `migration-equivalence` semantics (separate worlds, no cross-source guard); the final preflight uses `post-retirement` (folder-only).
- **Disposable-DB mechanism + prod refusal:** the gate is DB-free (forced stub URL, never connects). The `--db-snapshot` operator path calls `assertDisposableTarget` which refuses managed/Prod-looking URLs (supabase/pooler/neon/amazonaws) and the stub unless `EQUIV_DISPOSABLE_DB_OK=1` + a non-prod URL.
- **Extension provenance:** taken into `source` for all 37 extension books (31 `track_of_words`/0.6, 6 OFOB → `manual` + real URL). No deliberate retirements.
- **Proof artifacts:** `ingest/.equivalence/projection-diff.md` (gitignored). `ingest/.last-run/phase4-digest.md` was NOT touched (the gate never runs `run-phase4-apply.sh`).
- **db:apply-scope / run-phase4 → per-book:** `db-apply-scope.ts` retired; `run-phase4-apply.sh` relieved as the corpus step; `apply:book --all` promoted to primary, gated by `book-corpus-preflight`.
- **Consumers:** see the inventory table above.
- **Excel:** `import:ssot-roster` retired (Legacy-only); `books:excel` writes `ingest/.exports/books.xlsx` (gitignored, read-only export).
- **db:drift:** stays health-check + per-book `--verify`; full deep-diff is the operator's `equiv:diff --db-snapshot`/`--compare`.
- **Teil-C (172) assumptions to revisit:** 172 must target the per-book path — the corpus is `books/*.json`, `db:sync` step order changed (now 9 steps; corpus = step 2 `apply:book --all`), `book-roster.json` is frozen provenance (refresh already reads the effective per-book roster), and `db:apply-override`/`loop:next` no longer exist. Any 172 weekly-maintenance step that assumed batch apply or the Excel roster must be rewritten against `apply:book` + `books/`.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run brain:lint -- --no-write` — pass (14 pre-existing warnings, 0 blocking; no `brain/**` touched)
- `npm run migrate:corpus-to-books` — wrote 896 `books/*.json` (59 with `collects[]`)
- `npm run equiv:diff` — **EMPTY DIFF**: 896 books, 0 row deltas, collections 196/196 (0 only-legacy, 0 only-per-book), 0 missing/extra/file-issues
- `npm run book:preflight` — OK (896 files, max W40K-0599 / HH-0297)
- `npm run books:excel` — wrote `ingest/.exports/books.xlsx` (896 rows); legacy `Warhammer_Books_SSOT.xlsx` untouched
- Tests: `test:migration-equivalence` 11/0, `test:book-file` 34/0, `test:apply-book` 24/0, `test:book-detection-guard` 7/0, `test:roster-extension` 20/0, `test:collection-refs` 10/0, `test:resolver-loop-detect` 36/0, `test:synopsis-lint` 14/0, `test:apply-override-dry` ok
- Retired CLIs smoke-tested: `db:apply-override`, `loop:next`, `db:apply-scope`, `run-ssot-loop.sh` all refuse with a per-book pointer
- `bash -n` on all touched `.sh` — pass
- **No DB write of any kind** — no apply ran against any database (the gate is DB-free; live apply is Philipp's explicit-go only)

## Open issues / blockers

- None blocking. The DB-snapshot deep-diff (`equiv:diff --db-snapshot`/`--compare`) is built but unexecuted — it needs a disposable DB the local env doesn't have; the DB-free projection gate is the standing proof.
- Latent: 2 books (`W40K-0259`, `W40K-0330`) carry a roster/override slug discrepancy, preserved verbatim for equivalence; a future cleanup could reconcile `book-roster.json` (now frozen) — cosmetic, no functional effect.

## For next session

- **172 (Teil C)** — open from `_drafts/2026-06-29-172-arch-podcast-weekly-maintenance.md` ONLY after this merges, and update it against the 170 + 171 reports (per-book corpus, 9-step db:sync, frozen roster, retired batch/loop CLIs).
- Optional follow-ups (out of scope here): rebind `import-faction-starters.ts` + `book-review/projection.ts` to `loadEffectiveCorpusBooks` so they see per-book books; reconcile the 2 slug discrepancies in the frozen roster; consider deleting (vs frozen) the retired one-off scripts in a later cleanup.

## References

- `write-excel-file` v4 API (columns / `.toFile()` / Cell types) — node_modules README + `node/index.d.ts`
- Brief 170 impl report (`sessions/2026-06-28-170-impl-per-book-ssot.md`) — the Teil-A foundation + 7-point checklist
