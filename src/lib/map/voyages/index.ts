/**
 * voyages/index.ts — the Great Journeys roster, in legend order
 * (chronological by era; the two pre-voyage courses live on inside it:
 * Indomitus expanded in place, The Path of Heresy absorbed into Horus ·
 * Rise and Ruin). "The Master of Mankind" was cut 2026-07-09 on maintainer
 * call: it overlapped the Great Crusade almost station for station.
 * Adding a journey = one data file + one line here.
 */

import { EISENHORN } from "./data/eisenhorn";
import { FARSIGHT } from "./data/farsight";
import { GARRO } from "./data/garro";
import { GREAT_CRUSADE } from "./data/great-crusade";
import { GUILLIMAN } from "./data/guilliman";
import { HORUS } from "./data/horus";
import { INDOMITUS } from "./data/indomitus";
import { KHAN } from "./data/khan";
import type { Voyage } from "./types";

export type { LegOverride, Voyage, VoyageStation, VoyageStop, VoyageWaypoint } from "./types";
export { isWaypoint } from "./types";
export { resolveVoyage } from "./resolve";
export type { ResolvedStation, ResolvedVoyage, VoyageChart } from "./resolve";

export const VOYAGES: readonly Voyage[] = [
  GREAT_CRUSADE,
  HORUS,
  KHAN,
  GUILLIMAN,
  GARRO,
  EISENHORN,
  FARSIGHT,
  INDOMITUS,
];
