import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the faction guide — streams while
 * the per-request faction aggregate resolves.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
