import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Root Suspense fallback. Home (`/`) is the root
 * segment's page, so this file doubles as the catch-all stream→paint boundary
 * for every DB-backed route that lacks its own closer `loading.tsx`: the four
 * entity detail pages (charakter/welt/fraktion/person), /archive/podcasts and
 * its [slug], and buch/[slug]/audit. One reuse instead of seven near-identical
 * files.
 *
 * Static routes (login) do no async work → never suspend → never paint this.
 * Routes that already ship a local loading.tsx (archive, ask, buch/[slug],
 * compendium, fraktionen, map, timeline) keep their own closer boundary.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
