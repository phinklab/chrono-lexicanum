import { pointOnLeg } from "./resolve";

const ROUTE_LABEL_FONT_SIZE = 9;
const ROUTE_LABEL_GLYPH_WIDTH = ROUTE_LABEL_FONT_SIZE * 0.6;
const ROUTE_LABEL_TRACKING = ROUTE_LABEL_FONT_SIZE * 0.24;

export interface VoyageBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface VoyageFit {
  gx: number;
  gy: number;
  k: number;
  dy: number;
}

/** Bounds of every station, waypoint and curved leg in grid coordinates. */
export function resolvedVoyageBounds(
  voyage: {
    stations: ReadonlyArray<{ gx: number; gy: number }>;
    legs: ReadonlyArray<string>;
    lbl: { x: number; y: number; t: string };
  },
  samplesPerLeg = 64,
): VoyageBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const station of voyage.stations) include(station.gx, station.gy);
  const steps = Math.max(2, Math.floor(samplesPerLeg));
  for (const leg of voyage.legs) {
    for (let index = 0; index <= steps; index += 1) {
      const point = pointOnLeg(leg, index / steps);
      if (point) include(point.x, point.y);
    }
  }

  // RoutesLayer and the Canvas renderer both draw this 9px mono label with
  // 0.24em tracking and a centred anchor. Include its visible extent so
  // "Show the full route" does not leave the route title offscreen.
  const glyphs = voyage.lbl.t.length;
  const labelWidth =
    glyphs * ROUTE_LABEL_GLYPH_WIDTH + Math.max(0, glyphs - 1) * ROUTE_LABEL_TRACKING;
  include(voyage.lbl.x - labelWidth / 2, voyage.lbl.y - ROUTE_LABEL_FONT_SIZE);
  include(voyage.lbl.x + labelWidth / 2, voyage.lbl.y + 2);

  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/** Bounds for one strategic arm, including its faint branch legs. */
export function resolvedVoyageArmBounds(
  voyage: { legs: ReadonlyArray<string> },
  arm: { legIndices: ReadonlyArray<number> },
  samplesPerLeg = 64,
): VoyageBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const steps = Math.max(2, Math.floor(samplesPerLeg));
  for (const legIndex of arm.legIndices) {
    const leg = voyage.legs[legIndex];
    if (!leg) continue;
    for (let index = 0; index <= steps; index += 1) {
      const point = pointOnLeg(leg, index / steps);
      if (!point) continue;
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/** Fit route bounds into the visible area above the docked journey card. */
export function fitVoyageBounds(
  bounds: VoyageBounds,
  viewport: { width: number; height: number },
  padding: { horizontal: number; top: number; bottom: number },
): VoyageFit {
  const usableWidth = Math.max(1, viewport.width - padding.horizontal * 2);
  const usableHeight = Math.max(1, viewport.height - padding.top - padding.bottom);
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const targetY = padding.top + usableHeight / 2;
  return {
    gx: (bounds.minX + bounds.maxX) / 2,
    gy: (bounds.minY + bounds.maxY) / 2,
    k: Math.min(usableWidth / spanX, usableHeight / spanY),
    dy: targetY - viewport.height / 2,
  };
}
