/**
 * "Talked About, Written About" — the attention gap between the vox archive
 * and the shelves, one diverging bar per banner (F3 round 5). HTML rows like
 * BarLeaderboard (real links, focus states); the track is a center hairline
 * with the bar growing left (shelf-heavy, gold) or right (vox-heavy, cyan) —
 * the two validated house hues as the diverging pair, identity carried by
 * the legend + text, never color alone. Server Component, CSS hover only.
 */
import Link from "next/link";
import type { VoxGapRow } from "@/lib/statistics/loadStatistics";
import { fmt } from "./chart-utils";

/** −7.03 → "−7.0", 4.9 → "+4.9" (true minus sign, explicit plus). */
const signed = (d: number): string =>
  `${d < 0 ? "−" : "+"}${Math.abs(d).toFixed(1)}`;

export default function VoxGapBoard({ rows }: { rows: VoxGapRow[] }) {
  if (rows.length === 0) return null;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.delta)));

  return (
    <ol className="libr-gap" aria-label="Attention gap between podcasts and books per faction">
      {rows.map((r) => {
        const width = maxAbs > 0 ? (Math.abs(r.delta) / maxAbs) * 100 : 0;
        const voxHeavy = r.delta >= 0;
        return (
          <li key={r.id}>
            <Link
              className="libr-gap__row"
              href={`/faction/${encodeURIComponent(r.id)}`}
              title={`${r.name}: ${r.voxShare.toFixed(1)}% of the podcast talk, ${r.bookShare.toFixed(1)}% of the shelf (${signed(r.delta)} pp)`}
            >
              <span className="libr-gap__name">{r.name}</span>
              <span className="libr-gap__track" aria-hidden>
                <span className="libr-gap__half libr-gap__half--shelf">
                  {!voxHeavy && (
                    <span
                      className="libr-gap__bar libr-gap__bar--shelf"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </span>
                <span className="libr-gap__half libr-gap__half--vox">
                  {voxHeavy && (
                    <span
                      className="libr-gap__bar libr-gap__bar--vox"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </span>
              </span>
              <span className="libr-gap__value">{signed(r.delta)}</span>
              <span className="libr-gap__anno">
                {fmt(r.episodes)} ep · {fmt(r.books)} books
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
