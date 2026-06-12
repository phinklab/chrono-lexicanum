import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the full-page book route (Report 144 § P.5) — hard
 * navs / shared links stream this while `loadBook` resolves. The `@modal`
 * intercept has its own subtree and is not affected.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
