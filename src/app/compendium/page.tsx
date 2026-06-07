/**
 * Compendium overview (Brief 129). The orientation surface: five doors, each a
 * category with its sigil, count, blurb and a peek of its most-covered entities,
 * plus a "view all" into the full directory. Progressive disclosure — every
 * faction is reachable, but the start view is a hall of doorways, not a flat
 * wall. The shared hero + nav come from the layout.
 */
import Link from "next/link";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";
import {
  loadCategoryItems,
  loadCompendiumCounts,
} from "@/lib/compendium/loader";

// The overview reads no searchParams, so it can be statically generated and
// served from the CDN, refreshed every few minutes (matches Home / /podcasts).
// Kept in step with READ_CACHE_TTL in src/lib/db-cache.ts. The category pages
// stay dynamic (searchParams) but pull from the same cached loaders.
export const revalidate = 300;

const PEEK_LIMIT = 5;

function countCopy(n: number, noun: string, pending: boolean): string {
  if (pending && n === 0) return "Curation in progress";
  return `${n} ${n === 1 ? noun : `${noun}s`}`;
}

export default async function CompendiumOverview() {
  const counts = await loadCompendiumCounts();
  const peeks = await Promise.all(
    COMPENDIUM_CATEGORIES.map(async (c) => {
      const items = await loadCategoryItems(c.slug);
      const top = [...items]
        .sort(
          (a, b) => b.weight - a.weight || a.name.localeCompare(b.name, "en"),
        )
        .slice(0, PEEK_LIMIT);
      return { category: c, top };
    }),
  );

  return (
    <section className="cmp-overview" aria-label="Compendium categories">
      <ul className="cmp-doors">
        {peeks.map(({ category: c, top }) => {
          const n = counts[c.slug] ?? 0;
          const href = `/compendium/${c.slug}`;
          return (
            <li key={c.slug} className="cmp-doors__cell">
              <article className="cmp-door">
                <Link href={href} className="cmp-door__head">
                  <span className="cmp-door__eyebrow">{c.eyebrow}</span>
                  <span className="cmp-door__label">{c.label}</span>
                  <span className="cmp-door__count">
                    {countCopy(n, c.noun, Boolean(c.pending))}
                  </span>
                </Link>

                <p className="cmp-door__blurb">{c.blurb}</p>

                {top.length > 0 ? (
                  <ul className="cmp-door__peek">
                    {top.map((it) => (
                      <li key={it.id}>
                        <Link href={it.href} className="cmp-door__peek-item">
                          <span className="cmp-door__peek-name">{it.name}</span>
                          {it.meta ? (
                            <span className="cmp-door__peek-meta">{it.meta}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
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
