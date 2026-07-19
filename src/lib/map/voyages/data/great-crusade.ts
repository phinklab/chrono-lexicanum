/**
 * The Great Crusade (M30–M31) — the Imperium's two-hundred-year reconquest,
 * told as a curated chronicle: Unification prelude, Sol, the rediscovery of
 * every lost
 * primarch in the canonical Black Library order (Lexicanum "Primarch"
 * discovery table = Fandom "Primarchs" list, identical), framed by the
 * conquest of Sol, Monarchia and Nikaea, then a closing image of the eighteen
 * Legion paths whose detailed accounts continue in March of the Legions.
 *
 * Ullanor rides the `armageddon` pin as a world-identity anchor, not an M31
 * coordinate: Ullanor was teleported to the later Armageddon position long
 * after the Crusade. Alpharius' official rediscovery world is unknown and is
 * therefore a schematic point; the Terra account remains disclosed as the
 * Hydra's explicitly unreliable alternative. The two Lost Primarchs (II at
 * 821.M30, XI at 927.M30) also remain schematic, but muted lines now preserve
 * their chronological place instead of making the record visually jump.
 * Luna overlaps the unfinished Unification of Terra; Mars still predates the
 * formal expedition-fleet launch. Sedna is placed beside Sol because its
 * campaign completed the system's liberation while the outward Crusade was
 * already under way. Gorro sits late M30 without a false exact year. Magnus'
 * 840.M30 is the official timeline number and may mark psychic contact.
 * Sanguinius landed on Baal Secundus and rides
 * the `baal` pin. Sources per station in `source`.
 */

import type { Voyage, VoyageArmTarget } from "../types";

const SHIELD_SOURCE =
  "https://assets.warhammer-community.com/22-01_the_horus_heresy_black_book_extract_the_thramas_crusade-fwtcctcyvt-kspnxfwdz1.pdf";
const CHONDAX_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/9wh4zb5f/pages-from-the-black-books-the-betrayal-at-chondax/";
const LOYALIST_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/qbwgpft8/loyalist-lore-where-were-the-legiones-astartes-as-the-horus-heresy-broke-out/";
const ISSTVAN_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/5b3wkzet/the-horus-heresy-the-tragic-tale-of-the-dropsite-massacre/";
const CALTH_SOURCE =
  "https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf";

const SHIELD_WORLDS = {
  name: "Gordian League Shield Worlds",
  gx: 972,
  gy: 92,
  text: "Horus sent the First Legion beyond the galactic rim against the Gordian League, keeping the Lion occupied while the rebellion opened.",
  source: SHIELD_SOURCE,
  placement: {
    precision: "schematic",
    note: "The sources place the Shield Worlds in the black between galaxies but give no bearing. This upper-right off-chart terminus is a diagrammatic exit, not an eastern coordinate.",
    source: SHIELD_SOURCE,
  },
  label: { dx: -10, dy: -9, anchor: "end" },
} satisfies VoyageArmTarget;

const ISSTVAN_III = {
  world: "istvaan-iii",
  text: "Horus concentrated the loyalist elements of the Sons of Horus, Emperor's Children, World Eaters and Death Guard below, then answered the supposed compliance with virus fire and a purge.",
  source: ISSTVAN_SOURCE,
  label: { dx: 11, dy: 13, anchor: "start" },
} satisfies VoyageArmTarget;

const ISSTVAN_V = {
  world: "istvaan-v",
  text: "Iron Hands, Salamanders and Raven Guard formed the loyalist spearhead. Iron Warriors, Night Lords, Word Bearers and Alpha Legion arrived as the false second wave and closed the trap.",
  source: ISSTVAN_SOURCE,
  label: { dx: -11, dy: -9, anchor: "end" },
} satisfies VoyageArmTarget;

const CHONDAX = {
  world: "chondax",
  text: "The White Scars hunted Ullanor's Ork remnants here. Alpha Legion interference prolonged the war, obscured the rebellion and blockaded their departure; Prospero, warp storms and Traitor-held routes then broke the road to Terra.",
  source: CHONDAX_SOURCE,
  placement: {
    precision: "schematic",
    note: "Chondax is a named system without a published sector or canonical galactic coordinate. The existing catalog point remains only as an identity anchor.",
    source: "https://wh40k.lexicanum.com/wiki/Chondax",
  },
  label: { dx: 11, dy: -8, anchor: "start" },
} satisfies VoyageArmTarget;

const PROSPERO = {
  world: "prospero",
  text: "Russ came under the Emperor's censure order, which Horus manipulated toward destruction; the Thousand Sons were already on their home world when the trap closed.",
  source: LOYALIST_SOURCE,
  label: { dx: 11, dy: 13, anchor: "start" },
} satisfies VoyageArmTarget;

const TERRA = {
  world: "terra",
  text: "The Emperor had recalled Dorn and the Imperial Fists to Terra. Their defence was an answer to Horus' web, not one of his deployments.",
  source: LOYALIST_SOURCE,
  label: { dx: -10, dy: -8, anchor: "end" },
} satisfies VoyageArmTarget;

const SIGNUS = {
  world: "signus-prime",
  text: "Horus sent the Blood Angels to a supposed compliance campaign at Signus, where the daemonic trap was intended to corrupt or destroy Sanguinius and his Legion.",
  source: LOYALIST_SOURCE,
  label: { dx: -12, dy: -8, anchor: "end" },
} satisfies VoyageArmTarget;

const CALTH = {
  world: "calth",
  text: "Horus ordered the XIII and XVII Legions to a joint muster for a projected campaign. The Word Bearers used the concentration to launch a prepared assault and cripple Ultramar.",
  source: CALTH_SOURCE,
  label: { dx: -10, dy: -9, anchor: "end" },
} satisfies VoyageArmTarget;

export const GREAT_CRUSADE: Voyage = {
  id: "great-crusade",
  name: "The Great Crusade",
  tag: "M30–M31",
  mapState: "pre",
  blurb: "From Terra's Unification to a Crusade spanning the stars: twenty rediscoveries, a triumph already cracking, and the road to civil war.",
  continuation: {
    id: "warmasters-web",
    label: "MARCH OF THE LEGIONS · HORUS HERESY",
  },
  cartography: {
    label: "curated chronicle",
    note: "The rediscovery roll follows the official chronology. Schematic points preserve erased or unlocated events; the final coloured arms show opening-Heresy dispositions, not simultaneous fleet tracks or eighteen orders issued at Ullanor.",
  },
  stations: [
    {
      world: "terra",
      heading: "Terra · The Wars of Unification",
      date: "late M29–c. 703.M30 · Prelude",
      text: "Before the stars, the Emperor breaks the techno-barbarian kingdoms of Old Earth and forges the first armies of the Imperium. Terra is largely won when the assault on Luna begins, though the last Unification wars will grind on until about 712.M30.",
      source: "https://wh40k.lexicanum.com/wiki/Unification_Wars",
    },
    {
      world: "luna",
      heading: "Luna · The First Pacification",
      date: "c. 703.M30 · Unification overlap",
      text: "The first great off-world campaign is fought in Terra's own sky while Unification still smoulders below. The Selenar gene-cults submit, and Luna's ancient vats turn to a new work: the mass-raising of the Legiones Astartes.",
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
      heading: "Terra · The Expedition Fleets",
      date: "c. 798.M30",
      text: "The Unification is won, Mars is bound by treaty and the warp storms are lifting. Numbered expedition fleets now leave Terra in force to reclaim the human worlds of Old Night and find the Emperor's scattered sons.",
      source: "https://wh40k.lexicanum.com/wiki/Great_Crusade",
    },
    {
      world: "cthonia",
      heading: "Cthonia · Horus",
      date: "801.M30",
      text: "In the official roll, the Emperor finds his first son on the mined-out gang-world of Cthonia. Horus alone campaigns at his father's side until Russ is recovered, learning conquest as the Great Crusade breaks beyond Sol.",
      source: "https://wh40k.lexicanum.com/wiki/Horus",
    },
    {
      name: "Sedna",
      gx: 326,
      gy: 409,
      heading: "Sedna · The Last Front in Sol",
      date: "803.M30",
      text: "At Sol's outer dark, eight Legions assault a false world ruled by xenos. The enemy is erased by psychic means and Sedna falls silent: the last surviving front inside the Solar System, even as expedition fleets already push into the wider galaxy.",
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
      name: "Primarch II",
      gx: 288.1,
      gy: 228,
      heading: "Expunged Primarch Found",
      date: "821.M30",
      text: "A rediscovery survives here only as a date. The primarch's name, homeworld, deeds and fate have all been purged from the Imperial archive.",
      source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      leg: { color: "#77746d", opacity: 0.56 },
      placement: {
        precision: "schematic",
        note: "The archive preserves a rediscovery date but no homeworld or region; this schematic point claims only a place in the surviving chronology.",
        source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      },
    },
    {
      world: "medusa",
      heading: "Medusa · Ferrus Manus",
      date: "824.M30",
      text: "The Gorgon, his hands sheathed in the living silver of the wyrm Asirnoth, tests the newcomer in a duel said to have laid waste to mountains. Finding his equal at last, Ferrus Manus takes up the Tenth.",
      source: "https://wh40k.lexicanum.com/wiki/Ferrus_Manus",
      leg: { color: "#77746d", opacity: 0.56 },
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
      date: "c. 840.M30 · contact date disputed",
      text: "There is no trial and no wager on the sorcerers' world. The Emperor and the Crimson King embrace like old friends, for their minds had met in the warp long before; the traditional 840.M30 date may preserve that earlier contact rather than the physical reunion.",
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
      name: "Primarch XI",
      gx: 335.6,
      gy: 564.6,
      heading: "Expunged Primarch Found",
      date: "927.M30",
      text: "Another rediscovery survives only as a date. The primarch's name, homeworld, deeds and fate have all been purged from the Imperial archive.",
      source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      leg: { color: "#77746d", opacity: 0.56 },
      placement: {
        precision: "schematic",
        note: "The archive preserves a rediscovery date but no homeworld or region; this schematic point claims only a place in the surviving chronology.",
        source: "https://wh40k.lexicanum.com/wiki/Lost_Primarchs",
      },
    },
    {
      world: "khur",
      heading: "Khur · The Ashes of Monarchia",
      date: "963.M30",
      text: "The Emperor sends Malcador and Guilliman to raze Lorgar's perfect city. The Word Bearers are forced to kneel in Monarchia's ashes, and the Crusade's triumph becomes the humiliation from which its first deliberate treason grows.",
      source: "https://assets.warhammer-community.com/eng_02-07_thehorusheresy_black_book_extract_war_at_calth-gbygwoxmir-udskkmgxjr.pdf",
      leg: { color: "#77746d", opacity: 0.56 },
    },
    {
      name: "Uncharted Space",
      gx: 448,
      gy: 332,
      heading: "Uncharted Space · Alpharius",
      date: "981.M30",
      text: "In the official final rediscovery, a nameless raider carves his way to the bridge of the Vengeful Spirit and answers only \"I am Alpharius.\" The Hydra's own account instead places him first on Terra, then warns that every record lies.",
      source: "https://wh40k.lexicanum.com/wiki/Alpharius",
      placement: {
        precision: "schematic",
        note: "The public encounter occurs aboard Horus' flagship in an unnamed system; this point preserves the twentieth place in the roll and deliberately does not promote the disputed Terra account to a coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Alpharius",
      },
    },
    {
      name: "Gorro",
      gx: 400,
      gy: 298,
      heading: "Gorro · The Emperor's Peril",
      date: "late M30",
      text: "The Emperor and Horus descend into an ork scrapworld built around a stolen planetary core. A warboss closes one hand around the Emperor's throat; Horus hews the arm away, and Gorro tears itself apart around them.",
      source: "https://www.blacklibrary.com/the-horus-heresy/quick-reads/the-wolf-of-ash-and-fire.html",
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
      placement: {
        precision: "schematic",
        note: "The Armageddon pin identifies Ullanor Prime itself, not its Great-Crusade-era coordinate: the Mechanicum teleported the world to Segmentum Solar long afterward, where it was renamed Armageddon.",
        source: "https://wh40k.lexicanum.com/wiki/Ullanor",
      },
    },
    {
      world: "nikaea",
      heading: "Nikaea · The Council",
      date: "001.M31",
      text: "On a world still being born, the Emperor gathers the Legions' greatest voices to judge their Librarians. Magnus pleads for knowledge; Mortarion demands restraint. The Librarius is ordered to disband, opening another fault line even as the Crusade continues under its new Warmaster.",
      source: "https://wh40k.lexicanum.com/wiki/Council_of_Nikaea",
    },
    {
      world: "armageddon",
      heading: "The Great Crusade Ends",
      date: "004.M31 · Threshold",
      text: "The routes of conquest fracture into eighteen Legion paths. The worlds at their ends no longer belong to the Great Crusade, but to the opening moves of the Horus Heresy.",
      source: "https://www.warhammer-community.com/en-gb/articles/w3jmtzfv/traitor-lore-how-the-trap-was-set/",
      breakBefore: true,
      arms: [
        {
          legion: "I",
          name: "Dark Angels",
          color: "#66727a",
          opacity: 0.92,
          role: "DIRECT DIVERSION",
          text: "Horus used the Warmaster's authority to send the Lion against the distant Gordian League. The Shield Worlds campaign left one of his most dangerous loyal brothers beyond the galactic rim when the rebellion opened.",
          target: SHIELD_WORLDS,
          bow: 42,
          source: SHIELD_SOURCE,
        },
        {
          legion: "III",
          name: "Emperor's Children",
          color: "#9653a6",
          opacity: 0.92,
          role: "LOYALISTS PURGED",
          text: "Fulgrim marked the Emperor's Children's loyal companies for the first planetary wave. Tarvitz's warning saved some from the virus strike, but the Legion then turned its guns on its own sons.",
          target: ISSTVAN_III,
          bow: -36,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "IV",
          name: "Iron Warriors",
          color: "#929899",
          opacity: 0.76,
          role: "FALSE SECOND WAVE",
          text: "Perturabo brought the Iron Warriors as supposed reinforcements to Dorn's Retribution Fleet. At the signal they sealed the Urgall Depression and bombarded the trapped loyalists.",
          target: ISSTVAN_V,
          bow: -28,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "V",
          name: "White Scars",
          color: "#e6dfca",
          opacity: 0.92,
          role: "ISOLATED CAMPAIGN",
          text: "After Ullanor, the Khan's gathered hordes were committed to hunting Ork remnants at Chondax. Alpha Legion interference kept the Legion uninformed and blockaded as the Heresy broke.",
          target: CHONDAX,
          bow: 18,
          source: CHONDAX_SOURCE,
        },
        {
          legion: "VI",
          name: "Space Wolves",
          color: "#7890a2",
          opacity: 0.66,
          role: "MANIPULATED CENSURE",
          text: "Russ was ordered by the Emperor to bring Magnus to account. Horus poisoned the mission into a punitive assault that devastated Prospero and drove the Thousand Sons toward his cause.",
          target: PROSPERO,
          bow: -15,
          source: LOYALIST_SOURCE,
        },
        {
          legion: "VII",
          name: "Imperial Fists",
          color: "#d4a62d",
          opacity: 0.58,
          role: "LOYALIST DEFENCE",
          text: "Dorn had returned with the Emperor to fortify Terra and later organised the response to Isstvan. The Imperial Fists' line is a loyal counter-move, not a Warmaster deployment.",
          target: TERRA,
          bow: -20,
          source: LOYALIST_SOURCE,
        },
        {
          legion: "VIII",
          name: "Night Lords",
          color: "#3d587f",
          opacity: 0.76,
          role: "FALSE SECOND WAVE",
          text: "Curze's Night Lords entered the Isstvan V reserve as apparent relief. They opened fire behind the first wave and joined the massacre.",
          target: ISSTVAN_V,
          bow: -20,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "IX",
          name: "Blood Angels",
          color: "#b82d35",
          opacity: 0.92,
          role: "DAEMONIC TRAP",
          text: "Horus ordered Sanguinius to Signus under the cover of a compliance campaign. Erebus and Ka'Bandha turned the system into a trap meant to break or corrupt the Blood Angels.",
          target: SIGNUS,
          bow: 55,
          source: LOYALIST_SOURCE,
        },
        {
          legion: "X",
          name: "Iron Hands",
          color: "#586768",
          opacity: 0.58,
          role: "LOYALIST SPEARHEAD",
          text: "Ferrus Manus drove the Iron Hands into the first assault on Horus' positions. His fury at Fulgrim helped pull the Legion into the prepared killing ground.",
          target: ISSTVAN_V,
          bow: -12,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XII",
          name: "World Eaters",
          color: "#4d7fa8",
          opacity: 0.92,
          role: "LOYALISTS PURGED",
          text: "Angron selected loyal World Eaters for the descent to Isstvan III. After the virus strike failed to finish them, he led the traitor ground assault himself.",
          target: ISSTVAN_III,
          bow: -4,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XIII",
          name: "Ultramarines",
          color: "#3f6fc0",
          opacity: 0.92,
          role: "AMBUSHED MUSTER",
          text: "Guilliman obeyed Horus' order to gather at Calth for a projected joint campaign with the Word Bearers. The muster concentrated the XIII Legion for Lorgar's surprise attack.",
          target: CALTH,
          bow: -24,
          source: CALTH_SOURCE,
        },
        {
          legion: "XIV",
          name: "Death Guard",
          color: "#879064",
          opacity: 0.92,
          role: "LOYALISTS PURGED",
          text: "Mortarion sent the Death Guard elements he judged loyal to the Emperor into the first wave. Garro's escape aboard the Eisenstein carried warning of the betrayal to Terra.",
          target: ISSTVAN_III,
          bow: 4,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XV",
          name: "Thousand Sons",
          color: "#bd4439",
          opacity: 0.66,
          role: "TARGETED AT HOME",
          text: "The Thousand Sons were not dispatched by Horus: Prospero was their home. Horus redirected the censure force toward annihilation, turning Magnus' isolation into a trap.",
          target: PROSPERO,
          bow: 15,
          source: LOYALIST_SOURCE,
        },
        {
          legion: "XVI",
          name: "Sons of Horus",
          color: "#47877d",
          opacity: 0.92,
          role: "LOYALISTS PURGED",
          text: "Horus used Isstvan III to strip loyalist companies from his own Legion. Loken, Torgaddon and their brothers were sent below to be erased with the other marked sons.",
          target: ISSTVAN_III,
          bow: 12,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XVII",
          name: "Word Bearers",
          color: "#8b3342",
          opacity: 0.92,
          role: "AMBUSH TO AMBUSH",
          text: "The Word Bearers first formed part of the false second wave at Isstvan V. They then sailed to the Calth muster as apparent allies, carrying Lorgar's prepared war into Ultramar.",
          via: [{ target: ISSTVAN_V, bow: -4 }],
          target: CALTH,
          bow: 24,
          source: CALTH_SOURCE,
        },
        {
          legion: "XVIII",
          name: "Salamanders",
          color: "#438d5c",
          opacity: 0.58,
          role: "LOYALIST SPEARHEAD",
          text: "Vulkan and the Salamanders answered Dorn's call and entered the first assault. The supposed relief wave trapped and shattered them on the dropsite.",
          target: ISSTVAN_V,
          bow: 20,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XIX",
          name: "Raven Guard",
          color: "#747b80",
          opacity: 0.58,
          role: "LOYALIST SPEARHEAD",
          text: "Corax and the Raven Guard joined the loyalist first wave. When the reserve Legions revealed themselves, the XIX Legion was almost annihilated in the encirclement.",
          target: ISSTVAN_V,
          bow: 28,
          source: ISSTVAN_SOURCE,
        },
        {
          legion: "XX",
          name: "Alpha Legion",
          color: "#339a9c",
          opacity: 0.76,
          role: "FALSE SECOND WAVE",
          text: "The Alpha Legion entered the reserve as apparent loyalists. At Horus' signal they turned on the exposed first wave and completed the encirclement.",
          target: ISSTVAN_V,
          bow: 36,
          source: ISSTVAN_SOURCE,
        },
      ],
    },
  ],
  lbl: { x: 645, y: 565, t: "THE GREAT CRUSADE" },
};
