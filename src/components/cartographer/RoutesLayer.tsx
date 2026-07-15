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
 * station — and stands drawn thereafter. Only the currently drawing leg or
 * epilogue leg group keeps live masks. Later legs, rings and waypoint dots hold at
 * opacity 0 via `rt-pending`. Several strategic epilogue arms may share the
 * same reveal step and draw together. `progress === stations.length` (the post-tour
 * survey) shows everything statically.
 *
 * World stations render as rings (deduped by id — repeat visits share one
 * ring at the FIRST visit's step); waypoints render as small dashed dots ON
 * their leg. Below 900px masks are skipped and SVG paths stand static/hidden;
 * RouteMotionCanvas draws the route there (static dashed line + step
 * draw-in) without SVG paint animation.
 * Mounted only while a journey is active — mounting restarts the desktop CSS
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
  selectedArmLegion?: string | null;
  selectedTargetId?: string | null;
  hiddenArmLegions?: ReadonlySet<string>;
  onArmSelect?: (legion: string | null) => void;
  onTargetSelect?: (targetId: string | null) => void;
}

export default function RoutesLayer({
  resolved,
  progress,
  selectedArmLegion = null,
  selectedTargetId = null,
  hiddenArmLegions = new Set<string>(),
  onArmSelect,
  onTargetSelect,
}: RoutesLayerProps) {
  // Phones skip the <mask> draw-in entirely. RouteMotionCanvas owns their
  // moving line; the SVG keeps only static station/label geometry.
  const narrow = useMediaQuery("(max-width: 900px)");
  if (!resolved || resolved.legs.length < 1) return null;

  const tour = progress !== null;
  const armByLeg = new Map(
    resolved.strategicArms.flatMap((arm) => arm.legIndices.map((legIndex) => [legIndex, arm] as const)),
  );
  const selectedTarget =
    selectedTargetId === null
      ? null
      : (resolved.strategicTargets.find((target) => target.id === selectedTargetId) ?? null);
  const stepArm =
    progress === null
      ? null
      : (resolved.strategicArms.find((arm) => arm.revealAt === progress) ?? null);
  const focusLegion = selectedArmLegion ?? stepArm?.legion ?? null;
  const isIsstvanLeg = new Set(
    resolved.strategicTargets
      .filter((target) => target.name.startsWith("Istvaan"))
      .flatMap((target) => target.legIndices),
  );

  // First tour step at which each leg starts drawing: the step of the first
  // stop (waypoint or end station) that rides/arrives on it.
  const firstEntry = new Map(resolved.legRevealAt.map((step, legIndex) => [legIndex, step]));
  const drawingLegs = tour
    ? new Set([...firstEntry.entries()].filter(([, step]) => step === progress).map(([legIndex]) => legIndex))
    : new Set<number>();
  const legState = (li: number): string => {
    if (!tour) return "";
    const entry = firstEntry.get(li);
    if (entry === undefined || (progress as number) < entry) return " rt-pending";
    return entry === progress ? " rt-drawing" : " rt-drawn";
  };

  // An anchor's ring appears when the tour reaches its FIRST visit; repeat
  // catalog worlds (Terra twice) share one ring, while sourced chart points
  // carry unique ids and therefore remain individually visible.
  const firstVisit = new Map<string, number>();
  for (const st of resolved.stations) {
    if (st.kind !== "way" && !firstVisit.has(st.id)) firstVisit.set(st.id, st.i);
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
            // Tour mode masks only the currently drawing leg or epilogue group;
            // ambient mode masks every leg for the staggered draw-in.
            tour && !drawingLegs.has(li) ? null : (
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
        const masked = !narrow && (tour ? drawingLegs.has(li) : true);
        const arm = armByLeg.get(li);
        const armAvailable = !!arm && (!tour || (progress as number) >= resolved.legRevealAt[li]);
        const armSelected = arm !== undefined && selectedArmLegion === arm.legion;
        const armHidden = arm !== undefined && hiddenArmLegions.has(arm.legion);
        const targetSelected = selectedTarget?.legIndices.includes(li) ?? false;
        const highlighted = armSelected || targetSelected;
        const armLabel = arm
          ? `Legion ${arm.legion} · ${arm.name} · ${arm.role} → ${arm.targetName}`
          : "";
        const toggleArm = () => onArmSelect?.(armSelected ? null : (arm?.legion ?? null));
        return (
          <g key={li}>
            <path
              className={`cg-rtFly${legState(li)}${highlighted ? " is-selected" : ""}`}
              d={d}
              fill="none"
              stroke={resolved.legColors[li] ?? GOLD}
              strokeOpacity={armHidden ? 0 : (resolved.legOpacities[li] ?? 0.9)}
              strokeWidth={1.7}
              strokeDasharray="1.6 4.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ "--i": tour ? 0 : li } as CSSProperties}
              mask={masked ? `url(#cg-m-${resolved.id}-${li})` : undefined}
            />
            {arm && armAvailable && !armHidden && (
              <path
                className={`cg-rt-hit${armSelected ? " is-selected" : ""}`}
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={isIsstvanLeg.has(li) ? 4 : 12}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                focusable="true"
                aria-label={armLabel}
                aria-pressed={armSelected}
                style={{ "--arm-color": resolved.legColors[li] } as CSSProperties}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleArm();
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  toggleArm();
                }}
              >
                <title>{armLabel}</title>
              </path>
            )}
          </g>
        );
      })}
      {resolved.strategicTargets.map((target) => {
        const pending = tour && (progress as number) < target.revealAt;
        const hidden = !target.legionIds.some((legion) => !hiddenArmLegions.has(legion));
        const selected = target.id === selectedTargetId;
        const focused = focusLegion !== null && target.legionIds.includes(focusLegion);
        const labelHidden = resolved.strategic?.mode === "legion-steps" && !focused && !selected;
        const targetLabel = `Strategic destination ${target.name} · Legions ${target.legionIds.join(", ")}`;
        const toggleTarget = () => onTargetSelect?.(selected ? null : target.id);
        return (
          <g
            key={target.id}
            className={`cg-arm-target${selected ? " is-selected" : ""}${labelHidden ? " is-muted" : ""}${pending || hidden ? " rt-pending" : ""}`}
            style={{ pointerEvents: pending || hidden ? "none" : undefined }}
            aria-hidden={pending || hidden}
          >
            <circle
              cx={target.gx}
              cy={target.gy}
              r={5.2}
              fill="var(--cl-ink)"
              stroke={GOLD}
              strokeWidth={selected ? 1.5 : 0.9}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={target.gx} cy={target.gy} r={1.25} fill={GOLD} stroke="none" />
            <text
              className="cg-arm-target-label"
              x={target.gx + target.label.dx}
              y={target.gy + target.label.dy}
              textAnchor={target.label.anchor ?? "start"}
            >
              {target.name}
            </text>
            <circle
              className="cg-arm-target-hit"
              cx={target.gx}
              cy={target.gy}
              r={11}
              fill="transparent"
              role="button"
              tabIndex={pending || hidden ? -1 : 0}
              focusable={pending || hidden ? "false" : "true"}
              aria-label={targetLabel}
              aria-pressed={selected}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                toggleTarget();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                toggleTarget();
              }}
            >
              <title>{targetLabel}</title>
            </circle>
          </g>
        );
      })}
      {rings.map(({ id, i, st }) => {
        const pending = tour && (progress as number) < i;
        const ringLegions = resolved.stations
          .filter((station) => station.id === id)
          .flatMap((station) => station.armLegions ?? []);
        const hidden =
          ringLegions.length > 0 && ringLegions.every((legion) => hiddenArmLegions.has(legion));
        const color = st.section?.color ?? GOLD;
        return (
          <g
            key={id}
            className={`cg-rt-st${st.kind === "point" ? " cg-rt-point" : ""}${pending || hidden ? " rt-pending" : ""}`}
            // Ambient cadence: a ring lands as its arriving leg finishes
            // (leg k draws at k·1.45s; the station 0 ring opens the show).
            style={{ "--i": tour ? 0 : st.legIndex + 1 } as CSSProperties}
          >
            <circle
              cx={st.gx}
              cy={st.gy}
              r={st.kind === "point" ? 6 : 8}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray={st.kind === "point" ? "2 2.5" : undefined}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={st.gx} cy={st.gy} r={1.4} fill={color} stroke="none" />
          </g>
        );
      })}
      {waypoints.map((st) => {
        const pending = tour && (progress as number) < st.i;
        const color = st.section?.color ?? GOLD;
        return (
          <g
            key={st.id}
            className={`cg-rt-st cg-rt-wp${pending ? " rt-pending" : ""}`}
            // Ambient: bloom mid-draw of the leg the dot rides.
            style={{ "--i": tour ? 0 : st.legIndex + 0.6 } as CSSProperties}
          >
            <circle cx={st.gx} cy={st.gy} r={4} fill="none" stroke={color} strokeWidth={0.8} strokeDasharray="1.4 2" vectorEffect="non-scaling-stroke" />
            <circle cx={st.gx} cy={st.gy} r={1.2} fill={color} stroke="none" />
          </g>
        );
      })}
      {tour && progress !== null && progress >= 0 && progress < resolved.stations.length && (
        <circle
          className="cg-rt-active"
          cx={resolved.stations[progress].gx}
          cy={resolved.stations[progress].gy}
          r={11}
          fill="none"
          stroke={resolved.stations[progress].section?.color ?? GOLD}
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
      )}
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
