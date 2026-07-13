/**
 * Yvraine's personally attested road from Biel-Tan to the Ynnari. The
 * `remnants-of-biel-tan` pin is the same travelling craftworld before and
 * after its fracture; the heading carries the story-era name. Commorragh's
 * canonical catalog id is used deliberately. Iathglas is omitted because it
 * has no chart pin and no later personal station on which a final waypoint
 * could honestly land.
 */

import type { Voyage } from "../types";

export const YVRAINE: Voyage = {
  id: "yvraine",
  name: "Yvraine · The Seventh Path",
  tag: "ancient–M42",
  blurb: "A dead exile rises as Ynnead's prophet and follows the Croneswords through craftworld, Webway and hell.",
  stations: [
    {
      world: "remnants-of-biel-tan",
      heading: "Biel-Tan · Daughter of the Swordwind",
      date: "before M41",
      text: "Before death gives her a title, Yvraine walks Biel-Tan's paths as dancer, Aspect Warrior and Warlock. None can hold her, and the craftworld's fierce daughter leaves to seek another way of life.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
    },
    {
      via: 0.5,
      name: "Gnosis Prime",
      heading: "Gnosis Prime · The Avatar's War",
      date: "M41",
      text: "Yvraine marches beside Biel-Tan's Avatar on Gnosis Prime and takes the Dire Avenger's path. The war tempers her as an Aspect Warrior, yet no single shrine can hold her restless course.",
      source: "https://wh40k.lexicanum.com/wiki/Gnosis_Prime",
    },
    {
      world: "commorragh",
      heading: "Commorragh · Night of Revelations",
      date: "999.M41",
      text: "Exile, corsair and arena champion, Yvraine dies upon the Crucibael's sands. Ynnead answers with a pulse of death that resurrects her, births a great Dysjunction and turns a Commorrite spectacle into the first revelation of the Ynnari.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
    },
    {
      world: "ursulia",
      heading: "Ursulia · The Obsidian Gate",
      date: "999.M41",
      text: "Yvraine joins Biel-Tan's desperate battle at Ursulia, where Slaaneshi daemons pour through the Obsidian Gate. The Ynnari help seal the breach, but the craftworld's deeper wound is already opening.",
      source: "https://wh40k.lexicanum.com/wiki/Ursulia",
    },
    {
      world: "remnants-of-biel-tan",
      heading: "Biel-Tan · The Fracture",
      date: "999.M41",
      text: "Back aboard Biel-Tan, Yvraine draws Asu-var from the Infinity Circuit and awakens the Yncarne. The avatar of Ynnead banishes the remaining daemonettes; the craftworld breaks, and thousands choose the new god's prophet over the life they knew.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Biel-tan",
    },
    {
      world: "ulthwe",
      heading: "Ulthwé · The Council Divided",
      date: "999.M41",
      text: "The Seer Council condemns Eldrad for the god he tried to awaken, and Yvraine stands in his defence. A Warlock's soul and the Anchorite's word divide Ulthwé, but win the expedition to the crone worlds its leave.",
      source: "https://wh40k.lexicanum.com/wiki/Ynnari",
    },
    {
      via: 0.5,
      name: "Belial IV",
      heading: "Belial IV · The Sword in the Crone World",
      date: "999.M41",
      text: "Yvraine lands on a world drowned in the Eye of Terror and fights daemons, Haemonculi and the Prophets of Flesh. The Yncarne tears Vilith-zhar from the dead world, placing another Cronesword in Ynnari hands.",
      source: "https://wh40k.lexicanum.com/wiki/Belial_IV",
    },
    {
      world: "iyanden",
      heading: "Iyanden · The Prince Reborn",
      date: "999.M41",
      text: "Nurgle's servants are already at Iyanden when Yvraine arrives and calls its corsair kin home. She restores Prince Yriel with the Spear of Twilight and reveals the weapon itself as another of Morai-Heg's lost swords.",
      source: "https://wh40k.lexicanum.com/wiki/Iyanden",
    },
    {
      via: 0.34,
      name: "Psychedelta",
      heading: "Psychedelta · Nine Lives Returned",
      date: "999.M41",
      text: "Ahriman corners the Ynnari in the Webway, certain that Yvraine knows the path to his Legion's salvation. She restores Rubricae to living Thousand Sons for a single heartbeat—then casts them through the sundered path and escapes.",
      source: "https://wh40k.lexicanum.com/wiki/War_in_the_Labyrinth",
    },
    {
      via: 0.69,
      name: "Klaisus",
      heading: "Klaisus · The Fractured Road",
      date: "999.M41",
      text: "On Klaisus, the Ynnari find survivors of fallen Cadia and meet the warriors who will carry them toward Ultramar. Together they repel the Black Legion and turn an alliance of necessity into a road to the Avenging Son.",
      source: "https://wh40k.lexicanum.com/wiki/Klaisus",
    },
    {
      world: "macragge",
      heading: "Macragge · The Avenging Son Returns",
      date: "c. 999.M41",
      text: "At Cawl's machine, Yvraine helps fasten the Armour of Fate and call Roboute Guilliman back from death. She remains while the newborn alliance drives the Black Legion from the primarch's waking world.",
      source: "https://wh40k.lexicanum.com/wiki/Ultramar_Campaign",
    },
    {
      world: "the-black-library",
      heading: "Black Library · The Rose of Isha",
      date: "after 999.M41",
      text: "Seeking the Hand of Darkness, Yvraine enters the Black Library and survives the temptations Slaanesh lays before her. She leaves carrying the Rose of Isha, a living key to the garden of a god.",
      source: "https://wh40k.lexicanum.com/wiki/Hand_of_Darkness",
    },
    {
      via: 0.34,
      name: "Garden of Nurgle",
      heading: "Garden of Nurgle · The Hand of Darkness",
      date: "after 999.M41",
      text: "The Rose opens a path through Nurgle's impossible garden to Mortarion's Whispering Tower. Yvraine enters the Plague Planet, steals the Hand of Darkness and escapes a realm built to make escape meaningless.",
      source: "https://wh40k.lexicanum.com/wiki/Hand_of_Darkness_(Audio_Drama)",
    },
    {
      via: 0.7,
      name: "Einerash",
      heading: "Einerash · The Dead City",
      date: "after 999.M41",
      text: "A dead Webway city closes around the Ynnari while Ahriman's sorcerers and Tzeentch's daemons hunt them. Yvraine spends the Rose of Isha against a Lord of Change and wins the path home.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
    },
    {
      world: "ulthwe",
      heading: "Ulthwé · The Gate of Malice",
      date: "after 999.M41",
      text: "Back on Ulthwé, Yvraine hears of a living craftworld no Aeldari should have survived and of the Gate of Malice beneath it. Zaisuthra offers a path toward another Cronesword—and every sign of a trap.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
    },
    {
      world: "iyanden",
      heading: "Iyanden · The Dead Muster",
      date: "after 999.M41",
      text: "Yvraine returns to Iyanden and asks the dead to march with her. Wraith constructs fill the expedition bound for Zaisuthra, where living hosts can no longer be trusted.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
    },
    {
      via: 0.22,
      name: "Zaisuthra",
      heading: "Zaisuthra · The Well of the Dead",
      date: "after 999.M41",
      text: "The Yncarne enters the lost craftworld's Genestealer group mind and tears its infection apart. At the Well of the Dead, Yvraine lets the frenzied Visarch strike her down; resurrected, she defeats the Warshard and finds the Heart of Eldanesh where a Cronesword should have been.",
      source: "https://wh40k.lexicanum.com/wiki/Zaisuthra",
    },
    {
      via: 0.5,
      name: "Agarimethea",
      heading: "Agarimethea · The Temporal Tomb",
      date: "after 999.M41",
      text: "Within Agarimethea's tomb complex, Necron null-fields sever the Ynnari from the Webway as a temporal portal and a Warp breach tear open. Yvraine feeds Iyothia's soul to the Yncarne; Caelledhin gives her life to seal the breach, and still no sword waits among the dead.",
      source: "https://wh40k.lexicanum.com/wiki/Agarimethea",
    },
    {
      via: 0.78,
      name: "Saim-Hann",
      heading: "Saim-Hann · The Phoenix Descends",
      date: "after the Great Rift",
      text: "Yvraine comes to Saim-Hann seeking new believers and finds Drazhar waiting. Jain Zar descends into the ambush, buys the prophet's escape and carries the feud toward one final arena.",
      source: "https://wh40k.lexicanum.com/wiki/Raid_on_Saim-Hann",
    },
    {
      world: "zandros",
      heading: "Zandros · Death and Rebirth",
      date: "M42",
      text: "On Zandros, Yvraine learns that Drazhar has killed Jain Zar in Shaa-Dom. She sends Ynnead's power through death; the reborn Phoenix Lord arrives and, six days later, kills the master of blades.",
      source: "https://wh40k.lexicanum.com/wiki/Zandros",
    },
  ],
  lbl: { x: 642, y: 192, t: "THE SEVENTH PATH" },
};
