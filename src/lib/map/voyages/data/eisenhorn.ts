/**
 * Eisenhorn · The Ordo Dossiers (M41): Xenos → Malleus → Hereticus (+ The
 * Magos coda) across the Helican/Scarus cluster, told as an inquisitorial
 * dossier — the long fall from puritan to radical.
 *
 * Off-chart beats, per research notes: KCX-1288 and 56-Izar use relative
 * points inside their sourced Scarus/Vincies regions; Farness Beta is placed
 * beside Cadia because it lies at the mouth of the Cadian Gate.
 * Still folded into act texts: Lethe Eleven (the chart's `lethe` is a
 * DIFFERENT dead world in Ultima — do not use) → Thracian; Messina's
 * Distaff massacre → Spaeton House; Ghül + the Gershom / King-in-Yellow
 * coda → the closing Hubris station (both come AFTER the last station, so
 * no leg exists for them to ride). Eustis Majoris is
 * Ravenor's stage and deliberately absent; Sancour/Queen Mab is the Bequin
 * series (chart id `sancour` exists if that journey is ever wanted).
 * Gudrun ×3, Hubris ×2 — no two consecutive stations share a world.
 * Sources per station in `source`.
 */

import type { Voyage } from "../types";

export const EISENHORN: Voyage = {
  id: "eisenhorn",
  name: "Eisenhorn · The Ordo Dossiers",
  tag: "M41",
  blurb: "A century and a half of inquest, and Gregor Eisenhorn's long fall from puritan to radical.",
  stations: [
    {
      world: "hubris",
      heading: "Hubris · Case File One",
      date: "240.M41",
      text: "Hubris, deep in its Dormant season. Murdin Eyclone kills hundreds of cryo-sleepers in Processional Two-Twelve, raw material for Pontius Glaw's resurrection. Eisenhorn executes him with dead Lores Vibben's gang-marked pistol.",
      source: "https://wh40k.lexicanum.com/wiki/Xenos_(Novel)",
    },
    {
      world: "gudrun",
      heading: "Gudrun · House Glaw",
      date: "240.M41",
      text: "Under a grain-merchant's alias he enters House Glaw and leaves it a prisoner: Gorgone Locke's torturers cut the smile from his face for good. Voke's purge razes the House, but its masters flee with darker cargo.",
      source: "https://wh40k.lexicanum.com/wiki/Xenos_(Novel)",
    },
    {
      world: "damask",
      heading: "Damask · North Qualm",
      date: "240–241.M41",
      text: "At North Qualm the cabal digs saruthi tiles from a slave-worked mine, and the trail turns outward, beyond the charted stars. Eisenhorn follows it into the dark.",
      source: "https://wh40k.lexicanum.com/wiki/Damask",
    },
    {
      name: "KCX-1288",
      gx: 238.2,
      gy: 118,
      heading: "KCX-1288 · The Necroteuch",
      date: "241.M41",
      text: "At a dying star the cabal treats with the saruthi aboard a rogue trader's wreck, the Necroteuch as the price of passage. Eisenhorn sees the abominable book burn, and half of Glaw's design with it.",
      source: "https://wh40k.lexicanum.com/wiki/KCX-1288",
      placement: {
        precision: "relative",
        note: "KCX-1288 is explicitly deep in Saruthi space within the Scarus Sector; it is clustered with the charted Scarus dossier worlds without claiming a known system.",
        source: "https://wh40k.lexicanum.com/wiki/KCX-1288",
      },
    },
    {
      name: "56-Izar",
      gx: 237.3,
      gy: 110.4,
      heading: "56-Izar · The Tetrascape",
      date: "241.M41",
      text: "In the saruthi tetrascape, where geometry itself runs wrong, the survivors corner Glaw's cabal at last. A daemonhost turns upon the company and gives its name for the first time: Cherubael.",
      source: "https://wh40k.lexicanum.com/wiki/56-Izar",
      placement: {
        precision: "relative",
        note: "56-Izar is fixed to the Vincies Subsector of Scarus; the offset from the Scarus marker is regional because the source gives no stellar coordinates.",
        source: "https://wh40k.lexicanum.com/wiki/56-Izar",
      },
    },
    {
      world: "thracian-primaris",
      heading: "Thracian Primaris · The Atrocity",
      date: "338.M41",
      text: "At the Holy Novena the Grand Triumph becomes the Thracian Atrocity: Lightnings plough into the procession and thirty-three captive psykers, Alpha-grade and above, slip free. Ravenor is broken at the Spatian Gate.",
      source: "https://wh40k.lexicanum.com/wiki/Malleus_(Novel)",
    },
    {
      world: "eechan",
      heading: "Eechan · The Flesh Auction",
      date: "338.M41",
      text: "Six weeks on, disguised as mutants, Eisenhorn and Nayl walk into Phant Mastik's auction of the psyker Esarhaddon. Among the bidders stands Cherubael; when the traitor Lyko is cornered, the daemonhost burns out his brain before it can be read.",
      source: "https://wh40k.lexicanum.com/wiki/Malleus_(Novel)",
    },
    {
      world: "cadia",
      heading: "Cadia · The Name Quixos",
      date: "338.M41",
      text: "Among the pylons, Fischig's cult-trail yields a name the Kasr Derth archives confirm: Quixos, lauded and long thought dead. The Ordo brands the accuser instead, and Eisenhorn breaks out of the Carnificina to hunt as an outlaw.",
      source: "https://wh40k.lexicanum.com/wiki/Malleus_(Novel)",
    },
    {
      name: "Farness Beta",
      gx: 284,
      gy: 229,
      heading: "Farness Beta · Quixos Falls",
      date: "343.M41",
      text: "At the Eye's edge the fugitive years end: Eisenhorn runs Quixos through in his own tower while Voke dies breaking the daemonhosts. The Malus Codicium leaves the field in a survivor's coat.",
      source: "https://wh40k.lexicanum.com/wiki/Cherubael",
      placement: {
        precision: "relative",
        note: "Farness Beta lies at the mouth of the Cadian Gate in the Cadian Subsector, so it is plotted immediately beside Cadia rather than halfway to Gudrun.",
        source: "https://wh40k.lexicanum.com/wiki/Farness_Beta",
      },
    },
    {
      world: "gudrun",
      heading: "Gudrun · The Hidden Cell",
      date: "345.M41",
      text: "Reinstated, outwardly puritan again, Eisenhorn keeps a trophy no tribunal ever sees: in a hidden cell beneath his Gudrun estate hangs Cherubael, bound to a new host by the rites of the Malus Codicium, kept for interrogation and study.",
      source: "https://wh40k.lexicanum.com/wiki/Malleus_(Novel)",
    },
    {
      world: "durer",
      heading: "Durer · Miquol",
      date: "386.M41",
      text: "On Durer's polar island of Miquol, an old debt comes due: Fayde Thuring wakes the Chaos Titan Cruor Vult. Bequin falls comatose to the null-backlash; Eisenhorn opens the Codicium, looses Cherubael, then binds it into the dying inquisitor Verveuk.",
      source: "https://wh40k.lexicanum.com/wiki/Hereticus_(Novel)",
    },
    {
      world: "gudrun",
      heading: "Gudrun · Spaeton House",
      date: "386.M41",
      text: "Vessorine janissaries burn Spaeton House while sister strikes gut his web; the Distaff on Messina dies with it. The paymaster's alias, Khanjar the Sharp, decodes to an old prisoner: Pontius Glaw, escaped, embodied, settling accounts.",
      source: "https://wh40k.lexicanum.com/wiki/Hereticus_(Novel)",
    },
    {
      world: "hubris",
      heading: "Hubris · The Parting",
      date: "386–392.M41",
      text: "At Hubris, Fischig sees the daemonhost and breaks with his inquisitor. Off-chart on tomb-world Ghül, Eisenhorn burns the Malus Codicium as a feint and puts Glaw down for good. A century on, on Gershom, the dossier reopens with the King in Yellow.",
      source: "https://wh40k.lexicanum.com/wiki/Hereticus_(Novel)",
    },
  ],
  lbl: { x: 318, y: 118, t: "THE ORDO DOSSIERS" },
};
