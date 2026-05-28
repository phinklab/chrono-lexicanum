"use client";

// HTML overlay over the disc carrying landmark text labels + nebula names +
// sub-sector names. All text lives at viewBox-percent coordinates so it
// tracks the disc through the zoom transform.

import { polar, inSegment } from "@/lib/galaxy/coords";
import { FACTION_COLORS, SUB_SECTORS } from "@/lib/galaxy/data";
import type {
  FactionFilter,
  Landmark,
  Nebula,
  Segmentum,
  SegmentumId,
  Theme,
} from "@/lib/galaxy/types";
import DecodedText from "./DecodedText";
import PlanetTooltip from "./PlanetTooltip";

interface LandmarkLabelsProps {
  theme: Theme;
  landmarks: readonly Landmark[];
  nebulae: readonly Nebula[];
  segments: readonly Segmentum[];
  factionFilter: FactionFilter;
  dived: boolean;
  divedSeg: SegmentumId | null;
  hoveredLandmark: string | null;
  setHoveredLandmark: (id: string | null) => void;
}

const KIND_SUB: Record<string, string> = {
  throne: "Throneworld of the Imperium",
  fortress: "Fortress World",
  warp: "Warp Anomaly",
  astartes: "Astartes Homeworld",
  hive: "Hive World",
  death: "Death World",
  xenos: "Xenos Domain",
};

export default function LandmarkLabels({
  theme,
  landmarks,
  nebulae,
  segments,
  factionFilter,
  dived,
  divedSeg,
  hoveredLandmark,
  setHoveredLandmark,
}: LandmarkLabelsProps) {
  const t = theme;
  const divedSegObj = divedSeg ? segments.find((s) => s.id === divedSeg) : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {landmarks.map((l) => {
        const [x, y] = polar(l.r, l.a);
        const c = l.faction === "chaos" ? t.danger : l.faction === "neutral" ? t.accent : FACTION_COLORS[l.faction];
        const showOK = factionFilter === "all" || factionFilter === l.faction;
        const visible = !dived;
        const isHov = hoveredLandmark === l.id;
        return (
          <div key={l.id}>
            <div
              onPointerEnter={() => setHoveredLandmark(l.id)}
              onPointerLeave={() => setHoveredLandmark(null)}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(12px,-50%)",
                fontFamily: t.fontMono,
                color: c,
                fontSize: 9,
                letterSpacing: "0.18em",
                textShadow: `0 0 8px ${c}`,
                opacity: visible && showOK ? (isHov ? 0 : 0.92) : 0,
                transition: "opacity 0.25s",
                whiteSpace: "nowrap",
                pointerEvents: "auto",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 1,
                  background: c,
                  verticalAlign: "middle",
                  marginRight: 4,
                  opacity: 0.7,
                }}
              />
              <DecodedText text={l.name} active={false} />
            </div>
            <PlanetTooltip
              theme={t}
              name={<DecodedText text={l.name} active={isHov} />}
              sub={KIND_SUB[l.kind] || l.kind.toUpperCase()}
              factionColor={c}
              x={x}
              y={y}
              visible={isHov && visible && showOK}
            />
          </div>
        );
      })}
      {nebulae
        .filter((n) => !n.isRift && n.name !== "Eye of Terror")
        .map((n, i) => {
          if (n.r === undefined || n.a === undefined) return null;
          const [x, y] = polar(n.r, n.a);
          const inDivedSeg = divedSegObj ? inSegment(n.r, n.a, divedSegObj) : true;
          const visible = !dived || inDivedSeg;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: t.fontDisplay,
                fontSize: 9,
                letterSpacing: "0.24em",
                color: n.type === "warp" ? "#ffaa88" : "#aaccff",
                textShadow: `0 0 8px ${n.color}`,
                opacity: visible ? 0.75 : 0,
                transition: "opacity 0.6s",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: (n.size ?? 1) * 1.5,
              }}
            >
              {n.name}
            </div>
          );
        })}
      {SUB_SECTORS.map((ss, i) => {
        const midA = (ss.a0 + ss.a1) / 2;
        const midR = (ss.r0 + ss.r1) / 2;
        const [x, y] = polar(midR, midA);
        const visible = !dived || ss.seg === divedSeg;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              fontFamily: t.fontMono,
              fontSize: 7.5,
              letterSpacing: "0.28em",
              color: t.primary,
              opacity: visible ? 0.4 : 0,
              transition: "opacity 0.6s",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              fontStyle: "italic",
            }}
          >
            {ss.name}
          </div>
        );
      })}
    </div>
  );
}
