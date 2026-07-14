---
session: 2026-07-14-218
role: implementer
date: 2026-07-14
status: complete
slug: journey-spatial-audit
parent: 2026-07-14-217
links:
  - https://github.com/BigPhil92/chrono-lexicanum/pull/264
  - sessions/2026-07-14-217-impl-journey-lore-prototypes.md
commits: []
---

# Great Journeys spatial audit and Black Crusade identities

## Summary

All eleven journeys and all 61 synthetic chart points were re-audited against chronology, named map entities, broad regions, faction overlays and direct lore sources. Ghazghkull's Urgok cluster now sits at the western T'au-zone border after an explicit Warp route break, unsupported realspace connections across the roster were removed, and Black Crusades I–XIII now share thirteen restrained colours and Roman-number playback labels across SVG and Canvas.

## What I did

- `src/lib/map/voyages/data/ghazghkull.ts` — broke the uncontrolled Haunted Gulf Warp jump, moved Urgok/Fang/Kongajaro to the T'au-zone border, made Black Kraken a corridor to catalog Octarius, and broke the unknown Icaria approach plus the mega-tellyshokka jump to Armageddon.
- `src/lib/map/voyages/data/{great-crusade,lion,horus,guilliman,garro,abaddon,yvraine,indomitus}.ts` — removed lines where the sources support chronology, parallel operations, Webway/Warp transit or only a broad region, not a realspace connection.
- `src/lib/map/voyages/data/lion.ts` — moved Wyrmwood to the fringe of the charted Somnium Stars and removed Kronus because the source reports only a rumour of the Lion's interest, not a personally attested visit.
- `src/lib/map/voyages/data/yvraine.ts` — removed the false Saim-Hann proximity inference for Agarimethea and isolated the non-ordinal Webway/Warp beats.
- `src/lib/map/voyages/{types,resolve}.ts` — added authored voyage sections and resolved one shared section colour per station and leg.
- `src/lib/map/voyages/data/abaddon.ts` — added prologue/epilogue-neutral sections plus thirteen muted, unique Crusade sections labelled `BLACK CRUSADE I / XIII` through `XIII / XIII`.
- `src/components/cartographer/{RoutesLayer,RouteMotionCanvas,canvas-renderer}.tsx` / `.ts` — use the same resolved colours in desktop SVG, narrow motion Canvas and full Canvas, with one active halo rather than thirteen stacked numerals at the Eye.
- `src/components/cartographer/{VoyageTour,CourseCards,CartographerRoot}.tsx` and `src/app/styles/55-map.css` — expose the current section in the tour card and journey HUD.
- `scripts/test-voyages.ts` — added Ghazghkull order/break/zone/corridor invariants, exact Eye-origin and Roman-label checks, colour format/uniqueness/distance checks, substantive placement/source checks and renderer-colour alignment.
- `sessions/2026-07-14-218-impl-journey-spatial-audit.md` — recorded the complete reviewed synthetic-point ledger below. No `brain/**` or `sessions/README.md` rollup was touched.

## Connection audit by journey

- **The Great Crusade** — canonical rediscovery order remains the narrative spine; the regionless Second and Eleventh are isolated on both sides so their schematic dots cannot create invented bearings.
- **Lion El'Jonson** — Taxal's broad Xenocide theatre, Diamat's separate Isstvan-relative anchor, Mirror-Caliban and the M42 Forestwalk arrivals are disconnected. Camarth is downgraded to schematic; Wyrmwood is moved to the Somnium Stars fringe; unsupported Kronus is removed.
- **Horus** — the accidental arrival at Sixty-Three Nineteen, the regionless Interex cluster entry, Davin, Aureus, Isstvan, Dwell and Molech now start only where the source establishes a new beat. Murder–Xenobia remains the one local Interex relationship.
- **Guilliman** — Pyrrhan remains constrained between Anuari and Davin; regionless Thessala is isolated from both Terra and the return to Macragge.
- **Garro** — the Empyrean is non-ordinal and isolated; Dorn's rescue/Luna landfall starts a new realspace segment. Isstvan and Sol-system offsets remain locally constrained.
- **Abaddon** — every Crusade still restarts at the Eye. The Eighth's strikes “in every direction,” the Tenth's Thracian feint versus Abaddon's Medusa objective, and the Eleventh's multi-kilolight-year scattering are disconnected rather than drawn as personal travel.
- **Eisenhorn** — KCX-1288 and 56-Izar remain a sourced Scarus cluster; Farness Beta remains at the mouth of the Cadian Gate. All stops and connections confirmed.
- **Ibram Gaunt** — Blackshard is explicitly in the Sabbat Worlds and the remaining catalog route follows the regiment's campaign chronology. All stops and connections confirmed.
- **Ghazghkull** — Armageddon to the Haunted Gulf remains; Kill Wrecka's uncontrolled disappearance breaks the route before the new Urgok/T'au-border cluster. Kongajaro is local, Black Kraken is schematic on the run to catalog Octarius, and the later unknown/teleport transitions are broken.
- **Yvraine** — Gnosis, Commorragh, Webway, Warp, Zaisuthra and region-unknown beats are isolated. Agarimethea no longer borrows Saim-Hann's location; Saim-Hann remains a mobile Eastern Fringe regional point; Iathglas claims Ultima only.
- **The Indomitus Crusade** — explicitly presented as a fleet-scale campaign, not one ship's journey. Fleet Tertius, Fleet Primus, delegated fronts and Guilliman's personal route are separated; the Raukos/Attilan pair remains tied to catalog Attila without asserting historical Sautekh control.

## Complete synthetic-point ledger (61/61)

`changed` means coordinate, precision or rendered rationale changed in this pass. `confirmed` means the coordinate contract survived the audit; connection-only corrections are recorded in the journey audit above.

### The Great Crusade (4)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Sedna | `326, 409` | `relative` | confirmed | Final battle to liberate the Sol System; plotted just beyond the Sol cluster because no orbit survives. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Sedna_Campaign) |
| The Second | `288.1, 228` | `schematic` | confirmed | Only the rediscovery date survives; the isolated point holds chronology and claims no homeworld or region. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Lost_Primarchs) |
| The Eleventh | `335.6, 564.6` | `schematic` | confirmed | Only the sequence survives; the isolated point makes no claim about the erased homeworld. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Lost_Primarchs) |
| Gorro | `400, 298` | `relative` | confirmed | Mobile Telon Reach scrapworld and Ullanor satrapy; kept close to Ullanor without a false exact coordinate. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Gorro) |

### Lion El'Jonson · Son of the Forest (7)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Taxal | `520, 270` | `schematic` | confirmed | Taxal has no coordinate inside the Xenocides' broad Obscurus/Ultima/galactic-north-west theatre; it is isolated. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Rangdan_Xenocides) |
| Diamat | `508, 169` | `relative` | confirmed | Explicitly 52.7 light years from Isstvan at the Ulthoris Subsector edge; plotted beside the catalog system. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Diamat) |
| Sheol IX | `910, 455` | `relative` | confirmed | Explicit Thramas Sector world in Ultima; local offset from the charted sector marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Sheol) |
| Mirror-Caliban | `930.8, 261` | `schematic` | confirmed | Liminal Forestwalk realm, not fixed realspace; isolated from both the Rock and Camarth. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Mirror-Caliban) |
| Camarth | `875.3, 247.5` | `schematic` | changed | Only Ultima and Imperium Nihilus are known; no sector/system, so the point is broad-theatre and isolated. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Camarth) |
| Avalus | `809.3, 242.8` | `schematic` | confirmed | Protectorate hub in Imperium Nihilus with no fixed sector; isolated rather than implying distance to Camarth/Sable. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Avalus) |
| Wyrmwood | `949, 300` | `relative` | changed | Idolatros System planetoid on the fringes of the Somnium Stars; moved to that charted zone edge and isolated as a Forestwalk arrival. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Idolatros_System) |

### Horus · Rise and Ruin (5)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Sixty-Three Nineteen | `449, 327.4` | `schematic` | confirmed | Accidental warp-storm reroute to an unnamed system; isolated post-Ullanor chronology only. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Sixty-Three-Nineteen) |
| Murder | `485.5, 352.5` | `schematic` | confirmed | Quarantined Interex frontier world, but the Interex region is unknown; isolated cluster entry. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Murder) |
| Xenobia | `518.4, 384.5` | `schematic` | confirmed | Another Interex frontier world without sector; retained after Murder as the one attested local civilisational relation. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Xenobia) |
| Aureus | `523.8, 277` | `schematic` | confirmed | Fixed only to Drakonis Three Eleven; no segmentum/sector, so it is an isolated campaign marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Auretian_Technocracy) |
| Dwell | `497.6, 213.5` | `schematic` | confirmed | Named system but no region; its information link to Molech is not spatial proximity, so both ends are isolated. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Dwell) |

### Guilliman · Lord of Ultramar (2)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Pyrrhan | `717.1, 495.6` | `relative` | confirmed | Explicit Ruinstorm passage after Anuari and before Davin; corridor-constrained without a sector claim. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Harrowing_of_Pyrrhan) |
| Thessala | `565.7, 549.6` | `schematic` | confirmed | Uncharted gas giant with no system/sector; isolated chronology before the return to Macragge. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Thessala) |

### Garro · Knight of Grey (6)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Istvaan System Edge | `487.5, 166.5` | `relative` | confirmed | Escape remains inside the Istvaan System; offset from III and deliberately not confused with V. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Isstvan_III) |
| The Empyrean | `392, 270.1` | `schematic` | confirmed | Warp transit has no stable realspace coordinate; isolated between the system escape and Dorn's rescue. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Nathaniel_Garro) |
| Daggerline | `329.8, 397.5` | `relative` | confirmed | Explicitly in the Kuiper Belt on the Sol System outskirts; local Sol offset. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Garro:_Sword_of_Truth_(Audio_Book)) |
| Io | `331.2, 404.8` | `relative` | confirmed | Jupiter's moon; offset only separates an orbit the galactic chart cannot resolve. | [Fandom fallback](https://warhammer40k.fandom.com/wiki/Nathaniel_Garro) |
| Riga Orbital Plate | `335, 403.8` | `relative` | confirmed | Explicit orbital plate over Terra; legibility offset, not orbital longitude. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies) |
| Hesperides Orbital Plate | `331.6, 399.2` | `relative` | confirmed | Explicit Terran orbital plate; legibility offset inside the Sol cluster. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Garro:_Vow_of_Faith_(Novella)) |

### Abaddon · The Long War (15)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Harmony | `250, 220` | `relative` | confirmed | Daemon World inside the Eye; local offset only, with neutral prologue styling. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Harmony) |
| Nemesis Tessera | `320, 242` | `relative` | confirmed | One of the Cadian Gate's named bastions beside Cadia and Belis Corona. | [Lexicanum](https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade) |
| Gerstahl | `310, 255` | `relative` | confirmed | Concealed Third Crusade objective at the Cadian Gate; local Cadia offset. | [Lexicanum](https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade) |
| Tarinth | `435, 305` | `relative` | confirmed | Explicit Elysia Sector world; local offset from charted Elysia. | [Lexicanum](https://wh40k.lexicanum.com/wiki/5th_Black_Crusade) |
| Arkreath | `320, 195` | `schematic` | confirmed | Forge World known only to lie in Segmentum Obscurus; broad northern placement. | [Lexicanum](https://wh40k.lexicanum.com/wiki/6th_Black_Crusade) |
| Teekus | `310, 185` | `schematic` | changed | Eighth Crusade marker in Obscurus; isolated because the Black Legion struck in every direction. | [Lexicanum](https://wh40k.lexicanum.com/wiki/8th_Black_Crusade) |
| Rithcarn | `330, 175` | `schematic` | changed | Ritual climax in Obscurus but no sector or Teekus travel relation; isolated chronology. | [Lexicanum](https://wh40k.lexicanum.com/wiki/8th_Black_Crusade) |
| Antecanis | `340, 160` | `schematic` | confirmed | Ninth Crusade world in Obscurus; sector unknown, but the source establishes the strategic relation to Cancephalus. | [Lexicanum](https://wh40k.lexicanum.com/wiki/9th_Black_Crusade) |
| Cancephalus | `360, 145` | `schematic` | confirmed | Named nearby Navy-fortress objective; no independent system coordinate. | [Lexicanum](https://wh40k.lexicanum.com/wiki/9th_Black_Crusade) |
| Relorria | `405, 95` | `schematic` | confirmed | Fleet scattered thousands of light years with no resulting sector; isolated from the Eye. | [Lexicanum](https://wh40k.lexicanum.com/wiki/11th_Black_Crusade) |
| Brinaga | `440, 165` | `relative` | confirmed | Named Gothic War system; local offset inside the charted Gothic Sector. | [Lexicanum](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade) |
| Fularis II | `450, 172` | `relative` | confirmed | Documented Gothic Sector objective; campaign-cluster offset. | [Lexicanum](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade) |
| Tarantis | `445, 185` | `relative` | confirmed | Explicit Gothic War system; grouped around the sector marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade) |
| Schindlegeist | `435, 190` | `relative` | confirmed | Decisive Gothic War ambush system; does not reuse the unrelated `schindelgheist` catalog name. | [Lexicanum](https://wh40k.lexicanum.com/wiki/12th_Black_Crusade) |
| Ormantep System | `290, 230` | `relative` | confirmed | Picket immediately before the assault on Cadia; Eye–Cadia approach without false exactness. | [Lexicanum](https://wh40k.lexicanum.com/wiki/13th_Black_Crusade) |

### Eisenhorn · The Ordo Dossiers (3)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| KCX-1288 | `238.2, 118` | `relative` | confirmed | Deep Saruthi space inside the Scarus Sector; clustered with charted Scarus dossier worlds. | [Lexicanum](https://wh40k.lexicanum.com/wiki/KCX-1288) |
| 56-Izar | `237.3, 110.4` | `relative` | confirmed | Vincies Subsector of Scarus; regional offset from the sector marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/56-Izar) |
| Farness Beta | `284, 229` | `relative` | confirmed | Mouth of the Cadian Gate in the Cadian Subsector; correctly beside Cadia. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Farness_Beta) |

### Ibram Gaunt · The First and Only (1)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Blackshard | `168, 520` | `relative` | confirmed | Explicit Sabbat Worlds planet in Segmentum Pacificus; inside the charted cluster near early campaign worlds. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Blackshard) |

### Ghazghkull · Da Great Waaagh! (6)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Haunted Gulf | `450, 350` | `schematic` | changed | Unidentified barren zone after Armageddon; the point marks the pursuit only and now ends before the uncontrolled Warp disappearance. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf) |
| Urgok's Realm | `816, 552` | `schematic` | changed | Realm contains a T'au colony but has no sector; moved to the western T'au-zone border without inventing a sept. | [Fandom fallback](https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka) |
| Fang's World | `829, 558` | `relative` | changed | Nearby T'au colony inside Urgok's realm; moved just inside the western zone edge, with no Vior'la inference from red armour. | [Fandom fallback](https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka) |
| Kongajaro | `804, 570` | `relative` | changed | Nearby system after Fang's World; retained in the Urgok/T'au-border cluster, not falsely beside Octarius. | [Fandom fallback](https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka) |
| Black Kraken Nebula | `684, 512` | `schematic` | changed | Final recruitment theatre before Octarius; schematic corridor between the local cluster and catalog Octarius. | [Fandom fallback](https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka) |
| Icaria | `455.2, 259.1` | `schematic` | confirmed | No segmentum/sector/system; isolated post-Krongar chronology before the separate mega-tellyshokka transit to Armageddon. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Icaria) |

### Yvraine · The Seventh Path (10)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| Gnosis Prime | `440, 640` | `schematic` | changed | Talhor Sector has no chart position; moved away from the false Armageddon vicinity and isolated. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Gnosis_Prime) |
| Belial IV | `252, 220` | `relative` | confirmed | Crone World pulled into the Eye; plotted inside the charted rift. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Belial_IV) |
| Psychedelta | `290, 245` | `schematic` | confirmed | Non-ordinal Webway convergence; isolated from both Iyanden and realspace Klaisus. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Klaisus) |
| Klaisus | `282, 240` | `relative` | confirmed | Outermost ice moon of the Cadian System; local Cadia offset and new realspace segment. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Klaisus) |
| Garden of Nurgle | `556.4, 87` | `schematic` | confirmed | Warp realm, not a stable galactic coordinate; isolated extradimensional marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Hand_of_Darkness) |
| Einerash | `383, 142.8` | `schematic` | confirmed | Dead Webway city; isolated non-ordinal passage marker. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Yvraine) |
| Zaisuthra | `482.8, 635.5` | `schematic` | confirmed | Developed inside the Webway and later entered the Materium; no stable region, so isolated. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Zaisuthra) |
| Agarimethea | `690, 630` | `schematic` | changed | Segmentum, sector and system unknown; moved away from Saim-Hann because spiritual importance is not proximity. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Agarimethea) |
| Saim-Hann | `890, 410` | `relative` | confirmed | Mobile craftworld currently in the Eastern Fringe; regional point, never a permanent ephemeris or control claim. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Saim-Hann) |
| Iathglas | `760, 360` | `schematic` | changed | Miaghu System in Ultima, but no sector/coordinate; downgraded and isolated to claim only that segmentum. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Iathglas) |

### The Indomitus Crusade (2)

| Point | Final coordinate | Precision | Result | Spatial rationale | Source |
|---|---:|---|---|---|---|
| The Pit of Raukos | `900, 440` | `relative` | changed | Beside the Attilan Gate near catalog Attila in Ultima; note now disclaims historical control from the broad modern Sautekh overlay. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Pit_of_Raukos) |
| The Attilan Gate | `922, 430` | `relative` | changed | Explicitly near Attila and beside Raukos; local offset only, not an exact aperture or Sautekh claim. | [Lexicanum](https://wh40k.lexicanum.com/wiki/Attilan_Gate) |

## Decisions I made

- **Used route breaks as epistemic boundaries.** A dot can preserve a sourced narrative beat without a line implying an unsupported bearing, distance or continuous realspace trip.
- **Placed Urgok just outside and Fang just inside the T'au polygon.** This encodes the attested realm/colony overlap while avoiding false precision and the unsupported Vior'la inference explicitly rejected by the maintainer.
- **Kept Kongajaro local and made Black Kraken the long corridor.** The indexed fallback gives the order and “nearby” relation but no bearing; the geometry therefore expresses only local cluster → corridor → catalog Octarius.
- **Removed Kronus from the Lion journey.** The official trailer supports Dark Angels participation and a rumour of the Lion's interest, not a personal visit; retaining it would violate the journey's attestation standard.
- **Used one shared section model instead of renderer-specific palettes.** The thirteen colours, labels and starts are authored once and resolved into both SVG and Canvas, preventing visual drift.
- **Kept Harmony and Vigilus neutral.** They are prologue/epilogue, not numbered Crusades. At the shared Eye origin the map renders one active coloured halo instead of thirteen overlapping labels.
- **Accepted three Ghazghkull Fandom placement fallbacks.** Lexicanum establishes the broad Great Waaagh chronology but does not index the T'au-colony/local-system wording needed for Urgok, Fang, Kongajaro and Black Kraken. Each remains explicitly schematic/relative and source-linked.
- **Did not update an Architect Brief.** This was a direct maintainer launch continuation of Session 217, so there is no open brief status to flip.

## Verification

- `npm run test:voyages` — pass, 1,309 checks across eleven journeys.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, all 40 DB-free suites; one live-Supabase suite auto-skipped as designed.
- `npm run build` — pass, 1,293 static pages generated; the pre-existing Turbopack NFT trace warning from `next.config.ts` / sitemap remains non-blocking.
- `npm run brain:lint -- --no-write` — pass, zero blocking findings and 20 existing repository warnings.
- Localhost visual QA at `/map?mapRenderer=svg` and `/map?mapRenderer=canvas` — pass at desktop and 390×844: shared Crusade colour, one active Eye halo, full `BLACK CRUSADE I / XIII` card/HUD label, readable narrow dock, no browser errors, dialogs or Next error overlays.

## Open issues / blockers

None.

## For next session

- Replace the remaining Ghazghkull and Garro Fandom fallbacks if a page-level Games Workshop or Lexicanum source indexes the same spatial wording.
- If later art direction wants an explicit palette key, derive it from `Voyage.sections`; do not add thirteen permanent numerals at the Eye.

## References

- Ghazghkull route discontinuity and chronology: [Battle of Haunted Gulf](https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf), [Great Waaagh!](https://wh40k.lexicanum.com/wiki/Great_Waaagh%21), [Games Workshop — Icaria/Yarrick](https://www.warhammer-community.com/en-gb/articles/z9key2tp/lore-where-has-commissar-yarrick-been-lately/), [Games Workshop — mega-tellyshokka to Armageddon](https://www.warhammer-community.com/en-gb/articles/0gmcnp9x/lore-of-armageddon-part-3-ghazghkulls-grand-plan/).
- Key route-break evidence: [63-19](https://wh40k.lexicanum.com/wiki/Battle_of_63-19), [Eisenstein rescue](https://wh40k.lexicanum.com/wiki/Eisenstein), [Eighth Black Crusade](https://wh40k.lexicanum.com/wiki/8th_Black_Crusade), [Eleventh Black Crusade](https://wh40k.lexicanum.com/wiki/11th_Black_Crusade), [Webway](https://wh40k.lexicanum.com/wiki/Webway), [Fleet Primus](https://wh40k.lexicanum.com/wiki/Fleet_Primus).
- Key regional evidence: [Idolatros System](https://wh40k.lexicanum.com/wiki/Idolatros_System), [Agarimethea](https://wh40k.lexicanum.com/wiki/Agarimethea), [Saim-Hann](https://wh40k.lexicanum.com/wiki/Saim-Hann), [Iathglas](https://wh40k.lexicanum.com/wiki/Iathglas), [Attilan Gate](https://wh40k.lexicanum.com/wiki/Attilan_Gate).
