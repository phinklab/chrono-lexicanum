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
  - ../../sessions/archive/2026-05/2026-05-10-056-arch-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-056-impl-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-057-arch-excel-roster-import.md
  - ../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
  - ../../sessions/README.md
  - ../../ROADMAP.md
related:
  - ./pipeline-state.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./decisions/why-excel-ssot-not-crawl.md
confidence: high
---

# Project state — 2026-05-10

> The "where are we now" anchor. Cowork and Claude Code start every session here (after `brain/CLAUDE.md` and `wiki/index.md`).

## Phase

**Phase 3 — Bulk-Backfill-Pipeline (in flight, dry-run, Excel-SSOT-Pivot durch 057 vollzogen).** Der TypeScript-Ingestion-Stack (Lexicanum + Open Library + Hardcover crawler + Anthropic Haiku 4.5 Slim-LLM + deterministische Validatoren + Provenance-pro-Feld) bleibt bestehen; die **Discovery-Stage** ist nach dem 055-Voll-Lauf strukturell von Wikipedia/TLBranson-Crawl auf eine Maintainer-kuratierte Excel-SSOT umgestellt worden. ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).

Sequenz seit 055: Brief 056 (V2-Pre-Roster-Fixes — Lex-Cache, Per-Book-Checkpointing, Cost-Recompute, Diff-Archivierung) **landed**; Brief 057 (Excel-SSOT-Import — Schema-Migration `0008`, Truncate-Skript `db-reset-for-ssot.ts`, Loader `import-ssot-roster.ts` + deterministisches `book-roster.json` mit 859 Büchern + 191 Collections) **landed code-seitig**, Migration-Apply + DB-Truncate **deferred to Maintainer-Trigger** (lokales `.env.local` zeigt auf prod-Supabase, CC kann nicht apply'n). Nächster Brief: 058 (V2-Pipeline-Refactor auf SSOT-Mode + erster 10er-Batch). Briefs 059+ als fortlaufende 10er-Batch-Reihe mit Maintainer-Review zwischen den Briefs. Resolver-Brief (OQ4 + OQ5) bleibt verschoben hinter die ersten 30–50 real-prozessierten Bücher.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

Das Buch-Domain-Bild ist mid-flight im Übergang: **26 hand-kuratierte Bücher** in Postgres (Stufe 2b seed, sessions 021/022) — werden mit Maintainer-Trigger durch das `db-reset-for-ssot`-Skript hard-deleted. Der **Excel-SSOT-Roster** mit 859 Büchern + 191 Collections liegt deterministisch unter `scripts/seed-data/book-roster.json`; Pipeline-Konsumtion startet mit Brief 058.

## Branch

Active branch: `feat/phase-3c-llm-enrichment`. Recent merges into this branch: 047 (pipeline hardening, commit `4da6184`) and 048 (doc refresh) bundle, 049 (Karpathy-Reset, four commits `1f6da88`/`3f43f4c`/`64b47b5`/`9fa70d8`), 050 (Brain Hygiene), 051 (Brain Slim Pass), 052 (Ingest-Retention Decision), 053 (Brain Lint), 054 (V2-Pilot — TLBranson + Validatoren + Slim-LLM + BookV2Record), 055 (V2 Voll-Lauf 50 Bücher + `genericityScore` + Web-Search-Prompt-Härtung + Engine-Refactor `run-engine.ts`/`run-batch.ts`), 056 (V2-Pre-Roster-Fixes — Lex-Cache + Per-Book-Checkpointing + Cost-Recompute + Diff-Archivierung), 057 (Excel-SSOT-Import — Schema-Migration `0008`, Truncate-Skript, Loader, 859-Bücher-JSON-Roster).

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` + `brain:lint --no-write` Jobs on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local` zeigt heute auf prod (kein Test-Branch). Migrations 0000–0006 applied. **Migration 0007** (source_kind enum extension `wikipedia` / `open_library` / `hardcover` / `llm`) bleibt committed-but-NOT-applied — relevant erst beim 3d-Apply. **Migration 0008 `ssot_schema.sql`** (post-057, committed-but-NOT-applied): bookFormat-Enum +3 (`collection`/`artbook`/`scriptbook`), sourceKind-Enum +1 (`ssot`), `works.external_book_id varchar(16) UNIQUE`, `bookDetails.notes text`, `work_collections`-Junction (composite PK + display_order/confidence/basis + Cascade-FKs). Apply ist Maintainer-Trigger (lokal/Test bevorzugt; Cowork führt Apply nicht aus).
- **Excel-SSOT-Roster.** `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt) + Loader `scripts/import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json` (859 RosterBooks + 191 RosterCollections, SHA256 byte-identisch über Re-Runs). Pipeline-Konsumtion startet mit Brief 058. Der `db-reset-for-ssot`-Skript (`npm run db:reset-for-ssot -- --confirm`) macht den Hard-Delete der 26 hand-kuratierten Bücher in einem Schritt; auch Maintainer-Trigger.
- **Pipeline V1 in dry-run** (Default ohne `--pipeline=` Flag, bleibt für Reproduzierbarkeit alter Diffs). `npm run ingest:backfill -- --limit N --offset M`. Latest V1 committed: `ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, post-047 hardening, archived in 056).
- **Pipeline V2 in dry-run (Voll-Lauf 50 Bücher, post-055; Pre-Roster-Fixes post-056).** `npm run ingest:backfill -- --pipeline=v2 --pilot=v2-tryout-1` für Pilot-Slugs; `npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=N` für Batch (heute slug-sort, ab Brief 058 SSOT-Modus). Latest V2 committed: `ingest/.last-run/v2-batch-20260510-1109.diff.json` (50 books) + Sibling `-surfaces.json`. Per-page Lexicanum-Cache + per-book Diff-Checkpointing + Cost-Recompute auf Cache-Hits seit 056 wirksam.
- **Atlas-Regen-Skript.** `npm run atlas:regen` writes a Postgres-mirror Obsidian vault to `~/chrono-atlas/` (Windows `C:\Users\Phil\chrono-atlas\`; override via `--out=<path>` or `ATLAS_PATH` env). 049-impl produced first proof-of-render (1 book + 1 faction + INDEX.md, DB-counts 26/29 verified). Manual trigger only; see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint.** `npm run brain:lint` (10 Check-Kategorien) + CI-Gate `brain:lint -- --no-write` post-053. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`.

## Latest pipeline state (post-057, Excel-SSOT-Pivot)

Brief 055 hat den ersten V2-Voll-Lauf über 50 Bücher geliefert (`v2-batch-20260510-1109.diff.json`, slug-window `13th-legion → ascension`, 1.06 web_search/Buch, 4-of-5 Validator-Kinds non-zero). Brief 056 hat die drei strukturellen Schwächen aus dem Voll-Lauf isoliert behoben: per-page Lexicanum-Cache (24h TTL + negative caching, ~5000× Speedup auf Cache-Hits), per-book Diff-Checkpointing in `run-batch.ts` (mid-run-Halt verliert State nicht mehr), Cost-Recompute auf Cache-Hits ($0.0352/Buch live-verifiziert vs. pre-056 $0/Buch), plus 9-Datei-Diff-Archivierung nach `ingest/.archive/{v1,v2-pilot,v2-batch}/`.

Brief 057 hat den **Excel-SSOT-Pivot vollzogen** (siehe [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)): Maintainer-Excel `Warhammer_Books_SSOT_enriched.xlsx` (859 Bücher, 192 Collection-Beziehungen Roh / 191 nach Header-Korrektur, 100% Type/Section/URL-Coverage) liegt jetzt unter `scripts/seed-data/source/`; Loader `import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json`. Drizzle-Schema um vier atomare Adds erweitert + Migration `0008_ssot_schema.sql` generiert (Apply Maintainer-Trigger). Truncate-Skript `db-reset-for-ssot.ts` mit `--confirm`/`DB_RESET_CONFIRM=1`-Gate gebaut.

**CC-Erweiterungen in 057-impl ggü. Brief-Acceptance** (Cowork akzeptiert): RosterBook-Schema trägt zusätzlich `editors: string[]` + `editorialNote: "various" | null` (Konsequenz aus den zwei OQ-Antworten "Various Authors" + "(ed.)"-Trailing). `external_book_id` ist `UNIQUE` ohne separaten Index (B-Tree-Backing reicht). `work_collections`-Junction trägt nur einen Sekundär-Index auf `content_work_id` (composite-PK deckt `collection_work_id` als Leading-Column ab; Maintainer kann via 0009-Mini-Migration nachreichen falls gewünscht). Year-Validierung pragmatisch: `null` → warn (1 Treffer: W40K-0307 "War for Armageddon Omnibus"), non-numeric → loud-Error.

**Author-Splitting-Empirie** aus dem 859-Buch-Loader-Lauf: 772 solo, 3 multi (`X and Y`), 62 various (61× "Various Authors" + 1× "Dan Abnett & Others"), 0 `(ed.)`/`(eds.)`/`(editor)`, 23 leere Author-Cells ohne Various-Marker. Slug-Disambiguierung: 1 Section-Disambig (zwei "Ascension"-Bücher → `ascension-dawn-of-war` + `ascension-blackstone-fortress`), 0 Triple-Collisions.

V2-Pilot-Sektion (54er), V2-Voll-Lauf-Sektion (55er), V2-Pre-Roster-Fixes (56er) und SSOT-Pivot (57er) in [`./pipeline-state.md`](./pipeline-state.md) detailliert.

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

Top items from [`./open-questions.md`](./open-questions.md), neu sortiert post-057:

- **Maintainer-Trigger (out of Cowork-/CC-Loop).** Migration-Apply `0008_ssot_schema.sql` + Truncate-Smoke `db:reset-for-ssot -- --confirm` gegen prod-Supabase. Verifikations-Outputs (`\d+ work_collections`, `enum_range(NULL::book_format)`, `enum_range(NULL::source_kind)`, `\d works`, COUNT-vorher/nachher) sollten in einen Append zu [`../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md`](../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md) (oder Brief 058) wandern.
- **Brief 058 (queued).** V2-Pipeline-Refactor + erster 10er-Batch. SSOT-Mode in `run-batch.ts` (`--source=ssot --offset=N --limit=M`), Discovery-Stage 0 abschalten, Stage-1-Validators trimmen (`year_outlier` raus weil Year-fix; `author_editor_suspicion` raus oder umbauen weil Format/`editorialNote`/`editors` aus Excel kommen), Stage-3-LLM-Tool-Schema schrumpfen (Author/Year/Format/Title raus), erster 10er-Batch als committed Diff. Hängt **nicht** strikt am Maintainer-Trigger (dry-run berührt DB nicht).
- **Briefs 059+ (queued).** Fortlaufende 10er-Batches mit Maintainer-Review zwischen den Briefs. Mini-Briefs zwischendrin für Vokabular-Erweiterung (OQ2), Validator-Tuning, Override-Updates.
- **Phase-3e-Modell-Entscheidung** (OQ1). Haiku bleiben vs. Sonnet-Upgrade. 055-Empirie (Web-Search 1.06/Buch, Hochrechnung Haiku-Voll-Lauf ~$15 für 750 Bücher) verschiebt das Trade-off massiv Richtung Haiku.
- **Vokabular-Erweiterung** (OQ2). `duty` (5+ Verstöße kumulativ), `legion`-Faceten-Dimension, `chaos`-pov_side-Pattern.
- **Hand-Check-Workflow + Override-Schema** (OQ3). Sequenz post-Resolver, vor 3d-Apply. V2's `FieldRecord.override` bietet den passenden Slot.
- **Junction-Resolver + Unresolved-Queue** (OQ4 + OQ5). Verschoben hinter die ersten 30–50 real-prozessierten Bücher aus den 10er-Batches. Bis dahin sammeln die Diffs Surface-Forms; Empirie spricht für Option C (Hybrid Top-100) auf der Character-Achse.
- **Hardcover-Rating-Promotion + OL-Fallback** (OQ6). Architectural call zu Field-Schema + OL-Fallback ja/nein; Implementation ~10–20 LOC.
- **DetailPanel "Auch enthalten in:"-Mini-Brief.** Backend-bereit (Junction `work_collections` + `worksRelations.containedIn`/`contains`). Frontend folgt sobald 058+ erste Omnibus-Children im Diff/DB hat.
- **3d-Apply-Step** (FK-Resolution, ALTER TYPE source_kind, UNIQUE INDEX external_links, junctionsLocked) — weiter hinten, nach Resolver.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-10 | 057-impl | complete | Excel-SSOT-Import — Schema-Migration `0008_ssot_schema.sql` (bookFormat-Enum +3, sourceKind +1, `works.external_book_id` UNIQUE, `bookDetails.notes`, `work_collections`-Junction mit Self-M2M), Truncate-Skript `db-reset-for-ssot.ts` mit `--confirm`/ENV-Gate, Loader `import-ssot-roster.ts` produziert deterministisch (SHA256-verifiziert) `book-roster.json` mit 859 Büchern + 191 Collections. Migration-Apply + Truncate-Smoke deferred zu Maintainer-Trigger. |
| 2026-05-10 | 056-impl | complete | V2 Pre-Roster Fixes — per-page Lexicanum-Cache (24h TTL + negative caching), per-book Diff-Checkpointing in `run-batch.ts`, Cost-Recompute auf Cache-Hits ($0.0352/Buch live verifiziert), 9-Datei-Diff-Archivierung nach `ingest/.archive/{v1,v2-pilot,v2-batch}/`. |
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

Sequenz post-057 (Excel-SSOT-Roster gelandet, 10er-Batch-Reihe öffnet):

- **Maintainer-Trigger zuerst** — `npm run db:migrate` (Migration `0008` apply gegen prod-Supabase) + `npm run db:reset-for-ssot -- --confirm` (Hard-Delete der 26). Verifikations-Outputs in 057-impl-Append. Cowork wartet hier.
- **Brief 058 (queued)** — V2-Pipeline-Refactor + erster 10er-Batch. SSOT-Mode in `run-batch.ts` (`--source=ssot --offset=N --limit=M`), Discovery-Stage 0 abschalten, Stage-1-Validators trimmen (`year_outlier` raus, `author_editor_suspicion` raus oder umbauen), Stage-3-LLM-Tool-Schema schrumpfen (Author/Year/Format/Title raus), erster 10er-Batch als committed Diff. Hängt nicht strikt am Maintainer-Trigger (dry-run berührt DB nicht).
- **Briefs 059+ (queued)** — fortlaufende 10er-Batches. Maintainer-Review zwischen den Briefs (Surface-Forms, Validator-Trigger, plausible Synopsen). Bei Findings: kleine Mini-Briefs zwischendrin (Vokabular-Erweiterung OQ2, Validator-Tuning, Excel-Fix-Re-Imports).
- **DetailPanel "Auch enthalten in:"-Mini-Brief** — sobald 058+ erste Omnibus + Children im Diff/DB hat. Frontend-Query gegen `work_collections WHERE content_work_id = ?`.
- **Resolver + Unresolved-Queue (OQ4 + OQ5) + 3d-Apply** — verschoben hinter die ersten 10er-Batches. Sequenz wird nach ~30–50 prozessierten Büchern neu evaluiert.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed.
