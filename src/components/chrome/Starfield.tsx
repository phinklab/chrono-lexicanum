"use client";

import { useEffect, useRef } from "react";

/**
 * Starfield — a multi-layer parallax canvas that renders behind the rest of
 * the app. Four depth layers, each with its own drift speed, brightness
 * envelope, and twinkle period. Bright layer paints a soft halo per star.
 *
 * Ported from `archive/prototype-v1/components/AnimatedStarfield.jsx` with
 * three changes from the prototype:
 *   - typed in TypeScript with React 19 ref shape;
 *   - star tint shifted toward our cold palette (cyan-leaning whites);
 *   - density prop scales every layer, so future per-route overrides are
 *     trivial (e.g. dimmer on dense data routes).
 *
 * Position: fixed, full viewport, z-index 0 — sits behind every route's
 * `<main>` content (which lives at z-index 1) and below TopChrome (z-index
 * 20). pointer-events: none so it never intercepts clicks.
 *
 * Respects `prefers-reduced-motion`: drift halts and twinkle freezes (alpha
 * stays at the base for each star). Stars stay visible — only motion stops.
 */

type Star = {
  x: number;
  y: number;
  r: number;
  baseA: number;
  tw: number;
  phase: number;
};

type Layer = {
  count: number;
  speed: number;
  sizeMin: number;
  sizeMax: number;
  alphaMin: number;
  alphaMax: number;
  twMin: number;
  twMax: number;
  bright?: boolean;
  stars: Star[];
};

export interface StarfieldProps {
  /** Multiplier applied to each layer's star count. Default 1. */
  density?: number;
}

export default function Starfield({ density = 1 }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;

    // Layer recipes. Total at density=1 is ~244 stars.
    const layers: Layer[] = [
      { count: Math.round(140 * density), speed: 0.015, sizeMin: 0.4, sizeMax: 0.9, alphaMin: 0.15, alphaMax: 0.45, twMin: 3500, twMax: 7000, stars: [] },
      { count: Math.round(70 * density),  speed: 0.035, sizeMin: 0.6, sizeMax: 1.2, alphaMin: 0.25, alphaMax: 0.6,  twMin: 3000, twMax: 6000, stars: [] },
      { count: Math.round(28 * density),  speed: 0.080, sizeMin: 0.9, sizeMax: 1.8, alphaMin: 0.45, alphaMax: 0.85, twMin: 2500, twMax: 5500, stars: [] },
      { count: Math.round(6 * density),   speed: 0.120, sizeMin: 1.4, sizeMax: 2.4, alphaMin: 0.65, alphaMax: 1.0,  twMin: 2000, twMax: 4500, bright: true, stars: [] },
    ];

    // Seeded PRNG so star positions stay stable across resizes.
    let seed = 4242;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const populate = () => {
      for (const l of layers) {
        l.stars = [];
        for (let i = 0; i < l.count; i++) {
          l.stars.push({
            x: rand() * W,
            y: rand() * H,
            r: l.sizeMin + rand() * (l.sizeMax - l.sizeMin),
            baseA: l.alphaMin + rand() * (l.alphaMax - l.alphaMin),
            tw: l.twMin + rand() * (l.twMax - l.twMin),
            phase: rand() * Math.PI * 2,
          });
        }
      }
    };

    const resize = () => {
      seed = 4242;
      const rect = canvas.getBoundingClientRect();
      W = Math.floor(rect.width);
      H = Math.floor(rect.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      populate();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);

      for (const l of layers) {
        for (const s of l.stars) {
          if (!reduced) {
            s.x -= l.speed * dt * 0.06;
            if (s.x < -4) s.x = W + 4;
          }
          const twinkle = reduced
            ? 1
            : 0.55 + 0.45 * Math.sin((now / s.tw) * Math.PI * 2 + s.phase);
          const alpha = s.baseA * twinkle;

          if (l.bright) {
            // Cold-palette halo: cyan-leaning white core, very soft outer glow.
            const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
            grd.addColorStop(0, `rgba(232, 244, 255, ${alpha})`);
            grd.addColorStop(0.4, `rgba(180, 220, 255, ${alpha * 0.25})`);
            grd.addColorStop(1, "rgba(180, 220, 255, 0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(240, 250, 255, ${Math.min(1, alpha + 0.15)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(232, 228, 216, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="starfield-canvas"
    />
  );
}
