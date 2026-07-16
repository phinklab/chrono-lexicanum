---
session: 2026-07-15-224
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-hover-only-highlight
parent: 2026-07-15-223
links:
  - sessions/2026-07-15-223-impl-warmasters-web-legion-route-controls.md
commits:
  - 98bb562
---

# The Warmaster's Web — hover-only route highlight

## Summary

Pinned Legion selection now controls only the persistent button and strategic readout state; the stronger path rendering is strictly temporary while the Legion control is hovered or keyboard-focused. The change is shared by SVG, static Canvas and animated Canvas rendering.

## What I did

- `src/components/cartographer/CartographerRoot.tsx` — separated the pinned Legion passed to selection logic from the preview Legion passed to route highlighting.
- `src/components/cartographer/RoutesLayer.tsx` — kept route activation and ARIA selection pinned while deriving strong SVG path paint only from hover/focus preview.
- `src/components/cartographer/CanvasStage.tsx`, `RouteMotionCanvas.tsx` and `canvas-renderer.ts` — renamed and narrowed the Canvas state to an explicitly temporary highlighted Legion.

## Decisions I made

- **Kept the selected roster tag and readout persistent.** Only the map path loses emphasis after hover; the user still has a clear record of which Legion is pinned.
- **Preserved preview through the click event.** Clicking while still hovering does not cause the highlight to flicker off; pointer leave or blur removes it.
- **Applied the same distinction to every renderer.** The visual contract does not depend on SVG versus Canvas or desktop versus mobile.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual desktop/SVG QA at `/map` — Alpha opened pinned with its readout but with 0 highlighted paths; Dark Angels focus/hover strengthened all 9 route segments, and leaving retained its pinned readout while returning to 0 highlighted paths.
- Browser console — no runtime errors during the final interaction check.

## Open issues / blockers

None.

## For next session

- No follow-up required for this interaction adjustment.

## References

- `sessions/2026-07-15-223-impl-warmasters-web-legion-route-controls.md`
