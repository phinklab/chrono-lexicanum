"use client";

/**
 * VoyageTour — the guided playback of a Great Journey: one bottom-docked
 * card on BOTH breakpoints (the mobile dock grammar promoted to desktop).
 *
 * step −1 is the overture (title card: one "Begin journey" action — the old
 * "Skip tour" read as an unwanted autoplay and went 2026-07-13; ✕ leaves the
 * journey); steps 0…n−1 fly the camera station to station while RoutesLayer
 * draws the arriving leg; the last station offers "Show the full route",
 * which hands over to the free-explore tableau (CourseCards + fully drawn
 * route).
 *
 * The camera zoom adapts to leg length (short hops magnify, galaxy-spanning
 * reunions pull back) and the chart stays freely pannable throughout — Next
 * simply re-flies. ArrowRight/ArrowLeft page the tour — window-bound so the
 * arrows work without focusing the card, but behind the S9 target guard:
 * fields, sliders and the seek combobox keep their own arrows. Escape is
 * handled by the root (popup → tour precedence). Mount keyed by voyage id
 * (parent) — switching journeys restarts the tour.
 */

import { useCallback, useEffect, useRef } from "react";

import {
  fitVoyageBounds,
  resolvedVoyageArmBounds,
  resolvedVoyageBounds,
  type ResolvedVoyage,
  type ResolvedVoyageArm,
  type ResolvedVoyageArmTarget,
} from "@/lib/map/voyages";
import type { ChartBus } from "./chart-bus";
import StrategicReadout from "./StrategicReadout";

interface VoyageTourProps {
  resolved: ResolvedVoyage;
  bus: ChartBus;
  reduce: boolean;
  /** World popup open — the card steps aside and returns when it closes. */
  suppressed: boolean;
  /** Mobile sheet open (modal) — the card leaves the AT tree meanwhile. */
  muted?: boolean;
  /** −1 overture … n−1 last station. */
  step: number;
  selectedArm?: ResolvedVoyageArm | null;
  selectedTarget?: ResolvedVoyageArmTarget | null;
  onStep: (step: number) => void;
  /** Tour finished — free mode with the route fully drawn. */
  onFin: () => void;
  /** Leave the journey entirely and return to the neutral chart. */
  onExit: () => void;
}

export default function VoyageTour({
  resolved,
  bus,
  reduce,
  suppressed,
  muted = false,
  step,
  selectedArm = null,
  selectedTarget = null,
  onStep,
  onFin,
  onExit,
}: VoyageTourProps) {
  const n = resolved.stations.length;
  const legionSteps = resolved.strategic?.mode === "legion-steps";
  const stationNoun = legionSteps ? "LEGIONS" : n === 1 ? "STATION" : "STATIONS";
  const last = step >= n - 1;
  const cardRef = useRef<HTMLDivElement | null>(null);

  const showFullRoute = useCallback(() => {
    const driver = bus.driver;
    const bounds = resolvedVoyageBounds(resolved);
    if (driver && bounds) {
      const { vw, vh } = driver.getViewport();
      const compact = vw <= 900;
      const cardTop = cardRef.current?.getBoundingClientRect().top ?? 0;
      const bottom =
        cardTop > 120 && cardTop < vh
          ? vh - cardTop + 24
          : compact
            ? 150
            : 80;
      const fit = fitVoyageBounds(
        bounds,
        { width: vw, height: vh },
        { horizontal: compact ? 28 : 64, top: 72, bottom },
      );
      bus.flyTo(fit.gx, fit.gy, fit.k, reduce ? 0 : 1100, fit.dy);
    }
  }, [bus, reduce, resolved]);

  const finishTour = useCallback(() => {
    showFullRoute();
    onFin();
  }, [onFin, showFullRoute]);

  const showArmRoute = useCallback(
    (arm: ResolvedVoyageArm) => {
      const driver = bus.driver;
      const bounds = resolvedVoyageArmBounds(resolved, arm);
      if (!driver || !bounds) return;
      const { vw, vh } = driver.getViewport();
      const compact = vw <= 900;
      const cardTop = cardRef.current?.getBoundingClientRect().top ?? 0;
      const bottom = cardTop > 120 && cardTop < vh ? vh - cardTop + 24 : compact ? 190 : 96;
      const fit = fitVoyageBounds(
        bounds,
        { width: vw, height: vh },
        { horizontal: compact ? 30 : 72, top: 76, bottom },
      );
      bus.flyTo(fit.gx, fit.gy, fit.k, reduce ? 0 : 1000, fit.dy);
    },
    [bus, reduce, resolved],
  );

  /* Camera: overture surveys the whole chart, each station flies in at a
     zoom fitted to the arriving leg (short hops magnify, long hauls pull
     back so the transit reads). The station is centred in the FREE area
     above the bottom-docked card, not the raw viewport — on phones the card
     covers the lower half and the targeted world hid beneath it (maintainer
     device test 2026-07-13). */
  useEffect(() => {
    const driver = bus.driver;
    if (!driver) return;
    if (step < 0) {
      bus.home(reduce ? 0 : 700);
      return;
    }
    const st = resolved.stations[step];
    if (!st) return;
    if (st.armCount) {
      const stepArm = resolved.strategicArms.find((arm) => arm.revealAt === step);
      if (legionSteps && stepArm) showArmRoute(stepArm);
      else showFullRoute();
      return;
    }
    const ref = resolved.stations[step > 0 ? step - 1 : Math.min(1, n - 1)];
    const legDist = Math.max(1, Math.hypot(st.gx - ref.gx, st.gy - ref.gy));
    const kr = Math.min(8, Math.max(2.4, 200 / legDist));
    // Effects run after commit — the card already shows this step's content,
    // so its measured top edge is the real free-area boundary.
    const cardTop = cardRef.current?.getBoundingClientRect().top ?? 0;
    const dy = cardTop > 0 && cardTop < window.innerHeight ? (cardTop - window.innerHeight) / 2 : 0;
    bus.flyTo(st.gx, st.gy, driver.getK0() * kr, reduce ? 0 : 1000, dy);
  }, [bus, resolved, step, n, reduce, showFullRoute, showArmRoute, legionSteps]);

  /* Arrow keys page the tour — with the S9 target guard: a focused field,
     slider or listbox (seek combobox, census rows, the media player's
     volume) keeps its own arrow keys, the tour only pages when the keys
     belong to nobody. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (suppressed || muted) return;
      const t = e.target;
      if (
        t instanceof Element &&
        t.closest("input, textarea, select, audio, [contenteditable], [role='slider'], [role='listbox']")
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        if (step < 0) onStep(0);
        else if (!last) onStep(step + 1);
        else finishTour();
      } else if (e.key === "ArrowLeft" && step > 0) {
        onStep(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, last, onStep, finishTour, suppressed, muted]);

  if (step < 0) {
    return (
      <div
        ref={cardRef}
        className={`cg-ccard cg-ccard--dock cg-tour show${suppressed ? " hide" : ""}`}
        inert={suppressed || muted}
      >
        <button
          type="button"
          className="cpg cg-tour-x"
          title="Leave the journey"
          aria-label="Leave the journey"
          onClick={onExit}
        >
          ✕
        </button>
        <p className="ck">
          GREAT JOURNEY · {resolved.tag.toUpperCase()}
          {resolved.cartography ? ` · ${resolved.cartography.label.toUpperCase()}` : ""}
        </p>
        <p className="cg-tour-name">{resolved.name}</p>
        <p className="ct">{resolved.blurb}</p>
        {resolved.cartography && <p className="cg-tour-method">{resolved.cartography.note}</p>}
        <div className="cg-tour-row">
          <span />
          <button className="cpg lead" onClick={() => onStep(0)}>
            BEGIN JOURNEY · {n} {stationNoun} →
          </button>
        </div>
      </div>
    );
  }

  const st = resolved.stations[step];
  if (!st) return null;
  const stepArm = legionSteps
    ? (resolved.strategicArms.find((arm) => arm.revealAt === step) ?? null)
    : null;
  const readoutArm = selectedArm ?? stepArm;
  const strategicSelection = !!st.armCount && (!!readoutArm || !!selectedTarget);
  return (
    // Deliberately NOT keyed by step: one stable DOM node (and one stable
    // will-change compositor layer) carries the whole tour. The per-step
    // remount allocated a fresh promoted layer mid-flight on every "Next" —
    // iOS WebKit left ghost pixels (stray ✕) and misplaced/clipped cards
    // behind (maintainer device test 2026-07-13).
    <div
      ref={cardRef}
      className={`cg-ccard cg-ccard--dock cg-tour show${suppressed ? " hide" : ""}`}
      inert={suppressed || muted}
    >
      <button
        type="button"
        className="cpg cg-tour-x"
        title="End the journey"
        aria-label="End the journey"
        onClick={onExit}
      >
        ✕
      </button>
      {strategicSelection ? (
        <StrategicReadout
          arm={readoutArm}
          target={selectedTarget}
          color={
            readoutArm
              ? resolved.legColors[readoutArm.legIndices[0]]
              : selectedTarget
                ? "var(--cl-gold)"
                : undefined
          }
        />
      ) : (
        <>
          {/* Hierarchy: name + text carry the act; the date is a quiet footnote;
              position lives in the pager button ("3 / 9"), no ACT numeral. */}
          {st.section && (
            <p className="cg-tour-section" style={{ color: st.section.color }}>
              {st.section.label}
            </p>
          )}
          <p className="cg-tour-name">{st.heading}</p>
          {st.date && <p className="cg-tour-date">{st.date}</p>}
          <p className="ct">{st.text}</p>
          {st.placement && (
            <p className="cg-tour-placement">
              {st.placement.precision === "relative"
                ? "INFERRED PLACEMENT"
                : "SCHEMATIC PLACEMENT"}
              {" · "}
              {st.placement.note}{" "}
              <a href={st.placement.source} target="_blank" rel="noreferrer">
                SOURCE ↗
              </a>
            </p>
          )}
        </>
      )}
      <div className="cg-tour-row">
        <span>
          {step > 0 && (
            <button className="cpg quiet" onClick={() => onStep(step - 1)}>
              ← BACK
            </button>
          )}
        </span>
        <button className="cpg lead" onClick={() => (last ? finishTour() : onStep(step + 1))}>
          {last
            ? legionSteps
              ? "SHOW THE FULL WEB →"
              : "SHOW THE FULL ROUTE →"
            : `${step + 1} / ${n} · ${legionSteps ? "NEXT LEGION" : "NEXT"} →`}
        </button>
      </div>
    </div>
  );
}
