/**
 * Era-level artist credits for the chapter artwork (eras.coverRef).
 *
 * The eras table carries no credit columns (events do, eras don't), and an
 * era credit needs multiple links — so this stays a small frontend map keyed
 * by era id instead of a DB migration. Event-level credits, when present,
 * take precedence in the cinematic view's art-credit slot.
 *
 * Shape + rendering are shared with the page-background credits (Brief 150):
 * `ArtCredit` from `src/lib/art-credits.ts`, rendered via `<ArtCreditTag>`.
 * Only the keying differs — era id here (artwork swaps per slide), image ref
 * there (one background per page).
 */
import type { ArtCredit } from "@/lib/art-credits";

export type EraArtCredit = ArtCredit;

export const ERA_ART_CREDITS: Record<string, EraArtCredit> = {
  horus_heresy: {
    name: "Richard Bagnall",
    links: [
      { label: "ARTSTATION", url: "https://www.artstation.com/r_bago" },
      { label: "INSTAGRAM", url: "https://www.instagram.com/richard_bagnall_art/" },
    ],
  },
  the_waning: {
    name: "Javelin05",
    links: [{ label: "REDDIT", url: "https://www.reddit.com/user/Javelin05/" }],
  },
};
