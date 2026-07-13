---
session: 2026-07-13-210
role: implementer
date: 2026-07-13
status: complete
slug: map-feedback-pass
parent: Maintainer-Feedback nach S10a-Browser-Abnahme (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - sessions/2026-07-13-209-impl-launch-s10a-map-payload-a11y.md
commits: []
---

# Map-Feedback-Pass — Mobile-Flicker, Journey-Flow, Chrome-Aufräumen, Espandor-SSOT

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang: Product · Branch: `codex/product-map-feedback`.

## Summary

Sieben Maintainer-Feedback-Punkte aus der S10a-Geräte-Abnahme, alle auf dem Cartographer. Kern ist der **Mobile-Flicker-Fix**: die Journey-Route marschiert auf Phones nicht mehr — `RouteMotionCanvas` zeichnet die stehende Linie jetzt als Reihe kleiner **Richtungs-Chevrons** (statisch, Fahrtrichtung ablesbar) und repaintet nur noch bei Kamera-Frames plus während des begrenzten Draw-in-Fensters beim Stationswechsel. Der bisherige 30-fps-Dauerloop mit driftendem `lineDashOffset` invalidierte permanent einen Fullscreen-Layer — genau der Mechanismus, der das Entity-Flackern beim Draggen zurückgebracht hatte. Idle = null Repaints; die Leg-Draw-Animation beim Klick von Station zu Station bleibt. Desktop (SVG-Marschier-Dashes) unverändert.

Dazu: Journey-Flow entschlackt („Skip Tour" raus — las sich als ungewolltes Autoplay; Overture hat jetzt ✕ + einen einzigen „Begin Journey"-Lead), Ende benannt („Show the full route →" statt „Fin · Survey the voyage") und die Abschlusskarte navigierbar gemacht („← Back" zur letzten Station, „Restart Journey" ab Station 1). Kartenhierarchie auf beiden Karten: **Name + Beschreibung führen, Datum ist leise Fußnote, „ACT XXX" komplett raus** (Position steht im Pager „3 / 9"). Chrome: Wortmarke auf „Chrono Lexicanum" verkürzt und auf Phones verkleinert (kollidierte mit dem Vox-Stud oben links), „RET"-/„SEEK"-Hints an Suche und Sheet-Pill entfernt, Mobile-Sheet-Kappe von 72dvh auf **60dvh** gesenkt (Karte bleibt über dem Sheet sichtbar). Und die offene S10a-Pflicht ist erledigt: **Espandor steht jetzt im Quell-Excel** — `import:map-worlds` reproduziert die Position selbst, der Revert-Hazard ist vom Tisch.

## Änderungen im Einzelnen

### 1. Mobile-Routen-Rendering (`RouteMotionCanvas.tsx`, Kommentare in `RoutesLayer.tsx`/`55-map.css`)

- `lineDashOffset`-Drift und der unbedingte 30-fps-`requestAnimationFrame`-Loop sind raus.
- Stehende Linie = Chevron-Reihe: Sampling der Legs in Screen-Space-Polyline (64 Samples), alle 14 px ein Chevron (Armlänge 4,2 px, Halbbreite 2,4 px) in Fahrtrichtung, Viewport-Cull ±24 px.
- Repaint-Quellen: (a) `bus.onFrame` (koalesziert, 1 rAF pro Kamera-Frame — die Route muss der Karte folgen), (b) ein **begrenzter** 30-fps-Ticker nur während des Draw-in-Fensters (REVEAL_MS = 900 ms beim Eintritt in ein neues Leg; Ambient-Stagger-Fenster bleibt als Fallback korrekt berechnet). Danach steht alles.
- `reduce`-Sonderzweig ist im allgemeinen Pfad aufgegangen (animEnd = 0 → sofort statisch).

### 2. Journey-Flow (`VoyageTour.tsx`, `CourseCards.tsx`, Wiring in `CartographerRoot.tsx`)

- Overture: „SKIP TOUR" entfernt (der Ambient-Draw-in las sich als Autoplay); stattdessen ✕ („Leave the journey") + Lead „BEGIN JOURNEY · N STATIONS →". `onSkip`-Prop komplett entfernt.
- Letzter Tour-Schritt: Lead heißt „SHOW THE FULL ROUTE →".
- `CourseCards` (Epilog): neue Props `onBack` (→ `voyageStep n−1`, Reducer setzt mode zurück auf „tour") und `onRestart` (→ `voyageStep 0`); ✕ dismisst weiterhin nur die Karte.
- Der Ambient-Modus (`voyageFree step −1` → `progress === null`) ist damit UI-seitig unerreichbar; der Code-Pfad bleibt als dokumentierter Fallback stehen (RoutesLayer/Canvas berechnen ihn weiter korrekt). Kommentare in `CartographerRoot` angepasst.
- SR-Statusregion sagt jetzt „Station 3 of 9 — …" (statt „Act …", konsistent mit dem sichtbaren Pager).

### 3. Karten-Hierarchie (beide Dock-Karten)

- Markup: `cg-tour-name` (Heading, 21 px Display) → `cg-tour-date` (neu: mono, 3xs, faint) → `ct` (Text). Kein ACT-Roman mehr; `ROMAN`-Tabellen aus beiden Komponenten entfernt.
- CSS: `.cg-tour .cg-tour-date` neu; die ✕-Padding-Regeln decken via `:is(.ck, .cg-tour-name)` jetzt beide Erst-Elemente (Overture behält ihren „GREAT JOURNEY · TAG"-Kicker).

### 4. Chrome

- `SiteBrand.tsx`: „· Tabula"-Suffix entfernt (Philipp plant ohnehin ein neues Logo); bleibt map-only und zentriert. `55-map.css`: tote `site-brand__map`-Regel raus; ≤640 px kleinere Type + `max-width: calc(100vw − 132px)` gegen Stud/Burger-Kollision.
- `Cartouche.tsx`: „RET"-Hint-Span im Seek entfernt; `CartoucheSheet.tsx`: „SEEK"-Span in der Dock-Pill entfernt; zugehörige `.go`-CSS-Regeln (Seek + Pill) gelöscht.
- Sheet-Kappe: `.cg-sheet.open` `max-height: min(60dvh, 100dvh − 88px)` (vorher 72dvh), JS-Spiegel `maxH` in `CartoucheSheet` auf 0,60 nachgezogen.

### 5. Espandor im SSOT-Excel + kaputter Import repariert

- `scripts/seed-data/source/Warhammer_map_SSOT.xlsx`, Sheet `Tabelle1`, Zeile Espandor: Koordinaten **6550/2976 → 6351/4915** (Integer wie alle anderen Zeilen). Rewrite programmatisch (read-excel-file → write-excel-file, ein Sheet, 993 Zeilen inkl. Header); Rück-Lese-Vergleich: 0 unerwartete Zell-Diffs. **Einschränkung:** Original-Formatierung (Spaltenbreiten/Styles) geht beim Neuschreiben verloren (57 KB → 37 KB); Werte und Sheet-Shape vollständig erhalten, Import-Validierung grün.
- `import:map-worlds` reproduziert den Fix jetzt aus der Quelle: `map-worlds.json` Espandor `gx 903.2 → 903.25`, `gy 626.1 → 626.05` (0,05 Grid-Einheiten neben der S10a-Hand-Korrektur = ~0,005 % der Kartenbreite, unsichtbar; committed wird der reproduzierbare Wert). Einziger Diff-Hunk; `review.md` unverändert; zweiter Lauf diff-frei (Idempotenz).
- **Dependency-Fix:** `read-excel-file` von 9.3.0 auf **^9.3.1**. 9.3.0 hat einen Upstream-Packaging-Bug (importiert `saxen`, deklariert es nicht) — `npm run import:map-worlds` crasht damit auf jedem frischen `npm ci` mit MODULE_NOT_FOUND. Der Batches-Worktree lief bisher nur, weil dort noch 9.0.9 installiert ist. 9.3.1 deklariert `saxen ^11.0.2` und fixt genau das. Baseline-Lauf vor dem Excel-Edit bestätigte außerdem live den S10a-Hazard: der Import setzte Espandor auf 931.56/350.16 zurück.

## Verifikation

- `tsc --noEmit` grün, `eslint` (cartographer + SiteBrand) grün.
- Import-Kette: Baseline-Lauf (Hazard bestätigt) → Excel-Edit → Lauf reproduziert Fix (nur Espandor-Hunk) → zweiter Lauf diff-frei.
- Browser-Abnahme der UI-Punkte macht Philipp selbst (Feedback-Konvention „manual verify"); Dev-Server lief mit HMR. S8-Map-Smoke: unberührte Selektoren („Enter the chart"-Button, Seek-`aria-label`), läuft als CI-Gate am PR.

## Offene Punkte / Folgearbeit

- **Ziel-Pixel-Gerätetest** (Philipp + CC) steht weiter aus → entscheidet S10b (LOD). Der Chevron-Umbau könnte den Mobile-Befund bereits ändern — Test auf der PR-Preview lohnt.
- Ambient-Route-Modus ist toter UI-Pfad (bewusst belassen); falls er dauerhaft niemand fehlt, kann ein späterer Aufräum-Pass ihn samt `voyageFree step −1` entfernen.
- Excel-Formatierung (Spaltenbreiten) bei Gelegenheit manuell nachziehen, falls gewünscht — rein kosmetisch.
- S11-Rollup: diesen Pass mit aufnehmen (brain/** hier unberührt, Rollup-Ownership Koordinations-PR).
