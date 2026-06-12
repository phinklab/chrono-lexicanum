import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the maintainer catalogue `/buecher` (Report 144
 * § P.5) — its fat audit loader is deliberately uncached, so the await is
 * real on every request.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
