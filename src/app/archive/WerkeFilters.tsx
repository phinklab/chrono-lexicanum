"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import BrowseSearch from "@/components/browse/BrowseSearch";
import FilterSelect from "@/components/browse/FilterSelect";
import {
  characterFocusHref,
  factionFocusHref,
  parseSortKey,
  primarchFocusHref,
  SORT_OPTIONS,
  worldFocusHref,
  type ActiveFacetChip,
  type FacetPanelGroup,
  type Suggestion,
} from "./filters";

type Option = { value: string; label: string };

/**
 * URL-backed Archive controls: the server owns filtering, this island owns
 * routing. Search delegates mechanics to `BrowseSearch`; sort and the filter
 * ledger preserve scroll and shareability. Facets are OR within a category and
 * AND across categories, with every active selection visible/removable.
 */
export default function WerkeFilters({
  factions,
  formats,
  facetPanel,
  activeFacets,
}: {
  factions: Option[];
  formats: Option[];
  facetPanel: FacetPanelGroup[];
  activeFacets: ActiveFacetChip[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = parseSortKey(params.get("sort"));
  const faction = params.get("faction") ?? "";
  const format = params.get("format") ?? "";
  const facets = params.getAll("facet");
  const qParam = params.get("q") ?? "";

  // Whether the filter ledger is unfolded. Starts closed — the register opens
  // tidy — and deliberately NOT URL state: how the console is folded is
  // browsing ergonomics, not part of the shareable view. The trigger's gold
  // count keeps deep-linked selections visible while closed.
  const [panelOpen, setPanelOpen] = useState(false);

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

  const filterCount = facets.length + (faction ? 1 : 0) + (format ? 1 : 0);

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

  /** Rewrite the repeated `facet` params: toggle flips `id`, add-only keeps an
   *  already-selected id selected (a search pick must never REMOVE a filter). */
  function writeFacets(id: string, mode: "toggle" | "add") {
    const has = facets.includes(id);
    if (mode === "add" && has) return;
    const next = new URLSearchParams(params.toString());
    next.delete("facet");
    for (const f of facets) if (f !== id) next.append("facet", f);
    if (!has) next.append("facet", id);
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
        // /podcasts. The "Faction" row in the ledger stays the in-place filter.
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
        // ADDS to the multi-facet selection (WA-B1) — a pick narrows, it never
        // silently replaces what the visitor already combined.
        setQ("");
        writeFacets(s.value, "add");
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

  // Selections the ledger's chip rows can't show (a search pick from an
  // off-panel category, a curated-out id, a stale deep link) — they get a
  // removable chip row of their own. Panel selections stay visible ON their
  // panel chip: one visible truth per selection.
  const offPanelFacets = activeFacets.filter((c) => !c.inPanel);

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
        <div className="browse-sort" role="group" aria-label="Sort">
          {SORT_OPTIONS.map((o) => {
            const isActive = sort === o.id || sort === o.flip;
            const flipped = sort === o.flip;
            return (
              <button
                key={o.id}
                type="button"
                className={`browse-pill${isActive ? " active" : ""}`}
                aria-pressed={isActive}
                onClick={() => {
                  // Second click on the active pill flips the direction.
                  const next = isActive ? (flipped ? o.id : o.flip) : o.id;
                  setParam("sort", next === "title" ? null : next);
                }}
              >
                {flipped ? o.flipLabel : o.label}
              </button>
            );
          })}
        </div>

        <span className="browse-controls__sep" aria-hidden />

        {/* The line's composition never changes with filter state (the count
            is a fixed-width numeral slot in the trigger; "Clear all" lives in
            the census line as a server link) — it stays perfectly centred
            under the console and never shifts. */}
        <button
          type="button"
          className="browse-filters-toggle"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((o) => !o)}
        >
          Filters
          <span className="browse-filters-toggle__count">
            {filterCount > 0 ? filterCount : ""}
          </span>
          <span className="browse-filters-toggle__caret" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      {panelOpen && (
        <div className="filter-ledger" role="group" aria-label="Filter the register">
          <div className="filter-ledger__row">
            <FilterSelect
              label="Faction"
              value={faction}
              allLabel="All factions"
              options={factions}
              onChange={(v) => setParam("faction", v)}
            />
          </div>
          <div className="filter-ledger__row">
            <FilterSelect
              label="Format"
              value={format}
              allLabel="All formats"
              options={formats}
              onChange={(v) => setParam("format", v)}
            />
          </div>

          {facetPanel.map((g) => (
            <div key={g.id} className="filter-ledger__row" role="group" aria-label={g.label}>
              <span className="filter-ledger__label">{g.label}</span>
              <span className="filter-ledger__chips">
                {g.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`facet-chip${o.active ? " is-active" : ""}${
                      o.count === 0 && !o.active ? " is-void" : ""
                    }`}
                    aria-pressed={o.active}
                    onClick={() => writeFacets(o.id, "toggle")}
                  >
                    {o.name}
                    <span className="facet-chip__count">{o.count}</span>
                    {o.active && (
                      <span className="facet-chip__x" aria-hidden>
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </span>
            </div>
          ))}

          {offPanelFacets.length > 0 && (
            <div className="filter-ledger__row" role="group" aria-label="Other active filters">
              <span className="filter-ledger__label">Other</span>
              <span className="filter-ledger__chips">
                {offPanelFacets.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="browse-facet-chip"
                    onClick={() => writeFacets(c.id, "toggle")}
                    title="Clear facet filter"
                  >
                    <span className="browse-facet-chip__key">
                      {c.category ?? "Facet"}:
                    </span>{" "}
                    {c.name}
                    <span className="browse-facet-chip__x" aria-hidden>
                      ×
                    </span>
                  </button>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
