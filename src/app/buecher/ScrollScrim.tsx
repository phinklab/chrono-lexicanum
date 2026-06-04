"use client";

import { useEffect, useRef } from "react";

type ScrollScrimProps = {
  /** Scrim element class — its CSS owns position/colour; this only drives opacity. */
  className?: string;
  /** CSS custom property the computed opacity is written to. */
  varName?: string;
  /** Selector for the "hero" whose height sets the darkening distance. */
  heroSelector?: string;
  /** Peak scrim opacity at full scroll (kept below 1 so the photo stays visible). */
  maxOpacity?: number;
};

/**
 * Drives a fixed full-viewport void scrim whose opacity rises from 0 toward
 * `maxOpacity` as the reader scrolls down past the hero. The cover photo stays
 * crisp behind the hero, then fades to near-void so content scrolling over the
 * fixed photo stays legible. Shared by /buecher + /werke (the `.catalogue-scrim`
 * defaults) and /ask (which passes its own `.ask-scrim` + masthead selector).
 *
 * The opacity is written to a CSS var on the scrim element itself, only in an
 * effect (never during render), so SSR paints a transparent scrim with no
 * hydration mismatch and no dark flash. A passive scroll listener coalesced into
 * a single requestAnimationFrame keeps it compositor-cheap.
 *
 * Note: this is scroll-linked (a direct response to user input), so it is
 * intentionally NOT gated by prefers-reduced-motion.
 */
export default function ScrollScrim({
  className = "catalogue-scrim",
  varName = "--cat-scrim-opacity",
  heroSelector = ".catalogue-hero",
  maxOpacity = 0.7,
}: ScrollScrimProps = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Darken across (roughly) the hero's own height: by the time the hero has
    // mostly scrolled past, the scrim is near-peak. Measured from the real hero
    // so the 60vh / min-height crossover on short viewports behaves.
    let denom = 1;
    function measure() {
      const hero = document.querySelector<HTMLElement>(heroSelector);
      const h = hero?.offsetHeight ?? window.innerHeight * 0.6;
      denom = Math.max(h * 0.85, 1);
    }

    let frame = 0;
    function apply() {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const progress = Math.min(window.scrollY / denom, 1);
      el.style.setProperty(varName, String(progress * maxOpacity));
    }
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    }
    function onResize() {
      measure();
      apply();
    }

    measure();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [varName, heroSelector, maxOpacity]);

  return <div className={className} aria-hidden ref={ref} />;
}
