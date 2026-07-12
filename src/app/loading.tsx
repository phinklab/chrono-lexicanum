import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Root Suspense fallback. Home (`/`) is the root
 * segment's page, so this file doubles as the catch-all stream→paint boundary
 * for every DB-backed route that lacks its own closer `loading.tsx`: the four
 * entity detail pages (character/world/faction/person), /archive/podcasts and
 * its [slug], and book/[slug]/audit. One reuse instead of seven near-identical
 * files.
 *
 * Static routes (login) do no async work → never suspend → never paint this.
 * Routes that already ship a local loading.tsx (archive, ask, book/[slug],
 * compendium, map, timeline) keep their own closer boundary.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
