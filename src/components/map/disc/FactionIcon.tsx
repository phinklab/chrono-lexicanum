"use client";

// Line-only grimdark glyphs sized for a unit design space (±0.5).
// `non-scaling-stroke` keeps the 1px strokes crisp at any zoom.

import type { Faction, WorldKind } from "@/lib/galaxy/types";

interface FactionIconProps {
  faction: Faction;
  kind?: WorldKind | string;
  color: string;
}

export default function FactionIcon({ faction, kind, color }: FactionIconProps) {
  const k = kind || "";
  const sw = "0.085";
  const ve = "non-scaling-stroke";
  if (faction === "chaos" || k === "warp" || k === "chaos") {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinecap="round">
        <line x1="0" y1="-0.48" x2="0" y2="0.48" />
        <line x1="-0.48" y1="0" x2="0.48" y2="0" />
        <line x1="-0.34" y1="-0.34" x2="0.34" y2="0.34" />
        <line x1="-0.34" y1="0.34" x2="0.34" y2="-0.34" />
        <line x1="0" y1="-0.48" x2="-0.07" y2="-0.36" />
        <line x1="0" y1="-0.48" x2="0.07" y2="-0.36" />
        <line x1="0" y1="0.48" x2="-0.07" y2="0.36" />
        <line x1="0" y1="0.48" x2="0.07" y2="0.36" />
        <circle cx="0" cy="0" r="0.075" fill={color} stroke="none" />
      </g>
    );
  }
  if (faction === "necron" || k === "necron") {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinejoin="miter">
        <polygon points="0,-0.48 0.40,0 0,0.48 -0.40,0" />
        <line x1="-0.40" y1="0" x2="0.40" y2="0" />
        <line x1="0" y1="-0.48" x2="0" y2="0.48" />
        <circle cx="0" cy="0" r="0.06" fill={color} stroke="none" />
      </g>
    );
  }
  if (faction === "tyranid" || k === "tyranid") {
    return (
      <g fill="none" stroke={color} strokeWidth="0.105" vectorEffect={ve} strokeLinecap="round">
        <path d="M -0.40 0.42 C -0.45 -0.28, 0.36 -0.50, 0.46 0.42" />
        <line x1="0.46" y1="0.42" x2="0.28" y2="0.22" />
        <circle cx="-0.40" cy="0.42" r="0.07" fill={color} stroke="none" />
      </g>
    );
  }
  if (faction === "xenos" || k === "xenos") {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinejoin="miter" strokeLinecap="round">
        <polygon points="0,-0.50 0.45,0.32 -0.45,0.32" />
        <line x1="0" y1="-0.06" x2="0" y2="0.20" />
        <circle cx="0" cy="0.05" r="0.05" fill={color} stroke="none" />
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinecap="square">
      <line x1="0" y1="-0.34" x2="0" y2="0.50" />
      <line x1="-0.24" y1="-0.20" x2="0.24" y2="-0.20" />
      <line x1="-0.06" y1="-0.42" x2="0.06" y2="-0.42" />
      <line x1="0" y1="-0.50" x2="0" y2="-0.34" />
      <line x1="-0.12" y1="-0.10" x2="0.12" y2="-0.10" />
    </g>
  );
}
