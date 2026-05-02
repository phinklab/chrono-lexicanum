"use client";

/**
 * Overview — the zoomed-out luminous ribbon that spans every era. Click an
 * era band to navigate the page into EraDetail at that era. Ported from
 * `archive/prototype-v1/components/OverviewTimeline.jsx`. Diffs from that
 * source documented inline; the load-bearing decisions:
 *
 *   - `eraTreatment` collapsed to BANDS — see session 011's report.
 *   - The prototype's RGB-split / displacement glitch on era hover IS now
 *     ported (brief 012 reverses session 011's call to skip it). Calibrated
 *     milder than the prototype: `feDisplacementMap scale=8` not 12, gentler
 *     keyframe transforms, ~420ms total — the brief explicitly invited
 *     dialing this back so it reads "buzzy electronic" rather than
 *     "synthwave music video".
 *   - Per-book ribbon pins removed (brief 012). At catalogue scale (~500
 *     books, Phase 4 projection) individual pins collapse into mush;
 *     replaced with one count badge per era. Individual books still appear
 *     in EraDetail. Cluster-style at scale belongs to the prototype's
 *     `cluster-node` / `cluster-flyout` machinery and is the future move
 *     for EraDetail's standalone spine.
 *   - Focus indicator on era bands: themed L-shaped corner brackets at each
 *     band corner, gated visible only on `:focus-visible`. Replaces the
 *     browser's white outline, echoes the Hub tile's `mt-corner` vocabulary.
 *
 * Click handler signature is `() => void` for now; 2a.3 will wire the
 * book-pin click in EraDetail to the DetailPanel modal.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  type Era,
  type TimelineBook,
  formatM,
  makeProjectY,
} from "@/lib/timeline";
import { buildEraUrl } from "@/lib/timelineUrl";

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

// Glitch lifetime. The CSS keyframe runs 420ms; the JS state is cleared a
// hair after so a re-hover within the window restarts cleanly.
const GLITCH_MS = 420;

export default function Overview({ eras, books }: OverviewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const projectY = useMemo(() => makeProjectY(eras), [eras]);
  const [hoveredEraId, setHoveredEraId] = useState<string | null>(null);
  const [glitchingEraId, setGlitchingEraId] = useState<string | null>(null);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const xOf = (y: number) => AX_L + projectY(y) * AX_W;

  // Per-era book counts via the editorial `primaryEraId` anchor (Stufe 2c.0).
  // No midpoint, no era-range lookup — every book lives in exactly one era,
  // chosen by Cowork or seeded by the Phase-4 ingestion pipeline. Books with
  // an empty/unknown primaryEraId are silently skipped (would only happen on
  // a seed/data mismatch — surfaces as a missing badge, not as a miscount).
  const eraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const era of eras) counts[era.id] = 0;
    for (const b of books) {
      if (counts[b.primaryEraId] !== undefined) {
        counts[b.primaryEraId] += 1;
      }
    }
    return counts;
  }, [eras, books]);

  useEffect(
    () => () => {
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
    },
    [],
  );

  function triggerGlitch(eraId: string) {
    if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
    setGlitchingEraId(eraId);
    glitchTimerRef.current = setTimeout(() => setGlitchingEraId(null), GLITCH_MS);
  }

  // Pre-warm the EraDetail RSC payload as soon as the user mouses an era
  // band, so the navigation feels instant when they actually click. Also
  // arms the glitch effect; we want both onEnter and onFocus to feel alive.
  function hoverEra(eraId: string) {
    setHoveredEraId(eraId);
    triggerGlitch(eraId);
    // Same URL helper as the click handler — prefetching the merged URL is
    // pointless if the click computes a different URL (filter-keys diverge).
    router.prefetch(buildEraUrl(eraId, new URLSearchParams(params.toString())));
  }

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
    // Drops the FilterRail axes from the URL — filter values are era-specific
    // (brief 029 constraint 5). Helper centralizes the strip-and-set so a
    // future Phase-4 nav surface can't quietly re-introduce the bug.
    router.push(buildEraUrl(eraId, new URLSearchParams(params.toString())));
  }

  return (
    <div className="timeline-overview" aria-label="Timeline ribbon — click an era to zoom in">
      <svg
        className="timeline-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Vertical fade peaking at the ribbon centreline. Two gradients:
             idle (subtle) and hover (loud) — switching the fill URL on
             hover gives a much more dramatic colour change than animating
             a single gradient's currentColor inheritance. */}
          <linearGradient id="eraBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.42" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eraBandGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.7" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="ribbonGlow" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id="bandHoverGlow" x="-5%" y="-25%" width="110%" height="150%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          {/* Glitch displacement filter. Turbulence drives a displacement map
             over the band's pixels; the colour matrix nudges red/blue
             channels apart for a chromatic-aberration tint. The keyframe
             below toggles this filter on for ~3 frames inside a 420ms window
             — the buzzy "the cogitator just felt your cursor" beat. */}
          <filter id="eraGlitch" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85 0.35"
              numOctaves="1"
              seed="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feColorMatrix
              type="matrix"
              values="1.3 0 0 0 -0.15
                      0 0.92 0 0 0
                      0 0 1.25 0 -0.08
                      0 0 0 1 0"
              in="displaced"
            />
          </filter>
        </defs>

        {/* Era bands — clickable, hover-lit, glitchy on enter */}
        {eras.map((era, i) => {
          const x1 = xOf(era.start);
          const x2 = xOf(era.end);
          const hovered = hoveredEraId === era.id;
          const glitching = glitchingEraId === era.id;
          return (
            <g
              key={era.id}
              className={clsx("era-seg", glitching && "glitching")}
              role="button"
              tabIndex={0}
              aria-label={`Open era ${era.name}`}
              onMouseEnter={() => hoverEra(era.id)}
              onMouseLeave={() => setHoveredEraId(null)}
              onFocus={() => hoverEra(era.id)}
              onBlur={() => setHoveredEraId(null)}
              onClick={() => navigateToEra(era.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateToEra(era.id);
                }
              }}
            >
              {/* Diffuse hover-glow rect underneath — only painted on hover,
                 blurred via SVG filter for a soft cyan halo behind the band. */}
              {hovered && (
                <rect
                  x={x1 - 4}
                  y={AX_Y - 70}
                  width={x2 - x1 + 8}
                  height={140}
                  fill="var(--hl)"
                  opacity="0.22"
                  filter="url(#bandHoverGlow)"
                  pointerEvents="none"
                />
              )}
              {/* Band fill — gradient swaps from idle to hover variant on
                 mouse enter. currentColor flips ink-1 (cream) → --hl (cyan). */}
              <rect
                x={x1}
                y={AX_Y - 60}
                width={x2 - x1}
                height={120}
                fill={`url(#${hovered ? "eraBandGradHover" : "eraBandGrad"})`}
                className="era-seg-bar-fill"
                style={{
                  color: hovered ? "var(--hl)" : "var(--ink-1)",
                  opacity: hovered ? 1 : 0.78,
                  transition: "opacity .3s, color .3s",
                }}
              />
              {/* Top + bottom edge accents — solid bright on hover, dashed
                 cyan-faint when idle, so each band always has a visible top
                 and bottom edge framing it as a click-target. */}
              <line
                x1={x1 + 4}
                x2={x2 - 4}
                y1={AX_Y - 58}
                y2={AX_Y - 58}
                stroke={hovered ? "var(--hl)" : "var(--line-2)"}
                strokeWidth={hovered ? 1.4 : 0.8}
                strokeDasharray={hovered ? "0" : "1 3"}
                style={{ transition: "stroke .25s, stroke-width .25s" }}
              />
              <line
                x1={x1 + 4}
                x2={x2 - 4}
                y1={AX_Y + 58}
                y2={AX_Y + 58}
                stroke={hovered ? "var(--hl)" : "var(--line-2)"}
                strokeWidth={hovered ? 1.4 : 0.8}
                strokeDasharray={hovered ? "0" : "1 3"}
                style={{ transition: "stroke .25s, stroke-width .25s" }}
              />
              {/* Focus brackets — four L-shapes, one per band corner. CSS-only
                 visibility on `:focus-visible` so keyboard tab-nav gets a
                 clear themed indicator while the band stays clean on
                 mouse-click and idle. Same vocabulary as the Hub tile's
                 cross-bracketed `.mt-corner` pattern. */}
              <g className="era-seg-brackets" pointerEvents="none">
                <polyline
                  points={`${x1 + 2},${AX_Y - 52} ${x1 + 2},${AX_Y - 60} ${x1 + 10},${AX_Y - 60}`}
                />
                <polyline
                  points={`${x2 - 10},${AX_Y - 60} ${x2 - 2},${AX_Y - 60} ${x2 - 2},${AX_Y - 52}`}
                />
                <polyline
                  points={`${x1 + 2},${AX_Y + 52} ${x1 + 2},${AX_Y + 60} ${x1 + 10},${AX_Y + 60}`}
                />
                <polyline
                  points={`${x2 - 10},${AX_Y + 60} ${x2 - 2},${AX_Y + 60} ${x2 - 2},${AX_Y + 52}`}
                />
              </g>
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

        {/* Era labels — alternate above/below with a 4-slot stagger. Each era
           with at least one book gets a count badge — the per-era density
           signal that replaces the prototype's per-book ribbon pins. */}
        {eras.map((era, i) => {
          const x = (xOf(era.start) + xOf(era.end)) / 2;
          const hovered = hoveredEraId === era.id;
          const slot = i % 4;
          const below = slot === 1 || slot === 3;
          const far = slot === 0 || slot === 3;
          const yOff = (below ? 1 : -1) * (far ? 62 : 32);
          const tickY = below ? 6 : -6;
          const tickEnd = below ? (far ? 56 : 26) : (far ? -56 : -22);
          const count = eraCounts[era.id] ?? 0;
          const countYOff = yOff + (below ? 30 : -30);
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
              {count > 0 && (
                <g className="era-count" transform={`translate(0, ${countYOff})`}>
                  <rect className="bg" x="-34" y="-8" width="68" height="16" rx="0" />
                  <text className="num" textAnchor="middle" y="3.5">
                    {String(count).padStart(3, "0")} VOLUMES
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
