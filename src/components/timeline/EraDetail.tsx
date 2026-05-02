"use client";

/**
 * EraDetail — zoomed-in view of one era. Renders header (kicker, name, tone,
 * meta stats), axis ticks, series tracks (packed in PCT-space) and standalone
 * book markers (dot variant), with prev/next era navigation. Wide eras
 * (>800 yr) get drag-to-pan over a 800-year window; narrow eras render
 * full-width with no scrubber needed.
 *
 * Ported from `archive/prototype-v1/components/EraView.jsx` with these slim
 * adaptations:
 *   - `markerStyle` is fixed to `dot` (the other variants need FactionGlyph;
 *     they land in 2a.2).
 *   - Cluster fly-out removed — no filters this brief means standalone
 *     temporal clustering wouldn't carry useful information; we render every
 *     standalone as its own node, which also keeps the click handler simple
 *     for 2a.3.
 *   - Entry-rail highlight removed (depends on EntryRail, in 2a.1).
 *   - Pan-scrubber chrome simplified — track + thumb stay, the prototype's
 *     hint copy is preserved as-is (it's already in the cogitator voice).
 *   - Prev/next navigation uses `<Link>` so the buttons work without JS.
 *   - Empty-era state renders header + axis + a cogitator-terminal caption.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  type Era,
  type SeriesRef,
  type TimelineBook,
  formatM,
} from "@/lib/timeline";

interface EraDetailProps {
  era: Era;
  eras: readonly Era[];
  books: readonly TimelineBook[];
  /** Series index, used to look up display names for series tracks. */
  seriesById: Readonly<Record<string, SeriesRef>>;
}

interface SeriesGroup {
  kind: "series";
  id: string;
  books: TimelineBook[];
  start: number;
  end: number;
  track: number;
}

interface StandaloneNode {
  kind: "standalone";
  id: string;
  book: TimelineBook;
  start: number;
  end: number;
}

type Group = SeriesGroup | StandaloneNode;

const WIDE_THRESHOLD = 800;        // year-span beyond which we pan
const TRACK_TOP = 110;             // CSS px from top of `.tracks` to first track
const TRACK_GAP_PCT = 5.0;         // PCT-space minimum gap between adjacent series
const DOT_RADIUS_PCT = 2.5;        // visual radius of a standalone dot in PCT

export default function EraDetail({ era, eras, books, seriesById }: EraDetailProps) {
  const eraIdx = useMemo(() => eras.findIndex((e) => e.id === era.id), [eras, era.id]);
  const prevEra = eraIdx > 0 ? eras[eraIdx - 1] : null;
  const nextEra = eraIdx >= 0 && eraIdx < eras.length - 1 ? eras[eraIdx + 1] : null;

  // Books in this era — strict editorial match on `primaryEraId` (Stufe 2c.0).
  // The previous midpoint ±5 leak is gone: every book belongs to exactly one
  // era, picked by Cowork or by the Phase-4 ingestion pipeline. startY/endY
  // remain the source of axis placement and the kicker range string, but
  // never feed bucketing again.
  const eraBooks = useMemo(
    () => books.filter((b) => b.primaryEraId === era.id),
    [books, era.id],
  );

  // Full view span: era + 4% pad on each side so books at era boundaries don't
  // sit flush against the ends of the axis.
  const fullPadY = era.end === era.start ? 1 : 0.04 * (era.end - era.start);
  const fullStart = era.start - fullPadY;
  const fullEnd = era.end + fullPadY;
  const fullSpan = fullEnd - fullStart;

  const isWide = fullSpan > WIDE_THRESHOLD;
  const windowFrac = isWide ? Math.min(1, WIDE_THRESHOLD / fullSpan) : 1;

  const [panFrac, setPanFrac] = useState(0);
  const dragRef = useRef<{ startX: number; startPan: number; areaW: number } | null>(null);
  const trackAreaRef = useRef<HTMLDivElement | null>(null);
  // Pan/drag state resets across era changes via the parent's `key={era.id}`
  // remount — that's cheaper than a setState-in-effect reset and keeps the
  // ref / window listener lifecycle clean.

  const clampPan = useCallback(
    (v: number) => Math.max(0, Math.min(1 - windowFrac, v)),
    [windowFrac],
  );

  const vStart = fullStart + clampPan(panFrac) * fullSpan;
  const vEnd = vStart + windowFrac * fullSpan;
  const vSpan = vEnd - vStart;
  const pctOf = useCallback((y: number) => ((y - vStart) / vSpan) * 100, [vStart, vSpan]);

  // Pan handlers ----------------------------------------------------------

  const onDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isWide) return;
      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const startPan = clampPan(panFrac);
      const areaW = trackAreaRef.current?.offsetWidth ?? 1;
      dragRef.current = { startX, startPan, areaW };
      if ("preventDefault" in e) e.preventDefault();
    },
    [isWide, panFrac, clampPan],
  );

  useEffect(() => {
    if (!isWide) return;
    function move(e: MouseEvent | TouchEvent) {
      if (!dragRef.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const dx = dragRef.current.startX - x;
      const panDelta = (dx / dragRef.current.areaW) * windowFrac;
      setPanFrac(clampPan(dragRef.current.startPan + panDelta));
    }
    function end() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [isWide, windowFrac, clampPan]);

  // Track packing --------------------------------------------------------
  // Series occupy horizontal tracks; standalones live on a "spine" below.
  const { groups, trackCount } = useMemo(() => {
    const series: Record<string, SeriesGroup> = {};
    const standalones: StandaloneNode[] = [];
    for (const b of eraBooks) {
      if (b.series) {
        const sid = b.series.id;
        const g =
          series[sid] ??
          (series[sid] = { kind: "series", id: sid, books: [], start: Infinity, end: -Infinity, track: 0 });
        g.books.push(b);
        if (b.startY < g.start) g.start = b.startY;
        if (b.endY > g.end) g.end = b.endY;
      } else {
        standalones.push({
          kind: "standalone",
          id: `std-${b.id}`,
          book: b,
          start: b.startY,
          end: b.endY,
        });
      }
    }
    standalones.sort((a, b) => (a.start + a.end) / 2 - (b.start + b.end) / 2);
    const all: Group[] = [...Object.values(series), ...standalones].sort(
      (a, b) => a.start - b.start,
    );

    // PCT-space track packing — only series participate; standalones go to the spine.
    const trackEnds: number[] = [];
    for (const g of all) {
      if (g.kind !== "series") continue;
      const ps = pctOf(g.start);
      const pe = pctOf(g.end);
      let placed = false;
      for (let i = 0; i < trackEnds.length; i++) {
        if (trackEnds[i] + TRACK_GAP_PCT <= ps) {
          g.track = i;
          trackEnds[i] = pe;
          placed = true;
          break;
        }
      }
      if (!placed) {
        g.track = trackEnds.length;
        trackEnds.push(pe);
      }
    }

    return { groups: all, trackCount: Math.max(1, trackEnds.length) };
  }, [eraBooks, pctOf]);

  const TRACK_H = Math.max(56, Math.min(110, (440 - TRACK_TOP) / Math.max(1, trackCount)));

  // Axis ticks -----------------------------------------------------------
  const ticks = useMemo(() => {
    const arr: number[] = [];
    const step = vSpan < 2 ? 0.5 : vSpan < 10 ? 1 : vSpan < 100 ? 10 : 100;
    const first = Math.ceil(vStart / step) * step;
    for (let y = first; y <= vEnd; y += step) arr.push(y);
    return arr;
  }, [vStart, vEnd, vSpan]);

  const eraNameParts = era.name.split(/\s+/);
  const eraNameLead = eraNameParts[0];
  const eraNameRest = eraNameParts.slice(1).join(" ");

  return (
    <div className="era-detail">
      {prevEra && (
        <Link
          href={`/timeline?era=${prevEra.id}`}
          className="era-detail-nav-prev"
          aria-label={`Previous era: ${prevEra.name}`}
          title={prevEra.name}
        >
          <span className="en-arrow" aria-hidden>
            ◂
          </span>
          <span className="en-label">{prevEra.name}</span>
        </Link>
      )}
      {nextEra && (
        <Link
          href={`/timeline?era=${nextEra.id}`}
          className="era-detail-nav-next"
          aria-label={`Next era: ${nextEra.name}`}
          title={nextEra.name}
        >
          <span className="en-label">{nextEra.name}</span>
          <span className="en-arrow" aria-hidden>
            ▸
          </span>
        </Link>
      )}

      <header className="era-detail-header">
        <div>
          <Link href="/timeline" className="era-back" aria-label="Back to timeline survey">
            <span aria-hidden>◂</span> Survey-mode
          </Link>
          <p className="era-kicker">
            EXCERPTUM · {formatM(era.start)}–{formatM(era.end)}
          </p>
          <h1 className="era-name">
            <em>{eraNameLead}</em>
            {eraNameRest ? ` ${eraNameRest}` : ""}
          </h1>
          {era.tone && <p className="era-tone">{era.tone}</p>}
        </div>
        <div className="era-meta" aria-label="Era metrics">
          <div className="em-stat">
            <span className="n">{String(eraBooks.length).padStart(2, "0")}</span>
            <span className="l">Volumes</span>
          </div>
          <div className="em-stat">
            <span className="n">{String(groups.length).padStart(2, "0")}</span>
            <span className="l">Arcs</span>
          </div>
        </div>
      </header>

      {eraBooks.length === 0 ? (
        <p className="era-empty">{"// EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH"}</p>
      ) : (
        <>
          {/* Axis */}
          <div className="track-axis" style={{ top: TRACK_TOP - 30 }}>
            {ticks.map((t) => (
              <div key={t} className="track-axis-tick" style={{ left: `${pctOf(t)}%` }}>
                {formatM(t)}
              </div>
            ))}
          </div>

          {/* Standalone spine sits below the tracks */}
          <div
            className="standalone-spine"
            style={{ top: TRACK_TOP + trackCount * TRACK_H + 28 }}
          />

          <div
            ref={trackAreaRef}
            className={clsx("tracks", isWide && "pannable")}
            style={{ top: TRACK_TOP }}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            {groups.map((g, gi) => {
              const staggerDelay = `${gi * 0.08}s`;
              if (g.kind === "series") {
                const seriesMeta = seriesById[g.id];
                const top = g.track * TRACK_H;
                const leftPct = pctOf(g.start);
                const widthPct = pctOf(g.end) - pctOf(g.start);
                return (
                  <div
                    key={g.id}
                    className="series-bar"
                    style={{
                      top,
                      left: `${leftPct}%`,
                      width: `${Math.max(0.5, widthPct)}%`,
                      animation: `fadeSlide .7s ${staggerDelay} backwards`,
                    }}
                  >
                    <div className="sb-spine" />
                    <div className="sb-end left" />
                    <div className="sb-end right" />
                    <div className="series-label">
                      <span className="dot" aria-hidden>
                        ◆
                      </span>
                      {seriesMeta?.name ?? g.id}
                    </div>
                    {g.books
                      .slice()
                      .sort((a, b) => (a.startY + a.endY) / 2 - (b.startY + b.endY) / 2)
                      .map((book) => {
                        const mid = (book.startY + book.endY) / 2;
                        const relPct =
                          widthPct > 0 ? ((pctOf(mid) - leftPct) / widthPct) * 100 : 50;
                        return (
                          <BookDot
                            key={book.id}
                            book={book}
                            style={{
                              left: `${relPct}%`,
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        );
                      })}
                  </div>
                );
              }
              // Standalone — solitary book on the spine, with a small jitter so
              // adjacent ones don't sit on the same y.
              const mid = (g.start + g.end) / 2;
              const midPct = pctOf(mid);
              const jitter = gi % 3 === 0 ? 0 : gi % 3 === 1 ? -18 : 18;
              const minHeight = Math.abs(jitter) + 6;
              return (
                <div
                  key={g.id}
                  className="standalone-node"
                  style={
                    {
                      left: `${midPct}%`,
                      bottom: 48,
                      "--jitter": `${jitter}px`,
                      animation: `fadeSlide .55s ${staggerDelay} backwards`,
                    } as React.CSSProperties
                  }
                >
                  <div className="sn-tick" style={{ minHeight }} />
                  <BookDot book={g.book} />
                </div>
              );
            })}
          </div>

          {isWide && (
            <div className="pan-scrubber" aria-hidden>
              <div className="pan-track">
                <div
                  className="pan-thumb"
                  style={{
                    left: `${(clampPan(panFrac) / Math.max(0.0001, 1 - windowFrac)) * (100 - windowFrac * 100)}%`,
                    width: `${windowFrac * 100}%`,
                  }}
                />
              </div>
              <div className="pan-hint">◂ drag to pan ▸</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface BookDotProps {
  book: TimelineBook;
  style?: React.CSSProperties;
}

function BookDot({ book, style }: BookDotProps) {
  return (
    <div
      className="book-marker"
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        // 2a.3 wires DetailPanel here. For now: a console log so dev can
        // verify the click path reaches before that brief lands.
        if (process.env.NODE_ENV === "development") {
          console.log("[EraDetail] book click:", book.slug);
        }
      }}
    >
      <div className="bm-dot" />
      <div className="bm-tooltip">
        <div className="tt-title">{book.title}</div>
        <div className="tt-meta">
          {book.authors.length > 0 ? `${book.authors.join(", ")} · ` : ""}
          {formatM((book.startY + book.endY) / 2)}
        </div>
      </div>
    </div>
  );
}
