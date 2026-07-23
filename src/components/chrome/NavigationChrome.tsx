"use client";

import RevealObserver from "@/components/shared/RevealObserver";
import SiteMenu from "./SiteMenu";
import SiteNav from "./SiteNav";

/**
 * Chrome shared by every archive route. RouteChrome owns route exclusions;
 * this module is loaded only when these controls can render or do useful work.
 */
export default function NavigationChrome() {
  return (
    <>
      <SiteNav />
      <SiteMenu />
      <RevealObserver />
    </>
  );
}
