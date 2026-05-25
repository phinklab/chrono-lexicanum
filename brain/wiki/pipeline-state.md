---
title: Pipeline state (Phase 3)
type: overview
created: 2026-05-09
updated: 2026-05-25
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
  - ../../sessions/2026-05-13-071-impl-loop-driver.md
  - ../../sessions/2026-05-15-074-arch-resolver-batch-3.md
  - ../../sessions/2026-05-15-074-impl-resolver-batch-3.md
  - ../../sessions/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md
  - ../../sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
  - ../../sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md
  - ../../sessions/2026-05-16-077-arch-grand-alignment-junction-hygiene.md
  - ../../sessions/2026-05-16-077-impl-grand-alignment-junction-hygiene.md
  - ../../sessions/2026-05-20-087-impl-goodreads-rating-pipeline.md
  - ../../sessions/2026-05-21-088-impl-ssot-loop-lean.md
  - ../../sessions/2026-05-21-089-arch-resolver-pass-5.md
  - ../../sessions/2026-05-21-089-impl-resolver-pass-5.md
  - ../../sessions/2026-05-21-090-arch-resolver-pass-lean.md
  - ../../sessions/2026-05-21-090-impl-resolver-pass-lean.md
  - ../../sessions/resolver-pass-runbook.md
  - ../../sessions/ssot-loop-runbook.md
  - ../../scripts/loop-next-batch.ts
  - ../../scripts/apply-override-rating.ts
  - ../../scripts/run-ssot-loop.sh
  - ../../scripts/run-resolver-pass.sh
  - ../../scripts/resolver-pass.config.json
  - ../../scripts/apply-override-skip.ts
  - ../../src/lib/seed/alignment.ts
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
  - ../../sessions/2026-05-22-093-arch-resolver-pass-7.md
  - ../../sessions/resolver-dossiers/resolver-pass-7-impl-report.md
  - ../../sessions/2026-05-23-094-arch-resolver-loop.md
  - ../../sessions/2026-05-23-094-impl-resolver-loop.md
  - ../../sessions/resolver-loop-log.md
  - ../../scripts/resolver-loop-detect.ts
  - ../../scripts/run-resolver-loop.sh
related:
  - ./project-state.md
  - ./architecture.md
  - ./glossary.md
  - ./decisions/why-cc-direct-curation.md
  - ./decisions/why-sonnet-not-haiku.md
  - ./decisions/why-haiku-not-sonnet.md
  - ./decisions/why-multi-source-merge.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./open-questions.md
confidence: high
---

# Pipeline state (Phase 3, post-098)

> The TypeScript ingestion pipeline as it stands today. Sources, modules, current numbers, levers pulled, what's next. Detail-level page; for the high-level "where are we" use [`./project-state.md`](./project-state.md).
>
> **V2-LLM-Stage de-facto ausgemustert seit Brief 061 (formal ADR 2026-05-15).** Der V1-Code-Pfad bleibt für Reproduzierbarkeit alter Diffs; die V2-Pipeline-Stages 0–2 + 4 leben weiter (Excel-SSOT als Stage 0 ab 057/058, `apply-override.ts` + Resolver-Schicht für Stage 4). Stage 3 (V2-LLM unter `src/lib/ingestion/v2/llm/`) wird **nicht** mehr aufgerufen — eine `claude -p`-Subsession produziert pro 10er-Batch direkt eine `manual-overrides-ssot-w40k-NNN.json`. Begründung und Trade-Off: [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md). Resolver-Pässe 1 (063–069) + 2 (072) + 3 (074-impl) + 4 (076-impl) + 5 (089-impl) + 6 (Pass-6-impl) + 7 (Pass-7-impl) haben die Surface-Form-Crystallization für die ersten 450 W40K-Bücher geschlossen (Pässe 4–7 **axis-sliced**, Pässe 6–7 als 100er-Wellen); Brief 077 hat den Grand-Alignment-Junction-Skip im Apply-Layer scharfgeschaltet (`imperium`/`chaos` werden nicht als reguläre Junctions geschrieben, wenn alignment-gleiche Sub-Faction im selben Override-Block resolved ist), Brief 084 den analogen Umbrella-Skip auf der Locations-Achse, Brief 087 die Goodreads-Rating-Beschaffung als vierte Loop-Disziplin. Aktuelle Junction-Counts post-Pass-7-Re-Apply 001..045: `work_factions=1659`, `work_locations=638`, `work_characters=1074`, `work_collections=142`, `work_persons=424` über 450 W40K-Bücher. Brief 090 hat die Resolver-Pass-Maschinerie schlank gemacht (brief-frei + runbook-getrieben, Phase-4 digest-only, stabile wave-parametrisierte Tools); Brief 091 hat Phase 4 in 4a/4b gesplittet + den forward-ref-Guard range-aware gehärtet; Resolver-Pass 7 (`ssot-w40k-036..045`, PR #90) war der erste echte Lauf auf der 6-Phasen-4a/4b-Maschinerie; Pässe 8 + 9 (`ssot-w40k-046..057`, PR #95/#96) haben die letzten zwei Wellen appliziert — **W40K ist datenkomplett: 565/565 W40K-Bücher in der DB** (Junction-Counts post-Pass-9: `work_factions=1903`, `work_locations=733`, `work_characters=1220`, `work_collections=147`, `work_persons=524`; Reference `factions=173`, `locations=225`, `characters=345`). Pässe 8 + 9 liefen supervised über `run-resolver-pass.sh`. [Brief 098](../../sessions/2026-05-25-098-arch-w40k-consolidation-pass.md), der W40K-Konsolidierungs-Pass, ist **gemergt** — ein eigener, runbook-getriebener Pass-Typ (Geschwister des Resolver-Passes), der die über die Wellen gewachsene Reference-Schicht global auf Cross-Wave-Dubletten prüft und merged; der Erstlauf über das W40K-Set fand 15 Kandidaten → 2 Merges, Reference-Schicht damit `factions=173` / `locations=224` / `characters=344` (Junction-Counts invariant). Maschinerie-Detail (`consolidation-*`-Skripte, `consolidation-pass-runbook.md`, dedizierte Config) in [`./project-state.md`](./project-state.md) § What's running. Der nächste Architekten-Brief ist Brief 099 (Sessions-Archiv-Sweep, reine Repo-Hygiene); danach kippt der SSOT-Loop in die HH-Domäne. **Brief 094 hat danach den Resolver vom SSOT-Loop entkoppelt und beide Loops headless gemacht** — der SSOT-Loop läuft cadence-frei bis 859, der Resolver-Loop verarbeitet kristallisierte Batches in ≤60-Buch-Wellen brief-frei (siehe § Resolver-Loop-Konvention + § What's next).

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

## V2-Pipeline (Pilot, post-054) — Stage-3-LLM heute ausgemustert

> **Status 2026-05-15 (ADR [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md)).** Die strukturelle V2-Architektur (Stages 0–4, deterministische Validatoren, `BookV2Record`-Provenance pro Feld) wird in diesem Abschnitt beschrieben, weil sie der gebaute Code im Repo ist. **Operativ läuft heute nur Stage 0 (Excel-SSOT-Roster, siehe „Excel-SSOT layer" unten), Stage 2 (Validatoren — nicht angewendet weil Stage 1 nicht läuft), Stage 4 (`apply-override.ts` + Resolver-Schicht).** Stage 1 (Source-Claims-Crawl) und Stage 3 (Slim-LLM) sind seit Brief 061 nicht mehr Default-Pfad — eine `claude -p`-Subsession ersetzt Stage 3 und überspringt Stage 1. Der V2-LLM-Code (`src/lib/ingestion/v2/llm/{enrich,prompt,parse}.ts`) bleibt im Repo als Reaktivierungs-Sicherung und historisches Artefakt.

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

- **Source**: `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt, committed bei Bedarf). Zwei Sheets: `Books` (859 rows, 16 columns: `Book ID, Original #, Source, Title, Author, Release Date, Release Year, Type, Section / Series, Contained In Collection, Contained In Book IDs, Contained In Titles, Collects Book IDs, Collects Titles, Source URL, Relation Notes`) und `Collection Links` (196 data rows + 1 header, 10 columns mit Confidence + Basis).
- **Loader**: `scripts/import-ssot-roster.ts` — `read-excel-file` 9.0.9 mit `{ trim: false }`-Workaround (Library-Bug auf bestimmten leeren String-Cells); pure parsers (`parseBookRow`, `validateCollectionLinkRow`, `splitAuthors`, `normalizeFormat`, `resolveSlugs`) plus I/O-Entry. Loud-Validation mit Excel-Zeilennummer.
- **Output**: `scripts/seed-data/book-roster.json` — `{ schemaVersion: "1.0", sourceFile, books[859], collections[196] }`. RosterBook-Form: `{ externalBookId, slug, title, authors, editors, editorialNote, releaseYear, format, seriesHint, sourceUrl, notes, sourceRow }`. Collection-Form: `{ contentExternalId, collectionExternalId, displayOrder, confidence, basis }`. Sortierung: lexicographic by `externalBookId` (HH-NNNN vor W40K-NNNN); Collections nach `(contentExternalId, collectionExternalId)`. Re-Run-Determinismus via SHA256-Hash verifiziert.
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

### Collection-gap policy (post-074)

Unvollständige Sammelwerke bleiben **als normale Bücher** im Authority-Layer: `works`, `book_details`, Facets und Resolver-Junctions werden applied. Was nicht geschrieben wird, sind partielle `work_collections`-Kanten, wenn die Bestandteile nicht vollständig als Roster-Works modelliert sind. Stattdessen führt `scripts/seed-data/collection-gaps.json` ein maschinenlesbares Ledger mit `status`, bekannten schon vorhandenen Constituents und bekannten fehlenden Constituents. Spätere Collection-Gap-Resolve-Pässe laufen über dieses Ledger, ergänzen fehlende Works/Roster-Rows und schreiben erst dann vollständige `roster.collections`.

Leitregel: **Kein Sammelwerk wegen fehlender Constituents aus dem Buchkatalog entfernen; aber auch keine halbe Collection als vollständig wirkende `work_collections`-Struktur darstellen.** Green Tide (`W40K-0147`) ist der erste Ledger-Fall aus Brief 074.

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

### Resolver layer (post-063 through Pass 7 / Brief 094)

The first 450 W40K authority books (`ssot-w40k-001..045`) now have a concrete resolver/apply layer, geschlossen über sieben Resolver-Wellen (063–069 für 001..005, 072 für 006..010, 074-impl für 011..015, 076-impl für 016..020, 089-impl für 021..025, Pass-6-impl für 026..035, Pass-7-impl für 036..045 — Pässe 4–7 **axis-sliced**, Pässe 6–7 als 100er-Wellen), plus Brief 077 (Grand-Alignment-Junction-Skip, Faction-Achse) und Brief 084 (Umbrella-Skip, Locations-Achse) als Pipeline-Compliance-Hygiene. **Brief 094 hat den Resolver danach vom SSOT-Loop entkoppelt + headless automatisiert** (siehe § Resolver-Loop-Konvention) — Pässe 1–7 liefen alle supervised auf der alten per-pass-Schiene; künftige Wellen laufen headless über `run-resolver-loop.sh`:

- `src/lib/resolver/index.ts` resolves Factions, Locations, Characters via direct name + alias JSONs; `src/lib/resolver/roles.ts` normalizes roles before DB writes. **Bleibt Pure-Surface-Form-zu-ID** — Block-Context-Skip-Logik (077) lebt im Apply-Layer, nicht im Resolver.
- `scripts/seed-data/faction-aliases.json`, `location-aliases.json`, `character-aliases.json`, `characters.json`, plus extended `factions.json`, `locations.json`, `sectors.json` are the checked-in resolver sidecars. Counts post-Pass-7: `factions=166`, `locations=201`, `characters=297` reference rows; Faction-Aliases 48, Location-Aliases 15, Character-Aliases 39.
- `scripts/seed-data/collection-gaps.json` (neu in 074-impl) ist ein maschinenlesbares Ledger für Sammelwerke, deren Constituents noch nicht vollständig als Roster-Works modelliert sind. Bleibt nach 076 bei einem Eintrag (Green Tide `W40K-0147`); alle 7 Omnibi der vierten Welle (Last-Chancers / Gothic-War / Soul-Drinkers × 2 / Space-Wolf × 2 / Inquisition-War) haben volle Roster-Constituent-Coverage.
- `src/db/migrations/0009_lucky_pete_wisdom.sql` made `locations.gx/gy` nullable and added `raw_name` audit columns to all three work junctions. `seed-resolver-extensions.ts` (post-070) lifted faction-Insert auf Upsert; (post-074) macht das Gleiche für Location-Tags (idempotenter Merge aus JSON für `era_frame` etc.). Post-077: Alignment-Inferenz (`inferAlignmentFromTree` + `normalizeAlignment`) wandert in shared `src/lib/seed/alignment.ts`, beide Pfade (seed-resolver-extensions + apply-override) importieren von dort.
- `scripts/apply-override.ts` writes `work_factions`, `work_locations`, `work_characters`, `work_collections` (Cross-Batch via `external_book_id` post-072). Post-077-Erweiterung: `loadSkipContext()` lädt `faction-policy.json` + `factions.json` und baut `{redundantIds, alignmentById}` mit Startup-Validation (wirft, wenn `redundantWhenSubPresent`-Eintrag entweder nicht in `factions.json` existiert oder `alignment === "neutral"` ist — Guard gegen stille Policy-Drift); `applyBook` reordered so Faction-Resolution + `decideFactionSkips()` (pure helper aus neuem `scripts/apply-override-skip.ts`, DI-Signatur) VOR `buildSurfaceFormsBlock` laufen, der den neuen `factionsSkippedRedundant`-Bare-String-Array-Bucket im `book_details.notes`-`---surfaceForms---`-Block emittiert. `scripts/apply-override-dry.ts` simuliert den Skip ebenfalls (Dry-Run-Totals matchen DB-Realität); neue Report-Zeile „skipped surface forms: N across M books, by name: …". 076-impl re-applied `ssot-w40k-001..020` mit lückenloser Pre-/Per-Batch-/Post-Counts-Tabelle und verifiziert `work_factions=1185`, `work_locations=417`, `work_characters=633`, `work_collections=56`; 077 backfill-Re-Apply 001..020 reduzierte `work_factions` auf 1020 (−165 Grand-Alignment-Skips: `imperium 81 → 6`, `chaos 133 → 43`). Coverage post-077: `factions=1020/1301 = 78.4 %` (mit Skip; pre-Skip-Form-Treue `91.1 %`), `locations=417/493 = 84.6 %`, `characters=633/811 = 78.1 %`. **Post-089 (Resolver-Pass 5, Re-Apply 001..025 über 250 Bücher):** `work_factions=1153`, `work_locations=455`, `work_characters=701`, `work_collections=79`, `work_persons=232`; Apply `001..020` = 0 inserts / 10 updates (Drift-Cleanup), `021..025` = 10 inserts / 0 updates. Coverage (dry-run, post-skip) `factions=1153/1439`, `locations=455/555`, `characters=701/903`. **Post-Pass-6 (Re-Apply 001..035, 350 Bücher):** `work_factions=1424`, `work_locations=543`, `work_characters=844`, `work_collections=109`, `work_persons=325`, `work_facets=7227`; Reference-Rows `factions=162`, `locations=189`, `characters=237`; die Dry-Run-Prediction traf die DB-POST-APPLY-Counts exakt. **Post-Pass-7 (Re-Apply 001..045, 450 Bücher):** `work_factions=1659`, `work_locations=638`, `work_characters=1074`, `work_collections=142`, `work_persons=424`, `work_facets=9087`; Reference-Rows `factions=166`, `locations=201`, `characters=297`; Dry-Run-Prediction == DB-POST-APPLY exakt. Pass 7 hob die `EXPECTED_RANGES` in `apply-override-dry.ts` an (factions 1500→1900, locations 600→800, characters 1200→1400) — Headroom-Sizing, kein Guard-Relax.
- Safety tests: `test:resolver` (236 cases post-Pass-7, war 173 post-089 / 122 post-077 / 78 post-074), `test:resolver-data` (Integrity-Checks: FKs, keine Dup-IDs/Namen, Alias-Targets), `test:resolver-coverage` (Range jetzt 001..045), `test:apply-override-dry` (450 Bücher, `missing facet ids: 0`, synopsis-lint „by label: none", 15 in-range forward collection refs), `test:collection-refs` (7 Cases, Brief-091-Guard-Helper), `test:resolver-loop-detect` (22 Cases, Brief-094-Wellen-Detektor). Runbook: `docs/resolver-apply-runbook.md`.

Watson-Trilogy-Konvention aus 074-impl: 1990–1995-Bücher (Ian Watson) tragen `historical_canon_layer`-Marker im `factions.tone`-Feld (`squats`, `hydra_cabal`), im `locations.tags`-Feld (`stalinvast`, `sabulorb`) und im `characters.notes`-Feld (Retinue Jaq Draco / Meh'Lindi / Vitali Googol / Grimm). Surface-Form-treue gegen die pre-modern Codex-Lore; kein Kollabieren auf moderne Codex-Begriffe.

Pass-4-Konvention aus 076-impl (axis-sliced): Phasen-Workflow `Preflight/Dossier → Factions only → Locations only → Characters only → Integration` mit per-Phase-Statusdateien unter `sessions/resolver-dossiers/`; Aggregator-Helper `scripts/aggregate-surface-forms-NNN.ts` als deterministischer Re-Run-Anker; Cross-Batch-Alias-Consolidation-Cases (Mad Donna/D'onne Ulanti single, Kal Jerico single, Lord Helmawr split, Kage/the Burned Man single, Soul Drinkers mit `primaris_reboot_coexistent`) pro Pass in der Phase-3-Statusdatei dokumentiert. Mid-Knoten-Erweiterungen pro Welle (post-076: `necromunda` als Sub-Knoten parallel zu `astra_militarum`). Driver-Deliverable für Pass 5+: `scripts/run-resolver-pass.sh` + `scripts/resolver-pass.config.json` (Single-File-Bash, config-driven, Halt-Check-Matrix mit Set-Subset-Glob-Match + JSON-valid + `## Needs decision`-Detection).

Pass-Hygiene-Konvention aus 077-impl: Skip-Liste (`redundantWhenSubPresent` in `faction-policy.json`) ist Policy-driven; Drei-Bedingungen-Skip (ID in Skip-Liste + alignment-gleicher Sub im selben Block + Sub ist nicht selbst die Grand-Alignment-Row) im Apply-Layer; geskippte Surface-Forms in `factionsSkippedRedundant`-Bucket erhalten als Audit-Trail. Skip-Bedingung gilt heute nur für `imperium`/`chaos` über Alignment-Equality — wenn künftig `eldar` (oder andere xenos-Splits) auf die Liste käme, muss `decideFactionSkips` von Alignment-Equality auf Parent-Chain-Membership umgestellt werden (`tau` ist `xenos` wie `eldar`, aber kein Sub davon). Revisit-Trigger in [`./decisions/faction-policy.md`](./decisions/faction-policy.md) § Revisit-Trigger dokumentiert.

Pass-5-Konvention aus 089-impl: Brief 089 fuhr den Fünf-Phasen-Vertrag (Preflight/Dossier → Factions → Locations → Characters → Integration) wie Pass 4, aber **manuell/supervised statt über `run-resolver-pass.sh`** (Maintainer-Wahl stop-before-push; die `resolver-pass.config.json` ist für Pass 5 befüllt + committed und bleibt Driver-Vorlage). Drei Wave-Calls: Call 1 (Astra-Militarum-Regimenter — der deterministische Aggregat-Befund schlägt die Brief-Schätzung, nur Mordian Iron Guard erreicht freq≥2; +8 Faction-Rows inkl. `blood_ravens` + `deathwatch`), Call 2 (`commissar` als erster `protagonist_class`-Vokabular-Wert + Retag W40K-0237/0247 — **Landmine**: `apply-override.validateFacetIds` prüft die DB-`facet_values`-Tabelle, nicht den Catalog-JSON; `db:seed` ist destruktiv und `db:seed-resolver-extensions` überspringt Facets, daher neuer `scripts/seed-facets-089.ts` als idempotenter Catalog-Upsert vor dem Apply — der Phase-4-Trigger der `resolver-pass.config.json` trägt diesen Schritt jetzt für künftige Pässe), Call 3 (Author-Backfill via Excel-SSOT). Counts-Tabelle pro Batch lückenlos im 089-impl-Report.

Rating-Schicht (Brief 087): Goodreads-Rating ist eine vierte Loop-Disziplin im Apply-Pfad. `overrides.rating` (optionales nested object) → Pure-Helper `scripts/apply-override-rating.ts` normalisiert rated/unrated/absent → `apply-override.ts` schreibt `book_details.rating`/`rating_count`/`rating_source` nur bei vorhandenem Feld; `status:"unrated"` schreibt `rating=NULL` + `rating_source='goodreads'`; fehlendes Feld lässt die DB unangetastet. `apply-override-dry.ts` simuliert + trägt `--file=<path>` für Single-Fixture-Dry-Runs. Forward-only ab `ssot-w40k-021`; `001..020` sind durch den Brief-086-Pivot bereits rating-gedeckt. Hard rule: Rating per Page-Read der Goodreads-Buchseite, nie aus dem Snippet.

Loop-Lean-Konvention aus 088-impl: Eine Loop-Iteration liest jetzt genau drei Dateien — `sessions/ssot-loop-runbook.md` + `npm run loop:next` (`scripts/loop-next-batch.ts`, Read-only-Detection-Helper: nächster Batch/Slice/Resolver-Pause-Status als JSON) + `facet-catalog.json` (~6k statt ~55k+ Tokens). `--skip-initial-resolver-pause` ist entfernt; die Resolver-Pause ist selbst-erkennend (`loop-next-batch.ts` liest den `⏸`-Block aus dem Loop-Log). Brief 061 ist auf Design-Rationale reduziert, die operative Iter-Spec lebt im Runbook.

Pass-lean-Konvention aus 090-impl: Brief 090 hat den Resolver-Pass nach demselben Muster wie den SSOT-Loop schlank gemacht. (a) Eine Phase liest jetzt nur [`../../sessions/resolver-pass-runbook.md`](../../sessions/resolver-pass-runbook.md) + die Pass-Config (`scripts/resolver-pass.config.json`) + ihr Achs-Paket + (ab Phase 1) das Phase-0-Dossier — **nicht** Brief 076, **nicht** den per-pass Brief (Mess-Befund: die universelle Vorab-Dokumentenlast war ≈ 22k tok/Phase). (b) Der Pass ist **brief-frei**: `runbook` ist das required Config-Feld, `brief` optional/rationale-only; `run-resolver-pass.sh` injiziert den Runbook-Pointer. (c) **Phase 4 korpus-entkoppelt**: `run-phase4-apply.sh` schreibt einen fix-großen Digest (`ingest/.last-run/phase4-digest.md` ≈ 1k tok), die rohe Per-Batch-Apply-Ausgabe geht in ein gitignored `*-verbose.log`; `verify-pass.ts` emittiert den Verify-Digest. Live gegen die 250-Bücher-DB validiert (idempotenter Re-Apply, byte-stabile Counts). (d) Stabile, wave-parametrisierte Tools (`aggregate-surface-forms.ts`, `db-counts.ts`, `seed-facets.ts`, `run-phase4-apply.sh`, `verify-pass.ts` + geteilter `resolver-pass-config.ts`-Loader) — ein Pass erzeugt keine neuen `-NNN`-Klone mehr, die `-089`-Klone sind gelöscht (074/076/077/084-Klone als historische Records belassen). (e) Resolver-Cadence 50→100 (`loop-next-batch.ts`: Pause bei kumulativ ≡ 50 mod 100 → 250/350/450/550, neues `Decision`-Feld `nextResolverPauseAt`). `CLAUDE.md` + `AGENTS.md` tragen die Resolver-Pass-Phase-Ausnahme von der Session-Start-Leseroutine; Brief 076 trägt einen Rationale-only-Banner. Bekannte Wachstums-Kante (Brief-090-Open-Question): `characters.json` wächst je Welle — Phase 3 wird Richtung ~mid-Korpus die erste Phase, die einen Achs-Slice für die Reference-JSON braucht; bei `001..035` noch unkritisch (Pass-6-Phase-3-Report bestätigt: `characters.json` 237 Rows / 1433 Zeilen, weiterhin ganz lesbar).

Pass-6-Konvention (Pass-6-impl): Resolver-Pass 6 (`ssot-w40k-026..035`) war der erste Lauf unter dem lean-Kontrakt — die fünf Phasen-Subsessions liefen sauber, aber Phase 4 ging mit dem Kontextfenster Richtung ~300k Token (gegen das ~120k-Per-Phase-Budget): der statische Lese-Scope blieb schlank wie von Brief 090 entworfen, die *agentische* Arbeitslast (seed-resolver-extensions erweitern + Trias-Range-Widen + Apply + Verify + Report-Schreiben + ungeplantes Guard-Debugging in einem `/clear`) nicht. **Brief 091** splittet Phase 4 darum in 4a (Integration/Apply) + 4b (Verify/Report) mit Handoff über eine 4a-Statusdatei und härtet den forward-ref-Collection-Guard in `apply-override-dry.ts` von report-only auf range-aware. Pass 6 brachte zudem die erste Welle mit forward-referencing collection edges (Anthologie-Batch vor Novellen-Batches; `applyCollections` löst das im aufsteigenden Sweep) — der harte `forwardRefs === []`-Assert wurde dafür entschärft.

Resolver-Loop-Konvention (Pass-7-impl + 094-impl): Resolver-Pass 7 (`ssot-w40k-036..045`, PR #90) war der erste echte Lauf auf der Brief-091-6-Phasen-4a/4b-Maschinerie — sechs `/clear`-getrennte Phasen-Subsessions, Phase 4b las nur die 4a-Statusdatei + den committeten Apply-Digest (kein zweiter DB-Apply, keine Trias-Re-Run). Sauberer Lauf: Dry-Run-Prediction == DB-POST-APPLY exakt, ein einziger wave-spezifischer Call (`EXPECTED_RANGES`-Headroom-Bump), der range-aware forward-ref-Guard blieb über den ganzen kumulativen Sweep grün (15 in-range refs).

**Brief 094** hat danach den Resolver-Pass-Mechanismus grundlegend umgebaut — vier Bausteine:

- **(a) Entkopplung.** Die Resolver-Pause-Cadence ist aus `run-ssot-loop.sh` + `loop-next-batch.ts` entfernt (`Decision` ohne `resolverPause`/`nextResolverPauseAt`); der SSOT-Loop läuft cadence-frei bis zum vollen Roster (859) durch. Der committete `⏸`-Block bei 450 im Loop-Log ist nur noch advisory.
- **(b) Wellen-Detektor.** `scripts/resolver-loop-detect.ts` (pure-core) partitioniert offene, kristallisierte-aber-nicht-resolvte Batches greedy in ≤60-Buch-Wellen (`partitionWaves`, Hard-Cap 60 + Target-Boundary) und generiert die `resolver-pass.config.json` pro Welle mechanisch (`buildWaveConfig` — generische Phase-Trigger, keine handgeschriebene Lore, kein `brief`); `parseResolverLoopLog` liest den Fortschritt aus `sessions/resolver-loop-log.md`. Drei Terminal-Zustände: `open-wave` / `idle` (SSOT-Loop muss weiter) / `w40k-complete`. CLI `npm run resolver:next-wave`.
- **(c) Brief-freies Runbook.** Das `brief`-Config-Feld ist entfernt, `sessions/resolver-pass-runbook.md` ist die alleinige ausführbare Spec; `run-resolver-pass.sh` parst keinen `BRIEF_PATH` mehr. `sessions/resolver-loop-log.md` (neu) ist der append-only Fortschritts-Marker — ein H2-Block pro Welle, sechs Phasen-Checkboxen mit Commit-SHAs; Bootstrap-Block: Pässe 1..7 / `001..045` supervised durch.
- **(d) Headless Loop-Driver.** `scripts/run-resolver-loop.sh` (Geschwister von `run-ssot-loop.sh`) chainet Wellen automatisch: Pre-Checks → Detektor → Config-Commit → Pass-Driver (`run-resolver-pass.sh --no-finalize --start-phase … --phase-timeout 1800`) → State-File (`scripts/.last-resolver-pass-state.json`) lesen → Loop-Log-Block via `resolver-loop-log-update.ts` updaten → weiter → Finalisierung (push + PR einmal). Flags `--dry-run` + `--max-waves`; Exit-Codes spiegeln den Pass-Driver. `run-resolver-pass.sh` trägt dafür `--no-finalize` / `--start-phase` / `--phase-timeout` + Exit-Code 6 (Timeout).

Der Detektor ist W40K-only; am W40K-complete-Meilenstein wechselt der Status auf `w40k-complete` und der Loop verlässt — HH-Override-Files werden ignoriert (HH braucht später eine Domain-Achsen-Erweiterung). Erster scharfer headless Lauf = die 115 W40K-Reste (`046..057`) in zwei Wellen (`046..051` = 60 + `052..057` = 55). Bekannte, nicht-load-bearing Refinement-Punkte (094-impl § For next session): Resume-Mitigation bei Wrapper-Crash zwischen Phase- und Log-Commit, fehlende Unit-Tests für `resolver-loop-log-update.ts`.

Brief-074-impl Hand-off-Material zur Vokabular-Hygiene-Session (out-of-scope für 074, dokumentiert): 9 Loop-Log-Tag-Kandidaten (`commissar` / `inquisitor` / `squat` / `corsair` / `triarch_praetorian` / `valkyrie_pilot` / `webway_journey` / `omnibus_with_prior_constituents` / `cabal_inquisition` / `rogue_inquisition` / `cw_canon_divergence`), 5 facet-catalog-LLM-Typos aus 015-Override (`interplanetary` scope, `freedom`/`discovery`/`duty` theme, `early_release` entry_point — alle gestrippt, da Brief-074 vocabulary-Promotion verbietet), 5 freq=1-Sororitas-Sub-Orders aus *Triumph of Saint Katherine*, 5 `data_conflict`-Author-Missing-Flags (W40K-0141/0142/0143/0146/0147 → Maintainer-Excel-Workflow). 076-impl ergänzt: 9 unbekannte facetIds aus 018-Override gestrippt (`coming_of_age`/`loss`/`vengeance`/`hopeful`-Quartett × Necromunda-Cluster; vocabulary-Promotion bleibt out-of-scope eines Resolver-Passes).

### Bekannte Schwächen / Out-of-scope

- **`read-excel-file` 9.0.9 Library-Bug** (`parseString` crasht ohne `{ trim: false }` auf bestimmten leeren String-Cells). Workaround in einem Argument; upstream-Issue noch nicht aufgemacht. Low priority.
- **`read-excel-file` 6 moderate-severity Audit-Vulnerabilities** (transitive Deps: `fflate`, `unzipper` u. a.). `npm audit fix --force` würde Major-Version verschieben — beobachten, nicht fixen.
- **W40K-0307 "War for Armageddon Omnibus" ohne Year** in der heutigen Excel — Maintenance-Aufgabe. Pipeline 058+ muss `null`-Year tolerieren.
- **191 vs 192 Collections**: Brief-057-Coverage-Stand sagte 192; echter Sheet-Inhalt 191 Daten-Rows + 1 Header. Off-by-one im Brief, kein Loader-Bug.

## What's next on the pipeline axis

In rough order:

1. ✅ **Brief 055 — V2 Voll-Lauf Decision Gate** — geliefert mit zwei Pre-Lauf-Fixes und 50-Bücher-Diff.
2. ✅ **Brief 056 — V2 Pre-Roster Fixes** — per-page Lexicanum-Cache, per-book Diff-Checkpointing, Cost-Recompute, Diff-Archivierung.
3. ✅ **Brief 057 — Excel-SSOT-Import** — Schema-Migration `0008_ssot_schema.sql`, Loader, deterministic `book-roster.json` (859 + 191). ADR [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).
4. ✅ **Brief 058 — V2-Pipeline-Refactor + erster 10er-Batch.** SSOT-Mode liest aus `book-roster.json`.
5. ✅ **Brief 060/061 — Authority-Layer first 50.** Standing-Loop-Konvention für 10er-Batches. **Side-effect:** Stage-3-LLM wird durch `claude -p`-Subsession ersetzt; ADR [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md) (2026-05-15) kodifiziert das.
6. ✅ **Brief 063–069 / Resolver-Welle 1** — first 50 W40K books: Migration 0009, Resolver-Modul, Reference-Rows + Aliases, `raw_name`-Audit, `db:apply-override` schreibt Junctions. Counts post-069: `work_factions=318`, `work_locations=129`, `work_characters=363`.
7. ✅ **Brief 070 — Faction-Policy & Hierarchie-Hygiene** — Browse-Root vs. Tree-Root, `factions.json` Audit-Pass, `seed-resolver-extensions` faction-Insert auf Upsert, neue `brain:lint`-Kategorie.
8. ✅ **Brief 071 — Loop-Driver-Script** — `scripts/run-ssot-loop.sh`, produktiver `N=5`-Run als PR #54 (`ssot-w40k-011..015`, 50 Override-Files committed).
9. ✅ **Brief 072 — Resolver-Welle 2** für `ssot-w40k-006..010`: `heretic_astartes`-Mid-Knoten, Reparents, Cross-Batch-`applyCollections` via `external_book_id`. Counts post-072: `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`.
10. ✅ **Brief 073 — Maintainer-Audit-Cockpit (OQ9)** — `/buch/[slug]/audit` Sub-Route, `/buecher`-Audit-Modus mit vier Pillen (Drift / Junction-Lücke / SSOT / In mehreren Collections, AND-kombiniert), Default-Sort `updatedAt desc`, `src/lib/book-labels.ts`.
11. ✅ **Brief 074 — Resolver-Welle 3 + Watson-Trilogy historical-canon-layer** für `ssot-w40k-011..015`: 20 neue Factions inkl. `hydra_cabal`, 19 Locations, 26 Characters, Squats-`tone`-Update via Upsert, Green-Tide-`collection-gaps.json`-Ledger statt partieller Collection-Kanten, 13 LLM-Catalog-Typos gestrippt. Counts post-074: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. Re-Apply 001..015 hat First-Apply für 011..015 mit-erledigt (Loop-Driver-PR #54 hatte nur Override-Files committed, nicht in DB geschrieben).
12. ✅ **Brief 075 — Cockpit-Refinement + Hardcover-Rating-Backfill** (PR #59). Drift-Frequenz-Sort + slim „Auch enthalten in:"-Komma-Zeile auf `/buch/[slug]` + Standalone-Backfill `scripts/backfill-hardcover-rating.ts` (W40K-SSOT-eng, idempotent + `--force`, `no_author`-Bucket). Endstand 77/150 (51.3 %).
13. ✅ **Loop-Driver-Run für `ssot-w40k-016..020`.** PR-bundled mit Brief 076: nach 075-Merge produktiv gelaufen, 50 neue Override-Files committed, in DB applied via 076-impl-Re-Apply.
14. ✅ **Brief 076 — Resolver-Welle 4 (axis-sliced) + Driver-Deliverable** (PR #62). Fünf Subsessions (Preflight → Factions → Locations → Characters → Integration + Mini-Phase 5 Public-Synopsis-Discipline), +20 factions/+25 locations/+40 characters, Cross-Batch-Alias-Consolidation für Mad Donna/D'onne Ulanti, Ragnar Thunderfist, Kage/the Burned Man (single-row) + Lord Helmawr (split), Soul Drinkers mit `primaris_reboot_coexistent`. Counts post-076: `work_factions=1185`, `work_locations=417`, `work_characters=633`, `work_collections=56` über 200 W40K-Bücher. Resolver-Driver `scripts/run-resolver-pass.sh` + `scripts/resolver-pass.config.json` als Pass-5-Template gebaut.
15. ✅ **Brief 077 — Grand-Alignment-Junction-Hygiene** (PR-ready, `c7ada5d`). Skip-Logik im Apply-Layer schreibt `imperium`/`chaos` nicht mehr als `work_factions`-Junction, wenn alignment-gleiche Sub-Faction im selben Override-Block resolved ist. `scripts/apply-override-skip.ts` (pure DI-Helper) + `src/lib/seed/alignment.ts` (shared) + `redundantWhenSubPresent: ["imperium", "chaos"]` in `faction-policy.json` + `factions.json`-`imperium`-Row explizit `"alignment": "imperium"` + `factionsSkippedRedundant`-Bucket im `book_details.notes`. Re-Apply 001..020: `work_factions=1185 → 1020 (−165)`. Loop-Discipline „Faction-Granularity" ab `ssot-w40k-021` in 061 + Trigger-Heredoc; ADR-Section in `faction-policy.md`.
16. ✅ **Loop-Re-Trigger `ssot-w40k-021..025`** (PR #77, `c2f53e7`) — Standing-Loop 50 Bücher W40K-0201..0250, vier Loop-Disziplinen aktiv, selbst-erkennende 250er-Pause.
17. ✅ **Resolver-Pass 5 für `ssot-w40k-021..025`** (Brief 089, PR #78) — axis-sliced, **manuell/supervised gefahren statt über den Driver** (Maintainer-Wahl stop-before-push). 250 Bücher applied, 250er-Pause geräumt.
18. ✅ **OQ (11) Locations-Axis-Hygiene** — geschlossen durch Brief 084 (PR #71): Allowlist-Umbrella-Skip auf der Locations-Achse, `location-policy.json` + `apply-override-location-skip.ts`, ADR `decisions/location-policy.md`.
19. ✅ **OQ (10) Hardcover-Hit-Rate-Härtung** — geschlossen 2026-05-20: Brief 086 (Pass 2) landete bei 58 % (strukturelle Hardcover-Katalog-Lücke); die Rating-Coverage kam stattdessen über den Goodreads-Pivot (ADR `decisions/hardcover-to-goodreads-pivot.md`) + Brief 087 (Goodreads-Rating-Loop-Disziplin).
20. ✅ **Brief 090 — Resolver-Pass lean** (PR #80) + **erster 100er-Loop-Lauf `ssot-w40k-026..035`** (PR #81). Brief 090: brief-freier, runbook-getriebener Resolver-Pass (`sessions/resolver-pass-runbook.md`), Phase-4 digest-only, stabile wave-parametrisierte Tools (keine `-NNN`-Klone), Resolver-Cadence 50→100. Loop: 100 Bücher W40K-0251..0350 in zehn Iterationen, kumulativ 350 Override-Files, DB bei 250, selbst-erkennender 350er-Resolver-Pause-Block.
21. ✅ **Resolver-Pass 6/7 + Brief 091 + Brief 094/095 — die Resolver-Maschinerie-Reihe.** Resolver-Pass 6 (`ssot-w40k-026..035`, PR #83) + 7 (`ssot-w40k-036..045`, PR #90) haben die DB auf **450/450 W40K-Bücher** gebracht (supervised/axis-sliced). Brief 091 hat Phase 4 in 4a/4b gesplittet + den forward-ref-Guard range-aware gehärtet; Pass 7 war der erste echte Lauf darauf (sauber — Dry-Prediction == DB-POST-APPLY exakt, Trias grün, kein `## Needs decision`). **Brief 094** hat danach den Resolver vom SSOT-Loop entkoppelt + headless automatisiert (Wellen-Detektor `resolver-loop-detect.ts`, headless Driver `run-resolver-loop.sh`, brief-freies Runbook, `resolver-loop-log.md`) — die Resolver-Cadence existiert nicht mehr, beide Loops laufen headless bis 859. **Brief 095** hat parallel die Rollup-Ownership geklärt (`sessions/README.md` + `brain/**` nur noch aus dem Koordinations-Worktree). Erster scharfer headless Resolver-Lauf = die 115 W40K-Reste (`046..057`), operativ getriggert.
22. **Cockpit-Sub-Sortierung + Public-Rating-Render-Doppelpack.** Innerhalb Drift-Tie-Group sub-sortieren (075/076-impl bestätigen den Bedarf) + `bookDetails.rating` (446/450 in DB) auf `/buch/[slug]` rendern. UI-leicht, gut bündelbar.
23. **Konsolidierungs-Pass-Brief.** Brief 094 hat einen eigenen Pass-Typ abgegrenzt — ein Reference-/Alias-Konsolidierungs-Lauf über den vollen W40K-Korpus, erster Lauf am W40K-complete-Meilenstein (565 Bücher), zugleich Maschinerie-Test vor der HH-Domain. Noch nicht geschrieben; fällig wenn die headless Loops 565 erreichen.
24. **OQ3 — Hand-Check-Workflow + Override-Schema.** Cockpit ist verfügbar; Override-Field-Schema + Triage-Disziplin stehen noch aus. Wahrscheinlich gebündelt mit dem Cockpit-Refinement.
25. **Collection-Gap-Ledger-Pflege.** `collection-gaps.json` trägt nach Pass 7 vier Einträge (Green Tide + drei Pass-7-Fälle). Wenn der Maintainer-Excel-Workflow die fehlenden Constituents als eigene Roster-Works modelliert, schließt ein Folge-Brief die Einträge.
26. **3e Voll-Apply** (alle 859 Bücher in DB) sobald die headless Loops durchlaufen — der SSOT-Loop kristallisiert bis 859, der Resolver-Loop resolved + applied in ≤60-Buch-Wellen.
27. **Refresh-Layer für volatile Felder.** Rating-Refresh + Availability + Cover-URL — separater Pfad mit eigener Cadence; der Goodreads-Page-Read aus Brief 087 ist die etablierte Mechanik (Roadmap-Ideas-Backlog „Refresh-Button").
28. **3f Maintenance-Crawler.** GH-Action monthly Wikipedia/TLBranson-Diff für new releases — *post-SSOT* nur noch als Vorschlags-Quelle für die Excel-Workflow-Iteration.

**Closed/superseded:**

- ~~Phase-3e Modell-Entscheidung~~ (OQ1) — closed pro Sonnet 2026-05-13 ([`./decisions/why-sonnet-not-haiku.md`](./decisions/why-sonnet-not-haiku.md)), formal superseded 2026-05-15 durch CC-Direct-Curation ADR. Stage-3-LLM läuft nicht mehr.
- ~~Vokabular-Erweiterung~~ (OQ2) — (a) in Cockpit-Triage, (b) durch Brief 072 in der DB-Hierarchie geschlossen, (c) moot post-Pipeline-Shift in [`./deferred-questions.md`](./deferred-questions.md) geparkt.

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
