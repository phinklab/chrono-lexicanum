import DetailModalSkeleton from "@/components/shared/DetailModalSkeleton";

/**
 * Suspense fallback for the `@modal` slot (Report — perceived latency). The
 * soft-nav entity intercepts ((.)charakter|fraktion|welt|person|buch) are async
 * server components; while one streams `loadEntity`/`loadBook`, this paints the
 * overlay shell + a cogitator so the panel doesn't open into a void.
 *
 * `default.tsx` and `[...catchAll]` resolve synchronously (`null`) → no
 * suspense, no fallback there — so this paints ONLY on a real intercept stream.
 * On an in-modal entity↔entity hop the boundary already holds committed content,
 * so React keeps the open panel during the transition instead of flashing this
 * (and Layer 1's beam signals that hop besides) — to be confirmed in-browser.
 */
export default function Loading() {
  return <DetailModalSkeleton />;
}
