"use client";

// Grimdark faction glyph + rotating ring with N orbiting pips.
// hovered/selected drive an outer auspex pulse. SVG only.

import type { Faction, WorldKind } from "@/lib/galaxy/types";
import FactionIcon from "./FactionIcon";

interface PlanetMarkerProps {
  x: number;
  y: number;
  faction: Faction;
  kind?: WorldKind | string;
  color: string;
  accentColor: string;
  iconScale?: number;
  ringR?: number;
  dotCount?: number;
  hovered?: boolean;
  selected?: boolean;
  spinDur?: number;
}

export default function PlanetMarker({
  x,
  y,
  faction,
  kind,
  color,
  accentColor,
  iconScale = 0.55,
  ringR = 1.0,
  dotCount = 1,
  hovered = false,
  selected = false,
  spinDur = 14,
}: PlanetMarkerProps) {
  const ringColor = selected ? accentColor : color;
  const N = Math.max(1, dotCount | 0);
  const pips: { x: number; y: number }[] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * 360;
    const rad = ((ang - 90) * Math.PI) / 180;
    pips.push({ x: Math.cos(rad) * ringR, y: Math.sin(rad) * ringR });
  }
  return (
    <g pointerEvents="none">
      <g transform={`translate(${x} ${y})`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur={`${spinDur}s`}
            repeatCount="indefinite"
          />
          <circle
            r={ringR}
            fill="none"
            stroke={ringColor}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            opacity={hovered || selected ? 0.85 : 0.55}
          />
          {pips.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.095" fill={ringColor} />
          ))}
        </g>
        <g transform={`scale(${iconScale})`}>
          <FactionIcon faction={faction} kind={kind} color={ringColor} />
        </g>
      </g>
      {hovered && !selected && (
        <circle cx={x} cy={y} r="0" fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke">
          <animate attributeName="r" values={`${ringR};${ringR + 2.2}`} dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.9;0" keyTimes="0;0.15;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={ringR + 0.55}
          fill="none"
          stroke={accentColor}
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
          opacity="0.85"
        >
          <animate
            attributeName="r"
            values={`${ringR + 0.35};${ringR + 0.85};${ringR + 0.35}`}
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}
