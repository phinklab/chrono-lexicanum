/**
 * voyages/index.ts — the Great Journeys roster, in legend order
 * (chronological by era; the two pre-voyage courses live on inside it:
 * Indomitus expanded in place, The Path of Heresy absorbed into Horus ·
 * Rise and Ruin). "The Master of Mankind" was cut 2026-07-09 on maintainer
 * call: it overlapped the Great Crusade almost station for station. Farsight
 * and Jaghatai Khan were cut 2026-07-13 on maintainer call.
 * Adding a journey = one data file + one line here.
 */

import { ABADDON } from "./data/abaddon";
import { EISENHORN } from "./data/eisenhorn";
import { GARRO } from "./data/garro";
import { GAUNT } from "./data/gaunt";
import { GHAZGHKULL } from "./data/ghazghkull";
import { GREAT_CRUSADE } from "./data/great-crusade";
import { GUILLIMAN } from "./data/guilliman";
import { HORUS } from "./data/horus";
import { INDOMITUS } from "./data/indomitus";
import { LION } from "./data/lion";
import { WARMASTER_WEB } from "./data/warmasters-web";
import { YVRAINE } from "./data/yvraine";
import type { Voyage } from "./types";

export type {
  LegOverride,
  Voyage,
  VoyageArm,
  VoyageArmTarget,
  VoyageArmTargetLabel,
  VoyageArmVia,
  VoyageChartPoint,
  VoyagePlacement,
  VoyageSection,
  VoyageStation,
  VoyageStop,
  VoyageWaypoint,
} from "./types";
export { isChartPoint, isWaypoint } from "./types";
export { pointOnLeg, resolveVoyage } from "./resolve";
export type {
  ResolvedStation,
  ResolvedVoyage,
  ResolvedVoyageArm,
  ResolvedVoyageArmTarget,
  VoyageChart,
} from "./resolve";
export { fitVoyageBounds, resolvedVoyageBounds } from "./fit";
export type { VoyageBounds, VoyageFit } from "./fit";

export const VOYAGES: readonly Voyage[] = [
  GREAT_CRUSADE,
  WARMASTER_WEB,
  LION,
  HORUS,
  GUILLIMAN,
  GARRO,
  ABADDON,
  EISENHORN,
  GAUNT,
  GHAZGHKULL,
  YVRAINE,
  INDOMITUS,
];
