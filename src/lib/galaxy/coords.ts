// Polar ↔ SVG math. All math is byte-identical to the prototype so a
// pasted CICATRIX_PTS / world coord lands at exactly the same pixel.
//
// Convention:
//   polar(r, a) = [50 + r*50*cos(a-90°), 50 + r*50*sin(a-90°)]
//   r ∈ [0, 1.6], aDeg ∈ (-180, 180], 0° = galactic-north, CW positive.

import type { Segmentum } from "./types";

export function polar(
  r: number,
  aDeg: number,
  cx = 50,
  cy = 50,
  scale = 50,
): [number, number] {
  const a = ((aDeg - 90) * Math.PI) / 180;
  return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
}

// SVG path for a donut wedge (segmentum). Identical formula to prototype.
export function wedgePath(
  inner: number,
  outer: number,
  a0: number,
  a1: number,
): string {
  const SCALE = 50;
  const cx = 50;
  const cy = 50;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const p1 = [
    cx + inner * SCALE * Math.cos(rad(a0)),
    cy + inner * SCALE * Math.sin(rad(a0)),
  ];
  const p2 = [
    cx + outer * SCALE * Math.cos(rad(a0)),
    cy + outer * SCALE * Math.sin(rad(a0)),
  ];
  const p3 = [
    cx + outer * SCALE * Math.cos(rad(a1)),
    cy + outer * SCALE * Math.sin(rad(a1)),
  ];
  const p4 = [
    cx + inner * SCALE * Math.cos(rad(a1)),
    cy + inner * SCALE * Math.sin(rad(a1)),
  ];
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p1[0]} ${p1[1]}
          L ${p2[0]} ${p2[1]}
          A ${outer * SCALE} ${outer * SCALE} 0 ${large} 1 ${p3[0]} ${p3[1]}
          L ${p4[0]} ${p4[1]}
          A ${inner * SCALE} ${inner * SCALE} 0 ${large} 0 ${p1[0]} ${p1[1]} Z`;
}

// Inverse of polar(): SVG viewBox (0..100) back to [r, a] in (-180, 180].
export function svgToPolar(x: number, y: number): [number, number] {
  const dx = x - 50;
  const dy = y - 50;
  const r = Math.min(1.6, Math.sqrt(dx * dx + dy * dy) / 50);
  let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return [r, a];
}

// Point-in-segment test — same semantics as prototype's window.inSegment.
// Solar covers the central disc with no angular bounds; the rest are donut
// sectors over [inner, outer] × [a0, a1] in degrees (possibly wrapping past 360).
export function inSegment(r: number, a: number, s: Segmentum | undefined): boolean {
  if (!s) return false;
  if (s.id === "solar") return r <= s.outer + 1e-6;
  if (r < s.inner - 1e-6 || r > s.outer + 1e-6) return false;
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const an = norm(a);
  const a0 = norm(s.a0);
  const a1 = norm(s.a1);
  if (a0 <= a1) return an >= a0 && an <= a1;
  return an >= a0 || an <= a1;
}

// Distance between two polar points, in viewBox units (so 1.0 ≈ disc-radius).
export function polarDistance(
  r0: number,
  a0: number,
  r1: number,
  a1: number,
): number {
  const [x0, y0] = polar(r0, a0);
  const [x1, y1] = polar(r1, a1);
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}

// 8-wind compass label for an angle in our convention (0=N, 90=E, 180=S, -90=W).
export function compass(aDeg: number): string {
  const a = ((aDeg % 360) + 360) % 360;
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(a / 45) % 8];
}

// Map client coordinates to SVG viewBox (0..100) coordinates of the given svg.
export function screenToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): [number, number] {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return [x, y];
}
