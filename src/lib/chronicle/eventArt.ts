/**
 * Per-event artwork overrides for the cinematic timeline.
 *
 * The cinematic background is era-wide by default (eras.coverRef → era.cover).
 * An event listed here overrides BOTH the background image AND the artist
 * credit for its own slide, so a single timeline point can carry its own
 * commissioned art and attribution. Keyed by event id (events.id — stable).
 * Background paths live under /public/timeline/bg/; credits reuse the
 * site-wide `ArtCredit` shape and render through the shared <ArtCreditTag>.
 *
 * Frontend-only, no DB column: the cinematic view reads this map directly,
 * the same way era credits live in `eraArtCredits.ts`. Event ids absent here
 * fall back to the era cover + era credit.
 */
import type { ArtCredit } from "@/lib/art-credits";

export interface EventArt {
  /** Public asset path of this slide's background (/timeline/bg/*.webp). */
  background?: string;
  /** Artist credit for that background; replaces the era credit on this slide. */
  credit?: ArtCredit;
}

export const EVENT_ART: Record<string, EventArt> = {
  astronomican_construction: {
    background: "/timeline/bg/astronomican.webp",
    credit: {
      name: "Abdullah Riaz",
      links: [{ label: "FIVERR", url: "https://www.fiverr.com/art77347" }],
    },
  },
};
