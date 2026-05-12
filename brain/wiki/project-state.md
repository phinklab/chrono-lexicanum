---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-05-13
sources:
  - ../../sessions/archive/2026-05/2026-05-08-047-arch-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-08-048-arch-doc-refresh.md
  - ../../sessions/archive/2026-05/2026-05-08-048-impl-doc-refresh.md
  - ../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../sessions/archive/2026-05/2026-05-09-049-impl-karpathy-brain-atlas-reset.md
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
  - ../../sessions/2026-05-11-062-arch-apply-override-author-fix.md
  - ../../sessions/2026-05-11-062-impl-apply-override-author-fix.md
  - ../../sessions/2026-05-12-063-arch-resolver-50-books.md
  - ../../sessions/2026-05-12-063-impl-resolver-50-books.md
  - ../../sessions/2026-05-12-067-impl-resolver-apply-readiness.md
  - ../../sessions/2026-05-12-069-impl-resolver-apply-evidence.md
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

# Project state — 2026-05-13

> The "where are we now" anchor. Cowork and Claude Code start every session here (after `brain/CLAUDE.md` and `wiki/index.md`).

## Phase

**Phase 3 — Bulk-Backfill-Pipeline (in flight, SSOT-Authority-Layer aktiv).** Der TypeScript-Ingestion-Stack bleibt bestehen, aber die Discovery-Stage ist seit 057 nicht mehr der Default-Eingang: die Maintainer-kuratierte Excel-SSOT ist die Roster-Quelle. ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).

Sequenz seit 057: Brief 058 hat den SSOT-Modus und den ersten 10er-Batch gebaut; 060 hat `ssot-w40k-001` in die DB geschrieben; 061 lief als Standing-Loop bis `ssot-w40k-005` (50 Bücher); 062 fixte den Author-FK-Pfad; 063–069 haben den Resolver-Layer für diese 50 Bücher implementiert, reviewed, applied und mit DB-Counts verifiziert. **OQ4/OQ5 sind damit für die ersten 50 Bücher geschlossen**: Resolver-Sidecar-JSONs, canonical Factions/Locations/Characters, `raw_name`-Audit-Spalten und Re-Apply `001..005` sind gelandet.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

Das Buch-Domain-Bild ist jetzt im SSOT-Authority-Modus: **50 W40K-Bücher** (`ssot-w40k-001..005`) sind in Postgres applied, mit Resolver-Junctions auf `work_factions=318`, `work_locations=129`, `work_characters=363` nach 069. Der **Excel-SSOT-Roster** mit 859 Büchern + 191 Collections liegt deterministisch unter `scripts/seed-data/book-roster.json`; nächster operativer Schritt ist `ssot-w40k-006` über Brief 061.

## Branch

Active branch while this cleanup ran: `session-063-resolver-50-books` (ahead of `origin/session-063-resolver-50-books` by local cleanup/Brain commits until pushed). `main` is at the 061 loop state through `ssot-w40k-005`; resolver commits 063–069 live on the resolver branch and are intended to merge before the next batch resumes.

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` + `brain:lint --no-write` Jobs on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local` zeigt heute auf prod (kein Test-Branch). Migrations durch `0009_lucky_pete_wisdom.sql` sind applied: 0008 brachte SSOT-Schema/`work_collections`, 0009 machte `locations.gx/gy` nullable und fügte `raw_name` auf `work_factions`, `work_locations`, `work_characters` hinzu. `db:seed-resolver-extensions` hat +23 Factions, +3 Sectors, +40 Locations, +65 Characters geschrieben.
- **Excel-SSOT-Roster.** `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt) + Loader `scripts/import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json` (859 RosterBooks + 191 RosterCollections). Die Pipeline konsumiert den Roster seit 058; `ssot-w40k-001..005` sind applied, `ssot-w40k-006` ist der nächste Batch.
- **Pipeline V1 in dry-run** (Default ohne `--pipeline=` Flag, bleibt für Reproduzierbarkeit alter Diffs). `npm run ingest:backfill -- --limit N --offset M`. Latest V1 committed: `ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, post-047 hardening, archived in 056).
- **Pipeline V2 / SSOT Authority path.** `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-00N` erzeugt die Diff-/Override-Basis; `scripts/apply-override.ts` schreibt curated overrides in die DB. Resolver-Support liegt in `src/lib/resolver/`, `scripts/seed-data/{faction,location,character}-aliases.json`, `scripts/seed-data/characters.json`, `scripts/test-resolver*.ts` und `docs/resolver-apply-runbook.md`.
- **Atlas-Regen-Skript.** `npm run atlas:regen` writes a Postgres-mirror Obsidian vault to `~/chrono-atlas/` (Windows `C:\Users\Phil\chrono-atlas\`; override via `--out=<path>` or `ATLAS_PATH` env). 049-impl produced first proof-of-render (1 book + 1 faction + INDEX.md, DB-counts 26/29 verified). Manual trigger only; see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint.** `npm run brain:lint` (10 Check-Kategorien) + CI-Gate `brain:lint -- --no-write` post-053. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`.

## Latest pipeline state (post-069, resolver applied)

Brief 055 hat den ersten V2-Voll-Lauf über 50 Bücher geliefert (`v2-batch-20260510-1109.diff.json`, slug-window `13th-legion → ascension`, 1.06 web_search/Buch, 4-of-5 Validator-Kinds non-zero). Brief 056 hat die drei strukturellen Schwächen aus dem Voll-Lauf isoliert behoben: per-page Lexicanum-Cache, per-book Diff-Checkpointing, Cost-Recompute auf Cache-Hits, plus Diff-Archivierung.

Brief 057 hat den **Excel-SSOT-Pivot vollzogen** (siehe [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)): Maintainer-Excel liegt unter `scripts/seed-data/source/`; Loader `import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json`. Brief 058 hat den V2-SSOT-Modus gebaut; 060/061 haben die ersten fünf W40K-10er-Batches in den Authority-Layer gebracht.

**CC-Erweiterungen in 057-impl ggü. Brief-Acceptance** (Cowork akzeptiert): RosterBook-Schema trägt zusätzlich `editors: string[]` + `editorialNote: "various" | null` (Konsequenz aus den zwei OQ-Antworten "Various Authors" + "(ed.)"-Trailing). `external_book_id` ist `UNIQUE` ohne separaten Index (B-Tree-Backing reicht). `work_collections`-Junction trägt nur einen Sekundär-Index auf `content_work_id` (composite-PK deckt `collection_work_id` als Leading-Column ab; Maintainer kann via 0009-Mini-Migration nachreichen falls gewünscht). Year-Validierung pragmatisch: `null` → warn (1 Treffer: W40K-0307 "War for Armageddon Omnibus"), non-numeric → loud-Error.

Brief 063–069 haben die Resolver-Schicht für diese ersten 50 Bücher geschlossen: 0009 applied, resolver reference data seeded, `apply-override` schreibt `work_characters`, normalisiert Rollen und bewahrt Surface-Forms in `raw_name`. 069-Counts nach Apply: `work_factions=318`, `work_locations=129`, `work_characters=363`; Smoke-Slugs matchen die Dry-Run-Erwartung (`xenos 3/3/6`, `first-and-only 5/6/10`, `necropolis 7/4/9`, `nightbringer 7/1/5`, `the-anarch 9/3/11`).

V2-Pilot (54), V2-Voll-Lauf (55), V2-Pre-Roster-Fixes (56), SSOT-Pivot (57/58) und Resolver-Layer (063–069) sind in [`./pipeline-state.md`](./pipeline-state.md) detailliert.

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

Top items from [`./open-questions.md`](./open-questions.md), neu sortiert post-069:

- **Resume Brief 061 with `ssot-w40k-006`.** Resolver/Apply blocker ist weg; nächster Batch kann nach Merge/Push des Resolver-Branches und sauberem Worktree weiterlaufen.
- **Phase-3e-Modell-Entscheidung** (OQ1). Haiku bleiben vs. Sonnet-Upgrade. 055-Empirie (Web-Search 1.06/Buch, Hochrechnung Haiku-Voll-Lauf ~$15 für 750 Bücher) verschiebt das Trade-off massiv Richtung Haiku.
- **Vokabular-Erweiterung** (OQ2). `duty` (5+ Verstöße kumulativ), `legion`-Faceten-Dimension, `chaos`-pov_side-Pattern.
- **Hand-Check-Workflow + Override-Schema** (OQ3). V2's `FieldRecord.override` und die 061-Override-Loop liefern den passenden Slot; Cowork muss noch die längerfristige Triage-Disziplin festziehen.
- **Hardcover-Rating-Promotion + OL-Fallback** (OQ6). Architectural call zu Field-Schema + OL-Fallback ja/nein; Implementation ~10–20 LOC.
- **DetailPanel "Auch enthalten in:"-Mini-Brief.** Backend-bereit (Junction `work_collections` + `worksRelations.containedIn`/`contains`). Frontend folgt sobald 058+ erste Omnibus-Children im Diff/DB hat.
- **Cross-Batch-Collection-Resolution.** `apply-override.applyCollections` ist weiterhin intra-batch; Omnibus-Refs über Batch-Grenzen brauchen einen Mini-Brief.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-12 | 069-impl | complete | Resolver Apply Evidence — `db:migrate`, `db:seed-resolver-extensions`, Re-Apply `ssot-w40k-001..005`; DB-Counts nachher `work_factions=318`, `work_locations=129`, `work_characters=363`, Smoke-Slugs matchen Dry-Run. |
| 2026-05-12 | 063–067 | complete | Resolver Layer — Migration `0009`, Resolver-Modul, Alias-/Reference-Daten, `work_characters`-Apply, Role-Normalisierung, Dry-Run/Runbook, Detailpage Locations+Characters. |
| 2026-05-11 | 058–062 | complete | SSOT-Mode + erster Authority-Layer — V2 liest `book-roster.json`, erster 10er-Batch, DB-Apply `ssot-w40k-001`, Standing-Loop 061 bis `ssot-w40k-005`, Author-FK-Fix. |
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

Sequenz post-069:

- **Clean merge / push resolver branch.** `session-063-resolver-50-books` enthält den apply-verifizierten Resolver-Stand; vor nächstem Batch sollte der Worktree sauber und der Branch synchronisiert sein.
- **Resume Brief 061 mit `ssot-w40k-006`.** 50er-Resolver-Pause ist erledigt. Die nächste Loop-Session erzeugt den nächsten 10er-Override und stoppt wieder für Review.
- **Cross-Batch-Collection-Resolution-Mini-Brief.** Sobald die Omnibus-Refs über Batch-Grenzen UX-relevant werden, `applyCollections` um `external_book_id → works.id` über alle applied works erweitern.
- **DetailPanel "Auch enthalten in:"-Mini-Brief.** Backend-bereit; Frontend-Query gegen `work_collections WHERE content_work_id = ?`.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed.
