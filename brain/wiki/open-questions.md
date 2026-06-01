---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-06-01
sources:
  - ../../sessions/README.md
  - ../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md
  - ../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md
related:
  - ./project-state.md
  - ./deferred-questions.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant/distant items live in [`./deferred-questions.md`](./deferred-questions.md); phase-internal backlog (3d/3e/3f reminders) in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** Die durchgestrichenen/`-historic`-Einträge (OQ 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14) und die kompakte Migrations-Historie wurden 2026-06-01 ausgelagert (Token-Diet-Session: dieses File war auf ~19k Token gewachsen, ~14 von 16 Einträgen waren geschlossen). Wer die Schließungs-Begründung eines alten OQ braucht, liest `git log` oder `log.md`.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Das Maintainer-Audit-Cockpit ist seit Brief 073 verfügbar; ein **Override-Field-Schema + die Triage-Disziplin** stehen noch aus. V2 hat `BookV2Record.fields.<f>.override` als Hand-Override-Slot bereits eingebaut — der Hand-Check-Brief muss „nur" das CSV-/Markdown-Override-Format definieren und festlegen, welche Validation-Severity auto-rollt, welche Cowork-Augen braucht, welche ignoriert wird.

**Aktualitäts-Vorbehalt:** möglicherweise superseded durch den `claude -p`-Direct-Curation-Loop (Brief 061) — in seiner ursprünglichen Pipeline-Form auf Relevanz prüfen, bevor ein Brief draus wird.

## (13) Crawl-Simplification-Sichtung — Kandidaten für Dead-Code-Retirement

**Owner:** Cowork (Maintainer-Entscheidung, welcher Kandidat ein Brief wird) → CC (Retirement-Brief, falls beauftragt). **Sessions:** Cowork-Befund 2026-05-20 (Wiki-Pass post-086), ausgelöst durch die 086-„Simplest thing first"-Lehre. **Follow-up brief:** optional, nicht zeitkritisch.

Die Vereinfachung ist architektonisch schon zweimal passiert: Discovery-Crawl → Excel-SSOT ([`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)), LLM-Anreicherung → `claude -p`-Direct-Curation ([`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md)). Der live Pfad ist schon das Einfache. Was bleibt, ist **bypassed-aber-nicht-retired Code** — ein Hygiene-Brief (Repo-Hygiene, kein Verhaltens-Change), Risiko gering:

- **V1-Ingestion-Pipeline** (`src/lib/ingestion/` non-v2: `wikipedia/`, `lexicanum/`, `open_library/`, `hardcover/`, `tlbranson/`, `llm/`, `discovery/`, `merge.ts`, `field-priority.ts`, `diff-*`, `dry-run.ts`, `state.ts`, …) — größter Brocken; die alten Diffs liegen als committed JSON unter `ingest/.archive/` und brauchen den Code nicht.
- **V2-LLM-Stage** (`src/lib/ingestion/v2/llm/`) — bereits als ausgemustert deklariert; Brief 061 § Out-of-scope nennt explizit einen „Aufräum-Brief später".
- **V2-Pipeline-Rest** (`src/lib/ingestion/v2/`: `run-batch.ts`, `run-engine.ts`, `run-pilot.ts`, `sources/`, `validators/`).
- **Carve-out:** der Excel-SSOT-Loader (`scripts/import-ssot-roster.ts` + ggf. `v2/ssot/load-roster.ts`/`adapt.ts`) ist live und muss erhalten bleiben — ein Retirement-Brief muss zuerst empirisch klären, welche `v2/ssot/`-Module der Loader noch braucht.

Vorarbeit: Import-Graph ab `run-ssot-loop.sh` / `apply-override.ts` / `import-ssot-roster.ts` verifizieren, prüfen ob `package.json`-Scripts (`ingest:backfill`) noch auf V1/V2 zeigen. Im selben Zug die `CLAUDE.md`-Stack-Tabelle korrigieren (beschreibt die Ingestion noch als „crawlt Wikipedia + Lexicanum + Open Library + LLM-Anreicherung" — stale).
