"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import EraToggle from "./EraToggle";

/**
 * TopNav — fixed top bar visible on every route. Client component so the
 * active-link class derives from usePathname() without an extra island.
 * EraToggle stays a Suspense-wrapped client island reading ?era=.
 */

type NavItem = { id: string; label: string; href: string; match: (path: string) => boolean };

const ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", match: (p) => p === "/" },
  { id: "books", label: "Bücher", href: "/buecher", match: (p) => p.startsWith("/buecher") || p.startsWith("/buch") },
  { id: "ask", label: "Ask", href: "/ask", match: (p) => p.startsWith("/ask") },
  { id: "chronicle", label: "Chronicle", href: "/timeline", match: (p) => p.startsWith("/timeline") },
  { id: "cartog", label: "Cartographer", href: "/map", match: (p) => p.startsWith("/map") },
];

export default function TopNav() {
  const pathname = usePathname() ?? "/";
  return (
    <div className="top-nav" role="banner">
      <Link href="/" className="top-nav__mark" aria-label="Chrono Lexicanum — Hub">
        <Image
          src="/img/logo_cl_v2.svg"
          alt=""
          width={120}
          height={30}
          className="top-nav__logo"
          priority
        />
        <span className="top-nav__name">CHRONO · LEXICANUM</span>
      </Link>

      <nav className="top-nav__links" aria-label="Primary">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`top-nav__link${active ? " top-nav__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="top-nav__right">
        <span className="c-pulse top-nav__signal" aria-hidden />
        <span className="top-nav__status">DATASTREAM STABLE</span>
        <Suspense fallback={<EraToggleFallback />}>
          <EraToggle />
        </Suspense>
      </div>
    </div>
  );
}

function EraToggleFallback() {
  return (
    <div className="era-toggle" aria-hidden>
      <button type="button" tabIndex={-1}>M30</button>
      <button type="button" tabIndex={-1}>M31</button>
      <button type="button" tabIndex={-1}>M42</button>
    </div>
  );
}
