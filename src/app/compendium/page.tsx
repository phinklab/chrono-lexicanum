/**
 * Compendium overview. The orientation surface: five
 * category segments — Factions featured full-width on top, the other four in a
 * 2×2 below. Each is a frameless washed panel (the /ask "segment" treatment)
 * carrying its count, a short intro and one quiet coverage stat, plus a
 * "view all" into the full directory. Progressive disclosure — every faction is
 * reachable, but the start view is a hall of doorways (no longer a peek list).
 * The shared hero + nav come from the layout.
 */
import Link from "next/link";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";
import { loadCategoryItems } from "@/lib/compendium/loader";

// Rendered per request, never prerendered at build. The overview's cold fill
// (five category builders + the layout counts) is the heaviest aggregate in the
// app; as an ISR page it would run at build time, compete with ~1100 entity
// pages for the max-5 pooler pool and blow Vercel's static-generation timeout,
// aborting deploys. ISR would also
// cache a degraded (DB-error → empty) render as the page's HTML for a full
// revalidate window, where force-dynamic limits a bad fill to one request.
// At runtime the cachedRead layer (READ_CACHE_TTL, 3600 s)
// makes this fast: one real fill per hour, every other request served
// from the Data Cache, with `loading.tsx` covering the rare cold fill. The
// category pages are dynamic anyway (searchParams) and pull from the same
// cached loaders.
export const dynamic = "force-dynamic";

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

function Door({
  category: c,
  count,
  sumWeight,
  hero,
}: {
  category: (typeof COMPENDIUM_CATEGORIES)[number];
  count: number;
  sumWeight: number;
  hero?: boolean;
}) {
  const stat = statLine(c.slug, sumWeight);
  return (
    <Link
      href={`/compendium/${c.slug}`}
      className={`cmp-door${hero ? " cmp-door--hero" : ""}`}
    >
      <h3 className="cmp-door__label">{c.label}</h3>
      {/* Exactly ONE figure line per door (minimise the first
          info load) — holdings in gold, coverage behind it. */}
      <p className="cmp-door__stat">
        {c.pending && count === 0 ? (
          "Curation in progress — this doorway opens soon"
        ) : (
          <>
            <b>{count}</b> {count === 1 ? c.noun : `${c.noun}s`}
            {stat && (
              <>
                {" "}
                · {stat.n} {stat.rest}
              </>
            )}
          </>
        )}
      </p>
      <p className="cmp-door__blurb">{c.blurb}</p>
      <span className="cmp-door__all">View all {c.label} →</span>
    </Link>
  );
}

export default async function CompendiumOverview() {
  const doors = await Promise.all(
    COMPENDIUM_CATEGORIES.map(async (c) => {
      const items = await loadCategoryItems(c.slug);
      const sumWeight = items.reduce((sum, it) => sum + it.weight, 0);
      return { category: c, count: items.length, sumWeight };
    }),
  );

  // Factions leads (richest, most-linked) — featured full-width; the rest
  // fall into the 2×2 grid below.
  const [heroDoor, ...rest] = doors;

  return (
    <section className="cmp-overview" aria-label="Compendium categories">
      <h2 className="lx-sect reveal">The Doorways</h2>
      <div className="reveal">
        <Door {...heroDoor} hero />
        <div className="cmp-doors-grid">
          {rest.map((d) => (
            <Door key={d.category.slug} {...d} />
          ))}
        </div>
      </div>
    </section>
  );
}
