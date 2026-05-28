"use client";

// Dive-mode text labels for every world in the active segmentum. HTML over-
// lay so font metrics and rendering match the rest of the labels.

import { polar } from "@/lib/galaxy/coords";
import { FACTION_COLORS, SEGMENTUM_WORLDS } from "@/lib/galaxy/data";
import type { FactionFilter, SegmentumId, Theme, World } from "@/lib/galaxy/types";
import DecodedText from "./DecodedText";
import PlanetTooltip from "./PlanetTooltip";

interface SegmentumWorldLabelsProps {
  theme: Theme;
  visible: boolean;
  // Während der Map-Transition: Wrapper-Opacity 0 + Pointer-Events off, damit
  // die HTML-Overlay-Labels nicht sichtbar mit dem Parent-CSS-Transform
  // mit-skalieren und am Übergang shrink-snappen. Nach finish_transition
  // (state.transitioning=false) fadet der Wrapper über die CSS-Transition
  // sanft ein. Die Labels selbst bleiben durchgehend gemountet (sonst gibt
  // es kein Fade-In, weil mount allein nicht transitioniert).
  dimmed?: boolean;
  segId: SegmentumId | null;
  factionFilter: FactionFilter;
  onWorldClick: (w: World) => void;
  selectedId: string | null;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

export default function SegmentumWorldLabels({
  theme,
  visible,
  dimmed = false,
  segId,
  factionFilter,
  onWorldClick,
  selectedId,
  hoveredId,
  setHoveredId,
}: SegmentumWorldLabelsProps) {
  const t = theme;
  if (!visible || !segId) return null;
  const worlds = SEGMENTUM_WORLDS[segId] ?? [];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: dimmed ? 0 : 1,
        transition: "opacity 340ms ease",
      }}
    >
      {worlds.map((w) => {
        const [x, y] = polar(w.r, w.a);
        const fc = w.faction === "neutral" ? t.primary : FACTION_COLORS[w.faction];
        const dim = factionFilter !== "all" && factionFilter !== w.faction;
        const isSel = selectedId === w.id;
        const isHov = hoveredId === w.id;
        const label = w.name.toUpperCase();
        return (
          <div key={w.id}>
            <div
              onClick={() => onWorldClick(w)}
              onPointerEnter={() => setHoveredId(w.id)}
              onPointerLeave={() => setHoveredId(null)}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(12px, -50%) ${isHov ? "translateX(2px)" : ""}`,
                fontFamily: t.fontMono,
                fontSize: 8.5,
                letterSpacing: "0.18em",
                color: isSel ? t.accent : isHov ? t.starHot : fc,
                textShadow: `0 0 ${isHov ? 12 : 6}px ${fc}`,
                opacity: dim ? 0.15 : isHov || isSel ? 0 : 0.85,
                cursor: "pointer",
                pointerEvents: dimmed ? "none" : "auto",
                whiteSpace: "nowrap",
                padding: "2px 4px",
                transition: "color 0.2s, opacity 0.2s, text-shadow 0.2s, transform 0.2s",
                fontWeight: 500,
              }}
            >
              <DecodedText text={label} active={false} />
            </div>
            <PlanetTooltip
              theme={t}
              name={<DecodedText text={label} active={isHov || isSel} />}
              sub={w.type}
              factionColor={fc}
              x={x}
              y={y}
              visible={(isHov || isSel) && !dim}
            />
          </div>
        );
      })}
    </div>
  );
}
