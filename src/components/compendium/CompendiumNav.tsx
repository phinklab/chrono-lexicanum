"use client";

/**
 * Compendium category nav (Brief 129). A persistent row of doorway tabs — the
 * Index (overview) plus the five categories — with live counts. Client-only so
 * the active tab tracks `usePathname`; the counts are loaded server-side in the
 * layout and passed down (the nav itself is db-free). A pending category with no
 * data yet shows "soon" instead of a zero, so the door reads as forthcoming, not
 * empty. `counts: null` is the layout's Suspense fallback while the counts
 * stream in — the tabs render without badges rather than with misleading zeros.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";

export default function CompendiumNav({
  counts,
}: {
  counts: Record<string, number> | null;
}) {
  const pathname = usePathname();
  const indexActive = pathname === "/compendium";

  return (
    <nav className="cmp-nav" aria-label="Compendium categories">
      <Link
        href="/compendium"
        className={`cmp-nav__tab${indexActive ? " is-active" : ""}`}
        aria-current={indexActive ? "page" : undefined}
      >
        <span className="cmp-nav__label">Index</span>
      </Link>
      {COMPENDIUM_CATEGORIES.map((c) => {
        const href = `/compendium/${c.slug}`;
        const active = pathname === href;
        const n = counts ? counts[c.slug] ?? 0 : null;
        return (
          <Link
            key={c.slug}
            href={href}
            className={`cmp-nav__tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="cmp-nav__label">{c.label}</span>
            {n != null && (
              <span className="cmp-nav__count" aria-hidden>
                {c.pending && n === 0 ? "soon" : n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
