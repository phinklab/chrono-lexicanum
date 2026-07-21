/**
 * Eisenhorn · The Ordo Dossiers (240–392.M41): the core Xenos → Malleus →
 * Hereticus trilogy, told as an inquisitorial dossier and a moral descent.
 *
 * Catalog pins in the Scarus cluster identify sourced worlds but do not claim
 * canonical galactic coordinates. KCX-1288, 56-Izar and Jeganda use disclosed
 * relative points; Cinchare and Ghül are isolated schematic points because the
 * record supplies no defensible route geometry. Lethe Eleven is folded into
 * the Thracian opening, while the simultaneous Messina attack remains context
 * for Spaeton House rather than a journey stop. The later Magos/Bequin arc is
 * outside this trilogy-focused route.
 */

import type { Voyage } from "../types";

const XENOS_SOURCE = "https://wh40k.lexicanum.com/wiki/Xenos_(Novel)";
const MALLEUS_SOURCE = "https://wh40k.lexicanum.com/wiki/Malleus_(Novel)";
const HERETICUS_SOURCE = "https://wh40k.lexicanum.com/wiki/Hereticus_(Novel)";

const HUBRIS_PLACEMENT = {
  precision: "relative" as const,
  note: "Hubris is fixed to the Helican Subsector of Scarus, but no published galactic coordinate is known. The catalog pin is a regional identity anchor.",
  source: "https://wh40k.lexicanum.com/wiki/Hubris",
};

const GUDRUN_PLACEMENT = {
  precision: "relative" as const,
  note: "Gudrun is fixed to the Scarus Sector in Segmentum Obscurus, but no canonical system coordinate is published. The catalog pin is a regional placement.",
  source: "https://wh40k.lexicanum.com/wiki/Gudrun",
};

const DAMASK_PLACEMENT = {
  precision: "relative" as const,
  note: "Damask is a frontier world of the Helican Subsector in Scarus, but its system and galactic coordinate are unpublished. The pin preserves only that regional identity.",
  source: "https://wh40k.lexicanum.com/wiki/Damask",
};

const THRACIAN_PLACEMENT = {
  precision: "relative" as const,
  note: "Thracian Primaris belongs to its named system in the Helican Subsector of Scarus, but no canonical galactic coordinate is published. The pin is regional.",
  source: "https://wh40k.lexicanum.com/wiki/Thracian_Primaris",
};

const EECHAN_PLACEMENT = {
  precision: "relative" as const,
  note: "Eechan is placed within the Helican Subsector of Scarus, while its system and exact galactic position remain unpublished. The catalog pin is a regional anchor.",
  source: MALLEUS_SOURCE,
};

const DURER_PLACEMENT = {
  precision: "relative" as const,
  note: "Durer is an agri world in the Ophidian Subsector of Scarus, but its system and canonical galactic coordinate are unknown. The catalog pin is regional.",
  source: "https://wh40k.lexicanum.com/wiki/Durer",
};

export const EISENHORN: Voyage = {
  id: "eisenhorn",
  name: "Eisenhorn · The Ordo Dossiers",
  tag: "240–392.M41",
  mapState: "now",
  blurb:
    "Across 152 years of inquest, Gregor Eisenhorn turns the enemy's weapons into chosen instruments, and falls from puritan to radical.",
  cartography: {
    label: "inquisitorial reconstruction",
    note: "The dossier follows three cases across 152 years, not one surveyed flight path. Scarus catalog pins and off-chart locations use disclosed relative or schematic placements; broken legs mark century jumps and positions the record cannot connect.",
  },
  sections: [
    { id: "xenos", label: "XENOS · THE NECROTEUCH", color: "#b49a68", start: 0 },
    { id: "malleus", label: "MALLEUS · THE COMPROMISE", color: "#778477", start: 5 },
    { id: "hereticus", label: "HERETICUS · THE FALL", color: "#9b4b45", start: 11 },
  ],
  stations: [
    {
      world: "hubris",
      heading: "Hubris · Case File One",
      date: "240.M41",
      text: "Hubris, deep in its Dormant season. Murdin Eyclone kills thousands of cryo-sleepers in Processional Two-Twelve to empower Pontius Glaw's resurrection; Eisenhorn executes him with dead Lores Vibben's gang-marked pistol.",
      source: XENOS_SOURCE,
      placement: HUBRIS_PLACEMENT,
    },
    {
      world: "gudrun",
      heading: "Gudrun · House Glaw",
      date: "240–241.M41",
      text: "Under a grain merchant's alias Eisenhorn enters House Glaw and leaves it a prisoner. Gorgone Locke's torturers cut the smile from his face for good; Voke's purge razes the House, but its leaders escape with the Pontius.",
      source: XENOS_SOURCE,
      placement: GUDRUN_PLACEMENT,
    },
    {
      world: "damask",
      heading: "Damask · North Qualm",
      date: "240–241.M41",
      text: "At North Qualm the Glaw cabal forces enslaved workers to excavate Saruthi artefacts. The recovered tiles point beyond Imperial space, and Eisenhorn follows the exchange trail to KCX-1288.",
      source: "https://wh40k.lexicanum.com/wiki/Damask",
      placement: DAMASK_PLACEMENT,
    },
    {
      name: "KCX-1288",
      gx: 238.2,
      gy: 118,
      heading: "KCX-1288 · The Necroteuch",
      date: "240–241.M41",
      text: "Inside a collapsing Saruthi tetrascape, the Glaw cabal trades its excavated artefacts for the Necroteuch. Eisenhorn destroys the ancient Terran copy, but the alien version remains beyond his reach.",
      source: "https://wh40k.lexicanum.com/wiki/KCX-1288",
      placement: {
        precision: "relative",
        note: "KCX-1288 lies deep in Saruthi space within the Scarus Sector. It is clustered with the Scarus dossier worlds without claiming a known system or coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/KCX-1288",
      },
    },
    {
      name: "56-Izar",
      gx: 237.3,
      gy: 110.4,
      heading: "56-Izar · The Refusal",
      date: "240–241.M41",
      text: "The Inquisition assaults the Saruthi home world, but Molitor turns on Eisenhorn to preserve the forbidden book. Cherubael offers escape in exchange for the Necroteuch; Eisenhorn refuses, destroys it and leaves 56-Izar to annihilation.",
      source: "https://wh40k.lexicanum.com/wiki/56-Izar",
      placement: {
        precision: "relative",
        note: "56-Izar is fixed to the Vincies Subsector of Scarus. Its offset from the Scarus marker is regional because the source gives no stellar coordinates.",
        source: "https://wh40k.lexicanum.com/wiki/56-Izar",
      },
    },
    {
      world: "thracian-primaris",
      heading: "Thracian Primaris · The Atrocity",
      date: "338.M41",
      text: "At the Holy Novena the Grand Triumph becomes the Thracian Atrocity: Lightnings plough into the procession and thirty-three captive psykers, Alpha-grade and above, slip free. Ravenor is broken at the Spatian Gate.",
      source: MALLEUS_SOURCE,
      placement: THRACIAN_PLACEMENT,
      breakBefore: true,
    },
    {
      world: "eechan",
      heading: "Eechan · The Esarhaddon Auction",
      date: "338.M41 · six weeks later",
      text: "Disguised as mutants, Eisenhorn and Nayl enter Phant Mastik's auction of the Alpha-plus psyker Esarhaddon. Cherubael stands among the bidders and burns out the traitor Lyko's brain before it can be read.",
      source: MALLEUS_SOURCE,
      placement: EECHAN_PLACEMENT,
    },
    {
      world: "cadia",
      heading: "Cadia · The Name Quixos",
      date: "338–340.M41",
      text: "On Cadia, a cult trail and the Kasr Derth archives identify the long-missing Inquisitor Quixos. Osma arrests Eisenhorn for heresy; after surviving the Carnificina, he escapes and spends years hunting Quixos as an outlaw.",
      source: MALLEUS_SOURCE,
    },
    {
      name: "Cinchare",
      gx: 164,
      gy: 44,
      heading: "Cinchare · The Bargain",
      date: "340.M41",
      text: "Beyond Segmentum Obscurus, Eisenhorn recovers Pontius Glaw's mind from Proctor's prison. Glaw trades the means to fight Quixos for Geard Bure's promise of a mechanical body: the bargain that wins one war and resurrects the next.",
      source: "https://wh40k.lexicanum.com/wiki/Cinchare",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Cinchare is a rogue star in the Halo Zone beyond Segmentum Obscurus, but no sector or canonical coordinate is published. The isolated point marks that distant setting only.",
        source: "https://wh40k.lexicanum.com/wiki/Cinchare",
      },
    },
    {
      name: "Farness Beta",
      gx: 284,
      gy: 229,
      heading: "Farness Beta · Quixos Falls",
      date: "343.M41",
      text: "At the mouth of the Cadian Gate, Eisenhorn kills Quixos in his own tower while Voke dies breaking the daemonhosts. Eisenhorn secretly takes the Malus Codicium from the field: the weapon he will soon choose to use.",
      source: "https://wh40k.lexicanum.com/wiki/Farness_Beta",
      breakBefore: true,
      placement: {
        precision: "relative",
        note: "Farness Beta lies at the mouth of the Cadian Gate in the Cadian Subsector. It is plotted beside Cadia without claiming a documented system coordinate.",
        source: "https://wh40k.lexicanum.com/wiki/Farness_Beta",
      },
    },
    {
      world: "gudrun",
      heading: "Gudrun · Cherubael Bound",
      date: "345.M41",
      text: "Reinstated and outwardly puritan again, Eisenhorn keeps a trophy no tribunal sees. In a hidden cell beneath his Gudrun estate, Cherubael hangs bound to a new host by rites taken from the Malus Codicium.",
      source: MALLEUS_SOURCE,
      placement: GUDRUN_PLACEMENT,
    },
    {
      world: "durer",
      heading: "Durer · Miquol",
      date: "386.M41",
      text: "On Durer's polar island of Miquol, Fayde Thuring wakes the Chaos Titan Cruor Vult. Bequin falls comatose to the null backlash; Eisenhorn opens the Codicium, looses Cherubael and binds it into the dying Inquisitor Verveuk.",
      source: HERETICUS_SOURCE,
      placement: DURER_PLACEMENT,
      breakBefore: true,
    },
    {
      world: "gudrun",
      heading: "Gudrun · Spaeton House",
      date: "386.M41",
      text: "Vessorine janissaries raze Spaeton House while coordinated attacks shatter Eisenhorn's network and devastate the Distaff on distant Messina. The paymaster's alias, Khanjar the Sharp, reveals Pontius Glaw restored to a body and settling accounts.",
      source: HERETICUS_SOURCE,
      placement: GUDRUN_PLACEMENT,
    },
    {
      world: "hubris",
      heading: "Hubris · The Parting",
      date: "386.M41",
      text: "On his home world, Fischig judges the bargain at Cinchare and Eisenhorn's warp rites proof that his oldest friend has crossed the line. Their attempted reconciliation fails; Fischig resolves that the Inquisition must purge the taint Eisenhorn denies.",
      source: "https://wh40k.lexicanum.com/wiki/Godwyn_Fischig",
      placement: HUBRIS_PLACEMENT,
    },
    {
      name: "Jeganda",
      gx: 223,
      gy: 87,
      heading: "Jeganda · The Last Accuser",
      date: "387.M41",
      text: "Fischig's betrayal brings Heldane and Osma aboard the Essene. He shoots out Eisenhorn's knees before Medea kills him; Aemos tears Cherubael from its host at the cost of his life, and Eisenhorn binds the daemon into Fischig's corpse.",
      source: "https://wh40k-de.lexicanum.com/wiki/Jeganda",
      placement: {
        precision: "relative",
        note: "Jeganda lies at the edge of Imperial space near the Scarus Sector, but no canonical system coordinate is published. The point marks only that outer-Scarus context.",
        source: "https://wh40k-de.lexicanum.com/wiki/Jeganda",
      },
    },
    {
      name: "Ghül",
      gx: 201,
      gy: 64,
      heading: "Ghül · The Last Case",
      date: "392.M41",
      text: "On the uncharted world 5213X, Pontius Glaw reaches for the vessel of the daemon-king Yssarile. Eisenhorn burns the Malus Codicium as a feint, kills Glaw with Barbarisater and leaves Ghül to Exterminatus. The trilogy closes with only Cherubael beside him.",
      source: "https://wh40k.lexicanum.com/wiki/Gh%C3%BCl",
      breakBefore: true,
      placement: {
        precision: "schematic",
        note: "Ghül is system 5213X, reached months beyond Imperial space; its segmentum, sector and coordinate are unknown. The isolated point is arranged outside the Scarus cluster only for chronology.",
        source: "https://wh40k.lexicanum.com/wiki/Gh%C3%BCl",
      },
    },
  ],
  lbl: { x: 318, y: 118, t: "THE ORDO DOSSIERS" },
};
