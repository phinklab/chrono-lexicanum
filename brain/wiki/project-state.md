---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-05-10
sources:
  - ../../sessions/archive/2026-05/2026-05-08-047-arch-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-08-048-arch-doc-refresh.md
  - ../../sessions/archive/2026-05/2026-05-08-048-impl-doc-refresh.md
  - ../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../sessions/archive/2026-05/2026-05-09-049-impl-karpathy-brain-atlas-reset.md
  - ../../sessions/2026-05-09-054-arch-pipeline-v2-pilot.md
  - ../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md
  - ../../sessions/2026-05-09-055-arch-v2-voll-lauf-decision-gate.md
  - ../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md
  - ../../sessions/2026-05-10-056-arch-v2-pre-roster-fixes.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
  - ../../sessions/README.md
  - ../../ROADMAP.md
related:
  - ./pipeline-state.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
confidence: high
---

# Project state — 2026-05-10

> The "where are we now" anchor. Cowork and Claude Code start every session here (after `brain/CLAUDE.md` and `wiki/index.md`).

## Phase

**Phase 3 — Bulk-Backfill-Pipeline (in flight, dry-run, V2-Voll-Lauf 50 Bücher gelandet).** The TypeScript ingestion pipeline (Wikipedia + TLBranson + Lexicanum + Open Library + Hardcover crawlers + Anthropic Haiku 4.5 Slim-LLM + deterministische Validatoren + Provenance-pro-Feld) is wired in two parallel Pfaden (V1 + V2) und produziert dry-run Diffs. 055-Voll-Lauf hat 50 Bücher als V2-Diff geliefert; gleichzeitig drei strukturelle Schwächen freigelegt (Lexicanum-Throttle, blinde Cost-Telemetrie auf Cache-Hits, kein Per-Book-Checkpointing). **Pivot 2026-05-10**: weg vom Voll-Lauf-Pfad, hin zu kuratierten 10er-Batches gegen eine Master-Liste. Sequenz: Brief 056 (Pre-Roster-Fixes, Lex-Cache + Checkpointing + Cost-Recompute), Brief 057 (Master-Liste-Erstellung, `book-roster.json` + Override-Datei), Brief 058 (V2-Batch auf Master-Liste umstellen + erster 10er), Briefs 059+ (fortlaufende 10er-Batches mit Maintainer-Review zwischen den Briefs). Resolver-Brief verschoben hinter die ersten 30–50 real-prozessierten Bücher.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

The book domain currently holds **26 hand-curated books** in Postgres (Stufe 2b seed, sessions 021/022). The pipeline has discovered ~700 more via Wikipedia + TLBranson, but those are dry-run only — no DB writes have occurred yet from the pipeline.

## Branch

Active branch: `feat/phase-3c-llm-enrichment`. Recent merges into this branch: 047 (pipeline hardening, commit `4da6184`) and 048 (doc refresh) bundle, 049 (Karpathy-Reset, four commits `1f6da88`/`3f43f4c`/`64b47b5`/`9fa70d8`), 050 (Brain Hygiene), 051 (Brain Slim Pass), 052 (Ingest-Retention Decision), 053 (Brain Lint), 054 (V2-Pilot — TLBranson + Validatoren + Slim-LLM + BookV2Record), 055 (V2 Voll-Lauf 50 Bücher + `genericityScore` + Web-Search-Prompt-Härtung + Engine-Refactor `run-engine.ts`/`run-batch.ts`).

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` + `brain:lint --no-write` Jobs on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local`. Migrations 0000–0006 applied. **Migration 0007 (source_kind enum extension for `wikipedia` / `open_library` / `hardcover` / `llm`) committed but NOT applied** — the Apply-Step (3d) is the right context to run it, since enum-add is required only when those sources actually write to DB.
- **Pipeline V1 in dry-run.** `npm run ingest:backfill -- --limit N --offset M` reads from sources, merges, calls LLM, produces a `ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json`. Latest V1 committed: `ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, run aborted by Philipp after Buch 9; post-047 hardening verified; archived in 056).
- **Pipeline V2 in dry-run (Voll-Lauf 50 Bücher, post-055).** `npm run ingest:backfill -- --pipeline=v2 --pilot=v2-tryout-1` für Pilot-Slugs; `npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=N` für Batch (slug-sort selektor, wird in 058 durch Master-Liste abgelöst). Latest V2 committed: `v2-batch-20260510-1109.diff.json` (50 books, slug-window `13th-legion → ascension`, web-search 1.06/Buch, 4/5 Validator-Kinds non-zero) + Sibling-File `v2-batch-20260510-1109-surfaces.json` (Surface-Form-Frequenz-Dump für Resolver-Tooling). Cost-Telemetrie im Diff blind ($0/Buch wegen Cache-Hits beim finalen Lauf; real fresh-Cost $0.0199/Buch aus 5-Book-Smoke). 047er V1-Diff + 054er V2-Pilot-Diff werden in 056 nach `ingest/.archive/` verschoben. V1- und V2-Pfade laufen parallel; Default ohne `--pipeline=` Flag bleibt V1.
- **Atlas-Regen-Skript.** `npm run atlas:regen` writes a Postgres-mirror Obsidian vault to `~/chrono-atlas/` (Windows `C:\Users\Phil\chrono-atlas\`; override via `--out=<path>` or `ATLAS_PATH` env). 049-impl produced first proof-of-render (1 book + 1 faction + INDEX.md, DB-counts 26/29 verified). Manual trigger only (no auto-on-3d-Apply); see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint.** `npm run brain:lint` (10 Check-Kategorien) + CI-Gate `brain:lint -- --no-write` post-053. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`.

## Latest pipeline state (post-055, V2-Voll-Lauf 50 Bücher)

Brief 055 hat den ersten V2-Voll-Lauf über 50 Bücher geliefert (`v2-batch-20260510-1109.diff.json`, slug-window `13th-legion → ascension`). **Web-Search-Disziplin ist eindrucksvoll**: 1.06/Buch (47 Bücher genau 1 Search, 3 Bücher 2 Searches) bei Brief-Target ≤1.4 — die Prompt-Härtung in 055 hält. **Validator-Trigger 4-of-5 kinds non-zero**: `year_outlier` 1× (`angel-exterminatus`), `edition_isbn_conflict` 1× (`angel-exterminatus`), `pagecount_outlier` 0× (OL-Fall-through wie im Pilot), `author_editor_suspicion` 2× (Anthologien `age-of-darkness` + `architect-of-fate`), `lexicanum_missing` 20× (~40% des Slug-Windows). Surface-Form-Top-20 + Resolver-Triage-Notes liegen in `ingest/.last-run/v2-batch-20260510-1109-surfaces.json` als 056/057-Resolver-Input bereit (46.7% Faction-Direct-Match, 13.2% Locations, 0% Characters strukturell weil `seed-data/persons.json` Author-Roster ist).

**Drei strukturelle Schwächen aus 055-Lauf:** (1) Lexicanum-Throttle dominiert die Latenz (~60s/Buch lex-missing × 11 URL-Patterns × 5s Crawl-Delay; ~70% lex-missing-Rate im typischen Slug-Window → 100-Bücher-Batch ~70 Min nur für Lex-Probing). (2) Cost-Telemetrie blind auf Cache-Hits (`llmCostSummary.estUsdCost = $0` für alle 50 Bücher; real fresh-Cost $0.0199/Buch nur aus 5-Book-Smoke). (3) Kein per-book Diff-Checkpointing in `run-batch.ts` — mid-run-Halt verliert State (`scripts/synthesize-v2-batch-diff.ts` wurde als Fallback gebaut, aber der Live-Lauf hat sich glücklich durchgekämpft). Plus: TaskStop in der Cowork-Harness propagiert nicht zum tsx-Child — drei Halt-Versuche, drei Mal weitergelaufen. Brief 056 adressiert die ersten drei direkt; TaskStop ist Plattform-Limitation und out-of-scope.

**Pivot 2026-05-10**: Maintainer-Direktive nach 055-Erfahrung — weg vom Voll-Lauf-Pfad, hin zu kuratierten 10er-Batches gegen eine Master-Liste (`scripts/seed-data/book-roster.json` + Override-Datei aus tlbranson Books + Horus Heresy + Wikipedia-Master). Vorteile: 10 Bücher × 60s Lex-Throttle = 10 Min (session-tauglich); Maintainer kann zwischen den Briefs Surface-Forms/Validator-Trigger lesen; Discovery-Müll (`about-warhammer-40k` etc.) wird durch kuratierte Liste strukturell weggefiltert statt per Regex-Game-of-Whack-a-Mole.

V2-Pilot-Sektion (54er) und V2-Voll-Lauf-Sektion (55er) in [`./pipeline-state.md`](./pipeline-state.md) detailliert.

## V2-Pilot-Architektur (post-054)

V2-Pilot (Brief 054) läuft als Parallel-Pfad neben V1. Strukturelle Änderungen gegenüber V1:

- **Discovery-Spine erweitert.** TLBranson reading-order-Seiten als zweite Discovery-Quelle neben Wikipedia (cross-WordPress-Cache, kein Cloudflare). Patcht die Wikipedia-Frische-Lücke ab Dezember 2025 (chem-dog Proof-of-Coverage).
- **Lexicanum infobox-only.** Body-Year-Regex (`extractUniverseYears`) aus dem FIELDS-Pfad entfernt — schreibt nur noch infobox `Setting`/`Date`/`Story Date`. Body-Scan bleibt für Audit-Evidence (`claim.raw.bodyYearCandidates`), wird aber nie zu einem Field promoted ohne Validator-Use-Suggestion.
- **Fünf deterministische Validatoren.** `year_outlier` (Series-Anker-Tabelle für HH/SoT/Eisenhorn/Ravenor/Cain/Dawn-of-Fire), `edition_isbn_conflict`, `pagecount_outlier` (`<30` drop, `>1500` flag), `author_editor_suspicion` (Anthologie-Heuristik), `lexicanum_missing` (Transparenz-only). Validatoren modifizieren Stage-1-Claims nicht direkt; sie produzieren `Validation[]`, das Stage 4 in den finalen Record foldet.
- **Slim-LLM.** Rating und Availability raus aus `PUBLISH_ENRICHMENT_TOOL.input_schema.properties`. `WEB_SEARCH_TOOL.max_uses: 3` (statt 6), 1 obligatorisch (synopsis-context). Structured `factions`/`locations`/`characters` mit `{name, role}` statt flacher Namenslisten. Neuer `PROMPT_VERSION_HASH_V2` invalidiert den V1-Cache.
- **BookV2Record + Provenance pro Feld.** `FieldRecord<T>` = `{ value, source, fetchedAt, override?, evidence? }` pro Feld, mit explizitem Override-Slot für Hand-Korrekturen.
- **Hardcover-Mismatches silent-skipped.** Author-Mismatches landen NICHT mehr in `errors[]`; nur echte Crawler-Fehler (HTTP/GraphQL/Token).

V2-Pilot-Acceptance-Numbers aus `ingest/.archive/v2-pilot/v2-pilot-20260509-1934.diff.json` (5 Bücher; archived in 056) und V2-Voll-Lauf aus `ingest/.last-run/v2-batch-20260510-1109.diff.json` (50 Bücher) sind in [`./pipeline-state.md`](./pipeline-state.md) detailliert. Codex-Verdikt aus [`../raw/reviews/2026-05-09-codex-v2-pilot-review.md`](../raw/reviews/2026-05-09-codex-v2-pilot-review.md) (post-Pilot, pre-Voll-Lauf): „klar die bessere Pipeline-Basis, aber noch nicht die Pipeline, die ich ohne 055-Test direkt auf 700+ Bücher loslassen würde." Post-055-Befund bestätigt das: an 50 Büchern trägt V2 strukturell, aber Latenz + Cost-Telemetrie + Halt-Resilienz brauchen die Verbesserungen aus 056.

## What's open

Top items from [`./open-questions.md`](./open-questions.md), neu sortiert post-055-Pivot:

- **Brief 056 (in flight).** Lex-Cache + Per-Book-Checkpointing + Cost-Recompute + Diff-Archivierung — siehe [`../../sessions/2026-05-10-056-arch-v2-pre-roster-fixes.md`](../../sessions/2026-05-10-056-arch-v2-pre-roster-fixes.md).
- **Brief 057 (queued).** Master-Liste-Erstellung — `scripts/seed-data/book-roster.json` + `book-roster-overrides.json` + Build-Skript via tlbranson Books + Horus Heresy + Wikipedia-Master, dedup. Auto-generiert + manuelle Override-Datei (Maintainer-Wahl 2026-05-10).
- **Brief 058 (queued).** V2-Batch-Mode auf Master-Liste umstellen, weg vom Slug-Sort-Selektor. Erster 10er-Batch in der gleichen Session. Danach laufen Briefs 059+ als 10er-Batch-Reihe mit Maintainer-Review zwischen den Briefs.
- **Phase-3e-Modell-Entscheidung.** Haiku bleiben vs. Sonnet-Upgrade. 055-Empirie (Web-Search 1.06/Buch, Hochrechnung Haiku-Voll-Lauf ~$15 für 750 Bücher) verschiebt das Trade-off massiv Richtung Haiku.
- **Vokabular-Erweiterung.** `duty` (5+ Verstöße kumulativ), `legion`-Faceten-Dimension, `chaos`-pov_side-Pattern.
- **Junction-Resolver + Unresolved-Queue.** Verschoben hinter die ersten 30–50 real-prozessierten Bücher aus den 10er-Batches. Bis dahin ist die 055er Surface-Form-Top-20 Referenz, aber kein Implementier-Eingang. Empirie spricht für Option C (Hybrid Top-100) auf der Character-Achse — Primarchs + Ahriman + Schaeffer cluster naturally above the noise floor.
- **Hand-Check-Workflow + Override-Schema.** Sequenz post-Resolver, vor 3d-Apply. V2's `FieldRecord.override` bietet den passenden Slot.
- **3d-Apply-Step** (FK-Resolution, ALTER TYPE source_kind, UNIQUE INDEX external_links, junctionsLocked) — weiter hinten, nach Resolver.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-10 | 055-impl | complete | V2 Voll-Lauf 50 Bücher — `genericityScore`-Discovery-Merge mit 11 Unit-Tests, Web-Search-Prompt strict (1.06/Buch), Engine-Refactor (`run-engine.ts`/`run-batch.ts` als shared Stage 0–4), `v2-batch-20260510-1109.diff.json` als canonical Diff. Surface-Form-Top-20 + Resolver-Triage-Notes für 056-Resolver verfügbar. Cost-Telemetrie auf Cache-Hits blind ($0.0199/Buch real, aus 5-Book-Smoke). |
| 2026-05-09 | 054-impl | complete | V2-Pilot — TLBranson + Wikipedia Discovery, infobox-only Lexicanum, 5 deterministische Validatoren, Slim-LLM, BookV2Record mit Provenance pro Feld. 4/5 Acceptance-Bullets clean, $0.062/Buch (vs. V1 $0.114). |
| 2026-05-09 | 053 | complete | Brain Lint — `scripts/brain-lint.ts` + CI-Gate, erste Lint-Report-Datei. |
| 2026-05-09 | 052 | implemented | Ingest-Retention Decision (Option A: alles bleibt committed, Re-evaluate-Trigger gesetzt, Inline-Diff-Quote-Verbot). |
| 2026-05-09 | 051 | implemented | Brain Slim Pass — 22 sessions archiviert, ADRs gekürzt, open-questions.md Split in actionable + deferred + sub-phase backlog. |
| 2026-05-09 | 050 | implemented | Brain Hygiene Pass — Link-Audit, Frontmatter-Sources-Normalisierung, Read-Order-Fix, `.gitattributes`. |
| 2026-05-09 | 049-impl | complete (`1f6da88`/`3f43f4c`/`64b47b5`/`9fa70d8`) | Karpathy-Reset Brain + Atlas — 26 wiki pages + atlas-regen-skript + top-level consolidation. |
| 2026-05-08 | 047 + 048 (Bundle) | implemented (`4da6184`) | Pipeline-Härtung (5 Hebel) + Doku-Refresh (README/ARCHITECTURE/ONBOARDING auf Phase-3-Stand) |
| 2026-05-05 | 044 + 045 | complete | Phase 3e Batch 1 + Sonnet-Quadrant-Vergleich. |
| 2026-05-04 | 040 + 041 + 042 + 043 | complete | Haiku-Switch + Prompt-Härtung + Phase 3.5 Ingestion-Dashboard |
| 2026-05-03 | 035 + 037 + 039 | complete | 3a Skeleton + 3b Aux-Sources + 3c LLM-Schicht |

For older sessions and the full chronological log: [`../raw/historical/sessions-readme-log-pre-2026-05-08.md`](../raw/historical/sessions-readme-log-pre-2026-05-08.md) (pre-049 entries) and `sessions/archive/2026-04/`, `sessions/archive/2026-05/`.

## Next likely brief

Sequenz post-055-Pivot (kuratierte 10er-Batches statt Voll-Lauf):

- **Brief 056 (open)** — V2 Pre-Roster Fixes. Per-page Lexicanum-Cache (24h TTL + negative caching), per-book Diff-Checkpointing in `run-batch.ts`, Cost-Recompute auf Cache-Hits, Archivierung 047er V1-Diff + 054er V2-Pilot-Diff in `ingest/.archive/`. Vorarbeit für 057 + 10er-Batches.
- **Brief 057 (queued)** — Master-Liste-Erstellung. `scripts/seed-data/book-roster.json` + `book-roster-overrides.json` + Build-Skript (`scripts/build-book-roster.ts`) crawlt tlbranson Books + Horus Heresy + Wikipedia-Master, dedupt, schreibt die Datei. Override-Datei (`exclude` / `rename` / `extra`) erlaubt Hand-Korrekturen, die Re-Crawls überleben.
- **Brief 058 (queued)** — V2-Batch-Mode auf Master-Liste umstellen + erster 10er-Batch. Slug-Sort-Selektor in `run-batch.ts` ersetzt durch Roster-Index-basierte Auswahl. Erster 10er produziert committed Diff für Maintainer-Review.
- **Briefs 059+ (queued)** — fortlaufende 10er-Batches. Maintainer-Review zwischen den Briefs (Surface-Forms, Validator-Trigger, plausible Synopsen). Bei Findings: kleine Mini-Briefs zwischendrin (Vokabular-Erweiterung, Validator-Tuning, Override-Updates). Nach 30–50 real-prozessierten Büchern: Resolver-Brief mit empirischer Alias-Liste.
- **Resolver + Unresolved-Queue + 3d-Apply** — verschoben hinter die ersten 10er-Batches. Sequenz wird nach Brief 058 neu evaluiert.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed.
