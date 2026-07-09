"use client";

/**
 * CourseCards — the free-mode epilogue of an active journey: ONE
 * bottom-docked card carrying the final station's act while the route
 * stands fully drawn on the chart. The maintainer cut the pin-anchored
 * all-acts tableau (2026-07-09): at 10–21 stations it drowned the chart
 * in text at journey's end. Earlier acts are read in the tour (Back/Next);
 * ✕ dismisses the card without ending the journey. Reuses the tour card's
 * dock grammar on both breakpoints.
 *
 * Mount keyed by voyage id (parent) — switching journeys resets dismissal.
 */

import { useState } from "react";

import type { ResolvedVoyage } from "@/lib/map/voyages";

const ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
  "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV",
];

interface CourseCardsProps {
  resolved: ResolvedVoyage;
  /** World popup open — the card steps aside and returns when it closes. */
  suppressed: boolean;
}

export default function CourseCards({ resolved, suppressed }: CourseCardsProps) {
  const [dismissed, setDismissed] = useState(false);
  const st = resolved.stations[resolved.stations.length - 1];
  if (!st || dismissed) return null;
  return (
    <div className={`cg-ccard cg-ccard--dock cg-tour show${suppressed ? " hide" : ""}`}>
      <button className="cpg cg-tour-x" title="Dismiss" onClick={() => setDismissed(true)}>
        ✕
      </button>
      <p className="ck">
        ACT {ROMAN[st.i] ?? st.i + 1}
        {st.date ? ` · ${st.date}` : ""} · {st.heading.toUpperCase()}
      </p>
      <p className="ct">{st.text}</p>
    </div>
  );
}
