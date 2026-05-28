"use client";

// Necron dynasty territories — translucent green corridors/polygons sampled
// with a rigid axis-aligned rune grid (same step + scale as the Cicatrix X
// grid). The rune flicker is gated off while a Segmentum is open so the
// dived view stays visually stable.

import type { NecronDynasty, Theme } from "@/lib/galaxy/types";
import { buildZoneShape } from "./zoneShape";

interface NecronZonesProps {
  theme: Theme;
  dynasties: readonly NecronDynasty[];
  dived: boolean;
  animsOn: boolean;
}

const RUNES = ["☥", "⊕", "◈", "⌖", "⛤", "☉", "◬", "✦", "⚙", "✠", "☩"] as const;

export default function NecronZones({ theme, dynasties, dived, animsOn }: NecronZonesProps) {
  const t = theme;
  return (
    <g opacity={dived ? 0.2 : 0.92} pointerEvents="none" style={{ transition: "opacity .8s" }}>
      {dynasties.map((dyn, di) => {
        const shape = buildZoneShape(dyn.pts);
        if (!shape) return null;
        let seed = 7919 + di * 137;
        const rnd = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
        const stepX = 1.20;
        const stepY = 1.20;
        const runeScale = 0.46;
        const gx0 = Math.floor(shape.bbMinX / stepX) * stepX;
        const gy0 = Math.floor(shape.bbMinY / stepY) * stepY;
        const lblHalfW = 5.5;
        const lblHalfHTop = 0.9;
        const lblHalfHBot = 2.3;
        const inLabel = (px: number, py: number) =>
          Math.abs(px - shape.labelXY[0]) < lblHalfW &&
          py > shape.labelXY[1] - lblHalfHTop &&
          py < shape.labelXY[1] + lblHalfHBot;
        const cells: {
          x: number;
          y: number;
          rune: string;
          op: number;
          glitchBegin: number;
          glitchDur: number;
        }[] = [];
        for (let gy = gy0; gy <= shape.bbMaxY + 0.001; gy += stepY) {
          for (let gx = gx0; gx <= shape.bbMaxX + 0.001; gx += stepX) {
            if (!shape.inside(gx, gy)) continue;
            if (inLabel(gx, gy)) continue;
            cells.push({
              x: gx,
              y: gy,
              rune: RUNES[Math.floor(rnd() * RUNES.length)],
              op: 0.78 + rnd() * 0.18,
              glitchBegin: rnd() * 9,
              glitchDur: 6 + rnd() * 5,
            });
          }
        }
        const fc = dyn.color || "#5cd09a";
        return (
          <g key={dyn.id}>
            <path d={shape.pathD} fill={fc} opacity="0.07" />
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
              strokeDasharray="1.2 0.6"
              vectorEffect="non-scaling-stroke"
            >
              {animsOn && (
                <animate attributeName="stroke-dashoffset" from="0" to="-12" dur={`${22 + di * 4}s`} repeatCount="indefinite" />
              )}
            </path>
            <g pointerEvents="none">
              {cells.map((c, i) => (
                <text
                  key={i}
                  x={c.x}
                  y={c.y + runeScale * 0.36}
                  textAnchor="middle"
                  fill={fc}
                  fontSize={runeScale}
                  fontFamily="serif"
                  style={{ opacity: c.op }}
                >
                  {c.rune}
                  {animsOn && (
                    <animate
                      attributeName="opacity"
                      values="1;1;0.1;1;1;0.45;1;1;0.75;1;1"
                      keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
                      dur={`${c.glitchDur}s`}
                      begin={`${c.glitchBegin}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </text>
              ))}
            </g>
            <g transform={`translate(${shape.labelXY[0]} ${shape.labelXY[1]})`}>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill={fc}
                opacity="0.85"
                fontFamily={t.fontMono}
                fontSize="1.05"
                letterSpacing="0.22"
                style={{ textTransform: "uppercase" }}
              >
                ⌖ {dyn.name.toUpperCase()} ⌖
              </text>
              <text
                x="0"
                y="1.4"
                textAnchor="middle"
                fill={fc}
                opacity="0.45"
                fontFamily={t.fontMono}
                fontSize="0.62"
                letterSpacing="0.30"
              >
                NECRON · TOMB COMPLEX
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
