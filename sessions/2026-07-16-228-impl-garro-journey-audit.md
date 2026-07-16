---
session: 2026-07-16-228
role: implementer
date: 2026-07-16
status: complete
slug: garro-journey-audit
parent: 2026-07-15-219
links:
  - sessions/2026-07-15-219-impl-great-crusade-journey-audit.md
  - sessions/2026-07-15-226-impl-horus-journey-audit.md
  - sessions/2026-07-16-227-impl-guilliman-journey-audit.md
commits: []
---

# Garro journey audit — Knight of Grey

## Summary

`Garro · Knight of Grey` now tells a sourced 18-act biography from the refusal at Istvaan III to Garro's martyrdom at Marmax Bastion. Luna replaces Terra for his appointment as Agentia Primus, three missing turns have been restored, and every moon, orbital plate, mobile fortress, system edge or Warp interval is visibly marked as relative or schematic cartography.

## What I did

- `src/lib/map/voyages/data/garro.ts` — expanded and re-sourced the journey from 15 to 18 acts without adding framework or component code.
- Added `Burden of Duty` aboard the Phalanx, split `Shield of Lies` into its distinct Riga and Titan turns, and added Garro's release from Malcador in `Masterless` before the Siege.
- Moved Garro's appointment as Agentia Primus from Terra to the Somnus Citadel on Luna and separated it from the `Lord of Flies` aftermath.
- Corrected the Eisenstein flight sequence, the rescue and warning, the timing around Calth and later recruitment missions, and the end-state chronology from the White Mountain through Saturnine to Marmax Bastion.
- Reworked headings and copy so each act has a distinct decision, recruitment, discovery or sacrifice rather than functioning as a generic location caption.
- Replaced unsupported exact map identities with disclosed relative or schematic points for the Istvaan system edge, the Empyrean, Daggerline, the Phalanx, Io, Optera IV, Riga, Titan and Hesperides.
- Added three narrative sections — `THE FLIGHT · THE SEVENTY`, `AGENTIA PRIMUS · THE GREY`, and `MASTERLESS · THE SIEGE` — and renamed the route label to `GARRO · KNIGHT-ERRANT`.
- Replaced weak or generic citations with Black Library story pages where available and retained Lexicanum for cross-checking, campaign chronology and concise dossiers.

## Decisions I made

- **Kept all 15 inherited story turns.** None proved invented or outside Garro's biographical focus; the defects were chronology, conflation, sourcing, prose or cartographic certainty.
- **Added three acts instead of compressing them into neighbouring cards.** `Burden of Duty`, Titan's resolution to `Shield of Lies`, and `Masterless` each change Garro's relationship to Malcador and are necessary for the grey-knight arc to reach the Siege coherently.
- **Placed Agentia Primus on Luna.** The appointment belongs to the Somnus Citadel sequence, not Terra; keeping the two consecutive Luna acts preserves the source's narrative order.
- **Kept the Phalanx as a relative Sol anchorage.** It is a mobile star fortress, so the catalog pin cannot establish its Heresy-era position.
- **Converted Optera IV from an exact world identity to a disclosed Pale Stars regional point.** The campaign fixes the planet and region but supplies no canonical galactic coordinate.
- **Split Riga and Titan spatially and narratively.** Riga establishes the missing ships and Tallery's investigation; Titan reveals Othrys and resolves Malcador's order.
- **Did not add Nolec Trimus as a station.** The mission belongs to Garro's chronology, but it is weaker than the retained turns and lacks a safe chart position; the broken incoming leg to Hesperides states the omission rather than drawing a false route.
- **Used broad or qualified dates where the stories provide sequence rather than exact dating.** The journey preserves the published `017008.M31` notation at Optera IV while presenting `008.M31` as the readable date.
- **Reused existing journey sections, `breakBefore`, relative placements and disclosure copy.** No new map or journey framework was introduced.

## Verification

- `git diff --check` — pass.
- `npm run test:voyages` — pass, 2,544 checks across 12 journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, all 40 DB-free suites; the live Supabase recommendation suite remains skipped by the standard harness.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after permitting the configured Google Font downloads; the existing Turbopack NFT tracing warning remains.
- Manual in-app browser QA at `/map` — desktop 1280 × 720 and mobile 390 × 844.
- Manual tour QA — all 18 acts, section transitions, previous/next controls, the final full-route action and restart state verified on desktop and mobile.
- Manual responsive QA — every tour card remained wholly inside both viewports with no horizontal, vertical or internal text overflow; the mobile cards measured 366 px wide.
- Manual cartography QA — all placement disclosures rendered; three intentional discontinuities produced 14 route legs, including the disclosed omission before Hesperides.
- Browser console — no warnings or errors.

## Open issues / blockers

None.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route.

## References

- https://www.blacklibrary.com/authors/james-swallow/flight-of-the-eisenstein-ebook.html
- https://www.blacklibrary.com/popular-characters/popular-garro/hh-garro-weapon-of-fate-ebook.html
- https://www.blacklibrary.com/authors/james-swallow/Garro-oath-of-moment-mp3.html
- https://www.blacklibrary.com/authors/james-swallow/garro-sword-of-truth-mp3.html
- https://www.blacklibrary.com/popular-characters/popular-garro/burden-of-duty-mp3.html
- https://www.blacklibrary.com/authors/james-swallow/garro-ashes-of-fealty-mp3.html
- https://www.blacklibrary.com/authors/james-swallow/garro-shield-of-lies-mp3.html
- https://www.blacklibrary.com/the-horus-heresy/HH-Novel-Series/garro-vow-of-faith-ebook.html
- https://www.blacklibrary.com/series/the-horus-heresy/horus-heresy-the-buried-dagger-ebook-cs-2018.html
- https://www.blacklibrary.com/popular-characters/popular-garro/ebook-garro-knight-of-grey-eng-2023.html
- https://wh40k.lexicanum.com/wiki/Nathaniel_Garro
- https://wh40k.lexicanum.com/wiki/Purging_of_the_Invocastus_Sector
- https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies
- https://wh40k.lexicanum.com/wiki/Saturnine_(Novel)
