/**
 * EntityBlurb — the curated description lead (Board 121-P5). A db-free,
 * presentational paragraph: the loader resolves the `Blurb` server-side and the
 * shared EntityView drops it in at the top of the reading column (so it appears
 * on the full page AND inside the Brief-113 overlay, with no fork). Renders
 * nothing extra beyond the sentence; a very low-confidence blurb reads more
 * quietly, and an optional source URL becomes a whisper-quiet mono cite.
 */
import type { Blurb } from "@/lib/entity/types";

/** Below this curation confidence the blurb renders in the dim ink (see CSS). */
const LOW_CONFIDENCE = 0.6;

/** "https://wh40k.lexicanum.com/wiki/Terra" → "LEXICANUM" for the cite chip. */
function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    // Second-to-last label is the recognisable name (lexicanum, fandom, …).
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return name.toUpperCase();
  } catch {
    return "SOURCE";
  }
}

export default function EntityBlurb({ blurb }: { blurb: Blurb }) {
  const soft = blurb.confidence < LOW_CONFIDENCE;
  const label = blurb.sourceUrl ? sourceLabel(blurb.sourceUrl) : null;

  return (
    <div
      className={
        soft
          ? "entity-view__blurb entity-view__blurb--soft"
          : "entity-view__blurb"
      }
    >
      <p className="entity-view__blurb-text">{blurb.text}</p>
      {blurb.sourceUrl && label ? (
        <a
          className="entity-view__blurb-cite"
          href={blurb.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Source: ${label} (opens in a new tab)`}
        >
          {label}
          <span className="entity-view__blurb-cite-arrow" aria-hidden>
            {" ↗"}
          </span>
        </a>
      ) : null}
    </div>
  );
}
