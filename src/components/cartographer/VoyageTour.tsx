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

import { useEffect } from "react";

import type { ResolvedVoyage } from "@/lib/map/voyages";
import type { ChartBus } from "./chart-bus";

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
  onStep,
  onFin,
  onExit,
}: VoyageTourProps) {
  const n = resolved.stations.length;
  const last = step >= n - 1;

  /* Camera: overture surveys the whole chart, each station flies in at a
     zoom fitted to the arriving leg (short hops magnify, long hauls pull
     back so the transit reads). */
  useEffect(() => {
    const driver = bus.driver;
    if (!driver) return;
    if (step < 0) {
      bus.home(reduce ? 0 : 700);
      return;
    }
    const st = resolved.stations[step];
    if (!st) return;
    const ref = resolved.stations[step > 0 ? step - 1 : Math.min(1, n - 1)];
    const legDist = Math.max(1, Math.hypot(st.gx - ref.gx, st.gy - ref.gy));
    const kr = Math.min(8, Math.max(2.4, 200 / legDist));
    bus.flyTo(st.gx, st.gy, driver.getK0() * kr, reduce ? 0 : 1000);
  }, [bus, resolved, step, n, reduce]);

  /* Arrow keys page the tour — with the S9 target guard: a focused field,
     slider or listbox (seek combobox, census rows, the media player's
     volume) keeps its own arrow keys, the tour only pages when the keys
     belong to nobody. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
        else onFin();
      } else if (e.key === "ArrowLeft" && step > 0) {
        onStep(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, last, onStep, onFin]);

  if (step < 0) {
    return (
      <div
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
        </p>
        <p className="cg-tour-name">{resolved.name}</p>
        <p className="ct">{resolved.blurb}</p>
        <div className="cg-tour-row">
          <span />
          <button className="cpg lead" onClick={() => onStep(0)}>
            BEGIN JOURNEY · {n} STATIONS →
          </button>
        </div>
      </div>
    );
  }

  const st = resolved.stations[step];
  if (!st) return null;
  return (
    // Deliberately NOT keyed by step: one stable DOM node (and one stable
    // will-change compositor layer) carries the whole tour. The per-step
    // remount allocated a fresh promoted layer mid-flight on every "Next" —
    // iOS WebKit left ghost pixels (stray ✕) and misplaced/clipped cards
    // behind (maintainer device test 2026-07-13).
    <div
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
      {/* Hierarchy: name + text carry the act; the date is a quiet footnote;
          position lives in the pager button ("3 / 9"), no ACT numeral. */}
      <p className="cg-tour-name">{st.heading}</p>
      {st.date && <p className="cg-tour-date">{st.date}</p>}
      <p className="ct">{st.text}</p>
      <div className="cg-tour-row">
        <span>
          {step > 0 && (
            <button className="cpg quiet" onClick={() => onStep(step - 1)}>
              ← BACK
            </button>
          )}
        </span>
        <button className="cpg lead" onClick={() => (last ? onFin() : onStep(step + 1))}>
          {last ? "SHOW THE FULL ROUTE →" : `${step + 1} / ${n} · NEXT →`}
        </button>
      </div>
    </div>
  );
}
