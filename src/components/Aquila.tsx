/**
 * Aquila — Imperial two-headed eagle silhouette.
 *
 * Composition:
 *  - Wings: three layered feather banks per side (coverts → secondaries →
 *    primaries) rendered back-to-front with graduated opacity. Each feather
 *    is a tapered leaf shape (two quadratic curves to a sharp tip) anchored
 *    at the shoulder, so the silhouette reads as feathered wings rather than
 *    a sunburst of rays.
 *  - Heads: two outward-facing profiles with chunky beaks and small dark
 *    eye-notches. A small crest above each head reinforces the eagle read.
 *  - Body: tapered breast → abdomen → talon-grip column (kept from the
 *    prior version — it read acceptably). Splayed three-talon feet below.
 *
 * The shoulder yoke is drawn after the feathers so the inner feather bases
 * are masked by the body line — keeps the silhouette tidy at the centre.
 *
 * Server-renderable, no `'use client'`. `fill="currentColor"` so the Hub's
 * cyan halo treatment in globals.css continues to drive the colour through.
 */
import { type SVGProps } from "react";

export interface AquilaProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> {
  /** Pixel width. Height is auto-computed at 50% of width to preserve ratio. */
  size?: number;
}

const SHOULDER_X = 22; // distance from centre for each wing's pivot
const SHOULDER_Y = 66;

/** Bank configurations — angles measured clockwise from horizontal-out. */
const COVERTS = [
  { ang: 38, len: 30, w: 7 },
  { ang: 56, len: 26, w: 6 },
  { ang: 74, len: 22, w: 5 },
];
const SECONDARIES = [
  { ang: 8, len: 62, w: 8 },
  { ang: 22, len: 54, w: 7 },
  { ang: 36, len: 46, w: 6 },
  { ang: 50, len: 38, w: 5 },
];
const PRIMARIES = [
  { ang: -54, len: 78, w: 6 },
  { ang: -38, len: 94, w: 7 },
  { ang: -22, len: 102, w: 8 },
  { ang: -8, len: 94, w: 7 },
  { ang: 6, len: 78, w: 6 },
];

interface FeatherSpec { ang: number; len: number; w: number }

function featherPath(side: -1 | 1, spec: FeatherSpec): string {
  const ox = 140 + side * SHOULDER_X;
  const oy = SHOULDER_Y;
  const ang = (spec.ang * Math.PI) / 180;
  const tipX = ox + side * Math.cos(ang) * spec.len;
  const tipY = oy + Math.sin(ang) * spec.len;
  // Perpendicular to the spine for base + belly spread
  const perp = ang + Math.PI / 2;
  const dx = Math.cos(perp) * spec.w * 0.5;
  const dy = Math.sin(perp) * spec.w * 0.5;
  // Base across the perpendicular at the shoulder origin
  const b1x = ox + dx;
  const b1y = oy + dy;
  const b2x = ox - dx;
  const b2y = oy - dy;
  // Belly bulge at 42% along the spine, slightly wider than base — gives a
  // leaf shape that tapers to the sharp tip rather than a straight triangle.
  const mx = ox + side * Math.cos(ang) * spec.len * 0.42;
  const my = oy + Math.sin(ang) * spec.len * 0.42;
  const bxOff = Math.cos(perp) * spec.w * 0.65;
  const byOff = Math.sin(perp) * spec.w * 0.65;
  const c1x = mx + bxOff;
  const c1y = my + byOff;
  const c2x = mx - bxOff;
  const c2y = my - byOff;
  return (
    `M ${b1x.toFixed(1)} ${b1y.toFixed(1)}` +
    ` Q ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}` +
    ` Q ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${b2x.toFixed(1)} ${b2y.toFixed(1)} Z`
  );
}

function bank(side: -1 | 1, specs: readonly FeatherSpec[]) {
  return specs.map((s, i) => (
    <path key={`${side}-${i}`} d={featherPath(side, s)} />
  ));
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
      {/* WINGS — three banks per side, layered back-to-front */}
      <g opacity="0.5">
        {bank(-1, COVERTS)}
        {bank(1, COVERTS)}
      </g>
      <g opacity="0.78">
        {bank(-1, SECONDARIES)}
        {bank(1, SECONDARIES)}
      </g>
      <g>
        {bank(-1, PRIMARIES)}
        {bank(1, PRIMARIES)}
      </g>

      {/* SHOULDER YOKE — slim pill that masks the feather bases at the centre */}
      <rect x={116} y={60} width={48} height={11} rx={5.5} />

      {/* HEADS — outward profiles with beak + eye-notch + tiny crest */}
      <Head side={-1} />
      <Head side={1} />

      {/* CENTRAL BREAST PLATE — small shield anchors the eye between heads */}
      <path d="M 134 72 L 146 72 L 147 80 L 140 86 L 133 80 Z" />

      {/* BODY — tapering torso column */}
      <path d="
        M 132 80
        L 148 80
        Q 152 96 148 110
        L 146 118
        Q 144 124 140 126
        Q 136 124 134 118
        L 132 110
        Q 128 96 132 80
        Z
      " />

      {/* TALONS — splayed three-claw feet below the body */}
      <Talons />
    </svg>
  );
}

function Head({ side }: { side: -1 | 1 }) {
  const cx = 140 + side * 16;
  const cy = 50;
  const r = 8;
  // Beak: tapered triangle pointing outward and slightly up.
  const baseUpX = cx + side * 5;
  const baseUpY = cy - 5;
  const baseDnX = cx + side * 6;
  const baseDnY = cy + 2;
  const tipX = cx + side * 15;
  const tipY = cy - 3;
  // Crest: small spike above the head
  const crestBaseInX = cx - 2;
  const crestBaseOutX = cx + 3;
  const crestTipX = cx + side * 1;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} />
      {/* Beak */}
      <path d={`M ${baseUpX} ${baseUpY} L ${tipX} ${tipY} L ${baseDnX} ${baseDnY} Z`} />
      {/* Crest */}
      <path
        d={`M ${crestBaseInX} ${cy - 7} L ${crestTipX} ${cy - 12} L ${crestBaseOutX} ${cy - 7} Z`}
        opacity="0.65"
      />
      {/* Eye notch — punched out using the page background colour so the
         halo doesn't fill it. bg-1 (#0a0e15) reads as a clean cut on dark. */}
      <circle cx={cx + side * 3} cy={cy - 1} r={1.5} fill="#0a0e15" />
    </g>
  );
}

function Talons() {
  // Each foot draws as a single path: top edge attaches under the body,
  // then a serrated underside forms three implied talons per foot.
  const left =
    "M 132 124" +
    " L 128 134 L 132 128" +
    " L 134 134 L 137 128" +
    " L 138 132 L 140 124 Z";
  const right =
    "M 140 124" +
    " L 142 132 L 143 128" +
    " L 146 134 L 148 128" +
    " L 152 134 L 148 124 Z";
  return (
    <g>
      <path d={left} />
      <path d={right} />
    </g>
  );
}
