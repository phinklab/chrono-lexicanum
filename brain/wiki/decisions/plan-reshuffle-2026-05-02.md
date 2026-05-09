---
title: Plan-Reshuffle 2026-05-02
type: decision
created: 2026-05-02
updated: 2026-05-09
sources:
  - ../raw/historical/2026-05-08-pre-reset/ROADMAP.md
  - ../../../sessions/README.md
  - ../../../sessions/archive/2026-05/2026-05-02-029-arch-filterrail-mvp.md
related:
  - ../roadmap.md
  - ./why-bulk-backfill.md
confidence: high
decision-date: 2026-05-02
---

# Plan-Reshuffle 2026-05-02

**Status:** active · **Decided:** 2026-05-02 · **Sessions:** [029-arch FilterRail-MVP](../../../sessions/archive/2026-05/2026-05-02-029-arch-filterrail-mvp.md) (closing brief of the previous plan), Cowork-Chat 2026-05-02

## Context

Pre-reshuffle, the roadmap was:

- Phase 2 = Chronicle (Timeline) **and** Cartographer **and** Ask the Archive (three tools, one phase)
- Phase 3 = Detail-Seiten (`/buch/[slug]`, `/fraktion/[slug]`, etc.)
- Phase 4 = Ingestion-Pipeline
- Phase 2a.1 = EntryRail (a recommended-entry-point UI on the Hub)

Three problems converged at the FilterRail-MVP discussion (sessions 029/030):

1. **Cartographer + Ask the Archive aren't really "one phase with Chronicle".** They're separate tools that can ship independently once Chronicle stabilizes. Bundling them into Phase 2 creates a long-tail Phase 2 that never closes.
2. **Detail-Seiten are upstream of Ingestion's data.** Building detail pages with 26 hand-curated books makes them feel half-empty; once Ingestion brings ~700 more, detail-page UI decisions are made on actual data shape, not anticipated. This makes Phase 4 (Ingestion) a prerequisite for Phase 3 (Detail-Seiten), inverting the planned order.
3. **EntryRail is redundant with Ask the Archive.** Both are "where should I start reading" recommenders. Two implementations would diverge; better to have one (Ask the Archive's funnel) and skip the EntryRail variant.

Plus: **paralleles Scrapen ab jetzt im Hintergrund** — Cowork wanted the Ingestion-Pipeline running in batches alongside feature work, not blocking it. That requires Ingestion to start early, not late.

## Options considered

- **A — keep the original plan.** Phase 2 closes with Cartographer + Ask + EntryRail; Phase 3 = Detail; Phase 4 = Ingestion. **Rejected** — Phase 2 has no realistic close, Detail-pages-on-26-books is half-built, paralleles Scrapen is impossible.
- **B — split tools, swap 3↔4, drop EntryRail.** Phase 2 closes with Minimal-FilterRail (Brief 029); Phase 3 = Ingestion (vorgezogen); Phase 4 = Discovery-Layer (fusioniert Detail-Seiten + Timeline-Reshape + DB-Suche + persönliche Bibliothek); Phase 5 = Cartographer + Ask the Archive (verschoben aus alter Phase 2). EntryRail gestrichen, weil Ask-the-Archive-Trichter es vollständig abdeckt.
- **C — full re-plan.** Throw out the phase numbers, start over. **Rejected** — Phase 1 + 1.5 + 2.0–2c.2 already shipped; renumbering would orphan the historical labels.

## Decision

**Option B.** Specifically:

- **Phase 2** schließt mit Minimal-FilterRail (Brief 029). Chronicle + DetailPanel + Deep-Link + FilterRail = the closed Phase-2 deliverable.
- **Phase 3 = Daten-Ingestion** (vorher Phase 4). Vorgezogen, weil paralleles Scrapen im Hintergrund laufen soll.
- **Phase 4 = Discovery-Layer**. Fusioniert die alte Detail-Seiten-Phase mit Timeline-Reshape (cineastisch, era-zentriert, scaling) + Pure DB-/Sortier-Seite + persönliche Bibliothek.
- **Phase 5 = Cartographer + Ask the Archive**. Verschoben aus alter Phase 2.
- **Phase 6 = Community contributions** (unchanged).
- **Phase 7 = Polish & Launch** (unchanged).
- **EntryRail (vormals 2a.1) gestrichen.** Ask-the-Archive-Trichter in Phase 5 deckt die Funktion vollständig ab.
- **Cover-Ständer-Idee** für Audio-Hörer in Ideas-Backlog verschoben.

## Why

- **Phase 2 closes cleanly.** Minimal-FilterRail is a small, defensible boundary. Cartographer + Ask are full sub-tools that deserve their own phase.
- **Ingestion before Detail-pages reverses the natural data dependency.** Detail-pages design decisions follow from data shape; getting ~700 books in dry-run before Phase 4 starts means Phase 4 designs against real data.
- **Parallel scraping unlocks itself.** Once Phase 3 starts, Philipp can run nightly batches in 3e while Cowork+CC build Phase 4 in foreground. No serialization.
- **EntryRail removal saves a sub-feature** that was always going to be the same code as Ask the Archive. One implementation is better than two.
- **No backward-incompatible labels.** Phase 1 + 1.5 + 2 keep their numbers; only Phase 3+ renumber. Historical session labels (e.g. 2026-04-28-001-arch-bootstrap) don't change.

## When this decision should be revisited

- **After Phase 3 closes** (3e Voll-Lauf done, all ~800 books in DB). Phase 4 starts on actual data. If Phase 3 takes much longer than expected (e.g. >6 months of batched 3e), revisit whether to ship a Phase 4 sub-feature out of order to maintain Reddit-launch momentum.
- **If Cartographer's data dependencies turn out to be cheaper than thought.** Maybe sectors+locations+the 26-book pin set is enough for a Phase 5a preview before Phase 4 closes. (Probably not — but possible.)
- **If Discovery-Layer (Phase 4) reveals a need for a tool we didn't plan.** E.g. a "reading order navigator" that's neither timeline nor table nor library. Add as Phase 4e or Phase 4.5.

## Aftermath

The reshuffle has held through Phase 3a–3c + 3.5. Phase 3 is in flight (047/048 implemented; next is Anthologie-Re-Test + 3d-Apply + 3e Batches). Phase 4 hasn't started yet. The cover-ständer-idea is still in Ideas-Backlog (untouched). EntryRail-removal hasn't been re-questioned.

A follow-on Strategie-Anpassung 2026-05-04 refined Phase 3e: instead of one 800-book overnight, 8–16 sessions à 50–100 books. That's a sub-decision under "bulk-backfill" (see [`./why-bulk-backfill.md`](./why-bulk-backfill.md)), not a re-evaluation of the reshuffle itself.
