"use client";

/**
 * ZoomInShell — the primary zoom model: a cross-dissolve "dive" from the
 * overview ribbon into one era's full segment view. Ported from the
 * prototype's `shells.jsx`, but the open era is URL-driven here (`?era=`)
 * rather than internal state: clicking a band captures the transform-origin
 * locally, then asks the parent to push the era URL.
 *
 * The dive is CSS-driven: the overview fades/scales out via an inline
 * transition on the (prop-derived) active flag, and the segment view plays a
 * keyed entrance animation (`tlp-dive-in`) from the captured origin when the
 * server round-trip returns with `activeSeg` set. The origin survives the
 * navigation because <ChronicleClient> stays mounted across a same-route push;
 * on a direct load / browser-back it defaults to centre.
 */

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RibbonSegment, SeriesRef, TimelineBook } from "@/lib/timeline";
import OverviewRibbon from "./OverviewRibbon";
import SegmentView from "./SegmentView";

interface ZoomInShellProps {
  segments: RibbonSegment[];
  bySegment: Record<string, TimelineBook[]>;
  activeSeg: RibbonSegment | null;
  segBooks: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
  layout: "lanes" | "sequence";
  onPick: (seg: RibbonSegment) => void;
  onBack: () => void;
  filterRail?: ReactNode;
}

export default function ZoomInShell({
  segments,
  bySegment,
  activeSeg,
  segBooks,
  seriesById,
  layout,
  onPick,
  onBack,
  filterRail,
}: ZoomInShellProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");

  function pick(seg: RibbonSegment, e: React.MouseEvent | React.KeyboardEvent) {
    const stage = stageRef.current?.getBoundingClientRect();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (stage) {
      const x = ((r.left + r.width / 2 - stage.left) / stage.width) * 100;
      const y = ((r.top + r.height / 2 - stage.top) / stage.height) * 100;
      setOrigin(`${x}% ${y}%`);
    }
    onPick(seg);
  }

  return (
    <div ref={stageRef} style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity .5s var(--ease), transform .55s var(--ease)",
          transformOrigin: origin,
          opacity: activeSeg ? 0 : 1,
          transform: activeSeg ? "scale(1.07)" : "scale(1)",
          pointerEvents: activeSeg ? "none" : "auto",
        }}
      >
        <OverviewRibbon segments={segments} bySegment={bySegment} onPick={pick} />
      </div>
      {activeSeg && (
        <div
          key={activeSeg.id}
          className="tlp-dive-in"
          style={{ position: "absolute", inset: 0, transformOrigin: origin }}
        >
          <SegmentView
            seg={activeSeg}
            books={segBooks}
            layout={layout}
            seriesById={seriesById}
            onBack={onBack}
            filterRail={filterRail}
          />
        </div>
      )}
    </div>
  );
}
