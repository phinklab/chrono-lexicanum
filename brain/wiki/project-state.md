---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../sessions/2026-05-08-047-arch-pipeline-hardening.md
  - ../../sessions/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/2026-05-08-048-arch-doc-refresh.md
  - ../../sessions/2026-05-08-048-impl-doc-refresh.md
  - ../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../sessions/README.md
  - ../../ROADMAP.md
related:
  - ./pipeline-state.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
confidence: high
---

# Project state — 2026-05-09

> The "where are we now" anchor. Cowork and Claude Code start every session here (after `brain/CLAUDE.md` and `wiki/index.md`).

## Phase

**Phase 3 — Bulk-Backfill-Pipeline (in flight, dry-run).** The TypeScript ingestion pipeline (Wikipedia + Lexicanum + Open Library + Hardcover crawlers + Anthropic Haiku 4.5 LLM-Anreicherung + multi-source merge engine) is wired and produces dry-run diffs. Apply-to-DB (3d) is the next step.

Phases 1 (foundation), 1.1 (stack bumps), 1.5 (build/deploy hygiene), 2 (Chronicle / Timeline), and 3a–3c (pipeline skeleton + aux sources + LLM enrichment) are shipped. Phase 4 (Discovery-Layer) and Phase 5 (Cartographer + Ask the Archive) follow Phase 3. See [`./roadmap.md`](./roadmap.md) for the full phase plan.

The book domain currently holds **26 hand-curated books** in Postgres (Stufe 2b seed, sessions 021/022). The pipeline has discovered ~700 more via Wikipedia, but those are dry-run only — no DB writes have occurred yet from the pipeline.

## Branch

Active branch: `feat/phase-3c-llm-enrichment`. Recent merges into this branch: 047 (pipeline hardening, commit `4da6184`) and 048 (doc refresh) bundle, then 049 (Karpathy-Reset, this session).

## What's running

- **App on Vercel.** Hub + `/timeline` + `/timeline/[era]` + `/buch/[slug]` (DetailPanel) + `/ingest` (Phase 3.5 read-only Diff-Inspector) + `/healthz`. Live: <https://chrono-lexicanum.vercel.app/>.
- **CI on GitHub Actions.** `lint-and-typecheck` job on every PR. Vercel does production builds; CI does *not* run `next build`.
- **DB on Supabase.** Pooler (port 6543) URL in `.env.local`. Migrations 0000–0006 applied. **Migration 0007 (source_kind enum extension for `wikipedia` / `open_library` / `hardcover` / `llm`) committed but NOT applied** — the Apply-Step (3d) is the right context to run it, since enum-add is required only when those sources actually write to DB.
- **Pipeline in dry-run.** `npm run ingest:backfill -- --limit N --offset M` reads from sources, merges, calls LLM, produces a `ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json`. Latest committed: `backfill-20260508-2101.diff.json` (9 books, run aborted by Philipp after Buch 9; post-047 hardening verified).

## Latest pipeline state (post-047)

All five pipeline-hardening levers from 047 are live:

- (A) `source_kind` Pipeline-Enum erweitert um `wikipedia`/`open_library`/`hardcover`/`llm` + `pickPrimarySource(fieldOrigins, payloads)` ersetzt 100%-Wikipedia-Lead.
- (B) Lore-Coverage: Lexicanum-URL-Patterns 3→11 + Opensearch-Fallback. LLM-Tool-Schema bekommt `factionNames`/`locationNames`/`characterNames` als Outputs (Junctions kommen jetzt zu 100% aus dem LLM).
- (C) Format/Availability-Validation in `llm/parse.ts` — Closest-Match-Map (`book→novel`, `short→short_story`) statt Blind-Cast.
- (D) Open Library `language=eng`-Filter + Parse-time-Year-Cross-Check gegen Reissue-Trap.
- (E) Hardcover-Author-Hint im LLM-Prompt für Anthologien (code-verifiziert, **noch nicht empirisch validiert** — siehe Open-Questions).

**Acceptance-Numbers** aus `backfill-20260508-2101.diff.json` (9 Bücher):
- Junction-Coverage: 0/50 (044) → **6/6 = 100%** rein aus LLM-Output. Lexicanum trägt KEINE Junction-Daten bei (Body-Wikitext ist Prosa, nicht Infobox).
- `releaseYear`-Field-Conflicts: 11/15 (044) → **0/0**.
- Format/Availability: 0 invalide Werte.
- Plausibility: 0 `value_outside_vocabulary`-Flags.
- Cost: **$0.114/Buch** (–3% gegen 044's $0.118/Buch).
- `primarySource`-Distribution: 1× `lexicanum`, 5× `llm`, 0× `wikipedia` — die Wikipedia-Branch in `pickPrimarySource` ist effektiv toter Code (Klarstellung, kein Bug; Codex-Finding adressiert).

Detail in [`./pipeline-state.md`](./pipeline-state.md).

## What's open

Top items from [`./open-questions.md`](./open-questions.md):

- **Anthologie-Re-Test für Hebel E** (Tales of Heresy / Mark of Calth / Sons of the Emperor). 047-impl-Lauf brach nach Buch 9 ab; einzige Anthologie wäre Buch 10 gewesen. Hebel E ist code-verifiziert, aber empirischer Test fehlt.
- **Lexicanum-Body-Lore-Pass *oder* FIELD_PRIORITY-Reduktion auf `["llm"]`.** `lexicanum/parse.ts` extrahiert keine Junction-Felder; FIELD_PRIORITY `["lexicanum","llm"]` ist effektiv `["llm"]`. Entweder Body-Wikitext-Walker schreiben (Cheerio-Heuristiken) oder die Priority ehrlich kürzen.
- **Phase-3e-Modell-Entscheidung.** Haiku bleiben vs. Sonnet-Upgrade. 045-Befunde + 047-Hardening-Lauf entscheiden post-047. Cost-Trade-off: Haiku $88 vs. Sonnet ~$250–300 für 750 verbleibende Bücher.
- **Vokabular-Erweiterung.** `duty` (5+ Verstöße kumulativ), `legion`-Faceten-Dimension, `chaos`-pov_side-Pattern.
- **Hand-Check-Workflow + Override-Schema.** Sequenz post-Modell-Entscheidung, vor 3d-Apply.
- **3d-Apply-Step** selbst (FK-Resolution, ALTER TYPE source_kind, UNIQUE INDEX external_links, junctionsLocked).

## What's NOT open in 049

049 is structural-only (Brain + Atlas reset, top-level consolidation, atlas-regen skeleton, cosmetic stale-fixes). **Nothing pipeline / app / DB.** App code, schema, migrations, pipeline modules untouched.

## Recently shipped (session-level)

| Date | Session | Status | Topic |
|---|---|---|---|
| 2026-05-09 | 049-impl | (in flight, this commit) | Karpathy-Reset Brain + Atlas |
| 2026-05-08 | 047 + 048 (Bundle) | implemented (`4da6184`) | Pipeline-Härtung (5 Hebel) + Doku-Refresh (README/ARCHITECTURE/ONBOARDING auf Phase-3-Stand) |
| 2026-05-05 | 044 | complete | Phase 3e Batch 1 (Bücher 41–90, $5.88, 18 LLM-Flags) |
| 2026-05-05 | 045 | complete | Sonnet-Quadrant-Vergleich (B+C) — Pipeline-Author-Mismatch-Befund, Vokabular-Lücken |
| 2026-05-04 | 040 + 041 + 042 + 043 | complete | Haiku-Switch + Prompt-Härtung + Phase 3.5 Ingestion-Dashboard |
| 2026-05-03 | 035 + 037 + 039 | complete | 3a Skeleton + 3b Aux-Sources + 3c LLM-Schicht |

For older sessions and the full chronological log: [`../raw/historical/sessions-readme-log-pre-2026-05-08.md`](../raw/historical/sessions-readme-log-pre-2026-05-08.md) (pre-049 entries) and `sessions/archive/2026-04/`, `sessions/archive/2026-05/`.

## Next likely brief

After 049 lands, the next CC-targeted brief is one of (Cowork's call):

- **Anthologie-Re-Test für Hebel E** — 6-book test (3 anthologies × 2 sources/each), inspect Hardcover-Author-Hint-effect on the `author_mismatch` flag rate. Mini-brief, no DB writes.
- **Lexicanum-Body-Lore-Pass** OR ehrliche FIELD_PRIORITY-Reduktion. Either small code change in `lexicanum/parse.ts`, or a one-line constant edit.
- **Phase-3e Modell-Entscheidung + Vokabular-Erweiterung** as a bundled architect brief. Closes the Haiku-vs-Sonnet question and folds in `duty` / `legion` / `chaos`-pov_side.

Cowork's session-end discipline (post-049): each architect brief and CC report runs through [`./workflows/session-end.md`](./workflows/session-end.md) — update this page, prune `open-questions.md`, write decisions if needed.
