"use client";

/**
 * BookTooltip — the floating marker tooltip, rendered once by
 * `<ChronicleClient>` at a fixed viewport position. Pointer-events:none, so it
 * never blocks the marker underneath.
 */

import { formatMScale, FORMAT_LABEL, type TimelineBook } from "@/lib/timeline";

export interface TipData {
  book: TimelineBook;
  x: number;
  y: number;
}

export default function BookTooltip({ data }: { data: TipData | null }) {
  if (!data) return null;
  const b = data.book;
  const isRange = b.endY !== b.startY;
  return (
    <div
      className="tlp-tooltip"
      style={{ left: `${data.x}px`, top: `${data.y}px` }}
      role="tooltip"
    >
      <div className="tlp-tt-title">{b.title}</div>
      <div className="tlp-tt-row">
        <span className="yr">{formatMScale(b.startY)}</span>
        {isRange && <span className="yr">→ {formatMScale(b.endY)}</span>}
        <span>{FORMAT_LABEL[b.fmt]}</span>
      </div>
      {b.authors.length > 0 && (
        <div className="tlp-tt-row">
          <span>{b.authors.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
