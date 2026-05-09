---
title: Why no Goodreads
type: decision
created: 2026-05-02
updated: 2026-05-09
sources:
  - ../../../sessions/2026-05-02-031-arch-phase3-ingestion-brainstorm.md
  - ../../../sessions/2026-05-02-032-impl-phase3-ingestion-brainstorm.md
  - ../../../sessions/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md
related:
  - ./why-multi-source-merge.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-02
---

# Why no Goodreads

**Status:** active · **Decided:** 2026-05-02 · **Sessions:** [031](../../../sessions/2026-05-02-031-arch-phase3-ingestion-brainstorm.md), [032-impl](../../../sessions/2026-05-02-032-impl-phase3-ingestion-brainstorm.md), [034](../../../sessions/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md)

## Context

Phase 3's first kickoff (brief 031) framed Goodreads as a primary source for ratings, popularity signals, and reader tags. Goodreads is the obvious thing to reach for — biggest reader-review database, decades of W40k commentary. Brief 032's research pass was supposed to scope the API integration.

## Options considered

- **A — Goodreads API.** Use the official `/book/show.xml`-style endpoints. Discovered: **the Goodreads API was discontinued in December 2020.** New keys are not issued; existing keys still work for grandfathered apps but new clients can't onboard. Effectively dead.
- **B — Goodreads scraping.** HTML-scrape the public review pages. Discovered: rate-limited and ToS-prohibited; would put us in a legal-risk zone for a fan project. Plus brittle (HTML changes break scrapers).
- **C ✅ chosen — replace Goodreads with Open Library + Hardcover.app.** Open Library covers the bibliographic side (ISBN, cover, page count, pub year) — it's the public-domain successor to Goodreads' bibliographic role. Hardcover.app covers the social side (reader-tags as `cached_tags`, average ratings) — it's a Goodreads replacement built explicitly to fill the post-API-shutdown gap.

## Decision

**Drop Goodreads from the source set entirely.** Use Open Library + Hardcover.app as Aux-Sources in 3b.

## Why

- **No path forward.** Without an API, every alternative is brittle (scraping + legal-risk) or impossible (manual curation at 800-book scale).
- **Replacement sources are credible.** Open Library is a long-running nonprofit with stable APIs. Hardcover.app explicitly markets itself as a Goodreads replacement; team is responsive (Cowork verified the Hasura schema empirically by talking to their docs / community).
- **No data-loss for our use case.** Goodreads' deepest value (long-form reader reviews) was never in scope — synopses come from LLM-paraphrase of Wikipedia/Lexicanum plot sections, not from reader reviews.
- **Code-comment cleanup.** The historical `next.config.ts` comment ("allow Goodreads / Lexicanum domains") was refreshed in 049 to drop the Goodreads reference (API stilllegung 2020).

## When this decision should be revisited

- **If Goodreads relaunches API access.** Unlikely (5+ years dead with no signals); but if it happens, Goodreads-as-a-tertiary-source is cheap to add via the `SourceCrawler` plugin pattern.
- **If Hardcover.app shuts down.** Replacement strategy: lean harder on LLM-Web-Search for ratings/tags (already the LLM's job for `rating` per source-priority). Open Library covers bibliographic; ratings/tags are the lossy axis.
- **If Open Library API changes break the integration** (uncommon but possible). Migration would be defensive parsing changes, not a sources-rethink.

## Aftermath

- 3a (sessions 034/035) used Wikipedia + Lexicanum only.
- 3b (sessions 036/037) added Open Library + Hardcover. **Hardcover-Schema empirically verified mid-session** after Philipp set up a working token: Hasura-typical, `_eq` only, `cached_tags` as object-of-arrays. ~6/7 success rate.
- The decision has held without re-evaluation through 3c, 3.5, 044, 045, 047.
