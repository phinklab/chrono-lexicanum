/**
 * projection.ts — the frozen SSOT pixel-space ↔ map-grid projection
 * (Brief 178).
 *
 * The catalog's `gx/gy` live on an aspect-ratio-true 0–1000 grid derived from
 * the Warhammer_map_SSOT.xlsx pixel space (x ∈ [2.794, 7031], y ∈ [515, 6198],
 * y grows downward like the source image):
 *
 *   gx = (x - 2.794) * 1000 / 7028.206
 *   gy = (y - 515)   * 1000 / 7028.206
 *
 * ⚠ Drift guard: these constants are deliberately DUPLICATED from the convert
 * (`scripts/import-map-worlds.ts`, documented in `map-worlds.json` → `grid.
 * transform`) so the app never imports from `scripts/**`. If the convert ever
 * changes the projection, this file must change with it — the committed
 * `grid.transform` string is the contract to diff against.
 */

/** Grid extents (== map-worlds.json `grid.gxMax` / `grid.gyMax`). */
export const GRID_W = 1000;
export const GRID_H = 808.6;

/** One grid unit in SSOT pixels. */
export const SSOT_SCALE = 7028.206 / 1000;
/** SSOT pixel origin of the grid. */
export const SSOT_X0 = 2.794;
export const SSOT_Y0 = 515;

/** Terra on the grid (catalog row `terra` — anchor of every polar/radial
 *  construction on the chart). */
export const TERRA = { gx: 333.4, gy: 401.95 } as const;

/** Grid → SSOT pixel space (the coordinate readout + the curation Excel). */
export function gridToSsot(gx: number, gy: number): { x: number; y: number } {
  return { x: gx * SSOT_SCALE + SSOT_X0, y: gy * SSOT_SCALE + SSOT_Y0 };
}

/** SSOT pixel space → grid (inverse of the convert's projection). */
export function ssotToGrid(x: number, y: number): { gx: number; gy: number } {
  return { gx: (x - SSOT_X0) / SSOT_SCALE, gy: (y - SSOT_Y0) / SSOT_SCALE };
}
