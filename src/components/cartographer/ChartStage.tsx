"use client";

/**
 * ChartStage — the <svg> chart with the imperative camera.
 *
 * Camera = {tx, ty, k} in refs; every gesture writes the world-<g> transform
 * and the `--cg-ik` counter-scale var directly in the same frame — 1054 pins
 * keep constant screen size without a single React re-render. Zoom bands
 * (label tiers, dust veil) gate purely via CSS on `data-band`; `data-band`
 * and `--cg-ik` are deliberately NOT React-managed so re-renders never
 * clobber them.
 */

import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";

import type { ChartBus } from "./chart-bus";
import { H, W } from "./chart-geometry";

interface CamRef {
  tx: number;
  ty: number;
  k: number;
  k0: number;
  vw: number;
  vh: number;
  ox: number;
  oy: number;
  band: string;
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

interface ChartStageProps {
  bus: ChartBus;
  lumen: boolean;
  nihilus: boolean;
  /** Force names: lifts the labels' band gates (CSS `svg.names`). */
  names: boolean;
  /** Zones off: fades out #cg-fields (CSS `svg.nozones`). */
  zonesOff: boolean;
  courseId: string | null;
  reduce: boolean;
  magRef: RefObject<HTMLSpanElement | null>;
  onCondense: () => void;
  /** Tap on a pin (worldId) or on empty chart (null). */
  onPick: (worldId: string | null) => void;
  children: ReactNode;
}

export default function ChartStage({
  bus,
  lumen,
  nihilus,
  names,
  zonesOff,
  courseId,
  reduce,
  magRef,
  onCondense,
  onPick,
  children,
}: ChartStageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const camGRef = useRef<SVGGElement | null>(null);
  const cam = useRef<CamRef>({ tx: 0, ty: 0, k: 1, k0: 1, vw: 1, vh: 1, ox: 0, oy: 0, band: "" });
  const drag = useRef<DragRef | null>(null);
  const pinch = useRef<PinchRef | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const flight = useRef(0);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyRef = useRef<() => void>(() => {});
  // Ends the flight flag from the React pointer handlers (grab during a fly).
  const setFlightRef = useRef<(v: boolean) => void>(() => {});

  // Latest-value refs so the imperative handlers never close over stale props.
  const onPickRef = useRef(onPick);
  const onCondenseRef = useRef(onCondense);
  const reduceRef = useRef(reduce);
  useEffect(() => {
    onPickRef.current = onPick;
    onCondenseRef.current = onCondense;
    reduceRef.current = reduce;
  }, [onPick, onCondense, reduce]);

  useEffect(() => {
    const svg = svgRef.current;
    const camG = camGRef.current;
    if (!svg || !camG) return;
    const c = cam.current;

    const clampK = (x: number) => Math.max(c.k0 * 0.75, Math.min(c.k0 * 9, x));

    let lastIk = "";
    const apply = () => {
      camG.setAttribute("transform", `translate(${c.tx} ${c.ty}) scale(${c.k})`);
      // Guards: DOMTokenList.add and setProperty rewrite the attribute even
      // when nothing changes — an every-frame same-value write invalidates
      // style recalc for the whole 2000-node svg subtree.
      const ik = String(1 / c.k);
      if (ik !== lastIk) {
        lastIk = ik;
        svg.style.setProperty("--cg-ik", ik);
      }
      // While the camera moves, pins sweep under the stationary cursor and
      // Chrome re-hit-tests :hover — a cascade of label/glyph transitions
      // (the "all labels flicker" bug). `.moving` gates those hover rules;
      // it decays shortly after the last frame.
      if (!svg.classList.contains("moving")) svg.classList.add("moving");
      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => svg.classList.remove("moving"), 160);
      // Four bands: 0 overview, 1 tier-1 names, 2 tier-2 names, 3 dust names
      // + full dust opacity. Thresholds roughly geometric (×1.8).
      const band =
        c.k < c.k0 * 1.7 ? "0" : c.k < c.k0 * 3.1 ? "1" : c.k < c.k0 * 5.6 ? "2" : "3";
      if (band !== c.band) {
        c.band = band;
        svg.setAttribute("data-band", band);
        const mag = magRef.current;
        if (mag) {
          mag.classList.add("bump");
          if (bumpTimer.current) clearTimeout(bumpTimer.current);
          bumpTimer.current = setTimeout(() => mag.classList.remove("bump"), 700);
        }
      }
      if (magRef.current) magRef.current.textContent = `MAG ${(c.k / c.k0).toFixed(2)}×`;
      bus.emitFrame();
    };
    applyRef.current = apply;

    const measure = () => {
      const rect = svg.getBoundingClientRect();
      c.vw = rect.width || 1;
      c.vh = rect.height || 1;
      c.ox = rect.left;
      c.oy = rect.top;
      c.k0 = Math.min(c.vw / W, c.vh / H) * 0.93;
    };

    const home = (ms?: number) => {
      if (ms && !reduceRef.current) {
        flyTo(W / 2, H / 2, c.k0, ms);
        return;
      }
      c.k = c.k0;
      c.tx = (c.vw - W * c.k) / 2;
      c.ty = (c.vh - H * c.k) / 2;
      apply();
    };

    const zoomAt = (sx: number, sy: number, factor: number) => {
      cancelAnimationFrame(flight.current);
      setFlightRef.current(false);
      const nk = clampK(c.k * factor);
      c.tx = sx - ((sx - c.tx) * nk) / c.k;
      c.ty = sy - ((sy - c.ty) * nk) / c.k;
      c.k = nk;
      apply();
    };

    /* Flight flag → bus: the world panel fades out for the duration of an
       eased flight (it would otherwise teleport to the new pin and race
       across the chart — the visible "flicker" on planet→planet clicks). */
    let flightOn = false;
    const setFlight = (v: boolean) => {
      if (flightOn === v) return;
      flightOn = v;
      bus.emitFlightChange(v);
    };

    const flyTo = (gx: number, gy: number, kT: number, ms?: number) => {
      const eK = clampK(kT);
      if (reduceRef.current) {
        c.k = eK;
        c.tx = c.vw / 2 - gx * eK;
        c.ty = c.vh / 2 - gy * eK;
        apply();
        return;
      }
      const st = { tx: c.tx, ty: c.ty, k: c.k };
      const e = { tx: c.vw / 2 - gx * eK, ty: c.vh / 2 - gy * eK, k: eK };
      const t0 = performance.now();
      const dur = ms ?? 1000;
      cancelAnimationFrame(flight.current);
      setFlight(true);
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const u = 1 - Math.pow(1 - p, 3);
        c.tx = st.tx + (e.tx - st.tx) * u;
        c.ty = st.ty + (e.ty - st.ty) * u;
        c.k = st.k + (e.k - st.k) * u;
        apply();
        if (p < 1) flight.current = requestAnimationFrame(step);
        else setFlight(false);
      };
      flight.current = requestAnimationFrame(step);
    };
    setFlightRef.current = setFlight;

    measure();
    home();

    bus.setDriver({
      zoomAtCenter: (f) => zoomAt(c.vw / 2, c.vh / 2, f),
      flyTo,
      home,
      setCamRel: (gx, gy, kr) => {
        cancelAnimationFrame(flight.current);
        setFlightRef.current(false);
        c.k = clampK(c.k0 * kr);
        c.tx = c.vw / 2 - gx * c.k;
        c.ty = c.vh / 2 - gy * c.k;
        apply();
      },
      getCenterRel: () => ({
        gx: (c.vw / 2 - c.tx) / c.k,
        gy: (c.vh / 2 - c.ty) / c.k,
        kr: c.k / c.k0,
      }),
      worldToScreen: (gx, gy) => ({ x: c.ox + c.tx + gx * c.k, y: c.oy + c.ty + gy * c.k }),
      screenToWorld: (sx, sy) => ({ gx: (sx - c.ox - c.tx) / c.k, gy: (sy - c.oy - c.ty) / c.k }),
      getViewport: () => ({ vw: c.vw, vh: c.vh }),
      getK: () => c.k,
      getK0: () => c.k0,
    });

    const onResize = () => {
      measure();
      apply();
    };
    window.addEventListener("resize", onResize);

    // Non-passive wheel (React's synthetic wheel can't preventDefault).
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onCondenseRef.current();
      zoomAt(e.clientX - c.ox, e.clientY - c.oy, Math.exp(-e.deltaY * 0.0016));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("resize", onResize);
      svg.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(flight.current);
      if (bumpTimer.current) clearTimeout(bumpTimer.current);
      if (moveTimer.current) clearTimeout(moveTimer.current);
      bus.setDriver(null);
    };
  }, [bus, magRef]);

  /* Pointer gestures: pan, tap-pick, two-finger pinch */

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const c = cam.current;
    if (!svg) return;
    // No native drag semantics on the chart: prevents text selection from
    // ever starting on a pan (SVG labels would get marked, screenshot bug).
    // Focus doesn't move either, so blur the seek field explicitly.
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onCondenseRef.current();
    cancelAnimationFrame(flight.current);
    // Mouse/pen: capture only once a real drag starts (pointermove threshold).
    // setPointerCapture strips `:hover` from the pin under the cursor — on a
    // plain click that fired the label/glyph hover transitions twice (the
    // "label flickers on planet click" bug). Touch has no hover: capture now
    // so pans/pinches survive crossing the HTML overlays.
    if (e.pointerType === "touch") svg.setPointerCapture(e.pointerId);
    setFlightRef.current(false);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      // Remember the hit NOW: with pointer capture, pointerup retargets to
      // the svg and never reports the pin.
      const target = e.target as Element;
      const hit = typeof target.closest === "function" ? target.closest("[data-pin]") : null;
      drag.current = {
        x: e.clientX,
        y: e.clientY,
        tx: c.tx,
        ty: c.ty,
        moved: false,
        hitId: hit ? hit.getAttribute("data-pin") : null,
      };
      svg.classList.add("dragging");
    } else if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      pinch.current = {
        d0: Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1,
        midX: (p1.x + p2.x) / 2,
        midY: (p1.y + p2.y) / 2,
        tx0: c.tx,
        ty0: c.ty,
        k0: c.k,
      };
      drag.current = null;
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const camG = camGRef.current;
    const c = cam.current;
    if (!svg || !camG) return;

    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pinch.current && pointers.current.size >= 2) {
      const [p1, p2] = [...pointers.current.values()];
      const pz = pinch.current;
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const nk = Math.max(c.k0 * 0.75, Math.min(c.k0 * 9, pz.k0 * (d / pz.d0)));
      const scale = nk / pz.k0;
      c.k = nk;
      c.tx = midX - c.ox - (pz.midX - c.ox - pz.tx0) * scale;
      c.ty = midY - c.oy - (pz.midY - c.oy - pz.ty0) * scale;
      applyRef.current();
      return;
    }

    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    // Deferred capture (see handlePointerDown): once this is a drag, the
    // pointer must keep panning across the HTML overlays and outside the
    // window.
    if (d.moved && !svg.hasPointerCapture(e.pointerId)) {
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone — the leave handler cleans up */
      }
    }
    c.tx = d.tx + dx;
    c.ty = d.ty + dy;
    applyRef.current();
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;
    // contains-guard: classList.remove rewrites the attribute even when the
    // token is absent — a same-value write recalcs the whole svg subtree.
    if (svg && svg.classList.contains("dragging")) svg.classList.remove("dragging");
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) onPickRef.current(d.hitId);
  };

  /* Uncaptured pointer (mouse press below the drag threshold) slides onto an
     overlay or out of the window: the up would never reach the svg — drop the
     press so no stale drag/pinch state survives. */
  const handlePointerLeave = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || svg.hasPointerCapture(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      if (svg.classList.contains("dragging")) svg.classList.remove("dragging");
    }
  };

  return (
    <div className="cg-stage">
      <svg
        ref={svgRef}
        className={`cg-chart${lumen ? " lumen" : ""}${nihilus ? " nihilus" : ""}${names ? " names" : ""}${zonesOff ? " nozones" : ""}`}
        data-route={courseId ?? undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        role="presentation"
      >
        <g ref={camGRef}>{children}</g>
      </svg>
    </div>
  );
}
