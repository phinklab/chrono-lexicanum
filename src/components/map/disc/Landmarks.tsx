"use client";

// Iconic landmark dots on the galaxy view (Terra, Cadia, Macragge, etc.).
// Hidden when dived — SegmentumDetail draws every world in the active
// segmentum directly, so keeping landmarks on would double-stack rings.

import { polar } from "@/lib/galaxy/coords";
import { FACTION_COLORS, SEGMENTUM_WORLDS } from "@/lib/galaxy/data";
import type { FactionFilter, Landmark, Theme } from "@/lib/galaxy/types";
import PlanetMarker from "./PlanetMarker";

interface LandmarksProps {
  theme: Theme;
  landmarks: readonly Landmark[];
  factionFilter: FactionFilter;
  dived: boolean;
  hoveredLandmark: string | null;
  setHoveredLandmark: (id: string | null) => void;
}

export default function Landmarks({
  theme,
  landmarks,
  factionFilter,
  dived,
  hoveredLandmark,
  setHoveredLandmark,
}: LandmarksProps) {
  const t = theme;
  return (
    <>
      {landmarks.map((l) => {
        const [x, y] = polar(l.r, l.a);
        const c = l.faction === "neutral" ? t.primary : FACTION_COLORS[l.faction];
        const showOK = factionFilter === "all" || factionFilter === l.faction;
        const visible = !dived;
        const hov = hoveredLandmark === l.id;
        const ultimaWorld = SEGMENTUM_WORLDS.ultima.find((w) => w.id === l.id);
        const dotCount = ultimaWorld && ultimaWorld.books ? Math.max(1, ultimaWorld.books.length) : 1;
        return (
          <g
            key={l.id}
            opacity={visible && showOK ? 1 : !visible ? 0 : 0.18}
            style={{ transition: "opacity .6s", cursor: "pointer" }}
            onMouseEnter={() => setHoveredLandmark(l.id)}
            onMouseLeave={() => setHoveredLandmark(null)}
          >
            <circle cx={x} cy={y} r="1.6" fill="transparent" />
            <PlanetMarker
              x={x}
              y={y}
              faction={l.faction}
              kind={l.kind}
              color={c}
              accentColor={t.accent}
              iconScale={hov ? 0.6 : 0.5}
              ringR={0.95}
              dotCount={dotCount}
              hovered={hov}
              spinDur={18}
            />
          </g>
        );
      })}
    </>
  );
}
