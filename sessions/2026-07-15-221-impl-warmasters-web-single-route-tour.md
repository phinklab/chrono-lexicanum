---
session: 2026-07-15-221
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-single-route-tour
parent: 2026-07-15-220
links:
  - sessions/2026-07-15-220-impl-warmasters-web-legion-steps.md
commits:
  - 9ed3f54
---

# The Warmaster's Web — single-route tour

## Summary

The guided `Warmaster's Web` tour now replaces the previous Legion path on every step instead of accumulating the web: exactly one Legion route is visible, and that route's segments draw in travel order. The complete 18-Legion web appears only after `SHOW THE FULL WEB`; its existing per-Legion visibility controls remain intact.

## What I did

- `src/components/cartographer/RoutesLayer.tsx` — limited `legion-steps` playback to the current arm, staggered its SVG masks segment by segment, hid prior destinations and station geometry, and delayed the full-route label until the post-tour survey.
- `src/components/cartographer/RouteMotionCanvas.tsx` — applied the same one-arm rule and a 260 ms segment stagger to the narrow-screen motion Canvas.
- `src/components/cartographer/canvas-renderer.ts` — cached strategic arm ownership and segment order for the full Android Canvas, then matched the focused-tour, hide/show and final-web semantics.

## Decisions I made

- **Replaced accumulation with focus.** The earlier decision to retain every revealed Legion route is superseded by the maintainer's product feedback: paging to the next Legion removes the previous route completely.
- **Animated one route in travel order.** Each segment starts 260 ms after the previous segment and reveals over 900 ms, producing one continuous readable movement without making long Legion routes feel slow.
- **Kept the survey as the explicit full-web boundary.** The route label and all 91 main/branch segments return only after `SHOW THE FULL WEB`, where the 18 independent Legion filters continue to work.
- **Kept renderer parity.** Desktop SVG, the narrow-screen motion Canvas and the full Android Canvas share the same focused step semantics, including reduced-motion and current-route hide/show behavior.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual desktop/SVG QA at `/map` — Legion I showed 9 staggered drawing segments and 0 retained segments; Legion III then showed 6 staggered drawing segments and 0 retained segments. Only one station ring remained visible per step.
- Manual final-web QA — `SHOW THE FULL WEB` restored all 91 segments and the route label; hiding Legion I reduced the visible geometry by its 9 segments, and showing it restored them.
- Manual mobile/full-Canvas QA at 390 × 844 and `/map?mapRenderer=canvas` — Legion I disappeared on the transition to Legion III, the new route rendered alone, and no browser-console warnings or errors occurred.
- `http://localhost:3000/map` — HTTP 200 after the production build; the local view remains open at Legion III for review.

## Open issues / blockers

None.

## For next session

- Let the focused 18-step journey settle in product review. If a single Legion route still contains too much information, its existing route destinations can become clickable substeps without changing the research data.

## References

- `sessions/2026-07-15-220-impl-warmasters-web-legion-steps.md`
