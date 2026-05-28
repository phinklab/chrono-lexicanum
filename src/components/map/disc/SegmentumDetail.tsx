"use client";

// Worlds inside the dived segmentum — drawn as PlanetMarkers with N pips per
// codex entry. Plus the Ultramar realm boundary highlight (Ultima only) and
// Sol orbit rings (Solar only).

import { polar } from "@/lib/galaxy/coords";
import { FACTION_COLORS, SEGMENTUM_WORLDS } from "@/lib/galaxy/data";
import type { FactionFilter, SegmentumId, Theme, World } from "@/lib/galaxy/types";
import PlanetMarker from "./PlanetMarker";

interface SegmentumDetailProps {
  theme: Theme;
  visible: boolean;
  segId: SegmentumId | null;
  factionFilter: FactionFilter;
  onWorldClick: (w: World) => void;
  selectedId: string | null;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

export default function SegmentumDetail({
  theme,
  visible,
  segId,
  factionFilter,
  onWorldClick,
  selectedId,
  hoveredId,
  setHoveredId,
}: SegmentumDetailProps) {
  const t = theme;
  if (!visible || !segId) return null;
  const worlds = SEGMENTUM_WORLDS[segId] ?? [];
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {segId === "ultima" && (
        <path
          d={(() => {
            const pts = [
              polar(0.48, 80),
              polar(0.5, 85),
              polar(0.58, 88),
              polar(0.68, 92),
              polar(0.72, 100),
              polar(0.62, 105),
              polar(0.5, 100),
              polar(0.46, 90),
            ];
            return "M " + pts.map((p) => p.join(" ")).join(" L ") + " Z";
          })()}
          fill="none"
          stroke={t.primary}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 4"
          opacity="0.35"
        />
      )}
      {segId === "solar" && (
        <g opacity="0.4" pointerEvents="none">
          {[0.05, 0.08, 0.1, 0.13, 0.16].map((rr) => (
            <circle
              key={rr}
              cx="50"
              cy="50"
              r={rr * 50}
              fill="none"
              stroke={t.primary}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1 3"
            />
          ))}
          <circle cx="50" cy="50" r="0.55" fill={t.accent} />
          <circle cx="50" cy="50" r="1.2" fill={t.accent} opacity="0.35" />
        </g>
      )}
      {worlds.map((w) => {
        const [x, y] = polar(w.r, w.a);
        const fc = w.faction === "neutral" ? t.primary : FACTION_COLORS[w.faction];
        const isSel = selectedId === w.id;
        const isHov = hoveredId === w.id;
        const dim = factionFilter !== "all" && factionFilter !== w.faction;
        return (
          <g
            key={w.id}
            style={{
              cursor: "pointer",
              pointerEvents: "auto",
              opacity: dim ? 0.15 : 1,
              transition: "opacity 0.3s",
            }}
            onPointerEnter={() => setHoveredId(w.id)}
            onPointerLeave={() => setHoveredId(null)}
            onClick={() => onWorldClick(w)}
          >
            <circle cx={x} cy={y} r="1.8" fill="transparent" />
            <PlanetMarker
              x={x}
              y={y}
              faction={w.faction}
              kind={w.kind}
              color={fc}
              accentColor={t.accent}
              iconScale={isHov || isSel ? 0.62 : 0.52}
              ringR={0.95}
              dotCount={Math.max(1, w.books.length)}
              hovered={isHov}
              selected={isSel}
              spinDur={13}
            />
          </g>
        );
      })}
    </svg>
  );
}
