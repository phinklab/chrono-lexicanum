"use client";

// Segmentum wedges + sub-sector arcs + concentric rings + tick marks +
// spokes + radar sweep + astronomican + solar core + auspex ping.
// Plain SVG. The grouping mirrors the prototype's GalacticDisc top-down order
// so transitions read consistently when `dived` toggles.

import { polar, wedgePath } from "@/lib/galaxy/coords";
import { SEGMENTUMS_BASE, SUB_SECTORS } from "@/lib/galaxy/data";
import { segOuterAt, silhouettePathD } from "@/lib/galaxy/stars";
import type { SegmentumId, Segmentum, Theme } from "@/lib/galaxy/types";

interface DiscWedgesProps {
  theme: Theme;
  segments: readonly Segmentum[];
  dived: boolean;
  divedSeg: SegmentumId | null;
  hoveredSeg: SegmentumId | null;
  setHoveredSeg: (id: SegmentumId | null) => void;
  onDive: (id: SegmentumId) => void;
  userZoom: number;
  astronomican: boolean;
  animsOn: boolean;
}

export default function DiscWedges({
  theme,
  segments,
  dived,
  divedSeg,
  hoveredSeg,
  setHoveredSeg,
  onDive,
  userZoom,
  astronomican,
  animsOn,
}: DiscWedgesProps) {
  const t = theme;
  const nonSolar = segments.filter((s) => s.id !== "solar");
  const maxOuter = nonSolar.length ? Math.max(...nonSolar.map((s) => s.outer), 1.0) : 1.0;

  return (
    <>
      {/* Radar sweep — clipped to the silhouette. The clipPath itself is
          declared inside <defs> in GalacticDisc; we just reference it.
          animsOn pauses the spin and fades the wedge out when diving into a
          segmentum; ease-in restores it ~1s after surfacing. */}
      <g
        clipPath="url(#mapDiscClip)"
        opacity={animsOn ? (dived ? 0.5 : 0.85) : 0}
        style={{ transition: "opacity 1s ease-in" }}
      >
        <g
          style={{
            transformOrigin: "50px 50px",
            animation: "mapRadarSpin 24s linear infinite",
            animationPlayState: animsOn ? "running" : "paused",
          }}
        >
          {(() => {
            const wedgeR = maxOuter * 50;
            const [lx, ly] = polar(maxOuter, 0);
            const [tx, ty] = polar(maxOuter, 68);
            return (
              <>
                <path
                  d={`M 50 50 L ${lx} ${ly} A ${wedgeR} ${wedgeR} 0 0 1 ${tx} ${ty} Z`}
                  fill="url(#mapSweepFan)"
                  opacity="0.65"
                />
                <line
                  x1="50"
                  y1="50"
                  x2={lx}
                  y2={ly}
                  stroke={t.accent}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.55"
                />
              </>
            );
          })()}
        </g>
      </g>

      {/* Outer reach glow — fades when dived or when zoomed in close. */}
      <path
        d={silhouettePathD(segments, 0.96)}
        fill="url(#mapDiscGrad)"
        opacity={dived ? 0 : Math.max(0, 1 - (userZoom - 1) * 1.4)}
        style={{ transition: "opacity .4s" }}
      />

      {/* Astronomican — Emperor's psychic lighthouse. Toggled via tweaks. */}
      <g opacity={astronomican ? 1 : 0} style={{ transition: "opacity 0.6s ease-out" }} pointerEvents="none">
        <g clipPath="url(#mapDiscClip)">
          <circle cx="50" cy="50" r={maxOuter * 50} fill="url(#mapAstronomicanGrad)" />
          {[0.25, 0.45, 0.65].map((rr, i) => (
            <circle
              key={rr}
              cx="50"
              cy="50"
              r={rr * 50}
              fill="none"
              stroke="#ffd070"
              strokeOpacity={0.18 - i * 0.04}
              strokeWidth="1"
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <circle cx="50" cy="50" r="0.9" fill="#fff2c0" opacity="0.95">
            {animsOn && <animate attributeName="opacity" values="0.7;1;0.7" dur="3.6s" repeatCount="indefinite" />}
          </circle>
          <circle cx="50" cy="50" r="3.5" fill="none" stroke="#ffd560" strokeOpacity="0.5" strokeWidth="0.15" />
        </g>
      </g>

      {/* Concentric grid rings + dashed silhouette + spokes. */}
      <g opacity={dived ? 0 : 1} style={{ transition: "opacity .8s" }}>
        {[0.18, 0.32, 0.5, 0.7].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r * 50}
            fill="none"
            stroke={t.grid}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 5"
          />
        ))}
        <path
          d={silhouettePathD(segments, 1.0)}
          fill="none"
          stroke={t.grid}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 5"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const [x, y] = polar(segOuterAt(segments, a) * 0.98, a);
          return (
            <line
              key={a}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke={t.grid}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="2 6"
            />
          );
        })}
      </g>

      {/* Compass tick marks + cardinal degree labels. */}
      <g opacity={dived ? 0 : 0.85} style={{ transition: "opacity .8s" }}>
        {Array.from({ length: 72 }, (_, i) => i * 5).map((a) => {
          const major = a % 30 === 0;
          const edge = segOuterAt(segments, a);
          const r0 = edge - (major ? 0.05 : 0.028);
          const r1 = edge - 0.006;
          const [x0, y0] = polar(r0, a);
          const [x1, y1] = polar(r1, a);
          return (
            <line
              key={a}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={t.primary}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity={major ? 0.85 : 0.4}
            />
          );
        })}
        {[
          { a: 0, txt: "000" },
          { a: 90, txt: "090" },
          { a: 180, txt: "180" },
          { a: 270, txt: "270" },
        ].map((m) => {
          const [x, y] = polar(segOuterAt(segments, m.a) + 0.06, m.a);
          return (
            <text
              key={m.a}
              x={x}
              y={y}
              fill={t.primary}
              opacity="0.75"
              fontFamily={t.fontMono}
              fontSize="1.8"
              letterSpacing="0.15"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {m.txt}
            </text>
          );
        })}
      </g>

      {/* Segmentum wedges (non-solar) — clickable on the galaxy view. */}
      {segments
        .filter((s) => s.id !== "solar")
        .map((s) => {
          const hovered = hoveredSeg === s.id;
          const isActive = s.id === divedSeg;
          const visible = !dived || isActive;
          const clickable = !dived;
          const zoomFade = Math.max(0, 1 - (userZoom - 1) * 1.4);
          const baseFill = dived ? 0 : (hovered ? 0.14 : 0.06) * zoomFade;
          return (
            <g
              key={s.id}
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity .8s" }}
              onMouseEnter={() => setHoveredSeg(s.id)}
              onMouseLeave={() => setHoveredSeg(null)}
              onClick={() => clickable && onDive(s.id)}
            >
              <path
                d={wedgePath(s.inner, s.outer, s.a0, s.a1)}
                fill={t.primary}
                fillOpacity={baseFill}
                stroke={t.stroke}
                strokeWidth={hovered ? 2 : 1}
                vectorEffect="non-scaling-stroke"
                style={{ cursor: clickable ? "pointer" : "default", transition: "all 0.3s" }}
              />
              <path
                d={wedgePath(s.inner, s.inner + 0.005, s.a0, s.a1)}
                fill="none"
                stroke={t.primary}
                strokeOpacity="0.4"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

      {/* Sub-sector arcs — denser detail within each segmentum. Hidden when
          a non-matching segmentum is dived. */}
      <g opacity={dived ? 0.85 : 0.6} style={{ transition: "opacity .8s" }}>
        {SUB_SECTORS.map((ss, i) => {
          const visible = !dived || ss.seg === divedSeg;
          return (
            <g key={i} opacity={visible ? 1 : 0} style={{ transition: "opacity .8s" }}>
              <path
                d={wedgePath(ss.r0, ss.r1, ss.a0, ss.a1)}
                fill="none"
                stroke={t.strokeFaint}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
      </g>

      {/* Segmentum-Solar core — central glow + Sol pinprick. */}
      <g
        opacity={dived ? 0 : Math.max(0, 1 - (userZoom - 1) * 1.2)}
        style={{ transition: "opacity .4s" }}
      >
        <circle
          cx="50"
          cy="50"
          r={0.18 * 50}
          fill="none"
          stroke={t.stroke}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="50" cy="50" r="2.4" fill="url(#mapCoreGlow)" />
        <circle cx="50" cy="50" r="1.1" fill={t.accent} opacity="0.4" />
        <circle cx="50" cy="50" r="0.55" fill={t.accent} />
      </g>

      {/* Slow auspex ping from the galactic core. SMIL <animate> doesn't
          respond to CSS animation-play-state, so we conditionally mount the
          group on animsOn — that restarts the rings from r=0 on resume,
          which reads cleanly as a fresh ping. The opacity transition gives
          the same ease-in feel as the radar sweep. */}
      {!dived && animsOn && (
        <g opacity="0.6" pointerEvents="none" style={{ transition: "opacity 1s ease-in" }}>
          <circle cx="50" cy="50" r="0" fill="none" stroke={t.primary} strokeWidth="1" vectorEffect="non-scaling-stroke">
            <animate attributeName="r" from="0" to="48" dur="9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.3;0" dur="9s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="0" fill="none" stroke={t.primary} strokeWidth="1" vectorEffect="non-scaling-stroke">
            <animate attributeName="r" from="0" to="48" dur="9s" begin="4.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.3;0" dur="9s" begin="4.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Reference imports kept reachable (silence "unused" warnings if any). */}
      {SEGMENTUMS_BASE.length === 0 && <g />}
    </>
  );
}
