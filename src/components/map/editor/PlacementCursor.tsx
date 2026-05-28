"use client";

// SVG overlay shown during AddElement's `place` phase. Renders the already-
// captured points as labeled markers + a live crosshair at the cursor. No
// pointer events — clicks pass through to the EditOverlay / disc below.

import { polar } from "@/lib/galaxy/coords";
import type { Polar } from "@/lib/galaxy/types";

interface PlacementCursorProps {
  enabled: boolean;
  cursorPolar: { r: number; a: number } | null;
  pts: readonly Polar[];
  color: string;
}

export default function PlacementCursor({
  enabled,
  cursorPolar,
  pts,
  color,
}: PlacementCursorProps) {
  if (!enabled) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      {pts.length >= 2 && (
        <polyline
          points={pts.map(([r, a]) => polar(r, a).join(",")).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="0.3"
          strokeDasharray="1 0.5"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        />
      )}
      {pts.map(([r, a], i) => {
        const [x, y] = polar(r, a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="1.0" fill="none" stroke={color} strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={y} r="0.3" fill={color} />
            <text
              x={x + 1.4}
              y={y + 0.3}
              fill={color}
              opacity="0.85"
              fontFamily="JetBrains Mono, monospace"
              fontSize="1.2"
              style={{ textShadow: "0 0 4px black" }}
            >
              PT{i + 1}
            </text>
          </g>
        );
      })}
      {cursorPolar &&
        (() => {
          const [cx, cy] = polar(cursorPolar.r, cursorPolar.a);
          return (
            <g pointerEvents="none">
              <circle cx={cx} cy={cy} r="1.6" fill="none" stroke={color} strokeWidth="0.25" vectorEffect="non-scaling-stroke" strokeDasharray="0.5 0.4" opacity="0.85">
                <animate attributeName="r" values="1.6;2.2;1.6" dur="1.4s" repeatCount="indefinite" />
              </circle>
              <line x1={cx - 2.4} y1={cy} x2={cx + 2.4} y2={cy} stroke={color} strokeWidth="0.18" vectorEffect="non-scaling-stroke" opacity="0.7" />
              <line x1={cx} y1={cy - 2.4} x2={cx} y2={cy + 2.4} stroke={color} strokeWidth="0.18" vectorEffect="non-scaling-stroke" opacity="0.7" />
              <circle cx={cx} cy={cy} r="0.18" fill={color} />
            </g>
          );
        })()}
    </svg>
  );
}
