/**
 * Librarium chart helpers — pure functions shared by the hand-rolled SVG
 * charts (F3: no chart dependency, Server Components only). No JSX, no DB.
 */

/** en-US grouping ("1,534") — explicit locale so SSR output is deterministic. */
const nf = new Intl.NumberFormat("en-US");
export const fmt = (n: number): string => nf.format(n);

/** Linear scale mapping [d0,d1] → [r0,r1]. */
export function scale(
  d0: number,
  d1: number,
  r0: number,
  r1: number,
): (v: number) => number {
  const k = (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/**
 * Round an axis maximum up to a friendly tick ceiling (1/2/5 × 10^n grid),
 * so gridlines land on round numbers whatever the live counts are.
 */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= max) return m * pow;
  }
  return 10 * pow;
}

/** Evenly spaced ticks from 0 to max inclusive. */
export function ticks(max: number, count: number): number[] {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step));
}

