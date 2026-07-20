"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteNav — the global left-edge navigation rail, mounted in the root layout
 * alongside SiteMenu. Primary navigation on wide screens: Roman numeral plus
 * permanently visible title per entry, the active route marked by the gold
 * rubric stroke in the margin (CSS ::before). On narrow viewports the rail is
 * hidden and the SiteMenu burger overlay takes over — see 46-site-nav.css.
 */

type NavEntry = {
  num: string;
  label: string;
  href: string;
};

/**
 * The rail lists the tools only — no "Home" (Philipp, Session 251): the
 * scrolled-in BrandBeacon (top-left dot) is the way back, and the burger
 * overlay still carries Home for touch. Status Imperialis sits between
 * Chronicle and Cartographer — time, now, space.
 */
const ENTRIES: readonly NavEntry[] = [
  { num: "I", label: "Archive", href: "/archive" },
  { num: "II", label: "Compendium", href: "/compendium" },
  { num: "III", label: "Curator", href: "/ask" },
  { num: "IV", label: "Chronicle", href: "/timeline" },
  { num: "V", label: "Status Imperialis", href: "/now" },
  { num: "VI", label: "Cartographer", href: "/map" },
  { num: "VII", label: "Librarium", href: "/statistics" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();

  // The login gate stands outside the archive — no primary navigation there.
  if (pathname === "/login") return null;

  return (
    <nav className="site-nav" aria-label="Primary">
      <ul className="site-nav__list">
        {ENTRIES.map((e) => {
          const current = isActive(pathname, e.href);
          return (
            <li key={e.href}>
              <Link
                href={e.href}
                className={`site-nav__link${current ? " is-current" : ""}`}
                aria-current={current ? "page" : undefined}
              >
                <span className="site-nav__num" aria-hidden>
                  {e.num}
                </span>
                <span className="site-nav__title">{e.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
