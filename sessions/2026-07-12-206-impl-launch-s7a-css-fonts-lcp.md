---
session: 2026-07-12-206
role: implementer
date: 2026-07-12
status: complete
slug: launch-s7a-css-fonts-lcp
parent: docs/launch-master-plan.md § Session 7a (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
commits: []
---

# Launch S7a — CSS, Fonts, Hero-LCP

## Summary

Das globale CSS-Bundle ist von **255 KB raw (44 KB gz) auf 94,8 KB raw (17,6 KB gz)** pro Route geschrumpft (−62 %): 15 route-spezifische Partials laden jetzt nur noch in ihrem Segment bzw. mit ihrer Komponente, `63-fraktionen.css` (4,5 KB, 100 % tot) ist gelöscht, fünf bestätigt tote Podcast-Regelblöcke sind raus. Cinzel ist entfernt (lud ~25 KB Variable-Font auf jeder Route, renderte nie), Cormorant Unicase lädt nur noch im Timeline-Segment — Font-Preloads pro Route: **11 (~210 KB) → 8 (~157 KB)**. Der Hero ist vom CSS-Background auf ein preload-scannbares, responsives `next/image` umgestellt: Phones laden **~38 KB statt 235 KB** (−84 %). Lab-Budgets: Desktop-LCP 1,35 s ✓, CLS ≤ 0,033 ✓, TBT ≤ 40 ms ✓; **Mobile-LCP verfehlt das 2,5-s-Budget** (Home 6,3 s, von 7,5 s) — der dominante Rest-Treiber ist die Hero-Entrance-Animation (H1 startet `opacity: 0` mit 0,4 s Delay + 1,35 s Dauer), die explizit **S8-Scope** ist (Master-Plan § S8 Punkt 3: „Hero-Content sonst bis 1,15 s unsichtbar"). Begründung unten.

## Messwerte — Baseline vs. Nachmessung (Prod-Build lokal, `next start`, PREVIEW_GATE=off)

**CSS pro Route (raw / gzip):**

| Route | vorher | nachher |
|---|---|---|
| jede Route (global) | 261,3 KB / 44,0 KB (243,2 + 18,1 Fonts) | 94,8 KB / 17,6 KB |
| `/` (Home) | 261,3 / 44,0 | 98,5 / 18,7 (global + 3,7 Hub) |
| `/archive` | 261,3 / 44,0 | 94,8 / 17,6 (nur global) |
| `/archive/podcasts` | 261,3 / 44,0 | 108,0 / 20,4 (+13,3 Podcasts) |
| `/timeline` | 261,3 / 44,0 | 132,7 / 25,7 (+37,9 Chronicle inkl. Unicase-@font-face) |
| `/map` | 261,3 / 44,0 | 130,6 / 24,6 (+35,8 Cartographer) |

**Fonts:** Preloads pro Route 11 Dateien ≈ 210 KB → 8 ≈ 157 KB (Cinzel-Variable ~25 KB ganz raus; Unicase 2 Dateien ~12 KB nur noch Timeline). `grep Cinzel .next/static/chunks/*.css` → leer; Unicase-@font-face ausschließlich im Timeline-Chunk.

**Hero-Bild:** vorher CSS-`background-image` `/img/main-bg.webp` fix 235 KB, für den Preload-Scanner unsichtbar (Discovery erst nach CSS-Parse + Layout). Nachher `<link rel="preload" as="image" imagesrcset …>` im HTML-Head + responsive Varianten via `/_next/image`: w640 = 29 KB, w750 = 38 KB, w828 = 46 KB, w1080 = 71 KB, w1920 = 178 KB (q75).

**Lighthouse (npx lighthouse, headless Chrome, Standard-Throttling; JSONs im Session-Scratchpad):**

| Messung | vorher | nachher | Budget |
|---|---|---|---|
| Home mobile LCP | 7 512 ms | 6 262 ms | ≤ 2 500 ✗ (Begründung unten) |
| Home mobile FCP | 1 206 ms | 1 057 ms | — |
| Home mobile CLS | 0,0004 | 0,0004 | ≤ 0,1 ✓ |
| Home mobile TBT (INP-Proxy) | 69 ms | 40 ms | ✓ |
| Home mobile Score | 0,76 | 0,78 | — |
| Home desktop LCP | 1 474 ms | 1 351 ms | ≤ 2 500 ✓ |
| Podcasts mobile LCP | 9 314 ms | 7 685 ms | ≤ 2 500 ✗ (dito) |
| Podcasts mobile CLS | 0,032 | 0,032 | ≤ 0,1 ✓ |

**RSC-Budget (Punkt 4):** Home-RSC 67 KB, Podcasts-RSC 72 KB — die 531–537-KB-Stichprobe aus dem Plan hatte bereits S6 abgeräumt; S7a hält den Stand (± < 1 KB).

### Warum Mobile-LCP das Budget verfehlt — und warum das hier nicht fixbar war

Das LCP-Element auf Home **und** Podcasts ist die Hero-`<h1>` (Text), **nicht** das Hintergrundbild — Chrome wertet Full-Viewport-Bilder nicht als LCP-Kandidaten. Beobachtetes LCP lokal: 488 ms, davon **480 ms „element render delay"** — die H1 startet per `enterTitle 1.35s 0.4s both` unsichtbar (50-hub.css:48); unter Lighthouse-Mobile-Throttling (4× CPU + Slow-4G-Simulation) skaliert genau dieser Anteil auf Sekunden. Render-blocking CSS ist nach dem Split nur noch ~20,7 KB gz („wastedMs" 304). Die Animations-Delays sind im Master-Plan **explizit S8 zugeordnet** (§ S8 Punkt 3: Reduced-Motion inkl. Delays, „Hero-Content sonst bis 1,15 s unsichtbar") — ein Eingriff hier wäre Cross-Session-Scope gewesen. Die S7a-Hebel (CSS −62 %, Fonts −25 %, Bild −84 % mobil) haben geliefert, was sie können: −1,25 s Home, −1,63 s Podcasts. Erwartung: S8 (Animation) bringt Mobile-LCP unter Budget; p75-Realwerte ab Launch via Speed Insights.

## What I did

**Route-CSS-Split (Punkt 1):**

- `globals.css` behält nur Chrome + geteilte Vokabulare: Tokens, Base, Shared, **31-catalogue** (`.arch-door*` nutzt auch /ask via AskToolTabs; `.catalogue-hero*` auch die Podcast-Seiten), 40/41/42/43/44/46/47, **45-site-legal** (neu, s. u.), 56-media-player, **61-browse** (Home + /archive + /archive/podcasts + /compendium), 65-loading, 69-system-pages, 70-route-progress. Header-Kommentar dokumentiert Mapping + Kaskaden-Vertrag.
- Verschoben (Import im Segment bzw. in der besitzenden Komponente): 30-ingest → beide /ingest-Pages + not-found · 32-book-audit → Audit-Page · 50-hub → Home · 51-book-detail → `BookDetailView` (Route **und** Book-Modal) · 53-ask → `AskToolTabs` (beide Ask-Routen) · 54-ask-faction → Faction-Page · 55-map → Map-Page · 58-ask-booklist → `AskClient` · 59-entity → `EntityView` (4 Entity-Routen + Entity-Modals) · 62-podcasts → beide Podcast-Pages · 64-detail-modal → `DetailModal` + `DetailModalSkeleton` · 66-compendium → Compendium-Layout · 67-chronicle → Timeline-Page · 68-login → Login-Page · 71-legal → /imprint + /privacy + /artwork.
- `71-legal.css` gesplittet: die `.site-legal`-Chrome-Row (Root-Layout, `<SiteLegal>`) lebt jetzt global in **`45-site-legal.css`**; 71 enthält nur noch die `.legal*`-Dokumentseiten-Styles.
- `63-fraktionen.css` gelöscht (kein `.factions`/`.fac-*` in irgendeinem TSX — verifiziert).
- **Tote Podcast-Regeln** aus 62 entfernt (jeweils gegen `src/**/*.tsx` verifiziert): `.pod-search`-Familie, `.pod-toolbar`-Familie, `.pod-empty` (Index nutzt `.catalogue-empty`), plus zwei **kontext-tote** Cross-File-Overrides (`main.podcasts .browse-search__input:focus-visible`, `body:has(main.podcasts) .browse-suggest*` — unter `main.podcasts` wird nie eine BrowseSearch/Suggest gerendert; die Detailseite mountet `PodcastEpisodeArchive` mit `.pod-filter__input`). Stale Pfad-Prosa im 62-Header korrigiert.

**Kaskaden-Vertrag für Cross-Route-Navigation (der kritische Teil von Punkt 1):** Einmal geladenes Route-CSS bleibt bei App-Router-Navigation im Client kleben; die Einfügereihenfolge zweier Route-Chunks hängt vom Navigationspfad ab. Deshalb systematisch verifiziert:

1. Jeder Cross-File-Override in einem verschobenen Partial trägt **strikt höhere Spezifität** (zusätzliche Ancestor-Klasse): `.detail-modal__scroll .book-detail__*` (64→51), `.ask-doors .arch-door__title` (53→31), `.hub-search .browse-search` (50→61), `body.cg-on-map .site-*` (55→43/44/46), `body:has(main.login) .site-*` (68→41/43/56/45), `body:has(main.podcasts) .site-bg::after` (62→41). Reihenfolge damit irrelevant.
2. Gleich-spezifische Overrides existieren nur **Route-Chunk → globales Bundle** (`.catalogue-hero__heading--show` in 62 vs. 31): das globale Bundle lädt immer zuerst, Route-CSS immer danach — in jeder Navigationsreihenfolge.
3. **Kein Selektor und kein @keyframes-Name ist in zwei verschobenen Partials definiert** (skriptgeprüft; die `.route-cue--flow`-Anpassungen in 31/53/66 sind unter route-eigenen Parents gescoped; geteilte Keyframes wie `enter`/`enterTitle` leben einmal in 00-tokens). Damit kann keine Soft-Nav-Reihenfolge ein anderes Rendering erzeugen als ein Hard-Load — **CSS Modules waren nirgends nötig**.
4. RSC-Flights aller Routen referenzieren ihre CSS-Chunks (Soft-Nav lädt nach, verifiziert via `RSC: 1`-Header); 64-detail-modal (4 KB) hängt über `@modal/loading.tsx` am Root-Layout und ist damit de facto global — gewollt, das Modal kann überall öffnen; die großen View-Styles (51/59) laden on demand mit dem Intercept-Flight.

**Fonts (Punkt 2):**

- `layout.tsx`: Cinzel-Load entfernt (war in beiden Stacks reiner Fallback hinter immer geladenen next/font-Faces — konnte nie rendern); Cormorant-Unicase-Load entfernt.
- `timeline/page.tsx`: lädt Cormorant Unicase segment-only; Variable-Klasse auf `main.chron-shell` (beide Render-Zweige).
- `00-tokens.css`: `--font-display: var(--font-cormorant-sc), serif`; `--font-unicase` raus aus :root — **nach** `67-chronicle-cinematic.css` verschoben, gescoped auf `.chron-shell` (`var(--font-cormorant-unicase), serif`). Grund: eine Custom Property, die die Font-Variable referenziert, wird am deklarierenden Element substituiert — am :root wäre sie ohne den site-weiten Load guaranteed-invalid. Wiring end-to-end im Build verifiziert (generierte Klasse auf `<main>` + Definition im Timeline-Chunk).
- Sieben stale „Cinzel"-Kommentare in Partials auf die real rendernde Face (Cormorant SC) korrigiert.
- Preload-Prüfung: verbleibende 8 Preloads = Cormorant SC (3) + Cardo (3) + Fragment Mono (2), alle latin, alle `display: swap` — alle drei Voices sind Above-the-fold auf jeder Route (Display-H1, Body-Prosa, Mono-Eyebrows/HUD). Weiter reduzieren hieße FOUT auf Kernflächen; gelassen.

**Hero-LCP (Punkt 3):**

- `SiteBackground.tsx`: CSS-`background-image` → `next/image` mit `fill`, `priority`, `sizes="100vw"`, leerem `alt` im `aria-hidden`-Backdrop. Preload-scannbar (Link-Preload mit `imagesrcset` im Head) + responsive (Phones ~38 statt 235 KB). `priority` unconditional: der Backdrop ist per Definition der erste paintbare Viewport-Inhalt jeder Seite, die ihn rendert.
- Crop-Verträge erhalten: Portrait-Re-Center via `--bg-pos-m` jetzt als `object-position` auf `.site-bg__photo img` (41-site-bg.css); der /login-`contain`-Modus analog auf `object-fit/-position !important` umgestellt (68-login.css). `!important`-Muster wie zuvor (Resting-Position liegt inline).

## Decisions I made

- **31-catalogue und 61-browse bleiben global** statt in mehrere Segmente dupliziert: echte geteilte Vokabulare (4+ Flächen), Duplikation würde bei Cross-Navigation doppelt laden und neue Reihenfolge-Risiken schaffen. Zusammen 18 KB raw — bewusster Rest.
- **Keine CSS Modules eingeführt:** Die Spec erlaubt sie „wo echte Isolation nötig ist"; nach dem Spezifitäts-/Duplikat-Beweis (oben) gibt es keinen order-abhängigen Konflikt — Modules hätten nur Umbenennungs-Churn gebracht (Leitplanken 1/7).
- **`priority` auf jedem SiteBackground** statt Prop-Steuerung pro Route: immer Above-the-fold; ein Prop wäre Konfiguration ohne zweiten Zustand.
- **Kein Eingriff in die Hero-Entrance-Animation** trotz LCP-Miss: explizit S8-Scope (Master-Plan § S8 Punkt 3), dort gehört Reduced-Motion + Delay-Politik zusammen gelöst.
- **Lighthouse via npx als Lab-Messinstrument** (keine Repo-Dependency, Leitplanke 5 unberührt): die Budget-Zahlen der Spec sind Lighthouse-Vokabular; INP ist im Lab nicht messbar → TBT als Proxy berichtet, p75-INP kommt ab Launch aus Speed Insights (E6).
- `64-detail-modal.css` bewusst an DetailModal/Skeleton statt an die Intercept-Pages gebunden: lädt so über `@modal/loading.tsx` mit dem Root-Layout (4 KB) und das Overlay-Chrome ist beim ersten Modal-Open bereits da — kein Fallback-Flash.

## Verification

- `tsc --noEmit` ✓ · `eslint` über alle 20 angefassten Dateien ✓ · `next build` ✓ (alle Routen, keine neuen Warnungen; Server-Log fehlerfrei).
- Hard-Loads aller Routen (Home, Archive, Podcasts-Index+Detail, Timeline, Map, Ask, Ask/Faction, Compendium, Book, Character, Login, Imprint) per curl: 200, korrekte CSS-Chunk-Sets (Mapping im Report oben), Font-/Image-Preloads wie erwartet.
- Soft-Nav-Nachladen: RSC-Flights referenzieren die Route-Chunks (alle Kern-Routen geprüft).
- Kaskaden-Beweis skriptbasiert (Selektor-/Keyframes-Duplikat-Scan über alle verschobenen Partials: keine Treffer außer Keyframe-Steps).
- Lighthouse vorher/nachher (Tabellen oben), JSONs im Session-Scratchpad.
- **Offen für Philipps Browser-Abnahme (per Prompt vereinbart):** Optik aller Flächen + Cross-Route-Navigationspfade (mehrmals hin und her: Home ↔ Archive ↔ Podcasts ↔ Timeline ↔ Map ↔ Ask; Modal aus Home/Archive/Compendium öffnen; /login Desktop-Contain-Crop; Timeline-Era-Band-Labels in Unicase). Ein Prod-Server läuft dafür auf `http://localhost:3000` (PREVIEW_GATE=off). Die In-App-Browser-Pane war in dieser Session headless/hidden (LCP/Screenshots dort nicht möglich — Messung lief über Lighthouse).

## Open issues / blockers

- **Mobile-LCP über Budget** (6,3 s Home / 7,7 s Podcasts, simuliert) — Rest-Treiber Hero-Entrance-Delays, gehört zu S8 (Begründung + Zahlen oben). Kein S7a-Folge-Task.
- Die Browser-Pane des Harness blieb `visibility: hidden` und nahm keine Navigation an — für künftige Mess-Sessions direkt Lighthouse nehmen.
- `/_next/image` optimiert on-the-fly beim ersten Hit (lokal via sharp, auf Vercel gecached) — auf Hobby-Tier zählt das gegen die Image-Optimization-Quota (11 lokale Quellbilder, unkritisch).

## For next session

- S8 übernimmt die Animations-/Reduced-Motion-Politik — die LCP-Restdifferenz hängt daran; nach S8 Mobile-LCP einmal nachmessen (gleicher Lighthouse-Aufruf, Werte in diesem Report als Referenz).
- 7b (nach Launch): `hub.webp` u. a. ungenutzte Backdrops entscheiden; MediaPlayer-Split.

## References

- docs/launch-master-plan.md § Session 7a (Spec), § Session 8 Punkt 3 (Animations-Delays), Leitplanken 4/5/7.
- Baseline-/After-Artefakte (HTML-Snapshots, Lighthouse-JSONs): Session-Scratchpad `…/scratchpad/{baseline,after}/`.
- Kaskaden-Inventar der Partials: Explore-Agent-Analyse dieser Session (Selector-Präfixe, Cross-File-Overrides, Konsumenten je Partial).
