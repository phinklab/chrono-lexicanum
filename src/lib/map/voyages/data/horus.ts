/**
 * Horus · Rise and Ruin (M31). Starts where the Great Crusade voyage ends
 * (the Triumph of Ullanor) per maintainer call, 2026-07-09; the Cthonia
 * finding and the Terra decades belong to the Great Crusade's telling.
 * Supersedes the retired "Path of Heresy" course: its Davin → Istvaan III →
 * Istvaan V → Molech corridor keeps three hand-drawn legs as `leg.d`.
 *
 * Research notes: Xenobia (the Interex capital where Erebus stole the
 * anathame — off-chart) rides the Ullanor → Davin leg as a WAYPOINT.
 * Davin is c. 004.M31 (Isstvan III article: the fall came
 * "over a year before the battle"; the 001.M31 figure is off-wiki legacy).
 * Phall verified-dropped, Perturabo commanded the ambush in person. The
 * Dark Muster (Slaves to Darkness, after Trisolian) sits before the
 * Titandeath climax; Lexicanum internally disagrees on the exact
 * interleave. Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const HORUS: Voyage = {
  id: "horus",
  name: "Horus · Rise and Ruin",
  tag: "M31",
  blurb: "The rise and ruin of the Warmaster, from the Triumph of Ullanor to the burning sky of Terra.",
  stations: [
    {
      world: "armageddon",
      heading: "Ullanor · The Triumph",
      date: "000.M31",
      text: "The greenskin empire is broken; Horus hurls Overlord Urlakk Urg from his own tower. On a granite road five kilometres wide the Legions parade in their millions. The Emperor names Horus Warmaster, and turns for home.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Crusade",
    },
    {
      via: 0.45,
      name: "Xenobia",
      heading: "Xenobia · The Stolen Blade",
      date: "c. 003.M31",
      text: "Peace with the Interex dies in a single night: from the Hall of Devices Erebus steals the kinebrach anathame, and the Warmaster's embassy ends in fire. The blade is already meant for him.",
      source: "https://wh40k.lexicanum.com/wiki/Anathame",
    },
    {
      world: "davin",
      heading: "Davin · The Fall",
      date: "c. 004.M31",
      text: "Sixty years after its compliance the 63rd Expedition returns to Davin. On its plague moon Temba's stolen anathame bites where no wound may heal. In the Serpent Lodge the priests whisper the Warmaster to Chaos.",
      source: "https://wh40k.lexicanum.com/wiki/Davin",
    },
    {
      world: "istvaan-iii",
      heading: "Istvaan III · The Purge",
      date: "005–006.M31",
      text: "Horus sends the loyal sons of four Legions down to the Choral City, then the virus bombs fall. Twelve billion die in a single breath, their death-scream louder than the Astronomican. The Heresy is begun.",
      source: "https://wh40k.lexicanum.com/wiki/Isstvan_III_Atrocity",
      // Hand-drawn leg from the retired Path of Heresy course.
      leg: { d: "M 544.3 419.6 C 535 330, 515 215, 496 161" },
    },
    {
      world: "istvaan-v",
      heading: "Istvaan V · The Dropsite Massacre",
      date: "006.M31",
      text: "Seven Legions descend to bring the Warmaster to justice; four are already his. A single flare rises from the command post, the order to illuminate them, and the trap closes. Ferrus Manus's head is laid at the Warmaster's feet.",
      source: "https://wh40k.lexicanum.com/wiki/Drop_Site_Massacre",
      leg: { d: "M 496 161 L 490 155" },
    },
    {
      world: "molech",
      heading: "Molech · The Warp Gate",
      date: "009.M31",
      text: "Horus walks the Fulgurine Path in the Emperor's own footsteps and passes through the gate. Moments go by in the Materium and an eternity within. What returns is aged, god-empowered, and greater than any primarch.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Molech",
      leg: { d: "M 490 155 C 497 196, 500 232, 500 269.2" },
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Dark Muster",
      date: "c. 012.M31",
      text: "Woken from his death-coma by Maloghurst's sacrificed life, Horus summons the traitor primarchs to the old triumph-grounds. Lorgar is beaten into exile, a tenth of the slaves are given to the Four, and the order goes out at last: Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Horus_Lupercal",
    },
    {
      world: "beta-garmon-iv",
      heading: "Beta-Garmon · Titandeath",
      date: "012–013.M31",
      text: "The Titandeath: a thousand god-engines burn on the irradiated plains. At Caldera Primus Horus leads the Legio Mortis in person and topples the Carthega Telepathica upon its defenders. The gate to the Solar System stands open.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Beta-Garmon",
    },
    {
      world: "luna",
      heading: "Luna · The Solar War",
      date: "013–014.M31",
      text: "A ritual aboard The Comet tears the warp open above Luna, and tens of thousands of warships spill through, the Vengeful Spirit at their head and Horus enthroned in Lupercal's Court. The defences of Sol collapse.",
      source: "https://wh40k.lexicanum.com/wiki/Siege_of_Terra",
    },
    {
      world: "terra",
      heading: "Terra · Rise and Ruin",
      date: "014.M31",
      text: "Two hundred days of siege, and Sanguinius lies dead before the skull of Ferrus Manus. Horus lowers his shields to bait his father aboard, and the Emperor unmakes his soul with a shard of the very blade that cut him on Davin.",
      source: "https://wh40k.lexicanum.com/wiki/Siege_of_Terra",
    },
  ],
  lbl: { x: 552, y: 300, t: "VIA HORUS" },
};
