/**
 * Ghazghkull's personally attested road to the Great Waaagh. Urk and the
 * space hulk Wurld Killa have no chart position, so the visible route
 * begins where the hulk falls on Armageddon and keeps the origin in the card
 * copy. Octaria is the central planet Octarius under its attested alternate
 * name, not a proxy. Unpinned later locations use sourced relative or
 * schematic chart points with visible uncertainty disclosures.
 */

import type { Voyage } from "../types";

export const GHAZGHKULL: Voyage = {
  id: "ghazghkull",
  name: "Ghazghkull · Da Great Waaagh!",
  tag: "M41–M42",
  blurb: "The Prophet of Gork and Mork hunts worthy enemies until one world becomes a galaxy at war.",
  stations: [
    {
      world: "armageddon",
      heading: "Armageddon · Wurld Killa Falls",
      date: "941.M41",
      text: "On dying Urk, the newly anointed prophet gathers his first horde before boarding Wurld Killa. The space hulk tears from the Warp over Armageddon and crashes into the world that will define him.",
      source: "https://wh40k.lexicanum.com/wiki/Wurld_Killa",
    },
    {
      world: "golgotha",
      heading: "Golgotha · Good Enemies",
      date: "after 941.M41",
      text: "Ghazghkull overruns Golgotha, defeats Commissar Yarrick and takes him alive. When the commissar returns to Imperial lines, the prophet has found the one enemy worth fighting again.",
      source: "https://wh40k.lexicanum.com/wiki/Ghazghkull",
    },
    {
      world: "piscina",
      heading: "Piscina IV · Da Tellyporta Test",
      date: "997.M41",
      text: "Ghazghkull teleports onto Piscina IV, strikes at its power plant and beats Belial to the ground. The invasion fails, but the tellyporta works—the defeat has proved the weapon he needs for a far greater war.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Piscina_IV",
    },
    {
      world: "armageddon",
      heading: "Armageddon · The Holy War",
      date: "998.M41",
      text: "Fifty-seven years after his first invasion, the prophet returns at the head of a Waaagh that darkens the system. As the Third War grinds on, he understands that Armageddon is not the prize—it is the first fire in a war without end.",
      source: "https://wh40k.lexicanum.com/wiki/Ghazghkull",
    },
    {
      name: "Haunted Gulf",
      gx: 450,
      gy: 350,
      heading: "Haunted Gulf · No Time to Die",
      date: "189.999.M41",
      text: "Imperial hunters corner Kill Wrecka in the Haunted Gulf with Ghazghkull aboard. A surge of Weirdboy power cripples the trap and hurls his flagship into the Warp, leaving the Great Waaagh alive and moving.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf",
      placement: {
        precision: "schematic",
        note: "The source calls the Haunted Gulf an otherwise unidentified barren zone reached after Armageddon; the point marks that pursuit before the Warp jump to Octarius.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Haunted_Gulf",
      },
    },
    {
      name: "Urgok's Realm",
      gx: 520,
      gy: 415,
      heading: "Urgok's Realm · Da First Toadie",
      date: "694.999.M41",
      text: "Ghazghkull teleports his Bullyboyz straight into Warlord Urgok's command room. One brutal audience turns a rival empire into the first great host marching beneath his banner.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      placement: {
        precision: "schematic",
        note: "Kill Wrecka emerges in Urgok's territory before the Waaagh turns toward Octarius, but the realm has no named sector; it is plotted on that approach only.",
        source: "https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka",
      },
    },
    {
      name: "Fang's World",
      gx: 532,
      gy: 425,
      heading: "Fang's World · A New Horde",
      date: "704.999.M41",
      text: "The prophet and his Bullyboyz crash into Urgok's failing battle against the T'au and turn it by force. Victory binds the rescued horde to Ghazghkull rather than to the warlord who led it there.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      placement: {
        precision: "relative",
        note: "Fang's World is explicitly a nearby T'au colony inside the bounds of Urgok's realm; it is therefore plotted as the next local stop, not as a known galactic coordinate.",
        source: "https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka",
      },
    },
    {
      name: "Kongajaro",
      gx: 548,
      gy: 442,
      heading: "Kongajaro · Da Beast Hunt",
      date: "730.999.M41",
      text: "On Kongajaro, Ghazghkull joins the Snakebites' ritual hunt and kills beside them. The beast is barely cold when another clan swears itself to the road toward Octarius.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      placement: {
        precision: "relative",
        note: "Kongajaro is described as a jungle world near the Ork Empire of Octarius; the point is placed just outside the charted Octarius marker.",
        source: "https://wh40k.lexicanum.com/wiki/Ork_Domains",
      },
    },
    {
      name: "Black Kraken Nebula",
      gx: 558,
      gy: 450,
      heading: "Black Kraken Nebula · Redklaw's Choice",
      date: "730.999.M41",
      text: "Redklaw's pirates ambush the Waaagh in the Black Kraken Nebula and discover prey too dangerous to rob. Their captain changes sides before the guns cool, adding his fleet to Ghazghkull's tide.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      placement: {
        precision: "schematic",
        note: "The nebula is named only as the final recruitment theatre before Octarius; no segmentum position is published, so it is plotted on that last approach.",
        source: "https://wh40k.lexicanum.com/wiki/Great_Waaagh%21",
      },
    },
    {
      world: "octarius",
      heading: "Octaria · The Mawloc",
      date: "836–852.999.M41",
      text: "Ghazghkull teleports onto Octaria, the central world of Octarius, and tears his way out through a Mawloc that swallows him whole. Warlord Zog Steeltooth submits, and the sector's endless Ork–Tyranid slaughter feeds a still greater Waaagh.",
      source: "https://warhammer40k.fandom.com/wiki/Ghazghkull_Mag_Uruk_Thraka",
    },
    {
      world: "krongar",
      heading: "Krongar · Ten Days Dead",
      date: "early M42",
      text: "Ragnar Blackmane meets the prophet in single combat and takes his head, nearly dying for it. Ten days later Mad Dok Grotsnik raises Ghazghkull in a larger body, and death becomes another victory story.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Krongar",
    },
    {
      name: "Icaria",
      gx: 455.2,
      gy: 259.1,
      heading: "Icaria · The Dying Prototype",
      date: "Era Indomitus",
      text: "A prototype Tellyshokka rips Icaria apart around Ghazghkull and his oldest foe. He defeats Yarrick in person, spares him once more, and leaves the broken world to its ending.",
      source: "https://wh40k.lexicanum.com/wiki/Icaria",
      placement: {
        precision: "schematic",
        note: "Icaria's source records the battle but no segmentum, sector or system; the point only carries the post-Krongar, pre-Armageddon chronology.",
        source: "https://wh40k.lexicanum.com/wiki/Icaria",
      },
    },
    {
      world: "armageddon",
      heading: "Armageddon · The Beast Returns",
      date: "M42",
      text: "Roks annihilate Hive Hades before Ghazghkull teleports into its ruins. The Fourth War begins where his legend first struck ground, and Armageddon hears the prophet's roar again.",
      source: "https://wh40k.lexicanum.com/wiki/Fourth_War_for_Armageddon",
    },
  ],
  lbl: { x: 500, y: 230, t: "DA GREAT WAAAGH!" },
};
