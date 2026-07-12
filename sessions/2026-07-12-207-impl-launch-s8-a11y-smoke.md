---
session: 2026-07-12-207
role: implementer
date: 2026-07-12
status: complete
slug: launch-s8-a11y-smoke
parent: docs/launch-master-plan.md § Session 8 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
commits: []
---

# Launch S8 — A11y- & Mobile-Fundament + Mini-Smoke-Set

## Summary

Das A11y-Fundament steht: `:focus-visible` reaktiviert die vorhandene Gold-Ring-Konvention (nur Tastatur, Maus bleibt ruhig), der Reduced-Motion-Clamp nullt jetzt auch Delays, die 320-px-Hub-Suche ist voll breit, Skip-Link + `color-scheme: dark` + SiteMenu-`inert` + Player-Disclosure-Semantik + Podcast-Headings sind drin, Touchziele ≥ 44 px auf coarse pointer. Das Mini-Smoke-Set (Playwright 1.61.1 + axe-core/playwright 4.12.1) ist **in CI required** (in den bestehenden required Job `lint-and-typecheck` gefaltet — das etablierte Brief-180-Muster, keine Branch-Protection-Änderung nötig). Degradationsverhalten im echten Prod-Build (mit sauberem Cache verifiziert, `/healthz` 503): Hub/Map/Podcasts/Hot-Books (prerendered) **und `/ask`** (statische Fragen-Config) liefern echten Inhalt ganz ohne DB; `/timeline` und `/archive` antworten HTTP 200 (Streaming läuft schon) und zeigen nach Hydration die **themed Fehlerfläche „TRANSMISSION INTERRUPTED"** — der S2-Vertrag hält; nur der Buch-Long-Tail (On-Demand-ISR) antwortet mit Nexts **untematisierter** Plain-500 (Error-Boundaries laufen nicht bei On-Demand-Static-Generation), nie mit 404. Kontrast lief als **Vorschau** (Philipps Entscheid): Philipp nimmt die Token im Browser ab und kann sie mit einem Handgriff zurückdrehen.

## Philipps Scope-Entscheidungen (vor Implementierung abgefragt)

1. **Kontrast:** „Vorschau bauen, ich entscheide im Browser" — umgesetzt, Rückbau-Anleitung unten.
2. **Touchziele:** „Sichtbar vergrößern wo nötig" (nicht der unsichtbare Trefferflächen-Trick).
3. **Rest (Fokus-Ring, Reduced Motion, Bugfixes, Semantik, Smoke-Set + CI):** komplett umsetzen.

## What I did

**Fokus & Basis ([10-base.css](../src/app/styles/10-base.css))**
- Blanket `:focus/:focus-visible { outline: none !important }` ersetzt durch: `:focus` ruhig, `:focus-visible` = `1px solid var(--cl-gold)` + offset 2px (reaktiviert die ~15 bereits existierenden, bisher totgeschalteten Komponenten-Ringe derselben Konvention). Inputs mit eigener Gold-Underline-Affordance (browse/pod/map/lex/login) behalten ihr lokales `outline: none` — gewinnt jetzt regulär per Spezifität, ohne `!important`.
- Forced Colors: `:focus-visible` wird 2px `Highlight`.
- `main:focus-visible { outline: none }` (Skip-Link-Ziel braucht keinen Ring).
- Skip-Link-Styles (mono, Gold-Rahmen, off-screen geparkt); `color-scheme: dark` auf `html`.
- Reduced-Motion-Clamp um `animation-delay: 0s` + `transition-delay: 0s` ergänzt (Hero-/Ask-/Compendium-Masthead-Content war unter Reduced Motion bis 1,2 s unsichtbar).

**Kontrast-VORSCHAU ([00-tokens.css](../src/app/styles/00-tokens.css) + 15 Deko-Stellen)**
- Polaritäts-Trick statt ~90 Text-Edits: `--cl-faint` selbst wird text-sicher **#6a6455 → #847d69** (4,71:1 auf bg-1, 5,02:1 auf void; vorher 3,28–3,50) — trifft automatisch alle ~90 Text-Nutzungen. Die ~15 Deko-Nutzungen (Borders, Dots, Underline-Farbe in 31/42/55/58/59/62) auf neues `--cl-faint-deco` = alter Dunkelwert gepinnt — **Dekor ist pixelidentisch**.
- `--cl-blood-text: #bd6154` (≥4,60:1; vorher 2,60–2,77) an den 3 Text-Stellen (book-detail Antagonist-Rolle, map zed-×-Hover, login Fehlerzeile); SVG-Deko bleibt `--cl-blood`.
- 4 Map-Label-Texte von `--cl-gold-dim` auf vorhandenes `--cl-gold` (5,94:1) — kein neues Token; Glyphen/Marker/Borders bleiben gold-dim.
- SiteMenu-lokal `--sm-steel-dim` **#566070 → #78848f** (5,06:1; Token ist dort text-only).
- **Rückbau, falls Philipp ablehnt:** in 00-tokens.css `--color-cl-faint` zurück auf `#6a6455`, `--color-cl-blood-text` auf `#8e3b32`, in 43-site-menu.css `--sm-steel-dim` auf `#566070`, die 4 Map-Stellen zurück auf `--cl-gold-dim` — die `-deco`-Aliase können bleiben (dann wertgleich). Danach braucht der axe-Check dokumentierte `color-contrast`-Ausnahmen.

**Bugfixes**
- 320-px-Hub-Suche: hub-scoped `≤720px`-Override in [50-hub.css](../src/app/styles/50-hub.css) (die (0,2,0)-Regel schlug die (0,1,0)-Mobile-Regel unabhängig von der Media Query → 236,8 px).
- 320-px-Overflows (vom Smoke-Set gefunden): Survey-Labels (FloatingCoord) ragten rechts raus → `overflow-x: clip` auf den vier Masthead-Containern (31/50/53/66 — pixelidentisch, die Ausläufer waren eh jenseits der Viewport-Kante); Buchseiten-Region-Tabs (342 px in einer Zeile) → `flex-wrap` ≤ 400 px.
- Timeline-Keydown-Target-Guard ([CinematicView.tsx](../src/components/timeline/cinematic/CinematicView.tsx)): Pfeiltasten auf `input/textarea/select/audio/[contenteditable]/[role=slider]` werden nicht mehr gekapert (der Volume-Slider-Konflikt). **Minimal-Guard** — die volle Stage-Begrenzung bleibt S9 Punkt 3.
- `.cine-scroll` `aria-label` entfernt (aria-prohibited-attr; reine Scroll-Capture-Fläche, jetzt `aria-hidden`); Map-Seek-Input hatte kein Label → `aria-label="Seek a world"` ([Cartouche.tsx](../src/components/cartographer/Cartouche.tsx)).
- AskClient-Smooth-Scroll respektiert jetzt Reduced Motion (einzige ungegatete Stelle; RouteMotionCanvas/MediaPlayer-Wave/RouteScrollCue waren bereits sauber).

**Skip-Link & Landmarks**
- [layout.tsx](../src/app/layout.tsx): Skip-Link als erstes tabbables Element; alle 24 Routen-`<main>` bekamen `id="main" tabIndex={-1}` (mechanischer Sweep, EOL-schonend).

**Touchziele (sichtbar, nur `pointer: coarse`)** — `@media (pointer: coarse)`-Blöcke in 31/42/54/58/61/62/64/66: Browse-Clear/Pills/Chips, Ask-Faction-Rail/Arrows/Chapters, Ask-Timeline-Stops/Footlinks, Compendium-Tabs, Podcast-Play (32→44 px)/Year-Toggle/Pills/Platform/Listen-Links, Modal-Return/Close, Catalogue-Pager (40→44 px), Lex-Seek-Input. Inline-Faction-Tags bewusst kompakt (Inline-Ausnahme, ≥24 px WCAG-2.2-Minimum).

**Semantik**
- [SiteMenu.tsx](../src/components/chrome/SiteMenu.tsx): bei offenem Menü werden alle Body-Siblings `inert` (exakt das DetailModal-Muster; Release stellt nur selbst gesetzte zurück).
- [MediaPlayer.tsx](../src/components/chrome/MediaPlayer.tsx): beide falschen `role="dialog"` entfernt (Volume-Popover → schlichtes Disclosure, Playlist → `role="group"`); Escape schließt das offene Popover und gibt den Fokus an seinen Trigger zurück (onKeyDown am Player-Root, feuert nur bei Fokus im Player).
- Podcast-Show-Seite: Jahres-Headings h3 → h2 (h1→h2→h3-Kette steht; Styling hängt an der Klasse, optisch identisch).
- Artwork: **geprüft, bewusst unverändert** — `alt=""` + `aria-hidden`-Wrapper ist korrekt (der Show-Titel steht direkt daneben, ein alt würde doppelt vorlesen); feste width/height-Attribute + fixe CSS-Box (132/116 px) ⇒ kein CLS.

**Mini-Smoke-Set (neu: [playwright.config.ts](../playwright.config.ts), [e2e/](../e2e/helpers.ts))**
- Prod-Build + zwei `next start`-Server: **:4311 „no-DB"** (unerreichbare DSN, das ci.yml-Muster) für Projekte `static` + `degraded`, **:4310 „live"** (.env.local) für Projekt `live`. `PREVIEW_GATE=off` auf beiden (sonst testet alles nur /login).
- `static` (DB-frei, required): **5 Routen × (320/1280)** — Hub, Map, Podcasts-Index, Book-Detail (Hot-Slug aus dem committeten Snapshot) und `/ask` (Fragen aus statischer Config, empirisch DB-frei) — je ein routen-spezifischer Landmark-Assert (Hub-h1 „Chrono Lexicanum", Map-SVG-Stage, Vox-h1 + pod-card, Book-h1, Ask-h1); `pageerror`/`console.error`/unerwartete same-origin 4xx-5xx ⇒ fail; kein horizontaler Overflow; axe ohne serious/critical. Läuft unter emulierter Reduced Motion (deterministisch — Entrance-Choreografie mit animiertem letter-spacing raced sonst axe/Overflow-Messungen; testet zugleich unseren Reduced-Motion-Pfad). Dazu **zwei der vier Interaktions-Smokes**: Menü-Fokus (öffnen → Siblings inert → Escape → Fokus zurück am Burger) und Map-Seek (tippen → Enter → WorldPanel → Escape → Fokus bleibt im Seek).
- `degraded` (DB-frei, required): `/timeline` + `/archive` → themed **„TRANSMISSION INTERRUPTED"** (role=alert; Status ist 200, weil Streaming beim Throw schon läuft — die Fläche, nicht der Status, ist der Assert), nie „ARCHIVE FRAGMENT LOST"; Cold-Book-Slug (Index 0) → Plain-500-Invariante: nie 404, nie leer, nie „existiert nicht".
- `live` (lokaler Pflichtlauf): `/timeline` + `/archive` Inhalts-Smokes × 2 Viewports (Landmark/Overflow/axe/Log), **Timeline-vs-Volume-Slider** (ArrowUp am fokussierten Slider erhöht die Lautstärke — der Guard-Beweis; 4. Interaktions-Smoke), Cold-Book-Canary (Index 1) über echten DB-Read. Der 3. „Interaktions-Smoke" horizontaler Overflow steckt in jedem Routen-Test bei 320.
- npm-Scripts: `test:smoke` (static+degraded = CI-Tranche), `test:smoke:live`. `.gitignore`: `test-results/`, `playwright-report/`.

**CI ([ci.yml](../.github/workflows/ci.yml))**
- Nach dem bestehenden DB-freien `npm run build`: Playwright-Browser-Cache + `npx playwright install --with-deps chromium` + `npm run test:smoke` — **im required Job**, Set ist damit ab Merge required.

## Feedback-Fixes nach Philipps Browser-Abnahme (gleiche Session)

1. **Podcast-Play mobil neu verortet:** Das 44-px-Touch-Target sprengte die Flex-Rechnung der Episodenzeile (`flex-basis: calc(100% - 44px)` war auf die 32-px-Glyphe geeicht) — der Play-Pfeil orphante allein auf Zeile 1. Statt Glyph-Spalte sitzt Play mobil jetzt als beschriftete Mono-Aktion **„Play ▸ / Stop ❙❙"** rechtsbündig in der Meta-Zeile neben „Listen ↗" (Wort im Listen-Link-Rezept, Glyphe trägt das Gold); Desktop unverändert; coarse-Targets als `min-width`/`min-height` 44px. YouTube-Zeilen (kein Inline-Audio): Platzhalter-Strich mobil ausgeblendet, `:has()`-Regel gibt „View ↗" den Rechts-Anschlag.
2. **Gold-Ring bei Maus-Klick (zweistufige Ursache, beide gefixt):** (a) `jumpTo` fokussierte den Jahres-Toggle programmatisch → Ring bei Klicks auf die Jahres-Pillen; Fokus wandert jetzt auf die **Section** (`tabIndex={-1}`, Outline unterdrückt — das Skip-Link-→-`main`-Rezept). (b) Die eigentliche Wurzel fürs „Quadrat um die Suche": **seitenweite Alt-Ringe** `main.podcasts :focus-visible` (62) und `main.entity :focus-visible` (59) — Relikte der Blanket-Ära. Mit Spezifität (0,2,1) schlugen sie jede lokale Input-Unterdrückung (0,2,0), und Chrome wertet den Klick in ein Textfeld als `:focus-visible` → Kasten um die Suche bei jedem Klick. Beide Regeln entfernt; den Tastatur-Ring liefert seit S8 allein 10-base.css (konsistent inkl. `outline-offset`).
3. **Episoden-Suche aufs Haus-Rezept:** `.pod-filter__search` trug noch die alte Variante (Sigil-Icon, linksbündig, statische Gold-Unterlinie). Jetzt exakt das `.browse-search`-Rezept von Hub/Archiv (zentrierte kursive Zeile, ruhende Haarlinie, Gold-Sweep bei `:focus-within`, `×`-Clear) — in 62-podcasts.css restated, weil der S7a-Route-Split 61-browse.css nicht auf die Podcast-Routen lädt.
4. **Archiv-Türen-Punkt trägt das Sternwarte-HUD:** Philipp wollte explizit die lx-btn-Hover-Animation („Planeten") als Dauerzustand am aktiven Punkt. Der Kicker-Punkt ist jetzt ein echtes Element (`.arch-door__dot` — an ein `::before` kann kein SVG ankern), die aktive Tür mountet `SternwarteRings` (`.arch-door__rings`, 55px × dot-scale 1.6 ≈ die 88px des Buttons, Opazität 0.45, fr1/fr2 mit dem geteilten `fxTurn`-Rezept). Zwei verworfene Fassungen: `dotBreathe` (zu subtil, 5.4s/0.55) und `eyebrowDot` (Puls, aber nicht das Gewünschte). **`AskToolTabs` (gleiche arch-door-Grammatik, /ask + /ask/faction) bekam denselben Dot+Ringe** — sonst hätte der Umbau von `::before` auf das Element dort den Punkt entfernt. Reduced-Motion-Clamp friert die Drehung global ein. Live verifiziert (Ringe nur an der aktiven Tür gemountet, `fxTurn 26s running`).

## Decisions I made

- **CI-Zuschnitt (Plan-§-S8-Entscheidung):** Required = die DB-freie Tranche exakt nach Plan-Minimum plus Zugaben — Landmark/axe/Overflow auf den Prerender-Routen **+ `/ask`**, Menü-Fokus- und Map-Seek-Smoke, und der komplette Degradations-Smoke (themed Fläche auf `/timeline`/`/archive`, Long-Tail-Invarianten). Der **Interaktions-Hauptlauf mit erreichbarer DB** (`test:smoke:live`: Timeline/Archive-Inhalte, Volume-Slider-Smoke, Cold-Book-Canary) ist der **dokumentierte lokale Pflichtlauf vor jedem Merge** — `rm -rf .next && npm run build && npm run test:smoke && npm run test:smoke:live` (genau diese Reihenfolge, s. Befund 3); in CI, sobald Philipp ein Read-only-Secret `SMOKE_DATABASE_URL` (S3a-Runtime-Rolle) anlegt. Begründung: es existiert noch kein GitHub-Secret, und ein CI-Lauf gegen die Prod-Supabase addiert Flakiness + ein stehendes Credential.
- **Required ohne Branch-Protection-Änderung:** in `lint-and-typecheck` gefaltet statt eigener Job — das zweifach etablierte Brief-180-Muster (`npm test`, `npm run build`). Kosten: der required Job dauert länger; Nutzen: „required ab Merge" ohne Repo-Settings.
- **Versionen:** `@playwright/test` 1.61.1 + `@axe-core/playwright` 4.12.1 — aktuelle Stable zum Sessionzeitpunkt (npm view), keine Gründe gegen latest.
- **Kontrast-Polarität:** `--cl-faint` heller machen + `--cl-faint-deco` für Dekor (15 Edits) statt neues Text-Token an ~90 Stellen. Gleiches Ergebnis, minimale Diff-Fläche. Werte per WCAG-Rechner belegt (Skript im Session-Scratchpad).
- **`role="dialog"` entfernt statt Fokus-Trap gebaut** (Plan bot beides an): die Player-Popovers sind semantisch Disclosures (aria-expanded-Trigger existierten schon); ein echtes Modal-Modell wäre für einen Volume-Slider Overkill. Escape+Fokus-Rückgabe ergänzt.
- **Timeline-Target-Guard schon in S8:** ohne ihn kann der geforderte Interaktions-Smoke nie grün werden. Bewusst minimal (Element-Filter am window-Listener); S9 macht die echte Stage-Begrenzung und darf den Guard ersetzen.
- **Smoke-Routen unter emulierter Reduced Motion:** Entrance-Animationen (u. a. animiertes letter-spacing der h1) machten axe-Kontrast und Overflow-Messung nichtdeterministisch (drei Flakes in Lauf 1/2 waren exakt das). Die Emulation friert den Endzustand ein und beweist nebenbei den Clamp.
- **Masthead-`overflow-x: clip`** statt Survey-Punkte mobil auszublenden: pixelidentisch (die Label-Ausläufer lagen jenseits der Viewport-Kante), kein Optik-Eingriff — Philipps Leitplanke.
- **Kein axe auf der Degradations-Seite** und kein Ausbau über die Plan-Spez hinaus („kein weiterer Ausbau" wörtlich genommen).

## axe-/Watcher-Ausnahmen (einzeln, Plan-Pflicht)

1. **`.catalogue-pager__step.is-void`** (axe `color-contrast`, serious, 1,81:1) — vom Scan ausgeschlossen ([helpers.ts](../e2e/helpers.ts) `AXE_EXCLUDES`): der deaktivierte Pager-Schritt („← Prev" auf Seite 1), `aria-hidden`, opacity 0.45 als Disabled-Affordance. WCAG 1.4.3 nimmt Text inaktiver UI-Komponenten explizit aus; axe kann Inaktivität eines `<span>` nicht erkennen.
2. **`/_vercel/…`-Requests** (Console-/Response-Watcher-Ignore): Analytics/Speed-Insights injizieren same-origin Script-/Beacon-URLs, die nur auf Vercel-Hosting existieren — unter lokalem/CI `next start` 404en sie konstruktionsbedingt. Echte Ingestion verifiziert der Launch-Runbook-Schritt auf Vercel selbst.
3. **Router-Prefetches** (Response-Watcher-Ignore, eng: nur Requests mit `Next-Router-Prefetch`/`purpose: prefetch`-Header, samt ihrer Console-Echos per Quell-URL): Produktions-`<Link>`s prefetchen sichtbare Ziele, und auf dem No-DB-Server antworten die dynamischen Ziele (/timeline, /archive, /compendium, /person/…) legitim mit 500 — das ist die designte Degradation der Zielroute, kein Defekt der getesteten Seite (die pinnt der Degraded-Smoke bei echter Navigation). Der erste CI-Lauf des PR scheiterte exakt hieran (lokal streamen dieselben Ziele 200, s. Befund 1).

Keine weiteren Ausnahmen; die übrigen axe-serious-Funde der ersten Läufe wurden **gefixt** (cine-scroll aria-prohibited-attr, Map-Seek-Label) bzw. waren Animation-Races (s. o.).

## Befunde für den Plan (S2-Follow-up)

1. **Degradationsverhalten, mit sauberem Cache verifiziert** (`/healthz` 503): Hub/Map/Podcasts/Hot-Books (prerendered) und `/ask` (statische Fragen-Config) liefern echten Inhalt ohne DB. `/timeline` und `/archive` degradieren in einem von **zwei Modi, entschieden durch eine Race zwischen DB-Fehler und Shell-Flush** (CI-Erkenntnis aus dem ersten roten Lauf): Wirft der Loader **nach** Streaming-Beginn, ist die Antwort **HTTP 200** und error.tsx rendert client-seitig die themed Fläche („TRANSMISSION INTERRUPTED", role=alert — der übliche Lokal-/Windows-Ausgang, im Browser verifiziert); schlägt die Verbindung **vor** dem Shell-Flush fehl (instant ECONNREFUSED — der übliche CI-/Linux-Ausgang), kommt eine nackte **5xx** ohne Boundary. Für Monitoring heißt das: Ausfälle können als 200 **oder** 5xx erscheinen — verlässlicher Signalweg ist Sentry (Server-`onRequestError` feuert in beiden Modi). curl/HTML-Grep sieht die themed Fläche nie (nur die Shell) — genau deshalb war der Browser-Smoke die S2-Auflage; der Degraded-Smoke akzeptiert beide Modi und pinnt die harten Invarianten (nie 404, nie „ARCHIVE FRAGMENT LOST", nie leer).
2. **Long-Tail-Degradation ist untematisiert:** On-Demand-Static-Generation (ISR-Miss) rendert bei einem Throw KEINE Error-Boundary — der Browser sieht Nexts nacktes „Internal Server Error" (Plain-Text-500), nicht „TRANSMISSION INTERRUPTED". Invarianten „nie 404 / nie leer / nie ‚existiert nicht'" halten und sind gepinnt. Ob eine thematisierte Fläche gewünscht ist (z. B. Route bei DB-Fehler dynamisch antworten lassen), ist eine Plan-Entscheidung — nicht in S8 gefixt.
3. **Geteilter `.next`-Data-/ISR-Cache, überlebt sogar Rebuilds:** erfolgreiche Live-Renders (Dev-Server, `test:smoke:live`, frühere Builds mit erreichbarer DB) füllen `.next/cache` + `.next/server/app/…`, und **`next build` räumt das nicht weg** — der No-DB-Server serviert danach echten Inhalt statt zu degradieren. Diese Falle hat in den Zwischenläufen dieser Session zunächst den falschen Schluss „alle Kernrouten sind request-seitig DB-frei" erzeugt; erst `rm -rf .next` + frischer Build zeigte das echte Verhalten (Befund 1). Konsequenzen im Set: Degraded/Live-Canary nutzen strikt verschiedene Cold-Indizes (0/1), lokale Reihenfolge ist `test:smoke` VOR `test:smoke:live`, und der verlässliche lokale Volllauf beginnt mit `rm -rf .next && npm run build`. CI ist immun (frischer Checkout, DB-freier Build).
4. **S7a-LCP-Anmerkung:** S8 Punkt 3 heilt die Hero-Unsichtbarkeit **unter Reduced Motion** (Delays genullt). Lighthouse misst ohne Reduced Motion — der in S7a notierte Mobile-LCP-Treiber (H1 `opacity: 0`-Entrance für alle Nutzer) ist damit NICHT adressiert; bleibt offen für Plan/Launch-Readiness.
5. **Smoke-Läufe fluteten das echte Sentry-Projekt (gefixt):** `.env.local` trägt seit S5 die `NEXT_PUBLIC_SENTRY_DSN`; der lokale Prod-Server (`next start`) liest sie, und der Degradations-Smoke provoziert DB-Fehler **absichtlich** — jeder Lauf dieser Session meldete also echte Events (Server via `onRequestError`-Envelope, Client via `/monitoring`-Tunnel), fälschlich getaggt `environment=production` (kein `VERCEL_ENV` lokal, `next start` setzt `NODE_ENV=production`). Erkennbar: kein `release`-Tag (der kommt nur aus `VERCEL_GIT_COMMIT_SHA`), Client-Events mit `127.0.0.1:43xx`-URLs, Routen `/timeline`, `/archive`, `/book/<cold-slug>`. **Fix:** beide Smoke-Server erhalten `NEXT_PUBLIC_SENTRY_DSN=""` (explizites Process-Env schlägt `.env.local`) — Server-Reporter aus, `/monitoring` wird zum dokumentierten 404-No-op; CI war nie betroffen (keine DSN im CI-Env). Die bereits gesendeten Events verschwinden dadurch nicht — sie liegen im Dashboard, bis Philipp sie resolved/ignoriert.

## Verification

- `npm run typecheck` — pass · `npm run lint` — pass (inkl. e2e/).
- `npm run build` — pass (Prod-Build, Hot-Subset 73 Buchseiten prerendert; nach `rm -rf .next` verifiziert).
- **`npm run test:smoke`** (CI-Tranche: static 12 + degraded 3) — **15/15 pass** gegen frischen Build mit sauberem Cache.
- **`npm run test:smoke:live`** (lokaler Pflichtlauf: 4 Routen-Smokes + Volume-Slider + Canary) — **6/6 pass** gegen .env.local-DB.
- Nach dem Sentry-Fix (Befund 5) kompletter Volllauf wiederholt (`rm -rf .next` → build → smoke → smoke:live): erneut 15/15 + 6/6, tsc/eslint grün, Ports 4310/4311 frei — und **kein einziges neues Event** verlässt die Test-Server mehr.
- **CI-Härtung nach dem ersten roten PR-Lauf:** In CI degradierten /timeline+/archive im Pre-Shell-Modus (nackte 5xx statt 200+Fläche — Befund 1 präzisiert) und die Link-Prefetches der dynamischen Routen 500ten in den Log-Watcher (→ Ausnahme 3). Zusätzlich Menü-Fokus-Test deterministisch verankert (expliziter `burger.focus()` — Klick-Fokus ist UA-abhängig, einmal lokal geflaked) und dem Live-Projekt `timeout: 180s` gegeben (Erst-Render von /timeline zahlt seine DB-Roundtrips bei WAN-Latenz; an langsamen Abenden >60s, danach cached-instant; Prod zahlt sie intra-region). Danach lokal erneut: 15/15 + 6/6.
- Degradations-Fläche zusätzlich von Hand im Browser gesehen (No-DB-Server, `/timeline` → „TRANSMISSION INTERRUPTED").
- Die Smoke-Iterationen fanden echte Bugs, die gefixt wurden: 320-px-Overflow auf Archiv (Survey-Labels) und Buchseite (Region-Tabs), `aria-prohibited-attr` auf `.cine-scroll`, fehlendes Label am Map-Seek-Input, Kontrast-/Overflow-Flakes durch Entrance-Animationen (→ Reduced-Motion-Emulation), Cache-Falle (Befund 3).
- Browser-Abnahme durch Philipp (sein erklärter Part): Fokus-Ring, Kontrast-Vorschau, 320-px-Suche.

## Open issues / blockers

- **Philipp entscheidet die Kontrast-Vorschau im Browser** (Rückbau-Anleitung oben; bei Rückbau brauchen die dann roten axe-`color-contrast`-Funde dokumentierte Ausnahmen in `AXE_EXCLUDES`).
- **Optional `SMOKE_DATABASE_URL`-Secret** (S3a-Read-only-Rolle) anlegen, wenn der Live-Canary in CI laufen soll; bis dahin gilt der dokumentierte lokale Pflichtlauf.
- Long-Tail-500 untematisiert (Befund 2) — Plan-Entscheidung.

## For next session

- **S9** ersetzt den minimalen Keydown-Guard durch echte Stage-Begrenzung (Guard-Kommentar markiert die Stelle) und macht Index-View zum Coarse-Pointer-Default; der Volume-Slider-Smoke pinnt die Invariante bereits.
- **S10a**: Map-Seek-Smoke pinnt Seek+Fokus-Verbleib; WorldPanel-Fokusmodell (ankündigen/zurückgeben) kommt dort dazu.
- Hero-Entrance vs. Mobile-LCP (Befund 4) — falls das 2,5-s-Budget vor Launch stehen soll, braucht es eine bewusste Design-Entscheidung (z. B. H1 sichtbar starten, nur transform animieren).
- Podcast-`pod-tag`-Chips bleiben < 44 px (Inline-Ausnahme) — falls Philipp mobil mehr Luft will, ist das ein Einzeiler im coarse-Block von 62-podcasts.css.

## References

- Playwright 1.61 docs (webServer array, projects, emulateMedia), @axe-core/playwright 4.12 (AxeBuilder.exclude), Deque-Regeln aria-prohibited-attr / color-contrast, WCAG 2.2 §1.4.3 (inactive components) + §2.5.8 (target size minimum).
