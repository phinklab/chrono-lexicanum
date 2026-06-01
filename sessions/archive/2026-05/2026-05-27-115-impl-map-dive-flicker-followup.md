---
session: 2026-05-27-115
role: implementer
date: 2026-05-27
status: complete
slug: map-dive-flicker-followup
parent: handoff-map-flicker-followup-2026-05-27
links:
  - sessions/handoff-map-flicker-followup-2026-05-27.md
  - sessions/handoff-map-flicker-2026-05-27.md
commits: []
---

# Map dive flicker follow-up

## Summary

Implemented a dive-specific mitigation: entering a Segmentum no longer flips immediately into the heavy dived SVG/detail view. The real map stays in the galactic state during the dive, a lightweight curtain/reticle carries the transition, a capped preview zoom moves toward the selected Segmentum underneath, and the dived layer mounts while the curtain and global compositor quiet-mode are still active.

Philipp confirmed the flicker is gone after the first curtain pass. A follow-up polish pass added "SELECTING SEGMENTUM..." plus Mechanicus-style noospheric copy and the capped under-curtain zoom.

## What I did

- `src/components/map/context.tsx` - added `transitionKind` / `transitionTargetView` and split transition actions into `begin_dive`, `finish_dive`, `begin_surface`, and `finish_transition`.
- `src/components/map/context.tsx` - changed `dive()` so it delays the actual `view` switch until after the 850 ms dive window; `surface()` keeps the existing immediate galactic switch so the improved zoom-out path stays intact.
- `src/components/map/GalaxyHologram.tsx` - added a short-lived dive curtain that remains for a 180 ms settle mask after the delayed view switch, covering the dived-detail mount and final raster/compositor swap.
- `src/components/map/GalaxyHologram.tsx` - added a capped preview zoom toward the selected Segmentum during the dive; Solar's 5x final zoom is still delayed until the settle mask.
- `src/components/map/GalaxyHologram.tsx` - changed the curtain copy to "SELECTING SEGMENTUM..." plus noospheric/binharic Mechanicus-style status lines.
- `src/components/map/GalaxyHologram.tsx` - made the existing `<html data-map-transitioning="true">` quiet-mode stay active through the dive settle mask; map vignette, scanlines, and holo-flicker now also drop out during that quiet window.
- `src/app/globals.css` - added the dive curtain/reticle/text styles and changed transition-time site background vignette/scrim opacity from reduced to fully suppressed.

## Decisions I made

- **Used a lightweight transition overlay instead of further tuning the SVG transform.** The remaining bug was dive-only, and Solar's 5x target makes real-SVG scaling the riskiest path. The overlay keeps the expensive SVG static until the transition is visually masked.
- **Did not revert the previous surface FLIP work.** Browser checks still show surface round-tripping correctly, and the handoff says zoom-out is now much improved.
- **Added zoom back conservatively.** The preview zoom is capped so the user sees motion into the selected Segmentum, but the full dived SVG scale still appears only under the settle mask.

## Verification

- `npm.cmd run lint` - pass
- `npm.cmd run typecheck` - pass
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking findings / 16 warnings
- `npm.cmd run build` - pass
- `git diff --check` - pass
- Browser automation on `http://localhost:3000/map`:
  - Obscurus dive: curtain active during transition, hash stayed `#era=m42-indomitus` until settle, final hash `#era=m42-indomitus&view=obscurus`, Back button present.
  - Solar worst-case dive: curtain active during transition, final hash `#era=m42-indomitus&view=solar`.
  - Surface from Solar: final hash returned to `#era=m42-indomitus`, Back button removed, no oversized elements after settle.
  - Idle CSS animation targets remain 3: `mapRadarSpin`, `mapHoloFlicker`, `mapPulse`.
  - Follow-up preview zoom check: during Obscurus/Solar dive the curtain text rendered, `data-map-transitioning` was active, and the disc transform animated under the curtain.
- Manual: Philipp confirmed "Das flickern ist weg" before the preview-zoom polish.

## Open issues / blockers

- No current blocker.
- During the surface transition, automation still observed transient SVG bounds slightly above the 2x-viewport threshold, but the final settled state is clean and the handoff says surface is already much improved.

## For next session

- If the preview zoom makes the transition feel too dim, tune only the curtain opacity/radial transparency first; keep the delayed heavy-detail mount.
- If future Chrome builds show dive flicker again, the next smallest knob is increasing the settle mask from 180 ms to roughly 280-320 ms so Chrome has longer to paint the dived SVG before the curtain clears.

## References

- Local handoff: `sessions/handoff-map-flicker-followup-2026-05-27.md`
- Local browser automation against the running Next dev server
