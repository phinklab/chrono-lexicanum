"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteBrand — the fixed wordmark, top-left, counterpart to the vox readout on
 * the right. Not shown on the Hub (there the hero IS the wordmark), on the
 * login gate, or on the map (own chrome).
 */
export default function SiteBrand() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/map")) {
    return null;
  }
  return (
    <Link href="/" className="site-brand">
      Chrono Lexicanum
    </Link>
  );
}
