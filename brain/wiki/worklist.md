---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-06
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-07-05-178-impl-map-cartographer.md
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

1. **~~P14 Map / Sternenkarte~~ — ERLEDIGT (Brief 178 gemergt 2026-07-06).** Der Dreiteiler ist komplett: **Teil A** [174](../../sessions/2026-07-02-174-arch-map-ssot-reconciliation.md) (Katalog `map-worlds.json`) + **Teil A.2** [183](../../sessions/2026-07-02-183-arch-map-worlds-daten-pass.md) (Kurations-Excel → `map-worlds-v2`, **1054 Welten, Abdeckung 79,1 %**) + **Teil B UI = Brief 178** (Product; Plan-Mode-Plan, Impl `2026-07-05-178-impl-map-cartographer.md`): Studie „Maledictum" läuft nativ auf allen 1054 SSOT-Welten, `/map` **statisch**, alte Hologramm-Disc + `src/lib/galaxy` + `/lab/cartographer` **gelöscht**. **P15** (Map-Chrome-Kohärenz) eingefaltet; **K11** gelöst (Map-Editor mit der alten Disc entfernt — nicht mehr im öffentlichen Bundle). **Offene 178-Follow-ups (klein, Product):** Direction-Panel raus + Gewinnerwerte einbrennen (Sturm-Fassung / Rift-unrest / Veil / Brightness / Grain — nach Philipps Live-Entscheid, § F); **Warpsturm-/Zonenformen** über einen **Hand-Kurations-Zoneneditor** (Handover, eigene Session — bildbasierter Nachbau zurückgebaut, Philipp-Veto); Episoden-Anker-Kompat (`#ep-<slug>`); Vermesser-Modus (K11-Rest) + `outputFileTracingIncludes`; Blurb-Filler auf **24 Welten** (§ F). **Map-A11y (W7/W8) bewusst nicht v1** (Philipp) → § E.
2. **~~De-Slop-Zweischritt~~ — ERLEDIGT (2026-07-03, PR #222).** Brief [184](../../sessions/2026-07-03-184-arch-design-richtungsstudien.md) lief über **10 Review-Runden** und hat die gewählte **„Kathedrale"-Sprache in Runde 10 direkt live gebracht** (Home/Archive/Compendium/Ask + geteiltes Fundament). Der geplante **Brief 185 Design-Language-Pass ist damit hinfällig**. Rest-Restyle (Entity-Seiten, Chronicle, Mobile) → Punkt 4 / § E.
3. **~~Hygiene-Wave 175/176/177~~ — ERLEDIGT (gemergt 2026-07-03, PR #211/#212/#214).** Podcast-Hygiene · Roster-Rebind + B7 · B6 Dead-Code-Sweep. **Offen bei Philipp:** `apply:podcast --show` für die 4 Shows (+10 Episoden) auf Go; optional `db:drift` read-only.
4. **~~Review-Paket~~ — 180 ERLEDIGT (gemergt 2026-07-03, PR #215).** CI-Test-Gate (`npm test`) + Deps + DB-Migration `0015` (**`db:migrate` offen bei Philipp**; ESLint-10-Bump upstream blockiert). 179 Launch-Legal: gemergt 2026-07-02. **Neu (184-Nachlauf, Product, nach der Map):** Rest-Restyle — Entity-Seiten (fraktion/welt/charakter) strukturell auf die neue Sprache · Chronicle-Restyle · Mobile-Feinschliff.
5. **Brief [181](../../sessions/2026-07-02-181-arch-product-prune-pass.md) Product-Prune-Pass** (Product) — **jetzt startbar** (178 gemergt 2026-07-06), vor P12. **= nächster Cowork-Schnitt.**
6. **P12 URL-Migration EN + `/buch`-SSG** (121). Reiner Architektur-Schnitt, keine Daten nötig. **Hinweis aus Impl 179:** Rechtsseiten sind bereits englisch (`/imprint`/`/privacy`, deutsche Link-Labels) — keine Ausnahme, keine Redirects nötig; bei der Migration nur Footer-/Menü-Links gegenchecken.
7. **Brief [182](../../sessions/2026-07-02-182-arch-launch-tech.md) Launch-Tech** (Product) — Startbedingung: nach P12-Merge (sitemap/Metadata brauchen finale URLs; Focus-Fix + Font-Wiring notfalls als Mini-PR vorziehbar, Philipp entscheidet).
8. **P13 Mobile-Sweep** (121).

## B. Pakete (gebündelt je eine Session)

### B-1. Podcast-Hygiene-Session (Batches) — ✅ ERLEDIGT (Brief [175](../../sessions/2026-07-02-175-arch-podcast-hygiene.md), gemergt 2026-07-03 PR #211)

> Nachlauf: Alias-Review-Liste `scripts/seed-data/podcast-aliases.review.md` (175 Formen, Top: Warp/Immaterium ×20) = nächste Entity-Kurations-Welle (Batches). `apply:podcast` für die 4 Shows offen bei Philipp (§ F).

Gehört zusammen, eine Session:

- **8 gedriftete Podcast-Artefakte** (`luetin09` + `the-40k-lorecast`): `test:podcast-cc-direct` auf `origin/main` rot; Re-Assemble nötig (aus 171-Impl).
- **Podcast-Catchup für 3 Shows** — in 168 bewusst deferred; Entscheidung `api` vs. `cc-direct` fällig (cc-direct ist der bewährte Null-Kosten-Pfad). Läuft jetzt über den 172er-Delta-Pfad (`prepare-delta`/`merge-delta` → `apply:podcast --show`).
- **Alias-Backlog:** ~63 Luetin- + ~212 Lorehammer-Surface-Forms.
- **Lorehammer-Twin-Filter** für Cold-Reingest.
- Abgegrenzt bleibt: S4 YouTube-Episode-Matching (Session 128) — nur aufnehmen, wenn der Rest Platz lässt.

### B-2. Roster-Rebind + Verify-Kleinkram (Batches, klein) — ✅ ERLEDIGT (Brief [176](../../sessions/2026-07-02-176-arch-roster-rebind-kleinkram.md) inkl. B7, gemergt 2026-07-03 PR #212)

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

- **UI-Gesamt-Pass (eigene Session, Philipp-Entscheid 2026-07-01; Teil-Promotion 2026-07-03):** Der **Design-Language-Reset** (Fonts, Typo, Buttons, Icon-Politik — die „AI-Slop"-Diagnose) ist über **Brief 184 erledigt + live** (Home/Archive/Compendium/Ask, 2026-07-03); der Rest-Restyle (Entity/Chronicle/Mobile) hängt an der Map (§ A Punkt 4). Hier geparkt bleibt der Rest: A11y-Polish, Farbsprachen-Konsolidierung (Review 141), P7-Frontend-Lockdown-Rest, ui-backlog-Kleinkram — Kandidat weiterhin: nach P14. Kosmetische Einzelitems sammeln weiter in [`docs/ui-backlog.md`](../../docs/ui-backlog.md) (bleibt live, wird nicht hierher gefaltet); dort liegt auch das MediaPlayer-Mobile-Konzeptthema.
- **Map-A11y — bewusst nicht v1 (Philipp 2026-07-02, Review-Triage; Findings hier konserviert, Review-Datei ist gitignored; Stand pre-178-Neubau):**
  - **W7 (medium, verifiziert):** `/map` ist öffentliches Nav-Ziel (nur der Editor ist admin-gated), aber pointer-only — Planeten-Marker haben `pointerEvents=none`; im ganzen `components/map`-Tree nur 9 tabIndex/aria-Treffer (alle im Control-Rail). Keyboard-/Screenreader-Nutzer können keine Welt explorieren oder auswählen (WCAG 2.1.1); gemildert: dieselben Welten sind übers Compendium erreichbar. Fix-Idee: fokussierbare Welt-Liste/Buttons, die dieselbe Selektion treiben; minimal ein zugänglicher Text-Index.
  - **W8 (medium, verifiziert):** Ring-/Puls-Animationen laufen als SVG-SMIL (`<animateTransform>`, `map/disc/PlanetMarker.tsx:50`) — der globale reduced-motion-Clamp in `10-base.css` greift per Spezifikation nur für CSS-Animationen; SMIL dreht unter reduced-motion weiter, ausgerechnet auf der bewegungsintensivsten Vollbild-Fläche (WCAG 2.3.3, Vestibular-Risiko). Fix-Idee: SMIL hinter `useReducedMotion()` gaten (statische Marker rendern), wie Typewriter/RouteProgress es vormachen.
  - **Aufgreifen:** nach Launch bzw. mit dem UI-Gesamt-Pass. **178 ist inzwischen gebaut** (2026-07-06) — die konkreten Datei-Refs oben (`components/map`, `PlanetMarker.tsx`) sind gelöscht; die Fragen (Keyboard-Explorierbarkeit + reduced-motion auf der Vollbild-Karte) sind gegen den neuen `src/components/cartographer/*`-Tree neu zu prüfen. 178 shippte bereits einen `reduced-motion`-Block in `55-map.css` + klickbare Pin-Labels (Teil-Mitigation).
- **UI-Gesamt-Pass — Zusatz-Zielliste aus der Review-Triage 2026-07-02:** A11y-Polish (K62 kein Skip-to-content-Link vor der persistenten Nav · K60 Heading-Sprung h1→h3 auf Podcast-Show-Seiten · K61 Volume-/Playlist-Popovers fälschlich `role=dialog` ohne Modal-Semantik) + K16 Degraded-State in der UI unterscheidbar machen („temporarily unavailable" statt „The database is empty" bei DB-Fehler, `archive/page.tsx:217`).
- **Beim-nächsten-Anfassen-Konventionen (Review 2026-07-02, kein Brief):** `test-resolver.ts` (120K, 518 Cases) beim nächsten Anfassen splitten · explizite `_frozen/`-Konvention für retiriertes Generationen-Sediment · `ssot-loop-log.md` (651 KB) rotieren.
- **Character-Long-Tail: 315 Sentinels** (Stage 3) — geparkt seit 155.
- **Launch-Tag:** `PREVIEW_GATE=off` (Env-Flip), danach dedizierter Cleanup-Brief, der die komplette Gate-/Invite-Maschinerie ausbaut — Details + Datei-Liste in [`deferred-questions.md`](./deferred-questions.md) § Preview-Gate. Promote beim Reddit-Launch-Brief.
- Übrige Dormant-Items mit Triggern: [`deferred-questions.md`](./deferred-questions.md).

## F. Maintainer-Merker (Philipp)

- Nachplatzierungs-Worklist: via Brief 183 + CC-Kurations-Pass (Impl-Nachtrag 2) auf **238 offene Zeilen** reduziert — fast alle 1–2 Werke, Kanon nennt meist keine Position („wenn du nichts findest, ist das eben so", Philipp). Weitere Hand-Kuration jederzeit in `map-worlds-curation.xlsx` + Convert-Lauf (`--sync-curation` refresht Zähler), kein `db:sync` nötig (Katalog ist DB-frei). Merker: `planet_of_the_sorcerers → prospero` vs. `eye-of-terror` steht als Notiz in der Excel, Pin-Koordinaten sind reviewbar (Konfidenz in der Notiz-Spalte).
- **Offen seit 04.07. — Stand 2026-07-06 unklar, bitte gegenprüfen:** (a) explizites Go für `apply:podcast --show <slug>` für **4 Shows** (the-40k-lorecast +5 / adeptus-ridiculous +4 / luetin09 +1 / lorehammer +0 Junction-Refresh) + danach `POST /api/revalidate`; (b) **DB-Migration `0015`** (Brief 180, Indizes) via `db:migrate` gegen Prod; (c) **Weekly-Refresh-PR #200** (2026-W27: 0 Bücher / 9 Episoden) reviewen + mergen/schließen.
- **178 Direction-Panel — Live-Entscheid fällig:** im Browser abnehmen, welche Sturm-Fassung (I/II/III), Rift-unrest an/aus, Veil/Brightness/Grain-Werte; danach brennt ein Mini-Follow-up-PR die Gewinnerwerte als Konstanten ein und wirft das Panel raus.
- **Blurb-Filler auf der Karte (24 Welten, Blurb-Agent):** 23 über `scripts/seed-data/location-blurbs.json` anbindbar (`cao_quo … vraks_prime` — Liste im 178-Impl-Report); `badab` hat keine `locationId` → braucht Kurations-Verlinkung in der Excel oder bleibt Filler.
- Optional: `npm run db:drift` gegen Prod als read-only Post-171-Bestätigung (176 hat es ohne Go übersprungen).
- Repo-Setting „Allow Actions to create PRs" bleibt ON.
- Nach Daten-Applies bei Bedarf `POST /api/revalidate`.
