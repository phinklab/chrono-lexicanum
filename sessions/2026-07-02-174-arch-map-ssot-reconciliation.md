---
session: 2026-07-02-174
role: architect
date: 2026-07-02
status: implemented
slug: map-ssot-reconciliation
parent: null
links: [2026-06-03-121, 2026-06-18-155, 2026-07-01-173]
commits: []
---

# P14 Teil A — Map-Katalog aus der Redditor-Excel + Medien-Abgleich (Batches)

> **Rev. 2026-07-02 (Philipp):** Richtung umgedreht gegenüber dem ersten Schnitt. Die Excel wird **nicht** in `locations.json` gemergt — sie wird die Karte. Eigener Map-Katalog, `locations`/Schema/DB bleiben unberührt.
>
> **Rev. 2026-07-02, zweite Runde (Philipp):** Die Medien-Verknüpfung wandert **in den Katalog selbst** (nicht nur in den Review-Report) — jede Welt trägt ihre zugehörigen Bücher/Podcast-Episoden. Ableitung **JSON-first aus den repo-seitigen Quellen**, keine DB-Abfragen im Convert. Grund: Teil B (Brief 178) bekommt einen Toggle „alle Welten ↔ Welten mit Buch-/Podcast-Lore", und der muss ohne DB aus dem Katalog beantwortbar sein.

## Goal

Die Redditor-Excel (`scripts/seed-data/source/Warhammer_map_SSOT.xlsx`, 992 Welten) wird per deterministischem Convert-Step zum **eigenen, committeten Map-Katalog** (Arbeitsname `map-worlds.json`): die Welten und Koordinaten des Redditors sind die neue Karte. Gegen diesen Katalog wird unser Bestand gematcht — DB-frei, über die repo-seitigen JSONs — und **die zugehörigen Bücher/Podcast-Episoden werden pro Welt in den Katalog geschrieben**; als Gegenliste entsteht: welche Medien-Welten in der Excel fehlen (Philipps Nachplatzierungs-Worklist). Datenfundament für den Map-Neubau in gleicher Optik (P14 Teil B = Brief 178, inkl. P15) — insbesondere für dessen Toggle „alle Welten ↔ Welten mit Buch-/Podcast-Lore".

## Context

- **Excel:** Sheet `Tabelle1`, `A1:G993`. Spalten: `Name` / `Primary/Secondary/Tertiary Classification` / Spalte E = x (Header „Coordinates") / Spalte F = y (headerless) / `Segmentum`. 992 Datenzeilen, alle Koordinaten numerisch (x ≈ 2.8–7031, y ≈ 515–6198 — Pixel-Raum der Quellkarte), **12 Namens-Dubletten**, 198× Primary „Unclassified". Segmenta: Ultima 536 / Obscurus 193 / Tempestus 100 / Solar 87 / Pacificus 76.
- **Bestand (bleibt unberührt):** `scripts/seed-data/locations.json` (446 Rows) + `location-aliases.json`; `locations`-Tabelle dient weiter den Entity-Seiten (`/welt/[id]`), Compendium, Suche. Medien-Verknüpfung: `work_locations` referenziert `works` — Bücher **und** Podcast-Episoden einheitlich.
- **Repo-seitige Medien-Quellen (DB-frei auswertbar):** per-Buch-Korpus `scripts/seed-data/books/*.json` (Location-Referenzen) + Podcast-Extractions `ingest/podcasts/*.extractions.json`; ggf. `curation-overlay.json`.
- **Muster für den Convert-Step:** `import:faction-starters` / `import:ssot-roster` — deterministischer `npm run`-Schritt, committete JSON, `next build` liest nur die JSON.
- Die 53 sektor-zugeordneten Stage-3-Welten (Briefe 155/158) sind Medien-Welten ohne Koordinaten — sie lösen sich hier auf in „matcht die Excel" (→ Pin) oder „steht auf der Nachplatzierungs-Liste".

## Philipp-Entscheide (2026-07-02)

1. Karte = die Redditor-Welten samt deren Koordinaten; Aufbau von dieser Seite aus.
2. **Nur Karten-Pins, keine neuen Entities** — die 992 werden NICHT zu `locations`-Rows / `/welt`-Seiten. Gematchte Pins verlinken auf die vorhandene `/welt`-Seite.
3. Medien-Welten ohne Excel-Match: **Review-Liste, Philipp platziert nach** (Hand-Koordinaten im selben Raster).
4. Neue Karte in **gleicher Optik** (heutige Gold-Sprache als Blaupause), aber neu gebaut; **Segmentum ersetzt den gezeichneten Sektor-Layer** (alte Sektor-Geometrie passt nicht zur echten Galaxie-Geometrie). Alles Rendering = Brief 178.
5. Die Karte bekommt in Teil B einen **Toggle „alle Welten ↔ Welten mit Buch-/Podcast-Lore"**. Dafür trägt der Katalog die Medien-Verknüpfung pro Welt; Ableitung JSON-first aus den repo-seitigen Quellen, keine großen DB-Abfragen.

## Architektur-Entscheidungen

1. **Eigener Katalog, DB-frei.** `map-worlds.json` (committed, unter `scripts/seed-data/`) ist die einzige Quelle der neuen Karte. **Keine Schema-Änderung, keine Migration, kein neuer `db:sync`-Schritt.** Felder pro Welt: `id` (Slug aus Name, kollisionsfrei), `name`, `gx`/`gy` (0–1000, seitenverhältnis-treu normalisiert, Transformation im Script dokumentiert), Klassifikation (rangerhaltend Primary→Tertiary), `segmentum`, `locationId` (nullable — Match auf bestehende `locations`-Row), **Medien-Verknüpfung** (Liste der zugehörigen Werke: Bücher + Podcast-Episoden, mindestens Werk-Referenz + Typ; exakte Feldform CC-frei — der Contract ist: die Map kann pro Welt „hat ≥1 Werk?" und „welche?" ohne DB beantworten).
2. **Match nur zur Verknüpfung:** Excel-Name gegen `locations.json` + `location-aliases.json` (case-insensitiv). Ein Match schreibt `locationId` in den Katalog — sonst ändert er nichts. `locations.json` wird nicht angefasst.
3. **Medien-Ableitung JSON-first, DB-frei (Philipp-Entscheid).** Die Werke pro gematchter Welt kommen ausschließlich aus den repo-seitigen Quellen: per-Buch-Korpus `scripts/seed-data/books/*.json` + Podcast-Extractions `ingest/podcasts/*.extractions.json` (ggf. `curation-overlay.json`). Der Convert-Step macht **keine DB-Abfragen**. Erlaubt ist einmalig eine read-only `work_locations`-Stichprobe als Verifikation der Ableitung, dokumentiert im Review-Report — als Check, nicht als Datenpfad.
4. **Hand-Nachplatzierung als Datenpfad:** ein committetes Override-/Extension-File (z. B. `map-worlds.overrides.json`), das der Convert-Step deterministisch einmerged — damit Philipp Lücken-Welten mit Hand-Koordinaten nachtragen (und einzelne Fehl-Matches korrigieren) kann, ohne den generierten Katalog zu editieren. Struktur dokumentieren; darf leer shippen.
5. **Review-Report als Hand-Gate** (committed, z. B. `map-worlds.review.md`): (a) Match-Übersicht Excel↔Bestand mit Medien-Zahl je gematchter Welt (direkt aus dem Katalog); (b) **die Gegenliste: Bestands-Welten mit ≥1 Werk, aber ohne Excel-Match** — Philipps Nachplatzierungs-Worklist, ideal als copy-paste-fertige Override-Stubs; (c) die 12 Excel-Dubletten + angewandte deterministische Regel (z. B. erstes Vorkommen gewinnt); (d) ID-Kollisionen.
6. Die Excel bleibt unverändert als read-only Input unter `source/`. Sie wird auch **nicht angereichert** — die „um Bücher/Podcasts erweiterte Planetenliste" IST `map-worlds.json` (Philipp 2026-07-02: JSON-Katalog reicht, kein zusätzlicher Excel-Export).

## Constraints

- `locations.json`, `location-aliases.json`, `sectors.json`, `src/db/**` (Schema + Migrationen), `scripts/seed.ts`, `db-sync.sh` — **alle unangetastet.**
- Convert deterministisch + idempotent (zweiter Lauf → kein Diff); kein Excel-Parse zur Buildzeit.
- Batches-Worktree (`chrono-lexicanum-batches`), ein PR; `brain/**` + `sessions/README.md` nicht anfassen (Rollup-Ownership). Dieser Brief reitet im PR mit, `status: open → implemented`.
- TypeScript strict, keine Version-Pins (CC recherchiert/pinnt).

## Out of scope

- **Jedes Rendering:** `src/app/map/**`, `src/components/map/**` — komplett Brief 178 (Neubau in gleicher Optik + Segmentum-Layer + P15). Die alte Karte bleibt bis dahin unverändert live (preview-gated).
- Rückbau des alten Sektor-/Location-Map-Pfads — passiert mit/nach 178, nicht hier.
- Keine neuen `work_locations`-Kanten, keine Entity-/Blurb-/Alias-Erzeugung für Excel-Welten.
- Per-Buch-SSOT-Maschinerie — unberührt.

## Acceptance

The session is done when:

- [ ] Ein `npm run`-Convert-Step (Name CC-frei) liest Excel + Overrides und schreibt `map-worlds.json` + `map-worlds.review.md` deterministisch; zweiter Lauf ohne Diff.
- [ ] `map-worlds.json` enthält die Excel-Welten (nach Dubletten-Regel) mit `gx`/`gy` im 0–1000-Raster (seitenverhältnis-treu), rangerhaltender Klassifikation, Segmentum und `locationId` wo gematcht.
- [ ] `map-worlds.json` trägt pro gematchter Welt die zugehörigen Werke (Bücher + Podcast-Episoden), abgeleitet **ausschließlich aus den repo-seitigen JSONs** — der Convert läuft ohne DB-Verbindung; die Map von Teil B kann „hat Lore?" und „welche Werke?" pro Welt aus dem Katalog beantworten.
- [ ] Der Review-Report enthält die vier Abschnitte aus Architektur-Entscheidung 5 — insbesondere die Nachplatzierungs-Worklist (Medien-Welten ohne Excel-Match) mit copy-paste-fähigen Override-Stubs.
- [ ] Override-File + dokumentierte Struktur existieren; ein Test-/Beispiel-Eintrag beweist den Merge-Pfad (darf danach leer shippen).
- [ ] `git status` zeigt keine Änderung an `locations.json` / `sectors.json` / `src/db/**` / `db-sync.sh` / `seed.ts`.
- [ ] `tsc --noEmit`, Lint und bestehende Tests grün; `next build` ohne Excel-Zugriff.

## Open questions

- Match-Quote: wie viele der 992 Excel-Welten matchen den Bestand, und wie groß ist die Nachplatzierungs-Worklist (Medien-Welten ohne Match)? Davon hängt ab, wie viel Handarbeit auf Philipp zukommt, bevor 178 sinnvoll rendert.
- Deckungs-Check: weicht die repo-seitige Medien-Ableitung von `work_locations` ab (read-only Stichprobe)? Falls ja, wo — Overlay-/Extractions-Drift? Befund in den Report.
- Dubletten-Befund: sind die 12 echte Duplikate oder legitime Mehrfach-Objekte (Fleets, Warp Gates an zwei Positionen)? Empfehlung für die Regel in Teil B.
- Reicht integer-0–1000 als Präzision für 992 Pins (dichte Cluster), oder empfiehlst du fürs 178er-Rendering mehr Auflösung im Katalog?

## Notes

- Beispielzeile: `('Cypra Mundi', 'Forge World', 'Genestealer Infested', 'Imperial Navy Base', 2567, 1643, 'Obscurus')`.
- Die 12 Dubletten-Namen: black templar fleet, canopus, sarum, jericho-maw warp gate, commorragh, blackstone fortress, contra empyric nexus, gramarye, prescience, the gates of fire, imperial fists fleet, startide nexus.
- OQ 16b/c (Timeline-`primaryEraId` / Atlas-Events) bewusst nicht berührt — unverwandt, bleiben in der Queue.
- P14 Teil B (Brief 178, Product): Map-Neubau in gleicher Optik auf `map-worlds.json` — Segmentum-Regionen statt Sektor-Zeichnung, Pins mit Medien-Anzeige + `/welt`-Link wo gematcht, **Toggle „alle Welten ↔ Welten mit Buch-/Podcast-Lore"** (aus der Katalog-Medien-Verknüpfung, ohne DB), P15-Chrome-Kohärenz eingefaltet. Wird nach Merge + Report dieses Briefs geschnitten.
