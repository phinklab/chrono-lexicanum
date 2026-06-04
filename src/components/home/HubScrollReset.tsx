"use client";

import { useEffect } from "react";

/**
 * HubScrollReset — Home is a three-act snap *entry* page, so it must open on
 * Act 1 with the TopNav visible. Browsers natively restore the previous scroll
 * offset on reload (a real F5-after-scrolling, and dev HMR reloads); with
 * mandatory snap + the scroll-collapsing TopNav, a restored offset parked the
 * page mid-act with the nav already hidden. We opt this page out of native
 * scroll restoration and pin the viewport to the top on mount. Restoration is
 * handed back on unmount, so every other route keeps its remembered position.
 *
 * Renders nothing — it's a behavioural island, mounted once inside <main.hub>.
 */
export default function HubScrollReset() {
  useEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    // Pin to the top INSTANTLY — the hub scroller has scroll-behavior:smooth, so
    // a bare scrollTo would animate a visible "scroll up" on load; force instant.
    const pin = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    pin();
    // The large hub.webp can make the browser restore the prior offset on the
    // *late* `load` event — after this effect already ran. Re-pin once then so
    // the restore can't win the race and leave the page parked mid-act.
    window.addEventListener("load", pin, { once: true });
    return () => {
      history.scrollRestoration = prev;
      window.removeEventListener("load", pin);
    };
  }, []);

  return null;
}
