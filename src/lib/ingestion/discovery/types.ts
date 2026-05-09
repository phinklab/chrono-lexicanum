/**
 * Pipeline V2 — discovery adapters.
 *
 * Both V2 discovery modules (Wikipedia + TLBranson) emit `DiscoveredBook`
 * (defined in `../v2/types.ts`). This adapter file converts the legacy
 * `WikipediaBookEntry` shape into `DiscoveredBook` so V1 Wikipedia parsing
 * stays unchanged.
 */
import { slugify } from "@/lib/slug";

import type { WikipediaBookEntry } from "../types";
import type { DiscoveredBook } from "../v2/types";

export function wikipediaEntryToDiscovered(
  entry: WikipediaBookEntry,
): DiscoveredBook {
  const slug = slugify(entry.title);

  // Use the Wikipedia *page name* as the seriesHint, not the section anchor.
  // The page name is much more identifying ("Horus_Heresy_(novels)" maps to
  // the HH series anchor; section anchors like "Titles" / "Novel_series" are
  // generic and don't carry series identity). Section anchor is preserved
  // appended in parens when present.
  const url = entry.sourcePage;
  const noHash = url.replace(/#.*$/, "");
  const pageNameMatch = /\/wiki\/([^/?#]+)/.exec(noHash);
  let seriesHint: string | undefined;
  if (pageNameMatch) {
    const pageName = decodeURIComponent(pageNameMatch[1]).replace(/_/g, " ");
    // Drop trailing "(novels)" / "(novel)" annotations the page-name carries
    // for disambiguation — they don't help anchor matching.
    const cleaned = pageName.replace(/\s*\((?:novels?|series)\)\s*$/i, "").trim();
    seriesHint = cleaned || pageName;
  }

  return {
    slug,
    title: entry.title,
    releaseYear: entry.releaseYear,
    authorHint: entry.author,
    seriesHint,
    seriesIndex: entry.seriesIndex,
    sourcePages: [entry.sourcePage],
    discoverySources: ["wikipedia"],
  };
}
