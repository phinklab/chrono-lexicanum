/**
 * Garro · Knight of Grey (005–014.M31) — the Flight of the Eisenstein and
 * everything after: Malcador's Agentia Primus, the Knights-Errant
 * recruitments (the Garro audio/novel series), and the two deaths at the
 * Siege of Terra.
 *
 * Prototype for inferred cartography: the Istvaan System edge, Daggerline,
 * Io, Riga and Hesperides are explicit chart points rather than false planet
 * stand-ins. Each coordinate carries a rendered placement note and source;
 * local offsets are legibility devices, never canonical ephemerides. The
 * Empyrean is a schematic chart point because Warp transit has no stable
 * real-space coordinate. Legion of One's dead world IS Istvaan III.
 */

import type { Voyage } from "../types";

export const GARRO: Voyage = {
  id: "garro",
  name: "Garro · Knight of Grey",
  tag: "005–014.M31",
  blurb: "Seventy loyal sons carry the first warning of the Heresy, and their captain becomes the Sigillite's first Knight-Errant.",
  cartography: {
    label: "inferred course",
    note: "Five uncharted locations use sourced relative positions. Their local offsets make the route legible; they are not canonical galactic coordinates.",
  },
  stations: [
    {
      world: "istvaan-iii",
      heading: "Istvaan III · The Refused Order",
      date: "005.M31",
      text: "Wounded and set aside aboard the frigate Eisenstein, Garro hears Saul Tarvitz's warning crackle through the void: the Warmaster means to burn his own. He fires on the pursuit to spare his honour-brother and refuses the purge.",
      source: "https://wh40k.lexicanum.com/wiki/The_Flight_of_the_Eisenstein_(Novel)",
    },
    {
      name: "Istvaan System Edge",
      gx: 487.5,
      gy: 166.5,
      heading: "Istvaan System Edge · Running the Blockade",
      date: "005.M31",
      text: "Seventy loyalists — Death Guard and the Son of Horus Iacton Qruze — swear an oath of moment on Libertas and run the traitor fleet. Typhon's Terminus Est cripples the fleeing frigate, but the Eisenstein claws her way into the warp.",
      source: "https://wh40k.lexicanum.com/wiki/Eisenstein",
      placement: {
        precision: "relative",
        note: "The sources fix the escape inside the Istvaan System, but give no bearing; the point is offset from Istvaan III and deliberately does not use Istvaan V.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Isstvan_III",
      },
    },
    {
      name: "The Empyrean",
      gx: 392,
      gy: 270.1,
      heading: "The Empyrean · The God of Plagues",
      date: "005–006.M31",
      text: "In the warp the Geller field falters and Nurgle takes notice: Grulgor rises as plague-flesh, the Navigator dies at his post. The Seventy jettison the crippled warp engines and detonate them as a beacon in the storm.",
      source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
      placement: {
        precision: "schematic",
        note: "A Warp transit has no stable real-space coordinate; the dot only marks the narrative interval between the Istvaan escape and Dorn's rescue.",
        source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
      },
    },
    {
      world: "luna",
      heading: "Luna · Landfall of the Seventy",
      date: "005–006.M31",
      // Warp-detour bow kept from the four-station original.
      leg: { bow: 48 },
      text: "Summoned by the dying frigate's beacon, Dorn's Phalanx hauls the Eisenstein out of the storm. On Luna the Seventy deliver their warning, and Terra hears a truth Dorn can hardly bear to believe.",
      source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
    },
    {
      world: "luna",
      heading: "Luna · The Lord of Flies",
      date: "006.M31",
      text: "Interned in the Somnus Citadel, Solun Decius yields at last to the Rot festering in his wound, and the Lord of Flies wears his flesh. Garro banishes the daemon that was his brother on Luna's airless plain.",
      source: "https://wh40k.lexicanum.com/wiki/The_Flight_of_the_Eisenstein_(Novel)",
    },
    {
      world: "terra",
      heading: "Terra · The Sigillite's Bargain",
      date: "006.M31",
      text: "His warning delivered, Garro is stripped of the Death Guard's colours and clad in unmarked grey bearing Malcador's sigil. The Sigillite names him Agentia Primus, first of the Knights-Errant, hunter of witch, traitor, mutant and xenos.",
      source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
    },
    {
      world: "calth",
      heading: "Calth · Oath of Moment",
      date: "007.M31",
      text: "Sent into the Word Bearers' massacre at Calth, Garro cuts through daemon-fire to claim a single name: Tylos Rubio, forbidden Codicier of the Ultramarines, whose unbound lightning saves the defenders of Numinus and damns him to the grey.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Oath_of_Moment_(Audio_Drama)",
    },
    {
      name: "Daggerline",
      gx: 329.8,
      gy: 397.5,
      heading: "The Daggerline · Sword of Truth",
      date: "c. 007.M31",
      text: "From the Somnus Citadel Garro is sent to a refugee flotilla led by the Daggerline at Sol's cold edge. He unmasks Hakeem's White Scars as the traitors aboard and wins the World Eater Macer Varren for the grey.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Sword_of_Truth_(Audio_Book)",
      placement: {
        precision: "relative",
        note: "The action is explicitly in the Kuiper Belt on the outskirts of the Sol System, so the point sits just outside the Terra–Luna cluster.",
        source: "https://wh40k.lexicanum.com/wiki/Garro:_Sword_of_Truth_(Audio_Book)",
      },
    },
    {
      name: "Io",
      gx: 331.2,
      gy: 404.8,
      heading: "Io · Ashes of Fealty",
      date: "c. 008.M31",
      text: "Dorn's warning sends Garro after Meric Voyen, who has recovered Solun Decius's tainted remains from Luna and carries them toward Io in hope of a cure. Garro intercepts the ship and turns the course sunward, consigning the deadly cargo to the fire.",
      source: "https://warhammer40k.fandom.com/wiki/Nathaniel_Garro",
      placement: {
        precision: "relative",
        note: "Io is identified as Jupiter's moon; its small offset within the Sol cluster is schematic because the galactic chart cannot resolve planetary orbits.",
        source: "https://warhammer40k.fandom.com/wiki/Nathaniel_Garro",
      },
    },
    {
      world: "optera",
      heading: "Optera IV · The Loyalist Conclave",
      date: "017.008.M31",
      text: "Garro broadcasts a summons that only a truly loyal Astartes can read. Blood Angels, White Scars and the Nemean Reaver answer at Optera IV; when the Alpha Legion springs its ambush, Garro escapes with the one knight Malcador sent him to claim.",
      source: "https://wh40k.lexicanum.com/wiki/Purging_of_the_Invocastus_Sector",
    },
    {
      world: "istvaan-iii",
      heading: "Istvaan III · Legion of One",
      date: "c. 008.M31",
      text: "The last name on Malcador's list leads back to the murdered world. Among plague-risen corpses Garro corners the feral revenant called Cerberus and names him Garviel Loken, restoring the lost Luna Wolf to himself.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Legion_of_One_(Audio_Book)",
    },
    {
      name: "Riga Orbital Plate",
      gx: 335,
      gy: 403.8,
      heading: "Riga Orbital Plate · Shield of Lies",
      date: "c. 008–013.M31",
      text: "Hunting rumours of the Saint on the Riga orbital plate, Garro finds instead the scribe Tallery and the Othrys conspiracy, a hidden fortress rising on Titan for the war after the war. Ordered to silence her, he refuses.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies_(Audio_Drama)",
      placement: {
        precision: "relative",
        note: "Riga is explicitly an orbital plate over Terra; the offset separates it visually from the Throneworld without claiming an orbital longitude.",
        source: "https://wh40k.lexicanum.com/wiki/Garro:_Shield_of_Lies",
      },
    },
    {
      name: "Hesperides Orbital Plate",
      gx: 331.6,
      gy: 399.2,
      heading: "Hesperides Orbital Plate · Vow of Faith",
      date: "c. 013.M31",
      text: "On the Hesperides plate Garro finds Euphrati Keeler at last, hurling Libertas to cut down the Warmaster's assassins mid-strike. Taken into custody, the Saint promises that his hand will one day set her free.",
      source: "https://wh40k.lexicanum.com/wiki/Garro:_Vow_of_Faith_(Novella)",
      placement: {
        precision: "relative",
        note: "Hesperides is explicitly a Terran orbital plate; the plotted offset is only a legibility device within the Sol cluster.",
        source: "https://wh40k.lexicanum.com/wiki/Garro:_Vow_of_Faith_(Novella)",
      },
    },
    {
      world: "terra",
      heading: "Terra · The Saturnine Gate",
      date: "014.M31",
      text: "Passed over for the nine chosen for Titan, Garro is freed of the Sigillite's leash and stands masterless in the Siege. Beneath the Saturnine Gate he bisects Falkus Kibre of the Justaerin and comes a blade's breadth from ending Abaddon.",
      source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
    },
    {
      world: "terra",
      heading: "Terra · The First Martyr",
      date: "014.M31",
      text: "At Marmax Bastion Garro buys the Saint's escape with his life, refusing Mortarion's cup a final time. Impaled and failing, lit by Keeler's borrowed flame, he drives the stub of broken Libertas into his gene-father's neck.",
      source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
    },
  ],
  lbl: { x: 435, y: 250, t: "THE EISENSTEIN" },
};
