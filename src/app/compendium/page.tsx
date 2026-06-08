/**
 * Compendium overview (Brief 129, reworked). The orientation surface: five
 * category segments — Factions featured full-width on top, the other four in a
 * 2×2 below. Each is a frameless washed panel (the /ask "segment" treatment)
 * carrying its eyebrow, count, a short intro and one quiet coverage stat, plus a
 * "view all" into the full directory. Progressive disclosure — every faction is
 * reachable, but the start view is a hall of doorways (no longer a peek list).
 * The shared hero + nav come from the layout.
 */
import type { CSSProperties } from "react";
import Link from "next/link";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";
import { loadCategoryItems } from "@/lib/compendium/loader";

// The overview reads no searchParams, so it can be statically generated and
// served from the CDN, refreshed every few minutes (matches Home / /podcasts).
// Kept in step with READ_CACHE_TTL in src/lib/db-cache.ts. The category pages
// stay dynamic (searchParams) but pull from the same cached loaders.
export const revalidate = 300;

function countCopy(n: number, noun: string, pending: boolean): string {
  if (pending && n === 0) return "Curation in progress";
  return `${n} ${n === 1 ? noun : `${noun}s`}`;
}

/**
 * The "data-forward" line under a segment's intro: one quiet coverage stat
 * summarising how much lies behind the door, split into its live number + the
 * trailing words so the view can tint the figure cyan. Derived in-memory by
 * summing the category's item weights — these are *edges* (a faction's book +
 * podcast links, a character's or world's appearances, an author's credited
 * works), NOT distinct titles, so the copy says "appearances" / "works credited",
 * never "books". A pending category (sumWeight 0) returns null → its pending
 * sentence shows instead.
 */
function statLine(
  slug: string,
  sumWeight: number,
): { n: string; rest: string } | null {
  if (sumWeight <= 0) return null;
  const n = sumWeight.toLocaleString("en");
  const appearances = sumWeight === 1 ? "appearance" : "appearances";
  switch (slug) {
    case "fraktionen":
      return { n, rest: `${appearances} across books & podcasts` };
    case "primarchen":
    case "charaktere":
    case "welten":
      return { n, rest: appearances };
    case "autoren":
      return { n, rest: `${sumWeight === 1 ? "work" : "works"} credited` };
    default:
      return null;
  }
}

export default async function CompendiumOverview() {
  const doors = await Promise.all(
    COMPENDIUM_CATEGORIES.map(async (c) => {
      const items = await loadCategoryItems(c.slug);
      const sumWeight = items.reduce((sum, it) => sum + it.weight, 0);
      return { category: c, count: items.length, sumWeight };
    }),
  );

  return (
    <section className="cmp-overview" aria-label="Compendium categories">
      <ul className="cmp-doors">
        {doors.map(({ category: c, count, sumWeight }, i) => {
          const href = `/compendium/${c.slug}`;
          const stat = statLine(c.slug, sumWeight);
          // Factions leads (richest, most-linked) — featured full-width; the rest
          // fall into the 2×2 below. The CSS keys the span + accents off `--hero`.
          const cls = i === 0 ? "cmp-door cmp-door--hero" : "cmp-door";
          return (
            <li
              key={c.slug}
              className="cmp-doors__cell"
              style={{ "--door-i": i } as CSSProperties}
            >
              <article className={cls}>
                <Link href={href} className="cmp-door__head">
                  <span className="cmp-door__eyebrow">{c.eyebrow}</span>
                  <span className="cmp-door__label">{c.label}</span>
                  <span className="cmp-door__count">
                    {countCopy(count, c.noun, Boolean(c.pending))}
                  </span>
                </Link>

                <p className="cmp-door__blurb">{c.blurb}</p>

                {stat ? (
                  <p className="cmp-door__stat">
                    <span className="cmp-door__stat-n">{stat.n}</span> {stat.rest}
                  </p>
                ) : c.pending ? (
                  <p className="cmp-door__pending">
                    The roster is being curated — this doorway opens soon.
                  </p>
                ) : null}

                <Link href={href} className="cmp-door__all">
                  View all {c.label} →
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
