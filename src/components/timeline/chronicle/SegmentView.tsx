"use client";

/**
 * SegmentView — the zoomed-in view of one era segment: header (kicker + name +
 * tone + count), an optional FilterRail slot, and the active layout
 * (series-lanes or reading-sequence). Ported from the prototype's
 * `segment-view.jsx`. `compact` drops the big header for the accordion (whose
 * spine already labels the band). The approximate-placement note is gone —
 * the live catalogue carries no approximate-dating signal yet.
 *
 * `filterRail` is injected by the parent (only in the zoom shell, where the
 * server-filtered `loadEraBooks` payload exists); SegmentView stays free of
 * filter wiring.
 */

import type { ReactNode } from "react";
import type { RibbonSegment, SeriesRef, TimelineBook } from "@/lib/timeline";
import { formatScaleRange } from "@/lib/timeline";
import LayoutLanes from "./LayoutLanes";
import LayoutSequence from "./LayoutSequence";

interface SegmentViewProps {
  seg: RibbonSegment;
  books: TimelineBook[];
  layout: "lanes" | "sequence";
  seriesById: Record<string, SeriesRef>;
  onBack?: () => void;
  compact?: boolean;
  filterRail?: ReactNode;
}

function Layout({
  seg,
  books,
  layout,
  seriesById,
}: Pick<SegmentViewProps, "seg" | "books" | "layout" | "seriesById">) {
  if (books.length === 0) {
    return (
      <div className="tlp-empty-seg">
        No dated publications recorded in this segment yet.
      </div>
    );
  }
  return layout === "sequence" ? (
    <LayoutSequence books={books} seriesById={seriesById} />
  ) : (
    <LayoutLanes seg={seg} books={books} seriesById={seriesById} />
  );
}

export default function SegmentView({
  seg,
  books,
  layout,
  seriesById,
  onBack,
  compact,
  filterRail,
}: SegmentViewProps) {
  if (compact) {
    return (
      <div className="tlp-segview" style={{ padding: "10px 18px 14px" }}>
        <div className="tlp-layout-area">
          <Layout seg={seg} books={books} layout={layout} seriesById={seriesById} />
        </div>
      </div>
    );
  }

  return (
    <div className="tlp-segview">
      <div className="tlp-segview-head">
        {onBack && (
          <button
            type="button"
            className="tlp-back"
            onClick={onBack}
            aria-label="Back to overview"
          >
            ← <span>Overview</span>
          </button>
        )}
        <div className="tlp-segview-titles">
          <div className="tlp-segview-kicker">
            Segment · {formatScaleRange(seg.canonStart, seg.canonEnd)}
          </div>
          <h2 className="tlp-segview-title">{seg.name}</h2>
          {seg.tone && <div className="tlp-segview-tone">{seg.tone}</div>}
        </div>
        <div className="tlp-segview-meta">
          <span className="n">{books.length}</span>
          {books.length === 1 ? "publication" : "publications"}
        </div>
      </div>
      {filterRail}
      <div className="tlp-layout-area">
        <Layout seg={seg} books={books} layout={layout} seriesById={seriesById} />
      </div>
    </div>
  );
}
