# UI backlog

Visual polish items spotted across sessions but deliberately deferred — to be
cleared in a dedicated cleanup session rather than fixed piecemeal alongside
unrelated work. New items at the top; cross out / remove when the cleanup
session ships them.

Differences from neighbouring docs:

- **Carry-over** in `sessions/README.md` is for things the **next** architect
  brief MUST address — algorithm changes, data corrections, schema gaps.
- **Ideas Backlog** in `ROADMAP.md` is for future features that aren't yet
  committed to a phase.
- **UI backlog** (this file) is for cosmetic polish — labels, spacing, hover
  states, animations — that doesn't change behaviour and can wait for a
  batched touch-up.

## Open

_None currently open._

> **Obsoleted 2026-05-31 — "Series-label crowding in EraDetail" (spotted 2026-05-02).**
> The item described the old `EraDetail` track-packing surface and its
> `.series-label` placement. Both are gone: the dormant `EraDetail`/`Overview`
> timeline components were retired in the component-retirement pass (their CSS had
> already been removed in CSS-Konsolidierung Pass 1, PR #116). The live `/timeline`
> renders the Chronicle suite (`src/components/timeline/chronicle/*`), whose lane
> layout supersedes the old track packing — any label-crowding polish for the
> Chronicle would be filed fresh against those components.
