/**
 * Compendium category directory (Brief 129). One dense, scannable deck of entity
 * rows in the Compendium's cyan "reader-language" (the /werke row discipline, in
 * teal) — each row a Link into the canonical detail route, which soft-navs into
 * the Brief-113 overlay. Filtering
 * is server-side and URL-mirrored (the <CompendiumControls> island writes the
 * params); factions group by alignment, the rest are flat. A not-yet-curated
 * category (Primarchs) renders a graceful pending state instead of a 404.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COMPENDIUM_CATEGORIES,
  findCategory,
  type CompendiumCategory,
  type CompendiumItem,
} from "@/lib/compendium/categories";
import { loadCategoryItems } from "@/lib/compendium/loader";
import {
  applyCompendiumFilters,
  isFiltered,
  parseCompendiumParams,
} from "@/lib/compendium/filters";
import CompendiumControls from "@/components/compendium/CompendiumControls";
import CompendiumFocusOpener from "@/components/compendium/CompendiumFocusOpener";

type Params = { category: string };
type Search = Record<string, string | string[] | undefined>;

// Build the five known categories ahead of time; an unknown slug 404s.
export function generateStaticParams(): Params[] {
  return COMPENDIUM_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = findCategory(category);
  if (!c) return { title: "Compendium — Chrono Lexicanum" };
  return {
    title: `${c.label} — Compendium — Chrono Lexicanum`,
    description: c.blurb,
  };
}

interface Group {
  key: string | null;
  label: string | null;
  items: CompendiumItem[];
}

/** Split into alignment groups (factions) or one flat group (everything else). */
function groupItems(
  items: CompendiumItem[],
  category: CompendiumCategory,
): Group[] {
  if (!category.grouped) return [{ key: null, label: null, items }];

  const order = (category.facets ?? []).map((f) => f.id);
  const byKey = new Map<string, CompendiumItem[]>();
  for (const it of items) {
    const k = it.groupKey ?? "_";
    const list = byKey.get(k);
    if (list) list.push(it);
    else byKey.set(k, [it]);
  }

  const groups: Group[] = [];
  for (const id of order) {
    const list = byKey.get(id);
    if (list && list.length > 0) {
      groups.push({ key: id, label: list[0].groupLabel ?? id, items: list });
      byKey.delete(id);
    }
  }
  // Any group key outside the declared facet order is appended, never dropped.
  for (const [key, list] of byKey) {
    groups.push({ key, label: list[0].groupLabel ?? key, items: list });
  }
  return groups;
}

export default async function CompendiumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { category } = await params;
  const c = findCategory(category);
  if (!c) notFound();

  const sp = await searchParams;
  const facetIds = (c.facets ?? []).map((f) => f.id);
  const p = parseCompendiumParams(sp, c.facetParam, facetIds);

  const all = await loadCategoryItems(c.slug);
  const shown = applyCompendiumFilters(all, p);
  const groups = groupItems(shown, c);
  const filtering = isFiltered(p);

  // Deep-link from the universal search (Home / /podcasts / /werke): a faction or
  // primarch pick lands here with `?focus=<id>` and opens that row's overlay over
  // the directory (resolved to its detail href so the client island stays
  // route-agnostic). An id not in this category is a graceful no-op.
  const focusRaw = sp.focus;
  const focusId = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;
  const focusHref = focusId
    ? all.find((it) => it.id === focusId)?.href ?? null
    : null;

  return (
    <section className="cmp-directory" aria-label={`${c.label} directory`}>
      {focusHref ? <CompendiumFocusOpener href={focusHref} /> : null}
      <header className="cmp-cat-intro">
        <p className="cmp-cat-intro__eyebrow">{c.eyebrow}</p>
        <h2 className="cmp-cat-intro__heading">{c.label}</h2>
        <p className="cmp-cat-intro__blurb">{c.blurb}</p>
      </header>

      {c.pending && all.length === 0 ? (
        <div className="cmp-empty">
          <p className="cmp-empty__lead">This doorway is being curated.</p>
          <p>
            The {c.label.toLowerCase()} roster isn’t catalogued yet. Once it is,
            every entry will appear here as a doorway into its books and podcasts —
            the page is already in place, waiting for the data.
          </p>
        </div>
      ) : all.length === 0 ? (
        <div className="cmp-empty">
          Nothing catalogued in this category yet.
        </div>
      ) : (
        <>
          <div className="cmp-toolbar">
            <span className="cmp-toolbar__count">{shown.length} · SHOWN</span>
            <span className="cmp-toolbar__total">
              / {all.length} {all.length === 1 ? c.noun : `${c.noun}s`}
            </span>
            {p.q ? (
              <span className="cmp-toolbar__query">
                for{" "}
                <span className="cmp-toolbar__query-term">“{p.q}”</span>
              </span>
            ) : null}
          </div>

          <CompendiumControls
            noun={c.noun}
            facets={c.facets}
            facetParam={c.facetParam}
            facetLabel={c.facetParam === "alignment" ? "Allegiance" : undefined}
          />

          {shown.length === 0 ? (
            <div className="cmp-empty">
              No {c.noun}s match {filtering ? "these filters" : "this view"}. Try
              widening the search or clearing the filters.
            </div>
          ) : (
            <div className="cmp-groups">
              {groups.map((g, gi) => {
                // 1-based ordinal continues across alignment groups so the
                // index reads as a position in the whole directory. Computed
                // purely from prior groups' sizes — no render-time mutation.
                const base = groups
                  .slice(0, gi)
                  .reduce((n, gg) => n + gg.items.length, 0);
                return (
                  <section className="cmp-group" key={g.key ?? "_all"}>
                    {g.label ? (
                      <h3 className="cmp-group__label">
                        <span className="cmp-group__name">
                          {g.label.toUpperCase()}
                        </span>
                        <span className="cmp-group__rule" aria-hidden />
                        <span className="cmp-group__count">
                          {g.items.length}
                        </span>
                      </h3>
                    ) : null}
                    <ol className="cmp-rows">
                      {g.items.map((it, i) => (
                        <li key={it.id}>
                          <CompendiumRow item={it} ordinal={base + i + 1} />
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CompendiumRow({
  item,
  ordinal,
}: {
  item: CompendiumItem;
  ordinal: number;
}) {
  return (
    <Link href={item.href} className="cmp-row">
      <span className="cmp-row__index" aria-hidden>
        {String(ordinal).padStart(3, "0")}
      </span>
      {item.glyph ? (
        <span className="cmp-row__glyph" aria-hidden>
          {item.glyph}
        </span>
      ) : (
        <span
          className="cmp-row__dot"
          aria-hidden
          style={{ background: item.dotColor ?? "var(--cl-dim)" }}
        />
      )}
      <span className="cmp-row__name">{item.name}</span>
      {item.kicker ? (
        <span className="cmp-row__kicker">{item.kicker}</span>
      ) : (
        <span className="cmp-row__kicker cmp-row__kicker--empty" aria-hidden>
          —
        </span>
      )}
      {item.meta ? <span className="cmp-row__meta">{item.meta}</span> : (
        <span className="cmp-row__meta" aria-hidden />
      )}
      <span className="cmp-row__chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}
