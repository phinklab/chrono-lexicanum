---
session: 2026-07-16-232
role: implementer
date: 2026-07-16
status: complete
slug: yvraine-journey-audit
parent: 2026-07-15-219
links:
  - sessions/2026-07-13-215-impl-great-journeys-five-route-expansion.md
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - sessions/2026-07-15-219-impl-great-crusade-journey-audit.md
  - sessions/2026-07-16-231-impl-ghazghkull-journey-audit.md
commits: []
---

# Yvraine journey audit — The Seventh Path

## Summary

`Yvraine · The Seventh Path` now tells a sourced 22-act chronicle from her ancient Biel-Tan origin to the failed Cronesword conclave on Iathglas. The audit retains all 21 inherited canonical beats, adds the missing Battle of Threccia, corrects Iathglas from Ultima to Segmentum Pacificus, exposes mobile-craftworld and Webway uncertainty, and keeps thirteen Webway or extradimensional transitions visible as pale-cyan dotted journeys rather than deleting them from the map.

## What I did

- `src/lib/map/voyages/data/yvraine.ts` — expanded the journey from 21 to 22 acts by adding the early-M42 Battle of Threccia before the Saim-Hann raid.
- Corrected the opening chronology: Biel-Tan now establishes Yvraine's ancient origin and Path of the Dancer, while the exactly dated `838.M41` Gnosis Prime act carries her Dire Avenger path and the later Warlock, exile, Ranger and Corsair bridge to Commorragh.
- Renamed `Psychedelta · Nine Lives Returned` to `The Rubric Reversed` and removed the unsupported count and single-heartbeat precision.
- Clarified Belial IV as the recovery of one Cronesword while another remained behind, preparing the later Shalaxi revelation.
- Recast Agarimethea's null-fields as preventing Webway insertion and forcing an orbital descent instead of claiming they severed the Ynnari from the Webway inside the tomb.
- Moved Iathglas from the unsupported eastern `gx: 760` placement to a schematic Pacificus point at `gx: 165`, following *Psychic Awakening: Phoenix Rising* p. 22 and visibly disclosing the conflict with Lexicanum's current Ultima infobox.
- Added inferred or schematic placement disclosures to both Biel-Tan, Ulthwé and Iyanden visits plus Commorragh, Ursulia, the Black Library and Zandros; these catalog pins now read as mobile-world, gate or regional identities rather than event ephemerides.
- Added four chronology sections: `THE MANY PATHS · EXILE`, `THE SEVENTH PATH · GATHERING STORM`, `RISE OF THE YNNARI · THE CRONESWORDS` and `THE HUNTER · SHALAXI`.
- Added the journey-level `Webway chronicle` disclosure explaining the visual grammar and the difference between grounded, extradimensional and unconnected transitions.
- Reused the existing `LegOverride.effect: "jump"` renderer path for thirteen Webway or extradimensional transitions. Their arriving legs use ice cyan `#9ce6ff`, opacity `0.82` and the existing compact-dot pattern; the one grounded Ulthwé-to-Belial course keeps the longer section-coloured dash.
- Kept seven genuinely ungrounded transitions disconnected: ancient Biel-Tan to Gnosis, Gnosis to Commorragh, fractured Biel-Tan to Ulthwé, the later Ulthwé-to-Iyanden handoff, Zaisuthra to Agarimethea, Threccia to Saim-Hann and Zandros to Iathglas.
- `scripts/test-voyages.ts` — added regression coverage for the 22-act count, four section starts, Gnosis date, Psychedelta heading, Threccia, Pacificus Iathglas placement, the thirteen cyan dotted transitions and the final 14-leg resolved route.

## Decisions I made

- **Retained every inherited station.** All 21 events are canonically supported and contribute a distinct biographical, Gathering Storm, Cronesword or post-Rift turn; the defects were precision, copy and route semantics rather than invented acts.
- **Added only Threccia.** It is the missing causal bridge that introduces Shalaxi's direct hunt and makes the Iathglas ending intelligible. Coheria, the Palace of Slaanesh, Iachi, Spirit Gate/Os'tara, Port Vilifact and the intermediate Hand of Darkness locations remain unpinned because they are not visited, not securely placed, outside the lean character focus or already represented by a composite act.
- **Kept Webway travel visible.** A `breakBefore` would preserve chronology but erase the journey the maintainer explicitly wanted shown. The existing dotted `jump` effect already means “chronology-preserving passage without an asserted realspace course,” so cyan colour plus the cartography note supplies the Webway distinction without new framework or renderer code.
- **Included the Warp-adjacent Hand of Darkness passages in the same dotted family.** Black Library, Garden of Nurgle and Einerash are one sourced extradimensional journey; the route note calls this out without pretending that the Garden has a galactic course.
- **Did not connect every consecutive act.** Dotted lines are not permission to invent a travel mode. Where neither a course nor a defensible extradimensional transition is established, the segment remains broken.
- **Used Pacificus only as a broad Iathglas claim.** The printed campaign text overrides the present Lexicanum infobox, but supplies no sector or coordinate; the new point therefore sits in Pacificus with an explicit schematic disclosure rather than claiming the Miaghu System has an exact map position.
- **Kept framework scope at zero.** Sections, placement notes, per-leg colour/opacity, jump effects and chart points already existed and work in both the SVG and mobile Canvas renderers.

## Verification

- `git diff --check` — pass before the report; repeated in the final worktree audit.
- `npm run test:voyages` — pass, 2,749 checks across 12 journeys.
- `npm test` — pass, all 40 DB-free suites; one live-Supabase suite auto-skipped as designed.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings and 21 unchanged repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after allowing the build to fetch the four existing Google Fonts; 1,293 static pages generated. The existing Turbopack NFT trace warning remains unchanged.
- Manual in-app browser QA at `http://localhost:3100/map` — desktop 1280 × 720 and mobile 390 × 844.
- Manual desktop tour QA — traversed all 22 acts, including Gnosis, the first Webway transition, Threccia and Iathglas; final full-route and restart states verified.
- Manual route-effect QA — the desktop SVG exposes 14 route paths: thirteen `#9ce6ff` compact-dot paths at `0.82` opacity and one muted longer-dash grounded course.
- Manual mobile QA — the route switches to the 390 × 844 Canvas renderer, hides the duplicate SVG stroke and visibly retains the cyan dotted Commorragh-to-Ursulia journey.
- Manual responsive QA — the placement-heavy Iathglas final card and Ursulia step remain within the 390-pixel viewport with no horizontal overflow and visible navigation controls.
- Browser console — no warnings or errors on desktop or mobile.

## Open issues / blockers

None for the Yvraine journey.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route after this single Yvraine commit lands in draft PR #265.
- Treat the Lexicanum Iathglas Ultima infobox as a source conflict until it is reconciled with *Psychic Awakening: Phoenix Rising* p. 22; the journey now follows the primary printed Pacificus statement.
- Keep using the cyan dotted language only for sourced Webway or other extradimensional passages; unknown chronological handoffs should remain broken.

## References

- https://www.blacklibrary.com/all-products/hand-of-darkness-mp3-part1.html
- https://www.blacklibrary.com/warhammer-40000/novels/ghost-warrior-rise-of-the-ynnari-ebook.html
- https://www.blacklibrary.com/authors/gav-thorpe/rise-of-the-ynnari-wild-rider-ebook-2018.html
- https://www.warhammer-community.com/en-gb/articles/zxxb5mab/explore-the-enigmatic-aeldari-with-these-black-library-classics/
- https://www.warhammer-community.com/en-gb/articles/1BHx3iuB/5-times-the-imperium-would-have-been-doomed-without-roboute-guilliman/
- https://wh40k.lexicanum.com/wiki/Yvraine
- https://wh40k.lexicanum.com/wiki/Ynnari
- https://wh40k.lexicanum.com/wiki/Gnosis_Prime
- https://wh40k.lexicanum.com/wiki/Battle_of_Biel-tan
- https://wh40k.lexicanum.com/wiki/War_in_the_Labyrinth
- https://wh40k.lexicanum.com/wiki/Hand_of_Darkness
- https://wh40k.lexicanum.com/wiki/Zaisuthra
- https://wh40k.lexicanum.com/wiki/Agarimethea
- https://wh40k.lexicanum.com/wiki/Battle_of_Threccia
- https://wh40k.lexicanum.com/wiki/Raid_on_Saim-Hann
- https://wh40k.lexicanum.com/wiki/Zandros
- https://wh40k.lexicanum.com/wiki/Iathglas
- https://wh40k.lexicanum.com/wiki/Battle_of_Iathglas
