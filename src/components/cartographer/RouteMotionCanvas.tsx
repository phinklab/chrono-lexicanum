"use client";

/**
 * RouteMotionCanvas — mobile-only raster animation for Great Journeys.
 *
 * Mobile WebKit/Blink repaint SVG stroke-dashoffset animations in software;
 * on a transformed map that can flash the SVG backing store. The route stays
 * vector-authored, but its moving dashes are sampled into this small Canvas
 * surface at 30 fps. Static SVG rings/labels remain in RoutesLayer.
 */

import { useEffect, useRef } from "react";

import { pointOnLeg, type ResolvedVoyage } from "@/lib/map/voyages";
import { useMediaQuery } from "@/lib/useMediaQuery";

import type { ChartBus } from "./chart-bus";
import { GOLD } from "./chart-geometry";

interface RouteMotionCanvasProps {
  bus: ChartBus;
  resolved: ResolvedVoyage | null;
  /** Tour step, or null for the ambient full-route choreography. */
  progress: number | null;
  reduce: boolean;
}

const MAX_DPR = 2;
const FRAME_MS = 1000 / 30;
const REVEAL_MS = 900;
const AMBIENT_STAGGER_MS = 1450;
const AMBIENT_LEAD_MS = 350;
const PATH_SAMPLES = 48;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function RouteMotionCanvas({
  bus,
  resolved,
  progress,
  reduce,
}: RouteMotionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const narrow = useMediaQuery("(max-width: 900px)");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let lastPaint = -Infinity;
    const startedAt = performance.now();

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    };

    const clear = () => {
      const rect = sizeCanvas();
      ctx.clearRect(0, 0, rect.width, rect.height);
    };

    if (!narrow || !resolved) {
      clear();
      return;
    }

    const firstEntry = new Map<number, number>();
    for (const station of resolved.stations) {
      if (station.legIndex >= 0 && !firstEntry.has(station.legIndex)) {
        firstEntry.set(station.legIndex, station.i);
      }
    }

    const revealFraction = (legIndex: number, elapsed: number) => {
      if (progress === null) {
        if (reduce) return 1;
        const start = legIndex * AMBIENT_STAGGER_MS + AMBIENT_LEAD_MS;
        return clamp01((elapsed - start) / REVEAL_MS);
      }
      const entry = firstEntry.get(legIndex);
      if (entry === undefined || progress < entry) return 0;
      if (reduce || progress > entry) return 1;
      return clamp01(elapsed / REVEAL_MS);
    };

    const paint = (now: number): boolean => {
      const driver = bus.driver;
      if (!driver) return false;
      const rect = sizeCanvas();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.setLineDash([2.2, 5.4]);
      ctx.lineDashOffset = reduce ? 0 : -((now - startedAt) * 0.008);

      const elapsed = now - startedAt;
      resolved.legs.forEach((leg, legIndex) => {
        const fraction = revealFraction(legIndex, elapsed);
        if (fraction <= 0) return;
        const samples = Math.max(2, Math.ceil(PATH_SAMPLES * fraction));
        ctx.beginPath();
        for (let i = 0; i <= samples; i += 1) {
          const point = pointOnLeg(leg, (fraction * i) / samples);
          if (!point) continue;
          const screen = driver.worldToScreen(point.x, point.y);
          const x = screen.x - rect.left;
          const y = screen.y - rect.top;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      return true;
    };

    if (reduce) {
      const redraw = () => paint(performance.now());
      const unsubscribe = bus.onFrame(redraw);
      const drawWhenReady = () => {
        if (!paint(performance.now())) raf = requestAnimationFrame(drawWhenReady);
      };
      raf = requestAnimationFrame(drawWhenReady);
      return () => {
        cancelAnimationFrame(raf);
        unsubscribe();
        clear();
      };
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastPaint < FRAME_MS) return;
      lastPaint = now;
      paint(now);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clear();
    };
  }, [bus, narrow, progress, reduce, resolved]);

  return (
    <canvas
      ref={canvasRef}
      className="cg-route-canvas"
      data-route-canvas={resolved?.id ?? undefined}
      aria-hidden="true"
    />
  );
}
