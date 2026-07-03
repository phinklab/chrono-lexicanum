import CogitatorLoading from "@/components/chrono/CogitatorLoading";

/**
 * Suspense fallback for `/archive`. The page awaits the full catalogue
 * fan-out, so Next streams the shell + this loader immediately and reveals the
 * archive once the data resolves (Brief 120 — perceived speed). The
 * `.route-loading` wrapper keeps the fallback jump-proof for the Books ↔
 * Podcasts door switch: it preserves the document height (no scroll clamp)
 * and pins the cogitator to the viewport (65-loading.css).
 */
export default function Loading() {
  return (
    <div className="route-loading">
      <CogitatorLoading />
    </div>
  );
}
