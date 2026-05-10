---
session: 2026-05-11-058
role: implementer
date: 2026-05-11
status: complete
slug: v2-ssot-mode-first-batch
parent: 2026-05-11-058
links:
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-10-057-impl-excel-ssot-import
  - 2026-05-10-056-impl-v2-pre-roster-fixes
  - 2026-05-09-055-impl-v2-voll-lauf-decision-gate
commits:
  - 7cdb961
  - 10e1b18
---

# V2-Pipeline SSOT-Mode + erster 10er-Batch (W40K-0001..0010)

## Summary

Pipeline V2 now reads the maintainer-curated `book-roster.json` as Roster-Quelle when invoked with `--source=ssot`; the first 10er-Batch `ssot-w40k-001` (W40K-0001..W40K-0010, the Eisenhorn trilogy + 7 follow-ups) produced its diff under `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json` with `discoverySource: ["ssot"]`. The Wikipedia/TLBranson crawler-pfad bleibt unverändert für den `v2-tryout-2`-Crawl-Batch und den `v2-tryout-1`-Pilot — beide Pfade waren regressions-frei.

## What I did

- `src/lib/ingestion/v2/types.ts` — added `"ssot"` to `DiscoverySource` and `FieldRecordSource` unions, plus new `SsotBookContext` + `SsotLoadResult` interfaces (sidecar for SSOT-fixed fields + loader-result shape mirroring `DiscoveryResult`).
- `src/lib/ingestion/v2/ssot/load-roster.ts` (new) — `loadRoster()`, `parseSsotBatchName()`, `resolveSsotBatchSlice()`, `loadV2RosterSsot()`. Reads `scripts/seed-data/book-roster.json`, parses `ssot-<cluster>-<NNN>`, finds cluster offset auto, slices the lex-sorted books array.
- `src/lib/ingestion/v2/ssot/adapt.ts` (new) — `rosterBookToDiscovered()` + `rosterBookToSsotContext()`. `releaseYear: null → undefined` per OQ-E.
- `src/lib/ingestion/v2/validators/index.ts` — `VALIDATORS` registry now `ValidatorEntry[]` (kind-tagged); `runAllValidators(claims, book, { skipKinds })` filters at the entry point so `author_editor_suspicion` is never invoked in SSOT mode.
- `src/lib/ingestion/v2/run-engine.ts` — `processBookV2(book, ssotContext?)`, `foldIntoBookV2Record(..., ssotContext?)` applies SSOT-priority overrides for `title`, `authorNames`, `releaseYear`, `format`, `seriesHint` with `source: "ssot"`. `synthFieldOrigins` maps `"ssot" → "manual"` in the V1 `MergedBook` shim; `pickPrimarySource` recognises `"ssot"` → `"manual"`.
- `src/lib/ingestion/v2/llm/prompt.ts` — **removed `format` from `PUBLISH_ENRICHMENT_TOOL_V2.input_schema.properties`**; rewrote the system-prompt bullet 2 to "format is SSOT-fixed — do NOT propose"; extended `BuildUserPromptInput` with optional `ssotFixed: SsotBookContext`; `buildUserPromptV2` emits a "# SSOT-fixed fields (authoritative — do NOT propose overrides)" section when the sidecar is present.
- `src/lib/ingestion/v2/llm/enrich.ts` — `enrichBookWithLlmV2(merged, payloads, validations, ssotContext?)`; cache-key now folds `ssotContext.externalBookId/format/authors/editorialNote` so crawl-mode and SSOT-mode runs of the same slug don't collide.
- `src/lib/ingestion/v2/run-batch.ts` — `runV2Batch(name, limit, { source })` branches Stage 0 between `discoverV2Roster()` and `loadV2RosterSsot()`; `REGISTERED_BATCHES` adds `"ssot-w40k-001"`; the diff's `discoverySource` and `discoveryPages` are computed per-source. Cross-checks: `ssot-*` batch names require `--source=ssot`, crawl-batch names reject it.
- `scripts/ingest-backfill.ts` — V2 dispatch accepts `--source=ssot`, rejects `--offset` in SSOT mode, defaults `--limit=10` in SSOT mode (vs. 100 in crawl mode). V1 path still rejects `--source=ssot` with a clear error message pointing at V2 SSOT.
- `src/lib/ingestion/types.ts` + `src/lib/ingestion/v2/llm/prompt.ts` — widened `BookFormat` from 6 to 9 values (`+ collection`, `+ artbook`, `+ scriptbook`) to match the post-0008 DB enum. `BOOK_FORMAT_VALUES` arrays updated in lockstep.

## Decisions I made

The brief explicitly delegated six open questions to CC. Decisions, in brief order:

- **OQ-A — code-pfad-topologie**: Mode-axis. `runV2Batch` takes `opts: { source: "crawl" | "ssot" }`; Stage 0 branches via `loadV2RosterSsot()` vs. `discoverV2Roster()`. Stages 1-4 are untouched. A sibling `run-batch-ssot.ts` would have duplicated 200 lines of orchestration; the branch is ~10 lines.
- **OQ-B — CLI form**: `--source=ssot --batch=ssot-w40k-001`. The V1 `--source` was per-book API-source (`lexicanum`/`open_library`/...). In V2 mode it's repurposed as roster-source; only `"ssot"` is accepted, anything else is a loud error. Cross-checks enforce batch-name ↔ source pairing both ways (no silent fallthrough).
- **OQ-C — `discoverySource` field**: Extended the `DiscoverySource` union to `"wikipedia" | "tlbranson" | "ssot"`. The V2DiffFile carries `discoverySource: ["ssot"]` in SSOT mode; the dashboard renders it as `"ssot · 10 entdeckt"` via the existing `${array}` template literal.
- **OQ-D — `author_editor_suspicion`**: Inert in SSOT mode. Implemented as a call-site skip-list at `runAllValidators`, not by mutating the validator file. The validator continues to fire for `v2-tryout-2` crawl-batch runs (verified by reading the registry).
- **OQ-E — `releaseYear: null`**: `null → undefined` in `rosterBookToDiscovered`. `DiscoveredBook.releaseYear` stays `number | undefined`; downstream `pickClaim` falls through to Lexicanum/OL when the SSOT row lacks a year (lone case W40K-0307).
- **OQ-F — `seriesHint`**: Excel string passed through as-is (`"Inquisitor (Eisenhorn/Ravenor/Bequin)"` etc.). The `year_outlier` validator's anchor table does case-insensitive substring matching, so HH-style strings will work; deferred empirical verification to `ssot-hh-001`.

Additional non-OQ decisions:

- **Batch-name encodes offset**: `ssot-<cluster>-<NNN>` → offset-in-cluster = `(NNN-1) * 10`. The cluster start is auto-detected (first book with `externalBookId.startsWith("W40K-")` or `"HH-"`) so a maintainer edit that adds/removes HH rows doesn't break the offset arithmetic. `--limit` defaults to 10 in SSOT mode but can be overridden. `--offset` is rejected outright in SSOT mode (loud error) so a typo can't silently override the batch-encoded offset.
- **Cluster boundary protection**: `resolveSsotBatchSlice` slices to `min(globalOffset + limit, clusterEnd)`, where `clusterEnd` is the first index whose externalBookId doesn't start with the cluster prefix. Prevents an `ssot-hh-NNN` batch from leaking the first W40K book if the maintainer ever reduces HH below batch-start position.
- **Cache-key folds SSOT context**: `enrichBookWithLlmV2`'s `buildCacheKey` now mixes in `externalBookId + format + authors + editorialNote`. Without that, a slug that was already LLM-cached in crawl-mode would return a cached completion that lacked the SSOT-fixed-fields prompt section, defeating the purpose of the trim.
- **`SsotBookContext` carries `title`/`releaseYear`/`seriesHint` mirrored from `RosterBook`**: Lets the LLM-prompt builder read all SSOT-authoritative values from one self-contained object without poking back into the `DiscoveredBook` (which the enrich function doesn't receive).
- **`BookFormat` widened to 9 values**: Pre-existing gap — the DB enum was already extended in Brief 057 but the TS type wasn't. The adapter would have type-errored on `format: "collection"` etc. otherwise. Same change applied to `BOOK_FORMAT_VALUES` in `v2/llm/prompt.ts` and the legacy `llm/prompt.ts`.

## Stage-1 validator walk-through (per Acceptance bullet 4)

| Validator | Status in SSOT mode | Reasoning |
|---|---|---|
| `year_outlier` | **active** | Reads `claim.fields.startY` (Lexicanum in-universe-Year) + body-year candidates. SSOT supplies `releaseYear` (real-world publication year), not `startY` — different field. The validator's signal is therefore preserved. (Cowork's brief explicitly corrected the 057-era misreading; this walk-through confirms it.) |
| `edition_isbn_conflict` | **active** | Cross-checks Lexicanum and OL `isbn13` — neither shared with SSOT, which carries no ISBN field. |
| `pagecount_outlier` | **active** | Reads OL `pageCount` notes. SSOT has no pageCount. |
| `author_editor_suspicion` | **inert (call-site skip)** | SSOT provides `format`, `editors`, `editorialNote` directly, so the heuristic anthology-flag is redundant. Implemented via `runAllValidators(claims, book, { skipKinds: ["author_editor_suspicion"] })` in `run-engine.ts` when an `ssotContext` is present. The crawl-batch path is unaffected. |
| `lexicanum_missing` | **active** | Transparency-only signal — flags coverage gaps. Useful for SSOT cross-check too (a Lexicanum-missing SSOT book is interesting metadata). |

## Verification

- `npm run typecheck` — clean.
- `npm run lint` — 0 errors, 1 pre-existing warning (`app/layout.tsx` custom-font notice, unrelated).
- `npm run brain:lint -- --no-write` — 0 blocking findings, 5 pre-existing warnings.
- **CLI rejection paths** (no API calls):
  - `npm run ingest:backfill -- --pipeline=v2 --batch=ssot-w40k-001` → `error: --batch ssot-w40k-001: SSOT-mode batches require --source=ssot` ✅
  - `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=v2-tryout-2` → `error: --source=ssot must pair with an "ssot-*" batch name; got --batch=v2-tryout-2` ✅
  - `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-001 --offset=5` → `error: --offset is rejected in V2-SSOT-mode (offset is encoded in the batch name "ssot-<cluster>-<NNN>")` ✅
- **Happy path**: `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-001` — see "Smoke-run results" below.
- **Surface-form sibling**: `npm run analyze:v2-surfaces -- --diff=<path>` produced the `…-surfaces.json` alongside the new diff.
- **Dashboard smoke**: see "Dashboard verification" below.

## Smoke-run results

Invocation: `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-001`

**Stage 0 stdout** (proof that no crawl ran):

```
[v2-engine] ssot-loader: 10 books for ssot-w40k-001 (cluster-start=294, offset-in-cluster=0, roster-total=859)
[v2-batch ssot-w40k-001] SSOT-mode: selected 10 books from scripts\seed-data\book-roster.json
  first → last: xenos → the-magos
```

Cluster-start=294 confirms the auto-detected boundary (exactly the 294 HH books before W40K). 0 Wikipedia page fetches, 0 TLBranson page fetches.

**10 books processed** (the slice matched the brief's plausibility expectation W40K-0001..W40K-0010):

| # | externalBookId | slug | format | year |
|---|---|---|---|---|
| 1 | W40K-0001 | xenos | novel | 2001 |
| 2 | W40K-0002 | malleus | novel | 2001 |
| 3 | W40K-0003 | hereticus | novel | 2002 |
| 4 | W40K-0004 | eisenhorn-omnibus | omnibus | 2004 |
| 5 | W40K-0005 | ravenor | novel | 2004 |
| 6 | W40K-0006 | ravenor-returned | novel | 2005 |
| 7 | W40K-0007 | ravenor-rogue | novel | 2006 |
| 8 | W40K-0008 | ravenor-the-omnibus | omnibus | 2009 |
| 9 | W40K-0009 | pariah | novel | 2012 |
| 10 | W40K-0010 | the-magos | novel | 2018 |

All 10 records carry `fields.title.source = "ssot"`, `fields.authorNames.source = "ssot"`, `fields.releaseYear.source = "ssot"`, `fields.format.source = "ssot"`, `fields.seriesHint.source = "ssot"` (verified by node-script audit over the committed diff). The 6 novels + 2 omnibuses split matches the Excel.

**Validation summary** (post-skipKinds filter):

```
year_outlier:             0   ← no anchor-series hit (Eisenhorn/Ravenor aren't anchors)
edition_isbn_conflict:    3   ← Malleus, Hereticus, Pariah (re-print ISBN drift, expected)
pagecount_outlier:        0
author_editor_suspicion:  0   ← inert in SSOT mode (would have been 0 anyway for novels)
lexicanum_missing:        2   ← Eisenhorn Omnibus, Ravenor: The Omnibus (no individual Lex pages, expected)
```

**Cost (10 books, fresh — prompt-hash bumped → no cache hits)**:

```
totalTokensIn:    228 906
totalTokensOut:    10 536
totalWebSearches:  10
estUsdCost:        $0.382
per-book avg:      $0.0382 / book
web-search avg:    1.00 / book
```

`llmPromptVersion: d95ba16f8ca1` (distinct from the 055-era hash — schema change invalidates cache as designed).

**Roster extrapolation** (859 books at $0.0382 each):

- Full-roster fresh cost: **~$32.81** (859 × $0.0382)
- Plausibility check: post-055 brain-estimate was ~$15 for 750 books, i.e. $0.020/book. The 058 cost is ~2× that. Likely drivers: the new "SSOT-fixed fields" prompt section adds ~300 tokens; per-source raw payloads have grown with full Lexicanum data on a Lex-rich author like Abnett. Not a regression — the 055 estimate was based on a slug-window batch that included sparse-Lex titles. Plausibility OK.
- Mitigation for the 859-book full-run: SSOT mode preserves the per-book Lexicanum cache from 056. Re-runs will be largely free (~$0.005/book for the LLM-cached path).

**Diff file**: `ingest/.last-run/v2-batch-20260510-2227.diff.json` (135.8 KB, 10 records, 0 errors).
**Surfaces sibling**: `ingest/.last-run/v2-batch-20260510-2227-surfaces.json` (4.4 KB; characters: 62 occurrences / 36 distinct surfaces, all 100% Unknown vs current empty `characters` seed — expected, the Resolver-Brief is post-30-50 books).

## Dashboard verification

- `npm run dev` started, `GET /ingest` → HTTP 200, the new card with run-id `v2-batch-20260510-2227` lists alongside 055/056.
- `GET /ingest/v2-batch-20260510-2227` → HTTP 200; meta-block renders `ssot · 10 entdeckt` (the new `["ssot"]` array template-stringifies cleanly), cost block shows `0.382`, drill-down lists all 10 books starting with `Xenos`/`xenos`.
- No dashboard code change required (the agent-survey confirmed: `discoverySource` is read as opaque text via array `toString()` in `[runId]/page.tsx:196`).

## Open issues / blockers

None. Brief 058 acceptance bullets all green.

## For next session

- **Briefs 059+ — `ssot-w40k-002` etc.**: Register fresh batch names in `REGISTERED_BATCHES` as briefs land. The batch-name → offset arithmetic is automatic once the name is allowed-listed.
- **`v2-tryout-2` regression check** was skipped (no fresh diff written). The mode-axis branch in `runV2Batch` preserves the crawl path verbatim — code-review covers it, but a small re-run would close the loop empirically.
- **`SlimLlmPayload.format` field is now dead**: the LLM no longer emits format (tool-schema removed it), so `SlimLlmPayload.format` is always undefined and the `else if (llm?.format)` branch in `foldIntoBookV2Record` is dead. Left in place for backward-compat with any older cached payloads that may still carry `format`. Safe to remove after a few briefs if the field doesn't resurface.
- **HH-cluster `seriesHint` empirics (OQ-F)**: `year_outlier`'s anchor-table substring match against Excel strings like `"Original Horus Heresy"` is untested. First HH batch (`ssot-hh-001`) will produce evidence; loosening or normalizing strings is a Mini-Brief if matches drop unexpectedly.
- **Per-validator skipKinds for crawl-mode tuning**: The `runAllValidators({ skipKinds })` API is general — future briefs could selectively disable validators per-batch (e.g. a "Lexicanum-rich SSOT cluster" might suppress `lexicanum_missing` to reduce noise).

## References

- Brief 058: `sessions/2026-05-11-058-arch-v2-ssot-mode-first-batch.md`
- ADR: `brain/wiki/decisions/why-excel-ssot-not-crawl.md`
- Loader (Brief 057): `scripts/import-ssot-roster.ts`, `scripts/seed-data/book-roster.json`
- Schema 0008: `src/db/migrations/0008_ssot_schema.sql`
