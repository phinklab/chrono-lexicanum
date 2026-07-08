"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteBrand — the "Chrono Lexicanum · Tabula" cartouche on the Cartographer's
 * north edge (the chart names itself, portolan-style). On every other route
 * the fixed top-left wordmark is retired (2026-07-08): it overlapped page
 * chrome on mobile and read as noise on desktop — the burger menu carries
 * Home, and on the Hub the hero IS the wordmark. Map positioning lives in
 * 55-map.css (body.cg-on-map).
 */
export default function SiteBrand() {
  const pathname = usePathname();
  const onMap = pathname === "/map" || pathname.startsWith("/map/");
  if (!onMap) return null;
  return (
    <Link href="/" className="site-brand">
      Chrono Lexicanum
      <span className="site-brand__map">&nbsp;· Tabula</span>
    </Link>
  );
}
