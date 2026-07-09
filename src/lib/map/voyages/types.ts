/**
 * voyages/types.ts — the "Great Journeys" data contract.
 *
 * A Voyage is a curated, ordered journey across the chart. Its stops come in
 * two kinds:
 *
 *   - STATIONS reference catalog ids from scripts/seed-data/map-worlds.json
 *     (NOT display names — ids are unique, names may repeat) and resolve over
 *     featured AND dust worlds (resolve.ts), so a station does not need
 *     linked works.
 *   - WAYPOINTS are the "on the way" beats: events at worlds the chart cannot
 *     locate (Thessala, the Empyrean, Farness Beta …). They ride the dashed
 *     leg between their two neighbouring stations at an eye-placed fraction
 *     `via`, render as small dots on the path, and behave like full acts in
 *     the tour (camera, card, numbering).
 *
 * Legs are GENERATED between consecutive STATIONS (quadratic Béziers bowing
 * away from Terra, resolve.ts) — waypoints never affect leg geometry. `leg`
 * on the arriving station overrides the bow or supplies a hand-authored path
 * (the pre-voyage hand legs of Indomitus/Via Horus ride along verbatim).
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
  /** Styling of the leg ARRIVING at this station (from the previous
   *  station). Ignored on the first station. */
  leg?: LegOverride;
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
}

export type VoyageStop = VoyageStation | VoyageWaypoint;

export const isWaypoint = (s: VoyageStop): s is VoyageWaypoint => !("world" in s);

export interface Voyage {
  /** Stable id — reducer state, legend rows, mask ids. */
  id: string;
  /** Display name, e.g. "Garro · Knight of Grey". */
  name: string;
  /** Era tag for the legend row, e.g. "M31", "M30–M31". */
  tag: string;
  /** One-line legend row description. */
  blurb: string;
  /** ≥ 2 stations plus optional waypoints, in travel order. Repeat station
   *  visits allowed. */
  stations: VoyageStop[];
  /** On-chart label (grid coordinates). */
  lbl: { x: number; y: number; t: string };
}
