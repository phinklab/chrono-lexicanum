/**
 * voyages/types.ts — the "Great Journeys" data contract.
 *
 * A Voyage is a curated, ordered journey across the chart. Its stops come in
 * three kinds:
 *
 *   - STATIONS reference catalog ids from scripts/seed-data/map-worlds.json
 *     (NOT display names — ids are unique, names may repeat) and resolve over
 *     featured AND dust worlds (resolve.ts), so a station does not need
 *     linked works.
 *   - WAYPOINTS are the legacy "on the way" fallback for a beat that can only
 *     be ordered between two anchors. They ride the enclosing leg at `via`
 *     and behave like full acts in the tour. Current authored journeys prefer
 *     sourced chart points whenever the lore supports a useful placement.
 *   - CHART POINTS are named locations without catalog entities whose
 *     relative position is still constrained by the lore (a moon, orbital
 *     plate, system edge ...). They carry explicit grid coordinates plus a
 *     rendered placement note and source, so inferred cartography never
 *     masquerades as a canonical coordinate.
 *
 * Legs are GENERATED between consecutive ANCHORS (stations or chart points;
 * quadratic Béziers bowing away from Terra, resolve.ts). Waypoints never
 * affect leg geometry. `leg` on the arriving anchor overrides the bow or
 * supplies a hand-authored path; `breakBefore` starts a disconnected segment.
 *
 * `scripts/test-voyages.ts` (npm run test:voyages) is the research gate:
 * every station id must exist in the catalog, every act text must be
 * non-empty, every waypoint must have a leg to ride.
 */

export interface LegOverride {
  /** Perpendicular bow of the generated quadratic, in grid units. Positive
   *  bows away from Terra (the generator's default side); negative flips.
   *  Overrides only the curvature — endpoints stay on the stations. */
  bow?: number;
  /** Full hand-authored SVG path `d` in grid coordinates — the art-direction
   *  escape hatch. Wins over `bow`. */
  d?: string;
  /** Optional authored colour for this transition. Used sparingly where the
   *  archive itself changes how strongly a connection should read. */
  color?: `#${string}`;
  /** Optional renderer opacity for this transition, in the inclusive 0–1
   *  range. Defaults to the normal route opacity. */
  opacity?: number;
}

export interface VoyagePlacement {
  /** How strongly the lore constrains the plotted position. */
  precision: "relative" | "schematic";
  /** Concise, user-facing account of what the source does and does not fix. */
  note: string;
  /** Provenance for the placement claim, rendered as the note's source link. */
  source: string;
}

export type VoyageArmTarget =
  | { world: string }
  | {
      name: string;
      gx: number;
      gy: number;
      placement: VoyagePlacement;
    };

/** A sourced strategic disposition radiating from one authored anchor. Arms
 *  are map-only epilogue geometry: they reveal with their source act but do
 *  not become extra tour cards or pretend to be one traveller's itinerary. */
export interface VoyageArm {
  /** Roman Legion number, used as the stable authored identity. */
  legion: string;
  name: string;
  color: `#${string}`;
  /** Lower opacity distinguishes manipulated or answering movements from a
   *  direct command while retaining the Legion colour. */
  opacity?: number;
  target: VoyageArmTarget;
  /** Perpendicular bow in grid units; signed values separate shared targets. */
  bow?: number;
  source: string;
}

/** Editorial section inside a long voyage. The start index is an authored
 * stop index; the colour is shared by SVG, Canvas and cards. */
export interface VoyageSection {
  id: string;
  label: string;
  color: `#${string}`;
  start: number;
}

export interface VoyageStation {
  /** Catalog world id from map-worlds.json (e.g. "terra", "istvaan-iii"). */
  world: string;
  /** Display override for the act kicker where the chart name is not the
   *  story name — e.g. "Ullanor · The Triumph" over the `armageddon` pin. */
  heading?: string;
  /** The act text — 1–3 sentences, the cinematic card copy. */
  text: string;
  /** In-universe date label for the kicker, e.g. "c. 005.M31". */
  date?: string;
  /** Research provenance (Lexicanum/Fandom URL). Never rendered. */
  source?: string;
  /** Optional disclosure when a catalog pin is an identity anchor rather
   *  than a claim about the event's historical coordinate. */
  placement?: VoyagePlacement;
  /** Styling of the leg ARRIVING at this station (from the previous
   *  station). Ignored on the first station. */
  leg?: LegOverride;
  /** Start a new route segment here. The tour chronology continues, but no
   *  line is drawn from the preceding anchor. */
  breakBefore?: boolean;
  /** Strategic map-only arms revealed when this act is reached. */
  arms?: VoyageArm[];
}

export interface VoyageWaypoint {
  /** Position along the enclosing leg (previous station → next station) in
   *  path-parameter space, 0–1 exclusive — placed by eye ("wo es optisch am
   *  besten passt"). A waypoint therefore cannot be first or last, and its
   *  two neighbouring stations must be different worlds. */
  via: number;
  /** Designation shown as the act's chart name (e.g. "Thessala"). */
  name: string;
  /** Display override for the act kicker; defaults to `name`. */
  heading?: string;
  /** The act text — 1–3 sentences, the cinematic card copy. */
  text: string;
  /** In-universe date label for the kicker. */
  date?: string;
  /** Research provenance (Lexicanum/Fandom URL). Never rendered. */
  source?: string;
  /** Optional disclosure where even the position along a leg needs context. */
  placement?: VoyagePlacement;
}

export interface VoyageChartPoint {
  /** Designation shown on the act card. */
  name: string;
  /** Explicit chart coordinate, inferred at the precision disclosed below. */
  gx: number;
  gy: number;
  heading?: string;
  text: string;
  date?: string;
  /** Research provenance for the event itself. */
  source?: string;
  /** Mandatory provenance and uncertainty disclosure for the coordinates. */
  placement: VoyagePlacement;
  /** Styling of the leg arriving at this point. */
  leg?: LegOverride;
  /** Start a new route segment here without connecting it to the preceding
   *  anchor. */
  breakBefore?: boolean;
  /** Strategic map-only arms revealed when this act is reached. */
  arms?: VoyageArm[];
}

export type VoyageStop = VoyageStation | VoyageWaypoint | VoyageChartPoint;

export const isWaypoint = (s: VoyageStop): s is VoyageWaypoint => "via" in s;
export const isChartPoint = (s: VoyageStop): s is VoyageChartPoint => "gx" in s;

export interface Voyage {
  /** Stable id — reducer state, legend rows, mask ids. */
  id: string;
  /** Display name, e.g. "Garro · Knight of Grey". */
  name: string;
  /** Era tag for the legend row, e.g. "M31", "M30–M31". */
  tag: string;
  /** One-line legend row description. */
  blurb: string;
  /** Optional prototype disclosure for how the route geometry should be read. */
  cartography?: {
    label: string;
    note: string;
  };
  /** Optional chronology sections with a shared visual identity. */
  sections?: VoyageSection[];
  /** ≥ 2 anchors plus optional waypoints, in narrative order. Repeat station
   *  visits and disconnected route segments are allowed. */
  stations: VoyageStop[];
  /** On-chart label (grid coordinates). */
  lbl: { x: number; y: number; t: string };
}
