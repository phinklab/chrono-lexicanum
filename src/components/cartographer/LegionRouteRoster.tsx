import type { CSSProperties } from "react";

import type { ResolvedVoyageArm } from "@/lib/map/voyages";

interface LegionRouteRosterProps {
  arms: ReadonlyArray<ResolvedVoyageArm>;
  hidden: ReadonlySet<string>;
  selectedLegion: string | null;
  onActivate: (legion: string) => void;
  onPreview: (legion: string | null) => void;
  onVisibilityAll: (visible: boolean) => void;
}

export default function LegionRouteRoster({
  arms,
  hidden,
  selectedLegion,
  onActivate,
  onPreview,
  onVisibilityAll,
}: LegionRouteRosterProps) {
  const visible = arms.length - hidden.size;
  const allVisible = visible === arms.length;
  return (
    <div className="cg-legion-roster">
      <div className="cg-legion-roster-head">
        <p className="cg-legion-roster-label" aria-live="polite">
          LEGION ROUTES <span>· {visible} / {arms.length} VISIBLE</span>
        </p>
        <button
          type="button"
          className="cg-legion-all"
          aria-label={allVisible ? "Hide all Legion routes" : "Show all Legion routes"}
          onClick={() => onVisibilityAll(!allVisible)}
        >
          {allVisible ? "HIDE ALL" : "SHOW ALL"}
        </button>
      </div>
      <div
        className="cg-legion-roster-grid"
        role="group"
        aria-label="Preview, pin or hide Legion routes"
      >
        {arms.map((arm) => {
          const shown = !hidden.has(arm.legion);
          const selected = selectedLegion === arm.legion;
          const action = !shown ? "Show and pin" : selected ? "Hide" : "Pin";
          return (
            <button
              key={arm.legion}
              type="button"
              className={`cg-legion-route${shown ? "" : " is-hidden"}${selected ? " is-selected" : ""}`}
              style={{ "--legion-color": arm.color } as CSSProperties}
              aria-label={`${action} Legion ${arm.legion}, ${arm.name}`}
              aria-pressed={selected}
              title={`${action} Legion ${arm.legion} · ${arm.name}`}
              onPointerEnter={() => onPreview(arm.legion)}
              onPointerLeave={() => onPreview(null)}
              onFocus={() => onPreview(arm.legion)}
              onBlur={() => onPreview(null)}
              onClick={() => onActivate(arm.legion)}
            >
              <span aria-hidden>{arm.legion}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
