"use client";

import type { ChronicleChip } from "@/lib/chronicle/loadTimeline";

/**
 * Media chips (books & podcasts) — shared by the cinematic dossier and the
 * index row detail. Chips are REAL anchors with `target="_blank"` so
 * middle-click / Ctrl+click keep working natively — never `window.open`
 * buttons. Browsers will focus the new tab on a plain left click; that is
 * user-agent territory and deliberately not fought here.
 */
export default function MediaRows({ media }: { media: ChronicleChip[] }) {
  if (media.length === 0) {
    return <span className="no-books">· NO RECORDS IN THE ARCHIVE ·</span>;
  }
  return (
    <>
      {media.map((m, i) => {
        const body = (
          <>
            <span className="m-title">{m.title}</span>
            <span className="m-meta">
              {m.kind}
              {m.meta ? ` · ${m.meta}` : ""}
            </span>
          </>
        );
        return m.href ? (
          <a
            key={i}
            className="media-row"
            href={m.href}
            target="_blank"
            rel="noopener"
          >
            {body}
          </a>
        ) : (
          <div key={i} className="media-row">
            {body}
          </div>
        );
      })}
    </>
  );
}
