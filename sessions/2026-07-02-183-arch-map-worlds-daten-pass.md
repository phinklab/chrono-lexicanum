---
session: 2026-07-02-183
role: architect
date: 2026-07-02
status: implemented
slug: map-worlds-daten-pass
parent: 2026-07-02-174
links: [2026-07-02-174, 2026-06-03-122]
commits: []
---

# P14 Teil A.2 — Map-Katalog Daten-Pass: Kurations-Excel, Rollups, Hand-Pins, Typ-Gruppen (Batches)

## Goal

Die Medien-Abdeckung des Map-Katalogs von 46 % auf ~71 % der Werk-Kanten heben und den Katalog UI-fertig für Brief 178 machen: Hand-Kuration wandert in eine committete Kurations-Excel (Philipps Arbeitsformat, ein Ort, nachvollziehbar), eine Rollup-Mechanik im Convert, `kind`-Typ-Gruppen für Icons/Farben/Filter, plus verbatim mitgelieferte Kurations-Daten.

## Context

Impl-Report [174](./2026-07-02-174-impl-map-ssot-reconciliation.md): 87/992 Excel-Welten matchen, 363 Medien-Locations ohne Pin (907 von 1685 Werk-Kanten). Cowork-Analyse + Philipp-Entscheide (2026-07-02, zwei Runden):

- **Fuzzy-Matching ist tot.** Saubere Normalisierung (Apostrophe entfernen, Bindestrich=Leerzeichen, „The" strippen) bringt exakt 2 von 363 Treffern (Dal'yth, The Black Library). Die Excel enthält die fehlenden Orte schlicht nicht — statt Fuzzy gibt es explizite Hand-Links (§ Daten A).
- Die 363 zerfallen in: Unterorte gematchter Welten (Imperial Palace→Terra), Namens-Varianten existierender Excel-Welten (T'au Empire↔„T'au"), echte fehlende Planeten (Istvaan V), Regionen (Sabbat Worlds) und Orte ohne Punkt-Position (Webway, Great Rift).
- **Excel = SSOT, nichts wird limitiert** (Philipp, 2. Runde): alle 992 Elemente — auch Flotten, Webway-Tore, Warp-Stürme, Blackstone Fortresses — bleiben im Katalog und sollen in 178 anzeigbar/filterbar sein. Es gibt KEINE Ausschluss-Liste; nicht verortbare Medien-Locations bleiben offen in der Worklist.
- Die Excel hat **keine Beschreibungs-Spalte** (Spalten: Name, Primary/Secondary/Tertiary Classification, Koordinaten, Segmentum). Beschreibungen kommen weiterhin nur aus unserem Bestand via `locationId` — kein neues Feld nötig, 178 löst das über den Link.
- Philipp-Entscheide: Kurations-Excel als Convert-Input (löst die JSON-Overrides ab); ~10 kuratierte `kind`-Gruppen im Daten-Pass; dieser Pass läuft **vor** 178; Cowork liefert Koordinaten-Vorschläge, Philipp reviewt im PR.

Relevante Files: `scripts/map-worlds-core.ts`, `scripts/import-map-worlds.ts`, `scripts/seed-data/map-worlds.overrides.json` (wird abgelöst), `src/lib/map/map-worlds-schema.ts`, `scripts/test-map-worlds.ts`, `scripts/seed-data/source/Warhammer_map_SSOT.xlsx`.

## Scope

**1. Kurations-Excel als Hand-Eingabe.** Neue committete Datei `scripts/seed-data/source/map-worlds-curation.xlsx`, gelesen vom Convert (gleicher `read-excel-file`-Pfad wie die SSOT-Excel, fail-loud). Ersetzt `map-worlds.overrides.json` vollständig (Datei entfernen; `doc`-Wissen wandert in die Review-md-Kopfzeile oder ein README-Snippet — euer Call).

- **Sheet „Kuration"** (media-keyed, eine Zeile pro Medien-Location ohne Match): Spalten `locationId | Name | Bücher | Episoden | Aktion | Ziel | gx | gy | Segmentum | Klassifikation | Notiz`. `Aktion` ∈ `link` (Excel-Welt existiert unter anderem Namen → deren `locationId` setzen; `Ziel` = Welt-ID), `rollup` (Werke an Ziel-Welt hängen; `Ziel` = Welt-ID), `pin` (neue Welt anlegen; `gx`/`gy`/`Segmentum`/`Klassifikation` Pflicht), leer/`später` (offen). CC befüllt initial ALLE 363 Zeilen, absteigend nach Werk-Zahl, mit den 44 Entscheidungen aus § Daten vorausgefüllt (inkl. Notiz-Spalte mit Konfidenz/Anker verbatim).
- **Sheet „Welten"** (world-keyed, initial leer): Spalten `Welt-ID | locationId-Override | Notiz` — für Dubletten-Entkopplung u. ä. (übernimmt die `worldOverrides`-Restfunktion).
- Fail-loud: unbekannte `locationId`/Ziel-Welt, `pin` ohne gx/gy, Aktion auf bereits gematchte Location, Rollup-Ketten, doppelte Zeilen, gx/gy außerhalb des Grids.
- Der Convert liest die Excel nur (read-only Input wie die SSOT-Excel); Determinismus/Idempotenz unverändert.

**2. Rollup-Mechanik.** `rollup`-Zeilen hängen die Werke der Quell-Location ans `works`-Array der Ziel-Welt (Excel- ODER `pin`-Welt; Merge-Reihenfolge: erst Pins, dann Rollups). Dedup pro `{type, slug}`, bei Rollen-Konflikt gewinnt die stärkere (primary>secondary>mentioned bzw. subject>mentioned). Gerollte Werke tragen `via: <locationId>`, damit 178 Herkunft anzeigen kann. Bei Ziel-Namen mit mehreren Pins (Dubletten): an alle Instanzen, konsistent zum Matcher.

**3. `kind`-Typ-Gruppen.** Jede Katalog-Welt bekommt `kind` aus der verbatim-Tabelle § Daten D (alle 70 Primary-Classification-Werte → 11 Gruppen; `pin`-Zeilen vom Typ Region → `region` als 12.). Rohe `classification` bleibt erhalten; zusätzlich `classification2` (Secondary, 172 Zeilen belegt) als optionales Feld aufnehmen. Schema `map-worlds-v1` → Bump nach eurem Ermessen (`kind`, `classification2`, `via`, `origin` unverändert). **Für 178:** Icons/Farben/Filter hängen an `kind` — reine Design-Sache; Daten-Kontrakt hier ist nur das Feld selbst. Erwarteter Default-Filter dort: „Welten mit Lore" (`works.length > 0`), aber alle 992+ Elemente müssen anzeigbar bleiben.

**4. Review-Report.** Worklist §2 = nur noch Zeilen ohne Aktion, absteigend nach Werk-Zahl (Impl-174-Empfehlung); neue Sektion „Angewandte Kuration" (Links/Rollups/Pins mit Quelle→Ziel und Werk-Zahl); Abdeckungs-Kennzahl (platzierte/gesamt Werk-Kanten) im Kopf.

## Daten (verbatim in die Kurations-Excel)

### A. `link` — Excel-Welt existiert unter anderem Namen (4)

| locationId | Ziel (Welt-ID) | Werke | Notiz |
|---|---|---:|---|
| `tau_empire` | `tau` | 13 | T'au = Hauptwelt des Empire |
| `dalyth` | `dalyth` | 3 | Apostroph-Variante „Dal'yth" |
| `beta_garmon` | `beta-garmon-iv` | 3 | Beta-Garmon-System, IV = Hauptschauplatz |
| `black_library_place` | `the-black-library` | 4 | identisches Objekt |

### B. `rollup` (20)

| locationId | Ziel | Werke | Notiz |
|---|---|---:|---|
| `imperial_palace` | `terra` | 32 | Palast auf Terra |
| `lions_gate_spaceport` | `terra` | 3 | auf Terra |
| `sol_system` | `terra` | 12 | Sol = ein Punkt auf der Galaxiekarte |
| `luna` | `terra` | 8 | Sol-System |
| `pluto` | `terra` | 4 | Sol-System |
| `hive_primus` | `necromunda` | 20 | Hive auf Necromunda |
| `underhive` | `necromunda` | 20 | dito |
| `spire` | `necromunda` | 5 | ⚠ prüfen: falls „The Spire"-Bücher nicht Necromunda-Korpus sind, Aktion leer lassen + im Report vermerken |
| `fang` | `fenris` | 13 | Festung auf Fenris |
| `asaheim` | `fenris` | 3 | Kontinent auf Fenris |
| `ultramar` | `macragge` | 39 | Reich → Hauptwelt |
| `tizca` | `prospero` | 5 | Stadt auf Prospero |
| `monarchia` | `khur` | 4 | Stadt auf Khur |
| `ullanor` | `armageddon` | 13 | gleiche Welt (verlegt/umbenannt, War of the Beast) |
| `medrengard` | `eye_of_terror` | 8 | Daemon-Welt im Eye |
| `planet_of_the_sorcerers` | `prospero` | 8 | seit 999.M41 über Prospero (Wrath of Magnus); Alternative `eye_of_terror` — Philipp entscheidet im Review |
| `vengeful_spirit` | `eye_of_terror` | 7 | Abaddons Flaggschiff, M41/42-Basis Eye (Philipp 2026-07-02: Schiffe mitnehmen) |
| `eltath` | `urdesh` | 3 | Stadt auf Urdesh |
| `helican` | `gudrun` (Pin aus C) | 4 | Gudrun = Hauptwelt des Helican-Subsektors |
| `varangantua` | `alecto` (Pin aus C) | 11 | Stadt auf Alecto |

### C. `pin` — neue Welten (20; gx/gy = Vorschlag, Grid 0–1000 / 0–808.6; Philipp verschiebt im Review)

| locationId | Name | gx | gy | Segmentum | Typ | Notiz (Konfidenz / Anker) |
|---|---|---:|---:|---|---|---|
| `istvaan_v` | Istvaan V | 490 | 155 | Ultima | Welt | mittel-niedrig; Kanon variiert — weit galaktisch Nord, Band Caliban(282/172)–Valhalla(598/180) |
| `istvaan_iii` | Istvaan III | 496 | 161 | Ultima | Welt | dito, gleiches System |
| `sotha` | Sotha | 920 | 668 | Ultima | Welt | mittel; Ostrand, Teil Ultramars — Anker Macragge(877/676) |
| `iax` | Iax | 897 | 650 | Ultima | Welt | mittel; Ultramar — zwischen Calth(910/632) und Macragge |
| `nostramo` | Nostramo | 790 | 165 | Ultima | Welt | niedrig-mittel; „Rand Ultima, nahe Ghoul Stars" — Anker Valhalla/Baal(673/228) |
| `tsagualsa` | Tsagualsa | 925 | 470 | Ultima | Welt | niedrig; Eastern Fringe (Thramas) |
| `cryptus` | Cryptus-System | 700 | 243 | Ultima | Welt | mittel; Schildsystem Baals (Red Scar) |
| `alecto` | Alecto | 420 | 640 | Tempestus | Welt | niedrig; kanonisch nur „Segmentum Tempestus" — Philipp frei |
| `ulthwe` | Ulthwé | 245 | 210 | Obscurus | Welt | niedrig-mittel; Craftworld nahe Eye of Terror(260/232); Klassifikation „Craftworld" |
| `sabbat` | Sabbat Worlds | 160 | 515 | Pacificus | Region | mittel; Tanith(173/531)/Verghast(148/528)-Cluster |
| `gereon` | Gereon | 185 | 540 | Pacificus | Welt | niedrig; im Sabbat-Cluster |
| `phantine` | Phantine | 140 | 545 | Pacificus | Welt | niedrig; im Sabbat-Cluster |
| `damocles_gulf` | Damocles Gulf | 845 | 550 | Ultima | Region | mittel; zwischen Imperium und T'au(870/562)/Dalyth(877/543) |
| `phaedra` | Phaedra | 890 | 585 | Ultima | Welt | niedrig; T'au-Grenzraum (Fire Caste / Dark Coil) |
| `scarus` | Scarus Sector | 235 | 110 | Obscurus | Region | mittel (relativ); Anker Eustis Majoris(228/101) — Redditor verortet den Eisenhorn-Raum dort |
| `gudrun` | Gudrun | 247 | 118 | Obscurus | Welt | mittel (relativ); Helican-Subsektor, Scarus |
| `sancour` | Sancour | 215 | 122 | Obscurus | Welt | niedrig; Angelus-Subsektor, Scarus |
| `mistral` | Mistral | 255 | 105 | Obscurus | Welt | niedrig; Helican-Subsektor |
| `gothic_sector` | Gothic Sector | 430 | 175 | Obscurus | Region | niedrig-mittel; Obscurus-Nord an der Ultima-Grenze |
| `ghoul_stars` | Ghoul Stars | 835 | 130 | Ultima | Region | niedrig; NO-Rand |

Welt-IDs für Pins deterministisch aus dem Namen wie beim Excel-Import; „Klassifikation"-Spalte: bei Typ Welt sinnvoller Bestandswert (z. B. „Unclassified", Ulthwé „Craftworld"), bei Typ Region → `kind: region`.

**Bewusst offen** (Aktion leer, bleiben in Worklist/Kurations-Excel): `webway` (15), `great_rift` (17), `imperium_nihilus` (13), `eastern_fringe` (5) — nicht in der Excel, keine Punkt-Position; Philipp entscheidet später (nichts wird ausgeschlossen). Ebenso der Rest-Tail (~315 Einträge, u. a. `pariah_nexus`, `sanctus_reach`, `tarsis_ultra`, `acheron`, `candleworld` … + der 1–2-Werke-Tail) — Position unklar/mehrdeutig, laufende Hand-Kuration.

### D. `kind`-Mapping (alle 70 Primary-Werte → 11 Gruppen + `region`)

| kind | Primary Classifications |
|---|---|
| `imperial` | Civilized World, Hive World, Industrial World, Agri World, Mining World, Feral World, Feudal World, Frontier World, Shrine World, Cardinal World, Cemetary World, Penal World, Quarry World, Anchor World, Ocean World, Forest World, Ice World, Frozen World, Gas Giant, Artificial World, Terra, Mars, War World, Death World, Severan Dominate World, Lion's Protectorate |
| `imperial-military` | Fortress World, Adeptus Astartes World, Imperial Knight World, Mechanicus Knight World, Forge World |
| `station` | Space Station, Research Station, Imperial Navy Base, Deathwatch Fortress, Custodes Watch Station, Segmentum Fortress, Inactive Blackstone Fortress, Active Blackstone Fortress |
| `fleet` | Adeptus Astartes Fleet, Imperial Fleet, Necron Warship |
| `chaos-warp` | Warp Storm, Daemon World, Tzeentch Daemon World, Nurgle Daemon World, Slaanesh Daemon World, Khorne Daemon World, Hell Forge, Fallen Knight World |
| `gate` | Webway Gate, Warp Gate |
| `aeldari` | Craftworld, Exodite World, Maiden World |
| `necron` | Necron Tomb World, Necron Crown World, Contra Empyric Nexus |
| `xenos` | Ork World, T'au Sept, T'au Aligned World, Firesight Enclave, Votann Hold World, Genestealer Infested, Xenos World |
| `dead` | Dead World, Destroyed World, Devoured World, Forbidden World |
| `unclassified` | Unclassified |
| `region` | (kein Excel-Wert — nur Kurations-Pins vom Typ Region) |

Unbekannter Classification-Wert beim Convert → fail-loud (neue Excel-Werte erfordern bewusste Zuordnung).

## Constraints

- Convert bleibt DB-frei, deterministisch, idempotent (zweiter Lauf → identische Bytes); Kurations-Excel ist read-only Input.
- Kein Fuzzy-/Normalisierungs-Matcher — alle Zuordnungen bleiben explizit kuratiert.
- **Keine Ausschluss-Mechanik, kein Element-Dropping** — alle 992 Excel-Elemente bleiben im Katalog; offene Medien-Locations bleiben sichtbar offen.
- `locations.json` / `location-aliases.json` / `sectors.json` / DB-Schema / `db:sync` / `src/db/**` unangetastet.
- Daten aus § Daten verbatim übernehmen; nichts nachrecherchieren. Widersprüche beim Eintragen (z. B. `spire`-Flag) → im Report vermerken statt selbst entscheiden.

## Out of scope

- Map-UI / Routen / Komponenten / Icon- und Farbwahl (Brief 178, Product-Strang — `kind` ist nur der Daten-Kontrakt).
- Neue Einträge in `location-aliases.json` oder neue Entities.
- Abarbeiten des restlichen Worklist-Tails.
- `brain/**`, `sessions/README.md` — bereits von Cowork nachgeführt; reiten in einem Koordinations-PR, NICHT im Batches-PR dieses Briefs (Rollup-Ownership, Brief 095).

## Acceptance

The session is done when:

- [ ] `npm run import:map-worlds` läuft grün; zweiter Lauf byte-identisch; `map-worlds.overrides.json` ist entfernt, `map-worlds-curation.xlsx` (363 Zeilen, 44 vorbefüllt, Sheet „Welten" leer) ist der Hand-Pfad.
- [ ] Katalog: 4 Links greifen, 20 Rollups hängen an ihren Ziel-Welten (mit `via`), 20 Pins existieren mit `origin: "override"`; **weiterhin 992+20 Elemente — nichts gedroppt**.
- [ ] Jede Katalog-Welt trägt `kind` (11 Gruppen + `region`), `classification` bleibt roh erhalten, `classification2` wo belegt; unbekannte Classification bricht den Convert.
- [ ] Review-Report: Worklist §2 sortiert nach Werk-Zahl, nur offene Zeilen (≈ 319); Sektion „Angewandte Kuration"; Abdeckung im Kopf: ~1200 von 1685 Werk-Kanten (~71 %).
- [ ] `test:map-worlds` erweitert: Excel-Kurations-Parsing + alle Fail-Guards, Rollup-Merge/Dedup/Rollen-Konflikt, `via`, `kind`-Mapping inkl. Unknown-Fail, Pin-über-Rollup-Reihenfolge; alles grün.
- [ ] `npm run typecheck`, `lint`, `check:eras`, `brain:lint -- --no-write` grün.

## Open questions

- Ist das Zeilen-Vorbefüllen aller 363 Locations in der Kurations-Excel beim Regenerieren stabil handhabbar (Convert liest nur; wer ergänzt neue Worklist-Zeilen in der Excel — Hand oder ein `--sync-curation`-Hilfsflag)? Empfehlung im Report abgeben.
- Lohnt ein `coverage`-Kennwert im Katalog-Header (platzierte/gesamt Kanten) für die 178-Anzeige „X Werke auf der Karte"?

## Notes

- OQ 16b/c (brain/wiki/open-questions.md): bewusst nicht berührt — kein Bezug zur Map.
- Koordinaten-Herkunft: Lexicanum/Fandom-Verortungen, übersetzt ins eingefrorene 174er-Grid über Excel-Anker-Welten (Isstvan-System, Nostramo „edge of Ultima, nahe Ghoul Stars", Sotha/Iax Eastern Fringe/Ultramar, Cryptus Schild Baals, Sortiarius seit 999.M41 über Prospero, Scarus = Eisenhorn-Raum, Alecto Segmentum Tempestus, Ullanor=Armageddon per War of the Beast, Vengeful Spirit = Abaddons Flaggschiff).
- Excel-Spaltenbefund (Cowork, 2026-07-02): Name, Primary/Secondary/Tertiary Classification, 2 Koordinaten-Spalten, Segmentum — **keine Beschreibungen**. Secondary auf 172, Tertiary auf nur 4 Zeilen belegt (Tertiary bewusst ignorieren).
