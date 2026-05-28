"use client";

// Floating auspex-frame tooltip — pure HTML overlay positioned by polar coords.
// Used by landmark labels and segmentum world labels on hover.

import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "@/lib/galaxy/types";

interface PlanetTooltipProps {
  theme: Theme;
  name: ReactNode;
  sub?: ReactNode;
  factionColor?: string | null;
  x: number;
  y: number;
  visible: boolean;
}

function cornerBracket(t: Theme, pos: "tl" | "tr" | "bl" | "br", c?: string | null): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    width: 6,
    height: 6,
    borderColor: c || t.primary,
    borderStyle: "solid",
    borderWidth: 0,
  };
  if (pos === "tl") return { ...base, top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 };
  if (pos === "tr") return { ...base, top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 };
  if (pos === "bl") return { ...base, bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 };
  return { ...base, bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 };
}

export default function PlanetTooltip({
  theme,
  name,
  sub,
  factionColor,
  x,
  y,
  visible,
}: PlanetTooltipProps) {
  const t = theme;
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, calc(-100% - 18px)) translateY(${visible ? 0 : 4}px)`,
        pointerEvents: "none",
        zIndex: 3,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.18s ease-out, transform 0.18s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div
        style={{
          position: "relative",
          background: `linear-gradient(180deg, ${t.bg1}ee, ${t.bg0}f4)`,
          border: `1px solid ${factionColor || t.stroke}`,
          boxShadow: `0 0 18px ${factionColor || t.primary}40, 0 0 2px ${factionColor || t.primary}80`,
          padding: "7px 12px 8px",
          whiteSpace: "nowrap",
        }}
      >
        <span style={cornerBracket(t, "tl", factionColor)} />
        <span style={cornerBracket(t, "tr", factionColor)} />
        <span style={cornerBracket(t, "bl", factionColor)} />
        <span style={cornerBracket(t, "br", factionColor)} />
        <div
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 12,
            letterSpacing: "0.22em",
            color: factionColor || t.accent,
            textTransform: "uppercase",
            textShadow: `0 0 10px ${factionColor || t.primary}`,
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: t.fontMono,
              fontSize: 9,
              letterSpacing: "0.18em",
              color: t.primary,
              opacity: 0.75,
              marginTop: 3,
              textTransform: "uppercase",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -7,
          width: 8,
          height: 8,
          transform: "translate(-50%, 0) rotate(45deg)",
          background: t.bg0,
          borderRight: `1px solid ${factionColor || t.stroke}`,
          borderBottom: `1px solid ${factionColor || t.stroke}`,
        }}
      />
    </div>
  );
}
