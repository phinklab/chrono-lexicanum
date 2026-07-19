---
session: 2026-07-19-249
role: implementer
date: 2026-07-19
status: complete
slug: map-ui-rework
parent: none
links:
  - sessions/2026-07-18-246-impl-map-time-states-ui.md
  - sessions/2026-07-18-247-impl-map-timeline.md
  - docs/werkstatt-roadmap.md
commits: []
---

# Map-UI-Rework WM-B1 — Cartouche als Titel + Legende, Journeys-Tür, Zonen-Randtönung, Ruinstorm-Neuzeichnung

## Summary

WM-B1 (Fahrplan-Posten 6, Urteil „bauen, Option B" aus Session 248) ist
gebaut — Launch-Modus, logischer Strang Product, Coordination-Worktree,
Branch `codex/product-map-ui-rework`. Der Branch wuchs über **vier
Review-Runden** mit Philipp (2026-07-18/19), jede im Browser abgenommen:
**(1)** die Neuordnung nach Aufgaben — Cartouche wird Titel + EINE
interaktive Legende, die Great Journeys werden der eigene Content-Eingang,
World-Names als Dreiweg, Tour-Fenster nach Journey benannt, Rename „March
of the Legions"; **(2)** ein Zonen-Präsentationspass — Randtönung statt
Sticker-Fill, Imhof-Labels, Storm-Stipple, ein Dash-Vokabular pro
Kind-Familie, komplette Canvas-Parität + neues Test-Gate; **(3)** die
Cicatrix-Geometrie aus Philipps Editor-Fassung; **(4)** die
Session-249-Runde — Journey-Stationsnamen in der Display-Face,
Great-Journeys-Panel mit Intro + ausklappbaren Ären-Gruppen, und der
M31-Ruinstorm neu gezeichnet nach Philipps Skizze, deutlich leiser.
Alle Gates grün (inkl. `test:smoke` 20/20 lokal gegen den Prod-Build);
UI-Abnahme durch Philipp erfolgt („passt").

## What I did

**Runde 1 — Neuordnung nach Aufgaben (WM-B1-Grundstock):**

- `Cartouche.tsx` — die Cartouche ist wieder Titel + Legende: Instruments
  und Census verschmolzen zur **einen interaktiven Legende** hinter dem
  einzigen „Legend"-Eingang. Jede Overlay-Reihe IST der Schalter und trägt
  eine 18-px-Miniatur ihrer Chart-Zeichnung (Lumen-Stern, Nihilus-Scheibe,
  Zonen-Polygon, Namens-„Aa"); Zustands-Noten nur off-default, Nihilus
  off-„now" sichtbar begründet statt Tooltip. Badge-Prinzip bleibt: kein
  aktiver Nicht-Default-Zustand versteckt sich hinter einem zugeklappten
  Header (`legendNote`).
- Great Journeys als **eigener Content-Eingang, default offen**:
  nummerierter Atlas-Index („01"…„12", modulweit vorberechnet), Name in
  der Display-Face, Ären-Tag, Blurb als Zwei-Zeilen-Teaser (die volle
  Erzählung bleibt auf der Ouvertüren-Karte — Esri-Story-Map-Konvention).
- World index raus aus der Sicht: der leise **„A–Z"-Opener an der
  Seek-Kante** (SeekHead) ersetzt die eigene Sektion — S10a-Parität
  (Tastatur/AT-Pfad zu den 1 000+ pointer-only Pins) ohne sichtbaren
  Posten.
- **World-Names-Dreiweg** statt Bool: `NamesMode` auto (Zoom-Leiter) →
  all → off, Reducer-Action `cycleNames`; `svg.names`-Gate + Canvas
  (`mobileLabelVisible`) folgen. Die 3×/6×-Zoomer-Presets sind raus —
  Entscheid: die Band-Schwellen sind Renderer-Interna, „ich will Namen"
  ist jetzt ein Legendeneintrag erster Klasse.
- Tour-Fenster (`VoyageTour`/`CourseCards`/`StrategicReadout`): der
  **Journey-Name ist der stabile Fenstertitel** (.ck) über Ouvertüre,
  Akten und Epilog; kein „GREAT JOURNEY"-Kicker mehr, Tag + Kartographie
  auf der leisen Zeile; „SHOW ALL LEGIONS" statt „SHOW THE FULL WEB";
  Readout ohne „Legion XX"-Präfix (die Kapitelzeile trägt die Numerale).
- **Rename „The Warmaster's Web" → „March of the Legions"** (Display-Name,
  Label, Blurbs, Cross-Referenz in `great-crusade.ts`); die id
  `warmasters-web` bleibt als stabiler Hash-/Roster-Schlüssel.
- `Census.tsx` — Kopf „Population" statt „Show on the chart", Textdiät
  („Star-dust · no records yet"); zusammen mit den Overlay-Reihen liest
  sich die Legende als eine Spalte.
- `CartoucheSheet.tsx` — das offene Sheet IST die Disclosure: Journeys +
  Legende unter statischen Captions (`c-cap`), keine
  „Drag for more"-Zeile, Zustands-Badges am zugeklappten Dock; nie mehr
  als zwei Fold-Ebenen (NN/g).
- `e2e/smoke-static.spec.ts` — Sheet-Asserts auf die neue Grammatik (zwei
  Captions statt vier `c-sec`), Desktop-Flow ohne den entfallenen
  Sektions-Klick.

**Runde 2 — Zonen-Präsentationspass (abgenommen, Design steht):**

- `zones.ts` — **`zoneEdgeBands`**: drei konzentrische, auf die Form
  geclippte Innen-Strokes (schmal = kräftig am Rand, breit = zart nach
  innen; ~16 % der Querausdehnung, Kappe 44 gu) — Ink läuft nach innen,
  nie ein Glow nach außen. **`zoneLabelLayout`** (Imhof-Handwerk):
  PCA-Hauptachse, Rotation geclampt ±30° (Mini-Tilts und Rund-Achsen
  fallen auf horizontal), Sperrung wächst mit der Ausdehnung (3–7,5 px),
  Versal 10/11 px, Klein-Zonen labeln erst ab Band 1, lange flache Bänder
  bekommen einen **textPath-Bogen** (Cicatrix). **`zonePath`**: ein
  Chaikin-Corner-Cut vor der Catmull-Rom-Runde — Editor-Vertices schlagen
  nicht mehr als Knicke durch; zones.json bleibt roh.
- `ZonesLayer.tsx` + `55-map.css` — Randtönung statt Outline+Flat-Fill;
  **Storm-Interiors als Dot-Stipple** (`#cg-stormStipple`, decor.tsx) in
  der Ground-Sprache des Charts (Grid-Dots/Star-Dust), Hatch bleibt die
  exklusive Stimme von Interdiction/Plague; non-scaling Outline mit
  **einem Dash-Vokabular pro Kind-Familie** (storm 2 5 · hazard 3 3 ·
  territory 1 6 · tyranid 1 4 · necron 4 3).
- `canvas-renderer.ts` — **komplette Parität**: `ZONE_RENDER_DATA` einmal
  pro Kuration (Bounds, Path, Stil, Layout, Bänder, Stipple-Punkte am
  globalen 9er-Raster), Bogen-Label Glyph-für-Glyph entlang der
  transformierten Quadratik, `EDGE_BAND_ALPHAS` spiegeln die CSS-Werte.
- `package.json`/`scripts/test-map-renderer.ts` — neues Gate
  **`npm run test:map-renderer`** inkl. Zonen-Asserts: Winkel-Clamp,
  Sperrungs-Leiter, Band-Aufstieg + Kappe, Cicatrix-Arc,
  Ruinstorm-horizontal, Scourge-small.

**Runde 3 — Cicatrix-Geometrie:** zone-2 durch Philipps Editor-Fassung
ersetzt (53 Punkte; die einzige zones.json-Änderung dieser Runde).

**Runde 4 — Session 249 (dieser Abschluss):**

- **Journey-Stationsnamen in der Title-Font.** Ein Welt-Label im aktiven
  Journey-Kontext (`rt-hi`) spricht jetzt die Display-Face exakt wie die
  großen Tier-0-Namen (`.cg-lbl.big`: 16 px, normal, track-08, −14 px) —
  die kursiven Body-Labels der unteren Tiers lasen sich in der Tour fremd.
  Canvas-Parität über ein `hi`-Flag am `LabelSpec` (Stil-Promotion +
  Dust-Offset −10 → −14 + Hit-Rect). Die **Strategie-Ziel-Labels**
  (March of the Legions) wechseln von 7,2-px-Mono-Uppercase auf die
  Display-Face (9 px, gold, mixed case — Cormorant SC setzt selbst
  Kapitälchen); der Canvas-Pfad zeichnet diese Labels nicht (bestehende
  SVG-only-Lage, unverändert).
- **Great-Journeys-Panel.** Eine Intro-Zeile sagt, was eine Journey IST
  („Guided voyages over the chart — choose one and follow its story across
  the stars, station by station."), darunter die drei Ären als
  **ausklappbare Gruppen-Header** (car-Glyph + „M31 · The Horus Heresy" +
  Journey-Zähler rechts; `aria-expanded`); jede offene Gruppe beginnt mit
  einem **Era-Einzeiler** (`ERA_BLURBS`). Verhalten: die aktuelle
  Chart-Edition steht offen, Era-Wechsel und Journey-Start klappen die
  passende Gruppe auf (manuelle Folds anderswo überleben), eine
  zugeklappte Gruppe mit laufender Journey zeigt ein goldenes „active".
  Gilt für Cartouche + Sheet (gemeinsames `VoyageButtons`, jetzt mit
  `era`-Prop); 44-px-Touch-Target im Sheet; `smoke-static` klappt im
  Desktop-Flow erst die M30-Gruppe auf (Chart öffnet auf M42).
- **Ruinstorm neu gezeichnet + leiser.** zone-22 hat eine neue
  24-Punkte-Geometrie nach Philipps grüner Skizze — Screenshot über fünf
  Anker-Welten (Baal/Macragge/Nocturne/Caliban/Terra) auf das Grid
  kalibriert (s ≈ 1,12 px/gu): schlanke Sichel, Nordspitze bei (748, 64),
  Ost-Bauch bis gx 847, West-Ausbuchtung östlich von Nocturne (gx 577),
  Südspitze (736, 711) knapp über Macragge statt vorher gy 877; Baal
  bleibt wie skizziert haarscharf westlich der Kante.
  `ruinstormShadow()` (Lumen-Schnitt) folgt der neuen Form automatisch —
  numerisch verifiziert. **Deckkraft:** Storm-Stipple 0,4 → 0,28
  (SVG-Pattern + Canvas) und die Storm-Randbänder auf den
  0,7-Multiplikator der Necron-Zonen (CSS `.cg-zone.storm .ze1/2/3` +
  Canvas `edgeAlpha`) — bei Ruinstorm-Größe las sich die volle Rand-Tinte
  als massive violette Wand. Gilt konsistent für die ganze Kind-Familie
  (auch Ocularis Malifica auf der M30-Karte).
- **Lab-Boards gelöscht** (`public/lab/zonen-varianten.html`,
  `public/lab/cicatrix-fairing.html`) — Wegwerf-Exploration der
  Zonen-Runde, Alternativen verworfen; Maintainer-Entscheid „löschen".

Dazu fahren die in früheren Runden angepassten Doku-Zeilen mit
(`brain/wiki/worklist.md` + `docs/launch-master-plan.md`: Verweis auf den
Werkstatt-Fahrplan) sowie der Fahrplan-Haken WM-B1 → ✔ 249 und die
nächste freie Session-Nummer 250 in `docs/werkstatt-roadmap.md`.

## Decisions I made

- **Ära-Gruppen default = aktuelle Chart-Edition**, follow-the-chart bei
  Era-Wechsel/Journey-Start, „active"-Badge auf zugeklappter Gruppe — die
  Legenden-Regel „nichts Aktives versteckt sich" auf die Journeys
  übertragen. Umgesetzt als state-adjust-during-render (React-Muster),
  nicht als Effect (`react-hooks/set-state-in-effect`).
- **Strategie-Ziel-Labels bleiben gold** (Abgrenzung zu den bone-farbenen
  Weltnamen) und werden mixed case — Uppercase hätte in der
  Kapitälchen-Face die Versal-Unterscheidung zerstört.
- **Storm-Beruhigung für die Kind-Familie, nicht Ruinstorm-only** — ein
  Vokabular pro Familie ist die Pass-2-Grundregel; der M30-Ocularis
  profitiert mit.
- **Skizze kalibriert statt Freihand übertragen** — die grüne Form wurde
  über die Anker-Welten pixelgenau ins Grid projiziert; Baals
  Haaresbreite westlich der Kante ist aus der Skizze übernommen, nicht
  zufällig.
- **Zoomer-Presets entfernt** (Runde 1, mit Philipp entschieden): die
  Namens-Schwellen sind Insider-Wissen; der Legendeneintrag „World names"
  ersetzt den Anwendungsfall.
- **Rename nur im Display** — `warmasters-web` bleibt id, damit
  `voyage=`-Links und Roster-Keys stabil bleiben.

## Verification

- `npx tsc --noEmit` ✓ · `npx eslint` (geänderte Dateien) ✓ ·
  `npm run test:map-renderer` ✓ (inkl. Ruinstorm-Asserts: Label
  horizontal, kein Arc — gelten auch für die neue Geometrie).
- `npm run build` mit CI-Env (Dummy-`DATABASE_URL`, `SITE_URL`) ✓ und
  **`npm run test:smoke` lokal 20/20 grün** (static + degraded gegen den
  Prod-Build) — nötig, weil der Desktop-Map-Smoke den neuen
  Ära-Gruppen-Klick braucht.
- `ruinstormShadow()`-Ableitung aus der neuen Zone numerisch geprüft
  (Spine + Schatten non-null, N→S).
- Ein Design-Blick auf /map (M31) nach sauberem Server-Neustart: neue
  Sichelform, reduzierte Deckkraft, Journeys-Panel mit Intro/Gruppen,
  follow-the-chart beim M31-Klick. Keine Headless-Loops; **UI-Abnahme
  durch Philipp im Browser erfolgt** („passt").
- Umgebungsnotiz: der laufende Dev-Server servierte einen stalen Chunk
  aus einem früheren Branch-Zwischenstand (`onToggleNames` —
  LegendOverlays crashte in die Error-Boundary). Kur wie dokumentiert:
  Prozessbaum killen, `.next` löschen, ein frischer Server. Die
  Konsolen-Puffer zeigen Alt-Fehler über den Neustart hinaus — beweiskräftig
  ist der frisch servierte Chunk (0× `onToggleNames`, 4× `onCycleNames`).

## Open issues / blockers

- **Zone-Editor-Draft:** Philipps localStorage-Draft (Backup
  `zones-draft-backup-2026-07-18.json` liegt lokal im Root, nicht
  committed) kennt die neue Ruinstorm-Fassung nicht — beim nächsten
  Editor-Besuch Draft angleichen bzw. zurücksetzen (gleiche Lage wie nach
  Session 246/247).
- **Canvas-Pfad ohne Strategie-Ziel-Ringe/-Labels** (March of the
  Legions-Endpunkte sind SVG-only) — bestehende Parität-Lücke, in dieser
  Session nur beobachtet, nicht neu.
- Ruinstorm-Feintuning (Deckkraft/Silhouette) bleibt abnahme-tunebar;
  Philipp hat den aktuellen Stand abgenommen.

## For next session

- Nächster Fahrplan-Posten laut Reihenfolge: **7 · F1-B1 —
  M42-Nachdatierung** (Batches); danach F1-B2 `/now`.
- Falls der Live-Eindruck der leiseren Storm-Familie auf M30 (Ocularis)
  nicht gefällt: die Familie hat jetzt genau zwei Stellschrauben
  (Stipple-Ink, Edge-Multiplikator) an je zwei gespiegelten Orten
  (CSS/decor ↔ canvas-renderer).
