---
session: 2026-07-13-214
role: implementer
date: 2026-07-13
status: complete
slug: great-journeys-research-pass
parent: none (direct maintainer session, no architect brief)
links:
  - sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
  - sessions/2026-07-13-213-impl-map-mobile-rendering.md
commits:
  - 3bbe63e
---

# Great Journeys research and route expansion

## Summary

The Cartographer roster now carries six journeys and 102 acts: Farsight and Jaghatai Khan are removed, while Great Crusade, Horus, Guilliman and Garro gain 18 researched acts between them. All four expanded routes were completed end to end in the live Cartographer and visually checked in full-route mode; five researched candidates are recorded below for a later selection session rather than silently added now.

## What I did

- `src/lib/map/voyages/data/great-crusade.ts` — grew from 23 to 28 acts with Luna's corrected prologue date, Mars, Sedna, Molech, Gorro and Nikaea; moved the launch beat into chronological order and removed Gorro's story from the Cthonia card.
- `src/lib/map/voyages/data/horus.ts` — grew from 10 to 15 acts with Sixty-Three Nineteen, Murder, Aureus, Dwell and Trisolian.
- `src/lib/map/voyages/data/guilliman.ts` — grew from 15 to 21 acts with Anuari, Pyrrhan, Davin, the Maelstrom, Fenris and post-Plague-Wars Baal.
- `src/lib/map/voyages/data/garro.ts` — grew from 13 to 15 acts with Ashes of Fealty in Sol and the Optera IV conclave.
- `src/lib/map/voyages/index.ts` — removed Farsight and Jaghatai Khan from the six-entry roster.
- `src/lib/map/voyages/data/farsight.ts` / `src/lib/map/voyages/data/khan.ts` — removed the retired journey definitions.

## Decisions I made

- **Read “bad journeys” as Farsight and Jaghatai Khan only.** The maintainer named those two as the weak removals and described Eisenhorn and Indomitus as middling, so both middling journeys remain available pending a separate call.
- **Kept every new act tied to personal presence or the fleet actually being followed.** Armatura, Caliban for Garro, Vigilus for Guilliman, Yarant for Horus and similar command-from-afar candidates were rejected.
- **Used waypoints and declared proxies instead of invented coordinates.** Sedna, Gorro, Sixty-Three Nineteen, Murder, Aureus, Dwell and Pyrrhan have no chart pin. Anuari is explicitly a system/orbital anchor, the Maelstrom is a region pin, and Garro's Io action uses Terra as a documented Sol-system stand-in.
- **Rebuilt the Great Crusade opening as Luna 703 → Mars 739 → Terra 798.** The dedicated First Pacification source dates Luna to c. 703.M30; the old card's c. 798.M30 conflated the first battle with the formal extrasolar launch.
- **Placed Gorro late M30 without an exact year.** Lexicanum calls it early, while Black Library describes it after nearly two centuries of war. The official story description won the ordering call, and the card does not pretend the disputed date is settled.
- **Ended Great Crusade at Nikaea.** Ullanor remains the triumphal apex; Nikaea makes the route's closing beat the first great fracture rather than another victory.
- **Did not add Eskrador to Guilliman.** Its only detailed account is explicitly challenged by both the Inquisition and Ultramarines. Fenris and Baal were stronger, personally attested additions.
- **Did not force Nolec into Garro.** It has no known map position and falls between two Terra-anchored acts; a waypoint on a zero-length Terra → Terra leg is invalid and would create false cartography.
- **Did not implement any of the five candidate journeys.** The request asked for proposals; each is large enough to deserve its own scope and copy pass.

## Five researched journey candidates

### 1. Ibram Gaunt · The First and Only

The immediately buildable choice: all 18 acts already have chart pins, and the novels provide a clean emotional spine from Tanith's loss through Gereon to Gaunt's elevation.

`Formal Prime → Balhaut → Tanith → Fortis Binary → Menazoid Epsilon → Voltemand → Monthax → Verghast → Hagia → Phantine → Aexe Cardinal → Herodor → Gereon → Ancreon Sextus → Gereon → Jago → Salvation's Reach → Urdesh`

- Map readiness: 18/18 acts, 17 unique IDs.
- Strength: highest station density and strongest book-by-book structure.
- Risk: a deep zig-zag inside the Sabbat Worlds rather than a galaxy-wide crossing.
- Sources: [series chronology](https://wh40k.lexicanum.com/wiki/Gaunt%27s_Ghosts_%28Novel_Series%29), [Tanith First and Only](https://wh40k.lexicanum.com/wiki/Gaunts_Ghosts), [Ibram Gaunt](https://wh40k.lexicanum.com/wiki/Ibram_Gaunt).

### 2. Lion El'Jonson · Son of the Forest

The strongest galaxy-spanning character arc: Caliban's hunter crosses the Rangdan wars, Thramas, Imperium Secundus and the Ruinstorm, returns to a dying Caliban, then wakes in Nihilus for the duel with Angron.

`Caliban → Gramarye → Ghoul Stars / Rangdan → Diamat → Thramas Sector → Tsagualsa → Perditus Ultima → Sheol IX → Macragge → Davin → Chemos → Barbarus → Terra → Caliban → The Rock → Camarth → Sable → Wyrmwood`

- Map readiness: 14/18 acts, 13 unique direct IDs; Ghoul Stars is a regional proxy.
- Strength: widest spatial sweep, several distinct life phases and a powerful Caliban → galaxy → Caliban → mirror-Caliban shape.
- Risk: Diamat, Sheol IX, Camarth and Wyrmwood need pins or waypoints; `gramarye` versus `gramarye-2` needs curation.
- Sources: [Lion El'Jonson](https://wh40k.lexicanum.com/wiki/Lion_El%27Jonson), [Thramas Crusade](https://wh40k.lexicanum.com/wiki/Thramas_Crusade), [Avalus](https://wh40k.lexicanum.com/wiki/Avalus).

### 3. Abaddon · The Long War

A Chaos counter-history across ten millennia: the birth of the Black Legion, thirteen Black Crusades, Cadia as a recurring wound and the post-Rift war for Vigilus.

`Eye of Terror → Maeleum → Harmony → Cadia → Uralan → Belis Corona → Gerstahl → El'Phanor → Elysia → Drecarth's Folly → Mackan → The Skullgather → Cancephalus → Medusa → Relorria → Gothic Sector → Cadia → Vigilus`

- Map readiness: 11/18 acts, 10 unique direct IDs.
- Strength: the largest time span and clearest non-Imperial answer to the existing roster.
- Risk: the sixth and eighth Black Crusades have no securely named single world; several episodes have codex-scale rather than novel-scale copy sources.
- Sources: [Ezekyle Abaddon](https://wh40k.lexicanum.com/wiki/The_Despoiler), [Black Crusade chronology](https://wh40k.lexicanum.com/wiki/Black_Crusade), [Harmony](https://wh40k.lexicanum.com/wiki/Harmony), [Maeleum](https://wh40k.lexicanum.com/wiki/Maeleum).

### 4. Yvraine · The Seventh Path

The most visually distinct option: a wanderer becomes Ynnead's prophet and moves through Commorragh, craftworlds, Ultramar, the Black Library and Nurgle's realm in search of the Croneswords.

`Biel-Tan → Gnosis Prime → Commorragh → Biel-Tan → Ursulia → Ulthwé → Belial IV → Iyanden → Psychedelta → Klaisus → Macragge → The Black Library → Garden of Nurgle → Einerash → Zaisuthra → Agarimethea → Iathglas`

- Map readiness: 7/17 direct IDs, 8 with an Eye-of-Terror regional proxy.
- Strength: Aeldari and Webway geography unlike every current journey; a transformation arc rather than another military campaign.
- Risk: largest pin-import requirement; five different Commorragh catalog entries need an explicit choice, and the last Cronesword remains deliberately unresolved.
- Sources: [Yvraine](https://wh40k.lexicanum.com/wiki/Yvraine), [Ynnari](https://wh40k.lexicanum.com/wiki/Ynnari), [Fracture of Biel-Tan](https://wh40k.lexicanum.com/wiki/Gathering_Storm%3A_The_Fracture_of_Biel_Tan).

### 5. Ghazghkull · Da Great Waaagh!

The strongest literal galaxy zig-zag: an injured boy on Urk becomes the Prophet of Gork and Mork through Armageddon, Yarrick, Piscina, Octarius and Ragnar.

`Urk → Space Hulk Wurld Killa → Armageddon → Golgotha → Buca III → Chigon 17 → Piscina IV → Armageddon → Haunted Gulf → Octarius → Krongar → Icaria → Armageddon`

- Map readiness: 7/13 acts through repeats, 5 unique direct IDs.
- Strength: Ork viewpoint, black humour and Armageddon as a three-part refrain.
- Risk: Urk must be added as a real first-station pin; later contradictory sightings should not be flattened into a false linear route.
- Sources: [Ghazghkull](https://wh40k.lexicanum.com/wiki/Ghazghkull), [Battle of Haunted Gulf](https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf), [Great Waaagh!](https://wh40k.lexicanum.com/wiki/Great_Waaagh%21), [Prophet of the Waaagh!](https://wh40k.lexicanum.com/wiki/Ghazghkull_Thraka%3A_Prophet_of_the_Waaagh%21_%28Novel%29).

Recommended implementation order: **Gaunt first** for a zero-import, book-rich route; **Lion second** for the best galaxy-spanning spectacle; **Abaddon third** for the strongest roster contrast. Yvraine and Ghazghkull are equally valuable thematic additions after a deliberate map-pin pass.

## Verification

- `npm run test:voyages` — pass, 512 checks across six journeys.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass, 40 DB-free suites.
- Manual desktop Cartographer — Great Crusade, Horus, Guilliman and Garro each completed from first act to final act and switched into full-route view; all routes fit and rendered without browser console warnings or errors.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings and 20 pre-existing warnings.
- `git diff --check` — pass.

## Open issues / blockers

None for the requested roster and route pass.

The coordination-only rollup still describes the prior eight-journey / 101-act state. This logical Product session intentionally did not edit `brain/**` or `sessions/README.md`; Cowork can roll the new six-journey / 102-act state up after merge.

## For next session

- Choose the first new journey. Gaunt is the implementation recommendation; Lion is the recommendation if galaxy-wide spectacle outranks immediate map readiness.
- Decide whether the middling Eisenhorn and Indomitus journeys stay, receive their own expansion pass, or leave in a later roster cut.
- If Yvraine or Ghazghkull wins, scope missing world-pin curation before writing route copy.

## References

- Great Crusade: [First Pacification of Luna](https://wh40k.lexicanum.com/wiki/First_Pacification_of_Luna), [Treaty of Olympus](https://wh40k.lexicanum.com/wiki/Treaty_of_Olympus), [Sedna Campaign](https://wh40k.lexicanum.com/wiki/Sedna_Campaign), [Battle of Gorro](https://wh40k.lexicanum.com/wiki/Battle_of_Gorro), [Molech](https://wh40k.lexicanum.com/wiki/Molech), [Council of Nikaea](https://wh40k.lexicanum.com/wiki/Council_of_Nikaea).
- Horus: [Battle of 63-19](https://wh40k.lexicanum.com/wiki/Battle_of_63-19), [Murder](https://wh40k.lexicanum.com/wiki/Murder), [Auretian Technocracy War](https://wh40k.lexicanum.com/wiki/Auretian_Technocracy_War), [Battle of Dwell](https://wh40k.lexicanum.com/wiki/Battle_of_Dwell), [Battle of Trisolian](https://wh40k.lexicanum.com/wiki/Battle_of_Trisolian).
- Guilliman: [Battle of Anuari](https://wh40k.lexicanum.com/wiki/Battle_of_Anuari), [Harrowing of Pyrrhan](https://wh40k.lexicanum.com/wiki/Harrowing_of_Pyrrhan), [Second Battle of Davin](https://wh40k.lexicanum.com/wiki/Second_Battle_of_Davin), [Terran Crusade](https://wh40k.lexicanum.com/wiki/Terran_Crusade), [Wolfspear](https://wh40k.lexicanum.com/wiki/Wolfspear), [Devastation of Baal](https://wh40k.lexicanum.com/wiki/Devastation_of_Baal).
- Garro: [Nathaniel Garro](https://warhammer40k.fandom.com/wiki/Nathaniel_Garro), [Purging of the Invocastus Sector](https://wh40k.lexicanum.com/wiki/Purging_of_the_Invocastus_Sector).
