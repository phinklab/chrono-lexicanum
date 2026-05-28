// Shared corridor / polygon shape construction for Necron + Tyranid zones.
// 2-pt zones become a rounded capsule; 3+-pt zones become a smooth closed
// shape interpolated through edge midpoints. Returns the path string, a
// bounding box, a point-in-shape test and a label anchor.

import { polar } from "@/lib/galaxy/coords";
import type { Polar } from "@/lib/galaxy/types";

export interface ZoneShape {
  pathD: string;
  labelXY: [number, number];
  bbMinX: number;
  bbMinY: number;
  bbMaxX: number;
  bbMaxY: number;
  inside: (px: number, py: number) => boolean;
}

export function buildZoneShape(rawPts: readonly Polar[]): ZoneShape | null {
  const pts = rawPts.map((p) => polar(p[0], p[1]) as [number, number]);
  if (pts.length < 2) return null;

  if (pts.length === 2) {
    const [p0, p1] = pts;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const lenSq = Math.max(1e-6, dx * dx + dy * dy);
    const len = Math.sqrt(lenSq);
    const nx = -dy / len;
    const ny = dx / len;
    const halfW = 3.8;
    const c0a: [number, number] = [p0[0] + nx * halfW, p0[1] + ny * halfW];
    const c0b: [number, number] = [p0[0] - nx * halfW, p0[1] - ny * halfW];
    const c1a: [number, number] = [p1[0] + nx * halfW, p1[1] + ny * halfW];
    const c1b: [number, number] = [p1[0] - nx * halfW, p1[1] - ny * halfW];
    const pathD =
      `M ${c0a[0]} ${c0a[1]} L ${c1a[0]} ${c1a[1]} ` +
      `A ${halfW} ${halfW} 0 0 1 ${c1b[0]} ${c1b[1]} ` +
      `L ${c0b[0]} ${c0b[1]} ` +
      `A ${halfW} ${halfW} 0 0 1 ${c0a[0]} ${c0a[1]} Z`;
    const labelXY: [number, number] = [
      p0[0] + dx * 0.5 - ny * (halfW + 0.5),
      p0[1] + dy * 0.5 + nx * (halfW + 0.5),
    ];
    const bbMinX = Math.min(p0[0], p1[0]) - halfW;
    const bbMaxX = Math.max(p0[0], p1[0]) + halfW;
    const bbMinY = Math.min(p0[1], p1[1]) - halfW;
    const bbMaxY = Math.max(p0[1], p1[1]) + halfW;
    const inside = (px: number, py: number) => {
      const tt = Math.max(0, Math.min(1, ((px - p0[0]) * dx + (py - p0[1]) * dy) / lenSq));
      const ccx = p0[0] + tt * dx;
      const ccy = p0[1] + tt * dy;
      const ex = px - ccx;
      const ey = py - ccy;
      return ex * ex + ey * ey <= halfW * halfW;
    };
    return { pathD, labelXY, bbMinX, bbMinY, bbMaxX, bbMaxY, inside };
  }

  const n = pts.length;
  const mid = (i: number): [number, number] => [
    (pts[i][0] + pts[(i + 1) % n][0]) / 2,
    (pts[i][1] + pts[(i + 1) % n][1]) / 2,
  ];
  const start = mid(n - 1);
  let pathD = `M ${start[0]} ${start[1]} `;
  for (let i = 0; i < n; i++) {
    const c = pts[i];
    const m = mid(i);
    pathD += `Q ${c[0]} ${c[1]} ${m[0]} ${m[1]} `;
  }
  pathD += "Z";
  let bbMinX = Infinity;
  let bbMinY = Infinity;
  let bbMaxX = -Infinity;
  let bbMaxY = -Infinity;
  pts.forEach(([x, y]) => {
    if (x < bbMinX) bbMinX = x;
    if (y < bbMinY) bbMinY = y;
    if (x > bbMaxX) bbMaxX = x;
    if (y > bbMaxY) bbMaxY = y;
  });
  const inside = (px: number, py: number) => {
    let ins = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = pts[i][0];
      const yi = pts[i][1];
      const xj = pts[j][0];
      const yj = pts[j][1];
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) ins = !ins;
    }
    return ins;
  };
  let cx = 0;
  let cy = 0;
  pts.forEach(([x, y]) => {
    cx += x;
    cy += y;
  });
  const labelXY: [number, number] = [cx / n, cy / n];
  return { pathD, labelXY, bbMinX, bbMinY, bbMaxX, bbMaxY, inside };
}
