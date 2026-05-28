"use client";

import ProcessingDots from "@/components/chrono/ProcessingDots";
import type { AccentToken } from "@/lib/askPaths";

type ProcessingPanelProps = {
  accent: AccentToken;
};

export default function ProcessingPanel({ accent }: ProcessingPanelProps) {
  return (
    <div
      className="c-glass c-corners c-fade-in"
      style={{
        width: "min(540px, 92vw)",
        padding: "40px 44px",
        textAlign: "center",
        position: "relative",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-plex-mono)",
          fontSize: 11,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 14,
        }}
      >
        {"// COGITATOR · CALCULATING"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "0.10em",
          color: "var(--cl-bone)",
          marginBottom: 18,
        }}
      >
        <ProcessingDots label="Processing answer" color={accent} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="c-blink"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
