---
session: 2026-07-10-192
role: implementer
date: 2026-07-10
status: complete
slug: mobile-cartographer-canvas
parent: 2026-07-10-191
links:
  - 2026-07-09-190
  - 2026-07-10-191
commits: []
---

# Cartographer mobile: replace animated SVG paint with Canvas

## Summary

The compositor-plane fix from Session 191 did not change the flicker on the maintainer's Google Pixel/Chrome and is superseded. Mobile Great Journey motion now uses a capped 30-fps Canvas renderer; all SVG paint animation and the forced `translateZ` backing-store hint are removed below 900 px, while desktop retains the existing SVG choreography. The mobile tour dock is also cleared from the chart drawer, and its close control now has correct exit semantics and a reliable touch target.

## What I did

- `src/components/cartographer/RouteMotionCanvas.tsx` — new mobile-only Canvas renderer: samples the existing quadratic/cubic/linear voyage paths, preserves ambient/tour reveal gating, marches pixel dashes at 30 fps, caps DPR at 2 and redraws against the current imperative camera.
- `src/components/cartographer/CartographerRoot.tsx` — mounts the Canvas above the chart with the resolved voyage, progress and reduced-motion state.
- `src/app/styles/55-map.css` — removes the forced compositor backing store, disables every animation/transition in the mobile motion SVG, hides its route paths and shows the pointer-transparent Canvas instead; station rings/labels stay static SVG.
- `src/app/styles/55-map.css` — raises the mobile journey card above the complete collapsed drawer with a 12 px interaction gap, and promotes the close control to an unobstructed 44×44 px touch target.
- `src/components/cartographer/VoyageTour.tsx` — separates leaving the journey from skipping its guided tour so the close control no longer falls through into free-explore mode.
- `src/components/cartographer/{ChartStage,RoutesLayer}.tsx` — corrects the rendering-contract comments after the architecture change.
- `src/lib/map/voyages/index.ts` — exposes the existing tested `pointOnLeg` sampler to the Canvas renderer.

## Decisions I made

- **Treated Session 191 as disproven.** Isolating animated SVG into a smaller SVG still exercised the same browser paint path; it reduced the invalidation set but did not remove the failing primitive.
- **Removed `stroke-dashoffset` animation from mobile entirely.** Open WebKit, Chromium and Mozilla tracker reports all document high resource use or incorrect rendering around animated SVG dash offsets; Chromium separately records bad interaction between dash-offset and SVG transforms.
- **Used Canvas rather than another SVG/CSS workaround.** The map remains SVG-authored and interactive, but per-frame pixels are now drawn on the surface intended for repeated raster updates. No dependency, WebGL context or UA sniffing was added.
- **Applied the fix by responsive breakpoint, not by iOS detection.** The maintainer reproduces on Google Pixel/Chrome; every viewport at or below 900 px takes the same Canvas path on Blink and WebKit.
- **Kept the animation deliberately bounded.** 30 fps is sufficient for the slow convoy motion; DPR is capped at 2 to prevent a Pixel/iPhone high-density display from multiplying the backing store without visible benefit.
- **Derived the dock clearance from the real mobile layout.** The collapsed drawer is 114 px tall when a journey badge is present; the tour card now reserves 126 px including an explicit 12 px interaction gap.
- **Kept Skip and Exit distinct.** `SKIP TOUR` intentionally enters the freely explorable journey, while `×` now dispatches `voyageEnd` and returns to the neutral chart.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, 30/30 DB-free suites including voyage resolution/path coverage.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings (47 existing warnings).
- `npm run build` — pass on the final code; compiled/typechecked, generated 158/158 pages, `/map` remains static.
- Mobile Chromium viewport 390×844 — `/map` loaded, chart instruments opened and the Horus journey activated through the real UI. The Canvas was visible at 390×844 with `data-route-canvas="horus"`; the SVG route reported `animation-name: none`, `transition-duration: 0s` and `visibility: hidden`.
- Mobile interaction geometry — the journey card ended at y=718 and the drawer grip began at y=729 (11 px rendered gap); the centres of `SKIP TOUR`, `BEGIN` and `NEXT` all hit their own buttons.
- Mobile journey exit — the close control rendered at 44×44 px above the card heading, received the centre hit, and a normal click removed the journey/card/badge from the chart.
- Google Pixel/Chrome device verification remains the maintainer's preview-deploy check; this environment cannot emulate the Pixel GPU/compositor.

## Open issues / blockers

- No code blocker. The physical-device verdict requires Philipp's Pixel after preview deployment; unlike Session 191, this implementation no longer uses the browser primitive implicated by the reports.

## For next session

- If the Pixel still flashes with zero animated SVG paint, capture a short screen recording plus Chrome version/Android version and test a static-map/no-Canvas toggle. That would separate Canvas compositing from unrelated fixed HUD/media-player layers.

## References

- WebKit bug 247241 — animated `stroke-dashoffset` resource spike: https://bugs.webkit.org/show_bug.cgi?id=247241
- Chromium issue 40958492 — high CPU while animating `stroke-dashoffset`: https://issues.chromium.org/issues/40958492
- Chromium issue 40152412 — dash-offset renders incorrectly when SVG transform is animated: https://issues.chromium.org/issues/40152412
- Mozilla bug 1798201 — cross-engine resource report for animated dash offsets: https://bugzilla.mozilla.org/show_bug.cgi?id=1798201
- WebKit bug 253171 — iOS missing backing-store tiles with forced GPU layers: https://bugs.webkit.org/show_bug.cgi?id=253171
