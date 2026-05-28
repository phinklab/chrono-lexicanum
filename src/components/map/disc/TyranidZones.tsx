"use client";

// Tyranid swarm zones — translucent purple corridors/polygons sampled with
// organic glyph variants (claws, spores, fangs, eye-slits). Same geometry
// pipeline as Necron, irregular dash on the outer ring. Motion is gated off
// while a Segmentum is open so the dived view stays visually stable.

import type { TyranidSwarm, Theme } from "@/lib/galaxy/types";
import { buildZoneShape } from "./zoneShape";

interface TyranidZonesProps {
  theme: Theme;
  swarms: readonly TyranidSwarm[];
  dived: boolean;
  animsOn: boolean;
}

interface GlyphProps {
  v: 0 | 1 | 2 | 3;
  color: string;
}

function Glyph({ v, color }: GlyphProps) {
  const sw = "0.085";
  if (v === 1) {
    return (
      <g fill={color} stroke="none">
        <circle cx="0" cy="-0.32" r="0.10" />
        <circle cx="-0.28" cy="0.18" r="0.10" />
        <circle cx="0.28" cy="0.18" r="0.10" />
        <circle cx="0" cy="0" r="0.05" opacity="0.7" />
      </g>
    );
  }
  if (v === 2) {
    return (
      <g fill={color} stroke="none">
        <path d="M -0.20 -0.36 Q 0 -0.40, 0.20 -0.36 Q 0.10 0.10, 0.00 0.42 Q -0.10 0.10, -0.20 -0.36 Z" />
        <path d="M -0.04 -0.30 L 0.04 -0.30 L 0.02 -0.10 L -0.02 -0.10 Z" fill={color} opacity="0.55" />
      </g>
    );
  }
  if (v === 3) {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect="non-scaling-stroke">
        <path d="M -0.40 0 Q 0 -0.30, 0.40 0 Q 0 0.30, -0.40 0 Z" />
        <ellipse cx="0" cy="0" rx="0.08" ry="0.18" fill={color} stroke="none" />
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth="0.115" vectorEffect="non-scaling-stroke" strokeLinecap="round">
      <path d="M -0.36 0.40 C -0.42 -0.26, 0.32 -0.46, 0.42 0.38" />
      <line x1="0.42" y1="0.38" x2="0.26" y2="0.20" />
      <circle cx="-0.36" cy="0.40" r="0.06" fill={color} stroke="none" />
    </g>
  );
}

export default function TyranidZones({ theme, swarms, dived, animsOn }: TyranidZonesProps) {
  const t = theme;
  return (
    <g opacity={dived ? 0.2 : 0.92} pointerEvents="none" style={{ transition: "opacity .8s" }}>
      {swarms.map((sw, si) => {
        const shape = buildZoneShape(sw.pts);
        if (!shape) return null;
        let seed = 3001 + si * 211;
        const rnd = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
        const stepX = 1.20;
        const stepY = 1.20;
        const glyphScale = 0.50;
        const gx0 = Math.floor(shape.bbMinX / stepX) * stepX;
        const gy0 = Math.floor(shape.bbMinY / stepY) * stepY;
        const lblHalfW = 6.5;
        const lblHalfHTop = 0.9;
        const lblHalfHBot = 2.3;
        const inLabel = (px: number, py: number) =>
          Math.abs(px - shape.labelXY[0]) < lblHalfW &&
          py > shape.labelXY[1] - lblHalfHTop &&
          py < shape.labelXY[1] + lblHalfHBot;
        const cells: {
          x: number;
          y: number;
          variant: 0 | 1 | 2 | 3;
          rot: number;
          op: number;
          glitchBegin: number;
          glitchDur: number;
        }[] = [];
        for (let gy = gy0; gy <= shape.bbMaxY + 0.001; gy += stepY) {
          for (let gx = gx0; gx <= shape.bbMaxX + 0.001; gx += stepX) {
            if (!shape.inside(gx, gy)) continue;
            if (inLabel(gx, gy)) continue;
            const v = Math.floor(rnd() * 4) as 0 | 1 | 2 | 3;
            cells.push({
              x: gx,
              y: gy,
              variant: v,
              rot: Math.floor(rnd() * 4) * 90,
              op: 0.78 + rnd() * 0.18,
              glitchBegin: rnd() * 9,
              glitchDur: 6 + rnd() * 5,
            });
          }
        }
        const fc = sw.color || "#c97ad8";
        return (
          <g key={sw.id || `sw-${si}`}>
            <path d={shape.pathD} fill={fc} opacity="0.09" />
            <path
              d={shape.pathD}
              fill="none"
              stroke={fc}
              strokeWidth="0.18"
              strokeOpacity="0.65"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={shape.pathD}
              fill="none"
              stroke={fc}
              strokeWidth="0.14"
              strokeOpacity="0.85"
              strokeDasharray="0.6 0.45 1.4 0.5"
              vectorEffect="non-scaling-stroke"
            >
              {animsOn && (
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur={`${18 + si * 3}s`} repeatCount="indefinite" />
              )}
            </path>
            <g pointerEvents="none">
              {cells.map((c, i) => (
                <g
                  key={i}
                  transform={`translate(${c.x} ${c.y}) scale(${glyphScale}) rotate(${c.rot})`}
                  style={{ opacity: c.op }}
                >
                  <Glyph v={c.variant} color={fc} />
                  {animsOn && (
                    <animate
                      attributeName="opacity"
                      values="1;1;0.15;1;1;0.5;1;1;0.8;1;1"
                      keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
                      dur={`${c.glitchDur}s`}
                      begin={`${c.glitchBegin}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </g>
              ))}
            </g>
            <g transform={`translate(${shape.labelXY[0]} ${shape.labelXY[1]})`}>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill={fc}
                opacity="0.88"
                fontFamily={t.fontMono}
                fontSize="1.05"
                letterSpacing="0.22"
                style={{ textTransform: "uppercase" }}
              >
                ◬ {(sw.name || "TYRANID SWARM").toUpperCase()} ◬
              </text>
              <text
                x="0"
                y="1.4"
                textAnchor="middle"
                fill={fc}
                opacity="0.55"
                fontFamily={t.fontMono}
                fontSize="0.62"
                letterSpacing="0.30"
              >
                HEAVY XENOS ACTIVITY · HIVE FLEET
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
