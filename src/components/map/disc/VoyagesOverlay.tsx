"use client";

// VoyagesOverlay — an SVG polyline tracing a character's travels through the
// galaxy landmarks. It lives INSIDE the disc wrapper (same 0..100 viewBox as
// the landmark markers), so polar(r, a) lines the route up exactly with the
// planet markers and the parent pan/zoom transform carries it for free.
// Galaxy view only (the dummy routes are galaxy-scale landmark ids).

import { useMemo } from "react";

import { polar } from "@/lib/galaxy/coords";
import type { Landmark, Theme } from "@/lib/galaxy/types";
import { VOYAGES } from "@/lib/galaxy/voyages";

import { useGalaxy } from "../context";

interface VoyagesOverlayProps {
  theme: Theme;
  /** Parent gate: galaxy view (not dived) and animations allowed. */
  visible: boolean;
}

export default function VoyagesOverlay({ theme, visible }: VoyagesOverlayProps) {
  const state = useGalaxy();

  const voyage = useMemo(
    () => VOYAGES.find((v) => v.id === state.selectedVoyageId) ?? null,
    [state.selectedVoyageId],
  );

  const pts = useMemo(() => {
    if (!voyage) return [] as Array<[number, number]>;
    const byId = new Map<string, Landmark>(
      state.data.landmarks.map((l) => [l.id, l]),
    );
    return voyage.waypoints
      .map((id) => byId.get(id))
      .filter((l): l is Landmark => !!l)
      .map((l) => polar(l.r, l.a));
  }, [voyage, state.data.landmarks]);

  if (!visible || !voyage || pts.length < 2) return null;

  const color = voyage.color;
  const polyPoints = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        zIndex: 2,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      {/* soft underlay glow */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.22}
        style={{ filter: `drop-shadow(0 0 1.2px ${color})` }}
      />
      {/* dashed route line */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 1.5"
        opacity={0.95}
      />
      {/* waypoint dots + order numerals */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={0.85} fill={color} opacity={0.18} />
          <circle cx={x} cy={y} r={0.42} fill={color} />
          <text
            x={x}
            y={y - 1.6}
            textAnchor="middle"
            fontFamily={theme.fontMono}
            fontSize={1.7}
            fill={color}
            opacity={0.85}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
