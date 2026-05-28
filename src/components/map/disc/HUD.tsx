"use client";

// Bottom HUD strip — link-status dot, theme tag, scale, time stamp, view.

import { useEffect, useState } from "react";

import type { GalaxyView, Theme } from "@/lib/galaxy/types";

interface HUDProps {
  theme: Theme;
  view: GalaxyView;
  dived: boolean;
}

export default function HUD({ theme, view, dived }: HUDProps) {
  const t = theme;
  // Start at 0 to avoid Date.now() during render (hydration mismatch). The
  // interval kicks in within a second of mount; the static "000" flash is
  // identical to a freshly-mounted prototype.
  const [time, setTime] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const stamp = String(Math.floor(time / 1000) % 1000).padStart(3, "0");
  return (
    <div
      style={{
        display: "flex",
        gap: 22,
        alignItems: "center",
        fontFamily: t.fontMono,
        color: t.primary,
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        opacity: 0.85,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: t.primary,
            boxShadow: `0 0 10px ${t.primary}`,
            animation: "mapPulse 1.6s infinite",
          }}
        />
        Link · Active
      </span>
      <span>Auspex // {t.id.toUpperCase()}</span>
      <span style={{ opacity: 0.7 }}>SCALE {view === "galaxy" ? "1:10⁹ LY" : "1:10⁷ LY"}</span>
      <span style={{ opacity: 0.7 }}>STAMP M42.{stamp.slice(-3)}</span>
      <span style={{ opacity: dived ? 1 : 0.4, color: dived ? t.accent : t.primary }}>
        {view === "galaxy" ? "◇ GALACTIC VIEW" : `◆ SEGMENTUM ${view.toUpperCase()}`}
      </span>
    </div>
  );
}
