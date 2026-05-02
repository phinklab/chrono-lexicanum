---
session: 2026-05-02-023
role: architect
date: 2026-05-02
status: implemented
slug: era-anchor
parent: 2026-05-02-022
links:
  - 2026-04-29-008
  - 2026-04-29-011
  - 2026-04-30-013
  - 2026-05-01-019
  - 2026-05-01-021
  - 2026-05-02-022
  - 2026-05-02-024
commits: []
---

# Stufe 2c.0 — Era-Anchor (`primaryEraId` als kanonisches Bucketing)

## Goal

Ersetze die zwei algorithmischen Era-Bucketing-Logiken (Overview's strict
midpoint, EraDetail's midpoint ±5) durch ein **explizites, editorisch
gepflegtes `primaryEraId`-Feld** auf jedem Buch. Eine kanonische Quelle der
Wahrheit für „in welche Era gehört dieses Buch?". Kein Mittelwert mehr.

Konkret: neue Spalte `book_details.primary_era_id`, in `books.json` für jedes
der 26 Bücher gesetzt, in den beiden Konsumenten (Overview-Count-Badges +
EraDetail-Filter) durchgezogen. Plus ein `npm run check:eras`-Script als
Drift-Guardrail für künftige Briefs.

## Context

Stufe 2b (sessions 021/022) hat 26 voll annotierte Bücher in die DB gepumpt
und dabei zwei algorithmische Inkonsistenzen sichtbar gemacht (Report 022 §
„Open issues"):

- `vt01` / `hr01` / `db01` (mid M41.997–41.999) erscheinen sowohl im
  `time_ending`-Count-Badge (Overview, strict midpoint) als auch in der
  `indomitus`-EraDetail-Track (midpoint ±5). Bookkeeping-Bug.
- `id01 The Infinite and the Divine` (startY 35000, endY 41999, mid 38499.5)
  fällt in die Lücke zwischen `age_apostasy` (ends 37999) und `time_ending`
  (starts 40997). Resultat: erscheint in **keiner** Era.
- `mf01 Mark of Faith` (startY/endY 42010) landet algorithmisch in
  `indomitus`, war im 021er-Brief aber für `time_ending` gezählt — Cowork-
  Brief und Daten widersprachen sich.

Philipp hat die Architektur-Entscheidung in der Cowork-Session am 2026-05-02
getroffen: keine Mittelwert-Berechnung. Stattdessen pro Buch eine **kanonische
Platzierungs-Entscheidung** als Datenfeld. Heute füllt Cowork das manuell für
die 26 Bücher; in Phase 4 wird der LLM-Crawler das Feld vorbefüllen
(„wo gehört dieses Buch am plausibelsten hin?"), Maintainer kann
überschreiben.

Der grundsätzliche Effekt: ein Buch lebt in **genau einer** Era. Multi-Era-
Sichtbarkeit ist explizit out of scope für 2c.0 (siehe „Out of scope"); wenn
sie irgendwann gebraucht wird, kommt sie als zweite Spalte
`secondary_era_ids text[]` nach.

Daten-Provenance heute: `startY`/`endY` werden manuell aus Lexicanum-Recherche
gepflegt (`scripts/seed-data/books.json`, Begleit-Doc
`docs/data/2b-book-roster.md` mit Quellen). Diese Werte bleiben — sie sind
weiterhin für Range-Anzeige in EraDetail (z.B. „M41.997–M41.999" als kicker
hinter dem Buchtitel) relevant. Sie taugen nur nicht mehr fürs Bucketing.

Schema-Stand: `book_details` ist eine reine 1:1-Detail-Tabelle zu `works
WHERE kind='book'` (CTI), aktuell mit `workId / isbn13 / seriesId /
seriesIndex`. Stufe-2a-Migration (0003) hat sie geschaffen.

## Constraints

### Daten

1. **`book_details.primary_era_id varchar(64) references eras(id)`** — neue
   Spalte. Du entscheidest, ob sie initial `NOT NULL` ist (sicher, wenn
   `seed.ts` immer einen Wert schreibt — aktuell der einzige Insert-Pfad)
   oder nullable + Doc-only-required (defensiv für Phase-4-Ingestion).
   Pflicht ist nur, dass nach dem Seed alle 26 Bücher einen Wert haben.
2. **In `books.json`:** jedes Buch bekommt eine zusätzliche Top-Level-
   Property `"primaryEraId": "<era_id>"`. Die Vorbefüllungs-Tabelle unten in
   §„Vorbefüllung — Cowork-Empfehlung pro Buch" ist Cowork-Empfehlung;
   Philipp signiert / korrigiert vor dem Mergen der PR.
3. **`startY` und `endY` bleiben unangetastet.** Sie sind weiterhin die
   Quelle für Range-Strings in der UI und für Sortierung
   (`works.startY ASC`). Nur fürs Bucketing werden sie nicht mehr benutzt.
4. **`scripts/seed.ts`** liest `primaryEraId` aus jedem Book-Eintrag und
   schreibt es ins `book_details.primary_era_id`-Feld. `RawBook`-Interface
   um die Property erweitern. Wenn ein Buch das Feld _nicht_ trägt: hartes
   Failen während des Seeds (mit klarer Fehlermeldung welches Buch),
   nicht silently null-default. Die Pflichtigkeit ist die ganze Idee.

### Code

5. **`src/lib/timeline.ts`** — `TimelineBook` bekommt `primaryEraId: string`
   (oder `string | null`, je nach (1)). Konsumenten lesen es, statt Mittel-
   werte zu rechnen.
6. **`src/app/timeline/page.tsx`** — die Drizzle-Query liefert über das
   bereits gejointe `bookDetails`-Relation `primaryEraId` automatisch mit;
   das Mapping in den `TimelineBook`-Shape muss es propagieren. Keine
   zusätzliche Query nötig.
7. **`src/components/timeline/Overview.tsx`** — die `eraCounts`-`useMemo`-
   Berechnung (Lines ~69–78, der Block mit `const mid = (b.startY +
   b.endY) / 2`) wird ersetzt durch
   `eras.find((e) => e.id === b.primaryEraId)`. Genauer: pro Buch ein
   Lookup, Counter inkrementieren. Keine `±5`-Logik, kein Midpoint.
8. **`src/components/timeline/EraDetail.tsx`** — die `eraBooks`-`useMemo`
   (Lines ~77–84, derzeit `mid >= era.start - 5 && mid <= era.end + 5`)
   wird ersetzt durch `b.primaryEraId === era.id`. Strikt, kein Slack.
9. **Signaturen-Eindämmung.** `era.start` / `era.end` werden im
   Bucketing nicht mehr referenziert — nur noch in der UI (Axis-Ticks,
   Year-Labels). Das ist gewünscht.

### Guardrail-Script

10. **`scripts/check-eras.ts`** + `package.json`-Script `check:eras` (neben
    den anderen `db:*` / `lint` / `typecheck`-Einträgen). Was es tut:
    - Lädt `scripts/seed-data/books.json` und `eras.json`.
    - Prüft pro Buch:
      - `primaryEraId` ist gesetzt.
      - `primaryEraId` referenziert eine existierende Era-ID.
      - **Sanity-Warnung** (kein Fehler): `endY` liegt nicht weit
        außerhalb der `era.end` der zugewiesenen Era (z.B. > 5000 Jahre),
        sonst Hint im Output: „`hh14 The First Heretic` ist `great_crusade`
        zugewiesen, hat aber endY 30998 = horus_heresy.start — ist das
        Absicht?". Heuristik darf großzügig sein; sie ist ein Smell-Detector,
        keine Gatekeeper.
    - Druckt eine Verteilungs-Tabelle (Era-Name + Buch-Count) damit
      Cowork beim nächsten Brief sehen kann „Era X enthält Y Bücher" ohne
      händisches Zählen.
    - Exit-Code 0 wenn alle Bücher valide; 1 wenn fehlende oder ungültige
      `primaryEraId`-Werte.
    - **Kein DB-Zugriff.** Reines JSON-Linting. Damit bleibt das Script
      auch ohne `.env.local` lauffähig (CI-tauglich, falls wir das später
      in den CI-Workflow einhängen — out of scope für 2c.0).

### Versionen / Dependencies

11. **Keine neuen Dependencies.** Das Script nutzt das, was schon da ist
    (`tsx`, native `fs/path`, Type-Imports aus `src/db/schema.ts` falls
    nötig — aber bevorzugt JSON-only damit es schnell läuft).
12. **Keine Pinning-Aktion.** Stack bleibt wo er ist.

### Was steht und nicht angefasst wird

13. `EraDetail` track-packing, pan/drag, prev/next era nav, axis ticks, empty-
    state — unverändert. Nur die `eraBooks`-Filter-Logik ändert sich.
14. `Overview` Ribbon, count-badge-Render, focus-brackets, eraGlitch hover
    — unverändert. Nur die `eraCounts`-Quelle ändert sich.
15. Schema-Tabellen `works`, `factions`, `series`, `persons`, `facets`,
    `external_links`, `services` — keine Änderung.
16. Seed-Daten der Sanity-3 (`hh01`, `eis01`, `di01`) und der 23 neuen
    Bücher: `startY`/`endY`/`series`/`factions`/`persons`/`facets`/
    `externalLinks` bleiben **wie sie sind**. Nur `primaryEraId` kommt dazu.

## Out of scope

- **DetailPanel + Deep-Linking (Brief 018, on-ice).** Bewusst eigene Session
  als Stufe 2c.1 nach 2c.0. Begründung: 018 ist gegen das alte Schema
  geschrieben (`books`-Tabelle, `bookFactions`, `bookCharacters`,
  separat-stehende `goodreadsUrl`/`lexicanumUrl`-Spalten). Die Datenshape
  hat sich seit 2a komplett verändert (CTI mit `works` + `book_details`,
  `work_factions`, `work_persons`, `work_facets`, `external_links`-Tabelle).
  Ein Rewrite mit der frisch verfügbaren `primaryEraId` als Era-Resolution
  für Deep-Links ist sauberer als 018 zu patchen.
- **`secondary_era_ids text[]` für Multi-Era-Sichtbarkeit.** Verlockend für
  id01 („zeigt sich auch in age_apostasy"), aber UX-konsequenz ist offen
  (zählt zweimal? lädt EraDetail zweimal?). Wenn der Bedarf konkret
  auftaucht, eigener Brief.
- **Era-Granularität ändern.** Z.B. die Lücke zwischen `age_apostasy.end`
  37999 und `time_ending.start` 40997 schließen. Die in-universe Periode
  M38–M40 ist canonical „dunkler Korridor"; nicht unsere Aufgabe, das zu
  füllen. `primaryEraId` löst die Bucketing-Frage ohne Era-Boundaries
  anzufassen.
- **Backfill alter `bookDetails`-Rows ohne `primaryEraId`.** Da die DB heute
  via `seed.ts` rebuilt wird (Drop+Insert beim nächsten Run) und 26 Bücher
  per JSON-Update mitwachsen, brauchen wir keine separate Backfill-
  Migration. Falls Drizzle sich beim ALTER TABLE über NOT NULL ohne DEFAULT
  beschwert: nullable einführen, seed durchziehen, in einer Folge-Migration
  NOT NULL machen — oder einfach nullable lassen und im Seed strikt
  validieren (Constraint 4).
- **Cluster-collapse für dichte Eras** (16 Bücher in time_ending). 022
  Report flagged „dense aber strukturell ok"; FilterRail / cluster-collapse
  sind Phase-2a.2 und Phase-4-getrieben.
- **CI-Integration des `check:eras`-Scripts.** Das Script existiert lokal
  und kann von Cowork beim nächsten Brief aufgerufen werden. Es in
  `.github/workflows/ci.yml` einzuhängen ist eine eigene kleine Hygiene-
  Aktion; out of scope hier.
- **Visual confirmation des 2b-Tooltip-Wraps** (Report 022 § „For next
  session"). Eigene UI-Backlog-Aufgabe; gehört nicht in diesen Brief, weil
  hier kein UI angefasst wird.

## Acceptance

The session is done when:

- [ ] `book_details` hat eine neue Spalte `primary_era_id varchar(64)
      references eras(id)`. Migration generiert (`npm run db:generate`),
      committed, und auf Supabase angewendet (`npm run db:migrate`).
- [ ] Alle 26 Bücher in `scripts/seed-data/books.json` tragen ein
      `primaryEraId`-Feld. Werte konsistent mit der Tabelle in
      §„Vorbefüllung" (oder mit einer von Philipp im PR-Review
      revidierten Version).
- [ ] `npm run db:seed` läuft idempotent; nach dem Seed:
      `SELECT primary_era_id, COUNT(*) FROM book_details GROUP BY 1` zeigt
      die Verteilung der 26 Bücher auf die 7 Eras (oder sechs, wenn
      `age_apostasy` weiterhin leer bleibt).
- [ ] `TimelineBook` in `src/lib/timeline.ts` hat das Feld `primaryEraId`.
      Server-Mapping in `src/app/timeline/page.tsx` propagiert den Wert
      aus `bookDetails`.
- [ ] **Overview-Count-Badges:** rein aus `primaryEraId` berechnet. `vt01`,
      `hr01`, `db01` zählen genau einmal — in `time_ending`. `id01` zählt
      in der Era, die Philipp ihm zuweist (Cowork-Empfehlung:
      `time_ending`). `mf01` zählt in der Era, die Philipp ihm zuweist
      (Cowork-Empfehlung: siehe Tabelle, dort ist eine Editorial-Frage
      gestellt). Per-Era-Counts müssen mit dem Output von
      `npm run check:eras` übereinstimmen.
- [ ] **EraDetail-Filter:** strikt `b.primaryEraId === era.id`. Kein
      ±5-Slack mehr. Verifiziert per `curl localhost:3000/timeline?era=…`
      auf mehrere Eras: jedes Buch erscheint in genau einer EraDetail-View,
      kein Buch verschwindet.
- [ ] `padStart(3, "0") VOLUMES`-Badge-Template rendert auch
      zweistellige Counts korrekt („`016 VOLUMES`", „`002 VOLUMES`"). Das
      ist mit den 2b-Daten so, aber die neuen Counts sind teilweise höher
      (z.B. `time_ending` = 16 statt zuvor 14). Smoke-check.
- [ ] `scripts/check-eras.ts` existiert und ist über `npm run check:eras`
      lauffähig. Output enthält die Verteilungs-Tabelle. Exit 0 nach Seed
      mit gültigen Daten.
- [ ] `npm run lint` clean (1 pre-existing layout.tsx warning bleibt).
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` grün.
- [ ] PR auf `main` / `phinklab/chrono-lexicanum` geöffnet. Required-
      Status-Check `ci / lint-and-typecheck` grün. Vercel-Preview rendert
      `/timeline?era=time_ending` mit den korrekten Büchern (Cowork
      verifiziert visuell beim Review).
- [ ] Report dokumentiert: (a) ob `primary_era_id` als NOT NULL oder
      nullable gewählt wurde und warum, (b) den exakten Output von
      `npm run check:eras` nach erfolgreichem Seed, (c) etwaige
      Diskrepanzen zwischen Cowork-Vorbefüllungs-Tabelle und tatsächlich
      ausgewählten Werten (z.B. wenn Philipp im Review ein Buch umlabelt).

## Vorbefüllung — Cowork-Empfehlung pro Buch

Verbindlich für CC: **die Werte unten ins `books.json` eintragen**.
Philipp prüft im PR-Review und korrigiert dort ggf. Begründungen
(„Editorial-Frage") gehen an Philipp; die anderen sind unzweideutig.

| ID | Titel | startY–endY | `primaryEraId` | Begründung |
|---|---|---|---|---|
| `hh01` | Horus Rising | 30998–30998 | `horus_heresy` | trivial |
| `hh07` | Legion | 30985–30985 | `great_crusade` | trivial (vor Isstvan) |
| `hh09` | Mechanicum | 30998–31000 | `horus_heresy` | trivial |
| `hh14` | The First Heretic | 30951–30998 | `horus_heresy` | **Editorial-Wahl**: spans Great Crusade → Heresy-Auftakt; ich packe es in `horus_heresy`, weil es Teil der HH-Series ist und Reader so suchen werden. Großer-Crusade-Argument: Monarchia-Klimax ist M30.985, also 13 Jahre vor Isstvan. Philipp picks. |
| `hh19` | Know No Fear | 30998–30998 | `horus_heresy` | trivial |
| `hh41` | Master of Mankind | 31005–31010 | `horus_heresy` | trivial |
| `bl01` | The Talon of Horus | 31040–31040 | `age_rebirth` | trivial (post-Heresy Black-Legion-Founding) |
| `ba01` | I Am Slaughter (Beast Arises 1) | 32544–32544 | `long_war` | trivial |
| `eis01` | Eisenhorn: Xenos | 41200–41220 | `time_ending` | trivial |
| `gg01` | Gaunt's Ghosts: First and Only | 41745–41745 | `time_ending` | trivial |
| `cc01` | Ciaphas Cain: For the Emperor | 41928–41928 | `time_ending` | trivial |
| `rv01` | Ravenor | 41341–41341 | `time_ending` | trivial |
| `nl01` | Soul Hunter (Night Lords 1) | 41850–41850 | `time_ending` | trivial |
| `hr01` | Helsreach | 41998–41998 | `time_ending` | trivial (jetzt nicht mehr in indomitus geleakt) |
| `si01` | Storm of Iron | 41600–41600 | `time_ending` | trivial |
| `pe01` | Path of the Warrior | 41850–41850 | `time_ending` | trivial |
| `vt01` | Vaults of Terra: The Carrion Throne | 41997–41997 | `time_ending` | trivial (jetzt nicht mehr in indomitus geleakt) |
| `gh01` | Ghazghkull Thraka: Prophet of the Waaagh! | 41600–41999 | `time_ending` | trivial |
| `db01` | The Devastation of Baal | 41999–41999 | `time_ending` | trivial (jetzt nicht mehr in indomitus geleakt) |
| `id01` | The Infinite and the Divine | 35000–41999 | `time_ending` | **Editorial-Wahl**: M35–M41 spans 6 Millennia, aber Klimax + Resolution sind M41. Per Philipps Klimax-Prinzip: time_ending. |
| `fs01` | Farsight: Crisis of Faith | 41801–41801 | `time_ending` | trivial |
| `mf01` | Mark of Faith | 42010–42010 | **Editorial-Frage** | Daten sagen M42010 → `indomitus`. Cowork-Brief 021 hatte sie für `time_ending` gezählt, weil Mark of Faith inhaltlich „Sisters of Battle und der Cicatrix Maledictum / End-Zeiten-Atmosphäre" ist. **Cowork-Empfehlung: `indomitus`** (Daten ehren), aber Philipp kann `time_ending` picken wenn er das Sisters-of-Battle-Endzeit-Lesegefühl wichtiger findet als das Datum. Kein default — Philipp picked vor dem Seed. |
| `gk01` | Grey Knights | 41850–41850 | `time_ending` | trivial |
| `pm01` | Priests of Mars | 41880–41880 | `time_ending` | trivial |
| `di01` | Dark Imperium | 42030–42040 | `indomitus` | trivial |
| `df01` | Avenging Son (Dawn of Fire 1) | 42010–42010 | `indomitus` | trivial |

**Erwartete Verteilung nach 2c.0** (mit Cowork-Empfehlungen):

| Era | Count |
|---|---|
| `great_crusade` | 1 (Legion) |
| `horus_heresy` | 5 (hh01, hh09, hh14, hh19, hh41) |
| `age_rebirth` | 1 (Talon of Horus) |
| `long_war` | 1 (I Am Slaughter) |
| `age_apostasy` | 0 (kein Buch) |
| `time_ending` | 15 oder 16 (je nach mf01-Entscheidung) |
| `indomitus` | 2 oder 3 (je nach mf01-Entscheidung) |
| **Σ** | **26** |

Vergleiche dieser Werte mit den 022er-Renderings:

| Era | 022 Overview | 022 EraDetail | 2c.0 (erwartet) |
|---|---|---|---|
| `time_ending` | 14 | 14 | 15 oder 16 (+1/+2: id01 reinholen, mf01 ggf.) |
| `indomitus` | 3 | 6 | 2 oder 3 (vt01/hr01/db01 raus; mf01 ggf. raus) |

Sprich: Counts in time_ending **steigen**, Counts in indomitus **sinken**.
Genau wie es sein soll.

## Open questions

- **NOT NULL ja/nein?** Konsequenzen-Trade-off: NOT NULL erzwingt
  Pflichtigkeit auf DB-Ebene (Phase-4-Ingestion-Schutz), erfordert aber
  beim ersten ALTER TABLE entweder einen Backfill-Default oder den
  drop+recreate-Pfad. Nullable + seed-side-Validation (Constraint 4) ist
  pragmatischer und reicht heute. Pick + dokumentier deine Wahl.
- **Spaltenposition in `book_details`.** Konvention im Repo? Logisch nach
  `seriesIndex` ergibt Sinn (alles was „dieses Buch im Kontext"
  beschreibt). Wenn der vorhandene Drizzle-Stil eine andere Reihenfolge
  vorschreibt, folge dem.
- **`mf01` final.** Cowork empfiehlt `indomitus` (siehe Tabelle). Bitte
  Philipp explizit fragen oder den Cowork-Wert eintragen und im Report
  dokumentieren, dass dies eine Cowork-Default-Entscheidung war, die
  Philipp im PR-Review revidieren kann.
- **`hh14 The First Heretic` final.** Cowork empfiehlt `horus_heresy`
  (per HH-Series-Kohorten-Argument). Same Vorgehen.
- **`check:eras`-Output-Format.** ASCII-Tabelle ist okay; wenn du Lust
  hast, ein farbiges Output mit `kleur`/`picocolors`-Style — bitte nur
  wenn jene Lib bereits Dependency ist, sonst plain. Goal ist
  Lesbarkeit beim manuellen Cowork-Run, nicht Eye-Candy.
- **`age_apostasy` bleibt leer.** Damit zeigt EraDetail dort weiterhin
  den Cogitator-Empty-State („// EXCERPTUM CLEAR…"). Ist das so gewollt
  oder schmeißen wir ein Buch dorthin, um die Lücke zu füllen? Cowork
  Antwort: ja, gewollt. M37 Apostasy-Periode hat in unseren 26 keinen
  Vertreter; in Phase 4 wird das selbstverständlich kommen (Vandire,
  Sebastian Thor, etc.). Empty State ist deswegen okay und sogar ehrlich.
  Frage offen, falls du beim Implementieren auf einen Grund stößt, das
  zu ändern.

## Notes

- **Drizzle-Migration-Stil** (Reminder von 020-er-Report): die Stufe-2a-
  Migration wurde thematisch in 0002 (drop) / 0003 (create) gesplittet
  per drizzle-kit-TTY-Workaround. Für 2c.0 ist der Change klein genug,
  dass eine einzige Migration passen sollte (`0004_era_anchor.sql` oder
  drizzle's auto-naming, beides ok). Wenn drizzle-kit beim Generieren
  zickt: gleicher TTY-Workaround wie damals.
- **`check:eras`-Inspiration:** sieh dir `scripts/seed.ts` an, wie es JSON
  liest und parst. Das Script soll keinen DB-Code teilen müssen — pures
  JSON-Linting. Importe aus `src/db/schema.ts` sind okay, falls du Era-
  oder Book-Typen brauchst.
- **Verifikation per curl** statt Browser ist okay (wie 022 es gemacht
  hat), weil hier kein UI-Pixel sich ändert. Nur die Zahlen in den
  Badges und die Bücherliste in EraDetail. Visual-confirm-Pass macht
  Cowork beim PR-Review.
- **Branch-Namen-Vorschlag:** `feat/2c0-era-anchor` — nicht enforced.
- **PR-Shape:** ein Branch, eine PR. Commits-Granularität ist deine. Eine
  saubere Aufteilung wäre: (1) schema + migration, (2) seed + books.json
  Population, (3) consumer-side replacement (Overview + EraDetail +
  TimelineBook + page.tsx mapping), (4) check:eras script + roster-
  doc-Update. Aber ein einziger Commit ist auch fine.
- **`docs/data/2b-book-roster.md` Cleanup:** die „Verteilung"-Tabelle dort
  oben spiegelt die alte algorithmische Erwartung. Update sie, sodass sie
  zur neuen `primaryEraId`-Realität passt (insbesondere: `time_ending`
  count, `indomitus` count, `mf01`-Klärung). Das ist Teil dieses Briefs.

## References

- Brief 021 (Stufe 2b): `sessions/2026-05-01-021-arch-rich-seed-2b.md`
- Report 022 (Stufe 2b shipped): `sessions/2026-05-02-022-impl-rich-seed-2b.md`
  — § „Open issues" und § „For next session" sind die direkte Motivation
  für diesen Brief.
- Brief 019 (Stufe 2a Schema-Foundation):
  `sessions/2026-05-01-019-arch-schema-foundation.md` — der CTI-Pattern
  und die `book_details`-Tabelle leben dort.
- Report 020 (Stufe 2a shipped):
  `sessions/2026-05-01-020-impl-schema-foundation.md` — Drizzle-Migration-
  Patterns und der TTY-Workaround.
- Roster-Doc: `docs/data/2b-book-roster.md` — Cowork-Recherche pro Buch
  (Quellen, Daten-Begründung). Wird im Zuge dieses Briefs aktualisiert.
- Schema-Patch-Stelle: `src/db/schema.ts` § `bookDetails` (Spalte nach
  `seriesIndex` einfügen).
- Bucketing-Konsumenten: `src/components/timeline/Overview.tsx`
  (Lines ~69–78, `eraCounts`-`useMemo`) und
  `src/components/timeline/EraDetail.tsx` (Lines ~77–84, `eraBooks`-
  `useMemo`).
- Mapping-Stelle: `src/app/timeline/page.tsx` (Lines ~91–135, Drizzle-
  Query + `TimelineBook[]`-Mapping).
- TimelineBook-Definition: `src/lib/timeline.ts` (Lines ~40–57).
- Carry-over-Punkt 3 in `sessions/README.md` (das ist dieser Brief).
