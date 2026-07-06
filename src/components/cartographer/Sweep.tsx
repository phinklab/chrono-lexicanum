"use client";

/**
 * Sweep — the surveyor's bearing line (Studie I, Runde 5): the tail is ONE
 * image — a continuous angular falloff computed once on a canvas (per pixel,
 * dithered so 8-bit alpha never bands), rotating as a whole behind a clip of
 * the segment-edge silhouette. No per-frame rebuild, no jump at segment
 * borders; the guide line stays vector. One transform write per frame.
 *
 * reduced-motion: the sweep stands still at its home bearing.
 */

import { useEffect, useRef, useState } from "react";

import {
  GOLD,
  SWEEP_PERIOD_MS,
  SWEEP_R0,
  SWEEP_RMAX,
  SWEEP_TAIL_DEG,
  TX,
  TY,
  lcg,
  sweepClipPath,
} from "./chart-geometry";

const HOME_DEG = -90;

function buildTailImage(): string {
  const SIZE = 1024;
  const HALF = SIZE / 2;
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const c2d = cv.getContext("2d");
  if (!c2d) return "";
  const img = c2d.createImageData(SIZE, SIZE);
  const px = img.data;
  const nrnd = lcg(64);
  for (let yy = 0; yy < SIZE; yy++) {
    for (let xx = 0; xx < SIZE; xx++) {
      // 0° = +x (the guide line); rotation runs clockwise, the tail trails
      // behind, i.e. at negative angles.
      const ang = (Math.atan2(yy - HALF, xx - HALF) * 180) / Math.PI;
      let o = 0;
      if (ang <= 0 && ang >= -SWEEP_TAIL_DEG) {
        const t = -ang / SWEEP_TAIL_DEG;
        o = 255 * 0.09 * Math.pow(1 - t, 1.55) + (nrnd() - 0.5) * 2.2;
      }
      const k4 = (yy * SIZE + xx) * 4;
      px[k4] = 164; // GOLD r
      px[k4 + 1] = 140;
      px[k4 + 2] = 82;
      px[k4 + 3] = Math.max(0, Math.min(255, Math.round(o)));
    }
  }
  c2d.putImageData(img, 0, 0);
  return cv.toDataURL("image/png");
}

export default function Sweep({ reduce }: { reduce: boolean }) {
  const rotRef = useRef<SVGGElement | null>(null);
  const [href, setHref] = useState<string>("");

  useEffect(() => {
    // Deferred: the pixel loop takes ~15 ms — never inside the commit.
    let alive = true;
    const raf = requestAnimationFrame(() => {
      if (alive) setHref(buildTailImage());
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const rot = rotRef.current;
    if (!rot) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      rot.setAttribute(
        "transform",
        `translate(${TX} ${TY}) rotate(${(HOME_DEG + (360 * (now - t0)) / SWEEP_PERIOD_MS).toFixed(3)})`,
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <g clipPath="url(#cg-sweepClip)" pointerEvents="none">
      <defs>
        <clipPath id="cg-sweepClip">
          <path d={sweepClipPath()} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g ref={rotRef} transform={`translate(${TX} ${TY}) rotate(${HOME_DEG})`}>
        {href && (
          <image href={href} x={-SWEEP_RMAX} y={-SWEEP_RMAX} width={SWEEP_RMAX * 2} height={SWEEP_RMAX * 2} />
        )}
        <line x1={SWEEP_R0} y1={0} x2={SWEEP_RMAX} y2={0} stroke={GOLD} strokeOpacity={0.24} vectorEffect="non-scaling-stroke" />
      </g>
    </g>
  );
}
