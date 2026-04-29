"use client";

/**
 * Overview — the zoomed-out luminous ribbon that spans every era. Click an
 * era band to navigate the page into EraDetail at that era. Ported from
 * `archive/prototype-v1/components/OverviewTimeline.jsx` with these changes:
 *
 *   - `eraTreatment` collapsed to BANDS (the brief asked for one; bands
 *     read more clearly as click-targets at the Hub aesthetic).
 *   - `clusterStyle` / `orientation` / `markerStyle` config props removed.
 *   - The aggressive RGB-split glitch on era hover from the prototype is
 *     not ported — see the impl report for the reasoning.
 *   - `drawProgress` parent-driven reveal removed; entry animation handled
 *     by CSS `fadeSlide` keyframes via `animation-delay` per layer.
 *   - `projectY` is built inside this component via `useMemo(makeProjectY)`
 *     because functions can't cross the RSC server→client boundary.
 *
 * Click handler signature is `() => void` for now; 2a.3 will wire the
 * book-pin click to the DetailPanel modal.
 */

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  type Era,
  type TimelineBook,
  formatM,
  hash,
  makeProjectY,
} from "@/lib/timeline";

interface OverviewProps {
  eras: readonly Era[];
  books: readonly TimelineBook[];
}

// SVG coordinate space — fixed; the wrapper scales it via preserveAspectRatio.
const W = 1000;
const H = 400;
const AX_Y = 210;          // ribbon vertical position
const AX_L = 40;
const AX_R = 960;
const AX_W = AX_R - AX_L;

export default function Overview({ eras, books }: OverviewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const projectY = useMemo(() => makeProjectY(eras), [eras]);
  const [hoveredEraId, setHoveredEraId] = useState<string | null>(null);

  const xOf = (y: number) => AX_L + projectY(y) * AX_W;

  // Empty data → render a visible cogitator-voice notice instead of a bare
  // ribbon. Most likely cause: the page's loadTimeline() catch-fallback fired
  // (Supabase pooler unreachable) or the eras table hasn't been seeded yet
  // for this environment.
  if (eras.length === 0) {
    return (
      <div className="timeline-overview timeline-overview-empty">
        <p className="era-empty">{"// CHRONICLE OFFLINE — REFERENCE TABLES UNREACHABLE"}</p>
        <p className="era-empty-hint">
          The eras table returned zero rows. Run <code>npm run db:seed</code> against
          this environment&apos;s <code>DATABASE_URL</code>, or check the Supabase pooler.
        </p>
      </div>
    );
  }

  function navigateToEra(eraId: string) {
    const merged = new URLSearchParams(params.toString());
    merged.set("era", eraId);
    router.push(`/timeline?${merged.toString()}`);
  }

  return (
    <div className="timeline-overview" aria-label="Timeline ribbon — click an era to zoom in">
      <svg
        className="timeline-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Vertical fade — peaks at the ribbon centreline. Stop opacities
             dialled up from the prototype's 0.18 because the prototype was
             tested on a less-dark background; against our `--bg-0` (#06080c)
             0.18 × the rect's 0.55 = 0.10 net, which reads as nothing. */}
          <linearGradient id="eraBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.42" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="ribbonGlow" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Era bands — clickable, hover-lit */}
        {eras.map((era, i) => {
          const x1 = xOf(era.start);
          const x2 = xOf(era.end);
          const hovered = hoveredEraId === era.id;
          return (
            <g
              key={era.id}
              className="era-seg"
              role="button"
              tabIndex={0}
              aria-label={`Open era ${era.name}`}
              onMouseEnter={() => setHoveredEraId(era.id)}
              onMouseLeave={() => setHoveredEraId(null)}
              onFocus={() => setHoveredEraId(era.id)}
              onBlur={() => setHoveredEraId(null)}
              onClick={() => navigateToEra(era.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateToEra(era.id);
                }
              }}
            >
              {/* Band fill — currentColor flips to --hl on hover. Idle ink
                 dialled up to --ink-1 (cream) so the band reads as a soft
                 horizontal smear rather than the muted brown that the
                 prototype's --ink-2 collapses to on this dark background. */}
              <rect
                x={x1}
                y={AX_Y - 60}
                width={x2 - x1}
                height={120}
                fill="url(#eraBandGrad)"
                className="era-seg-bar-fill"
                style={{
                  color: hovered ? "var(--hl)" : "var(--ink-1)",
                  opacity: hovered ? 1 : 0.78,
                  transition: "opacity .3s, color .3s",
                }}
              />
              {/* Top + bottom hover dashes */}
              <line
                x1={x1 + 4}
                x2={x2 - 4}
                y1={AX_Y - 58}
                y2={AX_Y - 58}
                stroke={hovered ? "var(--hl)" : "transparent"}
                strokeWidth="1"
                strokeDasharray="1 3"
                style={{ transition: "stroke .25s" }}
              />
              <line
                x1={x1 + 4}
                x2={x2 - 4}
                y1={AX_Y + 58}
                y2={AX_Y + 58}
                stroke={hovered ? "var(--hl)" : "transparent"}
                strokeWidth="1"
                strokeDasharray="1 3"
                style={{ transition: "stroke .25s" }}
              />
              {/* Era boundary divider — between bands only */}
              {i > 0 && (
                <line
                  x1={x1}
                  x2={x1}
                  y1={AX_Y - 80}
                  y2={AX_Y + 80}
                  stroke="var(--line-1)"
                  strokeDasharray="2 4"
                />
              )}
            </g>
          );
        })}

        {/* Main ribbon — sharp top line + diffuse glow underneath */}
        <line
          x1={AX_L}
          x2={AX_R}
          y1={AX_Y}
          y2={AX_Y}
          stroke="var(--hl)"
          strokeWidth="2"
          strokeLinecap="round"
          pointerEvents="none"
        />
        <line
          x1={AX_L}
          x2={AX_R}
          y1={AX_Y}
          y2={AX_Y}
          stroke="var(--hl)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.22"
          filter="url(#ribbonGlow)"
          pointerEvents="none"
        />
        <circle cx={AX_L} cy={AX_Y} r={2.5} fill="var(--hl)" pointerEvents="none" />
        <circle cx={AX_R} cy={AX_Y} r={2.5} fill="var(--hl)" pointerEvents="none" />

        {/* Era labels — alternate above/below with a 4-slot stagger */}
        {eras.map((era, i) => {
          const x = (xOf(era.start) + xOf(era.end)) / 2;
          const hovered = hoveredEraId === era.id;
          const slot = i % 4;
          const below = slot === 1 || slot === 3;
          const far = slot === 0 || slot === 3;
          const yOff = (below ? 1 : -1) * (far ? 62 : 32);
          const tickY = below ? 6 : -6;
          const tickEnd = below ? (far ? 56 : 26) : (far ? -56 : -22);
          return (
            <g key={`lbl-${era.id}`} transform={`translate(${x}, ${AX_Y})`} pointerEvents="none">
              <line
                x1="0"
                x2="0"
                y1={tickY}
                y2={tickEnd}
                stroke="var(--line-2)"
                strokeWidth="0.6"
                strokeDasharray="1 2"
              />
              <text
                className={clsx("era-label", hovered && "primary")}
                textAnchor="middle"
                y={yOff}
              >
                {era.name.toUpperCase()}
              </text>
              <text className="era-years" textAnchor="middle" y={yOff + (below ? 13 : -12)}>
                {formatM(era.start)} — {formatM(era.end)}
              </text>
            </g>
          );
        })}

        {/* Book pins on the ribbon — inert this brief; 2a.3 wires the click */}
        {books.map((book) => {
          const midY = (book.startY + book.endY) / 2;
          const x = xOf(midY);
          const baseHash = book.series ? hash(book.series.id) : hash(book.id);
          const yOff = book.series ? (baseHash % 7) - 3 : (baseHash % 5) - 2;
          return (
            <g
              key={book.id}
              className="book-node"
              transform={`translate(${x}, ${AX_Y + yOff})`}
              pointerEvents="none"
            >
              <circle className="book-node-halo" r="7" />
              <circle className="book-node-dot" r={2.4} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
