/**
 * Chronicle timeline — per-era VIEW config.
 *
 * Render tuning only: index-view grouping mode, minimap axis domain + ticks,
 * millennium-group labelling. Deliberately code-side, not DB (the
 * `eras` columns are kept to editorial copy; how an era is *charted* is a
 * frontend decision). Values originate from the design prototype's
 * `chronicle-data*.js` era headers, remapped onto the DB era ids.
 *
 * Era-local minimap coordinates derive from the stored scaleY
 * (`M*1000 + year`, e.g. 964.M30 → 30964) — events carry no y values:
 *   - `deep_history`: axis unit = millennia → y = scaleY / 1000
 *     (age_of_terra 1000..15000 → 1..15; offscale rows pin at the axis top).
 *   - everything else: y = scaleY − baseY (gothic_war 41139 → 139 on M41's
 *     [100, 1000] domain; The Forging's millennium grouping uses `baseM`).
 */

export type EraGrouping = "flat" | "century" | "millennium";

export interface EraTick {
  /** Position on the era-local axis (same unit as `domain`). */
  y: number;
  label: string;
}

export interface EraViewConfig {
  grouping: EraGrouping;
  /** Heading of the single group in `flat` mode. */
  groupLabel?: string;
  /** First millennium of a merged era — labels millennium groups (M<baseM+k>). */
  baseM?: number;
  /** Minimap axis domain in era-local years (millennia for deep_history). */
  domain: [number, number];
  ticks: EraTick[];
  /** scaleY → era-local y. `millennia`: y = scaleY/1000; else y = scaleY − baseY. */
  axis: { unit: "millennia" } | { unit: "years"; baseY: number };
}

export const ERA_VIEW_CONFIG: Record<string, EraViewConfig> = {
  deep_history: {
    grouping: "flat",
    groupLabel: "AGES OF MYTH & LEGEND",
    domain: [0, 31],
    ticks: [
      { y: 5, label: "M5" },
      { y: 10, label: "M10" },
      { y: 15, label: "M15" },
      { y: 20, label: "M20" },
      { y: 25, label: "M25" },
      { y: 30, label: "M30" },
    ],
    axis: { unit: "millennia" },
  },
  great_crusade: {
    grouping: "flat",
    groupLabel: "THE EMPEROR’S CONQUEST",
    domain: [550, 1020],
    ticks: [
      { y: 600, label: "600.M30" },
      { y: 700, label: "700.M30" },
      { y: 800, label: "800.M30" },
      { y: 900, label: "900.M30" },
      { y: 1000, label: "000.M31" },
    ],
    axis: { unit: "years", baseY: 30000 },
  },
  horus_heresy: {
    grouping: "century",
    domain: [0, 800],
    ticks: [
      { y: 100, label: "100.M31" },
      { y: 300, label: "300.M31" },
      { y: 500, label: "500.M31" },
      { y: 700, label: "700.M31" },
    ],
    axis: { unit: "years", baseY: 31000 },
  },
  the_forging: {
    grouping: "millennium",
    baseM: 32,
    domain: [0, 3000],
    ticks: [
      { y: 500, label: "500.M32" },
      { y: 1000, label: "000.M33" },
      { y: 1500, label: "500.M33" },
      { y: 2000, label: "000.M34" },
      { y: 2500, label: "500.M34" },
    ],
    axis: { unit: "years", baseY: 32000 },
  },
  age_apostasy: {
    grouping: "millennium",
    baseM: 35,
    domain: [0, 3000],
    ticks: [
      { y: 500, label: "500.M35" },
      { y: 1000, label: "000.M36" },
      { y: 1500, label: "500.M36" },
      { y: 2000, label: "000.M37" },
      { y: 2500, label: "500.M37" },
    ],
    axis: { unit: "years", baseY: 35000 },
  },
  the_waning: {
    grouping: "flat",
    groupLabel: "THE LONG DECLINE",
    domain: [0, 3000],
    ticks: [
      { y: 500, label: "500.M38" },
      { y: 1000, label: "000.M39" },
      { y: 1500, label: "500.M39" },
      { y: 2000, label: "000.M40" },
      { y: 2500, label: "500.M40" },
    ],
    axis: { unit: "years", baseY: 38000 },
  },
  time_ending: {
    grouping: "century",
    domain: [100, 1000],
    ticks: [
      { y: 200, label: "200.M41" },
      { y: 400, label: "400.M41" },
      { y: 600, label: "600.M41" },
      { y: 800, label: "800.M41" },
    ],
    axis: { unit: "years", baseY: 41000 },
  },
  indomitus: {
    grouping: "flat",
    groupLabel: "THE SUNDERED GALAXY",
    domain: [0, 30],
    ticks: [
      { y: 5, label: "005.M42" },
      { y: 10, label: "010.M42" },
      { y: 20, label: "020.M42" },
    ],
    axis: { unit: "years", baseY: 42000 },
  },
};

/**
 * Fallback for an era row without a config entry (a 9th era seeded before this
 * file learns about it): flat list, axis anchored at the era's own startY so
 * the minimap still spreads instead of clamping everything to one edge.
 */
export function fallbackEraView(eraStartY: number, eraEndY: number): EraViewConfig {
  const baseY = Math.floor(eraStartY / 1000) * 1000;
  return {
    grouping: "flat",
    domain: [0, Math.max(eraEndY - baseY, 100)],
    ticks: [],
    axis: { unit: "years", baseY },
  };
}
