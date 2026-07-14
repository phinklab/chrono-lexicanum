/**
 * Horus · Rise and Ruin (M31). Starts where the Great Crusade voyage ends
 * (the Triumph of Ullanor) per maintainer call, 2026-07-09; the Cthonia
 * finding and the Terra decades belong to the Great Crusade's telling.
 * Supersedes the retired "Path of Heresy" course: its Davin → Istvaan III →
 * Istvaan V → Molech corridor keeps three hand-drawn legs as `leg.d`.
 *
 * Research notes: Sixty-Three Nineteen, Murder, Xenobia (the Interex capital
 * where Erebus stole the anathame), Aureus and Dwell have no canonical chart
 * coordinates. They use sourced schematic chart points whose cards disclose
 * that limitation; their chronology supplies the route order.
 * Davin is c. 004.M31 (Isstvan III article: the fall came
 * "over a year before the battle"; the 001.M31 figure is off-wiki legacy).
 * Phall verified-dropped, Perturabo commanded the ambush in person. The
 * Beta-Garmon precedes the Dark Muster: Horus' wound reopens during the
 * battle and he orders the Ullanor summons before falling into his coma.
 * Sources per station in `source`.
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
      name: "Sixty-Three Nineteen",
      gx: 449,
      gy: 327.4,
      heading: "Sixty-Three Nineteen · The False Emperor",
      date: "001.M31",
      text: "The 63rd Expedition finds a human Imperium that claims Terra as its throne. Sejanus dies beneath a white flag; Horus storms the palace himself and shoots the false Emperor from his golden throne.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_63-19",
      placement: {
        precision: "schematic",
        note: "The fleet reached the unnamed system by an accidental warp-storm reroute and no galactic region is recorded; the point preserves the post-Ullanor sequence only.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Sixty-Three-Nineteen",
      },
    },
    {
      name: "Murder",
      gx: 485.5,
      gy: 352.5,
      heading: "Murder · The Spider War",
      date: "c. 001.M31",
      text: "For six months the Blood Angels and Luna Wolves bleed against the megarachnids beneath Murder's screaming trees. Victory brings the Interex, and the revelation that this death world was a prison whose warning the Imperials mistook for a name.",
      source: "https://wh40k.lexicanum.com/wiki/Murder",
      placement: {
        precision: "schematic",
        note: "Murder is identified as a quarantined Interex frontier world but the Interex realm has no published galactic position; placement follows the expedition chronology.",
        source: "https://wh40k.lexicanum.com/wiki/Murder",
      },
    },
    {
      name: "Xenobia",
      gx: 518.4,
      gy: 384.5,
      heading: "Xenobia · The Stolen Blade",
      date: "c. 003.M31",
      text: "Peace with the Interex dies in a single night: from the Hall of Devices Erebus steals the kinebrach anathame, and the Warmaster's embassy ends in fire. The blade is already meant for him.",
      source: "https://wh40k.lexicanum.com/wiki/Anathame",
      placement: {
        precision: "schematic",
        note: "Xenobia is an Interex frontier world, but neither its sector nor the civilisation's galactic region is fixed; it is placed after Murder as the narrative records.",
        source: "https://wh40k.lexicanum.com/wiki/Xenobia",
      },
    },
    {
      world: "davin",
      heading: "Davin · The Fall",
      date: "c. 004.M31",
      text: "Sixty years after its compliance the 63rd Expedition returns to Davin. On its plague moon Temba's stolen anathame bites where no wound may heal. In the Serpent Lodge the priests whisper the Warmaster to Chaos.",
      source: "https://wh40k.lexicanum.com/wiki/Davin",
    },
    {
      name: "Aureus",
      gx: 523.8,
      gy: 277,
      heading: "Aureus · The Price of Treason",
      date: "c. 004–005.M31",
      text: "Horus murders the Auretian Technocracy's emissary and spends ten months grinding a human brother-culture into ruin. Its two Standard Template Constructs become the price that buys him the traitor Mechanicum's allegiance.",
      source: "https://wh40k.lexicanum.com/wiki/Auretian_Technocracy_War",
      placement: {
        precision: "schematic",
        note: "Aureus is fixed only to the binary cluster Drakonis Three Eleven; no segmentum or sector is given, so its coordinate marks the campaign between Davin and Isstvan.",
        source: "https://wh40k.lexicanum.com/wiki/Auretian_Technocracy",
      },
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
      name: "Dwell",
      gx: 497.6,
      gy: 213.5,
      heading: "Dwell · The Snare",
      date: "008.M31",
      text: "Shadrak Meduson springs an Iron Hands trap and comes within a heartbeat of killing the Warmaster. Horus survives the burning Fire Raptors, then tears the world's memory-vault open and finds the secret that draws him to Molech.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Dwell",
      placement: {
        precision: "schematic",
        note: "Dwell has a named system and historical ties to Molech but no published galactic region; it is placed on Horus's documented road from Isstvan to Molech without claiming proximity.",
        source: "https://wh40k.lexicanum.com/wiki/Dwell",
      },
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
      world: "trisolian",
      heading: "Trisolian · The Wolf's Spear",
      date: "012.M31",
      text: "Russ boards the Vengeful Spirit and drives the Emperor's spear into his brother. For one clear instant the gods' hold breaks and Horus sees what he has become, but the Wolf King hesitates; the Warmaster mauls him and later falls into a death-coma from the wound.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Trisolian",
    },
    {
      world: "beta-garmon-iv",
      heading: "Beta-Garmon · Titandeath",
      date: "012–013.M31",
      text: "The Titandeath: a thousand god-engines burn on the irradiated plains. At Caldera Primus Horus leads the Legio Mortis in person and topples the Carthega Telepathica upon its defenders. The gate to the Solar System stands open.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Beta-Garmon",
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Dark Muster",
      date: "c. 013.M31",
      text: "After Beta-Garmon reopens Russ's wound, Horus orders the traitor primarchs to the old triumph-grounds before falling into a death-coma. Maloghurst sacrifices his life to wake him; Lorgar is beaten into exile, and the order goes out at last: Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Prime",
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
