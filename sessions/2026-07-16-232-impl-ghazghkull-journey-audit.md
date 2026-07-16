---
session: 2026-07-16-232
role: implementer
date: 2026-07-16
status: complete
slug: ghazghkull-journey-audit
parent: 2026-07-15-220
links:
  - sessions/2026-07-13-215-impl-great-journeys-five-route-expansion.md
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
  - sessions/2026-07-16-231-impl-eisenhorn-journey-audit.md
commits: []
---

# Ghazghkull journey audit — Da Great Waaagh!

## Summary

`Ghazghkull · Da Great Waaagh!` now tells a sourced 14-act personal chronicle from the fall of *Wurld Killa* on Armageddon to the ongoing Era Indomitus siege. The audit adds the missing Galactic Green Wave, removes the false Krongar catalog coordinate, clarifies the Great Waaagh recruitment sequence and replaces every Fandom placement citation with official or Lexicanum provenance. Its complete route now carries an Ork-green identity, with compact dotted traces distinguishing chronology-preserving jumps from ordinary dashed courses.

## What I did

- `src/lib/map/voyages/data/ghazghkull.ts` — retained all 13 inherited canonical beats and split Octaria into the 836–851.999.M41 Mawloc campaign and the 852.999.M41 Galactic Green Wave, producing 14 acts.
- Clarified that Ghazghkull's Urk origin predates the first 941.M41 Armageddon station rather than assigning Urk an invented coordinate.
- Renamed the Golgotha, Haunted Gulf, Urgok and Icaria acts for clearer event-first headings.
- Added a visible schematic disclosure to the catalog Golgotha pin because sources disagree between Ultima Segmentum and the Armageddon Sector of Segmentum Solar.
- Recast `Urgok's Realm` as the attested space-hulk fortress `Da Ironfoot`; kept Fang's World and Kongajaro relative and the Black Kraken Nebula schematic while removing claims about a precise western T'au border.
- Replaced all four Fandom placement links in that cluster with the Lexicanum page grounded in *Waaagh! Ghazghkull: A Codex: Orks Supplement*.
- Replaced `world: "krongar"`, whose catalog record sits incorrectly in Segmentum Obscurus, with a schematic point in the broad Ultima/Imperium Nihilus region established for the Skarskell Subsector.
- Updated Icaria to the official 2026 Mega-Tellyshokka account and changed the final Armageddon date to `Era Indomitus · ongoing` with an ongoing-siege ending.
- Extended the existing leg override and resolved-renderer arrays with one explicit `jump` effect. Desktop SVG renders those legs as compact moving dots; both Canvas renderers use the same dotted distinction while retaining their bounded draw-in and static idle state.
- Colored all 13 Ghazghkull transitions `#79b84a`; nine ordinary courses keep the established curved longer-dash language and four formerly disconnected chronology jumps use direct, straight dotted traces.
- `scripts/test-voyages.ts` — added regression coverage for the 14-act count, Da Ironfoot cluster, Golgotha disclosure, two-act Octaria chronology, Galactic Green Wave, schematic Krongar, official-or-Lexicanum placement sources, ongoing Armageddon finale, fully connected route, green palette and four jump effects.

## Decisions I made

- **Kept every inherited event.** All 13 were canonically supported; the audit found inaccurate or overconfident cartography, not an invented story beat.
- **Kept Urk unpinned.** Its Zornian System / Segmentum Solar context does not establish a defensible chart coordinate, so the first Armageddon card remains the visible start and now explicitly separates the earlier origin from 941.M41.
- **Kept the Piscina catalog station.** The local `piscina` map id is explicitly linked to archive location `piscina_iv`, and current sources support its broad Segmentum Obscurus / Abiaus Sector region. The catalog's abbreviated name and `Industrial World` classification are data-quality concerns outside this Product journey edit.
- **Kept the current Golgotha order and broad date.** Black Library places the Yarrick pursuit after the Second War for Armageddon, while older codex-derived summaries reverse its relation to Piscina; `after 941.M41` avoids claiming a false exact year.
- **Made Da Ironfoot a space-hulk point.** Urgok's command audience is aboard that fortress rather than on a planet called Urgok's Realm; the same schematic coordinate remains only as an openly editorial regional marker.
- **Split Octaria rather than lengthening one card.** Zog Steeltooth's submission in 851 and the Galactic Green Wave in 852 are distinct, title-defining turns at the same exact catalog world; the existing repeat-world pattern expresses that without new UI code.
- **Kept Octaria to Krongar explicitly non-cartographic.** Current campaign sources place Krongar in Ultima Segmentum, contradicting the catalog's Obscurus pin, but do not provide a coordinate or attested course from Octaria. The dotted jump trace preserves chronology without using the normal longer-dash course language.
- **Did not add Buca III, Chigon 17, conflicting simultaneous sightings or Gabal.** The first two lack strong personal-presence evidence, the sightings cannot form a linear biography, and the official Gabal synopsis does not yet fix the event relative to Krongar, Icaria and the current Armageddon war.
- **Did not create a Death Mire station.** The 2026 campaign is the current state of Ghazghkull's siege, not a sourced personal movement by Ghazghkull to that hive.
- **Kept the framework addition narrow.** Catalog stations, chart points, placement disclosures and repeat worlds still supply the journey. A single optional `LegOverride.effect: "jump"` value is carried through the existing aligned leg arrays and shared SVG/Canvas renderers.

## Verification

- `git diff --check` — pass.
- `npm run test:voyages` — pass, 2,670 checks across 12 journeys.
- `npm test` — pass, all 40 DB-free suites; one live-Supabase suite auto-skipped as designed.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings and 21 unchanged repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass after allowing the production build to fetch the four existing Google Fonts; 1,293 static pages generated. The existing Turbopack NFT trace warning remains unchanged.
- Manual in-app browser QA at `http://localhost:3100/map` — desktop 1440 × 1000 and mobile 390 × 844.
- Manual tour QA — all 14 acts traversed on desktop and mobile; start, previous/next progression, the two Octaria acts, final full-route action and restart state verified.
- Manual placement QA — Golgotha, Haunted Gulf, Da Ironfoot, Fang's World, Kongajaro, Black Kraken Nebula, Krongar and Icaria all render their inferred/schematic disclosure.
- Manual route-effect QA — desktop exposes nine green curved longer-dash courses and four direct green dotted jump paths; Haunted Gulf to Da Ironfoot draws in at station 6. Mobile full-route Canvas shows the same connected green route and dotted/dashed distinction.
- Manual responsive QA — every card stayed within the 390-pixel document width; placement-heavy cards reached at most 389 px height and retained visible navigation controls inside the 844-pixel viewport.
- Browser console — no warnings or errors on desktop or mobile.

## Open issues / blockers

None for the Ghazghkull journey.

## For next session

- Continue the Great Journeys audit with the next maintainer-selected route after this single Ghazghkull commit lands in draft PR #265.
- Correct the global `krongar` map catalog record in the Batch/Data strand: it still says Segmentum Obscurus / Hive World instead of Ultima Segmentum / Ork World (former Hive World).
- Review the global `piscina` display metadata in the Batch/Data strand: the linked archive identity is Piscina IV, while the map name and classification are abbreviated or broader than the current Mining World source.
- Revisit Gabal only when the full *Warlord of Warlords* chronology can place it without inventing an order or coordinate.

## References

- https://www.blacklibrary.com/warhammer-40000/novels/ghazghkull-thraka-prophet-of-the-waaagh-ebook-eng-2022.html
- https://www.blacklibrary.com/series/Astra-Militarum/chains-of-golgotha-ebook.html
- https://www.blacklibrary.com/audio/warhammer-40000-audiobooks/accept-no-failure-mp3.html
- https://www.warhammer-community.com/en-gb/articles/z9key2tp/lore-where-has-commissar-yarrick-been-lately/
- https://www.warhammer-community.com/en-gb/articles/0gmcnp9x/lore-of-armageddon-part-3-ghazghkulls-grand-plan/
- https://www.warhammer-community.com/en-gb/articles/hfd3qxcr/warhammer-40000-lore-what-is-operation-imperator/
- https://www.warhammer-community.com/en-gb/articles/qbmycfzj/the-siege-of-death-mire-ends-who-won/
- https://www.warhammer-community.com/en-gb/articles/f6qxkgi6/coming-soon-to-black-library-ghazghkull-chem-dogs-and-illustrated-necrons/
- https://wh40k.lexicanum.com/wiki/Ghazghkull
- https://wh40k.lexicanum.com/wiki/Wurld_Killa
- https://wh40k.lexicanum.com/wiki/Golgotha
- https://wh40k.lexicanum.com/wiki/Battle_of_Piscina_IV
- https://wh40k.lexicanum.com/wiki/Piscina_IV
- https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf
- https://wh40k.lexicanum.com/wiki/Great_Waaagh%21
- https://wh40k.lexicanum.com/wiki/Octaria
- https://wh40k.lexicanum.com/wiki/Krongar
- https://wh40k.lexicanum.com/wiki/Battle_of_Krongar
- https://wh40k.lexicanum.com/wiki/Icaria
