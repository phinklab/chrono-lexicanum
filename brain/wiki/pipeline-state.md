---
title: Pipeline state (Phase 3)
type: overview
created: 2026-05-09
updated: 2026-05-13
sources:
  - ../../src/lib/ingestion/
  - ../../sessions/archive/2026-05/2026-05-08-047-arch-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../sessions/archive/2026-05/2026-05-09-052-arch-ingest-retention-strategy.md
  - ../../sessions/archive/2026-05/2026-05-09-054-arch-pipeline-v2-pilot.md
  - ../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md
  - ../../sessions/archive/2026-05/2026-05-09-055-arch-v2-voll-lauf-decision-gate.md
  - ../../sessions/archive/2026-05/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md
  - ../../sessions/archive/2026-05/2026-05-10-056-arch-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-056-impl-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-057-arch-excel-roster-import.md
  - ../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md
  - ../../sessions/archive/2026-05/2026-05-11-058-arch-v2-ssot-mode-first-batch.md
  - ../../sessions/archive/2026-05/2026-05-11-058-impl-v2-ssot-mode-first-batch.md
  - ../../sessions/archive/2026-05/2026-05-11-060-arch-ssot-w40k-001-db-apply.md
  - ../../sessions/archive/2026-05/2026-05-11-060-impl-ssot-w40k-001-db-apply.md
  - ../../sessions/2026-05-11-061-arch-ssot-loop.md
  - ../../sessions/archive/2026-05/2026-05-12-063-arch-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-063-impl-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-067-impl-resolver-apply-readiness.md
  - ../../sessions/archive/2026-05/2026-05-12-069-impl-resolver-apply-evidence.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
  - ../../ingest/.archive/v1/backfill-20260508-2101.diff.json
  - ../../ingest/.archive/v2-pilot/v2-pilot-20260509-1934.diff.json
  - ../../ingest/.last-run/v2-batch-20260510-1109.diff.json
  - ../../scripts/test-discovery-merge.ts
  - ../../scripts/analyze-v2-surfaces.ts
  - ../../scripts/synthesize-v2-batch-diff.ts
  - ../../scripts/import-ssot-roster.ts
  - ../../scripts/db-reset-for-ssot.ts
  - ../../scripts/seed-data/book-roster.json
  - ../../src/db/migrations/0008_ssot_schema.sql
  - ../../src/db/migrations/0009_lucky_pete_wisdom.sql
  - ../../src/lib/resolver/index.ts
  - ../../scripts/apply-override.ts
  - ../../docs/resolver-apply-runbook.md
related:
  - ./project-state.md
  - ./architecture.md
  - ./glossary.md
  - ./decisions/why-haiku-not-sonnet.md
  - ./decisions/why-multi-source-merge.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./open-questions.md
confidence: high
---

# Pipeline state (Phase 3, post-069)

> The TypeScript ingestion pipeline as it stands today. Sources, modules, current numbers, levers pulled, what's next. Detail-level page; for the high-level "where are we" use [`./project-state.md`](./project-state.md).
>
> **Two paths since 054, but SSOT is the active authority path.** V1 remains for reproducibility of old diffs. V2 now has SSOT mode from 058 (`book-roster.json` instead of Wikipedia/TLBranson discovery), a curated override/apply path from 060/061, and a resolver layer from 063–069. OQ4/OQ5 are closed for the first 50 W40K books: canonical Reference rows + Alias JSONs + `raw_name` audit + re-apply `ssot-w40k-001..005` are in place.

## Architecture

**V1 — Multi-Source-Merge with field-by-field source-priority + LLM enrichment two-pass.** Discovery from Wikipedia (master lists, ~700 books); per-book crawl from Lexicanum + Open Library + Hardcover; LLM (Anthropic Haiku 4.5 + Web Search, mandatory ≥2 calls/book) for synopsis paraphrase + soft-facets + format/availability + plausibility cross-check + reader-rating capture. Output: dry-run diff JSON committed under `ingest/.last-run/`. **No DB writes from the pipeline yet** — Apply-Step (3d) is the next sub-phase.

**V2-Pilot — Discovery-Spine + Validators + Slim-LLM + Provenance-pro-Feld.** Siehe Sektion „V2-Pipeline (Pilot, post-054)" weiter unten. V1 bleibt für Reproduzierbarkeit alter Diffs erhalten; V2 läuft als Opt-In-Flag parallel.

### 21 modules under `src/lib/ingestion/`

Core (4): `types.ts`, `diff-writer.ts`, `diff-reader.ts`, `state.ts`

Engine (4): `dry-run.ts`, `field-priority.ts`, `merge.ts`, `source-confidence.ts`

Source pairs (8): `wikipedia/{fetch,parse}.ts`, `lexicanum/{fetch,parse}.ts`, `open_library/{fetch,parse}.ts`, `hardcover/{fetch,parse}.ts`

LLM (5): `llm/{enrich,prompt,parse,rating,cache}.ts`

Each source pair exports a `SourceCrawler` with `discover(roster?) → DiscoveredBook[]` and `fetchOne(slug) → SourcePayload`. The merge engine combines `SourcePayload[]` per `FIELD_PRIORITY` into a `MergedBook`. `processOne` then makes a two-pass LLM call: pass 1 with the merged data, pass 2 incorporating the LLM's output back into the merged result.

CLI entry: `scripts/ingest-backfill.ts` — `tsx --env-file=.env.local scripts/ingest-backfill.ts --limit N --offset M [--slug X] [--source <single>]`. Resumable state under `ingest/.run-state.json`; per-book save protects against Ctrl-C.

## Sources — what each contributes

| Source | Discovery | Per-book fields | Constraints |
|---|---|---|---|
| **Wikipedia** | Master-list parser (4 pages: Hauptliste + HH-novels + Siege_of_Terra + Eisenhorn → 701 unique post-3b) | title, authorNames, releaseYear (publication year), ISBNs (sometimes), seriesIndex (sometimes) | HTTP-fetch, no auth |
| **Lexicanum** | URL-probing only (no api.php; Cloudflare blocks Node-native fetch — uses curl shell-out for `/wiki/` article pages) | title, authorNames, releaseYear, isbn13, **startY**, **endY** (in-universe years; Lexicanum's lore-anchor strength) | URL-pattern enumeration (11 patterns post-047 + Opensearch fallback). **Does NOT contribute factionNames/locationNames/characterNames** — body wikitext is prose, not infobox. See [open-question 11](./open-questions.md#11-lexicanum-trägt-keine-junction-daten---body-lore-pass-oder-field_priority-reduktion). |
| **Open Library** | (not used) | coverUrl, isbn13, isbn10, pageCount, authorNames-Lückenfüller. Post-047: `language=eng` filter + parse-time-Year-Cross-Check against re-issue trap. | API rate-limit; loose JSON schema (defensive parsing) |
| **Hardcover** | (not used) | tags (genre/mood/content-warning), averageRating, ratingCount, contributorNames (post-047: editor-heuristic for anthologies) | Hasura-ish API, requires `HARDCOVER_API_TOKEN`. **Server blocks `_ilike`/`_iregex`** — only exact title-string match works. ~6/7 success rate empirically. |
| **LLM** (Anthropic Haiku 4.5 + Web Search) | (not used) | Synopsis paraphrase (100–150 W, license-safe), soft-facets (strict-vocab against `facet_values`), format+availability classification with mandatory web-search verification (Black Library Shop + Amazon + Audible), reader-rating capture per source-priority `[amazon → goodreads → hardcover → audible]`, **factionNames/locationNames/characterNames** (post-047 tool-schema addition — currently the ONLY junction data source), `discoveredLinks` (storefront URLs for 3d-FK-resolution), `llm_flags` (year_glitch, data_conflict, author_mismatch, value_outside_vocabulary, …). | Mandatory ≥2 web-search calls/book; FS-cache under `ingest/.llm-cache/<slug>.json` keyed by slug + prompt-version-hash. |

## Field-priority map

`field-priority.ts` defines per-field source ranking. Highlights:

- `title`: `[wikipedia, lexicanum]`
- `authorNames`: `[wikipedia, hardcover, lexicanum, open_library]` (multi-source, Hardcover author-list often best for anthology editors)
- `releaseYear` (publication): `[wikipedia, open_library, hardcover, lexicanum]`
- `startY` / `endY` (in-universe): `[lexicanum, llm]` (lexicanum's lore-strength)
- `isbn13`, `isbn10`: `[open_library, lexicanum]`
- `pageCount`: `[open_library]`
- `coverUrl`: `[open_library]`
- `format`, `availability`: `[llm]` (LLM is the only source that classifies these)
- `synopsis`: `[llm]` (paraphrased; never from Lexicanum/Wikipedia verbatim)
- `factionNames`, `locationNames`, `characterNames`: `[lexicanum, llm]` — but **effectively `[llm]`** post-047 because Lexicanum doesn't contribute these (open question)
- `tags` (genre/mood/cw): `[hardcover]`
- `rating`, `ratingSource`: `[llm]` (LLM picks the source via priority)

## Merge engine output

`MergedBook` carries:

- `slug`, `fields` (the per-field-source-resolved values)
- `fieldOrigins: Record<string, SourceName>` — which source won each field (audit trail)
- `sources: SourcePayload[]` — what each source returned (audit)
- `auditPayloads: Record<SourceName, unknown>` — source-specific audit info (e.g. Hardcover tags)
- `primarySource: SourceName` — the dominant source for the merged record (post-047: from `pickPrimarySource(fieldOrigins, payloads)`, replacing the 100%-Wikipedia-Lead. Today distributes ~`lexicanum` 1× / `llm` 5× in the 9-book test slice; the `wikipedia` branch is effectively dead code as of post-047.)
- `confidence: numeric(3,2)` — derived per `source-confidence.ts` from primarySource + merge metadata
- `llm_flags`, `llmCostSummary`, `rawLlmPayload` — LLM audit slots

## Migrations relevant to pipeline

- `0005_solid_giant_man.sql` (3b) — `book_format` + `book_availability` enums + `isbn10` + `pageCount` + `book_details_primary_era_idx`
- `0006_illegal_sharon_carter.sql` (3c) — `book_details.rating` + `rating_source` + `rating_count` (all nullable)
- **`0007` (047) — committed-but-NOT-applied.** Adds `wikipedia`, `open_library`, `hardcover`, `llm` to the `source_kind` pgEnum. Required when 3d-Apply ships and pipeline-source rows actually land in DB. Don't accidentally run `npm run db:migrate`.

## Latest acceptance numbers (post-047)

`ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, run aborted by Philipp at Buch 9; archived in 056):

| Metric | 044 baseline | 047-impl |
|---|---|---|
| Junction-Coverage (factionNames/locationNames/characterNames) | 0/50 | **6/6 = 100%** (rein aus LLM-Output) |
| `releaseYear`-Field-Conflicts | 11/15 | 0/0 |
| Format/Availability invalide Werte | (Blind-Cast accepted any) | 0 |
| `value_outside_vocabulary` flags | 6 (3 distinct) in 50 books | 0 in 9 books |
| Cost/book | $0.118 | **$0.114** (–3%) |
| `primarySource` distribution | 50/50 `wikipedia` | 1× `lexicanum`, 5× `llm` (wikipedia branch dead) |
| Anthologie author-mismatch test | 1/1 (042 baseline) | not exercised (slice was Single-Author-Novels) |

**Migration 0007 committed-but-not-applied** (3d job).

## Five levers from 047 (currently live)

- **A. `source_kind`-Enum extension + `pickPrimarySource`-logic.** Pipeline now emits `wikipedia`/`open_library`/`hardcover`/`llm` as primary-source values; old 100%-Wikipedia-Lead replaced. DB enum migration 0007 covers the schema side (uncommitted apply).
- **B. Lore-Coverage.** Lexicanum-URL-Patterns expanded 3→11 + Opensearch-Fallback. LLM-Tool-Schema now includes `factionNames`/`locationNames`/`characterNames`. **Caveat:** Lexicanum doesn't actually contribute these (Body-Wikitext is prose, not infobox); 100% comes from LLM output. Field-priority for these three is `[lexicanum, llm]` but effectively `[llm]`.
- **C. Format/Availability validation.** Closest-Match-Map (`book → novel`, `short → short_story`) replaces Blind-Cast in `llm/parse.ts`. Unknown values flagged as `value_outside_vocabulary`.
- **D. Open Library edition filter.** `language=eng` query param + parse-time-Year-Cross-Check. Catches re-issue-trap (older book, modern reprint year on the OL record). 0 `releaseYear`-conflicts in 9-book test (vs 11/15 in 044).
- **E. Hardcover-Author-Hint in LLM-User-Prompt.** Editor-heuristic for anthologies: when Hardcover's contributor list shows multiple authors but Wikipedia/Lexicanum show one (the editor), the LLM prompt is hinted to flag and reconsider. **Code-verified, not empirically tested** — 0–9 slice had no anthologies. See [open-question 10](./open-questions.md#10-anthologie-re-test-für-hebel-e-hardcover-author-hint).

## V2-Pipeline (Pilot, post-054)

V2 entstand aus drei Befunden, die V1's Härtungs-Hebel (047) nicht adressierten:

- Lexicanum-Body-Year-Halluzinationen (`startY=39000` für *false-gods*) gingen ungeprüft in Diffs.
- Open-Library-PageCount-Müll (`pageCount=2` für *garro*) hatte keine Sanity-Schwelle.
- Hardcover-Author-Mismatches überschwemmten `errors[]` (44/50 Müll-Errors in 044) und machten das Dashboard unleserlich.

Plus zwei strukturelle Zusatzbefunde aus dem 2026-05-09-Audit: Wikipedia-Master-Liste hat eine Frische-Lücke ab Dezember 2025 (TLBranson ist frischer); Rating und Availability sind volatile Felder, gehören schemabedingt nicht in den Bulk-Crawl (eigener Refresh-Pfad in zukünftigem Brief 057).

### V2 Stage-Architektur

**Stage 0 — Discovery (Wikipedia + TLBranson).** Zwei parallele Discovery-Module mit gemeinsamer `DiscoveredBook`-Output-Form (`{ slug, title, releaseYear?, authorHint?, seriesHint?, seriesIndex?, isEntryPoint?, sourcePages[] }`). TLBranson cached unter `ingest/.cache/tlbranson/`; Parser strippt Amazon-Affiliate-URLs und peelt Date/Author/Paren-Trailers. Dedup über slug + Levenshtein-2-Title-Fallback.

**Stage 1 — Source-Claims-Crawl.** Pro Buch parallel bis zu drei Fetcher (Lexicanum, OL, Hardcover); jeder schreibt einen `SourceClaim` (`{ source, sourceUrl, fetchedAt, fields, raw, notes }`). Lexicanum-Refactor: `extractUniverseYears` (Body-Year-Regex) ist aus dem FIELDS-Pfad entfernt — Body-Scan bleibt nur als `claim.raw.bodyYearCandidates` für Audit-Evidence. OL-Sanity: `pageCount<30` drop, `>1500` flag. Hardcover-Author-Mismatch: silent skip (kein `errors[]`-Eintrag).

**Stage 2 — Validators.** Fünf deterministische Validatoren, jeder produziert `Validation[]` (`{ field, severity, kind, evidence[], suggested?, reasoning }`):

- `year_outlier` — Series-Anker-Tabelle (HH/SoT M30/M31, Eisenhorn/Ravenor/Cain M40, Dawn-of-Fire M42); `severity: error` + `action: drop` bei `±1000`-Verstoß.
- `edition_isbn_conflict` — Lexicanum vs OL, niedrigere ISBN als Erstausgabe-Heuristik.
- `pagecount_outlier` — `<30` error/drop, `>1500` warn/flag.
- `author_editor_suspicion` — Lexicanum-Editor-Cell oder `/various|editor|edited.by|anonymous/i` Single-Author → Anthologie-Flag.
- `lexicanum_missing` — Transparenz-only.

Validatoren modifizieren Stage-1-Claims **nicht** direkt; Stage 4 foldet sie in den finalen Record.

**Stage 3 — Slim-LLM.** `PUBLISH_ENRICHMENT_TOOL_V2` (kein Rating, kein Availability), `WEB_SEARCH_TOOL_V2` (`max_uses: 3`, 1 obligatorisch), structured `factions`/`locations`/`characters` Arrays mit `{name, role}`. `PROMPT_VERSION_HASH_V2` invalidiert V1-Cache; V2-Cache-Files kriegen `.v2.json`-Suffix für parallele Koexistenz.

**Stage 4 — `BookV2Record` + Diff-Writer.**

```ts
type FieldRecord<T> = {
  value: T;
  source: SourceName | "validator" | "discovery" | "llm" | "validator-corrected";
  fetchedAt: string;
  override: T | null;             // human override slot
  evidence?: { source: string; value: unknown }[];
};

type BookV2Record = {
  slug: string;
  fields: { /* title, authorNames, releaseYear, seriesHint, ..., factions, locations, characters */ };
  validations: Validation[];
  rawClaims: SourceClaim[];
  rawLlmPayload: SlimLlmPayload | null;
  llmCostSummary: { tokensIn, tokensOut, webSearches, estUsdCost };
};
```

Diff-Form: `ingest/.last-run/v2-pilot-YYYYMMDD-HHMM.diff.json` mit `pipeline: "v2"`, `pilot: "v2-tryout-1"`, `discoverySource: ["wikipedia", "tlbranson"]`, `validationSummary`-Histogramm, `llmCostSummary`. Renderbar im `/ingest`-Dashboard ohne Code-Änderung (synthesized `payload: MergedBook`-Shim).

### V2-Modul-Layout (parallel zu V1)

- `src/lib/ingestion/v2/types.ts` — V2-Types
- `src/lib/ingestion/tlbranson/{fetch,parse}.ts` — neue Discovery-Quelle. Post-055: `NAV_TITLE_RE` rejects nav-article cross-links ("Ways to Read", "Books in Order", "Reading Order", "Guide to") — TLBranson pages embed sidebar links to other reading-order articles which previously polluted the slug-window with non-W40k entries.
- `src/lib/ingestion/discovery/{types,merge}.ts` — gemeinsame Discovery-Form. Post-055: deterministic `genericityScore(seriesHint)` + `pickBetterSeriesHint(a, b)` make seriesHint folding order-independent (`scripts/test-discovery-merge.ts` covers it with 11 cases).
- `src/lib/ingestion/wikipedia/parse.ts` — Wikipedia parser. Post-055: `BOOK_INDEX_RE` extended to also match the bare-numeric prefix form (`001: Title`, `001 - Title`) Wikipedia adopted in late 2025; previous regex only matched `Book NNN - Title`.
- `src/lib/ingestion/v2/sources/{lexicanum,open-library,hardcover}.ts` — V2-Claim-Adapter
- `src/lib/ingestion/v2/validators/{year-outlier,edition-isbn,pagecount,author-editor,lexicanum-missing,index}.ts`
- `src/lib/ingestion/v2/llm/{prompt,parse,enrich}.ts` — Slim-LLM. Post-055: `SYSTEM_PROMPT_V2` Web-Search-Discipline section is now **strict** (Search 1 mandatory; Search 2 only when supplied data + Search 1 yields zero structured-array entities AND book is narrative; Search 3 only when two sources directly contradict on a structured field). `PROMPT_VERSION_HASH_V2` bumped to `034110f668c5` (was `305ed8d37ce0`).
- `src/lib/ingestion/v2/run-engine.ts` (post-055) — shared Stage 0 (discovery) + Stage 1–4 (per-book) + diff-writer logic, factored out so pilot + batch share one implementation. Exports `discoverV2Roster()`, `processBookV2(book)`, `writeV2DiffFile(diff, prefix, startedAt)`.
- `src/lib/ingestion/v2/run-pilot.ts` — pilot orchestrator (slim wrapper around the engine post-055). PILOT_V2_TRYOUT_1 + PILOT_HINTS + fuzzyMatch + synthesizeMissingBook stay here.
- `src/lib/ingestion/v2/run-batch.ts` (post-055) — batch orchestrator. Sorts merged discovery roster by slug ascending, takes first N, runs each through `processBookV2`. Filename prefix `v2-batch-`. Currently only `v2-tryout-2` registered; same one-name gate as the pilot.

V1-Module bleiben unangetastet; CLI-Dispatch in `scripts/ingest-backfill.ts` über `--pipeline=v2 --pilot=<name>` (Pilot) oder `--pipeline=v2 --batch=<name> [--limit=N]` (Batch, default `--limit=100`). Mutual exclusion enforced. Beide V2-Pfade sind diff-only.

### V2-Pilot Acceptance-Numbers

`ingest/.archive/v2-pilot/v2-pilot-20260509-1934.diff.json` (5 Bücher: eisenhorn-xenos, false-gods, garro, tales-of-heresy, chem-dog; archived in 056):

| Bullet | Status |
|---|---|
| Diff committed unter korrektem Pfad | ✓ |
| `BookV2Record` pro Buch mit allen Slots | ✓ (5/5) |
| `eisenhorn-xenos`: 0 Validations + Synopsis ≥ 100 W | ✓ (130 W) |
| `false-gods`: `year_outlier` mit Lexicanum-Evidence-Wert 39000, finaler `startY` source ≠ `lexicanum` | ✓ (`source: "validator-corrected"`, `value: null`) |
| `garro`: `pagecount_outlier` Validation | ⚠ (Code-verifiziert; OL hat diesmal keinen `pageCount=2` zurückgegeben) |
| `tales-of-heresy`: `author_editor_suspicion` + `format=anthology` von Validator + 0 Hardcover-`errors[]` | ✓ (alle drei Sub-Kriterien) |
| `chem-dog`: TLBranson in `sourcePages` | ✓ (TLBranson alleine) |
| Diff rendert im `/ingest`-Dashboard | ✓ |
| `llmCostSummary.totalWebSearches ≤ 7` | ⚠ (8; 1 über Target, im `max_uses=3`-Korridor) |
| Kein Rating/Availability in `rawLlmPayload` oder `fields` | ✓ |
| V1-Pfad unverändert (smoke `--slug=false-gods --dry-run`) | ✓ |
| `npm run lint` + `tsc --noEmit` grün | ✓ |

**Cost:** $0.062/Buch (Pilot) vs. V1 post-047 $0.114/Buch — fast Halbierung. Hochrechnung 750 Bücher V2 ≈ $46 (vs. V1 ≈ $86).

### V2-Voll-Lauf Acceptance-Numbers (post-055)

`v2-batch-20260510-1109.diff.json` (50 Bücher slug-window `13th-legion → ascension`). Der Live-Lauf hat trotz mid-session-Maintainer-Halt-Direktive (`TaskStop`) das Bash-Wrapper überlebt und bis Buch 50 weitergelaufen — der diff ist die canonical 055 Voll-Lauf Artefact. Real source claims, real validator data, real LLM payloads.

- **Cost (recomputed):** $0 in `llmCostSummary.estUsdCost` — every book was a cache hit when the live batch landed (LLM cost was charged during the killed runs; cached responses report `enrich.estUsdCost = 0`). Actual fresh-run per-book cost from the post-fix 5-book smoke war **$0.0199**, vs Pilot $0.062 vs V1 $0.114. Hochrechnung 750 Bücher V2-Voll-Lauf ≈ **$15** auf der gemessenen Pace. Cached-cost-recompute ist 055.5er-Backlog.
- **Web-search:** **1.06/Buch im Mittel** (53 searches over 50 books; 47 books took exactly 1, 3 took a 2nd). Die strikte Prompt-Härtung in 055 hält. Brief-Target ≤1.4 ✓.
- **Validator-Trigger-Histogramm:** 4-of-5 kinds non-zero. `year_outlier` 1× (`angel-exterminatus`), `edition_isbn_conflict` 1× (`angel-exterminatus`), `pagecount_outlier` 0×, `author_editor_suspicion` 2× (`age-of-darkness`, `architect-of-fate` — beide Anthologien deterministisch durch Validator 4 als `format=anthology` klassifiziert), `lexicanum_missing` 20× (~40% des slug-windows, viele kürzliche Short-Stories ohne Lexicanum-Eintrag).
- **Discovery:** 1040 Bücher merged (874 wiki + 808 tlbranson, deduped post-fixes). 0 `synthesized minimal record from slug` errors.
- **Surface-Form-Verteilung:**
  - Factions: 133 occurrences / 60 distinct, **46.7% Direct-Match**, 3.3% Alias-Candidate, 50.0% Unknown. Clear canonical-Lücken in `seed-data/factions.json`: Iron Hands, Emperor's Children, Black Legion, Death Guard, Sisters of Silence, Ecclesiarchy. Clear Aliases: "Imperial Guard" / "Imperial Army" / "Imperium of Mankind" / "War Hounds" / "Prodigal Sons" / "Last Chancers" / "13th Penal Legion" → existing canonicals.
  - Locations: 101/76, 13.2% Direct-Match (`seed-data/locations.json` ist galaktischer Cartography-Anker, nicht Lore-Welten-Bibliothek). Ships (Black Ship, Conqueror, Endeavour of Will, Fist of Iron, Titan Child) leak into the location bucket — Resolver-Design-Frage für 056.
  - Characters: 183/146, **0% Direct-Match** — strukturell, weil `seed-data/persons.json` der Author-Roster ist, nicht in-universe Characters. Für Brief 056 architectural blocker: entweder canonical character table designen (Option A), characters explizit aus Resolver-Pfad rausnehmen (Option B), oder Hybrid Top-100 (Option C). Empirie spricht für C — Primarchs + Ahriman + Schaeffer cluster naturally above the noise floor.

Surface-Form-Top-20 + Resolver-Triage-Notes liegen im Implementer-Report; full-frequency dump für Resolver-Tooling unter `ingest/.last-run/v2-batch-20260510-1109-surfaces.json`.

### V2-Bekannte Schwächen (Status post-055)

- ✅ **Discovery-Merge-Fuzzy-Edge-Case** (eisenhorn-xenos) — **gefixt in 055** via deterministic `genericityScore` in `discovery/merge.ts`. Master-list seriesHints lose to sub-page seriesHints regardless of folding order; lex-smaller wins on tie. Unit test covers the three brief-mandated cases.
- ✅ **Web-Search-Großzügigkeit** (Pilot 1.6/Buch) — **gefixt in 055**. Strict prompt language + tightened user-prompt reminder. 20-book post-055 batch shows **1.00 web_search/book** (every book exactly 1).
- ⚠ **Validator 3 (`pagecount_outlier`) nur per Inspektion verifiziert** — Pilot OL didn't return `pageCount=2` for *garro* (V1-known glitch not reproducible). Code path verified by inspection on `pagecount_below_threshold` notes; will fire whenever OL returns a sub-30 value.
- ⚠ **Lexicanum-Throttle dominiert Voll-Lauf-Latenz** (new in 055). The `CRAWL_DELAY_MS = 5_000` × 11-pattern URL probe per `lexicanum_missing` book makes per-book floor ~60s for source fetches alone. With ~70% lex-missing rate in the post-canonical slug-window, a 100-book batch is ~70+ min on Lexicanum throttle alone, before LLM. Mitigation in 055.5er backlog: per-page Lexicanum cache (24h, mirroring `ingest/.cache/tlbranson/`).
- ⚠ **No per-book diff checkpointing in `run-batch.ts`** (new in 055). The diff writes at end-of-loop only; killing mid-run loses aggregated state. Synthesis from LLM cache (`scripts/synthesize-v2-batch-diff.ts`) bridges in the meantime but produces empty `validations[]` per book. 055.5er backlog: partial-diff write under `ingest/.state/v2-batch-<name>.partial.diff.json`.
- ⚠ **Discovery still includes some non-book entries** (new in 055). Post-fix slug-window includes `about-the-horus-heresy`, `about-warhammer-40k`, `above-and-beyond` — Wikipedia entries with italic-text `<li>` items that aren't actually books. Lower-priority than the Lexicanum cache; might want a "book-likeness" filter in 056's Resolver triage.

## Excel-SSOT layer (post-057)

Discovery-Stage-Replacement (siehe [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)). Die Maintainer-kuratierte Excel ist ab Brief 058 die Roster-Quelle der Pipeline; Wikipedia/TLBranson-Crawler bleiben im Code, sind im SSOT-Mode aber nicht mehr Default-Eingang.

### Inputs + outputs

- **Source**: `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt, committed bei Bedarf). Zwei Sheets: `Books` (859 rows, 16 columns: `Book ID, Original #, Source, Title, Author, Release Date, Release Year, Type, Section / Series, Contained In Collection, Contained In Book IDs, Contained In Titles, Collects Book IDs, Collects Titles, Source URL, Relation Notes`) und `Collection Links` (191 data rows + 1 header, 10 columns mit Confidence + Basis).
- **Loader**: `scripts/import-ssot-roster.ts` — `read-excel-file` 9.0.9 mit `{ trim: false }`-Workaround (Library-Bug auf bestimmten leeren String-Cells); pure parsers (`parseBookRow`, `validateCollectionLinkRow`, `splitAuthors`, `normalizeFormat`, `resolveSlugs`) plus I/O-Entry. Loud-Validation mit Excel-Zeilennummer.
- **Output**: `scripts/seed-data/book-roster.json` — `{ schemaVersion: "1.0", sourceFile, books[859], collections[191] }`. RosterBook-Form: `{ externalBookId, slug, title, authors, editors, editorialNote, releaseYear, format, seriesHint, sourceUrl, notes, sourceRow }`. Collection-Form: `{ contentExternalId, collectionExternalId, displayOrder, confidence, basis }`. Sortierung: lexicographic by `externalBookId` (HH-NNNN vor W40K-NNNN); Collections nach `(contentExternalId, collectionExternalId)`. Re-Run-Determinismus via SHA256-Hash verifiziert.
- **NPM-Scripts**: `npm run import:ssot-roster` (kein `--env-file`, pure file I/O), `npm run db:reset-for-ssot -- --confirm` (oder `DB_RESET_CONFIRM=1`-ENV).

### CC-Erweiterungen ggü. Brief-057-Acceptance (Cowork akzeptiert)

- **`editors: string[]` + `editorialNote: "various" | null` als zusätzliche RosterBook-Felder.** Konsequenz aus den zwei OQ-Antworten "Various Authors" + "(ed.)"-Trailing. `"Various Authors"` → `authors=[]` + `editorialNote="various"` (62 Bücher betroffen: 61× direct + 1× `Dan Abnett & Others`). `(ed.)`/`(eds.)`/`(editor)`-Trailing → `editors[]`-Slot (heute 0 Treffer in der Excel, aber Slot bereit für 058+).
- **`works.external_book_id` UNIQUE ohne separaten Index.** `.unique()` in Drizzle/Postgres erzeugt B-Tree-Backing; separater `index()` wäre redundant.
- **`work_collections`-Junction nur ein Sekundär-Index** auf `content_work_id` (statt zwei wie im Brief). Composite-PK auf `(collection_work_id, content_work_id)` deckt `WHERE collection_work_id = ?` als Leading-Column-B-Tree ab. Maintainer kann via 0009-Mini-Migration nachreichen falls gewünscht.
- **Year-Validierung pragmatisch:** `null` → `console.warn` + `releaseYear: null` (1 Treffer: W40K-0307 "War for Armageddon Omnibus"); non-numeric oder ≤0 → loud-Error.
- **Slug-Disambiguierung 1× Section-Suffix:** `ascension-dawn-of-war` (W40K-0208) + `ascension-blackstone-fortress` (W40K-0485). Pass-2 ist order-independent, beide bekommen den Suffix. 0 Triple-Collisions.
- **Migration `--name=ssot_schema`**: sprechender Suffix statt Drizzle-Default-Random; vermeidet TTY-Prompt-Hang bei `strict: true`.
- **`RESTART IDENTITY` weggelassen** im Truncate (UUIDs only, keine Sequenzen).
- **`seed.ts` TRUNCATE-Liste defensiv um `work_collections` erweitert** (eine Zeile, falls jemand post-SSOT seedet).

### Schema-Migrations `0008` + `0009` (applied)

```
ALTER TYPE book_format ADD VALUE 'collection';
ALTER TYPE book_format ADD VALUE 'artbook';
ALTER TYPE book_format ADD VALUE 'scriptbook';
ALTER TYPE source_kind ADD VALUE 'ssot';
CREATE TABLE work_collections (
  collection_work_id uuid NOT NULL,
  content_work_id    uuid NOT NULL,
  display_order      integer DEFAULT 0 NOT NULL,
  confidence         numeric(3,2),
  basis              text,
  PRIMARY KEY (collection_work_id, content_work_id),
  FOREIGN KEY (collection_work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (content_work_id)    REFERENCES works(id) ON DELETE CASCADE
);
CREATE INDEX work_collections_content_idx ON work_collections (content_work_id);
ALTER TABLE book_details ADD COLUMN notes text;
ALTER TABLE works ADD COLUMN external_book_id varchar(16);
ALTER TABLE works ADD CONSTRAINT works_external_book_id_unique UNIQUE (external_book_id);
```

`drizzle-kit` 0.31.10 generiert kein `IF NOT EXISTS` mehr auf `ALTER TYPE ADD VALUE`. Akzeptabel — jede Migration läuft genau einmal pro DB.

### Type-Normalisierungs-Map (Excel → DB-Enum)

`Audio Drama → audio_drama`, `Short Story → short_story`, `Novel → novel`, `Anthology → anthology`, `Omnibus → omnibus`, `Novella → novella`, `Collection → collection`, `Artbook → artbook`, `Scriptbook → scriptbook`. Unbekannter Wert → loud-Error mit Excel-Zeilennummer + Liste der erlaubten Werte. Trim + collapse-whitespace + case-insensitive.

### `display_order` Hybrid-Quelle

Pair-Set kommt aus `Collection Links`; Order-Sequenz aus Books-Sheet `Collects Titles` (Pre-built `Map<parentExternalId, ChildTitleSequence>`, Lookup via `childSequence.indexOf(contentTitle)`). Kein Match → `displayOrder = 0` (Frontend fällt auf releaseYear-sort zurück).

### Author-Splitting-Empirie (859-Buch-Loader-Lauf)

| Pattern | Count | Beispiel |
|---|---|---|
| Solo | 772 | `"Dan Abnett"` → `["Dan Abnett"]` |
| Multi (`X and Y`) | 3 | `"William King and Lee Lightner"`, `"Marc Gascoigne and Andy Jones"`, `"Gordon Rennie and Will McDermott"` |
| Various (`Various Authors` + `& Others`) | 62 | `"Various Authors"` → `authors=[]`, `editorialNote="various"`; `"Dan Abnett & Others"` → `authors=["Dan Abnett"]`, `editorialNote="various"` |
| `(ed.)`/`(eds.)`/`(editor)` | 0 | Slot bereit; aktuell keine Excel-Treffer |
| Leere Author-Cell, kein Marker | 23 | `releaseYear: null` (warn) oder Maintainer-Excel-Maintenance |

Total mit Doppel-Zählung-Korrektur: 772 + 3 + 62 + 23 − 1 = 859. ✓

### Excel-Maintenance-Workflow

Maintainer editiert die Excel extern (LLM-assistierter Workflow), committet die neue Version unter `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, läuft `npm run import:ssot-roster`, committet die frische `book-roster.json`. Re-Run-Stabilität (SHA256) sorgt dafür, dass identisches Excel = byte-identische JSON.

### Resolver layer (post-063 through 069)

The first 50 W40K authority books (`ssot-w40k-001..005`) now have a concrete resolver/apply layer:

- `src/lib/resolver/index.ts` resolves Factions, Locations, Characters via direct name + alias JSONs; `src/lib/resolver/roles.ts` normalizes roles before DB writes.
- `scripts/seed-data/faction-aliases.json`, `location-aliases.json`, `character-aliases.json`, `characters.json`, plus extended `factions.json`, `locations.json`, `sectors.json` are the checked-in resolver sidecars.
- `src/db/migrations/0009_lucky_pete_wisdom.sql` made `locations.gx/gy` nullable and added `raw_name` audit columns to all three work junctions.
- `scripts/seed-resolver-extensions.ts` seeds resolver reference rows idempotently with loud preflight validation; 069 seeded +23 Factions, +3 Sectors, +40 Locations, +65 Characters.
- `scripts/apply-override.ts` writes `work_factions`, `work_locations`, and `work_characters`; 069 re-applied `ssot-w40k-001..005` and verified `work_factions=318`, `work_locations=129`, `work_characters=363`.
- Safety tests: `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`. Runbook: `docs/resolver-apply-runbook.md`.

Known caveat: `nightbringer` has 1/1 resolved Location because the override only supplies Pavonis; this is accepted data truth, not a resolver failure.

### Bekannte Schwächen / Out-of-scope

- **`read-excel-file` 9.0.9 Library-Bug** (`parseString` crasht ohne `{ trim: false }` auf bestimmten leeren String-Cells). Workaround in einem Argument; upstream-Issue noch nicht aufgemacht. Low priority.
- **`read-excel-file` 6 moderate-severity Audit-Vulnerabilities** (transitive Deps: `fflate`, `unzipper` u. a.). `npm audit fix --force` würde Major-Version verschieben — beobachten, nicht fixen.
- **W40K-0307 "War for Armageddon Omnibus" ohne Year** in der heutigen Excel — Maintenance-Aufgabe. Pipeline 058+ muss `null`-Year tolerieren.
- **191 vs 192 Collections**: Brief-057-Coverage-Stand sagte 192; echter Sheet-Inhalt 191 Daten-Rows + 1 Header. Off-by-one im Brief, kein Loader-Bug.

## What's next on the pipeline axis

In rough order:

1. ✅ **Brief 055 — V2 Voll-Lauf Decision Gate** — geliefert mit zwei Pre-Lauf-Fixes (`genericityScore` + Web-Search-Prompt-Härtung) und 50-Bücher-Diff (Live-Lauf hat den TaskStop-Halt überlebt, real source claims).
2. ✅ **Brief 056 — V2 Pre-Roster Fixes** — per-page Lexicanum-Cache (24h TTL + negative caching, ~5000× Speedup auf Cache-Hits), per-book Diff-Checkpointing in `run-batch.ts` (mid-run-Halt verliert State nicht mehr), Cost-Recompute auf Cache-Hits ($0.0352/Buch live verifiziert vs. pre-056 $0/Buch), 9-Datei-Diff-Archivierung nach `ingest/.archive/{v1,v2-pilot,v2-batch}/`.
3. ✅ **Brief 057 — Excel-SSOT-Import** — Schema-Migration `0008_ssot_schema.sql`, Truncate-Skript, Loader, deterministic `book-roster.json` (859 Bücher + 191 Collections). ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).
4. ✅ **Brief 058 — V2-Pipeline-Refactor + erster 10er-Batch.** SSOT-Mode liest aus `book-roster.json`; erster Batch `ssot-w40k-001` wurde erzeugt.
5. ✅ **Brief 060/061 — Authority-Layer first 50.** `ssot-w40k-001..005` wurden in Postgres applied; Brief 061 pausierte planmäßig bei der 50er-Resolver-Schwelle.
6. **Phase-3e Modell-Entscheidung** ([open-question 1](./open-questions.md)). Post-055/056-V2-Batch zeigt Haiku-Cost weiter nach unten ($0.0199/Buch fresh-Smoke → $0.0352/Buch im warm-cache 2-Buch-Smoke). Hochrechnung 750-Bücher-V2-Voll-Lauf ≈ $15–26. Sonnet-Vergleich heute überflüssig — Cost-Argument für Haiku ist erdrückend.
7. **Vokabular-Erweiterung** ([open-question 2](./open-questions.md)). `duty` (clear promotion candidate), `legion` faceten-dimension (design call), `chaos`-pov_side prompt-härtung.
8. **Hand-Check + Override-Schema** ([open-question 3](./open-questions.md)). V2's `FieldRecord.override`-Slot ist die natürliche Heimat.
9. ✅ **Resolver-Brief** (OQ4 + OQ5) — implemented/applied for the first 50 W40K books in 063–069.
10. **Resume Brief 061 with `ssot-w40k-006`.** Continue the 10er override/apply loop after the remaining Brain/session hygiene from the resolver branch lands on `main`.
11. **Cross-Batch-Collection-Resolution.** `applyCollections` is still intra-batch; cross-batch omnibus references need a mini-brief.
12. **3e Voll-Apply** (alle 859 Bücher in DB) once the 10er-loop has enough confidence, with resolver maintenance every 50-book threshold.
13. **Refresh-Layer für volatile Felder.** Rating + Availability + Cover-URL — separater `rating_snapshots`/`availability_snapshots`-Pfad mit eigener Cadence (weekly/monthly), nicht im Bulk-Crawl.
14. **3f Maintenance-Crawler.** GH-Action monthly Wikipedia/TLBranson-Diff für new releases — *post-SSOT* nur noch als Vorschlags-Quelle, die Maintainer in die Excel einarbeitet (nicht direkt schreibend).

## Sub-phase backlog (concrete to-dos)

Lifted from the original open-questions item 9 during 051 (Brain Slim Pass). Each item is something to fold into the brief that opens the matching sub-phase.

**3d (Apply-Step) backlog:**

- ✅ Author-FK-Resolution für `work_persons`-Junction inkl. Auto-Create-on-New-Person (062). `editorialNote === "various"` erzeugt keine Pseudo-Person `Various Authors`.
- FK-Resolution für `work_facets`-Junction aus den 3c LLM-`facetIds` (jetzt unter V2 als `BookV2Record.fields.facetIds`).
- ✅ **Junction-Resolver für `work_factions` / `work_locations` / `work_characters`** — closed for first 50 W40K books in 063–069. Surface-Form → Canonical-ID via sidecar JSONs; `raw_name` audit is in DB.
- ✅ ALTER TYPE / SSOT schema applies through `0009` are applied in prod per 069.
- **`work_collections`-Junction-Population** aus dem 058+ V2-Diff: Pipeline-Konsumtion der `book-roster.json.collections[]`-Refs in eine echte Junction-Insert-Reihe. Mapping `external_book_id → works.id` via `external_book_id`-UNIQUE-Lookup; `displayOrder`/`confidence`/`basis` direkt aus dem Roster.
- UNIQUE INDEX `external_links (work_id, kind, service_id)`.
- `junctionsLocked: true`-Flag auf `works` (Schreibschutz für 3d-applied Junctions gegen 3f-Maintenance-Reihenwiederholungen).
- `loadTimeline`-Trim (`SELECT primaryEraId, COUNT(*) GROUP BY primaryEraId` statt full-row-fetch).
- `llm_flags`-Triage-Workflow (auto-applied / Cowork-Review / ignored, plus UI- bzw. CSV-/Markdown-Export-Pfad). Unter V2 ersetzt `Validation[]` + `BookV2Record.fields.<f>.override` große Teile davon.
- `rawLlmPayload`-FK-Resolution: `facetIds` → `facet_values.id`, `discoveredLinks` → `services.id` mit serviceHint-Resolution.

**3e (Batched Backfill) backlog:**

- Hardcover-Title-Variation: Server blockt `_ilike`/`_iregex`; nur exakte Title-Strings matchen — bei subtilen Unterschieden landet "no hits". Mitigation-Optionen: pre-fetch Title-Variationen-Liste oder undokumentierte RPC-Funktion entdecken.
- **TLBranson-Maintenance-Sicherung** (post-054): `npm run ingest:backfill -- --pipeline=v2 --pilot=...` Loud-Errors-Row wenn `parseTlbransonPage` 0 Entries liefert (WP-Theme-/Cache-Update bricht Selektoren). CC-Empfehlung in 054-impl: 0-Bücher-Trigger reicht statt Multi-Selector-Fallback.
- **V2-Single-Slug-Form** (post-054): `--pipeline=v2 --slug X` für ad-hoc A/B-Vergleiche während 055-Prep. Zwei Zeilen in `run-pilot.ts`, nicht blocking.
- ✅ **TLBranson nav-link filter** (post-055) — `NAV_TITLE_RE` in `src/lib/ingestion/tlbranson/parse.ts` rejects "X Ways to Read", "Y Books in Order", "Reading Order", "Guide to" titles (cross-link articles, not books). Eliminates ~40% non-W40k pollution from the slug-window.
- ✅ **Wikipedia bare-numeric-prefix support** (post-055) — `BOOK_INDEX_RE` in `src/lib/ingestion/wikipedia/parse.ts` accepts `001: Title` / `001 - Title` (the master list adopted this in late 2025) in addition to the legacy `Book NNN - Title`.
- **Per-page Lexicanum cache** (055.5er-Backlog, post-055) — bigger of the two follow-up items. Mirroring `ingest/.cache/tlbranson/`, store fetched URL→HTML for 24h. Most impactful change for batch-runtime: collapses the 11-pattern × 5s-throttle URL probe overhead on `lexicanum_missing` repeats. Prerequisite for any 100+ book Voll-Lauf in a single session.
- **Per-book diff checkpointing in `run-batch.ts`** (055.5er-Backlog, post-055) — partial-diff write under `ingest/.state/v2-batch-<name>.partial.diff.json` after each book, mirroring V1's `state.ts` resumability. So a halted run yields a usable artefact instead of forcing a synthesis-from-cache fallback.

**3f (Maintenance-Crawler) backlog:**

- `curl` muss im GH-Actions-Workflow-Container verfügbar sein (`ubuntu-latest` hat es by-default; explizit dokumentieren in der Action-Yaml).

Distant-axis items (Lexicanum `apiSearchFallback`, OL Format/Availability heuristic, engine-friction findings from 037) wandered to [`./deferred-questions.md`](./deferred-questions.md) "Distant — Phase-3+-Engine-Erweiterungen aus 035 / 037".

## Ingest-diff retention

**Current strategy: Option A (decided 2026-05-09, brief 052).** Alle `ingest/.last-run/*.diff.json` bleiben committed — Acceptance + Test-Rerun + Smoke + zukünftige 3e-Batches. Begründung: die Pipeline-Daten-Erhebung ist noch nicht ausgereift, Voll-Diffs sind Apply-Input + Audit + Triage-Material, das Repo ist heute bei 808 KB ohne akuten Druck. Komplexität (Manifest, Summary-Writer, Dashboard-Refactor) wäre verfrüht.

### Brain-Regel (universell, unabhängig von der Storage-Wahl)

Wiki-Pages zitieren Diff-Files **ausschließlich** per `sources:`-Frontmatter-Pfad — niemals inline. Aggregate (Cost/Buch, Junction-Coverage, Flag-Histogramm, primarySource-Distribution) gehören als synthetisierte Kennzahlen hier in `pipeline-state.md`. Inline-Quotes aus `payload`, `updated[].diff`, `llm_flags`, `rawLlmPayload`, `rawHardcoverPayload` sind verboten — das sind Roh-Daten, kein Brain-Material. Sobald das Lint-Skript existiert, wird dieser Check Teil davon.

### Re-evaluate-Trigger

Option A bleibt gültig, **bis** mindestens einer der folgenden Trigger feuert. Dann öffnet ein neuer Brief die Strategie-Frage neu:

1. **Repo-Druck.** `ingest/.last-run/` überschreitet 5 MB (heute ~0.8 MB; Hochrechnung 3e-Voll-Lauf ~4–5 MB).
2. **3d-Apply ist gelaufen + stabil.** Sobald produktive DB-Writes existieren, wird ein Teil der Diff-Daten redundant — Tier-D-Routine kann auf Summary reduziert werden.
3. **Vor 3e-Voll-Lauf**, falls die Hochrechnung dann doch die 5-MB-Marke übersteigt.
4. **Wiki-Inline-Quote-Verstoß.** Wenn ein Wiki-Page versehentlich Diff-Inhalt inline lädt — sofortiger Lint-Fix + Strategie-Review.

Bei Trigger ist die wahrscheinliche Nachfolge-Strategie **Option C+F** (Tier-D-Routine in Cold-Archive nach Apply, Summary-getriebene Listenansicht). Die Tier-Klassifikation (Smoke / Test-Rerun / Acceptance / Routine-Batch) ist dafür vorgedacht; siehe Brief 052 + Git-Historie für die ausführliche Analyse.

### Hard rule (aus 051, weiterhin gültig)

**Kein committed Diff unter `ingest/.last-run/` darf gelöscht werden, solange `/ingest` das Verzeichnis direkt enumeriert.** Das Dashboard rendert eine Card pro File; ein Delete entfernt die Card ohne Warnung. Jede Retention-Sweep braucht einen separaten Brief, der den Dashboard-Read-Path geprüft + ggf. auf eine Manifest-Quelle umgestellt hat, und der die `sources:`-Pointer in betroffenen Wiki-Pages mit-anpasst.

### Was Option A nicht erlaubt

- **Tier-A/B Files (z. B. die drei `backfill-20260503-*` Sonnet/Haiku-Vergleichs-Files) bleiben drin.** Sie sind heute Audit-Anker für `decisions/why-haiku-not-sonnet.md`. Reduktion erst, wenn ein dedizierter Cleanup-Brief Dashboard-Pfad und ADR-Sources-Liste mit-anpasst.
- **Keine Code-Änderungen am Diff-Writer / Dashboard / Schema** als Folge dieser Policy. Status quo der Implementierung.

Cache and state directories are unrelated:

- `ingest/.llm-cache/` is gitignored (Anthropic API responses, regenerable, prompt-hash-keyed).
- `ingest/.state/` is gitignored (resumable run state, regenerated each run, wiped on success).
- `ingest/.compare/` and `ingest/.cache/` are gitignored (scratch/comparison-area).

## Out-of-scope (today)

- **Black Library crawler.** Cloudflare-Verdacht; eventual Phase 3.5+ if a TLS-fingerprint-bypass technique emerges.
- **Real-time pipeline UI.** Phase 3.5 Dashboard reads filesystem (committed JSON), no live polling, no DB-persist. Sufficient for solo-Philipp's batched workflow.
- **Multi-language enrichment.** All English. German would be a Phase-7+ ambition.
