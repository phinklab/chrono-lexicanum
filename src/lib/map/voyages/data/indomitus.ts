/**
 * The Indomitus Crusade (999.M41–ongoing), drawn as a campaign network.
 *
 * The numbered fleets were never a single procession: they divided into
 * battle groups and spearheads, sometimes sharing a corridor before fanning
 * out again. The authored order below therefore restarts at Sol or Vorlese
 * for each documented axis. Repeated anchors are intentional. Fleet Tertius
 * and Fleet Primus both terminate at the Pariah Nexus to show the later
 * convergence of elements from those fleets; Fleet Secundus remains on the
 * Road of Martyrs and its Betaris branch.
 *
 * Only the three fleets whose movement can currently be grounded in useful
 * chart anchors are plotted. The remaining numbered fleets are not invented
 * as decorative lines.
 */

import type { Voyage } from "../types";

const TERTIUS = "#7f9db5";
const SECUNDUS = "#b97b72";
const PRIMUS = "#79a897";

export const INDOMITUS: Voyage = {
  id: "indomitus",
  name: "The Indomitus Crusade",
  tag: "M42 · ongoing",
  blurb: "Ten fleets divide into battle groups, drive along separate axes and sometimes converge again.",
  cartography: {
    label: "multi-fleet campaign network",
    note: "Each colour is a fleet-scale operational axis, not one hull's itinerary. Tertius, Secundus and Primus leave Sol on separate tracks; repeated origins mark battle-group branches. Elements of Primus and Tertius converge in the Pariah Nexus, while Secundus remains on the Road of Martyrs. The other seven fleets stay unplotted until their routing can be grounded.",
  },
  sections: [
    { id: "muster", label: "MUSTER · SOL", color: "#b89b63", start: 0 },
    { id: "fleet-tertius", label: "FLEET TERTIUS · PACIFICUS ARC", color: TERTIUS, start: 2 },
    { id: "fleet-secundus", label: "FLEET SECUNDUS · ROAD OF MARTYRS", color: SECUNDUS, start: 8 },
    { id: "fleet-secundus-betaris", label: "FLEET SECUNDUS · BETARIS SPEARHEAD", color: SECUNDUS, start: 11 },
    { id: "fleet-primus", label: "FLEET PRIMUS · LORD COMMANDER'S AXIS", color: PRIMUS, start: 13 },
    { id: "fleet-primus-pariah", label: "FLEET PRIMUS · PARIAH DEPLOYMENT", color: PRIMUS, start: 20 },
  ],
  stations: [
    {
      world: "terra",
      heading: "Terra · The Indomitus Muster",
      date: "c. 999.M41",
      text: "By the will of the returned primarch the greatest muster since the Great Crusade fills the Sol System: ten numbered fleets, each already designed to divide into battle groups and spearheads. This is their shared point of departure, not the beginning of one continuous column.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },
    {
      world: "mars",
      heading: "Mars · Forge of the Ultima Founding",
      date: "c. 999.M41",
      text: "Mars empties its forges for the reconquest. Archmagos Belisarius Cawl brings thousands of Ultima Founding Primaris Marines, held in stasis aboard the macro-barge Zar-Quaesitor, to sail with Fleet Primus.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },

    // Fleet Tertius — the outward Pacificus arc and its later Pariah force.
    {
      world: "terra",
      heading: "Terra · Fleet Tertius Launches",
      date: "999.M41",
      text: "Fleet Tertius leaves Sol with Olmec as its first great objective. Its route runs outward through the Vorlese corridor toward Segmentum Pacificus before later curving into Tempestus.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Tertius",
      breakBefore: true,
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · The Outward Corridor",
      date: "999.M41",
      text: "Tertius passes through Vorlese, one of the eight major warp routes that feed Terra. Beyond this common throat the fleet's battle groups begin their long Pacificus arc.",
      source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      placement: {
        precision: "schematic",
        note: "Vorlese is a documented major warp route into the Sol System, but no authoritative chart coordinate is published. It is placed just beyond Terra on the shared outward corridor; the exact bearing is schematic.",
        source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      },
    },
    {
      world: "hydraphur",
      heading: "Hydraphur · The Pacificus Diversion",
      date: "early M42",
      text: "The original plan does not survive contact with the enemy. A Chaos assault on the great naval fortress at Hydraphur draws Tertius aside before it can complete the intended drive on Olmec.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Battle_Group",
    },
    {
      world: "olmec",
      heading: "Olmec · The Warp Nexus",
      date: "early M42",
      text: "The fleet reaches its first assigned objective, a strategically vital warp nexus in Segmentum Solar. Securing Olmec helps reopen an outward route for the crusade's dispersed battle groups.",
      source: "https://wh40k.lexicanum.com/wiki/Olmec",
    },
    {
      world: "machorta-sound",
      heading: "Machorta Sound · First Major Victory",
      date: "c. 001.M42",
      text: "Fleetmistress VanLeskus tracks a Khornate Slaughter Host across several systems and concentrates five battle groups at Machorta Sound. Their victory becomes the crusade's first great fleet action.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Machorta_Sound",
    },
    {
      world: "pariah-nexus",
      heading: "Pariah Nexus · Tertius Converges",
      date: "later M42 · ongoing",
      text: "The Tertius line does not simply end in Pacificus. Elements of the fleet later enter the Pariah Crusade, where they operate beside forces from Fleet Primus against the Silent King's designs.",
      source: "https://wh40k.lexicanum.com/wiki/War_in_the_Pariah_Nexus",
      leg: { bow: 42 },
    },

    // Fleet Secundus — main road plus a Battle Group Betaris branch.
    {
      world: "terra",
      heading: "Terra · Fleet Secundus Launches",
      date: "999.M41",
      text: "Fleet Secundus is tasked with securing the route between Terra and the shattered Cadian Gate. Its war becomes the Road of Martyrs, a standing line of reconquest rather than a march toward the eastern fleets.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      breakBefore: true,
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · The Fleet Fans Out",
      date: "early M42",
      text: "After the battle for Vorlese, Secundus turns outward in a broad fan. From this shared corridor its battle groups take different assignments while maintaining the strategic road back to Sol.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      placement: {
        precision: "schematic",
        note: "Vorlese is a documented major warp route into the Sol System, but no authoritative chart coordinate is published. The repeated point marks the same corridor used by Tertius, not a second location.",
        source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      },
    },
    {
      world: "cadia",
      heading: "The Cadian Gate · Road of Martyrs",
      date: "M42 · ongoing",
      text: "The fleet's principal axis drives toward the ruins of Cadia and the Eye of Terror, reinforcing the chain of war zones later called the Sanctus Wall and Anaxian Line. Secundus is never demobilised.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · Battle Group Betaris",
      date: "early M42",
      text: "Battle Group Betaris is one of the forces that peels away from Secundus after Vorlese. Its separate line makes the fleet's fan of spearheads visible instead of collapsing them into a single itinerary.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "This is the same schematic Vorlese anchor repeated to begin a Battle Group branch. The restart encodes a split in command movement rather than a chronological return to the system.",
        source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      },
    },
    {
      world: "armageddon",
      heading: "Armageddon · The Betaris Assignment",
      date: "M42",
      text: "Betaris is assigned to the wars around Armageddon. The branch remains Secundus red: a different spearhead, but still part of the same numbered fleet.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      leg: { bow: 34 },
    },

    // Fleet Primus — Guilliman's axis and a separate eastern deployment.
    {
      world: "terra",
      heading: "Terra · Fleet Primus Launches",
      date: "999.M41",
      text: "Guilliman and Cawl depart with Fleet Primus after the earlier fleets have opened the way. Primus also fractures into spearheads, but the Lord Commander's own operational axis can be followed through its major campaigns.",
      source: "https://wh40k.lexicanum.com/wiki/Fleet_Primus",
      breakBefore: true,
    },
    {
      world: "gathalamor",
      heading: "Gathalamor · The Gate of Bones",
      date: "early M42",
      text: "Fleet Primus claims its first great victory on the shrine world. The Custodes of Shield-Captain Achallor silence a Dark Mechanicum cannon built from the bones of Gathalamor's buried billions, and the Shield-Captain falls in the deed.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gathalamor",
    },
    {
      name: "The Pit of Raukos",
      gx: 900,
      gy: 440,
      heading: "The Pit of Raukos · The First Phase Ends",
      date: "c. 012.M42",
      text: "At a wound in space where daemon ships spill into the Materium, the first phase reaches its culminating battle. Guilliman disperses the Unnumbered Sons afterward, while both Primus and the wider crusade continue.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Raukos",
      placement: {
        precision: "relative",
        note: "The Pit has no published sector coordinate, but later sources place it beside the Attilan Gate near charted Attila in Ultima. The local offset expresses that relation, not an exact system position.",
        source: "https://wh40k.lexicanum.com/wiki/Pit_of_Raukos",
      },
    },
    {
      world: "macragge",
      heading: "Macragge · The Plague Wars",
      date: "c. 012.M42",
      text: "After Raukos the Lord Commander's axis turns toward Ultramar. Mortarion's invasion forces Primus into the Five Hundred Worlds; this is a major redirection of the fleet, not the end of the Indomitus Crusade.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
    },
    {
      world: "iax",
      heading: "Iax · Mortarion's Defeat",
      date: "after Raukos",
      text: "The Plague Wars culminate on Iax, where Guilliman confronts Mortarion and the Garden of Nurgle. The fleet's course then bends back toward the unstable passage into Imperium Nihilus.",
      source: "https://wh40k.lexicanum.com/wiki/Iax",
    },
    {
      name: "The Attilan Gate",
      gx: 922,
      gy: 430,
      heading: "The Attilan Gate · Into Nihilus",
      date: "after the Plague Wars",
      text: "With the Nachmund Gauntlet embattled, Guilliman forces an unstable second passage into Imperium Nihilus near the Pit of Raukos. Cawl remains behind to stabilise the Attilan Gate while the Lord Commander crosses the dark half.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
      placement: {
        precision: "relative",
        note: "The gate is explicitly near Attila in Ultima Segmentum and beside the Pit of Raukos. This offset expresses that relationship, not an exact aperture coordinate or historical control claim.",
        source: "https://wh40k.lexicanum.com/wiki/Attilan_Gate",
      },
    },
    {
      world: "baal",
      heading: "Baal · Regent of Nihilus",
      date: "after the Plague Wars",
      text: "Guilliman reaches Baal after the Plague Wars, brings Primaris reinforcements and names Commander Dante Regent of Imperium Nihilus. Primus has crossed the galactic wound rather than simply vanishing after Raukos.",
      source: "https://wh40k.lexicanum.com/wiki/Devastation_of_Baal",
    },
    {
      world: "terra",
      heading: "Fleet Primus · Eastern Spearheads",
      date: "later M42",
      text: "A separate Primus axis represents the battle groups sent toward the Nephilim Sector. It restarts at the fleet's Sol origin because the surviving account does not support grafting that deployment onto Guilliman's personal sequence stop by stop.",
      source: "https://wh40k.lexicanum.com/wiki/Fleet_Primus",
      breakBefore: true,
    },
    {
      world: "pariah-nexus",
      heading: "Pariah Nexus · Primus Meets Tertius",
      date: "later M42 · ongoing",
      text: "Fleet Primus battle groups enter the Pariah Nexus and later operate alongside Tertius forces. Their two coloured lines meet here without implying that every ship from either fleet reunited in one formation.",
      source: "https://wh40k.lexicanum.com/wiki/Fleet_Primus",
      leg: { bow: -38 },
    },
  ],
  lbl: { x: 590, y: 505, t: "INDOMITUS" },
};
