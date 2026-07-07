---
session: 2026-07-06-178b
role: implementer
date: 2026-07-06
status: complete
slug: map-polish
parent: 2026-07-05-178
links:
  - sessions/2026-07-05-178-impl-map-cartographer.md
commits: []
---

# Map-Polish (178b) — Follow-up zu Brief 178 / PR #224

## Summary

Neun Zurufe nach dem ersten Live-Eyeballing der neuen `/map`: Fließtext seitenweit auf die zentrale Token-Leiter (Popup + Course-Karten deutlich hoch), Course-Karten weichen dem Welt-Popup, Drag kann nie mehr Text markieren, Segmenta-Block aus der Kartusche raus, Seek ist jetzt eine Live-Suche über alle 1054 Kontakte, „Unselect all" im Census, das Label-Massen-Flickern bei Selection-Wechsel ist behoben (zwei Ursachen), und der **Zonen-Editor** (`/map?zones=edit`) steht — Zonenformen entstehen ausschließlich per Hand-Kuration, nie aus Bildern. Galaspar/Myr: **Datenlücke im eingefrorenen Quell-Excel**, kein Render-Problem → Item für den Batches-Strang (unten).

## What I did

**1. Fließtext-Tokens (00-tokens.css + 55-map.css).** Die zentrale Leiter `--fs-read-*` (16.5/18/19/21) existierte schon und trägt 16 Style-Files — die Map war die einzige Surface mit hart codierten px. Neu in der Leiter: `--fs-read-2xs: 15px` (fine print — nested notes, sub-hints, dense rows). Alle Cardo-Fließtexte in 55-map.css auf Tokens umgestellt; dabei bewusst hochgemappt, wo du „zu klein" gemeldet hast: Popup-Blurb 17→19 (`--fs-read`), Klassifikation 17→18, Werkliste 16.5→18, Rollen-Notiz 14→15, Course-Karten-Text **14.5→18** (`--fs-read-sm`). Kartusche/Census auf den jeweils nächstliegenden Token (±0.5px). Breiten nachgezogen: Popup 344→362px (Mobile 250→272), Course-Karte 268→296px (+ JS-Fallbacks in `place()`).

**2. Popup-Überlappung.** `CourseCards` bekommt `suppressed={selectedId !== null}`: Karten faden aus (0.3s) solange das Welt-Popup offen ist und kommen zurück, sobald es zugeht. Kein Unmount — die Akt-Choreografie läuft weiter, nichts startet neu; der Pager ist währenddessen nicht klickbar.

**3. Drag markiert Text.** Die markierten Texte im Screenshot sind SVG-Labels der Karte selbst. Doppelt abgesichert: `user-select: none` auf dem Chart-SVG **und** `e.preventDefault()` am `pointerdown` in ChartStage (Selektion kann gar nicht erst starten, auch nicht in HTML-Overlays hinein). Da preventDefault den Fokuswechsel unterbindet, blurred ChartStage das aktive Eingabefeld explizit.

**4. Segmenta raus.** Caption + Segment-Buttonzeile aus der Kartusche entfernt — damit auch die Segmentum-Jumps (`onJump`/`seek`-Callback + CSS mit gelöscht). Die Segmentum-Watermarks im Chart bleiben.

**5. Live-Suche.** Der Seek zeigt ab dem ersten Zeichen eine Kandidatenliste über **alle 1054 Kontakte** (featured + dust, beides im Payload): Ranking Präfix > Substring, recorded > dust; Zeile = Name + Tag (`N rec` / `dust`). Pfeiltasten bewegen den Cursor (scrollt mit), **Enter** nimmt den markierten (Default: besten) Treffer, **Klick** ebenso — beides selektiert und fliegt hin; Escape leert nur das Feld (stoppt die Propagation, schließt nicht das Popup). Liste läuft inline unter dem Feld, ab ~8 Zeilen intern scrollbar, Render-Kappe 160 mit „… N more — keep typing".

**6. „Unselect all".** Rechts in der Caption-Zeile „Census — by classification": setzt `hiddenCls`, „Linked records only", Star-dust-Off, „Reveal the full census" **und die Selektion** in einem Klick zurück (neue Reducer-Action `resetFilters`). Kurs/Instrumente bleiben bewusst unberührt.

**7. Label-Flicker — zwei Ursachen, beide behoben.**
- *React-Rebuild:* `selectedId` war Prop von `PinLayer` → jeder Selection-Wechsel re-renderte alle 141 Pins, und das nicht-memoisierte `GreatRift` (~900 Zellen) wurde bei jedem Root-Render mit-reconciled. Fix: `sel-on` wird jetzt **imperativ** aus CartographerRoot gesetzt (Effect ohne Deps repariert die Klasse auch nach Filter-Re-Renders, die className neu schreiben); `PinLayer` kennt keine Selektion mehr; `GreatRift` ist `memo`-gewrappt. Selection-Wechsel re-rendert damit keinen Label-Layer mehr — deine Anforderung wörtlich.
- *Hover-Kaskade (der sichtbare Teil):* Beim 900ms-`flyTo` schiebt sich die Karte unter dem **stehenden** Cursor durch; Chrome re-hit-testet und jeder passierende Pin zündet seine `:hover`-Transitions (Label-Opacity 0.6s + Glyph-Scale) — das Massen-Geflacker entlang des Flugwegs. Fix: `apply()` setzt während jeder Kamerabewegung (Flug, Pan, Wheel, Pinch) die Klasse `moving` aufs SVG (160ms-Decay); alle Hover-Regeln (`glyph`, `cg-lbl`, `cg-rgn`) sind auf `.cg-chart:not(.moving)` gegated.

**8. Galaspar/Myr — Befund, keine Code-Änderung (→ Batches).** Siehe unten.

**9. Zonen-Editor (`/map?zones=edit`).**
- **Daten:** `src/lib/map/zones.json` (`{ zones: [...] }`; je Zone `id, name, kind: storm|interdiction|region, smooth, published, points[[gx,gy],…]` im Pin-Grid) + `src/lib/map/zones.ts` (strikter Parser — validiert Datei, Draft und Export identisch; geschlossene Catmull-Rom-Spline für `smooth`, sonst hartes Polygon; Centroid fürs Label). Angelegt ist die **Interdicted Zone** als neutraler Dekagon-Platzhalter, `published: false` — auf der normalen Karte rendert **nur** `published: true`, es shippt also nichts Unkuratiertes.
- **Anzeige:** `ZonesLayer` in `#cg-fields` (dimmt im Kurs-Modus mit); Stile je kind: interdiction = blutrote Strichlinie + `✠ NAME ✠`-Label (Sprache der Rift-Label), storm = Warp-Palette, region = Gold-Hairline. Label counter-skaliert wie Region-Typo.
- **Editor:** Query-Flag wird client-only per `useSyncExternalStore` gelesen (Route bleibt statisch; der Hash-Writer erhält `location.search`). Im Chart: Vertex-Handles ziehen (Pointer-Capture auf der persistenten Editor-Gruppe — überlebt das Re-Keying beim Einfügen), kleine gestrichelte **Mid-Handles fügen Punkte ein** und ziehen sofort weiter, **Doppelklick oder Entf** löscht (Minimum 3 Punkte), Klick auf eine Zonenfläche aktiviert sie; Handles counter-skaliert über das `cg-pi`-Muster (kein React pro Frame), inaktive Zonen gedimmt, aktive mit Drahtgitter-Kontur. Panel rechts (Portal): Zonenliste (Klick fliegt hin, Punkt = published), **+ New zone** (Oktagon im Viewport-Zentrum), Name/Kind/smooth/published, Zone löschen (confirm), **Copy JSON / Download / Reset** — der Export ist ein Drop-in-Replacement für `zones.json`. Working-Copy autosaved nach localStorage (`cg-zones-draft-v1`, „draft"-Badge), Reload verliert nichts. **Keine Geometrie aus Bildern — du formst, ich habe nur das Werkzeug gebaut.**
- Kamera-Naht: `CameraDriver.screenToWorld()` neu (Inverse zu `worldToScreen`).

## Befund für den Batches-Strang (Aufgabe 8 — bitte in den nächsten Batches-Brief)

**Galaspar und Myr fehlen in der Datenbasis, nicht im Rendering:**
- `scripts/seed-data/map-worlds.json` (1054 Welten): kein Treffer für `galaspar`/`myr` (auch nicht als Substring).
- Quelle `scripts/seed-data/source/Warhammer_map_SSOT.xlsx` (992 Zeilen + Header): ebenfalls **kein Treffer** — die Redditor-JPEG basiert offenbar auf einer neueren/erweiterten Fassung des SSOT als unsere eingefrorene Kopie.
- Render-Seite ist sauber: Payload filtert nicht nach Segmentum/Keil, der Convert wirft bei Out-of-Extent-Koordinaten einen **harten Fehler** statt still zu droppen (`SOURCE_EXTENT`, map-worlds-core.ts), und 8 Katalog-Welten liegen heute schon außerhalb der Keil-Silhouette und rendern normal (`sotha` n=11, `elaras-veil`, `halo-stars`, `antagonis`, `estaban`, `hadex-anomaly`, `salem`, `saramanth`).
- Folge-Entscheid für Batches: aktualisiertes SSOT-Excel beschaffen/einfrieren; liegen neue Zeilen außerhalb des kalibrierten Pixel-Fensters (x ∈ [2.794, 7031], y ∈ [515, 6198] — „Myr ganz im Süden" könnte y > 6198 sein), ist das die dokumentierte **menschliche Rekalibrierungs-Entscheidung** an `SOURCE_EXTENT` (Grid-Shift für alle Bestandswelten inklusive).

## Decisions I made

- **Token-Mapping statt 1:1-Übertrag:** Popup/Course-Karten bewusst 1–3.5px hochgemappt (deine Meldung), Kartusche/Census nur auf den nächstliegenden Token normalisiert. Neuer Leiter-Schritt `--fs-read-2xs: 15px` statt map-lokaler px.
- **Segmenta-Entfernung nimmt die Jump-Buttons mit** — „der Punkt Segmenta" war die ganze Sektion; Navigation dorthin geht weiter über Zoom/Suche. Sag Bescheid, falls die Jumps woanders wieder auftauchen sollen.
- **Suche zeigt alles, kappt nur das Rendering** (160 Zeilen + Hinweis) — bei „a" wären es sonst vierstellig DOM-Knoten pro Tastendruck.
- **„Unselect all" lässt Kurs + Instrumente stehen** — das sind Modi, keine Filter.
- **Editor-Zugang als Query-Param** (`?zones=edit`) statt UI-Schalter: Kurations-Werkzeug, kein Besucher-Feature; client-only gelesen, Route bleibt statisch prerendered.
- **Platzhalter-Zone unpublished:** die Karte zeigt weiter keinerlei ungeformte Geometrie; erst dein Export + Commit von `zones.json` published sie.

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass.
- `npm run build` — **einmal gestartet, am bekannten transienten SSG-Fehler abgebrochen** (`/fraktion/ultramarines`, `TypeError: … reading 'type'` beim Flight-Stringify — exakt die Signatur aus Report 178 / Report 144 § B.3, DB-Contention beim Parallel-Prerender; mein Diff berührt den Entity-Pfad nicht). Retry auf deinen Zuruf abgebrochen — CI baut ohnehin vor dem Merge.
- Dev-Server läuft (ein Prozess, `/map` → 200); Eyeballing machst du im Browser: Popup-/Karten-Typo, Karten-Ausweichen, Drag-ohne-Markierung, Live-Suche, Unselect all, Flicker-Test (Band 2, Planet→Planet klicken), `/map?zones=edit` (Interdicted Zone formen, Export testen).

## Open issues / blockers

- Kein voller grüner `next build` in dieser Session (s. o. — transient, nicht kartenbezogen). Der Fehler ist jetzt zweimal in zwei Sessions aufgetreten (`tanith_first`, `ultramarines`): die `loadEntity`-Robustheit unter Pool-Druck wird langsam ein eigenes Ticket wert.
- Direction-Panel-Entscheid (Fassung/Unrest/Veil/Brightness/Grain einbrennen, Panel raus) — wartet auf deine Ansage, war für diese Session angekündigt, kam aber nicht mehr.

## For next session

- Direction-Entscheid einbrennen (aus 178 offen).
- Zonen-Workflow Runde 2: dein `zones.json`-Export committen, Interdicted Zone `published`; ggf. Editor-Wünsche aus der ersten Benutzung.
- Batches-Strang: SSOT-Refresh-Frage (Galaspar/Myr, s. Befund).
- Episoden-Anker-Kompat + Vermesser-Modus (K11) — unverändert aus 178.

## Rollup-Fakten (für den Koordinations-Pass; brain/** hier unangetastet)

- `--fs-read-2xs: 15px` neu in der zentralen Type-Leiter (00-tokens.css); 55-map.css spricht jetzt durchgehend `--fs-read-*`.
- Neue Module: `src/lib/map/zones.{ts,json}`, `src/components/cartographer/{ZonesLayer,ZoneEditor}.tsx`; `CameraDriver` um `screenToWorld` erweitert; Zonen-Editor unter `/map?zones=edit` (localStorage-Draft, JSON-Export = zones.json-Ersatz).
- Kartusche ohne Segmenta-Jumps; Seek = Live-Suche über alle Kontakte; Census mit Select/Unselect-all-**Toggle** (Nachtrag 1 — die frühere `resetFilters`-Aktion ist wieder raus).
- Legende sitzt oben links als Akkordeon (Courses/Instruments/Census, Status-Badges); Site-Brand auf der Karte zentriert als „Chrono Lexicanum · Tabula" (Nachtrag 1).
- Selection-Highlight läuft imperativ (`sel-on`, synchron in `selectWorld` + Repair-Effect), `PinLayer` selektionsfrei, `GreatRift` memoisiert; Hover-Regeln während Kamerabewegung gegated (`.cg-chart.moving`); `sel-on` hält den Hover-Look; Pointer-Capture erst ab Drag-Schwelle (Maus/Pen); `ChartBus.onFlightChange` → Welt-Popup duckt sich während Kamera-Flügen weg (Nachtrag 2).
- Zonen-Kinds: storm | interdiction | region | hive-fleet | necron-dynasty; Dev-only-Editor-Einstieg unten rechts (`NODE_ENV=development`), Prod weiter nur via `?zones=edit`.
- Label-Counter-Scale läuft über `transform: scale(var(--cg-ik))` mit konstanter font-size (kein per-Frame-Text-Relayout mehr); ausgeblendete Band-Stufen stehen auf `display: none` (+ `@starting-style`-Fade-in); `.cg-rgn`/Zonen-Labels bewusst weiter calc()-basiert (x/y-Attribut-Positionierung) (Nachtrag 3).
- LOD neu (Nachtrag 6 / Runde 7): **vier** Zoom-Bänder (1.7/3.1/5.6 × k0); jede Buch-Welt ist in jedem Band sichtbar (`vbCut`/`vb1` + „All worlds at every zoom"-Toggle gelöscht — aus MapPayload, PinLayer, Census, State); Namens-Treppe t0 immer / t1 ab Band 1 / t2 ab Band 2 / Dust (jetzt `t3`) ab Band 3; `.cg-dust` steht bis Band 3 auf 60 % Opacity. Interdiction-Zonen (`.cg-zone.interdiction`) füllen mit `#cg-riftHatch` statt flachem Rot-Overlay.
- Legenden-Sektionen heißen „Character voyages" / „Overlays" / „Census"; AUSPEX-Status, Kontakt-/Coverage-Zählerzeilen und Toggle-Hint-Sätze sind raus (Nachtrag 3).
- Rift ist EIN portolan-schraffierter Korridor-Pfad (`geo.corridor` + `#cg-riftHatch`-Pattern) — die drei Storm-Fassungen, `data-storm`, der DirectionPanel-Switcher, `riftHatchPaths` und `Sweep.tsx` sind gelöscht; RiftWords blankt mit Redaction-Rects statt Zell-Verstecken (Nachträge 4+5 / Runden 5+6).
- Galaspar/Myr: Lücke im eingefrorenen `Warhammer_map_SSOT.xlsx` (992 Zeilen) — Batches-Item, keine Product-Änderung.

## Nachtrag 1 — Feedback-Runde 2 (vor PR, 2026-07-06)

Fünf Zurufe nach dem zweiten Eyeballing, alle in diesem Branch mitgefixt:

**1. Select/Unselect-all-Toggle (Census).** „Unselect all" war semantisch falsch herum (die `resetFilters`-Aktion *zeigte* alles — bei „alle selected" am Start ein No-op). Jetzt ein echter Toggle: **unselect all** blendet alle Klassifikationen aus (ausgegraut), der Button wird zu **select all** und stellt alle wieder an. Scope bewusst nur die Klassifikationen — Display-Toggles und Selektion sind keine „Auswahl". `resetFilters`-Action + `onReset`-Prop entfernt (tot).

**2. Ouvertüre dunkler.** `.cg-overture`-Radial von 0.46→transparent auf 0.88→0.56 angehoben — solange „The Cartographer" steht, ist die Karte nur noch Ahnung, Titel + Zeilen sind frei lesbar. Erste Interaktion hebt den Schleier wie gehabt.

**3. Klick-Flicker — dritte Ursache gefunden.** Drag war glatt, der *Klick* flackerte: (a) `setPointerCapture` am `pointerdown` nimmt dem geklickten Pin sofort den `:hover` — Label-Opacity (0.6s) und Glyph-Scale (0.35s) zünden rückwärts, beim `pointerup` wieder vorwärts; (b) beim Flugstart gated `.moving` die Hover-Regeln → dritter Puls. Fix: **Capture erst ab der 4px-Drag-Schwelle** (Maus/Pen; Touch captured weiter sofort — kein Hover, muss Overlays überleben; neuer `pointerleave`-Handler räumt uncaptured Presses auf), und **`sel-on` hält den Hover-Look** (`scale(1.35)` + Label opacity 1, ungated) und wird in `selectWorld` **synchron** gesetzt — der Hover übergibt an die Selektion ohne einen einzigen Transition-Frame. Nebeneffekt: die gewählte Welt zeigt ihr Label jetzt in jedem Zoom-Band.

**4. Zonen-Editor sichtbar + Xenos-Kinds.** Neuer Dev-only-Einstieg: Button „⌖ Zone editor" unten rechts über dem Zoomer — nur unter `NODE_ENV=development` gerendert, im Prod-Build nicht existent (`?zones=edit` funktioniert weiter direkt). Kinds erweitert um **hive-fleet** und **necron-dynasty** (Eis-Cyan, eigene Strichsprache analog cg-lev/cg-nec); Kind-Select zeigt Klartext-Labels („Warp storm", „Hive fleet", …). Workflow unverändert: Philipp formt lokal, Copy JSON → ich committe `zones.json`, nur `published` rendert live.

**5. Legende neu.** (a) **Nach oben links** (`top: 84px`, max-height hält den unteren Rand vom Music-Player-Dock frei — der sitzt fix unten links auf z-40). (b) **Akkordeon**: Courses / Instruments / Census hinter vollbreiten Sektions-Headern (mono 12px, 0.3em Tracking, drehender Chevron), nur Census default-offen; zugeklappte Sektionen tragen ein goldenes Status-Badge („active", „Lumen · Nihilus", „filtered") — nichts Aktives kann verschwinden. (c) **Typo hoch**: Kartuschen-Titel 21→24px, Sektions-Header 10→12px, `chead` 10→11px, Toggle 10→10.5px; Klassifikations-Zeilen unangetastet (waren „gut so"). (d) **Brand**: auf der Karte zentriert am Nordrand und um „**· Tabula**" ergänzt (lat. *tabula* = Karte — passt zur Chartae-Sprache der Ouvertüre; „Atlas" wäre griechisch und meint den Band, nicht das Blatt); der „000"-Gradmarker weicht dafür aus dem Markup.

Verification Runde 2: `typecheck` + `lint` grün; Eyeballing wie immer bei dir.

## Nachtrag 2 — Feedback-Runde 3 (vor PR, 2026-07-06)

**1. Zonen-Editor: Name/Kind tot — Portal-Event-Leck.** Das Editor-Panel ist ein `createPortal` zum `<body>`, hängt im *React*-Baum aber unter dem Chart-SVG — React bubbelt Portal-Events den React-Baum hoch, also lief jeder Klick ins Name-Feld/Kind-Select in ChartStages `pointerdown` (`preventDefault` + `blur`): Fokus kam nie an, das Select öffnete nie. Fix: `stopPropagation` am Panel-`pointerdown`.

**2. Punkte hinzufügen sichtbar gemacht.** Die Mid-Handles gab es, waren aber zu klein/leise, um gefunden zu werden. Jetzt: größere ⊕-Handles (Kreis + Plus-Glyphe) auf jeder Kantenmitte — anfassen fügt den Punkt ein und zieht sofort weiter; Hilfetext entsprechend.

**3. Flicker, instrumentiert statt geraten.** Preview-Browser auf den Dev-Server, `transitionrun`/`animationstart`/Class-Mutations global geloggt, Planet→Planet-Klick per CDP: **keine Massen-Label-Transitions mehr** (die Runde-2-Fixes greifen — einzig die alte Welt gibt sauber einmal den Hover-Look ab, plus die beabsichtigte Bloom-Animation). Zwei echte Funde stattdessen:
- **Das Welt-Popup teleportiert beim Planetenwechsel zum neuen Pin und rast dann — am Pin klebend, mit backdrop-blur — quer über die Karte.** Das ist der sichtbare „Flicker" beim Klick; beim Drag bewegt sich das Popup deltagleich mit der Karte, darum ruhig. Fix: `ChartBus.onFlightChange` (ChartStage meldet Flugstart/-ende; Grab/Wheel/Restore brechen ab) → WorldPanel duckt sich für die Flugdauer weg (`.cg-pop.inflight`, imperativ, 0.18s raus) und blendet am Ziel normal ein. Gilt auch für den Erstklick — Flug erst, dann der Bericht.
- **Frame-Guards:** `classList.add("moving")` und `--cg-ik` schrieben ihre Attribute jeden Frame neu (DOMTokenList/`setProperty` serialisieren auch bei identischem Wert → Style-Recalc über ~2000 SVG-Knoten pro Frame). Beide nur noch bei tatsächlicher Änderung.

Beifang aus der Instrumentierung: Klicks auf Region-Typo-Labels (z. B. „Sanctus Reach") selektieren korrekt, haben aber konstruktionsbedingt kein `sel-on` (kein `.cg-w`-Pin) — unverändertes Verhalten, nur dokumentiert.

Verification Runde 3: `typecheck` + `lint` grün; Popup-Ducking + `sel-on`-Übergabe im instrumentierten Browser verifiziert; Dev-Server frisch gestartet. **Wichtig fürs Eyeballing: Tab hart neu laden (Ctrl+Shift+R)** — ein offener /map-Tab fährt sonst das alte Bundle.

## Nachtrag 3 — Feedback-Runde 4 (vor PR, 2026-07-06)

**1. „Alle Elemente flickern SEHR stark" — der wahre Täter war Performance, nicht CSS-Logik.** Diesmal im *fokussierten* Preview-Browser gemessen (die Runde-3-Instrumentierung lief unbemerkt in einem rAF-gedrosselten Hintergrund-Tab bei ~1 fps — Massen-Effekte waren dort unsichtbar; zusätzlich stellte sich heraus, dass `preview_click` off-viewport-Elemente per Wheel-Events heranscrollt und bis zu 5 Klick-Zyklen feuert — die früheren „Event-Stürme" waren zum Teil Test-Artefakte). Saubere Befunde bei echtem Timing (~47 fps Floor):

- Planet→Planet-Klick bei konstantem Zoom: **ruhig** (19 Transition-Events, alle designt) — die Runde-2/3-Fixes greifen wirklich.
- Aber: Wheel-Zoom über Band-Grenzen produzierte **375–450 ms-Frame-Stalls** (23 fps Schnitt, Einzelframes = Drittelsekunden-Freezes), während ~1000 Labels gleichzeitig faden. Ursache: jedes der ~1050 `.cg-lbl` trug `font-size`/`stroke-width`/`translateY` als `calc(… * var(--cg-ik))` — jede per-Frame-Änderung von `--cg-ik` erzwang ein **Text-RELAYOUT aller Labels**. Ruckelnde Frames + Massen-Fades = „alle Elemente flickern".

Zwei strukturelle Fixes (beide px-identisch zur alten Optik verifiziert):

- **Counter-Scale über Transform statt Schriftgröße:** `.cg-lbl` hat jetzt konstante `font-size`/`stroke-width` und skaliert per `transform: scale(var(--cg-ik)) translateY(…)` — Transform-Änderungen layouten nicht; Text wird einmal gesetzt. (Der SVG-Default-Transform-Origin ist der lokale Ursprung = Pin-Zentrum; empirisch dx/dy/dw/dh = 0 gegen die calc()-Variante. `.cg-rgn`/Zonen-Labels bleiben auf calc() — sie sitzen auf `x`/`y`-Attributen, wo eine CSS-Transform die Position clobbern würde; bei ~10 Stück kostenlos.)
- **`display: none` für ausgeblendete Band-Stufen:** t1/t2-Labels unter ihrem Band und `.cg-w.vb1`-Pin-Gruppen bei Band 0 fallen komplett aus Recalc + Paint (Chrome überspringt display:none-Teilbäume) — bei der Default-Ansicht ~1800 Knoten weniger pro Kamera-Frame. Einblenden fadet weiter (`@starting-style`); Ausblenden poppt beim Band-Verlassen bewusst sofort (ein verzögerter display-Flip via allow-discrete kam gemessen als zweiter ~300 ms-Batch 0,6 s nach der Grenze — verworfen). `sel-on` erzwingt `display` + `opacity`, das Label der gewählten Welt steht weiter in jedem Band (verifiziert: sel `display:block/opacity:1` bei Band 0, andere t1 `none`).
- Beifang: `classList.remove("dragging")` in `pointerup`/`pointerleave` nur noch bei vorhandenem Token (DOMTokenList.remove schreibt das Attribut laut Spec auch bei fehlendem Token neu → Recalc pro Klick); das Popup schiebt sich am Flugende unter den ruhenden Cursor und feuerte so `pointerleave`-Rewrites.

Messung nachher: In-Band-Zoom Ø 29 ms bei 21 ms Umgebungs-Floor (~8 ms echte Arbeit/Frame); der einmalige Band-Grenz-Batch (~300 ms, ~900 Knoten verlassen den Render-Tree) bleibt — er existierte vorher genauso (375 ms) und ist ein Einzel-Hickser pro Grenze, kein Dauerflickern. Dev-Umgebung zusätzlich saniert: `.next` gepurgt, exakt ein frischer Dev-Server (bekanntes Stale-Chunk-Muster nach vielen HMR-Runden konnte in Philipps Tab mit hineingespielt haben).

**2. Legende entschlackt.** (a) „● AUSPEX"-Status raus, „contacts · recorded"-Zeile raus, Footer „1 332 / 1 685 records placed" raus (+ zugehöriges CSS inkl. reduced-motion-Verweis). (b) „Courses" → **„Character voyages"** (Hint: „trace a character's journey across the chart"). (c) „Instruments" → **„Overlays"**; die PSYKANA/M42-Tags an den Toggles entfernt. (d) Display-Toggles ohne Zusatz-Satz, prägnante Labels: **„Only worlds with records"**, **„Star-dust — unrecorded worlds"**, **„All worlds at every zoom"**; der Unclassified-Hint im Klassifikations-Block bleibt.

Verification Runde 4: `typecheck` + `lint` grün; Optik-Parität + sel-on-Band-Override + Fade-in im Preview-Browser verifiziert (Screenshot der neuen Legende gesichtet); ein frischer Dev-Server, `/map` → 200. **Eyeballing: Tab hart neu laden (Ctrl+Shift+R).**

## Nachtrag 4 — Feedback-Runde 5 (vor PR, 2026-07-07)

**Datenpunkt: Chrome flickert, Edge ist smooth** — beide Chromium, gleicher Code, gleiche Maschine. Das entlastet den Code und zeigt auf Chromes Profil-Zustand; die zwei üblichen Verdächtigen: (a) **Hardware-Beschleunigung aus** (Chrome schaltet die GPU nach Treiber-Crashes still auf Software-Rastern — `chrome://gpu` → „Graphics Feature Status" muss überall „Hardware accelerated" zeigen), (b) **eine Extension** (Dark Reader & Co. reagieren auf unsere per-Frame-Attribut-Writes; Inkognito-Test = Extensions aus). Diagnose-Schritte an Philipp übergeben; Claude-in-Chrome war nicht verbunden, direkte Messung im betroffenen Profil stand daher nicht offen.

**Lean-Review des gesamten Branch-Diffs** (expliziter Auftrag): Die Flicker-Maschinerie über alle Runden ist zusammen ~80 Zeilen, jede mit gemessenem Mechanismus dahinter — deferred Pointer-Capture + `pointerleave`-Cleanup (Klick-Doppelpuls), `.moving`-Hover-Gate + `sel-on`-Hold, Flight-Ducking über `ChartBus.onFlightChange` (Popup-Rennen), Frame-Guards, Transform-Counter-Scale + display-Band-Gates (375 ms-Stalls → ~8 ms). Nichts Spekulatives gefunden, nichts entfernt; der Runde-4-Umbau hat 55-map.css netto *vereinfacht* (sieben `calc()`-Ausdrücke weniger). Ein Kommentar gestrafft. `typecheck` + `lint` grün, ein Dev-Server, `/map` → 200.

**Nachtrag zur Runde 5 (2026-07-07, gleicher Tag): Philipps Eingrenzung fand den echten Täter.** „Flickert nur mit der Interdicted Zone im Bild, auch in Edge" → die Zone ist das **Great-Rift-Band**: 926 einzelne `<path>`-×-Marken, jede mit `vector-effect: non-scaling-stroke` (Chromium tesselliert NSS-Pfade bei **jeder** CTM-Änderung neu = jeder Kamera-Frame), plus ein echter `feGaussianBlur` auf dem Band (Re-Rasterung pro Frame). Beides nur sichtbar-teuer, wenn der Rift im Viewport liegt — exakt die Repro. Fix (und zugleich Philipps Design-Vorschlag „Striche statt Kreuze, wie alte Karten"):

- **Schraffur statt ×-Raster, gebündelt:** neues `riftHatchPaths()` (chart-geometry) bündelt die 926 Zellen in ~6 opacity-gebucketé Sammelpfade mit „/"-Strichen (Bucket-Fehler ≤0.08, unsichtbar unter dem Zell-Jitter); kein `vector-effect` mehr — Strichbreite hält `.cg-riftgrid { stroke-width: calc(0.85px * var(--cg-ik)) }` konstant. NSS im Rift-Teilbaum: 945 → 19 (Riftflow/Jags/Blitze, bewusst belassen — Kleinserien).
- **Band ohne SVG-Filter:** der `feGaussianBlur(5)` weicht vier gestuften, breiter werdenden Strichen (Blur-Falloff gefaked, optisch gleichwertig — Screenshot-geprüft).
- **RiftWords angepasst (netto kleiner):** die Wort-Glitch-Engine kann keine Einzelzellen mehr verstecken → pro Wort ein Redaction-Balken (`rect`, VOID0) hinter den Lettern, folgt dem Wort-Envelope; `setCellHidden`/`cellsGRef` gelöscht.
- Sturm-/Areal-Marken (26+13+34+12, ebenfalls per-Element-NSS) bleiben unangetastet — zwei Größenordnungen kleiner, Philipps „am anderen Ende der Karte ist alles fein" bestätigt sie als unauffällig.

Verification Runde 5b: `typecheck` + `lint` grün; Raster im Preview verifiziert (5 Sammelpfade, Strichbreite 0.85 px, Filter weg, Band-Optik + „✠ INTERDICTED ZONE ✠"-Label intakt, Screenshot gesichtet); ein frischer Dev-Server, `/map` → 200. Eyeballing: Tab hart neu laden. Beifang: Hash-**Restore** (`#world=…&cam=…` beim Kaltstart) griff im Preview-Test nicht (Kamera blieb auf Home) — nicht Teil dieser Runde, als offener Punkt für den nächsten Brief notiert.

## Nachtrag 5 — Feedback-Runde 6 (vor PR, 2026-07-07)

Philipp: Flickern besser, aber nicht weg; Storm-Fassung I > II/III; Wunsch: die Interdicted Zone im Stil der roten Schraffur von `design/08-cartographer/a-portolan.html` („einfache Unaufgeregtheit"), „keine 3 Stück mehr, back to the roots"; die rotierende Sonar-Linie raus.

**1. Rift = Portolan-Schraffur, Fassungen I–III gelöscht.** Der Korridor ist jetzt EIN geschlossener Pfad (`geo.corridor`, das ±corrW-Offset-Polygon existierte schon für den Zellen-Test), gefüllt mit dem a-portolan-Pattern 1:1 (5×5-Kachel `userSpaceOnUse`, 45°, eine Blutlinie 0.8/0.5) plus stiller Strichel-Kontur — statische Tusche, kein per-Frame-Anteil mehr. Gelöscht: alle drei Storm-Fassungen (RiftFlow-Dash-Animation — lief 26 s-infinite = Dauer-Repaint —, Band-Strokes, Jags, Blobs, Radial-Gradients), der `data-storm`-Prop/Attribut-Pfad durch ChartStage, der I/II/III-Switcher im DirectionPanel, `riftHatchPaths` (Runde-5-Zwischenstand), Jag-/Blob-Geometrie + `JagLine`, zugehöriges CSS inkl. reduced-motion-Einträgen. Rift-Teilbaum: ~950 → **19 Knoten**, NSS 945 → 11 (Kontur + 10 unrest-Blitze). Skulls + ✠-Label bleiben; die Label bekommen `paint-order: stroke`-Saum (sie liegen jetzt AUF der Schraffur, die Zell-Aussparungen sind Geschichte).

**2. Sweep entfernt.** `Sweep.tsx` + Konstanten + `sweepClipPath` gelöscht: die Peil-Linie schrieb in einer Endlos-rAF-Schleife jede Sekunde 60 Transform-Writes ins SVG und rotierte ein 1024²-Rasterbild hinter einem Clip — ein permanenter Repaint-Treiber selbst bei ruhender Karte, und laut Philipps Design-Urteil („kein Sweep-Zeiger im HUD", Memory) ohnehin unerwünscht.

**3. RiftWords-Crash gefixt (Smoke-Test-Fund).** Nach dem Umbau blieb `cellsGRef` in der useEffect-Dep-Liste zurück — Unrest-Toggle warf `ReferenceError` in die Error-Boundary. Gefixt; Unrest-Smoke-Test grün (3 Wort-Slots + Redaction-Rects erscheinen, Toggle-off räumt auf, keine Konsolen-Fehler).

**Offen/beobachten:** Die Sturm-×-Marken (`.cg-sx`, Eye of Terror 26 + Maelstrom 13) und das Leviathan-Feld (34) pulsieren mit **immer-an** `cgFlicker`-Animationen (nicht `.unrest`-gated) — der Maelstrom liegt direkt am Rift-Korridor. Bewusst nicht angefasst (designtes Atmen, Formcode der Stürme); wenn Philipp weiterhin „Flickern" nahe der Zone sieht, ist das der nächste Kandidat (je eine CSS-Zeile).

Verification Runde 6: `typecheck` + `lint` grün (explizite Exit-Codes); Portolan-Optik im Preview gesichtet (Schraffur-Band + Kontur + Label lesbar), `data-storm`/Fassungen/Sweep im DOM verifiziert weg; ein frischer Dev-Server, `/map` → 200. Eyeballing: Tab hart neu laden.

## Nachtrag 6 — Feedback-Runde 7 (vor PR, 2026-07-07)

Philipp: Flickern viel besser. Neue Punkte: (1) „All worlds at every zoom" überflüssig; (2) LOD nicht ausgearbeitet — Buch-Welten sind als Punkt größer, Namen kommen aber gleichzeitig mit Dust-Namen, „eine Stufe dazwischen" fehlt; (3) unintuitiv, dass Stardust auf jeder Ebene sichtbar ist, wichtigere Welten aber erst per Toggle — Vorschlag: Stardust ausgezoomt bei ~60 % Deckkraft, voll erst wenn seine Namen lesbar sind; (4) künftig eingetragene Interdicted Zones im Schraffur-Stil, nicht als rotes Overlay.

**1. Wichtigkeits-invertierten Schleier gelöscht.** Der Top-100-Schleier (`payload.vbCut` + `.cg-w.vb1`-display:none bei Band 0) und sein Gegenmittel „All worlds at every zoom" (Census-Toggle, `showAll`-State/Action, `.show-all`-Klasse durch ChartStage) sind komplett raus — **jede Welt mit Aufzeichnungen ist jetzt in jedem Zoom-Band da**, Display-Sektion nur noch zwei Toggles. Genau das war Philipps Widerspruch: Dust überall sichtbar, Buch-Welten versteckt.

**2. Vier-Band-Namens-Treppe.** Neues Band 3 (Schwellen 1.7 / 3.1 / 5.6 × k0, ~geometrisch ×1.8): t0 (≥15 Werke) immer → t1 (≥4) ab Band 1 → t2 (1–3) ab Band 2 → **Dust-Namen (neu `t3` statt `t2 dust`) erst ab Band 3**. Damit bekommt jede Welt mit Buch ihren Namen sichtbar VOR jeder ohne — die fehlende Zwischenstufe. Der Band-2-Brighten (`opacity: 0.94`) gilt jetzt für Band 2+3.

**3. Dust-Deckkrafts-Rampe.** `.cg-dust` (die EINE Layer-Gruppe, nicht 900 Knoten) steht außerhalb von Band 3 auf `opacity: 0.6` und fadet (0.6s) auf 1, sobald Band 3 die t3-Namen aufmacht — Philipps 60 %-Vorschlag wörtlich. Selektierte Dust-Welten behalten ihren vollen Selection-Marker (liegt außerhalb der Layer).

**4. Interdiction-Zonen = Portolan.** `.cg-zone.interdiction .zshape` füllt mit `url(#cg-riftHatch)` (Pattern lebt in GreatRift, immer gemountet) + Rift-identischer Strichel-Kontur (3 3, 0.4, NSS) statt `rgba(142,59,50,0.07)`-Flachrot. Gilt via geteilter `ZoneShape` auch im Editor — Philipp sieht beim Zeichnen exakt den Live-Stil.

Verification Runde 7: `typecheck` + `lint` grün (Exit 0); Band-Treppe im Preview durchgezoomt (Band 0: 141/141 Pins sichtbar, Dust 0.6, Toggle weg; Band 1: 44 t1-Namen; Band 2: 77 t2-Namen, 0 Dust-Namen; Band 3: 900 t3-Namen, Dust-Opacity 1.0); Zonen-Editor-Draft rendert mit `url(#cg-riftHatch)`/NSS (computed styles + Screenshot); keine Konsolen-Fehler; ein frischer Dev-Server, `/map` → 200. Eyeballing: Tab hart neu laden (Ctrl+Shift+R).

## Nachtrag 7 — Feedback-Runde 8 (vor PR, 2026-07-07)

Philipp: (1) Text für ALLE Karten-Punkte via günstigem Sonnet-Lauf mit Lexicanum-Research (Prompt fürs Terminal gewünscht; keine Em-Dashes, non-AI-Wording); (2) zwei Zoom-Presets unten rechts, die exakt auf die Namens-Ladestufen ~3.2× und 6.0× springen; (3) Legende teilweise weiter unleserlich („trace a character's journey…" deutlich zu klein) + Wording unklar („was soll census sein?"); (4) Segmentum-Kanten überlagern das Raster → Linien mit ungleichen Abständen (Screenshot, grün eingekreist); (5) die jetzige Interdicted Zone raus — Zonen zeichnet er künftig selbst im Editor.

**1. Map-World-Blurbs: Runbook + Wiring.** Neu `docs/map-world-blurbs-run.md` — resumierbarer headless Auftrag für `claude --model claude-sonnet-5 --effort medium -p …` (Kommando steht im Runbook; Sonnet 5 auf medium statt Sonnet 4.6, Philipps Zuruf — medium ≈ Sonnet-4.6-high laut Docs, spart Kontingent gegenüber dem High-Default): identifiziert alle klickbaren Welten ohne Text (Katalog minus location-blurbs-Abdeckung minus bereits erledigte; nicht-klickbare Region-Marken ausgenommen — Ziel ~923 von 1041), recherchiert primär `wh40k.lexicanum.com` (Fallback WebSearch/Fandom), schreibt Einträge nach **neu `src/lib/map/world-blurbs.json`** (`{id, blurb, confidence 0.8|0.3, sourceUrl?}`, Welt-id-Keyspace — location-blurbs bleiben unberührt und gewinnen immer). Stilregeln im Runbook: Englisch, 1–2 Sätze ≤240 Zeichen, Archiv-Ton mit drei echten Bestands-Beispielen als Anker, **Em-/En-Dash-Verbot + KI-Floskel-Blacklist**, Quelle-fehlt-Fallback = nüchterner Satz nur aus Katalogfeldern (confidence 0.3). Schreib-Kadenz ~20, Stopp ~120/Lauf, JSON-Validierung nach jedem Write. Wiring: neu `src/lib/map/world-blurbs.ts` (toleranter Parser, Modul-Cache) — WorldPanel lädt den Chunk **lazy beim ersten blurb-losen Panel** (dynamic import, id-gekeyter Fallback-State gegen Stale-Text beim Weltwechsel); weder Payload noch Initial-Bundle wachsen. Featured mit location-blurb laufen unverändert über den Payload.

**2. Zoom-Presets „3×"/„6×".** Zwei Buttons im Zoomer (zwischen − und ⌂): `zoomPreset(kr)` fliegt 650 ms zentrums-treu (`getCenterRel` → `flyTo`) auf exakt `k0·3.2` bzw. `k0·6.0` — eine Haaresbreite über den Band-Schwellen 3.1/5.6, also genau „die Stufe, ab der die nächsten Namen geladen sind" (3.2× = alle Welten mit Aufzeichnungen benannt, 6.0× = alle Welten benannt). Tooltips ohne Em-Dash; CSS `.cg-zoomer button.preset` (11.5px Mono).

**3. Legende: Lesbarkeit + Wording.** `.c-hint` 15px/faint → **18px (`--fs-read-sm`)/dim**; Census-Subzeilen `.crow` und Seek-Liste `.skitem` 15 → 16.5px (`--fs-read-xs`). Wording-Pass: Sektion **„Census" → „Filter worlds"** (Badge „filtered" passt jetzt wörtlich), Caption „Display" → „Show on the chart", „Only worlds with records" → **„Worlds from books & podcasts only"**, „Star-dust — unrecorded worlds" → **„Star-dust: worlds without records yet"** (Em-Dash auch aus der UI raus), „By classification" → **„By world type"**, Unclassified-Hint → „no type recorded in the archive", Seek-Tag `N rec` → `1 work`/`N works`. Overlays erklären sich jetzt: Lumen Astronomican + Tag „THE BEACON'S REACH", Imperium Nihilus + Tag „THE DARK HALF" (`.rt-tag` jetzt uppercase-transformiert, Kurs-Tags unverändert).

**4. Raster weicht der Segmentum-Silhouette.** Diagnose (nachgerechnet gegen Terra 333.4/401.95): oberer Kreis = Goldbogen-Paar **Solar-Ring 123.3 / Tempestus-Innenkante 139** (15.7 gu), unterer Kreis = **Graticule-Ring 385 / Tempestus-Stufe 400** (15 gu, Ecke = Stufensprung bei 75°); weitere Offender 385/391 (6 gu), 385/361 (24 gu), 300/302 (2 gu). Fixes: (a) Tempestus `r0` 139 → `SOLAR_R` — die Innenkante startet wie alle anderen Keile AUF dem Solar-Ring (Referenz misst 139, Screenshot-Veto schlägt Messtreue); (b) neu `ringArcs(r, clear=26)` in chart-geometry: die drei `POLAR_RINGS` rendern als Bogen-Spans mit **Lücken, wo eine Stufenkante näher als 26 gu läuft** (Gap-Merge + Naht-Join über die Domain-Grenze, A-Kommandos ≤180°); (c) der Tick-Kranz (r 381–385) setzt mit demselben `RING_CLEAR`-Test aus. Ring 215 bleibt Vollkreis (nichts nah), Ring 300 verliert nur den 302er-Span, Ring 385 die Obscurus-/Tempestus-Spans.

**5. Beispiel-Zone entfernt.** `zones.json` → `{ "zones": [] }` — der unveröffentlichte Dekagon-Platzhalter ist raus, ZonesLayer rendert nichts, der Editor startet leer. Achtung fürs Zeichnen: der localStorage-Draft (`cg-zones-draft-v1`) kann die alte Beispiel-Zone noch enthalten — im Editor einmal **Reset** drücken. Nachzügler in derselben Runde: Philipp sah „die Interdicted Zone" weiterhin — das waren die drei Rift-Label in GreatRift.tsx. **„✠ INTERDICTED ZONE ✠" ist dort raus** (das Wording kollidiert mit den künftigen hand-kuratierten Interdiction-Zonen); die drei Label-Anker tragen jetzt einzeilig **„✠ CICATRIX MALEDICTUM ✠"** (die redundante M42-Subzeile entfiel mit) — der Korridor bleibt benannt, heißt aber bei seinem Namen.

**6. Zonen-Editor = strikt dev-only (Nachzügler, Philipps Zuruf).** `zoneEdit` ist jetzt `process.env.NODE_ENV === "development" && zoneEditParam` — NODE_ENV wird beim Build statisch ersetzt, im Prod-Build ist das Flag konstant false: `?zones=edit` wird auf der Live-Seite ignoriert, der ZoneEditor-Ast (samt Import) fällt als toter Code aus dem Bundle, nur der Dev-Server (`npm run dev`) hat das Werkzeug. Die kuratierten Zonen selbst (`zones.json`, `published: true`) rendern live weiter — Daten shippen, Werkzeug nicht. Konsistent mit dem schon vorher NODE_ENV-gegateten `.cg-zed-toggle`-Einstieg. Live-Gegenprobe steht auf dem Vercel-Preview von PR #225 offen (`/map?zones=edit` muss die normale Karte zeigen).

**7. ALLE hartkodierten Zonen-Grafiken ausgebaut (zweiter Screenshot, grün markiert: Rift-Korridor + Eye-of-Terror, Sautekh-Dynastie, Hive-Fleet-Leviathan).** Der Zonen-Bestand kommt ab jetzt ausschließlich aus Philipps Hand-Kuration — genau dafür existieren die Editor-Kinds `storm`/`interdiction`/`hive-fleet`/`necron-dynasty`. Gelöscht: `GreatRift.tsx` komplett (Schraffur-Korridor, Skulls, Cicatrix-Label, Blitze, Wort-Glitch-Engine) samt „Rift unrest"-Proof (State/Action, DirectionPanel-Toggle, `unrest`-Klasse durch ChartStage); `Storms` + `Areas` aus decor.tsx (Eye of Terror, Maelstrom, Leviathan-Feld, Sautekh-Border); in chart-geometry die gesamte Raster-/Sturm-/Areal-Maschinerie (`riftGeometry`, Arc-Length-Sampling, `GLITCH`/`RIFT_WORDS`, `SKULL_PATH`, `stormMarks`/`xMarkPath`/`leviathanMarks`/`sautekhMarks`/`SAUTEKH_BORDER_D`, `WARP_*`/`VOID0`-Farben — Datei 591 → 283 Zeilen); zugehöriges CSS inkl. `cgFlicker`/`cgStormBreath`/`cgSkull`/`cgArc`/`cgLevBreath`-Keyframes + reduced-motion-Einträge. Damit ist nebenbei die Watch-List-Position „immer-an cgFlicker-Pulse (.cg-sx/.cg-lev)" erledigt — die Elemente existieren nicht mehr. **Geblieben:** die Rift-Spine-Kurve (`RIFT_D`/`RIFT_A`/`RIFT_B` + `nihilusPath`) als Schattengrenze der Lumen-/Nihilus-Overlays, und das `#cg-riftHatch`-Pattern — umgezogen nach decor.tsx (**neu `HatchDefs`**, immer gemountet), weil die hand-kuratierten Interdiction-Zonen + der Editor damit füllen.

**Offen (nächste Runde, Philipps Zuruf):** Die verbliebene Rift-Spine-Kurve (`RIFT_D` — Schattengrenze der Lumen-/Nihilus-Overlays) ist noch Studien-Geometrie; sobald Philipps hand-gezeichnete Rift-/Interdiction-Zone in `zones.json` liegt, wird die Schattengrenze aus dieser Zone abgeleitet (Spine durch die Zonen-Längsachse, A/B = Enden). Als ⚠-TODO in chart-geometry.ts + LumenNihilus.tsx kommentiert; bis dahin kann der Nihilus-Schatten sichtbar von der gezeichneten Zone abweichen.

Verification Runde 8: `typecheck` + `lint` grün (Exit 0); ein Dev-Server (nach `.next`-Purge frisch), `/map` → 200. Eyeballing: Tab hart neu laden (Ctrl+Shift+R).

## Nachtrag 8 — Feedback-Runde 9 (vor PR, 2026-07-07)

Philipp liefert seinen Zonen-Export (`zones (7).json`, 15 Zonen) und meldet: (1) Zonen sitzen noch vor den Planeten — Planeten müssen immer davor liegen, damit man sie anklicken kann; (2) das Scourge-Stars-Gebiet in einem ungesunden Grün; (3) der Blurb-Lauf ist durch → einarbeiten und committen; (4) Filter mit winzigen Punkten (z. B. Fleets & Flotillas) zeigen nach dem Filtern „erstmal gar nichts": der Ausklapp-Pfeil an den Filtergruppen ist als Affordance zu klein, und es fehlt ein Button („kleines N"), der die Namen unabhängig vom Zoom antogglet.

**1. Zonen-Kuration eingecheckt.** Philipps Export 1:1 nach `src/lib/map/zones.json` (15 Zonen, alle published: Cicatrix Maledictum, Ultramar, Scourge Stars, Hadex Anomaly, Maelstrom, Vortex of Despair, 2 Stürme, Somnium Stars, Sirens storm, Malfactus, Tau Empire + 3 Necron-Dynastien). Einzige inhaltliche Änderung: „The Scourge Stars" kind `interdiction` → **neu `plague`** (Punkt 2).

**2. Z-Order: Diagnose + Editor-Fix.** Die **gebaute Karte war schon korrekt** — `#cg-fields` rendert vor Dust/Pins, `.cg-zones` hat `pointer-events: none`; Philipps Beobachtung stammt aus dem **Editor**, der die Shapes bislang als oberste SVG-Ebene zeichnete. Fix: die Zonen-Flächen rendern im Editor jetzt per Portal in `#cg-fields` (dieselbe Ebene wie live, unter den Planeten — Portal-Ziel via Ref-Callback gegriffen, der Hook-Linter verbietet setState-im-Effect); nur Drahtgitter + Griffe der aktiven Zone bleiben obenauf. Planeten sind damit auch beim Kuratieren immer sichtbar und klickbar; Zonen-Selektion geht weiter über Fläche (wo kein Pin-Halo darüber liegt) oder die Panel-Liste. CSS-Selector `.cg-zed-layer .zidle` → `.cg-zed-shapes .zidle`.

**3. Neuer Zone-Kind `plague` („ungesundes Grün").** `ZONE_KINDS` + Label „Plague zone" (Editor-Dropdown), Farbe `PLAGUE = #8fae4a` (Nurgle-Galle, chart-geometry), Pattern `#cg-plagueHatch` in `HatchDefs` — dieselbe Portolan-Schraffur wie interdiction, aber **-45° Gegenrichtung**, damit sich rote und grüne Felder auch bei Überlappung lesen; Kontur + Label in derselben Galle. ⚠ Der strikte `parseZones` lehnt unbekannte Kinds komplett ab — Kind-Registrierung und zones.json sind deshalb im selben Commit.

**4. World-Blurbs eingearbeitet + committed.** Der Sonnet-Lauf hat **923 Einträge** geliefert (Ziel war ~923 — vollständig): 689 mit Lexicanum-/Fandom-Quelle (confidence 0.6–0.8), 229 nüchterne Katalog-Fallbacks (0.3). Qualitäts-Check per Skript: 0 Duplikate, 0 Em-/En-Dashes, 0 Überlängen (>260), 0 leere Texte; 5 Einträge mit Blacklist-Phrase („serves as") von Hand nachformuliert (keletros, neutra, talasa-prime, talassar, the-labryinth-of-thanotep). Wiring (WorldPanel-Fallback, lazy Chunk) stand schon aus Runde 8.

**5. Namens-Zwang-Toggle.** Neue Census-Zeile „World names at every magnification" (Symbol: kursives N) unter den Display-Toggles: `state.names` → `svg.names` (ChartStage-Klasse) → CSS hebt die display-Band-Gates der Labels auf (`:not(.names)` an den Gate-Selektoren) und stellt Dust auf volle Deckkraft (erzwungene Namen auf 60 %-Layer wären schwer lesbar). Der Recalc-Preis von ~1050 sichtbaren Labels in der Übersicht ist bewusst gewählt — der Toggle ist genau der Rettungsanker für dünne Filter (nur Fleets → eine Handvoll winziger Punkte, mit Namen sofort auffindbar).

**6. Ausklapp-Pfeil als echte Affordance.** `.cgrp-h .car`: 15 → 20px Spalte, 11 → 14px Pfeil, faint → dim, +Klickfläche (padding); `.cx .pad` zieht auf 20px mit (Symbol-Spalten fluchten). Title-Text erklärt jetzt, was aufklappt („Unfold: filter single classifications inside this group").

**Commits/PR:** `7d2788f` (Zonen-Kuration + Runde-8-Polish) und `2f4fcc6` (Blurbs) sind gepusht — PR #225 aktualisiert. Die Runde-9-Filter-UX (Punkte 5+6) liegt im Working Tree; Commit nach Philipps Eyeball.

**Hinweise an Philipp:** (a) Der Editor-localStorage-Draft kennt die Scourge Stars noch als `interdiction` — beim nächsten Editor-Besuch einmal **Reset** drücken (lädt zones.json samt plague) oder das Kind im Dropdown auf „Plague zone" stellen. (b) Drei Zonen-Namen sehen nach Tippfehlern aus, bewusst NICHT angefasst (Hand-Kuration): „Sauthekh Dynasty" (kanonisch: Sautekh), „Storm of the Emperors Wrath" (Emperor's?), „Sirens storm" (Siren's Storm?) — Zuruf genügt, dann fixe ich sie in zones.json.

**Nächster Schritt (zugesagt, auf Zuruf):** Nihilus-/Lumen-Schattengrenze aus Philipps zone-2 „Cicatrix Maledictum" ableiten (Spine durch die Zonen-Längsachse, Enden als Strahlen-Anker) und die Studien-Kurve `RIFT_D`/`RIFT_A`/`RIFT_B` ersetzen — ⚠-TODOs stehen in chart-geometry.ts + LumenNihilus.tsx.

Verification Runde 9: `typecheck` + `lint` grün (Exit 0), einmal vor den Commits und einmal nach der Filter-UX; ein Dev-Server, `/map` → 200. Eyeballing: Tab hart neu laden (Ctrl+Shift+R).

## Nachtrag 9 — Feedback-Runde 10 (vor PR, 2026-07-08)

Philipp: Zonen-Toggle gewünscht, „kann auch in die Legende einfach rein".

**Zonen-Toggle im Census.** Neue Zeile „Zones & storm fields" (gestricheltes Feld-Symbol mit Schraffur, Zähler = published-Zonen) im „Show on the chart"-Block zwischen Star-dust und Namens-Zwang; rendert nur, wenn Zonen existieren. Mechanik: `state.zonesOff` → `svg.nozones` (ChartStage-Klasse) → CSS `opacity: 0` auf `#cg-fields` — die Ebene fadet weich über die vorhandene 0.7s-Transition, kein Mount/Unmount, gewinnt per ID-Spezifität gegen die 0.22-Kurs-Abdunklung. Aus-Zustand zeigt sich in der Zeile wie beim Dust-Toggle (`.cx.off`).

Verification Runde 10: `typecheck` + `lint` grün (Exit 0); ein Dev-Server, `/map` → 200. Zusammen mit der Runde-9-Filter-UX uncommitted im Working Tree — Commit auf Philipps Zuruf.

**Rollup-Fakten (für Cowork):** Map-World-Blurbs sind **komplett** (Runbook `docs/map-world-blurbs-run.md`, headless Sonnet 5 @ medium; `src/lib/map/world-blurbs.json` mit 923 Einträgen im Welt-id-Keyspace, lazy Client-Chunk via `src/lib/map/world-blurbs.ts` — location-blurbs haben Vorrang); Zoomer hat Presets 3.2×/6.0× auf den Band-Schwellen; Legende-Wording: „Filter worlds"/„By world type"/„Show on the chart"; Census hat einen Namens-Zwang-Toggle („World names at every magnification" → `svg.names` hebt die Label-Band-Gates auf) und einen Zonen-Toggle („Zones & storm fields" → `svg.nozones` fadet `#cg-fields`); Graticule weicht der Silhouette (`ringArcs`, `RING_CLEAR=26`, Tempestus-Innenkante = Solar-Ring); **alle Zonen-Grafiken sind Hand-Kuration**: GreatRift.tsx/Storms/Areas/„Rift unrest" gelöscht, `zones.json` trägt Philipps 15 kuratierte Zonen (inkl. neuem Kind `plague` = Nurgle-Galle `#8fae4a`, -45°-Schraffur `#cg-plagueHatch`; beide Patterns leben in decor.tsx → `HatchDefs`); die Rift-Spine-Kurve (`RIFT_D`) ist noch Studien-Geometrie und soll aus zone-2 „Cicatrix Maledictum" abgeleitet werden (⚠-TODOs in chart-geometry.ts/LumenNihilus.tsx); Zonen-Editor ist hart dev-only (NODE_ENV-Gate, `?zones=edit` wirkungslos im Prod-Build), seine Zonen-Flächen rendern unter den Planeten (#cg-fields-Portal).

## References

- Parent: `sessions/2026-07-05-178-impl-map-cartographer.md` (inkl. Nachträge 1+2).
- Screenshot Drag-Bug: `design/beispiele/Screenshot 2026-07-06 015016.png`.
