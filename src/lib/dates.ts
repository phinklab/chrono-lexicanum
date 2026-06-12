/**
 * Coerce a value that should be a timestamp into a `Date` (Report 144 § T.5).
 * With `fetch_types: false` on the DB client (src/db/client.ts) a timestamp
 * column can arrive as a string instead of a `Date` depending on the query
 * path; the previous call sites asserted `as unknown as string` blind, which
 * produced `Invalid Date` on unexpected input. Garbage now falls back to the
 * epoch — deterministic and visibly ancient instead of NaN-valued.
 */
export function coerceDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}
