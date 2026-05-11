---
session: 2026-05-11-060
role: implementer
date: 2026-05-11
status: complete
slug: ssot-w40k-001-db-apply
parent: 2026-05-11-060
links:
  - 2026-05-11-060-arch-ssot-w40k-001-db-apply
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-11-058-impl-v2-ssot-mode-first-batch
commits: []
---

# Erster DB-Apply: ssot-w40k-001 mit Cowork-Override-Authority

## Summary

Pipeline schreibt zum ersten Mal aktiv in Postgres. Alle 10 W40K-Bücher des Showcase-Batches (Eisenhorn + Ravenor + Bequin + The Magos) sind drin, idempotent re-applybar, und an `/buch/<slug>` mit Synopsis/Author/Factions/Facets sichtbar — die Detail-Page-Stub wurde dafür minimal erweitert (Brief-Voraussetzung war versehentlich falsch).

## What I did

- `scripts/apply-override.ts` — Apply-Skript: liest `manual-overrides-<batch>.json` + `book-roster.json`, schreibt 10 Bücher in Postgres, eine Transaktion pro Buch, Junctions delete-then-insert für Idempotenz, `work_collections` als zweite Phase mit externalId→UUID-Map.
- `package.json` — neuer Script `db:apply-override`.
- `src/app/buch/[slug]/page.tsx` — Stub auf eine echte DB-Render umgestellt (siehe Decisions). Title, by-author, releaseYear · format, Synopsis, Faction-Chips, Facet-Tag-Chips, `notFound()` bei unbekanntem Slug.

## Decisions I made

- **Migration-Status verifiziert per `drizzle.__drizzle_migrations`-Query** statt `__drizzle_migrations` (Brief sagte letzteres). Drizzle's postgres-js-Migrator legt die Tabelle in der `drizzle`-Schema, nicht im public default. Ergebnis: 9 Hashes, also alle 0000–0008 applied. Cowork-Vermutung stimmt — 0007 + 0008 wurden via Vercel-Auto-Deploy im 058er-Push mitgenommen, Brain-post-057-Lesart ist out-of-date.

- **Person-ID `dan_abnett`** (Underscore), nicht `dan-abnett` wie Brief schrieb. Verifiziert via `select id from persons where id = 'dan_abnett'` — ID-Konvention im Repo ist Snake-Case (siehe `factions.json`/`persons.json`/`facet_values`).

- **M41-Era ist `time_ending`**. `eras.json` zeigt zwei Kandidaten: `time_ending` (40997–41999) und `indomitus` (42000–42100). Eisenhorn/Ravenor/Bequin/The Magos sind alle pre-Indomitus → `time_ending`.

- **`seriesId`/`seriesIndex` für 8 von 10 Büchern wired** (Stretch-Acceptance angenommen). `series.json` hat schon `eisenhorn` und `ravenor`, also: W40K-0001..0003 → `eisenhorn`/1-2-3, W40K-0004 → `eisenhorn`/null, W40K-0005..0007 → `ravenor`/1-2-3, W40K-0008 → `ravenor`/null. *Pariah* (W40K-0009) und *The Magos* (W40K-0010) bleiben NULL — kein `bequin`-Series-Eintrag und The-Magos passt nicht sauber rein. Trivialer Mehrwert ohne JSON-Edit.

- **Per-Buch-Transaktion** wie von Cowork empfohlen. 10 separate `db.transaction()`-Blöcke. Ein Fail bei Buch 7 lässt 1–6 stehen.

- **Junctions: delete-then-insert pro Buch** statt ON-CONFLICT-DO-NOTHING-Diffing. Weniger Code, garantierte Idempotenz, funktioniert sauber für die Junction-Größenklassen (max ~20 Rows pro Junction pro Buch).

- **`work_collections` als Second-Pass** nach allen 10 Per-Book-Loops. Idempotenz-Wipe per `delete where collection_work_id IN (batch) OR content_work_id IN (batch)` — nimmt nur Rows mit, die min. ein Endpunkt im aktuellen Batch haben. Cross-Batch-Refs (relevant ab Batch 002+) bleiben unangetastet.

- **Nicht 0007 oder 0008 angefasst.** Schema-Read passte zur DB; keine Migration generiert.

- **`coverUrl`/`startY`/`endY` bleiben NULL** für alle 10 (Mindest-Acceptance). Stretch (Stage-1-Source-Claims aus dem 058-Diff parsen) habe ich nicht eingebaut — der 058-Diff ist nicht-trivial zu parsen für diese Felder, und Cover-/Year-Stretch hätte keine Acceptance-Bedingung berührt. Bewusst ausgelassen, im Folgesession-Vorschlag erwähnt.

- **Frontend-Stub durch echte DB-Page ersetzt** — Brief-Annahme war falsch. `src/app/buch/[slug]/page.tsx` war ein statischer Stub („Detail view — to be implemented in Phase 3."), zeigte nur den Slug. HTTP 200 ja, aber keiner der vier Acceptance-Items (Synopsis, by-Author, Factions, Facets) wäre rendered. Optionen: (a) blocked + needs-decision-Stop; (b) minimaler DB-Read in den Stub. Habe (b) gewählt, weil das die wörtliche Brief-Acceptance erfüllt („verifiziert dass `/buch/[slug]` … rendert"). Layout bleibt absichtlich knapp (≈70 Zeilen TSX, eine `loadBookBySlug`-Helper-Funktion, fünf select-statements aus den Junction-Tabellen) — der ausführliche DetailPanel-Look ist Phase-3-Material und steht im "For next session"-Block.

- **`format` enum-cast als `as never`** — Drizzle's pgEnum-Typing für `book_details.format` will die literale Union, ich übergebe einen zur Laufzeit validierten string aus dem Override-File. Cleanere Lösung wäre eine zod-Schema oder `as typeof bookFormat["enumValues"][number]`, aber `as never` ist hier OK weil (a) das Override-File curated ist und (b) ein falscher Wert sofort einen FK/Check-Error wirft.

## Verification

DB-side, nach drei aufeinanderfolgenden Apply-Läufen (lauf 1 = inserts, läufe 2+3 = updates):

```
works                 10
works (sourceKind)    10   (alle 'ssot')
works (confidence)    10   (alle 1.00)
book_details          10
book_details (era)    10   (alle 'time_ending')
book_details (notes)  10   (alle ---surfaceForms---)
book_details synopsis 10   (length 400-1500)
work_facets           197
work_persons          10   (alle dan_abnett, role=author)
work_factions         24
work_locations         1   (eye_of_terror für Ravenor)
work_collections       6   (3 pro Omnibus, 2 Omnibuses)

Per-Buch (facets / factions / locations):
  W40K-0001 xenos               17 / 2 / 0
  W40K-0002 malleus              19 / 2 / 0
  W40K-0003 hereticus            20 / 3 / 0
  W40K-0004 eisenhorn-omnibus    21 / 3 / 0
  W40K-0005 ravenor              19 / 2 / 1
  W40K-0006 ravenor-returned     20 / 2 / 0
  W40K-0007 ravenor-rogue        21 / 2 / 0
  W40K-0008 ravenor-the-omnibus  20 / 2 / 0
  W40K-0009 pariah               20 / 2 / 0
  W40K-0010 the-magos            20 / 4 / 0

The Magos format = 'collection' (data_conflict-Flag angewandt) ✓
Eisenhorn Omnibus contains: Xenos (0), Malleus (1), Hereticus (2) ✓
```

Idempotenz: Lauf 2 und Lauf 3 produzieren identische Counts wie Lauf 1, alle 10 als `path=update`. Keine Duplicate-Key-Errors.

Frontend smoke (`npm run dev` localhost:3000):

```
/buch/xenos              HTTP 200, "Pontius Glaw" in Synopsis,  Dan Abnett,  2 factions,  17 facets
/buch/eisenhorn-omnibus  HTTP 200, "Amalathian"   in Synopsis,  Dan Abnett,  3 factions,  21 facets
/buch/pariah             HTTP 200, "Beta Bequin"  in Synopsis,  Dan Abnett,  2 factions,  20 facets
/buch/the-magos          HTTP 200, "Magos Bure"   in Synopsis,  Dan Abnett,  4 factions,  20 facets
/buch/this-slug-does-not-exist  HTTP 404 (notFound() greift)
```

- `npm run typecheck` — pass
- `npm run lint` — 0 errors, 1 pre-existing warning in `src/app/layout.tsx` (Custom Fonts, vor 060)
- `npm run brain:lint -- --no-write` — 0 blocking, 5 warnings (alle pre-existing: 2 inline diff raw fields, 1 brain size budget, 2 stale claim suspects)

## Open issues / blockers

Keine.

## For next session

1. **DetailPanel-Look auf `/buch/[slug]`.** Mein Render ist absichtlich Funktionsminimum — cover image, "Auch enthalten in"-Block für die zwei Omnibuses, primary-location-Map-Pin, "Read next"-Sidebar fehlen alle. Brief 060's Out-of-Scope notiert das explizit; der Mini-Brief „DetailPanel "Auch enthalten in"-Frontend" kann jetzt landen weil die `work_collections`-Daten da sind.

2. **Brain-Updates triggert Cowork.** Gemäß Brief: `project-state.md` (DB-Apply landed, Migration 0007/0008 applied), `pipeline-state.md` (Phase 3d Erste Welle landed), `open-questions.md` (Sub-Inquisition als unresolved-Faction-Resolver-Question), `log.md` (058+059+060+Override-Authority-Pattern).

3. **`work_factions.role`-Konflikt-Algorithmus** ist `primary > supporting > antagonist > background`. Hat in den 10 Büchern noch nie wirklich getriggert (Override-File hatte keine echten Kollisionen pre-resolve), aber für nachfolgende Batches relevant — vermutlich kommt das im Resolver-Brief 062-063 zur Sprache.

4. **`coverUrl`/`startY`/Stage-1-Source-Anreicherung** für die 10 Showcase-Bücher kann ein dedizierter Mini-Brief tun (parsen aus `ingest/.last-run/v2-batch-20260510-2227.diff.json`'s `discoveredFields`). Die Apply-Pipeline für Batch 002+ wird dieselbe Frage stellen.

5. **`series.json`-Erweiterung um `bequin`-Eintrag** wäre für *Pariah* (W40K-0009) trivial — JSON-Row + Re-Seed + ein Re-Apply von Batch 001. Out-of-Scope von 060, aber low-cost wenn der Maintainer einen Series-Slug pflegen will.

6. **Apply-Pipeline für nicht-curated Batches** (061+, ggf. der CC-Direct-Winner aus 059). Mein Apply-Skript ist override-file-spezifisch — für Pipeline-LLM-Output direkt-zu-DB braucht es entweder (a) eine zweite, parallele Apply-Code-Path die den 059-Output liest, oder (b) eine Generalisierung des Override-Schemas, sodass beide Quellen dasselbe File-Format produzieren. Cowork's Call.

## References

- Brief: `sessions/2026-05-11-060-arch-ssot-w40k-001-db-apply.md`
- Schema: `src/db/schema.ts` (works/bookDetails/junctions/workCollections)
- Override authority: `scripts/seed-data/manual-overrides-ssot-w40k-001.json`
- Roster: `scripts/seed-data/book-roster.json`
- Drizzle migrator schema-bookkeeping: `drizzle.__drizzle_migrations` (not `public.__drizzle_migrations`)
