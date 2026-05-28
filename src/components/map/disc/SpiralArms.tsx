"use client";

// Spiral arm centerlines. Each sample point clamped to the live segment outer
// at its angle so arms never spill past the silhouette.

import { polar } from "@/lib/galaxy/coords";
import { SPIRAL_ARMS } from "@/lib/galaxy/data";
import { segOuterAt } from "@/lib/galaxy/stars";
import type { Segmentum, Theme } from "@/lib/galaxy/types";

interface SpiralArmsProps {
  theme: Theme;
  segments: readonly Segmentum[];
  dived: boolean;
}

export default function SpiralArms({ theme, segments, dived }: SpiralArmsProps) {
  return (
    <g opacity={dived ? 0 : 0.4} style={{ transition: "opacity .8s" }}>
      {SPIRAL_ARMS.map((arm, i) => {
        const d = arm
          .map((pt, j) => {
            const edgeR = segOuterAt(segments, pt[1]);
            const r = Math.min(pt[0], edgeR);
            const [x, y] = polar(r, pt[1]);
            return `${j === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={theme.primary}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            opacity="0.45"
          />
        );
      })}
    </g>
  );
}
