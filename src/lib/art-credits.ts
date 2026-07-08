/**
 * Artist credits for background artwork. PURE — no `@/db`.
 *
 * One shape (`ArtCredit`) + one registry keyed by the public image ref a
 * `<SiteBackground>` renders. SiteBackground looks its photo up here and, on a
 * hit, renders the shared `<ArtCreditTag>` bottom-right — so ANY page with
 * background artwork (login, hub, future vistas) gets its credit by adding a
 * map entry, nothing else. The cinematic timeline keeps its own era-/event-
 * keyed data (`src/lib/chronicle/eraArtCredits.ts`) because its artwork swaps
 * per slide, but shares this shape and the same tag component.
 */

export interface ArtCredit {
  name: string;
  links: { label: string; url: string }[];
}

// Currently empty: every shipped page background (login backdrop, shared
// library-nave across Hub / Archive / Compendium / Ask) is the maintainer's
// own work and carries no on-page credit — those originals are offered for
// download on /artwork instead. The registry stays for future third-party
// backgrounds, which DO get the on-page tag.
const BACKGROUND_ART_CREDITS: Record<string, ArtCredit> = {};

/** Credit for a `SiteBackground` photo ref, or null when none is registered. */
export function backgroundArtCredit(photo: string | null): ArtCredit | null {
  if (!photo) return null;
  return BACKGROUND_ART_CREDITS[photo] ?? null;
}
