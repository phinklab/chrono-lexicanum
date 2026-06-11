---
session: 2026-06-11-141
role: implementer
date: 2026-06-11
status: complete
slug: frontend-deep-review
parent: (kein Arch-Brief — Direktauftrag Philipp, Review- + Design-Language-Session)
links: [2026-06-10-138, 2026-06-11-140, 2026-06-10-139]
commits:
  - (der Commit, der diesen Report + /lab/design + ui-backlog trägt)
---

# Frontend-Deep-Review — Design-Kohärenz, Qualität, Concurrency, freier Blick (+ Styleguide `/lab/design`)

> Worktree: `chrono-lexicanum-product`, Strang: Product/UI,
> Branch: `codex/product-frontend-deep-review` (von `origin/main` @ f6e922e, enthält den Timeline-Port aus Brief 138).
> **Read-only-Review:** bestehende Komponenten/CSS unangetastet. Einzige Code-Änderung:
> die additive Styleguide-Route `/lab/design` (2 neue Dateien), dazu dieser Report und
> ein `docs/ui-backlog.md`-Nachtrag. Kein Lasttest gegen Produktion/Supabase — nur die
> erlaubte kleine lokale Probe (`next build` + `next start`, 27 Requests, siehe § D.0).

## Methodik

95 Agents in einem orchestrierten Workflow: 20 read-only Finder (10 Surface-Audits A,
5 Qualitäts-Dimensionen B, 3 Concurrency-Dimensionen D, 2 freie Blicke E), 3 Ideen-Agents
(C), ein Completeness-Critic plus 5 Lücken-Nachzügler — und **jedes faktische Finding
wurde von einem zweiten, unabhängigen Agent adversarial verifiziert** (Dateien selbst
geöffnet, Haus-Stil-Caveat angewandt, Fix auf Tragfähigkeit geprüft). Ergebnis:

| | |
|---|---|
| bestätigt | **145** |
| bestätigt mit Korrektur (eingearbeitet) | **35** |
| widerlegt & aussortiert | **49** (§ „Widerlegte Findings") |
| unverifiziert übernommen | **0** |
| Design-Ideen (C) | **18** |

Completeness-Critic: Abdeckung >90 %; die 5 gemeldeten Lücken (Metadata-Inventar,
loading.tsx-Abdeckung, reduced-motion-Inventar, Rendering-Config-Konsistenz,
Glow-Restbestände) wurden durch Nachzügler-Audits geschlossen und sind eingearbeitet.
Benchmark für alles: die `/timeline`-Designsprache aus Brief 138.

## Executive Summary

1. **Die Site spricht drei Farbsprachen, und nur eine davon ist die Zielsprache.**
   `00-tokens.css` trägt die Phase-1-Palette (void/aquila/frost/heresy, fast tot) und
   die post-096-Cyan-Palette (`--cl-cyan` & Co., von Hub/Ask/Archive/Atlas/Player
   konsumiert); die Timeline-Benchmark-Palette (Void `#04060b` / Parchment `#e9dfc8` /
   Antik-Gold `#c9b896` / Steel `#7d8799`) existiert **nur als lokale Custom-Properties
   im `.chron`-Scope**. Dazu Wert-Drift: zwei Golds (`#c9a65a` vs. `#c9b896`), zwei
   Parchments (`#e8dcc0` vs. `#e9dfc8`). Der größte einzelne Hebel des ganzen Reviews
   ist die **Token-Promotion der Timeline-Palette nach `00-tokens.css`** + geordneter
   Cyan-Abbau (§ A.Q1).
2. **Das Slop-Inventar konzentriert sich auf vier Primitives.** `.c-glass`
   (Glassmorphism + Cyan-Border + 40px-Schatten + Hover-Lift), `.c-corners`
   (Cyan-Corner-Brackets), `.c-link-cyan`, `.c-shadow-text` (Cyan-Glow) in
   `40-primitives.css` werden von >10 Komponenten quer über die Site konsumiert —
   wer sie ablöst, entschlackt Hub, Archive-Empty-States, Book-Detail und Atlas in
   einem Zug (§ A.Q2). Dazu verstreute Cyan-Glows (Bottom-Console-Dot, MediaPlayer,
   Compendium-/Ask-Hero, Atlas) und der **globale Cyan-Fokusring** in `10-base.css`.
3. **Auch die Timeline selbst hat Glow-Restbestände über ihrer eigenen
   Restraint-Schwelle** (11 Gold-Glows mit 0.4–0.65 Alpha, dazu 18+ Gold-rgba-Literale
   statt Tokens und der Magic-Value `#d8d2c2`) — der Benchmark braucht einen kleinen
   Selbst-Putz, bevor er als Maßstab versteinert (§ A.T).
4. **Concurrency: die lokale Probe hat die Brief-140-These empirisch bestätigt — und
   verschärft.** 12 parallele Requests auf das ungecachte, dynamische `/archive`
   liefen **alle** in den 60-s-Timeout und hungerten 2 von 12 parallelen
   `/timeline`-Requests mit aus; der Cold-Cache-Fill von `/compendium` brauchte lokal
   >75–105 s (warm: 0,28 s). Die Abhilfen sind billig: ISR/`cachedRead` auf
   `/archive`, SSG/ISR auf `/buch/[slug]`, `cacheBooks:true` auf `/ask` (Ein-Zeilen-Fix),
   TTL 300→3600 (§ D).
5. **Launch-Hygiene hat echte Löcher:** kein Root-`error.tsx`/`not-found.tsx`
   (DB-Störung ⇒ ungebrandete Next-Fehlseite), kein Favicon, kein OG-Image, Home und
   Compendium ohne `metadata`, `robots: noindex` hart codiert ohne Launch-Checkliste —
   und **jede Entity-Seite verlinkt als Breadcrumb auf admin-gated `/atlas`-Decks,
   also 404 für normale Besucher** (§ E).
6. **Dead Code ist klar umrissen und gefahrlos abräumbar:** die komplette alte
   Chronicle (`components/timeline/chronicle/*`, `DetailPanel.tsx`, `FilterRail.tsx`,
   CSS-Partials 20/22/57), `Aquila.tsx`, ungenutzte Phase-1-Tokens (§ B1).
7. **A11y-Grundlinie:** etliche Endlos-Animationen ohne `prefers-reduced-motion`-Gate
   (Ken Burns 38 s, Hub-Drifts 38/53 s, Map-Holo-Flicker, ScanLine), Kontrast
   `--steel-dim` auf Void ~3.1:1 (unter WCAG AA — auch in der Timeline), fehlendes
   `inert` am DetailModal (§ B5).
8. **Deliverable 3 steht:** `/lab/design` — CD-Overview der Zielsprache (Tokens,
   Typoskala, Flächenregeln, 8 Kern-Bausteine als gebaute Beispiele, 8 Do/Don't-Paare
   gegen die Slop-Checkliste, 3 Vorschlags-Bausteine aus Dimension C). Baut statisch,
   `tsc` + `eslint` grün.

---

## Schritt 0 — Slop-Checkliste

Kompiliert aus Web-Recherche (u. a. [impeccable.style/slop](https://impeccable.style/slop/),
[925studios AI-Slop-Guide](https://www.925studios.co/blog/ai-slop-web-design-guide),
[„Why Your AI Keeps Building the Same Purple Gradient Website"](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website),
[axe-web zur AI-Design-Sameness](https://axe-web.com/insights/ai-website-design-sameness/))
plus eigene Erfahrung plus die explizit benannten Bestands-Patterns dieser Codebase.

**A · Farbe & Licht**
- **S1** Cyan/Türkis-Akzent auf dunklem Grund (hier: `--cl-cyan #9ce6ff`)
- **S2** Glow/Halo: farbige box-shadows, text-shadow-Glow, radiale Licht-Halos
- **S3** Warme Amber-/Orange-Gradients als Fläche (vom Maintainer explizit abgelehnt)
- **S4** Purple-to-blue-Gradients (Hero, Buttons, „Orbs")
- **S5** Gradient-Text/Headlines (`background-clip: text`)
- **S6** Neon-Akzente + geblurte Farb-Orbs im Dark Mode

**B · Form & Fläche**
- **S7** Corner-Brackets / extra akzentuierte Ecken auf solid Borders (hier: `.c-corners`)
- **S8** Glassmorphism als Dekor (`backdrop-filter: blur` ohne Funktion; hier: `.c-glass`)
- **S9** Generische Card: 12–16px+ Default-Radius + Soft-Shadow; identische Icon+Heading+Text-Grids
- **S10** Cards-in-Cards-in-Cards
- **S11** Hairline-Border + breiter Soft-Shadow zugleich; dicke farbige Seiten-Border
- **S12** Einheitsradius überall, monotone Abstände

**C · Typografie**
- **S13** Default-Fonts als Charakter-Ersatz (Inter/Geist/Space Grotesk/Instrument Serif), eine Familie für alles, flache Hierarchie
- **S14** Mechanische Eyebrow-Kicker über jeder Section; 01/02/03-Marker als Deko
- **S15** Hero-Metrik-Muster (große Zahl + Mini-Label + drei Stütz-Stats)

**D · Ikonografie & Motion**
- **S16** Emoji als Icons; wahllos gestreute Icon-Bibliothek
- **S17** Bounce/Elastic-Easing, Hover-Scale/-Rotation, zielloses Dauer-Pulsen/Blinken
- **S18** HUD/Terminal-Klischee-Paket als reine Deko (Scanlines + Blink-Dots + Pseudo-Telemetrie „SYSTEM ONLINE")

**E · Copy**
- **S19** Buzzword-Copy, gleichförmige Aphorismen-Kadenz, Em-Dash-Inflation

**Haus-Stil-Caveat** (galt für alle Finder UND alle Verifier): Mono-Uppercase-Labels,
Film-Grain und ruhige In-Universe-Telemetrie sind hier *bewusster* Hausstil. Slop ist
der **undifferenzierte** Einsatz — Cyan-Glow-Deko, blinkende Pseudo-Telemetrie ohne
Informationswert, Eyebrow als Reflex. Leitfrage: Weicht es von der Timeline-Sprache ab?
Die 49 widerlegten Findings sind großteils genau an diesem Caveat gestorben — der
Filter hat funktioniert.

---

## D.0 — Empirie: Build-Routentabelle + lokale Lastprobe

`next build` (auf diesem Branch) ergibt:

| Modus | Routen |
|---|---|
| ○ Static / ISR | `/` (revalidate 5m), `/archive/podcasts` (5m), `/ingest`, `/lab/cartographer`, **`/lab/design`** |
| ● SSG (generateStaticParams) | `/charakter/[slug]` (500 Pfade), `/welt/[slug]` (300), `/fraktion/[slug]` (206), `/person/[slug]` (136), `/archive/podcasts/[slug]`, `/ingest/[runId]` |
| ƒ Dynamic (pro Request, DB) | **`/timeline`, `/archive`, `/compendium` + `[category]`, `/buch/[slug]` (+`/audit`), `/ask`, `/map`, `/buecher`, `/fraktionen`**, alle `@modal`-Intercepts |

Lokale Probe (`next start`, ein Prozess, Pool `max:5`; Supabase-Pooler geschont —
27 Requests gesamt):

- **/compendium kalt:** Request 1 → Timeout nach 30 s; Request 2 → Timeout nach 75 s;
  Request 3 (nach abgeschlossenem Cache-Fill) → **200 in 0,28 s**. Der
  `cachedRead`-Cold-Fill (~7 Aggregate gegen Pool max:5) brauchte lokal also
  irgendwo zwischen ~75 s und ~3 min — das ist exakt das in `db/client.ts`
  dokumentierte „/compendium ~77 s"-Incident-Muster, jetzt reproduziert.
- **12× /archive parallel (Concurrency 8): alle 12 → 60-s-Timeout** (Header 200,
  Body nie fertig). `/archive` ist dynamic und ruft `loadBrowseBooks()` ungecacht
  pro Request — die Requests stauen sich vor dem 5er-Pool.
- **12× /timeline parallel, zeitgleich:** 10× **200 in 0,1–0,56 s** (warm), aber
  **2× ausgehungert** (Timeout) — die /archive-Last hat unbeteiligte Requests im
  selben Prozess blockiert.

**Übertragbarkeits-Caveat:** lokal = 1 Prozess mit 1 Pool (Serialisierung); Vercel =
parallele Lambdas mit je eigenem Pool (Druck verlagert sich auf den Supabase-Pooler,
default_pool_size ~15). Die absoluten Zahlen gelten nicht, die Richtung schon: **die
ungecachten dynamischen Routen sind der Engpass, nicht die DB** (deckungsgleich mit
Brief 140, Dimension C).

---

## Dimension A — Design-Kohärenz (nach Impact)

### A.Q — Querschnitt (systemisch, betrifft alle Surfaces)

**A.Q1 · Drei-Paletten-Zustand + Token-Drift** — `src/app/styles/00-tokens.css:26-90`,
`67-chronicle-cinematic.css:23-48` · S1 · **high / L** · defect+proposal
Phase-1 (void/aquila/frost/heresy), post-096-Cyan (`--cl-*`) und Timeline-Palette
(`.chron`-lokal) koexistieren; Gold fragmentiert (`#c9a65a` @theme vs. `#c9b896`
Timeline vs. `rgba(201,166,90,*)` in 62-podcasts), Bone `#e8dcc0` vs. Parchment
`#e9dfc8`. Jede neue Route muss Werte duplizieren oder auf Cyan ausweichen.
**Fix:** Timeline-Palette als globale Tokens nach `00-tokens.css` heben
(`--color-cl-gold → #c9b896`, `--color-cl-bone → #e9dfc8`, Steel neu), Phase-1-Block
ausgliedern (einziger echter Konsument: 3 aquila-Refs in `32-book-audit.css`),
`--hl`/`--hl-glow` (Cyan-oklch; `--hl-glow` ist komplett ungenutzt) abwickeln.
Das ist die Voraussetzung für jede Surface-Restyle-Welle — **eigener Brief**.

**A.Q2 · `40-primitives.css` = kodifiziertes Slop-Inventar** — `:10-46` · S1/S2/S7/S8/S11/S17 · **high / M**
`.c-glass` (Gradient + blur(10px) + 40px-Soft-Shadow + Cyan-Border + Hover-`translateY(-2px)`),
`.c-corners` (Cyan-Brackets), `.c-hairline`/`.c-vhair` (Cyan-Gradients), `.c-shadow-text`
(32px-Cyan-Glow), `.c-link-cyan` — konsumiert von BottomConsole, Archive-Empty-States,
BookDetailView-Cover-Panel, Atlas-Decks, Ask u. a. **Fix:** Ziel-Primitives im
Timeline-Vokabular daneben stellen (Plate = Void-2 + Hairline; vgl. die Bausteine auf
`/lab/design`), Konsumenten schrittweise umziehen, Alt-Primitives als `legacy`
markieren und am Ende löschen.

**A.Q3 · Globaler Fokusring ist Cyan-Glow** — `10-base.css:54-58` · S2 · **medium / S**
`:focus-visible { outline: 1px solid var(--cl-cyan); box-shadow: 0 0 0 4px rgba(156,230,255,.18) }`
liegt auf *jedem* fokussierten Element der Site. **Fix:** `outline: 1px solid` Gold,
box-shadow streichen (A11y bleibt gewahrt, Sichtbarkeit über Outline+Offset).
`/lab/design` zeigt den Ziel-Fokusring bereits.

**A.Q4 · `--hl` (Cyan) treibt das ganze 24er-Modal + Legacy-Highlights** —
`00-tokens.css:236-238`, `24-detail-modal.css` (17+ Refs) · **medium / M** — hängt an
A.Q1; Option für v1: 24er-Refs auf Gold mappen (relevant nur noch fürs Audit-Cockpit,
siehe A.7).

### A.T — Die Timeline selbst (Benchmark-Selbst-Putz)

**A.T1 · Gold-Glows über der eigenen Restraint-Schwelle** — `67-chronicle-cinematic.css:207,292,315,352,596,856,939,1045,1085,1103,1251` · S2 · **medium / M**
11 farbige box-/text-shadows mit Alpha 0.4–0.65 (z. B. `.node.on .dot`: `0 0 26px`
@ 0.65; Datei-Kommentar verlangt „glow ≤ 22%"). Verifiziert: das sind Prototype-Artefakte
des mechanischen Ports. **Fix:** auf Hairline + neutralen Depth-Schatten reduzieren;
Glow nur als Fokusmarker in gedeckelter Stärke. (Der *aktive* Node darf leuchten —
aber gedimmt.)
**A.T2 · Token-Drift in der eigenen Datei** — 18+ `rgba(201,184,150,…)`-Literale, Magic
`#d8d2c2` (selected state, `:93`) · **medium / S–M** — lokale `--gold-dim/-fnt/-line`-Stufen
anlegen. **A.T3** · `chron-ring-pulse` (3 s infinite) und `chron-caret-blink` (1 s) sind
schneller als die filmische Eigenvorgabe — drosseln oder an Interaktion binden
(low / S, proposal).

### A.1 — Home/Hub

- **Cyan-Glow auf Cogitator-Dot** — `45-bottom-console.css:50` (`box-shadow: 0 0 6px var(--cl-cyan)`)
  · S2/S17 · **high / S** · widerspricht den eigenen Kommentaren in `50-hub.css` („no cyan halo, no bloom"). Fix: Glow raus.
- **BottomConsole-Cards = `.c-glass` + `.c-corners`** — `BottomConsole.tsx:99` · S7/S8/S11 · **high / M** · → A.Q2; Ziel: Hairline-Plate.
- **GhostReadout + LiveTelemetry + FloatingCoord = Pseudo-Telemetrie ohne Datenquelle**
  — `components/chrono/GhostReadout.tsx`, `LiveTelemetry.tsx`, `page.tsx:21-101` · S18 ·
  **high / M** · proposal: entfernen oder auf 1–2 statische Zeilen mit echtem Inhalt
  reduzieren (z. B. echter Record-Count, letzter Ingest — vgl. Do/Don't „Status &
  Telemetrie" auf `/lab/design`).
- **MainAuspex-RadialGradient-Glow** — `MainAuspex.tsx:59-63` · S2 · **medium / S** ·
  Glow-Aura hinter der Disc entfernen, Strokes reichen. (Gleiche Korrektur in
  `CornerAuspex.tsx:73-77`.)
- **Chevron-Drop-Shadow** — `50-hub.css:267` · S2 · **medium / S**.
- **Suchfeld-Hairline cyan → gold** bei Migration — `50-hub.css:347-373` · low / S.
- Verifiziert-als-ok: die `//`-Eyebrows des Hubs sind funktionale Archiv-Labels, kein
  S14 (Finding dazu wurde widerlegt); Scroll-Snap-Architektur bewusst (nur Doku-Notiz).

### A.2 — Archive (BOOKS + Toggle)

- **Empty-States tragen `.c-glass .c-corners`** — `archive/page.tsx:206,210` · S7/S8 ·
  **high / S** · Fix: Serif-italic auf Void + optionale Hairline (Muster `.catalogue-row__note`).
- **Toggle-Pill mit `backdrop-filter: blur(8px)`** — `61-browse.css:610-613` · S8 ·
  **medium / S** · Timeline-Original (`.chron-mode-toggle .pill`) hat null Blur — direkt portierbar.
- **Suggest-Popover + FilterSelect-Liste: breite Soft-Shadows** — `61-browse.css:119-120,286` ·
  S11 · **medium / S** · Schatten raus, Hairline + dunklerer Grund tragen die Tiefe.
- FilterSelect-Hover ohne Text-Farbantwort auf der Gold-Surface (`:529-531`) und
  Mobile-Wrapping der Controls (`:457-476`) → **ui-backlog** (Kosmetik).
- Empty-Copy nicht in Haus-Stimme („No books in the database yet" vs. „EX TENEBRIS
  COGNITIO"-Register der Seite) → **ui-backlog**.

### A.3 — Podcasts

- **HUD-Trio (GhostReadout/AuspexSweep/FloatingCoord) doppelt auf Index UND Episoden-Detail**
  — `podcasts/page.tsx:84-95`, `[slug]/page.tsx:100-111` · **medium / M** · proposal:
  Detail-Seite auf Masthead + Toggle reduzieren.
- **Gold-Wert weicht von Timeline ab** (`#c9a65a`-Familie) — Teil von A.Q1.
- Filter-UI rendert auch bei trivialem Datensatz (1 Show / 1 Kind) → **ui-backlog**.
- Widerlegt u. a.: Masthead-Gold-Glow (identisches Muster wie /werke-Benchmark),
  Card-Grid-Verdacht (folgt bewusst der Katalog-Disziplin).

### A.4 — Compendium

- ~~**Cyan-Halo auf Hero-Heading** — `66-compendium.css:140` (`0 0 32px rgba(156,230,255,.18)`)
  · S2 · **medium / S** · nur den schwarzen Legibility-Shadow behalten; Eyebrow (`:127`)
  hat ihn schon korrekt → Inkonsistenz gleich mit weg.~~
  **→ live umgesetzt (2026-06-11, /compendium):** komplette Teal-Phase abgewickelt
  (Registerwerk-Redesign C2-3, Gold durchgängig); Hero-Shadow jetzt Gold @0.22
  wie die Geschwister-Masten.
- **AuspexSweep-RadialGlow** (`AuspexSweep.tsx:46-53`) + `opacity`-Stapelung (`:84`) ·
  S2 · **medium / S** (Komponente ist Site-weiter Hausstil — Fix in der Komponente,
  wirkt überall).
- **Motion-Timing-Mix** (CSS 180–200 ms vs. HUD-JS 80 ms-Typing/16 s-Sweep) ·
  **medium / M** · proposal: Harmonisierungs-Pass, gilt genauso für /ask + /podcasts.
- Fehlender Film-Grain vs. Benchmark · low / S · proposal.
- Verifiziert-als-gut: HUD-Ausblendung <900px, Serif-Umstellung des Suchfelds.

### A.5 — Ask

- ~~**Komplette Seite läuft in der Cyan-Phase** — 27+ `--cl-cyan`-Instanzen in
  `58-ask-booklist.css`, Hero-Glow `53-ask.css:116-118`, drei hartcodierte
  `color="var(--cl-cyan)"`-Props (`ask/page.tsx:72,87,96`), `ProcessingDots`-Default
  ist Cyan (`ProcessingDots.tsx:13`) · S1/S2 · **high / M** · Fix: mechanische
  Migration cyan→gold (die Komponenten-Defaults sind teils schon Gold — Overrides
  einfach entfernen). /ask ist Launch-Einstiegspunkt → früh restylen.~~
  **→ live umgesetzt (2026-06-11, /ask):** komplettes Befragungsprotokoll-Redesign
  (C2-4 + C3-3) statt nur Farbmigration; `ProcessingDots` + `ProgressDots`
  ersatzlos entfernt (Cogitator-Interstitial bzw. Protocollvm-Rail übernehmen);
  Hero-Glow jetzt Gold @0.22; seiten-scoped Gold-Fokusring.

### A.6 — Map

- **Mechanicus-Theme = Cyan, Astropath = Lila** — `lib/galaxy/themes.ts:15-18` · S1 ·
  **high / M** · Themes auf Timeline-Palette parametrisieren; Hologramm-Charakter über
  Flicker/Scanlines/Vignette halten (die sind verifiziert subtil & ok).
- **EraSwitcher hardcoded `#f0b248` + Rajdhani** — `EraSwitcher.tsx:28-29,43,186` · S13 ·
  **medium / S–M** · auf Theme-System ziehen (Achtung: `t.fontMono` ist heute JetBrains, nicht Plex).
- **HUD-Status-Dot: Glow + Pulse** — `disc/HUD.tsx:40-50` · S2/S18 · **medium / S** ·
  Glow raus, Telemetrie-Inhalte behalten (verifiziert: funktional).
- **Nebula-Farben cyan-stämmig** — `LandmarkLabels.tsx:129`, `GalacticDisc.tsx:118-120` ·
  **medium / M** · Verifier-Einwand übernommen: Steel signalisiert keine Gefahr — Farbwahl
  braucht eine Design-Entscheidung, nicht nur Mapping.
- **TweaksPanel ist ÖFFENTLICH** (nicht dev-only!) — `MapRoot.tsx:73` mountet es
  bedingungslos; nur EditPanel ist admin-gated · **Entscheidung für Philipp:** gewolltes
  Public-Settings-Panel oder gaten?
- CornerOrnament (3 Stile) = bewusste Hologramm-Deko vs. S7 — Design-Entscheidung
  dokumentieren oder subtilere Geometrie (low / S).

### A.7 — Buch-Detail + Book-Overlay (der benannte Altlasten-Kandidat)

Das Overlay ist in besserem Zustand als erwartet — die Klärung der zwei Partials ist
der eigentliche Befund:

- **24- vs. 64-detail-modal.css aufgeklärt:** `64-…` (Brief 131, `.detail-modal-*`) ist
  die aktive Quelle für ALLE In-Context-Modals (buch/fraktion/charakter/welt/person)
  und weitgehend restraint-konform; `24-…` (`.dm-*`) lebt **nur noch fürs
  Audit-Cockpit** `/buch/[slug]/audit`. Die 24er-Slop-Befunde (radiale `--hl`-Halos
  `:155-156`, Crest-Glow `:213`, backdrop-blur `:24-25`) treffen also nur die
  Admin-Fläche. **Fix (medium / M):** 24er aus der globalen Kaskade nehmen und
  audit-kontextualisiert laden (oder explizit als „audit-legacy" kommentieren), damit
  die Verwechslung nicht wieder passiert.
- **BookDetailView-Cover-Panel trägt `.c-glass .c-corners`** — `BookDetailView.tsx:79` ·
  S7 · **medium / M** · inkonsistent mit dem eigenen 64er-Modal; auf plain Panel +
  Hairline umstellen (→ A.Q2).
- **Cyan-Wash-Hovers** — `51-book-detail.css:193,261,334` · **low / S** · auf
  Farbantwort (Text → Gold) reduzieren, wie Benchmark-`media-row`.
- MediaPlayer-Befunde unter A.9 (gleiches Modal-Umfeld).

### A.8 — Entity-Seiten

- Kernbefund ist A.Q1 (drei Paletten; `--cl-bone` vs. Parchment). Die Cyan-Chips/Washes
  der Entity-Familie sind **dokumentierter** Bestand (59-entity.css-Kommentare) — die
  Verifier haben die pauschalen Cyan-Findings deshalb gekippt: das ist eine
  *Migrations*-Frage (Brief A.Q1), kein verstecktes Versehen.
- `63-fraktionen.css:144` nutzt das alte warme Gold für Imperium-Karten — bei
  Token-Konsolidierung mitziehen oder als bewusste Allegorik dokumentieren (low / S).

### A.9 — Chrome + globale States

- **MediaPlayer:** Wave-Bars mit Cyan-drop-shadow idle+playing (`56-media-player.css:268-278`),
  Volume-Thumb mit permanentem `0 0 6px`-Cyan-Glow (`:449,459`), Popover-blur (`:212,314`) ·
  S2/S8 · **medium / S** · Glows raus bzw. auf :hover/:focus beschränken.
- **SiteMenu:** sauber gebaut (inert, Focus-Wrap, Escape — verifiziert); der
  Radial-Veil ist bewusste lokale Wahl (low; Harmonisierung optional, siehe C3-Idee).
- **Fehlendes Root-`error.tsx`/`not-found.tsx`** → als Launch-Blocker unter E.1 geführt.

### A.10 — Nebenflächen (/buecher, /atlas, /ingest)

- **/atlas** trägt das volle Cyan-Glow-Paket (Dot `:44`, Title-Halo `:55`, Readout-Glow
  `:90-93`, Drei-Farb-Pills `:234-270` = S11). Admin-gated + noindex (verifiziert).
  **Entscheidung:** eigenes Admin-Theme dokumentieren (dann nur interne Konsistenz
  fixen: Title-Halo vs. Sub-Shadow) ODER bei der Cyan-Abwicklung mitziehen. Aufwand M.
- **/buecher**: trägt die alte Katalog-Sprache (Cinzel-Heading, AuspexSweep+FloatingCoord-Hero
  `page.tsx:527-547`) und ist **öffentlich, aber nirgends verlinkt** → E.6.
- **/ingest**: HUD-Eyebrow ok als Tooling-Stil; fehlendes Gating/noindex → E.7.

---

## Dimension B — Frontend-Qualität

### B1 · Dead Code (alles verifiziert per Import-Grep)

| Kandidat | Beleg | Aufwand |
|---|---|---|
| `components/timeline/chronicle/*` (10 Dateien, ~56 KB) | nirgends importiert; ChronicleStage ersetzt | S |
| `components/timeline/DetailPanel.tsx` (401 Z.) | `?book=` redirectet seit 138 auf `/buch/` | S |
| `components/timeline/FilterRail.tsx` | nur von toter ChronicleClient referenziert. **Achtung:** lt. Projektgedächtnis bewusst „dormant" behalten (PR #117) — Entscheidung Philipp: Dormanz beenden? | S |
| CSS-Partials `20-timeline-shell`, `22-filter-rail`, `57-chronicle` | in globals.css importiert, keine Konsumenten mehr | S |
| `24-detail-modal.css` | **kein** Dead Code — audit-only (s. A.7), aus globaler Kaskade kontextualisieren | M |
| `components/Aquila.tsx` | 0 Importe | S |
| Phase-1-Tokens (void-*/frost/heresy; aquila bis auf 3 Refs in 32-book-audit) | erzeugen ungenutzte Tailwind-Utilities | S |
| `--hl-glow` Token | 0 aktive Nutzungen | S |
| `map/editor/*` (1.285 Z.) | NICHT tot (Guards vorhanden), aber `React.lazy()`-Kandidat fürs Bundle | M |

`lib/chronicle/roster.ts` bleibt laut Timeline-Page-Kommentar bewusst bis zum
Folge-Brief — gehört in denselben Sweep.

### B2 · CSS-Qualität

- Token-Drift: § A.Q1 + A.T2 (auch 50-hub, 62-podcasts mit Literalen).
- Pills-Duplikation `.audit-pill`/`.sort-pill` vs. `.atlas-statuspill` — visuell identisch,
  zwei Klassen-Sätze (low / S; bei Primitives-Neuaufbau zusammenführen).
- `.pod-readout`/`.cmp-readout` strukturell identisch → gemeinsame Basisklasse (low / M).
- CSS-Pass-1-Folgepunkte (Token-Dedup, motion/mobile, @layer) sind damit teil-adressiert:
  Token-Dedup = A.Q1; motion = B5-Gates; @layer weiterhin offen/optional.

### B3 · Komponenten-Architektur

- **loading.tsx fehlt auf den DB-Routen** — konkret (Nachzügler-Audit): `/timeline`
  (Top-Level-await `loadChronicleTimeline`), **`/compendium` auf LAYOUT-Ebene**
  (`layout.tsx:43` blockiert alle Kinder), `/ask` (bei komplettem Profil), `/buecher`;
  `/map` nur der Konsistenz halber. Nur `/archive` hat eine (CogitatorLoading).
  **high / M** — ein kleiner Brief, CogitatorLoading wiederverwenden.
- searchIndex-Prop an WerkeFilters: ~70–100 KB serialisiert (Verifier hat „massiv"
  auf „normaler Bereich, Optimierungspotential" kalibriert) — low/M, Optionen: Top-N,
  Lazy-Fetch on focus.
- WerkeFilters-`use client`-Grenze könnte tiefer sitzen (low / M, proposal).
- Helpers aus `archive/page.tsx` auslagern; WorkRow inline lassen (Verifier-Korrektur) — low / S.
- Widerlegt: BrowseSearch/HomeSearch-Dopplung (Delegation via Callbacks ist sauber),
  AtlasTable-`use client` (braucht es), Compendium-focus-Fallback (existiert).

### B4 · Next.js-Praxis

- **Route-Segment-Configs fehlen/inkonsistent auf ~11 Routen** (kein
  `revalidate`/`dynamic`/`dynamicParams` deklariert; /buch ohne Strategie-Doku im
  Kontrast zu den dokumentierten Schwester-Routen) · **high / M** · gehört in die
  Caching-Welle (§ D).
- **Metadata-Inventar (Nachzügler GAP1, vollständig):** FEHLT auf `/` (Home!),
  `/compendium` (Overview), `/buch/[slug]` (kein generateMetadata → keine
  OG-Preview pro Buch). Korrekt vorhanden auf: podcasts (beide), ask, timeline,
  buecher, atlas (beide), allen Entity-Routen (Titel) — Entity-Routen aber ohne
  description/OG (medium / S, Muster aus compendium/[category] kopieren).
  @modal-Intercepts brauchen bewusst keine.
- **SiteBackground/Hero-Artworks ohne Preload** — `<link rel="preload">` für die
  3–4 Erstsicht-Bilder (low / S); next/image-Umstieg als größerer Schritt (→ D.6).
- robots/Launch → E.4.
- Widerlegt: `viewport`-Export-Pflicht (Next-15-Pattern, nicht nötig), Motion-Primitives
  als Slop (thematisch korrekt eingesetzt), @modal-ohne-generateStaticParams (konsistent beidseitig).

### B5 · Accessibility-Grundlinie

- **`prefers-reduced-motion`-Lücken (verifiziertes Inventar):** Ken Burns
  (`67:144`), Hub-Drifts 38/53 s (`50-hub:171,181`) + DescentChev (`:271`),
  `mapHoloFlicker` (`55-map:49-54`), ScanLine-Nutzung von `chronoScanV/H`
  (`ScanLine.tsx:43` inline), `chron-caret-blink`/`scroll-hint` (`67:417,225`),
  `tlpFadeSlide/TileRise/Dive` (57 — entfällt, wenn 57 gelöscht wird, s. B1),
  FloatingCoord/WordField/LetterField inline-Animationen. Der globale
  0.001-ms-Fallback in `10-base.css` fängt das meiste *technisch* — aber
  `animation: none` wäre sauberer (`:70`), und die Inline-Style-Animationen der
  Komponenten sind der eigentliche Risiko-Pfad. **high / M** gesamthaft als ein Pass.
- **Kontrast:** `--steel-dim #566070` auf Void ≈ **3.1:1** (< AA 4.5:1) an 8+ Stellen
  der Timeline (mode-toggle-Label, era-pos, approx, art-credit …) · **high / M** ·
  aufhellen (~`#758ba3`) oder Rolle „dekorativ" je Stelle begründen.
- **DetailModal: `inert` fehlt** (SiteMenu hat es) — `DetailModal.tsx:181` · medium / S.
- ProcessingPanel: `aria-busy` ergänzen (aria-live existiert am Stage-Wrapper —
  Verifier-Korrektur) · low / S.
- `.tlp-node`-Fokus (57): entfällt mit B1-Löschung.
- Widerlegt: Alt-Texte auf dekorativen Background-Artworks, Keyframe-Definitionen
  ohne Media-Query (Definition braucht keins — Nutzung zählt).

---

## Dimension D — Concurrency / Last (Ziel: 20+ Nutzer smooth)

Empirie in § D.0. Brief 140 (Backend-Review) wurde von den D-Agents gelesen;
Doppelungen vermieden, Referenzen wo einschlägig.

1. **`/archive` dynamic + ungecacht = der gemessene Engpass** — `archive/page.tsx:73-80`,
   `archive/loader.ts:54-105` · **high / S–M** · `export const revalidate = 3600` +
   Loader cachen. **Verifier-Caveat:** HTML ~1,2–1,8 MB nähert sich dem 2-MB-Limit des
   Data-Cache — ggf. nur ISR ohne `cachedRead`-Payload, oder Payload schlanken
   (= Brief-140 C3-2, jetzt mit Messwert).
2. **`/buch/[slug]` ohne SSG/ISR** — 889 Bücher, 1+7-Query-Fanout pro Cold-Hit ·
   **high / M** · `generateStaticParams` + `dynamicParams: true` analog Entity-Routen;
   **`listBookSlugs()` existiert noch nicht** (Verifier-Korrektur — `listEntityIds()`
   kennt kein `book`), eine kleine neue Query.
3. **`/ask` lädt alle Bücher pro Antwort neu** — `ask/page.tsx:55` ·
   **high / S (Ein-Zeilen-Fix):** `cacheBooks: true` übergeben (Flag + Cache existieren
   in `recommend.ts` bereits). Verifier-Korrektur: es sind 2 Queries pro Lauf, nicht 8 —
   der Fix bleibt derselbe.
4. **`READ_CACHE_TTL` 300 s → 3600 s** — `db-cache.ts:36` · medium / S · Daten ändern
   sich ~wöchentlich; 300 s heißt 288 Cold-Fills/Tag/Key, und der /compendium-Fill
   kostet gemessen Minuten. Langfristig `revalidateTag` nach Apply-Läufen (liegt bereit;
   Brief 140 C3-4).
5. **Route-Segment-Configs explizit machen** (siehe B4) inkl. Abwägung
   `/compendium/[category]`: 5 statische Kategorien per `generateStaticParams` bauen
   (OG-Tags vorgebacken) vs. Brief-129-Entscheid — gegen Build-Timeout-Historie testen.
6. **Client/Assets:** Artworks laufen als rohes `backgroundImage` (CinematicView
   `:449,472`, IndexView `:201`, SiteBackground `:59`) — kein lazy/srcset; erste Era
   76–235 KB. Kurzfristig: Preload-Link für die erste Era + Erstsicht-Bilder;
   mittelfristig next/image-Pass. `coverRef` ohne Fallback (leerer/typo-String ⇒
   dunkles Artwork ohne Fehler) — low / S. Map-Editor-Panels via `React.lazy` (B1).
   Pool `max:5` ist **richtig kalibriert** (bestätigt; nicht anrühren — der Hebel ist
   Caching).
7. **loading.tsx-Lücken** (B3) sind unter Last UX-kritisch: gemessene Cold-Fills von
   Sekunden bis Minuten treffen heute auf leere Screens.
8. Klein: Podcast-Show-Loader 3 sequenzielle Queries (low, bei 4 Shows egal);
   Entity-Loader ohne LIMIT (Brief 140 A3-011, Radar für 5×-Wachstum);
   `loadBrowseBooks`/`loadAskBooks` Query-Duplikation (Refactor-Kandidat).

---

## Dimension E — Freier Blick

1. **EntityBackLink führt Normalbesucher in 404** — `entity/types.ts:39-45`,
   `EntityBackLink.tsx:12-19`: Breadcrumbs aller Entity-Seiten zeigen auf admin-gated
   `/atlas/*`-Decks · **high / S** · auf `/compendium/<kategorie>` umbiegen.
2. **Kein Root-`error.tsx` / `not-found.tsx` / `global-error.tsx`** · **high / M** ·
   bei DB-Störung oder Tippfehler-URL bricht die Immersion auf Next-Default. Fix: drei
   Dateien im Haus-Stil („ARCHIVE FRAGMENT LOST"), Tokens/Muster von `/lab/design`.
3. **Kein Favicon, kein OG-Image** — `openGraph` ohne `images`, `public/` ohne
   favicon.* · **high / M** · für Reddit-Launch zwingend; `logo_cl_v2.svg` existiert
   als Quelle.
4. **robots: noindex hart codiert, keine Launch-Checkliste** — `layout.tsx:55` ·
   **medium / S** · dokumentierte Checkliste (robots→true, `NEXT_PUBLIC_SITE_URL`,
   sitemap/robots.txt), ggf. ENV-gesteuert.
5. **Metadata-Lücken** — Home, /compendium, /buch/[slug] (Details in B4).
6. **`/buecher` ist öffentlich, voll funktional, aber unverlinkt und redundant zu
   `/archive`** · **medium / Entscheidung** · einstellen (Redirect), gaten oder als
   Alternate-View ins Menü.
7. **`/ingest` ist öffentlich und ungated** (proxy.ts deckt nur /atlas + /map-Edit),
   ohne eigenes noindex · **medium / S** · gaten oder zumindest robots-Deklaration.
8. **`public/lab/*`-Prototypen sind unter `/lab/...` öffentlich erreichbar** ·
   low / S · verschieben (design-export-Muster) oder noindex-Meta + README.
9. **HomeExplore „SOON"-Marker semantisch falsch** — Characters existieren längst
   (unter /compendium/charaktere) · **medium / S** · auf Compendium verlinken oder
   Zeilen entfernen (Verifier-Korrektur: keine neue /charakter-Liste bauen).
10. **Home-Subtext zu vage für Reddit-Cold-Start** (proposal, medium / S):
    Value-Prop mit Handlung („Find your next …") statt Abstraktum; konkreter
    Formulierungsvorschlag im Finding.
11. Klein: @modal-README (low / S); `as unknown`-Typing der Raw-SQL — **27 Stellen**
    (Verifier-Korrektur: nicht 152), konzentriert in `atlas/queries.ts`, dokumentieren
    oder mittelfristig typisieren; Ingest-Eyebrow als Tooling-Stil ok.

---

## Vorschläge (klar als Vorschläge markiert — keine Defekte)

### C1 · In-Universe-Archiv weitergedacht (6)

1. **Folio-Nummern & Imprimatur-Zeilen** als stilles Seiten-Chrome (S) — Mono-Mikrozeile
   („FOLIO 047 · SEALED · M42.347") als wiederkehrendes Archiv-Signal; Footer-Echo.
2. **Siegel-/Stempel-Rahmen** um Haupt-Content-Blöcke (M) — fast-eckige Hairline mit
   minimalen Ecken-Nicks, Steel/Gold ~0.22 — KEIN Corner-Bracket-Revival, sondern
   Buchbinder-Geometrie.
3. **Marginalia als Hover-State** (M) — kleine Mono-Randnotiz faded bei Hover an
   Cards/Rows ein („Heresy Era · Vol. 3"), wie eine Archivarin, die nachträgt.
4. **Karten-Kartuschen** für Sektor-/Welt-Navigation (M) — verschachtelte
   Hairline-Rechtecke + Serif-Titel + Mono-Koordinate.
5. **Plattenästhetik** statt flacher Cards (L) — gestapelte „Dossier-Platten" mit
   Hairline-Offset statt Schatten.
6. **Void-Grain-Übergangsblende** zwischen Routen (M) — 0.2–0.4 s Void+Grain als
   site-weite Übergangssprache (das Timeline-Vokabular über Routen-Grenzen).

### C2 · Typografie & Editorial-Komposition (6)

1. **Home als Titelblatt** (M) — asymmetrisches Frontispiz: große linksbündige
   Serif-Komposition unten links, Auspex als diffuses Element nach oben rechts
   (Opacity 0.08–0.12), Untertitel in die rechte Spalte.
2. **Buch-Detail als Dossier-Doppelseite** (M) — kursive Jahresmarke (M31.014, 36–48 px)
   am Cover-Panel, große vertikale Mono-Initiale statt Eyebrow-Zeile.
3. **Compendium als Registerwerk** (S) — stilisierte Seitenzahlen („pp. 001–042"),
   vertikale Hairlines als Spaltentrenner, Pfeil statt „View all"-CTA.
4. **Ask als Befragungsprotokoll** (M) — große Mono-Fragenummern (52–72 px) als
   Initialen-Zierde, Antworten als 2-spaltige Ballot-Matrix.
5. **Negativraum-Regel** (L) — 40–50 % Air pro Kompositionseinheit; kleinere Titel,
   größere Abstände: der Unterschied zwischen Tech-Site und verlegtem Werk.
6. **Großzahlen als Hintergrund-Marquee** (L) — transparente Era-Marken (M31…, 120–160 px,
   Opacity 0.08) als archäologische Schicht hinter Inhalten.

### C3 · Surface-Transformationen (6)

1. **Book-Overlay cinematic** (M) — Veil-Gradient-Stack statt backdrop-blur, Gold-Label
   statt Cyan-Hover, Cormorant-19px-Lesetext, 0.6-s-Crossfade.
2. **Archive als Cinematic Row-Table** (L) — Century-Groups + row-line-Grid aus dem
   Timeline-Index (Serif 22 / Mono 13 / Italic-Snippet), Era-Band als floating Pill.
3. **Ask-ResultCard als Dossier** (M) — Rank-Mono-Gold + d-kicker/d-title/d-note-Form +
   Begründungen als Hairline-Chips.
4. **SiteMenu als Cinematic Scrollwork** (M) — Veil-Stack + dezentes Starfield hinter
   dem Overlay, Hairline-Separatoren, Gold-Mono Head/Foot.
5. **Archive-Toggle als Beacon** (S) — größer, Gold-invertierter Aktiv-Tab; (den im
   Ideen-Text vorgeschlagenen Hover-Glow gegen A.T1-Regel deckeln).
6. **`68-cinematic-surfaces.css` / Token-Bridge** (S) — die Cinematic-Typoskala +
   Hairline-/Veil-Vokabeln als globale Utilities — deckungsgleich mit A.Q1, als
   dessen Umsetzungsform zu lesen.

Drei C-Ideen sind als gebaute Skizzen auf `/lab/design` § 07 zu sehen
(Siegel/Imprimatur, Initiale/Drop-Cap, Marginalie mit source/confidence-Apparat —
letztere macht die `source_kind`/`confidence`-Spalten der DB endlich sichtbar).

---

## Deliverable 3 — Styleguide `/lab/design`

Neu, additiv, statisch (○ im Build), kein DB-Zugriff, keine Client-Komponenten:
`src/app/lab/design/page.tsx` + `design.css` (alles unter `.lds`-Scope; kein
bestehendes Partial angefasst — die Benchmark-Werte sind verbatim aus `.chron`
gespiegelt, ihre Token-Promotion bleibt Sache von A.Q1).

Inhalt: **01** Palette (10 Swatches mit Rollen) · **02** Typoskala (Serif-Leiter
Display→Note, Mono-Leiter 13→10, Cinzel-/Grotesk-Sonderrollen) · **03** Fläche & Raum
(Void/Plate/Veil-Demos, Hairline-Regeln, Radius 0–3 px, Glow-nur-als-Fokusmarker-Regel)
· **04** Kern-Bausteine, je gebaut: Button (3 Zustände), Pill-Toggle, Chip & Tag,
Katalogkarte, Modal-Kopf (Dossier), Formularfeld (Unterstrich-Stil), Nav-Element,
Index-Liste/Tabelle (inkl. Open-State) · **05** Motion-Regeln (Timings + Verbotsliste)
· **06** Do/Don't — 8 Paare, die DON'T-Seite repliziert bewusst die Slop-Patterns
(Cyan-Glow-Link, Corner-Brackets, Glass-Panel, Gradient-Headline, Emoji-Icons,
Default-Card, Amber-Halo, Blink-Telemetrie) · **07** Vorschlags-Bausteine (klar
badged als VORSCHLAG). `tsc` und `eslint` grün; Production-Build erfolgreich.

---

## Widerlegte Findings (49) — was der adversariale Filter aussortiert hat

Häufigste Todesursachen, als Kalibrierhilfe für künftige Reviews:

- **Haus-Stil-False-Positives (~20):** Mono-Eyebrows als „S14", GhostReadout auf
  Archive/Podcasts als „S18", dunkle Legibility-Text-Shadows als „Glow", Card-Reihen
  als „S9" — alle nach Caveat-Prüfung gekippt (bewusster, dokumentierter Bestand).
- **Falsche Datei/Stelle (~8):** z. B. „Glassmorphism in 31-catalogue" (existiert
  nicht), backdrop-filter in /ingest (sitzt in /atlas), 24er-Modal-Kritik gegen die
  falsche (nicht geladene) Fläche.
- **Bereits gelöst (~10):** Compendium-focus-Fallback, Podcast-Empty-State,
  aria-live am Ask-Stage, @modal-Doku-Kommentare, leeres generateStaticParams als
  valides ISR-Pattern, Entity-generateMetadata (vorhanden).
- **Übertreibungen, per Korrektur einkalibriert (in den 35 „adjusted"):** „152×
  `as unknown`" → 27; „MASSIVE Props-Payload" → 70–100 KB normal; „8 Queries" → 2;
  „TweaksPanel dev-only" → öffentlich (wurde dadurch ein *schärferes* Finding).

## Grenzen / Ungeprüftes

- **Kein Browser, keine Screenshots** (Auftrag): alles aus Code/CSS-Lektüre — visuelle
  Wirkung (z. B. ob ein 0.18-Glow wahrnehmbar stört) bleibt Philipps Auge vorbehalten.
- **Lokale Probe ≠ Vercel-Topologie** (1 Prozess/Pool vs. N Lambdas gegen Pooler):
  Richtung belastbar, absolute Zahlen nicht. Kein Test gegen Produktion.
- `/atlas`, `/ingest`, `/buch/[slug]/audit` als Admin-Flächen behandelt (Restyle dort
  = Entscheidung, nicht Defekt).
- Print-Styles, echte Screen-Reader-Durchläufe, i18n-Strategie über den
  Sprachmix-Befund hinaus: nicht geprüft.
- Betriebsnotiz: der laufende Dev-Server (Hintergrund-Task einer früheren Session)
  wurde während der Probe versehentlich mit beendet; danach nach Memory-Muster sauber
  neu gestartet (ein Prozess, frisches `.next`, läuft auf diesem Review-Branch — 200 OK).

## Nachtrag 2026-06-11 — Feedback-Runde Philipp (gleiche Branch, nach PR-Eröffnung)

Maintainer-Feedback auf `/lab/design` eingearbeitet plus vier Dummy-Beispielseiten:

1. **Katalogkarte rahmenlos:** Border-Kasten entfernt (Borders bleiben bei Buttons ok);
   die Karte trägt jetzt nur eine Wash-Fläche + eine **Bodenlinie, die beidseitig
   ausläuft** — dieselbe Terminus-Linie wie im Cogitator-Loading
   (`.cogitator-loading__scan`, 65-loading.css), das Philipp explizit als
   Positiv-Referenz benannt hat.
2. **Cogitator-Loading als Positiv-Beispiel** in den Styleguide aufgenommen
   (Baustein in § 04 + Terminus-Linie in § 03).
3. **Initiale (Drop Cap) + Marginalie angenommen:** von § 07 (Vorschläge) zu den
   Kern-Bausteinen (§ 04) befördert; § 07 behält nur noch Siegel/Imprimatur.
4. **Vier Beispielseiten** (nur unter `/lab`, Dummy-Daten, statisch, kein DB-Zugriff):
   `/lab/home_example` (Titelblatt/Frontispiz, C2-1 + Großzahl-Schicht C2-6 +
   Marginalien-Hover C1-3), `/lab/archive_example` (Cinematic Row-Table, C3-2),
   `/lab/compendium_example` (Registerwerk, C2-3), `/lab/ask_example`
   (Befragungsprotokoll C2-4 + Rank-Dossier C3-3 + Cogitator-Interstitial).
   Geteilte Hülle + CSS unter `src/app/lab/_example/` (`.lex`-Scope, additiv;
   Folio-Chrome + Imprimatur-Fuß aus Idee C1-1). `tsc` + `eslint` grün; Dev-Server
   sauber neu gestartet, beide Stichproben-Routen 200.

## Nachtrag 2026-06-11 (2) — Beispielseiten-Rework nach zweitem Feedback

Philipps Befund zur ersten Fassung: Seiten wirken zusammengesteckt, **Hintergründe
der Ausgangsseiten fehlen** — gewünscht ist „im Großen und Ganzen wie die
Ausgangsseite, nur mit den neuen Design-Elementen". Konsequenz: kompletter
Neuaufbau der vier Seiten auf dem **echten Produktions-Skelett**, statt einer
freistehenden Papier-Komposition:

- **Echte Backdrops wiederverwendet:** `SiteBackground` (hub/scriptorium/oracle
  + Vignette + Grain) bzw. fürs Archiv das fixe `books.webp`+Fade-Paar aus
  31-catalogue.css; dazu der produktive Fade-to-void (`body:has(main.lex)
  .site-bg::after`, Stops 1:1 aus 53-ask/66-compendium bzw. 50-hub) und der
  echte `<ScrollScrim>`.
- **Echte Skelette:** Masthead mit bei 320px geparktem Cinzel-Titel
  (`clamp(520px,60vh,700px)`), Body um −80px hochgezogen; Home als drei
  100dvh-Acts mit Scroll-Snap (`html:has(main.lexh)`), inkl. `MainAuspex`-Discs,
  `HeroScrollCue`, `GhostReadout`/`FloatingCoord`/`AuspexSweep` — alle über ihre
  `accent`/`color`-Props auf Gold gestellt (Komponenten unangetastet).
- **Neue Sprache obendrauf:** Terminus-Linie als Titel-Schmuck und als
  Zeilen-/Fuß-Trenner, rahmenlose Wash-Karten mit Terminus-Bodenlinie
  (Türen, Ballot, Runner), Initiale + Marginalien-Apparat (Home-Praefatio,
  Archiv-Dossier, Compendium-Fußnote), römische Ordnung (Registry-Zeilen,
  QVAESTIO-Ziffer, Protokoll-Marken), ehrliche Status-Zeilen, Gold statt Cyan
  durchgängig (auch Compendium: Teal → Gold für die eine Akzentsprache).
- Alte Eigen-Chrome-Leiste ersetzt durch diskreten `LAB·SPECIMEN`-Switcher oben
  links (fixed, unterhalb Burger-z); Imprimatur-Fuß (C1-1) bleibt als Baustein.
- `tsc` + `eslint` grün; Dev-Server lief weiter (HMR), Stichproben-Route 200.

## Nachtrag 2026-06-11 (3) — Live-Restyle-Session (Branch `codex/product-live-restyle`)

Direktauftrag Philipp: das Design der vier Beispielseiten auf die Live-Seiten
portieren (nur Markup + CSS; URL-Verträge, Loader, Datenfluss, Client-Logik
unverändert). Lab-Dateien sind Referenz, werden nicht angefasst. Eine Seite =
ein Commit; /compact nur an Seitengrenzen direkt nach dem Commit. Diese
Checkliste ist der Wiedereinstiegspunkt nach jedem /compact:

- [x] **1 · /ask** — Befragungsprotokoll-Design übernehmen; **Lesbarkeit:
  Protocollum-Segment deutlich größerer Text als im Beispiel**. Commit.
  *Erledigt 2026-06-11: QVAESTIO-Ziffer + Ballot ◇→◆ (QuestionCard), Protocollvm-
  Rail mit römischen Marken (eine Typo-Stufe größer als Lab: Fragen 17px serif,
  Status 12px mono), Cogitator-Interstitial (ProcessingPanel), Verdikt als
  Rank-Dossier + Runner-Karten (ResultCard), Gold-HUD, Terminus-Masthead,
  Imprimatur-Fuß. Neu: `42-lex-primitives.css` (.lx-*-Bausteine, geteilt),
  `ArchiveFooter`, `lib/roman.ts`. Entfernt: ProgressDots, ProcessingDots
  (verwaist). tsc + eslint grün.*
- [x] **2 · /compendium** — Registerwerk-Design 1:1 übertragen. Commit.
  *Erledigt 2026-06-11: Layout + Overview + Category-Directory komplett
  Teal→Gold (Hero-Rule, Terminus-Nav, Türen als rahmenlose Wash-Karten mit
  Terminus-Bodenlinie, REGISTRVM-Eyebrows mit echten count-abgeleiteten
  pp.-Bereichen, Kurations-Marginalie via .lx-apparatus, Terminus-Row-Trenner
  im Directory, Browse-Controls gold-skinned, Imprimatur-Fuß im Layout,
  seiten-scoped Gold-Fokusring). tsc + eslint grün.*
- [ ] **3 · /archive** — Cinematic Row-Table übernehmen, mit Abweichungen:
  (a) in geöffneter Row die Zeile „REF M42.347 SOURCE · MANUAL CONFIDENCE ·
  HIGH SCRIBE · PH. LEXICANVS" entfernen; (b) keine M31-Sortierung/Gruppierung
  (nicht alle Bücher haben M-Daten); (c) Suche zentral unter den Text unter
  „WORKS" setzen. Commit.
- [ ] **4 · /home** — Titelblatt-Design übernehmen, mit Abweichungen:
  (a) „What can I do here"-Sektion: unter „889 novels" auch Podcast-Episoden
  und Podcasts mit Anzahl aufführen; (b) die große Initiale „A" fügt sich
  nicht ein (Farbe/Schriftart) — anpassen; (c) Element „REF M42.347 SOURCE ·
  MANUAL CONFIDENCE · HIGH SCRIBE · PH. LEXICANVS" entfernen. Commit.
- [ ] **5 · Popups** — Buch-/Fraktion-/Entity-Detail-Modals (64-detail-modal,
  BookDetailView) aufs neue Design umbauen. Commit.
- [ ] **6 · Abschluss** — tsc + eslint, Dev-Server sauber neu starten, max.
  ein Curl-Check, push, PR (kein Co-Author, kein Generated-Footer).

Regeln: Gold statt Cyan, Terminus-Linien, rahmenlose Karten,
Initiale/Marginalie wie in den Beispielen. Umgesetzte Review-Punkte oben im
Report ~~durchstreichen~~ + „→ live umgesetzt (Datum, Seite)" markieren.

## Brief-Kandidaten für Cowork (geschnitten nach Abhängigkeit)

1. **Token-Konsolidierung + Primitives-Ablöse** (A.Q1–A.Q4, A.T, B2) — Fundament,
   zuerst. Inkl. Benchmark-Selbst-Putz.
2. **Caching-/Rendering-Welle Frontend** (D.1–D.5, B4-Configs, B3-loading.tsx) — der
   messbar größte Nutzwert für den Launch; größtenteils S/M-Fixes.
3. **Launch-Hygiene** (E.1–E.5, E.7: Error-Pages, Favicon/OG, Metadata, robots-Checkliste,
   EntityBackLink, /ingest-Gating) — klein, aber Reddit-kritisch.
4. **Dead-Code-Sweep** (B1, inkl. roster.ts-Retirement + FilterRail-Dormanz-Entscheid).
5. **Surface-Restyles in Wellen** (A.1–A.10 + passende C-Ideen; sinnvolle Reihenfolge:
   Ask → Book-Overlay/Detail → Home → Archive-Feinschliff → Map-Themes), jeweils gegen
   `/lab/design` als Referenz.
6. **A11y-Pass** (B5: reduced-motion-Inventar, Kontrast, inert).
7. **Entscheidungen für Philipp** (kein Brief, ein Nicken): /buecher-Zukunft,
   TweaksPanel öffentlich?, /atlas-Designsystem (eigenes Admin-Theme ja/nein),
   FilterRail-Dormanz beenden?
