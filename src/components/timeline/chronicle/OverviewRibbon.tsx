"use client";

/**
 * OverviewRibbon — the segmented era ribbon (shared entry surface). Each era
 * is a flex band whose width ∝ its dampened span; mini pins on the band's
 * centreline mark each book's setting date. Click/Enter a non-empty band to
 * descend. Ported from the prototype's `shells.jsx`; pin data comes from the
 * full client `bySegment` map (every book, unfiltered).
 */

import {
  formatScaleRange,
  makeSubProject,
  type RibbonSegment,
  type TimelineBook,
} from "@/lib/timeline";

interface OverviewRibbonProps {
  segments: RibbonSegment[];
  bySegment: Record<string, TimelineBook[]>;
  onPick: (seg: RibbonSegment, e: React.MouseEvent | React.KeyboardEvent) => void;
}

export default function OverviewRibbon({ segments, bySegment, onPick }: OverviewRibbonProps) {
  return (
    <div className="tlp-overview">
      <div className="tlp-ribbon">
        <div className="tlp-ribbon-axis" />
        {segments.map((seg, idx) => {
          const items = bySegment[seg.id] ?? [];
          const empty = items.length === 0;
          const sub = makeSubProject(seg);
          return (
            <div
              className={`tlp-era${empty ? " is-empty" : ""}`}
              key={seg.id}
              style={{ flexGrow: (seg.x1 - seg.x0) * 1000, animationDelay: `${idx * 80}ms` }}
              onClick={empty ? undefined : (e) => onPick(seg, e)}
              role={empty ? undefined : "button"}
              tabIndex={empty ? undefined : 0}
              onKeyDown={
                empty
                  ? undefined
                  : (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPick(seg, e);
                      }
                    }
              }
              aria-label={
                empty ? undefined : `Descend into ${seg.name}, ${items.length} publications`
              }
            >
              <span className="tlp-era-bracket tl" />
              <span className="tlp-era-bracket tr" />
              <span className="tlp-era-bracket bl" />
              <span className="tlp-era-bracket br" />
              <div className="tlp-era-top">
                <div className="tlp-era-name">{seg.name}</div>
                <div className="tlp-era-range">
                  {formatScaleRange(seg.canonStart, seg.canonEnd)}
                </div>
              </div>
              <div className="tlp-era-pins">
                {items.map((b) => (
                  <span
                    key={b.id}
                    className="tlp-pin"
                    style={{ left: `${sub(b.startY) * 100}%` }}
                  />
                ))}
              </div>
              <div className="tlp-era-count">
                <span className="n">{items.length}</span> {empty ? "—" : "books"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tlp-overview-hint">Select an era to descend into its chronology</div>
    </div>
  );
}
