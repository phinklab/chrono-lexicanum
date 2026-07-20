/**
 * "Better with Age?" — the average Goodreads verdict per release year as a
 * hand-rolled SVG line (F3 round 5). Server Component, no chart dependency;
 * hover = native <title> tooltips on invisible hit circles, per the house
 * chart vocabulary in 60-statistics.css. Single series → no legend box (the
 * act heading names it); selective direct labels on the low and the latest
 * point only.
 */
import type { RatingYear } from "@/lib/statistics/loadStatistics";
import { fmt, scale } from "./chart-utils";

const W = 960;
const H = 320;
const PAD = { top: 26, right: 26, bottom: 36, left: 48 };

export default function RatingTrendChart({ years }: { years: RatingYear[] }) {
  if (years.length < 2) return null;

  const avgs = years.map((y) => y.avg);
  const yMin = Math.floor((Math.min(...avgs) - 0.05) * 10) / 10;
  const yMax = Math.ceil((Math.max(...avgs) + 0.05) * 10) / 10;
  const x0 = years[0].year;
  const x1 = years[years.length - 1].year;

  const sx = scale(x0, x1, PAD.left, W - PAD.right);
  const sy = scale(yMin, yMax, H - PAD.bottom, PAD.top);

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += 0.2) {
    yTicks.push(Math.round(v * 10) / 10);
  }
  const xTicks = years
    .map((y) => y.year)
    .filter((y) => y % 5 === 0 || y === x0 || y === x1);

  const path = years
    .map((y, i) => `${i === 0 ? "M" : "L"}${sx(y.year).toFixed(1)},${sy(y.avg).toFixed(1)}`)
    .join(" ");

  const low = years.reduce((m, y) => (y.avg < m.avg ? y : m), years[0]);
  const last = years[years.length - 1];

  return (
    <figure className="libr-figure">
      <div className="libr-scroll">
        <svg
          className="libr-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Average Goodreads rating per release year, ${x0} to ${x1}`}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line
                className="libr-grid"
                x1={PAD.left}
                x2={W - PAD.right}
                y1={sy(v)}
                y2={sy(v)}
              />
              <text
                className="libr-tick"
                x={PAD.left - 10}
                y={sy(v) + 3.5}
                textAnchor="end"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}
          <line
            className="libr-axis"
            x1={PAD.left}
            x2={W - PAD.right}
            y1={H - PAD.bottom}
            y2={H - PAD.bottom}
          />
          {xTicks.map((y) => (
            <text
              key={y}
              className="libr-tick"
              x={sx(y)}
              y={H - PAD.bottom + 20}
              textAnchor="middle"
            >
              {y}
            </text>
          ))}

          <path className="libr-trend__line" d={path} />
          {years.map((y) => (
            <g key={y.year} className="libr-pt">
              <circle
                className="libr-trend__dot"
                cx={sx(y.year)}
                cy={sy(y.avg)}
                r={3.2}
              />
              {/* Oversized invisible hit target carrying the tooltip. */}
              <circle
                className="libr-trend__hit"
                cx={sx(y.year)}
                cy={sy(y.avg)}
                r={13}
              >
                <title>
                  {`${y.year}: ${y.avg.toFixed(2)} average across ${fmt(y.n)} rated ${y.n === 1 ? "volume" : "volumes"}`}
                </title>
              </circle>
            </g>
          ))}

          {/* Selective direct labels: the low water mark and the latest year. */}
          <text
            className="libr-note"
            x={sx(low.year)}
            y={sy(low.avg) + 20}
            textAnchor="middle"
          >
            {`${low.avg.toFixed(2)} · ${low.year}`}
          </text>
          <text
            className="libr-note"
            x={sx(last.year) - 4}
            y={sy(last.avg) - 12}
            textAnchor="end"
          >
            {`${last.avg.toFixed(2)} · ${last.year}`}
          </text>
        </svg>
      </div>
    </figure>
  );
}
