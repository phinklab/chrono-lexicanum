"use client";

/**
 * Compendium category nav — a quiet row of doorway links (Index + the five
 * categories), rendered on the category directories only; the overview leads
 * straight into the doorways. Client-only so the active entry tracks
 * `usePathname`. No count badges — the numbers live in the doors.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";

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
    </nav>
  );
}
