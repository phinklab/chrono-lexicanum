"use client";

/**
 * CourseCards — the free-mode epilogue of an active journey: ONE
 * bottom-docked card carrying the final station's act while the route
 * stands fully drawn on the chart. The maintainer cut the pin-anchored
 * all-acts tableau (2026-07-09): at 10–21 stations it drowned the chart
 * in text at journey's end. The card keeps the voyage navigable (2026-07-13):
 * "← Back" returns to the tour at the last station, "Restart journey" starts
 * over at station one; ✕ dismisses the card without ending the journey.
 * Reuses the tour card's dock grammar on both breakpoints.
 *
 * Mount keyed by voyage id (parent) — switching journeys resets dismissal.
 */

import { useState } from "react";

import type { ResolvedVoyage } from "@/lib/map/voyages";

interface CourseCardsProps {
  resolved: ResolvedVoyage;
  /** World popup open — the card steps aside and returns when it closes. */
  suppressed: boolean;
  /** Mobile sheet open (modal) — the card leaves the AT tree meanwhile. */
  muted?: boolean;
  /** Return to the tour at its last station. */
  onBack: () => void;
  /** Fly the tour again from the first station. */
  onRestart: () => void;
}

export default function CourseCards({
  resolved,
  suppressed,
  muted = false,
  onBack,
  onRestart,
}: CourseCardsProps) {
  const [dismissed, setDismissed] = useState(false);
  const st = resolved.stations[resolved.stations.length - 1];
  if (!st || dismissed) return null;
  return (
    <div
      className={`cg-ccard cg-ccard--dock cg-tour show${suppressed ? " hide" : ""}`}
      inert={suppressed || muted}
    >
      <button
        className="cpg cg-tour-x"
        title="Dismiss"
        aria-label="Dismiss the final act card"
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
      {/* Same hierarchy as the tour card: name + text lead, date recedes. */}
      <p className="cg-tour-name">{st.heading}</p>
      {st.date && <p className="cg-tour-date">{st.date}</p>}
      <p className="ct">{st.text}</p>
      {st.placement && (
        <p className="cg-tour-placement">
          {st.placement.precision === "relative" ? "INFERRED PLACEMENT" : "SCHEMATIC PLACEMENT"}
          {" · "}
          {st.placement.note}{" "}
          <a href={st.placement.source} target="_blank" rel="noreferrer">
            SOURCE ↗
          </a>
        </p>
      )}
      <div className="cg-tour-row">
        <button className="cpg quiet" onClick={onBack}>
          ← BACK
        </button>
        <button className="cpg lead" onClick={onRestart}>
          RESTART JOURNEY
        </button>
      </div>
    </div>
  );
}
