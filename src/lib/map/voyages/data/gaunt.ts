/**
 * Ibram Gaunt's personally attested Sabbat Worlds campaign, ordered by the
 * novel-series chronology. Blackshard has no chart pin and rides the Tanith
 * to Voltemand leg; every other act resolves to its own catalog world. The
 * second Balhaut stop is deliberate: conquest in 765.M41, convalescence and
 * the Blood Pact attack in 780.M41.
 */

import type { Voyage } from "../types";

export const GAUNT: Voyage = {
  id: "gaunt",
  name: "Ibram Gaunt · The First and Only",
  tag: "M41",
  mapState: "now",
  blurb: "One commissar carries a dead world's last regiment through the long victory of the Sabbat Worlds.",
  stations: [
    {
      world: "formal-prime",
      heading: "Formal Prime · A Blood Oath",
      date: "756.M41",
      text: "In Formal Prime's underways, the young commissar fights through the final killing weeks of Operation Redrake. At Slaydo's victory feast, Gaunt seals a blood oath to carry Saint Sabbat's crusade to its end.",
      source: "https://wh40k.lexicanum.com/wiki/Formal_Prime",
    },
    {
      world: "balhaut",
      heading: "Balhaut · Slaydo's Heir",
      date: "765.M41",
      text: "Gaunt breaches the Oligarchy Gate and brings down the Tower of the Plutocrat. A dying Slaydo makes him Colonel-Commissar and gives him both Tanith and the promise of a world for its regiment.",
      source: "https://wh40k.lexicanum.com/wiki/Ibram_Gaunt",
    },
    {
      world: "tanith",
      heading: "Tanith · The First and Only",
      date: "765.M41",
      text: "The world burns before its founding can finish. Gaunt chooses the living over a doomed last stand, evacuating some thirty-five hundred soldiers and Brin Milo—the only regiment Tanith will ever raise.",
      source: "https://wh40k.lexicanum.com/wiki/Tanith",
    },
    {
      name: "Blackshard",
      gx: 168,
      gy: 520,
      heading: "Blackshard · Ghosts in the Dark",
      date: "765.M41",
      text: "One hundred Tanith scouts slip beneath a citadel held by seventeen thousand cultists. Gaunt emerges carrying the wounded Rawne, and in Blackshard's tunnels Larkin coins the name that will follow them: Gaunt's Ghosts.",
      source: "https://wh40k.lexicanum.com/wiki/Gaunt%27s_Ghosts",
      placement: {
        precision: "relative",
        note: "Blackshard is explicitly in the Sabbat Worlds of Segmentum Pacificus; its exact system is unknown, so it is placed inside the charted Sabbat cluster near the early campaign worlds.",
        source: "https://wh40k.lexicanum.com/wiki/Blackshard",
      },
    },
    {
      world: "voltemand",
      heading: "Voltemand · Friendly Fire",
      date: "765.M41",
      text: "The Ghosts open Voltis City with almost no casualties. Then General Sturm turns Ketzok artillery on their camp: three hundred dead, two hundred wounded, and a feud that will outlive the war.",
      source: "https://wh40k.lexicanum.com/wiki/Voltemand",
    },
    {
      world: "fortis-binary",
      heading: "Fortis Binary · The Killing Ground",
      date: "c. 765–768.M41",
      text: "Dravere sends the Ghosts into a murderous trench assault intended to erase them. Gaunt turns the enemy's ritual against the Shriven, breaks their line and wins a world meant to kill his regiment.",
      source: "https://wh40k.lexicanum.com/wiki/Fortis_Binary",
    },
    {
      world: "menazoid-epsilon",
      heading: "Menazoid Epsilon · The Iron Men",
      date: "c. 765–768.M41",
      text: "Beneath Shrine Target Primaris, Gaunt finds a corrupted STC stamping out Men of Iron. He destroys the prize, kills Flense and collapses the coup aimed at Warmaster Macaroth.",
      source: "https://wh40k.lexicanum.com/wiki/Menazoid_Epsilon",
    },
    {
      world: "monthax",
      heading: "Monthax · The Impossible War",
      date: "c. 765–768.M41",
      text: "Gaunt follows a missing platoon into an Aeldari war around a Webway gate. The victory survives only as a report Imperial tacticians dismiss as impossible.",
      source: "https://wh40k.lexicanum.com/wiki/Ibram_Gaunt",
    },
    {
      world: "verghast",
      heading: "Verghast · Vervunhive",
      date: "768.M41",
      text: "When Vervunhive's command fails, Gaunt takes it. He boards Asphodel's moving fortress, kills the Heritor, and leaves with a power sword and a second people folded into the Ghosts.",
      source: "https://wh40k.lexicanum.com/wiki/Verghast",
    },
    {
      world: "hagia",
      heading: "Hagia · The Honour Guard",
      date: "769.M41",
      text: "Gaunt's capture of Doctrinopolis triggers a sorcerous beacon and earns him disgrace. Sent to recover Sabbat's remains, he refuses to abandon the shrine—and the honour guard becomes the force that saves Hagia.",
      source: "https://wh40k.lexicanum.com/wiki/Hagia",
    },
    {
      world: "phantine",
      heading: "Phantine · Operation Larisel",
      date: "771.M41",
      text: "From the sky-city of Cirenholm, Gaunt launches Operation Larisel. A hand-picked Ghost team falls through the cloud deck to kill Sagittar Slaith and break Phantine's war.",
      source: "https://wh40k.lexicanum.com/wiki/Operation_Larisel",
    },
    {
      world: "aexe-cardinal",
      heading: "Aexe Cardinal · Straight Silver",
      date: "772.M41",
      text: "Gaunt rejects forty years of trench dogma and sends half the regiment scouting while he leads the rest behind the lines. Their sabotage earns honours without changing a war built to consume men.",
      source: "https://wh40k.lexicanum.com/wiki/Aexe_Cardinal",
    },
    {
      world: "herodor",
      heading: "Herodor · The Living Saint",
      date: "773.M41",
      text: "Gaunt guards the girl calling herself Saint Sabbat while doubt follows every miracle. She destroys the Magister Innokenti; Colm Corbec dies stopping the assassin already inside their ranks.",
      source: "https://wh40k.lexicanum.com/wiki/Herodor",
    },
    {
      world: "gereon",
      heading: "Gereon · No Extraction",
      date: "774.M41",
      text: "Gaunt volunteers for a mission with no extraction: reach captured General Sturm before Chaos can strip his mind. Sturm dies by his own hand; Gaunt remains to build a resistance in the occupied world's dark.",
      source: "https://wh40k.lexicanum.com/wiki/Gereon",
    },
    {
      world: "ancreon-sextus",
      heading: "Ancreon Sextus · His Last Command",
      date: "776.M41",
      text: "The Gereon survivors return to cages and suspicion, and Gaunt is cleared only to be stripped of his regiment. At Sparshad Mons, Wilder's last stand gives him the 81st/1st—and his Ghosts—back.",
      source: "https://wh40k.lexicanum.com/wiki/Ancreon_Sextus",
    },
    {
      world: "gereon",
      heading: "Gereon · The Armour of Contempt",
      date: "777.M41",
      text: "Gaunt returns not as an infiltrator but as a liberator, commanding the merged regiment across the world he once haunted. Victory tastes of Inquisitorial cruelty: Gereon is saved only to be violated by its rescuers.",
      source: "https://wh40k.lexicanum.com/wiki/Gereon",
    },
    {
      world: "jago",
      heading: "Jago · Only in Death",
      date: "778.M41",
      text: "Hinzerhaus takes almost half the regiment. Gaunt is wounded, captured, tortured and blinded before Mkoll brings him back from the Blood Pact.",
      source: "https://wh40k.lexicanum.com/wiki/Jago",
    },
    {
      world: "balhaut",
      heading: "Balhaut · Blood in the Snow",
      date: "780.M41",
      text: "Gaunt's convalescence is broken by killers hunting Mabbon Etogaur. Through a sorcerous snowstorm he keeps the defector alive—and wins the intelligence that points to Salvation's Reach.",
      source: "https://wh40k.lexicanum.com/wiki/Balhaut",
    },
    {
      world: "salvations-reach",
      heading: "Salvation's Reach · The False Flag",
      date: "781.M41",
      text: "Gaunt takes the Ghosts and Space Marines from three Chapters into an enemy factory disguised as a Blood Pact raid. They steal its secrets, frame Gaur, and vanish into a warp translation lasting weeks for them and ten years outside.",
      source: "https://wh40k.lexicanum.com/wiki/Gaunt%27s_Ghosts",
    },
    {
      world: "urdesh",
      heading: "Urdesh · The Warmaster's Right Hand",
      date: "791–792.M41",
      text: "Gaunt returns from the Warp to find himself dead, decorated and promoted. He refuses a coup against Macaroth, helps break Sek's final assault, and hands the First-and-Only to Rawne beneath Urdesh's victory banners.",
      source: "https://wh40k.lexicanum.com/wiki/Ibram_Gaunt",
    },
  ],
  lbl: { x: 376, y: 640, t: "THE FIRST AND ONLY" },
};
