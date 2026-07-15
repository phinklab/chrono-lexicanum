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

import type {
  ResolvedVoyage,
  ResolvedVoyageArm,
  ResolvedVoyageArmTarget,
} from "@/lib/map/voyages";

import StrategicReadout from "./StrategicReadout";
import LegionRouteRoster from "./LegionRouteRoster";

interface CourseCardsProps {
  resolved: ResolvedVoyage;
  /** World popup open — the card steps aside and returns when it closes. */
  suppressed: boolean;
  /** Mobile sheet open (modal) — the card leaves the AT tree meanwhile. */
  muted?: boolean;
  selectedArm?: ResolvedVoyageArm | null;
  selectedTarget?: ResolvedVoyageArmTarget | null;
  hiddenArmLegions?: ReadonlySet<string>;
  onArmToggle?: (legion: string) => void;
  onArmSelect?: (legion: string) => void;
  /** Return to the tour at its last station. */
  onBack: () => void;
  /** Fly the tour again from the first station. */
  onRestart: () => void;
  /** Enter the authored journey that follows this one. */
  onContinue: (id: string) => void;
}

export default function CourseCards({
  resolved,
  suppressed,
  muted = false,
  selectedArm = null,
  selectedTarget = null,
  hiddenArmLegions = new Set<string>(),
  onArmToggle,
  onArmSelect,
  onBack,
  onRestart,
  onContinue,
}: CourseCardsProps) {
  const [dismissed, setDismissed] = useState(false);
  const st = resolved.stations[resolved.stations.length - 1];
  const continuation = resolved.continuation;
  const legionSteps = resolved.strategic?.mode === "legion-steps";
  const defaultArm = legionSteps ? (resolved.strategicArms.at(-1) ?? null) : null;
  const readoutArm = selectedArm ?? defaultArm;
  const strategicSelection = !!st?.armCount && (!!readoutArm || !!selectedTarget);
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
          {/* Same hierarchy as the tour card: name + text lead, date recedes. */}
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
      {legionSteps && onArmToggle && onArmSelect && (
        <LegionRouteRoster
          arms={resolved.strategicArms}
          hidden={hiddenArmLegions}
          onToggle={onArmToggle}
          onSelect={onArmSelect}
        />
      )}
      <div className="cg-tour-row">
        <button className="cpg quiet" onClick={onBack}>
          ← BACK
        </button>
        <button className="cpg lead" onClick={onRestart}>
          RESTART JOURNEY
        </button>
      </div>
      {continuation && (
        <button
          className="cpg lead cg-tour-continuation"
          onClick={() => onContinue(continuation.id)}
        >
          {continuation.label} →
        </button>
      )}
    </div>
  );
}
