---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-02
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-06-03-121-arch-product-board.md
  - ../../sessions/2026-06-03-122-arch-batches-board.md
  - ../../sessions/archive/2026-06/2026-06-28-168-impl-weekly-refresh-catchup.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-01-172-impl-podcast-weekly-maintenance.md
related:
  - ./project-state.md
  - ./open-questions.md
  - ./deferred-questions.md
confidence: high
---

# Worklist

> **Die eine kanonische Stelle für offene Arbeit.** Konsolidiert am 2026-07-01 (Cowork-Session mit Philipp) aus: Boards 121/122, `sessions/README.md`-Nachträgen, `open-questions.md`, `project-state.md` § What's open und den Impl-Reports 166–172.
>
> **Pflege-Regel:** Neue offene Punkte landen HIER (nicht als Nachtrags-Prosa im README, nicht als Kleinkram-Bullet in project-state). Erledigtes wird gestrichen, nicht kommentiert. Die Boards 121/122 bleiben die Spec-Referenz für ihre Items; diese Liste ist die Priorisierung darüber. OQ-Queue (`open-questions.md`) bleibt separat für „muss der nächste Brief adressieren". **Ausnahme UI:** kosmetisches UI bleibt in `docs/ui-backlog.md` und wird bewusst NICHT hier getrackt — UI läuft als eigener Gesamt-Pass (§ E).

## A. Forward-Queue (priorisiert, mit Philipp 2026-07-01 bestätigt)

1. **P14 Map / Sternenkarte** (121, in Arbeit als Zweiteiler; Philipp 2026-07-02: **Excel = die Karte** — eigener Map-Katalog aus den 992 Redditor-Welten, nur Pins/keine neuen Entities, Medien-Bestand wird dagegen gematcht, Lücken-Welten via Review-Liste nachplatziert, Segmentum ersetzt den Sektor-Layer). Excel `Warhammer_map_SSOT.xlsx` **liegt vor** (28.06., 992 Welten, 0 Koordinaten-Lücken). **Teil A Daten = Brief [174](../../sessions/2026-07-02-174-arch-map-ssot-reconciliation.md)** (Batches, DB-frei: `map-worlds.json` + Overrides + Review-Report; `locations`/Schema unberührt). **Teil B UI = Brief 178** (Product, Neubau in gleicher Optik, schneiden nach 174-Merge; **P15 eingefaltet**; renummeriert von 175 am 2026-07-02). **Beim 178-Schnitt einfalten (Review-Triage 2026-07-02):** K11 — Maintainer-only Map-Editor-Panels (`EditPanel` + `AddElementPanel`, ~1.300 LOC) shippen heute in jedem öffentlichen `/map`-Bundle (null-gated, aber geladen; kein einziges `next/dynamic` repo-weit) → im Neubau via `next/dynamic` auf `initialIsAdmin` gaten. Map-A11y (W7/W8) dagegen **bewusst nicht** in 178 (Philipp: nicht v1 → § E).
2. **Hygiene-Wave vor dem Map-UI-Schnitt** (Philipp 2026-07-02, alle Batches, alle `open`): Brief [175](../../sessions/2026-07-02-175-arch-podcast-hygiene.md) Podcast-Hygiene (§ B-1) · Brief [176](../../sessions/2026-07-02-176-arch-roster-rebind-kleinkram.md) Roster-Rebind + Kleinkram + B7 (§ B-2) · Brief [177](../../sessions/2026-07-02-177-arch-dead-code-sweep.md) B6 Dead-Code-Sweep (nach 176-Merge).
3. **Review-Paket sofort fahrbar** (Status-quo-Review-Triage 2026-07-02): Brief [179](../../sessions/2026-07-02-179-arch-launch-legal.md) **Launch-Legal** (Product, kollisionsfrei, jederzeit — deckt das einzige High-Finding W1) · Brief [180](../../sessions/2026-07-02-180-arch-ci-test-gate-wartung.md) **CI-Test-Gate + Wartung** (Batches, nach der Hygiene-Wave einreihen, parallel zu 178; Termin-Anker: ESLint-EOL 2026-08-06).
4. **Brief [181](../../sessions/2026-07-02-181-arch-product-prune-pass.md) Product-Prune-Pass** (Product) — Startbedingung: nach 178-Merge, vor P12.
5. **P12 URL-Migration EN + `/buch`-SSG** (121). Reiner Architektur-Schnitt, keine Daten nötig. **Hinweis aus 179:** `/impressum` + `/datenschutz` behalten deutsche Slugs — als Ausnahme im P12-Brief vermerken.
6. **Brief [182](../../sessions/2026-07-02-182-arch-launch-tech.md) Launch-Tech** (Product) — Startbedingung: nach P12-Merge (sitemap/Metadata brauchen finale URLs; Focus-Fix + Font-Wiring notfalls als Mini-PR vorziehbar, Philipp entscheidet).
7. **P13 Mobile-Sweep** (121).

## B. Pakete (gebündelt je eine Session)

### B-1. Podcast-Hygiene-Session (Batches) — briefed: [175](../../sessions/2026-07-02-175-arch-podcast-hygiene.md)

Gehört zusammen, eine Session:

- **8 gedriftete Podcast-Artefakte** (`luetin09` + `the-40k-lorecast`): `test:podcast-cc-direct` auf `origin/main` rot; Re-Assemble nötig (aus 171-Impl).
- **Podcast-Catchup für 3 Shows** — in 168 bewusst deferred; Entscheidung `api` vs. `cc-direct` fällig (cc-direct ist der bewährte Null-Kosten-Pfad). Läuft jetzt über den 172er-Delta-Pfad (`prepare-delta`/`merge-delta` → `apply:podcast --show`).
- **Alias-Backlog:** ~63 Luetin- + ~212 Lorehammer-Surface-Forms.
- **Lorehammer-Twin-Filter** für Cold-Reingest.
- Abgegrenzt bleibt: S4 YouTube-Episode-Matching (Session 128) — nur aufnehmen, wenn der Rest Platz lässt.

### B-2. Roster-Rebind + Verify-Kleinkram (Batches, klein) — briefed: [176](../../sessions/2026-07-02-176-arch-roster-rebind-kleinkram.md) (inkl. B7)

- **Rebind:** `import-faction-starters.ts` + `book-review/projection.ts` lesen noch den eingefrorenen `book-roster.json` statt `loadEffectiveCorpusBooks` — sehen per-Buch-Bücher nicht (aus 171-Impl, kein Blocker, aber Drift-Falle).
- Einmal `npm run refresh:audit-artifacts` lokal read-only ziehen, bevor dem Wochenlauf vertraut wird (Brief 151).
- Optional `npm run db:drift` gegen Prod als read-only Bestätigung.
- Kosmetik: Slug-Diskrepanz `W40K-0259` / `W40K-0330` (für Äquivalenz verbatim erhalten; bei Gelegenheit normalisieren).

## C. Blockiert / wartet auf Vorleistung

- **P8 Themen-Stränge + P9 Charakter-Galerie** (121) ← warten auf **B8 Themen-Kurations-JSON + B9 Primarchen-Kuration** (122). B9 schaltet zusätzlich die Compendium-Primarchen-Kategorie frei. Spec: Brief 129 (bleibt als Spec-Dokument offen).
- **B5 Hand-Kuratierung** — läuft als kontinuierliche Hand-Arbeit (Codex-Auftrag → `curation-overlay.json` → Dry-Run/Verify), kein Session-Schnitt nötig.
- **P7 Frontend-Lockdown-Rest** — Teile via 147 erledigt; Rest wandert in den UI-Gesamt-Pass (§ E).

## D. OQ-Queue (separat in [`open-questions.md`](./open-questions.md), hier nur gespiegelt)

- **16b** `primaryEraId`-Placeholder — verortet (Brief 173): der `'time_ending'`-Hardcode lebt post-171 in `scripts/book-apply-shared.ts` (`M41_ERA_ID`, Z. 99 → `computeBookRows` Z. 712); Consumer lesen das Feld nur als uniformen Platzhalter. Brief erst bei Consumer-Druck.
- **16c** Atlas-Extension für Events (`atlas:regen` Event-Pages).

## E. Bewusst geparkt (nicht vergessen, aber kein Zug)

- **UI-Gesamt-Pass (eigene Session, Philipp-Entscheid 2026-07-01):** UI wird komplett in einer separaten Session neu angegangen — Kandidat: **erst wenn P14 Map steht**. Bis dahin sammeln kosmetische Einzelitems weiter in [`docs/ui-backlog.md`](../../docs/ui-backlog.md) (bleibt live, wird nicht hierher gefaltet); dort liegt auch das MediaPlayer-Mobile-Konzeptthema. Farbsprachen-Konsolidierung (Review 141) + P7-Frontend-Lockdown-Rest gehören in diesen Pass.
- **Map-A11y — bewusst nicht v1 (Philipp 2026-07-02, Review-Triage; Findings hier konserviert, Review-Datei ist gitignored; Stand pre-178-Neubau):**
  - **W7 (medium, verifiziert):** `/map` ist öffentliches Nav-Ziel (nur der Editor ist admin-gated), aber pointer-only — Planeten-Marker haben `pointerEvents=none`; im ganzen `components/map`-Tree nur 9 tabIndex/aria-Treffer (alle im Control-Rail). Keyboard-/Screenreader-Nutzer können keine Welt explorieren oder auswählen (WCAG 2.1.1); gemildert: dieselben Welten sind übers Compendium erreichbar. Fix-Idee: fokussierbare Welt-Liste/Buttons, die dieselbe Selektion treiben; minimal ein zugänglicher Text-Index.
  - **W8 (medium, verifiziert):** Ring-/Puls-Animationen laufen als SVG-SMIL (`<animateTransform>`, `map/disc/PlanetMarker.tsx:50`) — der globale reduced-motion-Clamp in `10-base.css` greift per Spezifikation nur für CSS-Animationen; SMIL dreht unter reduced-motion weiter, ausgerechnet auf der bewegungsintensivsten Vollbild-Fläche (WCAG 2.3.3, Vestibular-Risiko). Fix-Idee: SMIL hinter `useReducedMotion()` gaten (statische Marker rendern), wie Typewriter/RouteProgress es vormachen.
  - **Aufgreifen:** nach Launch bzw. mit dem UI-Gesamt-Pass; betrifft dann die 178er-Neubau-Komponenten.
- **UI-Gesamt-Pass — Zusatz-Zielliste aus der Review-Triage 2026-07-02:** A11y-Polish (K62 kein Skip-to-content-Link vor der persistenten Nav · K60 Heading-Sprung h1→h3 auf Podcast-Show-Seiten · K61 Volume-/Playlist-Popovers fälschlich `role=dialog` ohne Modal-Semantik) + K16 Degraded-State in der UI unterscheidbar machen („temporarily unavailable" statt „The database is empty" bei DB-Fehler, `archive/page.tsx:217`).
- **Beim-nächsten-Anfassen-Konventionen (Review 2026-07-02, kein Brief):** `test-resolver.ts` (120K, 518 Cases) beim nächsten Anfassen splitten · explizite `_frozen/`-Konvention für retiriertes Generationen-Sediment · `ssot-loop-log.md` (651 KB) rotieren.
- **Character-Long-Tail: 315 Sentinels** (Stage 3) — geparkt seit 155.
- **Launch-Tag:** `PREVIEW_GATE=off` (Env-Flip), danach dedizierter Cleanup-Brief, der die komplette Gate-/Invite-Maschinerie ausbaut — Details + Datei-Liste in [`deferred-questions.md`](./deferred-questions.md) § Preview-Gate. Promote beim Reddit-Launch-Brief.
- Übrige Dormant-Items mit Triggern: [`deferred-questions.md`](./deferred-questions.md).

## F. Maintainer-Merker (Philipp)

- Nach 174-Merge: `map-worlds.review.md` sichten und die Nachplatzierungs-Worklist (Medien-Welten ohne Excel-Match) per Override-Stubs abarbeiten — kann parallel zu 178 laufen. Kein `db:sync` nötig (Katalog ist DB-frei); die alte Karte bleibt bis 178 unverändert.
- Nach 175-Merge: explizites Go für `apply:podcast --show <slug>` (3 Shows) geben; danach ggf. `POST /api/revalidate`.
- Für Brief 176: entscheiden, ob CC `npm run db:drift` gegen Prod ziehen darf (read-only).
- Repo-Setting „Allow Actions to create PRs" bleibt ON.
- Nach Daten-Applies bei Bedarf `POST /api/revalidate`.
