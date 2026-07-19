/**
 * zones.ts — hand-curated chart zones.
 *
 * Storm fields, interdiction zones and named areas are NEVER derived from
 * reference images — their shapes
 * are drawn by hand in the zone editor (/map?zones=edit) and baked into
 * `zones.json`. A zone ships on the chart only once `published` is true;
 * drafts exist solely for the editor.
 *
 * The same parser validates the committed file, the editor's localStorage
 * draft and any pasted JSON — the export of the editor is a drop-in
 * replacement for `zones.json`.
 */

import zonesJson from "./zones.json";

export const ZONE_KINDS = [
  "storm",
  "interdiction",
  "plague",
  "region",
  "traitoris",
  "perditus",
  "hive-fleet",
  "necron-dynasty",
] as const;
export type ZoneKind = (typeof ZONE_KINDS)[number];

/** The three chart editions: pre-Heresy (M30), Horus Heresy (M31), the
 *  present chart (M41/42). Pins are identical in every state — only zones
 *  and the time-bound instruments switch. */
export const MAP_STATES = ["pre", "hh", "now"] as const;
export type MapState = (typeof MAP_STATES)[number];

/** Census display mode for the zone layer: full → dimmed (fills at reduced
 *  opacity, names hidden) → hidden. */
export type ZonesMode = "on" | "dim" | "off";

/** Legend display mode for world-name labels: auto = the magnification
 *  ladder (big names first, more with zoom), all = every name at every
 *  magnification, off = no name labels (the selected world keeps its own). */
export type NamesMode = "auto" | "all" | "off";

/** Editor-facing names (the chart styles key off the raw kind). */
export const ZONE_KIND_LABELS: Record<ZoneKind, string> = {
  storm: "Warp storm",
  interdiction: "Interdiction zone",
  plague: "Plague zone",
  region: "Named region",
  traitoris: "Traitor-held space",
  perditus: "Lost zone (perditus)",
  "hive-fleet": "Hive fleet",
  "necron-dynasty": "Necron dynasty",
};

export interface ZoneDef {
  id: string;
  name: string;
  kind: ZoneKind;
  /** Closed Catmull-Rom spline through the points; false = hard polygon. */
  smooth: boolean;
  /** Only published zones render on the chart; drafts live in the editor. */
  published: boolean;
  /** Chart editions this zone exists in — non-empty, no duplicates. */
  states: MapState[];
  /** Grid-space vertices (same 0–1000 grid as every pin), ≥ 3. */
  points: [number, number][];
}

function isZoneKind(v: unknown): v is ZoneKind {
  return typeof v === "string" && (ZONE_KINDS as readonly string[]).includes(v);
}

function isMapState(v: unknown): v is MapState {
  return typeof v === "string" && (MAP_STATES as readonly string[]).includes(v);
}

/** Strict parse of a `{ zones: [...] }` payload; null when anything is off. */
export function parseZones(data: unknown): ZoneDef[] | null {
  if (typeof data !== "object" || data === null) return null;
  const zonesRaw = (data as { zones?: unknown }).zones;
  if (!Array.isArray(zonesRaw)) return null;
  const out: ZoneDef[] = [];
  for (const raw of zonesRaw) {
    if (typeof raw !== "object" || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.name !== "string") return null;
    if (!isZoneKind(o.kind)) return null;
    if (typeof o.smooth !== "boolean" || typeof o.published !== "boolean") return null;
    if (!Array.isArray(o.states) || o.states.length === 0) return null;
    const states: MapState[] = [];
    for (const s of o.states) {
      if (!isMapState(s) || states.includes(s)) return null;
      states.push(s);
    }
    if (!Array.isArray(o.points) || o.points.length < 3) return null;
    const points: [number, number][] = [];
    for (const p of o.points) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const [x, y] = p as unknown[];
      if (typeof x !== "number" || typeof y !== "number") return null;
      points.push([x, y]);
    }
    out.push({ id: o.id, name: o.name, kind: o.kind, smooth: o.smooth, published: o.published, states, points });
  }
  return out;
}

/** The committed curation (repo-reviewed; a broken file degrades to none). */
export const CURATED_ZONES: ZoneDef[] = parseZones(zonesJson) ?? [];

/** THE zone-visibility truth: published zones of one chart edition. Both
 *  renderers, the census count and the editor dimming key off this single
 *  predicate — no second filter chain anywhere. Results for the immutable
 *  committed curation are memoized per era: the canvas renderer calls this
 *  on every repaint frame. */
const visibleCache = new Map<MapState, ZoneDef[]>();

export function visibleZones(era: MapState, zones: ZoneDef[] = CURATED_ZONES): ZoneDef[] {
  if (zones !== CURATED_ZONES) return zones.filter((z) => z.published && z.states.includes(era));
  let hit = visibleCache.get(era);
  if (!hit) {
    hit = CURATED_ZONES.filter((z) => z.published && z.states.includes(era));
    visibleCache.set(era, hit);
  }
  return hit;
}

/** One Chaikin corner-cut on the closed control polygon before the
 *  Catmull-Rom pass — presentation-only resample so hand-set editor vertices
 *  never show through as kinks. zones.json stays untouched; the editor's
 *  wireframe + handles keep drawing the raw polygon. */
function chaikin(pts: [number, number][]): [number, number][] {
  const n = pts.length;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % n];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
    out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  return out;
}

/** Closed outline path — Chaikin-resampled Catmull-Rom → cubic Béziers when
 *  smooth; hard polygons (the necron voice) keep their corners. */
export function zonePath(zone: ZoneDef): string {
  if (zone.points.length < 3) return "";
  if (!zone.smooth) {
    return (
      zone.points
        .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(" ") + " Z"
    );
  }
  const pts = chaikin(zone.points);
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

/** Vertex average — the label anchor. */
export function zoneCentroid(zone: ZoneDef): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of zone.points) {
    sx += x;
    sy += y;
  }
  return { x: sx / zone.points.length, y: sy / zone.points.length };
}

/* ---- Label handwork (Imhof) + edge tint — shared by both renderers ---- */

/** Quadratic label arc in grid space for band-shaped zones (the Cicatrix
 *  corridor): SVG rides it as a textPath, the canvas places glyphs along it. */
export interface ZoneLabelArc {
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
}

export interface ZoneLabelLayout {
  /** Rotation onto the shape's principal axis, degrees. Clamped to ±30°;
   *  near-vertical and near-round shapes fall back to horizontal. */
  angle: number;
  /** Letterspacing in screen px (before --cg-ik compensation) — Sperrung
   *  grows with the zone's extent. */
  spacing: number;
  /** Screen px; the largest fields carry a slightly larger versal. */
  fontSize: number;
  /** Below the extent floor — labelled only from zoom band 1 upward. */
  small: boolean;
  /** Non-null only for long band shapes with a near-horizontal axis. */
  arc: ZoneLabelArc | null;
}

/** PCA over the zone's vertices: principal-axis angle (radians, y-down
 *  screen sense) plus the extents along/across that axis. */
function zoneAxis(zone: ZoneDef): { theta: number; major: number; minor: number } {
  const c = zoneCentroid(zone);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const [x, y] of zone.points) {
    const dx = x - c.x;
    const dy = y - c.y;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  let minA = Infinity;
  let maxA = -Infinity;
  let minP = Infinity;
  let maxP = -Infinity;
  for (const [x, y] of zone.points) {
    const dx = x - c.x;
    const dy = y - c.y;
    const a = dx * ux + dy * uy;
    const p = -dx * uy + dy * ux;
    if (a < minA) minA = a;
    if (a > maxA) maxA = a;
    if (p < minP) minP = p;
    if (p > maxP) maxP = p;
  }
  return { theta, major: maxA - minA, minor: maxP - minP };
}

/** Extent floor below which a zone name waits for zoom band 1. */
const SMALL_ZONE_EXTENT = 75;

const layoutCache = new WeakMap<ZoneDef, ZoneLabelLayout>();

export function zoneLabelLayout(zone: ZoneDef): ZoneLabelLayout {
  const hit = layoutCache.get(zone);
  if (hit) return hit;
  const { theta, major, minor } = zoneAxis(zone);
  const deg = (theta * 180) / Math.PI;
  const abs = Math.abs(deg);
  const elongation = minor > 0 ? major / minor : Infinity;
  // Imhof: tilt onto the axis, but never steeply — clamp to ±30°; drop tiny
  // tilts (they read as error, not intent) and the axis of roundish shapes
  // (noise); near-vertical shapes read horizontal.
  let angle = 0;
  if (elongation >= 1.35 && abs >= 7) {
    if (abs <= 30) angle = deg;
    else if (abs <= 55) angle = Math.sign(deg) * 30;
  }
  angle = Math.round(angle * 10) / 10;

  const spacing = Math.round(Math.min(3 + Math.max(0, major - 90) * 0.012, 7.5) * 10) / 10;
  const fontSize = major >= 260 ? 11 : 10;
  const small = major < SMALL_ZONE_EXTENT;

  // Band shapes with a near-horizontal axis get a light arc following the
  // shape's own bend (mean cross-axis offset of the middle third vs the ends).
  let arc: ZoneLabelArc | null = null;
  if (major >= 240 && elongation >= 2.4 && abs <= 38) {
    const c = zoneCentroid(zone);
    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    let midSum = 0;
    let midN = 0;
    let endSum = 0;
    let endN = 0;
    for (const [x, y] of zone.points) {
      const dx = x - c.x;
      const dy = y - c.y;
      const a = dx * ux + dy * uy;
      const p = -dx * uy + dy * ux;
      if (Math.abs(a) <= major / 6) {
        midSum += p;
        midN += 1;
      } else {
        endSum += p;
        endN += 1;
      }
    }
    const bow = (midN ? midSum / midN : 0) - (endN ? endSum / endN : 0);
    const sag =
      Math.sign(bow || 1) *
      Math.min(Math.max(Math.abs(bow) * 0.55, major * 0.028), major * 0.085);
    const half = major * 0.32;
    const r = (v: number) => Math.round(v * 10) / 10;
    arc = {
      x1: r(c.x - ux * half),
      y1: r(c.y - uy * half),
      // Quadratic control point: offset 2× the sagitta so the curve's apex
      // sits `sag` off the chord.
      cx: r(c.x - uy * 2 * sag),
      cy: r(c.y + ux * 2 * sag),
      x2: r(c.x + ux * half),
      y2: r(c.y + uy * half),
    };
  }

  const layout: ZoneLabelLayout = { angle, spacing, fontSize, small, arc };
  layoutCache.set(zone, layout);
  return layout;
}

/** True when the zone's name shows at a given magnification band ("0"–"3"):
 *  small zones earn their label only past the overview band. */
export function zoneLabelVisible(band: string, layout: ZoneLabelLayout): boolean {
  return !layout.small || band !== "0";
}

/** Concentric inner stroke widths (grid units, narrow → wide) for the edge
 *  tint. A stroke clipped to the fill shows only its inner half, so the
 *  visible rim of the widest band is ~16% of the cross-axis extent, capped
 *  so giant fields keep a rim rather than a gradient fill. */
export function zoneEdgeBands(zone: ZoneDef): [number, number, number] {
  const { minor } = zoneAxis(zone);
  const w3 = Math.min(Math.max(0.32 * minor, 6), 44);
  const r = (v: number) => Math.round(v * 10) / 10;
  return [r(w3 * 0.26), r(w3 * 0.55), r(w3)];
}
