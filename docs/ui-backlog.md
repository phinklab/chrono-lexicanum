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

### Series-label crowding in EraDetail when books cluster at the same time

- **Spotted:** 2026-05-02, after Stufe 2b shipped 26 books
  (`sessions/2026-05-02-022-impl-rich-seed-2b.md`).
- **Where:** `/timeline?era=time_ending`, right side of the surface around
  M41.799–M41.999. The era covers M41.997–M42.999 but the live data only has
  one book past M42, so 13 of 14 books anchor in a narrow ~200-year window.
- **Symptom:** track-packing places the series correctly on separate vertical
  tracks (no dot overlap), but the series labels — `GAUNT'S GHOSTS`,
  `FARSIGHT`, `NIGHT LORDS`, `CIAPHAS CAIN`, `VAULTS OF TERRA`,
  `PATH OF THE ELDAR`, `GREY KNIGHTS`, `PRIESTS OF MARS` — start at almost
  the same X coordinate and run into each other horizontally.
- **Files involved:** `src/components/timeline/EraDetail.tsx` (track-packing
  logic, `series-label` placement), `src/app/globals.css`
  (`.series-label` rule).
- **Possible directions** (pick when the cleanup session opens):
  - Stagger label X by track index so adjacent labels offset.
  - Truncate or hide labels when the next-track label sits within N px.
  - Move labels above the track-line instead of inline with the spine.
  - Side-legend: list series names in a margin column, drop inline labels
    entirely.
- **Severity:** cosmetic — dots and tooltips work; the labels are just
  visually noisy at this density.
