"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * SiteNav — the global left-edge navigation rail, mounted in the root layout
 * alongside SiteMenu. This is the PRIMARY navigation on hover-capable wide
 * screens (≥860px): a thin column of Roman numerals that emerge into titled
 * entries on hover/focus. On touch / narrow viewports the rail is hidden by
 * CSS and the SiteMenu burger overlay takes over (a hover-reveal rail can't be
 * driven by a tap) — see 46-site-nav.css for the breakpoint hand-off.
 *
 * Built on the house tokens/fonts (Cinzel titles, Plex Mono numerals + glosses,
 * the --cl-gold / --cl-bone palette), not the design-export literals. Each entry
 * carries a Latin gloss sized to its own page; `--uw` sizes the hairline rule and
 * the hover hit-area so the whole emerged row is a real click target (the rule is
 * decorative, the link box stays a comfortable width).
 *
 * The rail is plain <Link>s — no open/close state, no scroll-lock, no focus trap.
 * Keyboard users get the same reveal as hover (focus-visible), and the current
 * route's numeral stays lit (aria-current="page").
 */

type NavEntry = {
  num: string;
  label: string;
  href: string;
  gloss: string;
  /** rule width ≈ title width; also drives the hover hit-area (see CSS) */
  uw: number;
};

const ENTRIES: readonly NavEntry[] = [
  { num: "I", label: "Home", href: "/", gloss: "LIMEN · THE THRESHOLD", uw: 165 },
  { num: "II", label: "Archive", href: "/archive", gloss: "LIBRORVM ET VOCVM", uw: 195 },
  { num: "III", label: "Compendium", href: "/compendium", gloss: "INDEX RERVM OMNIVM", uw: 255 },
  { num: "IV", label: "Ask", href: "/ask", gloss: "ORACVLVM COGITATORIS", uw: 130 },
  { num: "V", label: "Chronicle", href: "/timeline", gloss: "INDEX TEMPORIS", uw: 235 },
  { num: "VI", label: "Cartographer", href: "/map", gloss: "MAPPA STELLARVM", uw: 275 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Primary">
      <ul className="site-nav__list">
        {ENTRIES.map((e) => {
          const current = isActive(pathname, e.href);
          return (
            <li key={e.href} className="site-nav__item">
              <Link
                href={e.href}
                className={`site-nav__link${current ? " is-current" : ""}`}
                aria-current={current ? "page" : undefined}
                style={{ "--uw": `${e.uw}px` } as React.CSSProperties}
              >
                <span className="site-nav__num" aria-hidden>
                  {e.num}
                </span>
                <span className="site-nav__reveal" aria-hidden>
                  <span className="site-nav__title">{e.label}</span>
                  <span className="site-nav__rule" />
                  <span className="site-nav__gloss">{e.gloss}</span>
                </span>
                {/* Accessible name for the link — the visible title is aria-hidden
                    inside the decorative reveal, so name the link explicitly. */}
                <span className="sr-only">{e.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
