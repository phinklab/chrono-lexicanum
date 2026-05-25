---
title: Locations-Policy + Umbrella-Surface-Form-Skip
type: decision
created: 2026-05-19
updated: 2026-05-19
sources:
  - ../../../sessions/archive/2026-05/2026-05-19-084-arch-locations-axis-hygiene.md
  - ../../../sessions/archive/2026-05/2026-05-19-084-impl-locations-axis-hygiene.md
  - ../../../scripts/seed-data/location-policy.json
  - ../../../scripts/seed-data/locations.json
  - ../../../scripts/seed-data/location-aliases.json
  - ../../../scripts/apply-override.ts
  - ../../../scripts/apply-override-location-skip.ts
related:
  - ./faction-policy.md
  - ../glossary.md
  - ../project-state.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-19
---

# Locations-Policy + Umbrella-Surface-Form-Skip

**Status:** active · **Decided:** 2026-05-19 · **Sessions:** [084-arch](../../../sessions/archive/2026-05/2026-05-19-084-arch-locations-axis-hygiene.md) · [084-impl](../../../sessions/archive/2026-05/2026-05-19-084-impl-locations-axis-hygiene.md)

## Context

Brief 077 (`faction-policy.md` § Grand-Alignment-Junction-Skip) hat die Faction-Achse von redundanten Grand-Alignment-Junctions befreit — `imperium`/`chaos` flogen aus `work_factions`, wenn im selben Block eine alignment-gleiche Sub-Faction stand. Der For-next-session-Punkt 1 des 077-impl-Reports hat dabei das **Locations-Pendant** geflaggt: `test:resolver-coverage` zeigt `Imperium x20` als unresolved Location. Bücher tagen `Imperium` (und potenziell `Chaos`, `the Warp`, `Xenos`) als Filter-Surface auch auf der Locations-Achse, obwohl keiner dieser Strings einen physischen Ort beschreibt.

Strukturell unterschied sich die Locations-Achse von der Faction-Achse in drei Punkten, die die Skip-Architektur diktiert haben:

1. **Locations haben kein `alignment`-Feld.** `locations.sector` ist physisch-quadrant (`solar` / `obscurus` / `ultima` / `pacificus` / `tempestus` / `imperium_nihilus`), nicht politisch. Eine 077-style Tree-/Alignment-Membership-Bedingung („skip `Imperium`, wenn andere imperial-aligned Location vorhanden") braucht eine Klassifikation, die im Schema nicht existiert.
2. **Umbrella-Surface-Forms haben keine `locations.json`-Row.** `Imperium` resolved heute zu `null`, post-084 weiterhin zu `null`. Brief 084 berührt damit *keine* `work_locations`-Junction (Junction-Count bleibt invariant bei 417); er ist ein **Notes-Bucket-Umsortierungs-Pass**: Surface-Forms wandern von `locationsUnresolved` nach neuem `locationsSkippedRedundant`.
3. **Location-Policy existierte heute nicht.** `scripts/seed-data/` hatte `locations.json` + `location-aliases.json`, aber kein `location-policy.json`-Pendant.

Empirie zum Implementations-Zeitpunkt: 20 Bücher tagen `Imperium` als Location, davon 14 mit mindestens einer anderen resolved Location im Block (Skip-Pfad), 6 mit `Imperium` als alleinigem Tag (Erhaltungs-Pfad / Galaxy-Wide-Survey). Die anderen 12 Initial-Skip-Strings (`Chaos`, `Chaos Space`, `Realm of Chaos`, `the Warp`, `Warp Space`, `Xenos`, …) sind im aktuellen Korpus 0× belegt — Forward-Discipline-Vorrat für den Loop ab `ssot-w40k-021`.

Maintainer-Architektur-Wahl (per AskUserQuestion 2026-05-19): **„Broad in der Absicht, explizit in der Liste."** Keine automatische Tree-/Sektor-Politik-Membership-Regel, weil sonst echte Orte unter einem Umbrella versehentlich rausfallen könnten. Plus Audit-Bucket für geskipptes Material, damit aggressive Liste sofort sichtbar wird.

## Decision

**Allowlist-basierter Skip auf der Locations-Achse mit Erhaltungs-Pfad.** Die Skip-Liste ist eine maintainer-pflegbare JSON-Liste von Surface-Form-Strings (`scripts/seed-data/location-policy.json` → `redundantSurfaceForms`). Apply-Layer-Helper `decideLocationSkips()` (`scripts/apply-override-location-skip.ts`) entscheidet pro Override-Block, ob Umbrella-Surface-Forms in `locationsUnresolved` bleiben oder in einen neuen Audit-Bucket `locationsSkippedRedundant` umgeleitet werden.

### Skip-Liste (Initial, 2026-05-19)

`scripts/seed-data/location-policy.json` → `redundantSurfaceForms`:

```
Imperium, Imperium of Man, Imperium of Mankind, the Imperium,
Chaos, Chaos Space, the Chaos Space, Realm of Chaos,
the Warp, Warp Space,
Xenos, Aliens, Alien Space
```

Drei semantische Cluster:

- **Reich-Klasse Imperium** (`Imperium` + drei Varianten) — politisch, kein Ort.
- **Chaos-Realm** (`Chaos` + drei Varianten, `Realm of Chaos`) — kein physischer Ort. `Eye of Terror` ist explizit NICHT auf der Liste, weil es eine reale `locations.json`-Row (`id=eye_of_terror`, sector=`obscurus`, gx=330/gy=120) ist.
- **Warp** (`the Warp`, `Warp Space`) — kein Ort im Sinne der `locations.json` (kein `gx`/`gy`).
- **Generic Xenos** (`Xenos`, `Aliens`, `Alien Space`) — kein Ort; konkrete Xenos-Territorien (`T'au Empire`, `Octarius`, `Vigilus`, …) sind eigene Rows.

`specialCases` führt zwei Erläuterungs-Notes:

- `"the Warp / Warp Space"` — Begründung, warum Warp nicht im Sinne der `locations.json` ein Ort ist.
- `"Eye of Terror exklusiv"` — explizite Abgrenzung: Eye of Terror ist real, `Realm of Chaos` ist Umbrella. Wenn ein Buch beide tagged: Eye of Terror → Junction, Realm of Chaos → Skip-Bucket.

Die Liste ist **maintainer-pflegbar**: erweitern / kürzen ohne Code-Touch. CI-Lint (`brain:lint`) prüft nicht die Inhalte; das ist Maintainer-Domain.

### Skip-Bedingung (zwei Punkte, beide müssen halten)

1. Die Surface-Form steht in `redundantSurfaceForms` (case-insensitive, nach `trim`).
2. Im selben Override-Block ist mindestens **eine andere Location** zu einer `locations.json`-Row resolved (`!== null`).

Erfüllen beide → Surface-Form landet im `locationsSkippedRedundant`-Bucket; **nicht** mehr im `locationsUnresolved`-Bucket (`buildSurfaceFormsBlock` filtert explizit, kein Doppel-Vorkommen). Erhaltungs-Pfad: trägt das Buch nur den Umbrella-String (keine andere resolved Location), bleibt die Surface-Form als unresolved Audit-Note stehen — Galaxy-Wide-Survey- / lore-only-Standalone-Fall.

### Audit-Bucket-Form

Bare-String-Array, analog zu `factionsSkippedRedundant` aus Brief 077, nur wenn non-empty geschrieben:

```json
{
  "factionsUnresolved": [],
  "locationsUnresolved": [],
  "charactersUnresolved": [],
  "flags": [],
  "locationsSkippedRedundant": ["Imperium"]
}
```

### Startup-Validation

`loadLocationSkipContext()` (`scripts/apply-override.ts`) lädt `location-policy.json` einmalig beim Apply-Run-Start. Wirft hart, wenn:

- (a) JSON nicht parsbar.
- (b) `redundantSurfaceForms` fehlt oder kein Array ist.
- (c) Ein Eintrag in `redundantSurfaceForms` case-insensitive zu einer existierenden `locations.json`-Row-Name oder `location-aliases.json`-Key matched (= Self-Foot-Shooting-Check: jemand hat eine echte Location auf die Skip-Liste gesetzt).

Validation läuft einmal pro Process; danach DI-injektiert in `applyBook`.

### Pure-DI-Helper (Architektur-Form)

`scripts/apply-override-location-skip.ts` exportiert:

```ts
export function decideLocationSkips(input: {
  surfaceForms: ReadonlyArray<{ name: string; role: string }>;
  redundantSurfaceForms: ReadonlySet<string>;     // lowercased + trimmed
  resolvedLocationIds: ReadonlyArray<string>;     // resolveLocations-Output, nur !== null
}): {
  keepSurfaceForms: Array<{ name: string; role: string }>;
  skippedSurfaceForms: string[];
};
```

Keine DB, kein FS zur Call-Time. Strukturell parallel zu `decideFactionSkips()`, aber surface-form-zentriert (nicht ID-zentriert): die zu skippenden Umbrellas resolven zu `null`, es gibt keine ID, die als Skip-Key dienen könnte.

### Re-Apply-Backfill

`ssot-w40k-001..020` werden re-applied (`npm run db:apply-override -- --batch=ssot-w40k-{NNN}` × 20). Apply-Layer macht DELETE-then-INSERT pro Buch für `book_details.notes`. Erwartete Effekt-Tabelle (Brief 084 § Acceptance, verifiziert im Closing-Report):

| Metrik | Pre-084 | Post-084 | Anmerkung |
|---|---:|---:|---|
| Bücher mit `Imperium` in `locationsUnresolved` | 20 | 6 | Erhaltungs-Pfad |
| Bücher mit `Imperium` in `locationsSkippedRedundant` | 0 | 14 | Skip-Pfad |
| `work_locations` (Junction-Count) | 417 | 417 | invariant — Skip greift nicht auf Junction-Schreibung |
| Doppel-Vorkommen `Imperium` in beiden Buckets | n/a | 0 | `buildSurfaceFormsBlock`-Exclusion-Regel |

### Forward-Discipline

Loop-Brief 061 trägt einen `Locations-Granularity-Discipline`-Block ab `ssot-w40k-021`, der die Umbrella-Surface-Forms in `overrides.locations[]` schon beim LLM-Authoring verhindert. `scripts/run-ssot-loop.sh` reicht die Discipline an jede Loop-Subsession durch — Apply-Layer-Skip ist Safety-Net, Loop-Discipline ist Source-of-Authority.

## Why

### Warum Allowlist statt Tree-Membership

Sektor-Klassen (`solar` / `obscurus` / `ultima` / `pacificus` / `tempestus` / `imperium_nihilus`) sind **physisch**, nicht politisch. Eine 077-style Tree-Membership-Bedingung („skip `Imperium`, wenn imperiale Location vorhanden") braucht eine Klassifikation, die heute weder im Schema noch in den Daten existiert. Sie würde außerdem über echte Orte unter einem Umbrella mitfallen (z. B. Cadia-Location würde post-Verbalisierung-„imperial" mit dem Imperium-Umbrella in einen Topf landen) — das ist genau der False-Positive-Fall, den die Maintainer-Wahl ausgeschlossen hat.

Allowlist ist **explizit in der Liste, breit in der Absicht**: was drauf steht, wird geskippt; was nicht drauf steht, bleibt unangetastet. Maintainer-Hand entscheidet, kein Auto-Rollup-Algorithmus.

### Warum nicht im Resolver

Der Resolver bleibt **pure Surface-Form-zu-ID**: `resolveLocation('Imperium').id === null` heute und post-084. Ob eine `null`-Auflösung in `locationsUnresolved` oder `locationsSkippedRedundant` landet, ist **Block-Context-Information** (gibt es eine andere resolved Location?), nicht Surface-Form-Wissen. Der Resolver kennt den Block nicht. Skip ist deshalb Apply-Layer-Concern, parallel zur Brief-077-Architektur.

### Warum Surface-Form-zentriert (nicht ID-zentriert)

Auf der Faction-Achse hat `decideFactionSkips()` mit IDs gearbeitet, weil `Imperium of Man` zu `imperium` resolved und damit eine echte `work_factions`-Junction-Row geschrieben hat (die geskippt werden musste). Auf der Locations-Achse resolven Umbrellas zu `null` — es gibt keine ID. Der Skip-Key ist deshalb der **Surface-Form-String selbst** (case-insensitive, trim-normalisiert). Konsequenz für die Audit-Bucket-Form: bare-string-Array (`["Imperium"]`), nicht ID-Liste.

### Warum Audit-Bucket statt stilles Wegwerfen

Maintainer-Wahl: „Audit-Ausgabe für geskipptes Location-Material, damit wir sehen, ob die Liste zu aggressiv ist." Wenn `redundantSurfaceForms` in Zukunft einen Eintrag aufnimmt, der real-canonical wäre (z. B. wenn jemand `Chaos` als geographische Sub-Location modelliert), würde das im Cockpit `/buch/<slug>/audit` sofort als „diesen Surface-Form sehen wir oft skipped, ist die Skip-Bedingung gewollt?" sichtbar.

### Warum `work_locations` invariant bleibt

Brief 084 berührt nur den Notes-Bucket. `applyLocations` schreibt heute ausschließlich Junction-Rows für `resolveLocation(name).id !== null`-Surface-Forms — Umbrellas wurden also schon vor 084 nie zu Junctions. Der Skip greift damit nicht auf Junction-Schreibung; er klassifiziert die unresolved-Restmenge in zwei Audit-Buckets: „echte unresolved Location, vielleicht ein Lookup-Fehler" vs. „bewusst geskippt, Umbrella per Policy". `work_locations` bleibt bei 417.

## Revisit-Triggers

- **HH-Domain-Forward-Behavior.** Beim ersten Heresy-File-Import den Allowlist-Pfad gegen Pre-Heresy-Loyalist-Cabal-Doppelnatur testen. Pre-Heresy-Bücher tagen typisch Blocks wie `["Terra", "Imperium"]` (Terra als Throneworld-Location + Imperium als Reich-Klassifikation). Brief-084-Allowlist verhält sich hier korrekt (Terra → Junction, Imperium → Skip-Bucket), aber falls die HH-Empirie Sonderfälle zeigt (z. B. Pre-Heresy `Word Bearers` ist „imperial-aligned" lore-aber-nicht-junction), Allowlist überprüfen und ggf. erweitern.

- **Audit-Bucket False-Positives ≥ 5 Bücher.** Wenn `db-counts-084.ts` zeigt, dass ein Eintrag der Skip-Liste in ≥ 5 Büchern auftaucht, obwohl die Bücher real-spezifisch über den Ort sprechen (= der String wurde versehentlich als Umbrella klassifiziert), Eintrag aus `redundantSurfaceForms` entfernen.

- **Neue Umbrella-Surface-Forms im Coverage-Output ≥ 3×.** Wenn `test:resolver-coverage` zeigt, dass ein bisher nicht gelisteter Surface-Form-String (z. B. `Segmentum Solar`, `Segmentum Obscurus`) ≥ 3× als unresolved Location auftaucht — entweder zur Skip-Liste hinzufügen (wenn lore-konzeptuell Umbrella) oder als echte `locations.json`-Row anlegen (wenn lore-konzeptuell Sektor).

- **UI-Map-Filter-Phase startet.** Cartographer / Map-View braucht hierarchische Location-Filter (Sektor → Sub-Sektor → Welt). Das ist ein eigener Brief später (separate ADR-Entscheidung). Dann ggf. `browseRoots`-Sektion zu `location-policy.json` hinzufügen — bewusst aus Brief 084 ausgelassen.

- **Künftige Eldar-/Tau-Sub-Subdivisions auf der Locations-Achse.** Wenn z. B. Drukhari-Reich-Locations (`Commorragh`, `Webway`) zu Sub-Welten mit eigenen Rows ausgegliedert werden und der Resolver Drukhari-Lore-Tags wie `the Dark City` als Umbrella sieht — Allowlist + Erhaltungs-Pfad gegen die neue Granularität testen.

- **`book_details.notes`-Format-Migration.** Wenn der `---surfaceForms---`-Block-Aufbau strukturell überarbeitet wird (Schlüssel-Renames, JSON-Schema-Validierung), `locationsSkippedRedundant` parallel zu `factionsSkippedRedundant` migrieren.

## Was wir bewusst NICHT entscheiden

- **`browseRoots` / `tree-Roots`-Sektion in `location-policy.json`.** Cowork-Position (offene Question 4 aus Brief 084): nein, weil Locations-Domain heute keine UI-Browse-Root-Trennung braucht. UI-Map-Filter-Phase bekommt einen eigenen Brief, der das Konzept dann von Grund auf entscheidet.

- **Sektor-Politik-Klassifikation als „imperial" / „chaos" / „xenos".** AskUserQuestion-Antwort (2026-05-19) hat explizit Tree-Membership ausgeschlossen. Sektoren bleiben physisch.

- **Resolver-Logik-Touch.** `src/lib/resolver/index.ts` `resolveLocation` bleibt unverändert. Pure Surface-Form-zu-ID. Skip ist Apply-Layer.

- **`location-aliases.json`-Edits.** Aliases sind eine Resolver-Wahrheit (`Dark City` → `commorragh`). Bleiben Maintainer-Pflege.

- **Faction-Achse.** Brief 077 ist closed; keine Re-Edits an `apply-override-skip.ts` / `faction-policy.json` / `factionsSkippedRedundant`.

- **Schema-Migration.** `work_locations` bleibt unverändert, `book_details.notes` ist schon da, neuer Bucket lebt im JSON-Inhalt.

## Aftermath

Brief 084 (2026-05-19) implementiert:

- `scripts/seed-data/location-policy.json` neu mit 13 `redundantSurfaceForms` + 2 `specialCases`.
- `scripts/apply-override-location-skip.ts` als pure DI-Helper (`decideLocationSkips()`).
- `scripts/apply-override.ts` reordered: `resolveLocations()` → `decideLocationSkips()` → `buildSurfaceFormsBlock()` mit neuem `skippedLocationSurfaceForms`-Parameter. Plus `loadLocationSkipContext()` mit 3-Throw-Bedingungs-Startup-Validation.
- `scripts/apply-override-dry.ts` simuliert Skip; Dry-Run-Output matcht DB-Realität.
- `scripts/test-resolver.ts` um 4 `decideLocationSkips`-Cases erweitert.
- `scripts/test-resolver-coverage.ts` neuer Tail `(post-Brief-084-skip, M location umbrella surface forms suppressed)`.
- `scripts/db-counts-084.ts` Helper-Skript für Pre/Post-Counts-Verifikation.
- `scripts/smoke-locations-084.ts` Smoke-Probe (3 Skip- + 2 Erhaltungs-Slugs).
- `sessions/2026-05-11-061-arch-ssot-loop.md` neuer `Locations-Granularity-Discipline`-Block.
- `scripts/run-ssot-loop.sh` `base_trigger`-Heredoc erweitert.
- Re-Apply `ssot-w40k-001..020` (Backfill, Notes-Bucket-Umsortierung).
