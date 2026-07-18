/**
 * Guilliman · Lord of Ultramar (M30–M42): a 24-act biographical route from
 * Konor's Macragge to the regency of Imperium Nihilus. It follows the Great
 * Crusade through Thoas and Ullanor, the Heresy road from Calth through the
 * Ruinstorm, the Scouring and ten millennia of stasis, the Terran and
 * Indomitus Crusades, the Plague Wars, and the crossing to Baal.
 *
 * Unknown or transformed locations remain chronology rather than invented
 * cartography. Thoas and Thessala are isolated schematic points. Ullanor uses
 * the later Armageddon identity pin, Pyrrhan is schematic, Davin has no
 * canonical galactic coordinate, Anuari is a system anchor, and the Maelstrom
 * pin represents a region rather than Fateweaver's fortress. The Pit of
 * Raukos and Attilan Gate reuse the sourced relative placements from the
 * Indomitus journey. Sources per station in `source`.
 */

import type { Voyage } from "../types";

const ULTRAMARINES_SOURCE =
  "https://assets.warhammer-community.com/eng_25-06_warhammer_the_horus_heresy_black_book_extract_the_ultramarines-yg3hegvy9l-n7b03kqqmb.pdf";
const MONARCHIA_SOURCE =
  "https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf";
const LORD_OF_ULTRAMAR_SOURCE =
  "https://www.blacklibrary.com/the-horus-heresy/hh-prim/roboute-guilliman-ebook.html";
const KNOW_NO_FEAR_SOURCE =
  "https://www.blacklibrary.com/popular-characters/popular-roboute-guiliman/know-no-fear-ebook.html";
const BETRAYER_SOURCE = "https://www.blacklibrary.com/all-products/betrayer-ebook.html";
const SECUNDUS_SOURCE =
  "https://assets.warhammer-community.com/eng_21-05_thehorusheresy_black_book_extract_wars_of_retribution-ipomkciqqc-abdtmwmheo.pdf";
const PHAROS_SOURCE = "https://www.blacklibrary.com/all-products/pharos-ebook.html";
const RUINSTORM_SOURCE =
  "https://www.blacklibrary.com/popular-characters/popular-roboute-guiliman/ruinstorm-ebook.html";
const RESURRECTION_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/1BHx3iuB/5-times-the-imperium-would-have-been-doomed-without-roboute-guilliman/";
const TERRAN_CRUSADE_SOURCE = "https://wh40k.lexicanum.com/wiki/Terran_Crusade";
const PLAGUE_WARS_SOURCE = "https://wh40k.lexicanum.com/wiki/Plague_Wars";
const GODBLIGHT_SOURCE =
  "https://www.blacklibrary.com/warhammer-40000/novels/dark-imperium-godblight-ebook-2021.html";
const ARCHMAGOS_SOURCE =
  "https://www.blacklibrary.com/warhammer-40000/novels/ebook-belisarius-cawl-archmagos-eng-2025.html";
const BAAL_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/dGrgtwDO/the-legendary-commander-dante-crosses-the-rubicon-primaris/";

const ULLANOR_PLACEMENT = {
  precision: "schematic" as const,
  note: "The Armageddon pin identifies Ullanor Prime, not its M31 coordinate. The Mechanicum moved the world long after the Heresy; its Great-Crusade-era position is not preserved.",
  source: "https://wh40k.lexicanum.com/wiki/Ullanor",
};

const DAVIN_PLACEMENT = {
  precision: "schematic" as const,
  note: "Davin is fixed to Ultima Segmentum, but no published sector or canonical galactic coordinate survives. The catalog pin is an identity anchor for this visit.",
  source: "https://wh40k.lexicanum.com/wiki/Davin",
};

const RAUKOS_PLACEMENT = {
  precision: "relative" as const,
  note: "The Pit has no published sector coordinate, but later sources place it beside the Attilan Gate near charted Attila in Ultima. The local offset expresses that relation, not an exact system position.",
  source: "https://wh40k.lexicanum.com/wiki/Pit_of_Raukos",
};

const ATTILAN_GATE_PLACEMENT = {
  precision: "relative" as const,
  note: "The gate is explicitly near Attila in Ultima Segmentum and beside the Pit of Raukos. This offset expresses that relationship, not an exact aperture coordinate or historical control claim.",
  source: "https://wh40k.lexicanum.com/wiki/Attilan_Gate",
};

export const GUILLIMAN: Voyage = {
  id: "guilliman",
  name: "Guilliman · Lord of Ultramar",
  tag: "M30–M42",
  mapState: "pre",
  blurb: "From Konor's Macragge through the Ruinstorm and the Great Rift to Baal: ten thousand years spent building, losing and reclaiming the realm of mankind.",
  stations: [
    {
      world: "macragge",
      heading: "Macragge · The Son of Konor",
      date: "before 837.M30 → 837.M30",
      text: "Konor's riders find the child at Hera's Falls. After Gallan's coup kills his foster father, Guilliman returns from Illyrium, takes Macragge as sole Consul and builds the young Ultramar; in 837.M30 the Emperor arrives five warp-delayed years after first hearing his name on Espandor.",
      source: ULTRAMARINES_SOURCE,
    },
    {
      world: "khur",
      heading: "Monarchia · The Rebuke",
      date: "963.M30",
      text: "At the Emperor's command the XIII Legion razes Monarchia, the Perfect City, to ash. In its ruins the assembled Word Bearers are forced to kneel before their father's censure, an obedience that plants a hatred decades deep.",
      source: MONARCHIA_SOURCE,
    },
    {
      name: "Thoas",
      gx: 280,
      gy: 215,
      heading: "Thoas · The Price of Memory",
      date: "after 963.M30",
      text: "At the end of a twelve-system war, Guilliman leads twelve Chapters into the mountain ruins of a pre-Imperial human civilisation on Ork-held Thoas. He first forbids destroyer weapons to preserve its history, then orders the ruins razed when he judges their civil-war memory unfit for the future.",
      source: LORD_OF_ULTRAMAR_SOURCE,
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Thoas has no published sector or galactic coordinate. This isolated point preserves only its sourced place after Monarchia in Guilliman's Great-Crusade chronology, not a physical route.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Thoas",
      },
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Crusade's Height",
      date: "000.M31",
      text: "While the Luna Wolves storm Urlakk Urg's fortress, Guilliman's Ultramarines retake the outlying worlds of the Ork empire. At the Triumph that follows, the Emperor names Horus Warmaster and departs for Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Crusade",
      breakBefore: true,
      placement: ULLANOR_PLACEMENT,
    },
    {
      world: "calth",
      heading: "Calth · The Betrayal",
      date: "007.M31",
      mapState: "hh",
      text: "The Word Bearers fall upon the muster at Calth. Blown into the void, Guilliman fights on without a helm, retakes his bridge and tears one heart from Kor Phaeron's chest, while survivors below begin the long Underworld War.",
      source: KNOW_NO_FEAR_SOURCE,
      breakBefore: true,
    },
    {
      world: "nuceria",
      heading: "Nuceria · The Ruinstorm",
      date: "007–008.M31",
      text: "Pursuing Lorgar to Angron's homeworld, Guilliman duels one brother and is broken by the other. As he watches, Lorgar's ritual splits the sky: the Ruinstorm descends, and Angron ascends to daemonhood atop a mound of dead sons.",
      source: BETRAYER_SOURCE,
    },
    {
      world: "macragge",
      heading: "Macragge · Imperium Secundus",
      date: "009–010.M31 · disputed",
      text: "Cut off by the Ruinstorm and fearing Terra lost, Guilliman raises a second Imperium at Macragge, yet refuses its crown. Sanguinius is proclaimed Imperator Regis; Guilliman serves as Lord Warden of the realm he built as a contingency.",
      source: SECUNDUS_SOURCE,
    },
    {
      world: "sotha",
      heading: "Sotha · Dantioch's Last Light",
      date: "M31 · during Secundus",
      text: "The xenos beacon beneath Mount Pharos is the lighthouse of Imperium Secundus; once it carried Guilliman himself out of Curze's death-trap. When the Night Lords attack, Dantioch dies overloading the machine, its last light guiding Guilliman's relief fleet in.",
      source: PHAROS_SOURCE,
    },
    {
      world: "anuari",
      heading: "Anuari · The Broken Ambush",
      date: "M31 · after Secundus",
      text: "With Secundus dissolved and Terra proven alive, Guilliman leaves Macragge with Sanguinius and the Lion. Cut off with one cruiser beside the Samothrace, he breaks a three-sided ambush, kills Toc Derenoth and two athame-bearing apostles, and captures the Navigators who can cross the Ruinstorm.",
      source: RUINSTORM_SOURCE,
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "The catalog pin identifies the Anuari forge world as a system anchor. Guilliman's personal action occurs in orbit aboard the Samothrace, not on the world's surface; no orbital coordinate is claimed.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Anuari",
      },
    },
    {
      name: "Pyrrhan",
      gx: 717.1,
      gy: 495.6,
      heading: "Pyrrhan · The Daemon Wall",
      date: "M31 · Ruinstorm",
      text: "A daemon fortress the size of a solar system seals every road to Terra. On Pyrrhan below, Guilliman drives Ultramarine phalanxes across continent-wide forges until Sanguinius destroys their heart and the world collapses with the wall above it.",
      source: "https://wh40k.lexicanum.com/wiki/Harrowing_of_Pyrrhan",
      placement: {
        precision: "schematic",
        note: "The source fixes Pyrrhan only in the narrative sequence after Anuari and before Davin; it gives no sector, bearing or realspace corridor. The coordinate carries chronology, not a recoverable location.",
        source: "https://wh40k.lexicanum.com/wiki/Harrowing_of_Pyrrhan",
      },
    },
    {
      world: "davin",
      heading: "Davin · The World Where It Began",
      date: "c. 011.M31",
      text: "The three brothers return to the world where Horus fell and find it sealed inside a shell of bones. Guilliman and the Lion break a Soul Grinder together, then cyclonic torpedoes shatter Davin and tear a narrow road through the Ruinstorm.",
      source: "https://wh40k.lexicanum.com/wiki/Second_Battle_of_Davin",
      placement: DAVIN_PLACEMENT,
    },
    {
      world: "terra",
      heading: "Terra · The Avenging Son",
      date: "014.M31",
      text: "The Astronomican rekindled, more than three thousand ships under Guilliman reach Terra just after Horus's defeat. The Avenging Son is too late to save his father, but joins the Grand Council of Reconstruction and takes up the Lord Commandership of the shattered Imperium.",
      source: "https://wh40k.lexicanum.com/wiki/Roboute_Guilliman",
    },
    {
      name: "Thessala",
      gx: 565.7,
      gy: 549.6,
      heading: "Thessala · The Wounding",
      date: "121.M31",
      text: "The Scouring's long hunt ends in Fulgrim's ambush in orbit above Thessala. The Phoenician's poisoned blade opens his brother's throat; the few survivors escape with a dying primarch.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Thessala",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Published accounts identify only Thessala orbit and give no sector or galactic coordinate. The isolated point is arranged for legibility and chronology, not as a location claim.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Thessala",
      },
    },
    {
      world: "macragge",
      heading: "Macragge · The Resurrection",
      date: "121.M31 → 999.M41",
      mapState: "now",
      text: "Carried home neither dead nor living, Guilliman lies ten thousand years in stasis within the Temple of Correction. In 999.M41 Cawl's Armour of Fate and Yvraine's rites call him back to a Macragge under Black Legion guns.",
      source: RESURRECTION_SOURCE,
      breakBefore: true,
    },
    {
      world: "the-maelstrom",
      heading: "The Maelstrom · Fateweaver's Chains",
      date: "c. 999.M41",
      text: "Magnus casts the Terran Crusade into the Maelstrom, where Kairos Fateweaver cages Guilliman inside a crystal fortress. Cypher and the Harlequins break the prison and lead the survivors into the webway, one impossible passage from Sol.",
      source: TERRAN_CRUSADE_SOURCE,
      placement: {
        precision: "schematic",
        note: "The Maelstrom pin marks the named warp region, not the unknown position of Fateweaver's Blackstone fortress within it. The stop identifies the episode without claiming a fortress coordinate.",
        source: TERRAN_CRUSADE_SOURCE,
      },
    },
    {
      world: "luna",
      heading: "Luna · Return to Sol",
      date: "c. 999.M41",
      text: "The Terran Crusade emerges from the webway onto the grey craters of Luna. There Magnus bars the way, until the Sisters of Silence null his sorcery and Guilliman's blade takes the Crimson King through the back.",
      source: TERRAN_CRUSADE_SOURCE,
      breakBefore: true,
    },
    {
      world: "terra",
      heading: "Terra · The Throne",
      date: "c. 999.M41",
      text: "Guilliman enters the Throne Room alone. A day passes outside; within, he remembers only a brief, agonising and fragmentary communion in which the Emperor seemed to wake. He emerges as Lord Commander and orders the Indomitus Crusade.",
      source: "https://wh40k.lexicanum.com/wiki/Roboute_Guilliman",
    },
    {
      world: "fenris",
      heading: "Fenris · The Kin-Pack",
      date: "early Indomitus Crusade",
      text: "Guilliman brings Greyshields of Russ's blood to the Fang and proposes that some join the Space Wolves while others form successors. Logan Grimnar answers with the Kin-Pack Declaration: every true son of the gene-line is a son of Russ, wherever he was forged.",
      source: "https://wh40k.lexicanum.com/wiki/Wolfspear",
      breakBefore: true,
    },
    {
      name: "The Pit of Raukos",
      gx: 900,
      gy: 440,
      heading: "The Pit of Raukos · The First Phase Ends",
      date: "c. 012.M42 · revised chronology",
      text: "Guilliman crushes the Chaos fleet around the Pit of Raukos and ends the first phase of the Indomitus Crusade. He disperses the Unnumbered Sons; five hundred survivors of Russ's line become the Wolfspear and remain to guard the rift.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Raukos",
      breakBefore: true,
      placement: RAUKOS_PLACEMENT,
    },
    {
      world: "espandor",
      heading: "Espandor · Spear of Espandor",
      date: "c. 012.M42 · revised chronology",
      text: "The Plague Wars burn through Ultramar. On Espandor, where the Emperor first heard the name of Konor's son, Guilliman's counterstrike severs Mortarion's line to the Scourge Stars, and the Emperor's Sword fells the Great Unclean One Qaramar.",
      source: PLAGUE_WARS_SOURCE,
    },
    {
      world: "parmenio",
      heading: "Parmenio · The Trap",
      date: "c. 012.M42 · revised chronology",
      text: "The greatest armoured and Titan battle of the Plague Wars grinds across the Plains of Hecatone, and a trap closes: Mortarion, Typhus and Ku'Gath together. Cornered, Guilliman is saved by a nameless girl burning with the Emperor's light.",
      source: "https://www.blacklibrary.com/warhammer-40000/novels/dark-imperium-plague-war-ebook-2021.html",
    },
    {
      world: "iax",
      heading: "Iax · Godblight",
      date: "c. 012.M42 · revised chronology",
      text: "Mortarion pins his brother to the blighted soil of Iax and pours the Godblight into him, a phage brewed to kill a primarch. Guilliman appears to die. Then power he recognises as his father's floods through him, scorching Nurgle's own Garden, and Mortarion flees.",
      source: GODBLIGHT_SOURCE,
    },
    {
      name: "The Attilan Gate",
      gx: 922,
      gy: 430,
      heading: "The Attilan Gate · Into Nihilus",
      date: "after the Plague Wars",
      text: "With the Nachmund Gauntlet embattled, Guilliman crosses the unstable Attilan Gate into Imperium Nihilus near the Pit of Raukos. Cawl remains behind to stabilise the passage, leaving the Lord Commander isolated on the far side.",
      source: ARCHMAGOS_SOURCE,
      placement: ATTILAN_GATE_PLACEMENT,
    },
    {
      world: "baal",
      heading: "Baal · Regent of Nihilus",
      date: "after the Plague Wars",
      text: "After crossing the Great Rift, Guilliman reaches Baal in the wake of Leviathan with Primaris reinforcements and the means to rebuild. He names Dante Regent of Imperium Nihilus and charges him with holding together the sundered half of mankind.",
      source: BAAL_SOURCE,
    },
  ],
  lbl: { x: 720, y: 660, t: "LORD OF ULTRAMAR" },
};
