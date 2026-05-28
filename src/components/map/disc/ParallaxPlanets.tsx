"use client";

// 3 distant gas-giant silhouettes that drift behind the starfields. Pure CSS
// gradients (no SVG) so they rasterize at full device resolution.

import { useMemo } from "react";

import type { Theme } from "@/lib/galaxy/types";

interface ParallaxPlanetsProps {
  pan: { x: number; y: number };
  theme: Theme;
  suspended?: boolean;
}

interface PlanetBody {
  x: number;
  y: number;
  size: number;
  base: string;
  lit: string;
  ringColor: string | null;
  parallax: number;
  blur: number;
  opacity: number;
  glow: number;
}

export default function ParallaxPlanets({ pan, theme, suspended = false }: ParallaxPlanetsProps) {
  const t = theme;
  const planets = useMemo<PlanetBody[]>(
    () => [
      { x: 14, y: 84, size: 620, base: "#0e0a08", lit: "#2a1c12", ringColor: null, parallax: 0.022, blur: 4.5, opacity: 0.55, glow: 0 },
      { x: 90, y: 12, size: 360, base: "#100a14", lit: "#4a2a44", ringColor: "#5a3850", parallax: 0.07, blur: 2.5, opacity: 0.6, glow: 38 },
      { x: 78, y: 76, size: 170, base: "#0a1410", lit: t.primary, ringColor: null, parallax: 0.18, blur: 1.5, opacity: 0.55, glow: 22 },
    ],
    [t.primary],
  );
  if (suspended) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        mixBlendMode: "screen",
      }}
    >
      {planets.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(${pan.x * p.parallax}px, ${pan.y * p.parallax}px)`,
          }}
        >
          {p.glow > 0 && (
            <div
              style={{
                position: "absolute",
                left: -p.size / 2 - p.glow,
                top: -p.size / 2 - p.glow,
                width: p.size + p.glow * 2,
                height: p.size + p.glow * 2,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${p.lit}38 0%, transparent 60%)`,
                opacity: p.opacity * 0.7,
                filter: `blur(${p.blur * 2}px)`,
              }}
            />
          )}
          {p.ringColor && (
            <div
              style={{
                position: "absolute",
                left: -p.size * 0.85,
                top: -p.size * 0.08,
                width: p.size * 1.7,
                height: p.size * 0.16,
                borderRadius: "50%",
                border: `1px solid ${p.ringColor}`,
                opacity: p.opacity * 0.5,
                transform: "rotate(-22deg)",
                filter: `blur(${p.blur * 0.6}px)`,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              left: -p.size / 2,
              top: -p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 36% 30%, ${p.lit} 0%, ${p.base} 48%, #050402 78%)`,
              opacity: p.opacity,
              filter: `blur(${p.blur}px)`,
              boxShadow: `inset -${p.size * 0.04}px 0 ${p.size * 0.18}px ${t.bg0}cc`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
