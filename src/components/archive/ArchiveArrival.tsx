"use client";

import { useEffect } from "react";

/**
 * ArchiveArrival — lands filtered arrivals at the result area (Launch E3).
 *
 * /archive opens with a 100dvh ceremonial hero. For an ORGANIC visit that
 * threshold is the point; for a visitor who arrives *already searching* — a
 * `q`/`faction`/`format`/`facet` link from Home, a shared filtered URL, a
 * `?focus` deep link from the timeline, or a deep `page` bookmark — the
 * results must be in view without a manual scroll. On mount this island pins
 * the viewport to the `#archive-results` anchor (the search console + the
 * register) in exactly those cases and leaves organic visits untouched.
 *
 * It scrolls only when the viewport sits at the top: a browser restoring a
 * remembered offset (reload, bfcache, history traversal) wins, because that
 * offset IS where the visitor was; and a pager step arrives via a
 * `#archive-results` hash link, whose native anchor scroll has already moved
 * the viewport before this effect runs.
 *
 * Instant, not smooth — same reasoning as HubScrollReset: an animated
 * multi-viewport glide on entry reads as jank, and instant jumps are
 * inherently reduced-motion-safe.
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
