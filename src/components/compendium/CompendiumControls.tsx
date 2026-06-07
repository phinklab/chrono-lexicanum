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
 * Layout mirrors /werke's two-row query console (66-compendium.css dissolves the
 * boxed `.browse-filters` into a column): an elegant serif search line under a
 * cyan hairline on top, the quieter facet/sort pills wrapped in `.browse-controls`
 * below. The leading auspex sigil matches the /werke + /podcasts search mark.
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
        <svg className="browse-search__sigil" viewBox="0 0 16 16" aria-hidden>
          <circle
            cx="8"
            cy="8"
            r="5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M8 0.5v3M8 12.5v3M0.5 8h3M12.5 8h3"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
        <input
          type="search"
          className="browse-search__input"
          placeholder={`Find a ${noun}…`}
          aria-label={`Search ${noun}s by name`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="browse-search__go" aria-label="Search">
          →
        </button>
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
