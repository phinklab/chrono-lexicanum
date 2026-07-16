/**
 * Garro · Knight of Grey (005–014.M31) — from the Flight of the Eisenstein
 * through Malcador's Agentia Primus and the Knights-Errant recruitments to
 * Garro's final stand during the Siege of Terra.
 *
 * Named moons, orbital plates, a mobile star fortress, a system edge and the
 * Empyrean use disclosed chart points instead of false catalog stand-ins.
 * Their local offsets keep the Sol cluster and the wider itinerary legible;
 * they are never presented as canonical galactic coordinates.
 */

import type { Voyage } from "../types";

const FLIGHT_SOURCE =
  "https://www.blacklibrary.com/authors/james-swallow/flight-of-the-eisenstein-ebook.html";
const GARRO_SOURCE =
  "https://www.blacklibrary.com/popular-characters/popular-garro/hh-garro-weapon-of-fate-ebook.html";
const OATH_SOURCE =
  "https://www.blacklibrary.com/authors/james-swallow/Garro-oath-of-moment-mp3.html";
const SWORD_SOURCE =
  "https://www.blacklibrary.com/authors/james-swallow/garro-sword-of-truth-mp3.html";
const BURDEN_SOURCE =
  "https://www.blacklibrary.com/popular-characters/popular-garro/burden-of-duty-mp3.html";
const ASHES_SOURCE =
  "https://www.blacklibrary.com/authors/james-swallow/garro-ashes-of-fealty-mp3.html";
const SHIELD_SOURCE =
  "https://www.blacklibrary.com/authors/james-swallow/garro-shield-of-lies-mp3.html";
const VOW_SOURCE =
  "https://www.blacklibrary.com/the-horus-heresy/HH-Novel-Series/garro-vow-of-faith-ebook.html";
const BURIED_DAGGER_SOURCE =
  "https://www.blacklibrary.com/series/the-horus-heresy/horus-heresy-the-buried-dagger-ebook-cs-2018.html";
const KNIGHT_OF_GREY_SOURCE =
  "https://www.blacklibrary.com/popular-characters/popular-garro/ebook-garro-knight-of-grey-eng-2023.html";
const GARRO_LEXICANUM = "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro";

export const GARRO: Voyage = {
  id: "garro",
  name: "Garro · Knight of Grey",
  tag: "005–014.M31",
  blurb:
    "Seventy loyal sons carry the first warning of the Heresy; their captain becomes Malcador's Agentia Primus and walks the grey road to martyrdom.",
  cartography: {
    label: "inferred course",
    note: "Moons, orbital plates, a mobile star fortress, a system edge and the Warp use sourced relative or schematic positions. Their offsets make the route legible; they are not canonical galactic coordinates.",
  },
  sections: [
    { id: "flight", label: "THE FLIGHT · THE SEVENTY", color: "#b49a68", start: 0 },
    { id: "agentia", label: "AGENTIA PRIMUS · THE GREY", color: "#778477", start: 5 },
    { id: "masterless", label: "MASTERLESS · THE SIEGE", color: "#9b4b45", start: 15 },
  ],
  stations: [
    {
      world: "istvaan-iii",
      heading: "Istvaan III · The Refused Purge",
      date: "005.M31",
      text: "Wounded on Isstvan Extremis and left aboard the frigate Eisenstein, Garro receives Saul Tarvitz's warning as the Warmaster turns on his own. He fires on the pursuit to spare his honour-brother and refuses the purge below.",
      source: FLIGHT_SOURCE,
    },
    {
      name: "Istvaan System Edge",
      gx: 487.5,
      gy: 166.5,
      heading: "Istvaan System Edge · Running the Blockade",
      date: "005.M31",
      text: "Garro's Seventy loyal Death Guard, joined by Iacton Qruze and civilian survivors, run the traitor blockade. Typhon's Terminus Est cripples the fleeing frigate, but the Eisenstein claws her way into the Warp.",
      source: FLIGHT_SOURCE,
      placement: {
        precision: "relative",
        note: "The escape occurs inside the Istvaan System, but the sources give no bearing. The point is offset from Istvaan III and deliberately does not use Istvaan V.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Isstvan_III",
      },
    },
    {
      name: "The Empyrean",
      gx: 392,
      gy: 270.1,
      heading: "The Empyrean · The God of Plagues",
      date: "005–006.M31",
      text: "In the Warp the Geller field falters, Grulgor rises in plague-flesh and the Navigator dies. The Eisenstein tears back into realspace; stranded there, Garro has her crippled Warp engines jettisoned and detonated as a beacon.",
      source: FLIGHT_SOURCE,
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Warp transit has no stable real-space coordinate. The point marks the narrative interval between the Istvaan escape and Dorn's rescue, with no physical course drawn to either side.",
        source: GARRO_LEXICANUM,
      },
    },
    {
      world: "luna",
      heading: "Luna · The Warning Delivered",
      date: "005–006.M31",
      text: "Dorn's fleet traces the dying frigate's engine-flare, and the Phalanx rescues the survivors from empty space. Taken to Luna, Garro delivers the warning that forces the Imperium to face Horus's betrayal.",
      source: FLIGHT_SOURCE,
      breakBefore: true,
    },
    {
      world: "luna",
      heading: "Luna · The Lord of Flies",
      date: "005–006.M31 · after the warning",
      text: "Interned in the Somnus Citadel, Solun Decius yields to the Rot festering in his wound, and the Lord of Flies wears his flesh. Garro banishes the daemon that was his brother on Luna's airless plain.",
      source: FLIGHT_SOURCE,
    },
    {
      world: "luna",
      heading: "Luna · Agentia Primus",
      date: "before 007.M31",
      text: "In the Somnus Citadel, Malcador strips the Death Guard's colours from Garro's armour and marks it with his own sigil. Named Agentia Primus, Garro accepts a first mission: gather twenty warriors for a purpose the Sigillite will not yet reveal.",
      source: GARRO_SOURCE,
    },
    {
      world: "calth",
      heading: "Calth · Oath of Moment",
      date: "007.M31",
      text: "Garro enters the Word Bearers' attack on Calth to recruit Tylos Rubio, forbidden Codicier of the Ultramarines. Rubio finally breaks Nikaea to save the defenders at Numinus, and his brothers' rejection leaves him free to take Garro's oath.",
      source: OATH_SOURCE,
    },
    {
      name: "Sol System Edge",
      gx: 329.8,
      gy: 397.5,
      heading: "Daggerline · Sword of Truth",
      date: "007–008.M31 · after Calth",
      text: "At the cold edge of Sol, Garro boards a refugee flotilla led by the Daggerline. He unmasks Hakeem's White Scars as the traitors aboard and wins the loyal World Eater Macer Varren for the grey.",
      source: SWORD_SOURCE,
      placement: {
        precision: "relative",
        note: "The fleet reaches the edge of the Sol System; secondary accounts place the action in the Kuiper Belt. The offset marks that outer-system setting, not an exact intercept point.",
        source: SWORD_SOURCE,
      },
    },
    {
      name: "Phalanx · Sol Anchorage",
      gx: 335.2,
      gy: 405.1,
      heading: "Phalanx · Burden of Duty",
      date: "007–008.M31",
      text: "Garro infiltrates the Phalanx and opens the sealed Seclusium to recruit the Imperial Fists Codicier Yored Massak. Massak refuses to leave his Legion, and Dorn warns Garro that obedience to the Sigillite may carry a hidden price.",
      source: BURDEN_SOURCE,
      placement: {
        precision: "relative",
        note: "The Phalanx is a mobile star fortress stationed in Sol during this mission. Its catalog pin is not used because it cannot represent the fortress's Heresy-era position.",
        source: BURDEN_SOURCE,
      },
    },
    {
      name: "Io",
      gx: 331.2,
      gy: 404.8,
      heading: "Io · Ashes of Fealty",
      date: "007–008.M31 · after the Phalanx",
      text: "Dorn's warning sends Garro after Meric Voyen, who has recovered Solun Decius's tainted remains and carries them toward Io in hope of a cure. Garro intercepts the ship and consigns the deadly cargo to the sun.",
      source: ASHES_SOURCE,
      placement: {
        precision: "relative",
        note: "Io is Jupiter's moon. Its offset within the Sol cluster is schematic because a galactic chart cannot resolve planetary orbits.",
        source: ASHES_SOURCE,
      },
    },
    {
      name: "Optera IV · Pale Stars",
      gx: 558.78,
      gy: 493.3,
      heading: "Optera IV · The Loyalist Conclave",
      date: "008.M31 · source notation 017008.M31",
      text: "Garro broadcasts a summons that only a loyal Astartes can read. Blood Angels, White Scars and the Nemean Reaver answer at Optera IV; when the Alpha Legion springs its ambush, Garro escapes with the Nemean, Malcador's intended recruit.",
      source: "https://wh40k.lexicanum.com/wiki/Purging_of_the_Invocastus_Sector",
      placement: {
        precision: "relative",
        note: "The campaign source fixes the conclave on Optera IV in the Pale Stars, but publishes no galactic coordinate. The point uses the chart's broader Optera anchor as a disclosed regional placement.",
        source: "https://wh40k.lexicanum.com/wiki/Purging_of_the_Invocastus_Sector",
      },
    },
    {
      world: "istvaan-iii",
      heading: "Istvaan III · Legion of One",
      date: "c. 008.M31 · about a year after Calth",
      text: "The last name on Malcador's list leads back to the murdered world. Among plague-risen corpses Garro corners the feral survivor called Cerberus and names him Garviel Loken, restoring the lost Luna Wolf to himself.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Legion_of_One_(Audio_Book)",
    },
    {
      name: "Riga Orbital Plate",
      gx: 335,
      gy: 403.8,
      heading: "Riga Orbital Plate · The Missing Ships",
      date: "after c. 008.M31",
      text: "Searching the plate for rumours of Euphrati Keeler, Garro finds the scribe Katanoh Tallery and her evidence that ships and supplies are vanishing under the code name Othrys. Together they board a derelict bound for Titan.",
      source: SHIELD_SOURCE,
      placement: {
        precision: "relative",
        note: "Riga is an orbital plate over Terra. The offset separates it from the Throneworld without claiming a canonical orbital longitude.",
        source: "https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies",
      },
    },
    {
      name: "Titan",
      gx: 328.9,
      gy: 406.4,
      heading: "Titan · Shield of Lies",
      date: "after c. 008.M31",
      text: "On Saturn's moon, Garro and Tallery uncover the hidden fortress and the weapons gathered for a war beyond the Heresy. Malcador orders Garro to silence her; Garro refuses, and Tallery is instead named Curator-Adepta Primus.",
      source: SHIELD_SOURCE,
      placement: {
        precision: "relative",
        note: "Titan is Saturn's moon. The point is offset within the Sol cluster because a galactic chart cannot represent its orbit or the fortress's exact site.",
        source: "https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies",
      },
    },
    {
      name: "Hesperides Orbital Plate",
      gx: 331.6,
      gy: 399.2,
      heading: "Hesperides Plate · Vow of Faith",
      date: "before the Siege · c. 013.M31",
      text: "After further missions, Garro returns to Terran orbit and finds Euphrati Keeler at last, hurling Libertas to cut down the Warmaster's assassins mid-strike. Taken into custody, the Saint promises that his hand will one day set her free.",
      source: VOW_SOURCE,
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "Hesperides is a Terran orbital plate. The plotted offset is only a legibility device, and the broken incoming leg acknowledges Garro's omitted mission on Nolec Trimus.",
        source: VOW_SOURCE,
      },
    },
    {
      world: "terra",
      heading: "Terra · Masterless",
      date: "before the Siege · c. 013.M31",
      text: "At the White Mountain, the Lord of Flies returns and Macer Varren dies in the battle. Malcador chooses nine other Knights-Errant for Titan, releases Garro from his service and leaves him, Loken and Gallor to meet Horus as masterless warriors.",
      source: BURIED_DAGGER_SOURCE,
    },
    {
      world: "terra",
      heading: "Terra · The Saturnine Gate",
      date: "014.M31",
      text: "Beneath the Saturnine Gate, Garro and Loken lead a kill-squad into the Sons of Horus assault. Garro bisects Falkus Kibre, then joins Endryd Haar and Bel Sepatus against Abaddon and comes a blade's breadth from ending him.",
      source: "https://wh40k.lexicanum.com/wiki/Saturnine_(Novel)",
    },
    {
      world: "terra",
      heading: "Terra · The First Martyr",
      date: "014.M31",
      text: "At Marmax Bastion, Garro buys Keeler's escape with his life and refuses Mortarion's offer to return. Keeler's faith lifts him for one final defiance: impaled and failing, he drives the stub of broken Libertas into his gene-father's neck.",
      source: KNIGHT_OF_GREY_SOURCE,
    },
  ],
  lbl: { x: 435, y: 250, t: "GARRO · KNIGHT-ERRANT" },
};
