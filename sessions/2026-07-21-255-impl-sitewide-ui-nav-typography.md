---
session: 2026-07-21-255
role: implementer
date: 2026-07-21
status: complete
slug: sitewide-ui-nav-typography
parent: none              # maintainer-prompted launch session (serial launch mode)
links: []
commits:
  - 784d36c
  - 8409605
  - b9cdb7b
  - 32ab09e
  - 4f03fd6
---

# Seitenweite UI: Nav-Rework, Popup-Dedup, /now-Entschlackung, Typografie-System

## Summary

Vier Blöcke in einem Product-PR: die Primärnavigation ist jetzt eine flache,
sichtbar gruppierte IA mit beschreibenden Sublabels (Cartographer führt als
USP), das Detail-Popup hat nur noch „‹ Return", /now ist entschlackt (Era in
den Answer-Act gemerged, Tier-Glyphen weg), und die Typografie hat eine echte
Rollen-Basis: geteilter `.lx-hero__*`-Masthead-Voice-Stack + `--fs-edition`
statt sechs driftender Kopien, dazu ein Token-Sweep über die Lese-Surfaces
mit dokumentierter Rollen-Tabelle in `00-tokens.css`.

## What I did

**Block 1 — Popup (784d36c)**
- `src/components/shared/DetailModal.tsx` — „Close"-Button + `__bar-end` raus;
  „‹ Return" (trägt `data-detail-modal-close`, Initial-Fokus) ist die einzige
  Dismiss-Affordanz; Escape/Backdrop unverändert.
- `src/app/styles/64-detail-modal.css` — `__close`/`__bar-end`-Regeln entfernt.

**Block 2 — /now (8409605)**
- `src/app/now/page.tsx` — `now-answer__frame`-Absatz raus; stattdessen (bei
  vorhandener Era) `now-answer__era`: Era-Name (Display, kompakt) →
  `era.intro` (`lx-prose`) → Chronicle-Button. Die eigene „The Current
  Era"-Sektion ist gelöscht. `TIER_MARK` + Tier-Span vor den Event-Daten raus
  (die Chronicle behält ihre eigenen Glyphen in `cinematic/shared`).
- `src/app/styles/57-now.css` — `.now-era*` raus, `.now-answer__era*` neu,
  `.now-event__tier` raus.

**Block 3 — Navigation (b9cdb7b)**
- `src/components/chrome/navEntries.ts` — NEU: die eine Quelle der Nav-IA
  (drei Gruppen: Explore = Cartographer/Chronicle/Status Imperialis,
  The Library = Archive/Compendium, Services = Curator/Librarium) inkl.
  Sublabels; Rail und Burger konsumieren sie gemeinsam.
- `src/components/chrome/SiteNav.tsx` — gruppiertes Rail, Numerale laufen
  durch; pro Eintrag Sublabel-Zeile; Gruppen als nackte Hairlines.
- `src/components/chrome/SiteMenu.tsx` — Home + drei gelabelte Gruppen mit
  Desc-Zeilen; Stagger über inline `--sm-i`-Var (die alte nth-child-Leiter
  deckte nur 6 von 8 Einträgen).
- `src/app/styles/46-site-nav.css` / `43-site-menu.css` — Zweizeilen-Layout,
  Sublabel-/Gruppenlabel-Stile; Overlay scrollsicher (margin-auto-Zentrierung
  statt `place-items:center`, Grain auf `fixed`).
- `src/components/home/HomeExplore.tsx` — „Discover More" spiegelt die neue
  Ordnung (Cartographer zuerst), Librarium-Zeile ergänzt (XII, Gloss
  „CENSVS · ARCHIVI").

**Block 4a — Masthead-Primitive (32ab09e)**
- `src/app/styles/42-lex-primitives.css` — `.lx-hero__over/__heading/
  __edition/__cue` als geteilter Voice-Stack unter der House-Fold-Rule;
  Heading-Größe via `--hero-size`/`--hero-lh` Custom-Properties vom
  Surface-Container (umgeht den globals.css-Kaskaden-Contract komplett).
- `src/app/styles/00-tokens.css` — `--fs-edition: 20px` (Editionszeilen-Rolle).
- Refactor auf die Primitives: `31-catalogue` (+ Templates /archive,
  /archive/podcasts, Podcast-Show mit `--show`-Modifier als reine
  Var-Zuweisung), `50-hub` + `page.tsx`, `53-ask` (Landing-Mast in
  `AskClient.tsx`; Toolhead-Sub nur auf den Token — Toolhead ist bewusst
  animationslos), `57-now`, `60-statistics`, `66-compendium`;
  `62-podcasts`-Show-Overrides auf `--hero-size` umgestellt.

**Block 4b+4c — Token-Sweep + Doku (4f03fd6)**
- ~25 hartkodierte Größen auf die Leitern gesnappt (|Δ| ≤ 1px), u.a.:
  Register-Descs 17→`read-xs`, quiet-Links 17.5/18.5→`read-sm`,
  Ask-Optionen 20→`read-lg`, Body-Caps-Controls 14→`label-lg` (61-browse ×5),
  Body-Caps-Rubriken 13→`label-md` (lx-foot__triad, Appendix-Heads,
  Modal-Return), `lx-sect` 14.5→`label-xl`, Mono-Telemetrie (Vox 11.5→11,
  Chart-Ticks 11/10.5→`label-2xs`, Art-Credit 9→10 = Ladder-Floor),
  `lx-initial`/Synopsis-First-Line→`read-xs`, Katalog-Jahr 14.5→`label-xl`.
- Bewusst literal geblieben (optisch, teils jetzt kommentiert): Display-
  Register-Titel (27/24/23/22/28/40/16), Glyphen (Chevrons/Pfeile/Play),
  Map-Wordmark.
- `00-tokens.css` — Rollen-Tabelle als Kommentar: Rolle → Klasse/Token, plus
  die dokumentierten Ausnahmen; Label-Leiter deckt jetzt ausdrücklich beide
  Caps-Stimmen (Mono UND Cardo-Body-Caps) ab.

## Decisions I made

- **Nav flach statt Hub** (mit Philipp per Rückfrage entschieden): NN/g-Lage
  ist eindeutig — 7 sichtbare Einträge sind kein Problem (7±2 gilt nicht für
  Menüs), Verstecken eine Ebene tiefer kostet ~50% Auffindbarkeit, Marken-
  Labels brauchen sichtbare Sublabels. Cartographer führt die Nav als USP an
  und ist in keiner Gruppe „mitgebundelt"; Curator ist laut Philipp nicht
  mehr das Kernfeature.
- **Ask-Landing voll auf `lx-hero`** (Eyebrow damit von Mono auf Body-Caps,
  Sub von clamp(18–20.5) auf 20): genau die Familien-Normalisierung, die
  beauftragt war. Der **Toolhead** dagegen bekam nur den Größen-Token — seine
  Zeilen sind bewusst ohne Entrance-Animation, volle Primitive hätten ihm
  eine verpasst.
- **`--hero-size`-Custom-Property statt Selektor-Overrides** für die
  per-Surface-Heading-Clamps: Route-Partials setzen nur noch Variablen auf
  eigenen Selektoren — kein Konflikt-Property auf fremden Selektoren, der
  Kaskaden-Contract in `globals.css` bleibt formal unberührt.
- **Snapping-Politik**: getauscht nur bei Rollen-Match und |Δ| ≤ 1px;
  Display-Registertitel und Glyphen bleiben dokumentierte optische Größen
  (keine Leiter erzwungen, wo Dichte-Tuning der Punkt ist).
- **Burger-Overlay scrollsicher** gemacht (margin-auto-Zentrierung): 8 Einträge
  + Desc-Zeilen + 3 Gruppenlabels können kleine Phones überlaufen; vorher
  hätte `place-items:center` oben abgeschnitten.

## Verification

- `npx tsc --noEmit` — pass.
- `npm run lint` (eslint) — pass.
- Dev-Server frisch gestartet (keine Alt-Prozesse), `GET / 200`, Logs sauber —
  der eine Is-it-up-Check laut Arbeitsmodus; Browser-Eyeballing macht Philipp
  (Empfehlung: Rail ≥1180px + Burger <1180px, /now, Popup Book+Entity,
  Mastheads auf Home / /archive / Podcast-Show / /ask / /ask/faction /
  /compendium / /statistics, Ask-Fragebogen-Optionen).
- Nicht gelaufen: kein `brain:lint` nötig (kein `brain/**` im PR).

## Open issues / blockers

- Keine Blocker. Zwei bewusste Rest-Spannungen für's Eyeballing:
  Rail-Sublabels sind permanent sichtbar (Fallback: nur hover/`is-current`,
  wenn zu laut über der Map); `catalogue-row__byline` (18) vs. Register-Descs
  (16.5) — falls das als Inkonsistenz auffällt, wäre Byline→`read-xs` der
  nächste Schritt.

## For next session

- Cue-Delay-Mikrodrift ist normalisiert (1.15→1.2s auf Hub/Katalog via
  `lx-hero__cue`) — falls die Overture irgendwo hakt, dort ansetzen.
- 55-map / 67-chronicle-cinematic besitzen weiter eigene Skalen (bewusst aus
  dem Sweep gelassen); ein eigener Instrumenten-Pass wäre der Ort, sie an die
  Leitern zu koppeln.
- W4 (Confidence-Wording-Konsolidierung) steht weiter im Backlog —
  `CONFIDENCE_WORD` in `now/page.tsx` blieb unangetastet.

## References

- NN/g: Menu-Design Checklist; „Hamburger Menus and Hidden Navigation Hurt
  UX Metrics"; „Flat vs. Deep Website Hierarchies"; „Avoid Format-Based
  Primary Navigation"; „Left-Side Vertical Navigation on Desktop";
  „The Magical Number 7 and UX"; „Category Names Suck".
