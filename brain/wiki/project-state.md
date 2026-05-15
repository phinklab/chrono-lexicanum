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
  - ../../sessions/2026-05-15-074-arch-resolver-batch-3.md
  - ../../sessions/2026-05-15-074-impl-resolver-batch-3.md
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

**Phase 3 — Bulk-Backfill-Pipeline (in flight, SSOT-Authority-Layer aktiv, dritte 50er-Welle gemerged + applied, Resolver-Pass 3 geschlossen).** Der TypeScript-Ingestion-Stack bleibt im Repo bestehen, aber die V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) ist seit dem Brief-061-Standing-Loop **de-facto ausgemustert** — eine `claude -p`-Subsession (Default-Modell, momentan Opus) produziert die Override-Datei direkt. ADR dazu: [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md) (geschrieben 2026-05-15 in der Post-074-Wiki-Hygiene-Session). Konsequenz: OQ1 (Sonnet-vs-Haiku) und OQ2-(c) (`chaos`-pov_side-Prompt-Härtung) sind in ihrer ursprünglichen Pipeline-Form moot, beide in [`./deferred-questions.md`](./deferred-questions.md) geparkt mit Promote-Triggern. Discovery-Stage ist seit 057 nicht mehr der Default-Eingang: die Maintainer-kuratierte Excel-SSOT ist die Roster-Quelle. ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md).

Sequenz seit 057: 058 baute den SSOT-Modus + ersten 10er-Batch; 060 schrieb `ssot-w40k-001` in die DB; 061 lief als Standing-Loop bis `ssot-w40k-005` (50 Bücher); 062 fixte den Author-FK-Pfad; 063–069 brachten den Resolver-Layer für die ersten 50 Bücher; 070 schloss die Faction-Policy-/Hierarchie-Hygiene; 072 hat den Resolver-Pass 2 für die zweiten 50 Bücher abgeschlossen (`heretic_astartes`-Mid-Knoten, Aeldari-/Drukhari-Aliase, Cross-Batch-`applyCollections`-Refactor); 073 hat das Maintainer-Audit-Cockpit gelandet (`/buch/[slug]/audit` + `/buecher` Audit-Pillen); PR #54 (`4993e17`, 2026-05-15) hat den ersten produktiven Loop-Driver-Run gemerged (5 Iterationen `ssot-w40k-011..015`, 50 Override-Files auf `main`). **PR #57 (`6ac4295`, 2026-05-15) hat Brief 074 geschlossen: Resolver-Pass 3 für `ssot-w40k-011..015`, Watson-Trilogy als distinct historical-canon-layer, Green-Tide-`collection-gaps.json`-Ledger, 15× `db:apply-override` (gleichzeitig Drift-Cleanup für 001..010 und First-Apply für 011..015 — Loop-Driver hatte die 011..015-Override-Files nur committed, nicht in DB geschrieben). Kumulativ 150 W40K-Bücher als `works`/`book_details`/Junctions in Postgres applied.** Status-Log steht weiter auf `⏸ Resolver-Pause bei 150 Büchern`; Loop-Re-Trigger für `ssot-w40k-016` wartet auf Maintainer-Skip-Marker.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

Das Buch-Domain-Bild ist jetzt im SSOT-Authority-Modus: **150 W40K-Bücher** (`ssot-w40k-001..015`) liegen als `works`/`book_details`/Junctions in Postgres. Junction-Counts global post-074-impl: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35` (Δ +262 / +48 / +47 / +0 ggü. post-072). Coverage (direct match): `factions=912/1003 input = 90.9 %`, `locations=287/342 = 83.9 %`, `characters=522/677 = 77.1 %`; der Rest sind erwartete freq=1-Surface-Forms im Long-Tail. Cross-Batch-Collections bleiben bei 35 — Green Tide (`W40K-0147`) hat im Roster keine `collections`-Rows mit sich als parent, deshalb liegt der Hinweis nicht als partielle `work_collections`-Kante in der DB, sondern als persistentes Ledger unter [`scripts/seed-data/collection-gaps.json`](../../scripts/seed-data/collection-gaps.json) (Status `needs_constituent_roster_entries`, 4 bekannte existierende Constituents + 4 fehlende Short-Stories). Der **Excel-SSOT-Roster** mit 859 Büchern + 191 Collections liegt deterministisch unter [`scripts/seed-data/book-roster.json`](../../scripts/seed-data/book-roster.json); nächster operativer Schritt ist Loop-Re-Trigger für `ssot-w40k-016` mit explizitem `skip-50-stop`-Marker (oder vorher Cockpit-Refinement / OQ6 Hardcover-Rating-Promotion — Maintainer-Wahl).

## Branch

`main` post-PR #57 (`6ac4295`, 2026-05-15) ist der aktuelle Stand: Resolver-Pass 3 ist drauf, 150 W40K-Bücher applied. Cowork-Worktree liegt aus 074-Brief-Zeit auf `codex/session-074-resolver-batch-3-impl` mit lokal-stalen Datei-Markierungen; das ist nur Worktree-Lärm, `origin/main` enthält bereits den Squash-Merge. Disziplin-Punkt aus 072 bleibt gültig: vor jedem Brief-/Wiki-Commit `brain:lint -- --no-write` lokal grün ziehen.

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` + `brain:lint --no-write` Jobs on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local` zeigt heute auf prod (kein Test-Branch). Migrations durch `0009_lucky_pete_wisdom.sql` sind applied: 0008 brachte SSOT-Schema/`work_collections`, 0009 machte `locations.gx/gy` nullable und fügte `raw_name` auf `work_factions`, `work_locations`, `work_characters` hinzu. Reference-Seeds post-074: `factions=126` Rows (52 Pre-070 + 54 aus 072 + 20 aus 074), `locations=132` (113 Pre-074 + 19), `characters=129` (103 Pre-074 + 26). Junction-Counts post-Re-Apply `001..015`: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. `persons.json` gewachsen auf 31 Author-Personen (Loop-Auto-Creates aus 011..015 per Brief-061-Konvention).
- **Excel-SSOT-Roster.** `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern gepflegt) + Loader `scripts/import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json` (859 RosterBooks + 191 RosterCollections). Die Pipeline konsumiert den Roster seit 058; `ssot-w40k-001..010` sind applied (100 Bücher); Brief 061 ist auf 100er-Pause, der Loop wird nach dem Cockpit-Brief mit `ssot-w40k-011` wieder angeschoben (per Pre-Check würde 011 sonst loud-stoppen weil 100 % 50 == 0).
- **Pipeline V1 in dry-run** (Default ohne `--pipeline=` Flag, bleibt für Reproduzierbarkeit alter Diffs). `npm run ingest:backfill -- --limit N --offset M`. Latest V1 committed: `ingest/.archive/v1/backfill-20260508-2101.diff.json` (9 books, post-047 hardening, archived in 056).
- **Pipeline V2 / SSOT Authority path.** `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-00N` erzeugt die Diff-/Override-Basis; `scripts/apply-override.ts` schreibt curated overrides in die DB. Resolver-Support liegt in `src/lib/resolver/`, `scripts/seed-data/{faction,location,character}-aliases.json`, `scripts/seed-data/characters.json`, `scripts/test-resolver*.ts` und `docs/resolver-apply-runbook.md`.
- **Atlas-Regen-Skript.** `npm run atlas:regen` writes a Postgres-mirror Obsidian vault to `~/chrono-atlas/` (Windows `C:\Users\Phil\chrono-atlas\`; override via `--out=<path>` or `ATLAS_PATH` env). 049-impl produced first proof-of-render (1 book + 1 faction + INDEX.md, DB-counts 26/29 verified). Manual trigger only; see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint.** `npm run brain:lint` (11 Check-Kategorien post-070) + CI-Gate `brain:lint -- --no-write` post-053. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`. Neue Kategorie „Faction policy" (070): warn auf parent-null Faction-Rows ohne Browse-Root-Status, error auf dangling `parent`-FK.
- **Faction-Policy.** [`./decisions/faction-policy.md`](./decisions/faction-policy.md) trennt Browse-Root (UI-Filter-Ebene) von Tree-Root; Browse-Root-Whitelist + `knownTopLevelExceptions` + `specialCases` leben in `scripts/seed-data/faction-policy.json`. Schema unverändert; `factions.parent_id` weiter Single-Parent. `seed-resolver-extensions` faction-Insert ist seit 070 ein Upsert auf JSON-Spalten, damit der Pre-Apply Parent-Hygiene-Check (Runbook) Reparents in prod-DB schieben kann.

## Latest pipeline state (post-074, third resolver wave applied)

Brief 074 (PR #57, `6ac4295`) hat die dritte Resolver-Welle für `ssot-w40k-011..015` geschlossen: 20 neue Factions (Hydra-Cabal als Watson-Trilogy-historical-canon-Knoten unter `inquisition`, Squats-`tone`-Update auf `historical_canon_layer` via Upsert, Sororitas-Order-Sub-Factions, Astartes-Loyalist-Sub-Factions, Aeldari-/Necron-/Navis-Sub-Factions, Goffs, Aeronautica Imperialis), 19 neue Locations (Imperium-Nihilus-Frames mit `era_frame`, Necron-Tomb-Worlds, Watson-Welten mit `historical_canon_layer`-Tag, Named-Vehicles), 26 neue Characters (Belisarius Cawl als 074-Cross-Batch-Anchor + Hadeya Etsul + Aeronautica-Cross-Batch + Watson-Retinue Jaq Draco/Meh'Lindi/Vitali Googol/Grimm mit `historical_canon_layer`-Marker in `notes` + lore-iconic-Singletons). Aliases erweitert (Space Sharks, Dark City, Cawl-Multispelling, Imperium, Chaos Space Marines, …). `triarch_praetorians` alignment=`xenos` (lore-konsistent statt initialer `neutral`-Tendenz). 13 unbekannte facetIds aus 015-Override gestrippt (LLM-Typos der Loop-Subsession gegen veralteten Catalog-Snapshot: `interplanetary`/`freedom`/`discovery`/`duty`/`early_release`). Green Tide (`W40K-0147`) bleibt voll im Resolver-Scope, kein partieller `work_collections`-Eintrag — neuer `scripts/seed-data/collection-gaps.json`-Ledger hält die 4 existierenden + 4 fehlenden Short-Story-Constituents fest.

Brief-Erst-Annahme-Korrektur in 074-impl: Brief 074-arch hatte "150 W40K-Bücher in DB applied" als Pre-State angenommen — Reality vor Apply waren 100, weil der Loop-Driver-PR #54 die 011..015-Override-Files nur committed und nicht via `db:apply-override` in die DB geschrieben hatte. CC hat das gefangen, der 15× Re-Apply war daher gleichzeitig Drift-Cleanup für 001..010 (`work_factions` 650→651, `work_characters` 475→476 nach Review-Follow-up) und First-Apply für 011..015. Wirkung neutral; Wahrheit ist im Post-074-Zustand kodifiziert.

Counts post-Re-Apply `001..015`: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. Per-Batch-Zwischenstände lückenlos im 074-impl-Report dokumentiert (Disziplin-Lesson aus 072 eingehalten). Coverage `factions=912/1003 = 90.9 %`, `locations=287/342 = 83.9 %`, `characters=522/677 = 77.1 %` direkte Matches; Rest erwartete freq=1-Surface-Forms. Watson-Trilogy junction-spot-check: 49 Rows über `inquisitor-draco`/`harlequin`/`chaos-child`, alle 4 Retinue-Characters × 3 Bücher direkt resolved. Smoke-Slugs (`f/l/c/in-coll`): `honourbound=5/1/1`, `the-infinite-and-the-divine=4/2/2`, `brutal-kunnin=4/1/1`, `krieg=5/1/0`, `archmagos=3/0/1`, `inquisitor-draco=11/0/4`, `voidscarred=4/0/0`, `the-green-tide=6/1/0/0` (collection-side null wie erwartet).

Audit-Cockpit-Tour (SQL-Replica der vier Pillen): post-Apply `0001..0100` hat `drift=72`, `gap=29`, `ssot=100`, `collections=8`, `drift_and_gap=21`; post-Apply `0101..0150` hat `drift=34` (Imperium / Chaos Space Marines bewusst aufgelöst → als raw_name-vs-canonical-Drift sichtbar), `gap=31`, `ssot=50`, `collections=0`, `drift_and_gap=22`. Cockpit-Quality-Feedback aus 074-impl: Drift-Pille braucht freq-/confidence-Sort innerhalb der Liste, damit Maintainer-Triage die freq≥2-Drifts zuerst sieht — heute muss man pro Buch in `/buch/<slug>/audit` einsteigen, um die rohen Surface-Forms zu sehen.

Hand-off zur künftigen Vokabular-Hygiene-Session aus 074-impl: 9 `value_outside_vocabulary`-Tag-Kandidaten aus Loop-Log (`commissar` / `inquisitor` / `squat` / `corsair` / `triarch_praetorian` / `valkyrie_pilot` / `webway_journey` / `omnibus_with_prior_constituents` / `cabal_inquisition` / `rogue_inquisition` / `cw_canon_divergence`) + 5 Catalog-LLM-Typos (siehe oben) + 5 freq=1-Sororitas-Sub-Orders aus *Triumph of Saint Katherine* + 5 `data_conflict`-Author-Missing-Flags (W40K-0141/0142/0143/0146/0147 → Excel-Maintainer-Workflow).

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

Top items from [`./open-questions.md`](./open-questions.md), neu sortiert post-074-impl + Wiki-Hygiene-Pass (2026-05-15):

- **Loop-Re-Trigger für `ssot-w40k-016`.** Standing-Brief 061 paused bei 150 Büchern; Loop-Driver `scripts/run-ssot-loop.sh` ist produktiv getestet (PR #54). Maintainer-Skip-Marker / "lets go" im Eröffnungs-Prompt aktiviert die nächste Iteration; nächste natürliche Resolver-Pause bei 200 Büchern.
- **Cockpit-Detail-View-Refinement** (Quality-Feedback aus 074-impl). Drift-Pille braucht freq-/confidence-Sort innerhalb der gefilterten Liste; ggf. Sub-Sub-Faction-Surface-Forms als eigene UI-Komponente. Kleiner UI/Backend-Brief.
- **Hand-Check-Workflow + Override-Schema** (OQ3). Cockpit ist seit Brief 073 verfügbar; Schema-Beschreibung steht noch aus. 074-impl hat erstmals echtes Drift-Material gefüttert — Quality-Feedback bestätigt OQ3-Bedarf (Override-Field-Schema + Triage-Disziplin).
- **Hardcover-Rating-Promotion + OL-Fallback** (OQ6). Architectural call zu Field-Schema + OL-Fallback ja/nein; Implementation ~10–20 LOC.
- **DetailPanel "Auch enthalten in:"-Mini-Brief.** Backend nach 072-Cross-Batch-Refactor vollständig (35 `work_collections`-Rows, davon einige content-seitig cross-batch). Frontend-Query ist UI-Session — kann mit dem Cockpit-Refinement gebündelt werden.
- **Collection-Gap-Resolve-Pass für Green Tide.** Wenn der Maintainer-Excel-Workflow die 4 Short-Story-Constituents (`Where Dere's Da Warp Dere's a Way` / `Painboyz` / `Mad Dok` / `The Enemy of My Enemy`) als eigene Roster-Works modelliert, kann ein Folge-Brief das Ledger schließen: `roster.collections`-Rows ergänzen, Re-Apply, `collection-gaps.json` ggf. als historisches Audit erhalten oder löschen. Trigger: Excel-Update durch Maintainer.
- **`scripts/run-ssot-loop.sh`-Refinements** (post-071-impl). per-iter timeout, shellcheck-Lokal-Setup, workflow-page `brain/wiki/workflows/ssot-loop-driver.md`. Nicht load-bearing, nach 2–3 produktiven Driver-Läufen.
- **Vokabular-Hygiene-Session.** 074-impl hat den Hand-off-Stack vergrößert: 9 Loop-Log-Tag-Kandidaten + 5 Catalog-LLM-Typos. Cockpit-Triage statt einmaliger Architektur-Brief (Maintainer-Punkt 2026-05-13), aber wenn der Stack zu zehn+ Cases anwächst lohnt sich ein gebündelter Mini-Brief.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-15 | Wiki-Hygiene-Pass | complete | Post-074-impl Brain-Update + ADR `decisions/why-cc-direct-curation.md` geschrieben (V2-LLM-Stage als de-facto ausgemustert kodifiziert, OQ1 + OQ2-(c) als moot-post-Pipeline-Shift geschlossen). `project-state.md` / `pipeline-state.md` / `open-questions.md` / `index.md` / `log.md` auf post-074-Stand gebracht; `deferred-questions.md` um OQ2-(c)-Eintrag ergänzt. Keine Code-Änderungen, kein CC-Brief. |
| 2026-05-15 | 074-impl + PR #57 | complete + merged (`6ac4295`) | Resolver-Pass 3 für `ssot-w40k-011..015`. +20 Factions (Hydra-Cabal-Watson-Knoten + Squats-`tone`-Update + Sororitas-Orders + Astartes-Loyalist-Sub-Factions + Aeldari/Necron/Navis + Goffs + Aeronautica Imperialis); +19 Locations (Imperium-Nihilus-Frames + Necron-Tomb-Worlds + Watson-Welten + Named-Vehicles); +26 Characters (Cawl + Hadeya Etsul + Aeronautica-Cross-Batch + Watson-Retinue mit `historical_canon_layer`-Marker). 17 neue Faction-Aliases, 4 Location-Aliases, 17 Character-Aliases. Green Tide bleibt Buch-Scope, neuer `scripts/seed-data/collection-gaps.json`-Ledger. 13 unbekannte facetIds aus 015-Override gestrippt (LLM-Catalog-Typos). Re-Apply `001..015` mit lückenloser Pre-/Per-Batch-/Post-Counts-Tabelle: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. Watson-Trilogy junction-spot-check: 49 Rows sauber. test-resolver 78 passed (war 51). Cockpit-Tour als SQL-Replica. |
| 2026-05-15 | 074-arch | implemented | Brief Resolver-Pass 3 mit Codex-Review-Erratum (Schema-Tatsachen Squats-`tone`-vs-`tags`, Squats existieren bereits, Cawl-Status-Check, Green-Tide-Roster-Lücke) + Green-Tide-Collection-Gap-Addendum (Buch-Scope + `collection-gaps.json`-Ledger statt partieller Kanten). Implementiert durch 074-impl. |
| 2026-05-15 | 071-impl + PR #54 | complete + merged (`4993e17`) | Loop-Driver-Script `scripts/run-ssot-loop.sh` plus erster produktiver `N=5`-Run: 5 Iterationen, 50 neue Bücher (`ssot-w40k-011..015`), Loop-Log gewachsen, ⏸-Pause bei kumulativ 150. Override-Files auf `main` committed, in DB applied erst durch 074-impl. |
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

Sequenz post-074-impl + Wiki-Hygiene-Pass (2026-05-15). Maintainer-Wahl zwischen drei realistischen nächsten Schritten:

- **Loop-Re-Trigger für `ssot-w40k-016`.** Operativer Mini-Schritt: `claude -p`-Subsession mit explizitem `skip-50-stop`-Marker im Eröffnungs-Prompt (oder via `scripts/run-ssot-loop.sh` mit Skip-Flag). Bringt 10–50 weitere Bücher in Override-Files; nächste natürliche Resolver-Pause bei kumulativ 200 Büchern. Kein eigener Architektur-Brief notwendig — Brief 061 (standing) + Loop-Driver-Skript reichen.
- **Cockpit-Detail-View-Refinement.** Kleiner Brief: freq-/confidence-Sort innerhalb der Drift-Pille auf `/buecher` (Quality-Feedback-Punkt aus 074-impl) plus optional DetailPanel "Auch enthalten in:" als Cross-Batch-Collection-Surface auf der Public-Detail-Seite. Touch auf `src/app/buecher/*` + ggf. neuer SQL-Aggregate-Helper.
- **OQ6 Hardcover-Rating-Promotion + OL-Fallback.** Architectural Brief: `rating: FieldRecord<number>` auf `BookV2Record` promoten (Hardcover hat den Wert schon in `claim.raw.audit.averageRating`), Open-Library-Fallback ja/nein, retroaktive Promote-Pass-Strategie. ~10–20 LOC Impl; Voraussetzung für DetailPanel-Rating-Display.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed. Diese Wiki-Hygiene-Session 2026-05-15 ist genau ein solcher Lauf, ausgelöst durch 074-impl + die seit Brief 061 stehende offene Pipeline-Shift-Dokumentations-Schuld.
