/**
 * RoutesLayer — the active journey's chart geometry, in two modes.
 *
 * Ambient (`progress === null`, reached via "skip tour"): the pre-voyage
 * choreography — legs draw station by station on a CSS time-stagger (mask
 * reveal), rings bloom on the same cadence, dots march in travel direction.
 *
 * Tour (`progress >= -1`, the guided playback): reveal is STEP-gated, not
 * time-gated, keyed off each stop's `legIndex`. A leg draws when the tour
 * FIRST enters it — arriving at a waypoint riding it, or directly at its end
 * station — and stands drawn thereafter (mask removed; at most ONE live
 * mask, cheaper than ambient). Later legs, rings and waypoint dots hold at
 * opacity 0 via `rt-pending`. `progress === stations.length` (the post-tour
 * survey) shows everything statically.
 *
 * World stations render as rings (deduped by id — repeat visits share one
 * ring at the FIRST visit's step); waypoints render as small dashed dots ON
 * their leg. Below 900px masks are skipped entirely (`cg-course--lite`),
 * while the route keeps moving inside ChartStage's isolated motion plane.
 * Mounted only while a journey is active — mounting restarts the CSS
 * choreography.
 */

import type { CSSProperties } from "react";

import type { ResolvedVoyage } from "@/lib/map/voyages";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { GOLD } from "./chart-geometry";

interface RoutesLayerProps {
  resolved: ResolvedVoyage | null;
  /** Tour step (−1 overture … stations.length survey), or null for ambient. */
  progress: number | null;
}

export default function RoutesLayer({ resolved, progress }: RoutesLayerProps) {
  // Phones skip the <mask> draw-in entirely. The dash still moves, but its
  // repaint is confined to ChartStage's lightweight motion SVG instead of
  // the ~2000-node base chart. See `cg-course--lite` in 55-map.css.
  const narrow = useMediaQuery("(max-width: 900px)");
  if (!resolved || resolved.legs.length < 1) return null;

  const tour = progress !== null;

  // First tour step at which each leg starts drawing: the step of the first
  // stop (waypoint or end station) that rides/arrives on it.
  const firstEntry = new Map<number, number>();
  for (const st of resolved.stations) {
    if (st.legIndex >= 0 && !firstEntry.has(st.legIndex)) firstEntry.set(st.legIndex, st.i);
  }
  const drawingLeg = tour
    ? ([...firstEntry.entries()].find(([, step]) => step === progress)?.[0] ?? null)
    : null;
  const legState = (li: number): string => {
    if (!tour) return "";
    const entry = firstEntry.get(li);
    if (entry === undefined || (progress as number) < entry) return " rt-pending";
    return entry === progress ? " rt-drawing" : " rt-drawn";
  };

  // A station's ring appears when the tour reaches its FIRST visit; repeat
  // visits (Terra twice) share one ring keyed by world id.
  const firstVisit = new Map<string, number>();
  for (const st of resolved.stations) {
    if (st.kind === "world" && !firstVisit.has(st.id)) firstVisit.set(st.id, st.i);
  }
  const rings = [...firstVisit.entries()].map(([id, i]) => ({
    id,
    i,
    st: resolved.stations[i],
  }));
  const waypoints = resolved.stations.filter((st) => st.kind === "way");

  return (
    <g className={`${narrow ? "cg-course cg-course--lite" : "cg-course"}${tour ? " tour" : ""}`}>
      {!narrow && (
        <defs>
          {resolved.legs.map((d, li) =>
            // Tour mode keeps at most one mask alive (the drawing leg);
            // ambient mode masks every leg for the staggered draw-in.
            tour && li !== drawingLeg ? null : (
              <mask id={`cg-m-${resolved.id}-${li}`} key={li}>
                <path
                  d={d}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={8}
                  pathLength={1}
                  className="cg-routeDraw"
                  style={{ "--i": tour ? 0 : li } as CSSProperties}
                />
              </mask>
            ),
          )}
        </defs>
      )}
      {resolved.legs.map((d, li) => {
        const masked = !narrow && (tour ? li === drawingLeg : true);
        return (
          <path
            key={li}
            className={`cg-rtFly${legState(li)}`}
            d={d}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.9}
            strokeWidth={1.7}
            strokeDasharray="1.6 4.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ "--i": tour ? 0 : li } as CSSProperties}
            mask={masked ? `url(#cg-m-${resolved.id}-${li})` : undefined}
          />
        );
      })}
      {rings.map(({ id, i, st }) => {
        const pending = tour && (progress as number) < i;
        return (
          <g
            key={id}
            className={`cg-rt-st${pending ? " rt-pending" : ""}`}
            // Ambient cadence: a ring lands as its arriving leg finishes
            // (leg k draws at k·1.45s; the station 0 ring opens the show).
            style={{ "--i": tour ? 0 : st.legIndex + 1 } as CSSProperties}
          >
            <circle cx={st.gx} cy={st.gy} r={8} fill="none" stroke={GOLD} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={st.gx} cy={st.gy} r={1.4} fill={GOLD} stroke="none" />
          </g>
        );
      })}
      {waypoints.map((st) => {
        const pending = tour && (progress as number) < st.i;
        return (
          <g
            key={st.id}
            className={`cg-rt-st cg-rt-wp${pending ? " rt-pending" : ""}`}
            // Ambient: bloom mid-draw of the leg the dot rides.
            style={{ "--i": tour ? 0 : st.legIndex + 0.6 } as CSSProperties}
          >
            <circle cx={st.gx} cy={st.gy} r={4} fill="none" stroke={GOLD} strokeWidth={0.8} strokeDasharray="1.4 2" vectorEffect="non-scaling-stroke" />
            <circle cx={st.gx} cy={st.gy} r={1.2} fill={GOLD} stroke="none" />
          </g>
        );
      })}
      <text
        className={`cg-rt-lbl${tour && (progress as number) < resolved.stations.length - 1 ? " rt-pending" : ""}`}
        x={resolved.lbl.x}
        y={resolved.lbl.y}
        fontSize={9}
        textAnchor="middle"
        style={{
          animationDelay: tour ? "0.3s" : `${(resolved.legs.length * 1.45 + 0.4).toFixed(2)}s`,
        }}
      >
        {resolved.lbl.t}
      </text>
    </g>
  );
}
