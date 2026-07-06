/**
 * ZonesLayer — the hand-curated zones on the chart (178b). Renders the
 * PUBLISHED entries of src/lib/map/zones.json; shapes are drawn by Philipp
 * in the zone editor (/map?zones=edit), never derived from images.
 */

import { memo } from "react";

import { CURATED_ZONES, zoneCentroid, zonePath, type ZoneDef } from "@/lib/map/zones";

/** One zone in chart styling — shared with the editor so the shape being
 *  formed looks exactly like what ships. */
export function ZoneShape({ zone }: { zone: ZoneDef }) {
  const c = zoneCentroid(zone);
  return (
    <g className={`cg-zone ${zone.kind}`}>
      <path className="zshape" d={zonePath(zone)} />
      <text className="cg-zone-lbl" x={c.x} y={c.y}>
        {zone.kind === "interdiction" ? `✠ ${zone.name.toUpperCase()} ✠` : zone.name.toUpperCase()}
      </text>
    </g>
  );
}

export const ZonesLayer = memo(function ZonesLayer() {
  const published = CURATED_ZONES.filter((z) => z.published);
  if (published.length === 0) return null;
  return (
    <g className="cg-zones">
      {published.map((z) => (
        <ZoneShape key={z.id} zone={z} />
      ))}
    </g>
  );
});
