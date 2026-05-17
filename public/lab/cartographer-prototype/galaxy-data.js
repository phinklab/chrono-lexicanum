// 40K Galaxy data — segmentums, iconic worlds, books, events
// Coordinates use polar form (radius 0-1, angle in degrees, 0° = up, clockwise)

window.SEGMENTUMS = [
  {
    id: 'solar',
    name: 'Segmentum Solar',
    short: 'SOLAR',
    // central disc
    inner: 0, outer: 0.18,
    a0: 0, a1: 360,
    color: '#9aa0a8',
    lore: 'The beating heart of the Imperium. Holy Terra, the Throneworld, sits at the center of human civilization — guarded by the Sol Defence Fleet and the Adeptus Custodes.',
  },
  {
    id: 'obscurus',
    name: 'Segmentum Obscurus',
    short: 'OBSCURUS',
    inner: 0.18, outer: 1.0,
    a0: -65, a1: 25,
    color: '#b8413f',
    lore: 'The cursed northern reaches. Home to the Eye of Terror, the Cadian Gate, and the eternal vigil against the Ruinous Powers.',
  },
  {
    id: 'ultima',
    name: 'Segmentum Ultima',
    short: 'ULTIMA',
    inner: 0.18, outer: 1.0,
    a0: 25, a1: 155,
    color: '#6e7480',
    lore: 'The vast eastern segmentum. Realm of the Ultramarines, the T\'au Empire, and the Eastern Fringe — where Hive Fleets first cast their shadow upon the galaxy.',
  },
  {
    id: 'tempestus',
    name: 'Segmentum Tempestus',
    short: 'TEMPESTUS',
    inner: 0.18, outer: 1.0,
    a0: 155, a1: 215,
    color: '#3a6db8',
    lore: 'The southern wilds. Hard, feral worlds breeding the Imperium\'s finest soldiers — Catachans, Tallarns, Mordians. A frontier of unending war.',
  },
  {
    id: 'pacificus',
    name: 'Segmentum Pacificus',
    short: 'PACIFICUS',
    inner: 0.18, outer: 1.0,
    a0: 215, a1: 295,
    color: '#3f7d52',
    lore: 'The western reaches. The Sabbat Worlds Crusade tore through these stars; warp storms make every passage a gamble against oblivion.',
  },
];

// Galaxy-view labeled landmarks (sparse — segmentum names + iconic worlds)
window.GALAXY_LANDMARKS = [
  { id: 'terra', name: 'TERRA', r: 0.02, a: 0, kind: 'throne', faction: 'imperium', segment: 'solar' },
  { id: 'cadia', name: 'CADIA', r: 0.42, a: -25, kind: 'fortress', faction: 'imperium', segment: 'obscurus' },
  { id: 'eye', name: 'EYE OF TERROR', r: 0.46, a: -55, kind: 'warp', faction: 'chaos', segment: 'obscurus' },
  { id: 'macragge', name: 'MACRAGGE', r: 0.62, a: 92, kind: 'astartes', faction: 'imperium', segment: 'ultima' },
  { id: 'armageddon', name: 'ARMAGEDDON', r: 0.32, a: 18, kind: 'hive', faction: 'imperium', segment: 'ultima' },
  { id: 'fenris', name: 'FENRIS', r: 0.55, a: -15, kind: 'astartes', faction: 'imperium', segment: 'obscurus' },
  { id: 'baal', name: 'BAAL', r: 0.78, a: 80, kind: 'astartes', faction: 'imperium', segment: 'ultima' },
  { id: 'tau-sept', name: 'T\'AU', r: 0.86, a: 105, kind: 'xenos', faction: 'xenos', segment: 'ultima' },
  { id: 'commorragh', name: 'COMMORRAGH', r: 0.88, a: 245, kind: 'xenos', faction: 'xenos', segment: 'pacificus' },
  { id: 'catachan', name: 'CATACHAN', r: 0.55, a: 185, kind: 'death', faction: 'imperium', segment: 'tempestus' },
];

// Ultima segmentum detail — dense star field of named worlds
// Local polar coords relative to a wedge centered at angle 90° from origin
// We'll render them mapped onto the wedge.
window.ULTIMA_WORLDS = [
  // Realm of Ultramar cluster (signature)
  { id: 'macragge', name: 'Macragge', r: 0.62, a: 92, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Homeworld · Realm of Ultramar',
    blurb: 'Throneworld of the XIII Legion. From its mountain-fortress, Roboute Guilliman commands the Indomitus Crusade. The most studied world in the eastern Imperium.',
    books: [
      { title: 'Dark Imperium', author: 'Guy Haley', tag: 'Indomitus' },
      { title: 'Know No Fear', author: 'Dan Abnett', tag: 'Heresy' },
      { title: 'The Chapter\'s Due', author: 'Graham McNeill', tag: 'Uriel Ventris' },
    ],
    events: [
      { era: 'M31.005', text: 'Calth Atrocity — Word Bearers betray the Ultramarines at Calth' },
      { era: 'M42.011', text: 'Resurrection of Guilliman; Macragge becomes capital of Imperium Sanctus' },
    ],
  },
  { id: 'calth', name: 'Calth', r: 0.58, a: 88, kind: 'death', faction: 'imperium',
    type: 'Shrine World · Subterranean Refuge',
    blurb: 'Once a thriving forge-belt, scorched lifeless during the Heresy. Survivors live in vast arcologies beneath the irradiated surface.',
    books: [
      { title: 'Know No Fear', author: 'Dan Abnett', tag: 'Heresy' },
      { title: 'Born of Flame', author: 'Nick Kyme', tag: 'Underworld War' },
    ],
    events: [
      { era: 'M31.005', text: 'Word Bearers detonate the system\'s star; surface rendered uninhabitable' },
    ],
  },
  { id: 'prandium', name: 'Prandium', r: 0.66, a: 95, kind: 'dead', faction: 'tyranid',
    type: 'Dead World · Devoured',
    blurb: 'A paradise garden-world of Ultramar. Stripped to bare rock by Hive Fleet Behemoth in the First Tyrannic War. A scar on the Chapter\'s soul.',
    books: [{ title: 'Devastation of Baal', author: 'Guy Haley', tag: 'Tyranid War' }],
    events: [{ era: 'M41.745', text: 'Hive Fleet Behemoth strips Prandium in eleven hours' }],
  },
  // Baal cluster
  { id: 'baal', name: 'Baal', r: 0.78, a: 80, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Homeworld · Blood Angels',
    blurb: 'A blood-red desert world orbiting a dying star. Sanguinius fell here in spirit before the Heresy ever began. The Flesh Tearers and Blood Angels muster from its moons.',
    books: [
      { title: 'Devastation of Baal', author: 'Guy Haley', tag: 'Tyranid' },
      { title: 'The Red Angel', author: 'James Swallow', tag: 'Mephiston' },
    ],
    events: [
      { era: 'M41.999', text: 'Hive Fleet Leviathan assaults Baal; the Great Rift opens above the system' },
    ],
  },
  { id: 'cryptus', name: 'Cryptus System', r: 0.82, a: 76, kind: 'war', faction: 'imperium',
    type: 'War World · Outer Baal Approach',
    blurb: 'A constellation of mining and agri-worlds. The Blood Angels\' delaying action here bought Baal weeks of preparation against Leviathan.',
    books: [{ title: 'Death of Integrity', author: 'Guy Haley', tag: 'Boarding Action' }],
    events: [{ era: 'M41.998', text: 'Battle of Asphodex — Mephiston duels the Swarmlord' }],
  },
  // Forge / industry
  { id: 'graia', name: 'Graia', r: 0.46, a: 60, kind: 'forge', faction: 'imperium',
    type: 'Forge World',
    blurb: 'Pattern-source of the Warlord Titan. Briefly fell to a Khornate incursion; reclaimed by the Ultramarines in a campaign that defined a generation.',
    books: [{ title: 'Space Marine (novelization)', author: 'Aaron Dembski-Bowden', tag: 'Titus' }],
    events: [{ era: 'M41.745', text: 'Ork-then-Chaos invasion broken by Captain Titus, 2nd Company' }],
  },
  { id: 'agripinaa', name: 'Agripinaa', r: 0.38, a: 45, kind: 'forge', faction: 'imperium',
    type: 'Forge World',
    blurb: 'A grim ash-shrouded forge providing the bulk of Cadian Shock pattern lasguns. Survived the 13th Black Crusade by a hair.',
    books: [{ title: 'Cadian Honour', author: 'Justin D Hill', tag: 'Cadia' }],
    events: [{ era: 'M41.999', text: 'Eye of Terror Campaign — bombarded for months, survives intact' }],
  },
  // Xenos
  { id: 'tau', name: 'T\'au', r: 0.86, a: 105, kind: 'xenos', faction: 'xenos',
    type: 'Xenos Capital · T\'au Sept',
    blurb: 'Capital of the upstart T\'au Empire. The Greater Good radiates outward from this temperate cradle. A rising threat the Imperium has yet to take seriously.',
    books: [
      { title: 'Fire Caste', author: 'Peter Fehervari', tag: 'T\'au' },
      { title: 'Shadowsun', author: 'Braden Campbell', tag: 'Commander' },
    ],
    events: [{ era: 'M42.012', text: 'Fourth Sphere Expansion — T\'au advance into the Damocles Gulf' }],
  },
  { id: 'iyanden', name: 'Iyanden', r: 0.92, a: 95, kind: 'xenos', faction: 'xenos',
    type: 'Craftworld · Aeldari',
    blurb: 'A craftworld of the dead. Soulstones outnumber the living. Yriel and Yvraine still walk its corridors of frosted bone-coral.',
    books: [{ title: 'Path of the Eldar (omnibus)', author: 'Gav Thorpe', tag: 'Eldar' }],
    events: [{ era: 'M41.992', text: 'Hive Fleet Kraken assault repulsed at terrible cost' }],
  },
  { id: 'octarius', name: 'Octarius', r: 0.62, a: 122, kind: 'xenos', faction: 'xenos',
    type: 'Ork Empire · The Octarius War',
    blurb: 'Ghazghkull\'s great empire. The Deathwatch engineered a Tyranid incursion to bleed both threats against each other. It is working — for now.',
    books: [{ title: 'Damocles', author: 'Various', tag: 'Anthology' }],
    events: [{ era: 'M41.998', text: 'Octarius War ignites; entire systems consumed in cross-fire' }],
  },
  // Death & forbidden
  { id: 'mortarion', name: 'Plague Planet', r: 0.32, a: 110, kind: 'chaos', faction: 'chaos',
    type: 'Daemon World · Nurgle',
    blurb: 'Mortarion\'s Garden, dragged from the Eye into realspace. A world that festers with grandfatherly love. The source of the Plague War against Ultramar.',
    books: [
      { title: 'Dark Imperium: Plague War', author: 'Guy Haley', tag: 'Mortarion' },
      { title: 'The Buried Dagger', author: 'James Swallow', tag: 'Death Guard' },
    ],
    events: [{ era: 'M42.012', text: 'Mortarion invades Ultramar with Seven Pox-Legions' }],
  },
  { id: 'iax', name: 'Iax', r: 0.54, a: 86, kind: 'dead', faction: 'imperium',
    type: 'Garden World · Plague-Stricken',
    blurb: 'Once the Garden of Ultramar. Mortarion\'s arrival transformed its rolling green hills into rotting fenlands. Reclaimed in name only.',
    books: [{ title: 'Dark Imperium: Plague War', author: 'Guy Haley', tag: 'Plague War' }],
    events: [{ era: 'M42.012', text: 'Battle of Iax — Guilliman duels Mortarion in the Sanguistar' }],
  },
  // Hive & civilian
  { id: 'armageddon', name: 'Armageddon', r: 0.32, a: 18, kind: 'hive', faction: 'imperium',
    type: 'Hive World · Industrial',
    blurb: 'Three wars in three centuries. The Steel Legion is forged from its ashen wastes; Ghazghkull Mag Uruk Thraka has unfinished business here.',
    books: [
      { title: 'Helsreach', author: 'Aaron Dembski-Bowden', tag: 'Black Templars' },
      { title: 'Yarrick: Imperial Creed', author: 'David Annandale', tag: 'Commissar' },
    ],
    events: [{ era: 'M41.998', text: 'Third War for Armageddon — Ghazghkull returns, devastates Helsreach' }],
  },
  { id: 'tartarus', name: 'Tartarus', r: 0.72, a: 130, kind: 'war', faction: 'imperium',
    type: 'War World · Eastern Fringe',
    blurb: 'A world that nearly burned an Eldar Craftworld out of the warp. Captain Gabriel Angelos still bears its scars.',
    books: [{ title: 'Dawn of War (novelization)', author: 'C S Goto', tag: 'Blood Ravens' }],
    events: [{ era: 'M41.998', text: 'Maledictum unleashed; Blood Ravens fight to seal it' }],
  },
  { id: 'damnos', name: 'Damnos', r: 0.86, a: 118, kind: 'dead', faction: 'necron',
    type: 'Dead World · Necron Tomb',
    blurb: 'An ice-world that woke screaming. The Ultramarines lost Damnos to the Necrons of the Sautekh Dynasty. Cato Sicarius has not forgotten.',
    books: [
      { title: 'Damnos', author: 'Nick Kyme', tag: 'Ultramarines' },
      { title: 'Fall of Damnos', author: 'Nick Kyme', tag: 'Ultramarines' },
    ],
    events: [{ era: 'M41.974', text: 'Necron awakening; surface population annihilated' }],
  },
  // Shrine and pilgrim
  { id: 'espandor', name: 'Espandor', r: 0.50, a: 100, kind: 'civilised', faction: 'imperium',
    type: 'Civilised World',
    blurb: 'A core world of Ultramar. Site of the Battle of the Spirae Macria during the Plague War.',
    books: [{ title: 'Dark Imperium', author: 'Guy Haley', tag: 'Indomitus' }],
    events: [{ era: 'M42.012', text: 'Espandor liberation — Primaris debut combat operations' }],
  },
  { id: 'parmenio', name: 'Parmenio', r: 0.56, a: 104, kind: 'civilised', faction: 'imperium',
    type: 'Civilised World · Ultramar',
    blurb: 'A jewel-world of the 500 Worlds. Resisted plague-corruption longer than any neighbor.',
    books: [{ title: 'Dark Imperium: Godblight', author: 'Guy Haley', tag: 'Plague War' }],
    events: [{ era: 'M42.012', text: 'Siege of Parmenio broken by the Unnumbered Sons' }],
  },
  { id: 'ichar', name: 'Ichar IV', r: 0.74, a: 110, kind: 'hive', faction: 'imperium',
    type: 'Hive World',
    blurb: 'Site of the Macragge Veteran\'s last stand against Hive Fleet Kraken. A million-strong Genestealer cult emerged in the lower hives.',
    books: [{ title: 'The Hive Fleets (compendium)', author: 'Various', tag: 'Tyranid' }],
    events: [{ era: 'M41.992', text: 'Hive Fleet Kraken — splinter swarm crushed after Genestealer uprising' }],
  },
  // The Fringe
  { id: 'medusa-v', name: 'Medusa V', r: 0.92, a: 130, kind: 'dead', faction: 'imperium',
    type: 'Lost World · Eastern Fringe',
    blurb: 'The Black Crusade of Ahriman, the Eldar of Biel-Tan, and the Tyranid vanguard — all converged here. The world is no more.',
    books: [{ title: 'Medusa V Campaign Book', author: 'Games Workshop', tag: 'Apocalypse' }],
    events: [{ era: 'M41.999', text: 'Six-way war ends in cataclysm; planet shattered' }],
  },
  { id: 'kronus', name: 'Kronus', r: 0.84, a: 134, kind: 'war', faction: 'imperium',
    type: 'War World',
    blurb: 'Seven factions, one planet. The Dark Crusade saw Necrons, Tau, Eldar, Orks, Chaos and two Astartes Chapters bleed for this contested rock.',
    books: [{ title: 'Dawn of War: Dark Crusade', author: 'C S Goto', tag: 'Blood Ravens' }],
    events: [{ era: 'M41.997', text: 'The Dark Crusade — seven-faction war for orbital strategic dominance' }],
  },
];

// ─────────────────────────────────────────────────────────────
// SEGMENTUM SOLAR — the heart, Sol System and its near approaches.
// Local polar coords use the Solar wedge (radius 0–0.18 from galactic center).
// ─────────────────────────────────────────────────────────────
window.SOLAR_WORLDS = [
  { id: 'terra', name: 'Terra', r: 0.02, a: 0, kind: 'throne', faction: 'imperium',
    type: 'Throneworld · Sol System',
    blurb: 'The cradle of mankind. Beneath the Imperial Palace, the Emperor sits on the Golden Throne, His soul lashed to the Astronomican to guide ten thousand worlds through the warp.',
    books: [
      { title: 'The End and the Death', author: 'Dan Abnett', tag: 'Heresy' },
      { title: 'The Master of Mankind', author: 'Aaron Dembski-Bowden', tag: 'Custodes' },
      { title: 'Watchers of the Throne', author: 'Chris Wraight', tag: 'Vigil' },
    ],
    events: [
      { era: 'M31.014', text: 'Siege of Terra — Horus storms the Imperial Palace' },
      { era: 'M42.012', text: 'Guilliman returns to Terra, summoned by his father' },
    ],
  },
  { id: 'luna', name: 'Luna', r: 0.05, a: 22, kind: 'civilised', faction: 'imperium',
    type: 'Moon · Selenar Gene-Cradles',
    blurb: 'Terra\'s pale companion. The Selenar gene-cults still operate beneath its dust, breeding the Adeptus Custodes from harvested Imperial blood.',
    books: [{ title: 'Saturnine', author: 'Dan Abnett', tag: 'Heresy' }],
    events: [{ era: 'M30.785', text: 'Luna brought into compliance; gene-cults sworn to the Emperor' }],
  },
  { id: 'mars', name: 'Mars', r: 0.07, a: 198, kind: 'forge', faction: 'imperium',
    type: 'Forge World · Sacred Mars',
    blurb: 'The Red Planet. Holiest forge in the Imperium, capital of the Adeptus Mechanicus, home to the Fabricator-General and the Noctis Labyrinth.',
    books: [
      { title: 'Mechanicum', author: 'Graham McNeill', tag: 'Heresy' },
      { title: 'Lords of Mars', author: 'Graham McNeill', tag: 'Adeptus Mechanicus' },
    ],
    events: [
      { era: 'M31.006', text: 'Schism of Mars — half the Mechanicum sides with Horus' },
      { era: 'M42.013', text: 'Cawl reveals Primaris designs to the resurrected Guilliman' },
    ],
  },
  { id: 'titan', name: 'Titan', r: 0.12, a: 118, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Fortress · Grey Knights',
    blurb: 'Sixth moon of Saturn. The Citadel of Titan is closed to all but the Grey Knights — the Emperor\'s hidden weapon against the daemon.',
    books: [
      { title: 'Grey Knights', author: 'Ben Counter', tag: 'Daemon Hunt' },
      { title: 'Hammer of Daemons', author: 'Ben Counter', tag: 'Grey Knights' },
    ],
    events: [{ era: 'M41.999', text: 'Aurelian Crusade — Grey Knights deploy en-masse for the first time in millennia' }],
  },
  { id: 'inwit', name: 'Inwit', r: 0.15, a: 240, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Homeworld · Imperial Fists',
    blurb: 'An ice-bound rogue world on the Solar fringe. Rogal Dorn\'s cradle. The Imperial Fists rarely return; their fleet IS the chapter.',
    books: [{ title: 'Praetorian of Dorn', author: 'John French', tag: 'Heresy' }],
    events: [{ era: 'M30.732', text: 'Dorn discovered by the Emperor in the Inwit Cluster' }],
  },
  { id: 'pluto', name: 'Pluto', r: 0.16, a: 320, kind: 'fortress', faction: 'imperium',
    type: 'Fortress Moon · Sol Picket',
    blurb: 'The outer rampart of the Sol System. Its frozen moons bristle with macrocannon batteries and torpedo silos overseen by the Imperial Fists.',
    books: [{ title: 'The Solar War', author: 'John French', tag: 'Heresy' }],
    events: [{ era: 'M31.013', text: 'Battle of Pluto — Iron Warriors break the outer Sol cordon' }],
  },
  { id: 'uranus', name: 'Uranus Approach', r: 0.13, a: 62, kind: 'war', faction: 'imperium',
    type: 'Naval Anchorage',
    blurb: 'Picket point for the Sol Defence Fleet. Every astropath in Sol can feel the chains of psychic anchors holding the warp at bay here.',
    books: [],
    events: [{ era: 'M31.013', text: 'Outer fleet engagements during the Siege' }],
  },
  { id: 'ganymede', name: 'Ganymede', r: 0.10, a: 305, kind: 'hive', faction: 'imperium',
    type: 'Hive Moon · Jovian',
    blurb: 'Largest moon of Jupiter. The Jovian Hives produce the void-craft of the Sol Defence Fleet — the master shipwrights of the Imperium.',
    books: [],
    events: [{ era: 'M31.014', text: 'Jovian shipyards seized to keep the loyal fleet supplied' }],
  },
];

// ─────────────────────────────────────────────────────────────
// SEGMENTUM OBSCURUS — the cursed north. Eye of Terror, Cadian Gate.
// ─────────────────────────────────────────────────────────────
window.OBSCURUS_WORLDS = [
  { id: 'cadia', name: 'Cadia', r: 0.42, a: -25, kind: 'fortress', faction: 'imperium',
    type: 'Fortress World · Cadian Gate',
    blurb: 'The single Imperial stronghold barring the Eye of Terror. Every Cadian is born with eyes of violet, marked by the warp before they ever learn to shoot.',
    books: [
      { title: 'Cadian Honour', author: 'Justin D Hill', tag: 'Cadia' },
      { title: 'Cadia Stands', author: 'Justin D Hill', tag: '13th Black Crusade' },
    ],
    events: [
      { era: 'M41.999', text: '13th Black Crusade — Cadia broken; Abaddon\'s Blackstone Fortress crashes the planet' },
    ],
  },
  { id: 'eye', name: 'Eye of Terror', r: 0.46, a: -55, kind: 'warp', faction: 'chaos',
    type: 'Warp Rift · The Eye',
    blurb: 'A wound in reality where the Eldar empire died. Within float the daemon-worlds of the Traitor Legions and the Black Crusade staging grounds. Time has no meaning here.',
    books: [
      { title: 'The First Heretic', author: 'Aaron Dembski-Bowden', tag: 'Word Bearers' },
      { title: 'Talon of Horus', author: 'Aaron Dembski-Bowden', tag: 'Black Legion' },
    ],
    events: [
      { era: 'M31.005', text: 'Traitor Legions retreat into the Eye after Terra' },
      { era: 'M42.000', text: 'Cicatrix Maledictum tears open from the Eye to the Eastern Fringe' },
    ],
  },
  { id: 'fenris', name: 'Fenris', r: 0.55, a: -15, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Homeworld · Space Wolves',
    blurb: 'A death-world of glaciers and kraken-seas. The Sky-Warriors of Russ stalk its mountains in Wulfen form; their dead are buried on the Wolfsfang.',
    books: [
      { title: 'A Thousand Sons', author: 'Graham McNeill', tag: 'Heresy' },
      { title: 'Wolf King', author: 'Chris Wraight', tag: 'Space Wolves' },
    ],
    events: [
      { era: 'M31.004', text: 'The Wolves at the Door — Russ leads the assault on Prospero' },
    ],
  },
  { id: 'sortiarius', name: 'Sortiarius', r: 0.82, a: -52, kind: 'chaos', faction: 'chaos',
    type: 'Daemon World · Planet of the Sorcerers',
    blurb: 'Prospero, dragged into the Eye and reforged by Tzeentch. From its glassy spires Magnus the Red plots vengeance against the Allfather and against Russ.',
    books: [
      { title: 'A Thousand Sons', author: 'Graham McNeill', tag: 'Heresy' },
      { title: 'The Crimson King', author: 'Graham McNeill', tag: 'Thousand Sons' },
    ],
    events: [{ era: 'M42.012', text: 'Magnus launches the assault on Fenris' }],
  },
  { id: 'medrengard', name: 'Medrengard', r: 0.72, a: -58, kind: 'chaos', faction: 'chaos',
    type: 'Daemon World · Iron Warriors',
    blurb: 'A planet of black iron and slave-pits. Perturabo\'s eternal forge churns out siege-engines for the next Long War.',
    books: [{ title: 'Storm of Iron', author: 'Graham McNeill', tag: 'Iron Warriors' }],
    events: [{ era: 'M41.997', text: 'Hydra Cordatus campaign launches from Medrengard\'s yards' }],
  },
  { id: 'caliban', name: 'Caliban (Lost)', r: 0.66, a: -45, kind: 'dead', faction: 'imperium',
    type: 'Lost World · Fragmented',
    blurb: 'The Lion\'s homeworld, shattered at the end of the Heresy. Its fragments drift in the Eye, hunted by the Fallen and the Dark Angels who chase them.',
    books: [
      { title: 'Descent of Angels', author: 'Mitchel Scanlon', tag: 'Heresy' },
      { title: 'Angels of Caliban', author: 'Gav Thorpe', tag: 'Heresy' },
    ],
    events: [{ era: 'M31.013', text: 'Caliban sundered as Luther turns on his brothers' }],
  },
  { id: 'krieg', name: 'Krieg', r: 0.50, a: -10, kind: 'death', faction: 'imperium',
    type: 'Death World · Atomic Waste',
    blurb: 'A radioactive nightmare. The Death Korps wear sealed greatcoats and gas-masks; they fight to atone for a sin five hundred years old.',
    books: [
      { title: 'Dead Men Walking', author: 'Steve Lyons', tag: 'Krieg' },
      { title: 'Krieg', author: 'Steve Lyons', tag: 'Death Korps' },
    ],
    events: [{ era: 'M36.811', text: 'Krieg purges itself with atomics to expunge a heretic governor' }],
  },
  { id: 'vraks', name: 'Vraks', r: 0.36, a: -5, kind: 'war', faction: 'imperium',
    type: 'Munitions Depot · Lost Cause',
    blurb: 'Once a vast Imperial armoury. Cardinal Xaphan turned it heretic. Seventeen years of trench warfare in nuclear winter to reclaim it.',
    books: [{ title: 'Imperial Armour: Siege of Vraks', author: 'Forge World', tag: 'Krieg' }],
    events: [{ era: 'M41.815', text: 'Siege of Vraks concludes; Death Korps casualty count classified' }],
  },
  { id: 'tallarn', name: 'Tallarn', r: 0.32, a: -50, kind: 'death', faction: 'imperium',
    type: 'Desert World · Armoured Regiments',
    blurb: 'Once a verdant world. Iron Warriors scorched it with virus bombs during the Heresy. Now an endless desert of dust and armoured columns.',
    books: [
      { title: 'Tallarn: Ironclad', author: 'John French', tag: 'Heresy' },
      { title: 'Tallarn', author: 'John French', tag: 'Heresy' },
    ],
    events: [{ era: 'M31.011', text: 'Battle of Tallarn — largest armoured engagement in human history' }],
  },
  { id: 'mordian', name: 'Mordian', r: 0.58, a: 10, kind: 'civilised', faction: 'imperium',
    type: 'Tidally-Locked World · Iron Guard',
    blurb: 'A world of perpetual night, lit only by city-glow. The Mordian Iron Guard parade in dazzling regimentals — a discipline forged by darkness.',
    books: [{ title: 'Mordian Iron Guard (codex entries)', author: 'Various', tag: 'Guard' }],
    events: [{ era: 'M41.999', text: 'Mordian regiments lost in the Cadian Gate collapse' }],
  },
  { id: 'belis-corona', name: 'Belis Corona', r: 0.30, a: 18, kind: 'fortress', faction: 'imperium',
    type: 'Fortress World · Sector Capital',
    blurb: 'The strategic anchor of the Cadian Gate\'s southern approach. After Cadia fell, Belis Corona inherited the entire war.',
    books: [],
    events: [{ era: 'M42.000', text: 'Belis Corona musters the largest Crusade host since the Great Crusade' }],
  },
  { id: 'cypra-mundi', name: 'Cypra Mundi', r: 0.62, a: -38, kind: 'fortress', faction: 'imperium',
    type: 'Naval Bastion · Battlefleet Obscurus',
    blurb: 'Headquarters of Battlefleet Obscurus. From its orbital docks the Imperial Navy fields the largest warp-fleet in the Imperium.',
    books: [],
    events: [{ era: 'M41.999', text: 'Cypra Mundi rallies the surviving Battlefleet after the Fall of Cadia' }],
  },
];

// ─────────────────────────────────────────────────────────────
// SEGMENTUM TEMPESTUS — the southern wilds. Hard worlds, hard soldiers.
// ─────────────────────────────────────────────────────────────
window.TEMPESTUS_WORLDS = [
  { id: 'catachan', name: 'Catachan', r: 0.55, a: 185, kind: 'death', faction: 'imperium',
    type: 'Death World · Jungle',
    blurb: 'A green hell where the trees eat children and the children grow into Catachan Jungle Fighters. Even the brushwood here has teeth.',
    books: [
      { title: 'Death World', author: 'Steve Lyons', tag: 'Catachans' },
      { title: 'Rebel Winter', author: 'Steve Parker', tag: 'Catachans' },
    ],
    events: [{ era: 'M41.835', text: 'Catachan II "The Bloody Devils" forged in the Bloodmist Expansion' }],
  },
  { id: 'sirens-storm', name: 'Siren\'s Storm', r: 0.30, a: 175, kind: 'warp', faction: 'chaos',
    type: 'Warp Rift · Renegade Haven',
    blurb: 'A howling warp-storm in the southern reaches. Renegade fleets, traitor lords and Red Corsairs make their lairs in its eye; astropaths who linger too long hear voices they cannot un-learn.',
    books: [{ title: 'Red Tithe', author: 'Nick Kyme', tag: 'Carcharodons' }],
    events: [{ era: 'M41.999', text: 'Huron Blackheart\'s Tyrant\'s Claw raids deep into Tempestus from the Storm' }],
  },
  { id: 'nocturne', name: 'Nocturne', r: 0.46, a: 168, kind: 'astartes', faction: 'imperium',
    type: 'Death World · Salamanders',
    blurb: 'A volcanic crucible bound in close orbit with its sister moon Prometheus. The Salamanders forge as readily as they fight; Vulkan walked here as one of them.',
    books: [
      { title: 'Salamanders Omnibus', author: 'Nick Kyme', tag: 'Salamanders' },
      { title: 'Vulkan Lives', author: 'Nick Kyme', tag: 'Heresy' },
    ],
    events: [{ era: 'M41.999', text: 'The Damnos Liberation — Vulkan returns from the warp' }],
  },
  { id: 'bakka', name: 'Bakka', r: 0.66, a: 200, kind: 'fortress', faction: 'imperium',
    type: 'Naval Bastion · Battlefleet Tempestus',
    blurb: 'Anchorage and shipyard of Battlefleet Tempestus. Half-built grand cruisers hang in voidlock above its blue-grey oceans.',
    books: [],
    events: [{ era: 'M41.998', text: 'Bakka mobilises the southern fleets against the Sabbat Crusade reinforcements' }],
  },
  { id: 'pavonis', name: 'Pavonis', r: 0.84, a: 180, kind: 'hive', faction: 'imperium',
    type: 'Hive World · Tau Border',
    blurb: 'A trade-rich hive on the Tempestus rim. The proximity of the T\'au Empire has bred a class of merchant-princes the Inquisition watches closely.',
    books: [{ title: 'Nightbringer', author: 'Graham McNeill', tag: 'Ultramarines' }],
    events: [{ era: 'M41.987', text: 'Genestealer infiltration of the Pavonis trade cartels uncovered' }],
  },
  { id: 'vorlese', name: 'Vorlese', r: 0.62, a: 215, kind: 'civilised', faction: 'imperium',
    type: 'Civilised World · Sector Capital',
    blurb: 'A civilised core-world; clean streets and bone-white spires. Beneath the surface, an indolent nobility plays dangerous games with forbidden lore.',
    books: [],
    events: [{ era: 'M41.998', text: 'Inquisitorial sweep cleanses 47 noble houses in a single night' }],
  },
  { id: 'spinward-front', name: 'Spinward Front', r: 0.78, a: 158, kind: 'war', faction: 'imperium',
    type: 'War Region · Triple Front',
    blurb: 'A long sector-line where Imperium, Orks of Charadon and breakaway Severan Dominate grind against each other. The Astra Militarum feed soldiers in by the trainload.',
    books: [{ title: 'Only War (rulebook)', author: 'Fantasy Flight', tag: 'Tabletop' }],
    events: [{ era: 'M41.996', text: 'Severan Dominate declares secession; Spinward Front ignites' }],
  },
  { id: 'cthonia-lost', name: 'Cthonia (Cinder)', r: 0.42, a: 210, kind: 'dead', faction: 'imperium',
    type: 'Dead World · Cratered',
    blurb: 'A mining-warren where Horus was born to gang-warfare. After the Heresy, loyal forces irradiated the planet to slag. Nothing now stirs.',
    books: [{ title: 'Horus Rising', author: 'Dan Abnett', tag: 'Heresy' }],
    events: [{ era: 'M31.014', text: 'Cthonia sterilised by orbital lance fire' }],
  },
];

// ─────────────────────────────────────────────────────────────
// SEGMENTUM PACIFICUS — the western reaches. Sabbat Worlds, warp storms.
// ─────────────────────────────────────────────────────────────
window.PACIFICUS_WORLDS = [
  { id: 'commorragh', name: 'Commorragh', r: 0.88, a: 245, kind: 'xenos', faction: 'xenos',
    type: 'Webway City · Dark Eldar Capital',
    blurb: 'The Dark City. A labyrinth-spire spanning a hundred warp-tributaries, ruled by Asdrubael Vect from his Tower of Flesh. Realspace is its larder.',
    books: [
      { title: 'Path of the Dark Eldar', author: 'Andy Chambers', tag: 'Drukhari' },
      { title: 'Asdrubael Vect (datasheet)', author: 'GW', tag: 'Tabletop' },
    ],
    events: [{ era: 'M41.999', text: 'The Twilight Pact — Vect schemes against Ynnari resurgence' }],
  },
  { id: 'urdesh', name: 'Urdesh', r: 0.50, a: 235, kind: 'forge', faction: 'imperium',
    type: 'Forge World · Sabbat',
    blurb: 'Storm-lashed forge of the Sabbat Worlds. Lord Militant Macaroth ran the war from its smouldering palaces. The blade-makers of Urdesh are legendary.',
    books: [
      { title: 'Salvation\'s Reach', author: 'Dan Abnett', tag: 'Ghosts' },
      { title: 'The Warmaster', author: 'Dan Abnett', tag: 'Ghosts' },
    ],
    events: [{ era: 'M41.995', text: 'Battle of Eltath; Sek\'s archenemy hosts driven from the city' }],
  },
  { id: 'balhaut', name: 'Balhaut', r: 0.62, a: 255, kind: 'war', faction: 'imperium',
    type: 'War World · Sabbat',
    blurb: 'The world that broke Slaydo\'s back. Won at terrible cost; the Plains of Balhaut are a graveyard the size of a continent.',
    books: [
      { title: 'Blood Pact', author: 'Dan Abnett', tag: 'Ghosts' },
      { title: 'First and Only', author: 'Dan Abnett', tag: 'Ghosts' },
    ],
    events: [{ era: 'M41.957', text: 'Battle of Balhaut — Warmaster Slaydo killed in the moment of victory' }],
  },
  { id: 'herodor', name: 'Herodor', r: 0.52, a: 240, kind: 'shrine', faction: 'imperium',
    type: 'Shrine World · Saint Sabbat',
    blurb: 'Sabbat\'s tomb-shrine. The cathedral-canyons here are a place of pilgrimage; in M41 the Saint herself walked among them again.',
    books: [{ title: 'Sabbat Martyr', author: 'Dan Abnett', tag: 'Ghosts' }],
    events: [{ era: 'M41.770', text: 'Sabbat reincarnate on Herodor; Sanian becomes the Beati' }],
  },
  { id: 'fortis-binary', name: 'Fortis Binary', r: 0.58, a: 250, kind: 'forge', faction: 'imperium',
    type: 'Forge World · Twin-Star',
    blurb: 'A forge orbiting twin suns. The Mechanicus engines here drove half of the Sabbat Crusade\'s armour. Lost twice to Chaos; reclaimed twice.',
    books: [{ title: 'His Last Command', author: 'Dan Abnett', tag: 'Ghosts' }],
    events: [{ era: 'M41.776', text: 'Tanith First retake Fortis Binary from Blood Pact' }],
  },
  { id: 'lucid', name: 'Lucid Palatinate', r: 0.80, a: 230, kind: 'civilised', faction: 'imperium',
    type: 'Sector Capital · Astropathic Choir',
    blurb: 'The shining administrative seat of the western reaches. A choir of three thousand astropaths translates the Crusade\'s every cipher.',
    books: [],
    events: [{ era: 'M41.999', text: 'Lucid Palatinate cuts off all signals during the Cicatrix opening' }],
  },
  { id: 'valhalla', name: 'Valhalla', r: 0.40, a: 275, kind: 'death', faction: 'imperium',
    type: 'Ice World · Ice Warriors',
    blurb: 'An eternally winter-locked world. The Valhallan Ice Warriors are dour, patient, and grimly skilled at meat-grinder combat in any climate.',
    books: [
      { title: 'Ciaphas Cain: For the Emperor', author: 'Sandy Mitchell', tag: 'Cain' },
      { title: 'Ice Guard (omnibus)', author: 'Sandy Mitchell', tag: 'Valhalla' },
    ],
    events: [{ era: 'M41.999', text: 'Ice Warriors deploy to the broken Cadian salient' }],
  },
  { id: 'salvation', name: 'Salvation\'s Reach', r: 0.74, a: 270, kind: 'war', faction: 'imperium',
    type: 'Asteroid Fortress · Renegade Cache',
    blurb: 'A heretic outpost hidden in deep void. The Tanith First raided it for the Blood Pact pheguth — one of the strangest operations of the Crusade.',
    books: [{ title: 'Salvation\'s Reach', author: 'Dan Abnett', tag: 'Ghosts' }],
    events: [{ era: 'M41.789', text: 'Tanith First strike Salvation\'s Reach; defection extracted' }],
  },
  { id: 'rynns-world', name: 'Rynn\'s World', r: 0.46, a: 262, kind: 'astartes', faction: 'imperium',
    type: 'Astartes Homeworld · Crimson Fists',
    blurb: 'Wine-country and white cliffs. The Crimson Fists\' fortress-monastery was atomised by a single misfire — the chapter has been near-broken ever since.',
    books: [{ title: 'Rynn\'s World', author: 'Steve Parker', tag: 'Crimson Fists' }],
    events: [{ era: 'M41.989', text: 'Waaagh! Snagrod devastates Rynn\'s World; Chapter Master Kantor leads survivors' }],
  },
];

// Unified accessor: which worlds belong to which segmentum?
window.SEGMENTUM_WORLDS = {
  solar:     window.SOLAR_WORLDS,
  obscurus:  window.OBSCURUS_WORLDS,
  ultima:    window.ULTIMA_WORLDS,
  tempestus: window.TEMPESTUS_WORLDS,
  pacificus: window.PACIFICUS_WORLDS,
};

// Tag every world with its segmentum id so the side-panel can render the
// correct SEGMENT line without callers needing to know which list they came from.
(function tagSegments() {
  Object.entries(window.SEGMENTUM_WORLDS).forEach(([segId, worlds]) => {
    worlds.forEach((w) => { w.segment = segId; });
  });
})();

window.WORLD_KIND_GLYPHS = {
  throne:   '◉', // imperial throne
  astartes: '◈', // diamond - chapter
  fortress: '◆', // solid diamond
  forge:    '⌬', // gear
  hive:     '⬢', // hex
  death:    '✦', // star
  war:      '✚',
  dead:     '◌',
  warp:     '✺',
  shrine:   '☩',
  civilised:'○',
  xenos:    '◬', // triangle
  chaos:    '☄',
  necron:   '⌖',
};

window.FACTION_COLORS = {
  imperium: '#f0b248',
  chaos:    '#d04428',
  xenos:    '#5cd09a',
  necron:   '#7ad8a4',
  tyranid:  '#c97ad8',
};

// Named sub-sectors within each segmentum — arcs along a particular radius range
window.SUB_SECTORS = [
  { name: 'Calixis Sector',  seg: 'obscurus', r0: 0.55, r1: 0.82, a0: -63, a1: -45 },
  { name: 'Gothic Sector',   seg: 'obscurus', r0: 0.32, r1: 0.65, a0: -20, a1: 5 },
  { name: 'Scarus Sector',   seg: 'obscurus', r0: 0.40, r1: 0.78, a0: 5, a1: 25 },
  { name: 'Realm of Ultramar', seg: 'ultima', r0: 0.48, r1: 0.72, a0: 80, a1: 105 },
  { name: 'Charadon Sector', seg: 'ultima', r0: 0.55, r1: 0.85, a0: 115, a1: 142 },
  { name: 'Eastern Fringe',  seg: 'ultima', r0: 0.78, r1: 0.98, a0: 115, a1: 148 },
  { name: 'Sabbat Worlds',   seg: 'pacificus', r0: 0.42, r1: 0.72, a0: 230, a1: 258 },
  { name: 'Reductus',        seg: 'tempestus', r0: 0.55, r1: 0.85, a0: 160, a1: 185 },
  { name: 'Uhulis Sector',   seg: 'tempestus', r0: 0.35, r1: 0.60, a0: 195, a1: 213 },
];

// Named nebulae / warp anomalies — visual blobs with type
window.NEBULAE = [
  { name: 'Eye of Terror',     r: 0.46, a: -55, size: 4.2,  type: 'warp',   color: '#ff6644' },
  // Maelstrom — east of Terra & Mars, nestled inside the Cicatrix lower lobe
  { name: 'Maelstrom',         r: 0.22, a: 110, size: 1.8,  type: 'warp',   color: '#ff6644' },
  // Siren's Storm — far south of Terra, in Segmentum Tempestus (the slot the
  // old Maelstrom blob used to occupy).
  { name: 'Siren\'s Storm',    r: 0.30, a: 175, size: 2.4,  type: 'warp',   color: '#ff6644' },
  { name: 'Hadex Anomaly',     r: 0.78, a: 120, size: 2.4,  type: 'warp',   color: '#a8ff66' },
  { name: 'Storm of the Emperor\'s Wrath', r: 0.50, a: 20, size: 2.2, type: 'warp', color: '#ff8866' },
  { name: 'Scourge Stars',     r: 0.82, a: 116, size: 2.0,  type: 'warp',   color: '#ff7744' },
  { name: 'Ghoul Stars',       r: 0.96, a: 70,  size: 3.4,  type: 'forbidden', color: '#88bbff' },
  { name: 'Halo Stars',        r: 0.96, a: -85, size: 3.0,  type: 'forbidden', color: '#88bbff' },
  { name: 'Veiled Region',     r: 0.95, a: 200, size: 2.6,  type: 'forbidden', color: '#88bbff' },
  // Additional named clusters from the canon Dominion of the Space Marines map.
  { name: 'Malefactus',        r: 0.94, a: 42,  size: 2.4,  type: 'forbidden', color: '#88bbff' },
  { name: 'Outrenacht',        r: 0.68, a: -8,  size: 1.6,  type: 'forbidden', color: '#88bbff' },
  { name: 'Somnium Stars',     r: 0.93, a: 75,  size: 2.2,  type: 'forbidden', color: '#88bbff' },
  { name: 'Darkhold',          r: 0.85, a: -98, size: 1.8,  type: 'forbidden', color: '#88bbff' },
  { name: 'Cicatrix Maledictum', isRift: true, color: '#ff3366' },
];

// Cicatrix Maledictum spine — 7 control points for a 2-segment cubic bezier.
// Stored as [r, a] polar pairs so the editor can drag them and dump them back.
window.CICATRIX_PTS = [
  [0.50, -55],  // 1. Eye of Terror lobe
  [0.58, -20],  // 2. bend up over Cadia
  [0.55,  20],  // 3. through Storm of the Emperor's Wrath
  [0.55,  55],  // 4. upper-east anchor (mid bezier join)
  [0.50,  92],  // 5. east of Terra, past Macragge
  [0.72, 118],  // 6. through Hadex Anomaly
  [0.90, 122],  // 7. Scourge Stars
];

// Necron dynasty territories — render as glowing green zones marked with
// pyramid + hieroglyph glyphs. Each dynasty is a polygon (or corridor) of
// 2 or more control points editable from the on-screen warp editor.
// pts are [r, a] polar pairs. shape: 'corridor' for 2 pts, 'polygon' for 3+.
window.NECRON_DYNASTIES = [
  {
    id: 'sautekh', name: 'Sautekh Dynasty',
    color: '#5cd09a', density: 'high',
    pts: [
      [0.62, 105],   // mid-Ultima
      [0.78, 115],   // toward Damnos / Hadex border
      [0.92, 130],   // far eastern fringe
      [0.86, 145],   // sweeping south along the fringe
      [0.70, 138],   // back toward galactic interior
    ],
  },
  {
    id: 'mephrit', name: 'Mephrit Dynasty',
    color: '#7ad8a4', density: 'mid',
    pts: [
      [0.42, 65],    // upper Ultima
      [0.58, 78],    // toward Baal approach
    ],
  },
  {
    id: 'nihilakh', name: 'Nihilakh Dynasty',
    color: '#5cd09a', density: 'mid',
    pts: [
      [0.80, 155],   // SE fringe near Charadon
      [0.62, 165],   // toward Reductus sector
    ],
  },
];

// Tyranid swarm zones — translucent purple regions marking heavy xenos
// activity (Hive Fleet incursions). Same data shape as NECRON_DYNASTIES:
// pts are [r, a] polar pairs. shape: 'corridor' for 2 pts, 'polygon' for 3+.
window.TYRANID_SWARMS = [
  {
    id: 'leviathan', name: 'Hive Fleet Leviathan',
    color: '#c97ad8', density: 'high',
    pts: [
      [0.94,  70],   // far eastern fringe approach
      [1.00,  85],
      [0.92, 100],
      [0.80,  88],
    ],
  },
];

// Procedural background star density — spiral-arm weighted distribution
// Density is highest along 4 galactic arms; arms wind logarithmically.
// Wrapped in a function on window so the App can re-sample stars whenever
// segment angles / outer radii change.
window.regenerateBackgroundStars = function regenerateBackgroundStars() {
  let s = 4242;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const stars = [];

  // Spiral arm parameters — 4 arms equally spaced
  const ARMS = [0, 90, 180, 270];
  const PITCH = 280;         // degrees of rotation per full unit radius (tight wind)
  const ARM_WIDTH = 18;      // angular half-width of dense arm region

  // distance (in degrees) from polar(r, a) to nearest spiral arm
  const distToArm = (r, a) => {
    let m = Infinity;
    for (const arm of ARMS) {
      const armA = (arm + PITCH * r) % 360;
      let d = Math.abs(((a - armA) % 360 + 540) % 360 - 180);
      if (d < m) m = d;
    }
    return m;
  };

  const segments = window.SEGMENTUMS;
  // Density per UNIT AREA — quotas scale with each segment's current angular
  // width and outer radius so the visual density stays consistent as the
  // user resizes a segmentum.
  const baseDensity = { obscurus: 950, ultima: 950, tempestus: 950, pacificus: 950, solar: 1800 };

  for (const seg of segments) {
    let placed = 0, attempts = 0;
    // Approximate area of the donut sector: (a1-a0)/360 * π * (outer²-inner²)
    const angSpan = seg.id === 'solar' ? 360 : Math.abs(seg.a1 - seg.a0);
    const innerR = seg.id === 'solar' ? 0 : seg.inner;
    const area = (angSpan / 360) * Math.PI * (seg.outer * seg.outer - innerR * innerR);
    const cap = Math.round((baseDensity[seg.id] || 600) * area);
    while (placed < cap && attempts < cap * 6) {
      attempts++;
      const u = rnd();
      const r = seg.id === 'solar'
        ? Math.sqrt(rnd()) * seg.outer
        : seg.inner + Math.sqrt(u) * (seg.outer - seg.inner);
      const a = seg.id === 'solar'
        ? rnd() * 360
        : seg.a0 + rnd() * (seg.a1 - seg.a0);
      // arm-bias probability (Gaussian on distance to arm)
      const d = distToArm(r, a);
      const armBias = Math.exp(-(d * d) / (2 * ARM_WIDTH * ARM_WIDTH));
      // base 0.18 ensures inter-arm regions aren't empty
      const accept = 0.18 + 0.82 * armBias;
      if (rnd() >= accept) continue;
      const roll = rnd();
      let faction = 'neutral';
      if (roll < 0.55) faction = 'imperium';
      else if (roll < 0.78) faction = 'neutral';
      else if (roll < 0.86) faction = 'xenos';
      else if (roll < 0.94) faction = 'chaos';
      else faction = 'necron';
      // Size distribution — most tiny, occasional bright
      const tier = rnd();
      let size;
      if (tier < 0.78) size = 0.10 + rnd() * 0.18;   // tiny dust
      else if (tier < 0.96) size = 0.28 + rnd() * 0.28; // small
      else size = 0.55 + rnd() * 0.5;                // bright
      const bright = tier > 0.96;
      stars.push({
        r, a, faction,
        size,
        segId: seg.id,
        bright,
        armBias, // store so we can tint arm cores
        twinkle: 3 + rnd() * 6,
        delay: rnd() * 5,
      });
      placed++;
    }
  }
  window.BACKGROUND_STARS = stars;

  // Halo extension — sparse stars BEYOND each segment's outer radius so
  // dragging doesn't reveal a hard edge. Halo follows the max segment reach
  // out to ~1.55× that radius.
  const maxOuter = Math.max(...segments.filter((x) => x.id !== 'solar').map((x) => x.outer));
  const halo = [];
  let h = 9999;
  const hrnd = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
  const HALO_COUNT = 1200;
  for (let i = 0; i < HALO_COUNT; i++) {
    // Per-star outer reach: sample angle FIRST, then base halo onto that
    // segment's outer radius so the halo follows the new disc silhouette.
    const a = hrnd() * 360;
    const aN = ((a % 360) + 360) % 360;
    let segOuter = maxOuter;
    for (const seg of segments) {
      if (seg.id === 'solar') continue;
      const aa0 = ((seg.a0 % 360) + 360) % 360;
      const aa1 = ((seg.a1 % 360) + 360) % 360;
      const inWedge = aa0 <= aa1 ? (aN >= aa0 && aN <= aa1) : (aN >= aa0 || aN <= aa1);
      if (inWedge) { segOuter = seg.outer; break; }
    }
    const r = segOuter + Math.sqrt(hrnd()) * 0.55;
    const tier = hrnd();
    let size;
    if (tier < 0.85) size = 0.08 + hrnd() * 0.12;       // dust
    else if (tier < 0.98) size = 0.20 + hrnd() * 0.20;  // small
    else size = 0.42 + hrnd() * 0.30;                   // sparse bright
    const bright = tier > 0.98;
    halo.push({
      r, a, faction: 'neutral',
      size, segId: 'halo', bright,
      armBias: 0.05,
      twinkle: 3 + hrnd() * 6,
      delay: hrnd() * 5,
    });
  }
  window.HALO_STARS = halo;
};
// Initial generation at load time so the disc has stars before App mounts.
window.regenerateBackgroundStars();

// Spiral arm centerlines — drawn faintly under the stars for structure.
// Sample out to 1.6 (slider max for outer reach) — renderer clamps each
// point to the live segment outer at that angle, so arms always end on the
// silhouette regardless of how segments are resized.
window.SPIRAL_ARMS = (function buildArms() {
  const arms = [];
  const ARMS_START = [0, 90, 180, 270];
  const PITCH = 280;
  for (const a0 of ARMS_START) {
    const pts = [];
    for (let r = 0.18; r <= 1.6; r += 0.02) {
      const angle = a0 + PITCH * r;
      pts.push([r, angle]);
    }
    arms.push(pts);
  }
  return arms;
})();

// Add `setting` to book entries — already implicit via parent world, but we
// expose it explicitly for the panel so the world-name shows next to every book.
(function annotateBookSettings() {
  Object.values(window.SEGMENTUM_WORLDS).forEach((worlds) => {
    for (const w of worlds) {
      if (!w.books) continue;
      for (const b of w.books) {
        if (!b.setting) b.setting = w.name;
      }
    }
  });
})();
