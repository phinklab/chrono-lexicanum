// Galaxy stammdaten — typed port of public/lab/cartographer-prototype/galaxy-data.js (~830 LOC).
// Values are byte-identical: same world coords, same lore, same colors.
// Mutable copies (per-era localStorage snapshots) live in GalaxyState.data;
// these consts are the defaults the reducer hydrates from when no snapshot exists.

import type {
  Faction,
  GalaxyData,
  Landmark,
  Nebula,
  NecronDynasty,
  Polar,
  Segmentum,
  SegmentumId,
  SubSector,
  TyranidSwarm,
  World,
  WorldKind,
} from "./types";

export const SEGMENTUMS_BASE: readonly Segmentum[] = [
  {
    id: "solar",
    name: "Segmentum Solar",
    short: "SOLAR",
    inner: 0,
    outer: 0.18,
    a0: 0,
    a1: 360,
    color: "#9aa0a8",
    lore:
      "The beating heart of the Imperium. Holy Terra, the Throneworld, sits at the center of human civilization — guarded by the Sol Defence Fleet and the Adeptus Custodes.",
  },
  {
    id: "obscurus",
    name: "Segmentum Obscurus",
    short: "OBSCURUS",
    inner: 0.18,
    outer: 1.0,
    a0: -65,
    a1: 25,
    color: "#b8413f",
    lore:
      "The cursed northern reaches. Home to the Eye of Terror, the Cadian Gate, and the eternal vigil against the Ruinous Powers.",
  },
  {
    id: "ultima",
    name: "Segmentum Ultima",
    short: "ULTIMA",
    inner: 0.18,
    outer: 1.0,
    a0: 25,
    a1: 155,
    color: "#6e7480",
    lore:
      "The vast eastern segmentum. Realm of the Ultramarines, the T'au Empire, and the Eastern Fringe — where Hive Fleets first cast their shadow upon the galaxy.",
  },
  {
    id: "tempestus",
    name: "Segmentum Tempestus",
    short: "TEMPESTUS",
    inner: 0.18,
    outer: 1.0,
    a0: 155,
    a1: 215,
    color: "#3a6db8",
    lore:
      "The southern wilds. Hard, feral worlds breeding the Imperium's finest soldiers — Catachans, Tallarns, Mordians. A frontier of unending war.",
  },
  {
    id: "pacificus",
    name: "Segmentum Pacificus",
    short: "PACIFICUS",
    inner: 0.18,
    outer: 1.0,
    a0: 215,
    a1: 295,
    color: "#3f7d52",
    lore:
      "The western reaches. The Sabbat Worlds Crusade tore through these stars; warp storms make every passage a gamble against oblivion.",
  },
];

export const GALAXY_LANDMARKS_BASE: readonly Landmark[] = [
  { id: "terra", name: "TERRA", r: 0.02, a: 0, kind: "throne", faction: "imperium", segment: "solar" },
  { id: "cadia", name: "CADIA", r: 0.42, a: -25, kind: "fortress", faction: "imperium", segment: "obscurus" },
  { id: "eye", name: "EYE OF TERROR", r: 0.46, a: -55, kind: "warp", faction: "chaos", segment: "obscurus" },
  { id: "macragge", name: "MACRAGGE", r: 0.62, a: 92, kind: "astartes", faction: "imperium", segment: "ultima" },
  { id: "armageddon", name: "ARMAGEDDON", r: 0.32, a: 18, kind: "hive", faction: "imperium", segment: "ultima" },
  { id: "fenris", name: "FENRIS", r: 0.55, a: -15, kind: "astartes", faction: "imperium", segment: "obscurus" },
  { id: "baal", name: "BAAL", r: 0.78, a: 80, kind: "astartes", faction: "imperium", segment: "ultima" },
  { id: "tau-sept", name: "T'AU", r: 0.86, a: 105, kind: "xenos", faction: "xenos", segment: "ultima" },
  { id: "commorragh", name: "COMMORRAGH", r: 0.88, a: 245, kind: "xenos", faction: "xenos", segment: "pacificus" },
  { id: "catachan", name: "CATACHAN", r: 0.55, a: 185, kind: "death", faction: "imperium", segment: "tempestus" },
];

// Per-segment world lists. `segment` is baked in; per-world books carry `setting = world.name`.
const SOLAR_WORLDS: readonly World[] = [
  { id: "terra", name: "Terra", r: 0.02, a: 0, kind: "throne", faction: "imperium", segment: "solar",
    type: "Throneworld · Sol System",
    blurb: "The cradle of mankind. Beneath the Imperial Palace, the Emperor sits on the Golden Throne, His soul lashed to the Astronomican to guide ten thousand worlds through the warp.",
    books: [
      { title: "The End and the Death", author: "Dan Abnett", tag: "Heresy", setting: "Terra" },
      { title: "The Master of Mankind", author: "Aaron Dembski-Bowden", tag: "Custodes", setting: "Terra" },
      { title: "Watchers of the Throne", author: "Chris Wraight", tag: "Vigil", setting: "Terra" },
    ],
    events: [
      { era: "M31.014", text: "Siege of Terra — Horus storms the Imperial Palace" },
      { era: "M42.012", text: "Guilliman returns to Terra, summoned by his father" },
    ],
  },
  { id: "luna", name: "Luna", r: 0.05, a: 22, kind: "civilised", faction: "imperium", segment: "solar",
    type: "Moon · Selenar Gene-Cradles",
    blurb: "Terra's pale companion. The Selenar gene-cults still operate beneath its dust, breeding the Adeptus Custodes from harvested Imperial blood.",
    books: [{ title: "Saturnine", author: "Dan Abnett", tag: "Heresy", setting: "Luna" }],
    events: [{ era: "M30.785", text: "Luna brought into compliance; gene-cults sworn to the Emperor" }],
  },
  { id: "mars", name: "Mars", r: 0.07, a: 198, kind: "forge", faction: "imperium", segment: "solar",
    type: "Forge World · Sacred Mars",
    blurb: "The Red Planet. Holiest forge in the Imperium, capital of the Adeptus Mechanicus, home to the Fabricator-General and the Noctis Labyrinth.",
    books: [
      { title: "Mechanicum", author: "Graham McNeill", tag: "Heresy", setting: "Mars" },
      { title: "Lords of Mars", author: "Graham McNeill", tag: "Adeptus Mechanicus", setting: "Mars" },
    ],
    events: [
      { era: "M31.006", text: "Schism of Mars — half the Mechanicum sides with Horus" },
      { era: "M42.013", text: "Cawl reveals Primaris designs to the resurrected Guilliman" },
    ],
  },
  { id: "titan", name: "Titan", r: 0.12, a: 118, kind: "astartes", faction: "imperium", segment: "solar",
    type: "Astartes Fortress · Grey Knights",
    blurb: "Sixth moon of Saturn. The Citadel of Titan is closed to all but the Grey Knights — the Emperor's hidden weapon against the daemon.",
    books: [
      { title: "Grey Knights", author: "Ben Counter", tag: "Daemon Hunt", setting: "Titan" },
      { title: "Hammer of Daemons", author: "Ben Counter", tag: "Grey Knights", setting: "Titan" },
    ],
    events: [{ era: "M41.999", text: "Aurelian Crusade — Grey Knights deploy en-masse for the first time in millennia" }],
  },
  { id: "inwit", name: "Inwit", r: 0.15, a: 240, kind: "astartes", faction: "imperium", segment: "solar",
    type: "Astartes Homeworld · Imperial Fists",
    blurb: "An ice-bound rogue world on the Solar fringe. Rogal Dorn's cradle. The Imperial Fists rarely return; their fleet IS the chapter.",
    books: [{ title: "Praetorian of Dorn", author: "John French", tag: "Heresy", setting: "Inwit" }],
    events: [{ era: "M30.732", text: "Dorn discovered by the Emperor in the Inwit Cluster" }],
  },
  { id: "pluto", name: "Pluto", r: 0.16, a: 320, kind: "fortress", faction: "imperium", segment: "solar",
    type: "Fortress Moon · Sol Picket",
    blurb: "The outer rampart of the Sol System. Its frozen moons bristle with macrocannon batteries and torpedo silos overseen by the Imperial Fists.",
    books: [{ title: "The Solar War", author: "John French", tag: "Heresy", setting: "Pluto" }],
    events: [{ era: "M31.013", text: "Battle of Pluto — Iron Warriors break the outer Sol cordon" }],
  },
  { id: "uranus", name: "Uranus Approach", r: 0.13, a: 62, kind: "war", faction: "imperium", segment: "solar",
    type: "Naval Anchorage",
    blurb: "Picket point for the Sol Defence Fleet. Every astropath in Sol can feel the chains of psychic anchors holding the warp at bay here.",
    books: [],
    events: [{ era: "M31.013", text: "Outer fleet engagements during the Siege" }],
  },
  { id: "ganymede", name: "Ganymede", r: 0.10, a: 305, kind: "hive", faction: "imperium", segment: "solar",
    type: "Hive Moon · Jovian",
    blurb: "Largest moon of Jupiter. The Jovian Hives produce the void-craft of the Sol Defence Fleet — the master shipwrights of the Imperium.",
    books: [],
    events: [{ era: "M31.014", text: "Jovian shipyards seized to keep the loyal fleet supplied" }],
  },
];

const OBSCURUS_WORLDS: readonly World[] = [
  { id: "cadia", name: "Cadia", r: 0.42, a: -25, kind: "fortress", faction: "imperium", segment: "obscurus",
    type: "Fortress World · Cadian Gate",
    blurb: "The single Imperial stronghold barring the Eye of Terror. Every Cadian is born with eyes of violet, marked by the warp before they ever learn to shoot.",
    books: [
      { title: "Cadian Honour", author: "Justin D Hill", tag: "Cadia", setting: "Cadia" },
      { title: "Cadia Stands", author: "Justin D Hill", tag: "13th Black Crusade", setting: "Cadia" },
    ],
    events: [{ era: "M41.999", text: "13th Black Crusade — Cadia broken; Abaddon's Blackstone Fortress crashes the planet" }],
  },
  { id: "eye", name: "Eye of Terror", r: 0.46, a: -55, kind: "warp", faction: "chaos", segment: "obscurus",
    type: "Warp Rift · The Eye",
    blurb: "A wound in reality where the Eldar empire died. Within float the daemon-worlds of the Traitor Legions and the Black Crusade staging grounds. Time has no meaning here.",
    books: [
      { title: "The First Heretic", author: "Aaron Dembski-Bowden", tag: "Word Bearers", setting: "Eye of Terror" },
      { title: "Talon of Horus", author: "Aaron Dembski-Bowden", tag: "Black Legion", setting: "Eye of Terror" },
    ],
    events: [
      { era: "M31.005", text: "Traitor Legions retreat into the Eye after Terra" },
      { era: "M42.000", text: "Cicatrix Maledictum tears open from the Eye to the Eastern Fringe" },
    ],
  },
  { id: "fenris", name: "Fenris", r: 0.55, a: -15, kind: "astartes", faction: "imperium", segment: "obscurus",
    type: "Astartes Homeworld · Space Wolves",
    blurb: "A death-world of glaciers and kraken-seas. The Sky-Warriors of Russ stalk its mountains in Wulfen form; their dead are buried on the Wolfsfang.",
    books: [
      { title: "A Thousand Sons", author: "Graham McNeill", tag: "Heresy", setting: "Fenris" },
      { title: "Wolf King", author: "Chris Wraight", tag: "Space Wolves", setting: "Fenris" },
    ],
    events: [{ era: "M31.004", text: "The Wolves at the Door — Russ leads the assault on Prospero" }],
  },
  { id: "sortiarius", name: "Sortiarius", r: 0.82, a: -52, kind: "chaos", faction: "chaos", segment: "obscurus",
    type: "Daemon World · Planet of the Sorcerers",
    blurb: "Prospero, dragged into the Eye and reforged by Tzeentch. From its glassy spires Magnus the Red plots vengeance against the Allfather and against Russ.",
    books: [
      { title: "A Thousand Sons", author: "Graham McNeill", tag: "Heresy", setting: "Sortiarius" },
      { title: "The Crimson King", author: "Graham McNeill", tag: "Thousand Sons", setting: "Sortiarius" },
    ],
    events: [{ era: "M42.012", text: "Magnus launches the assault on Fenris" }],
  },
  { id: "medrengard", name: "Medrengard", r: 0.72, a: -58, kind: "chaos", faction: "chaos", segment: "obscurus",
    type: "Daemon World · Iron Warriors",
    blurb: "A planet of black iron and slave-pits. Perturabo's eternal forge churns out siege-engines for the next Long War.",
    books: [{ title: "Storm of Iron", author: "Graham McNeill", tag: "Iron Warriors", setting: "Medrengard" }],
    events: [{ era: "M41.997", text: "Hydra Cordatus campaign launches from Medrengard's yards" }],
  },
  { id: "caliban", name: "Caliban (Lost)", r: 0.66, a: -45, kind: "dead", faction: "imperium", segment: "obscurus",
    type: "Lost World · Fragmented",
    blurb: "The Lion's homeworld, shattered at the end of the Heresy. Its fragments drift in the Eye, hunted by the Fallen and the Dark Angels who chase them.",
    books: [
      { title: "Descent of Angels", author: "Mitchel Scanlon", tag: "Heresy", setting: "Caliban (Lost)" },
      { title: "Angels of Caliban", author: "Gav Thorpe", tag: "Heresy", setting: "Caliban (Lost)" },
    ],
    events: [{ era: "M31.013", text: "Caliban sundered as Luther turns on his brothers" }],
  },
  { id: "krieg", name: "Krieg", r: 0.50, a: -10, kind: "death", faction: "imperium", segment: "obscurus",
    type: "Death World · Atomic Waste",
    blurb: "A radioactive nightmare. The Death Korps wear sealed greatcoats and gas-masks; they fight to atone for a sin five hundred years old.",
    books: [
      { title: "Dead Men Walking", author: "Steve Lyons", tag: "Krieg", setting: "Krieg" },
      { title: "Krieg", author: "Steve Lyons", tag: "Death Korps", setting: "Krieg" },
    ],
    events: [{ era: "M36.811", text: "Krieg purges itself with atomics to expunge a heretic governor" }],
  },
  { id: "vraks", name: "Vraks", r: 0.36, a: -5, kind: "war", faction: "imperium", segment: "obscurus",
    type: "Munitions Depot · Lost Cause",
    blurb: "Once a vast Imperial armoury. Cardinal Xaphan turned it heretic. Seventeen years of trench warfare in nuclear winter to reclaim it.",
    books: [{ title: "Imperial Armour: Siege of Vraks", author: "Forge World", tag: "Krieg", setting: "Vraks" }],
    events: [{ era: "M41.815", text: "Siege of Vraks concludes; Death Korps casualty count classified" }],
  },
  { id: "tallarn", name: "Tallarn", r: 0.32, a: -50, kind: "death", faction: "imperium", segment: "obscurus",
    type: "Desert World · Armoured Regiments",
    blurb: "Once a verdant world. Iron Warriors scorched it with virus bombs during the Heresy. Now an endless desert of dust and armoured columns.",
    books: [
      { title: "Tallarn: Ironclad", author: "John French", tag: "Heresy", setting: "Tallarn" },
      { title: "Tallarn", author: "John French", tag: "Heresy", setting: "Tallarn" },
    ],
    events: [{ era: "M31.011", text: "Battle of Tallarn — largest armoured engagement in human history" }],
  },
  { id: "mordian", name: "Mordian", r: 0.58, a: 10, kind: "civilised", faction: "imperium", segment: "obscurus",
    type: "Tidally-Locked World · Iron Guard",
    blurb: "A world of perpetual night, lit only by city-glow. The Mordian Iron Guard parade in dazzling regimentals — a discipline forged by darkness.",
    books: [{ title: "Mordian Iron Guard (codex entries)", author: "Various", tag: "Guard", setting: "Mordian" }],
    events: [{ era: "M41.999", text: "Mordian regiments lost in the Cadian Gate collapse" }],
  },
  { id: "belis-corona", name: "Belis Corona", r: 0.30, a: 18, kind: "fortress", faction: "imperium", segment: "obscurus",
    type: "Fortress World · Sector Capital",
    blurb: "The strategic anchor of the Cadian Gate's southern approach. After Cadia fell, Belis Corona inherited the entire war.",
    books: [],
    events: [{ era: "M42.000", text: "Belis Corona musters the largest Crusade host since the Great Crusade" }],
  },
  { id: "cypra-mundi", name: "Cypra Mundi", r: 0.62, a: -38, kind: "fortress", faction: "imperium", segment: "obscurus",
    type: "Naval Bastion · Battlefleet Obscurus",
    blurb: "Headquarters of Battlefleet Obscurus. From its orbital docks the Imperial Navy fields the largest warp-fleet in the Imperium.",
    books: [],
    events: [{ era: "M41.999", text: "Cypra Mundi rallies the surviving Battlefleet after the Fall of Cadia" }],
  },
];

const ULTIMA_WORLDS: readonly World[] = [
  { id: "macragge", name: "Macragge", r: 0.62, a: 92, kind: "astartes", faction: "imperium", segment: "ultima",
    type: "Astartes Homeworld · Realm of Ultramar",
    blurb: "Throneworld of the XIII Legion. From its mountain-fortress, Roboute Guilliman commands the Indomitus Crusade. The most studied world in the eastern Imperium.",
    books: [
      { title: "Dark Imperium", author: "Guy Haley", tag: "Indomitus", setting: "Macragge" },
      { title: "Know No Fear", author: "Dan Abnett", tag: "Heresy", setting: "Macragge" },
      { title: "The Chapter's Due", author: "Graham McNeill", tag: "Uriel Ventris", setting: "Macragge" },
    ],
    events: [
      { era: "M31.005", text: "Calth Atrocity — Word Bearers betray the Ultramarines at Calth" },
      { era: "M42.011", text: "Resurrection of Guilliman; Macragge becomes capital of Imperium Sanctus" },
    ],
  },
  { id: "calth", name: "Calth", r: 0.58, a: 88, kind: "death", faction: "imperium", segment: "ultima",
    type: "Shrine World · Subterranean Refuge",
    blurb: "Once a thriving forge-belt, scorched lifeless during the Heresy. Survivors live in vast arcologies beneath the irradiated surface.",
    books: [
      { title: "Know No Fear", author: "Dan Abnett", tag: "Heresy", setting: "Calth" },
      { title: "Born of Flame", author: "Nick Kyme", tag: "Underworld War", setting: "Calth" },
    ],
    events: [{ era: "M31.005", text: "Word Bearers detonate the system's star; surface rendered uninhabitable" }],
  },
  { id: "prandium", name: "Prandium", r: 0.66, a: 95, kind: "dead", faction: "tyranid", segment: "ultima",
    type: "Dead World · Devoured",
    blurb: "A paradise garden-world of Ultramar. Stripped to bare rock by Hive Fleet Behemoth in the First Tyrannic War. A scar on the Chapter's soul.",
    books: [{ title: "Devastation of Baal", author: "Guy Haley", tag: "Tyranid War", setting: "Prandium" }],
    events: [{ era: "M41.745", text: "Hive Fleet Behemoth strips Prandium in eleven hours" }],
  },
  { id: "baal", name: "Baal", r: 0.78, a: 80, kind: "astartes", faction: "imperium", segment: "ultima",
    type: "Astartes Homeworld · Blood Angels",
    blurb: "A blood-red desert world orbiting a dying star. Sanguinius fell here in spirit before the Heresy ever began. The Flesh Tearers and Blood Angels muster from its moons.",
    books: [
      { title: "Devastation of Baal", author: "Guy Haley", tag: "Tyranid", setting: "Baal" },
      { title: "The Red Angel", author: "James Swallow", tag: "Mephiston", setting: "Baal" },
    ],
    events: [{ era: "M41.999", text: "Hive Fleet Leviathan assaults Baal; the Great Rift opens above the system" }],
  },
  { id: "cryptus", name: "Cryptus System", r: 0.82, a: 76, kind: "war", faction: "imperium", segment: "ultima",
    type: "War World · Outer Baal Approach",
    blurb: "A constellation of mining and agri-worlds. The Blood Angels' delaying action here bought Baal weeks of preparation against Leviathan.",
    books: [{ title: "Death of Integrity", author: "Guy Haley", tag: "Boarding Action", setting: "Cryptus System" }],
    events: [{ era: "M41.998", text: "Battle of Asphodex — Mephiston duels the Swarmlord" }],
  },
  { id: "graia", name: "Graia", r: 0.46, a: 60, kind: "forge", faction: "imperium", segment: "ultima",
    type: "Forge World",
    blurb: "Pattern-source of the Warlord Titan. Briefly fell to a Khornate incursion; reclaimed by the Ultramarines in a campaign that defined a generation.",
    books: [{ title: "Space Marine (novelization)", author: "Aaron Dembski-Bowden", tag: "Titus", setting: "Graia" }],
    events: [{ era: "M41.745", text: "Ork-then-Chaos invasion broken by Captain Titus, 2nd Company" }],
  },
  { id: "agripinaa", name: "Agripinaa", r: 0.38, a: 45, kind: "forge", faction: "imperium", segment: "ultima",
    type: "Forge World",
    blurb: "A grim ash-shrouded forge providing the bulk of Cadian Shock pattern lasguns. Survived the 13th Black Crusade by a hair.",
    books: [{ title: "Cadian Honour", author: "Justin D Hill", tag: "Cadia", setting: "Agripinaa" }],
    events: [{ era: "M41.999", text: "Eye of Terror Campaign — bombarded for months, survives intact" }],
  },
  { id: "tau", name: "T'au", r: 0.86, a: 105, kind: "xenos", faction: "xenos", segment: "ultima",
    type: "Xenos Capital · T'au Sept",
    blurb: "Capital of the upstart T'au Empire. The Greater Good radiates outward from this temperate cradle. A rising threat the Imperium has yet to take seriously.",
    books: [
      { title: "Fire Caste", author: "Peter Fehervari", tag: "T'au", setting: "T'au" },
      { title: "Shadowsun", author: "Braden Campbell", tag: "Commander", setting: "T'au" },
    ],
    events: [{ era: "M42.012", text: "Fourth Sphere Expansion — T'au advance into the Damocles Gulf" }],
  },
  { id: "iyanden", name: "Iyanden", r: 0.92, a: 95, kind: "xenos", faction: "xenos", segment: "ultima",
    type: "Craftworld · Aeldari",
    blurb: "A craftworld of the dead. Soulstones outnumber the living. Yriel and Yvraine still walk its corridors of frosted bone-coral.",
    books: [{ title: "Path of the Eldar (omnibus)", author: "Gav Thorpe", tag: "Eldar", setting: "Iyanden" }],
    events: [{ era: "M41.992", text: "Hive Fleet Kraken assault repulsed at terrible cost" }],
  },
  { id: "octarius", name: "Octarius", r: 0.62, a: 122, kind: "xenos", faction: "xenos", segment: "ultima",
    type: "Ork Empire · The Octarius War",
    blurb: "Ghazghkull's great empire. The Deathwatch engineered a Tyranid incursion to bleed both threats against each other. It is working — for now.",
    books: [{ title: "Damocles", author: "Various", tag: "Anthology", setting: "Octarius" }],
    events: [{ era: "M41.998", text: "Octarius War ignites; entire systems consumed in cross-fire" }],
  },
  { id: "mortarion", name: "Plague Planet", r: 0.32, a: 110, kind: "chaos", faction: "chaos", segment: "ultima",
    type: "Daemon World · Nurgle",
    blurb: "Mortarion's Garden, dragged from the Eye into realspace. A world that festers with grandfatherly love. The source of the Plague War against Ultramar.",
    books: [
      { title: "Dark Imperium: Plague War", author: "Guy Haley", tag: "Mortarion", setting: "Plague Planet" },
      { title: "The Buried Dagger", author: "James Swallow", tag: "Death Guard", setting: "Plague Planet" },
    ],
    events: [{ era: "M42.012", text: "Mortarion invades Ultramar with Seven Pox-Legions" }],
  },
  { id: "iax", name: "Iax", r: 0.54, a: 86, kind: "dead", faction: "imperium", segment: "ultima",
    type: "Garden World · Plague-Stricken",
    blurb: "Once the Garden of Ultramar. Mortarion's arrival transformed its rolling green hills into rotting fenlands. Reclaimed in name only.",
    books: [{ title: "Dark Imperium: Plague War", author: "Guy Haley", tag: "Plague War", setting: "Iax" }],
    events: [{ era: "M42.012", text: "Battle of Iax — Guilliman duels Mortarion in the Sanguistar" }],
  },
  { id: "armageddon", name: "Armageddon", r: 0.32, a: 18, kind: "hive", faction: "imperium", segment: "ultima",
    type: "Hive World · Industrial",
    blurb: "Three wars in three centuries. The Steel Legion is forged from its ashen wastes; Ghazghkull Mag Uruk Thraka has unfinished business here.",
    books: [
      { title: "Helsreach", author: "Aaron Dembski-Bowden", tag: "Black Templars", setting: "Armageddon" },
      { title: "Yarrick: Imperial Creed", author: "David Annandale", tag: "Commissar", setting: "Armageddon" },
    ],
    events: [{ era: "M41.998", text: "Third War for Armageddon — Ghazghkull returns, devastates Helsreach" }],
  },
  { id: "tartarus", name: "Tartarus", r: 0.72, a: 130, kind: "war", faction: "imperium", segment: "ultima",
    type: "War World · Eastern Fringe",
    blurb: "A world that nearly burned an Eldar Craftworld out of the warp. Captain Gabriel Angelos still bears its scars.",
    books: [{ title: "Dawn of War (novelization)", author: "C S Goto", tag: "Blood Ravens", setting: "Tartarus" }],
    events: [{ era: "M41.998", text: "Maledictum unleashed; Blood Ravens fight to seal it" }],
  },
  { id: "damnos", name: "Damnos", r: 0.86, a: 118, kind: "dead", faction: "necron", segment: "ultima",
    type: "Dead World · Necron Tomb",
    blurb: "An ice-world that woke screaming. The Ultramarines lost Damnos to the Necrons of the Sautekh Dynasty. Cato Sicarius has not forgotten.",
    books: [
      { title: "Damnos", author: "Nick Kyme", tag: "Ultramarines", setting: "Damnos" },
      { title: "Fall of Damnos", author: "Nick Kyme", tag: "Ultramarines", setting: "Damnos" },
    ],
    events: [{ era: "M41.974", text: "Necron awakening; surface population annihilated" }],
  },
  { id: "espandor", name: "Espandor", r: 0.50, a: 100, kind: "civilised", faction: "imperium", segment: "ultima",
    type: "Civilised World",
    blurb: "A core world of Ultramar. Site of the Battle of the Spirae Macria during the Plague War.",
    books: [{ title: "Dark Imperium", author: "Guy Haley", tag: "Indomitus", setting: "Espandor" }],
    events: [{ era: "M42.012", text: "Espandor liberation — Primaris debut combat operations" }],
  },
  { id: "parmenio", name: "Parmenio", r: 0.56, a: 104, kind: "civilised", faction: "imperium", segment: "ultima",
    type: "Civilised World · Ultramar",
    blurb: "A jewel-world of the 500 Worlds. Resisted plague-corruption longer than any neighbor.",
    books: [{ title: "Dark Imperium: Godblight", author: "Guy Haley", tag: "Plague War", setting: "Parmenio" }],
    events: [{ era: "M42.012", text: "Siege of Parmenio broken by the Unnumbered Sons" }],
  },
  { id: "ichar", name: "Ichar IV", r: 0.74, a: 110, kind: "hive", faction: "imperium", segment: "ultima",
    type: "Hive World",
    blurb: "Site of the Macragge Veteran's last stand against Hive Fleet Kraken. A million-strong Genestealer cult emerged in the lower hives.",
    books: [{ title: "The Hive Fleets (compendium)", author: "Various", tag: "Tyranid", setting: "Ichar IV" }],
    events: [{ era: "M41.992", text: "Hive Fleet Kraken — splinter swarm crushed after Genestealer uprising" }],
  },
  { id: "medusa-v", name: "Medusa V", r: 0.92, a: 130, kind: "dead", faction: "imperium", segment: "ultima",
    type: "Lost World · Eastern Fringe",
    blurb: "The Black Crusade of Ahriman, the Eldar of Biel-Tan, and the Tyranid vanguard — all converged here. The world is no more.",
    books: [{ title: "Medusa V Campaign Book", author: "Games Workshop", tag: "Apocalypse", setting: "Medusa V" }],
    events: [{ era: "M41.999", text: "Six-way war ends in cataclysm; planet shattered" }],
  },
  { id: "kronus", name: "Kronus", r: 0.84, a: 134, kind: "war", faction: "imperium", segment: "ultima",
    type: "War World",
    blurb: "Seven factions, one planet. The Dark Crusade saw Necrons, Tau, Eldar, Orks, Chaos and two Astartes Chapters bleed for this contested rock.",
    books: [{ title: "Dawn of War: Dark Crusade", author: "C S Goto", tag: "Blood Ravens", setting: "Kronus" }],
    events: [{ era: "M41.997", text: "The Dark Crusade — seven-faction war for orbital strategic dominance" }],
  },
];

const TEMPESTUS_WORLDS: readonly World[] = [
  { id: "catachan", name: "Catachan", r: 0.55, a: 185, kind: "death", faction: "imperium", segment: "tempestus",
    type: "Death World · Jungle",
    blurb: "A green hell where the trees eat children and the children grow into Catachan Jungle Fighters. Even the brushwood here has teeth.",
    books: [
      { title: "Death World", author: "Steve Lyons", tag: "Catachans", setting: "Catachan" },
      { title: "Rebel Winter", author: "Steve Parker", tag: "Catachans", setting: "Catachan" },
    ],
    events: [{ era: "M41.835", text: 'Catachan II "The Bloody Devils" forged in the Bloodmist Expansion' }],
  },
  { id: "sirens-storm", name: "Siren's Storm", r: 0.30, a: 175, kind: "warp", faction: "chaos", segment: "tempestus",
    type: "Warp Rift · Renegade Haven",
    blurb: "A howling warp-storm in the southern reaches. Renegade fleets, traitor lords and Red Corsairs make their lairs in its eye; astropaths who linger too long hear voices they cannot un-learn.",
    books: [{ title: "Red Tithe", author: "Nick Kyme", tag: "Carcharodons", setting: "Siren's Storm" }],
    events: [{ era: "M41.999", text: "Huron Blackheart's Tyrant's Claw raids deep into Tempestus from the Storm" }],
  },
  { id: "nocturne", name: "Nocturne", r: 0.46, a: 168, kind: "astartes", faction: "imperium", segment: "tempestus",
    type: "Death World · Salamanders",
    blurb: "A volcanic crucible bound in close orbit with its sister moon Prometheus. The Salamanders forge as readily as they fight; Vulkan walked here as one of them.",
    books: [
      { title: "Salamanders Omnibus", author: "Nick Kyme", tag: "Salamanders", setting: "Nocturne" },
      { title: "Vulkan Lives", author: "Nick Kyme", tag: "Heresy", setting: "Nocturne" },
    ],
    events: [{ era: "M41.999", text: "The Damnos Liberation — Vulkan returns from the warp" }],
  },
  { id: "bakka", name: "Bakka", r: 0.66, a: 200, kind: "fortress", faction: "imperium", segment: "tempestus",
    type: "Naval Bastion · Battlefleet Tempestus",
    blurb: "Anchorage and shipyard of Battlefleet Tempestus. Half-built grand cruisers hang in voidlock above its blue-grey oceans.",
    books: [],
    events: [{ era: "M41.998", text: "Bakka mobilises the southern fleets against the Sabbat Crusade reinforcements" }],
  },
  { id: "pavonis", name: "Pavonis", r: 0.84, a: 180, kind: "hive", faction: "imperium", segment: "tempestus",
    type: "Hive World · Tau Border",
    blurb: "A trade-rich hive on the Tempestus rim. The proximity of the T'au Empire has bred a class of merchant-princes the Inquisition watches closely.",
    books: [{ title: "Nightbringer", author: "Graham McNeill", tag: "Ultramarines", setting: "Pavonis" }],
    events: [{ era: "M41.987", text: "Genestealer infiltration of the Pavonis trade cartels uncovered" }],
  },
  { id: "vorlese", name: "Vorlese", r: 0.62, a: 215, kind: "civilised", faction: "imperium", segment: "tempestus",
    type: "Civilised World · Sector Capital",
    blurb: "A civilised core-world; clean streets and bone-white spires. Beneath the surface, an indolent nobility plays dangerous games with forbidden lore.",
    books: [],
    events: [{ era: "M41.998", text: "Inquisitorial sweep cleanses 47 noble houses in a single night" }],
  },
  { id: "spinward-front", name: "Spinward Front", r: 0.78, a: 158, kind: "war", faction: "imperium", segment: "tempestus",
    type: "War Region · Triple Front",
    blurb: "A long sector-line where Imperium, Orks of Charadon and breakaway Severan Dominate grind against each other. The Astra Militarum feed soldiers in by the trainload.",
    books: [{ title: "Only War (rulebook)", author: "Fantasy Flight", tag: "Tabletop", setting: "Spinward Front" }],
    events: [{ era: "M41.996", text: "Severan Dominate declares secession; Spinward Front ignites" }],
  },
  { id: "cthonia-lost", name: "Cthonia (Cinder)", r: 0.42, a: 210, kind: "dead", faction: "imperium", segment: "tempestus",
    type: "Dead World · Cratered",
    blurb: "A mining-warren where Horus was born to gang-warfare. After the Heresy, loyal forces irradiated the planet to slag. Nothing now stirs.",
    books: [{ title: "Horus Rising", author: "Dan Abnett", tag: "Heresy", setting: "Cthonia (Cinder)" }],
    events: [{ era: "M31.014", text: "Cthonia sterilised by orbital lance fire" }],
  },
];

const PACIFICUS_WORLDS: readonly World[] = [
  { id: "commorragh", name: "Commorragh", r: 0.88, a: 245, kind: "xenos", faction: "xenos", segment: "pacificus",
    type: "Webway City · Dark Eldar Capital",
    blurb: "The Dark City. A labyrinth-spire spanning a hundred warp-tributaries, ruled by Asdrubael Vect from his Tower of Flesh. Realspace is its larder.",
    books: [
      { title: "Path of the Dark Eldar", author: "Andy Chambers", tag: "Drukhari", setting: "Commorragh" },
      { title: "Asdrubael Vect (datasheet)", author: "GW", tag: "Tabletop", setting: "Commorragh" },
    ],
    events: [{ era: "M41.999", text: "The Twilight Pact — Vect schemes against Ynnari resurgence" }],
  },
  { id: "urdesh", name: "Urdesh", r: 0.50, a: 235, kind: "forge", faction: "imperium", segment: "pacificus",
    type: "Forge World · Sabbat",
    blurb: "Storm-lashed forge of the Sabbat Worlds. Lord Militant Macaroth ran the war from its smouldering palaces. The blade-makers of Urdesh are legendary.",
    books: [
      { title: "Salvation's Reach", author: "Dan Abnett", tag: "Ghosts", setting: "Urdesh" },
      { title: "The Warmaster", author: "Dan Abnett", tag: "Ghosts", setting: "Urdesh" },
    ],
    events: [{ era: "M41.995", text: "Battle of Eltath; Sek's archenemy hosts driven from the city" }],
  },
  { id: "balhaut", name: "Balhaut", r: 0.62, a: 255, kind: "war", faction: "imperium", segment: "pacificus",
    type: "War World · Sabbat",
    blurb: "The world that broke Slaydo's back. Won at terrible cost; the Plains of Balhaut are a graveyard the size of a continent.",
    books: [
      { title: "Blood Pact", author: "Dan Abnett", tag: "Ghosts", setting: "Balhaut" },
      { title: "First and Only", author: "Dan Abnett", tag: "Ghosts", setting: "Balhaut" },
    ],
    events: [{ era: "M41.957", text: "Battle of Balhaut — Warmaster Slaydo killed in the moment of victory" }],
  },
  { id: "herodor", name: "Herodor", r: 0.52, a: 240, kind: "shrine", faction: "imperium", segment: "pacificus",
    type: "Shrine World · Saint Sabbat",
    blurb: "Sabbat's tomb-shrine. The cathedral-canyons here are a place of pilgrimage; in M41 the Saint herself walked among them again.",
    books: [{ title: "Sabbat Martyr", author: "Dan Abnett", tag: "Ghosts", setting: "Herodor" }],
    events: [{ era: "M41.770", text: "Sabbat reincarnate on Herodor; Sanian becomes the Beati" }],
  },
  { id: "fortis-binary", name: "Fortis Binary", r: 0.58, a: 250, kind: "forge", faction: "imperium", segment: "pacificus",
    type: "Forge World · Twin-Star",
    blurb: "A forge orbiting twin suns. The Mechanicus engines here drove half of the Sabbat Crusade's armour. Lost twice to Chaos; reclaimed twice.",
    books: [{ title: "His Last Command", author: "Dan Abnett", tag: "Ghosts", setting: "Fortis Binary" }],
    events: [{ era: "M41.776", text: "Tanith First retake Fortis Binary from Blood Pact" }],
  },
  { id: "lucid", name: "Lucid Palatinate", r: 0.80, a: 230, kind: "civilised", faction: "imperium", segment: "pacificus",
    type: "Sector Capital · Astropathic Choir",
    blurb: "The shining administrative seat of the western reaches. A choir of three thousand astropaths translates the Crusade's every cipher.",
    books: [],
    events: [{ era: "M41.999", text: "Lucid Palatinate cuts off all signals during the Cicatrix opening" }],
  },
  { id: "valhalla", name: "Valhalla", r: 0.40, a: 275, kind: "death", faction: "imperium", segment: "pacificus",
    type: "Ice World · Ice Warriors",
    blurb: "An eternally winter-locked world. The Valhallan Ice Warriors are dour, patient, and grimly skilled at meat-grinder combat in any climate.",
    books: [
      { title: "Ciaphas Cain: For the Emperor", author: "Sandy Mitchell", tag: "Cain", setting: "Valhalla" },
      { title: "Ice Guard (omnibus)", author: "Sandy Mitchell", tag: "Valhalla", setting: "Valhalla" },
    ],
    events: [{ era: "M41.999", text: "Ice Warriors deploy to the broken Cadian salient" }],
  },
  { id: "salvation", name: "Salvation's Reach", r: 0.74, a: 270, kind: "war", faction: "imperium", segment: "pacificus",
    type: "Asteroid Fortress · Renegade Cache",
    blurb: "A heretic outpost hidden in deep void. The Tanith First raided it for the Blood Pact pheguth — one of the strangest operations of the Crusade.",
    books: [{ title: "Salvation's Reach", author: "Dan Abnett", tag: "Ghosts", setting: "Salvation's Reach" }],
    events: [{ era: "M41.789", text: "Tanith First strike Salvation's Reach; defection extracted" }],
  },
  { id: "rynns-world", name: "Rynn's World", r: 0.46, a: 262, kind: "astartes", faction: "imperium", segment: "pacificus",
    type: "Astartes Homeworld · Crimson Fists",
    blurb: "Wine-country and white cliffs. The Crimson Fists' fortress-monastery was atomised by a single misfire — the chapter has been near-broken ever since.",
    books: [{ title: "Rynn's World", author: "Steve Parker", tag: "Crimson Fists", setting: "Rynn's World" }],
    events: [{ era: "M41.989", text: "Waaagh! Snagrod devastates Rynn's World; Chapter Master Kantor leads survivors" }],
  },
];

export const SEGMENTUM_WORLDS: Readonly<Record<SegmentumId, readonly World[]>> = {
  solar: SOLAR_WORLDS,
  obscurus: OBSCURUS_WORLDS,
  ultima: ULTIMA_WORLDS,
  tempestus: TEMPESTUS_WORLDS,
  pacificus: PACIFICUS_WORLDS,
};

export const WORLD_KIND_GLYPHS: Readonly<Record<WorldKind, string>> = {
  throne: "◉",
  astartes: "◈",
  fortress: "◆",
  forge: "⌬",
  hive: "⬢",
  death: "✦",
  war: "✚",
  dead: "◌",
  warp: "✺",
  shrine: "☩",
  civilised: "○",
  xenos: "◬",
  chaos: "☄",
  necron: "⌖",
  tyranid: "◬",
};

export const FACTION_COLORS: Readonly<Record<Exclude<Faction, "neutral">, string>> = {
  imperium: "#f0b248",
  chaos: "#d04428",
  xenos: "#5cd09a",
  necron: "#7ad8a4",
  tyranid: "#c97ad8",
};

export function factionColor(f: Faction): string {
  if (f === "neutral") return "#888";
  return FACTION_COLORS[f];
}

export const SUB_SECTORS: readonly SubSector[] = [
  { name: "Calixis Sector", seg: "obscurus", r0: 0.55, r1: 0.82, a0: -63, a1: -45 },
  { name: "Gothic Sector", seg: "obscurus", r0: 0.32, r1: 0.65, a0: -20, a1: 5 },
  { name: "Scarus Sector", seg: "obscurus", r0: 0.40, r1: 0.78, a0: 5, a1: 25 },
  { name: "Realm of Ultramar", seg: "ultima", r0: 0.48, r1: 0.72, a0: 80, a1: 105 },
  { name: "Charadon Sector", seg: "ultima", r0: 0.55, r1: 0.85, a0: 115, a1: 142 },
  { name: "Eastern Fringe", seg: "ultima", r0: 0.78, r1: 0.98, a0: 115, a1: 148 },
  { name: "Sabbat Worlds", seg: "pacificus", r0: 0.42, r1: 0.72, a0: 230, a1: 258 },
  { name: "Reductus", seg: "tempestus", r0: 0.55, r1: 0.85, a0: 160, a1: 185 },
  { name: "Uhulis Sector", seg: "tempestus", r0: 0.35, r1: 0.60, a0: 195, a1: 213 },
];

export const NEBULAE_BASE: readonly Nebula[] = [
  { name: "Eye of Terror", r: 0.46, a: -55, size: 4.2, type: "warp", color: "#ff6644" },
  { name: "Maelstrom", r: 0.22, a: 110, size: 1.8, type: "warp", color: "#ff6644" },
  { name: "Siren's Storm", r: 0.30, a: 175, size: 2.4, type: "warp", color: "#ff6644" },
  { name: "Hadex Anomaly", r: 0.78, a: 120, size: 2.4, type: "warp", color: "#a8ff66" },
  { name: "Storm of the Emperor's Wrath", r: 0.50, a: 20, size: 2.2, type: "warp", color: "#ff8866" },
  { name: "Scourge Stars", r: 0.82, a: 116, size: 2.0, type: "warp", color: "#ff7744" },
  { name: "Ghoul Stars", r: 0.96, a: 70, size: 3.4, type: "forbidden", color: "#88bbff" },
  { name: "Halo Stars", r: 0.96, a: -85, size: 3.0, type: "forbidden", color: "#88bbff" },
  { name: "Veiled Region", r: 0.95, a: 200, size: 2.6, type: "forbidden", color: "#88bbff" },
  { name: "Malefactus", r: 0.94, a: 42, size: 2.4, type: "forbidden", color: "#88bbff" },
  { name: "Outrenacht", r: 0.68, a: -8, size: 1.6, type: "forbidden", color: "#88bbff" },
  { name: "Somnium Stars", r: 0.93, a: 75, size: 2.2, type: "forbidden", color: "#88bbff" },
  { name: "Darkhold", r: 0.85, a: -98, size: 1.8, type: "forbidden", color: "#88bbff" },
  { name: "Cicatrix Maledictum", isRift: true, color: "#ff3366" },
];

export const CICATRIX_PTS_BASE: readonly Polar[] = [
  [0.50, -55],
  [0.58, -20],
  [0.55, 20],
  [0.55, 55],
  [0.50, 92],
  [0.72, 118],
  [0.90, 122],
];

export const NECRON_DYNASTIES_BASE: readonly NecronDynasty[] = [
  {
    id: "sautekh",
    name: "Sautekh Dynasty",
    color: "#5cd09a",
    density: "high",
    pts: [
      [0.62, 105],
      [0.78, 115],
      [0.92, 130],
      [0.86, 145],
      [0.70, 138],
    ],
  },
  // Mephrit + Nihilakh removed 2026-06-13 (Philipp, Session 150 eyeballing) —
  // their ids are tombstoned in storage.ts so stale localStorage snapshots
  // can't resurrect them.
];

export const TYRANID_SWARMS_BASE: readonly TyranidSwarm[] = [
  {
    id: "leviathan",
    name: "Hive Fleet Leviathan",
    color: "#c97ad8",
    density: "high",
    pts: [
      [0.94, 70],
      [1.00, 85],
      [0.92, 100],
      [0.80, 88],
    ],
  },
];

// Spiral arm centerlines — 4 arms, 280° pitch, sampled out to r=1.6 every 0.02.
export const SPIRAL_ARMS: readonly (readonly Polar[])[] = (() => {
  const arms: Polar[][] = [];
  const ARMS_START = [0, 90, 180, 270];
  const PITCH = 280;
  for (const a0 of ARMS_START) {
    const pts: Polar[] = [];
    for (let r = 0.18; r <= 1.6 + 1e-9; r += 0.02) {
      const angle = a0 + PITCH * r;
      pts.push([r, angle]);
    }
    arms.push(pts);
  }
  return arms;
})();

// Default snapshot — what each era falls back to when its localStorage slot
// is empty. Frozen to prevent accidental mutation by display components.
// `structuredClone` instead of a JSON round-trip: same deep-copy result for
// this plain data, without the parse/stringify detour and its blind cast
// (Report 144 § T.4).
function deepClone<T>(v: T): T {
  return structuredClone(v);
}

export function makeDefaultGalaxyData(): GalaxyData {
  return {
    landmarks: deepClone(GALAXY_LANDMARKS_BASE) as Landmark[],
    nebulae: deepClone(NEBULAE_BASE) as Nebula[],
    cicatrix: deepClone(CICATRIX_PTS_BASE) as Polar[],
    necron: deepClone(NECRON_DYNASTIES_BASE) as NecronDynasty[],
    tyranid: deepClone(TYRANID_SWARMS_BASE) as TyranidSwarm[],
  };
}

export const DEFAULT_GALAXY_DATA: GalaxyData = Object.freeze(makeDefaultGalaxyData());

// Apply per-segment outer/boundary tweaks → fresh Segmentum array.
import type { Tweaks } from "./types";

export function getLiveSegments(tweaks: Tweaks): Segmentum[] {
  const base = SEGMENTUMS_BASE;
  const out: Segmentum[] = base.map((s) => ({ ...s }));
  const set = (id: SegmentumId, patch: Partial<Segmentum>) => {
    const idx = out.findIndex((s) => s.id === id);
    if (idx >= 0) out[idx] = { ...out[idx], ...patch };
  };
  set("obscurus", { a0: tweaks.boundaryNW - 360, a1: tweaks.boundaryNE, outer: tweaks.outerObscurus });
  set("ultima", { a0: tweaks.boundaryNE, a1: tweaks.boundarySE, outer: tweaks.outerUltima });
  set("tempestus", { a0: tweaks.boundarySE, a1: tweaks.boundarySW, outer: tweaks.outerTempestus });
  set("pacificus", { a0: tweaks.boundarySW, a1: tweaks.boundaryNW, outer: tweaks.outerPacificus });
  return out;
}

// Default tweaks — exact values from app.jsx /*EDITMODE-BEGIN*/ block.
export const DEFAULT_TWEAKS: Tweaks = {
  theme: "mechanicus",
  factionFilter: "all",
  riftPattern: "triangular",
  astronomican: false,
  editWarps: false,
  addMode: false,
  outerObscurus: 0.98,
  outerUltima: 1.30,
  outerTempestus: 0.80,
  outerPacificus: 0.64,
  boundaryNE: 35,
  boundarySE: 135,
  boundarySW: 233,
  boundaryNW: 319,
};
