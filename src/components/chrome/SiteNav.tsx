"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, ROMAN } from "./navEntries";

/**
 * SiteNav — the global left-edge navigation rail, mounted in the root layout
 * alongside SiteMenu. Primary navigation on wide screens: Roman numeral,
 * permanently visible title plus a quiet descriptive sublabel per entry, the
 * active route marked by the gold rubric stroke in the margin (CSS ::before).
 * Entries come grouped from navEntries.ts (Session 255): the groups render as
 * bare hairline separators here — the labelled version lives in the burger
 * overlay. On narrow viewports the rail is hidden and the SiteMenu burger
 * overlay takes over — see 46-site-nav.css.
 *
 * The rail lists the tools only — no "Home" (Philipp, Session 251): the
 * scrolled-in BrandBeacon (top-left dot) is the way back, and the burger
 * overlay still carries Home for touch.
 */

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();

  // The login gate stands outside the archive — no primary navigation there.
  if (pathname === "/login") return null;

  let index = 0;

  return (
    <nav className="site-nav" aria-label="Primary">
      <ul className="site-nav__list">
        {NAV_GROUPS.map((group, gi) => (
          <li key={group.name} className="site-nav__group">
            {gi > 0 && <span className="site-nav__sep" aria-hidden />}
            <ul className="site-nav__group-list" aria-label={group.name}>
              {group.entries.map((e) => {
                const num = ROMAN[index++];
                const current = isActive(pathname, e.href);
                return (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      className={`site-nav__link${current ? " is-current" : ""}`}
                      aria-current={current ? "page" : undefined}
                    >
                      <span className="site-nav__num" aria-hidden>
                        {num}
                      </span>
                      <span className="site-nav__text">
                        <span className="site-nav__title">{e.label}</span>
                        <span className="site-nav__sub">{e.sub}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
