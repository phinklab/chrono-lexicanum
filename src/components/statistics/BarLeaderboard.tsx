/**
 * Shared bar-row list for the Librarium's ranked boards (authors, factions,
 * characters, places, vox entities) and its unranked distributions (facets,
 * title words). Deliberately HTML rows with proportional bar tracks instead
 * of SVG: the labels are entity links that want real focus/hover states and
 * the site's type ladder — the geometry here is one-dimensional, so HTML
 * loses nothing. Segments carry the validated chart palette via CSS custom
 * properties; multi-segment rows keep a 2px surface gap (CSS). Server
 * Component, CSS hover only.
 */
import Link from "next/link";

export interface BoardSegment {
  value: number;
  /** CSS custom property name from the chart palette (60-statistics.css). */
  varName: string;
  label: string;
}

export interface BoardRow {
  key: string;
  /** Link target; without it the row renders inert (facet distributions). */
  href?: string;
  label: string;
  /** Total that sizes the bar. */
  value: number;
  /** Mono value column, defaults to the formatted total. */
  valueLabel?: string;
  /** Faint mono column on the far right (career span, alignment, share). */
  annotation?: string;
  segments: BoardSegment[];
  /** Native tooltip for the whole row. */
  title?: string;
}

function RowBody({ row, rank }: { row: BoardRow; rank: number | null }) {
  return (
    <>
      {rank !== null && (
        <span className="libr-board__rank" aria-hidden>
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <span className="libr-board__main">
        <span className="libr-board__name">{row.label}</span>
        <span className="libr-board__track" aria-hidden>
          {row.segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span
                key={s.varName + s.label}
                className="libr-board__seg"
                style={{
                  width: `${s.value}%`,
                  background: `var(${s.varName})`,
                }}
              />
            ))}
        </span>
      </span>
      <span className="libr-board__value">
        {row.valueLabel ?? String(row.value)}
      </span>
      {row.annotation && (
        <span className="libr-board__anno">{row.annotation}</span>
      )}
    </>
  );
}

export default function BarLeaderboard({
  rows,
  ariaLabel,
  showRank = true,
}: {
  rows: BoardRow[];
  ariaLabel: string;
  /** Ordinal column — on for leaderboards, off for plain distributions. */
  showRank?: boolean;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.value));

  // Segment widths are precomputed as % of the longest row so the track CSS
  // stays a plain flex row.
  const scaled = rows.map((row) => ({
    ...row,
    segments: row.segments.map((s) => ({
      ...s,
      value: (s.value / max) * 100,
    })),
  }));

  return (
    <ol
      className={`libr-board${showRank ? "" : " libr-board--plain"}`}
      aria-label={ariaLabel}
    >
      {scaled.map((row, i) => (
        <li key={row.key}>
          {row.href ? (
            <Link className="libr-board__row" href={row.href} title={row.title}>
              <RowBody row={row} rank={showRank ? i + 1 : null} />
            </Link>
          ) : (
            <span className="libr-board__row libr-board__row--inert" title={row.title}>
              <RowBody row={row} rank={showRank ? i + 1 : null} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
