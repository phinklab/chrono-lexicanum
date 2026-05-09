---
title: Why bulk-backfill, not daily-drift
type: decision
created: 2026-05-02
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-02-031-arch-phase3-ingestion-brainstorm.md
  - ../../../sessions/archive/2026-05/2026-05-02-032-impl-phase3-ingestion-brainstorm.md
  - ../../../sessions/archive/2026-05/2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md
  - ../../../sessions/archive/2026-05/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md
related:
  - ./why-multi-source-merge.md
  - ./no-goodreads.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-02
---

# Why bulk-backfill (with monthly maintenance), not daily-drift

**Status:** active · **Decided:** 2026-05-02 · **Sessions:** [031](../../../sessions/archive/2026-05/2026-05-02-031-arch-phase3-ingestion-brainstorm.md), [032-impl](../../../sessions/archive/2026-05/2026-05-02-032-impl-phase3-ingestion-brainstorm.md), [033 (retracted)](../../../sessions/archive/2026-05/2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md), [034](../../../sessions/archive/2026-05/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md)

## Context

Phase 3 began as a brainstorm (brief 031). 032-impl's research pass + opinionated empfehlung suggested **a daily-drift crawler**: poll Lexicanum + Wikipedia daily, pick up a small number of changed-or-new books, write incrementally to DB. Brief 033 was scoped against that recommendation.

In Cowork-Chat with Philipp 2026-05-02, the fundamental assumption was challenged: **"What's the actual goal — drift on the 26 manual books, or all ~800 W40k novels?"** Once the answer was clear (~800 novels, eventually), daily-drift's small-batch model is the wrong shape.

## Options considered

- **A — Daily-drift crawler.** Brief 033's original frame. Polls daily for changes, writes small increments. Fits if the goal is "keep the existing 26 books drift-free". **Rejected** because it doesn't get us to ~800 books — at 1–2 books/day the backfill takes 1–2 *years*.
- **B — One-shot 800-book overnight crawl.** Run the full pipeline once, write all 800 to DB. Simple, cheap, done in 38h. **Rejected** because (i) Philipp doesn't want his PC running 38h, (ii) no quality-gate between the crawl and DB (one bad source-pattern = 800 broken rows), (iii) the LLM-cost spike is ~$88 in one shot (low risk but not iterative).
- **C ✅ chosen — Bulk-Backfill (lokal über Nacht, resumable State) + Maintenance-Crawler (monatlich, GH Actions).** Run the full backfill once *as a one-time event*, with resumable state so it can split across multiple sessions (Strategie-Anpassung 2026-05-04 made this 8–16 sessions à 50–100 books). Maintenance handles the long tail of new releases via a monthly GH-Action that only crawls Wikipedia for *new* books.

## Decision

Two-mode pipeline:

- **Bulk-Backfill** (sub-phases 3a → 3b → 3c → 3.5 dashboard → 3d Apply → 3e Voll-Lauf in batches → 3f maintenance setup). Single owner: Philipp's local machine, Cowork-supervised. Output: ~800 books in Postgres with multi-source provenance.
- **Maintenance-Crawler (3f)**. GH-Actions monthly cron, Wikipedia-Diff for new releases only. Same engine, smaller scope. Runs unattended.

Brief 033 was **retracted before handover** with a Retraction-Banner; brief 034 was opened to start 3a from the new vision.

## Why

- **Endziel ist ~800 Bücher, nicht 26.** Daily-drift can't get us there in any reasonable time.
- **One-shot overnight has no quality gate.** A bad URL-pattern in Lexicanum or a typo in field-priority would silently corrupt 800 rows. Bulk-Backfill in 50-book batches with diff-inspection-between (Phase 3.5 Dashboard) catches issues in the 50–100 range, not the 800 range.
- **Philipp's PC is not a server.** 38h of overnight crawling is too long for a desktop running other things. Batched-3e (Strategie-Anpassung 2026-05-04) gets the same outcome with better operational ergonomics.
- **Maintenance is the natural follow-up.** Once the 800-book backfill is done, the operational reality changes — you only ever scrape new releases (~10–20/year). Monthly cron beats daily polling at zero-marginal-cost.
- **Bulk has a natural quality boundary** at the LLM enrichment step. The dry-run + LLM-flag triage workflow lets Cowork inspect every batch before deciding to apply. Daily-drift would either slow Cowork down (review every day) or skip the review entirely (rubber-stamp).

## When this decision should be revisited

- **After 3e completes** (~all 800 books in DB). Maintenance shifts from theoretical to operational. If maintenance-crawl proves unreliable (Wikipedia format changes, GH-Action timeouts), revisit and consider weekly local maintenance with a script we trust.
- **If the source-set changes substantially.** Adding Black Library Shop (currently Cloudflare-blocked) would add a polling axis that's more naturally daily-drift than monthly-bulk. The decision could split: bulk for Wikipedia/Lexicanum, drift for BL.
- **If the project pivots away from "complete archive" into "curated reading list"** (~150 books rather than ~800). Then daily-drift becomes viable again.

## Aftermath

The two-mode design has held through 3a–3c, 3.5, 044, 045, 047. The Strategie-Anpassung 2026-05-04 (8–16 batches instead of one overnight) is a refinement of bulk-backfill, not a re-evaluation. 3d-Apply is the next blocker; 3e Batched is in progress (Batch 1 / N at 044); 3f Maintenance-Crawler is queued post-3e.

The retracted Brief 033 + the post-retraction Brief 034 transition is the cleanest demonstration of the decision in the project history — Cowork's mid-conversation re-evaluation produced a substantively different architecture in <24h.
