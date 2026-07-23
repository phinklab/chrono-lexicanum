"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { lazy, Suspense } from "react";

// The menu trigger is visible immediately in server HTML, so its client code
// must be part of Next's initial preload graph as well. Plain React.lazy left
// a cold-load window where the visible burger accepted a click before it was
// hydrated (caught by the required mobile smoke test).
const NavigationChrome = dynamic(() => import("./NavigationChrome"), {
  loading: () => null,
});
const SiteBrand = lazy(() => import("./SiteBrand"));
const BrandBeacon = lazy(() => import("./BrandBeacon"));
const MediaPlayer = lazy(() => import("./MediaPlayer"));

function isMapRoute(pathname: string): boolean {
  return pathname === "/map" || pathname.startsWith("/map/");
}

function isTimelineRoute(pathname: string): boolean {
  return pathname === "/timeline" || pathname.startsWith("/timeline/");
}

/**
 * Route-aware app chrome boundary. The preview login renders none of the
 * archive chrome, so its client modules stay outside that route's initial
 * graph instead of mounting and being hidden with CSS. Route-exclusive brand
 * marks are imported only on routes where they actually render.
 */
export function NavigationChromeGate() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const onMap = isMapRoute(pathname);
  const showBeacon = !onMap && !isTimelineRoute(pathname);

  return (
    <>
      <NavigationChrome />
      <Suspense fallback={null}>
        {onMap && <SiteBrand />}
        {showBeacon && <BrandBeacon />}
      </Suspense>
    </>
  );
}

/**
 * Kept separate from NavigationChromeGate so the player retains its original
 * DOM position after page/modal content while still staying off /login.
 */
export function MediaPlayerGate() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <Suspense fallback={null}>
      <MediaPlayer />
    </Suspense>
  );
}
