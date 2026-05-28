"use client";

// HTML overlay with each segmentum's name + "▸ DIVE" hint. The label of the
// currently-dived segmentum is suppressed (the title bar covers it).

import { polar } from "@/lib/galaxy/coords";
import type { Segmentum, SegmentumId, Theme } from "@/lib/galaxy/types";

interface SegmentumLabelsProps {
  theme: Theme;
  segments: readonly Segmentum[];
  dived: boolean;
  divedSeg: SegmentumId | null;
  hoveredSeg: SegmentumId | null;
  setHoveredSeg: (id: SegmentumId | null) => void;
  onDive: (id: SegmentumId) => void;
}

export default function SegmentumLabels({
  theme,
  segments,
  dived,
  divedSeg,
  hoveredSeg,
  setHoveredSeg,
  onDive,
}: SegmentumLabelsProps) {
  const t = theme;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {segments.map((s) => {
        const midA = s.id === "solar" ? 0 : (s.a0 + s.a1) / 2;
        const midR = s.id === "solar" ? 0 : ((s.inner + s.outer) / 2) * 0.85;
        const [x, y] = polar(midR, midA);
        const isActive = s.id === divedSeg;
        const hovered = hoveredSeg === s.id;
        const visible = !dived || isActive;
        if (dived && isActive) return null;
        return (
          <div
            key={s.id}
            onMouseEnter={() => setHoveredSeg(s.id)}
            onMouseLeave={() => setHoveredSeg(null)}
            onClick={() => !dived && onDive(s.id)}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%,-50%)",
              pointerEvents: visible ? "auto" : "none",
              cursor: !dived ? "pointer" : "default",
              fontFamily: t.fontDisplay,
              color: t.primary,
              fontSize: s.id === "solar" ? 11 : 14,
              letterSpacing: t.letterTitle,
              textTransform: "uppercase",
              textAlign: "center",
              textShadow: `0 0 12px ${t.primary}, 0 0 4px ${t.primary}`,
              opacity: visible ? (hovered ? 1 : 0.82) : 0,
              transition: "opacity 0.6s, transform 0.6s",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: "0.6em", opacity: 0.65, marginBottom: 2 }}>SEGMENTUM</div>
            <div>{s.short}</div>
            {!dived && (
              <div
                style={{
                  fontFamily: t.fontMono,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  marginTop: 6,
                  opacity: hovered ? 1 : 0.55,
                  color: t.accent,
                }}
              >
                ▸ DIVE
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
