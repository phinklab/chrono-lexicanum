---
session: 2026-07-03-184
role: implementer
date: 2026-07-03
status: complete
slug: design-richtungsstudien
parent: 2026-07-03-184
links: [2026-07-02-183, 2026-07-02-181]
commits: []
---

# Design-Richtungsstudien — De-Slop Phase 1 (Product)

## Summary

Drei deutlich divergierende Richtungen × drei Flächen als Standalone-HTML-Studien
unter `design/` — **01 Folio** (licht, gedruckter Bibliothekskatalog), **02 Kogitator**
(dunkles Dateninstrument ohne Cosplay), **03 Plakat** (brutalistisches Schwarzplakat).
Alle drei zeigen bewusst *denselben* Inhalt (Archiv-Auswahl, *A Thousand Sons*,
Karte mit selektiertem Prospero) mit echten Daten, damit Philipp Sprachen statt
Inhalte vergleicht. Meine Empfehlung für 185: **Kogitator als Basissprache** (unten).

**Runde 2 (gleiche Session, nach Philipps Review):** 01 + 02 verworfen, 03 „außen
vor" (Optik ggf. für ein anderes Projekt reserviert). Drei neue Richtungen
**04 Kathedrale / 05 Kodex / 06 Nekropole** — gothisch, grimdark-aber-serene,
monumental, mit den Artwork-Hintergründen der Live-Site (fix + Scroll-Scrim)
und Riesen-Titeln als Cover-Ersatz. Details + neue Empfehlung: § „Runde 2" unten.

**Runde 3 (gleiche Session, nach Philipps Runde-2-Review):** **04 Kathedrale
gewinnt** (Screenshots). Neuer Ordner `design/07-praxis/` — Nachbau der echten
Seiten `/archive` + `/buch` (Standalone-HTML, nur Optik, volles Element-Inventar,
Lade-/Scroll-Animationen) plus **Gestaltungskanon** `ci.html` (Tafeln mit
Live-Zuordnung) und **Titelschrift-Toggle** (seitenübergreifend). Details:
§ „Runde 3" unten.

**Runde 4 (gleiche Session, nach Philipps Runde-3-Review):** Realitäts-Fassung
in place — Register-Table mit Filtern statt Prozession (22 Zeilen, 896er-
Maßstab), Schriften größer, **HUD-Instrumente zurück** (Astrolab +
Vermessungspunkte, gezeichneter Karten-Modus, jede Unterseite), Rail-Titel
permanent sichtbar, Titelschrift-Kandidaten → Italiana / Gilda Display
(filigraner). Details: § „Runde 4" unten.

**Runde 5 (Folge-Session, nach Philipps Runde-4-Review):** Register **strikt
an der Live-Struktur** (flache Liste ohne Ären-Zwischenzeilen, EIN
Sort-Control, catalogue-row-Anatomie), **Astrolab mittig im Hero** wie der
Live-Sweep und feiner gezeichnet, Titelschrift-Kandidaten → **GFS Didot /
Oranienbaum** (per WebSearch im Google-Fonts-Katalog recherchiert;
Italiana/Gilda raus). Details: § „Runde 5" unten.

**Runde 6 (gleiche Folge-Session, nach Philipps Runde-5-Review + Auftrag,
als Design-Agentur zu führen):** Der Datensatz öffnet als **Popup („die
Kapelle")** — Live-@modal-Mechanik, Inhalt in der bestätigten
Buch-Titelblatt-Sprache auf der Mittelachse (Inline-Detail + Meta-Kette
raus); **Astrolab ohne Zeiger** (die Ringe drehen selbst, das Instrument
driftet); **Buttons neu** (Hairline-Rahmen + Gold-Eckbeschläge);
**Rubriken-Strich** statt Nav-Unterstrich; **Vox-Schreiber** oben rechts
(GhostReadout-Erbe, graziler); Titelschriften → **Almendra (Empfehlung) /
Old Standard TT / Gloock** (typologisch verschieden statt drei Didones).
Details: § „Runde 6" unten.

**Runde 7 (Folge-Session, nach Philipps Runde-6-Review):** **Buttons neu
gedacht** (Eckbeschläge = AI-Slop-Verdikt) — drei Systeme, live umschaltbar
über ein Studio-Panel: **Sternwarte** (Philipps Idee: HUD-Ringe hinter der
Tafel, Vermessungs-Sterne strahlen nach vorn), **Still** (Fallback),
**Siegel** (eigener Vorschlag); **Kapelle mit voller Buch-Sprache**
(Synopsis + Appendix mit Dramatis Personae/Factions/Locations + Motive +
Acquire, alle 22 Zeilen, Kapellen-Ouvertüre; „Lectio Brevis" raus);
**dritte Schriftstimme Fragment Mono** (Telemetrie — Karte · Buch ·
Maschine); **Kurs-Plotter** (Route zeichnet sich durchs Hero) + § XV
Aha-Konzept-Katalog; Titelschriften → **Cinzel (Default, wie Original) /
Bodoni Moda**; **Wortmarke fix oben links**. Details: § „Runde 7" unten.

**Runde 8 (Folge-Session, nach Philipps Runde-7-Review):** **Artefakt-Skizze
statt Kurs-Plotter** (Plotter-Verdikt: als Hintergrund uncool — die Idee
wandert als Karten-Feature/Character-Pathing in Kanon § XV): ein Gerät
zeichnet sich Strich für Strich, dann beschriften Leader-Lines die
Einzelteile (Archiv: **Servo-Schädel** · Buch: **Bolter, Godwyn-Pattern**);
**vier Button-Testversionen** (Sternwarte mit Punkt-Expansion nach Philipps
Vorgabe / Sternkarte / Sternbild als neuer eigener Vorschlag / Still —
Siegel + Zacken-Stern raus); **Archivist-Notes geprüft: keine Daten
pro Buch → nichts unters Popup gebaut**; **alle weiteren Seiten außer dem
Cartographer als Optik-Mocks** (hub / chronik / ask / kompendium /
fraktion / welt / charakter, untereinander verlinkt); Storage-Keys auf
cl08 gebumpt (**Cinzel wieder Vorauswahl**). Details: § „Runde 8" unten.

## What I did

- `design/index.html` — neutrale Übersichtsseite (bewusst kein Kandidat): Haltung + Kern-Parameter + Links je Richtung.
- `design/README.md` — Ablage-Zweck, Review-Loop, Lebensdauer (bis nach 185), Herkunft von `data/worlds.js`.
- `design/data/worlds.js` — Extrakt aus `map-worlds.json` (154 Welten mit Werken inkl. erster 3 Titel, 900 Hintergrund-Welten kompakt, 13 Region-Pins, kind-Index). Per `<script src>` eingebunden, weil `fetch()` auf `file://` an CORS scheitert — so bleiben die Studien doppelklick-öffnenbar.
- `design/01-folio/{archiv,buch,map}.html` — Instrument Serif + EB Garamond auf Papier; Katalog mit Marginalien-Nummern und M-Skala in Siegelrot; Buch als Titelblatt + Katalogisat; Karte als gestochene Sterntafel (Symbolformen statt Farbcode, Kartusche, Rand-Annotation).
- `design/02-kogitator/{archiv,buch,map}.html` — Martian Mono + Archivo auf Near-Black mit Phosphor-Amber; Archiv als dichte Datentabelle mit einer aufgeklappten Zeile; Buch als Record-Ansicht mit Feldraster und Block-Meter; Karte als Instrument mit Layer-Panel (voller kind-Farbkontrakt + Zählwerk), Fadenkreuz und angedocktem Welt-Readout.
- `design/03-plakat/{archiv,buch,map}.html` — Anton + Spectral in Schwarz/Knochen/Signalrot; jede Listenzeile ein Plakat, Feature-Buch als roter Block; Buch als Poster-Hero mit Konturziffer XII und Autoren-Balken; Karte mit Regionsnamen als roter Anton-Typo und Knochen-Callout mit Versatz-Schatten.
- `sessions/2026-07-03-184-arch-…md` — aus dem Koordinations-Worktree übernommen (lag dort uncommitted), Statusflip `open → implemented`.

## Decisions I made

- **Gleicher Inhalt in allen drei Richtungen** (A Thousand Sons / Prospero als roter Faden durch alle neun Dateien) — nicht gefordert, aber es macht den Vergleich scharf: identischer Stoff, drei Kostüme.
- **Echte Chronologie ergänzt:** Neben Büchern/Map-Welten habe ich `book-dates.json` gezogen (`settingDateLabel` wie `001–004.M31`, `~`-Präfixe, Anker-Events, Konfidenz) — die M-Skala ist in allen drei Richtungen prominentes Gestaltungselement, weil sie das ehrlichste Alleinstellungsmerkmal der Site ist.
- **Fonts:** Folio = Instrument Serif + EB Garamond; Kogitator = Martian Mono + Archivo; Plakat = Anton + Spectral. Alle Google-CDN, keine Dependency. Cinzel/Cormorant tauchen in keiner Richtung auf (Slop-Marker laut Diagnose). Kleinkapitälchen in Folio als Versalien+Sperrung gefaket statt OT-Feature (Google-Subsets stripped `smcp` unzuverlässig).
- **Icon-Politik radikal:** Null Icons in allen drei Richtungen. Auszeichnung über Typografie (Nummern, Rollen-Codes PRI/SUP/POV/ANT, Stempel, Blockmeter, kartografische Symbolformen). Das testet bewusst die härteste Antwort auf „AI-Hints wie Rauten".
- **Map-Marker dreifach verschieden beantwortet:** Folio = Form trägt die kind-Gruppe (Druck-Symbole, nur Chaos rot); Kogitator = Farbe trägt sie (voller 12er-Kontrakt mit Legende/Zählwerk); Plakat = bewusste Reduktion auf 5 posterlesbare Klassen (Vollfilterung bleibt der Filterleiste). Markergröße = Werkzahl in allen dreien.
- **SVG statt positionierter DIVs** für alle drei Karten — skaliert verlustfrei, 1054 Punkte performant, und die kleinen Render-Skripte (~60 Zeilen, kommentiert) sind für Hand-Edits lesbar.
- **Rationale-Blöcke als aufklappbare `<details>`** unten auf jeder Seite statt sichtbarem Panel — der Rationale-Text soll die Anmutung der Studie nicht kontaminieren.
- **Motion ≈ null:** nur Hover-Zustände. Alle drei Sprachen überleben `prefers-reduced-motion` trivial (Brief-Constraint).

## Verification

- `npm run lint` — pass; `npm run typecheck` — pass (nichts wird importiert, erwartungsgemäß unberührt).
- `git status` — nur `design/**` + Brief-File + dieser Report (Zero-Diff-Constraint erfüllt).
- `node --check` über die drei inline Map-Skripte — pass; `worlds.js` in Node geladen und Struktur verifiziert (12 kinds / 13 regions / 154 featured / 900 background, Prospero mit n=21 vorhanden).
- Datenstichproben gegen Seed-Daten geprüft (Ratings, Setting-Labels, Werkzahlen: Prospero 3 gezeigt + 18 weitere = 21 ✓).
- **Nicht visuell im Browser geprüft** — bewusst: Philipp reviewt per Auge (Manual-verify-Präferenz). Einstieg: `design/index.html` doppelklicken; online öffnen (Fonts kommen vom CDN).

## Open issues / blockers

Keine. Antworten auf die Brief-OQs:

**OQ 1 — Tragfähigste Richtung + 185er-Token-Mapping:** Meine Empfehlung ist
**02 Kogitator**. Begründung: Die Site *ist* funktional ein Instrument (Filter,
Sortierung, Querverweise, Karte, Timeline) — die Instrument-Sprache systemisiert
deshalb am verlustfreisten; sie hat die klarste Antwort auf alle vier
Slop-Diagnosen (Fonts, Typo-Anordnung, Icons, Buttons); sie behält die Dunkelheit
des Bestands (Kontinuität zu Hub-Art und Erwartung ans Genre), ersetzt aber
Blau-Void + Cyan-Glow durch Neutral-Dunkel + einen Akzent; und sie radikalisiert
den Teil des Ist-Stands, der *nicht* in Philipps Diagnose vorkam (die
Mono-Label-DNA). Skizze 185er-Mapping:

- Fonts: `--font-ui` = charaktervolle Mono (Martian Mono o. ä., via next/font), `--font-read` = Archivo; Cinzel/Cormorant/Space Grotesk raus, Newsreader-Entscheid in 185.
- Flächen: `--bg 0b0d0c / --bg-2 101312 / --bg-3 161a18` ersetzen die void-Leiter; Ink-Leiter `d9d6c8 / 8d897a / 565349`; Linien `262b28 / 3a403c`.
- Akzent: genau einer (`--accent` Amber `e8a33b`) + `--warn` Rot; Cyan/Gold/Lum-Zoo pensionieren.
- Buttons: 1px-Rahmen-Rechteck + Amber-Block als Primär; Icon-Politik: Textcodes/Meter statt Glyphen, FactionClassIcon auf Map-Swatches reduzieren oder pensionieren.
- Die **Zwei-Leitern-Architektur** `--fs-read-*` / `--fs-label-*` (Brief 120) bleibt als System erhalten — nur die Gesichter wechseln.

Falls Philipp die Instrument-Härte zu kühl ist: Folio ist die mutigste Aussage
(einzige Licht-Richtung, maximal weit weg vom Genre-Default) und hybridisierbar
(Folio-Lesetypografie auf Kogitator-Flächenlogik). Plakat trägt m. E. als
Akzent-Sprache für Feature-/Marketing-Flächen, ermüdet aber auf datendichten
Screens (Karte/Filter).

**OQ 2 — Erhaltenswert über alle Richtungen (Kandidaten für „bleibt" in 185):**

- Die **M-Skala/`settingDateLabel`** als sichtbares Ordnungsprinzip erster Klasse — alle drei Studien stellen sie prominent (Marginalie / Amber-Spalte / rote Faktenzelle).
- **Datenehrlichkeit** als Designelement: „not yet rated", `~`/`c.`-Präfixe, Konfidenz-Codes, Coverage-Zahlen.
- Der **kind-Gruppen-Kontrakt** der Map (Impl 183) und Markergröße = Werkzahl.
- Era-Gruppierung im Archiv; die Vier-Tool-Navigation als ruhige Kopfzeile.
- Die **warme Knochen-Tinte** (cl-bone-Verwandte tauchen in allen drei Paletten als Papier/Ink wieder auf) — der stillste Kontinuitätsanker des Bestands.
- Kein Bloom, kein Halo, Motion-Zurückhaltung (deckt sich mit Philipps dokumentierter Präferenz).

## For next session

- **Brief 185:** Richtung wählen (ggf. Hybrid benennen), Token-Schnitt nach obiger Skizze, Komponenten-Inventar (Buttons/Chips/Panels/Icons) gegen die neue Sprache mappen; Font-Beschaffung via next/font klären (Martian Mono & Archivo sind auf Google Fonts verfügbar).
- Aufräum-Entscheid `design/` (löschen vs. `brain/raw/`) fällt laut Brief nach 185.
- Beim 185er-Schnitt: `READOUT_LINES`-Latin-Deko (`src/app/archive/page.tsx`) und Auspex/GhostReadout-Chrome explizit auf die Abschussliste — alle drei Studien kommen ohne aus.

## Runde 2 (2026-07-03, nach Philipps Review)

### Verdikt Runde 1 (Philipp, wörtlich sinngemäß)

- **01 Folio: verworfen** — „viel zu sehr Standard-AI-Slop".
- **02 Kogitator: verworfen** — „total altbacken, nicht im Ansatz Finesse, Eleganz, ‚gothisch'". Meine Runde-1-Empfehlung (Kogitator als 185er-Basis) ist damit **obsolet**.
- **03 Plakat: außen vor** — „generell cool, aber total unpassend für Warhammer". Bleibt erhalten; die Optik ist ggf. für ein komplett anderes Projekt von Philipp reserviert. In `design/index.html` + README entsprechend markiert; die Dateien selbst bleiben unangetastet.

### Neue Vorgaben für Runde 2 (Philipp)

1. **Backgrounds bleiben:** das Hintergrund-Artwork der momentanen Seite (und die Backgrounds generell) beibehalten — Artwork hat im ersten Viewport Platz, beim Scrollen kommt der dunkle BG herein.
2. **Grundhaltung:** gothisch — es ist ein *Lexicanum*; Warhammer, grimdark, aber auch „serene", Kathedralen, trotzdem monumental. Finesse und Eleganz.
3. **Riesen-Titel als Cover-Ersatz:** die extrem großen Schriften (besonders Buchtitel) waren gut — ein super-präsenter Titel umgeht das Buchcover-Problem (Laden + Rechte).

### Was ich gebaut habe

Drei neue Richtungen × drei Flächen unter `design/04-…/05-…/06-…` — gleicher
roter Faden (Archiv-Auswahl / *A Thousand Sons* / Prospero), gleiche Datenbasis.
Gemeinsame Mechanik aller drei: fixes Artwork + Fade + scroll-getriebener Scrim,
exakt die Live-Site-Mechanik (`41-site-bg.css` / ScrollScrim in `31-catalogue.css`)
in ~10 Zeilen JS nachgebaut; Artwork-Zuordnung Archiv = `img/main-bg.webp`,
Buch = `timeline/bg/era-horus-heresy.webp` (Era-Art statt Cover — Setting M31),
Map = `img/cartog-holo.webp`; Buch-Titel je 168–190 px als Cover-Ersatz.
Die Bilder kommen **relativ aus `public/`** (`../../public/…` — file:// erlaubt
Bilder ohne CORS); der `design/`-Ordner muss dafür im Repo liegen (README-Hinweis).

- **04 Kathedrale** — das Archiv als Hochschiff. Bodoni Moda (Didone, extremer Strichkontrast) + Cardo; alles auf der Mittelachse, Prozession statt Tabelle, Jochbogen-Ären, Lot-Linien als Scroll-Cue. Stein #0d0d10, Knochen #e4ddcb, EIN Akzent: mattes Gold #a48c52 (nur Linie/Kapitälchen, nie Fläche). Buttons = Doppel-Hairline ohne Kasten. Karte als Votivtafel: drei Marker-Register (Knochen / Blutrot ruinös / Kreuz tot), kind-Kontrakt lebt im Legenden-Zählwerk.
- **05 Kodex** — das Lexicanum wörtlich: schwarzes Stundenbuch. Grenze Gotisch (moderne, lesbare Blackletter) + Alegreya/Alegreya SC; Rubrizierung als authentisches Ordnungssystem (Zinnober #b23a27 ordnet, Gold #b18d43 schmückt), Glossen in der Marginale statt Meta-Chips, illuminierte Initiale (Gold-Versal im Zinnober-Rahmen) im Buch-Detail, asymmetrischer Manuskript-Satzspiegel. Karte als Mappa Mundi: Gold-Punkte, Blackletter-Regionsnamen, Selektion als Randglosse mit gepunkteter Leader-Line.
- **06 Nekropole** — das Archiv als Grabhalle. Eczar (spitze Serifen — Schmiedeeisen, bewusst NICHT Trajan-artig) + Gentium Book Plus; Inschriften-Register auf Basalt #0b0c0b, gemeißelte Versalien mit Gravur-Kante (dunkler Kern + 1px-Lichtkante, kein Glow), römische Ordnungszahlen, Verdigris #79a08c als einziger kalter Akzent, Rost nur fürs Ruinöse. Buch-Hero mit Fakten-Fries (Setting zuerst). Karte = Totenkarte: tote Welten tragen das Dagger-Zeichen † (Schriftzeichen, kein Icon), Prospero-Selektion als „Stele".
- `design/index.html` + `design/README.md` restrukturiert: Runde 2 oben (zur Review), Runde 1 unten mit Status-Tags (verworfen / außen vor) und Verdikt-Notizen.

### Verification Runde 2

- `node --check` über die drei neuen Inline-Map-Skripte — pass; `npm run lint` / `typecheck` — pass (weiterhin nichts importiert).
- `git status` — nur `design/**` + die zwei Session-Files.
- Artwork-Pfade gegen `public/` geprüft (`main-bg.webp`, `era-horus-heresy.webp`, `cartog-holo.webp` existieren).
- Weiterhin nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html`.

### Empfehlung (revidiert)

**04 Kathedrale als 185er-Basissprache.** Sie ist die direkteste Übersetzung von
Philipps eigener Vorgabe (kathedral, serene, monumental, Finesse) und die am
saubersten systemisierbare der drei: Mittelachsen-Komposition und
Hairline-Buttons generalisieren auf alle Flächen, die Didone skaliert vom
896er-Register bis zum 168px-Titel, und die Palette ist der kleinstmögliche
Schnitt (Stein/Knochen/Gold + Blutrot als Semantikfarbe). **Hybrid-Option:**
05er-Elemente als Gewürz — die Rubrizierungs-Logik (eine ordnende Zweitfarbe)
und ggf. Blackletter ausschließlich für den Wortmarken-Schriftzug; die
†-Konvention der 06 für tote Welten würde ich in jedem Fall in den
Map-Neubau (178) übernehmen. Token-Mapping-Skizze: `--font-display` Bodoni Moda,
`--font-read` Cardo (Newsreader-Vergleich in 185), Void-Leiter → #0d0d10/#131318,
Akzent-Zoo → ein Gold + ein Semantik-Rot, Zwei-Leitern-Typoskala (Brief 120)
bleibt als System.

## Runde 3 (2026-07-03, nach Philipps Runde-2-Review)

### Verdikt Runde 2 (Philipp)

- **04 Kathedrale gewinnt.** Alle drei „schönste Stellen"-Screenshots stammen aus 04: der Masthead mit kursivem Riesen-Titel (Map-Hero „The *Cartographer*"), die Archiv-Prozession unter den Jochbogen-Ären, die Synopsis/Appendix-Achse des Buch-Details.
- **05 Kodex / 06 Nekropole: zurückgestellt** (nicht einzeln kommentiert; Runde-3-Basis ist 04).
- **Map-Notiz (für den Map-Neubau, Brief 178):** Die 04-Votivtafel liest sich „noch mehr wie eine Karte von Christopher Columbus — und das ist sehr cool". Sweet Spot laut Philipp: dieser historische Seekarten-Look **gepaart mit Animation und dem Design der neuen Karte**.

### Auftrag Runde 3 (Philipp)

Neuer Ordner; die 04-Idee + Input anwenden: (a) 1–2 Seiten der jetzigen Site
„nachbauen" — **als eigenständige HTML-Seiten, die bestehende Site nicht
anfassen**, ohne Funktionalität, nur Optik; (b) eine **CI-Seite**, die die
Elemente der jetzigen Site (Buttons, Listen, Info-Blöcke usw.) auf
Top-Designer-Niveau zeigt — Ausgangslage für die finale Justierung; (c) ein
**Toggle für die Titelschrift** (~3 ähnliche Kandidaten, „vielleicht geht es
noch besser").

### Was ich gebaut habe (`design/07-praxis/`)

Vor dem Bau die Ist-Struktur **gelesen** (nur gelesen, kein src-Diff):
`src/app/archive/page.tsx` (+ `WerkeFilters`), `src/app/buch/[slug]/page.tsx`
+ `BookDetailView` + `BuyListenActions`, `SiteNav`, `ArchiveFooter`,
`00-tokens.css` — damit der Nachbau das echte Element-Inventar trägt.

- **`archiv.html`** — Nachbau `/archive`: SiteNav-Rail → linke Zahlen-Rail (I–VI, Hover öffnet Titel + Hairline + Latin-Gloss), Hero mit Live-Eyebrow „Archivvm · Librorvm et Vocvm", Suchkonsole als gesetzte Seek-Zeile (Fokus zieht Goldlinie aus der Mitte), Books/Podcasts-Toggle + FilterSelects → Register-Zeilen, Toolbar → Census-Zeile, Catalogue-Rows → aufklappbare Prozessions-Einträge (`<details>`: volle Synopsis, Factions/Facets-Register, Serien-/Record-Zeile, Hairline-Ziel), ArchiveFooter → Imprimatur (Lot-Linie + Wort statt ⚜, Triade, GW-Legal + Impressum/Datenschutz). Bewusst weggelassen: AuspexSweep/GhostReadout/FloatingCoords (Cyan-Tech-Dekor), Icons/Chips, Cover-Thumbnails; der 001-Index wandert als „Record 003 of 896" in den Datensatz.
- **`buch.html`** — Nachbau `/buch/a-thousand-sons`: Riesen-Titel als Cover-Ersatz über dem Era-Artwork, Live-Eyebrow „Lectio Profvnda · Book", Katalogisat, **Acquire** = BuyListenActions (Amazon primär / Black Library / Audible, ↗-Marke) + AudioCredit-Zeile + RegionSwitcher als Register (Germany aktiv), Synopsis mit Versalien-Eingang + Archivar-Aside, Appendix-Spalten (= Chip-Sektionen; Antagonist in Blutrot), Facets → Motiv-Zeile, audit-Link → stiller Provenance-Verweis.
- **`ci.html`** — **Gestaltungskanon**, zwölf Tafeln mit Live-Zuordnung („Ersetzt: …") pro Tafel: § I Grundhaltung (5 Leitsätze) · § II Farbe (8 Swatches, Ein-Akzent-Ordnung) · § III Typografie (Font-Direktvergleich + 8-stufige Typo-Leiter) · § IV Buttons & Verweise (primär/sekundär/extern/ruhend/still) · § V Konsole & Filter (Seek idle+Fokus, Dropdown zu+offen, Mode-Toggle, Region) · § VI Auszeichnung (M-Skala, Facetten-Schlüssel, Rollen, Datenehrlichkeit — statt Chips/Badges) · § VII Listen (Ären-Bogen + auf-/zuklappbarer Eintrag) · § VIII Info-Blöcke (Katalogisat, Aside, Advisory, Empty-State, Census) · § IX Navigation & Chrome (Rail-Zustände, Wortmarke, Lot-Cue) · § X Imprimatur · § XI Auf-dem-Artwork (Vollbreite-Band als Lesbarkeits-Probe) · § XII Bewegung (6 Regeln + wiederholbare Ladesequenz-Demo). Grund bewusst flach (Stein + Korn), damit Elemente isoliert beurteilt werden.
- **Titelschrift-Toggle** (alle drei Seiten, unten rechts, localStorage `cl07-titlefont` → Wahl gilt seitenübergreifend): **Bodoni Moda** (Ist) / **Fraunces** (weicher, tintiger; echte Kursive, variable Achsen) / **Prata** (ruhigste Schnittführung; nur 400, keine Kursive — `em` steht dann aufrecht, per `--disp-em` gelöst). Pro Font eigene Gewichts-/Tracking-Justierung über CSS-Vars. Verworfen als Kandidaten: Playfair Display (Slop-Marker), Marcellus (Trajan-Nähe), Libre Caslon Display (keine Kursive UND weniger eigenständig als Prata).
- **Animation (Philipps „gepaart mit Animation"):** gestaffelte Masthead-Ouvertüre (Eyebrow → Titel mit Letter-Spacing-Settle → Nebenzeilen → Lot-Linie zeichnet sich und atmet), Scroll-Reveals per IntersectionObserver (einmalig), Ären-/Sektions-Hairlines zeichnen sich vom Namen nach außen, Datensatz-Einblendung beim Aufklappen, Button-Hover füllt mit Gold-Hauch von unten. Alles 0.7–1.4 s auf `cubic-bezier(0.22,1,0.36,1)`; `prefers-reduced-motion` schaltet komplett ab.
- `design/index.html` + `README.md`: Runde-3-Sektion oben, Runde 2 auf „entschieden" (04 → Basis, 05/06 → zurückgestellt), Columbus-Map-Notiz festgehalten.

### Verification Runde 3

- `node --check` über die Inline-Skripte der drei neuen Seiten — pass.
- `npm run lint` / `npx tsc --noEmit` — pass (weiterhin nichts importiert, kein src-Diff).
- `git status --short` — nur `design/**` + die zwei Session-Files; `src/**` unangetastet.
- Artwork-Pfade (`main-bg.webp`, `era-horus-heresy.webp`) weiterhin gültig; CI-Seite lädt Artwork nur in § XI.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3.

## Runde 4 (2026-07-03, nach Philipps Runde-3-Review)

### Verdikt Runde 3 (Philipp)

1. **Font-Alternativen zu wenig filigran:** Fraunces + Prata „weniger filigran und nicht schön" — raus.
2. **Realitäts-Check Archiv:** Die Prozession ist keine Liste. 896 Bücher → es braucht **Filter, einen Table** usw.; die Runde-3-Variante ist so nicht umsetzbar.
3. **Schriften teilweise viel zu klein.**
4. **Die animierten HUD-Elemente (AuspexSweep/GhostReadout/FloatingCoord) waren sehr schön** — etwas in dieser Form soll auf **jeder Unterseite** bleiben; idealerweise eleganter, mit schöner Punkt-Animation, mehr im „gezeichneten" Modus bzw. dem Modus der Map-Idee.
5. **Nav links:** der Seitentitel muss **immer sichtbar** sein (nicht nur auf Hover).

### Was ich geändert habe (in place, `design/07-praxis/`)

- **Register statt Prozession (`archiv.html`):** CSS-Grid-Table mit Spalten № / Title (Titelschrift 24px) / Author / Faction / Setting (Sortier-Spalte, Gold) / Year / Format; Ären als Zwischenzeilen; **22 Zeilen** über zwei Ären (Datenbasis um 12 plausible Titel erweitert: Prospero Burns, Eisenstein, Legion, Mechanicum, Know No Fear, Betrayer, Titanicus, Double Eagle, For the Emperor, Nightbringer, Storm of Iron, Fifteen Hours — letzteres mit „not yet dated" als Ehrlichkeits-Demo). Jede Zeile aufklappbar (`<details>`: Synopsis, Factions/Facets, Serie/Standing/Record, Ziel). Filterzeile: Books/Podcasts-Toggle + drei Dropdown-Trigger (Faction / Format / Indexed by). Responsive Spalten-Ausblendung.
- **Schriften angehoben (alle drei Seiten):** Lesetext 17.5 → 18px, Versal-Mikroebenen +1.5–2px (Triade 10.5 → 12px = neue Untergrenze, Meta 12 → 13.5px, Rubriken 12 → 13.5px, Labels 11 → 12.5–13px); in der Kanon-Typoleiter als Regel festgehalten („12px Versalien sind die Untergrenze").
- **Instrumente (neu, auf jeder Unterseite + Kanon-Tafel § X):** (a) **Astrolab** — SVG aus konzentrischen Hairline-Ringen (teils gestrichelt = gezeichnet), 36 Grad-Ticks (pathLength-Trick), Zeiger ~80 s/Umlauf, gegenläufig kreisender Punkt (52 s); (b) **Vermessungspunkte** — Punkt + aufblühender Ring (scale 0.35→1) + gepunktete Leader-Line + Versal-Label, 21-s-Zyklus, gestaffelt via `--d`. Pro Seite kontextualisiert (Archiv: Route/Hit/Index · Buch: Prospero/Nikaea). Gold, Linie, kein Glow — Erbe von AuspexSweep/GhostReadout/FloatingCoord im Karten-Modus der Columbus-Idee. Unter 980px ausgeblendet; reduced-motion zeigt sie statisch.
- **Rail: Titel permanent** — Ziffer + Versal-Titel immer sichtbar (kein Hover-Reveal mehr), aktiver Ort Gold + Unterstrich, Hover hellt auf Knochen. Kanon-Tafel § IX entsprechend.
- **Titelschrift-Kandidaten: Bodoni Moda (Ist) / Italiana / Gilda Display.** Italiana = die filigranste verfügbare Wahl (fast Kupferstich, hauchdünne Grundstriche), Gilda Display = Gravur-Eleganz zwischen beiden. Beide nur 400 ohne Kursive (`--disp-em: normal` → *em* aufrecht). localStorage-Guard auf die neuen Werte umgestellt (alte fraunces/prata-Werte werden ignoriert → Fallback Bodoni).
- Kanon renummeriert (13 Tafeln: Instrumente neu als § X; Imprimatur/Artwork/Bewegung → § XI–XIII); Bewegungs-Regeln ergänzt („Instrumente drehen in Minuten, nicht Sekunden"); index.html/README auf Runde 3+4 aktualisiert.

### Verification Runde 4

- `node --check`-Äquivalent über die Inline-Skripte der drei Seiten — pass; `npm run lint` + `npx tsc --noEmit` — pass; `git status --short` — weiterhin nur `design/**` + zwei Session-Files.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3+4.

### Für den 185er-Schnitt (Stand nach Runde 4)

Der Kanon (`ci.html`) ist als Vorform der Token-/Komponenten-Spec geschrieben:
was Philipp dort bestätigt, lässt sich 1:1 in den Design-Language-Pass
übernehmen (Palette § II, Typo-Leiter § III inkl. finaler Titelschrift-Wahl
aus dem Toggle, Element-Kontrakte § IV–XI inkl. Register-Table § VII und
Instrumente § X, Motion-Regeln § XIII). Die Columbus-Notiz gehört zusätzlich
in den Map-Neubau-Brief (178) — die Instrumenten-Sprache (§ X) ist dafür
bereits der erste Baustein.

## Runde 5 (2026-07-03, nach Philipps Runde-4-Review)

### Verdikt Runde 4 (Philipp)

1. **Titelschriften:** Italiana + Gilda Display „sind nicht schön" — zwei wirklich bessere, filigrane Kandidaten neben Bodoni Moda finden; per WebSearch im Google-Fonts-Katalog recherchieren, nicht raten. Tabu: Cinzel, Cormorant, Playfair, Trajan-artige.
2. **HUD-Instrument:** geht besser (mehr Finesse) und gehört **mittig in den Hero** wie auf der Live-Site (Referenz: `AuspexSweep.tsx` + `.catalogue-hero__sweep` in `31-catalogue.css`).
3. **Archiv-Table strikt an der Live-Struktur** (`src/app/archive/page.tsx`): flache Liste OHNE Ären-Zwischenzeilen (Era nur im aufgeklappten Row-Detail), Sortierung einstufig (EIN Control statt Dropdown + Spaltenmarker), Zeilen-Anatomie wie catalogue-row. Grundregel: an Live-Strukturen orientieren, nur optisch verschönern — keine Struktur-Erfindungen. Schriftgrößen aus Runde 4 behalten.

### Was ich geändert habe (in place, `design/07-praxis/`)

- **Titelschriften (alle drei Seiten + Kanon § III):** Kandidaten jetzt **GFS Didot** (die echte Didot — Digitalisierung der Greek Font Society nach Firmin Didot 1805; flache Haarstrich-Serifen, französische Grazie, **mit echter Kursive** — als einziger Kandidat neben Bodoni) und **Oranienbaum** (klassizistische Display-Antiqua von Oleg Pospelov: dreieckige Serifen + organische Tropfen-Terminals gegen Haarlinien — graviert, monumental, eigenständig; nur 400, keine Kursive → `--disp-em: normal`). Per WebSearch im Google-Fonts-Katalog recherchiert; geprüft und verworfen: **Bona Nova** (die hochkontrastigen Title-/Sforza-Schnitte sind nicht im Google-Katalog, die Basis ist „subtle contrast" — nicht filigran), **DM Serif Display** (Ball-Terminals, zu rund/warm, Template-Ubiquität), **Vidaloka** (weniger eigenständig als Oranienbaum), **Instrument Serif** (Folio-Font → AI-Slop-Nähe), dazu die Tabu-Liste (Playfair/Cormorant/Cinzel/Marcellus & Co.). Toggle-Mechanik umgestellt: `data-font` bodoni/didot/oranienbaum, localStorage-Guard ignoriert alte Werte (italiana/gilda → Fallback Bodoni), CDN-Link `GFS+Didot:ital@0;1` + `Oranienbaum`. Im Kanon-Vergleich zeigt die *em*-Probe („A Thousand *Sons*") die echte Kursive; Oranienbaum rendert bewusst aufrecht statt Browser-Fake-Schräge.
- **Astrolab mittig + feiner (archiv-Hero, buch-Titelblatt, Kanon § X):** Position und Schichtung des Live-Sweeps übernommen — `left: 50%` / `translateX(-50%)` / `top: clamp(…, ~50vh, …)`, Breite ~380–440px, z-index 2 unter dem Titel-Text (z 3): die Ringe umschließen den Titel wie auf der Live-Site. Neu gezeichnet: 72 Grad-Ticks (pathLength-Trick), 12 Stunden-Ticks auf dem Innenring, eine geneigte gestrichelte Bahn (Armillar-Anklang), Zeiger mit **auslaufender Gradient-Spur** (das AuspexSweep-Erbe, `userSpaceOnUse`-LinearGradient), gegenläufig kreisender Punkt mit Haarlinien-Halo, zwei ruhende Blips mit langsamem Zwinkern (9s-Zyklus), Fadenkreuz-Zentrum statt Vollpunkt; Strichstärke 0.7 statt 1. Vermessungspunkte flankieren das Instrument im oberen Zentrum (wie die Live-FloatingCoords bei x 42 %/58 %).
- **Register strikt an Live-Struktur (`archiv.html` + Kanon § V/§ VII):** Ären-Zwischenzeilen und Spaltenkopf entfernt — flache Liste über einer Hairline, 22 Zeilen durchnummeriert; die Ära steht nur noch in der **Meta-Zeile des aufgeklappten Datensatzes** (Format · Era · M-Band in Gold · Jahr — das Pendant zu `catalogue-row__meta`; die M-Skala wandert dorthin, „not yet dated" inklusive). Zeilen-Anatomie = catalogue-row: № / **Titel mit Byline darunter** / Faction / Year / Format / ▾ (dreht beim Aufklappen nach Gold — bleibt in der Zwei-Zeichen-Icon-Politik). Sortierung ist **EIN Control** in der Filterzeile — die Live-Pills als Register-Zeile (Sort — Title A–Z / Newest / Timeline, aktiv: Timeline, passend zur chronologischen Reihung der Mock-Daten); das „Indexed by"-Dropdown und der Gold-Spaltenmarker sind raus. Aus den Datensätzen entfernt, was die Live-Row nicht zeigt (Standing, „Record N of 896"). Kanon: § V zeigt das Sort-Control, § VII die neue Zeilen-Anatomie; Ären-Bogen-Stufe der Typo-Leiter auf „Chronicle/Timeline" umgewidmet.
- Studien-Notizen (alle drei Seiten), `design/index.html`, `design/README.md` auf Runde 5 nachgezogen; Schriftgrößen aus Runde 4 (18px Lesetext, 12px-Versalien-Untergrenze) unangetastet.

### Verification Runde 5

- `node --check` über die Inline-Skripte der drei Seiten — pass.
- Grep `invoke|antml` über `design/` — keine Treffer.
- `git status --short` — nur `design/**` + die zwei Session-Files; `src/**`/`brain/**` unangetastet.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3–5.

## Runde 6 (2026-07-03, nach Philipps Runde-5-Review)

### Verdikt Runde 5 (Philipp) + Prozess-Auftrag

1. **HUD:** keine wandernde Linie — die Kreise sollen **selbst** rotieren und sich leicht, langsam bewegen.
2. **Archiv:** Suche + Liste gut; aber das aufgeklappte Detail ist linksbündig und hässlich, enthält Unnötiges („Novel · 558 pp. · The Horus Heresy · 001 – 004.M31 · 2010"), und die Live-Site öffnet beim „Open the record" ein **Popup** — das wurde bislang ignoriert.
3. **Buch-Seite:** Design-Richtung gefällt — muss aber **ins Popup**, und die Sprache soll auf andere Elemente/Seiten ausstrahlen.
4. **Titelschrift:** noch immer nichts Gutes — weiter suchen.
5. **Buttons:** nur zwei Linien oben/unten wirkt billig — neu denken, eleganter.
6. **Navigation:** Unterstrich zu dick und einfallslos — mehr Eleganz.
7. **Selbstschreib-Element** oben rechts der Live-Site übernehmen, aber graziler und „smoother".
8. **Prozess:** wie eine professionelle Design-/Webengineering-Agentur arbeiten — Führung übernehmen statt Detail-Diktat abwarten.

### Was ich geändert habe (in place, `design/07-praxis/`)

- **Die Kapelle (Datensatz-Popup, `archiv.html` + Kanon NEU § VIII):** Klick auf eine Registerzeile öffnet den Datensatz als Popup — Mechanik wörtlich von der Live-Site übernommen (`@modal`-Intercept + `64-detail-modal.css`): Scrim `rgba(13,13,16,0.78)` + `backdrop-filter: blur(7px)`, zentrierte Karte `min(940px, 94vw)` **ohne gezeichneten Rahmen** (Schatten + Lichtfang-Inset tragen die Kante), Leiste mit „‹ Return to the Register" + „Close", darunter der **Gold-Terminus** (Gradient-Hairline, das Live-Detail-Modal-Motiv). Inhalt in der **Buch-Titelblatt-Sprache auf der Mittelachse**: Rubrik in Gold („Lectio Brevis · Novel"), Riesen-Titel (clamp 40–76px), kursive Byline mit Reihe, **M-Band in Gold** als eigene Zeile, kurze Hairline, Synopsis im Blocksatz (54ch), Acquire-Buttons, stiller Verweis „Lectio Profvnda — open the full record" → buch.html. ESC / Scrim / Close schließen, Fokus kehrt zur Zeile zurück, `body`-Scroll gesperrt. Die 22 Zeilen tragen ihre Popup-Inhalte als `<template>`; das linksbündige Inline-Detail, die Meta-Kette und `<details>` sind komplett raus (die Zeile ist jetzt ein `<button>`). Damit wandert die bestätigte Buch-Optik in die Archiv-Fläche — buch.html bleibt als volle Fassung (Live-Architektur: eine View, voll + Intercept, kein Fork; in der Studien-Notiz dokumentiert).
- **Astrolab ohne Zeiger (alle Instrumente):** Zeiger + Gradient-Spur entfernt. Stattdessen drehen **die Ringe selbst**: Grad-Tick-Ring 220 s, gestrichelter Ring 140 s gegenläufig, zwei geneigte Bahnen präzedieren (160/110 s, die zweite neu), Stunden-Ring 90 s rückwärts, Punkt mit Halo kreist 70 s; Fassung, Kardinal-Ticks, Blips und Fadenkreuz stehen. Dazu **driftet das ganze Instrument** minimal (`translate(6px,-8px)` im 26-s-Atem, eigener Wrapper unter dem Positions-Transform). Kanon § XI + Bewegungsregeln (§ XIV) entsprechend umgeschrieben.
- **Buttons neu (alle Seiten + Kanon § IV):** Die zwei nackten Querlinien sind raus. Neues System „beschlagene Tafel": kaum sichtbarer Hairline-Rahmen (`--hair-soft`), an zwei Ecken (oben links / unten rechts) **Gold-Eckbeschläge** (1px-Winkel, 10px; primär 14px + Goldschrift); beim Hover wachsen die Beschläge die Kanten entlang (`width/height → 100%`), bis sich der Rahmen in Gold schließt, plus Hauch Gold-Grund. Kein Schatten, keine Fläche. Grundhaltung-Tenet III im Kanon angepasst.
- **Navigation (alle Seiten + Kanon § X):** Aktivmarker ist der **Rubriken-Strich** — ein 1px-Gold-Lot in der Marginalie vor der Zeile (wächst aus der Mitte, 20px), dazu Goldschrift minimal weiter gesperrt; Hover: kürzeres Knochen-Lot + Aufhellen. Der Unterstrich ist überall aus der Nav raus.
- **Vox-Schreiber (archiv + buch oben rechts, Kanon § XI live):** GhostReadout-Nachfolger, graziler: max. drei rechtsbündige Versal-Zeilen (10.5px/0.26em) mit Helligkeits-Rampe (0.16/0.3/0.55), Zeilen schreiben sich **Zeichen für Zeichen** (~34–62 ms, leicht unregelmäßig), jedes Zeichen **fadet ein** (0.5 s) statt hart anzuschlagen, Caret ist ein **1px-Gold-Strich** mit weichem Blinken (kein ▌-Block), fertige Zeilen ruhen 3.6 s, alte steigen 10px und vergehen (1.2 s). Inhalte pro Seite kontextualisiert (Archiv: Signatur/Querverweis/Zugriff · Buch: Prospero/Nikaea/Audio). `prefers-reduced-motion`: komplett aus.
- **Titelschriften (alle Seiten + Kanon § III):** Raus aus der Didone-Spur — drei **typologisch verschiedene** Kandidaten, per WebSearch im Google-Fonts-Katalog verifiziert: **Almendra** (Empfehlung + Default; Ana Sanfelippo — kalligrafische Antiqua nach Kanzlei-/Gotisch-Händen, laut Spezifikation „many details appear … in huge sizes", echte Kursive → die Kathedrale ohne Blackletter-Cosplay), **Old Standard TT** (Alexey Kryukov — Klassizistin der Lexika/wissenschaftlichen Editionen des 19. Jh., echte Kursive; konzeptioneller Archiv-Ton), **Gloock** (Duarte Pinto — zeitgenössische High-Contrast-Display „intended for display use", nur 400, keine Kursive → `--disp-em: normal`); **Bodoni Moda** bleibt als Kontroll-Kandidat im Toggle. Geprüft und verworfen: **Półtawski Nowy** (Machalski/Kosmynka/Wieluńska-Revival — schön, aber laut Spezifikation Textschnitt „for typesetting in sizes from 10 to 18 pt", moderater Kontrast → nicht display-filigran). GFS Didot + Oranienbaum raus. Toggle: 4 Buttons, Default Almendra ohne `data-font`-Attribut, Guard akzeptiert nur die vier neuen Werte.
- **Docs:** Studien-Notizen (alle drei Seiten) auf Runde 6, Kanon-Tafeln renummeriert (§ VIII Kapelle NEU; Info-Blöcke→IX, Navigation→X, Instrumente→XI, Imprimatur→XII, Auf-dem-Artwork→XIII, Bewegung→XIV), `design/index.html` + `design/README.md` nachgezogen.

### Verification Runde 6

- `node --check` über die Inline-Skripte der drei Seiten — pass.
- Grep `invoke|antml` über `design/` — keine Treffer.
- `git status --short` — nur `design/**` + die zwei Session-Files; `src/**`/`brain/**` unangetastet.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3–6.

## Runde 7 (2026-07-03, nach Philipps Runde-6-Review)

### Verdikt Runde 6 (Philipp)

1. **Buttons: „total AI-Slop"** — vor allem die goldenen Ecken; kein typischer AI-Slop im Design. Auftrag dreiteilig: (1.1) kreative Variante im HUD-/Sternenkarten-Geist — Hover lässt im Hintergrund ein reduziert sichtbares minimales HUD-Element erscheinen (2–3 Ringe, leicht drehend), im Vordergrund „strahlen" 3–4 kleine Stern-/Planeten-Punkte nach vorn (Referenz `design/beispiele/Bsp Button.txt` — ein Uiverse-artiger React-Button mit herausfliegenden Sparkle-SVGs); (1.2) ein minimaler Fallback zum Sofort-Nutzen; (1.3) ein eigener Vorschlag.
2. **Popup:** sieht gut aus, enthält aber nicht die geliebten Buch-Seiten-Sektionen — vor allem **Synopsis, dann Appendix und was danach folgt**.
3. Im Popup **fehlen Factions, Facets, Locations, Characters**.
4. **Genereller Stil:** Entdecker/Columbus-Seefahrt + Archivum (Bücher/Schriften) + das „moderne" Grimdark, das ursprünglich die Mono-Schrift trug — als Mix. (4.1) Dazu animierte „Aha"-Elemente formulieren (z. B. moderne Interpretation eines Raumfahrt-Routenplaners) — super ansprechend, 40k-Essenz, ohne auf den ersten Blick total Sci-Fi zu schreien.
5. **Navigation:** diese Variante gefällt besser als das Original — bleibt.
6. **Headline-Schriften gefallen nicht** — eine Variante **Cinzel wie im Original** bauen, **Bodoni Moda** lassen; die Titelschrift justiert Philipp am Ende händisch.
7. **Schrift-/Inhalts-Clutter vermeiden:** „Lectio Brevis" im Popup ist überflüssig und fliegt; Pre-/Subheadline-Stil bleibt, aber nur mit relevanten Infos. Latein-Elemente nur in gesonderten Sachen (Selbstschreiber oben rechts, Background-Animationen).
8. **„Chrono · Lexicanum" top center sieht nicht gut aus.**

### Was ich geändert habe (in place, `design/07-praxis/`)

- **Buttons — drei Systeme (alle Seiten + Kanon § IV), live umschaltbar:** Das fontpick-Panel ist zum **Studio-Panel** erweitert (zweite Zeile „Schaltfläche", localStorage `cl07-btnstyle`, gilt seitenübergreifend; `html[data-btn]`). (a) **Sternwarte** (Default; Philipps 1.1): der Button ruht als Hairline-Tafel; beim Hover erscheint dahinter ein minimales HUD — zwei Haarlinien-Ringe drehen langsam (26/17 s, gegenläufig; per JS injiziertes `.fx`-SVG, z-index −1 unter dem transparenten Button-Grund), und vier Vermessungs-Sterne (1.5–3 px, einer als feines Linienkreuz) strahlen gestaffelt von der Mitte nach vorn (transition-delays 0.03–0.22 s) — die Glow-Drop-Shadows des Beispiels bewusst NICHT übernommen (No-Glow-Regel). (b) **Still** (1.2, Fallback = CSS-Grundstil, trägt ohne JS): Hairline-Rahmen, Hover färbt Rahmen + Schrift nach Gold; primär Gold ab Ruhe. (c) **Siegel** (1.3, eigener Vorschlag): rahmenlose leise Tafel (Knochen-Fläche 4 %), links ein Haarlinien-Siegel (16px-Ring + Punkt, reine Pseudo-Elemente); Hover setzt ein Gold-Segment in Umlauf (`border-top-color` + Rotation, 2.4 s) — Kompass richtet sich ein. In `ci.html` § IV stehen alle drei nebeneinander (Container-`data-btn`, kein Panel-Zwang); Empfehlung dort: Sternwarte für Acquire, Siegel als Zweitsystem.
- **Kapelle mit voller Buch-Sprache (archiv.html, alle 22 Templates + Kanon § VIII):** Rubrik → nur noch **„Novel"** („Lectio Brevis" raus, Punkt 7), M-Band bleibt eigene Gold-Zeile (jetzt Mono); dann **Sektions-Rubriken mit Hairline-Flügeln** (`.k-section`, die Buch-Sprache auf Popup-Maß): **Synopsis** (Blocksatz, `::first-line`-Versalien-Eingang) → **Appendix** (3-Spalten-Grid: Dramatis Personae / Factions / Locations, Rollen kursiv, Antagonist in Blutrot — Live-Inventar aus `BookDetailView.tsx`) → **Motiv-Zeile** (Facets) → **Acquire** → „Open the full record →". Appendix-/Motiv-Daten für alle 22 Bücher aus Kanon-Wissen verfasst (variierende Dichte, ehrlich). Dazu **Kapellen-Ouvertüre:** die Template-Knoten werden frisch eingesetzt, CSS-Animationen staffeln Rubrik → Titel → Byline → M-Band → Sektionen (0.05–0.34 s Delays).
- **Dritte Schriftstimme Fragment Mono (alle Seiten + Kanon § III):** Telemetrie-Register für M-Band/k-chrono, Vox-Zeilen, Register-Nummern + Jahre, Census, Katalogisat-Setting, Rail-Ziffern, Instrument-/Routen-Labels — nie Lesetext, nie Titel. Das ist Philipps Punkt 4 als System: **Karte** (Instrumente) · **Buch** (Cardo + Titelschrift) · **Maschine** (Mono) — im Kanon als neues Grundhaltungs-Tenet VI festgeschrieben. Fragment Mono gewählt (Helvetica-basierte Mono, kühl-präzise, OFL; nur 400 + Italic — für 10–13px-Versalien-Telemetrie ausreichend), Tracking gegenüber Cardo-Versalien reduziert (Mono ist von Natur weit).
- **Kurs-Plotter (Punkt 4.1, gebaut; archiv-Hero, buch-Titelblatt, Kanon § XI live):** Full-Bleed-SVG-Ebene (z 1, unter Astrolab/Titel): eine **gepunktete Route zeichnet sich** im 40-s-Zyklus (Masken-Trick: ein `stroke-dashoffset`-Draw-Pfad maskiert die gepunktete Bahn — so „zeichnet" sich eine gepunktete Linie ohne Marching-Ants), Etappen-Ticks tauchen auf, wenn der Kurs sie passiert (liegen mit in der Maske), das Ziel **blüht als Vermessungsring**, Labels in Mono. Archiv: Terra → Baal (ersetzt zwei der drei Survey-Punkte); Buch: Terra → Prospero (Magnus' Warnruf; ersetzt den redundanten Prospero-Survey). `prefers-reduced-motion`: statisch voll gezeichnet. **Weitere Aha-Ideen formuliert statt gebaut** — neue Kanon-Tafel **§ XV** mit sechs Konzepten (Karten-Plotter datengetrieben für 178, Titel-Passage via View-Transitions, Tiefenlot/M-Skala-Scroll, Auspex-Triangulation, Vox-Störung, Mini-Orrery im Katalogisat) inkl. Auswahlkriterium (erweitern die drei Register, überleben reduced-motion).
- **Titelschriften (alle Seiten + Kanon § III):** Toggle auf **Cinzel** (Default — „wie im Original"; Kleinbuchstaben rendern als Kapitälchen, keine Kursive → `--disp-em: normal`) und **Bodoni Moda** reduziert; Almendra / Old Standard TT / Gloock raus, localStorage-Guard akzeptiert nur die zwei neuen Werte. CDN-Link entsprechend verschlankt (+ Fragment Mono).
- **Wortmarke (Punkt 8):** `header.running` (Top-Center) ersatzlos raus; stattdessen `.brand` **fix oben links** (13px Titelschrift-Versalien, Trennpunkt in Gold) — Gegenstück zum Vox rechts, das Top-Center gehört dem Hero. Kanon § X (Setzung + Anno) angepasst.
- **Latein-Bereinigung (Punkt 7):** Rubriken/Inhalts-Text englisch — archiv-Hero-Eyebrow „Archivvm · Librorvm et Vocvm" → „The Index · Books & Voices"; buch-Eyebrow „Lectio Profvnda · Book" → **das M-Band als Rubrik** („001 – 004.M31 · The Horus Heresy", Era dafür aus der facts-Zeile raus); k-goto → „Open the full record →"; Imprimatur-Untertitel + Triade englisch („From darkness, knowledge"); Katalogisat-Record-Note „Archivvm Librorvm" → „archive index". Latein bleibt in den gesonderten Elementen: Vox-Zeilen, Instrument-/Survey-Labels, das Siegelwort „Imprimatur".
- **Docs:** Studien-Notizen (alle drei Seiten) auf Runde 7, Kanon-Tenet III (Buttons) umformuliert + Tenet VI neu, Bewegungsregeln ergänzt (Kapellen-Ouvertüre, Kurs-Plotter, Button-Instrumente), `design/index.html` + `design/README.md` nachgezogen.

### Verification Runde 7

- `node --check` über die Inline-Skripte der drei Seiten — pass.
- Grep `invoke|antml` über `design/` — keine Treffer.
- `git status --short` — nur `design/**` + die zwei Session-Files; `src/**`/`brain/**` unangetastet.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3–7.

## Runde 8 (2026-07-03, nach Philipps Runde-7-Review)

### Verdikt Runde 7 (Philipp)

1. **Kurs-Plotter im Hintergrund: nicht gut** — „absolut uncool, sieht schlecht aus"; evtl. für die Map nutzbar (Character-Pathings). Neue Idee stattdessen: eine **Skizze zeichnet sich** — Linien kommen nach und nach, dann fahren Striche aus und beschriften Einzelteile (Beispiel: Bolter-Skizze); Hauptsache, etwas Cooles wird „gebaut".
2. **Popup deutlich besser**; Wunsch: der Archivar-Aside der Buch-Seite („The archivist notes: …") auch unter der Popup-Synopsis — **falls es solche Notizen pro Buch gibt**; wenn nein, nichts bauen und sagen.
3. **Alle weiteren Seiten außer dem Cartographer nachbauen** — nicht funktional, nur so viel Interaktion, dass man sie sich vorstellen kann; Vergleich zur Live-Variante.
4. **Buttons:** Sternwarte-Richtung „total cool", aber der große Zacken-Stern ist unschön (Punkte reichen); Wunsch-Variante: **ohne Borderline, ein Punkt vor der Schrift, aus dem das Moving-Element beim Hover expandiert**; alternativ/zusätzlich den Effekt **links versetzt** statt mittig, ggf. mit dem stillen Siegel-Grund; **Siegel-System gefällt gar nicht** → raus; Still bleibt Fallback; dazu ein neuer eigener Vorschlag → **vier Testversionen**.
5. **Cinzel wieder als vorausgewählter Standard**, Toggle bleibt.

### Was ich geändert/gebaut habe (`design/07-praxis/`)

- **Artefakt-Skizze (archiv + buch + Kanon § XI, ersetzt den Kurs-Plotter komplett):** Full-Hero-SVG-Ebene (z 1, unter Astrolab/Titel), 46-s-Zyklus in vier Zeichen-Akten (`skDrawA–D`: gestaffelte `stroke-dashoffset`-Fenster über `pathLength="1"`), dann fahren **gepunktete Leader-Lines** aus (`skLead`) und die **Mono-Beschriftungen** der Einzelteile faden ein (`skLabel`); unten eine Kartuschen-Zeile wie in einem Folianten; am Zyklusende vergeht das Blatt und zeichnet sich neu; reduced-motion zeigt es statisch fertig. **archiv.html: Servo-Schädel** (das Arbeitstier des Archivs — Kranium/Kiefer → Optik + Zahnreihe → Vox-Antenne + Suspensor-Feldring → Mechadendrit; Labels OPTIC · AUSPEX / VOX ANTENNA / SUSPENSOR · SILENT / MECHADENDRITE; „Plate IV · Servo-Skvll · Archive Pattern"), oben links. **buch.html: Bolter** (Philipps Beispiel — Gehäuse/Lauf/Mündung → Visier + Kastenmagazin → Griffstück/Abzugsbügel → explodierte Bolt-Patrone; Labels SIGHT · AUSPEX LINK / MUZZLE BRAKE / MAGAZINE · BOX / TRIGGER GROUP / BOLT · CAL .75; „Plate XII · Bolter · Godwyn Pattern"), oben rechts (der Nikaea-Vermessungspunkt ist dafür nach links gewandert). Kanon § XI zeigt den Servo-Schädel live im Demo-Band; § XIV-Bewegungsregel und § XV umformuliert (Plotter → Cartographer-Konzept + Character-Pathing).
- **Buttons — vier Testversionen** (Studio-Panel, `html[data-btn]`, alle Seiten + Kanon § IV nebeneinander): **Sternwarte** (`orrery`, Default; Philipps Vorgabe: `border-color: transparent`, ein 4px-Punkt vor der Schrift; beim Hover wächst der Punkt (scale 1.7 → Gold), die Haarlinien-Ringe **blühen aus genau diesem Punkt auf** (scale 0.08 → 1, Ringe/Sterne auf `left: 24px` verankert statt Button-Mitte) und **drei** Vermessungspunkte strahlen aus ihm heraus — der Zacken-Stern (f3-Linienkreuz) ist ersatzlos raus); **Sternkarte** (`chart`; der stille rahmenlose Grund des alten Siegels — Knochen 4 % —, das HUD liegt bei `left: 22%` **links versetzt** hinter der Tafel); **Sternbild** (`sign`, neuer eigener Vorschlag: Hairline-Tafel; beim Hover verbinden sich fünf Sterne hinter der Schrift zu einem Sternbild — die Polyline zeichnet sich per `stroke-dashoffset`-Transition in ~1,2 s, die Punkte blühen gestaffelt (Delays 0.08–0.98 s), beim Verlassen vergeht es); **Still** (Fallback, unverändert). Siegel-System komplett entfernt. Die injizierte `.fx`-Struktur trägt jetzt Ringe + drei Punkte + Sternbild-SVG; per-System heben nur die eigenen Hover-Regeln die Teile an.
- **Archivist-Notes (Punkt 2) — geprüft, bewusst NICHT gebaut:** Die Datenlage gibt es nicht her. `curation` hat exakt synopsis/facetIds/factions/locations/characters/flags/rating (896/896 geprüft) — **kein Notiz-Feld**; das `notes`-Feld der Buch-JSONs ist Pipeline-Telemetrie (60/896, ausschließlich Anthologie-Hinweise wie „Collection/anthology row present …"). Der Aside auf buch.html („paired most naturally with Prospero Burns …") ist von mir verfasst und bleibt dort als Muster stehen; unter der Popup-Synopsis wurde nichts ergänzt. In beiden Studien-Notizen dokumentiert, inkl. Vorschlag `curation.archivistNote` als kuratiertes Feld für einen späteren Daten-Pass (Kandidat für den Weekly-Refresh-/Kurations-Strang).
- **Sieben neue Seiten-Mocks** (nur Optik + vorstellbare Interaktion, vor dem Bau die Live-Referenzen gelesen — page.tsx/HomeExplore/ChronicleStage/CinematicView/IndexView/AskClient/ask-questions.json/EntityView/compendium/categories + blurb-Seeds): **hub.html** (drei Akte wie live: Splash — die Wortmarke IST das Hero, die fixe Brand-Zeile entfällt nur hier; Praefatio mit Suchkonsole + Bestandszeile; Explore-Register: zehn Türen in drei Gruppen mit römischer Nummer, Titelschrift, kursiver Beschreibung und dem Live-**Marginalien-Gloss** als Hover-Element in Mono-Latein — als Maschinen-Register lizenziert). **chronik.html** (Era-Band als Stationsleiste mit acht Kapiteln + Gold-Fill; View-Toggle Cinematic/Index als Register-Zeile mit Anker-Sprung; Cine-Bühne: Era-Rubrik in Mono, Riesen-Titel, Event-Dossier in der Buch-Titelblatt-Sprache mit Librarium-Zeilen (BOOK/PODCAST in Mono · Titelschrift · kursives Meta); die 3D-Perlenkette der Live-Site zur flachen **Etappen-Leiste** übersetzt; Terminus mit Next-Era-Button; Index-Register mit Tier-Zeichen ◈◆○, aufklappbaren Zeilen und „Open in Cinematic →"; Events = kanonisch plausible M31-Demo-Daten). **ask.html** (Werkzeug-Tabs; die vier Fragen mit den wörtlichen Live-Options-Labels als **Wahlzettel-Zeilen mit Punkt** — dieselbe Punkt-DNA wie die Sternwarte; **klickbarer Flow:** vier Antworten → Cogitator-Zeile (1,7 s) → Verdikt mit Rang-I-Dossier, Rängen II–VI, Responsa-Zeile + Reset; „One Faction, One Book" mit 18-Banner-Register, Kapitel-Zeile, Entry-point-Tafel). **kompendium.html** (die fünf Türen mit Coverage-Zahlen, Factions führend; Kategorie-Nav mit Zählern; Sigils weggelassen — Icon-Politik). **fraktion.html / welt.html / charakter.html** (eine Entity-Schablone wie die Live-EntityView: kompaktes Titelblatt mit Riesen-Namen, Dossier-Katalogisat, Record mit kuratiertem Blurb + Quelle/Konfidenz, Related Works als Register mit kursiven Rollen, Querverweis-Tafel; echte Blurbs aus faction-/location-/character-blurbs.json, Prospero mit dem echten n=21-Werkbestand). Alle Seiten untereinander verlinkt (Rail, Türen, Katalogisat/Appendix-Querverweise, Kapelle → buch.html); Rail-Links auch in archiv/buch nachgezogen. Artwork-Zuordnung: hub → hub.webp (wie live), chronik → era-horus-heresy.webp, Entity → vista.webp (wie live); **Design-Entscheide:** ask → oracle.webp und kompendium → librarium.webp statt des Live-main-bg (eigenes Blatt pro Werkzeug; Einzeiler-Revert möglich).
- **Cinzel wieder Vorauswahl (Punkt 5):** Cinzel war im Code bereits Default — Philipps Browser hielt aber die alte localStorage-Wahl. Deshalb beide Keys auf **cl08** gebumpt (`cl08-titlefont` / `cl08-btnstyle`): alte Werte greifen nicht mehr, jede Seite startet mit Cinzel + Sternwarte; der Toggle bleibt.
- **Docs:** Studien-Notizen aller Seiten auf Runde 8 (jede neue Seite trägt ihre eigene mit „bewusst weggelassen"-Absatz), `design/index.html` + `design/README.md` nachgezogen (Datei-Tabelle um die sieben Blätter erweitert).

### Verification Runde 8

- `node --check` über die Inline-Skripte aller **zehn** 07-Seiten — pass.
- Grep `invoke|antml` über `design/` — keine Treffer; Grep `cl07|data-btn="seal"|fx-star f4|routeMask` über `design/07-praxis/` — keine Treffer (Altlasten vollständig raus).
- Artwork-Pfade geprüft: hub/oracle/librarium/vista.webp + era-horus-heresy.webp existieren in `public/`.
- `git status --short` — nur `design/**` + die zwei Session-Files, alles untracked, **nichts committet** (Auftrag: nicht committen bis „fertig"); `src/**`/`brain/**` unangetastet.
- Nicht visuell geprüft — Philipps Auge, Einstieg `design/index.html` → Runde 3–8 (oder direkt `07-praxis/hub.html` für den Durchklick Hub → Archiv → Kapelle → Buch → Entity).

## Runde 9 (2026-07-03, nach Philipps Runde-8-Review)

### Verdikt Runde 8 (Philipp)

1. Der **Trennpunkt** in „Chrono · Lexicanum" muss raus.
2. **Hintergrund = exakt der Live-BG** — die Mocks trugen noch „alte" BGs; live ist nur ein Bild-BG.
3. Die **selbstzeichnenden SVGs (Bolter, Servo-Schädel) raus** — „grauenvoll schlecht".
4. Als **Hero-HUD die beiden Elemente der Live-Site** (chrono-lexicanum.vercel.app) übernehmen — nur die Circles eines Elements nicht so weit auseinander; **Position wie live**.
5. **Schriftarten teilweise deutlich zu klein.**
6. **„Scroll to advance" braucht eine schöne Animation**, die zeigt, dass man scrollen kann.
7. **Ask:** Hierarchie klarer — Faction → Subfactions (wo vorhanden) → Entry-point-Buch.
8. Das **Strich-Element** vor „Search the archive" etc. ist live besser: **nach unten hin gefadet** (Screenshot-Referenz).
9. **Grund zu hell** + Farbe unklar → **Regler/Color-Wheel** zum Selber-Picken.
10. **Archive of Books / Podcasts DEUTLICH präsenter** — das ist die Haupt-Wahl.
11. **Ask-UX:** Live-Idee besser — ein Timeline-Pfad, Klick schiebt wie ein Slider weiter; nicht untereinander.
12. **Sternwarte bestätigt** (kein Rahmen, Punkt expandiert = „sieht SUPER aus") — dazu noch dezente Dauerbewegung in Planeten/Elementen, „dann nehmen wir das".
13. **Compendium doppelt gemoppelt** („20 sons of the Emperor" + „20 Primarchs") — jede Seite auf Doppelungen prüfen, ersten Infoload minimieren.
14. **Chronicle ignorieren** (Live-Optik gut; wird erst nach Home/Archive/Compendium/Ask angefasst).
15. **Cormorant als Titelschrift probieren** — Dropdown mit allen lokalen Familien (design/beispiele/Cormorant_Webfonts_v4.002).

### Was ich geändert/gebaut habe (`design/07-praxis/`)

- **Geteiltes Fundament `praxis.css` + `praxis.js` (neu):** Bis Runde 8 trug jede Seite Kopien derselben Blöcke; die Review-Punkte (BG, Auspex, Cue, Größen, Studio) hätten neunmal dupliziert werden müssen. Jetzt EINMAL: Tokens, Live-BG-System, Rail/Wortmarke/Vox, Auspex-Bau, Cue, Buttons, Imprimatur, Studio-Panel, Reveal/Scrim. Seiten laden praxis.css vor ihrem eigenen `<style>` (Seiten-CSS gewinnt), praxis.js vor ihrem Seiten-Skript. hub/kompendium/buch/entity brauchen gar kein eigenes Skript mehr.
- **(1) Trennpunkt raus:** Wortmarke heißt überall „Chrono Lexicanum" — Hero (hub), fixe Brand-Zeile, Imprimatur-Unterzeile, Kolophone, Kanon § X/§ XII.
- **(2) Hintergrund = Live:** SiteBackground-Recherche — live laufen Hub/Archive/Compendium/Ask alle auf `variant="main"` (main-bg.webp, right bottom) und Buch/Entity auf `vista` (50 % 22–32 %). Genau so übernommen (hub.webp-, oracle-, librarium-, era-Artwork-Entscheide der Vorrunden zurückgenommen); dazu die Live-Schichten (Vignette + hub-Fade + Grain 0.12) über dem **Live-Void #02030a** statt des zu hellen #0d0d10. Alle Fade-Stufen komponieren per `color-mix` aus `--void`.
- **(9) Grund-Farb-Picker:** neue Studio-Zeile „Grund" — natives Color-Wheel (`input type="color"`), Hex-Anzeige, Reset auf #02030a; setzt `--void` und leitet `--void-2` ab (dieselbe Aufhellung wie live #02030a→#06080f); da alles per color-mix hängt, färbt die Wahl Fades, Vignette, Panels und Kapelle mit. Persistiert (cl09-void), gilt seitenübergreifend.
- **(3+4) Auspex-Zwillinge statt Skizzen + Astrolab:** `praxis.js` portiert `MainAuspex.tsx` (Tick-Ring vor, Punkte-Ring zurück, Cogitator-Kern schneller zurück, Kardinal-Achsen, Peil-Labels, zwei Peil-Bögen, fünf glimmende Kontakte) — **ohne Sweep-Zeiger** (Dauerurteil) und mit den statischen Ringen im **engeren Band 0.58–0.96 r** statt 0.30–0.96 („Circles nicht so weit auseinander"). Zwei Scheiben an den **Live-Positionen** (34 %/58 % groß, opacity .5, 360 s rückwärts; 62 %/46 % klein, opacity .22, 180 s vorwärts; Innen-Werke 240/320/176 s bzw. 360/440/242 s). Auf hub/archiv/ask/kompendium voll, auf buch/fraktion/welt/charakter als `--quiet` (.34/.14). Servo-Schädel, Bolter und alle Astrolabe ersatzlos raus (inkl. Kanon § XI, dort jetzt die Auspex-Demo).
- **(6+8) Cue-Strich:** fadet nach unten aus (`linear-gradient(to bottom, gold → transparent)` — das Live-Element aus Philipps Screenshot, vgl. 67-chronicle-cinematic.css:723) und ein **Lichttropfen läuft ihn wiederholt hinab** (background-position-Keyframe, 3.2-s-Zyklus) — Abwärtsbewegung als Scroll-Signal. Gilt für alle Cues; auch das Imprimatur-Lot fadet jetzt nach unten. reduced-motion: statisch.
- **(10) Archiv-Türen:** auf archiv.html ist die Wahl Books/Podcasts jetzt das **erste und größte Element des Schiffs** — zwei Register-Türen (Mono-Kicker „Archive I/II" mit Sternwarte-Punkt als Aktiv-Marker, Titelschrift-Name clamp(34–48 px), Bestandszeile); Klick wechselt Tür + Census (Mock). Die kleine „Archive of"-Zeile in der Filterleiste ist raus, die Hero-Edition nennt keine Zählwerte mehr. Kanon § V dokumentiert die Regel.
- **(11) Ask-Slider:** Fragebogen zurück zur Live-Idee — der Frage-Pfad (Reader · Faction · Tone · Length, Gold-Fill) ist Navigations-Pfad, darunter genau **eine** sichtbare Frage im Slider (`translateX`-Track); Antwort markiert und schiebt nach 0,4 s weiter, beantwortete Stationen sind klickbar (Antwort änderbar), nach der vierten Antwort Cogitator → Verdikt, Reset fährt an den Anfang. Die Rubrik „The Questionnaire" ist raus (Tab sagt es).
- **(7) Ask-Hierarchie:** „One Faction, One Book" in drei Mono-Stufen — **I Choose your faction** (18 Banner + großer Fraktions-Name) → **II Narrow to a chapter** (optional, wo Subfactions existieren) → **III Your entry point** (Buch-Tafel). BG-Entscheid oracle.webp zurückgenommen (live = main).
- **(13) Doppelungs-Pass (alle Seiten):** kompendium — Primarchs-Tür („20 sons" + „20 primarchs") auf EINE Zahl-Zeile pro Tür reduziert, Count-Zeile raus, Catnav ohne Zähler-Badges, Mast-Sub ein Satz; buch — Facts-Zeile im Titelblatt raus (stand 1:1 als erste Katalogisat-Zeilen darunter); entity — Meta-Zeile im Titelblatt raus (stand im Dossier); hub — Edition-Zeile entschlackt (Bestände nur noch in der Holdings-Zeile); archiv — Hero ohne Zählwerte (Zahlen wohnen in den Türen); ci § XIII nachgezogen.
- **(5) Schriftgrößen-Pass:** Floor angehoben — Mono-Mikro 10–12 → 12–13.5 px (Vox 11.5 als einzige Ausnahme), Rubriken 13.5 → 14.5, Bylines/Sekundärkursives 15–15.5 → 16.5–17, Register-Beschreibungen 17, Katalogisat 18, Kapelle einen Schritt größer; Kanon § III (Leiter + Anno) dokumentiert den neuen Floor 13 px.
- **(12) Sternwarte-Feinschliff:** zwei **Planeten reiten auf den drehenden HUD-Ringen** (in fr1/fr2, 26/17 s — sichtbar ab Hover), die drei Vermessungspunkte **glimmen** nach der Expansion (starTw, gestaffelt 5.6–7.2 s, Delay lässt die Expansion erst ausspielen), der Ruhepunkt **atmet** kaum merklich (5.4 s). Sternwarte bleibt Default; Sternkarte/Sternbild/Still bleiben als Vergleich im Panel.
- **(15) Cormorant-Dropdown:** Titelschrift-Toggle → `<select>` mit Cinzel (Default), Bodoni Moda und den **fünf lokalen Cormorant-Familien** (Cormorant / Garamond / Infant / SC / Unicase; @font-face in praxis.css auf design/beispiele/Cormorant_Webfonts_v4.002, Gewichte 400–700, lazy — ungenutzte Familien laden nicht). Cormorants laufen auf 500/600 (leichtere Strichstärke als Cinzel), keine Kursiv-Lizenz. Keys auf **cl09** gebumpt (Cinzel + Sternwarte + Live-Void greifen als Vorauswahl).
- **(14) Chronicle:** chronik.html unangetastet auf Runde-8-Stand (eigene cl08-Keys — Studio-Wahlen synchronisieren dorthin nicht; bewusst in Kauf genommen).
- **ci.html (Kanon) nachgezogen:** § II Live-Void + Picker-Hinweis, § III Floor + Dropdown, § IV nur noch Demo-Gerüst (Systeme in praxis.css; Studio-Schaltflächen-Zeile auf dem Kanon ausgeblendet, html-data-btn entfernt — § IV zeigt die vier Systeme weiter nebeneinander), § V Archiv-Türen-Regel, § X Wortmarke/Cue, § XI Auspex-Demo statt Astrolab+Skizze, § XII fadendes Lot, § XIV/XV umformuliert.
- **Docs:** Studien-Notizen aller neun umgebauten Blätter auf Runde 9, design/index.html + design/README.md nachgezogen (praxis.css/js in der Datei-Tabelle).

### Verification Runde 9

- `node --check`: praxis.js + alle Inline-Skripte (archiv/ask/chronik/ci; hub/kompendium/buch/entity haben keine mehr) — pass.
- Grep `invoke|antml` über `design/` — keine Treffer; Grep `astrolabe|sketch|cl08|data-f=|Chrono<span` über `design/07-praxis/` — Treffer nur noch in chronik.html (gewollt, Runde-8-Stand).
- Artwork-Pfade: main-bg.webp + vista.webp existieren in `public/img/`; Cormorant-woff2-Dateinamen gegen `design/beispiele/Cormorant_Webfonts_v4.002/` geprüft.
- `git status --short` — nur `design/**` + die zwei Session-Files, alles untracked, **nichts committet**; `src/**`/`brain/**` unangetastet.
- Nicht visuell geprüft — Philipps Auge; Einstieg `07-praxis/hub.html`.

## Runde 10 (2026-07-03, nach Philipps Runde-9-Review) — Design geht LIVE

### Verdikt Runde 9 (Philipp)

1. **Optik ist gut genug für die Live-Umsetzung** — Home, Archive, Compendium, Ask werden auf die 07-praxis-Sprache umgebaut.
2. **Titelschrift: Cormorant SC**, mit **Cinzel als Fallback** im Font-Stack.
3. **Grund: #050301**; der Scroll-Scrim der Seiten 1–4 so deckend wie auf dem Praxis-Hub (0.94).
4. **Schaltflächen: Sternwarte.**
5. Color-/Button-/Font-Picker (Studio-Panel) kommt **nicht** mit auf die Live-Seite.
6. Best practices, seitenweite Angaben, kein Bloat, Altes ersetzen statt draufsetzen; **nur Optik — Logiken/Datenzugriffe/Verweise unangetastet**; Compendium ohne Catnav zwischen Subtitel und Doorways; Ask-Werkzeugwahl so prominent wie die Archiv-Türen; Chronicle konservativ; Map/Mobile/Admin-Seiten out of scope.

### Was ich umgesetzt habe (diesmal bewusst in `src/**` — „ins Live bringen")

**Fundament (seitenweit, einmal):**

- **Fonts via next/font** (`layout.tsx`): Cormorant SC (400/500/600) + Cinzel (Fallback) → `--font-display`, Cardo (400/700 + Italic) → `--font-body`, Fragment Mono → `--font-mono` (semantische Tokens in `00-tokens.css`; Kompat-Aliase `--font-plex-mono/--font-cormorant/--font-reader` für Map/Lab/Ingest). Cormorant Garamond, IBM Plex Mono, Space Grotesk entladen. Wortmarken-Metadata ohne Trennpunkt.
- **Tokens** (`00-tokens.css`): `--cl-void #050301`, `--cl-void-2 #090806`, Bone `#e4ddcb`, Dim/Faint opak, Gold `#a48c52`, Blood `#8e3b32`, neue Hairline-Tokens `--cl-hair/--cl-hair-soft`, `--ease`, Display-Metriken (`--font-display-wght(-hero)/-track`), Typo-Leiter auf Cardo/Fragment-Maß (Read 18px, Label-Floor 12px); geteilte Keyframes (enter/enterTitle/plumb/cueDrop/survey/vox/fx…). Alte Gold-/Void-/Bone-Literale in den Restpartials per Sweep auf die neue Palette.
- **Hintergrund-System** (`41-site-bg.css` + `SiteBackground`): neue `__fade`-Stufe (Live-Fade der Studien, alles per color-mix aus `--cl-void`), EIN geteilter `.site-scrim` (ScrollScrim-Default jetzt `--scrim-o`/0.94), Scroll-Cue neu: nach unten fadender Gold-Strich mit Lichttropfen + Label (`RouteScrollCue`; `--flow`-Variante in den Masten; `HeroScrollCue` gelöscht).
- **Chrome**: Rail-Nav mit permanentem Titel + Rubriken-Strich (`SiteNav` + `46-site-nav.css`, Breakpoint 1180px), **`SiteBrand`** neu (fix oben links, nicht auf `/`, `/login`, `/map`), **GhostReadout → Vox-Schreiber** (fix oben rechts, 3 Zeilen, Helligkeits-Rampe, Zeichen-Fade, 1px-Gold-Caret; API nur noch `lines`), **MainAuspex ohne Sweep** + engere Ringe (0.58–0.96 r) + `AuspexPair` (Live-Positionen, quiet-Variante; `47-hud.css` neu), **FloatingCoord → Vermessungspunkt** (Punkt + Ring + Leader + Label), **Imprimatur-Footer** (`ArchiveFooter`: Lot-Linie, Siegelwort, Triade englisch, Legal), **RevealObserver** (einmaliger Scroll-Reveal, `.reveal`-Klassen).
- **Sternwarte als DAS Button-System** (`.lx-btn` in `42-lex-primitives.css` + `BtnFx`-Komponente): kein Rahmen, Punkt vor der Schrift (atmet), Hover: Punkt expandiert, Haarlinien-Ringe blühen aus dem Punkt (zwei Planeten reiten), drei Sterne strahlen und glimmen. `--primary`-Variante gold. Dazu `.lx-sect` (Rubrik mit Hairline-Flügeln, zeichnet sich mit `.reveal`), Seek-Feld, `.lx-initial` als Versal-Erstzeile. Studio-Panel existiert live nicht.

**Seiten:**

- **Home** (`page.tsx` + `50-hub.css` neu): Splash = Wortmarke als Hero („A Fan Archive of the 41st Millennium" / „Chrono Lexicanum" / Edition), Auspex-Zwillinge, Survey; Akt 2 Praefatio (Rubrik, Prosa, Seek = BrowseSearch restyled, Holdings-Zeile mit echten Zahlen); Akt 3 Explore-Register (HomeExplore-Markup erhalten, Zeilen-Grid mit röm. Nummer/Titel/Desc/Gloss/›). Scroll-Snap des Hubs entfernt (Mock-treu).
- **Archive** (`archive/page.tsx` + `31-catalogue.css` + `61-browse.css` neu): Hero „The Index / The Archive"; **ArchiveModeToggle → große Register-Türen** (Books/Podcasts, Link-Mechanik unverändert, echte Bestandszeilen); Seek zentriert; Filterbar = FilterSelect-Trigger über Hairline + EIN Sort-Control (Text-Optionen mit ·); Census-Zeile; **Registerzeilen sind jetzt Links, die das bestehende `@modal`-Popup öffnen** (№/Titel+Byline/Faction/Year/Format/▾) — das `<details>`-Inline-Detail ist raus, alle seine Inhalte leben im Popup. Podcasts-Index + Show-Seite auf dasselbe Shell gezogen (Türen, Hero, Vox).
- **Kapelle** (`64-detail-modal.css` + `51-book-detail.css` + `BookDetailView` neu): DetailModal-Chrome = Scrim+Blur, Karte min(940px) ohne Rahmen, Leiste „‹ Return / Close" + Gold-Terminus, Kapellen-Ouvertüre (gestaffelte Einblendung); Inhalt = Titelblatt-Sprache auf der Mittelachse: Format-Rubrik, Riesen-Titel, Byline+Serie, Era-Zeile (gold/mono), First-published, Also-contained-in, Synopsis, **Appendix** (Dramatis Personae/Factions/Locations mit Rollen, Antagonist in Blutrot — alle Entity-Links erhalten), Motive (Facets), **Acquire** (BuyListenActions → Sternwarte-Buttons + AudioCredit + RegionSwitcher als Register-Zeile), stiller Audit-Link. **Cover-Panel raus** (bestätigter Kanon: der Titel ist das Cover); kein Datenfeld angefasst.
- **Compendium** (`layout/page/[category]` + `66-compendium.css` neu): Übersicht beginnt direkt bei „The Doorways" — **Catnav aus dem Layout raus**, lebt nur noch auf den Kategorie-Seiten (ohne Zähler-Badges → `loadCompendiumCounts` im Layout entfällt); Türen mit genau EINER Zahl-Zeile (Bestand gold + Coverage), Factions führend; Directory-Rows restyled (Titelschrift-Namen).
- **Ask** (`53/54/58-*.css` neu + Komponenten): **AskToolTabs → zwei große Türen** in der arch-door-Grammatik („Tool I · Ask the Archive" / „Tool II · One Faction, One Book") als erstes Element der Konsole — so prominent wie die Archiv-Türen (Philipps Vorgabe); Mast schlank (Over/Titel/Sub/Cue, Auspex-Zwillinge); Frage-Pfad als Hairline mit Gold-Fill + klickbaren Stationen (Live-Logik unangetastet); Ballot-Optionen mit Sternwarte-Punkt; Verdikt: Rubrik + „n hits · ranked", Rang-I-Dossier (Kicker/Titel/Meta/Note/Why-Zeile/Sternwarte-Button), Ränge II+ als Register-Zeilen, Load more + Browse deeper + Responsa-Zeile + Footlinks; **OFOB in drei Mono-Stufen** I Choose your faction (Rail + Bühne + Pfeile) / II Narrow to a chapter (optional) / III Your entry point — Carousel-Logik unverändert.
- **Chronicle**: bewusst konservativ — erbt Fonts (Display→Cormorant SC), Palette, Buttons über den Token-/Font-Sweep von `67-chronicle-cinematic.css`; keine Strukturänderung.

**Aufgeräumt (kein Ballast):** `HeroScrollCue`, `LetterField`, `WordField`, `LiveTelemetry`, `BottomConsole`, `ScanLine`, `Typewriter`, `CatalogueTelemetry`, `FactionClassIcon` (Icon-Politik) und `45-bottom-console.css` gelöscht; `AuspexSweep` bleibt nur für die `/lab`-Referenzen; Lab-Seiten auf die neuen Props gefixt.

### Decisions

- **Semantische Font-Tokens statt Umbenennungs-Hacks**: `--font-display/--font-body/--font-mono` + drei Kompat-Aliase; alle 30+ Style-Partials per Sweep umgestellt — Map (`themes.ts` hartkodiert + Aliase) und Admin-Seiten bleiben funktionsfähig und erben die neue Typo.
- **Popup statt Inline-Detail im Archiv** nutzt den VORHANDENEN `@modal`-Intercept — null neue Logik, die Zeile ist ein `<Link href="/buch/[slug]">`.
- **Buch-Rubrik zeigt Era statt M-Band**: `loadBook` trägt kein `startY/endY`; statt den Loader anzufassen (Logik-Tabu) zeigt die Chrono-Zeile die Era; M-Band im Popup ist Kandidat für einen späteren Daten-Pass.
- **Ask-Fragen ohne translateX-Slider**: Die Live-Mechanik (eine Frage, URL-Antworten, Revisit über den Pfad) bleibt; der Fragenwechsel nutzt die vorhandene Fade-Choreografie — der Mock-Slider hätte alle Fragen mounten müssen (Logik-Umbau).
- Kompendium-Nav ohne Zähler (Runde-9-Doppelungs-Politik) → das Count-Loading im Layout (früherer Perf-Schmerzpunkt) entfällt ganz.

### Verification Runde 10

- `npx tsc --noEmit` — pass; `npm run lint` — pass.
- Alte Dev-Server gekillt, `.next` gelöscht, EIN frischer `npm run dev` gestartet (Log: `%TEMP%\chrono-dev-184.log`); ein einzelner Is-it-up-Check — visuelle Prüfung macht Philipp im Browser.
- `git status`: Änderungen in `src/**` + dieser Report; `design/**` unangetastet; `brain/**` unangetastet; **nichts committet** (Auftrag: warten bis „fertig").
- Out of scope wie beauftragt: Map (Restyling), Mobile-Optimierung (Grid-Fallbacks der Mocks sind drin), Admin-/Hintergrund-Seiten (erben nur Tokens).

### Offene Punkte für die nächste Runde

- Map-Neubau (Brief 178) — die Cartographer-Tür zeigt auf die alte Map (funktioniert, alter Look).
- Entity-Seiten (fraktion/welt/charakter) erben Fonts/Farben, sind aber strukturell noch Alt-Layout — Kandidat nach der Map.
- `curation.archivistNote` + M-Band im Buch-Popup als Daten-Pass (Batches-Strang).
- Mobile-Feinschliff (SiteMenu-Burger trägt die neue Sprache nur geerbt).

## References

- Google Fonts Runde 1: Instrument Serif, EB Garamond, Martian Mono, Archivo, Anton, Spectral; Runde 2: Bodoni Moda, Cardo, Grenze Gotisch, Alegreya (+SC), Eczar, Gentium Book Plus; Runde 3 zusätzlich: Fraunces, Prata (Runde 4 wieder entfernt); Runde 4: Italiana, Gilda Display (Runde 5 wieder entfernt); Runde 5: GFS Didot, Oranienbaum (Runde 6 wieder entfernt); Runde 6: Almendra, Old Standard TT, Gloock (Runde 7 wieder entfernt); Runde 7: Cinzel (zurück, wie Live-Original), Fragment Mono (alle OFL, CDN-Links in den Studien).
- Live-Referenzen Runde 6: `src/app/@modal/(.)buch/[slug]/page.tsx` + `src/components/shared/DetailModal` + `src/app/styles/64-detail-modal.css` (Popup-Mechanik), `src/components/chrono/GhostReadout.tsx` + `Typewriter.tsx` (Selbstschreib-Element).
- Live-Referenzen Runde 7: `src/components/book/BookDetailView.tsx` (Popup-Feld-Inventar: Synopsis → Factions → Locations → Characters → Facets → audit, Rollen-Defaults), `design/beispiele/Bsp Button.txt` (Philipps Sternwarte-Referenz — Sparkle-Button; Glow-Shadows bewusst nicht übernommen).
- Live-Referenzen Runde 8 (für die Seiten-Mocks, per Explore-Agent inventarisiert + stichprobengelesen): `src/app/page.tsx` + `HomeExplore`/`HomeSearch` (Hub: drei Akte, zehn Türen mit Glosses), `src/components/timeline/cinematic/*` + `scripts/seed-data/eras.json` (Chronicle: acht Ären, Cine-/Index-View, MediaRows), `src/components/ask/*` + `scripts/seed-data/ask-questions.json` (vier Fragen + wörtliche Options-Labels, ResultCard-Anatomie, 18-Fraktionen-Rail), `src/components/entity/*` (EntityView-Feld-Inventar je kind), `src/app/compendium/page.tsx` + `src/lib/compendium/categories.ts` (fünf Türen), `faction-/location-/character-blurbs.json` (echte Blurbs Thousand Sons/Prospero/Magnus). Archivist-Notes-Prüfung: `scripts/seed-data/books/*.json` (curation-Felder 896/896 enumeriert, notes-Feld 60/896 Pipeline).
- Datenquellen: `scripts/seed-data/books/*.json`, `scripts/seed-data/book-dates.json`, `scripts/seed-data/map-worlds.json` (map-worlds-v2, Impl 183).
- Hintergrund-Mechanik-Vorbild: `src/app/styles/41-site-bg.css`, `src/app/styles/31-catalogue.css` (ScrollScrim / `--cat-scrim-opacity`).

## Runde 10b — Browser-Review-Fixes (2026-07-03)

Philipps erster Browser-Durchgang fand fünf Probleme; alle behoben, weiter nichts committet.

1. **Compendium-Suche zerschossen, Riesen-Icon** (`/compendium/factions` u. a.): `CompendiumControls` renderte noch die alte Such-Grammatik (`browse-search__sigil`-SVG + `__go`-Pfeil), deren Styles die 61-browse-Neufassung nicht mehr kennt — die ungestylte SVG blähte sich auf Containerbreite auf. Markup an die neue Seek-Line angeglichen (Input + optionales ×, Enter committet). Tote Sigil-Regeln aus `62-podcasts.css` entfernt; die Pending-Affordance in `70-route-progress.css` (vorher: drehende Sigil) ist jetzt die gefüllte Gold-Unterlinie der Seek-Line.
2. **Scrim ÜBER dem Inhalt** (alle Scroll-Seiten): `.site-scrim` stand auf `z-index: 0` (fixed) und malte damit über allen nicht-positionierten Inhalt — gescrollt war alles fast schwarz. Auf `z-index: -1` gesetzt: koplanar mit `.site-bg`, aber später im DOM → dunkelt nur das Foto ab, sämtlicher Inhalt liegt darüber (exakt das Muster, das `lab/_example/example.css` dokumentiert).
3. **Chronicle-Era-Band**: Stop-Labels (`.eb-n`) von Small Caps/Kursiv auf **Cormorant Unicase** umgestellt (neuer next/font-Load + Token `--font-unicase`, upright — die Schrift hat kein Kursiv) und verkleinert: Cine-Band 18→15px, Index-Band 15→14px.
4. **Türen-Farblogik gedreht** (`.arch-door`, gilt für Archive UND Ask): aktiv = Bone („hier bist du"), inaktiv = Gold (Einladung — Gold ist die Link-/Hover-Farbe der Seite); Hover auf inaktiv zeigt Bone als Vorschau. Vorher wirkte die goldene aktive Tür wie die nicht gewählte.
5. **Registerwechsel ohne Sprung**: Books↔Podcasts und Ask↔OFOB waren schon Soft-Navigations (kein echter Reload) — der „Seite lädt neu"-Eindruck kam von Links Default-Scroll-Reset nach oben plus neu anlaufender Hero-Animation. `scroll={false}` auf beiden Türen-Paaren: die Ansicht wechselt auf gleicher Scroll-Ebene, die Türen bleiben unter dem Cursor, nur das Register darunter tauscht (beide Seiten teilen die Hero/Türen-Anatomie). Bewusst KEIN Client-State-Tab-Umbau (hätte beide Datensätze laden + URLs/ISR aufgeben = Logik-Umbau) und kein Loading-Screen (der Route-Progress-Beam läuft bereits als Feedback).

Verification: `tsc --noEmit` pass, `eslint` auf den geänderten TSX pass, Dev-Server kompiliert die betroffenen Routen mit 200 (ein Check).

### Nachtrag zu Punkt 5 + 3 (zweiter Review-Durchgang)

- **Punkt 5 tiefer**: `scroll={false}` allein reichte nicht — `/archive` und `/ask` tragen `loading.tsx`-Suspense-Boundaries (Brief 120 / Report 144 § P.5). Beim Tür-Wechsel ersetzt Next die Seite kurz durch den Cogitator-Fallback; der war nur ~100vh hoch → Dokumenthöhe kollabiert → Browser klemmt den Scroll auf oben. Zwei Maßnahmen: (a) `prefetch={true}` auf allen vier Türen — in **Produktion** liegt das jeweils andere Register damit voll im Router-Cache und der Wechsel ist sofortig, ganz ohne Loader (Philipps Option A; in dev ist Link-Prefetch framework-seitig deaktiviert). (b) Die beiden Fallbacks sind jetzt jump-sicher (`.route-loading`, 65-loading.css): ein 280vh-Platzhalter erhält die Scroll-Tiefe, der Cogitator pinnt als fixed Screen (88 % Void-Veil, z 10 unter Rail/Brand) über den Viewport — der kalte/langsame Wechsel ist damit Philipps Option B (Cogitator-Screen statt Sprung). Im **Dev-Server** sieht man immer Option B, da dort kein Prefetch läuft.
- **Punkt 3**: Der `Cormorant_Unicase`-Import in `layout.tsx` greift in dev erst nach Server-Neustart — drei hängende Next-Prozesse per CommandLine gekillt, `.next` gelöscht, EIN frischer Server.

### Nachtrag: unsichtbare Inhalte (Archive-Register, Compendium-Türen)

Dritter Review-Fund: Bücherliste auf `/archive` und alles nach dem Hero auf `/compendium` unsichtbar, aber klickbar → `.reveal`-Elemente (Opacity 0) ohne `.is-seen`. Ursache: `RevealObserver` war ein One-Shot (`querySelectorAll` einmal beim Mount). Auf `/compendium` saß er im **Layout**, dessen Effekt lief, während die Seite noch der `loading.tsx`-Cogitator war — die später gestreamten Türen/Rows wurden nie beobachtet; dieselbe Lücke traf jede Kombination aus Suspense-Streaming, Client-Navigation und Filter-Re-Render. Fix (ersetzt statt geflickt): `RevealObserver` einmal im **Root-Layout** gemountet (vier Per-Page-Mounts entfernt), intern IntersectionObserver + MutationObserver — neue `.reveal`-Knoten werden beim Eintreffen nachbeobachtet (Rescan nur, wenn hinzugefügte Nodes tatsächlich `.reveal` tragen, damit das Vox-Tippen keine Dokument-Queries triggert; `WeakSet` gegen Doppel-Observation). Ohne IntersectionObserver zeigt `:root.no-reveal` alles statisch. tsc + eslint grün, beide Routen 200.

**Zweite Ursache derselben Symptomatik**: `threshold: 0.08` im IntersectionObserver — ein Ratio-Threshold verlangt, dass 8 % der **Elementhöhe** sichtbar sind; das komplette Archiv-Register (eine einzige `.reveal`-Liste, viele Viewport-Höhen hoch) kann das nie erreichen → `isIntersecting` feuerte für große Elemente niemals. Fix: `threshold: 0` (ein Pixel im um −8 % verkleinerten Root genügt — der rootMargin trägt allein das „erst wenn richtig im Bild"-Gefühl). SSR-Gegenprobe: die Liste steht vollständig im HTML (`catalogue-list reveal`, ~15,8k Row-Klassen), war also rein Opacity-gated.

### Runde 10c — Lesbarkeits-Pass + Sternwarte-Loader (2026-07-03, vor PR)

- **Lese-Leiter global angehoben** (00-tokens.css): `--fs-read-xs` 16→16.5, `--fs-read-sm` 17→18, `--fs-read` 18→19, `--fs-read-lg` 19.5→21 — hebt alle var-basierten Prosa-Stellen (Ask-Hints/Subs/Nav-Status, Appendix, Motive, …).
- **Popup-Synopsis** auf `--fs-read` (19px, First-Line 17px); **Archiv-Zeilentitel** 24→27px (Small-Caps-Face braucht mehr Punkt), Byline/Empty auf Leiter-Tokens; **Compendium** Blurbs/Empty auf `--fs-read-sm`, Registry-Namen 21→23px; **Ask** Footlinks (Back/Reset) 16.5→17.5px, Deeper-Link ebenso, Why-Zeile auf Token, **Responsa** auf `--fs-label-xl` (15px) + eine Helligkeitsstufe rauf (dim/bone statt faint/dim).
- **Imprimatur** (`.lx-foot`): margin-top `clamp(60px,10vh,90px)` → `clamp(130px,22vh,200px)` — Kolophon-Abstand auf allen Seiten.
- **Loader = Sternwarte-Loop**: Ring-SVG aus BtnFx in geteilte Komponente `SternwarteRings` extrahiert (BtnFx, CogitatorLoading, ProcessingPanel, DetailModalSkeleton konsumieren sie). Wartezustand: Punkt atmet zur Hover-Expansion (scale 1→1.7, 5.4s), die beiden Haarlinien-Ringe mit Planeten drehen gegenläufig (fxTurn 26s/17s), das Ganze schwillt im Punktrhythmus (`cogitatorBloom`) — Endlosschleife, reduced-motion-gestillt über die globale Kaskade. Alte `__ring`/`cogitatorSpin`-Regeln entfernt (Lab-Referenz nutzt eigene Kopie, unangetastet).
