"use client";

import { useState } from "react";
import BrowseSearch from "@/components/browse/BrowseSearch";
import { useRouteNav, useRouteNavState } from "@/components/chrono/RouteProgress";
import {
  characterFocusHref,
  factionFocusHref,
  primarchFocusHref,
  worldFocusHref,
  type Suggestion,
} from "@/app/archive/filters";

/**
 * Home search — the real archive search
 * console, wired in NAVIGATE mode: the box does not filter a
 * list on the page (Home has none), it *arrives at the archive with the query*.
 *
 *   - book              → /book/[slug]          (open the book directly)
 *   - podcast              → /archive/podcasts/[slug](#ep-…)  (show page or episode deep link)
 *   - faction              → /compendium/factions?focus=[id]  (faction directory + popup)
 *   - primarch             → /compendium/primarchs?focus=[id] (primarch directory + popup)
 *   - character            → /compendium/characters?focus=[id] (character directory + popup)
 *   - world                → /compendium/worlds?focus=[id] (world directory + popup)
 *   - facet/format         → /archive?<param>=…   (land in the archive, pre-filtered)
 *   - author / raw Enter   → /archive?q=…          (land in the archive, searched)
 *   - empty Enter          → /archive              (open the unfiltered archive)
 *
 * The grouped typeahead is fed by the same lazily-fetched index /archive uses
 * (books + podcasts, via /api/search-index), so the suggestions are live and
 * identical. The combobox mechanics (and the index fetch) live in the shared
 * console; this wrapper only supplies the routing.
 */
export default function HomeSearch() {
  // Every pick navigates through the shared transition so the click→stream gap
  // lights the global beam + this console's inline pending state, instead of
  // sitting dead until the target paints. `pendingVisible` is the anti-flash-
  // gated signal; `aria-busy` inside <BrowseSearch> still tracks raw pending.
  const { navigate } = useRouteNav();
  const { pendingVisible } = useRouteNavState();
  const [q, setQ] = useState("");

  /** Land on /archive with a single param set (or unfiltered when empty). */
  function toWerke(key: string | null, value: string): void {
    if (!key || !value) {
      navigate("/archive");
      return;
    }
    const sp = new URLSearchParams();
    sp.set(key, value);
    navigate(`/archive?${sp.toString()}`);
  }

  function onPick(s: Suggestion): void {
    switch (s.kind) {
      case "book":
        // A book pick is intercepted by the root @modal slot, so the overlay
        // mounts ON TOP of a still-mounted Home. Consume the draft (as
        // WerkeFilters does) so when the overlay closes and focus returns to
        // this input, onFocus doesn't reopen the dropdown over the dismissed book.
        setQ("");
        navigate(`/book/${s.value}`);
        break;
      case "podcast":
        // Episodes deep-link to `#ep-<id>` on the show page; shows to the page
        // itself. Both leave Home for /podcasts, so just navigate to `href`.
        if (s.href) {
          setQ("");
          navigate(s.href);
        }
        break;
      case "faction":
        // A faction pick lands in the Compendium's faction directory and pops the
        // faction overlay on top of it: the compendium page reads `focus` and
        // soft-navs to /faction/<id>, which the root @modal intercept turns into
        // the in-context popup (books AND podcasts) — identical to clicking a row
        // there. Closing the popup leaves the visitor in the browsable list, not
        // back on Home. Consume the draft like the book pick.
        setQ("");
        navigate(factionFocusHref(s.value));
        break;
      case "primarch":
        // Same shape as the faction pick: land in the Compendium primarch
        // directory with the primarch's overlay popped open (books AND podcasts,
        // and for the merged Alpha Legion twins the union of both). The popup's
        // Back leaves the visitor in the browsable primarch list.
        setQ("");
        navigate(primarchFocusHref(s.value));
        break;
      case "character":
        setQ("");
        navigate(characterFocusHref(s.value));
        break;
      case "world":
        setQ("");
        navigate(worldFocusHref(s.value));
        break;
      case "facet":
        toWerke("facet", s.value);
        break;
      case "format":
        toWerke("format", s.value);
        break;
      case "author":
        toWerke("q", s.value);
        break;
    }
  }

  function onSubmit(query: string): void {
    toWerke(query ? "q" : null, query);
  }

  return (
    <div className="hub-search">
      <BrowseSearch
        value={q}
        onValueChange={setQ}
        onPick={onPick}
        onSubmit={onSubmit}
        onClear={() => setQ("")}
        pending={pendingVisible}
        placeholder="Search the archive — a title, author or faction…"
        ariaLabel="Search the archive"
      />
    </div>
  );
}
