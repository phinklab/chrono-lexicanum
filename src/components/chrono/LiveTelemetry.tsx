"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type LiveTelemetryProps = {
  label?: string;
  initial?: number;
  min?: number;
  max?: number;
  unit?: string;
  interval?: number;
  color?: string;
  drift?: number;
  decimals?: number;
};

export default function LiveTelemetry({
  label = "VOLTAGE",
  initial = 0,
  min = 0,
  max = 100,
  unit = "",
  interval = 1800,
  color = "var(--cl-cyan)",
  drift = 0.04,
  decimals = 2,
}: LiveTelemetryProps) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(initial);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      const span = max - min;
      const delta = (Math.random() - 0.5) * span * drift;
      setV((prev) => {
        let next = prev + delta;
        if (next < min) next = min + (min - next);
        if (next > max) next = max - (next - max);
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [min, max, interval, drift, reduced]);

  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
      <span
        style={{
          fontFamily: "var(--font-plex-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: "var(--cl-dim)",
          fontSize: 9,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-plex-mono)",
          fontSize: 11,
          color,
          letterSpacing: "0.06em",
          minWidth: 64,
          display: "inline-block",
        }}
      >
        {v.toFixed(decimals)}
        {unit}
      </span>
    </span>
  );
}
