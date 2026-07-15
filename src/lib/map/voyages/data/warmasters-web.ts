/** The eighteen Legion paths that carry the Great Crusade into the Heresy. */

import { isWaypoint, type Voyage } from "../types";
import { GREAT_CRUSADE } from "./great-crusade";

const greatCrusadeFinale = GREAT_CRUSADE.stations.at(-1);
const legionPaths =
  greatCrusadeFinale && !isWaypoint(greatCrusadeFinale) ? (greatCrusadeFinale.arms ?? []) : [];

export const WARMASTER_WEB: Voyage = {
  id: "warmasters-web",
  name: "The Warmaster's Web",
  tag: "M31 · Horus Heresy",
  blurb: "Eighteen Legion paths leave the Great Crusade and become the opening moves of the Horus Heresy.",
  stations: [
    {
      world: "armageddon",
      heading: "The Warmaster's Web",
      date: "004.M31 onward · Horus Heresy",
      text: "Select a coloured Legion path or a shared destination to read how the Great Crusade fractured into civil war.",
      source: "https://www.warhammer-community.com/en-gb/articles/w3jmtzfv/traitor-lore-how-the-trap-was-set/",
      arms: legionPaths,
    },
  ],
  lbl: { x: 645, y: 565, t: "THE WARMASTER'S WEB" },
};
