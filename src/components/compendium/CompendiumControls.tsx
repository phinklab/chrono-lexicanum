"use client";

/**
 * Compendium directory controls (Brief 129). Search + optional facet pills +
 * sort, all URL-mirrored via `router.replace` — the server page reads the same
 * params and renders the filtered rows, so a filtered directory is a shareable
 * link (the /werke + /fraktionen discipline, reusing the shared `.browse-*`
 * vocabulary in the cyan house default — the Compendium drops the `catalogue`
 * class, so it never picks up the gold `body:has(main.catalogue)` re-skin).
 *
 * The facet axis is parameterised: factions pass `alignment` pills, the other
 * categories pass none and the bar shows only search + sort.
 *
 * Layout is the shared browse console (61-browse.css): the centred seek line
 * on top (Enter commits), the quieter facet/sort text options in
 * `.browse-controls` below.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { CompendiumFacet } from "@/lib/compendium/categories";
import { SORT_OPTIONS, type CompendiumSortKey } from "@/lib/compendium/filters";

export default function CompendiumControls({
  noun,
  facets,
  facetParam,
  facetLabel,
}: {
  /** Singular noun for the search placeholder ("Find a faction…"). */
  noun: string;
  facets?: ReadonlyArray<CompendiumFacet>;
  facetParam?: string;
  /** Group label for the facet pills (e.g. "Allegiance"). */
  facetLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = (params.get("sort") as CompendiumSortKey | null) ?? "covered";
  const activeFacet = facetParam ? params.get(facetParam) : null;
  const qParam = params.get("q") ?? "";

  // Re-sync the search box if q changes from outside (Clear all) — render-time,
  // no effect (avoids react-hooks/set-state-in-effect).
  const [q, setQ] = useState(qParam);
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setQ(qParam);
  }

  const anyFilter = Boolean(qParam || activeFacet);

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setParam("q", q.trim() || null);
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (sort !== "covered") next.set("sort", sort);
    commit(next);
  }

  return (
    <div
      className="browse-filters"
      role="group"
      aria-label={`Filter the ${noun} directory`}
    >
      <form className="browse-search" role="search" onSubmit={onSearchSubmit}>
        <input
          type="search"
          className="browse-search__input"
          placeholder={`Find a ${noun}…`}
          aria-label={`Search ${noun}s by name — press Enter to apply`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {qParam && (
          <button
            type="button"
            className="browse-search__clear"
            aria-label="Clear search"
            onClick={() => setParam("q", null)}
          >
            ×
          </button>
        )}
      </form>

      <div className="browse-controls">
        {facets && facetParam && facets.length > 0 && (
          <div
            className="browse-sort"
            role="group"
            aria-label={facetLabel ?? "Facet"}
          >
            <span className="browse-sort__label" aria-hidden>
              {facetLabel ?? "Filter"}
            </span>
            {facets.map((o) => {
              const isActive = activeFacet === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`browse-pill${isActive ? " active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => setParam(facetParam, isActive ? null : o.id)}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="browse-sort" role="group" aria-label="Sort">
          <span className="browse-sort__label" aria-hidden>
            Sort
          </span>
          {SORT_OPTIONS.map((o) => {
            const isActive = sort === o.id;
            return (
              <button
                key={o.id}
                type="button"
                className={`browse-pill${isActive ? " active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setParam("sort", o.id === "covered" ? null : o.id)}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {anyFilter && (
          <button type="button" className="browse-clear" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
