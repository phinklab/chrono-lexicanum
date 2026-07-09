/**
 * Jaghatai · The Warhawk (M30–M31): the primarch who rode furthest, from
 * the steppes of Chogoris to the Siege of Terra and then out of the known
 * galaxy entirely.
 *
 * Research notes: the Alaxxes Nebula is folded into the Prospero station
 * WITH correction (the White Scars never fought there; the Khan declined
 * Russ's distress call and made for Prospero, where loyalty was decided).
 * The Dark Glass / Catullus Rift rides the Prospero → Terra leg as a
 * WAYPOINT; Corusil V (the webway gate, 084.M31 per Fandom, Codex-derived)
 * stays folded into the closing Chogoris station — it falls between two
 * visits to the same world, so there is no leg to ride. The Mortarion
 * duel follows Warhawk: decapitation, banishment, the Khan dead by every
 * mortal measure and called back by the Emperor. Chogoris repeats four
 * times across the arc. Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const KHAN: Voyage = {
  id: "khan",
  name: "Jaghatai · The Warhawk",
  tag: "M30–M31",
  blurb: "The primarch who rode furthest: from the steppes of Chogoris to Terra, and out of the known stars.",
  stations: [
    {
      world: "chogoris",
      heading: "Chogoris · The Finding",
      date: "865.M30",
      text: "The conquest of the steppes was six months old when the Emperor descended. Before all his assembled generals the Great Khan sank to one knee at Quan Zhou, pledging the plains, and the stars above them, to his father.",
      source: "https://wh40k.lexicanum.com/wiki/Jaghatai_Khan",
    },
    {
      world: "chogoris",
      heading: "Chogoris · The Blooding",
      date: "875.M30",
      text: "For ten years he summoned his scattered Legion home. At the muster called the Blooding, fifty thousand warriors took up ritual knives, cut the white scar into their flesh, and rose again with Chogorian names.",
      source: "https://wh40k.lexicanum.com/wiki/White_Scars",
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Triumph",
      date: "000.M31",
      text: "On the citadel above the granite road the Khan stood among the honoured, watching eight million soldiers pass as the Emperor named Horus Warmaster. He marked the change in his brother, and said little.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Crusade",
    },
    {
      world: "chondax",
      heading: "Chondax · The Long Hunt",
      date: "001–007.M31",
      text: "Seven years the ordu hunted orks across the white worlds of Chondax while unseen hands prolonged the war. When word of betrayal came, the Khan broke the Alpha Legion blockade in the fleet formation named the chisel.",
      source: "https://wh40k.lexicanum.com/wiki/Chondax_Campaign",
    },
    {
      world: "prospero",
      heading: "Prospero · The Judgement",
      date: "007.M31",
      text: "He came to the ash of Tizca seeking truth from ruin. When the shade of Magnus urged him to choose, the Khan shattered it with his tulwar, duelled Mortarion amid the dust, and declared for Terra. Russ had called from the Alaxxes cloud; the Warhawk rode here instead.",
      source: "https://wh40k.lexicanum.com/wiki/Scars_(Novel)",
    },
    {
      via: 0.55,
      name: "The Dark Glass",
      heading: "The Dark Glass · Catullus Rift",
      date: "c. 011.M31",
      text: "Four years of running battle bleed the Legion to half its strength. At a broken star-fort beyond the Catullus Rift, Yesugei gives his life to open the webway, and the Khan cuts down a Keeper of Secrets to hold the door.",
      source: "https://wh40k.lexicanum.com/wiki/Dark_Glass",
    },
    {
      world: "terra",
      heading: "Terra · The Path of Heaven",
      date: "c. 011.M31",
      text: "Out of the webway's shadow the ordu bursts into the Solar System, the last loyal Legion home. Dorn sets the White Scars on the walls of the Palace, to wait for a siege the Khan would rather ride out to meet.",
      source: "https://wh40k.lexicanum.com/wiki/The_Path_of_Heaven_(Novel)",
    },
    {
      world: "terra",
      heading: "Terra · The Walls",
      date: "014.M31",
      text: "Forbidden the open field, he rode out regardless. From the Eternity Wall his jetbikes swept the trenches, forty Death Guard fell to his blade, and a warp-tainted wound taught him illness for the first time in his life. Sanguinius bore him back.",
      source: "https://wh40k.lexicanum.com/wiki/Jaghatai_Khan",
    },
    {
      world: "terra",
      heading: "Terra · Lion's Gate",
      date: "014.M31",
      text: "At the spaceport he met Mortarion remade in plague. Impaled on the scythe called Silence, the Khan dragged himself along its blade and struck the Death Lord's head from his shoulders. Dead by every mortal measure, he was called back by his father's hand.",
      source: "https://wh40k.lexicanum.com/wiki/Warhawk_(Novel)",
    },
    {
      world: "chogoris",
      heading: "Chogoris · The Homecoming",
      date: "c. 015.M31",
      text: "At the Council of Reconstruction his ruined throat gave three words only: build later, hunt now. Then the Khan rode home to the Scouring's wars, and found the plains of Chogoris scarred by Drukhari slavers.",
      source: "https://wh40k.lexicanum.com/wiki/Jaghatai_Khan",
    },
    {
      world: "chogoris",
      heading: "Chogoris · Into the Webway",
      date: "084.M31",
      text: "Seventy years more he warred on. In pursuit of the Drukhari archon whose kabal had raided his homeworld, the Khan passed through a webway gate at Corusil V and rode out of the known galaxy. His sons wait still, certain he hunts there yet.",
      source: "https://wh40k.lexicanum.com/wiki/Jaghatai_Khan",
    },
  ],
  lbl: { x: 560, y: 432, t: "THE WARHAWK" },
};
