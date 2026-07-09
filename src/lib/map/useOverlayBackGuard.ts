"use client";

/**
 * useOverlayBackGuard — one "guard" history entry while any dismissible map
 * overlay is open on phones, so the hardware/edge back gesture closes the
 * topmost overlay (layers[0] first) instead of leaving the site.
 *
 * Mechanics: the first overlay to open pushes a single `{cgGuard:true}`
 * entry; a popstate while overlays are open closes the topmost and re-pushes
 * the guard while more remain; when the LAST overlay is closed through the
 * UI instead, the guard is consumed silently via history.back() (the
 * resulting popstate is swallowed by `eatPops`). Returning down ONTO the
 * guard entry — back from a /buch modal pushed above it — is recognized by
 * `e.state.cgGuard` and leaves the overlays alone. Plays nice with the
 * throttled replaceState hash writer, which only rewrites the URL of
 * whichever entry is current (hash.ts preserves history.state).
 */

import { useEffect, useRef } from "react";

export interface OverlayLayer {
  open: boolean;
  /** Close this overlay (idempotent). */
  close: () => void;
}

export function useOverlayBackGuard(enabled: boolean, layers: OverlayLayer[]) {
  const armed = useRef(false); // our guard entry is top-of-stack
  const eatPops = useRef(0); // pops we caused ourselves via history.back()
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const anyOpen = layers.some((l) => l.open);

  /* Arm on first overlay open; consume on last UI-close. While a
     self-inflicted pop is in flight (eatPops > 0) arming is deferred to the
     popstate handler — pushing here would race the pending back(). */
  useEffect(() => {
    if (!enabled) return;
    if (anyOpen && !armed.current && eatPops.current === 0) {
      window.history.pushState({ cgGuard: true }, "", window.location.href);
      armed.current = true;
    } else if (!anyOpen && armed.current) {
      armed.current = false;
      eatPops.current += 1;
      window.history.back();
    }
  }, [enabled, anyOpen]);

  useEffect(() => {
    if (!enabled) return;
    const onPop = (e: PopStateEvent) => {
      if (eatPops.current > 0) {
        eatPops.current -= 1;
        // Rapid reopen while the consumption was in flight: re-arm now.
        if (layersRef.current.some((l) => l.open) && !armed.current) {
          window.history.pushState({ cgGuard: true }, "", window.location.href);
          armed.current = true;
        }
        return;
      }
      // Landing DOWN onto the guard entry (back from an entry pushed above
      // it, e.g. a book modal): overlays stay as they are.
      const st = e.state as { cgGuard?: boolean } | null;
      if (st?.cgGuard) return;
      if (!armed.current) return; // genuine navigation — not ours
      armed.current = false;
      const open = layersRef.current.filter((l) => l.open);
      open[0]?.close();
      if (open.length > 1) {
        // More overlays behind — keep guarding.
        window.history.pushState({ cgGuard: true }, "", window.location.href);
        armed.current = true;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enabled]);
}
