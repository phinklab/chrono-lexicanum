"use client";

import Link from "next/link";

/**
 * SiteBrand — the "Chrono Lexicanum" wordmark centred on the Cartographer's
 * north edge. On every other route the fixed top-left wordmark is retired
 * (2026-07-08): it overlapped page chrome on mobile and read as noise on
 * desktop — the burger menu carries Home, and on the Hub the hero IS the
 * wordmark. The "· Tabula" suffix went 2026-07-13: with the vox stud in the
 * top-left corner the long form collided on phones — the plain wordmark is
 * the whole mark (a drawn logo may replace it later). Map positioning lives
 * in 55-map.css (body.cg-on-map).
 */
export default function SiteBrand() {
  return (
    <Link href="/" className="site-brand">
      Chrono Lexicanum
    </Link>
  );
}
