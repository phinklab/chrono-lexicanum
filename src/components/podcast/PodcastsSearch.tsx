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
 * Archive-wide search on podcast pages. `BrowseSearch` owns the combobox and
 * unified book/podcast index; this wrapper only maps results to book, podcast,
 * compendium or filtered Archive routes. It renders bare inside the shared
 * Archive console so Works/Podcasts toggling keeps the same geometry.
 */
export default function PodcastsSearch() {
  // Shared nav transition (see HomeSearch) so a pick lights the global beam +
  // this console's inline pending state through the click→stream gap.
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
        // Consume the draft so onFocus doesn't reopen the dropdown when focus
        // returns here after the book overlay closes (matches Home/WerkeFilters).
        setQ("");
        navigate(`/book/${s.value}`);
        break;
      case "podcast":
        if (s.href) {
          setQ("");
          navigate(s.href);
        }
        break;
      case "faction":
        // Leave /podcasts for the faction hub (books AND podcasts), opened as a
        // popup over the Compendium faction directory — same as Home.
        setQ("");
        navigate(factionFocusHref(s.value));
        break;
      case "primarch":
        // Leave /podcasts for the primarch hub (books AND podcasts; union of the
        // merged twins), opened as a popup over the Compendium primarch directory.
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
    <BrowseSearch
      value={q}
      onValueChange={setQ}
      onPick={onPick}
      onSubmit={onSubmit}
      onClear={() => setQ("")}
      pending={pendingVisible}
      placeholder="Search the archive: a book, podcast or faction…"
      ariaLabel="Search books and podcasts"
    />
  );
}
