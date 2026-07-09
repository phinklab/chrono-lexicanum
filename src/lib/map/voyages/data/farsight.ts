/**
 * Farsight · The Bladed Path (M41) — the T'au Empire's greatest commander
 * and its Great Traitor, told inside the tight eastern cluster the chart
 * carries: a deliberately intimate journey (the tour zooms deep) against
 * the galaxy-spanning Imperial epics.
 *
 * Research notes: the chart's `moloch` (Dead World, Ultima, gulf-ward rim
 * of T'au space) is treated as Arthas Moloch, verdict plausible with no
 * contradiction. Arkunasha (the war that named him) has no chart world and
 * no location row, so it rides the Dal'yth Damocles station as prose.
 * Puretide's tutelage was on Dal'yth's Mount Kan'ji, NOT the T'au
 * homeworld (station dropped as unsupported). The Great War of
 * Confederation was Shadowsun's war, Farsight sat it out in exile. The
 * Farsight Enclaves (826.M41, off-map east beyond the Gulf) ride Vior'la
 * as "The Colours Reversed": the Enclaves fly Vior'la's colours inverted,
 * so the journey closes its ring where it began. Dates follow the Farsight
 * Enclaves supplement timeline; the 6th-ed codex runs ~75 years earlier.
 * Dal'yth repeats (stations 2, 3). Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const FARSIGHT: Voyage = {
  id: "farsight",
  name: "Farsight · The Bladed Path",
  tag: "M41",
  blurb: "From the Code of Fire to the colonies that bear his name: the rise of the T'au Empire's Great Traitor.",
  stations: [
    {
      world: "viorla",
      heading: "Vior'la · The Code of Fire",
      date: "c. 711.M41",
      text: "Born to the hot-blooded sept, young Shoh memorises the Code of Fire end to end in the Mont'yr Battle Dome, deciphering even his instructors' secret battle ciphers. At his graduation the legendary Commander Puretide inspects the ceremony.",
      source: "https://wh40k.lexicanum.com/wiki/Commander_Farsight",
    },
    {
      world: "dalyth",
      heading: "Dal'yth · Mount Kan'ji",
      date: "731–733.M41",
      text: "Wounded into retirement, Commander Puretide spends his final years as a hermit on Mount Kan'ji. There Shovah endures the mountain's brutal slopes beside Kais and Shaserra, three disciples chosen to inherit one dying master's art of war.",
      source: "https://wh40k.lexicanum.com/wiki/Commander_Puretide",
    },
    {
      world: "dalyth",
      heading: "Dal'yth · The Damocles Gulf",
      date: "733–742.M41",
      text: "Nine years in Arkunasha's oxide wastes against Waaagh! Dok earn Shovah his name: Farsight, who reads the enemy before the enemy moves. When the Imperium crosses the Damocles Gulf he stalls its Titans in the woods of Gel'bryn until the Water Caste negotiates the withdrawal.",
      source: "https://wh40k.lexicanum.com/wiki/Arkunasha_War",
    },
    {
      world: "moloch",
      heading: "Arthas Moloch · The Dawn Blade",
      date: "c. 825.M41",
      text: "Hunting Orks beyond the Gulf, the expedition comes to a dead world of faceless statues. At the Great Star Dais the daemons emerge, every Ethereal in the fleet dies, and Shovah seals the portal with a blade found among the ruins: the Dawn Blade.",
      source: "https://wh40k.lexicanum.com/wiki/Arthas_Moloch",
    },
    {
      world: "viorla",
      heading: "Vior'la · The Colours Reversed",
      date: "826.M41",
      text: "Beyond the Damocles Gulf his renegade colonies take root, ruled from Vior'los without a single Ethereal, their livery Vior'la's colours reversed. Three centuries past a fire warrior's span, the Great Traitor leads The Eight still.",
      source: "https://wh40k.lexicanum.com/wiki/Farsight_Enclaves",
    },
    {
      world: "agrellan",
      heading: "Mu'gulath Bay · The Red Sun",
      date: "999.M41",
      text: "At Mu'gulath Bay the skies turn red: Farsight and The Eight fall upon the Imperial spearhead in a thunderous Mont'ka, fighting beside Shadowsun for the first time in centuries. When the Exterminatus fires come, he has already vanished toward T'lasa.",
      source: "https://wh40k.lexicanum.com/wiki/Second_Agrellan_Campaign",
    },
  ],
  lbl: { x: 866, y: 588, t: "THE BLADED PATH" },
};
