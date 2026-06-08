"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BrowseSearch from "@/components/browse/BrowseSearch";
import type { Suggestion } from "@/app/werke/filters";

/**
 * Home search (Brief 121) — the real archive search console (design-language
 * §5.2), in its cyan skin, wired in NAVIGATE mode: the box does not filter a
 * list on the page (Home has none), it *arrives at the archive with the query*.
 *
 *   - book              → /buch/[slug]          (open the book directly)
 *   - podcast              → /podcasts/[slug](#ep-…)  (show page or episode deep link)
 *   - faction/facet/format → /werke?<param>=…   (land in the archive, pre-filtered)
 *   - author / raw Enter   → /werke?q=…          (land in the archive, searched)
 *   - empty Enter          → /werke              (open the unfiltered archive)
 *
 * The grouped typeahead is fed by the same server-built `index` /werke uses
 * (books + podcasts), so the suggestions are live and identical. The combobox
 * mechanics live in the shared console; this wrapper only supplies the routing.
 */
export default function HomeSearch({ index }: { index: Suggestion[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  /** Land on /werke with a single param set (or unfiltered when empty). */
  function toWerke(key: string | null, value: string): void {
    if (!key || !value) {
      router.push("/werke");
      return;
    }
    const sp = new URLSearchParams();
    sp.set(key, value);
    router.push(`/werke?${sp.toString()}`);
  }

  function onPick(s: Suggestion): void {
    switch (s.kind) {
      case "book":
        // A book pick is intercepted by the root @modal slot, so the overlay
        // mounts ON TOP of a still-mounted Home. Consume the draft (as
        // WerkeFilters does) so when the overlay closes and focus returns to
        // this input, onFocus doesn't reopen the dropdown over the dismissed book.
        setQ("");
        router.push(`/buch/${s.value}`);
        break;
      case "podcast":
        // Episodes deep-link to `#ep-<id>` on the show page; shows to the page
        // itself. Both leave Home for /podcasts, so just navigate to `href`.
        if (s.href) {
          setQ("");
          router.push(s.href);
        }
        break;
      case "faction":
        toWerke("faction", s.value);
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
      <span className="hub-search__kicker" aria-hidden>
        {"// SCAN · LIBRORVM"}
      </span>
      <BrowseSearch
        index={index}
        value={q}
        onValueChange={setQ}
        onPick={onPick}
        onSubmit={onSubmit}
        onClear={() => setQ("")}
        placeholder="Search the archive — a title, author or faction…"
        ariaLabel="Search the archive"
      />
    </div>
  );
}
