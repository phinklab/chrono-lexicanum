---
session: 2026-06-14-149
role: implementer
date: 2026-06-14
status: complete
slug: curation-foundation
parent: 2026-06-12-149
links:
  - 2026-06-14-151
commits: []
---

# Kurations-Fundament — Hand-Override-Overlay als deterministischer Tail (unter DB-Freeze)

## Summary

Das Hand-Override-Fundament steht: ein committetes Sidecar (`curation-overlay.json`) + Validator + programmatischer Overlay-Apply (`apply:curation-overlay`, Dry-Run/Verify) + Tail-Slot in `db-rebuild.sh`. Die Vorrang-Garantie (Additions **und** Suppressions überleben jede Welle/Rebuild) und Idempotenz sind **gegen eine In-Memory-Integration bewiesen, nicht gegen Prod** — **keine** Prod-DB-Mutation in dieser Session (DB-Freeze respektiert).

## What I did

- `scripts/curation-overlay.ts` — **pure core** (DB-frei): Format-Typen, lauter Validator (`validateOverlay`), `computeBookOps` (die intendierten Writes pro Buch, zustands­unabhängig → unbedingt-idempotent), `diffBookOps` (klassifiziert jede Op gegen den DB-Zustand: `change`|`noop`; treibt Dry-Run, Verify und den Idempotenz-Beweis).
- `scripts/apply-curation-overlay.ts` — DB-verdrahteter Apply mit `--dry-run` / `--verify` / `--file`; exportiert `applyCurationOverlay({dryRun,verify,file})` für die spätere Admin-Seite. Scoped per-Edge `(workId, entityId)`: Suppression = `delete`, Addition = `onConflictDoUpdate`-Upsert; Feld-Fix = scoped Spalten-Write auf `works`/`book_details` (Patch getypt gegen `bookDetails.$inferInsert`, `format` auf das `book_format`-Enum verengt — kein `as never` mehr). Per-Buch-Transaktion. Der Run-Erfolg läuft über den puren `isRunOk(verify, verifyOk, unresolvedCount)`: ein unaufgelöstes `final`-Buch lässt **jeden** Modus (apply/dry-run/verify) mit Exit 1 scheitern.
- `scripts/test-curation-overlay.ts` — **der Beweis** (DB-frei, 33 Fälle): committetes Sidecar valid, ~22 Validator-Negativfälle (inkl. Cross-Section-Dup: ein Buch in `final` **und** `reviewQueue`), die `isRunOk`-Gate-Logik, und die Vorrang-/Idempotenz-Simulation über einen In-Memory-Junction-Store.
- `scripts/seed-data/curation-overlay.json` — **committetes Beispiel-Override** (The Magos / W40K-0010): Faction-Suppression (`chaos`) + Faction-Addition (`ordo_malleus`) + Feld-Fix (`format: novel → collection`, deckt sich mit dem dokumentierten `data_conflict`). Plus ein `reviewQueue`-Eintrag (carried, **nicht** appliziert). **Nicht gegen Prod appliziert.**
- `scripts/seed-data/curation-overlay.README.md` — Format-/Schema-Doku.
- `scripts/db-rebuild.sh` — Tail-Schritte 5 (apply) + 6 (verify) nach dem Audio-Tail; Labels 1/4→1/6 etc. `bash -n` grün, `--help` grün.
- `scripts/runbooks/db-rebuild-runbook.md` — Sequenz auf 6 Schritte erweitert; Vorbedingung 4 + Verify-Sektion nachgezogen; **OQ-16a-Lücke ehrlich dokumentiert** (s. u.).
- `package.json` — `apply:curation-overlay` + `test:curation-overlay`.

## Decisions I made

**Vorrang-Mechanik: Tail mit Per-Edge-Scoping (nicht Per-Rolle).** Das ist die eigentliche Architektur-Entscheidung. `apply-override.ts` baut die Junctions per `delete(...).where(eq(workId))` + re-insert aus dem Batch neu (apply-override.ts:1010-1049) — ein `source_kind='manual'`-Schutz im Auto-Pfad überlebt das nicht. Modell ist `apply:audiobook-narrators`: committetes Sidecar + scoped Writes + Tail-Platz in `db-rebuild.sh`. **Unterschied zum Narrator-Pfad:** der Audio-Pfad scopt seinen Delete auf die **Rollen**, die er besitzt (narrator/co_narrator/full_cast). Die Hand-Kuration operiert auf **denselben** Rollen wie der Auto-Pfad (Factions/Locations/Characters jeder Rolle), kann also **nicht** per-Rolle scopen. Sie scopt auf die exakte **Edge**: eine Junction-Row ist eindeutig `(workId, entityId)` (das ist der PK aller drei Junctions). Daraus folgt beides sauber — **Addition** = Upsert genau dieser Row, **Suppression** = Delete genau dieser Row. Der Auto-Pfad wischt beide bei der nächsten Welle weg; der Tail läuft **danach** und stellt sie wieder her. Idempotent von Natur aus (Delete einer abwesenden Row = No-op; Upsert; exakter Feld-Wert).

**Suppression läuft garantiert nach dem Auto-Apply.** In `db-rebuild.sh` ist das Overlay Schritt 5/6 — **nach** der Auto-Re-Apply (Schritt 2) und nach dem Audio-Tail. Im Routine-Betrieb ist es ein eigener Tail-Lauf nach der Welle. Der Test beweist explizit: ohne Tail bringt eine Welle die suppress­te Edge zurück (`chaos` wieder da, `ordo_malleus` weg, `format` zurück auf `novel`); **mit** erneutem Tail ist der Hand-Fix wiederhergestellt.

**Beweis gegen In-Memory-Integration, nicht Prod (DB-Freeze).** Der Brief erlaubt „Scratch/Test-DB **ODER** Dry-Run/Unit-Integration". Ich habe Letzteres gewählt: `test-curation-overlay.ts` modelliert den Junction-Store in-memory und fährt **dieselbe** `computeBookOps`-Logik, die der Apply nutzt, plus eine getreue Simulation des Auto-Pfads (delete-all-for-workId → re-insert; `primary_era_id`-Überstempelung auf `time_ending` wie der M41-Stempel). Zähler unten. **Keine** Prod-Verbindung wurde geöffnet — auch kein read-only Dry-Run gegen Prod, um „keine Prod-Mutation" strikt einzuhalten.

**Sidecar reicht für alle Hand-Fix-Klassen (Antwort auf OQ im Brief).** Junction-Add/Remove **und** Hard-Field-Fix (`synopsis`/`format`/`primaryEraId`) laufen migrationsfrei über **ein** Sidecar: Junctions per scoped Edge-Write, Felder per scoped Spalten-Write auf `works`/`book_details`. **Keine Schema-Änderung** — Provenance (`sourceKind`/`confidence`/`checkedAt`/`note`) lebt im committeten File, nicht in neuen Spalten (Narrator-Philosophie). `primaryEraId` ist bewusst als Feld dabei: genau die OQ-16b-Verlustklasse (jeder SSOT-Upsert überstempelt sie) wird so für Hand-Kuration ausschließbar.

**Review-Queue: ein gemeinsamer Eingang, eine Form (Antwort auf OQ im Brief).** `final` und `reviewQueue` teilen dieselbe Buch-Form in **einer** Datei. `final` wird appliziert + voll validiert (Referenz-Existenz, `book_format`-Enum, Era-ID, Synopsis-Banned-Pattern-Guard). `reviewQueue` wird **nur strukturell** validiert (ein Vorschlag darf eine noch nicht existierende ID nennen) und **nie** appliziert. Promotion = Buch-Eintrag von `reviewQueue` nach `final` schieben. Nimmt B11-Findings **und** Weekly-Refresh-Promotions auf, ohne pro-Quelle-Dateien.

**Content-Warnings bleiben (kein Cleanup) — Overlay kann sie nicht zurückbringen.** Das Overlay hat **keine** Facet-Sektion und kann strukturell **keine** `work_facets` schreiben → es kann nie eine `content_warning`-Row in die Besucher-UI zurückbringen (Brief 149/150; Lesepfad filtert ohnehin via `isVisibleFacetCategory`). Ein verirrter `facets`-Key im Override scheitert laut im Validator. Facet-Kuration ist bewusst out-of-scope.

**OQ 16a (`apply:timeline` als Tail) bewusst gelassen — nicht „derselbe Handgriff".** Es ist **kein** trivialer Ein-Zeilen-Add: `apply:timeline` hat **keinen** `--verify`-Modus (passt nicht ins verify-gegatete Rebuild-Muster), remappt `book_details.primary_era_id` (Reihenfolge-Interaktion mit dem Curation-`primaryEraId`-Feld) und gehört der Timeline-Domäne an (Brief sagt: nicht über einen *trivialen* 16a-Tail hinausgehen). Hinweis im Report **und** im Runbook: `TRUNCATE works CASCADE` räumt `event_works` (FK→works) mit; der Rebuild stellt es heute **nicht** wieder her — eine reale, separat zu schließende Lücke (eigener kleiner Brief, keine Prod-Rebuild-Pflicht).

## Verification

- `npm run lint` (`eslint .`) — **pass** (ganzes Projekt).
- `npx tsc --noEmit` — **pass**.
- `npm run test:curation-overlay` — **pass, 33/33.** Davon:
  - Validator: committetes Sidecar valid; ~22 Negativfälle scheitern laut (bad externalBookId, Duplikat, stray `facets`-Key, unbekannte Rolle, unbekannte Referenz-ID in `final`, gleiche ID in add+remove, Suppression ohne Reason, confidence∉[0,1], non-ISO checkedAt, ungültiges `book_format`, unbekannte Era, nicht-schreibbares Feld, Synopsis-Banned-Pattern, leerer Eintrag, **Cross-Section-Dup: gleiches Buch in `final` und `reviewQueue`**); `reviewQueue` mit unbekannter ID wird **nicht** abgelehnt.
  - `isRunOk` (DB-frei): apply/dry-run grün bei allen aufgelöst; ein unaufgelöstes `final`-Buch failt apply/dry-run **und** verify; verify failt bei unerfülltem Diff.
  - **Vorrang/Idempotenz (Zähler):** nach Auto-Apply → Diff = **3 changes** (1 add + 1 remove + 1 field), `satisfied=false`. Nach Tail → **0 changes**, `satisfied=true` (= die `--verify`-Post-Condition). Zweiter Tail-Apply → **0 changes** (Idempotenz). Erneute Welle ohne Tail → `satisfied=false` (Drift, Hand-Fix weg). Welle **+** Tail → `satisfied=true` (Garantie wiederhergestellt).
- Regression der geteilten Module: `npm run test:audiobook-narrators` (12/12) + `npm run test:synopsis-lint` (14/14) grün.
- `bash -n scripts/db-rebuild.sh` grün; `--help` zeigt die 6-Schritt-Sequenz.
- **Keine** Prod-DB-Mutation: kein `db:migrate`/`db:apply-override`/`db:rebuild`/Cleanup gelaufen. Das Beispiel-Override ist committed, **nicht** appliziert.

## Open issues / blockers

Keine Blocker.

- **`apply:curation-overlay --dry-run`/`--verify` gegen Prod ungelaufen** (bewusst, DB-Freeze). Beide sind read-only und bereit; wenn die DB wieder offen ist, ist der natürliche erste Lauf ein `--dry-run` gegen die Ziel-DB.
- **Unaufgelöstes `final`-Buch = Fehler in jedem Modus.** `apply`, `--dry-run` und `--verify` geben Exit 1, sobald ein `final`-Buch nicht zu einer `works.id` auflöst (vertippte `externalBookId`) — der Dry-Run zeigt den Tippfehler **vor** dem Apply. Gate ist der pure `isRunOk(verify, verifyOk, unresolvedCount)` (DB-frei getestet). Der Apply mutiert das unaufgelöste Buch nicht (skippt es einzeln), wendet die auflösbaren Bücher idempotent an und meldet danach den Fehler — so failt auch Rebuild-Schritt 5, nicht erst der Verify-Schritt 6. (Ursprünglich war nur Verify streng; auf Maintainer-Wunsch verschärft, weil ein `final`-Override für ein nicht-existentes Buch nie legitim ist.)

## For next session

- **Admin-Seite** (Product-Brief, separat) ruft `applyCurationOverlay({dryRun})` auf — Signatur + `OverlayRunResult` (Zähler) stehen bereit.
- **B11-Reviewer** befüllt `reviewQueue`; Promotion-Schritt ist „Eintrag nach `final` schieben".
- **OQ 16a / Timeline-Restore-Lücke** als eigener kleiner Brief (idealerweise erst `--verify` zu `apply:timeline` hinzufügen, dann als Tail 7/8 in `db-rebuild.sh`; Reihenfolge: vor dem Curation-Tail, weil das Curation-`primaryEraId`-Feld zuletzt gewinnen muss).
- **Content-Warning-Zahl (optionale Neugier):** aus den committeten Overrides tragen **886 von 889** Büchern ≥1 `cw_`-Facet (2353 Rows, 13 distinct `cw_`-IDs). Billig aus den Seed-JSONs gezählt (kein Prod-Query). Unterstreicht, warum das Overlay Facets nicht anfassen darf.

## References

- Modell: `scripts/apply-audiobook-narrators.ts`, `scripts/test-audiobook-narrators.ts` (Brief 105/107).
- Vorrang-Problem: `scripts/apply-override.ts` (Junction delete-then-insert, Z. 1010-1049).
- Brief: `sessions/2026-06-12-149-arch-curation-foundation.md` (revidiert 2026-06-14).
