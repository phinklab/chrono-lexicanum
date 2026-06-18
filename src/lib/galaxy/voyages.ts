// Voyages — "where a character travelled" paths drawn across the galaxy view.
// Each waypoint is a galaxy-landmark id (see GALAXY_LANDMARKS_BASE in data.ts)
// so the route connects the actual planet markers on the disc. Placeholder
// (dummy) routes for now — Philipp curates the real itineraries later.

export interface Voyage {
  id: string;
  name: string;
  /** Stroke colour for this character's route. */
  color: string;
  /** Galaxy-landmark ids, in travel order. */
  waypoints: string[];
}

export const VOYAGES: readonly Voyage[] = [
  {
    id: "the-emperor",
    name: "The Emperor",
    color: "#c9a65a", // house gold
    waypoints: ["terra", "fenris", "cadia", "catachan", "terra"],
  },
  {
    id: "roboute-guilliman",
    name: "Roboute Guilliman",
    color: "#5b8dd9", // Ultramarine blue
    waypoints: ["macragge", "baal", "cadia", "terra", "armageddon"],
  },
];
