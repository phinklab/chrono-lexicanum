// Procedural background stars — port of regenerateBackgroundStars from
// galaxy-data.js. Pure functions; no window writes.
//
// Deterministic LCG seeded by `seed` (default 4242). Same seed → identical
// stars across reloads / Strict-Mode double-mount → no flicker. The disc's
// useMemo keys on [segKey, era] so the regeneration cost runs at most once
// per slider drag-end.

import { polar } from "./coords";
import type { BackgroundStarSet, BgStar, Faction, Polar, Segmentum, SegmentumId } from "./types";

const ARMS = [0, 90, 180, 270];
const PITCH = 280;
const ARM_WIDTH = 18;

const BASE_DENSITY: Readonly<Record<SegmentumId, number>> = {
  obscurus: 950,
  ultima: 950,
  tempestus: 950,
  pacificus: 950,
  solar: 1800,
};

function distToArm(r: number, a: number): number {
  let m = Infinity;
  for (const arm of ARMS) {
    const armA = (arm + PITCH * r) % 360;
    const d = Math.abs((((a - armA) % 360) + 540) % 360 - 180);
    if (d < m) m = d;
  }
  return m;
}

export function regenerateBackgroundStars(
  segments: readonly Segmentum[],
  seed = 4242,
): BackgroundStarSet {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const stars: BgStar[] = [];

  for (const seg of segments) {
    let placed = 0;
    let attempts = 0;
    const angSpan = seg.id === "solar" ? 360 : Math.abs(seg.a1 - seg.a0);
    const innerR = seg.id === "solar" ? 0 : seg.inner;
    const area =
      (angSpan / 360) * Math.PI * (seg.outer * seg.outer - innerR * innerR);
    const cap = Math.round((BASE_DENSITY[seg.id] || 600) * area);
    while (placed < cap && attempts < cap * 6) {
      attempts++;
      const u = rnd();
      const r =
        seg.id === "solar"
          ? Math.sqrt(rnd()) * seg.outer
          : seg.inner + Math.sqrt(u) * (seg.outer - seg.inner);
      const a =
        seg.id === "solar"
          ? rnd() * 360
          : seg.a0 + rnd() * (seg.a1 - seg.a0);
      const d = distToArm(r, a);
      const armBias = Math.exp(-(d * d) / (2 * ARM_WIDTH * ARM_WIDTH));
      const accept = 0.18 + 0.82 * armBias;
      if (rnd() >= accept) continue;
      const roll = rnd();
      let faction: Faction = "neutral";
      if (roll < 0.55) faction = "imperium";
      else if (roll < 0.78) faction = "neutral";
      else if (roll < 0.86) faction = "xenos";
      else if (roll < 0.94) faction = "chaos";
      else faction = "necron";
      const tier = rnd();
      let size: number;
      if (tier < 0.78) size = 0.10 + rnd() * 0.18;
      else if (tier < 0.96) size = 0.28 + rnd() * 0.28;
      else size = 0.55 + rnd() * 0.5;
      const bright = tier > 0.96;
      stars.push({
        r,
        a,
        faction,
        size,
        segId: seg.id,
        bright,
        armBias,
        twinkle: 3 + rnd() * 6,
        delay: rnd() * 5,
      });
      placed++;
    }
  }

  // Halo extension — sparse stars BEYOND each segment's outer radius.
  const nonSolar = segments.filter((x) => x.id !== "solar");
  const maxOuter = nonSolar.length ? Math.max(...nonSolar.map((x) => x.outer)) : 1.0;
  const halo: BgStar[] = [];
  let h = 9999;
  const hrnd = () => {
    h = (h * 9301 + 49297) % 233280;
    return h / 233280;
  };
  const HALO_COUNT = 1200;
  for (let i = 0; i < HALO_COUNT; i++) {
    const a = hrnd() * 360;
    const aN = ((a % 360) + 360) % 360;
    let segOuter = maxOuter;
    for (const seg of segments) {
      if (seg.id === "solar") continue;
      const aa0 = ((seg.a0 % 360) + 360) % 360;
      const aa1 = ((seg.a1 % 360) + 360) % 360;
      const inWedge =
        aa0 <= aa1 ? aN >= aa0 && aN <= aa1 : aN >= aa0 || aN <= aa1;
      if (inWedge) {
        segOuter = seg.outer;
        break;
      }
    }
    const r = segOuter + Math.sqrt(hrnd()) * 0.55;
    const tier = hrnd();
    let size: number;
    if (tier < 0.85) size = 0.08 + hrnd() * 0.12;
    else if (tier < 0.98) size = 0.20 + hrnd() * 0.20;
    else size = 0.42 + hrnd() * 0.30;
    const bright = tier > 0.98;
    halo.push({
      r,
      a,
      faction: "neutral",
      size,
      segId: "halo",
      bright,
      armBias: 0.05,
      twinkle: 3 + hrnd() * 6,
      delay: hrnd() * 5,
    });
  }

  return { stars, halo };
}

// Small viewport star (parallax background / motes). Deterministic by seed.
export interface ViewportStar {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
  delay: number;
}

export function makeStars(n: number, seed = 7): ViewportStar[] {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: rnd() * 100,
    y: rnd() * 100,
    z: rnd(),
    size: 0.4 + rnd() * 1.6,
    twinkle: 2 + rnd() * 6,
    delay: rnd() * 4,
  }));
}

// Sample the silhouette path of a non-circular disc (one arc per non-solar
// segmentum). Used as `<clipPath>` and for every concentric ring / spoke.
export function silhouettePathD(
  segments: readonly Segmentum[],
  fraction = 1.0,
): string {
  const SCALE = 50;
  const cx = 50;
  const cy = 50;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const nonSolar = segments.filter((s) => s.id !== "solar");
  let dStr = "";
  nonSolar.forEach((seg, idx) => {
    const r = seg.outer * fraction * SCALE;
    const sx = cx + r * Math.cos(rad(seg.a0));
    const sy = cy + r * Math.sin(rad(seg.a0));
    const ex = cx + r * Math.cos(rad(seg.a1));
    const ey = cy + r * Math.sin(rad(seg.a1));
    const large = Math.abs(seg.a1 - seg.a0) > 180 ? 1 : 0;
    dStr += idx === 0 ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
    dStr += `A ${r} ${r} 0 ${large} 1 ${ex} ${ey} `;
  });
  dStr += "Z";
  return dStr;
}

// Outer radius of the disc at any angle (degrees). Drives compass ticks and
// spoke endpoints so they touch the per-segment silhouette.
export function segOuterAt(
  segments: readonly Segmentum[],
  aDeg: number,
): number {
  const nonSolar = segments.filter((s) => s.id !== "solar");
  const aN = ((aDeg % 360) + 360) % 360;
  for (const seg of nonSolar) {
    const aa0 = ((seg.a0 % 360) + 360) % 360;
    const aa1 = ((seg.a1 % 360) + 360) % 360;
    const inWedge =
      aa0 <= aa1 ? aN >= aa0 && aN <= aa1 : aN >= aa0 || aN <= aa1;
    if (inWedge) return seg.outer;
  }
  return 1.0;
}

// Convert a Polar pair to SVG viewBox coords. Useful for path generators
// that don't want to import { polar } themselves.
export function polarPair(p: Polar): [number, number] {
  return polar(p[0], p[1]);
}
