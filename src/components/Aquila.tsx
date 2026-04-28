/**
 * Aquila — Imperial two-headed eagle silhouette.
 * Ported from archive/prototype-v1/components/Aquila.jsx
 *
 * Design intent (from the prototype's comments):
 *  - Wings: radial fan of tapered rays, HORIZONTAL spread (not drooping)
 *  - Two heads: clear round profiles with beaks pointing outward-up
 *  - Single compact body in the center
 *  - Proportions tuned to the canonical Warhammer Aquila silhouette
 *
 * Migration notes:
 *  - `window.Aquila = ...` becomes a named export.
 *  - JSX → TSX with explicit prop types.
 *  - Component is pure & deterministic → safe to render server-side. No
 *    'use client' directive needed.
 */
import { type SVGProps } from "react";

export interface AquilaProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> {
  /** Pixel width. Height is auto-computed at 50% of width to preserve ratio. */
  size?: number;
}

export function Aquila({ size = 180, className, ...rest }: AquilaProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.5}
      viewBox="0 0 280 140"
      fill="currentColor"
      aria-hidden="true"
      style={{ overflow: "visible" }}
      {...rest}
    >
      {/* WING RAYS */}
      <g>
        {makeWing("L")}
        {makeWing("R")}
      </g>

      {/* SHOULDER YOKE — horizontal bar covering ray bases */}
      <rect x="118" y="62" width="44" height="16" rx="2" />

      {/* LEFT HEAD */}
      <circle cx="122" cy="54" r="7" />
      <path d="M 117 50 L 109 46 L 112 53 L 117 53 Z" />
      <circle cx="120" cy="52" r="1" fill="#000" opacity="0.35" />

      {/* RIGHT HEAD */}
      <circle cx="158" cy="54" r="7" />
      <path d="M 163 50 L 171 46 L 168 53 L 163 53 Z" />
      <circle cx="160" cy="52" r="1" fill="#000" opacity="0.35" />

      {/* NECK CONNECTORS */}
      <path d="M 122 60 L 128 68 L 125 62 Z" />
      <path d="M 158 60 L 152 68 L 155 62 Z" />

      {/* CENTRAL BODY */}
      <path d="M 134 78 L 146 78 L 145 90 L 146 102 L 143 114 L 140 120 L 137 114 L 134 102 L 135 90 Z" />

      {/* TALONS */}
      <path d="M 138 120 L 132 128 L 130 126 L 131 131 L 127 128 L 128 132 L 124 130 L 128 125 Z" />
      <path d="M 142 120 L 148 128 L 150 126 L 149 131 L 153 128 L 152 132 L 156 130 L 152 125 Z" />

      {/* CENTRAL DECORATIVE BADGE */}
      <circle cx="140" cy="70" r="2.4" />
    </svg>
  );
}

/**
 * Generate one wing as a fan of N tapered rays from the shoulder.
 * Pure function, called once per side per render — could memoize if needed.
 */
function makeWing(side: "L" | "R") {
  const cx = 140;
  const cy = 70;
  const N = 11;
  const dir = side === "L" ? -1 : 1;
  const rays: React.ReactElement[] = [];

  // Angular span — almost horizontal at top, sweeping down
  const angStart = -28;
  const angEnd = 28;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const angDeg = angStart + (angEnd - angStart) * t;
    const ang = (angDeg * Math.PI) / 180;
    // Ray length — longest at mid, shorter at top/bottom
    const edge = Math.abs(t - 0.5) * 2;
    const len = 130 - edge * edge * 35;
    // Ray thickness
    const w = 4.2 - edge * 2;

    const tipX = cx + dir * Math.cos(ang) * len;
    const tipY = cy + Math.sin(ang) * len;
    const perpAng = ang + Math.PI / 2;
    const bx1 = cx + Math.cos(perpAng) * w * 0.5;
    const by1 = cy + Math.sin(perpAng) * w * 0.5;
    const bx2 = cx - Math.cos(perpAng) * w * 0.5;
    const by2 = cy - Math.sin(perpAng) * w * 0.5;

    rays.push(
      <path
        key={`${side}-${i}`}
        d={`M ${bx1.toFixed(1)} ${by1.toFixed(1)} L ${tipX.toFixed(1)} ${tipY.toFixed(1)} L ${bx2.toFixed(1)} ${by2.toFixed(1)} Z`}
      />,
    );
  }
  return rays;
}
