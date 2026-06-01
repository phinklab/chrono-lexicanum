---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-06-01
links:
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./decisions/why-cc-direct-curation.md
  - ./decisions/cross-era-identities.md
confidence: high
---

# Project state — 2026-06-01 (Korpus datenkomplett, post-Brief 104/105/107)

> The "where are we now" anchor. Cowork und Claude Code starten jede Session hier (nach `brain/CLAUDE.md` + `wiki/index.md`).
>
> **Nur aktueller Stand. Historie → [`log.md`](./log.md) + git.** Die früheren 12 „Latest pipeline state"-Snapshots, die Session-Level-„Recently shipped"-Liste und der Frontmatter-Changelog wurden 2026-06-01 ausgelagert (Token-Diet-Session: dieses File war auf ~58k Token gewachsen). Dieses File trägt ab jetzt nur den aktuellen Stand — wer einen historischen Snapshot braucht, liest `log.md` oder `git log`.

## Phase

**Phase 3 — Bulk-Backfill-Pipeline: substanziell erledigt.** Der Korpus ist datenkomplett *und* konsolidiert: **859/859 Bücher** (565 W40K + 294 HH) liegen als `works`/`book_details`/Junctions in Postgres (post-PR-107, 2026-05-27). Zwei Konsolidierungs-Pässe gefahren (Pass 1 W40K, Pass 2 Full-Corpus) — Brief-094-§-Cadence-Bogen geschlossen; künftige Konsolidierungs-Pässe sind ad-hoc. Phasen 1 (foundation), 1.1/1.5 (stack/hygiene), 2 (Chronicle/Timeline) und 3a–3c (Pipeline-Skeleton + Aux-Sources + LLM-Enrichment) sind shipped. **Phase 4 (Discovery-Layer) + Phase 5 (Cartographer + Ask the Archive)** folgen. Voller Phasenplan: [`roadmap.md`](./roadmap.md). Ein formaler Phase-3-Seal-Brief steht aus (§ Next likely brief).

Live-Pfad der Pipeline heute: **Excel-SSOT-Roster → `claude -p`-Loop (CC + WebSearch) → `apply-override.ts` → DB.** Die V1-Crawl-Discovery und die V2-LLM-Enrichment-Stage sind beide ersetzt (ADRs [`why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md) + [`why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md)); der bypassed-aber-nicht-retired Code ist OQ (13). V2-Pilot-Architektur-Detail (5 Validatoren, Slim-LLM, Provenance pro Feld) liegt in [`pipeline-state.md`](./pipeline-state.md).

## Branch & Worktrees

`origin/main` ist **read-only für Code** — jede Code-/Daten-/Config-Änderung läuft über Task-Branch + PR; **Doc-only-Änderungen landen direkt auf `main`** (PR-Policy 2026-05-25, `CLAUDE.md` § Git). Drei produktive Worktrees: Coordination (`C:\Users\Phil\chrono-lexicanum`, `main`), Product/UI (`chrono-lexicanum-product`), Batches/Ingestion (`chrono-lexicanum-batches`); Altlast `chrono-batches-011-015` bewusst unangetastet (Brief 082). **Brief 095 Rollup-Ownership ist scharf:** `sessions/README.md` + `brain/**` werden ausschließlich aus dem Coordination-Worktree geschrieben.

**Git-Sandbox-Regel:** Cowork fasst `git` nie in der Sandbox an (9P/drvfs korrumpiert git-Metadaten) — editiert nur Working-Tree-Files über die Datei-Tools, erfragt den Git-Stand beim Maintainer und liefert PowerShell-sichere Kommandos **zeilenweise** zurück. Vor jedem Doc-Commit `npm run brain:lint -- --no-write` lokal grün ziehen.

## Latest pipeline state (2026-06-01)

**Korpus 859/859 datenkomplett + konsolidiert.** Zuletzt gemergt: Brief **104** (`alias-aware-drift` — drift_works **380 → 0**, PR #118; jeder der 500 Drift-Junctions über 380 Bücher ist ein registrierter Edition-Rename), Brief **105** (Cluster A: Kauf-/Hör-Links auf `/buch/[slug]` + 66 Audiobook-Credits, PR #112+#114), Brief **107** (Full-Rebuild-Restore-Wiring — `apply:audiobook-narrators` als deterministischer Tail der Reset-Sequenz, PR #115). **Seit dem gemergt (2026-06-01):** Brief **109** (Entity-Graph Step 1 — echte `/charakter` `/fraktion` `/welt`-Hubs auf einer geteilten frame-agnostischen `EntityView` + server-only Loader `src/lib/entity/`, voll SSG, 1004 Seiten in 3.6s; `52-stub-shell.css` → `59-entity.css`) + Brief **110** (Podcast-Pilot — *The 40k Lorecast* Dry-Run: 148 Folgen, 136 = 91.9% getaggt, 510 Tags via `resolveSurfaceForm`/Brief 104, committed Artefakt + Quality-Report unter `ingest/podcasts/`; **kein** Schema/DB).

DB-Stand (post-PR-109/Brief-105):

- **works 859** = 565 W40K (`ssot-w40k-001..057`) + 294 HH (`ssot-hh-001..030`).
- Reference: factions **202**, locations **289**, characters **490**, facet_values 86; Aliases faction ~73 / location ~25 / character **66**.
- Junctions: work_factions **2754**, work_locations **1146**, work_characters **1999**, work_collections **196**, work_persons **873** (post-105: +88 Audio-Rollen narrator/co_narrator/full_cast über 66 Bücher), work_facets **16845**.
- `book_details.rating` bei ~820/859 (119 `hardcover` + ~701 `goodreads`; ~39 ohne aggregierte Wertung = 2025/26-Releases + Edge-Cases).
- `EXPECTED_RANGES`: factions.max **3200** (~14% headroom), locations.max **1500** (~24%), characters.max **2500** (~25%).
- Migrations durch `0009_lucky_pete_wisdom.sql` applied; seit Resolver-Pass 7 brauchte **keine** Welle eine Schema-Migration.

## What's running

- **App on Vercel** — <https://chrono-lexicanum.vercel.app/>. Hub + `/timeline` (+ `/[era]`) + `/buch/[slug]` (+ `/audit`) + `/buecher` (Catalogue mit Audit-Pillen + Drift-/Alias-Signalen) + `/ingest` (read-only Diff-Inspector) + `/healthz`. Echte Entity-Hubs **`/charakter` `/fraktion` `/welt`** (SSG, geteilte `EntityView`, Brief 109); Stub-Shells nur noch `/ask` `/map` (Brief 096 Phase E).
- **CI on GitHub Actions** — `lint-and-typecheck` + `brain:lint --no-write` auf jedem PR. Vercel macht Production-Builds; CI läuft *kein* `next build`. Direct-to-`main` Doc-Commits skippen CI → lokal `brain:lint --no-write` grün ziehen.
- **DB on Supabase** — Pooler (Port 6543) zeigt auf prod (kein Test-Branch).
- **Excel-SSOT-Roster** — `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-extern) → `import-ssot-roster.ts` → deterministisch `book-roster.json` (859 Bücher + 196 Collections). Alle 859 kristallisiert + in der DB; Resolver-Loop emittiert `all-complete`.
- **Loop-Driver** — `run-ssot-loop.sh` (Brief 094, cadence-frei) + headless `run-resolver-loop.sh` (Brief 094/100, zwei-domänen-fähig W40K+HH, Terminal-Zustände `open-wave | idle | all-complete`). Beide stehen still (Korpus komplett), bleiben für Ad-hoc-Roster-Erweiterungen im Repo. Vier Loop-Disziplinen: Public-Synopsis (076/080, Apply-Layer-hard-enforced), Faction-Granularity (077), Locations-Granularity (084), Goodreads-Rating (087).
- **Konsolidierungs-Pass** — runbook-getriebener Pass-Typ (`consolidation-aggregate/-db-snapshot/-db-sync.ts` + `consolidation-pass-runbook.md`), arbeitet auf dem Entitäten-Set (wellengrößen-unabhängig). Zweimal gefahren.
- **Atlas-Regen** — `npm run atlas:regen` schreibt einen Postgres-Mirror-Obsidian-Vault nach `~/chrono-atlas/`. Manual trigger; [`workflows/atlas-regen.md`](./workflows/atlas-regen.md).
- **Brain-Lint** — `npm run brain:lint` (11 Check-Kategorien) + CI-Gate `--no-write`. Reports unter `brain/outputs/lint/YYYY-MM-DD.md`.

## What's open

Top-Items aus [`open-questions.md`](./open-questions.md), sortiert post-Brief-109/110:

- **Entity-Graph-Arc — Steps 2–5 offen (Product).** Step 1 (Brief 109) gemergt: echte `/charakter` `/fraktion` `/welt`-Hubs auf der geteilten `EntityView` + `loadEntity`-Loader. Nächste: **Step 2** In-Context-Panel (intercepting route, reused `loadEntity`+`EntityView`, zero fork), Step 3 Suche (verdrahtet `resolveSurfaceForm`), Step 4 `/werke`-Browse, Step 5 Startseite. Near-free Follow-up: `/aera` + `/serie`-Hubs (ASCII-Routen; book-only related bis andere Medien Era/Serie-Anker tragen). Konvergenz: geteilte Chip/Section-Label/Hairline-Grammatik in ein Primitive heben, das `/buch` + Hubs teilen. **Maintainer-Visual-Pass** der Hubs (Desktop + ≤720px) offen (CC nur curl). `CROSSLINK_CAP=40` ist ein stiller Cap (nicht blockierend).
- **Podcast-Track — Step 2+ offen (Batches).** Step 1 (Brief 110) gemergt: Pilot-Artefakt + Report, kein DB. Nächste: **Step 2** Schema (`podcast` + `podcast_episode` work-kinds nach dem channel/video-CTI-Muster, `episodeGuid`-keyed idempotenter Apply) + Tags → `work_*`-Junctions (`role=subject|mentioned`); **Quick alias wins** (`Guilliman`/`Vect`/`Magnus`/`Titus`/webway-immaterium → `*-aliases.json`, hebt Coverage billig); Extraction-Prompt gegen Common-Noun-Over-Extraction; Step 3 = kuratierte Shows (Lorehammer, Adeptus Ridiculous, Laying Down The Lore, ~$1.3/Show Sonnet). Die 126 unresolved Surface-Forms sind eine Worklist (echte fehlende Entities: Leagues of Votann, Be'lakor, Eldrad, Skarbrand, Imotekh, …).
- **Token-Diet-Folge — Brief 111 (Sessions-Archiv-Sweep, doc-only → `main`) + Brief 112 (brain:lint-Budget-Guardrail, Code → PR)** sind geschrieben + offen (2026-06-01-Token-Diet-Session).
- **PR #113 (Chronicle/Ask-Redesign) — Cowork-Sichtung + Brief-096-Status-Flip offen.** `b60b0fb` hat Brief-096 Phasen G (Chronicle/Timeline bespoke) + H (Ask-Funnel) lokal-iterativ gemergt (kein Impl-Report). Sichtung + Entscheidung, ob 096 `open → implemented` flippt, stehen aus.
- **Brief-104-Folgen** (kein Blocker): `?audit=drift` ist auf dem aktuellen Korpus dauerhaft leer (drift_works=0) → Drift-Pille/Brief-103-Sub-Sort behalten/umlabeln/zurückbauen entscheiden; die ruhige Alias-Klasse liegt always-on auf ~44% der Bücher → ggf. detail-only/hinter `?audit=alias`; `resolveSurfaceForm` wird von **Brief 109 Step 3** verdrahtet; der **Maintainer-Visual-Pass** der Alias-UI (Desktop + ≤640px) steht aus (CC fuhr nur curl-Smoke).
- **Audiobook-Full-Sweep 859** — Brief 105 creditete 66 Bücher (Major-Reihen + meistgelesene); die ~790 Rest-Bücher sind ein Folge-Sweep (gleiche One-Search-pro-Buch-Methode) + Cast-Tiefe + Spelling-Watch. Die 4 `no_audiobook`-Rows sind reale Gaps. Short-Title-Store-Link-Kollisionen (*Legion*/*Nemesis*/…) sind ein UI-Daten-Befund.
- **Sessions-Archive-Sweep + NNN-Collision-Fix** — *(in Arbeit, Token-Diet-Session 2026-06-01)*: closed Briefs 098–107 + Pass-11..15-Dossiers + consolidation-pass-2-* → `archive/2026-05/`; die großen Append-Logs + Runbooks aus `sessions/`-Root verlagern; zwei Collision-Files `2026-05-27-098/099-impl-map-*` (reuse vergebener NNN) umnennen.
- **Phase-3-Seal-Brief** — `ROADMAP.md` Phase 3 → shipped, Phase 4/5 öffnen, Phase-3-Tail explizit als Backlog mappen. Doc-only, klein.
- **`/buch/[slug]/audit`-Detail-Refinement** — Detailseite könnte analog zur Liste die volle Drift-Achse + die fehlende Gap-Achse zeigen (UI + Daten verzahnen).
- **Audio-Drama-Dämpfung site-weit** — heute nur im Single-Gap-Cockpit; `book.format==='audio_drama'` + `.catalogue-row__audio-tag` sind für die public `/buecher`-Liste wiederverwendbar.
- **Legacy-Token-Cleanup** — `--color-void / --color-aquila / --color-frost-*` sind post-096 möglicherweise unused; Code-Review-Sweep, dann `@theme {}`-Aliases droppen.
- **Public-Page-Rating-Render** — `bookDetails.rating` (~820/859) wird auf `/buch/[slug]` nicht gerendert; **angedockt an Brief 096**, kein eigener Brief.
- **Hand-Check-Workflow + Override-Schema** (OQ 3) — Cockpit seit Brief 073 da; Override-Field-Schema + Triage-Disziplin stehen aus, ggf. superseded durch den `claude -p`-Direct-Curation-Loop.
- **Crawl-Simplification / Dead-Code-Retirement** (OQ 13) — bypassed-aber-nicht-retired Ingestion-Pfade (V1-Pipeline, V2-LLM-Stage, V2-Rest) sichten; im selben Zug die stale `CLAUDE.md`-Stack-Tabelle korrigieren.
- **Maintainer-Excel-Sweep** über die `audit:gap-candidates`-Restliste (325 → ~10–20 echte fixable Backfills) — laufende Maintainer-Arbeit, kein Brief.
- **Längerfristig / bei Bedarf:** Aggregator-Pass-3-Refinement (auto-no-merge `tags:vessel↔planet` + `primarch-stem↔captain`), Codex-Review-Sicht auf Konsolidierungs-Pass 2, Collection-Gap-Ledger-Pflege, Slug-Delta W40K-0259/0330 (geparkt — `apply-override` friert `slug`/`title` on update ein), Vokabular-Hygiene-Stack, `run-ssot-loop.sh`-Refinements, Cockpit-Refinements (smoke-slugs-Regression-Probe, coverage two-line output).

## Next likely brief

Stand 2026-06-01. **Step 1 beider Arcs ist gemergt** (Brief 109 Entity-Hubs + Brief 110 Podcast-Pilot). Aktive Linie jetzt: **Step 2 beider Arcs**, wieder verschiedene Worktrees → kollisionsfrei parallel.

1. **Entity-Graph Step 2 (Brief 113, Product) + Podcast Step 2 (Brief 114, Batches) parallel anwerfen** — beide geschrieben + offen. Entity Step 2 = In-Context-Panel (intercepting route, reused `loadEntity` + `EntityView`, zero fork — das 109-impl beschreibt die Naht). Podcast Step 2 = Schema (`podcast`/`podcast_episode` work-kinds nach dem channel/video-CTI-Muster, `episodeGuid`-keyed idempotenter Apply) + Tags → `work_*`-Junctions; dazu die billigen Quick-alias-wins als Coverage-Lift. Optional near-free dazu: `/aera` + `/serie`-Entity-Hubs (das Step-1-System trägt sie fast gratis).
2. **Phase-3-Seal-Brief** — formaler Phasen-Abschluss (doc-only, klein, parallel-fähig).
3. **Sessions-Archive-Sweep + NNN-Collision-Fix** — teilweise in der 2026-06-01-Token-Diet-Session adressiert; Rest = physischer Archive-Move + Ref-Rewrites.
4. **Brief-096 G + H** bleiben lokal-iterativ im Product-Worktree; der nächste Product-PR kommt auf ausdrückliches `fertig`.

Sekundär (Maintainer-Wahl, weniger zeitkritisch): Crawl-Simplification/Dead-Code-Retirement (OQ 13), Aggregator-Pass-3-Refinement, Hand-Check-Workflow (OQ 3), Refresh-Button (per-Buch on-demand Goodreads-Refresh).

Session-end-Disziplin (post-049): jeder Architekten-Brief + CC-Report läuft durch [`workflows/session-end.md`](./workflows/session-end.md) — diese Seite updaten, `open-questions.md` prunen, ggf. Decisions schreiben. Seit Brief 095 ist der Post-Merge-Koordinations-Pass der **einzige** Pfad, über den `sessions/README.md` + `brain/**` sich ändern (Cowork als alleiniger Schreiber aus dem Koordinations-Worktree).
