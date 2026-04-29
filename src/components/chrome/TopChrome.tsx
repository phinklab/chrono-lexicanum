import Link from "next/link";
import { Suspense } from "react";
import EraToggle from "./EraToggle";

/**
 * TopChrome — fixed top bar visible on every route. Server component; the only
 * client island is the EraToggle (because it reads/writes the URL via
 * useSearchParams).
 *
 * The mark-sigil is a static SVG-ish CSS construction (border + rotated
 * pseudo-element + pulsing ring) — see `.mark-sigil` in globals.css. The
 * wordmark links back to `/`.
 *
 * The strapline element from the prototype's base.css (centered subtitle
 * below the chrome) is intentionally not ported in this brief — the flowed
 * Hub already carries that voice in its eyebrow + headline. See brief
 * `2026-04-29-006`.
 */
export default function TopChrome() {
  return (
    <div className="top-chrome">
      <Link href="/" className="mark" aria-label="Chrono Lexicanum — Hub">
        <span className="mark-sigil" aria-hidden />
        <span className="mark-name">Chrono · Lexicanum</span>
      </Link>

      <Suspense fallback={<EraToggleFallback />}>
        <EraToggle />
      </Suspense>
    </div>
  );
}

/**
 * Renders the same shell as EraToggle so the layout doesn't shift while
 * useSearchParams resolves on first paint. Buttons are inert; the active
 * indicator points at the default era (M31).
 */
function EraToggleFallback() {
  return (
    <div className="era-toggle" aria-hidden>
      <button type="button" tabIndex={-1}>M30</button>
      <button type="button" className="active" tabIndex={-1}>M31</button>
      <button type="button" tabIndex={-1}>M42</button>
    </div>
  );
}
