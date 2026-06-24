---
session: 2026-06-16-152
role: implementer
date: 2026-06-16
status: complete
slug: timeline-rebuild-tail
parent: 2026-06-16-152
links:
  - 2026-06-10-137-impl
  - 2026-06-14-149-impl
commits: []
---

# Timeline-Restore als verify-gegateter Tail in `db:rebuild` schliessen (OQ 16a)

## Summary

`apply:timeline` hat jetzt einen read-only `--verify`-Modus, und der Timeline-Restore haengt als Schritt 5/8 + 6/8 **vor** dem Curation-Overlay im `db:rebuild`-Orchestrator — das schliesst OQ 16(a). Die Verify-Vergleichslogik liegt im puren, DB-freien Helper `scripts/timeline-state.ts` (`diffTimelineState`) und ist unter dem DB-Freeze ueber `npm run test:timeline` (23 Faelle) bewiesen; ein echter `apply:timeline -- --verify` gegen die Ziel-DB bleibt der Post-Freeze-Abschluss.

## What I did

- `scripts/timeline-state.ts` — **neu.** Purer, DB-freier Kern: Typen (`HookRow`, `BookDateExpectation`/`BookDateActual`, `ExpectedTimeline`/`ActualTimeline`, `Mismatch`) + `diffTimelineState(expected, actual) -> Mismatch[]`. Exakte Mengen-/Wert-Gleichheit fuer eras, events, event_works (Tupel `eventId+targetType+targetId+role`, plus `displayLabel`/`position`; UUID-`id` ignoriert; nonzero-Gate), book-dates (alle sechs Setting-Felder pro benanntem Slug) und retired `primary_era_id`. Kein `@/db`, kein Filesystem → vom Test frei importierbar.
- `scripts/apply-timeline-data.ts` — `--verify`-Flag in `parseArgs`; harter Abbruch (Exit 1) bei `--verify` + `--dry-run`; read-only `verifyAgainstDb()` + `readBookDateActuals()` + `printVerifyReport()`. Verify reuse-t die bestehenden read-only Stages (`parse*` + `resolveAgainstDb`), baut daraus den Expected-State, laedt den Actual-State mit reinen SELECTs und vergleicht via `diffTimelineState`. Kein `applyAll`, kein `planRemap`, keine Mutation. Docstring-CLI-Block ergaenzt.
- `scripts/test-timeline.ts` — **neu.** DB-freier Test nach dem `test-curation-overlay.ts`-Muster (`node:assert/strict`, ein `check()` pro Fall). 23 Faelle: Happy Path; era/event missing/stale + retired-present; event_works missing/extra/wrong targetType/targetId/role/displayLabel/position + nonzero-Gate; book-date Drift fuer alle sechs Felder + Slug-ohne-DB-Row; retired primary era; Mehrfach-Akkumulation.
- `package.json` — `test:timeline`-Script ergaenzt (neben `test:curation-overlay`).
- `scripts/db-rebuild.sh` — von 6 auf **8 Schritte**: Timeline-Apply (5/8) + Timeline-Verify (6/8) **vor** Curation-Apply (7/8) + Curation-Verify (8/8). Alle `/6`-Labels, der Header-Kommentar, der `print_help()`-Sequenzblock, die `step`-Labels und das Schluss-`echo` auf `/8` gezogen; Reihenfolge-Kommentare erklaeren *warum* (Timeline nach Korpus-Re-Apply, vor Curation).
- `scripts/runbooks/db-rebuild-runbook.md` — Sequenz auf 8 Schritte; Vorbedingung 4 um die vier Timeline-Seed-JSONs ergaenzt; "Kein Timeline-Restore (offene Luecke)"-Note durch eine "geschlossen seit Brief 152"-Note ersetzt; Timeline-Verify-Sektion (exakte Set-/Wert-Gleichheit, read-only); DB-Freeze-Hinweis; Anhang-Provenance fuer Brief 149/152.
- `sessions/2026-06-16-152-arch-timeline-rebuild-tail.md` — Brief in den Batches-Worktree gezogen und `status: open -> implemented` gesetzt (siehe "Decisions").

## Decisions I made

- **Pure Helper in eigenem Modul statt `isMain`-Umbau** (Brief Task 2, bevorzugte Variante). `apply-timeline-data.ts` fuehrt `main()` beim Import aus; ein separates `scripts/timeline-state.ts` haelt die Vergleichslogik DB-frei und vom Test importierbar, ohne den Apply-Pfad anzufassen. Das spiegelt exakt die `curation-overlay.ts` + `test-curation-overlay.ts`-Aufteilung aus Brief 149.
- **Identitaet = `eventId+targetType+targetId+role`, UUID `id` ignoriert.** `event_works.id` ist `defaultRandom()` und wird beim wholesale-Rebuild neu vergeben — es traegt keine Cross-Rebuild-Bedeutung. `targetType` (`work`/`series`) ist Teil des Schluessels, damit eine work-UUID nie mit einer seriesId aliasen kann. `displayLabel` + `position` werden zusaetzlich verglichen (Brief: Label-/Sortierdrift darf nicht durchrutschen).
- **numeric(10,3)-Roundtrip + NULL-Mapping.** `works.start_y/end_y` kommen als String ("30730.000") zurueck → `Number(...)`; NULL → `NaN`, sodass eine geleerte Spalte nie faelschlich einer JSON-Zahl gleicht. Nullable Text-Spalten (`settingDateLabel`/`-Method`/`-Confidence`) lesen NULL als `""`, koennen also nie einem realen Label gleichen; `settingAnchorEventId` bleibt `string | null` (Erwartung darf selbst `null` sein).
- **`--verify` + `--dry-run` Guard ganz oben in `main()`**, vor Stage 1/2 und vor jedem DB-Query. Verifiziert: Exit 1, keine DB-Verbindung (der postgres-Client verbindet lazy beim ersten Query). Read-only-Vergleich vs. Write-Plan sind unvereinbar — still eine Prioritaet zu waehlen wuerde einen Aufrufer-Fehler verstecken.
- **Reihenfolge Timeline (5/8+6/8) vor Curation (7/8+8/8).** Beide Pfade koennen `book_details.primary_era_id` schreiben: `apply:timeline` remappt beim Retirement von `age_rebirth`/`long_war`, das Curation-Overlay hat ein `primaryEraId`-Feld-Fix. Hand-Kuration muss **zuletzt** gewinnen → Timeline lauft davor. Timeline lauft seinerseits **nach** dem Korpus-Re-Apply (Schritt 2), weil jeder Hook und jede book-date gegen eine existierende `works.id` aufgeloest wird.
- **Brief in den Batches-Worktree kopiert + `status: implemented`.** Der Brief lag uncommitted im Koordinations-Worktree (`chrono-lexicanum`), nicht auf `origin/main`. Nach dem "code-handing brief"-Muster (CLAUDE.md § Git) reist er im Code-PR mit; ich habe ihn hierher gezogen und den Status geflippt. **Achtung Cowork/Philipp:** die uncommitted Kopie im Koordinations-Worktree danach verwerfen (nicht doppelt committen) — die kanonische Version kommt mit diesem PR auf `main`.
- **Kein Prod-Run unter Freeze.** Gemaess Brief als geltend angenommen: kein Prod-`db:rebuild`, kein Prod-`apply:timeline`, kein Prod-Write. Der echte DB-Verify ist als Post-Freeze-Schritt notiert (siehe "For next session").

## Verification

- `npm run typecheck` (`tsc --noEmit`) — pass.
- `npm run lint` (`eslint .`) — pass.
- `npm run test:timeline` — pass (23/23).
- `npm run test:curation-overlay` — pass (33/33; Regression fuer den gemeinsamen Rebuild-Tail).
- `npm run brain:lint -- --no-write` — **0 blocking** (13 pre-existing warnings, keine durch diese Session; `brain/**` unangetastet).
- `bash -n scripts/db-rebuild.sh` — SYNTAX OK; keine `/6`-Reste mehr (`grep` leer).
- `npm run db:rebuild -- --help` — zeigt die 8-Schritt-Sequenz, Exit 0, **kein DB-Zugriff**.
- `DATABASE_URL='postgres://u:p@127.0.0.1:1/db' npx tsx scripts/apply-timeline-data.ts --verify --dry-run` — Exit 1 mit der Mutually-exclusive-Meldung, **ohne** DB-Verbindung (Guard feuert vor Stage 1/2).
- **NICHT gefahren (DB-Freeze):** `npm run db:rebuild -- --confirm`, `npm run apply:timeline`, `npm run apply:timeline -- --verify` gegen Prod. Bewusst ausgelassen.

## Open issues / blockers

Keine. Der echte `apply:timeline -- --verify` gegen die Ziel-DB ist unter dem Freeze nicht gefahren worden; die Verify-Logik ist stattdessen DB-frei bewiesen (Brief § Open questions: bei Live-DB-Drift nicht raten — pure Test gruen ziehen, echten DB-Verify als Post-Freeze-Schritt notieren).

## For next session

Fuer Cowork/Philipp (Post-Merge-Koordinations-Pass aus dem Koordinations-Worktree):

- **OQ 16(a) schliessen** in `brain/wiki/open-questions.md` und die alte Interim-Regel "kein Timeline-Restore im Rebuild" aus dem Brain entfernen — die Luecke ist mit diesem PR geschlossen, Timeline-Restore ist Rebuild-Schritt 5/8 + 6/8.
- **Rollup nachziehen** (`log.md`, `project-state.md`, `index.md`, `sessions/README.md`) — im Batches-Worktree bewusst nicht angefasst (Rollup-Ownership).
- **Uncommitted Brief-Kopie im Koordinations-Worktree verwerfen** — die kanonische `status: implemented`-Version kommt mit diesem PR auf `main`.
- **Post-Freeze:** sobald der DB-Freeze aufgehoben ist, `npm run apply:timeline -- --verify` gegen die Ziel-DB read-only fahren und im Report/Brain mit Datum + DB-Kontext vermerken (Brief § Acceptance, zweiter Block). Falls dabei Live-DB-Drift auftaucht (z. B. `primary_era_id`-Placeholder aus OQ 16b), ist das ein eigener Folge-Brief, kein Verify-Bug.

## References

- Brief `sessions/2026-06-16-152-arch-timeline-rebuild-tail.md` (OQ 16a).
- Muster: `scripts/apply-audiobook-narrators.ts` (Verify-Philosophie), `scripts/curation-overlay.ts` + `scripts/test-curation-overlay.ts` (pure Diff-/Test-Aufteilung), `scripts/apply-curation-overlay.ts` (`isMain`-Pattern), `scripts/db-rebuild.sh` (Orchestrator).
- Schema: `src/db/schema.ts` (`eras`, `events`, `event_works`, `works.setting*`, `book_details.primary_era_id`).
