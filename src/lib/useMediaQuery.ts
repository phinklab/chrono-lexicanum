"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media-query hook; the server snapshot renders the `false` branch,
 * so anything visible at first paint must be CSS-gated, not hook-gated.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );
}

export function useIsCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

/* Module-singleton MediaQueryLists for imperative per-frame code (map panel
 * placement, rail geometry) — reading `.matches` off a cached list is free,
 * constructing one per frame is not. */
let narrowMql: MediaQueryList | null = null;
let coarseMql: MediaQueryList | null = null;

/** True below the map-chrome breakpoint (900px). Safe to call on the server. */
export function isNarrow(): boolean {
  if (typeof window === "undefined") return false;
  narrowMql ??= window.matchMedia("(max-width: 900px)");
  return narrowMql.matches;
}

/** True on touch-first devices. Safe to call on the server. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  coarseMql ??= window.matchMedia("(pointer: coarse)");
  return coarseMql.matches;
}
