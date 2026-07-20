---
session: 2026-07-20-252
role: implementer
date: 2026-07-20
status: complete
slug: werkstatt-f3b1-librarium-statistics
parent: launch-prompt (F3-Urteil Session 237; kein Architect-Brief — serielle Launch-Session aus dem Koordinations-Worktree)
links: []
commits:
  - (dieser PR)
---

# Werkstatt-Bau F3-B1 — Librarium-Statistiken (`/statistics`)

## Summary

`/statistics` ist gebaut: die Librarium-Route mit Stat-Tiles, zwölf Akten aus handgerollten SVG-/HTML-Charts (Server Components, keine Dependency), Kapitel-Navigation, Nav-/Sitemap-/OG-Anbindung. Wichtigster Fakt für Cowork: Die Chart-Liste wurde in mehreren Review-Runden mit Philipp deutlich umgebaut (Scatter, Tone-, Themes-, Lexicon-Akte wieder raus; Banner-Ledger mit Rollen-Toggle, Trend-, Hidden-Shelf- und Vox-Gap-Akte neu rein) — der finale Stand weicht bewusst vom F3-Urteilstext „7 Charts" ab.

## What I did

- `src/lib/statistics/loadStatistics.ts` — SERVER-ONLY Loader, alle Aggregate in SQL (compendium-Idiom, `fetch_types:false`-Koerzierung), `cachedRead` unter Tags `statistics`/`books`/`podcasts`, Cache-Key versioniert (`librarium-stats-v4`, Payload-Shape-Wechsel überleben den persistenten Data Cache nicht unfallfrei). Liefert: Tiles, Publikationskurve (Format-Gruppen), Autoren-Top-15 (ohne `work_collections`-Container), Faction-Boards **primary/antagonist** (rekursiver Subtree-Rollup, Klassen-Umbrellas `imperium/chaos/adeptus_astartes/heretic_astartes` ausgeschlossen), Charakter-Top-15 (pov/appears), Places-Top-15, Rating-Histogramm + Extreme (Floor 100 Votes), Rating-Jahrestrend (≥3 bewertete Bände/Jahr), Hidden Gems (10–99 Votes), Facetten plot_type/protagonist_class, Show-Roster, Episoden-Jahreskurve, Vox-Boards, Vox-Gap (Anteils-Delta vox↔shelf, normalisiert im Vergleichs-Set).
- `src/app/statistics/page.tsx` — force-dynamic (E4: kein Build-Time-DB-Read), Metadata + routeOg + Canonical, zwölf Akte I–XII, CSS-only-Radio-Toggle für den Banner-Ledger (Era-Plate-Segmentsprache).
- `src/components/statistics/` — `StatTiles`, `StackedYearChart` (generisch, **per-Segment-Hover + Tooltip**, kein Peak-Label), `PublicationChart` (Wrapper), `BarLeaderboard` (HTML-Rows mit echten Links; eigenes Grid für ranglose Boards), `RatingHistogram`, `RatingTrendChart`, `VoxGapBoard` (divergierende Balken gold/cyan), `ChartLegend`, `LibrariumNav` (Client-Island: Desktop-Marginalie rechts als Spiegel der SiteNav-Rail inkl. Scroll-Spy; unter 1180px Running Head mit aufklappbarem `<details>`-Inhaltsverzeichnis), `chart-utils`.
- `src/app/styles/60-statistics.css` — route-scoped; Chart-Palette als OKLCH-Schritte in Haus-Hues, 2026-07-20 mit dem dataviz-Validator gegen `#06080c` maschinell validiert (Stack-Fünfer + Allegiance-Trio, alle Checks PASS). Mobile-Running-Head als 64px-Band mit Freiraum für Brand-Beacon/Burger.
- `src/components/chrome/SiteNav.tsx` / `SiteMenu.tsx` — Librarium-Eintrag (VII bzw. VIII).
- `src/app/sitemap.ts` — `/statistics` ergänzt.
- `src/lib/db-cache.ts` — Tag `statistics` in der CATALOGUE_TAGS-Registry.
- `src/app/layout.tsx` + `src/components/chrome/SkipLink.tsx` — Skip-Link als Client-Island (Begründung unter Decisions).
- `docs/werkstatt-roadmap.md` — F3-B1 abgehakt (✔ 252).

## Decisions I made

- **Banner-Board nach Junction-Rolle gesplittet statt Präsenz-Ranking.** Philipps Review: Flat-Counts rankten Ultramarines über Adeptus Astartes, und „Präsenz" beantwortet nicht, wessen Geschichte ein Buch ist. Jetzt ein Board mit CSS-Radio-Toggle Protagonists/Antagonists (`work_factions.role` primary/antagonist; supporting/background zählen nicht), Subtree-Rollup per rekursiver CTE, Klassen-Umbrellas außerhalb des Rankings.
- **Vier Akte im Review gestrichen** (Setting-vs-Release-Scatter, Tone, Themes, Title-Lexicon — Philipp: wenig aussagekräftig), **drei neu**: „Better with Age?" (Jahresschnitt steigt real ~3,5→~4,0 seit 2004), „The Hidden Shelf" (hoch bewertet, <100 Votes), „Talked About, Written About" (Vox-Anteil vs. Regal-Anteil; Xenos über-diskutiert, Guard/Legionen über-beschrieben). Facetten behalten nur plot_type + protagonist_class, mit Overlap-Fußnote.
- **Chart-Interaktion per Segment.** `StackedYearChart` hat keine Ganzsäulen-Hitfläche und kein Peak-Label mehr; jedes Segment trägt eigenen `<title>` („2016: 29 novels") und Hover-Highlight, transparenter 3px-Stroke als vergrößerte Hitfläche für Ein-Buch-Sliver.
- **LibrariumNav ist das einzige neue Client-Island** — bewusster Bruch mit „max. CSS-Hover", von Philipp angefordert (Sticky-Nav) und nötig für den Bugfix: Native `#anker`-Klicks erzeugen History-Einträge ohne App-Router-State; `router.back()` aus dem DetailModal strandet darauf (Popup bleibt, nur der Scroll springt). Kapitel-Sprünge laufen jetzt über `scrollIntoView` + `history.replaceState(history.state, …)` — teilbare Hashes, null History-Einträge. **Gleicher Fix am globalen Skip-Link** (`SkipLink.tsx`), der der einzige weitere same-page-Hash-Anker der App war.
- **„Places charted" zählt wie das Ziel.** Die Kachel verlinkte auf `/compendium/worlds` (219 Einträge), zählte aber alle 446 `locations`-Zeilen; jetzt identisches Kriterium (`WORLD_MENTION_THRESHOLD` ≥2 Auftritte, importiert aus dem Compendium-Loader).
- **Cast-Ära-Filter NICHT gebaut** (von Philipp erwogen): `primary_era_id` existiert nur auf ~97 kuratierten Büchern — von 679 charakter-getaggten tragen ihn 92, der Filter würde ~87% der Daten still verwerfen. Vorschlag an Philipp übergeben: Batches-Lauf „Era-Anker-Backfill", danach ist der Toggle trivial (Buckets deep_history+great_crusade+horus_heresy vs. Rest).
- **Leaderboards als HTML-Rows statt SVG** — Entity-Links wollen echte Focus-States und die Site-Typo; die Geometrie ist eindimensional, SVG gewinnt nichts.
- **Copy-Pass „AI-slop-frei"** auf Philipps Wunsch: alle Em-Dashes aus Librarium-eigenen Texten und Tooltips entfernt (verbleibende stammen aus geteilter Site-Chrome: Titel-Konvention, Media-Player, Footer-Imprimatur), Fußnoten auf drei kurze reduziert.

## Verification

- `npx tsc --noEmit` — pass; `npx eslint` über alle geänderten Pfade — pass.
- Palette: `node scripts/validate_palette.js` (dataviz-Skill) gegen `#06080c` — Stack-Fünfer und Allegiance-Trio alle Checks PASS.
- Dev-Server sauber neu gestartet, ein Is-it-up-Check: HTTP 200, ~1–3s warm, alle zwölf Akte + Toggle + Tooltips im SSR-Markup verifiziert (gestrichene Inhalte: 0 Treffer). UI-Abnahme durch Philipp im Browser über mehrere Runden (Manual-verify-Regel; Browser-Pane-Screenshots waren sessionweit defekt, Geometrie des Mobile-Heads numerisch per JS gegen Beacon-/Burger-Rects geprüft).
- DB-Probes (temporäre tsx-Scripts, gelöscht): Rollen-Verteilung work_factions, Welten-Threshold 219, Era-Anker-Coverage, Trend-/Gems-/Gap-Kalibrierung.

## Open issues / blockers

- Browser-Pane des Harness hing wiederholt (Screenshots/Navigation); zweimal Dev-Server-Neustart nötig (einmal Pool-Starvation durch hängende Pane-Requests auf dem max:5-Pooler). Kein Code-Problem der Route.
- Em-Dashes in geteilter Chrome (Titel-Konvention „X — Y", Media-Player, Footer) bewusst nicht angefasst — wäre ein site-weiter Eingriff.

## For next session

- **Era-Anker-Backfill (Batches)** — Prompt liegt bei Philipp; schaltet Cast-Ära-Toggle + „wo spielen die Bücher"-Verteilung frei.
- Ideen-Shortlist aus der Session (machbar mit heutiger Datenlage): Charakter-Paare (Ko-Okkurrenz, passt zu W3a), Bewertung nach Format, Meistgelesen-Board (rating_count), Autoren-Debüt-Kurve.
- Blockiert bis Datenlage: Serien-Statistiken (series_id 8/896), Umfangs-Analysen (pageCount 0/896).

## References

- StoryGraph-Stats-Seiten, Reactor „Common Words in Titles", Goonhammer BL Year in Review (Research-Runde für die Akt-Auswahl; Lexicon später wieder gestrichen).
- dataviz-Skill (`references/palette.md`, `scripts/validate_palette.js`) für Palette + Chart-Regeln.
