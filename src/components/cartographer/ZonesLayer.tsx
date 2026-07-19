/**
 * ZonesLayer — the hand-curated zones on the chart. Renders the PUBLISHED
 * entries of src/lib/map/zones.json; shapes are drawn by hand in the zone
 * editor (/map?zones=edit), never derived from images.
 *
 * Presentation (WM-B1): instead of outline + flat fill, every zone reads as
 * edge tint — concentric inner strokes clipped to the shape, running out
 * toward the middle (ink toward the inside, never a glow outward) — plus a
 * quiet non-scaling outline and an Imhof label (versal, Sperrung by extent,
 * rotated onto the principal axis, arced for band shapes).
 */

import { memo } from "react";

import {
  visibleZones,
  zoneCentroid,
  zoneEdgeBands,
  zoneLabelLayout,
  zonePath,
  type MapState,
  type ZoneDef,
} from "@/lib/map/zones";

/** One zone in chart styling — shared with the editor so the shape being
 *  formed looks exactly like what ships. */
export function ZoneShape({ zone }: { zone: ZoneDef }) {
  const c = zoneCentroid(zone);
  const d = zonePath(zone);
  const layout = zoneLabelLayout(zone);
  const [w1, w2, w3] = zoneEdgeBands(zone);
  const clipId = `cgzc-${zone.id}`;
  const text = zone.kind === "interdiction" ? `✠ ${zone.name.toUpperCase()} ✠` : zone.name.toUpperCase();
  const labelStyle = {
    fontSize: `calc(${layout.fontSize}px * var(--cg-ik, 1))`,
    letterSpacing: `calc(${layout.spacing}px * var(--cg-ik, 1))`,
  };
  return (
    <g className={`cg-zone ${zone.kind}${layout.small ? " zsmall" : ""}`}>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path className="zfill" d={d} />
        <path className="zedge ze3" d={d} strokeWidth={w3} />
        <path className="zedge ze2" d={d} strokeWidth={w2} />
        <path className="zedge ze1" d={d} strokeWidth={w1} />
      </g>
      <path className="zline" d={d} />
      {layout.arc ? (
        <>
          <path
            id={`cgza-${zone.id}`}
            className="zarc"
            d={`M ${layout.arc.x1} ${layout.arc.y1} Q ${layout.arc.cx} ${layout.arc.cy} ${layout.arc.x2} ${layout.arc.y2}`}
          />
          <text className="cg-zone-lbl" style={labelStyle}>
            <textPath href={`#cgza-${zone.id}`} startOffset="50%">
              {text}
            </textPath>
          </text>
        </>
      ) : (
        <text
          className="cg-zone-lbl"
          x={c.x}
          y={c.y}
          style={labelStyle}
          transform={layout.angle !== 0 ? `rotate(${layout.angle} ${c.x} ${c.y})` : undefined}
        >
          {text}
        </text>
      )}
    </g>
  );
}

export const ZonesLayer = memo(function ZonesLayer({ era }: { era: MapState }) {
  const zones = visibleZones(era);
  if (zones.length === 0) return null;
  return (
    <g className="cg-zones">
      {zones.map((z) => (
        <ZoneShape key={z.id} zone={z} />
      ))}
    </g>
  );
});
