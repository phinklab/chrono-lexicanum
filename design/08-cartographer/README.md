# 08 — Cartographer-Studien (Brief 178, Varianten-Gate)

Standalone-Fassungen des Map-Neubaus, nach dem 184-Muster (kein App-Code,
nichts wird importiert). Echte Daten aus `../data/worlds.js` (Extrakt aus
`scripts/seed-data/map-worlds.json`, map-worlds-v2; seit Runde 5 als **v4**:
Primary-Classification je Welt + Secondary/Tertiary je Werk-Welt —
154 Werk-Welten, 900 Staub-Welten, 13 Regionen, 70 Klassifikationen).
Doppelklick öffnen; Fonts kommen vom Google-CDN (online öffnen), Artwork
relativ aus `../../public/`.

## Runde 5 — I (aktuell zur Review)

`i-maledictum.html` — H nach Philipps Runde-5-Feedback weitergebaut:

- **Cicatrix nach dem Original** (`CicatrixSpine.tsx` der Live-Map): das
  X-Raster IST die Notation — ~900 reguläre Zeichen im triangular/
  brick-Pattern (live default), an den Korridor geclippt, Deckkraft
  fällt zur Kante. In Runs benachbarter Zellen **flammen häretische
  Wörter auf** (DESPAIR, HERESY, … — Buchstaben glitchen durch
  Okkult-Zeichen, die X-e weichen solange). **Hover faded das Zeichen
  aus** (Original-Geste statt Aufblühen). Dazu Totenköpfe auf der Spine
  und drei horizontale INTERDICTED-Label mit ausgesparten Raster-Zonen.
  Zehn Blitze in wechselnden Warp-Farben. Fassung II (Riss +
  warp-getöntes Band) ist Default; I = Raster pur (Original-treueste),
  III = Nebel-Probe.
- **Live-Site-Sprache für alle Flächen** (64-detail-modal / maprail__pop):
  Kurs-Karten, Welt-Popup und Kartusche als rahmenlose, fast-opake
  Glasfläche mit Drop-Shadow + Bone-Lichtkante — **kein Border-Stroke,
  kein Gold-Streifen** mehr. Kurs-Kicker in Cinzel mit Gold-Terminus.
- **Schrift überall größer**: Legende/Census, Popup, Kurs-Karten,
  Planetennamen (`.lbl` 14.5/16px), Regionsnamen.
- **Kurslinien fließen dauerhaft** (marschierende Punkte in Fahrtrichtung),
  zusätzlich zum Etappen-Zeichnen.
- **Vermesser-Schweif = EIN Bild**: der Verlauf wird einmalig per Canvas
  gerechnet (kontinuierlicher Winkel-Verlauf mit Dither — kein Banding,
  keine Einzelteile) und rotiert als ein einziges Bild hinter einem Clip
  aus der Segmentkanten-Silhouette — kein Sprung an Segmentgrenzen,
  kein per-Frame-Neubau. Die Leitlinie bleibt Vektor.
- **Nihilus/Lumen-Schatten radial**: die Kanten laufen als Strahlen von
  Terra durch die Rift-Enden (statt 90°-Ecken), Flächen schließen erst
  an einem Fernkreis r=2600 — beim Pannen keine Overlay-Kanten mehr.
- **Welt-Popup zeigt Secondary/Tertiary Classification** (worlds.js v4;
  Secondary aus `map-worlds.json`, Tertiary direkt aus der SSOT-Excel —
  4 Zeilen, z. B. Vigilus: War World / Genestealer Infested).
- **Census**: „Linked records only"-Toggle (nur Klassifikationen samt
  Welten mit verlinkten Büchern/Podcast-Folgen; Staub fällt weg,
  Zählwerk zählt nur Verzeichnete).
- **Gelbstich der Segment-Flächen raus** (Keil-Füllung entfernt);
  **Staub feiner** (LCG-Streuung in Größe + Helligkeit, immer deutlich
  unter den Werk-Pins); alles Englisch („Star-dust");
  Regie-Panel + **Grain-Regler** (Körnigkeits-Vergleich mit/ohne Artwork).

## Runde 4 — H (Fallback-Fundus)

`h-tenebrae.html` — G nach Philipps Runde-4-Feedback weitergebaut,
Lesbarkeit von F zurückgeholt (von I abgelöst):

- **Nebel-Wash raus:** die violett-rot-blauen Großflächen-Blobs aus G
  lagen über den Labels der Kartenmitte. Der **Warpsturm kommt jetzt in
  drei schaltbaren Fassungen** (Regie-Panel): **I Hochwerk** (Default,
  F-treu — rote Zeichenstreuung, Warpfluss, Blitze, kein Nebel),
  **II Riss** (gezackter Hauptriss + Adern, grafisch, ohne Glow),
  **III Glut** (die G-Nebelfelder, halbiert). Das Glühen hinter
  Eye of Terror / Maelstrom bleibt (dort passt es, Philipps Urteil).
- **Interdicted-Zeichen wieder rot** (wie F), atmen tief rein/raus und
  **blühen unterm Mauszeiger auf** (Hover: Scale + volle Deckkraft;
  unsichtbarer Treffer-Kreis macht die kleinen Kreuze greifbar).
  Interdicted-Schrift im Band jetzt blutrot.
- **Vermesser-Strich als F-Fächer** (Gradient-Keil + Leitlinie), eine
  Spur dezenter als F, Schweif blendet auf **exakt 0**; Länge folgt
  weiter der Segmentkante. Liegt jetzt **über** den Feldern (in G ersoff
  er unterm Sturm).
- **Lumen Astronomican heller** — und das Licht wird **vom Rift
  verschluckt** (Maske schneidet die Scheibe weich am Sturmband ab,
  jenseits liegt Schwärze + „Lux Devorata"-Label). Imperium Nihilus
  unverändert.
- **Kurs-Karten:** jede Routen-Station bekommt eine kinoreife
  Kurzbeschreibung als Karte neben dem Planeten, getaktet mit dem
  Streckenzug; nahe Stationen (Istvaan III/V) **clustern zu einer Karte
  mit Weiter-Pfeil**.
- **Census-Filter statt Index Astartes:** die 70 Primary Classifications
  der SSOT-Excel (`Warhammer_map_SSOT.xlsx`, via `map-worlds.json`)
  tragen die Filtermechanik — elf Gruppen mit Zählwerk + Toggle,
  Unterpunkte klappen auf, jede Klassifikation einzeln schaltbar.
  Tooltip zeigt die echte Klassifikation. Dafür wurde
  `../data/worlds.js` auf **v3** regeneriert (cls-Liste + Index je Welt,
  alle Alt-Felder bit-identisch — a–g rendern unverändert).
- **Regie-Panel** (oben rechts, nur Studie): Artwork-Grund an/aus,
  Schleier-Deckkraft, Artwork-Helligkeit, Sturm-Fassung I/II/III.

## Runde 3 — G (Fallback-Fundus)

Konvergiert auf **eine** Fassung (`g-lumen.html`), alle Runde-3-Punkte:

- **Ein** Vermesser-Strich, extrem dezent, Schweif blendet nach hinten aus,
  Länge folgt an jeder Peilung dem Keil-Außenrand (JS-getrieben — reicht
  auch am tiefsten Ultima-Rand bis zur Segmentkante).
- Polar-Rahmen auf **Portolan-Zartheit** (Keil-Strich 0.13, Ringe 0.055),
  Grund dunkler (Foto 0.13, stärkerer Schleier) für den Zoom.
- **Auspex-Werk bleibt auf Terra**; die Selektion **blüht aus dem Punkt**
  (Ringwerk + Werkpunkte + Vermessungssterne, BtnFx-Geste).
- **Rift = Warpsturm**: violett-rot-blaue Nebelfelder (atmen versetzt),
  Zeichen in vier Flacker-Lagen warp-getönt, **Blitze**, Warpfluss-Linie;
  Interdicted-Schrift klein **im Band** (dreimal, per textPath entlang der
  Krümmung). Stürme (Auge/Maelstrom) ebenfalls warp-getönt, das Auge wirbelt.
- Areale: **Leviathan-Schwarmfeld** (Label im Feld) + **Sautekh-Dynastie**
  (gestufte Grab-Geometrie, Eis-Register).
- **Routen zeichnen sich Station für Station** (Punkt blüht → Etappe zieht
  → nächster Punkt), Strichweg deutlich sichtbarer.
- **Tooltip-Fix** (auch in D/E/F rückportiert): `setPointerCapture` leitet
  `pointerup` aufs SVG um — der Pin-Treffer wird jetzt beim `pointerdown`
  gemerkt. Werke im Tooltip sind Links.
- **Top-100 zuerst** (nach Werkzahl), Rest ab Band 1 oder per
  Legenden-Zeile „Reveal the full census".
- **Instrumente**: Lumen Astronomican (Licht von Terra, dahinter dunkle
  Leere), Imperium Nihilus (Schleier jenseits des Rifts), Index Astartes
  (Fraktions-Linse, kuratierte Demo-Listen — App-Version aus der DB).

## Runde 2 — D / E / F (Fallback-Fundus)

Nach Philipps Feedback zu Runde 1 konvergiert: **klassisches
Vier-Segmenta-Polarlayout** (Redditor-Vorlage `../beispiele/wh40k galaxy
map - small.jpg`: Solar-Kern + gestufte Keilränder um Terra), **C-Optik**
als Grundton, **B-Legende mit größerer Schrift**, Wasserzeichen bleiben,
Punkte/×-Zeichen und Sternenkarten-Hintergrund bleiben. Überall neu:

- **Kind-Icons**: Chaosstern (blutrot), Grabkreis mit Monolith-Strich,
  Flottenkiel, Tor-Raute, Bastion-Quadrat, Xenos-Dreieck, Aeldari-Linse —
  klein gehalten, Planeten bleiben Planeten.
- **Radar-Strich** vom Astronomican (Sichtbarkeit je Fassung).
- **Great Rift ohne Rahmen**: Zeichenstreuung entlang eines unsichtbaren
  Rückgrats, animiert; Warpstürme (Eye of Terror, Maelstrom) als atmende
  Felder mit ×-Streuung.
- **Routen als Toggle** (Indomitus / Häresie): Karte dimmt, Route zeichnet
  sich, Stationswelten bleiben hell inkl. Label.
- **Klick-Tooltip am Pin** statt Seitentafel, mit **einem Werkpunkt je
  Eintrag** um den Selektionsring (Geste der alten Live-Karte).

| Datei | Fassung | Animationsstufe |
|---|---|---|
| `d-quadrant.html` | **D — Quadrant** | Still: Vermesser-Strich 150 s, Rift schimmert in zwei Lagen, Stürme atmen, kein Vox/Auspex-Werk. Der sichere Boden. Sweep-Dezenz laut Runde-3-Feedback am besten getroffen. |
| `e-auspex.html` | **E — Auspex** | Sweet-Spot: sichtbarer Sweep mit Schweif (64 s), Auspex-Werk auf Terra, Rift-Flackern in vier Lagen + Warpfluss-Linie, Leviathan-Schwarmfeld, Vox-Schreiber, Vermessungssterne bei Selektion (BtnFx-Geste). |
| `f-hochwerk.html` | **F — Hochwerk** | Obere Grenze: Doppel-Sweep, Rift-Woge (wandernde Helligkeit), Wirbel im Auge, sechs zyklische Vermessungspunkte, atmende Wasserzeichen, Zoom-Puls, Orbit-Reiter an der Selektion. |

Dieselbe Karte in drei Stufen — jedes Element ist einzeln übertragbar
(z. B. „E, aber mit der Rift-Woge aus F").

## Runde 1 — A / B / C (Fallback-Fundus)

Erste Runde, vor dem Feedback. Bleiben als Fundus liegen.

| Datei | Fassung | Charakter |
|---|---|---|
| `a-portolan.html` | **A — Portolan** | Maximal gestochene Seekarte: Rhumb-Netz vom Astronomican, Segmentum-Küstenlinien, schraffierte Warpstürme („Hic svnt daemones"), Tyraniden-Saum am Ostrand, formcodierte Marker, reiche Doppelrahmen-Kartusche mit Maßstab. |
| `b-votivtafel.html` | **B — Votivtafel** | Die 04-Gewinner-Map weitergedacht: karg und still. Drei Marker-Register (Knochen/Blutrot/Kreuz), Segmentum-Wasserzeichen tragen die Geografie, Kreuzchen-Gradnetz, Vermessungspunkte als einzige Dauerbewegung, eine Kurslinie. |
| `c-observatorium.html` | **C — Observatorium** | Instrumenten-vorwärts: lebendes Auspex-Werk auf Terra, Vox-Schreiber, Rand-Lineale, Koordinaten-/MAG-Readout (SSOT-Pixelraum = Vermesser-Vorschau), Marker Form+Farbe-Hybrid (Eis für Xenos), zwei Kurse mit Ziel-Blüte, weich blendende Labels. |

**Gemeinsame, mit Philipp fixierte Anatomie** (Roast-Runden 2026-07-05):
Vollbild-Chart · Kartuschen-Ouvertüre (Titel verdichtet sich bei erster
Interaktion in die Ecken-Kartusche) · freier Pan/Zoom mit semantischem Zoom
(drei Label-Stufen) · Staub + Werk-Pins (Größe = Werkzahl) · Segmentum-
Sprungmarken · Legende mit kind-Zählwerk + Toggles · Welt-Suche (RET) ·
Klick → Welt-Detail · `prefers-reduced-motion` stellt alles still.
