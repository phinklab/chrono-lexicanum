---
session: 2026-05-10-057
role: architect
date: 2026-05-10
status: implemented
slug: excel-ssot-import
parent: 2026-05-10-056
links:
  - 2026-05-09-055
  - 2026-05-10-056
commits: []
---

# Excel-SSOT-Import — Schema-Erweiterung + DB-Truncate + Loader

## Goal

Drei zusammenhängende Backend-Operationen, die das Postgres-Datenmodell auf den von Maintainer extern gepflegten Excel-SSOT (`Warhammer_Books_SSOT_enriched.xlsx`, 859 Bücher + 192 Collection-Beziehungen) umstellen. Erstens: Schema-Migration mit drei punktuellen Adds (bookFormat-Enum-Erweiterung, neue `work_collections`-Junction für Anthology/Omnibus-M2M, `works.external_book_id` für Trace-Zurück, `sourceKind`-Enum-Erweiterung um `ssot`, `bookDetails.notes`). Zweitens: Hard-Delete-Truncate der 26 hand-kuratierten Bücher — Clean-Restart, kein Audit-Snapshot. Drittens: Loader-Skript, das die Excel liest und ein deterministisches `scripts/seed-data/book-roster.json` produziert (859 Roster-Einträge + 192 embedded Collection-Refs).

Brief 057 produziert das Schema, das saubere DB-Bild und das JSON-Artefakt. **Pipeline-Refactor ist explizit Brief 058** — `run-batch.ts` Discovery-Stage 0 abschalten, Stage-2-Validators trimmen, Stage-3-LLM auf die weichen Felder fokussieren, ersten 10er-Batch fahren. 057 schreibt keinen Diff, ruft kein LLM, schreibt keine Werks-Rows. Es bereitet das Terrain für 058.

## Context

Maintainer-Pivot 2026-05-10 nach 055-Voll-Lauf-Erfahrung und der Erstellung der Excel-SSOT in einer parallelen LLM-Session: weg von Crawler-basierter Discovery (Wikipedia + TLBranson), hin zu einem extern gepflegten kuratierten Master-Excel. Die Datei liegt heute unter `docs/data/Warhammer_Books_SSOT_enriched.xlsx` und enthält 16 Spalten:

`Book ID, Original #, Source, Title, Author, Release Date, Release Year, Type, Section / Series, Contained In Collection, Contained In Book IDs, Contained In Titles, Collects Book IDs, Collects Titles, Source URL, Relation Notes`

Plus zweites Sheet `Collection Links` mit 192 expliziten M2M-Beziehungen (`Content Book ID, Content Title, Content Type, Collection Book ID, Collection Title, Collection Type, Relation, Confidence, Basis, Source URL`). Plus drei Audit-Sheets (`Source Comparison`, `Unmapped Collections`, `Sources`, `README`).

Coverage-Stand: 859 Bücher (W40K 565 + HH 294), 836/859 mit Author, 858/859 mit Year, 100 % mit Type/Section/URL. Type-Verteilung: `Novel 483, Short Story 107, Novella 96, Audio Drama 57, Anthology 52, Omnibus 49, Collection 11, Artbook 2, Scriptbook 2`. Drei dieser Type-Werte (`collection`, `artbook`, `scriptbook`) existieren im aktuellen `book_format`-Drizzle-Enum nicht.

Das aktuelle Schema (post-Stufe-2a Works-CTI, `src/db/schema.ts`) deckt ~90 % der Excel-Felder direkt ab. Vier strukturelle Lücken:

1. **Anthology/Omnibus-M2M.** Heute kein Modell. Excel "Collection Links" Sheet beschreibt 192 Beziehungen ("Xenos ist enthalten in Eisenhorn Omnibus") mit Confidence + Basis. Eine neue Junction-Tabelle ist die natürliche Lösung — sie spiegelt das Sheet 1:1 und unterstützt sowohl die "Collects → Children"- als auch die "Content → Collections"-Query, die das Frontend für den DetailPanel-Hinweis ("auch enthalten in: …") braucht.
2. **`book_format`-Enum unvollständig.** `collection`, `artbook`, `scriptbook` aus der Excel passen aktuell nicht.
3. **Stable Excel-IDs (W40K-0001) haben kein Schema-Slot.** Brauchen wir, damit die Pipeline eine Zeile aus der Excel sicher dem richtigen `works.id` (UUID) zuordnen kann — Slug allein reicht nicht für Re-Imports nach Excel-Edits, wo sich der Slug verschoben haben könnte.
4. **`source_kind`-Enum kennt `ssot` nicht.** Excel ist eine eigenständige Source-Klassifikation, gehört in das Enum.

26 hand-kuratierte Bücher liegen heute in der DB (Stufe 2b seed). Maintainer-Direktive 2026-05-10: **hard delete, kein Snapshot.** Excel ist Neubeginn. Die hand-getaggten Junctions (Factions/Locations/Characters/Facets) gehen verloren — der LLM-Pfad in 058+ baut sie aus den 859 frisch.

Die alte 057-Version dieses Briefs (jetzt überschrieben) plante einen schmaleren Importer (5 Excel-Spalten, Loader-only, kein Schema-Touch). Mit der echten 16-Spalten-Excel + Maintainer-Antworten "DB-Reset + Junction modellieren" braucht es das integrierte Schema-+-Truncate-+-Loader-Paket. Pipeline-Refactor bleibt aber draußen — das wäre ein zu großer Brief in einem.

Brief 056 (Lex-Cache + Per-Book-Checkpointing + Cost-Recompute) ist **vor 057 fertig gelandet** (impl-Report `2026-05-10-056-impl-v2-pre-roster-fixes.md` existiert). Diese drei Fixes bleiben für 058+ und die 10er-Batch-Reihe relevant — Lexicanum wird im LLM-Anreicherungs-Pfad weiter genutzt für die in-universe-time-Felder.

## Constraints

- **TypeScript strict.** Kein `any`, keine `as unknown as`. Roster-Eintrag-Type wird exportiert (CC platziert ihn unter `scripts/seed-data/types.ts` o. Ä.).
- **Schema-Migration:** generiert via `npm run db:generate`, landet als `src/db/migrations/0008_<drizzle-name>.sql`. CC verifiziert das DDL händisch (insbesondere die Enum-`ALTER TYPE` und die FK-Cascade-Direction der neuen Junction).
- **Migration-Apply nur lokal/Test, NICHT prod.** CC läuft `npm run db:migrate` gegen seine lokale Supabase oder einen Test-Branch — nicht gegen die Produktions-DB. Apply-auf-prod ist Maintainer-Trigger nach 057 abgeschlossen.
- **`work_collections`-Junction:**
  - PK auf `(collection_work_id, content_work_id)`.
  - Beide FKs auf `works.id` mit `onDelete: cascade`.
  - `display_order int` (für sortierbare Anzeige der Children in einem Omnibus — die Excel hat das via `Collects Titles`-Reihenfolge implizit).
  - `confidence numeric(3,2)` (übernommen aus Excel `Confidence`).
  - `basis text` (übernommen aus Excel `Basis` — z. B. "Explicit Eisenhorn omnibus follows the trilogy in TLBranson").
  - Zwei Indexes: einer auf `collection_work_id` (für "alle Children eines Omnibus"), einer auf `content_work_id` (für "alle Sammlungen, die Xenos enthalten" — DetailPanel-Query).
- **Schema-Adds atomar.** Eine Migration umfasst alle vier Adds (Enum-Erweiterungen, `external_book_id`, `notes`, `work_collections`). Kein zweiter Migration-File dazu.
- **DB-Truncate-Skript braucht explizites Confirm-Gate.** Skript läuft NICHT ohne `--confirm` CLI-Flag oder `DB_RESET_CONFIRM=1` ENV. Loud-Abort sonst mit Hilfetext. Schutz gegen versehentliches Doppelklicken.
- **Truncate-Scope strikt.** Nur `works` (CTI-Cascade kümmert sich um `book_details` + alle `work_*`-Junctions automatisch). Reference-Tables (`eras`, `factions`, `series`, `sectors`, `locations`, `persons`, `characters`, `services`, `facet_categories`, `facet_values`) bleiben **unangetastet**. CC verifiziert post-Truncate, dass die Reference-Counts unverändert sind.
- **Excel-Datei-Umzug:** `git mv docs/data/Warhammer_Books_SSOT_enriched.xlsx scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Rename mit dabei: `_enriched`-Suffix raus, das ist ein Maintainer-Generation-Detail). Loader liest aus dem neuen Pfad. Andere Dateien unter `docs/data/` (`buchliste.xlsx`, `Horus_Heresy_Books.xlsx`, `Warhammer_40k_Books.xlsx`, `tlbranson_*.html`, `2b-book-roster.md`) bleiben dort als historische Snapshots.
- **xlsx-Library-Wahl:** read-only-Modus, gut typed. Kandidaten: `read-excel-file`, `xlsx` (SheetJS), `exceljs`. CC entscheidet basierend auf TypeScript-Type-Quality + Bundle-Size + Maintenance-Status (`npm view <pkg> time`). Empfehlung Cowork: `read-excel-file` wenn Types und Multi-Sheet-Support gut, sonst `exceljs`.
- **Loader-Output-Form:** `scripts/seed-data/book-roster.json` mit top-level `schemaVersion`, `sourceFile`, `books[]`, `collections[]`. Sortierung: `books` lexicographic nach `externalBookId` (HH-0001 vor W40K-0001 — das ist die natürliche Sortierung wenn man HH separat will, plus es ist deterministisch); `collections` nach `(contentExternalId, collectionExternalId)`. **Re-Run-Stabilität:** zwei Läufe desselben Excels produzieren byte-identische JSON.
- **Slug-Generation deterministisch:**
  - Primär `slugify(title)`.
  - Bei Kollision (zwei Bücher gleichen slugifizierten Titles): Disambiguierung via `slugify(title + "-" + section)`.
  - Bei dreifach-Kollision: loud-Error mit Excel-Zeilennummern und Fingerzeig "setze Slug-Override-Spalte im Excel". Die Excel darf eine optionale `Slug`-Spalte führen, die immer gewinnt wenn nicht-leer (Validierung: Regex `/^[a-z0-9-]+$/`).
- **Type-Normalisierung:** Excel-Werte auf DB-Enum mappen. Die Map ist deterministisch und im Code dokumentiert. `"Audio Drama"` → `audio_drama`, `"Short Story"` → `short_story`, `"Novel"` → `novel`, `"Anthology"` → `anthology`, `"Omnibus"` → `omnibus`, `"Novella"` → `novella`, `"Collection"` → `collection`, `"Artbook"` → `artbook`, `"Scriptbook"` → `scriptbook`. Unbekannter Wert → loud-Error mit Excel-Zeilennummer + Liste der erlaubten Werte.
- **Author-Splitting:** robust gegen die drei häufigen Patterns aus dem Excel:
  - `"Dan Abnett"` → `["Dan Abnett"]`
  - `"Marc Gascoigne and Andy Jones"` → `["Marc Gascoigne", "Andy Jones"]`
  - `"Christian Dunn, Lindsey Priestley"` → `["Christian Dunn", "Lindsey Priestley"]`
  - `"Various Authors"` → CC's Call (siehe Open Questions)
  - `"Christian Dunn (ed.)"` → CC's Call (siehe Open Questions)
- **Validation scharf** (jeder Failure ein loud-Error mit Excel-Zeilennummer):
  - Title leer oder whitespace-only.
  - Year nicht parsable als positive Integer.
  - Type außerhalb der Normalisierungs-Map.
  - `external_book_id` Duplikat innerhalb der 859 Rows.
  - Slug-Triple-Collision (siehe Slug-Generation).
  - Collection-Link verweist auf nicht-existente `external_book_id` (Sheet-internal-Integrity).
- **Brain-Lint-Pfad bleibt unverändert.** `brain:lint` scannt weiter nur `brain/wiki/**` + `brain/raw/**`. Roster-File, Excel-File, Migration-File werden nicht zu Lint-Input.
- **`npm run lint` + `npm run typecheck` + `npm run brain:lint -- --no-write`** grün am Ende.

## Out of scope

- **V2-Pipeline-Refactor.** Discovery-Stage 0 (Wikipedia + TLBranson) wird in 057 nicht abgeschaltet, `run-batch.ts` Selektor-Logik nicht geändert, kein neuer SSOT-Loader-Mode in der Pipeline. Brief 058.
- **Erster 10er-Batch / irgendein Pipeline-Lauf.** Brief 058.
- **DB-Writes aus dem Loader.** Loader produziert JSON, nicht Inserts. DB wird in 058+ über die Pipeline + Apply-Step gefüllt.
- **DetailPanel "Auch enthalten in:"-UI.** Backend (`work_collections`-Junction) ist bereit, Frontend folgt in einem eigenen kleinen Brief später, sobald Excel-Daten via 058+ in der DB sind und mindestens 1 Omnibus mit Children existiert.
- **Junction-Resolver (Surface-Form → Canonical-ID).** Das ist das "4d Review" — Brief ~063 nach 50 real-prozessierten Büchern aus den 10er-Batches. OQ4 + OQ5 unverändert in `brain/wiki/open-questions.md`.
- **Author-/Person-Resolver.** Excel speichert Author als raw string-Liste (`["Dan Abnett"]`). Mapping auf `persons.id` ist Resolver-Job, nicht 057. Die `persons`-Tabelle bleibt nach Truncate intakt mit den heute existierenden Einträgen.
- **Series-ID-Mapping.** Excel `Section/Series` ist menschen-lesbarer String (`"Inquisitor (Eisenhorn/Ravenor/Bequin)"`); Loader speichert raw als `seriesHint`. Mapping auf `series.id` (`eisenhorn`) ist Resolver-/Apply-Job.
- **Migration-Apply auf Production-Supabase.** CC apply'd lokal/Test, nicht prod. Maintainer triggert prod-Apply manuell.
- **`docs/data/`-Aufräumung.** Die anderen Files dort (`buchliste.xlsx`, `Horus_Heresy_Books.xlsx`, `tlbranson_*.html`, `2b-book-roster.md`) bleiben als historische Snapshots. Kein git-rm in 057.
- **Vokabular-Erweiterung** (OQ2 — `duty`, `legion`-Faceten-Dimension). Wartet auf Resolver-Brief.
- **Brain-Lint-Konvention "Brain ↔ Buch-Daten"** aus dem alten 057-Brief. War sinnvoll, aber gehört thematisch zu einem späteren Brain-Hygiene-Brief, nicht in den Schema-Migration-Brief. Heute ist die Disziplin in `pipeline-state.md` "Brain-Regel" als Inline-Quote-Verbot ausreichend formuliert.

## Acceptance

The session is done when:

- [ ] **Excel-Datei umgezogen.** `git mv docs/data/Warhammer_Books_SSOT_enriched.xlsx scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`. Anderer Inhalt von `docs/data/` unangetastet.
- [ ] **Schema-Migration generiert.** `src/db/schema.ts` um die vier Adds erweitert (bookFormat-Enum +3 Werte, sourceKind-Enum +1 Wert, `works.external_book_id`, `bookDetails.notes`, `work_collections` Tabelle inkl. Indexes + Relations). `npm run db:generate` produziert `src/db/migrations/0008_<name>.sql`. Beides committed.
- [ ] **Migration apply'd lokal grün.** CC läuft `npm run db:migrate` gegen seine lokale Supabase (oder Test-Branch) und verifiziert via `psql` o. Ä., dass die neuen Spalten/Enum-Werte/Tabelle existieren. Im Report dokumentiert: `\d+ work_collections`-Output + `SELECT enum_range(NULL::book_format);` + `SELECT enum_range(NULL::source_kind);`.
- [ ] **Truncate-Skript existiert** unter `scripts/db-reset-for-ssot.ts`. Ausführbar via `npm run db:reset-for-ssot -- --confirm` (entsprechender `package.json`-Eintrag). Ohne `--confirm` (oder `DB_RESET_CONFIRM=1`-ENV): loud-Abort mit Hilfetext, kein DB-Touch.
- [ ] **Truncate-Smoke:** lokal apply'd auf der Test-DB. Vorher: `SELECT COUNT(*) FROM works` = 26. Nachher: 0. Gegenchecks: `SELECT COUNT(*) FROM eras` / `factions` / `series` / `persons` / `characters` / `locations` / `sectors` / `services` / `facet_values` / `facet_categories` **unverändert**. Im Report dokumentiert mit den konkreten Counts.
- [ ] **Loader-Skript existiert** unter `scripts/import-ssot-roster.ts`. Ausführbar via `npm run import:ssot-roster` (entsprechender `package.json`-Eintrag).
- [ ] **Loader produziert `scripts/seed-data/book-roster.json`** mit:
  - `schemaVersion: "1.0"`
  - `sourceFile: "Warhammer_Books_SSOT.xlsx"`
  - `books`: 859 Einträge mit Form `{ externalBookId, slug, title, authors, releaseYear, format, seriesHint, sourceUrl, notes, sourceRow }`
  - `collections`: 192 Einträge mit Form `{ contentExternalId, collectionExternalId, displayOrder, confidence, basis }`
  - `books` sortiert nach `externalBookId` ascending; `collections` sortiert nach `(contentExternalId, collectionExternalId)` ascending.
- [ ] **Re-Run-Stabilität verifiziert.** Zweite Loader-Lauf direkt hintereinander: `git diff --quiet scripts/seed-data/book-roster.json` exit 0.
- [ ] **Validation-Smoke** (mindestens drei Failure-Cases gegen ein temporär-modifiziertes Excel oder synthetisches Test-Excel; nicht committed):
  - leerer Title → Error mit Zeilennummer.
  - ungültiger Type → Error mit Zeilennummer + Liste erlaubter Werte.
  - Collection-Link auf nicht-existente external-id → Error.
  Im Report dokumentiert (Output-Snippets).
- [ ] **Slug-Konflikt-Empirie** im Report: wie viele der 859 Bücher brauchen Section-Disambiguierung? Welche (paar Beispiele)? Kommen Triple-Collisions vor (sollten nicht — wenn doch: Maintainer-Hinweis im Report)?
- [ ] **Author-Splitting-Empirie** im Report: Anzahl Rows mit "and"-Trennung, Anzahl mit Komma-Trennung, Anzahl `"Various Authors"` (23 fehlende-Author-Rows + N "Various"-Rows separat reporten), Anzahl `(ed.)`-Trailing.
- [ ] **`npm run lint`** + **`npm run typecheck`** (oder das im Repo etablierte typecheck-Script) + **`npm run brain:lint -- --no-write`** grün.

## Open questions

- **xlsx-Library-Wahl.** `read-excel-file` (klein, gute Types, read-only) oder `exceljs` (größer, vollwertig, Read+Write) oder `xlsx` (SheetJS, weniger Type-Quality)? CC entscheidet, im Report begründen (insbesondere wie gut Multi-Sheet-Support + Type-Inference auf header-row sind, weil das Loader-Skript zwei Sheets liest).
- **`"Various Authors"` im Excel — leere `authors[]` oder Sentinel-Eintrag?** Cowork-Tendenz: leere `authors[]` plus `notes`-Eintrag oder ein expliziter `editorialNote: "various"` — sauberer als ein Pseudo-Person `"Various Authors"`. CC entscheidet.
- **`"(ed.)"`-Trailing.** `"Christian Dunn (ed.)"` → `["Christian Dunn"]` plus eine separate Markierung "Editor"? Heute hat das Roster-Schema keinen Slot dafür. CC's Call: entweder Trailing strippen + ignorieren (Editor-Detail wandert später via Resolver in `work_persons.role = "editor"`), oder einen `editorial: { editors: string[] }`-Slot in den Roster-Eintrag aufnehmen für 058 Pipeline-Konsumtion.
- **Truncate-Confirm-Mechanismus.** `--confirm` CLI-Flag und `DB_RESET_CONFIRM=1` ENV beide unterstützen, oder nur eins? Cowork: beide ist billig + Maintainer-flexibel, aber CC's Call wenn er Argument für Eindeutigkeit hat.
- **`display_order` in `work_collections`-Junction.** Aus Excel ableitbar via Reihenfolge in `Collects Titles` ("Xenos; Malleus; Hereticus" → 0/1/2)? Oder aus `Original #` der Children im Books-Sheet? Beide sind plausibel; CC entscheidet, im Report begründen. Bei Daten ohne klare Reihenfolge (Anthologien, wo TLBranson keine Sequenz markiert): default `0` für alle Children, der Frontend sortiert dann nach `releaseYear` als Fallback.
- **Migration-Drizzle-Name.** Drizzle generiert randomisierte Suffix-Namen (`0007_strange_jumbo.sql`); kein Maintainer-Eingriff nötig, aber wenn CC einen sprechenden Suffix forciert (`0008_ssot_schema.sql`) ist das auch okay.

## Notes

- **Sequenz nach 057.**
  - **Brief 058 — V2-Pipeline-Refactor + erster 10er-Batch.** `run-batch.ts` neuer Modus `--source=ssot --offset=N --limit=M` ersetzt Slug-Sort. Discovery-Stage 0 (Wikipedia + TLBranson) wird im SSOT-Mode komplett übersprungen — die Pipeline liest aus `book-roster.json` direkt. Stage-1-Validators trimmen (`year_outlier` raus weil Year fix, `author_editor_suspicion` raus weil Anthologie-Detection explizit über `format`+`collections`). Stage-3-LLM-Tool-Schema schrumpft (Author/Year/Format raus aus Output, weil Excel-fix). Erster 10er-Batch in derselben Session.
  - **Briefs 059–062.** Fortlaufende 10er-Batches mit Maintainer-Review zwischen den Briefs. Ggf. Mini-Briefs zwischendrin (Vokabular-Erweiterung, Validator-Tuning, Excel-Fix-Re-Imports).
  - **Brief ~063 — Junction-Resolver.** Das "4d Review" — Surface-Form (`"Sons of Horus"`) → Canonical-ID (`sons_of_horus`) Mapping bauen, plus Unresolved-Queue (Option C aus OQ5: Staging-Tabelle mit Cowork-Triage). Empirie aus 50 real-prozessierten Büchern ist dann da.
  - **DetailPanel "Auch enthalten in:"-Mini-Brief** zwischen 058 und 063, sobald die ersten Omnibus + Children in der DB landen. Pure Frontend-Arbeit gegen `work_collections`-Junction.
- **Frontend-Konsequenz aus der Junction-Wahl.** Maintainer-Klarstellung 2026-05-10: Das aktuelle Site-DetailPanel-Popout (kein eigener `/buch/[slug]`-Route, sondern Overlay) soll bei einem einzelnen Buch wie *Xenos* einen Hinweis tragen, dass *Xenos* auch in der Sammlung *Eisenhorn Omnibus* enthalten ist. Das ist ein Server-Query gegen `work_collections WHERE content_work_id = current.id`, liefert Collection-Werks-Rows, DetailPanel rendert eine "Auch enthalten in:"-Sektion. Trivial gegen die Junction, eigener Mini-Brief.
- **Excel-Maintenance-Workflow.** Maintainer-Workflow ist **extern** — du editierst die Excel mit deinem LLM-Workflow, committest die neue Version unter `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, läufst `npm run import:ssot-roster` und committest die frische `book-roster.json`. Re-Run-Stabilität sorgt dafür, dass identisches Excel = identische JSON.
- **Hard delete der 26.** Maintainer-Direktive 2026-05-10 explizit. Hand-getaggte Junctions (Factions/Locations/Characters/Facets der 26) gehen weg; LLM in 058+ baut sie aus den 859 frisch. Die Reference-Tables (`factions`, `locations`, `characters`, `facets`, `persons`) bleiben — sie sind seed-data-getrieben, nicht book-getrieben.
- **Brain-Updates post-057** (Cowork-Job nach Implementer-Report): `open-questions.md` OQ7 + OQ8 streichen (durch SSOT-Pfad abgelöst), `pipeline-state.md` Discovery-Sektion auf "Excel-SSOT statt Wikipedia/TLBranson-Crawl" umstellen, `project-state.md` Phase auf "Excel-Reset + Schema-Migration in flight" updaten, ggf. neue Decision-Page `decisions/why-excel-ssot-not-crawl.md` mit Revisit-Trigger ("falls Excel-Maintenance-Burden zu groß wird"). Nicht 057-Job; ich mach das nach dem impl-Report.
- **Test-Daten.** Die 859 echten Bücher aus dem Excel sind perfektes Test-Material für den Loader. Ein synthetisches Test-Excel braucht es nur für die Validation-Failure-Smoke-Tests (3 bewusst kaputte Rows in einem temp-File, nicht committed).
- **Design-Freedom-Block fehlt absichtlich.** Brief 057 berührt kein UI. Migration-DDL-Form, Skript-Output-Format, Slug-Algorithmus-Details, Validation-Error-Messages-Wortlaut, xlsx-Library-Wahl sind Architektur-/Implementierungs-Entscheidungen.
