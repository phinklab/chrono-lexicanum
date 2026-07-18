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

/** Closed outline path — Catmull-Rom → cubic Béziers when smooth. */
export function zonePath(zone: ZoneDef): string {
  const pts = zone.points;
  if (pts.length < 3) return "";
  if (!zone.smooth) {
    return (
      pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
      " Z"
    );
  }
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
