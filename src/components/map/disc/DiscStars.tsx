"use client";

// In-disc background stars + halo, parallax-lagged behind the disc for depth.
// The stars set is memoed by the parent (GalacticDisc) using the current
// segments as the key so a slider drag triggers exactly one regen.

import { polar } from "@/lib/galaxy/coords";
import type { BgStar, FactionFilter, SegmentumId, Theme } from "@/lib/galaxy/types";

interface DiscStarsProps {
  theme: Theme;
  stars: readonly BgStar[];
  halo: readonly BgStar[];
  dived: boolean;
  divedSeg: SegmentumId | null;
  factionFilter: FactionFilter;
  parX: number;
  parY: number;
}

function starColor(theme: Theme, faction: BgStar["faction"]): string {
  switch (faction) {
    case "imperium":
      return theme.starColor;
    case "chaos":
      return "#ff8866";
    case "xenos":
      return "#9be8b8";
    case "necron":
      return "#b8e8d0";
    default:
      return theme.starColor;
  }
}

export default function DiscStars({
  theme,
  stars,
  halo,
  dived,
  divedSeg,
  factionFilter,
  parX,
  parY,
}: DiscStarsProps) {
  return (
    <g transform={`translate(${parX} ${parY})`}>
      {stars.map((s, i) => {
        const visible = !dived || s.segId === divedSeg;
        if (!visible) return null;
        const [x, y] = polar(s.r, s.a);
        const c = starColor(theme, s.faction);
        const dim = factionFilter !== "all" && factionFilter !== s.faction && s.faction !== "neutral";
        const op = dim ? 0.03 : s.bright ? 0.6 : 0.16 + s.armBias * 0.35;
        const r = s.bright ? s.size * 0.28 : s.size * 0.22;
        return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={op} />;
      })}
      {!dived &&
        halo.map((s, i) => {
          const [x, y] = polar(s.r, s.a);
          const op = s.bright ? 0.45 : 0.08 + (i % 7) * 0.012;
          const r = s.bright ? s.size * 0.26 : s.size * 0.20;
          return <circle key={`h-${i}`} cx={x} cy={y} r={r} fill={theme.starColor} opacity={op} />;
        })}
    </g>
  );
}
