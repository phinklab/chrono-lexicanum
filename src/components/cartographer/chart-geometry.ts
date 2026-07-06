/**
 * chart-geometry.ts — every deterministic construction of the Cartographer
 * chart, ported 1:1 from the winning study (design/08-cartographer/
 * i-maledictum.html, Runde 5). Pure math, no DOM, no React — the rift spine
 * is sampled analytically (the study measured a live <path>), everything
 * else uses the same seeded LCG streams so the chart renders bit-identical
 * to what the study review approved.
 *
 * Heavy results are memoized at module level; they are only computed on the
 * client (the chart is mount-gated), but nothing here would break in SSR.
 */

import { GRID_H, GRID_W, TERRA } from "@/lib/map/projection";

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
export const VOID0 = "#030201";
export const WARP_V = "#8a68c4";
export const WARP_M = "#b05070";
export const WARP_B = "#5f74b8";
export const WARP_L = "#cbb3ee";

/** Deterministic scatter (no Math.random: stable chart across loads). */
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ══════════ Polar frame: Solar core + four stepped wedges ══════════
   Measured from the canonical reference chart (design/beispiele/
   "wh40k galaxy map - small.jpg", Session-Nachtrag 178, 2026-07-06):
   the 1041 SSOT world positions were registered onto the map by
   brightness-maximization (uniform scale, NO rotation — the curation was
   traced on exactly this chart; s = 3.902 px/gu, Terra = px 1317/1878),
   then the four segmentum fills were mask-extracted along 720 rays and
   their stepped outer edges quantized (raw profiles: flat plateaus ±3 gu).
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
  /** Inner arc radius — Tempestus starts visibly outside the Solar ring. */
  r0: number;
  steps: WedgeStep[];
}

export const POLAR_RINGS = [215, 300, 385];
/** Measured Solar ring: 481 px / 3.902 px·gu⁻¹. */
export const SOLAR_R = 123.3;

export const WEDGES: WedgeDef[] = [
  // Segmentum Pacificus — west (single shallow arc)
  { r0: SOLAR_R, steps: [{ a0: 136.5, a1: 225.3, r: 267.5 }] },
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
    r0: 139,
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

/* ══════════ Segmentum watermarks + fly-to jumps (label anchors read off
   the reference chart, projected into grid space) ══════════ */

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

/* ══════════ Great Rift spine — analytic arc-length sampling ══════════
   The study measured a live SVG path; we expand the two S-commands and
   sample the three cubics, then look frames up by arc length. */

export const RIFT_D =
  "M 262 228 C 350 200, 430 198, 516 232 S 596 330, 618 428 S 662 546, 716 588";

interface Pt {
  x: number;
  y: number;
}

const RIFT_BEZ: [Pt, Pt, Pt, Pt][] = [
  [
    { x: 262, y: 228 },
    { x: 350, y: 200 },
    { x: 430, y: 198 },
    { x: 516, y: 232 },
  ],
  // S 596 330, 618 428 → C1 reflects (430,198) about (516,232)
  [
    { x: 516, y: 232 },
    { x: 602, y: 266 },
    { x: 596, y: 330 },
    { x: 618, y: 428 },
  ],
  // S 662 546, 716 588 → C1 reflects (596,330) about (618,428)
  [
    { x: 618, y: 428 },
    { x: 640, y: 526 },
    { x: 662, y: 546 },
    { x: 716, y: 588 },
  ],
];

export const RIFT_A: Pt = { x: 262, y: 228 };
export const RIFT_B: Pt = { x: 716, y: 588 };

function bezPoint(b: [Pt, Pt, Pt, Pt], u: number): Pt {
  const v = 1 - u;
  return {
    x: v * v * v * b[0].x + 3 * v * v * u * b[1].x + 3 * v * u * u * b[2].x + u * u * u * b[3].x,
    y: v * v * v * b[0].y + 3 * v * v * u * b[1].y + 3 * v * u * u * b[2].y + u * u * u * b[3].y,
  };
}

function bezTangent(b: [Pt, Pt, Pt, Pt], u: number): Pt {
  const v = 1 - u;
  return {
    x:
      3 * v * v * (b[1].x - b[0].x) +
      6 * v * u * (b[2].x - b[1].x) +
      3 * u * u * (b[3].x - b[2].x),
    y:
      3 * v * v * (b[1].y - b[0].y) +
      6 * v * u * (b[2].y - b[1].y) +
      3 * u * u * (b[3].y - b[2].y),
  };
}

interface RiftSample {
  x: number;
  y: number;
  tx: number;
  ty: number;
  len: number;
}

let riftTable: { samples: RiftSample[]; total: number } | null = null;

function getRiftTable(): { samples: RiftSample[]; total: number } {
  if (riftTable) return riftTable;
  const samples: RiftSample[] = [];
  let len = 0;
  let prev: Pt | null = null;
  for (const bez of RIFT_BEZ) {
    for (let i = 0; i <= 200; i++) {
      if (i === 0 && samples.length > 0) continue; // segment joints coincide
      const u = i / 200;
      const p = bezPoint(bez, u);
      if (prev) len += Math.hypot(p.x - prev.x, p.y - prev.y);
      const t = bezTangent(bez, u);
      const tl = Math.hypot(t.x, t.y) || 1;
      samples.push({ x: p.x, y: p.y, tx: t.x / tl, ty: t.y / tl, len });
      prev = p;
    }
  }
  riftTable = { samples, total: len };
  return riftTable;
}

export interface RiftFrame {
  x: number;
  y: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
}

/** Point + unit tangent/normal at arc-length fraction t ∈ [0,1]. */
export function riftFrameAt(t: number): RiftFrame {
  const { samples, total } = getRiftTable();
  const target = Math.max(0, Math.min(1, t)) * total;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].len < target) lo = mid + 1;
    else hi = mid;
  }
  const s = samples[lo];
  return { x: s.x, y: s.y, tx: s.tx, ty: s.ty, nx: -s.ty, ny: s.tx };
}

/* ══════════ Nihilus shade / Lumen mask geometry (Runde 5: radial edges
   from Terra through both rift ends, closing on a far circle r=2600 so no
   overlay edge ever pans into view). ══════════ */

export const NIHILUS_RFAR = 2600;

let nihilusD: string | null = null;

export function nihilusPath(): string {
  if (nihilusD) return nihilusD;
  const far = (p: Pt): Pt => {
    const dx = p.x - TX;
    const dy = p.y - TY;
    const l = Math.hypot(dx, dy);
    return { x: TX + (dx / l) * NIHILUS_RFAR, y: TY + (dy / l) * NIHILUS_RFAR };
  };
  const bf = far(RIFT_B);
  const af = far(RIFT_A);
  nihilusD =
    `${RIFT_D} L ${bf.x.toFixed(1)} ${bf.y.toFixed(1)}` +
    ` A ${NIHILUS_RFAR} ${NIHILUS_RFAR} 0 0 0 ${af.x.toFixed(1)} ${af.y.toFixed(1)} Z`;
  return nihilusD;
}

/* ══════════ Cicatrix Maledictum — the ORIGINAL notation (CicatrixSpine of
   the old live map): a regular ×-raster in the brick pattern, clipped to the
   corridor, opacity falling toward the edge. Shipped STATIC (the per-cell
   CSS animations of the study are the prime lag suspect — Brief 178 session
   note); the word-glitch engine + lightning stay behind the "Rift unrest"
   direction proof. ══════════ */

export const GLITCH = "█▓▒░╳╋╬@#$&*?¥¤ΨΩΞ◊◆☩✠⛧§×!¿";
export const RIFT_WORDS = [
  "DESPAIR",
  "HERESY",
  "CORRUPTED",
  "OBLIVION",
  "BETRAYAL",
  "NOMERCY",
  "ALLISLOST",
  "BLOODAWAITS",
  "THEEND",
  "DECEIVER",
  "BLASPHEMY",
  "DAMNATION",
  "ABANDONHOPE",
  "NIGHTFALLS",
  "BURN",
  "THELONGWAR",
  "WITNESSUS",
  "CHAINSBREAK",
  "FATEUNBOUND",
  "RUIN",
  "COLDFIRE",
  "CHOIRBROKEN",
  "GODSDEAD",
] as const;

export interface RiftCell {
  x: number;
  y: number;
  /** Final rendered opacity (edge falloff × jitter). */
  op: number;
  /** Half-size of the × stroke. */
  s: number;
}

export interface RiftZone {
  x: number;
  y: number;
  idx: number;
}

export interface RiftSkull {
  x: number;
  y: number;
  /** Flicker timing (used only under "Rift unrest"). */
  dur: number;
  delay: number;
}

export interface RiftBolt {
  d: string;
  color: string;
  width: number;
  /** Animation class index wa0..wa5. */
  cls: number;
}

export interface RiftGeometry {
  cells: RiftCell[];
  /** Runs of ≥5 adjacent cells in one row — word slots (indices into cells). */
  runs: number[][];
  zones: RiftZone[];
  skulls: RiftSkull[];
  bolts: RiftBolt[];
  /** Closed corridor outline (the ± corrW offset of the spine) — the
   *  portolan hatch fill (178b Runde 6). */
  corridor: string;
}

function corrW(t: number): number {
  return 6 + 13.5 * Math.sin(Math.PI * t) + 2.8 * Math.sin(2 * Math.PI * t);
}

let riftGeo: RiftGeometry | null = null;

export function riftGeometry(): RiftGeometry {
  if (riftGeo) return riftGeo;

  const FR: { x: number; y: number; nx: number; ny: number; t: number }[] = [];
  for (let fi = 0; fi < 60; fi++) {
    const fq = riftFrameAt(Math.min(0.999, fi / 59));
    FR.push({ x: fq.x, y: fq.y, nx: fq.nx, ny: fq.ny, t: fi / 59 });
  }

  // Corridor polygon + point test (the original's method)
  const poly: [number, number][] = [];
  for (const f of FR) {
    const w1 = corrW(f.t);
    poly.push([f.x + f.nx * w1, f.y + f.ny * w1]);
  }
  for (let i = FR.length - 1; i >= 0; i--) {
    const w2 = corrW(FR[i].t);
    poly.push([FR[i].x - FR[i].nx * w2, FR[i].y - FR[i].ny * w2]);
  }
  const corridor =
    poly.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`).join(" ") +
    " Z";
  const inPoly = (px: number, py: number): boolean => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [px, py] of poly) {
    bb[0] = Math.min(bb[0], px);
    bb[1] = Math.min(bb[1], py);
    bb[2] = Math.max(bb[2], px);
    bb[3] = Math.max(bb[3], py);
  }

  // Three label zones cut out of the raster
  const LDEF = [
    { tt: 0.18, dy: 0 },
    { tt: 0.5, dy: -17 },
    { tt: 0.82, dy: 0 },
  ];
  const zones: RiftZone[] = LDEF.map((ld) => {
    const idx = Math.floor(ld.tt * (FR.length - 1));
    const lf = FR[idx];
    return { x: lf.x, y: lf.y + ld.dy, idx };
  });
  const inZone = (px: number, py: number): boolean =>
    zones.some((z) => Math.abs(px - z.x) < 29 && py > z.y - 3 && py < z.y + 7.5);
  const nearSpine = (px: number, py: number): { dist: number; hw: number } => {
    let bd = Infinity;
    let bi = 0;
    for (let si = 0; si < FR.length; si++) {
      const dx = px - FR[si].x;
      const dy = py - FR[si].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bd) {
        bd = d2;
        bi = si;
      }
    }
    return { dist: Math.sqrt(bd), hw: corrW(bi / (FR.length - 1)) };
  };

  // Triangular/brick raster — the live-map default pattern. The extra two
  // rnd() draws per cell mirror the study's animation-timing draws so the
  // scatter stays bit-identical to the reviewed study.
  const SX = 4.8;
  const SY = 4.2;
  const rnd = lcg(4242);
  const cells: RiftCell[] = [];
  const rows = new Map<string, { x: number; idx: number }[]>();
  const gy0 = Math.floor(bb[1] / SY) * SY;
  const gx0 = Math.floor(bb[0] / SX) * SX;
  let rowI = 0;
  for (let cy = gy0; cy <= bb[3]; cy += SY) {
    const xoff = rowI % 2 === 1 ? SX / 2 : 0;
    for (let cx = gx0 + xoff; cx <= bb[2]; cx += SX) {
      if (!inPoly(cx, cy) || inZone(cx, cy)) continue;
      const nsp = nearSpine(cx, cy);
      const fade = Math.pow(1 - Math.min(1, nsp.dist / Math.max(0.5, nsp.hw)), 1.2);
      const op = (0.9 + rnd() * 0.1) * (0.38 + 0.62 * fade);
      const s = 0.82 * (0.85 + 0.15 * fade);
      rnd(); // study: glitch animation duration
      rnd(); // study: glitch animation delay
      const idx = cells.length;
      cells.push({ x: cx, y: cy, op, s });
      const rk = cy.toFixed(2);
      const row = rows.get(rk) ?? [];
      row.push({ x: cx, idx });
      rows.set(rk, row);
    }
    rowI++;
  }

  // Runs: ≥5 adjacent cells of one row carry the heretic words
  const runs: number[][] = [];
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x);
    let st = 0;
    for (let i = 1; i <= row.length; i++) {
      if (i === row.length || row[i].x - row[i - 1].x > SX * 1.6) {
        if (i - st >= 5) runs.push(row.slice(st, i).map((c) => c.idx));
        st = i;
      }
    }
  }

  // Skulls punctuate the spine
  const skrnd = lcg(9099);
  const SKT = [0.18, 0.4, 0.62, 0.86];
  const skulls: RiftSkull[] = SKT.map((t, sk) => {
    const sf = riftFrameAt(t);
    const sgn = sk % 2 === 0 ? 1 : -1;
    return {
      x: sf.x + sf.nx * sgn * 2.6,
      y: sf.y + sf.ny * sgn * 2.6,
      dur: 6 + skrnd() * 4,
      delay: skrnd() * 6,
    };
  });

  // Lightning: short zigzag veins, colors cycling the warp palette
  const BT = [0.06, 0.15, 0.25, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86, 0.94];
  const BCOL = [WARP_L, WARP_V, WARP_M, WARP_B, WARP_L, WARP_M, WARP_V, WARP_B, WARP_L, WARP_V];
  const brnd = lcg(509);
  const bolts: RiftBolt[] = BT.map((bt, bo) => {
    const q = riftFrameAt(bt);
    let sign = brnd() > 0.5 ? 1 : -1;
    let px = q.x;
    let py = q.y;
    let d = `M ${px.toFixed(1)} ${py.toFixed(1)}`;
    for (let sg = 0; sg < 4; sg++) {
      sign = -sign;
      px += q.nx * sign * (3 + brnd() * 4) + q.tx * (brnd() * 7 - 2);
      py += q.ny * sign * (3 + brnd() * 4) + q.ty * (brnd() * 7 - 2);
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    return { d, color: BCOL[bo], width: 0.55 + brnd() * 0.35, cls: bo % 6 };
  });

  riftGeo = { cells, runs, zones, skulls, bolts, corridor };
  return riftGeo;
}

/** Skull silhouette path (unit space, scaled 2.6 at use site). */
export const SKULL_PATH =
  "M -0.42 -0.2 C -0.42 -0.58 -0.22 -0.62 0 -0.62 C 0.22 -0.62 0.42 -0.58 0.42 -0.2 L 0.42 0.08 L 0.3 0.14 L 0.28 0.3 L 0.18 0.36 L 0.08 0.3 L 0 0.36 L -0.08 0.3 L -0.18 0.36 L -0.28 0.3 L -0.3 0.14 L -0.42 0.08 Z";

/* ══════════ Warp storms (Eye of Terror / Maelstrom) ══════════
   NOTE (Session-Nachtrag 178 / 2026-07-06): a measured 25-cloud storm
   field from the storm-edition reference was built and REVERTED on
   Philipp's veto — image-derived storm shapes don't hold up visually.
   Storm/zone shapes will come from a hand-curation zone editor instead
   (see the 178 handover). */

export interface StormMark {
  x: number;
  y: number;
  s: number;
  op: number;
  color: string;
  phase: number;
}

export function stormMarks(
  cx: number,
  cy: number,
  R: number,
  count: number,
  seed: number,
  cols: string[],
): StormMark[] {
  const rnd = lcg(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const rr = Math.pow(rnd(), 0.6) * R * 0.92;
    return {
      x: cx + Math.cos(a) * rr,
      y: cy + Math.sin(a) * rr,
      s: 1 + rnd() * 1.1,
      op: 0.22 + rnd() * 0.3,
      color: cols[i % cols.length],
      phase: i % 2,
    };
  });
}

export function xMarkPath(x: number, y: number, s: number): string {
  return `M ${x - s} ${y - s} L ${x + s} ${y + s} M ${x - s} ${y + s} L ${x + s} ${y - s}`;
}


/* ══════════ Areas: Leviathan swarm + Sautekh dynasty ══════════ */

export function leviathanMarks(): { d: string; op: number; cls: number }[] {
  const rnd = lcg(613);
  return Array.from({ length: 34 }, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd());
    const x = 872 + Math.cos(a) * 40 * rr;
    const y = 285 + Math.sin(a) * 92 * rr;
    return {
      d: `M ${x - 1.6} ${y + 1.1} L ${x} ${y - 1.4} L ${x + 1.6} ${y + 1.1}`,
      op: 0.12 + rnd() * 0.16,
      cls: i % 3,
    };
  });
}

export function sautekhMarks(): { x: number; y: number; op: number; cls: number }[] {
  const rnd = lcg(911);
  return Array.from({ length: 12 }, (_, i) => {
    const x = 660 + rnd() * 88;
    const y = 158 + rnd() * 52;
    return { x, y, op: 0.3 + rnd() * 0.2, cls: i % 3 };
  });
}

export const SAUTEKH_BORDER_D =
  "M 652 162 L 676 162 L 676 150 L 712 150 L 712 158 L 748 158 L 748 180 L 756 180 L 756 204 L 726 204 L 726 216 L 682 216 L 682 208 L 652 208 Z";

/* ══════════ Dot graticule (star-chart texture) ══════════ */

export function gridDots(): { x: number; y: number; op: number }[] {
  const dots: { x: number; y: number; op: number }[] = [];
  for (let gx = 50; gx < W; gx += 50)
    for (let gy = 50; gy < H; gy += 50)
      dots.push({ x: gx, y: gy, op: gx % 100 === 0 && gy % 100 === 0 ? 0.13 : 0.06 });
  return dots;
}

/* ══════════ Star-dust scatter (LCG spread in size + brightness, always
   clearly below the work pins). Session-Nachtrag 178: ranges lifted well
   above the Runde-5 study values — Philipp wants the full 1054-contact
   census legible at home zoom. Same LCG stream + draw order, only the
   output mapping changed. ══════════ */

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

