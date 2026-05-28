"use client";

// Cicatrix Maledictum — the Great Rift, rendered as a cartographic NO-GO
// ZONE. The X grid IS the notation: regularly-spaced X marks (clipped to a
// corridor along a 2-segment cubic bezier sweep), interrupted at random
// runs of consecutive cells with grim words that glyph-cycle through occult
// symbols. Skulls punctuate the spine; three "INTERDICTED" labels stagger
// along its length.

import { memo, useEffect, useMemo, useState, type ReactElement } from "react";

import { polar } from "@/lib/galaxy/coords";
import type { Polar, RiftPattern, Theme } from "@/lib/galaxy/types";

interface CicatrixSpineProps {
  theme: Theme;
  pts: readonly Polar[];
  pattern: RiftPattern;
  dived: boolean;
  animsOn: boolean;
}

const RIFT_GLITCH = "█▓▒░╳╋╬@#$&*?¥¤ΨΩΞ◊◆☩✠⛧§×!¿";
const DEMONIC_WORDS = [
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
];

interface RiftMarker {
  x: number;
  y: number;
  key: string;
  scale: number;
  op: number;
  glitchBegin: number;
  glitchDur: number;
}

interface CorruptionSlot {
  word: string;
  positions: { key: string; x: number; y: number }[];
  begin: number;
  fadeIn: number;
  hold: number;
  fadeOut: number;
  total: number;
  restartAt: number;
}

interface RiftXGridProps {
  markers: RiftMarker[];
  corruptedKeys: Set<string>;
  color: string;
  active: boolean;
}

function RiftXGridImpl({ markers, corruptedKeys, color, active }: RiftXGridProps) {
  return (
    <g pointerEvents="none">
      {markers.map((m) => {
        const corrupted = corruptedKeys.has(m.key);
        return (
          <g
            key={m.key}
            transform={`translate(${m.x} ${m.y}) scale(${m.scale})`}
            style={{ opacity: corrupted ? 0 : m.op, transition: "opacity 0.45s ease-out" }}
          >
            <g stroke={color} strokeWidth="0.20" vectorEffect="non-scaling-stroke">
              <line x1="-0.45" y1="-0.45" x2="0.45" y2="0.45" />
              <line x1="-0.45" y1="0.45" x2="0.45" y2="-0.45" />
              {active && (
                <animate
                  attributeName="opacity"
                  values="1;1;0.1;1;1;0.45;1;1;0.75;1;1"
                  keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
                  dur={`${m.glitchDur}s`}
                  begin={`${m.glitchBegin}s`}
                  repeatCount="indefinite"
                />
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}

const RiftXGrid = memo(RiftXGridImpl, (a, b) => {
  if (a.markers !== b.markers || a.color !== b.color || a.active !== b.active) return false;
  if (a.corruptedKeys.size !== b.corruptedKeys.size) return false;
  for (const k of b.corruptedKeys) if (!a.corruptedKeys.has(k)) return false;
  return true;
});

interface RiftCorruptionLettersProps {
  slots: (CorruptionSlot | null)[];
  now: number;
  color: string;
  fontFamily: string;
  fontSize: number;
}

function RiftCorruptionLetters({ slots, now, color, fontFamily, fontSize }: RiftCorruptionLettersProps) {
  const els: ReactElement[] = [];
  slots.forEach((s, si) => {
    if (!s) return;
    const elapsed = now - s.begin;
    if (elapsed < 0 || elapsed > s.total) return;
    s.positions.forEach((p, li) => {
      const stagger = 0.045 * li;
      const tt = elapsed - stagger;
      if (tt < 0) return;
      const actual = s.word[li];
      let opacity: number;
      let char: string;
      if (tt < s.fadeIn) {
        const k = tt / s.fadeIn;
        opacity = k * 0.9;
        const idx = Math.floor(tt * 30 + li * 13 + si * 7);
        char = RIFT_GLITCH[idx % RIFT_GLITCH.length];
        if (idx % 5 === 4) char = actual;
      } else if (tt < s.fadeIn + s.hold) {
        opacity = 0.9;
        const tt2 = tt - s.fadeIn;
        const idx = Math.floor(tt2 * 6 + li * 5 + si * 3);
        const glitchy = (idx + li * 7) % 13 === 0;
        char = glitchy ? RIFT_GLITCH[idx % RIFT_GLITCH.length] : actual;
      } else {
        const k = (tt - s.fadeIn - s.hold) / s.fadeOut;
        opacity = (1 - k) * 0.9;
        const idx = Math.floor(tt * 28 + li * 11 + si * 5);
        char = RIFT_GLITCH[idx % RIFT_GLITCH.length];
        if (idx % 6 === 5) char = actual;
      }
      if (opacity < 0.02) return;
      els.push(
        <text
          key={`${si}-${li}`}
          x={p.x}
          y={p.y + fontSize * 0.36}
          fill={color}
          opacity={opacity}
          fontFamily={fontFamily}
          fontSize={fontSize}
          textAnchor="middle"
          style={{ fontWeight: 700, letterSpacing: "0" }}
        >
          {char}
        </text>,
      );
    });
  });
  return <g pointerEvents="none">{els}</g>;
}

const VARIANTS: Record<RiftPattern, { stepX: number; stepY: number; brick: boolean; markScale: number }> = {
  "strict-square": { stepX: 1.20, stepY: 1.20, brick: false, markScale: 0.46 },
  "strict-square-dense": { stepX: 0.90, stepY: 0.90, brick: false, markScale: 0.36 },
  "strict-brick": { stepX: 1.10, stepY: 1.10, brick: true, markScale: 0.42 },
  triangular: { stepX: 1.05, stepY: 0.91, brick: true, markScale: 0.38 },
  "mega-dense": { stepX: 0.62, stepY: 0.62, brick: false, markScale: 0.26 },
};

interface SpineGeometry {
  markers: RiftMarker[];
  runs: RiftMarker[][];
  frames: { x: number; y: number; tanDeg: number }[];
  markScale: number;
  labelDefs: { tt: number; dy: number }[];
}

function buildSpineGeometry(pts: readonly Polar[], pattern: RiftPattern): SpineGeometry {
  const xy = pts.map((p) => polar(p[0], p[1]));
  const bezier = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    tt: number,
  ): [number, number] => {
    const u = 1 - tt;
    return [
      u * u * u * p0[0] + 3 * u * u * tt * p1[0] + 3 * u * tt * tt * p2[0] + tt * tt * tt * p3[0],
      u * u * u * p0[1] + 3 * u * u * tt * p1[1] + 3 * u * tt * tt * p2[1] + tt * tt * tt * p3[1],
    ];
  };
  const N = 60;
  const samplePts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const tt = i / (N - 1);
    if (tt < 0.5)
      samplePts.push(bezier(xy[0], xy[1], xy[2], xy[3], tt * 2));
    else samplePts.push(bezier(xy[3], xy[4], xy[5], xy[6], (tt - 0.5) * 2));
  }
  const frames = samplePts.map((p, i) => {
    const j = Math.min(samplePts.length - 1, i + 1);
    const q = samplePts[j === i ? Math.max(0, i - 1) : j];
    const sgn = j === i ? -1 : 1;
    const dx = (q[0] - p[0]) * sgn;
    const dy = (q[1] - p[1]) * sgn;
    return { x: p[0], y: p[1], tanDeg: (Math.atan2(dy, dx) * 180) / Math.PI };
  });

  let seed = 4242;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const halfW = (tt: number) =>
    1.2 + Math.sin(Math.PI * tt) * 2.8 + Math.sin(Math.PI * tt * 2) * 0.6;

  const polygon: [number, number][] = [];
  frames.forEach((f, i) => {
    const tt = i / (frames.length - 1);
    const w = halfW(tt);
    const rad = ((f.tanDeg + 90) * Math.PI) / 180;
    polygon.push([f.x + Math.cos(rad) * w, f.y + Math.sin(rad) * w]);
  });
  for (let i = frames.length - 1; i >= 0; i--) {
    const tt = i / (frames.length - 1);
    const w = halfW(tt);
    const rad = ((frames[i].tanDeg + 90) * Math.PI) / 180;
    polygon.push([frames[i].x - Math.cos(rad) * w, frames[i].y - Math.sin(rad) * w]);
  }
  const pointInPoly = (px: number, py: number) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };
  let bbMinX = Infinity;
  let bbMinY = Infinity;
  let bbMaxX = -Infinity;
  let bbMaxY = -Infinity;
  polygon.forEach(([px, py]) => {
    if (px < bbMinX) bbMinX = px;
    if (py < bbMinY) bbMinY = py;
    if (px > bbMaxX) bbMaxX = px;
    if (py > bbMaxY) bbMaxY = py;
  });

  const labelDefs = [
    { tt: 0.18, dy: 0 },
    { tt: 0.50, dy: -4.0 },
    { tt: 0.82, dy: 0 },
  ];

  const labelZones = labelDefs.map((d) => {
    const idx = Math.floor(d.tt * (frames.length - 1));
    const f = frames[idx];
    return {
      x: f.x,
      y: f.y + d.dy,
      halfW: 7.4,
      halfHTop: 0.7,
      halfHBot: 1.8,
    };
  });
  const inAnyLabelZone = (px: number, py: number) => {
    for (const z of labelZones) {
      if (Math.abs(px - z.x) < z.halfW && py > z.y - z.halfHTop && py < z.y + z.halfHBot) return true;
    }
    return false;
  };

  const V = VARIANTS[pattern];
  const markers: RiftMarker[] = [];
  const gx0 = Math.floor(bbMinX / V.stepX) * V.stepX;
  const gy0 = Math.floor(bbMinY / V.stepY) * V.stepY;

  const nearestSpine = (px: number, py: number) => {
    let bestD2 = Infinity;
    let bestI = 0;
    for (let i = 0; i < frames.length; i++) {
      const dx = px - frames[i].x;
      const dy = py - frames[i].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestI = i;
      }
    }
    const tt = bestI / (frames.length - 1);
    return { dist: Math.sqrt(bestD2), halfW: halfW(tt) };
  };

  const cellKey = (gx: number, gy: number) => `${gx.toFixed(4)}|${gy.toFixed(4)}`;
  const rowsMap = new Map<string, RiftMarker[]>();
  let rowIdx = 0;
  for (let gy = gy0; gy <= bbMaxY + 0.001; gy += V.stepY) {
    const xOff = V.brick && rowIdx % 2 === 1 ? V.stepX / 2 : 0;
    for (let gx = gx0 + xOff; gx <= bbMaxX + 0.001; gx += V.stepX) {
      if (!pointInPoly(gx, gy)) continue;
      if (inAnyLabelZone(gx, gy)) continue;
      const ns = nearestSpine(gx, gy);
      const ratio = Math.min(1, ns.dist / Math.max(0.5, ns.halfW));
      const fade = Math.pow(1 - ratio, 1.2);
      const op = (0.9 + rnd() * 0.1) * (0.38 + 0.62 * fade);
      const cell: RiftMarker = {
        x: gx,
        y: gy,
        key: cellKey(gx, gy),
        scale: V.markScale * (0.85 + 0.15 * fade),
        op,
        glitchBegin: rnd() * 9,
        glitchDur: 6 + rnd() * 5,
      };
      markers.push(cell);
      const rk = gy.toFixed(4);
      const existing = rowsMap.get(rk);
      if (existing) existing.push(cell);
      else rowsMap.set(rk, [cell]);
    }
    rowIdx++;
  }

  const runs: RiftMarker[][] = [];
  rowsMap.forEach((arr) => {
    arr.sort((a, b) => a.x - b.x);
    let start = 0;
    for (let i = 1; i <= arr.length; i++) {
      const broken = i === arr.length || arr[i].x - arr[i - 1].x > V.stepX * 1.6;
      if (broken) {
        if (i - start >= 5) runs.push(arr.slice(start, i));
        start = i;
      }
    }
  });

  return { markers, runs, frames, markScale: V.markScale, labelDefs };
}

interface RiftFieldProps {
  markers: RiftMarker[];
  runs: RiftMarker[][];
  color: string;
  fontFamily: string;
  markScale: number;
  active: boolean;
}

interface RiftRender {
  slots: (CorruptionSlot | null)[];
  now: number;
}

const INACTIVE_RIFT_RENDER: RiftRender = { slots: [], now: 0 };

function RiftField({ markers, runs, color, fontFamily, markScale, active }: RiftFieldProps) {
  const NUM_SLOTS = 3;
  const [render, setRender] = useState<RiftRender>({ slots: [], now: 0 });

  useEffect(() => {
    if (!active) return;
    let seed = 91234;
    const wrnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const pickSlot = (now: number, current: (CorruptionSlot | null)[]): CorruptionSlot | null => {
      if (!runs || runs.length === 0) return null;
      for (let tries = 0; tries < 30; tries++) {
        const word = DEMONIC_WORDS[Math.floor(wrnd() * DEMONIC_WORDS.length)];
        let r: RiftMarker[] | null = null;
        for (let rt = 0; rt < 16; rt++) {
          const cand = runs[Math.floor(wrnd() * runs.length)];
          if (cand && cand.length >= word.length) {
            r = cand;
            break;
          }
        }
        if (!r) continue;
        const maxStart = r.length - word.length;
        const s = Math.floor(wrnd() * (maxStart + 1));
        const positions = r.slice(s, s + word.length).map((c) => ({ key: c.key, x: c.x, y: c.y }));
        const occupied = new Set<string>();
        current.forEach((sl) => {
          if (sl) sl.positions.forEach((p) => occupied.add(p.key));
        });
        if (positions.some((p) => occupied.has(p.key))) continue;
        const fadeIn = 0.55;
        const hold = 1.5 + wrnd() * 0.9;
        const fadeOut = 0.6;
        const total = fadeIn + hold + fadeOut;
        const gap = 3.5 + wrnd() * 6.5;
        return { word, positions, begin: now, fadeIn, hold, fadeOut, total, restartAt: now + total + gap };
      }
      return null;
    };

    const start = performance.now();
    let initialized = false;
    const id = setInterval(() => {
      const now = (performance.now() - start) / 1000;
      setRender((prev) => {
        let slots: (CorruptionSlot | null)[];
        if (!initialized) {
          slots = [];
          for (let i = 0; i < NUM_SLOTS; i++) {
            slots.push(pickSlot(0.4 + i * 1.8, slots));
          }
          initialized = true;
        } else {
          slots = prev.slots.slice();
          slots.forEach((s, i) => {
            if (!s || now >= s.restartAt) {
              slots[i] = pickSlot(now, slots);
            }
          });
        }
        return { slots, now };
      });
    }, 90);
    return () => clearInterval(id);
  }, [active, runs]);

  const visibleRender = active ? render : INACTIVE_RIFT_RENDER;
  const corruptedKeys = useMemo(() => {
    const set = new Set<string>();
    visibleRender.slots.forEach((s) => {
      if (!s) return;
      const elapsed = visibleRender.now - s.begin;
      if (elapsed >= -0.05 && elapsed <= s.total + 0.05) {
        s.positions.forEach((p) => set.add(p.key));
      }
    });
    return set;
  }, [visibleRender]);

  return (
    <g>
      <RiftXGrid markers={markers} corruptedKeys={corruptedKeys} color={color} active={active} />
      <RiftCorruptionLetters
        slots={visibleRender.slots}
        now={visibleRender.now}
        color={color}
        fontFamily={fontFamily}
        fontSize={markScale * 1.0}
      />
    </g>
  );
}

function Skull({ color, bg }: { color: string; bg: string }) {
  return (
    <g>
      <path
        d="
          M -0.42 -0.20
          C -0.42 -0.58, -0.22 -0.62,  0.00 -0.62
          C  0.22 -0.62,  0.42 -0.58,  0.42 -0.20
          L  0.42  0.08
          L  0.30  0.14
          L  0.28  0.30
          L  0.18  0.36
          L  0.08  0.30
          L  0.00  0.36
          L -0.08  0.30
          L -0.18  0.36
          L -0.28  0.30
          L -0.30  0.14
          L -0.42  0.08
          Z"
        fill={color}
      />
      <circle cx="-0.18" cy="-0.16" r="0.13" fill={bg} />
      <circle cx="0.18" cy="-0.16" r="0.13" fill={bg} />
      <path d="M -0.05 0.02 L 0.05 0.02 L 0 0.14 Z" fill={bg} />
      <rect x="-0.02" y="0.18" width="0.04" height="0.14" fill={bg} />
    </g>
  );
}

export default function CicatrixSpine({ theme, pts, pattern, dived, animsOn }: CicatrixSpineProps) {
  const t = theme;
  const geom = useMemo(() => buildSpineGeometry(pts, pattern), [pts, pattern]);
  const skulls = useMemo(() => {
    let seed = 9099;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const stops = [0.18, 0.40, 0.62, 0.86];
    return stops.map((tt, i) => {
      const idx = Math.floor(tt * (geom.frames.length - 1));
      const f = geom.frames[idx];
      const sign = i % 2 === 0 ? 1 : -1;
      const rad = ((f.tanDeg + 90) * Math.PI) / 180;
      const off = sign * 0.6;
      return {
        x: f.x + Math.cos(rad) * off,
        y: f.y + Math.sin(rad) * off,
        scale: 0.6,
        fadeBegin: rnd() * 6,
        fadeDur: 6 + rnd() * 4,
      };
    });
  }, [geom]);

  return (
    <g opacity={dived ? 0.3 : 1} pointerEvents="none" style={{ transition: "opacity .8s" }}>
      <RiftField
        markers={geom.markers}
        runs={geom.runs}
        color={t.danger}
        fontFamily={t.fontMono}
        markScale={geom.markScale}
        active={animsOn}
      />
      {skulls.map((s, j) => (
        <g key={`sk-${j}`} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
          <Skull color={t.danger} bg={t.bg0} />
          {animsOn && (
            <animate
              attributeName="opacity"
              values="0;0;0.85;0.85;0.2;0.9;0;0"
              keyTimes="0;0.30;0.34;0.55;0.58;0.62;0.66;1"
              dur={`${s.fadeDur}s`}
              begin={`${s.fadeBegin}s`}
              repeatCount="indefinite"
            />
          )}
        </g>
      ))}
      {geom.labelDefs.map((d, i) => {
        const idx = Math.floor(d.tt * (geom.frames.length - 1));
        const f = geom.frames[idx];
        return (
          <g key={`lbl-${i}`} transform={`translate(${f.x} ${f.y + d.dy})`}>
            <text
              x="0"
              y="0.15"
              fill={t.danger}
              opacity="0.72"
              fontFamily={t.fontMono}
              fontSize="1.05"
              letterSpacing="0.20"
              textAnchor="middle"
              style={{ textTransform: "uppercase" }}
            >
              ✠ INTERDICTED ZONE ✠
            </text>
            <text
              x="0"
              y="1.35"
              fill={t.danger}
              opacity="0.45"
              fontFamily={t.fontMono}
              fontSize="0.65"
              letterSpacing="0.28"
              textAnchor="middle"
            >
              CICATRIX MALEDICTUM · M42.{(idx * 7 + 13) % 1000}
            </text>
            {animsOn && (
              <animate
                attributeName="opacity"
                values="1;1;0.2;1;1"
                keyTimes="0;0.32;0.33;0.34;1"
                dur={`${7 + i * 2}s`}
                begin={`${i * 1.7}s`}
                repeatCount="indefinite"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
