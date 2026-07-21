"use client";

/**
 * Compendium category nav — a quiet row of doorway links (Index + the five
 * categories + the two guided-pick tools), rendered on the category
 * directories and tool pages; the overview leads straight into the doorways.
 * Client-only so the active entry tracks `usePathname`. No count badges — the
 * numbers live in the doors.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  COMPENDIUM_CATEGORIES,
  COMPENDIUM_TOOLS,
} from "@/lib/compendium/categories";

export default function CompendiumNav() {
  const pathname = usePathname();
  const indexActive = pathname === "/compendium";

  return (
    <nav className="cmp-nav" aria-label="Compendium categories">
      <Link
        href="/compendium"
        className={`cmp-nav__tab${indexActive ? " is-active" : ""}`}
        aria-current={indexActive ? "page" : undefined}
      >
        Index
      </Link>
      {COMPENDIUM_CATEGORIES.map((c) => {
        const href = `/compendium/${c.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={c.slug}
            href={href}
            className={`cmp-nav__tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {c.label}
          </Link>
        );
      })}
      {COMPENDIUM_TOOLS.map((t) => {
        const href = `/compendium/${t.slug}`;
        // The faction tool carries drilldown segments — prefix-match those.
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={t.slug}
            href={href}
            className={`cmp-nav__tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
