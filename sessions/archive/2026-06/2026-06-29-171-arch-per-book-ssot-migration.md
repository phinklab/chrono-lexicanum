---
session: 2026-06-29-171
role: architect
date: 2026-06-29
status: implemented
slug: per-book-ssot-migration
parent: 2026-06-28-170
links: [2026-06-28-170, 2026-06-18-157, 2026-06-25-165, 2026-06-30-171]
commits: []
---

> **Implemented** — see `sessions/2026-06-30-171-impl-per-book-ssot-migration.md`. The 896-book corpus is migrated to `books/*.json`, equivalence is proven by an empty DB-free projection diff, the batch/Excel/loop machinery is retired, and `apply:book --all` is the primary corpus step. No live/prod DB was touched.

# 171 - Per-Buch-SSOT Teil B: verifizierte Migration und Batch-Retirement

> Eröffnet nach gemergtem Teil A (PR #201). Gegen den 170-Impl-Report (`sessions/2026-06-28-170-impl-per-book-ssot.md`) aktualisiert — die impl-bestätigten Deltas (`book-v1`-Shape, Validierungsmodi, Serien-Parität, geteilter Writer/Prolog, Consumer-Stand) sind unten eingearbeitet. Die „For next session"-Liste (7 Punkte) des 170-Reports ist die maßgebliche Implementierungs-Checkliste.

## Goal

Migriere den gesamten bestehenden Buch-Korpus aus Legacy-Roster plus 90 Override-Batches in `scripts/seed-data/books/<slug>.json` (das in Teil A gebaute `book-v1`-Format), beweise `apply(legacy) == apply(per-book)` per leerem Scratch-Aequivalenz-Diff, und retire danach die Batch-/Excel-/Roster-Extension-Maschinerie als lebende Quelle. Nach diesem Teil lebt der Buch-Korpus nur noch in `books/`.

## Preconditions

- Teil A (`2026-06-28-170`) ist gemergt (PR #201). Vorhanden: `apply:book --slug/--all/--verify`, der **eine geteilte Writer** `scripts/book-apply-shared.ts` (`applyBook(override, roster, series, …)`), der reine Loader/Validator `scripts/book-file.ts`, der CLI `scripts/apply-book.ts`, der geteilte Seed-Prolog `scripts/seed-prolog.ts` (`seedReferenceAndFacetProlog()`) und `scripts/refresh/effective-corpus.ts`. Der `books/`-Ordner ist **leer** — kein Live-Write ist erfolgt.
- Dieser Brief ist bereits gegen den 170-Impl-Report aktualisiert (siehe Kopfnotiz). Vor Start den Report trotzdem querlesen; seine „For next session"-Liste ist die Implementierungs-Checkliste.
- Umsetzung im Batches-Worktree. `brain/**` und `sessions/README.md` nicht anfassen.

## Context

Der aktuelle Korpus:

- `book-roster.json`: 896 Buecher, 196 `collections[]`-Kanten.
- Override-Batches: 90 Dateien, `w40k` 001..060 und `hh` 001..030.
- Max-IDs: `W40K-0599`, `HH-0297`; nicht hart kodieren.
- `book-roster.extension.json` ist bereits in `book-roster.json` eingemergt und wird in diesem Teil nur noch als Legacy-/Retirement-/Provenienzquelle betrachtet.

Was Teil A schon gebaut hat (der Ausgangspunkt für B):

- **Ein** geteilter Writer (`book-apply-shared.ts applyBook`) — der Legacy-Applier (`apply-override.ts`) UND der per-Buch-Applier (`apply:book`) rufen ihn. Äquivalenz ist damit **Parität-by-construction am Writer**; die einzige verbleibende Diff-Fläche ist die **Projektion** (Legacy-Roster+Override → Writer-Args vs `book-v1` → Writer-Args).
- `apply:book --all` läuft als **additiver Tail**: `db:sync` Schritt **3/10**, direkt nach `run-phase4-apply.sh` (Schritt 2/10), vor `apply:podcast`. Teil B befördert ihn zum **primären** Korpus-Schritt.
- Die Validierung kennt nur **`additive`**: `findCorpusCollisions` ist hart-rot bei jeder Slug/`externalBookId`-Kollision zwischen Legacy-Roster und `books/` (intra-folder + gegen Legacy). Das ist genau der Migrationsfall — Teil B muss die anderen Modi als Flag ergänzen.
- `apply:book --verify` ist ein **flacher** Presence-Check (works-Row + Slug-Match + `book_details`-Row), **kein** Deep-Diff. Der Deep-Diff ist der Harness dieses Briefs.
- `db-apply-scope.ts` wurde bewusst NICHT angefasst: sein nicht-rekursiver `manual-overrides-ssot-*`-Filter ignoriert den `books/`-Unterordner still — die Preflight-Scope bleibt für Teil A Legacy-only; Teil B baut sie neu.
- `apply-override.ts` (delegiert an den Writer), `seed-resolver-extensions.ts` / `seed-facets.ts` (Shims über `seed-prolog`) und `refresh-check.ts` / `refresh/emit.ts` (zeigen auf den per-Buch-Pfad) sind in Teil A bereits umgestellt — bei der Consumer-Inventur unten nur noch finalisieren, nicht neu bauen.

Teil A adressiert OQ 18a (targeted apply via `apply:book`). Teil B schliesst **OQ 18b** (exakter Korpus-Deep-Diff) durch den Snapshot-Diff. Ob `db:drift` danach zu einem wiederkehrenden vollen Korpus-Deep-Diff wird oder Health-Check + per-Buch-`--verify` bleibt, entscheidet dieser Teil und dokumentiert es.

## Design

### Konverter

Der Einmal-Konverter:

- enumeriert ausschliesslich `book-roster.json.books[]`;
- erzeugt fuer jeden Roster-Eintrag genau ein `books/<slug>.json` im **`book-v1`-Format** (autoritative Shape: `scripts/book-file.ts` + `scripts/seed-data/books/README.md`);
- bindet an die **exakten** Feldnamen (nicht annähernd): `externalBookId, slug, title, authors[], editors[], authorship.editorialNote ("various"|null), releaseYear, format, seriesHint, series, seriesIndex, notes, source{kind,url,confidence}, curation{synopsis, facetIds, factions, locations, characters, flags[], rating?}, collections{collects[], containedIn?-ignoriert}`;
- joint Override-Kuration per `externalBookId` und uebernimmt Synopsis, `facetIds`, Factions/Locations/Characters mit rohen Surface-Form-`name`s und `role`, vollstaendige `flags[]`, Rating **verbatim**;
- uebernimmt `authors[]`, `editors[]`, `authorship.editorialNote`, freie `notes`;
- joint `book-roster.extension.json.books[]` per `externalBookId` nur fuer Datei-Provenienz im per-Buch-`source`-Objekt oder begruendet bewusste Retirements;
- gruppiert `book-roster.json.collections[]` (196 Kanten) nach `collectionExternalId` und schreibt `collections.collects[]` in genau das Collection-/Anthology-File.

**Serien-Parität (gate-kritisch, impl-bestätigt).** Legacy setzt `book_details.series_id`/`series_index` NUR fuer die **8** IDs in `apply-override.ts`'s `SERIES_BY_EXTERNAL_ID` (`W40K-0001..0008` → eisenhorn/ravenor); alles andere ist `null`. Der Konverter setzt `series`/`seriesIndex` **exakt** fuer diese 8, sonst `null`. **Nicht** aus `seriesHint` neu ableiten — sonst bricht der Aequivalenz-Diff.

Fehlende Kuration oder unaufloesbare Pflichtdaten stoppen hart mit expliziter Liste. Kein Re-Crawl, kein Re-LLM.

### Validierungsmodi

Teil A baute nur `additive`. Teil B ergaenzt zwei weitere Modi als Flag durch `book-file.ts` (`findCorpusCollisions` + Id-Allokation) und `apply-book.ts` (`loadAndGuard()`):

- `additive` (Teil A, unveraendert): effektiver Korpus = Legacy + `books/`; jede Spiegelung mit gleicher Slug/`externalBookId` ist hart-rot.
- `migration/equivalence`: Legacy und per-Buch sind getrennte Quellwelten; Spiegel-Duplikate mit gleicher natuerlicher Identitaet sind **erwartet** (der Konverter spiegelt genau den Legacy-Korpus). Der Cross-Source-Guard darf hier nicht feuern.
- `post-retirement`: `books/` ist die einzige Welt; ID-Maximum und Eindeutigkeit laufen folder-only.

### Aequivalenz-Diff

**Parität-by-construction.** Beide Applier rufen `book-apply-shared.applyBook`; die einzige Diff-Fläche ist die **Projektion**, nicht der Writer. Der Harness zielt auf die Projektion und nutzt fuer Golden + Scratch denselben `seedReferenceAndFacetProlog()`.

Harte Regeln:

- Aequivalenz-Applies laufen nur gegen disposable DB/State (lokale Scratch-DB oder Branch-/Preview-DB), nie gegen Prod. Die Apply-Kette zieht ihr Ziel aus `.env.local` (verifiziert) — der Harness verweigert `.env.local`/Prod-Ziele ohne explizit gesetztes Wegwerf-Ziel und nennt den Mechanismus im Report.
- Legacy-Golden = **`legacy corpus-only`**: Reference-/Facet-Seed-Prolog, dann Legacy-Korpus-Apply **vor allen Tails**.
- Per-Book-Scratch = derselbe Prolog, dann `apply:book -- --all`, ebenfalls ohne Tails.
- Tails (`apply:podcast`, `apply:audiobook-narrators`, `apply:timeline`, `apply:curation-overlay`) werden nicht in den Korpus-Diff gemischt; nach bestandenem Gate separat unveraendert verifiziert. (Grund: `apply:curation-overlay` schreibt als Tail in genau die korpus-owned Domaene — der Golden muss daher der Pre-Tail-Zustand sein, nicht der Live-Endzustand.)

Diff-Domaene:

- `works` mit `kind='book'`: `external_book_id`, `slug`, `title`, `synopsis`, `release_year`, `source_kind`, `confidence`, weitere korpus-owned Spalten; ohne Tail-Setting-Spalten.
- `book_details`: `format`, `series_id`, `series_index`, `notes`, Rating-Felder, inkl. `primary_era_id`.
- `work_persons` nur `role IN (author, editor)`.
- `work_facets`, `work_factions`, `work_locations`, `work_characters`, `work_collections`.
- `external_links` als definierte Projektion; `source.url` erzeugt in Teil B keine Buch-Link-Rows.

**Collections-Aequivalenz:** Legacy `applyCollections` (flache Edge-Liste) und der per-Buch-Ownership-Writer (in `apply-book.ts`) muessen identische `work_collections`-Rows erzeugen — explizit in der Diff-Domaene assertet.

Nicht gedifft: Tail-Daten und Querschnitts-Referenztabellen.

Normalisierung: stabile natuerliche Schluessel, Mengenvergleich, volatile/Surrogat-Spalten ausklammern, gleiche Whitespace-/Unicode-Normalisierung wie bestehender Apply.

Nur bewusst-normalisierungs-bedingte Deltas sind dokumentierbar. Jeder echte Daten- oder Junction-Delta ist blockierend.

Proof-Artefakte gehen in einen dedizierten gitignored Pfad oder werden im Report als Beweisartefakte benannt. Der Harness darf `ingest/.last-run/phase4-digest.md` nicht still als Scratch-Diff ueberschreiben oder im Worktree zuruecklassen.

## What to build

1. **Validierungsmodi ergaenzen:** `additive` (vorhanden) + `migration/equivalence` + `post-retirement` als Flag durch `book-file.ts` + `apply-book.ts loadAndGuard()`.
2. **Konverter** bauen und laufen lassen (enumeriert Roster, schreibt `books/<slug>.json` im `book-v1`-Format, Serien-Paritaet exakt fuer die 8 IDs, stoppt hart bei fehlender Kuration).
3. **Aequivalenz-Harness** bauen und Gate gegen disposable DB/State laufen lassen (zielt auf die Projektion; beide Seiten gleicher Prolog; Golden = `legacy corpus-only` pre-Tail).
4. Nur bei leerem Diff: Batch-Maschinerie ueber alle Domaenen stilllegen:
   - alle 90 `manual-overrides-ssot-*.json`;
   - `book-roster.extension.json` als lebende Quelle;
   - `loop:next` / `loop-next-batch.ts`;
   - `scripts/run-ssot-loop.sh`;
   - `db:apply-override -- --batch`;
   - alte Batch-/Extension-Anleitungen.
5. **`apply:book --all` vom additiven Tail (Schritt 3/10) zum primaeren Korpus-Schritt befoerdern:** `run-phase4-apply.sh` als Korpus-Schritt abloesen; `db:apply-scope`, `db:sync`, `db:rebuild`, `db:drift` auf per-Buch-Modell umbauen.
6. **Neuer Preflight** (ersetzt `db-apply-scope.ts`'s nicht-rekursiven `manual-overrides-ssot-*`-Filter + die Batch-Contiguity): jede `books/*.json` parst, Slug/`externalBookId` eindeutig (Modus `post-retirement`), Prefix/Nummer gueltig, `collects` aufloesbar, Reference-/Facet-Seed-Prolog vorhanden. Keine Batch-Contiguity mehr behaupten.
7. `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` und `import:ssot-roster` als aktive Quellen loeschen, archivieren oder laut als Legacy-only neutralisieren.
8. **Vollstaendige Consumer-Inventur per `rg`** — Stand nach Teil A:
   - **Schon in Teil A umgestellt** (nur noch finalisieren/retiren, nicht neu bauen): `apply-override.ts` delegiert bereits an `book-apply-shared` (Retirement = die Legacy-Projektion + `SERIES_BY_EXTERNAL_ID` ablegen, **nicht** den Writer); `seed-resolver-extensions.ts` / `seed-facets.ts` sind bereits Shims ueber `seed-prolog`; `refresh-check.ts` + `refresh/emit.ts` zeigen bereits auf den per-Buch-Pfad.
   - **Noch offen:** `src/lib/ingestion/v2/ssot/load-roster.ts`, `adapt.ts`, `scripts/refresh/proposal.ts`, `scripts/import-faction-starters.ts`, `scripts/book-review/projection.ts`, `apply-override-dry.ts`, `apply-override-collections.ts`, `scripts/import-ssot-roster.ts`, `scripts/roster-extension.ts`, `scripts/aggregate-surface-forms.ts`, `scripts/resolver-loop-detect.ts`, `scripts/loop-next-batch.ts`, `scripts/db-apply-scope.ts`, `scripts/test-resolver-data-integrity.ts`, `scripts/test-resolver-coverage.ts`, package-Scripts `import:ssot-roster`, `loop:next`, `db:apply-override`, `test:resolver-data`, `test:resolver-coverage`.
   - Pro Consumer im Report: stillgelegt, umgestellt oder an generiertes Roster-Derivat gebunden.
9. One-off-Helfer aus 074/076 duerfen laut archived/retired werden, wenn sie nur historische Dossiers bedienen.
10. Runbooks/Kommentare aktualisieren oder retiren: `scripts/runbooks/ssot-loop-runbook.md`, `scripts/runbooks/db-rebuild-runbook.md` (Teil A hat es bereits teils auf per-Buch reconcilet), `scripts/db-sync.sh`, relevante Hinweise in `.github/workflows/weekly-refresh.yml`, `scripts/seed-data/README.md`, Typ-/Script-Kommentare.
11. `primary_era_id`-Narrative konsistent halten: Korpus schreibt `time_ending` (`applyBook` setzt `primary_era_id`); Timeline remappt retirte Eras; Overlay-Code kann `primaryEraId`, aktuelle `curation-overlay.json` nutzt es nicht.
12. `books:excel` bauen: read-only `.xlsx` aus `books/*.json`, neuer klar gitignored Output-Pfad, kein Ueberschreiben des alten Excel-Inputs.
13. Tests: Konverter-Roundtrip, Validierungsmodi, Aequivalenz-Diff-Harness, `db:sync`/`db:rebuild`/`db:drift`, Consumer-Aufloesungen, `lint`, `typecheck`. Die Teil-A-Tests (`test:book-file`, `test:apply-book`, `test:book-detection-guard`) erweitern/anpassen statt duplizieren.

## Constraints

- Kein Retirement ohne leeren Aequivalenz-Diff.
- **Serien-Paritaet exakt:** per-Buch-Files setzen `series`/`seriesIndex` nur fuer die 8 `SERIES_BY_EXTERNAL_ID`-IDs, sonst `null`; nicht aus `seriesHint` ableiten.
- Aequivalenz-Applies nur gegen disposable DB/State, nie Prod.
- DB-Shape unveraendert, keine Schema-Aenderung ausser zwingend fuer Aequivalenz.
- Live-DB-Write nur nach Philipps ausdruecklicher Freigabe; der Aequivalenz-Harness ist kein Prod-Write.
- CI bleibt detection-only; keine unbeaufsichtigten DB-Writes.
- Kein neuer metered `ANTHROPIC_API_KEY`-Pfad fuer Anreicherung.
- Querschnittsschichten nicht einfalten oder semantisch umbauen.
- Neue Referenz-Entities inkl. Personen nur ueber Seed-Kataloge + PR-Diff, nie DB-only.
- Version-Policy: keine Version pinnen.
- Umsetzung im Batches-Worktree. `brain/**` und `sessions/README.md` nicht anfassen.

## Out of scope

- Podcast-Delta, `/add-podcast-episode`, `/add-podcast`, `/weekly-db-update` (Teil C, Draft `sessions/_drafts/2026-06-29-172-arch-podcast-weekly-maintenance.md`).
- Timeline/`book-dates` oder `curation-overlay` in per-Buch-Files einfalten.
- Audiobook-/Narrator-Credits in per-Buch-Files einfalten.
- Bidirektionaler Excel-Sync oder Excel als SSOT.
- DB-Schema-Redesign.
- Auto-Apply aus GitHub Actions.
- Voller Resolver-/Consolidation-Pass.
- Atlas-Regen, Brain-Rollups, `sessions/README.md`, Public UI, OFOB, faction-starters.
- `scripts/seed-data/books.json` + `db:seed`; bleibt Legacy-Dev-Seed mit eigenem ID-Raum.

## Acceptance

- [ ] Die drei Validierungsmodi (`additive` / `migration-equivalence` / `post-retirement`) existieren als Flag durch `book-file.ts` + `apply-book.ts loadAndGuard()`; der Migrationslauf nutzt `migration/equivalence`, der finale Preflight `post-retirement`.
- [ ] Konverter enumeriert ausschliesslich `book-roster.json.books[]` und erzeugt fuer jeden Eintrag genau ein per-Buch-File im `book-v1`-Format.
- [ ] Override-Kuration, Roster-Authorship/Notes, Collections (gruppiert nach `collectionExternalId`) und Extension-Provenienz werden wie im Design uebernommen; fehlende Kuration stoppt hart mit Liste.
- [ ] Serien-Paritaet: per-Buch-Files setzen `series`/`seriesIndex` exakt fuer die 8 `SERIES_BY_EXTERNAL_ID`-IDs, sonst `null`.
- [ ] `apply(legacy) == apply(per-book)` ist auf der definierten Domaene per leerem Snapshot-Diff bewiesen (Golden = `legacy corpus-only` pre-Tail); echte Daten-/Junction-Deltas sind nicht offen.
- [ ] Beide Aequivalenz-Applies liefen gegen disposable DB/State, nie Prod; Harness verweigert `.env.local`/Prod ohne Wegwerf-Ziel.
- [ ] Proof-Artefakte sind isoliert; `ingest/.last-run/phase4-digest.md` bleibt kein stiller Scratch-Diff.
- [ ] Erst danach sind alle Batch-Dateien, `book-roster.extension.json` als Quelle, `loop:next`, `scripts/run-ssot-loop.sh` und Batch-Apply-Pfade stillgelegt.
- [ ] `apply:book --all` ist vom additiven Tail (Schritt 3/10) zum primaeren Korpus-Schritt befoerdert; `run-phase4-apply.sh` ist als Korpus-Schritt abgeloest.
- [ ] `db:apply-scope`, `db:sync`, `db:rebuild`, `db:drift` laufen ueber per-Buch und haben den neuen Preflight (kein nicht-rekursiver `manual-overrides-ssot-*`-Filter, keine Batch-Contiguity mehr).
- [ ] Alle Roster-/Batch-Consumer aus der Inventur sind aufgeloest; der Report listet jeden Consumer (inkl. der in Teil A bereits umgestellten als „finalisiert").
- [ ] `Warhammer_Books_SSOT.xlsx` / `import:ssot-roster` sind als aktive Quelle retired oder laut Legacy-only.
- [ ] Runbooks/Workflow-Kommentare sind aktualisiert oder retired.
- [ ] `books:excel` erzeugt eine read-only Excel auf neuem gitignored Pfad.
- [ ] Relevante neue Tests gruen; mindestens `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` sofern lokal anwendbar.

## Open questions for report

- Welche Snapshot-Form wurde fuer den Aequivalenz-Diff gewaehlt, und welche rein normalisierungsbedingten Deltas blieben?
- Wie wurden die drei Validierungsmodi als Flag durch `book-file.ts` / `apply-book.ts` gefuehrt?
- Welcher disposable-DB-Mechanismus wurde genutzt, und wie verweigert der Harness Prod-Ziele?
- Welche Extension-Provenienz wurde uebernommen oder bewusst retired?
- Wo liegen Proof-Artefakte, und blieb `ingest/.last-run/phase4-digest.md` sauber?
- Wie wurde `db:apply-scope` / `run-phase4-apply.sh` auf `books/` umgestellt (Tail → primaer)?
- Welche Consumer wurden stillgelegt, umgestellt oder an ein generiertes Roster-Derivat gebunden?
- Wie wurde `Warhammer_Books_SSOT.xlsx` retired, und wo liegt der `books:excel`-Output?
- Wird `db:drift` zum wiederkehrenden Korpus-Deep-Diff ausgebaut oder bleibt es Health-Check + per-Buch-`--verify`?
- Welche Teil-C-Annahmen aus `sessions/_drafts/2026-06-29-172-arch-podcast-weekly-maintenance.md` muessen nach Teil B angepasst werden?

## Handover

1. Frischer Batches-Task-Branch, z. B. `codex/ingest-batches-per-book-ssot-migration`. (Dieser Brief liegt bereits in `sessions/` mit `status: open`.)
2. Vor Start den 170-Impl-Report (`sessions/2026-06-28-170-impl-per-book-ssot.md`) querlesen — dieser Brief ist bereits dagegen aktualisiert, aber die dortige „For next session"-Liste (7 Punkte) ist die maßgebliche Implementierungs-Checkliste.
3. Impl-Report schreiben; diesen Brief im PR auf `implemented` setzen.
4. Nach Merge oeffnet Cowork Teil C aus `sessions/_drafts/2026-06-29-172-arch-podcast-weekly-maintenance.md`.
5. Nicht selbst mergen; Philipp merged.
