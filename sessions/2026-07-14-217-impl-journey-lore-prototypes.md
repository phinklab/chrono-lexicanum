---
session: 2026-07-14-217
role: implementer
date: 2026-07-14
status: complete
slug: journey-lore-prototypes
parent: none (direct maintainer follow-up to Sessions 214–215; no architect brief)
links:
  - sessions/2026-07-13-214-impl-great-journeys-research-pass.md
  - sessions/2026-07-13-215-impl-great-journeys-five-route-expansion.md
commits: []
---

# Great Journeys sourced chart points and Black Crusade sorties

## Summary

All 61 previously untracked journey locations now use explicit, source-cited chart points with visibly disclosed relative or schematic precision; no authored journey still relies on an invisible leg-riding waypoint. These positions form an initial editorial cartography pass rather than a completed spatial lore audit. Abaddon's Long War now consists of thirteen disconnected campaign sorties that each restart at the Eye of Terror and contain at least one researched objective or theatre.

## What I did

- `src/lib/map/voyages/types.ts` — added sourced `VoyageChartPoint` anchors, placement precision/provenance, voyage-level cartography disclosures and disconnected route segments through `breakBefore`.
- `src/lib/map/voyages/resolve.ts` — resolves catalog worlds and explicit chart points as anchors while omitting legs across route breaks.
- `src/components/cartographer/RoutesLayer.tsx` and `canvas-renderer.ts` — render inferred chart points as smaller dashed rings in both SVG and Canvas pipelines.
- `src/components/cartographer/VoyageTour.tsx` and `CourseCards.tsx` — show `INFERRED PLACEMENT` or `SCHEMATIC PLACEMENT`, the placement rationale and a direct source link on every synthetic point.
- `src/components/cartographer/Cartouche.tsx` and `CartoucheSheet.tsx` — expose route-method labels such as Abaddon's `13 campaign sorties` in the journey list and overture.
- `src/lib/map/voyages/data/{great-crusade,lion,horus,guilliman,garro,eisenhorn,gaunt,ghazghkull,yvraine,indomitus}.ts` — replaced every remaining untracked waypoint with a researched chart point; corrected regional placements including Farness Beta at the Cadian Gate, Klaisus in the Cadian System, Iathglas in Ultima and the Attilan Gate beside Attila.
- `src/lib/map/voyages/data/indomitus.ts` — reused the existing `ophellia-vii` catalog entity for Ophelia VII instead of inventing a duplicate point.
- `src/lib/map/voyages/data/abaddon.ts` — rebuilt the chronology as Eye-origin sorties I–XIII, plus separate Harmony prologue and Vigilus epilogue; expanded sparse crusades with launch panels and researched targets.
- `scripts/test-voyages.ts` — validates chart-point bounds, notes, source URLs, route breaks, the absence of authored waypoints and exactly thirteen Eye-origin Black Crusade starts.

## Decisions I made

- **Used two uncertainty levels.** `relative` means a source constrains the point to a known system, sector, neighbouring chart entity or route corridor. `schematic` means only chronology or a broad region survives. Both remain visibly non-canonical coordinates.
- **Restarted all thirteen numbered Crusades at the Eye.** The research yielded a named objective for every Crusade and no evidence that any was mustered outside the Eye. The Tenth explicitly uses an ancient alternative route from inside the Eye to bypass the Cadian Gate; the Eleventh is deliberately shown as a long uncertain jump after its daemon navigator scatters the fleet.
- **Used campaign launch cards for concurrent or sector-wide action.** A sparse Crusade can therefore explain Cadia, Elysia or the wider theatre without falsely drawing every fleet action as Abaddon's personal itinerary.
- **Kept Harmony and Vigilus outside the numbered spokes.** Harmony is the Black Legion prologue inside the Eye; Vigilus occurs after the Thirteenth Crusade and receives its own break instead of a false Cadia-to-Vigilus leg.
- **Did not reuse lookalike catalog entities.** `rithcarin` is a Necron Tomb World unrelated to Rithcarn, and `schindelgheist` is not Gothic War Schindlegeist, so both campaign locations remain sourced chart points.
- **Removed the final leg-riding fallback from authored data.** Even the Empyrean now has a visibly schematic point; the legacy waypoint type remains supported by the resolver but is not used by any current journey.
- **Did not change `brain/**` or `sessions/README.md`.** This is a strand-pure Product/UI implementation in temporary coordination-worktree launch mode.

## Verification

- `npm run test:voyages` — pass, 1,163 checks across eleven journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, all 40 DB-free suites; one live-Supabase suite auto-skipped as designed.
- `npm run build` — pass, 1,293 static pages generated; one pre-existing Turbopack NFT tracing warning from `next.config.ts` / sitemap.
- `npm run brain:lint -- --no-write` — pass, zero blocking findings and 20 repository warnings.
- In-app browser on `http://localhost:3000/map` — pass: Abaddon shows `42 stations · 13 campaign sorties`; the overture explains disconnected starts; Harmony renders as a smaller dashed point with placement rationale and a working source link; browser console has no warnings or errors.

## Open issues / blockers

- The first review found that Ghazghkull's Urgok/Fang's World cluster was placed near Octarius even though Fang's World is described as a T'au colony inside Urgok's realm. That segment needs a route break after the Haunted Gulf Warp jump and a new placement checked against the existing T'au map zone.
- The same spatial audit must be repeated for every synthetic point: chronology and source citation alone do not validate a coordinate. Existing faction zones, named regions, galactic directions, proximity language and discontinuous Warp travel all need to agree with the plotted result.
- Coordinates remain editorial cartography rather than canonical galactic measurements, and the interface states that distinction at every affected act.

## For next session

- Correct the Ghazghkull route around the Haunted Gulf, Urgok's Realm, Fang's World, Kongajaro, the Black Kraken Nebula and Octarius, without inferring a named T'au sept that the sources do not identify.
- Re-audit every journey and every synthetic point against the app's existing faction zones and map entities as well as the cited lore; record any correction and its evidence.
- Give Black Crusades I-XIII restrained, map-compatible individual colours and an unmistakable current-crusade number without turning the route into a rainbow.
- If desired, add a small legend sample for catalog-world ring versus inferred/schematic ring; the current distinction is already visible on-route and explained in the cards.
- Consider replacing the two remaining Fandom placement references with page-level primary or Lexicanum references if a better indexed source becomes available.

## References

- Overall Black Crusade model: [Games Workshop — Famous Crusades](https://www.warhammer-community.com/en-gb/articles/rxFKQljI/warhammer-40000-famous-crusades/), [Games Workshop — 13 Black Crusades](https://www.warhammer-community.com/en-gb/articles/cIZhIO0L/13-black-crusades-and-now-the-arks-of-omen-is-abaddon-warhammer-40000s-biggest-bad/), [Cadian Gate](https://wh40k.lexicanum.com/wiki/Cadian_Gate).
- Individual Crusades: [I](https://wh40k.lexicanum.com/wiki/1st_Black_Crusade), [II](https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade), [III](https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade), [IV](https://wh40k.lexicanum.com/wiki/4th_Black_Crusade), [V](https://wh40k.lexicanum.com/wiki/5th_Black_Crusade), [VI](https://wh40k.lexicanum.com/wiki/6th_Black_Crusade), [VII](https://wh40k.lexicanum.com/wiki/7th_Black_Crusade), [VIII](https://wh40k.lexicanum.com/wiki/8th_Black_Crusade), [IX](https://wh40k.lexicanum.com/wiki/9th_Black_Crusade), [X](https://wh40k.lexicanum.com/wiki/10th_Black_Crusade), [XI](https://wh40k.lexicanum.com/wiki/11th_Black_Crusade), [XII](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade), [XIII](https://wh40k.lexicanum.com/wiki/13th_Black_Crusade).
- The per-entity placement URLs are committed directly beside every `VoyageChartPoint` and rendered in its tour card; the maintainer handoff lists all 61 grouped by journey.
