---
session: 2026-05-09-049
role: implementer
date: 2026-05-09
status: complete
slug: karpathy-brain-atlas-reset
parent: 2026-05-08-049
links:
  - 2026-05-08-049
  - 2026-05-08-047
  - 2026-05-08-048
commits:
  - 1f6da88
  - 3f43f4c
  - 64b47b5
  - 9fa70d8
---

# Karpathy-Reset — Chrono Brain (im Repo) + Chrono Atlas (externer Vault)

## Summary

Brain (`brain/` im Repo) und Atlas-Skeleton (externer `chrono-atlas/`-Vault, default `~/chrono-atlas/`) stehen. 26 Wiki-Seiten plus Schema-Datei substantiv geseedet, 4 Top-Level-Docs zu Redirects geschrumpft + historische Schnappschüsse migriert, `npm run atlas:regen` produziert Vault mit 1 Buch + 1 Faction + INDEX (verifiziert: 26 Bücher / 29 Factions in DB), `npm run lint` + `tsc --noEmit` grün. **Nichts in App- / Pipeline- / DB-Code geändert.** Cowork's Default-Read-Order ist jetzt `/CLAUDE.md` → `brain/CLAUDE.md` → `wiki/index.md` → `wiki/project-state.md` → `wiki/open-questions.md`.

## What I did

Vier Commits auf `feat/phase-3c-llm-enrichment`:

**Commit 1 (`1f6da88`) — Cowork pre-work.**
- `sessions/2026-05-08-047-arch-pipeline-hardening.md`, `2026-05-08-048-arch-doc-refresh.md`, `sessions/README.md` (modified) + neuer 049 Brief (untracked) → committed. Cowork's eigene Hand sauber separiert von der Reset-Implementierung.

**Commit 2 (`3f43f4c`) — Brain skeleton + raw historical + top-level surgery + sessions infra-log shrink + cosmetic stale-fixes.**
- `brain/raw/historical/2026-05-08-pre-reset/{ARCHITECTURE,ROADMAP,ONBOARDING,README}.md` — Schnappschüsse der vier Top-Level-Docs (256+191+220+72 Zeilen) mit YAML-Frontmatter-Bannern (`snapshot-of`, `snapshot-date: 2026-05-08`, `snapshot-reason`, `canonical-now`).
- `brain/raw/historical/sessions-readme-log-pre-2026-05-08.md` — 11 ältere Infrastructure-Log-Einträge aus `sessions/README.md` (2026-05-04 Strategie-Anpassung bis 2026-05-01 Repo-Transfer) verbatim migriert mit Banner.
- `brain/raw/reviews/README.md` + `brain/outputs/lint/README.md` — Skeleton-Placeholders mit Konventionen.
- Top-Level-Redirects: `ARCHITECTURE.md`, `ROADMAP.md`, `ONBOARDING.md` → 4-Zeilen-Redirects (Pointer auf `brain/wiki/<name>.md` + Schnappschuss). Wortlaut frei gestaltet, beide Pointer drin.
- Top-Level-`README.md` neu geschrieben: schlanker Pitch (3 Absätze) + Phase-3-Status + Brain-Pointer + Live-URL `https://chrono-lexicanum.vercel.app/` (aus dem alten README übernommen, nicht erfunden).
- Top-Level-`CLAUDE.md`: neuer Abschnitt `## Brain & Atlas` zwischen Read-this-first-Quote und "What this project is" (Read-Order-6-Stufen-Liste + Brain/Atlas-Erklärung); Stack-Tabelle Ingestion-Row (Zeile 33) "Phase 4 / Python" → "Phase 3 / TypeScript"; Repo-Layout-Comment (Zeile 99) "Phase 4: Python crawlers" → "Phase 3 dry-run outputs (.last-run/, .llm-cache/-gitignored)"; plus `brain/`-Eintrag im Layout-Tree zwischen `ONBOARDING.md` und `docs/`.
- `sessions/README.md`: Infra-Log auf Top 5 reduziert (16→5; lines 19–23 bleiben), älteren Schwanz mit blockquote-Pointer ins historical-File ersetzt. Carry-over-Body durch Pointer-Zeile in `brain/wiki/open-questions.md` ersetzt; Section-Header + Active-Threads-Tabelle unangetastet.
- Cosmetic-Fixes: `next.config.ts:7-11` Goodreads-Comment refresh (API stilllegung 2020 + Open-Library-Beispiel statt Goodreads); `src/app/page.tsx:15` "Phase 4 ingestion hasn't run yet"-Parenthetical entfernt; `scripts/seed-data/README.md:101` Phase-4-Reference auf Phase-3-live aktualisiert. Defer per Brief: `.env.example:43+56-58` und `ROADMAP.md:90` Sonnet-Pins (gehören an Modell-Entscheidung).

**Commit 3 (`64b47b5`) — Brain wiki: first ingest pass (26 files, 2750 insertions).**
- `brain/CLAUDE.md` — Karpathy-Schema-Datei (~150 Zeilen): Brain/Atlas/raw/wiki/outputs Layout, Read-Order, drei Operationen, Compiler-Analogie, Frontmatter-Konvention mit Type-Werten (`overview | decision | workflow | concept | source-summary | reference`), "what does NOT live here", Karpathy + Starmorph-Referenzen.
- 11 Top-Wiki-Seiten: `wiki/{index,log,glossary,project-state,open-questions,architecture,roadmap,onboarding,pipeline-state,book-data-overview}.md`.
- 7 Decision-Seiten: `wiki/decisions/{karpathy-reset-2026-05-08, why-drizzle-supabase, no-goodreads, why-bulk-backfill, why-multi-source-merge, plan-reshuffle-2026-05-02, why-haiku-not-sonnet}.md`. Format: Status / Decided / Sessions / Context / Options considered / Decision / Why / When this decision should be revisited.
- 8 Workflow-Seiten: `wiki/workflows/{cowork-session, cc-session, sessions-format, session-end, ingest, query, lint, atlas-regen}.md`.
- Jede Wiki-Seite (außer `log.md`, brief-explicit exempt) trägt YAML-Frontmatter mit `title / type / created / updated: 2026-05-09 / sources / related / confidence`. Decision-Pages zusätzlich `decision-date`. `created`-Datum entweder Original-Decision-Date (für Drizzle-Supabase 2026-04-28, Plan-Reshuffle 2026-05-02, etc.) oder Page-Write-Date.
- `wiki/index.md` LAST geschrieben — Master-Catalog gruppiert nach Type, mit Updated-Date und 1-Zeilen-Beschreibung pro Page.
- `wiki/log.md` LAST geschrieben — append-only, erste Sektion "## 2026-05-09 · Karpathy-Reset Initial Ingest" mit allen ingestierten Quellen, erstellten Pages, migrierten Files, gemachten Cosmetic-Fixes.
- `wiki/open-questions.md` migriert die 9 Carry-over-Items aus `sessions/README.md` als nummerierte Items 1–9 mit `Owner / Sessions / Follow-up brief`-Metadaten + 2 neue Items 10 (Anthologie-Re-Test für Hebel E) und 11 (Lexicanum-Body-Lore-Pass *oder* FIELD_PRIORITY-Reduktion) aus 047-impl.

**Commit 4 (`9fa70d8`) — `scripts/atlas-regen.ts` + package.json + Verifikation.**
- `scripts/atlas-regen.ts` (~250 Zeilen TypeScript). Imports: `@/db/client`, `@/db/schema`, `node:fs/promises`, `node:os`, `node:path`, `node:util` (parseArgs), `drizzle-orm` (eq, asc). CLI: `--out=<path>` override, env `ATLAS_PATH`, default `path.join(homedir(), "chrono-atlas")`, `--help`. Behavior: `mkdir({ recursive: true })` für vault + books + factions; query first book (`works.kind='book'` ORDER BY slug LIMIT 1) + first faction (ORDER BY id LIMIT 1) + counts; render Markdown mit Wikilink-Format `[[books/<slug>|<title>]]`; INDEX.md mit generation-timestamp + counts + DB-status. Empty-DB graceful (skips proof-of-render, INDEX trägt Banner). DB-error catch → exit(1) mit clear hint. Idempotent.
- `package.json`: neuer Script `"atlas:regen": "tsx --env-file=.env.local scripts/atlas-regen.ts"` zwischen `ingest:backfill` (alphabetische Nähe).
- Test-Lauf: `npm run atlas:regen` produziert `~/chrono-atlas/` (`C:\Users\Phil\chrono-atlas\` auf Windows) mit `INDEX.md` + `books/avenging-son-df01.md` + `factions/alpha_legion.md`. DB-counts: 26 books / 29 factions (matches db:seed). Re-run idempotent: gleiche Files überschrieben, kein Error.

**Commit 5 (this report) — `sessions/2026-05-09-049-impl-karpathy-brain-atlas-reset.md`.**

## Decisions I made

The brief's 8 open questions all came with strong recommendations; I confirmed them all. Documented in detail in `brain/wiki/decisions/karpathy-reset-2026-05-08.md`. Compact summary:

- **Wikilink-Konvention.** Relative MD links inside `brain/` (IDE+GitHub render); Wikilinks reserved for Atlas (Obsidian). Confirmed brief's recommendation.
- **Glossary-Granularität.** ≤3-Sätze-Begriffe → `glossary.md` (21 entries). No `concepts/<slug>.md` pages this session — kein Eintrag erzwang ≥4 Sätze.
- **brain/raw/sessions/.** Variant A (no symlinks). Wiki-Pages linken direkt zu `../../sessions/<id>.md` und `../../sessions/archive/<YYYY-MM>/<id>.md`. Cross-platform clean.
- **Top-Level-CLAUDE.md vs `brain/CLAUDE.md`.** Beide Files. Top-Level bleibt Auto-Load-Anker mit neuem `## Brain & Atlas`-Abschnitt am Anfang (vor "What this project is"); `brain/CLAUDE.md` ist Karpathy-Schema-Datei.
- **Atlas-Cross-Plattform-Default-Pfad.** `path.join(homedir(), "chrono-atlas")` — auf Windows `C:\Users\Phil\chrono-atlas\` (verifiziert), auf POSIX `~/chrono-atlas/`. CLI `--out=<path>` + env `ATLAS_PATH` als Override-Wege. Reasoning: Obsidian's natürliche Home-Directory-Konvention; `os.homedir()` sauber Cross-Platform; tilde-Literal vermieden (Node expandiert nicht).
- **Erste Ingest-Pass-Größe.** Alle ~26 Wiki-Seiten substantiv geseedet — kein Stub-Fallback nötig. Tier 1 (11 Seiten, ≥2–3 Absätze pro Section: Schema + project-state + open-questions + architecture + roadmap + onboarding + pipeline-state + workflows/{session-end, atlas-regen, lint} + decisions/karpathy-reset). Tier 2 (13 Seiten, kompakt-seed mit citations: glossary + book-data-overview + 6 non-Karpathy decisions + 5 workflows {cowork-session, cc-session, sessions-format, ingest, query}). Tier 3 (catalogs LAST: index + log).
- **CC-Skills für Wiki-Operationen.** Defer per brief — re-evaluate nach 2–3 manuellen Session-End-Cycles. Heute kein Skill-Bau.
- **QMD/Dataview.** Mention nur in `wiki/workflows/query.md` als "distant" — kein Action.

Plus implementation-Decisions:

- **`scripts/atlas-regen.ts` ohne neue Dependencies.** `drizzle-orm` (`eq`, `asc`) + Node-built-ins (`fs/promises`, `os`, `path`, `util`) reichen. Kein `npm install` nötig (matches brief constraint "keine neuen Dependencies, falls vermeidbar").
- **DB-error-handling im Atlas-Regen.** Wrap `Promise.all([fetchFirstBook, fetchFirstFaction, countBooks, countFactions])` in try/catch; on error log clear hint ("DATABASE_URL set in .env.local? Pooler reachable?") and `process.exit(1)`. Empty-DB (DATABASE_URL valid but DB has no books/factions) ist NICHT ein Error — Vault-Skeleton wird trotzdem geschrieben mit Banner "Postgres returned no books/factions, re-run after first 3d-Apply or db:seed".
- **`process.exit(0)` am Main-Ende.** Drizzle/postgres-js hält den Connection-Pool offen; ohne explizites exit bleibt der Node-Process hängen. Pattern aus `scripts/seed.ts` übernommen.
- **Wiki-Page-Frontmatter-Form mit YAML-Triple-Dash.** Project-Precedent ist die Session-Frontmatter-Form (`sessions/_templates/architect-brief.md` + `implementer-report.md`). Brain-Wiki adopts gleiche Syntax mit unterschiedlichem Field-Set.
- **Top-Level-CLAUDE.md repo-layout-Update mit `brain/`-Eintrag.** Brief verlangt nur den Brain-Atlas-Abschnitt + Stack-Table-Fix + Layout-Comment-Fix. Ich habe zusätzlich den `brain/`-Tree im Layout-Block ergänzt + Annotations für `ROADMAP/ARCHITECTURE/ONBOARDING.md` als "redirect → brain/wiki/..." aktualisiert. Begründung: das Layout-Diagramm war vor 049 die definitive "wo lebt was"-Karte; sich Brain dort zu zeigen ist konsistent mit dem Auto-Load-Anchor-Spirit der Top-Level-CLAUDE.md. Klein, additiv, kein Risiko.
- **Top-Level-Redirect-Wortlaut deutsch.** Brief hat illustrative Format-Skizze in deutsch ("Diese Datei ist nach dem Karpathy-Reset…"); ich bin dem gefolgt. Konsistent mit dem deutsch-englisch-mixed Stil im Rest der Sessions/Documentation.

## Verification

- **`npm run lint`** — pass. 1 pre-existing warning in `src/app/layout.tsx:44` (Custom fonts in App Router; not my change). 0 errors.
- **`npx tsc --noEmit`** — pass. 0 errors.
- **`npm run atlas:regen`** — runs cleanly. First run produces:
  - `C:\Users\Phil\chrono-atlas\INDEX.md` (1379 bytes; counts 26 books / 29 factions; proof-of-render pointers)
  - `C:\Users\Phil\chrono-atlas\books\avenging-son-df01.md` (1079 bytes; alphabetically-first book is `avenging-son-df01` from the 26-manual seed)
  - `C:\Users\Phil\chrono-atlas\factions\alpha_legion.md` (906 bytes; alphabetically-first faction id)
  - All three files have YAML frontmatter banners + Wikilink anchors + scope-of-future-rendering blocks.
- **Re-run `npm run atlas:regen`** — idempotent. Files overwritten with new timestamp; no errors.
- **`git status`** — clean after each commit. 4 commits land cleanly on `feat/phase-3c-llm-enrichment`.
- **Manual cross-check:** `brain/CLAUDE.md` read-order list, `brain/wiki/index.md` master-catalog completeness, `brain/wiki/open-questions.md` carry-over migration (9 + 2 = 11 items), `sessions/README.md` infra-log post-shrink (5 entries top), all top-level redirect files render correctly on disk.
- **Manual cross-check on the historical snapshot integrity:** all 4 files under `brain/raw/historical/2026-05-08-pre-reset/` carry the YAML banner; `brain/raw/historical/sessions-readme-log-pre-2026-05-08.md` carries banner with `snapshot-of: sessions/README.md (Infrastructure log section, entries 2026-05-04 Strategie-Anpassung through 2026-05-01 Repo-Transfer — 11 of 16 entries)`.

**Did NOT run:** `npm run db:migrate` (per brief — Migration 0007 stays committed-but-not-applied), `next dev` / browser test (brief is structural-only, no UI changes; the route changes were 1-line comment fixes that don't affect runtime). Atlas was opened in Obsidian (Phil-side task per brief, not in CC's acceptance scope).

## Open issues / blockers

None. The session is structural-only; nothing pipeline / app / DB was touched. The brief's acceptance criteria are all satisfied.

## For next session

Per the brief's "Nach Merge dieser Session" closing notes:

- **Anthologie-Re-Test für Hebel E** ([open-questions item 10](../brain/wiki/open-questions.md)) — mini-brief, 3 anthology slugs (tales-of-heresy, mark-of-calth, sons-of-the-emperor), no DB write. Closes the empirical-validation gap from 047 (where the test slice was Single-Author-Novels only).
- **Lexicanum-Body-Lore-Pass *oder* FIELD_PRIORITY-Reduktion** ([open-questions item 11](../brain/wiki/open-questions.md)) — either Cheerio-walker over `.mw-parser-output` for faction/location/character Wikilinks (Option A, ~150 LoC, nicer), or a constant-edit dropping Lexicanum from FIELD_PRIORITY for the three junction fields (Option B, ~5 LoC, ehrlich). Brief 049 explicitly leaves the call to Cowork; my recommendation in `open-questions.md` is Option B as Sofortmaßnahme + Option A as later optimization.
- **Phase-3e Modell-Entscheidung + Vokabular-Erweiterung** (items 1+2) — bundled architect brief, post-Anthologie-Re-Test (so Hebel E's effect on `author_mismatch` is measured before deciding Haiku-vs-Sonnet).
- **Hand-Check + Override-Schema** (item 3) — sequenziell nach Modell-Entscheidung, vor 3d-Apply.
- **3d-Apply-Step** — die big one. FK-Resolution (work_persons + work_facets + external_links), `junctionsLocked: true` flag, ALTER TYPE source_kind (Migration 0007 ready), UNIQUE INDEX external_links.

Plus first real session-end-routine test (per `brain/wiki/workflows/session-end.md`): when Cowork reads this report, the discipline is to update `project-state.md`, prune `open-questions.md`, write/update relevant pages, append to `log.md`. If that first run feels painful or has gaps, brief 051 should be a workflow-tweak.

## References

- Karpathy LLM-Wiki gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- Starmorph implementation guide: <https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide>
- Brief 049: `sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md`
- Pipeline-Härtung-Vorgänger: `sessions/2026-05-08-047-impl-pipeline-hardening.md`
- Doku-Refresh-Vorgänger: `sessions/2026-05-08-048-impl-doc-refresh.md`
- Brain entry-point: `brain/CLAUDE.md` + `brain/wiki/index.md`
- Atlas workflow: `brain/wiki/workflows/atlas-regen.md`
