/**
 * The Indomitus Crusade (Era Indomitus—ongoing), drawn as a campaign network.
 *
 * The numbered fleets were never a single procession: they divided into
 * battle groups and spearheads, sometimes sharing a corridor before fanning
 * out again. The authored order therefore groups documented operational axes
 * into a guided chronicle. Repeated Sol and Vorlese anchors are intentional;
 * disconnected acts preserve chronology where no defensible transit survives.
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
  tag: "Era Indomitus · ongoing",
  blurb: "Ten fleets fracture into battle groups, fight along separate axes and converge on fronts no single itinerary can contain.",
  cartography: {
    label: "multi-fleet campaign network",
    note: "Each colour is a fleet-scale operational axis, not one hull's itinerary. Tertius, Secundus and Primus leave Sol on separate tracks; repeated origins mark battle-group branches rather than return journeys. Broken transitions preserve chronology where the record does not support a plotted course. The other seven fleets stay unplotted until their routing can be grounded.",
  },
  sections: [
    { id: "muster", label: "MUSTER · SOL", color: "#b89b63", start: 0 },
    { id: "fleet-tertius", label: "FLEET TERTIUS · PACIFICUS ARC", color: TERTIUS, start: 2 },
    { id: "fleet-secundus", label: "FLEET SECUNDUS · ROAD OF MARTYRS", color: SECUNDUS, start: 7 },
    { id: "fleet-secundus-betaris", label: "FLEET SECUNDUS · BETARIS SPEARHEAD", color: SECUNDUS, start: 10 },
    { id: "fleet-primus", label: "FLEET PRIMUS · OPENING AXIS", color: PRIMUS, start: 12 },
    { id: "fleet-primus-pariah", label: "FLEET PRIMUS · PARIAH DEPLOYMENT", color: PRIMUS, start: 15 },
    { id: "fleet-primus-transition", label: "FLEET PRIMUS · TRANSITION AND NIHILUS", color: PRIMUS, start: 17 },
  ],
  stations: [
    {
      world: "terra",
      heading: "Terra · The Indomitus Muster",
      date: "after the Great Rift",
      text: "By the will of the returned primarch, ten numbered fleets gather across the Sol System for a reconquest that echoes the Great Crusade. Each is already designed to divide into battle groups and spearheads; this is their shared point of origin, not the beginning of one continuous column.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade",
    },
    {
      world: "mars",
      heading: "Mars · Arsenal of the Muster",
      date: "opening of the Era Indomitus",
      text: "Mars supplies ships, weapons and Mechanicus hosts for the reconquest. Cawl's Primaris reserves are revealed aboard the Zar-Quaesitor in the Sol System and later sail with Fleet Primus; this act records Mars' logistical contribution, not a fleet port call.",
      source: "https://wh40k.lexicanum.com/wiki/Primaris_Revelation",
      breakBefore: true,
    },

    // Fleet Tertius — the documented outward Pacificus arc.
    {
      world: "terra",
      heading: "Terra · Fleet Tertius Launches",
      date: "opening phase",
      text: "Fleet Tertius becomes the first of the three mapped fleets to depart Sol, with Olmec as its assigned objective. The war immediately reshapes that plan, sending Fleetmistress Cassandra VanLeskus through Vorlese toward a crisis at Hydraphur.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Tertius",
      breakBefore: true,
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · The Outward Corridor",
      date: "opening phase",
      text: "Tertius passes the world of Vorlese, which lies at the centre of one of the major warp routes feeding Terra. Beyond this common throat the fleet begins its long arc through Segmentum Pacificus and toward Tempestus.",
      source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      placement: {
        precision: "schematic",
        note: "Vorlese is a documented world on a major warp route into the Sol System, but no authoritative chart coordinate is published. It is placed just beyond Terra on the shared outward corridor; the exact bearing is schematic.",
        source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      },
    },
    {
      world: "hydraphur",
      heading: "Hydraphur · The Pacificus Diversion",
      date: "opening phase",
      text: "The original plan does not survive contact with the enemy. A Chaos assault on the great naval fortress at Hydraphur draws Tertius aside before it can complete the intended drive on Olmec.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Tertius",
    },
    {
      world: "olmec",
      heading: "Olmec · The Assigned Nexus",
      date: "opening phase",
      text: "After the Hydraphur diversion, Tertius reaches and captures its original objective: the strategically important warp nexus at Olmec. The victory restores the fleet's assigned campaign rather than proving a precise onward corridor through the wider crusade.",
      source: "https://wh40k.lexicanum.com/wiki/Olmec",
      placement: {
        precision: "schematic",
        note: "Sources place Olmec in Segmentum Solar but publish no authoritative system coordinate. The catalog pin is a broad operational placement, not an exact location.",
        source: "https://wh40k.lexicanum.com/wiki/Olmec",
      },
    },
    {
      world: "machorta-sound",
      heading: "Machorta Sound · First Major Victory",
      date: "early crusade",
      text: "VanLeskus tracks the Khornate Crusade of Slaughter across several systems and concentrates five battle groups at Machorta Sound. Their victory shatters the enemy offensive and vindicates the crusade's new fleet organisation in its first major fleet action.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Machorta_Sound",
      placement: {
        precision: "schematic",
        note: "The campaign sequence fixes Machorta Sound on Tertius' Pacificus-to-Tempestus arc, but no authoritative chart coordinate is published. The catalog pin expresses that broad theatre rather than an exact system position.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Machorta_Sound",
      },
    },

    // Fleet Secundus — its main road and the Battle Group Betaris branch.
    {
      world: "terra",
      heading: "Terra · Fleet Secundus Launches",
      date: "opening phase",
      text: "Fleet Secundus departs after Tertius and drives toward the Eye of Terror. Its war becomes the Road of Martyrs, a standing line of reconquest through Segmentum Obscurus rather than a single march to a final destination.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      breakBefore: true,
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · The Fleet Fans Out",
      date: "opening phase",
      text: "Secundus uses the same Vorlese corridor before turning outward in a broad fan. From this shared throat its battle groups take different assignments while maintaining the strategic road back to Sol.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      placement: {
        precision: "schematic",
        note: "Vorlese is a documented world on a major warp route into the Sol System, but no authoritative chart coordinate is published. The repeated point marks the same corridor used by Tertius, not a second location.",
        source: "https://wh40k.lexicanum.com/wiki/Vorlese",
      },
    },
    {
      world: "cadia",
      heading: "The Cadian Gate · Road of Martyrs",
      date: "opening phase · ongoing",
      text: "The fleet's principal axis drives toward the Cadian Gate and the Eye of Terror, reinforcing the chain of war zones later called the Sanctus Wall and Anaxian Line. Fleet Secundus is never demobilised.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      placement: {
        precision: "schematic",
        note: "The catalog pin is Cadia's world position, but this act represents the wider Cadian Gate and Road of Martyrs theatre. It does not claim that Secundus made the destroyed world a conventional port of call.",
        source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      },
    },
    {
      name: "Vorlese",
      gx: 305,
      gy: 355,
      heading: "Vorlese · Battle Group Betaris",
      date: "opening phase",
      text: "Battle Group Betaris is one of the forces that peels away from Secundus after the shared corridor. This repeated Vorlese act begins its separate assignment; it is a diagrammatic branch, not a second visit.",
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
      heading: "Armageddon · Battle Group Betaris",
      date: "opening crusade",
      text: "Betaris is assigned to the wars around Armageddon. Its line remains Secundus red: a distinct spearhead, but still part of the same numbered fleet and its wider Road of Martyrs.",
      source: "https://wh40k.lexicanum.com/wiki/Indomitus_Crusade_Fleet_Secundus",
      leg: { bow: 34 },
    },

    // Fleet Primus — its opening, a separate Pariah deployment and transition.
    {
      world: "terra",
      heading: "Terra · Fleet Primus Launches",
      date: "opening phase",
      text: "Guilliman and Cawl depart with Fleet Primus after the earlier fleets have opened the way. Primus fractures into spearheads of its own, while the Lord Commander's operational axis first concentrates on the threats surrounding Sol.",
      source: "https://wh40k.lexicanum.com/wiki/Fleet_Primus",
      breakBefore: true,
    },
    {
      world: "gathalamor",
      heading: "Gathalamor · The Gate of Bones",
      date: "opening phase",
      text: "Fleet Primus wins its first major victory on the shrine world after Shield-Captain Achallor's advance force opens the way. Achallor destroys the Dark Mechanicum's bone cannon and falls fighting Kar-Gatharr before the Imperial armies complete the victory.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Gathalamor",
    },
    {
      world: "fenris",
      heading: "Fenris · The Kin-Pack Declaration",
      date: "within four years of Gathalamor",
      text: "Guilliman reaches Fenris to bring Primaris reinforcements to the sons of Russ and ask the Space Wolves to secure the crusade's rear against the Ork threat. Logan Grimnar accepts the new warriors under the Kin-Pack Declaration as Fleet Primus prepares to press deeper into the divided Imperium.",
      source: "https://wh40k.lexicanum.com/wiki/Wolfspear",
    },
    {
      world: "terra",
      heading: "Terra · Battle Group Kallides",
      date: "first phase",
      text: "Fleet Primus is never one path. Battle Group Kallides is sent from the Sol muster into the Nephilim Sub-sector, where its war reveals the vast Pariah Nexus; this repeated origin records that separate deployment, not Guilliman's return to Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Fleet_Primus",
      breakBefore: true,
    },
    {
      world: "pariah-nexus",
      heading: "Pariah Nexus · Primus and Tertius Converge",
      date: "late first phase · ongoing",
      text: "Kallides' war draws in reinforcements until major elements of Fleets Primus and Tertius confront the Silent King's forces across the Nexus. Tertius is mauled at Paradyce and VanLeskus is killed, while Primus fights at Mesmoch; the two fleets share a theatre, not one reunited formation.",
      source: "https://www.blacklibrary.com/warhammer-40000/featured/ebook-dawn-of-fire-the-silent-king-eng-2025.html",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "The Pariah Nexus is a region-scale anomaly. This catalog pin anchors the shared theatre; Paradyce and Mesmoch have no authoritative chart coordinates and are not collapsed into one exact system position.",
        source: "https://wh40k.lexicanum.com/wiki/Pariah_Crusade",
      },
    },
    {
      name: "The Pit of Raukos",
      gx: 900,
      gy: 440,
      heading: "The Pit of Raukos · The First Phase Ends",
      date: "twelfth crusade year",
      text: "At a wound in space where daemon ships spill into the Materium, the crusade's first phase reaches its culminating battle. Guilliman disperses the Unnumbered Sons afterward, while both Fleet Primus and the wider Indomitus Crusade continue.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Raukos",
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "The Pit has no published sector coordinate, but later sources place it beside the Attilan Gate near charted Attila in Ultima. The local offset expresses that relation, not an exact system position.",
        source: "https://wh40k.lexicanum.com/wiki/Pit_of_Raukos",
      },
    },
    {
      world: "macragge",
      heading: "Ultramar · The Plague Wars",
      date: "after Raukos",
      text: "After Raukos the Lord Commander's axis turns toward Ultramar. Mortarion's invasion draws Fleet Primus into the Five Hundred Worlds; Macragge anchors that regional redirection rather than claiming the war was confined to the capital.",
      source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
      placement: {
        precision: "schematic",
        note: "Macragge is the capital and chart anchor of Ultramar, while the Plague Wars range across the Five Hundred Worlds. The pin represents that wider campaign turn, not a single-world itinerary.",
        source: "https://wh40k.lexicanum.com/wiki/Plague_Wars",
      },
    },
    {
      world: "iax",
      heading: "Iax · Mortarion's Defeat",
      date: "after Raukos",
      text: "The Plague Wars culminate on poisoned Iax, where Guilliman confronts Mortarion and the Garden of Nurgle. Fleet Primus serves as his spearhead before the Lord Commander's axis bends back toward a passage into Imperium Nihilus.",
      source: "https://wh40k.lexicanum.com/wiki/Iax",
    },
    {
      name: "The Attilan Gate",
      gx: 922,
      gy: 430,
      heading: "The Attilan Gate · Into Nihilus",
      date: "after the Plague Wars",
      text: "With the Nachmund Gauntlet embattled, Guilliman forces an unstable second passage into Imperium Nihilus near the Pit of Raukos. Cawl remains behind to stabilise the Attilan Gate while the Lord Commander crosses into the dark half.",
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
      text: "Guilliman reaches Baal, brings Primaris reinforcements and names Commander Dante Regent of Imperium Nihilus. Baal closes the documented Lord Commander axis on this chart, not the wider Indomitus Crusade, whose scattered fleets and war fronts continue.",
      source: "https://wh40k.lexicanum.com/wiki/Devastation_of_Baal",
    },
  ],
  lbl: { x: 590, y: 505, t: "INDOMITUS" },
};
