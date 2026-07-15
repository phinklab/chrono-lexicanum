/**
 * Horus · Rise and Ruin (M30–M31). A biographical route from Cthonia to
 * Terra, organised as Rise, Fall and Ruin. Repeated worlds are deliberate
 * mirrors: Davin seeds and completes the fall; Molech hides and restores the
 * gate; Ullanor hosts both triumph and dark muster; Terra receives the oath
 * and the final reckoning.
 *
 * Most world pins are identity anchors, not claims of exact M30/M31
 * coordinates. Ullanor rides the later `armageddon` pin even though the world
 * was moved long after the Heresy. Gorro, Sixty-Three Nineteen, Murder,
 * Xenobia Principis, Aureus, Dwell, the Trisolian System and Beta-Garmon III
 * therefore use disclosed chart points or disconnected segments wherever the
 * surviving record cannot support a continuous spatial course.
 * Sources per station in `source`.
 */

import type { Voyage } from "../types";

const SONS_OF_HORUS_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/71MXsCP4/legions-of-the-horus-heresy-the-sons-of-horus-are-the-real-first-legion/";
const ULLANOR_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/SOKSqkHC/the-horus-heresy-how-the-great-triumph-led-to-greater-tragedy/";
const DAVIN_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/OtgmU492/the-horus-heresy-how-davin-put-the-warmaster-on-the-path-to-heresy/";
const GORRO_SOURCE =
  "https://www.blacklibrary.com/the-horus-heresy/quick-reads/the-wolf-of-ash-and-fire.html";
const SIXTY_THREE_NINETEEN_SOURCE =
  "https://www.blacklibrary.com/downloads/product/pdf/h/horus-rising.pdf";
const DROPSITE_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/5b3wkzet/the-horus-heresy-the-tragic-tale-of-the-dropsite-massacre/";
const MANACHEA_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/c1n0bymf/pages-from-the-black-books-the-hour-of-the-warmaster/";
const TRISOLIAN_SOURCE =
  "https://assets.warhammer-community.com/horusheresy_exemplarybattles_thebattleoftrisolian_vengefulspirit_eng_24.09-frcwsgxbix.pdf";
const SOLAR_WAR_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/4u3q9eWF/the-end-and-the-death-volume-i-is-nearly-here-catch-up-on-the-siege-of-terra-so-far/";
const END_AND_DEATH_SOURCE =
  "https://www.blacklibrary.com/the-horus-heresy/featured/ebook-the-end-and-the-death-volume-iii-eng-2024.html";

const ULLANOR_PLACEMENT = {
  precision: "schematic" as const,
  note: "The Armageddon pin identifies Ullanor Prime, not its M31 coordinate. The Mechanicum moved the world long after the Heresy; its Great-Crusade-era position is not preserved.",
  source: "https://wh40k.lexicanum.com/wiki/Ullanor",
};

const DAVIN_PLACEMENT = {
  precision: "schematic" as const,
  note: "Davin is fixed to Ultima Segmentum, but no published sector or canonical galactic coordinate survives. The catalog pin is an identity anchor for both visits.",
  source: "https://wh40k.lexicanum.com/wiki/Davin",
};

const MOLECH_PLACEMENT = {
  precision: "schematic" as const,
  note: "Molech is a named world in Ultima Segmentum without a published sector or authoritative galactic coordinate. The catalog pin identifies the world rather than an exact position.",
  source: "https://wh40k.lexicanum.com/wiki/Molech",
};

export const HORUS: Voyage = {
  id: "horus",
  name: "Horus · Rise and Ruin",
  tag: "M30–M31",
  blurb: "The first-found son rises beside the Emperor, chooses damnation and carries the Heresy from Cthonia to Terra.",
  cartography: {
    label: "biographical chronicle",
    note: "The route follows Horus across two centuries, not one uninterrupted fleet track. Catalog pins identify known worlds; disclosed chart points and broken legs preserve the chronology where the record gives only a broad region, relative position or no position at all.",
  },
  sections: [
    { id: "rise", label: "RISE · THE FAVOURED SON", color: "#b49a68", start: 0 },
    { id: "fall", label: "FALL · THE WARMASTER", color: "#778477", start: 6 },
    { id: "ruin", label: "RUIN · THE ARCH-TRAITOR", color: "#9b4b45", start: 13 },
  ],
  stations: [
    {
      world: "cthonia",
      heading: "Cthonia · The Nameless Son",
      date: "801.M30 · official rediscovery",
      text: "On Cthonia, the gang-child Nergüi survives by taking the name Khaggedon. The Emperor officially recovers Horus as his first-found son; for decades they wage the Great Crusade side by side before Horus takes command of the Luna Wolves.",
      source: SONS_OF_HORUS_SOURCE,
      placement: {
        precision: "schematic",
        note: "Cthonia is canonically close to Sol in Segmentum Solar, but no authoritative galactic coordinate is published. The catalog pin identifies the destroyed home world rather than a precise location.",
        source: "https://wh40k.lexicanum.com/wiki/Cthonia",
      },
    },
    {
      world: "terra",
      heading: "Terra · The First Found",
      date: "c. 801.M30 · disputed account",
      text: "In Horus's own account he is brought from Cthonia to Terra and kneels before the Emperor. Other records contest the circumstances of that first reunion; what endures is the public truth that Horus becomes the first son restored to his father.",
      source: "https://wh40k.lexicanum.com/wiki/Horus",
    },
    {
      world: "molech",
      heading: "Molech · The Forgotten Gate",
      date: "869.M30",
      text: "Horus, the Lion, Fulgrim and the Khan bring Molech into compliance beside the Emperor. Beneath the new city of Lupercalia lies the gate their father once crossed; he leaves a garrison and erases the secret from his sons' memories.",
      source: "https://wh40k.lexicanum.com/wiki/Molech",
      placement: MOLECH_PLACEMENT,
    },
    {
      world: "davin",
      heading: "Davin · The First Seed",
      date: "945.M30 · secondary chronology",
      text: "The Luna Wolves and Word Bearers force Davin into compliance, and Eugen Temba is left as Imperial governor. The world's warrior lodges pass into the Legion: a seed planted sixty years before Horus returns to reap it.",
      source: DAVIN_SOURCE,
      placement: DAVIN_PLACEMENT,
    },
    {
      name: "Gorro",
      gx: 400,
      gy: 298,
      heading: "Gorro · The Debt Repaid",
      date: "late M30",
      text: "The Emperor once shielded Horus at Reillis. On the mobile scrap-world Gorro, Horus repays that debt by severing the Ork warlord's arm as it closes around his father; together they destroy the greenskin engine from within.",
      source: GORRO_SOURCE,
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "Gorro was a mobile scrap-world in the Telon Reach and a satrapy of the Ullanor empire. No exact coordinates survive, so this point records only its relative place near Ullanor.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gorro",
      },
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Triumph",
      date: "000.M31",
      text: "Horus and the Justaerin cast Overlord Urlakk Urg from his own tower and break the greenskin empire. At the Triumph the Emperor names Horus Warmaster, then leaves the Great Crusade in his favoured son's hands.",
      source: ULLANOR_SOURCE,
      breakBefore: true,
      placement: ULLANOR_PLACEMENT,
    },

    {
      name: "Sixty-Three Nineteen",
      gx: 449,
      gy: 327.4,
      heading: "Sixty-Three Nineteen · The False Emperor",
      date: "001.M31",
      text: "The 63rd Expedition finds a human Imperium that claims Terra as its throne. Sejanus dies beneath a white flag; Horus storms the palace himself and shoots the false Emperor from his golden throne.",
      source: SIXTY_THREE_NINETEEN_SOURCE,
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "The fleet reached the unnamed system after a warp-storm reroute and no galactic region is recorded. The point preserves the post-Ullanor sequence only.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Sixty-Three-Nineteen",
      },
    },
    {
      name: "Murder",
      gx: 485.5,
      gy: 352.5,
      heading: "Murder · The Spider War",
      date: "c. 001.M31",
      text: "The Blood Angels' first landing is devastated, and the Emperor's Children are already fighting when Horus and Sanguinius arrive with the Luna Wolves. Their combined assault breaks the megarachnids; the Interex then reveals that Murder was a prison world whose warning the Imperials mistook for a name.",
      source: "https://wh40k.lexicanum.com/wiki/Murder",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Murder is a quarantined Interex world, but the Interex realm has no published galactic position. This point records the expedition chronology without claiming a region.",
        source: "https://wh40k.lexicanum.com/wiki/Murder",
      },
    },
    {
      name: "Xenobia Principis",
      gx: 518.4,
      gy: 384.5,
      heading: "Xenobia Principis · The Stolen Blade",
      date: "c. 001–003.M31",
      text: "From the Hall of Devices, Erebus steals the kinebrach anathame. The theft turns Horus's embassy into a battle, destroys the chance of peace with the Interex and puts the weapon of his fall into traitor hands.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Xenobia_Principis",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Xenobia Principis belongs to the thirty-system Interex realm, whose sector and galactic region are not published. Its coordinate preserves narrative order only.",
        source: "https://wh40k.lexicanum.com/wiki/Interex",
      },
    },
    {
      world: "davin",
      heading: "Davin · The Fall",
      date: "c. 004.M31",
      text: "Sixty years after compliance, Horus returns to Davin and Temba wounds him with the stolen anathame on its moon. Erebus deceives him with false visions inside the Serpent Lodge; Magnus warns him, but Horus chooses the road that binds him to Chaos.",
      source: DAVIN_SOURCE,
      breakBefore: true,
      placement: DAVIN_PLACEMENT,
    },
    {
      name: "Aureus",
      gx: 523.8,
      gy: 277,
      heading: "Aureus · The Price of Treason",
      date: "c. 004–005.M31",
      text: "Horus murders the Auretian Technocracy's emissary and turns a false accusation into months of war against a human brother-culture. Two captured STC fragments become leverage in the bargain that secures the traitor Mechanicum.",
      source: "https://wh40k.lexicanum.com/wiki/Auretian_Technocracy_War",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Aureus is fixed only to the binary cluster Drakonis Three Eleven. No segmentum or sector is published, so this coordinate marks chronology rather than location.",
        source: "https://wh40k.lexicanum.com/wiki/Auretian_Technocracy",
      },
    },
    {
      world: "istvaan-iii",
      heading: "Isstvan III · The Purge",
      date: "005–006.M31",
      text: "Horus sends the loyal sons of four Legions to the Choral City, then unleashes the Life-Eater virus. Six billion die in the first strike; orbital fire and the ground war carry the atrocity's total toward twelve billion. The Heresy is open.",
      source: "https://wh40k.lexicanum.com/wiki/Isstvan_Atrocity",
      breakBefore: true,
    },
    {
      world: "istvaan-v",
      heading: "Isstvan V · The Dropsite Massacre",
      date: "006.M31",
      text: "Iron Hands, Salamanders and Raven Guard descend to bring Horus to justice; four Traitor Legions arrive behind them as the false second wave. A flare rises—the order to illuminate the loyalists—and the trap closes. Ferrus Manus's head is claimed by the Warmaster.",
      source: DROPSITE_SOURCE,
      leg: { d: "M 496 161 L 490 155" },
    },

    {
      world: "manachea",
      heading: "Manachea · Dark Compliance",
      date: "007.M31",
      text: "Horus personally opens the conquest of the Manachean Commonwealth and turns its industrial worlds into the first great domain of Dark Compliance. Conquest no longer serves the Imperium: it now feeds the Warmaster's independent war machine.",
      source: MANACHEA_SOURCE,
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Manachea lies in the Coronid Deeps near the Ultima–Obscurus border. The catalog point identifies that broad theatre, not a published system coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Manachean_War",
      },
    },
    {
      name: "Dwell",
      gx: 497.6,
      gy: 213.5,
      heading: "Dwell · The Snare",
      date: "008.M31",
      text: "Shadrak Meduson's Fire Raptors come within a heartbeat of killing Horus. The Warmaster survives, enters the Mausolytic Precinct and recovers the erased memory that draws him back to Molech.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Dwell",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Dwell has a named system and historical ties to Molech but no published galactic region. Its point records Horus's documented sequence without claiming proximity.",
        source: "https://wh40k.lexicanum.com/wiki/Dwell",
      },
    },
    {
      world: "molech",
      heading: "Molech · The Gate of Gods",
      date: "009.M31",
      text: "Horus follows the Emperor's path through the gate beneath Lupercalia. Moments pass outside and an eternity within; what returns is visibly aged and vastly empowered by the gods he believes he can master.",
      source: "https://www.blacklibrary.com/the-horus-heresy/novels/vengeful-spirit.html",
      breakBefore: true,
      placement: MOLECH_PLACEMENT,
    },
    {
      name: "Trisolian System",
      gx: 421.5,
      gy: 327.2,
      heading: "Trisolian System · The Wolf's Spear",
      date: "012.M31",
      text: "Above Trisolian A-4, Russ boards the Vengeful Spirit and drives the Emperor's spear into Horus. The weapon burns away the corruption for one clear instant, but Russ hesitates; Horus wounds him and carries the spear-strike onward to Beta-Garmon.",
      source: TRISOLIAN_SOURCE,
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "The Trisolian System is documented near Beta-Garmon, but its segmentum and exact coordinate are unknown. This point records only that relative relationship.",
        source: "https://wh40k.lexicanum.com/wiki/Trisolian_System",
      },
    },
    {
      name: "Beta-Garmon III",
      gx: 429.2,
      gy: 336,
      heading: "Beta-Garmon III · Titandeath",
      date: "012–013.M31",
      text: "In the final assault Horus leads the Sons of Horus and one hundred Titans of Legio Mortis onto Beta-Garmon III. Mortis pulls down the Carthega Telepathica, Russ's wound tears open again, and the road to Sol is bought with the wider campaign's billions of dead.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Beta-Garmon",
      placement: {
        precision: "relative",
        note: "Beta-Garmon III is identified within the Beta-Garmon system, but no separate planetary chart coordinate is published. The point is offset beside the catalog's Beta-Garmon IV system anchor; it is not orbital geometry.",
        source: "https://wh40k.lexicanum.com/wiki/Beta-Garmon_III",
      },
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Dark Muster",
      date: "c. 013.M31",
      text: "Before collapsing from Russ's reopened wound, Horus summons the Traitor hosts to the old triumph-ground. Maloghurst gives his life to restore him; Horus crushes Lorgar's challenge, casts him out and orders the final advance on Terra.",
      source: "https://www.blacklibrary.com/the-horus-heresy/novels/eb-horus-heresy-slaves-to-darkness.html",
      breakBefore: true,
      placement: ULLANOR_PLACEMENT,
    },
    {
      world: "luna",
      heading: "Luna · The Solar War",
      date: "014.M31",
      text: "A ritual upon the artificial comet called The Comet tears the warp open above Luna. Tens of thousands of Traitor warships spill into the inner system with the Vengeful Spirit at their head, and Sol's layered defences collapse.",
      source: SOLAR_WAR_SOURCE,
      breakBefore: true,
    },
    {
      world: "terra",
      heading: "Terra · The End and the Death",
      date: "014.M31",
      text: "After roughly two hundred days of siege, Horus kills Sanguinius before the skull of Ferrus Manus and lowers the Vengeful Spirit's shields. In the final duel he relinquishes the gods' stolen power for one fatal moment; the Emperor answers with a shard of the anathame that first wounded him.",
      source: END_AND_DEATH_SOURCE,
    },
  ],
  lbl: { x: 552, y: 300, t: "VIA HORUS" },
};
