import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for `/ask` (Report 144 § P.5). A completed questionnaire
 * triggers the server-side recommendation pass; this holds the screen during
 * that await instead of a blank document.
 */
export default function Loading() {
  return <CogitatorLoading />;
}
