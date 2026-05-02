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
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  type Era,
  type FilterOption,
  type SeriesRef,
  type TimelineBook,
  formatM,
} from "@/lib/timeline";
import {
  buildBookUrl,
  buildEraUrl,
  parseFilterParams,
} from "@/lib/timelineUrl";
import FilterRail from "./FilterRail";

interface EraDetailProps {
  era: Era;
  eras: readonly Era[];
  /** Books to render in this era. Pre-filtered server-side by `loadEraBooks`
   *  (Stufe 2a.2): era anchor + active FilterRail axes. EraDetail no longer
   *  re-filters client-side; the prop IS the rendered set. */
  books: readonly TimelineBook[];
  /** Series index, used to look up display names for series tracks. */
  seriesById: Readonly<Record<string, SeriesRef>>;
  /** FilterRail option lists, derived server-side per era unconditional on
   *  current filter selection so the option set stays stable while toggling. */
  availableFactions: readonly FilterOption[];
  availableLengthTiers: readonly FilterOption[];
  /** Era totals for the rail's `X / Y volumes` headline + empty-state branching. */
  totalInEra: number;
  matchedCount: number;
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

export default function EraDetail({
  era,
  eras,
  books,
  seriesById,
  availableFactions,
  availableLengthTiers,
  totalInEra,
  matchedCount,
}: EraDetailProps) {
  const sp = useSearchParams();
  const eraIdx = useMemo(() => eras.findIndex((e) => e.id === era.id), [eras, era.id]);
  const prevEra = eraIdx > 0 ? eras[eraIdx - 1] : null;
  const nextEra = eraIdx >= 0 && eraIdx < eras.length - 1 ? eras[eraIdx + 1] : null;

  // Books in this era — pre-filtered server-side by `loadEraBooks` (Stufe 2a.2).
  // The previous client-side `books.filter((b) => b.primaryEraId === era.id)`
  // is gone; the loader applies era anchor + faction/length filters via SQL,
  // which keeps the pattern tradable to Phase-3 ingestion scale (constraint 8).
  const eraBooks = books;
  const hasActiveFilters = useMemo(() => {
    const { factionIds, lengthIds } = parseFilterParams(
      new URLSearchParams(sp.toString()),
    );
    return factionIds.length > 0 || lengthIds.length > 0;
  }, [sp]);
  const isEmptyDueToFilter = matchedCount === 0 && totalInEra > 0;

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
          href={buildEraUrl(prevEra.id, new URLSearchParams(sp.toString()))}
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
          href={buildEraUrl(nextEra.id, new URLSearchParams(sp.toString()))}
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

      <FilterRail
        era={era}
        availableFactions={availableFactions}
        availableLengthTiers={availableLengthTiers}
        totalInEra={totalInEra}
        matchedCount={matchedCount}
      />

      {eraBooks.length === 0 ? (
        isEmptyDueToFilter ? (
          <div className="era-empty-block">
            <p className="era-empty">
              {"// EXCERPTUM CONSTRAINED — NO VOLUMES MATCH ACTIVE FILTERS"}
            </p>
            <Link
              href={buildEraUrl(era.id, new URLSearchParams(sp.toString()))}
              className="era-empty-reset"
              replace
              scroll={false}
            >
              × Clear filters
            </Link>
          </div>
        ) : (
          <p className="era-empty">{"// EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH"}</p>
        )
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
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <button
      type="button"
      id={`book-marker-${book.slug}`}
      className="book-marker"
      style={style}
      onClick={(e) => {
        // stopPropagation keeps the click from reaching the pan area's
        // onMouseDown — without it, opening a book inside a wide era would
        // also start a drag. <Link> would still need this, no win in
        // converting the trigger.
        e.stopPropagation();
        router.push(
          buildBookUrl(
            book.primaryEraId,
            book.slug,
            new URLSearchParams(sp.toString()),
          ),
        );
      }}
    >
      <span className="bm-dot" aria-hidden="true" />
      <span className="bm-tooltip" aria-hidden="true">
        <span className="tt-title">{book.title}</span>
        <span className="tt-meta">
          {book.authors.length > 0 ? `${book.authors.join(", ")} · ` : ""}
          {formatM((book.startY + book.endY) / 2)}
        </span>
      </span>
    </button>
  );
}
