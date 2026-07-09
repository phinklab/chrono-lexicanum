---
session: 2026-07-09-189
role: implementer
date: 2026-07-09
status: complete
slug: frontend-mobile-copy-pass
parent: none            # maintainer-direct session (Mobile-Feedback Runde 3 + Copy)
links: []
commits: []
---

# Mobile-Fixes (Map-Voyages, Chronicle-Drag), Back-Guard, BrandBeacon, Copy, Ask-Hierarchie

## Summary

Direkte Maintainer-Session, neun Vorgaben aus Philipps Smartphone-Test.
Map: Voyage-Flicker + verschwindende Dock-Legende behoben (mask-freie
Lite-Route unter 900px + `will-change` auf dem fixed Chrome), Handy-Back
schließt jetzt Map-Overlays statt die Seite zu verlassen (neuer
History-Guard-Hook), und der erste Tap, der die Overture wegnimmt, wählt
keinen Planeten mehr an. Chronicle mobile: der Session-186-Gesten-Flip
(`scaleY(-1)` auf dem Scroll-Proxy) hatte Touch-Fling/Snap zerstört — der
Flip lebt jetzt rein im scrollTop⇄t-Mapping (Swipe-runter = weiter bleibt,
Philipps expliziter Entscheid); Era-Band + Caption über den Mode-Toggle
gehoben. Chrome: neues Scroll-Logo (BrandBeacon, Dot-Platzhalter) site-weit;
HUD-Ambient (Auspex, Survey, Vox) auf Mobile freigeschaltet. Copy: Home-
Praefatio + Artwork-Intro neu, alle Em-Dashes raus. Ask: großer
Faction-Titel raus (Rail-Eintrag trägt die Identität), Alternativen als
benannte Chips.

## What I did

### 1. Map: Voyage-Flicker + Legende (`RoutesLayer.tsx`, `55-map.css`)
Root-Causes: (a) die per-Leg-`<mask>` (Draw-in-Reveal) re-rasterizet den
SVG-Subtree bei jedem Kamera-Frame — deshalb blieb der Flicker trotz
abgeschalteter Marching-Animation; (b) `.cg-ccard--dock` hatte keinen
eigenen Compositing-Layer und fiel auf Phone-GPUs beim Pannen aus dem
Compositing (der Media-Player hatte denselben Fix schon). Unter 900px
rendert RoutesLayer jetzt `cg-course--lite` ohne `<defs>`/`mask`; die Legs
faden per `cgRtLegIn` in der Draw-in-Kadenz ein (Opacity nur im Keyframe,
damit reduced-motion zur schlicht sichtbaren Route degradiert; im
reduced-motion-Block eine höher-spezifische `animation: none`-Regel).
`.cg-ccard--dock`, `.cg-pop`, `.cg-sheet` bekommen `will-change: transform`
im Mobile-Block.

### 2. Map: Back-Guard (`useOverlayBackGuard.ts` neu, `hash.ts`, `CartographerRoot.tsx`, `CartoucheSheet.tsx`)
Neuer Hook `src/lib/map/useOverlayBackGuard.ts`: ein Guard-History-Eintrag
(`{cgGuard:true}`), solange irgendein Map-Overlay offen ist (nur ≤900px).
Popstate schließt das oberste Overlay (Sheet > World-Popup > Voyage) und
re-pusht den Guard, solange weitere offen sind; UI-Close des letzten
Overlays konsumiert den Guard still (`eatPops`-Zähler schluckt den
selbst ausgelösten Pop). Rückkehr aus einem darüber gepushten Buch-Modal
wird per `e.state.cgGuard` erkannt und lässt die Overlays stehen.
Voraussetzung dafür: `hash.ts` schreibt `replaceState` jetzt mit
`window.history.state` statt `null` — vorher wischte der throttled
Hash-Writer bei jedem Pan-Frame den State des aktuellen Eintrags weg
(auch Next-Router-State; eigenständiger Bugfix). Das Sheet-`open` ist
dafür aus `CartoucheSheet` in die Root gehoben (`open`/`onOpenChange`).

### 3. Map: Overture-Tap (`ChartStage.tsx`, `CartographerRoot.tsx`)
`ChartStage` bekommt `condensed` als Prop (Latest-Value-Ref-Muster). In
`handlePointerDown` wird vor dem Condense gelesen, ob die Overture noch
stand; wenn ja, wird `hitId` genullt — der Tap hebt nur den Schleier,
Pan aus derselben Geste funktioniert weiter. Gilt auch auf Desktop
(erster Klick dismisst, wählt nicht).

### 4. Chronicle: Drag-Fix (`CinematicView.tsx`, `67-chronicle-cinematic.css`)
Der `transform: scaleY(-1)`-Spiegel auf `.cine-scroll` (Session 186) ist
gelöscht — transformierte Scroll-Container verlieren auf Mobile-Engines
natives Fling/Momentum, mit `scroll-snap mandatory` blieb nur der rohe
Drag-Weg (>50 % Viewport nötig, Snap-back auf Event 0). Swipe-runter =
weiter bleibt erhalten (Philipps Entscheid): Modul-Singleton-MQL
`isFlipped()` + `toTop`/`toT`-Helfer invertieren das Mapping — Entry 0
liegt am unteren Proxy-Rand, Terminus oben. Umgestellt: `goTo`, `onScroll`
(mit Clamp auf [0, N+1] gegen Rubber-Band-Fehltrigger des Era-Advance),
Mount- und Resize-Seeding, `canPullBack` (Start-Edge = unten), der
`pullDy`-Flip im Back-Pull bleibt. `scroll-snap-stop: always` bewusst
unangetastet; falls es sich nach dem Fix noch schwer anfühlt, wäre
`scroll-snap-stop: normal` im Mobile-Block der Einzeiler.

### 5. Chronicle: Bottom-Overlap (`67-chronicle-cinematic.css`)
`.cine-band-era` bottom 38→52px (+ `max-width: 78vw` + Ellipsis gegen
lange Era-Namen), `.cine-band` 58→72px, `.cine-lower`-Padding-Floor
76→96px (Kommentar-Invariante aktualisiert). Der Toggle (bottom 12px,
z-40) bleibt; Caption (~52–63px) und Dots (~72–92px) liegen jetzt frei.

### 6. Chrome: BrandBeacon (`BrandBeacon.tsx` neu, `layout.tsx`, `46-site-nav.css`)
Scroll-Logo site-weit: ab `scrollY > 140` blendet oben links der
Observatoriums-Dot im Bloom-Zustand des `.lx-btn`-Hovers ein (Gold-Dot +
drehende `SternwarteRings` + drei Twinkle-Sterne), als `<Link href="/">`.
Platzhalter für ein echtes Logo. Passive-Scroll-Listener + rAF
(ScrollScrim-Muster), Klassen-Toggle ohne React-State; `visibility`
hält es unscrolled aus der Tab-Order; versteckt sich wie der Burger bei
offenem Detail-Modal (`body:has([data-detail-modal])`). Nicht auf /map
(Tabula-Kartusche), /timeline (scrollt nicht), /login.

### 7. HUD-Ambient auf Mobile (`47-hud.css`, `46-site-nav.css`)
Das pauschale `display: none` bei ≤980px für `.survey`/`.auspex-pair` ist
raus — die vorhandenen Mobile-Tuning-Regeln (zentrierte Haupt-Disc, Sec-Disc
bleibt aus) greifen jetzt tatsächlich. `.site-vox` ist auf Mobile wieder
sichtbar, unter den Burger versetzt (top 64px, right 16px, 10px-Font).
Reduced-motion-Verhalten unverändert.

### 8. Copy (`page.tsx`, `artwork/page.tsx`)
Home-Praefatio ersetzt (Fan-Archiv-Widmung an Black Library, Podcasts,
Star-Map, Fan-Art; keine Em-Dashes). Artwork-Intro umformuliert („learn and
get better at digital painting", „no AI involved in creating these",
Semikolon/„as" statt Em-Dashes) + neuer Schlusssatz („I'll keep improving
the existing pieces…"). Eyebrow „Chrono · Lexicanum — Originals" →
„· Originals".

### 9. Ask: Faction-Hierarchie (`FactionCarousel.tsx`, `FactionPickPanel.tsx`, `54-ask-faction.css`, Fraktion-Page)
Der display-große `ofob__faction`-Titel ist raus (sr-only-h2 bleibt für die
Heading-Struktur); der aktive Rail-Eintrag trägt die Identität: Gold, 15px,
Breathing-Dot davor (Button-Grammatik). Der „Alternative 1/2"-Cycler ist
durch sichtbare, benannte Chips ersetzt (`.ask-pick__alt`, Pill mit
Hairline-Border; Klick tauscht den Pick in den Verdict-Block). Em-Dashes
in der Sub-Line („One faction, one book: …") und im Step-II-Note
(„· optional") ersetzt.

## Decisions & Abweichungen

- **Chronicle-Richtung:** Philipp hat explizit „Swipe-runter behalten,
  neu bauen" gewählt (gegen die empfohlene Revert-Variante). Der Umbau
  ist die risikoreichere Variante — Verifikation am echten Gerät nötig
  (Rubber-Band am Start-Edge, URL-Bar-Resizes).
- **Scroll-Logo site-weit** (nicht nur Home) — Philipps Entscheid.
- **Back-Guard** deckt Sheet + World-Popup + Voyage ab (nicht nur Voyage);
  Desktop bleibt history-frei.
- `hash.ts`-`replaceState(null→history.state)` ist ein eigenständiger
  Bugfix (Next-Router-State wurde bisher bei jedem Pan-Frame gewischt).

## Verification

- `npx tsc --noEmit` grün, `npm run lint` grün (ein react-hooks/refs-Fund
  im neuen Hook behoben: layersRef-Sync in Effect statt im Render).
- Kein Headless-Sweep (Repo-Konvention): Philipp prüft am Handy —
  Checkliste: Voyage pannen (kein Flicker, Card bleibt), erster Tap auf
  Planet (nur Overture weg), Back-Swipe (Sheet→Popup→Voyage→Seite),
  Buch aus Popup + Back (Popup bleibt), Chronicle-Swipe (Momentum, ein
  Event pro Geste, Pull-back in vorherige Era), Caption/Toggle frei,
  HUD-Ambient + Vox auf Home/Archive/Compendium/Ask, BrandBeacon beim
  Scrollen, neue Texte, Ask-Rail/Chips.

## Nachtrag: Dev-Env-Fix (Burger tot auf localhost)

Philipp meldete nach der Übergabe ein totes Burger-Menü auf localhost. Kein
Code-Problem: der frische Claude-Worktree hatte keine eigenen
`node_modules` — Node löste alles aus dem Eltern-Repo auf, Turbopack wählte
darum das Eltern-Repo als Workspace-Root (Lockfile-Warnung im Log) und
mischte zwei Checkouts. Fix: `npm ci` im Worktree + `next.config.ts` pinnt
`turbopack.root: process.cwd()` (mit `__dirname` löst die kompilierte
Config falsch auf) und erlaubt `allowedDevOrigins: ["192.168.1.104"]` fürs
Handy-Testen gegen die LAN-URL (Next 16 blockt cross-origin-Zugriffe auf
`/_next`-Dev-Ressourcen sonst). Beides dev-only, in Prod-Builds wirkungslos.

## Open / For next session

- BrandBeacon ist ein Platzhalter — echtes Logo-Mark ausstehend.
- Falls Chronicle-Snap nach dem Fix noch „schwer" wirkt:
  `scroll-snap-stop: normal` im 760px-Block (Einzeiler, bewusst nicht
  vorauseilend geändert).
- HUD-Ambient-Feinpositionierung auf Mobile per Augenmaß (ggf. via
  `docs/ui-backlog.md`).
