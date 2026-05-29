"use client";

/**
 * AccordionShell — the alternate zoom model: every era is a vertical band on
 * one row; the open band flex-grows inline to reveal its SegmentView. Ported
 * from the prototype's `shells.jsx`. The open band is client-only state (it's
 * an inline expand, not a navigation) and reads from the full client
 * `bySegment` map — so no server round-trip and no FilterRail here; filtering
 * lives in the URL-driven zoom model.
 */

import { useMemo, useState } from "react";
import type { RibbonSegment, SeriesRef, TimelineBook } from "@/lib/timeline";
import SegmentView from "./SegmentView";

interface AccordionShellProps {
  segments: RibbonSegment[];
  bySegment: Record<string, TimelineBook[]>;
  seriesById: Record<string, SeriesRef>;
  layout: "lanes" | "sequence";
}

export default function AccordionShell({
  segments,
  bySegment,
  seriesById,
  layout,
}: AccordionShellProps) {
  const firstNonEmpty = useMemo(() => {
    const f = segments.find((s) => (bySegment[s.id] ?? []).length > 0);
    return f ? f.id : segments[0]?.id ?? null;
  }, [segments, bySegment]);

  const [open, setOpen] = useState<string | null>(firstNonEmpty);

  return (
    <div className="tlp-accordion">
      {segments.map((seg) => {
        const items = bySegment[seg.id] ?? [];
        const empty = items.length === 0;
        const isOpen = open === seg.id && !empty;
        return (
          <div
            key={seg.id}
            className={`tlp-acc-band${isOpen ? " is-open" : ""}${empty ? " is-empty" : ""}`}
            onClick={empty || isOpen ? undefined : () => setOpen(seg.id)}
            role={empty ? undefined : "button"}
            tabIndex={empty || isOpen ? undefined : 0}
            onKeyDown={
              empty || isOpen
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(seg.id);
                    }
                  }
            }
            aria-expanded={isOpen}
            aria-label={empty ? undefined : `Expand ${seg.name}, ${items.length} publications`}
          >
            <div className="tlp-acc-spine">
              <span className="tlp-acc-name">{seg.name}</span>
              <span className="tlp-acc-count">{items.length}</span>
            </div>
            <div className="tlp-acc-inner">
              {isOpen && (
                <SegmentView
                  seg={seg}
                  books={items}
                  layout={layout}
                  seriesById={seriesById}
                  compact
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
