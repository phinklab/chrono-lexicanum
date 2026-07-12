"use client";

/**
 * Client island around the Acquire actions: resolves the visitor's store
 * region IN THE BROWSER so the canonical /book/[slug] page can be SSG/ISR
 * (Launch S4). The previous server-side resolution (retired
 * src/lib/store-region.ts) read `headers()` + `searchParams` and thereby
 * forced the whole route dynamic per request — exactly the design decision
 * the old page header flagged.
 *
 * Precedence (mirrors the retired server logic):
 *   1. explicit `?store=` override (written by <RegionSwitcher>)
 *   2. `navigator.languages` first usable tag → region (the client twin of
 *      the old Accept-Language parsing — same table, same subtag precedence)
 *   3. DEFAULT_REGION (US)
 *
 * The Vercel geo header (`x-vercel-ip-country`) has no client equivalent and
 * is deliberately dropped: keeping it would keep the route dynamic, and
 * browser language is the store signal that survives (an English browser
 * usually wants the .com store regardless of IP).
 *
 * `useSearchParams` bails static prerendering up to the nearest Suspense
 * boundary, so the server parent (<BookDetailView>) mounts this island inside
 * <Suspense> with the DEFAULT_REGION actions as fallback — the static shell
 * (and a no-JS visit) always carries working store links.
 *
 * `navigator` is browser-only: the detection is a one-shot read, not a
 * subscription, so it goes through `useSyncExternalStore` with a no-op
 * subscribe and a `null` server snapshot — SSR (the modal renders this island
 * server-side on soft-nav) and hydration agree on the deterministic default,
 * the browser value arrives without a setState-in-effect cascade.
 */
import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_REGION,
  normalizeStoreRegion,
  regionFromLanguageTags,
  type StoreRegion,
} from "@/lib/store-links";
import BuyListenActions from "./BuyListenActions";
import RegionSwitcher from "./RegionSwitcher";
import type { AudioCreditData } from "./AudioCredit";

export interface StoreActionsProps {
  title: string;
  author: string | null;
  isbn: string | null;
  audio: AudioCreditData | null;
}

function subscribeNever(): () => void {
  // Region-by-language needs no reactivity; re-renders re-read the snapshot.
  return () => {};
}

/** Client snapshot — a primitive (region code or null), so it is Object.is-
 *  stable across calls as long as the browser languages don't change. */
function detectRegionSnapshot(): StoreRegion | null {
  return regionFromLanguageTags(
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language],
  );
}

function serverRegionSnapshot(): StoreRegion | null {
  return null;
}

export default function StoreActions(props: StoreActionsProps) {
  const params = useSearchParams();
  const override = normalizeStoreRegion(params.get("store"));

  const detected = useSyncExternalStore(
    subscribeNever,
    detectRegionSnapshot,
    serverRegionSnapshot,
  );

  const region = override ?? detected ?? DEFAULT_REGION;

  return (
    <>
      <BuyListenActions {...props} region={region} />
      <RegionSwitcher active={region} />
    </>
  );
}
