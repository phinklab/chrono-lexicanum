---
session: 2026-07-01-173
role: architect
date: 2026-07-01
status: implemented
slug: hygiene-resync-worklist
parent: null
links: [2026-06-03-121, 2026-06-03-122, 2026-06-04-129, 2026-06-26-166, 2026-06-27-167, 2026-06-27-168, 2026-06-27-169, 2026-06-28-170, 2026-06-29-171, 2026-06-29-172]
commits: []
---

# Hygiene-Resync + kanonische Worklist

## Goal

Ein Koordinations-Worktree-PR, der die aufgelaufene Buchhaltungs-Staleness komplett abbaut (README-Tabelle 166–169, Archiv-Sweep, Boards-Resync) und `brain/wiki/worklist.md` als **die eine kanonische Stelle für offene Arbeit** etabliert. Danach kündigt kein Dokument mehr an, dass ein anderes Dokument demnächst aufgeräumt wird.

## Context

Mit Philipp am 2026-07-01 vollständig gesichtet: alle Briefs bis 172 sind `implemented`, alle Impl-Reports `complete` — die offene Substanz ist Buchhaltung plus verstreute Follow-ups. Cowork hat bereits geschrieben (uncommitted, reitet in diesem PR):

- **`brain/wiki/worklist.md`** (neu) — konsolidierte Arbeitsliste (Forward-Queue, Pakete Podcast-Hygiene + Roster-Rebind, Blockiert-Liste, OQ-Spiegel, Geparkt, Maintainer-Merker). **UI ist bewusst ausgenommen** (Philipp-Entscheid 2026-07-01): kosmetisches UI bleibt in `docs/ui-backlog.md`, ein UI-Gesamt-Pass kommt als eigene Session (Kandidat: nach P14 Map).
- Diesen Brief + `sessions/README.md`-Nachtrag + `brain/wiki/index.md`-Katalogzeile + Pointer in `project-state.md`/`open-questions.md`.

Ist-Zustand der Staleness (verifiziert gegen Frontmatter + Korpus):

- `sessions/README.md`-Tabelle führt **166/167/168/169 als `open`**, obwohl die Brief-Dateien selbst `status: implemented` tragen und Impl-Reports für 166/168/169 existieren (`2026-06-26-166-impl-*`, `2026-06-28-168-impl-*`, `2026-06-28-169-impl-*`).
- **167 hat keinen Impl-Report.** Sachlich abgeschlossen: die 6 ADD-Bücher `W40K-0593..0598` liegen im per-Buch-Korpus (`scripts/seed-data/books/`), die 4 REPOINTs sind via 169 verlinkt.
- **Archiv-Regel verletzt:** 21 Dateien im `sessions/`-Root; erlaubt sind offene + max. 1–2 just-closed.
- **Boards 121/122 sind seit ~2026-06-16 stale** (Wave 159–163, P11, B12/164, 166/169 nicht in den Status-Spalten nachgeführt).
- **OQ 16b** in `open-questions.md` referenziert das mit Brief 171 retirte `apply-override.ts` als Ort des `'time_ending'`-Hardcodes — die Beschreibung stimmt nicht mehr.

## Constraints

- Koordinations-Worktree (`chrono-lexicanum`), Meta-Branch `codex/session-173-<slug>`, **ein** PR. Cowork-Dateien (Worklist, Brief, Rollup-Edits) mit einsammeln; diesen Brief im PR auf `status: implemented` flippen.
- Archiv-Sweep ist reines Verschieben (`git mv`) nach `archive/YYYY-MM/` gemäß Datei-Datum — **kein** Umschreiben archivierter Inhalte.
- Nach dem Sweep alle relativen Links auf verschobene Session-Files reparieren (mindestens: `sessions/README.md`, `brain/wiki/project-state.md`, `open-questions.md`, `worklist.md`, `index.md`, `deferred-questions.md`).
- Boards-Resync ändert nur Status-Spalten/Erledigt-Vermerke, keine Spec-Inhalte.
- **Kein retroaktiver Impl-Report für 167.** Stattdessen Abschlussvermerk in der 167-Zeile der README-Tabelle (bzw. im Archiv-Eintrag): geschlossen ohne Report, Evidenz = `W40K-0593..0598` im Korpus + 169-Relink.
- `npm run brain:lint -- --no-write` grün vor dem PR.

## Out of scope

- **Keine Umsetzung von Worklist-Items** — nicht P12/P13/P14, nicht das Podcast-Hygiene-Paket, nicht der Roster-Rebind, kein UI-Polish-Einzeiler „weil er nur eine Zeile ist". Diese Session ist reine Buchhaltung.
- Keine DB-Operationen, kein `db:sync`/`db:drift`.
- Keine Änderungen an `src/**` oder `scripts/**` (Ausnahme: keine — auch der 16b-Hardcode wird nur **lokalisiert**, nicht geändert).
- Boards nicht restrukturieren oder zusammenlegen; 129 bleibt offen (Spec für P8/P9/B8/B9).
- **`docs/ui-backlog.md` nicht anfassen** — bleibt live als Sammelstelle für UI-Kosmetik; der UI-Gesamt-Pass ist eine spätere eigene Session (Worklist § E).

## Acceptance

The session is done when:

- [ ] `sessions/README.md`: Tabelle zeigt 166/167/168/169 als `implemented` (167 mit Abschlussvermerk „ohne Impl-Report, Evidenz Korpus + 169"); Kopf-Nachtrag 2026-07-01b (von Cowork geschrieben) bleibt konsistent.
- [ ] Archiv-Sweep: `sessions/`-Root enthält nur noch 121, 122, 129, diesen Brief (173) und höchstens das 172-Paar als just-closed; alles andere liegt unter `archive/2026-06/` bzw. `archive/2026-07/`; keine broken relative Links in `sessions/` + `brain/wiki/` (Stichprobe per grep auf verschobene Dateinamen).
- [ ] Boards 121/122: Status-Spalten decken sich mit `project-state.md` § What's open bzw. `worklist.md` (121: P1–P6/P10/P11 + Wave 159–163 + 166/169 erledigt; offen P7/P8/P9/P12/P13/P14/P15. 122: B1–B4/B10/B11/B13 + B12-via-164 erledigt, B14 verworfen; offen B5/B6/B7/B8/B9).
- [ ] OQ 16b: Ort des `'time_ending'`-Hardcodes post-171 lokalisiert (vermutlich im geteilten Writer / `computeBookRows`-Pfad) und die 16b-Beschreibung in `open-questions.md` entsprechend korrigiert (nur Wortlaut, kein Code).
- [ ] `npm run brain:lint -- --no-write` grün; PR offen, Philipp merged.

## Open questions

- Wo genau lebt der `primaryEraId`-Default nach der 171-Migration (Datei + Zeile im Report nennen)? Gibt es inzwischen einen Consumer, der das Feld liest — oder bleibt 16b konsumentenlos?
- Beim Sweep gefundene weitere Staleness (broken Links, verwaiste Verweise auf retirte CLIs in wiki-Seiten) bitte im Report listen statt still fixen, wenn es über Link-Reparatur hinausgeht.

## Notes

- Autoritative Status-Wahrheit für den Resync: Frontmatter der Session-Files (alle bis 172 `implemented`/`complete`) + `project-state.md` (Stand 2026-07-01) + `worklist.md`.
- Die Worklist übernimmt die Rolle „Sammelstelle für Offenes"; die OQ-Queue bleibt unverändert das „muss der nächste Brief adressieren"-Gefäß, die Boards bleiben Spec-Referenz. Pflege-Regel steht im Worklist-Kopf.
