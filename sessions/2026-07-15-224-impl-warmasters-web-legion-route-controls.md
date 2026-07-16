---
session: 2026-07-15-224
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-legion-route-controls
parent: 2026-07-15-223
links:
  - sessions/2026-07-15-223-impl-warmasters-web-route-sequence-polish.md
commits:
  - 4da8505
---

# The Warmaster's Web — Legion route controls

## Summary

The final Warmaster's Web overview now opens with Alpha Legion pinned and gives all eighteen Legion routes a consistent hover-preview, click-to-pin and click-again-to-hide interaction. A compact `LEGION ROUTES` header reports visibility, offers `SHOW ALL` / `HIDE ALL`, and the strategic readout follows the currently previewed or pinned Legion across SVG and Canvas renderers.

## What I did

- `src/components/cartographer/CartographerRoot.tsx` — added separate preview, pinned and hidden route state plus the approved tri-state activation and all-routes controls.
- `src/components/cartographer/CourseCards.tsx` — made the readout follow hover before pinning and added the empty-selection prompt.
- `src/components/cartographer/LegionRouteRoster.tsx` — replaced the old visibility toggles with accessible preview/pin/hide buttons and a compact visibility header.
- `src/components/cartographer/CanvasStage.tsx`, `RouteMotionCanvas.tsx` and `canvas-renderer.ts` — propagated the active Legion into both Canvas route renderers and strengthened its path consistently with SVG.
- `src/app/styles/55-map.css` — styled the roster as quiet, borderless Legion-color typography with a restrained selected state and compact global control.

## Decisions I made

- **Separated preview from committed state.** Hover and keyboard focus can temporarily reveal even a hidden route without mutating visibility; leaving returns to the pinned route or empty prompt.
- **Used the requested three-state click cycle.** A visible unpinned route becomes pinned, a pinned route becomes hidden, and a hidden route becomes visible and pinned.
- **Cleared the pin for global visibility changes.** Both `SHOW ALL` and `HIDE ALL` return the readout to the neutral prompt so the global command does not imply a Legion selection.
- **Pinned Alpha Legion on entry to the full web.** The last guided Legion remains the initial context instead of dropping the reader into an unselected overview.
- **Strengthened only the presented route.** The previewed or pinned path receives full opacity and a wider stroke in SVG, static Canvas and animated Canvas; all other visible routes keep their authored styling.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual desktop/SVG QA at `/map` — completed the 18-step tour, confirmed Alpha starts pinned, exercised Dark Angels through pin → hide → show-and-pin, and verified 18/18, 17/18, 0/18 plus both all-routes commands and the neutral prompt.
- Manual mobile/Canvas QA at 390 × 844 and `/map?mapRenderer=canvas` — completed all 18 Legion steps and confirmed the final overview, Alpha pin and global controls match the SVG interaction.
- `http://localhost:3000/map` — HTTP 200 after the production build; the desktop overview remains open for product review.

## Open issues / blockers

None.

## For next session

- Let the hover/pin model settle in product review. If the full route geometry still feels too dense, the next iteration can consider click targets on the routes themselves without changing the roster state model.

## References

- `sessions/2026-07-15-223-impl-warmasters-web-route-sequence-polish.md`
