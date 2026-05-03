---
session: 2026-05-02-034
role: architect
date: 2026-05-02
status: open
slug: phase3a-bulk-backfill-skeleton
parent: null
links:
  - 2026-05-02-031
  - 2026-05-02-032
  - 2026-05-02-033
  - 2026-05-02-021
  - 2026-05-02-022
commits: []
---

# Phase 3 Stufe 3a — Bulk-Backfill-Skeleton (Wikipedia-Discovery + Lexicanum-Crawler + Multi-Source-Engine, Dry-Run)

## Goal

Den ersten atomaren Brick der Phase-3-Bulk-Backfill-Pipeline bauen: ein lokales Crawler-Skeleton, das via Wikipedia-Master-Liste die Roster aller existierenden WH40k-Romane entdeckt (~600–900 Bücher Erwartungswert), pro Buch die Lexicanum-Article via MediaWiki-`api.php` abklappert, die Multi-Source-Merge-Architektur als Engine anlegt (Lexicanum als erste Quelle aktiv, Open Library / Hardcover / LLM kommen in 3b/3c), und einen strukturierten Diff-File produziert. **Schreibt nichts in die DB.** Außerdem mit gefoldet: zwei kleine Daten-Korrekturen am bestehenden Seed (7 Confidence-Werte aus 2b, 5 `series.totalPlanned`-Bugs), die unabhängig von der Pipeline-Architektur Wert haben.

Phase 3a ist der erste von sechs Bricks der Phase-3-Roadmap (3a Skeleton → 3b zusätzliche Quellen → 3c LLM-Anreicherung → 3d Apply-Step → 3e Backfill-Day mit 40er-Test + 800er-Vollauf → 3f Maintenance-Crawler in GH Actions). Die ganze Roadmap steht in Notes; CC sollte sie kennen, damit Architektur-Entscheidungen in 3a die späteren Bricks nicht blockieren.

## Context

- **Strategie-Schwenk gegenüber Brief 031/032 (siehe 033 Retraction).** Cowork hat im Chat mit Philipp am 2026-05-02 den 032-Plan neu aufgerollt. Das Endziel ist nicht „Daily-Drift bei 26 Büchern", sondern „alle ~600–900 WH40k-Romane in der DB". Daraus folgt: **Bulk-Backfill als einmaliger großer Lauf** + **Maintenance-Crawler für neue Releases** als zwei getrennte Operations-Modi. CCs 032-Empfehlung war für ein anderes Problem korrekt; für unseres ist sie nicht das passende Werkzeug.
- **Multi-Source-Merge per Field-by-Field-Source-Priority.** Pro Schema-Feld ist eine Quelle als kanonisch designiert (z.B. `title` aus Wikipedia, `inUniverseYears` aus Lexicanum, `coverUrl` aus Open Library, `rating` aus Hardcover). Wenn eine Quelle ein Feld nicht liefert, übernimmt die nächste in der Priorität. Wenn zwei Quellen widersprechen, gewinnt die mit der höheren Priorität. Kein field-level-confidence-merge, kein additives Sammeln — deterministisch und debuggbar.
- **LLM-Schicht in Phase 3c (nicht 3a).** Anthropic Sonnet 4.6 mit Web-Search wird die paraphrasierte Synopse, Soft-Facet-Vorschläge (Tone, Theme, Entry-Point, Content-Warnings) und einen Plausibilitäts-Cross-Check über die gesamten Datensätze produzieren. Cost-Erwartung: $20–50 für den Initial-Backfill von 800 Büchern, ~Cents pro Monat für Maintenance. **3a baut die Hülle so, dass die LLM-Schicht in 3c sauber andocken kann**, baut sie aber nicht.
- **Backfill läuft lokal über Nacht.** Bei 800 Büchern × 5s Lexicanum-Crawl-Delay + Open-Library/Hardcover-Calls + LLM = ~8–12h. Das passt nicht in eine GH-Action und braucht resumable State (wenn der Lauf abbricht, weiter von wo er war). Maintenance-Crawler in 3f läuft monatlich in GH Actions, da nur ~10 neue Bücher pro Monat anfallen.
- **Hand-kuratierte 26 Bücher sind sakrosankt.** Sie haben heute `sourceKind = 'manual'` und `confidence = 1.00` und werden im Bulk-Backfill via Slug-Match identifiziert und übersprungen. Pipeline-Daten dürfen sie nie überschreiben.
- **Schema-Realität (Korrektur aus 032).** `source_kind` und `confidence` liegen auf `works` (Z. 192–193 in `src/db/schema.ts`), nicht auf `external_links`. Provenance läuft auf Werks-Ebene, nicht pro Link. Per-Link-Provenance wäre eine Phase-3.5-Schema-Erweiterung — nicht jetzt.
- **Wikipedia hat strukturierte Master-Listen.** „List of Warhammer 40,000 novels" plus separate Listen für Horus Heresy, Siege of Terra, Beast Arises etc. sind tabellarisch (Title, Author, Year, Series, Format) und maschinell parse-bar. Lexicanum-Categories sind unstrukturierter; BL-Catalog vermutlich Cloudflare-geschützt. Wikipedia ist die Discovery-Quelle.
- **Lexicanum-Tooling.** Öffentliche MediaWiki-`api.php` (Sandbox-Page existiert), `Crawl-delay: 5` in robots.txt, kein Auth, kein Cloudflare. Cheerio + native fetch (oder Wahl von CC) genügt; kein Playwright.
- **Daten-Korrekturen mit gefoldet.** Die 7 Confidence-Werte aus `docs/data/2b-book-roster.md` § Confidence-Map (`pe01: 0.7`, `gk01: 0.7`, `pm01: 0.7`, `nl01: 0.8`, `bl01: 0.7`, `gh01: 0.7`, `id01: 0.6`) und die 5 bekannten `series.totalPlanned`-Bugs (`gaunts_ghosts`, `ciaphas_cain`, `hh_more` Primarchs, `space_wolves_sw`, `siege_of_terra`) sind unabhängig von der Pipeline-Architektur Wert und gehören in PR #1.

## Constraints

- **Keine DB-Schreib-Operationen aus dem Crawler.** Dry-Run only. Comparator darf DB lesen (um Diff zu berechnen), schreibt nichts.
- **Manual-Protection schon im Dry-Run sichtbar.** Der Comparator soll im Diff-Output unter `skipped_manual: [...]` zeigen, welche Bücher beim späteren Apply geskippt würden — auch wenn 3a keinen Apply hat. Slug-Match gegen `works.source_kind = 'manual'` in der DB.
- **Multi-Source-Engine ist von Anfang an mehr-quellen-fähig.** Die Architektur muss in 3b (Open Library + Hardcover) und 3c (LLM) ohne Refactor erweiterbar sein. Das heißt: Quelle ist ein Interface (`SourceCrawler`), Field-Priority-Map ist eine Konstante, der Merge-Step iteriert über alle aktiven Quellen. In 3a ist nur Lexicanum aktiv — aber die Architektur ist nicht auf Lexicanum hardcoded.
- **Resumable State.** Der CLI-Lauf muss seinen Fortschritt persistent halten (z.B. `ingest/.state/in-progress.json` mit „letzter erfolgreich gecrawlter Slug + Index"). Wenn der Lauf abbricht (Crash, Strom weg, Ctrl-C), startet ein erneuter Aufruf von der Stelle weiter, an der er war. Diese Constraint gilt schon in 3a, weil 3e (Backfill-Day) ohne sie nicht laufbar ist und die Engine sich später schwerer nachrüsten lässt.
- **HTTP-Client-Manieren für Lexicanum.** User-Agent in der Form `ChronoLexicanum/<version> (<repo-URL>; <maintainer-email>)` — CC entscheidet die konkrete Email aus git-config. 5s Crawl-Delay ist hart; Retry max 3× nur auf 5xx; 4xx ist final, kein Retry; Timeout pro Request ≤ 30 s.
- **Daten-Korrekturen sind seed-only, kein Schema-Patch.** Keine Drizzle-Migration in 3a. RawBook-Type bekommt optionales `confidence?: number`-Feld in `seed.ts` selbst.
- **Keine neuen `sourceKind`-Enum-Werte in 3a.** Open Library und Hardcover folgen erst in 3b (dort kommt die ALTER TYPE Migration mit). Lexicanum ist bereits im Enum.
- **Keine Versionsnummern.** CC entscheidet `cheerio` vs. native parsing, `node-fetch` vs. native fetch, etc. — und pinnt selbst.
- **Diff-File ist eine JSON pro Lauf,** nicht eine pro Buch. Form siehe Acceptance.

## Out of scope

- **Open Library Crawler.** Phase 3b. Liefert ISBN, Cover, Page-Count, Pub-Year.
- **Hardcover.app Crawler.** Phase 3b. Liefert Rating, Tags, weiche Mood-Annotationen.
- **LLM-Anreicherungs-Schicht (Sonnet 4.6 + Web-Search).** Phase 3c. Synopsen-Paraphrase, Soft-Facet-Klassifikation, Plausibilitäts-Cross-Check.
- **Apply-Step (Diff → DB-Writes).** Phase 3d. Mit `ON CONFLICT (slug) DO UPDATE … WHERE source_kind != 'manual'`. Bringt UNIQUE INDEX `external_links (work_id, kind, service_id)` und `junctionsLocked: true`-Flag pro Buch mit.
- **Backfill-Day** (40-Buch-Test, dann 800-Buch-Voll-Lauf). Phase 3e — operativer Schritt, kein Code-Output, Philipps Lauf.
- **Maintenance-Crawler in GH Actions.** Phase 3f. Monthly schedule, nur „was ist neu auf Wikipedia seit dem letzten Lauf".
- **Schema-Patch `external_links.source_kind` + `confidence`.** Phase 3.5+, falls per-Link-Provenance je gebraucht wird.
- **`ingestion_runs`-DB-Tabelle.** Operations-Dashboard-Thema in Phase 4.
- **Black Library als aktive Quelle.** Cloudflare-Verdacht (siehe 032 § Open issues #3); wenn überhaupt, dann Phase 3.5+ mit vorheriger Realtest-Session.
- **Carry-over: `book_details.primary_era_idx`.** PR #1 löst keine Migration aus → nicht jetzt. Aufgegriffen wenn 3d-Apply-Step seine Migration mit-bringt.
- **Carry-over: `loadTimeline`-Trim.** PR #1 berührt die Loader nicht → bleibt liegen.
- **Carry-over: `secondary_era_ids`.** Phase-4-Timeline-Reshape.
- **Carry-over: Redirect 307 vs. meta-refresh.** Bleibt liegen (Philipp-Bestätigung 2026-05-02).
- **Refactoring der bestehenden 26 `books.json`-Einträge.** Ausschließlich die 7 Confidence-Annotationen kommen rein; Synopsen, Junctions, Facets unangetastet.
- **Auto-Retry-Logic auf Workflow-Ebene.** Heute genug: manueller Re-Run bei Failures. Phase 3.5+ falls nötig.
- **`workflow_dispatch` oder andere GH-Action-Trigger in 3a.** GH Actions kommt erst in 3f.

## Acceptance

The session is done when:

- [ ] **Daten-Korrekturen sichtbar nach `npm run db:seed && npm run db:studio`:**
  - 7 Bücher mit `confidence < 1.00` (`pe01: 0.7`, `gk01: 0.7`, `pm01: 0.7`, `nl01: 0.8`, `bl01: 0.7`, `gh01: 0.7`, `id01: 0.6`); `sourceKind` bleibt `manual` für alle 7.
  - 5 Series mit korrigiertem `totalPlanned`: `gaunts_ghosts ≥ 16`, `ciaphas_cain ≥ 13`, `hh_more` (Primarchs) `= 14`, `space_wolves_sw = 6`, `siege_of_terra ≥ 8`. Wenn Lexicanum-Cross-Check andere belastbare Werte ergibt, sind die zu nehmen — Abweichung im Report begründen.
- [ ] **Wikipedia-Discovery-Modul** in `src/lib/ingestion/wikipedia/`:
  - `fetch.ts` — holt eine oder mehrere Wikipedia-Listen-Pages (mindestens „List of Warhammer 40,000 novels"; weitere Listen wenn sie sauber parse-bar sind, siehe Open Questions). User-Agent korrekt gesetzt, kein Crawl-Delay nötig (Wikipedia hat hohes Rate-Limit).
  - `parse.ts` — extrahiert pro Tabellen-Zeile Title, Author, Pub-Year, Series, ggf. ISBN, Format. Liefert ein Array von `WikipediaBookEntry`.
  - Liefert insgesamt einen plausibel-vollständigen Master-Roster (Erwartungswert 600–900 Einträge; eine kleinere Zahl wenn nur die 40k-Hauptliste, keine Sub-Listen).
- [ ] **Lexicanum-Crawler-Modul** in `src/lib/ingestion/lexicanum/`:
  - `fetch.ts` — MediaWiki-`api.php`-Client mit User-Agent, 5s Crawl-Delay, retry-on-5xx (max 3), kein retry-on-4xx, Timeout ≤ 30s.
  - `parse.ts` — Cheerio-/HTML-Extractor für mindestens: in-universe Years (M-scale-konvertiert), Faction-Liste, `seriesIndex`. Felder, die nicht sauber extrahierbar sind, bleiben undefined (fail-soft); CC dokumentiert was er erfolgreich/erfolglos extrahiert hat im Report.
  - Discovery-Methode: per Title-Search auf `api.php?action=query&list=search` (Empfehlung CC im Report — siehe Open Questions zur Slug-Discovery).
- [ ] **Multi-Source-Merge-Engine** in `src/lib/ingestion/merge.ts`:
  - Interface `SourceCrawler<TPayload>` (oder ähnlich) mit Methoden zum Crawlen pro Buch.
  - `FIELD_PRIORITY`-Konstante in `src/lib/ingestion/field-priority.ts` — pro Schema-Feld eine Liste prioritisierter Quellen (siehe Field-Priority-Map in Notes als illustrative Vorlage).
  - `mergeBookFromSources(payloads: SourcePayload[])` — iteriert pro Schema-Feld durch die Priority-Liste, nimmt den ersten nicht-undefined Wert, baut den finalen Buch-Record. Konflikte werden im Diff sichtbar gemacht (`field_conflicts: [{ field, sources: [{source, value}] }]`).
- [ ] **Manual-Protection-Comparator** in `src/lib/ingestion/dry-run.ts`:
  - Liest pro Slug aus DB den `works.source_kind` und `works`-Felder.
  - Vergleicht mit dem aus den Quellen gemergten Payload.
  - Markiert Slug-Matches mit `sourceKind = 'manual'` als `skipped_manual`.
  - Berechnet field-by-field-Diff für die Nicht-manual-Bücher.
  - Schreibt das Resultat in eine strukturierte JSON.
- [ ] **CLI** `npm run ingest:backfill -- --dry-run [--limit N] [--slug <slug>] [--source lexicanum]` läuft lokal grün:
  - `--limit N` für Test-Modus (ZB Philipps geplanter `--limit 40`-Test); ohne `--limit` durchläuft die volle Discovery-Liste.
  - `--slug <slug>` für Single-Book-Spotcheck.
  - `--source <name>` (default: alle aktiven, in 3a nur Lexicanum) für Quellen-Subset.
  - Schreibt Diff-JSON nach `ingest/.last-run/backfill-<YYYYMMDD-HHMM>.diff.json`.
  - Hält resumable State in `ingest/.state/in-progress.json` (cleared nach erfolgreichem Lauf-Ende).
- [ ] **Diff-JSON-Schema** mit mindestens diesen Keys: `ranAt`, `discoverySource`, `activeSources: ["lexicanum"]`, `discovered: <count>`, `added: [{ wikipediaTitle, slug, payload }]`, `updated: [{ slug, diff: { field: { old, new } } }]`, `skipped_manual: [{ slug }]`, `skipped_unchanged: [{ slug }]`, `field_conflicts: [{ slug, field, sources: [...] }]`, `errors: [{ slug, source, message }]`. CC darf Sub-Schema verfeinern.
- [ ] **`npm run lint`, `npm run typecheck`, `npm run check:eras`, `npm run build`** laufen alle grün.
- [ ] **Test-Lauf nachweisbar**: CC führt einmal `npm run ingest:backfill -- --dry-run --limit 5` aus und committet das resultierende Diff-File ins Repo (in `ingest/.last-run/`), oder zeigt im Report einen Auszug. Damit ist verifiziert dass das gesamte Skelett tatsächlich läuft.

## Open questions

Inputs für die nächste Cowork-Session, kein Blocker:

- **Wikipedia-Listen-Set.** Welche Wikipedia-Pages sind die richtigen Discovery-Quellen? „List of Warhammer 40,000 novels" allein dürfte unvollständig sein (Horus Heresy steht wahrscheinlich in einer eigenen Liste, Siege of Terra ebenso). CC recherchiert die Liste der Listen und nennt im Report konkret welche Pages er parst und welche nicht (und warum). Ziel: möglichst vollständige Discovery, aber keine massiven Duplikate über Listen hinweg.
- **Slug-Discovery für Lexicanum.** Pro Wikipedia-Eintrag: wie kommt die Pipeline an die Lexicanum-Article-URL? Mein Default-Vorschlag: `api.php?action=query&list=search&srsearch=<title>` und der Top-Treffer; bei mehrdeutigen Treffern (z.B. „Legion" — gibt's auch als Heresy-Roman und als Sci-Fi-Begriff) braucht es Disambiguation-Logik (Author-Match? Year-Match?). CC empfiehlt im Report.
- **Field-Priority-Map: konkrete Verteilung.** Mein Vorschlag steht in Notes als Vorlage. CC darf abweichen, wenn die real-extrahierbaren Felder pro Quelle das nahelegen — Begründung im Report.
- **Resumable-State-Form.** Mein Vorschlag: `ingest/.state/in-progress.json` mit `{ source, lastCompletedSlug, indexInRoster, totalRoster, startedAt }`. CC darf eine andere Form wählen, wenn sie sich aus der Implementierung natürlicher ergibt.
- **Konflikt-Erkennung in der Merge-Engine.** Wann ist ein „field conflict" tatsächlich konfliktreich vs. nur Stilunterschied (z.B. „Eisenhorn: Xenos" vs. „Xenos")? CC darf eine pragmatische Regel definieren (z.B. „nur Konflikt wenn beide Werte non-empty UND sich nicht durch Whitespace/Case-Normalisierung gleichen").

## Notes

### Phase-3-Roadmap (ganze Vision, damit CC weiß wo das hinführt)

| Stufe | Inhalt | Output |
|---|---|---|
| **3a** | Wikipedia-Discovery + Lexicanum-Crawler + Field-Priority-Map + Multi-Source-Engine + Manual-Protection-Comparator + Daten-Korrekturen | Lokal lauffähiges Skeleton, Test-Diff für ~5 Bücher |
| **3b** | Open Library Crawler + Hardcover.app Crawler dazu (gleiche Engine, neue Quellen) | Diff mit Hard-Facts aus 4 Quellen |
| **3c** | LLM-Anreicherungs-Schicht: Anthropic Sonnet 4.6 mit Web-Search; Synopsen-Paraphrase, Soft-Facet-Vorschläge, Plausibilitäts-Cross-Check über alle gesammelten Daten | Diff inkl. paraphrasierter Synopsen + Tag-Vorschlägen |
| **3d** | Apply-Step: Diff-File → DB-Writes mit `ON CONFLICT … WHERE source_kind != 'manual'`. Bringt UNIQUE INDEX `external_links` und `junctionsLocked: true`-Flag pro Buch mit. | DB-Writes funktionieren, Hand-Bücher bleiben sakrosankt |
| **3e** | Backfill-Day: Philipp führt `--limit 40` als Test, prüft Quality, dann volles `--limit 800` über Nacht. Mehrere Auto-PRs in 100er-Batches zur Review. | DB hat ~800 Bücher mit Multi-Source-Daten + LLM-paraphrasierten Synopsen |
| **3f** | Maintenance-Crawler in GH Actions: monatlich, nur Wikipedia-Diff für Neureleases, gleiche Engine-Reuse | Auto-PR pro Monat mit Neueinträgen |

3a ist der Brick, der die Architektur-Hülle setzt. 3b–3f docken an die Hülle an, sollten kein Re-Engineering brauchen.

### Field-Priority-Map (illustrativ — CC darf basierend auf real-extrahierbaren Feldern verfeinern)

| Schema-Feld | Priority-Liste (höchste zuerst) | Rationale |
|---|---|---|
| `works.title` | wikipedia → lexicanum → open_library | Wikipedia ist verlässlichste Title-Kanonisierung |
| `works.synopsis` | llm (in 3c) → null | LLM-paraphrasiert, sonst leer |
| `works.startY` / `endY` | lexicanum → null | In-universe years sind Lexicanum-canonical |
| `works.releaseYear` | wikipedia → open_library → lexicanum | Pub-Year ist Wikipedia-/OL-canonical |
| `works.sourceKind` | (gesetzt von Pipeline auf primärer Quelle) | „lexicanum" wenn LX die meisten Felder lieferte |
| `works.confidence` | (berechnet aus `SOURCE_CONFIDENCE`-Map) | Per-Source-Defaults |
| `works.seriesId` / `seriesIndex` | wikipedia → lexicanum | Wikipedia hat strukturierte Series-Tabellen |
| `book_details.coverUrl` | open_library (in 3b) → null | OL hat ISBN-basierte Covers |
| `book_details.isbn13` / `isbn10` | open_library (in 3b) → wikipedia | OL ist bibliographie-canonical |
| `book_details.pageCount` | open_library (in 3b) → wikipedia | OL präziser |
| `book_details.author` (via persons) | wikipedia → lexicanum | Wikipedia kanonisiert Autor-Namen |
| Junctions (`work_factions`, `work_locations`, `work_characters`) | lexicanum → null | Lore-Daten |
| Soft-Facets (`tone`, `theme`, `entry_point`, `cw_*`) | llm (in 3c) → hardcover (3b) → null | LLM klassifiziert auf 40k-aware Werte |
| `book_details.format` (in 3b) | llm (in 3c) → wikipedia → open_library → null | Werk-Typ-Klassifikation: novel / novella / short_story / anthology / audio_drama / omnibus. Wikipedia ist inkonsistent in der Tagging-Tiefe; LLM ist die belastbare Authority. |
| `book_details.availability` (in 3b) | llm (in 3c) → open_library → hardcover → null | Verfügbarkeits-Status: in_print / oop_recent / oop_legacy / unavailable. Open Library liefert „edition history" als Heuristik-Signal; LLM verifiziert via Web-Search („ist das auf Black Library/Audible/Amazon noch verfügbar"). |
| `external_links` (pro Quelle eine) | (jede Quelle ergänzt ihren eigenen Link) | Additiv, nicht prioritisiert |

In 3a aktiv: nur die `lexicanum`- und `wikipedia`-Slots. Die anderen liefern `undefined`, was in der Merge-Engine als „nicht gesetzt" durchgereicht wird.

### File-Layout-Skizze (illustrativ, nicht bindend)

```
src/lib/ingestion/
  field-priority.ts              ← FIELD_PRIORITY-Konstante (pro Schema-Feld)
  source-confidence.ts           ← SOURCE_CONFIDENCE-Konstante (pro Quelle)
  merge.ts                       ← Multi-Source-Merge-Engine
  dry-run.ts                     ← Comparator (DB-Read + Diff-Compute + Manual-Protection)
  types.ts                       ← Shared types: SourceCrawler<T>, SourcePayload, MergedBook, DiffEntry, …
  wikipedia/
    fetch.ts                     ← Wikipedia-Listen-Page-Fetcher
    parse.ts                     ← Tabellen-Parser für Listen-Einträge
  lexicanum/
    fetch.ts                     ← MediaWiki api.php client
    parse.ts                     ← Cheerio extractor für Article-Box
scripts/
  ingest-backfill.ts             ← CLI entry (npm run ingest:backfill)
ingest/
  .state/
    in-progress.json             ← resumable state (cleared after success)
  .last-run/
    backfill-20260502-2200.diff.json  ← versioned diff per run
```

CC darf das Layout abweichen, wenn ein anderer Schnitt sich aus der Implementierung natürlicher ergibt — die Acceptance-Bullets sind verbindlich, nicht der Pfad.

### LLM-Provider-Setup für Phase 3c (kommt in 3c, hier nur zur Kontext-Setzung)

- **Modell:** Anthropic Sonnet 4.6 mit eingebautem Web-Search-Tool.
- **API-Key:** `ANTHROPIC_API_KEY` in `.env.local` (lokal beim Backfill), in GH-Actions-Secrets (Maintenance-Crawler in 3f).
- **Pricing-Erwartung:** $20–50 für 800 Bücher Initial-Backfill, ~Cents pro Monat Maintenance.
- **Aufgaben pro Buch:**
  - Synopse aus den gecrawlten Roh-Daten paraphrasieren
  - Soft-Facets (`tone`, `theme`, `entry_point`, `cw_*`) auf unsere 40k-spezifischen Werte mappen
  - **`format` klassifizieren** (novel / novella / short_story / anthology / audio_drama / omnibus) — Wikipedia und Open Library sind hier inkonsistent, LLM ist die belastbare Authority
  - **`availability` bestimmen** via Web-Search (in_print / oop_recent / oop_legacy / unavailable) — Open Library liefert Edition-History als Heuristik-Signal, LLM verifiziert auf Black Library / Amazon / Audible
  - Plausibilitäts-Check über die gesamten Datensätze (z.B. „Lexicanum sagt M41.850, 5 andere Quellen sagen M41.700 — flag inconsistency")
- **Test-vor-Voll-Lauf:** Philipps Test ist `--limit 40`. Erst wenn die LLM-Output-Quality reicht (insbesondere für Format/Availability/Synopse), wird `--limit 800` gestartet.

3a baut die Engine-Hülle so, dass die LLM-Schicht in 3c als zusätzlicher `SourceCrawler` (oder als Post-Merge-Schritt — CC darf in 3a entscheiden, was sauberer ist) andocken kann.

### Format und Availability als orthogonale Felder (Hintergrund für 3b/3c)

Eine wichtige semantische Trennung, die in der Pipeline und in der Phase-4-UI durchgehalten werden muss: **Format** (was-für-ein-Werk) und **Availability** (kann-ich-es-noch-bekommen) sind zwei unabhängige Achsen. Eine White-Dwarf-Story von 2024 ist `short_story` aber `in_print`; eine 1996er-Mass-Market-Paperback-Novel ist `novel` aber `oop_legacy`; eine moderne Black-Library-Audio-Drama-Reihe ist `audio_drama` und `in_print`. Beide Felder kommen als Schema-Erweiterung in 3b (Drizzle-Migration mit zwei neuen Enums auf `book_details`), beide werden vom LLM in 3c definitiv klassifiziert. Phase 4 setzt den Default-UI-Filter auf `availability ∈ {in_print, oop_recent}` mit Toggle „auch out of print zeigen" für Sammler.

Diese Felder sind in 3a noch nicht im Schema, aber bereits in der Field-Priority-Map als Future-Slots vermerkt — damit CC bei der Engine-Architektur einkalkuliert, dass weitere Felder in dieser Form dazukommen werden.

### Manual-Protection im Dry-Run

26 Bestands-Bücher haben `sourceKind = 'manual'`. Im Dry-Run-Diff landen sie unter `skipped_manual: [...]` mit einem leeren / informativen Slot. Wenn ein Wikipedia-Eintrag „Eisenhorn: Xenos" auf einen DB-Slug `eisenhorn-xenos` matched, wird der Lexicanum-Crawl trotzdem durchgeführt (für Cross-Check-Visibility), aber der Diff zeigt: „würde im Apply geskippt". Heute sind das alle 26 Treffer — die Pipeline produziert in 3a fast sicher leere `updated`-Listen und ein gefülltes `skipped_manual`. Das ist Erwartung.

### Verbindlichkeit der Architektur

Diese Architektur ist mit Philipp im Cowork-Chat am 2026-05-02 entschieden worden — Bulk-Backfill, Multi-Source-Merge per Field-Priority, lokal-über-Nacht für Initial, GH-Actions monatlich für Maintenance, LLM-Schicht in 3c. CC darf in Implementations-Details abweichen (z.B. native fetch vs. `node-fetch`, abweichendes Diff-Schema solange die Acceptance-Keys da sind). Substantielle Architektur-Abweichungen (anderes Discovery-Modell, andere Merge-Strategie, andere Operations-Trennung) brauchen einen Hinweis im Report mit Begründung — Cowork würde dann re-evaluieren.
