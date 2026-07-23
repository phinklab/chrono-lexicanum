"use client";

import { useEffect } from "react";

/**
 * Filtered/deep Archive arrivals jump instantly to results; organic visits
 * keep the ceremonial hero. Only a still-top viewport moves, so browser scroll
 * restoration and an already-resolved pager anchor always win.
 */
export default function ArchiveArrival({ arrival }: { arrival: boolean }) {
  useEffect(() => {
    if (!arrival || window.scrollY >= 4) return;
    document
      .getElementById("archive-results")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
    // Mount-only: an in-place filter change must not re-trigger the jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
