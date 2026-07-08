---
session: 2026-07-08-188
role: implementer
date: 2026-07-08
status: complete
slug: headline-prune-ui-fixes
parent: none            # maintainer-direct session (website changes round 4)
links: []
commits: []
---

# Sub-/Pre-Headline-Prune site-weit, Home-Subline, Cue-Fadeout, SiteBrand-Retire

## Summary

Direkte Maintainer-Session in zwei Runden. Runde 1 (sechs Vorgaben): Home-
Subline auf „N novels · M podcast episodes" reduziert, „Drag for more" am
Chart-Drawer, „MVNDVS · WORLD"-Eyebrow + Cartographer-grid-Fakt bei Welten
entfernt, Fadeout-Bug am animierten Scroll-Cue-Strich behoben, das fixe
„Chrono Lexicanum"-Wordmark oben links von allen normalen Routen entfernt
(auf der Karte bleibt es als „· Tabula"-Kartusche am Nordrand), plus eine
site-weite Auflistung überflüssiger Sub-/Pre-Headlines zur Entscheidung.
Runde 2 (Philipps Entscheid auf die Liste): Burger-Menü-Stempel,
Compendium-Kategorie-Eyebrows, Entity-Popup-Eyebrows und die
„PODCAST · LORE CAST"-Kicker komplett ausgebaut; Hero-Pretitles
(„The Index" / „The Registry") und Ask-Eyebrow („Where to Begin") bleiben
auf explizite Entscheidung erhalten.

## What I did

### 1. Home-Subline (`src/app/page.tsx`)
Die `hub-holdings`-Zeile unter dem Suchfeld führt nur noch
`<b>{novelCount} novels</b>` + `{episodeCount} podcast episodes` (live aus
dem Search-Index). „7 eras · 5 segmenta" und der Show-Count sind raus; das
Vox-Readout oben rechts trägt die Zahlen weiterhin.

### 2. „Drag for more" (`CartoucheSheet.tsx`)
Grip-Label des Mobile-Chart-Drawers von „Scroll for more" auf
„Drag for more" umgetextet (Label aus Session 187; Geste ist ein Drag).

### 3. Welten: Eyebrow + Cartographer grid raus
- `src/lib/entity/loader.ts`: der `Cartographer grid`-FactRow (gx/gy) ist
  entfernt — er erschien nur bei Welten mit Kartenkoordinaten, daher der
  inkonsistente Eindruck (Calth ja, andere nein). gx/gy fliegen auch aus dem
  Head-Select.
- Eyebrow „MVNDVS · WORLD" an beiden Stellen entfernt (Verzeichnis + Popup);
  in Runde 2 dann komplett generalisiert, s. Punkt 7/8.

### 4. Scroll-Cue-Fadeout (`41-site-bg.css`)
Root-Cause: der Abwärts-Fade lag nur im Linien-Gradient; der wandernde
Lichttropfen (`cueDrop`, zweite Background-Layer) kreuzte das ausgeblendete
Linienende mit voller Alpha. Fix: Fade als `mask-image` auf das ganze
`::before` (Linie wird solid-gold, die Maske übernimmt exakt die alte
Rampe 0–30 % voll → 96 % transparent) — damit blendet der Tropfen identisch
mit aus. Eine geteilte Regel, gilt für alle Cues (Hub, Archive, Compendium,
Ask).

### 5. SiteBrand map-only (`SiteBrand.tsx`, `46-site-nav.css`)
Das fixe Wordmark oben links ist auf allen normalen Routen entfernt (mobil
Überlappung, desktop Rauschen; der Burger trägt Home, auf dem Hub ist der
Hero das Wordmark). **Design-Entscheidung:** auf `/map` bleibt es als
„Chrono Lexicanum · Tabula" mittig am Nordrand — Teil der Portolan-Sprache.
Tote `body.on-chron`-Hide-Regel entfernt; Basis-Styles bleiben (die
Map-Positionierung in `55-map.css` baut darauf auf).

### 6. Burger-Menü-Stempel raus (`SiteMenu.tsx`, `43-site-menu.css`)
„CHRONICA · NAVIGATIO" (Kopf) und „TERRA STANDARD · M42.347" (Fuß, statisch
erfundenes Datum) entfernt, inkl. `__head`/`__foot`-CSS. Die Legal-Zeile
(Impressum · Datenschutz · Artwork) übernimmt den `clamp(20px,5vh,48px)`-
Abstand unter der Liste, damit das Menü nicht gestaucht wirkt.

### 7. Compendium-Kategorie-Eyebrows raus (`categories.ts`, `[category]/page.tsx`, `66-compendium.css`)
Alle fünf `LATIN · ROLE`-Eyebrows über den Verzeichnis-Titeln entfernt; da
keine Kategorie mehr eins trägt, ist das `eyebrow`-Feld komplett aus dem
`CompendiumCategory`-Contract ausgebaut (kein toter Optional-Ballast).
Heading führt die Intro jetzt mit `margin: 0`; Eyebrow-CSS-Regel gelöscht.

### 8. Entity-Popup-Eyebrows raus (`EntityHeader.tsx`, `EntityView.tsx`, `59-entity.css`)
Die per-Type-Eyebrow-Mechanik („PERSONA · CHARACTER" etc.) ist komplett
ausgebaut — inklusive des dafür nötigen `type`-Props (EntityHeader braucht
den Typ nicht mehr). Alle Entity-Popups/Detailseiten starten direkt mit dem
Namen; Titel-Margin auf 0, Eyebrow-CSS-Regel gelöscht.

### 9. Podcast-Kicker raus (`archive/podcasts/page.tsx`, `[slug]/page.tsx`, `62-podcasts.css`)
„PODCAST · LORE CAST" über jeder Show-Karte der Übersicht und auf der
Show-Plate entfernt (auf einer Podcast-Fläche reine Redundanz); Kicker-CSS
gelöscht, Titel-/Name-Margins bereinigt.

### Behalten (explizite Entscheidung Philipp)
Hero-Pretitles „The Index" (/archive, /archive/podcasts) und „The Registry"
(/compendium), Ask-Eyebrow „Where to Begin", sowie die Deko-Schicht
(Vox-Readout, FloatingCoord, CornerAuspex-Labels, HomeExplore-Glosses) und
die Info-Träger (Home-Hero-Over, Buch-Format-Rubric, „Rank I · top match",
Tool-/Archive-Kicker, Legal-/Fehlerseiten-Eyebrows).

## Verification

- `tsc --noEmit` + `eslint` über alle geänderten Files grün.
- Rest-Grep über alle entfernten Klassen/Strings (`entity-view__eyebrow`,
  `cmp-cat-intro__eyebrow`, `pod-*__kicker`, `site-menu__head/__foot`,
  „LORE CAST", „TERRA STANDARD", „NAVIGATIO", `EYEBROW`) → keine Treffer.
- Kein Preview-/Headless-Durchlauf (per Arbeitsmodus-Absprache):
  Browser-Check macht Philipp — sinnvolle Stichproben: Burger-Menü mobil,
  `/compendium/fraktionen`, ein Charakter- und ein Welt-Popup (Calth),
  Scroll-Cue auf Home, `/map` (Tabula-Kartusche unverändert).

## For next session

- Falls das Wordmark auch auf der Karte weg soll: `SiteBrand.tsx` rendert
  dann gar nichts mehr → Komponente + Mount in `layout.tsx` + Basis-CSS in
  `46-site-nav.css` + Map-Override in `55-map.css` komplett entfernen.
- `docs/ui-backlog.md` unangetastet — keine neuen Kosmetik-Funde.
