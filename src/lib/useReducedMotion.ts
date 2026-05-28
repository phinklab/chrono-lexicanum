"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion: reduce` via matchMedia. SSR-safe:
 * starts as `false` and updates on the first client render.
 *
 * Use in JS-driven motion (GhostReadout intervals, Typewriter timers,
 * LiveTelemetry drift) so reduced-motion users get the final state
 * directly instead of an animated approach to it. CSS-keyframe
 * animations are killed by the global `@media (prefers-reduced-motion:
 * reduce)` rule in globals.css.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
