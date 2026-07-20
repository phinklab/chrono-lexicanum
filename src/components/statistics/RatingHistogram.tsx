/**
 * The Readers' Verdict — Goodreads rating distribution as a hand-rolled SVG
 * histogram (0.1-wide bins), with median/mean rules and the two named
 * extremes as linked HTML rows beneath. Single series → no legend (the
 * rubric names it); Server Component, CSS hover + native <title> only.
 */
import Link from "next/link";
import type { RatingStats } from "@/lib/statistics/loadStatistics";
import { RATING_VOTE_FLOOR } from "@/lib/statistics/loadStatistics";
import { fmt, niceMax, scale, ticks } from "./chart-utils";

const W = 960;
const H = 300;
const M = { top: 40, right: 12, bottom: 28, left: 40 };

function ExtremeRow({
  kind,
  e,
}: {
  kind: "best" | "worst";
  e: NonNullable<RatingStats["best"]>;
}) {
  return (
    <li>
      <Link className="libr-extreme" href={`/book/${e.slug}`}>
        <span className="libr-extreme__kind">
          {kind === "best" ? "Highest shelf" : "Lowest shelf"}
        </span>
        <span className="libr-extreme__title">{e.title}</span>
        <span className="libr-extreme__meta">
          {e.rating.toFixed(2)} · {fmt(e.votes)} ratings
        </span>
      </Link>
    </li>
  );
}

export default function RatingHistogram({ ratings }: { ratings: RatingStats }) {
  if (ratings.bins.length === 0) return null;

  const lo = ratings.bins[0].bin10;
  const hi = ratings.bins[ratings.bins.length - 1].bin10 + 1;
  const yMax = niceMax(Math.max(...ratings.bins.map((b) => b.count)));

  const x = scale(lo, hi, M.left, W - M.right);
  const y = scale(0, yMax, H - M.bottom, M.top);
  const barW = x(lo + 1) - x(lo) - 2;

  // Rating-axis labels on the half steps (3.0, 3.5, 4.0, …).
  const axisMarks: number[] = [];
  for (let b = Math.ceil(lo / 5) * 5; b <= hi; b += 5) axisMarks.push(b);

  const rule = (v: number) => x(v * 10);

  return (
    <figure className="libr-figure">
      <div className="libr-scroll">
        <svg
          className="libr-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Distribution of Goodreads ratings across ${fmt(ratings.rated)} rated books`}
        >
          {ticks(yMax, 4).map((t) => (
            <g key={t}>
              <line
                className="libr-grid"
                x1={M.left}
                x2={W - M.right}
                y1={y(t)}
                y2={y(t)}
              />
              <text className="libr-tick" x={M.left - 8} y={y(t) + 3} textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {axisMarks.map((b) => (
            <text
              key={b}
              className="libr-tick"
              x={x(b)}
              y={H - M.bottom + 18}
              textAnchor="middle"
            >
              {(b / 10).toFixed(1)}
            </text>
          ))}

          {ratings.bins.map((b) => (
            <g key={b.bin10} className="libr-col">
              <title>{`${(b.bin10 / 10).toFixed(1)}–${((b.bin10 + 1) / 10).toFixed(1)}: ${b.count} ${b.count === 1 ? "book" : "books"}`}</title>
              <rect
                x={x(b.bin10) + 1}
                y={y(b.count)}
                width={barW}
                height={y(0) - y(b.count)}
                fill="var(--libr-c-gold)"
              />
            </g>
          ))}

          {/* Median + mean rules with labels; median wears the brighter ink. */}
          <g className="libr-rule">
            <line x1={rule(ratings.median)} x2={rule(ratings.median)} y1={M.top - 6} y2={y(0)} />
            <text x={rule(ratings.median)} y={M.top - 12} textAnchor="middle">
              {`median ${ratings.median.toFixed(2)}`}
            </text>
          </g>
          <g className="libr-rule libr-rule--dim">
            <line x1={rule(ratings.mean)} x2={rule(ratings.mean)} y1={M.top + 8} y2={y(0)} />
            <text x={rule(ratings.mean)} y={M.top + 2} textAnchor="middle">
              {`mean ${ratings.mean.toFixed(2)}`}
            </text>
          </g>

          <line className="libr-axis" x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} />
        </svg>
      </div>

      {(ratings.best || ratings.worst) && (
        <ul className="libr-extremes" aria-label={`Rating extremes among books with at least ${RATING_VOTE_FLOOR} ratings`}>
          {ratings.best && <ExtremeRow kind="best" e={ratings.best} />}
          {ratings.worst && <ExtremeRow kind="worst" e={ratings.worst} />}
        </ul>
      )}
    </figure>
  );
}
