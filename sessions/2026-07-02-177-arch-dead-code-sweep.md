---
session: 2026-07-02-177
role: architect
date: 2026-07-02
status: implemented
slug: dead-code-sweep
parent: null
links: [2026-06-30-171, 2026-06-03-122, 2026-07-02-176]
commits: []
---

# 177 — Dead-Code-Sweep: V1/V2-Ingestion-Retirement (122-Batches, Board-Task B6)

## Goal

Die toten Ingestion-Generationen ausbauen — V1-Crawler, V2-LLM-Anreicherung und V2-Rest — plus die stale Stack-Tabelle in `CLAUDE.md` auf den Per-Buch-SSOT-Stand bringen. Inventar zuerst, dann löschen; nichts, was der eingefrorene Äquivalenz-Golden-Pfad braucht, fällt weg.

> **Startbedingung:** erst nach Merge von Brief [176](./2026-07-02-176-arch-roster-rebind-kleinkram.md) (Rebind ändert `import-faction-starters.ts` — Konflikt vermeiden, und der Rebind macht die Live-Reader-Lage für dein Inventar eindeutig).

## Context

- Board-Task **B6** (Spec von 2026-06-03, vor der Per-Buch-Migration): „V1-Ingestion + V2-LLM + V2-Rest ausmustern (Carve-out: Excel-SSOT-Loader bleibt); stale `CLAUDE.md`-Stack-Tabelle fixen". Kandidaten-Detail: git-Historie + archivierter OQ-13-Text.
- **Die Lage hat sich seit dem Spec durch Briefe 170/171 verschoben** — das Inventar muss den Post-Retirement-Stand abbilden, nicht den Juni-Stand:
  - Die Batch-/Loop-/Resolver-Maschinerie ist bereits retired mit **absichtlichen Refusal-Stubs** (`import:ssot-roster`, `db:apply-override`, `loop:next`, `db:apply-scope`, …) — die Stubs sind Feature, kein Dead Code. Sie bleiben.
  - Roster, Extension, die 90 Override-Batches und `Warhammer_Books_SSOT.xlsx` sind **eingefrorene Provenienz + re-runnbarer Äquivalenz-Golden** (Brief 171). Jeder Code, den ein `equiv:diff`-Re-Run (inkl. `--db-snapshot`/`--compare`) braucht — Legacy-Loader, Excel-SSOT-Loader, geteilte Writer-Pfade — **bleibt**. Der alte „Excel-Loader bleibt"-Carve-out ist damit Teilmenge eines größeren: *der Golden-Pfad bleibt komplett funktionsfähig*.
  - Ziel des Sweeps ist die Schicht **davor**: V1-Crawler (Wikipedia/Lexicanum/Open-Library/Hardcover), V2-LLM-Anreicherung und sonstiger V2-Rest unter `src/lib/ingestion/**` + zugehörige Scripts/Configs, die weder ein Live-Pfad noch der Golden-Pfad referenziert.
- Die `CLAUDE.md`-Stack-Tabelle beschreibt Ingestion noch als „Crawl Wikipedia + Lexicanum + Open Library + Hardcover; LLM-Anreicherung" — nach dem Sweep faktisch falsch; auf den heutigen Stand bringen (Per-Buch-SSOT, `/add-book`, Podcast-Delta, Weekly-Refresh).

## Constraints

- **Inventar vor Löschung:** erst eine Kandidatenliste mit Evidenz („keine Live-Referenz, keine Golden-Pfad-Referenz") — als Abschnitt im Impl-Report. Bei unklaren Fällen: drinlassen und listen statt löschen.
- Golden-Pfad-Beweis: nach dem Sweep muss ein DB-freier `equiv:diff`-Lauf noch funktionieren (mindestens Smoke: startet, lädt Legacy-Korpus, produziert das erwartete Ergebnis).
- Refusal-Stubs und ihre Tests bleiben unangetastet; `db:sync`-Kette (9 Schritte), Runbooks und LEGACY-Banner bleiben.
- Keine Migrationen anfassen, keine Daten-Files unter `scripts/seed-data/**` löschen, keine `ingest/`-Artefakte löschen.
- `brain/**` + `sessions/README.md` nicht anfassen (Rollup); `CLAUDE.md` top-level darf dieser PR editieren (Stack-Tabelle + ggf. direkt betroffene Prosa, minimalinvasiv).
- Batches-Worktree, ein PR. Reine Löschung + Doc-Fix — keine Refactors lebender Pfade „wo man schon mal dran ist".

## Out of scope

- Rebind-Themen (Brief 176) und Podcast-Hygiene (Brief 175).
- Kein Umbau von `db:sync`/`db:drift`/`apply:*`.
- Keine Umbenennung/Verschiebung lebender Module (nur Löschung toter).
- `docs/`-Redirect-Stubs und archivierte Sessions bleiben.

## Acceptance

The session is done when:

- [ ] Kandidaten-Inventar mit Verdict je Eintrag (gelöscht / behalten-weil-Golden / behalten-weil-live / unklar-drin) steht im Impl-Report.
- [ ] V1-/V2-Dead-Code ist entfernt; `grep`/`tsc` zeigen keine dangling Imports; `npm run lint` + `typecheck` + alle bestehenden Test-Suites grün.
- [ ] DB-freier `equiv:diff`-Smoke läuft nach dem Sweep (Golden-Pfad intakt).
- [ ] Retired-CLI-Refusals verhalten sich unverändert.
- [ ] `CLAUDE.md`-Stack-Tabelle (Ingestion-Zeile + betroffene Prosa) beschreibt den Per-Buch-SSOT-Ist-Stand.
- [ ] Report beziffert den Abbau (Dateien/LOC) — fürs Log.

## Open questions

- Gibt es V1/V2-Reste, die zwar tot sind, aber historischen Dokumentationswert haben (z. B. Prompt-Vorlagen)? Empfehlung: löschen (git-Historie reicht) — widersprich im Report, falls du ein konkretes Gegenbeispiel findest.
