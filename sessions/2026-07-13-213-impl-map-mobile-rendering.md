---
session: 2026-07-13-213
role: implementer
date: 2026-07-13
status: complete
slug: map-mobile-rendering
parent: none (direct maintainer session, no architect brief)
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/260
commits:
  - 10c869c
  - 84605a3
  - c78e635
  - c612ea6
---

# Mobile map rendering and full-route camera fit

## Summary

Android Chrome now renders the interactive galaxy through one bounded Canvas2D surface while desktop retains the established SVG renderer; the maintainer confirmed on the real Android device that pinch zoom is fluid and the severe flicker is gone. The same payload, projection, camera semantics and interaction features drive both renderers, and `SHOW THE FULL ROUTE` now fits the entire journey above the dock card on both Android and desktop.

## What I did

- `src/components/cartographer/canvas-renderer.ts` — implemented the Canvas2D scene renderer, bounded backing-store sizing, visible-feature selection, hit testing and shared visual layers without changing map data.
- `src/components/cartographer/CanvasStage.tsx` — added the Android stage with the existing pan, pinch, wheel, tap, selection, hash-camera and journey contracts.
- `src/components/cartographer/camera-core.ts` — extracted camera math shared by SVG and Canvas so renderer selection does not alter positions or navigation semantics.
- `src/components/cartographer/CartographerRoot.tsx` — selects Canvas automatically on Android, keeps SVG on desktop and in the Zone Editor, and supports `?mapRenderer=canvas|svg` for parity testing.
- `src/components/cartographer/ChartStage.tsx` — moved the SVG stage onto the shared camera core.
- `src/app/styles/55-map.css` — corrected Lumen/Nihilus stacking below contacts and removed problematic promoted-card behavior for the Canvas path.
- `e2e/smoke-static.spec.ts` — extended the map smoke to cover renderer selection and the preserved interactive contract.
- `src/lib/map/voyages/fit.ts` — computes complete route bounds from stations, waypoints, sampled curved legs and the rendered route title, then fits them into the free viewport above the dock card.
- `src/components/cartographer/VoyageTour.tsx` — sends the final route fit through the shared chart bus for desktop SVG and Android Canvas; hidden or suppressed tour UI no longer reacts to global arrow keys.
- `src/components/cartographer/camera-core.ts` / `ChartStage.tsx` — extended the shared ceiling from 9× to 13.05× (one 1.45× control step) and removed SVG pinch's duplicate hard-coded ceiling.
- `src/components/cartographer/CartoucheSheet.tsx` — starts the mobile instrument sheet on its four-section overview with every disclosure collapsed; desktop retains its open census default.
- `src/components/cartographer/CartographerRoot.tsx` — selecting a journey now closes any world through the established selection-close path in the same event, so the tour is immediately visible and selection/hash/focus side effects remain coherent.
- `scripts/test-map-renderer.ts` — covers camera math, backing budget, labels, picking and full-route fit geometry.

## Decisions I made

- **Kept one data and interaction model with two renderers.** Canvas consumes the existing `MapPayload`, world coordinates, projection, zones, voyage definitions and `/api/map/world/{id}` flow. No world, coordinate or content source was edited.
- **Defaulted only Android to Canvas.** The device result proves that one raster surface removes the practical Android bottleneck. Desktop SVG remains visually mature, sharp, accessible to native pointer semantics and already performs well; replacing it by default would add parity risk without a demonstrated desktop benefit.
- **Kept the Zone Editor on SVG.** Its editing behavior depends on the existing SVG structure and was outside the rendering repair.
- **Used a bounded backing store and shared camera core.** This avoids an unbounded device-pixel canvas while keeping hash links, flights and gesture behavior equivalent between renderers.
- **Fit the visible route, not only station coordinates.** Curved-leg samples, waypoints and the route-title extent are included, and the current dock card reserves bottom space. The resulting absolute camera target is sent through the existing clamped flight API.
- **Defined the extra zoom level as one existing control step.** The prior ceiling was 9× and the established control factor is 1.45, so the new shared ceiling is 13.05×. This applies to Canvas and SVG while the four semantic name bands remain unchanged.
- **Closed worlds through `selectWorld`, not only reducer state.** This preserves immediate SVG class cleanup, focus handling and the hash-close effect before the journey becomes primary context.
- **Collapsed Mobile only on its initial sheet state.** Desktop keeps `Filter worlds` expanded, and a phone user's later disclosure choices survive closing and reopening the sheet.
- **Added no dependency.** The renderer and fit use browser Canvas2D and existing project geometry utilities.

## Verification

- Maintainer device acceptance — Android Chrome pinch/pan reported fluid, with no remaining flicker; visuals reported as correct.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 506 checks across 8 journeys.
- `npm test` — pass, 40 DB-free suites.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run build` — pass; the existing Turbopack tracing warning remains unchanged.
- `npm run brain:lint -- --no-write` — 0 blocking errors, 20 pre-existing warnings.
- `npm run test:smoke` — all 15 tests individually reported `ok`; the command hit the 240-second Windows timeout during Playwright web-server cleanup after the tests, with no failed test.
- Manual desktop browser, 1280 x 720, forced SVG — completed the Farsight tour and activated `SHOW THE FULL ROUTE`; route and title were fully visible, the free-mode card appeared, and the route retained about 36 px clearance above the dock card.
- Targeted production Playwright map smokes, 320 px Canvas + 1280 px SVG — 2/2 pass. Both clamp hash restore to 13.05×; Mobile exposes four initially collapsed sections; Desktop verifies Terra → keyboard Journey selection closes the panel and selection glyph, retains Journey focus, exposes the tour immediately, updates the SR message and removes `world=` from the hash.
- Manual desktop browser — Terra → The Great Crusade confirmed the world panel closed, zero selected glyphs, visible tour card, retained Journey-button focus, journey announcement and a settled hash without `world=terra`.
- `git diff --check` — pass.

## Open issues / blockers

None for the requested default paths. The explicit mobile SVG override remains a diagnostic path and can still expose the original Chromium SVG/compositor behavior; Android defaults to the device-accepted Canvas renderer.

On exceptionally short landscape viewports, the dock card and a tall route may physically compete for the same space. The fit uses a compact fallback there, but no layout can guarantee both are fully visible when their combined minimum heights exceed the viewport.

## For next session

- Consider a desktop-Canvas default only after a dedicated visual-parity and hover/Zone-Editor evaluation; the current hybrid has the lower regression risk.
- If very short landscape devices become a supported priority, design a collapsed journey-card state during the full-route overview.

## References

- Draft PR: https://github.com/phinklab/chrono-lexicanum/pull/260
