/**
 * voyages/resolve.ts — stop → chart-coordinate resolution and leg generation
 * for the Great Journeys.
 *
 * Stations resolve over featured AND dust worlds (a pinned world with no
 * linked works — Luna — is a legitimate station). Waypoints resolve to a
 * point ON the enclosing leg (previous station → next station) at fraction
 * `via` of the path parameter — the "on the way" beats for worlds the chart
 * cannot locate. An unresolvable stop drops with a dev-console warning;
 * `scripts/test-voyages.ts` fails hard on the same cases so a bad stop
 * cannot ship silently.
 *
 * Legs connect consecutive STATIONS only (waypoints never bend geometry) and
 * default to quadratic Béziers: control point = leg midpoint pushed
 * perpendicular by `bow` grid units, side chosen AWAY from Terra so arcs
 * read as transits skirting the core (matches the hand-drawn originals).
 * A station's `leg.bow` tunes the curvature, `leg.d` replaces the path.
 * Every resolved stop carries `legIndex` (the leg it rides or arrives on) —
 * RoutesLayer derives the tour's draw gating from it.
 */

import { TERRA } from "../projection";
import { isWaypoint, type Voyage, type VoyageStation } from "./types";

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
  /** "world" = a chart station (ring); "way" = a leg waypoint (dot). */
  kind: "world" | "way";
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
}

export interface ResolvedVoyage {
  id: string;
  name: string;
  tag: string;
  blurb: string;
  lbl: { x: number; y: number; t: string };
  stations: ResolvedStation[];
  /** One SVG path `d` per STATION transition (worldCount − 1). */
  legs: string[];
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

export function resolveVoyage(voyage: Voyage, chart: VoyageChart): ResolvedVoyage {
  const byId = new Map<string, { name: string; gx: number; gy: number }>();
  for (const f of chart.featured) byId.set(f.id, { name: f.name, gx: f.gx, gy: f.gy });
  for (const d of chart.dust) byId.set(d[3], { name: d[4], gx: d[0], gy: d[1] });

  // Pass 1 — resolve the world stations (in stop order) and build the legs.
  interface Anchor {
    stop: VoyageStation;
    w: { name: string; gx: number; gy: number };
    stopIdx: number;
  }
  const anchors: Anchor[] = [];
  const anchorByStop = new Map<number, number>();
  voyage.stations.forEach((stop, stopIdx) => {
    if (isWaypoint(stop)) return;
    const w = byId.get(stop.world);
    if (!w) {
      devWarn(`${voyage.id}: station "${stop.world}" not on the chart — dropped`);
      return;
    }
    anchorByStop.set(stopIdx, anchors.length);
    anchors.push({ stop, w, stopIdx });
  });
  const legs: string[] = anchors
    .slice(1)
    .map((a, k) => a.stop.leg?.d ?? legPath(anchors[k].w, a.w, a.stop.leg?.bow));

  // Pass 2 — assemble the act sequence; waypoints ride the leg between the
  // anchors around them.
  const stations: ResolvedStation[] = [];
  let lastAnchor = -1;
  voyage.stations.forEach((stop, stopIdx) => {
    if (!isWaypoint(stop)) {
      const k = anchorByStop.get(stopIdx);
      if (k === undefined) return; // dropped above
      lastAnchor = k;
      const { w } = anchors[k];
      const st: ResolvedStation = {
        i: stations.length,
        kind: "world",
        id: stop.world,
        name: w.name,
        heading: stop.heading ?? w.name,
        text: stop.text,
        gx: w.gx,
        gy: w.gy,
        legIndex: k - 1,
      };
      if (stop.date) st.date = stop.date;
      stations.push(st);
      return;
    }
    const legIdx = lastAnchor;
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
    stations.push(st);
  });

  return {
    id: voyage.id,
    name: voyage.name,
    tag: voyage.tag,
    blurb: voyage.blurb,
    lbl: voyage.lbl,
    stations,
    legs,
  };
}
