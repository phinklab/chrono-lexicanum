"use client";

import { useEffect, useRef } from "react";

/** Peak scrim opacity at full scroll — kept well below 1 so the cover photo
 *  stays visible (reader preference: "weniger Deckkraft des Blacks"). */
const MAX_SCRIM_OPACITY = 0.7;

/**
 * Drives the /buecher background scrim: a fixed full-viewport void layer
 * (.catalogue-scrim) whose opacity rises from 0 toward ~0.7 as the reader
 * scrolls down into the list. The fixed cover photo stays crisp behind the
 * hero, then fades to near-void so every row stays legible.
 *
 * The opacity is written to --cat-scrim-opacity on the scrim element itself,
 * only in an effect (never during render), so SSR paints a transparent scrim
 * with no hydration mismatch and no dark flash. A passive scroll listener
 * coalesced into a single requestAnimationFrame keeps it compositor-cheap.
 *
 * Note: this is scroll-linked (a direct response to user input), so it is
 * intentionally NOT gated by prefers-reduced-motion.
 */
export default function ScrollScrim() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Darken across (roughly) the hero's own height: by the time the hero has
    // mostly scrolled past, the scrim is near-opaque. Measured from the real
    // hero so the 60vh / min-height:520px crossover on short viewports behaves.
    let denom = 1;
    function measure() {
      const hero = document.querySelector<HTMLElement>(".catalogue-hero");
      const h = hero?.offsetHeight ?? window.innerHeight * 0.6;
      denom = Math.max(h * 0.85, 1);
    }

    let frame = 0;
    function apply() {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const progress = Math.min(window.scrollY / denom, 1);
      el.style.setProperty(
        "--cat-scrim-opacity",
        String(progress * MAX_SCRIM_OPACITY),
      );
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
  }, []);

  return <div className="catalogue-scrim" aria-hidden ref={ref} />;
}
