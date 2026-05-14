---
title: Wiki index — master catalog
type: reference
created: 2026-05-09
updated: 2026-05-14
sources: []
related:
  - ../CLAUDE.md
  - ./project-state.md
  - ./log.md
confidence: high
---

# Wiki index

> Master catalog. Every wiki page with one-line description + `updated` date. Cowork and Claude Code read this **third** on session start (after top-level [`/CLAUDE.md`](../../CLAUDE.md) and [`../CLAUDE.md`](../CLAUDE.md)). Use it to pick the 2–4 pages relevant to a query — don't brute-force load the whole tree.

Updated whenever Ingest adds/edits a page; see [`./workflows/session-end.md`](./workflows/session-end.md). Read the [`./log.md`](./log.md) operation log for chronological history.

## Overview pages (start here)

| Page                                             | Description                                                                                                                 | Updated    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [project-state.md](./project-state.md)           | "Where are we now": phase, what's running, what's next likely brief. Session-start anchor. Post-074-arch: 150 W40K-Bücher applied, dritte Resolver-Welle offen; Green Tide ist Roster-Lücken-Handoff statt Cross-Batch-Stresstest. | 2026-05-15 |
| [open-questions.md](./open-questions.md)         | Items the next architect brief must address. Post-074-arch: OQ9 closed/folded, OQ2-(c) moot post-CC-Direct-Curation; Restqueue Brief 074, Loop-Resume, OQ3/OQ6. | 2026-05-15 |
| [deferred-questions.md](./deferred-questions.md) | Dormant / distant questions that aren't queue-relevant. Promoted back to `open-questions.md` when their trigger fires. Post-074: ergänzt um `chaos`-pov_side-Promote-Pass als moot/deferred. | 2026-05-15 |
| [architecture.md](./architecture.md)             | High-level system shape, schema overview, module map, key types/enums, conventions inherited from top-level CLAUDE.md.      | 2026-05-09 |
| [roadmap.md](./roadmap.md)                       | Phased plan (1–7) with status per phase + sub-phase breakdown for Phase 3 + Ideas Backlog.                                  | 2026-05-09 |
| [onboarding.md](./onboarding.md)                 | First-time setup (local install + GitHub + Supabase + Vercel + optional Obsidian for Atlas).                                | 2026-05-09 |
| [pipeline-state.md](./pipeline-state.md)         | Phase-3 pipeline detail: V1 legacy + V2 SSOT authority path + resolver layer. Post-072: `ssot-w40k-001..010` applied, zweite Resolver-Welle plus Cross-Batch-`applyCollections`-Refactor sind durch, Authority-Junctions stehen bei 650/239/475/35. *(Inhaltliches Update steht aus — nächste Cowork-Session.)* | 2026-05-13 |
| [book-data-overview.md](./book-data-overview.md) | High-level book-data numbers (26 manuals heute, 859 SSOT-Roster ab 058, ~$0.114/book V1 / $0.0199/Buch V2 fresh-Smoke). NOT atlas — pointer to atlas for per-book detail. | 2026-05-09 |

## Decision pages (ADRs with revisit-triggers)

| Page | Decision | Decided | Updated |
|---|---|---|---|
| [decisions/faction-policy.md](./decisions/faction-policy.md) | Browse-Root vs. Tree-Root getrennt: Policy lebt in `scripts/seed-data/faction-policy.json` (16 Browse-Roots, `imperium` als Grand-Alignment-Exception), `factions.parent_id` weiter Single-Parent. `factions.json` audit-patched (Chaos-Rename + 14 Reparents), `brain:lint` neue Kategorie. | 2026-05-13 | 2026-05-13 |
| [decisions/why-sonnet-not-haiku.md](./decisions/why-sonnet-not-haiku.md) | Supersedes Haiku-Default: Pipeline-Enrichment soll mit Sonnet (current major) laufen, weil Cockpit-Audit Datenqualitaets-Pathologien sichtbar macht und der Cost-Aufschlag im Hobby-Rahmen tragbar bleibt. | 2026-05-13 | 2026-05-13 |
| [decisions/why-excel-ssot-not-crawl.md](./decisions/why-excel-ssot-not-crawl.md) | Discovery-Stage durch Maintainer-kuratierte Excel-SSOT ersetzt (859 Bücher + 191 Collections, deterministischer Loader → `book-roster.json`). Crawler bleiben im Code, ab Brief 058 nicht mehr Default-Eingang | 2026-05-10 | 2026-05-10 |
| [decisions/karpathy-reset-2026-05-08.md](./decisions/karpathy-reset-2026-05-08.md) | Brain (`brain/` in repo) + Atlas (external Obsidian vault, `~/chrono-atlas/`) — Karpathy LLM Wiki pattern, domain-split | 2026-05-08 | 2026-05-09 |
| [decisions/why-drizzle-supabase.md](./decisions/why-drizzle-supabase.md) | Next.js + TS + Tailwind + Drizzle + Supabase + Vercel + custom M-scale + string IDs / UUIDs split | 2026-04-28 | 2026-05-09 |
| [decisions/no-goodreads.md](./decisions/no-goodreads.md) | Drop Goodreads (API discontinued 2020); use Open Library + Hardcover.app instead | 2026-05-02 | 2026-05-09 |
| [decisions/why-bulk-backfill.md](./decisions/why-bulk-backfill.md) | Bulk-backfill (lokal über Nacht, resumable, batched) + monthly maintenance, NOT daily-drift | 2026-05-02 | 2026-05-09 |
| [decisions/why-multi-source-merge.md](./decisions/why-multi-source-merge.md) | Field-by-field source priority (deterministic, debuggable, source-aware), NOT first-source-wins / consensus | 2026-05-02 | 2026-05-09 |
| [decisions/plan-reshuffle-2026-05-02.md](./decisions/plan-reshuffle-2026-05-02.md) | Phase 3 ↔ 4 swap; EntryRail dropped; Cartographer + Ask the Archive moved to Phase 5 | 2026-05-02 | 2026-05-09 |
| [decisions/why-haiku-not-sonnet.md](./decisions/why-haiku-not-sonnet.md) | Superseded by Sonnet-current-major decision; retained as story-continuity stub for the 2026-05-04 Haiku cost/quality trade-off. | 2026-05-04 | 2026-05-13 |

## Workflow pages

| Page | Description | Updated |
|---|---|---|
| [workflows/cowork-session.md](./workflows/cowork-session.md) | What Cowork (architect) does each session; rules, tools, push-back patterns | 2026-05-09 |
| [workflows/cc-session.md](./workflows/cc-session.md) | What Claude Code (implementer) does each session; version-research workflow, report tone | 2026-05-09 |
| [workflows/sessions-format.md](./workflows/sessions-format.md) | Session log format: naming, frontmatter, status lifecycle, brief/report sections | 2026-05-09 |
| [workflows/session-end.md](./workflows/session-end.md) | Cowork's discipline post-CC-report (replaces pre-049 infrastructure-log discipline) | 2026-05-09 |
| [workflows/ingest.md](./workflows/ingest.md) | Karpathy operation 1/3: how new material flows into wiki synthesis pages | 2026-05-09 |
| [workflows/query.md](./workflows/query.md) | Karpathy operation 2/3: how to answer questions against the wiki | 2026-05-09 |
| [workflows/lint.md](./workflows/lint.md) | Karpathy operation 3/3: drift checks. `npm run brain:lint` (script: `scripts/brain-lint.ts`); CI runs `--no-write`. | 2026-05-09 |
| [workflows/atlas-regen.md](./workflows/atlas-regen.md) | When/how to run `npm run atlas:regen`; vault-path config; discrepancy handling | 2026-05-09 |

## Reference pages

| Page | Description | Updated |
|---|---|---|
| [glossary.md](./glossary.md) | Project-specific terms (M-scale, source_kind, work_facets, primaryEra, llm_flags, junctionsLocked, batched-3e, …) | 2026-05-09 |
| [log.md](./log.md) | Append-only operation log (chronological history of Brain edits) | 2026-05-14 |
| (this file) | Master catalog | 2026-05-14 |

## Concept pages

(none planned in 049 — folded into glossary entries; if a glossary entry grows past ~3 sentences, it becomes a `concepts/<slug>.md` page in a future Ingest pass)

## Source-summary pages

(none — `raw/` files have their own banners; `wiki/` doesn't carry source-summary pages today)

## Outside the wiki

- **Raw sources** (immutable): [`../raw/historical/`](../raw/historical/), [`../raw/reviews/`](../raw/reviews/). Files there have `snapshot-*` or `review-*` frontmatter banners. Latest reviews: `2026-05-09-brain-structure-review.md` (Karpathy-Reset audit), `2026-05-09-codex-v2-pilot-review.md` (V2-Pipeline + Faction-Repräsentation).
- **Outputs** (generated, not part of executable knowledge): [`../outputs/lint/`](../outputs/lint/) for lint reports.
- **Sessions** (project history; raw form): top-level [`../../sessions/`](../../sessions/). Linked from wiki pages via `sources:` frontmatter.
- **Atlas** (external Obsidian vault, book domain): `~/chrono-atlas/` (default). Generated via `npm run atlas:regen`. **Never auto-loaded** — see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).

## Read-order on session-start

1. Top-level [`/CLAUDE.md`](../../CLAUDE.md) — auto-loaded; stack + conventions + version policy
2. [`../CLAUDE.md`](../CLAUDE.md) — Brain schema (Karpathy frame, three operations, frontmatter)
3. **This file** (master catalog)
4. [`./project-state.md`](./project-state.md) — "where are we now"
5. [`./open-questions.md`](./open-questions.md) — what's queued
6. Whatever's relevant to today's task (pull from this catalog by topic)

## Notes on sources

This catalog is a roll-up of every page under `brain/wiki/`; it has no external sources of its own (`sources: []`). Source-chains live on the pages it indexes.
