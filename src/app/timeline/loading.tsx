import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the Chronicle timeline — the page
 * awaits the timeline fan-out per request; this streams instead of a blank
 * document while it resolves.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
