/**
 * The Great Crusade (M30–M31) — the Imperium's two-hundred-year reconquest,
 * told in full: launch, first compliance, and the rediscovery of every lost
 * primarch in the canonical Black Library order (Lexicanum "Primarch"
 * discovery table = Fandom "Primarchs" list, identical), framed by the
 * conquest of Sol and the Council of Nikaea epilogue.
 *
 * Ullanor rides the `armageddon` pin (the stripped world was later
 * recolonized as Armageddon); Alpharius' rediscovery world is canonically
 * unknown and rides `terra` as "The Final Son", the act text carrying both
 * accounts (revealed to Horus in deep space vs. found first on Terra, per
 * "Alpharius: Head of the Hydra"). The two Lost Primarchs (II at 821.M30,
 * XI at 927.M30 in the timeline) have no worlds or regions — they use
 * explicitly schematic chart points, two uncertain marks in the dark between
 * their brothers.
 * Luna and Mars predate the formal launch and are intentionally presented
 * as its Sol-system prologue. Sedna is placed beside Sol because its campaign
 * completed the liberation of that system. Gorro's sources agree on the
 * event but not a precise date, so
 * it sits late M30
 * before Ullanor without a false year. Magnus' 840.M30 is the official
 * timeline number; Lexicanum flags it may date first psychic contact.
 * Sanguinius landed on Baal Secundus and rides
 * the `baal` pin. Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const GREAT_CRUSADE: Voyage = {
  id: "great-crusade",
  name: "The Great Crusade",
  tag: "M30–M31",
  blurb: "Two hundred years of reconquest: Sol reclaimed, eighteen sons regained, and the first great fracture at Nikaea.",
  stations: [
    {
      world: "luna",
      heading: "Luna · The First Pacification",
      date: "c. 703.M30 · Prologue",
      text: "The Crusade's first battle is fought in Terra's own sky. The fanatical Selenar gene-cults submit, and Luna's ancient vats turn to a new work: the mass-raising of the Legiones Astartes.",
      source: "https://wh40k.lexicanum.com/wiki/First_Pacification_of_Luna",
    },
    {
      world: "mars",
      heading: "Mars · The Treaty of Olympus",
      date: "739.M30 · Prologue",
      text: "At Olympus Mons, the Emperor makes peace where conquest would bleed both worlds dry. The Treaty of Olympus binds the Mechanicum to his newborn Imperium, and the forges that will arm the Crusade ignite.",
      source: "https://wh40k.lexicanum.com/wiki/Treaty_of_Olympus",
    },
    {
      world: "terra",
      heading: "Terra · The Crusade Begins",
      date: "c. 798.M30",
      text: "The Unification is won and the warp storms are lifting. Twenty sons lie scattered in the dark, and the Great Crusade sets out from Terra to reclaim the stars and to find them.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Crusade",
    },
    {
      world: "cthonia",
      heading: "Cthonia · Horus",
      date: "801.M30",
      text: "On the mined-out gang-world of Cthonia the Emperor finds his first son. Horus alone campaigns at his father's side until Russ is recovered, learning conquest as the Great Crusade breaks beyond Sol.",
      source: "https://wh40k.lexicanum.com/wiki/Horus",
    },
    {
      name: "Sedna",
      gx: 326,
      gy: 409,
      heading: "Sedna · The Last Gate of Sol",
      date: "803.M30",
      text: "At Sol's outer dark, eight Legions assault a false world ruled by xenos. The enemy is erased by psychic means and Sedna falls silent, the last gate before the expedition fleets break into the wider galaxy.",
      source: "https://wh40k.lexicanum.com/wiki/Sedna_Campaign",
      placement: {
        precision: "relative",
        note: "The campaign is explicitly the final battle to liberate the Sol System; no orbit or surviving coordinates are given, so Sedna is plotted just beyond the Sol cluster.",
        source: "https://wh40k.lexicanum.com/wiki/Sedna_Campaign",
      },
    },
    {
      world: "fenris",
      heading: "Fenris · Leman Russ",
      date: "819.M30",
      text: "In the Wolf King's mead-hall the Emperor is out-eaten and out-drunk, then settles the third wager with a single blow of his power glove. Russ rises from the ice and swears the Sixth to his father.",
      source: "https://wh40k.lexicanum.com/wiki/Leman_Russ_(Primarch)",
    },
    {
      name: "The Second",
      gx: 288.1,
      gy: 228,
      heading: "The Second · Expunged",
      date: "821.M30",
      text: "Between the finding of the Wolf King and the Gorgon, a primarch is found whose name no record keeps. Of him and his Legion the Imperial archive says one thing only: expunged.",
      source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "The archive preserves a rediscovery date but no homeworld or region; this point only holds the Second's chronological place between Russ and Ferrus Manus.",
        source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      },
    },
    {
      world: "medusa",
      heading: "Medusa · Ferrus Manus",
      date: "824.M30",
      text: "The Gorgon, his hands sheathed in the living silver of the wyrm Asirnoth, tests the newcomer in a duel said to have laid waste to mountains. Finding his equal at last, Ferrus Manus takes up the Tenth.",
      source: "https://wh40k.lexicanum.com/wiki/Ferrus_Manus",
      breakBefore: true,
    },
    {
      world: "chemos",
      heading: "Chemos · Fulgrim",
      date: "830.M30",
      text: "On starving Chemos the Phoenician kneels without a word and offers up his sword. His Legion numbers barely two hundred, yet his oath so moves the Emperor that they alone may wear the aquila.",
      source: "https://wh40k.lexicanum.com/wiki/Fulgrim",
    },
    {
      world: "nocturne",
      heading: "Nocturne · Vulkan",
      date: "832.M30",
      text: "A pale stranger bests Vulkan in the drake-hunt, then hurls his greater kill into the lava to save his rival's life. To such a man the smith freely kneels, and the Outlander sheds his disguise.",
      source: "https://wh40k.lexicanum.com/wiki/Vulkan",
    },
    {
      world: "inwit",
      heading: "Inwit · Rogal Dorn",
      date: "835.M30",
      text: "Dorn comes to his father as a sovereign in his own right, greeting the Emperor at the helm of the reawakened Phalanx. The star-fortress is returned to the keeping of his truthful son.",
      source: "https://wh40k.lexicanum.com/wiki/Rogal_Dorn",
    },
    {
      world: "macragge",
      heading: "Macragge · Roboute Guilliman",
      date: "837.M30",
      text: "Tales of Konor's prodigy son reach the Emperor at Espandor, but a warp storm costs him five years. He lands to find Macragge already an empire in miniature, ordered, prosperous, and under arms.",
      source: "https://wh40k.lexicanum.com/wiki/Roboute_Guilliman",
    },
    {
      world: "prospero",
      heading: "Prospero · Magnus the Red",
      date: "c. 840.M30",
      text: "There is no trial and no wager on the sorcerers' world. The Emperor and the Crimson King embrace like old friends at first meeting, for in the warp their minds had known each other long before.",
      source: "https://wh40k.lexicanum.com/wiki/Magnus_the_Red",
    },
    {
      world: "baal",
      heading: "Baal · Sanguinius",
      date: "843.M30",
      text: "The winged lord of the Blood pierces his father's disguise at once, and alone among the sons asks what refusal would cost. Only when the Emperor swears to leave Baal's tribes in peace does the Angel kneel.",
      source: "https://wh40k.lexicanum.com/wiki/Sanguinius",
    },
    {
      world: "caliban",
      heading: "Caliban · Lion El'Jonson",
      date: "846.M30",
      text: "Scouts of the First Legion make landfall on a forest world scoured of its Great Beasts. The knight who led that crusade senses his father the instant the Emperor lands, and swears fealty without trial.",
      source: "https://wh40k.lexicanum.com/wiki/Lion_El%27Jonson",
    },
    {
      world: "olympia",
      heading: "Olympia · Perturabo",
      date: "849.M30",
      text: "The Tyrant of Lochos' brooding ward submits the moment the Emperor arrives, casting his foster court aside. Perturabo greets his new Legion with decimation: one warrior in ten, by his brothers' hands.",
      source: "https://wh40k.lexicanum.com/wiki/Perturabo",
    },
    {
      world: "barbarus",
      heading: "Barbarus · Mortarion",
      date: "854.M30",
      text: "The stranger's wager: take the last Overlord's mountain alone, or serve. In the poison fog the Reaper falls gasping short, and one sweep of the Emperor's sword fells Necare. Mortarion bends the knee.",
      source: "https://wh40k.lexicanum.com/wiki/Mortarion",
    },
    {
      world: "colchis",
      heading: "Colchis · Lorgar",
      date: "857.M30",
      text: "Lorgar's holy war has already remade Colchis for the golden king of his visions. When the Emperor descends beside Magnus, prophecy walks the temple road, and the world erupts in months of worship its new god never wanted.",
      source: "https://wh40k.lexicanum.com/wiki/Lorgar",
    },
    {
      world: "chogoris",
      heading: "Chogoris · Jaghatai Khan",
      date: "865.M30",
      text: "Six months after the Great Khan completes the conquest of the steppes, a greater conqueror descends. Before all his generals Jaghatai drops to one knee, for here at last is the one who will unite even the stars.",
      source: "https://wh40k.lexicanum.com/wiki/Jaghatai_Khan",
    },
    {
      world: "molech",
      heading: "Molech · The Sealed Gate",
      date: "869.M30",
      text: "Four primarchs bring the Knight world into compliance with the Emperor among them. Beneath Lupercalia lies the gate he entered long before; he leaves a garrison and erases the world's significance from Lion, Horus, Fulgrim and the Khan.",
      source: "https://wh40k.lexicanum.com/wiki/Molech",
    },
    {
      world: "nostramo",
      heading: "Nostramo · Konrad Curze",
      date: "896.M30",
      text: "Sunless Nostramo weeps, blinded by the Emperor's radiance. At his palace gate the pale king greets his father: \"That is not my name. I am Night Haunter, and I know full well what you intend for me.\"",
      source: "https://wh40k.lexicanum.com/wiki/Konrad_Curze",
    },
    {
      world: "nuceria",
      heading: "Nuceria · Angron",
      date: "899.M30",
      text: "Alone of the sons the gladiator-king refuses. As seven armies close upon his starving rebels, the Emperor tears Angron away by teleport, and from orbit the Red Angel watches his brothers-in-chains die.",
      source: "https://wh40k.lexicanum.com/wiki/Angron",
    },
    {
      world: "deliverance",
      heading: "Deliverance · Corvus Corax",
      date: "922.M30",
      text: "The Raven's slave-revolt drops one atomic charge on each of Kiavahr's five guild-cities, and the prison moon is renamed Deliverance. That same day the Emperor arrives, and father and son speak for a day and a night.",
      source: "https://wh40k.lexicanum.com/wiki/Corvus_Corax",
    },
    {
      name: "The Eleventh",
      gx: 335.6,
      gy: 564.6,
      heading: "The Eleventh · Expunged",
      date: "927.M30",
      text: "A second gap in the roll of the returned. Whatever world gave him up, whatever his Legion did or failed to do, the record ends the same way: all mention deleted from the Imperial archive.",
      source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Only the rediscovery date and its place in the sequence survive; the plotted position makes no claim about the Eleventh's erased homeworld.",
        source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      },
    },
    {
      world: "terra",
      heading: "Terra · The Final Son",
      date: "981.M30",
      text: "Officially the last: a nameless raider carves his way to the bridge of Horus' flagship and answers only \"I am Alpharius.\" Yet the Hydra whispers he was found first of all, on Terra itself, in secret.",
      source: "https://wh40k.lexicanum.com/wiki/Alpharius",
      breakBefore: true,
    },
    {
      name: "Gorro",
      gx: 400,
      gy: 298,
      heading: "Gorro · The Emperor's Peril",
      date: "late M30",
      text: "The Emperor and Horus descend into an ork scrapworld built around a stolen planetary core. A warboss closes one hand around the Emperor's throat; Horus hews the arm away, and Gorro tears itself apart around them.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gorro",
      placement: {
        precision: "relative",
        note: "Gorro is placed close to Ullanor because the source identifies it as a mobile scrapworld in the Telon Reach and a satrapy of the Ullanor empire; no exact coordinates survive.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gorro",
      },
    },
    {
      world: "armageddon",
      heading: "Ullanor · The Triumph",
      date: "000.M31",
      text: "Urlakk Urg hurled from his own tower, the greenskin empire breaks. Down a granite road lined with Ork skulls the Legions parade in their millions; Horus is named Warmaster, and the Emperor turns for home.",
      source: "https://wh40k.lexicanum.com/wiki/Ullanor_Crusade",
    },
    {
      world: "nikaea",
      heading: "Nikaea · The Council",
      date: "001.M31",
      text: "On a world still being born, the Emperor gathers the Legions' greatest voices to judge their Librarians. Magnus pleads for knowledge; Mortarion demands restraint. The decree falls: the Librarius must disband, and the son who knows the warp best swears an obedience he will break.",
      source: "https://wh40k.lexicanum.com/wiki/Council_of_Nikaea",
    },
  ],
  lbl: { x: 645, y: 565, t: "THE GREAT CRUSADE" },
};
