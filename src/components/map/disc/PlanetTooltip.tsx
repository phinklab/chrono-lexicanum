"use client";

// Floating nameplate — pure HTML overlay positioned by polar coords. Used by
// landmark labels and segmentum world labels on hover. Redesigned 2026-06-13
// (Session 150 eyeballing) into the gold language: no border, no corner
// brackets, no halo glow, no caret — a dark plate carried by drop shadow +
// a faint bone light-catch; the faction color lives only in the name text.

import type { ReactNode } from "react";
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
        transform: `translate(-50%, calc(-100% - 14px)) translateY(${visible ? 0 : 4}px)`,
        pointerEvents: "none",
        zIndex: 3,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.18s ease-out, transform 0.18s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(180deg, rgba(6,9,16,0.96), rgba(2,4,10,0.97))",
          boxShadow:
            "0 14px 36px -8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(232,220,192,0.07)",
          padding: "7px 12px 8px",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 12,
            letterSpacing: "0.22em",
            color: factionColor || t.accent,
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
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
    </div>
  );
}
