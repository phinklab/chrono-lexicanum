---
session: 2026-07-15-220
role: implementer
date: 2026-07-15
status: complete
slug: great-crusade-journey-audit
parent: 2026-07-14-218
links:
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
commits:
  - 03e7347
  - a77ca42
---

# Great Crusade journey audit and Heresy hand-off

## Summary

The Great Crusade now begins with Terra's Unification, follows the complete rediscovery chronology with connected but subdued Lost Primarch passages, and closes on the coloured 18-Legion fan. The fan's detailed accounts now belong to a separate one-station `The Warmaster's Web` journey reached after the Great Crusade's full-route reveal; both journeys reuse the same arm data, route renderer and tour card.

## What I did

- `src/lib/map/voyages/data/great-crusade.ts` — revised chronology, explanatory copy, sources and placements; added Monarchia and a schematic Alpharius location; added the 18-Legion opening-Heresy disposition.
- `src/lib/map/voyages/types.ts` and `resolve.ts` — added shared strategic destinations and optional intermediate arm segments while keeping them in the existing route arrays.
- `src/components/cartographer/RoutesLayer.tsx` — added eight labelled endpoint controls; target selection highlights the arriving bundle, while Legion selection highlights every segment belonging to that Legion.
- `src/components/cartographer/CartographerRoot.tsx`, `VoyageTour.tsx`, `CourseCards.tsx` and `StrategicReadout.tsx` — show either a shared destination account or an individual Legion account inside the existing final card.
- `src/lib/map/voyages/data/warmasters-web.ts` — added the network-only Horus Heresy journey by reusing the Great Crusade finale's arm dataset rather than duplicating it.
- `src/lib/map/voyages/types.ts`, `resolve.ts`, `Cartouche.tsx` and `CourseCards.tsx` — added a small generic journey-continuation CTA and correct singular station labels.
- `src/app/styles/55-map.css` — added restrained endpoint, selected-route and in-card readout states.
- `scripts/test-voyages.ts` — added structural, chronology, muted-continuity, shared-endpoint, multi-segment and shared-reveal checks.

## Decisions I made

- **Kept the official rediscovery order without explaining Legion numbering in the card copy.** Both erased entries now read simply “Expunged Primarch Found”; the text only states that the identity, world, deeds and fate were purged.
- **Connected both Lost Primarch passages with archival grey incoming and outgoing legs.** Their place in the sequence remains legible without giving erased events the visual weight of known campaigns.
- **Used a schematic Alpharius point.** The official Vengeful Spirit encounter is presented first; the contradictory Terra account remains disclosed as an unreliable alternative rather than being mapped as fact.
- **Treated Ullanor/Armageddon as an identity pin.** The station now discloses that Ullanor was moved to Armageddon's later position, so the map does not pretend this is an M31 coordinate.
- **Made the ending a strategic epilogue, not eighteen literal orders from Ullanor.** Brighter arms represent Horus's direct deployments; quieter arms represent manipulated loyalists or strategic responses. This keeps the transition dramatic without overstating simultaneity or direct command.
- **Separated Isstvan III from Isstvan V and bundled only within each actual operation.** Four Legions purge their loyalists at III; seven reach the Dropsite Massacre at V. Each Legion keeps its own colour, role, source and selectable account.
- **Gave the Word Bearers one continuous two-stage arm.** Their route now enters Isstvan V as part of the false second wave and then continues to Calth; selecting either segment highlights both.
- **Grouped the Ultramarines and Word Bearers at Calth.** The shared endpoint explains the false joint muster, while each path retains its own account of the ambush.
- **Placed the Shield Worlds outside the charted galactic disc without inventing a direction.** The source supports an intergalactic campaign but no bearing, so the route simply exits toward an off-disc terminus and makes no Eastern Fringe claim.
- **Kept Chondax at the existing catalogue point.** No published canonical galactic coordinate was found. The route copy attributes the White Scars' delay to Alpha Legion interference, the blockade, Prospero, warp storms and Traitor-held routes rather than assuming great distance from Terra.
- **Kept the interaction inside the existing final card.** Selecting an endpoint explains the shared design; selecting a path explains that Legion's role, avoiding a new epilogue panel.
- **Separated narrative ownership from the closing image.** The Great Crusade still ends with the full coloured fan, but its final act is now “The Great Crusade Ends”; the follow-up CTA opens `The Warmaster's Web · Horus Heresy` as its own journey.
- **Made the Warmaster journey a single-anchor strategic network.** It contains only the eighteen Legion paths and their eight shared destinations, so no synthetic transit stations were invented merely to satisfy the normal multi-stop route shape.
- **Promoted selected-arm copy to the normal route-card hierarchy.** Role, “Legion → destination”, account and source replace the generic station content when selected. Strategic placement disclosures are no longer rendered in these arm/destination cards, and the Great Crusade finale itself carries no placement block.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 1,861 checks across 12 journeys.
- `npm test` — pass, all 40 DB-free suites.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map?mapRenderer=svg` — desktop and 390 × 844 mobile checked. The follow-up path `Great Crusade → Show the full route → The Warmaster's Web · Horus Heresy` was verified; the new roster row correctly reads `1 station`, and the journey resolves exactly 8 endpoint controls and 19 arm segments for 18 Legions.
- Manual strategic-card QA — selecting the Ultramarines arm produced only `AMBUSHED MUSTER`, `Legion XIII · Ultramarines → Calth`, its account and source link in the normal route-card hierarchy. Selecting Chondax produced the shared destination account with no schematic/inferred placement text.
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
- https://www.warhammer-community.com/en-gb/articles/5b3wkzet/the-horus-heresy-the-tragic-tale-of-the-dropsite-massacre/
- https://www.warhammer-community.com/en-gb/articles/qbwgpft8/loyalist-lore-where-were-the-legiones-astartes-as-the-horus-heresy-broke-out/
- https://www.warhammer-community.com/en-gb/articles/9wh4zb5f/pages-from-the-black-books-the-betrayal-at-chondax/
- https://assets.warhammer-community.com/22-01_the_horus_heresy_black_book_extract_the_thramas_crusade-fwtcctcyvt-kspnxfwdz1.pdf
- https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf
- https://wh40k.lexicanum.com/wiki/Chondax
