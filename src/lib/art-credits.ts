/**
 * Artist credits for background artwork (Brief 150). PURE — no `@/db`.
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

// phil kuenzler's artwork credits both the login backdrop and the shared
// library-nave background carried across Hub / Archive / Compendium / Ask.
const PHIL_KUENZLER: ArtCredit = {
  name: "phil kuenzler",
  links: [{ label: "phinklabs", url: "https://phinklabs.com" }],
};

const BACKGROUND_ART_CREDITS: Record<string, ArtCredit> = {
  "/img/login.webp": PHIL_KUENZLER,
  "/img/main-bg.webp": PHIL_KUENZLER,
};

/** Credit for a `SiteBackground` photo ref, or null when none is registered. */
export function backgroundArtCredit(photo: string | null): ArtCredit | null {
  if (!photo) return null;
  return BACKGROUND_ART_CREDITS[photo] ?? null;
}
