"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * TopNav — fixed top bar visible on every route. Client component so the
 * active-link class derives from usePathname() without an extra island.
 *
 * Scroll-collapse: on scroll past ~24px, the nav-links fade out and the Mark
 * collapses to a centred, enlarged logo-only icon that drops in from above.
 *
 * Logo-Klick verhält sich kontextabhängig:
 *   - expanded → Link nach Home (default).
 *   - collapsed → preventDefault, Nav klappt wieder auf. Override-Flag verhindert,
 *     dass der scroll-Listener die Nav sofort wieder zusammenklappt. Der Override
 *     löst sich, sobald der User signifikant weiterscrollt (OVERRIDE_RESET_SCROLL).
 */

type NavItem = { id: string; label: string; href: string; match: (path: string) => boolean };

const ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", match: (p) => p === "/" },
  { id: "works", label: "Archive", href: "/werke", match: (p) => p.startsWith("/werke") || p.startsWith("/buch") },
  { id: "podcasts", label: "Podcasts", href: "/podcasts", match: (p) => p.startsWith("/podcasts") },
  { id: "compendium", label: "Compendium", href: "/compendium", match: (p) => p.startsWith("/compendium") || p.startsWith("/fraktion") || p.startsWith("/charakter") || p.startsWith("/welt") || p.startsWith("/person") },
  { id: "ask", label: "Ask", href: "/ask", match: (p) => p.startsWith("/ask") },
  { id: "chronicle", label: "Chronicle", href: "/timeline", match: (p) => p.startsWith("/timeline") },
  { id: "cartog", label: "Cartographer", href: "/map", match: (p) => p.startsWith("/map") },
];

const SCROLL_THRESHOLD = 24;
const OVERRIDE_RESET_SCROLL = 60;

export default function TopNav() {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const overrideRef = useRef<{ active: boolean; startY: number }>({ active: false, startY: 0 });

  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      raf = null;
      if (overrideRef.current.active) {
        if (Math.abs(window.scrollY - overrideRef.current.startY) > OVERRIDE_RESET_SCROLL) {
          overrideRef.current.active = false;
        } else {
          return;
        }
      }
      setCollapsed(window.scrollY > SCROLL_THRESHOLD);
    };
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  const handleMarkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (collapsed) {
        e.preventDefault();
        overrideRef.current = { active: true, startY: window.scrollY };
        setCollapsed(false);
      }
    },
    [collapsed],
  );

  return (
    <div className={`top-nav${collapsed ? " top-nav--collapsed" : ""}`} role="banner">
      <Link
        href="/"
        className="top-nav__mark"
        aria-label={collapsed ? "Open navigation" : "Chrono Lexicanum — Hub"}
        onClick={handleMarkClick}
      >
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

      <nav className="top-nav__links" aria-label="Primary" aria-hidden={collapsed}>
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`top-nav__link${active ? " top-nav__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
              tabIndex={collapsed ? -1 : undefined}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
