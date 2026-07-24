---
session: 2026-07-24-266
role: implementer
date: 2026-07-24
status: complete
slug: product-map-zone-fixes
parent: werkstatt-roadmap-18-k1
links:
  - docs/werkstatt-roadmap.md
commits: []
---

# K1 — Karten-Geometrie: Ruinstorm + Ultramar

## Summary

Beide Zonen in `src/lib/map/zones.json` neu vermessen: der Ruinstorm reicht jetzt westlich bis über Davin, Ultramar schließt Calth, Latona, Saramanth und Sotha ein. Die eine Sache, die hängen bleiben sollte: **gemessen werden muss gegen den gerenderten Bézier-Umriss, nicht gegen das Kontrollpolygon** — die Glättung zieht die Kurve so weit nach innen, dass Calth im Rohpolygon „drin" lag und trotzdem außerhalb gezeichnet wurde.

## What I did

- `src/lib/map/zones.json` — `zone-22` „The Ruinstorm": Westflanke von 24 auf 26 Punkte, die drei Vertices `[577,561] [604,482] [635,420]` ersetzt durch `[572,543] [548,492] [509,442] [512,390] [566,364]`. Ostseite (Indizes 0–13) unverändert. y bleibt über die gesamte Westseite monoton fallend, das Polygon damit garantiert überschneidungsfrei.
- `src/lib/map/zones.json` — `zone-3` „Ultramar": Südost-Flanke ausgebeult, 11 → 14 Punkte. Neue Ostkante `[925.5,632] [922.5,653] [928,668.5] [912,684] [888,692]`, Nordkante um `[901,617]` verlängert; die Westhälfte des Polygons blieb unangetastet.
- `docs/werkstatt-roadmap.md` — Posten 18 auf `☑`; zwei neue Spielregeln (Haken im PR statt nach dem Merge; Erledigt-Markierung durch durchgestrichene Überschrift + eingeklappten Prompt); Lesehilfe unter der Prompts-Überschrift; die Konvention rückwirkend auf die Posten 15 und 16 angewandt; Session-Zähler von 263/264 auf 266/267 korrigiert.
- `zones-draft-backup-2026-07-18.json` — gelöscht (war untracked, taucht im Diff nicht auf).

## Decisions I made

- **Backup-Draft verworfen statt eingearbeitet.** `zones-draft-backup-2026-07-18.json` (18.07.) ist älter als der Live-Stand (19.07., PR #279 „Ruinstorm-Neuzeichnung", Session 249). Der Draft kennt `zone-35` (Ocularis als `hh`-Interdiction) überhaupt nicht und trägt den *alten* Ruinstorm (x 616–862, bis y 877); ein Merge wäre ein Rückschritt gewesen. Mit Philipp geklärt, wie der Prompt es verlangt.
- **Ruinstorm über den Maelstrom gezogen, Davin-Pin nicht angefasst.** Der Davin-Pin (544,26/419,59) liegt im gerenderten Umriss von `zone-6` „The Maelstrom" (x 523–600 / y 372–438) — Davin sitzt mitten im Blob, also überlappt *jede* Form, die ihn einschließt, den Maelstrom. Der neue Sturm überdeckt `zone-6` zu 96 %. Die Alternative wäre gewesen, den Pin zu versetzen (die Koordinate ist in `voyages/data/guilliman.ts:50` als `DAVIN_PLACEMENT` ausdrücklich schematisch markiert, „no canonical galactic coordinate") — das hätte aber `scripts/seed-data/map-worlds.json` berührt und damit Batches-Gebiet in einen Product-PR gezogen. Entscheidung von Philipp.
- **Magniat als Kollateral in Kauf genommen.** Magniat (896,13/620,50) liegt 9 Einheiten von Espandor entfernt; Espandor kann nicht von 1,1 auf brauchbaren Puffer kommen, ohne Magniat mitzunehmen. Es ist die einzige ungewollte Zugabe.
- **Sotha mit aufgenommen**, obwohl der Prompt nur Calth, Latona, Saramanth nennt — Sotha lag mit 22,9 am weitesten draußen, ist kanonisch Ultramar (Pharos / Imperium Secundus) und selbst eine Guilliman-Station. Mit Philipp abgestimmt.
- **Keinen Test angepasst.** `scripts/test-map-renderer.ts:175-176` assertiert hart, dass das Ruinstorm-Label waagerecht liegt (`angle === 0`) und keinen Bogen bekommt (`arc === null`) — die Verbreiterung hätte die PCA-Hauptachse kippen können. Vorab durchgerechnet: Achse −87,1° → −86,4° (bleibt über der 55°-Schwelle), Elongation 2,46 → 1,92 (bleibt unter dem 2,4-Schwellwert für Bögen). Beide Assertions halten unverändert.

## Verification

Gemessen wurde mit einem Ad-hoc-Skript, das `chaikin()` + die Catmull-Rom-Bézier-Kette aus `src/lib/map/zones.ts:133-171` nachbildet, den Umriss mit 32 Samples pro Segment abtastet und Punkt-in-Polygon gegen *diese* Polylinie rechnet — nicht gegen `zone.points`.

- Ruinstorm: Davin **out 81,3 → IN 35,3**; Pyrrhan bleibt drin (107,0 → 117,4); Terra (176,2), Luna, Armageddon, Anuari, Nuceria, Macragge, Calth und Thessala (8,7) bleiben draußen.
- Ultramar, geprüft gegen **alle 48 Welten** im Fenster x 815–945 / y 580–740: Calth **1,5 draußen → 8,2 drin**, Latona **5,3 → 18,0**, Saramanth **6,6 → 15,8**, Sotha **22,9 → 5,7**, Espandor 1,1 → 6,4. Keine Welt fällt heraus. Draußen bleiben u. a. Hadex-Anomalie (36,0), Neraka (22,5), Ulixis (8,9), Bathor (6,5), Cytheria, Vespid und die T'au-Welten.
- `npx tsx scripts/test-map-zones.ts` — pass
- `npx tsx scripts/test-map-renderer.ts` — pass (die beiden Ruinstorm-Label-Assertions inklusive)
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — pass, 41 Suiten in 7,4 s
- `npm run build` — pass
- `brain:lint` nicht gefahren — `brain/**` wurde nicht berührt.
- Optische Formen-Abnahme durch Philipp im Browser (Dev-Server), kein Headless-Loop.

## Open issues / blockers

Keine. Die Formen sind ein vermessener Startpunkt; Feinschliff läuft bei Bedarf über den Zone-Editor (`/map?zones=edit`, nur im Dev-Build), dessen Export `zones.json` vollständig ersetzt.

## For next session

- **Die Ruinstorm-Ostkante umschließt Ultramar weiterhin nicht** — Macragge liegt 85 Einheiten außerhalb. Kanonisch war der Ruinstorm um Ultramar herum gelegt und Imperium Secundus entstand *darin*; aktuell trägt `zone-29` „Imperium Secundus" diese Rolle als eigene Zone. War nicht Auftrag, wäre aber eine eigene Kurationsfrage.
- **`zone-31` „Zone Perditus" überlappt jetzt zu 22 % mit dem neuen Ruinstorm.** Optisch unauffällig, aber falls die Perditus-Zonen als „vom Sturm verschluckt" gelesen werden sollen, wäre das ein bewusst zu setzendes Verhältnis statt eines Zufalls.
- **`zone-3` und `zone-29` überlappen auf der `hh`-Platte stark und sind beide `kind: region`** mit identischer Gold-Vokabel. Durch die größere Ultramar-Form wird das etwas ausgeprägter — falls das unruhig wirkt, wäre eine eigene Zone-Kind- oder Z-Order-Entscheidung fällig.
- **`scripts/seed-data/locations.json` ist ein zweiter, inkompatibler Koordinatensatz** (Terra 500/320 statt 333,4/401,95; Davin dort `sector: "obscurus"` statt Ultima). Die Karte nutzt ausschließlich `map-worlds.json`. Solange beide Dateien nebeneinander liegen, ist das eine Falle für die nächste Geometrie-Session.

## References

- `src/lib/map/zones.ts:133-171` — `chaikin()` + `zonePath()`, die geteilte Glättung beider Renderer
- `src/lib/map/voyages/data/guilliman.ts:50-54,157-177` — `DAVIN_PLACEMENT`, Pyrrhan- und Davin-Stationen
- `scripts/test-map-renderer.ts:169-181` — die Label-Assertions auf Cicatrix, Ruinstorm und Scourge Stars
