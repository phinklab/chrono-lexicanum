---
session: 2026-07-15-227
role: implementer
date: 2026-07-15
status: complete
slug: horus-journey-audit
parent: 2026-07-15-220
links:
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
commits: []
---

# Horus journey audit — Rise and Ruin

## Summary

`Horus · Rise and Ruin` now tells a sourced 21-act biography from Cthonia to Terra instead of beginning at Ullanor. Five Great-Crusade acts and the Manachean Dark Compliance were added, every inherited act was revisited, and uncertain cartography is now disclosed or disconnected rather than presented as an exact continuous route.

## What I did

- `src/lib/map/voyages/data/horus.ts` — expanded the journey from 15 to 21 acts and its era from M31 to M30–M31.
- Reused the existing journey sections for `RISE · THE FAVOURED SON`, `FALL · THE WARMASTER` and `RUIN · THE ARCH-TRAITOR`; no new framework or component code was added.
- Added Cthonia, the disputed first Terra reunion, the first Molech and Davin campaigns, Gorro and Manachea.
- Corrected Murder's campaign sequence, Xenobia Principis, the Auretian STC fragments, Isstvan III's casualty wording, Dwell, Molech, Trisolian, Beta-Garmon III, the Luna date and the final Terra account.
- Replaced the wrong Beta-Garmon IV and Trisolian catalog identities with sourced relative chart points; disclosed Cthonia, Davin, Molech, Manachea and both Ullanor visits as schematic identity anchors.
- Removed two dead custom legs that were already ignored by `breakBefore`; retained only the authored Isstvan III → V system leg.

## Decisions I made

- **Made the journey self-contained despite Great Crusade overlap.** The title promises Horus's rise, so the route now begins with his official rediscovery instead of requiring another journey for its first act.
- **Kept the disputed Terra reunion but marked it in the date line and copy.** It provides the strongest Terra-to-Terra narrative frame without presenting Horus's account as settled fact.
- **Used repeated worlds as mirrors.** Davin, Molech, Ullanor and Terra each carry a rise-era and fall/ruin-era act with distinct narrative purpose.
- **Kept Reillis inside the Gorro account.** Its location and date are not chartable enough for an independent point.
- **Did not add remote strategic manipulations.** Prospero, Signus, Calth and Chondax are not physical Horus itinerary acts and remain owned by the Great Crusade/Warmaster network.
- **Disconnected unsupported transitions.** Unknown regions remain chronological tour steps without a line that would invent spatial continuity.
- **Offset Beta-Garmon III from the existing IV catalog pin after visual QA.** The disclosed point still represents only the system relationship, but the two worlds now remain visually distinct.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass, all 40 DB-free suites; `test-voyages` included 2,488 checks across 12 journeys before the final coordinate-only adjustment and passed again in the full suite.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after permitting the configured Google Font downloads; the existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map` — desktop 1280 × 720 and mobile 390 × 844.
- Manual tour QA — all 21 acts, all three section transitions, final-act controls and full-route mode verified on desktop and mobile.
- Manual responsive QA — overture, placement-heavy Cthonia and Beta-Garmon cards, and the Terra finale fit the 390 × 844 viewport with a 366 px card and no horizontal or internal text overflow.
- Manual cartography QA — Ullanor disclosures render at both visits; Isstvan III → V remains connected; Trisolian and Beta-Garmon III are visibly separate relative points; no browser warnings or errors remained.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route.

## References

- https://www.warhammer-community.com/en-gb/articles/71MXsCP4/legions-of-the-horus-heresy-the-sons-of-horus-are-the-real-first-legion/
- https://www.warhammer-community.com/en-gb/articles/SOKSqkHC/the-horus-heresy-how-the-great-triumph-led-to-greater-tragedy/
- https://www.warhammer-community.com/en-gb/articles/OtgmU492/the-horus-heresy-how-davin-put-the-warmaster-on-the-path-to-heresy/
- https://www.warhammer-community.com/en-gb/articles/5b3wkzet/the-horus-heresy-the-tragic-tale-of-the-dropsite-massacre/
- https://www.warhammer-community.com/en-gb/articles/c1n0bymf/pages-from-the-black-books-the-hour-of-the-warmaster/
- https://assets.warhammer-community.com/horusheresy_exemplarybattles_thebattleoftrisolian_vengefulspirit_eng_24.09-frcwsgxbix.pdf
- https://www.warhammer-community.com/en-gb/articles/4u3q9eWF/the-end-and-the-death-volume-i-is-nearly-here-catch-up-on-the-siege-of-terra-so-far/
- https://www.blacklibrary.com/the-horus-heresy/featured/ebook-the-end-and-the-death-volume-iii-eng-2024.html
- https://wh40k.lexicanum.com/wiki/Horus
