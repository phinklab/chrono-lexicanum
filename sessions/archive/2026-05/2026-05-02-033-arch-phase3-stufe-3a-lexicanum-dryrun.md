---
session: 2026-05-02-033
role: architect
date: 2026-05-02
status: archived
slug: phase3-stufe-3a-lexicanum-dryrun
parent: 2026-05-02-032
links:
  - 2026-05-02-031
  - 2026-05-02-032
  - 2026-05-02-034
commits: []
---

> **⚠ ZURÜCKGEZOGEN — vor Handover an CC.**
>
> Dieser Brief wurde nie an Claude Code übergeben. Im Cowork-Chat-Verlauf nach dem Schreiben hat Philipp die fundamentalen Strategie-Annahmen hinterfragt und das Brainstorming gemeinsam mit Cowork neu aufgerollt. Das hat die Pipeline-Architektur substanziell verändert:
>
> - **Bulk-Backfill** statt Daily-Drift-Crawler (Endziel: alle ~600–900 WH40k-Romane einmalig holen, danach Maintenance-Crawler nur für neue Releases)
> - **Wikipedia-Master-Liste** als Discovery-Quelle (nicht durch Lexicanum-Title-Search alleine)
> - **Multi-Source-Merge per Field-by-Field-Source-Priority** statt Single-Source-per-Work
> - **LLM-Anreicherungs-Schicht** (Anthropic Sonnet 4.6 mit Web-Search) für Synopsen-Paraphrase, Soft-Facet-Klassifikation und Plausibilitätscheck
> - **Lokal-über-Nacht-Backfill** statt GH-Actions-Cron für den Initial-Lauf; GH Actions kommt erst für den monatlichen Maintenance-Crawler
>
> Reflektion zur Rollenverteilung: Brief 031 hatte CC den Architektur-Brainstorm machen lassen, das war außerhalb von Cowork's Rolle. Das Strategie-Brainstorming gehört in Cowork↔Philipp-Konversation, CC bekommt nur den implementierungsreifen Brief.
>
> **Der aktuelle Plan lebt in Brief 034.** Inhalt unten bleibt zur Nachvollziehbarkeit stehen.
>
> ---

# Phase 3 Stufe 3a — Lexicanum Dry-Run + Confidence-Aktivierung *(zurückgezogen)*

## Goal

Ein PR mit acht atomaren Bausteinen, der die Phase-3-Pipeline-Architektur aus dem 032-Brainstorm in laufenden Code überführt — **ohne in die DB zu schreiben**. Drei davon sind reine Daten-Korrekturen am Seed (7 Confidence-Werte aus 2b + 5 `series.totalPlanned`-Bugs + Source-Confidence-const), fünf sind die Lexicanum-Crawler-Pipeline plus operative Hülle (fetch/parse/dry-run-Module, CLI, GH-Action mit Daily-Dry-Run, Status-File, README-Badge). PR-1-Risiko ist niedrig, weil die DB-Schreib-Hälfte (Apply-Step) explizit erst PR #2 ist.

## Context

- **032-Report ist Architektur-Grundlage.** CCs opinionated Empfehlung wurde von Philipp 1:1 übernommen, mit drei Klärungen aus dieser Cowork-Session: PR-1-Scope = alle 8 Bausteine atomar; Diff-Push-Modus = Auto-PR pro Drift; Cron-Frequenz = Daily 04:00 UTC. Achsen 1/2/4/5/6 aus dem Report sind verbindlich.
- **Schema-Korrektur aus 032 § Open issues #1.** Brief 031 § Context behauptet, `external_links` habe `source_kind`/`confidence`-Spalten. Stimmt nicht — die Spalten liegen auf `works` (siehe `src/db/schema.ts` Z. 192–193). Konsequenz: Pipeline tracked Provenance pro Werk, nicht pro External-Link. Per-Link-Provenance wäre eine Phase-3.5-Schema-Erweiterung (`external_links.source_kind` + `confidence` nachziehen), **nicht in PR #1**.
- **DB-Stand heute.** 26 hand-kuratierte Bücher, alle mit `sourceKind = 'manual'` und `confidence = 1.00`. Die 7 editorial-unsichereren Datierungen aus `docs/data/2b-book-roster.md` § Confidence-Map sind im Roster-Doc dokumentiert, aber nicht in der DB aktiviert. PR #1 ändert die seed-Quelle, sodass beim nächsten `npm run db:seed` die korrigierten Werte landen — die DB selbst wird nicht direkt patched.
- **Quelle für PR #1: Lexicanum.** Public MediaWiki `api.php` (Sandbox dokumentiert), `User-agent: *` mit `Crawl-delay: 5` in `robots.txt`, kein Auth, kein Cloudflare-Schutz. Tooling: Cheerio + native fetch (oder node-fetch — CCs Wahl). Playwright nicht nötig.
- **Trigger für PR #1: GitHub Actions Scheduled Workflow.** Repo `phinklab/chrono-lexicanum` ist seit 2026-05-01 public → unlimited free Actions-Minuten, 6h-Job-Timeout. Daily-Status-File-Commit hält das Repo aktiv (60-Tage-GH-Disable-Trip-Wire wird nie greifbar — die Action selbst ist die Aktivität).
- **Out-of-scope-Carry-over.** Vier Carry-over-Items aus README („secondary_era_ids", Redirect 307/meta-refresh, `book_details.primary_era_idx`, `loadTimeline`-Trim) berühren Bereiche, die PR #1 nicht anfasst. Sie bleiben ausdrücklich liegen — siehe „Out of scope" unten für Begründung pro Item.

## Constraints

- **Keine DB-Schreib-Operationen aus dem Crawler.** Dry-Run only. Comparator darf DB lesen (um Diff zu berechnen), schreibt nichts.
- **Manual-Protection schon im Dry-Run sichtbar machen.** Der Comparator soll im Diff-Output unter `skipped_manual_locked: [...]` aufführen, welche Bücher beim späteren Apply geskippt würden. Auch wenn PR #1 keinen Apply hat — die Logik existiert hier schon, der Diff zeigt sie ehrlich an.
- **HTTP-Client-Manieren.** User-Agent in der Form `ChronoLexicanum/<version> (<repo-URL>; <maintainer-email>)` (CC entscheidet die konkrete Email — aus git-config oder neue dedizierte). 5s Crawl-Delay ist hart einzuhalten. Retry max 3× nur auf 5xx; 4xx ist final, kein Retry. Timeout pro Request ≤ 30 s.
- **Daten-Korrekturen sind seed-only, kein Schema-Patch.** Keine Drizzle-Migration in PR #1. Wenn der RawBook-Type ein optionales `confidence?: number`-Feld bekommt, geschieht das in `seed.ts` selbst, nicht via Migration.
- **GH-Action permissions:** scope-restricted via `permissions:`-Block (mindestens `contents: write`, `pull-requests: write`, `issues: write`). Kein default-`GITHUB_TOKEN`-Vollzugriff.
- **Keine Versionsnummern.** CC entscheidet `cheerio` vs. native parsing, `node-fetch` vs. native fetch, etc. — und pinnt selbst.
- **Keine neuen `sourceKind`-Enum-Werte in PR #1.** Open Library / Hardcover folgen erst in PR #3, dort kommt die ALTER TYPE Migration mit. Lexicanum ist bereits im Enum.
- **Cron-Spec exakt:** `'0 4 * * *'` (Daily 04:00 UTC). Keine andere Frequenz, kein Multi-Cron-Block.

## Out of scope

- **Apply-Step.** Der `--apply <diff.json>`-Befehl, der die Diff-JSON in DB-Writes übersetzt. Ist PR #2.
- **`junctionsLocked`-Flag pro Buch.** Wird erst beim Apply-Step gebraucht (um Hand-Junctions vor Pipeline-Re-Crawl zu schützen). PR #2.
- **Schema-Patch `external_links.source_kind` + `confidence`.** Phase 3.5.
- **UNIQUE INDEX `external_links (work_id, kind, service_id)`.** Phase 3.5 (gehört konzeptuell zum Apply-Step der External-Links).
- **Open Library / Hardcover.app / Black Library Crawler.** PR #3 / PR #4. Lexicanum allein ist PR #1.
- **`ingestion_runs`-DB-Tabelle.** Operations-Dashboard ist Phase-4-Discovery-UI-Thema.
- **Discord-Webhook bei Failure.** Optional, nicht jetzt. GH-Auto-Email + Auto-Issue + README-Badge reichen.
- **Auto-Retry-Logic im Workflow** (z.B. „Retry once after 5 min if first run fails"). Phase 3.5; manuelles Re-Run via Actions-UI ist heute genug.
- **Andere `series.totalPlanned`-Bugs jenseits der 5 bekannten.** Pipeline soll die später automatisch finden, sobald sie Lexicanum-Series-Pages crawlen kann (PR #2 oder PR #3).
- **Carry-over: `book_details.primary_era_idx`.** PR #1 löst keine Migration aus → der Index wird **nicht** mit-erledigt. Bleibt im Carry-over.
- **Carry-over: `loadTimeline`-Trim.** PR #1 berührt die Loader nicht → bleibt im Carry-over.
- **Carry-over: `secondary_era_ids text[]`.** Phase-4-Timeline-Reshape, nicht hier.
- **Carry-over: Redirect 307 vs. meta-refresh nach `loading.tsx`.** Bleibt liegen (Philipp-Bestätigung 2026-05-02).
- **Refactoring der bestehenden 26 Bücher in `books.json`.** Ausschließlich die 7 confidence-Annotationen kommen rein; weder Synopsen noch Junctions noch Facets werden angefasst.
- **Editorial-Tone/-Theme/-CW-Auto-Tagging via Lexicanum.** Subjektive Facets bleiben Hand-Editorial. Pipeline berührt sie nicht — auch nicht im Dry-Run.

## Acceptance

The session is done when:

- [ ] **Daten-Korrekturen sichtbar nach `npm run db:seed && npm run db:studio`:**
  - 7 Bücher mit `confidence < 1.00` (`pe01: 0.7`, `gk01: 0.7`, `pm01: 0.7`, `nl01: 0.8`, `bl01: 0.7`, `gh01: 0.7`, `id01: 0.6`); `sourceKind` bleibt `manual` für alle 7.
  - 5 Series mit korrigiertem `totalPlanned`: `gaunts_ghosts ≥ 16`, `ciaphas_cain ≥ 13`, `hh_more` (Primarchs) `= 14`, `space_wolves_sw = 6`, `siege_of_terra ≥ 8`. (Wenn Lexicanum-Cross-Check andere Werte ergibt, sind die belastbare Quelle — siehe Notes.)
- [ ] **Source-Confidence-Map** als typed const in `src/lib/ingestion/source-confidence.ts`. Mindestens `manual: 1.00`, `lexicanum: 0.90`, `black_library: 0.85`. `open_library` und `hardcover` als kommentierte Future-Werte (in Erwartung der ALTER TYPE Migration in PR #3).
- [ ] **Lexicanum-Skeleton** in `src/lib/ingestion/lexicanum/`:
  - `fetch.ts` — MediaWiki-`api.php`-Client mit User-Agent (Format siehe Constraints), 5 s Crawl-Delay, retry-on-5xx (max 3), kein retry-on-4xx.
  - `parse.ts` — Cheerio-/HTML-Extractor für **mindestens** in-universe-Years, Faction-Liste, `seriesIndex`. Weitere Felder (Pub-Year, Author, Cover-URL, ISBN) sind nice-to-have, wenn sie ohne Mehraufwand mitfallen.
  - `dry-run.ts` (oder ein generic `src/lib/ingestion/dry-run.ts`) — Diff-Computer: liest DB-Stand pro Werk, vergleicht mit Crawl-Payload, schreibt strukturierte Diff-JSON.
- [ ] **CLI** `npm run ingest:lexicanum -- --dry-run [--slug <slug>]` läuft lokal grün, schreibt eine Diff-JSON nach `ingest/.last-run/lexicanum-<YYYYMMDD-HHMM>.diff.json`. Single-Slug-Modus für Spot-Check; ohne `--slug` läuft die volle 26-Buch-Liste.
- [ ] **Diff-JSON-Form** enthält mindestens: `source`, `ranAt`, `added: []`, `updated: [{ slug, diff: { field: [old, new] } }]`, `skipped_manual_locked: []`, `skipped_unchanged: []`, `errors: []`. (CC darf das Schema verfeinern, solange diese Keys da sind.)
- [ ] **GH-Action** `.github/workflows/ingest-lexicanum.yml`:
  - `schedule: - cron: '0 4 * * *'`
  - Job ruft `npm run ingest:lexicanum -- --dry-run` auf
  - Bei non-empty Diff: committet auf Branch `ingest/auto/<YYYY-MM-DD>` und öffnet PR mit Titel `Lexicanum drift <YYYY-MM-DD>` via `gh pr create`
  - Bei error: öffnet GitHub-Issue mit Tag `ingest-failure` (auto-closes bei nächstem grünen Run — zweiter Step)
  - `permissions:` scope-restricted (`contents: write`, `pull-requests: write`, `issues: write`)
- [ ] **Status-File** `ingest/.state/last-run.json` mit Form `{ source, completedAt, booksTouched, errors, diffFile }`. Wird nach jedem erfolgreichen Run committet (das ist auch die GH-60d-Disable-Mitigation — der tägliche Commit zählt als Repo-Aktivität).
- [ ] **README-Badge** für die Workflow-Status oben in `README.md` (Workflow-Badge-URL: `https://github.com/phinklab/chrono-lexicanum/actions/workflows/ingest-lexicanum.yml/badge.svg`).
- [ ] `npm run lint`, `npm run typecheck`, `npm run check:eras` und `npm run build` laufen alle grün.
- [ ] **Erste reale GH-Action-Iteration nach Merge** läuft grün durch. Entweder: leere Diff (dann nur Status-File-Commit) oder Drift-PR. Verifizierung: ein Screenshot/Link in Reports „Verification".

## Open questions

Inputs für die nächste Cowork-Session, kein Blocker:

- **Lexicanum-Slug-Discovery.** Wie findet die Pipeline die Lexicanum-Article-URL pro Buch? Jedes der 26 Bücher hat schon einen Lexicanum-`external_link` in `seed.ts` (siehe `2b-book-roster.md` Quellen-Liste) — nehmen wir die als Source of Truth, oder muss der Crawler den Title via `api.php?action=query&list=search` matchen? Empfehlung im Report.
- **Diff-JSON-Form: field-by-field vs. full-payload-snapshot.** Field-by-field (`{ "title": ["alt", "neu"] }`) ist menschen-lesbarer in PR-Reviews; full-payload-snapshot ist Maschinen-besser für den Apply-Step. CCs Empfehlung?
- **Lexicanum-Felder-Mapping auf Schema.** Welche Lexicanum-Felder mappen 1:1 (Title, Author-Name, Pub-Year), welche brauchen Konvertierung (Lexicanum-Datumstrings wie „998.M30" → unser numerischer M-scale), welche werden in PR #1 bewusst ignoriert (Cover-URL, ISBN — gehören eher zu Open Library)?
- **Fehlertoleranz beim Parsing.** Wenn `parse.ts` ein Feld in einer Article-Box nicht findet (Lexicanum-Template inkonsistent) — fail-loud (Error in der Diff), oder fail-soft (Feld leer lassen, Warning loggen)? Beides hat Sinn; Empfehlung im Report.

## Notes

### Brief-031-Schema-Korrektur (Phrasing-Fix)

Brief 031 § Context behauptet `external_links` habe `source_kind`/`confidence`-Spalten. Tatsächlich liegen die auf `works` (`src/db/schema.ts` Z. 192–193). Pipeline-Provenance läuft pro Werk, nicht pro Link — bewusste Entscheidung, kein Bug. Pro-Link-Provenance ist eine Phase-3.5-Schema-Erweiterung. Dieser Brief korrigiert die Phrasierung implizit: das Diff-JSON-Schema und die `SOURCE_CONFIDENCE`-const operieren auf Werks-Ebene, nicht auf Link-Ebene.

### Confidence-Werte aus 2b

Quelle: `docs/data/2b-book-roster.md` § Confidence-Map (Zeilen 322–337). Die 7 Werte sind editorial-Unsicherheit beim Datierungs-Anker (Cowork hat sich beim in-universe-Year weniger fest gefestigt), kein Provenance-Wechsel. `sourceKind` bleibt `manual` für alle 7; nur `confidence` weicht vom Default 1.00 ab.

Aktivierungs-Pfad (CCs Vorschlag aus 032 § Achse 3 übernehmen): `RawBook`-Interface in `seed.ts` bekommt ein optionales `confidence?: number`; die 7 Bücher in `books.json` bekommen ihre Werte; Works-Insert nutzt `confidence: b.confidence?.toFixed(2) ?? "1.00"`.

### `series.totalPlanned`-Korrekturen

In `scripts/seed-data/series.json` zu pflegen, `seed.ts` liest unverändert. Bekannte Ziel-Werte (CC darf cross-checken):

- `gaunts_ghosts`: 4 → **16** (Sabbat Worlds Crusade, ohne Spin-offs)
- `ciaphas_cain`: 3 → **13** (Cain-Hauptreihe inkl. neuerer Bände)
- `hh_more` (Primarchs): 4 → **14** (vollständige Primarchs-Reihe)
- `space_wolves_sw`: 4 → **6** (Ragnar-Saga)
- `siege_of_terra`: 5 → **8** (8 nummerierte Hauptromane plus End-and-the-Death-Splits)

Wenn CCs Lexicanum-Recherche hier andere Werte ergibt, sind die belastbare Quelle — bitte Abweichung im Report begründen.

### Manual-Protection im Dry-Run

Der Comparator soll bereits jetzt `works.source_kind`-Lookup machen. Wenn ein gecrawltes Buch in der DB `source_kind = 'manual'` hat, landet es im Diff-Output unter `skipped_manual_locked: [...]` mit dem ausgerechneten Diff (zur Information), aber ohne ihn als `updated` zu markieren. So sieht Philipp im Diff-Review: „diese 5 Bücher würden im Apply-Step übersprungen, weil sie hand-kuratiert sind". Heute sind das alle 26 — die Pipeline produziert in PR #1 also fast sicher leere `updated`-Listen und ein gefülltes `skipped_manual_locked`. Das ist Erwartung, kein Bug.

### File-Layout-Skizze (illustrativ, nicht bindend)

```
src/lib/ingestion/
  source-confidence.ts           ← typed const
  dry-run.ts                     ← generic differ (Werks-Diff-Compute)
  lexicanum/
    fetch.ts                     ← MediaWiki api.php client
    parse.ts                     ← cheerio/HTML extractor
scripts/
  ingest-lexicanum.ts            ← CLI entry (zu npm run ingest:lexicanum)
ingest/
  .state/
    last-run.json                ← status (committed nach jedem grünen Run)
  .last-run/
    lexicanum-20260502-0400.diff.json  ← diff (committed nur bei non-empty)
.github/workflows/
  ingest-lexicanum.yml           ← daily 04:00 UTC, dry-run + auto-PR
```

CC darf das Layout abweichen, wenn ein anderer Schnitt sich aus der Implementierung natürlicher ergibt — die Acceptance-Bullets sind verbindlich, nicht der Pfad.

### Verbindlichkeit der CC-Empfehlung

Die 032-Report-Empfehlungen aus Achsen 1, 2, 4, 5, 6 sind 1:1 übernommen. Cron-Frequenz, Diff-Push-Modus und PR-1-Scope wurden mit Philipp bestätigt. CC darf in Implementations-Details abweichen (z.B. native fetch statt `node-fetch`, abweichendes Diff-Schema solange die Acceptance-Keys da sind, andere Datei-Layouts solange die `npm run`-Skripte stimmen). Substantive Architektur-Abweichungen (anderer Trigger als GH Actions, anderer Dry-Run-Modus als JSON-Diff-File) brauchen einen Hinweis im Report mit Begründung — Cowork würde dann re-evaluieren.

### Folge-Briefs (Skizze)

- **PR #2 (Brief 034 oder später) — Apply-Step.** Liest die Diff-JSON, schreibt mit `ON CONFLICT (slug) DO UPDATE … WHERE works.source_kind != 'manual'`. Bringt `junctionsLocked`-Flag pro Buch und UNIQUE INDEX `external_links (work_id, kind, service_id)` mit.
- **PR #3 — Open Library + Hardcover.app.** ALTER TYPE `source_kind` ADD VALUE `'open_library'`, `'hardcover'`. Open Library füllt ISBN/Cover/Pub-Year, Hardcover füllt Rating/Tags. Goodreads bleibt auf der „Phase-3.5-Friedhof"-Liste.
- **PR #4 oder Phase 3.5 — Black Library.** Vorsichtig, mit Cloudflare-Realtest vorab (siehe 032 § Open issues #3). Scope auf Synopsis-Cross-Check + Format-Tags begrenzen.
- **Phase 3.5 — Schema-Patch.** `external_links.source_kind` + `confidence` (für Per-Link-Provenance), `ingestion_runs`-DB-Tabelle (für Operations-Dashboard in Phase 4).
