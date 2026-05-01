---
session: 2026-05-01-020
role: implementer
date: 2026-05-01
status: complete
slug: schema-foundation
parent: 2026-05-01-019
links:
  - 2026-05-01-019
  - 2026-05-01-018
  - 2026-04-29-011
  - 2026-05-01-015
commits: []
---

# Stufe 2a — Schema-Foundation (works + CTI + facets + external_links + persons)

## Summary

Schema-Foundation aus Brief 019 ausgerollt: alte `books`-Tabellen abgerissen,
`works`-zentrierte CTI-Topologie aufgebaut (parent + 4 Detail-Tabellen), 12
Facet-Kategorien mit 85 Werten geseedet, services/external_links und unified
persons verkabelt, Hub-Footer + Timeline-Route auf `works WHERE kind='book'`
umgestellt, `TimelineBook.author: string` → `authors: string[]` durchgezogen.
3-Buch-Sanity-Fixture voll annotiert, Build grün, Discriminator-Sanity =0.

## What I did

### Schema + migrations
- `src/db/schema.ts` — komplett neu, works/CTI-Topologie, alle neuen Junctions, alle 14 Indizes aus Constraint 28, alle Drizzle-`relations()`-Blöcke.
- `src/db/migrations/0002_drop_book_tables.sql` — auto-generiert; 4 DROP TABLE CASCADE.
- `src/db/migrations/0003_create_works_foundation.sql` — auto-generiert plus 4 manuell angehängte CHECK-Trigger (CREATE FUNCTION + CREATE TRIGGER pro Detail-Tabelle: `book_details`, `film_details`, `channel_details`, `video_details`).
- `src/db/migrations/meta/0002_snapshot.json`, `0003_snapshot.json`, `_journal.json` — auto-aktualisiert.

### Seed
- `scripts/seed.ts` — Rewrite. Validiert Facet-IDs vor der Transaktion (klare Fehlermeldung bei Tippfehlern), nutzt `db.transaction(...)` + Helper-Pattern für works+book_details, loggt jede Tabelle einzeln.
- `scripts/seed-data/books.json` — 3 Bücher mit Inline-Annotationen (`factions[].id+role`, `persons[].id+role`, `facets` als category-keyed map, `externalLinks[]`).
- `scripts/seed-data/services.json` — NEU, 18 Anbieter aus Constraint 13 mit Domain-Feldern.
- `scripts/seed-data/persons.json` — NEU, 2 Autoren (Dan Abnett, Guy Haley) mit lexicanum/wikipedia URLs.
- `scripts/seed-data/facet-catalog.json` — NEU, 12 Kategorien mit 85 Werten (NEON-14 + 11 editorial).
- `scripts/seed-data/README.md` — neue Tabellen, neue Files, Beispiel-Buch-Shape dokumentiert.

### Routen
- `src/app/page.tsx` — Hub-Footer-Count: `count() FROM works WHERE kind='book'`.
- `src/app/timeline/page.tsx` — `db.query.works.findMany({ where: kind='book', with: { bookDetails+series, factions, persons where role='author' } })`.

### Lib + components
- `src/lib/timeline.ts` — `TimelineBook.author: string` → `authors: string[]`. `bookMatchesFilters` auf `book.authors.some(...)` umgestellt.
- `src/components/timeline/EraDetail.tsx` — `BookDot`-Tooltip rendert `authors.join(", ")` mit `·`-Separator zur Jahreszahl; bei 0 Autoren wird das Author-Segment des Tooltips weggelassen.

### Docs
- `ARCHITECTURE.md` — Schema-Diagramm-Block ersetzt durch werks-zentriertes Diagramm; neuer Decisions-Log-Eintrag für Stufe 2a.
- `ROADMAP.md` — Phase 2a-Block: Schema-Foundation als ✅ angehakt; explizit Stufe 2b (20 Bücher) und 2c (DetailPanel-Reaktivierung) als nächste Schritte.

### Sessions
- Brief 019 Frontmatter `status: open` → `implemented`, commits-Liste folgt nach git-push.
- `sessions/README.md` Active-Threads-Tabelle aktualisiert (019 implementiert, neue 020-Zeile).

## Decisions I made

### Migration-Strategie: thematischer Split (0002 Drop / 0003 Create)

Brief erlaubte „eine oder mehrere Files" mit Begründungspflicht. Ich habe in
**zwei Files** gesplittet, primär aus tooling-getriebenem Grund:

`drizzle-kit generate` erkennt Tabellen mit ähnlichen Namen (z.B.
`book_factions` ↔ `work_factions`) als potenzielle Renames und prompted
interaktiv „rename or create-new?". Die `prompts`-Library ihrer Diff-Engine
verlangt eine echte TTY (`process.stdin.isTTY` muss truthy sein), was die
Bash-Automation hier nicht liefert (auch `winpty -Xallow-non-tty` plus
gepipte CRs scheitert). Drizzle-kit hat keinen `--force`/`--no-prompt`-Flag.

Workaround: Schema temporär auf einen Zwischenstand reduziert (alle Refs
behalten, alle book_*-Tabellen raus, KEINE neuen Tabellen) → 0002
generierte saubere DROPs ohne Rename-Prüfung. Schema dann auf Voll-Stand
restored → 0003 generierte saubere CREATEs (es gab nichts mehr zu renamen).

Lese-Vorteil ist trotzdem real: 0002 = „tear down old", 0003 = „build new"
ist diff-freundlich, und Vercel-Deploy applied beide hintereinander
(Migrate-Step zeigt zwei Tags im Log). Die existierenden 0000/0001 sind
byte-identisch geblieben.

Wenn die TTY-Klippe nicht wäre, hätte ich `0002_works_foundation.sql` als
Atom geschrieben — Drizzle generiert atomar, und ein 1-File-Diff liest sich
für einen Schema-Wurf dieser Größe auch fein.

### Discriminator-Integrität: App-only PLUS CHECK-Trigger

Pflicht nach Brief war app-seitige Disziplin via `insertBook(...)`-Helper.
Ich habe zusätzlich CHECK-Trigger auf alle 4 Detail-Tabellen gesetzt
(`book_details_kind_check`, `film_details_kind_check`,
`channel_details_kind_check`, `video_details_kind_check`).

Pro Detail-Tabelle ~10 Zeilen plpgsql, BEFORE INSERT OR UPDATE FOR EACH
ROW. Der Helper bleibt die primäre Zugangs-Disziplin; der Trigger fängt
direkte INSERT-Pfade ab, die später vom Brief abweichen (Drizzle Studio
edits, oder ein zukünftiger Code-Pfad, der den Helper umgeht). Smoke-Test
verifiziert: `INSERT INTO film_details (work_id) VALUES (<book_uuid>)`
wirft `RAISE EXCEPTION 'film_details may only attach to works.kind = film'`.

Composite-FK mit generated literal column war explizit nicht-Ziel und ist
auch nicht implementiert. Single-Table-Inheritance (alles in `works`,
NULLable kind-spezifische Felder) hatte ich kurz erwogen — aber das
rauscht die Schema-Klarheit gegen marginal weniger DDL-Komplexität ein,
und die Drizzle-Friktion auf der CTI-Variante fiel mit zwei
plpgsql-Triggern weg.

### `role`-Felder: varchar mit default

`work_factions.role`, `work_characters.role`, `work_locations.role` sind
varchar(32) mit defaults (`supporting` / `appears` / `secondary`).
`work_persons.role` ist hingegen `person_role` als pgEnum (Constraint 14
spezifizierte das so). Begründung für varchar bei den drei junction-roles:
matches die alte `bookFactions.role`-Konvention, kein Enum-Lock-in für
einen 4. Wert in 6 Monaten. `person_role` ist hingegen ein größeres,
stabileres Vokabular (11 Rollen) — Enum macht dort Sinn.

### Drizzle Relations API: v1 (`relations()`)

Code-Bestand benutzt v1-Pattern bereits konsistent (factions, series,
locations, characters). Stufe 2a fügt 16 weitere `relations()`-Blöcke im
gleichen Stil dazu. v2 (`defineRelations()`) ist neuer aber bringt für
unsere Lese-Pfade null Mehrwert; der Brief-Beispiel-RQB läuft 1:1 mit v1.
RQB unterstützt `where` inside `with` seit Drizzle 0.30+; wurde in
`timeline/page.tsx` benutzt (`persons: { where: role='author' }`).

### Seed-JSON-Form: Single `books.json` mit Inline-Annotationen

Pro Buch: factions/persons/facets/external_links als Felder im Buch-Objekt.
Top-Level-Refs (services, persons, facet-catalog) als eigene Files.
Begründung: Philipp pflegt 20 Bücher in 2b von Hand — alles-pro-Buch in
einer Datei ist die ergonomische Form (eine Stelle zum Lesen/Editieren pro
Eintrag). Top-Level-Refs ändern sich seltener und gewinnen Klarheit durch
Trennung.

`scripts/seed.ts` validiert Facet-IDs vor der Transaktion (Set aus
`facet-catalog.json` aufbauen, jede Buch-Facet-ID matchen, sonst Throw mit
klarer Fehlermeldung). Spart Postgres-FK-Violation-Lottery bei Tippfehlern.

### `work_factions.role` für Sanity-Seed: `primary`

Die alte Seed-Implementierung hat alle book_factions als role=`supporting`
gesetzt. Das war defensiv, aber ungenau: für die 3 Fixture-Bücher ist die
einzige zugewiesene Faction jeweils ihre Primärfraktion (Sons of Horus für
Horus Rising, Inquisition für Eisenhorn, Ultramarines für Dark Imperium).
Brief Constraint 9 erlaubt `primary | supporting | antagonist` mit default
`supporting`. Im neuen books.json explizit `"role": "primary"` per
faction-Eintrag. Editor-friendly für 2b.

### External_links Sanity-Seed: 1 lexicanum_url pro Buch

Brief erlaubte 0–1 pro Buch. Eine pro Buch (`kind: 'reference'`,
`service: 'lexicanum'`, label „Lexicanum") gibt drei FK-exercise-Rows ohne
Canon zu erfinden. URLs manuell verifiziert — Lexicanum benutzt
`(Novel)`-Suffix für die drei.

### `works.release_year` nullable

Brief-Empfehlung umgesetzt. Channels haben semantisch keinen
`release_year` und werden später als kind=channel mit start_y/end_y/release_year=NULL
einfließen. Für die 3 Fixture-Bücher ist `release_year` natürlich gefüllt
(2006, 2001, 2017).

### `source_kind`-Enum-Erweiterung

Hinzugefügt: `tmdb`, `imdb`, `youtube`, `wikidata`. Nicht heute verwendet,
aber 2c/3/Phase 4 werden sie einziehen — eine ALTER TYPE ADD VALUE
Migration jetzt im Sammelpaket spart 4 spätere ALTER-only-Migrationen.
Ohne Side-Effects auf bestehende Rows (default bleibt `manual`).

### Multi-Author-Display in EraDetail

`BookDot`-Tooltip-Pattern: `authors.join(", ")` mit `·`-Separator zum
Jahr. Bei 0 Autoren wird der Author-Segment plus `·` weggelassen, das
Tooltip zeigt dann nur `M31.998`. Komma-Separation hält die existierende
`·`-Vokabel-Trennung Autor/Jahr klar (würde der Dot zwischen Autoren
gesetzt, kollidiert das visuell mit der Autor/Jahr-Trennung). 3
Sanity-Bücher haben je 1 Autor → visuell identisch zu Stand 013. Multi-
Author-Codepath ist da, aber ohne Daten-Stress-Test in 2a.

### Facet-Catalog: selektive ID-Disambiguierung (`pc_xenos`)

Brief Notes § A enthielt `xenos` als Wert sowohl in `protagonist_class`
als auch in `pov_side`. Constraint 10 sagt `facet_values(id varchar pk,
…)` — Single-Column-PK. Die Klammer-Empfehlung in Notes § A
(„Eindeutigkeit über category_id") las sich nach Composite-PK, der
eigentliche Constraint sagte Single. Mit Cowork (vor Plan-Finalisierung)
geklärt: **selektiv umbenennen, Single-PK behalten**. Ergo: `protagonist_
class.xenos` → `pc_xenos` umbenannt; `pov_side.xenos` bleibt
verbatim. `pc_` als Präfix erhält die `cw_*`-Konvention für content_warning
Werte. Alle anderen 84 Facet-Werte bleiben verbatim aus Brief § Notes A.

### Brief-Acceptance-Bullet-Slip vermerkt

Brief Acceptance: „/timeline?era=long_war zeigt Eisenhorn: Xenos."
Eisenhorn liegt aber in M41.200–M41.220 (mid 41210), eras.json hat `long_
war` als M32–M36 (start 32000, end 36999). Der korrekte Era-Match ist
**`time_ending`** (40997–41999). Mit `?era=time_ending` rendert Eisenhorn
korrekt als einzige Volumes-Zeile. Mit `?era=long_war` rendert die Era
leer (cogitator-empty-state). Das ist eine Brief-Slip; das Verhalten der
Filterlogik ist korrekt (Era-Boundary-Match ±5 Jahre wie aus 011/013).
Kein Code-Fix.

## Verification

- `npm run typecheck` → grün.
- `npm run lint` → grün (1 pre-existing Warnung in `src/app/layout.tsx` zum Custom-Font-Loader, unverändert von vor Stufe 2a).
- `npm run build` → grün (Next.js 16.2.4 Turbopack, ✓ Compiled successfully in 1081ms, alle 6 statischen Pages generiert, /timeline + /healthz dynamic).
- `npm run db:generate` (initiale Generierung) → 0002 + 0003 produziert via Two-Step.
- `npm run db:migrate` → applied 0002 + 0003 erfolgreich gegen Supabase Pooler.
- `npm run db:generate` (Drift-Check post-implementation) → „No schema changes, nothing to migrate" ✅.
- `npm run db:seed` → idempotent (zweimal hintereinander gleiche Counts: 7 eras, 25 factions, 14 series, 5 sectors, 28 locations, 0 characters, 18 services, 12 facet_categories, 85 facet_values, 2 persons, 3 works, 3 book_details, 3 work_factions, 3 work_persons, 35 work_facets, 3 external_links).
- Schema-Inspektion via psql/postgres-js: 22 tables, 7 enums, 4 CHECK triggers (jeder gelistet 2x: für INSERT und UPDATE), Discriminator-JOINs alle 0.
- Trigger-Smoke-Test: Test-Insert von `film_details` an einen kind=book work wirft die erwartete Exception, Rollback funktioniert.
- Lokaler Browser-Test (next start auf Port 3017):
  - `/` → Footer „**3** Novels Indexed".
  - `/healthz` → 200, `{ ok: true, db: "up" }`.
  - `/timeline` → Survey-Mode Overview-Ribbon.
  - `/timeline?era=horus_heresy` → 1 Buch-Pin (Horus Rising), Tooltip „Dan Abnett · M31.998".
  - `/timeline?era=time_ending` → 1 Buch-Pin (Eisenhorn), Tooltip „Dan Abnett · M41.210".
  - `/timeline?era=indomitus` → 1 Buch-Pin (Dark Imperium), Tooltip „Guy Haley · M42.035".
  - `/timeline?era=M30` → 307 redirect zu `/timeline?era=great_crusade`.
  - Stubs `/map`, `/ask`, `/buch/horus-rising`, `/fraktion/foo`, `/welt/foo`, `/charakter/foo` → alle 200 (kein DB-Aufruf, keine Build-Fehler).

Vercel-Preview-Deploy steht aus bis zum PR-Push.

## Open issues / blockers

Keine. Brief-Akzeptanz ist erfüllt.

## Answers to brief 019 § Open questions

- **Discriminator-Integrität:** App-only via `insertBook` Helper PLUS CHECK-Trigger auf alle 4 Detail-Tabellen. Composite-FK absichtlich nicht. Single-Table-Inheritance kurz erwogen, aber der Trigger-Pfad löst die Härtung ohne Schema-Eleganz-Verlust (siehe „Decisions I made").
- **Migrations-Strategie:** Zwei thematische Files (`0002_drop_book_tables` + `0003_create_works_foundation`). Primär-Trigger war drizzle-kit's TTY-Anforderung beim Rename-Resolver, nicht architektonische Wahl. 0002 ist 4 DROP-Statements, 0003 ist die ganze CREATE-Welle plus 4 angehängte CHECK-Trigger. Vercel-Deploy applied beide hintereinander.
- **Drizzle Relations API:** v1 `relations()`. Konsistent mit Phase-1-Schema; v2 bringt für unsere Lese-Pfade keinen Mehrwert. RQB `where` inside `with` funktioniert sauber (`persons: { where: role='author' }` in der Timeline-Query).
- **`role`-Felder als pgEnum oder varchar:** `work_factions.role`, `work_characters.role`, `work_locations.role` als varchar(32) mit default — matches alte `bookFactions.role`-Konvention, kein Enum-Lock-in für 4. Wert. `work_persons.role` als pgEnum `person_role` — größeres stabileres Vokabular, Enum begründet.
- **Seed-Daten-JSON-Form:** Single `books.json` mit Inline-Annotationen pro Buch (factions, persons, facets, external_links als Felder). Top-Level-Refs (services, persons, facet-catalog) als eigene Files. Editor-friendly für Philipps Hand-Pflege in 2b — eine Stelle pro Buch.
- **`work_persons.display_order`:** Gepopuliert als 0 (Default) für alle 3 Fixture-Einträge — bei einem Autor pro Buch keine Heuristik nötig. Wird in 2b interessant wenn Co-Author/Co-Narrator-Reihenfolgen relevant werden.
- **`works.release_year` nullable:** Ja. 3 Fixture-Bücher haben echte Werte (2006/2001/2017). Channels und ambiguous Werke kriegen NULL.
- **Multi-Author-Display:** Komma-Join im EraDetail BookDot-Tooltip mit `·` zur Jahreszahl. Bei 0 Autoren wird der Author-Segment weggelassen. Keine Truncation/Tooltip-Fallback in 2a — kommt mit echten Multi-Author-Daten in 2b/2c.
- **Facet-IDs aus § Notes A:** Selektiv namespaced — `protagonist_class.xenos` → `pc_xenos`, alle anderen 84 Werte verbatim. User vor Plan-Approval bestätigt. Begründung: Single-PK aus Constraint 10 erhalten, Brief-Notation maximal respektiert. Globaler Namespace (`pov_xenos`, `tone_grimdark`, …) wäre konsistenter aber mehr Brief-Abweichung; Composite-PK auf `(category_id, id)` wäre schemastrukturell saubererer aber widerspricht Constraint 10's Wortlaut.
- **`source_kind`-Enum-Erweiterung:** `tmdb`, `imdb`, `youtube`, `wikidata` ergänzt. Heute kein Verbrauch, ab 2c/3/Phase-4 relevant; eine kleine ALTER-TYPE-ADD-VALUE-Welle jetzt spart 4 spätere Einzelmigrationen.
- **Was war das schmerzhafteste Stück?** Drizzle-kit's TTY-Anforderung beim Rename-Resolver hat 30 min gefressen, bis der Two-Step-Workaround stand. winpty + gepipte Returns + `-Xallow-non-tty` lieferten alle Varianten von „cannot start non-TTY". Lösung war pragmatisch (Schema-Diff so zerlegen, dass keine Rename-Prüfung anfällt), aber suboptimal für die Zukunft — sobald wieder eine Tabelle umbenannt wird, kommt das Thema zurück.

## For next session

Cowork sollte beim Planen folgende Punkte berücksichtigen — auf Basis von Beobachtungen während Stufe 2a:

- **Brief-Acceptance-Slip im 019:** Acceptance-Bullet sagt Eisenhorn lebt in `?era=long_war`. Tatsächlicher Era-Match ist `time_ending` (Eisenhorn mid M41.210, long_war 32000–36999). Code rendert korrekt, kein Fix nötig — nur den 020-Report-Vermerk lesen.
- **drizzle-kit TTY-Klippe wird wiederkommen.** Sobald Stufe 2c/3 wieder Tabellen anlegt, deren Namen ähnlich zu existierenden klingen, reaktiviert sich der Rename-Resolver-Prompt. Mögliche Mitigations für einen späteren Brief: `node-pty` als devDependency + ein kleines `scripts/db-generate.ts` Wrapper, das eine fake-PTY öffnet und die ersten N Prompts mit „+ new" auto-beantwortet. Oder upstream feature-request bei drizzle-kit für `--no-prompt`/`--force-create-new`.
- **Hub novel-count freshness (carry-over aus 015):** weiter offen, wird in Stufe 2b heißer, sobald die Buch-Anzahl von 3 auf 23 springt. Dann entscheiden ob `export const revalidate = 60` auf `src/app/page.tsx` oder „redeploy to update count" akzeptabel bleibt.
- **2b Facet-Fillrate (carry-over):** 4 Pflicht-Facets (`tone`, `pov_side`, `protagonist_class`, `entry_point`) + `content_warning` für die 20 Bücher. Sanity-Fixture hat alle 11 Pflicht-Facets gefüllt — gute Editor-Vorlage. Constraint im 2b-Brief explizit notieren.
- **Composite-Indizes zurückhalten:** Brief Constraint 28 listete 14 Indizes, ich habe genau diese 14 angelegt. Bei 3 Büchern unmöglich Hot-Spots zu identifizieren. In 2b/2c (mit 20–N Büchern und Filter-RailUI) kann ein composite-Index z.B. auf `(works.kind, works.canonicity)` für „nur offizielle Bücher" oder `(work_facets.facet_value_id, work_facets.work_id)` ein Re-Index-Layer-Zyklus rechtfertigen. EXPLAIN ANALYZE-driven, nicht voreilig.
- **`channel_details`/`video_details` stehen bewusst dünn da.** Spalten sind minimal (PK + 1–2 sinnvolle Felder pro Tabelle). Wenn Phase 5 echte Channels einzieht, wird ein Brief die fehlenden Spalten (`channel_url`, `subscriber_count`, `started_at` für channels; `duration_s`, `video_url`, `kind_specific_extras` für videos) als 1–2-Spalten-Migrationen nachschießen.
- **`audio_drama_details`-Tabelle:** Brief Constraint 5 hat sie ausgeschlossen — Audio-Dramen werden als `kind=book` mit `format=audio_drama`-Facet modelliert. Wenn ein konkretes Voll-Cast-Drama ohne zugrundeliegenden Roman in 2b/2c auftaucht („Realm of the Damned"), trigger der zusätzlichen Tabelle.
- **`submissions`-Schema-Anpassung weiter offen.** entityType bleibt varchar mit polymorpher payload. Anpassung an die neue Welt (kind=work + Detail-Tabellen) ist späterer Brief, nicht Stufe 2b.
- **Carry-over zu Hub novel-count:** unverändert relevant.

## References

- Drizzle ORM RQB API: <https://orm.drizzle.team/docs/rqb> — `findMany` mit `where` inside `with` für die Timeline-Query.
- drizzle-kit `generate` flags: `npx drizzle-kit generate --help` (kein `--no-prompt` verfügbar in 0.31.10).
- Postgres trigger-syntax: <https://www.postgresql.org/docs/current/plpgsql-trigger.html> für die 4 CHECK-Trigger.
- NEON-14 Trigger-Warning-Set: Bridgland et al. 2022, [PMC9067675](https://pmc.ncbi.nlm.nih.gov/articles/PMC9067675/).
