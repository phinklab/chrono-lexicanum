---
session: 2026-07-13-208
role: implementer
date: 2026-07-13
status: complete
slug: launch-s9-chronicle-a11y
parent: docs/launch-master-plan.md § Session 9 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
  - sessions/2026-07-12-207-impl-launch-s8-a11y-smoke.md
commits: []
---

# Launch S9 — Chronicle: Tastatur, Screenreader, Mobile

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang: Product · Branch: `codex/product-chronicle-a11y`.

## Summary

Die Chronicle ist jetzt komplett per Tastatur bedienbar: die Cinematic-Stage ist selbst der fokussierbare Tastatur-Container (Section mit `tabIndex=0`, Keydown **auf der Stage statt auf window** — der S8-Minimal-Guard ist damit durch die echte Stage-Begrenzung ersetzt, der Volume-Slider ist strukturell unerreichbar), Fokus folgt jeder Era-Navigation über die keyed Remounts, das Era-Intro ist fokussierbar/dismissbar mit inertem Stage-Hintergrund, und Index-Zeilen + Minimap-Marken sind echte Buttons mit `aria-expanded`/`aria-pressed`. **Plan-Abweichung, von Philipp in der Browser-Abnahme entschieden:** Plan-§-S9-Punkt 1 (Coarse-Pointer-Phones defaulten auf Index) wurde zunächst umgesetzt (CSS-aufgelöster `data-mode="auto"`) und nach Philipps Veto zurückgebaut — **Default ist auf jedem Gerät Cinematic**; `?view=index` bleibt Opt-in, `?view=cine` wird als expliziter, teilbarer Stage-Link akzeptiert, ohne Param bleibt die URL nackt. Dossier-/Intro-Texte sind serverseitig gerendert (Typing ist nur noch aria-hidden-Optik, der volle Text liegt für SEO/No-JS/AT im HTML), statt des Zeichenstroms gibt es **genau eine** SR-Ankündigung pro Positionswechsel aus einer einzigen Statusregion, und beide Scroll-Handler lesen kein Layout mehr (Forced Reflow raus: gecachte Geometrie + IntersectionObserver-Sentinel). Alle vier PR-Gates grün; der S8-Smoke um die fehlende Hälfte des vierten Interaktions-Smokes ergänzt (Stage-Pfeile navigieren UND Slider behält seine Tasten): 15/15 + 6/6.

## What I did

**1. View-Default ([page.tsx](../src/app/timeline/page.tsx), [ChronicleStage.tsx](../src/components/timeline/cinematic/ChronicleStage.tsx)) — Plan-Punkt umgesetzt, dann per Maintainer-Veto zurückgebaut**
- Erstfassung nach Plan: ohne `?view=` renderte die Stage `data-mode="auto"` und **CSS** entschied den Default (Index unter `(max-width: 760px) and (pointer: coarse)`, sonst Cinematic — erster gestreamter Paint korrekt, kein UA-Sniffing, kein Hydration-Mismatch). **Philipp hat den Index-Default in der Browser-Abnahme abgelehnt:** Default ist jetzt auf jedem Gerät **Cinematic** (`mode = choice ?? "cine"`); die `auto`-CSS-Regeln sind wieder entfernt.
- Was vom Umbau bleibt: der URL-Vertrag. `?view=index` UND neu `?view=cine` werden geparst und von Legacy-Era-Redirects durchgereicht; erst ein expliziter Toggle-/`OPEN IN CINEMATIC`-Klick schreibt `view=` in die URL, ohne Wahl bleibt sie nackt (URL-Matrix A.3, Canonical bleibt `/timeline`). `COARSE_PHONE_MQ` in [shared.tsx](../src/components/timeline/cinematic/shared.tsx) bleibt als geteilter Query-String für `isFlipped()` (Lese-Richtung der Phone-Stage) und die coarse-Touch-Target-Blöcke.

**2. Echte Controls mit programmatischem Zustand ([IndexView.tsx](../src/components/timeline/cinematic/IndexView.tsx), [ChronicleStage.tsx](../src/components/timeline/cinematic/ChronicleStage.tsx))**
- `.row-line`: klickbares `div` → `<button aria-expanded>`; innere `div`s → `span`s (Button-Content-Model; Grid-Items werden blockified, Optik unverändert — CSS-Reset `width/font/color/text-align` in 67).
- Minimap-Marken (`.mm-bar`/`.mm-dot`): `div title=` → `<button aria-label aria-pressed>` (Tooltip bleibt); CSS-Reset `padding: 0; appearance: none` hält sie pixelidentisch.
- Mode-Toggle-Buttons tragen `aria-pressed`; das "VIEW"-Label ist `aria-hidden` (die `aria-label`-Nav benennt die Gruppe).
- **Bugfix dabei gefunden:** die kollabierten `row-detail`s (grid-rows 0fr + overflow hidden) hielten ihre Media-Links + „OPEN IN CINEMATIC" **fokussierbar in der Tab-Order** — unsichtbare Tab-Stops in jeder geschlossenen Zeile. Jetzt `visibility: hidden` auf `.row-detail-inner` mit diskreter 0.45s-Transition (Inhalt erscheint beim Öffnen sofort, bleibt während des Zuklappens sichtbar; Reduced-Motion-Clamp macht es instant).
- Die Rail-Dots im Cinematic bleiben bewusst Pointer-Deko (`div` unter `aria-hidden`, `role="button"`-Attrappe entfernt) — der Tastaturpfad sind die Stage-Pfeile.

**3. Keydown auf die Stage begrenzt + Fokusmodell ([CinematicView.tsx](../src/components/timeline/cinematic/CinematicView.tsx))**
- Der window-Listener ist weg. Die `section.chron-cine` ist fokussierbar (`tabIndex=0`, `aria-label`, `aria-describedby` auf einen sr-only-Tastaturhinweis) und trägt den `onKeyDown`: ArrowUp/Down, PageUp/Down, Home/End wie bisher, neu Space/Shift+Space (= „SCROLL TO ADVANCE" per Tastatur). Der S8-Target-Guard bleibt als Belt-and-Braces für Stage-Inhalte (`input/textarea/select/audio/[contenteditable]/[role=slider]`); Enter/Space auf fokussierten Buttons/Links in der Stage aktivieren nativ statt zu navigieren. Der Player liegt außerhalb der Section — seine Events erreichen den Handler **strukturell** nie mehr.
- **Fokus folgt der Navigation** (ohne das wäre „nur per Tastatur bedienbar" nach dem ersten Era-Wechsel tot, weil der keyed Remount den fokussierten Button mit entsorgt): `gotoEra` setzt einmalig `navigated`-State; ein Mount mit `focusOnMount` fokussiert das Intro (wenn es aufgeht) bzw. die Stage, IndexView fokussiert den Button der gelandeten Zeile. Initial-Load stiehlt nie Fokus. Moduswechsel: strandet der Fokus in der jetzt unsichtbaren anderen View (z. B. „OPEN IN CINEMATIC"), adoptiert die aktive View ihn; der Toggle-Button selbst behält ihn.
- Pointer-Klicks auf nicht-interaktive Stage-Fläche (Dots, Proxy) routen den Fokus auf die Section (`preventScroll`) — Maus-dann-Pfeiltasten funktioniert weiter wie beim alten window-Listener.
- Der Backscroll-**Wheel**-Listener zog von window auf die Section um (ein Wheel über Menü/Player-Popover ist kein Stage-Input mehr); Touch-Handler waren schon Section-gebunden.
- Fokus-Sichtbarkeit: der globale S8-Ring (Offset 2) läge außerhalb des Full-Bleed-Viewports — die Stage bekommt einen **inset-Ring** (`outline 1px gold, offset -6px`), nur `:focus-visible` (Maus-/programmatischer Fokus bleibt ruhig). Optik-Abnahme durch Philipp.
- `.cine-scroll` (aria-hidden Scroll-Proxy) bekam explizit `tabIndex={-1}` — Chromiums Keyboard-Scroller-Heuristik macht kinderlose Scroller sonst UA-seitig fokussierbar.

**4. SSR-Text, eine SR-Ankündigung, Intro-Fokus + inert ([shared.tsx](../src/components/timeline/cinematic/shared.tsx), [CinematicView.tsx](../src/components/timeline/cinematic/CinematicView.tsx), [ChronicleStage.tsx](../src/components/timeline/cinematic/ChronicleStage.tsx))**
- `TypedParagraph` rendert den vollen Text ins Server-HTML (sichtbarer Span), das Client-Typing spielt als Effekt darüber. Die Typing-Schicht ist `aria-hidden` (AT liest nie Halbzustände oder den Zeichenstrom), ein sr-only-Span (`.chron-sr`, das ask-sr-only-Rezept, scoped) trägt den vollen Text für den virtuellen Cursor. Kurz sichtbarer Voll-Text bis zur Hydration ist der bewusste Trade-off (Inhalt vor Choreografie); unter Reduced Motion gibt es gar kein Blanking.
- `aria-live="polite"` am Dossier **entfernt** (das war der Zeichenstrom: keyed Remount + Typing in einer Live-Region). Stattdessen **eine** `role="status"`-Region in der Stage (stabil über Era-Remounts): announced pro Entry-Wechsel `Entry n of N: Titel, Datum`, bei Era-Wechseln mit Landepunkt > 0 mit Era-Präfix. Still: initial, im Index-Modus (echte Buttons announcen sich selbst) und bei Era-Wechseln auf Entry 0 (dort announced das fokussierte Intro über sein Label).
- Era-Intro: „CLICK OR SCROLL TO ENTER" ist ein echter `<button>` (`aria-label` führt mit `M31 — Horus Heresy` und **enthält** den sichtbaren Text — WCAG 2.5.3), erhält bei Era-Ankunft den Fokus; Enter/Space/Escape/ArrowDown dismissen (Section-Handler + natives Click-Bubbling, idempotent), Dismiss gibt den Fokus an die Stage. Während das Intro steht, ist der komplette Stage-Inhalt hinter ihm **inert**: neuer Wrapper `.cine-body` mit `display: contents` (layout-neutral, keine Direct-Child-Selektoren betroffen — geprüft) und React-19-`inert`-Prop. Credit-Links im Intro bleiben bedienbar (Enter folgt dem Link, dismisst nicht).
- **Forced Reflow raus:** `updateMmView` (Index-Scroll-Handler) las pro Scroll-Event `getBoundingClientRect` ×2 + `offsetTop/offsetHeight` pro Zeile. Jetzt: Zeilen-Offsets/Höhen + Map-/Viewport-Höhe in einem Batch gecacht (Mount, Resize, Row-Toggle — sofort + 520ms-Settle nach der 0.45s-Expand-Transition), der Handler liest nur noch `scrollTop`; der Docked-Zustand der Sticky-Minimap kommt von einem **IntersectionObserver-Sentinel** (1px, layoutfrei) statt Rect-Vergleichen. Im Cinematic lasen `toT`/`atStart` pro Scroll-/Wheel-Event `clientHeight`/`scrollHeight` nach den Style-Writes des Vorframes → `vhRef`-Cache in `readGeometry` (Mount + Resize), Kanten rechnen aus `(N+1)·vh`.
- **Reduced Motion, konkret gegengeprüft (S8-Punkt 3):** alle rAF-Pfade gated (`animateCine` springt direkt, `enterTimeline` return early), `scrollTo`-behavior `auto` (beide Views), Wipe entfällt, Typing entfällt, Intro-Leave-Timeout 0; CSS-Ambience (Ken Burns, Hint-Bob, Caret) hatte schon das explizite Gate, Entrances fängt der globale Clamp. Keine neue ungegatete Animation dazugekommen.
- **Touchziele (coarse):** Mode-Toggle-Buttons + `.open-cine` min 44px, `.eb-arrow` 36→44px, `.eb-stop`-Hitbox vertikal auf ≥44px (`inset -18px -16px`), Intro-Button mit 14px-Padding-Hitbox (Negativ-Margin hält die Optik über alle Breakpoint-`bottom`s), Media-Disclosure auf Phones min 44px (nur dort interaktiv — auf Desktop ist sie inertes Label, deshalb eigener `≤760px∧coarse`-Block). Rail-Dots hatten bereits 51px-Hits (S8-Block).

**5. Smoke-Ergänzung ([smoke-live.spec.ts](../e2e/smoke-live.spec.ts))**
Der vierte Interaktions-Smoke („Timeline-Pfeiltasten vs. Player-Volume-Slider") prüfte bisher nur die Slider-Hälfte — nach der Stage-Begrenzung hätte eine Regression der Timeline-Tastatur den Test grün gelassen. Der Test beweist jetzt beide Hälften der Plan-Semantik: Stage fokussieren → ArrowDown dismisst das Intro → ArrowDown navigiert auf `ENTRY 2` → Slider-ArrowUp erhöht die Lautstärke **und** der Entry-Zähler bleibt stehen. Synchronisiert über `waitForURL(/[?&]era=/)` (der URL-Mirror-Effekt ist das Hydration-Signal — vorher wäre der erste Keypress ein Race). Kein neuer Testfall, keine Netz-Erweiterung („kein weiterer Ausbau" respektiert).

## Decisions I made

- **Plan-Abweichung beim View-Default (Philipps Entscheidung, Browser-Abnahme):** Plan-§-S9-Punkt 1 und die „Fertig wenn"-Zeile „Index-View ist der Coarse-Pointer-Default" sind bewusst NICHT mehr erfüllt — Philipp will Cinematic als Default auf jedem Gerät. Die technische Lösung der Erstfassung (CSS-aufgelöstes `data-mode="auto"` statt UA-Sniffing/Client-Flip — deterministisch ab dem ersten Byte, kein Hydration-Mismatch) steht in der Git-History dieser Branch-Arbeit und im Abschnitt oben, falls die Entscheidung je zurückkommt; der Plan sollte im nächsten Koordinations-Rollup entsprechend nachgezogen werden.
- **Fokus-Management über `focusOnMount`/Adoption statt „nie Fokus stehlen":** ohne Fokus-Restore ist die Tastaturbedienung nach jedem Era-Wechsel faktisch kaputt (keyed Remount → Fokus auf `<body>` → Stage-Handler taub). Initial-Load bleibt garantiert diebstahlfrei (`navigated`-State wird erst in `gotoEra` gesetzt; ESLints neue `react-hooks/refs`-Regel hat hier zurecht eine Ref-Lesung im Render wegge-lintet → State).
- **Intro-Dismiss-Control als Button im Intro** statt das Intro selbst zu `role="button"` zu machen: das Intro enthält Heading, Fließtext und Credit-Links — interaktiver Content in einem Button-Role wäre invalide; der beschriftete Button announced die Era beim Fokus gleich mit.
- **Minimap-Marken + Phone-Dot-Strip bleiben unter 44px** (dokumentierte WCAG-2.5.8-Equivalent-Ausnahme): dicht gepackte Skalenmarken — 44px-Hitboxen würden überlappen und Fehltaps erzeugen. Die 44px-Äquivalente sind die Index-Zeilen direkt darunter bzw. Era-Band/Intro/Terminus-Navigation. Als Kommentar am coarse-Block in 67 festgehalten.
- **SSR-Text mit Replay statt Skip-on-Hydration:** die Alternative (Typing beim ersten Mount überspringen, wenn SSR-Text schon sichtbar war) hätte die Intro-Choreografie auf jedem frischen Load gekillt — das Typing IST dort der Auftritt. Kurzer Voll-Text vor Hydration ist ehrlicher Progressive-Enhancement-Zustand.
- **Eine Statusregion im Stage-Root, nicht pro View/Entry:** Live-Regionen in keyed Remounts announcen unzuverlässig (Region muss vor der Mutation existieren). Stille bei Era-Wechseln auf Entry 0 vermeidet die Doppel-Ankündigung mit dem fokussierten Intro — „genau eine" wörtlich genommen.
- **Space/Shift+Space als Navigation ergänzt** (Scroll-Semantik der Stage; preventDefault verhindert Ghost-Scrolls), Enter navigiert bewusst nicht (Aktivierungs-Semantik bleibt Buttons vorbehalten).
- **Smoke-Test erweitert, nicht ergänzt:** die Stage-Pfeil-Hälfte gehört semantisch zum bestehenden vierten Interaktions-Smoke (Plan-Wortlaut „Timeline-Pfeiltasten vs. Player-Volume-Slider"); ein separater Testfall wäre Netz-Ausbau gewesen.

## Verification

- `npm run typecheck` — pass · `npm run lint` — pass.
- `rm -rf .next && npm run build` — pass (frischer Prod-Build, dokumentierte Reihenfolge wegen Data-/ISR-Cache-Falle aus S8-Befund 3).
- `npm run test:smoke` (CI-Tranche static + degraded) — **15/15 pass**.
- `npm run test:smoke:live` — **6/6 pass**, darunter der erweiterte Smoke: Stage-Pfeile navigieren (Intro-Dismiss + ENTRY 2), Volume-Slider behält ArrowUp, Entry-Zähler unbewegt; Timeline/Archive-Routen-Smokes @320/@1280 inkl. **axe ohne serious/critical über das neue Markup** (Section-tabIndex, Buttons, aria-pressed, Statusregion, Intro-Button-Label).
- SSR-Beweis per curl gegen einmaligen `next start` (danach beendet, Port freigegeben): `"cine"`/`"index"` mit explizitem `?view=`; Intro- und Dossier-Text stehen voll im Server-HTML (`.ei-text`/`.d-note` mit aria-hidden-Span + `.chron-sr`-Duplikat); `.row-line` und `.ei-enter` als `<button>` im HTML. Nach dem Default-Rückbau erneut geprüft (Dev-Server): nackte `/timeline` rendert `data-mode="cine"`.
- Tastatur-Durchstich (per Smoke + Code-Pfade): Tab → Stage → ArrowDown dismisst Intro → Pfeile/PageUp/Down/Home/End/Space navigieren Entries → am Terminus ArrowDown wechselt die Era → Fokus landet auf dem Intro-Button der neuen Era → weiter ohne Maus; Index: Tab durch echte Row-Buttons, Enter toggelt, Minimap-Buttons springen, `OPEN IN CINEMATIC` wechselt mit Fokus-Adoption.
- **Mobile + Optik nimmt Philipp im Browser ab** (sein erklärter Part): Index-Default auf dem echten Phone, Inset-Fokusring der Stage, gewachsene Touch-Targets (Toggle-Pill, Band-Pfeile, Disclosure), Intro-Button-Optik.

## Open issues / blockers

- Keine Blocker. Zwei bewusste Rest-Zustände: (a) Minimap/Dot-Strip-Targets unter 44px per Equivalent-Ausnahme (s. Decisions); (b) die Media-Disclosure ist auf Desktop weiterhin ein fokussierbarer No-op-Button in der Tab-Order (S8-Zustand, semantisch harmlos — echter Fix wäre CSS-abhängiges tabIndex, JS für reine Desktop-Kosmetik nicht wert).

## For next session

- **S10a (Cartographer):** dasselbe Fokus-/Target-Guard-Rezept ist dort vorgesehen (VoyageTour-Keyhandler hat verifiziert einen window-Listener ohne Guard); `COARSE_PHONE_MQ`/das Stage-Fokusmodell aus dieser Session sind die Vorlage.
- Falls Philipp den Stage-Fokusring (Gold-Frame, inset −6px) optisch ablehnt: Alternative wäre ein Ring nur um die `era-bar` — Einzeiler in 67, aber WCAG 2.4.7 braucht irgendeinen sichtbaren Indikator.
- **Plan-Text nachziehen (Koordination):** docs/launch-master-plan.md § S9 Punkt 1 + „Fertig wenn" nennen weiter den Index-Default für Coarse-Pointer — von Philipp in dieser Session überstimmt (Cinematic überall). Gehört in den nächsten Koordinations-Rollup, damit die „Fertig wenn"-Zeile nicht als offener Rest gelesen wird.

## References

- WCAG 2.2: 2.1.1 (Keyboard), 2.4.3 (Focus Order), 2.4.7 (Focus Visible), 2.5.3 (Label in Name), 2.5.8 (Target Size Minimum + Equivalent-Ausnahme), 4.1.3 (Status Messages).
- React 19 `inert`-Boolean-Prop; HTML `inert` wirkt DOM-subtree-basiert (display: contents unbeachtlich).
- Chromium keyboard-focusable scrollers (Scroller ohne fokussierbare Kinder werden UA-fokussierbar → explizites `tabIndex=-1` am aria-hidden Proxy).
- IntersectionObserver-Sentinel-Pattern für Sticky-Docked-Detection (layoutfreier Scroll-Handler).
