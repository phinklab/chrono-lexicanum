/**
 * Atlas format helpers (Task 4A — Admin Inventory Foundation).
 *
 * Tiny pure helpers shared by the inventory pages (4B–4D). Kept in
 * `src/lib/atlas/` so server- and client-rendered Atlas surfaces can
 * import them without pulling React. Locale-aware (`de-DE`).
 */

const NF = new Intl.NumberFormat("de-DE");

const DF_SHORT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const DF_LONG = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  return NF.format(n);
}

export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return DF_SHORT.format(d);
}

export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return DF_LONG.format(d);
}

export function formatRelative(d: Date | null | undefined, now: Date): string {
  if (!d) return "—";
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.max(0, Math.round(diffMs / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 30) return "gerade eben";
  if (min < 1) return `vor ${sec} s`;
  if (hr < 1) return `vor ${min} Min.`;
  if (day < 1) return `vor ${hr} Std.`;
  if (day < 7) return `vor ${day} Tag${day === 1 ? "" : "en"}`;
  return DF_SHORT.format(d);
}

const toMillennium = (n: number): number => Math.floor(n / 1000);

export function formatMRange(
  lo: number | string | null | undefined,
  hi: number | string | null | undefined,
): string {
  if (lo == null || hi == null) return "—";
  const loNum = typeof lo === "string" ? Number(lo) : lo;
  const hiNum = typeof hi === "string" ? Number(hi) : hi;
  if (!Number.isFinite(loNum) || !Number.isFinite(hiNum)) return "—";
  const loM = toMillennium(loNum);
  const hiM = toMillennium(hiNum);
  return loM === hiM ? `M${loM}` : `M${loM} – M${hiM}`;
}

export function truncate(value: string | null | undefined, max: number): string {
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
