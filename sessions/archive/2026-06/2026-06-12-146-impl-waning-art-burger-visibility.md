---
session: 2026-06-12-146
role: implementer
date: 2026-06-12
status: complete
slug: waning-art-burger-visibility
parent: none (maintainer-direkte Zwischensession, kein Architect-Brief)
links: []
commits:
  - (siehe PR)
---

# Zwischensession: Waning-Era-Art + Chrome-Sichtbarkeit (Burger, Era-Band, Era-Map)

## Summary

Maintainer-direkte Polish-Runde im Product-Strang: neues „The Waning"-Era-Cover (Javelin05, Reddit-Credit) und eine Serie kleiner Sichtbarkeits-Fixes am globalen Chrome und der Timeline — der Burger bekommt ein größeres Label plus einen on-scroll eingeblendeten Top-Scrim, die Era-Band rückt in beiden Timeline-Sichten unter den Burger, die Index-Sicht zentriert die geöffnete Row beim Cinematic→Index-Wechsel und die sticky Era-Map bekommt einen on-scroll Backdrop mit weichem Auslauf.

## What I did

- `public/timeline/bg/era-waning.webp` — ersetzt durch Javelin05-Artwork (Quelle 2560×1440 PNG, via sharp auf 2200×1238 WebP q80 ≈ 177 KB; Datei-Swap in place, `eras.coverRef` unverändert, kein DB-Touch — Muster aus Session 145).
- `src/lib/chronicle/eraArtCredits.ts` — Credit `the_waning` → **Javelin05**, ein Link (REDDIT → https://www.reddit.com/user/Javelin05/). Rendering läuft über den bestehenden Era-Credit-Fallback aus Session 145.
- `src/app/styles/43-site-menu.css` — Burger-Label 10px → 13px (Philipps Call: Sichtbarkeit über Schriftgröße, Design sonst unverändert). Neu: `.site-burger::before`-Scrim — 360×104px-Band von der Viewport-Oberkante, durchscheinendes Void (82% → 45% → transparent), seitlich per `mask-image` weich auslaufend; sichtbar nur mit `.is-scrolled`. Mobile (≤720px): Scrim per `display: none` deaktiviert, Burger dort komplett unverändert.
- `src/components/chrome/SiteMenu.tsx` — `.is-scrolled`-State: Capture-Scroll-Listener auf `document`, der Window-Scroll UND die internen Scroll-Container der Timeline erfasst; nur Scroller, die die Viewport-Oberkante besitzen (rect.top ≤ 80), zählen. Schwelle 24px; Initial-Sync nach Paint via rAF (Scroll-Restoration nach Reload).
- `src/app/styles/67-chronicle-cinematic.css` —
  - `.cine-band` top 64px → 88px (28px Luft zum Burger statt 4px).
  - `.arch-band` margin-top 48px: kollabiert mit `.arch-head`s 24px margin-bottom zu 48px Gesamtabstand → Band-Top ~88px wie in der Cinematic-Sicht. **Achtung Margin-Collapsing:** ein erster Versuch mit 24px bewegte nichts, weil benachbarte Block-Margins kollabieren.
  - `.minimap` (sticky Era-Map der Index-Sicht): Backdrop von „Gradient immer an, ab 70% transparent" auf `::before`-Layer umgebaut — solides Void über der ganzen Box, 56px-Überhang nach unten mit Zwischenstufe (`color-mix` 45%) statt harter Kante; per `.scrolled` erst eingeblendet, wenn die Map am Container-Top angedockt ist (Toggle im bestehenden Scroll-Handler via `getBoundingClientRect`-Vergleich).
- `src/components/timeline/cinematic/IndexView.tsx` —
  - `openRow`-Scroll zentriert die Row jetzt im Viewport (`offsetTop − (clientHeight − rowHeight)/2`) statt `offsetTop − 150`, wo sie unter der sticky Era-Map verschwand; gilt für den Cinematic→Index-Wechsel und Klicks auf Era-Map-Marker.
  - `updateMmView` togglet zusätzlich `.scrolled` auf der Minimap (s. o.).
- `sessions/2026-06-12-146-impl-waning-art-burger-visibility.md` — dieser Report.

## Decisions I made

- **Burger-Sichtbarkeit über Label-Größe + on-scroll Scrim** statt Frosted-Kapsel/Gold-Ruhezustand (per AskUserQuestion mit Philipp entschieden): im Ruhezustand bleibt das Chrome maximal zurückhaltend, der Kontrast kommt erst, wenn gescrollter Content drunterläuft. Mobile bewusst unverändert.
- **Scrim als `::before` am Burger** statt eigenem Fixed-Element: erbt den Stacking-Kontext (z 81), kein neues DOM, `z-index: -1` legt ihn hinter den Button-Inhalt.
- **Capture-Listener auf `document`** statt Window-Scroll-Listener, weil die Timeline in eigenen Containern scrollt (`.archive-scroll`, `.cine-scroll`) und das Window dort nie scrollt.
- **Era-Map-Backdrop an Docking gebunden** (rect-Vergleich Map vs. Scroll-Container), nicht an eine Pixel-Schwelle — selbstkorrigierend, keine Magic Numbers relativ zum Layout darüber.

## Verification

- `npm run typecheck` — pass; `npm run lint` — pass (ein `react-hooks/set-state-in-effect`-Fund beim Initial-Sync, behoben via rAF-Callback).
- sharp-Output geprüft: era-waning.webp 2200×1238 / 177 KB.
- Dev-Server sauber neu gestartet, ausgeliefertes CSS per curl verifiziert (top 88px, margin 48px, font-size 13px). Browser-Eyeballing aller vier Änderungen durch Philipp — bestätigt („passt").

## Open issues / blockers

- Keine.

## For next session

- Größerer Frontend-Brief ist als Nächstes geplant (Philipp kündigt „intensive Ausarbeitung eines Frontend-Briefings" an).
- Scrim-Tuning (Breite/Höhe/Dunkelheit) sind je ein Wert in `43-site-menu.css`, falls Feinjustage gewünscht.

## References

- Session 145 (Era-Art-Swap-Muster, Era-Credit-Fallback): `sessions/2026-06-12-145-impl-era-art-login-gate.md`
- sharp (vorhanden) für die WebP-Konvertierung; keine neuen Dependencies.
