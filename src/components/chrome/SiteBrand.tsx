"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteBrand — the fixed wordmark, top-left, counterpart to the vox readout on
 * the right. Not shown on the Hub (there the hero IS the wordmark) or on the
 * login gate. On the map it stays (Brief 178, fixierte Anatomie:
 * "SiteBrand + Burger bleiben").
 */
export default function SiteBrand() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") {
    return null;
  }
  return (
    <Link href="/" className="site-brand">
      Chrono Lexicanum
    </Link>
  );
}
