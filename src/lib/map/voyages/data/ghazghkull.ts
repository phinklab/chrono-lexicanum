/**
 * Ghazghkull's personally attested road to the Great Waaagh. Urk and the
 * space hulk Wurld Killa have no chart position, so the visible route begins
 * where the hulk falls on Armageddon and keeps the earlier origin in the card
 * copy. Octaria is the central planet Octarius under its attested alternate
 * name, not a proxy. Unpinned later locations use sourced relative or
 * schematic chart points with visible uncertainty disclosures; Krongar uses
 * one because the catalog pin contradicts its sourced Ultima placement. Dotted
 * jump legs preserve the chronology without presenting those bridges as
 * attested realspace courses.
 */

import type { LegOverride, Voyage } from "../types";

const ORK_GREEN = "#79b84a" as const;
const GREEN_COURSE = { color: ORK_GREEN } satisfies LegOverride;
const GREEN_JUMP = { color: ORK_GREEN, effect: "jump", bow: 0 } satisfies LegOverride;

export const GHAZGHKULL: Voyage = {
  id: "ghazghkull",
  name: "Ghazghkull · Da Great Waaagh!",
  tag: "M41–M42",
  mapState: "now",
  blurb: "The Prophet of Gork and Mork hunts worthy enemies until one world becomes a galaxy at war.",
  stations: [
    {
      world: "armageddon",
      heading: "Armageddon · Wurld Killa Falls",
      date: "941.M41",
      text: "Years earlier on dying Urk, the newly anointed prophet gathers his first horde before boarding Wurld Killa. In 941.M41 the space hulk tears from the Warp over Armageddon and crashes into the world that will define him.",
      source: "https://wh40k.lexicanum.com/wiki/Wurld_Killa",
    },
    {
      world: "golgotha",
      heading: "Golgotha · Yarrick Captured",
      date: "after 941.M41",
      text: "Ghazghkull overruns Golgotha, defeats Commissar Yarrick and takes him alive. When the commissar returns to Imperial lines, the prophet has found the one enemy worth fighting again.",
      source: "https://www.blacklibrary.com/series/Astra-Militarum/chains-of-golgotha-ebook.html",
      leg: GREEN_COURSE,
      placement: {
        precision: "schematic",
        note: "Sources place Golgotha either in Ultima Segmentum or in the Armageddon Sector of Segmentum Solar. The catalog pin follows the Ultima account; the route does not resolve that conflict.",
        source: "https://wh40k.lexicanum.com/wiki/Golgotha",
      },
    },
    {
      world: "piscina",
      heading: "Piscina IV · Da Tellyporta Test",
      date: "997.M41",
      text: "Ghazghkull teleports onto Piscina IV, strikes at its power plant and beats Belial to the ground. The invasion fails, but the tellyporta works: the defeat has proved the weapon he needs for a far greater war.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Piscina_IV",
      leg: GREEN_COURSE,
    },
    {
      world: "armageddon",
      heading: "Armageddon · The Holy War",
      date: "998.M41",
      text: "Fifty-seven years after his first invasion, the prophet returns at the head of a Waaagh that darkens the system. As the Third War grinds into stalemate, he sees Armageddon as the first fire of a greater holy war and leaves to gather every worthy horde.",
      source: "https://wh40k.lexicanum.com/wiki/Ghazghkull",
      leg: GREEN_COURSE,
    },
    {
      name: "Haunted Gulf",
      gx: 450,
      gy: 350,
      heading: "Haunted Gulf · Kill Wrecka Escapes",
      date: "189.999.M41",
      text: "Imperial hunters corner Kill Wrecka in the Haunted Gulf with Ghazghkull aboard. A surge of Weirdboy power cripples the trap and hurls his flagship into the Warp, leaving the Great Waaagh alive and moving.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf",
      leg: GREEN_COURSE,
      placement: {
        precision: "schematic",
        note: "The source calls the Haunted Gulf an otherwise unidentified barren zone reached after Armageddon; the point marks the pursuit only. Kill Wrecka's uncontrolled Warp disappearance does not supply a realspace course to its next emergence.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf",
      },
    },
    {
      name: "Da Ironfoot",
      gx: 816,
      gy: 552,
      heading: "Da Ironfoot · Urgok Bows",
      date: "694.999.M41",
      text: "Ghazghkull teleports his Bullyboyz into rival Warlord Urgok's command chamber aboard the space hulk Da Ironfoot. One brutal audience turns Urgok's empire into the first great host beneath the prophet's banner.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_JUMP,
      placement: {
        precision: "schematic",
        note: "Da Ironfoot is Urgok's space-hulk fortress inside a realm that includes a T'au colony, but neither hulk nor realm has a named sector. The point marks only that regional overlap; its dotted incoming trace preserves chronology, not a realspace course.",
        source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      },
    },
    {
      name: "Fang's World",
      gx: 829,
      gy: 558,
      heading: "Fang's World · A New Horde",
      date: "704.999.M41",
      text: "The prophet and his Bullyboyz crash into Urgok's failing battle against the T'au and turn it by force. Victory binds the rescued horde to Ghazghkull rather than to the warlord who led it there.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_COURSE,
      placement: {
        precision: "relative",
        note: "Fang's World is a T'au colony inside Urgok's realm, so the point is kept close to Da Ironfoot. No sept, segmentum, bearing or position within the modern charted T'au empire is attested.",
        source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      },
    },
    {
      name: "Kongajaro",
      gx: 804,
      gy: 570,
      heading: "Kongajaro · Da Beast Hunt",
      date: "730.999.M41",
      text: "On Kongajaro, Ghazghkull joins Grak and the Snakebites in their ritual hunt. The kill seals their allegiance, adding another great Ork host to the road toward Octarius.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_COURSE,
      placement: {
        precision: "relative",
        note: "Kongajaro is the next nearby star system in the recruitment sequence after Fang's World. Its point preserves that local relationship only; the source supplies neither a bearing nor a galactic coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      },
    },
    {
      name: "Black Kraken Nebula",
      gx: 684,
      gy: 512,
      heading: "Black Kraken Nebula · Redklaw's Choice",
      date: "730.999.M41",
      text: "Redklaw's pirates ambush the Waaagh in the Black Kraken Nebula and discover prey too dangerous to rob. Their captain changes sides before the guns cool, adding his fleet to Ghazghkull's tide.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_COURSE,
      placement: {
        precision: "schematic",
        note: "The supplement places the Black Kraken Nebula after Kongajaro as Ghazghkull's Waaagh drives towards the galactic southeast and Octarius. This point shows that broad corridor only, not a measured nebula coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      },
    },
    {
      world: "octarius",
      heading: "Octaria · The Mawloc",
      date: "836–851.999.M41",
      text: "Ghazghkull teleports onto Octaria, the central world of Octarius, and tears his way out through a Mawloc that swallows him whole. Warlord Zog Steeltooth submits, placing the empire's endless Ork–Tyranid war beneath the prophet's banner.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_COURSE,
    },
    {
      world: "octarius",
      heading: "Octaria · The Galactic Green Wave",
      date: "852.999.M41",
      text: "A green psychic shockwave rolls out from Octaria and is felt by Orks across the galaxy. Ghazghkull's gathering becomes the greatest Waaagh in eight thousand years, and the whole galaxy its promised battlefield.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      leg: GREEN_COURSE,
    },
    {
      name: "Krongar",
      gx: 710,
      gy: 210,
      heading: "Krongar · Ten Days Dead",
      date: "early M42",
      text: "Ragnar Blackmane meets the prophet in single combat and takes his head, nearly dying for it. Ten days later Mad Dok Grotsnik raises Ghazghkull in a larger body, and death becomes another victory story.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Krongar",
      leg: GREEN_JUMP,
      placement: {
        precision: "schematic",
        note: "Krongar is fixed only to the Skarskell Subsector of Ultima Segmentum beyond the Great Rift. The point claims that broad Imperium Nihilus region; its dotted incoming trace preserves chronology, not a subsector coordinate or course from Octaria.",
        source: "https://wh40k.lexicanum.com/wiki/Krongar",
      },
    },
    {
      name: "Icaria",
      gx: 455.2,
      gy: 259.1,
      heading: "Icaria · The Mega-Tellyshokka",
      date: "Era Indomitus",
      text: "A prototype Tellyshokka rips Icaria apart around Ghazghkull and his oldest foe. He defeats Yarrick in person, spares him once more, and leaves the broken world to its ending.",
      source: "https://www.warhammer-community.com/en-gb/articles/z9key2tp/lore-where-has-commissar-yarrick-been-lately/",
      leg: GREEN_JUMP,
      placement: {
        precision: "schematic",
        note: "The official account identifies Icaria but supplies no segmentum, sector or system. The point and its dotted trace carry only the post-Krongar, pre-Armageddon chronology, not an exact galactic position or attested course.",
        source: "https://www.warhammer-community.com/en-gb/articles/z9key2tp/lore-where-has-commissar-yarrick-been-lately/",
      },
    },
    {
      world: "armageddon",
      heading: "Armageddon · The Beast Returns",
      date: "Era Indomitus · ongoing",
      text: "Roks annihilate Hive Hades before Ghazghkull teleports into its ruins and turns them into the heart of his renewed siege. The war now grinds on across Armageddon: the endless battle the prophet came to create.",
      source: "https://www.warhammer-community.com/en-gb/articles/0gmcnp9x/lore-of-armageddon-part-3-ghazghkulls-grand-plan/",
      leg: GREEN_JUMP,
    },
  ],
  lbl: { x: 500, y: 230, t: "DA GREAT WAAAGH!" },
};
