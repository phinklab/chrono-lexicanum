---
title: Pipeline state (Phase 3)
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../src/lib/ingestion/
  - ../../sessions/2026-05-08-047-arch-pipeline-hardening.md
  - ../../sessions/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../ingest/.last-run/backfill-20260508-2101.diff.json
related:
  - ./project-state.md
  - ./architecture.md
  - ./glossary.md
  - ./decisions/why-haiku-not-sonnet.md
  - ./decisions/why-multi-source-merge.md
  - ./open-questions.md
confidence: high
---

# Pipeline state (Phase 3, post-047)

> The TypeScript ingestion pipeline as it stands today. Sources, modules, current numbers, levers pulled, what's next. Detail-level page; for the high-level "where are we" use [`./project-state.md`](./project-state.md).

## Architecture

**Multi-Source-Merge with field-by-field source-priority + LLM enrichment two-pass.** Discovery from Wikipedia (master lists, ~700 books); per-book crawl from Lexicanum + Open Library + Hardcover; LLM (Anthropic Haiku 4.5 + Web Search, mandatory ≥2 calls/book) for synopsis paraphrase + soft-facets + format/availability + plausibility cross-check + reader-rating capture. Output: dry-run diff JSON committed under `ingest/.last-run/`. **No DB writes from the pipeline yet** — Apply-Step (3d) is the next sub-phase.

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

`backfill-20260508-2101.diff.json` (9 books, run aborted by Philipp at Buch 9):

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

## What's next on the pipeline axis

In rough order:

1. **Anthologie-Re-Test für Hebel E** ([open-question 10](./open-questions.md#10-anthologie-re-test-für-hebel-e-hardcover-author-hint)). 3-slug sample test: tales-of-heresy, mark-of-calth, sons-of-the-emperor. Mini-brief, no DB write.
2. **Lexicanum-Body-Lore-Pass *or* FIELD_PRIORITY-Reduktion** ([open-question 11](./open-questions.md#11-lexicanum-trägt-keine-junction-daten---body-lore-pass-oder-field_priority-reduktion)). Either Cheerio-walker over `.mw-parser-output` for faction/location/character Wikilinks, or a constant-edit dropping Lexicanum from the field-priority for these three fields.
3. **Phase-3e Modell-Entscheidung** ([open-question 1](./open-questions.md#1-phase-3e-modell-entscheidung---haiku-bleiben-vs-sonnet-upgrade)). Haiku ($88 voll-lauf) vs. Sonnet (~$250–300 voll-lauf). Decided post-047, post-Anthologie-Re-Test.
4. **Vokabular-Erweiterung** ([open-question 2](./open-questions.md#2-vokabular-erweiterung---duty--faction-dimension-legion--chaos-pov_side-pattern)). `duty` (clear promotion candidate), `legion` faceten-dimension (design call), `chaos`-pov_side prompt-härtung.
5. **Hand-Check + Override-Schema** ([open-question 3](./open-questions.md#3-hand-check-workflow-brief-nach-architektur-klärung)). CSV/Markdown override format, Cowork's flag-triage discipline.
6. **3d-Apply-Step.** FK-Resolution (work_persons + work_facets + external_links), `junctionsLocked: true` flag, ALTER TYPE source_kind (Migration 0007 ready), UNIQUE INDEX external_links. The big one.
7. **3e Batched Backfill** (~800 Bücher in 8–16 Sessions à 50–100 books). Currently at Batch 1/N (sessions 044). Each batch produces a diff, gets dashboard-inspected, gets Cowork-flag-triage'd.
8. **3f Maintenance-Crawler.** GH-Action monthly Wikipedia-Diff for new releases. Same engine, much smaller scope.

## Out-of-scope (today)

- **Black Library crawler.** Cloudflare-Verdacht; eventual Phase 3.5+ if a TLS-fingerprint-bypass technique emerges.
- **Real-time pipeline UI.** Phase 3.5 Dashboard reads filesystem (committed JSON), no live polling, no DB-persist. Sufficient for solo-Philipp's batched workflow.
- **Multi-language enrichment.** All English. German would be a Phase-7+ ambition.
