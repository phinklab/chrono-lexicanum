---
session: 2026-07-02-183
role: implementer
date: 2026-07-02
status: complete
slug: map-worlds-daten-pass
parent: 2026-07-02-183
links: [2026-07-02-183, 2026-07-02-174]
commits: []
---

# P14 Teil A.2 — Map-Katalog Daten-Pass: Kurations-Excel, Rollups, Hand-Pins, Typ-Gruppen (Batches)

## Summary

Die Kurations-Excel `scripts/seed-data/source/map-worlds-curation.xlsx` ersetzt `map-worlds.overrides.json` vollständig; alle 44 Brief-Entscheidungen (4 Links, 20 Rollups, 20 Pins) greifen. Katalog jetzt `map-worlds-v2`: **1012 Welten** (992 Excel + 20 Pins, nichts gedroppt), jede mit `kind` (11 Gruppen + `region`), **Abdeckung 1200 von 1685 Werk-Kanten (71,2 %)** — exakt die Brief-Prognose. Worklist: **319** offene Locations, absteigend nach Werk-Zahl. Convert zweifach gelaufen → byte-identisch; 44/44 Unit-Tests, alle 4 CI-Gates grün.

## What I did

- **`scripts/seed-data/source/map-worlds-curation.xlsx`** (neu, committed) — Sheet „Kuration“: 363 Zeilen (eine pro Medien-Location ohne Match), absteigend nach Werk-Zahl, 44 mit Aktion vorbefüllt (§ Daten verbatim inkl. Notiz-Spalte), die 4 bewusst-offenen (`webway`, `great_rift`, `imperium_nihilus`, `eastern_fringe`) mit Begründungs-Notiz; Sheet „Welten“ leer (nur Header). Initial erzeugt über ein Einmal-Skript (nicht committed, gelöscht); künftige Zeilen via `--sync-curation` (s. u.).
- **`src/lib/map/map-worlds-schema.ts`** — Bump auf `map-worlds-v2`: `kind` (12-Wert-Union `MAP_WORLD_KINDS`), `classification`/`classification2` flach (roher Primary/Secondary; Tertiary gedroppt — 4 Zeilen, Brief-Vorgabe), `via?` auf Werk-Einträgen (Rollup-Herkunft), `coverage`-Kopf (`placedWorkEdges`/`totalWorkEdges`). Validator entsprechend: Welt ohne `locationId` darf nur `via`-Werke tragen.
- **`scripts/map-worlds-core.ts`** — Overrides-Typen/-Validator raus; neu: `parseCurationSheet`/`parseWeltenSheet` (pure, Zell-Matrix-Ebene → im Test ohne xlsx prüfbar), `KIND_BY_CLASSIFICATION` (70 Werte → 11 Gruppen, verbatim § D; unbekannter/leerer Wert bricht), Kurations-Merge in `buildCatalog`: Welten-Overrides → Pins → Links → eigenes Matching → Rollups. Fail-Guards: unbekannte `locationId`/Ziel-Welt, Dubletten-Zeilen, Aktion auf bereits gematchte Location, Rollup-Ketten, gx/gy außerhalb Grid, unbekanntes Segmentum/Klassifikation, Link auf bereits gematchte/geforcte Ziel-Welt. Rollup-Dedup pro `{type, slug}`, stärkere Rolle gewinnt (primary>secondary>mentioned bzw. subject>mentioned), gerollte Einträge tragen `via`; Werk-Reihenfolge (Bücher vor Episoden, slug-sortiert) bleibt nach Merge erhalten. Kuration wirkt auf alle Same-Name-Instanzen (matcher-konsistent).
- **`scripts/import-map-worlds.ts`** — liest die Kurations-Excel (beide Sheets, fail-loud auf Header-Drift, Datei fehlt = harter Fehler); `--sync-curation` schreibt die Excel neu: bestehende Zeilen erhalten (Werte wie geparst, `später`-Marker via `actionRaw` bewahrt, Bücher/Episoden-Zähler aufgefrischt), fehlende Worklist-Zeilen angehängt (absteigend nach Werk-Zahl). Ohne Flag bleibt der Convert strikt read-only auf beiden Excels.
- **`scripts/seed-data/map-worlds.overrides.json`** entfernt; das `doc`-Wissen steckt jetzt in der Review-Kopfzeile UND einem Snippet in `scripts/seed-data/README.md` (neue Sektion „Map-Katalog“).
- **Review-Report** — Kopf: Hand-Pfad-Anleitung + Abdeckungs-Kennzahl; §2 Worklist nur offene Zeilen, absteigend nach Werk-Zahl, ✚-Marker für Locations ohne Kurations-Zeile (mit Sync-Hinweis); neu §3 „Angewandte Kuration“ (Links/Rollups/Pins/Welten-Overrides mit Quelle→Ziel und Werk-Zahl); Dubletten/ID-Kollisionen/Ableitung jetzt §4–6.
- **`scripts/test-map-worlds.ts`** — 26 → **44 Tests**: beide Sheet-Parser (happy + alle Shape-Guards), Link (inkl. Dubletten-Instanzen, alle Guards), Pin (kind, Region, Rundung, alle Guards), Rollup (via, Dedup/Rollen-Konflikt, Sortierung, Pin-Ziel = Pin-vor-Rollup-Reihenfolge, Ketten-Guard, via-only-Welt schema-valide), `kind`-Mapping (70 Einträge, Unknown-/Empty-Fail), Welten-Overrides, Coverage-Zahlen, Worklist-Sortierung + ✚, Renderer-Sektionen, Schema-Validator (kind/via/coverage), Determinismus.

## Decisions I made

- **`eye_of_terror` → `eye-of-terror` aufgelöst** (2 Rollup-Ziele: `medrengard`, `vengeful_spirit`). Die B-Tabelle des Briefs schreibt das Ziel mit Unterstrich, aber Welt-IDs sind slugifiziert — `eye_of_terror` existiert nur als locationId, die Welt heißt `eye-of-terror` (verifiziert im Katalog). Kein Entscheid nötig, die Validierung erzwingt die richtige Form.
- **`spire`-⚠ geprüft, Rollup bleibt:** alle 5 Bücher mit Location „The Spire“ (Blood Royal, Lasgun Wedding, Salvation, Soulless Fury, Survival Instinct) sind `series: Necromunda` → Vorbefüllung `spire → necromunda` steht. Die Brief-Tabelle nannte 20 Werke, tatsächlich sind es 5 — die Werk-Spalten in § B waren teils Schätzungen; die Excel trägt die realen Zähler, die Prüfung ist in der Notiz-Zelle dokumentiert.
- **`classification` flach statt Objekt** (v1: `{primary, secondary, tertiary}` → v2: `classification: string|null` + `classification2: string|null`). Der Brief verlangt „classification roh erhalten + classification2 optional“; da noch kein App-Code den Katalog importiert, ist das flache Feld der sauberste 178-Kontrakt. Tertiary gedroppt wie vorgegeben.
- **Region-Marker = Klassifikations-Zelle „Region“.** Das Brief-Spaltenlayout hat keine Typ-Spalte; Region-Pins tragen `Klassifikation: Region` → `kind: region`, `classification` bleibt verbatim „Region“. Taucht „Region“ je in der SSOT-Excel auf, bricht der Convert weiterhin (nicht im 70er-Mapping) — `region` bleibt kurationsexklusiv.
- **Link-Guard streng:** Ziel-Welt muss ungematcht sein; ein Link auf eine bereits (per Name oder Override) gematchte Welt ist ein Fehler statt eines stillen Ersetzens.
- **Rollup-Dedup bei Gleichstand: eigener Eintrag gewinnt** (kein `via`); nur eine ECHT stärkere Rollup-Rolle ersetzt (dann mit `via`). Folge: Rollups mit hoher Überlappung erzeugen wenig(e) neue `via`-Einträge — z. B. bringt `imperial_palace → terra` 0 neue Kanten (alle 32 Palast-Werke stehen schon direkt auf Terra), `sol_system` bringt 7, `luna` 3, `pluto` 1. Erwartbares Verhalten, kein Datenverlust; §3 des Reviews zeigt die Quell-Zähler.
- **Kuration wirkt auf alle Same-Name-Instanzen** — der Brief nennt das für Rollups; auf Links ausgeweitet (Matcher-Konsistenz: Namens-Dubletten teilen locationId + Werke).
- **OQ 1 beantwortet — `--sync-curation` als Flag am Convert:** Regenerieren ist stabil handhabbar, weil der Convert die Excel nie anfasst (read-only); neue Worklist-Zeilen ergänzt das Flag maschinell (Werte-treu, Zähler-Refresh), im Review markiert ✚ was fehlt. Einschränkung: der Rewrite erhält Zell-WERTE, nicht Formatierung/Styling — falls Philipp die Excel einfärbt, vor dem Sync sichern. Die committete Datei ist bereits Sync-Format (Roundtrip verifiziert).
- **OQ 2 beantwortet — ja, `coverage` steht im Katalog-Header:** 178 kann „X von Y Werk-Kanten auf der Karte“ direkt lesen; über `worlds[].works` summieren wäre wegen Dubletten-Pins doppelt gezählt.

## Verification

- `npm run import:map-worlds` — zweimal gelaufen, beide Output-Hashes identisch (idempotent). Zahlen: 1012 Welten (992 Excel + 20 Pins), 111 verknüpft (104 Locations), 4 Links / 20 Rollups / 20 Pins / 0 Welten-Overrides, Abdeckung 1200/1685 (71,2 %), Worklist 319, 0 ID-Kollisionen.
- Akzeptanz-Details (Scratch-Check gegen den Katalog): alle 4 Links setzen das richtige `locationId`; `gudrun` trägt 2 `via: helican`- + 3 eigene Werke, `alecto` 11 `via: varangantua`, `eye-of-terror` 5 `via: medrengard` + 7 `via: vengeful_spirit`; alle 20 Pins `origin: "override"` (5× `kind: region`, `ulthwe` → `aeldari`); jede Welt trägt `kind` (Verteilung: imperial 238, unclassified 212, imperial-military 149, chaos-warp 95, dead 90, xenos 62, gate 39, necron 39, station 39, fleet 28, aeldari 16, region 5); `classification` roh auf allen 1012, `classification2` auf 172 (= Excel-Secondary-Befund); Werk-Reihenfolge (Bücher vor Episoden) katalogweit intakt.
- `--sync-curation`-Roundtrip: Excel neu geschrieben („no new worklist rows“), erneuter Convert → Katalog-Hash unverändert.
- `npm run test:map-worlds` — 44/44 pass.
- `npm run typecheck`, `lint`, `check:eras`, `brain:lint -- --no-write` — alle grün (brain:lint 0 blocking, nur die bekannten Warnings).
- `git status` — nur die beabsichtigten Dateien; `locations.json` / `location-aliases.json` / `sectors.json` / `src/db/**` / `db:sync` unangetastet. Kein App-Code importiert `map-worlds-schema` (v2-Bump bricht nichts; verifiziert per Grep).

## For next session

- **178 kann auf `map-worlds-v2` bauen:** `kind` (12 Werte) für Icons/Farben/Filter, `classification`/`classification2` für Anzeige-Details, `works[].via` für Rollup-Herkunft im Popup, `coverage` für „X Werke auf der Karte“, Default-Filter `works.length > 0` — alle 1012 Elemente bleiben anzeigbar.
- Die Werk-Zahlen in Brief-§-B waren teils Schätzungen (spire 20 → real 5); die Excel/Review tragen die realen Zähler, `--sync-curation` refresht sie bei jedem Lauf.
- `planet_of_the_sorcerers → prospero` ist vorbefüllt; die Alternative `eye-of-terror` steht als Notiz in der Excel — Philipp entscheidet im PR-Review (Zeile einfach umtragen, Convert neu laufen lassen).
- Koordinaten-Review: alle 20 Pin-Positionen sind Cowork-Vorschläge (Konfidenz/Anker in der Notiz-Spalte) — Philipp verschiebt im Review direkt in der Excel.
- `gramarye`-Dublettenverdacht (Impl 174) ist jetzt über Sheet „Welten“ lösbar (`gramarye-2` | `-`), weiter offen.
- Rest-Tail: 319 offene Zeilen, Priorisierung steht in der Excel (absteigend nach Werk-Zahl); die Top-4 sind die bewusst-offenen Regionen ohne Punkt-Position.

## References

- `write-excel-file` 4.1.1 (vorhandene devDependency, bisher nur `books:excel`) — Multi-Sheet-Cell-Array-API für den `--sync-curation`-Rewrite; keine neue Dependency, keine Version-Änderung. `read-excel-file` 9.0.9 unverändert (`readSheet` + `trim:false`-Workaround wie gehabt).
- Geteilte Pfade unverändert: `scripts/resolve-book-edges.ts`, `scripts/curation-overlay.ts`, `src/lib/ingestion/podcast/apply-plan.ts`.

## Nachtrag (2026-07-02): Kurations-Koordinaten auf SSOT-Pixelraum umgestellt

Maintainer-Entscheid nach Review, überschreibt Brief 183 § C („gx/gy, Grid 0–1000 / 0–808.6“):
das Redditor-Format ist Ausgangs- und Arbeitsdokument der Map-Umsetzung, Kurations-Pins
sollen ohne Umrechnung zwischen SSOT-Excel und Kurations-Excel wandern können.

- **Sheet „Kuration“ nimmt Pin-Koordinaten jetzt als `x`/`y` im SSOT-Pixelraum** — dieselben
  Zahlen wie die Coordinates-Spalten der Redditor-Excel (copy-paste-kompatibel). Der Convert
  projiziert sie via `projectToGrid` mit derselben eingefrorenen Formel wie die Excel-Welten;
  der Out-of-Extent-Guard (x ∈ [2.794, 7031], y ∈ [515, 6198]) ersetzt den bisherigen
  Grid-Range-Guard, fail-loud unverändert. Katalog-Kontrakt unberührt: `map-worlds-v2`
  behält `gx`/`gy` im projizierten Grid — für 178 ändert sich nichts.
- Umgesetzt: `CURATION_HEADERS` `gx`/`gy` → `x`/`y`; `CurationRow.x/.y`; Pin-Pfad in
  `buildCatalog` projiziert; `AppliedPin` trägt beide Räume; Review-§3-Pin-Tabelle zeigt
  x/y (Eingabe) + gx/gy (projiziert); `--sync-curation`-Writer schreibt x/y;
  Seed-Data-README aktualisiert; Tests umgestellt (Extent-Guard statt Grid-Range,
  Projektions-Assertions) — weiterhin 44/44.
- Committete Excel maschinell zurückgerechnet (20 Pins + 11 Notiz-Anker, 2 Nachkommastellen,
  round-trip-exakt): Katalog nach der Umstellung **byte-identisch**, Convert 2× idempotent,
  Sync-Roundtrip stabil. Anker-Stichprobe gegen die SSOT: Macragge Notiz (6167/5266) vs.
  SSOT (6166/5266), Tanith (1219/4247) vs. (1217/4247) — Abweichung ≤ 3 px (Rundung der
  Brief-Grid-Ganzzahlen auf ~7000 px Kartenbreite), vernachlässigbar.

## Nachtrag 2 (2026-07-02): Ganzzahl-Koordinaten + CC-Kurations-Pass (Maintainer-Delegation)

Zwei weitere Maintainer-Entscheide: (a) Pin-Koordinaten ohne Nachkommastellen, (b) Philipp
kann nicht weiter handkuratieren und delegiert die Rest-Kuration an CC — „wenn du zu allen
anderen Büchern nichts findest, dann ist das eben so“.

- **Ganzzahl-Rundung:** die 20 Brief-Pins auf ganze Pixel gerundet (max. ±0,5 px ≈ ±0,07
  Grid-Einheiten — Katalog-`gx`/`gy` verschieben sich in der zweiten Nachkommastelle).
- **CC-Pass über alle 319 offenen Zeilen.** Kriterium: Rollup nur bei lore-sicherer
  Zugehörigkeit (Stadt/Hive/Mond/Feature einer gemappten Welt); Pin nur mit belastbarem
  Regional-Anker, Konfidenz in der Notiz; Resolver-Sektor allein reicht nur bei eng
  umrissenen Regionen (Sabbat-Cluster, Scarus). Ergebnis: **1 Link** (`piscina_iv` →
  `piscina` — Welt existierte ungematcht in der Excel), **38 Rollups** (13× Sol/Terra:
  Jupiter, Titan, Golden Throne, Siege-Wälle, Unification-Regionen, Imperial Webway;
  Hive-Städte auf Verghast/Phantine/Necromunda; Ithraca→Calth, Illyrium→Macragge,
  Pharos→Sotha, Desh'ea→Nuceria, Northwilds→Caliban; Sicarus+Drakaasi→Eye of Terror,
  Torvendis→Maelstrom, Arx Tyrannus→Badab; Schiffs-Regel: Macragge's Honour→Macragge,
  Molech's Enlightenment→Molech), **42 Pins** (14 Sabbat-Welten am Tanith/Verghast-Anker,
  6 Scarus/Helican-Welten, 7 T'au-Grenzwelten, Kathur/Garm/Perlia/Periremunda/Kronus/
  Tartarus/Tarsis Ultra/Alaric Prime; 8 Regionen: Eastern Fringe, Pariah Nexus (Lexicanum:
  Nephilim-Sektor, Ultima), Sanctus Reach, Alaxxes-Nebel, Calixis, Halo Stars, Thramas,
  Elara's Veil), **8 Notiz-Markierungen** für bewusst Offenes (Space Hulk, Schiffe, Panzer,
  Craftworld Saim-Hann — mobil/ohne Position).
- **~190 Zeilen bleiben offen** — Kanon nennt keine Position (Ein-Buch-Welten wie
  Broucheroc, Salinas, Adumbria). Die werkstärksten Unklaren (Orath, Candleworld, Antikef,
  Pariah Nexus, Sanctus Reach) per Web-Recherche geprüft; nur die letzten beiden ergaben
  belastbare Verortungen. Webway/Great Rift/Imperium Nihilus bleiben bewusst offen (nicht
  punkt-kartierbar); Eastern Fringe jetzt als Region gepinnt.
- **Ergebnis:** 1054 Welten (992 Excel + 62 Pins), 5 Links / 58 Rollups / 62 Pins,
  Abdeckung 1200 → **1332/1685 Werk-Kanten (79,1 %)**, Worklist 319 → 238. Convert 2×
  idempotent, Sync-Roundtrip stabil, 44/44 Tests, keine ID-Kollisionen.
