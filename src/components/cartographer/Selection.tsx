/**
 * Selection — the ringwork blooming OUT of the selected pin (BtnFx gesture,
 * Studie G→I): dashed ring + tick ring counter-rotating, one work-dot per
 * record (max 24) around the pin, three survey stars. Mounted keyed by the
 * selected world id so every selection restarts the CSS animations.
 */

import type { CSSProperties } from "react";

import type { FeaturedWorld } from "@/lib/map/payload";
import { BONE, GOLD } from "./chart-geometry";

export default function Selection({ world }: { world: FeaturedWorld }) {
  const count = Math.min(world.n, 24);
  const dots = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / count;
    return { x: Math.cos(a) * 16, y: Math.sin(a) * 16, i };
  });
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8;
    return {
      x1: Math.cos(a) * 20,
      y1: Math.sin(a) * 20,
      x2: Math.cos(a) * 22,
      y2: Math.sin(a) * 22,
    };
  });
  return (
    <g className="cg-sel" transform={`translate(${world.gx} ${world.gy})`} pointerEvents="none">
      <g className="cg-pi">
        <g className="blm">
          <circle r={30} fill="none" stroke="none" />
          <circle className="r-dash" r={12} fill="none" stroke={GOLD} strokeWidth={1} strokeDasharray="4 3" />
          <g className="r-tick">
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.7} />
            ))}
          </g>
          <g>
            {dots.map((d) => (
              <circle
                key={d.i}
                className="rd"
                style={{ "--i": d.i } as CSSProperties}
                cx={d.x}
                cy={d.y}
                r={0.9}
                fill={GOLD}
                fillOpacity={0.9}
              />
            ))}
            <circle className="sst sst1" r={1.5} fill={BONE} />
            <circle className="sst sst2" r={1} fill={GOLD} />
            <circle className="sst sst3" r={1.2} fill={GOLD} />
          </g>
        </g>
      </g>
    </g>
  );
}
