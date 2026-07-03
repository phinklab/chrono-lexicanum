import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for `/ask` (Report 144 § P.5). A completed questionnaire
 * triggers the server-side recommendation pass; this holds the screen during
 * that await instead of a blank document. The `.route-loading` wrapper keeps
 * the fallback jump-proof for the tool-door switch (Ask ↔ OFOB): it preserves
 * the document height (no scroll clamp) and pins the cogitator to the
 * viewport (65-loading.css).
 */
export default function Loading() {
  return (
    <div className="route-loading">
      <CogitatorLoading />
    </div>
  );
}
