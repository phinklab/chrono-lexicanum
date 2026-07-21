/**
 * Yvraine's personally attested road from Biel-Tan to the Ynnari. Catalog
 * pins for travelling craftworlds identify the vessel, not its position at
 * the time of an event. Pale-cyan dotted legs preserve sourced Webway and
 * other extradimensional passages as journeys without turning them into
 * asserted realspace courses; `breakBefore` is reserved for transitions the
 * record does not connect. Iathglas is plotted only to Segmentum Pacificus,
 * following Psychic Awakening: Phoenix Rising p. 22 rather than the
 * conflicting Ultima label in Lexicanum's current infobox.
 */

import type { LegOverride, Voyage, VoyagePlacement } from "../types";

const WEBWAY = {
  color: "#9ce6ff",
  opacity: 0.82,
  effect: "jump",
} satisfies LegOverride;

const BIEL_TAN_PLACEMENT = {
  precision: "relative",
  note: "Biel-Tan is a travelling craftworld. This catalog pin identifies the vessel and its later remnants; it does not fix Yvraine's ancient or 999.M41 position.",
  source: "https://wh40k.lexicanum.com/wiki/Biel-Tan",
} satisfies VoyagePlacement;

const ULTHWE_PLACEMENT = {
  precision: "relative",
  note: "Ulthwé travels close to the Eye of Terror. The catalog pin is a regional identity marker, not a dated position for either of Yvraine's visits.",
  source: "https://wh40k.lexicanum.com/wiki/Ulthw%C3%A9",
} satisfies VoyagePlacement;

const IYANDEN_PLACEMENT = {
  precision: "relative",
  note: "Iyanden is a mobile craftworld currently associated with Segmentum Tempestus. The catalog pin identifies the vessel rather than either visit's historical coordinate.",
  source: "https://wh40k.lexicanum.com/wiki/Iyanden",
} satisfies VoyagePlacement;

export const YVRAINE: Voyage = {
  id: "yvraine",
  name: "Yvraine · The Seventh Path",
  tag: "ancient–M42",
  mapState: "now",
  blurb: "A Biel-Tan exile rises as Ynnead's prophet and hunts the Croneswords through the Webway and the Aeldari's divided worlds.",
  cartography: {
    label: "Webway chronicle",
    note: "The journey is chronological, not one continuous realspace flight. Muted dashed lines mark grounded courses; pale-cyan dotted traces mark sourced Webway or extradimensional passages without claiming a gate-to-gate galactic track. Broken segments preserve only the order of events.",
  },
  sections: [
    { id: "many-paths", label: "THE MANY PATHS · EXILE", color: "#b49a68", start: 0 },
    {
      id: "seventh-path",
      label: "THE SEVENTH PATH · GATHERING STORM",
      color: "#9b5a50",
      start: 2,
    },
    {
      id: "cronesword-quest",
      label: "RISE OF THE YNNARI · THE CRONESWORDS",
      color: "#778477",
      start: 11,
    },
    { id: "the-hunter", label: "THE HUNTER · SHALAXI", color: "#a85e76", start: 18 },
  ],
  stations: [
    {
      world: "remnants-of-biel-tan",
      heading: "Biel-Tan · Daughter of the Swordwind",
      date: "distant past",
      text: "Born on Biel-Tan thousands of years before the Great Rift, Yvraine first walks the Path of the Dancer. The craftworld gives her discipline and pride, but no single Path will contain the life ahead of her.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      placement: BIEL_TAN_PLACEMENT,
    },
    {
      name: "Gnosis Prime",
      gx: 440,
      gy: 640,
      heading: "Gnosis Prime · The Avatar's War",
      date: "838.M41",
      text: "Yvraine marches beside Biel-Tan's Avatar on Gnosis Prime and takes the Dire Avenger's path. She later becomes a Warlock, but exile turns her into a Ranger and corsair commander before the road finally carries her to Commorragh.",
      source: "https://wh40k.lexicanum.com/wiki/Gnosis_Prime",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Gnosis Prime is fixed to the Talhor Sector, but that sector has no established chart position; this isolated point carries Yvraine's pre-Commorragh chronology only and claims no neighbouring region.",
        source: "https://wh40k.lexicanum.com/wiki/Gnosis_Prime",
      },
    },
    {
      world: "commorragh",
      heading: "Commorragh · Night of Revelations",
      date: "999.M41",
      text: "Exile, corsair and arena champion, Yvraine dies upon the Crucibael's sands. Ynnead answers with a pulse of death that resurrects her, births a great Dysjunction and turns a Commorrite spectacle into the first revelation of the Ynnari.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Commorragh is a city-realm within the Webway. Its catalog mark is a gate and identity symbol, not a realspace coordinate for the Crucibael.",
        source: "https://wh40k.lexicanum.com/wiki/Commorragh",
      },
    },
    {
      world: "ursulia",
      heading: "Ursulia · The Obsidian Gate",
      date: "999.M41",
      text: "Yvraine joins Biel-Tan's desperate battle at Ursulia, where Slaaneshi daemons pour through the Obsidian Gate. The Ynnari help seal the breach, but the craftworld's deeper wound is already opening.",
      source: "https://wh40k.lexicanum.com/wiki/Ursulia",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Ursulia is attested only as a Maiden World in Segmentum Ultima. The catalog pin identifies the world but is not a sourced system or sector coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Ursulia",
      },
    },
    {
      world: "remnants-of-biel-tan",
      heading: "Biel-Tan · The Fracture",
      date: "999.M41",
      text: "Back aboard Biel-Tan, Yvraine draws Asu-var from the Infinity Circuit and awakens the Yncarne. The avatar of Ynnead banishes the remaining daemonettes; the craftworld breaks, and thousands choose the new god's prophet over the life they knew.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Biel-tan",
      leg: WEBWAY,
      placement: BIEL_TAN_PLACEMENT,
    },
    {
      world: "ulthwe",
      heading: "Ulthwé · The Council Divided",
      date: "999.M41",
      text: "The Seer Council condemns Eldrad for the god he tried to awaken, and Yvraine stands in his defence. A Warlock's soul and the Anchorite's word divide Ulthwé, but win the expedition to the crone worlds its leave.",
      source: "https://wh40k.lexicanum.com/wiki/Ynnari",
      breakBefore: true,
      placement: ULTHWE_PLACEMENT,
    },
    {
      name: "Belial IV",
      gx: 252,
      gy: 220,
      heading: "Belial IV · The Sword in the Crone World",
      date: "999.M41",
      text: "Yvraine lands on a world drowned in the Eye of Terror and fights daemons, Haemonculi and the Prophets of Flesh. The Yncarne tears Vilith-zhar from the dead world, returning one Cronesword to the Ynnari while another remains behind.",
      source: "https://wh40k.lexicanum.com/wiki/Ynnari",
      placement: {
        precision: "relative",
        note: "Belial IV is explicitly a Crone World pulled into the Eye of Terror; it is plotted inside the charted Eye, while its exact position within the rift remains approximate.",
        source: "https://wh40k.lexicanum.com/wiki/Belial_IV",
      },
    },
    {
      world: "iyanden",
      heading: "Iyanden · The Prince Reborn",
      date: "999.M41",
      text: "Nurgle's servants are already at Iyanden when Yvraine arrives and calls its corsair kin home. She restores Prince Yriel with the Spear of Twilight and reveals the weapon itself as another of Morai-Heg's lost swords.",
      source: "https://wh40k.lexicanum.com/wiki/Iyanden",
      leg: WEBWAY,
      placement: IYANDEN_PLACEMENT,
    },
    {
      name: "Psychedelta",
      gx: 290,
      gy: 245,
      heading: "Psychedelta · The Rubric Reversed",
      date: "999.M41",
      text: "Ahriman corners the Ynnari in the Webway, certain that Yvraine knows the path to his Legion's salvation. She proves her power by restoring Rubricae to living Thousand Sons, then casts them through the sundered path and escapes.",
      source: "https://wh40k.lexicanum.com/wiki/War_in_the_Labyrinth",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Psychedelta is a Webway convergence linked by Klaisus to the Eastern Fringe, not an ordinal realspace point; it is shown beside the Cadian waystation for narrative legibility.",
        source: "https://wh40k.lexicanum.com/wiki/Klaisus",
      },
    },
    {
      name: "Klaisus",
      gx: 282,
      gy: 240,
      heading: "Klaisus · The Fractured Road",
      date: "999.M41",
      text: "On Klaisus, the Ynnari find survivors of fallen Cadia and meet the warriors who will carry them toward Ultramar. Together they repel the Black Legion and turn an alliance of necessity into a road to the Avenging Son.",
      source: "https://wh40k.lexicanum.com/wiki/Klaisus",
      leg: WEBWAY,
      placement: {
        precision: "relative",
        note: "Klaisus is the outermost ice moon of the Cadian System; it is plotted as a local offset from Cadia rather than on the old Iyanden–Macragge midpoint.",
        source: "https://wh40k.lexicanum.com/wiki/Klaisus",
      },
    },
    {
      world: "macragge",
      heading: "Macragge · The Avenging Son Returns",
      date: "c. 999.M41",
      text: "At Cawl's machine, Yvraine helps fasten the Armour of Fate and call Roboute Guilliman back from death. She remains while the newborn alliance drives the Black Legion from the primarch's waking world.",
      source: "https://wh40k.lexicanum.com/wiki/Ultramar_Campaign",
      leg: WEBWAY,
    },
    {
      world: "the-black-library",
      heading: "Black Library · The Rose of Isha",
      date: "after the Great Rift",
      text: "Seeking the Hand of Darkness, Yvraine enters the Black Library and survives the temptations Slaanesh lays before her. She leaves carrying the Rose of Isha, a living key to the garden of a god.",
      source: "https://www.blacklibrary.com/all-products/hand-of-darkness-mp3-part1.html",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "The Black Library exists wholly within the Webway. Its catalog mark is a symbolic access point; reported realspace echoes do not give the library a fixed coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Black_Library_of_Chaos",
      },
    },
    {
      name: "Garden of Nurgle",
      gx: 556.4,
      gy: 87,
      heading: "Garden of Nurgle · The Hand of Darkness",
      date: "after the Great Rift",
      text: "The Rose opens a path through Nurgle's impossible garden to Mortarion's Whispering Tower. Yvraine enters the Plague Planet, steals the Hand of Darkness and escapes a realm built to make escape meaningless.",
      source: "https://www.blacklibrary.com/all-products/hand-of-darkness-mp3-part1.html",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Nurgle's Garden is a Warp realm reached from the Black Library and through the Whispering Tower, not a stable galactic coordinate; the point marks that extradimensional passage.",
        source: "https://wh40k.lexicanum.com/wiki/Hand_of_Darkness",
      },
    },
    {
      name: "Einerash",
      gx: 383,
      gy: 142.8,
      heading: "Einerash · The Dead City",
      date: "after Hand of Darkness",
      text: "A dead Webway city closes around the Ynnari while Ahriman's sorcerers and Tzeentch's daemons hunt them. Yvraine spends the Rose of Isha against a Lord of Change and wins the path home.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Einerash is a dead city inside the non-ordinal Webway; its mark separates the escape from Nurgle's Garden from the return to Ulthwé and claims no realspace position.",
        source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      },
    },
    {
      world: "ulthwe",
      heading: "Ulthwé · The Gate of Malice",
      date: "after Hand of Darkness",
      text: "Back on Ulthwé, Yvraine hears of a living craftworld no Aeldari should have survived and of the Gate of Malice beneath it. Zaisuthra offers a path toward another Cronesword, and every sign of a trap.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      leg: WEBWAY,
      placement: ULTHWE_PLACEMENT,
    },
    {
      world: "iyanden",
      heading: "Iyanden · The Dead Muster",
      date: "early M42",
      text: "Yvraine returns to Iyanden and asks the dead to march with her. Wraith constructs fill the expedition bound for Zaisuthra, where living hosts can no longer be trusted.",
      source: "https://wh40k.lexicanum.com/wiki/Yvraine",
      breakBefore: true,
      placement: IYANDEN_PLACEMENT,
    },
    {
      name: "Zaisuthra",
      gx: 482.8,
      gy: 635.5,
      heading: "Zaisuthra · The Well of the Dead",
      date: "early M42",
      text: "The Yncarne enters the lost craftworld's Genestealer group mind and tears its infection apart. At the Well of the Dead, Yvraine lets the frenzied Visarch strike her down; resurrected, she defeats the Warshard and finds the Heart of Eldanesh where a Cronesword should have been.",
      source: "https://www.blacklibrary.com/warhammer-40000/novels/ghost-warrior-rise-of-the-ynnari-ebook.html",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Zaisuthra developed in isolation inside the Webway and only later entered the Materium; no stable galactic region is given, so the point follows the Iyanden expedition.",
        source: "https://wh40k.lexicanum.com/wiki/Zaisuthra",
      },
    },
    {
      name: "Agarimethea",
      gx: 690,
      gy: 630,
      heading: "Agarimethea · The Temporal Tomb",
      date: "early M42",
      text: "Necron null-fields prevent Webway insertion into Agarimethea's tomb complex, forcing the Ynnari to descend from orbit. A temporal portal and Warp breach tear open; Yvraine feeds Iyothia's soul to the Yncarne, and Caelledhin gives her life to seal the breach.",
      source: "https://www.blacklibrary.com/authors/gav-thorpe/rise-of-the-ynnari-wild-rider-ebook-2018.html",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Agarimethea's segmentum, sector and system are unknown. Spiritual importance to Saim-Hann does not establish proximity, so the point is isolated and makes no regional claim.",
        source: "https://wh40k.lexicanum.com/wiki/Agarimethea",
      },
    },
    {
      name: "Threccia",
      gx: 565,
      gy: 535,
      heading: "Threccia · The Hunter in the Paths",
      date: "early M42",
      text: "Shalaxi Helbane follows Yvraine's soul-trail through the Webway and ambushes her on Threccia. Nearly an entire Biel-Tan warhost spends itself holding the daemon while Yvraine reaches the next portal and escapes.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Threccia",
      leg: WEBWAY,
      placement: {
        precision: "schematic",
        note: "Threccia lies somewhere in the Cursoai Reach, whose galactic position is not published. This point is an isolated narrative marker and makes no segmentum claim.",
        source: "https://wh40k.lexicanum.com/wiki/Battle_of_Threccia",
      },
    },
    {
      name: "Saim-Hann",
      gx: 890,
      gy: 410,
      heading: "Saim-Hann · The Phoenix Descends",
      date: "after the Great Rift",
      text: "Yvraine comes to Saim-Hann seeking new believers and finds Drazhar waiting. Jain Zar descends into the ambush, buys the prophet's escape and carries the feud toward one final arena.",
      source: "https://wh40k.lexicanum.com/wiki/Raid_on_Saim-Hann",
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "Current sources place the travelling craftworld in the Eastern Fringe; the coordinate is regional and cannot be a permanent ephemeris for a mobile world-ship.",
        source: "https://wh40k.lexicanum.com/wiki/Saim-Hann",
      },
    },
    {
      world: "zandros",
      heading: "Zandros · Death and Rebirth",
      date: "M42",
      text: "On Zandros, Yvraine learns that Drazhar has killed Jain Zar in Shaa-Dom. She sends Ynnead's power through death; the reborn Phoenix Lord arrives and, six days later, kills the master of blades.",
      source: "https://wh40k.lexicanum.com/wiki/Zandros",
      leg: WEBWAY,
      placement: {
        precision: "relative",
        note: "Zandros is a lost, dead craftworld drifting near the Maelstrom. The catalog pin marks that broad relationship, not a fixed position in M42.",
        source: "https://wh40k.lexicanum.com/wiki/Zandros",
      },
    },
    {
      name: "Iathglas",
      gx: 165,
      gy: 455,
      heading: "Iathglas · The Fifth Sword",
      date: "M42",
      text: "At an Aeldari conclave on Iathglas, a glamour of Shalaxi Helbane cuts through Yvraine's champions and tests the Yncarne itself. The daemon reveals the last Cronesword beyond mortal reach in the Palace of Slaanesh.",
      source: "https://wh40k.lexicanum.com/wiki/Battle_of_Iathglas",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Psychic Awakening: Phoenix Rising p. 22 places Iathglas in Segmentum Pacificus, contrary to Lexicanum's current Ultima infobox. No sector or coordinate is published, so this point claims only Pacificus.",
        source: "https://wh40k.lexicanum.com/wiki/Iathglas",
      },
    },
  ],
  lbl: { x: 642, y: 192, t: "THE SEVENTH PATH" },
};
