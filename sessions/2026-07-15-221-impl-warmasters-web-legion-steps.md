---
session: 2026-07-15-221
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-legion-steps
parent: 2026-07-15-220
links:
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
commits:
  - 9ff57fa
---

# The Warmaster's Web — Legion steps

## Summary

`The Warmaster's Web` is now an independent 18-step Horus Heresy journey: one guided reveal for every active Legion, from Horus' opening dispositions to Terra or to the last evidenced point for forces that never reached the Siege. Main Primarch or Legion movements stay vivid, sourced subordinate fleets appear as faint terminating branches, and every Legion route can be hidden or restored during the tour and from a compact full-web roster.

## What I did

- `src/lib/map/voyages/data/warmasters-web.ts` — replaced the reused eight-destination opening fan with researched, independently authored routes for Legions I, III–X, XII–XX; added explicit late-arrival and non-arrival endpoints plus meaningful partial-fleet branches.
- `src/lib/map/voyages/types.ts`, `resolve.ts`, `fit.ts` and `index.ts` — added the generic `legion-steps` presentation, terminating branch contract, per-arm reveal metadata and one-arm camera bounds.
- `src/components/cartographer/VoyageTour.tsx`, `StrategicReadout.tsx` and `LegionRouteRoster.tsx` — made each tour act a Legion readout with an individual route toggle; added the 18-button post-tour route control.
- `src/components/cartographer/RoutesLayer.tsx` and `RouteMotionCanvas.tsx` — retained earlier routes, hid only requested Legion geometry, and limited destination labels to the current or selected Legion.
- `src/components/cartographer/CanvasStage.tsx` and `canvas-renderer.ts` — carried the same reveal, opacity and route-filter semantics into the Android Canvas renderer.
- `src/components/cartographer/CartographerRoot.tsx`, `CourseCards.tsx` and `Cartouche.tsx` — owned route visibility state, reset selection between Legion steps and used `legions` rather than `stations` in the journey UI and live status.
- `src/app/styles/55-map.css` — styled the compact colour-coded route roster, visibility action and muted non-focused destinations for desktop and mobile.
- `scripts/test-voyages.ts` — replaced the old one-anchor/shared-array assertions with Legion order, independent ownership, one-route-per-step, progressive reveal, branch opacity and full-destination checks.

## Decisions I made

- **Used exactly eighteen guided steps.** The tour follows Roman Legion order and omits only the expunged II and XI; individual route stations remain map geometry rather than extra clicks in this iteration.
- **Ended absent forces where their documented road ends.** The Space Wolves and Raven Guard terminate at Yarant, the coherent Night Lords at Thramas, the Iron Hands around Medusa, and the Word Bearers and Alpha Legion at the point where their main command no longer continues as a unified road to Terra.
- **Followed the Primarch or main fleet, with explicit exceptions.** The Salamanders route states that it follows Vulkan while most of the shattered Legion remains elsewhere; the Iron Hands route states that no coherent main fleet survives Ferrus Manus.
- **Rendered subordinate forces as faint, terminating branches.** Corswain, Eidolon, the Phall Retribution Fleet, Skraivok, Meduson, Autek Mor, Garro, Kor Phaeron, Zardu Layak and Alpha Legion detachments are acknowledged without turning one Legion step into several tours.
- **Kept the Great Crusade fan independent.** Its opening-Heresy closing image still exists, but `The Warmaster's Web` no longer shares that arm array and now owns its deeper route research.
- **Made visibility an explicit control.** The current Legion can be hidden or restored from its readout; after the tour, a 6×3 mobile / 9×2 desktop roster controls all eighteen routes and shows the visible count.
- **Kept earlier routes visible while paging.** Each step reveals only its Legion's main and branch legs; previous visible choices remain on the chart so the web accumulates naturally.
- **Applied the feature to every renderer.** SVG, the narrow-screen motion Canvas and the full Android Canvas use the same reveal and visibility state rather than diverging by device.
- **Did not add clickable route stations.** The maintainer chose Legion-scale steps first; the resolved route data and arm bounds leave a clean follow-up path if station-by-station navigation is later judged necessary.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npm test` — pass, all 40 DB-free suites.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map` — all 18 Legion cards traversed in order; accumulated segment counts, focused target labels, per-card hide/show and the final 18-route roster were verified.
- Manual responsive QA at 390 × 844 — 6×3 route roster, 36px controls, 18/18 visible count, dock clearance and zero horizontal overflow verified.
- Manual Canvas QA at `/map?mapRenderer=canvas` — Legion I rendered with the full Canvas renderer, hide/show updated correctly and no browser-console errors occurred.

## Open issues / blockers

None.

## For next session

- Let the 18-step version settle in product review. If a Legion step feels too coarse, promote its already-authored route destinations to clickable substeps without changing the research dataset.

## References

- https://www.warhammer-community.com/en-gb/articles/qbwgpft8/loyalist-lore-where-were-the-legiones-astartes-as-the-horus-heresy-broke-out/
- https://www.warhammer-community.com/en-gb/articles/w3jmtzfv/traitor-lore-how-the-trap-was-set/
- https://www.warhammer-community.com/en-gb/articles/y7oihj6s/the-horus-heresy-explained-a-short-history-of-the-warmasters-betrayal/
- https://www.warhammer-community.com/en-gb/articles/ikfy40va/the-lore-of-legions-imperialis-how-the-great-slaughter-began/
- https://wh40k.lexicanum.com/wiki/Timeline_of_the_Horus_Heresy
- https://wh40k.lexicanum.com/wiki/Siege_of_Terra
