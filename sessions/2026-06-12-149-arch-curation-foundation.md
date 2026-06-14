---
session: 2026-06-12-149
role: architect
date: 2026-06-12
status: implemented
slug: curation-foundation
parent: null
links:
  - 2026-06-03-122
  - 2026-06-14-151
commits: []
---

# Kurations-Fundament — Hand-Override-Overlay als deterministischer Tail (unter DB-Freeze) (Board 122-B2)

> **Revidiert 2026-06-14.** Ursprünglich verlangte dieser Brief Beispiel-Apply gegen Prod, `db:rebuild`-Beweis und Content-Warning-Entfernung aus der DB. Das kollidiert mit dem aktuellen **DB-Freeze** (die Prod-DB soll erstmal stehenbleiben). Neuschnitt: **Fundament bauen + gegen Scratch/Test-DB bzw. per Dry-Run/Unit-Integration beweisen — keine Prod-Mutation.** Content-Warning-Daten bleiben in der DB (Display-Seite ist bereits in Brief 150 abgeräumt). Der operative Vor-Brief [151](./2026-06-14-151-arch-weekly-refresh-hardening.md) (Weekly-Refresh-Hardening) läuft **davor**.

## Goal

Philipp kann ein einzelnes Buch von Hand korrigieren (Faction raus/rein, Feld-Fix, Junction-Korrektur), und diese Korrektur **überlebt** jede künftige Resolver-Welle, jeden Konsolidierungs-Pass und einen `db:rebuild`. Diese Session baut das **Fundament** dafür — Format, Parser/Validator, programmatischer Overlay-Apply mit Dry-Run/Verify — und **beweist die Vorrang-Garantie ohne Prod-Mutation** (Scratch/Test-DB oder Dry-Run/Unit-Integration).

## Context

- Board [122-B2](./2026-06-03-122-arch-batches-board.md) (ex-OQ 3), seit Wochen offen; vorgezogen, weil zwei Folge-Pakete darauf bauen: die **Admin-Seite** (Product, separater Brief) und der **große Buch-Reviewer** (122-B11) über alle 889 Bücher, dessen Findings als Hand-Overrides bzw. in die Review-Queue landen sollen.
- **Die eigentliche Schwierigkeit ist die Vorrang-Mechanik, und sie ist strukturell.** `apply-override.ts` rekonstruiert die Junctions `work_factions`/`work_locations`/`work_characters` per **delete-then-insert keyed auf `workId`** aus der Batch-Override-Datei (`tx.delete(workFactions).where(eq(..workId))` → re-insert). Ein erneuter Auto-Apply eines Buch-Batches **baut die Junctions also komplett aus dem Batch-File neu** — eine Hand-Korrektur, die bloß auf `source_kind='manual'` hofft, wird dabei überschrieben (bei Additions) bzw. wieder eingefügt (bei Suppressions). Die Hand-Override muss deshalb ein **deterministischer Tail/Overlay sein, der NACH dem Auto-Apply/Rebuild läuft**.
- **Es gibt ein bewährtes Muster im Bestand:** `apply:audiobook-narrators` (Brief 105/107). Der Audio-Pfad schreibt aus einem committeten **Sidecar-JSON** (`scripts/seed-data/audiobook-narrators.json`, mit Provenance `source_kind`/`confidence`/`checkedAt`), **scopt seinen Delete auf die Rollen, die er besitzt** (narrator/co_narrator/full_cast), und läuft als **letzter Schritt** in `db-rebuild.sh` (Schritt 3/4). Genau deshalb überlebt er jede SSOT-/Resolver-Re-Apply: jeder Writer scopt seinen Delete auf seine eigenen Rows. Das Hand-Override-Overlay ist die Verallgemeinerung dieses Musters auf maintainer-entschiedene Edges.
- Leitbild-Schwachstelle: `primaryEraId` wird von jedem SSOT-Upsert überstempelt (OQ 16b) — genau diese Klasse von Verlust soll für Hand-Kuration ausgeschlossen sein.
- `db:rebuild` = reset works → re-apply aller 859 Batches → Tail (`apply:audiobook-narrators`, scoped-delete) → Verify. Hand-Overrides brauchen denselben Platz in der Reset-Sequenz.

## Constraints

- **DB-Freeze — keine Prod-Mutation.** Diese Session schreibt die Prod-DB **nicht**: kein Prod-`db:migrate`, kein Prod-`db:apply-override`, kein Prod-`db:rebuild`, kein Live-Cleanup. Alle Beweise laufen gegen eine **Scratch/Test-DB** oder per **Dry-Run + Unit-/Integrationstest**. Das Beispiel-Override wird **committed, aber nicht gegen Prod appliziert**.
- **Overlay-Architektur (Kern-Entscheidung).** Der Hand-Override-Apply ist ein **deterministischer Tail nach Auto-Apply/Rebuild**, nicht ein `source_kind='manual'`-Schutz im Auto-Pfad. Er muss **beide** Richtungen können: **Additions** (Edge/Wert, den der Auto-Pfad nicht erzeugt) **und Suppressions** (einen auto-getaggten Faction/Location/Character-Edge entfernen, den der Auto-Pfad sonst wieder einfügt). Idempotent: doppelter Overlay-Apply = No-op. Modell: `apply-audiobook-narrators.ts` (Sidecar-JSON + scoped/zielgenaues Schreiben + Tail-Platz).
- **Vorrang-Garantie testbar.** Nach Auto-Apply (bzw. Rebuild) **und** Overlay-Tail spiegelt die DB die Hand-Entscheidung — bewiesen gegen Scratch/Test-DB oder per Integrationstest. Die Garantie ist die Architektur dieser Session; nimm dir dafür den Platz im Report („Decisions I made").
- **Format trennt „final" vs. „Review-Queue" maschinenlesbar.** `final` = maintainer-entschiedene Werte, die das Overlay **appliziert**. `reviewQueue` = vorgeschlagene Werte (vom B11-Reviewer / Weekly-Refresh), die **nicht** appliziert werden, nur maschinenlesbar mitgeführt, bis sie zu `final` promotet werden. Das Overlay appliziert **ausschließlich** `final`. Datei-Konvention + kurzes README/Schema.
- **Provenance:** jede Hand-Row trägt `source_kind` + `confidence` (+ `checkedAt`); bestehende Konventionen wiederverwenden (Sidecar-JSON wie `audiobook-narrators.json` — Provenance lebt im committeten File, nicht zwingend in neuen Spalten).
- **Schema-Änderung vermeiden, wenn möglich.** Spiegle den Narrator-Sidecar — der braucht **keine** Migration. Falls eine Spalte doch zwingend nötig ist: Migration generieren + committen, aber **nur gegen Scratch/Test applizieren, nie Prod**; Begründung in den Report. Committe Migrationen nie umbenennen/löschen.
- **Programmatisch aufrufbar:** Der Overlay-Apply-Pfad muss ohne Mensch-im-Terminal nutzbar sein (Funktion/Script mit klarer Signatur + Dry-Run-Modus) — die spätere Admin-Seite ruft ihn auf.
- **Content-Warnings — Daten bleiben.** **Kein** DB-Cleanup, **kein** Entfernen von `content_warning`-Facet-Rows. Die Anzeige ist bereits in Brief 150 entfernt (`src/lib/facet-visibility.ts` filtert `content_warning` aus allen UI-Konsumenten). Mehr interne Daten sind okay, solange sie public nicht durchschlagen. Einzige Anforderung hier: stelle sicher, dass das neue Overlay Content-Warnings **nicht versehentlich wieder in die Besucher-UI/Ask/Archive** zurückbringt (z. B. wenn das Overlay Facets schreiben kann, respektiert der Lesepfad weiter `isVisibleFacetCategory`).

## Out of scope

- **Keine Admin-UI** — eigener Product-Brief auf diesem Fundament.
- **Kein Reviewer-Lauf** (122-B11) — nur das Format + die Review-Queue, die seine Findings später aufnimmt.
- **Kein Content-Warning-Cleanup-Script, keine DB-Bereinigung** (gestrichen ggü. der Erstfassung — Daten bleiben).
- **Kein Dead-Code-Retirement** (122-B6 ist separat).
- **Keine Prod-DB-Mutation** (siehe Constraints).
- Keine Änderungen an `eras`/`events`/Timeline-Daten über den ggf. mitgenommenen 16a-Tail hinaus.

## Acceptance

The session is done when:

- [ ] Es gibt ein dokumentiertes Hand-Override-Format (Datei-Konvention + kurzes README/Schema) mit maschinenlesbarer Trennung „final" vs. „reviewQueue".
- [ ] Parser/Validator existiert: malformes/ambiges Override scheitert laut vor jeder Mutation (Muster der bestehenden `validate*`-Pre-Pässe in `apply-override.ts`).
- [ ] Ein programmatischer Overlay-Apply mit **Dry-Run + Verify** existiert (klare Signatur, von der Admin-Seite aufrufbar), der **Additions und Suppressions** als deterministischer Tail nach Auto-Apply/Rebuild umsetzt; doppelter Apply = No-op (Zähler im Report).
- [ ] Ein beispielhafter Hand-Fix (z. B. eine Faction von einem Buch entfernen + ein Feld korrigieren) ist als `final`-Override **committed** — **nicht** gegen Prod appliziert.
- [ ] Der **Beweis der Vorrang-Garantie** steht im Report — gegen **Scratch/Test-DB** oder per **Dry-Run/Unit-Integration**: nach erneutem Resolver-/SSOT-Apply **und** nach `db:rebuild`+Tail (auf Scratch) ist der Hand-Fix unverändert. **Kein Prod-Lauf.**
- [ ] Einbau-Plan in die `db:rebuild`-Tail-Sequenz dokumentiert (Runbook-Update); auf Scratch/Dry-Run verifiziert. OQ 16a (`apply:timeline` als Tail) gleich miterledigen **nur wenn es derselbe Handgriff in `db-rebuild.sh` ist** — sonst explizit lassen und im Report sagen warum (keine Prod-Rebuild-Pflicht dafür).
- [ ] `npm run lint` + `tsc --noEmit` + bestehende Tests grün. **Keine** Prod-DB-Mutation in dieser Session.

## Open questions

- Empfiehlst du für die Review-Queue eine eigene Datei pro Quelle (Reviewer-Pass, Weekly-Refresh) oder einen gemeinsamen Eingang? (Das Format muss beide B11-Findings und Weekly-Refresh-Promotions aufnehmen können.)
- Reicht ein Sidecar-JSON (narrator-Muster, migrationsfrei) für alle Hand-Fix-Klassen (Junction-Add/Remove **und** Hard-Field-Fix wie Format/Synopsis), oder braucht ein Hard-Field-Fix einen anderen Eingang? (Begründung in den Report.)
- *(Optional, reine Neugier — keine Aktion):* Wie viele der 889 Bücher tragen heute `content_warning`-Facet-Rows? Zahl in den Report, falls billig.

## Notes

- Strang: Batches (`chrono-lexicanum-batches`), Branch `codex/ingest-batches-curation-foundation` o. ä.; Code → PR.
- Der Vorrang-Mechanismus (Overlay-Tail, Additions+Suppressions, idempotent) ist die eigentliche Architektur-Entscheidung dieser Session — nimm dir dafür den Platz im Report.
- Reihenfolge: **nach [151](./2026-06-14-151-arch-weekly-refresh-hardening.md)** (operativer Preflight zuerst).
