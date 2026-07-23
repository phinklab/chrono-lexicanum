"use client";

/**
 * Browser-side store selection keeps `/book/[slug]` static. Precedence is
 * `?store=`, browser language, then US; geo headers are intentionally ignored.
 * `useSyncExternalStore` keeps SSR/hydration on the deterministic default until
 * the one-shot browser value is available.
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
