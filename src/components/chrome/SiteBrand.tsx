"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteBrand — the fixed wordmark, top-left, counterpart to the vox readout on
 * the right. Not shown on the Hub (there the hero IS the wordmark) or on the
 * login gate. On the map it stays (Brief 178, fixierte Anatomie:
 * "SiteBrand + Burger bleiben"), moves to the top center (bottom-left corner
 * politics: the legend owns the left flank now) and reads "· Tabula" —
 * Latin for the chart itself. Positioning lives in 55-map.css
 * (body.cg-on-map).
 */
export default function SiteBrand() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") {
    return null;
  }
  const onMap = pathname === "/map" || pathname.startsWith("/map/");
  return (
    <Link href="/" className="site-brand">
      Chrono Lexicanum
      {onMap && <span className="site-brand__map">&nbsp;· Tabula</span>}
    </Link>
  );
}
