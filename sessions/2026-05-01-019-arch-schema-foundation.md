---
session: 2026-05-01-019
role: architect
date: 2026-05-01
status: implemented
slug: schema-foundation
parent: null
links:
  - 2026-05-01-015
  - 2026-05-01-017
  - 2026-04-29-011
  - 2026-05-01-018
  - 2026-05-01-020
commits: []
---

# Stufe 2a — Schema-Foundation (works + Detail-Tabellen + Junctions + Facets + External Links + Persons), Routen umgestellt, Build grün

## Goal

Die `books`-zentrierte Datenstruktur abreißen und durch eine werks-zentrierte Foundation ersetzen — in einem Wurf, mit grünem Build, mit dem aktuellen 3-Buch-Fixture (Horus Rising, Eisenhorn: Xenos, Dark Imperium) voll annotiert auf den neuen Tabellen. Alles, was die DB anfasst, wird im selben Brief umgestellt: Hub-Footer-Count, Timeline-Page, `scripts/seed.ts`. UI-Stubs (Map, Ask, Buchaufruf, Fraktion-/Welt-/Charakter-Detailseiten) bleiben unverändert Stubs — das ist Stufe 2c. Der Brief ist als self-sufficient gedacht — alle Schema-Vorgaben stehen unten in Constraints und Notes; keine externe Spec nötig.

## Design freedom — read before everything else

Dieser Brief ist überwiegend Schema-Arbeit, wo die Architektur deterministisch ist. Es gibt eine kleine UI-Stelle, die freigegeben ist, und das ist sie:

**Multi-Author-Display in Overview / EraDetail.** Heute hat `TimelineBook` ein `author: string`-Feld; die Komponenten rendern es als einzelnen String. Mit dem `persons`-Modell wird Autorenschaft eine Junction mit 0 bis N Reihen. Du entscheidest, wie 0 / 1 / 2+ Autoren angezeigt werden — Komma-Trennung, „&", Bullet, Fallback bei 0 Autoren, Truncation bei 3+, Tooltip mit Vollliste, Punkt-Verkettung als Mini-Bilingual-Affordance — alles dein Call. Halte dich an das bestehende Vokabular von Overview / EraDetail (Session 011/013): serif für Titel, mono für Kicker, oklch-Leitfarben, keine fremden Layout-Patterns. Im Sanity-Seed dieser Session haben alle 3 Bücher genau einen Autor, also rendert die UI exakt wie bisher; die Multi-Author-Codepfade existieren ab Stufe 2a stillschweigend für 2b.

Sonst: keine UI-Aesthetik-Entscheidungen in diesem Brief. Hub, Aquila, Overview, EraDetail bleiben visuell wie nach 2026-04-30-013. Wenn dir beim Reinhängen der neuen Daten ein bug auffällt, dass eine Komponente bricht — fix es, aber nicht redesign.

## Context

### Wo wir stehen

- **Build/Deploy ist grün** (Sessions 014/015 + 016/017 shipped Phase-1.5-Hygiene: CI auf PRs, Drizzle-Migration-on-Vercel-Deploy via `scripts/migrate.ts`, `/healthz`-Endpoint).
- **Timeline läuft** mit Overview-Ribbon + EraDetail (Session 011) plus dem polish aus 012/013 (buzzy hover, count badges, themed brackets).
- **Sanity-Fixture: 3 Bücher** (`hh01` Horus Rising, `eis01` Eisenhorn: Xenos, `di01` Dark Imperium) sind in `scripts/seed-data/books.json` und werden via heutiger `scripts/seed.ts` in die alte `books`-Tabelle geladen.
- **Session 018 (DetailPanel + Deep-Linking) liegt auf Eis.** Wurde vor dem Plan-Wechsel zu DB-First geschrieben, baut gegen das alte Schema. Status `open`, wird nicht implementiert. Reaktivierung als Stufe 2c nach 2a/2b — entweder Neuschrift oder substanzielle Überarbeitung. Du fasst 018 in dieser Session NICHT an.

### Was sich ändert

Die Daten-Welt geht von „nur Bücher" zu „Werke (Bücher heute, Filme/Serien später, YouTube-Channels noch später) mit klar getrennten typ-spezifischen Eigenschaften, frei erweiterbaren Klassifikations-Dimensionen, strukturiertem Weiterleitungs-Hub, sauberen Personen- und Kampagnen-Refs". Das ist der **Class-Table-Inheritance**-Plan aus dem v2-Brainstorm.

### Referenzdaten

`eras`, `factions`, `series`, `sectors`, `locations`, `characters`, `submissions` bleiben **unangetastet**. Das sind kuratierte, valide Reference-Tables — der Wert dieses Schemas-Wurfs liegt darin, dass alles **außerhalb** dieser Tabellen neu geschnitten wird.

### Routen die heute DB lesen

Nur zwei: `src/app/page.tsx` (Hub-Footer-Count via `select count(*) from books`) und `src/app/timeline/page.tsx` (Drizzle-relational-Query auf `books` mit `factions` + `series`-Joins). Alle anderen Routen sind Stubs ohne DB-Zugriff. Dein Migrations-Scope ist also: diese zwei Routen + `scripts/seed.ts`.

## Constraints

### Schema-Topologie

1. **Drop-and-create.** Die alten Tabellen `books`, `book_factions`, `book_characters`, `book_locations` werden vollständig entfernt. Daten gehen nicht verloren, weil das Seed das einzige war, was drin stand. Migrations-Strategie: Forward, kein Squash (siehe Constraint 29).

2. **Reference-Tabellen unangetastet.** `eras`, `factions`, `series`, `sectors`, `locations`, `characters`, `submissions` werden NICHT geändert. Keine neuen Spalten dort. Wenn dir beim Reinhängen ein Bedarf auffällt — flag in Open Issues, nicht im selben Brief umsetzen.

3. **Class-Table-Inheritance, manuell.** Eltern-Tabelle `works`, Kind-Tabellen `book_details` / `film_details` / `channel_details` / `video_details` mit `work_id` als PK *und* FK auf `works.id` (`onDelete: cascade`). Postgres' `INHERITS`-Feature wird **nicht** genutzt (FK-Limitierung — siehe v2-Brainstorm § 4.4).

4. **Discriminator-Integrität.** Es darf nicht passieren, dass eine `book_details`-Zeile an einen `works`-Row mit `kind != 'book'` hängt. **Pflicht-Minimum: app-seitig** im Seed-Skript und in jedem zukünftigen Insert-Pfad sauber gehalten — z.B. via Helper-Funktion `insertWork(kind, ...details)`, die garantiert die richtige Detail-Tabelle bedient. **Optional: DB-Härtung** via CHECK-Trigger oder composite-FK auf `(id, kind)` mit generated literal column — sauber, aber Drizzle-finicky; wenn du dort wackelst, lass sie weg. Drei Optionen mit SQL-Skizzen in `## Notes` § C. Sanity-Verifikation gehört in jedem Fall in die Acceptance: nach `npm run db:seed` muss `SELECT count(*) FROM book_details bd JOIN works w ON w.id = bd.work_id WHERE w.kind != 'book';` (analog für die anderen Detail-Tabellen) `0` zurückgeben.

5. **`works.kind` ist pgEnum** mit den Werten `book | film | tv_series | channel | video`. **Bewusste Auslassung:** `audio_drama` ist *nicht* im Enum — Audio-Dramen werden in 2a als `kind=book` mit `format`-Facet `[audio_drama]` modelliert. Wenn ein konkretes Werk später diese Vereinfachung nicht trägt (z.B. „Realm of the Damned" als eigenständiges Voll-Cast-Drama ohne zugrundeliegenden Roman), wird das Enum additiv erweitert plus `audio_drama_details`-Tabelle ergänzt. **Bewusste Umbenennung:** `tv_series` statt `series`, um die Wort-Kollision mit der `series`-Tabelle (Buch-Serien) permanent zu vermeiden.

6. **`works.canonicity` ist pgEnum** mit `official | fan_classic | fan | apocrypha | unknown`. Default: `official`.

7. **In-universe-Zeit liegt auf `works`**, nullable. `start_y`, `end_y` als `numeric(10,3)` (gleiche Skala wie heute). Channels haben dort NULL.

8. **Realweltjahr-Strategie.**
   - `works.release_year integer` — universell, Sort-/Filter-Achse für alle `kind`s. Pflichtfeld? Diskutierbar — empfohlen `nullable` (manche Werke haben keinen klaren Jahreswert).
   - `film_details.release_date date` — Volldatum, wo es sinnvoll ist.
   - `video_details.uploaded_at timestamp` — Volldatum.
   - **`book_details.pub_year` existiert NICHT** — `works.release_year` allein.

9. **Junctions hängen nur an `works.id`.**
   - `work_factions(work_id, faction_id, role)` — composite-PK `(work_id, faction_id)`, `role varchar(32) default 'supporting'` mit Werten `primary | supporting | antagonist` (wie altes `book_factions`).
   - `work_characters(work_id, character_id, role)` — composite-PK `(work_id, character_id)`, `role varchar(32) default 'appears'` mit Werten `pov | appears | mentioned`.
   - `work_locations(work_id, location_id, role, at_y)` — composite-PK `(work_id, location_id)`, `role varchar(32) default 'secondary'` mit Werten `primary | secondary | mentioned` (**neu** gegenüber altem `book_locations`), `at_y numeric(10,3) nullable`.
   - Ob diese drei `role`-Felder als pgEnums oder als varchar-mit-default umgesetzt werden, ist deine Wahl — beides legitim, im Report begründen. (Empfehlung: varchar mit default, weil die Werte selten/nie wachsen und eine Migration für ein 32-char-Default in 6 Monaten nicht weh tut.)

10. **Faceted Classification: drei Tabellen.**
    - `facet_categories(id varchar pk, name text, description text, display_order int, multi_value boolean, visible_to_users boolean default true)`. IDs siehe Konstraint 11.
    - `facet_values(id varchar pk, category_id varchar fk, name text, description text, display_order int)`. IDs siehe Konstraint 12.
    - `work_facets(work_id uuid fk, facet_value_id varchar fk)`. Composite-PK `(work_id, facet_value_id)`. **Bewusst keine `note`-Spalte** — wenn ein konkreter editorial-Workflow später Anhänge-Notizen braucht („cw_violence — graphic in chapter 14"), ist das eine 1-Spalten-Migration. Bis dahin Spalten-Inflation ohne Use-Case vermeiden.

11. **Initialer Facet-Catalog (12 Kategorien)** — geseedet als `facet_categories`-Zeilen. IDs, multi-value-Flag und full Werte-Liste in `## Notes` § A unten. Keine UI-Surfaces in 2a.

12. **NEON-14 Trigger-Warnings** als 14 `facet_value`-Zeilen unter `category_id='content_warning'`. Stable IDs: `cw_violence`, `cw_sex`, `cw_stigma`, `cw_disturbing`, `cw_language`, `cw_risky_behaviour`, `cw_mental_health`, `cw_death`, `cw_parental_guidance`, `cw_crime`, `cw_abuse`, `cw_socio_political`, `cw_flashing_lights`, `cw_objects`. Display-Reihenfolge wie aufgelistet.

13. **External Links + Services: zwei verbundene Tabellen.**
    - **`services`** als Reference-Tabelle (analog zum bestehenden Pattern bei `eras` / `factions` / `sectors` / `locations` / `characters`):
      `services(id varchar(64) pk, name text, domain text nullable, affiliate_supported boolean default false, display_order int default 0)`.
      Initial-Seed ~18 Zeilen mit den bekannten Anbietern: `black_library`, `amazon`, `audible`, `kindle`, `apple_books`, `spotify`, `warhammer_plus`, `amazon_video`, `youtube`, `lexicanum`, `wikipedia`, `wikidata`, `isfdb`, `open_library`, `tmdb`, `imdb`, `goodreads`, `letterboxd`.
      `domain` ist optional (`blacklibrary.com`, `amazon.de`, …) und kann von späteren Auto-Detection-Helpern genutzt werden — keine Pflichtfüllung jetzt, nur Schema-Vorbereitung.
      Neue Anbieter ergänzen heißt `INSERT INTO services` ohne Schema-Migration. Konsistent mit der bestehenden Reference-Table-Linie.
    - **`external_links`** als Junction-zu-Werks:
      `external_links(id uuid pk, work_id uuid fk → works.id on delete cascade, kind external_link_kind enum, service_id varchar fk → services.id, url text, label text nullable, region varchar(8) nullable, affiliate boolean default false, display_order int default 0)`.
    - Enum `external_link_kind`: `read | listen | watch | buy_print | reference | trailer | official_page` (klein, stabil, Enum gerechtfertigt).
    - Service als FK statt Enum, weil neue Storefronts schneller anfallen werden als jeder Enum-Migrations-Zyklus.
    - URL-Spalten der alten `books`-Tabelle (`goodreads_url`, `lexicanum_url`, `black_library_url`) gibt es in den neuen Detail-Tabellen NICHT — alles über `external_links`.

14. **Persons unified.**
    - `persons(id varchar pk, name text, name_sort text, bio text nullable, birth_year int nullable, lexicanum_url text nullable, wikipedia_url text nullable, extras jsonb nullable)`. ID-Konvention wie bei anderen Reference-Tables: snake_case (`dan_abnett`, `aaron_dembski_bowden`, `guy_haley`).
    - `work_persons(work_id uuid fk, person_id varchar fk, role person_role enum, display_order int default 0, note text nullable)`. Composite-PK `(work_id, person_id, role)` — gleiche Person darf mehrere Rollen am selben Werk haben.
    - Enum `person_role`: `author | co_author | translator | editor | narrator | co_narrator | full_cast | director | co_director | cover_artist | sound_designer`.

15. **Campaigns: nicht in 2a.** Ursprünglich für 2a geplant, aber vor Implementierung gestrichen (siehe Out-of-scope unten). Die 3 Fixture-Bücher brauchen kein Kampagnen-Konzept — Horus Heresy ist Era, nicht Campaign in unserem Modell. Wenn 2b oder später konkreten Bedarf zeigt, kommen `campaigns` plus `campaign_factions`-Junction (FK-validiert, kein `text[]`) plus `work_campaigns` als kleine additive Migration. Heute: keine Tabellen, kein Seed, kein Schema-Eintrag.

16. **`works`-Provenance unverändert vom Heute.** `source_kind` (das bestehende pgEnum, ggf. um `tmdb` / `imdb` / `youtube` erweitern wenn du sauberen Bedarf siehst — sonst belassen) plus `confidence numeric(3,2) default '1.00'`. **Bewusst keine `extras jsonb`-Spalte** auf `works` und `book_details` — das alte `books.extras` wurde nie befüllt, und ein Misc-jsonb ohne identifizierten Use-Case zieht Müll an (uneinheitliche Keys, kein Default, kein Type-Check, awkward zu queryen). Wenn später ein konkreter Bedarf auftaucht, ist eine `extras`-Spalte nachträglich eine 1-Zeilen-Migration. `persons.extras` (siehe Constraint 14) bleibt erhalten, weil dort der Use-Case konkret ist (rollen-spezifische Felder wie `audible_profile_url` für Narrator*innen, `imdb_id` für Regisseur*innen). Claims/Overrides-Layer ist Phase 4, nicht hier.

### Drizzle / TypeScript

17. **Drizzle relations definiert** für jede Junction und jede Eltern-/Kind-Beziehung, sodass die Timeline-Page weiterhin via `db.query.works.findMany({ with: { ... } })` mit eingebetteten Joins lesen kann. Konkret: `works ↔ book_details` (one-to-one), `works ↔ work_factions ↔ factions`, `works ↔ work_persons ↔ persons`, `works ↔ series` (über `book_details.series_id`), `works ↔ work_facets ↔ facet_values ↔ facet_categories`, `works ↔ external_links`. Reicht für Routes-Migration.

18. **TypeScript strict bleibt strict.** Kein `any`. Drizzle-generierte Typen müssen sauber durchlaufen. Wenn du gegen ein Type-Loch läufst, schreibst du einen Type-Guard, keine Cast-Krücke.

19. **Server-only.** `db/client.ts` und `db/schema.ts` werden in keiner `"use client"`-Datei importiert. Wenn das Verfolgen einer Refactor-Spur dich an den Rand bringt, splitte Komponenten explizit.

### Routen-Umstellung

20. **`src/app/page.tsx` Hub-Footer-Count.** Heute: `select count(*) from books`. Morgen: `select count(*) from works where kind = 'book'`. Nichts anderes ändert sich an dieser Seite.

21. **`src/app/timeline/page.tsx` Server-Fetch.** Heute liest es `db.query.books.findMany({ with: { factions: ..., series: ... } })` und mappt auf `TimelineBook[]`. Morgen liest es `db.query.works.findMany({ where: kind = 'book', with: { bookDetails: { with: { series: ... } }, factions: ..., persons: { with: { person: ... }, where: role = 'author' } } })` und mappt auf den umstrukturierten `TimelineBook`. Die einzige strukturelle Änderung am `TimelineBook`-Shape ist `author: string` → `authors: string[]` — der Rest des Shapes (id, slug, title, startY, endY, factions, series) bleibt identisch zum Konsum durch Overview/EraDetail.

22. **`src/lib/timeline.ts` `TimelineBook`-Interface** wird passend angepasst. `authors: string[]` ersetzt `author: string`. Die `bookMatchesFilters`-Funktion enthält heute eine `f.authors.has(book.author)`-Zeile; passe sie auf `book.authors.some(a => f.authors.has(a))` an.

23. **`src/components/timeline/Overview.tsx` und `EraDetail.tsx`** rendern `book.authors`. Wo heute `{b.author}` steht, kommt deine multi-author-Anzeige hin. Wenn ein Buch keine Autoren hat (im 3-Buch-Fixture nicht der Fall, in 2b möglich), ist die Anzeige eine leere Zeile oder ein dezenter „Autor unbekannt"-Fallback — dein Aufruf, im Report begründen.

24. **Stubs bleiben Stubs.** `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` werden in 2a NICHT verkabelt. Sie kompilieren weiter wie vorher (sie haben keine `books`-Imports — also passiert dort nichts).

### Seed

25. **`scripts/seed.ts` rewritten.** Idempotent — mehrfaches Ausführen gibt denselben DB-Zustand. Reihenfolge:
    - Reference-Tables seeden wie heute (eras, factions, series, sectors, locations, characters — keine Änderung).
    - **Neu:** services (~18 Zeilen, siehe Constraint 13), facet_categories (12 Reihen), facet_values (alle Werte aus `## Notes` § A).
    - **Neu:** persons (~3 Zeilen für die Fixture-Autoren — `dan_abnett`, `guy_haley`).
    - **Werks-Daten:** 3 works-Zeilen + 3 book_details-Zeilen + 3 work_factions-Zeilen + 3 work_persons-Zeilen (role=author) + work_facets pro Buch (mindestens `format=book`, `tone=grimdark`, ein `protagonist_class`-Wert pro Buch — siehe Notes § B), + external_links pro Buch (mindestens 1, basierend auf den URLs aus dem alten books.json wenn vorhanden — heute haben die 3 Bücher keine URLs, also ist 0–1 external_links akzeptabel; FK auf `services.id`).
    - work_characters und work_locations bleiben für die 3 Fixture-Bücher leer (ihr `books.json` hatte keine character-/location-Daten); wenn du 1 row pro Junction zum Smoke-Test einfügen willst, ohne Canon zu erfinden, ist das fine — z.B. `eisenhorn` als character für eis01 mit role=`pov`. Dein Aufruf.
    - Im Output melden: Anzahl seeded works, book_details, facet_categories, facet_values, work_facets, services, persons, work_persons, external_links. Bestehende Logging-Konvention (`Inserted N x.`) beibehalten. Keine campaigns-Logging-Zeile, weil keine Tabelle.

26. **Seed-Daten-Format.** Du wählst, ob `books.json` als single-table-Liste mit Inline-Annotationen (factions, persons, facets, external_links als Felder) bleibt und der Seed entpackt, oder ob du auf eine multi-file-Struktur (`works.json` + `book_details.json` + `external_links.json` + `persons.json` + `work_facets.json`) splittest. Wichtige Constraints: (a) Stufe 2b wird 20 hand-kuratierte Bücher voll annotiert hinzufügen, (b) Philipp pflegt das per Hand. Wähle die Form, die er in 2b gut editieren kann. Im Report begründen.

27. **`scripts/seed-data/README.md`** aktualisieren: aktuelle Tabellennamen (`works` + `book_details` statt `books`), aktueller Stand von `books.json` (3 Sanity-Bücher, nicht „leer"), Verweis auf neue JSON-Strukturen wenn du gesplittet hast.

### Indizes

28. Mindestens diese Indizes anlegen:
    - `works(start_y)` — Timeline-Sortierung.
    - `works(kind)` — Filter „nur Bücher" / „nur Filme".
    - `works(canonicity)` — Filter „nur offiziell".
    - `works(release_year)` — Sort-Achse.
    - `works(slug)` — unique constraint sowieso, aber als Index explizit (für `/buch/[slug]` Lookups in 2c).
    - `work_factions(faction_id)` — „alle Werke dieser Faktion".
    - `work_characters(character_id)` — „alle Werke mit dieser Figur".
    - `work_locations(location_id)` — „alle Werke an diesem Ort" (Cartographer in 2c).
    - `work_persons(person_id)` — „alle Werke dieser Person".
    - `work_facets(facet_value_id)` — „alle Werke mit diesem Facet".
    - `external_links(work_id)` — Detail-Page-Lookup.
    - `external_links(service_id)` — „alle Links zu diesem Anbieter" für Audit / Service-Migrations.
    - `facet_values(category_id)` — „alle Werte einer Kategorie".
    - `book_details(series_id, series_index)` — wie heute auf `books`.

    Wenn du weitere Indizes für sinnvoll hältst (z.B. composite-Indizes für häufige Filterkombinationen), füg sie hinzu und begründe im Report. Entferne nichts aus der obigen Liste.

### Migrations

29. **Forward-Migration, kein Squash.** Bestehende Migration-Files `0000_jazzy_kree.sql` und `0001_smoke-test-deploy.sql` bleiben unverändert auf der Platte und in `meta/_journal.json`. Neue Migration thematisch in eine oder mehrere Files: entweder ein Atom (`0002_drop_book_tables_create_works.sql`), oder gesplittet — `0002_works_foundation`, `0003_facets`, `0004_external_links`, `0005_persons`, … Wenn du splittest, im Report begründen warum (Lesbarkeit, granulare Rollback-Möglichkeit). Squash ist explizit ausgeschlossen, weil die Drizzle-`__drizzle_migrations`-History auf der Supabase-Instanz schon angewendete Hashes für 0000/0001 protokolliert hat — eine neuaufgesetzte Sequenz mit gleichem Filename, aber unterschiedlichem Hash, würde beim nächsten Vercel-Deploy als „unbekannte Migration" laufen und in halb-migrierten Zuständen landen.

30. **Migration-on-Deploy-Wiring darf nicht brechen.** Die Smoke-Test-Migration `0001_smoke-test-deploy.sql` ist heute der Beweis, dass Vercel `npm run vercel-build` mit `tsx scripts/migrate.ts && next build` durchläuft. Egal welche Strategie du wählst: nach 2a muss mindestens eine no-op-oder-real-migration im Sequenz-Tail liegen, sodass jeder Vercel-Deploy einen End-to-End-Migrate-Lauf demonstriert. Wenn du squashst, kannst du gern eine neue `0001_smoke-test-deploy.sql` als zweite Migration in der neuen Sequenz mitführen. Im Report begründen.

### Build-Akzeptanz

31. `npm run lint` grün. `npm run typecheck` grün. `npm run build` lokal grün. Vercel-Deploy auf Preview-Branch grün (Migrate-Step + next-build-Step beide ohne Fehler). `/healthz` antwortet 200.

## Out of scope

- **Refactoring der Reference-Tables** (`eras`, `factions`, `series`, `sectors`, `locations`, `characters`, `submissions`). Wenn dir während des Schemas etwas unsauber vorkommt, flag in „For next session", nicht in 2a fixen.
- **`campaigns` und `work_campaigns`-Tabellen.** Aus 2a vor Implementierung gestrichen (siehe Constraint 15). Originaler Entwurf hatte ein `involved_factions text[]`-Feld ohne FK-Validierung, was das sonstige Reference-Tabellen-Pattern bricht. Wenn 2b oder eine spätere Phase einen konkreten Use-Case hat, kommt es als kleine additive Migration mit echter `campaign_factions`-Junction.
- **Claims/Overrides Provenance-Layer.** Phase 4. Nicht in 2a.
- **Population von `film_details`, `channel_details`, `video_details`.** Tabellen werden leer angelegt; keine Filme/Channels/Videos werden in 2a geseedet. Stufe 3 / 5.
- **DetailPanel + Buch-Detailseite + Cartographer mit Buch-Pins.** Stufe 2c.
- **Mehr als 3 Bücher seeden.** Stufe 2b.
- **Audio-Drama-Detail-Tabelle.** `kind='audio_drama'` ist absichtlich nicht im Enum (siehe Constraint 5). Audio-Dramen werden als `kind='book'` mit `format=[audio_drama]` modelliert. Wenn dir das beim Seeden auf den Wecker geht, flag in Open Issues.
- **`submissions`-Schema-Anpassung.** Heute `entityType: varchar` mit polymorpher payload. Bleibt. Anpassung an die neue Welt ist späterer Brief.
- **i18n.** Werks-Sprache ist ein Facet (Constraint 11). Site-i18n ist Phase 6, nicht hier.
- **Affiliate-Aktivierung.** `external_links.affiliate boolean default false` existiert; aktiv geschaltet wird nichts.
- **Prototyp anfassen.** `archive/` ist gitignored und gefroren.
- **UI-Redesign.** Hub, Aquila, Overview, EraDetail bleiben visuell identisch zum Stand nach Session 013. Einzige UI-Erweiterung: Multi-Author-Display (Design freedom oben).
- **Session 018 (DetailPanel) anfassen.** Auf Eis. Nicht implementieren, nicht ändern, nicht löschen — bleibt offen liegen für 2c.

## Acceptance

Die Session ist fertig, wenn:

### Schema-Existenz

- [ ] Alte Tabellen `books`, `book_factions`, `book_characters`, `book_locations` existieren in der DB nicht mehr.
- [ ] Neue Tabellen existieren: `works`, `book_details`, `film_details`, `channel_details`, `video_details`, `work_factions`, `work_characters`, `work_locations`, `facet_categories`, `facet_values`, `work_facets`, `services`, `external_links`, `persons`, `work_persons`. (`campaigns` und `work_campaigns` existieren *nicht* — siehe Out-of-scope.)
- [ ] pgEnums existieren: `work_kind` (book/film/tv_series/channel/video), `canonicity` (official/fan_classic/fan/apocrypha/unknown), `external_link_kind`, `person_role`. Bestehende `source_kind`, `factionAlignment`, `submission_status`-Enums bleiben oder werden begründet erweitert (z.B. `source_kind` um `tmdb`/`imdb`/`youtube`). **`external_link_service` ist kein Enum** — Service ist FK auf die `services`-Reference-Tabelle.
- [ ] Discriminator-Integrität ist mindestens app-seitig garantiert: das Seed-Skript kann keine `book_details`-Zeile gegen einen Nicht-Buch-`works` einfügen, und nach `npm run db:seed` liefert `SELECT count(*) FROM book_details bd JOIN works w ON w.id = bd.work_id WHERE w.kind != 'book';` (analog für die anderen Detail-Tabellen) jeweils `0`. DB-Härtung via CHECK-Trigger oder composite-FK ist erlaubt aber nicht zwingend — im Report begründen, was du gewählt hast.

### Indizes

- [ ] Alle in Constraint 28 gelisteten Indizes existieren in der DB.

### Drizzle-Layer

- [ ] `src/db/schema.ts` enthält alle neuen Tabellen, Enums, Junctions und `relations()`-Definitionen für die Joins, die die Timeline-Page braucht.
- [ ] `npm run db:generate` läuft sauber durch und erzeugt eine Migration ohne Diff (Schema-Drift = 0).
- [ ] `npm run typecheck` grün.

### Seed

- [ ] `npm run db:seed` läuft idempotent durch. Output meldet u.a.: ~18 services, 12 facet_categories mit jeweils allen in Notes § A spezifizierten Werten (NEON-14 in `content_warning` plus die anderen 11 Kategorien-Werte vollständig), ≥2 persons, 3 works (kind=book), 3 book_details, ≥3 work_factions, 3 work_persons (role=author), ≥3 work_facets, 0–N external_links, 0 work_locations und work_characters (oder ≥1 wenn du smoke-tests wolltest).
- [ ] Drizzle Studio (`npm run db:studio`) zeigt alle Tabellen und Reihen erwartungsgemäß.

### Routen

- [ ] `/` rendert mit „**3** Novels Indexed" im Footer (oder „1 Novel" wenn ich mich verzählt habe — der Punkt: Count kommt aus der neuen `works`-Tabelle gefiltert auf `kind='book'`).
- [ ] `/timeline` rendert die Overview-Ribbon mit 3 Buch-Pins, klick auf eine Era-Section zeigt EraDetail mit den dazugehörigen Büchern. Visuelles Verhalten identisch zum Stand nach 013.
- [ ] `/timeline?era=horus_heresy` zeigt Horus Rising in EraDetail. `/timeline?era=indomitus` zeigt Dark Imperium. `/timeline?era=long_war` zeigt Eisenhorn: Xenos.
- [ ] `/timeline?era=M30|M31|M42` redirectet weiter wie bisher (Legacy-Mapping aus Session 008/011 unverändert).
- [ ] Stubs `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` rendern fehlerfrei (kein DB-Aufruf, kein Build-Fehler).
- [ ] `/healthz` antwortet 200.

### Build & CI

- [ ] `npm run lint` grün.
- [ ] `npm run typecheck` grün.
- [ ] `npm run build` lokal grün.
- [ ] PR-CI grün (`ci / lint-and-typecheck`-Check).
- [ ] Vercel-Preview-Deploy grün (Migration-Step + next-build-Step beide).

### Dokumentation

- [ ] `scripts/seed-data/README.md` updated: neue Tabellennamen, aktueller `books.json`-Status (oder neue JSON-Struktur wenn gesplittet), Verweis auf 2b für die nächste Daten-Erweiterung.
- [ ] `ARCHITECTURE.md` updated wenn dort ein Schema-Diagramm liegt (aktuell ist die Datei vermutlich noch dünn — siehe selbst, prüfe).
- [ ] `ROADMAP.md` Stufe 2a abgehakt, Stufe 2b (Rich-Seed 20 Bücher) explizit als Nächstes.
- [ ] Implementer-Report unter `sessions/2026-05-01-XXX-impl-schema-foundation.md` enthält alle in „Open questions" unten aufgeworfenen Punkte mit deinen Antworten/Beobachtungen.

### Sessions / Logs

- [ ] Diese Session (`2026-05-01-019`) auf `status: implemented` setzen, Commits-Liste in der Frontmatter füllen.
- [ ] `sessions/README.md` Active-Threads-Tabelle aktualisieren (019 als implementiert, neue Impl-Session als jüngste Zeile).

## Open questions

Bitte im Report beantworten:

- **Discriminator-Integrität.** Welche Form hast du gewählt? App-only? CHECK-Trigger? Composite-FK trotz Drizzle-Friktion? Welche Trade-offs hast du beobachtet — und wenn du beim Composite-FK an der Drizzle-Klippe abgebrochen hast: wäre Single-Table-Inheritance (alles in `works`, NULL für nicht-zutreffende Felder, dafür Discriminator-Schmerz weg) eine Option, die du in einem Folgebrief vorschlagen würdest?
- **Migrations-Strategie.** Hast du in eine Migration-File gepackt oder thematisch gesplittet (`works_foundation` / `facets` / `external_links` / `persons`)? Welche Trade-offs hast du gesehen? Wie liest sich der Migrate-Output beim Vercel-Deploy?
- **Drizzle Relations API.** v1 (`relations()`) oder v2 (`defineRelations()`)? Trade-offs, die du beobachtet hast?
- **`role`-Felder als pgEnum oder varchar.** Bei `work_factions.role`, `work_characters.role`, `work_locations.role` — wie hast du es gemacht und warum?
- **Seed-Daten-JSON-Form.** Single-file mit Inline-Annotationen vs. multi-file? Wie editor-friendly ist die Form für Philipps 20-Bücher-Hand-Kuration in 2b?
- **`work_persons.display_order`.** Sinnvoll bei 3 Fixture-Büchern? Hast du es populiert? Falls ja, mit welcher Heuristik?
- **`works.release_year` nullable.** Hast du es nullable gemacht oder als Pflichtfeld? Falls Pflichtfeld: wie hast du Channels behandelt (deren „release_year" semantisch unklar ist)?
- **Multi-Author-Display in Overview/EraDetail.** Welche Form hast du gewählt? Screenshot oder verbale Beschreibung im Report.
- **Facet-IDs aus § Notes A.** Sind dir IDs unangenehm aufgefallen (z.B. `male`/`female` als Gender-IDs lesen sich am Query-Site als bare strings ohne Kontext — würdest du `protagonist_male`/`protagonist_female` bevorzugen)?
- **`source_kind`-Enum-Erweiterung.** Hast du Werte hinzugefügt (`tmdb`, `imdb`, `youtube`)? Oder belassen?
- **Was war das schmerzhafteste Stück?** Damit der nächste Brief weiß, wo die Welle bricht.

## Notes

### A. Vollständiger Facet-Catalog (12 Kategorien, alle Initialwerte)

Aus v2-Brainstorm § 7.5, finalisierter Stand. ID-Konvention: snake_case. `multi_value: true` heißt ein Werk darf mehrere Werte gleichzeitig haben.

**1. `format`** (multi_value: true, visible_to_users: true, display_order: 10)
Werte: `book`, `audiobook`, `animation`, `live_action`, `audio_drama`, `podcast`.

**2. `protagonist_gender`** (multi_value: true, visible_to_users: true, display_order: 20)
Werte: `male`, `female`, `non_binary`, `mixed`, `ensemble`.
*(Falls du IDs eindeutiger willst — `protagonist_male`/`protagonist_female` etc. — flag in Open Issues. Empfehlung: belassen, weil das Facet die Eindeutigkeit über `category_id` kriegt.)*

**3. `protagonist_class`** (multi_value: true, visible_to_users: true, display_order: 30)
Werte: `space_marine`, `guardsman`, `inquisitor`, `tech_priest`, `sister`, `custodes`, `civilian`, `xenos`, `daemon`, `multi`.

**4. `pov_side`** (multi_value: true, visible_to_users: true, display_order: 40)
Werte: `imperium`, `chaos`, `xenos`, `dual`, `neutral`.

**5. `scope`** (multi_value: true, visible_to_users: true, display_order: 50)
Werte: `squad`, `company`, `regiment`, `planetary`, `sector`, `galactic`.

**6. `entry_point`** (multi_value: false, visible_to_users: true, display_order: 60)
Werte: `standalone`, `series_start`, `mid_series`, `series_finale`, `requires_context`.

**7. `length_tier`** (multi_value: false, visible_to_users: true, display_order: 70)
Werte: `novella`, `short`, `standard`, `doorstopper`.

**8. `plot_type`** (multi_value: true, visible_to_users: true, display_order: 80)
Werte: `war_story`, `heist`, `mystery`, `siege`, `court_intrigue`, `journey`, `last_stand`, `political_thriller`, `character_study`.

**9. `tone`** (multi_value: true, visible_to_users: true, display_order: 90)
Werte: `grimdark`, `hopepunk`, `somber`, `action_heavy`, `philosophical`, `cosmic_horror`, `satirical`.

**10. `theme`** (multi_value: true, visible_to_users: true, display_order: 100)
Werte: `betrayal`, `redemption`, `war`, `faith`, `loyalty`, `hubris`, `brotherhood`, `sacrifice`, `doubt`.

**11. `content_warning`** (multi_value: true, visible_to_users: true, display_order: 110)
NEON-14 Set, Werte:
- `cw_violence` — Gewalt
- `cw_sex` — Sexuelle Inhalte
- `cw_stigma` — Stigmatisierung / Vorurteil
- `cw_disturbing` — Verstörender Inhalt
- `cw_language` — Vulgärsprache
- `cw_risky_behaviour` — Riskantes Verhalten
- `cw_mental_health` — Psychische Gesundheit
- `cw_death` — Tod
- `cw_parental_guidance` — Elterliche Aufsicht empfohlen
- `cw_crime` — Verbrechen
- `cw_abuse` — Missbrauch
- `cw_socio_political` — Sozio-politische Inhalte
- `cw_flashing_lights` — Flackerlicht
- `cw_objects` — Spezifische Objekte (Spinnen, Nadeln etc.)

Quelle: Bridgland et al. 2022, [PMC9067675](https://pmc.ncbi.nlm.nih.gov/articles/PMC9067675/).

**12. `language`** (multi_value: true, visible_to_users: true, display_order: 120)
Werte: `en`, `de`, `fr`, `it`, `es`. Werks-Sprache (in welcher Sprache wurde publiziert), nicht Site-Sprache.

### B. Vorschlag für Sanity-Seed-Facet-Zuordnung

Damit du nicht zur Lore-Zwerg-Recherche gezwungen bist, hier eine sichere, defensiv kuratierte Ausgangsmenge — du darfst abweichen:

**Horus Rising (`hh01`)**: format=`book`, protagonist_class=`space_marine`, pov_side=`imperium`, scope=`galactic`, entry_point=`series_start`, length_tier=`standard`, plot_type=`war_story`, tone=`grimdark`, theme=`betrayal`, content_warning=`cw_violence` + `cw_death`, language=`en`. Author: `dan_abnett` (role=`author`).

**Eisenhorn: Xenos (`eis01`)**: format=`book`, protagonist_class=`inquisitor`, pov_side=`imperium`, scope=`sector`, entry_point=`series_start`, length_tier=`standard`, plot_type=`mystery`, tone=`grimdark`, theme=`faith`, content_warning=`cw_violence`, language=`en`. Author: `dan_abnett` (role=`author`).

**Dark Imperium (`di01`)**: format=`book`, protagonist_class=`space_marine`, pov_side=`imperium`, scope=`galactic`, entry_point=`series_start`, length_tier=`standard`, plot_type=`war_story`, tone=`grimdark`, theme=`war`, content_warning=`cw_violence` + `cw_death`, language=`en`. Author: `guy_haley` (role=`author`).

Daten kommen direkt aus dem aktuellen `scripts/seed-data/books.json` (Faktionen) plus offensichtlich-defensiver Annotation. Keine erfundenen Plot-Spoiler.

### C. Discriminator-Integrität — App-Pflicht plus optionaler Trigger

Pflicht ist die App-Variante. Trigger ist optionale Zusatz-Härtung. Composite-FK mit generated column ist explizit nicht-Ziel — die Drizzle-Friktion wiegt schwerer als der Härtungs-Gewinn bei Solo-Dev / app-kontrolliertem Schreibpfad.

**Pflicht — App-seitig.** Im `scripts/seed.ts` eine kleine Helper-Funktion, die garantiert die richtige Detail-Tabelle bedient:

```ts
async function insertBook(opts: { slug: string; title: string; ...bookFields }) {
  return db.transaction(async (tx) => {
    const [w] = await tx.insert(works).values({ kind: 'book', slug, title, ... }).returning();
    await tx.insert(bookDetails).values({ workId: w.id, isbn13, seriesId, ... });
    return w;
  });
}
```

Plus die Sanity-Query aus den Acceptance-Bullets nach jedem Seed-Lauf.

**Optional — CHECK-Trigger (billig, klar lesbar).** Wenn du DB-Härtung willst, ist das die Form, die ohne Bastelei läuft.

```sql
CREATE FUNCTION assert_book_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'book' THEN
    RAISE EXCEPTION 'book_details may only attach to works.kind = book';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER book_details_kind_check BEFORE INSERT OR UPDATE ON book_details
  FOR EACH ROW EXECUTE FUNCTION assert_book_details_kind();
```

Pro Detail-Tabelle ein Trigger. Drizzle-Migrationen können das per ``sql`...` ``-Block aufnehmen. Im Report begründen, ob du das gemacht hast oder bei App-only geblieben bist.

### D. Reihenfolge (Vorschlag, nicht bindend)

1. Schema-Datei refaktorieren — alte Tabellen raus, neue rein, alle Enums, Relations.
2. Migration(en) generieren via `npm run db:generate` (Forward, in eine Datei oder thematisch gesplittet).
3. Seed-Skript rewriten.
4. Lokal `db:generate` + `db:migrate` + `db:seed` durchziehen, mit psql / Drizzle Studio verifizieren.
5. Hub-Footer-Count + Timeline-Route umstellen.
6. `TimelineBook` + Overview/EraDetail nachziehen.
7. Lint + Typecheck + Build lokal grün.
8. PR auf, Preview-Deploy abwarten, Vercel-Migrate-Step im Log verifizieren.
9. Report schreiben, sessions/README.md aktualisieren, Brief auf `implemented` flippen.
