---
session: 2026-07-13-215
role: implementer
date: 2026-07-13
status: complete
slug: great-journeys-five-route-expansion
parent: none (direct maintainer continuation of 2026-07-13-214; no architect brief)
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/261
  - sessions/2026-07-13-214-impl-great-journeys-research-pass.md
commits:
  - 63b6316
---

# Great Journeys five-route expansion

## Summary

The Cartographer now carries all five researched journeys from Session 214: Ibram Gaunt, Lion El'Jonson, Abaddon, Yvraine and Ghazghkull add 93 acts to an eleven-journey roster. The implementation uses 63 catalog stations and 30 honest waypoints, introduces no invented coordinates or planet proxies, and keeps every one of the six existing journeys intact.

## What I did

- `src/lib/map/voyages/data/gaunt.ts` — added a 20-act, personally attested Sabbat Worlds route from Formal Prime to Urdesh.
- `src/lib/map/voyages/data/lion.ts` — added a 22-act character route from Caliban through the Heresy, the Forestwalk and Wyrmwood to Kronus.
- `src/lib/map/voyages/data/abaddon.ts` — added an 18-act fleet-scale Long War covering the Black Legion's birth, all thirteen Black Crusades and Vigilus.
- `src/lib/map/voyages/data/yvraine.ts` — added a 20-act personal route through Biel-Tan, Commorragh, the Webway, Ultramar and the Cronesword quest.
- `src/lib/map/voyages/data/ghazghkull.ts` — added a 13-act personal route whose visible path begins and ends on Armageddon without inventing a pin for Urk.
- `src/lib/map/voyages/index.ts` — registered the five definitions while preserving the previous six entries and their relative order.

## Final routes

### Ibram Gaunt · The First and Only — 20 acts

`Formal Prime → Balhaut → Tanith → [Blackshard] → Voltemand → Fortis Binary → Menazoid Epsilon → Monthax → Verghast → Hagia → Phantine → Aexe Cardinal → Herodor → Gereon → Ancreon Sextus → Gereon → Jago → Balhaut → Salvation's Reach → Urdesh`

- Direct catalog stations: 19 acts across 17 unique world IDs.
- Waypoint: Blackshard, on the Tanith → Voltemand leg.
- The two Balhaut acts are deliberate: Gaunt fights in the conquest in 765.M41, then returns for convalescence and the Blood Pact attack in 780.M41.
- Voltemand is before Fortis Binary and Menazoid Epsilon. The novels reveal early actions out of publication order, but the journey follows the in-universe sequence.

### Lion El'Jonson · Son of the Forest — 22 acts

`Caliban → Gramarye → [Taxal] → [Diamat] → Thramas Sector → Tsagualsa → Perditus Ultima → [Sheol IX] → Macragge → Davin → Chemos → Barbarus → Deliverance → Terra → Caliban → The Rock → [Mirror-Caliban] → [Camarth] → [Avalus] → Sable → [Wyrmwood] → Kronus`

- Direct catalog stations: 15 acts across 14 unique world IDs.
- Waypoints: Taxal, Diamat, Sheol IX, Mirror-Caliban, Camarth, Avalus and Wyrmwood.
- `gramarye` is the curated catalog record; the duplicate `gramarye-2` is not used.
- Kronus is a later real station, not a proxy for Wyrmwood. Its announced *Dawn of War IV* story supplies the only currently attested later catalog anchor that lets the route retain the Lion's Angron duel without ending on a waypoint.

### Abaddon · The Long War — 18 acts

`Eye of Terror / Eleusinian Veil → [Harmony] → Cadian Gate → Uralan → Belis Corona system → [Gerstahl] → El'Phanor → [Tarinth] → [Arkreath] → Mackan → [Rithcarn] → [Antecanis] → Medusa system → [Relorria] → Purgatory → Gothic Sector → Cadia → Vigilus`

- Direct catalog stations: 11 acts across ten unique IDs.
- Waypoints: Harmony, Gerstahl, Tarinth, Arkreath, Rithcarn, Antecanis and Relorria.
- This is explicitly a fleet-scale journey. Cards distinguish Abaddon's personal action, orbital/system presence and deeds attributable only to his Legion; Rithcarn never claims that he stood on the world.
- Eye of Terror, Cadian Gate, Belis Corona, Medusa and Gothic Sector are honest regional/system anchors. Their copy does not turn them into claimed surface visits.

### Yvraine · The Seventh Path — 20 acts

`Biel-Tan → [Gnosis Prime] → Commorragh → Ursulia → Biel-Tan → Ulthwé → [Belial IV] → Iyanden → [Psychedelta] → [Klaisus] → Macragge → The Black Library → [Garden of Nurgle] → [Einerash] → Ulthwé → Iyanden → [Zaisuthra] → [Agarimethea] → [Saim-Hann] → Zandros`

- Direct catalog stations: 11 acts across eight unique IDs.
- Waypoints: Gnosis Prime, Belial IV, Psychedelta, Klaisus, Garden of Nurgle, Einerash, Zaisuthra, Agarimethea and Saim-Hann.
- `remnants-of-biel-tan` is the same mobile craftworld before and after its fracture; headings carry the era-correct name. Its chart position is illustrative craftworld cartography, not a substitute planet.
- The stable canonical `commorragh` record is used instead of one of its duplicate gate symbols.
- The Ursulia/Biel-Tan accounts compress the battle differently. The route makes one conservative post-Ursulia return act for Asu-var, the Yncarne and the fracture rather than asserting an unsupported shuttle sequence.

### Ghazghkull · Da Great Waaagh! — 13 acts

`Armageddon → Golgotha → Piscina IV → Armageddon → [Haunted Gulf] → [Urgok's Realm] → [Fang's World] → [Kongajaro] → [Black Kraken Nebula] → Octaria / Octarius → Krongar → [Icaria] → Armageddon`

- Direct catalog stations: seven acts across five unique IDs.
- Waypoints: Haunted Gulf, Urgok's Realm, Fang's World, Kongajaro, Black Kraken Nebula and Icaria.
- The first Armageddon card carries Urk and *Wurld Killa* as the unpinned origin, then begins the visible route at the space hulk's attested fall. No arbitrary Solar world stands in for Urk.
- `octarius` is the exact central planet also named Octaria, not a nearby-world proxy.
- Golgotha is left broadly dated after 941.M41 because current and older codex-derived summaries disagree on its relation to Piscina.

## Proxies, anchors and waypoints

- **No planet proxy was introduced.** Every `world` value is either the named place itself, the exact same mobile craftworld/alternate planet name, or an explicitly described regional/system anchor.
- **All missing places are waypoints.** Each has a `via` strictly between zero and one, sits between two different catalog stations, and carries its own copy, date and source URL.
- **No waypoint begins or ends a route.** Iathglas and Urk were specifically rejected rather than violating that contract.
- **No coordinates were invented.** All path geometry remains generated from existing catalog pins; the only hand choices are the supported waypoint fractions and voyage-label positions.

## Decisions I made

- **Added Blackshard and the second Balhaut act to Gaunt.** Session 214's route omitted both and placed Voltemand too late. The corrected chronology gives the regiment's naming beat and restores the Blood Pact / Mabbon bridge into Salvation's Reach.
- **Replaced the Ghoul Stars Rangdan proxy with Taxal.** The sources do not equate the Rangdan front with the Ghoul Stars. Taxal remains an honest waypoint between Gramarye and Thramas.
- **Used Kronus as Lion's final anchor.** Wyrmwood has no pin and cannot be the final act. Lexicanum and the official *Dawn of War IV* material now attest the Lion's arrival on Kronus; the card stays broad because the game releases later in 2026 and its final detail could still evolve.
- **Told Abaddon at fleet scale.** This preserves all thirteen Black Crusades without pretending that the Warmaster was physically present in every surviving campaign summary. The route says “his Legion” where that is all the evidence supports.
- **Used the dedicated Black Crusade pages over ambiguous campaign labels.** “Drecarth's Folly” and “The Skullgather” are campaign names, so the route uses the attested places Arkreath and Rithcarn. The Ninth Crusade uses Antecanis rather than its diversion target Cancephalus.
- **Used 537.M38 for Antecanis and 142–160.M41 for the Gothic War.** Dedicated campaign pages support those dates; older summaries contain 573.M38 and 139.M41 variants.
- **Ended Yvraine on Zandros.** Iathglas is later and narratively important, but it has no pin and no later personally attested catalog station on which its waypoint could land. Moving Zandros after it would reverse the story.
- **Changed Yvraine's era tag to `ancient–M42`.** Her Biel-Tan life begins millennia before the late-M41 Ynnari transformation, so `M41–M42` would misstate the first act.
- **Started Ghazghkull visibly on Armageddon.** Urk and *Wurld Killa* lack honest map positions. The origin remains in the first card without inventing either coordinates or a proxy.
- **Removed Chigon 17 after the final source audit.** The sources support a Ghazghkull-led Waaagh and disagree on the 972/982/986.M41 sequence, but do not establish his personal presence strongly enough for this character route.

## Rejected candidates and stations

### Gaunt

- Sapiencia was omitted because the placement of its *Ghostmaker* flashback among Fortis Binary, Voltemand and Menazoid Epsilon is not stable enough online.
- Pyrites is an intrigue/rest stop rather than a strong journey turn.
- Caligula, Bucephalon, Ramillies, Typhon Eight and Nacedon are weaker personal beats or focus on other Ghosts.
- Manzipor, Ignatius Cardinal, Darendara and Gylatus Decimus predate the First-and-Only spine and mostly lack pins.

### Lion

- Ghoul Stars was rejected as an unsupported Rangdan proxy.
- Dulan falls inside a broadly dated Rangdan period whose exact Taxal ordering is uncertain; Karkasarn is weaker and unpinned.
- Sotha is personally attested but is a brief Pharos teleport inside the Macragge complex rather than a stronger independent act.
- Mirror-Caliban, Camarth, Avalus and Wyrmwood were not collapsed onto Caliban or The Rock.

### Abaddon

- Maeleum was removed because the Emperor's Children destroyed it while Abaddon was absent.
- The `elysia` planet pin was rejected for Tarinth, which lies in the Elysia Sector but is not planet Elysia.
- Cancephalus was a diversion target; Abaddon's attested Ninth Crusade action is on Antecanis.
- Teekus was omitted in favour of the stronger Rithcarn climax; neither source expressly places Abaddon on the surface.

### Yvraine

- Iathglas was omitted because it would be a final waypoint and there is no later honest station anchor.
- Eye of Terror was rejected as a Belial IV proxy, and Coheria was rejected because Yvraine was not physically there.
- Iachi and the branching video-game Eidolon ending were not used to manufacture a post-Iathglas anchor.

### Ghazghkull

- Urk has no catalog position beyond its broad Zornian System / Segmentum Solar context; no other Ork or Solar world substitutes for it.
- *Wurld Killa* cannot be a first waypoint and would be chronologically false after Armageddon.
- Buca III is described as a remote missile operation from a hidden asteroid base; Ghazghkull's physical presence on the world is not established.
- Chigon 17 was removed after the final personal-presence audit.
- Cantissa, Aurochtha, Ryza and simultaneous Armageddon sightings are explicitly conflicting reports and were not forced into a linear biography.

## Verification

- `npm run test:voyages` — pass, 1,014 checks across eleven journeys.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass, all 40 DB-free suites; the one live-Supabase suite was auto-skipped as designed.
- `npm run brain:lint -- --no-write` — pass, zero blocking findings and 20 unchanged repository warnings.
- `git diff --check` — pass.
- Manual desktop Cartographer at isolated `http://localhost:3100/map` — selected and began all five new journeys, advanced every act to the final station, and entered “Show the full route” for each.
- Manual full-route visual QA — Lion, Abaddon, Yvraine and Ghazghkull span distinct broad chart regions; Gaunt remains an intentionally dense Sabbat Worlds campaign with the Urdesh extension. Labels, waypoint dots, repeat-world legs and final cards rendered correctly.
- Browser console — no warnings or errors after the five complete tours and full-route views.

## Open issues / blockers

None for the requested Product/UI implementation.

The coordination-only rollup remains intentionally untouched. This Product PR does not modify `scripts/**`, `brain/**` or `sessions/README.md`.

## For next session

- Revisit Kronus copy after *Dawn of War IV* releases if its final campaign changes the announced Lion beat.
- A later Batch-owned map pass could add real pins for Urk or Iathglas; neither is needed for the honest routes shipped here.
- Cowork can roll the eleven-journey / 195-act state into the coordination-only project records after merge.

## References

Every act stores its precise provenance URL in the corresponding data file. The principal route and correction sources were:

- Gaunt: [series chronology](https://wh40k.lexicanum.com/wiki/Gaunt%27s_Ghosts_%28Novel_Series%29), [Gaunt's Ghosts](https://wh40k.lexicanum.com/wiki/Gaunt%27s_Ghosts), [Ibram Gaunt](https://wh40k.lexicanum.com/wiki/Ibram_Gaunt), [Formal Prime](https://wh40k.lexicanum.com/wiki/Formal_Prime), [Tanith](https://wh40k.lexicanum.com/wiki/Tanith), [Voltemand](https://wh40k.lexicanum.com/wiki/Voltemand), [Fortis Binary](https://wh40k.lexicanum.com/wiki/Fortis_Binary), [Menazoid Epsilon](https://wh40k.lexicanum.com/wiki/Menazoid_Epsilon), [Operation Larisel](https://wh40k.lexicanum.com/wiki/Operation_Larisel), [Ancreon Sextus](https://wh40k.lexicanum.com/wiki/Ancreon_Sextus).
- Lion: [Lion El'Jonson](https://wh40k.lexicanum.com/wiki/Lion_El%27Jonson), [Rangdan Xenocides](https://wh40k.lexicanum.com/wiki/Rangdan_Xenocides), [Battle of Diamat](https://wh40k.lexicanum.com/wiki/Battle_of_Diamat), [Thramas Crusade](https://wh40k.lexicanum.com/wiki/Thramas_Crusade), [Battle of Perditus](https://wh40k.lexicanum.com/wiki/Battle_of_Perditus), [Sheol](https://wh40k.lexicanum.com/wiki/Sheol), [Imperium Secundus](https://wh40k.lexicanum.com/wiki/Imperium_Secundus), [Passage of the Angels](https://wh40k.lexicanum.com/wiki/Passage_of_the_Angels), [Destruction of Caliban](https://wh40k.lexicanum.com/wiki/Destruction_of_Caliban), [official Kronus trailer](https://www.warhammer-community.com/en-gb/videos/68rwh94d/warhammer-40000-dawn-of-war-iv-sons-of-caliban-dark-angels-trailer/).
- Abaddon: [Battle of Harmony](https://wh40k.lexicanum.com/wiki/Battle_of_Harmony), [Black Crusade chronology](https://wh40k.lexicanum.com/wiki/Black_Crusade), [First](https://wh40k.lexicanum.com/wiki/1st_Black_Crusade), [Second](https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade), [Fourth](https://wh40k.lexicanum.com/wiki/4th_Black_Crusade), [Fifth](https://wh40k.lexicanum.com/wiki/Fifth_Black_Crusade), [Sixth](https://wh40k.lexicanum.com/wiki/6th_Black_Crusade), [Seventh](https://wh40k.lexicanum.com/wiki/7th_Black_Crusade), [Eighth](https://wh40k.lexicanum.com/wiki/8th_Black_Crusade), [Ninth](https://wh40k.lexicanum.com/wiki/9th_Black_Crusade), [Twelfth](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade), [Thirteenth](https://wh40k.lexicanum.com/wiki/13th_Black_Crusade), [War of Beasts](https://wh40k.lexicanum.com/wiki/War_of_Beasts).
- Yvraine: [Yvraine](https://wh40k.lexicanum.com/wiki/Yvraine), [Ynnari](https://wh40k.lexicanum.com/wiki/Ynnari), [Battle of Biel-tan](https://wh40k.lexicanum.com/wiki/Battle_of_Biel-tan), [Belial IV](https://wh40k.lexicanum.com/wiki/Belial_IV), [War in the Labyrinth](https://wh40k.lexicanum.com/wiki/War_in_the_Labyrinth), [Ultramar Campaign](https://wh40k.lexicanum.com/wiki/Ultramar_Campaign), [Hand of Darkness](https://wh40k.lexicanum.com/wiki/Hand_of_Darkness), [Zaisuthra](https://wh40k.lexicanum.com/wiki/Zaisuthra), [Agarimethea](https://wh40k.lexicanum.com/wiki/Agarimethea), [Zandros](https://wh40k.lexicanum.com/wiki/Zandros), [Iathglas rejection](https://wh40k.lexicanum.com/wiki/Battle_of_Iathglas).
- Ghazghkull: [Ghazghkull](https://wh40k.lexicanum.com/wiki/Ghazghkull), [Wurld Killa](https://wh40k.lexicanum.com/wiki/Wurld_Killa), [Piscina IV](https://wh40k.lexicanum.com/wiki/Battle_of_Piscina_IV), [Haunted Gulf](https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf), [Great Waaagh!](https://wh40k.lexicanum.com/wiki/Great_Waaagh%21), [Octaria / Octarius identity](https://wh40k.lexicanum.com/wiki/Octaria), [detailed Octaria chronology](https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka), [Krongar](https://wh40k.lexicanum.com/wiki/Battle_of_Krongar), [Icaria](https://wh40k.lexicanum.com/wiki/Icaria), [Fourth War for Armageddon](https://wh40k.lexicanum.com/wiki/Fourth_War_for_Armageddon).
