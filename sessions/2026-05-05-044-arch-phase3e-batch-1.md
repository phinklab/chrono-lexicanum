---
session: 2026-05-05-044
role: architect
date: 2026-05-05
status: implemented
slug: phase3e-batch-1
parent: null
links:
  - 2026-05-04-042
  - 2026-05-04-043
  - 2026-05-04-040
  - 2026-05-03-039
  - 2026-05-03-035
commits: []
---

# Phase 3 Stufe 3e — Batch 1 (Bücher 41–90, Dry-Run)

## Goal

Ersten 50er-Batch der Phase-3e-Backfill-Operation laufen lassen — Bücher 41–90 der Wikipedia-Discovery-Liste, dry-run, mit Resume-Mechanik live getestet, Diff committed, im Dashboard inspizierbar.

Das ist der erste produktive Schritt der batched-3e-Strategie (Carry-Over: 50–100-Buch-Batches statt einem 800-Buch-Übernachtlauf, damit Quality-Gate nach jedem Batch greift). Brief 040 (Haiku-Switch + Prompt-Härtung, Report 042) und Brief 041 (Ingestion-Dashboard, Report 043) sind beide grün und haben die Voraussetzungen geliefert: Default-Modell ist `claude-haiku-4-5`, System-Prompt ist gehärtet, `/ingest`-Route rendert die Diff-Files. Bücher 1–40 sind bereits getestet (Re-Test 042 + 3c-Vergleichs-Lauf 039) — `--offset 40` setzt sauber fort.

## Context

Stand am 2026-05-05:

- **Pipeline ist 3a/3b/3c-komplett.** Wikipedia-Discovery + Lexicanum-Crawler + Open-Library + Hardcover + LLM-Anreicherung (Haiku 4.5) docken ohne Engine-Refactor an. CLI `npm run ingest:backfill -- --dry-run --limit N --offset M` ist seit 3a stabil; `--limit` ist absolut, nicht inkrementell (siehe Report 035 § „Decisions").
- **Default-Modell ist Haiku 4.5.** Re-Test 042 zeigt: $2.24 für 20 Bücher → ~$5.50 für 50 Bücher (Cost-Linearität), `value_outside_vocabulary` 1/20, Format-Coverage 100%, Synopsen-Drift 4/20 außerhalb 100–150 (Soft-Befund).
- **Dashboard rendert Diffs auf `/ingest`.** Nach `git push` der neuen Diff-Datei + Vercel-Build ist der Batch im Dashboard sichtbar (SSG via `generateStaticParams`). Lokal über `npm run dev` + `localhost:3000/ingest` ebenfalls.
- **Resume-Mechanik wired aber unverifiziert.** CC's State-Snapshot-Mechanik aus 3a (Report 035 § „For next session": „mein code wired processedIndex save nach JEDER Buch-Iteration, SIGINT-Handler spart sogar das") ist gebaut, aber nie unter realen Bedingungen getestet worden. State liegt unter `ingest/.state/in-progress.json` (gitignored), Diff unter `ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json` (committed).

Erwarteter Cost: $5–7 für die 50 Bücher (3c Re-Test war $2.24 für 20, plus eventuell der Resume-Vorlauf).

## Constraints

- **Dry-Run only.** CLI verlangt `--dry-run` zwingend (sonst `exit 1` mit Hinweis auf 3d-Apply). Nichts wird in die Postgres-DB geschrieben.
- **Slug-Range Bücher 41–90.** Konkret: `npm run ingest:backfill -- --dry-run --limit 50 --offset 40`. Die ersten 40 sind bereits getestet, sollen nicht re-laufen.
- **Resume-Mechanik MUSS in dieser Session live verifiziert werden.** Mindestens ein Ctrl-C-Test (mitten in einem Lauf abbrechen, gleichen Befehl wieder starten, prüfen dass schon-fertige Bücher übersprungen werden). Form ist CC's Wahl — kann als separater 5er-Vorlauf passieren, oder integriert in Batch 1 selbst (wenn integriert: das Ergebnis muss trotzdem ein vollständiger 50er-Diff sein).
- **Diff committed nach erfolgreichem Lauf.** `ingest/.last-run/backfill-*.diff.json` landet im git tree. Nicht aufräumen.
- **State-File geleert nach erfolgreichem Lauf.** Existing-Behavior aus 3a — wenn der Lauf clean durchläuft, wird `ingest/.state/in-progress.json` gelöscht. Nur Resume-Tests sollen State übrig lassen.
- **Pipeline-Code unverändert.** Kein Refactor, kein neues Constraint, kein Schema-Edit. Falls CC während des Laufs Friktion in der Engine bemerkt: in der Session-Notes notieren, NICHT fixen.

## Out of scope

- **Hand-Check-Korrekturen oder Override-Files.** Wenn die Diff Ungereimtheiten zeigt, nicht in dieser Session fixen — Philipp will das nach dem Batch in einer separaten Claude.ai-Session machen, und das Override-File-Schema kommt in einem späteren Brief (frühestens Brief 045) basierend auf den Erfahrungen aus diesem Batch. Nicht im 042-Stil ad-hoc nachhärten.
- **3d-Apply-Step (DB-Writes).** Bleibt außerhalb dieser Session, kein eigener Brief noch.
- **Vokabular-Erweiterung.** Wenn `proposed_new_facet`-Flags auftauchen (z.B. `duty`, `honor`, `sacrifice` etc.), in den Diff-Audit aufnehmen, NICHT live ins Vokabular einpflegen. Vokabular-Erweiterung ist eigene architektonische Entscheidung (Carry-Over-Item).
- **Crawler-Edge-Cases verbessern.** Falls neue Errors auftauchen (mehr als die ~18 known cases aus dem Re-Test), in den Befunden notieren, nicht fixen. Phase-3.5+-Material.
- **Pipeline-Cost-Tuning.** Falls $5.50 sich als $9 entpuppt: notieren, nicht jetzt optimieren. Carry-Over-Item ist explizit „eher nicht der Mühe wert".

## Acceptance

The session is done when:

- [ ] `npm run ingest:backfill -- --dry-run --limit 50 --offset 40` lief mindestens einmal vollständig durch und produzierte einen committed Diff unter `ingest/.last-run/backfill-*.diff.json` mit ~50 Buch-Slugs in `added`/`updated`/`skipped_manual`/`skipped_unchanged`/`errors` zusammen (Summe der Counter ≈ 50, je nach Wikipedia-Discovery-Realität).
- [ ] Resume-Mechanik live verifiziert: mindestens ein Ctrl-C-Test in dieser Session, im Report dokumentiert mit „Vor Ctrl-C N Bücher fertig, nach Restart wurde bei Buch N+1 fortgesetzt (oder: SIGINT-Snapshot griff, State-File hat processedIndex K)".
- [ ] Final-Diff zeigt im Dashboard auf `/ingest` (lokal via `npm run dev` + `localhost:3000/ingest`) als neueste Card; Drill-down auf `/ingest/<runId>` rendert ohne Crash. Vercel-Deploy ist nicht Teil der Acceptance — Philipp pusht.
- [ ] `npm run typecheck` grün, `npm run lint` grün (1 pre-existing warning aus `src/app/layout.tsx` ist OK), `npm run build` grün.
- [ ] State-File `ingest/.state/in-progress.json` ist nach erfolgreichem Final-Lauf nicht mehr da (Existing-Behavior — Lauf clear-t State).
- [ ] Cost-Sanity: `llmCostSummary.estUsdCost` im Diff liegt im Range $4–8 (linear-extrapoliert aus 042-Re-Test). Falls deutlich darüber: dokumentieren, nicht jetzt eingreifen.

## Open questions

Inputs für den nächsten Brief — CC liefert die in der „For next session"-Sektion:

- **`llm_flags`-Verteilung auf 50 Bücher.** Wieviele `year_glitch`, `data_conflict`, `proposed_new_facet`, `value_outside_vocabulary`, `author_mismatch`? Je Flag-Kind die Anzahl + ggf. Stichprobe. Skaliert sich der 042-Re-Test (7 Flags auf 20 Bücher = ~17 auf 50) oder explodiert was?
- **`proposed_new_facet`-Werte.** Welche thematischen Kategorien fehlen Haiku im Vokabular? Liste der Werte ist Input für Vokabular-Erweiterungs-Entscheidung.
- **Synopsen-Drift.** Im 042-Re-Test waren 4/20 außerhalb 100–150 Wörter. Auf 50 Bücher: wieviel Prozent? Gleicher Pattern (eher zu lang als zu kurz), oder anders?
- **Author-Mismatch-Plausibility (Haiku-Schwäche).** Im 042-Re-Test 0/20. Auf 50 Bücher mit potentiell Mehr-Author-Anthologien: tauchen welche auf? (Wenn ja, ist das Material für den Hand-Check-Workflow-Brief.)
- **Errors-Stabilität.** 18 Errors waren im 042-Re-Test (9× author mismatch, 5× no Open Library hits, 4× no candidate URL). Bleibt das proportional, oder kommen neue Edge-Cases dazu?
- **Resume-Verhalten.** Wie sieht das State-File konkret aus, was steht drin? (Falls überraschend — z.B. SIGINT-Race-Condition oder State-Korruption — Befund nennen.)

## Notes

CLI-Aufrufe für die Session:

```bash
# (optional) kleiner Resume-Vorlauf zur Mechanik-Verifikation, dann state leeren und Batch 1 starten:
npm run ingest:backfill -- --dry-run --limit 5 --offset 40
# … Ctrl-C nach 2 Büchern …
npm run ingest:backfill -- --dry-run --limit 5 --offset 40
# … sollte bei Buch 3 fortsetzen, dann clean durchlaufen, State löschen
rm -f ingest/.state/in-progress.json   # falls Resume-Test einen halb-fertigen State hinterlassen hat

# Batch 1 echter Lauf:
npm run ingest:backfill -- --dry-run --limit 50 --offset 40

# (alternativ: Resume-Test integriert in Batch 1 — Ctrl-C nach ~10 Büchern, gleicher Befehl wieder, bis 50 voll)
```

Form ist CC's Wahl. Acceptance ist „Resume-Test wurde gemacht", nicht „auf diese eine Art".

Verweise:
- Report 042 (`sessions/2026-05-04-042-impl-phase3c-haiku-switch.md`) — Default-Modell, Härtungen, Re-Test-Metriken als Baseline.
- Report 043 (`sessions/2026-05-04-043-impl-ingestion-dashboard.md`) — `/ingest`-Routing-Form, was im Dashboard sichtbar ist.
- Report 035 (`sessions/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md`) — CLI-Semantik, State-File-Pfad, Resume-Designs.
- Brief 040 § „Acceptance" — Cost-Range-Erwartung als Vorlage.

Erwartete Output-Dateien nach erfolgreichem Lauf:
- `ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json` — committed
- `ingest/.state/in-progress.json` — gelöscht (Existing-Behavior)
