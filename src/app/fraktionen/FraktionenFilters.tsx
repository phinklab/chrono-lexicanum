"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ALIGNMENT_OPTIONS,
  SORT_OPTIONS,
  type FactionSortKey,
} from "./filters";

/**
 * Public guide controls for `/fraktionen` (Brief 120). Same URL-mirrored pill
 * discipline as `/werke`'s `WerkeFilters` and the `/buecher` SortPills, reusing
 * the shared `.browse-*` vocabulary (cyan default — `/fraktionen` is not the
 * gold `.catalogue` surface). The server owns the actual filtering.
 */
export default function FraktionenFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = (params.get("sort") as FactionSortKey | null) ?? "covered";
  const alignment = params.get("alignment");
  const qParam = params.get("q") ?? "";

  // Re-sync the search box when the URL's q changes from outside (Clear all)
  // during render — no effect (avoids react-hooks/set-state-in-effect).
  const [q, setQ] = useState(qParam);
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setQ(qParam);
  }

  const anyFilter = Boolean(qParam || alignment);

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
    <div className="browse-filters" role="group" aria-label="Filter the faction guide">
      <form className="browse-search" role="search" onSubmit={onSearchSubmit}>
        <input
          type="search"
          className="browse-search__input"
          placeholder="Find a faction…"
          aria-label="Search factions by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="browse-search__go" aria-label="Search">
          →
        </button>
      </form>

      <div className="browse-sort" role="group" aria-label="Alignment">
        <span className="browse-sort__label" aria-hidden>
          Allegiance
        </span>
        {ALIGNMENT_OPTIONS.map((o) => {
          const isActive = alignment === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={`browse-pill${isActive ? " active" : ""}`}
              aria-pressed={isActive}
              onClick={() => setParam("alignment", isActive ? null : o.id)}
            >
              {o.label}
            </button>
          );
        })}
      </div>

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
  );
}
