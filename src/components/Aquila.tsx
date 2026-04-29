/**
 * Aquila — Imperial two-headed eagle silhouette.
 *
 * Renders `/aquila.png` (the canonical W40k Aquila silhouette, sourced from
 * `archive/prototype-v1/uploads/`) as a CSS mask filled with `currentColor`,
 * so the Hub's `.hub-aquila { color: var(--color-lum) }` continues to drive
 * the colour. The mask approach keeps the same prop API and call site as the
 * prior SVG version — `<Aquila size={140} className="hub-aquila" />` works
 * without changes.
 *
 * Server-renderable; no `'use client'`. The PNG aspect ratio (860 × 357 ≈
 * 2.41 : 1) is encoded in `ASPECT` so callers only specify width.
 */
import { type HTMLAttributes } from "react";

const PNG_PATH = "/aquila.png";
const ASPECT = 357 / 860; // height / width — derived from the PNG itself

export interface AquilaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Pixel width. Height auto-computes from the PNG's aspect ratio. */
  size?: number;
}

export function Aquila({ size = 180, className, style, ...rest }: AquilaProps) {
  const maskStyle: React.CSSProperties = {
    display: "inline-block",
    width: size,
    height: Math.round(size * ASPECT),
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${PNG_PATH})`,
    maskImage: `url(${PNG_PATH})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    ...style,
  };
  // `mask-mode: alpha` is forced via the `.aquila` CSS class in globals.css —
  // React's CSSProperties type doesn't yet ship that key in its allow-list.
  return (
    <span
      aria-hidden="true"
      className={className ? `aquila ${className}` : "aquila"}
      style={maskStyle}
      {...rest}
    />
  );
}
