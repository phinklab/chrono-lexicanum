---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-05-15
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
  - ../../sessions/archive/2026-05/2026-05-12-063-arch-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-063-impl-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-067-impl-resolver-apply-readiness.md
  - ../../sessions/archive/2026-05/2026-05-12-069-impl-resolver-apply-evidence.md
  - ../../sessions/2026-05-13-070-arch-faction-policy-hygiene.md
  - ../../sessions/2026-05-13-070-impl-faction-policy-hygiene.md
  - ../../sessions/2026-05-13-071-arch-loop-driver.md
  - ../../sessions/2026-05-14-072-arch-resolver-batch-2.md
  - ../../sessions/2026-05-14-072-impl-resolver-batch-2.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
  - ../../sessions/README.md
  - ../../ROADMAP.md
related:
  - ./pipeline-state.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./decisions/faction-policy.md
  - ./decisions/why-sonnet-not-haiku.md
confidence: high
---

# Project state — 2026-05-15

> The "where are we now" anchor. Cowork and Claude Code start every session here (after `brain/CLAUDE.md` and `wiki/index.md`).

## Phase

**Phase 3 — Bulk-Backfill-Pipeline (in flight, SSOT-Authority-Layer aktiv, dritte 50er-Welle gemerged, Resolver-Pass 3 offen).** Der TypeScript-Ingestion-Stack bleibt im Repo bestehen, aber die V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) ist seit dem Brief-061-Standing-Loop **de-facto ausgemustert** — eine `claude -p`-Subsession (Default-Modell, momentan Opus) produziert die Override-Datei direkt. Damit sind OQ1 (Sonnet-vs-Haiku) und OQ2-(c) (`chaos`-pov_side-Prompt-Härtung) in ihrer ursprünglichen Form gegenstandslos; eigene Wiki-Hygiene-Session steht aus (CC-Direct-Curation als ADR + Pipeline-State-Update). Discovery-Stage ist seit 057 nicht mehr der Default-Eingang: die Maintainer-kuratierte Excel-SSOT ist die Roster-Quelle. ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).

Sequenz seit 057: 058 baute den SSOT-Modus + ersten 10er-Batch; 060 schrieb `ssot-w40k-001` in die DB; 061 lief als Standing-Loop bis `ssot-w40k-005` (50 Bücher); 062 fixte den Author-FK-Pfad; 063–069 brachten den Resolver-Layer für die ersten 50 Bücher; 070 schloss die Faction-Policy-/Hierarchie-Hygiene; 072 hat den Resolver-Pass 2 für die zweiten 50 Bücher abgeschlossen (`heretic_astartes`-Mid-Knoten, Aeldari-/Drukhari-Aliase, Cross-Batch-`applyCollections`-Refactor); 073 hat das Maintainer-Audit-Cockpit gelandet (`/buch/[slug]/audit` + `/buecher` Audit-Pillen); **PR #54 (`4993e17`, 2026-05-15) hat den ersten produktiven Loop-Driver-Run gemerged: 5 Iterationen (`ssot-w40k-011..015`), 50 frische Bücher auf `main`**, kumulativ 150 W40K-Bücher applied. Status-Log endet mit `⏸ Resolver-Pause bei 150 Büchern`. Brief 074 (Resolver-Pass 3) ist offen und der nächste Schritt.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

Das Buch-Domain-Bild ist jetzt im SSOT-Authority-Modus: **150 W40K-Bücher** (`ssot-w40k-001..015`) liegen als `works`/`book_details` in Postgres. Junction-Counts global stehen weiterhin auf dem post-072-Stand `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35` — die 50 frischen Bücher aus `011..015` sind **NICHT** mit dem aktuellen Resolver-Set gegen die Junctions geapplied; Brief 074 schließt das (`db:apply-override` für 001..015 nach Surface-Form-Crystallization). Cross-Batch-Collections sind seit 072 echte `work_collections`-Rows (Baseline 17 → Refactor 35); Brief 074 reportet den globalen Status, aber Green Tide ist wegen fehlender `roster.collections`-Rows kein erfüllbarer Stresstest und wird als Roster-Patch-Handoff dokumentiert. Der **Excel-SSOT-Roster** mit 859 Büchern + 191 Collections liegt deterministisch unter `scripts/seed-data/book-roster.json`; nächster operativer Schritt ist Brief 074 (Resolver-Pass 3), bevor der Loop für `ssot-w40k-016` wieder anläuft.

## Branch

`main` post-PR #54 (`4993e17`) ist das Eingangs-Tor für Brief 074. Cowork-Worktree hat während der 074-Brief-Session den abgeschnittenen `tmp/loop-driver-smoke-001`-Block aus `.git/config` lokal entfernt (Sandbox-Cleanup, nicht im Brief-Diff). Brief 074 läuft auf eigenem Branch (`session-074-resolver-batch-3`); kein Re-Mix mit `session-071-loop-driver`. Disziplin-Punkt aus 072 bleibt gültig: vor Brief-Commit `brain:lint -- --no-write` lokal laufen.

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` + `brain:lint --no-write` Jobs on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local` zeigt heute auf prod (kein Test-Branch). Migrations durch `0009_lucky_pete_wisdom.sql` sind applied: 0008 brachte SSOT-Schema/`work_collections`, 0009 machte `locations.gx/gy` nullable und fügte `raw_name` auf `work_factions`, `work_locations`, `work_characters` hinzu. Reference-Seeds post-072: `factions=106` Rows (52 Pre-070 + 54 aus Brief 072), `locations=113`, `characters=103`. Junction-Counts post-Re-Apply `001..010`: `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35` (Cross-Batch nach 072-Refactor).
- **Excel-SSOT-Roster.** `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt) + Loader `scripts/import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json` (859 RosterBooks + 191 RosterCollections). Die Pipeline konsumiert den Roster seit 058; `ssot-w40k-001..010` sind applied (100 Bücher); Brief 061 ist auf 100er-Pause, der Loop wird nach dem Cockpit-Brief mit `ssot-w40k-011` wieder angeschoben (per Pre-Check würde 011 sonst loud-stoppen weil 100 % 50 == 0).
- **Pipeline V1 in dry-run** (Default ohne `--pipeline=` Flag, bleibt für Reproduzierbarkeit alter Diffs). `npm run ingest:backfill -- --limit N --offset M`. Latest V1 committed: `ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, post-047 hardening, archived in 056).
- **Pipeline V2 / SSOT Authority path.** `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-00N` erzeugt die Diff-/Override-Basis; `scripts/apply-override.ts` schreibt curated overrides in die DB. Resolver-Support liegt in `src/lib/resolver/`, `scripts/seed-data/{faction,location,character}-aliases.json`, `scripts/seed-data/characters.json`, `scripts/test-resolver*.ts` und `docs/resolver-apply-runbook.md`.
- **Atlas-Regen-Skript.** `npm run atlas:regen` writes a Postgres-mirror Obsidian vault to `~/chrono-atlas/` (Windows `C:\Users\Phil\chrono-atlas\`; override via `--out=<path>` or `ATLAS_PATH` env). 049-impl produced first proof-of-render (1 book + 1 faction + INDEX.md, DB-counts 26/29 verified). Manual trigger only; see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint.** `npm run brain:lint` (11 Check-Kategorien post-070) + CI-Gate `brain:lint -- --no-write` post-053. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`. Neue Kategorie „Faction policy" (070): warn auf parent-null Faction-Rows ohne Browse-Root-Status, error auf dangling `parent`-FK.
- **Faction-Policy.** [`./decisions/faction-policy.md`](./decisions/faction-policy.md) trennt Browse-Root (UI-Filter-Ebene) von Tree-Root; Browse-Root-Whitelist + `knownTopLevelExceptions` + `specialCases` leben in `scripts/seed-data/faction-policy.json`. Schema unverändert; `factions.parent_id` weiter Single-Parent. `seed-resolver-extensions` faction-Insert ist seit 070 ein Upsert auf JSON-Spalten, damit der Pre-Apply Parent-Hygiene-Check (Runbook) Reparents in prod-DB schieben kann.

## Latest pipeline state (post-072, second resolver wave applied)

Brief 055 hat den ersten V2-Voll-Lauf über 50 Bücher geliefert (`v2-batch-20260510-1109.diff.json`, slug-window `13th-legion → ascension`, 1.06 web_search/Buch, 4-of-5 Validator-Kinds non-zero). Brief 056 hat die drei strukturellen Schwächen aus dem Voll-Lauf isoliert behoben: per-page Lexicanum-Cache, per-book Diff-Checkpointing, Cost-Recompute auf Cache-Hits, plus Diff-Archivierung.

Brief 057 hat den **Excel-SSOT-Pivot vollzogen** (siehe [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)): Maintainer-Excel liegt unter `scripts/seed-data/source/`; Loader `import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json`. Brief 058 hat den V2-SSOT-Modus gebaut; 060/061 haben die ersten fünf W40K-10er-Batches in den Authority-Layer gebracht.

**CC-Erweiterungen in 057-impl ggü. Brief-Acceptance** (Cowork akzeptiert): RosterBook-Schema trägt zusätzlich `editors: string[]` + `editorialNote: "various" | null` (Konsequenz aus den zwei OQ-Antworten "Various Authors" + "(ed.)"-Trailing). `external_book_id` ist `UNIQUE` ohne separaten Index (B-Tree-Backing reicht). `work_collections`-Junction trägt nur einen Sekundär-Index auf `content_work_id` (composite-PK deckt `collection_work_id` als Leading-Column ab; Maintainer kann via 0009-Mini-Migration nachreichen falls gewünscht). Year-Validierung pragmatisch: `null` → warn (1 Treffer: W40K-0307 "War for Armageddon Omnibus"), non-numeric → loud-Error.

Brief 063–069 haben die Resolver-Schicht für die ersten 50 Bücher geschlossen: 0009 applied, resolver reference data seeded, `apply-override` schreibt `work_characters`, normalisiert Rollen und bewahrt Surface-Forms in `raw_name`. 069-Counts nach Apply: `work_factions=318`, `work_locations=129`, `work_characters=363`.

Brief 072 hat die zweite Resolver-Welle für `ssot-w40k-006..010` geschlossen: 54 neue Factions inkl. `heretic_astartes`-Mid-Knoten (parent=`chaos`) + Reparent von 7 Heresy-Traitor-Legionen + optional Alpha Legion auf den Mid-Knoten, Death-Guard / Emperor's-Children-Lücke gefüllt, 45 neue Locations + `great_rift` in-place mit `era_frame`-Tag, 38 neue Characters (16 freq≥2 + 22 lore-iconic), Aeldari-/Drukhari-Aliase, `apply-override.applyCollections` löst Cross-Batch via `works.external_book_id`. Post-Re-Apply `001..010`: `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35` (Baseline same-batch 17 → Refactor 35); Coverage `factions=650/657`, `locations=239/258`, `characters=475/552`; Smoke `the-anarch=9/3/11`, `calgars-fury=7/3/1`, `the-emperors-gift=8/2/1`, `storm-of-iron=6/1/6`, `celestine=5/1/1`, `spear-of-the-emperor=8/3/2`. Pre-Apply-Counts und per-Batch-Counts wurden im Report nicht enumeriert (Disziplin-Note für nächstes Mal). Character-Junction-Wachstum +112 für 50 Bücher (vs. +363 in erster Welle) — Long-Tail-Surface-Forms, primärer Cockpit-Triage-Datenpunkt.

V2-Pilot (54), V2-Voll-Lauf (55), V2-Pre-Roster-Fixes (56), SSOT-Pivot (57/58), Resolver-Layer (063–069) und Resolver-Pass 2 (072) sind in [`./pipeline-state.md`](./pipeline-state.md) detailliert.

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

Top items from [`./open-questions.md`](./open-questions.md), neu sortiert post-074-arch:

- **Brief 074 (Resolver-Pass 3, `ssot-w40k-011..015`).** Liegt offen. Erweitert die drei Reference-Tables + Aliase im 072-Stil; Watson-Trilogy als distinct historical-canon-layer (Squats / Hydra-Cabal / pre-modern Surface-Forms); `work_collections`-Status-Pass mit Green Tide als bekanntem Roster-Lücken-Fall; Re-Apply 001..015 mit Pre-/Per-Batch-/Post-Counts-Tabelle.
- **Loop fortsetzen.** Brief 061 ist standing, paused bei 150. Nach Brief 074 (Resolver-Apply) für `ssot-w40k-016` re-trigger per Loop-Driver. Skip-Marker / "lets go" wie bisher.
- **Wiki-/ADR-Update zur CC-Direct-Curation.** Eigene Cowork-Hygiene-Session: V2-LLM-Stage in `pipeline-state.md` als "ausgemustert" markieren, ADR `decisions/why-cc-direct-curation.md` schreiben (Trade-Off vs. V2-Pipeline: Maintainer-Kontrolle, kein Token-Budget, Trade-Off zu Reproduzierbarkeit). OQ1 / OQ2-(c) im `open-questions.md` als "moot post-Pipeline-Shift" markieren.
- **Hand-Check-Workflow + Override-Schema** (OQ3). Cockpit ist seit Brief 073 verfügbar; Schema-Beschreibung steht noch aus. Brief 074 wird Cockpit erstmals mit echtem Drift-Material füttern — Quality-Feedback aus 074-impl ist Input für OQ3.
- **Hardcover-Rating-Promotion + OL-Fallback** (OQ6). Architectural call zu Field-Schema + OL-Fallback ja/nein; Implementation ~10–20 LOC.
- **DetailPanel "Auch enthalten in:"-Mini-Brief.** Backend nach 072-Cross-Batch-Refactor vollständig (35 `work_collections`-Rows, davon einige content-seitig cross-batch); Brief 074 prüft nur den globalen Status und hält Green Tide als Roster-Lücke fest. Frontend-Query ist UI-Session — wahrscheinlich Teil eines Cockpit-Detail-View-Refinements.
- **`scripts/run-ssot-loop.sh`-Refinements** (post-071-impl). per-iter timeout, shellcheck-Lokal-Setup, workflow-page `brain/wiki/workflows/ssot-loop-driver.md`. Nicht load-bearing, nach 2-3 produktiven Driver-Läufen.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-15 | 074-arch | open | Resolver-Pass 3 — Surface-Form-Crystallization für `ssot-w40k-011..015`. Brief geschrieben, eigener Branch, Watson-Trilogy historical-canon-layer-Entscheidung dokumentiert, Green-Tide-Roster-Lücke als `work_collections`-Handoff festgehalten. CC-Job offen. |
| 2026-05-15 | 071-impl + PR #54 | complete + merged | Loop-Driver-Script `scripts/run-ssot-loop.sh` plus erster produktiver `N=5`-Run: 5 Iterationen, 50 neue Bücher (`ssot-w40k-011..015`), Loop-Log gewachsen, ⏸-Pause bei kumulativ 150. Override-Files auf `main`, Junction-Apply offen für Brief 074. |
| 2026-05-14 | 073-impl | complete | Maintainer-Audit-Cockpit. `/buch/[slug]/audit` Server-Component mit allen DB-Feldern (`raw_name`, `confidence`, `sourceKind`, `work_collections.basis`, `external_links`, `notes`); `/buch/[slug]` slim-down auf Public-Lean; `/buecher` Audit-Modus mit vier Pillen (`drift`/`gap`/`ssot`/`collections`, AND, URL-State); Default-Sort `updatedAt desc`. Catalog-Filter in-memory (acceptable bis 500 Bücher). `src/lib/book-labels.ts` für konsistente Labels. |
| 2026-05-14 | 072-impl | complete | Resolver-Pass 2 für `ssot-w40k-006..010`. +54 Factions inkl. `heretic_astartes`-Mid-Knoten + Alpha-Legion-Reparent + Death-Guard / Emperor's-Children-Lücken-Fix; +45 Locations + `great_rift` in-place mit `era_frame`; +38 Characters (16 freq≥2 + 22 lore-iconic); Aeldari-/Drukhari-/Khârn-/Czevak-Aliase; `apply-override.applyCollections` löst Cross-Batch via `works.external_book_id`; Re-Apply `001..010` mit Post-Counts `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`. Smoke-Slugs grün. Brain-Lint-Fix an `index.md` + `why-sonnet-not-haiku.md` durch CC dokumentiert. |
| 2026-05-13 | 070-impl | complete | Faction-Policy & Hierarchie-Hygiene — Browse-Root vs. Tree-Root als Konzept getrennt, `brain/wiki/decisions/faction-policy.md` + `scripts/seed-data/faction-policy.json` (16 Browse-Roots), `factions.json` audit-patched (Chaos-Rename + 14 Reparents), `seed-resolver-extensions` faction-Insert auf Upsert, Pre-Apply Parent-Hygiene-Check ins Runbook, `brain:lint` neue Kategorie. Junctions unverändert. |
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

Sequenz post-074-arch (2026-05-15):

- **Brief 074 (Resolver-Pass 3) liegt offen.** Schließt die Junctions für `ssot-w40k-011..015`. CC-Job offen.
- **Wiki-Hygiene-Session: CC-Direct-Curation als ADR + Pipeline-State-Update.** V2-LLM-Stage als "ausgemustert" markieren; OQ1 / OQ2-(c) explizit als "moot post-Pipeline-Shift" schließen. Cowork's Job, nicht CC's.
- **Loop-Re-Trigger für `ssot-w40k-016`.** Standing-Brief 061 via Loop-Driver (Brief 071, implemented + produktiv getestet). Skip-Marker / „lets go" durch Maintainer nach Brief 074 Resolver-Apply.
- **Cockpit-Detail-View-Refinement.** Quality-Feedback aus 074-impl füttert ggf. ein kleines Folge-Brief: SQL-Aggregate für Audit-Filter (post-500-Bücher), `confidence < 0.7`-Filter wenn Sonnet-Pipeline reaktiviert wird (unwahrscheinlich), DetailPanel "Auch enthalten in:" als Mini-Brief.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed.
