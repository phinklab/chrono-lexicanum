"use client";

/**
 * LayoutSequence — the numbered reading-order path for one segment. Ported
 * from the prototype's `layouts.jsx`. The prototype carried a global `seq`
 * field; here we number locally (1..N within the rendered set, ordered by
 * setting date then title) because the zoom view and the accordion are fed by
 * two different loaders — a local order is consistent in both and reads as
 * "reading order within this epoch".
 */

import { useMemo } from "react";
import { formatMScale, type SeriesRef, type TimelineBook } from "@/lib/timeline";
import { useChronicle } from "./context";

export default function LayoutSequence({
  books,
  seriesById,
}: {
  books: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
}) {
  const ordered = useMemo(
    () =>
      [...books].sort(
        (a, b) => a.startY - b.startY || a.title.localeCompare(b.title),
      ),
    [books],
  );
  return (
    <div className="tlp-seq">
      <div className="tlp-seq-grid">
        {ordered.map((b, i) => (
          <SeqCard book={b} n={i + 1} key={b.id} seriesById={seriesById} />
        ))}
      </div>
    </div>
  );
}

function SeqCard({
  book,
  n,
  seriesById,
}: {
  book: TimelineBook;
  n: number;
  seriesById: Record<string, SeriesRef>;
}) {
  const ctx = useChronicle();
  const seriesName = book.series ? seriesById[book.series.id]?.name ?? null : null;
  return (
    <button
      type="button"
      className="tlp-seq-node"
      style={{ animationDelay: `${n * 22}ms` }}
      onClick={() => ctx.onOpen(book)}
      aria-label={`${book.title} — reading order ${n}`}
    >
      <span className="tlp-seq-num">{String(n).padStart(2, "0")}</span>
      <span className="tlp-seq-body">
        <span className="tlp-seq-title">{book.title}</span>
        <span className="tlp-seq-meta">
          {formatMScale(book.startY)}
          {seriesName ? ` · ${seriesName}` : ""}
        </span>
      </span>
    </button>
  );
}
