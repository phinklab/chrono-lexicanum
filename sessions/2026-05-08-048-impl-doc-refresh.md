---
session: 2026-05-08-048
role: implementer
date: 2026-05-08
status: complete
slug: doc-refresh
parent: 2026-05-08-048
links:
  - 2026-05-08-047
commits: []
---

# Top-Level-Doku-Refresh (README, ARCHITECTURE, ONBOARDING) — Implementer Report

## Summary

Drei Top-Level-Markdowns auf den aktuellen Phase-3-Stand gebracht (TypeScript statt Python; Phase 3 statt 4; Wikipedia + Lexicanum + Open Library + Hardcover + LLM statt Lexicanum + Goodreads; 26 manuelle Bücher statt „intentionally empty"). Reine Wahrheits-Reparatur, keine inhaltliche Erweiterung. Keine anderen Dateien angefasst.

## What I did

Bundle mit Brief 047 in einer Sitzung; 047-Code-Arbeit zuerst, 048-Doku-Pass danach (so kann die Doku den nach 047 aktuellen Stand beschreiben — Junction-Felder, gehärtete Validation).

### `README.md`

- **Zeile 29** (Code-Block-Kommentar im Local-Development-Snippet) — `Books are intentionally empty in v1 — they arrive in Phase 4 via the ingestion pipeline.` → ersetzt durch eine zwei-zeilige Erklärung dass `db:seed` neben den Reference-Tabellen 26 hand-kuratierte Bücher lädt; die Phase-3-Pipeline (TypeScript, Dry-Run heute) discovert ~700 weitere und backfilled sie sobald 3d Apply-Step landet.
- **Zeile 64** (Roadmap-Inline-Summary) — alte Phasen-Bezeichnung (Phase 3 = book detail pages, Phase 4 = ingestion, Phase 5 = community) ersetzt durch die aktuelle Reshuffle-Form (Phase 3 = ingestion, Phase 4 = discovery layer + detail pages, Phase 5 = Cartographer + Ask the Archive, Phase 6 = community submissions).

### `ARCHITECTURE.md`

- **Zeilen 36–41** (ASCII-Box „ingest/ (Python, Phase 4) - Lexicanum scraper - Goodreads scraper - merge + load to Postgres") — Box-Inhalt ersetzt; ASCII-Frame und Dimensionen unverändert. Neuer Inhalt: TypeScript / P3 / Wikipedia + Lexicanum / Open Library + Hardcvr / LLM enrichment (Haiku) / merge engine, dry-run.
- **Zeile 189** (Decision #7 source_kind) — „When ingestion (Phase 4) ..." → „When ingestion (Phase 3) ..." plus eine kleine Ergänzung dass Phase 3 047 die vier Pipeline-Werte (`wikipedia`, `open_library`, `hardcover`, `llm`) ins DB-Enum gezogen hat.
- **Zeile 219** (Module-map row) — `| `ingest/` *(future, Phase 4)* | Python crawlers + merge/load pipeline |` → `| `ingest/` *(Phase 3, active — dry-run)* | TypeScript: Wikipedia + Lexicanum + Open Library + Hardcover crawlers, multi-source merge engine, LLM enrichment layer (Anthropic Haiku 4.5 + Web Search). Diff JSON committed under `ingest/.last-run/`; apply-to-DB is the 3d step. |`

### `ONBOARDING.md`

- **Zeile 126** (`Done. Inserted 0 books.` Erwartung) — komplett umgeschrieben. Die alte Aussage „intentionally empty" stimmt seit Phase 2b (manueller 26-Bücher-Seed) nicht mehr; der Seed-Output ist tatsächlich eine Sequenz von `Inserted N ...`-Zeilen die mit `Done.` endet. Neuer Text nennt ungefähr was geseedet wird (Eras/Factions/Sectors/Locations/Services/Facets/Persons + ~26 Bücher mit Junctions), zeigt wie man's in Drizzle Studio verifiziert, und verweist für die Phase-3-Pipeline auf `sessions/README.md` als Detail-Quelle.

## Decisions I made

- **Kein Re-Design.** ASCII-Box behält Frame und Spaltenbreite; Tabellen-Spalten in `ARCHITECTURE.md` Module Map und in `README.md` bleiben wie sie sind. Brief war explizit „Wahrheits-Reparatur, nicht Re-Design".
- **Books-Status-Aussage zeitlos formuliert** (per Open-Question-Empfehlung im Brief). „26 hand-curated books" + „~700 more from Wikipedia discovery" sind beide ungefähr-Aussagen, die bis zum 3d-Apply-Step nicht obsolet werden — danach gibt es einen neuen Doku-Refresh-Anlass.
- **Kein Versions-Pinning eingeführt.** Wo das Original Versions nannte, wurden sie auf Family-Niveau gehalten („Anthropic Haiku 4.5" steht im neuen ARCHITECTURE.md-Module-Map; das ist die Modell-Familie nicht eine Patch-Version, und entspricht dem CLAUDE.md-Pinning-Verbot).
- **`scripts/seed.ts` als Wahrheits-Quelle für die Onboarding-Erwartung gelesen.** Die echte Output-Zeile ist `Inserted 26 works (kind=book).` (statt `Inserted 26 books.`), gefolgt von weiteren `Inserted N ...`-Lines und `Done.`. Die Doku-Aussage `series of Inserted N ... lines ending with Done.` ist robust gegen Zahl-Drift wenn der manuelle Seed wächst.

## Verification

- `git diff` post-048-edit zeigt nur `README.md`, `ARCHITECTURE.md`, `ONBOARDING.md` als angefasste Dateien (modulo der 047-Code-Änderungen, die im 047-Commit landen — das 048-Commit-Objekt ist sauber abgegrenzt).
- Manuelles Drüberlesen aller drei Files: keine `Phase 4` / `Python` / `Goodreads` / `0 books`-Reste.
- Markdown rendert in der GitHub-Preview ordentlich — keine kaputten Tabellen, keine kaputten ASCII-Frames.

## Other stale references found while reviewing (NOT fixed in 048)

Per Brief-Scope explicit out-of-scope; hier nur als Notiz für Cowork's Carry-over:

- `CLAUDE.md:33` — Stack-Tabelle „Ingestion" Row sagt noch „Python scripts under `/ingest/`** (Phase 4) | Crawl Lexicanum, Goodreads, Black Library". Falsch in vier Punkten (Python, Phase 4, Goodreads, Black Library nicht aktiv). CLAUDE.md ist explizit out-of-scope für 048; Cowork's Reparatur.
- `CLAUDE.md:99` — Repository-Layout-Comment „ingest/ ← Phase 4: Python crawlers". Selber Befund; out-of-scope.
- `scripts/seed-data/README.md:101` — Comment „Once Phase 4 (the ingestion pipeline) is live, scrapers will write fresh JSON". Phase 3 ist heute live.
- `next.config.ts:7-11` — Goodreads-Image-Domain-Eintrag ist auskommentiert (= korrekt deaktiviert), aber das Comment-Label „Goodreads covers" könnte einen Hinweis auf die 2020-API-Stilllegung kriegen. Cosmetic.
- `.env.example` (Zeilen ~43, 56–57) — referenziert „Sonnet 4.6" als LLM-Default, aber Brief 040 hat den Default auf Haiku 4.5 umgestellt. Versions-Pinning-Policy-Verstoß und Wahrheits-Drift; eigener Mini-Brief-Pfad (entweder `.env.example` aktualisieren ODER besser ohne Versions-Pin formulieren).
- `ROADMAP.md:90` — Phase-3c-Sektion erwähnt „Anthropic Sonnet 4.6"; gleiches Problem.
- `src/app/page.tsx:15` — Code-Comment „unreachable, which is also the current ground truth (Phase 4 ingestion ..." — verifiziert via Grep. Phase 4 → Phase 3.
- Diverse Session-Logs in `archive/` haben „Phase 4 ingestion" / „intentionally empty" / „Inserted 0 books"-Stellen — Historisch korrekt zum Aufnahme-Zeitpunkt; **nicht fixen** (Session-Logs sind Geschichte).

## Open issues / blockers

Keine. Brief 048 grün, keine Folge-Fragen an Cowork.

## For next session

- Ein eigener Mini-Brief „Stale-Reference-Pflege CLAUDE.md + .env.example + ROADMAP.md" wäre eine sinnvolle 1-Stunden-Session, idealerweise zusammen mit der nächsten Modell-Entscheidung (049+); dann ist klar ob `.env.example` auf Haiku 4.5 oder Sonnet zeigt.
- Brief 048 + 047 sind in einer Sitzung gebündelt mit zwei separaten Commits (`Phase 3 047 ...` und `Sessions: 048 doc refresh ...`). Reports linken gegenseitig in `links:`.

## References

- Brief: `sessions/2026-05-08-048-arch-doc-refresh.md`
- Bundle-Partner: `sessions/2026-05-08-047-arch-pipeline-hardening.md` und `sessions/2026-05-08-047-impl-pipeline-hardening.md`
- Aktueller Reshuffle-Stand: `ROADMAP.md` (Plan-Reshuffle-Banner 2026-05-02)
