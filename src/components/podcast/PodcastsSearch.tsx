"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BrowseSearch from "@/components/browse/BrowseSearch";
import type { Suggestion } from "@/app/werke/filters";

/**
 * Podcast-page search (Brief 132) — the same archive-wide console Home and
 * /werke mount, here on /podcasts in its gold skin and wired in NAVIGATE mode.
 * The index is the unified book + podcast set, so a query surfaces books first,
 * then a "Podcasts" group (episodes + shows). Routing:
 *
 *   - book                 → /buch/[slug]          (opens the book modal here)
 *   - podcast              → s.href                 (show page, or #ep-<id> deep link)
 *   - faction/facet/format → /werke?<param>=…       (land in the archive, pre-filtered)
 *   - author / raw Enter   → /werke?q=…             (land in the archive, searched)
 *   - empty Enter          → /werke                 (open the unfiltered archive)
 *
 * The combobox mechanics live in the shared `<BrowseSearch>`; this wrapper only
 * supplies the routing + the gold-skinned `.pod-search` chrome.
 */
export default function PodcastsSearch({ index }: { index: Suggestion[] }) {
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
        // Consume the draft so onFocus doesn't reopen the dropdown when focus
        // returns here after the book overlay closes (matches Home/WerkeFilters).
        setQ("");
        router.push(`/buch/${s.value}`);
        break;
      case "podcast":
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
    <div className="pod-search">
      <span className="pod-search__kicker" aria-hidden>
        {"// SCAN · VOX ET LIBRORVM"}
      </span>
      <BrowseSearch
        index={index}
        value={q}
        onValueChange={setQ}
        onPick={onPick}
        onSubmit={onSubmit}
        onClear={() => setQ("")}
        placeholder="Search the archive — a book, podcast or faction…"
        ariaLabel="Search books and podcasts"
      />
    </div>
  );
}
