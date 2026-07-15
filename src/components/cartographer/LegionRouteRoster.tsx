import type { CSSProperties } from "react";

import type { ResolvedVoyageArm } from "@/lib/map/voyages";

interface LegionRouteRosterProps {
  arms: ReadonlyArray<ResolvedVoyageArm>;
  hidden: ReadonlySet<string>;
  onToggle: (legion: string) => void;
  onSelect: (legion: string) => void;
}

export default function LegionRouteRoster({
  arms,
  hidden,
  onToggle,
  onSelect,
}: LegionRouteRosterProps) {
  const visible = arms.length - hidden.size;
  return (
    <div className="cg-legion-roster">
      <p className="cg-legion-roster-label">
        ROUTE CONTROL · {visible} / {arms.length} VISIBLE
      </p>
      <div className="cg-legion-roster-grid" role="group" aria-label="Toggle Legion routes">
        {arms.map((arm) => {
          const shown = !hidden.has(arm.legion);
          return (
            <button
              key={arm.legion}
              type="button"
              className={`cg-legion-route${shown ? "" : " is-hidden"}`}
              style={{ "--legion-color": arm.color } as CSSProperties}
              aria-label={`${shown ? "Hide" : "Show"} Legion ${arm.legion}, ${arm.name}`}
              aria-pressed={shown}
              title={`${arm.legion} · ${arm.name}`}
              onClick={() => {
                onSelect(arm.legion);
                onToggle(arm.legion);
              }}
            >
              <span aria-hidden>{arm.legion}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
