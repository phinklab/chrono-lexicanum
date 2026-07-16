---
session: 2026-07-16-227
role: implementer
date: 2026-07-16
status: complete
slug: guilliman-journey-audit
parent: 2026-07-15-219
links:
  - sessions/2026-07-15-219-impl-great-crusade-journey-audit.md
  - sessions/2026-07-15-226-impl-horus-journey-audit.md
commits: []
---

# Guilliman journey audit — Lord of Ultramar

## Summary

`Guilliman · Lord of Ultramar` now tells a sourced 24-act biography from Konor's Macragge to Baal instead of conflating the Fenris visit with the Pit of Raukos. Thoas, Raukos and the Attilan Gate were added, every inherited act was revisited, and disputed chronology or uncertain cartography is now stated in the journey rather than presented as exact fact.

## What I did

- `src/lib/map/voyages/data/guilliman.ts` — expanded the journey from 21 to 24 acts without adding framework or component code.
- Added Thoas as a Great-Crusade character act, the Pit of Raukos as the end of Indomitus's first phase, and the Attilan Gate as the transition into Imperium Nihilus.
- Moved the five hundred survivors of Russ's line from the Fenris visit to Raukos, where the Unnumbered Sons were dispersed and the Wolfspear formed.
- Corrected or qualified the dates for Macragge's rediscovery, Imperium Secundus, the Ruinstorm road, the revised Indomitus/Plague Wars chronology and the post-Plague-Wars crossing to Baal.
- Reworked titles and copy for Sotha, Pyrrhan, Davin, Terra, Thessala, the resurrection, Fenris, Iax and Baal so each act has a distinct biographical turn.
- Replaced weak secondary links with official Warhammer Community, Black Library and Horus Heresy sources where available; retained Lexicanum for cross-checking and for concise location dossiers.
- Added visible schematic or relative-placement disclosures for Ullanor, Thoas, Anuari, Pyrrhan, Davin, Thessala, the Maelstrom, Raukos and the Attilan Gate; disconnected unsupported transitions with existing `breakBefore` behaviour.

## Decisions I made

- **Kept all 21 inherited core events.** None proved invented or outside Guilliman's personal itinerary; the defects were attribution, chronology, prose, sourcing or cartographic certainty.
- **Kept Macragge's childhood and rediscovery in one opening act.** Splitting them would add density without a meaningful spatial transition; the revised date line and prose preserve both turns clearly.
- **Added Thoas despite its unknown location.** It is one of the strongest sourced Great-Crusade character episodes, but it is isolated as a schematic chronology point so the route does not claim a physical course.
- **Separated Fenris from Raukos.** Fenris retains Guilliman's meeting with the Space Wolves; the five hundred survivors and the Wolfspear now belong to the later Raukos act.
- **Added the Attilan Gate before Baal.** The gate makes the transition from Imperium Sanctus into Nihilus spatially and narratively legible without pretending that its offset is a canonical coordinate.
- **Reused existing chart identities and journey placement patterns.** Raukos and the Attilan Gate follow the Indomitus route's relative anchors; Ullanor uses the disclosed Armageddon identity; no new placement framework was introduced.
- **Did not add Eskrador or remote strategic theatres.** Guilliman's personal presence at Eskrador is too uncertain, while actions he only commanded from afar do not belong in this biographical itinerary.
- **Used broad or qualified dates where the publication chronology is unstable.** Imperium Secundus is explicitly disputed and the Dark Imperium sequence uses revised-chronology wording rather than false precision.

## Verification

- `git diff --check` — pass.
- `npm run test:voyages` — pass, 2,520 checks across 12 journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, all 40 DB-free suites.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after permitting the configured Google Font downloads; the existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map` — desktop 1280 × 720 and mobile 390 × 844.
- Manual tour QA — all 24 acts, previous/next controls, the final full-route action and restart state verified on desktop and mobile.
- Manual responsive QA — every tour card remained wholly inside both viewports with no horizontal, vertical or internal text overflow; the mobile cards measured 366 px wide.
- Manual cartography QA — Thoas, Pyrrhan, Raukos and Attilan Gate disclosures render in their long-form cards; the discontinuous legs and relative offsets remain visually legible.
- Browser console — no warnings or errors.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route.

## References

- https://assets.warhammer-community.com/eng_25-06_warhammer_the_horus_heresy_black_book_extract_the_ultramarines-yg3hegvy9l-n7b03kqqmb.pdf
- https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf
- https://assets.warhammer-community.com/eng_21-05_thehorusheresy_black_book_extract_wars_of_retribution-ipomkciqqc-abdtmwmheo.pdf
- https://www.blacklibrary.com/the-horus-heresy/hh-prim/roboute-guilliman-ebook.html
- https://www.blacklibrary.com/popular-characters/popular-roboute-guiliman/know-no-fear-ebook.html
- https://www.blacklibrary.com/all-products/betrayer-ebook.html
- https://www.blacklibrary.com/all-products/pharos-ebook.html
- https://www.blacklibrary.com/popular-characters/popular-roboute-guiliman/ruinstorm-ebook.html
- https://www.warhammer-community.com/en-gb/articles/1BHx3iuB/5-times-the-imperium-would-have-been-doomed-without-roboute-guilliman/
- https://www.blacklibrary.com/warhammer-40000/novels/dark-imperium-godblight-ebook-2021.html
- https://www.blacklibrary.com/warhammer-40000/novels/ebook-belisarius-cawl-archmagos-eng-2025.html
- https://www.warhammer-community.com/en-gb/articles/dGrgtwDO/the-legendary-commander-dante-crosses-the-rubicon-primaris/
- https://wh40k.lexicanum.com/wiki/Roboute_Guilliman
- https://wh40k.lexicanum.com/wiki/Pit_of_Raukos
- https://wh40k.lexicanum.com/wiki/Attilan_Gate
