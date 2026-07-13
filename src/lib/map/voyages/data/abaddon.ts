/**
 * Abaddon's Long War, explicitly told at fleet scale: all thirteen Black
 * Crusades belong to the route even where surviving accounts name only his
 * Legion, ships or commanders. Cards distinguish personal, orbital and
 * fleet-wide action; regional/system pins never masquerade as a surface
 * visit. Maeleum is omitted because Abaddon was absent when it fell.
 */

import type { Voyage } from "../types";

export const ABADDON: Voyage = {
  id: "abaddon",
  name: "Abaddon · The Long War",
  tag: "M31–M42",
  blurb: "The Warmaster and the war fleets of the Black Legion turn thirteen crusades into one ten-thousand-year war.",
  stations: [
    {
      world: "eye-of-terror",
      heading: "Eleusinian Veil · The Exile",
      date: "late M31",
      text: "At the edge of the Eleusinian Veil, the Vengeful Spirit drifts in silence while its captain searches the Warp for meaning. Falkus Kibre and Iskandar Khayon find Abaddon there and bring him the summons that will end his exile.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
    },
    {
      via: 0.5,
      name: "Harmony",
      heading: "Harmony · A Legion Reborn",
      date: "late M31",
      text: "Canticle City burns, the Emperor's Children break and Abaddon destroys Fabius Bile's clone of Horus with the Talon of Horus. Above Harmony, the victors cast their old Legion names aside and raise the black standard.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
    },
    {
      world: "cadia",
      heading: "Cadian Gate · The First Black Crusade",
      date: "781.M31",
      text: "At the Cadian Gate, Abaddon boards the Eternal Crusader and meets Sigismund blade to blade. He kills the ancient champion only after taking a wound that nearly ends the Long War at its beginning.",
      source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
    },
    {
      world: "uralan",
      heading: "Uralan · The First Sword",
      date: "781.M31",
      text: "Beneath Uralan, the Despoiler enters the Tower of Silence and faces the thing bound within. He emerges carrying Drach'nyen, the daemon blade that will open the Imperium for him.",
      source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
    },
    {
      world: "belis-corona",
      heading: "Belis Corona · The Curse",
      date: "597.M32",
      text: "While Black Legion fleets feint against the naval yards, Abaddon lands upon the system's outermost moon. There his sorcerers lay a curse whose purpose will remain hidden for millennia.",
      source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
    },
    {
      via: 0.5,
      name: "Gerstahl",
      heading: "Gerstahl · The Saint Broken",
      date: "909.M32",
      text: "The Third Black Crusade is a Cadian diversion masking Abaddon's true blow. On Gerstahl he destroys the shrine and remains of the Imperial saint, turning a holy name into ash.",
      source: "https://wh40k.lexicanum.com/wiki/Saint_Gerstahl",
    },
    {
      world: "elphanor",
      heading: "El'Phanor · The Citadel Falls",
      date: "001.M34",
      text: "Abaddon leads the Fourth Crusade against the Kromarch's citadel. Drach'nyen splits gates that had never opened, and the dynasty and its great monolith vanish together.",
      source: "https://wh40k.lexicanum.com/wiki/4th_Black_Crusade",
    },
    {
      via: 0.34,
      name: "Tarinth",
      heading: "Tarinth · Ten Million Souls",
      date: "723.M36",
      text: "In Kasyr Lutien, Abaddon burns a city and offers ten million souls to the Warp. The sacrifice calls the ancient daemon prince Doombreed into the Fifth Crusade.",
      source: "https://wh40k.lexicanum.com/wiki/Fifth_Black_Crusade",
    },
    {
      via: 0.68,
      name: "Arkreath",
      heading: "Arkreath · The Sons of the Eye",
      date: "901.M36",
      text: "The Sixth Crusade conquers the forge world Arkreath and ends with Drecarth impaled by Abaddon's hand. The defeated warlord's warriors survive as the Sons of the Eye, absorbed into the Black Legion.",
      source: "https://wh40k.lexicanum.com/wiki/6th_Black_Crusade",
    },
    {
      world: "mackan",
      heading: "Mackan · The Gene-Seed Harvest",
      date: "811.M37",
      text: "Abaddon descends on Mackan for the Blood Angels' legacy, killing Captain Acrion before the defenders' Death Company drives his warriors back. The Black Legion leaves with stolen gene-seed—the harvest the Seventh Crusade came to claim.",
      source: "https://wh40k.lexicanum.com/wiki/7th_Black_Crusade",
    },
    {
      via: 0.34,
      name: "Rithcarn",
      heading: "Rithcarn · The Skullgather",
      date: "999.M37",
      text: "At the climax of the Eighth Crusade, Abaddon's Legion turns Rithcarn into a ritual engine. Tech-Priests die inside their own machines while the Skullgather writes another occult design into the Long War.",
      source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
    },
    {
      via: 0.7,
      name: "Antecanis",
      heading: "Antecanis · Monarchive",
      date: "537.M38",
      text: "Abaddon storms Monarchive's innermost sanctuaries in person, then returns to orbit. Cyclonic torpedoes erase Antecanis behind him, revealing the true target of the Ninth Crusade too late.",
      source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
    },
    {
      world: "medusa",
      heading: "Medusa System · The Iron Cage Tested",
      date: "001.M39",
      text: "The Vengeful Spirit enters the Medusa System beside the Iron Warriors and watches them close a cage around the Iron Hands' home world. The siege fails, but the Tenth Crusade has tested an alliance Abaddon will use again.",
      source: "https://wh40k.lexicanum.com/wiki/10th_Black_Crusade",
    },
    {
      via: 0.5,
      name: "Relorria",
      heading: "Relorria · The Green Experiment",
      date: "301.M39",
      text: "A daemonic navigator scatters the Eleventh Crusade, and Abaddon looses the Black Legion upon the nearest world. Relorria's Orks become subjects for Warp experiments; thousands vanish into the Eye as the fleet withdraws.",
      source: "https://wh40k.lexicanum.com/wiki/11th_Black_Crusade",
    },
    {
      world: "purgatory",
      heading: "Purgatory · The Hand of Darkness",
      date: "c. 139.M41",
      text: "As the Twelfth Crusade's prelude, Abaddon's warbands overrun the remote station Purgatory and seize the Hand of Darkness. The stolen relic is one of two keys with which he will wake the Blackstone Fortresses.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
    },
    {
      world: "gothic-sector",
      heading: "Gothic Sector · The Blackstones",
      date: "142–160.M41",
      text: "The Gothic War engulfs a sector in hundreds of invasions and void battles. Abaddon's Planet Killer and awakened Blackstones destroy worlds and stars; when his armada retreats, two of the ancient fortresses go with it.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
    },
    {
      world: "cadia",
      heading: "Cadia · The World Breaks",
      date: "999.M41",
      text: "Abaddon fights through Cadia's last defence, duels Saint Celestine and refuses to let a crippled Blackstone become merely a defeat. He hurls the Will of Eternity down upon the planet; Cadia breaks, and the Great Rift opens behind the victory.",
      source: "https://wh40k.lexicanum.com/wiki/13th_Black_Crusade",
    },
    {
      world: "vigilus",
      heading: "Vigilus · The Warmaster Descends",
      date: "001–025.M42",
      text: "The Warmaster teleports into the Citadel Vigilant and meets Marneus Calgar at the heart of the War of Beasts. Calgar survives their duel, and only the Vengeful Spirit's peril draws Abaddon away from a world he has nearly strangled.",
      source: "https://wh40k.lexicanum.com/wiki/War_of_Beasts",
    },
  ],
  lbl: { x: 286, y: 526, t: "THE LONG WAR" },
};
