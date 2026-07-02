---
session: 2026-07-02-174
role: implementer
date: 2026-07-02
status: complete
slug: map-ssot-reconciliation
parent: 2026-07-02-174
links: [2026-06-03-121, 2026-06-18-155, 2026-07-01-173]
commits: []
---

# P14 Teil A — Map-Katalog aus der Redditor-Excel + Medien-Abgleich (Batches)

## Summary

`npm run import:map-worlds` liest die Excel (992 Welten) + `map-worlds.overrides.json` und schreibt deterministisch `scripts/seed-data/map-worlds.json` (Katalog inkl. Medien-Verknüpfung pro Welt, DB-frei) + `map-worlds.review.md` (Hand-Gate). Match-Quote: **87 von 992** Excel-Welten matchen den Bestand (80 verschiedene Locations, 86 mit ≥1 Werk); die Nachplatzierungs-Worklist hat **363** Medien-Locations — deutlich mehr Handarbeit als gehofft, siehe „Open issues".

## What I did

- `scripts/map-worlds-core.ts` — pure Kern (kein FS/DB zur Call-Time): Grid-Projektion mit eingefrorenen Kalibrier-Konstanten, deterministische ID-Vergabe, case-insensitiver Location-Matcher, Medien-Ableitung (Bücher + Podcast-Episoden), Overrides-Merge, Katalog-Komposition, Review-Renderer. Von Convert UND Test geteilt.
- `scripts/import-map-worlds.ts` — IO-Wrapper nach dem `import:faction-starters`-Muster: Excel-Read (`read-excel-file`, `trim:false`-Workaround wie ssot-roster), Header-/Zeilen-Validation fail-loud, Inputs laden, Kern aufrufen, Outputs schreiben. Läuft ohne `--env-file` → strukturell DB-frei.
- `src/lib/map/map-worlds-schema.ts` — Typen + Runtime-Validator für `map-worlds-v1` (Muster: `faction-starters-schema.ts`), damit Teil B (Brief 178) den Katalog typisiert importieren kann. Der Convert validiert seinen eigenen Output dagegen (Self-Check).
- `scripts/seed-data/map-worlds.json` — generierter Katalog: 992 Welten, `id`/`name`/`classification` (rangerhaltend)/`segmentum`/`gx`/`gy`/`locationId`/`works`/`origin`.
- `scripts/seed-data/map-worlds.review.md` — Review-Report mit den 5 Abschnitten (Match-Übersicht, Nachplatzierungs-Worklist mit copy-paste-Stubs, Dubletten + Regel, ID-Kollisionen, Ableitungs-Notizen).
- `scripts/seed-data/map-worlds.overrides.json` — Override-File, leer geshippt; Struktur im `doc`-Feld dokumentiert (`addWorlds` + `worldOverrides`).
- `scripts/test-map-worlds.ts` + npm-Script `test:map-worlds` — 26 Unit-Tests über den pure Kern (Projektion, IDs/Dubletten, Matcher, Buch-/Podcast-Ableitung inkl. Overlay-Tail, alle Override-Fail-Guards, Renderer, Schema-Validator, Byte-Determinismus).
- `package.json` — `import:map-worlds` + `test:map-worlds` (keine neue Dependency: `read-excel-file` war schon devDependency).

## Decisions I made

- **Dubletten-Regel: keep-all mit Ordinal-Suffix statt „erstes Vorkommen gewinnt".** Die 12 Dubletten-Namen umfassen **31 Zeilen** (commorragh ×5, blackstone fortress ×4, black templar fleet ×3, …) und sind fast alle legitime Mehrfach-Objekte an verschiedenen Positionen — first-wins hätte 19 echte Pins verworfen. Alle 992 Zeilen bleiben; wiederholte Slugs bekommen `-2`, `-3`, … in Sheet-Reihenfolge. Alle Instanzen eines Namens tragen dasselbe `locationId` + dieselben Werke; einzelne Pins sind per `worldOverrides.<id>.locationId: null` entkoppelbar. Einziger Verdacht auf ein ECHTES Duplikat: `gramarye` (Zeilen 298/356, fast identische Koordinaten/Klasse/Segmentum). Empfehlung für Teil B: same-name-Pins als EIN Objekt mit mehreren Positionen behandeln (ein Tooltip, n Punkte).
- **Medien-Ableitung über die geteilten Code-Pfade, nicht nachgebaut:** Bücher via `resolveLocations()` aus `scripts/resolve-book-edges.ts` (exakt der `apply:book`-Pfad) + Location-Tail aus `curation-overlay.json` via `computeBookOps()`/`validateOverlay()` (exakt der `apply:curation-overlay`-Pfad); Episoden via der `apply-plan.ts`-Junction-Regeln (FK-Gate, subject>mentioned-Dedup, `deriveEpisodeSlug`). Drift zur DB-Semantik ist damit konstruktiv ausgeschlossen.
- **Podcast-Quelle: `ingest/podcasts/<show>.json` (Show-Artifacts, Registry-getrieben) statt der im Brief genannten `*.extractions.json`.** Die Extractions tragen rohe Surface-Forms; die Artifacts tragen die AUFGELÖSTEN Tags (`canonicalId`, `role`) — dieselbe Form, die `apply:podcast` in `work_locations` schreibt. `luetin09-full.extractions.json` (nicht registriert) bleibt dadurch korrekt außen vor.
- **Werk-Referenz im Katalog:** `{type, slug, title, role}` (Episoden zusätzlich `show`). `slug` = `works.slug` (Bücher: `/buch/{slug}`; Episoden: der von `apply:podcast` eingefrorene deterministische Episoden-Slug). `title` ist drin, damit Teil B das Popup ohne DB rendern kann. Rollen-Vokabular verbatim wie in der DB (Bücher: primary/secondary/mentioned; Episoden: subject/mentioned).
- **Projektion mit eingefrorenen Konstanten statt data-derived min/max:** `SOURCE_EXTENT` (x ∈ [2.794, 7031], y ∈ [515, 6198]) ist im Script hartkodiert (Herkunft dokumentiert), EIN Skalierungsfaktor für beide Achsen (seitenverhältnis-treu, gy_max = 808.6), 2 Nachkommastellen. Grund: Philipps Hand-Koordinaten leben im projizierten Raster und dürfen nicht verrutschen, falls die Excel je neu exportiert wird — eine Zeile außerhalb der Kalibrierung bricht hart (Rekalibrierung = Menschen-Entscheid). 2 Dezimalen erhalten die volle Quell-Präzision (1 Grid-Einheit ≈ 7 Quell-Pixel; Integer hätte in dichten Clustern ±3.5 px quantisiert) → Empfehlung zur offenen Frage: Katalog-Auflösung reicht für 178.
- **Review-Stubs shippen `"gx": null`** — ein eingefügter, aber nicht editierter Stub bricht den Convert absichtlich mit klarer Meldung, statt den Pin still in die Ecke (0,0) zu setzen.
- **Merge-Pfad-Beweis per Unit-Test statt committetem Beispiel-Eintrag:** Das Override-File shippt leer; `test:map-worlds` beweist addWorlds/worldOverrides/Fail-Guards vollständig (Brief erlaubt „darf danach leer shippen" — so gibt es keinen Beispiel-Müll im Datenfile).
- **DB-Stichprobe im Impl-Report statt im generierten Review:** Ein Live-DB-Befund in einer deterministisch generierten Datei würde „zweiter Lauf → kein Diff" brechen. Der Review §5 verweist hierher; Befund unten unter „Verification".
- **`origin: "excel" | "override"`-Feld pro Welt** (nicht im Brief): kostet nichts, macht Hand-Pins im Katalog/Teil B unterscheidbar.

## Verification

- `npm run import:map-worlds` — zweimal gelaufen, Datei-Hashes identisch (idempotent). Output: 992 Welten, 87 matched (80 Locations), 1333 Buch-Kanten (748/896 Büchern mit ≥1 Location-Kante), 352 Episoden-Kanten (262/1094 Episoden).
- `npm run test:map-worlds` — 26/26 pass.
- `npm run typecheck`, `npm run lint`, `npm run check:eras`, `npm run brain:lint -- --no-write` — alle grün (die 4 CI-Gates).
- `npm run build` — grün; nichts unter `src/` liest die Excel (der Katalog wird in diesem Brief noch von keiner Route importiert).
- `git status` — keine Änderung an `locations.json` / `location-aliases.json` / `sectors.json` / `src/db/**` / `db-sync.sh` / `seed.ts`.
- **Read-only `work_locations`-Voll-Abgleich** (statt Stichprobe; SELECT-only Scratch-Script, nicht committed): 442 Locations verglichen, 1685 abgeleitete vs. 1678 DB-Kanten — **0 Extra-Kanten in der DB, 0 Rollen-Abweichungen**, 7 abgeleitete Kanten fehlen in der DB. Alle 7 gehören zu 6 Büchern, die als `works`-Rows komplett fehlen (`armageddon-season-of-fire`, `the-long-and-hungry-road`, `lelith-hesperax-queen-of-knives`, `deathworlder`, `the-rose-in-darkness`, `our-martyred-lady`) — Korpus-Files, die noch nie per `apply:book` angewandt wurden. Befund: die Ableitung selbst hat null Drift; die DB hängt dem Korpus um 6 Bücher hinterher.

## Open issues / blockers

- **Match-Quote ist niedrig: 87/992.** Exakter case-insensitiver Match (Namen + Alias-Keys) findet nur 80 der 443 Medien-Locations → die Worklist §2 hat **363 Einträge**. Das ist mehr Handarbeit, als der Brief erhofft hat, bevor 178 „Welten mit Lore" sinnvoll togglen kann. Milderung: (a) viele der 363 sind Ein-Buch-Locations — Philipp kann nach Medien-Zahl absteigend priorisieren (Tabelle ist unsortiert nach ID; die Zahlen stehen drin); (b) neue Einträge in `location-aliases.json` (außerhalb dieses PRs) verbessern den Match automatisch beim nächsten Convert-Lauf; (c) ein normalisierender Fuzzy-Pass (Bindestrich/Leerzeichen, „the", Suffixe wie „Prime") könnte die Quote heben — bewusst NICHT gebaut (Brief sagt case-insensitiv exakt; Fuzzy = False-Positive-Risiko). Entscheid für Cowork.
- Die 6 nie applied Bücher (siehe Verification) sind ein Weekly-Refresh-/Apply-Lag außerhalb dieses Briefs — beim nächsten `apply:book --all`/Rebuild verschwindet die Differenz von selbst.

## For next session

- **Teil B (Brief 178) kann auf `map-worlds-v1` bauen:** `import { … } from "@/lib/map/map-worlds-schema"`; Kontrakt: `worlds[].works.length > 0` ⇔ „hat Lore", `gx` 0–1000 / `gy` 0–808.6 (Seitenverhältnis 1000:808.6 ≈ Quellkarte), `locationId` → `/welt/{id}`.
- Dubletten-Empfehlung für 178: same-name-Pins als ein Objekt mit n Positionen rendern (s. o.); `gramarye`-Paar ggf. per `worldOverrides` auf einen Pin reduzieren (Philipp-Entscheid).
- Erwägen: Worklist-Tabelle §2 nach Werk-Zahl absteigend sortieren statt nach locationId (eine Zeile im Renderer), falls Philipp die Priorisierung direkt im Report will.
- OQ „Medien-Zählung repo-seitig vs. DB-Query" ist beantwortet: repo-seitig ist verlässlicher (DB hing 6 Bücher hinterher) — 178 sollte die Pin-Medien-Anzeige aus dem Katalog lesen, nicht live joinen.

## References

- `read-excel-file` 9.0.9 (vorhandene devDependency; `readSheet` + `trim:false`-Workaround wie `import-ssot-roster.ts`) — keine neue Dependency, keine Version-Änderung.
- Geteilte Pfade: `scripts/resolve-book-edges.ts` (Brief 154), `scripts/curation-overlay.ts` (Brief 149/154), `src/lib/ingestion/podcast/apply-plan.ts` (Brief 114/122).
