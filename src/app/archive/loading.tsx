import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for `/werke`. `WerkePage` awaits the full catalogue
 * fan-out, so Next streams the shell + this loader immediately and reveals the
 * archive once the data resolves (Brief 120 — perceived speed).
 */
export default function Loading() {
  return <CogitatorLoading />;
}
