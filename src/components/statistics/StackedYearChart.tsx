/**
 * Generic stacked year-column chart — the shared geometry behind the
 * publication curve and the vox-archive episode curve. Hand-rolled SVG,
 * Server Component (F3: no chart library, no client JS; interactivity is
 * CSS hover + native SVG <title> tooltips).
 *
 * Interaction is PER SEGMENT (F3 round 7, maintainer request): hovering one
 * slice of a year's column brightens exactly that slice and its native
 * tooltip names year, count and medium ("2016: 24 short stories"). A
 * transparent stroke widens each slice's hit area so one-book slivers stay
 * hoverable.
 *
 * Series arrive in FIXED stack order with their palette slot (validated in
 * 60-statistics.css) — hues are assigned by the caller, never cycled here.
 * Identity is never color-alone: the legend rides above and every slice
 * carries its text tooltip.
 */
import { niceMax, scale, ticks } from "./chart-utils";
import ChartLegend from "./ChartLegend";

export interface StackSeries<K extends string = string> {
  /** Key into each year's `counts` record. */
  key: K;
  label: string;
  /** Tooltip unit for a count of one ("novel", "episode"). */
  singular: string;
  /** Tooltip unit otherwise — usually the lowercased label. */
  plural: string;
  /** CSS custom property from the validated chart palette. */
  varName: string;
}

export interface StackYear<K extends string = string> {
  year: number;
  counts: Record<K, number>;
  total: number;
}

const W = 960;
const H = 380;
const M = { top: 26, right: 12, bottom: 30, left: 40 };

export default function StackedYearChart<K extends string>({
  data,
  series,
  ariaLabel,
}: {
  data: StackYear<K>[];
  series: StackSeries<K>[];
  ariaLabel: string;
}) {
  if (data.length === 0) return null;

  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year;
  const byYear = new Map(data.map((p) => [p.year, p]));
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const yMax = niceMax(Math.max(...data.map((p) => p.total)));

  const x = scale(minYear, maxYear + 1, M.left, W - M.right);
  const y = scale(0, yMax, H - M.bottom, M.top);
  const slot = x(minYear + 1) - x(minYear);
  const barW = Math.max(4, slot - 3);

  // Year labels every five years on long spans, every year on short ones.
  const labelStep = years.length > 15 ? 5 : 1;

  return (
    <figure className="libr-figure">
      <ChartLegend
        items={series.map((s) => ({ varName: s.varName, label: s.label }))}
      />
      <div className="libr-scroll">
        <svg
          className="libr-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={ariaLabel}
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

          {years
            .filter((yr) => yr % labelStep === 0 || yr === maxYear)
            .map((yr) => (
              <text
                key={yr}
                className="libr-tick"
                x={x(yr) + barW / 2}
                y={H - M.bottom + 18}
                textAnchor="middle"
              >
                {yr}
              </text>
            ))}

          {/* Columns — one group per year, stacked in fixed order, 1px
              surface gap between the slices. Each slice carries its own
              tooltip and hover highlight. */}
          {years.map((yr) => {
            const p = byYear.get(yr);
            if (!p || p.total === 0) return null;
            let cursor = y(0);
            const segs = series.flatMap((s) => {
              const v = p.counts[s.key] ?? 0;
              if (v === 0) return [];
              const h = y(0) - y(v);
              cursor -= h;
              return [{ s, v, top: cursor + 0.5, h: Math.max(0.5, h - 1) }];
            });
            return (
              <g key={yr} className="libr-col">
                {segs.map(({ s, v, top, h }) => (
                  <rect
                    key={s.key}
                    className="libr-slice"
                    x={x(yr)}
                    y={top}
                    width={barW}
                    height={h}
                    fill={`var(${s.varName})`}
                  >
                    <title>
                      {`${yr}: ${v} ${v === 1 ? s.singular : s.plural}`}
                    </title>
                  </rect>
                ))}
              </g>
            );
          })}

          <line
            className="libr-axis"
            x1={M.left}
            x2={W - M.right}
            y1={y(0)}
            y2={y(0)}
          />
        </svg>
      </div>
    </figure>
  );
}
