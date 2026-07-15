/**
 * voyages/resolve.ts — stop → chart-coordinate resolution and leg generation
 * for the Great Journeys.
 *
 * Stations resolve over featured AND dust worlds (a pinned world with no
 * linked works — Luna — is a legitimate station). Sourced chart points keep
 * their explicit coordinates. Waypoints resolve to a
 * point ON the enclosing leg (previous station → next station) at fraction
 * `via` of the path parameter — the "on the way" beats for worlds the chart
 * cannot locate. An unresolvable stop drops with a dev-console warning;
 * `scripts/test-voyages.ts` fails hard on the same cases so a bad stop
 * cannot ship silently.
 *
 * Legs connect consecutive ANCHORS only (worlds and chart points; waypoints
 * never bend geometry), except where the arriving anchor starts a new
 * segment with `breakBefore`, and
 * default to quadratic Béziers: control point = leg midpoint pushed
 * perpendicular by `bow` grid units, side chosen AWAY from Terra so arcs
 * read as transits skirting the core (matches the hand-drawn originals).
 * A station's `leg.bow` tunes the curvature, `leg.d` replaces the path.
 * Every resolved stop carries `legIndex` (the leg it rides or arrives on) —
 * RoutesLayer derives the tour's draw gating from it.
 */

import { TERRA } from "../projection";
import {
  isChartPoint,
  isWaypoint,
  type Voyage,
  type VoyageChartPoint,
  type VoyageArmTarget,
  type VoyageArmTargetLabel,
  type VoyagePlacement,
  type VoyageSection,
  type VoyageStation,
} from "./types";

/** Structural subset of MapPayload the resolver needs — keeps this module
 *  (and scripts/test-voyages.ts) free of the server-only blurb layer that
 *  payload.ts imports. */
export interface VoyageChart {
  featured: ReadonlyArray<{ id: string; name: string; gx: number; gy: number }>;
  /** Dust tuples: [gx, gy, clsIndex, id, name, segIndex]. */
  dust: ReadonlyArray<readonly [number, number, number, string, string, number]>;
}

export interface ResolvedStation {
  /** Index in the RESOLVED sequence (act numbering, progress gating). */
  i: number;
  /** Catalog world, sourced synthetic point, or a leg-riding waypoint. */
  kind: "world" | "point" | "way";
  /** Catalog world id, or a synthetic `~name` id for waypoints. */
  id: string;
  /** Chart name (map-worlds.json spelling), or the waypoint designation. */
  name: string;
  /** Act kicker: heading override, else the name. */
  heading: string;
  text: string;
  date?: string;
  gx: number;
  gy: number;
  /** The leg this stop arrives on (world) or rides (way); −1 for the first
   *  station. Drives the tour's step→draw gating in RoutesLayer. */
  legIndex: number;
  placement?: VoyagePlacement;
  section?: VoyageSection;
  /** Number of strategic epilogue arms revealed with this act. */
  armCount?: number;
  /** Authored identities of the strategic arms revealed with this act. */
  armLegions?: string[];
}

/** Clickable identity attached to a map-only strategic arm. */
export interface ResolvedVoyageArm {
  legIndices: number[];
  mainLegIndices: number[];
  branchLegIndices: number[];
  color: `#${string}`;
  legion: string;
  name: string;
  role: string;
  text: string;
  source: string;
  targetName: string;
  revealAt: number;
}

/** Dedupe of every final or intermediate strategic destination. */
export interface ResolvedVoyageArmTarget {
  id: string;
  name: string;
  gx: number;
  gy: number;
  text: string;
  source: string;
  placement?: VoyagePlacement;
  label: VoyageArmTargetLabel;
  legionIds: string[];
  legIndices: number[];
  revealAt: number;
}

export interface ResolvedVoyage {
  id: string;
  name: string;
  tag: string;
  blurb: string;
  continuation?: Voyage["continuation"];
  cartography?: Voyage["cartography"];
  strategic?: Voyage["strategic"];
  lbl: { x: number; y: number; t: string };
  stations: ResolvedStation[];
  /** One SVG path `d` per connected transition, plus map-only strategic arms. */
  legs: string[];
  /** Section colour for each leg, aligned with `legs`. */
  legColors: string[];
  /** Renderer opacity for each leg, aligned with `legs`. */
  legOpacities: number[];
  /** First tour step at which each leg is revealed, aligned with `legs`.
   *  Several strategic arms may intentionally share one reveal step. */
  legRevealAt: number[];
  /** Strategic-arm identities; normal journey legs are deliberately absent. */
  strategicArms: ResolvedVoyageArm[];
  /** Shared, clickable endpoints for the strategic epilogue. */
  strategicTargets: ResolvedVoyageArmTarget[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Quadratic leg between two stations; bow > 0 arcs away from Terra. */
function legPath(
  a: { gx: number; gy: number },
  b: { gx: number; gy: number },
  bow: number | undefined,
): string {
  const dx = b.gx - a.gx;
  const dy = b.gy - a.gy;
  const dist = Math.hypot(dx, dy);
  const mag = bow !== undefined ? Math.abs(bow) : Math.min(55, Math.max(6, 0.16 * dist));
  if (dist < 0.5 || mag < 0.05) {
    return `M ${r1(a.gx)} ${r1(a.gy)} L ${r1(b.gx)} ${r1(b.gy)}`;
  }
  // Unit perpendicular (left of travel direction).
  const px = -dy / dist;
  const py = dx / dist;
  const mx = (a.gx + b.gx) / 2;
  const my = (a.gy + b.gy) / 2;
  let sign: number;
  if (bow !== undefined) {
    sign = bow < 0 ? -1 : 1;
  } else {
    const dPlus = Math.hypot(mx + px * mag - TERRA.gx, my + py * mag - TERRA.gy);
    const dMinus = Math.hypot(mx - px * mag - TERRA.gx, my - py * mag - TERRA.gy);
    sign = dPlus >= dMinus ? 1 : -1;
  }
  const cx = mx + sign * px * mag;
  const cy = my + sign * py * mag;
  return `M ${r1(a.gx)} ${r1(a.gy)} Q ${r1(cx)} ${r1(cy)} ${r1(b.gx)} ${r1(b.gy)}`;
}

/** Point at path-parameter t on a single-segment leg (M + Q | C | L — the
 *  only shapes legPath and the hand-authored legs produce). Null on any
 *  other shape. */
export function pointOnLeg(d: string, t: number): { x: number; y: number } | null {
  const m = d.match(/^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*([QCL])\s*([-\d.\s,]+)$/);
  if (!m) return null;
  const x0 = Number(m[1]);
  const y0 = Number(m[2]);
  const p = m[4].trim().split(/[\s,]+/).map(Number);
  if (p.some((n) => !Number.isFinite(n))) return null;
  const u = 1 - t;
  if (m[3] === "L" && p.length >= 2) {
    return { x: x0 + (p[0] - x0) * t, y: y0 + (p[1] - y0) * t };
  }
  if (m[3] === "Q" && p.length >= 4) {
    return {
      x: u * u * x0 + 2 * u * t * p[0] + t * t * p[2],
      y: u * u * y0 + 2 * u * t * p[1] + t * t * p[3],
    };
  }
  if (m[3] === "C" && p.length >= 6) {
    return {
      x: u * u * u * x0 + 3 * u * u * t * p[0] + 3 * u * t * t * p[2] + t * t * t * p[4],
      y: u * u * u * y0 + 3 * u * u * t * p[1] + 3 * u * t * t * p[3] + t * t * t * p[5],
    };
  }
  return null;
}

const devWarn = (msg: string) => {
  if (process.env.NODE_ENV === "development") console.warn(`[voyages] ${msg}`);
};

const armTargetId = (target: VoyageArmTarget): string =>
  "world" in target
    ? `world:${target.world}`
    : `point:${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function resolveVoyage(voyage: Voyage, chart: VoyageChart): ResolvedVoyage {
  const byId = new Map<string, { name: string; gx: number; gy: number }>();
  for (const f of chart.featured) byId.set(f.id, { name: f.name, gx: f.gx, gy: f.gy });
  for (const d of chart.dust) byId.set(d[3], { name: d[4], gx: d[0], gy: d[1] });
  const sections = [...(voyage.sections ?? [])].sort((a, b) => a.start - b.start);
  const sectionAt = (stopIdx: number): VoyageSection | undefined => {
    let active: VoyageSection | undefined;
    for (const section of sections) {
      if (section.start > stopIdx) break;
      active = section;
    }
    return active;
  };

  // Pass 1 — resolve route anchors (catalog worlds or chart points) and
  // build the legs.
  interface Anchor {
    stop: VoyageStation | VoyageChartPoint;
    w: { name: string; gx: number; gy: number };
    stopIdx: number;
  }
  const anchors: Anchor[] = [];
  const anchorByStop = new Map<number, number>();
  voyage.stations.forEach((stop, stopIdx) => {
    if (isWaypoint(stop)) return;
    const w = isChartPoint(stop)
      ? { name: stop.name, gx: stop.gx, gy: stop.gy }
      : byId.get(stop.world);
    if (!w) {
      devWarn(
        `${voyage.id}: station "${isChartPoint(stop) ? stop.name : stop.world}" not on the chart — dropped`,
      );
      return;
    }
    anchorByStop.set(stopIdx, anchors.length);
    anchors.push({ stop, w, stopIdx });
  });
  const legs: string[] = [];
  const legColors: string[] = [];
  const legOpacities: number[] = [];
  const strategicArms: ResolvedVoyageArm[] = [];
  const strategicTargetById = new Map<string, ResolvedVoyageArmTarget>();
  const incomingLeg: number[] = anchors.map(() => -1);
  const outgoingLeg: number[] = anchors.map(() => -1);
  anchors.slice(1).forEach((a, offset) => {
    const previousAnchor = offset;
    if (a.stop.breakBefore) return;
    const legIndex = legs.length;
    legs.push(a.stop.leg?.d ?? legPath(anchors[previousAnchor].w, a.w, a.stop.leg?.bow));
    legColors.push(a.stop.leg?.color ?? sectionAt(a.stopIdx)?.color ?? "#b89b63");
    legOpacities.push(a.stop.leg?.opacity ?? 0.9);
    incomingLeg[previousAnchor + 1] = legIndex;
    outgoingLeg[previousAnchor] = legIndex;
  });

  // Pass 2 — assemble the act sequence; waypoints ride the leg between the
  // anchors around them.
  const stations: ResolvedStation[] = [];
  const stationByStop = new Map<number, number>();
  let lastAnchor = -1;
  voyage.stations.forEach((stop, stopIdx) => {
    if (!isWaypoint(stop)) {
      const k = anchorByStop.get(stopIdx);
      if (k === undefined) return; // dropped above
      lastAnchor = k;
      const { w } = anchors[k];
      const point = isChartPoint(stop);
      const st: ResolvedStation = {
        i: stations.length,
        kind: point ? "point" : "world",
        id: point
          ? `@${stop.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stopIdx}`
          : stop.world,
        name: w.name,
        heading: stop.heading ?? w.name,
        text: stop.text,
        gx: w.gx,
        gy: w.gy,
        legIndex: incomingLeg[k],
      };
      stationByStop.set(stopIdx, st.i);
      if (stop.date) st.date = stop.date;
      if (stop.placement) st.placement = stop.placement;
      const section = sectionAt(stopIdx);
      if (section) st.section = section;
      stations.push(st);
      return;
    }
    const legIdx = outgoingLeg[lastAnchor] ?? -1;
    const d = legIdx >= 0 && legIdx < legs.length ? legs[legIdx] : null;
    const pt = d ? pointOnLeg(d, Math.min(0.97, Math.max(0.03, stop.via))) : null;
    if (!pt) {
      devWarn(`${voyage.id}: waypoint "${stop.name}" has no leg to ride — dropped`);
      return;
    }
    const st: ResolvedStation = {
      i: stations.length,
      kind: "way",
      id: `~${stop.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stopIdx}`,
      name: stop.name,
      heading: stop.heading ?? stop.name,
      text: stop.text,
      gx: r1(pt.x),
      gy: r1(pt.y),
      legIndex: legIdx,
    };
    if (stop.date) st.date = stop.date;
    if (stop.placement) st.placement = stop.placement;
    const section = sectionAt(stopIdx);
    if (section) st.section = section;
    stations.push(st);
  });

  // Normal movement legs reveal on the first act that rides or arrives on
  // them. Strategic arms append map-only geometry and all reveal together
  // with their source act, without creating synthetic tour stations.
  const legRevealAt = legs.map((_, legIndex) => {
    const first = stations.find((station) => station.legIndex === legIndex);
    return first?.i ?? stations.length;
  });
  anchors.forEach(({ stop, w, stopIdx }) => {
    if (!stop.arms?.length) return;
    const revealAt = stationByStop.get(stopIdx);
    if (revealAt === undefined) return;
    let resolvedArms = 0;
    for (const arm of stop.arms) {
      const authoredRoute = [
        ...(arm.via ?? []).map((via) => ({ target: via.target, bow: via.bow })),
        { target: arm.target, bow: arm.bow },
      ];
      const route = authoredRoute.map(({ target, bow }) => ({
        authored: target,
        bow,
        resolved: "world" in target ? byId.get(target.world) : target,
      }));
      const missing = route.find(({ resolved }) => !resolved);
      if (missing) {
        const targetName =
          "world" in missing.authored ? missing.authored.world : missing.authored.name;
        devWarn(`${voyage.id}: arm ${arm.legion} target "${targetName}" not on the chart — dropped`);
        continue;
      }

      const armLegIndices: number[] = [];
      const mainLegIndices: number[] = [];
      const branchLegIndices: number[] = [];
      const appendRoute = (
        start: { name: string; gx: number; gy: number },
        destinations: typeof route,
        opacity: number,
        branch: boolean,
      ) => {
        let from = start;
        for (const { authored, bow, resolved: routeTarget } of destinations) {
          if (!routeTarget) continue;
          const legIndex = legs.length;
          legs.push(legPath(from, routeTarget, bow));
          legColors.push(arm.color);
          legOpacities.push(opacity);
          legRevealAt.push(revealAt);
          armLegIndices.push(legIndex);
          (branch ? branchLegIndices : mainLegIndices).push(legIndex);

          const id = armTargetId(authored);
          let sharedTarget = strategicTargetById.get(id);
          if (!sharedTarget) {
            sharedTarget = {
              id,
              name: routeTarget.name,
              gx: routeTarget.gx,
              gy: routeTarget.gy,
              text: authored.text,
              source: authored.source,
              ...(authored.placement ? { placement: authored.placement } : {}),
              label: authored.label,
              legionIds: [],
              legIndices: [],
              revealAt,
            };
            strategicTargetById.set(id, sharedTarget);
          }
          if (!sharedTarget.legionIds.includes(arm.legion)) {
            sharedTarget.legionIds.push(arm.legion);
          }
          sharedTarget.legIndices.push(legIndex);
          sharedTarget.revealAt = Math.min(sharedTarget.revealAt, revealAt);
          from = routeTarget;
        }
      };

      appendRoute(w, route, arm.opacity ?? 0.9, false);

      for (const branch of arm.branches ?? []) {
        const branchStart = "world" in branch.from ? byId.get(branch.from.world) : branch.from;
        const branchRouteAuthored = [
          ...(branch.via ?? []).map((via) => ({ target: via.target, bow: via.bow })),
          { target: branch.target, bow: branch.bow },
        ];
        const branchRoute = branchRouteAuthored.map(({ target, bow }) => ({
          authored: target,
          bow,
          resolved: "world" in target ? byId.get(target.world) : target,
        }));
        const missingBranchTarget = !branchStart
          ? branch.from
          : branchRoute.find(({ resolved }) => !resolved)?.authored;
        if (missingBranchTarget) {
          const targetName =
            "world" in missingBranchTarget ? missingBranchTarget.world : missingBranchTarget.name;
          devWarn(
            `${voyage.id}: arm ${arm.legion} branch "${branch.name}" target "${targetName}" not on the chart — dropped`,
          );
          continue;
        }
        if (branchStart) appendRoute(branchStart, branchRoute, branch.opacity ?? 0.28, true);
      }

      const finalTarget = route.at(-1)?.resolved;
      if (!finalTarget || armLegIndices.length < 1) continue;
      strategicArms.push({
        legIndices: armLegIndices,
        mainLegIndices,
        branchLegIndices,
        color: arm.color,
        legion: arm.legion,
        name: arm.name,
        role: arm.role,
        text: arm.text,
        source: arm.source,
        targetName: finalTarget.name,
        revealAt,
      });
      resolvedArms += 1;
    }
    if (resolvedArms > 0) {
      stations[revealAt].armCount = resolvedArms;
      stations[revealAt].armLegions = strategicArms
        .filter((arm) => arm.revealAt === revealAt)
        .map((arm) => arm.legion);
    }
  });

  return {
    id: voyage.id,
    name: voyage.name,
    tag: voyage.tag,
    blurb: voyage.blurb,
    ...(voyage.continuation ? { continuation: voyage.continuation } : {}),
    ...(voyage.cartography ? { cartography: voyage.cartography } : {}),
    ...(voyage.strategic ? { strategic: voyage.strategic } : {}),
    lbl: voyage.lbl,
    stations,
    legs,
    legColors,
    legOpacities,
    legRevealAt,
    strategicArms,
    strategicTargets: [...strategicTargetById.values()],
  };
}
