---
title: "Hardcover → Goodreads — the rating-source pivot"
type: decision
created: 2026-05-20
updated: 2026-05-20
sources:
  - ../../../sessions/2026-05-20-086-arch-hardcover-hit-rate-pass-2.md
  - ../../../sessions/2026-05-20-086-impl-hardcover-hit-rate-pass-2.md
  - ../../../sessions/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md
related:
  - ./no-goodreads.md
  - ./why-multi-source-merge.md
  - ../workflows/cowork-session.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-20
---

# Hardcover → Goodreads — the rating-source pivot

**Status:** active · amends the rating half of [`./no-goodreads.md`](./no-goodreads.md) · **Decided:** 2026-05-20 · **Sessions:** [086-arch](../../../sessions/2026-05-20-086-arch-hardcover-hit-rate-pass-2.md), [086-impl](../../../sessions/2026-05-20-086-impl-hardcover-hit-rate-pass-2.md)

## Context

A book's rating is three `book_details` fields: `rating` (0–5), `ratingCount`, `ratingSource`. Three briefs chased Hardcover.app as the source:

- **Brief 075** — first backfill, 77/150 = 51.3 %.
- **Brief 085** — title-normalization layer, 79/200 = 39.5 % (Hardcover's API was unstable that day).
- **Brief 086** — Pass 2: a six-stage match cascade, author-normalization, a graphql-error retry pass, and CC-direct WebSearch overrides. Endstand **116/200 = 58.0 %** — still under the 70 % target, classified "< 60 % hard signal."

Brief 086's miss diagnosis was decisive: of 62 researched misses, ≈ 42 are present-but-unrated or not-on-Hardcover at all — a genuine catalogue gap. **No matching layer conjures data the source does not have.** Hardcover's *rated* W40K catalogue is structurally thin.

Brief 086 Phase 4 spot-tested a different source: a per-book web search for the Goodreads rating. On the 81 books Hardcover could not rate it resolved **78 (96.3 %)**, lifting DB rating coverage to **197/200 (98.5 %)**. The three stragglers are 2025/26 releases too recent for an aggregated rating.

## Decision

**Goodreads replaces Hardcover as the rating source going forward.** The Hardcover hit-rate line of work (briefs 075 / 085 / 086, OQ (10)) is closed — not because it succeeded, but because the goal it served (good rating coverage) was reached another way. The Open-Library fallback and the slug/ID Stage-6 follow-up that Brief 086 floated are **struck**, not deferred.

The rating is read **from the Goodreads book page, never from the search snippet.** Brief 086 Phase 4 found search snippets unsafe as a data source: ≈ 20 % carried no number, and ≈ 4 % carried a plausible-but-wrong number (Shadowsun snippet 4.25 vs. real 3.62; Catachan Devil 4.5 vs. 4.11; Duty Calls 4.5 vs. 4.19). The web search *locates* the page; the page *is* the source.

Existing ratings stay as written — `ratingSource` already distinguishes `hardcover` (119 rows) from `goodreads` (78). Mixed-source is acceptable; re-fetching the 119 Hardcover rows for uniformity is make-work. All new ratings are `goodreads`.

## Why

- **Source coverage beats matching machinery.** The blocker was never title/author matching — it was that Hardcover has no rating for a large share of W40K novels. Goodreads, the largest reader-review database, does.
- **The simple thing won.** One per-book web search read 96.3 % on exactly the hardest residual — the books Hardcover failed. Three briefs of normalization and override machinery reached 58 %. This is the [`../workflows/cowork-session.md`](../workflows/cowork-session.md) § "Simplest thing first" lesson, paid for in full.
- **Page-parse, not snippet.** The one non-negotiable carried forward into every Goodreads consumer (pipeline, refresh button): the rating comes from the page; the snippet is only a locator.
- **The API objection no longer bites.** [`./no-goodreads.md`](./no-goodreads.md) dropped Goodreads because the *API* was discontinued (2020) and bulk *scraping* is ToS-fraught and brittle. Neither applies here: this is a low-volume, per-book page read (≈ 10 books per loop iteration), done by the curation agent reading rendered page text — not an API client, not a high-throughput scraper. "No path forward" was true for an automated bulk client; it was never true for a per-book lookup.

## Revisit triggers

- **Volume stops being low.** This decision rests on the lookup staying per-book and low-throughput. A future design wanting a high-frequency automated Goodreads client must re-open the ToS/legal question from [`./no-goodreads.md`](./no-goodreads.md) Option B first.
- **Goodreads page structure changes** such that the rating can no longer be read reliably off the page. Mitigation is a parsing-discipline tweak, not a source rethink.
- **Too-young books accumulate.** Books published within ≈ 6–12 months often have no aggregated rating yet; they are marked "checked, unrated," not guessed. If the marked set grows large, a periodic re-try is worth a small brief — this overlaps with the per-book "refresh rating" button in the roadmap Ideas Backlog.
- **A unified-source pass becomes worth it.** If the mixed `hardcover`/`goodreads` split ever causes display or trust problems, a one-off re-fetch of the 119 Hardcover rows onto Goodreads closes it.
