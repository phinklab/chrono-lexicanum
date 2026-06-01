---
session: 2026-05-27-116
role: implementer
date: 2026-05-27
status: complete
slug: map-transition-polish
parent: 2026-05-27-115-impl-map-dive-flicker-followup
links:
  - sessions/archive/2026-05/2026-05-27-115-impl-map-dive-flicker-followup.md
  - sessions/handoff-map-flicker-followup-2026-05-27.md
commits: []
---

# Map transition polish

## Summary

Removed the circular dive reticle and kept the useful "SELECTING SEGMENTUM..." transition copy as the only dive HUD. The map tint, radial darkening, and horizontal scanlines now remain visible during both dive and Back-to-Galactic transitions, so the background no longer flashes to a different colour while the compositor quiet mode is active.

After Philipp clarified that the remaining flicker happened while Segmentum Ultima was already open, I also gated the hazardous-zone SMIL animations off whenever the map is in a dived Segmentum. Interdicted Zone labels, rift X markers, Necron runes, Tyranid glyphs, and the Astronomican core pulse now render static in Segmentum view.

## What I did

- `src/components/map/GalaxyHologram.tsx` - removed the reticle element from the dive transition overlay.
- `src/components/map/GalaxyHologram.tsx` - extended the dive settle window from 180 ms to 560 ms so the selecting copy can fade out smoothly after the delayed detail mount.
- `src/components/map/GalaxyHologram.tsx` - kept the map vignette, edge vignette, and scanline layer visible during transition quiet mode; scanlines switch to normal blend mode during the transition instead of disappearing.
- `src/app/globals.css` - removed the reticle CSS/keyframe, centered the copy-only transition text, and added a 560 ms opacity/blur/translate fadeout.
- `src/app/globals.css` - changed transition quiet mode so it simplifies expensive grain/backdrop layers without suppressing the map-specific tint layers.
- `src/components/map/disc/GalacticDisc.tsx` - passed the existing `animsOn` gate into the zone/overlay components that can remain visible while a Segmentum is open.
- `src/components/map/disc/Nebulae.tsx` - disabled interdiction X glitch SMIL while `animsOn` is off.
- `src/components/map/disc/CicatrixSpine.tsx` - disabled rift X-marker opacity flicker, Interdicted Zone label flicker, skull flicker, and the timer-driven corruption-letter field while `animsOn` is off.
- `src/components/map/disc/NecronZones.tsx` - disabled tomb-boundary dash motion and rune opacity flicker while `animsOn` is off.
- `src/components/map/disc/TyranidZones.tsx` - disabled hive-boundary dash motion and glyph opacity flicker while `animsOn` is off.
- `src/components/map/disc/DiscWedges.tsx` - gated the Astronomican core opacity pulse behind `animsOn`.

## Decisions I made

- **Kept the curtain but removed the visible reticle.** The curtain still masks the heavy dived-detail mount from 098, but the explicit circular HUD is gone.
- **Did not re-enable animated holo-flicker during transitions.** The user-visible tint and scanlines now stay active; the animated full-screen flicker layer remains disabled during the quiet window because it was part of the original Chrome/Windows flicker risk.
- **Treated open Segmentum view as a low-motion state.** Planet markers keep their intentional ring rotations, but the large ambient hazard flickers stop in dived view because those are the effects most likely to read as the reported intermittent Segmentum Ultima blink.
- **Did not mark Brief 096 implemented.** This is a local polish follow-up on the ongoing Product/UI branch, not completion of the whole design-direction brief.

## Verification

- `npm.cmd run lint` - pass
- `npm.cmd run typecheck` - pass
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking findings / 16 warnings
- `npm.cmd run build` - pass
- `git diff --check` - pass
- Browser automation on `http://localhost:3000/map`:
  - Obscurus dive: `.map-dive-curtain__reticle` absent, selecting copy visible, `data-map-transitioning="true"` active, scanline opacity `0.45`, scanline blend `normal`, edge vignette opacity `1`, `site-bg::after` opacity `1`.
  - After Obscurus settle: final hash `#era=m42-indomitus&view=obscurus`, Back button visible, no reticle.
  - Back to Galactic View: during surface transition the scanline opacity stayed `0.45`, edge vignette opacity stayed `1`, `site-bg::after` opacity stayed `1`, and no curtain/reticle appeared.
  - After surface settle: final hash returned to `#era=m42-indomitus`, Back button removed.
  - Reloaded directly into `#era=m42-indomitus&view=ultima`: root `data-anims="off"`, `.map-holo-flicker` paused at opacity `0`, `.map-dive-curtain__reticle` absent, `site-bg::after` opacity `1`.
  - After 4.2 s idle in Segmentum Ultima: `interdictAnimateCount` stayed `0`, all non-transform SVG SMIL animations were absent, and the remaining `30` SVG animations were only `animateTransform` planet-marker rotations.

## Open issues / blockers

No current blocker.

## For next session

- If Philipp still sees flicker while sitting inside a Segmentum, inspect the remaining planet-marker ring rotations next; the hazardous-zone and label flickers are now static in dived view.
- If Philipp still sees a colour jump, inspect the external site grain next; it is still dimmed during transition quiet mode, though the map tint and scanlines now stay stable.
- If the selecting copy feels too long, tune only the 560 ms settle window and matching CSS transition.

## References

- Local browser automation against the running Next dev server on `http://localhost:3000/map`
