---
session: 2026-07-17-245
role: implementer
date: 2026-07-17
status: complete
slug: map-flicker-fix
parent: none
links:
  - sessions/2026-07-08-187-impl-artwork-footer-mobile-i18n.md
  - sessions/2026-07-10-191-impl-mobile-cartographer-motion.md
  - sessions/2026-07-15-221-impl-warmasters-web-legion-steps.md
commits: []
---

# Map-Flicker-Fix — Canvas-Route auf Desktop, Journey-SVG statisch

## Summary

Das mit den strategischen Journeys (Warmaster's Web u. a.) neu aufgetretene
Desktop-Flackern — intermittierendes Aufblitzen des ganzen Charts während
Routen-Animation und Pan/Zoom — ist behoben: RouteMotionCanvas zeichnet die
Journey-Linie jetzt auf **allen** Viewports, und die Journey-Ebene im Motion-SVG
trägt auf keinem Viewport mehr Paint-Animationen (Masken-Draw-in, Dash-Drift,
Ring-Bloom entfernt). Das ist die 1:1-Ausweitung der 2026-07-13 bewährten
Mobile-Kur; Philipp hat den Fix im Browser abgenommen. Ein erster lokaler
Versuch (nur `cgRtFly` entfernen + Hover-Gates) hatte NICHT geholfen und wurde
revertiert; die Lösung kam aus einem Deep-Research-Pass über
Chromium-Rendering-Internals (Details unten — für künftige Map-Arbeit relevant).

## What I did

- `src/components/cartographer/RouteMotionCanvas.tsx` — `narrow`-Gate
  (≤900px-MediaQuery) entfernt; der Canvas zeichnet jetzt überall.
  Repaint-Modell unverändert: Kamera-Frames (koalesziert) + endliches
  Draw-in-Fenster (0,9 s/Leg), idle = null Repaints.
- `src/components/cartographer/RoutesLayer.tsx` — der frühere Mobile-Zweig ist
  der einzige: `<defs>`-Masken, `masked`-Logik, `armOrderByLeg`/`drawingLegs`
  und die toten `--i`-/`animationDelay`-Styles entfernt. Das SVG behält Ringe,
  Wegpunkt-Punkte, Ziel-Marker, Label und die unsichtbaren `cg-rt-hit`-
  Klickpfade; die `cg-rtFly`-Routenpfade sind reine Geometrie
  (`visibility: hidden`) für Canvas + Hit-Testing.
- `src/app/styles/55-map.css` — `.cg-route-canvas` global `display: block`;
  gestrichen: `cgRouteDraw`-Masken-Draw-in, `cgRtFly`-Dash-Drift (7 s infinite),
  `cgRtStation`-Ring-Bloom, `cgRtLbl`-Label-Fade samt Keyframes und
  Reduced-Motion-/Mobile-Duplikaten; `.cg-rt-st`/`.cg-rt-lbl` stehen statisch
  (0.8/0.85). Der Mobile-Block behält nur noch den Blanket-Kill
  `.cg-chart--motion *` (Instrumente/Selektion stehen auf Phones weiter still).
- `sessions/2026-07-17-245-impl-map-flicker-fix.md` — dieser Report.

## Root Cause (Deep-Research, hochkonfident)

Die Kamera schreibt pro rAF das `transform`-ATTRIBUT auf innere `<g>` beider
Fullscreen-SVGs — das ist nie compositor-only, jede Geste ist Main-Thread-
Repaint der ~6000-Knoten-Basis. Das Journey-Overlay addierte
nicht-compositorfähige Per-Frame-Invalidierungen (Masken-`stroke-dashoffset`,
Dash-Drift, non-scaling-stroke): Pre-Paint verwirft Display-Listen + GPU-Tiles,
der asynchrone TileManager verliert intermittierend das Frame-Rennen, Chrome
malt Leere → Ganzchart-Blitzen. Nur deklarative transform/opacity/filter-
Animationen laufen auf dem Compositor — Terra-Auspex und Selektionsringe waren
deshalb nie Auslöser und bleiben unangetastet. crbug.com/167569 (animierte
Dash-Offsets ≈100 % CPU) wurde 2024 nach 11 Jahren „Won't Fix" geschlossen;
Chromiums CompositeSVG-Anlauf (M89) wurde in M90 wegen Raster-Qualität
revertiert. Google Maps/Leaflet/tldraw/Excalidraw umgehen die Klasse Problem
architektonisch (Tiles bzw. Canvas, composited Transform während der Geste,
Re-Raster bei Ruhe).

## Decisions I made

- **Fix 1 (Canvas überall + statisches Journey-SVG) statt Fix 2
  (Compositor-Kamera).** Fix 2 — Kamera als composited CSS-Transform auf
  promotetem Wrapper, Re-Raster bei Ruhe (Leaflet-Muster) — heilt das Flackern
  bei stehender Kamera NICHT allein (die Overlay-Animationen invalidieren die
  Ebene von innen), operiert am empfindlichsten Subsystem (Kamera-Core,
  Hit-Testing, `--cg-ik`-Gegen-Skalierung, Zoom-Bänder) und ändert sichtbar die
  UX (Pins/Labels skalieren während der Geste mit, Unschärfe bis zum Settle).
  Er bleibt der dokumentierte **Eskalations-/Ausbaupfad**, falls Rest-Flackern
  auftaucht oder die Map deutlich schwerer wird (drei Zeitkarten). CSS-only
  (will-change/contain) wurde als unzureichend verworfen.
- **Sichtbare Deltas auf Desktop, bewusst in Kauf genommen (Mobile-Parität):**
  Draw-in 0,9 s/Leg (vorher 1,1 s SVG-Maske); Ringe/Label erscheinen sofort
  statt mit Bloom-/Fade-Kaskade; die dickere „selected"-Linie folgt nur noch
  dem Arm-Preview (`highlightedArmLegion` im Canvas) — Ziel-Selektion dickt
  die Legs nicht mehr an (Ziel-Marker/Label zeigen die Selektion weiter).
  Philipp hat den Look abgenommen.
- **`cg-course--lite`-Modifier entfernt** statt ihn permanent zu setzen: der
  Lite-Zustand ist jetzt der einzige, die Regeln hängen an den Basisklassen.
- **Android-Pfad unangetastet** — `canvas-renderer.ts` zeichnet Routen selbst;
  RouteMotionCanvas wird nur im SVG-Zweig gemountet. Der Smoke-Test
  (`e2e/smoke-static.spec.ts`, `canvas.cg-route-canvas` Count 0) prüft den
  320px/Canvas-Renderer-Zweig und bleibt korrekt.

## Verification

- `npx tsc --noEmit` — pass.
- `npx eslint` auf beiden Komponenten — pass.
- Dev-Server sauber, `/map` 200, keine Server-Fehler.
- Abnahme durch Philipp im Browser (Journey + Tour + Pan/Zoom): „flicker ist
  wohl gefixed". Keine Headless-/CDP-Schleifen (Standing Rule).
- Automatisierte E2E-Suite nicht gefahren (Session-Zuschnitt; smoke-static
  wurde statisch auf Verträglichkeit geprüft, s. o.).

## Open issues / blockers

Keine. Falls im Alltag doch noch Flackern auftritt: Fix 2 (Compositor-Kamera +
Settle-Re-Raster) ist der recherchierte nächste Schritt; er komponiert mit
diesem Fix und ersetzt ihn nicht.

## For next session

Diese Session war Teil 1 einer vereinbarten Drei-Session-Neuordnung von
Werkstatt-Bau W3b (drei Zeitkarten):

1. **✔ Session 1 (diese):** Flicker-Fix.
2. **Session 2:** Neues Map-UI (die Map trägt inzwischen deutlich mehr
   Funktionen) + komplette Drei-Zeitkarten-Mechanik (`states`-Feld an Zonen,
   Parser, Renderer-Filter, Stufen-Toggle pre/hh/now, Hash, Editor-Checkboxen).
3. **Session 3:** Zonen-Kuration auf den drei Karten — CC zeichnet nach
   Philipps HH-Referenzkarte vor, Philipp passt im Zone-Editor
   (`/map?zones=edit`) nach.

Mit Philipp bereits geklärte W3b-Urteile: Stufen pre/hh/now; Pins in allen
Stufen identisch; Ultramar in allen drei Stufen; Nihilus-Zustand merken +
restaurieren (Button in pre/hh disabled); Ruinstorm nur hh, dominant; Eye of
Terror um gx 260.27 / gy 232.49 in allen Stufen. Die HH-Kartentranskription
(Zone Traitoris/Imperialis/Perditus mit Ankerwelten) liegt im lokalen Plan-File
der Session und gehört in den Session-2/3-Kickoff übernommen.

## References

- crbug.com/167569 — animated stroke-dashoffset, Won't Fix 2024.
- developer.chrome.com RenderingNG-Artikelserie (Pre-Paint, TileManager,
  Compositing-Kriterien); chromestatus CompositeSVG (M89) + M90-Revert.
- Leaflet-/Google-Maps-Overlay-Muster, tldraw (debounced zoom), Excalidraw
  (Static/Interactive-Canvas-Trennung).
- Deep-Research-Volltext (99 Agents, 17 Quellen) lokal:
  Scratchpad `tasks/w83hkk0q0.output` der Session.
