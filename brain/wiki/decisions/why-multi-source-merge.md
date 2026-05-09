---
title: Why field-by-field multi-source merge
type: decision
created: 2026-05-02
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md
  - ../../../sessions/archive/2026-05/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md
  - ../../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md
related:
  - ./why-bulk-backfill.md
  - ./no-goodreads.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-02
---

# Why field-by-field multi-source merge (deterministic priority)

**Status:** active · **Decided:** 2026-05-02 · **Sessions:** [033 (retracted)](../../../sessions/archive/2026-05/2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md), [034](../../../sessions/archive/2026-05/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md), [035-impl](../../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md)

## Context

When the pipeline crawls multiple sources for the same book, conflicts are guaranteed. Wikipedia says publication 2007; Open Library says 2014 (a re-issue). Lexicanum says the Plotline is in M30.997; Wikipedia doesn't mention in-universe years. Hardcover has tags; nobody else does. How should the pipeline resolve which value to keep per field?

Brief 033 (Daily-Drift-Crawler, **retracted before handover**) initially proposed a "first-source-wins" approach — whatever source first surfaced a field for a book, keep it. Cowork-Chat with Philipp 2026-05-02 challenged this: it makes debugging which-source-set-X impossible after the fact, and it locks in arbitrary races (whichever crawler ran first).

## Options considered

- **A — first-source-wins** (Brief 033's original). Reject: nondeterministic in re-runs, no audit trail, race-condition-prone.
- **B — last-source-wins.** Reject: same problems as A.
- **C — average / consensus.** Useless for non-numeric fields (titles can't average); for numeric the "consensus" is rarely truth (e.g. ISBN consensus across re-issues).
- **D — manual override every conflict.** Doesn't scale to 800 books × N fields.
- **E ✅ chosen — field-by-field source priority.** Per schema field, declare which source is canonical. Title from Wikipedia (master-list authority); in-universe years from Lexicanum (lore-anchor); cover from Open Library (bibliographic); rating from Hardcover (replacement Goodreads). Deterministic, debuggable, source-aware.

## Decision

**Per-field source ranking** in `src/lib/ingestion/field-priority.ts`. Each schema field has an ordered list of sources. The merge engine iterates the list, takes the first source that has a value for that field, and records `fieldOrigins[field] = sourceName` as the audit trail.

Selected highlights:

- `title`: `[wikipedia, lexicanum]`
- `releaseYear` (publication): `[wikipedia, open_library, hardcover, lexicanum]`
- `startY` / `endY` (in-universe): `[lexicanum, llm]`
- `coverUrl`: `[open_library]`
- `rating`, `tags`: `[hardcover]`
- `synopsis`: `[llm]` (always — paraphrased, license-safe)
- `factionNames`, `locationNames`, `characterNames`: `[lexicanum, llm]` — but post-047 effectively `[llm]` because Lexicanum doesn't extract these (open question 11)

## Why

- **Deterministic.** Same inputs → same merge result, every run. Re-runs of the pipeline don't shuffle which source won.
- **Debuggable.** `fieldOrigins` audit trail in the diff JSON tells you exactly why each value was chosen. Cowork can spot an OL-reissue-trap on `releaseYear` because it shows up as `fieldOrigins.releaseYear = "open_library"` with the wrong year.
- **Source-aware.** Each source gets its strengths matched to fields where they're authoritative. Wikipedia knows titles + master-list discovery; Lexicanum knows lore-anchors; OL knows bibliographic; Hardcover knows reader signals.
- **Extensible.** Adding a 5th source (LLM in 3c, hypothetical Black Library in Phase 3.5+) is one entry per field in the priority list. Engine doesn't change.
- **Manual overrides remain trivial.** `source_kind = 'manual'` rows skip the merge entirely (Manual-Protection-Comparator). Hand-curated truth is never overwritten.

## When this decision should be revisited

- **If a field's "best source" depends on per-book context.** Today the priority is global per field. If we hit cases where (e.g.) Hardcover's title is more accurate than Wikipedia's for one specific book, we'd need per-book override entries — fits in the 3d-Apply override schema (open question 3).
- **If LLM consistently outperforms structured sources** on fields they're meant to be canonical for. Today this isn't the case for hard-fact fields; LLM is canonical only for synopsis/facets/format/availability/junctions/rating-source-pick.
- **If a new source disrupts the ranking** (e.g. Black Library Shop API materializes with authoritative format/availability data — the LLM's current monopoly on those would shift).

## Aftermath

The decision held cleanly through 3a (Wikipedia + Lexicanum), 3b (+OL + Hardcover), 3c (+LLM), 047 (5 levers, refining the ranking). The audit trail (`fieldOrigins` + `primarySource`) catches every architectural drift — when post-047 the `wikipedia` branch in `pickPrimarySource` became dead code, the diff exposed it (`primarySource` distribution was 0× wikipedia after the change), and Cowork verified it was a clarification, not a bug.

The post-047 Lexicanum-no-junction finding (open question 11 in [`../open-questions.md`](../open-questions.md)) is a *priority-list cleanup*, not a re-evaluation of the merge approach — it just means trimming Lexicanum off the priority for the three junction fields.
