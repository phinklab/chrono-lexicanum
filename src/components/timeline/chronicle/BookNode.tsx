"use client";

/**
 * BookNode — the atomic ribbon/lane marker. Shape encodes the publication
 * format (`.tlp-mark.fmt-*`). Carries the stable `id="book-marker-{slug}"`
 * that `DetailPanel` focuses on close (focus-return contract). All current
 * markers render solid — the prototype's dashed "approximate dating" variant
 * stays dormant until the catalogue carries a confidence/approx signal.
 */

import { useRef } from "react";
import { formatMScale, type TimelineBook } from "@/lib/timeline";
import { useChronicle } from "./context";

export default function BookNode({ book }: { book: TimelineBook }) {
  const ctx = useChronicle();
  const ref = useRef<HTMLButtonElement>(null);

  function report() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    ctx.onHover(book, r.left + r.width / 2, r.top);
  }

  return (
    <button
      ref={ref}
      id={`book-marker-${book.slug}`}
      type="button"
      className="tlp-node"
      aria-label={`${book.title} — ${formatMScale(book.startY)}`}
      onMouseEnter={report}
      onFocus={report}
      onMouseLeave={ctx.onLeave}
      onBlur={ctx.onLeave}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onOpen(book);
      }}
    >
      <span className={`tlp-mark fmt-${book.fmt}`} />
    </button>
  );
}
