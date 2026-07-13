"use client";

/**
 * RouteMotionCanvas — mobile-only raster rendering for Great Journeys.
 *
 * Mobile WebKit/Blink repaint SVG stroke-dashoffset animations in software;
 * on a transformed map that can flash the SVG backing store. The route stays
 * vector-authored, but its line is sampled into this small Canvas surface.
 *
 * Since 2026-07-13 the standing line is STATIC — a plain dashed line, no
 * dash drift (the maintainer tried direction chevrons and preferred the
 * dashes). The old perpetual 30 fps drift kept invalidating a fullscreen
 * layer and the entity flicker on drag came back with it. Now the canvas
 * repaints only (a) on camera frames (the route must track the chart) and
 * (b) during the bounded draw-in window when the tour enters a new leg.
 * Idle = zero repaints. Static SVG rings/labels remain in RoutesLayer.
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
const PATH_SAMPLES = 64;

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
    let pendingFrame = 0;
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

    /* How long anything animates at all: the draw-in of the leg the tour
       just entered (or the ambient stagger). 0 = fully static from the
       first paint — no ticker runs. */
    const animEnd = (() => {
      if (reduce) return 0;
      if (progress === null) {
        return (resolved.legs.length - 1) * AMBIENT_STAGGER_MS + AMBIENT_LEAD_MS + REVEAL_MS;
      }
      for (const entry of firstEntry.values()) {
        if (entry === progress) return REVEAL_MS;
      }
      return 0;
    })();

    const paint = (now: number): boolean => {
      const driver = bus.driver;
      if (!driver) return false;
      const rect = sizeCanvas();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      // Static dash pattern — same voice as the desktop SVG line, but the
      // offset never moves (the drift was the flicker driver).
      ctx.setLineDash([2.2, 5.4]);
      ctx.lineDashOffset = 0;

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

    /* Camera frames: one coalesced repaint per frame event — the only
       repaint source once the draw-in window is over. */
    const requestPaint = () => {
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame((now) => {
        pendingFrame = 0;
        paint(now);
      });
    };
    const unsubscribe = bus.onFrame(requestPaint);

    /* Bounded reveal ticker (30 fps) — runs only through the draw-in window,
       then paints one final full state and stops. */
    const tick = (now: number) => {
      const done = now - startedAt > animEnd + 80;
      if (!done) raf = requestAnimationFrame(tick);
      if (!done && now - lastPaint < FRAME_MS) return;
      lastPaint = now;
      paint(now);
    };

    /* First paint may precede the chart driver — retry until it lands, then
       hand over to the reveal ticker (if anything animates at all). */
    const drawWhenReady = (now: number) => {
      if (!paint(now)) {
        raf = requestAnimationFrame(drawWhenReady);
        return;
      }
      if (animEnd > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(drawWhenReady);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pendingFrame);
      unsubscribe();
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
