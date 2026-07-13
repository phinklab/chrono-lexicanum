---
session: 2026-07-13-209
role: implementer
date: 2026-07-13
status: complete
slug: launch-s10a-map-payload-a11y
parent: docs/launch-master-plan.md § Session 10a (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
  - sessions/2026-07-13-208-impl-launch-s9-chronicle-a11y.md
commits: []
---

# Launch S10a — Cartographer: Payload & A11y

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang: Product · Branch: `codex/product-map-payload-a11y`.

## Summary

Der initiale Map-Payload ist works- und blurb-frei: das `/map`-Dokument fällt von **79,1 KB auf 33,8 KB gzip (−57 %)**, und der 236-KB-world-blurbs-Client-Chunk (64,7 KB gz), den ein einziger `import()` beim ersten Panel-Klick komplett zog, ist ersatzlos aus dem Client-Bundle verschwunden. Beides läuft jetzt über den dafür gebauten `PinSource.detail()`-Seam als **per-Welt-Fetch** gegen `/api/map/world/{id}` — 1 055 zur Buildzeit prerenderte statische JSON-Responses, Median 636 B pro Welt; die Messung hat gegen das Ein-Artefakt-Modell (43,1 KB gz beim ersten Klick) klar für per-Welt entschieden. Parallel dazu hat der Cartographer einen vollständigen Tastatur-/AT-Pfad: Overture mit echtem „Enter the chart"-Einstieg (unsichtbares Chrome ist bis dahin inert), Seek als ARIA-Combobox mit Listbox/aktivem Deskendenten, ein neuer alphabetischer **World index** (155 recorded worlds als echte Buttons, in Cartouche und Mobile-Sheet), WorldPanel als non-modaler Dialog mit einer einzigen SR-Statusregion und belegtem Fokus-Restore, `aria-pressed`/`aria-expanded` auf allen Census-/Overlay-/Journey-Toggles, VoyageTour-Pfeiltasten hinter dem S9-Target-Guard, das Mobile-Sheet **bewusst modal** (aria-modal + inert auf allem dahinter), und 44-px-Touchziele hinter `pointer: coarse`. Espandor sitzt jetzt zwischen Magniat und Calth. **Ein Muss für die Dauerhaftigkeit des Espandor-Fixes:** die Koordinate muss auch im Quell-Excel nachgezogen werden (unten), sonst revertiert der nächste `import:map-worlds`-Lauf sie stillschweigend.

## Messwerte (Leitplanke: zuerst messen)

Alle „vorher" auf `origin/main` (03b8b9f), sauberer Prod-Build (`rm -rf .next && next build`), Transfer via `curl -H "Accept-Encoding: gzip"` gegen `next start` mit `PREVIEW_GATE=off`; gzip-Werte Level 6.

**Counts (Baseline = Nachher, außer wo vermerkt):**

| Größe | Wert |
|---|---|
| Katalog-Kontakte (Pins gesamt) | **1 055** (155 featured inkl. 13 Regionen + 900 Dust) |
| Work-Einträge über alle featured | 1 292 |
| Featured mit location-blurb | 131 |
| Klassifikationen | 70 |
| SVG-Elemente Basis-Chart (statisch berechnet, idle) | **5 938** (Dust 4 567 · Pins 919 · Dekor/Zonen/Polar 452) + ~64 Motion-Plane |

**Transfer:**

| Artefakt | Vorher (raw / gz) | Nachher (raw / gz) |
|---|---|---|
| `/map`-Dokument (enthält den Payload-Flight) | 343,3 KB / **79,1 KB** | 125,2 KB / **33,8 KB** (−57 % gz) |
| Payload-JSON darin (works-Arrays) | 157,6 KB / 27,8 KB — **62 %** des Payloads | 0 |
| Payload-JSON darin (blurbs) | 33,3 KB | 0 |
| world-blurbs-Client-Chunk (lazy, ganz beim 1. Klick) | 235,6 KB / **64,7 KB** | **entfernt** |
| Per-Welt-Detail `/api/map/world/{id}` | — | Median **636 B**, Max Terra 25,5 KB raw |
| `/map` initiales JS (14 Chunks, inkl. Framework) | 869,5 KB / 267,7 KB | 873,1 KB / 268,8 KB (+1,1 KB gz A11y-Code) |

**Entscheidung „ein Artefakt vs. per-Welt" (nach komprimierter Transfergröße):** Das Ein-Artefakt (works+blurbs aller featured) hätte 195,3 KB raw / **43,1 KB gz** beim ersten Klick gekostet — und die Dust-Blurbs (64,3 KB gz) hätten separat weiterexistiert. Per-Welt kostet pro geöffneter Welt Median ~0,6 KB und macht den world-blurbs-Chunk komplett überflüssig; Break-even läge erst bei >50 geöffneten Welten pro Sitzung. Latenz ist maskiert: das Panel-Skelett (Name, Klassifikation, Zählung) rendert synchron aus dem Payload, Blurb + Werkliste füllen beim Eintreffen (ein „…" als Platzhalter statt eines falschen „empty. add later"-Flashs). Ein 404-/Netzwerkfehler degradiert auf den bisherigen „empty"-Filler und bleibt retry-fähig.

## What I did

**1. Payload-Slimming über den `detail()`-Seam**
- [payload.ts](../src/lib/map/payload.ts) — `FeaturedWorld` verliert `works` + `blurb` (Zählung `n` bleibt für Pin-Größe/Tiering/Seek-Tags); neuer Wire-Typ `WorldDetail { works, blurb }`. Der `getBlurb`-Import ist raus — `buildMapPayload` ist jetzt frei von der server-only-Blurb-Schicht.
- [world-detail.ts](../src/lib/map/world-detail.ts) (neu, server-only) — löst Detail pro Welt: location-blurb gewinnt, sonst world-blurbs.json (Datei bleibt an Ort und Stelle, wird aber nur noch serverseitig importiert), sonst null. Modul-Scope-Indizes nach dem `src/lib/blurbs`-Muster.
- [route.ts](../src/app/api/map/world/[id]/route.ts) (neu) — `GET /api/map/world/{id}`, `force-static` + `generateStaticParams` über alle 1 055 IDs (im Build-Manifest verifiziert, inkl. `cache-control: public, max-age=300` analog `/api/search-index`). DB-frei by construction.
- [pin-source.ts](../src/lib/map/pin-source.ts) — `detail()` ist jetzt async (fetch + Session-Cache, fehlgeschlagene Fetches bleiben retry-fähig, Shape-Guard gegen HTML-/Fehler-Bodies); neues sync `peek()` für Kamera-Flüge, Hash-Restore und das Panel-Skelett.
- [WorldPanel.tsx](../src/components/cartographer/WorldPanel.tsx) — konsumiert `source.detail()` statt des gelöschten `world-blurbs.ts`-Lazy-Loaders; ein einziger Async-Pfad für Blurb UND Werkliste, keyed per Welt-ID gegen stale Antworten.
- [world-blurbs.ts](../src/lib/map/world-blurbs.ts) — **gelöscht** (der 236-KB-Chunk verschwindet damit aus dem Client-Build; `grep` über die gebauten Chunks bestätigt es). Prosa-Verweis in `docs/map-world-blurbs-run.md` nachgezogen — der Research-Pass schreibt weiter dieselbe JSON-Datei.

**2. A11y-Parallelpfad**
- **Overture als Tastatür-Tür** ([Cartouche.tsx](../src/components/cartographer/Cartouche.tsx), [CartographerRoot.tsx](../src/components/cartographer/CartographerRoot.tsx), [55-map.css](../src/app/styles/55-map.css)): Die Cartouche war vor dem Condense unsichtbar (opacity 0), ihre Controls aber fokussierbar — jetzt sind Cartouche, Sheet, Zoomer während des Schleiers **inert**, und die Overture trägt einen echten „Enter the chart"-Button im **seitenweiten Sternwarte-Stil** (`.lx-btn` + `BtnFx`: Origin-Punkt, on hover Ringe + Survey-Sterne — Philipps Abnahme-Feedback; `.cg-enter` behält nur pointer-events + Entrance-Choreo + Reduced-Motion-Klammer). Aktivierung condenst und parkt den Fokus auf `#main`; das nächste Tab landet auf dem ersten lebenden Control (Desktop: Seek; Phone: Grip). Nach dem Condense geht die Overture selbst inert.
- **Seek = Combobox** ([Cartouche.tsx](../src/components/cartographer/Cartouche.tsx)): `role="combobox"` + `aria-expanded/-controls/-autocomplete/-activedescendant`, Trefferliste als `role="listbox"` mit `role="option"`/`aria-selected`; IDs `useId`-scoped (zwei Instanzen: Cartouche + Sheet). `aria-controls` nur solange die Liste existiert (dangling-ID wäre eine axe-Violation). Die „keep typing"-Zeile steht außerhalb der Listbox. Fokus bleibt während des gesamten seek→pick→Escape-Loops im Feld — exakt der S8-Smoke-Vertrag.
- **World index** ([Cartouche.tsx](../src/components/cartographer/Cartouche.tsx), Sektion in Cartouche + [CartoucheSheet.tsx](../src/components/cartographer/CartoucheSheet.tsx)): neue einklappbare Sektion (zu, per Default) mit allen 155 recorded worlds A–Z als echten Buttons (Name + Werkzahl, Seek-Listen-Vokabular, interner Scroll) — der Browse-Pfad zu den 1 000+ pointer-only-Pins; Dust bleibt über die Seek erreichbar (Hinweiszeile sagt das). Nur bei offener Sektion im DOM.
- **WorldPanel als non-modaler Dialog** ([WorldPanel.tsx](../src/components/cartographer/WorldPanel.tsx), [CartographerRoot.tsx](../src/components/cartographer/CartographerRoot.tsx)): `role="dialog"` + `aria-label`, `inert` solange zu (die Links/Buttons des ausgeblendeten Panels waren bisher Tab-Stops). Öffnen stiehlt **nie** Fokus (S8-Smoke-Vertrag; bewusst: Welt für Welt seeken ohne Re-Tab). Ankündigung über **genau eine** SR-Statusregion im Root (S9-Muster, „adjust state during render" statt setState-in-effect — der neue react-hooks-Lint verbietet letzteres): Panel auf/zu und Tour-Akte sprechen dort, initial mount bleibt stumm. **Fokus-Restore:** der Root merkt sich den Invoker beim Select; schließt das Panel, während der Fokus darin steht (Tab hinein + Escape, oder ✕-Klick), geht der Fokus an den Invoker zurück (Fallback `#main`).
- **VoyageTour-Target-Guard** ([VoyageTour.tsx](../src/components/cartographer/VoyageTour.tsx)): der window-Keyhandler (bewusst window-gebunden — Pfeiltasten sollen ohne Kartenfokus blättern) steht jetzt hinter dem S9-Guard (`input, textarea, select, audio, [contenteditable], [role='slider'], [role='listbox']`) — Seek-Feld und Player-Volume-Slider behalten ihre Pfeile. Beide Tour-Karten (+ [CourseCards.tsx](../src/components/cartographer/CourseCards.tsx)) sind zudem inert, wenn sie visuell weggeduckt sind (suppressed) oder das Sheet modal offen ist.
- **Mobile-Sheet: bewusst modal** ([CartoucheSheet.tsx](../src/components/cartographer/CartoucheSheet.tsx), [CartographerRoot.tsx](../src/components/cartographer/CartographerRoot.tsx)): Der Backdrop blockte Pointer schon immer — jetzt sagt das Sheet dasselbe zu AT: `aria-modal` bei offen, und der Root setzt inert auf Zoomer, WorldPanel und Tour-Karten. Fokusmodell: Öffnen über die Seek-Pill fokussiert das Feld (bestand), Schließen per Escape/Backdrop gibt den Fokus an den Grip zurück (wasOpen-Guard gegen Mount-Fokusklau). Das per `.hidden` offscreen geschobene Dock (Panel offen) ist jetzt ebenfalls inert. Die globale Burger-Navigation bleibt bewusst erreichbar (sie liegt über dem Sheet und ist der Escape-Hatch der Route) — als einzige dokumentierte Abweichung vom strikten aria-modal-Wortlaut.
- **Zustands-Semantik überall** ([Census.tsx](../src/components/cartographer/Census.tsx), [Cartouche.tsx](../src/components/cartographer/Cartouche.tsx)): `aria-pressed` auf worksOnly/Dust/Names/Gruppen-/Klassifikations-Toggles, Journeys und Overlays; `aria-expanded` auf Gruppen-Unfold, Works-Toggle, Sektionsköpfen (bestand); der Zonen-Zyklus (Tri-State) trägt ein dynamisches `aria-label` („shown/dimmed/hidden — cycle"). Zoomer-Buttons haben `aria-label`s; das MAG-Readout (per-Frame-textContent) ist `aria-hidden`; Cartouche-Titel ist jetzt `h2`.
- **Overture-Vorhang deckender** ([55-map.css](../src/app/styles/55-map.css), Maintainer-Feedback in der Abnahme): der radiale Veil von 0.88/0.74/0.56 auf **0.97/0.93/0.86** — die Karte schimmert beim Einstieg nur noch schwach durch, Titel/Edition/Enter-Button bleiben klar lesbar; Vignette-Falloff beibehalten. Im Dev-Server per Screenshot verifiziert.
- **Touchziele** ([55-map.css](../src/app/styles/55-map.css) `@media (pointer: coarse)`): 44 px min für Zoomer (Tablets — Phones verstecken ihn), Panel-Close, Sektionsköpfe, Seek-Zeilen, World-index-Zeilen, Census-Zeilen (cx/crow/car/gname/creset), Panel-Werklinks, Tour-Buttons, Sheet-Grip — über Padding/min-height, Typo unverändert.

**3. Espandor** ([map-worlds.json](../scripts/seed-data/map-worlds.json)): `gx 931.56 / gy 350.16` → **`gx 903.2 / gy 626.1`** — Mittelpunkt zwischen Magniat (896.13, 620.5) und Calth (910.22, 631.6), Nordost-Ultramar; der Umkreis ist frei (nur diese zwei Nachbarn im 20er-Radius). Die Guilliman- und Great-Crusade-Stationen lösen über die Welt-ID auf und ziehen automatisch mit.

**4. S8-Smoke nachgeführt** ([smoke-interactions.spec.ts](../e2e/smoke-interactions.spec.ts)): Der Map-Smoke klickte bisher das **unsichtbare** Seek-Feld durch den Overture-Schleier (Playwright behandelt opacity:0 als sichtbar) — mit korrektem inert unmöglich. Der Test nimmt jetzt den echten Nutzerpfad: „Enter the chart" aktivieren, dann unverändert seek→Enter→Panel→Escape mit denselben Fokus-Asserts. Semantik des Beweises unverändert, plus Abdeckung der neuen Tastatür-Tür.

## Decisions I made

- **Per-Welt-Fetch statt ein Lazy-Artefakt** — Messwerte oben; zusätzlich löst per-Welt das vom Plan explizit markierte world-blurbs-Chunk-Problem mit (ein Artefakt hätte es nicht angefasst oder auf ~107 KB gz kombiniert).
- **Route statt Client-Chunk** für die Details: `import()` eines JSON-Moduls wäre wieder ein Alles-auf-einmal-Chunk; das `/api/search-index`-Muster (S6) ist der Repo-Präzedenzfall für lazy statische JSON-Endpoints.
- **`peek()` neben `detail()`** im PinSource-Interface: Kamera-Flüge und Hash-Restore brauchen synchrone Koordinaten; das async-machen von allem hätte UI-Verhalten geändert (Flug erst nach RTT).
- **Panel-Öffnen stiehlt keinen Fokus** — der S8-Smoke pinnt das, und es ist das bessere Muster für „Welt für Welt inspizieren"; die Ankündigung übernimmt die Statusregion, den Rückweg das Fokus-Restore. Das ist die bewusste Auflösung des Spannungsfelds „WorldPanel fokussieren" vs. „Smoke bleibt grün".
- **Sheet modal, nicht nichtmodal** — der Backdrop schließt bei Pointerdown, Escape schließt: die Pointer-Semantik war schon modal, AT bekommt jetzt dieselbe Wahrheit. Ausnahme Burger dokumentiert (oben).
- **World index = nur recorded worlds** (155, nicht 1 055): 900 Dust-Buttons wären eine unbenutzbare Tab-Wüste; Dust ist über die Seek-Combobox vollständig erreichbar. Plain Buttons statt Roving-Tabindex-Listbox: Sektion ist per Default zu, steht am Ende der Cartouche, und 155 echte Buttons sind robuster als eine handgebaute Listbox.
- **Pins bleiben bewusst pointer-only** (SVG `role="presentation"`, keine 1 055 Tab-Stops) — der Index + die Seek SIND der Tastaturpfad. Das ist die Neubewertung der alten Map-A11y-Vertagung (unten).
- **Espandor im JSON statt im Excel gefixt** — das Kurations-Excel kennt nur link/rollup/pin, keinen Move; das redditor-Excel ist eingefrorener Input, den ich nicht programmatisch umschreiben wollte (Binär-SSOT, Korruptionsrisiko). Konsequenz siehe Open issues.
- **Statusregion per „adjust state during render"** statt setState-in-effect: der react-hooks-Lint (neu scharf) lehnt das S9-wörtliche Muster in neuem Code ab; das Render-Adjust-Muster ist der Repo-Präzedenzfall (WorldPanel `setShown`).

## Verification

- `tsc --noEmit` — pass · `eslint` (Cartographer, lib/map, api/map, e2e) — pass · `next build` sauber, 1 055 Detail-Routen im Prerender-Manifest mit korrektem Cache-Header · `brain:lint --no-write` — 0 blocking (nur vorbestehende Warnings; brain/ unangetastet).
- Transfer-Messungen vorher/nachher: Tabelle oben (curl gegen `next start`, PREVIEW_GATE=off).
- `npm run test:smoke` (static + degraded, Prod-Build): **15/15 passed** — inkl. axe auf /map (Overture-Zustand, jetzt mit Enter-Button + inertem Chrome), Map-Seek-Smoke (angepasst auf den Tastatür-Tür-Pfad, Fokus-Asserts unverändert) und Degradations-Smoke.
- **Fokus-Restore + Weltliste belegt** (einmaliger, nicht committeter Playwright-Proof gegen den Prod-Build, danach gelöscht — kein Ausbau des required Sets): ① Enter-the-chart per Enter → Fokus auf `#main` → ein Tab landet im Seek-Combobox; Combobox-Semantik geprüft (`role`, `aria-expanded` false→true beim Tippen, `aria-activedescendant` gesetzt, Escape schließt). ② World index per Enter geöffnet (`aria-expanded`), erste Welt per Enter gepickt → Panel offen mit passendem Namen, **Fokus blieb auf dem Index-Button** (kein Fokusklau). ③ Tab in das Panel (✕), Escape → Panel zu, **Fokus zurück auf dem Invoker-Button**; SR-Region sprach „world panel closed". ④ Mobile 390px: Sheet öffnen → `aria-modal="true"`, Zoomer dahinter `inert`, World index im Sheet bedienbar, Escape → Fokus auf dem Grip. Alle 3 Proof-Tests passed.
- **Espandor visuell + geometrisch belegt** (gleicher Proof-Lauf): Deep-Link `#world=espandor` → Panel „Espandor · Cardinal World · Segmentum Ultima" mit per-Welt geladenem Blurb; Bounding-Box-Asserts Magniat < Espandor < Calth auf beiden Achsen; Screenshot (Nordost-Ultramar, bei Macragge/Iax/Konor) im Session-Verlauf gezeigt.
- Browser-Pane-Anmerkung: der eingebettete Preview-Browser hydratisiert diese App aktuell nicht (identisch am unveränderten Baseline-Build reproduziert — Umgebungsproblem des Panes, kein Regressionsbefund); die Browser-Beweise laufen deshalb über echtes Chromium (Playwright). Philipps eigene Browser-Abnahme steht wie immer aus.
- Hinweis: die per-Welt-JSONs kommen aus dem lokalen `next start` unkomprimiert (kein Content-Encoding auf prerenderte Route-Handler-Bodies); auf Vercel komprimiert die Edge. Die Größenentscheidung oben nutzt deshalb raw-Werte fürs Per-Welt-Modell — konservativ gerechnet gewinnt es trotzdem deutlich.
- Bekannte Randnotiz: `/api/map/world/{unbekannt}` liefert die App-Shell mit 200 statt JSON-404 (`dynamicParams=false` greift bei Route-Handlern nicht wie bei Pages). Der Client fragt ausschließlich Katalog-IDs an, und der Shape-Guard in `pin-source.ts` degradiert jede Nicht-JSON-Antwort auf den „empty"-Filler. Kein Handlungsbedarf vor Launch.

## Neubewertung der alten Map-A11y-Vertagung (für den S11-Rollup — brain/ hier unangetastet)

Die alte Vertagung existiert als eigener Eintrag nicht mehr: `brain/wiki/deferred-questions.md` führt sie unter „Removed / promoted" („Focus visibility, reduced motion, touch targets and Map/Chronicle accessibility → mandatory pre-gate launch sessions"). S10a ist genau diese Session. Die Neubewertung für den neuen Cartographer, wie sie der Rollup festhalten sollte: **Der Cartographer bekommt keinen fokussierbaren Pin-Layer.** Die 1 055 SVG-Pins bleiben `role="presentation"`/pointer-only; der gleichwertige Zugang sind Seek-Combobox (alle 1 055 Kontakte) + World index (alle 155 recorded) + WorldPanel-Dialog mit Statusregion und Fokus-Restore. Das ist eine bewusste Architekturentscheidung (Tab-Wüste vs. Parallelpfad), keine Vertagung mehr.

## Open issues / blockers

- **Espandor muss ins Quell-Excel nach** (`scripts/seed-data/source/Warhammer_map_SSOT.xlsx`, Zeile Espandor): Pixel-Raum **x ≈ 6351, y ≈ 4915** (Rückrechnung über `SOURCE_EXTENT`/`GRID_SCALE`; ergibt exakt gx 903.2 / gy 626.1). Ohne das revertiert der nächste `import:map-worlds`-Lauf den Fix kommentarlos — der Konvert ist deterministisch aus den Excels. Alternative für einen Batches-Folgelauf: eine „move"-Aktion im Kurations-Excel.
- Der Ziel-Pixel-Gerätetest (entscheidet über S10b) steht aus — machen Philipp + CC gemeinsam nach dieser Session; die SVG-Knotenzahl (5 938 idle) ist dafür als Input notiert.

## For next session

- S10b nur bei Messbefund auf dem realen Gerät (Plan § 10a/10b).
- Falls die Panel-Latenz auf dem Zielgerät je sichtbar wird: `source.detail()` ließe sich beim Pin-Hover/`pointerdown` prefetchen — Ein-Zeilen-Erweiterung am Seam, erst bei Befund.
- Batches-Kandidat: „move"-Aktion fürs Kurations-Excel, damit Koordinaten-Korrekturen wie Espandor SSOT-durchgängig werden.

## References

- ARIA APG Combobox-Pattern (aria-activedescendant-Variante) · Next.js Route Handlers + `generateStaticParams`/`force-static` (verifiziert am Build-Manifest) · S9-Report 208 (Target-Guard, Statusregion, SSR-Text-Muster).
