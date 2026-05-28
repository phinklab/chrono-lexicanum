"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type ProcessingDotsProps = {
  label?: string;
  color?: string;
};

export default function ProcessingDots({
  label = "COGITATOR PROCESSING",
  color = "var(--cl-cyan)",
}: ProcessingDotsProps) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setN((x) => (x + 1) % 4), 350);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <span
      style={{
        fontFamily: "var(--font-plex-mono)",
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        fontSize: 11,
        color,
      }}
    >
      {label}
      {".".repeat(n)}
      <span style={{ opacity: 0 }}>{".".repeat(3 - n)}</span>
    </span>
  );
}
