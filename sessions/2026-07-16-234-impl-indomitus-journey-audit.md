---
session: 2026-07-16-234
role: implementer
date: 2026-07-16
status: complete
slug: indomitus-journey-audit
parent: 2026-07-15-220
links:
  - sessions/2026-07-13-215-impl-great-journeys-five-route-expansion.md
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
  - sessions/2026-07-16-233-impl-yvraine-journey-audit.md
commits: []
---

# Indomitus journey audit — The Campaign Network

## Summary

`The Indomitus Crusade` now presents a sourced 22-act campaign network from the Sol muster through the three documented fleet axes to Baal. The audit replaces disputed absolute M41/M42 dates with relative chronology, adds the missing Fleet Primus turn at Fenris, merges the two redundant Pariah endpoints and removes unsupported precision from dates, regional pins and route lines.

## What I did

- `src/lib/map/voyages/data/indomitus.ts` — retained the 22-act scope while reorganising the route into seven sections for the muster, Tertius, Secundus, Betaris, Primus' opening, the Pariah deployment and the transition through Raukos into Nihilus.
- Recast Mars as the arsenal of the Sol muster and disconnected it from normal voyage geometry, so Cawl's Primaris Revelation aboard the `Zar-Quaesitor` is no longer presented as a Martian port call.
- Replaced `999.M41`, `001.M42`, `012.M42` and generic later-M42 labels with relative chronology grounded in the revised Indomitus timeline.
- Corrected Vorlese from a warp route to a world on a major Sol corridor and added explicit schematic placement disclosures for Olmec and Machorta Sound.
- Preserved the repeated Terra and Vorlese origins as documented battle-group branches while clarifying that they are diagrammatic restarts rather than return journeys.
- Reframed Cadia as the catalog anchor for the wider Cadian Gate and Road of Martyrs theatre.
- Corrected the Gathalamor causal summary and added Fenris as the missing Primus turn between the opening victory and the later first-phase transition.
- Replaced the separate Tertius and Primus Pariah endpoints with one disconnected regional theatre covering Kallides, Mesmoch, Paradyce, VanLeskus' death and the Silent King's opposition.
- Moved Raukos after the late-first-phase Pariah block, dated it by the twelfth crusade year and retained its sourced relative relationship to the Attilan Gate.
- Recast Macragge as the chart anchor for the wider Plague Wars, kept Iax as Fleet Primus' climax and made Baal explicitly the end of the displayed Lord Commander axis rather than the end of the crusade.
- `scripts/test-voyages.ts` — updated the existing Indomitus regression expectations for the unchanged 22-act count, six fleet sections, Fenris, one disclosed Pariah theatre, relative dating and thirteen defensible route legs.

## Decisions I made

- **Kept every inherited canonical event while merging the two Pariah cards.** The audit found no invented event core; the defects were duplicated theatre coverage and false precision rather than fabricated lore.
- **Added only Fenris.** It is the missing sourced Fleet Primus turn and a distinct strategic beat; Ganymede, Lessira, Catachan, Paradyce, Mesmoch, Fleet Sextus and Fleet Quartus remain unpinned because they are local Sol context, insufficiently located, not assignable to a displayed axis, already represented by a regional card or outside the lean three-fleet focus.
- **Used relative chronology throughout.** The revised canon supports campaign years and phase relationships more strongly than absolute M41/M42 stamps.
- **Disconnected logistics and uncertain operations.** Mars, the Pariah theatre and the restart at Raukos preserve narrative order without inventing a physical transit; the unsupported Machorta-to-Pariah line is gone.
- **Kept the Pariah card in Primus green.** It follows the Kallides deployment in the guided chronology, while its copy and placement disclosure explicitly identify the joint Primus/Tertius theatre; no arrival line falsely assigns the route to either fleet.
- **Reused the existing journey contract.** Sections, `placement` and `breakBefore` provide every required behaviour, so no map component, renderer or framework changed.

## Verification

- Automated tests were not run at the maintainer's explicit direction for this journey.
- Mobile QA was not performed at the maintainer's explicit direction.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings and 21 unchanged repository warnings.
- `git diff --check` — pass.
- Manual in-app browser QA at `/map` — desktop 1280 × 720; the 22-station legend, overture and all seven section labels rendered as authored.
- Manual desktop tour QA — traversed all 22 acts, including Mars, Fenris, Kallides, the combined Pariah theatre, Raukos and Baal; full-route and restart states verified.
- Manual cartography QA — the desktop SVG exposes thirteen fleet-coloured route paths; Mars, Machorta-to-Pariah, Kallides-to-Pariah and Pariah-to-Raukos remain disconnected as authored, while all schematic and relative placement disclosures render on their cards.
- Browser console — no warnings or errors.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route after this single Indomitus commit lands in draft PR #265.
- Preserve the campaign-network grammar: repeated origins represent documented branches, while regional theatres and unknown transits remain visibly disclosed or disconnected.

## References

- https://www.blacklibrary.com/all-products/dawn-of-fire-avenging-son-ebook-2020.html
- https://www.blacklibrary.com/series/series-dawn-of-fire/the-gate-of-bones-ebook-2021.html
- https://www.blacklibrary.com/series/series-dawn-of-fire/ebook-sea-of-souls-eng-2023.html
- https://www.blacklibrary.com/all-products/mp3-dawn-of-fire-the-wolftime-eng-2021.html
- https://www.blacklibrary.com/warhammer-40000/featured/ebook-dawn-of-fire-the-silent-king-eng-2025.html
- https://wh40k.lexicanum.com/wiki/Indomitus_Crusade
- https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Tertius
- https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus
- https://wh40k.lexicanum.com/wiki/Fleet_Primus
- https://wh40k.lexicanum.com/wiki/Battle_of_Raukos
- https://wh40k.lexicanum.com/wiki/Attilan_Gate
- https://wh40k.lexicanum.com/wiki/Pariah_Crusade
