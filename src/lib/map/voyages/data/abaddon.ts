/**
 * Abaddon's Black Crusades as thirteen disconnected campaign sorties. Every
 * numbered Black Crusade restarts at the Eye of Terror; `breakBefore`
 * prevents the chronology from drawing false travel between one crusade's
 * endpoint and the next one's muster. Within a sortie, the route follows
 * documented theatres or personally attested objectives. Fleet-wide and
 * simultaneous actions are compressed in the launch cards rather than
 * forced into a single personal itinerary.
 */

import type { Voyage } from "../types";

/** Muted archival pigments: distinct enough to trace overlapping sorties
 * without turning the war chart into a spectral rainbow. */
export const BLACK_CRUSADE_PALETTE = [
  "#b88a72",
  "#a96773",
  "#8d6f91",
  "#6f7094",
  "#5f7d93",
  "#4f8588",
  "#5c876f",
  "#78875e",
  "#96905a",
  "#aa8957",
  "#ad744f",
  "#8a6860",
  "#b64d54",
] as const;

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"] as const;
const starts = [2, 5, 8, 10, 12, 14, 16, 18, 21, 24, 27, 29, 37] as const;

export const BLACK_CRUSADE_SECTIONS = roman.map((numeral, index) => ({
  id: `black-crusade-${index + 1}`,
  label: `BLACK CRUSADE ${numeral} / XIII`,
  color: BLACK_CRUSADE_PALETTE[index],
  start: starts[index],
}));

export const ABADDON: Voyage = {
  id: "abaddon",
  name: "Abaddon · The Black Crusades",
  tag: "M31–M41",
  mapState: "now",
  blurb: "Thirteen invasions from the Eye of Terror, each with a distinct objective, culminating in the fall of Cadia.",
  cartography: {
    label: "13 Black Crusades",
    note: "Each numbered route restarts at the Eye of Terror. Lines connect only documented movements within that Crusade; breaks and placement notes mark concurrent actions or locations the sources do not fix precisely.",
  },
  sections: [
    { id: "black-crusades-prologue", label: "THE BLACK CRUSADES · PROLOGUE", color: "#b89b63", start: 0 },
    ...BLACK_CRUSADE_SECTIONS,
  ],
  stations: [
    {
      world: "eye-of-terror",
      heading: "Eleusinian Veil · The Exile",
      date: "late M31 · Prologue",
      text: "Deep within the Eye at the Eleusinian Veil, the Vengeful Spirit drifts in silence while its captain searches the Warp for meaning. Sargon leads Iskandar Khayon, Falkus Kibre and their allies to Abaddon, ending his long exile.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
      placement: {
        precision: "relative",
        note: "The Eleusinian Veil lies inside the Eye of Terror, but no stable internal coordinate is published; the Eye marker anchors the scene rather than fixing the Vengeful Spirit's position.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
      },
    },
    {
      name: "Harmony",
      gx: 250,
      gy: 220,
      heading: "Harmony · A Legion Reborn",
      date: "late M31 · Prologue",
      text: "Before the assault, Abaddon names the new Black Legion and raises its standard above Harmony. Canticle City burns, the Emperor's Children break and Abaddon destroys Fabius Bile's clone of Horus with the Talon of Horus.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
      placement: {
        precision: "relative",
        note: "Harmony is explicitly a Daemon World inside the Eye of Terror; its local point is offset from the Eye marker because no stable internal coordinates exist.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Harmony",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "I · The First Black Crusade",
      date: "781.M31",
      text: "The Black Legion escapes the Eye through the Cadian Gate, breaks Sigismund's vigil and turns a first battle at Cadia into decades of war across Segmentum Obscurus. Its hidden destination is Uralan and the blade waiting below the Tower of Silence.",
      source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
    },
    {
      name: "Cadian Gate",
      gx: 271,
      gy: 228,
      heading: "Cadian Gate · We Are Returned",
      date: "781.M31",
      text: "In the void of the Cadian Gate, Abaddon boards the Eternal Crusader and meets Sigismund blade to blade. He kills the ancient champion only after taking a wound that nearly ends his war at its beginning.",
      source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
      placement: {
        precision: "relative",
        note: "The duel occurs aboard the Eternal Crusader within the Cadian Gate, not on Cadia; the point is placed between the Eye and the fortress world without claiming a battle coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
      },
    },
    {
      name: "Uralan",
      gx: 302,
      gy: 251,
      heading: "Uralan · The First Sword",
      date: "late First Black Crusade · M31",
      text: "Beneath Uralan, the Despoiler enters the Tower of Silence and faces the thing bound within. He emerges carrying Drach'nyen, the daemon blade that will open the Imperium for him.",
      source: "https://wh40k.lexicanum.com/wiki/1st_Black_Crusade",
      placement: {
        precision: "schematic",
        note: "Sources place Uralan inconsistently inside or beyond the Eye of Terror. Its point preserves the documented journey from the Cadian Gate without asserting which location tradition is exact.",
        source: "https://wh40k.lexicanum.com/wiki/Uralan",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "II · The Cursing of Corona",
      date: "597.M32",
      text: "The second sortie crashes into the new defences of the Cadian Gate. Cadia absorbs the main siege while Abaddon's personal blows at Belis Corona and Nemesis Tessera plant a delayed curse, free captive daemons and damage the pylon network.",
      source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
    },
    {
      world: "belis-corona",
      heading: "Belis Corona System · The Outer Moon",
      date: "597.M32",
      text: "While Black Legion fleets destroy the naval yards, Abaddon lands upon the system's outermost moon. His ritual buries a mutagenic curse that will wake centuries after the fleet has gone.",
      source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
      placement: {
        precision: "relative",
        note: "The ritual occurs on the system's outermost moon rather than Belis Corona itself; the catalog world is used only as the system anchor.",
        source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
      },
    },
    {
      name: "Nemesis Tessera",
      gx: 320,
      gy: 242,
      heading: "Nemesis Tessera · The Eldritch Needles",
      date: "597.M32",
      text: "Black Legion forces break the Inquisitorial fortress and release its captive daemons. Abaddon teleports to the surface and topples the Eldritch Needles—blackstone pylons holding back the Warp.",
      source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Nemesis Tessera is one of the three named bastions of the Cadian Gate alongside Cadia and Belis Corona; it is plotted between those charted systems.",
        source: "https://wh40k.lexicanum.com/wiki/2nd_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "III · The Host of Tallomin",
      date: "909.M32",
      text: "Tallomin and a vast assault on Cadia draw Imperial armies and a dozen Chapters to the Gate. The spectacle is a diversion: Abaddon's real objective is the prophecy and remains of Saint Gerstahl.",
      source: "https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade",
    },
    {
      name: "Gerstahl",
      gx: 310,
      gy: 255,
      heading: "Gerstahl · The Saint Broken",
      date: "909.M32",
      text: "On Gerstahl, Abaddon destroys the shrine and remains of the Imperial saint, forestalling the prophecy attached to them. Tactical defeat at Cadia conceals the Crusade's intended victory.",
      source: "https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade",
      placement: {
        precision: "schematic",
        note: "The Third Crusade identifies Gerstahl as Abaddon's concealed objective but supplies no sector or system coordinate; its point marks the Cadian Gate theatre only in broad terms.",
        source: "https://wh40k.lexicanum.com/wiki/3rd_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "IV · The Devastation of El'Phanor",
      date: "001.M34",
      text: "The Fourth Crusade besieges Cadia while the bulk of Abaddon's force drives into Segmentum Obscurus. The march ends at El'Phanor, where the Grand Citadel of Kromarch anchors the Gate's deeper defence.",
      source: "https://wh40k.lexicanum.com/wiki/4th_Black_Crusade",
    },
    {
      world: "elphanor",
      heading: "El'Phanor · The Citadel Falls",
      date: "001.M34",
      text: "Drach'nyen splits the gates of the Kromarch's citadel. Abaddon extinguishes the dynasty and destroys the monolith within before Imperial counterattack ends the Crusade on the same world.",
      source: "https://wh40k.lexicanum.com/wiki/4th_Black_Crusade",
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "V · The Tide of Blood",
      date: "723.M36",
      text: "A dozen invasions scour the Elysia Sector while Black Legion fleets keep the Imperial Navy chasing shadows. At Tarinth, the sector-wide slaughter becomes one ritual and two Chapters take the bait.",
      source: "https://wh40k.lexicanum.com/wiki/5th_Black_Crusade",
    },
    {
      name: "Tarinth",
      gx: 435,
      gy: 305,
      heading: "Tarinth · Ten Million Souls",
      date: "723.M36",
      text: "In Kasyr Lutien, Abaddon burns a city and offers ten million souls to the Warp. The sacrifice summons Doombreed and annihilates the Warhawks and Venerators sent to stop him.",
      source: "https://wh40k.lexicanum.com/wiki/5th_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Tarinth is explicitly inside the Elysia Sector; it is plotted as a local offset from the charted Elysia world because no system position is published.",
        source: "https://wh40k.lexicanum.com/wiki/5th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "VI · Drecarth's Folly",
      date: "901.M36",
      text: "The Sixth Crusade is a compact act of conquest and consolidation. Abaddon allies with rival Sons of Horus warlord Drecarth for the assault on Arkreath, then uses victory to erase the rival and absorb his legionaries.",
      source: "https://wh40k.lexicanum.com/wiki/6th_Black_Crusade",
    },
    {
      name: "Arkreath",
      gx: 320,
      gy: 195,
      heading: "Arkreath · The Sons of the Eye",
      date: "901.M36",
      text: "The forge world's Mechanicus defenders are crushed and its flux-cages ruined. In the celebration Abaddon impales Drecarth; the leaderless Sons of the Eye join the Black Legion.",
      source: "https://wh40k.lexicanum.com/wiki/6th_Black_Crusade",
      placement: {
        precision: "schematic",
        note: "Arkreath is identified only as a Forge World in Segmentum Obscurus; the point sits in that broad northern region without claiming a known sector.",
        source: "https://wh40k.lexicanum.com/wiki/6th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "VII · The Ghost War",
      date: "811.M37",
      text: "Chaos forces pour from the Eye past Cadia, disappear and spend years turning pursuit into confusion. Their decisive appearance is at Mackan, where the Blood Angels' gene-seed is the prize Abaddon intends to barter.",
      source: "https://wh40k.lexicanum.com/wiki/7th_Black_Crusade",
    },
    {
      name: "Mackan",
      gx: 335,
      gy: 205,
      heading: "Mackan · The Gene-Seed Harvest",
      date: "during VII · from 811.M37",
      text: "Abaddon kills Captain Acrion and nearly destroys the Blood Angels. Captain Jorus and the Death Company later tear through much of Abaddon's honour guard before they too are slain; the Black Legion leaves with the gene-seed the Ghost War came to claim.",
      source: "https://wh40k.lexicanum.com/wiki/7th_Black_Crusade",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Mackan's segmentum, sector and system are not established consistently. The isolated point records the battle without turning its unknown location into a route from the Eye.",
        source: "https://wh40k.lexicanum.com/wiki/Mackan",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "VIII · The Skullgather",
      date: "999.M37",
      text: "The Black Legion strikes from the Eye in every direction, killing according to a pattern the Imperium cannot read. Teekus supplies one number; Rithcarn completes the occult equation offered to Tzeentch.",
      source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
    },
    {
      name: "Teekus",
      gx: 310,
      gy: 185,
      heading: "Teekus · Eight Cities Opened",
      date: "999.M37",
      text: "Eight of Teekus's twenty crater cities are peeled open to the void while the others remain untouched. The selective slaughter is one term in a galaxy-spanning ritual sum.",
      source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Teekus is named within the Eighth Crusade's Segmentum Obscurus theatre but has no sector coordinate. The Black Legion struck in every direction, so this is an isolated campaign marker rather than a course from the Eye.",
        source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
      },
    },
    {
      name: "Rithcarn",
      gx: 330,
      gy: 175,
      heading: "Rithcarn · The Equation Complete",
      date: "999.M37",
      text: "At the forge world, the Black Legion turns a mutant uprising into a final sacrifice. Tech-Magi die inside their own manufactorums and the Skullgather's sequence is complete.",
      source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Rithcarn is the Eighth Crusade's ritual climax in Segmentum Obscurus, but no sector or travel relation to Teekus is recorded; the isolated point preserves chronology only.",
        source: "https://wh40k.lexicanum.com/wiki/8th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "IX · The Starving of Cancephalus",
      date: "M37 or 537.M38 · disputed",
      text: "The Ninth Crusade launches from the Eye to draw the fortress of Cancephalus dry. Antecanis is the massacre that pulls relief forces away; seventeen years of war then leave the sector open to Abaddon's fleets.",
      source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
    },
    {
      name: "Antecanis",
      gx: 340,
      gy: 160,
      heading: "Antecanis · Monarchive",
      date: "Ninth Black Crusade · disputed",
      text: "Abaddon storms Monarchive's innermost sanctuaries in person, then returns to orbit. His fleet bombards and devastates Antecanis, making the diversion impossible to ignore.",
      source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
      placement: {
        precision: "schematic",
        note: "Antecanis belongs to the Ninth Crusade's Segmentum Obscurus theatre, but its sector is not published; the point precedes the strategic target Cancephalus.",
        source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
      },
    },
    {
      name: "Cancephalus",
      gx: 360,
      gy: 145,
      heading: "Cancephalus · Starved, Not Stormed",
      date: "17-year aftermath · disputed date",
      text: "The naval fortress is the campaign's objective rather than a claimed planetfall. Its fleets are pulled into seventeen years of fighting until Abaddon can ravage the surrounding sector at will.",
      source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
      placement: {
        precision: "schematic",
        note: "Cancephalus is the named Imperial Navy fortress targeted by the Ninth Crusade in Segmentum Obscurus; no system coordinate is supplied.",
        source: "https://wh40k.lexicanum.com/wiki/9th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "X · The Conflict of Helica",
      date: "001.M39",
      text: "Perturabo opens an ancient Warp route from inside the Eye, letting the Tenth Crusade bypass the Cadian Gate into the Helica Sector. Thracian Primaris draws the response while Abaddon and the Iron Warriors close on Medusa.",
      source: "https://wh40k.lexicanum.com/wiki/10th_Black_Crusade",
    },
    {
      world: "thracian-primaris",
      heading: "Thracian Primaris · The Helican Feint",
      date: "001.M39",
      text: "A Black Legion fleet attacks the sector capital while Abaddon's warlords scatter across scores of worlds. The fleet-wide feint masks the debt of vengeance being paid elsewhere at Medusa.",
      source: "https://wh40k.lexicanum.com/wiki/10th_Black_Crusade",
      breakBefore: true,
    },
    {
      world: "medusa",
      heading: "Medusa System · The Iron Cage Tested",
      date: "001.M39",
      text: "From the Vengeful Spirit, Abaddon watches the Iron Warriors burn the Medusa System's outer worlds and tighten a war of attrition around the Iron Hands. The defenders survive and the Chaos fleet retreats.",
      source: "https://wh40k.lexicanum.com/wiki/10th_Black_Crusade",
      breakBefore: true,
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "XI · The Doom of Relorria",
      date: "301.M39",
      text: "Abaddon tries to force a path through the storms around the Eye with a bound daemon navigator. It fails spectacularly, scattering the fleet thousands of light years off course—so he makes the nearest world the objective.",
      source: "https://wh40k.lexicanum.com/wiki/11th_Black_Crusade",
    },
    {
      name: "Relorria",
      gx: 405,
      gy: 95,
      heading: "Relorria · The Green Experiment",
      date: "301.M39",
      text: "Relorria becomes a three-sided war between Humanity, daemons and Orks. Abaddon abducts thousands of greenskins for experiments on their psychic link and carries them back to the Eye.",
      source: "https://wh40k.lexicanum.com/wiki/11th_Black_Crusade",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "The daemon navigator scatters the fleet thousands of light years from the Eye and the source gives no resulting sector; the large offset visualises that uncertainty only.",
        source: "https://wh40k.lexicanum.com/wiki/11th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "XII · The Gothic War",
      date: "prelude 139 · war 142–160.M41",
      text: "Relics stolen at the edge of the Eye prepare the Blackstone Fortresses for war, and the Twelfth Crusade becomes a decades-long void campaign across the Gothic Sector. Its major objectives form a documented campaign chain.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
    },
    {
      world: "purgatory",
      heading: "Purgatory · The Hand of Darkness",
      date: "c. 139.M41",
      text: "Abaddon's warbands overrun the remote station Purgatory and seize the Hand of Darkness. The stolen relic is one of the keys with which the Blackstone Fortresses will answer him.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
    },
    {
      world: "ornsworld",
      heading: "Ornsworld · The Eye of Night",
      date: "c. 139.M41 · Prelude",
      text: "A second raid claims the Eye of Night from Ornsworld. Together with the Hand of Darkness, the relic gives Abaddon the means to awaken and command the Gothic Sector's Blackstone Fortresses.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Ornsworld is a documented but separately conducted relic raid. Its catalog pin identifies the world; the break avoids inventing an order or direct course from Purgatory.",
        source: "https://wh40k.lexicanum.com/wiki/Ornsworld",
      },
    },
    {
      world: "gothic-sector",
      heading: "Gothic Sector · The War Opens",
      date: "142–143.M41",
      text: "Warp storms isolate the sector as Chaos fleets strike across its systems and the Planet Killer forces worlds to surrender. The war's true purpose is control of the six Blackstone Fortresses.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      breakBefore: true,
    },
    {
      name: "Brinaga",
      gx: 440,
      gy: 165,
      heading: "Brinaga · A Blackstone Captured",
      date: "144.M41",
      text: "Chaos forces destroy the Imperial fleet at Brinaga and capture another Blackstone Fortress, turning scattered raids into a weapon system under Abaddon's hand.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Brinaga is a named Gothic War system; it is plotted as a local offset inside the charted Gothic Sector because the campaign source gives no galactic coordinates.",
        source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      },
    },
    {
      name: "Fularis II",
      gx: 450,
      gy: 172,
      heading: "Fularis II · The Fortresses Linked",
      date: "144.M41",
      text: "Fularis II falls and a third Blackstone joins the fleet. Abaddon demonstrates that linked fortresses can strip an entire world of life in a single combined blast.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Fularis II is one of the documented Gothic Sector objectives; its position is a campaign-cluster offset, not a recovered system coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      },
    },
    {
      name: "Tarantis",
      gx: 445,
      gy: 185,
      heading: "Tarantis · A Star Extinguished",
      date: "151.M41",
      text: "Abaddon's three Blackstones fire into the Tarantis star and force it supernova. A whole system dies to prove the scale of the weapon he has assembled.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Tarantis is explicitly a Gothic War system and is grouped around the Gothic Sector marker; the source fixes the theatre, not exact map coordinates.",
        source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      },
    },
    {
      name: "Schindlegeist",
      gx: 435,
      gy: 190,
      heading: "Schindlegeist · The Ambush",
      date: "151.M41",
      text: "Imperial and Aeldari fleets anticipate Abaddon's attempt to seize the remaining fortress and trap him at Schindlegeist. He escapes toward the Eye with two Blackstones—the Crusade's real prize.",
      source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      placement: {
        precision: "relative",
        note: "Schindlegeist is the decisive ambush system of the Gothic War; it is plotted within the same sourced sector cluster without reusing an unrelated similarly named chart world.",
        source: "https://wh40k.lexicanum.com/wiki/12th_Black_Crusade",
      },
    },

    {
      world: "eye-of-terror",
      breakBefore: true,
      heading: "XIII · The Fall of Cadia",
      date: "995–999.M41",
      text: "A fleet of hundreds of warships, Space Hulks and two Blackstone Fortresses pours from the Eye. The Thirteenth Crusade is the concentrated blow the first twelve prepared, aimed directly at Cadia and its pylon network.",
      source: "https://wh40k.lexicanum.com/wiki/13th_Black_Crusade",
    },
    {
      world: "cadia",
      heading: "Cadia · The Pylons Awaken",
      date: "999.M41",
      text: "Cawl and Trazyn awaken Cadia's pylon network. The Eye recoils, daemons fade and Saint Celestine weakens with them; wounded and denied victory on the ground, Abaddon teleports from the field.",
      source: "https://wh40k.lexicanum.com/wiki/13th_Black_Crusade",
    },
    {
      world: "cadia",
      heading: "Cadia · The World Breaks",
      date: "999.M41",
      text: "Abaddon refuses to let a crippled Blackstone become merely a defeat. He hurls the Will of Eternity down upon the planet; Cadia breaks, its pylon network collapses and the catastrophe helps unleash the Great Rift.",
      source: "https://wh40k.lexicanum.com/wiki/13th_Black_Crusade",
    },
  ],
  lbl: { x: 286, y: 526, t: "THE BLACK CRUSADES" },
};
