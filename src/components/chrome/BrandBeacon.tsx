"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import SternwarteRings from "@/components/shared/SternwarteRings";

/**
 * BrandBeacon — the scrolled-in brand anchor, top-left on every scrollable
 * surface. Unscrolled, pages carry their own masthead (on the Hub the hero
 * IS the wordmark); once the reader scrolls, the observatory dot — the
 * .lx-btn origin in its bloomed hover state: gold dot, turning rings, three
 * survey stars — fades in as a way back Home. Placeholder for a real logo
 * mark. Not mounted on /map (SiteBrand's Tabula cartouche owns that edge),
 * /timeline (the stage doesn't scroll) or /login.
 *
 * Visibility is class-toggled from a passive scroll listener coalesced into
 * rAF (ScrollScrim's pattern) — no React state, no re-render per scroll.
 */
export default function BrandBeacon() {
  const pathname = usePathname();
  const ref = useRef<HTMLAnchorElement>(null);

  const hidden =
    pathname === "/login" ||
    pathname === "/map" ||
    pathname.startsWith("/map/") ||
    pathname === "/timeline" ||
    pathname.startsWith("/timeline/");

  useEffect(() => {
    if (hidden) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      ref.current?.classList.toggle("is-on", window.scrollY > 140);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    // Evaluate immediately on route change too — back/forward restores a
    // scroll position without firing a scroll event.
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [hidden, pathname]);

  if (hidden) return null;

  return (
    <Link
      ref={ref}
      href="/"
      className="brand-beacon"
      aria-label="Chrono Lexicanum · Home"
    >
      <SternwarteRings className="brand-beacon__rings" />
      <span className="brand-beacon__dot" aria-hidden />
      <span className="brand-beacon__star brand-beacon__star--1" aria-hidden />
      <span className="brand-beacon__star brand-beacon__star--2" aria-hidden />
      <span className="brand-beacon__star brand-beacon__star--3" aria-hidden />
    </Link>
  );
}
