---
session: 2026-07-16-230
role: implementer
date: 2026-07-16
status: complete
slug: abaddon-black-crusades-journey-audit
parent: 2026-07-15-220
links:
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
  - sessions/2026-07-15-227-impl-horus-journey-audit.md
  - sessions/2026-07-16-228-impl-guilliman-journey-audit.md
  - sessions/2026-07-16-229-impl-garro-journey-audit.md
commits: []
---

# Abaddon journey audit — The Black Crusades

## Summary

`Abaddon · The Black Crusades` now tells a sourced 40-act chronicle from Abaddon's exile and the founding of the Black Legion through all thirteen Black Crusades to the destruction of Cadia. The audit removes redundant or out-of-focus stops, restores Ornsworld and Cadia's pylon reversal, corrects disputed chronology and causality, and makes every uncertain route position explicit.

## What I did

- `src/lib/map/voyages/data/abaddon.ts` — retitled and focused the journey on the thirteen Black Crusades, reducing the inherited 42 acts to a leaner 40 without adding framework or component code.
- Corrected the Eleusinian Veil and Harmony sequence so Sargon leads the founders to Abaddon and the Black Legion is declared before the Battle of Harmony.
- Replaced the Cadia surface pin for Sigismund's duel with a relative Cadian Gate chart point and converted Uralan and Mackan into visibly schematic locations.
- Removed the parallel Cadia diversion/siege cards from the Third and Fourth Crusades; their sourced fleet actions remain in the launch cards without being drawn as Abaddon's personal itinerary.
- Corrected Mackan's Death Company outcome and changed its date from an exact launch-year claim to a broad `during VII` label.
- Exposed the Ninth Crusade's M37/M38 source conflict, neutralised the disputed destruction method at Antecanis and removed the editorial `537–554.M38` arithmetic from Cancephalus.
- Added Ornsworld and the Eye of Night to the Twelfth Crusade, separated both relic raids from unsupported route lines, and removed unsafe Blackstone ordinal wording at Brinaga.
- Replaced the source-conflicted Ormantep prelude with Cadia's pylon activation, then retained Cadia's destruction as a distinct final act.
- Removed Vigilus as a post-Crusade epilogue so the journey ends with Cadia and the Great Rift in M41.
- `scripts/test-voyages.ts` — added regression coverage for the new title, M31–M41 focus, 40-act total, Ornsworld, the two Cadia climax acts and the relative/schematic Cadian Gate, Uralan and Mackan placements.

## Decisions I made

- **Kept the thirteen Eye-of-Terror launch cards.** They are the clearest existing structure for thirteen separate campaigns and allow concurrent fleet actions to be summarised without drawing false personal travel.
- **Used a relative Cadian Gate chart point for the Sigismund duel.** The encounter is a void battle aboard the `Eternal Crusader`, not a battle on Cadia's surface.
- **Used schematic points for Uralan and Mackan.** Uralan's inside/outside-the-Eye traditions conflict, while Mackan's segmentum, sector and system are not established consistently; neither should inherit an exact catalog coordinate in this journey.
- **Removed the Third and Fourth Crusade Cadia cards instead of retaining disconnected duplicates.** Both are concurrent holding actions already explained by their launch cards and are not necessary beats in Abaddon's personal sequence.
- **Kept every other II–XI campaign objective.** None proved invented; their defects were excessive dating precision, prose compression or undisclosed editorial geometry.
- **Added only Ornsworld to the Gothic War.** The paired Hand of Darkness and Eye of Night raids are the necessary material prelude; adding Rebo and Lukitar would make the route denser without improving its central arc.
- **Removed ordinal wording at Brinaga but kept Fularis II's three linked fortresses.** The capture order is source-sensitive, while the linked-weapon event itself is the meaningful and supported turn.
- **Removed Ormantep.** Its ground and fleet accounts are difficult to reconcile, its plotted position produced a spatial backtrack, and it is not needed once Cadia's pylon reversal carries the Thirteenth Crusade's decisive narrative turn.
- **Ended at Cadia rather than Vigilus.** Vigilus belongs to the post-Great-Rift era and weakens the ending of a journey explicitly titled `The Black Crusades`.

## Verification

- `git diff --check` — pass.
- `npm run test:voyages` — pass, 2,560 checks across 12 journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, all 40 DB-free suites; the live Supabase recommendation suite remains skipped by the standard harness.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after permitting the configured Google Font downloads; the existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map` — production build with the documented local `PREVIEW_GATE=off` lever; desktop 1440 × 900 and mobile 390 × 844.
- Manual tour QA — all 40 acts traversed in both directions, all thirteen section transitions checked, the final full-route action and restart state verified.
- Manual responsive QA — every tour card remained wholly inside both viewports with no horizontal, vertical or internal text overflow; mobile cards measured 366 px wide.
- Manual cartography QA — Cadian Gate, Uralan, Mackan, the disputed Ninth Crusade, Ornsworld and both Cadia climax cards rendered with the intended labels, breaks and placement disclosures.
- Browser console — no warnings or errors.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route after this uncommitted implementation is accepted and committed once to draft PR #265.

## References

- https://www.warhammer-community.com/en-gb/articles/rxFKQljI/warhammer-40000-famous-crusades/
- https://www.warhammer-community.com/en-gb/articles/cIZhIO0L/13-black-crusades-and-now-the-arks-of-omen-is-abaddon-warhammer-40000s-biggest-bad/
- https://www.blacklibrary.com/warhammer-40000/novels/the-talon-of-horus-ebook.html
- https://www.blacklibrary.com/all-products/black-legion-ebook.html
- https://wh40k.lexicanum.com/wiki/Battle_of_Harmony
- https://wh40k.lexicanum.com/wiki/1st_Black_Crusade
- https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade
- https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade
- https://wh40k.lexicanum.com/wiki/4th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/Fifth_Black_Crusade
- https://wh40k.lexicanum.com/wiki/6th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/7th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/8th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/9th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/10th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/11th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/12th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/13th_Black_Crusade
- https://wh40k.lexicanum.com/wiki/Uralan
- https://wh40k.lexicanum.com/wiki/Mackan
- https://wh40k.lexicanum.com/wiki/Ornsworld
