import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the Compendium overview + category directories.
 * The pages await the five category builders; on a cold
 * cache fill — the only slow case — the shell + nav stream immediately (the
 * layout's counts sit behind their own Suspense) and this loader holds the
 * body until the builders resolve.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
