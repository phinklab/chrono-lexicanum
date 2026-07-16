---
session: 2026-07-16-231
role: implementer
date: 2026-07-16
status: complete
slug: eisenhorn-journey-audit
parent: 2026-07-15-220
links:
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
  - sessions/2026-07-15-227-impl-horus-journey-audit.md
  - sessions/2026-07-16-228-impl-guilliman-journey-audit.md
  - sessions/2026-07-16-229-impl-garro-journey-audit.md
  - sessions/2026-07-16-230-impl-abaddon-black-crusades-journey-audit.md
commits: []
---

# Eisenhorn journey audit — The Ordo Dossiers

## Summary

`Eisenhorn · The Ordo Dossiers` now tells a sourced 16-act core-trilogy chronicle from the Eyclone case on Hubris in 240.M41 to Pontius Glaw's defeat on Ghül in 392.M41. The audit corrects scene chronology and causality, restores Cinchare, Jeganda and Ghül, removes the out-of-scope Magos coda, and discloses every editorial map placement instead of presenting it as an exact coordinate.

## What I did

- `src/lib/map/voyages/data/eisenhorn.ts` — expanded the route from 13 to 16 acts and focused it on `Xenos`, `Malleus` and `Hereticus` without adding framework or component code.
- Added Cinchare as the bargain that enables the Quixos victory, Jeganda as Fischig's betrayal and final accusation, and Ghül as the trilogy's proper 392.M41 ending.
- Removed the Gershom and King-in-Yellow sentence so the route no longer folds a much later `The Magos` coda into Hubris or contradicts its 152-year scope.
- Corrected the Xenos chronology, KCX-1288's tetrascape account, 56-Izar's Molitor/Cherubael refusal, Cadia's 338–340.M41 span, Farness Beta's Malus Codicium turn, Messina's simultaneous Distaff attack and Fischig's Hubris/Jeganda sequence.
- Added `XENOS · THE NECROTEUCH`, `MALLEUS · THE COMPROMISE` and `HERETICUS · THE FALL` as existing journey sections.
- Marked Hubris, Gudrun, Damask, Thracian Primaris, Eechan and Durer as relative catalog placements; retained the existing relative KCX-1288, 56-Izar and Farness Beta points.
- Added Cinchare and Ghül as disconnected schematic points and Jeganda as a relative outer-Scarus point; broke unsupported century jumps and the route around unchartable locations.
- `scripts/test-voyages.ts` — added regression coverage for the trilogy scope, 16-act count, section boundaries, new stations, uncertain catalog pins, route breaks, Ghül finale, ten resolved transitions and exclusion of the later coda.

## Decisions I made

- **Scoped the route to the core trilogy.** Official Warhammer material identifies `Xenos`, `Malleus` and `Hereticus` as the core trilogy, while `The Magos` is a separate fourth novel; the existing 240–392.M41 span also describes the trilogy rather than Gershom.
- **Kept all inherited locations but replaced the final compression.** None of the inherited stations was invented, but KCX-1288, 56-Izar, Cadia, Spaeton House and the closing Hubris card needed factual correction.
- **Added Cinchare.** Eisenhorn's bargain with Pontius Glaw is the missing causal bridge between the Carnificina escape, the weapons used against Quixos and Glaw's return in `Hereticus`.
- **Separated Hubris, Jeganda and Ghül.** Fischig's moral break, his later betrayal and death, and the final defeat of Glaw are distinct events on distinct worlds and cannot share one Hubris card.
- **Kept Messina as context rather than a station.** The Distaff attack is simultaneous with the wider assault on Eisenhorn's organisation, not part of his physical itinerary.
- **Did not add Lethe Eleven, Promody, Orbul Infanta or Thessalon.** They are sourced settings, but the retained stations already carry their relevant transitions without bloating the personal journey.
- **Disconnected Cinchare and Ghül.** Their broad Halo Zone or beyond-Imperial-space descriptions cannot support a continuous plotted course; placement copy preserves chronology without inventing bearings or distance.
- **Reused the existing journey contract.** Sections, `placement` and `breakBefore` supplied every required behaviour, so no renderer, card or map framework changed.

## Verification

- `git diff --check` — pass.
- `npm run test:voyages` — pass, 2,615 checks across 12 journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- Manual in-app browser QA at `/map` — desktop 1440 × 900 and mobile 390 × 844, with the mobile DOM width explicitly verified before review.
- Manual tour QA — all 16 acts and all three section transitions traversed on desktop and mobile; previous/next controls, the final full-route action and restart state verified.
- Manual responsive QA — the overture, placement-heavy Cinchare card and Ghül finale remained inside the 390 × 844 viewport with navigation controls visible and usable.
- Manual cartography QA — the Scarus cluster, isolated Cinchare and Ghül points, relative Jeganda point, ten connected transitions and all placement disclosures rendered as intended.
- Browser console — no warnings or errors on desktop or mobile.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route after this single Eisenhorn commit lands in draft PR #265.

## References

- https://www.blacklibrary.com/series/eisenhorn
- https://www.blacklibrary.com/series/eisenhorn/xenos-ebook.html
- https://www.blacklibrary.com/authors/dan-abnett/malleus-ebook.html
- https://www.blacklibrary.com/all-products/hereticus-ebook.html
- https://www.blacklibrary.com/warhammer-40000/novels/the-magos-ebook.html
- https://www.warhammer-community.com/en-gb/articles/4rRrvgp3/inquisitor-fiction-infiltrate-the-archives-for-top-secret-titles-from-black-library/
- https://wh40k.lexicanum.com/wiki/Xenos_(Novel)
- https://wh40k.lexicanum.com/wiki/Malleus_(Novel)
- https://wh40k.lexicanum.com/wiki/Hereticus_(Novel)
- https://wh40k.lexicanum.com/wiki/Cinchare
- https://wh40k-de.lexicanum.com/wiki/Jeganda
- https://wh40k.lexicanum.com/wiki/Gh%C3%BCl
