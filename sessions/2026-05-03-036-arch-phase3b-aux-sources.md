---
session: 2026-05-03-036
role: architect
date: 2026-05-03
status: implemented
slug: phase3b-aux-sources
parent: 2026-05-03-035
links:
  - 2026-05-02-031
  - 2026-05-02-032
  - 2026-05-02-034
  - 2026-05-03-035
commits: []
---

# Phase 3 Stufe 3b — Aux-Sources (Open Library + Hardcover) + Format/Availability-Schema + Discovery-Erweiterung, Dry-Run

## Goal

Den zweiten Brick der Phase-3-Pipeline bauen: zwei zusätzliche Quellen (Open Library für Hard-Facts, Hardcover.app für Soft-Facts) andocken in die existierende Multi-Source-Engine, die Schema-Erweiterung für `format` + `availability` auf `book_details` mitnehmen, und die Wikipedia-Discovery um die wichtigsten Sub-Listen erweitern. Wie 3a: **Dry-Run-only, keine DB-Schreib-Operationen.** Apply-Step bleibt 3d.

3b ist Stufe 2/6 der Phase-3-Roadmap (3a Skeleton ✅ → **3b Aux-Sources** → 3c LLM-Anreicherung → 3d Apply-Step → 3e Backfill-Day → 3f Maintenance-Crawler in GH Actions). Die Engine-Architektur aus 3a (`SourceCrawler<TPayload>` Interface, `FIELD_PRIORITY` Konstante, field-by-field Merge) muss in 3b ohne Refactor zwei weitere Quellen aufnehmen — wenn sie nicht so sauber andocken wie geplant, ist das ein Architektur-Befund, kein 3b-Implementations-Problem.

## Context

- **Was 035 geliefert hat.** Engine läuft Ende-zu-Ende: Wikipedia-Discovery (683 unique Bücher aus der Hauptliste), Lexicanum-Crawl per `/wiki/`-Article-Probing (api.php Cloudflare-blockiert, deshalb URL-Probing-Fallback), Multi-Source-Merge per `FIELD_PRIORITY`, Comparator schützt 26 Manuals via title-normalize-Match, Test-Diff committed. Wichtigste Architektur-Abweichung von 3a: Lexicanum-HTTP läuft via `child_process.execFile('curl', …)` weil Node-native `fetch` (undici) am Cloudflare-TLS-Fingerprint scheitert. Diese Lösung ist akzeptiert; Implikation für 3f (GH Actions) ist `curl` muss im Runner verfügbar sein — `ubuntu-latest` hat es.
- **Was im 035-Test-Diff sichtbar ist.** 4 added (HH #2–5 — Author + seriesIndex + releaseYear korrekt aus Wikipedia, Lexicanum-URL greift sauber), 1 skipped_manual (HH #1 Horus Rising — title-normalize-Match findet `horus-rising-hh01` korrekt, wouldBeDiff zeigt Manual gewinnt). 0 errors. Auffällig: in-universe-year-Extraction aus Lexicanum-Body ist brittle (False Gods landet auf M40 statt M31). CC selbst geflaggt; 3c LLM ist die belastbare Authority dafür. Manual-Protection würde im Apply schützen.
- **Was Open Library liefert.** Auth-freie public REST-API (`https://openlibrary.org/search.json?title=…&author=…`), darunter `cover_i` (→ `https://covers.openlibrary.org/b/id/<id>-{S,M,L}.jpg`), `isbn`, `number_of_pages_median`, `first_publish_year`, `edition_count`, plus per-Edition-Fetch `physical_format` (mass market paperback / hardcover / ebook / audio CD). 100/min read-rate-limit, kein Token. Author-Search via `/search/authors.json` für Disambiguation (mehrere Wikipedia-Hits auf denselben Title brauchen Author-Match — analog zu Lexicanum-Logik in 3a).
- **Was Hardcover.app liefert.** GraphQL-API (`https://api.hardcover.app/v1/graphql`). **Braucht User-Token** (Bearer in Authorization-Header) — Token kostenlos beim Account-Anlegen auf hardcover.app generierbar. Soft-Daten: User-Tags, Average-Rating, Reading-Status-Counts, Synopsen (oft scraped from publisher sites, nutzungsrechtlich heikel — wir extrahieren keine Synopsen aus Hardcover, das übernimmt 3c LLM-paraphrasiert). **Token-Beschaffung ist Philipps Aufgabe**, nicht CCs — siehe Constraints unten.
- **Schema heute.** `works.coverUrl` und `works.synopsis` sind universelle Felder über alle work_kinds (sessions/2026-05-01-019). `book_details` hat heute `workId`, `isbn13`, `seriesId`, `seriesIndex`, `primaryEraId`. Es fehlen: `isbn10` (Open Library liefert beides für Pre-2007-Bücher), `pageCount`, `format`, `availability`. Die ersten zwei sind reine `varchar(10)` / `integer`, die letzten zwei sind neue Enums.
- **`work_persons`-Junction für Author-FK-Resolution.** `book_details.author` als Spalte gibt es nicht — Author wird via `work_persons` mit `role = 'author'` aus dem `personRole`-Enum modelliert. CC hat das in 3a als raw `authorNames: string[]` im Payload geparkt; FK-Resolution (Auto-Create neuer Persons) ist Apply-Step 3d. In 3b bleibt Author raw — **nichts FK-resolven, nichts auto-createn in 3b.**
- **Discovery-Vollständigkeit ist heute ungeprüft.** 683 unique aus der Hauptliste klingt plausibel, aber Sub-Listen (Horus Heresy novels, Beast Arises, Siege of Terra) enthalten Audio-Dramas/Novellas die in der Hauptliste evtl. fehlen. CCs „For next session" Item #1.
- **Format und Availability sind orthogonal.** Aus Brief 034 § „Format und Availability als orthogonale Felder": Format = was-für-ein-Werk (`novel/novella/short_story/anthology/audio_drama/omnibus`), Availability = kann-ich-es-noch-bekommen (`in_print/oop_recent/oop_legacy/unavailable`). Beide unabhängig. Eine 1996er-Mass-Market-Novel ist `novel`/`oop_legacy`; eine moderne BL-Audio-Reihe ist `audio_drama`/`in_print`. Die Felder kommen schon in 3b ins Schema, werden aber von 3b's Crawler-Output nur partiell befüllt (Open Library liefert Edition-Format als Heuristik-Hint, Availability als Heuristik aus Edition-History) — die belastbare Klassifikation macht 3c LLM mit Web-Search.

## Constraints

- **Keine DB-Schreib-Operationen aus dem Crawler.** Dry-Run only. Comparator darf DB lesen (für Diff), schreibt nichts. Gilt auch für die neuen Felder `format`/`availability` — die Migration läuft, der Crawler füllt die Diff-JSON, kein Insert/Update.
- **Engine darf nicht refactored werden.** `SourceCrawler<TPayload>`-Interface, `FIELD_PRIORITY`-Konstante, `mergeBookFromSources()`-Funktion bleiben as-is. Open Library und Hardcover sind zwei neue `SourceCrawler`-Implementierungen, sonst nichts an der Engine. Wenn die Architektur nicht ohne Refactor andockt, ist das ein Architektur-Bug von 3a — im Report explizit dokumentieren, dann entscheiden wir gemeinsam wie wir's gerade biegen, statt heimlich umzubauen.
- **`SOURCE_CONFIDENCE`-Werte aus 3a stehen.** `open_library: 0.80`, `hardcover: 0.65` — sind in `source-confidence.ts` schon vorgesehen.
- **Hardcover-Token-Beschaffung ist Philipps Job, nicht CCs.** Wenn die Hardcover-Implementierung blockiert weil das Token fehlt: CC schreibt einen Sondierungs-Report („Hardcover-API getestet, braucht Token X, Pricing/Auth-Form Y"), dann holt Philipp das Token, dann eigene Mini-Session zum Drannageln. **Niemals einen Test-Token in den Repo committen oder im Code hardcoden.** Token kommt in `.env.local` als `HARDCOVER_API_TOKEN` und wird per `process.env` gelesen.
- **Discovery-Sub-Listen müssen dedup-sauber zur Hauptliste sein.** Wenn dasselbe Buch in Hauptliste UND Sub-Liste auftaucht, **gewinnt die strukturiertere Quelle pro Feld** (Sub-Listen haben oft präzisere seriesIndex-Werte, Hauptliste hat oft besseren Author). Identifikation per `slugify(title)`-Match nach Discovery, vor Crawl-Loop. Im Diff sichtbar in einem neuen `discoveryDuplicates: [{ slug, sources: [...] }]`-Block (nicht als Fehler, nur als Audit-Info).
- **Migration-Disziplin.** Eine Drizzle-Migration für die vier neuen Felder + zwei neuen Enums (`book_format`, `book_availability`). `npm run db:generate` produziert die SQL, `git add src/db/migrations/0005_*.sql` committen mit Schema-Change zusammen. Migration muss auf bestehender DB **idempotent über `IF NOT EXISTS`** laufen — die 26 Manuals dürfen nicht kaputtgehen, alle existierenden `book_details`-Rows müssen den Migrations-Schritt überstehen (neue Spalten sind NULLABLE).
- **Keine `rating`-Spalte in 3b.** Hardcover liefert Rating + Tags. Tags wandern zu gegebenem Zeitpunkt durch das existierende facet-System (eigene Frage in 3c oder 3d, nicht jetzt). Numerisches Rating bleibt aus dem Schema raus — wenn Phase 4 es auf der Detail-Seite anzeigen will, eigene Migration. Hardcover-Daten werden in 3b in `external_links` (für die Hardcover-Page-URL) sichtbar gemacht plus optional in einem `rawHardcoverPayload`-Slot in der Diff-JSON für CC's Audit.
- **HTTP-Manieren.** Open Library: native fetch reicht (kein Cloudflare). UA `ChronoLexicanum/<version> (<repo-URL>; <maintainer-email>)` analog zu Lexicanum. Crawl-Delay nicht nötig (100/min Limit, wir bleiben drunter). Hardcover: GraphQL-Client der CC's Wahl (native fetch + handgebauter Request reicht; **keine `@apollo/client` o.ä. heavyweight Deps** für ein paar Queries). Bearer-Token aus env. Retries auf 5xx/429 mit exponential backoff, max 3, Timeout ≤ 30s.
- **Keine neuen `sourceKind`-Enum-Werte gebraucht.** `open_library` und `hardcover` sind im 3a-`sourceKind`-Enum NICHT drin (das DB-Enum hat `manual/lexicanum/goodreads/black_library/fandom_wiki/community/tmdb/imdb/youtube/wikidata`). Im Pipeline-`SourceName`-Type sind sie drin (3a hat sie schon vorgesehen). 3d (Apply-Step) wird die DB-Enum-Erweiterung machen, weil dort tatsächlich `works.sourceKind` geschrieben wird. **Keine ALTER TYPE-Migration in 3b für `sourceKind`** — nur die zwei neuen Enums für format/availability.
- **Keine Versionsnummern, keine npm-Pakete-Pins.** Wenn CC eine Lib für GraphQL braucht (zB ein winziger query-builder), CC pinnt selbst.

## Out of scope

- **LLM-Anreicherungs-Schicht (Anthropic Sonnet 4.6 + Web-Search).** Phase 3c. Synopsen-Paraphrase, Soft-Facet-Klassifikation auf `tone/theme/entry_point/cw_*`, definitive `format`/`availability`-Klassifikation, Plausibilitäts-Cross-Check.
- **Apply-Step (Diff → DB-Writes).** Phase 3d. Bringt UNIQUE INDEX `external_links (work_id, kind, service_id)`, `junctionsLocked: true`-Flag, FK-Resolution für `authorNames → persons`-Junction, ALTER TYPE für `sourceKind` Enum (open_library + hardcover + llm).
- **Backfill-Day** (40-Buch-Test, 800-Buch-Voll-Lauf). Phase 3e.
- **Maintenance-Crawler in GH Actions.** Phase 3f.
- **Tags-via-Facets-Mapping.** Hardcover liefert Tags wie „grimdark", „military-sci-fi", „lore-heavy". Mapping auf unsere `facet_categories`/`facet_values` (insbesondere `tone`, `theme`) ist 3c-LLM-Job (LLM klassifiziert auf unsere kanonische 40k-aware Werte-Liste, nicht 1:1-Mapping). In 3b landen Hardcover-Tags als raw `tags: string[]` im Payload für Audit, **aber nicht als facet-Junction-Vorschlag im Diff**.
- **`rating`-Schema-Spalte.** Begründung in Constraints. Eigene Phase-4-Entscheidung wenn Detail-Seite es anzeigen will.
- **Black Library als aktive Quelle.** Cloudflare-Verdacht, Phase 3.5+ falls überhaupt.
- **Refactoring der Engine-Architektur.** Wenn etwas in 3a-Architektur nicht trägt, dokumentieren statt umbauen — siehe Constraints.
- **Auth-/Rate-Limit-Handling-Refactor.** Wenn Open Library 100/min plus Hardcover-Rate-Limit ein gemeinsames Throttling brauchen würde, ist das Phase-3.5+. Heute reicht: jeder Crawler kennt seine eigenen Limits.
- **`workflow_dispatch` oder andere GH-Action-Trigger.** GH Actions kommt erst in 3f.
- **Refactoring der bestehenden 26 `books.json`-Manuals.** Sie bleiben unangetastet. Optional darf CC ihnen `format = 'novel'` und `availability = 'in_print'`/`oop_legacy` als Hand-Fill in `books.json` mitgeben (alle 26 sind tatsächlich Romane), wenn das ohne Aufwand mitläuft — wenn dafür mehr als 5 Minuten manuelle Recherche nötig wären, weglassen und in 3c LLM machen lassen.
- **Carry-over: `secondary_era_ids`.** Phase-4-Timeline-Reshape.
- **Carry-over: Redirect 307 vs. meta-refresh.** Bleibt liegen.
- **Carry-over: `book_details.primary_era_idx`.** Wenn 3b's Migration sie problemlos mit-includieren kann (single-line `index("book_details_primary_era_idx").on(t.primaryEraId)` in der schema.ts-Definition), gerne mitnehmen — sonst nicht. CCs Call.
- **Carry-over: `loadTimeline`-Trim.** Berührt 3b nicht; bleibt für 3d-Migration-Sammelung.

## Acceptance

The session is done when:

- [ ] **Schema-Migration für format + availability + isbn10 + pageCount sitzt:**
  - Zwei neue pgEnums in `src/db/schema.ts`: `book_format` mit Werten `novel | novella | short_story | anthology | audio_drama | omnibus`, `book_availability` mit `in_print | oop_recent | oop_legacy | unavailable`. CC darf den Werte-Satz erweitern wenn die Crawler-Realität das nahelegt (z.B. `comic_graphic_novel` falls Open Library Comics liefert) — Begründung im Report.
  - `book_details` bekommt vier neue Spalten: `format` (`book_format`, nullable), `availability` (`book_availability`, nullable), `isbn10` (`varchar(10)`, nullable), `pageCount` (`integer`, nullable).
  - Drizzle-Migration `0005_*.sql` generiert via `npm run db:generate`, committed mit dem Schema-Change in einem PR.
  - `npm run db:migrate` läuft auf der existierenden DB ohne Daten-Verlust (alle 26 Manuals + 8 Eras + Series-Records bleiben unangetastet, neue Spalten sind NULL).
- [ ] **Open-Library-Crawler-Modul** in `src/lib/ingestion/open_library/`:
  - `fetch.ts` — Search via `/search.json?title=…&author=…` mit Author-Match-Disambiguation (analog Lexicanum-Logik aus 3a). Optional Per-Edition-Fetch wenn Format/PageCount aus Edition-Endpoints geholt werden müssen. Native fetch, UA in Lexicanum-Stil, max 3 Retries auf 5xx/429.
  - `parse.ts` — Extrahiert mindestens: `coverUrl` (aus `cover_i`-ID, gewünschte Auflösung CC), `isbn13`, `isbn10`, `pageCount`, `releaseYear` (Open-Library-`first_publish_year` ist meist akkurater als Lexicanum-Body-Scan), Format-Hint aus `physical_format` mit Mapping-Heuristik auf unser Enum (mass market paperback/hardcover → `novel`, audio CD → `audio_drama` etc. — CC darf konservativ sein; bei Unsicherheit `format` undefined lassen für 3c LLM).
- [ ] **Hardcover-Crawler-Modul** in `src/lib/ingestion/hardcover/`:
  - `fetch.ts` — GraphQL-Client für `https://api.hardcover.app/v1/graphql`, Bearer-Token aus `process.env.HARDCOVER_API_TOKEN`. Wenn Token fehlt: einmal initial WARN-loggen, dann alle Hardcover-Crawls als `errors: [{ source: "hardcover", reason: "missing token" }]` markieren — kein Crash, kein 0-Diff. CLI-Lauf ohne Token funktioniert weiter, nur ohne Hardcover-Daten.
  - `parse.ts` — Extrahiert `tags: string[]` (raw Hardcover-Genre-Tags), `averageRating: number` (für Audit-Slot in der Diff-JSON, nicht Schema-Field), Hardcover-Page-URL als `sourceUrl`. Synopsen werden NICHT extrahiert (Lizenz-/Quellenrechte, plus 3c paraphrasiert ohnehin).
  - **Wenn die GraphQL-Schema-Erkundung zeigt dass Hardcover signifikant mehr Hürden hat als erwartet** (Auth-Form, Rate-Limit-Form, undokumentierte Schemata): CC stoppt die Hardcover-Implementierung an dieser Stelle, dokumentiert die Befunde im Report, Open-Library-Teil bleibt abgeschlossen. Wir entscheiden dann gemeinsam ob 3b ohne Hardcover schließt (separate 3b.2 oder skip).
- [ ] **Wikipedia-Discovery erweitert** in `src/lib/ingestion/wikipedia/parse.ts` (oder einer neuen Datei wenn das natürlicher ist):
  - Mindestens **3 zusätzliche Sub-Listen** integriert: die Wikipedia-Pages für „Horus Heresy (novels)", „Siege of Terra", „The Beast Arises" (oder die kanonischen Wikipedia-URLs derselben — CC verifiziert per HTTP, welche Pages tatsächlich existieren und parse-bar sind, listet sie im Report).
  - Optional weitere Sub-Listen wenn CC sie sauber parsen kann (Beispiele: Night Lords, Word Bearers, Path of the Eldar/Aeldari) — CCs Call basierend auf Aufwand vs. Coverage-Gewinn.
  - Dedup-Logic: identische `slugify(title)` aus Hauptliste + Sub-Liste → Sub-Liste-Felder gewinnen (sie sind oft präziser annotiert), Audit-Eintrag in `discoveryDuplicates: [{ slug, sources: [...] }]` der Diff-JSON.
  - **Discovered-Count nach 3b > 683.** Erwartungsband 700–900. Wenn deutlich weniger, ist die Sub-Listen-Wahl falsch; wenn deutlich mehr (>1100), wahrscheinlich Comics/Codex-Books mitgerutscht — dann Filter nachschärfen.
- [ ] **Field-Priority-Map ergänzt** in `src/lib/ingestion/field-priority.ts`:
  - `coverUrl: ["open_library"]`
  - `isbn13: ["open_library", "wikipedia"]`
  - `isbn10: ["open_library"]`
  - `pageCount: ["open_library"]`
  - `format: ["llm", "open_library"]` (LLM in 3c primär, Open-Library als Heuristik-Fallback)
  - `availability: ["llm", "open_library"]`
  - `authorNames: ["wikipedia", "lexicanum", "open_library"]` (Open Library als 3.-Fallback füllt die 25%-Wikipedia-Lücke aus 3a)
  - Hardcover liefert nur Audit-Slots, nicht in `FIELD_PRIORITY`.
  - CC darf priorisieren wenn die real-extrahierten Daten anderes nahelegen — mit Begründung im Report.
- [ ] **CLI** `npm run ingest:backfill -- --dry-run --source <name>[,…] [--limit N]` läuft grün:
  - `--source open_library`, `--source hardcover` neu valid, `--source wikipedia` weiterhin rejected (discovery-only).
  - Default (kein `--source`): alle aktiven Per-Book-Quellen (lexicanum + open_library + hardcover wenn Token vorhanden, sonst Hardcover stillschweigend deaktiviert).
  - State-Mechanik aus 3a unverändert.
- [ ] **Diff-JSON-Schema erweitert:**
  - `activeSources` listet jetzt mehrere Quellen.
  - `discovered` zählt nach Dedup; `discoveryDuplicates` als neuer Top-Level-Slot wenn Sub-Listen aktiviert sind.
  - `field_conflicts` greifen jetzt zwischen 3 Quellen pro Feld, nicht 2 — bestehende Logik aus 3a sollte das ohne Anpassung tragen, aber Test-Lauf verifiziert.
  - Optional `rawHardcoverPayload` pro Buch im Diff-Eintrag (Audit-Slot, nur bei `--source hardcover` aktiv).
- [ ] **`npm run lint`, `npm run typecheck`, `npm run check:eras`, `npm run build`** alle grün.
- [ ] **Test-Lauf nachweisbar:** `npm run ingest:backfill -- --dry-run --limit 10` erzeugt einen neuen Diff unter `ingest/.last-run/backfill-<YYYYMMDD-HHMM>.diff.json`. Der Diff enthält mindestens 1 Eintrag mit Open-Library-Daten (`coverUrl` + ISBN + `releaseYear` aus open_library als `fieldOrigin`). Wenn Hardcover-Token vorhanden: mindestens 1 Eintrag mit Hardcover-Tags-Slot. Diff committen oder Auszug im Report zeigen.

## Open questions

Inputs für die nächste Cowork-Session, kein Blocker:

- **Hardcover-API-Form: heavyweight oder leichtgewichtig?** Wenn die GraphQL-Schema groß ist und ein Code-Generator (zB `graphql-codegen`) signifikanten Wert bringt, dürfen wir den nutzen — aber dann braucht der Repo eine Codegen-Step. CC entscheidet im Report ob es das wert ist oder ob handgebaute Queries reichen.
- **Discovery-Sub-Listen: welche tatsächlich kanonisch?** Wikipedia hat manche „Liste der Reihe X"-Pages, andere sind redirects oder existieren gar nicht. CC verifiziert empirisch, welche stabilen Listen-Pages existieren, und nennt im Report konkret welche er parst. Erwartung: HH-novels, Siege of Terra, Beast Arises sind Pflicht; Path of the Eldar / Night Lords / Word Bearers sind Bonus.
- **Format-Heuristik aus Open-Library-`physical_format`: wie konservativ?** „mass market paperback" → `novel` ist sicher, „audio CD" → `audio_drama` ist sicher, aber „paperback" allein könnte auch eine Anthologie sein. CC's Vorschlag: lieber `format = undefined` und 3c LLM klassifizieren lassen, statt einen Fehler einzufangen, den Manual-Protection nicht abfängt (weil neue Bücher betroffen sind). Im Report die gewählte Heuristik begründen.
- **Format-Enum-Erweiterung: jetzt schon `comic_graphic_novel`?** Falls Open Library bei Discovery Comics ausspuckt (was die Hauptliste vermutlich filtert, aber Sub-Listen u.U. nicht), brauchen wir den Enum-Wert. CC's Call ob er das jetzt mitnimmt oder bei undefined-Format-Strategie weglässt.
- **Open-Library-`releaseYear`: vertrauenswürdiger als Wikipedia?** Wikipedia's „Year"-Spalte ist für unsere getesteten 4 HH-Bücher korrekt (2006/2006/2007/2007). Open Library hat oft `first_publish_year` als first English edition + `publish_date` aus der spezifischen Edition. CC's Empfehlung im Report — meine Default-Erwartung ist Wikipedia bleibt primary für `releaseYear`, Open Library nur als Fallback bei Wikipedia-Lücke.

## Notes

### Datei-Layout-Skizze (illustrativ, nicht bindend)

```
src/lib/ingestion/
  open_library/
    fetch.ts                     ← search.json + works.json + editions.json
    parse.ts                     ← extract cover / isbn / pageCount / format-hint / first_publish_year
  hardcover/
    fetch.ts                     ← GraphQL client (Bearer auth, missing-token-soft-fail)
    parse.ts                     ← tags / rating / source URL
  wikipedia/
    parse.ts                     ← extended: list of sub-list parsers
    sub-lists.ts                 ← optional: per-sub-list selectors if main parse.ts gets too dense
  field-priority.ts              ← extended FIELD_PRIORITY
  merge.ts                       ← unchanged, must work as-is with 4 sources
  dry-run.ts                     ← extended: discoveryDuplicates, optional rawHardcoverPayload
  types.ts                       ← extended: HardcoverPayload, OpenLibraryPayload
src/db/
  schema.ts                      ← +book_format enum, +book_availability enum, +4 columns on book_details
  migrations/
    0005_<name>.sql              ← drizzle-generated
scripts/
  ingest-backfill.ts             ← extended --source validation
.env.example                     ← +HARDCOVER_API_TOKEN= (optional, dokumentiert mit URL zur Token-Beschaffung)
```

CC darf abweichen, wenn ein anderer Schnitt sauberer ist.

### Field-Priority-Map (illustrativ — CC darf basierend auf real-extrahierbaren Feldern verfeinern)

| Schema-Feld | 3a-Priorität | 3b-Priorität (neu) | Rationale |
|---|---|---|---|
| `works.title` | wikipedia → lexicanum | wikipedia → lexicanum → open_library | Open Library als 3.-Fallback |
| `works.releaseYear` | wikipedia → lexicanum | wikipedia → open_library → lexicanum | Wikipedia-list-page Year ist Pub-Year-canonical; OL als Backup wenn Wikipedia lückig |
| `works.startY` / `endY` | lexicanum | lexicanum | unverändert; LLM in 3c wird das fixen |
| `works.coverUrl` | — | open_library | OL hat ISBN-basierte Cover-Endpoints |
| `works.synopsis` | — | — | Bleibt leer bis 3c LLM |
| `book_details.isbn13` | — | open_library → wikipedia | OL ist bibliographisch-canonical |
| `book_details.isbn10` | — | open_library | OL only |
| `book_details.pageCount` | — | open_library | OL präzise |
| `book_details.format` (NEU) | — | llm → open_library | LLM 3c primär, OL als Heuristik-Fallback |
| `book_details.availability` (NEU) | — | llm → open_library | LLM 3c primär; OL Edition-History als Heuristik-Hint |
| `book_details.seriesId` / `seriesIndex` | wikipedia → lexicanum | wikipedia → lexicanum | unverändert |
| Junctions `authorNames` | wikipedia → lexicanum | wikipedia → lexicanum → open_library | OL füllt 25%-Wikipedia-Lücke |
| Junctions `factionNames` / `locationNames` / `characterNames` | lexicanum | lexicanum | unverändert; lore-spezifisch |
| Hardcover `tags` (raw) | — | hardcover | Audit-Slot, KEIN FIELD_PRIORITY-Eintrag (Mapping auf Facets ist 3c LLM) |
| Hardcover `averageRating` | — | hardcover | Audit-Slot, KEIN Schema-Field in 3b |

### Diff-JSON-Schema-Erweiterung

Bestehende Keys aus 3a bleiben. Neue Keys:

```jsonc
{
  "ranAt": "...",
  "discoverySource": "wikipedia",
  "discoveryPages": [
    "List_of_Warhammer_40,000_novels",
    "Horus_Heresy_(novels)",                       // NEU
    "Siege_of_Terra_(series)",                     // NEU
    "The_Beast_Arises"                             // NEU
  ],
  "activeSources": ["lexicanum", "open_library", "hardcover"],  // ggf. ohne hardcover
  "discovered": 812,                                // > 683
  "discoveryDuplicates": [                          // NEU
    {
      "slug": "horus-rising",
      "sources": ["List_of_Warhammer_40,000_novels", "Horus_Heresy_(novels)"]
    }
  ],
  "added": [
    {
      "wikipediaTitle": "...",
      "slug": "...",
      "payload": {
        "fields": {
          "title": "...",
          "coverUrl": "https://covers.openlibrary.org/b/id/...",   // NEU
          "isbn13": "9781849701", "isbn10": "1849701",            // NEU
          "pageCount": 416,                                       // NEU
          // ... format/availability bleiben oft undefined bis 3c
        },
        "fieldOrigins": {
          "coverUrl": "open_library",                              // NEU
          "isbn13": "open_library",
          // ...
        },
        "externalUrls": [
          { "source": "wikipedia", "url": "..." },
          { "source": "lexicanum", "url": "..." },
          { "source": "open_library", "url": "https://openlibrary.org/works/OL..." },  // NEU
          { "source": "hardcover",   "url": "https://hardcover.app/books/..." }        // NEU
        ],
        "rawHardcoverPayload": {                                   // NEU, optional, audit-only
          "tags": ["grimdark", "military-sci-fi"],
          "averageRating": 4.21
        }
      }
    }
  ],
  "skipped_manual": [...],                          // wie 3a
  "skipped_unchanged": [...],
  "field_conflicts": [...],                         // jetzt zwischen 3 Quellen möglich
  "errors": [
    { "slug": "...", "source": "hardcover", "message": "missing token" }   // soft-fail
  ]
}
```

### Phase-3-Roadmap-Update (zur Erinnerung)

| Stufe | Status | Inhalt |
|---|---|---|
| **3a** | ✅ shipped 2026-05-03 (sessions 034 + 035) | Wikipedia-Discovery + Lexicanum-Crawler + Multi-Source-Engine + Manual-Protection-Comparator + 7 Confidence-Aktivierungen + 5 totalPlanned-Korrekturen |
| **3b** | ← diese Session | Open Library + Hardcover dazu, format/availability-Schema, Discovery-Sub-Listen |
| **3c** | next | LLM-Anreicherung (Sonnet 4.6 + Web-Search): Synopsen, Soft-Facets, Format/Availability-Klassifikation, Plausibilitäts-Cross-Check |
| **3d** | | Apply-Step: Diff → DB-Writes mit Manual-Protection on conflict, FK-Resolution für Author-Junction, ALTER TYPE für sourceKind, UNIQUE INDEX external_links, junctionsLocked-Flag |
| **3e** | | Backfill-Day: --limit 40 Test, dann --limit 800 über Nacht, mehrere Auto-PRs in 100er-Batches |
| **3f** | | Maintenance-Crawler in GH Actions, monatlich, Wikipedia-Diff für Neureleases |

### Hardcover-Token-Beschaffung (für Philipp, wenn 3b loslegt)

1. Account auf <https://hardcover.app> anlegen (kostenlos).
2. In den Account-Settings unter „Developer" / „API" den Bearer-Token generieren.
3. Token in `.env.local` als `HARDCOVER_API_TOKEN=<value>` eintragen — **niemals committen**.
4. CC's Crawler liest `process.env.HARDCOVER_API_TOKEN`; wenn fehlt, soft-fail mit WARN.

Wenn der Account-Anlege-Schritt zu hakelig ist oder die API sich als signifikant teurer / komplizierter als erwartet erweist: 3b schließt mit nur Open Library, Hardcover wird auf 3b.2 oder ganz aus der Roadmap rausgezogen. Das ist eine Cowork-Entscheidung mit Philipp, kein CC-Solo-Call.

### Verbindlichkeit der Architektur

Die Engine-Architektur aus 3a (Field-Priority-Merge, SourceCrawler-Interface, Manual-Protection-Comparator) ist mit Philipp am 2026-05-02 entschieden und durch 3a's Test-Run validiert. 3b dockt strict an. Wenn die zwei neuen Quellen ohne Refactor andocken: gut, das war die These. Wenn nicht: das ist der Architektur-Befund den die ganze 3-Phase-Roadmap braucht — dokumentieren statt umbauen, dann gemeinsam entscheiden.
