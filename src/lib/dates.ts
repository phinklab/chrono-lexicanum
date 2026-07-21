/**
 * Coerce a value that should be a timestamp into a `Date`. With
 * `fetch_types: false` on the DB client (src/db/client.ts) a timestamp column
 * can arrive as a string instead of a `Date` depending on the query path.
 * Garbage falls back to the epoch — deterministic and visibly ancient instead
 * of NaN-valued.
 */
export function coerceDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

const DAY_MONTH = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" });

/** Compact "07 Mar" stamp for episode dates; en dash when unknown. */
export function shortDayMonth(ms: number | null): string {
  return ms == null ? "–" : DAY_MONTH.format(new Date(ms));
}
