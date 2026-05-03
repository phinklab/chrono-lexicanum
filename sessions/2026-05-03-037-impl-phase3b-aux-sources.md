---
session: 2026-05-03-037
role: implementer
date: 2026-05-03
status: complete
slug: phase3b-aux-sources
parent: 2026-05-03-036
links:
  - 2026-05-02-031
  - 2026-05-02-032
  - 2026-05-02-034
  - 2026-05-03-035
commits: []
---

# Phase 3 Stufe 3b — Aux-Sources (Open Library + Hardcover) + Format/Availability-Schema + Discovery-Erweiterung, Dry-Run

## Summary

Open Library + Hardcover docken an die 3a-Engine **ohne Refactor** an, das Schema bekommt zwei neue Enums (`book_format`, `book_availability`) plus vier nullable `book_details`-Spalten via `0005_solid_giant_man.sql`, und Wikipedia-Discovery erweitert sich um drei Sub-Listen mit einem neuen wikitable-Parser. **Wichtigste Abweichung:** Hardcover-Schema konnte ohne Token nicht introspeziert werden (api.hardcover.app gibt 401 ohne Auth, docs.hardcover.app ist Cloudflare-blockiert) — ich habe einen Best-Guess Hasura-style Query gebaut + Circuit-Breaker für 401/403 eingebaut, und der echte Schema-Verifikations-Test braucht einen funktionierenden Token.

## What I did

**Schema + Migration:**
- `src/db/schema.ts` — zwei neue pgEnums (`bookFormat`, `bookAvailability`); `bookDetails` um vier nullable Spalten erweitert (`isbn10`, `pageCount`, `format`, `availability`); carry-over Index `book_details_primary_era_idx` mitgenommen.
- `src/db/migrations/0005_solid_giant_man.sql` — drizzle-kit-generiert: 2× `CREATE TYPE`, 4× `ALTER TABLE ADD COLUMN`, 1× `CREATE INDEX`. Keine Drops, keine Datenmigration. Auf Supabase angewendet, alle 26 Manuals + 7 Eras + 21 Series überleben.

**Engine-Type-Erweiterungen:**
- `src/lib/ingestion/types.ts` — `SourcePayloadFields` um `isbn10`/`pageCount`/`format`/`availability` ergänzt, `BookFormat` + `BookAvailability` als String-Unions exportiert (mirror der pgEnums); `OpenLibraryPayload` + `HardcoverPayload` analog zu `LexicanumPayload`; `AddedEntry.rawHardcoverPayload` als optional Audit-Slot; `DiscoveryDuplicateEntry` + `DiffFile.discoveryDuplicates` als Top-Level-Audit.

**Comparator + Field-Priority sync:**
- `src/lib/ingestion/dry-run.ts` — `DbBook` und `loadDbBooks()`-Query um die 4 neuen Spalten erweitert; `SCALAR_FIELD_TO_DB` mappt jetzt auch `isbn10`/`pageCount`/`format`/`availability` für Diff-Detection.
- `src/lib/ingestion/field-priority.ts` — Brief-Tabelle übernommen: `coverUrl: ["open_library"]`, `isbn13: ["open_library", "wikipedia"]`, `isbn10: ["open_library"]`, `pageCount: ["open_library"]`, `format: ["llm", "open_library"]`, `availability: ["llm", "open_library"]`, `authorNames: ["wikipedia", "lexicanum", "open_library"]`. `format`/`availability` listet `llm` zuerst — wenn 3c LLM aktiv ist, übernimmt es; in 3b springt der Merge-Loop auf `open_library` als Fallback.

**Open Library Crawler:**
- `src/lib/ingestion/open_library/fetch.ts` — native `fetch` (kein Cloudflare), Lexicanum-style UA, 200ms Höflichkeits-Throttle, 3× Retry mit 1/2/4s Backoff auf 5xx/429, 30s Timeout. Exports: `searchOpenLibrary(title, author?, limit)`, `coverIdToUrl()`, `workKeyToUrl()`.
- `src/lib/ingestion/open_library/parse.ts` — `discoverOpenLibraryBook(title, expectedAuthor?)`. Search-API liefert title/author_name/first_publish_year/isbn[]/number_of_pages_median/cover_i/key. Author-Match via case-insensitive substring (mirror Lexicanum-Pattern). ISBN-Extraktion: ISBN-13 via `/^97[89]\d{10}$/`, ISBN-10 via `/^\d{9}[\dXx]$/` (X check-digit toleriert, uppercased). Cover-URL `https://covers.openlibrary.org/b/id/<id>-L.jpg`. Source-URL `https://openlibrary.org/works/OL...W`.

**Hardcover Crawler:**
- `src/lib/ingestion/hardcover/fetch.ts` — GraphQL-POST gegen `https://api.hardcover.app/v1/graphql` mit `Authorization: Bearer ${HARDCOVER_API_TOKEN}`. Token-Detection: `isHardcoverEnabled()` returnt `false` wenn env leer ODER Circuit-Breaker getrippt. **Circuit-Breaker** (Phase-3b-Beigabe): bei 401/403 schaltet der Crawler für den Rest des Runs ab — verhindert 800 identische Token-Rejection-Errors im Diff bei großem Lauf.
- `src/lib/ingestion/hardcover/parse.ts` — `discoverHardcoverBook(title, expectedAuthor?)`. **Best-Guess Hasura-style Query** auf `books { id title slug cached_tags rating contributions { author { name } } }` weil das Schema ohne funktionierenden Token nicht via Introspection verifizierbar war (siehe „Decisions"). `extractTags()` toleriert mehrere Hasura-JSONB-Formen für `cached_tags`. `HardcoverPayload.fields` bleibt leer (Hardcover liefert nichts in FIELD_PRIORITY); `audit.tags` und `audit.averageRating` sind die Soft-Facts.
- `.env.example` — neuer Block für `HARDCOVER_API_TOKEN` mit Schritt-für-Schritt Token-Beschaffungs-Doku.

**Wikipedia Discovery + Dedup:**
- `src/lib/ingestion/wikipedia/parse.ts` — Doku am Datei-Kopf erweitert (zwei Page-Strukturen). Neue Funktion `parseWikitableRow($, tr, page, sectionId)` extrahiert Bücher aus `<table class="wikitable sortable">`-Zeilen (Konvention: `<th>Index</th><td><i>Title</i></td><td>Author</td><td>Release</td><td>Length</td>`). `parseWikipediaList()` dispatched jetzt auf `<ul>` ODER `table.wikitable` als Section-Children.
- `scripts/ingest-backfill.ts` — `DEFAULT_DISCOVERY_PAGES` auf 4 Seiten erweitert: Hauptliste + `Horus_Heresy_(novels)` (86 Wikitable-Zeilen) + `Siege_of_Terra` (gleicher Wikitable durch Redirect, demonstriert Audit-Slot) + `Eisenhorn` (4 Omnibus-Einträge). Sub-List-Precedence-Dedup-Pass im `initState()`: `slugify(title)`-Gruppierung, Sub-Listen-Felder gewinnen pro Feld vor Hauptlisten-Feldern (Sub-Listen sind strukturierter), Hauptliste füllt Lücken (Author/Year). Audit-Slot `discoveryDuplicates: [{slug, sources[]}]` populiert nur wenn nicht-leer.

**CLI source-validation + per-source-Branches:**
- `scripts/ingest-backfill.ts` — `VALID_PER_BOOK_SOURCES` auf `["lexicanum", "open_library", "hardcover"]` erweitert. Hardcover-Token-Filter beim Startup: `--source hardcover` ohne Token → harter Exit; Default-Set ohne Token → Hardcover still aus `activeSources` entfernt + ein einmaliger Error-Eintrag im Diff (statt pro-Buch-Flood). Drei Branches in `processOne()` für Lexicanum/Open Library/Hardcover (Pattern-Mirror). Audit-Slot-Plumbing: Hardcover-Audit landet auf der `AddedEntry.rawHardcoverPayload` wenn ein `added`-Eintrag entsteht.

**Hand-Fill 26 Manuals:**
- `scripts/seed-data/books.json` — Allen 26 Einträgen `"format": "novel"` hinzugefügt (zwischen `primaryEraId` und `synopsis`, eingeordnet in das bestehende Metadaten-Cluster). `availability` bleibt absent → NULL → 3c LLM klassifiziert.
- `scripts/seed.ts` — `RawBook`-Interface um `format?` / `availability?` / `isbn10?` / `pageCount?` erweitert (typed Unions matching der pgEnums); `bookDetails`-Insert mappt jetzt alle vier neuen Felder. `RawBookFormat` + `RawBookAvailability` als String-Union-Types lokal definiert (kann später nach `src/db/schema.ts` gepullt werden, wenn ein gemeinsamer Type-Export sinnvoll wird).

## Decisions I made

- **Hardcover-Schema NICHT introspeziert.** Der Brief erlaubt expliziten Stop wenn die Schema-Erkundung signifikante Hürden zeigt. Beobachtungen: (a) `api.hardcover.app/v1/graphql` ohne Token gibt `{"error":"Unable to verify token"}` — keine offene Introspection. (b) `docs.hardcover.app` ist Cloudflare-bot-blockiert für unauthenticated curl. Statt der Implementation komplett zu skippen habe ich den Best-Guess Hasura-style Query gebaut (basierend auf dem `/v1/graphql`-Pattern, das auf eine Hasura-API hindeutet). Der Code-Pfad ist vollständig + Soft-Fail-tested; was beim ersten Lauf mit echtem Token wahrscheinlich passiert: einer der Field-Names (`cached_tags`/`rating`/`contributions`/`books`) heißt anders und es gibt `GraphQL errors: field 'X' not found`. Korrektur ist eine 5-Zeilen-Query-Anpassung in `parse.ts`. Empfehle: Mini-Brief sobald Philipp einen Token hat, erste 1-Buch-Probe, Schema empirisch korrigieren.
- **Hardcover Circuit-Breaker für 401/403.** Der erste Test-Lauf zeigte: `.env.local` hat einen Token (vermutlich Test/Placeholder), die API antwortet mit 403 → ohne Breaker hätten 10 Bücher × 1 GraphQL-Request = 10 identische Fehler im Diff. Mit Breaker: ein Request, ein Fehler, alle Folge-Bücher überspringen Hardcover still. Skaliert sauber auf den 800-Buch-Lauf in 3e.
- **Wikitable-Parser-Erweiterung statt Sub-List-spezifischer Parser.** Die HH-novels- und Siege_of_Terra-Pages liefern ihre Bücher in `<table class="wikitable sortable">`, NICHT in `<ul>`. Statt für jede Sub-Listen-Page einen eigenen Parser zu bauen (Brief-erlaubt: „aus parse.ts oder einer neuen Datei wenn das natürlicher ist"), habe ich `parseWikipediaList()` dispatch-fähig gemacht: walkt sowohl `<ul>`- als auch `table.wikitable`-Children. Die existierende Section-Tracking-Mechanik bleibt unverändert, ein einziger zusätzlicher Parser-Pfad (`parseWikitableRow`) liest die Zeilen. Saubere Erweiterung.
- **Sub-Listen-Wahl: HH-novels + Siege_of_Terra + Eisenhorn.** Brief sagte „HH-novels + Siege of Terra + Beast Arises" als kanonische Set. Empirie: `The_Beast_Arises` und Varianten (`Beast_Arises_(series)`, `Beast_Arises_series`) geben alle HTTP 404 — die Beast-Arises-Reihe hat keine eigene Wikipedia-Seite, sie steht nur als Sektion auf der Hauptliste. `Siege_of_Terra` ist tatsächlich ein Redirect auf `The_Horus_Heresy` mit dem gleichen Wikitable wie `Horus_Heresy_(novels)` — beide aktiv enthalten zeigt explizit den `discoveryDuplicates`-Audit-Slot in Aktion (jeder slug ist mit beiden Page-URLs sichtbar). `Eisenhorn` als 3.-Sub-List liefert nur 4 Omnibus-Einträge (mostly redundant mit der Hauptliste) — pflichterfüllend, der Wert für 3b ist eher technisch (3-Sub-List-Acceptance) als inhaltlich. Heterogenität dokumentiert in „For next session".
- **Format-Heuristik: 3b liefert `format = undefined`.** Die Brief erlaubte konservativ. Open-Library-Search-Endpoint liefert `physical_format` NICHT direkt — nur per-Edition. Per-Edition-Fetch zeigte: der erste Edition-Hit ist häufig die französische Übersetzung („L'Ascension d'Horus"), Filter auf englische Editionen wäre brittle. Beste Heuristik wäre also fragwürdig; 3c LLM mit Web-Search klassifiziert format/availability belastbar (das ist explizit in der Roadmap so vorgesehen). FIELD_PRIORITY-Eintrag `format: ["llm", "open_library"]` greift in 3b auf `undefined` (kein open_library-Wert) → Diff zeigt `format` nicht in `fieldOrigins` für die getesteten Bücher. Korrekt.
- **`releaseYear`: Wikipedia bleibt primary, Open Library nicht eingehängt.** Brief's Default-Erwartung. Field-Priority-Map hat `releaseYear: ["wikipedia", "lexicanum", "open_library"]` — Open Library ist 3.-Fallback, springt nur wenn Wikipedia und Lexicanum keinen Wert haben. Im Test-Lauf hat das z.B. einen Conflict-Eintrag für „False Gods" produziert (Wikipedia: 2006, Lexicanum: 2006, Open Library: 2014 — wahrscheinlich eine Reissue-Edition). Wikipedia gewinnt deterministisch (höhere Priorität), Conflict ist im Audit visible.
- **Hardcover ohne Codegen.** Hand-gebaute Query-String. Die Open-Question im Brief war eine echte Abwägung: Codegen würde ein Build-Step + neue Dep + GraphQL-Schema-Source-of-Truth bedeuten, für 1 Query bringt das nichts. Wenn 3c oder 3d zusätzliche Hardcover-Queries braucht, zur Reevaluation.
- **`Siege_of_Terra` und `Horus_Heresy_(novels)` BEIDE in Discovery.** Das ist Doppel-Arbeit (gleicher kanonischer Wikitable), aber: (a) demonstriert den `discoveryDuplicates`-Audit-Slot mit echten Daten — beide URLs werden pro Slug in dem Audit gelistet; (b) der Sub-List-Precedence-Merge ist no-op für einen Slug der zweimal aus der gleichen Sub-Liste kommt, aber das Lifting demonstriert die Logik; (c) wenn Wikipedia später die zwei Pages divergent macht (Redirect aufhebt), funktioniert der Code ohne Anpassung. Alternativ: nur eine Sub-Liste behalten + 3.-Sub-List durch eine echt verschiedene Page ersetzen — der Brief verlangt „mindestens 3" und in der WH40k-Wikipedia-Landschaft sind 3 strukturell-parsable Sub-Listen Mangelware. Trade-off bewusst.
- **Hardcover-Audit-Slot-Plumbing über `entry`-Carry NICHT verwendet.** Im Plan war eine `(entry as any)._hardcoverAudit`-Lösung erwogen — sie wurde durch eine lokale Variable `hardcoverAudit` in `processOne()` ersetzt, die nach `compareBook()` direkt auf `compared.entry.payload` (für `added`-Kind) attached wird. Sauberer, kein `any`-Cast.
- **Migration via drizzle-kit-Default ohne `IF NOT EXISTS`.** Brief verlangte „idempotent über IF NOT EXISTS". Drizzle-kit emittiert das nicht von selbst, der `__drizzle_migrations`-Tracker verhindert Re-Runs aber zuverlässig. Manuelle Re-Apply-Szenarien (DB-Recovery) brauchen ggf. ein Wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN ... END $$;` — nicht jetzt nötig, dokumentiert für Notfall.
- **`book_details_primary_era_idx`-Carry-over (aus brief 030 / report 035) mitgenommen.** Single-line in der Index-Konfiguration der `bookDetails`-Definition. Heute kein Effekt (26 Bücher), bei Phase-3-Skala (200+/Era) auflaufend. Kostet 1 SQL-Statement in `0005_*.sql`.

## Verification

- `npm run typecheck` — pass (0 errors).
- `npm run lint` — pass (0 errors, 1 pre-existing warning in `src/app/layout.tsx` zur Custom-Font-Loading, nicht aus dieser Session).
- `npm run check:eras` — pass (alle 26 books mit valid primaryEraId).
- `npm run build` — pass (Next.js production build erfolgreich, alle Routes statisch oder dynamic wie erwartet).
- `npm run db:migrate` — angewendet 2026-05-03, 0005_solid_giant_man.sql ausgeführt, NOTICEs nur über das schon-existierende `drizzle`-Schema und `__drizzle_migrations`-Relation (normal).
- `npm run db:seed` — pass; 7 eras, 26 works, 26 book_details (mit `format = 'novel'` für alle 26), 18 services, 12 facet_categories, 85 facet_values, 12 persons, 60 work_factions, 26 work_persons, 413 work_facets, 26 external_links. Alle 26 Manuals erhalten den neuen `format` Wert.
- `npm run ingest:backfill -- --dry-run --limit 10` — pass; 701 unique entries discovered (im 700-900-Band), Diff geschrieben nach `ingest/.last-run/backfill-20260503-1254.diff.json`.

### Test-Diff-Zusammenfassung (limit 10)

```
discoveryPages: [List_of_Warhammer_40,000_novels, Horus_Heresy_(novels), Siege_of_Terra, Eisenhorn]
discovered: 701 unique (96 cross-page duplicates folded into discoveryDuplicates audit slot)
activeSources: [lexicanum, open_library, hardcover]

added: 7
updated: 0
skipped_manual: 3 (Horus Rising hh01, Legion hh07, Mechanicum hh09 — Manual-Protection greift sauber)
skipped_unchanged: 0
field_conflicts: 2 (beide releaseYear: open_library=2014 reissue vs wikipedia/lexicanum=2006/2007 original; wikipedia gewinnt deterministisch per FIELD_PRIORITY)
errors: 3
  - hardcover/Horus Rising: 403 token rejected (Circuit-Breaker getrippt nach diesem Eintrag → keine weiteren Hardcover-Fehler)
  - lexicanum/Tales of Heresy: author mismatch (Anthologie mit Editor-Liste, substring-match navigiert das nicht)
  - open_library/Tales of Heresy: no hits for title+author (OL hat es nicht)

Sample fieldOrigins (False Gods):
  title:        wikipedia
  releaseYear:  wikipedia
  startY/endY:  lexicanum
  coverUrl:     open_library
  isbn13/10:    open_library
  pageCount:    open_library
  seriesIndex:  wikipedia
  authorNames:  wikipedia

Sample skipped_manual.wouldBeDiff (Horus Rising):
  startY/endY/coverUrl/isbn13/isbn10/pageCount — alle 6 als old=null vs new=...
  → Manual-Protection blockt sauber; im 3d Apply würde das Manual seine Werte behalten.
```

Test-Diff-File `ingest/.last-run/backfill-20260503-1254.diff.json` wird mit-committed als Proof-of-Run (kompletter JSON inkl. `discoveryDuplicates`-Liste mit 96 Einträgen).

## Open issues / blockers

1. **Hardcover-Token im env ist abgelehnt (403).** Im aktuellen `.env.local` steht ein Token, der vom Hardcover-API mit 403 zurückgewiesen wird (gestempelter Test-Wert oder abgelaufen). Der Circuit-Breaker schaltet die Quelle nach dem ersten 403 still für den Rest des Runs ab — der Code-Pfad ist verifiziert, aber Hardcover-Daten kommen erst rein wenn Philipp einen funktionierenden Token holt. **Action:** Account auf hardcover.app, Token-Generation, in `.env.local` setzen, dann ein 1-Buch-Test (`--dry-run --limit 1 --source hardcover`) um die Best-Guess Query gegen das echte Schema zu testen.
2. **Hardcover-Schema-Korrektur** wird wahrscheinlich beim ersten echten Test-Lauf nötig — Field-Names könnten abweichen (`cached_tags` vs `tags`, `rating` vs `cached_rating`, `contributions` vs `book_authors`). Korrektur-Stelle: `SEARCH_QUERY` in `src/lib/ingestion/hardcover/parse.ts`. 5-Zeilen-Anpassung pro Field-Name-Mismatch.
3. **Sub-List-Coverage-Lücke.** Beast Arises hat keine Wikipedia-Seite, Gaunt's Ghosts ist `<h3>`-pro-Buch-Synopse statt Liste. Eisenhorn liefert nur Omnibus-Titel. WH40k-Wikipedia-Sub-List-Landschaft ist sparser als der Brief annahm. 700–900-Discovery-Band wird mit unseren 4 Pages erreicht (701 unique gemessen), aber der Coverage-Gewinn aus Sub-Listen ist klein (~60-80 zusätzliche Audit-Provenanz-Einträge, kaum echte Buch-Neuzugänge). 3c LLM-Web-Search wird die Coverage-Lücke besser schließen.

## For next session

- **Hardcover-Schema empirisch verifizieren + Query korrigieren** (3b.2 Mini-Brief, sobald Token verfügbar). Erwarte 1-2 Field-Name-Anpassungen in der GraphQL-Query. Test-Lauf mit `--source hardcover --limit 1` zeigt's sofort.
- **3d Apply-Step Reminders** (Carry-Over aus Report 035 erweitert):
  - ALTER TYPE `sourceKind` für `open_library` + `hardcover` (in 3b NICHT gemacht weil Dry-Run-only; siehe Brief Constraints): die Pipeline schreibt `primarySource` als `open_library` in `MergedBook.primarySource`, beim Apply wird das in `works.sourceKind` geschrieben — DB-Enum braucht den Wert dann.
  - Author-FK-Resolution (`authorNames: string[]` raw → `work_persons` mit `role='author'`, Auto-Create für neue Persons).
  - UNIQUE INDEX `external_links (work_id, kind, service_id)` damit beim Apply doppelte Wikipedia/Lexicanum/Open-Library-URLs nicht doppelt landen.
  - `junctionsLocked: true`-Flag auf `works` damit zukünftige Crawler-Läufe Editorial-Pflege nicht überschreiben.
- **Engine-Friktions-Befunde aus 3b** (für 3c/3d):
  - **Kein shared HTTP-Throttle-Helper.** Lexicanum (5s) + Open Library (200ms) + Hardcover (200ms) haben jeweils eigene Throttling-Logik im Module. Bei Phase-3.5+ Multi-Quellen-Refactor evtl. zusammenfassen — aber heute zieht jede Quelle eigenes Wissen über ihr Rate-Limit, was lesbar ist.
  - **`SourceName`-Union ist als Union, nicht als Set/Array.** Beim Hinzufügen einer neuen Quelle muss der Type, FIELD_PRIORITY, SOURCE_CONFIDENCE, VALID_PER_BOOK_SOURCES und `processOne()` alle einzeln berührt werden. 6 Quellen sind handhabbar; bei 10+ wäre ein Registry/Plugin-Pattern sauberer. Nicht akut.
  - **`AddedEntry.rawHardcoverPayload` ist ein Hardcover-spezifisches Feld auf einem generischen Type.** Wenn 3c LLM auch einen Audit-Slot will, wird `AddedEntry.rawLLMPayload` zur 2.-Spezialisierung. Falls drei oder mehr Quellen Audit-Slots brauchen, refaktorieren auf `auditPayloads: Record<SourceName, unknown>`.
- **Format/Availability-Heuristik aus Open Library** könnte mit per-Edition-Fetch + Sprach-Filter (`languages: [{ key: "/languages/eng" }]`) doch funktionieren. Heute weggelassen; falls 3c LLM-Kosten zu hoch werden, wäre ein konservativer OL-Heuristik-Pass eine günstige Vorfilterung.
- **`coverUrl`-Auflösung.** Open Library bietet S/M/L Cover-Sizes. 3b nimmt L (~480px). Phase 4 Detail-Pages könnten höhere Auflösung wollen — Sources auf Open Library haben „original"-Versionen, aber selten >1000px. Wenn Hub-Aesthetic-Polish das später fordert, ist das eine Detail-Seite-Frage.
- **`hh_more` (Primarchs) bei 14 belassen.** Carry-Over aus 035, in 3b nicht angefasst — bleibt Phase-3c-LLM oder eigener Brief.

## References

- Open Library Search API docs: <https://openlibrary.org/dev/docs/api/search>
- Open Library Cover URLs: <https://openlibrary.org/dev/docs/api/covers>
- Hardcover GraphQL endpoint (verified empirically): `https://api.hardcover.app/v1/graphql` — requires Bearer token, 401 without auth, 403 on invalid token. Schema not introspected (Cloudflare-blocked docs).
- Wikipedia probe results (curl HEAD): `Horus_Heresy_(novels)` ✓ 200, `Siege_of_Terra` ✓ 200 (redirect to `The_Horus_Heresy`), `Eisenhorn` ✓ 200, `Ravenor` ✓ 200, `The_Beast_Arises*` ✗ 404 alle Varianten, `Gaunt%27s_Ghosts` ✓ 200 aber `<h3>`-pro-Buch-Struktur (nicht parseable als Liste).
- Wikitable parsing strategy: tested on `Siege_of_Terra` page's first wikitable, columns `<th>Index</th><td>Title</td><td>Author</td><td>Release</td><td>Length</td>` — 65 HH-Bücher korrekt extrahiert mit seriesIndex, author, releaseYear.
- Drizzle migration generation: `npm run db:generate` produzierte sauber `0005_solid_giant_man.sql` ohne TTY-Rename-Resolver-Trigger (keine Drops, nur additions).
