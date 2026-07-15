---
session: 2026-07-15-219
role: implementer
date: 2026-07-15
status: complete
slug: great-crusade-journey-audit
parent: 2026-07-14-218
links:
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
commits: []
---

# Great Crusade journey audit and Heresy hand-off

## Summary

The Great Crusade now begins with Terra's Unification, follows the complete rediscovery chronology with connected but subdued Lost Primarch passages, and ends in an interactive 18-Legion strategic fan into the opening Horus Heresy. The extension reuses the existing route renderers and tour card instead of adding a second visualization system or a separate epilogue panel.

## What I did

- `src/lib/map/voyages/data/great-crusade.ts` — revised chronology, explanatory copy, sources and placements; added Monarchia and a schematic Alpharius location; added the 18-Legion opening-Heresy disposition.
- `src/lib/map/voyages/types.ts` and `resolve.ts` — added small optional leg styling and strategic-arm primitives, resolved into the existing route arrays.
- `src/components/cartographer/RoutesLayer.tsx` and `RouteMotionCanvas.tsx` — allowed multiple same-step legs and per-leg colour/opacity; the SVG arms now have mouse and keyboard hit paths.
- `src/components/cartographer/CartographerRoot.tsx`, `VoyageTour.tsx` and `CourseCards.tsx` — fit the full fan and show the selected Legion and destination inside the existing final card.
- `src/app/styles/55-map.css` — added restrained selected-route and in-card readout states.
- `scripts/test-voyages.ts` — added structural, chronology, muted-continuity, 18-Legion uniqueness, Isstvan-bundle and shared-reveal checks.

## Decisions I made

- **Kept the official rediscovery order without explaining Legion numbering in the card copy.** Both erased entries now read simply “Expunged Primarch Found”; the text only states that the identity, world, deeds and fate were purged.
- **Connected both Lost Primarch passages with archival grey incoming and outgoing legs.** Their place in the sequence remains legible without giving erased events the visual weight of known campaigns.
- **Used a schematic Alpharius point.** The official Vengeful Spirit encounter is presented first; the contradictory Terra account remains disclosed as an unreliable alternative rather than being mapped as fact.
- **Treated Ullanor/Armageddon as an identity pin.** The station now discloses that Ullanor was moved to Armageddon's later position, so the map does not pretend this is an M31 coordinate.
- **Made the ending a strategic epilogue, not eighteen literal orders from Ullanor.** Brighter arms represent Horus's direct deployments; quieter arms represent manipulated loyalists or strategic responses. This keeps the transition dramatic without overstating simultaneity or direct command.
- **Bundled the ten Isstvan-bound Legions without collapsing their identities.** Their curves share one narrow corridor but keep individual colours, focus targets and selectable readouts.
- **Kept the interaction inside the existing final card.** Selecting a path highlights it and reveals “Legion → destination” there, avoiding map-label collisions and a new epilogue panel.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 1,512 checks across 11 journeys.
- `npm test` — pass, all 40 DB-free suites.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map?mapRenderer=svg` — desktop and 390 × 844 mobile checked; exactly 18 selectable epilogue paths and 10 Isstvan bundle members, selected-route/readout state verified with mouse and keyboard, no card clipping and no console warnings/errors.
- Manual continuity check — both sides of Primarch II and XI render in archival grey at `0.56` opacity.

## Open issues / blockers

None.

## For next session

- Audit the next Great Journey independently with the same chronology/content/placement pass before implementation.

## References

- https://wh40k.lexicanum.com/wiki/Primarch
- https://wh40k.lexicanum.com/wiki/Unification_Wars
- https://wh40k.lexicanum.com/wiki/Great_Crusade
- https://wh40k.lexicanum.com/wiki/Lost_Primarchs
- https://www.warhammer-community.com/en-gb/articles/w3jmtzfv/traitor-lore-how-the-trap-was-set/
- https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf
