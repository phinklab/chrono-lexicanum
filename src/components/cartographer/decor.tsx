/**
 * decor.tsx — static chart decor: dot graticule, polar frame (portolan
 * delicacy), segmentum watermarks and the Terra auspex work. Zone shapes
 * come exclusively from hand curation (zones.json / zone editor), not from
 * this file.
 * All pointer-events:none; all memoized — they render exactly once.
 */

import { memo } from "react";

import {
  BLOOD,
  BONE,
  GOLD,
  PLAGUE,
  POLAR_RINGS,
  RING_CLEAR,
  SEGS,
  SOLAR_R,
  TX,
  TY,
  WEDGES,
  gridDots,
  outerR,
  pp,
  ringArcs,
  wedgePath,
} from "./chart-geometry";

/** #cg-riftHatch — the red portolan 45° hatch. Mounts here, always — the
 *  hand-curated interdiction zones (ZonesLayer + editor) fill with it.
 *  #cg-plagueHatch: the same hatch in Nurgle bile, counter-rotated (-45°)
 *  so red and green fields stay readable even where they overlap — fills
 *  the plague zones (Scourge Stars). */
export const HatchDefs = memo(function HatchDefs() {
  return (
    <defs>
      <pattern
        id="cg-riftHatch"
        width={5}
        height={5}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1={0} y1={0} x2={0} y2={5} stroke={BLOOD} strokeWidth={0.8} strokeOpacity={0.5} />
      </pattern>
      <pattern
        id="cg-plagueHatch"
        width={5}
        height={5}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <line x1={0} y1={0} x2={0} y2={5} stroke={PLAGUE} strokeWidth={0.8} strokeOpacity={0.5} />
      </pattern>
    </defs>
  );
});

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
  // The tick wreath (r 381–385) breaks off like the rings wherever a
  // segment step edge runs too close — avoids double lines.
  const ticks: [number, number][][] = [];
  for (let a = 0; a < 360; a += 5) {
    if (Math.abs(383 - outerR(a)) < RING_CLEAR) continue;
    ticks.push([pp(a, 381), pp(a, 385)]);
  }
  return (
    <g className="cg-polar" pointerEvents="none">
      {POLAR_RINGS.map((r) => {
        const arcs = ringArcs(r);
        if (arcs === null) {
          return (
            <circle key={r} className="ring" cx={TX} cy={TY} r={r} vectorEffect="non-scaling-stroke" />
          );
        }
        return arcs.map((d, i) => (
          <path key={`${r}-${i}`} className="ring" d={d} vectorEffect="non-scaling-stroke" />
        ));
      })}
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

/* Terra: the auspex work */

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
