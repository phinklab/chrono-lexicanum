---
session: 2026-07-13-211
role: implementer
date: 2026-07-13
status: complete
slug: map-compositing-fix
parent: Maintainer-Gerätetest nach Session 210 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - sessions/2026-07-13-210-impl-map-feedback-pass.md
commits: []
---

# Map-Compositing-Fix — Geister-Layer der Tour-Karte, Striche statt Chevrons

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang: Product · Branch: `codex/product-map-compositing-fix`.

## Summary

Philipps Gerätetest nach Session 210 (iPhone, Prod): Performance ok, Logo ok, **aber** beim Durchklicken einer Great Journey „zerschießt" es die Ansicht — verstreute Geister-✕ auf der Karte, die Act-Karte mitten im Bild, hart mitten im Wort abgeschnitten (kein Umbruch). Diagnose: **Compositing-Bug, kein Performance-Problem** — hartes Croppen ohne Umbruch und versetzte Fixed-Elemente sind GPU-Layer-Symptome, keine CSS-Layout-Fehler. Hauptverdächtiger: die Tour-Karte wurde pro Station neu gemountet (`key={step}`) und trägt `will-change: transform` — jedes „Next" allozierte mitten im Kameraflug einen frischen promoted Layer; iOS-WebKit unter Druck räumt die alten nicht sauber ab (Geisterpixel der ✕-Buttons an alten Positionen, verwaiste/beschnittene Karten-Layer). Konsequenz für den Launch-Plan: **S10b (LOD) adressiert das nicht** — Knotenzahl/Durchsatz sind laut Gerätetest okay.

## Änderungen

1. **`VoyageTour.tsx` — stabiler Karten-Mount:** `key={step}` entfernt; ein DOM-Knoten (= ein `will-change`-Layer) trägt die ganze Tour, Inhalt aktualisiert in place. Auch Overture → Station läuft über denselben Knoten (gleicher Root-Typ in beiden Zweigen). Nebeneffekt: Fokus bleibt beim Durchklicken auf dem Next-Button. Begründung als Code-Kommentar am Element.
2. **`RouteMotionCanvas.tsx` — Striche statt Chevrons** (Philipps Urteil aus dem Gerätetest): stehende Linie = statisches Dash-Muster `[2.2, 5.4]`, `lineDashOffset` fest 0, Strichsprache wie die Desktop-SVG-Route. Repaint-Modell aus Session 210 unverändert (nur Kamera-Frames + begrenztes Draw-in-Fenster; Idle = 0 Repaints). Chevron-Konstanten/-Painter entfernt.
3. **Kommentar-Nachzüge** in `RoutesLayer.tsx` + `55-map.css` (chevron → dashed).
4. **Kein backdrop-filter-Fix nötig:** Der dritte geplante Hebel (Blur auf Phones deaktivieren) existiert bereits seit S9 (`.cg-pop, .cg-ccard, .cg-sheet { backdrop-filter: none }` im ≤900px-Block) — als Verdachtsquelle damit ausgeschieden, keine Änderung.

## Verifikation

- `tsc --noEmit` + `eslint src/components/cartographer` grün.
- Der eigentliche Beweis ist der Geräte-Gegentest auf Prod nach Merge (Philipp): Journey starten, mehrere Stationen schnell durchklicken, dabei/danach draggen — keine Geister-✕, keine versetzte/beschnittene Karte, kein Flackern. Desktop-Verhalten unverändert (SVG-Marschier-Dashes bleiben dort).

## Offene Punkte

- Falls nach diesem Fix beim reinen Draggen (ohne Journey) noch Restflickern bleibt: nächste Eingrenzung gezielt (will-change-Audit der Fixed-Chrome-Elemente), erst messen, nicht raten.
- S10b-Entscheid nach dem Gegentest formal festhalten (Launch-Plan/Prompt-Datei): Performance-Befund „okay" spricht für ersatzloses Entfallen.
- S11-Rollup: Sessions 210 + 211 mit aufnehmen.
