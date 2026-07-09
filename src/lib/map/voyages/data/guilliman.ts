/**
 * Guilliman · Lord of Ultramar (M30–M42): the longest arc on the chart.
 * Finding on Macragge, Monarchia's rebuke, Ullanor, the Heresy (Calth,
 * Nuceria, Imperium Secundus, the Pharos), the Avenging Son's late arrival
 * at Terra, the wounding and ten thousand years of stasis, the Terran
 * Crusade home through Luna, and the Plague Wars (Espandor, Parmenio, Iax).
 *
 * Thessala (the wounding, 121.M31) has NO canonical location anywhere (a
 * gas giant; "Thessala orbit" is all the sources give; the pursuit came
 * from equally unlocated Xolco) — it rides the Terra → Macragge leg as a
 * WAYPOINT instead of an invented pin. Verified-dropped: Vigilus
 * (commanded from afar;
 * his own route ran through the Attilan Gate) and Gathalamor (Achallor's
 * Custodes, not Guilliman in person). The Ullanor act claims only the
 * Crusade role; the Triumph dais list does not include him. Monarchia date
 * derived (~963.M30); Imperium Secundus 009–014.M31 per Lexicanum.
 * Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const GUILLIMAN: Voyage = {
  id: "guilliman",
  name: "Guilliman · Lord of Ultramar",
  tag: "M30–M42",
  blurb: "From the finding at Hera's Falls to the Plague Wars: ten thousand years in the service of one Imperium.",
  stations: [
    {
      world: "macragge",
      heading: "Macragge · The Finding",
      date: "late M30",
      text: "Konor's riders find a glowing child at Hera's Falls. When the Emperor's ships at last make Macragge, five years delayed by warp-storm, the foundling already rules as sole Consul over a realm prosperous, armed and just.",
      source: "https://wh40k.lexicanum.com/wiki/Roboute_Guilliman",
    },
    {
      world: "khur",
      heading: "Monarchia · The Rebuke",
      date: "c. 963.M30",
      text: "At the Emperor's command the XIII Legion razes Monarchia, the Perfect City, to ash. In its ruins Guilliman stands beside his father as the whole Word Bearers Legion kneels for rebuke, an obedience that plants a hatred decades deep.",
      source: "https://wh40k.lexicanum.com/wiki/Monarchia",
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Crusade's Height",
      date: "000.M31",
      text: "While the Luna Wolves storm Urlakk Urg's fortress, Guilliman's Ultramarines retake the outlying worlds of the ork empire. At the Triumph that follows, the Emperor names Horus Warmaster and departs for Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Crusade",
    },
    {
      world: "calth",
      heading: "Calth · The Betrayal",
      date: "007.M31",
      text: "The Word Bearers fall upon the muster at Calth. Blown into the void, Guilliman fights on without a helm, retakes his bridge, and tears one heart from Kor Phaeron's chest while his sons wage the Underworld War below.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Calth",
    },
    {
      world: "nuceria",
      heading: "Nuceria · The Ruinstorm",
      date: "c. 008.M31",
      text: "Pursuing Lorgar to Angron's homeworld, Guilliman duels one brother and is broken by the other. As he watches, Lorgar's ritual splits the sky: the Ruinstorm descends, and Angron ascends to daemonhood atop a mound of dead sons.",
      source: "https://wh40k.lexicanum.com/wiki/Shadow_Crusade",
    },
    {
      world: "macragge",
      heading: "Macragge · Imperium Secundus",
      date: "009.M31",
      text: "Cut off by the Ruinstorm and fearing Terra lost, Guilliman raises a second Imperium at Macragge, yet refuses its crown. Sanguinius is proclaimed Imperator Regis; Guilliman serves as Lord Warden until the empire he built is dissolved as heresy.",
      source: "https://wh40k.lexicanum.com/wiki/Imperium_Secundus",
    },
    {
      world: "sotha",
      heading: "Sotha · The Pharos",
      date: "c. 009.M31",
      text: "The xenos beacon beneath Mount Pharos is the lighthouse of Imperium Secundus; once it carried Guilliman himself out of Curze's death-trap. When the Night Lords come for it, Dantioch dies overloading the machine, its last light guiding the relief fleet in.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Sotha",
    },
    {
      world: "terra",
      heading: "Terra · The Avenging Son",
      date: "014.M31",
      text: "The Astronomican rekindled, Guilliman's three thousand ships reach Terra in the wake of Horus's defeat. History names him the Avenging Son, come too late. He takes up the Lord Commandership of the Imperium and sets down the Codex Astartes.",
      source: "https://wh40k.lexicanum.com/wiki/Roboute_Guilliman",
    },
    {
      via: 0.45,
      name: "Thessala",
      heading: "Thessala · The Wounding",
      date: "121.M31",
      text: "The Scouring's long hunt for Fulgrim ends in ambush over an uncharted gas giant: three traitor fleets pin the loyalists above Thessala, and the Phoenician's venomed blade opens his brother's throat. The survivors run for home with a dying primarch.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Thessala",
    },
    {
      world: "macragge",
      heading: "Macragge · The Resurrection",
      date: "121.M31 → 999.M41",
      text: "Carried home neither dead nor living, Guilliman lies ten thousand years in stasis within the Temple of Correction. In 999.M41 Cawl's Armour of Fate and Yvraine, herald of Ynnead, call him back to a Macragge under Black Legion guns.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Thessala",
    },
    {
      world: "luna",
      heading: "Luna · Return to Sol",
      date: "c. 999.M41",
      text: "The Terran Crusade limps home through the webway, out of Fateweaver's crystal chains, onto the grey craters of Luna. There Magnus bars the way, until the Sisters of Silence null his sorcery and Guilliman's blade takes the Crimson King through the back.",
      source: "https://wh40k.lexicanum.com/wiki/Terran_Crusade",
    },
    {
      world: "terra",
      heading: "Terra · The Throne",
      date: "c. 999.M41",
      text: "Alone past the Eternity Gate, Guilliman stands before the Golden Throne, and the Emperor wakes for the first time in millennia. Minutes pass within; a full day passes without. He emerges Lord Commander once more and calls the Indomitus Crusade.",
      source: "https://wh40k.lexicanum.com/wiki/Terran_Crusade",
    },
    {
      world: "espandor",
      heading: "Espandor · Spear of Espandor",
      date: "c. 012.M42",
      text: "The Plague Wars burn through Ultramar. On Espandor, where the Emperor first heard the name of Konor's son, Guilliman's counterstrike severs Mortarion's line to the Scourge Stars, and the Emperor's Sword fells the Great Unclean One Qaramar.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
    {
      world: "parmenio",
      heading: "Parmenio · The Trap",
      date: "c. 012.M42",
      text: "On the Plains of Hecatone the greatest armour battle of the Plague Wars grinds out, and a trap closes: Mortarion, Typhus and Ku'Gath together. Cornered, Guilliman is saved by a nameless girl burning with the Emperor's light.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
    {
      world: "iax",
      heading: "Iax · Godblight",
      date: "c. 012.M42",
      text: "Mortarion pins his brother to the blighted soil of Iax and pours the Godblight into him, a phage brewed to kill a primarch. Guilliman dies. Then his father's power floods through him, scorching Nurgle's own Garden, and Mortarion flees.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
  ],
  lbl: { x: 720, y: 660, t: "LORD OF ULTRAMAR" },
};
