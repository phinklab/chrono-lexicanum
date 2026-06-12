---
session: 2026-06-12-149
role: architect
date: 2026-06-12
status: open
slug: curation-foundation
parent: null
links:
  - 2026-06-03-122
commits: []
---

# Kurations-Fundament — Hand-Override-Format + Apply-Pfad + Content-Warnings raus (Board 122-B2)

## Goal

Philipp kann ein einzelnes Buch von Hand korrigieren (Faction raus/rein, Feld-Fix, Junction-Korrektur), und diese Korrektur **überlebt** jede künftige Resolver-Welle, jeden Konsolidierungs-Pass und einen `db:rebuild`. Dazu: Content-Warnings verschwinden aus den Daten.

## Context

- Board [122-B2](./2026-06-03-122-arch-batches-board.md) (ex-OQ 3), seit Wochen offen; jetzt vorgezogen, weil zwei Folge-Pakete darauf bauen: die **Admin-Seite** (Product, separater Brief) und der **große Buch-Reviewer** über alle 889 Bücher, dessen Findings als Hand-Overrides landen sollen.
- Es gibt bereits Override-Mechanik im Bestand: `BookV2Record.fields.<f>.override` (Board-Guardrail), die batch-keyed Override-JSONs unter `scripts/seed-data/`, `apply-override.ts` (friert z. B. `slug`/`title` on update ein), und per-Row-Provenance-Muster (`source_kind`, `confidence`, `sourceUrl`, `checkedAt` — vgl. `audiobook-narrators.json`, `*-blurbs.json`). Was fehlt, ist die **definierte Schicht für Maintainer-Hand-Fixes**: ein Format, ein Eingang, eine garantierte Vorrang-Regel.
- Bekannte Schwachstelle als Leitbild: `primaryEraId` wird von jedem SSOT-Upsert überstempelt (OQ 16b) — genau diese Klasse von Verlust soll für Hand-Kuration ausgeschlossen sein.
- `db:rebuild` hat bereits das Muster „deterministischer Restore-Tail" (`apply:audiobook-narrators`, Brief 107; `apply:timeline` als Interim-Regel, OQ 16a). Hand-Overrides brauchen denselben Platz in der Reset-Sequenz.

## Constraints

- **Vorrang-Garantie:** Eine Hand-Override gewinnt gegen jeden automatischen Writer (Resolver, Konsolidierung, Weekly-Refresh-Apply). Mechanik frei wählbar (z. B. `source_kind='manual'`-Schutz im Apply, Re-Apply als Tail), aber die Garantie muss testbar sein.
- **Format definiert „was auto rollt / was Augen braucht":** Das Override-Format unterscheidet maintainer-entschiedene Werte (final) von vorgeschlagenen Werten (Review-Queue). Wie die Queue aussieht, ist deine Wahl — sie muss nur existieren und maschinenlesbar sein (der Reviewer-Pass wird sie befüllen).
- **Provenance:** jede Hand-Row trägt `source_kind` + `confidence` (+ `checkedAt`); bestehende Konventionen wiederverwenden.
- **Idempotent + rebuild-fest:** doppelter Apply = No-op; Einbau in die `db-rebuild`-Tail-Sequenz (Runbook-Update gehört dazu). Erledige dabei OQ 16a gleich mit (`apply:timeline` als Tail), wenn es derselbe Handgriff ist — sonst explizit lassen und im Report sagen warum.
- **Content-Warnings:** raus aus den Daten — Feld(er)/Werte nicht mehr schreiben und Bestand bereinigen. Ob Schema-Spalte fällt (Migration) oder nur leerläuft, ist deine Entscheidung; Begründung in den Report. Die **Anzeige**-Seite wird parallel in Brief 150 (Product) entfernt — nicht hier anfassen.
- **Programmatisch aufrufbar:** Der Apply-Pfad muss ohne Mensch-im-Terminal nutzbar sein (Funktion/Script mit klarer Signatur) — die spätere Admin-Seite ruft ihn auf.
- Schema-Änderung + generierte Migration zusammen committen; Migrationen nie umbenennen/löschen.

## Out of scope

- **Keine Admin-UI** — die kommt als eigener Product-Brief auf diesem Fundament.
- **Kein Reviewer-Lauf** — nur das Format, das seine Findings später aufnehmen kann.
- **Kein Dead-Code-Retirement** (122-B6 ist separat; auch wenn du daran vorbeikommst).
- Keine Änderungen an `eras`/`events`/Timeline-Daten über den ggf. mitgenommenen 16a-Tail hinaus.

## Acceptance

The session is done when:

- [ ] Es gibt ein dokumentiertes Hand-Override-Format (Datei-Konvention + kurzes README/Schema) mit Trennung „final" vs. „Review-Queue".
- [ ] Ein beispielhafter Hand-Fix (z. B. eine Faction von einem Buch entfernen + ein Feld korrigieren) ist committed und appliziert.
- [ ] Der Beweis steht im Report: nach einem erneuten Resolver-/SSOT-Apply **und** nach `db:rebuild` (+ Tail) ist der Hand-Fix unverändert in der DB.
- [ ] Content-Warnings sind aus der DB verschwunden (Bestand bereinigt, Writer schreiben sie nicht mehr).
- [ ] Doppelter Apply des Hand-Override-Pfads ist ein No-op (Zähler im Report).
- [ ] `npm run lint` + `tsc --noEmit` + bestehende Tests grün.

## Open questions

- Wie viele der 889 Bücher tragen heute überhaupt Content-Warning-Daten? (Zahl in den Report — reine Neugier + Aufwands-Check.)
- Empfiehlst du für die Review-Queue eine eigene Datei pro Quelle (Reviewer-Pass, Weekly-Refresh) oder einen gemeinsamen Eingang?

## Notes

- Strang: Batches (`chrono-lexicanum-batches`), Branch `codex/ingest-batches-curation-foundation` o. ä.; Code → PR.
- Der Vorrang-Mechanismus ist die eigentliche Architektur-Entscheidung dieser Session — nimm dir dafür den Platz im Report („Decisions I made").
