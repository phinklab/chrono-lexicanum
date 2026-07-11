---
title: Wiki index — master catalog
type: reference
created: 2026-05-09
updated: 2026-07-11
sources: []
related:
  - ../CLAUDE.md
  - ./project-state.md
  - ./worklist.md
  - ./log.md
confidence: high
---

# Wiki index

> Master catalog. Read this after top-level `CLAUDE.md` and `brain/CLAUDE.md`, then load only the pages relevant to the task.

## Current-state pages

| Page | Description | Updated |
|---|---|---|
| [project-state.md](./project-state.md) | Pre-launch state: 896 books, 1,114 podcast episodes, 1,055-world Cartographer with Great Journeys/mobile Canvas, preview gate, serial launch mode with canonical plan under `docs/` and closed S0 decisions. | 2026-07-11 |
| [worklist.md](./worklist.md) | Canonical open-work queue: launch sequence (S0 closed), operator checks, product/data tails and long-range blockers. | 2026-07-11 |
| [open-questions.md](./open-questions.md) | Next-session questions: make the launch release order internally consistent (OQ 19) before S1a. | 2026-07-11 |
| [deferred-questions.md](./deferred-questions.md) | Post-launch/dormant work: preview removal, i18n, Atlas events, measured code splitting, secondary Eras, redirect and dependency triggers. | 2026-07-10 |
| [roadmap.md](./roadmap.md) | Phase-level status and launch milestones; old crawler subphases pruned to history. | 2026-07-10 |

## System pages

| Page | Description | Updated |
|---|---|---|
| [architecture.md](./architecture.md) | Current app/DB/cache/content architecture, sources of truth, frontend surfaces and deployment model. | 2026-07-10 |
| [pipeline-state.md](./pipeline-state.md) | Living per-book, podcast-delta, weekly-refresh, apply/verify and Cartographer data paths; V1/V2 engines retired. | 2026-07-10 |
| [book-data-overview.md](./book-data-overview.md) | High-level corpus numbers and canonical shape; no per-book lore. | 2026-07-10 |
| [glossary.md](./glossary.md) | Active project terminology: schema, per-book operations, Cartographer/Great Journeys, preview/snapshot and memory model. | 2026-07-10 |
| [onboarding.md](./onboarding.md) | First-time local/Supabase/Vercel/Atlas setup, including full-corpus `db:sync`. | 2026-07-10 |
| [log.md](./log.md) | Append-only Brain operation history. | 2026-07-11 |
| (this file) | Complete wiki catalog. | 2026-07-11 |

## Decisions

| Page | Decision | Updated |
|---|---|---|
| [decisions/launch-single-worktree-mode.md](./decisions/launch-single-worktree-mode.md) | Temporary serial launch execution from Coordination; strand-pure PRs and normal routing return afterward. | 2026-07-10 |
| [decisions/book-reviewer-no-apply-path.md](./decisions/book-reviewer-no-apply-path.md) | Reviewer findings require an explicit hand-curation gate; no automatic apply path. | 2026-06-24 |
| [decisions/cross-era-identities.md](./decisions/cross-era-identities.md) | One canonical identity across eras; names/titles live in aliases unless genuinely distinct. | 2026-05-27 |
| [decisions/faction-policy.md](./decisions/faction-policy.md) | Browse roots, alignment policy and redundant grand-alignment junction skipping. | 2026-05-16 |
| [decisions/location-policy.md](./decisions/location-policy.md) | Location umbrella surface-form skip policy and audit buckets. | 2026-05-19 |
| [decisions/hardcover-to-goodreads-pivot.md](./decisions/hardcover-to-goodreads-pivot.md) | Historical rating-source pivot; crawler path is now retired. | 2026-05-20 |
| [decisions/no-goodreads.md](./decisions/no-goodreads.md) | Original Goodreads rejection, later amended for rating lookup. | 2026-05-20 |
| [decisions/why-cc-direct-curation.md](./decisions/why-cc-direct-curation.md) | Historical shift from V2 LLM stage to direct reviewed curation; engine later removed. | 2026-05-15 |
| [decisions/why-excel-ssot-not-crawl.md](./decisions/why-excel-ssot-not-crawl.md) | Maintainer roster replaced discovery crawl; later evolved into per-book SSOT. | 2026-05-10 |
| [decisions/why-sonnet-not-haiku.md](./decisions/why-sonnet-not-haiku.md) | Historical model-quality choice before the LLM engine retirement. | 2026-05-15 |
| [decisions/why-haiku-not-sonnet.md](./decisions/why-haiku-not-sonnet.md) | Superseded historical cost/quality decision retained for continuity. | 2026-05-13 |
| [decisions/why-bulk-backfill.md](./decisions/why-bulk-backfill.md) | Historical batched-backfill decision; live maintenance is per-book + weekly. | 2026-05-09 |
| [decisions/why-multi-source-merge.md](./decisions/why-multi-source-merge.md) | Historical field-by-field source-priority architecture. | 2026-05-09 |
| [decisions/why-drizzle-supabase.md](./decisions/why-drizzle-supabase.md) | Stack, ID split and M-scale foundation. | 2026-05-09 |
| [decisions/plan-reshuffle-2026-05-02.md](./decisions/plan-reshuffle-2026-05-02.md) | Ingestion before Discovery; Cartographer/Ask moved into Phase 5. | 2026-05-09 |
| [decisions/karpathy-reset-2026-05-08.md](./decisions/karpathy-reset-2026-05-08.md) | Brain/Atlas split and Karpathy-style engineering wiki. | 2026-05-09 |

## Workflows

| Page | Description | Updated |
|---|---|---|
| [workflows/cc-session.md](./workflows/cc-session.md) | Implementer workflow, PR ownership and temporary serial launch exception. | 2026-07-10 |
| [workflows/sessions-format.md](./workflows/sessions-format.md) | Session naming/frontmatter/lifecycle/archive rules, including `superseded`. | 2026-07-10 |
| [workflows/cowork-session.md](./workflows/cowork-session.md) | Architect workflow and PR/rollup ownership. | 2026-06-25 |
| [workflows/session-end.md](./workflows/session-end.md) | Post-report ingest and always-read pruning discipline. | 2026-06-01 |
| [workflows/ingest.md](./workflows/ingest.md) | Fold new sources into current wiki synthesis. | 2026-05-09 |
| [workflows/query.md](./workflows/query.md) | Answer from the wiki with source-aware fallbacks. | 2026-05-09 |
| [workflows/lint.md](./workflows/lint.md) | Brain lint categories, budgets and `--no-write` CI mode. | 2026-05-09 |
| [workflows/atlas-regen.md](./workflows/atlas-regen.md) | Regenerate the external Postgres→Obsidian mirror. | 2026-05-09 |

## Outside the wiki

- Raw immutable sources: [`../raw/`](../raw/)
- Generated lint outputs: [`../outputs/`](../outputs/)
- Session history: [`../../sessions/`](../../sessions/)
- Per-work domain mirror: external `chrono-atlas` vault, loaded only on explicit request
