/**
 * routes.ts — the hand-curated ambient courses (Brief 178, Entscheid 7).
 * Ported verbatim from the winning study (design/08-cartographer/
 * i-maledictum.html, Runde 5): two courses, each leg an SVG path in grid
 * space, stations matched against featured worlds BY NAME, one cinematic
 * act text per station (course cards).
 *
 * Same seam later carries character pathings — a course is just data.
 */

export interface Course {
  id: string;
  name: string;
  tag: string;
  /** Featured-world names, in travel order. */
  stations: string[];
  /** One act text per station (course cards). */
  acts: string[];
  /** One leg per station transition, SVG path `d` in grid coordinates. */
  legs: string[];
  /** Course label on the chart. */
  lbl: { x: number; y: number; t: string };
}

export const COURSES: readonly Course[] = [
  {
    id: "r1",
    name: "Indomitus — Guilliman's Crusade",
    tag: "M42",
    stations: ["Macragge", "Terra", "Baal", "Vigilus"],
    acts: [
      "The Avenging Son wakes from ten thousand years of silence — a primarch walks among the living again.",
      "Guilliman kneels before the Golden Throne, and rises as Regent of the Imperium. The Indomitus Crusade is sworn.",
      "The crusade breaks the leviathan's grip on the home of the Blood Angels — salvation on wings of fire.",
      "At the Nachmund Gate the crusade holds the last stable passage into the darkened half of the Imperium.",
    ],
    legs: [
      "M 876.9 676 C 700 560, 470 470, 333.4 402",
      "M 333.4 402 C 440 330, 565 262, 672.9 227.7",
      "M 672.9 227.7 C 555 208, 425 220, 316.2 234.3",
    ],
    lbl: { x: 590, y: 505, t: "INDOMITUS" },
  },
  {
    id: "r2",
    name: "The Path of Heresy",
    tag: "M31",
    stations: ["Davin", "Istvaan III", "Istvaan V", "Molech", "Terra"],
    acts: [
      "On a plague-moon the Warmaster falls — and rises again, remade by powers older than the Imperium.",
      "Horus purges his own legions: virus bombs turn a world of loyal sons to glass and ash.",
      "The Dropsite Massacre — seven legions make planetfall, three are betrayed. The Heresy is written in blood.",
      "At the gate of the gods Horus seizes for himself the power the Emperor once refused.",
      "The Siege. Sanguinius falls; the Emperor ascends the Throne — victory at the price of forever.",
    ],
    legs: [
      "M 544.3 419.6 C 535 330, 515 215, 496 161",
      "M 496 161 L 490 155",
      "M 490 155 C 497 196, 500 232, 500 269.2",
      "M 500 269.2 C 450 315, 392 362, 333.4 402",
    ],
    lbl: { x: 552, y: 300, t: "VIA HORUS" },
  },
];
