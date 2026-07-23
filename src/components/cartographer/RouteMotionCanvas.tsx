"use client";

/**
 * Raster journey lines avoid transformed SVG repaint flicker in Blink/WebKit.
 * Routes stay vector-authored; Canvas paints only during bounded reveals and
 * camera frames. Idle or hidden documents perform no repaint work.
 */

import { useEffect, useRef } from "react";

import { pointOnLeg, type ResolvedVoyage } from "@/lib/map/voyages";

import type { ChartBus } from "./chart-bus";
import { GOLD } from "./chart-geometry";

interface RouteMotionCanvasProps {
  bus: ChartBus;
  resolved: ResolvedVoyage | null;
  /** Tour step, or null for the ambient full-route choreography. */
  progress: number | null;
  reduce: boolean;
  highlightedArmLegion?: string | null;
  hiddenArmLegions?: ReadonlySet<string>;
}

const MAX_DPR = 2;
const FRAME_MS = 1000 / 30;
const REVEAL_MS = 900;
const AMBIENT_STAGGER_MS = 1450;
const AMBIENT_LEAD_MS = 350;
const LEGION_SEGMENT_STAGGER_MS = REVEAL_MS;
const PATH_SAMPLES = 64;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function RouteMotionCanvas({
  bus,
  resolved,
  progress,
  reduce,
  highlightedArmLegion = null,
  hiddenArmLegions = new Set<string>(),
}: RouteMotionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let pendingFrame = 0;
    let lastPaint = -Infinity;
    const startedAt = performance.now();
    let pausedAt = document.hidden ? startedAt : null;
    let pausedFor = 0;

    const activeElapsed = (now: number) =>
      now -
      startedAt -
      pausedFor -
      (pausedAt === null ? 0 : now - pausedAt);

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

    if (!resolved) {
      clear();
      return;
    }

    const firstEntry = new Map(resolved.legRevealAt.map((step, legIndex) => [legIndex, step]));
    const armByLeg = new Map(
      resolved.strategicArms.flatMap((arm) =>
        arm.legIndices.map((legIndex) => [legIndex, arm] as const),
      ),
    );
    const legionStepTour =
      resolved.strategic?.mode === "legion-steps" &&
      progress !== null &&
      progress >= 0 &&
      progress < resolved.stations.length;

    const revealFraction = (legIndex: number, elapsed: number) => {
      if (progress === null) {
        if (reduce) return 1;
        const start = legIndex * AMBIENT_STAGGER_MS + AMBIENT_LEAD_MS;
        return clamp01((elapsed - start) / REVEAL_MS);
      }
      const arm = armByLeg.get(legIndex);
      if (legionStepTour) {
        if (!arm || arm.revealAt !== progress) return 0;
        if (reduce) return 1;
        const order = arm.legIndices.indexOf(legIndex);
        const start = Math.max(0, order) * LEGION_SEGMENT_STAGGER_MS;
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
      if (legionStepTour) {
        const arm = resolved.strategicArms.find((candidate) => candidate.revealAt === progress);
        return arm
          ? Math.max(0, arm.legIndices.length - 1) * LEGION_SEGMENT_STAGGER_MS + REVEAL_MS
          : 0;
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
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.lineDashOffset = 0;

      const elapsed = activeElapsed(now);
      resolved.legs.forEach((leg, legIndex) => {
        const arm = armByLeg.get(legIndex);
        if (arm && hiddenArmLegions.has(arm.legion)) return;
        const selected = arm?.legion === highlightedArmLegion;
        const jump = resolved.legEffects[legIndex] === "jump";
        const fraction = revealFraction(legIndex, elapsed);
        if (fraction <= 0) return;
        ctx.setLineDash(jump ? [0.35, 4.2] : [2.2, 5.4]);
        ctx.globalAlpha = selected ? 1 : (resolved.legOpacities[legIndex] ?? 0.9);
        ctx.lineWidth = selected ? 2.8 : 1.7;
        ctx.strokeStyle = resolved.legColors[legIndex] ?? GOLD;
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
      if (document.hidden || pendingFrame) return;
      pendingFrame = requestAnimationFrame((now) => {
        pendingFrame = 0;
        paint(now);
      });
    };
    const unsubscribe = bus.onFrame(requestPaint);

    /* Bounded reveal ticker (30 fps) — runs only through the draw-in window,
       then paints one final full state and stops. */
    const tick = (now: number) => {
      if (document.hidden) return;
      const done = activeElapsed(now) > animEnd + 80;
      if (!done) raf = requestAnimationFrame(tick);
      if (!done && now - lastPaint < FRAME_MS) return;
      lastPaint = now;
      paint(now);
    };

    /* First paint may precede the chart driver — retry until it lands, then
       hand over to the reveal ticker (if anything animates at all). */
    const drawWhenReady = (now: number) => {
      if (document.hidden) return;
      if (!paint(now)) {
        raf = requestAnimationFrame(drawWhenReady);
        return;
      }
      if (animEnd > 0) raf = requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      const now = performance.now();
      if (document.hidden) {
        if (pausedAt === null) pausedAt = now;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(pendingFrame);
        raf = 0;
        pendingFrame = 0;
        return;
      }

      if (pausedAt !== null) {
        pausedFor += now - pausedAt;
        pausedAt = null;
      }
      raf = requestAnimationFrame(drawWhenReady);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!document.hidden) raf = requestAnimationFrame(drawWhenReady);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pendingFrame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
      clear();
    };
  }, [bus, hiddenArmLegions, highlightedArmLegion, progress, reduce, resolved]);

  return (
    <canvas
      ref={canvasRef}
      className="cg-route-canvas"
      data-route-canvas={resolved?.id ?? undefined}
      aria-hidden="true"
    />
  );
}
