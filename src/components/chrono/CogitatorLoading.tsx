"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Themed Suspense fallback for `/werke` (Brief 120 polish). The page is one
 * server component that `await`s the whole catalogue fan-out; wrapping it in a
 * `loading.tsx` lets Next stream the shell (TopNav) + this loader instantly,
 * then swap in the archive when the query resolves — "fast onto the page, then
 * watch the cogitator think" rather than a blank await.
 *
 * Cycles Mechanicus boot-litany phrases with a fade/rise transition (one phrase
 * remounts per tick via `key`). Under `prefers-reduced-motion` the cycling is
 * suppressed and a single static line shows — and the global reduced-motion
 * cascade in 10-base.css kills the ring/pulse animations.
 */

const PHRASES = [
  "Cogitator loading",
  "Praying for the Omnissiah’s blessing",
  "Awakening the machine spirit",
  "Decrypting the Lexicanum",
  "Compiling the catalogus",
  "Anointing the data-shrine",
] as const;

const STEP_MS = 1500;

export default function CogitatorLoading() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setI((x) => (x + 1) % PHRASES.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="cogitator-loading" role="status">
      <span className="cogitator-loading__sr">Loading the archive…</span>

      <div className="cogitator-loading__core" aria-hidden>
        <span className="cogitator-loading__ring" />
        <span className="cogitator-loading__seed" />
      </div>

      <p className="cogitator-loading__eyebrow" aria-hidden>
        {"// COGNITIO LINK · ESTABLISHING"}
      </p>

      <p
        key={reduced ? "static" : i}
        className="cogitator-loading__phrase"
        aria-hidden
      >
        {reduced ? "Loading the archive" : PHRASES[i]}
        <span className="cogitator-loading__dots">…</span>
      </p>

      <span className="cogitator-loading__scan" aria-hidden />
    </div>
  );
}
