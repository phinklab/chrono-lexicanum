---
session: 2026-06-16-152
role: architect
date: 2026-06-16
status: implemented
slug: timeline-rebuild-tail
parent: null
links:
  - 2026-06-03-122
  - 2026-06-10-137-impl
  - 2026-06-12-149
  - 2026-06-14-149-impl
commits: []
---

# Timeline-Restore als verify-gegateter Tail in `db:rebuild` schliessen (OQ 16a)

## Goal

`npm run db:rebuild` soll die Timeline-Daten nach einem Works-Reset wiederherstellen und read-only verifizieren: `apply:timeline` wird als Tail vor dem Curation-Overlay in die Rebuild-Sequenz eingebaut, damit `event_works` sowie `works.startY/endY/setting*` nach jedem Rebuild wieder vollstaendig sind.

Das schliesst OQ 16(a). Unter dem aktuellen DB-Freeze wird die neue Verify-Logik DB-frei ueber einen puren Diff-Helper getestet; ein echter `apply:timeline -- --verify` gegen die Ziel-DB bleibt der Abschluss, sobald Philipp den Freeze aufhebt.

## Context

- OQ 16(a) aus [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md): `db:rebuild` macht in Schritt 1 `TRUNCATE works CASCADE`. Das leert ueber FK-Kaskade auch `event_works` und verliert die auf `works` gespeicherten Timeline-Felder (`startY`, `endY`, `settingDateLabel`, `settingMethod`, `settingConfidence`, `settingAnchorEventId`).
- Brief/Impl 137 hat das Timeline-Fundament shipped: 8 Eras, 144 Events, 223 `event_works`-Hooks (95 Buch / 125 Episode / 3 Serie), 97 datierte Werke (53 event-anchored). `apply:timeline` ist idempotent, hat heute aber nur `--dry-run`, keinen `--verify`.
- Brief/Impl 149 hat das Curation-Overlay als Tail in `db-rebuild.sh` eingebaut und OQ 16(a) bewusst offen gelassen, weil `apply:timeline` erst einen Verify-Modus braucht und mit `book_details.primary_era_id` eine Reihenfolge-Interaktion hat.
- Aktuelle Rebuild-Sequenz: Reset -> full corpus re-apply -> audiobook apply/verify -> curation apply/verify. Diese Session erweitert sie auf 8 Schritte: Timeline apply/verify vor Curation apply/verify.

## Constraints

- **Strang:** Batches (`C:\Users\Phil\chrono-lexicanum-batches`), frischer Branch `codex/ingest-batches-timeline-rebuild-tail`. Code/Data/Config -> PR.
- **DB-Freeze default: ja.** Am Session-Start im Report festhalten, dass der Freeze aus 149 weiterhin als geltend angenommen wurde, sofern Philipp nichts anderes sagt. Kein Prod-`db:rebuild`, kein Prod-`apply:timeline`, kein Prod-Write.
- **Timeline vor Curation.** `apply:timeline` und das Curation-Overlay koennen beide `book_details.primary_era_id` schreiben. Hand-Kuration muss zuletzt gewinnen. Darum laeuft Timeline als Schritt 5/8 + 6/8, Curation danach als 7/8 + 8/8.
- **Verify ist read-only.** `apply:timeline -- --verify` darf keinen Write ausfuehren. Es verwendet die bestehenden read-only Stages (Seed-Parsing + DB-Aufloesung), baut daraus den erwarteten Zustand und vergleicht ihn gegen die DB.
- **`--verify` und `--dry-run` sind unvereinbar.** Wenn beide Flags gesetzt sind, hart abbrechen (Exit != 0) statt still eine Prioritaet zu waehlen.
- **Keine Brain-/Rollup-Edits im Batches-Worktree.** `brain/**` und `sessions/README.md` bleiben unangetastet. Die OQ-Schliessung und das Entfernen der Interim-Regel aus Brain macht Philipp/Cowork im Post-Merge-Koordinations-Pass.
- **Keine stillen Scope-Erweiterungen.** Kein OQ 16(b)-Fix (primaryEraId-Placeholder im Auto-Apply), kein Atlas-Event-Mirror, keine neue DB-Migration.

## Tasks

### 1. `apply:timeline -- --verify` ergaenzen

In `scripts/apply-timeline-data.ts`:

- Neues CLI-Flag `verify` in `parseArgs`, neben `dry-run`.
- `--verify` + `--dry-run` wirft laut und endet nonzero.
- Im Verify-Modus:
  - bestehende read-only Stages wiederverwenden: `parseEras`, `parseEvents`, `parseEventWorks`, `parseBookDates`, danach `resolveAgainstDb`;
  - kein `applyAll`, kein `planRemap` als Write-Vorbereitung, keine Mutationsqueries;
  - neuen read-only DB-Ladepfad und `verifyAgainstDb()` bauen.
- Post-Condition ist exakte Mengen-/Wert-Gleichheit, nicht nur Count:
  - **eras:** DB-Era-ID-Menge == `eras.json`; retired `age_rebirth` / `long_war` absent, alle JSON-Eras praesent.
  - **events:** DB-Event-ID-Menge == `events.json`; keine stale Rows.
  - **event_works:** DB-Menge == aufgeloeste Hook-Menge und nonzero. Identitaet: `eventId + targetType + targetId + role`; UUID-`id` ignorieren. Zusaetzlich `displayLabel` und `position` vergleichen, damit Label-/Sortierdrift nicht durchrutscht.
  - **book-dates:** Jeder in `book-dates.json` benannte Slug traegt exakt `settingDateLabel`, `startY`, `endY`, `settingMethod`, `settingConfidence`, `settingAnchorEventId` gemaess Erwartung. Nicht benannte Werke werden in dieser Session nicht gecleared und nicht als Fehler gewertet.
  - **primary_era_id:** Keine `book_details`-Row zeigt noch auf eine retired Era (`age_rebirth`, `long_war`).
- Exit != 0 bei jedem Mismatch, mit gelisteten Diffs im Stil der bestehenden Problems-/Verify-Reports. Lange Listen duerfen nach einem sinnvollen Limit gekuerzt werden, muessen aber Counts + Beispiele zeigen.

### 2. Pure Diff-Logik + DB-freier Test

Unter DB-Freeze ist der pure Test nicht optional, sondern Teil des Minimums.

- Die Vergleichslogik aus `verifyAgainstDb` in einen DB-freien Helper ziehen, z. B. `diffTimelineState(expected, actual) -> mismatches[]`.
- Nicht direkt aus `scripts/apply-timeline-data.ts` importieren, solange diese Datei beim Import `main()` ausfuehrt. Waehle eine der beiden sauberen Varianten:
  - bevorzugt: neuer pure Helper in eigenem Modul, z. B. `scripts/timeline-state.ts`; oder
  - `apply-timeline-data.ts` auf ein `isMain`-Pattern umbauen wie `apply-curation-overlay.ts`.
- DB-freien Test anlegen, z. B. `scripts/test-timeline.ts`, nach dem Muster `test-curation-overlay.ts`:
  - synthetische Expected-/Actual-Rows;
  - Happy Path;
  - Era/Event stale/missing;
  - `event_works` missing, extra, falscher targetType/targetId, falsche Rolle, falsches `displayLabel`, falsche `position`;
  - Book-date mismatch fuer Label/startY/endY/Method/Confidence/Anchor;
  - retired primary era vorhanden;
  - nonzero-Gate fuer Hooks.
- `package.json`: `test:timeline` ergaenzen.

### 3. Tail in `db-rebuild.sh` einhaengen

`scripts/db-rebuild.sh` auf 8 Schritte erweitern:

1. `db:reset-for-ssot --confirm`
2. `run-phase4-apply.sh <rebuild cfg>`
3. `apply:audiobook-narrators`
4. `apply:audiobook-narrators --verify`
5. `apply:timeline`
6. `apply:timeline -- --verify`
7. `apply:curation-overlay`
8. `apply:curation-overlay -- --verify`

Dabei alle hart codierten `/6`-Labels und Sequenztexte auf `/8` aktualisieren:

- Header-Kommentar;
- `print_help()` / Sequence-Block;
- `step "N/..."`-Labels;
- Schluss-`echo`.

Die Reihenfolge-Kommentare sollen explizit sagen: Timeline laeuft nach dem Korpus-Re-Apply, weil die `works` existieren muessen; Curation laeuft danach, weil hand-kuratierte `primaryEraId`-Feld-Fixes zuletzt gewinnen muessen.

### 4. Rebuild-Runbook nachziehen

In `scripts/runbooks/db-rebuild-runbook.md`:

- Sequenz auf 8 Schritte erweitern.
- Vorbedingung 4 um die vier committed Timeline-Seed-JSONs ergaenzen:
  - `scripts/seed-data/eras.json`
  - `scripts/seed-data/events.json`
  - `scripts/seed-data/event-works.json`
  - `scripts/seed-data/book-dates.json`
- Die Notiz unter "Was der Rebuild NICHT tut" zu "Kein Timeline-Restore (offene Luecke, OQ 16a)" entfernen/umschreiben: Die Luecke ist jetzt geschlossen, Timeline-Restore ist Schritt 5/6.
- Verify-Sektion um Timeline-Verify ergaenzen: exakte Set-/Wert-Gleichheit, nicht nur Count; DB-read-only.
- DB-Freeze-Hinweis aufnehmen: `db:rebuild -- --confirm` bleibt ein destructiver Ops-Befehl und wird in dieser Session nicht gegen Prod gefahren.

### 5. Report und Brief-Status

- Implementer-Report nach Template anlegen:
  `sessions/2026-06-16-152-impl-timeline-rebuild-tail.md`.
- Report muss OQ 16(a) referenzieren und die Reihenfolge begruenden: Timeline vor Curation, weil beide `primaryEraId` beruehren koennen und Hand-Kuration zuletzt gewinnen muss.
- Report unter "For next session" notieren: Cowork/Philipp schliesst OQ 16(a) im Brain/Post-Merge-Koordinations-Pass und entfernt die alte Interim-Regel.
- Diesen Architect-Brief-Status im selben PR auf `implemented` setzen, wenn die Umsetzung vollstaendig ist.
- Keine fremden untracked Leftovers stagen (bekannte Beispiele aus dem Batches-Worktree: `ingest/podcasts/luetin09-full.json`, `ingest/refresh/2026-W24/`, falls dort vorhanden).

## Out of scope

- Kein Prod-Rebuild und kein Prod-Apply unter Freeze.
- Kein OQ 16(b)-Fix am `primaryEraId`-Placeholder in `apply-override.ts`.
- Keine Atlas-Extension fuer Events (OQ 16c).
- Kein Erweitern/Umkurieren der Timeline-Seed-Daten.
- Keine Brain-/`sessions/README.md`-Rollup-Edits aus dem Batches-Worktree.

## Acceptance

The session is done when:

- [ ] `npm run apply:timeline -- --verify` existiert, ist read-only, und scheitert laut bei Diffs.
- [ ] `--verify` + `--dry-run` fuer `apply:timeline` endet nonzero.
- [ ] `diffTimelineState` (oder aequivalenter Name) ist DB-frei getestet; `npm run test:timeline` existiert und deckt Happy Path + Mismatch-Faelle ab.
- [ ] `scripts/db-rebuild.sh` zeigt in Header, Help und Step-Labels eine 8-Schritt-Sequenz mit Timeline-Schritt 5/6 vor Curation-Schritt 7/8.
- [ ] `scripts/runbooks/db-rebuild-runbook.md` beschreibt die 8 Schritte, Timeline-Seed-Vorbedingungen und den Timeline-Verify; die alte "Kein Timeline-Restore"-Luecke ist entfernt/geschlossen.
- [ ] `bash -n scripts/db-rebuild.sh` ist gruen.
- [ ] `npm run db:rebuild -- --help` zeigt die 8-Schritt-Sequenz und braucht keinen DB-Zugriff.
- [ ] `npm run test:timeline` ist gruen.
- [ ] `npm run test:curation-overlay` ist gruen (Regression fuer gemeinsamen Rebuild-Tail).
- [ ] `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` sind gruen.
- [ ] Implementer-Report ist angelegt, dieser Brief steht auf `status: implemented`.

Wenn der DB-Freeze vor oder waehrend der Session explizit aufgehoben wird, ist zusaetzlich der echte Abschluss:

- [ ] `npm run apply:timeline -- --verify` gegen die Ziel-DB read-only gruen, im Report mit Datum/DB-Kontext vermerkt.

## Open questions

- Keine blockierenden Open Questions. Falls beim Implementieren auffaellt, dass `apply:timeline -- --verify` wegen bestehender Live-DB-Drift unter Freeze nicht real pruefbar ist, nicht raten: DB-freien Test gruen ziehen und den echten DB-Verify als Post-Freeze-Schritt im Report notieren.

## Notes

- Minimum = Verify-Modus + pure Diff/Test + Rebuild-Tail + Runbook + Verifikation + Report/Brief-Status. Der pure Test ist wegen DB-Freeze nicht Kuer, sondern das testbare Herz der Session.
- Fuer Textsuche in `scripts/apply-timeline-data.ts` ggf. `rg -a` nutzen: die Datei enthaelt aktuell ein NUL-Trennzeichen in einem internen Lookup-Key und wird von `rg` sonst als binary behandelt.
- Bestehende Muster:
  - Verify-Philosophie: `scripts/apply-audiobook-narrators.ts`.
  - Pure Diff-/Test-Aufteilung: `scripts/curation-overlay.ts` + `scripts/test-curation-overlay.ts`.
  - Rebuild-Orchestrator: `scripts/db-rebuild.sh`.
