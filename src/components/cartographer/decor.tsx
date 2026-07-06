/**
 * decor.tsx — static chart decor (Brief 178), ported from Studie I:
 * dot graticule, polar frame (Portolan-Zartheit), segmentum watermarks,
 * the two warp storms, Leviathan/Sautekh areas and the Terra auspex work.
 * All pointer-events:none; all memoized — they render exactly once.
 */

import { memo } from "react";

import {
  BLOOD,
  BONE,
  GOLD,
  ICE,
  POLAR_RINGS,
  SAUTEKH_BORDER_D,
  SEGS,
  SOLAR_R,
  TX,
  TY,
  WARP_B,
  WARP_M,
  WARP_V,
  WEDGES,
  gridDots,
  leviathanMarks,
  outerR,
  pp,
  sautekhMarks,
  stormMarks,
  wedgePath,
  xMarkPath,
} from "./chart-geometry";

export const GridDots = memo(function GridDots() {
  return (
    <g pointerEvents="none">
      {gridDots().map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.6} fill={BONE} fillOpacity={d.op} />
      ))}
    </g>
  );
});

export const PolarFrame = memo(function PolarFrame() {
  // Spokes run out to the measured segment silhouette at their bearing.
  const spokes: [number, number][][] = [];
  for (let a = 0; a < 360; a += 30) spokes.push([pp(a, SOLAR_R), pp(a, outerR(a))]);
  const ticks: [number, number][][] = [];
  for (let a = 0; a < 360; a += 5) ticks.push([pp(a, 381), pp(a, 385)]);
  return (
    <g className="cg-polar" pointerEvents="none">
      {POLAR_RINGS.map((r) => (
        <circle key={r} className="ring" cx={TX} cy={TY} r={r} vectorEffect="non-scaling-stroke" />
      ))}
      <circle className="ring solar" cx={TX} cy={TY} r={SOLAR_R} vectorEffect="non-scaling-stroke" />
      {spokes.map(([a, b], i) => (
        <line key={`s${i}`} className="spoke" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} vectorEffect="non-scaling-stroke" />
      ))}
      {ticks.map(([a, b], i) => (
        <line key={`t${i}`} className="tick" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} vectorEffect="non-scaling-stroke" />
      ))}
      {WEDGES.map((w, i) => (
        <path key={`w${i}`} className="wedge" d={wedgePath(w.r0, w.steps)} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
});

export const SegmentumWatermarks = memo(function SegmentumWatermarks() {
  return (
    <g pointerEvents="none">
      {SEGS.map((s) => (
        <text key={s.name} className="cg-segname" x={s.x} y={s.y} fontSize={s.fs}>
          {s.name}
        </text>
      ))}
    </g>
  );
});

/* ── Warp storms: Eye of Terror (whirls) + The Maelstrom ────────────────── */

interface StormProps {
  cx: number;
  cy: number;
  r: number;
  count: number;
  seed: number;
  s2?: boolean;
  grad: string;
  cols: string[];
  whirl?: boolean;
}

function Storm({ cx, cy, r, count, seed, s2, grad, cols, whirl }: StormProps) {
  const marks = stormMarks(cx, cy, r, count, seed, cols);
  const body = (
    <>
      {whirl && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="none" />}
      {marks.map((m, i) => (
        <path
          key={i}
          className={`cg-sx sx${m.phase}`}
          d={xMarkPath(m.x, m.y, m.s)}
          stroke={m.color}
          strokeWidth={0.9}
          strokeOpacity={m.op}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
  return (
    <g className={`cg-storm${s2 ? " s2" : ""}`}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${grad})`} />
      {whirl ? <g className="cg-whirl">{body}</g> : body}
    </g>
  );
}

function StormGradient({ id, c0, o0, c1, o1 }: { id: string; c0: string; o0: number; c1: string; o1: number }) {
  return (
    <radialGradient id={id}>
      <stop offset="0%" stopColor={c0} stopOpacity={o0} />
      <stop offset={id === "cg-stormW1" ? "45%" : "50%"} stopColor={c1} stopOpacity={o1} />
      <stop offset="100%" stopColor={c1} stopOpacity={0} />
    </radialGradient>
  );
}

export const Storms = memo(function Storms() {
  return (
    <g pointerEvents="none">
      <defs>
        <StormGradient id="cg-stormW1" c0={WARP_M} o0={0.34} c1={WARP_V} o1={0.14} />
        <StormGradient id="cg-stormW2" c0={WARP_B} o0={0.3} c1={WARP_V} o1={0.12} />
      </defs>
      {/* Eye of Terror — whirls */}
      <Storm cx={260.3} cy={232.5} r={30} count={26} seed={41} grad="cg-stormW1" cols={[BLOOD, WARP_V, WARP_M]} whirl />
      {/* The Maelstrom */}
      <Storm cx={558.2} cy={409.9} r={19} count={13} seed={97} s2 grad="cg-stormW2" cols={[WARP_B, WARP_V, BLOOD]} />
    </g>
  );
});

/* ── Areas: Leviathan swarm field + Sautekh dynasty ─────────────────────── */

export const Areas = memo(function Areas() {
  return (
    <g pointerEvents="none">
      <g className="cg-lev" transform="rotate(14 872 285)">
        <ellipse
          className="lv-lens"
          cx={872}
          cy={285}
          rx={46}
          ry={100}
          fill="none"
          stroke={ICE}
          strokeOpacity={0.14}
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
        {leviathanMarks().map((m, i) => (
          <path key={i} className={`lv${m.cls}`} d={m.d} stroke={ICE} strokeOpacity={m.op} fill="none" vectorEffect="non-scaling-stroke" />
        ))}
        <text className="cg-levlbl" x={872} y={276} fontSize={6.5} textAnchor="middle" fillOpacity={0.42}>
          HIVE FLEET
        </text>
        <text className="cg-levlbl" x={872} y={286} fontSize={6.5} textAnchor="middle" fillOpacity={0.42}>
          LEVIATHAN
        </text>
        <text className="cg-levlbl" x={872} y={296} fontSize={5} textAnchor="middle" fillOpacity={0.28}>
          XENOS ACTIVITY
        </text>
      </g>
      <g className="cg-nec">
        <path
          className="nc-border"
          d={SAUTEKH_BORDER_D}
          fill="rgba(156,230,255,0.02)"
          stroke={ICE}
          strokeOpacity={0.16}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        {sautekhMarks().map((m, i) => (
          <g key={i} className={`nc${m.cls}`}>
            <line x1={m.x} y1={m.y - 1.6} x2={m.x} y2={m.y + 1.6} stroke={ICE} strokeWidth={0.8} strokeOpacity={m.op} vectorEffect="non-scaling-stroke" />
            <circle cx={m.x} cy={m.y - 2.6} r={0.6} fill={ICE} fillOpacity={0.4} />
          </g>
        ))}
        <text className="cg-levlbl" x={704} y={180} fontSize={7} textAnchor="middle" fillOpacity={0.42}>
          SAUTEKH DYNASTY
        </text>
        <text className="cg-levlbl" x={704} y={190} fontSize={5.5} textAnchor="middle" fillOpacity={0.3}>
          TOMB WORLDS STIR · M41
        </text>
      </g>
    </g>
  );
});

/* ── Terra: the auspex work (Philipps Liebling — bleibt) ────────────────── */

export const TerraInstrument = memo(function TerraInstrument() {
  const ticks: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
  for (let t = 0; t < 48; t++) {
    const a = (Math.PI * 2 * t) / 48;
    const inner = t % 4 === 0 ? 23 : 25.5;
    ticks.push({
      x1: Math.cos(a) * inner,
      y1: Math.sin(a) * inner,
      x2: Math.cos(a) * 27,
      y2: Math.sin(a) * 27,
      major: t % 4 === 0,
    });
  }
  return (
    <g className="cg-inst" transform={`translate(${TX} ${TY})`} pointerEvents="none">
      <g className="i-ticks">
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={GOLD} strokeOpacity={t.major ? 0.55 : 0.3} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <circle className="i-dash" r={19} fill="none" stroke={GOLD} strokeOpacity={0.4} strokeDasharray="2.5 3.5" vectorEffect="non-scaling-stroke" />
      <ellipse className="i-orbitA" rx={33} ry={12} fill="none" stroke={BONE} strokeOpacity={0.18} strokeDasharray="1.5 3" vectorEffect="non-scaling-stroke" />
      <g className="i-riderA">
        <circle cx={19} cy={0} r={1.4} fill={GOLD} fillOpacity={0.9} />
        <circle cx={-19} cy={0} r={1.4} fill="none" stroke="none" />
      </g>
      <g className="i-riderB">
        <circle cx={27} cy={0} r={1} fill={BONE} fillOpacity={0.7} />
        <circle cx={-27} cy={0} r={1} fill="none" stroke="none" />
      </g>
      <line x1={-4} y1={0} x2={4} y2={0} stroke={BONE} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={-4} x2={0} y2={4} stroke={BONE} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
      <circle className="i-blip" cx={12} cy={-14} r={1.2} fill={GOLD} />
      <circle className="i-blip b2" cx={-16} cy={9} r={1.2} fill={GOLD} />
    </g>
  );
});
