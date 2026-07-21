"use client";

/**
 * EraPlate — the chart's edition line. A book's title page carries its title
 * and, beneath it, the edition; on /map the centred site brand is the title
 * and this plate is the edition: three chart editions (M30 Great Crusade,
 * M31 Horus Heresy, M42 Era Indomitus), exactly one in force.
 *
 * This is the map's BASE STATE — mutually exclusive, radio semantics, always
 * visible on every viewport (the collapsible cartouche/sheet carry only
 * overlays and filters). The three segments + arrow keys are the discrete
 * stepper; a played timeline (running Zeitstrahl with highlighted beats)
 * is a planned separate feature and will dock here.
 *
 * A11y: one radiogroup, roving tabindex, arrow keys move AND select (ARIA
 * APG radio pattern). Inert behind the overture veil like the cartouche.
 */

import { useRef } from "react";

import { MAP_STATES, type MapState } from "@/lib/map/zones";

export const ERA_LABELS: Record<MapState, { m: string; name: string }> = {
  pre: { m: "M30", name: "The Great Crusade" },
  hh: { m: "M31", name: "The Horus Heresy" },
  now: { m: "M42", name: "Era Indomitus" },
};

export default function EraPlate({
  era,
  condensed,
  onSetEra,
}: {
  era: MapState;
  condensed: boolean;
  onSetEra: (era: MapState) => void;
}) {
  const refs = useRef<Partial<Record<MapState, HTMLButtonElement | null>>>({});

  const step = (delta: number) => {
    const idx = MAP_STATES.indexOf(era);
    const next = MAP_STATES[(idx + delta + MAP_STATES.length) % MAP_STATES.length];
    onSetEra(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={`cg-eraplate${condensed ? " on" : ""}`} inert={!condensed}>
      <div className="ep-row" role="radiogroup" aria-label="Chart edition">
        {MAP_STATES.map((state) => (
          <button
            key={state}
            ref={(el) => {
              refs.current[state] = el;
            }}
            className="ep-seg"
            role="radio"
            aria-checked={state === era}
            aria-label={`${ERA_LABELS[state].m}, ${ERA_LABELS[state].name}`}
            tabIndex={state === era ? 0 : -1}
            onClick={() => onSetEra(state)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                step(1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                step(-1);
              }
            }}
          >
            {ERA_LABELS[state].m}
          </button>
        ))}
      </div>
      {/* The edition line proper — names the active chart, aria-hidden: each
          radio already speaks its full name. */}
      <p className="ep-name" aria-hidden="true">
        {ERA_LABELS[era].name}
      </p>
    </div>
  );
}
