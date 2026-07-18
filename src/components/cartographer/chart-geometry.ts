/**
 * chart-geometry.ts — every deterministic construction of the Cartographer
 * chart. Pure math, no DOM, no React — seeded LCG streams keep the chart
 * bit-identical across loads. Zone graphics come from the hand-curated
 * zones.json, not from this file.
 *
 * Heavy results are memoized at module level; they are only computed on the
 * client (the chart is mount-gated), but nothing here would break in SSR.
 */

import { GRID_H, GRID_W, TERRA } from "@/lib/map/projection";
import { CURATED_ZONES } from "@/lib/map/zones";

export const W = GRID_W;
export const H = GRID_H;
export const TX = TERRA.gx;
export const TY = TERRA.gy;

/* Palette constants used inside generated SVG attributes (fill/stroke values
   can't come from CSS vars everywhere — gradients & canvas need raw colors).
   Mirror of the Kathedrale tokens in 00-tokens.css. */
export const BONE = "#e4ddcb";
export const GOLD = "#a48c52";
export const BLOOD = "#8e3b32";
export const ICE = "#9ce6ff";
/** Nurgle bile — an "unhealthy green" for plague zones. */
export const PLAGUE = "#8fae4a";

/** Deterministic scatter (no Math.random: stable chart across loads). */
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Polar frame: Solar core + four stepped wedges.
   Measured from the canonical reference chart (design/beispiele/
   "wh40k galaxy map - small.jpg"): the 1041 SSOT world positions were
   registered onto the map by brightness-maximization (uniform scale, NO
   rotation — the curation was traced on exactly this chart; s = 3.902
   px/gu, Terra = px 1317/1878), then the four segmentum fills were
   mask-extracted along 720 rays and their stepped outer edges quantized
   (raw profiles: flat plateaus ±3 gu).
   Angles are y-down math degrees (0° = galactic east); Ultima wraps
   through 0°, so its steps run past 360°. */

export function pp(aDeg: number, r: number): [number, number] {
  const a = (aDeg * Math.PI) / 180;
  return [TX + Math.cos(a) * r, TY + Math.sin(a) * r];
}

function arcTo(d: string, r: number, aFrom: number, aTo: number, sweep: 0 | 1): string {
  const p = pp(aTo, r);
  const large = Math.abs(aTo - aFrom) > 180 ? 1 : 0;
  return `${d} A ${r} ${r} 0 ${large} ${sweep} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
}

export interface WedgeStep {
  a0: number;
  a1: number;
  r: number;
}

export interface WedgeDef {
  /** Inner arc radius — all four wedges start on the Solar ring. */
  r0: number;
  steps: WedgeStep[];
}

export const POLAR_RINGS = [215, 300, 385];
/** Measured Solar ring: 481 px / 3.902 px·gu⁻¹. */
export const SOLAR_R = 123.3;

export const WEDGES: WedgeDef[] = [
  // Segmentum Pacificus — west (single shallow arc)
  { r0: SOLAR_R, steps: [{ a0: 136.5, a1: 225.3, r: 267.5 }] },
  // NOTE Tempestus r0: the reference measures 139 (just outside the Solar
  // ring), but the two nearly parallel gold arcs at 123.3/139 read as a
  // broken double line — the inner edge starts ON the Solar ring like all
  // other wedges.
  // Segmentum Obscurus — north-west to north (two plateaus)
  {
    r0: SOLAR_R,
    steps: [
      { a0: 225.3, a1: 270, r: 391 },
      { a0: 270, a1: 312.8, r: 429.5 },
    ],
  },
  // Segmentum Ultima — the whole east, out to the Eastern Fringe
  {
    r0: SOLAR_R,
    steps: [
      { a0: 312.8, a1: 330, r: 609.5 },
      { a0: 330, a1: 344, r: 588.5 },
      { a0: 344, a1: 369.5, r: 668 },
      { a0: 369.5, a1: 388, r: 626.5 },
      { a0: 388, a1: 406, r: 665.5 },
    ],
  },
  // Segmentum Tempestus — south (deepest on its eastern flank)
  {
    r0: SOLAR_R,
    steps: [
      { a0: 406, a1: 435, r: 400 },
      { a0: 435, a1: 466, r: 361 },
      { a0: 466, a1: 496.5, r: 302 },
    ],
  },
];

const STEPS: WedgeStep[] = WEDGES.flatMap((w) => w.steps);

export function wedgePath(r0: number, steps: WedgeStep[]): string {
  const a0 = steps[0].a0;
  const a1 = steps[steps.length - 1].a1;
  const s0 = pp(a0, r0);
  let d = `M ${s0[0].toFixed(1)} ${s0[1].toFixed(1)}`;
  d = arcTo(d, r0, a0, a1, 1);
  const q = pp(a1, steps[steps.length - 1].r);
  d += ` L ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  for (let i = steps.length - 1; i >= 0; i--) {
    d = arcTo(d, steps[i].r, steps[i].a1, steps[i].a0, 0);
    if (i > 0) {
      const j = pp(steps[i].a0, steps[i - 1].r);
      d += ` L ${j[0].toFixed(1)} ${j[1].toFixed(1)}`;
    }
  }
  return d + " Z";
}

/** Outer wedge radius at a bearing (segment-edge silhouette). The four
 *  measured wedges tile the full circle over [136.5°, 496.5°). */
export function outerR(aDeg: number): number {
  let a = ((aDeg % 360) + 360) % 360;
  if (a < 136.5) a += 360;
  for (const s of STEPS) if (a >= s.a0 && a < s.a1) return s.r;
  return SOLAR_R;
}

/** How close a silhouette edge may come to a graticule radius before the
 *  grid yields there: ring 385 ran 6/15/24 gu below the Obscurus/Tempestus
 *  steps — unevenly paced double lines. */
export const RING_CLEAR = 26;

/** Graticule ring as arc spans, gapped wherever a segment-silhouette step
 *  runs within `clear` gu of the ring — the grid yields to the silhouette.
 *  Returns null when nothing comes close (render the plain full circle). */
export function ringArcs(r: number, clear = RING_CLEAR): string[] | null {
  const gaps: [number, number][] = [];
  for (const s of STEPS) if (Math.abs(r - s.r) < clear) gaps.push([s.a0, s.a1]);
  if (gaps.length === 0) return null;
  gaps.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const g of gaps) {
    const last = merged[merged.length - 1];
    if (last && g[0] <= last[1] + 0.01) last[1] = Math.max(last[1], g[1]);
    else merged.push([g[0], g[1]]);
  }
  // Kept spans = complement inside the wrapped step domain [136.5°, 496.5°).
  const d0 = STEPS[0].a0;
  const d1 = d0 + 360;
  const spans: [number, number][] = [];
  let cursor = d0;
  for (const [g0, g1] of merged) {
    if (g0 > cursor) spans.push([cursor, g0]);
    cursor = Math.max(cursor, g1);
  }
  if (cursor < d1) spans.push([cursor, d1]);
  // First and last span meet across the domain seam — join them.
  if (spans.length > 1 && spans[0][0] === d0 && spans[spans.length - 1][1] === d1) {
    const tail = spans.pop();
    if (tail) spans[0] = [tail[0] - 360, spans[0][1]];
  }
  return spans.map(([a0, a1]) => {
    const p0 = pp(a0, r);
    let d = `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`;
    // Split long spans so every A command stays under 180°.
    let a = a0;
    while (a < a1 - 0.01) {
      const next = Math.min(a1, a + 180);
      d = arcTo(d, r, a, next, 1);
      a = next;
    }
    return d;
  });
}

/* Segmentum watermarks + fly-to jumps (label anchors read off the
   reference chart, projected into grid space) */

export interface SegmentumMark {
  name: string;
  x: number;
  y: number;
  fs: number;
  jump: { x: number; y: number; k: number };
}

export const SEGS: SegmentumMark[] = [
  { name: "Segmentum Solar", x: 276, y: 409, fs: 26, jump: { x: 333, y: 402, k: 2.1 } },
  { name: "Segmentum Obscurus", x: 332, y: 106, fs: 30, jump: { x: 332, y: 145, k: 2.0 } },
  { name: "Segmentum Pacificus", x: 124, y: 361, fs: 26, jump: { x: 150, y: 400, k: 2.0 } },
  { name: "Segmentum Tempestus", x: 355, y: 650, fs: 30, jump: { x: 355, y: 630, k: 1.9 } },
  { name: "Ultima Segmentum", x: 752, y: 500, fs: 46, jump: { x: 760, y: 480, k: 1.5 } },
];

/* Storm-band spines.
   Derived from hand-drawn zones (zones.json): a band zone has a long axis,
   so a cross-slice midline — at each sample along the long axis the midpoint
   between the band's outermost boundary crossings — gives its spine; two
   smoothing passes iron out the slice jitter where the band bulges. The
   Cicatrix Maledictum runs west→east (slices along X), the M31 Ruinstorm
   wall runs north→south (slices along Y). A spine is ONLY the shadow
   boundary of the Lumen/Nihilus overlays (shadowBeyond below); the zone
   layer renders the drawn outline itself. Whenever the zone editor moves a
   band, the overlays follow on the next build. */

interface Pt {
  x: number;
  y: number;
}

interface Spine {
  d: string;
  a: Pt;
  b: Pt;
}

/** Cross-slice midline of a published band zone along `axis`, or null when
 *  the zone is missing/degenerate. `a` is the low-coordinate end (west resp.
 *  north), `b` the high end. */
function bandSpine(zoneName: string, axis: "x" | "y"): Spine | null {
  const zone = CURATED_ZONES.find((z) => z.name === zoneName && z.published);
  if (!zone) return null;
  const pts = zone.points;
  // (u, v): u runs along the band's long axis, v across it.
  const U = axis === "x" ? 0 : 1;
  const V = 1 - U;
  const us = pts.map((p) => p[U]);
  const uMin = Math.min(...us);
  const uMax = Math.max(...us);
  // Sample just inside the tips — the exact extremes are tangent points
  // with no band width to bisect.
  const inset = (uMax - uMin) * 0.012;
  const N = 30;
  const mid: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const u = uMin + inset + (uMax - uMin - 2 * inset) * (i / N);
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < pts.length; j++) {
      const pa = pts[j];
      const pb = pts[(j + 1) % pts.length];
      if (pa[U] === pb[U]) continue;
      if ((pa[U] <= u && u < pb[U]) || (pb[U] <= u && u < pa[U])) {
        const v = pa[V] + ((u - pa[U]) / (pb[U] - pa[U])) * (pb[V] - pa[V]);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    if (hi < lo) continue; // slice missed the band entirely
    const m = (lo + hi) / 2;
    mid.push(axis === "x" ? { x: u, y: m } : { x: m, y: u });
  }
  if (mid.length < 2) return null;
  for (let pass = 0; pass < 2; pass++)
    for (let i = 1; i < mid.length - 1; i++)
      mid[i] =
        axis === "x"
          ? { x: mid[i].x, y: (mid[i - 1].y + 2 * mid[i].y + mid[i + 1].y) / 4 }
          : { x: (mid[i - 1].x + 2 * mid[i].x + mid[i + 1].x) / 4, y: mid[i].y };
  const d = mid
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return { d, a: mid[0], b: mid[mid.length - 1] };
}

/* The Cicatrix falls back to the retired hand-tuned curve should the zone
   ever be renamed/unpublished — the present chart must not lose its shadow
   to a curation edit. */
const RIFT_FALLBACK: Spine = {
  d: "M 262 228 C 350 200, 430 198, 516 232 S 596 330, 618 428 S 662 546, 716 588",
  a: { x: 262, y: 228 },
  b: { x: 716, y: 588 },
};

const RIFT = bandSpine("Cicatrix Maledictum", "x") ?? RIFT_FALLBACK;

export const RIFT_D = RIFT.d;
export const RIFT_A: Pt = RIFT.a;
export const RIFT_B: Pt = RIFT.b;

/* Shadow geometry: radial edges from Terra through both spine ends, closing
   on a far circle r=2600 so no overlay edge ever pans into view. The
   counterclockwise closure encloses the LEFT-hand side of the a→b walk —
   north-east of the west→east Cicatrix, east of the north→south Ruinstorm. */

export const NIHILUS_RFAR = 2600;

function shadowBeyond(spine: Spine): string {
  const far = (p: Pt): Pt => {
    const dx = p.x - TX;
    const dy = p.y - TY;
    const l = Math.hypot(dx, dy);
    return { x: TX + (dx / l) * NIHILUS_RFAR, y: TY + (dy / l) * NIHILUS_RFAR };
  };
  const bf = far(spine.b);
  const af = far(spine.a);
  return (
    `${spine.d} L ${bf.x.toFixed(1)} ${bf.y.toFixed(1)}` +
    ` A ${NIHILUS_RFAR} ${NIHILUS_RFAR} 0 0 0 ${af.x.toFixed(1)} ${af.y.toFixed(1)} Z`
  );
}

let nihilusD: string | null = null;

export function nihilusPath(): string {
  if (nihilusD) return nihilusD;
  nihilusD = shadowBeyond(RIFT);
  return nihilusD;
}

/** M31 counterpart of the rift cut: the Ruinstorm wall (unleashed at Calth)
 *  intercepts the Astronomican over the galactic east — the Imperium
 *  Secundus premise. Derived from the published "The Ruinstorm" zone; null
 *  (no cut, full light disc) when curation removes or renames it — the hh
 *  chart degrades gracefully instead of losing its light. */
export interface BandShadow {
  spineD: string;
  shadowD: string;
}

let ruinstormMemo: BandShadow | null | undefined;

export function ruinstormShadow(): BandShadow | null {
  if (ruinstormMemo !== undefined) return ruinstormMemo;
  const spine = bandSpine("The Ruinstorm", "y");
  ruinstormMemo = spine ? { spineD: spine.d, shadowD: shadowBeyond(spine) } : null;
  return ruinstormMemo;
}

/* Dot graticule (star-chart texture) */

export function gridDots(): { x: number; y: number; op: number }[] {
  const dots: { x: number; y: number; op: number }[] = [];
  for (let gx = 50; gx < W; gx += 50)
    for (let gy = 50; gy < H; gy += 50)
      dots.push({ x: gx, y: gy, op: gx % 100 === 0 && gy % 100 === 0 ? 0.13 : 0.06 });
  return dots;
}

/* Star-dust scatter (LCG spread in size + brightness, always clearly below
   the work pins). Ranges are tuned so the full 1054-contact census stays
   legible at home zoom. */

export interface DustLook {
  r: number;
  op: number;
}

export function dustScatter(count: number): DustLook[] {
  const rnd = lcg(422);
  return Array.from({ length: count }, () => {
    let r = 0.95 + rnd() * 0.6;
    let op = 0.3 + rnd() * 0.26;
    if (rnd() < 0.09) {
      r = 1.55 + rnd() * 0.4;
      op = 0.55 + rnd() * 0.15;
    }
    return { r, op };
  });
}

