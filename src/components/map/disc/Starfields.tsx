"use client";

// 3-layer parallax starfield + flat in-disc motes. Kept deliberately static:
// hundreds of independent CSS animations were enough to make the Surface
// transition tear on Windows/Chromium when combined with the scaled SVG disc.

import { useMemo } from "react";

import { makeStars } from "@/lib/galaxy/stars";
import type { Theme } from "@/lib/galaxy/types";

interface StarFieldProps {
  theme: Theme;
  count?: number;
  layer?: number;
  parallax?: { x: number; y: number };
  suspended?: boolean;
}

export function StarField({
  theme,
  count = 180,
  layer = 1,
  parallax = { x: 0, y: 0 },
  suspended = false,
}: StarFieldProps) {
  const t = theme;
  const stars = useMemo(() => makeStars(count, layer * 13), [count, layer]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        transform: `translate(${parallax.x}px, ${parallax.y}px)`,
      }}
    >
      {!suspended && stars.map((s) => {
        const c = s.z > 0.95 ? t.starHot : t.starColor;
        const isBright = s.z > 0.95;
        const size = isBright ? 1.1 : 0.45 + s.z * 0.25;
        const baseOp = isBright ? 0.55 : 0.16 + s.z * 0.32;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: c,
              opacity: baseOp,
            }}
          />
        );
      })}
    </div>
  );
}

interface FlatMotesProps {
  theme: Theme;
  count?: number;
  suspended?: boolean;
}

export function FlatMotes({ theme, count = 50, suspended = false }: FlatMotesProps) {
  const t = theme;
  const motes = useMemo(() => makeStars(count, 99), [count]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {!suspended && motes.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            left: `${20 + m.x * 0.6}%`,
            top: `${20 + m.y * 0.6}%`,
            width: 1.2,
            height: 1.2,
            borderRadius: "50%",
            background: t.primary,
            opacity: 0.12 + m.z * 0.28,
          }}
        />
      ))}
    </div>
  );
}
