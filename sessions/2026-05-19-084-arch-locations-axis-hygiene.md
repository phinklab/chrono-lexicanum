---
session: 2026-05-19-084
role: architect
date: 2026-05-19
status: implemented
slug: locations-axis-hygiene
parent: 2026-05-16-077-arch-grand-alignment-junction-hygiene
links:
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-16-077-impl-grand-alignment-junction-hygiene
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-13-070-impl-faction-policy-hygiene
  - 2026-05-17-081-arch-ssot-synopsis-backfill-005-019
  - 2026-05-19-084-impl-locations-axis-hygiene
commits: []
---

# Locations-Axis-Hygiene — Sister-Pass zu Brief 077 für die Locations-Achse

## Goal

Auf der Locations-Achse den strukturell-analogen Skip-Pfad zu Brief 077 bauen,
sodass umbrella-/grand-alignment-Surface-Forms (z. B. `Imperium`, `Chaos`,
`Xenos`) in den `overrides.locations[]`-Blöcken nicht mehr als unresolved
Locations im `book_details.notes`-`locationsUnresolved`-Bucket auftauchen
(sondern in einem neuen `locationsSkippedRedundant`-Audit-Bucket landen), wenn
im selben Override-Block bereits konkrete Location-Rows resolved sind. Wichtig
zur Datenebene: auf der Locations-Achse resolven die Umbrellas heute zu `null`
(keine `imperium`/`chaos`-Location-Row in `locations.json`), es gibt also
**keine** `work_locations`-Junction-Rows, die wir wegputzen — der Effekt von
084 ist ein **Notes-Bucket-Umsortierungs-Pass** (Surface-Form wandert von
`locationsUnresolved` nach `locationsSkippedRedundant`), nicht eine
Junction-Reduktion. `work_locations` bleibt erwartbar invariant bei 417.

Die Skip-Logik lebt im Apply-Layer (nicht im Resolver) und mirror-t präzise
die Apply-Override-Architektur aus Brief 077: pure DI-Helper, Audit-Bucket im
`book_details.notes`-`---surfaceForms---`-Block, Re-Apply `ssot-w40k-001..020`
als Backfill (Notes-Pflege), neue Policy-File `location-policy.json`.

## Context

Brief 077 (commits `9b8d593..c7ada5d`, PR #65 `7d482c2` gemerged) hat die
Grand-Alignment-Junction-Hygiene auf der **Faction-Achse** abgeschlossen:
`work_factions(imperium|chaos)` von 214 → 49 (−165), Skip-Helper
`scripts/apply-override-skip.ts` als pure DI-Funktion (`decideFactionSkips()`),
Skip-Liste in `scripts/seed-data/faction-policy.json` Top-Level-Field
`redundantWhenSubPresent: ["imperium", "chaos"]`, geskippte Surface-Forms im
neuen `factionsSkippedRedundant`-Bare-String-Array-Bucket im
`book_details.notes`-`---surfaceForms---`-Block, shared Alignment-Util
`src/lib/seed/alignment.ts`.

077-impl-For-next-session-Punkt 1 hat das **Locations-Pendant** explizit
flagged: `test:resolver-coverage`-Output zeigt heute `Imperium x20` als
unresolved Location. Strukturell analog zur 077-Faction-Lücke — Bücher taggen
`Imperium` als Filter-Surface auch auf der Locations-Achse, obwohl Imperium
keine Location ist (= politisches/lore-Konzept, kein Sektor / keine Welt /
keine Sub-Location).

**Strukturelle Unterschiede zur Faction-Achse** (Brief-084-Architektur-Calls,
die Cowork bereits entschieden hat):

- (1) **Locations haben kein `alignment`-Feld.** Faction-Rows tragen
  `alignment: "imperium"|"chaos"|"xenos"|"neutral"`, das nutzt 077 für die
  Alignment-Equality-Skip-Bedingung. Locations haben `sector` (`solar` /
  `obscurus` / `ultima` / `pacificus` / `tempestus` / `imperium_nihilus` / …),
  aber Sector-Klassen sind physisch, nicht politisch — „Cadia" ist in
  `obscurus` (= Galactic-North-Quadrant), nicht in einem "imperial"-Sektor.
  Eine 077-style Tree-Membership-Bedingung („skip Imperium, wenn andere
  imperial-aligned Location vorhanden") braucht eine Klassifikation, die heute
  weder im Schema noch in den Daten existiert.

- (2) **Locations-Policy existiert heute nicht.** `scripts/seed-data/` hat
  `location-aliases.json` + `locations.json`, aber kein
  `location-policy.json`-Pendant. Auch keine Browse-Roots-/Tree-Roots-Trennung
  — Locations sind eine flachere Domain (Sectors enthalten Sub-Sectors
  enthalten Worlds enthalten Sub-Locations; das Single-Parent-Modell von
  Factions trifft hier nicht zu).

- (3) **Die unresolved-Form ist heute „erstmal stehen lassen".** Auf der
  Faction-Achse wurde `Imperium of Man` vor Brief 077 in eine
  `work_factions`-Junction geschrieben (weil eine `imperium`-Faction-Row
  existiert) — Brief 077 hat 165 solcher redundanten Rows weggeputzt. Auf
  der Locations-Achse passiert das *nicht*: es gibt keine
  `imperium`-Location-Row, also matcht der Resolver nicht (`resolveLocation`
  gibt `id: null` zurück) und der Surface-Form landet im `locationsUnresolved`-
  Bucket im `book_details.notes`-`---surfaceForms---`-Block. Heutige Empirie
  (per `jq`-Count über alle `manual-overrides-ssot-w40k-{NNN}.json`-Files):
  **20 Bücher tragen `Imperium` als Location-Tag, davon haben 14 im selben
  Override-Block mindestens eine andere Location resolved (= Skip-Kandidaten),
  6 tragen `Imperium` als alleinigen Location-Tag (= Erhaltungs-Pfad,
  Galaxy-Wide-Survey-Bücher / lore-only-Standalones)**. Brief 084 erwartet
  damit: 14 Surface-Forms wandern aus `locationsUnresolved` in
  `locationsSkippedRedundant`, 6 bleiben in `locationsUnresolved` stehen.
  `work_locations` bleibt invariant bei 417 (Brief 084 berührt nur den
  Audit-Bucket; die Junction-Rows sind unbetroffen).

  Plus eine Forward-Discipline-Lücke: der Loop ab `ssot-w40k-021` könnte
  weiter `Imperium`-Strings als Locations schreiben, falls Codex die
  Disziplin-Heredoc-Zeile aus Brief 061 nicht sauber durchhält. Apply-Layer-
  Skip kürzt die Disziplin auf den deterministischen Endpunkt zu —
  Surface-Forms wandern dann automatisch in den Audit-Bucket statt in
  `locationsUnresolved`.

**Maintainer-Architektur-Wahl (per AskUserQuestion 2026-05-19):**

> „Broad in der Absicht, explizit in der Liste. Keine automatische Tree-
> Membership-Regel, weil sonst echte Orte unter einem Umbrella versehentlich
> rausfallen könnten. Dazu Audit-Ausgabe für geskipptes Location-Material,
> damit wir sehen, ob die Liste zu aggressiv ist."

Daraus folgt: **Allowlist-basierter Skip mit Erhaltungs-Pfad**. Die Skip-Liste
ist eine maintainer-pflegbare JSON-Liste von Surface-Form-Strings (nicht von
IDs, weil die Strings ja gerade *nicht* zu IDs resolven). Sub-Regel zur
Erhaltung: wenn im selben Override-Block keine andere Location resolved ist,
darf der Umbrella-String stehen bleiben (Worldbuilding-/Galaxy-Wide-Survey-
Fall, sehr selten). Audit-Bucket macht False-Positives sofort sichtbar im
Cockpit unter `/buch/<slug>/audit`.

Pfad-Bezüge:

- Resolver: [`src/lib/resolver/index.ts`](../src/lib/resolver/index.ts)
  (`resolveLocation` Zeile 66).
- Apply-Layer: [`scripts/apply-override.ts`](../scripts/apply-override.ts)
  (`resolveLocations` Zeile 403, `applyLocations` Zeile 893,
  `buildSurfaceFormsBlock`, `loadSkipContext`).
- Skip-Helper-Sibling: [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts)
  (Brief-077-Modell). Brief 084 fügt einen zweiten Helper hinzu — entweder als
  neue File `scripts/apply-override-location-skip.ts` (analog der getrennten
  Datei-Konvention von 077) oder als zusätzliche exportierte Funktion in
  derselben File. Cowork-Wahl: **neue File** (parallele Struktur, leichter
  zu lesen, leichter zu testen).
- Policy: neu `scripts/seed-data/location-policy.json` (eigene File, keine
  Erweiterung von `faction-policy.json` — siehe „Strukturelle Unterschiede"-
  Punkt 1).
- Faction-Policy-Sibling: [`scripts/seed-data/faction-policy.json`](../scripts/seed-data/faction-policy.json)
  als formales Vorbild für das Top-Level-Feld + `specialCases`-Note.
- ADR-Vorbild: [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md)
  § „Grand-Alignment-Junction-Skip" als Mustervorlage für die analoge
  Sektion in einer neuen ADR `brain/wiki/decisions/location-policy.md`
  (siehe Acceptance).

**Was Brief 084 NICHT ist**: kein Faction-Touch (077 ist closed), kein
Resolver-Logik-Touch (`src/lib/resolver/index.ts` bleibt pure Surface-Form-zu-
ID), kein UI-Filter-Rollup auf Locations (separater Brief später), kein
HH-Domain-Pre-Heresy-Handling (HH-Files existieren noch nicht).

## Constraints

### Architektur

- **Skip-Logik lebt im Apply-Layer**, nicht im Resolver. Identisch zur
  077-Architektur und aus demselben Grund: ob eine Surface-Form redundant ist,
  ist Block-Context-Information (gibt's eine andere Location im selben
  Override?), nicht Surface-Form-Wissen. Der Resolver bleibt Pure-Surface-
  Form-zu-ID; eine umbrella-Form wie `Imperium` resolved heute zu `null` und
  resolved nach 084 weiterhin zu `null`. Skip ist der nachgeordnete Schritt
  *nach* `resolveLocations`.

- **Pure Helper mit DI-Signatur.** Neue File
  `scripts/apply-override-location-skip.ts` exportiert `decideLocationSkips()`
  in derselben Form wie `decideFactionSkips()`:

  ```ts
  // Illustrativ, kein vollständiger Code:
  export function decideLocationSkips(input: {
    surfaceForms: Array<{ name: string }>;                    // aus override.overrides.locations[]
    redundantSurfaceForms: ReadonlySet<string>;               // aus location-policy.json
    resolvedLocationIds: ReadonlyArray<string>;               // resolveLocations-Output, nur die !== null
  }): {
    keepSurfaceForms: Array<{ name: string }>;                // werden geschrieben
    skippedSurfaceForms: string[];                            // landen im Audit-Bucket
  };
  ```

  Signatur-Punkte: keine DB, kein FS zur Call-Time, case-insensitive Match,
  trim-Whitespace, no-op wenn `redundantSurfaceForms` leer ist, no-op wenn
  `resolvedLocationIds` leer ist (= Erhaltungs-Pfad).

- **Pure-Helper-Funktion folgt der 077-Lese-Reihenfolge.** `decideLocationSkips`
  läuft NACH `resolveLocations` und VOR `buildSurfaceFormsBlock`, sodass der
  Audit-Bucket korrekt befüllt wird. Auf der Locations-Achse schreibt
  `applyLocations` heute nur Junction-Rows für `resolveLocation(name).id !==
  null`-Surface-Forms; das ändert sich nicht (Skip greift damit *nicht* auf
  Junction-Schreibung, sondern nur auf Audit-Bucket-Zuordnung — siehe Goal).

- **Audit-Bucket-Konvention.** Neuer Bare-String-Array-Bucket
  `locationsSkippedRedundant: ["Imperium", "Imperium of Man", ...]` im
  `book_details.notes`-`---surfaceForms---`-Block, **nur wenn non-empty**
  (Diff-Minimalität bei Büchern ohne Skip). Form analog `factionsSkippedRedundant`
  aus Brief 077.

- **`buildSurfaceFormsBlock` muss explizit angepasst werden — geskippte
  Surface-Forms dürfen NICHT mehr in `locationsUnresolved` stehen.** Heutiger
  Code-Stand in `apply-override.ts:460-462` baut `locationsUnresolved` aus
  *allen* unresolved Surface-Forms (`resolveLocation(name).id === null`),
  also auch aus den Umbrellas. Ohne explizite Exclusion landet `Imperium`
  doppelt im Notes-Block (einmal in `locationsUnresolved`, einmal in
  `locationsSkippedRedundant`) — das wäre ein Diff-Sichtbarkeits-Bug.
  `buildSurfaceFormsBlock` muss daher zusätzlich einen
  `skippedLocationSurfaceForms: string[]`-Parameter übernehmen (analog dem
  existierenden `skippedSurfaceForms`-Faction-Parameter) und beim
  `locationsUnresolved`-Build filtern: nur Surface-Forms, die *weder*
  resolved sind *noch* in `skippedLocationSurfaceForms` stehen, landen in
  `locationsUnresolved`. Case-insensitive Match analog `decideLocationSkips`.
  Test-Case in `test:resolver`: Buch mit `["Cadia", "Imperium"]` → post-084
  hat genau einen `locationsUnresolved`-Eintrag (= leer, weil Cadia
  resolved) und einen `locationsSkippedRedundant`-Eintrag (`Imperium`); KEIN
  doppeltes Vorkommen.

### Policy-File

- **Neue File `scripts/seed-data/location-policy.json`.** Schema:

  ```json
  {
    "redundantSurfaceForms": [
      "Imperium",
      "Imperium of Man",
      "Imperium of Mankind",
      "the Imperium",
      "Chaos",
      "Chaos Space",
      "the Chaos Space",
      "Realm of Chaos",
      "the Warp",
      "Warp Space",
      "Xenos",
      "Aliens",
      "Alien Space"
    ],
    "specialCases": {
      "the Warp / Warp Space": "Locations-Achse: der Warp ist kein physischer Ort im Sense der `locations.json` (kein gx/gy). Bücher taggen ihn als Filter-Surface, aber der Resolver matcht ihn nicht. Skip statt unresolved. Begründung analog Imperium.",
      "Eye of Terror exklusiv": "Eye of Terror IST eine reale Location-Row (id=`eye_of_terror`, sector=`obscurus`, gx=330/gy=120). NICHT in `redundantSurfaceForms`. Wenn ein Buch sowohl `Eye of Terror` als auch `Realm of Chaos` tagged, wird Eye of Terror als Junction geschrieben, Realm of Chaos skipped."
    }
  }
  ```

  Die Liste ist **Maintainer-pflegbar**: erweitern / kürzen ohne Code-Touch.
  CI-Lint (`brain:lint`) prüft *nicht* die Inhalte der Liste; das ist
  Maintainer-Domain. Codex extends die Liste in Brief 084 NICHT eigenmächtig
  — der Initial-Set steht im Brief und wird so übernommen.

- **Startup-Validation.** `loadLocationSkipContext()` (analog
  `loadSkipContext` aus Brief 077) lädt die Datei einmalig beim Apply-Run-
  Start. Wirft hart, wenn (a) die JSON nicht parsbar ist, (b)
  `redundantSurfaceForms` fehlt oder kein Array ist, (c) ein Eintrag in
  `redundantSurfaceForms` zu einer existierenden `locations.json`-Row
  resolvable wäre (= Self-Foot-Shooting: jemand hat eine echte Location auf
  die Skip-Liste gesetzt). Validierung läuft beim ersten Apply einmal pro
  Process.

### Skip-Bedingung (zwei Punkte, beide müssen halten)

1. Die Surface-Form steht in `redundantSurfaceForms` (case-insensitive, nach
   trim).
2. Im selben Override-Block ist mindestens **eine andere Location** zu einer
   `locations.json`-Row resolved (`!== null`).

Erfüllen beide → Junction wird NICHT geschrieben, Surface-Form landet im
Audit-Bucket. Erhaltungs-Pfad: trägt das Buch nur den Umbrella-String (keine
andere Location), bleibt die Surface-Form als unresolved Audit-Note stehen
(= heutiges Verhalten, kein Skip). Sehr seltener Fall — Galaxy-Wide-Survey-
Bücher / lore-only-Standalone-Bände mit nur einem Umbrella-Tag.

### Re-Apply als Backfill

- **`ssot-w40k-001..020` (200 Bücher) müssen alle re-applied werden.** Der
  Apply-Layer macht DELETE-then-INSERT pro Buch, das Re-Apply schreibt für
  jedes der 200 Bücher den `book_details.notes`-Block neu. Per-Batch via
  `npm run db:apply-override -- --batch=ssot-w40k-{NNN}`.

- **Erwarteter Effekt — Notes-Bucket-Umsortierung, KEINE Junction-Reduktion.**
  Auf der Locations-Achse resolved `Imperium` heute zu `null`, also gibt es
  keine `work_locations`-Junction-Rows für Umbrella-Surface-Forms. Brief 084
  ist daher kein Counts-Reduktions-Pass auf `work_locations`, sondern ein
  Notes-Bucket-Umsortierungs-Pass. Empirie aus `jq`-Count über
  `manual-overrides-ssot-w40k-{NNN}.json`-Files (Pre-Apply-Erwartung):
  **14 Surface-Forms wandern von `locationsUnresolved` nach
  `locationsSkippedRedundant` über 14 Bücher; 6 Bücher behalten `Imperium`
  in `locationsUnresolved` (Erhaltungs-Pfad: alleiniger Location-Tag im
  Block)**. `work_locations` bleibt invariant bei 417.

  Codex schreibt einen `scripts/db-counts-084.ts`-Helper (analog
  `scripts/db-counts-077.ts`), der die Notes-Buckets pro Buch parst und
  Pre/Post-Zahlen liefert: (a) Bücher mit `Imperium` in `locationsUnresolved`
  pre-084, (b) Bücher mit `Imperium` in `locationsUnresolved` post-084
  (Erwartung: 6 = Erhaltungs-Pfad-Fälle), (c) Bücher mit
  `locationsSkippedRedundant`-Bucket post-084 (Erwartung: 14 für `Imperium`,
  plus eventuell weitere falls die Empirie andere Umbrellas in der
  Initial-Liste belegt findet). `work_locations`-Count vor/nach als
  Sanity-Check (sollte gleich bleiben).

  Codex bestätigt im Closing-Report die tatsächlichen Pre/Post-Zahlen und
  flagged jede Abweichung von der 14/6/0-Erwartung (z. B. wenn `Chaos Space`
  oder `the Warp` heute auch belegt sind und die Empirie höher ausfällt
  — das wäre Datenpunkt für die Liste-zu-aggressiv-Prüfung).

### Loop-Discipline-Heredoc-Append

- **In `sessions/2026-05-11-061-arch-ssot-loop.md`** den existierenden
  Discipline-Abschnitt (Public-Synopsis-Discipline aus Brief 076 +
  Faction-Granularity-Discipline aus Brief 077) um einen dritten Block
  **„Locations-Granularity-Discipline (ab `ssot-w40k-021` / `W40K-0201`)"**
  ergänzen. Inhalt: Verbote-Liste `Imperium`/`Imperium of Man`/`Imperium of
  Mankind`/`Chaos`/`Chaos Space`/`Realm of Chaos`/`the Warp`/`Warp Space`/
  `Xenos`/`Aliens`/`Alien Space` als `overrides.locations[].name`-Strings, mit
  Erhaltungs-Pfad-Klärung (= „falls das Buch ausschließlich umbrella-Tags
  trägt und keine konkrete Location, kann ein Tag stehen bleiben — sehr
  selten").

- **In `scripts/run-ssot-loop.sh`** den `base_trigger`-Heredoc analog
  erweitern, sodass jede neue Loop-Subsession die dritte Discipline mitliest.
  Append-Stelle: direkt nach dem Faction-Granularity-Block (Brief 077).

### Tests + Smoke

- **`scripts/test-resolver.ts` um Cases für `decideLocationSkips`
  erweitern.** Mindestens vier Fälle: (a) ein Skip feuert (umbrella + andere
  Location resolved); (b) Skip feuert nicht (umbrella + keine andere Location
  → Erhaltung); (c) mehrere Umbrellas im selben Block (z. B. `Imperium` +
  `Chaos`) + eine echte Location → alle Umbrellas geskippt, echte Location
  geschrieben; (d) Surface-Form-Match ist case-insensitive (`IMPERIUM` /
  `Imperium of MAN` werden gleich behandelt).

- **`test:resolver-coverage`-Output.** Brief 077 hat das Output-Format um
  einen Tail-String `(post-Brief-077-skip, N grand-alignment surface forms
  suppressed)` erweitert. Brief 084 macht das analog für die Locations-Achse:
  `(post-Brief-084-skip, M location umbrella surface forms suppressed)` für
  die Locations-Coverage-Zeile. Das ist eine separate Information; sie ersetzt
  nicht den Faction-Skip-Tail.

- **Smoke-Probe.** Codex schreibt `scripts/smoke-locations-084.ts` (analog
  `scripts/smoke-slugs-077.ts`), die N Slugs prüft, in denen heute `Imperium`
  als unresolved Location auftaucht. Erwartung: post-084 hat keiner dieser
  Slugs einen `locations.raw_name` mit Umbrella-String, alle haben den Bucket
  `locationsSkippedRedundant` in `book_details.notes` befüllt. N = 3–5 reicht.

### Brief-061-Status-Lifecycle

- **Status-Flips macht Codex** (analog 077-impl / 080-impl):
  Brief 084-arch `status: open → implemented` im selben Commit wie der
  084-impl-Report; `sessions/README.md` Active-Threads-Zeilen entsprechend.
  Cowork übernimmt nur den Wiki-Hygiene-Pass danach.

## Out of scope

- **Faction-Achse.** Brief 077 ist closed; keine Re-Edits an
  `apply-override-skip.ts` / `faction-policy.json` / `factionsSkippedRedundant`.
- **Resolver-Logik.** `src/lib/resolver/index.ts` `resolveLocation` bleibt
  unverändert. Umbrellas resolven heute zu `null`, post-084 auch — Skip ist
  Apply-Layer-Concern.
- **UI-Filter-Rollup auf Locations.** Eine künftige Map-/Cartographer-Phase
  wird hierarchische Location-Filter (Sector → Sub-Sector → World) brauchen;
  das ist ein eigener Brief später, *nicht* Brief 084.
- **HH-Domain Pre-Heresy.** Wenn HH-Bücher dazu kommen, können Blocks wie
  `["Terra", "Imperium"]` (Terra als Throneworld-Location + Imperium als
  Reich-Klassifikation) auftauchen. Mit der Brief-084-Skip-Bedingung passiert
  hier das Richtige: `Terra` resolved zu `locations.json:terra`, `Imperium`
  wird per Allowlist + Erhaltungs-Pfad-Bedingung geskippt. Brief 084
  dokumentiert das im neuen ADR-Eintrag als „Forward-Behavior", aber baut
  keine HH-spezifische Logik.
- **Sektor-Klassifikation als "imperial"/"chaos"/"xenos".** Die
  AskUserQuestion-Antwort hat explizit Tree-Membership ausgeschlossen —
  Allowlist-Form bleibt. Sektor-Politik-Klassen sind keine 084-Datengrundlage.
- **`location-aliases.json`-Edits.** Aliases sind eine Resolver-Wahrheit:
  `Dark City` → `commorragh`. Aliases bleiben Maintainer-Pflege; Brief 084
  fasst sie nicht an.
- **Schema-Migration.** Keine. `work_locations` bleibt unverändert,
  `book_details.notes`-Spalte ist schon da, neuer Bucket lebt im JSON-Inhalt.
- **Eldar/Tau/Xenos-Sub-Splits-Logik auf der Faction-Achse**. Bleibt 077-
  Out-of-Scope (Aeldari-Splits Revisit-Trigger in `faction-policy.md`).

## Acceptance

Die Session ist done, wenn:

- [ ] `scripts/seed-data/location-policy.json` existiert mit der initialen
  13-Eintrag-`redundantSurfaceForms`-Liste (siehe Constraints) plus den zwei
  `specialCases`-Einträgen.
- [ ] `scripts/apply-override-location-skip.ts` als neue File exportiert
  `decideLocationSkips()` als pure DI-Funktion. Mindestens 4 Test-Cases in
  `scripts/test-resolver.ts` (siehe Constraints § Tests). `test:resolver`
  bleibt grün.
- [ ] `scripts/apply-override.ts` reordered: `resolveLocations()` →
  `decideLocationSkips()` → `buildSurfaceFormsBlock()` mit neuem
  `skippedLocationSurfaceForms`-Parameter (geskippte Surface-Forms werden
  explizit aus `locationsUnresolved` herausgefiltert UND landen im neuen
  `locationsSkippedRedundant`-Bucket — kein Doppel-Vorkommen). Inkl. neuer
  `loadLocationSkipContext()` mit Startup-Validation (3 Throw-Bedingungen
  aus Constraints).
- [ ] `scripts/apply-override-dry.ts` simuliert den Skip ebenfalls
  (Dry-Run-Notes-Output matcht DB-Realität, neue Report-Zeile „skipped
  location surface forms: N across M books, by name: …").
- [ ] Re-Apply `ssot-w40k-001..020` durch (`npm run db:apply-override --
  --batch=ssot-w40k-{NNN}` x 20). **Erwartete Effekt-Tabelle** (Codex
  verifiziert via `scripts/db-counts-084.ts`-Helper, der `book_details.notes`
  parst):

  | Metrik | Pre-084 | Post-084 (Erwartung) | Anmerkung |
  |---|---:|---:|---|
  | Bücher mit `Imperium` in `locationsUnresolved` | 20 | 6 | Erhaltungs-Pfad: 6 Bücher tragen `Imperium` als alleinigen Location-Tag |
  | Bücher mit `Imperium` in `locationsSkippedRedundant` | 0 | 14 | Skip-Pfad: 14 Bücher haben mindestens eine andere Location resolved |
  | `work_locations` (Junction-Count) | 417 | 417 | invariant — Skip greift nicht auf Junction-Schreibung |
  | Doppel-Vorkommen `Imperium` in beiden Buckets | n/a | 0 | `buildSurfaceFormsBlock`-Exclusion-Regel |

  Codex flagged im Closing-Report Abweichungen (z. B. wenn die Empirie auch
  `Chaos Space` / `the Warp` belegt findet — die landen dann analog im
  Skip-Bucket bzw. im Erhaltungs-Pfad, plus Eintrag in der Tabelle).
- [ ] `sessions/2026-05-11-061-arch-ssot-loop.md` trägt einen neuen
  „Locations-Granularity-Discipline"-Block nach dem Faction-Granularity-
  Block. `scripts/run-ssot-loop.sh`-Trigger-Heredoc analog erweitert.
- [ ] Neue ADR `brain/wiki/decisions/location-policy.md` geschrieben (analog
  `faction-policy.md`-Struktur: Context / Decision / Why / Revisit-Trigger,
  mit expliziter Sektion „Umbrella-Surface-Form-Skip" + HH-Domain-Forward-
  Behavior). Frontmatter mit `decision-date: 2026-05-19`.
- [ ] Coverage-Test-Output trägt den Tail `(post-Brief-084-skip, M location
  umbrella surface forms suppressed)` für die Locations-Coverage-Zeile.
- [ ] `scripts/smoke-locations-084.ts` mit mindestens 5 Slugs probt
  post-084-Zustand: 3 Skip-Pfad-Slugs (Bücher mit `Imperium` UND einer
  weiteren resolved Location im Block) und 2 Erhaltungs-Pfad-Slugs
  (Bücher mit `Imperium` als alleinigem Location-Tag). Probe parst
  `book_details.notes` und prüft: (a) Skip-Pfad-Slugs haben `Imperium` in
  `locationsSkippedRedundant` und **nicht** in `locationsUnresolved` (=
  Exclusion-Regel hält); (b) Erhaltungs-Pfad-Slugs haben `Imperium`
  weiterhin in `locationsUnresolved` und **kein** `locationsSkippedRedundant`-
  Bucket; (c) `work_locations.raw_name` zeigt für keinen der 5 Slugs einen
  Umbrella-String (= Sanity-Check, sollte trivial grün sein, da
  `resolveLocation('Imperium').id === null`). Slug-Auswahl macht Codex aus
  den 14+6-Empirie-Listen.
- [ ] Verifikations-Commands grün: `npm run lint`, `npm run typecheck`,
  `npm run test:resolver`, `npm run test:resolver-coverage`,
  `npm run test:apply-override-dry`, `npm run brain:lint -- --no-write`.
- [ ] Closing-Report `sessions/2026-05-DD-084-impl-locations-axis-hygiene.md`
  geschrieben mit Counts-Delta-Tabelle, Audit-Bucket-Stichprobe (zeigen, wie
  viele Bücher den `locationsSkippedRedundant`-Bucket tragen + welche
  Surface-Forms am häufigsten skipped wurden), For-next-session-Items.

## Open questions

- **Sind 13 Initial-Einträge in `redundantSurfaceForms` zu schmal oder zu
  breit?** Pre-Apply-Empirie (per `jq` über
  `manual-overrides-ssot-w40k-{NNN}.json`): die Liste deckt heute genau
  20× `Imperium` ab, davon 14 Skip-Pfad + 6 Erhaltungs-Pfad. Die 12 anderen
  Einträge (`Imperium of Man`, `Imperium of Mankind`, `the Imperium`,
  `Chaos`, `Chaos Space`, `the Chaos Space`, `Realm of Chaos`, `the Warp`,
  `Warp Space`, `Xenos`, `Aliens`, `Alien Space`) sind heute leer-belegt —
  Forward-Discipline-Vorrat. Codex prüft im Closing-Report, ob die
  Empirie-Zahlen die 14/6/0-Erwartung treffen, und flagged Abweichungen:
  wenn z. B. `Chaos Space` heute auch belegt ist (Codex hat das nicht
  gesehen, aber `jq`-Pre-Apply-Probe würde es sichtbar machen), wandert
  das in die Tabelle der Effekt-Bullet-Acceptance. Zusatz-Vorschläge wie
  `Subsector Aurelia` als unresolved Location → in den Closing-Report als
  Folge-Vorschlag, NICHT eigenmächtig zur Liste hinzufügen (= Maintainer-
  Pflege).
- **Validation-Throw-Bedingung „Skip-Eintrag resolvable" — false positive
  möglich?** Wenn z. B. `Chaos` in `redundantSurfaceForms` steht und es eine
  künftige `chaos`-Location-Row geben sollte (z. B. wenn jemand Chaos-Realm-
  Special-Locations als geographische Sub-Locations modelliert), würde die
  Startup-Validation feuern. Cowork-Intuition: das ist *gewollt* — der
  Maintainer soll mit Absicht zwischen „Surface-Form ist Umbrella" und
  „Surface-Form ist echte Location" entscheiden. Codex bestätigt im Report,
  ob die Startup-Validation für die initiale 13er-Liste sauber gegen die
  aktuellen `locations.json`-IDs läuft.
- **HH-Domain-Forward-Behavior als ADR-Sektion oder als Revisit-Trigger?**
  Cowork tendiert zu Revisit-Trigger (= „beim ersten HH-File-Import den
  Allowlist-Pfad gegen pre-Heresy Loyalist-Cabal-Doppelnatur testen"), weil
  HH heute nicht aktiv ist. Codex kann im ADR-Entwurf eine schlankere oder
  eine reichhaltigere Sektion vorschlagen.
- **`location-policy.json` Top-Level-`browseRoots`/`tree-Roots`-Sektion
  parallel zu `faction-policy.json`?** Cowork-Position: nein, weil
  Locations-Domain heute keine UI-Browse-Root-Trennung braucht (Map-Filter
  kommt später als eigener Brief). Codex bestätigt oder widerspricht im
  Report.

## Notes

### Branch-Konvention (per Brief 082 Worktree-Disziplin)

Brief 084 ist Batch/Ingestion-Strang (Apply-Layer + Resolver-Reference +
Loop-Trigger-Heredoc). Korrekte Worktree-/Branch-Form:

```bash
cd /c/Users/Phil/chrono-lexicanum-batches
git switch -c codex/ingest-batches-locations-axis-hygiene
# Implementation, Tests, Re-Apply, Smoke, Closing-Report
git push -u origin codex/ingest-batches-locations-axis-hygiene
gh pr create --base main --head codex/ingest-batches-locations-axis-hygiene
```

Branch-Erzeugung pro `worktree/batches-bootstrap`-Konvention aus Brief 082
§ Parallel worktrees. Brief 081-Branch (`codex/ingest-batches-synopsis-005-019`)
sollte vor 084-Start gepusht + gemerged sein, sonst läuft 084-Branch gegen
einen veralteten `main` (geringes Konflikt-Risiko, aber sauberer wenn 081
zuerst gemerged ist).

### Form-Vorlage für die Skip-Helper-File

Illustrativ, basierend auf `scripts/apply-override-skip.ts` (Brief 077):

```ts
// scripts/apply-override-location-skip.ts (Skeleton, kein vollständiger Code)
import type { LocationPolicy } from "./seed-data/types";

export type LocationSkipDecision = {
  keepSurfaceForms: Array<{ name: string }>;
  skippedSurfaceForms: string[];
};

export function decideLocationSkips(input: {
  surfaceForms: ReadonlyArray<{ name: string }>;
  redundantSurfaceForms: ReadonlySet<string>;
  resolvedLocationIds: ReadonlyArray<string>;
}): LocationSkipDecision { /* … */ }

export function loadLocationSkipContext(policyPath: string, locationsPath: string): {
  redundantSurfaceForms: ReadonlySet<string>;
} { /* … */ }
```

Die genaue Form macht Codex — DI-Signatur als harte Anforderung, alles
andere ist Stil.

### Form-Vorlage für den ADR

Illustrativ. Komplett-Form macht Codex (analog `faction-policy.md`):

```markdown
---
title: "Locations-Policy + Umbrella-Surface-Form-Skip"
type: decision
created: 2026-05-19
updated: 2026-05-19
decision-date: 2026-05-19
sources:
  - ../../../sessions/2026-05-19-084-arch-locations-axis-hygiene.md
  - ../../../sessions/2026-05-DD-084-impl-locations-axis-hygiene.md
  - ../../../scripts/seed-data/location-policy.json
  - ../../../scripts/apply-override-location-skip.ts
related:
  - ./faction-policy.md
confidence: high
---

# Locations-Policy + Umbrella-Surface-Form-Skip

## Context
<warum dieser Brief, was war das Problem>

## Decision
<Allowlist + Erhaltungs-Pfad>

## Why
<warum nicht Tree-Membership / nicht Resolver-Logik>

## Revisit-Triggers
<HH-Domain-Import, falsche-Positive im Audit-Bucket >5 Bücher, neue Umbrella-
Surface-Forms im Coverage-Output >3× …>
```

### Per-Iteration-Verifikation während des Re-Apply

Pro `ssot-w40k-{NNN}`-Batch beim 20er-Re-Apply:

```bash
npm run db:apply-override -- --batch=ssot-w40k-001
# … usw. bis ssot-w40k-020
```

Pre/Post-Spot-Check mindestens für drei Bücher mit bekanntem
`Imperium`-as-Location-Tag (sucht Codex per `jq` über
`scripts/seed-data/manual-overrides-ssot-w40k-*.json`).

### Coordination-Worktree-Hinweis

Der Main-Worktree (`C:\Users\Phil\chrono-lexicanum`) hat aktuell ~150
modifizierte Files (rein Line-Ending-Symmetrie, `203 files / 134004 / 134004`).
Brief 084 wird im Batches-Worktree (`chrono-lexicanum-batches`) gefahren —
dort ist der State clean. Wenn Codex versehentlich im Main-Worktree landet
(Worktree-Wechsel vergessen), erst `git status` prüfen, dann `git switch` in
den richtigen Worktree.
