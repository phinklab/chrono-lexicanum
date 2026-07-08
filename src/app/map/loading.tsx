import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for the Cartographer. The server render
 * is light, so this rarely paints — it exists for the degenerate slow cases
 * (cold instance, wedged pool) so they show the house loader, not a blank.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
