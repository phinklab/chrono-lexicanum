/**
 * The Indomitus Crusade (999.M41–012.M42), fleet-scale: the reconquest
 * itself rather than one traveller. Expanded 2026-07-09 from the 4-station
 * verbatim migration; the old hand-drawn legs died with the rerouting
 * (Guilliman's personal resurrection/Terra beats live in his own journey).
 *
 * Research notes: Machorta Sound was Fleet Tertius under Fleetmistress
 * VanLeskus (not Quintus). Gathalamor follows the Gate-of-Bones novel
 * telling (Achallor; the 8th-ed Custodes codex says Valoris/Voldus).
 * The current post-2021 chronology is authoritative: Raukos closes the
 * first phase and the Unnumbered Sons formations, not the Crusade; Guilliman
 * then returns to Ultramar for the Plague Wars and reaches Baal afterward
 * through the Attilan Gate. Ophelia VII reuses its existing (misspelled)
 * catalog record; Raukos and the Attilan Gate use relative chart points tied
 * to the sourced Attila region. Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const INDOMITUS: Voyage = {
  id: "indomitus",
  name: "The Indomitus Crusade",
  tag: "M42 · ongoing",
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
      world: "ophellia-vii",
      heading: "Ophelia VII · Liberation",
      date: "early M42",
      text: "On the cardinal world the crusade breaks the dominion of the Tyrant of Blueflame and frees an enslaved population entire. The Greater Daemon itself slips the Emperor's justice.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
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
      name: "The Pit of Raukos",
      gx: 900,
      gy: 440,
      heading: "The Pit of Raukos · The First Phase Ends",
      date: "c. 012.M42",
      text: "At a wound in space where daemon ships spill into the Materium, the first phase reaches its culminating battle. Guilliman holds a triumph of two million souls at 108/Beta-Kalapus-9.2 and disperses the Unnumbered Sons, while the wider Crusade continues.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Raukos",
      placement: {
        precision: "relative",
        note: "The Pit has no published sector coordinate, but later sources place it beside the Attilan Gate, which is near charted Attila in Ultima; it is plotted as that local warp-rift theatre.",
        source: "https://wh40k.lexicanum.com/wiki/Pit_of_Raukos",
      },
    },
    {
      world: "macragge",
      heading: "Macragge · The Plague Wars",
      date: "c. 012.M42",
      text: "Twelve years after the muster the primarch turns for Ultramar, the first phase of the reconquest done but not the Crusade itself. Mortarion's Plague Wars burn through the Five Hundred Worlds, and Guilliman breaks away to defend his realm.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
    {
      name: "The Attilan Gate",
      gx: 922,
      gy: 430,
      heading: "The Attilan Gate · Into Nihilus",
      date: "after the Plague Wars",
      text: "With the Nachmund Gauntlet embattled, Guilliman forces an unstable second passage into Imperium Nihilus near the Pit of Raukos. Cawl remains behind to stabilise the Attilan Gate while the Lord Commander crosses the dark half.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
      placement: {
        precision: "relative",
        note: "The gate is explicitly near Attila in Ultima Segmentum and beside the Pit of Raukos; this offset from the charted Attila pin expresses that relationship, not an exact aperture coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Attilan_Gate",
      },
    },
    {
      world: "baal",
      heading: "Baal · Regent of Nihilus",
      date: "after the Plague Wars",
      text: "Guilliman reaches Baal after the Plague Wars to find Hive Fleet Leviathan broken and Ka'Bandha's sigil laid out in Tyranid skulls upon Baal Prime. He brings Primaris reinforcements and names Commander Dante Regent of Imperium Nihilus.",
      source: "https://wh40k.lexicanum.com/wiki/Devastation_of_Baal",
    },
  ],
  lbl: { x: 590, y: 505, t: "INDOMITUS" },
};
