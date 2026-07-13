"use client";

/**
 * Android-only Canvas2D chart stage.
 *
 * It implements the same ChartBus camera contract as ChartStage, but owns a
 * single opaque viewport bitmap instead of two transformed full-scene SVGs.
 * Camera state stays imperative; scene prop changes invalidate one frame.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import type { FeaturedWorld, MapPayload } from "@/lib/map/payload";
import type { ResolvedVoyage } from "@/lib/map/voyages";
import type { ZonesMode } from "@/lib/map/zones";

import type { CameraDriver, ChartBus } from "./chart-bus";
import { H, W } from "./chart-geometry";
import {
  CANVAS_VOID,
  canvasBackingScale,
  drawCanvasScene,
  pickSceneContact,
  resolveCanvasFonts,
  type CanvasHitTarget,
  type CanvasScene,
} from "./canvas-renderer";
import {
  cameraBand,
  centeredPose,
  centerRelative,
  clampScale,
  fitScale,
  homePose,
  localToWorld,
  worldToLocal,
  zoomPoseAt,
  type CameraBand,
  type CameraMetrics,
} from "./camera-core";

interface CanvasCamera extends CameraMetrics {
  band: CameraBand;
}

interface DragRef {
  x: number;
  y: number;
  tx: number;
  ty: number;
  moved: boolean;
  hitId: string | null;
}

interface PinchRef {
  d0: number;
  midX: number;
  midY: number;
  tx0: number;
  ty0: number;
  k0: number;
}

interface CanvasStageProps {
  bus: ChartBus;
  payload: MapPayload;
  hiddenCls: ReadonlySet<number>;
  dustOff: boolean;
  worksOnly: boolean;
  names: boolean;
  zones: ZonesMode;
  lumen: boolean;
  nihilus: boolean;
  selectedWorld: FeaturedWorld | null;
  activeVoyage: ResolvedVoyage | null;
  voyageProgress: number | null;
  hiIds: ReadonlySet<string> | null;
  routeDim: boolean;
  condensed: boolean;
  reduce: boolean;
  magRef: RefObject<HTMLSpanElement | null>;
  onCondense: () => void;
  onPick: (worldId: string | null) => void;
}

export default function CanvasStage(props: CanvasStageProps) {
  const {
    bus,
    payload,
    hiddenCls,
    dustOff,
    worksOnly,
    names,
    zones,
    lumen,
    nihilus,
    selectedWorld,
    activeVoyage,
    voyageProgress,
    hiIds,
    routeDim,
    condensed,
    reduce,
    magRef,
    onCondense,
    onPick,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camera = useRef<CanvasCamera>({
    tx: 0,
    ty: 0,
    k: 1,
    k0: 1,
    vw: 1,
    vh: 1,
    ox: 0,
    oy: 0,
    band: "0",
  });
  const drag = useRef<DragRef | null>(null);
  const pinch = useRef<PinchRef | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const extraHitTargets = useRef<CanvasHitTarget[]>([]);
  const flight = useRef(0);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${activeVoyage?.id ?? "none"}:${voyageProgress ?? "ambient"}`;
  const routeKeyRef = useRef<string | null>(null);
  const routeStartedAt = useRef(0);

  const sceneRef = useRef<CanvasScene>({
    payload,
    hiddenCls,
    dustOff,
    worksOnly,
    names,
    zones,
    lumen,
    nihilus,
    selectedWorld,
    activeVoyage,
    voyageProgress,
    hiIds,
    routeDim,
    routeStartedAt: 0,
    reduce,
  });

  const onPickRef = useRef(onPick);
  const onCondenseRef = useRef(onCondense);
  const condensedRef = useRef(condensed);
  const reduceRef = useRef(reduce);
  const invalidateRef = useRef<(cameraFrame?: boolean) => void>(() => {});
  const applyRef = useRef<() => void>(() => {});
  const setFlightRef = useRef<(active: boolean) => void>(() => {});
  const measureRef = useRef<() => void>(() => {});

  useEffect(() => {
    onPickRef.current = onPick;
    onCondenseRef.current = onCondense;
    condensedRef.current = condensed;
    reduceRef.current = reduce;
  }, [condensed, onCondense, onPick, reduce]);

  // Sync every discrete scene change before the stage paints, then coalesce
  // it into the same rAF scheduler used by camera motion.
  useLayoutEffect(() => {
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      routeStartedAt.current = performance.now();
    }
    sceneRef.current = {
      payload,
      hiddenCls,
      dustOff,
      worksOnly,
      names,
      zones,
      lumen,
      nihilus,
      selectedWorld,
      activeVoyage,
      voyageProgress,
      hiIds,
      routeDim,
      routeStartedAt: routeStartedAt.current,
      reduce,
    };
    invalidateRef.current();
  }, [
    activeVoyage,
    dustOff,
    hiddenCls,
    hiIds,
    lumen,
    names,
    nihilus,
    payload,
    reduce,
    routeDim,
    selectedWorld,
    voyageProgress,
    worksOnly,
    zones,
    routeKey,
  ]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const c = camera.current;
    const fonts = resolveCanvasFonts();
    let fontsReady = false;
    let mounted = true;
    let pendingFrame = 0;
    let routePaintTimer: ReturnType<typeof setTimeout> | null = null;
    let emitOnPaint = false;
    let measured = false;
    let resizePending = false;
    let backingX = 1;
    let backingY = 1;
    let flightOn = false;
    let contextLost = false;
    document.body.classList.add("cg-canvas-renderer");

    const setFlight = (active: boolean) => {
      if (flightOn === active) return;
      flightOn = active;
      bus.emitFlightChange(active);
    };
    setFlightRef.current = setFlight;

    const updateBacking = () => {
      const scale = canvasBackingScale(c.vw, c.vh, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(c.vw * scale));
      const height = Math.max(1, Math.floor(c.vh * scale));
      if (canvas.width !== width || canvas.height !== height) {
        const widthChanged = canvas.width !== width;
        const heightChanged = canvas.height !== height;
        // When orientation changes both axes, shrink first. This keeps the
        // transient allocation below the larger of the old/new bitmaps.
        if (widthChanged && heightChanged && width * canvas.height > canvas.width * height) {
          canvas.height = height;
          canvas.width = width;
        } else {
          if (widthChanged) canvas.width = width;
          if (heightChanged) canvas.height = height;
        }
        canvas.dataset.backing = `${width}x${height}`;
      }
      backingX = width / c.vw;
      backingY = height / c.vh;
    };

    const schedulePaint = (cameraFrame = false) => {
      if (cameraFrame) emitOnPaint = true;
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame((now) => {
        pendingFrame = 0;
        if (contextLost) return;
        ctx.setTransform(backingX, 0, 0, backingY, 0, 0);
        ctx.fillStyle = CANVAS_VOID;
        ctx.globalAlpha = 1;
        ctx.fillRect(0, 0, c.vw, c.vh);
        const result = drawCanvasScene(
          ctx,
          c,
          c.band,
          sceneRef.current,
          { width: c.vw, height: c.vh },
          fonts,
          fontsReady,
          now,
        );
        extraHitTargets.current = result.hitTargets;
        if (emitOnPaint) {
          emitOnPaint = false;
          bus.emitFrame();
        }
        if (result.routeAnimating && routePaintTimer === null) {
          routePaintTimer = setTimeout(() => {
            routePaintTimer = null;
            schedulePaint();
          }, 1000 / 30);
        }
      });
    };
    invalidateRef.current = schedulePaint;

    const apply = () => {
      const band = cameraBand(c.k, c.k0);
      if (band !== c.band) {
        c.band = band;
        const mag = magRef.current;
        if (mag) {
          mag.classList.add("bump");
          if (bumpTimer.current) clearTimeout(bumpTimer.current);
          bumpTimer.current = setTimeout(() => mag.classList.remove("bump"), 700);
        }
      }
      if (magRef.current) magRef.current.textContent = `MAG ${(c.k / c.k0).toFixed(2)}×`;
      schedulePaint(true);
    };
    applyRef.current = apply;

    const measure = () => {
      if (pointers.current.size > 0) {
        resizePending = true;
        return;
      }
      const previous = measured ? centerRelative(c) : null;
      const rect = canvas.getBoundingClientRect();
      c.vw = rect.width || 1;
      c.vh = rect.height || 1;
      c.ox = rect.left;
      c.oy = rect.top;
      c.k0 = fitScale(c.vw, c.vh);
      updateBacking();
      if (previous) {
        c.k = clampScale(c.k0 * previous.kr, c.k0);
        Object.assign(c, centeredPose(c.vw, c.vh, previous.gx, previous.gy, c.k));
      } else {
        Object.assign(c, homePose(c.vw, c.vh, c.k0));
      }
      measured = true;
      resizePending = false;
      apply();
    };
    measureRef.current = () => {
      if (resizePending) measure();
    };

    const zoomAt = (sx: number, sy: number, factor: number) => {
      cancelAnimationFrame(flight.current);
      setFlight(false);
      const nextK = clampScale(c.k * factor, c.k0);
      Object.assign(c, zoomPoseAt(c, sx, sy, nextK));
      apply();
    };

    const flyTo = (gx: number, gy: number, targetK: number, ms?: number, dy = 0) => {
      const endK = clampScale(targetK, c.k0);
      if (reduceRef.current) {
        Object.assign(c, centeredPose(c.vw, c.vh, gx, gy, endK, dy));
        apply();
        return;
      }
      const start = { tx: c.tx, ty: c.ty, k: c.k };
      const end = centeredPose(c.vw, c.vh, gx, gy, endK, dy);
      const startedAt = performance.now();
      const duration = ms ?? 1000;
      cancelAnimationFrame(flight.current);
      setFlight(true);
      const step = (now: number) => {
        const p = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        c.tx = start.tx + (end.tx - start.tx) * eased;
        c.ty = start.ty + (end.ty - start.ty) * eased;
        c.k = start.k + (end.k - start.k) * eased;
        apply();
        if (p < 1) flight.current = requestAnimationFrame(step);
        else setFlight(false);
      };
      flight.current = requestAnimationFrame(step);
    };

    measure();
    const driver: CameraDriver = {
      zoomAtCenter: (factor) => zoomAt(c.vw / 2, c.vh / 2, factor),
      flyTo,
      home: (ms) => {
        if (ms && !reduceRef.current) flyTo(W / 2, H / 2, c.k0, ms);
        else {
          Object.assign(c, homePose(c.vw, c.vh, c.k0));
          apply();
        }
      },
      setCamRel: (gx, gy, kr) => {
        cancelAnimationFrame(flight.current);
        setFlight(false);
        c.k = clampScale(c.k0 * kr, c.k0);
        Object.assign(c, centeredPose(c.vw, c.vh, gx, gy, c.k));
        apply();
      },
      getCenterRel: () => centerRelative(c),
      worldToScreen: (gx, gy) => {
        const point = worldToLocal(c, gx, gy);
        return { x: c.ox + point.x, y: c.oy + point.y };
      },
      screenToWorld: (sx, sy) => localToWorld(c, sx - c.ox, sy - c.oy),
      getViewport: () => ({ vw: c.vw, vh: c.vh }),
      getK: () => c.k,
      getK0: () => c.k0,
    };
    bus.setDriver(driver);

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onCondenseRef.current();
      zoomAt(event.clientX - c.ox, event.clientY - c.oy, Math.exp(-event.deltaY * 0.0016));
    };
    const clearGesture = () => {
      pointers.current.clear();
      pinch.current = null;
      drag.current = null;
      canvas.classList.remove("dragging");
      if (resizePending) measure();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") clearGesture();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      canvas.dataset.context = "lost";
      cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
    };
    const onContextRestored = () => {
      contextLost = false;
      canvas.dataset.context = "restored";
      updateBacking();
      schedulePaint(true);
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("blur", clearGesture);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextlost", onContextLost);
    canvas.addEventListener("contextrestored", onContextRestored);

    void Promise.allSettled([
      document.fonts.ready,
      document.fonts.load(`400 16px ${fonts.display}`, "TERRA"),
      document.fonts.load(`italic 400 14.5px ${fonts.body}`, "Terra"),
      document.fonts.load(`400 10px ${fonts.mono}`, "IMPERIUM NIHILUS"),
    ]).then(() => {
      if (!mounted) return;
      fontsReady = true;
      schedulePaint();
    });

    return () => {
      mounted = false;
      document.body.classList.remove("cg-canvas-renderer");
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.removeEventListener("blur", clearGesture);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextlost", onContextLost);
      canvas.removeEventListener("contextrestored", onContextRestored);
      cancelAnimationFrame(pendingFrame);
      cancelAnimationFrame(flight.current);
      if (routePaintTimer) clearTimeout(routePaintTimer);
      if (bumpTimer.current) clearTimeout(bumpTimer.current);
      setFlight(false);
      if (bus.driver === driver) bus.setDriver(null);
      invalidateRef.current = () => {};
      applyRef.current = () => {};
      measureRef.current = () => {};
      // Release the large bitmap eagerly on route changes/navigation instead
      // of waiting for Android's canvas wrapper to be garbage-collected.
      canvas.width = 1;
      canvas.height = 1;
    };
  }, [bus, magRef]);

  const rebasePinch = () => {
    if (pointers.current.size !== 2) {
      pinch.current = null;
      return;
    }
    const iterator = pointers.current.values();
    const a = iterator.next().value;
    const b = iterator.next().value;
    if (!a || !b) return;
    const c = camera.current;
    pinch.current = {
      d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
      tx0: c.tx,
      ty0: c.ty,
      k0: c.k,
    };
    drag.current = null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const c = camera.current;
    if (!canvas) return;
    event.preventDefault();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const overtureUp = !condensedRef.current;
    onCondenseRef.current();
    cancelAnimationFrame(flight.current);
    setFlightRef.current(false);
    if (event.pointerType === "touch") canvas.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      const localX = event.clientX - c.ox;
      const localY = event.clientY - c.oy;
      drag.current = {
        x: event.clientX,
        y: event.clientY,
        tx: c.tx,
        ty: c.ty,
        moved: false,
        hitId: overtureUp
          ? null
          : pickSceneContact(sceneRef.current, c, extraHitTargets.current, localX, localY),
      };
      canvas.classList.add("dragging");
    } else if (pointers.current.size === 2) {
      rebasePinch();
    } else {
      pinch.current = null;
      drag.current = null;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const c = camera.current;
    if (!canvas) return;
    const sample = pointers.current.get(event.pointerId);
    if (sample) {
      sample.x = event.clientX;
      sample.y = event.clientY;
    }
    if (pointers.current.size > 2) return;
    if (pinch.current && pointers.current.size === 2) {
      const iterator = pointers.current.values();
      const a = iterator.next().value;
      const b = iterator.next().value;
      if (!a || !b) return;
      const start = pinch.current;
      const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const nextK = clampScale(start.k0 * (distance / start.d0), c.k0);
      const scale = nextK / start.k0;
      c.k = nextK;
      c.tx = midX - c.ox - (start.midX - c.ox - start.tx0) * scale;
      c.ty = midY - c.oy - (start.midY - c.oy - start.ty0) * scale;
      applyRef.current();
      return;
    }
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) current.moved = true;
    if (current.moved && !canvas.hasPointerCapture(event.pointerId)) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        /* the pointer has already left; pointerleave clears the gesture */
      }
    }
    c.tx = current.tx + dx;
    c.ty = current.ty + dy;
    applyRef.current();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 2) rebasePinch();
    else if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;
    canvas?.classList.remove("dragging");
    const current = drag.current;
    drag.current = null;
    if (current && !current.moved) onPickRef.current(current.hitId);
    measureRef.current();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 2) rebasePinch();
    else if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;
    drag.current = null;
    canvas?.classList.remove("dragging");
    measureRef.current();
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.hasPointerCapture(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 2) rebasePinch();
    else if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      canvas.classList.remove("dragging");
      measureRef.current();
    }
  };

  return (
    <div className="cg-stage cg-stage--canvas" data-map-renderer="canvas">
      <canvas
        ref={canvasRef}
        className="cg-map-canvas"
        role="presentation"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onLostPointerCapture={handlePointerLeave}
      />
    </div>
  );
}
