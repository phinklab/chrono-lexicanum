import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the faction guide (Report 144 § P.5) — streams while
 * the per-request faction aggregate resolves.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
