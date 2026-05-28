"use client";

// Top-level container — pan/zoom state machine, dive transition, header,
// back-button, zoom controls, HUD. Mounts the SVG disc inside a wrapper
// that resizes (NOT CSS-scales) so the SVG re-rasterizes crisp at every
// zoom level. Pointer events don't use setPointerCapture so clicks pass
// through to the wedge / world children.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { polar, svgToPolar } from "@/lib/galaxy/coords";
import { getLiveSegments } from "@/lib/galaxy/data";
import { getTheme } from "@/lib/galaxy/themes";
import type { GalaxyView, Polar, SegmentumId } from "@/lib/galaxy/types";

import { useGalaxy, useGalaxyActions, useGalaxyDispatch } from "./context";
import AddElementPanel from "./editor/AddElementPanel";
import CoordReadout from "./editor/CoordReadout";
import EditOverlay from "./editor/EditOverlay";
import EditPanel from "./editor/EditPanel";
import PlacementCursor from "./editor/PlacementCursor";
import CornerOrnament from "./disc/CornerOrnament";
import GalacticDisc from "./disc/GalacticDisc";
import HUD from "./disc/HUD";
import LandmarkLabels from "./disc/LandmarkLabels";
import ParallaxPlanets from "./disc/ParallaxPlanets";
import SegmentumDetail from "./disc/SegmentumDetail";
import SegmentumLabels from "./disc/SegmentumLabels";
import SegmentumWorldLabels from "./disc/SegmentumWorldLabels";
import { FlatMotes, StarField } from "./disc/Starfields";

interface ViewportSize {
  w: number;
  h: number;
}

interface DragState {
  active: boolean;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  moved: number;
}

// Landing-zoom targets — kept light so the segmentum sits in space with
// surrounding context instead of filling the screen. Combined with the dive
// FLIP cap of 1.42 (≈0.7× start scale, → 1.0× target), the perceived zoom-in
// magnitude is identical across all segmenta.
const SEG_DIVE: Record<SegmentumId, { r: number; a: number; scale: number }> = {
  solar: { r: 0, a: 0, scale: 2.5 },
  obscurus: { r: 0.55, a: -22.5, scale: 1.8 },
  ultima: { r: 0.55, a: 90, scale: 1.8 },
  tempestus: { r: 0.55, a: 185, scale: 1.8 },
  pacificus: { r: 0.55, a: 252.5, scale: 1.8 },
};

function segmentumDisplayName(view: GalaxyView, segments: ReturnType<typeof getLiveSegments>): string {
  if (view === "galaxy") return "MILKY WAY · M42";
  const seg = segments.find((s) => s.id === view);
  return (seg?.name || "SEGMENTUM").toUpperCase();
}

// Swatch colors for the PlacementCursor — kept in sync with the canonical
// ELEMENT_TYPES table inside AddElementPanel. Centralised here purely so the
// hologram doesn't have to pull in the wizard's internals just for a hex.
function addModePreviewColor(typeId: string): string {
  switch (typeId) {
    case "planet-imperium":
      return "#f0b248";
    case "planet-chaos":
      return "#d04428";
    case "planet-xenos":
      return "#5cd09a";
    case "planet-necron":
      return "#7ad8a4";
    case "planet-tyranid":
      return "#c97ad8";
    case "zone-warp":
      return "#ff6644";
    case "zone-necron":
      return "#5cd09a";
    case "zone-tyranid":
      return "#c97ad8";
    default:
      return "#ffaa44";
  }
}

// Lightweight atmospheric overlay that pulses in/out over the dive duration.
// Peaks mid-animation (≈t=245–455 ms of a 700 ms dive) — exactly the window
// where the FLIP-start frame paints the new segmentum content at ~0.7× scale
// before CSS-transform ramps it to 1.0×. Outside that window the curtain is
// invisible, so the user sees the galactic before-state and the landed
// segmentum after-state unobstructed. No text, no DecodedText, no settle —
// pure radial vignette tinted by theme.bg0.
function DiveAtmosphereCurtain({ theme }: { theme: ReturnType<typeof getTheme> }) {
  return (
    <div
      className="map-dive-atmosphere"
      aria-hidden
      style={{
        "--map-atmosphere-bg": theme.bg0,
        "--map-atmosphere-accent": theme.primary,
      } as CSSProperties}
    />
  );
}

export default function GalaxyHologram() {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const { dive, surface } = useGalaxyActions();
  const t = getTheme(state.tweaks.theme);

  // Live segments derived from tweaks. Memoization happens implicitly via
  // the disc's own useMemo keyed on segment dimensions.
  const segments = getLiveSegments(state.tweaks);

  const [size, setSize] = useState<ViewportSize>({ w: 1600, h: 1000 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const dragRef = useRef<DragState>({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: 0 });
  const discWrapperRef = useRef<HTMLDivElement | null>(null);

  // While AddMode is in `place` phase the disc consumes the next click as a
  // polar coord and dispatches it as a new control point. Single-point types
  // auto-advance to review so the user lands straight on Save.
  const addModeActive = state.tweaks.addMode && state.addMode.phase === "place";
  const captureAddModeClick = (clientX: number, clientY: number) => {
    const el = discWrapperRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const [r, a] = svgToPolar(x, y);
    const pt: Polar = [r, a];
    const isSinglePoint =
      state.addMode.typeId.startsWith("planet-") || state.addMode.typeId === "zone-warp";
    if (isSinglePoint) {
      dispatch({ type: "add_mode_set_pts", pts: [pt] });
      // Tiny delay so the captured pt visually registers under the cursor
      // before the panel swaps to review.
      setTimeout(() => dispatch({ type: "add_mode_set_phase", phase: "review" }), 50);
    } else {
      dispatch({ type: "add_mode_push_pt", pt });
    }
    return true;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const tgt = e.target as Element | null;
    if (tgt && tgt.closest("button, a, [data-no-drag]")) return;
    dragRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      ox: state.pan.x,
      oy: state.pan.y,
      moved: 0,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Track cursor → polar so AddMode and edit overlays can render a live
    // crosshair / coord readout regardless of which surface intercepts the
    // events. Only sample when an editor surface is actually mounted.
    if (addModeActive) {
      const el = discWrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          const [r, a] = svgToPolar(x, y);
          dispatch({ type: "set_cursor_polar", coords: { r, a } });
        }
      }
    }
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
    if (d.moved > 4) {
      dispatch({ type: "set_pan", pan: { x: d.ox + dx, y: d.oy + dy } });
    }
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Treat as a drag (kill the click) if the pointer moved a non-trivial
    // distance, regardless of mode.
    if (dragRef.current.moved > 6) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.moved = 0;
      return;
    }
    if (!addModeActive) return;
    const tgt = e.target as Element | null;
    // Don't capture clicks that originated inside a floating panel / button.
    if (tgt && tgt.closest("[data-no-drag], button, a, input, select")) return;
    if (captureAddModeClick(e.clientX, e.clientY)) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dir = e.deltaY < 0 ? 1 : -1;
    dispatch({ type: "set_zoom", userZoom: state.userZoom * (1 + dir * 0.10) });
  };
  const zoomBy = (factor: number) => {
    dispatch({ type: "set_zoom", userZoom: state.userZoom * factor });
  };
  const recenter = () => {
    dispatch({ type: "set_pan", pan: { x: 0, y: 0 } });
    dispatch({ type: "set_zoom", userZoom: 1 });
  };

  const isDived = state.view !== "galaxy";
  const divedSeg: SegmentumId | null = isDived ? (state.view as SegmentumId) : null;

  // Both dive and surface flip state.view atomically at dispatch time, so
  // divedSeg points at the right target the instant a transition starts. The
  // dived-detail components mount with the view-swap; their visual size is
  // carried by the same CSS-transform tween that drives the disc, so they
  // grow/shrink in sync with the surrounding wedges and landmarks.
  const detailVisible = isDived;
  // SegmentumDetail (SVG-Subsektor-Layer) skaliert korrekt mit der FLIP-
  // Math und bleibt durchgehend sichtbar. SegmentumWorldLabels sind HTML-
  // Overlay (fontSize in CSS-Pixeln) und werden vom Parent-CSS-Transform
  // mitskaliert; an finish_transition würde der Transform zurückspringen
  // und die Labels um Faktor 1/baseScale shrinken. Wir mounten sie deshalb
  // bereits ab begin_dive (für sauberes Fade-In), halten den Wrapper aber
  // auf opacity 0 solange state.transitioning läuft. Nach dem Übergang
  // fadet der Wrapper via CSS-Transition (340 ms) sanft ein — Labels
  // erscheinen am finalen Size, ohne sichtbaren Skalen-Snap.
  const detailSeg = divedSeg;

  // Anims gate: kill the radar sweep / auspex ping / holo flicker the moment
  // a dive or surface starts, and keep them off while inside a segmentum.
  const animsOn = !isDived && !state.transitioning;

  // Single coordinated gate for both transition windows: dive and surface
  // now have identical lifetimes (no settle window, no preview phase). The
  // <html> attributes are set during state.transitioning and cleared the
  // moment finish_transition fires.
  //
  //   data-map-transitioning — brightness-affecting CSS rules (site-bg photo
  //     dim, grain blend, scanline blend, holo-flicker opacity) bind here.
  //   data-map-quiet — performance-affecting rules (backdrop-filter on the
  //     bottom-console / media player, media-player wave/bars) bind here.
  useLayoutEffect(() => {
    if (!state.transitioning) return;
    const root = document.documentElement;
    root.setAttribute("data-map-transitioning", "true");
    root.setAttribute("data-map-quiet", "true");
    return () => {
      root.removeAttribute("data-map-transitioning");
      root.removeAttribute("data-map-quiet");
    };
  }, [state.transitioning]);

  const segDive = divedSeg ? SEG_DIVE[divedSeg] : null;
  const segCenter = segDive ? polar(segDive.r, segDive.a) : [50, 50];
  const dx = 50 - segCenter[0];
  const dy = 50 - segCenter[1];
  const diveScale = segDive ? segDive.scale : 1.0;
  const baseScale = diveScale * state.userZoom;
  const tx = isDived ? dx : 0;
  const ty = isDived ? dy : 0;
  const baseDiscSize = Math.min(size.w, size.h) * 1.15;
  // During an active transition we keep the inner element at base size and
  // let the CSS transform carry the full scale (cheap compositor work). Once
  // the transition settles, the element resizes to baseDiscSize * baseScale
  // and displayScale snaps to 1.0 — the SVG re-rasterises crisp at full size
  // exactly once, and the handoff is visually invisible because
  // discSize * displayScale stays constant across the swap.
  const layoutScale = state.transitioning && isDived ? 1 : baseScale;
  const targetDisplayScale = baseScale / layoutScale;
  const targetDisplayTx = tx * targetDisplayScale;
  const targetDisplayTy = ty * targetDisplayScale;
  // Pixel-snap so wheel-zoom doesn't push the disc onto sub-pixel margins.
  const discSize = Math.round(baseDiscSize * layoutScale);

  // FLIP transform machinery — surface and dive both animate a single CSS
  // transform on the disc wrapper over a bounded delta:
  //
  //   Surface (zoom-out): pre-state visual was {scale=1.0, tx=dx} on a disc
  //     sized baseDiscSize*1.8. At begin_surface the view swaps to galaxy
  //     (isDived=false → discSize shrinks to baseDiscSize). FLIP-init snaps
  //     displayScale to a capped inverse (≤1.42) so the visible disc shrinks
  //     by ~21% in one frame, then CSS animates it back to 1.0 over 460ms.
  //     The cap intentionally trades a small initial discontinuity for a
  //     small compositor layer.
  //
  //   Dive (zoom-in): pre-state visual was {scale=1.0, tx=0} on a disc sized
  //     baseDiscSize. At begin_dive the view swaps to segId; discSize stays
  //     at baseDiscSize (because layoutScale=1 during transition && dived).
  //     FLIP-init leaves displayScale/Tx/Ty at their pre-state values so the
  //     first painted frame is *visually identical* to pre-dive — no jump.
  //     CSS then animates from (1.0, 0, 0) to (baseScale, tx*baseScale,
  //     ty*baseScale) over 700ms, growing the disc smoothly into the
  //     segmentum. At finish_transition discSize resizes to baseDiscSize*
  //     baseScale and displayScale snaps to 1.0 — the SVG re-rasterises
  //     crisp once, and visible disc size stays constant across the swap.
  const wasTransitioningRef = useRef(false);
  const prevBaseScaleRef = useRef(baseScale);
  const prevTxRef = useRef(tx);
  const prevTyRef = useRef(ty);
  const [displayScale, setDisplayScale] = useState(1);
  const [displayTx, setDisplayTx] = useState(tx);
  const [displayTy, setDisplayTy] = useState(ty);
  const [flipPending, setFlipPending] = useState(false);

  useLayoutEffect(() => {
    const wasTransitioning = wasTransitioningRef.current;
    const prevBaseScale = prevBaseScaleRef.current;
    const prevTx = prevTxRef.current;
    const prevTy = prevTyRef.current;

    wasTransitioningRef.current = state.transitioning;
    prevBaseScaleRef.current = baseScale;
    prevTxRef.current = tx;
    prevTyRef.current = ty;

    if (state.transitioning && !wasTransitioning) {
      // Dive intentionally falls through without mutating displayScale/Tx/Ty:
      // the current state values already represent the pre-dive visual
      // (scale=1.0, tx=0, ty=0). The RAF below will set them to the target
      // and CSS animates the full delta from pre-dive to dived.
      //
      // Surface snaps displayScale to a capped inverse so the visible disc
      // shrinks by ~21 % in one frame, then CSS animates back to 1.0. The
      // cap trades a small initial discontinuity for a small compositor
      // layer — animating the full 3x/5x inverse would create a huge
      // viewport-sized layer that flickered on every interpolated frame.
      if (state.transitionKind === "surface") {
        const surfacing = prevBaseScale > baseScale;
        if (surfacing) {
          const capped = Math.min(prevBaseScale / Math.max(1, baseScale), 1.42);
          setDisplayScale(capped);
          setDisplayTx(prevTx * capped);
          setDisplayTy(prevTy * capped);
        } else {
          const prevDisplayScale = prevBaseScale / layoutScale;
          setDisplayScale(prevDisplayScale);
          setDisplayTx(prevTx * prevDisplayScale);
          setDisplayTy(prevTy * prevDisplayScale);
        }
      }
      setFlipPending(true);
    } else if (!state.transitioning) {
      // Outside transition: track post-state directly so wheel-zoom etc. just
      // snap into place.
      setDisplayScale(targetDisplayScale);
      setDisplayTx(targetDisplayTx);
      setDisplayTy(targetDisplayTy);
      setFlipPending(false);
    }
  }, [
    state.transitioning,
    baseScale,
    layoutScale,
    targetDisplayScale,
    targetDisplayTx,
    targetDisplayTy,
    state.transitionKind,
    tx,
    ty,
  ]);

  // One frame after the FLIP-initial paint, hand the transform to CSS so the
  // tween animates it from the FLIP-init position (surface: capped inverse;
  // dive: pre-state values) to the post-state target.
  useEffect(() => {
    if (!flipPending) return;
    const raf = requestAnimationFrame(() => {
      setDisplayScale(targetDisplayScale);
      setDisplayTx(targetDisplayTx);
      setDisplayTy(targetDisplayTy);
      setFlipPending(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [flipPending, targetDisplayScale, targetDisplayTx, targetDisplayTy]);

  const transitionStyle = flipPending
    ? "none" // FLIP-initial snap
    : state.transitionKind === "dive" && state.transitioning
      ? "transform 700ms cubic-bezier(.22, 1, .36, 1)"
      : state.transitionKind === "surface" && state.transitioning
        ? "transform 460ms cubic-bezier(.5, .05, .25, 1)"
        : "none"; // wheel-zoom snap

  const titleRight = segmentumDisplayName(state.view, segments);

  return (
    <div
      className="map-route__hologram"
      data-anims={animsOn ? "on" : "off"}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      style={{
        // Container-Background bewusst transparent: die SiteBackground-Schicht
        // ('cartog-holo' Variant + body:has-Verlauf) stellt das Foto bereit;
        // der Theme-Vignette-Layer darunter liefert das Dimming, das den
        // Hologramm-Disc gegen die Plotraum-Atmosphäre absetzt.
        position: "fixed",
        inset: 0,
        background: "transparent",
        overflow: "hidden",
        fontFamily: t.fontBody,
        color: t.primary,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <StarField
        theme={t}
        count={320}
        layer={0}
        parallax={{ x: state.pan.x * 0.04, y: state.pan.y * 0.04 }}
        suspended={state.transitioning}
      />
      <ParallaxPlanets pan={state.pan} theme={t} suspended={state.transitioning} />
      <StarField
        theme={t}
        count={220}
        layer={1}
        parallax={{ x: state.pan.x * 0.14, y: state.pan.y * 0.14 }}
        suspended={state.transitioning}
      />
      <StarField
        theme={t}
        count={120}
        layer={2}
        parallax={{ x: state.pan.x * 0.40, y: state.pan.y * 0.40 }}
        suspended={state.transitioning}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: t.vignette,
          opacity: 1,
          transition: "opacity 120ms linear",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${state.pan.x}px, ${state.pan.y}px)`,
          willChange: "transform",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            ref={discWrapperRef}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: discSize,
              height: discSize,
              marginLeft: -discSize / 2,
              marginTop: -discSize / 2,
              transform: `translate(${displayTx}%, ${displayTy}%) scale(${displayScale})`,
              transition: transitionStyle,
              transformOrigin: "center center",
              // Only promote to its own compositor layer while the dive/surface
              // tween is actually running, and only for the property we actually
              // animate now (transform). Permanent will-change costs memory.
              willChange: state.transitioning ? "transform" : "auto",
            }}
          >
            <FlatMotes theme={t} count={50} suspended={state.transitioning} />
            <div style={{ position: "absolute", inset: 0 }}>
              <GalacticDisc
                theme={t}
                segments={segments}
                data={state.data}
                factionFilter={state.tweaks.factionFilter}
                riftPattern={state.tweaks.riftPattern}
                astronomican={state.tweaks.astronomican}
                onDive={(segId) => dive(segId)}
                dived={isDived}
                divedSeg={divedSeg}
                hoveredSeg={state.hoveredSeg}
                setHoveredSeg={(id) => dispatch({ type: "set_hovered_seg", id })}
                hoveredLandmark={state.hoveredLandmark}
                setHoveredLandmark={(id) => dispatch({ type: "set_hovered_landmark", id })}
                userZoom={state.userZoom}
                pan={state.pan}
                discSize={discSize}
                starSeed={4242}
                animsOn={animsOn}
              />

              <SegmentumLabels
                theme={t}
                segments={segments}
                dived={isDived}
                divedSeg={divedSeg}
                hoveredSeg={state.hoveredSeg}
                setHoveredSeg={(id) => dispatch({ type: "set_hovered_seg", id })}
                onDive={(id) => dive(id)}
              />

              <LandmarkLabels
                theme={t}
                landmarks={state.data.landmarks}
                nebulae={state.data.nebulae}
                segments={segments}
                factionFilter={state.tweaks.factionFilter}
                dived={isDived}
                divedSeg={divedSeg}
                hoveredLandmark={state.hoveredLandmark}
                setHoveredLandmark={(id) => dispatch({ type: "set_hovered_landmark", id })}
              />

              <SegmentumDetail
                theme={t}
                visible={detailVisible}
                segId={detailSeg}
                factionFilter={state.tweaks.factionFilter}
                onWorldClick={(w) => dispatch({ type: "select_world", worldId: w.id })}
                selectedId={state.selectedWorldId}
                hoveredId={state.hoveredWorld}
                setHoveredId={(id) => dispatch({ type: "set_hovered_world", id })}
              />
              <SegmentumWorldLabels
                theme={t}
                visible={detailVisible}
                dimmed={state.transitioning}
                segId={detailSeg}
                factionFilter={state.tweaks.factionFilter}
                onWorldClick={(w) => dispatch({ type: "select_world", worldId: w.id })}
                selectedId={state.selectedWorldId}
                hoveredId={state.hoveredWorld}
                setHoveredId={(id) => dispatch({ type: "set_hovered_world", id })}
              />

              <EditOverlay />

              <PlacementCursor
                enabled={addModeActive}
                cursorPolar={state.cursorPolar}
                pts={state.addMode.pts}
                color={addModePreviewColor(state.addMode.typeId)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scanlines + holo-flicker carry mix-blend-modes (screen / overlay).
          Round 7 (2026-05-28): die Blend-Modes bleiben konstant. Scanlines
          bleiben durchgehend bei voller Opacity sichtbar — der frühere
          Opacity-Gate (0 während Transition, fade-in danach) hat sich für
          den User als „horizontale Linien laden nach" gelesen. Holo-Flicker
          fadet weiterhin via .map-holo-flicker[data-anims="off"] aus
          globals.css (1 s ease-in), das ist subtiler und stört nicht.
          Vorher: Blend-Mode-Snap normal↔screen/overlay an jedem
          state.transitioning-Wechsel erzeugte den „filters werden wieder
          angewendet"-Cut — mix-blend-mode ist nicht transitionable und
          springt instant. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, ${t.primary}${Math.floor(
            t.scanlineOpacity * 255,
          )
            .toString(16)
            .padStart(2, "0")} 3px, transparent 3.5px)`,
          mixBlendMode: "screen",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${t.bg0}90 100%)`,
          opacity: 1,
        }}
      />
      <div
        className="map-holo-flicker"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: t.primary,
          mixBlendMode: "overlay",
        }}
      />

      {state.transitionKind === "dive" && state.transitioning && (
        <DiveAtmosphereCurtain theme={t} />
      )}

      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <CornerOrnament theme={t} pos="tl" />
      </div>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <CornerOrnament theme={t} pos="tr" />
      </div>
      <div style={{ position: "absolute", bottom: 20, left: 20 }}>
        <CornerOrnament theme={t} pos="bl" />
      </div>
      <div style={{ position: "absolute", bottom: 20, right: 20 }}>
        <CornerOrnament theme={t} pos="br" />
      </div>

      {/* Top-left logo + subtitle removed 2026-05-27 — overlapped the disc;
          only the right-side segmentum title remains. */}
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 100,
          right: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 18,
            letterSpacing: "0.36em",
            color: t.accent,
            textShadow: `0 0 14px ${t.primary}`,
            opacity: 0.92,
            textAlign: "right",
          }}
        >
          {titleRight}
        </div>
      </div>

      {isDived && (
        <button
          onClick={() => surface()}
          data-no-drag
          style={{
            position: "absolute",
            top: 144,
            left: 100,
            background: `linear-gradient(180deg, ${t.bg1}cc, ${t.bg0}ee)`,
            color: t.accent,
            border: `1px solid ${t.stroke}`,
            fontFamily: t.fontDisplay,
            fontSize: 11,
            letterSpacing: "0.32em",
            padding: "12px 22px 12px 18px",
            textTransform: "uppercase",
            cursor: "pointer",
            textShadow: `0 0 8px ${t.primary}`,
            boxShadow: `0 0 24px ${t.primarySoft}, inset 0 1px 0 ${t.strokeFaint}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "auto",
            zIndex: 4,
            animation: "mapFadeInUp 0.5s cubic-bezier(.2,.7,.2,1) both",
            animationDelay: "0.5s",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, marginBottom: 1 }}>◂</span>
          Back to Galactic View
        </button>
      )}

      <div
        data-no-drag
        style={{
          position: "fixed",
          left: 100,
          bottom: 90,
          width: 280,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 4,
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 4, pointerEvents: "auto" }}>
          {[
            { lbl: "+", fn: () => zoomBy(1.25), title: "Zoom in" },
            { lbl: "−", fn: () => zoomBy(0.8), title: "Zoom out" },
            { lbl: "◉", fn: recenter, title: "Recenter" },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.fn}
              title={b.title}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.borderBottomColor = t.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.72";
                e.currentTarget.style.borderBottomColor = t.stroke;
              }}
              style={{
                minWidth: 26,
                height: 26,
                padding: "0 8px 1px 8px",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${t.stroke}`,
                color: t.primary,
                fontFamily: t.fontMono,
                fontSize: 14,
                lineHeight: 1,
                cursor: "pointer",
                opacity: 0.72,
                transition: "opacity .25s ease, border-color .25s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.lbl}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 96,
          right: 100,
          fontFamily: t.fontMono,
          fontSize: 10,
          letterSpacing: "0.24em",
          color: t.primary,
          opacity: 0.65,
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        ZOOM · {Math.round(baseScale * 100)}%
        <div style={{ marginTop: 4, width: 120, height: 2, background: t.strokeFaint, marginLeft: "auto" }}>
          <div
            style={{
              width: `${Math.min(100, ((baseScale - 0.5) / 11.5) * 100)}%`,
              height: "100%",
              background: t.primary,
              boxShadow: `0 0 6px ${t.primary}`,
              transition: "width 0.2s",
            }}
          />
        </div>
      </div>

      {/* HUD strip moved to the right column 2026-05-27 — the bottom-left
          corner is reserved for the global MediaPlayer. HUD stacks above the
          segmentum hint, both right-aligned. */}
      <div
        style={{
          position: "absolute",
          bottom: 38,
          right: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <HUD theme={t} view={state.view} dived={isDived} />
        <div
          style={{
            fontFamily: t.fontMono,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: t.primary,
            opacity: 0.7,
            textTransform: "uppercase",
          }}
        >
          {addModeActive
            ? "◉ Click the map to drop a point · drag to pan"
            : isDived
              ? "◉ Click any world for codex · drag to pan"
              : "▸ Click any SEGMENTUM · drag to pan · scroll ⇕ zoom"}
        </div>
      </div>

      <CoordReadout
        theme={t}
        coords={state.cursorPolar}
        visible={state.tweaks.editWarps || addModeActive}
      />

      <EditPanel theme={t} />
      <AddElementPanel theme={t} />
    </div>
  );
}
