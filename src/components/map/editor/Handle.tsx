"use client";

// Draggable crosshair handle inside the editor SVG overlay. Receives polar
// (r, a) and emits new (r, a) on drag. Pointer math goes through the parent
// SVG ref so screen → viewBox → polar stays accurate at any zoom level.

import { useState } from "react";
import type { MutableRefObject } from "react";

import { polar, screenToSvg, svgToPolar } from "@/lib/galaxy/coords";

interface HandleProps {
  r: number;
  a: number;
  color: string;
  ring: number;
  label?: string;
  highlighted?: boolean;
  svgRef: MutableRefObject<SVGSVGElement | null>;
  onChange: (r: number, a: number) => void;
  onSelect?: () => void;
}

export default function Handle({
  r,
  a,
  color,
  ring,
  label,
  highlighted,
  svgRef,
  onChange,
  onSelect,
}: HandleProps) {
  const [x, y] = polar(r, a);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);

  const onDown = (e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.();
    setDragging(true);
    const svg = svgRef.current;
    if (!svg) return;
    const move = (ev: PointerEvent) => {
      const [sx, sy] = screenToSvg(svg, ev.clientX, ev.clientY);
      const [nr, na] = svgToPolar(sx, sy);
      onChange(nr, na);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const active = hover || dragging || !!highlighted;

  return (
    <g
      transform={`translate(${x} ${y})`}
      onPointerDown={onDown}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ cursor: "grab" }}
    >
      {highlighted && (
        <circle
          r={ring + 1.2}
          fill="none"
          stroke={color}
          strokeWidth="0.3"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="0.6 0.4"
        />
      )}
      <circle
        r={ring}
        fill="none"
        stroke={color}
        strokeWidth="0.2"
        vectorEffect="non-scaling-stroke"
        opacity={active ? 1 : 0.7}
      />
      <line x1={-ring - 1} y1="0" x2={-ring + 0.5} y2="0" stroke={color} strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1={ring - 0.5} y1="0" x2={ring + 1} y2="0" stroke={color} strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={-ring - 1} x2="0" y2={-ring + 0.5} stroke={color} strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={ring - 0.5} x2="0" y2={ring + 1} stroke={color} strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <circle r={ring + 1.5} fill={color} opacity={active ? 0.25 : 0.001} />
      <circle r="0.5" fill={color} />
      {label && (
        <text
          x="0"
          y={-ring - 1.4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="1.6"
          fill={color}
          letterSpacing="0.06"
          style={{ pointerEvents: "none", textShadow: "0 0 4px black" }}
        >
          {label}
        </text>
      )}
      {active && (
        <g style={{ pointerEvents: "none" }}>
          <rect x="2" y="-1.0" width="12" height="2.1" rx="0.3" fill="#000" opacity="0.85" stroke={color} strokeWidth="0.1" />
          <text x="2.4" y="0.55" fontFamily="JetBrains Mono, monospace" fontSize="1.3" fill={color} letterSpacing="0.04">
            r{r.toFixed(2)} a{a.toFixed(0)}°
          </text>
        </g>
      )}
    </g>
  );
}
