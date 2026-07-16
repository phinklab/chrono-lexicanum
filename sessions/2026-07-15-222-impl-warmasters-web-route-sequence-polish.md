---
session: 2026-07-15-222
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-route-sequence-polish
parent: 2026-07-15-221
links:
  - sessions/2026-07-15-221-impl-warmasters-web-single-route-tour.md
commits:
  - 20bae45
---

# The Warmaster's Web — route sequence polish

## Summary

Each Legion route now draws as a strict planet-to-planet sequence: a segment finishes before the next one starts, with the main road completing before faint branch geometry. The redundant per-card route toggle is gone, while the final 18-Legion controls have become quiet borderless color tags without the former leading color bars.

## What I did

- `src/components/cartographer/RoutesLayer.tsx` — replaced overlapping SVG segment starts with explicit 1.1-second serial mask delays.
- `src/components/cartographer/RouteMotionCanvas.tsx` and `canvas-renderer.ts` — made each 900 ms Canvas segment wait for the prior segment's full reveal.
- `src/components/cartographer/VoyageTour.tsx`, `CourseCards.tsx`, `StrategicReadout.tsx` and `CartographerRoot.tsx` — removed the now-redundant `HIDE ROUTE` / `SHOW ROUTE` action and its unused prop chain.
- `src/app/styles/55-map.css` — removed the roster's left color bars and borders; Legion text now carries the Legion color over an 8% color wash with a 6 px grid gap and a restrained focus outline.

## Decisions I made

- **Used non-overlapping timing rather than a larger visual stagger.** SVG segments start every 1.1 seconds for a 1.1-second draw; Canvas segments start every 900 ms for a 900 ms draw. This guarantees that only one connection is actively drawing at a time.
- **Kept authored route order.** Main-leg indices are resolved first and branch-leg indices afterwards, so the primary movement reaches its endpoint before sourced detachments appear.
- **Removed the route toggle from both guided and final readouts.** During the tour only one Legion is present, and in the final web the dedicated 18-Legion roster already owns visibility.
- **Kept the roster rectangular and typographic.** The change removes decorative weight without introducing pill styling or sacrificing keyboard focus visibility.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual desktop/SVG QA at `/map` — Legion I exposed nine masks with delays `0.35s`, `1.45s`, `2.55s` through `9.15s`, each with `1.1s` duration; automated DOM inspection confirmed the sequence has no overlap and no route-toggle button.
- Manual final-web QA — all 18 route tags rendered with `0px` borders, no `::before` marker, 6 px grid gap, Legion-colored text and an 8% Legion-color background.
- Manual full-Canvas QA at 390 × 844 and `/map?mapRenderer=canvas` — after 1.25 seconds only the first connection and the beginning of the second were visible; no route toggle or browser-console errors appeared.
- `http://localhost:3000/map` — HTTP 200 after the final production build; the browser view remains on the complete Legion overview for review.

## Open issues / blockers

None.

## For next session

- Let the serial cadence settle in product review. If long nine-segment routes feel too slow, shorten both each segment's duration and its equal start cadence together so the no-overlap invariant remains intact.

## References

- `sessions/2026-07-15-221-impl-warmasters-web-single-route-tour.md`
