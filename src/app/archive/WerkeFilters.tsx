"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import BrowseSearch from "@/components/browse/BrowseSearch";
import FilterSelect from "@/components/browse/FilterSelect";
import {
  characterFocusHref,
  factionFocusHref,
  primarchFocusHref,
  SORT_OPTIONS,
  worldFocusHref,
  type SortKey,
  type Suggestion,
} from "./filters";

type Option = { value: string; label: string };

/**
 * Public browse controls for `/werke`. Every control writes to the
 * URL (`router.replace`, scroll preserved) so a filtered view is a shareable
 * link and the server re-renders the list. This island only reads/writes
 * params — the server owns the actual filtering (`applyWorksFilters`).
 *
 * The search itself is the shared `<BrowseSearch>` console:
 * a grouped typeahead over the lazily-fetched index (/api/search-index) of
 * books, podcasts, factions, facets, formats and authors. Here it mostly
 * filters IN PLACE —
 * picking a facet/format applies that filter, an author or raw Enter sets `q`, a
 * book opens it; entity and podcast picks navigate to their canonical surfaces.
 * (Home renders the same console in navigate-mode.) The console owns the
 * combobox mechanics; this island owns the routing semantics.
 *
 * Two rows by design: the prominent query console over a quieter row of facet
 * controls (Faction / Format / Sort). The dropdowns are the on-brand
 * `FilterSelect` (ARIA listbox), not native `<select>`.
 */
export default function WerkeFilters({
  factions,
  formats,
  activeFacet,
}: {
  factions: Option[];
  formats: Option[];
  activeFacet: { id: string; name: string; category: string | null } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort: SortKey = params.get("sort") === "release" ? "release" : "title";
  const faction = params.get("faction") ?? "";
  const format = params.get("format") ?? "";
  const facet = params.get("facet");
  const qParam = params.get("q") ?? "";

  // Local mirror of the search box so typing doesn't replace the URL on every
  // keystroke; the URL updates on submit (Enter) or on picking a suggestion.
  // When the URL's q changes from outside (a facet link, Clear all), re-sync
  // during render — React's "adjust state when a prop changes" pattern, no
  // effect needed. The box value is controlled, handed down to <BrowseSearch>.
  const [q, setQ] = useState(qParam);
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setQ(qParam);
  }

  const anyFilter = Boolean(qParam || faction || format || facet);

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Any filter/sort/query change re-derives the result set — a page number
    // held over from the previous view would point into the void (S6 pager).
    next.delete("page");
    commit(next);
  }

  // Commit a picked suggestion. A book opens (soft-nav → the `(.)book` intercept
  // mounts the overlay); a faction jumps to its hub; facet/format apply that
  // filter and consume the typed text; an author runs a text search for that name.
  function onPick(s: Suggestion) {
    switch (s.kind) {
      case "book":
        // Consume the draft so the input is empty when focus returns here after
        // the book overlay closes (else onFocus would reopen the dropdown over
        // the just-dismissed book).
        setQ("");
        router.push(`/book/${s.value}`);
        break;
      case "podcast":
        // A podcast pick leaves the archive for /podcasts (show page or episode
        // deep link) — not a filter-in-place, so just navigate to `href`.
        if (s.href) {
          setQ("");
          router.push(s.href);
        }
        break;
      case "faction":
        // A faction picked in the SEARCH jumps to the faction hub (popup over the
        // Compendium directory, books AND podcasts) — consistent with Home and
        // /podcasts. The "Faction" dropdown below stays the in-place list filter.
        setQ("");
        router.push(factionFocusHref(s.value));
        break;
      case "primarch":
        // Like the faction pick — leaves the archive for the primarch hub (popup
        // over the Compendium primarch directory, books AND podcasts).
        setQ("");
        router.push(primarchFocusHref(s.value));
        break;
      case "character":
        setQ("");
        router.push(characterFocusHref(s.value));
        break;
      case "world":
        setQ("");
        router.push(worldFocusHref(s.value));
        break;
      case "facet":
        setQ("");
        setParam("facet", s.value);
        break;
      case "format":
        setQ("");
        setParam("format", s.value);
        break;
      case "author":
        setQ(s.value);
        setParam("q", s.value);
        break;
    }
  }

  function onSubmit(query: string) {
    setParam("q", query || null);
  }

  function onClear() {
    setQ("");
    setParam("q", null);
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (sort !== "title") next.set("sort", sort);
    commit(next);
  }

  return (
    <div className="browse-filters" role="group" aria-label="Browse the archive">
      <BrowseSearch
        value={q}
        onValueChange={setQ}
        onPick={onPick}
        onSubmit={onSubmit}
        onClear={onClear}
      />

      <div className="browse-controls">
        <FilterSelect
          label="Faction"
          value={faction}
          allLabel="All factions"
          options={factions}
          onChange={(v) => setParam("faction", v)}
        />
        <FilterSelect
          label="Format"
          value={format}
          allLabel="All formats"
          options={formats}
          onChange={(v) => setParam("format", v)}
        />

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
                onClick={() => setParam("sort", o.id === "title" ? null : o.id)}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {activeFacet && (
          <button
            type="button"
            className="browse-facet-chip"
            onClick={() => setParam("facet", null)}
            title="Clear facet filter"
          >
            <span className="browse-facet-chip__key">
              {activeFacet.category ?? "Facet"}:
            </span>{" "}
            {activeFacet.name}
            <span className="browse-facet-chip__x" aria-hidden>
              ×
            </span>
          </button>
        )}

        {anyFilter && (
          <button type="button" className="browse-clear" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
