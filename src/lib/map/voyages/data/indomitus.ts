/**
 * The Indomitus Crusade (999.M41–012.M42), fleet-scale: the reconquest
 * itself rather than one traveller. Expanded 2026-07-09 from the 4-station
 * verbatim migration; the old hand-drawn legs died with the rerouting
 * (Guilliman's personal resurrection/Terra beats live in his own journey).
 *
 * Research notes: Machorta Sound was Fleet Tertius under Fleetmistress
 * VanLeskus (not Quintus). Gathalamor follows the Gate-of-Bones novel
 * telling (Achallor; the 8th-ed Custodes codex says Valoris/Voldus).
 * Baal keeps the classic 8th-ed order (fleet arrives in the Devastation's
 * wake, early M42); the 2021 retcon moves Guilliman's personal Baal visit
 * after the Plague Wars. Ophelia VII and the Pit of Raukos are documented
 * but not on the chart — they ride their legs as WAYPOINTS (Gathalamor →
 * Baal and Vigilus → Macragge). Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const INDOMITUS: Voyage = {
  id: "indomitus",
  name: "The Indomitus Crusade",
  tag: "M42",
  blurb: "The greatest muster since the Great Crusade: ten fleets sail to relight a sundered Imperium.",
  stations: [
    {
      world: "terra",
      heading: "Terra · The Indomitus Muster",
      date: "c. 999.M41",
      text: "By the will of the returned primarch the greatest muster since the Great Crusade fills the Sol System, ten numbered fleets under the Lord Commander. Torchbearer task forces race ahead of them, carrying the Primaris gift to embattled Chapters.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },
    {
      world: "mars",
      heading: "Mars · Forge of the Ultima Founding",
      date: "c. 999.M41",
      text: "Mars empties its forges for the reconquest. Archmagos Belisarius Cawl brings thousands of Ultima Founding Primaris Marines, held in stasis aboard the macro-barge Zar-Quaesitor, to sail with Fleet Primus.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },
    {
      world: "machorta-sound",
      heading: "Machorta Sound · First Victory",
      date: "c. 001.M42",
      text: "Fleet Tertius launches days ahead of schedule to intercept a Khornate Slaughter Host reaving toward Sol. Fleetmistress VanLeskus breaks it across several star systems, and the crusade records its first major victory.",
      source: "https://wh40k.lexicanum.com/wiki/Avenging_Son_(Novel)",
    },
    {
      world: "gathalamor",
      heading: "Gathalamor · The Gate of Bones",
      date: "early M42",
      text: "Fleet Primus claims its first great victory on the shrine world. The Custodes of Shield-Captain Achallor silence a Dark Mechanicum cannon built from the bones of Gathalamor's buried billions, and the Shield-Captain falls in the deed.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gathalamor",
    },
    {
      via: 0.4,
      name: "Ophelia VII",
      heading: "Ophelia VII · Liberation",
      date: "early M42",
      text: "On the cardinal world the crusade breaks the dominion of the Tyrant of Blueflame and frees an enslaved population entire. The Greater Daemon itself slips the Emperor's justice.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },
    {
      world: "baal",
      heading: "Baal · After the Devastation",
      date: "early M42",
      text: "Crossing the wake of the Great Rift, Guilliman's fleet reaches Baal to find Hive Fleet Leviathan broken and Ka'Bandha's sigil laid out in Tyranid skulls upon Baal Prime. The primarch names Commander Dante Regent of Imperium Nihilus.",
      source: "https://wh40k.lexicanum.com/wiki/Devastation_of_Baal",
    },
    {
      world: "fenris",
      heading: "Fenris · The Wolftime",
      date: "c. 004.M42",
      text: "A Torchbearer vessel runs ahead of Fleet Primus to the world of the Wolves. Guilliman treats with a distrustful Logan Grimnar, and the Space Wolves agree to guard the crusade's rear against the rising Waaagh! of Ghazghkull Thraka.",
      source: "https://wh40k.lexicanum.com/wiki/The_Wolftime_(Novel)",
    },
    {
      world: "vigilus",
      heading: "Vigilus · The War of Beasts",
      date: "001–025.M42",
      text: "Commanded by Guilliman that Vigilus must not fall, Marneus Calgar lands at Saint's Haven and raises the Vigilus Senate to master the War of Beasts. At its height he duels Abaddon in person, surviving only by his Belisarian Furnace.",
      source: "https://wh40k.lexicanum.com/wiki/War_of_Beasts",
    },
    {
      via: 0.5,
      name: "The Pit of Raukos",
      heading: "The Pit of Raukos · The Last Battle",
      date: "c. 012.M42",
      text: "At a wound in space where daemon ships spill into the Materium, the crusade fights its closing battle. Guilliman holds a triumph of two million souls at 108/Beta-Kalapus-9.2 and disperses the Unnumbered Sons.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Raukos",
    },
    {
      world: "macragge",
      heading: "Macragge · The Crusade's End",
      date: "c. 012.M42",
      text: "Twelve years after the muster the primarch turns for Ultramar at last, the first phase of the reconquest done. Ahead of him, Mortarion's Plague Wars already burn through the Five Hundred Worlds.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
  ],
  lbl: { x: 590, y: 505, t: "INDOMITUS" },
};
