# design/ — Richtungsstudien (Brief 184)

Wegwerf-Arbeitsmaterial für den Design-Reset (De-Slop Phase 1). **Kein App-Code** —
nichts hier wird gebaut, geroutet oder importiert; Lebensdauer bis nach dem
Design-Language-Pass (Brief 185), dann löschen oder nach `brain/raw/` archivieren
(Ausnahme: `03-plakat/` bleibt als Optik-Reserve für ein anderes Projekt, s. u.).

## Ansehen

Jede HTML-Datei per Doppelklick im Browser öffnen (Web-Fonts kommen vom
Google-CDN, also online betrachten). Einstieg: [`index.html`](./index.html).

**Runde 2 + 3 laden die Artwork-Hintergründe relativ aus `public/`**
(`../../public/img/main-bg.webp` etc.) — die Studien funktionieren nur, solange
der `design/`-Ordner im Repo liegt. Wird eine Datei woandershin kopiert, fehlt
das Hintergrundbild (alles andere funktioniert weiter).

### Runde 3–8 — zur Review (Kathedrale, angewandt)

Nach Philipps Runde-2-Review: **04 Kathedrale gewinnt**. Runde 3 wendet die
Sprache auf die echte Site an — Nachbau, nur Optik, volles Element-Inventar.
**Runde 4**: echtes **Register mit Filtern**, Schriften größer,
**HUD-Instrumente zurück**, Rail-Titel immer sichtbar. **Runde 5**: Register
**strikt an der Live-Struktur** (flache Liste, EIN Sort-Control,
catalogue-row-Anatomie), **Astrolab mittig im Hero**. **Runde 6**: der
Datensatz öffnet als **Popup („die Kapelle")** (Live-@modal-Mechanik),
**Astrolab ohne Zeiger** (die Ringe drehen selbst), **Rubriken-Strich**
statt Nav-Unterstrich, **Vox-Schreiber** oben rechts. **Runde 7** (nach
Review, in place): **Buttons neu gedacht** — die Gold-Eckbeschläge sind raus
(AI-Slop-Verdikt); drei Systeme, über das **Studio-Panel** unten rechts
umschaltbar: *Sternwarte* (Hover: HUD-Ringe hinter der Tafel, vier
Vermessungs-Sterne strahlen nach vorn), *Still* (minimaler Fallback),
*Siegel* (Haarlinien-Siegel links, Gold-Segment läuft um). Die **Kapelle
trägt die volle Buch-Sprache** — Synopsis, Appendix (Dramatis Personae /
Factions / Locations), Motiv-Zeile, Acquire, für alle 22 Zeilen, mit
gestaffelter Ouvertüre; „Lectio Brevis" gestrichen. Dritte Schriftstimme
**Fragment Mono** für Telemetrie (M-Band, Vox, Nummern, Census) — das
Mono-Grimdark zurück im Mix **Karte · Buch · Maschine**; **Wortmarke fix
oben links**; Latein nur noch in gesonderten Elementen;
**Titelschrift-Toggle** auf **Cinzel (Default, wie das Live-Original) /
Bodoni Moda** reduziert. **Runde 8** (nach Review, in place + neue
Blätter): der Kurs-Plotter ist raus (Hintergrund-Verdikt; die Idee lebt
als Karten-Feature/Character-Pathing im Kanon § XV) — dafür die
**Artefakt-Skizze**: ein Gerät zeichnet sich Strich für Strich, dann
beschriften Leader-Lines die Einzelteile (Archiv: *Servo-Schädel* ·
Buch: *Bolter, Godwyn-Pattern*). **Vier Button-Testversionen** über das
Studio-Panel: *Sternwarte* (kein Rahmen — der Punkt vor der Schrift
expandiert beim Hover zum HUD; Zacken-Stern raus), *Sternkarte* (stille
Tafel, HUD links versetzt), *Sternbild* (fünf Sterne verbinden sich),
*Still* (Fallback); das Siegel ist raus. Storage-Keys auf **cl08**
gebumpt (Cinzel + Sternwarte wieder Vorauswahl). Und: **alle weiteren
Seiten außer dem Cartographer als Optik-Mocks**, untereinander verlinkt.
**Runde 9** (nach Review, in place): geteiltes Fundament
**praxis.css/praxis.js** (Keys **cl09**); Hintergrund = **exakt der
Live-BG** (main-bg.webp right bottom auf Hub/Archiv/Ask/Compendium,
vista.webp auf Buch/Entity; Live-Void `#02030a` + Live-Vignette/-Fade,
**Grund-Farb-Picker** im Studio); die **Auspex-Zwillinge** (MainAuspex-
Port, Ringe enger, ohne Sweep) ersetzen Astrolab **und** die
selbstzeichnenden Skizzen (Verdikt: raus); **Wortmarke ohne
Trennpunkt**; Cue-Strich fadet nach unten + **Lichttropfen**;
**Archiv-Türen** Books/Podcasts als erstes Element; **Ask als
Slider-Flow** (ein Pfad, Antwort schiebt weiter) + 3-Stufen-Hierarchie
Faction → Chapter → Entry point; Doppelungen bereinigt; Titelschrift-
**Dropdown** inkl. der fünf lokalen **Cormorant-Familien**; Größen-Floor
13px. `chronik.html` bleibt bewusst auf Runde-8-Stand (Chronicle
ignorieren).

| Datei | Inhalt |
|---|---|
| `07-praxis/praxis.css` / `praxis.js` | **Geteiltes Fundament (Runde 9):** Tokens (Live-Void), Live-BG-System (Foto per `--art`/`--art-pos`, Vignette/Fade per color-mix), Rail, Wortmarke, Vox-Engine (data-lines), Auspex-Bau (MainAuspex-Port), Cue mit Tropfen, Button-Systeme (Sternwarte mit Planeten), Imprimatur, Studio-Panel (Titelschrift-Dropdown + Cormorant-@font-faces, Button-System, Grund-Farb-Picker), Reveal/Scrim |
| `07-praxis/hub.html` | Nachbau der Startseite `/`: Splash (die Wortmarke IST das Hero — „Chrono Lexicanum" ohne Punkt, Auspex-Zwillinge), Praefatio + Suchkonsole + Bestandszeile, Explore-Register (zehn Türen, Marginalien-Gloss), Imprimatur |
| `07-praxis/archiv.html` | Nachbau `/archive`: Hero mit Auspex-Zwillingen, **Archiv-Türen Books/Podcasts (das erste, größte Element)**, Suchkonsole, Filterzeile (Dropdown-Trigger + Sort), Zählzeile, flaches Register (22 Zeilen, Klick → Kapelle mit voller Buch-Sprache + Ouvertüre), Vox-Schreiber, Imprimatur-Fuß |
| `07-praxis/buch.html` | Nachbau `/buch/[slug]` (*A Thousand Sons*): Riesen-Titel statt Cover (vista-BG wie live), M-Band als Rubrik, Katalogisat, Acquire (+ Region), Synopsis, Appendix, Audit-Verweis — dieselbe Sprache wie das Kapelle-Popup (eine View, kein Fork) |
| `07-praxis/chronik.html` | Nachbau `/timeline` (Chronicle) — **bewusst auf Runde-8-Stand** (Philipps Auftrag: Chronicle ignorieren; Live-Optik gefällt) |
| `07-praxis/ask.html` | Nachbau `/ask`: Werkzeug-Tabs, **Slider-Flow** (ein Frage-Pfad, eine Frage sichtbar, Antwort schiebt weiter; Stationen klickbar) → Cogitator-Zeile → Verdikt (Rang-I-Dossier + Ränge II–VI + Responsa + Reset); „One Faction, One Book" in **drei Stufen**: I Faction (18 Banner) → II Chapter (optional) → III Entry point |
| `07-praxis/kompendium.html` | Nachbau `/compendium`: die fünf Türen (Factions führend, je **eine** Zahl-Zeile + kurzer Blurb — Doppelungen raus), Kategorie-Nav ohne Zähler-Badges |
| `07-praxis/fraktion.html` / `welt.html` / `charakter.html` | Entity-Blätter (Thousand Sons / Prospero / Magnus the Red): kompaktes Titelblatt (Riesen-Name, Meta-Zeile raus — Doppelung mit dem Dossier), Dossier-Katalogisat, Record, Related Works, Querverweis-Tafel — echte Blurbs aus den seed-Daten |
| `07-praxis/ci.html` | **Gestaltungskanon**: fünfzehn Tafeln — Grundhaltung, Farbe (Live-Void + Picker), Typografie (Floor 13px, Cormorant-Dropdown), **Buttons (vier Systeme, Sternwarte mit Planeten-Uhrwerk)**, Konsole & Filter (+ Archiv-Türen-Regel), Auszeichnung, Register, **Die Kapelle**, Info-Blöcke, Navigation (Wortmarke ohne Punkt, Cue-Tropfen), **Instrumente (Auspex-Zwillinge)**, Imprimatur (fadendes Lot), Auf-dem-Artwork, Bewegung, **Aha-Konzepte (§ XV)** — jede mit Live-Zuordnung („Ersetzt: …") |

Map-Notiz aus dem Review (für den Map-Neubau): die 04-Votivtafel liest sich
wie eine historische Seekarte („Christopher Columbus") — das, gepaart mit
Animation und dem Design der neuen Karte, wäre der Sweet Spot.

### Runde 2 — entschieden (Philipps Review 2026-07-03: 04 gewinnt)

Nach Philipps Runde-1-Review gesetzt: Artwork-Hintergründe der Live-Site bleiben
(fixes Bild + Dunkel-Scrim beim Scrollen, Mechanik wie `41-site-bg.css` /
`31-catalogue.css`), Riesen-Titel als Buchcover-Ersatz, gothische Grundhaltung.

| Richtung | Haltung | Verdikt |
|---|---|---|
| `04-kathedrale/` | dunkel · Hochschiff, Mittelachse, Didone · serene | **gewinnt** → Basis für Runde 3 |
| `05-kodex/` | dunkel · schwarzes Stundenbuch, Blackletter, Rubrizierung · gothisch | zurückgestellt |
| `06-nekropole/` | dunkel · Inschriften-Register, gemeißelte Versalien, Verdigris · grimdark | zurückgestellt |

### Runde 1 — entschieden (Philipps Review 2026-07-03)

| Richtung | Haltung | Verdikt |
|---|---|---|
| `01-folio/` | licht · gedruckter Bibliothekskatalog · leise | **verworfen** (zu Standard-AI-Slop) |
| `02-kogitator/` | dunkel · Dateninstrument ohne Cosplay · präzise | **verworfen** (altbacken, nicht gothisch) |
| `03-plakat/` | dunkel · brutalistisches Plakat · laut | **außen vor** — cool, aber unpassend für Warhammer; Optik ggf. für ein anderes Projekt von Philipp reserviert. Dateien nicht weiter anfassen. |

Alle Richtungen zeigen **denselben Inhalt** (Archiv-Auswahl, *A Thousand
Sons*, Karte mit selektiertem *Prospero*) mit **echten Daten** aus
`scripts/seed-data/books/*.json`, `book-dates.json` und `map-worlds.json` —
verglichen wird die Sprache, nicht der Stoff.

## Review-Loop (Philipp)

- Dateien direkt editieren; Anmerkungen als HTML-Kommentar in die Datei.
- Jede Seite trägt unten eine aufklappbare **Studien-Notiz**: was die Richtung
  verwirft, was sie vom Bestand behält, Kern-Parameter (Fonts, Farben, Buttons,
  Icon-Politik) als Input für den 185er-Token-Schnitt.
- Farb-/Grundwerte liegen pro Datei oben im `:root`-Block.

## data/worlds.js

Aus `scripts/seed-data/map-worlds.json` generierter Extrakt für die
Map-Mocks (154 Welten mit Werken, 900 Hintergrund-Welten, 13 Region-Pins,
echte Koordinaten). Per `<script src>` eingebunden, damit `file://` ohne
CORS-Probleme funktioniert. Nicht von Hand pflegen — bei Bedarf neu erzeugen.
