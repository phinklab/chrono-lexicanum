"use client";

/**
 * LayoutLanes — one lane per series (standalones share the bottom lane), with
 * greedy time-axis clustering so a dense run (e.g. a dozen novellas dated to
 * the same year) folds into one expandable "+N" chip instead of an unreadable
 * pile. Ported from the prototype's `layouts.jsx`, adapted to the live
 * `TimelineBook` shape: lanes group by `series.id` and resolve display names
 * via `seriesById`; the prototype's global `seq` tiebreaker becomes a title
 * comparison.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatMScale,
  makeSubProject,
  type RibbonSegment,
  type SeriesRef,
  type TimelineBook,
} from "@/lib/timeline";
import { useChronicle } from "./context";
import BookNode from "./BookNode";

const STANDALONE_KEY = "__standalone__";
const LANE_MERGE_T = 0.022; // ~2.2% of the track: roughly one marker + gap
const LANE_SPAN_CAP = 0.06; // a cluster never spans more than ~6% of the era

/** Sub-projection (0..1) padded into a track so edge columns don't clip. */
const padX = (t: number) => `${(4 + t * 92).toFixed(3)}%`;

const byStartThenTitle = (a: TimelineBook, b: TimelineBook) =>
  a.startY - b.startY || a.title.localeCompare(b.title);

interface Cluster {
  key: string;
  t: number;
  items: TimelineBook[];
}

function clusterizeLane(items: TimelineBook[], sub: (y: number) => number): Cluster[] {
  const sorted = [...items].sort(byStartThenTitle);
  const out: Array<{ firstT: number; lastT: number; items: TimelineBook[] }> = [];
  let cur: { firstT: number; lastT: number; items: TimelineBook[] } | null = null;
  for (const b of sorted) {
    const t = sub(b.startY);
    if (cur && t - cur.lastT <= LANE_MERGE_T && t - cur.firstT <= LANE_SPAN_CAP) {
      cur.items.push(b);
      cur.lastT = t;
    } else {
      cur = { firstT: t, lastT: t, items: [b] };
      out.push(cur);
    }
  }
  return out.map((c, i) => ({
    key: `c${i}-${c.items[0].id}`,
    t: (c.firstT + c.lastT) / 2,
    items: c.items,
  }));
}

interface Lane {
  key: string;
  name: string;
  isStandalone: boolean;
  items: TimelineBook[];
  min: number;
  clusters: Cluster[];
}

interface PopState {
  items: TimelineBook[];
  x: number;
  top: number;
  bottom: number;
}

export default function LayoutLanes({
  seg,
  books,
  seriesById,
}: {
  seg: RibbonSegment;
  books: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
}) {
  const sub = useMemo(() => makeSubProject(seg), [seg]);

  const lanes: Lane[] = useMemo(() => {
    const m = new Map<string, TimelineBook[]>();
    for (const b of books) {
      const key = b.series?.id ?? STANDALONE_KEY;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(b);
    }
    const arr: Lane[] = Array.from(m.entries()).map(([key, items]) => {
      const sorted = [...items].sort(byStartThenTitle);
      const isStandalone = key === STANDALONE_KEY;
      return {
        key,
        name: isStandalone ? "Standalones" : seriesById[key]?.name ?? key,
        isStandalone,
        items: sorted,
        min: sorted[0].startY,
        clusters: clusterizeLane(sorted, sub),
      };
    });
    arr.sort((a, b) => {
      if (a.isStandalone) return 1;
      if (b.isStandalone) return -1;
      return a.min - b.min || a.name.localeCompare(b.name);
    });
    return arr;
  }, [books, sub, seriesById]);

  const [pop, setPop] = useState<PopState | null>(null);

  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pop]);

  return (
    <div className="tlp-lanes">
      <div className="tlp-lanes-axis">
        <div className="tlp-lanes-axis-pad" />
        <div className="tlp-lanes-axis-track">
          {sub.ticks.map((y, i) => (
            <div className="tlp-tick" key={`lt${i}`} style={{ left: padX(sub(y)) }}>
              <div className="tlp-tick-mark" />
              <div className="tlp-tick-label">{formatMScale(y)}</div>
            </div>
          ))}
        </div>
      </div>
      {lanes.map((lane) => (
        <div
          className={`tlp-lane${lane.isStandalone ? " is-standalones" : ""}`}
          key={lane.key}
        >
          <div className="tlp-lane-label" title={lane.name}>
            <span className="tlp-lane-name">{lane.name}</span>
            <span className="tlp-lane-count">{lane.items.length}</span>
          </div>
          <div className="tlp-lane-track">
            {lane.clusters.map((c) => (
              <span className="tlp-lane-node" key={c.key} style={{ left: padX(c.t) }}>
                {c.items.length === 1 ? (
                  <BookNode book={c.items[0]} />
                ) : (
                  <LaneClusterChip
                    items={c.items}
                    active={pop?.items === c.items}
                    onOpenCluster={(items, x, top, bottom) =>
                      setPop({ items, x, top, bottom })
                    }
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
      {pop && <ClusterPopover data={pop} onClose={() => setPop(null)} />}
    </div>
  );
}

function LaneClusterChip({
  items,
  active,
  onOpenCluster,
}: {
  items: TimelineBook[];
  active: boolean;
  onOpenCluster: (items: TimelineBook[], x: number, top: number, bottom: number) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const first = items[0];
  const last = items[items.length - 1];
  const range =
    first.startY === last.startY
      ? formatMScale(first.startY)
      : `${formatMScale(first.startY)}–${formatMScale(last.startY)}`;
  return (
    <button
      ref={ref}
      type="button"
      className={`tlp-cluster${active ? " is-active" : ""}`}
      aria-expanded={active}
      aria-label={`${items.length} books, ${range} — expand`}
      onClick={(e) => {
        e.stopPropagation();
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        onOpenCluster(items, r.left + r.width / 2, r.top, r.bottom);
      }}
    >
      <span className="tlp-cluster-dots" aria-hidden />
      <span className="tlp-cluster-n">{items.length}</span>
    </button>
  );
}

function ClusterPopover({ data, onClose }: { data: PopState; onClose: () => void }) {
  const ctx = useChronicle();
  const openDown = data.top < 320;
  const style: React.CSSProperties = openDown
    ? { left: `${data.x}px`, top: `${data.bottom + 10}px`, transform: "translateX(-50%)" }
    : { left: `${data.x}px`, top: `${data.top - 10}px`, transform: "translate(-50%,-100%)" };
  return (
    <>
      <div className="tlp-cluster-backdrop" onClick={onClose} />
      <div
        className={`tlp-cluster-pop${openDown ? " open-down" : ""}`}
        style={style}
        role="menu"
      >
        <div className="tlp-cluster-pop-head">{data.items.length} publications</div>
        <div className="tlp-cluster-pop-list">
          {data.items.map((b) => (
            <button
              type="button"
              className="tlp-cluster-pop-row"
              key={b.id}
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                ctx.onOpen(b);
              }}
            >
              <span className={`tlp-mark fmt-${b.fmt}`} />
              <span className="tlp-cluster-pop-title">{b.title}</span>
              <span className="tlp-cluster-pop-yr">{formatMScale(b.startY)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
