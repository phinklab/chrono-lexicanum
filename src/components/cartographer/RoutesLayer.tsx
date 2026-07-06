/**
 * RoutesLayer — the active course (Brief 178, Entscheid 7): legs draw
 * station by station (mask reveal), then the dots keep marching in travel
 * direction (Konvoi-Geste, Runde 5). Station rings bloom with the leg
 * cadence. Mounted only while a course is active — mounting restarts the
 * CSS choreography.
 */

import { useMemo } from "react";
import type { CSSProperties } from "react";

import type { Course } from "@/lib/map/routes";
import type { FeaturedWorld } from "@/lib/map/payload";
import { GOLD } from "./chart-geometry";

interface RoutesLayerProps {
  course: Course | null;
  featured: FeaturedWorld[];
}

export default function RoutesLayer({ course, featured }: RoutesLayerProps) {
  const byName = useMemo(() => new Map(featured.map((f) => [f.name, f])), [featured]);
  if (!course) return null;

  const stations = course.stations
    .map((name, i) => ({ world: byName.get(name), i }))
    .filter((s): s is { world: FeaturedWorld; i: number } => s.world !== undefined);

  return (
    <g className="cg-course">
      <defs>
        {course.legs.map((d, li) => (
          <mask id={`cg-m-${course.id}-${li}`} key={li}>
            <path
              d={d}
              fill="none"
              stroke="#fff"
              strokeWidth={8}
              pathLength={1}
              className="cg-routeDraw"
              style={{ "--i": li } as CSSProperties}
            />
          </mask>
        ))}
      </defs>
      {course.legs.map((d, li) => (
        <path
          key={li}
          className="cg-rtFly"
          d={d}
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.9}
          strokeWidth={1.7}
          strokeDasharray="1.6 4.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          mask={`url(#cg-m-${course.id}-${li})`}
        />
      ))}
      {stations.map(({ world, i }) => (
        <g key={world.id} className="cg-rt-st" style={{ "--i": i } as CSSProperties}>
          <circle cx={world.gx} cy={world.gy} r={8} fill="none" stroke={GOLD} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <circle cx={world.gx} cy={world.gy} r={1.4} fill={GOLD} stroke="none" />
        </g>
      ))}
      <text
        className="cg-rt-lbl"
        x={course.lbl.x}
        y={course.lbl.y}
        fontSize={9}
        textAnchor="middle"
        style={{ animationDelay: `${(course.legs.length * 1.45 + 0.4).toFixed(2)}s` }}
      >
        {course.lbl.t}
      </text>
    </g>
  );
}
