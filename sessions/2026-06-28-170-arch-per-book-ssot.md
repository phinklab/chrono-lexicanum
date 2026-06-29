---
session: 2026-06-28-170
role: architect
date: 2026-06-28
status: implemented
slug: per-book-ssot
parent: 2026-06-27-168
links: [2026-06-09-133, 2026-06-14-151, 2026-06-18-157, 2026-06-25-165, 2026-06-27-168]
commits: []
---

# 170 - Per-Buch-SSOT Teil A: Fundament und targeted `apply:book`

## Goal

Baue das additive Fundament fuer eine kuenftige Per-Buch-SSOT: `scripts/seed-data/books/<slug>.json`, Loader/Validator, targeted `apply:book`, ein additiver `db:sync`-Tail und ein repo-lokaler `/add-book`-Pfad. **Legacy bleibt in diesem Teil autoritativ**; keine Batch-Datei wird retired und keine Bestand-Migration wird gefahren.

Dies ist Teil A einer dreiteiligen Sequenz:

1. **170 Teil A (dieser Brief):** Per-Buch-Fundament fuer neue Buecher, additiv neben Legacy.
2. **171 Teil B (Draft):** verifizierte Migration aller Legacy-Buecher, leerer Aequivalenz-Diff, Batch-/Excel-Retirement.
3. **172 Teil C (Draft):** Podcast-Delta, manuelle Podcast-Adds, `/weekly-db-update`.

Die Folgebriefs liegen als Drafts unter `sessions/_drafts/` (`2026-06-29-171-arch-per-book-ssot-migration.md`, `2026-06-29-172-arch-podcast-weekly-maintenance.md`) und duerfen erst nach dem jeweils vorherigen Impl-Report nach `sessions/` verschoben und auf `status: open` gesetzt werden. So liest CC nicht versehentlich Teil B/C vor Teil A.

## Context

Heute liegt Buch-Meta verteilt:

- Identitaet/Bibliografie: `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` -> `import:ssot-roster` -> `book-roster.json`; `book-roster.extension.json` ist in den aktuellen Roster eingemergt.
- Kuration: 90 Override-Batches `manual-overrides-ssot-*.json` (`w40k` 001..060, `hh` 001..030) mit Synopsis, `facetIds`, Factions/Locations/Characters, `flags`, Rating.
- Verknuepfung: erst zur Apply-Zeit ueber `externalBookId`/Slug.
- Cross-Buch-Collections: `book-roster.json.collections[]`.
- Separat bleibende Tails/Querschnittsdaten: Referenz-Kataloge, Aliases, Blurbs, Ask-Kuration, Timeline/`book-dates`, `curation-overlay`, `audiobook-narrators.json`, Podcast-Registry.

Aktuelle Zahlen: `book-roster.json` enthaelt 896 Buecher und 196 Collection-Kanten. Max-IDs: `W40K-0599`, `HH-0297`; naechste freie IDs waeren aktuell `W40K-0600`, `HH-0298`. Diese Zahlen sind nur Datenstand, nicht hart zu kodieren.

Die aktuelle Apply-Kette aus Brief 157:

1. `db:sync` laeuft nicht-destruktiv: `db:apply-scope` -> `run-phase4-apply.sh` -> `apply:podcast --all` -> `apply:audiobook-narrators` + `--verify` -> `apply:timeline` + `--verify` -> `apply:curation-overlay` + `--verify`.
2. `db:rebuild` = confirm-gegatetes Truncate + `db:sync`.
3. `db:drift` = read-only Health-Check, kein voller DB==SSOT-Deep-Diff.

Serving ist nicht direkt betroffen: App-Routen lesen Buecher aus Postgres (`src/lib/book/loadBook.ts`, `src/lib/entity/loader.ts`, `src/lib/chronicle/loadTimeline.ts`). Der App-Build importiert keinen Buch-Korpus aus `seed-data`; er importiert nur Referenz-/Kurationsdateien wie Aliases, Ask, Blurbs, Podcast-Show-Registry und Entity-Kataloge.

Teil A adressiert OQ 18a teilweise: targeted Apply mit Slug. OQ 18b und der vollstaendige Korpus-Deep-Diff gehoeren in Teil B.

## Design

### Per-Buch-Datei

Pfad: `scripts/seed-data/books/<slug>.json`. Eine Datei entspricht genau einem Work.

Die finale Shape waehlt CC, aber sie muss verlustfrei mindestens diese Inhalte tragen:

```json
{
  "$schema": "book-v1",
  "externalBookId": "W40K-0600",
  "slug": "example-new-release",
  "title": "Example New Release",
  "authors": ["Author Name"],
  "editors": [],
  "authorship": { "editorialNote": null },
  "releaseYear": 2026,
  "format": "novel",
  "series": null,
  "seriesIndex": null,
  "notes": null,
  "collections": { "collects": [] },
  "source": { "kind": "track_of_words", "url": "https://...", "confidence": 0.9 },
  "curation": {
    "synopsis": "...",
    "facetIds": ["book", "en"],
    "factions": [{ "name": "Astra Militarum", "role": "primary" }],
    "locations": [],
    "characters": [],
    "flags": [],
    "rating": { "status": "unrated", "source": "goodreads", "reason": "..." }
  }
}
```

Verlustfrei heisst:

- `authors[]`, `editors[]`, `authorship.editorialNote` und freie Roster-`notes` bleiben erhalten.
- `book_details.notes` wird legacy-equivalent komponiert: freie Roster-Notiz + generierter `---surfaceForms---`-Block + optionaler `---authorship---`-Block.
- `curation.facetIds[]`, `curation.factions[]`, `curation.locations[]`, `curation.characters[]`, `curation.flags[]` werden aus Legacy-Overrides **verbatim** uebernommen. Surface-Form-`name`, `role` und volle `flags[]`-Payloads duerfen nicht normalisiert oder abgespeckt werden.
- `source` ist in Teil A Datei-/Export-Provenienz. DB-materialisiert bleibt legacy-equivalent: `works.source_kind = "ssot"`, `works.confidence = "1.00"` bzw. heutige Legacy-Werte. `source.url` erzeugt in Teil A keine neue `external_links`-Row.

`externalBookId` steht im File und wird nie aus Batch-Slots berechnet. Es gibt zwei Namensraeume: `W40K-NNNN` und `HH-NNNN`. In Teil A gilt der `additive`-Validierungsmodus: effektiver Korpus = Legacy-Roster + per-Buch-Folder. Cross-Source-Kollisionen bei Slug/`externalBookId` sind hart rot. Neue IDs werden pro Prefix aus dem effektiven Maximum vergeben.

### `apply:book`

`apply:book -- --slug <slug>`:

- liest genau ein per-Buch-File;
- faehrt vor F/L/C-/Facet-Validierung und vor korpus-owned DB-Writes den gemeinsamen non-destruktiven Reference-/Facet-Seed-Prolog (`db:seed-resolver-extensions` + `seed-facets` oder shared helper);
- schreibt/aktualisiert `works` und `book_details`;
- ersetzt Details/Junctions/Links nur fuer dieses eine Work per delete-then-insert;
- schreibt `book_details.primary_era_id = "time_ending"` bei Insert und Update;
- fasst keine anderen Works an;
- bricht vor Mutation laut ab, wenn Prolog, Validation oder Referenzaufloesung scheitert.

`apply:book -- --all`:

- laeuft deterministisch ueber alle `books/*.json`;
- nutzt denselben Prolog;
- dient in Teil A nur als additiver Tail fuer neue per-Buch-Files;
- sammelt fehlende Autor:innen/Editor:innen und schreibt `persons.json` einmal am Lauf-Ende.

Standalone `apply:book`, `/add-book` und spaeter der Aequivalenz-Harness nutzen denselben Reference-/Facet-Seed-Prolog. Neue Referenz-Entities duerfen keinen Full-`db:sync` als Workaround brauchen.

### Collections und Personen

`work_collections`:

- Die Collection/Anthology besitzt die Kante: nur ihr File autorisiert `collections.collects[]`.
- `containedIn` ist, falls gebraucht, eine generierte read-only Ableitung und wird vom Applier ignoriert.
- `apply:book --slug <collection>` ersetzt die Kanten dieser Collection.
- `apply:book --slug <member>` fasst `work_collections` nicht an.
- Unaufloesbare `collects`-Members stoppen laut.

Personen:

- `authors[]` und `editors[]` leben im per-Buch-File und materialisieren `work_persons` mit `role IN (author, editor)`.
- `persons.json` bleibt Referenz-Katalog.
- Unbekannte Personen werden deterministisch in `persons.json` ergaenzt, erscheinen im Diff und werden im selben PR committet. Keine DB-only-Personen.

## What to build

1. Schema/Validator und `scripts/seed-data/books/` einfuehren.
2. Loader bauen, der Legacy-Batches und per-Buch-Files gemeinsam lesen kann, ohne Legacy umzubauen.
3. `apply:book -- --slug` und `apply:book -- --all` bauen, inklusive Contracts aus Design.
4. `db:sync` bekommt einen additiven per-Buch-Tail unmittelbar nach Legacy-Korpus-Apply (`run-phase4-apply.sh`) und vor `apply:podcast`, `apply:audiobook-narrators`, `apply:timeline`, `apply:curation-overlay`.
5. Kein Rewrite von `run-phase4-apply.sh` oder `db:apply-scope` in Teil A.
6. `db:drift` bekommt einen read-only per-Buch-Verify oder einen im Drift-Runbook eingebundenen separaten Verify.
7. `/add-book`-Contract repo-lokal startbar machen oder eindeutig als Runbook+Script liefern: Dup-Check -> Recherche (Black Library / Track of Words / Goodreads / Lexicanum / Fandom) -> Vorschlag -> File -> Kuration -> Diff -> DB-Write-Gate -> Reference-/Facet-Prolog -> `apply:book -- --slug` -> Zusammenfassung.
8. Book-Detection darf nach Teil A nicht roster-only blind bleiben: `refresh:check`, `scripts/refresh/proposal.ts` und Identity-Index werden im `additive`-Modus effektiver-Korpus-aware oder Book-Detection pausiert laut/maschinenlesbar, sobald `books/` nicht leer ist. Podcast-Detection darf weiterlaufen.
9. `scripts/runbooks/weekly-refresh-runbook.md` und generierter Promote-Text duerfen dem per-Buch-Pfad nicht widersprechen.
10. Tests fuer Validator, Dup-Guard, ID-Allokation, idempotenten Apply, Junction-Scope, `primary_era_id`, Notes-Roundtrip, Reference-/Facet-Prolog, Collections, Personen, `--all`, `db:sync`-Tail und Refresh-Guard.

Nach Teil A laufen neue Buecher per File und targeted Apply. Legacy-Batches bleiben autoritativ fuer den Bestand.

## Constraints

- Strikt additiv: Legacy-Batches bleiben unveraendert und applien weiter.
- Kein Batch-Retirement, kein Konverter, kein Aequivalenz-Harness, kein Excel-Retirement in Teil A.
- Per-Buch-Tail in `db:sync` korrekt positionieren: unmittelbar nach Legacy-Korpus, vor Podcast/Audiobook/Timeline/Overlay.
- DB-Shape unveraendert, keine Schema-Aenderung ausser zwingend fuer das additive Fundament.
- Live-DB-Write nur nach Philipps ausdruecklicher Freigabe; Default bleibt Source-Files -> PR/Merge -> targeted Apply oder `db:sync`.
- CI bleibt detection-only; keine unbeaufsichtigten DB-Writes.
- Kein neuer metered `ANTHROPIC_API_KEY`-Pfad fuer Anreicherung.
- Neue Referenz-Entities inkl. Personen nur ueber Seed-Kataloge + PR-Diff, nie DB-only.
- Version-Policy: keine Version pinnen; falls neue Dependency noetig, recherchiert/pinnt CC und begruendet im Report.
- Umsetzung im Batches-Worktree. `brain/**` und `sessions/README.md` nicht anfassen.

## Out of scope

- Vollstaendige Migration bestehender Legacy-Buecher nach `books/` (Teil B).
- Aequivalenz-Diff, Scratch-DB-Gate, Batch-/Excel-Retirement (Teil B).
- Podcast-Delta, `/add-podcast-episode`, `/add-podcast`, `/weekly-db-update` (Teil C).
- Timeline/`book-dates` oder `curation-overlay` in per-Buch-Files einfalten.
- Audiobook-/Narrator-Credits in per-Buch-Files einfalten.
- Bidirektionaler Excel-Sync oder Excel als SSOT.
- DB-Schema-Redesign.
- Auto-Apply aus GitHub Actions.
- Voller Resolver-/Consolidation-Pass.
- Atlas-Regen, Brain-Rollups, `sessions/README.md`, Public UI, OFOB, faction-starters.
- `scripts/seed-data/books.json` + `db:seed`; bleibt Legacy-Dev-Seed mit eigenem ID-Raum.

## Acceptance

- [ ] Neue Buecher koennen als einzelne `books/<slug>.json` erfasst werden, ohne Batch-Datei, Slot, `book-roster.extension.json`, `import:ssot-roster` oder `loop:next`.
- [ ] Loader/Validator erkennen Legacy + per-Buch gemeinsam und melden doppelte Slugs/IDs gegen beide Welten.
- [ ] ID-Allokation laeuft im `additive`-Modus ueber Legacy + `books/`, nicht folder-only.
- [ ] `apply:book -- --slug` materialisiert genau ein Buch idempotent, faehrt den Reference-/Facet-Seed-Prolog, ersetzt nur dieses Work und schreibt `primary_era_id = "time_ending"` bei Insert und Update.
- [ ] `authors[]`, `editors[]`, `authorship.editorialNote`, `notes` und rohe Override-Kuration roundtrippen legacy-equivalent.
- [ ] `work_collections` kommen nur aus `collects` des Collection-Works; `containedIn` wird ignoriert; Apply-Reihenfolge Collection/Member ist konsistent.
- [ ] Unbekannte Autor:innen/Editor:innen landen deterministisch in `persons.json`, im Diff und im PR; `apply:book -- --all` schreibt `persons.json` einmal am Lauf-Ende.
- [ ] `apply:book -- --all` ist deterministisch und als additiver Tail in `db:sync` korrekt positioniert.
- [ ] `db:drift` oder eingebundener Verify prueft per-Buch read-only.
- [ ] `/add-book` ist repo-lokal startbar oder eindeutig als Runbook+Script beschrieben.
- [ ] `refresh:check`/Book-Detection ist effektiver-Korpus-aware oder pausiert Books laut, sobald `books/` nicht leer ist. Test: per-Buch `W40K-0600` wird nicht erneut vorgeschlagen; naechste W40K-ID kollidiert nicht.
- [ ] Weekly-Runbook und Promote-Text widersprechen dem per-Buch-Pfad nicht.
- [ ] Legacy-Batches bleiben unveraendert und applien weiter.
- [ ] Kein neuer Codepfad nutzt `ANTHROPIC_API_KEY` fuer Anreicherung.
- [ ] Relevante neue Tests gruen; mindestens `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` sofern lokal anwendbar.

## Open questions for report

- Welche finale per-Buch-Shape wurde gewaehlt?
- Wie wurde der gemeinsame Reference-/Facet-Seed-Prolog abstrahiert?
- Wie wurde `apply:book -- --all` in `db:sync` positioniert und verifiziert?
- Bleibt Book-Detection effektiver-Korpus-aware, oder wurde sie bis Teil B/C laut pausiert?
- Welche Teil-B-Annahmen aus `sessions/_drafts/2026-06-29-171-arch-per-book-ssot-migration.md` muessen nach Teil A angepasst werden?

## Notes

- Performance/Deploy: reine Quell-/Apply-Schicht-Umstellung. Serving liest Postgres; Buch-Korpus wird nicht aus `seed-data` in die App importiert.
- Reversibel: per-Buch-Files sind git-versionierte additive Quellen. Legacy-Batches bleiben in Teil A unangetastet.
- Brief 168 hat bereits ein Buch promotet; Teil A soll verhindern, dass weitere neue Buecher durch Batch-Slots muessen.
- OQ 18a wird durch Teil A nur teilweise geschlossen; OQ 18b bleibt Teil B.

## Handover

> Transfer: Dieser Brief wurde im Koordinations-Worktree (`C:\Users\Phil\chrono-lexicanum`) erstellt. Umsetzung laeuft im Batches-Worktree (`C:\Users\Phil\chrono-lexicanum-batches`). Brief in den Batches-Worktree kopieren und im PR mitcommitten.

1. Frischer Batches-Task-Branch, z. B. `codex/ingest-batches-per-book-ssot-foundation`.
2. Impl-Report `sessions/2026-06-28-170-impl-per-book-ssot.md` schreiben; diesen Brief im PR auf `implemented` setzen.
3. Nach Merge liest Cowork den Impl-Report und oeffnet Teil B aus dem Draft `sessions/_drafts/2026-06-29-171-arch-per-book-ssot-migration.md`.
4. Nicht selbst mergen; Philipp merged.
5. `brain/**` und `sessions/README.md` nicht anfassen.
