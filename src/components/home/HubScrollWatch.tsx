"use client";

import { useEffect } from "react";

/**
 * HubScrollWatch — writes a 0…1 scroll-progress value into the CSS
 * variable `--hub-scroll-dim` on <html>. The home page's
 * `body:has(main.hub) .site-bg::after` rule reads it to fade in a dark
 * scrim over the vista photo as the user scrolls from the hero into the
 * tools fold. No DOM output, no UI.
 */
export default function HubScrollWatch() {
  useEffect(() => {
    const update = () => {
      const max = window.innerHeight * 0.7;
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      document.documentElement.style.setProperty(
        "--hub-scroll-dim",
        ratio.toFixed(3),
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--hub-scroll-dim");
    };
  }, []);

  return null;
}
