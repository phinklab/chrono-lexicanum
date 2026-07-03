---
session: 2026-07-03-177
role: implementer
date: 2026-07-03
status: needs-decision
slug: dead-code-sweep
parent: 2026-07-02-177
links: [2026-06-30-171, 2026-07-02-176]
commits: []
---

# 177 — Dead-Code-Sweep: V1/V2-Ingestion-Retirement (Impl-Report)

## Summary

Die toten Ingestion-Generationen sind ausgebaut: **47 Dateien geändert, −8.994 LOC / +15** (43 Dateien gelöscht: 39 unter `src/lib/ingestion/**`, 4 unter `scripts/`; `llm/enrich.ts` von 277 auf 76 Zeilen getrimmt). Golden-Pfad bewiesen intakt (`equiv:diff` DB-frei: 896 Bücher, EMPTY DIFF), Refusal-Stubs unverändert, `tsc`/`eslint`/`check:eras`/30 DB-freie Test-Suiten grün. `CLAUDE.md`-Stack-Tabelle beschreibt jetzt den Per-Buch-SSOT-Stand.

**Eine Entscheidung offen (deshalb `needs-decision`):** 4 `sources:`-Frontmatter-Einträge in `brain/wiki/` zeigen auf gelöschte Dateien → `brain:lint` hat 4 blockierende Sources-Findings → **CI wird auf dem PR rot**. `brain/**` ist Rollup-only (Brief 095, „no exception"), also habe ich es nicht angefasst. Optionen unten in § „Blocker".

## Kandidaten-Inventar (Verdict je Eintrag)

Schnittlinien-Evidenz: Live-Pfade = Podcast-Ingest/-Apply, Refresh, Book-Review, `apply:book`, `backfill:hardcover-rating`, `/ingest`-UI-Routen. Golden-Pfad = `equiv:diff` → `legacy-corpus-projection.ts` → `book-apply-shared.ts`/`book-file.ts`/`seed-data/types` — **importiert nichts aus `src/lib/ingestion/**`**, der Golden-Pfad war seit 171 vollständig entkoppelt.

### Gelöscht (keine Live-, keine Golden-Pfad-Referenz)

| Eintrag | Evidenz |
|---|---|
| `src/lib/ingestion/{merge,field-priority,source-confidence,state,dry-run,diff-writer}.ts` | nur von `ingest-backfill.ts` bzw. untereinander konsumiert |
| `src/lib/ingestion/wikipedia/{fetch,parse}.ts` | nur ingest-backfill, `llm/context`, v2/run-engine (alle tot) |
| `src/lib/ingestion/lexicanum/{cache,fetch,parse}.ts` | nur ingest-backfill, `llm/context`, `v2/sources/lexicanum` (alle tot) |
| `src/lib/ingestion/open_library/{fetch,parse}.ts` | nur ingest-backfill, `v2/sources/open-library` (tot) |
| `src/lib/ingestion/hardcover/parse.ts` | nur ingest-backfill (Achtung: `hardcover/fetch.ts` bleibt — live, s. u.) |
| `src/lib/ingestion/llm/{cache,context,parse,prompt,rating}.ts` | nur vom gelöschten `enrichBookWithLLM`-Pfad + v2/llm konsumiert; Prompt-Vorlagen gelöscht per Brief-Empfehlung (git-Historie reicht — kein Gegenbeispiel gefunden) |
| `src/lib/ingestion/discovery/{merge,types}.ts` | nur v2/run-engine + `test-discovery-merge.ts` |
| `src/lib/ingestion/tlbranson/{fetch,parse}.ts` | nur v2/run-engine |
| `src/lib/ingestion/v2/{run-batch,run-engine,run-pilot}.ts` | nur ingest-backfill (dynamische Imports) + synthesize-v2-batch-diff |
| `src/lib/ingestion/v2/llm/{enrich,parse,prompt}.ts` | nur v2-Engine; ADR `why-cc-direct-curation` § „Reaktivierungs-Sicherung (Option A)" ist damit obsolet — Brief 177 supersedet diese Klausel, ADR-Text braucht Cowork-Update (s. § Follow-ups) |
| `src/lib/ingestion/v2/sources/{lexicanum,open-library}.ts` | nur v2/run-engine (`sources/hardcover.ts` bleibt — live, s. u.) |
| `src/lib/ingestion/v2/ssot/{load-roster,adapt}.ts` | 171-Inventar: „only the retired V2 batch-ingest path consumes them"; Golden-Pfad nutzt den eigenen `loadRosterSync` in `legacy-corpus-projection.ts`; Excel-Import-Stub (`import-ssot-roster.ts`) importiert nur `roster-extension` + `seed-data/types` |
| `src/lib/ingestion/v2/validators/*` (6 Dateien) | nur v2-Engine |
| `scripts/ingest-backfill.ts` (+ npm `ingest:backfill`) | V1/V2-CLI-Entry; einziger Konsument der V1-Kette. Die 140er-„Nicht löschen"-Einstufung (B1-3) war pre-170/171 und ist durch Board-B6/Brief 177 überholt |
| `scripts/synthesize-v2-batch-diff.ts` | V2-Helfer, kein npm-Script, importiert v2/run-engine |
| `scripts/analyze-v2-surfaces.ts` (+ npm `analyze:v2-surfaces`) | V2-Diff-Auswertung; Input-Artefakte bleiben unter `ingest/`, das Tool ist V2-Rest |
| `scripts/test-discovery-merge.ts` (+ npm `test:discovery-merge`) | testete gelöschtes `discovery/merge.ts` |

### Getrimmt

- `src/lib/ingestion/llm/enrich.ts` (277 → 76 Zeilen): **bleiben** die drei podcast-live Utilities `getLlmModel` / `isLlmEnabled` / `estimateUsdCost` + `PRICING` (Konsumenten: `podcast/extract.ts`, `scripts/ingest-podcast.ts`), byte-identisch bis auf den Wegfall des Circuit-Breaker-Checks in `isLlmEnabled` (der Breaker konnte nur vom gelöschten `enrichBookWithLLM`-Pfad im selben Modul getrippt werden — verhaltensgleich für Live-Konsumenten; der Podcast-Pfad hat seinen eigenen Anthropic-Client + 401-Handling). **Weg:** `enrichBookWithLLM`, `callApiWithRetry`, Client, Breaker, Anthropic-Import, Imports von cache/context/parse/prompt/types. Kein Verschieben/Umbenennen — Modulpfad unverändert.

### Behalten-weil-live

| Eintrag | Live-Konsument |
|---|---|
| `src/lib/ingestion/podcast/**` | Podcast-Delta-Pfad (Brief 172/175) |
| `src/lib/ingestion/types.ts` | `diff-reader.ts`, `/ingest`-UI, `v2/types.ts` |
| `src/lib/ingestion/diff-reader.ts` | `src/app/ingest/**` (Dashboard-Routen) |
| `src/lib/ingestion/hardcover/fetch.ts` | `backfill:hardcover-rating` (`getCircuitBreakerReason`, `isHardcoverEnabled`, `hardcoverQuery`) |
| `src/lib/ingestion/v2/sources/hardcover.ts` + `v2/types.ts` | `backfill:hardcover-rating` (`discoverHardcoverClaimV2`; idempotentes, wiederholbares Rating-Tool für neue Bücher) |
| `scripts/hardcover-{title,author}-normalize.ts` | backfill + `test:resolver` |
| `scripts/backfill-goodreads-rating.ts` | live, importiert nichts aus V1/V2 |
| devDeps `cheerio` (refresh/book-source, podcast/feed), `fast-xml-parser` (podcast/feed), `@anthropic-ai/sdk` (podcast/extract, book-review), `read-excel-file`/`write-excel-file` | keine Dep-Entfernung möglich |

### Behalten-weil-Golden

- `scripts/{equivalence-diff,legacy-corpus-projection,book-file,book-apply-shared}.ts`, `seed-data/types` — die komplette `equiv:diff`-Kette (inkl. `--db-snapshot`/`--compare`).
- Refusal-Stubs + Frozen-Set unangetastet: `apply-override.ts`, `loop-next-batch.ts`, `db-apply-scope.ts`, `run-ssot-loop.sh`, `import-ssot-roster.ts` (Excel-Loader-Carve-out, Escape-Hatch intakt), `roster-extension.ts`, `aggregate-surface-forms.ts`, `resolver-loop-detect.ts`, `apply-override-dry.ts`, `apply-override-collections.ts`, `resolver-pass-config.ts`, `run-phase4-apply.sh`, Runbooks + LEGACY-Banner.

### Unklar-drin (drin gelassen + gelistet, per Brief-Constraint)

1. **`src/app/ingest/**` (V1-Diff-Dashboard, Session 043).** Rendert die committeten, eingefrorenen `ingest/.last-run/*.diff.json`. Technisch lebende Route, aber inhaltlich V1-Rest — und `src/app/**` ist **Product-Strang-Eigentum**, Rückbau aus dem Batches-Worktree wäre eine Strang-Verletzung. Stale UI-Hint auf `npm run ingest:backfill` in `page.tsx:83`. → Empfehlung: Mini-Product-Brief (Route + `diff-reader.ts` + ggf. `types.ts`-Rest zurückbauen oder Hint fixen).
2. **`ingest/.compare/_runners/*.ts` (Brief-045-Vergleichsartefakte).** `dump-vocab.ts`/`variant-b-runner.ts`/`load-slug-data.ts` importieren gelöschte `llm/prompt`+`llm/context` — **dangling, aber eingefroren**: Brief-Constraint verbietet Löschen von `ingest/`-Artefakten, und beide Toolchains sehen sie nicht (Dot-Verzeichnis: außerhalb von tsconfig-`include`-Globs und eslint-Traversierung — empirisch verifiziert, tsc+eslint grün). Einzige verbleibende „dangling imports" im Repo, bewusst.

## Blocker / Entscheidung nötig: brain:lint wird auf dem PR rot

4 blockierende **Sources**-Findings, alle durch die Löschungen verursacht (auf `main` ist brain:lint grün):

- `brain/wiki/pipeline-state.md:58–60` → `../../scripts/{test-discovery-merge,analyze-v2-surfaces,synthesize-v2-batch-diff}.ts`
- `brain/wiki/decisions/why-cc-direct-curation.md:15` → `../../../src/lib/ingestion/v2/llm/enrich.ts`

`ci.yml` führt `brain:lint -- --no-write` auf jedem PR aus → dieser PR wird am brain:lint-Step scheitern. `brain/**` ist coordination-worktree-only („no exception"), deshalb habe ich die 4 Zeilen **nicht** angefasst. Optionen:

- **(a) Empfohlen:** Vorab ein 4-Zeilen-Koordinations-PR aus `chrono-lexicanum` (Rollup-Pfad), der die 4 `sources:`-Einträge entfernt. Das Entfernen einer Quellen-Zitation ist lint-safe, solange die Datei noch existiert — **Reihenfolge egal**, kann vor oder nach diesem PR mergen; nur wenn er zuerst merged, ist dieser PR sofort grün. Ich kann das auf Zuruf sofort machen.
- **(b)** Philipp autorisiert explizit, die 4 Zeilen in *diesem* PR mitzunehmen (bewusste, dokumentierte Ausnahme von der Rollup-Regel).
- **(c)** PR mit rotem brain:lint mergen (Bypass) und Cowork fixt im Post-Merge-Rollup — nicht empfohlen (roter CI-Stand auf `main` bis zum Rollup).

## CLAUDE.md (Stack-Tabelle + betroffene Prosa)

- Ingestion-Zeile: beschreibt jetzt Per-Buch-SSOT (`scripts/seed-data/books/`, `apply:book --all` als Schritt 2 der `db:sync`-Kette), Add-Book-Flow (`add-book-runbook.md`), Podcast-Delta (`/add-podcast`, `/add-podcast-episode`), Weekly-Refresh (`/weekly-db-update`), plus Hinweis auf den 177-Ausbau + eingefrorene `ingest/`-Artefakte.
- Repo-Layout: `ingest/`-Zeile (Crawler-Verweis raus, „lebender Ingest-Code: podcast/"), `seed-data/books/` ergänzt.
- Brief 177 Frontmatter: `status: open → implemented`.

## Verification

- `npx tsc --noEmit` — pass (bestätigt zugleich: `ingest/.compare/_runners` außerhalb des tsc-Graphen)
- `npx eslint .` — pass
- `npm run check:eras` — pass (CI-Parität: alle 4 CI-Steps grün außer brain:lint, s. Blocker)
- `equiv:diff` (DB-frei) — **EMPTY DIFF**: 896 Bücher, 0 row deltas, collections 196/196 — Golden-Pfad nach dem Sweep intakt
- Refusal-Stubs — `db:apply-override`, `loop:next`, `db:apply-scope` verweigern unverändert mit Per-Buch-Pointern (exit 1)
- 30 DB-freie Test-Suiten — **30/30 pass** (brain-lint-budgets, ask-questions, resolver, aliases, search-index, podcast-ingest/-youtube/-apply/-cc-direct, resolver-data/-coverage, entity-blurbs, apply-override-dry, synopsis-lint, collection-refs, audiobook-narrators, curation-overlay, timeline, loop-next, resolver-loop-detect, book-file, apply-book, map-worlds, book-detection-guard, migration-equivalence, refresh, roster-extension, book-review, book-enrich, preview-token). Nicht gelaufen: DB-gebundene (`test:ask-recommend`, Audits).
- `brain:lint -- --no-write` — 4 blocking (alle = die o. g. Sources-Einträge, durch Sweep verursacht), 43 warnings (pre-existing, u. a. 30 Stale-Claim-Suspects aus dem 176er-Checkset)

## Abbau beziffert

**47 Dateien geändert, −8.994 / +15 LOC.** Davon 43 Dateien gelöscht (39 × `src/lib/ingestion/**`, 4 × `scripts/`), 1 getrimmt (`llm/enrich.ts` −201 Zeilen), 3 npm-Scripts entfernt, 0 Dependencies entfernt (alle Kandidaten haben Live-Konsumenten).

## For next session / Follow-ups (Cowork-Rollup + Product)

- **Brain-Rollup (Cowork, Post-Merge):** die 4 `sources:`-Einträge (falls nicht via Option a/b vorab erledigt); `pipeline-state.md`-Prosa (§§ V1-Module, V2-Engine, tlbranson/wikipedia/discovery — jetzt Historie); `glossary.md`-Einträge „Pipeline-Engine", „Manual-Protection-Comparator", „confidence"-Verweis auf `source-confidence.ts`, „batched-3e"-Resume-Verweis; `architecture.md:131` (ingest-backfill-Zeile); ADR `why-cc-direct-curation` § „V2-LLM-Stage bleibt im Repo" + `why-sonnet-not-haiku` Reaktivierungs-Prosa (Option A ist durch 177 physisch entfallen); `onboarding.md:152` (ingest:backfill-Beispiel).
- **Product-Strang:** Mini-Brief für `src/app/ingest/**` (s. Unklar-drin #1).
