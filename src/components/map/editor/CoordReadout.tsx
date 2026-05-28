"use client";

// Cursor coord HUD, bottom-right. Shows the polar coords + compass direction
// of the cursor while the EditOverlay is active. Read-only.

import { compass } from "@/lib/galaxy/coords";
import type { Theme } from "@/lib/galaxy/types";

interface CoordReadoutProps {
  theme: Theme;
  coords: { r: number; a: number } | null;
  visible: boolean;
}

export default function CoordReadout({ theme, coords, visible }: CoordReadoutProps) {
  const t = theme;
  const has = coords && Number.isFinite(coords.r);
  return (
    <div
      style={{
        position: "absolute",
        right: 100,
        bottom: 86,
        pointerEvents: "none",
        fontFamily: t.fontMono,
        fontSize: 11,
        letterSpacing: "0.22em",
        color: t.primary,
        textTransform: "uppercase",
        textAlign: "right",
        opacity: visible ? 0.95 : 0,
        transition: "opacity 0.3s",
        lineHeight: 1.6,
        textShadow: `0 0 8px ${t.primary}`,
        zIndex: 5,
      }}
    >
      <div style={{ fontSize: 9, opacity: 0.55 }}>· CURSOR · POLAR ·</div>
      <div style={{ color: t.accent, fontSize: 14, letterSpacing: "0.18em" }}>
        r {has ? coords!.r.toFixed(3) : "—.———"}
        <span style={{ opacity: 0.4, margin: "0 6px" }}>·</span>
        a {has ? `${coords!.a >= 0 ? "+" : ""}${coords!.a.toFixed(1)}°` : "——.—°"}
      </div>
      <div style={{ fontSize: 9, opacity: 0.6 }}>
        {has ? compass(coords!.a) : "—"} · TERRA = ORIGIN · 0°↑ 90°→
      </div>
    </div>
  );
}
